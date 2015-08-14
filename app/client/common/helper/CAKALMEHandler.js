/**
 * The CAKALMEHandler module is responsible for displaying the error message based on the event type and information.
 *
 * @class $N.app.CAKALMEHandler
 * @constructor
 * @extends $N.app.CAKHandler
 * @requires $N.apps.core.Log
 * @requires $N.app.constants
 *
 * @author Murali
 */

(function ($N) {

	var me,
		isStreamDisabled = null;

	function CAKALMEHandler() {
		me = this;
		this._log = new $N.apps.core.Log("ca", "CAKALMEHandler");
		this.contentStartFailed = $N.app.constants.CA_PLAY_ERRORS.contentStartFailedReason;
		this.contentError = $N.app.constants.CA_PLAY_ERRORS.contentErrorReason;
		this.streamDisabled = $N.app.constants.CA_PLAY_ERRORS.streamDisabledReason;
		$N.app.fullScreenPlayer.setStreamEnabledCallback(this.streamEnabledCallback);
		this.errorMessage = $N.app.ErrorMessage;
		this.conditionalAccessErrorId = $N.app.ErrorMessageType.conditionalAccessError;
		this._currentSmartCardState = null;
	}

	$N.apps.util.Util.extend(CAKALMEHandler, $N.app.CAKHandler);

	/**
	 * This listener is called when smart card is removed
	 * shows/hides the smart card removed error popup if isStreamDisabled value is true.
	 * @method SmartcardRemovedListener
	 * @param {object} smartcard status
	 * @public
	 */

	CAKALMEHandler.prototype.SmartcardRemovedListener = function (event) {
		me._log("ca", "enter SmartcardRemovedListener");
		if ($N.common.helper.PowerManager.getCurrentPowerMode() === $N.common.helper.PowerManager.SYSTEM_POWER_NORMAL) {
			me.errorMessage.hideErrorMessageDialogWithId(me.conditionalAccessErrorId);
			if (me.getStreamDisabled()) {
				$N.app.DialogueHelper.createAndShowCADialogue($N.app.constants.DLG_CA_SMART_CARD_REMOVED);
			}
		}
	};

	/**
	 * This listener is called when smart card is inserted
	 * Shows/hides the previously shown smart card removed popup and calls showError if isStreamDisabled.
	 * @method SmartcardInsertedListener
	 * @param {object} smartcard status
	 * @public
	 */

	CAKALMEHandler.prototype.SmartcardInsertedListener = function (event) {
		me._log("ca", "enter SmartcardInsertedListener");
		if ($N.common.helper.PowerManager.getCurrentPowerMode() === $N.common.helper.PowerManager.SYSTEM_POWER_NORMAL) {
			if (CCOM.ConditionalAccess.OK === event.state) {
				$N.app.DialogueHelper.hideCADialogues();
			} else if (me.getStreamDisabled()) {
				me.showError(event.state);
			}
		}
	};

	/**
	 * This listener is called when smart card state is changed
	 * Shows/hides the previously shown smart card error popup and calls showError if isStreamDisabled.
	 * @method SmartcardUpdatedListener
	 * @param {object} smartcard status
	 * @public
	 */

	CAKALMEHandler.prototype.SmartcardUpdatedListener = function (event) {
		me._log("ca", "enter SmartcardUpdatedListener");
		if (CCOM.ConditionalAccess.OK === event.state) {
			$N.app.DialogueHelper.hideCADialogues();
		} else if (me.getStreamDisabled()) {
			me.showError(event.state);
		}
	};

	/**
	 * This method is called from ConditionalCAK73 when there is a onStreamDisabled, onStreamEnabled, onPlayerPLaying event occurs
	 * @method setStreamDisabled
	 * @param {bool} flag
	 * @public
	 */

	CAKALMEHandler.prototype.setStreamDisabled = function (value) {
		me._log("ca", "enter setStreamDisabled");
		if (!value) {
			$N.app.fullScreenPlayer.tuner.showVideo();
		}
		isStreamDisabled = value;
	};

	/**
	 * This method returns isStreamDisabled value, which tells onStreamDisabled event occured or not
	 * @method getStreamDisabled
	 * @private
	 * @return {enum} isStreamDisabled
	 */

	CAKALMEHandler.prototype.getStreamDisabled = function () {
		me._log("ca", "enter getStreamDisabled");
		return isStreamDisabled;
	};

	/**
	 * This method is called when stream is enabled (onStreamEnabled event occurs)
	 * @method streamEnabledCallback
	 * @private
	 */

	CAKALMEHandler.prototype.streamEnabledCallback = function () {
		me._log("ca", "enter streamEnabledCallback");
		$N.app.DialogueHelper.hideCADialogues();
	};

	/**
	 * This method is called to check if access was denied
	 * @method isAccessDenied
	 * @public
	 */
	CAKALMEHandler.prototype.isAccessDenied = function () {
		me._log("ca", "enter isAccessDenied");
		if ((me.getStreamDisabled() !== false)
				&&
				((this._currentSmartCardState === CCOM.ConditionalAccess.DENIED)
					|| (this._currentSmartCardState === $N.app.constants.CA_PLAY_ERRORS.contentStartFailedReason.CA_ACCESS_DENIED)
					|| (this._currentSmartCardState === $N.app.constants.CA_PLAY_ERRORS.contentErrorReason.CA_ACCESS_DENIED)
					|| (this._currentSmartCardState === $N.app.constants.CA_PLAY_ERRORS.streamDisabledReason.CA_ACCESS_DENIED))) {
			return true;
		} else {
			return false;
		}
	};

	/**
	 * This method shows the error popup depending on the CA/SmartCard status
	 * @method showError
	 * @public
	 * @param {enum} smartcardState
	 * @return {Object} playoutRequest
	 */

	CAKALMEHandler.prototype.showError = function (smartcardState) {
		this._log("ca", "enter show errorrr");
		if ($N.common.helper.PowerManager.getCurrentPowerMode() === $N.common.helper.PowerManager.SYSTEM_POWER_NORMAL) {
			var title,
				message,
				currentSmartcardInfo = null,
				currentServiceId = null,
				currentEvent = null,
				eventInfo = null,
				handled = false,
				errorMessageObject = this.errorMessage.getCurrentErrorMessageObject(),
				smartCardObject = $N.app.ConditionalAccessCAK73.getCASmartCardInfo(),
				currentEventFromPPV = null;
			this._currentSmartCardState = smartcardState;
			switch (smartcardState) {
			case CCOM.ConditionalAccess.EXPIRED:
				$N.app.DialogueHelper.createAndShowCADialogue($N.app.constants.DLG_CA_SMART_CARD_EXPIRED);
				handled = true;
				break;
			case CCOM.ConditionalAccess.INCOMPATIBLE:
				$N.app.DialogueHelper.createAndShowCADialogue($N.app.constants.DLG_CA_SMART_CARD_INCOMPATIBLE);
				handled = true;
				break;
			case CCOM.ConditionalAccess.ERROR:
			case CCOM.ConditionalAccess.NOT_CERTIFIED:
				$N.app.DialogueHelper.createAndShowCADialogue($N.app.constants.DLG_CA_SMART_CARD_NOT_CERTIFIED);
				handled = true;
				break;
			case CCOM.ConditionalAccess.INVALID:
				$N.app.DialogueHelper.createAndShowCADialogue($N.app.constants.DLG_CA_SMART_CARD_INVALID);
				handled = true;
				break;
			case CCOM.ConditionalAccess.MUTE:
				$N.app.DialogueHelper.createAndShowCADialogue($N.app.constants.DLG_CA_SMART_CARD_MUTE);
				handled = true;
				break;
			case CCOM.ConditionalAccess.SUSPENDED:
				$N.app.DialogueHelper.createAndShowCADialogue($N.app.constants.DLG_CA_SMART_CARD_SUSPENDED);
				handled = true;
				break;
			case CCOM.ConditionalAccess.BLACKLISTED:
				$N.app.DialogueHelper.createAndShowCADialogue($N.app.constants.DLG_CA_SMART_CARD_BLACKLISTED);
				handled = true;
				break;
			//Ca-access state is used to take a decision on not paired and never paired states
			case this.streamDisabled.CA_ACCESS_PAIRING_REQUIRED:
			case this.contentStartFailed.CA_ACCESS_PAIRING_REQUIRED:
			case this.contentError.CA_ACCESS_PAIRING_REQUIRED:
				// By default smartcard state will be Not paired, if smart card state is Never paired then title and message is changed.
				if (smartCardObject.smartcardInfo.state === CCOM.ConditionalAccess.NEVER_PAIRED) {
					$N.app.DialogueHelper.createAndShowCADialogue($N.app.constants.DLG_CA_SMART_CARD_NEVER_PAIRED);
				} else {
					$N.app.DialogueHelper.createAndShowCADialogue($N.app.constants.DLG_CA_SMART_CARD_NOT_PAIRED);
				}
				handled = true;
				break;
			//This case to handle whenever both STB(not paired with any other smart card) and Smart card are not paired.
			case this.streamDisabled.CA_ACCESS_CHIPSET_PAIRING_REQUIRED:
			case this.contentStartFailed.CA_ACCESS_CHIPSET_PAIRING_REQUIRED:
			case this.contentError.CA_ACCESS_CHIPSET_PAIRING_REQUIRED:
				$N.app.DialogueHelper.createAndShowCADialogue($N.app.constants.DLG_CA_SMART_CARD_NEEDS_CHIPSET_PAIRING);
				handled = true;
				break;
			case this.streamDisabled.CA_ACCESS_BLACKED_OUT:
			case this.contentStartFailed.CA_ACCESS_BLACKED_OUT:
			case this.contentError.CA_ACCESS_BLACKED_OUT:
			case CCOM.ConditionalAccess.BLACKED_OUT:
				$N.app.DialogueHelper.createAndShowCADialogue($N.app.constants.DLG_CA_SMART_CARD_BLACKOUT);
				handled = true;
				break;
			case this.streamDisabled.CA_ACCESS_DENIED:
			case this.contentStartFailed.CA_ACCESS_DENIED:
			case this.contentError.CA_ACCESS_DENIED:
			case CCOM.ConditionalAccess.DENIED:
				currentSmartcardInfo = CCOM.ConditionalAccess.getSmartcardInfo();
				if (currentSmartcardInfo && (CCOM.ConditionalAccess.OK === currentSmartcardInfo.smartcardInfo.state)) {
					currentServiceId = $N.app.epgUtil.getServiceById($N.app.epgUtil.getChannelFromPrefs()).serviceId;
					currentEventFromPPV = $N.app.PPVHelper.getCurrentEvent();
					if (currentEventFromPPV && (currentEventFromPPV.serviceId !== currentServiceId)) {
						currentEventFromPPV = null;
					}
					currentEvent = currentEventFromPPV || $N.app.epgUtil.getEvent("current", currentServiceId);
					eventInfo = (currentEvent !== null) ? CCOM.ConditionalAccess.getEventInfo(currentEvent.eventId) : null;
					if ($N.app.ParentalControlUtil.isChannelOrProgramLocked(currentEvent)) {
						handled = true;
					} else if (eventInfo && $N.app.PPVHelper.getPPVEventPurchaseInfo(currentEvent, eventInfo) && (eventInfo.caAccess === CCOM.ConditionalAccess.DENIED)) {
						$N.apps.util.EventManager.fire("caPPVAccessDenied");
						handled = true;
					}
					if (handled === false) {
						$N.app.DialogueHelper.createAndShowCADialogue($N.app.constants.DLG_CA_SMART_CARD_ACCESS_DENIED);
						handled = true;
					}
				} else {
					this.showError(currentSmartcardInfo.smartcardInfo.state);
				}
				break;
			case this.streamDisabled.CA_NO_VALID_SECURE_DEVICE:
			case this.contentStartFailed.CA_NO_VALID_SECURE_DEVICE:
			case this.contentError.CA_NO_VALID_SECURE_DEVICE:
			case CCOM.ConditionalAccess.NO_VALID_SECURE_DEVICE:
				currentSmartcardInfo = CCOM.ConditionalAccess.getSmartcardInfo();
				if (currentSmartcardInfo && currentSmartcardInfo.error) {
					$N.app.DialogueHelper.createAndShowCADialogue($N.app.constants.DLG_CA_SMART_CARD_REMOVED);
					handled = true;
				} else {
					this.showError(currentSmartcardInfo.smartcardInfo.state);
				}
				break;
			}
			if (handled) {
				$N.app.fullScreenPlayer.tuner.hideVideo();
			}
			this._log("ca", "exit show errorrr");
		}
	};


	$N.app = $N.app || {};
	$N.app.CAKALMEHandler = CAKALMEHandler;

}($N || {}));
