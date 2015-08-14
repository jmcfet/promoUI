/*global TimeList, GridController*/
/**
 * EventList is a sub_controller of list guide and is used to controll
 * event list and event grid
 * @module ListGuide
 * @class EventList
 * @constructor
 * #depends GridController.js
 * #depends TimeList.js
 * @param {Object} controller
 * @param {Object} channelView
 */
var EventList = function (controller, view) {
	var $N = window.parent.$N,
		log = new $N.apps.core.Log("ListGuide", "EventList"),
		START_OF_DAY_HOUR = 6,
		GUIDE_MODE = {
			GRID: "grid",
			LIST: "list"
		},
		prefGuideMode = $N.platform.system.Preferences.get($N.app.constants.DISPLAY_GUIDE_MODE),
		modes = null,
		eventHighlightedCallback = function () {},
		currentMode = null,
		_shouldUpdateTimeWindow = true;

	/**
	 * @method stopTimers
	 */
	function stopTimers() {
		modes.grid.stopUpdateTimer();
		modes.list.stopUpdateService();
	}

	/* Public API */
	return {

		/**
		 * Initialises the state
		 * @method initialise
		 * @param {Function} callback
		 */
		initialise: function (callback) {
			log("initialise", "Enter");
			var list = new TimeList(this, view.timeListGroup),
				grid = new GridController(this, view.gridListGroup);
			modes = {
				list: list,
				grid: grid
			};
			modes.list.initialise(callback);
			modes.grid.initialise(callback);
			currentMode = (prefGuideMode === GUIDE_MODE.LIST) ? modes.list : modes.grid;
			$N.apps.core.Language.importLanguageBundleForObject(this, null, "apps/listGuide/common/", "LanguageBundle.js", null, window);

			log("initialise", "Exit");
		},

		/**
		 * @method preview
		 * @param {Object} data
		 * @param {Object Array} viewableChannels
		 * @param {Object} scheduledEvent
		 */
		preview: function (data, viewableChannels, scheduledEvent) {
			log("preview", "Enter");
			if (currentMode === modes.list) {
				currentMode.resetToToday();
				currentMode.preview(data, scheduledEvent);
			} else {
				currentMode.preview(viewableChannels, scheduledEvent, _shouldUpdateTimeWindow);
			}
			controller.getStates().channelList.resetFilterChanged();
			log("preview", "Exit");
		},

		/**
		 * @method unPreview
		 * @param {Object} data
		 */
		unPreview: function (data) {
			log("unPreview", "Enter");
			log("unPreview", "Exit");
		},

		/**
		 * Activates the state
		 * @method activate
		 * @param {Object} data
		 */
		activate: function (data) {
			log("activate", "Enter");
			_shouldUpdateTimeWindow = true;
			controller.updateVoltarButton();
			currentMode.activate(data);
			log("activate", "Exit");
		},

		/**
		 * Passivates the state
		 * @method passivate
		 * @param {Boolean} leaveAsPreview
		 */
		passivate: function (leaveAsPreview) {
			log("passivate", "Enter");
			currentMode.passivate(leaveAsPreview);
			stopTimers();
			log("passivate", "Exit");
		},

		/**
		 * @method showBackgroundOnly
		 */
		showBackgroundOnly: function () {
			stopTimers();
			if (currentMode === modes.list) {
				modes.list.showBackgroundOnly();
			} else {
				currentMode.passivate();
			}
		},

		/**
		 * @method update
		 */
		update: function () {
			log("update", "Enter");
			currentMode.update();
			log("update", "exit");
		},


		/**
		 * @method updateIcons
		 */
		updateIcons: function () {
			log("updateIcons", "Enter");
			currentMode.updateIcons();
			log("updateIcons", "exit");
		},

		/**
		 * @method updateTest - FOR TEST PURPOSES ONLY DO NOT USE (WIP)
		 */
		updateTest: function () {
			currentMode.updateTest();
		},

		/**
		 * @method setSecondaryFocus
		 */
		setSecondaryFocus: function () {
			currentMode.setSecondaryFocus();
		},

		/**
		 * @method unsetSecondaryFocus
		 */
		unsetSecondaryFocus: function () {
			currentMode.unsetSecondaryFocus();
		},

		/**
		 * @method getSelectedItem
		 */
		getSelectedItem: function () {
			return currentMode.getSelectedItem();
		},

		/**
		 * @method focus
		 */
		focus: function () {
			log("focus", "Enter");
			currentMode.focus();
			log("focus", "Exit");
		},

		/**
		 * @method defocus
		 */
		defocus: function () {
			log("defocus", "Enter");
			_shouldUpdateTimeWindow = true;
			stopTimers();
			currentMode.defocus();
			log("defocus", "Exit");
		},

		/**
		 * Returns the number of days until eventTime
		 * Each day starts at DAY_START_HOURS
		 *
		 * @method getDayNumberByTime
		 * @param {Date} eventTime
		 * @return {Integer} timeDiffDays
		 */
		getDayNumberByTime: function (eventTime) {
			log("getDayNumberByTime", "Enter");
			var now = new Date(),
				startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), START_OF_DAY_HOUR, 0, 0),
				timeDiff = 0,
				timeDiffDays = 0;

			if (now < startOfToday) {
				startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, START_OF_DAY_HOUR, 0, 0, 0);
			}
			timeDiff = eventTime - startOfToday;
			timeDiffDays = Math.floor(timeDiff / $N.app.constants.DAY_IN_MS);
			log("getDayNumberByTime", "Exit");
			return timeDiffDays;
		},

		/**
		 * @method updateEarliestEventTime
		 * @param {Function} callback - function (Object event)
		 * @param {Number} serviceId
		 */
		updateEarliestEventTime: function (callback, serviceId) {
			log("updateEarliestEventTime", "Enter");
			$N.app.epgUtil.fetchEarliestEvent(callback, serviceId);
			log("updateEarliestEventTime", "Exit");
		},

		/**
		 * @method updateLatestEventTime
		 * @param {Function} callback - function (Object event)
		 * @param {Number} serviceId
		 */
		updateLatestEventTime: function (callback, serviceId) {
			log("updateLatestEventTime", "Enter");
			$N.app.epgUtil.fetchLatestEvent(callback, serviceId);
			log("updateLatestEventTime", "Exit");
		},

		/**
		 * generate start/end time interval
		 * Day 0 has exception. It should start from now untill 6AM next day.
		 *
		 * @method getDayInterval
		 * @param {Integer} day - 0, 1, 2, n + 1
		 * @return {Object} timeInterval - {day: 1, startTime: ephoch=6AM, endTime: ephoch =startTime + 24h}
		 */
		getDayInterval: function (day) {
			log("getDayInterval", "Enter");
			var timeInterval = {
					day: 0,
					startTime: null,
					endTime: null
				},
				currentDay = day || 0,
				timeDayInterval = 0,
				date = new Date(),
				startDayTimeNow = null,
				startDayTimeSet = null;
			timeDayInterval = currentDay * $N.app.constants.DAY_IN_MS;
			startDayTimeNow = new Date(date.getFullYear(), date.getMonth(), date.getDate(), START_OF_DAY_HOUR, 0, 0, 0);
			if (date < startDayTimeNow) {
				startDayTimeNow = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, START_OF_DAY_HOUR, 0, 0, 0);
			}
			startDayTimeSet = new Date(startDayTimeNow.getTime() + timeDayInterval);
			timeInterval.day = currentDay;
			timeInterval.startTime = startDayTimeSet.getTime();
			timeInterval.endTime = startDayTimeSet.getTime() + $N.app.constants.DAY_IN_MS;
			if (currentDay === 0 && !$N.app.FeatureManager.isCatchUpEnabled()) {
				// Events start at the current date/Time if catchup disabled
				timeInterval.startTime = date.getTime();
			}
			log("getDayInterval", "Exit");
			return timeInterval;
		},

		/**
		 * @method isTimeListMode
		 */
		isTimeListMode: function () {
			return (currentMode === modes.list);
		},

		/**
		 * @method setEventHighlightedCallback
		 * @param {function} callback
		 */
		setEventHighlightedCallback: function (callback) {
			modes.list.setEventHighlightedCallback(callback);
			modes.grid.setEventHighlightedCallback(callback);
		},

		/**
		 * @method shouldUpdateTimeWindow
		 * @return {Boolean}
		 */
		shouldUpdateTimeWindow: function () {
			return _shouldUpdateTimeWindow;
		},

		/**
		 * @method setShouldUpdateTimeWindow
		 * @param {Boolean} shouldUpdateTimeWindowValue
		 */
		setShouldUpdateTimeWindow: function (shouldUpdateTimeWindowValue) {
			_shouldUpdateTimeWindow = shouldUpdateTimeWindowValue;
		},

		/**
		 * @method changeMode
		 */
		changeMode: function () {
			log("changeMode", "Enter");
			var item = currentMode.getSelectedItem();
			currentMode.passivate();
			_shouldUpdateTimeWindow = true;
			if (currentMode !== modes.list) {
				// Stop the timer of refreshing grid guide
				currentMode.stopUpdateTimer();
				currentMode = modes.list;
				$N.platform.system.Preferences.set($N.app.constants.DISPLAY_GUIDE_MODE, GUIDE_MODE.LIST);
				currentMode.activate(controller.getStates().channelList.getSelectedItem(), item);
			} else {
				currentMode = modes.grid;
				$N.platform.system.Preferences.set($N.app.constants.DISPLAY_GUIDE_MODE, GUIDE_MODE.GRID);
				currentMode.preview(controller.getStates().channelList.returnViewableList(), item, false);
			}
			log("changeMode", "Exit");
		},

		/**
		 * Get 24  hours events data
		 *
		 * @method getDataByDay
		 * @param {Object} data - service
		 * @param {Integer} day - 0, 1, 2, n + 1
		 * @param {Function} callback - function({array} resultSet - events)
		 * @return void
		 */
		getDataByDay: function (data, day, callback) {
			log("getDataByDay", "Enter");
			var timeInterval = this.getDayInterval(day);
			$N.app.epgUtil.fetchEventsByWindow(data.serviceId, timeInterval.startTime, timeInterval.endTime, function (resultSet) {
				resultSet = $N.app.epgUtil.getDefaultEventIfNoEvents(resultSet, data.serviceId, timeInterval.startTime, timeInterval.endTime);
				if (callback) {
					callback(resultSet);
				}
			});
			log("getDataByDay", "Exit");
		},

		/**
		 * Key handler for the state
		 * @method keyHandler
		 * @param {String} key
		 */
		keyHandler: function (key, repeats) {
			log("keyHandler", "Enter");
			var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
				handled = false,
				LEAVE_AS_PREVIEW = true;
			$N.app.MemoryUtil.setOrUpdateGarbageCollectTimeoutAndInterval();
			switch (key) {
			case keys.KEY_OK:
				log("keyHandler", "Exit1");
				handled = false;
				break;
			default:
				log("keyHandler", "Exit2");
				handled = false;
				break;
			}
			if (!handled) {
				handled = currentMode.keyHandler(key, repeats);
			}
			log("keyHandler", "Exit");
			return handled;
		},

		/**
		 * @method focusOnNowEvent
		 */
		focusOnNowEvent: function (channel) {
			log("focusOnNowEvent", "Enter");
			currentMode.focusOnNowEvent(channel);
			log("focusOnNowEvent", "Exit");
		},

		/**
		 * Get controller of list guide
		 * @method getController
		 * @return {Object}
		 */
		getController: function () {
			return controller;
		},

		/**
		 * @method isCatchupEvent
		 */
		isCatchupEvent: function (event) {
			log("isCatchupEvent", "Enter & Exit");
			return currentMode.isCatchupEvent(event);
		},

		/**
		 * @method isListToday
		 * @return {Boolean}
		 */
		isListToday: function () {
			return modes.list.isToday();
		},

		/**
		 * @method moveListToYesterday
		 */
		moveListToYesterday: function () {
			return modes.list.moveToYesterday();
		},

		/**
		 * @method resetListToToday
		 */
		resetListToToday: function () {
			return modes.list.resetToToday();
		},

		/**
		 * @method updateTimeList
		 */
		updateTimeList: function () {
			modes.list.forceRefresh();
		},

		hideSummary: controller.hideSummary,
		showSummary: controller.showSummary,
		beforeEventChange: controller.beforeEventChange,
		updateSummary: controller.updateSummary,
		updateSummaryTitle: controller.updateSummaryTitle,
		updateCatchupTitle: controller.updateCatchupTitle,
		showOptionsMenu: controller.showOptionsMenu,
		getViewableChannelList: controller.getViewableChannelList,
		getSelectChannelIndex: controller.getSelectChannelIndex,
		selectChannel: controller.selectChannel,
		selectPreviousChannel: controller.selectPreviousChannel,
		selectNextChannel: controller.selectNextChannel,
		selectNextPageChannel: controller.selectNextPageChannel,
		selectPreviousPageChannel: controller.selectPreviousPageChannel,
		navigateToContext: controller.navigateToContext,
		itemSelected: controller.itemSelected,
		isRememberEventOn: controller.isRememberEventOn,
		setRememberEventOn: controller.setRememberEventOn,
		setRememberEventOff: controller.setRememberEventOff,
		resetListNavigation: function () {
			modes.list.resetListNavigation();
		},
		updateVoltarButton: controller.updateVoltarButton
	};
};
