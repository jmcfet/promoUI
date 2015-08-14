/**
 * The Utility for storing standard Subscribable Timers
 * @class $N.app.StandardTimers
 * @static
 * @requires $N.app.SubscribableTimer
 * #depends SubscribableTimer.js
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.StandardTimers = (function () {
		var MINUTE_IN_SECONDS = 60,
			minuteTimer = new $N.app.SubscribableTimer(MINUTE_IN_SECONDS);

		return {
			minuteTimer : minuteTimer
		};
	}());
}($N || {}));
