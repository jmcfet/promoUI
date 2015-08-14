/**
 * The Scan class provides functionality to perform DVB scanning, upon the various
 * available tuners (hardware dependant).
 *
 * In order to begin the scan process, we must first register the required callbacks
 * using the methods:
 *
 *     $N.platform.system.Scan.setScanCompleteCallback(completeCallback);
 *     $N.platform.system.Scan.setScanFailureCallback(failureCallback);
 *     $N.platform.system.Scan.setScanProgressCallback(progressCallback, 10000);
 *
 * Notice that the progress callback allows for an optional time interval to control
 * the frequency of the progress update (in milliseconds).
 *
 * To start the scan process, we use the `startScan` method, and provide the
 * network type that we wish to scan.  For example;
 *
 *     $N.platform.system.Scan.startScan($N.platform.system.Scan.NetworkType.DVBC);
 *
 * This will begin a full scan on the DVB-C tuner.  If the tuner hardware is unkown on
 * you particular hardware (such as an application which runs on a variety of hardware)
 * we can find the availability of tuners using the Network class as such;
 *
 *     $N.platform.system.Network.isNetworkAvailable($N.platform.system.Scan.NetworkType.DVBC);
 *
 * Which will return true if the particular tuner is present.
 *
 * The registered progress callback will be notified during the scan process, and if
 * all goes well, the scan complete callback will be invoked at the end of the scan
 * process, and all discovered services will be added to the EPG database (available
 * via the EPG module).
 *
 * Additional scan parameters can be supplied to the startScan method, although this
 * is vendor specific (please consult your middle ware documentation).
 *
 * @class $N.platform.system.Scan
 * @singleton
 *
 * @requires $N.apps.core.Log
 */

