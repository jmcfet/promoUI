/**
 * CCOM 2 - MOCK
 *
 * This class checks for available updates and then takes care of the process of running the upgrade.
 * The actual upgrade is split into 2 stages:
 * <ol>
 *  <li>Download</li>
 *  <li>Upgrade</li>
 * </ol>
 * To use this class set the necessary callbacks using the callback setter methods
 * then call `$N.platform.system.checkForUpgrade()`
 * Upon an upgrade being available, your upgrade callback will run. The function to perform the upgrade is passed
 * back to your callback as a parameter so that you can choose whether to call it or not.
 * Upon the upgrade method being called, your download callback will be called during the download phase
 * and your install callback will be called during the install phase (this is useful if you wish to inform
 * the user of the progress of the upgrade process)
 * Once the upgrade is complete your box will either reboot or your completed upgrade callback will run
 *
 * @class $N.platform.system.Upgrade
 * @author Irina Ahmedhadzajeva
 *
 *
 * @singleton
 * @requires $N.platform.system.Preferences
 * @requires $N.apps.core.Log
 */

/*global CCOM*/

define('jsfw/platform/system/Upgrade',
	[
		'jsfw/apps/core/Log'
	],
	function (Log) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.system = $N.platform.system || {};

		$N.platform.system.Upgrade = (function () {
			var log = new $N.apps.core.Log("system", "Upgrade"),
				forcedUpgradeCallback = function () {},
				nonForcedUpgradeCallback = function () {},
				downloadCallback = function () {},
				installCallback = function () {},
				completedUpgradeCallback = function () {},
				upgradeCheckFailedCallback = function () {},
				currentStatus = null;

			/**
			 * This method is called when an UpgradeCheckResult event is fired.
			 * @method upgradeCheckHandler
			 * @private
			 * @param {Object} evt actual event
			 */
			function upgradeCheckHandler(evt) {
				log("upgradeCheckHandler", "Enter");

				var forced = 0;
		// TODO : CCOM 2.0
		//	    if (evt.resultCode === System.SYSTEM_UPGRADE_CHECK_UPDATE_AVAILABLE) {
		//
		//			currentStatus = $N.platform.system.Upgrade.UPGRADE_AVAILABLE_STATUS;
		//
		//			forced = parseInt(CCOM.system.getProperty("quantum.upgrade.forced"), 10);
		//			if (forced) {
		//				//call forced upgrade callback
		//				if (forcedUpgradeCallback) {
		//					forcedUpgradeCallback(function () {
		//						$N.platform.system.Upgrade.upgrade();
		//					});
		//				}
		//			} else {
		//				if (nonForcedUpgradeCallback) {
		//					//call upgrade callback
		//					nonForcedUpgradeCallback(function () {
		//						$N.platform.system.Upgrade.upgrade();
		//					});
		//				}
		//			}
		//		} else {
		//			log("upgradeCheckHandler", "No result code found for event");
		//		}
				log("upgradeCheckHandler", "Exit");
			}

			/**
			 * This method is called when an UpgradeProgress event is fired.
			 *
			 * @method upgradeProgressHandler
			 * @private
			 * @param {Object} evt actual event
			 */
			function upgradeProgressHandler(evt) {
		/*		switch (evt.stage) {
		// TODO : CCOM 2.0
		//	    case System.SYSTEM_UPGRADE_STAGE_DOWNLOADING:
		//			log("upgradeProgressHandler", "Dowloading " + evt.stagePercentComplete + '%');
		//			//call download callback
		//			if (downloadCallback) {
		//				downloadCallback(evt);
		//			}
		//	        break;
		//	    case System.SYSTEM_UPGRADE_STAGE_INSTALLING:
		//			log("upgradeProgressHandler", "Installing " + evt.stagePercentComplete + '%');
		//			//call install callback
		//			if (installCallback) {
		//				installCallback(evt);
		//			}
		//	        break;
		//
			    default:
					log("upgradeProgressHandler", "No event.stage property");
			        break;
			    }*/
			}

			/**
			 * This method is called when an UpgradeComplete event is fired.
			 *
			 * @method upgradeCompleteHandler
			 * @private
			 * @param {Object} evt actual event
			 */
			function upgradeCompleteHandler(evt) {
		/*		switch (evt.resultCode) {
		// TODO : CCOM 2.0
		//	    case System.SYSTEM_UPGRADE_COMPLETE_UNNECESSARY:
		//	        currentStatus = $N.platform.system.Upgrade.UPGRADE_UNNECESSARY_STATUS;
		//	        break;
		//	    case System.SYSTEM_UPGRADE_COMPLETE_DOWNLOAD_ERROR:
		//	        currentStatus = $N.platform.system.Upgrade.DOWNLOAD_ERROR_STATUS;
		//	        break;
		//	    case System.SYSTEM_UPGRADE_COMPLETE_INSTALL_ERROR:
		//	        currentStatus = $N.platform.system.Upgrade.INSTALL_ERROR_STATUS;
		//	        break;
		//	    case System.SYSTEM_UPGRADE_COMPLETE:
		//	        currentStatus = $N.platform.system.Upgrade.COMPLETE_STATUS;
		//	        break;
		//	    case System.SYSTEM_UPGRADE_COMPLETE_NEEDS_RESET:
		//	        currentStatus = $N.platform.system.Upgrade.COMPLETE_AND_RESET_STATUS;
		//	        // Reset the box.
		//	        CCOM.system.reset();
		//	        break;
		//
			    default:
					log("upgradeCompleteHandler", "No result code found for event");
			        break;
			    }*/
				if (completedUpgradeCallback) {
					completedUpgradeCallback(currentStatus);
				}
			}

			/**
			 * Remove listener method is called in checkForUpgrade
			 * and removes all listeners associated with the upgrade
			 * @method removeListeners
			 * @private
			 */
			function removeListeners() {
				log("removeListeners", "Enter");
		// TODO : CCOM 2.0
		//		CCOM.system.removeEventListener("UpgradeCheckResult", upgradeCheckHandler, false);
		//		CCOM.system.removeEventListener("UpgradeProgress", upgradeProgressHandler, false);
		//		CCOM.system.removeEventListener("UpgradeComplete", upgradeCompleteHandler, false);
		//
				log("removeListeners", "Exit");
			}

			//public API
			return {

				/**
				 * Method that checks for a new upgrade. Creates a listener for when the UpgradeCheckResult event is fired
				 * @method checkForUpgrade
				 */
				checkForUpgrade: function () {
					log("checkForUpgrade", "Enter");
					var _this = this;
				    removeListeners();
				    currentStatus = $N.platform.system.Upgrade.CHECKING_STATUS;
		// TODO : CCOM 2.0
		//			CCOM.system.addEventListener("UpgradeCheckResult", function (evt) {
		//				upgradeCheckHandler.apply(_this, [ evt ]);
		//			}, false);
		//		    CCOM.system.upgradeCheck();
		//
					log("checkForUpgrade", "Exit");
				},



				/**
				 * This method performs an upgrade.
				 * It creates listeners for when UpgradeProgress or UpgradeComplete events are fired
				 * @method upgrade
				 */
				upgrade: function () {
					log("upgrade", "Enter");
					var _this = this;
		// TODO : CCOM 2.0
		//			CCOM.system.addEventListener("UpgradeProgress", function (evt) {
		//				upgradeProgressHandler.apply(_this, [ evt ]);
		//			}, false);
		//			CCOM.system.addEventListener("UpgradeComplete", function (evt) {
		//				upgradeCompleteHandler.apply(_this, [ evt ]);
		//			}, false);
		//
				    CCOM.system.upgrade();

					log("upgrade", "Exit");
				},

				/**
				 * Sets the upgradeCheckFailed callback to the notify when the check failed
				 * i.e. no upgrade available or an error occured. The error code will be sent
				 * via the callback
				 * @method setUpgradeCheckFailedCallback
				 * @param callback {Object} The callback function to be executed.
				 */
				setUpgradeCheckFailedCallback: function (callback) {
					if (!callback) {
						callback = function () {};
					}
					upgradeCheckFailedCallback = callback;
				},

				/**
				 * Sets the forcedUpgradeCallback to the given callback function. This is called when UpgradeCheckResult
				 * event is fired and "quantum.upgrade.forced" is set to true
				 *
				 * @method setForcedUpgradeCallback
				 * @param callback {Object} The callback function to be executed.
				 */
				setForcedUpgradeCallback: function (callback) {
					if (!callback) {
						callback = function () {};
					}
					forcedUpgradeCallback = callback;
				},

				/**
				 * Sets the nonForcedUpgradeCallback to the given callback function. This is called when UpgradeCheckResult
				 * event is fired and "quantum.upgrade.forced" preference is set to false
				 *
				 * @method setNonForcedUpgradeCallback
				 * @param callback {Object} The callback function to be executed.
				 */
				setNonForcedUpgradeCallback: function (callback) {
					if (!callback) {
						callback = function () {};
					}
					nonForcedUpgradeCallback = callback;

				},

				/**
				 * Sets the downloadCallback to the given callback function.
				 * This is called during the download stage of the upgrade
				 *
				 * @method setDownloadCallback
				 * @param callback {Object} The callback function to be executed.
				 */
				setDownloadCallback: function (callback) {
					if (!callback) {
						callback = function () {};
					}
					downloadCallback = callback;
				},

				/**
				 * Sets the installCallback to the given callback function.
				 * This is called during the installation stage of the upgrade
				 *
				 * @method setInstallCallback
				 * @param callback {Object} The callback function to be executed.
				 */
				setInstallCallback: function (callback) {
					if (!callback) {
						callback = function () {};
					}
					installCallback = callback;
				},

				/**
				 * Sets the completedUpgradeCallback to the given callback function.
				 * This is called during upon an UpgradeComplete event being fired
				 *
				 * @method setCompletedUpgradeCallback
				 * @param callback {Object} The callback function to be executed.
				 */
				setCompletedUpgradeCallback: function (callback) {
					if (!callback) {
						callback = function () {};
					}
					completedUpgradeCallback = callback;
				},

				/**
				 * Returns the current status of the Upgrade
				 *
				 * @method getUpgradeStatus
				 * @return {Number} the current status of the upgrade
				 */
				getUpgradeStatus: function () {
					return currentStatus;
				}
			};
		}());
		return $N.platform.system.Upgrade;
	}
);

