/**
 * TimeList is a sub-state of list guide and is a view component that
 * scrolls a list of times that links to the channel and event list
 * when a time is highlighted or selected.
 * @module ListGuide
 * @class TimeList
 * @constructor
 * @param {Object} controller
 * @param {Object} channelView
 */
var TimeList = function (controller, view) {
	var $N = window.parent.$N,
		constants = $N.app.constants,
		log = new $N.apps.core.Log("ListGuide", "TimeList"),
		timeList = null,
		eventUtil = $N.app.EventUtil,
		keys = $N.apps.core.KeyInterceptor.getKeyMap(),
		exitCallback = function () {},
		eventHighlightedCallback = function () {},
		visibleItemCount = 8,
		bookmarkPosition = 0,
		bookmarkManager = null,
		previewActive = false,
		timeListItemSelected = false,
		updateService = null,
		updateDayTitle = true,
		isSecondaryFocus = false,
		earliestEventTime = 0,
		latestEventTime = 0,
		highlightEventTime = 0,
		isEventHighlighted = false,
		channelData = null,
		isBlockedAdultTitle = false,
		updateTime = constants.MINUTE_IN_MS,
		timeListItemHeight = 53,
		isLeaveAsPreview = false,
		hasIndexBeenSelected = false,
		loadingImg = null,
		KEY_RELEASE_SUFFIX = $N.app.constants.KEY_RELEASE_SUFFIX,
		KEY_REPEAT_RATE = 2,
		keyRepeatCount = 0,
		timeDataMapper = {
			getText1: function (obj) {
				var date = new Date(obj.startTime);
				return $N.app.DateTimeUtil.getFormattedTimeString(date, constants.TWENTY_FOUR_HOUR_TIME_FORMAT);
			},
			getTitle: function (data) {
				if (isBlockedAdultTitle) {
					return controller.getString("adultContent");
				}
				return data.title;
			},
			isEventOnNow: function (data) {
				return eventUtil.isEventShowingNow(data);
			},
			getRecordingStatus: function (data) {
				return $N.platform.btv.PVRManager.getRecordingStatusByEvent(data);
			},
			isBlockedAdultTitle: function () {
				return isBlockedAdultTitle;
			},
			isInPast: function (obj) {
				return obj.endTime < Date.now();
			},
			isCatchUp: function (obj) {
				return obj.isCatchUp && this.isInPast(obj);
			}
		},
		listNavigation = {
			displayedData: {
				day: 0,
				startTime: 0,
				endTime: 0
			},
			dataDay: 0,
			YESTERDAY: -1,
			TODAY: 0,
			TOMORROW: 1,

			/**
			 * @method getNavigationStartTime
			 */
			getNavigationStartTime: function () {
				return listNavigation.displayedData.startTime + (listNavigation.getMoveDirection() * constants.DAY_IN_MS);
			},

			/**
			 * @method getNavigationEndTime
			 */
			getNavigationEndTime: function () {
				return listNavigation.displayedData.endTime + (listNavigation.getMoveDirection() * constants.DAY_IN_MS);
			},

			/**
			 * @method getMoveDirection
			 */
			getMoveDirection: function () {
				return listNavigation.dataDay - listNavigation.displayedData.day;
			},

			/**
			 * @method isYesterday
			 * @return {Boolean}
			 */
			isYesterday: function () {
				return listNavigation.dataDay === listNavigation.YESTERDAY;
			},

			/**
			 * @method isToday
			 * @return {Boolean}
			 */
			isToday: function () {
				return listNavigation.dataDay === listNavigation.TODAY;
			},

			/**
			 * @method setToYesterday
			 */
			setToYesterday: function () {
				listNavigation.dataDay = listNavigation.YESTERDAY;
			},

			/**
			 * @method setToToday
			 */
			setToToday: function () {
				listNavigation.dataDay = listNavigation.TODAY;
			},

			/**
			 * @method reset
			 */
			reset: function () {
				listNavigation.displayedData = {
					day: 0,
					startTime: 0,
					endTime: 0
				};
				listNavigation.dataDay = listNavigation.TODAY;
			},

			/**
			 * updated the navigation object current start and end time
			 *
			 * @method updateNavigationObject
			 * @private
			 */
			updateNavigationObject: function () {
				var epgData = timeList.getData(),
					epgDataLength = epgData.length;

				listNavigation.displayedData.day = listNavigation.dataDay;
				listNavigation.displayedData.startTime = (epgData[0]) ? epgData[0].startTime : 0;
				listNavigation.displayedData.endTime = (epgData[epgDataLength - 1]) ? epgData[epgDataLength - 1].endTime : 0;
			}
		};

	/* private helper functions */

	/**
	 * @method getEarliestEventTime
	 * @return {Number} earliest event time
	 */
	function getEarliestEventTime() {
		return $N.app.FeatureManager.isCatchUpEnabled() ? earliestEventTime || 0 : Date.now();
	}

	/**
	 * @method getLatestEventTime
	 * @return {Number} earliest event time
	 */
	function getLatestEventTime() {
		return latestEventTime || 0;
	}

	/**
	 * Callback for getting bookmark for catchup event
	 * @method handleCatchupBookmarkResult
	 * @param {Number} position
	 */
	function handleCatchupBookmarkResult(position) {
		bookmarkPosition = position;
	}

	/**
	 * @method hideNoEventInfoLayer
	 */
	function hideNoEventInfoLayer() {
		log("hideNoEventInfoLayer", "Enter & Exit");
		view.noEventInfoLayer.noEventInfoBackground.hide();
		view.noEventInfoLayer.noEventInfoText.hide();
	}

	/**
	 * @method showNoEventInfoLayer
	 * @param {String} showMode
	 */
	function showNoEventInfoLayer(showMode) {
		log("showNoEventInfoLayer", "Enter & Exit");
		var cssClass = (showMode === "FOCUS") ? "timeListItemHighlight" : "timeListItemBackgroundSecondaryFocus";
		view.noEventInfoLayer.noEventInfoBackground.setCssClass(cssClass);
		view.noEventInfoLayer.noEventInfoText.setText(controller.getString("noEventTitle"));
		view.noEventInfoLayer.noEventInfoBackground.show();
		view.noEventInfoLayer.noEventInfoText.show();
	}

	/**
	 * Day n+1: Week day month day/month number (day/date format DAY dd/mm)
	 *
	 * @method updateDateTitle
	 * @private
	 * @return void
	 */
	function updateDateTitle() {
		log("updateDateTitle", "Enter");
		var title,
			interval = controller.getDayInterval(listNavigation.dataDay),
			dateStart = null,
			dateFormat = "DY DD/MM",
			dateLabel = view.timeListDateGroup.timeListDateTitle;
		switch (listNavigation.dataDay) {
		case listNavigation.TODAY:
			title = controller.getString("today");
			break;
		case listNavigation.TOMORROW:
			title = controller.getString("tomorrow");
			break;
		case listNavigation.YESTERDAY:
			title = controller.getString("yesterday");
			break;
		default:
			dateStart = new Date(interval.startTime);
			title = $N.apps.util.Util.formatDate(dateStart, dateFormat, null, null, null, controller.getString("shortDays"));
		}
		dateLabel.setText(title);
		dateLabel.show();
		view.timeListDateGroup.rightArrow.setX(dateLabel.getTrueX() + (dateLabel.getTextLength() * 1.5) + 18);
		log("updateDateTitle", "Exit");
	}

	/**
	 * @method updateArrows
	 * @private
	 */
	function updateArrows(showUpArrow, showDownArrow, showLeftArrow, showRightArrow) {
		log("updateArrows", "Enter");
		view.upArrow.setVisible(showUpArrow);
		view.downArrow.setVisible(showDownArrow);
		view.timeListDateGroup.leftArrow.setVisible(showLeftArrow);
		view.timeListDateGroup.rightArrow.setVisible(showRightArrow);
		log("updateArrows", "Exit");
	}

	/**
	 * @method hideArrows
	 * @private
	 */
	function hideArrows() {
		log("hideArrows", "Enter");
		updateArrows(false, false, false, false);
		log("hideArrows", "Exit");
	}

	/**
	 * Show/hide up, down, left, right arrows according pagination logic
	 *
	 * @method updateControlButtons
	 * @private
	 * @return void
	 */
	function updateControlButtons() {
		log("updateControlButtons", "Enter");
		var epgData = timeList.getData(),
			currentDataStartTime = listNavigation.getNavigationStartTime(),
			currentDataEndTime = listNavigation.getNavigationEndTime(),
			totalPage = 0,
			showUpArrow = false,
			showDownArrow = false,
			showLeftArrow = false,
			showRightArrow = false,
			latestEventEndTime = getLatestEventTime();

		if (updateDayTitle === true) {
			updateDateTitle();
			updateDayTitle = false;
		}

		// We only consider controls for display when not in preview mode
		if (!previewActive) {
			totalPage = Math.ceil(epgData.length / visibleItemCount);

			if ((timeList.getActualSelectedRowIndex() - 1) < totalPage * visibleItemCount) {
				showDownArrow = true;
			}

			if (currentDataEndTime < latestEventEndTime) {
				showRightArrow = true;
				showDownArrow = true;
			}
			if (currentDataStartTime > getEarliestEventTime()) {
				showLeftArrow = true;
				showUpArrow = true;
			}

			// handles last page
			if (currentDataEndTime === latestEventEndTime && timeList.getActualSelectedRowIndex() > ((totalPage - 1) * visibleItemCount)) {
				showDownArrow = false;
			}

			if ((timeList.getActualSelectedRowIndex() - 1) >= visibleItemCount) {
				showUpArrow = true;
			}

			if (listNavigation.dataDay > 0) {
				showUpArrow = true;
				showLeftArrow = true;
			}
		}
		updateArrows(showUpArrow, showDownArrow, showLeftArrow, showRightArrow);
		log("updateControlButtons", "Exit");
	}

	/**
	 * Asynchronously update earliest and last available event times
	 *
	 * @method updateEventTimes
	 * @private
	 * @param {object} data - service
	 * @return void
	 */
	function updateEventTimes(data) {
		log("updateEventTimes", "Enter");
		if (data) {
			controller.updateLatestEventTime(function (results) {
				latestEventTime = results.endTime;
				controller.updateEarliestEventTime(function (results) {
					earliestEventTime = results.startTime;
					updateControlButtons();
				}, data.serviceId);
			}, data.serviceId);
		}
		log("updateEventTimes", "Exit");
	}

	/**
	 * @method updateLoadingImage
	 * @private
	 * @param {Boolean} showLoading - show the loading icon
	 */
	function updateLoadingImage(showLoading) {
		if (showLoading) {
			timeList.hide();
			view.noEventInfoLayer.noEventInfoBackground.hide();
			view.noEventInfoLayer.noEventInfoText.hide();
			loadingImg.show();
		} else {
			timeList.show();
			loadingImg.hide();
		}
	}

	/**
	 * @method isEpgDataUnchanged
	 * @private
	 * @param {Array} epgData
	 * @return {Boolean}
	 */
	function isEpgDataUnchanged(epgData) {
		return (JSON.stringify(epgData) === JSON.stringify(timeList.getData()));
	}

	/**
	 * @method checkIfBlockedAdultTitle
	 */
	function checkIfBlockedAdultTitle() {
		if (!channelData) {
			isBlockedAdultTitle =  false;
			return;
		}
		if ($N.app.ParentalControlUtil.isChannelLocked(channelData)) {
			isBlockedAdultTitle = ($N.app.genreUtil.isAdultChannel(channelData));
		} else {
			isBlockedAdultTitle = $N.app.ParentalControlUtil.isChannelLockedAsAdult(channelData);
		}
	}

	/**
	 * @method getDataByDayCallback
	 * @private
	 * @param {Array} epgResults
	 * @param {Boolean} relatedTime
	 * @param {Number} next24item
	 * @param {Number} moveDirection
	 * @param {Boolean} isScroll
	 * @param {Boolean} isSameData
	 */
	function getDataByDayCallback(epgResults, relatedTime, next24item, moveDirection, isScroll, isSameData) {
		log("getDataByDayCallback", "Enter");
		var i,
			epgResultsLength = epgResults.length,
			selectRow = function () {
				log("selectRow", "Enter");
				var indexToSelect = 0;
				if (!previewActive && relatedTime) {
					for (i = 0; i < epgResultsLength; i++) {
						if (epgResults[i].startTime >= next24item) {
							indexToSelect = i;
							break;
						}
						if (epgResults[i].startTime <= next24item && epgResults[i].endTime >= next24item) {
							indexToSelect = i;
							break;
						}
					}
					timeList.selectRowAtIndex(indexToSelect + 1, moveDirection, isScroll);
				} else {
					timeList.selectRowAtIndex(eventUtil.getLiveEventIndex(timeList.getData()) || 1, moveDirection, isScroll);
				}
				log("selectRow", "Exit");
			};

		if (!isSameData) {
			timeList.setData(epgResults);
		}
		selectRow();
		updateDayTitle = true;
		timeList.displayData(previewActive, false);
		listNavigation.updateNavigationObject();
		updateLoadingImage(false);
		updateEventTimes(channelData);
		if (!eventUtil.isValidEvent(timeList.getSelectedItem()) && previewActive === false) {
			showNoEventInfoLayer("FOCUS");
		} else {
			hideNoEventInfoLayer();
		}
		log("getDataByDayCallback", "Exit");
	}

	/**
	 * Collect days data and show it in list
	 *
	 * @method loadDayData
	 * @private
	 * @param {Boolean} relatedTime
	 * @param {Boolean} selectTime - indicates if same time as previous day should be selected
	 * @return void
	 */
	function loadDayData(relatedTime, selectTime) {
		log("loadDayData", "Enter");
		var next24item = 0,
			moveDirection = listNavigation.getMoveDirection(),
			isScroll = (selectTime === false);
		isEventHighlighted = false;
		if (!channelData) {
			return;
		}
		if (moveDirection && selectTime) {
			next24item = highlightEventTime + (moveDirection * constants.DAY_IN_MS);
		} else {
			next24item = highlightEventTime;
		}
		// during auto update, do not loose focus if selected item was known
		if (!relatedTime && next24item > 0) {
			relatedTime = true;
		}
		updateLoadingImage(true);
		controller.getDataByDay(channelData, listNavigation.dataDay, function (epgResults) {
			getDataByDayCallback(epgResults, relatedTime, next24item, moveDirection, isScroll, false);
		});
		log("loadDayData", "Exit");
	}

	/**
	 * @method refreshDayData
	 */
	function refreshDayData() {
		log("refreshDayData", "Enter");
		if (!channelData) {
			return;
		}
		updateLoadingImage(true);
		controller.getDataByDay(channelData, listNavigation.dataDay, function (epgResults) {
			getDataByDayCallback(epgResults, false, highlightEventTime, 0, false, isEpgDataUnchanged(epgResults));
		});
		log("refreshDayData", "Exit");
	}

	/**
	 * @method forceRefresh
	 */
	function forceRefresh() {
		log("forceRefresh", "Enter");
		checkIfBlockedAdultTitle();
		refreshDayData();
		log("forceRefresh", "Exit");
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
	 * @method update
	 * @private
	 */
	function update() {
		log("update", "Enter");
		timeList.displayData();
		if (isSecondaryFocus) {
			this.setSecondaryFocus();
		}
		log("update", "Exit");
	}

	/**
	 * Callback for then a list item is highlighted
	 * @method itemHighlighted
	 * @private
	 * @param {Object} data
	 */
	function itemHighlighted(data) {
		log("itemHighlighted", "Enter");
		if (data) {
			if (previewActive === false) {
				updateControlButtons();
			}
			highlightEventTime = data.startTime + (data.endTime - data.startTime) / 2;
			updateCatchupTitle(data.endTime);
			eventHighlightedCallback(data, channelData);
			controller.updateVoltarButton();
		}
		log("itemHighlighted", "Exit");
	}

	/**
	 * Helper method to set up the view components
	 * @method configureComponents
	 * @private
	 */
	function configureComponents() {
		timeList = view.timeList;
		timeList.setItemHeight(timeListItemHeight);
		timeList.setVisibleItemCount(visibleItemCount);
		timeList.setItemHighlightedCallback(itemHighlighted);
		timeList.setItemSelectedCallback(controller.itemSelected);
		timeList.setDataMapper(timeDataMapper);
		timeList.setWrapAround(false);
		timeList.setUpDownPageable(true);
		loadingImg = view.timeListBackgroundGroup.loadingImg;
	}

	/**
	 * @method stopUpdateService
	 * @private
	 */
	function stopUpdateService() {
		log("stopUpdateService", "Enter");
		if (updateService) {
			clearInterval(updateService);
		}
		log("stopUpdateService", "Exit");
	}

	/**
	 * @method startUpdateService
	 * @private
	 */
	function startUpdateService() {
		log("startUpdateService", "Enter");
		stopUpdateService();
		updateService = setInterval(refreshDayData, updateTime);
		log("startUpdateService", "Exit");
	}

	/**
	 * Load next day data then button right clicked
	 *
	 * @method moveNextDay
	 * @private
	 * @param {String} moveState - null, next
	 * @return {Boolean} was able to move
	 */
	function moveNextDay() {
		log("moveNextDay", "Enter");
		if (listNavigation.getNavigationEndTime() < getLatestEventTime()) {
			listNavigation.dataDay++;
			updateDayTitle = true;
			updateControlButtons();
			log("moveNextDay", "Exit 1");
			return true;
		}
		log("moveNextDay", "Exit");
		return false;
	}

	/**
	 * Load previous day data then button left clicked
	 *
	 * @method movePreviousDay
	 * @private
	 * @return {Boolean} was able to move
	 */
	function movePreviousDay() {
		log("movePreviousDay", "Enter");
		if (listNavigation.getNavigationStartTime() > getEarliestEventTime()) {
			listNavigation.dataDay--;
			updateDayTitle = true;
			updateControlButtons();
			log("movePreviousDay", "Exit 1");
			return true;
		}
		log("movePreviousDay", "Exit");
		return false;
	}

	/**
	 * @method moveUp
	 * @private
	 */
	function moveUp() {
		log("moveUp", "Enter");
		var indexCurrent = timeList.getActualSelectedRowIndex();
		if (indexCurrent > 1) {
			timeList.selectPrevious();
		} else {
			movePreviousDay();
		}
		log("moveUp", "exit");
	}

	/**
	 * @method moveDown
	 * @private
	 */
	function moveDown() {
		log("moveDown", "Enter");
		var indexCurrent = timeList.getActualSelectedRowIndex(),
			epgDataLength = timeList.getData().length;
		if (indexCurrent < epgDataLength) {
			timeList.selectNext();
		} else {
			moveNextDay();
		}
		log("moveDown", "exit");
	}
	/**
	 * Load previous day data then channel up clicked
	 *
	 * @method handleChanUpKey
	 * @private
	 * @return void
	 */
	function handleChanUpKey() {
		log("handleChanUpKey", "Enter");
		var indexCurrent = timeList.getActualSelectedRowIndex();
		if ((indexCurrent - visibleItemCount) <= 0) {
			if (movePreviousDay()) {
				loadDayData(false, false);
				return true;
			}
		}
		log("handleChanUpKey", "exit");
		return false;
	}

	/**
	 * Load next day data then channel down clicked
	 *
	 * @method handleChanDownKey
	 * @private
	 * @return void
	 */
	function handleChanDownKey() {
		log("handleChanDownKey", "Enter");
		var actualIndex = timeList.getActualSelectedRowIndex(),
			viewIndex = timeList.getViewSelectedRowIndex(),
			epgData = timeList.getData();
		if ((actualIndex + (visibleItemCount - viewIndex)) >= epgData.length) {
			if (moveNextDay()) {
				loadDayData(false, false);
				return true;
			}
		}
		log("handleChanDownKey", "exit");
		return false;
	}
	/**
	 * @method recordingCallback
	 * @private
	 * @return void
	 */
	function recordingCallback() {
		var selectedItem = timeList.getSelectedItem();
		controller.updateSummary(selectedItem);
		timeList.displayData();
	}

	/**
	 * Adapter is designed to focus on current selected channel future event.
	 *
	 * @method loadScheduledEventData
	 * @private
	 * @param {Object} scheduledEvent - EPG Event object
	 * @return
	 */
	function loadScheduledEventData(scheduledEvent) {
		log("loadScheduledEventData", "Enter");
		listNavigation.dataDay = controller.getDayNumberByTime(scheduledEvent.startTime);
		highlightEventTime = scheduledEvent.startTime + (scheduledEvent.endTime - scheduledEvent.startTime) / 2;
		previewActive = false;
		isEventHighlighted = true;
		loadDayData(true, false);
		log("loadScheduledEventData", "Exit");
	}

	/**
	 * @method isEarliestDay
	 * @private
	 * @return {Boolean}
	 */
	function isEarliestDay() {
		log("isEarliestDay", "Enter");
		var currentDataStartTime = listNavigation.getNavigationStartTime();
		log("isEarliestDay", "Exit");
		return currentDataStartTime <= getEarliestEventTime();
	}

	/**
	 * @method navigationImmediate
	 * @private
	 * @param {String} key
	 */
	function navigationImmediate(key) {
		if (key === keys.KEY_LEFT && listNavigation.isToday()) {
			return;
		}
		switch (key) {
		case keys.KEY_UP:
		case keys.KEY_DOWN:
		case keys.KEY_LEFT:
		case keys.KEY_RIGHT:
			controller.beforeEventChange();
			break;
		}
	}

	/* Public API */
	return {
		/**
		 * Sets the behaviour to execute on leaving this state
		 * @method setExitCallback
		 * @param {Function} callback
		 */
		setExitCallback: function (callback) {
			exitCallback = callback;
		},

		/**
		 * Initialises the state
		 * @method initialise
		 * @param {Function} callback
		 */
		initialise: function (callback) {
			log("initialise", "Enter");
			configureComponents();
			timeList.initialise();
			this.setExitCallback(callback);
			log("initialise", "Exit");
		},


		/**
		 * @method preview
		 * @param {Object} data
		 * @param {Object} scheduledEvent
		 */
		preview: function (data, scheduledEvent) {
			log("preview", "Enter");
			hasIndexBeenSelected = false;
			channelData = data;
			previewActive = true;
			timeList.hide();
			if (!channelData && !scheduledEvent) {
				timeList.setData([]);
				timeList.displayData();
				timeList.show();
				controller.hideSummary();
			} else {
				if (scheduledEvent) {
					loadScheduledEventData(scheduledEvent);
				} else {
					loadDayData();
				}
			}
			updateDateTitle();
			checkIfBlockedAdultTitle();
			startUpdateService();
			view.show();
			timeList.defocus();
			log("preview", "Exit");
		},

		unPreview: function (data) {
			log("unPreview", "Enter");
			view.hide();
			log("unPreview", "Exit");
		},

		/**
		 * Activates the state
		 * @method activate
		 * @param {Object} data
		 * @param {Object} scheduledEvent
		 */
		activate: function (data, scheduledEvent) {
			log("activate", "Enter");
			if (!previewActive) {
				this.preview(data, scheduledEvent);
			}
			channelData = data;
			timeListItemSelected = false;
			isEventHighlighted = false;
			if (!isLeaveAsPreview) {
				isLeaveAsPreview = true;
			}
			timeList.resetScrollDirection();
			timeList.focus();
			previewActive = false;
			updateEventTimes(data);
			updateControlButtons();
			hasIndexBeenSelected = true;
			log("activate", "Exit");
		},

		/**
		 * Passivates the state
		 * @method passivate
		 * @param {Boolean} leaveAsPreview
		 */
		passivate: function (leaveAsPreview) {
			log("passivate", "Enter");
			if (!leaveAsPreview) {
				view.hide();
				timeList.hide();
				hideArrows();
				previewActive = false;
				stopUpdateService();
			} else {
				previewActive = true;
				timeList.defocus();
				updateControlButtons();
				if (!eventUtil.isValidEvent(timeList.getSelectedItem())) {
					hideNoEventInfoLayer();
				}
			}
			highlightEventTime = 0;
			isLeaveAsPreview = leaveAsPreview;
			$N.apps.core.ContextManager.dismissPreview();
			log("passivate", "Exit");
		},

		/**
		 * @method focus
		 */
		focus: function () {
			log("focus", "Enter");
			timeList.focus();
			log("focus", "Exit");
		},

		/**
		 * @method defocus
		 */
		defocus: function () {
			log("defocus", "Enter");
			timeList.defocus();
			log("defocus", "Exit");
		},

		/**
		 * @method showBackgroundOnly
		 */
		showBackgroundOnly: function () {
			log("showBackgroundOnly", "Enter");
			hideNoEventInfoLayer();
			view.timeListDateGroup.timeListDateTitle.hide();
			timeList.hide();
			hideArrows();
			previewActive = false;
			stopUpdateService();
			highlightEventTime = 0;
			isLeaveAsPreview = null;
			$N.apps.core.ContextManager.dismissPreview();
			log("showBackgroundOnly", "Exit");
		},

		/**
		 * @method isKeyRepeatReady
		 * @return {Boolean} isKeyRepeatReady - Are we ready to process another key repeat
		 * @private
		 */
		isKeyRepeatReady: function () {
			if (keyRepeatCount % KEY_REPEAT_RATE === 0) {
				return true;
			}
			return false;
		},

		/**
		 * @method updateKeyRepeatCount
		 * @param {Boolean} repeats Are there key repeats
		 * @private
		 */
		updateKeyRepeatCount: function (repeats) {
			if (repeats) {
				keyRepeatCount++;
			} else {
				keyRepeatCount = 0;
			}
		},

		/**
		 * Key handler for the state
		 * @method keyHandler
		 * @param {String} key
		 */
		keyHandler: function (key, repeats) {
			log("keyHandler", "Enter");
			var selectedItem = timeList.getSelectedItem(),
				handled = false,
				LEAVE_AS_PREVIEW = true;
			$N.app.MemoryUtil.setOrUpdateGarbageCollectTimeoutAndInterval();
			this.updateKeyRepeatCount(repeats);

			if (controller.getController().directChannelEntryHandler(key, repeats)) {
				log("keyHandler", "Exit because of directChannelEntryHandle.");
				controller.setShouldUpdateTimeWindow(false);
				return true;
			}

			navigationImmediate(key);

			switch (key) {
			case keys.KEY_BACK:
				if ($N.app.EventUtil.isEventShowingNow(selectedItem)) {
					this.passivate(LEAVE_AS_PREVIEW);
					exitCallback();
					handled = true;
				} else {
					handled = false;
				}
				break;
			case keys.KEY_UP:
				if (this.isKeyRepeatReady()) {
					moveUp();
					handled = true;
				}
				break;
			case keys.KEY_DOWN:
				if (this.isKeyRepeatReady()) {
					moveDown();
					handled = true;
				}
				break;
			case keys.KEY_UP + KEY_RELEASE_SUFFIX:
				if (listNavigation.getMoveDirection() !== 0) {
					loadDayData(false, false);
					handled = true;
				}
				break;
			case keys.KEY_DOWN + KEY_RELEASE_SUFFIX:
				if (listNavigation.getMoveDirection() !== 0) {
					loadDayData(false, false);
					handled = true;
				}
				break;
			case keys.KEY_LEFT:
				if (listNavigation.isToday()) {
					this.passivate(LEAVE_AS_PREVIEW);
					exitCallback();
				} else if (this.isKeyRepeatReady()) {
					movePreviousDay();
				}
				handled = true;
				break;
			case keys.KEY_RIGHT:
				if (listNavigation.isYesterday()) {
					this.resetListNavigation();
					controller.getController().handleViewReset();
					this.passivate(LEAVE_AS_PREVIEW);
					exitCallback();
				} else if (this.isKeyRepeatReady()) {
					moveNextDay();
				}
				handled = true;
				break;
			case keys.KEY_LEFT + KEY_RELEASE_SUFFIX:
				if (listNavigation.getMoveDirection()) {
					loadDayData(true, true);
					handled = true;
				}
				break;
			case keys.KEY_RIGHT + KEY_RELEASE_SUFFIX:
				if (listNavigation.isYesterday()) {
					handled = true;
				} else if (listNavigation.getMoveDirection()) {
					loadDayData(true, true);
					handled = true;
				}
				break;
			case keys.KEY_RECORD:
				if ($N.app.PVRUtil.isRecordable(selectedItem)) {
					$N.app.PVRUtil.recordOrCancelEvent(selectedItem, recordingCallback);
				}
				break;
			case keys.KEY_STOP:
				$N.app.PVRUtil.cancelEvent(selectedItem, recordingCallback);
				break;
			case keys.KEY_CHAN_UP:
				handled = handleChanUpKey();
				break;
			case keys.KEY_CHAN_DOWN:
				handled = handleChanDownKey();
				break;
			}
			if (!handled) {
				handled = timeList.keyHandler(key);
			}
			log("keyHandler", "Exit");
			return handled;
		},

		/**
		 * Returns the item that is currently selected in the time list
		 * @method getSelectedItem
		 * @return {Object}
		 */
		getSelectedItem: function () {
			return timeList.getSelectedItem();
		},

		stopUpdateService: stopUpdateService,

		setSecondaryFocus: function () {
			var item = timeList._getSelectedObject();
			if (item && item.setSecondaryHighlightOn && eventUtil.isValidEvent(timeList.getSelectedItem())) {
				item.setSecondaryHighlightOn();
			} else {
				showNoEventInfoLayer("SECONDARY_FOCUS");
			}
			stopUpdateService();
			isSecondaryFocus = true;
		},
		/**
		 * @method setEventHighlightedCallback
		 */
		setEventHighlightedCallback: function (callback) {
			eventHighlightedCallback = callback;
		},

		unsetSecondaryFocus: function () {
			var item = timeList._getSelectedObject();
			if (item && item.setSecondaryHighlightOff && eventUtil.isValidEvent(timeList.getSelectedItem())) {
				item.setSecondaryHighlightOff();
			} else {
				showNoEventInfoLayer("FOCUS");
			}
			isSecondaryFocus = false;
		},

		/**
		 * @method focusOnNowEvent
		 */
		focusOnNowEvent: function (data) {
			log("focusOnNowEvent", "Enter");
			isLeaveAsPreview = false;
			highlightEventTime = 0;
			this.resetToToday();
			this.preview(data);
			this.activate(data);
			log("focusOnNowEvent", "Exit");
		},

		/**
		 * @method isCatchupEvent
		 */
		isCatchupEvent: function () {
			log("isCatchupEvent", listNavigation.dataDay < 0);
			return (listNavigation.dataDay < 0);
		},

		resetListNavigation: function () {
			listNavigation.reset();
			highlightEventTime = 0;
		},

		update: update,
		isToday: listNavigation.isToday,
		moveToYesterday: listNavigation.setToYesterday,
		resetToToday: listNavigation.setToToday,
		forceRefresh: forceRefresh,

		updateIcons: function () {
			timeList.updateIcons();
		}
	};
};
