/**
 * This class takes care of authenticating users with PINs.
 * Client applications will typically need to call only the validateParentalPin, validatePurchasePin
 * and validateCAPurchasePin methods for authentication. It's expected that applications will supply
 * the UI necessary to capture PIN entry.
 *
 * The term 'local' PIN is used to refer to PINs cached locally.
 *
 * @class $N.platform.ca.PINHandler
 * @singleton
 *
 * @requires $N.platform.system.Preferences
 */
/*global define */

define('jsfw/platform/ca/PINHandler',
	[
		'jsfw/platform/system/Preferences'
	],
	function (Preferences) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.ca = $N.platform.ca || {};

		$N.platform.ca.PINHandler = (function () {
			var checkCAParentalPin = false,
				checkCAPurchasePin = false,
				SDP_USER_PIN = "sdp.user.pin",
				SDP_SLAVE_PIN = "sdp.slave.pin",
				USER_PIN = "user.pin",
				SLAVE_PIN = "slave.pin";

			/*
			 * Private Methods
			 */

			function initialisePinPreferences(defaultUserPin, defaultSlavePin) {
				var storedUserPin = $N.platform.ca.PINHandler.getLocalMasterPin(),
					storedSlavePin = $N.platform.ca.PINHandler.getLocalSlavePin();
				defaultUserPin = defaultUserPin || "1234";
				defaultSlavePin = defaultSlavePin || "1234";
				if (!storedUserPin) {
					$N.platform.ca.PINHandler.setLocalMasterPin(defaultUserPin);
				}
				if (!storedSlavePin) {
					$N.platform.ca.PINHandler.setLocalSlavePin(defaultSlavePin);
				}
			}

			/*
			 * Public Methods = Interface to PINHandler
			 */
			return {
				/**
				 * Initialises the 'check CA' flag for parental PIN and purchase PIN
				 *
				 * @method init
				 * @param {Boolean} shouldCheckCAPin true if we're using CA PIN validation for parental
				 *        control; false otherwise
				 * @param {Boolean} shouldCheckCAPurchasePin true if we're using CA PIN validation for
				 *        VOD purchase; false otherwise
				 */
				init: function (shouldCheckCAParentalPin, shouldCheckCAPurchasePin, defaultUserPin, defaultSlavePin) {
					initialisePinPreferences(defaultUserPin, defaultSlavePin);
					checkCAParentalPin = shouldCheckCAParentalPin || false;
					checkCAPurchasePin = shouldCheckCAPurchasePin || false;
				},
				/**
				 * Returns the cached SDP PINs
				 *
				 * @method getAccountPins
				 * @return {Array} First element is the master PIN, second is the slave PIN
				 */
				getAccountPins: function () {
					return [ this.getAccountMasterPin(), this.getAccountSlavePin() ];
				},
				/**
				 * Returns the cached SDP Master PIN
				 *
				 * @method getAccountMasterPin
				 * @return {String} master PIN
				 */
				getAccountMasterPin: function () {
					return $N.platform.system.Preferences.get(SDP_USER_PIN);
				},
				/**
				 * Stores the (cached) SDP Master PIN in preferences
				 *
				 * @method setAccountMasterPin
				 * @param {String} newPin new master PIN
				 * @return {Boolean} true if the PIN was successfully stored, false otherwise
				 */
				setAccountMasterPin: function (newPin) {
					return $N.platform.system.Preferences.set(SDP_USER_PIN, newPin);
				},
				/**
				 * Returns the cached SDP Slave (VOD Purchase) PIN
				 *
				 * @method getAccountSlavePin
				 * @return {String} slave PIN
				 */
				getAccountSlavePin: function () {
					return $N.platform.system.Preferences.get(SDP_SLAVE_PIN);
				},
				/**
				 * Stores the (cached) SDP Slave PIN in preferences
				 *
				 * @method setAccountSlavePin
				 * @param {String} newPin new slave PIN
				 * @return {Boolean} true if the PIN was stored successfully; false otherwise
				 */
				setAccountSlavePin: function (newPin) {
					return $N.platform.system.Preferences.set(SDP_SLAVE_PIN, newPin);
				},
				/**
				 * Returns the local PINs
				 *
				 * @method getLocalPins
				 * @return {Array} Array containing exactly two elements: master PIN, slave PIN
				 */
				getLocalPins: function () {
					return [ this.getLocalMasterPin(), this.getLocalSlavePin() ];
				},
				/**
				 * Returns the cached Master PIN
				 *
				 * @method getLocalMasterPin
				 * @return {String} master PIN
				 */
				getLocalMasterPin: function () {
					return $N.platform.system.Preferences.get(USER_PIN);
				},
				/**
				 * Stores the (cached) Master PIN in preferences
				 *
				 * @method setLocalMasterPin
				 * @param {String} newPin new master PIN
				 * @return {Boolean} true if the PIN was stored successfully; false otherwise
				 */
				setLocalMasterPin: function (newPin) {
					return $N.platform.system.Preferences.set(USER_PIN, newPin);
				},
				/**
				 * Returns the cached Slave PIN
				 *
				 * @method getLocalSlavePin
				 * @return {String} slave PIN
				 */
				getLocalSlavePin: function () {
					return $N.platform.system.Preferences.get(SLAVE_PIN);
				},
				/**
				 * Stores the (cached) Slave PIN in preferences
				 *
				 * @method setLocalSlavePin
				 * @param {String} newPin new slave PIN
				 * @return {Boolean} true if the PIN was stored successfully; false otherwise
				 */
				setLocalSlavePin: function (newPin) {
					return $N.platform.system.Preferences.set(SLAVE_PIN, newPin);
				},
				/**
				 * Validates a PIN against the local Master PIN
				 *
				 * @method validateParentalPin
				 * @param {String} enteredPin PIN to be validated
				 * @return {Boolean} true if the PIN is valid; false otherwise
				 */
				validateParentalPin: function (enteredPin) {
					var result = false;
					if (enteredPin) {
						result = (this.getLocalMasterPin() === enteredPin);
					}
					return result;
				},
				/**
				 * Validates a PIN against the local Slave PIN
				 *
				 * @method validatePurchasePin
				 * @param {String} enteredPin PIN to be validated
				 * @return {Boolean} true indicates the PIN is valid
				 */
				validatePurchasePin: function (enteredPin) {
					var result = false;
					if (enteredPin) {
						result = (this.getLocalSlavePin() === enteredPin || this.getLocalMasterPin() === enteredPin);
					}
					return result;
				},
				/**
				 * Validates a PIN against CA's PPV PIN
				 *
				 * @method validateCAPurchasePin
				 * @param {String} enteredPin PIN to be validated
				 * @return {Number} status code from CA (see CCOM-CA 1.2 documentation for valid codes)
				 */
				validateCAPurchasePin: function (enteredPin) {
					return false;
				}
			};

		}());
		return $N.platform.ca.PINHandler;
	}
);
