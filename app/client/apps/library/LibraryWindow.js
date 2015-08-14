/**
 * LibraryWindow is a sub-state of Library and reacts to events in
 * the menu by showing pvr recordings for the selected filter
 * @module Library
 * @class LibraryWindow
 * @requires $N.app.DateTimeUtil
 * @requires $N.platform.btv.PVRManager
 * @requires $N.app.PVRUtil
 * @constructor
 * @param {Object} controller
 * @param {Object} view
 */
var LibraryWindow = function (controller, view) {
	var $N = window.parent.$N,
		log = new $N.apps.core.Log("Library", "LibraryWindow"),
		DateTimeUtil = $N.app.DateTimeUtil,
		PVRManager = $N.platform.btv.PVRManager,
		constants = $N.app.constants,
		PVRUtil = $N.app.PVRUtil,
		DEFAULT_LIBRARY_ROW = 1,
		DEFAULT_SELECTED_INDEX = 1,
		libraryRowIndex = DEFAULT_LIBRARY_ROW,
		manualRecordingOptionHelper = $N.app.ManualRecordingOptionHelper,
		noRecordingsLabel,
		isOptionsMode = false,
		dataUpdateTimeoutId = null,
		getFolderIndexFromData = false,
		openFolderName = "",
		isSortByDate = true,
		isFirstTime = true,
		isRenamingFolder = false,
		isManualRecordingOptionsMode = false,
		manualRecordingTimeUpdateHandler = null,
		currentMenu,
		states = {
			recordingsMenu: view.recordingsList.recordingsMenu,
			scheduledMenu: view.recordingsList.scheduledMenu
		},
		selectedItemIndex = null,
		context = null,
		previewComplete = false,
		pinHelper = null,
		PVRSubscriptionIds = [],
		isActive = false,
		recordingDataMapper = {
			getIcon: function (data) {
				var isInFolder = $N.app.FolderUtil.isInFolder(data),
					isAuthorized = data && data.isAuthorized;
				if (isInFolder && !openFolderName) {
					return "../../../customise/resources/images/720p/icons/DVR_pasta_menor.png";
				}
				if (PVRUtil.isTaskBlocked(data)) {
					if (isAuthorized) {
						return "../../../customise/resources/images/720p/icons/DVR_cadeado_item_protegido.png";
					}
					return "../../../customise/resources/images/720p/icons/DVR_cadeado_item_protegido_grey.png";
				}
				return null;
			},
			getNovoIcon: function (data) {
				var language,
					isAuthorized = data && data.isAuthorized;
				if (!PVRUtil.isTaskPlayed(data)) {
					language = $N.platform.system.Preferences.get($N.app.constants.PREF_LANGUAGE);
					if (isAuthorized) {
						return "../../../customise/resources/images/net/DVR_label_new_" + language + ".png";
					}
					return "../../../customise/resources/images/net/DVR_label_new_" + language + "_grey.png";
				}
				return "";
			},
			getEventId: function (data) {
				return (data && data.eventId) ? data.eventId : null;
			},
			getUniqueEventId: function (data) {
				return (data) ? data.uniqueEventId || null : null;
			},
			getSeriesEpisodeTitle: function (data) {
				var eventName = data.title,
					episodeName = data.netEpisodeName || data.netEpisodeOriginalName || '';
				if (eventName && episodeName && eventName !== episodeName) {
					return eventName + ": " + episodeName;
				}
				return eventName || "";
			},
			getSeriesTitle: function (data) {
				return data ? data.title : "";
			},
			getRecordDate: function (data) {
				return $N.apps.util.Util.formatDate(new Date(data.startTime), "dd/mm");
			},
			getRecordTime: function (data) {
				return $N.apps.util.Util.formatTime(new Date(data.startTime), "HH:MM");
			},
			getSeasonEpisodeShort: function (data) {
				return $N.app.PVRUtil.getRecordedSeasonEpisodeShort(data);
			},
			getFolderName: function (data) {
				return data ? $N.app.FolderUtil.getFolderName(data) : "";
			},
			isFolderUserGenerated: function (data) {
				var folderName = $N.app.FolderUtil.getFolderName(data);
				return $N.app.FolderUtil.isFolderUserGenerated(folderName);
			},
			isFolder: function (data) {
				var folderName = $N.app.FolderUtil.getFolderName(data);
				return folderName && !openFolderName;
			},
			getEventTitle: function (data) {
				var folderName = $N.app.FolderUtil.getFolderName(data);
				if ((folderName && !openFolderName) && (currentMenu === states.recordingsMenu)) {
					return folderName;
				}
				if (data.netDisplaySeasonEpisode) {
					return this.getSeriesEpisodeTitle(data) + " " + this.getSeasonEpisodeShort(data);
				}
				return this.getSeriesEpisodeTitle(data);
			},
			getDisplaySeasonEpisode: function (data) {
				return data.netDisplaySeasonEpisode;
			},
			getTitle: function (data) {
				var folderName = $N.app.FolderUtil.getFolderName(data),
					title = "",
					isSeriesRecording = (data.recordingType === $N.data.Recording.RECORDING_TYPE.SERIES),
					episodeTitle = data.netEpisodeName || data.netEpisodeOriginalName || "",
					seasonEpisodeNumber = this.getSeasonEpisodeShort(data),
					displaySeasonEpisode = data.netDisplaySeasonEpisode;

				if (folderName && !openFolderName) {
					return folderName;
				}

				// see explanation of why/how this is being generated in the ticket: https://jira.opentv.com/browse/NETUI-4834
				if (isSeriesRecording) {
					if (displaySeasonEpisode) {
						title = seasonEpisodeNumber + " ";
					}
					if (episodeTitle) {
						title += episodeTitle;
					} else {
						title = this.getSeriesTitle(data);
						if (displaySeasonEpisode) {
							title += " " + seasonEpisodeNumber;
						}
					}
					return title;
				}
				if (displaySeasonEpisode) {
					return this.getSeriesTitle(data) + " " + seasonEpisodeNumber;
				}
				return this.getSeriesTitle(data);
			},
			getSortTitle: function (data) {
				var folderName = $N.app.FolderUtil.getFolderName(data),
					title = "",
					isSeriesRecording = (data.recordingType === $N.data.Recording.RECORDING_TYPE.SERIES),
					epName = data.netEpisodeName,
					epOrigName = data.netEpisodeOriginalName,
					seasonEpisodeNumber = this.getSeasonEpisodeShort(data),
					displaySeasonEpisode = data.netDisplaySeasonEpisode;

				if (folderName && !openFolderName) {
					return folderName;
				}

				// see explanation of why/how this is being generated in the ticket: https://jira.opentv.com/browse/NETUI-4834
				if (isSeriesRecording) {
					if (epName || epOrigName) {
						if (epOrigName && !epName) {
							title += epOrigName;
						} else {
							title += epName;
						}
					} else {
						title = this.getSeriesTitle(data);
						if (displaySeasonEpisode) {
							title += " " + seasonEpisodeNumber;
						}
					}
					return title;
				}
				return this.getSeriesTitle(data);
			},

			getNumberOfEpisodes: function (data) {
				var folderName = $N.app.FolderUtil.getFolderName(data);
				if (folderName && !openFolderName) {
					return "(" + $N.app.FolderUtil.getNumberOfEpisodes(folderName) + ")";
				}
			},
			getKeepState: function (data) {
				return $N.app.KeepUtil.getKeepState(data);
			},
			getAuthorizationStatus: function (data) {
				var isInFolder = $N.app.FolderUtil.isInFolder(data);
				if (isInFolder && !openFolderName) {
					return true;
				}
				if (data && data.isAuthorized) {
					log("getAuthorizationStatus", "true");
					return true;
				}
				return false;
			}
		};

	/**
	 * @method isCurrentMenuScheduledRecordings
	 * @return {Boolean}
	 */
	function isCurrentMenuScheduledRecordings() {
		return (currentMenu === states.scheduledMenu);
	}

	/**
	 * @method isCurrentMenuRecordings
	 * @return {Boolean}
	 */
	function isCurrentMenuRecordings() {
		return (currentMenu === states.recordingsMenu);
	}

	/**
	 * @method isCurrentMenuManualRecording
	 * @return {Boolean}
	 */
	function isCurrentMenuManualRecording() {
		return (context.name === "recordTimeBased");
	}

	/**
	 * @method uiRefreshCallback
	 * @private
	 */
	function uiRefreshCallback() {
		log("uiRefreshCallback", "Enter");
		currentMenu.displayData(true, true);
		currentMenu.show();
		currentMenu.focus();
		log("uiRefreshCallback", "Exit");
	}

	/**
	 * @method PVRStatusUpdateListener
	 * @status {Object} the status object for PVR
	 * @private
	 */
	function PVRStatusUpdateListener(status) {
		log("PVRStatusUpdateListener", "Enter");
		if (!$N.app.PVRCapability.isPVREnabled(true)) {
			controller.returnToMenu();
		}
		log("PVRStatusUpdateListener", "Exit");
	}

	/**
	 * @method resumeOrRestartDialog
	 * @private
	 * @param {Object} data
	 */
	function resumeOrRestartDialog(data) {
		log("resumeOrRestartDialog", "Enter");
		var title = recordingDataMapper.getSeriesTitle(data) + " " + recordingDataMapper.getSeasonEpisodeShort(data),
			message = controller.getString("resumeRecordingDialogueSubTitle"),
			RESUME_OPTION = 1,
			RESTART_OPTION = 2,
			buttonArray = [{
				name: controller.getString("resumeRecordingDialogueWatch"),
				action: RESUME_OPTION
			}, {
				name: controller.getString("resumeRecordingDialogueRestart"),
				action: RESTART_OPTION
			}],
			dialogCallback = function (popupResult) {
				if (popupResult && (popupResult.action === RESTART_OPTION || popupResult.action === RESUME_OPTION)) {
					if (popupResult.action === RESTART_OPTION) {
						// clear the bookmark and dont jump to position
						PVRManager.saveBookmark(data, 0, 0);
						data.clearBookmark = true;
					}
					context.action(data);
				}
			};
		$N.app.DialogueHelper.createAndShowDialogue(
			$N.app.constants.DLG_LIBRARY_RESUME_RECORDING,
			title,
			message,
			buttonArray,
			dialogCallback,
			null,
			"VERTICAL"
		);
		$N.app.DialogueHelper.updateDialogueTitleAndMessage($N.app.constants.DLG_LIBRARY_RESUME_RECORDING, title, message);
		log("resumeOrRestartDialog", "Exit");
	}

	/**
	 * @method pinKeyPressCallback
	 * @private
	 * @param {string} value
	 * @param {string} key
	 */
	function pinKeyPressCallback(value, key) {
		if (isNaN(parseInt(key, 10)) && key !== $N.apps.core.KeyInterceptor.getKeyMap().KEY_LEFT && key !== $N.apps.core.KeyInterceptor.getKeyMap().KEY_OK) {
			if (pinHelper) {
				pinHelper.hideDialog();
			}
		}
	}

	/**
	 * @method passivateManualRecordingOptionsMenu
	 * @private
	 */
	function passivateManualRecordingOptionsMenu() {
		view.manualRecordingOptionsList.ManualRecordingOptions.passivate();
		isManualRecordingOptionsMode = false;
	}

	/**
	 * @method getManualRecordingOptionsMenuItems
	 * @private
	 */
	function getManualRecordingOptionsMenuItems() {
		var	channelData = manualRecordingOptionHelper.manualRecordingChanneldata(),
			folderData = manualRecordingOptionHelper.getManualRecordingsFolderOptionData(),
			frequenciesData = manualRecordingOptionHelper.getManualRecordingsFrequencyOptionData(),
			resetValue = manualRecordingOptionHelper.resetManualRecordingproperties(),
			manualRecordingProperties = manualRecordingOptionHelper.getAllManualRecordingProperties(),
			menuItems = [
				{
					title: controller.getString("manualRecordingStartTime"),
					secondTitle: controller.getString("manualRecordingStopTime"),
					getStartTime: function () {
						var startTime = manualRecordingProperties.startTime;
						return startTime;
					},
					getStopTime: function () {
						var stopTime = manualRecordingProperties.stopTime;
						return stopTime;
					},
					menuType: "timeKeypad",
					menuData: {
						title: controller.getString("manualRecordingStartTime"),
						successCallback: function (data) {
							var item = view.manualRecordingOptionsList.ManualRecordingOptions.getActualSelectedItem();
							if (data.startTime !== null) {
								item.setFirstSubTitle(data.startTime);
								manualRecordingOptionHelper.setManualRecordingProperty("startTime", data.startTime);
							}
							if (data.stopTime !== null) {
								item.setSecondSubTitle(data.stopTime);
								manualRecordingOptionHelper.setManualRecordingProperty("stopTime", data.stopTime);
							}
							manualRecordingOptionHelper.setManualRecordingProperty("isTimeOrDateModified", true);
						},
						exitCallback: passivateManualRecordingOptionsMenu
					}
				},
				{
					title: controller.getString("manualRecordingDate"),
					getStartDate: function () {
						var startDate = manualRecordingProperties.date;
						return startDate;
					},
					menuType: "dateKeyPad",
					menuData: {
						title: controller.getString("manualRecordingDate"),
						successCallback: function (data) {
							var item = view.manualRecordingOptionsList.ManualRecordingOptions.getActualSelectedItem();
							if (data.startRecordingDate !== null) {
								item.setFirstSubTitle(data.startRecordingDate);
								manualRecordingOptionHelper.setManualRecordingProperty("date", data.startRecordingDate);
							}
							manualRecordingOptionHelper.setManualRecordingProperty("isTimeOrDateModified", true);
						}

					}
				},
				{
					title: controller.getString("manualRecordingFrequency"),
					subtitle:  controller.getString("manualRecordingFrequencyOnce"),
					menuType: "confirmation",
					menuData: {
						title: controller.getString("manualRecordingFrequency"),
						options: frequenciesData,
						successCallback: function (data) {
							if (data.value !== null) {
								manualRecordingOptionHelper.setManualRecordingProperty("frequency", data.value);
							}
						}
					}

				},
				{
					title: controller.getString("manualRecordingChannel"),
					subtitle: manualRecordingProperties.channel,
					menuType: "confirmation",
					isUpDownPageable: true,
					menuData: {
						title: controller.getString("manualRecordingChannelListTitle"),
						options: channelData,
						successCallback: function (data) {
							if (data.channelNumber !== null) {
								manualRecordingOptionHelper.setManualRecordingProperty("channel", data.channelNumber + " " + data.title);
								manualRecordingOptionHelper.setManualRecordingProperty("channelInfo", data);
							}
						}
					}
				},
				{
					title: controller.getString("optionsFolderTitle"),
					subtitle: $N.app.FolderUtil.getString('pvrSettingsRecordingHighlights'),
					menuType: "folder",
					menuData: {
						title: controller.getString("optionsMoveToFolder"),
						options: folderData,
						successCallback: function (data) {
							if (data.value !== null) {
								if (data.value === "" || data.title === controller.getString('pvrSettingsRecordingHighlights') || data.value === $N.app.constants.LEGACY_DEFAULT_NON_EPISODIC_FOLDER_NAME) {
									data.value = $N.app.FolderUtil.getNonEpisodicDefaultFolder();
								}
								manualRecordingOptionHelper.setManualRecordingProperty("folder", data.value);
							}
						}
					}
				},
				{
					title: controller.getString("optionsKeepTitle"),
					subtitle: PVRUtil.getString("pvrSpaceNeeded"),
					menuType: "confirmation",
					menuData: {
						title: controller.getString("optionsKeepTitle"),
						options: [
							{
								title: PVRUtil.getString("pvrManualDelete"),
								value: constants.KEEP_UNTIL_OPTION_MANUAL_DELETE,
								selected: false
							},
							{
								title: PVRUtil.getString("pvrSpaceNeeded"),
								value: constants.KEEP_UNTIL_OPTION_SPACE_NEEDED,
								selected: true
							}
						],
						successCallback: function (data) {
							if (data.value !== null) {
								manualRecordingOptionHelper.setManualRecordingProperty("keepUntill", data.value);
							}
						}
					}
				}
			];
		return menuItems;
	}

	/**
	 * @method activateManualRecordingOptionsMenu
	 * @private
	 */
	function activateManualRecordingOptionsMenu() {
		view.manualRecordingOptionsList.ManualRecordingOptions.activate(getManualRecordingOptionsMenuItems());
		isManualRecordingOptionsMode = true;
		view.show();
	}

	/**
	 * @method manualRecordingTimeUpdateHandler
	 * used as call-back, registered inside minuteTimer.
	 * updates the manual recording options data every minute.
	 */

	manualRecordingTimeUpdateHandler = function () {
		var isTimeOrDateModified = manualRecordingOptionHelper.getManualRecordingProperty("isTimeOrDateModified"),
			isSecondSubmenuActive = view.manualRecordingOptionsList.ManualRecordingOptions.isSubmenuActive();
		if (!isTimeOrDateModified && !isSecondSubmenuActive) {
			manualRecordingOptionHelper.setManualRecordingProperty("startTime", manualRecordingOptionHelper.manualRecordingStartTime());
			manualRecordingOptionHelper.setManualRecordingProperty("StopTime", manualRecordingOptionHelper.manualRecordingStopTime());
			manualRecordingOptionHelper.setManualRecordingProperty("date", manualRecordingOptionHelper.getValidDate());
			view.manualRecordingOptionsList.ManualRecordingOptions.refreshMenuData(getManualRecordingOptionsMenuItems());
		}
	};

	/**
	 * @method applySort
	 * @private
	 * @param {Array} data
	 */
	function applySort(data) {
		if (isSortByDate) {
			if (context.name === "scheduledRecordings" || openFolderName) {
				data.sort($N.app.SortUtil.sortByDateAsc);
			} else {
				data.sort($N.app.SortUtil.sortByIsFolderThenDate);
			}
		} else {
			if (context.name === "scheduledRecordings" || openFolderName) {
				data.sort($N.app.SortUtil.sortBySortTitleThenEpisodeId);
			} else {
				data.sort($N.app.SortUtil.sortByFolderThenTitle);
			}
		}
	}


	/**
	 * This method displays the correct row when returning from a folder
	 * @method setCurrentMenuIndex
	 */
	function setCurrentMenuIndex() {
		log("setCurrentMenuIndex", "Enter");
		var redrawMenu = true,
			menuIndex = DEFAULT_LIBRARY_ROW,
			menuSize = currentMenu.getSize();
		if (!openFolderName) {
			if (libraryRowIndex > menuSize) {
				menuIndex = menuSize;
			} else {
				menuIndex = libraryRowIndex;
			}
			currentMenu.selectItemAtIndex(menuIndex, redrawMenu);
		}
		log("setCurrentMenuIndex", "Exit");
	}

	/**
	 * @method addSortTitleToData
	 * @param {Array} data
	 */
	function addSortTitleToData(data) {
		if (data.length && !data[0].sortTitle) {
			data.forEach(function (item) {
				item.sortTitle = recordingDataMapper.getSortTitle(item);
			});
		}
	}

	/**
	 * @method renderList
	 * @param {Array} data
	 */
	function renderList(data) {
		log("renderList", "Enter");
		var currentState = context.name;
		if (currentState === "recordTimeBased") {
			//if current state is recordTimeBased then set the menu title as record timeBased and show the preview of ManualRecordingOptions.
			controller.setLibraryTitle(controller.getString("recordTimeBasedMenuTitle"));
			view.manualRecordingOptionsList.ManualRecordingOptions.preview(getManualRecordingOptionsMenuItems());
		} else {
			addSortTitleToData(data);
			applySort(data);
			currentMenu.setData(data);
			view.recordingsList.upArrow.hide();
			view.recordingsList.downArrow.setVisible(data.length > currentMenu.getVisibleItemCount());
			if (data.length > 0) {
				currentMenu.displayData(true);
				setCurrentMenuIndex();
				noRecordingsLabel.hide();
				currentMenu.show();
			} else {
				currentMenu.hide();
				noRecordingsLabel.setText(context.noRecordsLabel);
				noRecordingsLabel.show();
				controller.returnToMenu();
			}
			if (openFolderName) {
				controller.setLibraryTitle(recordingDataMapper.getFolderName(data[0]));
			} else {
				controller.setLibraryTitle(controller.getString(currentState + "Title"));
			}
		}
		log("renderList", "Exit");
	}

	/**
	 * @method closeFolder
	 * @private
	 */
	function closeFolder() {
		log("closeFolder", "Enter");
		if (openFolderName) {
			context.data = $N.app.FolderUtil.getDataForFolders();
			openFolderName = "";
			renderList(context.data);
			currentMenu.focus();
			libraryRowIndex = DEFAULT_LIBRARY_ROW;
		}
		log("closeFolder", "Exit");
	}

	/**
	 * @method updateLibraryData
	 * @private
	 */
	function updateLibraryData() {
		log("updateLibraryData", "Enter");
		var actualSelectedIndex = currentMenu.getActualSelectedRowIndex(),
			numberOfVisibleRows = currentMenu.getVisibleItemCount();
		switch (context.name) {
		case "recordedRecordings":
			if (openFolderName) {
				context.data = $N.app.FolderUtil.getPlayableRecordingsByFolderName(openFolderName);
			} else {
				context.data = $N.app.FolderUtil.getDataForFolders();
			}
			break;
		case "scheduledRecordings":
			context.data = PVRUtil.getScheduledRecordings();
			break;
		case "recordTimeBased":
			controller.updateRecordingsData(); //When Time based recordings is current context, we should update the Scheduled data.
			break;
		}
		if (openFolderName && context.data && context.data.length === 0) {
			closeFolder();
		} else {
			renderList(context.data);
			if (context.name !== "recordTimeBased" && isActive === true) { // if context is recordTimeBased no need of data update.
				currentMenu.focus();
				if (actualSelectedIndex > numberOfVisibleRows) {
					view.recordingsList.upArrow.show();
				}
				if (actualSelectedIndex && actualSelectedIndex <= context.data.length) {
					currentMenu.selectActualItemAtIndex(actualSelectedIndex);
				}
			}
		}
		log("updateLibraryData", "Exit");
	}

	/**
	 * @method dataUpdateCallback
	 * @private
	 */
	function dataUpdateCallback() {
		log("dataUpdateCallback", "Enter");
		var UPDATE_LIBRARY_TIMEOUT = 250,
			dataUpdateState = null;

		updateLibraryData();
		dataUpdateState = PVRUtil.getDataUpdateState();

		switch (dataUpdateState) {
		case PVRUtil.DATA_UPDATE_STATE.NOT_ALLOWED:
			log("dataUpdateCallback", "NOT ALLOWED");
			controller.restartWarningMessageTimeout();
			break;
		case PVRUtil.DATA_UPDATE_STATE.ALLOWED:
			log("dataUpdateCallback", "UPDATE STATE");
			// get the latest version of the library list but wait for it to be updated.
			window.setTimeout(
				function () {
					updateLibraryData();
					controller.hideWarning();
					controller.startUpdateHardDiskPercentageInterval();
				},
				UPDATE_LIBRARY_TIMEOUT
			);
			break;
		default:
			log("dataUpdateCallback", "HIDE WARNING");
			controller.hideWarning();
			controller.startUpdateHardDiskPercentageInterval();
			break;
		}
		log("dataUpdateCallback", "Exit");
	}

	/**
	 * @method stopDataUpdateTimer
	 * @private
	 */
	function stopDataUpdateTimer() {
		log("stopDataUpdateTimer", "Enter");
		if (dataUpdateTimeoutId) {
			clearTimeout(dataUpdateTimeoutId);
			dataUpdateTimeoutId = null;
		}
		log("stopDataUpdateTimer", "Exit");
	}

	/**
	 * @method stopAndStartDataUpdateTimer
	 * @private
	 */
	function stopAndStartDataUpdateTimer() {
		log("stopAndStartDataUpdateTimer", "Enter");
		var UPDATE_RECORDINGS_TIMEOUT = 1000;
		stopDataUpdateTimer();
		dataUpdateTimeoutId = window.setTimeout(dataUpdateCallback, UPDATE_RECORDINGS_TIMEOUT);
		log("stopAndStartDataUpdateTimer", "Exit");
	}

	/**
	 * @method pinCancelledCallback
	 * @private
	 */
	function pinCancelledCallback() {
		if (pinHelper) {
			pinHelper.hideDialog();
		}
	}

	/**
	 * @method checkBookmarkAndFireAction
	 * @private
	 * @param {Object} data
	 */
	function checkBookmarkAndFireAction(data) {
		log("checkBookmarkAndFireAction", "Enter");
		var task,
			includeActiveRecordingsOnly = false;
		if ($N.platform.btv.PVRManager.isLocalRecording(data)) {
			task = $N.platform.btv.PVRManager.getTask(
				data.taskId,
				$N.platform.btv.PVRManager.WIDE_TASK_FIELD_FILTER,
				includeActiveRecordingsOnly
			);
		} else {
			task = data;
		}
		if (task && task.bookmark) {
			resumeOrRestartDialog(task);
		} else {
			context.action(task);
		}
		log("checkBookmarkAndFireAction", "Exit");
	}

	/**
	 * @method dataUpdate
	 */
	function dataUpdate() {
		if (!isCurrentMenuManualRecording()) { //If current menu is manual recording, we don't have to stop and Start the data update
			stopAndStartDataUpdateTimer();
		}
	}

	/**
	 * @method pagedCallback
	 * @private
	 * @param {Boolean} atTopOfList
	 * @param {Boolean} atBottomOfList
	 */
	function pagedCallback(atTopOfList, atBottomOfList) {
		log("pagedCallback", "Enter");
		if (atTopOfList) {
			view.recordingsList.upArrow.hide();
		} else {
			view.recordingsList.upArrow.show();
		}
		if (atBottomOfList) {
			view.recordingsList.downArrow.hide();
		} else {
			view.recordingsList.downArrow.show();
		}
		log("pagedCallback", "Exit");
	}

	/**
	 * @method displayFolder
	 * @private
	 * @param {String} folderName
	 */
	function displayFolder(folderName) {
		log("displayFolder", "Enter");
		context.data = $N.app.FolderUtil.getPlayableRecordingsByFolderName(folderName);
		openFolderName = folderName;
		renderList(context.data);
		currentMenu.focus();
		log("displayFolder", "Exit");
	}

	/**
	 * @method cancelOrDeleteRecordingCallback
	 * @param {Object} data
	 * @param {String} warningMessage
	 */
	function cancelOrDeleteRecordingCallback(data, warningMessage) {
		log("cancelOrDeleteRecordingCallback", "Enter");
		var actions = $N.app.constants.DLG_ACTIONS,
			action = (data && data.key && data.key.action) ? data.key.action : actions.EXIT_OPTION;

		if (action !== actions.EXIT_OPTION) {
			controller.stopIntervalService();
			controller.showWarning(warningMessage);
		}
		log("cancelOrDeleteRecordingCallback", "Exit");
	}

	/**
	 * @method cancelRecording
	 * @param {Object} task
	 * @param {Return} success
	 */
	function cancelRecording(task) {
		log("cancelRecording", "Enter");
		var cancelRecordingCallback = function (data) {
			cancelOrDeleteRecordingCallback(data, "cancellingSchedule");
		};
		if (PVRUtil.isTaskActiveOrScheduled(task)) {
			PVRUtil.cancelTask(task, cancelRecordingCallback);
		}
		log("cancelRecording", "Exit");
	}

	/**
	 * @method deleteRecording
	 * @param {Object} task - selected task item
	 */
	function deleteRecording(task) {
		log("deleteRecording", "Enter");
		var isFolderRootFolder = $N.app.FolderUtil.isFolderRootFolder(task.uiFolder),
			isFolder = (recordingDataMapper.isFolder(task) && !openFolderName && !isFolderRootFolder),
			tasks = (isFolder) ? $N.app.FolderUtil.getPlayableRecordingsByFolderName(task.uiFolder) : [task],
			dialogTitle = (isFolder) ? "deleteFolder" : "deleteRecording",
			selectedItemName =  (isFolder) ? recordingDataMapper.getFolderName(task) : task.title,
			options = {
				dialogObjectConfigParam: {
					title: controller.getString(dialogTitle),
					message: controller.getString("messageDelete") + ' "' + selectedItemName + '".'
				}
			},
			deleteRecordingCallback = function (data) {
				cancelOrDeleteRecordingCallback(data, "deleting");
			};

		PVRUtil.showDialogueAndDeleteTasks(tasks, deleteRecordingCallback, options);
		log("deleteRecording", "Exit");
	}

	/**
	 * @method navigateToSynopsis
	 * @private
	 * @param {Object} selectedItem
	 */
	function navigateToSynopsis(selectedItem) {
		log("navigateToSynopsis", "Enter");
		var event = $N.app.epgUtil.getMappedEventById(selectedItem.eventId);
		selectedItem.promoImage = (event) ? event.promoImage : "";
		if (PVRUtil.isTaskBlockedSynopsis(selectedItem)) {
			$N.app.ParentalControlUtil.parentalDialog(selectedItem, function () {
				PVRUtil.navigateToSynopsis(selectedItem, dataUpdateCallback);
			}, pinCancelledCallback, pinKeyPressCallback);
		} else {
			PVRUtil.navigateToSynopsis(selectedItem, dataUpdateCallback);
		}
		log("navigateToSynopsis", "Exit");
	}

	/**
	 * @method itemSelected
	 * @private
	 * @param {Object} data
	 */
	function itemSelected(data) {
		log("itemSelected", "Enter");
		var folderName = $N.app.FolderUtil.getFolderName(data),
			dialogButtons = [{name: controller.getString("ok"), action: 1}],
			isParentallyLocked = null;
		if (!openFolderName && folderName && isCurrentMenuRecordings()) {
			libraryRowIndex = currentMenu.getSelectedItemIndex();
			displayFolder(folderName);
		} else if (isCurrentMenuScheduledRecordings()) {
			libraryRowIndex = currentMenu.getSelectedItemIndex();
			if (currentMenu && currentMenu.getSelectedItem()) {
				navigateToSynopsis(currentMenu.getSelectedItem());
			}
		} else if (isCurrentMenuManualRecording()) {
			isManualRecordingOptionsMode = true;
		} else {
			if (PVRManager.getTaskAuthorizationStatus(data)) {
				if (!$N.app.ManualRecordingHelper.isManualRecordingTask(data) && (PVRUtil.isTaskBlockedPlaying(data) || PVRUtil.isTaskBlocked(data))) {
					$N.app.ParentalControlUtil.parentalDialog(data, checkBookmarkAndFireAction, pinCancelledCallback, pinKeyPressCallback);
				} else {
					checkBookmarkAndFireAction(data);
				}
			} else {
				$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_UNAUTHORISED_RECORDING,
					controller.getString("unauthorizedRecordingTitle"),
					controller.getString("unauthorizedRecordingText"),
					dialogButtons);
			}
		}
		log("itemSelected", "Exit");
	}

	/**
	 * @method switchWindow
	 * @private
	 * @param {Object} activationContext
	 */
	function switchWindow(activationContext) {
		log("switchWindow", "Enter");
		context = activationContext;
		$N.app.TimerUtil.stopTimer("recordIcon");
		if (context.name === "recordedRecordings") {
			passivateManualRecordingOptionsMenu();
			view.manualRecordingOptionsList.hide();
			view.recordingsList.show();
			$N.app.StandardTimers.minuteTimer.disable("ManualRecordingMenuHelperClock");
			currentMenu.hide();
			currentMenu = states.recordingsMenu;
			currentMenu.show();
		} else if (context.name === "scheduledRecordings") {
			passivateManualRecordingOptionsMenu();
			view.manualRecordingOptionsList.hide();
			view.recordingsList.show();
			$N.app.StandardTimers.minuteTimer.disable("ManualRecordingMenuHelperClock");
			currentMenu.hide();
			currentMenu = states.scheduledMenu;
			currentMenu.show();
			$N.app.TimerUtil.startTimer("recordIcon");
		} else if (context.name === "recordTimeBased") {
			//if activationContext is recordTimeBased then hide the current menu and the recording list. show the manual recording list.
			view.manualRecordingOptionsList.show();
			view.recordingsList.hide();
			$N.app.StandardTimers.minuteTimer.enable("ManualRecordingMenuHelperClock");
			currentMenu.hide();
		}
		log("switchWindow", "Exit");
	}

	/**
	 * @method initialiseList
	 * @private
	 * @param {Object} list
	 */
	function initialiseList(list) {
		$N.app.GeneralUtil.mixin(recordingDataMapper, $N.app.DataMappers.getServiceDataMapper());
		list.setDataMapper(recordingDataMapper);
		list.setItemSelectedCallback(itemSelected);
		list.setListPagedCallback(pagedCallback);
		list.setUpDownPageable(true);
		list.initialise();
	}

	/**
	 * method getSortCaption
	 * @private
	 * @return {String} Label text for green option button
	 */
	function getSortCaption() {
		return isSortByDate ? controller.getString("titleSort") : controller.getString("dateSort");
	}

	/**
	 * method getRemoveCaption
	 * @private
	 * @return {String} Label text for yellow remove button
	 */
	function getRemoveCaption() {
		return context.name === "scheduledRecordings" ? controller.getString("cancel") : controller.getString("remove");
	}

	/**
	 * method getOptionsRemoveTitle
	 * @private
	 * @param {Boolean} isFolder
	 * @return {String} Title text for remove option
	 */
	function getOptionsRemoveTitle(isFolder) {
		if (context.name === "scheduledRecordings") {
			return controller.getString("optionsCancelTitle");
		}
		if (isFolder) {
			return controller.getString("optionsDeleteFolderTitle");
		}
		return controller.getString("optionsDeleteTitle");
	}

	/**
	 * method getOptionsRemoveSubMenuTitle
	 * @private
	 * @param {Boolean} isFolder
	 * @return {String} SubMenu title text for remove option
	 */
	function getOptionsRemoveSubMenuTitle(isFolder) {
		if (context.name === "scheduledRecordings") {
			return controller.getString("optionsCancelSubMenuTitle");
		}
		if (isFolder) {
			return controller.getString("optionsDeleteSubMenuFolderTitle");
		}
		return controller.getString("optionsDeleteSubMenuTitle");
	}

	/**
	 * @method initialiseOptionsFooter
	 * @private
	 */
	function initialiseOptionsFooter() {
		var footer = view.recordingsOptionsFooter;
		footer.redSelectLabel.setText(controller.getString("info"));
		footer.greenSelectLabel.setText(getSortCaption());
		footer.yellowSelectLabel.setText(getRemoveCaption());
		footer.blueSelectLabel.setText(controller.getString("options"));
	}


	/**
	 * @method openOptionsFooter
	 * @private
	 */
	function openOptionsFooter() {
		var footer = view.recordingsOptionsFooter;
		footer.hide();
		if (isCurrentMenuScheduledRecordings() || isCurrentMenuRecordings()) {
			footer.redKey.setX(22.5);
			footer.redSelectLabel.setX(76.5);
			footer.yellowKey.setX(763.5);
			footer.yellowSelectLabel.setX(817.5);
			footer.blueKey.setX(1168.5);
			footer.blueSelectLabel.setX(1222.5);
			footer.greenKey.show();
			footer.greenSelectLabel.show();
		}
		footer.show();
	}

	/**
	 * @method closeOptionsFooter
	 * @private
	 */
	function closeOptionsFooter() {
		view.recordingsOptionsFooter.hide();
	}

	/**
	 * @method closeOptionsMenu
	 * @param {String} [folderName]
	 * @private
	 */
	function closeOptionsMenu(folderName) {
		log("closeOptionsMenu", "Enter FolderName:" + folderName);
		if (folderName) {
			displayFolder(folderName);
		}
		view.libraryOptions.passivate();
		controller.showLibraryTitle();
		view.recordingsList.show();
		openOptionsFooter();
		isOptionsMode = false;
		log("closeOptionsMenu", "Exit");
	}

	/**
	 * @method updateTaskAfterRenaming
	 * @private
	 */
	function updateTaskAfterRenaming() {
		log("updateTaskAfterRenaming", "Enter");
		uiRefreshCallback();
		closeOptionsMenu();
		dataUpdateCallback();
		isRenamingFolder = false;
		if ($N.app.PVRUtil.getDataUpdateState() === $N.app.PVRUtil.DATA_UPDATE_STATE.ALLOWED) {
			controller.hideWarning();
		}
		log("updateTaskAfterRenaming", "Enter");
	}

	/**
	 * @method updateTaskListener
	 * @private
	 * @param {String} eventName
	 */
	function updateTaskListener(eventName) {
		log("updateTaskListener", "Enter");
		if (eventName === "stopTaskFailed" || eventName === "deleteJobFailed") {
			controller.setHideWarningTimeoutRequired(true);
		}
		if (isRenamingFolder) {
			updateTaskAfterRenaming();
		} else {
			stopAndStartDataUpdateTimer();
		}
		log("updateTaskListener", "Exit");
	}

	/**
	 * @method toggleFooterRedKey
	 * @private
	 * @param isRedKeyActive
	 */
	function toggleFooterRedKey(isRedKeyActive) {
		var ACTIVE_RED_KEY = $N.app.constants.ACTIVE_INFO_BUTTON_PATH,
			INACTIVE_RED_KEY = $N.app.constants.INACTIVE_INFO_BUTTON_PATH,
			footer = view.recordingsOptionsFooter,
			key = isRedKeyActive ? ACTIVE_RED_KEY : INACTIVE_RED_KEY;
		footer.redKey.setHref(key);
	}

	/**
	 * @method getBlockRecordingOption
	 * @private
	 * @param {Object} selectedItem
	 * @return {Object}
	 */
	function getBlockRecordingOption(selectedItem) {
		var noBlockText = controller.getString("none"),
			blockedText = controller.getString("pinLock"),
			isTaskBlocked = PVRUtil.isTaskBlocked(selectedItem),
			blockOptionTitle = isTaskBlocked ? blockedText : noBlockText,
			NO_BLOCK_OPTION = 1,
			BLOCK_OPTION = 2,
			selectedLibraryItem = view.libraryOptions.getActualSelectedItem();
		return {
			title: controller.getString("optionsBlockTitle"),
			subtitle: blockOptionTitle,
			menuType: "confirmation",
			menuData: {
				title: controller.getString("optionsBlockSubMenuTitle"),
				options: [
					{
						title: noBlockText,
						value: NO_BLOCK_OPTION,
						selected: !isTaskBlocked
					},
					{
						title: blockedText,
						value: BLOCK_OPTION,
						selected: isTaskBlocked
					}
				],
				successCallback: function (value) {
					isTaskBlocked = PVRUtil.isTaskBlocked(selectedItem);
					var isBlock = (value === BLOCK_OPTION && !isTaskBlocked),
						isUnBlock = (value === NO_BLOCK_OPTION && isTaskBlocked),
						pinSuccessCallback = function () {
							if (!openFolderName && !$N.app.FolderUtil.isFolderRootFolder(selectedItem.uiFolder)) {
								$N.app.FolderUtil.updateBlockedStateForFolder(selectedItem.uiFolder, !isTaskBlocked);
							} else {
								PVRUtil.updateBlockedState(selectedItem.taskId, !isTaskBlocked);
							}
							// We need to update the subtitle due to PIN success...
							selectedLibraryItem.setFirstSubTitle(isBlock ? blockedText : noBlockText);
							view.libraryOptions.subMenuExit();
							uiRefreshCallback();
						};
					if (isBlock || isUnBlock) {
						// We need to put the subtitle back pending PIN success...
						selectedLibraryItem.setFirstSubTitle(blockOptionTitle);
						$N.app.ParentalControlUtil.parentalDialog(selectedItem, pinSuccessCallback, pinCancelledCallback, pinKeyPressCallback, isBlock);
					} else {
						view.libraryOptions.subMenuExit();
						uiRefreshCallback();
					}
				}
			}
		};
	}

	/**
	 * @method getKeepOption
	 * @private
	 * @param {Object} selectedItem
	 * @return {Object}
	 */
	function getKeepOption(selectedItem) {
		var isFolder = !openFolderName && !$N.app.FolderUtil.isFolderRootFolder(selectedItem.uiFolder),
			keepState = recordingDataMapper.getKeepState(selectedItem),
			isManualDelete = $N.app.KeepUtil.KEEP_UNTIL_MANUAL_DELETE === keepState;
		return {
			title: controller.getString("optionsKeepTitle"),
			subtitle: isManualDelete ? PVRUtil.getString("pvrManualDelete") : PVRUtil.getString("pvrSpaceNeeded"),
			menuType: "confirmation",
			menuData: {
				title: controller.getString("optionsKeepTitle"),
				options: [
					{
						title: PVRUtil.getString("pvrManualDelete"),
						value: 'KEEP_UNTIL',
						selected: isManualDelete
					},
					{
						title: PVRUtil.getString("pvrSpaceNeeded"),
						value: 'SPACE_NEEDED',
						selected: !isManualDelete
					}
				],
				successCallback: function (value) {
					var keepValue = value === 'KEEP_UNTIL' ? $N.app.KeepUtil.KEEP_UNTIL_MANUAL_DELETE : $N.app.KeepUtil.KEEP_UNTIL_SPACE_NEEDED;
					if (isFolder) {
						$N.app.FolderUtil.updateKeepForFolder(selectedItem.uiFolder, keepValue);
					} else {
						PVRUtil.updateRecordingByTask(selectedItem, {
							keep: keepValue
						});
					}
					view.libraryOptions.subMenuExit();
					uiRefreshCallback();
				}
			}
		};
	}

	/**
	 * @method getRenameFolderMenuItem
	 * @private
	 * @param {Object} selectedItem
	 * @return {Object} renameFolderMenuItem
	 */
	function getRenameFolderMenuItem(selectedItem) {
		var menuTitleString = isCurrentMenuScheduledRecordings() ? "optionsFolderTitle" : "optionsRenameFolderTitle",
			folderName = recordingDataMapper.getFolderName(selectedItem);
		return {
			title: controller.getString(menuTitleString),
			subtitle: folderName,
			menuType: "keyboard",
			menuData: {
				title: controller.getString("optionsRenameFolderSubTitle"),
				labelText: folderName.toUpperCase(),
				greenIconText: controller.getString("optionsRenameFolderTitle"),
				successCallback: function (data) {
					if ($N.app.FolderUtil.isFolderUserGenerated(data)) {
						$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_DVR_DUPLICATE_FOLDER_ERROR,
							controller.getString("warningDialogueTypeLabel"),
							controller.getString("warningDuplicateFolderName"));
					} else {
						isRenamingFolder = true;
						$N.app.FolderUtil.renameFolder(folderName, data);
						controller.showWarning("renameFolder");
					}
				},
				exitCallback: closeOptionsMenu
			}
		};
	}

	/**
	 * @method getFolderIndexFromData
	 * @private
	 * @param {Object} data
	 * @param {String} folderName
	 * @return {Integer} folderIndex
	 */
	getFolderIndexFromData = function (data, folderName) {
		folderName = folderName || "";
		var i,
			folderIndex,
			folderValuesToFind = [
				$N.app.constants.LEGACY_DEFAULT_NON_EPISODIC_FOLDER_NAME,
				""];
		if (folderName.length && !$N.app.FolderUtil.isFolderRootFolder(folderName)) {
			for (i = 0; i < data.length; i++) {
				data[i] = $N.app.StringUtil.addLeadingForwardSlash(data[i]);
			}
			folderIndex = data.indexOf($N.app.StringUtil.addLeadingForwardSlash(folderName));
		} else {
			for (i = 0; i < folderValuesToFind.length; i++) {
				folderIndex = data.indexOf(folderValuesToFind[i]);
				if (folderIndex > -1) {
					break;
				}
			}
		}
		return folderIndex;
	};

	/**
	 * @method getFolderOption
	 * @private
	 * @param {Object} selectedItem
	 * @return {Object} folderMenuItem
	 */
	function getFolderOption(selectedItem) {
		var folderName = recordingDataMapper.getFolderName(selectedItem),
			isFolder =  recordingDataMapper.isFolder(selectedItem),
			folderIndex,
			data = [],
			dataLength = 0,
			i;
		data = $N.platform.system.Preferences.get($N.app.constants.PVR_NON_EPISODIC_FOLDER_LIST);
		folderIndex = getFolderIndexFromData(data, folderName);
		data = $N.app.FormatUtils.formatRecordingsFolderListData(data, folderName);

		// this code ensures that we put the tick in the right place for the box after we force the Recording folder at the begining of the list
		if ($N.app.FolderUtil.isFolderRootFolder(folderName)) {
			data[0].selected = true;
		} else {
			if (folderIndex > -1) {
				data[folderIndex].selected = true;
			}
			dataLength = data.length;
			for (i = 1; (i < dataLength); i++) {
				if (folderName === data[i].title && !data[i].selected) {
					data[i].selected = true;
					data[i - 1].selected = false;
					break;
				}
			}
		}

		data = $N.app.FolderUtil.sortFolderList(data);//sort the array of folders based on title.
		return {
			title: controller.getString("optionsFolderTitle"),
			subtitle: folderName || $N.app.FolderUtil.getString('pvrSettingsRecordingHighlights'),
			menuType: "folder",
			menuData: {
				title: controller.getString("optionsMoveToFolder"),
				options: data,
				successCallback: function (newFolder) {
					PVRUtil.updateRecordingByTask(selectedItem, {
						uiFolder: $N.app.StringUtil.addLeadingForwardSlash(newFolder)
					});
					view.libraryOptions.subMenuExit();
					uiRefreshCallback();
					context.data = $N.app.FolderUtil.getPlayableRecordingsByFolderName(newFolder);
					if (isCurrentMenuScheduledRecordings()) {
						openFolderName = "";
					} else {
						openFolderName = newFolder;
						renderList(context.data);
					}
				}
			}
		};
	}

	/**
	 * @method getCancelRecordingOption
	 * @param isFolder
	 * @private
	 */
	function getCancelRecordingOption(isFolder) {
		log("getCancelRecordingOption", "Enter");
		var	task = currentMenu.getSelectedItem(),
			tasks = (isFolder) ? $N.app.FolderUtil.getPlayableRecordingsByFolderName(task.uiFolder) : [task];
		return {
			title: getOptionsRemoveTitle(isFolder),
			subtitle: PVRUtil.isTaskBlockedTitle(task) ? PVRUtil.getString("adultContent") : recordingDataMapper.getEventTitle(task),
			menuType: "confirmation",
			menuData: {
				title: getOptionsRemoveSubMenuTitle(isFolder),
				options: [
					{
						title: controller.getString("yes"),
						value: true
					},
					{
						title: controller.getString("no"),
						value: false
					}
				],
				successCallback: function () {
					if (isCurrentMenuScheduledRecordings()) {
						controller.showWarning("cancellingSchedule");
						$N.platform.btv.PVRManager.cancelRecordingByTask(task);
						closeOptionsMenu();
					} else {
						closeOptionsMenu();
						controller.stopIntervalService();
						controller.showWarning("deleting");
						PVRUtil.deleteTasks(tasks);
					}
				}
			}
		};
	}
	/**
	 * @method getPaddingMenuOption
	 * @private
	 */
	function getPaddingMenuOption() {
		return {
			title: controller.getString("paddingBeforeEpisodic"),
			secondTitle: controller.getString("paddingAfterEpisodic"),
			getPaddingBefore: function () {
				var mins = currentMenu.getSelectedItem().softPrepaddingDuration / $N.app.constants.MINUTE_IN_MS;
				return (!isNaN(mins) ? mins : 0) + " " + DateTimeUtil.getMinutesString(mins);
			},
			getPaddingAfter: function () {
				var mins = currentMenu.getSelectedItem().softPostpaddingDuration / $N.app.constants.MINUTE_IN_MS;
				return (!isNaN(mins) ? mins : 0) + " " + DateTimeUtil.getMinutesString(mins);
			},
			menuType: "keypad",
			menuData: {
				title: controller.getString("paddingBeforeEpisodic"),
				successCallback: function (data) {
					var task = states.scheduledMenu.getSelectedItem(),
						item = view.libraryOptions.getActualSelectedItem();
					if (data.paddingBefore !== null) {
						item.setFirstSubTitle(parseInt(data.paddingBefore, 10) + " " + DateTimeUtil.getMinutesString(data.paddingBefore));
					}
					if (data.paddingAfter !== null) {
						item.setSecondSubTitle(parseInt(data.paddingAfter, 10) + " " + DateTimeUtil.getMinutesString(data.paddingAfter));
					}
					if (data.paddingBefore !== null && data.paddingAfter !== null) {
						PVRUtil.updateRecording(task.taskId, {
							softPrepaddingDuration: DateTimeUtil.convertMinutesToMs(data.paddingBefore),
							softPostpaddingDuration: DateTimeUtil.convertMinutesToMs(data.paddingAfter)
						});
					}
				},
				exitCallback: closeOptionsMenu
			}
		};
	}

	/**
	 * @method getOptionsMenuItems
	 * @private
	 */
	function getOptionsMenuItems() {
		var selectedItem = currentMenu.getSelectedItem(),
			isUserFolder = !openFolderName && !$N.app.FolderUtil.isFolderRootFolder(selectedItem.uiFolder),
			menuItems = [getCancelRecordingOption(isUserFolder)],
			isSeriesFolder = (selectedItem && selectedItem._data && selectedItem._data.scheduleType && selectedItem._data.scheduleType === "SERIES"),
			showFolderRenameOption = isCurrentMenuRecordings() && isUserFolder && !isSeriesFolder,
			showPaddingOption = (isCurrentMenuScheduledRecordings() && (selectedItem.eventId !== null)),
			showFolderListOption = !isSeriesFolder && !showFolderRenameOption;

		if (showFolderRenameOption) {
			menuItems.push(getRenameFolderMenuItem(selectedItem));
		}
		if (showPaddingOption) {
			menuItems.push(getPaddingMenuOption());
		}
		if (showFolderListOption) {
			menuItems.push(getFolderOption(selectedItem));
		}
		menuItems.push(getKeepOption(selectedItem));
		menuItems.push(getBlockRecordingOption(selectedItem));
		return menuItems;
	}

	/**
	 * @method openOptionsMenu
	 * @private
	 */
	function openOptionsMenu() {
		libraryRowIndex = currentMenu.getSelectedItemIndex();
		closeOptionsFooter();
		view.recordingsList.hide();
		controller.hideLibraryTitle();
		view.libraryOptions.activate(getOptionsMenuItems());
		isOptionsMode = true;
	}

	/**
	 * @method subscribeToPVRStatusUpdateEvent
	 * @private
	 */
	function subscribeToPVRStatusUpdateEvent() {
		if (PVRSubscriptionIds.length === 0) {
			// we are adding these subscribe events to an array as we do not specifically need to know the Ids
			PVRSubscriptionIds = $N.app.PVRCapability.subscribeToPVRCapabilityEvent(PVRStatusUpdateListener, PVRStatusUpdateListener, LibraryWindow);
		}
	}

	/**
	 * @method unsubscribeFromPVRStatusUpdateEvent
	 * @private
	 */
	function unsubscribeFromPVRStatusUpdateEvent() {
		PVRSubscriptionIds = $N.app.PVRCapability.unSubscribeFromPVRCapabilityEvent(PVRSubscriptionIds);
	}

	/**
	 * Function to toggle the recording list sorting by name ASC or date DESC
	 * @method toggleSort
	 * @private
	 */
	function toggleSort() {
		log("toggleSort", "Enter");
		isSortByDate = !isSortByDate;
		view.recordingsOptionsFooter.greenSelectLabel.setText(getSortCaption());
		renderList(currentMenu.getData());
		currentMenu.focus();
		log("toggleSort", "Exit");
	}

	/* public API */

	/**
	 * @method initialise
	 */
	function initialise() {
		log("initialise", "Enter");
		initialiseList(states.recordingsMenu);
		initialiseList(states.scheduledMenu);
		currentMenu = states.recordingsMenu;
		noRecordingsLabel = view.recordingsList.noRecordingsLabel;
		view.libraryOptions.setDataMapper({
			getFirstTitle: function (data) {
				return data.title;
			},
			getFirstSubTitle: function (data) {
				if (data.getPaddingBefore) {
					return data.getPaddingBefore();
				}
				return data.subtitle;
			},
			getSecondTitle: function (data) {
				return data.secondTitle;
			},
			getSecondSubTitle: function (data) {
				if (data.getPaddingBefore) {
					return data.getPaddingAfter();
				}
				return data.secondSubtitle;
			},
			getSubMenuType: function (data) {
				return data.menuType;
			},
			getSubMenuData: function (data) {
				return data.menuData;
			}
		});
		view.libraryOptions.initialise();
		view.manualRecordingOptionsList.ManualRecordingOptions.setDataMapper({
			getFirstTitle: function (data) {
				return data.title;
			},
			getFirstSubTitle: function (data) {
				if (data.getStartTime) {
					return data.getStartTime();
				} else if (data.getStartDate) {
					return data.getStartDate();
				}
				return data.subtitle;
			},
			getSecondTitle: function (data) {
				return data.secondTitle;
			},
			getSecondSubTitle: function (data) {
				if (data.getStopTime) {
					return data.getStopTime();
				}
				return data.secondSubtitle;
			},
			getSubMenuType: function (data) {
				return data.menuType;
			},
			getSubMenuData: function (data) {
				return data.menuData;
			}
		});
		view.manualRecordingOptionsList.ManualRecordingOptions.initialise();
		$N.app.StandardTimers.minuteTimer.register("ManualRecordingMenuHelperClock", manualRecordingTimeUpdateHandler);
		controller.setUpdateTaskListenerCallback(updateTaskListener);
		log("initialise", "Exit");
	}

	/**
	 * @method preview
	 * @param {Object} data
	 */
	function preview(activationContext) {
		log("preview", "Enter");
		if (isOptionsMode) {
			closeOptionsMenu();
		}
		if (context !== activationContext) {
			switchWindow(activationContext);
			renderList(context.data);
		}
		selectedItemIndex = selectedItemIndex || 1;
		currentMenu.selectItemAtIndex(selectedItemIndex, false);
		view.show();
		previewComplete = true;
		$N.platform.ca.ParentalControl.setUserChangedCallback(uiRefreshCallback);
		log("preview", "Exit");
	}

	/**
	 * @method activate
	 * @param {Object} data
	 */
	function activate(activationContext) {
		log("activate", "Enter");
		if (!previewComplete || context !== activationContext) {
			preview(activationContext);
		}
		if (context.name === "recordTimeBased") {
			//if the activationContext  is  recordTimeBased then activate the manualRecordingOptions.
			activateManualRecordingOptionsMenu();
		} else {
			view.recordingsList.background.setCssClass('recordingsWindowBackgroundActivated');
			currentMenu.focus();
			initialiseOptionsFooter();
			openOptionsFooter();
			subscribeToPVRStatusUpdateEvent();
		}
		$N.app.PVRCapability.subscribeWHPvrDeviceUpdate(PVRStatusUpdateListener);
		isActive = true;
		log("activate", "Exit");
	}

	/**
	 * @method passivate
	 * @param {Object} leaveAsPreview
	 */
	function passivate(leaveAsPreview) {
		log("passivate", "Enter");
		stopDataUpdateTimer();
		if (context && context.name === "recordTimeBased") {
			//if the activationContext is recordTimeBased then show the preview of the ManualRecordingOptions.
			view.manualRecordingOptionsList.ManualRecordingOptions.preview(getManualRecordingOptionsMenuItems());
			isManualRecordingOptionsMode = false;
		} else {
			view.recordingsList.background.setCssClass('recordingsWindowBackgroundPassivated');
			controller.hideWarning();
			closeOptionsFooter();
			currentMenu.defocus();
			selectedItemIndex = DEFAULT_SELECTED_INDEX;
			unsubscribeFromPVRStatusUpdateEvent();
		}
		if (!leaveAsPreview) {
			controller.setLibraryTitle("");
			previewComplete = false;
			view.hide();
			$N.platform.ca.ParentalControl.setUserChangedCallback(function () {});
		}
		controller.setHideWarningTimeoutRequired(false);
		$N.app.PVRCapability.unSubscribeWHPvrDeviceUpdate(PVRStatusUpdateListener);
		isActive = false;
		log("passivate", "Exit");
	}

	/**
	 * @method unPreview
	 */
	function unPreview(activationContext) {
		log("unPreview", "Enter");
		context = activationContext;
		$N.app.TimerUtil.stopTimer("recordIcon");
		isSortByDate = true;
		closeFolder();
		passivate();
		log("unPreview", "Exit");
	}

	/**
	 * @method keyHandler
	 * @param {Object} key
	 * @return {Boolean} handled
	 */
	function keyHandler(key, repeats) {
		log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false,
			selectedItem = currentMenu.getSelectedItem(),
			isFolderHighlighted = context.name === "recordedRecordings" && recordingDataMapper.isFolder(selectedItem);
		if (controller.isWarningVisible()) {
			// absorb keypress
			return true;
		}
		if (isManualRecordingOptionsMode) {
			// if manualrecordingOption mode then handle the key press in ManualRecordingOptions.
			handled = view.manualRecordingOptionsList.ManualRecordingOptions.keyHandler(key, repeats);
		}
		if (selectedItem && !handled) {
			toggleFooterRedKey(!isFolderHighlighted);
			selectedItemIndex = currentMenu.getSelectedItemIndex();
			if (isOptionsMode) {
				handled = view.libraryOptions.keyHandler(key, repeats);
			} else {
				handled = currentMenu.keyHandler(key, repeats);
			}
		}
		if (!handled) {
			switch (key) {
			case keys.KEY_YELLOW:
			case keys.KEY_STOP:
				if (!isOptionsMode && selectedItem) {
					if (isCurrentMenuScheduledRecordings()) {
						cancelRecording(selectedItem);
					} else {
						deleteRecording(selectedItem);
					}
					handled = true;
				}
				break;
			case keys.KEY_BLUE:
				if (isOptionsMode) {
					closeOptionsMenu();
				} else {
					openOptionsMenu();
				}
				break;
			case keys.KEY_GREEN:
				if (!isOptionsMode && !isManualRecordingOptionsMode) {
					toggleSort();
				}
				if (isManualRecordingOptionsMode) {
					controller.returnToMenu();
				}
				handled = true;
				break;
			case keys.KEY_RED:
			case keys.KEY_INFO:
				if (!isOptionsMode && !isFolderHighlighted) {
					navigateToSynopsis(selectedItem);
					handled = true;
				}
				break;
			case keys.KEY_PLAY:
			case keys.KEY_PAUSE:
			case keys.KEY_PLAY_PAUSE:
				itemSelected(selectedItem);
				break;
			case keys.KEY_LEFT:
			case keys.KEY_BACK:
				if (isOptionsMode) {
					closeOptionsMenu();
				} else if (openFolderName) {
					closeFolder();
				} else {
					controller.returnToMenu();
				}
				handled = true;
				break;
			}
		}
		log("keyHandler", "Exit");
		return handled;
	}

	/* Public API */
	return {
		initialise: initialise,
		preview: preview,
		activate: activate,
		passivate: passivate,
		unPreview: unPreview,
		keyHandler: keyHandler,
		dataUpdate: dataUpdate
	};
};
