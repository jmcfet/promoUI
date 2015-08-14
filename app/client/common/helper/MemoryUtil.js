/**
 * Helper class for improving the performance of the UI.
 *
 * @class $N.app.MemoryUtil
 * @author rhill
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.MemoryUtil = (function () {

		var log = new $N.apps.core.Log("Helper", "MemoryUtil"),
			garbageCollectTimeout,
			garbageCollectInterval,
			memoryUsed = 0;

		function getPercentMemoryUsage() {
			return Math.round((window.performance.memory.usedJSHeapSize / window.performance.memory.totalJSHeapSize) * 10000, 2) / 100;
		}

		function collectGarbage() {
			log("collectGarbage", "Enter - " + getPercentMemoryUsage() + "%");
			if (window.gc && (getPercentMemoryUsage() > memoryUsed)) {
				window.gc();
			}
			memoryUsed = getPercentMemoryUsage();
			log("collectGarbage", "Exit - " + getPercentMemoryUsage() + "%");
		}

		function setOrUpdateGarbageCollectTimeout(time) {
			if ($N.app.MemoryUtil.garbageCollectTimeout) {
				window.clearTimeout($N.app.MemoryUtil.garbageCollectTimeout);
				$N.app.MemoryUtil.garbageCollectTimeout = null;
			}
			$N.app.MemoryUtil.garbageCollectTimeout = window.setTimeout(collectGarbage, time || $N.app.constants.DEFAULT_GARBAGE_COLLECTION_TIMEOUT_DELAY);
		}

		function setOrUpdateGarbageCollectInterval(time) {
			log("setOrUpdateGarbageCollectInterval", time || $N.app.constants.DEFAULT_GARBAGE_COLLECTION_INTERVAL);
			if ($N.app.MemoryUtil.garbageCollectInterval) {
				window.clearInterval($N.app.MemoryUtil.garbageCollectInterval);
				$N.app.MemoryUtil.garbageCollectInterval = null;
			}
			$N.app.MemoryUtil.garbageCollectInterval = window.setInterval(collectGarbage, time || $N.app.constants.DEFAULT_GARBAGE_COLLECTION_INTERVAL);
		}

		function setOrUpdateGarbageCollectTimeoutAndInterval(timeoutTime, intervalTime) {
			setOrUpdateGarbageCollectTimeout(timeoutTime);
			setOrUpdateGarbageCollectInterval(intervalTime);
		}

		function clearGarbageCollectTimeoutAndInterval() {
			if ($N.app.MemoryUtil.garbageCollectInterval) {
				window.clearInterval($N.app.MemoryUtil.garbageCollectInterval);
				$N.app.MemoryUtil.garbageCollectInterval = null;
			}
			if ($N.app.MemoryUtil.garbageCollectTimeout) {
				window.clearTimeout($N.app.MemoryUtil.garbageCollectTimeout);
				$N.app.MemoryUtil.garbageCollectTimeout = null;
			}
		}

		// Public
		return {

			setOrUpdateGarbageCollectTimeout: setOrUpdateGarbageCollectTimeout,
			setOrUpdateGarbageCollectInterval: setOrUpdateGarbageCollectInterval,
			setOrUpdateGarbageCollectTimeoutAndInterval: setOrUpdateGarbageCollectTimeoutAndInterval,
			clearGarbageCollectTimeoutAndInterval: clearGarbageCollectTimeoutAndInterval,
			garbageCollectTimeout: garbageCollectTimeout,
			garbageCollectInterval: garbageCollectInterval,
			collectGarbage: collectGarbage

		};
	}());

}($N || {}));