/**
 * This class is a NET specific implementation of $N.platform.btv.Reminders
 *
 * @class $N.platform.btv.Reminders
 * @singleton
 */

var $N = $N || {};
$N.platform = $N.platform || {};
$N.platform.btv = $N.platform.btv || {};

$N.platform.btv.Reminders = (function () {
	var log = new $N.apps.core.Log("btv", "Reminders"),
		DEFAULT_ALERT_TIME = 120, // how long before the event starts that the reminder is shown (2 minutes)
		JOB_TYPE_SINGLE = "ONE_TIME",
		reminderCallback = null,
		genericReminderCallback = null,
		taskOccuredCallback = null,
		jobHandleLookup = {},
		lastProcessedTaskStartTime = null,
		addJobSucceededListener = function (e) {
			log("addJobSucceededListener", "Enter - e.handle = " + e.handle);
			if (jobHandleLookup.hasOwnProperty(e.handle)) {
				jobHandleLookup[e.handle](true, e);
				delete jobHandleLookup[e.handle];
			}
			log("addJobSucceededListener", "Exit");

		},
		addTaskFailedListener = function (e) {
			log("addTaskFailedListener", "Enter - e.handle = " + e.handle);
			if (jobHandleLookup.hasOwnProperty(e.handle)) {
				jobHandleLookup[e.handle](false, e);
				delete jobHandleLookup[e.handle];
			}
			log("addTaskFailedListener", "Exit");

		},
		genericReminderConflictHandler = function () {},

		remindersCache = {};

	return {
		/**
		 * Initialises the reminder functionality, and starts listening to the CCOM TaskAlert event.
		 * Be sure to register at least one listener in order to do something useful when the TaskAlert event is triggered.
		 *
		 * @method init
		 * @param {Number} alertTime time (in seconds) before which a reminder event will be fired
		 * @param {Function} reminderCallbackFunction
		 * @param {Object} player The player to use for auto tuning
		 */
		init: function (alertTime, reminderCallbackFunction, player) {
			log("init", "Enter");

			CCOM.Scheduler.addEventListener("addJobOK", addJobSucceededListener);
			CCOM.Scheduler.addEventListener("addJobFailed", addTaskFailedListener);
			//TODO: set the 'viewer period alert' time configuration value to 'alertTime'
			if (reminderCallbackFunction) {
				this.setGenericReminderCallback(reminderCallbackFunction);
			}
			if (player) {
				this.setAutoTunePlayer(player);
			}

			var tasks = $N.app.Reminders.getAllActiveReminders(),
				i = 0,
				uniqueEventId = null,
				eventObj = null;
			for (i = 0; i < tasks.length; i++) {
				if (tasks[i].eventId) {
					eventObj = $N.platform.btv.EPG.getEventById(tasks[i].eventId);
					//using uniqueEventId as key for the cache instead of eventId
					if (eventObj) {
						uniqueEventId = $N.app.epgUtil.getUniqueEventIdByEvent(eventObj);
					}
					if (uniqueEventId) {
						remindersCache[uniqueEventId] = true;
					} else {
						remindersCache[tasks[i].eventId] = true;
					}
				}
			}

			log("init", "Exit");
		},

		/**
		 * Sets the callback to be executed when an event for which a reminder was set earlier
		 * is about to start in `alertTime` seconds. The callback is passed a task
		 * object that is returned from the tasks database
		 * @method setReminderCallback
		 * @chainable
		 * @param {Function} callback null to remove
		 */
		setReminderCallback: function (callback) {
			log("setReminderCallback", "Enter");
			if (reminderCallback) {
				CCOM.Scheduler.removeEventListener("onTaskVPAlert", reminderCallback, false);
			}
			reminderCallback = function (e) {
				if (e.taskType === "RMDR") {
					callback({task: $N.platform.btv.PVRManager.getTask(e.taskId)});
				}
			};
			if (reminderCallback) {
				CCOM.Scheduler.addEventListener("onTaskVPAlert", reminderCallback, false);
			}
			log("setReminderCallback", "Exit");
			return this;
		},
		/**
		 * Sets the callback to be executed when an event for which a reminder was set earlier
		 * is about to start. The callback is passed a task
		 * object that is returned from the tasks database
		 * @method setGenericReminderCallback
		 * @chainable
		 * @param {Function} callback null to remove
		 */
		setGenericReminderCallback: function (callback) {
			log("setGenericReminderCallback", "Enter");
			if (genericReminderCallback) {
				CCOM.Scheduler.removeEventListener("onTaskStarted", genericReminderCallback, false);
			}
			genericReminderCallback = function (e) {
				if (e.taskType === "GRMDR") {
					var task = $N.platform.btv.PVRManager.getTask(e.taskId),
						tasks,
						taskLength;
					if (lastProcessedTaskStartTime !== task.startTime) {
						tasks = $N.platform.btv.PVRManager.getScheduledReminderByStartTime(task.startTime);
						taskLength = tasks.length;
						lastProcessedTaskStartTime = task.startTime;
						if (taskLength > 1) {
							genericReminderConflictHandler(tasks);
						} else {
							callback({task: $N.platform.btv.PVRManager.getTask(e.taskId)});
						}
					}
				}
			};
			if (genericReminderCallback) {
				CCOM.Scheduler.addEventListener("onTaskStarted", genericReminderCallback, false);
			}
			log("setGenericReminderCallback", "Exit");
			return this;
		},

		/**
		 * Sets the callback to be executed when an event for which a reminder was set earlier
		 * is starting. The callback is passed a task object that is returned from the tasks database
		 * @method setTaskOccuredCallback
		 * @chainable
		 * @param {Function} callback
		 */
		setTaskOccuredCallback: function (callback) {
			log("setTaskOccuredCallback", "Enter");
			if (taskOccuredCallback) {
				CCOM.Scheduler.removeEventListener("onTaskStarted", taskOccuredCallback, false);
			}
			taskOccuredCallback = function (e) {
				if (e.taskType === "RMDR") {
					callback({task: $N.platform.btv.PVRManager.getTask(e.taskId)});
				}
			};
			if (taskOccuredCallback) {
				CCOM.Scheduler.addEventListener("onTaskStarted", taskOccuredCallback, false);
			}
			log("setTaskOccuredCallback", "Exit");
			return this;
		},

		/**
		 * Sets a reminder for the given event id. Two callbacks could be associated the reminder,
		 * one that will be invoked when the event is about to start in `alertTime`
		 * seconds, and another that will be invoked when the event is starting
		 * @method setReminder
		 * @async
		 * @chainable
		 * @param {Number} eventId The id of the event we are setting a reminder for
		 * @param {Function} [callback] callback for when the reminder is added successfully
		 * or has not been added due to an error. The callback is sent a Boolean true if the
		 * reminder was added normally, or false if there was an error.
		 */
		setReminder: function (eventId, callback) {
			log("setReminder", "Enter - eventId = " + eventId);
			var handle = CCOM.Scheduler.addJob("RMDR", "ONE_EVT", {eventId: eventId}),
				uniqueEventId = $N.app.epgUtil.getUniqueEventIdByEvent($N.platform.btv.EPG.getEventById(eventId));
			if (uniqueEventId) {
				remindersCache[uniqueEventId] = true;
			} else {
				remindersCache[eventId] = true;
			}
			if (callback) {
				log("setReminder", "adding jobHandleLookup - handle = " + handle);
				jobHandleLookup[handle] = callback;
			}
			log("setReminder", "Exit");
			return this;
		},
		/**
		 * Sets a GenericReminder for the given event id. Two callbacks could be associated the reminder,
		 * one that will be invoked when the event is about to start in `alertTime`
		 * seconds, and another that will be invoked when the event is starting
		 * @method setGenericReminder
		 * @async
		 * @chainable
		 * @param {Number} entity The event we are setting a reminder for
		 * @param {Function} [callback] callback for when the reminder is added successfully
		 * or has not been added due to an error. The callback is sent a Boolean true if the
		 * reminder was added normally, or false if there was an error.
		 */
		setGenericReminder: function (jobType, addInfoObj, callback) {
			log("setGenericReminder", "Enter");
			var handle = CCOM.Scheduler.addJob("GRMDR", jobType, addInfoObj),
				uniqueEventId = null,
				eventObj = null;
			if (addInfoObj.eventId) {
				eventObj = $N.platform.btv.EPG.getEventById(addInfoObj.eventId);
				//using uniqueEventId as key for the cache instead of eventId
				if (eventObj) {
					uniqueEventId = $N.app.epgUtil.getUniqueEventIdByEvent(eventObj);
				}
				if (uniqueEventId) {
					remindersCache[uniqueEventId] = true;
				} else {
					remindersCache[addInfoObj.eventId] = true;
				}
			}
			if (callback) {
				jobHandleLookup[handle] = callback;
			}
			log("setGenericReminder", "Exit");
			return this;
		},

		/**
		 * Cancels the reminder for the given event id
		 * @method cancelReminder
		 * @chainable
		 * @param {Number} eventId The eventId we want to cancel
		 */
		cancelReminder: function (eventId) {
			log("cancelReminder", "Enter - eventId = " + eventId);
			var task = $N.platform.btv.PVRManager.getScheduledReminderByEvent(eventId);
			if (remindersCache.hasOwnProperty(eventId)) {
				remindersCache[eventId] = false;
			}
			if (task) {
				CCOM.Scheduler.deleteJob(task.jobId);
			}
			log("cancelReminder", "Exit");
			return this;
		},

		/**
		 * Returns true if the given event id has a reminder set
		 * @method isReminderSetForEventId
		 * @param {Object} event
		 * @return {Boolean} True if the reminder is set false if not
		 */
		isReminderSetForEventId: function (event) {
			log("isReminderSetForEventId", "Enter and Exit - eventId = " + event.eventId);
			//using uniqueEventId as key for the cache instead of eventId
			var uniqueEventId = $N.app.epgUtil.getUniqueEventIdByEvent(event);
			if (uniqueEventId && remindersCache.hasOwnProperty(uniqueEventId)) {
				return remindersCache[uniqueEventId];
			} else if (remindersCache.hasOwnProperty(event.eventId)) {
				return remindersCache[event.eventId];
			} else {
				return false;
			}
			// var task = $N.platform.btv.PVRManager.getScheduledReminderByEvent(eventId);
			// if (task) {
			// 	return true;
			// }
			// return false;
		},

		/**
		 * Sets the player to use when auto tuning
		 * @method setAutoTunePlayer
		 * @chainable
		 * @param {Object} player
		 */
		setAutoTunePlayer: function (player) {
			//CCOM.Scheduler.autoTunePlayer = player;
			return this;
		},

		/**
		 * Sets the callback function for the generic reminder conflicts
		 * @method setGenericReminderConflictHandler
		 * @param callback
		 */
		setGenericReminderConflictHandler: function (callback) {
			log("setGenericReminderConflictHandler", "Enter and Exit");
			genericReminderConflictHandler = callback;
		},
		/**
		 * Cancels the reminder based on event id
		 * @method cancelReminder
		 * @public
		 * @param {Integer} event id of the job we wish to delete
		 */
		cancelReminder: function (event) {
			var task = $N.platform.btv.PVRManager.getScheduledReminderByEvent(event.eventId),
				uniqueEventId = null;
			//using uniqueEventId as key for the cache instead of eventId
			uniqueEventId = $N.app.epgUtil.getUniqueEventIdByEvent(event);
			if (uniqueEventId && remindersCache.hasOwnProperty(uniqueEventId)) {
				remindersCache[uniqueEventId] = false;
			} else if (remindersCache.hasOwnProperty(event.eventId)) {
				remindersCache[event.eventId] = false;
			}
			if (task) {
				$N.platform.btv.PVRManager.deleteJob(task.jobId);
			}
		}
	};
}());
