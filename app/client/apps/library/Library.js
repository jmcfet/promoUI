/*global LibraryWindow*/
/**
 * Library
 * @module Library
 * @class Library
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.platform.btv.PVRManager
 * @param {Object} $N
 */
var Library = (function ($N) {
	var log = new $N.apps.core.Log("Library", "Library"),
		view = {},
		states = {},
		currentState = null,
		menu = null,
		selectedMenuItem = null,
		diskSpaceTimeoutId = null,
		menuItems = null,
		warningMessageTimeoutId = null,
		WARNING_MESSAGE_TIMEOUT = 30000,
		UPDATE_RECORDING_MESSAGE_TIMEOUT = 5000,
		hideWarningTimeoutRequired = false,
		dataMapper = {
			getTitle: function (obj) {
				return Library.getString(obj.name);
			},
			dataUpdate: function (item, data) {
				item.data = data;
			}
		},
		updateServiceTimeoutId = null,
		actionInterface = function (data) {},
		PVRSubscriptionIds = [],
		updateTaskListenerCallback = null,
		PVRManager = $N.platform.btv.PVRManager,
		showWarning = function () {},
		hideWarning = function () {},
		restartWarningMessageTimeout = function () {},
		settingsPanel = null;

	/**
	 * @method stopIntervalService
	 * @private
	 */
	function stopIntervalService() {
		log("stopIntervalService", "Enter");
		if (updateServiceTimeoutId) {
			log("stopIntervalService", "Clearing the interval");
			clearInterval(updateServiceTimeoutId);
			updateServiceTimeoutId = null;
		}
		log("stopIntervalService", "Exit");
	}

	/**
	 * @method startIntervalService
	 * @param {Function} callback
	 * @param {Integer} time
	 * @private
	 */
	function startIntervalService(callback, time) {
		log("startIntervalService", "Enter");
		stopIntervalService();
		updateServiceTimeoutId = setInterval(callback, time);
		log("startIntervalService", "Exit");
	}


	/**
	 * @method showLibraryTitle
	 * @public
	 */
	function showLibraryTitle() {
		log("showLibraryTitle", "Enter:");
		view.libraryTitle.show();
		log("showLibraryTitle", "Exit");
	}

	/**
	 * @method hideLibraryTitle
	 * @public
	 */
	function hideLibraryTitle() {
		log("hideLibraryTitle", "Enter:");
		view.libraryTitle.hide();
		log("hideLibraryTitle", "Exit");
	}

	/**
	 * @method setLibraryTitle
	 * @public
	 * @param {String} text
	 */
	function setLibraryTitle(text) {
		log("setLibraryTitle", "Enter:");
		view.libraryTitle.title.setText(text);
		log("setLibraryTitle", "Exit");
	}

	/**
	 * @method updateHardDiskUsageCallback
	 * @private
	 */
	function updateHardDiskUsageCallback() {
		log("updateHardDiskUsageCallback", "Enter");
		$N.app.PVRUtil.updateHDDProgress(view.hardDriveSpace);
		log("updateHardDiskUsageCallback", "Exit");
	}

	/**
	 * @method startUpdateHardDiskPercentageInterval
	 * @private
	 */
	function startUpdateHardDiskPercentageInterval() {
		log("startUpdateHardDiskPercentageInterval", "Enter");
		updateHardDiskUsageCallback();
		startIntervalService(updateHardDiskUsageCallback, $N.app.constants.MINUTE_IN_MS);
		log("startUpdateHardDiskPercentageInterval", "Exit");
	}

	/**
	 * Informs ContextManager that this context is flagged for
	 * removal from the navigation stack
	 * @method flagContextForRemoval
	 * @param {Boolean} isToBeRemoved
	 * @private
	 */
	function flagContextForRemoval(isToBeRemoved) {
		log("flagContextForRemoval", "Enter");
		Library._isFlaggedForRemoval = isToBeRemoved;
		log("flagContextForRemoval", "Exit");
	}

	/**
	 * @method PVRStatusUpdateListener
	 * @param {Object} status object for PVR
	 * @private
	 */
	function PVRStatusUpdateListener(status) {
		log("PVRStatusUpdateListener", "Enter");
		var isPVREnabled = $N.app.PVRCapability.isPVREnabled(true),
			isToBeRemoved = !isPVREnabled;
		flagContextForRemoval(isToBeRemoved);
		if (isPVREnabled) {
			startUpdateHardDiskPercentageInterval();
		} else {
			$N.app.ContextHelper.closeContext();
		}
		log("PVRStatusUpdateListener", "Exit");
	}

	/**
	 * Method that overlays the MediaPlayer to play the current recording
	 * @method playVideo
	 * @param {Object} data
	 */
	function playVideo(data) {
		log("playVideo", "Enter");
		var title = data.title,
			channelNumber = $N.apps.util.Util.formatDate(new Date(data.startTime), "dd/mm"),
			channelLogo = $N.app.epgUtil.getChannelLogoUrl(data.serviceId),
			config = $N.app.PVRUtil.getVideoConfig(
				title,
				Library.getString("pvr"),
				0,
				channelNumber,
				channelLogo,
				data
			),
			tvName;
		config.dontRestartStream = false;
		config.clearBookmark = data.clearBookmark || false;
		config.atEndOfPlayBack = false;
		config.playingEvent = data;
		config.failureCallback = function (errorInfo) {
			var tvName;
			if (!$N.platform.btv.PVRManager.isLocalRecording(data) && errorInfo.contentErrorInfo) {
				log("playVideo", "failureCallback - whpvr playback errMsg:" + errorInfo.contentErrorInfo.errorStr + "," + errorInfo.contentErrorInfo.reason);
				tvName = $N.platform.btv.PVRManager.getTVName(data);
				$N.app.DialogueHelper.showWHPVRPlaybackErrorDialogue(tvName);
			}
			$N.app.ContextHelper.closeContext();
		};

		if (!$N.platform.btv.PVRManager.isLocalRecording(data) && config.url.length < "dlna:".length) {
			// Pop up a dialogue when the recording playback URL is invalid for WHPVR
			// This is to be caused by failed provision on server set-top box.
			log("playVideo", "Invalid playback url for WHPVR.");
			tvName = $N.platform.btv.PVRManager.getTVName(data);
			$N.app.DialogueHelper.showWHPVRPlaybackErrorDialogue(tvName);
		} else {
			$N.app.ContextHelper.openContext("MEDIAPLAYER", {activationContext: config});
		}
		log("playVideo", "Exit");
	}

	/**
	 * @method returnToMenu
	 */
	function returnToMenu() {
		log("returnToMenu", "Enter");
		if (currentState) {
			if (currentState.passivate) {
				currentState.passivate(true);
			}
			currentState = states.menuState;
			currentState.focus();
		}
		log("returnToMenu", "Exit");
	}

	/**
	 * function to update menu data when a recording is deleted from the library window
	 * @method updateMenuData
	 * @param {Number} Index	Index of the menuItem
	 * @param {Object} task		PVRManager single task data
	 * @param {Boolean} isFolder Are we currently viewing a folder
	 */
	function updateMenuData(index, task, isFolder) {
		log("updateMenuData", "Enter");
		var menuData = menuItems,
			tasks,
			i,
			count,
			selectedItemIndex = menu.getSelectedItemIndex();
		tasks = menuData[index].data;
		count = tasks.length;
		for (i = 0; i < count; i++) {
			if (tasks[i].eventId === task.eventId) {
				tasks.splice(i, 1);
				break;
			}
		}
		menu.setData(menuData);
		menu.selectItemAtIndex(selectedItemIndex);
		if (tasks.length === 0 && !isFolder) {
			returnToMenu();
		}
		updateHardDiskUsageCallback();
		log("updateMenuData", "Exit");
	}

	/**
	 * @method refreshLibraryData
	 */
	function refreshLibraryData() {
		log("refreshLibraryData", "Enter");
		var selectedItemIndex = menu.getSelectedItemIndex(),
			RECORD_TIME_BASED_MENU_INDEX = 4;
		if (selectedItemIndex === RECORD_TIME_BASED_MENU_INDEX) {
			setLibraryTitle(Library.getString("recordTimeBasedMenuTitle"));
		}
		menu.setData(menuItems);
		menu.selectItemAtIndex(selectedItemIndex);
		startUpdateHardDiskPercentageInterval();
		log("refreshLibraryData", "Exit");
	}

	function getSettingsPanelTitle() {
		log("getSettingsPanelTitle", "Enter + Exit");
		return view.libraryTitle.title;
	}

	function setSettingsPanelTitle(title) {
		log("setSettingsPanelTitle", "Enter");
		view.libraryTitle.title.setText($N.app.StringUtil.upcaseFirstLetter(title));
		log("setSettingsPanelTitle", "Exit");
	}

	function recordingsPreferencesHighlighted(menuItem) {
		view.recordingsWindow.hide();
		view.settingsPanelWindow.show();
		setSettingsPanelTitle(Library.getString(menuItem.name));
		settingsPanel.preview(settingsPanel.getSettingsShortcutObject("menuRecorderPreferences"));
	}

	/**
	 * @method itemHighlighted
	 * @private
	 * @param {Object} menuItem
	 */
	function itemHighlighted(menuItem) {
		view.settingsPanelWindow.hide();
		view.recordingsWindow.show();
		if (menuItem.data) {
			refreshLibraryData();
			states.recordingsWindow.preview(menu.getSelectedItem());
		} else if (menuItem.itemHighlighted) {
			menuItem.itemHighlighted(menuItem);
		} else {
			states.recordingsWindow.unPreview(menu.getSelectedItem());
		}
	}

	/**
	 * Need to update schedule list after return from Guide in case there is some new schedules.
	 * Also when a Time based recording is set, we need to update the recordings and shcedules data.
	 * @method updateRecordingsData
	 * @public
	 */
	function updateRecordingsData() {
		log("updateRecordingsData", "Enter");
		menu.getDataMapper().dataUpdate(menu.getData()[0], $N.app.FolderUtil.getDataForFolders());
		menu.getDataMapper().dataUpdate(menu.getData()[1], $N.app.PVRUtil.getScheduledRecordings());
		states.recordingsWindow.dataUpdate();
		log("updateRecordingsData", "Exit");
	}

	function switchActiveComponent() {
		log("switchActiveComponent", "Enter");
		if (currentState === states.menuState) {
			currentState.defocus();
			currentState = settingsPanel;
		} else if (currentState === settingsPanel) {
			currentState = states.menuState;
			currentState.focus();
		}
		log("switchActiveComponent", "Exit");
	}

	function recordingsPreferencesSelected(menuItem) {
		log("recordingsPreferencesSelected", "Enter");
		if (!view.settingsPanelWindow.isVisible()) {
			recordingsPreferencesHighlighted(menuItem);
		}
		if (settingsPanel.activate(settingsPanel.getSettingsShortcutObject("menuRecorderPreferences"), null)) {
			switchActiveComponent();
		}
		log("recordingsPreferencesSelected", "Exit");
	}

	/**
	 * @method itemSelected
	 * @private
	 * @param {Object} menuItem
	 */
	function itemSelected(menuItem) {
		log("itemSelected", "Enter");
		var navigationContextConfigObj = null;
		if (menuItem.data && menuItem.data.length) {
			if (currentState === states.menuState) {
				selectedMenuItem = menuItem;
				currentState.defocus();
				currentState = states.recordingsWindow;
				currentState.activate(menuItem);
			}
		} else if (menuItem.navigationContext) {
			navigationContextConfigObj = {navCompleteCallback: updateRecordingsData};
			if (menuItem.navigationContextActivationObj) {
				navigationContextConfigObj.activationContext = menuItem.navigationContextActivationObj;
			}
			states.recordingsWindow.unPreview();
			$N.app.ContextHelper.openContext(menuItem.navigationContext, navigationContextConfigObj);
		} else if (menuItem.itemSelected && currentState === states.menuState) {
			menuItem.itemSelected(menuItem);
		}
		log("itemSelected", "Exit");
	}

	/**
	 * @method initialiseComponents
	 * @private
	 */
	function initialiseComponents() {
		var VISIBLE_ITEM_COUNT = 6;
		menu = view.menu;
		menu.setDataMapper(dataMapper);
		menu.setItemHighlightedCallback(itemHighlighted);
		menu.setItemSelectedCallback(itemSelected);
		menu.setVisibleItemCount(VISIBLE_ITEM_COUNT);
		menu.initialise();
		view.hardDriveSpace.progressBar.initialise(0, 100);
		updateHardDiskUsageCallback();
	}

	/**
	 * @method subscribeToPVRStatusUpdateEvent
	 * @private
	 */
	function subscribeToPVRStatusUpdateEvent() {
		if (PVRSubscriptionIds.length === 0) {
			// we are adding these subscribe events to an array as we do not specifically need to know the Ids
			PVRSubscriptionIds = $N.app.PVRCapability.subscribeToPVRCapabilityEvent(PVRStatusUpdateListener, PVRStatusUpdateListener, Library);
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
	 * @method setUpdateTaskListenerCallback
	 * @param {Function} callback
	 */
	function setUpdateTaskListenerCallback(callback) {
		updateTaskListenerCallback = callback;
	}

	/**
	 * @method updateTaskListener
	 * @param {String} eventName
	 */
	function updateTaskListener(eventName) {
		log("updateTaskListener", "Enter");
		var allowRestartOfTimeout;
		if ($N.app.StringUtil.isStringInArray(eventName, ["deleteContentOK", "deleteContentFailed", "updateEntryOK"])) {
			$N.app.PVRUtil.incrementTasksCallbacksFired();
		}
		if (updateTaskListenerCallback) {
			updateTaskListenerCallback(eventName);
			allowRestartOfTimeout = $N.app.PVRUtil.getDataUpdateState() === $N.app.PVRUtil.DATA_UPDATE_STATE.NOT_ALLOWED;
			if (eventName === "updateEntryOK" && allowRestartOfTimeout) {
				log("updateTaskListener", "NOT ALLOWED");
				restartWarningMessageTimeout();
			}
		}
		log("updateTaskListener", "Exit");
	}

	/**
	 * @method registerTaskListeners
	 */
	function registerTaskListeners() {
		PVRManager.addEventListener("updateEntryOK", updateTaskListener);
		PVRManager.addEventListener("deleteContentOK", updateTaskListener);
		PVRManager.addEventListener("onTasksChanged", updateTaskListener);
		PVRManager.addEventListener("onTasksModified", updateTaskListener);
		PVRManager.addEventListener("updateTaskOK", updateTaskListener);
		PVRManager.addEventListener("updateTaskFailed", updateTaskListener);
		PVRManager.addEventListener("onTaskStarted", updateRecordingsData);
		PVRManager.addEventListener("onTaskStopped", updateRecordingsData);
		PVRManager.addEventListener("stopTaskOK", updateTaskListener);
		PVRManager.addEventListener("stopTaskFailed", updateTaskListener);
		PVRManager.addEventListener("deleteJobOK", updateTaskListener);
		PVRManager.addEventListener("deleteJobFailed", updateTaskListener);
	}

	/**
	 * @method unregisterTaskListeners
	 */
	function unregisterTaskListeners() {
		PVRManager.removeEventListener("updateEntryOK", updateTaskListener);
		PVRManager.removeEventListener("deleteContentOK", updateTaskListener);
		PVRManager.removeEventListener("onTasksChanged", updateTaskListener);
		PVRManager.removeEventListener("onTasksModified", updateTaskListener);
		PVRManager.removeEventListener("updateTaskOK", updateTaskListener);
		PVRManager.removeEventListener("updateTaskFailed", updateTaskListener);
		PVRManager.removeEventListener("onTaskStarted", updateRecordingsData);
		PVRManager.removeEventListener("onTaskStopped", updateRecordingsData);
		PVRManager.removeEventListener("stopTaskOK", updateTaskListener);
		PVRManager.removeEventListener("stopTaskFailed", updateTaskListener);
		PVRManager.removeEventListener("deleteJobOK", updateTaskListener);
		PVRManager.removeEventListener("deleteJobFailed", updateTaskListener);
	}

	/**
	 * @method restartWarningMessageTimeout
	 * @param {String} warningMessage  Message
	 * @public
	 */
	restartWarningMessageTimeout = function () {
		log("restartWarningMessageTimeout", "Enter");
		if (warningMessageTimeoutId) {
			clearTimeout(warningMessageTimeoutId);
		}
		warningMessageTimeoutId = setTimeout(function () {
			hideWarningTimeoutRequired = true;
			hideWarning();
		}, WARNING_MESSAGE_TIMEOUT);
		log("restartWarningMessageTimeout", "Exit");
	};

	/**
	 * @method showWarning
	 * @param {String} warningMessage - Message to be displayed in warning banner
	 * @public
	 */
	showWarning = function (warningMessage) {
		log("showWarning", "Enter - warningMessage:" + Library.getString(warningMessage));
		var warningPopup = view.warningMessage;
		warningPopup.setMessage(Library.getString(warningMessage));
		warningPopup.show();
		warningPopup.setBlockUI(true);
		restartWarningMessageTimeout();
		log("showWarning", "Exit");
	};

	/**
	 * @method hideWarning
	 * @public
	 */
	hideWarning = function () {
		log("hideWarning", "Enter");
		var REFRESH_TIMEOUT = 10000,
			warningPopup = view.warningMessage;
		if (warningMessageTimeoutId) {
			clearTimeout(warningMessageTimeoutId);
		}
		warningPopup.hide();
		warningPopup.setBlockUI(false);
		if (hideWarningTimeoutRequired) {
			hideWarningTimeoutRequired = false;
			setTimeout(function () {
				refreshLibraryData();
			}, REFRESH_TIMEOUT);
		}
		log("hideWarning", "Exit");
	};

	return {

		/**
		 * Entry point of the application for the SVG onload event
		 * @method load
		 */
		load: function () {
			log("load", "Enter");
			$N.gui.ResolutionManager.initialiseContext(document);
			$N.apps.core.Language.importLanguageBundleForObject(Library, Library.init, "apps/library/common/", "LanguageBundle.js", null, window);
			log("load", "Exit");
		},
		/**
		 * Application lifecycle initialisation method to create the view
		 * @method init
		 */
		init: function () {
			log("init", "Enter");
			$N.gui.FrameworkCore.loadGUIFromXML("apps/library/view/library.xml", document.getElementById("content"), view, window);
			var recordingsWindow = new LibraryWindow(Library, view.recordingsWindow);
			settingsPanel = new $N.gui.SettingsPanel(Library, view.settingsPanelWindow.settingsPanel, document.getElementById("content"));
			initialiseComponents();
			states = {
				menuState: menu,
				recordingsWindow: recordingsWindow
			};
			states.recordingsWindow.initialise();
			$N.apps.core.ContextManager.initialisationComplete(Library);
			log("init", "Exit");
		},

		/**
		 * Application lifecycle activation method to draw the view
		 * @method activate
		 * @param {Object} activationObject
		 */
		activate: function (activationObject) {
			log("activate", "Enter");
			menuItems = [{
				name: "recordedRecordings",
				data: $N.app.FolderUtil.getDataForFolders(),
				noRecordsLabel: Library.getString("noRecordings"),
				action: playVideo
			}, {
				name: "scheduledRecordings",
				data: $N.app.PVRUtil.getScheduledRecordings(),
				noRecordsLabel: Library.getString("noScheduled"),
				action: actionInterface
			}, {
				name: "record",
				data: null,
				noRecordsLabel: '',
				navigationContext: "LISTGUIDE",
				action: actionInterface
			}, {
				name: "recordTimeBased",
				data: $N.app.ManualRecordingOptionHelper.getManualRecordingsDummyData(),
				itemHighlighted: recordingsPreferencesHighlighted,
				noRecordsLabel: Library.getString("noScheduled"),
				action: actionInterface
			}, {
				name: "recordingsPreferences",
				data: null,
				noRecordsLabel: "",
				itemHighlighted: recordingsPreferencesHighlighted,
				itemSelected: recordingsPreferencesSelected,
				/*navigationContext: "SETTINGS",
				navigationContextActivationObj: {"shortcutId" : "menuRecorderPreferences", "isSettingsAsShortcut" : true},*/
				action: actionInterface
			}, {
				name: "search",
				data: null,
				noRecordsLabel: '',
				navigationContext: "SEARCH",
				action: actionInterface,
				navigationContextActivationObj: {confirmLeftExit : true}
			}];
			states.recordingsWindow.unPreview();
			currentState = states.menuState;
			menu.setData(menuItems);
			menu.displayData();
			menu.focus();
			$N.app.BrandHelper.show($N.app.BrandHelper.AGORA_BACKGROUND_ID);
			$N.app.ClockDisplay.show();
			startUpdateHardDiskPercentageInterval();
			subscribeToPVRStatusUpdateEvent();
			$N.app.PVRCapability.subscribeWHPvrDeviceUpdate(PVRStatusUpdateListener);
			registerTaskListeners();
			log("activate", "Exit");
		},

		/**
		 * Application lifecycle passivation method to hide the view
		 * @method passivate
		 */
		passivate: function (leaveAsPreview) {
			log("passivate", "Enter");
			$N.app.BrandHelper.hideAll();
			$N.app.ClockDisplay.hide();
			if (currentState === settingsPanel) {
				settingsPanel.passivate(true);
			}
			currentState = null;
			states.recordingsWindow.unPreview();
			if (diskSpaceTimeoutId) {
				clearTimeout(diskSpaceTimeoutId);
			}
			unsubscribeFromPVRStatusUpdateEvent();
			$N.app.PVRCapability.unSubscribeWHPvrDeviceUpdate(PVRStatusUpdateListener);
			stopIntervalService();
			$N.app.TimerUtil.stopTimer("recordIcon");
			$N.app.TimerUtil.stopTimer("ManualRecordingMenuHelperClock");
			unregisterTaskListeners();
			log("passivate", "Exit");
		},

		focus: function () {
			log("focus", "Enter");
			if ($N.app.PVRCapability.isPVREnabled(true)) {
				$N.app.BrandHelper.show($N.app.BrandHelper.AGORA_BACKGROUND_ID);
				$N.app.ClockDisplay.show();
				startUpdateHardDiskPercentageInterval();
				subscribeToPVRStatusUpdateEvent();
				view.recordingsWindow.manualRecordingOptionsList.manualRecordingOptions.registerJobCallbacks();
			} else {
				$N.app.ContextHelper.closeContext();
			}
			log("focus", "Exit");
		},

		defocus: function () {
			log("defocus", "Enter");
			stopIntervalService();
			$N.app.ClockDisplay.hide();
			$N.app.BrandHelper.hideAll();
			unsubscribeFromPVRStatusUpdateEvent();
			view.recordingsWindow.manualRecordingOptionsList.manualRecordingOptions.unregisterJobCallbacks();
			log("defocus", "Exit");
		},

		/**
		 * Application lifecycle method to return the context name
		 * @method toString
		 */
		toString: function () {
			return "LIBRARY";
		},

		/**
		 * Main keyHandler method
		 * @param {String} key
		 */
		keyHandler: function (key, repeats) {
			log("keyHandler", "Enter");
			var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
				handled = false;
			$N.app.MemoryUtil.setOrUpdateGarbageCollectTimeoutAndInterval();
			if (currentState) {
				handled = currentState.keyHandler(key, repeats);
			}
			if (!handled) {
				switch (key) {
				case keys.KEY_LEFT:
					$N.app.ContextHelper.closeContext();
					handled = true;
					break;
				}
			}

			log("keyHandler", "Exit");
			return handled;
		},


		/**
		 * @method isWarningVisible
		 * @public
		 * @return {Boolean}
		 */
		isWarningVisible: function () {
			return view.warningMessage.isVisible();
		},

		/**
		 * @method setHideWarningTimeoutRequired
		 * @public
		 * @param {Boolean} isRequired
		 */
		setHideWarningTimeoutRequired: function (isRequired) {
			hideWarningTimeoutRequired = isRequired;
		},
		setLibraryTitle: setLibraryTitle,
		showLibraryTitle: showLibraryTitle,
		hideLibraryTitle: hideLibraryTitle,
		showWarning: showWarning,
		hideWarning: hideWarning,
		stopIntervalService: stopIntervalService,
		restartWarningMessageTimeout: restartWarningMessageTimeout,
		itemSelected: itemSelected,
		returnToMenu: returnToMenu,
		updateHardDiskUsageCallback: updateHardDiskUsageCallback,
		PVRStatusUpdateListener: PVRStatusUpdateListener,
		setUpdateTaskListenerCallback: setUpdateTaskListenerCallback,
		updateRecordingsData: updateRecordingsData,
		startUpdateHardDiskPercentageInterval: startUpdateHardDiskPercentageInterval,
		switchActiveComponent: switchActiveComponent,
		getSettingsPanelTitle: getSettingsPanelTitle,
		setSettingsPanelTitle: setSettingsPanelTitle
	};

}(window.parent.$N));
