/**
 * This class provides utility functions supporting the operation of VOD.
 * @class $N.app.VODHelper
 * @author rvaughan
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	$N.app = $N.app || {};
	$N.app.VODHelper = (function () {
		var log = new $N.apps.core.Log("Helper", "VODHelper"),
			scanCompleteListener = null,
			scanRunning = false,
			performVODDSADScan,
			scanEnabled = true,
			recheckVODConfiguration,
			vodFeatureEnabledListenerId,
			vodFeatureDisabledListenerId,
			vodScanCompleted,
			vodScanFailed,
			initialised = false,
			vodScanFailureRetryTimers = [5, 10, 20, 40, 80, 160, 320, 600],
			vodScanFailCount = 0;

		/**
		 * Called back by the Scan class when the VOD DSAD scan fails.
		 * @private
		 */
		vodScanFailed = function () {
			log("vodScanFailed", "Enter");

			scanRunning = false;

			CCOM.SINetwork.removeEventListener("onScanComplete", vodScanCompleted);
			CCOM.SINetwork.removeEventListener("onScanError", vodScanCompleted);
			$N.common.helper.ScanManager.setAutomaticScanEnabledCallback(null);
			$N.common.helper.ScanManager.enableAutomaticScans();
			log("vodScanFailed", "scanEnabled " + scanEnabled + " ____ " + $N.app.Config.getConfigValue("mds.developer.mode"));
			if (scanEnabled && ($N.app.Config.getConfigValue("mds.developer.mode") !== "on")) {
				log("vodScanFailed", "Retrying VOD area ID scan " + vodScanFailCount + " ___ " + vodScanFailureRetryTimers[vodScanFailCount]);
				window.setTimeout(performVODDSADScan, (vodScanFailureRetryTimers[vodScanFailCount] * $N.app.constants.SECOND_IN_MS));
				if (vodScanFailCount < (vodScanFailureRetryTimers.length - 1)) {
					vodScanFailCount++;
				}
			}

			log("vodScanFailed", "Exit");
		};

		/**
		 * Called back by the Scan class when the VOD DSAD scan is completed.
		 * @private
		 */
		vodScanCompleted = function () {
			log("vodScanCompleted", "Enter");

			scanRunning = false;

			var newAreaIdValue = $N.platform.system.Preferences.get($N.app.constants.PREF_AREA_ID, true);
			newAreaIdValue = parseInt(newAreaIdValue, 10);

			$N.common.helper.ScanManager.setAutomaticScanEnabledCallback(null);
			$N.common.helper.ScanManager.enableAutomaticScans();

			if (newAreaIdValue !== 0) {
				vodScanFailCount = 0;
				if (scanCompleteListener !== null) {
					scanCompleteListener();
				}
			} else {
				vodScanFailed();
			}

			log("vodScanCompleted", "Exit");
		};

		/**
		 * Triggers the scan for the VOD dynamic serving area descriptor.
		 * @private
		 */
		performVODDSADScan = function () {
			var result,
				automaticScanCallback = function (success) {
					log("automaticScanCallback", "Enter - success:" + success);
					if (success === true) {
						CCOM.SINetwork.addEventListener("onScanComplete", vodScanCompleted);
						CCOM.SINetwork.addEventListener("onScanError", vodScanCompleted);

						result = CCOM.SINetwork.scan("VodDsadScan");
						if (result.error) {
							log("automaticScanCallback", "result.error : " + result.error);
							// If we couldn't trigger the scan, then just keep retrying
							vodScanFailed();
						} else {
							scanRunning = true;
						}
					}
					log("automaticScanCallback", "Exit");

				};

			log("performVODDSADScan", "Enter");

			$N.common.helper.ScanManager.setAutomaticScanEnabledCallback(automaticScanCallback);
			$N.common.helper.ScanManager.disableAutomaticScans();

			log("performVODDSADScan", "Exit");
		};

		function retrieveDestaquesCatalogueInformation() {
			var me = this;

			$N.services.sdp.MetadataService.getData(me,
				function (response) {
					if (response && response.nodes && response.nodes.length > 0) {
						$N.app.MDSUtil.setHighlightsFolder(response.nodes[0].id);
					} else {
						log("retrieveDestaquesCatalogueInformation", "Couldn't retrieve catalogue information. Retrying in 1 second.");
						window.setTimeout(retrieveDestaquesCatalogueInformation, $N.app.constants.MDS_RETRY_TIMEOUT);
					}
				},
				function (response) {
					log("retrieveDestaquesCatalogueInformation", "Couldn't retrieve catalogue information. Retrying in 1 second.");
					window.setTimeout(retrieveDestaquesCatalogueInformation, $N.app.constants.MDS_RETRY_TIMEOUT);
				},
				"vod/nodes",
				{title: $N.app.constants.VOD_HIGHLIGHTS_FOLDER},
				null,
				["id"],
				$N.app.constants.MDS_MAX_RECORDS_RETURNED);
		}

		/**
		 * This function is called when the VOD feature is disabled on the system.
		 * @private
		 */
		function retrieveStaticCatalogueInformation() {
			retrieveDestaquesCatalogueInformation();
		}

		/**
		 * This function is called when the VOD feature is enabled on the system.
		 * @param {Object} The event information.
		 * @private
		 */
		function vodEnabledListener(event) {
			scanEnabled = true;
			recheckVODConfiguration();
			window.setTimeout(retrieveStaticCatalogueInformation, 1);
		}

		/**
		 * This function is called when the VOD feature is disabled on the system.
		 * @param {Object} The event information.
		 * @private
		 */
		function vodDisabledListener(event) {
			scanEnabled = false;
		}

		return {
			/**
			 * Initialises the ApplicationLauncher. This must be called before calling
			 * any other function otherwise random/undefined behaviour may
			 * be seen.
			 * @method initialise
			 * @public
			 */
			initialise : function () {
				if (!initialised) {
					if ($N.app.FeatureManager.isVODEnabled()) {
						window.setTimeout(performVODDSADScan, 1);
						window.setTimeout(retrieveStaticCatalogueInformation, 1);
					}

					vodFeatureEnabledListenerId = $N.apps.util.EventManager.subscribe("VODEnabled", vodEnabledListener, this);
					vodFeatureDisabledListenerId = $N.apps.util.EventManager.subscribe("VODDisabled", vodDisabledListener, this);

					initialised = true;
				}
			},

			/**
			 * Allows a calling function to be notified when any in-progress VOD scan
			 * is completed. Please note that only one function can be waiting at any
			 * time, and any new calls to this function will lose any previous listeners
			 * who were waiting.
			 * @param callback The function to callback when any scan completes. This
			 *                  function takes no parameters.
			 */
			waitForVODScanCompletion : function (callback) {
				if (scanRunning) {
					scanCompleteListener = callback;
				} else {
					callback();
				}
			},

			/**
			 * Allows the application to re-validate the VOD configuration.
			 */
			recheckVODConfiguration : function () {
				if (!scanRunning) {
					vodScanFailCount = 0;
					window.setTimeout(performVODDSADScan, 1);
				}
			},

			/**
			 * Re-enable the VOD area scan. Will cause a scan to be issued
			 * immediately.
			 */
			enableAreaScan : function () {
				scanEnabled = true;
				recheckVODConfiguration();
			},

			/**
			 * Disable the VOD area scan. Will cancel any in-progress scan that
			 * is running.
			 */
			disableAreaScan : function () {
				scanEnabled = false;

				if (scanRunning) {
					$N.platform.system.Scan.cancelScan();
				}
			}
		};
	}());

}($N || {}));
