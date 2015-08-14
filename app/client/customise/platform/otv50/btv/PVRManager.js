/**
 * Singleton instance to assist in PVR functionality. The class wraps up the complexity
 * of requesting/stopping series, event and timed recordings offering a call back to
 * update the user interface once recordings have been set. The PVRManager
 * employs the help of the conflict manager to provide basic recording request conflict
 * resolutions, the init method allows the conflict manager to be replaced by a custom class
 * that conforms to the same interface. The meta-data associated to recordings has been
 * extended to allow bookmarks on content, plus additional data like name and lock. There are
 * also many methods defined such as isEventRecording to simplify the logic of the client
 * application
 * @class $N.platform.btv.PVRManager
 * @requires $N.data.Recording
 * @requires $N.platform.btv.ConflictManager
 * @requires $N.platform.btv.RecordingFactory
 * @requires $N.platform.btv.EPG
 * @requires $N.platform.system.Preferences
 * @requires $N.apps.util.JSON
 * @requires $N.apps.core.Log
 * @requires $N.platform.btv.ConflictManager
 * @singleton
 */
/*global CCOM*/

var $N = $N || {};
$N.platform = $N.platform || {};
$N.platform.btv = $N.platform.btv || {};

$N.platform.btv.PVRManager = (function () {

	var log = new $N.apps.core.Log("btv", "PVRManager"),
		WHPVRManager = $N.platform.btv.WHPVRManager,
		conflictManager,
		emptyFunction = function () {},
		uIRefreshCallback = emptyFunction,
		taskAboutToStartCallback = emptyFunction,
		taskAboutToStartConflictCallback = emptyFunction,
		recordingRequestFailedCallback = emptyFunction,
		recordingRequestOKCallback = emptyFunction,
		recordingRequestConflictsCallback = emptyFunction,
		taskChangedConflictCallback = emptyFunction,
		defaultPadding = 0,
		uiRefreshListeners = [],
		recordingsReturnOrder,
		addJobId = null,
		contentModifiedListener,
		mapFolder,
		getAdditionalInfoFromRequest,
		tasksChangedListener,
		tasksModifiedListener,
		taskStoppedOKListener,
		jobDeletedOKListener,
		diskSpaceWarningListener,
		taskStoppedListener,
		taskStartedListener,
		taskAboutToStartListener,
		addJobOKListener,
		addJobFailedListener,
		addTaskFailedListener,
		addJobCompletedListener,
		eventListeners = {},
		LOCAL_RECORDING_JOBS = "localRecordingJobs/",

		REC_COUNT = 20,

		TASK_TYPE = {
			REMINDER: "GRMDR",
			RECORDING: "REC",
			REBOOT: "REBOOT"
		},

		PLAYBACK_STATE = {
			UNPLAYED_UNBLOCKED: 0,
			PLAYED_UNBLOCKED: 1,
			UNPLAYED_BLOCKED: 2,
			PLAYED_BLOCKED: 3
		},

		JOB_TYPE = {
			SINGLE: "ONE_TIME",
			REPEAT: "RPT_TIME",
			EVENT: "ONE_EVT",
			SERIES: "SERIES",
			SEARCH: "SEARCH"
		},

	/* Current processing state */
		OBJECT_STATE = {
			BOOKED: 0,
			PROCESSING: 1,
			SUSPEND_PROCESSING: 2,
			STOP_PROCESSING: 3,
			PROCESSED: 4,
			FINAL: 5,
			ERROR: 6,
			DELETING: 7,
			DELETED: 8
		},

		COMPLETION_STATUS_INVALID,
		COMPLETION_STATUS_NONE,
		COMPLETION_STATUS_PARTIAL,
		COMPLETION_STATUS_FULL,

		WIDE_JOB_FIELD_FILTER = "netDirector, jobOpState, netOriginalName, sourceURL, softPrepaddingDuration, taskType, contentDesc, timeOfDay, endTime, netEventGenres, netDisplaySeasonEpisode, netActorCast, startTime, bookmark, uiFolder, keep, duration, netProdYear, serviceId, type, eventId, objectState, title_user, netEpisodeName, netCountry, repeatDaysArray, jobId, netServiceName, scheduleType, playable, PlayedBlocked, title, extraInfo, softPostpaddingDuration",
		WIDE_TASK_FIELD_FILTER = "parentalRating, serviceId, netEpisodeName, title_user, scheduleType, taskId, netServiceName, objectState, netCountry, episodeId, type, seasonId, eventId, netDirector, netActorCast, shortDesc, extraInfo, netEventGenres, netDisplaySeasonEpisode, endTime, netOriginalName, softPostpaddingDuration, playable, completeStatus, unscheduled, actualStartTime, inactive, duration, contentDesc, actualStopTime, uiFolder, jobId, isAuthorized, taskType, sourceURL, mediumID, softPrepaddingDuration, netProdYear, longDesc, title, PlayedBlocked, seriesName, actualDuration, bookmark, keep, seriesId, fulfillmentStatus, startTime, netEpisodeOriginalName",

		searchRecordingResult = [],
		searchRecordingCompleteCallback = function () {},
		searchRecordingDataCallback = function () {},

		recordingCache = {};

	/**
	 * Allows query of CCOM Tasks db using passed in fields, selection criteria and sort order
	 * @method getEntriesByQuery
	 * @param {String} fields the fields to be retrieved (the select clause). Default is * (all fields)
	 * @param {String} criteria the selection criteria (the where clause)
	 * @param {String} order the order by clause
	 * @return {Array} list of PVR tasks
	 */
	function getEntriesByQuery(fields, criteria, order) {
		log("getEntriesByQuery", "Enter");
		fields = fields || WIDE_TASK_FIELD_FILTER;
		order = order || "startTime";
		var resultSet = CCOM.MediaLibrary.getEntryRSByQuery(fields, criteria, "Tasks", order);
		log("getEntriesByQuery", "Exit");
		return getArrayFromResultSet(resultSet);
	}

	/**
	 * Returns an array containing ONLY scheduled and active tasks
	 * (objectState === BOOKED || objectState === PROCESSING)
	 * @method getRecordingsForCache
	 * @return {Array} An array of task objects.
	 * @private
	 */
	function getRecordingsForCache() {
		log("getRecordingsForCache", "Enter");
		var isInactive = "0",
			tasks =	getEntriesByQuery("taskId, eventId, taskOpState, scheduleType, objectState, taskType", "taskType='" + TASK_TYPE.RECORDING + "' AND (objectState<=" + String(OBJECT_STATE.PROCESSING) + ") AND inactive=" + isInactive, "startTime");
		log("getRecordingsForCache", "Exit");
		return tasks;
	}

	/**
	 * Determines if the given task is of type recording.
	 * @method isTaskObjectPVR
	 * @param {Object} task
	 * @return {Boolean} true if the task is an PVR object, false if otherwise
	 * @private
	 */
	function isTaskObjectPVR(task) {
		return task._data.taskType === TASK_TYPE.RECORDING;
	}

	/**
	 * @method refreshRecordingsCache
	 * @private
	 */
	function refreshRecordingsCache() {
		log("refreshRecordingsCache", "Enter");
		var tasks = getRecordingsForCache(),
			event = null,
			eventObject = null;

		recordingCache = {};

		tasks.forEach(function (task) {
			if (task && isTaskObjectPVR(task) && task.eventId) {
				event = $N.platform.btv.EPG.getEventById(task.eventId);
				eventObject = $N.platform.btv.EPGEventFactory.mapObject(event);
				if (eventObject && eventObject.uniqueEventId) {
					recordingCache[eventObject.uniqueEventId] = getStatusForTask(task);
				}
			}
		});
		log("refreshRecordingsCache", "Exit");
	}

	/**
	 * @method updateEventCallback
	 * @private
	 */
	function updateEventCallback(event, parameters) {
		log("updateEventCallback", "Enter");
		if (eventListeners[event]) {
			eventListeners[event].forEach(function (listener) {
				listener(event, parameters);
			});
		}
		log("updateEventCallback", "Exit");
	}

	/**
	 * Extracts all results from a result set and returns them as an array.
	 * @method getArrayFromResultSet
	 * @private
	 */
	function getArrayFromResultSet(resultSet) {
		log("getArrayFromResultSet", "Enter");
		var rsArray,
			returnArray = [],
			i,
			len,
			taskObject = null,
			event = null,
			eventObject = null;

		if (!resultSet.error) {
			rsArray = resultSet.getNext(REC_COUNT);
			while (rsArray && rsArray.length) {
				len = rsArray.length;
				log("getArrayFromResultSet", "Processing " + String(len) + " records...");
				for (i = 0; i < len; i++) {
					taskObject = $N.platform.btv.RecordingFactory.mapObject(rsArray[i]);
					//log("getArrayFromResultSet", "TaskId = " + taskObject.taskId + " event = " + taskObject.eventId + " status = " + taskObject._data.objectState);
					if (taskObject && isTaskObjectPVR(taskObject) && taskObject.eventId) {
						event = $N.platform.btv.EPG.getEventById(taskObject.eventId);
						if (event) {
							eventObject = $N.platform.btv.EPGEventFactory.mapObject(event);
							if (eventObject && eventObject.uniqueEventId) {
								recordingCache[eventObject.uniqueEventId] = getStatusForTask(taskObject);
							}
						}
					}
					returnArray.push(taskObject);
				}
				if (len < REC_COUNT) {
					log("getArrayFromResultSet", "No more results");
					rsArray = null;
				} else {
					log("getArrayFromResultSet", "More results getting next set of records...");
					rsArray = resultSet.getNext(REC_COUNT);
				}
			}
			log("getArrayFromResultSet", "Resetting ResultsSet");
			resultSet.reset();
			resultSet = null;
		} else {
			log("getArrayFromResultSet", "error : " + resultSet.error.message);
		}
		log("getArrayFromResultSet", "Exit - returnArray length = " + String(returnArray.length));
		return returnArray;
	}

	/**
	 * Extracts the first result from a result set and returns it as an object.
	 * @method getObjectFromResultSet
	 * @private
	 */
	function getObjectFromResultSet(resultSet) {
		log("getObjectFromResultSet", "Enter");

		var results,
			rsObject = null;
		if (!resultSet.error) {
			results = resultSet.getNext(1);
			if (results[0]) {
				rsObject = results[0];
			}
			resultSet.reset();
			resultSet = null;
		} else {
			log("getObjectFromResultSet", "error : " + resultSet.error.message);
		}
		log("getObjectFromResultSet", "Exit");
		return rsObject;
	}

	/**
	 * Determines if the given task is scheduled.
	 * @method isTaskObjectScheduled
	 * @param {Object} task
	 * @return {Boolean} true if the task is a scheduled recording, false if otherwise
	 * @private
	 */
	function isTaskObjectScheduled(task) {
		if (task && task._data && task._data.objectState === OBJECT_STATE.BOOKED) {
			return true;
		}
		return false;
	}

	/**
	 * Determines if the passed task object is currently active.
	 * @method isTaskObjectActive
	 * @param {Object} task
	 * @return {Boolean} true if the task is an active recording, false if otherwise
	 * @private
	 */
	function isTaskObjectActive(task) {
		if (task && task._data) {
			log("isTaskObjectActive", "Enter - task._data.objectState = " + String(task._data.objectState));
			if (task._data.objectState === OBJECT_STATE.PROCESSING) {
				log("isTaskObjectActive", "Exit true");
				return true;
			}
		}

		log("isTaskObjectActive", "Exit false");
		return false;
	}

	/**
	 * Returns true if the passed task object is currently suspended. This means the task
	 * should be active but is not recording because of no signal or a similar problem.
	 * @method isTaskObjectSuspended
	 * @param {Object} task
	 * @return {boolean} true if the task is an suspended recording, false if otherwise
	 * @private
	 */
	function isTaskObjectSuspended(task) {
		if (task && task._data) {
			log("isTaskObjectSuspended", "Enter - task._data.objectState = " + String(task._data.objectState));
			if (task._data.objectState === OBJECT_STATE.SUSPEND_PROCESSING) {
				log("isTaskObjectSuspended", "Exit true");
				return true;
			}
		}

		log("isTaskObjectSuspended", "Exit false");
		return false;
	}

	/**
	 * Determines if the passed task object is a partial recording.
	 * @method isTaskObjectPartial
	 * @param {Object} task
	 * @return {Boolean} true if the task is a partial recording, false if otherwise
	 * @private
	 */
	function isTaskObjectPartial(task) {
		if (task && task._data) {
			if (task._data.completeStatus  === COMPLETION_STATUS_PARTIAL) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Determines if the passed task object is a complete recording.
	 * @method isTaskObjectComplete
	 * @param {Object} task
	 * @return {Boolean} true if the task is a complete recording, false if otherwise
	 * @private
	 */
	function isTaskObjectComplete(task) {
		if (task && task._data) {
			if (task._data.completeStatus === COMPLETION_STATUS_FULL) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns the job associated with a job id.
	 * @method getJobById
	 * @param {String} jobId The job id
	 * @return {Object} The scheduler job
	 * @private
	 */
	function getJobById(jobId, sort) {
		log("getJobById", "Enter - jobId = " + jobId);
		if (!sort) {
			sort = "jobId DESC";
		}
		var resultSet = CCOM.Scheduler.getJobsRSByQuery(WIDE_JOB_FIELD_FILTER, "jobId='" + jobId + "'", sort),
			job = getObjectFromResultSet(resultSet);
		log("getJobById", "Exit");
		return job;
	}

	/**
	 * Returns the job for a scheduled event recording.
	 * @method getJobByEvent
	 * @param {String} eventId The event id
	 * @param {Boolean} true if need to sort the records in the ResultSet, false otherwise
	 * @param {Boolean} true if only get the recording job, false otherwise
	 * @return {Object} The scheduler job
	 * @private
	 */
	function getJobByEvent(eventId, sort, isRecordJob) {
		log("getJobByEvent", "Enter - eventId = " + eventId);
		if (!sort) {
			sort = "jobId DESC";
		}
		var criteria = isRecordJob ? "eventId='" + eventId + "' AND taskType='" + TASK_TYPE.RECORDING + "'" : "eventId='" + eventId + "'",
			resultSet = CCOM.Scheduler.getJobsRSByQuery(WIDE_JOB_FIELD_FILTER, criteria, sort),
			job = getObjectFromResultSet(resultSet);
		log("getJobByEvent", "Exit");
		return job;
	}

	/**
	 * Returns the job for a given service.
	 * @method getJobByService
	 * @param {String} serviceId The service id
	 * @param {Boolean} true if need to sort the records in the ResultSet, false otherwise
	 * @param {Boolean} true if only get the recording job, false otherwise
	 * @return {Object} The scheduler job
	 * @private
	 */
	function getJobByService(serviceId, sort, taskType) {
		log("getJobByEvent", "Enter - eventId = " + serviceId);
		if (!sort) {
			sort = "jobId DESC";
		}
		var criteria = taskType ? "serviceId='" + serviceId + "' AND taskType='" + taskType + "'" : "serviceId='" + serviceId + "'",
			resultSet = CCOM.Scheduler.getJobsRSByQuery(WIDE_JOB_FIELD_FILTER, criteria, sort),
			job = getObjectFromResultSet(resultSet);
		log("getJobByEvent", "Exit");
		return job;
	}

	/**
	 * Returns the job for a scheduled event based on the queryString.
	 * @method getJobByQuery
	 * @param {String} queryString The queryString
	 * @return {Object} The scheduler job
	 * @private
	 */
	function getJobByQuery(queryString, sort, fields) {
		log("getJobByQuery", "Enter - queryString = " + queryString);
		if (!sort) {
			sort = "jobId DESC";
		}
		var resultSet = CCOM.Scheduler.getJobsRSByQuery(fields || WIDE_JOB_FIELD_FILTER, queryString, sort),
			job = getArrayFromResultSet(resultSet);
		log("getJobByQuery", "Exit");
		return job;
	}

	/**
	 * Returns the task associated with a task id.
	 * @method getTaskById
	 * @param {String} taskId The task id
	 * @param {String} - optional - fields - the SQL fields to include
	 * @param {Boolean} - optional - includeActiveRecordingsOnly - if true adds 'inactive = 0' to the query including active recording only
	 * @return {Object} The scheduler task
	 * @private
	 */
	function getTaskById(taskId, fields, includeActiveRecordingsOnly) {
		log("getTaskById", "Enter - taskId = " + taskId);
		includeActiveRecordingsOnly = (includeActiveRecordingsOnly === undefined) ? true : includeActiveRecordingsOnly;
		fields = fields || WIDE_TASK_FIELD_FILTER;
		var query = "taskId='" + String(taskId) + "'",
			resultSet,
			task,
			objectFromResultSet;
		if (includeActiveRecordingsOnly) {
			query += " AND inactive = 0";
		}
		resultSet = CCOM.Scheduler.getTasksRSByQuery(fields, query, "startTime");
		objectFromResultSet = getObjectFromResultSet(resultSet);
		task = $N.platform.btv.RecordingFactory.mapObject(objectFromResultSet);
		log("getTaskById", "Exit");
		return task;
	}

	/**
	 * Returns the task associated with a task id.
	 * @method getAllTimedReminders
	 * @param {String} taskId The task id
	 * @return {Object} The scheduler task
	 * @private
	 */
	function getAllTimedReminders(condition, fields) {
		log("getAllTimedReminders", "Enter");
		var resultSet,
			job,
			queryString;
		if (condition) {
			queryString = "taskType='" + TASK_TYPE.REMINDER + "' AND " + condition;
		} else {
			queryString = "taskType='" + TASK_TYPE.REMINDER;
		}
		resultSet = CCOM.Scheduler.getJobsRSByQuery(fields || WIDE_JOB_FIELD_FILTER, queryString, "startTime");
		job = getArrayFromResultSet(resultSet);
		log("getAllTimedReminders", "Exit");
		return job;
	}

	/**
	 * Returns the task associated with an event.
	 * @method getTaskByEvent
	 * @param {String} eventId The event id
	 * @param {Boolean} true if need to sort the records in the ResultSet, false otherwise
	 * @param {String} fields indicate task properties should be retrieved
	 * @param {Boolean} true if only get the recording task, false otherwise
	 * @return {Object} The scheduler task
	 * @private
	 */
	function getTaskByEvent(eventId, sort, fields, isRecordJob) {
		log("getTaskByEvent", "Enter - eventId = " + eventId);
		if (!sort) {
			sort = "taskId DESC";
		}
		var isInactive = 0,
			criteria = isRecordJob ? "eventId='" + eventId + "' AND taskType='" + TASK_TYPE.RECORDING + "' AND inactive=" + isInactive : "eventId='" + eventId + "' AND inactive=" + isInactive,
			resultSet = CCOM.Scheduler.getTasksRSByQuery(fields || WIDE_TASK_FIELD_FILTER, criteria, sort),
			task = $N.platform.btv.RecordingFactory.mapObject(getObjectFromResultSet(resultSet));
		log("getTaskByEvent", "Exit");
		return task;
	}

	/**
	 * Returns the task associated with service.
	 * @method getTaskByService
	 * @param {String} serviceId The service id
	 * @param {Boolean} true if need to sort the records in the ResultSet, false otherwise
	 * @param {String} fields indicate task properties should be retrieved
	 * @param {String} task type
	 * @return {Object} The scheduler task
	 * @private
	 */
	function getTaskByService(serviceId, sort, fields, taskType) {
		log("getTaskByService", "Enter - eventId = " + serviceId);
		if (!sort) {
			sort = "taskId DESC";
		}
		var isInactive = 0,
			criteria = taskType ? "serviceId='" + serviceId + "' AND taskType='" + taskType + "' AND eventId IS NULL" : "serviceId='" + serviceId + "' AND inactive=" + isInactive,
			resultSet = CCOM.Scheduler.getTasksRSByQuery(fields || WIDE_TASK_FIELD_FILTER, criteria, sort),
			task = $N.platform.btv.RecordingFactory.mapObject(getObjectFromResultSet(resultSet));
		log("getTaskByService", "Exit");
		return task;
	}

	/**
	 * Returns the task array associated with service.
	 * @method getTaskArrayByService
	 * @param {String} serviceId The service id
	 * @param {Boolean} true if need to sort the records in the ResultSet, false otherwise
	 * @param {String} fields indicate task properties should be retrieved
	 * @param {String} task type
	 * @return {Object} The scheduler task
	 * @private
	 */
	function getTaskArrayByService(serviceId, sort, fields, taskType) {
		log("getTaskArrayByService", "Enter - eventId = " + serviceId);
		if (!sort) {
			sort = "taskId DESC";
		}
		var isInactive = 0,
			criteria = taskType ? "serviceId='" + serviceId + "' AND taskType='" + taskType + "' AND eventId IS NULL" : "serviceId='" + serviceId + "' AND inactive=" + isInactive,
			resultSet = CCOM.Scheduler.getTasksRSByQuery(WIDE_TASK_FIELD_FILTER, criteria, sort),
			task = getArrayFromResultSet(resultSet);
		log("getTaskArrayByService", "Exit");
		return task;
	}

	function getScheduledReminderByEvent(eventId) {
		log("getScheduledReminderByEvent", "Enter - eventId = " + eventId);
		var resultSet = CCOM.Scheduler.getTasksRSByQuery(WIDE_TASK_FIELD_FILTER, "eventId='" + eventId + "' AND taskType='" + TASK_TYPE.REMINDER + "' AND objectState=" + String(OBJECT_STATE.BOOKED), "startTime"),
			task = $N.platform.btv.RecordingFactory.mapObject(getObjectFromResultSet(resultSet));
		log("getScheduledReminderByEvent", "Exit");
		return task;
	}

	function getScheduledReminderByStartTime(startTime) {

		var resultSet = CCOM.Scheduler.getTasksRSByQuery(WIDE_TASK_FIELD_FILTER, "startTime='" + startTime + "' AND taskType='" + TASK_TYPE.REMINDER + "' AND objectState<" + String(OBJECT_STATE.ERROR), "startTime"),
			tasks = getArrayFromResultSet(resultSet);

		return tasks;
	}	/**
	 * Returns an array of tasks allocated to a job.
	 * @method getTasksForJob
	 * @param {String} jobId The job id.
	 * @return {Array} An array of task objects.
	 * @private
	 */
	function getTasksForJob(jobId) {
		log("getTasksForJob", "Enter - jobId = " + jobId);
		var isInactive = 0,
			resultSet = CCOM.Scheduler.getTasksRSByQuery(WIDE_TASK_FIELD_FILTER, "jobId='" + jobId + "' AND inactive=" + isInactive, "startTime"),
			tasks = getArrayFromResultSet(resultSet);
		log("getTasksForJob", "Exit");
		return tasks;
	}

	/**
	 * Retrieves a list of tasks for a given status
	 * @method getRecordingsByStatus
	 * @private
	 * @param {Number} status desired task status
	 * @return {Array} a list of tasks
	 */
	function getRecordingsByStatus(status) {
		log("getRecordingsByStatus", "Enter");
		var isInactive = "0",
			resultSet = CCOM.Scheduler.getTasksRSByQuery(WIDE_TASK_FIELD_FILTER, "taskType='" + TASK_TYPE.RECORDING + "' AND objectState=" + String(status) + " AND inactive=" + isInactive, "startTime"),
			tasks = getArrayFromResultSet(resultSet);
		log("getRecordingsByStatus", "Exit");
		return tasks;
	}

	/**
	 * Gets all series recordings that match a given completion status, or every series recording
	 * if no status is passed in
	 * @method getSeriesRecordingsByStatus
	 * @private
	 * @param [Number] completionStatus recording status. One of TaskStatus values. If nothing is
	 * passed in, returns all series recordings
	 * @return {Array} a list of all matching recordings
	 */
	function getSeriesRecordingsByStatus(completionStatus) {
		log("getSeriesRecordingsByStatus", "Enter");
		var condition = "",
			resultSet,
			tasks,
			TaskStatus = $N.platform.btv.PVRManager.TaskStatus,
			isInactive = "0";

		if (completionStatus) {
			if (completionStatus === TaskStatus.TASK_STATUS_SCHEDULED) {
				condition = " AND objectState=" + String(OBJECT_STATE.BOOKED);
			} else {
				if (completionStatus === TaskStatus.TASK_STATUS_COMPLETED) {
					condition = " AND completeStatus=" + String(COMPLETION_STATUS_FULL);
				} else if (completionStatus === TaskStatus.TASK_STATUS_PARTIAL) {
					condition = " AND completeStatus=" + String(COMPLETION_STATUS_PARTIAL);
				}
				condition += " AND (objectState=" + String(OBJECT_STATE.PROCESSED) + " OR objectState=" + String(OBJECT_STATE.FINAL) + ")";
			}
		} else {
			condition += " AND objectState<" + String(OBJECT_STATE.ERROR);
		}
		condition += " AND inactive=" + isInactive;
		resultSet = CCOM.Scheduler.getTasksRSByQuery(WIDE_TASK_FIELD_FILTER, "taskType='" + TASK_TYPE.RECORDING + "' AND scheduleType='" + JOB_TYPE.SERIES + "'" + condition, "startTime");
		tasks = getArrayFromResultSet(resultSet);
		log("getSeriesRecordingsByStatus", "Exit");
		return tasks;
	}


	/**
	 * Returns an array of scheduled tasks allocated to a job.
	 * @method getScheduledTasksForJob
	 * @param {String} jobId The job id.
	 * @return {Array} An array of task objects.
	 * @private
	 */
	function getScheduledTasksForJob(jobId) {
		log("getScheduledTasksForJob", "Enter");
		var isInactive = 0,
			resultSet = CCOM.Scheduler.getTasksRSByQuery(WIDE_TASK_FIELD_FILTER, "taskType='" + TASK_TYPE.RECORDING + "' AND jobId='" + jobId + "' AND inactive=" + isInactive, "startTime"),
			tasks = getArrayFromResultSet(resultSet);
		log("getScheduledTasksForJob", "Exit");
		return tasks;
	}

	/**
	 * Returns an array of all scheduled tasks.
	 * @method getScheduledTasks
	 * @return {Array} An array of task objects.
	 * @private
	 */
	function getScheduledTasks() {
		log("getScheduledTasks", "Enter");
		var isInactive = 0,
			resultSet = CCOM.Scheduler.getTasksRSByQuery(WIDE_TASK_FIELD_FILTER, "taskType='" + TASK_TYPE.RECORDING + "' AND (objectState<" + String(OBJECT_STATE.PROCESSED) + ") AND inactive=" + isInactive, "startTime"),
			tasks = getArrayFromResultSet(resultSet);
		log("getScheduledTasks", "Exit");
		return tasks;
	}

	/**
	 * Returns an array of all scheduled but not active tasks.
	 * @method getScheduledAndNotActiveTasks
	 * @return {Array} An array of task objects.
	 * @private
	 */
	function getScheduledAndNotActiveTasks() {
		log("getSchedulegetScheduledAndNotActiveTasks", "Enter");
		log("getSchedulegetScheduledAndNotActiveTasks", "Exit");
		return getRecordingsByStatus(OBJECT_STATE.BOOKED);
	}

	/**
	 * Returns an array of all active tasks.
	 * @method getActiveTasks
	 * @return {Array} An array of task objects.
	 * @private
	 */
	function getActiveTasks() {
		log("getActiveTasks", "Enter");
		log("getActiveTasks", "Exit");
		return getRecordingsByStatus(OBJECT_STATE.PROCESSING);
	}

	/**
	 * Returns an array of all recording and recorded tasks.
	 * @method getAllRecordTasks
	 * @return {Array} An array of task objects.
	 * @private
	 */
	function getAllRecordTasks() {
		log("getAllRecordTasks", "Enter");
		var tasks =	getEntriesByQuery("WIDE_TASK_FIELD_FILTER", "taskType='" + TASK_TYPE.RECORDING + "' AND (objectState=" + String(OBJECT_STATE.PROCESSING) + " OR objectState=" + String(OBJECT_STATE.PROCESSED) + " OR objectState=" + String(OBJECT_STATE.FINAL) + ")", "startTime");
		log("getAllRecordTasks", "Exit");
		return tasks;
	}

	/**
	 * Returns an array of all scheduled, active and recorded tasks (including partials)
	 * ONLY deleted and error tasks are NOT shown.
	 * @method getAllRecordings
	 * @return {Array} An array of task objects.
	 * @private
	 */
	function getAllRecordings() {
		log("getAllRecordings", "Enter");
		var isInactive = "0",
			tasks =	getEntriesByQuery("WIDE_TASK_FIELD_FILTER", "taskType='" + TASK_TYPE.RECORDING + "' AND (objectState<" + String(OBJECT_STATE.ERROR) + ") AND inactive=" + isInactive, "startTime");
		log("getAllRecordings", "Exit");
		return tasks;
	}

	/**
	 * Returns an array of all tasks that are of type timed recording
	 * i.e. scheduleType = ONE_TIME or RPT_TIME
	 * @method getTimedTasks
	 * @private
	 * @return {Array} An array of task objects
	 */
	function getTimedTasks() {
		log("getTimedTasks", "Enter");
		var tasks =	getEntriesByQuery("WIDE_TASK_FIELD_FILTER", "taskType='" + TASK_TYPE.RECORDING + "' AND objectState<" + String(OBJECT_STATE.ERROR) + " AND (scheduleType='" + JOB_TYPE.SINGLE + "' OR scheduleType='" + JOB_TYPE.REPEAT + "')", "startTime");
		log("getTimedTasks", "Exit");
		return tasks;
	}

	function getPartialRecordings() {
		log("getPartialRecordings", "Enter");
		var recordings = getEntriesByQuery("WIDE_TASK_FIELD_FILTER", "taskType='" + TASK_TYPE.RECORDING + "' AND completeStatus=" + String(COMPLETION_STATUS_PARTIAL) + " AND (objectState=" + String(OBJECT_STATE.PROCESSED) + " OR objectState=" + String(OBJECT_STATE.FINAL) + ")", "startTime");
		log("getPartialRecordings(", "Exit");
		return recordings;
	}

	/**
	 * Returns a list of all fully recorded tasks
	 * @method getCompletedRecordings
	 * @private
	 * @return {Array} list of completed recordings
	 */
	function getCompletedRecordings() {
		log("getCompletedRecordings", "Enter");
		var orderBy = "startTime",
			recordings;

		switch (recordingsReturnOrder) {
		case $N.platform.btv.PVRManager.RecordingsReturnOrderType.BY_DATE:
			orderBy = "startTime";
			break;
		case $N.platform.btv.PVRManager.RecordingsReturnOrderType.BY_DATE_DESC:
			orderBy = "startTime DESC";
			break;
		case $N.platform.btv.PVRManager.RecordingsReturnOrderType.BY_NAME:
			orderBy = "case when seriesId is null then title else seriesId end";
			break;
		default:
			orderBy = "startTime";
			break;
		}

		recordings = getEntriesByQuery("WIDE_TASK_FIELD_FILTER", "taskType='" + TASK_TYPE.RECORDING + "' AND completeStatus=" + String(COMPLETION_STATUS_FULL) + " AND (objectState=" + String(OBJECT_STATE.PROCESSED) + " OR objectState=" + String(OBJECT_STATE.FINAL) + ")", orderBy);
		log("getCompletedRecordings(", "Exit");
		return recordings;
	}

	/**
	 * Executes the given listeners.
	 * @method executeListeners
	 * @private
	 * @param {Array} array of listeners to fire
	 * @param {Object} data to pass to listener call
	 */
	function executeListeners(listeners, data) {
		var i;
		for (i = 0; i < listeners.length; i++) {
			listeners[i].listener.call(listeners[i].callFunc, data);
		}
	}

	/**
	 * Returns an array of 7 elements that represent monday - sunday
	 * where monday is index 0. Value of true in the array represents a
	 * repeat recording for that day
	 * @method checkRepeatDaysArray
	 * @private
	 * @param {Array} array of boolean values
	 * @return {Array} An array of booleans 7 elements long.
	 */
	function checkRepeatDaysArray(daysArray) {
		var i,
			daysInAWeek = 7,
			repeatDaysArray = [],
			atLeastOneDayRepeated = false;
		// Make sure the array is boolean
		for (i = 0; i < daysInAWeek; i++) {
			repeatDaysArray[i] = (daysArray[i] && daysArray[i] === true);
			if (!atLeastOneDayRepeated && repeatDaysArray[i]) {
				atLeastOneDayRepeated = true;
			}
		}
		return atLeastOneDayRepeated ? repeatDaysArray : [];
	}

	/**
	 * Returns an array of 7 elements that represent monday - sunday
	 * where monday is index 0. Value of true in the array represents a
	 * repeat recording for that day. Array is populated depending on the given frequency.
	 * E.g. if frequency type is $N.platform.btv.PVRManager.Frequency.DAILY then an array of 7 elements with
	 * true values is returned
	 * @method getRepeatDaysArrayForFrequency
	 * @private
	 * @param {Number} frequency
	 * @param {Date} occurenceDate The date on which the weekly task will commence.
	 * @return {Array} An array of 7 boolean values
	 */
	function getRepeatDaysArrayForFrequency(frequency, occurrenceDate) {
		switch (frequency) {
		case $N.platform.btv.PVRManager.Frequency.DAILY:
			return [true, true, true, true, true, true, true];
		case $N.platform.btv.PVRManager.Frequency.WEEKLY:
			var todaysIndex = (occurrenceDate !== null ? occurrenceDate : new Date()).getDay() - 1,
				i,
				repeatDays = [];
			if (todaysIndex < 0) {
				todaysIndex = 6;
			}
			for (i = 0; i < 7; i++) {
				repeatDays.push(i === todaysIndex ? true : false);
			}
			return repeatDays;
		case $N.platform.btv.PVRManager.Frequency.WEEKDAYS:
			return [true, true, true, true, true, false, false];
		case $N.platform.btv.PVRManager.Frequency.WEEKENDS:
			return [false, false, false, false, false, true, true];
		default:
			return [];
		}
	}

	/**
	 * Returns the status of a recording task for the given task
	 * @private
	 * @method getStatusForTask
	 * @param {Object} task
	 * @return {Number} the status of the scheduled task referenced to the TaskStatus enum
	 */
	function getStatusForTask(task) {
		log("getStatusForTask", "Got task with ID: " + task.taskId + " " + task.recordingType);
		if (isTaskObjectActive(task)) {
			log("getStatusForTask", "Task is active");
			if (task.recordingType === $N.data.Recording.RECORDING_TYPE.SERIES) {
				log("getStatusForTask", "Returning status ACTIVE IN SERIES");
				return $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_ACTIVE_IN_SERIES;
			} else {
				log("getStatusForTask", "Returning status ACTIVE");
				return $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_ACTIVE;
			}
		}
		if (isTaskObjectScheduled(task)) {
			log("getStatusForTask", "Task is scheduled.");
			if (task.recordingType === $N.data.Recording.RECORDING_TYPE.SERIES) {
				log("getStatusForTask", "Returning status SCHEDULED BY SERIES");
				return $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_SCHEDULED_BY_SERIES;
			} else {
				log("getStatusForTask", "Returning status SCHEDULED");
				return $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_SCHEDULED;
			}
		}
		if (isTaskObjectPartial(task)) {
			log("getStatusForTask", "Returning status PARTIAL");
			return $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_PARTIAL;
		}

		if (isTaskObjectComplete(task)) {
			log("getStatusForTask", "Returning status COMPLETE");
			return $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_COMPLETED;
		}
		return $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_UNSCHEDULED;
	}

	function getTasksIdArrayFromTasksArray(tasks) {
		var i,
			tasksId = [],
			arrayLength = tasks.length;
		for (i = 0; i < arrayLength; i++) {
			tasksId[i] = tasks[i].taskId;
		}
		return tasksId;
	}

	/**
	 * Returns a list of all recordings for a given series
	 * @method getAllRecordingsForSeries
	 * @private
	 * @param {String} seriesId identifier for the series
	 * @return {Array} list of recordings
	 */
	function getAllRecordingsForSeries(seriesId) {
		if (seriesId) {
			var isInactive = 0,
				resultSet = CCOM.Scheduler.getTasksRSByQuery(WIDE_TASK_FIELD_FILTER, "seriesId='" + seriesId.replace("'", "''") + "' AND taskType='" + TASK_TYPE.RECORDING + "' AND objectState<>" + OBJECT_STATE.DELETED + " AND inactive=" + isInactive, 'startTime'),
				recordings = getArrayFromResultSet(resultSet);
			return recordings;
		}
		return [];
	}

	function getTasksByQuery(fields, criteria, order) {
		fields = fields || WIDE_TASK_FIELD_FILTER;
		order = order || "startTime";
		var resultSet = CCOM.Scheduler.getTasksRSByQuery(fields, criteria, order);
		return getArrayFromResultSet(resultSet);
	}

	function countTasksByQuery(criteria) {
		var resultSet = CCOM.Scheduler.getTasksRSByQuery("COUNT(*) as count", criteria, null),
			rsArray,
			taskCount = 0;

		if (!resultSet.error) {
			rsArray = resultSet.getNext(1);

			if (rsArray) {
				taskCount = rsArray[0].count;
			}
			log("countTasksByQuery", "Resetting ResultsSet");
		} else {
			log("countTasksByQuery", "error : " + resultSet.error.message);
		}
		if (resultSet) {
			resultSet.reset();
			resultSet = null;
		}
		log("countTasksByQuery", "Returning, taskCount = " + taskCount);
		return taskCount;
	}

	/**
	 * return true if it is local schedule
	 */
	function checkIfLocalSchedules(jobId) {
		var localjob,
			val;
		localjob = LOCAL_RECORDING_JOBS + jobId;
		val = $N.platform.system.Preferences.get(localjob);
		$N.platform.system.Preferences.deletePreference(localjob);
		if (val) {
			return true;
		} else {
			return false;
		}
	}

	/*If one remote schedule is made, no this event is coming. so we take it as the difference to separate remote schedule and local ones.
	 * so that we can surpress the conflicts popup caused by one client box*/
	function markLocalSchedules(jobId) {
		var localjob;
		localjob = LOCAL_RECORDING_JOBS + jobId;
		$N.platform.system.Preferences.set(localjob, 1);
	}

	/**
	 * Updates the recordingCache for an event given the taskId
	 * @method updateCacheForTask
	 * @private
	 * @param {taskId} of the relevant task
	 */
	function updateCacheForTask(taskId) {
		log("updateCacheForTask", "Enter with taskId:" + taskId);
		var taskObject = $N.platform.btv.PVRManager.getTask(taskId),
			event = null,
			eventObject = null;
		if (taskObject && isTaskObjectPVR(taskObject) && taskObject.eventId) {
			event = $N.platform.btv.EPG.getEventById(taskObject.eventId);
			eventObject = $N.platform.btv.EPGEventFactory.mapObject(event);
			if (eventObject && eventObject.uniqueEventId) {
				log("updateCacheForTask", "eventObject.uniqueEventId:" + eventObject.uniqueEventId);
				log("updateCacheForTask", "taskObject.objectState:" + taskObject.objectState);
				log("updateCacheForTask", "recordingCache[eventObject.uniqueEventId] before: " + recordingCache[eventObject.uniqueEventId]);
				recordingCache[eventObject.uniqueEventId] = getStatusForTask(taskObject);
				log("updateCacheForTask", "recordingCache[eventObject.uniqueEventId] after: " + recordingCache[eventObject.uniqueEventId]);
				log("updateCacheForTask", "Exit");
			}
		}
	}

	/* CCOM event listener call back methods */

	/**
	 * Handles the CCOM scheduler addJobCompleted listener callback when a
	 * recording request is made.
	 * @method addJobCompletedListener
	 * @private
	 * @param {Object} e the event object
	 */
	addJobCompletedListener = function (e) {
		log("addJobCompletedListener", "job:" + e.jobId);
		var tasks,
			i,
			unscheduledTasks = [],
			taskOverlapsHandle,
			cumulativeConflictingTasks = [],
			taskOverlapsCount = 0,
			existingConflicts = [],
			taskOverlapsListener;

		if (!checkIfLocalSchedules(e.jobId)) {
			log("addJobCompletedListener", "This is one remote schedule, quit to process conflicts.");
			return;
		}

		taskOverlapsListener = function (overlapObj) {
			log("taskOverlapsListener", "Enter");
			taskOverlapsCount++;
			if (overlapObj.handle === taskOverlapsHandle && overlapObj.error === undefined) {
				for (i = 0; i < overlapObj.taskOverlaps.length; i++) {
					if (!existingConflicts[overlapObj.taskOverlaps[i].taskId] && (overlapObj.taskOverlaps[i].fulfillmentStatus === COMPLETION_STATUS_NONE || overlapObj.taskOverlaps[i].fulfillmentStatus === COMPLETION_STATUS_PARTIAL)) {
						unscheduledTasks.push(getTaskById(overlapObj.taskOverlaps[i].taskId));
						existingConflicts[overlapObj.taskOverlaps[i].taskId] = true;
					}
				}
			}

			if (taskOverlapsCount === tasks.length) {
				CCOM.Scheduler.removeEventListener("getTaskOverlapsOK", taskOverlapsListener, false);
				CCOM.Scheduler.removeEventListener("getTaskOverlapsFailed", taskOverlapsListener, false);
				if (unscheduledTasks.length > 0) {
					conflictManager.handleConflictsForTasks(unscheduledTasks, function (conflicts) {
						recordingRequestConflictsCallback(unscheduledTasks, conflicts);
					});
				} else {
					updateEventCallback("onAddJobCompleted", e.jobId);
					executeListeners(uiRefreshListeners, e);
				}
			} else {
				taskOverlapsHandle = CCOM.Scheduler.getTaskOverlaps(tasks[taskOverlapsCount].taskId);
			}
			log("taskOverlapsListener", "Exit");
		};

		tasks = getTasksForJob(e.jobId);
		if (tasks[0]) {
			if (tasks[0].taskType === TASK_TYPE.REMINDER) {
				executeListeners(uiRefreshListeners);
			} else {
				CCOM.Scheduler.addEventListener("getTaskOverlapsOK", taskOverlapsListener);
				CCOM.Scheduler.addEventListener("getTaskOverlapsFailed", taskOverlapsListener);
				taskOverlapsHandle = CCOM.Scheduler.getTaskOverlaps(tasks[0].taskId);
			}
		}
		log("addJobListener", "Exit");
	};
	/**
	 * Handles the CCOM scheduler addTaskFailed listener callback when a
	 * recording request fails, executes the recordingRequestFailedCallback
	 * @method addTaskFailedListenerT
	 * @param {Object} e event object
	 * @private
	 */
	addTaskFailedListener = function (e) {
		log("addTaskFailedListener", "ERROR Task add failed: jobId:" + e.jobId + " reason:" + e.reason);
		if (addJobId) {
			addJobId = null;
		}
		if (e && e.taskType) {
			if (e.taskType === TASK_TYPE.RECORDING) {
				if (e && e.reason && e.reason === CCOM.Scheduler.BAD_PARAM) {
					$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_PVR_INVALID_EVENT_MSG);
				} else {
					$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_PVR_JOB_FAILED_MSG);
				}
			} else if (e.taskType === TASK_TYPE.REMINDER) {
				$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_AT_TASK_FAILED_MSG);
			}
		}
		updateEventCallback("onAddTaskFailed", e.jobId);
	};

	/**
	 * Handles the CCOM scheduler addJobFailed listener callback when a
	 * recording request fails, simply outputs the error to the console.
	 * @method addJobFailedListener
	 * @param {Object} e event object
	 * @private
	 */
	addJobFailedListener = function (e) {
		log("addJobFailedListener", "ERROR Job add failed: " + e.error.message);
		log("addJobFailedListener", JSON.stringify(e));
		if (recordingRequestFailedCallback) {
			recordingRequestFailedCallback(e);
		}
		if (e && e.error && e.error.name && e.error.name === "BadParam") {
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_PVR_INVALID_EVENT_MSG);
		} else {
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_PVR_JOB_FAILED_MSG);
		}
	};

	/**
	 * Handles the CCOM scheduler addJobOK listener callback when a
	 * recording request is successful. This stores the jobId.
	 * @method addJobOKListener
	 * @param {Object} e event object
	 * @private
	 */
	addJobOKListener = function (e) {
		log("addJobOKListener", "Job add OK: jobId:" + e.jobId);
		addJobId = e.jobId;
		markLocalSchedules(e.jobId);
		if (recordingRequestOKCallback) {
			recordingRequestOKCallback(e.jobId);
		}
	};

	/**
	 * A listener method that maintains the SchedulerMap for recording
	 * requests made from outside of this class, e.g. Series recordings
	 * @method taskAboutToStartListener
	 * @private
	 */
	taskAboutToStartListener = function (e) {
		log("taskAboutToStartListener", "Enter - task: " + e.taskId);
		var viewerPeriodInMilliSeconds = parseInt($N.platform.system.Preferences.get("/system/opentv/scheduler/JobTaskManager/viewerPeriod", true) * 1000, 10),
			timeInUtcMilliseconds = parseInt(new Date().getTime(), 10),
			tenSecondsInMilliseconds = 10000,
			tenSecondsAfterRecordingStartsInUtcMilliseconds = parseInt(timeInUtcMilliseconds + viewerPeriodInMilliSeconds + tenSecondsInMilliseconds, 10),
			handleConflictsForTimeCallback = function (conflicts) {
				var i;
				log("taskAboutToStartListener", "handleConflictsForTimeCallback - conflicts.length = " + conflicts.length);
				if (conflicts.length > 1) {
					taskAboutToStartConflictCallback([getTaskById(e.taskId)], conflicts);
				} else {
					taskAboutToStartCallback(e.taskId);
				}
			};
		conflictManager.handleConflictsForTime(tenSecondsAfterRecordingStartsInUtcMilliseconds, handleConflictsForTimeCallback);
		log("taskAboutToStartListener", "Exit");
	};

	/**
	 * Handles the CCOM scheduler TaskStarted listener callback when a scheduled
	 * task starts. Custom behaviour is defined in the taskStartedCallback and
	 * a call to update the UI occurs.
	 * @method taskStartedListener
	 * @param {Object} e event object
	 * @private
	 */
	taskStartedListener = function (e) {
		log("taskStartedListener", "Enter");
		log("taskStartedListener", "task:" + e.taskId);
		updateCacheForTask(e.taskId);
		updateEventCallback("onTaskStarted", e.taskId);
		executeListeners(uiRefreshListeners);
		log("taskStartedListener", "Exit");
	};

	/**
	 * Handles the CCOM scheduler TaskEnded listener callback when a task
	 * finishes recording. Custom behaviour is defined in the taskEndedCallback and
	 * a call to update the UI occurs.
	 * @method taskStoppedListener
	 * @param {Object} e event object
	 * @private
	 */
	taskStoppedListener = function (e) {
		log("taskStoppedListener", "Enter - task : " + e.taskId + " Status is " + e.currentStatus);
		updateCacheForTask(e.taskId);
		updateEventCallback("onTaskStopped", e.taskId);
		executeListeners(uiRefreshListeners);
		log("taskStoppedListener", "Exit");
	};

	/**
	 * Executes the diskSpaceWarningCallback when the disk space is within
	 * the given used percentage.
	 * @method diskSpaceWarningListener
	 * @private
	 * @param {Object} e event object
	 */
	diskSpaceWarningListener = function (e) {
		log("diskSpaceWarningListener", "Enter");
		updateEventCallback("onDiskSpaceAlert", e);
		log("diskSpaceWarningListener", "Exit");
	};

	/**
	 * Executes the jobDeletedOK callback when a deletejob has been successful.
	 * @method jobDeletedOKListener
	 * @private
	 * @param {Object} e event object
	 */
	jobDeletedOKListener = function (e) {
		log("jobDeletedOKListener", "Enter");
		refreshRecordingsCache();
		updateEventCallback("deleteJobOK", e);
		log("jobDeletedOKListener", "Exit");
	};

	/**
	 * Executes the taskStoppedOK callback when a stopTask has been successful.
	 * @method taskStoppedOKListener
	 * @private
	 * @param {Object} e event object
	 */
	taskStoppedOKListener = function (e) {
		log("taskStoppedOKListener", "Enter");
		updateEventCallback("stopTaskOK", e);
		log("taskStoppedOKListener", "Exit");
	};

	/**
	 * Executes the taskChangedConflictCallback when a task has been changed if there
	 * is a conflict because of the new task structure.
	 * @method tasksChangedListener
	 * @private
	 * @param {Object} e event object
	 */
	tasksChangedListener = function (e) {
		//TODO: Decide if we need to determine if the tasks have changed as the result of a user recording request, as not to
		// fire the taskChangedConflictCallback for recurring / series link automatic recording requests

		log("tasksChangedListener", "Enter");
		var i,
			unscheduledTasks = [];

		if (addJobId) {
			addJobId = null;
		} else {
			updateEventCallback("onTasksChanged", e);
			if (e.fulfillmentStatusArray) {
				for (i = 0; i < e.fulfillmentStatusArray.length; i++) {
					if (e.fulfillmentStatusArray[i].fulfillmentStatus === COMPLETION_STATUS_NONE || e.fulfillmentStatusArray[i].fulfillmentStatus === COMPLETION_STATUS_PARTIAL) {
						unscheduledTasks.push(getTaskById(e.fulfillmentStatusArray[i].taskId));
					} else if (e.fulfillmentStatusArray[i].fulfillmentStatus === COMPLETION_STATUS_INVALID) {
						log("tasksChangedListener", "Requested recording is in the past");
					}
				}
				if (unscheduledTasks.length > 0) {
					// handle conflicts only if it has not been done already
					conflictManager.handleConflictsForTasks(unscheduledTasks, function (conflicts) {
						taskChangedConflictCallback(unscheduledTasks, conflicts);
					});
				}
			}
			executeListeners(uiRefreshListeners);
		}
		log("tasksChangedListener", "Exit");
	};

	/**
	 * Executes the taskModifiedCallback when a task has been changed.
	 * @method tasksModifiedListener
	 * @private
	 * @param {Object} e event object
	 */
	tasksModifiedListener = function (e) {
		log("tasksModifiedListener", "Enter");
		updateEventCallback("onTasksModified", e);
		log("tasksModifiedListener", "Exit");
	};
	/**
	 * Populates the additional info for a recording request. Works for both event and series requests,
	 * @method getAdditionalInfoFromRequest
	 * @private
	 * @param {Number} eventId The event id
	 * @param {Object} metaData Meta data object. Can contain the following optional parameters:
	 * @param [metaData.softPrepaddingDuration] {Number} Specifies the number of milliseconds before the start time that the event can start if there are resources.
	 * @param [metaData.softPostpaddingDuration] {Number} Specifies the number of milliseconds after the end time that the event can persist if there are resources.
	 * @param [metaData.expirationDate] {Number} The UTC milliseconds when the job will be expired and deleted. This date may not be earlier than the end time of the final task, which is the default expiration.
	 * @param {Number} keepTime If this is anything other than null or undefined then the recording is set to protect
	 * @param {Object} event provided for series recordings only.
	 * @return {Number} The new job id
	 */
	getAdditionalInfoFromRequest = function (eventId, metaData, keepTime, event) {
		var additionalInfo = metaData || {};

		additionalInfo.keep = keepTime ? true : false;
		if (!additionalInfo.hasOwnProperty('softPrepaddingDuration') && !isNaN(defaultPadding)) {
			additionalInfo.softPrepaddingDuration = defaultPadding; //in milliseconds
		}
		if (!additionalInfo.hasOwnProperty('softPostpaddingDuration') && !isNaN(defaultPadding)) {
			additionalInfo.softPostpaddingDuration = defaultPadding; //in milliseconds
		}
		if (event && event.seriesId) {
			additionalInfo.sqlQueryFilter =  "seriesId = '" + event.seriesId.replace("'", "''") + "'";
			additionalInfo.sqlQueryFilter += " AND ";
			if (event.serviceId) {
				additionalInfo.sqlQueryFilter += " serviceId = '" + event.serviceId + "'";
				additionalInfo.sqlQueryFilter += " AND ";
			}
			additionalInfo.sqlQueryFilter += " startTime >= '" + event.startTime + "'";
		}
		additionalInfo.eventId = eventId;
		return additionalInfo;
	};

	/**
	 * Takes in the initial mappedRecording and returns a folder object with relevant attributes set to the
	 * value of the initial mappedRecording returned for that series PLUS a subRecordings array.
	 * @method mapFolder
	 * @private
	 * @param {Object} mappedRecording
	 * @return {Object} returned folder
	 */
	mapFolder = function (mappedRecording) {
		var folder = {};
		folder.jobId = mappedRecording.jobId;
		folder.seriesId = mappedRecording.seriesId;
		folder.seasonId = mappedRecording.seasonId;
		folder.seriesName = mappedRecording.seriesName;
		folder.eventId = mappedRecording.eventId;
		folder.startTime = mappedRecording.startTime;
		folder.endTime = mappedRecording.endTime;
		folder.scheduleType = mappedRecording.scheduleType;
		folder.subRecordings = [];
		return folder;
	};

	/**
	 * Manipulates a resultSet to return series linked tasks as folders.
	 * @method mapRecordingsToFolder
	 * @private
	 * @param {Array} recordings list of recordings that need to be mapped to a folder
	 * @return {Array} list of recordings mapped to folders for series-linked tasks
	 */
	function mapRecordingsToFolder(recordings) {
		var folder,
			subRecordings,
			returnArray = [],
			seriesLookup = {};

		recordings.forEach(function (recording, index) {
			//recording = $N.platform.btv.RecordingFactory.mapObject(recording);
			//TODO: testing seriesId here so recordings grouped even if not requested as part of a series
			// we could use scheduleType instead but that would just group recordings if they were requested as
			// part of a series.
			if (recording.seriesId === undefined || recording.seriesId === null || recording.seriesId === '') {
				returnArray.push(recording);
			} else {
				if (!seriesLookup[recording.seriesId]) {
					seriesLookup[recording.seriesId] = {};
					folder = mapFolder(recording);
					folder.subRecordings.push(recording);
					seriesLookup[recording.seriesId] = folder;
					returnArray.push(folder);
				} else {
					folder = seriesLookup[recording.seriesId];
					folder.subRecordings.push(recording);
				}
			}
		});
		return returnArray;
	}

	/**
	 * Executes if the "onContentModified" listener is fired.
	 * @method contentModifiedListener
	 * @private
	 * @param {Object} e event object
	 */
	contentModifiedListener = function (e) {
		log("contentModifiedListener", "medialibId: " + e.medialibId + " Status is " + e.modifyType);
		//TODO: add some functionality if required
	};

	function WHPVREventCallback(event, e) {
		switch (event) {
		case "deleteTaskOK":
		case "deleteTaskFailed":
		case "deleteScheduleOK":
		case "deleteScheduleFailed":
		case "onScheduleRemoved":
		case "onTaskRemoved":
		case "recordingUpdated":
		case "getTaskOK":
			updateEventCallback("onTasksChanged", e);
			executeListeners(uiRefreshListeners);
			break;
		case "createScheduleOK":
			//executeListeners(uiRefreshListeners);
			break;
		case "createScheduleFailed":
			$N.app.DialogueHelper.showWHPVRRecordingErrorDialogue(WHPVRManager.getTVNameByUdn(e.udn));
			break;
		}
	}

	return {
		/**
		 * Initialises the PVRManager ready for use, must be called prior to any
		 * other method calls.  Alternative conflict and meta-data objects can
		 * be passed in to this method allowing the default meta-data and
		 * conflict resolution to be overridden.
		 * @method init
		 * @param {Object} altConflictManager
		 * @param {Object} altMetaDataManager
		 */
		init: function (altConflictManager, altMetaDataManager) {
			log("init", "Enter");
			conflictManager = altConflictManager || new $N.platform.btv.ConflictManager($N.platform.btv.PVRManager);
			this.registerEventListeners();
			recordingsReturnOrder = $N.platform.btv.PVRManager.RecordingsReturnOrderType.BY_DATE;
			try {
				COMPLETION_STATUS_INVALID = CCOM.Scheduler.INVALID;
				COMPLETION_STATUS_NONE = CCOM.Scheduler.NONE;
				COMPLETION_STATUS_PARTIAL = CCOM.Scheduler.PARTIAL;
				COMPLETION_STATUS_FULL = CCOM.Scheduler.FULL;
			} catch (e) {
				COMPLETION_STATUS_INVALID = 0;
				COMPLETION_STATUS_NONE = 1;
				COMPLETION_STATUS_PARTIAL = 2;
				COMPLETION_STATUS_FULL = 3;
			}

			refreshRecordingsCache();

			log("init", "Exit");
		},

		/**
		 * Returns a Scheduler Job matching the given jobId, if no
		 * job is found null is returned.
		 * @method getJob
		 * @param {Number} jobId
		 * @return {Object} the matching job object
		 */
		getJob: getJobById,
		/**
		 * Returns a Scheduler Job matching the given eventId, if no
		 * job is found null is returned.
		 * @method getJobByEvent
		 * @param {Number} eventId
		 * @return {Object} the matching job object
		 */
		getJobByEvent: getJobByEvent,

		/**
		 * Checks if any other tasks (other than the one being deleted) exists for the associated job.
		 * If no other tasks exist, then the job is deleted from the meta-data
		 * @method deleteJob
		 * @chainable
		 * @async
		 * @param jobId {Number} id of the job that is associated with the deleted task
		 * @param taskId {Number} id of the task that has been deleted
		 */
		deleteJob: function (jobId, taskId) {
			log("deleteJob", "Enter");
			CCOM.Scheduler.deleteJob(jobId);
			log("deleteJob", "Exit");
			return this;
		},

		/**
		 * Retrieves a task by its task id.
		 * @method getTask
		 * @param {Number} taskId The task identifier
		 * @return {Object} A task object
		 */
		getTask: getTaskById,
		getAllTimedReminders: getAllTimedReminders,
		getRepeatDaysArrayForFrequency: getRepeatDaysArrayForFrequency,
		/**
		 * Returns the task associated with an active reminder
		 * i.e. will NOT return any reminders that are marked as cancelled.
		 * @method getScheduledReminderByEvent
		 * @param {String} eventId The event id
		 * @return {Object} The scheduler task
		 */
		getScheduledReminderByEvent: getScheduledReminderByEvent,
		getScheduledReminderByStartTime: getScheduledReminderByStartTime,

		/**
		 * Retrieves a task associated with an event.
		 * @method getTaskByEventId
		 * @param {String} eventId The event identifier
		 * @return {Object} A task object
		 */
		getTaskByEventId: getTaskByEvent,

		/**
		 * Retrieves an array of tasks for the given job id
		 * @method getTasksForJobId
		 * @param {Number} jobId
		 * @return {Array} Array of task objects
		 */
		getTasksForJobId: getTasksForJob,

		/**
		 * Sets the callback to be invoked when a recording is ABOUT to start
		 * this is normally 2 mins before.
		 * @method setTaskAboutToStartCallback
		 * @chainable
		 * @param {Function} callback
		 */
		setTaskAboutToStartCallback: function (callback) {
			log("setTaskAboutToStartCallback", "Enter");
			if (!callback) {
				callback = emptyFunction;
			}
			taskAboutToStartCallback = callback;
			log("setTaskAboutToStartCallback", "Exit");
			return this;
		},

		/**
		 * Sets the callback to be invoked when a recording is about to try and start but fail
		 * due to conflicts existing
		 * @method setTaskAboutToStartConflictCallback
		 * @chainable
		 * @param {Function} callback
		 */
		setTaskAboutToStartConflictCallback: function (callback) {
			log("setTaskAboutToStartConflictCallback", "Enter");
			if (!callback) {
				callback = emptyFunction;
			}
			taskAboutToStartConflictCallback = callback;
			log("setTaskAboutToStartConflictCallback", "Exit");
			return this;
		},

		/**
		 * Sets the callback that should be executed when a recording request
		 * fails.
		 * @method setRecordingRequestFailedCallback
		 * @chainable
		 * @param {Function} callback
		 */
		setRecordingRequestFailedCallback: function (callback) {
			log("setRecordingRequestFailedCallback", "Enter");
			if (!callback) {
				callback = emptyFunction;
			}
			recordingRequestFailedCallback = callback;
			log("setRecordingRequestFailedCallback", "Exit");
			return this;
		},

		/**
		 * Sets the callback that should be executed when a recording request
		 * succeeds.
		 * @method setRecordingRequestOKCallback
		 * @chainable
		 * @param {Function} callback
		 */
		setRecordingRequestOKCallback: function (callback) {
			log("setRecordingRequestOKCallback", "Enter");
			if (!callback) {
				callback = emptyFunction;
			}
			recordingRequestOKCallback = callback;
			log("setRecordingRequestOKCallback", "Exit");
			return this;
		},

		/**
		 * Sets the callback that should be executed when a recording request
		 * produces a conflict.
		 * @method setRecordingRequestConflictsCallback
		 * @chainable
		 * @param {Function} callback
		 */
		setRecordingRequestConflictsCallback: function (callback) {
			log("setRecordingRequestConflictsCallback", "Enter");
			if (!callback) {
				callback = emptyFunction;
			}
			recordingRequestConflictsCallback = callback;
			WHPVRManager.setRecordingRequestConflictsCallback(callback);
			log("setRecordingRequestConflictsCallback", "Exit");
			return this;
		},

		/**
		 * Sets the callback thats should be fired when a conflict
		 * exists after the task changed event is fired. For example
		 * when a task is added for an existsing repeat recording
		 * @method setTaskChangedConflictCallback
		 * @chainable
		 * @param {Function} callback
		 */
		setTaskChangedConflictCallback: function (callback) {
			log("setTaskChangedConflictCallback", "Enter");
			if (!callback) {
				callback = emptyFunction;
			}
			taskChangedConflictCallback = callback;
			log("setTaskChangedConflictCallback", "Exit");
			return this;
		},

		/**
		 * Sets the point as a percentage of total disk space at which a
		 * warning should be raised that disk space is low.
		 * @method setHighWaterMarkWarningValue
		 * @param {Number} waterMarkPercent between 1 and 100
		 * @deprecated Doesn't do anything, this functionality doesn't exist in OTV5.
		 */
		setHighWaterMarkWarningValue: function (waterMarkPercent) {
			// deprecated
			log("setHighWaterMarkWarningValue", "Enter and exit - deprecated function");
		},

		/**
		 * Saves the bookmark information for a recording.
		 * @method saveBookmark
		 * @chainable
		 * @param {Object} task
		 * @param {Number} bmIndex
		 * @param {Number} bmPosition (player position)
		 */
		saveBookmark: function (task, bmIndex, bmPosition) {
			log("saveBookmark", "Enter position is: " + bmPosition);
			var res = null;
			if (task && task.isWHPVRTask) {
				return WHPVRManager.saveBookmark(task, bmPosition);
			} else if (task && task.taskId) {
				res = CCOM.MediaLibrary.updateEntry(task.taskId, {bookmark: parseInt(bmPosition, 10)});
				if (res.error) {
					log("saveBookmark", "Task set bookmark failed with error.name = " + res.error.name + " - error.message = " + res.error.message);
				}
			}
			log("saveBookmark", "Exit");
			return this;
		},

		/**
		 * For the given scheduler taskId deletes the bookmark information for a recording in the
		 * database.
		 * @method deleteBookmark
		 * @chainable
		 * @param {Object} task
		 */
		deleteBookmark: function (task) {
			log("deleteBookmark", "Enter");
			$N.platform.btv.PVRManager.saveBookmark(task, null, 0);
			log("deleteBookmark", "Exit");
			return this;
		},

		/**
		 * For the given a scheduler taskId returns the current bookmark position for
		 * the recording.
		 * @method getBookmark
		 * @param {Object} task
		 * @return {Number}
		 */
		getBookmark: function (task) {
			log("getBookmark", "Enter");
			if (task && task.bookmark) {
				log("getBookmark", "Returning bookmark");
				return task.bookmark;
			}
			log("getBookmark", "Returning false");
			return 0;
		},

		/**
		 * Registers all the event listeners to the relevant callback methods.
		 * Calling this method is required before making any recording requests.
		 * @method registerEventListeners
		 */
		registerEventListeners: function () {
			log("registerEventListeners", "Registering CCOM Scheduler & MediaLibrary event listeners - Start");
			CCOM.Scheduler.addEventListener("onAddJobCompleted", addJobCompletedListener);
			CCOM.Scheduler.addEventListener("onTaskVPAlert", taskAboutToStartListener);
			CCOM.Scheduler.addEventListener("onTaskStarted", taskStartedListener);
			CCOM.Scheduler.addEventListener("onTaskStopped", taskStoppedListener);
			CCOM.Scheduler.addEventListener("onAddTaskFailed", addTaskFailedListener);
			CCOM.Scheduler.addEventListener("addJobFailed", addJobFailedListener);
			CCOM.Scheduler.addEventListener("addJobOK", addJobOKListener);
			CCOM.Scheduler.addEventListener("onTasksChanged", tasksChangedListener);
			CCOM.Scheduler.addEventListener("onTasksModified", tasksModifiedListener);
			CCOM.Scheduler.addEventListener("deleteJobOK", jobDeletedOKListener);
			CCOM.Scheduler.addEventListener("stopTaskOK", taskStoppedOKListener);
			CCOM.MediaLibrary.addEventListener("onContentModified", contentModifiedListener);
			CCOM.MediaLibrary.addEventListener("onDiskSpaceAlert", diskSpaceWarningListener); //TODO: test

			CCOM.Scheduler.addEventListener("updateTaskOK", function (e) {
				updateEventCallback("updateTaskOK", e);
			});
			CCOM.Scheduler.addEventListener("updateTaskFailed", function (e) {
				updateEventCallback("updateTaskFailed", e);
			});
			CCOM.MediaLibrary.addEventListener("updateEntryOK", function (e) {
				updateEventCallback("updateEntryOK", e);
			});
			CCOM.MediaLibrary.addEventListener("updateEntryFailed", function (e) {
				updateEventCallback("updateEntryFailed", e);
			});
			CCOM.MediaLibrary.addEventListener("deleteContentOK", function (e) {
				updateEventCallback("deleteContentOK", e);
			});
			WHPVRManager.addEventListener("deleteTaskOK", WHPVREventCallback);
			WHPVRManager.addEventListener("deleteTaskFailed", WHPVREventCallback);
			WHPVRManager.addEventListener("deleteScheduleOK", WHPVREventCallback);
			WHPVRManager.addEventListener("deleteScheduleFailed", WHPVREventCallback);
			WHPVRManager.addEventListener("onScheduleRemoved", WHPVREventCallback);
			WHPVRManager.addEventListener("onTaskRemoved", WHPVREventCallback);
			WHPVRManager.addEventListener("recordingUpdated", WHPVREventCallback);
			WHPVRManager.addEventListener("getTaskOK", WHPVREventCallback);
			WHPVRManager.addEventListener("createScheduleOK", WHPVREventCallback);
			WHPVRManager.addEventListener("createScheduleFailed", WHPVREventCallback);
			log("registerEventListeners", "Exit");
		},

		/**
		 * Un-registers all the event listeners and resets all the custom callback.
		 * method references
		 * @method unRegisterEventListeners
		 */
		unRegisterEventListeners: function () {
			log("unRegisterEventListeners", "Unregistering CCOM Scheduler & MediaLibrary event listeners - Start");
			CCOM.Scheduler.removeEventListener("onAddJobCompleted", addJobCompletedListener, false);
			CCOM.Scheduler.removeEventListener("onTaskVPAlert", taskAboutToStartListener, false);
			CCOM.Scheduler.removeEventListener("onTaskStarted", taskStartedListener, false);
			CCOM.Scheduler.removeEventListener("onTaskStopped", taskStoppedListener, false);
			CCOM.Scheduler.removeEventListener("onAddTaskFailed", addTaskFailedListener, false);
			CCOM.Scheduler.removeEventListener("addJobFailed", addJobFailedListener, false);
			CCOM.Scheduler.removeEventListener("onTasksChanged", tasksChangedListener, false);
			CCOM.Scheduler.removeEventListener("onTasksModified", tasksModifiedListener, false);
			CCOM.Scheduler.removeEventListener("deleteJobOK", jobDeletedOKListener, false);
			CCOM.Scheduler.removeEventListener("stopTaskOK", taskStoppedOKListener, false);
			CCOM.MediaLibrary.removeEventListener("onContentModified", contentModifiedListener, false);
			CCOM.MediaLibrary.removeEventListener("onDiskSpaceAlert", diskSpaceWarningListener, false); // TODO: test

			WHPVRManager.removeEventListener("deleteTaskOK", WHPVREventCallback);
			WHPVRManager.removeEventListener("deleteTaskFailed", WHPVREventCallback);
			WHPVRManager.removeEventListener("deleteScheduleOK", WHPVREventCallback);
			WHPVRManager.removeEventListener("deleteScheduleFailed", WHPVREventCallback);
			WHPVRManager.removeEventListener("onScheduleRemoved", WHPVREventCallback);
			WHPVRManager.removeEventListener("onTaskRemoved", WHPVREventCallback);
			WHPVRManager.removeEventListener("recordingUpdated", WHPVREventCallback);
			WHPVRManager.removeEventListener("getTaskOK", WHPVREventCallback);
			WHPVRManager.removeEventListener("createScheduleOK", WHPVREventCallback);
			WHPVRManager.removeEventListener("createScheduleFailed", WHPVREventCallback);
			log("unRegisterEventListeners", "Exit");
		},

		/**
		 * Creates a series recording.
		 * @method requestSeriesRecording
		 * @param {Object} event The EPG event object
		 * @param {Object} metaData Meta data object. Can contain the following optional parameters:
		 * @param [metaData.softPrepaddingDuration] {Number} Specifies the number of milliseconds before the start time that the event can start if there are resources.
		 * @param [metaData.softPostpaddingDuration] {Number} Specifies the number of milliseconds after the end time that the event can persist if there are resources.
		 * @param [metaData.expirationDate] {Number} The UTC milliseconds when the job will be expired and deleted. This date may not be earlier than the end time of the final task, which is the default expiration.
		 * @param {Number} keepTime If this is anything other than null or undefined then the recording is set to protected.
		 */
		requestSeriesRecording: function (event, metaData, keepTime) {
			log("requestSeriesRecording", "Enter");
			var additionalInfo,
				currentUdn,
				result;
			if (!event || !event.startTime || !event.seriesId) {
				log("requestSeriesRecording", "ERROR : passed in event object has no seriesId or startTime");
			} else {
				log("requestSeriesRecording", "Event ID " + event.eventId + " unique: " + event.uniqueEventId);
				if ($N.platform.btv.WHPVRManager.isLocalRecordServer()) {
					additionalInfo = getAdditionalInfoFromRequest(event.eventId, metaData, keepTime, event);
					result = CCOM.Scheduler.addJob(TASK_TYPE.RECORDING, JOB_TYPE.SERIES, additionalInfo);
					log("requestSeriesRecording", result);
					if (result && result.error) {
						log("requestSeriesRecording", "ERROR : name:" + result.error.name + " message:" + result.error.message);
					} else {
						recordingCache[event.uniqueEventId] = $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_SCHEDULED_BY_SERIES;
					}
				} else {
					currentUdn = $N.platform.btv.WHPVRManager.getCurrentRecordServer();
					metaData.seriesId = event.seriesId;
					metaData.eventId = event.eventId;
					$N.platform.btv.WHPVRManager.requestSeriesRecording(currentUdn, metaData);
				}
			}
			log("requestSeriesRecording", "Exit");
		},

		/**
		 * Cancels an existing series recording matching a given event
		 * @method cancelSeriesRecording
		 * @chainable
		 * @param {Number} jobId id of the series job that we want to cancel
		 */
		cancelSeriesRecording: function (jobId) {
			log("cancelSeriesRecording", "Enter - jobId = " + jobId);
			this.deleteJob(jobId);
			log("cancelSeriesRecording", "Exit");
			return this;
		},

		// TODO NINJA-336: JSFW-FIXED<2.0.5 Beta 1>: cancelSeriesRecordingByEventId is requested in ticket NINJA-336
		/**
		 * Given an EPG eventId, cancels an existing series recording
		 * @method cancelSeriesRecordingByEventId
		 * @chainable
		 * @param {String} eventId
		 */
		cancelSeriesRecordingByEventId: function (eventId) {
			log("cancelSeriesRecordingByEventId", "Enter - eventID = " + eventId);
			var task,
				currentUdn = $N.platform.btv.WHPVRManager.getCurrentRecordServer(),
				event = null,
				eventObject = null;
			//Delete local firstly
			task = getTaskByEvent(eventId, null, "", true);
			if (task) {
				log("cancelSeriesRecordingByEventId", "Event is scheduled and a series event - deleting job");
				this.cancelSeriesRecording(task.jobId);
				event = $N.platform.btv.EPG.getEventById(eventId);
				eventObject = $N.platform.btv.EPGEventFactory.mapObject(event);
				if (eventObject && eventObject.uniqueEventId) {
					recordingCache[eventObject.uniqueEventId] = $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_UNSCHEDULED;
				}
			}
			//Delete default location remote schedule
			if (!event) {
				event = $N.platform.btv.EPG.getEventById(eventId);
			}
			if (event && !event.error) {
				$N.platform.btv.WHPVRManager.deleteSeriesSchedule(currentUdn, event.seriesId);
			} else {
				log("cancelSeriesRecordingByEventId", "Event is not found");
			}
			log("cancelSeriesRecordingByEventId", "Exit");
			return this;
		},

		/**
		 * Given a service id, cancels an existing series recording
		 * @method cancelManualSeriesRecording
		 * @chainable
		 * @param {String} serviceId
		 */
		cancelManualSeriesRecording: function (serviceId) {
			log("cancelManualSeriesRecording", "Enter - serviceId = " + serviceId);
			var task;
			//Delete local firstly
			task = getTaskByService(serviceId, null, "", TASK_TYPE.RECORDING);
			if (task) {
				log("cancelManualSeriesRecording", "service is scheduled and a series event - deleting job");
				this.cancelSeriesRecording(task.jobId);
			}
			log("cancelManualSeriesRecording", "Exit");
			return this;
		},
		/**
		 * Cancels a recurring scheduled recording
		 * @method cancelRecurringRecording
		 * @chainable
		 * @param {Number} jobId id of the recurring job that we want to cancel
		 */
		cancelRecurringRecording: function (jobId) {
			log("cancelRecurringRecording", "Enter");
			this.deleteJob(jobId);
			log("cancelRecurringRecording", "Exit");
			return this;
		},

		/**
		 * Creates an event recording.
		 * @method requestEventRecording
		 * @param {Object} event The event to be recorded
		 * @param {Object} metaData Meta data object. Can contain the following optional parameters
		 * @param [metaData.softPrepaddingDuration] {Number} Specifies the number of milliseconds before the start time that the event can start if there are resources.
		 * @param [metaData.softPostpaddingDuration] {Number} Specifies the number of milliseconds after the end time that the event can persist if there are resources.
		 * @param [metaData.expirationDate] {Number} The UTC milliseconds when the job will be expired and deleted. This date may not be earlier than the end time of the final task, which is the default expiration.
		 * @param {Number} keepTime If this is anything other than null or undefined then the recording is set to protected.
		 * @return (number) The new job id
		 */
		requestEventRecording: function (event, metaData, keepTime) {
			log("requestEventRecording", "Enter - event " + event.eventId + " - keepTime = " + keepTime);
			var additionalInfo,
				currentUdn,
				result;

			if ($N.platform.btv.WHPVRManager.isLocalRecordServer()) {
				additionalInfo = getAdditionalInfoFromRequest(event.eventId, metaData, keepTime);
				result = CCOM.Scheduler.addJob(TASK_TYPE.RECORDING, JOB_TYPE.EVENT, additionalInfo);
				log("requestEventRecording", result);
				if (result && result.error) {
					log("requestEventRecording", "ERROR : name:" + result.error.name + " message:" + result.error.message);
				} else {
					recordingCache[event.uniqueEventId] = $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_SCHEDULED;
				}
				return result.jobId;
			} else {
				currentUdn = $N.platform.btv.WHPVRManager.getCurrentRecordServer();
				metaData.eventId = event.eventId;
				$N.platform.btv.WHPVRManager.requestEventRecording(currentUdn, metaData);
			}
			log("requestEventRecording", "Exit");
		},

		/**
		 * Given an EPG eventId, cancels an existing recording or deletes a scheduled event recording.
		 * @method cancelEventRecording
		 * @chainable
		 * @param {Object} event
		 */
		cancelEventRecording: function (event) {
			log("cancelEventRecording", "Enter");
			var task,
				currentUdn = $N.platform.btv.WHPVRManager.getCurrentRecordServer(),
				uniqueEventId = event && event.uniqueEventId ? event.uniqueEventId : null;
			if (uniqueEventId !== null) {
				log("cancelEventRecording", "With uniqueEventId: " + uniqueEventId);
			}
			//Delete local firstly
			task = getTaskByEvent(event.eventId, null, "", true);
			if (task) {
				if (isTaskObjectScheduled(task) && task.recordingType === $N.data.Recording.RECORDING_TYPE.SINGLE) {
					log("cancelEventRecording", "Event is scheduled and a single event - deleting job");
					this.deleteJob(task.jobId);
				} else if (isTaskObjectActive(task) || isTaskObjectScheduled(task)) {
					log("cancelEventRecording", "Event is active or scheduled and a series - stopping task");
					CCOM.Scheduler.stopTask(task.taskId);
				}
			}
			//Delete default location remote schedule
			recordingCache[uniqueEventId] = $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_UNSCHEDULED;
			$N.platform.btv.WHPVRManager.deleteSingleSchedule(currentUdn, event);
			log("cancelEventRecording", "Exit");
			return this;
		},

		/**
		 * Given a service id, cancels an existing recording or deletes a scheduled manual recording.
		 * @method cancelManualRecording
		 * @chainable
		 * @param {String} serviceId
		 */
		cancelManualRecording: function (serviceId) {
			log("cancelManualRecording", "Enter - serviceId = " + serviceId);
			var task,
				job,
				currentUdn = $N.platform.btv.WHPVRManager.getCurrentRecordServer(),
				event;
			//Delete local firstly
			task = getTaskByService(serviceId, null, "", TASK_TYPE.RECORDING);
			job = getJobByService(serviceId, null, TASK_TYPE.RECORDING);
			if (task && job) {
				if (isTaskObjectScheduled(task) && task.recordingType === $N.data.Recording.RECORDING_TYPE.SINGLE) {
					log("cancelManualRecording", "serviceId is scheduled - deleting job");
					this.deleteJob(job.jobId);
				} else if (isTaskObjectActive(task) || isTaskObjectScheduled(task)) {
					log("cancelManualRecording", "serviceId is active or scheduled and a series - stopping task");
					CCOM.Scheduler.stopTask(task.taskId);
				}
			}
			log("cancelManualRecording", "Exit");
			return this;
		},

		cancelRecordingByTask: function (task) {
			if (!task) {
				log("cancelRecordingByTask", "Invalid param");
				return;
			}
			if (!task.isWHPVRTask) {
				if (isTaskObjectScheduled(task) && task.recordingType === $N.data.Recording.RECORDING_TYPE.SINGLE) {
					log("cancelRecordingByTask", "Event is scheduled and a single event - deleting job");
					this.deleteJob(task.jobId);
				} else if (isTaskObjectActive(task) || isTaskObjectScheduled(task)) {
					log("cancelRecordingByTask", "Event is active or scheduled and a series - stopping task");
					CCOM.Scheduler.stopTask(task.taskId);
				}
			} else {
				$N.platform.btv.WHPVRManager.deleteTask(task);
			}
		},

		/**
		 * Requests scheduler time based recording with the given parameters
		 * A repeat recording is added if the metaData object contains a repeatDaysArray
		 * that is not null or undefined.
		 * The correct format of the repeatDaysArray is a seven element array of booleans,
		 * that represent days of the week on which to record running from Monday to Sunday.
		 * @method requestTimeRecording
		 * @param {Number} startTime (seconds)
		 * @param {Number} endTime (seconds)
		 * @param {Number} frequency either ONCE (default if null), DAILY, WEEKLY, WEEKDAYS, WEEKENDS. See the Frequency enum.
		 * @param {Number} serviceId
		 * @param {Number} keepTime If this is anything other than null, undefined, or false then the recording is set to protected.
		 * @param {Object} metaData any other fields that should be updated as part of the request
		 * Can contain the following optional parameters:
		 * @param [metaData.url] {String} The uri of the service you wish to record
		 * @param [metaData.softPrepaddingDuration] {Number} Specifies the number of milliseconds before the start time that the event can start if there are resources.
		 * @param [metaData.softPostpaddingDuration] {Number} Specifies the number of milliseconds after the end time that the event can persist if there are resources.
		 * @param [metaData.expirationDate] {Number} The UTC milliseconds when the job will be expired and deleted. This date may not be earlier than the end time of the final task, which is the default expiration.
		 * @param [metaData.timeOfDay] {Number} The timeOfDay field specifies the number of seconds from midnight local time for a given day. This is used only for repeat recordings
		 * @param [metaData.repeatDaysArray] {Array} an array of seven booleans corresponding to the days Monday through Sunday. Monday is index 0. For every boolean that is set, the time-based rule will
		 * know to record on that day at the time specified by timeOfDay and for the duration set in duration. Therefore, this field is valid only if timeOfDay and duration are set and is a repeat recording.
		 */
		requestTimeRecording: function (startTime, endTime, frequency, serviceId, keepTime, metaData) {
			log("requestTimeRecording", "Enter");
			var result,
				job = metaData || {},
				isRepeatRecording = false,
				startTimeDate;
			job.duration = (endTime - startTime) * 1000;
			job.sourceURL = metaData.url;
			job.keep = keepTime || 0; //since it is an Integer, we should not be saving true/false. changing as per NET requirement
			job.serviceId = serviceId;
			job.title = metaData.title;
			job.uiFolder = metaData.uiFolder; //Adding new job parameter,  uiFolder as per NET requirement
			job.repeatDaysArray = metaData.repeatDaysArray; //Adding new job parameter, repeatDaysArray as per NET requirement
			if (!job.sourceURL) {
				if (serviceId && $N.platform.btv.EPG && $N.platform.btv.EPG.getChannelByServiceId(serviceId)) {
					job.sourceURL = $N.platform.btv.EPG.getChannelByServiceId(serviceId).uri;
				} else {
					return false;
				}
			}
			if (!job.hasOwnProperty('softPrepaddingDuration') && !isNaN(defaultPadding)) {
				job.softPrepaddingDuration = defaultPadding; //in milliseconds
			}
			if (!job.hasOwnProperty('softPostpaddingDuration') && !isNaN(defaultPadding)) {
				job.softPostpaddingDuration = defaultPadding; //in milliseconds
			}
			if (job.hasOwnProperty('repeatDaysArray') || (frequency && frequency !== $N.platform.btv.PVRManager.Frequency.ONCE)) {
				if (job.hasOwnProperty('repeatDaysArray')) {
					job.repeatDaysArray = checkRepeatDaysArray(job.repeatDaysArray);
				} else if (frequency) {
					job.repeatDaysArray = getRepeatDaysArrayForFrequency(frequency);
				}
				isRepeatRecording = (!job.repeatDaysArray || job.repeatDaysArray.length === 0) ? false : true;
			}
			if (isRepeatRecording) {
				startTimeDate = new Date(startTime * 1000);
				job.timeOfDay = (startTimeDate.getHours() * 3600) + (startTimeDate.getMinutes() * 60);
				result = CCOM.Scheduler.addJob(TASK_TYPE.RECORDING, JOB_TYPE.REPEAT, job);
			} else {
				job.startTime = startTime * 1000;
				result = CCOM.Scheduler.addJob(TASK_TYPE.RECORDING, JOB_TYPE.SINGLE, job);
			}

			log("requestTimeRecording", result);
			if (result && result.error) {
				log("requestTimeRecording", "ERROR : name:" + result.error.name + " message:" + result.error.message);
				return false;
			}
			log("requestTimeRecording", "Exit");
		},

		/**
		 * Determines if the task identified by the given id is currently scheduled or active
		 * regardless of type otherwise returns false.
		 * @method isTaskScheduled
		 * @param {Number} id
		 * @return {Boolean}
		 */
		isTaskScheduled: function (id) {
			log("isTaskScheduled", "Enter");
			var task = getTaskById(id);
			if (task && (isTaskObjectScheduled(task) || isTaskObjectActive(task))) {
				log("isTaskScheduled", "Returning true for ID: " + id);
				return true;
			}
			log("isTaskScheduled", "Returning false for event ID: " + id);
			return false;
		},

		/**
		 * Determines if the task identified by the given id is currently unscheduled regardless of
		 * type otherwise returns false.
		 * @method isTaskUnscheduled
		 * @param {Number} id
		 * @return {Boolean}
		 */
		isTaskUnscheduled: function (id) {
			log("isTaskUnscheduled", "Enter");
			var task = getTaskById(id);
			if (task) {
				log("isTaskUnscheduled", "Returning " + !isTaskObjectScheduled(task) + " for ID: " + id);
				return !isTaskObjectScheduled(task);
			}
			log("isTaskUnscheduled", "Returning false for ID: " + id);
			return false;
		},

		/**
		 * Determines if the task identified by the given id is a currently scheduled or active task
		 * of PVR type otherwise returns false.
		 * @method isPVRTaskScheduled
		 * @param {Number} id
		 * @return {Boolean}
		 */
		isPVRTaskScheduled: function (id) {
			log("isPVRTaskScheduled", "Enter");
			var task = getTaskById(id, "taskType, objectState");
			if (task && isTaskObjectPVR(task) && (isTaskObjectScheduled(task) || isTaskObjectActive(task))) {
				log("isPVRTaskScheduled", "Returning true for ID: " + id);
				return true;
			}
			log("isPVRTaskScheduled", "Returning false for ID: " + id);
			return false;
		},

		/**
		 * Determines if the task identified by the given id is a currently active task of PVR type
		 * otherwise returns false.
		 * @method isTaskRecordingNow
		 * @param {Number} id
		 * @return {Boolean}
		 */
		isTaskRecordingNow: function (taskId) {
			log("isTaskRecordingNow", "Enter");
			var task = getTaskById(taskId, "taskType, objectState");
			if (task && isTaskObjectPVR(task) && isTaskObjectActive(task)) {
				log("isTaskRecordingNow", "Returning true for task ID: " + taskId);
				return true;
			}
			log("isTaskRecordingNow", "Returning false for task ID: " + taskId);
			return false;
		},

		/**
		 * Determines if the event identified by the given id is currently scheduled or active
		 * regardless of type otherwise returns false
		 * @method isEventScheduled
		 * @param {Number} eventId
		 * @return {Boolean}
		 */
		isEventScheduled: function (eventId) {
			log("isEventScheduled", "Enter");
			var task = getTaskByEvent(eventId, null, "taskType, objectState");
			if (task && (isTaskObjectActive(task) || isTaskObjectScheduled(task))) {
				log("isEventScheduled", "Returning true for event ID: " + eventId);
				return true;
			}
			log("isEventScheduled", "Returning false for event ID: " + eventId);
			return false;
		},

		/**
		 * Determines if the event identified by the given id is currently unscheduled
		 * regardless of type otherwise returns false.
		 * @method isEventUnScheduled
		 * @param {Number} eventId
		 * @return {Boolean}
		 */
		isEventUnScheduled: function (eventId) {
			log("isEventUnScheduled", "Enter");
			var task = getTaskByEvent(eventId, null, "taskType, objectState");
			if (task && !isTaskObjectScheduled(task)) {
				log("isEventUnScheduled", "Returning true for event ID: " + eventId);
				return true;
			}
			log("isEventUnScheduled", "Returning false for event ID: " + eventId);
			return false;
		},

		/**
		 * Determines if the event identified by the given id is ca partial recording
		 * otherwise returns false.
		 * @method isEventPartialRecording
		 * @param {Number} eventId
		 * @return {Boolean}
		 */
		isEventPartialRecording: function (eventId) {
			log("isEventPartialRecording", "Enter");
			var task = getTaskByEvent(eventId, null, "taskType, completeStatus", true);
			if (task && isTaskObjectPVR(task) && isTaskObjectPartial(task)) {
				log("isEventPartialRecording", "Returning true for event ID: " + eventId);
				return true;
			}
			log("isEventPartialRecording", "Returning false for event ID: " + eventId);
			return false;
		},

		/**
		 * Determines if the PVR event identified by the given id is a currently unscheduled otherwise
		 * returns false.
		 * @method isPVREventUnScheduled
		 * @param {Number} eventId
		 * @return {Boolean}
		 */
		isPVREventUnScheduled:  function (eventId) {
			log("isPVREventUnScheduled", "Enter");
			var task = getTaskByEvent(eventId, null, "taskType, objectState", true);
			if (task && isTaskObjectPVR(task) && !isTaskObjectScheduled(task)) {
				log("isPVREventUnScheduled", "Returning true for event ID: " + eventId);
				return true;
			}
			log("isPVREventUnScheduled", "Returning false for event ID: " + eventId);
			return false;
		},

		/**
		 * Determines if the PVR event identified by the given id is a currently scheduled or active.
		 * @method isPVREventScheduled
		 * @param {Object} event
		 * @return {Boolean} true if the event with the given id is scheduled or active, false otherwise
		 */
		isPVREventScheduled: function (event) {
			var uniqueEventId = event.uniqueEventId;
			log("isPVREventScheduled", "Enter event.eventId = " + event.eventId);
			log("isPVREventScheduled", "Enter uniqueEventId = " + uniqueEventId);
			if (uniqueEventId && recordingCache.hasOwnProperty(uniqueEventId)) {
				log("isPVREventScheduled", "Cached recordingStatus: " + recordingCache[uniqueEventId]);
				if (recordingCache[uniqueEventId] < $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_SCHEDULED) {
					log("isPVREventScheduled", "Returning false");
					return false;
				}
				if (recordingCache[uniqueEventId] > $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_ACTIVE_IN_SERIES) {
					log("isPVREventScheduled", "Returning false");
					return false;
				}
				log("isPVREventScheduled", "Returning true");
				return true;
			} else {
				log("isPVREventScheduled", "Nope not scheduled.");
				return false;
			}
		},

		/**
		 * Determines if the PVR service identified by the given id is a currently scheduled or active.
		 * @method isManualRecordingActiveForService
		 * @param {Object} event
		 * @return {Boolean} true if the service with the given id is scheduled or active, false otherwise
		 */
		isManualRecordingActiveForService: function (event) {
			var task,
				serviceId = event.serviceId,
				query = "taskId, taskType, objectState, scheduleType, completeStatus, startTime, endTime",
				taskLength = null,
				recordingStatus,
				i;
			log("isManualRecordingActiveForService", "Enter");
			//check local firstly
			task = getTaskByService(serviceId, null, "taskType, objectState", TASK_TYPE.RECORDING);
			if (task && (task._data.taskType === TASK_TYPE.RECORDING)) {
				task = getTaskArrayByService(serviceId, null, query, TASK_TYPE.RECORDING);
				taskLength = task.length;
				//For Daily and Weekly recording tasks we need to iterate over all the task in array to find which task is active.
				for (i = 0; i < taskLength; i++) {
					if (task[i] && isTaskObjectPVR(task[i])) {
						recordingStatus = getStatusForTask(task[i]);
						if (recordingStatus === $N.app.PVRUtil.ACTIVE || recordingStatus === $N.app.PVRUtil.ACTIVE_IN_SERIES) {
							if ((event.startTime < task[i].endTime) && (event.endTime !== task[i].startTime)) {
								return true;
							}
						}
					}
				}
			}
			log("isManualRecordingActiveForService", "Returning false for service ID: " + serviceId);
			return false;
		},


		/**
		 * Returns currently active record Task id for the given service id.
		 * @method getActiveTaskIdForService
		 * @param {serviceId} serviceId
		 * @return {number} returns Task Id if that task id is active, null otherwise
		 */
		getActiveTaskIdForService: function (serviceId) {
			var task,
				query = "taskId, taskType, objectState, scheduleType, completeStatus, startTime, endTime",
				taskLength = null,
				recordingStatus,
				i;
			log("getActiveTaskIdForService", "Enter");
			//check local firstly
			task = getTaskByService(serviceId, null, "taskType, objectState", TASK_TYPE.RECORDING);
			if (task && (task._data.taskType === TASK_TYPE.RECORDING)) {
				task = getTaskArrayByService(serviceId, null, query, TASK_TYPE.RECORDING);
				taskLength = task.length;
				for (i = 0; i < taskLength; i++) {
					if (task[i] && isTaskObjectPVR(task[i])) {
						recordingStatus = getStatusForTask(task[i]);
						if (recordingStatus === $N.app.PVRUtil.ACTIVE || recordingStatus === $N.app.PVRUtil.ACTIVE_IN_SERIES) {
							return task[i].taskId;
						}
					}
				}
			}
			log("getActiveTaskIdForService", "Returning false for service ID: " + serviceId);
			return null;
		},

		/**
		 * Determines if the the event identified by the given id is a currently active task of PVR.
		 * @method isEventRecordingNow
		 * @param {Number} eventId
		 * @return {Boolean} true if the scheduled task for the event is currently active, false otherwise
		 */
		isEventRecordingNow: function (eventId) {
			log("isEventRecordingNow", "Enter");
			var task = getTaskByEvent(eventId, null, "taskType, objectState", true);
			if (task && isTaskObjectActive(task)) {
				log("isEventRecordingNow", "Returning true for event ID: " + eventId);
				return true;
			}
			log("isEventRecordingNow", "Returning false for event ID: " + eventId);
			return false;
		},

		/**
		 * Returns the status of an event recording task given an event object.
		 * @method getRecordingStatusByEvent
		 * @param {Object} event
		 * @return {Number} the status of the scheduled event referenced to the TaskStatus enum, or -1 if task doesn't exist
		 */
		getRecordingStatusByEvent: function (event) {
			log("getRecordingStatusByEvent", "Enter");
			if (event) {
				log("getRecordingStatusByEvent", "event.eventId=" + event.eventId);
				log("getRecordingStatusByEvent", "event.uniqueEventId=" + event.uniqueEventId);
				if (event.uniqueEventId && recordingCache.hasOwnProperty(event.uniqueEventId)) {
					log("getRecordingStatusByEvent", "Exit 1 - Returning status: " + recordingCache[event.uniqueEventId]);
					return recordingCache[event.uniqueEventId];
				}
			}
			log("getRecordingStatusByEvent", "Exit 2 - Returning status UNSCHEDULED");
			return $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_UNSCHEDULED;
		},

		/**
		 * Returns the status of an event recording task given an eventId.
		 * @method getEventRecordingStatus
		 * @param {Number} eventId
		 * @return {Number} the status of the scheduled event referenced to the TaskStatus enum, or -1 if task doesn't exist
		 */
		getEventRecordingStatus: function (eventId) {
			log("getEventRecordingStatus", "Enter - with eventId=" + eventId);
			var event = $N.platform.btv.EPG.getEventById(eventId), // FIXME: this will break for MDS EPG
				eventObject = event ? $N.platform.btv.EPGEventFactory.mapObject(event) : null;
			this.getRecordingStatusByEvent(eventObject);
			log("getEventRecordingStatus", "Exit");
		},

		/**
		 * Returns the status of recording for the given an serviceId.
		 * @method getServiceRecordingStatus
		 * @param {Number} serviceId
		 * @return {Number} the status of the manual recording for service referenced to the TaskStatus enum, or -1 if task doesn't exist
		 */
		getServiceRecordingStatus: function (serviceId) {
			var task = null,
				query = "taskId, taskType, objectState, scheduleType, completeStatus, startTime, endTime",
				event = null,
				taskLength = null,
				i,
				recordingStatus = null;
			task = getTaskArrayByService(serviceId, null, query, TASK_TYPE.RECORDING);
			taskLength = task.length;
			//For Daily and Weekly recording tasks we need to iterate over all the task in array to find which task is active.
			for (i = 0; i < taskLength; i++) {
				if (task[i] && isTaskObjectPVR(task[i])) {
					recordingStatus = getStatusForTask(task[i]);
					if (recordingStatus === $N.app.PVRUtil.ACTIVE || recordingStatus === $N.app.PVRUtil.ACTIVE_IN_SERIES) {
						return recordingStatus;
					}
				}
			}
			log("getServiceRecordingStatus", "Exit - Returning status UNSCHEDULED");
			return $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_UNSCHEDULED;
		},

		/**
		 * Returns the status of a recording task for the given taskId.
		 * @method getTaskRecordingStatus
		 * @param {Object} task
		 * @return {Number} the status of the scheduled task referenced to the TaskStatus enum, or -1 if task doesn't exist
		 */
		getTaskRecordingStatus: function (task) {
			log("getTaskRecordingStatus", "Enter");
			if (task && isTaskObjectPVR(task)) {
				return getStatusForTask(task);
			}
			log("getTaskRecordingStatus", "Exit - Returning status UNSCHEDULED");
			return $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_UNSCHEDULED;
		},

		/**
		 * Check task status if it is series recording
		 */
		isSeriesRecordingForTask: function (task) {
			var recordingStatus = $N.platform.btv.PVRManager.getTaskRecordingStatus(task);
			return recordingStatus === $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_ACTIVE_IN_SERIES || recordingStatus === $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_SCHEDULED_BY_SERIES;
		},

		/**
		 * Returns the authorization status of a recording task.
		 * @method getTaskAuthorizationStatus
		 * @param {Object} task
		 * @return {Bool} the authorization status of the scheduled task.
		 */
		getTaskAuthorizationStatus: function (task) {
			log("getTaskAuthorizationStatus", "Enter");
			if (task && isTaskObjectPVR(task) && task.isAuthorized) {
				return true;
			}
			log("getTaskAuthorizationStatus", "Exit");
			return false;
		},
		/**
		 * Cancels a list of task from an array of task IDs.
		 * @method cancelTasksById
		 * @chainable
		 * @param {Array} taskArray
		 */
		cancelTasksById: function (taskArray) {
			log("cancelTasksById", "Enter");
			var i;
			for (i = 0; i < taskArray.length; i++) {
				this.cancelTaskById(taskArray[i]);
			}
			log("cancelTasksById", "Exit");
			return this;
		},

		/**
		 * Deletes the task with the provided task object, first need to check whether local task or WHPVR task
		 * if it is the only task in a job then the job is also deleted.
		 * If the task is currently active, the task is cancelled first.
		 * @method deleteTask
		 * @chainable
		 * @async
		 * @param {object} the task to be deleted
		 */
		deleteTask: function (task) {
			log("deleteTask", "Enter - taskId = " + task.taskId);
			var tasksForJob = (task.jobId) ? this.getTasksForJobId(task.jobId) : [task],
				removeTaskFromDbAndDelete = function (jobId, taskId) {
					var purgeMetaData = false;
					if (tasksForJob.length === 1) {
						CCOM.Scheduler.deleteJob(jobId);
					}
					CCOM.MediaLibrary.deleteContent(taskId, purgeMetaData);
				},
				stopTaskOKCallback = function (e) {
					removeTaskFromDbAndDelete(task.jobId, task.taskId);
					CCOM.Scheduler.removeEventListener("stopTaskOK", stopTaskOKCallback, false);
				};
			if (!task.isWHPVRTask) {
				if (isTaskObjectActive(task)) {
					CCOM.Scheduler.addEventListener("stopTaskOK", stopTaskOKCallback);
					CCOM.Scheduler.stopTask(task.taskId);
				} else {
					removeTaskFromDbAndDelete(task.jobId, task.taskId);
				}
			} else {
				$N.platform.btv.WHPVRManager.deleteTask(task);
			}
			log("deleteTask", "Exit");
			return this;
		},

		/**
		 * Cancels or stops the recording of the given id. Only active
		 * tasks can be cancelled: the recording is stopped but not deleted.
		 * @method cancelTaskById
		 * @chainable
		 * @async
		 * @param {Number} taskId
		 */
		cancelTaskById: function (taskId) {
			log("cancelTaskById", "Enter - taskId = " + taskId);
			var task = getTaskById(taskId, "objectState, scheduleType, jobId");
			if (this.isTaskRecordingNow(taskId) || isTaskObjectSuspended(task) || (isTaskObjectScheduled(task) && task.recordingType === $N.data.Recording.RECORDING_TYPE.SERIES)) {
				log("cancelTaskById", "Task is recording stopping first - Call CCOM.Scheduler.stopTask - taskId = " + taskId);
				CCOM.Scheduler.stopTask(taskId);
			} else if (isTaskObjectScheduled(task)) {
				this.deleteJob(task.jobId);
			} else {
				log("cancel failed ", taskId);
			}
			log("cancelTaskById", "Exit");
			return this;
		},

		/**
		 * Determines if the given task is part of a recurring recording
		 * @method isRecurringRecording
		 * @param {Object} task the task that we are checking for a recurring recording
		 * @return {Boolean} true if task is part of a recurring recording, false if not
		 */
		isRecurringRecording: function (task) {
			log("isRecurringRecording", "Enter - task = " + $N.apps.util.JSON.stringify(task));
			var job = this.getJob(task.jobId);
			if (job && (job.type === JOB_TYPE.SERIES || job.type === JOB_TYPE.REPEAT)) {
				log("isRecurringRecording", "Returning true for job " + job.jobId);
				return true;
			}
			log("isRecurringRecording", "Returning false for job " + job.jobId);
			return false;
		},

		/**
		 * Checks if the given channel is currently recording
		 * @method isChannelCurrentlyRecording
		 * @param {Object} channel the channel to be checked if is currently recording
		 * @return {Boolean} returns true if channel is being recorded; false otherwise.
		 */
		isChannelCurrentlyRecording: function (channel) {
			log("isChannelCurrentlyRecording", "Enter - channel = " + $N.apps.util.JSON.stringify(channel));
			var activeTasks = getActiveTasks(),
				i;
			for (i = 0; i < activeTasks.length; i++) {
				if (activeTasks[i].serviceId === channel.serviceId) {
					log("isChannelCurrentlyRecording", "Returning true");
					return true;
				}
			}
			log("isChannelCurrentlyRecording", "Returning false");
			return false;
		},

		/**
		 * Determines if recording is protected.
		 * @method isRecordingProtected
		 * @param {Object} taskObject, task object
		 * @return {Boolean} true if task is protected, false if not
		 */
		isRecordingProtected: function (taskObject) {
			log("isRecordingProtected", "Enter - taskId = " + taskObject.taskId);
			var task = null;
			if (taskObject && !taskObject.isWHPVRTask) {
				// local recording object
				task = getTaskById(taskObject.taskId, "keep");
			} else {
				// remote recording object, which are updated asynchronously.
				task = taskObject;
			}

			if (task && task.keep) {
				log("isRecordingProtected", "Returning true");
				return true;
			}
			log("isRecordingProtected", "Returning false");
			return false;
		},

		/**
		 * Sets the task with the given task id to protected.
		 * @method protectRecording
		 * @chainable
		 * @param {Object} taskId Task Id of the task
		 */
		protectRecording: function (taskId) {
			log("protectRecording", "Enter - taskId = " + taskId);
			var task = getTaskById(taskId, "objectState");
			if (task) {
				if (task.objectState < OBJECT_STATE.FINAL) {
					CCOM.Scheduler.updateTask(taskId, {keep: true});
				} else {
					CCOM.MediaLibrary.updateEntry(taskId, {keep: true});
				}
			}
			log("protectRecording", "Exit");
			return this;
		},

		/**
		 * Sets the task with the given task id to unprotected.
		 * @method unprotectRecording
		 * @chainable
		 * @param {Object} taskId Task Id of the task
		 */
		unprotectRecording: function (taskId) {
			log("unprotectRecording", "Enter - taskId = " + taskId);
			var task = getTaskById(taskId, "objectState");
			if (task) {
				if (task.objectState < OBJECT_STATE.FINAL) {
					CCOM.Scheduler.updateTask(taskId, {keep: false});
				} else {
					CCOM.MediaLibrary.updateEntry(taskId, {keep: false});
				}
			}
			log("unprotectRecording", "Exit");
			return this;
		},

		/**
		 * Returns all available recordings (scheduled, partially recorded, fully recorded)
		 * @method getAllRecordings
		 * @param [Boolean=false] asFolders determines whether series recordings are returned as folders.
		 * @return {Array} list of all recordings
		 */
		getAllRecordings: function (asFolders) {
			log("getAllRecordings", "Enter");
			var allTasks = getAllRecordings();
			asFolders = (asFolders === undefined || asFolders === null) ? false : asFolders;
			log("getAllRecordings", "Exit");
			return asFolders ? mapRecordingsToFolder(allTasks) : allTasks;
		},

		/**
		 * Returns all tasks from scheduler that are of type PVR, have not been deleted
		 * and are scheduled or active.
		 * @method getScheduledRecordings
		 * @return {Array} list of PVR tasks
		 */
		getScheduledRecordings: function () {
			log("getScheduledRecordings", "Enter and exit");
			return getScheduledAndNotActiveTasks();
		},

		/**
		 * Returns all recordings that are fully complete.
		 * @method getCompleteRecordings
		 * @param [Boolean=false] asFolders determines whether series recordings are returned as folders.
		 * @return {Array} list of PVR recordings
		 */
		getCompleteRecordings: function (asFolders) {
			log("getCompleteRecordings", "Enter");
			var recordedTasks = getCompletedRecordings();
			asFolders = (asFolders === undefined || asFolders === null) ? false : asFolders;
			log("getCompleteRecordings", "Exit");
			return asFolders ? mapRecordingsToFolder(recordedTasks) : recordedTasks;
		},

		/**
		 * Returns all tasks from scheduler that are of type PVR, have not been deleted
		 * and currently active.
		 * @method getActiveRecordings
		 * @return {Array} list of PVR tasks
		 */
		getActiveRecordings: function () {
			log("getActiveRecordings", "Enter");
			var activeTasks = getActiveTasks();
			log("getActiveRecordings", "Exit");
			return activeTasks;
		},

		/**
		 * Returns all tasks from scheduler that are of type PVR, have not been deleted
		 * and are partially recorded.
		 * @method getPartialRecordings
		 * @return {Array} list of PVR tasks
		 */
		getPartialRecordings: function () {
			log("getPartialRecordings", "Enter");
			var partialRecordings = getPartialRecordings();
			log("getPartialRecordings", "Exit");
			return partialRecordings;
		},

		/**
		 * Returns all tasks from scheduler that are of type PVR, have not been deleted
		 * and are of type timed recording.
		 * @method getTimedRecordings
		 * @return {Array} list of PVR tasks
		 */
		getTimedRecordings: function () {
			log("getTimedRecordings", "Enter and exit");
			return getTimedTasks();
		},

		/**
		 * Gets all series recordings that match a given completion status, or every series recording
		 * if no status is passed in.
		 * @method getSeriesRecordingsByStatus
		 * @param [Number] recordingStatus one of the TaskStatus enum values
		 * @return {Array} a list of all matching series recordings. The array will contain one entry
		 * for each series, with episodes folded under the 'subRecordings' attribute.
		 */
		getSeriesRecordingsByStatus: function (recordingStatus) {
			return mapRecordingsToFolder(getSeriesRecordingsByStatus(recordingStatus));
		},

		/**
		 * Returns a list of all recordings for a given series identified by a seriesId. By default,
		 * this list is returned in the form of a folder with individual episodes in the series available
		 * as 'subRecordings'.
		 * @method getRecordingsBySeries
		 * @param {String} seriesId unique identifier for the series
		 * You may set this to false if you want a flat list of episodes instead.
		 * @return {Array} list of all recordings
		 */
		getRecordingsBySeries: function (seriesId) {
			return mapRecordingsToFolder(getAllRecordingsForSeries(seriesId));
		},

		/**
		 * Determines if the given task is a PVR task and has been recorded.
		 * @method isRecordingComplete
		 * @param {Object} task
		 * @return {Boolean} true if the given task has been recorded, false if not
		 */
		isRecordingComplete: function (task) {
			log("isRecordingComplete", "Enter");
			if (task && isTaskObjectPVR(task) && (task._data.completeStatus === COMPLETION_STATUS_PARTIAL || task._data.completeStatus === COMPLETION_STATUS_FULL)) {
				log("isRecordingComplete", "Returning true");
				return true;
			}
			log("isRecordingComplete", "Returning false");
			return false;
		},

		/**
		 * Returns the progress of a currently recording task.
		 * @method getTaskRecordProgress
		 * @param {Number} taskId
		 * @return {Number} Percentage recorded
		 */
		getTaskRecordProgress: function (taskId) {
			log("getTaskRecordProgress", "Enter");
			var progress = 0,
				task = getTaskById(taskId, "startTime, endTime"),
				currentTime = new Date().getTime();
			if (task && task.startTime < currentTime) {
				if (task.endTime > currentTime) {
					progress = Math.round((currentTime - task.startTime) / (task.endTime - task.startTime) * 100);
				} else {
					progress = 100;
				}
			}
			log("getTaskRecordProgress", "Exit");
			return progress;
		},

		/**
		 * Registers an event listener for uiRefresh as an alternative to the callback.
		 * @method registerUIRefreshListener
		 * @param {Function} listenerFn a function to receive the key
		 * @param {Object} callFunc a reference back to the object containing the listener
		 */
		registerUIRefreshListener: function (listenerFn, callFunc) {
			log("registerUIRefreshListener", "Enter");
			uiRefreshListeners.push({listener: listenerFn, callFunc: callFunc});
			log("registerUIRefreshListener", "Exit");
		},

		/**
		 * Unregisters an event listener for uiRefresh
		 * @method unregisterUIRefreshListener
		 * @param {Function} listener
		 */
		unregisterUIRefreshListener: function (listener) {
			log("unregisterUIRefreshListener", "Enter");
			var i;
			for (i = 0; i < uiRefreshListeners.length; i++) {
				if (uiRefreshListeners[i].listener === listener) {
					uiRefreshListeners.splice(i, 1);
					break;
				}
			}
			log("unregisterUIRefreshListener", "Exit");
		},

		/**
		 * Sets the generic UI update callback function to be called when there have been changes to the
		 * task list, for example when a recording has been set or resolved and the guide is updated with
		 * icons.
		 * @method setUIRefreshCallback
		 * @deprecated use registerUIRefreshListener
		 * @param {Function} callback
		 */
		setUIRefreshCallback: function (callback) {
			log("setUIRefreshCallback", "Enter");
			if (!callback) {
				callback = emptyFunction;
			}
			uIRefreshCallback = callback;
			log("setUIRefreshCallback", "Exit");
		},

		/**
		 * Saves the associated metadata for a recording request to the metadata DB.
		 * Containing any of the following startTime, duration,	softPrepaddingDuration,	softPostpaddingDuration, & keep.
		 * @method updateRecording
		 * @chainable
		 * @param {Number} taskId
		 * @param {Object} reqMetaData JSON style object
		 */
		updateRecording: function (taskId, reqMetaData) {
			log("updateRecording", "Enter");
			CCOM.Scheduler.updateTask(taskId, reqMetaData);
			log("updateRecording", "Exit");
			return this;
		},

		/**
		 * Saves the associated metadata for a recording request to the metadata DB.
		 * Containing any of the following uiFolder & keep.
		 * @method updateRemoteRecordingByTask
		 * @param {Object} task
		 * @param {Object} reqMetaData JSON style object
		 */
		updateRemoteRecordingByTask: function (task, reqMetaData) {
			return WHPVRManager.updateTask(task, reqMetaData);
		},

		/**
		 * Sets the return order of recordings retrieved via the getCompleteRecordings function
		 * @method setRecordingsReturnOrder
		 * @param {Number} returnOrder value retrieved from an enumeration. It is the enumeration constant that is passed.
		 */
		setRecordingsReturnOrder: function (returnOrder) {
			recordingsReturnOrder = returnOrder;
		},

		/**
		 * Gets the return order of recordings retrieved via the getCompleteRecordings function
		 * @method setRecordingsReturnOrder
		 * @return {Number} returnOrder value linked to an enumeration. It is the enumeration constant that is tested.
		 */
		getRecordingsReturnOrder: function (returnOrder) {
			return recordingsReturnOrder;
		},

		/**
		 * Set the default padding used if either prepadding or postpadding
		 * is not in the metadata provided to requestTimeRecording or
		 * requestEventRecording. Set to null to stop the default padding
		 * from being used.
		 * @method setDefaultPadding
		 * @chainable
		 * @param {Number} padding The default padding in seconds
		 */
		setDefaultPadding: function (padding) {
			defaultPadding = padding * 1000; // in milliseconds
			return this;
		},

		/**
		 * Get the default padding, if the return value is null then
		 * default padding is not being used.
		 * @method getDefaultPadding
		 * @return {Number} The default padding in seconds
		 */
		getDefaultPadding: function () {
			return defaultPadding / 1000; // in seconds
		},

		/**
		 * Allows query of CCOM Tasks db using passed in fields, selection criteria and sort order
		 * @method getTasksByQuery
		 * @param {String} fields the fields to be retrieved (the select clause). Default is * (all fields)
		 * @param {String} criteria the selection criteria (the where clause)
		 * @param {String} order the order by clause
		 * @return {Array} list of PVR tasks
		 */
		getTasksByQuery: function (fields, criteria, order) {
			log("getTasksByQuery", "Enter");
			var tasksByQuery = getTasksByQuery(fields, criteria, order);
			log("getTasksByQuery", "Exit");
			return tasksByQuery;
		},

		/**
		 * Allows query of CCOM Tasks db using passed in fields, selection criteria and sort order
		 * @method getEntriesByQuery
		 * @param {String} fields the fields to be retrieved (the select clause). Default is * (all fields)
		 * @param {String} criteria the selection criteria (the where clause)
		 * @param {String} order the order by clause
		 * @return {Array} list of PVR tasks
		 */
		getEntriesByQuery: function (fields, criteria, order) {
			log("getEntriesByQuery", "Enter");
			var entriesByQuery = getEntriesByQuery(fields, criteria, order);
			log("getEntriesByQuery", "Exit");
			return entriesByQuery;
		},

		/**
		 * Allows query of CCOM Tasks db to count number of records matching input criteria
		 * @method countTasksByQuery
		 * @param {String} criteria the selection criteria (the where clause)
		 * @return {Number} number of rows matched
		 */
		countTasksByQuery: function (criteria) {
			log("countTasksByQuery", "Enter");
			var countByQuery = countTasksByQuery(criteria);
			log("countTasksByQuery", "Exit");
			return countByQuery;
		},

		/**
		 * Number of seconds that recording should be kept for if
		 * no not protected and scheduler is set to auto delete
		 * @property {Number} DEFAULT_KEEP_TIME
		 * @deprecated no keep time in OTV5
		 */
		DEFAULT_KEEP_TIME: 2592000, // no of seconds representing 30 days


		/**
		 * Enumeration of Schedule Tasks End Statuses.
		 * Possible values are `TASK_END_REASON_NORMAL`, `TASK_END_REASON_USER`,
		 * `TASK_END_REASON_OFFLINE`, & `TASK_END_REASON_SPACE`.
		 * @property {Number} EndStatus
		 */
		EndStatus: {
			//TODO: implement these
			//TASK_END_REASON_NORMAL: ScheduleTask.TASK_END_REASON_NORMAL,
			//TASK_END_REASON_USER: ScheduleTask.TASK_END_REASON_USER,
			//TASK_END_REASON_OFFLINE: ScheduleTask.TASK_END_REASON_OFFLINE,
			//TASK_END_REASON_SPACE: ScheduleTask.TASK_END_REASON_SPACE
		},
		/**
		 * Enumeration of Schedule Tasks Statuses.
		 * Possible values are `TASK_STATUS_SCHEDULED`, `TASK_STATUS_ACTIVE`, `TASK_STATUS_PARTIAL`,
		 * `TASK_STATUS_COMPLETED`, `TASK_STATUS_FAILED`, `TASK_STATUS_ALTCOMPLETED`, `TASK_STATUS_DELETED`.
		 * @property {Number} TaskStatus
		 */
		TaskStatus: {
			//TODO: implement remaining statuses
			// TASK_STATUS_UNKNOWN: -1,
			TASK_STATUS_UNSCHEDULED: 1,
			TASK_STATUS_SCHEDULED: 2,
			TASK_STATUS_SCHEDULED_BY_SERIES: 3,
			TASK_STATUS_ACTIVE: 4,
			TASK_STATUS_ACTIVE_IN_SERIES: 5,
			TASK_STATUS_PARTIAL: 6,
			TASK_STATUS_COMPLETED: 7
			//TASK_STATUS_FAILED: ,
			//TASK_STATUS_ALTCOMPLETED: ,
			//TASK_STATUS_DELETED:
		},
		/**
		 * Enumeration of Schedule Tasks Failed Reasons.
		 * Possible values are `TASK_STATUS_REASON_INTERRUPTED`, `TASK_STATUS_REASON_LATE`,
		 * `TASK_STATUS_REASON_USER`, `TASK_STATUS_REASON_SPACE`, `TASK_STATUS_REASON_RESOURCE`,
		 * `TASK_STATUS_REASON_URI`, `TASK_STATUS_REASON_PLAYER` and `TASK_STATUS_REASON_RECORDER`.
		 * @property {Number} FailReason
		 */
		FailReason: {
			//TODO: implement these
			// TASK_STATUS_REASON_INTERRUPTED: ,
			// TASK_STATUS_REASON_LATE: ,
			// TASK_STATUS_REASON_USER: ,
			// TASK_STATUS_REASON_SPACE: ,
			// TASK_STATUS_REASON_RESOURCE: ,
			// TASK_STATUS_REASON_URI: ,
			// TASK_STATUS_REASON_PLAYER: ,
			// TASK_STATUS_REASON_RECORDER:
		},
		/**
		 * Enumeration of Frequency of recordings.
		 * Possible values are `ONCE`, `DAILY`, `WEEKLY`, `WEEKDAYS`, `WEEKENDS`
		 * @property {Number} Frequency
		 */
		Frequency: {
			ONCE: 1,
			DAILY: 2,
			WEEKLY: 3,
			WEEKDAYS: 4,
			WEEKENDS: 5
		},

		/**
		 * Enumeration of Return Order Types.
		 * Possible values are `BY_DATE`, `BY_DATE_DESC`, `BY_NAME`
		 * @property {Number} RecordingsReturnOrderType
		 */
		RecordingsReturnOrderType: {
			BY_DATE: 1,
			BY_DATE_DESC: 2,
			BY_NAME: 3
		},

		/**
		 * @method getPlayableRecordings
		 * @return {Array} All non-future recordings
		 */
		getPlayableRecordings: function () {
			var mediumId = $N.app.PVRCapability.getCurrentMediaId() || -1,
				whereSqlQueryString = "taskType='REC' AND objectState<6 AND objectState>0 AND objectState!=2 AND mediumID = '" + mediumId + "'",
				recordings = getEntriesByQuery(WIDE_TASK_FIELD_FILTER, whereSqlQueryString, "uiFolder DESC"),
				compareFolderName = function (a, b) {
					var firstElement = a.uiFolder || a._data.uiFolder,
						secondElement = b.uiFolder || b._data.uiFolder;
					if (firstElement === secondElement) {
						return 0;
					} else if ((firstElement && secondElement && firstElement > secondElement) || (firstElement && !secondElement)) {
						return -1;
					}
					return 1;
				};
			recordings = recordings.concat($N.platform.btv.WHPVRManager.getAllRecordingsFromWHPVRServers());
			return recordings.sort(compareFolderName);
		},

		/**
		 * @method getPlayableRecordingsByFolderName
		 * @param {String} folderName
		 * @return {Array} of tasks
		 */
		getPlayableRecordingsByFolderName: function (folderName) {
			folderName = folderName || "";
			var mediumId = $N.app.PVRCapability.getCurrentMediaId() || -1,
				data = null,
				whereSqlQueryString = "taskType='REC' AND objectState<6 AND objectState>0 AND mediumID = '" +
					mediumId + "' AND uiFolder = '" + $N.app.StringUtil.escapeApostrophes(folderName) + "'";
			if (folderName) {
				data = getEntriesByQuery(WIDE_TASK_FIELD_FILTER, whereSqlQueryString, "startTime DESC");
				data = data.concat($N.platform.btv.WHPVRManager.getAllRecordingsByFolderName(folderName));
			}
			return data;
		},

		/**
		 * @method getRemoteRecordingsByFolder
		 * @param {String} folderName
		 * @return {Array} of tasks
		 */
		getRemoteRecordingsByFolder: function (folderName) {
			return $N.platform.btv.WHPVRManager.getAllRecordingsByFolderName(folderName);
		},

		/**
		 * @method isLocalRecording
		 * @param {Object} task
		 * @return {Boolean} check if the task is local recording
		 */
		isLocalRecording: function (task) {
			if (task && !task.isWHPVRTask) {
				return true;
			}
			return false;
		},

		/**
		 * @method getTVName
		 * @param {Object} recording
		 * @return {String} remote tv name
		 */
		getTVName: function (recording) {
			if (recording && !this.isLocalRecording(recording)) {
				return WHPVRManager.getTVNameByRecording(recording);
			}
			return "";
		},

		/**
		 * @method isLocalRecordServer
		 * @return {Boolean} check if record server is local(or remote)
		 */
		isLocalRecordServer: function () {
			return $N.platform.btv.WHPVRManager.isLocalRecordServer();
		},

		/**
		 * @method getPlayableRecordingsByTitle
		 * @return {Array} All non-future recordings
		 */
		getPlayableRecordingsByTitle: function (title, properties, successCallback, failureCallback, exactMatch, sort, isQueryAdultEvent) {
			log("getPlayableRecordingsByTitle", "enter");
			log("getPlayableRecordingsByTitle", title);
			var order = sort || "title DESC",
				recordings = [],
				result,
				fieldList = properties || WIDE_TASK_FIELD_FILTER,
				criteria,
				i,
				alphabeticSortRecordings = function (array) {
					var compareFunction = function (a, b) {
							var aTitle = a.title,
								bTitle = b.title;
							aTitle = a.title.toLowerCase();
							bTitle = a.title.toLowerCase();
							if (aTitle < bTitle) {
								return -1;
							}
							if (aTitle > bTitle) {
								return 1;
							}
							return 0;
						};
					array.sort(compareFunction);
					return array;
				};

			searchRecordingResult = [];
			searchRecordingCompleteCallback = function () {
				alphabeticSortRecordings(searchRecordingResult);
				log("searchRecordingCompleteCallback", "searchRecordingResult length: " + searchRecordingResult.length);
				successCallback(searchRecordingResult);
			};
			searchRecordingDataCallback = function (result) {
				for (i = 0; i < result.length; i++) {
					searchRecordingResult.push(result[i]);
				}
			};
			if ($N.app.FeatureManager.isPVREnabled()) {
				criteria = $N.app.SearchCriteriaUtil.getLocalPlayableRecordingsByTitleCriteria(title, exactMatch, isQueryAdultEvent);
				log("getPlayableRecordingsByTitle", "criteria: " + criteria);
				result = CCOM.Scheduler.getTasksRSByQuery(fieldList, criteria, order);
				if (!result.error) {
					searchRecordingResult = getArrayFromResultSet(result);
				} else {
					this._log("getPlayableRecordingsByTitle", "Error from CCOM.Scheduler.getTasksRSByQuery : " + result.error.name + " " + result.error.message, $N.apps.core.Log.LOG_ERROR);
				}
			}
			if ($N.platform.btv.WHPVRManager.isEnabled() && $N.platform.system.Network.isNetworkAvailable($N.platform.system.Network.NetworkType.ETHERNET)) {
				criteria = "dc:title contains '" + title + "'";
				$N.platform.btv.WHPVRManager.searchByCriteria(criteria, null, searchRecordingDataCallback, searchRecordingCompleteCallback, null, null);
			} else {
				successCallback(searchRecordingResult);
			}
		},

		/**
		 * @method getPlayableRecordingsByActorsDirector
		 * @return {Array} All non-future recordings
		 */
		getPlayableRecordingsByActorsDirector: function (actor, properties, successCallback, failureCallback, exactMatch, sort, isQueryAdultEvent) {
			log("getPlayableRecordingsByActorsDirector", "enter");
			log("getPlayableRecordingsByActorsDirector", actor);
			var order = sort || "title DESC",
				recordings = [],
				result,
				fieldList = properties || WIDE_TASK_FIELD_FILTER,
				criteria;

			criteria = $N.app.SearchCriteriaUtil.getLocalPlayableRecordingsByActorsDirectorCriteria(actor, exactMatch, isQueryAdultEvent);
			log("getPlayableRecordingsByActorsDirector", "criteria: " + criteria);
			result = CCOM.Scheduler.getTasksRSByQuery(fieldList, criteria, order);
			if (!result.error) {
				recordings = getArrayFromResultSet(result);
				successCallback(recordings);
			} else {
				failureCallback();
				this._log("getPlayableRecordingsByActorsDirector", "Error from CCOM.Scheduler.getTasksRSByQuery : " + result.error.name + " " + result.error.message, $N.apps.core.Log.LOG_ERROR);
			}
		},

		/**
		 * @method getPlayableRecordingsByKeyword
		 * @return {Array} All non-future recordings
		 */
		getPlayableRecordingsByKeyword: function (keyword, properties, successCallback, failureCallback, exactMatch, sort, isQueryAdultEvent) {
			log("getPlayableRecordingsByKeyword", "enter");
			log("getPlayableRecordingsByKeyword", keyword);
			var order = sort || "title DESC",
				recordings = [],
				result,
				fieldList = properties || WIDE_TASK_FIELD_FILTER,
				criteria;

			criteria = $N.app.SearchCriteriaUtil.getLocalPlayableRecordingsByKeywordCriteria(keyword, exactMatch, isQueryAdultEvent);
			log("getPlayableRecordingsByKeyword", "criteria: " + criteria);
			result = CCOM.Scheduler.getTasksRSByQuery(fieldList, criteria, order);
			if (!result.error) {
				recordings = getArrayFromResultSet(result);
				successCallback(recordings);
			} else {
				failureCallback();
				this._log("getPlayableRecordingsByKeyword", "Error from CCOM.Scheduler.getTasksRSByQuery : " + result.error.name + " " + result.error.message, $N.apps.core.Log.LOG_ERROR);
			}
		},

		/**
		 * Get all schedule tasks including local and WHPVR
		 * @method getScheduleTasks
		 * @return {Array} all schedule tasks
		 */
		getScheduleTasks: function () {
			var tasks = getTasksByQuery(WIDE_TASK_FIELD_FILTER, "taskType='REC' AND objectState <= " + OBJECT_STATE.STOP_PROCESSING + " AND fulfillmentStatus < 4 AND fulfillmentStatus > 1", "startTime");
			tasks = tasks.concat($N.platform.btv.WHPVRManager.getAllSchedulesFromWHPVRServers());
			return tasks;
		},

		/**
		 * Check if the task is blocked
		 * @method isTaskBlocked
		 * @return {Boolean}
		 */
		isTaskBlocked: function (task) {
			var tmpTask;
			if (task && !task.isWHPVRTask) {
				tmpTask = $N.platform.btv.PVRManager.getTask(task.taskId, "PlayedBlocked");
				if (tmpTask && tmpTask._data && tmpTask._data.PlayedBlocked) {
					return (tmpTask._data.PlayedBlocked === PLAYBACK_STATE.PLAYED_BLOCKED || tmpTask._data.PlayedBlocked === PLAYBACK_STATE.UNPLAYED_BLOCKED);
				}
			}
			/*TODO check WHPVR recording block status*/
			return false;
		},

		/**
		 * @method isTaskPlayed
		 * @return {Boolean}
		 */
		isTaskPlayed: function (task) {
			var tmpTask;
			if (task && !task.isWHPVRTask) {
				// Changed to use bookmark instead of PlayedBlocked field as TeleIdea are not using this (R1 -> R2)
				tmpTask = getTaskById(task.taskId, "bookmark", false);
				if (tmpTask && tmpTask._data && (tmpTask._data.bookmark || tmpTask._data.bookmark === 0)) {
					return true;
				}
			} else if (task && task.isWHPVRTask) {
				return task.isPlayed;
			}
			return false;
		},

		addEventListener: function (event, callback) {
			if (event && callback) {
				if (!eventListeners[event]) {
					eventListeners[event] = [];
				}
				if (!eventListeners[event].filter(function (listener) {
						return (listener === callback);
					}).length) {
					eventListeners[event].push(callback);
				}
			}
		},

		removeEventListener: function (event, callback) {
			if (event && callback && eventListeners[event]) {
				eventListeners[event] = eventListeners[event].filter(function (listener) {
					return (listener !== callback);
				});
			}
		},
		getJobByQuery: getJobByQuery,
		WIDE_TASK_FIELD_FILTER: WIDE_TASK_FIELD_FILTER
	};
}());
