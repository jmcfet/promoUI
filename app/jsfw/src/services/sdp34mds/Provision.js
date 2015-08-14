/**
 * This class provisions a user's account and STB against the SDP. It uses
 * ProvisionService.
 *
 * @class $N.services.sdp.Provision
 * @requires $N.apps.core.Log
 * @requires $N.apps.util.Util
 * @requires $N.services.sdp.ServiceFactory
 * @requires $N.platform.system.Device
 *
 * @constructor
 * @param accountNumber {String} account number
 * @param accountPassword {String} password for the account
 */
/* global define */
define('jsfw/services/sdp/Provision',
	[
		'jsfw/apps/core/Log',
		'jsfw/services/sdp/ServiceFactory',
		'jsfw/apps/util/Util',
		'jsfw/platform/system/Device'
	],
	function (Log, ServiceFactory, Util, Device) {
		var log = new $N.apps.core.Log('sdp', 'Provision'),
			LOG_LEVEL_INFO = 'info',
			success = false;

		var Provision = function (accountNumber, accountPassword) {
			this._accountNumber = accountNumber;
			this._accountPassword = accountPassword;
		};

		/**
		 * Initialises the class with the supplied parameters
		 *
		 * @method init
		 * @param {String} stbSN Set Top Box Serial Number
		 * @param {String} macAddress Mac Address of STB
		 * @param {String} caSN CA Serial Number
		 */
		Provision.prototype.init = function (stbSN, macAddress, caSN) {
			log("[init]", "Enter", LOG_LEVEL_INFO);
			this._provisionService = $N.services.sdp.ServiceFactory.get("ProvisionService");
			this._macAddress = macAddress;
			this._stbSN = $N.apps.util.Util.removeSpaces(stbSN);
			this._caSN = $N.apps.util.Util.removeSpaces(caSN);
			log("init", "Exit", LOG_LEVEL_INFO);
		};

		/**
		 * Cardless post-provision method using CA 1.2.
		 *
		 * @method postProvisionCardless
		 * @param provisionCardlessSuccess {Function} function that will be invoked when post-provisioning is successful
		 * @param provisionCardlessFailure {Function} function that will be invoked when post-provisioning is unsuccessful
		 */
		Provision.prototype.postProvisionCardless = function (provisionCardlessSuccess, provisionCardlessFailure) {
			log("postProvisionCardless", "Enter", LOG_LEVEL_INFO);
			var self = this;
			log("postProvisionCardless", "ACCNO: " + this._accountNumber + " PWD: " + this._accountPassword +
					" MACADDR: " + this._macAddress + " STBSN: " + this._stbSN + " CASN: " + this._caSN);
			setTimeout(function () {
				self._provisionService.postProvisionCardless(self, provisionCardlessSuccess, provisionCardlessFailure,
						self._accountNumber, self._accountPassword, self._macAddress, self._stbSN, self._caSN);
			}, 0);
			log("postProvisionCardless", "Exit", LOG_LEVEL_INFO);
		};

		/**
		 * Post-provision method using MAC address with CA 1.2.
		 *
		 * @method postProvisionByMACAddress
		 * @param provisionByMACSuccess {Function} function that will be invoked when post-provisioning is successful
		 * @param provisionByMACFailure {Function} function that will be invoked when post-provisioning is unsuccessful
		 */
		Provision.prototype.postProvisionByMACAddress = function (provisionByMACSuccess, provisionByMACFailure) {
			log("[" + this._APP_NAME + ".postProvisionByMACAddress Enter", LOG_LEVEL_INFO);
			var self = this;
			log("[" + this._APP_NAME + "serialNumber == " + $N.platform.system.Device.getSerialNumber());
			log("postProvisionByMACAddress", "ACCNO: " + this._accountNumber + " PWD: " +
				this._accountPassword + " MACADDR: " + this._macAddress + " STBSN: " + this._stbSN);
			setTimeout(function () {
				self._provisionService.postProvisionByMACAddress(self, provisionByMACSuccess, provisionByMACFailure,
						self._accountNumber, self._accountPassword, self._macAddress, self._stbSN);
			}, 0);
			log("postProvisionByMACAddress", "Exit", LOG_LEVEL_INFO);
		};

		/**
		 * Card-based post-provision method using CA 1.2.
		 *
		 * @method postProvisionCardbased
		 * @param scID {String} Smart card ID
		 * @param provisionCardbasedSuccess {Function} function that will be invoked when post-provisioning is successful
		 * @param provisionCardbasedFailure {Function} function that will be invoked when post-provisioning is unsuccessful
		 */
		Provision.prototype.postProvisionCardbased = function (scID, provisionCardbasedSuccess, provisionCardbasedFailure) {
			log("postProvisionCardbased", "Enter", LOG_LEVEL_INFO);
			var self = this;
			log("postProvisionCardbased", "ACCNO: " + this._accountNumber + " PWD: " +
					this._accountPassword + " STBSN: " + this._stbSN + " CASN: " + this._caSN + " SCID: " + scID);
			setTimeout(function () {
				self._provisionService.postProvisionCardbased(self, provisionCardbasedSuccess,
						provisionCardbasedFailure, self._accountNumber, self._accountPassword, self._stbSN, self._caSN, scID);
			}, 0);
			log("postProvisionCardbased", "Exit", LOG_LEVEL_INFO);
		};

		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};
		$N.services.sdp.Provision = Provision;
		return Provision;
	}
);
