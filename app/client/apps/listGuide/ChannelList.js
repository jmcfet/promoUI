/*global ListGuide*/

/**
 * ChannelList is a sub-state of ListGuide and reacts the events in
 * the TimeList showing channel and event data for a selected time.
 * @module ListGuide
 * @class ChannelList
 * @constructor
 * @param {Object} controller
 * @param {Object} view
 */
var ChannelList = function (controller, view) {
	var $N = window.parent.$N,
		log = new $N.apps.core.Log("ListGuide", "ChannelList"),
		Preferences = $N.platform.system.Preferences,
		Constants = $N.app.constants,
		eventUtil = $N.app.EventUtil,
		favouritesToggledCallback = function () {},
		mainTitle = null,
		serviceIdsForCategory = null,
		channelList = null,
		channelListStatus = null,
		currentGenre = 0,
		previousGenre = 0,
		updateChannelListCallback = function () {},
		channelHighlightedCallback = function () {},
		channelSelectedCallback = function () {},
		previewActive = false,
		parentalControl = $N.app.ParentalControlUtil,
		directChannelEntry = new $N.app.DirectChannelEntry($N.app.constants.MAX_CHANNEL_DIGITS, $N.app.constants.CHANNEL_ENTRY_TIMEOUT_MS),
		catchupModeActive = false,
		isSelectRequired = false,
		noCatchUpEvents = false,
		bookmarkManager = null,
		bookmarkPosition = 0,
		isTimeListPreviewed,
		currentDataItem = null,
		inScrollMode = false, // true if the user is scrolling quickly through the Channel List
		favouritesToggledEventSubscriptionId = null,
		scheduledEvent = null,
		channelDataMapper = $N.app.DataMappers.getServiceDataMapper(),
		catchupDataMapper = {
			getChannelNumber: function (data) {
				return $N.platform.btv.EPG.getChannelByServiceId(data.channelUID).logicalChannelNum;
			},
			getChannelLogo: function (data) {
				return $N.app.epgUtil.getChannelLogoUrl(data.channelUID);
			},
			getTitle: function (data) {
				var serviceObj = $N.app.epgUtil.getServiceById(data.channelUID);
				if (data && parentalControl.isChannelOrProgramLocked(data)) {
					if (serviceObj && $N.app.genreUtil.isAdultChannel(serviceObj)) {
						return controller.getString("adultContent");
					}
				}
				return data.eventName;
			},
			getIcon: function (data) {
				return "";
			}
		};

	/**
	 * @method updateCatchupLabel
	 */
	function updateCatchupLabel() {
		log("updateCatchupLabel", "Enter & Exit");
		if (controller.isTimeListMode() && controller.getStates().eventList.isListToday() && controller.isCatchUpEnabled()) {
			view.catchupGroup.catchupArrow.show();
			view.catchupGroup.catchupLabel.setText(ListGuide.getString("catchup"));
			view.catchupGroup.catchupLabel.show();
		}
	}

	/**
	 * @method hideCatchupLabel
	 */
	function hideCatchupLabel() {
		log("hideCatchupLabel", "Enter & Exit");
		view.catchupGroup.catchupLabel.hide();
		view.catchupGroup.catchupArrow.hide();
	}

	/**
	 * @method focus
	 */
	function focus() {
		log("focus", "Enter");
		if (serviceIdsForCategory.length > 0) {
			view.upArrow.show();
			view.downArrow.show();
			updateCatchupLabel();
			controller.updateVoltarButton();
			channelList.focus();
		}
		log("focus", "Exit");
	}

	/**
	 * @method defocus
	 */
	function defocus() {
		log("defocus", "Enter");
		view.upArrow.hide();
		view.downArrow.hide();
		hideCatchupLabel();
		channelList.defocus();
		log("defocus", "Exit");
	}

	/**
	 * @method showUpAndDownArrows
	 */
	function showUpAndDownArrows() {
		view.upArrow.show();
		view.downArrow.show();
	}

	/**
	 * @method hideUpAndDownArrows
	 */
	function hideUpAndDownArrows() {
		view.upArrow.hide();
		view.downArrow.hide();
	}

	/**
	 * @method clearScheduledEvent
	 */
	function clearScheduledEvent() {
		scheduledEvent = null;
	}

	/**
	 * Given a logical channel number will search the list an
	 * if found will selected that channel
	 * @method selectChannelByNumber
	 * @private
	 * @param {Object} channelNumber
	 * @return {Boolean} True if the given channel number was selected.
	 */
	function selectChannelByNumber(channelNumber) {
		log("selectChannelByNumber", "Enter");
		var i,
			listItems = channelList.getData(),
			dataMapper = catchupModeActive ? catchupDataMapper : channelDataMapper,
			service = null;

		clearScheduledEvent();

		controller.getStates().eventList.resetListNavigation();

		if (channelNumber) {
			service = $N.app.epgUtil.getNextClosestService(channelNumber, listItems);
			if (service) {
				for (i = 0; i < listItems.length; i++) {
					if (listItems[i].logicalChannelNum === service.logicalChannelNum) {
						channelList.getActualSelectedItem().clearNumberItem();
						channelList.selectItemAtIndex(i + 1, true);
						log("selectChannelByNumber", "Exit1");
						return true;
					}
				}
			}
		}
		channelList.getActualSelectedItem().restoreNumberItem();
		log("selectChannelByNumber", "Exit2");
		return false;
	}

	/**
	 * Callback for getting bookmark for catchup event
	 * @method handleCatchupBookmarkResult
	 * @param {Number} position
	 */
	function handleCatchupBookmarkResult(position) {
		log("handleCatchupBookmarkResult", "Enter");
		bookmarkPosition = position;
		log("handleCatchupBookmarkResult", "Exit");
	}

	/**
	 * @method itemHighlightedImmediate
	 * @param {Object} channelData
	 */
	function itemHighlightedImmediate(channelData) {
		log("itemHighlightedImmediate", "Enter");
		isTimeListPreviewed = false;
		currentDataItem = channelData;
		log("itemHighlightedImmediate", "Exit");
	}

	/**
	 * Callback method for when an item is highlighted
	 * @method itemHighlighted
	 * @private
	 * @param {Object} channelData
	 */
	function itemHighlighted(channelData) {
		log("itemHighlighted", "Enter");
		inScrollMode = false;
		if (channelData) {
			channelHighlightedCallback(channelData, channelList.returnViewableList(), scheduledEvent);
			clearScheduledEvent();
			isTimeListPreviewed = true;
		}
		log("itemHighlighted", "Exit");
	}

	/**
	 * Callback method for when an item is selected
	 * @method itemSelected
	 * @private
	 * @param {Object} channelData
	 */
	function itemSelected(channelData) {
		log("itemSelected", "Enter");
		if (!isTimeListPreviewed) {
			itemHighlighted(channelData);
		}
		defocus();
		channelSelectedCallback(channelData);
		log("itemSelected", "Exit");
	}

	/**
	 * Helper method to set up the view components
	 * @method configureComponents
	 * @private
	 */
	function configureComponents() {
		log("configureComponents", "Enter");
		channelList.setDataMapper(channelDataMapper);
		channelList.setItemHighlightedCallback(itemHighlighted);
		channelList.setItemHighlightedImmediateCallback(itemHighlightedImmediate);
		channelList.setItemSelectedCallback(itemSelected);
		log("configureComponents", "Exit");
	}

	/**
	 * @method directChannelEntryCallback
	 * @param {Number} logicalChannelNumber
	 */
	function directChannelEntryCallback(logicalChannelNumber) {
		log("directChannelEntryCallback", "Enter");
		channelList.getActualSelectedItem().resetCss();
		if (logicalChannelNumber) {
			selectChannelByNumber(logicalChannelNumber);
		} else {
			channelList.getActualSelectedItem().restoreNumberItem();
		}
		if (controller.isTimeListMode()) {
			controller.returnToChannelList();
		} else {
			controller.focusOnEventList();
		}
		log("directChannelEntryCallback", "Exit");
	}

	/**
	 * @method checkServiceId
	 * @return {Number} serviceId
	 */
	function checkServiceId(serviceId) {
		var servicesLength = serviceIdsForCategory.length,
			i;
		for (i = 0; i < servicesLength; i++) {
			if (serviceId === serviceIdsForCategory[i]) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @method getChannelData
	 * @return {Array} channels
	 */
	function getChannelData() {
		log("getChannelData", "Enter");
		var channels = [],
			i,
			servicesLength = serviceIdsForCategory.length,
			serviceId,
			channelObject;
		for (i = 0; i < servicesLength; i++) {
			serviceId = serviceIdsForCategory[i];
			if (eventUtil.isValidServiceId(serviceId)) {
				channelObject = $N.platform.btv.EPG.getChannelByServiceId(serviceId);
				channelObject.channelLogo = $N.app.epgUtil.getChannelLogoUrl(serviceId);
				channels.push(channelObject);
			}
		}
		log("getChannelData", "Exit");
		return channels;
	}

	/**
	 * @method setUpCurrentCategory
	 * @private
	 */
	function setUpCurrentCategory() {
		log("setUpCurrentCategory", "Enter");
		var currentCategoryName = $N.platform.system.Preferences.get($N.app.constants.PREF_TV_CATEGORY);
		serviceIdsForCategory = $N.app.epgUtil.getServiceIdsForCategory(currentCategoryName);
		if ($N.platform.btv.ChannelCategories.getCurrentCategory() === $N.app.constants.FAVOURITE_FOLDER_NAME) {
			mainTitle = controller.getString("favourites");
			currentGenre = $N.app.genreUtil.GENRE_FAVORITE;
			if (serviceIdsForCategory.length > 0) {
				channelListStatus = $N.app.constants.CHANNEL_LIST_STATUS.FAVOURITE;
			} else {
				channelListStatus = $N.app.constants.CHANNEL_LIST_STATUS.EMPTY_FAVOURITE;
			}
		} else {
			currentGenre = $N.app.genreUtil.GENRE_ALLCHANNELS;
			if (serviceIdsForCategory.length > 0) {
				channelListStatus = $N.app.constants.CHANNEL_LIST_STATUS.ALL;
				mainTitle = controller.getString("allChannels");
			} else {
				channelListStatus = $N.app.constants.CHANNEL_LIST_STATUS.EMPTY_ALL;
				mainTitle = "";
			}
		}
		controller.setBreadCrumbParentAndChildTitle(currentGenre);
		log("setUpCurrentCategory", "Exit");
	}

	/* public API */

	/**
	 * Initialises the state
	 * @method initialise
	 */
	function initialise() {
		log("initialise", "Enter");
		channelList = view.channelList;
		configureComponents();
		channelList.setItemHeight(109);
		channelList.setVisibleItemCount(4);
		channelList.setWrapAround(true);
		channelList.setUpDownPageable(true);
		channelList.initialise();
		directChannelEntry.setChannelEnteredCallback(directChannelEntryCallback);
		currentGenre = $N.app.genreUtil.GENRE_ALLCHANNELS;
		log("initialise", "Exit");
	}

	/**
	 * Populates the channel list
	 * either from live tv data or catchup
	 * @method populateChannelList
	 * @param {Array} ChannelDataList
	 * @param {Number} serviceId
	 * @param {Boolean} selectFirstChannel
	 * @private
	 */
	function populateChannelList(ChannelDataList, serviceId, selectFirstChannel) {
		log("populateChannelList", "Enter");
		var storedServiceId;
		channelList.setData(ChannelDataList);
		storedServiceId = serviceId || $N.app.epgUtil.getChannelFromPrefs();
		if (!storedServiceId || $N.app.epgUtil.getNumServices() === 0 || !$N.platform.btv.EPG.getChannelByServiceId(storedServiceId) || !selectChannelByNumber($N.platform.btv.EPG.getChannelByServiceId(storedServiceId).logicalChannelNum) || selectFirstChannel) {
			channelList.selectItemAtIndex(1, true);
		}
		previewActive = true;
		channelList.show();
		log("populateChannelList", "Exit");
	}

	/**
	 * @method favouritesToggledListener
	 * @private
	 */
	function favouritesToggledListener() {
		log("favouritesToggledListener", "Enter");
		setUpCurrentCategory();
		populateChannelList(getChannelData(), channelList.getSelectedItem() && channelList.getSelectedItem().serviceId);
		channelList.displayData();
		updateChannelListCallback(channelListStatus);
		if (serviceIdsForCategory.length > 0) {
			controller.hideNoFavoriteChannel();
			favouritesToggledCallback();
			controller.focusOnEventList();
		} else {
			controller.showNoFavoriteChannel();
			view.channelList.hide();
			hideCatchupLabel();
			view.upArrow.hide();
			view.downArrow.hide();
		}
		log("favouritesToggledListener", "Exit");
	}

	/**
	 * @method resetFilter
	 * @private
	 */
	function resetFilter() {
		log("resetFilter", "Enter");
		currentGenre = $N.app.genreUtil.GENRE_ALLCHANNELS;
		log("resetFilter", "Exit");
	}

	/**
	 * @method updateChannelList
	 * @param {Boolean} selectFirstChannel
	 */
	function updateChannelList(selectFirstChannel) {
		log("updateChannelList", "Enter");
		var channels = $N.app.ChannelManager.getChannelListByGenreIndex(currentGenre),
			selectedItem = channelList.getSelectedItem(),
			serviceId = selectedItem ? selectedItem.serviceId : null;
		populateChannelList(channels, serviceId, selectFirstChannel);
		channelList.displayData();
		if (channels.length > 0) {
			channelListStatus = $N.app.constants.CHANNEL_LIST_STATUS.FILTER;
			controller.focusOnEventList();
		} else {
			if (currentGenre === $N.app.genreUtil.GENRE_FAVORITE) {
				channelListStatus = $N.app.constants.CHANNEL_LIST_STATUS.EMPTY_FAVOURITE;
			} else {
				channelListStatus = $N.app.constants.CHANNEL_LIST_STATUS.EMPTY_FILTER;
			}
			view.upArrow.hide();
			view.downArrow.hide();
		}
		updateChannelListCallback(channelListStatus);
		log("updateChannelList", "Exit");
	}

	/**
	 * @method changeFilter
	 * @param {Boolean} reset
	 * @param {Boolean} selectFirstChannel
	 * @private
	 */
	function changeFilter(reset, selectFirstChannel) {
		log("changeFilter", "Enter");

		if (reset === true) {
			//reset filter mode to GENRE_ALLCHANNELS
			if (currentGenre === $N.app.genreUtil.GENRE_ALLCHANNELS) {
				return;
			} else {
				currentGenre = $N.app.genreUtil.GENRE_ALLCHANNELS;
			}
		} else {
			currentGenre = (currentGenre + 1) % $N.app.genreUtil.getAmountOfGenres();
		}

		if (currentGenre === $N.app.genreUtil.GENRE_ALLCHANNELS) {
			mainTitle = controller.getString("allChannels");
		} else {
			mainTitle = $N.app.genreUtil.getGenreTitle(currentGenre);
		}
		updateChannelList(selectFirstChannel);
		controller.setBreadCrumbParentAndChildTitle(currentGenre);
		log("changeFilter", "Exit");
	}

	/**
	 * @method subscribeToFavouritesToggledEvent
	 * @private
	 */
	function subscribeToFavouritesToggledEvent() {
		if (!favouritesToggledEventSubscriptionId) {
			favouritesToggledEventSubscriptionId = $N.apps.util.EventManager.subscribe("favouritesToggled", favouritesToggledListener, ChannelList);
		}
	}

	/**
	 * @method unsubscribeFromFavouritesToggledEvent
	 * @private
	 */
	function unsubscribeFromFavouritesToggledEvent() {
		if (favouritesToggledEventSubscriptionId) {
			$N.apps.util.EventManager.unSubscribe(favouritesToggledEventSubscriptionId);
			favouritesToggledEventSubscriptionId = null;
			//setting the preferences to all channels since it was zapping only through the favourite channels once favourite key is pressed while in Guide.
			$N.platform.system.Preferences.set($N.app.constants.PREF_TV_CATEGORY, $N.app.constants.FAVOURITE_ALL_CHANNELS);
		}
	}

	/**
	 * @method loadChannelList
	 * @param {Array} channelDataList
	 * @private
	 */
	function loadChannelList(channelDataList, serviceId) {
		log("loadChannelList", "Enter");
		if (channelDataList) {
			catchupModeActive = false;
			channelList.setDataMapper(channelDataMapper);
			populateChannelList(channelDataList, serviceId);
			channelDataList = null;
		}
		log("loadChannelList", "Exit");
	}

	/**
	 * Previews the state
	 * @method preview
	 * @param {Object} activationObject
	 */
	function preview(activationObject) {
		var serviceId;
		log("preview", "Enter");
		setUpCurrentCategory();
		if (activationObject && activationObject.event) {
			scheduledEvent = activationObject.event;
			serviceId = scheduledEvent.serviceId;
			if (!checkServiceId(serviceId) && $N.platform.btv.ChannelCategories.getCurrentCategory() === $N.app.constants.FAVOURITE_FOLDER_NAME) {
				$N.platform.btv.ChannelCategories.resetCurrentCategory();
				setUpCurrentCategory();
			}
		}
		this.focus();
		if (!activationObject || (activationObject && !activationObject.genreToBeLoaded)) {
			loadChannelList(getChannelData(), serviceId);
			channelList.getActualSelectedItem().clearNumberItem();
		}
		updateChannelListCallback(channelListStatus);
		log("preview", "Exit");
	}

	/**
	 * Activates the state
	 * @method activate
	 * @param {Object} data
	 * @param {Number} serviceId
	 */
	function activate(data, serviceId) {
		log("activate", "Enter");
		this.focus();
		if (!controller.isTimeListMode()) {
			controller.focusOnEventList();
		}
		if (!previewActive) {
			isSelectRequired = true;
			preview(data, serviceId, isSelectRequired); //force a preview
		}
		if (!noCatchUpEvents && previewActive) {
			bookmarkManager = new $N.services.sdp.Bookmark();
		}
		channelList.getActualSelectedItem().clearNumberItem();
		if (serviceIdsForCategory.length < 1) {
			view.channelList.hide();
			view.upArrow.hide();
			view.downArrow.hide();
		}
		log("activate", "Exit");
	}

	/**
	 * Passivates the state
	 * @method passivate
	 */
	function passivate() {
		var executeCallback = false;
		log("passivate", "Enter");
		this.defocus();
		directChannelEntry.cancelEntry(executeCallback);
		channelList.getActualSelectedItem().resetCss();
		log("passivate", "Exit");
	}

	/**
	 * @method recordingCallback
	 * @private
	 * @param data - The callback data
	 * @return void
	 */
	function recordingCallback(data) {
		if (data.state === "cancel") {
			var updatedItem = data.event;
			controller.updateSummary(updatedItem);
			if (controller.getStates().eventList.isTimeListMode()) {
				controller.getStates().eventList.list.preview(updatedItem);
			} else {
				controller.getStates().eventList.grid.preview(channelList.returnViewableList());
			}
		}
	}

	/**
	 * Key handler method.
	 * @method keyHandler
	 * @param {Object} key
	 * @return {Boolean} True if the key press was handled, false if the key press wasn't handled.
	 */
	function keyHandler(key, repeats) {
		log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false,
			serviceId = controller.getStates().channelList.getCurrentServiceId(),
			event = $N.platform.btv.EPG.getCurrentEventForService(serviceId) || $N.app.epgUtil.getDefaultEvent(serviceId);
		$N.app.MemoryUtil.setOrUpdateGarbageCollectTimeoutAndInterval();

		if (repeats) {
			switch (key) {
			case keys.KEY_BLUE:
				return true; // Absorb key-press
			}
		}
		switch (key) {
		case keys.KEY_ZERO:
		case keys.KEY_ONE:
		case keys.KEY_TWO:
		case keys.KEY_THREE:
		case keys.KEY_FOUR:
		case keys.KEY_FIVE:
		case keys.KEY_SIX:
		case keys.KEY_SEVEN:
		case keys.KEY_EIGHT:
		case keys.KEY_NINE:
			channelList.getActualSelectedItem().setDirectEntryCss();
			directChannelEntry.updateChannelDigits(key, channelList.getActualSelectedItem().getNumberItem(), channelList.getActualSelectedItem().getCursor());
			handled = true;
			break;
		case keys.KEY_LEFT:
			if (directChannelEntry.isActive()) {
				directChannelEntry.updateChannelDigits(key, channelList.getActualSelectedItem().getNumberItem(), channelList.getActualSelectedItem().getCursor());
			} else if (controller.isCurrentStateChannelList() && controller.isTimeListMode() && controller.isCatchUpEnabled()) {
				controller.getStates().eventList.moveListToYesterday();
				itemSelected(currentDataItem);
			}
			handled = true;
			break;
		case keys.KEY_RIGHT:
			if (controller.isCurrentStateChannelList() && controller.isTimeListMode()) {
				controller.getStates().eventList.resetListToToday();
				itemSelected(currentDataItem);
				handled = true;
			}
			break;
		case keys.KEY_OK:
			channelList.getActualSelectedItem().resetCss();
			handled = directChannelEntry.okKeyHandler();
			if (!handled) {
				handled = channelList.keyHandler(key);
			}
			break;
		case keys.KEY_RECORD:
			if ($N.app.PVRUtil.isRecordable(event)) {
				$N.app.PVRUtil.recordOrCancelEvent(event, recordingCallback);
			}
			break;
		case keys.KEY_STOP:
			$N.app.PVRUtil.cancelEvent(event, recordingCallback);
			break;
		default:
			if (directChannelEntry.isActive() && $N.app.GeneralUtil.isKeyReleaseEvent(key)) {
				return false;
			}
			directChannelEntry.cancelEntry(true);
			handled = channelList.keyHandler(key);
			break;
		}
		log("keyHandler", "Exit");
		return handled;
	}

	/**
	 * Dismisses the preview of this state
	 * @method unPreview
	 */
	function unPreview() {
		log("unPreview", "Enter");
		if (!$N.app.EnvironmentUtil.isSTBEnvironmentIP()) {
			var storedServiceId = $N.app.epgUtil.getChannelFromPrefs();
			selectChannelByNumber($N.platform.btv.EPG.getChannelByServiceId(storedServiceId).logicalChannelNum);
		}
		previewActive = false;
		log("unPreview", "Exit");
	}

	/* Public API */
	return {
		initialise: initialise,
		activate: activate,
		passivate: passivate,
		preview: preview,
		unPreview: unPreview,
		focus: focus,
		defocus: defocus,
		keyHandler: keyHandler,
		itemSelected: itemSelected,
		changeFilter: changeFilter,
		updateChannelList: updateChannelList,
		resetFilter: resetFilter,
		hideCatchupLabel: hideCatchupLabel,
		showUpAndDownArrows: showUpAndDownArrows,
		hideUpAndDownArrows: hideUpAndDownArrows,
		subscribeToFavouritesToggledEvent: subscribeToFavouritesToggledEvent,
		unsubscribeFromFavouritesToggledEvent: unsubscribeFromFavouritesToggledEvent,

		/**
		 * @method hasFilterChanged
		 * @return {Boolean} hasGenreChanged
		 */
		hasFilterChanged: function () {
			return currentGenre !== previousGenre;
		},

		/**
		 * @method resetGenreChanged
		 */
		resetFilterChanged: function () {
			previousGenre = currentGenre;
		},

		/**
		 * @method setCurrentGenre
		 * @param {Number} genreIndex
		 */
		setCurrentGenre: function (genreIndex) {
			currentGenre = genreIndex;
		},

		/**
		 * Returns true if this state is being previewed
		 * @method isPreviewActive
		 */
		isPreviewActive: function () {
			return previewActive;
		},

		/**
		 * Returns the current selected service Id
		 * @method getCurrentServiceId
		 * @return {Number} the service id
		 */
		getCurrentServiceId: function () {
			if (channelList.getSelectedItem()) {
				return channelList.getSelectedItem().serviceId;
			}
			return null;
		},

		/**
		 * Updates the current selected focus box
		 * @method highlightSelectedItem
		 */
		highlightSelectedItem: function () {
			if (channelList.getSelectedItem()) {
				itemHighlightedImmediate(channelList.getSelectedItem());
			}
		},

		/**
		 * Returns the item that is currently selected in the channel list
		 * @method getSelectedItem
		 * @return {Object}
		 */
		getSelectedItem: function () {
			return channelList.getSelectedItem();
		},

		/**
		 * @method getViewSelectedRowIndex
		 */
		getViewSelectedRowIndex: function () {
			return channelList.getViewSelectedRowIndex();
		},

		/**
		 * Return viewable data list
		 * @method returnViewableList
		 */
		returnViewableList: function () {
			return channelList.returnViewableList();
		},

		/**
		 * @method selectNext
		 */
		selectNext: function () {
			return channelList.selectNext();
		},

		/**
		 * @method selectPrevious
		 */
		selectPrevious: function () {
			return channelList.selectPrevious();
		},

		/**
		 * @method selectNextPage
		 */
		selectNextPage: function () {
			return channelList.pageDown();
		},

		/**
		 * @method selectPreviousPage
		 */
		selectPreviousPage: function () {
			return channelList.pageUp();
		},

		/**
		 * @method setFavouritesToggledCallback
		 */
		setFavouritesToggledCallback: function (callback) {
			favouritesToggledCallback = callback;
		},

		/**
		 * @method setUpdateChannelListCallback
		 */
		setUpdateChannelListCallback: function (callback) {
			updateChannelListCallback = callback;
		},

		/**
		 * @method setChannelHighlightedCallback
		 */
		setChannelHighlightedCallback: function (callback) {
			channelHighlightedCallback = callback;
		},

		/**
		 * @method setChannelSelectedCallback
		 */
		setChannelSelectedCallback: function (callback) {
			channelSelectedCallback = callback;
		},

		/**
		 * @method getCurrentGenre
		 */
		getCurrentGenre: function () {
			return currentGenre;
		},

		/**
		 * @method getChannelListStatus
		 */
		getChannelListStatus: function () {
			return channelListStatus;
		},

		/**
		 * @method isActiveOfDirectChannelEntry
		 */
		isActiveOfDirectChannelEntry: function () {
			return directChannelEntry && directChannelEntry.isActive();
		},

		/**
		 * @method cancelEntryForDirectChannelEntry
		 */
		cancelEntryForDirectChannelEntry: function () {
			directChannelEntry.cancelEntry(true);
		},

		/*
		 * @method showConnectorToEventList
		 */
		showConnectorToEventList: function () {
			channelList.setCssClass("connectorVisible");
		},

		/*
		 * @method hideConnectorToEventList
		 */
		hideConnectorToEventList: function () {
			channelList.setCssClass("");
		}
	};
};
