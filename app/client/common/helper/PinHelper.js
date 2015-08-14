/**
 * Asks the user for a PIN and validates it against the STB / CA pins
 * @class $N.app.PinHelper
 * @constructor
 * @requires $N.app.constants
 * @requires $N.apps.dialog.DialogManager
 * @param {Object} successfulAuthenticationCallback function to call if the PIN authentication is successful
 * @param {Object} invalidPinCallback function to call if invalid pin is entered
 * @param {Object} failedAuthenticationCallback function to call if the user has exhausted the number of valid attempts
 * @param {Object} authenticationCancelCallback function to call if the user has cancelled PIN authentication
 * @param {Number} hideTime Milliseconds to wait before hiding the PIN dialog
 * @param {Boolean} keepCurrentUser Flag to check whether or not to change to the master user, optional
 * @return {PinHelper}
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	function PinHelper(successfulAuthenticationCallback, invalidPinCallback, failedAuthenticationCallback, authenticationCancelCallback, hideTime, keepCurrentUser) {
		var me = this;
		this.pinDialog = null;
		this._whichPin = 'master';
		this._showUntilAuthenticated = true;
		this._timesToShow = $N.app.constants.MAX_PIN_ENTRY_ATTEMPTS;
		this._dialogManager = $N.apps.dialog.DialogManager;
		this._onAuthenticationCancel = authenticationCancelCallback || null;
		this._onUserInvalidPin = invalidPinCallback || function () {
			this.customiseDialog({
				description: PinHelper.getString("wrongPin") + PinHelper.getString("tryAgain"),
				reset: true
			});
		};
		this._onUserAuthenticationSuccess = successfulAuthenticationCallback || null;
		this._onUserAuthenticationFailure = failedAuthenticationCallback || null;
		this._hideTime = !isNaN(hideTime) ? hideTime : this._dialogManager.DEFAULT_AUTO_CLOSE_TIMEOUT;
		this._keepCurrentUser = keepCurrentUser || false;
		this._pinPathObject = {
			"purchase": $N.app.constants.PURCHASE_PIN_PATH,
			"facebook": $N.app.constants.SOCIAL_FACEBOOK_PIN
		};
	}

	/**
	 * Sets the PIN dialog's id, title, description and text for the OK button
	 *
	 * @method setDialogProperties
	 * @param {Object} configObject contains values in the attributes id, title, body, ok
	 */
	PinHelper.prototype.setDialogProperties = function (configObject) {
		var me = this;
		$N.apps.core.Language.adornWithGetString(PinHelper);
		configObject.id = configObject.id || 'pinDialog';
		configObject.title = configObject.title || "";
		configObject.subTitle = configObject.subTitle || "";
		configObject.description = configObject.description || "";
		configObject.eventImage = configObject.eventImage || "";
		configObject.pinEntryY = configObject.pinEntryY || "";
		this.pinDialog = new $N.apps.dialog.PinDialog(configObject.id, null, null, null, null, function (pinNumber) {
			me.validatePin(pinNumber);
		}, function () {
			if (me._onAuthenticationCancel) {
				me._onAuthenticationCancel();
			}
			me.hideDialog();
		}, 850, 980, null, null, false, true);
		this.customiseDialog(configObject);
	};

	PinHelper.prototype.setTitle = function (title) {
		this.pinDialog.setTitle(title);
	};

	PinHelper.prototype.setDescription = function (description) {
		this.pinDialog.setDescription(description);
	};

	/**
	 * shows the PIN dialog to the user  and sets the type of pin to validate against
	 * and whether the user has a defined amount of attempts to get the PIN correct
	 *
	 * @method showPinDialog
	 * @param {String} whichPin (case insensitive) has to be one of 'master' (parental control),
	 * 'slave' (vod purchase) or 'ca' (detailed status messages from CA for PPV).
	 * @param {Boolean} showUntilAuthenticated if true, shows the PIN dialog until the user
	 * enters the correct PIN or dismisses the dialog
	 * @param {Number} timesToShow number of incorrect attempts that the user is allowed
	 */
	PinHelper.prototype.showPinDialog = function (whichPin, showUntilAuthenticated, timesToShow, isPersistent) {
		$N.app.VolumeControl.setIsEnabled(false);
		if (isPersistent) {
			this._dialogManager.showPersistentDialog(this.pinDialog);
		} else {
			$N.app.DialogueHelper.displayDialogue(this.pinDialog,
					$N.app.DialogueHelper.PIN_ENTRY,
					this._hideTime);
		}
		this._whichPin = whichPin;
		this._showUntilAuthenticated = showUntilAuthenticated;
		this._timesToShow = timesToShow || this._timesToShow;
	};

	/**
	 * Hides the pin dialog and resets the entered pin
	 *
	 * @method hideDialog
	 */
	PinHelper.prototype.hideDialog = function () {
		$N.app.VolumeControl.setIsEnabled(true);
		if (this.pinDialog) {
			this._dialogManager.hideDialog(this.pinDialog);
			this.customiseDialog({reset: true});
		}
	};

	/**
	 * Fires the callback with a boolean parameter
	 * if the entered pin matches or not
	 * @method uiPinValidation
	 * @param {Object, String, callback}
	 */
	function uiPinValidation(me, pinNumber, pinValidatedCallback, absolute) {
		var currentPin =  $N.platform.system.Preferences.get(me._pinPathObject[me._whichPin.toLowerCase()], absolute);
		pinValidatedCallback(currentPin.toString() === pinNumber.toString());
	}

	/**
	 * Validates the entered pin and calls the required callback
	 *
	 * @method validatePin
	 * @param {String} pinNumber The entered PIN number
	 */
	PinHelper.prototype.validatePin = function (pinNumber) {
		var me = this,
			pinValidated = function (validated) {
				if (validated) {
					if ((me._whichPin.toLowerCase() === 'master') && (!$N.platform.ca.ParentalControl.isCurrentUserMaster())) {
						$N.platform.ca.ParentalControl.setPolicyModifier([{type: $N.platform.ca.ParentalControl.PolicyModifiers.TIMEOUT, data: $N.app.constants.MASTER_EXPIRATION_TIME}]);
					}
					if (!me.pinDialog._dialogGUIObject._inProgressAppearance) {
						me.hideDialog();
					}
					me._onUserAuthenticationSuccess();
				} else {
					me._onUserInvalidPin();
				}
			},
			authenticationResult = false;
		switch (this._whichPin.toLowerCase()) {
		case 'master':
			$N.platform.ca.PINHandler.validateParentalPin(pinNumber, pinValidated, this._keepCurrentUser);
			break;
		case 'ca':
			authenticationResult = $N.platform.ca.PINHandler.validateCAPurchasePin(pinNumber);
			pinValidated(authenticationResult);
			break;
		case 'install':
			pinValidated(pinNumber === $N.app.Config.getConfigValue("first.install.pin"));
			break;
		case 'purchase':
			uiPinValidation(this, pinNumber, pinValidated, true);
			break;
		case 'facebook':
			uiPinValidation(this, pinNumber, pinValidated, false);
			break;
		default:
			$N.platform.ca.PINHandler.validatePurchasePin(pinNumber, pinValidated);
		}
	};

	/**
	 * Returns true if the PIN dialog is showing, false if not
	 *
	 * @method isPinShowing
	 * @return {Boolean}
	 */
	PinHelper.prototype.isPinShowing = function () {
		if (this.pinDialog && this._dialogManager.getCurrentDialog() && this._dialogManager.getCurrentDialog().id === this.pinDialog.id) {
			return true;
		}
		return false;
	};

	/**
	 * Sets the time to wait before hiding the PIN
	 *
	 * @method setHideTime
	 * @param {Number} time Milliseconds to wait before hiding the PIN dialog
	 */
	PinHelper.prototype.setHideTime = function (time) {
		this._hideTime = time;
	};

	/**
	 * Given a config object that has properies matching the PinDialog
	 * instances setter methods will call those setter methods.
	 *
	 * @method customiseDialog
	 * @param {Object} configObj
	 */
	PinHelper.prototype.customiseDialog = function (configObj) {
		this.pinDialog.customise(configObj);
	};

	/**
	 * Setter for _onAuthenticationCancel
	 *
	 * @method setAuthenticationCancelCallback
	 * @param callbackFunction {Function}
	 */
	PinHelper.prototype.setAuthenticationCancelCallback = function (callbackFunction) {
		this._onAuthenticationCancel = callbackFunction;
	};

	/**
	 * Setter for _onUserInvalidPin
	 *
	 * @method setInvalidPinCallback
	 * @param callbackFunction {Function}
	 */
	PinHelper.prototype.setInvalidPinCallback = function (callbackFunction) {
		this._onUserInvalidPin = callbackFunction;
	};

	/**
	 * Setter for _onUserAuthenticationSuccess
	 *
	 * @method setAuthenticationSuccessCallback
	 * @param callbackFunction {Function}
	 */
	PinHelper.prototype.setAuthenticationSuccessCallback = function (callbackFunction) {
		this._onUserAuthenticationSuccess = callbackFunction;
	};

	/**
	 * Setter for _onUserAuthenticationFailure
	 *
	 * @method setAuthenticationFailureCallback
	 * @param callbackFunction {Function}
	 */
	PinHelper.prototype.setAuthenticationFailureCallback = function (callbackFunction) {
		this._onUserAuthenticationFailure = callbackFunction;
	};

	/**
	 * Handles key presses when the PIN dialog is active
	 * @method handlePinKeyPressCallback
	 * @param {string} key
	 * @param {Object} callback function
	 */
	PinHelper.prototype.handlePinKeyPressCallback = function (key, callback) {
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			isCallbackKeyValid = (
				isNaN(parseInt(key, 10)) &&
				key !== keys.KEY_LEFT &&
				key !== keys.KEY_OK &&
				key !== keys.KEY_RIGHT &&
				key !== keys.KEY_VOL_DOWN &&
				key !== keys.KEY_VOL_UP &&
				key !== keys.KEY_MUTE
			);
		if ((isCallbackKeyValid && callback)) {
			callback();
		}
	};

	/**
	 * Handles key presses when the PIN dialog is active
	 * @method keyHandler
	 * @param key {String} key that was pressed
	 * @return {Boolean} true if the key was handled, false otherwise
	 */
	PinHelper.prototype.keyHandler = function (key) {
		return this.pinDialog.keyHandler(key);
	};

	$N.app.PinHelper = PinHelper;
}($N || {}));