/**
 * currently checking for an available upgrade
 * @property {number} CHECKING_STATUS
 */
$N.platform.system.Upgrade.CHECKING_STATUS = 0;

/**
 * an upgrade is currently available
 * @property {number} UPGRADE_AVAILABLE_STATUS
 */
$N.platform.system.Upgrade.UPGRADE_AVAILABLE_STATUS = 1;

/**
 * STB is running latest firmware
 * @property {number} UP2DATE_STATUS
 */
$N.platform.system.Upgrade.UP2DATE_STATUS = 2;

/**
 * upgrades are not supported
 * @property {number} NOTSUPPORTED_STATUS
 */
$N.platform.system.Upgrade.NOTSUPPORTED_STATUS = 3;

/**
 * the upgrade is currently being downloaded
 * @property {number} DOWNLOADING_STATUS
 */
$N.platform.system.Upgrade.DOWNLOADING_STATUS = 4;

/**
 * the upgrade is currently being installed
 * @property {number} INSTALLING_STATUS
 */
$N.platform.system.Upgrade.INSTALLING_STATUS = 5;

/**
 * there was an error downloading the upgrade
 * @property {number} DOWNLOAD_ERROR_STATUS
 */
$N.platform.system.Upgrade.DOWNLOAD_ERROR_STATUS = 6;

