/**
 * The ConditionalAccessCAK73 class is responsible for trigger event for CA SmartCard and also for retrieving
 * the smart card info.
 *
 * @class $N.app.ConditionalAccessCAK73
 * @constructor
 * @requires $N.apps.core.Log
 *
 * @author Murali
 */

(function ($N) {
	function ConditionalAccessCAK73(handler) {

		this._log = new $N.apps.core.Log("ca", "ConditionalAccessCAK73");
		this.handler = handler;
		CCOM.ConditionalAccess.addEventListener('onSmartcardRemoved', this.handler.SmartcardRemovedListener);
		CCOM.ConditionalAccess.addEventListener('onSmartcardInserted', this.handler.SmartcardInsertedListener);
		CCOM.ConditionalAccess.addEventListener('onSmartcardUpdated', this.handler.SmartcardUpdatedListener);
	}

	/**
	 * Get the SmartCard SystemInfo
	 * @method getCASystemInfo
	 * @return {Object} Returns smardcardInfo
	 */
	ConditionalAccessCAK73.prototype.getCASmartCardInfo = function () {
		this._log("ca", "enter getCASmartCardInfo");
		return CCOM.ConditionalAccess.getSmartcardInfo();
	};

	/**
	 * Get the System Serial number
	 * @method getCASystemSerialNumber
	 * @return {Object} Returns System Serial number
	 */
	ConditionalAccessCAK73.prototype.getCASystemSerialNumber = function () {
		this._log("ca", "enter getCASystemSerialNumber");
		var systemObject = CCOM.ConditionalAccess.getSystemInfo(),
			systemSerialNumber;
		if (systemObject.error) {
			systemSerialNumber = null;
		} else {
			systemSerialNumber = systemObject.systemInfo.serialNumber;
		}
		return systemSerialNumber;
	};

	/**
	 * Get the SmartCard Serial number
	 * @method getCASmartCardSerialNumber
	 * @return {Object} Returns SmartCard Serial number
	 */
	ConditionalAccessCAK73.prototype.getCASmartCardSerialNumber = function () {
		this._log("ca", "enter getCASmartCardSerialNumber");
		var smartCardObject = CCOM.ConditionalAccess.getSmartcardInfo(),
			smartCardSerialNumber;
		if (smartCardObject.error) {
			smartCardSerialNumber = null;
		} else {
			smartCardSerialNumber = smartCardObject.smartcardInfo.serialNumber;
		}
		return smartCardSerialNumber;
	};

	/**
	 * Get the Conditional Access Service Access
	 * @method getCAServiceAccess
	 * @param {number} serviceId
	 * @public
	 * @return {Number} Returns caAccess
	 */
	ConditionalAccessCAK73.prototype.getCAServiceAccess = function (serviceId) {
		this._log("ca", "enter getCAServiceAccess");
		var accessCA = CCOM.ConditionalAccess.getServiceAccess(String(serviceId));
		if (accessCA.error) {
			return "CCOMERROR";
		}
		switch (accessCA.caAccess) {
		case CCOM.ConditionalAccess.CLEAR:
		case CCOM.ConditionalAccess.FREE:
		case CCOM.ConditionalAccess.GRANTED:
			return "GRANTED";
		default:
			return "ACCESS DENIED";
		}
	};

	/**
	 * Get the SystemInfo
	 * @method getCASystemInfo
	 * @return {Object} Returns systemInfo
	 */
	ConditionalAccessCAK73.prototype.getCASystemInfo = function () {
		this._log("ca", "enter getCASystemInfo");
		return CCOM.ConditionalAccess.getSystemInfo();
	};

	/**
	 * Get all the mail
	 * @method getIrdAllMail
	 * @return {Object} Returns the mail information.
	 */
	ConditionalAccessCAK73.prototype.getIrdAllMail = function () {
		this._log("ca", "enter getIrdAllMail");
		return CCOM.ConditionalAccess.getIrdAllMail();
	};

	/**
	 * Retrives the mail message.
	 * @method getIrdMail
	 * @Input {Number} Id of the mail
	 * @return {String} Returns the mail message.
	 */
	ConditionalAccessCAK73.prototype.getIrdMail = function (mailId) {
		this._log("ca", "enter getIrdMail");
		return CCOM.ConditionalAccess.getIrdMail(mailId);
	};

	/**
	 * Retrives the popup message.
	 * @method getIrdPopupMessage
	 * @return {Object} Returns the popup information.
	 */
	ConditionalAccessCAK73.prototype.getIrdPopupMessage = function () {
		this._log("ca", "enter getIrdPopupMessage");
		return CCOM.ConditionalAccess.getIrdPopupMessage();
	};

	/**
	 * Returns CA enabled or not.
	 * @method isCCOMallowConditionalAccess
	 * @return {Boolean} Returns true if CA enabled else false..
	 */
	ConditionalAccessCAK73.prototype.isCCOMallowConditionalAccess = function () {
		this._log("ca", "enter isCCOMallowConditionalAccess");
		var conditionalAccess = false;
		if (CCOM.ConditionalAccess.getSmartcardInfo !== undefined) {
			conditionalAccess = true;
		}
		return conditionalAccess;
	};

	/**
	 * Deligate error message to CAKALMEHandler.
	 * @method handleError
	 * @param {enum} accessReason
	 * @public
	 */
	ConditionalAccessCAK73.prototype.handleError = function (accessReason) {
		this._log("ca", "enter handleError");
		this.handler.showError(accessReason);
	};

	/**
	 * Deligate value to CAKALMEHandler.
	 * @method setStreamDisabled
	 * @param {enum} onStreamDisabled event callback is called or not
	 * @public
	 */
	ConditionalAccessCAK73.prototype.setStreamDisabled = function (value) {
		this._log("ca", "enter setStreamDisabled");
		this.handler.setStreamDisabled(value);
	};

	/**
	 * This method is called to check if access was denied
	 * @method isAccessDenied
	 * @public
	 */
	ConditionalAccessCAK73.prototype.isAccessDenied = function () {
		this._log("ca", "enter isAccessDenied");
		return this.handler.isAccessDenied();
	};

	$N = $N || {};
	$N.app = $N.app || {};
	$N.app.ConditionalAccessNagraCAK73 = ConditionalAccessCAK73;

}($N || {}));
