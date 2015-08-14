/**
 * This is a util class used to check the signal info for a tuned DVB.
 * It is a generic class which takes network type as parameter to check
 * signal info of Cable/Satellite networks.
 *
 * Singleton class
 *
 * @class $N.app.SignalInfoUtil
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.common.helper.ScanManager
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.SignalInfoUtil = (function () {
		var log = new $N.apps.core.Log("Helper", "SignalInfoUtil"),
			scanRunning = false,
			dvbSignalProfileName = "cable_signal_strength",
			connectionInfo = null,
			connectionInfoSuccessCallBack = null,
			connectionInfoFailedCallBack = null,
			signalTimerHandle = null,
			signalMonitorCallback = null,
			signalMonitorCancelCallback = null,
			scanError;

		/**
		 * Cancels the in progress scan.
		 * @method cancelScan
		 * @private
		 */
		function cancelScan(result) {
			CCOM.SINetwork.removeEventListener("onScanError", scanError);
			CCOM.SINetwork.removeEventListener("getScanProgressOK", signalMonitorCallback);

			signalMonitorCallback = null;

			if (signalTimerHandle) {
				clearInterval(signalTimerHandle);
				signalTimerHandle = null;
			}

			$N.common.helper.ScanManager.stopScan();
			scanRunning = null;

			if (signalMonitorCancelCallback) {
				signalMonitorCancelCallback(result);
			}
		}

		function getConnectionInfoOKListener(result) {
			connectionInfo = result.connectionInfo;

			if (connectionInfoSuccessCallBack) {
				connectionInfoSuccessCallBack(connectionInfo);
			}
		}



		function getConnectionInfoFailedListener(result) {
			connectionInfo = null;

			if (connectionInfoFailedCallBack) {
				connectionInfoFailedCallBack(connectionInfo);
			}
		}

		scanError = function (result) {
			log("scanError", "Enter");
			log("scanError", JSON.stringify(result));
			cancelScan(result);
			log("scanError", "Exit");
		};

		/* Public API */
		return {
			/**
			 * initialise the SignalInfoUtil
			 * @method initialise
			 */
			initialise: function () {
				log("initialise", "Enter");

				CCOM.SINetwork.addEventListener("getConnectionInfoOK", getConnectionInfoOKListener);
				CCOM.SINetwork.addEventListener("getConnectionInfoFailed", getConnectionInfoFailedListener);

				log("initialise", "Exit");
			},

			/**
			* This function starts a regular signal information test at the given interval rate.
			* @method startMonitorSignal
			* @param {Object} monitorCallback Function to call when the signal information data is notified
			* @param {Object} cancelCallback An callback function which will be called if the
			*                 signal monitor is cancelled by the middleware
			* @param {Integer} monitorInterval The rate in at which to poll for signal information
			*/
			startMonitorSignal: function (monitorCallback, cancelCallback, monitorInterval) {
				var result,
					scanErrorCallback = function () {};
				log("startMonitorSignal", "Enter");

				signalMonitorCallback = monitorCallback;
				signalMonitorCancelCallback = cancelCallback;
				scanErrorCallback = function (result) {
					if (signalMonitorCancelCallback) {
						signalMonitorCancelCallback(result);
					}
				};
				$N.common.helper.ScanManager.setScanProgressCallback(signalMonitorCallback);
				scanRunning = $N.common.helper.ScanManager.triggerScan("signalstrength", null, scanErrorCallback);
				if (!scanRunning) {
					if (signalMonitorCancelCallback) {
						signalMonitorCancelCallback(result);
					}
				} else {
					if (signalTimerHandle) {
						window.clearInterval(signalTimerHandle);
						signalTimerHandle = null;
					}

					signalTimerHandle = setInterval(function () {
						scanRunning = $N.common.helper.ScanManager.triggerScan("signalstrength", null, scanErrorCallback);
						$N.common.helper.ScanManager.getCurrentScanProgress(null);
					}, monitorInterval);
				}

				log("startMonitorSignal", "Exit");

			},

			/**
			* This function stops a signal monitoring operation if in progress.
			* @method stopMonitorSignal
			*/
			stopMonitorSignal: function () {
				log("stopMonitorSignal", "Enter");
				cancelScan();
				log("stopMonitorSignal", "Exit");
			},

			/**
			 * This function used for getting the connection info of the
			 * current tuned channel
			 * @method getConnectionInfo
			 */
			getConnectionInfo: function () {
				var connectionInfo = $N.app.fullScreenPlayer.tuner.getPlayer().getBroadcastSignalInfo(); //This is implemented as per ticket: NO5SA2-192
				if (connectionInfoSuccessCallBack) {
					connectionInfoSuccessCallBack(connectionInfo.broadcastSignalInfo);
				}
			},

			/**
			 * This function used for getting the connection info of the
			 * current tuned channel
			 * @method setConnectionInfoSuccessCallBack
			 * @param {Object} callback The callback function when getConnectionInfoOK event is triggered
			 */
			setConnectionInfoSuccessCallBack : function (callback) {
				connectionInfoSuccessCallBack = callback;
			},

			/**
			 * This function used for getting the connection info of the
			 * current tuned channel
			 * @method setConnectionInfoFailureCallBack
			 * @param {Object} callback The callback function when getConnectionInfoFailed event is triggered
			 */
			setConnectionInfoFailureCallBack : function (callback) {
				connectionInfoFailedCallBack = callback;
			},

			/**
			 * This function used for converting signal strength which is in percentage to dBmV value
			 * @method convertSignalStrengthTodBmV
			 * @param {number} signalStrength
			 */
			convertSignalStrengthTodBmV : function (signalStrength) {
					/* By referring OPENTV5 NET / NO5SA-1717:
					* The low level driver get dBm from tuner and then converts it to percentage for MW to retrieve. Given this:
					* dBmV = dBm + 10*LOG(75*1000)
					* dBm = dBmV - 10*LOG(75*1000)

					Driver calculates percentage as:
					* % = (65+dBm)*100/40
					* Therefore dBm = 0.4(percentage)-65

					Thus, taking above into account, dBmV from percentage should be:
					* dBmV = 10*LOG(75*1000) - 65 + ( (40*percentage) / 100 )
					* dBmV = dBm + 10*LOG(75*1000) or
					* dBmV = 47+(value dBm)__50ohm  or  dBmV =48.8+(value dBm)__75ohm
					* With the dBm scale being from -65dBm to -25 dBm, this will give you a dBmV range of -16 dBmV to +23 dBmV
					* we are using 75ohm and 0 dBm =>48.8 dBmV.
					*/
				var dBm,
					dBmV = 0,
					SIGNAL_STRENGTH_PROGBAR_MIN = -16,
					DECODER_DBM_MIN = 65,
					IMPEDENCE_VALUE = $N.app.constants.PREF_IMPEDENCE_VALUE;
				if (signalStrength) {
					dBm = (signalStrength * (40 / 100)) - DECODER_DBM_MIN;
					dBmV = dBm + (10 * ((Math.log(IMPEDENCE_VALUE * 1000)) / (Math.log(10))));
				} else {
					dBmV = SIGNAL_STRENGTH_PROGBAR_MIN;
				}
				return dBmV;
			}

		};

	}());

}($N || {}));