/**
 * there was an error installing the upgrade
 * @property {number} INSTALL_ERROR_STATUS
 */
$N.platform.system.Upgrade.INSTALL_ERROR_STATUS = 7;

/**
 * the upgrade is complete
 * @property {number} COMPLETE_STATUS
 */
$N.platform.system.Upgrade.COMPLETE_STATUS = 8;

/**
 * the upgrade is complete and the box needs rebooting
 * @property {number} COMPLETE_AND_RESET_STATUS
 */
$N.platform.system.Upgrade.COMPLETE_AND_RESET_STATUS = 9;

/**
 * upgrade is not required
 * @property {number} UPGRADE_UNNECESSARY_STATUS
 */
$N.platform.system.Upgrade.UPGRADE_UNNECESSARY_STATUS = 10;

/**
 * there was an error when checking for an upgrade
 * @property {number} CHECK_ERROR_STATUS
 */
$N.platform.system.Upgrade.CHECK_ERROR_STATUS = 11;

/**
 * there was an unexpected error
 * @property {number} UNEXPECTED_STATUS
 */
$N.platform.system.Upgrade.UNEXPECTED_STATUS = 12;

/**
 * currently unable to check for an available upgrade
 * @property {number} CHECK_BUSY_STATUS
 */
$N.platform.system.Upgrade.CHECK_BUSY_STATUS = 12;
