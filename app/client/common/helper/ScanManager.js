/**
 * @class $N.common.helper.ScanManager
 * @singleton
 *
 * @requires $N.apps.core.Log
 * @requires $N.platform.system.Preferences
 */
(function ($N) {
	"use strict";
	$N.common = $N.common || {};
	$N.common.helper = $N.common.helper || {};
	$N.common.helper.ScanManager = (function () {
		var log = new $N.apps.core.Log("system", "ScanManager"),
			_initialised = false,
			_systemConfiguration = {},
			_scanHandle = null,
			_scanError = null,
			_scanCompleteCallback = null,
			_scanProgressCallback = null,
			_scanFailureCallback = null,
			_defaultScanConfig = null,
			_currentScanConfig = null,
			_lockConfigurationResultFunction = null,
			_autoScanEnabledCallback = null,
			_lockPending  = false;

		function dumpScanConfig(scanName) {
			var res,
				key;

			// Get all of the declared configurations
			res = CCOM.ConfigManager.getSubtree("/network/siconfig/networkClasses/Cable");
			if (res.error) {
				log("dumpScanConfig", "Could not retrieve any network classes: " + res.error.message);
			} else {
				for (key in res.keyValuePairs) {
					if (res.keyValuePairs.hasOwnProperty(key)) {
						log("dumpScanConfig", key + " -> " + res.keyValuePairs[key]);
					}
				}
			}

			// Get all of the declared configurations
			res = CCOM.ConfigManager.getSubtree("/network/siconfig/scans/" + _currentScanConfig.name);
			if (res.error) {
				log("dumpScanConfig", "Could not retrieve any scans: " + res.error.message);
			} else {
				for (key in res.keyValuePairs) {
					if (res.keyValuePairs.hasOwnProperty(key)) {
						log("dumpScanConfig", key + " -> " + res.keyValuePairs[key]);
					}
				}
			}
		}

		/**
		 * @method addScanConfiguration
		 * @public
		 * To be called when a configuration is added to the set of
		 * existing scan configurations, before triggering a scan
		 * for the new type
		 */
		function addScanConfiguration(scanConfig, successCallback, failureCallback) {
			if (!_lockPending) {
				_lockPending = true;
				_lockConfigurationResultFunction = function (success) {
					var networkClassPath,
						transponderPath,
						scan,
						scanKey;
					if (success) {
						for (scanKey in scanConfig) {
							if (scanConfig.hasOwnProperty(scanKey)) {
								scan = scanConfig[scanKey];
								if (!_systemConfiguration.scans.hasOwnProperty(scanKey)) {
									_systemConfiguration.scans[scanKey] = scan;
									CCOM.ConfigManager.setValue("/network/siconfig/scans/" + scan.name + "/enabled", false);
									CCOM.ConfigManager.setValue("/network/siconfig/scans/" + scan.name + "/networkClass", _systemConfiguration.networkClass);
									CCOM.ConfigManager.setValue("/network/siconfig/scans/" + scan.name + "/persistent", scan.persistent);
									CCOM.ConfigManager.setValue("/network/siconfig/scans/" + scan.name + "/scanType", scan.scanType);
									CCOM.ConfigManager.setValue("/network/siconfig/scans/" + scan.name + "/useConnectedTuners", scan.useConnectedTuners);
									// To avoid middleware issues during first time boot or following a factory reset
									// we will default all scans to non-automatic (despite their configuration) when
									// we set them up. It is expected that the main UI code will then call the
									// function enableAutomaticScans to set the correct values once the installation
									// process is completed.
									CCOM.ConfigManager.setValue("/network/siconfig/scans/" + scan.name + "/automatic", false);
								}
							}
						}
						$N.platform.system.Preferences.set($N.app.constants.PREF_SCAN_CONFIGURATION, JSON.stringify(_systemConfiguration), false);
						CCOM.SINetwork.unlockConfiguration();
						_lockPending = false;
						if (successCallback) {
							successCallback();
						}
					} else {
						_lockPending = false;
						log("configureNetwork", "failed in _lockConfigurationResultFunction");
						if (failureCallback) {
							failureCallback();
						}
					}
				};
				log("configureNetwork", "Locking configuration.");
				var result = CCOM.SINetwork.lockConfiguration();
				if (result && result.error) {
					log("configureNetwork", "Could not lock the configuration.");
					log("configureNetwork", JSON.stringify(result.error));
					_lockPending = false;
				} else {
					log("configureNetwork", JSON.stringify(result));
				}
			} else {
				if (failureCallback) {
					failureCallback();
				}
			}
		}

		/**
		 * @method loadScanConfiguration
		 * @private
		 * @return {Boolean} TRUE if a new configuration was loaded or FALSE if a pre-existing
		 *                      configuration was used.
		 */
		function loadScanConfiguration() {
			log("loadScanConfiguration", "Enter");

			var jsonString = $N.platform.system.Preferences.get($N.app.constants.PREF_SCAN_CONFIGURATION, false),
				newConfigurationLoaded = false,
				configKey = "",
				networkId = 0;

			if (jsonString && jsonString !== "") {
				_systemConfiguration = JSON.parse(jsonString);
			} else {
				_systemConfiguration = {
					name: "cable",
					networkClass: "Cable",
					networkId: 0,
					modulation: 5,
					frequency: 243000,
					symbolRate: 5217,
					isDVBC2: false,
					fecOuter: 0,
					fecInner: 0,
					scans: {
						cableoneshot: {
							name: "cable_one_shot",
							defaultScan: false,
							persistent: false,
							scanType: 2,
							useConnectedTuners: false,
							automatic: false,
							sisources: ["dvbSvlSource", "dvbEITPFSource"]
						},
						mainscan: {
							name: "cable_persistent",
							defaultScan: true,
							persistent: true,
							scanType: 2,
							useConnectedTuners: true,
							automatic: true,
							sisources: ["dvbSvlSource", "dvbEITPFSource", "dvbEITSSource"]
						},
						signalstrength: {
							name: "cable_signal_strength",
							defaultScan: false,
							persistent: true,
							scanType: 0,
							useConnectedTuners: false,
							automatic: false,
							sisources: ["dvbSvlSource", "dvbEITPFSource", "dvbEITSSource"]
						}
					}
				};

				// This next section of code may not be required in all system deployments. It is here
				// so that when we upgrade from NET R1 to NET R2 that we preserve any scanning config
				// changes which had been made. For NET the only real way that we can tell this is that
				// the networkId is anything except for zero (which is the shipped default value.)
				configKey = "/network/siconfig/networkClasses/" + _systemConfiguration.networkClass + "/transponders/0/dvbc";
				networkId = CCOM.ConfigManager.getValue(configKey + "/networkId").keyValue;
				if ((typeof networkId !== 'undefined') && (networkId !== 0)) {
					_systemConfiguration.networkId = networkId;
					_systemConfiguration.modulation = CCOM.ConfigManager.getValue(configKey + "/modulation").keyValue;
					_systemConfiguration.frequency = CCOM.ConfigManager.getValue(configKey + "/frequency").keyValue;
					_systemConfiguration.symbolRate = CCOM.ConfigManager.getValue(configKey + "/symbolRate").keyValue;
					_systemConfiguration.fecOuter = CCOM.ConfigManager.getValue(configKey + "/fecOuter").keyValue;
					_systemConfiguration.fecInner = CCOM.ConfigManager.getValue(configKey + "/fecInner").keyValue;
				} else {
					newConfigurationLoaded = true;
				}

				$N.platform.system.Preferences.set($N.app.constants.PREF_SCAN_CONFIGURATION, JSON.stringify(_systemConfiguration), false);
			}

			log("loadScanConfiguration", "Exit");

			return newConfigurationLoaded;
		}

		function enableDefaultScan(successCallback, failureCallback) {
			var scanEnabled = false;

			log("enableDefaultScan", "Enabling the DEFAULT scan in the config.");

			if (!_lockPending) {
				_lockPending = true;

				scanEnabled = CCOM.ConfigManager.getValue("/network/siconfig/scans/" + _defaultScanConfig.name + "/enabled").keyValue;
				if ((scanEnabled === undefined) || (scanEnabled !== true)) {
					_lockConfigurationResultFunction = function (success) {
						var networkClassPath;

						if (success) {
							log("enableDefaultScan", "Enabling default scan...");
							_lockConfigurationResultFunction = null;

							networkClassPath = "/network/siconfig/networkClasses/" + _systemConfiguration.networkClass;

							CCOM.ConfigManager.setValue("/network/siconfig/scans/" + _currentScanConfig.name + "/enabled", false);
							CCOM.ConfigManager.setValue("/network/siconfig/scans/" + _defaultScanConfig.name + "/enabled", true);

							if (_defaultScanConfig.sisources) {
								CCOM.ConfigManager.setValue(networkClassPath + "/SISources", _defaultScanConfig.sisources);
							}

							CCOM.SINetwork.unlockConfiguration();

							_lockPending = false;

							if (successCallback) {
								successCallback();
							}

							_currentScanConfig = _defaultScanConfig;
						} else {
							_lockPending = false;

							log("enableDefaultScan", "Unable to unlock config for scan configuration changes. Aborting");
							if (failureCallback) {
								failureCallback();
							}
						}
					};

					log("enableDefaultScan", "Locking configuration.");
					CCOM.SINetwork.lockConfiguration();
				} else {
					log("enableDefaultScan", "Default scan is already enabled, so ignoring the request.");
					_lockPending = false;
				}
			} else {
				if (failureCallback) {
					failureCallback();
				}
			}
		}

		/**
		 * Called to set the automatic scan flag for any configured scan configuration.
		 * @method configureAutomaticScans
		 * @private
		 * @param {boolean} Whether the automatic scan should enabled or not.
		 */
		function configureAutomaticScans(enabled) {
			log("configureAutomaticScans", "Configuring automatic scans to " + enabled);

			if (!_lockPending) {
				_lockPending = true;

				_lockConfigurationResultFunction = function (success) {
					var scanKey,
						scan;

					_lockConfigurationResultFunction = null;

					if (success) {
						log("configureAutomaticScans", "Setting automatic flag for configured scans.");

						for (scanKey in _systemConfiguration.scans) {
							if (_systemConfiguration.scans.hasOwnProperty(scanKey)) {
								scan = _systemConfiguration.scans[scanKey];

								if (scan.automatic) {
									CCOM.ConfigManager.setValue("/network/siconfig/scans/" + scan.name + "/automatic", enabled);
								}
							}
						}

						_lockPending = false;
						CCOM.SINetwork.unlockConfiguration();

						if (_autoScanEnabledCallback) {
							_autoScanEnabledCallback(true);
						}

					} else {
						_lockPending = false;

						if (_autoScanEnabledCallback) {
							_autoScanEnabledCallback(false);
						}

						log("configureAutomaticScans", "Unable to unlock config for scan configuration changes. Aborting");
					}
				};

				log("configureAutomaticScans", "Locking configuration.");
				CCOM.SINetwork.lockConfiguration();
			} else {
				if (_autoScanEnabledCallback) {
					_autoScanEnabledCallback(false);
				}

				log("configureAutomaticScans", "Another scan is pending, unable to manage automatic scans at this time.");
			}
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
			if (_scanHandle) {
				if (_scanError) {
					if (_scanFailureCallback) {
						log("scanCompleteListener", "calling scanFailureCallback");
						_scanFailureCallback(_scanError);
					} else {
						log("scanCompleteListener", "scanFailureCallback not defined");
					}
				} else {
					if (_scanCompleteCallback) {
						log("scanCompleteListener", "calling scanCompleteCallback: " + result);
						_scanCompleteCallback(result);
					} else {
						log("scanCompleteListener", "scanCompleteCallback not defined");
					}
				}

				enableDefaultScan();

				_scanHandle = null;
			}
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
			var reason = "";

			log("scanErrorListener", JSON.stringify(result));

			switch (result.condition) {
			case CCOM.SINetwork.DATABASE_FULL:
				reason = "DATABASE_FULL";
				_scanError = $N.platform.system.Scan.Error.MISC_ERROR;
				break;
			case CCOM.SINetwork.TIMEOUT_OCCURRED:
				reason = "TIMEOUT_OCCURRED";
				_scanError = $N.platform.system.Scan.Error.MISC_ERROR;
				break;
			case CCOM.SINetwork.SI_ERROR:
				reason = "SI_ERROR";
				_scanError = $N.platform.system.Scan.Error.MISC_ERROR;
				break;
			case CCOM.SINetwork.RESOURCE_UNAVAILABLE:
				reason = "RESOURCE_UNAVAILABLE";
				_scanError = $N.platform.system.Scan.Error.UNAVAILABLE;
				break;
			case CCOM.SINetwork.CONNECTION_ERROR:
				reason = "CONNECTION_ERROR";
				_scanError = $N.platform.system.Scan.Error.UNAVAILABLE;
				break;
			case CCOM.SINetwork.BUSY:
				reason = "BUSY";
				_scanError = $N.platform.system.Scan.Error.BUSY;
				break;
			case CCOM.SINetwork.SCAN_CANCELED:
				reason = "SCAN_CANCELED";
				_scanError = $N.platform.system.Scan.Error.CANCELLED;
				break;
			case CCOM.SINetwork.UNKNOWN_ERROR:
				reason = "UNKNOWN_ERROR";
				_scanError = $N.platform.system.Scan.Error.MISC_ERROR;
				break;
			default:
				reason = "UNKNOWN_ERROR";
				_scanError = $N.platform.system.Scan.Error.MISC_ERROR;
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
			log("scanProgressListener", "Enter");

			var info = result.progressInfo,
				percentComplete = info.scannedPercent || 0,
				hdServicesFound = 0,
				sdServicesFound = info.tvServicesFoundCount || 0,
				radioServicesFound = info.radioServicesFoundCount || 0,
				otherServicesFound = 0,
				scanInfo;

			log("scanProgressListener", ((result && result.progressInfo) ? JSON.stringify(result.progressInfo) : ""));

			if (_scanProgressCallback) {
				scanInfo = {
					type: _systemConfiguration.networkClass,
					percentComplete: percentComplete,
					hdServices: hdServicesFound,
					sdServices: sdServicesFound,
					radioServices: radioServicesFound,
					otherServices: otherServicesFound
				};
				log("scanProgressListener", JSON.stringify(scanInfo));
				_scanProgressCallback(result);
			}

			log("scanProgressListener", "Exit");
		}

		function scanProgressFailedListener(result) {
			log("scanProgressFailedListener", "Enter and Exit");
		}

		function configureScanSettings(successCallback, failureCallback) {
			var scan,
				scanKey;

			log("configureScanSettings", "Enter");

			for (scanKey in _systemConfiguration.scans) {
				if (_systemConfiguration.scans.hasOwnProperty(scanKey)) {
					scan = _systemConfiguration.scans[scanKey];

					CCOM.ConfigManager.setValue("/network/siconfig/scans/" + scan.name + "/enabled", false);
					CCOM.ConfigManager.setValue("/network/siconfig/scans/" + scan.name + "/networkClass", _systemConfiguration.networkClass);
					CCOM.ConfigManager.setValue("/network/siconfig/scans/" + scan.name + "/persistent", scan.persistent);
					CCOM.ConfigManager.setValue("/network/siconfig/scans/" + scan.name + "/scanType", scan.scanType);
					CCOM.ConfigManager.setValue("/network/siconfig/scans/" + scan.name + "/useConnectedTuners", scan.useConnectedTuners);

					// To avoid middleware issues during first time boot or following a factory reset
					// we will default all scans to non-automatic (despite their configuration) when
					// we set them up. It is expected that the main UI code will then call the
					// function enableAutomaticScans to set the correct values once the installation
					// process is completed.
					CCOM.ConfigManager.setValue("/network/siconfig/scans/" + scan.name + "/automatic", false);
				}
			}

			log("configureScanSettings", "Exit");

			if (successCallback) {
				successCallback();
			}
		}

		function configureNetwork(successCallback, failureCallback) {

			if (!_lockPending) {
				_lockPending = true;

				_lockConfigurationResultFunction = function (success) {
					var networkClassPath,
						transponderPath;

					if (success) {
						log("configureNetwork", "Network configuration is being written...");
						_lockConfigurationResultFunction = null;

						networkClassPath = "/network/siconfig/networkClasses/" + _systemConfiguration.networkClass;
						transponderPath = networkClassPath + "/transponders/0/dvbc/";

						CCOM.ConfigManager.setValue(transponderPath + "networkId", _systemConfiguration.networkId);
						CCOM.ConfigManager.setValue(transponderPath + "modulation", _systemConfiguration.modulation);
						CCOM.ConfigManager.setValue(transponderPath + "frequency", _systemConfiguration.frequency);
						CCOM.ConfigManager.setValue(transponderPath + "symbolRate", _systemConfiguration.symbolRate);
						CCOM.ConfigManager.setValue(transponderPath + "isDVBC2", _systemConfiguration.isDVBC2);
						CCOM.ConfigManager.setValue(transponderPath + "fecOuter", _systemConfiguration.fecOuter);
						CCOM.ConfigManager.setValue(transponderPath + "fecInner", _systemConfiguration.fecInner);

						if (_currentScanConfig && _currentScanConfig.sisources) {
							CCOM.ConfigManager.setValue(networkClassPath + "/SISources", _currentScanConfig.sisources);
						}

						// TODO: RJV 2014-10-30
						//      This is a temporary thing whilst we bed in the current machism. For
						//      NET these two network configurations need to be kept in lock step
						//      so we need to change both at the same time.
						networkClassPath = "/network/siconfig/networkClasses/VodDsadScan";
						transponderPath = networkClassPath + "/transponders/0/dvbc/";

						CCOM.ConfigManager.setValue(transponderPath + "networkId", _systemConfiguration.networkId);
						CCOM.ConfigManager.setValue(transponderPath + "modulation", _systemConfiguration.modulation);
						CCOM.ConfigManager.setValue(transponderPath + "frequency", _systemConfiguration.frequency);
						CCOM.ConfigManager.setValue(transponderPath + "symbolRate", _systemConfiguration.symbolRate);
						CCOM.ConfigManager.setValue(transponderPath + "isDVBC2", _systemConfiguration.isDVBC2);
						CCOM.ConfigManager.setValue(transponderPath + "fecOuter", _systemConfiguration.fecOuter);
						CCOM.ConfigManager.setValue(transponderPath + "fecInner", _systemConfiguration.fecInner);
						// End of TODO code block.

						CCOM.SINetwork.unlockConfiguration();

						_lockPending = false;

						if (successCallback) {
							successCallback();
						}
					} else {
						_lockPending = false;

						log("configureNetwork", "Unable to unlock config for scan. Aborting");
						if (failureCallback) {
							failureCallback();
						}
					}
				};

				log("configureNetwork", "Locking configuration.");
				var result = CCOM.SINetwork.lockConfiguration();
				if (result && result.error) {
					log("configureNetwork", "Could not lock the configuration.");
					log("configureNetwork", JSON.stringify(result.error));
					_lockPending = false;
				} else {
					log("configureNetwork", JSON.stringify(result));
				}
			} else {
				if (failureCallback) {
					failureCallback();
				}
			}
		}

		function enableScan(successCallback, failureCallback) {
			log("enableScan", "Enabling the scan in the config.");

			if (!_lockPending) {
				_lockPending = true;

				_lockConfigurationResultFunction = function (success) {
					var networkClassPath;

					if (success) {
						log("enableScan", "Enabling scan: " + _currentScanConfig.name);
						_lockConfigurationResultFunction = null;

						if (_currentScanConfig.sisources) {
							networkClassPath = "/network/siconfig/networkClasses/" + _systemConfiguration.networkClass;
							CCOM.ConfigManager.setValue(networkClassPath + "/SISources", _currentScanConfig.sisources);
						}

						CCOM.ConfigManager.setValue("/network/siconfig/scans/" + _currentScanConfig.name + "/enabled", true);
						CCOM.ConfigManager.setValue("/network/siconfig/scans/" + _defaultScanConfig.name + "/enabled", false);

						CCOM.SINetwork.unlockConfiguration();

						_lockPending = false;

						if (successCallback) {
							successCallback();
						}
					} else {
						_lockPending = false;

						log("enableScan", "Unable to unlock config for scan configuration changes. Aborting");
						if (failureCallback) {
							failureCallback();
						}
					}
				};

				log("enableScan", "Locking configuration.");
				CCOM.SINetwork.lockConfiguration();
			} else {
				if (failureCallback) {
					failureCallback();
				}
			}
		}

		function performScan() {
			var result;

			dumpScanConfig();

			_scanError = null;

			result = CCOM.SINetwork.scan(_currentScanConfig.name);

			if (result.error) {
				if (_scanHandle && _scanHandle.error) {
					log("performScan", "Scan error code: " + JSON.stringify(_scanHandle.error));
				}
				_scanHandle = null;
			} else {
				_scanHandle = result.scanHandle;
			}
		}

		function useDefaultScanConfiguration() {
			_currentScanConfig = _defaultScanConfig;

			enableDefaultScan();
		}

		function completeSetup() {
			var scan;

			for (scan in _systemConfiguration.scans) {
				if (_systemConfiguration.scans.hasOwnProperty(scan)) {
					if (_systemConfiguration.scans[scan].defaultScan) {
						_defaultScanConfig = _systemConfiguration.scans[scan];
						_currentScanConfig = _defaultScanConfig;
					}
				}
			}

			enableDefaultScan();
		}

		//public API
		return {
			/**
			 * Initialises the Scan singleton.
			 * @method initialise
			 */
			initialise : function () {
				var scan;

				if (!_initialised) {
					log("initialise", "Initialising Scan Manager.");

					// add event listeners
					CCOM.SINetwork.addEventListener("onScanComplete", scanCompleteListener);
					CCOM.SINetwork.addEventListener("onScanError", scanErrorListener);
					CCOM.SINetwork.addEventListener("onScanProgress", scanProgressListener);
					CCOM.SINetwork.addEventListener("getScanProgressOK", scanProgressListener);
					CCOM.SINetwork.addEventListener("getScanProgressFailed", scanProgressFailedListener);
					CCOM.SINetwork.addEventListener("lockConfigurationOK", function () {
						if (_lockConfigurationResultFunction) {
							_lockConfigurationResultFunction(true);
						}
					});
					CCOM.SINetwork.addEventListener("lockConfigurationFailed", function () {
						if (_lockConfigurationResultFunction) {
							_lockConfigurationResultFunction(false);
						}
					});

					_currentScanConfig = null;

					if (loadScanConfiguration()) {
						log("initialise", "This is a new installation, so let's set up all of the network and scan information.");
						configureNetwork(function () {
							log("initialise", "Network configuration complete. Setting up the scans.");
							configureScanSettings(function () {
								completeSetup();
							});
						}, function () {
							log("initialise", "Failed to configure the system.");
						});
					} else {
						completeSetup();
					}

					_initialised = true;

					log("initialise", "Initialisation complete.");
				}
			},

			triggerScan : function (scanName, successCallback, failureCallback) {
				var networkClass = "",
					result = true;

				log("triggerScan", "Enter");

				if (_scanHandle) {
					result = false;
				} else {
					if (scanName) {
						if (_systemConfiguration.scans.hasOwnProperty(scanName)) {
							log("scan", "Scanning using '" + scanName + "' settings.");

							if (successCallback) {
								_scanCompleteCallback = successCallback;
							}
							if (failureCallback) {
								_scanFailureCallback = failureCallback;
							}

							if (!_currentScanConfig || _currentScanConfig.name !== _systemConfiguration.scans[scanName].name) {
								log("scan", "I need to reconfigure.");
								_currentScanConfig = _systemConfiguration.scans[scanName];

								enableScan(function () { performScan(); }, failureCallback);
							} else {
								log("scan", "Performing the scan.");
								performScan();
							}
						} else {
							log("scan", "No scan found in configuration with name '" + scanName + "'.");
							if (failureCallback) {
								failureCallback($N.platform.system.Scan.Error.MISC_ERROR);
							}
						}
					} else {
						log("scan", "No scan name passed.");
						if (failureCallback) {
							failureCallback($N.platform.system.Scan.Error.MISC_ERROR);
						}
					}
				}

				log("triggerScan", "Exit");
				return result;
			},

			stopScan : function () {
				if (_scanHandle) {
					CCOM.SINetwork.cancelScan(_scanHandle);

					_scanHandle = null;
				}
			},

			/**
			 * Set the callback function to be invoked upon scan completion.
			 * @method setScanCompleteCallback
			 * @param {Function} callback The callback function.
			 */
			setScanCompleteCallback : function (callback) {
				log("setScanProgressCallback", "Setting scan complete callback.");
				_scanCompleteCallback = callback;
			},

			setScanProgressCallback : function (callback) {
				log("setScanProgressCallback", "Setting scan progress callback.");
				_scanProgressCallback = callback;
			},

			getCurrentScanProgress : function (callback) {
				log("getCurrentScanProgress", "Enter");

				if (_scanHandle) {
					if (callback) {
						_scanProgressCallback = callback;
					}
					CCOM.SINetwork.getScanProgress(_scanHandle);
				} else {
					log("getCurrentScanProgress", "No scan in progress");
				}

				log("getCurrentScanProgress", "Exit");
			},

			/**
			 * Set the callback function to be invoked upon scan failure.
			 * @method setScanFailureCallback
			 * @param {Function} callback The callback function.
			 */
			setScanFailureCallback : function (callback) {
				log("setScanFailureCallback", "Setting scan failure callback.");
				_scanFailureCallback = callback;
			},

			getNetworkConfig : function () {
				log("getNetworkConfig", "Enter");

				return _systemConfiguration;
			},

			updateNetworkConfig : function (newConfiguration, successCallback, failureCallback) {
				var config = {};

				log("updateNetworkConfig", "Enter");

				if (newConfiguration) {
					log("updateNetworkConfig", "Updating scan information");
					_systemConfiguration.frequency = parseInt(newConfiguration.frequency, 10);
					_systemConfiguration.networkId = parseInt(newConfiguration.networkId, 10);
					_systemConfiguration.modulation = parseInt(newConfiguration.modulation, 10);
					_systemConfiguration.symbolRate = parseInt(newConfiguration.symbolRate, 10);
					$N.platform.system.Preferences.set($N.app.constants.PREF_SCAN_CONFIGURATION, JSON.stringify(_systemConfiguration), false);

					configureNetwork(successCallback, failureCallback);
				}

				log("updateNetworkConfig", "Exit");
			},

			/**
			 * Set the callback function to be invoked upon automatic scanning being enabled.
			 * @method setAutomaticScanEnabledCallback
			 * @param {Function} callback The callback function to be called when automatic
			 *                             scanning parameters are changed, or an error
			 *                             occurs during the process. The function should
			 *                             expect to receive a single boolean value which
			 *                             indicates if the configuration change was
			 *                             successful or not.
			 */
			setAutomaticScanEnabledCallback : function (callback) {
				log("setAutomaticScanEnabledCallback", "Setting automatic scan enabled callback.");
				_autoScanEnabledCallback = callback;
			},

			/**
			 * This function enables the automatic scan flag for configured scans. Calling
			 * functions should also have registered a callback against the
			 * setAutomaticScanEnabledCallback function which will be called once the
			 * configuration has been changed (or an error condition occurs.)
			 */
			enableAutomaticScans : function () {
				configureAutomaticScans(true);
			},

			/**
			 * This function disables the automatic scan flag for configured scans. Calling
			 * functions should also have registered a callback against the
			 * setAutomaticScanEnabledCallback function which will be called once the
			 * configuration has been changed (or an error condition occurs.)
			 */
			disableAutomaticScans : function () {
				configureAutomaticScans(false);
			},
			addScanConfiguration: addScanConfiguration
		};
	}());

}($N || {}));
