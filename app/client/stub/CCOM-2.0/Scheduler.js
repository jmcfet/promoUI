/*global ResultSet*/
/**
 * Stub for CCOM 2.0 Scheduler
 */

var CCOM = CCOM || {};

CCOM.Scheduler = CCOM.Scheduler || (function () {
	var currentTime = new Date().getTime(),
		JOBS = [],
		TASKS = [
			{eventId: '106', uiFolder: '/The Story of Film', serviceId: '120', taskId: '001', jobId: '007', isAuthorized: true, taskType: 'REC', title: 'The Story Of Film 1', shortDesc: "The explosive story of film in the late 50s and 60s. The great movie star Claudia Cardinale talks exclusively about Federico Fellini.", startTime: currentTime - 3600000 * 6, endTime: currentTime - 3600000 * 7},
			{eventId: '108', serviceId: '120', taskId: '002', jobId: '008', isAuthorized: true, taskType: 'REC', title: 'The Story Of Film 2 - The explosive story of film in the late 50s and 60s', shortDesc: "The explosive story of film in the late 50s and 60s. The great movie star Claudia Cardinale talks exclusively about Federico Fellini.", startTime: currentTime - 3600000 * 6, endTime: currentTime - 3600000 * 7}
		],

		eventListeners = {},
		taskOverlapsHandle = 0,
		taskAllOptionsHandle = 0,
		raiseEvent = function (event, parameter) {
			var listeners = eventListeners[event],
				i;
			if (listeners) {
				for (i = 0; i < listeners.length; i++) {
					listeners[i](parameter);
				}
			}
		};

	function createTask(taskType, jobType, jobObject) {
		var time = new Date().getTime(),
			taskObject = {};
		taskObject.jobId = jobObject.jobId;
		taskObject.taskId = TASKS.length + 1;
		taskObject.taskType = taskType;
		taskObject.eventId = jobObject.eventId;
		taskObject.startTime = jobObject.startTime || jobObject.timeOfDay;
		taskObject.endTime = jobObject.endTime || jobObject.startTime + jobObject.duration;
		taskObject.unscheduled = jobObject.unscheduled;
		taskObject.taskOpState = taskObject.startTime < time && taskObject.endTime > time ? 5 : 0;
		taskObject.objectState = 0; // Scheduled
		taskObject.serviceId = jobObject.serviceId || jobObject.eventId + "s";
		taskObject.duration = jobObject.duration;
		taskObject.title = jobObject.title;
		taskObject.softPostpaddingDuration = jobObject.softPostpaddingDuration;
		taskObject.softPrepaddingDuration = jobObject.softPrepaddingDuration;
		taskObject.keep = jobObject.keep;
		taskObject.toSource = function () { return ""; };
		taskObject.scheduleType = jobType;
		if (time < taskObject.startTime) {
			taskObject.objectState = 0; // Scheduled
			taskObject.completeStatus = 1;
		} else if (time > taskObject.endTime) {
			taskObject.objectState = 5; // Recorded
			taskObject.completeStatus = 3;
		} else {
			taskObject.objectState = 1; // Active
			taskObject.completeStatus = 1;
		}
		return taskObject;
	}

	function getFulfillmentStatusObjForTask(task, fulfillmentStatus) {
		return {
			taskId: task.taskId,
			jobId: task.jobId,
			taskType: task.taskType,
			startTime: task.startTime,
			duration: task.endTime,
			fulfillmentStatus: fulfillmentStatus
		};
	}

	return {
		//AddTaskFailedReason
		BAD_PARAM: 1,
		BAD_STATE: 2,
		DUPLICATE_JOB: 3,
		DUPLICATE_TASK: 4,
		EXPIRATION_EARLIER_THAN_START: 5,
		INVALID_EVENT_ID: 6,
		OUT_OF_MEMORY: 7,
		SYSTEM_ERROR: 8,
		TOO_MANY_JOBS: 9,
		TOO_MANY_TASKS: 10,
		TYPE_INVALID: 11,
		//CompleteStatus
		BAD_PARAMETERS: 101,
		SUCCESS_COMPLETE: 102,
		SYSTEM_ERROR: 103,
		//FulfillmentStatus
		FULL: 201,
		INVALID: 202,
		NONE: 203,
		PARTIAL: 204,

		getCurrentTasksStatus: function () {
			return {
				currentTasksStatus: {}
			};
		},

		getJobsPriority: function (jobIdArray) {
			return {
				jobPriorityArray: []
			};
		},

		getTaskOverlapsOptions: function (taskId,expandWindow,showAllOptions) {
			raiseEvent ("getTaskOverlapsOptionsFailed",
				{
					error: {
						domain: "com.opentv.Scheduler",
						name: "Failed",
						message: ""
					}
				});
			return null;
		},

		getTaskStateInfo: function (taskId) {
			return {
				objState: 0,
				currentStatus: 0,
				cumulativeStatus: 0
			};
		},

		getprogressTask: function (taskId) {
			raiseEvent ("getprogressTaskOK",{DownloadStatus:0} );
			return {};
		},

		jobCreate: function (taskType,scheduleType,addInfo,clientCB,clientData) {
			raiseEvent ("jobCreateFailed",
				{
					error: {
						domain: "com.opentv.Scheduler",
						name: "Failed",
						message: ""
					}
				});
			return null;
		},

		jobDelete: function (jobId) {
			raiseEvent ("jobDeleteFailed",
				{
					error: {
						domain: "com.opentv.Scheduler",
						message: ""
					}
				});
			return null;
		},

		jobRegister: function (taskType,scheduleType,jobId,clientCB,clientData) {
			raiseEvent ("jobRegisterFailed",
				{
					error: {
						domain: "com.opentv.Scheduler",
						name: "Failed",
						message: ""
					}
				});
			return null;
		},

		pauseTask: function (taskId) {
			raiseEvent ("pauseTaskFailed",
				{
					error: {
						domain: "com.opentv.Scheduler",
						message: ""
					}
				});
			return null;
		},

		prioritizeTasks: function (prioritizeTaskIds,allTaskIds) {
			raiseEvent ("prioritizeTasksFailed",
				{
					error: {
						domain: "com.opentv.Scheduler",
						message: ""
					}
				});
			return null;
		},

		reorderJobs: function (jobIdArray) {
			raiseEvent ("reorderJobsFailed",
				{
					error: {
						domain: "com.opentv.Scheduler",
						name: "Failed",
						message: ""
					}
				});
			return null;
		},

		reorderTasks: function (taskIdArray) {
			raiseEvent ("reorderTasksFailed",
				{
					error: {
						domain: "com.opentv.Scheduler",
						name: "Failed",
						message: ""
					}
				});
			return null;
		},

		unpauseTask: function (taskId) {
			raiseEvent ("unpauseTaskFailed",
				{
					error: {
						domain: "com.opentv.Scheduler",
						name: "Failed",
						message: ""
					}
				});
			return null;
		},

		updateJob: function (jobId,updateInfo) {
			raiseEvent ("updateJobFailed",
				{
					error: {
						domain: "com.opentv.Scheduler",
						name: "Failed",
						message: ""
					}
				});
			return null;
		},

		updateTask: function (taskId,updateInfo) {
			raiseEvent ("updateTaskFailed",
				{
					error: {
						domain: "com.opentv.Scheduler",
						name: "Failed",
						message: ""
					}
				});
			return null;
		},

		getTasksRSByWindow: function (properties,criteria,startTime,endTime) {
			return {
				error: {
					domain: "com.opentv.Scheduler",
					name: "OperationFailed",
					message: ""
				}
			};
		},

		getJobsRSByQuery: function (fields, criteria, order) {
			var results = [],
				i,
				rs;
			if (criteria.substr(0, 5) === "jobId") {
				for (i = 0; i < JOBS.length; i++) {
					if (String(JOBS[i].jobId) === criteria.substring(7, criteria.length - 1)) {
						results.push(JOBS[i]);
					}
				}
			} else if (criteria.substr(0, 7) === "eventId") {
				for (i = 0; i < JOBS.length; i++) {
					if (String(JOBS[i].eventId) === criteria.substring(9, criteria.length - 1)) {
						results.push(JOBS[i]);
					}
				}
			}
			rs = new ResultSet(results);
			return rs;
		},

		getTasksRSByQuery: function (fields, criteria, order) {
			var results = [],
				titleEndPosition,
				i,
				rs;
			if (criteria.substr(0, 6) === "taskId") {
				for (i = 0; i < TASKS.length; i++) {
					if (String(TASKS[i].taskId) === criteria.substring(8, criteria.length - 1)) {
						results.push(TASKS[i]);
					}
				}
			} else if (criteria.substr(0, 5) === "jobId") {
				for (i = 0; i < TASKS.length; i++) {
					if (String(TASKS[i].jobId) === criteria.substring(7, criteria.length - 1)) {
						results.push(TASKS[i]);
					}
				}
			} else if (criteria.substr(0, 7) === "eventId") {
				for (i = 0; i < TASKS.length; i++) {
					if (String(TASKS[i].eventId) === criteria.substring(9, criteria.length - 1)) {
						results.push(TASKS[i]);
					}
				}
			} else if (criteria.substr(0, 5) === "title") {
				if (criteria.substr(6, 7) === "LIKE '%") {
					titleEndPosition = criteria.indexOf("%", 13);
					for (i = 0; i < TASKS.length; i++) {
						if (String(TASKS[i].title).toLowerCase().indexOf(criteria.substring(13, titleEndPosition).toLowerCase()) !== -1) {
							results.push(TASKS[i]);
						}
					}
				} else {
					titleEndPosition = criteria.indexOf("'", 12);
					for (i = 0; i < TASKS.length; i++) {
						if (String(TASKS[i].title).toLowerCase() === criteria.substring(12, titleEndPosition).toLowerCase()) {
							results.push(TASKS[i]);
						}
					}
				}
			} else if (criteria.substr(0, 31) === "taskType='REC' AND objectState=") {
				for (i = 0; i < TASKS.length; i++) {
					if (String(TASKS[i].objectState) === criteria.substring(33, criteria.length - 1)) {
						results.push(TASKS[i]);
					}
				}
			} else if (criteria.substr(0, 50) === "taskType='REC' AND unscheduled=0 AND (objectState=") {
				for (i = 0; i < TASKS.length; i++) {
					if (String(TASKS[i].objectState) === criteria.substring(51, criteria.length - 2)) {
						results.push(TASKS[i]);
					}
				}
			} else if (fields === "COUNT(*) as count") {
				results.push({count: 3});
			} else if (criteria === "taskType='REC' AND objectState<6 AND objectState>0 AND objectState!=2 AND inactive=0 AND mediumID = '-1'") {
				results = TASKS;
			}
			rs = new ResultSet(results);
			return rs;
		},

		getEntryRSByQuery: function (fields, criteria, order) {
			var results = [],
				i,
				rs;
			if (criteria.substr(0, 34) === "taskType='REC' AND completeStatus=" && criteria.substr(35, 18) === " AND (objectState=" && criteria.substr(54, 16) === " OR objectState=") {
				for (i = 0; i < TASKS.length; i++) {
					if (String(TASKS[i].completeStatus) === criteria.substr(34, 1) && (String(TASKS[i].objectState) === criteria.substr(53, 1) || String(TASKS[i].objectState) === criteria.substr(70, 1))) {
						results.push(TASKS[i]);
					}
				}
			} else if (criteria.substr(0, 31) === "taskType='REC' AND objectState<" && criteria.substr(32, 56) === " AND (scheduleType='ONE_TIME' OR scheduleType='RPT_TIME'") {
				for (i = 0; i < TASKS.length; i++) {
					if (TASKS[i].objectState < parseInt(criteria.substr(31, 1), 10) && (TASKS[i].scheduleType === "ONE_TIME" || TASKS[i].scheduleType === "RPT_TIME")) {
						results.push(TASKS[i]);
					}
				}
			} else if (criteria.substr(0, 32) === "taskType='REC' AND (objectState=" && criteria.substr(33, 16) === " OR objectState=") {
				for (i = 0; i < TASKS.length; i++) {
					if (String(TASKS[i].objectState) === criteria.substr(34, 1) || String(TASKS[i].objectState) === criteria.substr(49, 1)) {
						results.push(TASKS[i]);
					}
				}
			} else if (criteria.substr(0, 31) === "taskType='REC' AND objectState=") {
				for (i = 0; i < TASKS.length; i++) {
					if (String(TASKS[i].objectState) === criteria.substring(33, criteria.length - 1)) {
						results.push(TASKS[i]);
					}
				}
			} else if (criteria.substr(0, 50) === "taskType='REC' AND unscheduled=0 AND (objectState=") {
				for (i = 0; i < TASKS.length; i++) {
					if (String(TASKS[i].objectState) === criteria.substring(51, criteria.length - 2)) {
						results.push(TASKS[i]);
					}
				}
			} else {
				results = TASKS;
			}
			rs = new ResultSet(results);
			return rs;
		},

		addJob: function (taskType, jobType, jobObject) {
			var jobId = JOBS.length + 1,
				taskObject = {},
				now = new Date(),
				currentDayIndex = now.getDay() - 1 < 0 ? 6 : now.getDay() - 1,
				hours,
				mins,
				taskStartDate,
				i,
				daysDifferenceFromNow,
				MS_PER_DAY = 86400000;
			jobObject.jobId = jobId;
			jobObject.type = jobType;
			jobObject.taskType = taskType;
			jobObject.toSource = function () { return ""; };
			JOBS.push(jobObject);
			if (jobType === "RPT_TIME" && jobObject.repeatDaysArray && jobObject.timeOfDay) {
				i = 0;
				hours = Math.floor(jobObject.timeOfDay / 3600);
				mins = (jobObject.timeOfDay - (hours * 3600)) / 60;
				for (i = 0; i < jobObject.repeatDaysArray.length; i++) {
					if (jobObject.repeatDaysArray[i]) {
						daysDifferenceFromNow = i - currentDayIndex < 0 ? 6 - currentDayIndex + i + 1 : i - currentDayIndex;
						taskStartDate = new Date(now.getTime() + daysDifferenceFromNow * MS_PER_DAY);
						taskStartDate.setHours(hours);
						taskStartDate.setMinutes(mins);
						taskStartDate.setMilliseconds(0);
						jobObject.startTime = taskStartDate.getTime();
						jobObject.endTime =  jobObject.startTime + jobObject.duration;
						taskObject = createTask(taskType, jobType, jobObject);
						TASKS.push(taskObject);
					}
				}
			} else {
				var evt = CCOM.EPG.getEventById( jobObject.eventId );
				if( evt )   {
					jobObject.startTime = evt.startTime;
					jobObject.endTime = evt.endTime;
					jobObject.title = evt.title;
					jobObject.serviceId = evt.serviceId;
				}
				taskObject = createTask(taskType, jobType, jobObject);
				TASKS.push(taskObject);
			}
			raiseEvent("onAddJobCompleted", {'jobId': jobId});
			return jobId;
		},

		stopTask: function (taskId) {
			var i;
			for (i = 0; i < TASKS.length; i++) {
				if (TASKS[i].taskId === taskId) {
					TASKS[i].objectState = 5;
					TASKS[i].completeStatus = 2;
					break;
				}
			}
		},

		deleteJob: function (id) {
			var i;
			for (i = 0; i < JOBS.length; i++) {
				if (JOBS[i].jobId === id) {
					JOBS.splice(i, 1);
				}
			}
			for (i = TASKS.length - 1; i >= 0; i--) {
				if (TASKS[i].jobId === id) {
					TASKS.splice(i, 1);
				}
			}
		},

		addEventListener: function (event, callback) {
			if (eventListeners[event] === undefined) {
				eventListeners[event] = [];
			}
			eventListeners[event].push(callback);
		},

		removeEventListener: function (event, callback) {
			var listeners = eventListeners[event],
				i;
			if (listeners) {
				for (i = 0; i < listeners.length; i++) {
					if (listeners[i] === callback) {
						listeners.splice(i, 1);
					}
				}
			}
		},

		resetTasksAndJobs: function () {
			JOBS = [];
			TASKS = [];
		},

		updateTask: function (taskId, metaData) {
			var i,
				property;
			for (i = 0; i < TASKS.length; i++) {
				if (TASKS[i].taskId === taskId) {
					for (property in metaData) {
						if (metaData.hasOwnProperty(property)) {
							TASKS[i][property] = metaData[property];
						}
					}
					break;
				}
			}
		},

		fireEvent: raiseEvent,

		getTaskOverlaps: function (taskId) {
			var fulfillmentStatus,
				task = $N.platform.btv.PVRManager.getTask(taskId),
				conflictingTasks = [getFulfillmentStatusObjForTask(task, 3)],
				i;
			taskOverlapsHandle++;
			for (i = 0; i < TASKS.length; i++) {
				if (TASKS[i].taskId !== taskId && ((TASKS[i].startTime >= task.startTime && TASKS[i].startTime < task.endTime)
					|| (TASKS[i].endTime > task.startTime && TASKS[i].endTime < task.endTime)
					|| (TASKS[i].startTime <= task.startTime && TASKS[i].endTime >= task.endTime))) {
					fulfillmentStatus = conflictingTasks.length > 1 ? 1 : 3;
					conflictingTasks.push(getFulfillmentStatusObjForTask(TASKS[i], fulfillmentStatus));
				}
			}
			setTimeout(function () {
				raiseEvent("getTaskOverlapsOK", {taskOverlaps: conflictingTasks, handle: taskOverlapsHandle});
			}, 10);
			return taskOverlapsHandle;
		},

		getTaskAllOptions: function (time) {
			var fulfillmentStatus,
				conflictingTasks = [],
				i;
			taskAllOptionsHandle++;
			for (i = 0; i < TASKS.length; i++) {
				if (TASKS[i].startTime <= time && TASKS[i].endTime > time) {
					fulfillmentStatus = conflictingTasks.length > 1 ? 1 : 3;
					conflictingTasks.push(getFulfillmentStatusObjForTask(TASKS[i], fulfillmentStatus));
				}
			}
			conflictingTasks = conflictingTasks.length > 1 ? conflictingTasks : [];
			setTimeout(function () {
				raiseEvent("getTaskAllOptionsOK", {allTaskIds: conflictingTasks, handle: taskAllOptionsHandle});
			}, 10);
			return taskAllOptionsHandle;
		},

		getLastAddedTask: function () {
			return TASKS[TASKS.length - 1];
		}
	};
}());


