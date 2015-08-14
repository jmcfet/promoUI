
/**
 * Some fields are added by us instead of MW
 *
 * schedule:
 * getTasksHandle: get all tasks of one schedule
 * allTasks: all tasks of the schedule
 * deleteHandle: handle when delete the schedule
 * createHandle: handle when create one schedule
 * recordingType: indicate single or series schedule when create one new schedule (not available for those schedules created by client)
 * getScheduleHandle: one schedule is added on server, handle to get it
 *
 * task:
 * whpvrDevice: indicate the device of the task belongs to
 * deleteHandle: handle when delete the task
 * getTaskHandle: get the task when task added of task updated
 * gettaskConflictHandle: handle when get the task conflicts
 * */
var $N = $N || {};
$N.platform = $N.platform || {};
$N.platform.btv = $N.platform.btv || {};

function WHPVRScheduler(device) {
	var log = new $N.apps.core.Log("WHPVR", "WHPVRScheduler"),
		whpvrDevice = device,
		HNInstObject = CCOM.HomeNetworking.getInstance({uuid: device.udn}),
		HNInst = HNInstObject.instance,
		allSchedules = [],
		schedulerHandle = null,
		MAX_COUNT = 100,
		SCHEDULE_TYPE = {
			MANUAL: 1,
			CDS_SERVICE: 2,
			CDS_EVENT: 3,
			BY_MATCHING_NAME: 4,
			BY_MATCHING_ID: 5
		},
		MatchingIdType = {
			PROGRAM_ID: 1,
			SERIES_ID: 2
		},
		MatchingEpisodeType = {
			ALL: 1,
			FIRST_RUN: 2,
			REPEAT: 3
		},
		RECORDING_TYPE = {
			SINGLE: 1,
			SERIES: 2
		},
		pendingTasks = [],
		deviceEventCallback;

	deviceEventCallback = function (eventName, e) {
		e.udn = device.udn;
		if (device.deviceEventCallback) {
			device.deviceEventCallback(eventName, e);
		}
	};

	/**
	 * check the task is for NETUI Library requirement
	 */
	function checkTaskIsValid(task) {
		if (task.state < 3
				/*&& !task.currentErrors*/) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * @method channelIdsTripletToServiceId
	 * @private
	 * @param channelIds {String}
	 * @return {String} service id.
	 */
	function channelIdsTripletToServiceId(channelIds) {
		var serviceId = "",
			ids = [],
			i,
			id;
		if (channelIds) {
			ids = channelIds.split(",");
			for (i = 0; i < ids.length; i++) {
				id = parseInt(ids[i], 10).toString(16);
				serviceId += "0000".substr(0, 4 - id.length) + id;
			}
		}
		return serviceId;
	}

	/**
	 * @method getMatchingIdForSeriesWithCurrentEvent
	 * @param {String} seriesId
	 * @param {String} eventId
	 * @return {String}
	 */
	function getMatchingIdForSeriesWithCurrentEvent(seriesId, eventId) {
		return seriesId + "," + eventId;
	}

	function getTaskById(taskId) {
		var i,
			j;
		for (i = 0; i < allSchedules.length; i++) {
			for (j = 0; j < allSchedules[i].allTasks.length; j++) {
				if (allSchedules[i].allTasks[j].taskId === taskId) {
					return allSchedules[i].allTasks[j];
				}
			}
		}
		return null;
	}

	function copySchedulePrivate(src, dst) {
		if (src.getTasksHandle) {
			dst.getTasksHandle = src.getTasksHandle;
		}
		if (src.allTasks) {
			dst.allTasks = src.allTasks;
		}
		if (src.recordingType) {
			dst.recordingType = src.recordingType;
		}
	}

	function copyTaskPrivate(src, dst) {
		if (src.whpvrDevice) {
			dst.whpvrDevice = src.whpvrDevice;
		}
		if (src.gettaskConflictHandle) {
			dst.gettaskConflictHandle = src.gettaskConflictHandle;
		}
	}

	function getScheduleByScheduleId(scheduleId) {
		var i;
		for (i = 0; i < allSchedules.length; i++) {
			if (allSchedules[i].scheduleId === scheduleId) {
				return allSchedules[i];
			}
		}
		return null;
	}

	function getScheduleByTaskId(taskId) {
		var i,
			j;
		for (i = 0; i < allSchedules.length; i++) {
			for (j = 0; j < allSchedules[i].allTasks.length; j++) {
				if (allSchedules[i].allTasks[j].taskId === taskId) {
					return allSchedules[i].allTasks[j];
				}
			}
		}
		return null;
	}

	function checkTaskConflictBySchedule(schedule) {
		var task;
		if (!schedule || schedule.taskCount !== 1 || schedule.recordingType !== RECORDING_TYPE.SINGLE) {
			log("checkTaskConflictBySchedule", "No need to check this schedule " + schedule ? schedule.scheduleId : "");
			return;
		}
		if (schedule.allTasks.length !== 1) {
			log("checkTaskConflictBySchedule", "No task is added now " + schedule.allTasks.length);
			return;
		}
		task = schedule.allTasks[0];
		if (task.gettaskConflictHandle) {
			log("checkTaskConflictBySchedule", "task is under the conflict check " + task.taskId);
			return;
		}
		log("checkTaskConflictBySchedule", "Go to check the conflicts " + task.taskId + " title " + task.title);
		task.gettaskConflictHandle = HNInst.getTaskConflicts(task.taskId);
	}

	function getSchedulesOK(e) {
		var i,
			schedule;
		if (e.handle === schedulerHandle) {
			allSchedules = e.resultList;
			log("getSchedulesOK", "get all schedules length " + e.resultList.length + " total " + e.totalMatches);
			for (i = 0; i < allSchedules.length; i++) {
				allSchedules[i].getTasksHandle = HNInst.getTasksFromSchedule(allSchedules[i].scheduleId, 0, MAX_COUNT);
			}
		} else {
			for (i = 0; i < allSchedules.length; i++) {
				if (e.handle === allSchedules[i].getScheduleHandle) {
					schedule = e.resultList[0];
					log("getSchedulesOK", "get one shedule successfully " + schedule.scheduleId);
					copySchedulePrivate(allSchedules[i], schedule);
					allSchedules[i] = schedule;
					break;
				}
			}
		}
	}

	function getSchedulesFailed(e) {
		var i;
		if (e.handle === schedulerHandle) {
			log("getSchedulesFailed", "get all schedules FAILED !!! " + device.friendlyName);
		} else {
			for (i = 0; i < allSchedules.length; i++) {
				if (e.handle === allSchedules[i].getScheduleHandle) {
					log("getSchedulesFailed", "get one schedule failed " + allSchedules[i].scheduleId);
					allSchedules.splice(i, 1);
					break;
				}
			}
		}
		if (e.error) {
			log("getSchedulesFailed", "error name " + e.error.name + " message " + e.error.message);
		}
	}

	function getTasksFromScheduleOK(e) {
		var i,
			j,
			task;
		for (i = 0; i < allSchedules.length; i++) {
			if (allSchedules[i].getTasksHandle === e.handle) {
				allSchedules[i].allTasks = e.resultList;
				log("getTasksFromScheduleOK", "get schedule tasks length " + e.resultList.length + " total " + e.totalMatches);
				for (j = 0; j < allSchedules[i].allTasks.length; j++) {
					task = allSchedules[i].allTasks[j];
					log("getTasksFromScheduleOK", "task title " + task.title);
					log("getTasksFromScheduleOK", "scheduleId " + task.scheduleId + " taskId " + task.taskId + " state " + task.state + " currentErrors " + task.currentErrors);
					task.whpvrDevice = whpvrDevice;
				}
				break;
			}
		}
	}

	function getTasksFromScheduleFailed(e) {
		var i;
		for (i = 0; i < allSchedules.length; i++) {
			if (allSchedules[i].getTasksHandle === e.handle) {
				log("getTasksFromScheduleFailed", "get schedule tasks FAILED !!!");
				allSchedules[i].allTasks = [];
				break;
			}
		}
	}

	function deleteTaskOK(e) {
		var i,
			j,
			found = false;
		log("deleteTaskOK", "deleteTaskOK");
		for (i = 0; i < allSchedules.length; i++) {
			for (j = 0; j < allSchedules[i].allTasks.length; j++) {
				if (allSchedules[i].allTasks[j].deleteHandle === e.handle) {
					allSchedules[i].allTasks.splice(j, 1);
					found = true;
					log("deleteTaskOK", "Task is found");
					break;
				}
			}
			/*if (allSchedules[i].allTasks.length === 0) {
				log("deleteTaskOK", "All tasks has been deleted from schedule");
				allSchedules[i].deleteHandle = HNInst.deleteSchedule(allSchedules[i].scheduleId);
			}*/
			if (found) {
				deviceEventCallback("deleteTaskOK", e);
				return;
			}
		}
	}

	function deleteTaskFailed(e) {
		var i,
			j;
		log("deleteTaskFailed", "deleteTaskFailed");
		for (i = 0; i < allSchedules.length; i++) {
			for (j = 0; j < allSchedules[i].allTasks.length; j++) {
				if (allSchedules[i].allTasks[j].deleteHandle === e.handle) {
					log("deleteTaskFailed", "deleteTaskFailed Found Task");
					allSchedules[i].allTasks[j].deleteHandle = null;
					deviceEventCallback("deleteTaskFailed", e);
					return;
				}
			}
		}
	}

	function deleteScheduleOK(e) {
		var i;
		for (i = 0; i < allSchedules.length; i++) {
			if (allSchedules[i].deleteHandle === e.handle) {
				log("deleteScheduleOK", "scheduleId " + allSchedules[i].scheduleId);
				allSchedules.splice(i, 1);
				deviceEventCallback("deleteScheduleOK", e);
				return;
			}
		}
	}

	function deleteScheduleFailed(e) {
		var i;
		for (i = 0; i < allSchedules.length; i++) {
			if (allSchedules[i].deleteHandle === e.handle) {
				allSchedules[i].deleteHandle = null;
				log("deleteScheduleFailed", "scheduleId " + allSchedules[i].scheduleId);
				if (e.error) {
					log("deleteScheduleFailed", "name " + e.error.name + " message " + e.error.message + " domain " + e.error.domain);
				}
				deviceEventCallback("deleteScheduleFailed", e);
				return;
			}
		}
	}

	function onScheduleUpdated(e) {
		var i;
		log("onScheduleUpdated", "onScheduleUpdated " + e.scheduleId);
		for (i = 0; i < allSchedules.length; i++) {
			if (allSchedules[i].scheduleId === e.scheduleId) {
				//update this schedule
				allSchedules[i].getScheduleHandle = HNInst.getSchedules(e.scheduleId, 0, 1);
				break;
			}
		}
	}

	function onScheduleAdded(e) {
		var scheduleObject = {},
			i;
		log("onScheduleAdded", "onScheduleAdded " + e.scheduleId);
		scheduleObject = getScheduleByScheduleId(e.scheduleId);
		if (scheduleObject) {
			log("onScheduleAdded", "schedule " + e.scheduleId + " found, Maybe created locally ");
		} else {
			scheduleObject = {};
			scheduleObject.scheduleId = e.scheduleId;
			scheduleObject.allTasks = [];
			allSchedules.push(scheduleObject);
		}
		scheduleObject.getScheduleHandle = HNInst.getSchedules(e.scheduleId, 0, 1);
		//sometimes task is added before the schedule is added. so we need to check the pendingTasks
		for (i = 0; i < pendingTasks.length; i++) {
			if (pendingTasks[i].scheduleId === e.scheduleId) {
				scheduleObject.allTasks.push(pendingTasks[i]);
				log("onScheduleAdded", "add task from pendinglist " + pendingTasks[i].taskId);
				//at this time we have no schedule, but maybe we have task already.
				checkTaskConflictBySchedule(scheduleObject);
				pendingTasks.splice(i, 1);
				i--;
			}
		}
	}

	function onScheduleRemoved(e) {
		var i;
		log("onScheduleRemoved", "onScheduleRemoved " + e.scheduleId);
		for (i = 0; i < allSchedules.length; i++) {
			if (allSchedules[i].scheduleId === e.scheduleId) {
				allSchedules.splice(i, 1);
				log("onScheduleRemoved", "schedule removed suc " + e.scheduleId);
				deviceEventCallback("onScheduleRemoved", e);
				break;
			}
		}
		log("onScheduleRemoved", "not found" + e.scheduleId);
	}

	function onTaskUpdated(e) {
		var i,
			j;
		log("onTaskUpdated", "onTaskUpdated " + e.taskId);
		for (i = 0; i < allSchedules.length; i++) {
			for (j = 0; j < allSchedules[i].allTasks.length; j++) {
				if (allSchedules[i].allTasks[j].taskId === e.taskId) {
					allSchedules[i].allTasks[j].getTaskHandle = HNInst.getTask(e.taskId);
					log("onTaskUpdated", "taskId " + e.taskId + " handle " + allSchedules[i].allTasks[j].getTaskHandle);
					return;
				}
			}
		}
		log("onTaskUpdated", "task updated before we received the getTaskOK");
		for (i = 0; i < pendingTasks.length; i++) {
			if (pendingTasks[i].taskId === e.taskId) {
				pendingTasks[i].getTaskHandle = HNInst.getTask(e.taskId);
				log("onTaskUpdated", "renew get task " + e.taskId + " handle " + pendingTasks[i].getTaskHandle);
				return;
			}
		}
		log("onTaskUpdated", "NO!!!!! should not happen");
	}

	function onTaskAdded(e) {
		var task = {},
			schedule;
		task.getTaskHandle = HNInst.getTask(e.taskId);
		task.taskId = e.taskId;
		task.whpvrDevice = whpvrDevice;
		log("onTaskAdded", "onTaskAdded " + e.taskId + " handle " + task.getTaskHandle);
		pendingTasks.push(task);
	}

	function onTaskRemoved(e) {
		var i,
			j;
		log("onTaskRemoved", "onTaskRemoved " + e.taskId);
		for (i = 0; i < allSchedules.length; i++) {
			for (j = 0; j < allSchedules[i].allTasks.length; j++) {
				if (allSchedules[i].allTasks[j].taskId === e.taskId) {
					allSchedules[i].allTasks.splice(j, 1);
					log("onTaskRemoved", "task removed suc " + e.taskId);
					deviceEventCallback("onTaskRemoved", e);
					return;
				}
			}
		}
		log("onTaskRemoved", "not found " + e.taskId);
	}

	function notifyGetTaskOK(task) {

	}

	/**
	 * @method getTasksWithoutTaskAdded
	 * @param {Object} task
	 */
	function getTasksWithoutTaskAdded(task) {
		var i,
			j,
			taskItem;
		for (i = 0; i < allSchedules.length; i++) {
			for (j = 0; j < allSchedules[i].allTasks.length; j++) {
				taskItem = allSchedules[i].allTasks[j];
				if (taskItem.getTaskHandle === e.handle && taskItem.taskId === task.taskId) {
					log("getTaskOK", "task updated");
					copyTaskPrivate(taskItem, task);
					taskItem = task;
					deviceEventCallback("getTaskOK", e);
					return;
				} else if (taskItem.getTaskHandle && taskItem.taskId === task.taskId) {
					log("getTaskOK", "task updated, but expired message");
					return;
				}
			}
		}
	}

	function getTaskOK(e) {
		var i,
			task = e.result,
			j;
		log("getTaskOK", "getTaskOK handle " + e.handle + " taskId " + task.taskId + " state " + task.state + " scheduleId " + task.scheduleId  + "state " + task.state);
		$N.apps.util.EventManager.fire("WHPVRcreateTask", task);
		for (i = 0; i < pendingTasks.length; i++) {
			if (pendingTasks[i].getTaskHandle === e.handle && pendingTasks[i].taskId === task.taskId) {
				copyTaskPrivate(pendingTasks[i], task);
				pendingTasks.splice(i, 1, task);// should not delete it yet, because the schedule maybe is not added.
				log("getTaskOK", "New task scheduleId " + task.scheduleId);
				for (j = 0; j < allSchedules.length; j++) {
					if (allSchedules[j].scheduleId === task.scheduleId) {
						log("getTaskOK", "task added");
						allSchedules[j].allTasks.push(task);
						pendingTasks.splice(i, 1);
						checkTaskConflictBySchedule(allSchedules[j]);
						deviceEventCallback("getTaskOK", e);
						return;
					}
				}
				log("getTaskOK", "NO!!!!! schedule is not added? " + task.scheduleId);
			}
		}
		getTasksWithoutTaskAdded(task);
		log("getTaskOK", "!!! task updated or its schedule is not added ");
	}

	function getTaskFailed(e) {
		var i,
			task;
		log("getTaskFailed", "getTaskFailed");
		for (i = 0; i < pendingTasks.length; i++) {
			if (pendingTasks[i].getTaskHandle === e.handle) {
				pendingTasks.splice(i, 1);
				break;
			}
		}
		if (e.error) {
			log("getTaskFailed", "Error name " + e.error.name + " message " + e.error.message);
		}
	}

	function fillScheduleEventProperty(schedule, e) {
		if (schedule.recordingType === RECORDING_TYPE.SINGLE) {
			e.eventId = schedule.cdsEventObjectId.substring("epg.".length);
		} else if (schedule.recordingType === RECORDING_TYPE.SERIES) {
			e.seriesId = schedule.matchingId;
		}
	}

	function createScheduleOK(e) {
		var i;
		log("createScheduleOK", "createScheduleOK " + e.result.scheduleId);
		for (i = 0; i < allSchedules.length; i++) {
			if (allSchedules[i].createHandle === e.handle) {
				fillScheduleEventProperty(allSchedules[i], e);
				copySchedulePrivate(allSchedules[i], e.result);
				allSchedules[i] = e.result;
				//Object changed!!!
				allSchedules[i].allTasks = [];
				log("createScheduleOK", "createScheduleOK task count " + allSchedules[i].taskCount);
				deviceEventCallback("createScheduleOK", e);
				break;
			}
		}
	}

	function createScheduleFailed(e) {
		var i;
		log("createScheduleFailed", "createScheduleFailed");
		if (e.error) {
			log("createScheduleFailed", "Error " + e.error.name + " message " + e.error.message);
		}
		for (i = 0; i < allSchedules.length; i++) {
			if (allSchedules[i].createHandle === e.handle) {
				fillScheduleEventProperty(allSchedules[i], e);
				allSchedules.splice(i, 1);
				deviceEventCallback("createScheduleFailed", e);
				break;
			}
		}
	}

	function getTaskByConflictHandle(handle) {
		var i,
			j,
			task = null;
		for (i = 0; i < allSchedules.length; i++) {
			for (j = 0; j < allSchedules[i].allTasks.length; j++) {
				if (allSchedules[i].allTasks[j].gettaskConflictHandle === handle) {
					task = allSchedules[i].allTasks[j];
					return task;
				}
			}
		}
		return task;
	}

	function getTaskConflictsOK(e) {
		var task,
			conTask,
			unschedules = [],
			conflicts = [],
			i;
		log("getTaskConflictsOK", "getTaskConflictsOK");
		task = getTaskByConflictHandle(e.handle);
		if (!task) {
			log("getTaskConflictsOK", "failed to get the task by handle");
			return;
		}
		unschedules.push(task);
		if (e.resultList.length) {
			log("getTaskConflictsOK", "task " + task.taskId + " has conflicts " + e.resultList.length + " cdsEventObjectId " + task.cdsEventObjectId + " cdsServiceObjectId " + task.cdsServiceObjectId);
			for (i = 0; i < e.resultList.length; i++) {
				conTask = getTaskById(e.resultList[i]);
				if (!conTask) {
					log("getTaskConflictsOK", "NO!!! Not found the task in cache");
				} else {
					log("getTaskConflictsOK", "conflict " + i + " " + e.resultList[i] + " title " + conTask.title);
				}
				conflicts.push(conTask);
			}
			if (conflicts.length && $N.platform.btv.WHPVRManager._conflictsCallback) {
				$N.platform.btv.WHPVRManager._conflictsCallback($N.platform.btv.WHPVRRecordingFactory.scheduleTaskMapArray(unschedules), $N.platform.btv.WHPVRRecordingFactory.scheduleTaskMapArray(conflicts));
			}
		} else {
			log("getTaskConflictsOK", "task " + task.taskId + " has no conflicts ");
		}
		task.gettaskConflictHandle = null;
	}

	function getTaskConflictsFailed(e) {
		var task;
		log("getTaskConflictsFailed", "getTaskConflictsFailed");
		task = getTaskByConflictHandle(e.handle);
		if (task) {
			log("getTaskConflictsFailed", "the task is " + task.taskId);
			task.gettaskConflictHandle = null;
		}
		return;
	}

	function schedulerRelease() {
		if (HNInstObject) {
			HNInst.removeEventListener("getSchedulesOK", getSchedulesOK);
			HNInst.removeEventListener("getSchedulesFailed", getSchedulesFailed);
			HNInst.removeEventListener("getTasksFromScheduleOK", getTasksFromScheduleOK);
			HNInst.removeEventListener("getTasksFromScheduleFailed", getTasksFromScheduleFailed);
			HNInst.removeEventListener("deleteTaskOK", deleteTaskOK);
			HNInst.removeEventListener("deleteTaskFailed", deleteTaskFailed);
			HNInst.removeEventListener("deleteScheduleOK", deleteScheduleOK);
			HNInst.removeEventListener("deleteScheduleFailed", deleteScheduleFailed);
			HNInst.removeEventListener("onScheduleUpdated", onScheduleUpdated);
			HNInst.removeEventListener("onScheduleAdded", onScheduleAdded);
			HNInst.removeEventListener("onScheduleRemoved", onScheduleRemoved);
			HNInst.removeEventListener("onTaskUpdated", onTaskUpdated);
			HNInst.removeEventListener("onTaskAdded", onTaskAdded);
			HNInst.removeEventListener("onTaskRemoved", onTaskRemoved);
			HNInst.removeEventListener("createScheduleOK", createScheduleOK);
			HNInst.removeEventListener("createScheduleFailed", createScheduleFailed);
			HNInst.removeEventListener("getTaskOK", getTaskOK);
			HNInst.removeEventListener("getTaskFailed", getTaskFailed);
			HNInst.removeEventListener("getTaskConflictsOK", getTaskConflictsOK);
			HNInst.removeEventListener("getTaskConflictsFailed", getTaskConflictsFailed);
			allSchedules = [];
			HNInst = null;
			HNInstObject = null;
			window.gc();
		}
	}

	function schedulerGetTasks() {
		var i,
			tasks = [],
			j;
		for (i = 0; i < allSchedules.length; i++) {
			if (allSchedules[i].allTasks && allSchedules[i].allTasks.length) {
				for (j = 0; j < allSchedules[i].allTasks.length; j++) {
					if (checkTaskIsValid(allSchedules[i].allTasks[j])) {
						tasks = tasks.concat($N.platform.btv.WHPVRRecordingFactory.scheduleTaskMapObject(allSchedules[i].allTasks[j], allSchedules[i]));
					}
				}
			}
		}
		return tasks;
	}

	function schedulerDeleteTask(task) {
		var i,
			j;
		if (task._data.whpvrDevice !== whpvrDevice) {
			return false;
		}
		for (i = 0; i < allSchedules.length; i++) {
			for (j = 0; j < allSchedules[i].allTasks.length; j++) {
				if (allSchedules[i].allTasks[j].taskId === task.taskId) {
					log("schedulerDeleteTask", "schedulerDeleteTask " + task.taskId);
					allSchedules[i].allTasks[j].deleteHandle = HNInst.deleteTask(task.taskId);
					return true;
				}
			}
		}
		log("schedulerDeleteTask", "NO!!!!! should not happen " + task.taskId);
		return true;
	}

	function requestEventRecording(metaData) {
		var scheduleObject = {};
		if (!metaData || !metaData.eventId) {
			log("requestEventRecording", "Invalid params");
			return;
		}
		log("requestEventRecording", "Enter metaData.eventId " + metaData.eventId + " folder " + metaData.uiFolder);
		scheduleObject = {
			'type': SCHEDULE_TYPE.CDS_EVENT,
			'softPrepaddingDuration': metaData.softPrepaddingDuration,
			'softPostpaddingDuration': metaData.softPostpaddingDuration,
			'cdsEventObjectId': "epg." + metaData.eventId,
			"userAnnotation": metaData.uiFolder
		};
		scheduleObject.createHandle = HNInst.createSchedule(scheduleObject);
		scheduleObject.allTasks = [];
		scheduleObject.recordingType = RECORDING_TYPE.SINGLE;
		allSchedules.push(scheduleObject);
	}

	function requestSeriesRecording(metaData) {
		var scheduleObject = {},
			matchingId = "";
		if (!metaData || !metaData.seriesId) {
			log("requestSeriesRecording", "Invalid params");
			return;
		}
		if (metaData.eventId) {
			matchingId = getMatchingIdForSeriesWithCurrentEvent(metaData.seriesId, metaData.eventId);
		} else {
			matchingId = metaData.seriesId;
		}
		log("requestSeriesRecording", "Enter metaData.seriesId " + metaData.seriesId + " folder " + metaData.uiFolder);
		scheduleObject = {
			'type': SCHEDULE_TYPE.BY_MATCHING_ID,
			"matchingId": matchingId,
			"matchingIdType": MatchingIdType.SERIES_ID,
			"softPrepaddingDuration": metaData.softPrepaddingDuration,
			"softPostpaddingDuration": metaData.softPostpaddingDuration,
			"cdsEventObjectId": "epg." + metaData.eventId,
			"userAnnotation": metaData.uiFolder
		};
		scheduleObject.createHandle = HNInst.createSchedule(scheduleObject);
		scheduleObject.allTasks = [];
		scheduleObject.recordingType = RECORDING_TYPE.SERIES;
		allSchedules.push(scheduleObject);
	}

	function schedulerDeleteSingle(event) {
		var i,
			j,
			eventId = event.eventId,
			task,
			serviceId;
		log("schedulerDeleteSingle", "eventId " + eventId);
		for (i = 0; i < allSchedules.length; i++) {
			if (allSchedules[i].cdsEventObjectId === ("epg." + eventId) && allSchedules[i].type === SCHEDULE_TYPE.CDS_EVENT) {
				log("schedulerDeleteSingle", "eventId " + eventId + " found to delete ");
				allSchedules[i].deleteHandle = HNInst.deleteSchedule(allSchedules[i].scheduleId);
				return;
			} else {
				for (j = 0; j < allSchedules[i].allTasks.length; j++) {
					task = allSchedules[i].allTasks[j];
					if (checkTaskIsValid(task)) {
						serviceId = channelIdsTripletToServiceId(task.channelIds);
						if (task.startDateTime === event.startTime && serviceId === event.serviceId) {
							log("schedulerDeleteSingle", "eventId " + eventId + " found series episode to delete ");
							allSchedules[i].allTasks[j].deleteHandle = HNInst.deleteTask(allSchedules[i].allTasks[j].taskId);
							return;
						}
					}
				}
			}
		}
	}

	function schedulerDeleteSeries(seriesId) {
		var i;
		log("schedulerDeleteSeries", "seriesId " + seriesId);
		for (i = 0; i < allSchedules.length; i++) {
			if (allSchedules[i].matchingId === seriesId && allSchedules[i].matchingIdType === MatchingIdType.SERIES_ID) {
				log("schedulerDeleteSeries", "seriesId " + seriesId + " found to delete ");
				allSchedules[i].deleteHandle = HNInst.deleteSchedule(allSchedules[i].scheduleId);
			}
		}
	}

	function getTaskByEvent(event) {
		var i,
			j,
			eventId,
			cdsEventObjectId,
			task,
			serviceId;
		if (!event) {
			log("getTaskByEvent", "NULL event");
			return;
		}
		eventId = event.eventId;
		cdsEventObjectId = "epg." + eventId;
		log("getTaskByEvent", "eventId " + eventId);
		for (i = 0; i < allSchedules.length; i++) {
			/*Currently core has bugs, the event id is not valid in task, but valid in schedule (just for single schedule), so we need to check the schedule here*/
			if (allSchedules[i].cdsEventObjectId === cdsEventObjectId) {
				log("getTaskByEvent", "found single schedule task");
				if (allSchedules[i].allTasks.length) {
					return $N.platform.btv.WHPVRRecordingFactory.scheduleTaskMapObject(allSchedules[i].allTasks[0], allSchedules[i]);
				}
			}
			for (j = 0; j < allSchedules[i].allTasks.length; j++) {
				task = allSchedules[i].allTasks[j];
				if (checkTaskIsValid(task)) {
					serviceId = channelIdsTripletToServiceId(task.channelIds);
					if (task.startDateTime === event.startTime && serviceId === event.serviceId) {
						return $N.platform.btv.WHPVRRecordingFactory.scheduleTaskMapObject(allSchedules[i].allTasks[j], allSchedules[i]);
					}
				}
			}
		}
		log("getTaskByEvent", "Faild to find task for eventId " + eventId);
		return null;
	}

	return {
		init : function () {
			HNInst.addEventListener("getSchedulesOK", getSchedulesOK);
			HNInst.addEventListener("getSchedulesFailed", getSchedulesFailed);
			HNInst.addEventListener("getTasksFromScheduleOK", getTasksFromScheduleOK);
			HNInst.addEventListener("getTasksFromScheduleFailed", getTasksFromScheduleFailed);
			HNInst.addEventListener("deleteTaskOK", deleteTaskOK);
			HNInst.addEventListener("deleteTaskFailed", deleteTaskFailed);
			HNInst.addEventListener("deleteScheduleOK", deleteScheduleOK);
			HNInst.addEventListener("deleteScheduleFailed", deleteScheduleFailed);
			HNInst.addEventListener("onScheduleUpdated", onScheduleUpdated);
			HNInst.addEventListener("onScheduleAdded", onScheduleAdded);
			HNInst.addEventListener("onScheduleRemoved", onScheduleRemoved);
			HNInst.addEventListener("onTaskUpdated", onTaskUpdated);
			HNInst.addEventListener("onTaskAdded", onTaskAdded);
			HNInst.addEventListener("onTaskRemoved", onTaskRemoved);
			HNInst.addEventListener("createScheduleOK", createScheduleOK);
			HNInst.addEventListener("createScheduleFailed", createScheduleFailed);
			HNInst.addEventListener("getTaskOK", getTaskOK);
			HNInst.addEventListener("getTaskFailed", getTaskFailed);
			HNInst.addEventListener("getTaskConflictsOK", getTaskConflictsOK);
			HNInst.addEventListener("getTaskConflictsFailed", getTaskConflictsFailed);

			schedulerHandle = HNInst.getSchedules("", 0, MAX_COUNT);
			log("WHPVRScheduler", "create scheduler for " + device.friendlyName + " udn " + device.udn + " scheduleHandle " + schedulerHandle);
		},
		schedulerHandle: schedulerHandle,
		schedulerGetTasks: schedulerGetTasks,
		schedulerRelease: schedulerRelease,
		schedulerDeleteTask: schedulerDeleteTask,
		schedulerDeleteSeries: schedulerDeleteSeries,
		schedulerDeleteSingle: schedulerDeleteSingle,
		getTaskByEvent: getTaskByEvent,
		requestEventRecording: requestEventRecording,
		requestSeriesRecording: requestSeriesRecording
	};
}

$N.platform.btv.WHPVRScheduler = WHPVRScheduler;
