/**
 * The TimerUtil has an array of items that loops around every minute
 *
 * @class $N.app.TimerUtil
 * @static
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.TimerUtil = (function () {

		var GENERAL_STRING = "general",
			timer = {timeId: 0, items: []},
			timers = {
				"general": timer
			},
			isBlinkActive,
			/**
			 * @method stopTimer stops the timer.
			 * @param {String} timerName (optional) timerName to id the timer to be stopped
			 */
			stopTimer = function (timerName) {
				var name = timerName || GENERAL_STRING;
				if (timers[name] && timers[name].items) {
					timers[name].items = [];
					clearInterval(timers[name].timerId);
					timers[name].timerId = 0;
				}
			},
			/**
			 * @method updateItemsCallback is the function that is called every minute. If no items are left. it stops the timer.
			 * @param {String} timerName (optional) timerName to id the timer to fire
			 */
			updateItemsCallback = function (timerName) {
				var name = timerName || GENERAL_STRING,
					i = 0,
					itemsLength = timers[name].items.length;
				if (itemsLength === 0) {
					stopTimer(name);
				} else {
					isBlinkActive = !isBlinkActive;
					for (i = 0; i < itemsLength; i++) {
						if (timers[name].items[i].blink) {
							timers[name].items[i].blink(isBlinkActive);
						} else if (timers[name].items[i].update) {
							timers[name].items[i].update();
						}
					}
				}
			};

		return {
			/**
			 * @method getItems
			 * @param {String} timerName (optional) timerName to id the timer to get items from
			 * @return {Array} items relevant to the timer
			 */
			getItems: function (timerName) {
				var name = timerName || GENERAL_STRING;
				return (timers[name] && timers[name].items) ? timers[name].items : [];
			},

			/**
			 * @method addItem
			 * @param {Object} item the object to add
			 * @param {String} timerName (optional) timerName to id the timer to add item to
			 */
			addItem: function (item, timerName) {
				var name = timerName || GENERAL_STRING;
				if (!timers[name]) {
					timers[name] = timer;
				}
				timers[name].items.push(item);
			},

			/**
			 * @method _removeItem
			 * @param {Object} item the object to remove once the event has been shown
			 * @param {String} timerName (optional) timerName to id the timer to remove item from
			 */
			removeItem: function (item, timerName) {
				var name = timerName || GENERAL_STRING,
					index = 0;
				if (timers[name] && timers[name].items) {
					index = timers[name].items.indexOf(item);
					if (index > -1) {
						timers[name].items.splice(index, 1);
					}
				}
			},

			/**
			 * @method startTimer
			 * @param {Number} intervalMS (optional)
			 * @param {String} timerName (optional) timerName to id the timer to be started
			 */
			startTimer: function (intervalMS, timerName) {
				var name = timerName || GENERAL_STRING;
				if (!timers[name].timerId && timers[name].items.length > 0) {
					timers[name].timerId = setInterval(function () {
						updateItemsCallback(name);
					}, intervalMS || $N.app.constants.MINUTE_IN_MS);
				}
			},

			stopTimer: stopTimer
		};
	}());

}($N || {}));
