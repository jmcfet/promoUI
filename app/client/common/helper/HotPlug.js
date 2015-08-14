/**
 * Manages plugging-in and removing USB & eSATA storage devices
 * Due to a current lack of support in JSFW, CCOM events are listened to directly, responding to events such as
 * device attached, device removed, device associated, etc.
 * Pop-ups to the user are generated here, with a "usbStorageAvailable" event fired for various elements of
 * the UI (e.g. Portal Menu) to respond to.
 *
 * eventType(s)
 * mediaLibrary.PLUGGED: 1
 * mediaLibrary.UNPLUGGED: 2
 * mediaLibrary.SAFESHUTDOWNCOMPLETE: 3
 * mediaLibrary.MEDIUM_READY: 4
 * mediaLibrary.MEDIUM_REJECTED: 5
 * mediaLibrary.MEDIUM_WAITING_FOR_EVENT: 6
 *
 * @class $N.app.HotPlug
 * @author maniguru  (original)
 * @author Jayne Gilmour  (NET re-work)
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.platform.system.Preferences
 * @requires $N.app.constants
 * #depends ../Constants.js
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.HotPlug = (function () {

		var log = new $N.apps.core.Log("Helper", "HotPlug"),
			Preferences = $N.platform.system.Preferences,
			Constants = $N.app.constants,
			contextsLoadedSubscriptionId = null,
			contextsLoadedSubscriptionIdPlayback = null,
			pluggedMediumId,
			pluggedMediumBus,
			pluggedMediumFSCode,
			lastEvent = null,
			mediaLibrary,
			pleaseWaitDialogue = null,
			currentMediumId,
			currentAssociatedMediumId,
			_isFormatInProgress = false,
			_isUserInitiatedFormatting = false,
			formatSelectedCallback = function () {},
			formattingNoCallback = function () {},
			removeSelectedCallback = function () {},
			dialogShownCallback = function () {},
			dialogTimedOutCallback = function () {},
			getOptions = function () {},
			optionSelectedCallback = function () {},
			FORMAT = 1,
			EXIT = 2,
			CONTINUE = 3,
			FORMAT_EXIT = 4,
			CONTINUE_CANCEL = 5,
			JUST_OK = 6,
			USER_FORMAT_EXIT = 7,
			REBOOT = 8,
			MEDIA = 9,
			MEDIA_OR_FORMAT = 10,
			YES_NO = 11,
			YES = 12,
			NO = 13,
			connectedMediumArray = [],
			isUsbPlugged = false,
			formatOrBrowseDialog,
			plugInMode = {
				USBMEDIA: 1,
				DVR: 2
			},
			usbMediaObject = null,
			usbPartitionList = null,
			isInStandByMode = false,
			isDVRPurpose = false,
			_defaultUSBDeviceName = "NOFSLABEL"; //specifies- partition label is not set for the media device.

		/**
		 * Returns the options to display once the VOD expiring event is fired
		 * @method getOptions
		 * @private
		 * @return {Array} Array of options consisting of the name to display and the action they represent
		 */
		getOptions = function (optionType) {
			var optionObj = null;
			switch (optionType) {
			case FORMAT_EXIT:
				optionObj = [{
					name: $N.app.HotPlug.getString("cancel"),
					action: EXIT
				}, {
					name: $N.app.HotPlug.getString("format"),
					action: FORMAT
				}];
				break;
			case USER_FORMAT_EXIT:
				optionObj = [{
					name: $N.app.HotPlug.getString("no"),
					action: EXIT
				}, {
					name: $N.app.HotPlug.getString("yes"),
					action: FORMAT
				}];
				break;
			case YES_NO:
				optionObj = [{
					name: $N.app.HotPlug.getString("no"),
					action: NO
				}, {
					name: $N.app.HotPlug.getString("yes"),
					action: YES
				}];
				break;
			case CONTINUE_CANCEL:
				optionObj = [{
					name: $N.app.HotPlug.getString("cancel"),
					action: EXIT
				}, {
					name: $N.app.HotPlug.getString("cont"),
					action: CONTINUE
				}];
				break;
			case JUST_OK:
				optionObj = [{
					name: $N.app.HotPlug.getString("ok"),
					action: EXIT
				}];
				break;
			case REBOOT:
				optionObj = [{
					name: $N.app.HotPlug.getString("reboot"),
					action: REBOOT
				}];
				break;
			case MEDIA:
				optionObj = [{
					name: $N.app.HotPlug.getString("browseContentMessage"),
					action: "MEDIA"
				}];
				break;
			case MEDIA_OR_FORMAT:
				optionObj = [{
					name: $N.app.HotPlug.getString("browseContentMessage"),
					action: "MEDIA"
				}, {
					name: $N.app.HotPlug.getString("formatForDVRmessage"),
					action: "DVR"
				}];
				break;
			}
			return optionObj;
		};

		function showUsbDriveAttachedDialogue() {
			log("showUsbDriveAttachedDialogue", "Enter");
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_USB_DRIVE_ATTACHED,
				undefined,
				undefined,
				getOptions(FORMAT_EXIT),
				optionSelectedCallback);
			log("showUsbDriveAttachedDialogue", "Exit");
		}

		function showUSBAssociatedDialogue() {
			log("showUSBAssociatedDialogue", "Enter");
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_USB_STB_ASSOCIATED,
				$N.app.HotPlug.getString("usbRecordingPresentTitle"),
				$N.app.HotPlug.getString("usbRecordingPresentMessage"),
				getOptions(FORMAT_EXIT),
				optionSelectedCallback,
				dialogTimedOutCallback);
			log("showUSBAssociatedDialogue", "Exit");
		}

		/**
		 * @method getConnectedDriveCount
		 * @private
		 * @param {Number} mode - eNum (USBMEDIA: 1, DVR: 2)
		 * @return {Number} Number of connected drives
		 */
		function getConnectedDriveCount(mode) {
			log("getConnectedDriveCount", "Enter");
			var count = 0;
			if (mode) {
				connectedMediumArray.forEach(
					function (medium) {
						if (medium.mode === mode) {
							count += 1;
						}
					}
				);
				log("getConnectedDriveCount", "Exit 1, returning: " + count);
				return count;
			} else {
				log("getConnectedDriveCount", "Exit 2, returning: " + connectedMediumArray.length);
				return connectedMediumArray.length;
			}
		}

		function showUsbDialogue() {
			log("showUsbDialogue", "Enter");
			var connectedDVRDriveCount = getConnectedDriveCount(plugInMode.DVR);
			if (currentAssociatedMediumId && connectedDVRDriveCount) {
				$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_USB_STB_ALREADY_ASSOCIATED,
					undefined, // load default title string
					undefined, // load default message string
					getOptions(JUST_OK),
					optionSelectedCallback,
					null, // optionHighlightedCallbackParam
					null, // optionsOrientationParam
					null, // titleImageParam
					null, // dialogObjectConfigParam
					true  // alertIconParam
					);
				log("showUsbDialogue", "Exit 1");
				return;
			}

			if (pluggedMediumFSCode) {
				showUSBAssociatedDialogue();
			} else {
				showUsbDriveAttachedDialogue();
			}
			log("showUsbDialogue", "Exit 2");
		}

		/**
		 * @method formatSelectedCallback
		 * display formatting under progress pop-up.
		 * initiates formatting by calling associateMedium.
		 */
		formatSelectedCallback = function () {
			log("formatSelectedCallback", "Enter");
			var DELETE_ENTRIES = 1;
			_isUserInitiatedFormatting = true;

			pluggedMediumId = $N.app.PVRCapability.getCurrentMediaId() || currentMediumId || -1;

			log("formatSelectedCallback", "Call to associateMedium with pluggedMediumId: " + pluggedMediumId);
			mediaLibrary.associateMedium(String(pluggedMediumId), DELETE_ENTRIES);

			if (pleaseWaitDialogue === null) {
				pleaseWaitDialogue = new $N.apps.dialog.ConfirmationDialogue(
					"formatSelectedCallback",
					$N.app.HotPlug.getString("diskDrivePleaseWait"),
					$N.app.HotPlug.getString("diskDriveFormattingMessage"),
					null,
					null,
					null,
					null,
					null,
					"customise/resources/images/net/loading.png"
				);
			}
			$N.apps.dialog.DialogManager.showPersistentDialog(pleaseWaitDialogue);
			log("formatSelectedCallback", "Exit");
		};

		/**
		 * Fires the event to remove the selected drive safely
		 * @method removeSelectedCallback
		 */
		removeSelectedCallback = function () {
			log("removeSelectedCallback", "Enter");
			if (!pluggedMediumId) {
				pluggedMediumId = $N.app.PVRCapability.getCurrentMediaId() || -1;
			}
			if (pluggedMediumId && pluggedMediumId !== -1) {
				log("removeSelectedCallback", "removeMedium called with mediumId:" + pluggedMediumId);
				mediaLibrary.removeMedium(String(pluggedMediumId));
			}
			log("removeSelectedCallback", "Exit");
		};

		/**
		 * @method setUpDiskDriveFormatting
		 * Display disk drive formatting confirmation pop-up with 'yes' and 'no' option.
		 * callback functions will be called for the chosen yes/no options.
		 */
		function setUpDiskDriveFormatting() {
			log("setUpDiskDriveFormatting", "Enter");
			var	dialogCallback = function (key) {
					var yesKey = ((key && key.action === FORMAT) || (key.key && key.key.action === FORMAT));
					if (yesKey) {
						formatSelectedCallback(key);
					}
				};
			$N.app.DialogueHelper.createAndShowDialogue(
				$N.app.constants.DLG_UNPLUG_HARDDISK,
				$N.app.HotPlug.getString("diskDriveFormattingConfirmationTitle"),
				$N.app.HotPlug.getString("diskDriveFormattingConfirmationMessage"),
				getOptions(USER_FORMAT_EXIT),
				dialogCallback
			);
			log("setUpDiskDriveFormatting", "Exit");
		}

		/**
		 * @method setUpRemoveDiskDrive
		 */
		function setUpRemoveDiskDrive() {
			log("setUpRemoveDiskDrive", "Enter");
			var	dialogCallback;
			if ($N.app.PVRUtil.areRecordingsInProgress()) {
				$N.app.DialogueHelper.createAndShowDialogue(
					$N.app.constants.DLG_SAFE_REMOVE_HARDDISK_RECORDING_IN_PROGRESS,
					$N.app.HotPlug.getString("mediaRemoveDiskTitle"),
					$N.app.HotPlug.getString("mediaRemoveDiskRecordingInProgressDesc")
				);
			} else {
				dialogCallback = function (key) {
					var yesKey = ((key && key.action === YES) || (key.key && key.key.action === YES));
					if (yesKey) {
						removeSelectedCallback(key);
					}
				};
				$N.app.DialogueHelper.createAndShowDialogue(
					$N.app.constants.DLG_SAFE_REMOVE_HARDDISK,
					$N.app.HotPlug.getString("mediaRemoveDiskTitle"),
					$N.app.HotPlug.getString("mediaRemoveDiskDesc"),
					getOptions(YES_NO),
					dialogCallback
				);
			}
			log("setUpRemoveDiskDrive", "Exit");
		}

		/**
		 * The callback to run once an option has been selected
		 * @method optionSelectedCallback
		 * @private
		 * @param {Object} item The selected item
		 */
		optionSelectedCallback = function (item) {
			log("optionSelectedCallback", "Enter");
			if (item && item.action) {
				switch (item.action) {
				case FORMAT:
					_isFormatInProgress = true;
					_isUserInitiatedFormatting = false;
					$N.app.DialogueHelper.hideUSBDialogues();
					formatSelectedCallback();
					break;
				case CONTINUE:
					if (pluggedMediumFSCode) {
						showUSBAssociatedDialogue();
					} else {
						showUsbDriveAttachedDialogue();
					}
					break;
				case EXIT:
					//do nothing
					break;
				}
			}
			log("optionSelectedCallback", "Exit");
		};

		/**
		 * method that updates the connectedMediumArray based on the devices connected.
		 * @method updateConnectedMediumArray
		 * @private
		 * @param {String} mediumId - Connected medium id
		 * @param {Number} mode - eNum (USBMEDIA: 1, DVR: 2)
		 */
		function updateConnectedMediumArray(mediumId, mode) {
			log("updateConnectedMediumArray", "Enter");
			var i,
				connectedMediumArrayLength = connectedMediumArray.length;
			for (i = 0; i < connectedMediumArrayLength; i++) {
				if (connectedMediumArray[i].mediumId === mediumId) {
					log("updateConnectedMediumArray", "Exit 1, aleady exists");
					return;
				}
			}
			connectedMediumArray.push({'mediumId' : mediumId, 'mode' : mode});
			log("updateConnectedMediumArray", "Exit 2, medium added to array");
		}

		function enablePVR() {
			log("enablePVR", "Enter");
			// If last event was MEDIUM_READY then set state to ENABLED, else CONNECTED
			var capability = (lastEvent && lastEvent === mediaLibrary.MEDIUM_READY) ? Constants.PVR_CAPABILITY.ENABLED : Constants.PVR_CAPABILITY.CONNECTED;
			//creates an entry in the connected medium array if the medium id is not previously entered.
			updateConnectedMediumArray(currentMediumId, plugInMode.DVR);
			$N.app.PVRCapability.setPVRCapabilityState(capability, currentMediumId);
			log("enablePVR", "Exit");
		}

		function disablePVR() {
			log("disablePVR", "Enter");
			currentMediumId = null;
			usbMediaObject = null;
			usbPartitionList = null;
			$N.app.PVRCapability.setPVRCapabilityState(Constants.PVR_CAPABILITY.DISCONNECTED);
			log("disablePVR", "Exit");
		}

		function mediumFailedListener() {
			log("mediumFailedListener", "Enter");
			//hide the formatting under progress pop-up and show formatting failed pop-up.
			$N.apps.dialog.DialogManager.hideDialog(pleaseWaitDialogue);
			$N.app.DialogueHelper.hideUSBDialogues();
			$N.app.DialogueHelper.hideDialogueWithId($N.app.constants.DLG_USB_FORMAT_COMPLETE);
			$N.app.DialogueHelper.hideDialogueWithId($N.app.constants.DLG_ATA_FORMAT_COMPLETE);
			$N.app.DialogueHelper.createAndShowDialogue(
				$N.app.constants.DLG_USB_FORMAT_ERROR,
				$N.app.HotPlug.getString("usbFormatErrorTitle"),
				$N.app.HotPlug.getString("usbFormatErrorMessage")
			);
			_isFormatInProgress = false;
			disablePVR();
			log("mediumFailedListener", "Exit");
		}

		/**
		 * @method isUSB
		 * @param {Number} busType eNum
		 * @return {Boolean} isUSB, true if the media attached is of USB type, otherwise false
		 * @private
		 */
		function isUSB(busType) {
			return busType === mediaLibrary.BUS_TYPE_USB;
		}

		/**
		 * @method rebootSTB
		 * @private
		 */
		function rebootSTB() {
			log("rebootSTB", "Enter");
			var FORCE_REBOOT = true, // A false value here and therefore a safe reboot was just switching to standby in MW 7.1
				rebootStatus = null;
			$N.app.DialogueHelper.hideUSBDialogues();
			rebootStatus = $N.common.helper.PowerManager.reboot(FORCE_REBOOT);
			log("rebootSTB", "rebootStatus: " + rebootStatus);
			if (rebootStatus && rebootStatus.error && rebootStatus.error.name) {
				log("rebootSTB", "rebootStatus.error.name: " + rebootStatus.error.name);
			}
			log("rebootSTB", "Exit");
		}

		function associateMediumOKListener(e) {
			log("associateMediumOKListener", "Enter");
			log("associateMediumOKListener", JSON.stringify(e));
			var isUSBFormatted = pluggedMediumBus && isUSB(pluggedMediumBus);
			_isFormatInProgress = false;
			$N.apps.dialog.DialogManager.hideDialogWithId("formatSelectedCallback");
			$N.app.DialogueHelper.hideUSBDialogues();
			// FIXME: The dialogs below should probably not be firing yet
			// ...we need a MEDIUM_READY eventType to fire before the HDD is ready and mounted
			if (isUSBFormatted) {
				log("associateMediumOKListener", "USB is Formatted");
				$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_USB_FORMAT_COMPLETE,
						$N.app.HotPlug.getString("usbFormatCompleteTitle"),
						$N.app.HotPlug.getString("usbFormatCompleteMessage"));
				enablePVR();
			} else {
				log("associateMediumOKListener", "ATA is Formatted");
				$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_ATA_FORMAT_COMPLETE,
						$N.app.HotPlug.getString("ataFormatCompleteTitle"),
						$N.app.HotPlug.getString("ataFormatCompleteMessage"),
						getOptions(REBOOT),
						rebootSTB);
			}
			log("associateMediumOKListener", "Exit");
		}

		function associateMediumFailedListener(e) {
			log("associateMediumFailedListener", "Enter");
			log("associateMediumFailedListener", JSON.stringify(e));
			setTimeout(mediumFailedListener, 955);
		}

		/**
		 * @method getAssociatedMediaIdOKListener
		 * @param {Object} e (contains in e.mediaId - an array of one or more mediumIds)
		 * @private
		 */
		function getAssociatedMediaIdOKListener(e) {
			log("getAssociatedMediaIdOKListener", "Enter");
			log("getAssociatedMediaIdOKListener", JSON.stringify(e));
			currentAssociatedMediumId = e.mediaId;
			showUsbDialogue();
			log("getAssociatedMediaIdOKListener", "Exit");
		}

		function getAssociatedMediaIdFailedListener(e) {
			log("getAssociatedMediaIdFailedListener", "Enter");
			currentAssociatedMediumId = null;
			showUsbDialogue();
			log("getAssociatedMediaIdFailedListener", "Exit");
		}

		function checkForSFSPartition(partitionList) {
			log("checkForSFSPartition", "Enter");
			var i;
			for (i = 0; i < partitionList.length; i++) {
				if (partitionList[i].fileSysCode === mediaLibrary.SFS) {
					log("checkForSFSPartition", "Exit, returning true");
					return true;
				}
			}
			log("checkForSFSPartition", "Exit, returning false");
			return false;
		}

		/**
		 * This method will show the Storage device removed pop up and will disable the PVR.
		 * @method showPopUpandDisablePVR
		 * @private
		 */
		function showPopUpandDisablePVR() {
			$N.app.DialogueHelper.hideUSBDialogues();
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_USB_MEDIA_UNPLUGGED,
						$N.app.DialogueHelper.getString("usbMediaUnpluggedTitle"),
						$N.app.DialogueHelper.getString("usbMediaUnpluggedMessage"));
			disablePVR();
		}

		/**
		 * This method will show the Storage device incompatible pop up.
		 * @method showIncompatiblePopUp
		 * @private
		 */
		function showIncompatiblePopUp() {
			$N.app.DialogueHelper.hideUSBDialogues();
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_USB_INCOMPATIBLE,
				$N.app.HotPlug.getString("usbIncompatibleTitle"),
				$N.app.HotPlug.getString("usbIncompatibleMsg"));
		}

		/**
		 * This method will show the Storage device incompatible pop up and will disable the PVR.
		 * @method showIncompatiblePopUpandDisablePVR
		 * @private
		 */
		function showIncompatiblePopUpandDisablePVR() {
			showIncompatiblePopUp();
			disablePVR();
		}

		/**
		 * This method will show the Storage media detected pop up and will enable the PVR.
		 * @method showATADetectedPopUpandEnablePVR
		 * @private
		 */
		function showATADetectedPopUpandEnablePVR() {
			$N.app.DialogueHelper.hideUSBDialogues();
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_USB_MEDIA_DETECTED,
				$N.app.HotPlug.getString("ataMediaDetectedTitle"),
				$N.app.HotPlug.getString("ataMediaDetectedMessage"));
			enablePVR();
		}

		/**
		 * This method will show the Storage media detected pop up and will enable the PVR.
		 * @method showUSBDetectedPopUpandEnablePVR
		 * @private
		 */
		function showUSBDetectedPopUpandEnablePVR() {
			$N.app.DialogueHelper.hideUSBDialogues();
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_USB_MEDIA_DETECTED,
				$N.app.HotPlug.getString("usbMediaDetectedTitle"),
				$N.app.HotPlug.getString("usbMediaDetectedMessage"));
			enablePVR();
		}

		/**
		 * @method isATA
		 * @param {Number} busType eNum
		 * @return {Boolean} isATA, true if the media attached is of ATA type, otherwise false
		 * @private
		 */
		function isATA(busType) {
			return busType === mediaLibrary.BUS_TYPE_ATA;
		}

		/**
		 * events that occur when a USB media is removed (Unplugged/Safe Remove)
		 * @method setUSBRemoved
		 * @private
		 */
		function resetWhenUSBRemoved() {
			$N.apps.dialog.DialogManager.hideDialog(formatOrBrowseDialog);
			$N.app.UsbBrowserHelper.setMediaPlaybackStatus(false);
			$N.app.UsbBrowserHelper.resetFileSystem();
		}

		/**
		 * @method handleMedia
		 * @private
		 * @param {Object} e
		 */
		function handleMedia(e) {
			log("handleMedia", "Enter");
			pluggedMediumId = e.medium.mediumID;
			pluggedMediumBus = e.medium.busType;
			pluggedMediumFSCode = checkForSFSPartition(e.medium.partitionList);
			log("handleMedia", "Exit");
		}

		/**
		 * @method handleUnassociatedMedia
		 * @private
		 * @param {Object} e
		 */
		function handleUnassociatedMedia(e) {
			log("handleUnassociatedMedia", "Enter");
			handleMedia(e);
			mediaLibrary.getAssociatedMediaId();
			log("handleUnassociatedMedia", "Exit");
		}
		/**
		 * @method handleSafeShutDown
		 * @private
		 * @param {Number} mediumID
		 */
		function handleSafeShutDown(mediumID) {
			log("handleSafeShutDown", "Enter");
			var i = 0;
			$N.app.DialogueHelper.hideUSBDialogues();
			if (connectedMediumArray.length > 0) {
				for (i = 0; i < connectedMediumArray.length; i++) {
					//checking the plugged out medium ID and also the purpose it is used for.
					//If medium ID matches and if mode is USB Media then the SAFESHUTDOWNCOMPLETE event will get executed.
					if (connectedMediumArray[i].mediumId === mediumID && connectedMediumArray[i].mode === plugInMode.USBMEDIA) {
						connectedMediumArray.splice(i, 1);
						resetWhenUSBRemoved();
						$N.apps.util.EventManager.fire("usbMediaPlaybackDisabled", true);
						//Notification message - the device can be removed.
						$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_MEDIA_DEVICE_SAFE_REMOVE);
						break;
					} else if (connectedMediumArray[i].mediumId === mediumID && connectedMediumArray[i].mode === plugInMode.DVR) {
						$N.app.DialogueHelper.hideUSBDialogues();
						connectedMediumArray.splice(i, 1);
						$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_SAFE_REMOVE_HARDDISK_OK,
									$N.app.DialogueHelper.getString("mediaDisabledTitleOk"),
									$N.app.DialogueHelper.getString("mediaDisabledMessageOk"));
						disablePVR();
						break;
					}
				}
			}
			log("handleSafeShutDown", "Exit");
		}
		/**
		 * Handles format/Record if USB is inserted * OR REMOVED *
		 * @method formatRecordForUsb
		 */
		function formatRecordForUsb(e) {
			log("formatRecordForUsb", "Enter");
			var i,
				connectedMediumArrayLength = connectedMediumArray.length;
			if (!$N.app.PVRCapability.isOperatorPVREnabled()) {
				log("formatRecordForUsb", "Operator PVR Disabled");
				if (e.eventType === mediaLibrary.PLUGGED) {
					log("formatRecordForUsb", "PLUGGED");
					$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_DVR_OPERATOR_DISABLED,
						$N.app.HotPlug.getString("dvrOperatorDisabledTitle"),
						$N.app.HotPlug.getString("dvrOperatorDisabledMessage"),
						getOptions(JUST_OK),
						null);
				}
				disablePVR();
				return false;
			}
			if ($N.app.EnvironmentUtil.isSTBEnvironmentIP() || $N.app.Config.getConfigValue("pvr.enabled") !== "true") {
				return true;
			}
			if (e.eventType === mediaLibrary.MEDIUM_READY) {
				log("formatRecordForUsb", "MEDIUM_READY");
				if (e.medium.whiteListStatus === mediaLibrary.NOT_IN_LIST) {
					log("formatRecordForUsb", "NOT_IN_LIST");
					showIncompatiblePopUpandDisablePVR();
					return;
				}
				if (e.associated) {
					log("formatRecordForUsb", "e.associated");
					handleMedia(e);
					switch (e.stbMode) {
					case mediaLibrary.PVR:
					case mediaLibrary.ZAPPER1:
						log("formatRecordForUsb", "PVR OR ZAPPER1");
						if (isUSB(e.medium.busType)) {
							showUSBDetectedPopUpandEnablePVR();
						} else if (isATA(e.medium.busType)) {
							showATADetectedPopUpandEnablePVR();
						}
						break;
					default:
					}
				} else {
					log("formatRecordForUsb", "not e.associated");
					handleUnassociatedMedia(e);
				}
			} else if (mediaLibrary.UNPLUGGED === e.eventType) {
				log("formatRecordForUsb", "UNPLUGGED");
				$N.app.DialogueHelper.hideUSBDialogues();
				if (connectedMediumArray.length > 0) {
					for (i = 0; i < connectedMediumArray.length; i++) {
						//checking the plugged out medium ID and also the purpose it is used for.
						//If medium ID matches and if mode is USB Media then the unplug event will get executed.
						if (connectedMediumArray[i].mediumId === e.medium.mediumID && connectedMediumArray[i].mode === plugInMode.USBMEDIA) {
							log("formatRecordForUsb", "UNPLUGGED USBMEDIA device");
							connectedMediumArray.splice(i, 1);
							resetWhenUSBRemoved();
							$N.apps.util.EventManager.fire("usbMediaPlaybackDisabled", false);
							$N.app.DialogueHelper.hideUSBDialogues();
							$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_MEDIA_DEVICE_UNPLUGGED);
							break;
						} else if (connectedMediumArray[i].mediumId === e.medium.mediumID && connectedMediumArray[i].mode === plugInMode.DVR) {
							log("formatRecordForUsb", "UNPLUGGED DVR device");
							connectedMediumArray.splice(i, 1);
							showPopUpandDisablePVR();
							break;
						}
					}
				}
			} else if (mediaLibrary.SAFESHUTDOWNCOMPLETE === e.eventType) {
				log("formatRecordForUsb", "SAFESHUTDOWNCOMPLETE");
				handleSafeShutDown(e.medium.mediumID);
			}
			log("formatRecordForUsb", "Exit");
		}

		/**
		 * The callback to run once an option has been selected (such as Format)
		 * @method contentSelectedCallback
		 * @private
		 * @param {Object} item The selected item
		 */
		function contentSelectedCallback(item) {
			log("contentSelectedCallback", "Enter");
			var activationObject = {
					mode: "UsbMediaPlayback",
					helper: $N.app.UsbBrowserHelper
				},
				usbDeviceName = "";

			if (item && item.action) {
				switch (item.action) {
				case "MEDIA":
					log("contentSelectedCallback", "MEDIA");
					updateConnectedMediumArray(usbMediaObject.medium.mediumID, plugInMode.USBMEDIA);
					isUsbPlugged = true;
					$N.app.UsbBrowserHelper.setMediaPlaybackStatus(true, usbMediaObject.medium.mediumID);
					$N.app.UsbBrowserHelper.setPartitionList(usbPartitionList);
					//fileSysLabel determines the device Name. If not specified, the vendor name will be displayed.
					if (usbPartitionList && usbPartitionList[0].fileSysLabel !== _defaultUSBDeviceName) {
						usbDeviceName = usbPartitionList[0].fileSysLabel;
					}
					$N.app.UsbBrowserHelper.setMediumName(usbDeviceName);
					mediaLibrary.loadMedium(usbMediaObject.medium.mediumID, true, true);
					//Enabling the USB menu in Portal and also launching the media browser context.
					$N.app.UsbBrowserHelper.setMediaContentLoading(true);
					$N.apps.util.EventManager.fire("usbMediaPlaybackEnabled", true);
					$N.app.ContextHelper.openContext("MEDIABROWSER", {activationContext: activationObject});
					break;
				case "DVR":
					log("contentSelectedCallback", "DVR");
					$N.app.UsbBrowserHelper.setMediaPlaybackStatus(false);
					$N.apps.util.EventManager.fire("usbMediaPlaybackDisabled", false);
					pluggedMediumBus = usbMediaObject.medium.busType;
					formatSelectedCallback();
					break;
				}
			}
			log("contentSelectedCallback", "Exit");
		}

		/**
		 * This method will show the Storage device detected pop up
		 * @method showDetectedDevicePopUp
		 * @private
		 */
		function showDetectedDevicePopUp() {
			log("showDetectedDevicePopUp", "Enter");
			// Only add DVR option if we do not have a connected DVR device
			var options = getConnectedDriveCount(plugInMode.DVR) === 0 ? getOptions(MEDIA_OR_FORMAT) : getOptions(MEDIA);
			$N.app.DialogueHelper.hideUSBDialogues();
			formatOrBrowseDialog = $N.app.DialogueHelper.createAndShowDialogue(
				Constants.DLG_USB_DEVICE_DETECTED,
				undefined, // automatic title
				undefined, // automatic message
				options,
				contentSelectedCallback,
				null, // button focus callback
				"VERTICAL",
				null,
				null,
				null,
				undefined, // this must not be 'null'
				null,
				function (data) {//timedoutCallback
					contentSelectedCallback({action: "MEDIA"});
				}
			);
			$N.app.DialogueHelper.updateDialogueOptions(Constants.DLG_USB_DEVICE_DETECTED, options);
			log("showDetectedDevicePopUp", "Exit");
		}

		/**
		 * @method isFat32LikeFileSystem
		 * @param {String} fileSysCode
		 * @return {Boolean} isFat32LikeFileSystem
		 * @private
		 */
		function isFat32LikeFileSystem(fileSysCode) {
			log("isFat32LikeFileSystem", "Enter with fileSysCode: " + fileSysCode);
			var isLikeFat32 = (fileSysCode === mediaLibrary.FAT16_OVER_32M || fileSysCode === mediaLibrary.FAT32X || fileSysCode === mediaLibrary.FAT16_UPTO_32M || fileSysCode === mediaLibrary.FAT32);
			log("isFat32LikeFileSystem", "Exit, returning: " + isLikeFat32);
			return isLikeFat32;
		}

		/**
		 * @method getConnectedMediumMode
		 * @param {String} Plugged MediumID
		 * @return {integer} Plugged in Mode (USBMEDIA: 1, DVR: 2) OR NOT_IN_ARRAY: -1
		 * @private
		 */
		function getConnectedMediumMode(mediumID) {
			log("getConnectedMediumMode", "Enter with mediumID: " + mediumID);
			var NOT_IN_ARRAY = -1,
				i,
				connectedMediumArrayLength = connectedMediumArray.length;
			for (i = 0; i < connectedMediumArrayLength; i++) {
				if (connectedMediumArray[i].mediumId === mediumID) {
					log("getConnectedMediumMode", "Exit 1, returning mode: " + connectedMediumArray[i].mode);
					return connectedMediumArray[i].mode;
				}
			}
			log("getConnectedMediumMode", "Exit 2, returning NOT_IN_ARRAY (-1)");
			return NOT_IN_ARRAY;
		}

		/**
		 * @method handleRejectedReason
		 * @param {Object} e
		 * @private
		 */
		function handleRejectedReason(e) {
			log("handleRejectedReason", "Enter");
			log("handleRejectedReason", "e.reason: " + e.reason);
			switch (e.reason) {
			case mediaLibrary.NOT_HOME_DOMAIN:
				log("handleRejectedReason", "NOT_HOME_DOMAIN");
				handleUnassociatedMedia(e);
				showUSBAssociatedDialogue();
				break;
			case mediaLibrary.PARTITIONS_NOT_RECOGNIZED:
				log("handleRejectedReason", "PARTITIONS_NOT_RECOGNIZED");
				handleUnassociatedMedia(e);
				break;
			case mediaLibrary.TOO_MANY_DRIVES:
				log("handleRejectedReason", "TOO_MANY_DRIVES");
				handleUnassociatedMedia(e);
				break;
			default:
				log("handleRejectedReason", "default (uncaught e.reason)");
				// TODO: Add support for more MW e.reason codes here
				showIncompatiblePopUp();
				break;
			}
			log("handleRejectedReason", "Exit");
		}

		/**
		 * When a media object is handled (associate or disassociate)
		 * @method mediaHandledListener
		 * @param {Object} e
		 */
		function mediaHandledListener(e) {
			log("mediaHandledListener", "Enter");
			log("mediaHandledListener", JSON.stringify(e));
			if (e && e.actionType === mediaLibrary.ASSOCIATE) {
				if (e.status === 1) { // failed
					log("mediaHandledListener", "formatFailed");
					mediumFailedListener();
				}
			}
			log("mediaHandledListener", "Exit");
		}

		/**
		 * @method handleMediumReady
		 * @param {Object} e
		 */
		function handleMediumReady(e) {
			log("handleMediumReady", "Enter");
			var usbDevices = [],
				partitionList = [],
				i,
				j,
				k,
				connectedMediumArrayLength = connectedMediumArray.length,
				partitionListLength = e.medium.partitionList.length;

			for (i = 0; i < partitionListLength; i++) {
				if ($N.app.FeatureManager.getMediaPlaybackFeatureStatus() && (isFat32LikeFileSystem(e.medium.partitionList[i].fileSysCode))) {
					usbDevices.push(e.medium.partitionList[i]);
				}
			}

			usbMediaObject = e;
			usbPartitionList = usbDevices;

			// Check if the device is connected for USB
			if (usbDevices.length > 0) {
				for (j = 0; j < connectedMediumArrayLength; j++) {
					if (connectedMediumArray[j].mode === plugInMode.USBMEDIA) {
						return;
					}
				}
				if ($N.common.helper.PowerManager.getCurrentPowerMode() === $N.common.helper.PowerManager.SYSTEM_POWER_STANDBY) {
					isInStandByMode = true;
				} else {
					showDetectedDevicePopUp();
				}
			} else if (e.medium.mediumID === currentMediumId && getConnectedMediumMode(currentMediumId) === plugInMode.DVR) {
				// If the device is connected for DVR
				for (k = 0; k < partitionListLength; k++) {
					partitionList.push(e.medium.partitionList[k].partitionName);
				}
				$N.platform.system.Device.setDiskPartitions(partitionList);
				enablePVR();
			} else {
				formatRecordForUsb(e);
			}
			log("handleMediumReady", "Exit");
		}

		/**
		 * Handles when a media object is inserted
		 * @method mediaChangedListener
		 * @param {Object} e
		 */
		function mediaChangedListener(e) {
			log("mediaChangedListener", "Enter");
			log("mediaChangedListener", JSON.stringify(e));
			switch (e.eventType) {
			case mediaLibrary.PLUGGED:
				log("mediaChangedListener", "PLUGGED");
				// We do not react to the PLUGGED event on guidance from MW
				lastEvent = mediaLibrary.PLUGGED;
				currentMediumId = e.medium.mediumID;
				break;
			case mediaLibrary.UNPLUGGED:
				log("mediaChangedListener", "UNPLUGGED");
				lastEvent = mediaLibrary.UNPLUGGED;
				currentMediumId = null;
				usbMediaObject = null;
				usbPartitionList = null;
				formatRecordForUsb(e);
				break;
			case mediaLibrary.MEDIUM_REJECTED:
				log("mediaChangedListener", "MEDIUM_REJECTED");
				lastEvent = mediaLibrary.MEDIUM_REJECTED;
				handleRejectedReason(e);
				break;
			case mediaLibrary.MEDIUM_READY:
				log("mediaChangedListener", "MEDIUM_READY");
				lastEvent = mediaLibrary.MEDIUM_READY;
				currentMediumId = e.medium.mediumID;
				handleMediumReady(e);
				break;
			case mediaLibrary.SAFESHUTDOWNCOMPLETE:
				//fired when a USB device is ready to be removed safely
				log("mediaChangedListener", "SAFESHUTDOWNCOMPLETE");
				lastEvent = mediaLibrary.SAFESHUTDOWNCOMPLETE;
				currentMediumId = null;
				usbMediaObject = null;
				usbPartitionList = null;
				formatRecordForUsb(e);
				break;
			case mediaLibrary.MEDIUM_WAITING_FOR_EVENT:
				// The drive cannot move to READY or REJECTED because of some external condition.
				// For instance, the set-top box cannot connect with a server to determine if it is in the home domain.
				log("mediaChangedListener", "MEDIUM_WAITING_FOR_EVENT");
				if (e.reason && e.reason === mediaLibrary.CANNOT_DETERMINE_HOME_DOMAIN) {
					// The server did not verify or deny that this drive is in the home domain of this set-top box.
					// This could be due to a network or server problem.
					$N.app.DialogueHelper.hideUSBDialogues();
					$N.app.DialogueHelper.createAndShowDialogue(Constants.DLG_USB_DOMAIN_UNCERTAIN);
				}
				break;
			default:
				break;
			}
			log("mediaChangedListener", "Exit");
		}

		/**
		 * Handles when a media object is inserted
		 * @method handlePlaybackOnBoot
		 * @param {Object} e
		 * @param {Object} currentMedium - The connected medium that is currently read.
		 * @return {Boolean} isMediaPlaybackAvailable - true if USB is available for media playback / false if not and can be used for DVR.
		 */
		function handlePlaybackOnBoot(e, currentMedium) {
			log("handlePlaybackOnBoot", "Enter");
			var i,
				usbDevicesArray = [],
				j,
				connectedMediumArrayLength = connectedMediumArray.length,
				partitionListLength = currentMedium.partitionList.length,
				usbDeviceName = "",
				eventObject = {};

			currentMediumId = null;
			//usbDevicesArray will be populated if the attached device has FAT partition.
			for (i = 0; i < partitionListLength; i++) {
				//Removing '!currentMedium.associated' condition based on the following comment.
				//For OpenTV 5.1.2 and later versions, this field should be ignored.
				//The concept of drive/set-top box association is no longer supported.
				if (isFat32LikeFileSystem(currentMedium.partitionList[i].fileSysCode)) {
					usbDevicesArray.push(currentMedium.partitionList[i]);
				} else {
					updateConnectedMediumArray(currentMedium.mediumID, plugInMode.DVR);
					return false;
				}
			}
			//to check if 1 usb is already detected.In that case return true so that PVR doesn't get enabled in PVRCapability.js
			//If the device doesn't have FAT partition,its assumed to be used for PVR.In that case usbDevicesArray array will not have contents.
			//Hence this loop wont be executed
			for (j = 0; j < connectedMediumArrayLength; j++) {
				if (usbDevicesArray.length > 0 && connectedMediumArray[j].mode === plugInMode.USBMEDIA) {
					log("handlePlaybackOnBoot", "Exit 1 returning true");
					return true;
				}
			}

			isUsbPlugged = false;
			currentMediumId = currentMedium.mediumID;
			eventObject.medium = currentMedium;
			//code to be executed after the contexts get loaded.
			contextsLoadedSubscriptionIdPlayback = $N.apps.util.EventManager.subscribe("contextsLoaded", function () {
				log("contextsLoaded...handlePlaybackOnBoot", "Enter");
				if (contextsLoadedSubscriptionIdPlayback) {
					$N.apps.util.EventManager.unSubscribe(contextsLoadedSubscriptionIdPlayback);
					contextsLoadedSubscriptionIdPlayback = null;
				}
				if (usbDevicesArray.length > 0) {
					if (isDVRPurpose && usbDevicesArray.length > 0) {
						mediaLibrary.loadMedium(currentMediumId, true, true);
					} else {
						usbMediaObject = eventObject;
						usbPartitionList = usbDevicesArray;
						showDetectedDevicePopUp();
					}
				}
				log("contextsLoaded...handlePlaybackOnBoot", "Exit");
			}, $N.app.HotPlug);

			if (usbDevicesArray.length > 0) {
				updateConnectedMediumArray(currentMediumId, plugInMode.USBMEDIA);
				$N.app.UsbBrowserHelper.setMediaPlaybackStatus(true, currentMediumId);
				$N.app.UsbBrowserHelper.setPartitionList(usbDevicesArray);
				//fileSysLabel determines the device Name. If not specified, the vendor name will be displayed.
				if (usbDevicesArray && usbDevicesArray[0].fileSysLabel !== _defaultUSBDeviceName) {
					usbDeviceName = usbDevicesArray[0].fileSysLabel;
				}
				$N.app.UsbBrowserHelper.setMediumName(usbDeviceName);
				mediaLibrary.loadMedium(currentMediumId, true, true);
				$N.app.UsbBrowserHelper.setMediaContentLoading(true);
				log("handlePlaybackOnBoot", "Exit 2 returning true");
				return true;
			}
			log("handlePlaybackOnBoot", "Exit 3 returning false");
			return false;
		}

		/**
		 * Handles when a media object is inserted for PVR
		 * @method handlePVROnBoot
		 * @param {Object} currentMedium - The connected medium that is currently read.
		 */
		function handlePVROnBoot(currentMedium) {
			log("handlePVROnBoot", "Enter");
			var e = {};
			if (currentMedium && currentMedium.mediumID) {
				e.eventType = currentMedium.lastEvent;
				e.medium = currentMedium;
				if (e.eventType === mediaLibrary.MEDIUM_REJECTED) {
					e.reason = mediaLibrary.PARTITIONS_NOT_RECOGNIZED;
				} else if (e.eventType === mediaLibrary.SAFESHUTDOWNCOMPLETE) {
					e = {};
					return;
				}
				isDVRPurpose = true;
				// If we boot with a new HDD the normal HotSwap events don't fire, so we call the listener here when ready
				contextsLoadedSubscriptionId = $N.apps.util.EventManager.subscribe("contextsLoaded", function () {
					log("contextsLoaded...handlePVROnBoot", "Enter");
					if (contextsLoadedSubscriptionId) {
						$N.apps.util.EventManager.unSubscribe(contextsLoadedSubscriptionId);
						contextsLoadedSubscriptionId = null;
					}
					if (e.eventType === mediaLibrary.MEDIUM_READY) {
						currentMediumId = e.medium.mediumID;
					}
					mediaChangedListener(e);
					log("contextsLoaded...handlePVROnBoot", "Exit");
				}, $N.app.HotPlug);
			}
			log("handlePVROnBoot", "Exit");
		}

		function loadMediumOKListener(e) {
			log("loadMediumOKListener", "Enter");
			if (e.scanState === mediaLibrary.SCAN_STOPPED) {
				log("loadMediumOKListener", "SCAN_STOPPED");
				$N.app.UsbBrowserHelper.setMediaContentList();
				if (isUsbPlugged) {
					isUsbPlugged = false;
				}
			}
			log("loadMediumOKListener", "Exit");
		}

		/**
		 * Registers a single event listener given event listener with USB hot plug
		 * @method registerSingleUSBEventListener
		 */
		function registerSingleUSBEventListener(event, callback) {
			callback = callback || function () {};
			mediaLibrary.addEventListener(event, callback);
		}

		/**
		 * Un Registers a single event listener given event listener with USB hot plug
		 * @method removeSingleUSBEventListener
		 */
		function removeSingleUSBEventListener(event, callback) {
			callback = callback || function () {};
			mediaLibrary.removeEventListener(event, callback);
		}
		/**
		 * returns the mediumID of the plugged USB media device.
		 * @method getConnectedUSBMediumID
		 */
		function getConnectedUSBMediumID() {
			log("getConnectedUSBMediumID", "Enter");
			var i,
				connectedMediumArrayLength = connectedMediumArray.length;
			for (i = 0; i < connectedMediumArrayLength; i++) {
				if (connectedMediumArray[i].mode === plugInMode.USBMEDIA) {
					return connectedMediumArray[i].mediumId;
				}
			}
			return null;
		}

		/**
		 * @method removeMediumOKListener
		 * @param {Object} e
		 */
		function removeMediumOKListener(e) {
			/*Removing the pop up code from here and adding it in "SAFESHUTDOWNCOMPLETE" event in formatRecordForUsb
			 *which will be called from mediaChangedListener.
			 *CCOM documentation says:
			 *After calling removeMedium(), the application will receive notification of onMediaChanged
			 *with eventType set to SAFESHUTDOWNCOMPLETE.
			 *After that notification is received, the user can be notified with a popup that the medium can be safely unplugged.
			 */
		}

		/**
		 * @method removeMediumFailedListener
		 * @param {Object} e
		 */
		function removeMediumFailedListener(e) {
			$N.app.DialogueHelper.hideUSBDialogues();
			// TODO: NETUI-4823 - Enter in Error Codes to Popup on Disk removal error
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_SAFE_REMOVE_HARDDISK_FAILED,
						$N.app.DialogueHelper.getString("mediaDisabledTitleFailed"),
						$N.app.DialogueHelper.getString("mediaDisabledMessageFailed"));
			disablePVR();
		}

		/**
		 * handle for the box wake up event.
		 * @method checkDeviceDetectedinStandBy
		 */
		function checkDeviceDetectedinStandBy() {
			if (isInStandByMode) {
				showDetectedDevicePopUp();
				isInStandByMode = false;
			}
		}
		/** safely removes the USB media used for media browsing
		* @method safelyRemoveUSBMedia
		* @param {Number} usbMediaID
		*/
		function safelyRemoveUSBMedia(usbMediaID) {
			CCOM.MediaLibrary.removeMedium(usbMediaID);
		}
		return {
			/**
			 * @method initialise
			 */
			initialise: function () {
				log("initialise", "Enter");
				$N.apps.core.Language.adornWithGetString($N.app.HotPlug);
				mediaLibrary = CCOM.MediaLibrary;
				this.registerUSBEventListener();
				$N.apps.util.EventManager.subscribe("SYSTEM_POWER_NORMAL", checkDeviceDetectedinStandBy, this);
				log("initialise", "Exit");
			},

			/**
			 * Registers the given event listener with USB hot plug
			 * @method registerUSBEventListener
			 */
			registerUSBEventListener: function () {
				log("registerUSBEventListener", "Enter");
				registerSingleUSBEventListener("onMediaChanged", mediaChangedListener);
				registerSingleUSBEventListener("onMediaHandled", mediaHandledListener);
				registerSingleUSBEventListener("associateMediumOK", associateMediumOKListener);
				registerSingleUSBEventListener("associateMediumFailed", associateMediumFailedListener);
				registerSingleUSBEventListener("removeMediumOK", removeMediumOKListener);
				registerSingleUSBEventListener("removeMediumFailed", removeMediumFailedListener);
				registerSingleUSBEventListener("getAssociatedMediaIdOK", getAssociatedMediaIdOKListener);
				registerSingleUSBEventListener("getAssociatedMediaIdFailed", getAssociatedMediaIdFailedListener);
				registerSingleUSBEventListener("onMediaScanned", loadMediumOKListener);
				log("registerUSBEventListener", "Exit");
			},

			/**
			 * Unregisters the given event listener with USB hot plug
			 * @method unregisterUSBEventListener
			 */
			unregisterUSBEventListener: function (listener) {
				log("unregisterUSBEventListener", "Enter");
				removeSingleUSBEventListener("onMediaChanged", mediaChangedListener);
				removeSingleUSBEventListener("onMediaHandled", mediaHandledListener);
				removeSingleUSBEventListener("associateMediumOK", associateMediumOKListener);
				removeSingleUSBEventListener("associateMediumFailed", associateMediumFailedListener);
				removeSingleUSBEventListener("removeMediumOK", removeMediumOKListener);
				removeSingleUSBEventListener("removeMediumFailed", removeMediumFailedListener);
				removeSingleUSBEventListener("getAssociatedMediaIdOK", getAssociatedMediaIdOKListener);
				removeSingleUSBEventListener("getAssociatedMediaIdFailed", getAssociatedMediaIdFailedListener);
				removeSingleUSBEventListener("onMediaScanned", loadMediumOKListener);
				log("unregisterUSBEventListener", "Exit");
			},

			/**
			 * Set the callback for when the USB hot plug Dialog is displayed
			 * @method setDialogShownCallback
			 * @param (function) callback
			 */
			setDialogShownCallback: function (callback) {
				log("setDialogShownCallback", "Enter");
				if (callback) {
					dialogShownCallback = callback;
				} else {
					dialogShownCallback = function () {};
				}
				log("setDialogShownCallback", "Exit");
			},

			/**
			 * Set the callback for when an  USB hot plug Dialog times out
			 * @method setDialogTimedOutCallback
			 * @param (function) callback
			 */
			setDialogTimedOutCallback: function (callback) {
				dialogTimedOutCallback = callback || function () {};
			},

			/**
			 * Key handler method.
			 * @method keyHandler
			 * @param {Object} key
			 * @param {Object} event
			 * @return {Boolean} True if the key press was handled, false if the key press wasn't handled.
			 */
			keyHandler: function (key, event) {
				log("keyHandler", "Enter - key = " + key);
				return this._isFormatInProgress;
			},
			getCurrentMediumId : function () {
				return this.currentMediumId;
			},

			getOptions: getOptions,
			registerSingleUSBEventListener: registerSingleUSBEventListener,
			removeSingleUSBEventListener: removeSingleUSBEventListener,
			setUpDiskDriveFormatting: setUpDiskDriveFormatting,
			setUpRemoveDiskDrive: setUpRemoveDiskDrive,
			handlePlaybackOnBoot: handlePlaybackOnBoot,
			handlePVROnBoot: handlePVROnBoot,
			getConnectedUSBMediumID: getConnectedUSBMediumID,
			safelyRemoveUSBMedia: safelyRemoveUSBMedia
		};
	}());

}($N || {}));
