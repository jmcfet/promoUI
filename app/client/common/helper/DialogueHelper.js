/**
 * Helper class for Dialogue Boxes
 *
 * @class $N.app.DialogueHelper
 * @author Jayne Gilmour
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.app.constants
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.DialogueHelper = (function () {

		var log = new $N.apps.core.Log("Helper", "DialogueHelper"),
			constants = $N.app.constants,
			whpvrPlaybackErrorDialogue = null,
			whpvrRecordingErrorDialogue = null,
			confirmExitDialogue = null,
			generalDialogues = {},

			// Old dialogue enums, please don't add to this list. Instead add new enums to list in Constants.js
			// TODO: https://jira.opentv.com/browse/NETUI-3548
			NEW_POPUP_MAIL = 23,
			PIN_ENTRY = 36,
			DLNA = 37,
			REMINDER_DELETE_ERROR = 60,
			PIN_MISMATCH = 63,
			PIN_CHANGE_FAILURE = 64,
			AUTHENTICATION_FAILURE = 65,
			NOW_DIALOGUE_TIMEOUT = 60000,
			reusableNowDialogue,
			reusableSocialAccountAuthDialogue,
			caDialogExitCallback = null;

		/**
		 * Return a JSFW dialogue priority based on dialogue enumeration
		 * For efficiency dialogues will default to "LOW" unless they are specifically set higher
		 * @method mapDialoguePriority
		 * @param {Number} Dialogue enumeration
		 * @return {Number} JSFW dialogue priority
		 */
		function mapDialoguePriority(dialogueEnum) {
			switch (dialogueEnum) {
			// CA Text popup
			// Forced software update
			// CA BDC
			case constants.NEW_POPUP_CA:
			case constants.DLG_CHANNEL_UNSUBSCRIBED:
			case constants.DLG_CA_SMART_CARD_EXPIRED:
			case constants.DLG_CA_SMART_CARD_NOT_PAIRED:
			case constants.DLG_CA_SMART_CARD_NEVER_PAIRED:
			case constants.DLG_CA_SMART_CARD_REMOVED:
			case constants.DLG_CA_SMART_CARD_MUTE:
			case constants.DLG_CA_SMART_CARD_INVALID:
			case constants.DLG_CA_SMART_CARD_INCOMPATIBLE:
			case constants.DLG_CA_SMART_CARD_SUSPENDED:
			case constants.DLG_CA_SMART_CARD_NOT_CERTIFIED:
			case constants.DLG_CA_SMART_CARD_BLACKOUT:
			case constants.DLG_CA_SMART_CARD_ACCESS_DENIED:
			case constants.DLG_CA_SMART_CARD_NEEDS_CHIPSET_PAIRING:
			case constants.DLG_CA_SMART_CARD_BLACKLISTED:
			case constants.DLG_CA_SMART_CARD_ACCESS_DENIED_PPV:
				return $N.apps.dialog.DialogManager.VERY_HIGH_PRIORITY;

			// Conflict resolution pop-up
			// Reminders
			// Autotune
			case constants.DLG_CONFLICT_RESOLUTION:
			case constants.DLG_REMINDER:
			case constants.DLG_AUTO_TUNE:
			case constants.DLG_AUTO_TUNE_CONFLICT:
			case constants.DLG_AUTO_TUNE_START:
			case constants.DLG_STANDBY_CONFIRMATION:
			case constants.DLG_FACTORY_RESET_RECORDING:
			case constants.DLG_FACTORY_RESET_SCHEDULED:
			case constants.DLG_FACTORY_RESET_CONFIRMATION:
				return $N.apps.dialog.DialogManager.HIGH_PRIORITY;

			// No Disk
			// Record/CancelRec popup
			case constants.DLG_DVR_DISC_NOT_PRESENT:
			case constants.DLG_RECORD_CONFIRMATION:
			case constants.DLG_CANCEL_RECORD:
			case constants.DLG_CANCEL_LIVE_RECORD:
			case constants.DLG_CANCEL_SERIES:
			case constants.DLG_DISK_SPACE:
			case constants.DLG_MORE_ON_NOW:
				return $N.apps.dialog.DialogManager.MEDIUM_PRIORITY;

			default:
				return $N.apps.dialog.DialogManager.LOW_PRIORITY;
			}
		}

		/**
		 * Return a dialogue's autoclose value
		 * @method mapDialogueAutoClose
		 * @param {Number} Dialogue enumeration
		 * @return {Number} dialogue auto close in milliseconds
		 */
		function mapDialogueAutoClose(dialogueEnum) {
			switch (dialogueEnum) {
			case constants.DLG_DISK_SPACE:
				// 2 minutes
				return constants.MINUTE_IN_MS * 2;
			case constants.DLG_AUTO_TUNE_START:
			case constants.DLG_AUTO_TUNE_CONFLICT:
			case constants.DLG_STANDBY_CONFIRMATION:
			case constants.DLG_AUTO_TUNE:
			case constants.DLG_REMINDER:
				// 1 minute
				return constants.MINUTE_IN_MS;
			case constants.DLG_USB_DEVICE_DETECTED:
			case constants.DLG_CONFLICT_RESOLUTION:
				// 30 seconds
				return constants.SECOND_IN_MS * 30;
			case constants.DLG_PPV_PURCHASE_SUCCESS:
				// 15 seconds
				return constants.SECOND_IN_MS * 15;
			case constants.DLG_NEW_POPUP_CA_AUTOTIMEOUT:
				return constants.SECOND_IN_MS * 10;
			default:
				return 0;  // no autoclose
			}
		}

		/**
		 * Return a NET-specific error code for display on a dialogue
		 * An overwhelming number of dialogues don't have an error code
		 *
		 * @method mapDialogueErrorCode
		 * @param {Number} Dialogue enumeration
		 * @return {String} Error code, or null if no error code
		 */
		function mapDialogueErrorCode(dialogueEnum) {
			switch (dialogueEnum) {
			case constants.DLG_CA_SMART_CARD_SUSPENDED:
				return "C01";
			case constants.DLG_CHANNEL_UNSUBSCRIBED:
			case constants.DLG_CA_SMART_CARD_ACCESS_DENIED:
			case constants.DLG_CA_SMART_CARD_ACCESS_DENIED_PPV:
				return "C02";
			case constants.DLG_PPV_PURCHASE_ERROR:
				return "C03";
			case constants.DLG_CA_SMART_CARD_BLACKOUT:
				return "C05";
			case constants.DLG_NO_SIGNAL:
				return "T01";
			case constants.DLG_ETHERNET_DISCONNECTED:
				return "T02";
			case constants.DLG_CA_SMART_CARD_MUTE:
				return "T04";
			case constants.DLG_CA_SMART_CARD_REMOVED:
				return "T05";
			case constants.DLG_CA_SMART_CARD_NEVER_PAIRED:
				return "T06";
			case constants.DLG_CA_SMART_CARD_INVALID:
				return "T07";
			case constants.DLG_CA_SMART_CARD_NOT_CERTIFIED:
				return "T08";
			case constants.DLG_CA_SMART_CARD_NOT_PAIRED:
				return "T09";
			case constants.DLG_CA_SMART_CARD_NEEDS_CHIPSET_PAIRING:
				return "T09-2";
			case constants.DLG_CA_SMART_CARD_EXPIRED:
				return "T10";
			case constants.DLG_CA_SMART_CARD_INCOMPATIBLE:
				return "T11";
			case constants.DLG_CA_SMART_CARD_BLACKLISTED:
				return "24";
			case constants.DLG_MORE_ON_NOW:
				return "X99";
			case constants.DLG_CATCHUP_SYSTEM_MSG:
				return "SYS-CAT";
			case constants.DLG_CATCHUP_NOT_FOUND:
				return "404";
			case constants.DLG_CATCHUP_FORBIDDEN:
				return "403";
			case constants.DLG_PVR_JOB_FAILED_MSG:
				return "SYS-PVR";
			case constants.DLG_PVR_INVALID_EVENT_MSG:
				return "SYS-PVR-INV-EVT";
			default:
				return null;
			}
		}

		/**
		 * Map dialogue enumeration to text string for JSFW Dialog Manager
		 *
		 * @method mapDialogueID
		 * @param {Number} Dialogue enumeration
		 * @return {String} JSFW ID string
		 */
		function mapDialogueID(dialogueEnum) {
			switch (dialogueEnum) {
			case constants.DLG_STOP_PLAYBACK_GO_TO_MUSICA:
				return "stopPlaybackGotoMusica";
			case constants.DLG_STOP_PLAYBACK_GO_TO_MOSAIC:
				return "stopPlaybackGotoMosaic";
			case constants.DLG_REMOTE_ACCESS_AUTH:
				return "remoteAccessAuthorisation";
			case constants.DLG_USB_FORMAT_COMPLETE:
				return "usbFormatCompleteDialog";
			case constants.DLG_ATA_FORMAT_COMPLETE:
				return "ataFormatCompleteDialog";
			case constants.DLG_DISK_SPACE:
				return "diskSpaceDialogue";
			case constants.DLG_USB_INCOMPATIBLE:
				return "usbIncompatibleDialog";
			case constants.DLG_USB_MEDIA_DETECTED:
				return "usbMediaDetected";
			case constants.DLG_USB_DRIVE_ATTACHED:
				return "usbDriveAttached";
			case constants.DLG_USB_STB_ALREADY_ASSOCIATED:
				return "usbSTBalreadyAssociated";
			case constants.DLG_USB_STB_ASSOCIATED:
				return "usbAssociatedDialogue";
			case constants.DLG_UNAUTHORISED_RECORDING:
				return "unauthorizedRecordingDialogue";
			case constants.DLG_PPV_CHANNEL_SUBSCRIPTION:
				return "ppvAndChannelSubscription";
			case constants.DLG_CHANNEL_SUBSCRIPTION:
				return "ppvChannelSubscription";
			case constants.DLG_PPV_PURCHASE_ERROR:
				return "ppvPurchaseError";
			case constants.DLG_FACEBOOK_AUTHENTICATION:
				return "facebookAccountAuthentication";
			case constants.DLG_FACEBOOK_PIN_CHANGE:
				return "facebookAccountAuthentication";
			case constants.DLG_FACEBOOK_AUTH_ERROR:
				return "facebookOAuthError";
			case constants.DLG_FACEBOOK_DISCONNECT_ACCOUNT:
				return "facebookDisconnectAccount";
			case constants.DLG_FACEBOOK_POST_ACCOUNT:
				return "facebookPostAccount";
			case constants.DLG_SOCIAL_ACCOUNT_AUTHORISED:
				return "facebookAccountAuth";
			case constants.DLG_ETHERNET_DISCONNECTED:
				return "ethernetDisconnected";
			case constants.DLG_FACTORY_RESET_RECORDING:
				return "factoryResetRecordingConfirmation";
			case constants.DLG_FACTORY_RESET_SCHEDULED:
				return "factoryResetScheduledConfirmation";
			case constants.DLG_MEDIA_DEVICE_UNPLUGGED:
				return "mediaDeviceUnplugged";
			case constants.DLG_WHPVR_SWITCH:
				return "WHPVRSwitch";
			case constants.DLG_USB_FORMAT_ERROR:
				return "usbFormatError";
			case constants.DLG_IP_RENEWAL:
				return "renewalIp";
			case constants.DLG_USB_WAITING:
				return "usbWaitingDialog";
			case constants.DLG_SAVING_FAVOURITES:
				return "savingFavorites";
			case constants.DLG_WIFI_DISCONNECTED:
				return "wifiDisconnected";
			case constants.DLG_INVALID_DATE:
				return "invalidDate";
			case constants.DLG_INVALID_TIME:
				return "invalidTime";
			case constants.DLG_CA_SMART_CARD_EXPIRED:
				return "caErrorSmartcardExpired";
			case constants.DLG_CA_SMART_CARD_INCOMPATIBLE:
				return "caErrorSmartcardIncompatible";
			case constants.DLG_CA_SMART_CARD_NOT_CERTIFIED:
				return "caErrorSmartcardNotCertified";
			case constants.DLG_CA_SMART_CARD_INVALID:
				return "caErrorSmartcardInvalid";
			case constants.DLG_CA_SMART_CARD_MUTE:
				return "caErrorSmartcardMute";
			case constants.DLG_CA_SMART_CARD_SUSPENDED:
				return "caErrorSmartcardSuspended";
			case constants.DLG_CA_SMART_CARD_BLACKLISTED:
				return "caErrorSmartcardBlacklisted";
			case constants.DLG_CA_SMART_CARD_NOT_PAIRED:
				return "caErrorSmartcardNotPaired";
			case constants.DLG_CA_SMART_CARD_NEVER_PAIRED:
				return "caErrorSmartcardNeverPaired";
			case constants.DLG_CA_SMART_CARD_NEEDS_CHIPSET_PAIRING:
				return "caErrorSmartcardNeedsChipsetPairing";
			case constants.DLG_CA_SMART_CARD_BLACKOUT:
				return "caErrorSmartcardBlackout";
			case constants.DLG_CA_SMART_CARD_ACCESS_DENIED:
				return "caErrorSmartcardAccessDenied";
			case constants.DLG_CA_SMART_CARD_ACCESS_DENIED_PPV:
				return "caErrorSmartcardAccessDeniedPPV";
			case constants.DLG_CA_SMART_CARD_REMOVED:
				return "caErrorSmartcardRemoved";
			case constants.DLG_RECONNECTING:
				return "reconnecting";
			case constants.DLG_PARENTAL_PIN_CHANGE:
				return "parentalPinChangeSuccess";
			case constants.DLG_PURCHASE_PIN_CHANGE:
				return "purchasePinChangeSuccess";
			case constants.DLG_SAVE_BLOCKED_CHANNELS:
				return "saveBlockChannelsError";
			case constants.DLG_FETCHING_FAVORITES_ERROR:
				return "fetchingFavoritesError";
			case constants.DLG_DLNA_COMMUNICATION_ERROR:
				return "dlnaCommunicationError";
			case constants.DLG_CHANNEL_UNSUBSCRIBED:
				return "unsubscribedChannel";
			case constants.DLG_DVR_DUPLICATE_FOLDER_ERROR:
				return "dvrDuplicateFolderError";
			case constants.DLG_YES_NO_CONFIRMATION:
				return "yesNoConfirmationDialogue";
			case constants.DLG_STARTOVER_PLAYBACK_CONFIRM:
				return "startoverPlaybackConfirm";
			case constants.DLG_DUPLICATE_FOLDER_NAME:
				return "duplicateFolderName";
			case constants.DLG_MANUAL_REC_MSG:
				return "manualRecordingDialog";
			case constants.DLG_INVALID_FOLDER_NAME:
				return "invalidFolderName";
			case constants.DLG_PPV_EVENT:
				return "PPVEventDialog";
			case constants.DLG_PORTAL_RESUME_RECORDING:
				return "PortalResumeRecordingDialogue";
			case constants.DLG_NO_VIDEO:
				return "noVideo";
			case constants.DLG_USB_MEDIA:
				return "usbMedia";
			case constants.DLG_ACCOUNT_LINKED:
				return "accountLinked";
			case constants.DLG_USB_MEDIA_UNPLUGGED:
				return "usbMediaUnplugged";
			case constants.DLG_SAFE_REMOVE_HARDDISK_RECORDING_IN_PROGRESS:
				return "safeRemoveHardDiskRecordingInProgress";
			case constants.DLG_SAFE_REMOVE_HARDDISK:
				return "safeRemoveHardDisk";
			case constants.DLG_SAFE_REMOVE_HARDDISK_OK:
				return "safeRemoveHardDiskOK";
			case constants.DLG_SAFE_REMOVE_HARDDISK_FAILED:
				return "safeRemoveHardDiskFailed";
			case constants.DLG_WHPVR_SERVER_NOT_PRESENT:
				return "WHPVRServerNotPresent";
			case constants.DLG_WHPVR_PLAY_ERROR:
				return "whpvrPlaybackErrorDialogue";
			case constants.DLG_WHPVR_RECORD_ERROR:
				return "whpvrRecordingErrorDialogue";
			case constants.DLG_PPV_RECORDING_BLOCKED:
				return "ppvEventRecordingBlocked";
			case constants.DLG_PPV_PURCHASE_SUCCESS:
				return "PPVPurchaseSuccessDialogue";
			case constants.DLG_DVR_OPERATOR_DISABLED:
				return "dvrOperatorDisabled";
			case constants.DLG_DVR_DISC_NOT_PRESENT:
				return "usbDVRDiscNotPresent";
			case constants.DLG_ONDEMAND_PLAYER:
				return "onDemandPlayer";
			case constants.DLG_STOP_PVR_PLAYBACK:
				return "StopPvrPlayback";
			case constants.DLG_UNPLUG_HARDDISK:
				return "unplugHardDisk";
			case constants.DLG_STOP_RECORDING:
				return "StopRecording";
			case constants.DLG_NOW_RESUME_OR_STARTOVER:
				return "nowResumeOrStartOverDialog";
			case constants.DLG_STOP_RECORDING_PLAYBACK:
				return "stopRecordingPlayback";
			case constants.DLG_MORE_ON_NOW:
				return "moreOnNow";
			case constants.DLG_PIN_MISMATCH:
				return "pinMisMatch";
			case constants.DLG_USB_DEVICE_DETECTED:
				return "usbDeviceDetected";
			case constants.DLG_CANCEL_RECORD:
				return "CancelRecordConfirmation";
			case constants.DLG_CANCEL_LIVE_RECORD:
				return "CancelLiveRecordConfirmation";
			case constants.DLG_CANCEL_SERIES:
				return "CancelSeriesConfirmation";
			case constants.DLG_DELETE_RECORD:
				return "DeleteRecordConfirmation";
			case constants.DLG_MANUAL_REC_FAIL_MSG:
				return "manualRecordingIsNotSet";
			case constants.DLG_FACTORY_RESET_CONFIRMATION:
				return "factoryResetConfirmationDialogue";
			case constants.DLG_CATCHUP_SYSTEM_MSG:
				return "catchupSystemErrorDialogue";
			case constants.DLG_CATCHUP_NOT_FOUND:
				return "catchupNotFoundDialogue";
			case constants.DLG_CATCHUP_FORBIDDEN:
				return "catchupForbiddenDialogue";
			case constants.DLG_PVR_JOB_FAILED_MSG:
				return "pvrJobFailedDialogue";
			case constants.DLG_PVR_INVALID_EVENT_MSG:
				return "pvrInvalidEventDialogue";
			case constants.DLG_STARTOVER_RESUME_OR_STARTOVER:
				return "startoverResumeOrStartOverDialog";
			case constants.DLG_CONFIRM_LEAVE_INSTALLER:
				return "confirmLeaveInstaller";
			case constants.DLG_TS_SIGNAL_LOSS:
				return "timeShiftSignalLoss";
			case constants.DLG_MEDIA_DEVICE_SAFE_REMOVE:
				return "mediaDeviceSafeRemove";
			case constants.DLG_RECORD_CONFIRMATION:
				return "RecordConfirmationDialogue";
			case constants.DLG_AT_TASK_FAILED_MSG:
				return "autotuneTaskFailedDialogue";
			case constants.DLG_TUNE_FAILED_MSG:
				return "tuneFailedDialogue";
			case constants.DLG_USB_DOMAIN_UNCERTAIN:
				return "domainUncertainDialogue";
			case constants.DLG_LIBRARY_RESUME_RECORDING:
				return "ResumeRecordingDialog";
			case constants.DLG_STANDBY_CONFIRMATION:
				return "standByConfirmDialogue";
			case constants.DLG_EXIT_APP:
				return "exitApplication";
			case constants.DLG_AUTO_TUNE:
				return "autoTuneDialog";
			case constants.DLG_AUTO_TUNE_START:
				return "autoTuneStart";
			case constants.DLG_AUTO_TUNE_CONFLICT:
				return "autoTuneConflictDialog";
			case constants.DLG_REMINDER:
				return "reminderDialog";
			case constants.DLG_NEW_POPUP_CA:
				return "CADialog";
			case constants.DLG_NEW_POPUP_CA_AUTOTIMEOUT:
				return "CADialogAutoTimeout";
			case constants.DLG_NEW_POPUP_MAIL:
				return "MessageDialog";
			case constants.DLG_CONFLICT_RESOLUTION:
				return "ConflictResolutionDialog";
			case constants.DLG_NO_FOLDER_NAME:
				return "noFolderName";
			case constants.DLG_FOLDER_NAME_EXISTS:
				return "folderNameExists";
			default:
				return null;
			}
		}

		/**
		 * New USB hotplug events should hide existing hotplug dialogues
		 * @method hideUSBDialogues
		 * @return {Boolean} dialogue closed
		 */
		function hideUSBDialogues() {
			log("hideUSBDialogues", "Enter");
			var currentDialogue = $N.apps.dialog.DialogManager.getCurrentDialog();

			if (currentDialogue && currentDialogue.id.substring(0, 3) === 'usb') {
				$N.apps.dialog.DialogManager.hideDialogWithId(currentDialogue.id);
				log("hideUSBDialogues", "Exit 1, returning true, hidden");
				return true;
			}
			log("hideUSBDialogues", "Exit 2, returning false, not visible");
			return false;
		}

		/**
		 * New PPV events should hide the current dialogue if it is a PPV one
		 * @method hidePPVDialogue
		 * @return {Boolean} dialogue closed
		 */
		function hidePPVDialogue() {
			log("hidePPVDialogue", "Enter");
			var currentDialogue = $N.apps.dialog.DialogManager.getCurrentDialog();

			if (currentDialogue && (currentDialogue.id.substring(0, 3).toLowerCase() === 'ppv')) {
				$N.apps.dialog.DialogManager.hideDialogWithId(currentDialogue.id);
				log("hidePPVDialogue", "Exit 1");
				return true;
			}
			log("hidePPVDialogue", "Exit 2");
			return false;
		}

		/**
		 * New CA error events should hide existing CA dialogues
		 * This function is a "sticking plaster" over historic code which re-used dialogue ids.
		 * Please don't copy, use as an exemplar or expand its use
		 * @method hideCADialogues
		 * @return {Boolean} dialogue closed
		 */
		function hideCADialogues() {
			var i = 0,
				result = false;

			for (i = constants.DLG_CA_SMART_CARD_EXPIRED; i <= constants.DLG_MORE_ON_NOW; i++) {
				result = result || $N.apps.dialog.DialogManager.hideDialogWithId(mapDialogueID(i));
			}

			return result;
		}

		/**
		 * New whpvr playback/recording errors should hide existing whpvr popups
		 * @method hideWHPVRErrorDialogues
		 * @return {Boolean} dialogue closed
		 */
		function hideWHPVRErrorDialogues() {
			var currentDialogue = $N.apps.dialog.DialogManager.getCurrentDialog();

			if (currentDialogue && currentDialogue.id.substring(0, 5) === 'whpvr') {
				$N.apps.dialog.DialogManager.hideDialogWithId(currentDialogue.id);
				return true;
			}
			return false;
		}

		/**
		 * @method calculateMenuHeight
		 * @param {Number} numberOfButtons
		 * @param {Number} buttonHeight
		 * @param {Number} buttonSpacing
		 * @param {Boolean} verticalButtonMode
		 * @return {Number} menuHeight
		 */
		function calculateMenuHeight(numberOfButtons, buttonHeight, buttonSpacing, verticalButtonMode) {
			var menuHeight = 0;
			if (numberOfButtons > 0) {
				menuHeight = buttonHeight;
				if (verticalButtonMode) {
					menuHeight += (buttonHeight + buttonSpacing) * (numberOfButtons - 1);
				}
			}
			return menuHeight;
		}

		function configureBackPlateUsingContent(title, controlsGroup, messageText, titleHeight, numberOfButtons, buttonHeight, buttonSpacing, verticalButtonMode, useRealMessageHeight) {
			var MESSAGE_GAP = 30,
				MESSAGE_ROW = 44,
				BUTTON_GAP = 42,
				SCREEN_WIDTH = 1920,
				overallHeightOfContent = 0,
				heightOfMessage = 0,
				heightOfButtons = 0,
				messageTextSplit = messageText.getText().split("\n"),
				numRowsInMessage = messageTextSplit.length,
				controlsHeight = 0,
				infoMessageConfig = null,
				errorMessageConfig = null,

				INFO_BACKPLATE_Y = 400,
				INFO_BACKPLATE_H = 200,
				INFO_backplateUpperGlow = 350,
				INFO_backplateLowerGlow = 598,

				ERR_BACKPLATE_Y = 234,
				ERR_BACKPLATE_H = 610.5,
				ERR_backplateUpperGlow = 184.5,
				ERR_backplateLowerGlow = 842;

			if (controlsGroup) {
				controlsHeight = controlsGroup.getTrueHeight();
			}

			if (useRealMessageHeight) {
				heightOfMessage = messageText.getContentHeight();
			} else {
				heightOfMessage = MESSAGE_ROW * numRowsInMessage;
			}

			if (numRowsInMessage > 0) {
				heightOfMessage += MESSAGE_GAP;
			}

			if (numberOfButtons > 0) {
				heightOfButtons = calculateMenuHeight(numberOfButtons, buttonHeight, buttonSpacing, verticalButtonMode);
			}

			if (!title.getText()) {
				titleHeight = 0;
				BUTTON_GAP = 0;
			}

			overallHeightOfContent = titleHeight + heightOfButtons + BUTTON_GAP + heightOfMessage + controlsHeight;

			infoMessageConfig = {
				backplateY : INFO_BACKPLATE_Y,
				backplateH : INFO_BACKPLATE_H,
				backplateUpperGlow : INFO_backplateUpperGlow,
				backplateLowerGlow : INFO_backplateLowerGlow,
				overallHeightOfContent : overallHeightOfContent,
				heightOfButtons: heightOfButtons,
				messageTextConfig: {
					x: 0,
					width: SCREEN_WIDTH,
					cssClass: "noMailText"
				}
			};

			errorMessageConfig = {
				backplateY : ERR_BACKPLATE_Y,
				backplateH : ERR_BACKPLATE_H,
				backplateUpperGlow : ERR_backplateUpperGlow,
				backplateLowerGlow : ERR_backplateLowerGlow,
				overallHeightOfContent : overallHeightOfContent,
				heightOfButtons: heightOfButtons
			};

			if (overallHeightOfContent === heightOfMessage) {
				return infoMessageConfig;
			} else {
				return errorMessageConfig;
			}
		}

		/**
		 * @method isKeyYesAction
		 * @param {Object} key
		 * @param {Boolean} return result of comparison
		 */
		function isKeyYesAction(key) {
			if (key) {
				if (key.action === $N.app.constants.YES_OPTION) {
					return true;
				} else if (key.key && key.key.action === $N.app.constants.YES_OPTION) {
					return true;
				}
			}
			return false;
		}

		/**
		 * @method _getDialogCallbackStop
		 * @private
		 * @param {Function} callbackYes
		 * @param {Function} callbackNo
		 */
		function _getDialogCallbackStop(callbackYes, callbackNo) {
			return function (key) {
				if (isKeyYesAction(key)) {
					callbackYes();
				} else {
					callbackNo();
				}
			};
		}

		/**
		 * @method updateDialogueTitleAndMessage
		 * @param {Number} dialogueEnum	dialogue enumeration
		 * @param {String} newTitle
		 * @param {String} newMessage
		 * @returns {Boolean} true if dialogue exists and has been updated, false otherwise
		 */
		function updateDialogueTitleAndMessage(dialogueEnum, newTitle, newMessage) {
			log("updateDialogueTitleAndMessage", "Enter");
			var textID = null;
			if (!dialogueEnum) {
				log("updateDialogueTitleAndMessage", "Exit 1, dialogueEnum not set");
				return false;
			}

			textID = mapDialogueID(dialogueEnum);
			if (textID === null) {
				log("updateDialogueTitleAndMessage", "Exit 2, enum not mapped to JSFW dialogue id");
				return false;
			}

			if (!generalDialogues[textID]) {
				log("updateDialogueTitleAndMessage", "Exit 3, dialogue does not exist");
				return false;
			}

			if (newTitle) {
				generalDialogues[textID]._dialogGUIObject.setTitle(newTitle);
			}

			if (newMessage) {
				generalDialogues[textID]._dialogGUIObject.setMessage(newMessage);
			}

			log("updateDialogueTitleAndMessage", "Exit 2, returning true updated");
			return true;
		}

		/**
		 * @method updateDialogueOptions
		 * @param {Number} dialogueEnum	dialogue enumeration
		 * @param {Object} newOptions
		 * @returns {Boolean} true if dialogue exists and has been updated, false otherwise
		 */
		function updateDialogueOptions(dialogueEnum, newOptions) {
			log("updateDialogueOptions", "Enter");
			var textID = null;
			if (!dialogueEnum) {
				log("updateDialogueOptions", "Exit 1, dialogueEnum not set");
				return false;
			}

			textID = mapDialogueID(dialogueEnum);
			if (textID === null) {
				log("updateDialogueOptions", "Exit 2, enum not mapped to JSFW dialogue id");
				return false;
			}

			if (!generalDialogues[textID]) {
				log("updateDialogueOptions", "Exit 3, dialogue does not exist");
				return false;
			}

			if (newOptions) {
				generalDialogues[textID]._dialogGUIObject.setOptions(newOptions);
			}

			log("updateDialogueOptions", "Exit 2, returning true updated");
			return true;
		}

		/**
		 * @method getDialogue
		 * @param {Number} dialogueEnum	dialogue enumeration
		 * @return {Object} Dialogue object if dialogue exists, otherwise null
		 */
		function getDialogue(dialogueEnum) {
			log("getDialogue", "Enter, checking dialogue #" + dialogueEnum);
			var textId = mapDialogueID(dialogueEnum);

			if (textId === null) {
				return null;
			}

			return generalDialogues[textId];
		}

		/**
		 * @method deleteDialogue
		 * @param {Number} dialogueEnum	dialogue enumeration value
		 * @return {Boolean}  true if deleted, false if dialogue did not exist
		 */
		function deleteDialogue(dialogueEnum) {
			log("deleteDialogue", "Enter, checking dialogue #" + dialogueEnum);
			var textId = mapDialogueID(dialogueEnum);

			if (textId === null) {
				return false;
			}

			generalDialogues[textId] = null;

			return true;
		}

		/**
		 * @method createAndShowDialogue
		 * @param {Number} dialogueID	dialogue enumeration
		 * @param {String} [titleText]	title of the dialogue
		 * @param {String} [messageText]	message of the dialogue
		 * @param {Object} [optionsParam]	options for buttons
		 * @param {Function} [optionSelectedCallbackParam]	button press callback
		 * @param {Function} [optionHighlightedCallbackParam]	button focus callback
		 * @param {String} [optionsOrientationParam]	button layout HORIZONTAL/VERTICAL
		 * @param {String} [titleImageParam]	source of image to be displayed as title image
		 * @param {Object} [dialogObjectConfigParam]	config for the gui object held inside the dialogue
		 * @param {Object} [alertIconParam]	alert image
		 * @param {Object} [guiTemplate]	template for re-skinning the dialogue
		 * @param {Object} [additionalControlsParam]	an object containing additional gui controls e.g. folder name in DVR
		 * @param {Object} [timedOutCallbackParam] an optional parameter specifying a call back to invoke if the dialogue times out
		 * @param {Function} shownCallbackParam User-closed callback
		 * @return {Object} returns the dialogue object
		 */
		function createAndShowDialogue(dialogueID, titleText, messageText, optionsParam, optionSelectedCallbackParam,
					optionHighlightedCallbackParam, optionsOrientationParam, titleImageParam, dialogObjectConfigParam,
					alertIconParam, guiTemplate, additionalControlsParam, timedOutCallbackParam, shownCallbackParam) {
			log("createAndShowDialogue", "Enter, showing dialogue #" + dialogueID);
			var options = optionsParam || [{
					name: $N.app.DialogueHelper.getString("ok"),
					action: $N.app.constants.OK_OPTION
				}],
				errorCode = mapDialogueErrorCode(dialogueID),
				optionSelectedCallback = optionSelectedCallbackParam || null,
				optionHighlightedCallback = optionHighlightedCallbackParam || null,
				optionsOrientation = optionsOrientationParam || "HORIZONTAL",
				additionalControls = additionalControlsParam || null,
				titleImage = titleImageParam || null,
				dialogObjectConfig = dialogObjectConfigParam || null,
				alertIcon = alertIconParam || false,
				timedOutCallback = timedOutCallbackParam || null,
				shownCallback = shownCallbackParam || null,
				textID = mapDialogueID(dialogueID),
				dialogueShowSuccess;

			if (!textID) {
				log("createAndShowDialogue", "Exit 2 - textID is null");
				return null;
			}

			if (!generalDialogues[textID]) {
				// doesn't already exist, so create
				if ((titleText === undefined) && (messageText === undefined)) {
					// if title and message are not specified in function parameters, then we retrieve them from
					// the language bundle by adding Title and Message suffixes
					titleText = $N.app.HotPlug.getString(textID + "Title");
					messageText = $N.app.HotPlug.getString(textID + "Message");
				}
				if ((titleText === undefined) && (messageText === undefined)) {
					log("createAndShowDialogue", "Exit 3 - missing title and message");
					return null;
				}

				generalDialogues[textID] = new $N.apps.dialog.ConfirmationDialogue(
					textID,
					titleText,
					messageText,
					options,
					optionSelectedCallback,
					optionHighlightedCallback,
					additionalControls,
					optionsOrientation,
					titleImage,
					guiTemplate
				);
			} else {
				generalDialogues[textID]._dialogGUIObject.selectDefaultItem();
				generalDialogues[textID].setSelectedCallback(optionSelectedCallback);
				generalDialogues[textID].setHighlightedCallback(optionHighlightedCallback);
			}

			if (dialogObjectConfig) {
				generalDialogues[textID]._dialogGUIObject.configure(dialogObjectConfig);
			}
			// Condition check added as some GUI template does not have setAlertBigVisibility method.
			if (generalDialogues[textID]._dialogGUIObject.setAlertBigVisibility && alertIcon) {
				generalDialogues[textID]._dialogGUIObject.setAlertBigVisibility(alertIcon);
			}

			if (errorCode) {
				// a small number of dialogues display an error code in the lower right of the dialogue
				generalDialogues[textID]._dialogGUIObject.setErrorCode($N.app.DialogueHelper.getString("errorCode") + errorCode);
			}

			dialogueShowSuccess = $N.apps.dialog.DialogManager.showDialog(generalDialogues[textID],
					mapDialoguePriority(dialogueID),
					mapDialogueAutoClose(dialogueID),
					null, // dialogue queued callback
					shownCallback, // shown callback
					timedOutCallback);

			log("createAndShowDialogue", "Exit");
			return generalDialogues[textID];
		}

		/**
		 * CA dialogues are coded in an "interesting" way so please don't copy, use as an exemplar or expand the use of this function
		 * @method createAndShowCADialogue
		 * @param {Number} Dialogue enumeration
		 * @return {Boolean} success
		 */
		function createAndShowCADialogue(id) {
			var i = 0,
				currentDialogue = $N.apps.dialog.DialogManager.getCurrentDialog(),
				dialogue = null;

			if (currentDialogue) {
				// there is already a dialogue on-screen
				if (currentDialogue.id.substring(0, 7).toLowerCase() === "caerror") {
					if (currentDialogue.id === mapDialogueID(id)) {
						return true;
					} else {
						$N.apps.dialog.DialogManager.hideDialogWithId(currentDialogue.id);
					}
				}
			}
			dialogue = createAndShowDialogue(id);
			dialogue.setSelectedCallback(caDialogExitCallback);
			dialogue.setExitCallback(caDialogExitCallback);
			return dialogue;
		}

		/**
		 * @method showWHPVRPlaybackErrorDialogue
		 * @param {String} tvName
		 */
		function showWHPVRPlaybackErrorDialogue(tvName) {
			var msgContent = $N.app.DialogueHelper.getString("whpvrPlaybackErrorMessage").replace("%TVNAME", tvName);

			createAndShowDialogue(
				$N.app.constants.DLG_WHPVR_PLAY_ERROR,
				$N.app.DialogueHelper.getString("whpvrPlaybackErrorTitle"),
				msgContent
			);
		}

		/**
		 * @method showWHPVRRecordingErrorDialogue
		 * @param {String} tvName
		 */
		function showWHPVRRecordingErrorDialogue(tvName) {
			var msgContent = $N.app.DialogueHelper.getString("whpvrRecordingErrorMessage").replace("%TVNAME", tvName);
			hideWHPVRErrorDialogues();
			createAndShowDialogue(
				$N.app.constants.DLG_WHPVR_PLAY_ERROR,
				$N.app.DialogueHelper.getString("whpvrRecordingErrorTitle"),
				msgContent
			);
		}

		/**
		 * Positions items within the dialog so as to maintain equal gaps above and below the content
		 * @method layoutConfirmationDialog
		 */
		function layoutConfirmationDialog(title, controlsGroup, messageText, menu, dialogYPos, dialogHeight, titleHeight, heightOfButtons, overallHeightOfContent) {
			var titleY = 0,
				controlsY = 0,
				messageY = 0,
				buttonY = 0,
				MESSAGE_GAP = 30,
				MESSAGE_ROW = 44,
				MESSAGE_BUTTON_GAP = 32,
				ITEM_PADDING = 10,
				equalGap = 0,
				controlsHeight = 0;

			if (controlsGroup) {
				controlsHeight = controlsGroup.getTrueHeight();
			}

			equalGap = (dialogHeight - overallHeightOfContent) / 2;

			if (!title.getText()) {
				if (heightOfButtons === 0) {
					messageY = dialogYPos + ((dialogHeight / 2) - (MESSAGE_ROW / 2));
				} else {
					controlsY = dialogYPos + equalGap + ITEM_PADDING;
					messageY = controlsGroup ? (controlsY + controlsHeight + titleHeight) : controlsY;
					buttonY = dialogYPos + dialogHeight - (equalGap + heightOfButtons);
				}
			} else {
				titleY = (dialogYPos + equalGap) - ITEM_PADDING;
				controlsY = titleY + titleHeight + MESSAGE_GAP + ITEM_PADDING;
				messageY = controlsY + controlsHeight + ITEM_PADDING;
				buttonY = dialogYPos + dialogHeight + MESSAGE_GAP - (equalGap + heightOfButtons + MESSAGE_BUTTON_GAP);
			}

			title.setY(titleY);
			if (controlsGroup) {
				controlsGroup.setY(controlsY);
			}
			messageText.setY(messageY);
			menu.setY(buttonY);
		}

		/**
		 * Hide a dialogue box
		 * @method hideDialogueWithId
		 * @param {Number} dialogue enumeration
		 */
		function hideDialogueWithId(dialogueEnum) {
			var textId = mapDialogueID(dialogueEnum);

			if (!textId) {
				return false;
			}

			return $N.apps.dialog.DialogManager.hideDialogWithId(textId);
		}


		/**
		 * Display a dialogue box
		 *
		 * *************************************************************************************************************************
		 * *** DO NOT USE THIS FUNCTION                                                                                          ***
		 * *** Use of this function usually implies memory leak problems                                                         ***
		 * *** Instead, use createAndShowDialogue which implements a dialogue cache and maintains references to dialogue objects ***
		 * *************************************************************************************************************************
		 *
		 * @method displayDialogue
		 * @param {Object} dialogueObject dialogue object
		 * @param {Number} dialogueEnum dialogue enumeration
		 * @param {Number} autoCloseParam Auto-close timeout in ms
		 * @param {Function} shownCallbackParam User-closed callback
		 * @param {Function} timedOutCallbackParam Timed-out callback
		 * @return {Number} Boolean success/fail
		 */
		function displayDialogue(dialogueObject, dialogueEnum, autoCloseParam, shownCallbackParam, timedOutCallbackParam) {
			var autoClose = autoCloseParam || 0,
				shownCallback = shownCallbackParam || null,
				timedOutCallback = timedOutCallbackParam || null,
				priority = mapDialoguePriority(dialogueEnum),
				errorCode = mapDialogueErrorCode(dialogueEnum),
				dialogueShowSuccess;

			if (errorCode) {
				dialogueObject._dialogGUIObject.setErrorCode($N.app.DialogueHelper.getString("errorCode") + errorCode);
			}

			dialogueShowSuccess = $N.apps.dialog.DialogManager.showDialog(dialogueObject,
				priority,
				autoClose,
				null, /* dialogueQueuedCallback */
				shownCallback,
				timedOutCallback);

			if (!dialogueShowSuccess) {
				$N.apps.dialog.DialogManager.hideDialogWithId(dialogueObject.id);
				dialogueShowSuccess = $N.apps.dialog.DialogManager.showDialog(dialogueObject,
					priority,
					autoClose,
					null, /* dialogueQueuedCallback */
					shownCallback,
					timedOutCallback);
			}

			return dialogueShowSuccess;
		}

		/**
		 * If language is changed, delete all pre-existing dialogues
		 * They will be recreated on demand with the new language
		 * @method deleteDialogues
		 */
		function deleteDialogues() {
			whpvrPlaybackErrorDialogue = null;
			whpvrRecordingErrorDialogue = null;
			generalDialogues = {};
			// TODO: https://jira.opentv.com/browse/NETUI-3697  clean up dialogues properly
			$N.app.MemoryUtil.collectGarbage();
		}

		/**
		 * @method hideEthernetDisconnectedDialogue
		 * @return {Number} Boolean a dialogue was hidden
		 */
		function hideEthernetDisconnectedDialogue() {
			log("hideEthernetDisconnectedDialogue", "Enter");
			var currentDialogue = $N.apps.dialog.DialogManager.getCurrentDialog();

			if (currentDialogue === null) {
				log("hideEthernetDisconnectedDialogue", "Exit 1, no dialogue displayed");
				return false;
			}

			if (mapDialogueID($N.app.constants.DLG_ETHERNET_DISCONNECTED) === currentDialogue.id) {
				$N.app.DialogueHelper.hideDialogueWithId($N.app.constants.DLG_ETHERNET_DISCONNECTED);
			}

			return true;
		}

		/**
		 * @method showEthernetDisconnectedDialogue
		 */
		function showEthernetDisconnectedDialogue() {
			createAndShowDialogue($N.app.constants.DLG_ETHERNET_DISCONNECTED,
				$N.app.ErrorMessage.getString("noEthernetConnectivity"),
				$N.app.ErrorMessage.getString("pleaseCheckConnection"),
				null, // default OK button
				null, // optionSelected Callback
				null, // optionHighlighted Callback
				null, // optionsOrientationParam
				null, // title Image
				null, // dialogObjectConfigParam
				true  // alertIconParam
				);
		}

		/**
		 * @method isDialogueCurrentlyShown
		 * @return {Boolean} a dialogue is currently shown
		 */
		function isDialogueCurrentlyShown() {
			return $N.apps.dialog.DialogManager.getCurrentDialog() ? true : false;
		}

		/**
		 * @method showNowDialog
		 * @param {String} title
		 * @param {String} message
		 * @param {Array} buttons
		 * @param {String} price
		 * @param {Function} exitCallbackIn
		 * @private
		 */
		function showNowDialog(title, message, buttons, price, errorCode, exitCallbackIn) {
			var dialogId = $N.app.constants.DLG_NOW_RESUME_OR_STARTOVER,
				exitCallback = function (button, key) {
					if (exitCallbackIn) {
						exitCallbackIn(button, key);
					}
					hideDialogueWithId(dialogId);
				},
				buttonPressedCallback = function (button) {
					if (button && button.simpleExit) {
						hideDialogueWithId(dialogId);
					} else {
						exitCallback();
					}
					if (button && button.action) {
						button.action();
					}
				},
				customiseParams = {
					title: title,
					options: buttons,
					priceText: price,
					message: message,
					errorCode: errorCode,
					exitCallback: exitCallback
				};

			createAndShowDialogue(
				dialogId,
				title,
			    message,
				null, // default OK button
				buttonPressedCallback, // optionSelected Callback
				null, // optionHighlighted Callback
				null, // optionsOrientationParam
				null, // title Image
				customiseParams, // dialogObjectConfigParam,
				false, // alertIconParam,
				$N.gui.NowConfirmationDialog // guiTemplate,
			);
		}

		function showSocialAccountAuthorisationDialog(title, message, buttonPressedCallback, titleImage, authCode, timerMessage, qrCode, exitCallback) {
			var buttons = [{
					name: $N.app.DialogueHelper.getString("cancel"),
					action: $N.app.constants.NO_OPTION
				}, {
					name: $N.app.DialogueHelper.getString("cont"),
					action: $N.app.constants.YES_OPTION
				}],
				selectedCallback = function (item) {
					$N.apps.dialog.DialogManager.hideDialog(reusableSocialAccountAuthDialogue);
					buttonPressedCallback(item);
				},
				customiseParams = {
					title: title,
					options: buttons,
					message: message,
					exitCallback: exitCallback,
					alertImageTextConfig: {text: authCode, visible: true},
					alertImageSubTextConfig: {text: timerMessage, visible: true},
					qrCode: qrCode
				},
				dialogue = null;

			dialogue = createAndShowDialogue(
				$N.app.constants.DLG_SOCIAL_ACCOUNT_AUTHORISED,
				title,
			    message,
				buttons, // default OK button
				buttonPressedCallback, // optionSelected Callback
				null, // optionHighlighted Callback
				null, // optionsOrientationParam
				titleImage, // title Image
				customiseParams, // dialogObjectConfigParam,
				true, // alertIconParam,
				$N.gui.SocialAccountAuthDialog // guiTemplate,
			);
			dialogue._dialogGUIObject.reconfigure();
		}

		/**
		 * @method displayExitAppDialog
		 * @param {Function} exitCallback
		 */
		function displayExitAppDialog(exitCallback) {
			log("displayExitAppDialog", "Enter");
			var YES_OPTION = 1,
				NO_OPTION = 2,
				buttonArray = [{
					name: $N.app.DialogueHelper.getString("yes"),
					action: YES_OPTION
				}, {
					name: $N.app.DialogueHelper.getString("no"),
					action: NO_OPTION
				}],
				title = $N.app.DialogueHelper.getString("attention"),
				message = $N.app.DialogueHelper.getString("confirmExitMessage"),
				dialogCallback = function (popupResult) {
					if (popupResult && (popupResult.action === YES_OPTION)) {
						exitCallback();
					}
				};

			createAndShowDialogue($N.app.constants.DLG_EXIT_APP,
				title,
				message,
				buttonArray,
				dialogCallback);

			log("displayExitAppDialog", "Exit");
		}

		// Public
		return {
			/**
			 * initialise the DialogueHelper
			 * @method initialise
			 */
			initialise: function () {
				log("initialise", "Enter");
				$N.apps.core.Language.adornWithGetString($N.app.DialogueHelper);
				$N.apps.core.Language.importLanguageBundleForObject($N.app.DialogueHelper,	// receivingObject
						null,			// loadedCallback
						"customise/resources/",	// language bundle path
						"LanguageBundle.js",	// language bundle file name
						deleteDialogues,	// updateCallback
						window);		// context
				log("initialise", "Exit");
			},

			calculateMenuHeight: calculateMenuHeight,
			layoutConfirmationDialog: layoutConfirmationDialog,
			configureBackPlateUsingContent: configureBackPlateUsingContent,
			displayDialogue: displayDialogue,
			hideUSBDialogues: hideUSBDialogues,
			hidePPVDialogue: hidePPVDialogue,
			hideCADialogues: hideCADialogues,
			hideDialogueWithId: hideDialogueWithId,
			showEthernetDisconnectedDialogue: showEthernetDisconnectedDialogue,
			hideEthernetDisconnectedDialogue: hideEthernetDisconnectedDialogue,
			showWHPVRPlaybackErrorDialogue: showWHPVRPlaybackErrorDialogue,
			showWHPVRRecordingErrorDialogue: showWHPVRRecordingErrorDialogue,
			createAndShowDialogue: createAndShowDialogue,
			createAndShowCADialogue: createAndShowCADialogue,
			updateDialogueTitleAndMessage: updateDialogueTitleAndMessage,
			updateDialogueOptions: updateDialogueOptions,
			mapDialogueID: mapDialogueID,
			getDialogue: getDialogue,
			deleteDialogue: deleteDialogue,
			mapDialogueErrorCode: mapDialogueErrorCode,
			isDialogueCurrentlyShown: isDialogueCurrentlyShown,
			showNowDialog: showNowDialog,
			showSocialAccountAuthorisationDialog: showSocialAccountAuthorisationDialog,
			displayExitAppDialog: displayExitAppDialog,
			setCaDialogExitCallback : function (callback) {
				caDialogExitCallback = callback;
			}
		};
	}());

}($N || {}));
