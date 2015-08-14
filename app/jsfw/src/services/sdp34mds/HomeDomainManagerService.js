/**
 * Home Domain Manager is a sign-on proxy module. In other words, devices send sign on requests to
 * the HDM instead of the SDP in the StarHub world. All other requests go directly to the SDP as usual.
 *
 * In order to abstract this difference, Ninja has extended $N.services.sdp.Signon with an additional method
 * that applications could use to perform a sign-on. Internally, $N.services.sdp.Signon uses HomeDomainManagerService,
 * which is the class that performs the actual sign-on for devices in StarHub. It sends requests to the HDM API,
 * and is capable of additionally provisioning devices that haven't already been provisioned.
 *
 * This class is modelled on the other SDP service stubs like SignonService, and is derived from
 * $N.services.sdp.BaseService.
 *
 * @class $N.services.sdp.HomeDomainManagerService
 * @extends $N.services.sdp.BaseService
 * @constructor
 * @requires $N.apps.core.Log
 */
/* global define */
define('jsfw/services/sdp/HomeDomainManagerService',
	[
		'jsfw/apps/core/Log',
		'jsfw/services/sdp/BaseService'
	],
	function (Log, BaseService) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};

		(function () {
			function HomeDomainManagerService() {
			}

			var log = new $N.apps.core.Log('sdp', 'HomeDomainManagerService');

			HomeDomainManagerService.prototype = new $N.services.sdp.BaseService();

			/**
			 * Initialises the internal variables required for the class
			 * @method init
			 */
			HomeDomainManagerService.prototype.init = function () {
				this.securityRequired = true;
				this._securityPort = 443;
				this._serviceName = "homeDomainManagerService";
				this._hdmsURI = '/api/authentication/v1';
			};

			/**
			 * Asynchronously invokes the Home Domain Manager API using the HUE gateway interface. Note that the parameter
			 * following the ones specified here is expected to contain the sign-on credentials for a device, and is passed to
			 * the service. This method overrides that of $N.services.sdp.BaseService.
			 * @method invokeMethod
			 * @async
			 * @param {Object} caller The object to be notified when call completes.
			 * @param {Function} successCallback The method to call when invocation completes successfully.
			 * @param {Function} failureCallback The method to call when invocation fails.
			 * @param {String} methodName The name of the method to invoke.
			 * @chainable
			 */
			HomeDomainManagerService.prototype.invokeMethod = function (caller, successCallback, failureCallback, methodName) {
				var qspPath = this._hdmsURI,
					field,
					url = "",
					urlPref = "",
					queryString = "",
					signonDetails = arguments[4];
				log("invokeMethod", "HUE GATEWAY URL: " + $N.services.sdp.BaseService._HUE_GATEWAY_URL + ", is security required: " + String(this.securityRequired));
				$N.services.sdp.BaseService._SIGNED_ON = false;
				$N.services.sdp.BaseService._AUTH_TOKEN = "";

				urlPref = $N.services.sdp.BaseService._HUE_GATEWAY_URL;
				// TODO: use the following on production
				//urlPref = //this._updatePortForSecurity($N.services.sdp.BaseService._HUE_GATEWAY_URL, this._securityPort);
				// url = "https://" + urlPref + qspPath + '/' + methodName + '?';
				url = "http://" + urlPref + qspPath + '/' + methodName + '?';
				for (field in signonDetails) {
					if (signonDetails.hasOwnProperty(field)) {
						if (queryString !== "") {
							queryString += "&";
						}
						queryString += field + '=' + signonDetails[field];
					}
				}
				url += queryString;
				log("invokeMethod", "(" + this._serviceName + "." + methodName + ") Request: " + queryString);
				log("invokeMethod", "(" + this._serviceName + "." + methodName + ") URL: " + url);
				$N.services.sdp.BaseService._outstandingRequests.push(new $N.services.sdp.RequestWorker('', this._serviceName, methodName, url, caller, successCallback, failureCallback, queryString, false));
				log("invokeMethod", "Exit");
				return this;
			};

			/**
			 * Signs on an STB by making a request to the Home Domain Manager
			 * @method signon
			 * @param {Object} caller the calling object / class
			 * @param {Function} successCallback the function that will be executed if sign-on is successful
			 * @param {Function} failureCallback the function that will be executed if sign-on fails
			 * @param {Object} credentials an object containing the STB or companion device credentials
			 * @param {String} credentials.smartcardId the smart card id
			 * @param {String} credentials.nuId NUID of the device
			 * @param {String} credentials.caSn CAS Number of the device
			 * @param {String} credentials.csadList
			 * @param {String} credentials.username user name required for sign-on
			 * @param {String} credentials.password password for `username`
			 * @param {String} credentials.deviceId id companion device id
			 */
			HomeDomainManagerService.prototype.signon = function (caller, successCallback, failureCallback, credentials) {
				this.invokeMethod(caller, successCallback, failureCallback, 'signontokens', credentials);
			};

			// TODO: another method that does provisioning and sign-on

			$N.services.sdp.HomeDomainManagerService = HomeDomainManagerService;
		}());

		window.HomeDomainManagerService = $N.services.sdp.HomeDomainManagerService;
		return $N.services.sdp.HomeDomainManagerService;
	}
);