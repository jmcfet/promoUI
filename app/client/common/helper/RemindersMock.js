/**
 * @class $N.app.RemindersMock
 * @static
 */
(function ($N) {
	"use strict";
	$N.app =  $N.app || {};
	$N.app.RemindersMock = (function ($N) {
		var DEFAULT_ALERT_TIME = 120, // how long before the event starts that the reminder is shown (2 minutes)
			reminderCallback = function () {},
			taskOccuredCallback = function () {},
			reminderAlertTime = null,
			timers = [],
			remindersByEventId = [],
			listeners = [];

		/**
		 * Cancels the timer for the given event ID
		 * @method cancelTimeout
		 * @private
		 * @param {Number} eventId
		 */
		function cancelTimeout(eventId) {
			if (timers[eventId]) {
				clearTimeout(timers[eventId]);
			}
		}

		/**
		 * Stops the timer for the given eventId and removes from array
		 * @method removeReminder
		 * @private
		 * @param {Number} eventId
		 */
		function removeReminder(eventId) {
			var i;
			cancelTimeout(eventId);
			remindersByEventId[eventId] = null;
		}

		/**
		 * Calls the task occured callback then removes the reminder.
		 * Fired when the event is due to start
		 * @method startTaskOccuredTimer
		 * @private
		 * @param {Number} eventId
		 * @param {Numebr} timeMs
		 */
		function startTaskOccuredTimer(eventId, timeMs) {
			if (!timeMs) {
				timeMs = reminderAlertTime * 1000;
			}
			cancelTimeout(eventId);
			timers[eventId] = setTimeout(function () {
				taskOccuredCallback({task: {eventId: eventId}});
				removeReminder(eventId);
			}, timeMs);
		}

		/**
		 * Calls the reminder callback then begins the task occured timer
		 * @method startTaskAlertTimer
		 * @private
		 * @param {Number} eventId
		 * @param {Numebr} timeMs
		 */
		function startTaskAlertTimer(eventId, timeMs) {
			timers[eventId] = setTimeout(function () {
				reminderCallback({task: {eventId: eventId}});
				startTaskOccuredTimer(eventId);
			}, timeMs);
		}


		/**
		 * Executes the ui refresh listeners
		 * @method executeUIRefreshListeners
		 */
		function executeUIRefreshListeners() {
			var i;
			for (i = 0; i < listeners.length; i++) {
				listeners[i].listener.call(listeners[i].callFunc);
			}
		}

		/**
		 * Adds a reminder and begins the timer for when the reminder callback should be fired
		 * @method addReminder
		 * @private
		 * @param {Number} eventId
		 */
		function addReminder(eventId) {
			var event = $N.platform.btv.EPG.getEventById(eventId),
				timeTilAlert = 0,
				reminderAlertTimeMs = reminderAlertTime * 1000;
			if (event) {
				timeTilAlert = event.startTime - new Date().getTime() - reminderAlertTimeMs;
				if (timeTilAlert > 0) {
					remindersByEventId[eventId] = true;
					executeUIRefreshListeners();
					startTaskAlertTimer(eventId, timeTilAlert);
				}
			}
		}

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
				reminderAlertTime = alertTime || DEFAULT_ALERT_TIME;
				if (reminderCallbackFunction) {
					this.setReminderCallback(reminderCallbackFunction);
				}
			},

			/**
			 * Sets the callback to run when a task alert event is fired
			 * @method setReminderCallback
			 * @param {Function} callback
			 */
			setReminderCallback: function (callback) {
				reminderCallback = callback;
			},

			/**
			 * Sets the callback to run when a task occured event is fired
			 * @method setTaskOccuredCallback
			 * @param {Function} callback
			 */
			setTaskOccuredCallback: function (callback) {
				taskOccuredCallback = callback;
			},

			/**
			 * sets a reminder for the given event id
			 * @method setReminder
			 * @param {Number} eventId The id of the event we are setting a reminder for
			 */
			setReminder: function (eventId) {
				if (!this.isReminderSetForEventId(eventId)) {
					addReminder(eventId);
				}
			},

			/**
			 * Cancels the reminder for the given event id
			 * @method cancelReminder
			 * @param {Number} eventId The eventId we want to cancel
			 */
			cancelReminder: function (eventId) {
				if (eventId) {
					removeReminder(eventId);
				}
			},

			/**
			 * Returns true if the given event id has a reminder set
			 * @method isReminderSetForEventId
			 * @param {Number} eventId
			 * @return {Boolean} True if the reminder is set false if not
			 */
			isReminderSetForEventId: function (eventId) {
				if (remindersByEventId[eventId]) {
					return true;
				}
				return false;
			},

			/**
			 * Registers a event listener for uiRefresh as an alternative to the callback
			 * @method registerUIRefreshListener
			 * @param {Function} listenerFn - a function to receive the key
			 * @param {Object} callFunc - a reference back to the object containing the listener
			 */
			registerUIRefreshListener: function (listenerFn, callFunc) {
				listeners.push({listener: listenerFn, callFunc: callFunc});
			},

			/**
			 * Unregisters a event listener for uiRefresh
			 * @method unregisterUIRefreshListener
			 * @param {Function} listener
			 */
			unregisterUIRefreshListener: function (listener) {
				var i;
				for (i = 0; i < listeners.length; i++) {
					if (listeners[i].listener === listener) {
						listeners.splice(i, 1);
						break;
					}
				}
			},

			/**
			 * Sets the player to use when auto tuning
			 * @method setAutoTunePlayer
			 * @param {Object} player
			 */
			setAutoTunePlayer: function (player) {
				//CCOM.scheduler.autoTunePlayer = player;
			}
		};
	}($N || {}));

}($N || {}));

