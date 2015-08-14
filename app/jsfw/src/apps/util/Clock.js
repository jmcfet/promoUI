/**
 * This class creates a clock object that can execute a function
 * for a given granularity, whenever the time changes/is updated.
 *
 * @class $N.apps.util.Clock
 * @constructor
 * @param {Number} granularitySeconds Clock granularity in seconds.
 * @param {Object} timeChangedCallback The function to execute when the time changes/updates.
 */

define('jsfw/apps/util/Clock',
    [],
	function () {

		var Clock = function (granularitySeconds, timeChangedCallback) {
		    this.granularityMilliSec = granularitySeconds * 1000;
		    this.timeChangedCallback = timeChangedCallback;
		    this.clockTimeout = null;
		};

		/**
		 * Updates the clock and its timeout.
		 * @method updateClock
		 * @private
		 */
		Clock.prototype.updateClock = function () {
		    var now = new Date();

		    // Call callback with copy of date object to protect against
		    // callback modifying it.
		    this.timeChangedCallback(new Date(now));

		    var next = now.getTime();
		    next -= (next % this.granularityMilliSec);
		    next += this.granularityMilliSec;

			/*
			 this prevents the timer triggering just before the next time,
			 thus stops rescheduling itself repeatedly in quick succession until
			 the current time really does reach the next time.
			 */
		    next += 10;
		    var clock = this;
		    this.clockTimeout = setTimeout(function () {
				clock.updateClock();
			}, next - now.getTime());
		};

		/**
		 * Activates and updates the clock.
		 * @method activate
		 */
		Clock.prototype.activate = function () {
		    this.updateClock();
		};

		/**
		 * Deactivates the clock and clears any timeouts.
		 * @method deactivate
		 */
		Clock.prototype.deactivate = function () {
		    if (this.clockTimeout) {
		        clearTimeout(this.clockTimeout);
		    }
		    this.clockTimeout = null;
		};

		/**
		 * Convert milliseconds since epoch to a HH:MM string.
		 * @method timeToString
		 * @param {Object} timeDate Time in milliseconds or a Date object.
		 * @return {String} String representation of the time in the format HH:MM.
		 */
		Clock.prototype.timeToString = function (timeDate) {
		    if (typeof timeDate === "number") {
		        timeDate = new Date(timeDate);
		    }

		    var hours = timeDate.getHours();
		    var mins = timeDate.getMinutes();

		    return ((hours < 10) ? ("0" + String(hours)) : String(hours)) + ":" + ((mins < 10) ? ("0" + String(mins)) : String(mins));
		};

		/**
		 * Calculates the difference in minutes between two HH:MM strings.
		 * (Assumes that both strings are in the same 24 hour period).
		 * @method timeStringDiff
		 * @param {String} start Start time in HH:MM.
		 * @param {String} end End time in HH:MM.
		 * @return {Number} The difference in minutes between the two times.
		 */
		Clock.prototype.timeStringDiff = function (start, end) {
		    var startMins = (Number(start.substring(0, 2)) * 60) + Number(start.substring(3, 5));
		    var endMins = (Number(end.substring(0, 2)) * 60) + Number(end.substring(3, 5));

		    if (endMins < startMins) {
		        return (24 * 60) - startMins + endMins;
		    }
		    return endMins - startMins;
		};

		/**
		 * Formats a date object to a String representation of that date. For example, if the
		 * current date is March 5, 2013, then this method will return '1 Mar 2013' (assuming
		 * `langStrings` contains short month names)
		 * @method dateToString
		 * @param {Object} timeDate Date to be converted (either in milliseconds or a Date object).
		 * @param {Object} langStrings Language Strings that contain month names. This object should have
		 * an attribute called `monthNames` containing the names of all months.
		 * @return {String} A space-separated date as a String.
		 */
		Clock.prototype.dateToString = function (timeDate, langStrings) {
			if (typeof timeDate === "number") {
				timeDate = new Date(timeDate);
			}
			var day = timeDate.getDate();
			var month = langStrings.monthNames[timeDate.getMonth()];
			var year = timeDate.getFullYear();

			return (String(day) + " " + month + " " + String(year));
		};

		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.util = $N.apps.util || {};
		$N.apps.util.Clock = Clock;
		return Clock;
	}
);

