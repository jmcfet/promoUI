/**
 * @class $N.app.PVRUtil
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.platform.system.Preferences
 * @requires $N.app.constants
 * @requires $N.platform.btv.PVRManager
 * #depends ../Constants.js
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.PVRUtil = (function () {

		var log = new $N.apps.core.Log("Helper", "PVRUtil"),
			Preferences = $N.platform.system.Preferences,
			SELECT_LIST_WIDTH = 995,
			Constants = $N.app.constants,
			PVRManager = $N.platform.btv.PVRManager,
			prePaddingValue = 0,
			postPaddingValue = 0,
			tasksCount = null,
			tasksCallbacksFired = null,
			playingTaskId = null,
			sortOptions,
			OBJECT_STATE = {
				BOOKED: 0,
				PROCESSING: 1,
				SUSPEND_PROCESSING: 2,
				STOP_PROCESSING: 3,
				PROCESSED: 4,
				FINAL: 5,
				ERROR: 6,
				DELETING: 7,
				DELETED: 8
			},
			PLAYBACK_STATE = {
				UNPLAYED_UNBLOCKED: 0,
				PLAYED_UNBLOCKED: 1,
				UNPLAYED_BLOCKED: 2,
				PLAYED_BLOCKED: 3
			},
			CUMULATIVE_STATE = {
				CA_ERROR: 1,
				NO_RESOURCE: 4,
				STARTED_LATE: 64,
				POWER_LOSS: 32,
				SIGNAL_LOSS: 16
			},
			DATA_UPDATE_STATE = {
				NOT_APPLICABLE: 1,
				ALLOWED: 2,
				NOT_ALLOWED: 3
			},
			onTasksChangedCallback = null,
			stopTaskOKCallback = null,
			/**
			 * The fraction of the way through a recording beyond which we do not
			 * save a bookmark. Assuming the show has finished
			 * @property BOOKMARKABLE_CONTENT_RATIO
			 * @type {Number}
			 */
			BOOKMARKABLE_CONTENT_RATIO = 0.96; //96%

		/**
		 * @method incrementTasksCallbacksFired
		 * @param {param} incrementAmount
		 */
		function incrementTasksCallbacksFired(incrementAmount) {
			log("incrementTasksCallbacksFired", "Enter");
			incrementAmount = incrementAmount || 1;
			tasksCallbacksFired += incrementAmount;
			log("incrementTasksCallbacksFired", "Exit");
		}

		/**
		 * @method initialiseTasksCallbackCount
		 * @param {param} count
		 */
		function initialiseTasksCallbackCount(count) {
			log("initialiseTasksCallbackCount", "Enter");
			tasksCallbacksFired = 0;
			tasksCount = count;
			log("initialiseTasksCallbackCount", "Exit");
		}

		/**
		 * @method areRecordingsInProgress
		 * @return {Boolean}
		 */
		function areRecordingsInProgress() {
			var recordings = $N.platform.btv.PVRManager.getActiveRecordings();
			return (recordings.length > 0);
		}

		/**
		 * @method getDataUpdateState
		 * @return {Number} result
		 */
		function getDataUpdateState() {
			log("getDataUpdateState", "Enter");
			if (tasksCount && tasksCallbacksFired && tasksCount > 0 && tasksCallbacksFired >= 0) {
				if (tasksCallbacksFired === tasksCount) {
					log("getDataUpdateState", "Exit - allowed:" + DATA_UPDATE_STATE.ALLOWED);
					return DATA_UPDATE_STATE.ALLOWED;
				}
				log("getDataUpdateState", "Exit - not allowed:" + DATA_UPDATE_STATE.NOT_ALLOWED);
				return DATA_UPDATE_STATE.NOT_ALLOWED;
			}
			log("getDataUpdateState", "Exit - not applicable:" + DATA_UPDATE_STATE.NOT_APPLICABLE);
			return DATA_UPDATE_STATE.NOT_APPLICABLE;
		}

		/**
		 * @method getSubtitleForEvent
		 * @param {Object} event
		 * @return {Object} An object containing the subtitle and dates and times
		 */
		function getSubtitleForEvent(event) {
			var subtitleObj = {
					text: '',
					span: ''
				},
				subtitleText = '',
				startDate,
				nextEvent,
				startAndEndTime,
				beginTime,
				beginAndEndTime;

			if (event) {

				startDate = new Date(event.actualStartTime || event.startTime - event.softPrepaddingDuration);
				nextEvent = $N.platform.btv.EPG.getNextEventForService(event.serviceId);
				startAndEndTime = $N.app.DateTimeUtil.getFormattedStartEndTimeString(startDate, new Date(event.actualStopTime || event.endTime + event.softPostpaddingDuration)).toUpperCase();
				beginTime = new Date(event.startTime);
				beginAndEndTime = $N.app.DateTimeUtil.getFormattedStartEndTimeString(beginTime, new Date(event.actualStopTime || event.endTime)).toUpperCase();

				if ($N.app.EventUtil.isEventShowingNow(event)) {
					subtitleText = $N.app.PVRUtil.getString("showingNow");
				} else if (nextEvent && nextEvent.eventId && nextEvent.eventId === event.eventId) {
					subtitleText = $N.app.PVRUtil.getString("showingNext");
				} else if ($N.app.EventUtil.isEventShowingToday(event)) {
					subtitleText = $N.app.PVRUtil.getString("today");
				} else {
					subtitleText = $N.app.PVRUtil.getString("days")[startDate.getDay()];
				}
				subtitleObj = {
					text: beginAndEndTime,
					span: beginAndEndTime.substring(beginAndEndTime.length - 2, beginAndEndTime.length)
				};

			}

			return {
				text: subtitleText,
				obj: subtitleObj
			};
		}

		/**
		 * @method getRecordedSeasonEpisodeShort
		 * @param {Object} eventObject
		 * @return {String} A String containing the episode and series name
		 */
		function getRecordedSeasonEpisodeShort(eventObject) {
			var returnstring = "",
				seasonEpisodeObj = null;
			if (eventObject) {
				seasonEpisodeObj = $N.app.epgUtil.getSeasonEpisodeNumberObject(eventObject.seriesId, eventObject.episodeId);
				if (seasonEpisodeObj.seasonNumber !== "") {
					returnstring += $N.app.PVRUtil.getString("seasonShort") + " " + $N.app.GeneralUtil.padNumberWithZeroes(parseInt(seasonEpisodeObj.seasonNumber, 10), 2);
				}
				if (seasonEpisodeObj.episodeNumber !== "") {
					returnstring += " " + $N.app.PVRUtil.getString("episodeShort") + " " + $N.app.GeneralUtil.padNumberWithZeroes(parseInt(seasonEpisodeObj.episodeNumber, 10), 2);
				}
				return returnstring;
			}
			return "";
		}

		/**
		 * @method getCurrentPlayedBlockedState
		 * @param {String} taskId
		 * @param {Integer} the currentState
		 */
		function getCurrentPlayedBlockedState(taskId) {
			var task = $N.platform.btv.PVRManager.getTask(taskId, "PlayedBlocked");
			return (task && task._data && task._data.PlayedBlocked) ? task._data.PlayedBlocked : PLAYBACK_STATE.UNPLAYED_UNBLOCKED;
		}

		/**
		 * this function gets the Total disk space.
		 * @method getTotalRecordingSpace
		 * @param {String} taskId
		 * @return {Integer} the totalspace available
		 */
		function getTotalRecordingSpace() {
			var totalDiskSpace = $N.platform.system.Device.getTotalHardDriveSpace();
			return (totalDiskSpace);
		}

		/**
		 * @method updatePlayedState
		 * @param {string} taskId
		 */
		function updatePlayedState(taskId) {
			var currentState = getCurrentPlayedBlockedState(taskId);
			if (currentState === PLAYBACK_STATE.UNPLAYED_UNBLOCKED) {
				$N.app.PVRUtil.updateRecording(taskId, {
					PlayedBlocked: PLAYBACK_STATE.PLAYED_UNBLOCKED
				});
			} else if (currentState === PLAYBACK_STATE.UNPLAYED_BLOCKED) {
				$N.app.PVRUtil.updateRecording(taskId, {
					PlayedBlocked: PLAYBACK_STATE.PLAYED_BLOCKED
				});
			}
		}

		/**
		 * @method convertTimeToString
		 * @param {string} time
		 * @return {string} time
		 */
		function convertTimeToString(time) {
			var hours,
				minutes,
				zeroStr = "";
			if (time) {
				hours = (time.getHours() === 0) ? 12 : time.getHours();
				minutes = time.getMinutes();
				zeroStr = (minutes <= 9) ? "0" : "";
				return (String(hours) + ":" + zeroStr + String(minutes));
			}
			return "0:00";
		}

		/**
		 * playingTaskId getter
		 * @method getPlayingTaskId
		 * @return {Number|null} playingTaskId
		 */
		function getPlayingTaskId() {
			log("getPlayingTaskId", playingTaskId);
			return playingTaskId;
		}

		/**
		 * playingTaskId setter
		 * @method setPlayingTaskId
		 * @param {Number} taskId
		 */
		function setPlayingTaskId(taskId) {
			playingTaskId = taskId;
			log("setPlayingTaskId", playingTaskId);
		}

		/**
		 * @method getPrePaddingOption
		 * @param {Number} preValue
		 * @param {Number} postValue
		 * @param {Boolean} isFutureEvent
		 * @return {Object} getPrePaddingOption
		 */
		function getPrePostButtons(preValue, postValue, isFutureEvent) {
			var prePaddingCallback = function (value) {
					prePaddingValue = value;
				},
				postPaddingCallback = function (value) {
					postPaddingValue = value;
				};
			prePaddingValue = (isFutureEvent) ? preValue : 0;
			postPaddingValue = postValue;
			return {
				title: "prePostPadding",
				listObjectName: 'FixedList',
				callback: function (obj) {
					if (obj.action) {
						obj.action();
					}
				},
				buttons: [
					{
						name: $N.app.PVRUtil.getString("startRecording"),
						action: "",
						ctrlname: "labelPaddingBefore",
						selectable: false,
						type: $N.app.constants.POPUP_MULTIROW_DATA_TYPE.LABEL,
						width: 400
					},
					{
						name: preValue,
						action: "",
						ctrlname: "prePadding",
						selectable: isFutureEvent,
						type: $N.app.constants.POPUP_MULTIROW_DATA_TYPE.DIRECT_ENTRY,
						callback: prePaddingCallback,
						width: 100
					},
					{
						name: $N.app.PVRUtil.getString("minsBeforeAndFinish"),
						action: "",
						ctrlname: "labelPaddingAfter",
						selectable: false,
						type: $N.app.constants.POPUP_MULTIROW_DATA_TYPE.LABEL,
						width: 500
					},
					{
						name: postValue,
						action: "",
						ctrlname: "postPadding",
						type: $N.app.constants.POPUP_MULTIROW_DATA_TYPE.DIRECT_ENTRY,
						selectable: true,
						callback: postPaddingCallback,
						width: 100
					},
					{
						name: $N.app.PVRUtil.getString("minsAfter"),
						action: "",
						ctrlname: "labelPaddingAfter",
						selectable: false,
						type: $N.app.constants.POPUP_MULTIROW_DATA_TYPE.LABEL,
						width: 250
					}
				],
				buttonMovementPositions : [{x : 0, y : 0}, {x : 405, y : 0}, {x : 528, y : 0}, {x : 1017, y : 0}, {x : 1141, y : 0}]
			};
		}
		/**
		 * @method getDialogButtons
		 * @param {Number} recordOption
		 * @param {Number} cancelOption
		 * @return {Array} dialogButons
		 */
		function getDialogButtons(recordOption, cancelOption) {
			return [{
				name: $N.app.PVRUtil.getString("recordConfirm"),
				action: recordOption
			}, {
				name: $N.app.PVRUtil.getString("cancel"),
				action: cancelOption
			}];
		}

		/**
		 * @method isDefaultRecordingType
		 * @param {Number} type of recording to check against the preference
		 * @return {Boolean} recordSeriesOption
		 */
		function isDefaultSeriesRecordingType(type) {
			var seriesRecordingPreference = Preferences.get(Constants.PREF_EPISODIC_TYPE_OF_EPISODES);
			return (type === seriesRecordingPreference);
		}

		/**
		 * @method getRecordSeriesOption
		 * @param {Function} callback
		 * @return {Object} recordSeriesOption
		 */
		function getRecordSeriesOption(callback) {
			var REC_SERIES = 'RECORD_SERIES',
				RECORD_EVENT = 'RECORD_EVENT';
			return {
				title: $N.app.PVRUtil.getString("optionRecord"),
				selectListWidth: SELECT_LIST_WIDTH,
				listObjectName: 'HorizontalSelectorControl',
				selectable: true,
				buttons: [{
					name: $N.app.PVRUtil.getString("recordEvent"),
					action: RECORD_EVENT,
					isDefault: !isDefaultSeriesRecordingType(Constants.TYPE_OF_EPISODE_OPTION_ALL_EPISODE)
				}, {
					name: $N.app.PVRUtil.getString("recordSeries"),
					action: REC_SERIES,
					isDefault: isDefaultSeriesRecordingType(Constants.TYPE_OF_EPISODE_OPTION_ALL_EPISODE)
				}],
				highlightedCallback: callback
			};
		}

		/**
		 * @method addRootAndOrDefaultFolder
		 * @param {Object} optionalControl
		 * @param {String} folderOption
		 */
		function addRootAndOrDefaultFolder(optionalControl, folderOption) {
			var rootFolder = $N.app.FolderUtil.getString('pvrSettingsRecordingHighlights'),
				defaultFolder = $N.app.FolderUtil.getDislayedDefaultNonEpisodicFolderName();
			// adding the default folder
			optionalControl.folderName.buttons.push({
				name: defaultFolder,
				value: ((defaultFolder === rootFolder) ? Constants.ROOT_PVR_FOLDER_VALUE : defaultFolder),
				action: folderOption
			});
			//adding the root folder if its not the same as the default folder
			if (defaultFolder !== rootFolder) {
				optionalControl.folderName.buttons.push({
					name: rootFolder,
					value: Constants.ROOT_PVR_FOLDER_VALUE,
					action: folderOption
				});
			}
		}

		/**
		 * @method getUsedSpacePercentage
		 * @param {Number} freeSpsce
		 * @param {Number} totalSpace
		 * @return {Number} the percentage value to return
		 */
		function getUsedSpacePercentage(freeSpace, totalSpace) {
			freeSpace = freeSpace || 0;
			totalSpace = totalSpace || 0;
			var MAX_PERCENTAGE = 99,
				reviewBufferPerc = $N.platform.system.Preferences.get($N.app.constants.PVR_REVIEW_BUFFER_PERCENT_PREF, true) || $N.app.constants.PVR_REVIEW_BUFFER_PERCENT_DEFAULT,
				usedSpace = (totalSpace - freeSpace),
				percentUsed = (usedSpace / totalSpace) * 100,
				// calculates the space for the review buffer and returns that as part of the percentage.
				// ie 80% full becomes 88% with a 10% review buffer
				reviewBufferSize = (1 + (reviewBufferPerc / 100)),
				usedSpacePercentage = Math.ceil(percentUsed * reviewBufferSize);
			if (usedSpacePercentage > MAX_PERCENTAGE) {
				return MAX_PERCENTAGE;
			} else {
				return usedSpacePercentage;
			}
		}

		/**
		 * @method getFreeSpacePercentage
		 * @param {Number} freeSpace
		 * @param {Number} totalSpace
		 * @return {Number} the percentage value to return
		 */
		function getFreeSpacePercentage(freeSpace, totalSpace) {
			freeSpace = freeSpace || 0;
			totalSpace = totalSpace || 0;
			var percUsed = getUsedSpacePercentage(freeSpace, totalSpace);
			return Math.ceil(100 - percUsed);
		}


		/**
		 * @method addUserCreatedFolders
		 * @param {Object} optionalControl
		 * @param {String} folderOption
		 */
		function addUserCreatedFolders(optionalControl, folderOption) {
			var currentFolders = Preferences.get($N.app.constants.PVR_NON_EPISODIC_FOLDER_LIST),
				i,
				folderToAdd,
				currentFoldersLength = currentFolders.length,
				defaultFolder = $N.app.FolderUtil.getDislayedDefaultNonEpisodicFolderName();
			for (i = 0; i < currentFoldersLength; i++) {
				if (currentFolders[i].trim().length > 0 && defaultFolder !== $N.app.StringUtil.removeLeadingForwardSlash(currentFolders[i]) && !$N.app.FolderUtil.isFolderRootFolder(currentFolders[i])) {
					folderToAdd = {
						name: $N.app.StringUtil.removeLeadingForwardSlash(currentFolders[i]),
						value: currentFolders[i],
						action: folderOption
					};
					optionalControl.folderName.buttons.push(folderToAdd);
				}
			}
		}

		/**
		 * @method pushEventFoldersToOptionalControl
		 * @param {Object} optionalControl
		 */
		function pushEventFoldersToOptionalControl(optionalControl) {
			addRootAndOrDefaultFolder(optionalControl, 'FOLDER_OPTION');
			addUserCreatedFolders(optionalControl, 'FOLDER_OPTION');
		}

		/**
		 * @method pushSeriesFolderToOptionalControl
		 * @param {Object} optionalControl
		 * @param {Object} event
		 * @param {Object} extendedInfo
		 */
		function pushSeriesFolderToOptionalControl(optionalControl, event, extendedInfo) {
			var seriesFolderName = extendedInfo.seriesName || event.seriesName || event.title,
				folderToAdd = {
					name: seriesFolderName,
					value: seriesFolderName,
					action: 'FOLDER_OPTION'
				};
			optionalControl.folderName.buttons.push(folderToAdd);
		}

		/**
		 * @method getOptionalControl
		 * @return {Object} optionalControl
		 */
		function getOptionalControl() {
			return {
				folderName: {
					title: $N.app.PVRUtil.getString("folderName"),
					selectListWidth: SELECT_LIST_WIDTH,
					listObjectName: 'HorizontalSelectorControl',
					buttons: []
				}
			};
		}

		/**
		 * @method enableFolderNameOption
		 * @param {Object} optionalControl
		 */
		function enableFolderNameOption(optionalControl) {
			optionalControl.folderName.selectable = true;
			optionalControl.folderName.cssClass = 'popupButton';
			optionalControl.folderName.highlightCssClass = 'popupButton_highlight';
			optionalControl.folderName.textCssClass = 'dialogButtonTextLeft';
		}

		/**
		 * @method disableFolderNameOption
		 * @param {Object} optionalControl
		 */
		function disableFolderNameOption(optionalControl) {
			optionalControl.folderName.selectable = false;
			optionalControl.folderName.cssClass = 'unSelectableOptionsMenuItem';
			optionalControl.folderName.highlightCssClass = 'unSelectableOptionsMenuItem';
			optionalControl.folderName.textCssClass = 'unSelectableDialogButtonTextLeft';
		}

		/**
		 * @method recordSeriesHighlightedCallbackAction
		 * @param {Object} item
		 * @param {Object} event
		 * @param {Object} extendedInfo
		 * @param {Object} optionalControl
		 * @param {Object} dialog
		 */
		function recordSeriesHighlightedCallbackAction(item, event, extendedInfo, optionalControl) {
			var dialogue = $N.app.DialogueHelper.getDialogue($N.app.constants.DLG_RECORD_CONFIRMATION),
				REC_SERIES = 'RECORD_SERIES',
				RECORD_EVENT = 'RECORD_EVENT';

			if (!dialogue) {
				log("recordSeriesHighlightedCallbackAction", "Failed to find dialogue with id DLG_RECORD_CONFIRMATION");
				return;
			}

			optionalControl.folderName.buttons = [];
			if (item === REC_SERIES) {
				disableFolderNameOption(optionalControl);
				pushSeriesFolderToOptionalControl(optionalControl, event, extendedInfo);
			} else if (item === RECORD_EVENT) {
				enableFolderNameOption(optionalControl);
				pushEventFoldersToOptionalControl(optionalControl);
			}

			dialogue.customise({folderName: optionalControl.folderName});
		}

		/**
		 * Show the hard disk low popup if space less than 10 percent = 90 percent Used
		 * @method checkAndShowDiskSpaceLowPopup
		 */
		function checkAndShowDiskSpaceLowPopup() {
			var MAX_DISK_USAGE_BEFORE_SHOWING_DIALOGUE = 90,
				callback = function (freeSpace) {
					var percentUsed = getUsedSpacePercentage(freeSpace, getTotalRecordingSpace());
					if (percentUsed && percentUsed > MAX_DISK_USAGE_BEFORE_SHOWING_DIALOGUE) {
						$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_DISK_SPACE);
					}
				};
			$N.platform.system.Device.getFreeHardDriveSpace(callback);
		}

		/**
		 *
		 * @method getPrePaddingFromPreferences
		 * @param {Boolean} isSeriesRecording
		 * @return {Number} number of minutes to add as pre padding
		 */
		function getPrePaddingFromPreferences(isSeriesRecording) {
			return Preferences.get(isSeriesRecording ? Constants.PREF_EPISODIC_BEFORE_PADDING : Constants.PREF_BEFORE_PADDING) || 0;
		}
		/**
		 *
		 * @method getPostPaddingFromPreferences
		 * @param {Boolean} isSeriesRecording
		 * @return {Number} number of minutes to add as post padding
		 */
		function getPostPaddingFromPreferences(isSeriesRecording) {
			return Preferences.get(isSeriesRecording ? Constants.PREF_EPISODIC_AFTER_PADDING : Constants.PREF_AFTER_PADDING) || 0;
		}

		/**
		 * @method dialogCallbackAction
		 * @param {Object} key
		 * @param {Object} event
		 * @param {Function} callback
		 */
		function dialogCallbackAction(key, event, callback) {
			log("dialogCallbackAction", "Enter");
			var RECORD_OPTION = 1,
				REC_SERIES = 'RECORD_SERIES',
				metaData = null,
				isSeriesRecording = key.optionalControl.recordSeries && key.optionalControl.recordSeries.control.action === REC_SERIES,
				manualDelete = null,
				scheduleRecording = function () {
					log("dialogCallbackAction", "Enter - scheduleRecording");
					if (isSeriesRecording) {
						manualDelete = Preferences.get(Constants.PREF_EPISODIC_KEEP_UNTIL) === Constants.KEEP_UNTIL_OPTION_MANUAL_DELETE;
						log("dialogCallbackAction", "Scheduling series recording");
						$N.app.PVRUtil.requestSeriesRecording(event, metaData, manualDelete);
					} else {
						manualDelete = Preferences.get(Constants.PREF_DEFAULT_KEEP_UNTIL) === Constants.KEEP_UNTIL_OPTION_MANUAL_DELETE;
						log("dialogCallbackAction", "Scheduling recording");
						$N.app.PVRUtil.requestEventRecording(event, metaData, manualDelete);
					}
					if (callback) {
						callback({state: "record"});
					}
					checkAndShowDiskSpaceLowPopup();
					log("dialogCallbackAction", "Exit - scheduleRecording");
				};

			if (key.action === RECORD_OPTION) {
				if (key.optionalControl.folderName) {
					metaData = {
						uiFolder: $N.app.StringUtil.addLeadingForwardSlash(key.optionalControl.folderName.control.value)
					};
				}
				metaData.softPrepaddingDuration = prePaddingValue;
				metaData.softPostpaddingDuration = postPaddingValue;
				if (event.source === $N.data.EPGEvent.SOURCE.MDS) {
					$N.app.epgUtil.addMdsEventToEPG(event, scheduleRecording);
				} else {
					scheduleRecording();
				}
			}
			log("dialogCallbackAction", "Exit");
		}



		/**
		 * @method recordEvent
		 * @param {Object} event
		 * @param {Function} callback
		 */
		function recordEvent(event, callback) {
			var extendedInfo = $N.app.epgUtil.getExtendedInfoByEventId(event.eventId),
				RECORD_OPTION = 1,
				CANCEL_OPTION = 2,
				optionalControl = getOptionalControl(),
				eventTitle = event.seriesId && event.episodeId ? event.title + $N.app.epgUtil.getSeasonEpisodeShort(event, " ") : event.title,
				message,
				isFutureEvent = $N.app.EventUtil.isFutureEvent(event),
				isSeriesRecording = event.seriesId || extendedInfo.series,
				dialogCallback = function (keys) {
					dialogCallbackAction(keys, event, callback);
				},
				recordSeriesHighlightedCallback = function (item) {
					recordSeriesHighlightedCallbackAction(item, event, extendedInfo, optionalControl);
				};
			if (isSeriesRecording) {
				optionalControl.recordSeries = getRecordSeriesOption(recordSeriesHighlightedCallback);
			}

			if (isSeriesRecording && isDefaultSeriesRecordingType(Constants.TYPE_OF_EPISODE_OPTION_ALL_EPISODE)) {
				disableFolderNameOption(optionalControl);
				pushSeriesFolderToOptionalControl(optionalControl, event, extendedInfo);
			} else {
				enableFolderNameOption(optionalControl);
				pushEventFoldersToOptionalControl(optionalControl);
			}

			optionalControl.prePostPadding = getPrePostButtons(
				getPrePaddingFromPreferences(isSeriesRecording),
				getPostPaddingFromPreferences(isSeriesRecording),
				isFutureEvent
			);
			if ($N.platform.btv.WHPVRManager.isLocalRecordServer()) {
				message = "";
			} else if ($N.platform.btv.WHPVRManager.isRemoteRecordServerValid()) {
				/* if remote server is invalid, for more friendly maybe
				 * need pop-up message to reset the record location in setting later*/
				message = $N.app.PVRUtil.getString("remoteRecordConfirmMessage") + $N.platform.btv.WHPVRManager.getCurrentRecordServerName();
			}

			// Delete the dialogue (if it exists) so forcing creation of a new one. Not ideal.
			// The alternative would be to updating the existing which is difficult due to it being a ConfirmationDialogueWithControls.
			$N.app.DialogueHelper.deleteDialogue($N.app.constants.DLG_RECORD_CONFIRMATION);

			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_RECORD_CONFIRMATION,
				eventTitle,
				message,
				getDialogButtons(RECORD_OPTION, CANCEL_OPTION),
				dialogCallback,
				null, // optionHighlightedCallbackParam
				null, // optionsOrientationParam
				null, // titleImageParam
				null, // dialogObjectConfigParam
				null, // alertIconParam
				null, // guiTemplate
				optionalControl
				);
		}

		function onTasksChangedListener(e) {
			if (onTasksChangedCallback) {
				onTasksChangedCallback(e);
				onTasksChangedCallback = null;
			}
		}

		function stopTaskOKListener(e) {
			if (stopTaskOKCallback) {
				stopTaskOKCallback(e);
				stopTaskOKCallback = null;
			}
		}

		/**
		 * @method getCancelRecordingPopupButtons
		 * @param {Boolean} isSeriesRecording
		 */
		function getCancelRecordingPopupButtons(isSeriesRecording) {
			var actions = $N.app.constants.DLG_ACTIONS,
				buttons = [{
					name: (isSeriesRecording) ? $N.app.PVRUtil.getString("back") : $N.app.PVRUtil.getString("no"),
					action: actions.EXIT_OPTION
				}, {
					name: (isSeriesRecording) ? $N.app.PVRUtil.getString("cancelSeriesDeleteEpisodeButton") : $N.app.PVRUtil.getString("yes"),
					action: actions.CONTINUE_CANCEL_EPISODE_OPTION
				}];
			if (isSeriesRecording) {
				buttons.push({
					name: $N.app.PVRUtil.getString("cancelSeriesDeleteSeriesButton"),
					action: actions.CONTINUE_CANCEL_SERIES_OPTION
				});
			}
			return buttons;
		}

		/**
		 * @method getCancelSingleEventPopup
		 * @param {Object} event
		 * @param {Function} callback
		 * @param {String} title
		 * @param {String} subtitle
		 * @param {String} dialogEnum
		 * @return {object} return the dialog properties as an object
		 */
		function getCancelSingleEventPopup(event, callback, title, subtitle, dialogEnum) {
			log("getCancelSingleEventPopup", "Enter");
			var dialogCallback = function (key) {
					var actions = $N.app.constants.DLG_ACTIONS;
					$N.apps.dialog.DialogManager.hideDialogWithId("CancelRecordConfirmationDialogue");
					if (key && key.action === actions.CONTINUE_CANCEL_EPISODE_OPTION) {
						if (callback) {
							// Need to run the callback when the recordings table has updated & not before
							// If the callback is run straight away the task might not of updated in the UI ?
							if ($N.app.EventUtil.isFutureEvent(event)) {
								onTasksChangedCallback = function () {
									callback({state: "cancel", event: event});
								};
							} else {
								stopTaskOKCallback = function () {
									callback({state: "cancel", event: event});
								};
							}
						}
						if ($N.app.PVRUtil.isRecordingSetForEvent(event)) {
							$N.platform.btv.PVRManager.cancelEventRecording(event);
						} else {
							$N.app.ManualRecordingHelper.cancelManualRecording(event);
						}
					}
				};
			log("getCancelSingleEventPopup", "Exit");
			return {
				dialogueEnum: dialogEnum,
				title: title,
				subtitle: subtitle,
				dialogButtons: getCancelRecordingPopupButtons(false),
				dialogCallback: dialogCallback
			};
		}

		/**
		 * @method getCancelSeriesPopup
		 * @param {Object} event
		 * @param {Function} callback
		 * @return {object} return the dialog object
		 */
		function getCancelSeriesPopup(event, callback) {
			var dialogCallback = function (key) {
					var actions = $N.app.constants.DLG_ACTIONS;
					$N.apps.dialog.DialogManager.hideDialogWithId("CancelRecordConfirmationDialogue");
					if (key && (key.action === actions.CONTINUE_CANCEL_EPISODE_OPTION || key.action === actions.CONTINUE_CANCEL_SERIES_OPTION)) {
						if (key.action === actions.CONTINUE_CANCEL_SERIES_OPTION) {
							if ($N.app.PVRUtil.isRecordingSetForEvent(event)) {
								$N.platform.btv.PVRManager.cancelSeriesRecordingByEventId(event.eventId);
							} else {
								$N.app.ManualRecordingHelper.cancelManualRecording(event);
							}
						} else {
							if ($N.app.PVRUtil.isRecordingSetForEvent(event)) {
								$N.platform.btv.PVRManager.cancelEventRecording(event);
							} else {
								$N.app.ManualRecordingHelper.cancelManualRecording(event);
							}
						}
						if (callback) {
							callback({key: key});
						}
					}
				};
			log("getCancelSeriesPopup", "Exit");
			return {
				dialogueEnum: $N.app.constants.DLG_CANCEL_SERIES,
				title: $N.app.PVRUtil.getString("cancelSeriesRecording"),
				subtitle: $N.app.PVRUtil.getString("cancelSeriesSubtitle"),
				dialogButtons: getCancelRecordingPopupButtons(true),
				dialogCallback: dialogCallback,
				buttonAlignment: "VERTICAL"
			};
		}

		/**
		 * @method cancelEvent
		 * @param {Object} event
		 * @param {Function} callback
		 */
		function cancelEvent(event, callback) {
			log("cancelEvent", "Enter");
			var dialogOptions = null;
			if ($N.app.PVRUtil.isSeriesRecordingSetForEvent(event) || $N.app.PVRUtil.isSeriesManualRecordingSet(event.serviceId)) {
				dialogOptions = getCancelSeriesPopup(event, callback);
			} else if ($N.app.EventUtil.isEventShowingNow(event)) {
				dialogOptions = getCancelSingleEventPopup(event, callback, $N.app.PVRUtil.getString("endofRecording"), $N.app.PVRUtil.getString("interruptRecording"),  $N.app.constants.DLG_CANCEL_LIVE_RECORD);
			} else {
				dialogOptions = getCancelSingleEventPopup(event, callback, $N.app.PVRUtil.getString("cancelRecording"), "",  $N.app.constants.DLG_CANCEL_RECORD);
			}

			$N.app.DialogueHelper.createAndShowDialogue(
				dialogOptions.dialogueEnum,
				dialogOptions.title,
				dialogOptions.subtitle,
				dialogOptions.dialogButtons,
				dialogOptions.dialogCallback,
				null,
				dialogOptions.buttonAlignment
			);
			log("cancelEvent", "Exit");
		}

		/**
		 * @method getValuesForCancelDialog
		 * @param {Object} task
		 * @param {Object} callback
		 * @return {Object} values for the dialogue returned as an object
		 *
		 */

		function getValuesForCancelDialog(task, callback) {
			log("getValuesForCancelDialog", "Enter");
			var isSeriesRecording = (task.recordingType === $N.data.Recording.RECORDING_TYPE.SERIES),
				returnObj = {
					dialogButtons: getCancelRecordingPopupButtons(isSeriesRecording),
					buttonAlignment: ""
				};

			if (isSeriesRecording) {
				returnObj.title = $N.app.PVRUtil.getString("cancelSeriesRecording");
				returnObj.subtitle =  $N.app.PVRUtil.getString("cancelSeriesSubtitle");
				returnObj.dialogueEnum =  $N.app.constants.DLG_CANCEL_SERIES;
				returnObj.dialogId = "CancelSeriesConfirmation";
				returnObj.buttonAlignment = "VERTICAL";
			} else if ($N.app.PVRUtil.isTaskActive(task)) {
				returnObj.title = $N.app.PVRUtil.getString("endofRecording");
				returnObj.subtitle = $N.app.PVRUtil.getString("interruptRecording");
				returnObj.dialogueEnum = $N.app.constants.DLG_CANCEL_LIVE_RECORD;
				returnObj.dialogId = "CancelLiveRecordConfirmation";
			} else {
				returnObj.title = $N.app.PVRUtil.getString("cancelRecording");
				returnObj.subtitle = "";
				returnObj.dialogueEnum = $N.app.constants.DLG_CANCEL_RECORD;
				returnObj.dialogId =  "CancelRecordConfirmation";
			}

			returnObj.dialogCallback = function (key) {
				var actions = $N.app.constants.DLG_ACTIONS;
				$N.apps.dialog.DialogManager.hideDialogWithId(returnObj.dialogId);
				if (key && key.action !== actions.EXIT_OPTION) {
					if (callback) {
						callback({key: key});
					}
					if (key.action === actions.CONTINUE_CANCEL_SERIES_OPTION) {
						$N.platform.btv.PVRManager.cancelSeriesRecording(task.jobId);
					} else {
						$N.platform.btv.PVRManager.cancelRecordingByTask(task);
					}
				}
			};
			log("getValuesForCancelDialog", "Exit");
			return returnObj;
		}

		/**
		 * @method cancelTask
		 * @param {Object} task
		 * @param {Function} callback
		 */
		function cancelTask(task, callback) {
			log("cancelTask", "Enter");
			var dialogOptions = getValuesForCancelDialog(task, callback);
			$N.app.DialogueHelper.createAndShowDialogue(
				dialogOptions.dialogueEnum,
				dialogOptions.title,
				dialogOptions.subtitle,
				dialogOptions.dialogButtons,
				dialogOptions.dialogCallback,
				null,
				dialogOptions.buttonAlignment
			);
			log("cancelTask", "Enter");
		}


		/**
		 * @method deleteTasks
		 * @param {Array} tasks
		 */
		function deleteTasks(tasks) {
			log("deleteTasks", "Enter");
			initialiseTasksCallbackCount(tasks.length);
			tasks.forEach(function (task) {
				log("deleteTasks", "Deleting task:" + task.taskId);
				$N.platform.btv.PVRManager.deleteTask(task);
			});
			log("deleteTasks", "Exit");
		}

		/**
		 * @method showDialogueAndDeleteTasks
		 * @param {Array} tasks
		 * @param {Function} callback
		 * @param {Object} options
		 */
		function showDialogueAndDeleteTasks(tasks, callback, options) {
			log("showDialogueAndDeleteTasks", "Enter");
			var dialogCallback = function (key) {
					var actions = $N.app.constants.DLG_ACTIONS;
					log("deleteTasksCallback", "Enter");
					$N.apps.dialog.DialogManager.hideDialogWithId("DeleteRecordConfirmation");
					if (key.action !== actions.EXIT_OPTION) {
						if (callback) {
							callback({key: key});
						}
						deleteTasks(tasks);
					}
					log("deleteTasksCallback", "Enter");
				};

			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_DELETE_RECORD,
				(options && options.titleText) ? options.titleText : $N.app.PVRUtil.getString("deleteRecording"),
				(options && options.messageText) ? options.messageText : "",
				getCancelRecordingPopupButtons(false),
				dialogCallback,
				null,
				null,
				null,
				(options && options.dialogObjectConfigParam) ? options.dialogObjectConfigParam : null);
			log("showDialogueAndDeleteTasks", "Exit");
		}

		/**
		 * @method initialiseSortOptions
		 */
		function initialiseSortOptions() {
			sortOptions = [{
				name: "dateSort",
				action: $N.app.SortUtil.sortByDateDesc
			}, {
				name: "titleSort",
				action: $N.app.SortUtil.sortByTitle
			}, {
				name: "channelSort",
				action: $N.app.SortUtil.sortByChannel
			}];
		}

		/**
		 * @method remoteAccessCallback
		 * @param {Object} event
		 */
		function remoteAccessCallback(e) {
			if (e && e.action === $N.app.constants.YES_OPTION) {
				if (CCOM.ConfigManager.getValue("/network/rbs/RBS_State").keyValue === 2) {
					CCOM.ConfigManager.setValue("/network/rbs/RBS_State", 3);
				}
			} else if (e && e.action === $N.app.constants.NO_OPTION) {
				CCOM.ConfigManager.setValue("/network/rbs/RBS_State", 4); // deny
			}
		}

		/**
		 * @method showRemoteAccessDlg
		 * @param {Object} event
		 */
		function showRemoteAccessDlg() {
			var dialogueButtons = [{
					name: $N.app.PVRUtil.getString("yes"),
					action: $N.app.constants.YES_OPTION
				}, {
					name: $N.app.PVRUtil.getString("no"),
					action: $N.app.constants.NO_OPTION
				}];

			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_DVR_OPERATOR_DISABLED,
				$N.app.PVRUtil.getString("remoteAccessAuthorisationTitle"),
				$N.app.PVRUtil.getString("remoteAccessAuthorisationMessage"),
				dialogueButtons,
				remoteAccessCallback);
		}

		/**
		 * @method initialiseSortOptions
		 * @param {Object} event
		 */
		function initialiseRemoteAccess(remoteAccessIndicator) {
			remoteAccessIndicator.addFadeAnimation();
			$N.platform.system.Preferences.monitorValue("/network/rbs/RBS_State", function () {
				var rbsState = CCOM.ConfigManager.getValue("/network/rbs/RBS_State").keyValue;
				switch (rbsState) {
				case 2: // ask user for approval for operator
					showRemoteAccessDlg();
					break;
				case 3: // engineer access?
				case 4: // user denied access
					if (remoteAccessIndicator.spinningLoadIcon.isVisible()) {
						remoteAccessIndicator.doFade(0);
						remoteAccessIndicator.spinningLoadIcon.hide();
					}
					return;
				case 5: // access in progress ?
					remoteAccessIndicator.remoteAccessLabel.setText($N.app.PVRUtil.getString("remoteAccessMessage"));
					if (!remoteAccessIndicator.spinningLoadIcon.isVisible()) {
						remoteAccessIndicator.doFade(1);
						remoteAccessIndicator.spinningLoadIcon.show();
					}
					break;
				default:
					if (remoteAccessIndicator.spinningLoadIcon.isVisible()) {
						remoteAccessIndicator.doFade(0);
						remoteAccessIndicator.spinningLoadIcon.hide();
					}
					break;
				}
			}, null, true);
		}

		return {
			/**
			 * initialise the PVRUtil
			 * @method initialise
			 */
			initialise: function () {
				log("initialise", "Enter");
				$N.apps.core.Language.adornWithGetString($N.app.PVRUtil);
				$N.app.PVROptionsUtil.initialise();
				initialiseSortOptions();
				$N.platform.btv.PVRManager.addEventListener("onTasksChanged", onTasksChangedListener);
				$N.platform.btv.PVRManager.addEventListener("stopTaskOK", stopTaskOKListener);
				log("initialise", "Exit");
			},

			/**
			 * Helper method to handle navigation to Synopsis
			 * @method navigateToSynopsis
			 * @param {Object} eventToDisplay
			 * @param {Function} navCompleteCallback callback function fire on return
			 */
			navigateToSynopsis: function (eventToDisplay, navCompleteCallback) {
				$N.app.ContextHelper.openContext("SYNOPSIS", {
					activationContext: {
						"data": eventToDisplay,
						"type": eventToDisplay.eventId ? "PVR" : "TBR", //If the task has got no eventId information, then it is Time based recording task
						"playing": false
					},
					navCompleteCallback: navCompleteCallback
				});
			},

			/**
			 * Update hard drive space progress bar by registering a callback.
			 * @method updateHDDProgress
			 * @param {Object} progressBarGroup
			 */
			updateHDDProgress: function (hardDriveSpaceGroup) {
				log("updateHDDProgress", "Enter");
				var callback = function (freeSpace) {
						var totalRecordingDiskSpace = getTotalRecordingSpace(),
							percentUsed = getUsedSpacePercentage(freeSpace, totalRecordingDiskSpace),
							percentFree = getFreeSpacePercentage(freeSpace, totalRecordingDiskSpace);
						if (isNaN(percentUsed)) {
							percentUsed = 0;
							hardDriveSpaceGroup.hide();
						} else {
							hardDriveSpaceGroup.show();
						}
						hardDriveSpaceGroup.progressBar.setProgress(percentUsed);
						hardDriveSpaceGroup.progressBarLabel.setText(String(percentFree) + "% " + $N.app.PVRUtil.getString("diskSpaceFree"));
					};
				$N.platform.system.Device.getFreeHardDriveSpace(callback);
			},

			/**
			 * Applies the given sortMode to the given recordings list
			 * @method applySortToRecordingsList
			 * @param {Object}recordings
			 * @param {Object} sortMode
			 * @return {Object}
			 */
			applySortToRecordingsList: function (recordings, sortMode) {
				log("applySortToRecordingsList", "Enter & Exit");
				return recordings.sort(sortMode.action);
			},

			/**
			 * Returns the array of sort option objects
			 * @method getSortOptions
			 * @return sortOptions
			 */
			getSortOptions: function () {
				log("getSortOptions", "Enter & Exit");
				return sortOptions;
			},

			/**
			 * Checks if an event recording status is TASK_STATUS_SCHEDULED or TASK_STATUS_ACTIVE
			 * @method isRecordingActiveOrScheduled
			 * @param {Number} recordingStatus - the enum
			 * @return {Boolean}
			 */
			isRecordingActiveOrScheduled: function (recordingStatus) {
				var SCHEDULED = $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_SCHEDULED,
					ACTIVE = $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_ACTIVE;
				if (recordingStatus === ACTIVE || recordingStatus === SCHEDULED) {
					return true;
				}
				return false;
			},

			/**
			 * Checks if an event recording status is TASK_STATUS_SCHEDULED_BY_SERIES or TASK_STATUS_ACTIVE_IN_SERIES
			 * @method isRecordingActiveOrScheduledForSeries
			 * @param {Number} recordingStatus - the enum
			 * @return {Boolean}
			 */
			isRecordingActiveOrScheduledForSeries: function (recordingStatus) {
				var SCHEDULED_BY_SERIES = $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_SCHEDULED_BY_SERIES,
					ACTIVE_IN_SERIES = $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_ACTIVE_IN_SERIES;
				if (recordingStatus === ACTIVE_IN_SERIES || recordingStatus === SCHEDULED_BY_SERIES) {
					return true;
				}
				return false;
			},

			/**
			 * Requests the event to be recorded.
			 * @method requestEventRecording
			 * @param {Object} (event) The event to request the recording for.
			 * @param {Object} (metaData)
			 * @param {Number} (keepTime) (optional)
			 */
			requestEventRecording: function (event, metaData, keepTime) {
				log("requestEventRecording", "Enter");
				metaData = $N.app.PVROptionsUtil.addNonEpisodicRecordingMetaData(metaData);
				$N.platform.btv.PVRManager.requestEventRecording(event, metaData, keepTime);
				log("requestEventRecording", "Exit");
			},

			/**
			 * Requests the series to be recorded.
			 * @method requestSeriesRecording
			 * @param {Object} (event)  the id of the event to request a recording for using PVRManager
			 * @param {Object} (metaData)
			 * @param {Number} (keepTime) (optional)
			 */
			requestSeriesRecording: function (event, metaData, keepTime) {
				log("requestSeriesRecording", "Enter");
				metaData = $N.app.PVROptionsUtil.addEpisodicRecordingMetaData(metaData);
				$N.platform.btv.PVRManager.requestSeriesRecording(event, metaData, keepTime);
				log("requestSeriesRecording", "Exit");
			},

			/**
			 * Returns an object containing configuration parameters that can be used
			 * to initiate stream playback - based on the type of stream i.e. rtsp or adaptive
			 * @method getVideoConfig
			 * @param {String} url The url of the asset to be played
			 * @param {String} title The title to be displayed in the OnDemand banner
			 * @param {String} subtitle The subtitle to be displayed in the OnDemand banner
			 * @param {Number} startPosition The position to begin playback from
			 * @param {Object} bookmarkManager The Bookmark Manager object
			 * @return {Object} configuration details to initialise stream playback
			 */
			getVideoConfig: function (title, subtitle, startPosition, channelNumber, channelLogo, entity) {
				log("getVideoConfig", "Enter");
				var taskId = entity.taskId,
					startTime = new Date(entity.actualStartTime),
					endTime = new Date(entity.actualStopTime || entity.endTime + entity.softPostpaddingDuration),
					startTimeStr = "",
					endTimeStr = "",
					eventId = entity.eventId;
				startTimeStr = convertTimeToString(startTime);
				endTimeStr = convertTimeToString(endTime);

				log("getVideoConfig", "Exit");
				return {
					url: entity.url,
					type: "PVR",
					title: title,
					skip: true,
					trickplay: true,
					subtitle: subtitle || $N.app.PVRUtil.getString("pvr"),
					taskId: taskId,
					channelNumber: channelNumber,
					channelLogo: channelLogo,
					scheduleStartTimeStr: startTimeStr,
					scheduleEndTimeStr: endTimeStr,
					scheduleStartTime: entity.actualStartTime || entity.startTime - entity.softPrepaddingDuration,
					scheduleEndTime: entity.actualStopTime || entity.endTime + entity.softPostpaddingDuration,
					startPosition: startPosition
				};
			},

			/**
			 * Returns if the playback position passed should be saved as a bookmark or not.
			 * Bookmarks are not saved if playback is within the last fraction of a recording.
			 * @method getVideoConfig
			 * @param {Number} position in seconds
			 * @param {Number} contentLength in seconds
			 * @return {Boolean} True if position should be bookmarked, false if deleted
			 */
			deleteOrBookmarkCurrentPosition: function (bookMarkPosition, contentLength) {
				log("deleteOrBookmarkCurrentPosition", "Enter");
				var maxPosition = contentLength * BOOKMARKABLE_CONTENT_RATIO;
				log("deleteOrBookmarkCurrentPosition", "Exit");
				return (bookMarkPosition < maxPosition);
			},

			/**
			 * Registers the given ui refresh listener with PVRManager and Reminders
			 * @method registerUIRefreshListener
			 */
			registerUIRefreshListener: function (listenerFn, callFunc) {
				log("registerUIRefreshListener", "Enter");
				$N.platform.btv.PVRManager.registerUIRefreshListener(listenerFn, callFunc);
				if (Preferences.get(Constants.PREF_MOCK_PVR) === "true") {
					$N.platform.btv.Reminders.registerUIRefreshListener(listenerFn, callFunc);
				}
				log("registerUIRefreshListener", "Exit");
			},

			/**
			 * Unregisters the given ui refresh listener from PVRManager and Reminders
			 * @method unregisterUIRefreshListener
			 */
			unregisterUIRefreshListener: function (listener) {
				log("unregisterUIRefreshListener", "Enter");
				$N.platform.btv.PVRManager.unregisterUIRefreshListener(listener);
				if (Preferences.get(Constants.PREF_MOCK_PVR) === "true") {
					$N.platform.btv.Reminders.unregisterUIRefreshListener(listener);
				}
				log("unregisterUIRefreshListener", "Exit");
			},

			/**
			 * Stores the current playing recording's taskId
			 * @method setTaskAsPlaying
			 * @param {Number} taskId
			 */
			setTaskAsPlaying: function (taskId) {
				setPlayingTaskId(taskId);
				updatePlayedState(taskId);
				log("setTaskAsPlaying", getPlayingTaskId());
			},

			/**
			 * Unsets the stored taskId
			 * @method unsetTaskAsPlaying
			 */
			unsetTaskAsPlaying: function () {
				setPlayingTaskId(null);
				log("unsetTaskAsPlaying", getPlayingTaskId());
			},

			/**
			 * Checks if a given recording is currently playing
			 * @method isTaskPlaying
			 * @param {Number} taskId
			 * @return {Boolean}
			 */
			isTaskPlaying: function (taskId) {
				log("isTaskPlaying", taskId);
				playingTaskId = getPlayingTaskId();
				if (!playingTaskId) {
					return false;
				}
				if (playingTaskId !== taskId) {
					return false;
				}
				return true;
			},

			/**
			 * @method getRecordingTimingsData
			 * @param {Object} task
			 * @return {Object}  {actualStartPosition:Number, actualStopPosition:Number, recordingDuration:Number, eventDuration:Number, bookmarkPosition:Number}
			 */
			getRecordingTimingsData: function (task) {
				log("getRecordingTimes", "Enter & Exit");
				var actualStartPosition,
					actualStopPosition,
					actualDuration,
					realStartOffset,
					eventStartWithPadding,
					eventEndWithPadding,
					eventDurationWithPadding,
					data;
				if (task) {
					data = task._data;
					if (data.actualStartTime > data.startTime) {
						actualStartPosition = data.actualStartTime - data.startTime;
						realStartOffset = data.startTime;
					} else {
						actualStartPosition = 0;
						realStartOffset = data.actualStartTime;
					}
					if ($N.app.PVRUtil.ACTIVE === $N.platform.btv.PVRManager.getTaskRecordingStatus(task)) {
						actualStopPosition = new Date().getTime() - realStartOffset;
					} else if (data.actualStopTime) {
						actualStopPosition = data.actualStopTime - realStartOffset;
					} else {
						actualStopPosition = data.actualDuration || data.duration;
					}
					eventStartWithPadding = (data.actualStartTime < data.startTime) ? data.actualStartTime : data.startTime;
					eventEndWithPadding = (data.actualStopTime > data.endTime) ? data.actualStopTime : data.endTime;
					eventDurationWithPadding = eventEndWithPadding - eventStartWithPadding;
					actualDuration = data.actualDuration || task.duration;
					return {
						actualStartPosition: actualStartPosition,
						actualStopPosition: actualStopPosition,
						recordingDuration: actualDuration || actualStopPosition - actualStartPosition,
						eventDuration: eventDurationWithPadding,
						bookmarkPosition: task.bookmark * 1000
					};
				}
				return {
					actualStartPosition: 0,
					actualStopPosition: 0,
					recordingDuration: 0,
					eventDuration: 0,
					bookmarkPosition: 0
				};
			},

			/**
			 * @method deleteSeriesOfRecordings
			 * @param {Object} seriesId
			 */
			deleteSeriesOfRecordings: function (seriesId) {
				var recordingsInSeries = $N.platform.btv.PVRManager.getRecordingsBySeries(seriesId),
					recordingsInSeriesLength = recordingsInSeries.length,
					i;
				for (i = 0; i < recordingsInSeriesLength; i++) {
					$N.platform.btv.PVRManager.deleteTask(recordingsInSeries[i]);
				}
			},

			/**
			 * @method isRecordingSetForEntity
			 * @param {Event} event
			 * @return {Boolean}
			 */
			isRecordingSetForEvent: function (event) {
				return $N.platform.btv.PVRManager.isPVREventScheduled(event);
			},

			/**
			 * @method isManualRecordingSet
			 * @param {Event} event
			 * @return {Boolean}
			 */
			isManualRecordingSet: function (event) {
				return $N.platform.btv.PVRManager.isManualRecordingActiveForService(event);
			},

			/**
			 * @method isRecordable
			 * @param {Object} event
			 * @param {Object} (optional) service
			 * @return {Boolean}
			 */
			isRecordable: function (event, service) {
				log("isRecordable", "Enter");
				var isValidEvent = $N.app.EventUtil.isValidEvent(event),
					isPastEvent = $N.app.EventUtil.isPastEvent(event),
					serviceObj = service || $N.app.epgUtil.getServiceById(event.serviceId),
					isInteractiveChannel = $N.app.ChannelManager.isInteractiveChannel(serviceObj);

				if (isValidEvent && !isPastEvent && !isInteractiveChannel) {
					log("isRecordable", "Exit, returning true");
					return true;
				}
				log("isRecordable", "Exit, returning false");
				return false;
			},

			/**
			 * @method isRecordingPossible
			 * @param {Object} event
			 */
			isRecordingPossible: function (event) {
				if (!$N.app.PVRCapability.isOperatorPVREnabled()) {
					$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_DVR_OPERATOR_DISABLED);
					return;
				}

				if (!$N.app.PVRCapability.isHardDriveAvailable() && $N.platform.btv.WHPVRManager.isLocalRecordServer()) {
					$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_DVR_DISC_NOT_PRESENT);
					return;
				}

				/*If the server is remote and invalid, but there is still some other server can be set, we display the popup.*/
				if (!$N.platform.btv.WHPVRManager.isLocalRecordServer()	&& !$N.platform.btv.WHPVRManager.isRemoteRecordServerValid() && $N.platform.btv.WHPVRManager.hasRemoteServers()) {
					$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_WHPVR_SERVER_NOT_PRESENT);
					return;
				}

				if (!$N.app.EventUtil.isValidEvent(event)) {
					return;
				}

				if ($N.app.PPVHelper.getPPVEventPurchaseInfo(event)) {
					$N.app.DialogueHelper.createAndShowDialogue(
						$N.app.constants.DLG_PPV_RECORDING_BLOCKED,
						$N.app.StringUtil.join("", [$N.app.DialogueHelper.getString("attention"), "!"]), // title
						$N.app.DialogueHelper.getString("ppvRecordingBlockedMessage") // message
					);
					return;
				}
				return true;
			},

			/**
			 * This method sets recording or cancel recording if already a record is set.
			 * @method eventOrManualRecordSetOrCancel
			 * @param {Object} event
			 * @param {Function} callback
			 */
			eventOrManualRecordSetOrCancel: function (event, callback) {
				if ($N.app.PVRUtil.isRecordingPossible(event)) {
					if (this.isRecordingSetForEvent(event) || ($N.app.EventUtil.isEventShowingNow(event) && this.isManualRecordingSet(event))) {
						cancelEvent(event, callback);
					} else {
						recordEvent(event, callback);
					}
				}
			},

			/**
			 * @method cancelEventOrManualRecord
			 * @param {Object} event
			 * @param {Function} callback
			 */
			cancelEventOrManualRecord: function (event, callback) {
				if (this.isRecordingSetForEvent(event) || this.isManualRecordingSet(event)) {
					cancelEvent(event, callback);
				}
			},

			/**
			 * @method recordOrCancelEvent
			 * @param {Object} event
			 * @param {Function} callback
			 */
			recordOrCancelEvent: function (event, callback) {
				if ($N.app.PVRUtil.isRecordingPossible(event)) {
					if (this.isRecordingSetForEvent(event)) {
						cancelEvent(event, callback);
					} else {
						recordEvent(event, callback);
					}
				}
			},

			/**
			 * @method cancelEvent
			 * @param {Object} event
			 * @param {Function} callback
			 */
			cancelEvent: function (event, callback) {
				if (this.isRecordingSetForEvent(event)) {
					cancelEvent(event, callback);
				}
			},

			/**
			 * @method cancelTask
			 * @param {Object} task
			 * @param {Function} callback
			 * @param {Object} options
			 */
			cancelTask: function (task, callback, options) {
				cancelTask(task, callback);
			},

			/**
			 * @method deleteTasks
			 * @param {Array} tasks
			 */
			deleteTasks: function (tasks) {
				deleteTasks(tasks);
			},

			/**
			 * @method showDialogueAndDeleteTasks
			 * @param {Array} tasks
			 * @param {Function} callback
			 * @param {Object} options
			 */
			showDialogueAndDeleteTasks: function (tasks, callback, options) {
				showDialogueAndDeleteTasks(tasks, callback, options);
			},

			/**
			 * This function just check local and default remote gateway if the default is set as one remote box.
			 * So we don't use this function in LibraryWindows.js for schedule, because all remote schedules are there.
			 * @method isSeriesRecordingSetForEvent
			 * @param {Object} event
			 * @return {Boolean} true if series recording set for this event, false otherwise
			 */
			isSeriesRecordingSetForEvent: function (event) {
				var recordingStatus = $N.platform.btv.PVRManager.getRecordingStatusByEvent(event);
				return recordingStatus === $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_ACTIVE_IN_SERIES || recordingStatus === $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_SCHEDULED_BY_SERIES;
			},

			/**
			 * This function checks the recording status of the given service id.
			 * @method isSeriesManualRecordingSet
			 * @param {Number} serviceId
			 * @return {Boolean} true if series recording set for this service, false otherwise
			 */
			isSeriesManualRecordingSet: function (serviceId) {
				var recordingStatus = $N.platform.btv.PVRManager.getServiceRecordingStatus(serviceId);
				return recordingStatus === $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_ACTIVE_IN_SERIES || recordingStatus === $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_SCHEDULED_BY_SERIES;
			},

			/**
			 * @method getLatestPlayableRecordings
			 * @param {Number} limit (optional) the number of recordings to return
			 * @return {Array} All non-future recordings
			 */
			getLatestPlayableRecordings: function (limit) {
				limit = limit || $N.app.constants.PORTAL_RECORDINGS_LIMIT;
				var mediumId = $N.app.PVRCapability.getCurrentMediaId() || -1,
					whereSqlQueryString = "taskType='REC' AND objectState<6 AND objectState>0 AND objectState!=2 AND isAuthorized = 1 AND mediumID = '" + mediumId + "'";
				return $N.platform.btv.PVRManager.getEntriesByQuery($N.platform.btv.PVRManager.WIDE_TASK_FIELD_FILTER, whereSqlQueryString, "actualStartTime DESC LIMIT " + limit);
			},

			/**
			 * @method getScheduledRecordings
			 * @return {Array} All future and current recordings
			 */
			getScheduledRecordings: function () {
				return $N.platform.btv.PVRManager.getScheduleTasks();
			},

			/**
			 * Returns all tasks from scheduler that are of type PVR, have not been deleted
			 * and currently active or suspended.
			 * @method getActiveAndSuspendedRecordings
			 * @return {Array} list of PVR tasks
			 */
			getActiveAndSuspendedRecordings: function () {
				log("getActiveAndSuspendedRecordings", "Enter");
				var isInactive = "0",
					whereSqlQueryString = "taskType='REC' AND (objectState=1 OR objectState=2) AND inactive=" + isInactive;
				log("getActiveAndSuspendedRecordings", "Exit");
				return PVRManager.getTasksByQuery($N.platform.btv.PVRManager.WIDE_TASK_FIELD_FILTER, whereSqlQueryString, "startTime");
			},

			/**
			 * Returns all tasks from scheduler that are of type PVR, have not been deleted
			 * and currently active, ordered by jobId
			 * @method getActiveRecordingsOrderedByJobId
			 * @return {Array} list of PVR tasks ordered by jobId
			 */
			getActiveRecordingsOrderedByJobId: function () {
				log("getActiveRecordingsOrderedByJobId", "Enter");
				var isInactive = "0",
					whereSqlQueryString = "taskType='REC' AND objectState=1 AND inactive=" + isInactive;
				log("getActiveRecordingsOrderedByJobId", "Exit");
				return PVRManager.getTasksByQuery(PVRManager.WIDE_TASK_FIELD_FILTER, whereSqlQueryString, "jobId");
			},

			/**
			 * Returns all tasks from scheduler that are of type PVR, have not been deleted
			 * and currently active or suspended, ordered by jobId
			 * @method getActiveAndSuspendedRecordingsOrderedByJobId
			 * @return {Array} list of PVR tasks ordered by jobId
			 */
			getActiveAndSuspendedRecordingsOrderedByJobId: function () {
				log("getActiveAndSuspendedRecordingsOrderedByJobId", "Enter");
				var isInactive = "0",
					whereSqlQueryString = "taskType='REC' AND (objectState=1 OR objectState=2) AND inactive=" + isInactive;
				log("getActiveAndSuspendedRecordingsOrderedByJobId", "Exit");
				return PVRManager.getTasksByQuery(PVRManager.WIDE_TASK_FIELD_FILTER, whereSqlQueryString, "jobId");
			},

			/**
			 * @method isCurrentActiveRecordings
			 * @param {Boolean} returns whether there are active recordings
			 */
			isRecordingsActive: function () {
				var tasks = $N.platform.btv.PVRManager.getActiveRecordings();
				return (tasks.length > 0);
			},

			/**
			 * @method isCurrentActiveRecordings
			 * @param {Boolean} returns whether there are active recordings
			 */
			isRecordingsScheduled: function () {
				var tasks = this.getScheduledRecordings();
				return (tasks.length > 0);
			},

			/**
			 * Updates recording with a given updateObject
			 * @example <caption>Example usage of updateRecording.</caption>
			 * updateRecording(taskId, {recordingLock: true, keep: true});
			 * @method updateRecording
			 * @param {Number} taskId of the task
			 * @param {Object} updateObject object containing fields and values to update task
			 */
			updateRecording: function (taskId, updateObject) {
				var task = $N.platform.btv.PVRManager.getTask(taskId, "objectState");
				if (task) {
					if (task._data.objectState < OBJECT_STATE.FINAL) {
						CCOM.Scheduler.updateTask(taskId, updateObject);
					} else {
						CCOM.MediaLibrary.updateEntry(taskId, updateObject);
					}
				}
			},

			/**
			 * Updates recording with a given updateObject
			 * @example <caption>Example usage of updateRecording.</caption>
			 * updateRecordingByTask(task, {recordingLock: true, keep: true});
			 * @method updateRecordingByTask
			 * @param {Object} task object
			 * @param {Object} updateObject object containing fields and values to update task
			 */
			updateRecordingByTask: function (task, updateObject) {
				if (!$N.platform.btv.PVRManager.isLocalRecording(task)) {
					return $N.platform.btv.PVRManager.updateRemoteRecordingByTask(task, updateObject);
				}
				return this.updateRecording(task.taskId, updateObject);
			},

			/**
			 * @method updateBlockedState
			 * @param {String} taskId
			 * @param {Boolean} isBlocked
			 */
			updateBlockedState: function (taskId, isBlocked) {
				var currentState = getCurrentPlayedBlockedState(taskId),
					newState = null;
				switch (currentState) {
				case PLAYBACK_STATE.UNPLAYED_UNBLOCKED:
					newState = isBlocked ? PLAYBACK_STATE.UNPLAYED_BLOCKED : null;
					break;
				case PLAYBACK_STATE.PLAYED_UNBLOCKED:
					newState = isBlocked ? PLAYBACK_STATE.PLAYED_BLOCKED : null;
					break;
				case PLAYBACK_STATE.UNPLAYED_BLOCKED:
					newState = (!isBlocked) ? PLAYBACK_STATE.UNPLAYED_UNBLOCKED : null;
					break;
				case PLAYBACK_STATE.PLAYED_BLOCKED:
					newState = (!isBlocked) ? PLAYBACK_STATE.PLAYED_UNBLOCKED : null;
					break;
				}
				if (currentState !== null) {
					$N.app.PVRUtil.updateRecording(taskId, {PlayedBlocked: newState});
				}
			},

			/**
			 * @method isTaskPlayed
			 * @param {Object} the task
			 * @return {Boolean} isTaskPlayed
			 */
			isTaskPlayed: function (task) {
				return $N.platform.btv.PVRManager.isTaskPlayed(task);
			},

			/**
			 * @method isTaskBlocked
			 * @param {Object} the task
			 * @return {Boolean} isTaskBlocked
			 */
			isTaskBlocked: function (task) {
				return $N.platform.btv.PVRManager.isTaskBlocked(task);
			},


			/**
			 * @method isTaskBlockedTitle
			 * @param {Object} the task
			 * @return {Boolean} isTaskBlockedTitle
			 */
			isTaskBlockedTitle: function (task) {
				var serviceObj,
					userRatingValue = $N.platform.ca.ParentalControl.getUserRatingValue();
				if ($N.platform.ca.ParentalControl.isCurrentUserMaster()) {
					return false;
				}
				serviceObj = $N.app.epgUtil.getServiceById(task.serviceId);
				if (serviceObj && $N.app.genreUtil.isAdultChannel(serviceObj) && userRatingValue < 18) {
					return true;
				}
				return false;
			},
			/**
			 * @method isTaskBlockedSynopsis
			 * @param {Object} the task
			 * @return {Boolean} isTaskBlockedSynopsis
			 */
			isTaskBlockedSynopsis: function (task) {
				var serviceObj,
					userRatingValue = $N.platform.ca.ParentalControl.getUserRatingValue();
				if ($N.platform.ca.ParentalControl.isCurrentUserMaster()) {
					return false;
				}
				serviceObj = $N.app.epgUtil.getServiceById(task.serviceId);
				if (serviceObj && $N.app.genreUtil.isAdultChannel(serviceObj) && userRatingValue < 18) {
					return true;
				}
				if (task.netEventGenres && $N.app.epgUtil.isAdultGenre(task.netEventGenres) && userRatingValue < 18) {
					return true;
				}
				return false;
			},
			/**
			 * @method isTaskBlockedPlaying
			 * @param {Object} the task
			 * @return {Boolean} isTaskBlockedPlaying
			 */
			isTaskBlockedPlaying: function (task) {
				var serviceObj,
					userRatingValue = $N.platform.ca.ParentalControl.getUserRatingValue();
				//TODO: show some trace
				log("isTaskBlockedPlaying", "userRatingValue:" + userRatingValue + ",recRating:" + task.parentalRating);
				if ($N.platform.ca.ParentalControl.isCurrentUserMaster()) {
					return false;
				}
				serviceObj = $N.app.epgUtil.getServiceById(task.serviceId);
				if (serviceObj && $N.app.genreUtil.isAdultChannel(serviceObj) && userRatingValue < 18) {
					return true;
				}
				if (task.netEventGenres && $N.app.epgUtil.isAdultGenre(task.netEventGenres) && userRatingValue < 18) {
					return true;
				}
				if (serviceObj && !$N.platform.ca.ParentalControl.isServicePermitted(serviceObj)) {
					return true;
				}
				if (task.parentalRating && !$N.platform.ca.ParentalControl.isRatingPermitted(task.parentalRating)) {
					return true;
				}
				return false;
			},
			/**
			 * @method isTaskFailedByEventId
			 * @param {Number} eventId of the recording
			 * @return {Boolean} isTaskFailed
			 */
			isTaskFailedByEventId: function (eventId) {
				var task = $N.platform.btv.PVRManager.getTaskByEventId(eventId, false, "cumulativeStatus"),
					cumulativeStatus,
					bitwiseAnd = $N.app.GeneralUtil.bitwiseAnd;

				if (task && task._data && task._data.cumulativeStatus) {
					cumulativeStatus = task._data.cumulativeStatus;
					if (bitwiseAnd(cumulativeStatus, CUMULATIVE_STATE.CA_ERROR)) {
						return true;
					}
					if (bitwiseAnd(cumulativeStatus, CUMULATIVE_STATE.NO_RESOURCE)) {
						return true;
					}
					if (bitwiseAnd(cumulativeStatus, CUMULATIVE_STATE.POWER_LOSS)) {
						return true;
					}
					if (bitwiseAnd(cumulativeStatus, CUMULATIVE_STATE.SIGNAL_LOSS)) {
						return true;
					}
					if (bitwiseAnd(cumulativeStatus, CUMULATIVE_STATE.STARTED_LATE)) {
						return true;
					}
				}
				return false;
			},

			/**
			 * @method isTaskAuthorizedByEventId
			 * @param {Number} eventId of the recording
			 * @return {Boolean} isAuthorized
			 */
			isTaskAuthorizedByEventId: function (eventId) {
				var task = $N.platform.btv.PVRManager.getTaskByEventId(eventId, false, "isAuthorized", true);

				if (task && task.isAuthorized) {
					return true;
				}

				return false;
			},

			/**
			 * @method isTaskActiveOrScheduled
			 * @param {Object} task
			 * @return {Boolean}
			 */
			isTaskActiveOrScheduled: function (task) {
				var recordingStatus = $N.platform.btv.PVRManager.getTaskRecordingStatus(task),
					PVRUtil = $N.app.PVRUtil;
				switch (recordingStatus) {
				case PVRUtil.ACTIVE:
				case PVRUtil.SCHEDULED:
				case PVRUtil.ACTIVE_IN_SERIES:
				case PVRUtil.SCHEDULED_BY_SERIES:
					return true;
				}
				return false;
			},

			/**
			 * @method isTaskActive
			 * @param {Object} task
			 * @return {Boolean}
			 */
			isTaskActive: function (task) {
				return ($N.platform.btv.PVRManager.getTaskRecordingStatus(task) === $N.app.PVRUtil.ACTIVE);
			},

			/**
			 * Checks the available tuner resources and shows a conflict dialog if none available
			 * @method checkResources
			 * @param {Number} type of conflict possible
			 * @param {Function} successCallback
			 */
			checkResources: function (type, successCallback) {
				log("checkResources", "Enter");
				var recordings = $N.platform.btv.PVRManager.getActiveRecordings(),
					event = null,
					TUNERS = $N.app.Config.getConfigValue("stb.numberOfTuners");
				if (recordings.length >= TUNERS) {
					event = recordings && recordings[0] && recordings[0].eventId ? $N.platform.btv.EPG.getEventById(recordings[0].eventId) : null;
					$N.app.Conflicts.showConflictDialog(event, recordings, type, successCallback);
				} else {
					successCallback();
				}
				log("checkResources", "Exit");
			},

			SCHEDULED: $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_SCHEDULED,
			ACTIVE: $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_ACTIVE,
			UNSCHEDULED: $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_UNSCHEDULED,
			ACTIVE_IN_SERIES: $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_ACTIVE_IN_SERIES,
			SCHEDULED_BY_SERIES: $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_SCHEDULED_BY_SERIES,
			PARTIAL: $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_PARTIAL,
			COMPLETED: $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_COMPLETED,
			WATCH_CONFLICT: 1,
			RECORD_CONFLICT: 2,
			RECORD_CONFLICT_WITH_RE_TUNE: 3,
			VOD_PLAYBACK_CONFLICT: 4,
			RECORD_CONFLICT_WITH_VOD_RE_TUNE: 5,
			PLAYBACK_STATE: PLAYBACK_STATE,
			DATA_UPDATE_STATE: DATA_UPDATE_STATE,
			incrementTasksCallbacksFired: incrementTasksCallbacksFired,
			initialiseTasksCallbackCount: initialiseTasksCallbackCount,
			getDataUpdateState: getDataUpdateState,
			getCancelSeriesPopup: getCancelSeriesPopup,
			getRecordedSeasonEpisodeShort: getRecordedSeasonEpisodeShort,
			initialiseRemoteAccess: initialiseRemoteAccess,
			areRecordingsInProgress: areRecordingsInProgress
		};
	}());

}($N || {}));
