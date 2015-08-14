/**
 * GridController
 * @module ListGuide
 * @class GridController
 * @constructor
 * @requires $N.app.constants
 * @requires $N.gui.Grid
 * @requires $N.app.StandardTimers
 * #depends common/gui/Grid.js
 * @param {Object} controller
 * @param {Object} channelView
 */
var GridController = function (controller, view) {
	var $N = window.parent.$N,
		log = new $N.apps.core.Log("ListGuide", "GridController"),
		constants = $N.app.constants,
		catchUpHelper = $N.app.CatchUpHelper,
		generalUtil = $N.app.GeneralUtil,
		keys = $N.apps.core.KeyInterceptor.getKeyMap(),
		gridList = null,
		gridDateTitle = null,
		previewComplete = false,
		isSecondaryFocus = false,
		inMovingToScheduledEvent = false,
		exitCallback = function () {},
		eventHighlightedCallback = function () {},
		channelData = [],
		currentWindowServiceIdArray = [],
		currentWindowStartTime,
		_gridStartTime,
		currentlySelectedTime,
		updateEventsBackgroundTime = 0,
		earliestEventTime,
		latestEventTime,
		eventUpdateTimer,
		minuteTimer = $N.app.StandardTimers.minuteTimer,
		_now = Date.now(),
		keyRepeatCount = 0,
		lastRenderedWindow,
		FAST_SCROLL_WINDOW_LENGTH = constants.THIRTY_MINUTES_IN_MS,
		TIME_INTERVAL = constants.THIRTY_MINUTES_IN_MS,
		TIME_LABEL_TOTAL = 5,
		CURRENT_WINDOW_LENGTH = constants.THIRTY_MINUTES_IN_MS * TIME_LABEL_TOTAL,
		KEY_REPEAT_RATE = 2,
		KEY_RELEASE_SUFFIX = $N.app.constants.KEY_RELEASE_SUFFIX;

	/**
	 * @method getCurrentWindowEndTime
	 * @return {Number} timeList
	 */
	function getCurrentWindowEndTime() {
		return currentWindowStartTime + CURRENT_WINDOW_LENGTH;
	}

	/**
	 * @method getEarliestEventTime
	 * @return {Number} earliest event time
	 */
	function getEarliestEventTime() {
		var firstWindowStartTime = Date.now();
		return $N.app.FeatureManager.isCatchUpEnabled() ? earliestEventTime || 0 : firstWindowStartTime;
	}

	/**
	 * @method getEarliestEventTimeFlooredToHalfHour
	 * @return {Number} earliest event time
	 */
	function getEarliestEventTimeFlooredToHalfHour() {
		var firstWindowStartTime = Date.now() - Date.now() % TIME_INTERVAL;
		return $N.app.FeatureManager.isCatchUpEnabled() ? earliestEventTime || 0 : firstWindowStartTime;
	}

	/**
	 * @method getLatestEventTime
	 * @return {Number} earliest event time
	 */
	function getLatestEventTime() {
		return latestEventTime || 0;
	}

	/**
	 * @method isInCurrentWindow
	 * @param {Number} time
	 */
	function isInCurrentWindow(time) {
		return (time >= currentWindowStartTime && time < getCurrentWindowEndTime());
	}

	/**
	 * @method isEventInCurrentWindow
	 * @param {Object} event
	 * @return {Boolean}
	 */
	function isEventInCurrentWindow(event) {
		return isInCurrentWindow(event.startTime) || isInCurrentWindow(event.endTime);
	}

	/**
	 * @method isCurrentWindowInCatchup
	 */
	function isCurrentWindowInCatchup() {
		return (Date.now() >= currentWindowStartTime + TIME_INTERVAL);
	}

	/**
	 * @method _floorTimeToHalfHour
	 * @private
	 * @param {Number} time
	 * @return {Number}
	 */
	function _floorTimeToHalfHour(time) {
		return time - (time % constants.THIRTY_MINUTES_IN_MS);
	}

	/**
	 * @method _floorTimeToWindowSize
	 * @private
	 * @param {Number} time
	 * @return {Number}
	 */
	function _floorTimeToWindowSize(time) {
		return time - (time % CURRENT_WINDOW_LENGTH);
	}

	/**
	 * @method _updateGridStartTime
	 */
	function _updateGridStartTime() {
		log("_updateGridStartTime", "Enter & Exit");
		_gridStartTime =  _floorTimeToHalfHour(Date.now());
	}

	/**
	 * @method updateWindowStartTime
	 */
	function updateWindowStartTime() {
		log("updateWindowStartTime", "Enter & Exit");
		var gridOffset = _gridStartTime - _floorTimeToWindowSize(_gridStartTime);
		currentWindowStartTime = _floorTimeToWindowSize(currentWindowStartTime) + gridOffset;
	}

	/**
	 * @method updateTimeBarArrows
	 */
	function updateTimeBarArrows() {
		if (currentWindowStartTime <= getEarliestEventTime()) {
			view.timeBar.leftArrow.hide();
		} else {
			view.timeBar.leftArrow.show();
		}
		if (getLatestEventTime() <= getCurrentWindowEndTime()) {
			view.timeBar.rightArrow.hide();
		} else {
			view.timeBar.rightArrow.show();
		}
	}

	/**
	 * @method updateTimeBarLabel
	 * @param {Number} timeValue
	 * @param {Number} timeBarIndex
	 */
	function updateTimeBarLabel(timeValue, timeBarIndex) {
		var timeBarItem = view.timeBar['colTime' + (timeBarIndex + 1)],
			labelTime = new Date(timeValue);
		if ((_now - TIME_INTERVAL) <= timeValue) {
			timeBarItem.setCssClass("gridTime");
		} else {
			timeBarItem.setCssClass("gridTimePast");
		}
		timeBarItem.setText(generalUtil.padNumberWithZeroes(labelTime.getHours(), 2) + ':' + generalUtil.padNumberWithZeroes(labelTime.getMinutes(), 2));
		timeBarItem.show();
	}

	/**
	 * @method updateTimeLabels
	 */
	function updateTimeLabels() {
		log("updateTimeLabels", "Enter");
		var initTime = _floorTimeToHalfHour(currentWindowStartTime),
			i;

		for (i = 0; i < TIME_LABEL_TOTAL; i++) {
			updateTimeBarLabel(initTime + i * TIME_INTERVAL, i);
		}
		updateTimeBarArrows();
		log("updateTimeLabels", "Exit");
	}

	/**
	 * @method getSelectedItem
	 * @public
	 * @return {Object}
	 */
	function getSelectedItem() {
		return gridList.getSelectedObject().getSelectedItem();
	}

	/**
	 * @method setExitCallback
	 * @public
	 * @param {Function} callback
	 */
	function setExitCallback(callback) {
		exitCallback = callback;
	}

	/**
	 * @method updateViewableChannelList
	 * @private
	 */
	function updateViewableChannelList(data) {
		log("updateViewableChannelList", "Enter");
		var channelsLength,
			i;
		channelData = data || controller.getViewableChannelList();
		channelsLength = channelData.length;
		currentWindowServiceIdArray = [];
		for (i = 0; i < channelsLength; i++) {
			currentWindowServiceIdArray.push(channelData[i].serviceId);
		}
		log("updateViewableChannelList", "Exit");
	}

	/**
	 * @method updateEarliestAndLatestEventTime
	 * @private
	 */
	function updateEarliestAndLatestEventTime() {
		log("updateEarliestAndLatestEventTime", "Enter");
		var latestEventTimeCallback = function (results) {
			var earliestEventTimeCallback = function (results) {
				earliestEventTime = results.startTime;
				log("earliestEventTime", earliestEventTime);
			};

			latestEventTime = results.endTime;
			log("latestEventTime", latestEventTime);
			controller.updateEarliestEventTime(earliestEventTimeCallback);
		};
		controller.updateLatestEventTime(latestEventTimeCallback);
		log("updateEarliestAndLatestEventTime", "Exit");
	}

	/**
	 * @method setEventUpdateTimer
	 * @private
	 */
	function setEventUpdateTimer() {
		var updateTime = (earliestEventTime && latestEventTime) ? constants.HOUR_IN_MS : constants.SECOND_IN_MS * 10;
		if (eventUpdateTimer) {
			clearTimeout(eventUpdateTimer);
		}
		eventUpdateTimer = setTimeout(function () {
			updateEarliestAndLatestEventTime();
			setEventUpdateTimer();
		}, updateTime);
	}

	/**
	 * @method updateTimeIndicator
	 * @private
	 */
	function updateTimeIndicator() {
		log("updateTimeIndicator", "Enter");
		var xPosOfIndicator = 0;
		if (isInCurrentWindow(_now)) {
			xPosOfIndicator = Math.round((_now - currentWindowStartTime) / CURRENT_WINDOW_LENGTH * gridList._width);
			view.currentTimeIndicator.setX(xPosOfIndicator);
			view.currentTimeIndicator.show();
		} else {
			view.currentTimeIndicator.hide();
		}
		log("updateTimeIndicator", "Exit");
	}

	/**
	 * @method defocusGrid
	 * @private
	 */
	function defocusGrid() {
		view.currentTimeIndicator.hide();
		gridList.setOpacity(0.2);
		gridList.defocus();
	}

	/**
	 * @method updateLastRenderedWindow
	 * @description Makes a note of the window rendered via drawGrid
	 * @private
	 */
	function updateLastRenderedWindow() {
		lastRenderedWindow = {
			startTime: currentWindowStartTime,
			serviceId: currentWindowServiceIdArray[0]
		};
	}

	/**
	 * @method hasWindowMoved
	 * @return {Boolean} Has the window moved since the last time drawGrid was called
	 * @private
	 */
	function hasWindowMoved() {
		if (!lastRenderedWindow || lastRenderedWindow.startTime !== currentWindowStartTime || lastRenderedWindow.serviceId !== currentWindowServiceIdArray[0]) {
			return true;
		}
		return false;
	}

	/**
	 * @method getFirstNonCatchupEventIndex
	 * @param {Object} row
	 * @return {Number}
	 */
	function getFirstNonCatchupEventIndex(row) {
		var i,
			rowLength = row.length;
		for (i = 0; i < rowLength; i++) {
			if (_now < row[i].endTime) {
				break;
			}
		}
		return i;
	}

	/**
	 * @method getEventIndexBySelectedTime
	 * @param {Object} row
	 * @return {Number}
	 */
	function getEventIndexBySelectedTime(row, firstEventIndex, isFocusOnLiveEvent) {
		var i,
			rowLength = row.length;
		for (i = firstEventIndex; i < rowLength; i++) {
			if (row[i].endTime > currentlySelectedTime) {
				return i + 1;
			}
			if ((currentlySelectedTime <= _now)
					&& (currentWindowStartTime + constants.THIRTY_MINUTES_IN_MS >= _now)
					&& isFocusOnLiveEvent
					&& row[i].endTime >= _now) {
				return i + 1;
			}
		}
		return i;
	}

	/**
	 * @method drawGrid
	 * @private
	 * @param {Boolean} ignoreHighlight - True if we should prevent highlight from being called
	 * @param {Function} callback (optional) - callback function
	 */
	function drawGrid(ignoreHighlight, callback) {
		log("drawGrid", "Enter");
		var drawGridCallback = function (data, startCacheTime) {
			log("drawGridCallback", "Enter");
			if (startCacheTime === currentWindowStartTime) {
				gridList.setData(data);
				updateEventsBackgroundTime = 0;
				gridList.displayData(ignoreHighlight);
				gridList.setOpacity(1.0);
				updateTimeIndicator();
				if (callback) {
					callback();
				}
			} else {
				log("drawGridCallback", "Discard the cached event data.");
			}
			log("drawGridCallback", "Exit");
		};
		_now = Date.now();
		updateWindowStartTime();
		updateTimeLabels();
		$N.app.epgUtil.fetchGridEventsByWindow(currentWindowServiceIdArray, currentWindowStartTime, getCurrentWindowEndTime(), drawGridCallback);
		updateLastRenderedWindow();
		log("drawGrid", "Exit");
	}

	/**
	 * @method stopUpdateGridList
	 */
	function stopUpdateGridList() {
		log("stopUpdateGridList", "Enter");
		minuteTimer.disable("GridTimer");
		log("stopUpdateGridList", "Exit");
	}

	/**
	 * @method updateGridList
	 * @private
	 */
	function updateGridList() {
		log("updateGridList", "Enter");
		var item = null;
		updateWindowStartTime();
		if (gridList.hasFocus()) {
			item = getSelectedItem();
			if (item && item.endTime && item.endTime < currentWindowStartTime) {
				gridList.getSelectedObject()._list.selectNext();
			}
			drawGrid();
		} else {
			drawGrid(true);
		}
		log("updateGridList", "Exit");
	}

	/**
	 * @method startUpdateGridList
	 */
	function startUpdateGridList() {
		log("startUpdateGridList", "Enter");
		minuteTimer.enable("GridTimer");
		log("startUpdateGridList", "Exit");
	}

	/**
	 * @method getWindowStartTimeForNow
	 * @returns {Number}
	 */
	function getWindowStartTimeForNow() {
		log("getWindowStartTimeForNow", "Enter & Exit");
		_updateGridStartTime();
		return _floorTimeToHalfHour(Date.now());
	}

	/**
	 * method gridUpdate
	 */
	function gridUpdate() {
		log("gridUpdate", "Enter");
		_now = Date.now();
		if (isInCurrentWindow(_now)) {
			if (_now > currentWindowStartTime + TIME_INTERVAL) {
				_updateGridStartTime();
				currentWindowStartTime = getWindowStartTimeForNow();
				updateGridList();
			} else {
				updateTimeIndicator();
			}
		}
		log("gridUpdate", "Exit");
	}

	/**
	 * @method setSecondaryFocus
	 */
	function setSecondaryFocus() {
		log("setSecondaryFocus", "Enter");
		var obj = gridList.getSelectedObject(),
			item = null;
		if (obj) {
			item = obj._list.getSelectedObject();
			if (item) {
				item.setSecondaryFocusOn();
			}
			stopUpdateGridList();
		}
		isSecondaryFocus = true;
		log("setSecondaryFocus", "Exit");
	}

	/**
	 * @method unsetSecondaryFocus
	 */
	function unsetSecondaryFocus() {
		log("unsetSecondaryFocus", "Enter");
		var obj = gridList.getSelectedObject(),
			item = null;
		if (obj) {
			item = obj._list.getSelectedObject();
			if (item) {
				item.setSecondaryFocusOff();
			}
		}
		isSecondaryFocus = false;
		log("unsetSecondaryFocus", "Exit");
	}

	/**
	 * @method update
	 * @public
	 */
	function update() {
		log("update", "Enter");
		if (gridList.hasFocus()) {
			drawGrid();
		} else {
			drawGrid(true);
		}
		if (isSecondaryFocus) {
			setSecondaryFocus();
		}
		log("update", "Exit");
	}

	/**
	 * @method updateDateTitle
	 * @private
	 * @param {Object} startTime
	 */
	function updateDateTitle(startTime) {
		log("updateDateTitle", "Enter");
		var title,
			timeZoneOffset = (new Date()).getTimezoneOffset() * constants.MINUTE_IN_MS,
			currentTime = Date.now(),
			currentDay = currentTime - ((currentTime - timeZoneOffset) % constants.DAY_IN_MS),
			eventDay;
		eventDay = startTime - ((startTime - timeZoneOffset) % constants.DAY_IN_MS);
		if (eventDay === currentDay) {
			title = controller.getString("today");
		} else if ((eventDay - currentDay) === constants.DAY_IN_MS) {
			title = controller.getString("tomorrow");
		} else if ((currentDay - eventDay) === constants.DAY_IN_MS) {
			title = controller.getString("yesterday");
		} else {
			title = $N.apps.util.Util.formatDate(new Date(startTime), "DY DD/MM", null, null, null, controller.getString("shortDays"));
		}
		if (gridDateTitle.getText() !== title) {
			gridDateTitle.setText(title);
		}
		log("updateDateTitle", "Exit");
	}

	/**
	 * @method updateCatchupTitle
	 * @private
	 * @param {Number} endTime
	 * @return void
	 */
	function updateCatchupTitle(endTime) {
		log("updateCatchupTitle", "Enter");
		controller.updateCatchupTitle(Date.now() >= endTime);
		log("updateCatchupTitle", "Exit");
	}

	/**
	 * @method itemHighlightedImmediate
	 * @private
	 * @param {Object} data
	 */
	function itemHighlightedImmediate(data) {
		log("itemHighlightedImmediate", "Enter");
		if (data) {
			updateDateTitle(data.startTime);
		}
		log("itemHighlightedImmediate", "Exit");
	}

	/**
	 * @method itemHighlighted
	 * @private
	 * @param {Object} data
	 */
	function itemHighlighted(data) {
		log("itemHighlighted", "Enter");
		if (data) {
			if (!inMovingToScheduledEvent) {
				eventHighlightedCallback(data, channelData[gridList.getSelectedItemIndex() - 1]);
			} else {
				currentlySelectedTime = data.startTime;
			}
			updateCatchupTitle(data.endTime);
			controller.updateVoltarButton();
		}
		log("itemHighlighted", "Exit");
	}

	/**
	 * @method initialise
	 * @public
	 */
	function initialise(callback) {
		log("initialise", "Enter");
		var i,
			arrayLength;
		currentWindowStartTime = Date.now();
		_updateGridStartTime();
		gridDateTitle = view.gridDateTitle;
		gridList = view.gridList;
		gridList.setDataMapper({
			getTitle: function (obj) {
				if (obj && $N.app.ParentalControlUtil.isChannelOrProgramLocked(obj)) {
					if ($N.app.genreUtil.isAdultChannel(obj)) {
						return controller.getString("adultContent");
					}
				}
				return obj.title || controller.getString("noEventTitle");
			},
			getSubtitle: function (obj) {
				if (obj) {
					if ($N.app.ParentalControlUtil.isChannelOrProgramLocked(obj)) {
						if ($N.app.genreUtil.isAdultChannel(obj)) {
							return "";
						}
					}
					if (obj.displaySeasonEpisode) {
						return $N.app.epgUtil.getSeasonEpisodeAbbreviation(obj.seriesId, obj.episodeId) || obj.subtitle || "";
					}
				}
				return "";
			},
			getWindowStartTime: function () {
				return currentWindowStartTime;
			},
			getStartTime: function (obj) {
				return obj.overlapStartTime || obj.startTime;
			},
			getEndTime: function (obj) {
				return obj.endTime;
			},
			getEventId: function (obj) {
				return obj.eventId || "";
			},
			getUniqueEventId: function (obj) {
				return obj.uniqueEventId || "";
			},
			isEventOnNow: function (obj) {
				var now = Date.now();
				return (obj.startTime <= now && obj.endTime > now);
			},
			markForUpdatingEventBackgroundAsTimePasses: function (obj) {
				if (this.isEventOnNow(obj)) {
					if (updateEventsBackgroundTime === 0) {
						updateEventsBackgroundTime = obj.endTime;
					} else {
						updateEventsBackgroundTime = Math.min(updateEventsBackgroundTime, obj.endTime);
					}
				}
			},
			isEventBlocked: function (obj) {
				var service;
				if (obj && obj.title && obj.title === controller.getString("noEventTitle")) {
					return true;
				}
				service = $N.app.epgUtil.getServiceById(obj.serviceId);
				if (obj && ($N.app.ParentalControlUtil.isProgramLocked(obj) || $N.app.ParentalControlUtil.isChannelLocked(service))) {
					return true;
				}
				return false;
			},
			isInPast: function (obj) {
				return obj.endTime < Date.now();
			},
			isCatchUp: function (obj) {
				return this.isInPast(obj) && obj.isCatchUp;
			}
		});

		gridList.initialise();

		gridList.doForAllItems(function (obj) {
			//these functions are passed through ListLinker.js
			obj.setItemHighlightedImmediateCallback(itemHighlightedImmediate);
			obj.setItemHighlightedCallback(itemHighlighted);
			obj.setItemSelectedCallback(controller.itemSelected);
			obj.setFocusCallback(function (focusRow) {
				_now = Date.now();
				var firstEventIndex = 0,
					eventIndex,
					currentController = controller.getController();

				if (!controller.isRememberEventOn() && !isCurrentWindowInCatchup()) {
					firstEventIndex = getFirstNonCatchupEventIndex(focusRow);
				}

				eventIndex = getEventIndexBySelectedTime(focusRow, firstEventIndex, currentController.isFocusOnLiveEvent());

				obj.selectItemAtIndex(eventIndex);

			});
			obj.setGridRowItemCallback(function (data) {
				controller.updateSummary(data, channelData[gridList.getSelectedItemIndex() - 1]);
			});
			obj.setDataValidationFunction(function (obj) {
				return (obj.startTime <= Date.now() && obj.endTime > Date.now());
			});
		});

		gridList.addFadeAnimation();
		setExitCallback(callback);
		updateEarliestAndLatestEventTime();
		minuteTimer.register("GridTimer", gridUpdate);
		setEventUpdateTimer();
		log("initialise", "Exit");
	}

	/**
	 * @method listFocusByEventId
	 * @param {Object} list
	 * @param {Number} scheduledEventId
	 */
	function listFocusByEventId(list, scheduledEventId) {
		var listLen = list._items.length,
			item,
			i;
		for (i = 0; i < listLen; i += 1) {
			item = list._items[i];
			if (item && item._data) {
				if (item._data.eventId === scheduledEventId) {
					break;
				} else {
					list.selectNext();
				}
			}
		}
		controller.setRememberEventOff();
		list.focus();

	}

	/**
	 * @method previewCallback
	 * @public
	 * @param {Object} data
	 * @param {Object} scheduledEvent
	 */
	function previewCallback(data, scheduledEvent) {
		log("previewCallback", "Enter");
		if (controller.isTimeListMode()) {
			return;
		}
		inMovingToScheduledEvent = true;
		gridList.selectItemAtIndex(controller.getSelectChannelIndex());
		controller.showSummary();
		view.show();
		if (scheduledEvent) {
			setTimeout(function () {
				var listObj = gridList.getSelectedObject();
				controller.selectChannel();
				gridList.selectItemAtIndex(controller.getSelectChannelIndex());
				listFocusByEventId(listObj._list, scheduledEvent.eventId);
				inMovingToScheduledEvent = false;
			}, 1);
		} else {
			inMovingToScheduledEvent = false;
			gridList.focus();
		}
		log("previewCallback", "Exit");
	}

	/**
	 * @method updateDateAndTimeLabels
	 * @private
	 */
	function updateDateAndTimeLabels() {
		log("updateDateAndTimeLabels", "Enter");
		updateTimeLabels();
		updateDateTitle(currentWindowStartTime);
		log("updateDateAndTimeLabels", "Exit");
	}

	/**
	 * @method getWindowStartTimeForEvent
	 * @param {Object} scheduledEvent
	 * @returns {Number}
	 */
	function getWindowStartTimeForEvent(scheduledEvent) {
		log("getWindowStartTimeForEvent", "Enter & Exit");
		_updateGridStartTime();
		var flooredTime = _floorTimeToHalfHour(scheduledEvent.startTime),
			eventTimeFromGridStart = flooredTime - _gridStartTime;

		return flooredTime - (eventTimeFromGridStart % CURRENT_WINDOW_LENGTH);
	}

	/**
	 * @method getWindowStartTimeForNavigation
	 * @param {Number} time
	 * @returns {Number}
	 */
	function getWindowStartTimeForNavigation(time) {
		log("getCurrentWindowStartTimeForNavigation", "Enter & Exit");
		_updateGridStartTime();
		var eventTimeFromGridStart = _gridStartTime - time;
		return time + (eventTimeFromGridStart % CURRENT_WINDOW_LENGTH);
	}

	/**
	 * @method preview
	 * @public
	 * @param {Object} data
	 * @param {Object} scheduledEvent
	 * @param {Boolean} forceRedraw
	 */
	function preview(data, scheduledEvent, forceRedraw) {
		log("preview", "Enter");
		var noChannelData = !channelData.length,
			serviceIdChanged = channelData.length &&
				(channelData[0].serviceId !== data[0].serviceId || channelData.length !== data.length),
			resetTimeForEvent = (scheduledEvent && (!controller.isRememberEventOn() || !isEventInCurrentWindow(scheduledEvent)));

		if (noChannelData || serviceIdChanged || forceRedraw) {
			if (resetTimeForEvent) {
				currentWindowStartTime = getWindowStartTimeForEvent(scheduledEvent);
			} else if (forceRedraw) {
				currentWindowStartTime = getWindowStartTimeForNow();
			}
			currentlySelectedTime = currentWindowStartTime;
			updateViewableChannelList(data);
			drawGrid(true, function () {
				previewCallback(data, scheduledEvent);
			});
		} else {
			// For a bug causing error focus when DCE to first channel in the same window.
			gridList.defocus();
			gridList.selectItemAtIndex(controller.getSelectChannelIndex());
			gridList.focus();
		}
		previewComplete = true;
		log("preview", "Exit");
	}

	/**
	 * @method focus
	 * @public
	 */
	function focus() {
		log("focus", "Enter");
		gridList.focus();
		gridList.getSelectedObject().select(true);
		view.timeBar.setOpacity(1);
		controller.getController().getStates().channelList.hideUpAndDownArrows();
		startUpdateGridList();
		log("focus", "Exit");
	}

	/**
	 * @method defocus
	 * @public
	 */
	function defocus() {
		log("defocus", "Enter");
		view.timeBar.setOpacity(0.3);
		gridList.defocus();
		controller.getController().getStates().channelList.hideUpAndDownArrows();
		log("defocus", "Exit");
	}

	/**
	 * @method activate
	 * @public
	 * @param {Object} data
	 */
	function activate(data) {
		log("activate", "Enter");
		if (!previewComplete) {
			preview(data);
		}
		focus();
		log("activate", "Exit");
	}

	/**
	 * @method passivate
	 * @public
	 * @param {Boolean} leaveAsPreview
	 */
	function passivate(leaveAsPreview) {
		log("passivate", "Enter");
		defocus();
		controller.getController().getStates().channelList.cancelEntryForDirectChannelEntry();
		if (!leaveAsPreview) {
			view.hide();
			previewComplete = false;
		}
		channelData = [];
		gridDateTitle.setText("");
		controller.setShouldUpdateTimeWindow(true);
		log("passivate", "Exit");
	}

	/**
	 * @method setEventHighlightedCallback
	 */
	function setEventHighlightedCallback(callback) {
		eventHighlightedCallback = callback;
	}

	/**
	 * @method focusOnNowEvent
	 * @public
	 */
	function focusOnNowEvent() {
		log("focusOnNowEvent", "Enter");
		var data = channelData;
		channelData = [];
		previewComplete = false;
		preview(data, null, true);
		focus();
		startUpdateGridList();
		log("focusOnNowEvent", "Exit");
	}

	/**
	 * @method isKeyRepeatReady
	 * @return {Boolean} isKeyRepeatReady - Are we ready to process another key repeat
	 * @private
	 */
	function isKeyRepeatReady() {
		if (keyRepeatCount % KEY_REPEAT_RATE === 0) {
			return true;
		}
		return false;
	}

	/**
	 * @method updateKeyRepeatCount
	 * @param {Boolean} repeats Are there key repeats
	 * @private
	 */
	function updateKeyRepeatCount(repeats) {
		if (repeats) {
			keyRepeatCount++;
		} else {
			keyRepeatCount = 0;
		}
	}

	/**
	 * @method handleFFWKey
	 * @private
	 */
	function handleFFWKey() {
		log("handleFFWKey", "Enter");
		var newWindowStartTime,
			newWindowEndTime,
			latestEventEndTime = getLatestEventTime();
		if (isKeyRepeatReady() && getCurrentWindowEndTime() < latestEventEndTime) {
			newWindowStartTime = currentWindowStartTime + constants.DAY_IN_MS;
			newWindowEndTime = newWindowStartTime + CURRENT_WINDOW_LENGTH;
			if (newWindowEndTime < latestEventEndTime) {
				currentWindowStartTime = newWindowStartTime;
			} else {
				currentWindowStartTime += (Math.floor(latestEventEndTime - getCurrentWindowEndTime()) / CURRENT_WINDOW_LENGTH) * CURRENT_WINDOW_LENGTH;
			}
			currentWindowStartTime = getWindowStartTimeForNavigation(newWindowStartTime);
			updateDateAndTimeLabels();
			gridList.defocus();
		}
		log("handleFFWKey", "Exit");
	}

	/**
	 * @method handleREWKey
	 * @private
	 */
	function handleREWKey() {
		log("handleREWKey", "Enter");
		var newWindowStartTime,
			earliestEventTime = getEarliestEventTimeFlooredToHalfHour();
		if (isKeyRepeatReady() && currentWindowStartTime > earliestEventTime) {
			newWindowStartTime = currentWindowStartTime - constants.DAY_IN_MS;
			if (newWindowStartTime >= earliestEventTime) {
				currentWindowStartTime = newWindowStartTime;
			} else {
				currentWindowStartTime = earliestEventTime;
			}
			currentWindowStartTime = getWindowStartTimeForNavigation(newWindowStartTime);
			updateDateAndTimeLabels();
			gridList.defocus();
		}
		log("handleREWKey", "Exit");
	}

	/**
	 * @method handleLeftKey
	 * @return {Boolean} button press handled
	 * @private
	 */
	function handleLeftKey(windowLength) {
		currentWindowStartTime = currentWindowStartTime - windowLength;
		updateDateAndTimeLabels();
		gridList.defocus();
		return true;
	}

	/**
	 * @method handleRightKey
	 * @return {Boolean} button press handled
	 * @private
	 */
	function handleRightKey(windowLength) {
		if (getCurrentWindowEndTime() < getLatestEventTime()) {
			currentWindowStartTime = currentWindowStartTime + windowLength;
			updateDateAndTimeLabels();
			gridList.defocus();
			return true;
		}
		return false;
	}

	/**
	 * @method handleUpKey
	 * @private
	 */
	function handleUpKey() {
		if (controller.selectPreviousChannel()) {
			updateViewableChannelList();
			gridList.defocus();
		}
	}

	/**
	 * @method handleDownKey
	 * @private
	 */
	function handleDownKey() {
		if (controller.selectNextChannel()) {
			updateViewableChannelList();
			gridList.defocus();
		}
	}

	/**
	 * @method handleChanUpKey
	 * @private
	 */
	function handleChanUpKey() {
		if (isKeyRepeatReady() && (controller.selectPreviousPageChannel())) {
			updateViewableChannelList();
			gridList.defocus();
		}
	}

	/**
	 * @method handleChanDownKey
	 * @private
	 */
	function handleChanDownKey() {
		if (isKeyRepeatReady() && (controller.selectNextPageChannel())) {
			updateViewableChannelList();
			gridList.defocus();
		}
	}

	/**
	 * @method handleKeyPressed
	 * @private
	 */
	function handleKeyPressed(key, repeats) {
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;
		switch (key) {
		case keys.KEY_LEFT:
			handled = handleLeftKey(repeats ? FAST_SCROLL_WINDOW_LENGTH : CURRENT_WINDOW_LENGTH);
			break;
		case keys.KEY_RIGHT:
			handled = handleRightKey(repeats ? FAST_SCROLL_WINDOW_LENGTH : CURRENT_WINDOW_LENGTH);
			break;
		case keys.KEY_UP:
			handleUpKey();
			handled = true;
			break;
		case keys.KEY_DOWN:
			handleDownKey();
			handled = true;
			break;
		case keys.KEY_CHAN_UP:
			handleChanUpKey();
			handled = true;
			break;
		case keys.KEY_CHAN_DOWN:
			handleChanDownKey();
			handled = true;
			break;
		case keys.KEY_FFW:
			handleFFWKey();
			handled = true;
			break;
		case keys.KEY_REW:
			handleREWKey();
			handled = true;
			break;
		}

		return handled;
	}

	/**
	 * @method handleKeyReleased
	 * @private
	 */
	function handleKeyReleased(key) {
		var keys = $N.apps.core.KeyInterceptor.getKeyMap();

		switch (key) {
		case (keys.KEY_LEFT + KEY_RELEASE_SUFFIX):
		case (keys.KEY_RIGHT + KEY_RELEASE_SUFFIX):
		case (keys.KEY_FFW + KEY_RELEASE_SUFFIX):
		case (keys.KEY_REW + KEY_RELEASE_SUFFIX):
			if (hasWindowMoved()) {
				drawGrid(true, function () {
					gridList.focus();
				});
			}
			return true;
		case (keys.KEY_UP + KEY_RELEASE_SUFFIX):
		case (keys.KEY_DOWN + KEY_RELEASE_SUFFIX):
		case (keys.KEY_CHAN_UP + KEY_RELEASE_SUFFIX):
		case (keys.KEY_CHAN_DOWN + KEY_RELEASE_SUFFIX):
			if (hasWindowMoved()) {
				drawGrid(true, function () {
					gridList.selectRowAtIndex(controller.getSelectChannelIndex(), true);
					gridList.focus();
				});
			}
			return true;
		}
	}

	/**
	 * @method _selectedItemHasLeftArrow
	 * @private
	 * @return {Boolean}
	 */
	function _selectedItemHasLeftArrow() {
		return (getSelectedItem().startTime < currentWindowStartTime);
	}

	/**
	 * @method _selectedItemHasRightArrow
	 * @private
	 * @return {Boolean}
	 */
	function _selectedItemHasRightArrow() {
		return (getSelectedItem().endTime > getCurrentWindowEndTime());
	}

	/**
	 * @method navigationImmediate
	 * @private
	 * @param {String} key
	 */
	function navigationImmediate(key) {
		switch (key) {
		case keys.KEY_LEFT:
			if (!_selectedItemHasLeftArrow()) {
				controller.beforeEventChange();
			}
			break;
		case keys.KEY_RIGHT:
			if (!_selectedItemHasRightArrow()) {
				controller.beforeEventChange();
			}
			break;
		case keys.KEY_UP:
		case keys.KEY_DOWN:
			controller.beforeEventChange();
			break;
		}
	}

	/**
	 * @method keyHandler
	 * @public
	 * @param {String} key
	 * @return {Boolean} handled
	 */
	function keyHandler(key, repeats) {
		log("keyHandler", "Enter");
		var selectedItem = null,
			handled = false;

		navigationImmediate(key);
		_now = Date.now();

		$N.app.MemoryUtil.setOrUpdateGarbageCollectTimeoutAndInterval();

		if (controller.getController().directChannelEntryHandler(key, repeats)) {
			log("keyHandler", "Exit because of directChannelEntryHandle.");
			controller.setShouldUpdateTimeWindow(false);
			return true;
		}

		if (gridList.keyHandler(key) && (key === keys.KEY_LEFT || key === keys.KEY_RIGHT)) {
			selectedItem = getSelectedItem();
			if (selectedItem) {
				currentlySelectedTime = Math.max(selectedItem.startTime, currentWindowStartTime);
			}
			log("keyHandler", "Exit because of gridList handled LEFT or RIGHT.");
			return true;
		}

		handled = handleKeyPressed(key, repeats) || handleKeyReleased(key);

		if (repeats && handled && gridList.getOpacity() === 1.0 && hasWindowMoved()) {
			defocusGrid();
		}

		updateKeyRepeatCount(repeats);

		log("keyHandler", "Exit");
		return handled;
	}

	/**
	 * @method isCatchupEvent
	 */
	function isCatchupEvent(event) {
		log("isCatchupEvent", Date.now() >= event.endTime);
		return (Date.now() >= event.endTime);
	}

	return {
		initialise: initialise,
		preview: preview,
		activate: activate,
		passivate: passivate,
		focus: focus,
		update: update,
		updateIcons: function () {
			gridList.updateIcons();
		},
		defocus: defocus,
		keyHandler: keyHandler,
		getSelectedItem: getSelectedItem,
		setSecondaryFocus: setSecondaryFocus,
		unsetSecondaryFocus: unsetSecondaryFocus,
		focusOnNowEvent: focusOnNowEvent,
		stopUpdateTimer: stopUpdateGridList,
		setExitCallback: setExitCallback,
		setEventHighlightedCallback: setEventHighlightedCallback,
		isCatchupEvent: isCatchupEvent
	};
};