/*global CCOM*/
define('jsfw/platform/system/Scan',
	[
		'jsfw/apps/core/Log'
	],
	function (Log) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.system = $N.platform.system || {};

		$N.platform.system.Scan = (function () {

			// constants
			// paths to set scan profiles
			var DVBS_PROFILE = "/network/siconfig/networkClasses/Satellite/transponders/0/dvbs/",
				DVBC_PROFILE = "/network/siconfig/networkClasses/Cable/transponders/0/dvbc/",
				DVBT_PROFILE = "",
				SCANS_PATH = "/network/siconfig/scans/";

			var log = new $N.apps.core.Log("system", "Scan");

			// private properties
			var scanHandle = null,
				scanType = null,
				scanError = null;

			// scan profiles
			var dvbsSVLScanProfileName = "satellite_one_shot",
				dvbcSVLScanProfileName = "cable_one_shot",
				dvbtSVLScanProfileName = "terrestrial_one_shot",
				dvbsSVLEPGScanProfileName = "satellite_persistent",
				dvbcSVLEPGScanProfileName = "cable_persistent",
				dvbtSVLEPGScanProfileName = "terrestrial_continuous";

			//TODO: one day support regional custom profiles

			var scanProfilePath = DVBS_PROFILE,
				currentScanType = null;

			// callbacks
			var scanCompleteCallback = null,
				scanProgressCallback = null,
				scanFailureCallback = null,
				lockConfiguration = null;

			// private methods
			function detectNetworkTypesAvailable() {
				var profiles = CCOM.ConfigManager.getSubtree("/network/siconfig/networkClasses");
				/*if (!profiles.error) {
					//TODO: pull out what networks are available
				}*/
			}

			/**
			 * Sets the CCOM scan profile parameters.
			 * @method initialiseScanProperties
			 * @private
			 * @param {Number} networkType One of type $N.platform.system.Scan.NetworkType
			 * @param {Object} properties A JSON object containing the scan properties
			 */
			function initialiseScanProperties(networkType, properties) {
				log("initialiseScanProperties", "start");
				var property;
				scanType = networkType;

				switch (networkType) {
				case $N.platform.system.Scan.NetworkType.DVBC:
					scanProfilePath = DVBC_PROFILE;
					break;
				case $N.platform.system.Scan.NetworkType.DVBS:
					scanProfilePath = DVBS_PROFILE;
					break;
				case $N.platform.system.Scan.NetworkType.DVBT:
					scanProfilePath = DVBT_PROFILE;
					break;
				}
				for (property in properties) {
					if (properties.hasOwnProperty(property)) {
						log("initialiseScanProperties", "setting " + property + " : " + properties[property]);
						CCOM.ConfigManager.setValue(scanProfilePath + property, properties[property]);
					}
				}
			}

			/**
			 * Disables automatic scanning.
			 * @method disableAutomaticScanning
			 * @private
			 */
			function prepareScan(networkType, parameters, callback) {
				log("prepareScan", "Enter");
				lockConfiguration = function (success) {
					log("prepareScan", "lockConfiguration callback, success: " + success);
					if (success) {
						switch (networkType) {
						case $N.platform.system.Scan.NetworkType.DVBC:
							CCOM.ConfigManager.setValue(SCANS_PATH + dvbcSVLEPGScanProfileName + "/enabled", false);
							break;
						case $N.platform.system.Scan.NetworkType.DVBS:
							CCOM.ConfigManager.setValue(SCANS_PATH + dvbsSVLEPGScanProfileName + "/enabled", false);
							break;
						case $N.platform.system.Scan.NetworkType.DVBT:
							CCOM.ConfigManager.setValue(SCANS_PATH + dvbtSVLEPGScanProfileName + "/enabled", false);
							break;
						}
						if (parameters) {
							initialiseScanProperties(networkType, parameters);
						}
						lockConfiguration = null;
						log("prepareScan", "unlocking configuration");
						CCOM.SINetwork.unlockConfiguration();
						callback(true);
					} else {
						callback(false);
					}
				};
				log("prepareScan", "locking configuration");
				CCOM.SINetwork.lockConfiguration();
			}

			/**
			 * Enables automatic scanning.
			 * @method enableAutomaticScanning
			 * @private
			 */
			function enableAutomaticScanning() {
				log("enableAutomaticScanning", "Enter");
				lockConfiguration = function (success) {
					log("enableAutomaticScanning", "lockConfiguration callback, success: " + success);
					if (success) {
						switch (currentScanType) {
						case $N.platform.system.Scan.NetworkType.DVBC:
							CCOM.ConfigManager.setValue(SCANS_PATH + dvbcSVLEPGScanProfileName + "/enabled", true);
							break;
						case $N.platform.system.Scan.NetworkType.DVBS:
							CCOM.ConfigManager.setValue(SCANS_PATH + dvbsSVLEPGScanProfileName + "/enabled", true);
							break;
						case $N.platform.system.Scan.NetworkType.DVBT:
							CCOM.ConfigManager.setValue(SCANS_PATH + dvbtSVLEPGScanProfileName + "/enabled", true);
							break;
						default:
							CCOM.ConfigManager.setValue(SCANS_PATH + dvbsSVLEPGScanProfileName + "/enabled", true);
						}
						log("enableAutomaticScanning", "unlocking configuration");
						CCOM.SINetwork.unlockConfiguration();
					}
				};
				log("enableAutomaticScanning", "locking configuration");
				CCOM.SINetwork.lockConfiguration();
			}

			/**
			 * Clears the internal scan properties.
			 * @method clearScanProperties
			 * @private
			 */
			function clearScanProperties() {
				scanHandle = null;
				scanError = null;
				scanCompleteCallback = null;
				scanProgressCallback = null;
				scanFailureCallback = null;
			}

			/**
			 * Called in respone to a onScanComplete event.
			 * This event is fired once, when the scan has finished.
			 * The method checks if an error occured, and calls the corresponding callback if set.
			 * @method scanCompleteListener
			 * @private
			 * @param {Object} result CCOM scan complete object
			 */
			function scanCompleteListener(result) {
				log("scanCompleteListener", "Enter");
				if (scanError) {
					if (scanFailureCallback) {
						log("scanCompleteListener", "calling scanFailureCallback");
						scanFailureCallback(scanError);
					} else {
						log("scanCompleteListener", "scanFailureCallback not defined");
					}
				} else {
					if (scanCompleteCallback) {
						log("scanCompleteListener", "calling scanCompleteCallback: " + result);
						scanCompleteCallback(result);
					} else {
						log("scanCompleteListener", "scanCompleteCallback not defined");
					}
				}
				enableAutomaticScanning();
				clearScanProperties();
			}

			/**
			 * Called in respone to a onScanError event.
			 * This event is fired during a scan error.  The method checks the error code, and
			 * sets the scanError to one of the $N.platform.system.Scan.Error types.
			 * @method scanErrorListener
			 * @private
			 * @param {Object} result CCOM error object
			 */
			function scanErrorListener(result) {
				var reason;
				switch (result.condition) {
				case CCOM.SINetwork.UNKNOWN_ERROR:
					reason = "UNKNOWN_ERROR";
					scanError = $N.platform.system.Scan.Error.MISC_ERROR;
					break;
				case CCOM.SINetwork.DATABASE_FULL:
					reason = "DATABASE_FULL";
					scanError = $N.platform.system.Scan.Error.MISC_ERROR;
					break;
				case CCOM.SINetwork.TIMEOUT_OCCURRED:
					reason = "TIMEOUT_OCCURRED";
					scanError = $N.platform.system.Scan.Error.MISC_ERROR;
					break;
				case CCOM.SINetwork.SI_ERROR:
					reason = "SI_ERROR";
					scanError = $N.platform.system.Scan.Error.MISC_ERROR;
					break;
				case CCOM.SINetwork.RESOURCE_UNAVAILABLE:
					reason = "RESOURCE_UNAVAILABLE";
					scanError = $N.platform.system.Scan.Error.UNAVAILABLE;
					break;
				case CCOM.SINetwork.CONNECTION_ERROR:
					reason = "CONNECTION_ERROR";
					scanError = $N.platform.system.Scan.Error.UNAVAILABLE;
					break;
				case CCOM.SINetwork.BUSY:
					reason = "BUSY";
					scanError = $N.platform.system.Scan.Error.BUSY;
					break;
				case CCOM.SINetwork.SCAN_CANCELED:
					reason = "SCAN_CANCELED";
					scanError = $N.platform.system.Scan.Error.CANCELED;
					break;
				}
				log("scanErrorListener", "Scan error " + result.condition + ", " + reason, "error");
			}

			/**
			 * Called in respone to a onScanProgress event.
			 * This event is fired periodically during the scan process, after each transponder.
			 * @method scanProgressListener
			 * @private
			 * @param {Object} result ProgressInfo object
			 */
			function scanProgressListener(result) {
				log("scanProgressListener", "");

				var info = result.progressInfo,
					percentComplete = info.scannedPercent || 0,
					hdServicesFound = 0,
					sdServicesFound = info.tvServicesFoundCount || 0,
					radioServicesFound = info.radioServicesFoundCount || 0,
					otherServicesFound = 0,
					scanInfo;

				if (scanProgressCallback) {
					scanInfo = {
						type: scanType,
						percentComplete: percentComplete,
						hdServices: hdServicesFound,
						sdServices: sdServicesFound,
						radioServices: radioServicesFound,
						otherServices: otherServicesFound
					};
					scanProgressCallback(scanInfo);
				}
			}

			/**
			 * Called in respone to a getScanProgressFailed event.
			 * @method getScanProgressFailedListener
			 * @private
			 * @param {Object} result
			 */
			function getScanProgressFailedListener(result) {
				log("getScanProgressFailedListener", result.error.message, "error");
			}

			function createDVBSScans() {
				var tree = CCOM.ConfigManager.getSubtree(SCANS_PATH + dvbsSVLScanProfileName);
				if (tree.error) {
					CCOM.ConfigManager.setValue(SCANS_PATH + dvbsSVLScanProfileName + "/networkClass", "Satellite");
					CCOM.ConfigManager.setValue(SCANS_PATH + dvbsSVLScanProfileName + "/enabled", true);
			        CCOM.ConfigManager.setValue(SCANS_PATH + dvbsSVLScanProfileName + "/persistent", false);
			        CCOM.ConfigManager.setValue(SCANS_PATH + dvbsSVLScanProfileName + "/scanType", 1);
			        CCOM.ConfigManager.setValue(SCANS_PATH + dvbsSVLScanProfileName + "/useConnectedTuners", false);
			        CCOM.ConfigManager.setValue(SCANS_PATH + dvbsSVLScanProfileName + "/automatic", false);
				}
				tree = CCOM.ConfigManager.getSubtree(SCANS_PATH + dvbsSVLEPGScanProfileName);
				if (tree.error) {
					CCOM.ConfigManager.setValue(SCANS_PATH + dvbsSVLEPGScanProfileName + "/networkClass", "Satellite");
					CCOM.ConfigManager.setValue(SCANS_PATH + dvbsSVLEPGScanProfileName + "/enabled", false);
			        CCOM.ConfigManager.setValue(SCANS_PATH + dvbsSVLEPGScanProfileName + "/persistent", true);
			        CCOM.ConfigManager.setValue(SCANS_PATH + dvbsSVLEPGScanProfileName + "/scanType", 2);
			        CCOM.ConfigManager.setValue(SCANS_PATH + dvbsSVLEPGScanProfileName + "/useConnectedTuners", true);
			        CCOM.ConfigManager.setValue(SCANS_PATH + dvbsSVLEPGScanProfileName + "/automatic", true);
				}
			}

			function createDVBCScans() {
				var tree = CCOM.ConfigManager.getSubtree(SCANS_PATH + dvbcSVLScanProfileName);
				if (tree.error) {
					CCOM.ConfigManager.setValue(SCANS_PATH + dvbcSVLScanProfileName + "/networkClass", "Cable");
					CCOM.ConfigManager.setValue(SCANS_PATH + dvbcSVLScanProfileName + "/enabled", true);
		            CCOM.ConfigManager.setValue(SCANS_PATH + dvbcSVLScanProfileName + "/persistent", false);
		            CCOM.ConfigManager.setValue(SCANS_PATH + dvbcSVLScanProfileName + "/scanType", 1);
		            CCOM.ConfigManager.setValue(SCANS_PATH + dvbcSVLScanProfileName + "/useConnectedTuners", false);
		            CCOM.ConfigManager.setValue(SCANS_PATH + dvbcSVLScanProfileName + "/automatic", false);
				}
				tree = CCOM.ConfigManager.getSubtree(SCANS_PATH + dvbcSVLEPGScanProfileName);
				if (tree.error) {
					CCOM.ConfigManager.setValue(SCANS_PATH + dvbcSVLEPGScanProfileName + "/networkClass", "Cable");
					CCOM.ConfigManager.setValue(SCANS_PATH + dvbcSVLEPGScanProfileName + "/enabled", false);
		            CCOM.ConfigManager.setValue(SCANS_PATH + dvbcSVLEPGScanProfileName + "/persistent", true);
		            CCOM.ConfigManager.setValue(SCANS_PATH + dvbcSVLEPGScanProfileName + "/scanType", 2);
		            CCOM.ConfigManager.setValue(SCANS_PATH + dvbcSVLEPGScanProfileName + "/useConnectedTuners", true);
		            CCOM.ConfigManager.setValue(SCANS_PATH + dvbcSVLEPGScanProfileName + "/automatic", true);
				}
			}

			function createDVBTScans() {
				//TODO: Implement once we have DVBT support
			}

			function createScans() {
				lockConfiguration = function (success) {
					log("createScans", "lockConfiguration callback, success: " + success);
					createDVBSScans();
					createDVBCScans();
					createDVBTScans();
					lockConfiguration = null;
					log("createScans", "unlocking configuration");
					CCOM.SINetwork.unlockConfiguration();
				};
				CCOM.SINetwork.lockConfiguration();
			}

			//public API
			return {
				/**
				 * Initialises the Scan singleton.
				 * @method init
				 */
				init : function () {
					log("init", "Initialising Scan singleton.");

					// add event listeners
					CCOM.SINetwork.addEventListener("onScanComplete", scanCompleteListener);
					CCOM.SINetwork.addEventListener("onScanError", scanErrorListener);
					CCOM.SINetwork.addEventListener("onScanProgress", scanProgressListener);
					CCOM.SINetwork.addEventListener("getScanProgressOK", scanProgressListener);
					CCOM.SINetwork.addEventListener("getScanProgressFailed", getScanProgressFailedListener);
					CCOM.SINetwork.addEventListener("lockConfigurationOK", function () {
						if (lockConfiguration) {
							lockConfiguration(true);
						}
					});
					CCOM.SINetwork.addEventListener("lockConfigurationFailed", function () {
						if (lockConfiguration) {
							lockConfiguration(false);
						}
					});

					createScans();
					detectNetworkTypesAvailable();
				},

				/**
				 * Initialises the Scan singleton.
				 * @method initialise
				 * @deprecated use init()
				 */
				initialise : function () {
					this.init();
				},

				/**
				 * Set the callback function to be invoked upon scan completion.
				 * @method setScanCompleteCallback
				 * @param {Function} callback The callback function.
				 */
				setScanCompleteCallback : function (callback) {
					log("setScanProgressCallback", "Setting scan complete callback.");
					scanCompleteCallback = callback;
				},

				/**
				 * Set the callback function to be invoked during scan progress.  The callback will be updated
				 * at the duration set by the interval parameter.
				 * @method setScanProgressCallback
				 * @param {Function} callback The callback function.
				 */
				setScanProgressCallback : function (callback) {
					log("setScanProgressCallback", "Setting scan progress callback.");
					scanProgressCallback = callback;
				},

				/**
				 * Set the callback function to be invoked upon scan failure.
				 * @method setScanFailureCallback
				 * @param {Function} callback The callback function.
				 */
				setScanFailureCallback : function (callback) {
					log("setScanFailureCallback", "Setting scan failure callback.");
					scanFailureCallback = callback;
				},

				/**
				 * Starts the scan of the specified network type.  A full scan is performed unless specified
				 * in the optional parameters parameter.
				 * @method startScan
				 * @param {Number} networkType Type of $N.platform.system.Scan.NetworkType
				 * @param {Object} [parameters] An object describing the scan parameters such as
				 * @param {Number} parameters.nbPolarization $N.platform.system.Scan.DVBS_Polarization.LINEAR_HORIZONTAL
				 * @param {Number} parameters.fecInner $N.platform.system.Scan.DVBS_InnerFEC._2_3, symbolRate: 27500
				 * @param {Number} parameters.frequency 11170000
				 * @param {Number} parameters.modulation $N.platform.system.Scan.DVBS_ModulationType.QPSK
				 * @param {Number} parameters.rollOff $N.platform.system.Scan.DVBS_RollOff._0_20
				 * @param {Boolean} parameters.isDVBS2 false
				 * @return {Boolean} True on successful scan initiation
				 */
				startScan : function (networkType, parameters) {
					log("startScan", "Network " + networkType);
					var result;

					if (scanHandle) {
						log("startScan", "Scan already in progress!");
						return false;
					}
					currentScanType = networkType;
					prepareScan(networkType, parameters, function (success) {
						if (success) {
							log("startScan", "Starting scan...");
							switch (networkType) {
							case $N.platform.system.Scan.NetworkType.DVBC:
								result = CCOM.SINetwork.scan(dvbcSVLScanProfileName);
								break;
							case $N.platform.system.Scan.NetworkType.DVBS:
								result = CCOM.SINetwork.scan(dvbsSVLScanProfileName);
								break;
							case $N.platform.system.Scan.NetworkType.DVBT:
								result = CCOM.SINetwork.scan(dvbtSVLScanProfileName);
								break;
							}

							if (result.error) {
								log("startScan", "Scan error code: " + result.error);
								if (scanFailureCallback) {
									log("startScan", "calling scanFailureCallback");
									scanFailureCallback($N.platform.system.Scan.Error.MISC_ERROR);
								}
							} else {
								log("startScan", "Scan started, scan handle " + result.scanHandle);
								scanHandle = result.scanHandle;
							}
						} else {
							if (scanFailureCallback) {
								log("startScan", "calling scanFailureCallback");
								scanFailureCallback($N.platform.system.Scan.Error.MISC_ERROR);
							}
						}
					});
					return true;
				},

				/**
				 * Cancels the currently running scan.
				 * @method cancelScan
				 */
				cancelScan : function () {
					if (scanHandle) {
						log("cancelScan", "Cancelling scan.");
						CCOM.SINetwork.cancelScan(scanHandle);
						clearScanProperties();
						enableAutomaticScanning();
					} else {
						log("cancelScan", "No current scan in progress.");
					}
				},

				NetworkType: {
				/**
				 * @property {Number} NetworkType.DVBC
				 * @readonly
				 */
					DVBC: 1,
				/**
				 * @property {Number} NetworkType.DVBS
				 * @readonly
				 */
					DVBS: 2,
				/**
				 * @property {Number} NetworkType.DVBT
				 * @readonly
				 */
					DVBT: 3
				},

				Error: {
				/**
				 * @property {Number} Error.MISC_ERROR
				 * @readonly
				 */
					MISC_ERROR: 1,
				/**
				 * @property {Number} Error.BUSY
				 * @readonly
				 */
					BUSY: 2,
				/**
				 * @property {Number} Error.INVALID_PARAMS
				 * @readonly
				 */
					INVALID_PARAMS: 3,
				/**
				 * @property {Number} Error.UNAVAILABLE
				 * @readonly
				 */
					UNAVAILABLE: 4,
				/**
				 * @property {Number} Error.CANCELLED
				 * @readonly
				 */
					CANCELLED: 5
				},

				/**
				 * Enumeration of DVBC Modulation types.
				 * @property {Object} DVBC_Modulation
				 * @readonly
				 */
				DVBC_Modulation: {
					QAM16: 1,
					QAM32: 2,
					QAM64: 3,
					QAM128: 4,
					QAM256: 5
				},

				/**
				 * Enumeration of DVBC Outer FEC types.
				 * @property {Object} DVBC_OuterFEC
				 * @readonly
				 */
				DVBC_OuterFEC: {
					AUTO: 0,
					REED: 1
				},

				DVBS_InnerFEC: {
				/**
				 * @property {Number} DVBS_InnerFEC._1_2
				 * @readonly
				 */
					_1_2: 1,
				/**
				 * @property {Number} DVBS_InnerFEC._2_3
				 * @readonly
				 */
					_2_3: 2,
				/**
				 * @property {Number} DVBS_InnerFEC._3_4
				 * @readonly
				 */
					_3_4: 3,
				/**
				 * @property {Number} DVBS_InnerFEC._5_6
				 * @readonly
				 */
					_5_6: 4,
				/**
				 * @property {Number} DVBS_InnerFEC._7_8
				 * @readonly
				 */
					_7_8: 5,
				/**
				 * @property {Number} DVBS_InnerFEC._8_9
				 * @readonly
				 */
					_8_9: 6,
				/**
				 * @property {Number} DVBS_InnerFEC._3_5
				 * @readonly
				 */
					_3_5: 7,
				/**
				 * @property {Number} DVBS_InnerFEC._4_5
				 * @readonly
				 */
					_4_5: 8,
				/**
				 * @property {Number} DVBS_InnerFEC._9_10
				 * @readonly
				 */
					_9_10: 9,
				/**
				 * @property {Number} DVBS_InnerFEC.NONE
				 * @readonly
				 */
					NONE: 15
				},

				DVBS_Orbit: {
				/**
				 * @property {Number} DVBS_Orbit.WEST
				 * @readonly
				 */
					WEST: 0,
				/**
				 * @property {Number} DVBS_Orbit.EAST
				 * @readonly
				 */
					EAST: 1
				},

				DVBS_Polarization: {
				/**
				 * @property {Number} DVBS_Polarization.LINEAR_HORIZONTAL
				 * @readonly
				 */
					LINEAR_HORIZONTAL: 0,
				/**
				 * @property {Number} DVBS_Polarization.LINEAR_VERTICAL
				 * @readonly
				 */
					LINEAR_VERTICAL: 1,
				/**
				 * @property {Number} DVBS_Polarization.CIRCULAR_LEFT
				 * @readonly
				 */
					CIRCULAR_LEFT: 2,
				/**
				 * @property {Number} DVBS_Polarization.CIRCULAR_RIGHT
				 * @readonly
				 */
					CIRCULAR_RIGHT: 3
				},

				DVBS_RollOff: {
				/**
				 * @property {Number} DVBS_RollOff._0_35
				 * @readonly
				 */
					_0_35: 0,
				/**
				 * @property {Number} DVBS_RollOff._0_25
				 * @readonly
				 */
					_0_25: 1,
				/**
				 * @property {Number} DVBS_RollOff._0_20
				 * @readonly
				 */
					_0_20: 2
				},

				/**
				 * @property {Number} DVBS_ModulationSystem
				 * @readonly
				 */
				DVBS_ModulationSystem: {},

				DVBS_ModulationType: {
				/**
				 * @property {Number} DVBS_ModulationType.AUTO
				 * @readonly
				 */
					AUTO: 0,
				/**
				 * @property {Number} DVBS_ModulationType.QPSK
				 * @readonly
				 */
					QPSK: 1,
				/**
				 * @property {Number} DVBS_ModulationType._8PSK
				 * @readonly
				 */
					_8PSK: 2,
				/**
				 * @property {Number} DVBS_ModulationType._16PSK
				 * @readonly
				 */
					_16PSK: 3
				},

				/**
				 * Enumeration of DVBT Bandwidth types.
				 * @property {Number} DVBT_Bandwidth
				 * @readonly
				 */
				DVBT_Bandwidth: {},

				/**
				 * Enumeration of DVBT Priority types.
				 * @property {Number} DVBT_Priority
				 * @readonly
				 */
				DVBT_Priority: {},

				/**
				 * Enumeration of DVBT Constellation types.
				 * @property {Number} DVBT_Constellation
				 * @readonly
				 */
				DVBT_Constellation: {},

				/**
				 * @property {Number} DVBT_HierarchInfo
				 * @readonly
				 */
				DVBT_HierarchInfo: {},

				/**
				 * @property {Number} DVBT_CodeRate
				 * @readonly
				 */
				DVBT_CodeRate: {},

				/**
				 * @property {Number} DVBT_GuardInterval
				 * @readonly
				 */
				DVBT_GuardInterval: {},

				/**
				 * @property {Number} DVBT_TransmissionMode
				 * @readonly
				 */
				DVBT_TransmissionMode: {}

			};
		}());
		return $N.platform.system.Scan;
	}
);
