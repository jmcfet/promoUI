/**
 * Helper class for network related functions
 *
 * @class $N.app.NetworkUtil
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.NetworkUtil = (function () {
		var READY_STATE_WAIT_TIME = 20000,
			log = new $N.apps.core.Log("Helper", "NetworkUtil");

		// Public
		return {

			/**
			 * Validates a url string for empty/null/malformed etc.
			 * @method isUrlValid
			 * @param {String} url
			 * @return {Boolean}
			 */
			isUrlValid: function (url) {
				var regex = null;
				if (!url || String(url).trim() === '') {
					return false;
				}
				regex = /((((http|https|ftp):(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9.\-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[\-\+=&;%@.\w_]*)#?(?:[\w]*))?)/g;
				return regex.test(url);
			},

			/**
			 * Wrapper function to aggregate results of network availability checks such as ethernet or wifi.
			 * @method isNetworkAvailable
			 * @return {Boolean}
			 */
			isNetworkAvailable: function () {
				return $N.platform.system.Network.isNetworkAvailable($N.platform.system.Network.NetworkType.ETHERNET)
					|| $N.platform.system.Network.isNetworkAvailable($N.platform.system.Network.NetworkType.WIFI);
			},

			/**
			 * An Ajaxhandler wrapper to make a xmlhttprequest for a given url
			 *
			 * @method ajaxRequest
			 * @param {string} url
			 * @param {object} successCallback
			 * @param {object} failureCallback
			 */
			ajaxRequest: function (url, successCallback, failureCallback) {
				var xmlhttp = new $N.apps.core.AjaxHandler();
				xmlhttp.setResponseCallback(function (response) {
					if (!response || response.status !== 200) {
						if (failureCallback) {
							failureCallback(response);
						} else {
							throw ("Ajax request failed! URL: " + url);
						}
					} else {
						successCallback(response.responseText);
					}
				});
				xmlhttp.requestData(url, READY_STATE_WAIT_TIME);
			},

			/**
			 * @method setWiredInterfaceName
			 */
			setWiredInterfaceName: function () {
	//			log("setWiredInterfaceName", "Enter");
	//			var INTERFACE_TYPE_WIRED = 0,
	//				networkWiredInterface,
	//				ethernet = $N.platform.system.Preferences.get($N.app.constants.PRIMARY_NETWORK_CONFIG_PATH, true);
	//			if (!ethernet) {
	//				ethernet = $N.platform.system.Network.NetworkType.ETHERNET;
	//				networkWiredInterface = $N.platform.system.Network.getInterfaceByType(INTERFACE_TYPE_WIRED);
	//				if (networkWiredInterface) {
	//					ethernet = networkWiredInterface.name;
	//					$N.platform.system.Preferences.set($N.app.constants.PRIMARY_NETWORK_CONFIG_PATH, ethernet, true);
	//				}
	//			}
	//			$N.platform.system.Network.configure(ethernet);

				// Hard-coding this for now. Will come back to it soon as the whole
				// networking piece needs a lot of attention. RJV 2014-05-16.

				if ($N.app.SystemUtil.isNative()) {
					$N.platform.system.Network.configure("eth9");
				} else {
					$N.platform.system.Network.configure("eth0");
				}
				//log("setWiredInterfaceName", "Exit, setting ethernet as: " + ethernet);
			},

			/**
			 * @method ethernetUpCallback
			 */
			ethernetUpCallback: function () {
				$N.platform.btv.EPG.setEthernetConnected(true);
			},

			/**
			 * @method ethernetDownCallback
			 */
			ethernetDownCallback: function () {
				$N.platform.btv.EPG.setEthernetConnected(false);
			},

			/**
			 * @method registerEthernetStateChangeCallbacks
			 */
			registerEthernetStateChangeCallbacks: function () {
				$N.platform.system.Network.StateChange.setEthDownCallBack(this.ethernetDownCallback);
				$N.platform.system.Network.StateChange.setEthUpCallBack(this.ethernetUpCallback);
			}
		};
	}());

}($N || {}));