/**
 * This class takes care of authenticating users with PINs, be they managed locally by an
 * application on the STB, or managed by the Conditional Access subsystem (cardless or card-based).
 * Client applications will typically need to call only the validateParentalPin, validatePurchasePin
 * and validateCAPurchasePin methods for authentication. It's expected that applications will supply
 * the UI necessary to capture PIN entry.
 *
 * The term 'local' PIN is used to refer to PINs cached locally on the STB.
 *
 * Depends on CCOM objects like CCOM.ca.pins, CAPIN and CA.
 *
 * @class $N.platform.ca.PINHandler
 * @singleton
 * @reuqires $N.apps.core.Log
 * @requires $N.platform.system.Preferences
 */

/*global CA, CCOM, CAPIN*/

define('jsfw/platform/ca/PINHandler',
	[
		'jsfw/apps/core/Log',
		'jsfw/platform/system/Preferences'
	],
	function (Log, Preferences) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.ca = $N.platform.ca || {};

		$N.platform.ca.PINHandler = (function () {
			// TODO - CCOM2.0
			//var caPins = CCOM.ca.pins;
			var log = new $N.apps.core.Log("ca", "PINHandler"),
				caPins = [],
				checkCAParentalPin = false,
				checkCAPurchasePin = false,
				SDP_USER_PIN = "sdp.user.pin",
				SDP_SLAVE_PIN = "sdp.slave.pin",
				DEFAULT_MASTER_PIN_PATH = "/users/preferences/userauth/defaultSuperPin",
				MAXIMUM_PIN_LENGTH_PATH = "/users/preferences/userauth/maxPinLen",
				MAXIMUM_PIN_RETRIES_PATH = "/users/preferences/userauth/maxTrials",
				LOCK_TIME_PATH = "/users/preferences/userauth/lockDurationSec",
				MASTER_PIN_ERROR_NAME = "PinOrCurrentUserIsMaster",
				currentUserPin = "",
				cachedMasterPin = "1234",
				userAuth,
				authenticatedEvent = window.document.createEvent("Event");

			authenticatedEvent.initEvent("masterUserAuthenticated", true, true);
			authenticatedEvent.data = {};

			/**
			 * Method to retrieve the required CA PIN. The required PIN is specified by the use of PIN flags specified in the
			 * CCOM CA 1.2 documentation (an example of such a flag is CAPIN.CA_PIN_FLAG_PARENTAL_RATING).
			 *
			 * @method getCAPinObject
			 * @private
			 * @param {Number} pinFlag Flag to be used. (see CCOM-CA 1.2 API for valid values).
			 * @return {Object} CAPIN object matching the corresponding flag. null otherwise.
			 */
			function getCAPinObject(pinFlag) {
				if (!caPins) {
					return null;
				}
				var i = caPins.length - 1;

				// TODO - CCOM2.0, although the following if-statement might be good to add in anyway
				if (i !== -1) {
					do {
						var pin = caPins[i];
						// Instruct JSLint to ignore single &.
						/*jslint bitwise: true*/
						if (pin.flags & pinFlag) {
							/*jslint bitwise: false*/
							return pin;
						}
					} while (i--);
				}
			}

			/**
			 * Validates a PIN. Requires CA 1.2 API.
			 *
			 * @method isPinValid
			 * @private
			 * @param {Object} pinObj CAPIN object to compare with (such as returned by getCAPinObject)
			 * @param {String} enteredPin PIN entered by the user
			 * @return {Boolean} True if the PIN is valid; false otherwise.
			 */
			function isPinValid(pinObj, enteredPin) {
				if (!pinObj || !enteredPin) {
					return false;
				}
				enteredPin = String(enteredPin);
				// TODO : CCOM 2.0 : replace CA enum with CCOM 2.0 enum
				return (pinObj.check(enteredPin) === CA.CA_STATUS_OK);
			}

			/**
			 * Validates a PIN against CA's PPV (Pay Per View) PIN
			 *
			 * @method checkCAPPVPin
			 * @private
			 * @param {String} enteredPin PIN to be validated
			 * @return {Number} result of validation (see CCOM-CA 1.2 documents for status values)
			 */
			function checkCAPPVPin(enteredPin) {
				// TODO : CCOM 2.0 : replace CA enum with CCOM 2.0 enum
				var pin = getCAPinObject(CAPIN.CA_PIN_FLAG_CONFIRM_PPV);
				if (pin && enteredPin) {
					return pin.check(enteredPin);
				}
				return CA.CA_STATUS_INVALID;
			}

			/**
			 * Validates CA Parental PIN
			 *
			 * @method isCAParentalPinValid
			 * @private
			 * @param {String} pin PIN entered by the user
			 * @return {Boolean} True if the PIN entered is valid; false otherwise
			 */
			function isCAParentalPinValid(pin) {
				// TODO: this may need to change: which CA PIN should we validate against?
				// TODO : CCOM 2.0 : replace CA enum with CCOM 2.0 enum
				var pinObj = getCAPinObject(CAPIN.CA_PIN_FLAG_PARENTAL_RATING);
				return isPinValid(pinObj, pin);
			}

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
			    init: function (shouldCheckCAParentalPin, shouldCheckCAPurchasePin) {
					log("init", "Enter");
				    checkCAParentalPin = shouldCheckCAParentalPin || false;
				    checkCAPurchasePin = shouldCheckCAPurchasePin || false;
				    userAuth = CCOM.UserAuth;
				    log("init", "Exit");
			    },
			    /**
				 * Returns the cached SDP PINs
				 *
				 * @method getAccountPins
				 * @return {Array} First element is the master PIN, second is the slave PIN
				 */
			    getAccountPins: function () {
					log("getAccountPins", "Enter & Exit");
				    return [ this.getAccountMasterPin(), this.getAccountSlavePin() ];
			    },
			    /**
				 * Returns the cached SDP Master PIN
				 *
				 * @method getAccountMasterPin
				 * @return {String} master PIN
				 */
			    getAccountMasterPin: function () {
					log("getAccountMasterPin", "Enter & Exit");
				    return $N.platform.system.Preferences.get(SDP_USER_PIN);
			    },
			    /**
				 * Stores the (cached) SDP Master PIN in ConfigMan
				 *
				 * @method setAccountMasterPin
				 * @param {String} newPin new master PIN
				 * @return {Boolean} true if the PIN was successfully stored, false otherwise
				 */
			    setAccountMasterPin: function (newPin) {
					log("setAccountMasterPin", "Enter & Exit");
				    return $N.platform.system.Preferences.set(SDP_USER_PIN, newPin);
			    },
			    /**
				 * Returns the cached SDP Slave (VOD Purchase) PIN
				 *
				 * @method getAccountSlavePin
				 * @return {String} slave PIN
				 */
			    getAccountSlavePin: function () {
					log("getAccountSlavePin", "Enter & Exit");
				    return $N.platform.system.Preferences.get(SDP_SLAVE_PIN);
			    },
			    /**
				 * Stores the (cached) SDP Slave PIN in ConfigMan
				 *
				 * @method setAccountSlavePin
				 * @param {String} newPin new slave PIN
				 * @return {Boolean} true if the PIN was stored successfully; false otherwise
				 */
			    setAccountSlavePin: function (newPin) {
					log("setAccountSlavePin", "Enter & Exit");
				    return $N.platform.system.Preferences.set(SDP_SLAVE_PIN, newPin);
			    },
			    /**
				 * Sets the master pin in UAM to the given pin
				 *
				 * @method setLocalMasterPin
				 * @async
				 * @param {String} newPin new master PIN
				 * @param {Function} callback Called once pin change call completes. True parameter is passed
				 * to callback if call succeeds, false is passed if fails
				 */
			    setLocalMasterPin: function (newPin, callback) {
					log("setLocalMasterPin", "Enter");
					var masterPinChanged;
					if (!callback) {
						callback = function (isChanged) {};
					}
					masterPinChanged = function (e) {
						userAuth.removeEventListener("changeMasterPinOK", masterPinChanged);
						userAuth.removeEventListener("changeMasterPinFailed", masterPinChanged);
						if (e.error) {
							callback(false);
						} else {
							cachedMasterPin = newPin;
							callback(true);
						}
					};
					userAuth.addEventListener("changeMasterPinOK", masterPinChanged);
					userAuth.addEventListener("changeMasterPinFailed", masterPinChanged);
					userAuth.changeMasterPin(cachedMasterPin, newPin);
					log("setLocalMasterPin", "Exit");
			    },
			    /**
				 * Validates a PIN against Master PIN.
				 * Invokes the callback with true parameter if validated successfully,
				 * calls with false otherwise
				 *
				 * @method validateParentalPin
				 * @async
				 * @param {String} enteredPin PIN to be validated
				 * @param {Function} callback callback to run once validation is complete
				 * @param {Boolean} keepCurrentUser If true will not change the user to the master user
				 * upon validating the PIN
				 */
			    validateParentalPin: function (enteredPin, callback, keepCurrentUser) {
					log("validateParentalPin", "Enter");
					var masterPinValidated;
					if (!callback) {
						callback = function (isValidated) {};
					}
					masterPinValidated = function (e) {
						userAuth.removeEventListener("getUserProfileOK", masterPinValidated);
						userAuth.removeEventListener("getUserProfileFailed", masterPinValidated);
						if (e.error && e.error.name === MASTER_PIN_ERROR_NAME) {
							cachedMasterPin = enteredPin;
							if (!keepCurrentUser) {
								window.document.dispatchEvent(authenticatedEvent);
							}
							callback(true);
						} else {
							callback(false);
						}
					};
					userAuth.addEventListener("getUserProfileOK", masterPinValidated);
					userAuth.addEventListener("getUserProfileFailed", masterPinValidated);
					userAuth.getUserProfile(enteredPin);
					log("validateParentalPin", "Exit");
			    },
			    /**
				 * Validates a PIN against slave pin.
				 * Multiple users are not supported until OTV5.1
				 * so just validated against master pin for OTV5.0
				 *
				 * @method validatePurchasePin
				 * @async
				 * @param {String} enteredPin PIN to be validated
				 * @param {Function} callback callback to run once validation is complete
				 */
			    validatePurchasePin: function (enteredPin, callback) {
					log("validatePurchasePin", "Enter");
					//TODO validate against a slave pin
					this.validateParentalPin(enteredPin, callback);
				    log("validatePurchasePin", "Exit");
			    },
			    /**
				 * Validates a PIN against CA's PPV PIN
				 *
				 * @method validateCAPurchasePin
				 * @param {String} enteredPin PIN to be validated
				 * @return {Number} status code from CA (see CCOM-CA 1.2 documentation for valid codes)
				 */
			    validateCAPurchasePin: function (enteredPin) {
					log("validateCAPurchasePin", "Enter");
					// TODO : CCOM 2.0 : replace CA enum with CCOM 2.0 enum
				    var result = CA.CA_STATUS_INVALID;
				    if (enteredPin) {
					    result = checkCAPPVPin(enteredPin);
				    }
				    log("validateCAPurchasePin", "Exit");
				    return result;
			    },
			    /**
				 * Sets the PIN of the user identified with the oldPin to the newPin
			     *
			     * @method setUserPin
			     * @param {String} newPin
				 * @param {String} oldPin
			     */
			    setUserPin: function (newPin, oldPin) {
					log("setUserPin", "Enter");
					//TODO: Only supported in OpenTV5.1
					log("setUserPin", "Exit");
			    },
			    /**
			     * Sets the default master pin to the given newDefaultPin
			     *
			     * @method setDefaultMasterPin
				 * @param {String} newDefaultPin
			     */
			    setDefaultMasterPin: function (newDefaultPin) {
					log("setDefaultMasterPin", "Enter");
					CCOM.ConfigManager.setValue(DEFAULT_MASTER_PIN_PATH, newDefaultPin);
					log("setDefaultMasterPin", "Exit");
			    },
			    /**
				 * Sets the maximum number of digits a pin number can contain
			     *
			     * @method setMaximumPinLength
				 * @param {Number} length
			     */
				setMaximumPinLength: function (length) {
					log("setMaximumPinLength", "Enter");
					CCOM.ConfigManager.setValue(MAXIMUM_PIN_LENGTH_PATH, length);
					log("setMaximumPinLength", "Exit");
				},
				/**
				 * Sets the maximum number of times the user can enter an invalid PIN
				 * before they are unable to try again after the time set in the
				 * `setIdleTimeAfterInvalidPinEntries` call has expired
				 *
				 * @method setMaximumPinRetries
				 * @param {Number} retries
				 */
				setMaximumPinRetries: function (retries) {
					log("setMaximumPinRetries", "Enter");
					CCOM.ConfigManager.setValue(MAXIMUM_PIN_RETRIES_PATH, retries);
					log("setMaximumPinRetries", "Exit");
				},
				/**
				 * Sets the time to wait before a user can re-enter a PIN number
				 * after they have incorrectly entered the PIN the amount of times
				 * set in the setMaximumPinRetries call
				 *
				 * @method setLockTimeAfterInvalidPinEntries
				 * @param {Number} time Number of seconds to lock the user out
				 */
				setLockTimeAfterInvalidPinEntries: function (time) {
					log("setLockTimeAfterInvalidPinEntries", "Enter");
					CCOM.ConfigManager.setValue(LOCK_TIME_PATH, time);
					log("setLockTimeAfterInvalidPinEntries", "Exit");
				},
				/**
				 * Determines the identity of the user using the PIN entered
				 * @method isPinCurrentUser
				 * @return {Boolean} true if the entered PIN authenticates the current user; false otherwise
				 */
				isPinCurrentUser: function (userPin) {
					log("isPinCurrentUser", "Enter & Exit");
					return userPin === currentUserPin ? true : false;
				},
				/**
				 * Returns the cached master pin
				 * @method getLocalMasterPin
				 * @return {String} Master pin
				 */
				getLocalMasterPin: function () {
					log("getLocalMasterPin", "Enter & Exit");
					return cachedMasterPin;
				}
			};

		}());
		return $N.platform.ca.PINHandler;
	}
);