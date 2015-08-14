/**
 * Notifies callers about the start of scheduled programmes. Callers can register their own
 * method which will be invoked when scheduled programmes are about to start.
 *
 * @class $N.platform.btv.Reminders
 * @requires $N.apps.core.Log
 * @requires $N.platform.btv.PVRManager
 * @singleton
 *
 * @author Mahesh Jagadeesan
 */

define('jsfw/platform/btv/Reminders',
	[
		'jsfw/apps/core/Log',
		'jsfw/platform/btv/PVRManager'
	],
	function (Log, PVRManager) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.btv = $N.platform.btv || {};

		$N.platform.btv.Reminders = (function () {
			var log = new $N.apps.core.Log("btv", "Reminders"),
				DEFAULT_ALERT_TIME = 120, // how long before the event starts that the reminder is shown (2 minutes)
				reminderCallback = null,
				taskOccuredCallback = null,
				jobHandleLookup = {},
				addJobSucceededListener = function (e) {
					log("addJobSucceededListener", "Enter - e.handle = " + e.handle);
					if (jobHandleLookup.hasOwnProperty(e.handle)) {
						jobHandleLookup[e.handle](true);
						delete jobHandleLookup[e.handle];
					}
					log("addJobSucceededListener", "Exit");
				},
				addTaskFailedListener = function (e) {
					log("addTaskFailedListener", "Enter - e.handle = " + e.handle);
					if (jobHandleLookup.hasOwnProperty(e.handle)) {
						jobHandleLookup[e.handle](false);
						delete jobHandleLookup[e.handle];
					}
					log("addTaskFailedListener", "Exit");
				};

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
						this.setReminderCallback(reminderCallbackFunction);
					}
					if (player) {
						this.setAutoTunePlayer(player);
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
					var handle = CCOM.Scheduler.addJob("RMDR", "ONE_EVT", {eventId: eventId});
					if (callback) {
						log("setReminder", "adding jobHandleLookup - handle = " + handle);
						jobHandleLookup[handle] = callback;
					}
					log("setReminder", "Exit");
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
					if (task) {
						CCOM.Scheduler.deleteJob(task.jobId);
					}
					log("cancelReminder", "Exit");
					return this;
				},

				/**
				 * Returns true if the given event id has a reminder set
				 * @method isReminderSetForEventId
				 * @param {Number} eventId
				 * @return {Boolean} True if the reminder is set false if not
				 */
				isReminderSetForEventId: function (eventId) {
					log("isReminderSetForEventId", "Enter and Exit - eventId = " + eventId);
					var task = $N.platform.btv.PVRManager.getScheduledReminderByEvent(eventId);
					if (task) {
						return true;
					}
					return false;
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
				}
			};
		}());
		return $N.platform.btv.Reminders;
	}
);