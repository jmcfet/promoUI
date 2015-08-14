/**
 * Helper class for all menus inside settings.
 * Settings Panel instance is passed as controller
 *
 * @class SettingsMenuHelper
 * @author ravichan
 * @requires $N.apps.core.Log
 * @requires $N.apps.core.Language
 * @requires $N.app.constants
 * @requires $N.app.SettingsAPI
 * @requires $N.app.FormatUtils
 * @requires $N.app.PVRUtil
 * @requires $N.app.AutoTuneHelper
 * @requires $N.app.StandardTimers.minuteTimer
 * #depends SettingsAPI.js
 * #depends FormatUtils.js
 * #depends PVRUtil.js
 * #depends AutoTuneHelper.js
 * #depends StandardTimers.js
 * @param {Object} controller
*/
(function ($N) {
	"use strict";
	var SettingsMenuHelper = function (controller) {
		var constants = $N.app.constants,
			preferences = $N.platform.system.Preferences,
			settingsAPI = $N.app.SettingsAPI,
			formatUtils = $N.app.FormatUtils,
			pvrUtil = $N.app.PVRUtil,
			autoTuneHelper = $N.app.AutoTuneHelper,
			data = null,
			activeSettingsMenuItem = null,
			systemMenuRefreshInterval = null,
			DIAGNOSTIC_REFRESH_INTERVAL_MS = 100, // reduced to 100 so as to bring the signal PS/QS instantly.
			IP_CONNECTIONS_REFRESH_INTERVAL_MS = 200,
			refreshComponent = null,
			savePaddingWithKeypad = null,
			saveAutoTuneDateTime = null,
			menuItemFocusOnExitIndex = null,
			CLIPPED_WIDTH_FOR_ALPHANUM_KEYPAD = 570,
			pinHelper = null,
			getAutoTuneData = null,
			getReminderData = null,
			SINGLE_SPACE = ' ',
			TICK_ICON_URL = "../../../customise/resources/images/%RES/icons/tick_17x17.png",
			DIALOG_YES_ACTION = 0,
			minuteTimer = $N.app.StandardTimers.minuteTimer,
			log = new $N.apps.core.Log("Settings", "SettingsMenuHelper");

		$N.apps.core.Language.adornWithGetString($N.app.SettingsMenuHelper);

		function changeMenuLanguage(isoString) {
			$N.apps.core.Language.setLocale(isoString);
			return $N.apps.core.Language.refreshLanguageBundles();
		}

		function getAvailableMenuLanguageLookup() {
			var lookup = [],
				availableLanguages = settingsAPI.availableLanguages(),
				numberOfAvailableLanguages = availableLanguages.length,
				i;
			for (i = 0; i < numberOfAvailableLanguages; i++) {
				lookup.push({
					title: SettingsMenuHelper.getString("isoLocaleLanguage")[availableLanguages[i]],
					value: availableLanguages[i]
				});
			}
			return lookup;
		}

		function getAvailableAudioLanguageLookup() {
			var lookup = [],
				availableLanguages = settingsAPI.availableAudioLanguages(),
				numberOfAvailableLanguages = availableLanguages.length,
				i;
			for (i = 0; i < numberOfAvailableLanguages; i++) {
				lookup.push({
					title: SettingsMenuHelper.getString("audioLanguage")[availableLanguages[i]],
					value: availableLanguages[i]
				});
			}
			return lookup;
		}

		/**
		 *@Method getAvailableSubtitleStateLookup
		 * @Private
		 * All the available options are read from the lookup array
		 */
		function getAvailableSubtitleStateLookup() {
			var lookup = [],
				availableStates = settingsAPI.availableSubtitleStates(),
				numberOfAvailableStates = availableStates.length,
				i;
			for (i = 0; i < numberOfAvailableStates; i++) {
				lookup.push({
					title: SettingsMenuHelper.getString("subtitleStates")[availableStates[i]],
					value: availableStates[i]
				});
			}
			return lookup;
		}

		function getMiniguideDurationLookup() {
			var lookup = [],
				availableDurations = settingsAPI.availableSurferDurations(),
				numberOfAvailableDurations = availableDurations.length,
				i;
			for (i = 0; i < numberOfAvailableDurations; i++) {
				lookup.push({
					title: SettingsMenuHelper.getString("surferDurations")[availableDurations[i]],
					value: availableDurations[i]
				});
			}
			return lookup;
		}

		/**
		 *@Method getMiniguidePipPositions
		 * @Private
		 * All the available options are read from the lookup array
		 */
		function getMiniguidePipPositions() {
			var lookup = [],
				availableOptions = settingsAPI.getAvailableMiniguidePipPositions(),
				numberOfAvailableOptions = availableOptions.length,
				i;
			for (i = 0; i < numberOfAvailableOptions; i++) {
				lookup.push({
					title: SettingsMenuHelper.getString("menuPipPositions")[availableOptions[i]],
					value: availableOptions[i]
				});
			}
			return lookup;
		}


		/**
		 * Private method that returns list of available transition effects.
		 *@Method getMediaTransitionEffectsLookup
		 * @Private
		 * @return {Array} An Array that contains available transition effects as an object
		 */
		function getMediaTransitionEffectsLookup() {
			var lookup = [],
				effects,
				availableEffects = settingsAPI.getAvailableTransitionEffects();
			for (effects in availableEffects) {
				if (availableEffects.hasOwnProperty(effects)) {
					lookup.push({
						title: SettingsMenuHelper.getString("transitionEffects")[availableEffects[effects]],
						value: availableEffects[effects]
					});
				}
			}
			return lookup;
		}

		function getAutoTuneLookup(constantObj, stringName) {
			var lookup = [],
				availableDurations = constants[constantObj],
				numberOfAvailableDurations = availableDurations.length,
				i;
			for (i = 0; i < numberOfAvailableDurations; i++) {
				lookup.push({
					title: SettingsMenuHelper.getString(stringName)[availableDurations[i]],
					value: availableDurations[i]
				});
			}
			return lookup;
		}

		function getAvailableStandbyDurationLookup() {
			var lookup = [],
				availableStandbyDurations = settingsAPI.availableStandbyDurations(),
				numberOfAvailableDurations = availableStandbyDurations.length,
				i;
			for (i = 0; i < numberOfAvailableDurations; i++) {
				lookup.push({
					title: SettingsMenuHelper.getString("standbyDurations")[availableStandbyDurations[i]],
					value: availableStandbyDurations[i],
					constant: constants.PREF_AUTO_STANDBY
				});
			}
			return lookup;
		}

		function getAvailPlaybackPlayerLookup() {
			var lookup = [],
				availableTimeouts = settingsAPI.availPlaybackPlayerOptions(),
				numberOfAvailableTimeouts = availableTimeouts.length,
				i;
			for (i = 0; i < numberOfAvailableTimeouts; i++) {
				lookup.push({
					title: SettingsMenuHelper.getString("playbackPlayerTimeouts")[availableTimeouts[i]],
					value: availableTimeouts[i]
				});
			}
			return lookup;
		}

		function restoreConfigsAndExitKeypad(folderName) {
			var keypad = controller.getKeypadComponent(),
				activeMenuItem = controller.getActiveMenuItem();

			keypad.hide();
			keypad.resetKeyPadConfig();
			activeMenuItem.configs = formatUtils.getDefaultFolderConfig();
			controller.exitKeypad(folderName, menuItemFocusOnExitIndex);
		}

		function showAlphaNumericKeypad() {
			var keypadSaveCallback = null,
				MAX_CHARACTERS = 18,
				keyboardUtils = $N.app.KeyboardUtils,
				keyboardType = $N.app.KeyboardType,
				keypad = controller.getKeypadComponent();

			keypad.resetKeyPadConfig();
			keypad.setExitCallback(function () {
				restoreConfigsAndExitKeypad();
			});
			keyboardUtils.setKeypad(keypad, keyboardType.ALPHA_NUMERIC_UPPERCASE);
			keypad.clearInput();
			keypad.configure({
				cursorEnable: true,
				textInputAlignment: keyboardType.ALIGNMENT.LEFT,
				labelAutoAlign: true,
				maxCharacters : MAX_CHARACTERS,
				clippedWidth: CLIPPED_WIDTH_FOR_ALPHANUM_KEYPAD
			});
			keyboardUtils.showKeypad(keyboardType.ALPHA_NUMERIC_UPPERCASE);
			keypad.focus();
			keypad.show();
		}

		function saveNewfolder(folderName) {
			var folderList = [],
				folderOnTop,
				folderNameWithLeadingSlash = null;
			folderName = $N.app.StringUtil.firstLetterPerWordCapitol(folderName);
			folderList = preferences.get(constants.PVR_NON_EPISODIC_FOLDER_LIST);
			if ((folderList.indexOf(folderName) > -1)) {
				$N.app.ErrorMessage.showDuplicateFolderNameDialog();
			} else if (folderName === "" || folderName.match(/^\s*$/)) {
				$N.app.ErrorMessage.showNoFolderNameDialog();
			} else {
				folderNameWithLeadingSlash = $N.app.StringUtil.addLeadingForwardSlash(folderName.toString());
				folderList.push(folderNameWithLeadingSlash);
				preferences.set(constants.PVR_NON_EPISODIC_DEFAULT_FOLDER, folderNameWithLeadingSlash);

				folderOnTop = folderList.splice(0, 1);
				folderList.sort();
				folderList.splice(0, 0, folderOnTop.toString());

				preferences.set(constants.PVR_NON_EPISODIC_FOLDER_LIST, folderList);

				restoreConfigsAndExitKeypad(folderName);
			}
		}

		/**
		 * The callback used where user is allowed to configure
		 * Auto-tune.
		 * @method configureAutoTune
		 * @private
		 * @param {Object} menuItem The selected item
		 * @param {Object} guiElement The selected gui object
		 * @param {Bool} isEdit is true if we are editing an exisinting auto tune.
		 */
		function configureAutoTune(menuItem, guiElement, isEdit) {
			var menuItemObj = {},
				channelInfo = $N.app.epgUtil.getServiceById(menuItem.serviceId);
			if (!isEdit) {
				autoTuneHelper.resetAutoTuneProperties();
			} else {
				autoTuneHelper.setAutoTuneProperty("frequency", menuItem.jobType);
				autoTuneHelper.setAutoTuneProperty("date", menuItem.startDate);
				autoTuneHelper.setAutoTuneProperty("time", menuItem.startTime);
				autoTuneHelper.setAutoTuneProperty("channel", menuItem.channelNumber + SINGLE_SPACE + menuItem.serviceName);
				autoTuneHelper.setAutoTuneProperty("channelInfo", channelInfo);
				autoTuneHelper.setAutoTuneProperty("logicalChannelNum", channelInfo.logicalChannelNum);
				autoTuneHelper.setAutoTuneProperty("jobId", menuItem.jobId);
				autoTuneHelper.setAutoTuneProperty("isPresentTime", false);
			}

			menuItemObj.title = 'menuAutoTuneEdit';
			menuItemObj.drawMenuCallback = 'autoTuneTimeUpdate';
			menuItemObj.configs = formatUtils.getAutoTuneEditConfig();
			controller.itemSelected(menuItemObj);
		}

		/**
		 * The callback used where user is allowed to edit the
		 * Auto-tune set.
		 * @method showAutoTuneEdit
		 * @private
		 * @param {Object} menuItem The selected item
		 * @param {Object} guiElement The selected gui object
		 */
		function showAutoTuneEdit(menuItem, guiElement) {
			configureAutoTune(menuItem, guiElement, true);
		}
		/**
		 * The function used to refresh the list and focus the item
		 * @method refreshReminderList
		 * @private
		 * @param {Object} data
		 */
		function refreshReminderList(data) {
			var activeComponent = controller.getActiveComponent(),
				currentIndex = activeComponent.getActualSelectedRowIndex(),
				currentDataLength = null;
			controller.refreshMenu(controller.getActiveMenuItem(), data);
			currentDataLength = activeComponent.getData().length;
			if ((currentIndex >= currentDataLength) && currentDataLength) {
				activeComponent.selectItemAtIndex(currentDataLength, true);
			} else if ((currentDataLength !== 0) && currentDataLength) {
				activeComponent.selectItemAtIndex(currentIndex, true);
			}
			controller.scrollIndicatorHandler(activeComponent, controller.getActiveMenuScrollComponent());
		}

		/**
		 * The function used to refresh the list and focus the item
		 * @method refreshControllerActiveMenu
		 * @private
		 */
		function refreshControllerActiveMenu() {
			var activeComponent = controller.getActiveComponent(),
				activeMenuItem = controller.getActiveMenuItem(),
				currentIndex = activeComponent.getActualSelectedRowIndex();
			controller.refreshMenu(activeMenuItem);
			activeComponent.selectItemAtIndex(currentIndex, true);
		}
		/**
		 * The callback used where user is allowed to delete the
		 * Auto-tune set.
		 * @method deleteAutoTune
		 * @private
		 * @param {Object} menuItem The selected item
		 */
		function deleteAutoTune(menuItem) {
			autoTuneHelper.cancelAutoTune(menuItem.jobId);
		}

		/**
		 * Gets all the Auto tune Data for the auto-Tune Menu
		 * @method getAutoTuneData
		 * @public
		 */
		getAutoTuneData = function () {
			var serviceObj,
				channelNumber,
				jobTime,
				jobId,
				jobType,
				serviceId,
				startTime,
				startDate,
				channelLogo,
				extraInfo,
				autoTuneJobs = [],
				data = [],
				i,
				ONE_MINUTE = 60000;

			autoTuneJobs = autoTuneHelper.getAllActiveAutoTune();

			if (autoTuneJobs.length > 0) {
				for (i = 0; i < autoTuneJobs.length; i++) {
					jobTime = new Date(autoTuneJobs[i].startTime + ONE_MINUTE);
					jobId = autoTuneJobs[i].jobId;
					startTime = $N.app.DateTimeUtil.getFormattedTimeString(jobTime, constants.TWENTY_FOUR_HOUR_TIME_FORMAT);
					startDate = $N.apps.util.Util.formatDate(new Date(jobTime), "DD/MM/YYYY");
					serviceId = autoTuneJobs[i].serviceId;
					channelLogo = $N.app.epgUtil.getChannelLogoUrl(serviceId);
					serviceObj = $N.app.epgUtil.getServiceById(serviceId);
					channelNumber = formatUtils.formatChannelNumber(serviceObj.logicalChannelNum);
					if (!channelLogo) { // if ChannelLogo is empty string then show channel number.
						channelLogo = channelNumber.toString();
					}
					if (autoTuneJobs[i].extraInfo) {
						extraInfo = $N.app.GeneralUtil.ParseJSON(autoTuneJobs[i].extraInfo);
						if (extraInfo) {
							jobType = extraInfo.jobType || "";
						}
					}
					data.push({
						"title" : serviceObj.serviceName + SINGLE_SPACE + startDate + SINGLE_SPACE + startTime,
						"channelNumber": channelNumber,
						"serviceName": serviceObj.serviceName,
						"definition": serviceObj.definition,
						"startDate": startDate,
						"startTime": startTime,
						"channelLogo": channelLogo,
						"serviceId": serviceId,
						"jobId": jobId,
						"jobType": jobType
					});
				}
				data.colorKeyCallbacks = {
					"green" :  configureAutoTune,
					"yellow" :  deleteAutoTune
				};
				data.successCallback = showAutoTuneEdit;
			} else {
				data = null;
			}
			return data;
		};
		/**
		 * The function used to show the Background image upon exiting from Synopsis and ListGuide
		 * @method returnToSettings
		 * @private
		 */
		function returnToSettings() {
			$N.app.BrandHelper.show($N.app.BrandHelper.AGORA_BACKGROUND_ID);
			$N.app.ClockDisplay.show();
			$N.apps.util.EventManager.fire("genericReminderJobUpdated");
		}
		/**
		 * The function used to navigate to synopsis context.
		 * if Parental rating is not set to Without block, and try accessing the synopsis for the blocked/adult channel
		 * - or adult event of a normal channel pin pop-up will appear to unlock the channel/show.
		 * @method showExtendedInformation
		 * @private
		 * @param {Object} menuItem The selected item
		 */
		function showExtendedInformation(menuItem) {
			var event = $N.app.epgUtil.getMappedEventById(menuItem.eventId),
				focusedChannel = $N.platform.btv.EPG.getChannelByServiceId(event.serviceId),
				isChannelLocked = $N.app.ParentalControlUtil.isChannelLocked(focusedChannel),
				pinHelper = new $N.app.PinHelper(null, null, null, null, $N.app.constants.PIN_DIALOG_SHOW_TIME, false);
			if ($N.app.ParentalControlUtil.isChannelOrProgramLocked(event) && $N.app.genreUtil.isAdultChannel(focusedChannel)) {
				pinHelper.setDialogProperties({
					x: 0,
					y: 0,
					width: 1920,
					height: 1080,
					id: 'reminderPinDialogId',
					title: isChannelLocked ? SettingsMenuHelper.getString("channelLocked") : SettingsMenuHelper.getString("programLocked"),
					description: isChannelLocked ? SettingsMenuHelper.getString("unlockChannel") : SettingsMenuHelper.getString("unlockShow"),
					cancelCallback: function () {
						pinHelper.hideDialog();
					}
				});
				pinHelper.setAuthenticationSuccessCallback(function () {
					$N.app.epgUtil.navigateToSynopsis(event, false, returnToSettings);
				});
				pinHelper.showPinDialog('master', true);
			} else {
				$N.app.epgUtil.navigateToSynopsis(event, false, returnToSettings);
			}
		}
		/**
		 * The function used to navigate to ListGuide context
		 * @method createReminders
		 * @private
		 */
		function createReminders() {
			$N.app.ContextHelper.openContext("LISTGUIDE", {navCompleteCallback: returnToSettings});
		}
		/**
		 * calls for cancel reminder
		 * @method deleteReminder
		 * @private
		 * @param {Object} menuItem The selected item
		 */
		function deleteReminder(menuItem) {
			$N.platform.btv.Reminders.cancelReminder($N.platform.btv.EPG.getEventById(menuItem.eventId));
		}
		/**
		 * this listener callback is used for refresh the reminder and autotune menu's
		 * @method jobDeletedOkListener
		 * @public
		 */
		function genericReminderDeletedListener() {
			var activeMenuItem = controller.getActiveMenuItem(),
				reminderData;
			if (activeMenuItem.title === "menuReminders") {
				reminderData = getReminderData();
				if (reminderData) {
					refreshReminderList(reminderData);
				} else {
					controller.passivate();
				}
			} else if (activeMenuItem.title === "menuAutoTune") {
				refreshReminderList(getAutoTuneData());
			}
		}

		/**
		 * Gets all the reminder Data for the reminder Menu
		 * @method getReminderData
		 * @private
		 */
		getReminderData = function () {
			var serviceObj,
				channelNumber,
				jobTime,
				jobId,
				serviceId,
				startTime,
				startDate,
				channelLogo,
				extraInfo,
				parentalRating,
				episodeId,
				reminderJobs = [],
				data = [],
				i,
				ONE_MINUTE = 60000,
				eventId,
				eventObj,
				uniqueEventId = null,
				taskObj = null,
				title = null;

			reminderJobs = $N.app.Reminders.getAllActiveReminders();

			if (reminderJobs.length > 0) {
				for (i = 0; i < reminderJobs.length; i++) {
					jobTime = new Date(reminderJobs[i].startTime + ONE_MINUTE);
					jobId = reminderJobs[i].jobId;
					startTime = $N.app.DateTimeUtil.getFormattedTimeString(jobTime, constants.TWENTY_FOUR_HOUR_TIME_FORMAT);
					startDate = $N.app.DateTimeUtil.getDayMonthStringFromDate(jobTime);
					eventId = reminderJobs[i].eventId;
					eventObj = $N.platform.btv.EPG.getEventById(eventId);
					taskObj = $N.platform.btv.PVRManager.getTasksForJobId(jobId)[0] || null;
					if (taskObj || (eventObj && eventObj.serviceId)) {
						serviceId = reminderJobs[i].serviceId || taskObj.serviceId || eventObj.serviceId;
						title = reminderJobs[i].title || taskObj.title || eventObj.title;
						channelLogo = $N.app.epgUtil.getChannelLogoUrl(serviceId);
						serviceObj = $N.app.epgUtil.getServiceById(serviceId);
						if (serviceObj) {
							channelNumber = formatUtils.formatChannelNumber(serviceObj.logicalChannelNum);
							if (!channelLogo) {//if channelLogo is empty string then show channel number.
								channelLogo = channelNumber.toString();
							}
							if (reminderJobs[i].extraInfo) {
								extraInfo = $N.app.GeneralUtil.ParseJSON(reminderJobs[i].extraInfo);
								if (extraInfo) {
									parentalRating = extraInfo.parentalRating || taskObj.parentalRating || eventObj.parentalRating || "";
									episodeId = extraInfo.episodeId || "";
									if (eventObj) {
										uniqueEventId = $N.app.epgUtil.getUniqueEventIdByEvent(eventObj) || null;
									}
								}
							}
							data.push({
								"title" : title,
								"channelNumber": channelNumber,
								"channelName": serviceObj.serviceName,
								"startDate": startDate,
								"startTime": startTime,
								"channelLogo": channelLogo,
								"serviceName": serviceObj.serviceName,
								"definition": serviceObj.definition,
								"serviceId": serviceId,
								"eventId": eventId,
								"jobId": jobId,
								"parentalRating": parentalRating,
								"episodeId" : episodeId,
								"uniqueEventId" : uniqueEventId
							});
						}
					}
				}
				if (data.length > 0) {
					data.colorKeyCallbacks = {
						"yellow" :  deleteReminder,
						"red" : showExtendedInformation,
						"green" : createReminders,
						"info" : showExtendedInformation
					};
				}
			} else {
				data = null;
			}
			return data;
		};
		function setupFolderCreation(menuItem) {
			var activeComponent = controller.getActiveComponent(),
				activeMenuItem = controller.getActiveMenuItem(),
				keypad = controller.getKeypadComponent();

			menuItemFocusOnExitIndex = activeComponent.getActualSelectedRowIndex();

			menuItem.configs = formatUtils.getAlphaNumKeypadConfig();
			activeMenuItem.configs = formatUtils.getAlphaNumKeypadConfig();

			controller.keypadPanelSettings(menuItem);
			showAlphaNumericKeypad();
			keypad.setKeypadTitle(SettingsMenuHelper.getString("titleNameTheNewFolder"));
			keypad.setColorKeyCallbacks({
				"green" : saveNewfolder
			});
		}
		/**
		 * it updates the Diagnostics item by
		 * calling updateDataAtIndex of the list
		 * @method updateSystemDiagnostics
		 * @param {Object} result, result of the Asynchronous call
		 */
		function updateSystemDiagnostics(result) {
			var notAvailableText = null,
				i,
				newDiagnosticsDataObj = null,
				indexTunerStatus = refreshComponent.getIndexByUniqueData("title", "tunerStatus"),
				indexBER = refreshComponent.getIndexByUniqueData("title", "bitErrorValue"),
				indexSignalStrength = refreshComponent.getIndexByUniqueData("title", "signalStrength"),
				indexSNR = refreshComponent.getIndexByUniqueData("title", "signalQuality"),
				indexFrequency = refreshComponent.getIndexByUniqueData("title", "frequency"),
				indexModulation = refreshComponent.getIndexByUniqueData("title", "modulation"),
				indexSymbolRate = refreshComponent.getIndexByUniqueData("title", "symbolRate"),
				tunerText = SettingsMenuHelper.getString("no"),
				signalQuality = 0,
				SIGNAL_STRENGTH_PROGBAR_MIN = -16,
				SIGNAL_STRENGTH_PROGBAR_MAX = 20,
				SIGNAL_QUALITY_THRESHOLD = 30; // The THRESHOLD value to check if Tuned or Not.
			if (indexBER) {
				notAvailableText = SettingsMenuHelper.getString("notAvailable");
				if (result && result.lockStatus) {
					tunerText = SettingsMenuHelper.getString("yes");
					if ((result.BER > 0) || (result.BER < 0)) {
						signalQuality = Math.round(-12.5 * (Math.log(result.BER) / Math.LN10));
					} else if (result.BER === 0) {
						signalQuality = 100;
					} else {
						signalQuality = 0;
					}
				}
				newDiagnosticsDataObj = [
					{ index : indexTunerStatus, newData : {
						"title" : "tunerStatus",
						"subTitle" : tunerText
					}},
					{ index : indexBER, newData : {
						"title": "bitErrorValue",
						"subTitle": result ? result.BER.toExponential(2) : notAvailableText
					}},
					{ index : indexSignalStrength, newData : {
						"title" : "signalStrength",
						"subTitle" : result.cnrPercent ? $N.app.SignalInfoUtil.convertSignalStrengthTodBmV(result.cnrPercent) : notAvailableText,
						"template" : "SettingsProgressBarMenuItem",
						"dataMapper" : "DiagnosticsSignalStrengthProgress"
					}},
					{ index : indexFrequency, newData : {
						"title" : "frequency",
						"subTitle" : result ? result.dvbC.CTunerFreqKhz : notAvailableText
					}},
					{ index : indexModulation, newData : {
						"title" : "modulation",
						"subTitle" : result.dvbC.CTunerModulation ? $N.app.DVBScanUtil.getModulationType(result.dvbC.CTunerModulation) : notAvailableText
					}},
					{ index : indexSymbolRate, newData : {
						"title" : "symbolRate",
						"subTitle" : result ? result.dvbC.CTunerSymbolRateKsps : notAvailableText
					}},
					{ index : indexSNR, newData : {
						"title" : "signalQuality",
						"subTitle" : result ? signalQuality  : notAvailableText,
						"template" : "SettingsProgressBarMenuItem",
						"dataMapper" : "DiagnosticsProgress",
						"itemConfig": {"progressIndicatorText" : "dBmV", "ProgressBarMinimum" : SIGNAL_STRENGTH_PROGBAR_MIN, "ProgressBarMaximum" : SIGNAL_STRENGTH_PROGBAR_MAX}
					}}
				];
				for (i = 0; i < newDiagnosticsDataObj.length; i++) {
					refreshComponent.updateDataAtIndex(newDiagnosticsDataObj[i].index, newDiagnosticsDataObj[i].newData);
				}
			}
		}
		/**
		 * it checks for availability of all items in Diagnostics(signalStrength,SNR,BER,TunerStatus)
		 * and calls getConnectionInfo for BER value with
		 * the callback of refreshDiagnostics
		 * @method refreshDiagnostics
		 */
		function refreshDiagnostics() {
			var index = refreshComponent.getIndexByUniqueData("title", "bitErrorValue");
			if (index) {
				$N.app.SignalInfoUtil.setConnectionInfoSuccessCallBack(updateSystemDiagnostics);
				$N.app.SignalInfoUtil.setConnectionInfoFailureCallBack(null);
				$N.app.SignalInfoUtil.getConnectionInfo();
			}
		}
		/**
		 * function that can be used as both callback and simple function to get the
		 * Diagnostics data. If used as callback, it does the refresh of the SettingsPanel
		 * active menu Item.
		 * @method updateDiagnostics
		 * @public
		 * @param {Object} result
		 * @return {Array} The final result. if used as function call
		 * @return {FunctionCall} Refresh function call if used as a callback
		 */
		function updateDiagnostics(result) {
			var diagnosticsDataObj,
				notAvailableText = SettingsMenuHelper.getString("notAvailable"),
				SIGNAL_STRENGTH_PROGBAR_MIN = -16,
				SIGNAL_STRENGTH_PROGBAR_MAX = 23;

			diagnosticsDataObj = [
				{
					"key" : "tunerStatus",
					"value" : result ? (result.lockStatus) ? SettingsMenuHelper.getString("yes") : SettingsMenuHelper.getString("no") : SettingsMenuHelper.getString("no")
				},
				{
					"key" : "signalStrength",
					"value" : result ? $N.app.SignalInfoUtil.convertSignalStrengthTodBmV(result.cnrPercent) /*result.cnrPercent*/: notAvailableText,
					"templateConfig" : {"template" : "SettingsProgressBarMenuItem", "dataMapper" : "DiagnosticsSignalStrengthProgress", "itemConfig": {"progressIndicatorText" : "dBmV", "ProgressBarMinimum" : SIGNAL_STRENGTH_PROGBAR_MIN, "ProgressBarMaximum" : SIGNAL_STRENGTH_PROGBAR_MAX} }
				},
				{
					"key" : "signalQuality",
					"value" : result ? result.qualityPercent : notAvailableText,
					"templateConfig" : {"template" : "SettingsProgressBarMenuItem", "dataMapper" : "DiagnosticsProgress"}
				},
				{
					"key" : "frequency",
					"value" : result ? result.dvbC.CTunerFreqKhz : notAvailableText
				},
				{
					"key" : "modulation",
					"value" : result ? $N.app.DVBScanUtil.getModulationType(result.dvbC.CTunerModulation) : notAvailableText
				},
				{
					"key" : "symbolRate",
					"value" : result ? result.dvbC.CTunerSymbolRateKsps : notAvailableText
				},
				{
					"key" : "bitErrorValue",
					"value" : result ? result.BER.toExponential(2) : notAvailableText
				}
			];
			data = formatUtils.formatSTBInfoData(diagnosticsDataObj);
			if (result) {
				controller.refreshMenu(activeSettingsMenuItem, data);
			} else {
				return data;
			}
		}

		function updateIpConnections() {
			var notAvailableText = SettingsMenuHelper.getString("notAvailable"),
				ipConnectedText = SettingsMenuHelper.getString("ipConnected"),
				ipDisconnectedText = SettingsMenuHelper.getString("ipDisconnected"),
				network = $N.platform.system.Network,
				dns = network.getDnsServers(),
				isEthernetConnected = network.isEthernetAvailable(),
				ipDataObj,
				PRIMARY_DNS_INDEX = 0,
				SECONDARY_DNS_INDEX = 1,
				docsisInfo = CCOM.IpNetwork.cableModem[0];

			ipDataObj = [
				{
					"key" : "decoderIP",
					"value" : isEthernetConnected ? network.getIpAddress() : notAvailableText
				},
				{
					"key" : "dns",
					"value" : isEthernetConnected ? (dns[PRIMARY_DNS_INDEX] || dns[SECONDARY_DNS_INDEX]) : notAvailableText
				},
				{
					"key" : "macAddress",
					"value" : (docsisInfo && docsisInfo.macAddressExternal) ? docsisInfo.macAddressExternal : notAvailableText
				},
				{
					"key" : "txPowerLevel",
					"value" : (docsisInfo && docsisInfo.usPower) ? docsisInfo.usPower : notAvailableText
				},
				{
					"key" : "rxPowerLevel",
					"value" : (docsisInfo && docsisInfo.dsPower) ? (docsisInfo.dsPower / 10) : notAvailableText
				},
				{
					"key" : "SNR",
					"value" : (docsisInfo && docsisInfo.snr) ? docsisInfo.snr : notAvailableText
				},
				{
					"key" : "status",
					"value" : (docsisInfo && docsisInfo.connectedToCMTS) ? ipConnectedText : ipDisconnectedText
				},
				{
					"key" : "ipMask",
					"value" : isEthernetConnected ? network.getSubnetMask() : notAvailableText
				},
				{
					"key" : "gatewayIP",
					"value" : isEthernetConnected ? network.getGateway() : notAvailableText
				},
				{
					"key" : "macStb",
					"value" : network.getMacAddress() || notAvailableText
				},
				{
					"key" : "ipStb",
					"value" : (docsisInfo && docsisInfo.ipAddressExternal) ? docsisInfo.ipAddressExternal : notAvailableText
				}
			];
			data = formatUtils.formatSTBInfoData(ipDataObj);
			return data;
		}

		/**
		 * @method refreshIpConnections
		 */
		function refreshIpConnections() {
			updateIpConnections();
		}

		/**
		 * Method to get all of WHPVR device
		 * @method getWHPvrServers
		 * @private
		 * @return {Array} The final result(device fridenlyName and reserve value for other info).
		 */
		function getWHPvrServers() {
			var serverList = $N.platform.btv.WHPVRManager.getWHPVRServers(),
				serverLength = serverList.length,
				dataObject = [],
				localServerName = $N.platform.btv.WHPVRManager.getLocalName(),
				i = 0;
			/*firstly display local server*/
			dataObject.push({
				"key": localServerName,
				"value": ""
			});
			/*then others in HN*/
			for (i = 0; i < serverLength; i++) {
				dataObject.push({
					"key": serverList[i].friendlyName,
					"value": ""
				});
			}

			data = formatUtils.formatSTBInfoData(dataObject);
			return data;
		}

		/**
		 * Method to get current record location list, include local server and other whpvr device
		 * @method getRecordLocationList
		 * @private
		 * @return {Array} The final result(device fridenlyName and its UDN).
		 */
		function getRecordLocationList() {
			var serverList = $N.platform.btv.WHPVRManager.getWHPVRServers(),
				serverLength = serverList.length,
				dataObject = [],
				i = 0;

			/*firstly display local server*/
			dataObject.push({
				"key": SettingsMenuHelper.getString("localLocation"),
				"value": $N.platform.btv.WHPVRManager.getLocalServerUdn()
			});
			/*then others in HN*/
			for (i = 0; i < serverLength; i++) {
				dataObject.push({
					"key": serverList[i].friendlyName,
					"value": serverList[i].udn
				});
			}

			data = formatUtils.formatRecordLocationData(dataObject);
			return data;
		}

		/**
		 * Method to set recorded server
		 * @method setCurrentRecordLocation
		 * @private
		 * @param {String} Udn of recorded server
		 * @return {String} Device friendly name according Udn value
		 */
		function setCurrentRecordLocation(newUdn) {
			var serverList = $N.platform.btv.WHPVRManager.getWHPVRServers(),
				serverLength = serverList.length,
				i = 0;

			for (i = 0; i < serverLength; i++) {
				if (newUdn === serverList[i].udn) {
					data = serverList[i].friendlyName;
					return data;
				}
			}

			data = SettingsMenuHelper.getString('localLocation');
			return data;
		}

		/**
		 * function to set the data for respective options
		 * Data gets inserted based on the visibility of the items.
		 * @method getActiveMenuList
		 */
		function getActiveMenuList(menuItems) {
			var i,
				activeMenuList = [];
			for (i = 0; i < menuItems.length; i++) {
				if (menuItems[i].isVisible) {
					activeMenuList.push(menuItems[i]);
				}
			}
			return activeMenuList;
		}

		/**
		 * function to set the data for respective options
		 * @method setData
		 */
		function setData(menuItem, activeMenuItem, activeComponent) {
			var PVROptionsUtil = $N.app.PVROptionsUtil,
				mappingObject,
				configurationValue = null,
				isPassivateController = true,
				channelInfo,
				isFolderRootFolder,
				subtitleLanguage;
			switch (activeMenuItem.title) {
			case "menuNonEpisodicKeepUntil":
				preferences.set(constants.PREF_DEFAULT_KEEP_UNTIL, menuItem.value);
				configurationValue = pvrUtil.getString(menuItem.title);
				break;
			case "menuNonEpisodicBlockPlayback":
				preferences.set(constants.PREF_NON_EPISODIC_BLOCK_PLAYBACK, menuItem.value);
				configurationValue = pvrUtil.getString(menuItem.title);
				break;
			case "menuMaxNofEpisodes":
				PVROptionsUtil.setMaxEpisodicRecordings(menuItem.value);
				configurationValue = SettingsMenuHelper.getString("maxNofEpisodesOptions")[menuItem.value];
				break;
			case "menuEpisodicKeepUntil":
				preferences.set(constants.PREF_EPISODIC_KEEP_UNTIL, menuItem.value);
				configurationValue = pvrUtil.getString(menuItem.title);
				break;
			case "menuTypeOfEpisodes":
				preferences.set(constants.PREF_EPISODIC_TYPE_OF_EPISODES, menuItem.value);
				configurationValue = pvrUtil.getString(menuItem.title);
				break;
			case "menuEpisodicBlockPlayback":
				preferences.set(constants.PREF_EPISODIC_BLOCK_PLAYBACK, menuItem.value);
				configurationValue = pvrUtil.getString(menuItem.title);
				break;
			case "pvrPlaybackPlayer":
				preferences.set(constants.PREF_PLAYBACK_PLAYER_TIMEOUT, menuItem.value);
				configurationValue = SettingsMenuHelper.getString("playbackPlayerTimeouts")[menuItem.value];
				break;
			case "menuMenuLanguage":
				if (preferences.get(constants.PREF_LANGUAGE) !== menuItem.value) {
					preferences.set(constants.PREF_LANGUAGE, menuItem.value);
					controller.refreshMenuLanguage();
					changeMenuLanguage(menuItem.value);
					controller.restorePortalMenuFocus();
					$N.app.ClockDisplay.updateTime();
					isPassivateController = false;
				}
				break;
			case "menuAudioLanguage":
				if (preferences.get(constants.PREF_AUDIO_LANGUAGE) !== menuItem.value) {
					preferences.set(constants.PREF_AUDIO_LANGUAGE, menuItem.value);
					configurationValue = SettingsMenuHelper.getString("audioLanguage")[menuItem.value];
					if ($N.app.TracksUtil.isAudioTrackSelectable()) {
						$N.apps.util.EventManager.fire("settingsUpdated");
					}
				}
				break;
			case "menuSubtitle":
				if (preferences.get(constants.PREF_SUBTITLE_STATE) !== menuItem.value) {
					preferences.set(constants.PREF_SUBTITLE_STATE, menuItem.value);
					configurationValue = SettingsMenuHelper.getString("subtitleStates")[menuItem.value];
					subtitleLanguage = $N.app.TracksUtil.getLanguageForSubtitleTrackBasedOnPreference(menuItem.value);
					if (subtitleLanguage && (menuItem.value !== $N.app.constants.SUBTITLE_STATE_OFF)) {
						$N.app.fullScreenPlayer.tracks.activateSubtitleTrackByLanguage(subtitleLanguage);
					} else {
						$N.app.TracksUtil.deactivateCurrentSubtitleTrack();
					}
				}
				break;
			case "menuPhotoTransition":
				preferences.set(constants.PREF_USBDLNA_PHOTO_TRANSITION_EFFECTS, menuItem.value);
				configurationValue = SettingsMenuHelper.getString("transitionEffects")[menuItem.value];
				break;
			case "menuMiniguideDuration":
				preferences.set(constants.PREF_ZAPPING_BANNER_TIMEOUT, menuItem.value.toString());
				configurationValue = SettingsMenuHelper.getString("surferDurations")[menuItem.value];
				break;
			case "menuTipsFromNet":
				preferences.set(constants.PREF_DEFAULT_TIPSFROMNET, menuItem.value);
				configurationValue = pvrUtil.getString(menuItem.title);
				break;

			case "menuMiniguidePIP":
				preferences.set(constants.PREF_MINIGUIDE_PIP_POSITION, menuItem.value.toString());
				configurationValue = SettingsMenuHelper.getString("menuPipPositions")[menuItem.value];
				break;
			case 'menuDefaultFolder':
				isFolderRootFolder = $N.app.FolderUtil.isFolderRootFolder(menuItem.value);
				if (isFolderRootFolder) {
					preferences.set(constants.PVR_NON_EPISODIC_DEFAULT_FOLDER, constants.ROOT_PVR_FOLDER_NAME);
					configurationValue = SettingsMenuHelper.getString('pvrSettingsRecordingHighlights');
				} else {
					preferences.set(constants.PVR_NON_EPISODIC_DEFAULT_FOLDER, menuItem.value);
					configurationValue = menuItem.title;
				}
				break;
			case 'menuAspectRatio':
				if (settingsAPI.setAspectRatio(menuItem.value, menuItem.option)) {
					configurationValue = pvrUtil.getString(menuItem.title);
				}
				break;
			case 'menuDisplayFormat':
				if (settingsAPI.setSdVideoAspectMode(menuItem.value, menuItem.option)) {
					configurationValue = pvrUtil.getString(menuItem.title);
				}
				break;
			case 'menuHdDisplayFormat':
				if (settingsAPI.setHdVideoAspectMode(menuItem.value, menuItem.option)) {
					configurationValue = pvrUtil.getString(menuItem.title);
				}
				break;
			case 'menuHdmiAudioOutput':
				preferences.set($N.app.constants.PREF_SPDIF_AUDIO_TYPE, "", true);
				settingsAPI.setSpdifAudioType(menuItem.value, menuItem.option);
				if (settingsAPI.setHdmiAudioType(menuItem.value, menuItem.option)) {
					configurationValue = pvrUtil.getString(menuItem.title);
				}
				break;
			case "menuFrontPanelIntensity":
				if ($N.common.helper.FrontPanelManager.setFrontPanelIntensity(menuItem.option)) {
					configurationValue = pvrUtil.getString(menuItem.title);
				}
				break;
			case "menuFrontPanelDisplay":
				preferences.set(constants.PREF_FRONTPANEL_DISPLAY, menuItem.option);
				$N.common.helper.FrontPanelManager.setFrontPanelDisplay($N.app.constants.FRONTPANEL_DISPLAY_MODES.DEFAULT);
				configurationValue = pvrUtil.getString(menuItem.title);
				break;
			case 'menuResolution':
				if (settingsAPI.setHdmiVideoResolution(menuItem.value, menuItem.option)) {
					configurationValue = pvrUtil.getString(menuItem.title);
				}
				break;
			case 'menuAutoStandbyAfter':
				preferences.set(menuItem.constant, menuItem.value);
				$N.app.SystemUtil.setAndRefreshStandbyTimer();
				configurationValue = SettingsMenuHelper.getString("standbyDurations")[menuItem.value];
				break;
			case 'menuVideoSystem':
				preferences.set(menuItem.constant, menuItem.value, menuItem.absolutePath);
				configurationValue = pvrUtil.getString(menuItem.title);
				break;
			case 'menuAutoTuneChannel':
				configurationValue =  formatUtils.formatChannelNumber(menuItem.channelInfo.logicalChannelNum) + SINGLE_SPACE + menuItem.title;
				activeMenuItem.channelInfo = menuItem.channelInfo;
				channelInfo = $N.app.epgUtil.getServiceById(menuItem.serviceId);
				autoTuneHelper.setAutoTuneProperty("channel", menuItem.channelNumber + SINGLE_SPACE + menuItem.title);
				autoTuneHelper.setAutoTuneProperty("channelInfo", channelInfo);
				autoTuneHelper.setAutoTuneProperty("logicalChannelNum", channelInfo.logicalChannelNum);
				break;
			case 'menuAutoTuneFrequency':
				configurationValue =  menuItem.title;
				activeMenuItem.frequency = menuItem.value;
				autoTuneHelper.setAutoTuneProperty("frequency", menuItem.value);
				break;
			case 'facebookPinSetting':
				preferences.set(menuItem.constant, menuItem.value);
				configurationValue = $N.app.SocialActivityFactory.getPinSettingDisplayValue(menuItem.title);
				$N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK).resetPinTimer();
				break;
			case 'menuLocalServerName':
				configurationValue = menuItem.value;
				$N.platform.btv.WHPVRManager.setLocalName(configurationValue);
				break;
			case 'menuRecordLocation':
				$N.platform.btv.WHPVRManager.setCurrentRecordServer(menuItem.value);
				configurationValue = setCurrentRecordLocation(menuItem.value);
				break;
			default:
				preferences.set(menuItem.constant, menuItem.value);
				configurationValue = pvrUtil.getString(menuItem.title);
				break;
			}
			activeComponent.updateTickIconData();
			if (isPassivateController) {
				controller.passivate();
			}
			return configurationValue;
		}
		/**
		 * Does the job of updating the selected option
		 * @method updateActiveMenuItemData
		 * @private
		 */
		function updateActiveMenuItemData(configurationValue, paddingReturnObject) {
			var selectedIndex = null,
				componentData = null;
			if (paddingReturnObject === "paddingBeforeNonEpisodic" || paddingReturnObject === "paddingBeforeEpisodic" || paddingReturnObject === null) {
				controller.getActiveComponent().getActualSelectedItem().setFirstSubTitle(configurationValue);
				selectedIndex = controller.getActiveComponent().getActualSelectedRowIndex() - 1;
				componentData = controller.getActiveComponent().getData();
				componentData[selectedIndex].firstSubTitle = configurationValue;
				controller.getActiveComponent().updateDataAtIndex(selectedIndex, componentData[selectedIndex]);
			} else if (paddingReturnObject === "paddingAfterNonEpisodic" || paddingReturnObject === "paddingAfterEpisodic") {
				controller.getActiveComponent().getActualSelectedItem().setSecondSubTitle(configurationValue);
				selectedIndex = controller.getActiveComponent().getActualSelectedRowIndex() - 1;
				componentData = controller.getActiveComponent().getData();
				componentData[selectedIndex].secondSubTitle = configurationValue;
				controller.getActiveComponent().updateDataAtIndex(selectedIndex, componentData[selectedIndex]);
			}
		}

		/**
		 * Does the job of saving the selected option
		 * @method saveSelectedOptions
		 * @param {object} menuItem
		 * @private
		 */
		function saveSelectedOptions(menuItem) {
			var configurationValue = null;
			configurationValue = setData(menuItem, controller.getActiveMenuItem(), controller.getActiveComponent());
			return configurationValue;
		}

		/**
		 * method for removing a social account and
		 * displays back the account type option
		 * @method removeSocialAccount
		 * @private
		 * @param {Object} menuItem
		 */
		function removeSocialAccount(menuItem) {
			var socialAccountObject = $N.app.SocialActivityFactory.getSocialAccountObject(menuItem.socialAccountType),
				isAccountRemoved = false;
			socialAccountObject.showDisconnectAccountDialog(function (key) {
				if (key.action === DIALOG_YES_ACTION) {
					isAccountRemoved = socialAccountObject.disconnectAccount();
					controller.removeSocialAccountHandler(key);
				}
			});
		}

		function changeSocialAccount() {
			//to write moving to another pop up logic
		}

		/**
		 * method for checking the availability of
		 * configured required social account
		 * @method checkSocialAccountAvailability
		 * @private
		 * @param {Object} menuItem
		 */
		function checkSocialAccountAvailability(menuItem) {
			var activeComponent = controller.getActiveComponent(),
				socialAccountObject = $N.app.SocialActivityFactory.getSocialAccountObject(menuItem.socialAccountType);
			if (socialAccountObject.isAccountAvailable()) {
				menuItem.configs = formatUtils.getSocialAccountOptionsConfig();
				controller.itemSelected(menuItem, false);
			} else {
				socialAccountObject.showAccountAuthorisationDialog();
			}
		}

		/**
		 * Does the job of saving the selected option
		 * and replaces value in the list with selcted value
		 * @method saveAndExitSettingsOptions
		 * @param {object} menuItem
		 * @private
		 */
		function saveAndExitSettingsOptions(menuItem, isOKPressed, selectedItemObject) {
			var configurationValue = null;
			if (isOKPressed) {
				configurationValue = saveSelectedOptions(menuItem);
				if (configurationValue) {
					updateActiveMenuItemData(configurationValue, null);
				}
			}
		}

		function resetPaddingValues() {
			var PVROptionsUtil = $N.app.PVROptionsUtil,
				paddingItemObject,
				activeMenuItem;
			controller.passivate();
			activeMenuItem = controller.getActiveMenuItem();
			if (activeMenuItem.title === "menuNonEpisodicRecording") {
				paddingItemObject = controller.getActiveComponent().getActualSelectedItem();
				paddingItemObject.setFirstSubTitle(PVROptionsUtil.getBeforePadding() + SINGLE_SPACE + SettingsMenuHelper.getString('minutes'));
				paddingItemObject.setSecondSubTitle(PVROptionsUtil.getAfterPadding() + SINGLE_SPACE + SettingsMenuHelper.getString('minutes'));
			} else if (activeMenuItem.title === "menuEpisodicRecording") {
				paddingItemObject = controller.getActiveComponent().getActualSelectedItem();
				paddingItemObject.setFirstSubTitle(PVROptionsUtil.getBeforePaddingEpisodic() + SINGLE_SPACE + SettingsMenuHelper.getString('minutes'));
				paddingItemObject.setSecondSubTitle(PVROptionsUtil.getAfterPaddingEpisodic() + SINGLE_SPACE + SettingsMenuHelper.getString('minutes'));
			}
		}

		function resetAutoTuneStartDateValues() {
			var autoTuneStartDateItemObject = null;
			controller.passivate();
			autoTuneStartDateItemObject = controller.getActiveComponent().getActualSelectedItem();
			autoTuneStartDateItemObject.setFirstSubTitle(autoTuneHelper.getAutoTuneProperty('date'));
			refreshControllerActiveMenu();
		}

		function resetAutoTuneStartTimeValues() {
			var autoTuneStartDateItemObject = null;
			controller.passivate();
			autoTuneStartDateItemObject = controller.getActiveComponent().getActualSelectedItem();
			autoTuneStartDateItemObject.setFirstSubTitle(autoTuneHelper.getAutoTuneProperty('time'));
			autoTuneHelper.setAutoTuneProperty("isPresentTime", true);
			refreshControllerActiveMenu();
		}

		function showNumericKeypad(menuItem, keypadConfigObject) {
			var keypadSaveCallback = null,
				keyboardUtils = $N.app.KeyboardUtils,
				keyboardType = $N.app.KeyboardType,
				maxCharacters,
				keypad = null,
				keypadTitle = menuItem.customTitle || menuItem.title;

			keypadConfigObject = keypadConfigObject || menuItem.keypadConfigObject;
			keypad = controller.getKeypadComponent();
			keypad.setColorKeyCallbacks({
				"green" : null,
				"yellow" : null,
				"blue" : null,
				"red" : null
			});
			keypadSaveCallback = keypadConfigObject.keypadSaveCallback;
			keyboardUtils.setKeypad(keypad, keyboardType.NUMERIC);
			keypad.setMaxNumericKeypadValue(keypadConfigObject.maximumNumericValue);
			if (keypadConfigObject.minimumNumericValue) {
				keypad.setMinNumericKeypadValue(keypadConfigObject.minimumNumericValue);
			}
			maxCharacters = (keypadConfigObject.maximumNumericValue.toString()).length;
			keypad.setExitCallback(keypadConfigObject.keypadExitCallback);
			keypad.setKeypadTitle(SettingsMenuHelper.getString(keypadTitle));
			if (keypadSaveCallback) {
				keyboardUtils.setKeypadReturnObject(keypadConfigObject.keypadReturnObject);
				keyboardUtils.setSaveCallback(keypadSaveCallback);
			}
			keypad.clearInput();
			keypad.configure({
				cursorEnable: false,
				textInputAlignment: keyboardType.ALIGNMENT.CENTRE
			});
			keyboardUtils.showKeypad(keyboardType.NUMERIC);
			keypad.focus();
			keypad.show();
		}

		function setTimeKeypad() {
			var keypad = controller.getKeypadComponent();
			keypad.clearInput();
			keypad.setInputFormat(2, 2, ":");
		}

		function setDateKeypad() {
			var keypad = controller.getKeypadComponent();
			keypad.clearInput();
			keypad.setInputFormat(2, 2, "/");
		}

		function showDateKeypad(menuItem, keypadConfigObject) {
			var keypadSaveCallback = null,
				keyboardUtils = $N.app.KeyboardUtils,
				keyboardType = $N.app.KeyboardType,
				keypad = null;

			keypadConfigObject = keypadConfigObject || menuItem.keypadConfigObject;
			keypad = controller.getKeypadComponent();
			keypad.setColorKeyCallbacks({
				"green" : null,
				"yellow" : null,
				"blue" : null,
				"red" : null
			});
			keypad.resetKeyPadConfig();
			keypadSaveCallback = keypadConfigObject.keypadSaveCallback;
			keyboardUtils.setKeypad(keypad, keyboardType.NUMERIC);
			keypad.setExitCallback(keypadConfigObject.keypadExitCallback);
			keypad.setKeypadTitle(SettingsMenuHelper.getString(menuItem.title));
			if (keypadSaveCallback) {
				keyboardUtils.setKeypadReturnObject(keypadConfigObject.keypadReturnObject);
				keyboardUtils.setSaveCallback(keypadSaveCallback);
			}
			setDateKeypad();
			keypad.configure({
				cursorEnable: false,
				textInputAlignment: keyboardType.ALIGNMENT.CENTRE
			});
			keyboardUtils.showKeypad(keyboardType.NUMERIC);
			keypad.setKeypadTitle(SettingsMenuHelper.getString("menuAutoTuneStartDateEdit"));
			keypad.focus();
			keypad.show();
		}

		function showTimeKeypad(menuItem, keypadConfigObject) {
			var keypadSaveCallback = null,
				keyboardUtils = $N.app.KeyboardUtils,
				keyboardType = $N.app.KeyboardType,
				keypad = null;

			keypadConfigObject = keypadConfigObject || menuItem.keypadConfigObject;
			keypad = controller.getKeypadComponent();
			keypad.setColorKeyCallbacks({
				"green" : null,
				"yellow" : null,
				"blue" : null,
				"red" : null
			});
			keypad.resetKeyPadConfig();
			keypadSaveCallback = keypadConfigObject.keypadSaveCallback;
			keyboardUtils.setKeypad(keypad, keyboardType.NUMERIC);
			keypad.setExitCallback(keypadConfigObject.keypadExitCallback);
			keypad.setKeypadTitle(SettingsMenuHelper.getString(menuItem.title));
			if (keypadSaveCallback) {
				keyboardUtils.setKeypadReturnObject(keypadConfigObject.keypadReturnObject);
				keyboardUtils.setSaveCallback(keypadSaveCallback);
			}
			setTimeKeypad();
			keypad.configure({
				cursorEnable: false,
				textInputAlignment: keyboardType.ALIGNMENT.CENTRE
			});
			keyboardUtils.showKeypad(keyboardType.NUMERIC);
			keypad.setKeypadTitle(SettingsMenuHelper.getString("menuAutoTuneStartTimeEdit"));
			keypad.focus();
			keypad.show();
		}

		savePaddingWithKeypad = function (paddingReturnObject) {
			var PVROptionsUtil = $N.app.PVROptionsUtil,
				paddingItemObject = null,
				configurationValue = null,
				paddingItem = controller.getActiveMenuItem(),
				paddingValue = paddingReturnObject.value;
			if (paddingValue) {
				paddingValue = parseInt(paddingValue, 10);
				controller.passivate();
				paddingItemObject = controller.getActiveComponent().getActualSelectedItem();
				switch (paddingReturnObject.key) {
				case "paddingBeforeNonEpisodic":
					PVROptionsUtil.setBeforePadding(paddingValue);
					configurationValue = paddingValue + SINGLE_SPACE + SettingsMenuHelper.getString('minutes');
					updateActiveMenuItemData(configurationValue, paddingReturnObject.key);
					controller.getActiveComponent()._selectItem(paddingItem);
					paddingItemObject.setFirstSubTitle(configurationValue);
					showNumericKeypad({"title" : "paddingAfterNonEpisodic"}, {
						keypadReturnObject : {
							"key" : "paddingAfterNonEpisodic",
							"value" : null
						},
						keypadSaveCallback : savePaddingWithKeypad,
						keypadExitCallback : resetPaddingValues,
						maximumNumericValue : 100
					});
					break;
				case "paddingAfterNonEpisodic":
					PVROptionsUtil.setAfterPadding(paddingValue);
					paddingItemObject.setFirstSubTitle(PVROptionsUtil.getBeforePadding() + SINGLE_SPACE + SettingsMenuHelper.getString('minutes'));
					configurationValue = paddingValue + SINGLE_SPACE + SettingsMenuHelper.getString('minutes');
					updateActiveMenuItemData(configurationValue, paddingReturnObject.key);
					paddingItemObject.setSecondSubTitle(configurationValue);
					break;
				case "paddingBeforeEpisodic":
					PVROptionsUtil.setBeforePaddingEpisodic(paddingValue);
					configurationValue = paddingValue + SINGLE_SPACE + SettingsMenuHelper.getString('minutes');
					updateActiveMenuItemData(configurationValue, paddingReturnObject.key);
					controller.getActiveComponent()._selectItem(paddingItem);
					paddingItemObject.setFirstSubTitle(configurationValue);
					showNumericKeypad({"title" : "paddingAfterEpisodic"}, {
						keypadReturnObject : {
							"key" : "paddingAfterEpisodic",
							"value" : null
						},
						keypadSaveCallback : savePaddingWithKeypad,
						keypadExitCallback : resetPaddingValues,
						maximumNumericValue : 100
					});
					break;
				case "paddingAfterEpisodic":
					PVROptionsUtil.setAfterPaddingEpisodic(paddingValue);
					paddingItemObject.setFirstSubTitle(PVROptionsUtil.getBeforePaddingEpisodic() + SINGLE_SPACE + SettingsMenuHelper.getString('minutes'));
					configurationValue = paddingValue + SINGLE_SPACE + SettingsMenuHelper.getString('minutes');
					updateActiveMenuItemData(configurationValue, paddingReturnObject.key);
					paddingItemObject.setSecondSubTitle(configurationValue);
					break;
				}
			} else {
				resetPaddingValues();
			}
		};

		/**
		 * Method to back to previous record server
		 * @method restoreLocalServerName
		 * @private
		 */
		function restoreLocalServerName() {
			var itemObject;
			controller.passivate();
			itemObject = controller.getActiveComponent().getActualSelectedItem();
			itemObject.setFirstSubTitle($N.platform.btv.WHPVRManager.getLocalName());
		}

		/**
		 * Method to set recorded server
		 * @method saveLocalServerNameWithKeypad
		 * @private
		 * @param {String} New local server name
		 */
		function saveLocalServerNameWithKeypad(newName) {
			var tvNameItem = null,
				component = null,
				selectedIndex = null,
				componentData = null;

			controller.passivate();
			component = controller.getActiveComponent();
			if (newName) {
				component.getActualSelectedItem().setFirstSubTitle(newName);
				selectedIndex = component.getActualSelectedRowIndex() - 1;
				componentData = component.getData();
				componentData[selectedIndex].firstSubTitle = newName;
				controller.getActiveComponent().updateDataAtIndex(selectedIndex, componentData[selectedIndex]);

				$N.platform.btv.WHPVRManager.setLocalName(newName.toString());
			}
		}

		function showLocalServerNameKeypad(menuItem) {
			var keypadSaveCallback = null,
				MAX_CHARACTERS = 18,
				keypadConfigObject = menuItem.keypadConfigObject,
				keyboardUtils = $N.app.KeyboardUtils,
				keyboardType = $N.app.KeyboardType,
				keypad = controller.getKeypadComponent(),
				keypadTitle = menuItem.customTitle || menuItem.title;

			keypad.resetKeyPadConfig();
			keyboardUtils.setKeypad(keypad, keyboardType.ALPHA_NUMERIC_UPPERCASE);

			keypad.setExitCallback(keypadConfigObject.keypadExitCallback);
			keypad.setKeypadTitle(SettingsMenuHelper.getString(keypadTitle));
			keypad.setColorKeyCallbacks({
				"green" : saveLocalServerNameWithKeypad
			});

			keypad.clearInput();
			keypad.configure({
				cursorEnable: true,
				textInputAlignment: keyboardType.ALIGNMENT.LEFT,
				labelAutoAlign: true,
				maxCharacters : MAX_CHARACTERS,
				clippedWidth: CLIPPED_WIDTH_FOR_ALPHANUM_KEYPAD
			});
			keyboardUtils.showKeypad(keyboardType.ALPHA_NUMERIC_UPPERCASE);
			keypad.focus();
			keypad.show();
		}

		function saveParentalRatingOption(menuItem, isOKPressed, selectedItemObject) {
			if (isOKPressed) {
				settingsAPI.setMoralityLevel(menuItem.morality);
				controller.getActiveComponent().displayData();
			}
		}

		function createPinEntry(configObject) {
			if (!pinHelper) {
				pinHelper = new $N.app.PinHelper(configObject.successfullAuthenticationCallback, null, null, null, 0, true);
			}
			pinHelper.setDialogProperties({
				x: 0,
				y: 0,
				width: 1920,
				height: 1080,
				id: configObject.pinDialogId,
				eventImageVisibility: configObject.eventImageVisibility,
				titleImage: configObject.titleImage,
				title: configObject.title,
				description: configObject.description,
				cancelCallback: function () {
					pinHelper.hideDialog();
				}
			});
			if (configObject.successfullAuthenticationCallback) {
				pinHelper.setAuthenticationSuccessCallback(configObject.successfullAuthenticationCallback);
			}
			if (configObject.okCallback) {
				pinHelper.pinDialog._dialogGUIObject.setOkCallback(configObject.okCallback);
			}
			$N.app.VolumeControl.hide();
		}

		function validateAndDisplayAdultPurchases(menuItem) {
			var pinConfig = {
				"successfullAuthenticationCallback" : function () {
					menuItem.configs = formatUtils.getPurchasesConfig();
					controller.itemSelected(menuItem, false);
				},
				"okCallback" : null,
				"pinDialogId" : "displayAdultPurchases",
				"pinType" : "master",
				"showTillAuthenticated" : true,
				"title": SettingsMenuHelper.getString("contentBlocked"),
				"description" : SettingsMenuHelper.getString("contentBlockedMessage")
			};
			createPinEntry(pinConfig);
			pinHelper.showPinDialog('master', false, null, true);
		}

		function displayParentalRatingOptions() {
			var activeComponent = controller.getActiveComponent(),
				menuItem = activeComponent.getData()[activeComponent.getSelectedItemIndex() - 1];
			menuItem.configs = formatUtils.getParentalRatingsConfig();
			controller.itemSelected(menuItem, false);
		}

		function setupBlocksSubMenu(menuItem, isOKPressed, selectedItemObject) {
			createPinEntry(menuItem.pinConfigObject);
			pinHelper.showPinDialog('master', false, null, true);
		}

		/**
		 * display blocks sub menu on successfull blocks/pins authentication
		 * @method displayBlocksSubMenu
		 */
		function displayBlocksSubMenu() {
			var activeComponent = controller.getActiveComponent(),
				menuItem = activeComponent.getData()[activeComponent.getSelectedItemIndex() - 1];
			menuItem.configs = formatUtils.getBlocksSubMenuConfig();
			controller.itemSelected(menuItem, false);
			controller.redrawMenuFromActiveStack();
			controller.getActiveComponent().focus();
		}

		/**
		 * Selects the tuned channel in the auto tune list
		 * Used as a successcallback for the auto tune channel change menu
		 * @method selectTunedChannel
		 * @param {object, boolean, object}
		 * dataobject of the item selected, flag to see if OK was pressed, template object that was selected
		 */
		function selectTunedChannel(menuItem, isOKPressed, selectedItemObject) {
			var currentChannelServiceId = (!menuItem) ? $N.app.epgUtil.getChannelFromPrefs() : menuItem.channelInfo.serviceId,
				activeComponent = controller.getActiveComponent(),
				indexOfService = null;
			if (currentChannelServiceId && (activeComponent.getSize() > 0)) {
				indexOfService = activeComponent.getIndexByUniqueData("serviceId", currentChannelServiceId.toString());
				if (indexOfService) {
					activeComponent.selectItemAtIndex(indexOfService + 1, true);
				}
			}
			controller.scrollIndicatorHandler(activeComponent, controller.getActiveMenuScrollComponent());
		}

		/**
		 * method to display the all channels list
		 * and blocked channels list
		 * @method displayBlockChannelMenu
		 * @private
		 */
		function displayBlockChannelMenu() {
			var activeComponent = controller.getActiveComponent(),
				menuItem = null;
			if (activeComponent && activeComponent.getSelectedItemIndex() >= 1) {
				menuItem = activeComponent.getData()[activeComponent.getSelectedItemIndex() - 1];
				menuItem.configs = formatUtils.getBlockChannelMenuConfig();
				controller.itemSelected(menuItem, false);
				selectTunedChannel();
				controller.footerUIHandler(controller.getDoubleMenufooterConfig("allChannels", "allChannelsList").footerConfig);
			}
			$N.app.ChannelManager.resetGenreToggling();
			controller.setExitCallback(function () {
				$N.app.ChannelManager.saveBlockedChannelsList();
			});
		}

		function setupBlockChannels(menuItem, isOKPressed, selectedItemObject) {
			var morality = settingsAPI.getMoralityLevel();
			if (morality && morality > 0) {
				createPinEntry(menuItem.pinConfigObject);
				pinHelper.showPinDialog(menuItem.pinConfigObject.pinType, false, null, true);
			} else {
				displayBlockChannelMenu();
			}
		}

		/**
		 * method for managing the data obtained from
		 * channel manager to toggle channel list with
		 * different genres
		 * @method manageChannelTogglingByGenre
		 * @private
		 */
		function manageChannelTogglingByGenre() {
			var channelsByGenreObj = $N.app.ChannelManager.toggleChannelsByGenre(),
				genreTitle = channelsByGenreObj.genreTitle,
				channelList = channelsByGenreObj.channelList,
				activeComponent = controller.getActiveComponent();
			controller.setSubMenuTitle(genreTitle, "firstSubMenuTitle");
			activeComponent.setData(formatUtils.formatFavouriteBlockChannelsData(channelList));
			activeComponent.displayData();
			selectTunedChannel();
			controller.footerUIHandler(controller.getDoubleMenufooterConfig("allChannels", "allChannelsList").footerConfig);
		}

		function defaultPinChangeHandler(isSaved) {
			var pinConfig = controller.getActiveComponent()._data.getSelectedItem().confirmPinConfigObject;
			if (isSaved) {
				$N.app.ErrorMessage.showPinChangeSuccessDialog(pinConfig.pinType);
			}
			pinHelper.hideDialog();
		}

		/**
		 * method for displaying pop up messages based
		 * on whether the PIN was saved or not
		 * @method facebookPinChangeHandler
		 * @private
		 * @param {Boolean} isSaved
		 */
		function facebookPinChangeHandler(isSaved) {
			var socialAccountObject = $N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK);
			if (isSaved) {
				socialAccountObject.showFacebookPinChangeSuccessDialog();
			} else {
				socialAccountObject.showFacebookPinChangeFailureDialog();
			}
			pinHelper.hideDialog();
		}

		/**
		 * method for displaying pop up message due to
		 * dissimilarity between facebook's new pin and confirmation pin
		 * @method facebookPinMismatchErrorHandler
		 * @private
		 */
		function facebookPinMismatchErrorHandler() {
			$N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK).showFacebookPinMismatchDialog();
		}

		function savePin(pin) {
			var pinConfig = controller.getActiveComponent()._data.getSelectedItem().confirmPinConfigObject,
				isPinSaved;
			pinHelper.hideDialog();
			if (pinHelper.newPin === pin) {
				if (pinConfig.pinType === "master") {
					$N.platform.ca.PINHandler.setLocalMasterPin(pin, pinConfig.pinChangeHandler);
				} else {
					isPinSaved = pinConfig.absolutePath ? preferences.set(pinConfig.pinPath, pin, pinConfig.absolutePath) : preferences.set(pinConfig.pinPath, pin);
					pinConfig.pinChangeHandler(isPinSaved);
				}
			} else {
				pinConfig.pinMismatchHandler();
			}
		}

		function confirmPinEntry(pin) {
			var pinConfig = controller.getActiveComponent()._data.getSelectedItem().confirmPinConfigObject;
			if (pin.length < constants.MAX_PIN_DIGITS) {
				pinHelper.customiseDialog({
					description: SettingsMenuHelper.getString("wrongPin") + SettingsMenuHelper.getString("tryAgain"),
					reset: true
				});
			} else {
				pinHelper.hideDialog();
				createPinEntry(pinConfig);
				pinHelper.newPin = pin;
				pinHelper.showPinDialog(pinConfig.pinType, false, null, true);
			}
		}

		function confirmSocialPinEntry(pin) {
			var pinConfig = controller.getActiveComponent()._data.getSelectedItem().confirmPinConfigObject;
			if (preferences.get(pinConfig.pinPath) !== pin) {
				confirmPinEntry(pin);
			} else {
				pinHelper.customiseDialog({
					description: SettingsMenuHelper.getString("enterDifferentPin"),
					reset: true
				});
			}
		}

		function newPinEntry() {
			var pinConfig = controller.getActiveComponent()._data.getSelectedItem().newPinConfigObject;
			pinHelper.hideDialog();
			createPinEntry(pinConfig);
			pinHelper.showPinDialog(pinConfig.pinType, false, null, true);
		}

		function setupPinChange(menuItem, isOKPressed, selectedItemObject) {
			createPinEntry(menuItem.pinConfigObject);
			pinHelper.showPinDialog(menuItem.pinConfigObject.pinType, menuItem.pinConfigObject.showTillAuthenticated || false, null, true);
		}

		/**
		 * method for displaying pop up message due to
		 * dissimilarity between new pin and confirmation pin
		 * @method defaultPinMismatchErrorHandler
		 * @private
		 */
		function defaultPinMismatchErrorHandler() {
			$N.app.ErrorMessage.hidePinMismatchDialog();
			$N.app.ErrorMessage.showPinMismatchDialog(newPinEntry);
		}

		/**
		 * method for displaying social account information
		 * @method showSocialAccount
		 * @private
		 * @param {Object} menuItem
		 */
		function showSocialAccount(menuItem) {
			var socialAccountObject = $N.app.SocialActivityFactory.getSocialAccountObject(menuItem.socialAccountType),
				isMenuDrawn = true,
				accountInformation = null;
			if (!menuItem.configs) {
				menuItem.configs =  formatUtils.getSocialAccountInformationConfig();
				isMenuDrawn = false;
			}
			accountInformation = socialAccountObject.getAccountInformation();
			controller.showSocialAccountInformation(menuItem, accountInformation, isMenuDrawn);
		}

		/**
		 * method used for getting the valid date format
		 * used by the Auto tune menu.
		 * returns false if invalid
		 * @method getValidDate
		 * @private
		 * @param {String} date
		 */
		function getValidDate(date) {
			var presentDate = new Date(),
				dateTimeUtil = $N.app.DateTimeUtil,
				keypad = controller.getKeypadComponent();
			date = $N.apps.util.Util.removeSpaces(date);
			presentDate = date;
			date = presentDate.split("/");

			if (dateTimeUtil.isValidDate(parseInt(date[2], 10), parseInt(date[1], 10), parseInt(date[0], 10))) {
				if (!dateTimeUtil.isDateInFuture(parseInt(date[2], 10), parseInt(date[1], 10), parseInt(date[0], 10))) {
					date[2] = parseInt(date[2], 10) + 1; //Incrementing the year if the date is in past
				}
				presentDate = date.join("/");
				return presentDate;
			} else {
				$N.app.ErrorMessage.showInvalidDateDialog(function () {
					setDateKeypad();
				});
				return false;
			}
		}
		/**
		 * method used for getting the valid time format
		 * used by the Auto tune menu.
		 * returns false if invalid
		 * @method getValidTime
		 * @private
		 * @param {String} time
		 */
		function getValidTime(time) {
			var keypad = controller.getKeypadComponent(),
				newTime = time.split(":");

			if ($N.app.DateTimeUtil.isValidTime(newTime[0], newTime[1])) {
				return time;
			} else {
				$N.app.ErrorMessage.showInvalidTimeDialog(function () {
					setTimeKeypad();
				});
				return false;
			}
		}


		/**
		 * callback method used to save the date and time
		 * for the auto tune menu
		 * @method saveAutoTuneDateTime
		 * @private
		 * @param {Object} autoTuneDateTimeReturnObject
		 */
		saveAutoTuneDateTime = function (autoTuneDateTimeReturnObject) {
			var autoTuneStartDateTimeItemObject = null,
				autoTuneStartDateTimeItem = controller.getActiveMenuItem(),
				activeComponent = null,
				autoTuneStartDateTimeValue = $N.apps.util.Util.removeSpaces(autoTuneDateTimeReturnObject.value),
				isValid = false;

			if (autoTuneStartDateTimeValue) {
				if (autoTuneDateTimeReturnObject.key === "autoTuneStartDate") {
					autoTuneStartDateTimeItem.date = getValidDate(autoTuneStartDateTimeValue.concat("/" + new Date().getUTCFullYear()));
					isValid = autoTuneStartDateTimeItem.date;
				} else if (autoTuneDateTimeReturnObject.key === "autoTuneStartTime") {
					autoTuneStartDateTimeItem.time = getValidTime(autoTuneStartDateTimeValue);
					isValid = autoTuneStartDateTimeItem.time;
				}
				autoTuneHelper.setAutoTuneProperty("isPresentTime", true);
				if (isValid !== false) {
					controller.passivate();
					autoTuneStartDateTimeItemObject = controller.getActiveComponent().getActualSelectedItem();
					if (autoTuneDateTimeReturnObject.key === "autoTuneStartDate") {
						autoTuneHelper.setAutoTuneProperty("date", autoTuneStartDateTimeItem.date);
						autoTuneStartDateTimeItemObject.setFirstSubTitle(autoTuneStartDateTimeItem.date);
						updateActiveMenuItemData(autoTuneStartDateTimeItem.date, null);
					} else if (autoTuneDateTimeReturnObject.key === "autoTuneStartTime") {
						autoTuneHelper.setAutoTuneProperty("time", autoTuneStartDateTimeValue);
						autoTuneHelper.setAutoTuneProperty("isPresentTime", false);
						autoTuneStartDateTimeItemObject.setFirstSubTitle(autoTuneStartDateTimeValue);
						updateActiveMenuItemData(autoTuneStartDateTimeValue, null);
					}
				}
			} else {
				if (autoTuneDateTimeReturnObject.key === "autoTuneStartDate") {
					resetAutoTuneStartDateValues();
				} else if (autoTuneDateTimeReturnObject.key === "autoTuneStartTime") {
					resetAutoTuneStartTimeValues();
				}
			}
			refreshControllerActiveMenu();
		};

		/**
		 * resets the padding values with underscores
		 * and then displays the keypad to change them
		 * @method setupPaddingChange
		 * @param {object, boolean, object}
		 * dataobject of the item selected, flag to see if OK was pressed, template object that was selected
		 */
		function setupPaddingChange(menuItem, isOKPressed, selectedItemObject) {
			selectedItemObject.setFirstSubTitle('_ _ _ ' + SettingsMenuHelper.getString('minutes'));
			selectedItemObject.setSecondSubTitle('_ _ _ ' + SettingsMenuHelper.getString('minutes'));
			showNumericKeypad(menuItem);
		}

		/**
		 * Retrieve the preference for "keep until" from
		 * configman and map a string to display
		 * @method keepUntilStringMapping
		 */
		function keepUntilStringMapping(preferenceStoredKeepUntil) {
			var index,
				keepUntilSubtitle,
				mapToString = [
					{
						key : constants.KEEP_UNTIL_OPTION_MANUAL_DELETE,
						value : pvrUtil.getString("pvrManualDelete")
					},
					{
						key : constants.KEEP_UNTIL_OPTION_SPACE_NEEDED,
						value : pvrUtil.getString("pvrSpaceNeeded")
					}
				];
			for (index = 0; index < (mapToString.length); index++) {
				if (preferenceStoredKeepUntil === mapToString[index].key) {
					keepUntilSubtitle = mapToString[index].value;
				}
			}
			return keepUntilSubtitle;
		}

		/**
		 * Retrieve the preference for "Type of Episode" from
		 * configman and map a string to display
		 * @method typeOfEpisodesStringMapping
		 */
		function typeOfEpisodesStringMapping(preferenceStoredTypeOfEpisodes) {
			var index,
				typeOfEpisodesSubtitle,
				mapToString = [
					{
						key : constants.TYPE_OF_EPISODE_OPTION_ALL_EPISODE,
						value : pvrUtil.getString("pvrTypeAllEpisodes")
					},
					{
						key : constants.TYPE_OF_EPISODE_OPTION_JUST_THIS_EPISODE,
						value : pvrUtil.getString("pvrJustThisEpisode")
					}
				];
			for (index = 0; index < (mapToString.length); index++) {
				if (preferenceStoredTypeOfEpisodes === mapToString[index].key) {
					typeOfEpisodesSubtitle = mapToString[index].value;
				}
			}
			return typeOfEpisodesSubtitle;
		}

		/**
		 * resets the date values with underscores
		 * and then displays the keypad to change them
		 * @method setupDateChange
		 * @param {object, boolean, object}
		 * dataobject of the item selected, flag to see if OK was pressed, template object that was selected
		 */
		function setupDateChange(menuItem, isOKPressed, selectedItemObject) {
			selectedItemObject.setFirstSubTitle('_ _ / _ _');
			showDateKeypad(menuItem);
		}

		/**
		 * resets the time values with underscores
		 * and then displays the keypad to change them
		 * @method setupTimeChange
		 * @param {object, boolean, object}
		 * dataobject of the item selected, flag to see if OK was pressed, template object that was selected
		 */
		function setupTimeChange(menuItem, isOKPressed, selectedItemObject) {
			selectedItemObject.setFirstSubTitle('_ _ : _ _');
			showTimeKeypad(menuItem);
		}

		function setupLipsyncChange(menuItem, isOKPressed, selectedItemObject) {
			selectedItemObject.setFirstSubTitle('_ _ _ ' + SettingsMenuHelper.getString("milliSeconds"));
			showNumericKeypad(menuItem);
		}

		/**
		 * resets the lipsync values with older preffered value
		 * when user quits the keypad.
		 * @method resetLipsyncValues
		 */
		function resetLipsyncValues() {
			var lipsyncDelayItemObject = null,
				prefferredLipsyncDelay,
				isAbsolutePath = true;
			controller.passivate();
			prefferredLipsyncDelay = preferences.get(constants.PREF_AUDIO_LIPSYNC_DELAY, isAbsolutePath);
			lipsyncDelayItemObject = controller.getActiveComponent().getActualSelectedItem();
			lipsyncDelayItemObject.setFirstSubTitle(prefferredLipsyncDelay + SINGLE_SPACE + SettingsMenuHelper.getString("milliSeconds"));
		}

		function saveLipsyncDelay(lipsyncDelayReturnObject) {
			var lipsyncDelayItemObject = null,
				lipsyncDelayItem = controller.getActiveMenuItem(),
				lipsyncDelayValue = parseInt(lipsyncDelayReturnObject.value, 10),
				configurationValue,
				isAbsolutePath = true;
			if (!isNaN(lipsyncDelayValue)) {
				preferences.set(constants.PREF_AUDIO_LIPSYNC_DELAY, lipsyncDelayValue, isAbsolutePath);
				settingsAPI.setAudioDelay();
				controller.passivate();
				lipsyncDelayItemObject = controller.getActiveComponent().getActualSelectedItem();
				configurationValue = lipsyncDelayValue + SINGLE_SPACE + SettingsMenuHelper.getString("milliSeconds");
				updateActiveMenuItemData(configurationValue, null);
				lipsyncDelayItemObject.setFirstSubTitle(configurationValue);
			} else {
				resetLipsyncValues();
			}
		}

		/**
		 * resets the time values with underscores
		 * and then displays the keypad to change them
		 * @method setupPhotoAndPlayerDurationChange
		 * @param {object, object}
		 * dataobject of the item selected, flag to see if OK was pressed, template object that was selected
		 */
		function setupPhotoAndPlayerDurationChange(menuItem, isOKPressed, selectedItemObject) {
			selectedItemObject.setFirstSubTitle('_ _ ' + SettingsMenuHelper.getString("optionSeconds"));
			showNumericKeypad(menuItem);
		}
		/**
		 * safely removes the USB media used for media browsing
		 * @method safelyRemoveUSBMedia
		 */
		function safelyRemoveUSBMedia() {
			var usbMediaID = $N.app.HotPlug.getConnectedUSBMediumID();
			if (usbMediaID) {
				$N.app.HotPlug.safelyRemoveUSBMedia(usbMediaID);
			}
		}
		/**
		 * resets the time values with previous values when we cancel the numeric keypad
		 * @method resetPhotoDisplayDuration
		 */
		function resetPhotoDisplayDuration() {
			var displayDurationItemObject = null,
				prefferredPhotoDisplayDuration;
			controller.passivate();
			prefferredPhotoDisplayDuration = preferences.get(constants.PREF_USBDLNA_PHOTO_DISPLAY_DURATION);
			displayDurationItemObject = controller.getActiveComponent().getActualSelectedItem();
			displayDurationItemObject.setFirstSubTitle(prefferredPhotoDisplayDuration + SINGLE_SPACE + SettingsMenuHelper.getString("optionSeconds"));
		}

		function resetPlayerBannerDuration() {
			var playerDurationItemObject = null,
				prefferredPlayerDuration;
			controller.passivate();
			prefferredPlayerDuration = preferences.get(constants.PREF_USBDLNA_PLAYER_BANNER_TIMEOUT);
			playerDurationItemObject = controller.getActiveComponent().getActualSelectedItem();
			playerDurationItemObject.setFirstSubTitle(prefferredPlayerDuration + SINGLE_SPACE + SettingsMenuHelper.getString("optionSeconds"));
		}

		/**
		 * save the photo and player display duration into the configman when we change
		 * the time values from onscreen numeric keypad
		 * @method savePhotoAndPlayerDisplayDuration
		 * @param {object}
		 * keypadReturnObject on select of values from keypad
		 */
		function savePhotoAndPlayerDisplayDuration(displayDurationReturnObject) {
			var displayDurationItemObject = null,
				displayDurationItem = controller.getActiveMenuItem(),
				displayDurationValue = displayDurationReturnObject.value,
				configurationValue;
			if (displayDurationValue) {
				if (displayDurationReturnObject.key === "mediaPhotoDisplayDuration") {
					preferences.set(constants.PREF_USBDLNA_PHOTO_DISPLAY_DURATION, parseInt(displayDurationValue, 10));
				} else if (displayDurationReturnObject.key === "mediaPlayerDuration") {
					preferences.set(constants.PREF_USBDLNA_PLAYER_BANNER_TIMEOUT, parseInt(displayDurationValue, 10));
				}
				controller.passivate();
				displayDurationItemObject = controller.getActiveComponent().getActualSelectedItem();
				configurationValue = displayDurationValue + SINGLE_SPACE + SettingsMenuHelper.getString("optionSeconds");
				updateActiveMenuItemData(configurationValue, null);
				displayDurationItemObject.setFirstSubTitle(configurationValue);
			} else {
				if (displayDurationReturnObject.key === "mediaPhotoDisplayDuration") {
					resetPhotoDisplayDuration();
				} else if (displayDurationReturnObject.key === "mediaPlayerDuration") {
					resetPlayerBannerDuration();
				}
			}
		}

		function isPinDisplayed() {
			if (pinHelper) {
				return pinHelper.isPinShowing();
			} else {
				return false;
			}
		}

		return {

			/**
			 * function with switch on menu Id
			 * to get the data for respective menu
			 * @method getData
			 * @public
			 * @param {string} id
			 * @return {Array} The final result.
			 */
			getData : function (id, activeMenuItem, componentId) {
				var PVROptionsUtil = $N.app.PVROptionsUtil,
					systemObject,
					smartCardObject,
					notAvailableText = SettingsMenuHelper.getString("notAvailable"),
					stbDataObj,
					diagnosticsDataObj,
					allMailsObject,
					preferenceStoredKeepUntil,
					keepUntilConfig,
					blockPlaybackConfig,
					isPreferenceStoredBlock,
					DVBCProfilePath,
					modulationValue,
					modulationType,
					networkInterfaceDocsis,
					CABLE_MODEM = 0,
					data = null,
					preferedMenuLanguage,
					preferedAudioLanguage,
					preferedSubtitle,
					preferedPhotoDisplayDuration,
					preferedPhotoTransition,
					preferedPlayerDuration,
					preferedDuration,
					preferedTipsFromNet,
					preferedPipPosition,
					channelData,
					favoritesData,
					preferedFrontPanelDisplay,
					preferedFrontPanelIntensity,
					preferedVideoSystem,
					preferedAspectRatio,
					preferedDisplayFormat,
					preferedResolution,
					preferedAudioFormat,
					preferedLipSync,
					preferenceStoredTypeOfEpisodes,
					typeOfEpisodesConfig,
					preferencePlaybackPlayerTimeout,
					autoTuneProperty,
					activeSettingsMenuItem = activeMenuItem,
					preferedAutoShutDown,
					socialAccountObject,
					currentRecordServerName = "",
					IS_PATH_ABSOLUTE = true,
					EXPONENT_BASE = 2,
					ppvPurchases = [],
					vodPurchases = [],
					dvlObject,
					chipsetType,
					chipsetRevision,
					cakRevision = SettingsMenuHelper.getString("cakRevision"),
					mocaConfig = $N.app.MoCAManager.getCurrentConfiguration();

				switch (id) {
				case 'menuSystem':
					data = formatUtils.formatSystemMenuData();
					break;
				case 'menuPosts':
					data = $N.app.MessageUtil.getMessageMails();
					break;
				case 'menuRecorderPreferences':
					data = [
						{
							"title" : "menuNonEpisodicRecording"
						},
						{
							"title" : "menuEpisodicRecording"
						},
						{
							"title" : "menuPlaybackPlayer"
						},
						{
							"title" : "menuDiskDrive"
						}
					];
					if ($N.app.FeatureManager.isWHPVREnabled()) {
						data.push({"title" : "menuWholeHomePvr"});
					}
					data = formatUtils.formatRecorderSettingsMenuData(data);
					break;
				case 'menuNonEpisodicRecording':
					preferenceStoredKeepUntil = preferences.get(constants.PREF_DEFAULT_KEEP_UNTIL);
					keepUntilConfig = keepUntilStringMapping(preferenceStoredKeepUntil);

					isPreferenceStoredBlock = preferences.get(constants.PREF_NON_EPISODIC_BLOCK_PLAYBACK);
					if (isPreferenceStoredBlock === "1") { //As part of R1 - R2 migration, 1 = require pin for playback
						blockPlaybackConfig = pvrUtil.getString("pvrRequirePinToPlayback");
					} else {
						blockPlaybackConfig = pvrUtil.getString("pvrNone");
					}
					data = [
						{
							"title" : "menuDefaultFolder",
							"firstSubTitle" : $N.app.FolderUtil.getDislayedDefaultNonEpisodicFolderName()
						},
						{
							"title" : "paddingBeforeNonEpisodic",
							"firstSubTitle" : PVROptionsUtil.getBeforePadding() + SINGLE_SPACE + SettingsMenuHelper.getString('minutes'),
							"secondTitle" : "paddingAfterNonEpisodic",
							"secondSubTitle" : PVROptionsUtil.getAfterPadding() + SINGLE_SPACE + SettingsMenuHelper.getString('minutes'),
							"successCallback" : setupPaddingChange,
							"keypadConfigObject" : {
								keypadReturnObject : {
									"key" : "paddingBeforeNonEpisodic",
									"value" : null
								},
								keypadSaveCallback : savePaddingWithKeypad,
								keypadExitCallback : resetPaddingValues,
								maximumNumericValue : 100
							}
						},
						{
							"title" : "menuNonEpisodicKeepUntil",
							"configName" : "Padding Left",
							"firstSubTitle" : keepUntilConfig
						},
						{
							"title" : "menuNonEpisodicBlockPlayback",
							"configName" : "Default Folder",
							"firstSubTitle" : blockPlaybackConfig
						}
					];
					data = formatUtils.formatRecorderSettingsMenuData(data);
					break;
				case 'menuEpisodicRecording':
					preferenceStoredKeepUntil = preferences.get(constants.PREF_EPISODIC_KEEP_UNTIL);
					keepUntilConfig = keepUntilStringMapping(preferenceStoredKeepUntil);

					isPreferenceStoredBlock = preferences.get(constants.PREF_EPISODIC_BLOCK_PLAYBACK);
					if (isPreferenceStoredBlock === "true") {
						blockPlaybackConfig = pvrUtil.getString("pvrRequirePinToPlayback");
					} else {
						blockPlaybackConfig = pvrUtil.getString("pvrNone");
					}

					preferenceStoredTypeOfEpisodes = preferences.get(constants.PREF_EPISODIC_TYPE_OF_EPISODES);
					typeOfEpisodesConfig = typeOfEpisodesStringMapping(preferenceStoredTypeOfEpisodes);

					data = [
						{
							"title" : "paddingBeforeEpisodic",
							"firstSubTitle" : PVROptionsUtil.getBeforePaddingEpisodic() + SINGLE_SPACE + SettingsMenuHelper.getString('minutes'),
							"secondTitle" : "paddingAfterEpisodic",
							"secondSubTitle" : PVROptionsUtil.getAfterPaddingEpisodic() + SINGLE_SPACE + SettingsMenuHelper.getString('minutes'),
							"successCallback" : setupPaddingChange,
							"keypadConfigObject" : {
								keypadReturnObject : {
									"key" : "paddingBeforeEpisodic",
									"value" : null
								},
								keypadSaveCallback : savePaddingWithKeypad,
								keypadExitCallback : resetPaddingValues,
								maximumNumericValue : 100
							}
						},
						{
							"title" : "menuEpisodicKeepUntil",
							"configName" : "Padding Left",
							"firstSubTitle" : keepUntilConfig
						},
						{
							"title" : "menuEpisodicBlockPlayback",
							"configName" : "Default Folder",
							"firstSubTitle" : blockPlaybackConfig
						}
					];
					data = formatUtils.formatRecorderSettingsMenuData(data);
					break;
				case 'menuPlaybackPlayer':
					preferencePlaybackPlayerTimeout = preferences.get(constants.PREF_PLAYBACK_PLAYER_TIMEOUT);
					data = [
						{
							"title" : "pvrPlaybackPlayer",
							"configName" : "Padding Left",
							"firstSubTitle" : SettingsMenuHelper.getString("playbackPlayerTimeouts")[preferencePlaybackPlayerTimeout]
						}
					];
					data = formatUtils.formatRecorderSettingsMenuData(data);
					break;
				case 'menuDiskDrive':
					data = [
						{
							"title" : "menuDiskDriveSafelyRemove",
							"successCallback" : $N.app.HotPlug.setUpRemoveDiskDrive
						},
						{
							"title" : "menuDiskDriveFormat",
							"successCallback" : $N.app.HotPlug.setUpDiskDriveFormatting
						}
					];
					data = formatUtils.formatRecorderSettingsMenuData(data);
					break;
				case 'menuWholeHomePvr':
					currentRecordServerName = $N.platform.btv.WHPVRManager.getCurrentRecordServerName();
					if (!currentRecordServerName) {
						currentRecordServerName = SettingsMenuHelper.getString("localLocation");
					}
					data = [
						{
							"title" : "menuLocalServerName",
							"firstSubTitle" : $N.platform.btv.WHPVRManager.getLocalName(),
							"successCallback" : showLocalServerNameKeypad,
							"keypadConfigObject" : {
								keypadReturnObject : {
									"key" : "menuLocalServerName",
									"value" : null
								},
								keypadExitCallback : restoreLocalServerName
							}
						},
						{
							"title" : "menuRecordLocation",
							"firstSubTitle" : currentRecordServerName
						}
					];

					data = formatUtils.formatRecorderSettingsMenuData(data);
					break;
				case 'menuRecordLocation':
					data = getRecordLocationList();
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuSTBinfo':
					systemObject = $N.app.ConditionalAccessCAK73.getCASystemInfo();
					smartCardObject = $N.app.ConditionalAccessCAK73.getCASmartCardInfo();
					dvlObject = (CCOM.DRM) ? CCOM.DRM.getDrmInfo(CCOM.DRM.DRM_TYPE_PRM) : null;
					chipsetType = systemObject.systemInfo.chipsetType;
					chipsetRevision = systemObject.systemInfo.chipsetRevision;
					stbDataObj = [
						{
							"key" : "stbModelNo",
							"value" : CCOM.System.getStringById(constants.SYSTEM_STB_MODEL).string || notAvailableText
						},
						{
							"key" : "firmWareVersion",
							"value" : $N.app.SettingsAPI.getVersion() || notAvailableText
						},
						{
							"key" : "appVersion",
							"value" : $N.app.Version.app_version || notAvailableText
						},
						{
							"key" : "updateID",
							"value" : $N.app.FeatureManager.getUsageId() || notAvailableText
						},
						{
							"key" : "decodeCAID",
							"value" : systemObject.systemInfo.serialNumber || notAvailableText
						},
						{
							"key" : "smartCardNumber",
							"value" :  smartCardObject.smartcardInfo ? smartCardObject.smartcardInfo.serialNumber || notAvailableText : notAvailableText
						},
						{
							"key" : "smartCardSoftware",
							"value" : smartCardObject.smartcardInfo ? smartCardObject.smartcardInfo.version || notAvailableText : notAvailableText
						},
						{
							"key" : "stbSerial",
							"value" : CCOM.System.getStringById(constants.SYSTEM_STB_SERIAL_NUMBER).string || notAvailableText
						},
						{
							"key" : "cakVersion",
							"value" : systemObject.systemInfo.version || notAvailableText
						},
						{
							"key" : "caNuid",
							"value" : systemObject.systemInfo.nuid || notAvailableText
						},
						{
							"key" : "chipsetType",
							"value" : (chipsetType + " " +  "(" + cakRevision + " " + chipsetRevision + ")") || notAvailableText
						},
						{
							"key" : "projectInfo",
							"value" : systemObject.systemInfo.projectInformation || notAvailableText
						},
						{
							"key" : "dvlVersion",
							"value" : (dvlObject && dvlObject.drm && dvlObject.drm.version) ? dvlObject.drm.version : notAvailableText
						},
						{
							"key" : "CSCMaxIndex",
							"value" :  (typeof (systemObject.systemInfo.cscMaxIndex) !== "null") ? parseInt(systemObject.systemInfo.cscMaxIndex, 10) : notAvailableText
						}
					];
					data = formatUtils.formatSTBInfoData(stbDataObj);
					break;
				case 'menuDiagnostics':
					data = updateDiagnostics();
					$N.app.SignalInfoUtil.setConnectionInfoSuccessCallBack(updateDiagnostics);
					$N.app.SignalInfoUtil.setConnectionInfoFailureCallBack(updateDiagnostics);
					$N.app.SignalInfoUtil.getConnectionInfo();
					break;
				case 'menuWHPVR':
					data = getWHPvrServers();
					break;
				case 'menuDefaultFolder':
					data = preferences.get(constants.PVR_NON_EPISODIC_FOLDER_LIST);
					data = formatUtils.formatRecordingsFolderListData(data);
					data = $N.app.FolderUtil.sortFolderList(data);//sort the list of folders and keep default folder on top of the list.
					data.successCallback = saveAndExitSettingsOptions;
					data.colorKeyCallbacks = {
						"green" :  setupFolderCreation
					};
					break;
				case 'menuNonEpisodicKeepUntil':
					data = [
						{
							"title": "pvrManualDelete",
							"value": constants.KEEP_UNTIL_OPTION_MANUAL_DELETE,
							"constant": constants.PREF_DEFAULT_KEEP_UNTIL
						},
						{
							"title": "pvrSpaceNeeded",
							"value": constants.KEEP_UNTIL_OPTION_SPACE_NEEDED,
							"constant": constants.PREF_DEFAULT_KEEP_UNTIL
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuNonEpisodicBlockPlayback':
					data = [
						{
							"title": "pvrNone",
							"value": "0",//as part of R1-R2 migration, 0 = no block
							"constant": constants.PREF_NON_EPISODIC_BLOCK_PLAYBACK
						},
						{
							"title": "pvrRequirePinToPlayback",
							"value": "1",//as part of R1-R2 migration, 1 = require pin
							"constant": constants.PREF_NON_EPISODIC_BLOCK_PLAYBACK
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuEpisodicKeepUntil':
					data = [
						{
							"title": "pvrManualDelete",
							"value": constants.KEEP_UNTIL_OPTION_MANUAL_DELETE,
							"constant": constants.PREF_EPISODIC_KEEP_UNTIL
						},
						{
							"title": "pvrSpaceNeeded",
							"value": constants.KEEP_UNTIL_OPTION_SPACE_NEEDED,
							"constant": constants.PREF_EPISODIC_KEEP_UNTIL
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuTypeOfEpisodes':
					data = [
						{
							"title": "pvrTypeAllEpisodes",
							"value": constants.TYPE_OF_EPISODE_OPTION_ALL_EPISODE,
							"constant": constants.PREF_EPISODIC_TYPE_OF_EPISODES
						},
						{
							"title": "pvrJustThisEpisode",
							"value": constants.TYPE_OF_EPISODE_OPTION_JUST_THIS_EPISODE,
							"constant": constants.PREF_EPISODIC_TYPE_OF_EPISODES
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuEpisodicBlockPlayback':
					data = [
						{
							"title": "pvrNone",
							"value": "false",
							"constant": constants.PREF_EPISODIC_BLOCK_PLAYBACK
						},
						{
							"title": "pvrRequirePinToPlayback",
							"value": "true",
							"constant": constants.PREF_EPISODIC_BLOCK_PLAYBACK
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'pvrPlaybackPlayer':
					data = getAvailPlaybackPlayerLookup();
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuIPConnections':
					data = updateIpConnections();
					break;
				case 'menuReminders':
					data = getReminderData();
					break;
				case 'menuPreferences':
					data = [
						{
							"title" : "menuBlocks",
							"successCallback" : setupBlocksSubMenu,
							"pinConfigObject" : {
								"successfullAuthenticationCallback" : displayBlocksSubMenu,
								"okCallback" : null,
								"pinDialogId" : "blocksSubMenu",
								"pinType" : "master",
								"eventImageVisibility" : false,
								"showTillAuthenticated" : true,
								"title": SettingsMenuHelper.getString("menuBlocks"),
								"description" : SettingsMenuHelper.getString("enterPasswordToContinue")
							},
							"isVisible" : true
						},
						{
							"title" : "menuLanguages",
							"isVisible" : true
						},
						{
							"title" : "menuMiniguide",
							"isVisible" : true
						},
						{
							"title" : "menuTv",
							"isVisible" : true
						},
						{
							"title" : "menuPrefStb",
							"isVisible" : true
						},
						{
							"title" : "menuPrefFacebook",
							"successCallback" : checkSocialAccountAvailability,
							"socialAccountType": $N.app.SocialAccount.FACEBOOK,
							"isVisible" : $N.platform.system.Preferences.get($N.app.constants.SOCIAL_FACEBOOK_FEATURE_AVAILABILITY)
						},
						{
							"title" : "menuMoCA",
							"isVisible" : $N.app.FeatureManager.isMoCAEnabled()
						}
					];
					data = getActiveMenuList(data);
					data = formatUtils.formatPreferencesSettingsMenuData(data);
					break;
				case 'menuBlocks':
					data = [
						{
							"title" : "menuParentalRatings",
							"successCallback" : displayParentalRatingOptions
						},
						{
							"title" : "menuBlockChannels",
							"href" : TICK_ICON_URL,
							"successCallback" : displayBlockChannelMenu
						},
						{
							"title" : "menuParentalPin",
							"successCallback" : setupPinChange,
							"pinConfigObject" : {
								"successfullAuthenticationCallback" : newPinEntry,
								"okCallback" : null,
								"pinDialogId" : "parentalRating",
								"pinType" : "master",
								"showTillAuthenticated" : true,
								"pinChangeHandler": defaultPinChangeHandler,
								"title": SettingsMenuHelper.getString("menuParentalPin"),
								"description" : SettingsMenuHelper.getString("enterPasswordToContinueParentalPin")
							},
							"newPinConfigObject" : {
								"okCallback" : confirmPinEntry,
								"pinDialogId" : "newPinEntry",
								"title": SettingsMenuHelper.getString("menuParentalPin"),
								"description" : SettingsMenuHelper.getString("enterNewParentalPin")
							},
							"confirmPinConfigObject" : {
								"okCallback" : savePin,
								"pinDialogId" : "confirmPinEntry",
								"pinType" : "master",
								"pinChangeHandler": defaultPinChangeHandler,
								"pinMismatchHandler": defaultPinMismatchErrorHandler,
								"title": SettingsMenuHelper.getString("menuParentalPin"),
								"description" : SettingsMenuHelper.getString("confirmParentalPin")
							}
						},
						{
							"title" : "menuPurchasePin",
							"successCallback" : setupPinChange,
							"pinConfigObject" : {
								"successfullAuthenticationCallback" : newPinEntry,
								"okCallback" : null,
								"pinDialogId" : "purchasePin",
								"pinType" : "purchase",
								"showTillAuthenticated" : true,
								"eventImageVisibility": false,
								"pinChangeHandler": defaultPinChangeHandler,
								"title": SettingsMenuHelper.getString("menuPurchasePin"),
								"description" : SettingsMenuHelper.getString("enterPasswordToContinuePurchasePin")
							},
							"newPinConfigObject" : {
								"okCallback" : confirmPinEntry,
								"pinDialogId" : "newPinEntry",
								"eventImageVisibility": false,
								"title": SettingsMenuHelper.getString("menuPurchasePin"),
								"description" : SettingsMenuHelper.getString("enterNewPurchasePin")
							},
							"confirmPinConfigObject" : {
								"okCallback" : savePin,
								"pinDialogId" : "confirmPinEntry",
								"pinType" : "purchase",
								"eventImageVisibility": false,
								"pinPath" : constants.PURCHASE_PIN_PATH,
								"pinChangeHandler": defaultPinChangeHandler,
								"pinMismatchHandler": defaultPinMismatchErrorHandler,
								"title": SettingsMenuHelper.getString("menuPurchasePin"),
								"description" : SettingsMenuHelper.getString("confirmPurchasePin"),
								"absolutePath": true
							}
						}
					];
					data = formatUtils.formatPreferencesSettingsMenuData(data);
					break;
				case 'menuPrefStb':
					data = [
						{
							"title" : "menuFrontPanel"
						},
						{
							"title" : "menuAutoTune"
						},
						{
							"title" : "menuAutoShutdown"
						}
					];
					data = formatUtils.formatPreferencesStbMenuData(data);
					break;
				case 'menuAutoTune':
					data = getAutoTuneData();
					break;
				case 'menuAutoTuneEdit':
					autoTuneProperty = autoTuneHelper.getAllAutoTuneProperties();
					data = [
						{
							"title" : "menuAutoTuneFrequency",
							"firstSubTitle" : SettingsMenuHelper.getString("autoTunefrequencies")[autoTuneProperty.frequency],
							"frequency" : autoTuneProperty.frequency
						},
						{
							"title" : "menuAutoTuneStartDate",
							"date" : getValidDate(autoTuneProperty.date),
							"firstSubTitle" : autoTuneProperty.date,
							"successCallback" : setupDateChange,
							"keypadConfigObject" : {
								keypadReturnObject : {
									"key" : "autoTuneStartDate",
									"value" : null
								},
								keypadSaveCallback : saveAutoTuneDateTime,
								keypadExitCallback : resetAutoTuneStartDateValues
							}
						},
						{
							"title" : "menuAutoTuneStartTime",
							"firstSubTitle" : autoTuneProperty.time,
							"time" : autoTuneProperty.time,
							"successCallback" : setupTimeChange,
							"keypadConfigObject" : {
								keypadReturnObject : {
									"key" : "autoTuneStartTime",
									"value" : null
								},
								keypadSaveCallback : saveAutoTuneDateTime,
								keypadExitCallback : resetAutoTuneStartTimeValues
							}
						},
						{
							"title" : "menuAutoTuneChannel",
							"successCallback" : selectTunedChannel,
							"channelInfo" : autoTuneProperty.channelInfo,
							"firstSubTitle" : autoTuneProperty.channel
						}
					];
					data = formatUtils.formatPreferencesStbMenuData(data);
					break;
				case 'menuAutoTuneFrequency':
					data = getAutoTuneLookup("POSSIBLE_AUTOTUNE_FREQUENCY", "autoTunefrequencies");
					data = formatUtils.formatPreferencesStbMenuData(data);
					data.successCallback = saveAndExitSettingsOptions;
					controller.setPassivateCallback(refreshControllerActiveMenu);
					break;
				case 'menuAutoTuneChannel':
					channelData = $N.app.ChannelManager.getAllChannelsOrderedByChannelNumber();
					data = formatUtils.formatFavouriteBlockChannelsData(channelData);
					data.successCallback = saveAndExitSettingsOptions;
					controller.setPassivateCallback(refreshControllerActiveMenu);
					break;
				case 'menuLanguages':
					preferedMenuLanguage = preferences.get(constants.PREF_LANGUAGE);
					preferedAudioLanguage = preferences.get(constants.PREF_AUDIO_LANGUAGE);
					preferedSubtitle = preferences.get(constants.PREF_SUBTITLE_STATE) || constants.SUBTITLE_STATE_DEFAULT;
					data = [
						{
							"title" : "menuMenuLanguage",
							"firstSubTitle" : SettingsMenuHelper.getString("isoLocaleLanguage")[preferedMenuLanguage]
						},
						{
							"title" : "menuAudioLanguage",
							"firstSubTitle" : SettingsMenuHelper.getString("audioLanguage")[preferedAudioLanguage]
						},
						{
							"title" : "menuSubtitle",
							"firstSubTitle" : SettingsMenuHelper.getString("subtitleStates")[preferedSubtitle]
						}
					];
					data = formatUtils.formatPreferencesSettingsMenuData(data);
					break;
				case 'menuMenuLanguage':
					data = getAvailableMenuLanguageLookup();
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuAudioLanguage':
					data = getAvailableAudioLanguageLookup();
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuSubtitle':
					data = getAvailableSubtitleStateLookup();
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuMediaPreferences':
					preferedPhotoDisplayDuration = preferences.get(constants.PREF_USBDLNA_PHOTO_DISPLAY_DURATION);
					preferedPhotoTransition = preferences.get(constants.PREF_USBDLNA_PHOTO_TRANSITION_EFFECTS);
					preferedPlayerDuration = preferences.get(constants.PREF_USBDLNA_PLAYER_BANNER_TIMEOUT);
					data = [
						{
							"title" : "menuPhotoDisplayDuration",
							"isVisible" : true,
							"customTitle" : "menuDisplayDurationKeyPadTitle",
							"firstSubTitle" : preferedPhotoDisplayDuration + SINGLE_SPACE + SettingsMenuHelper.getString("optionSeconds"),
							"successCallback" : setupPhotoAndPlayerDurationChange,
							"keypadConfigObject" : {
								keypadReturnObject : {
									"key" : "mediaPhotoDisplayDuration",
									"value" : null
								},
								keypadSaveCallback : savePhotoAndPlayerDisplayDuration,
								keypadExitCallback : resetPhotoDisplayDuration,
								maximumNumericValue : 60,
								minimumNumericValue : 1
							}
						},
						{
							"title" : "menuPhotoTransition",
							"isVisible" : true,
							"firstSubTitle" : SettingsMenuHelper.getString("transitionEffects")[preferedPhotoTransition]
						},
						{
							"title" : "menuPlayerDuration",
							"customTitle" : "menuPlayerDurationKeyPadTitle",
							"firstSubTitle" : preferedPlayerDuration + SINGLE_SPACE + SettingsMenuHelper.getString("optionSeconds"),
							"successCallback" : setupPhotoAndPlayerDurationChange,
							"keypadConfigObject" : {
								keypadReturnObject : {
									"key" : "mediaPlayerDuration",
									"value" : null
								},
								keypadSaveCallback : savePhotoAndPlayerDisplayDuration,
								keypadExitCallback : resetPlayerBannerDuration,
								maximumNumericValue : 60,
								minimumNumericValue : 1
							},
							"isVisible" : true
						},
						{
							"title" : "menuDiskDriveSafelyRemove",
							"firstSubTitle" : "",
							"successCallback" : safelyRemoveUSBMedia,
							"isVisible" : ($N.app.FeatureManager.getMediaPlaybackFeatureStatus() &&
							$N.app.UsbBrowserHelper.getMediaPlaybackStatus() &&
							(activeMenuItem.getHelperMode && activeMenuItem.getHelperMode() === $N.app.constants.USB_HELPER_MODE))
						}
					];
					data = getActiveMenuList(data);
					data = formatUtils.formatPreferencesSettingsMenuData(data);
					break;
				case "menuPhotoTransition":
					data = getMediaTransitionEffectsLookup();
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuMiniguide':
					preferedDuration = preferences.get(constants.PREF_ZAPPING_BANNER_TIMEOUT);
					preferedTipsFromNet = preferences.get(constants.PREF_DEFAULT_TIPSFROMNET);
					preferedPipPosition = preferences.get(constants.PREF_MINIGUIDE_PIP_POSITION);
					data = [
						{
							"title" : "menuMiniguideDuration",
							"firstSubTitle" : SettingsMenuHelper.getString("surferDurations")[preferedDuration]
						},
						{
							"title" : "menuTipsFromNet",
							"firstSubTitle" : (preferedTipsFromNet === "true") ? SettingsMenuHelper.getString("menuTipsEnable") : SettingsMenuHelper.getString("menuTipsDisable")
						},
						{
							"title" : "menuMiniguidePIP",
							"firstSubTitle" : SettingsMenuHelper.getString("menuPipPositions")[preferedPipPosition]
						}
					];
					data = formatUtils.formatPreferencesSettingsMenuData(data);
					break;
				case 'menuMiniguideDuration':
					data = getMiniguideDurationLookup();
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuTipsFromNet':
					data = [
						{
							"title" : "menuTipsEnable",
							"value" : "true"
						},
						{
							"title" : "menuTipsDisable",
							"value" : "false"
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuMiniguidePIP':
					data = getMiniguidePipPositions();
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuFavorites':
					if (componentId === "firstSubMenuList") {
						channelData = $N.app.ChannelManager.getAllChannelsOrderedByChannelNumber();
						data = formatUtils.formatFavouriteBlockChannelsData(channelData);
					} else {
						favoritesData = $N.app.ChannelManager.getFavouriteChannels();
						if (favoritesData.domain === "com.opentv.EPG") {
							$N.app.ErrorMessage.showFavoritesFetchErrorDialog();
						} else {
							data = formatUtils.formatFavouriteBlockChannelsData(favoritesData);
						}
					}
					break;
				case 'menuParentalRatings':
					data = $N.app.ParentalControlUtil.getRatingLookUp();
					data.successCallback = saveParentalRatingOption;
					break;
				case 'menuBlockChannels':
					if (componentId === "firstSubMenuList") {
						data = formatUtils.formatFavouriteBlockChannelsData($N.app.ChannelManager.getAllChannelsOrderedByChannelNumber());
						data.colorKeyCallbacks = {
							"green" : manageChannelTogglingByGenre
						};
					} else {
						data = formatUtils.formatFavouriteBlockChannelsData($N.app.ChannelManager.getBlockedChannelsList());
						data = data.sort($N.app.SortUtil.sortByChannel);
					}
					break;
				case 'menuTv':
					data = [
						{
							"title" : "menuSdOutput"
						},
						{
							"title" : "menuHdOutput"
						}
					];
					data = formatUtils.formatPreferencesTvMenuData(data);
					break;
				case 'menuSdOutput':
					preferedAspectRatio = preferences.get(constants.PREF_ASPECT_RATIO, true);
					preferedDisplayFormat = preferences.get(constants.PREF_DEFAULT_ASPECT_RATIO_ANALOGUE, IS_PATH_ABSOLUTE);
					preferedVideoSystem = preferences.get(constants.PREF_VIDEO_SYSTEM, IS_PATH_ABSOLUTE);
					data = [
						{
							"title" : "menuAspectRatio",
							"firstSubTitle" : (preferedAspectRatio === $N.platform.output.AV.VideoAspectRatio.ASPECT_RATIO_4_3) ? SettingsMenuHelper.getString("menuAspectRatioVga") : SettingsMenuHelper.getString("menuAspectRatioWideScreen")
						},
						{
							"title" : "menuDisplayFormat",
							"firstSubTitle" : (preferedDisplayFormat === $N.platform.output.AV.VideoAspectMode.ANALOGUE_STRETCH) ? SettingsMenuHelper.getString("menuStretch") : SettingsMenuHelper.getString("menuLetterbox")
						},
						{
							"title" : "menuVideoSystem",
							"firstSubTitle" : (preferedVideoSystem === constants.PI_VID_STD_NTSC_M) ? SettingsMenuHelper.getString("menuNTSC") : SettingsMenuHelper.getString("menuPAL")
						}
					];
					data = formatUtils.formatPreferencesTvMenuData(data);
					break;
				case 'menuAspectRatio':
					data = [
						{
							"title" : "menuAspectRatioVga",
							"value" : $N.platform.output.AV.VideoAspectRatio.ASPECT_RATIO_4_3, // value is 0
							"constant": constants.PREF_ASPECT_RATIO,
							"option" : $N.platform.output.AV.VideoAspectRatio.ASPECT_RATIO_4_3,
							"isAbsolute" : true
						},
						{
							"title" : "menuAspectRatioWideScreen",
							"value" : $N.platform.output.AV.VideoAspectRatio.ASPECT_RATIO_16_9, // value is 1
							"constant": constants.PREF_ASPECT_RATIO,
							"option" : $N.platform.output.AV.VideoAspectRatio.ASPECT_RATIO_16_9,
							"isAbsolute" : true
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuDisplayFormat':
					data = [
						{
							"title" : "menuStretch",
							"value" : $N.platform.output.AV.VideoAspectMode.ANALOGUE_STRETCH, // value is 3
							"constant": constants.PREF_DEFAULT_ASPECT_RATIO_ANALOGUE,
							"option" : $N.platform.output.AV.VideoAspectMode.ANALOGUE_STRETCH,
							"isAbsolute" : true
						},
						{
							"title" : "menuLetterbox",
							"value" : $N.platform.output.AV.VideoAspectMode.ANALOGUE_LETTER_BOX, // value is 0
							"constant": constants.PREF_DEFAULT_ASPECT_RATIO_ANALOGUE,
							"option" : $N.platform.output.AV.VideoAspectMode.ANALOGUE_LETTER_BOX,
							"isAbsolute" : true
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuVideoSystem':
					data = [
						{
							"title" : "menuNTSC",
							"value" : constants.PI_VID_STD_NTSC_M,
							"constant": constants.PREF_VIDEO_SYSTEM,
							"absolutePath": true
						},
						{
							"title" : "menuPAL",
							"value" : constants.PI_VID_STD_PAL_M,
							"constant": constants.PREF_VIDEO_SYSTEM,
							"absolutePath": true
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuHdOutput':
					preferedResolution = preferences.get(constants.PREF_HDMI_VIDEO_RESOLUTION, IS_PATH_ABSOLUTE);
					preferedDisplayFormat = $N.platform.output.AV.getHDVideoAspectMode();
					preferedAudioFormat = preferences.get(constants.PREF_HDMI_AUDIO_OUTPUT);
					preferedLipSync = preferences.get(constants.PREF_AUDIO_LIPSYNC_DELAY, IS_PATH_ABSOLUTE);
					data = [
						{
							"title" : "menuResolution",
							"firstSubTitle" : SettingsMenuHelper.getString("hdResolutions")[preferedResolution]
						},
						{
							"title" : "menuHdDisplayFormat",
							"firstSubTitle" : (preferedDisplayFormat ===  $N.platform.output.AV.VideoAspectMode.HDMI_STRETCH) ? SettingsMenuHelper.getString("menuStretch") : SettingsMenuHelper.getString("menuPillarBar")
						},
						{
							"title" : "menuHdmiAudioOutput",
							"firstSubTitle" : (preferedAudioFormat === constants.HDMI_AUDIO_PCM) ? SettingsMenuHelper.getString("menuPcm") : SettingsMenuHelper.getString("menuDolby")
						},
						{
							"title" : "menuLipSync",
							"customTitle" : "menuLipSyncKeyPadTitle",
							"firstSubTitle" :  parseInt(preferedLipSync, 10) + SINGLE_SPACE + SettingsMenuHelper.getString("milliSeconds"),
							"successCallback" : setupLipsyncChange,
							"keypadConfigObject" : {
								keypadReturnObject : {
									"key" : "lipsyncDelay",
									"value" : null
								},
								keypadSaveCallback : saveLipsyncDelay,
								keypadExitCallback : resetLipsyncValues,
								maximumNumericValue : 190
							}
						}
					];
					data = formatUtils.formatPreferencesTvMenuData(data);
					break;
				case 'menuHdmiAudioOutput':
					data = [
						{
							"title" : "menuDolby",
							"value" : CCOM.System.HDMI_AUDIO_TYPE_DDPLUS,
							"constant": constants.PREF_HDMI_AUDIO_OUTPUT,
							"option" : constants.HDMI_AUDIO_DOLBY_OUTPUT
						},
						{
							"title" : "menuPcm",
							"value" : CCOM.System.HDMI_AUDIO_TYPE_PCM,
							"constant": constants.PREF_HDMI_AUDIO_OUTPUT,
							"option" : constants.HDMI_AUDIO_PCM_OUTPUT
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuHdDisplayFormat':
					data = [
						{
							"title" : "menuStretch",
							"value" : $N.platform.output.AV.VideoAspectMode.HDMI_STRETCH,
							"constant": constants.PREF_DEFAULT_ASPECT_RATIO_HD,
							"option" : $N.platform.output.AV.VideoAspectMode.HDMI_STRETCH,
							"isAbsolute": true
						},
						{
							"title" : "menuPillarBar",
							"value" : $N.platform.output.AV.VideoAspectMode.HDMI_PILLAR_BOX,
							"constant": constants.PREF_DEFAULT_ASPECT_RATIO_HD,
							"option" : $N.platform.output.AV.VideoAspectMode.HDMI_PILLAR_BOX,
							"isAbsolute": true
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuFrontPanel':
					preferedFrontPanelDisplay = preferences.get(constants.PREF_FRONTPANEL_DISPLAY);
					preferedFrontPanelIntensity = preferences.get(constants.PREF_FRONTPANEL_INTENSITY);
					preferedVideoSystem = null;
					data = [
						{
							"title" : "menuFrontPanelDisplay",
							"firstSubTitle" : (preferedFrontPanelDisplay === constants.FRONTPANEL_DISPLAY_CHANNEL) ? SettingsMenuHelper.getString("menuDisplayChannel") : SettingsMenuHelper.getString("menuDisplayTime")
						},
						{
							"title" : "menuFrontPanelIntensity",
							"firstSubTitle" : (preferedFrontPanelIntensity ===  constants.FRONTPANEL_INTENSITY_BRIGHT) ? SettingsMenuHelper.getString("menuIntensityBright") : SettingsMenuHelper.getString("menuIntensityFade")
						}
					];
					data = formatUtils.formatPreferencesStbMenuData(data);
					break;
				case 'menuFrontPanelDisplay':
					data = [
						{
							"title" : "menuDisplayChannel",
							"option" : constants.FRONTPANEL_DISPLAY_CHANNEL,
							"constant": constants.PREF_FRONTPANEL_DISPLAY
						},
						{
							"title" : "menuDisplayTime",
							"option" : constants.FRONTPANEL_DISPLAY_TIME,
							"constant": constants.PREF_FRONTPANEL_DISPLAY
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuFrontPanelIntensity':
					data = [
						{
							"title" : "menuIntensityBright",
							"option" : constants.FRONTPANEL_INTENSITY_BRIGHT,
							"constant": constants.PREF_FRONTPANEL_INTENSITY
						},
						{
							"title" : "menuIntensityFade",
							"option" : constants.FRONTPANEL_INTENSITY_FADE,
							"constant": constants.PREF_FRONTPANEL_INTENSITY
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuResolution':
					data = [
						{
							"title" : "menu480i",
							"value" : $N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_480I,
							"constant": constants.PREF_HDMI_VIDEO_RESOLUTION,
							"isAbsolute": true,
							"option" : $N.app.GeneralUtil.getExponentValue($N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_480I, EXPONENT_BASE)
						},
						{
							"title" : "menu480p",
							"value" : $N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_480P,
							"constant": constants.PREF_HDMI_VIDEO_RESOLUTION,
							"isAbsolute": true,
							"option" : $N.app.GeneralUtil.getExponentValue($N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_480P, EXPONENT_BASE)
						},
						{
							"title" : "menu720p",
							"value" : $N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_720P,
							"constant": constants.PREF_HDMI_VIDEO_RESOLUTION,
							"isAbsolute": true,
							"option" : $N.app.GeneralUtil.getExponentValue($N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_720P, EXPONENT_BASE)
						},
						{
							"title" : "menu1080i",
							"value" : $N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_1080I,
							"constant": constants.PREF_HDMI_VIDEO_RESOLUTION,
							"isAbsolute": true,
							"option" : $N.app.GeneralUtil.getExponentValue($N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_1080I, EXPONENT_BASE)
						},
						{
							"title" : "menu1080p",
							"value" : $N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_1080P,
							"constant": constants.PREF_HDMI_VIDEO_RESOLUTION,
							"isAbsolute": true,
							"option" : $N.app.GeneralUtil.getExponentValue($N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_1080P, EXPONENT_BASE)
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuAutoShutdown':
					preferedAutoShutDown = preferences.get(constants.PREF_AUTO_STANDBY);
					data = [
						{
							"title" : "menuAutoStandbyAfter",
							"firstSubTitle" : SettingsMenuHelper.getString("standbyDurations")[preferedAutoShutDown]
						}
					];
					data = formatUtils.formatPreferencesStbMenuData(data);
					break;
				case 'menuAutoStandbyAfter':
					data = getAvailableStandbyDurationLookup();
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'menuPrefFacebook':
					socialAccountObject = $N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK);
					data = [
						{
							"title": "socialAccount",
							"firstSubTitle": socialAccountObject.getAccountInformation("email"),
							"socialAccountType": $N.app.SocialAccount.FACEBOOK,
							"successCallback" : showSocialAccount
						},
						{
							"title": "facebookPinSetting",
							"firstSubTitle": $N.app.SocialActivityFactory.getPinSettingDisplayValue(preferences.get(constants.SOCIAL_FACEBOOK_PIN_SETTING)),
							"configs": formatUtils.getSocialAccountPinSettingOptionsConfig()
						},
						{
							"title": "facebookChangePin",
							"firstSubTitle": "****",
							"successCallback" : setupPinChange,
							"pinConfigObject" : {
								"successfullAuthenticationCallback" : newPinEntry,
								"okCallback" : null,
								"pinDialogId" : "facebook",
								"pinType" : "facebook",
								"showTillAuthenticated" : true,
								"eventImageVisibility": false,
								"titleImage": "customise/resources/images/%RES/icons/fb_icon.png",
								"title": SettingsMenuHelper.getString("changeFacebookPin"),
								"description" : SettingsMenuHelper.getString("enterCurrentPin")
							},
							"newPinConfigObject" : {
								"okCallback" : confirmSocialPinEntry,
								"pinDialogId" : "newPinEntry",
								"eventImageVisibility": false,
								"titleImage": "customise/resources/images/%RES/icons/fb_icon.png",
								"title": SettingsMenuHelper.getString("changeFacebookPin"),
								"description" : SettingsMenuHelper.getString("enterNewPin")
							},
							"confirmPinConfigObject" : {
								"okCallback" : savePin,
								"eventImageVisibility": false,
								"pinChangeHandler": facebookPinChangeHandler,
								"pinMismatchHandler": facebookPinMismatchErrorHandler,
								"pinType" : "facebook",
								"titleImage": "customise/resources/images/%RES/icons/fb_icon.png",
								"pinPath" : constants.SOCIAL_FACEBOOK_PIN,
								"pinDialogId" : "confirmPinEntry",
								"title": SettingsMenuHelper.getString("changeFacebookPin"),
								"description" : SettingsMenuHelper.getString("reEnterNewPin")
							}
						}
					];
					break;
				case 'facebookPinSetting':
					data = [
						{
							"title" : "socialPinSettingNeverRequest",
							"value" : "socialPinSettingNeverRequest",
							"constant": constants.SOCIAL_FACEBOOK_PIN_SETTING
						},
						{
							"title" : "socialPinSettingAlwaysRequest",
							"value" : "socialPinSettingAlwaysRequest",
							"constant": constants.SOCIAL_FACEBOOK_PIN_SETTING
						},
						{
							"title" : "socialPinSettingRequestOneHour",
							"value" : "socialPinSettingRequestOneHour",
							"constant": constants.SOCIAL_FACEBOOK_PIN_SETTING
						},
						{
							"title" : "socialPinSettingRequestTwoHour",
							"value" : "socialPinSettingRequestTwoHour",
							"constant": constants.SOCIAL_FACEBOOK_PIN_SETTING
						},
						{
							"title" : "socialPinSettingRequestThreeHour",
							"value" : "socialPinSettingRequestThreeHour",
							"constant": constants.SOCIAL_FACEBOOK_PIN_SETTING
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				case 'socialAccount':
					data = [
						{
							"title" : "menuDisconnectAccount",
							"successCallback" : removeSocialAccount,
							"socialAccountType": $N.app.SocialAccount.FACEBOOK
						}
					];
					break;
				case 'menuPurchases':
					data = [
						{
							"title" : "menuHistoryOfPurchases",
							"isAdultCategory" : false,
							"configs" : formatUtils.getPurchasesConfig()
						},
						{
							"title" : "adultContent",
							"successCallback" : validateAndDisplayAdultPurchases,
							"isAdultCategory" : true,
							"configs" : null
						}
					];
					break;
				case 'menuHistoryOfPurchases':
				case 'adultContent':
					if (activeMenuItem.isAdultCategory === true) {
						ppvPurchases = $N.app.PPVHelper.getPPVPurchases(true);
					} else {
						ppvPurchases = $N.app.PPVHelper.getPPVPurchases();
					}
					if (ppvPurchases.length > 0 || vodPurchases.length > 0) {
						data = ppvPurchases.concat(vodPurchases);
					}
					break;
				case 'menuMoCA':
					data = [
						{
							"title" : "menuMoCAStatus",
							"firstSubTitle" : mocaConfig.getStatus()
						},
						{
							"title" : "menuMoCAPrivacyEnabled",
							"firstSubTitle" : "No"
						},
						{
							"title" : "menuMoCAPassword",
							"firstSubTitle" : "*****"
						},
						{
							"title" : "menuMoCABand",
							"firstSubTitle" : "0"
						},
						{
							"title" : "menuMoCABandMask",
							"firstSubTitle" : "0x15554000"
						},
						{
							"title" : "menuMoCATransmitPower",
							"firstSubTitle" : "10"
						},
						{
							"title" : "menuMoCABeaconPower",
							"firstSubTitle" : "10"
						},
						{
							"title" : "menuMoCANetworkController",
							"firstSubTitle" : "2"
						},
						{
							"title" : "menuMoCAPhyTargetRate",
							"firstSubTitle" : "4"
						},
						{
							"title" : "menuMoCAPhyMargin",
							"firstSubTitle" : "6"
						}
					];
					data = formatUtils.formatPreferencesSettingsMenuData(data);
					break;
				case 'menuMoCAEnabled':
					data = [
						{
							"title" : "menuMoCAEnabled",
							"value" : "true"
						},
						{
							"title" : "menuMoCADisabled",
							"value" : "false"
						}
					];
					data.successCallback = saveAndExitSettingsOptions;
					break;
				}
				return data;
			},
			setData : setData,
			getAutoTuneData: getAutoTuneData,
			startAutoRefreshData : function (id, activeComponent) {
				refreshComponent = activeComponent;
				switch (id) {
				case "menuDiagnostics":
					if (systemMenuRefreshInterval) {
						clearInterval(systemMenuRefreshInterval);
						systemMenuRefreshInterval = null;
					}
					systemMenuRefreshInterval = setInterval(refreshDiagnostics, DIAGNOSTIC_REFRESH_INTERVAL_MS);
					break;
				case "menuIPConnections":
					if (systemMenuRefreshInterval) {
						clearInterval(systemMenuRefreshInterval);
						systemMenuRefreshInterval = null;
					}
					systemMenuRefreshInterval = setInterval(refreshIpConnections, IP_CONNECTIONS_REFRESH_INTERVAL_MS);
					break;
				default:
					this.stopAutoRefreshData();
				}
			},
			autoTuneTimeUpdate: function () {
				minuteTimer.register("SettingsMenuHelperClock", function () {
					var activeMenuItem = controller.getActiveMenuItem(),
						activeComponent = controller.getActiveComponent(),
						lastSelectedIndex = null;
					if (autoTuneHelper.getAutoTuneProperty('isPresentTime')) {
						autoTuneHelper.setAutoTuneProperty("time", $N.app.DateTimeUtil.getFormattedTimeString(new Date(), constants.TWENTY_FOUR_HOUR_TIME_FORMAT));
						if (activeMenuItem && activeMenuItem.title === 'menuAutoTuneEdit') {
							refreshControllerActiveMenu();
						}
					}
				});
				minuteTimer.enable("SettingsMenuHelperClock");
			},
			stopAutoTuneTimeUpdate: function () {
				minuteTimer.disable("SettingsMenuHelperClock");
			},
			stopAutoRefreshData : function () {
				clearInterval(systemMenuRefreshInterval);
				systemMenuRefreshInterval = null;
			},
			systemViewDrawMenuCallback : function () {
				controller.showBGLines();
			},
			isPinDisplayed : isPinDisplayed,
			genericReminderDeletedListener: genericReminderDeletedListener
		};
	};

	$N.app = $N.app || {};
	$N.app.SettingsMenuHelper = SettingsMenuHelper;

}($N || {}));
