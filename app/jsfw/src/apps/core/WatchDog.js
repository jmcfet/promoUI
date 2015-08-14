/**
 * The Watchdog class is called from the ContextManager class when a context is yet to be initialised
 * but is trying to activate. This class sets up a time interval that will keep retrying to activate
 * the context for a given time or until the context has been initialised.
 * @class $N.apps.core.WatchDog
 * @constructor
 */

/*global setTimeout*/

define('jsfw/apps/core/WatchDog',
    ['jsfw/apps/core/Log'],
	function (Log) {
		function WatchDog() {

			var log = new $N.apps.core.Log("context", "ContextManagerWatchDog"),
				watchdog_retries,
				delay_watchdog_retries = 0,
				loadedCallback = null,
				failedCallback = null;

			/**
			 * Sets the callback that will be executed when a context has successfully loaded.
			 *
			 * @method setLoadedCallback
			 * @param {Object} callback
			 */
			this.setLoadedCallback = function (callback) {
				loadedCallback = callback;
			};

			/**
			 * Sets the callback that will be executed when a context fails to load.
			 *
			 * @method setFailedCallback
			 * @param {Object} callback
			 */
			this.setFailedCallback = function (callback) {
				failedCallback = callback;
			};

			/**
			 * Returns the number of attempts that the WatchDog has currently made to load a context.
			 *
			 * @method getWatchdog_retries
			 * @return {Number}
			 */
			this.getWatchdog_retries = function () {
				return watchdog_retries;
			};

			/**
			 * Persists the number of attempts that the WatchDog has made to load a context.
			 *
			 * @method setWatchdog_retries
			 * @param {Object} retries
			 */
			this.setWatchdog_retries = function (retries) {
				watchdog_retries = retries;
			};

			/**
			 * Returns the time spent attempting to load a context. If it becomes equal to `DELAY_WATCHDOG_TO`,
			 * then the attempt to load the context will be aborted.
			 *
			 * @method getDelay_watchdog_retries
			 * @return {Number} time in milliseconds
			 */
			this.getDelay_watchdog_retries = function () {
				return delay_watchdog_retries;
			};

			/**
			 * Updates the time spent loading a context. If the value of `getDelay_watchdog_retries()`
			 * becomes equal to `DELAY_WATCHDOG_TO`, then the attempt to load the context will be aborted.
			 *
			 * @method setDelay_watchdog_retries
			 * @param {Object} retries time in millisecondsIf the value of `getDelay_watchdog_retries()`
			 * becomes equal to `DELAY_WATCHDOG_TO`, then the attempt to load the context will be aborted.
			 */
			this.setDelay_watchdog_retries = function (retries) {
				delay_watchdog_retries = retries;
			};

			/**
			 * Monitors the context initialisation process and calls either the loaded or failed callback
			 * depending on whether or not the context was successfully loaded.
			 *
			 * @method startWatchDog
			 * @param {Object} objToLoad The context that is to be loaded.
			 */
			this.startWatchDog = function (objToLoad) {
				log("startWatchDog", "Enter");

				if (watchdog_retries !== WatchDog.INIT_WATCHDOG_TO) {
					//we haven't finished pre_emptively/lazy_loading loading this screen... try navigating again later
					if (!objToLoad.isLoaded()) {
						watchdog_retries += WatchDog.INIT_WATCHDOG_RETRY_INTERVAL;
						log("startWatchDog", "Context (" + objToLoad.getId() + ") not initialised... retrying (" + watchdog_retries + "/" + WatchDog.INIT_WATCHDOG_TO + "ms)");
						var _this = this,
							callBack = function () {
								_this.startWatchDog(objToLoad);
							};
						setTimeout(callBack, WatchDog.INIT_WATCHDOG_RETRY_INTERVAL);
					} else {
						loadedCallback();
					}
				} else {
					log("startWatchDog", "Initialisation timeout! Context: " + objToLoad.getId() + " not loaded.");
					failedCallback();
				}
				log("startWatchDog", "Exit");
			};


			/**
			 * Sets the timeout threshold for loading/initialising contexts.
			 * @method setWatchdogTO
			 * @param {Number} to Timeout in milliseconds.
			 */
			this.setWatchdogTO = function (to) {
				WatchDog.INIT_WATCHDOG_TO = to;
			};

			/**
			 * Sets the timeout threshold waiting for precaching contexts.
			 * @method setDelayWatchdogTO
			 * @param {Number} to Timeout in milliseconds.
			 */
			this.setDelayWatchdogTO = function (to) {
				WatchDog.DELAY_WATCHDOG_TO = to;
			};

		}

		/**
		 * Watchdog initialisation timeout in milliseconds.
		 * @property {Number} INIT_WATCHDOG_TO
		 * @static
		 */
		WatchDog.INIT_WATCHDOG_TO = 60000;

		/**
		 * Watchdog initialisation retry frequency in milliseconds.
		 * @property {Number} INIT_WATCHDOG_RETRY_INTERVAL
		 * @static
		 */
		WatchDog.INIT_WATCHDOG_RETRY_INTERVAL = 200;

		/**
		 * Navigate Delay timeout in milliseconds.
		 * @property {Number} DELAY_WATCHDOG_TO
		 * @static
		 */
		WatchDog.DELAY_WATCHDOG_TO = 60000;

		/**
		 * Navigate Delay retry frequency in milliseconds.
		 * @property {Number} DELAY_WATCHDOG_RETRY_INTERVAL
		 * @static
		 */
		WatchDog.DELAY_WATCHDOG_RETRY_INTERVAL = 200;

		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.core = $N.apps.core || {};
		$N.apps.core.WatchDog = WatchDog;
		return WatchDog;
	}
);

