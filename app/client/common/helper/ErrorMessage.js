/**
 * This class handles shwoing and hiding dialogs displaying basic error
 * messages such as qos degraded
 * @class $N.app.ErrorMessage
 * @static
 * @author doldham
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.ErrorMessageType = {
		noSignal: "noSignal",
		wifiDisconnected: "wifiDisconnected",
		conditionalAccessError: "conditionalAccessError",
		reconnecting: "reconnecting",
		deviceLost: "deviceLost",
		usbMedia: "usbMedia",
		noVideo: "noVideo",
		renewalIp: "renewalIp",
		saveFavoritesError: "saveFavoritesError",
		savingFavorites: "savingFavorites",
		fetchingFavoritesError: "fetchingFavoritesError",
		saveBlockChannelsError: "saveBlockChannelsError",
		folderNameExists: "folderNameExists",
		noFolderName: "noFolderName",
		reminderDeleteError: "reminderDeleteError",
		purchasePinChangeSuccess: "purchasePinChangeSuccess",
		parentalPinChangeSuccess: "parentalPinChangeSuccess",
		pinMismatch: "pinMismatch",
		pinChangeFailure: "pinChangeFailure",
		authenticationFailure: "authenticationFailure",
		invalidDate: "invalidDate",
		invalidTime: "invalidTime",
		facebookPinChangeSuccess: "facebookPinChangeSuccess",
		facebookPinChangeFailure: "facebookPinChangeFailure",
		facebookPinMismatch: "facebookPinMismatch",
		facebookAccountAuthorised: "facebookAccountAuthorised",
		authFacebookAccountTitle: "authFacebookAccountTitle",
		authenticationSuccess: "authenticationSuccess",
		accountLinked: "accountLinked",
		postToWall: "postToWall",
		authorisationError: "authorisationError",
		usbWaitingDialog: "usbWaitingDialog",
		errorCode: "errorCode"
	};


	$N.app.ErrorMessage = (function () {

		var dialogShownCallback = function () {},
			DEFAULT_OPTION_SELECTED_CALLBACK = function () {
				$N.app.ErrorMessage.hideDialog();
			},
			optionSelectedCallback = DEFAULT_OPTION_SELECTED_CALLBACK,
			noSignalPopupTimer = null,
			noSignalId = $N.app.ErrorMessageType.noSignal,
			wifiDisconnectedId = $N.app.ErrorMessageType.wifiDisconnected,
			conditionalAccessErrorId = $N.app.ErrorMessageType.conditionalAccessError,
			reconnectingId = $N.app.ErrorMessageType.reconnecting,
			deviceLostId = $N.app.ErrorMessageType.deviceLost,
			usbMediaId = $N.app.ErrorMessageType.usbMedia,
			noVideoId = $N.app.ErrorMessageType.noVideo,
			ipRenewalId = $N.app.ErrorMessageType.renewalIp,
			saveFavoritesErrorId = $N.app.ErrorMessageType.saveFavoritesError,
			saveBlockChannelsErrorId = $N.app.ErrorMessageType.saveBlockChannelsError,
			savingFavoritesId = $N.app.ErrorMessageType.savingFavorites,
			fetchingFavoritesErrorId = $N.app.ErrorMessageType.fetchingFavoritesError,
			folderNameExistsId = $N.app.ErrorMessageType.folderNameExists,
			invalidDateId = $N.app.ErrorMessageType.invalidDate,
			invalidTimeId = $N.app.ErrorMessageType.invalidTime,
			noFolderNameId = $N.app.ErrorMessageType.noFolderName,
			reminderDeleteErrorId = $N.app.ErrorMessageType.reminderDeleteError,
			purchasePinChangeSuccessId = $N.app.ErrorMessageType.purchasePinChangeSuccess,
			parentalPinChangeSuccessId = $N.app.ErrorMessageType.parentalPinChangeSuccess,
			pinChangeFailureId = $N.app.ErrorMessageType.pinChangeFailure,
			pinMismatchId = $N.app.ErrorMessageType.pinMismatch,
			authenticationFailureId = $N.app.ErrorMessageType.authenticationFailure,
			facebookPinChangeSuccessId = $N.app.ErrorMessageType.facebookPinChangeSuccess,
			facebookPinChangeFailureId = $N.app.ErrorMessageType.facebookPinChangeFailure,
			facebookPinMismatchId = $N.app.ErrorMessageType.facebookPinMismatch,
			facebookAccountAuthorisedId = $N.app.ErrorMessageType.facebookAccountAuthorised,
			authFacebookAccountTitleId = $N.app.ErrorMessageType.authFacebookAccountTitle,
			authenticationSuccessId = $N.app.ErrorMessageType.authenticationSuccess,
			accountLinkedId = $N.app.ErrorMessageType.accountLinked,
			postToWallId = $N.app.ErrorMessageType.postToWall,
			usbWaitingDialogId = $N.app.ErrorMessageType.usbWaitingDialog,
			isErrorMessageShown = false,
			isBlockingUI = false,
			currentMessageId = null,
			EXIT = 2,  // to align with HotPlug.js
			errorMessageTitle = null,
			errorMessageSubTitle = null,
			showNoSignalDialogue = null;

		/**
		 * Called once an error message has been hidden
		 * @method errorMessageHidden
		 * @private
		 */
		function errorMessageHidden() {
			isErrorMessageShown = false;
			currentMessageId = null;
		}

		/**
		 * Displays the error message dialog using new dialogue enumeration
		 * @method showErrorDialogueByEnum
		 * @private
		 * @param {Number} enumeration
		 * @param {String} dialogue title
		 * @param {String} dialogue message
		 * @param {Object} image
		 */
		function showErrorDialogueByEnum(dialogueEnum, title, messageText, titleImage) {
			$N.app.DialogueHelper.createAndShowDialogue(dialogueEnum,
				title,
				messageText,
				null, // default OK button
				optionSelectedCallback,
				null, // optionHighlightedCallbackParam
				null, // optionsOrientationParam
				titleImage,
				null, // dialogObjectConfigParam
				true  // alertIconParam
				);

			isErrorMessageShown = true;
			errorMessageTitle = title;
			errorMessageSubTitle = messageText;
			currentMessageId = $N.app.DialogueHelper.mapDialogueID(dialogueEnum);
		}

		/**
		 * Displays the error message dialog
		 * @method showErrorMessageDialog
		 * @param {Number} id
		 * @param {String} title
		 * @param {String} messageText
		 * @param {Object} titleImage
		 * @param {Number} errorCode optional
		 * @private
		 */
		function showErrorMessageDialog(id, title, messageText, titleImage, errorCode) {
			if (!currentMessageId) {
				$N.app.DialogueHelper.createAndShowDialogue(
					id,
					title,
					messageText,
					null, //default options
					optionSelectedCallback,
					null, // no option highlighted callback
					null, // default orientation
					titleImage, // no title image
					null, // no dialog config object
					true  // show alert icon
				);
				isErrorMessageShown = true;
				errorMessageTitle = title;
				errorMessageSubTitle = messageText;
				currentMessageId = id;
			}
		}

		function getCurrentErrorMessageObject() {
			var errorMessageObj = {};
			errorMessageObj.title = errorMessageTitle;
			errorMessageObj.subtitle = errorMessageSubTitle;
			errorMessageObj.id = currentMessageId;
			return errorMessageObj;
		}

		/**
		 * Display an error message dialog (which is not user interactive)
		 * @method showInformationDialogue
		 * @param {Number} dialogueEnum
		 * @param {String} messageText
		 * @private
		 */
		function showInformationDialogue(dialogueEnum, messageText) {
			if (!currentMessageId) {
				isBlockingUI = true;

				$N.app.DialogueHelper.createAndShowDialogue(dialogueEnum,
					null,  // no title
					messageText,
					[],  // no buttons
					dialogShownCallback
					);

				isErrorMessageShown = true;
				currentMessageId = $N.app.DialogueHelper.mapDialogueID(dialogueEnum);
			}
		}

		/**
		 * Set the callback for when a option button is
		 * pressed in error message dialog
		 * @method setOptionSelectedCallback
		 * @param (function) callback
		 */
		function setOptionSelectedCallback(callback) {
			if (callback) {
				optionSelectedCallback = callback;
			} else {
				optionSelectedCallback = function () {};
			}
		}

		function hideErrorMessageDialogWithId(messageId) {
			if (currentMessageId === messageId) {
				$N.apps.dialog.DialogManager.hideDialogWithId(currentMessageId);
				errorMessageHidden();
				setOptionSelectedCallback(DEFAULT_OPTION_SELECTED_CALLBACK);
				return true;
			}
		}

		/**
		 * Shows the reconnecting dialog
		 * @method showReconnectingDialog
		 * @private
		 */
		function showReconnectingDialog() {
			showErrorDialogueByEnum($N.app.constants.DLG_RECONNECTING,
					$N.app.ErrorMessage.getString("playbackDisrupted"),
					$N.app.ErrorMessage.getString("attemptingReconnect"));
		}

		/**
		 * Shows the No Folder Name dialog
		 * @method showNoFolderNameDialog
		 * @private
		 */
		function showNoFolderNameDialog() {
			currentMessageId = null;
			var	title = $N.app.ErrorMessage.getString("errorTitle"),
				message = $N.app.ErrorMessage.getString("noFolderName");
			setOptionSelectedCallback(null);
			showErrorMessageDialog($N.app.constants.DLG_NO_FOLDER_NAME, title, message);
		}

		/**
		 * Shows the Reminder delete error dialog
		 * @method showReminderDeleteFailedDialog
		 * @private
		 */
		function showReminderDeleteFailedDialog() {
			currentMessageId = null;
			var	title = $N.app.ErrorMessage.getString("errorTitle"),
				message = $N.app.ErrorMessage.getString("couldnotDeleteReminder");
			setOptionSelectedCallback(null);
			showErrorMessageDialog(reminderDeleteErrorId, title, message);
		}

		/**
		 * Shows the successful pin change dialog
		 * @method showPinChangeSuccessDialog
		 * @private
		 */
		function showPinChangeSuccessDialog(pinType) {
			if (pinType === "master") {
				showErrorDialogueByEnum($N.app.constants.DLG_PARENTAL_PIN_CHANGE,
					$N.app.ErrorMessage.getString("parentalPinChangeSuccess"),
					null);
			} else if (pinType === "purchase") {
				showErrorDialogueByEnum($N.app.constants.DLG_PURCHASE_PIN_CHANGE,
					$N.app.ErrorMessage.getString("purchasePinChangeSuccess"),
					null);
			}
		}

		/**
		 * Hides the failure pin change dialog
		 * @method hidePinChangeFailureDialog
		 * @private
		 */
		function hidePinChangeFailureDialog() {
			if (currentMessageId === pinChangeFailureId) {
				$N.apps.dialog.DialogManager.hideDialogWithId(pinChangeFailureId);
				errorMessageHidden();
				setOptionSelectedCallback(DEFAULT_OPTION_SELECTED_CALLBACK);
			}
		}

		/**
		 * Shows the failure pin change dialog
		 * @method showPinChangeFailureDialog
		 * @private
		 */
		function showPinChangeFailureDialog() {
			var title = $N.app.ErrorMessage.getString("errorTitle"),
				message = $N.app.ErrorMessage.getString("pinChangeFailure");
			setOptionSelectedCallback(hidePinChangeFailureDialog);
			showErrorMessageDialog(pinChangeFailureId, title, message);
		}

		/**
		 * hides the successful facebook pin change dialog
		 * @method hideFacebookPinChangeSuccessDialog
		 * @private
		 */
		function hideFacebookPinMismatchDialog() {
			if (currentMessageId === facebookPinMismatchId) {
				$N.apps.dialog.DialogManager.hideDialogWithId(facebookPinMismatchId);
				errorMessageHidden();
				setOptionSelectedCallback(DEFAULT_OPTION_SELECTED_CALLBACK);
			}
		}

		/**
		 * Shows the successful facebook pin change dialog
		 * @method showFacebookPinChangeSuccessDialog
		 * @private
		 */
		function showFacebookPinMismatchDialog() {
			var	title = $N.app.ErrorMessage.getString("errorTitle") + " " + $N.app.ErrorMessage.getString("facebookPinMismatch"),
				message = $N.app.ErrorMessage.getString("facebookPinMismatchTip"),
				titleImage = "customise/resources/images/%RES/icons/fb_icon.png";
			setOptionSelectedCallback(hideFacebookPinMismatchDialog);
			showErrorMessageDialog(facebookPinMismatchId, title, message, titleImage);
		}

		/**
		 * Shows the successful facebook pin change dialog
		 * @method showFacebookPinChangeSuccessDialog
		 * @private
		 */
		function showFacebookAccountAuthorisedDialog() {
			var	title = $N.app.ErrorMessage.getString("authFacebookAccountTitle"),
				completeMessage = $N.app.StringUtil.join("", [$N.app.ErrorMessage.getString("authenticationSuccess"), "\n", "\n", $N.app.ErrorMessage.getString("accountLinked"), $N.app.ErrorMessage.getString("postToWall")]),
				titleImage = "customise/resources/images/%RES/icons/fb_icon.png";
			showErrorMessageDialog(facebookAccountAuthorisedId, title, completeMessage, titleImage);
		}

		/**
		 * Shows the Facebook error authorisation dialog
		 * @method showFacebookAccountAuthorisationErrorDialog
		 * @private
		 */
		function showFacebookAccountAuthorisationErrorDialog(statusCode) {
			var	title = $N.app.ErrorMessage.getString("authFacebookAccountTitle"),
				completeMessage = $N.app.StringUtil.join("", [$N.app.ErrorMessage.getString("authorisationError"), $N.app.ErrorMessage.getString("errorCode"), statusCode.toString()]),
				titleImage = "customise/resources/images/%RES/icons/fb_icon.png";
			showErrorMessageDialog(facebookAccountAuthorisedId, title, completeMessage, titleImage);
		}


		/**
		 * hides the successful facebook pin change dialog
		 * @method hideFacebookPinChangeSuccessDialog
		 * @private
		 */
		function hideFacebookPinChangeSuccessDialog() {
			if (currentMessageId === facebookPinChangeSuccessId) {
				$N.apps.dialog.DialogManager.hideDialogWithId(facebookPinChangeSuccessId);
				errorMessageHidden();
				setOptionSelectedCallback(DEFAULT_OPTION_SELECTED_CALLBACK);
			}
		}

		/**
		 * Shows the successful facebook pin change dialog
		 * @method showFacebookPinChangeSuccessDialog
		 * @private
		 */
		function showFacebookPinChangeSuccessDialog() {
			var	title = $N.app.ErrorMessage.getString("facebookPinChangeSuccess"),
				titleImage = "customise/resources/images/%RES/icons/fb_icon.png";
			setOptionSelectedCallback(hideFacebookPinChangeSuccessDialog);
			showErrorMessageDialog(facebookPinChangeSuccessId, title, null, titleImage);
		}

		/**
		 * Hides the failure facebook pin change dialog
		 * @method hideFacebookPinChangeFailureDialog
		 * @private
		 */
		function hideFacebookPinChangeFailureDialog() {
			if (currentMessageId === facebookPinChangeFailureId) {
				$N.apps.dialog.DialogManager.hideDialogWithId(facebookPinChangeFailureId);
				errorMessageHidden();
				setOptionSelectedCallback(DEFAULT_OPTION_SELECTED_CALLBACK);
			}
		}

		/**
		 * Shows the failure facebookpin change dialog
		 * @method showFacebookPinChangeFailureDialog
		 * @private
		 */
		function showFacebookPinChangeFailureDialog() {
			var title = $N.app.ErrorMessage.getString("errorTitle"),
				message = $N.app.ErrorMessage.getString("facebookPinChangeFailure");
			setOptionSelectedCallback(hideFacebookPinChangeFailureDialog);
			showErrorMessageDialog(facebookPinChangeFailureId, title, message);
		}

		/**
		 * Hides the authentication failure
		 * in pin entry dialog
		 * @method hideAuthenticationFailureDialog
		 * @private
		 */
		function hideAuthenticationFailureDialog() {
			if (currentMessageId === authenticationFailureId) {
				$N.apps.dialog.DialogManager.hideDialogWithId(authenticationFailureId);
				errorMessageHidden();
				setOptionSelectedCallback(DEFAULT_OPTION_SELECTED_CALLBACK);
			}
		}

		/**
		 * Shows the authentication failure
		 * in pin entry dialog
		 * @method showAuthenticationFailureDialog
		 * @private
		 */
		function showAuthenticationFailureDialog(optionSelectedCallback) {
			var title = $N.app.ErrorMessage.getString("errorTitle"),
				message = $N.app.ErrorMessage.getString("authenticationFailure");
			setOptionSelectedCallback(optionSelectedCallback || hideAuthenticationFailureDialog);
			showErrorMessageDialog(authenticationFailureId, title, message);
		}

		function hidePinMismatchDialog() {
			if (currentMessageId === pinMismatchId) {
				$N.apps.dialog.DialogManager.hideDialogWithId(pinMismatchId);
				errorMessageHidden();
				setOptionSelectedCallback(DEFAULT_OPTION_SELECTED_CALLBACK);
			}
		}

		/**
		 * Shows the pin mismatch dialog
		 * @method showPinMismatchDialog
		 * @private
		 */
		function showPinMismatchDialog(optionSelectedCallback) {
			// Callback function added to check if new pin entry pop up required to display in case of pin mismatch
			setOptionSelectedCallback(function () {
				hidePinMismatchDialog();
				if (optionSelectedCallback) {
					optionSelectedCallback();
				}
			});
			showErrorDialogueByEnum($N.app.constants.DLG_PIN_MISMATCH,
				$N.app.ErrorMessage.getString("errorTitle"),
				$N.app.ErrorMessage.getString("pinMisMatch"));
		}

		/**
		 * Shows the Duplicate Folder Exists dialog
		 * @method showDuplicateFolderNameDialog
		 * @private
		 */
		function showDuplicateFolderNameDialog() {
			currentMessageId = null;
			var	title = $N.app.ErrorMessage.getString("errorTitle"),
				message = $N.app.ErrorMessage.getString("folderNameExists");
			setOptionSelectedCallback(null);
			showErrorMessageDialog($N.app.constants.DLG_FOLDER_NAME_EXISTS, title, message);
		}

		/**
		 * Shows the Invalid Date dialog
		 * @method showInvalidDateDialog
		 * @private
		 */
		function showInvalidDateDialog(callback) {
			currentMessageId = null;
			setOptionSelectedCallback(callback);
			showErrorDialogueByEnum($N.app.constants.DLG_INVALID_DATE,
					$N.app.ErrorMessage.getString("errorTitle"),
					$N.app.ErrorMessage.getString("invalidDate"));
		}

		/**
		 * Shows the Invalid Time Error dialog
		 * @method showInvalidTimeDialog
		 * @private
		 */
		function showInvalidTimeDialog(callback) {
			currentMessageId = null;
			setOptionSelectedCallback(callback);
			showErrorDialogueByEnum($N.app.constants.DLG_INVALID_TIME,
					$N.app.ErrorMessage.getString("errorTitle"),
					$N.app.ErrorMessage.getString("invalidTime"));
		}

		/**
		 * Shows the IP renewal dialog
		 * @method showIpRenewalDialog
		 * @private
		 */
		function showIpRenewalDialog() {
			showInformationDialogue($N.app.constants.DLG_IP_RENEWAL, $N.app.ErrorMessage.getString("ipRenewalText"));
		}
		/**
		 * Shows the USB Waiting Dialog
		 * @method showUsbWaitingDialog
		 * @private
		 */
		function showUsbWaitingDialog() {
			showInformationDialogue($N.app.constants.DLG_USB_WAITING, $N.app.ErrorMessage.getString("USBWaitingText"));
		}
		/**
		 * Shows the Wifi disconnected dialog
		 * @method showWifiDisconnectedDialog
		 * @private
		 */
		function showWifiDisconnectedDialog() {
			if (currentMessageId === reconnectingId) {
				hideErrorMessageDialogWithId(reconnectingId);
			}

			showErrorDialogueByEnum($N.app.constants.DLG_WIFI_DISCONNECTED,
					$N.app.ErrorMessage.getString("noWifiConnectivity"),
					$N.app.ErrorMessage.getString("navigateNetworkMenu"));
		}

		/**
		 * Hides the Wifi disconnected dialog
		 * @method hideWifiDisconnectedDialog
		 * @private
		 */
		function hideWifiDisconnectedDialog() {
			if (currentMessageId === wifiDisconnectedId) {
				$N.apps.dialog.DialogManager.hideDialogWithId(wifiDisconnectedId);
				errorMessageHidden();
			}
		}

		/**
		 * Shows the device lost dialog
		 * @method showDeviceLostdDialog
		 * @private
		 */
		function showDeviceLostdDialog() {
			var title = $N.app.ErrorMessage.getString("currentDeviceLost"),
				message = $N.app.ErrorMessage.getString("checkServer");
			showErrorMessageDialog(deviceLostId, title, message);
		}

		/**
		 * Hides the device lost dialog
		 * @method hideDeviceLostdDialog
		 * @private
		 */
		function hideDeviceLostdDialog() {
			if (currentMessageId === deviceLostId) {
				$N.apps.dialog.DialogManager.hideDialogWithId(deviceLostId);
				errorMessageHidden();
			}
		}

		/**
		 * @method showSaveBlockChannelsErrorDialog
		 * @private
		 */
		function showSaveBlockChannelsErrorDialog() {
			hideErrorMessageDialogWithId(saveBlockChannelsErrorId);
			showErrorDialogueByEnum($N.app.constants.DLG_SAVE_BLOCKED_CHANNELS,
					$N.app.ErrorMessage.getString("errorTitle"),
					$N.app.ErrorMessage.getString("couldnotSaveBlockChannels"));
		}

		/**
		 * Shows the save favorites error dialog
		 * @method showSaveFavoritesErrorDialog
		 * @private
		 */
		function showSaveFavoritesErrorDialog() {
			showErrorDialogueByEnum($N.app.constants.DLG_SAVE_FAVOURITES_ERROR,
					$N.app.ErrorMessage.getString("errorTitle"),
					$N.app.ErrorMessage.getString("couldnotSaveFavorites"));
		}

		/**
		 * Shows the saving favorites info dialog
		 * @method showSavingFavoritesDialog
		 * @private
		 */
		function showSavingFavoritesDialog() {
			showInformationDialogue($N.app.constants.DLG_SAVING_FAVOURITES, $N.app.ErrorMessage.getString("savingPleaseWait"));
		}

		/**
		 * Hides the IP renewal dialog
		 * @method hideSavingFavoritesDialog
		 * @private
		 */
		function hideSavingFavoritesDialog() {
			if (currentMessageId === savingFavoritesId) {
				$N.apps.dialog.DialogManager.hideDialogWithId(savingFavoritesId);
				errorMessageHidden();
			}
		}

		/**
		 * Shows the fetch favorites error dialog
		 * @method showFavoritesFetchErrorDialog
		 * @private
		 */
		function showFavoritesFetchErrorDialog() {
			showErrorDialogueByEnum($N.app.constants.DLG_FETCHING_FAVORITES_ERROR,
					$N.app.ErrorMessage.getString("errorTitle"),
					$N.app.ErrorMessage.getString("favoriteListNotAvailable"));
		}


		function resetBlockingUI() {
			isBlockingUI = false;
		}

		function getAnyProgress() {
			return isBlockingUI;
		}

		/**
		 * Resets the noSignal pop up timer
		 * @method resetNoSignalPopupTimer
		 * @private
		 */
		function resetNoSignalPopupTimer() {
			if (noSignalPopupTimer) {
				clearTimeout(noSignalPopupTimer);
				noSignalPopupTimer = null;
			}
			noSignalPopupTimer = setTimeout(function () {
				if (currentMessageId === noSignalId) {
					hideErrorMessageDialogWithId(noSignalId);
				}

				if (!$N.app.fullScreenPlayer.isPlayerConnectFailed() && ($N.apps.core.ContextManager.getActiveContext().getId() === "ZAPPER")) {
					showNoSignalDialogue();
				} else { //The timeout to be reset if the current context is not Zapper.
					clearTimeout(noSignalPopupTimer);
					noSignalPopupTimer = null;
					resetNoSignalPopupTimer();
				}
			}, $N.app.constants.NO_TUNER_LOCK_CHANNEL_RETUNE_TIMEOUT);
		}

		/**
		 * Pop up to be shown when no signal Lock is found during a channel tune.
		 * @method showNoSignalDialogue
		 * @public
		 */
		showNoSignalDialogue = function () {
			if ($N.apps.core.ContextManager.getActiveContext().getId() === "ZAPPER") {
				$N.apps.core.ContextManager.getActiveController().showNoSignalDialogue();
			} else {
				resetNoSignalPopupTimer();
			}
			$N.app.fullScreenPlayer.tuner.hideVideo();
		};

		/**
		 * @method hideNoSignalDialogue
		 * @public
		 */
		function hideNoSignalDialogue() {
			$N.apps.util.EventManager.fire("HideNoSignalDialogue");// fires an event to zapper to hide no signal dialogue.
			if (noSignalPopupTimer) {
				clearTimeout(noSignalPopupTimer);
				noSignalPopupTimer = null;
			}
			hideErrorMessageDialogWithId(noSignalId);
			$N.app.fullScreenPlayer.tuner.showVideo();
		}

		/**
		 * @method showChannelUnsubscribedDialogue
		 * @private
		 */
		function showChannelUnsubscribedDialogue() {
			var	title = $N.app.ErrorMessage.getString($N.app.DialogueHelper.mapDialogueID($N.app.constants.DLG_CHANNEL_UNSUBSCRIBED) + "Title"),
				message = $N.app.ErrorMessage.getString($N.app.DialogueHelper.mapDialogueID($N.app.constants.DLG_CHANNEL_UNSUBSCRIBED) + "Message");
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_CHANNEL_UNSUBSCRIBED,
				title,
				message);
		}

		/* Public API */
		return {

			/**
			 * registers the listeners
			 * @method initialise
			 */
			initialise: function () {
				$N.apps.core.Language.adornWithGetString($N.app.ErrorMessage);
			},

			/**
			 * Registers the qos degraded listeners and sets the ethernet state change callbacks
			 * @method registerListeners
			 */
			registerListeners: function () {
				//QOS Degraded listeners
				//$N.app.fullScreenPlayer.tuner.registerQosDegradedListener(showNoSignalDialogue);   jrm
				//$N.app.fullScreenPlayer.tuner.registerQosImprovedListener(hideNoSignalDialogue);

				//// Ethernet cable listeners
				$N.app.NetworkUtil.registerEthernetStateChangeCallbacks();
			},

			showErrorDialog: function (messageType) {
				if (!currentMessageId) {
					switch (messageType) {
					case noSignalId:
						showNoSignalDialogue();
						break;
					case wifiDisconnectedId:
						showWifiDisconnectedDialog();
						break;
					case conditionalAccessErrorId:
						// Time out is needed to solve a bug whereby the zapper will not be hidden when
						// the dialog is displayed. Similar issue in ZapperView Bug #13720
						setTimeout(showChannelUnsubscribedDialogue, 1);
						break;
					case reconnectingId:
						showReconnectingDialog();
						break;
					case ipRenewalId:
						showIpRenewalDialog();
						break;
					case saveFavoritesErrorId:
						showSaveFavoritesErrorDialog();
						break;
					case savingFavoritesId:
						showSavingFavoritesDialog();
						break;
					case fetchingFavoritesErrorId:
						showFavoritesFetchErrorDialog();
						break;
					case saveBlockChannelsErrorId:
						showSaveBlockChannelsErrorDialog();
						break;
					case folderNameExistsId:
						showDuplicateFolderNameDialog();
						break;
					case invalidDateId:
						showInvalidDateDialog();
						break;
					case invalidTimeId:
						showInvalidTimeDialog();
						break;
					case noFolderNameId:
						showNoFolderNameDialog();
						break;
					case reminderDeleteErrorId:
						showReminderDeleteFailedDialog();
						break;
					case usbWaitingDialogId:
						showUsbWaitingDialog();
						break;
					}
				}
			},

			/**
			 * Hides the current dialog
			 * method hideDialog
			 */
			hideDialog: function () {
				var handled = false;
				if (currentMessageId) {
					handled = hideErrorMessageDialogWithId(currentMessageId);
					if (!handled) {
						switch (currentMessageId) {
						case noSignalId:
							hideNoSignalDialogue();
							break;
						case wifiDisconnectedId:
							hideWifiDisconnectedDialog();
							break;
						case deviceLostId:
							hideDeviceLostdDialog();
							break;
						case savingFavoritesId:
							hideSavingFavoritesDialog();
							break;
						}
					}
				}
			},

			setOptionSelectedCallback: setOptionSelectedCallback,

			/**
			 * Set the callback for when an error message dialog is displayed
			 * @method setDialogShownCallback
			 * @param (function) callback
			 */
			setDialogShownCallback: function (callback) {
				if (callback) {
					dialogShownCallback = callback;
				} else {
					dialogShownCallback = function () {};
				}
			},

			/**
			 * Default keyHandler that executes the ok  callback if the ok
			 * key is pressed. The class creating the dialog should pass the
			 * keys on to this function
			 * @method keyHandler
			 * @param {String} key string representation of the pressed key
			 * @return {Boolean} True if key was handled, false otherwise.
			 */
			keyHandler: function (key) {
				if (isBlockingUI) {
					return true;
				}
				return false;
			},

			/**
			 * Returns whether an error message dialogue is currently on the screen
			 * @method isErrorMessageDisplayed
			 * @return true if an error message dialogue is currently on the screen
			 * false otherwise
			 */
			isErrorMessageDisplayed: function () {
				return isErrorMessageShown;
			},
			showWifiDisconnectedDialog: showWifiDisconnectedDialog,
			hideWifiDisconnectedDialog: hideWifiDisconnectedDialog,
			showDeviceLostdDialog: showDeviceLostdDialog,
			showErrorMessageDialog: showErrorMessageDialog,
			getAnyProgress: getAnyProgress,
			resetBlockingUI: resetBlockingUI,
			showIpRenewalDialog: showIpRenewalDialog,
			showSaveFavoritesErrorDialog: showSaveFavoritesErrorDialog,
			showSavingFavoritesDialog: showSavingFavoritesDialog,
			hideSavingFavoritesDialog: hideSavingFavoritesDialog,
			showFavoritesFetchErrorDialog: showFavoritesFetchErrorDialog,
			showSaveBlockChannelsErrorDialog: showSaveBlockChannelsErrorDialog,
			showDuplicateFolderNameDialog: showDuplicateFolderNameDialog,
			showNoFolderNameDialog: showNoFolderNameDialog,
			showReminderDeleteFailedDialog: showReminderDeleteFailedDialog,
			showPinChangeSuccessDialog: showPinChangeSuccessDialog,
			showPinMismatchDialog: showPinMismatchDialog,
			hidePinMismatchDialog: hidePinMismatchDialog,
			showPinChangeFailureDialog: showPinChangeFailureDialog,
			hidePinChangeFailureDialog: hidePinChangeFailureDialog,
			showAuthenticationFailureDialog: showAuthenticationFailureDialog,
			hideAuthenticationFailureDialog: hideAuthenticationFailureDialog,
			showInvalidDateDialog: showInvalidDateDialog,
			showInvalidTimeDialog: showInvalidTimeDialog,
			hideFacebookPinChangeSuccessDialog: hideFacebookPinChangeSuccessDialog,
			showFacebookPinChangeSuccessDialog: showFacebookPinChangeSuccessDialog,
			hideFacebookPinChangeFailureDialog: hideFacebookPinChangeFailureDialog,
			showFacebookPinChangeFailureDialog: showFacebookPinChangeFailureDialog,
			hideFacebookPinMismatchDialog: hideFacebookPinMismatchDialog,
			showFacebookPinMismatchDialog: showFacebookPinMismatchDialog,
			hideErrorMessageDialogWithId: hideErrorMessageDialogWithId,
			showFacebookAccountAuthorisedDialog: showFacebookAccountAuthorisedDialog,
			showFacebookAccountAuthorisationErrorDialog: showFacebookAccountAuthorisationErrorDialog,
			getCurrentErrorMessageObject: getCurrentErrorMessageObject,
			showNoSignalDialogue: showNoSignalDialogue,
			hideNoSignalDialogue: hideNoSignalDialogue,
			showUsbWaitingDialog: showUsbWaitingDialog
		};
	}());

}($N || {}));