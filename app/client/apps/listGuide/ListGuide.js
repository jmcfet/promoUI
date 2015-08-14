/*global EventList, ChannelList, NoEpg*/

/**
 * Entry point for the LISTGUIDE context. This class is the main
 * controller which manages two substates time list and channel
 * list
 * @module ListGuide
 * @class ListGuide
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.platform.system.Preferences
 * @requires $N.app.constants
 * @param {Object} $N
 */
var ListGuide = (function ($N) {
	var log = new $N.apps.core.Log("ListGuide", "ListGuide"),
		view = {},
		states = {},
		stateBeforeOption = null,
		currentState = null,
		currentEventId = null,
		_rememberEvent = false,
		summary = null,
		summaryFade = null,
		pinHelper,
		eventUtil = null,
		parentalControl = null,
		isOptionsMode = false,
		isEmptyChannel = false,
		isLiveEvent = false,
		guideTitle = null,
		uiRefreshTimeoutId = null,
		PVRSubscriptionIds = [],
		PIPEnabledSubscriptionId,
		PIPDisabledSubscriptionId,
		GUIDE_MODE = {
			GRID: "grid",
			LIST: "list"
		},
		prefGuideMode = $N.platform.system.Preferences.get($N.app.constants.DISPLAY_GUIDE_MODE),
		displayListGuideModeText = null,
		noFavouriteChannelsView = null,
		catchUpHelper = null,
		me = this,
		isExitPressed = false;

	$N.apps.util.EventManager.create("WHPVRcreateTask");

	/**
	 * @method isCatchUpEnabled
	 * @return {Boolean}
	 */
	function isCatchUpEnabled() {
		return $N.app.FeatureManager.isCatchUpEnabled();
	}

	/**
	 * @method isCurrentStateChannelList
	 * @return {Boolean}
	 */
	function isCurrentStateChannelList() {
		return (currentState === states.channelList);
	}

	/**
	 * @method setRememberEventOn
	 */
	function setRememberEventOn() {
		_rememberEvent = true;
	}

	/**
	 * @method setRememberEventOff
	 */
	function setRememberEventOff() {
		_rememberEvent = false;
	}

	/**
	 * @method setBreadCrumbParentAndChildTitle
	 * @param {string} currentGenre - genre title.
	 */
	function setBreadCrumbParentAndChildTitle(currentGenre) {
		var stringSubTitle = $N.app.genreUtil.getGenreTitle(currentGenre);
		guideTitle.reset();
		guideTitle.show();
		guideTitle.push(ListGuide.getString("applicationName"));
		guideTitle.push(stringSubTitle);
	}

	/**
	 * @method showOrHideRecordButtonIfPVREnabled
	 * @private
	 */
	function showOrHideRecordButtonIfPVREnabled() {
		var eventOnDisplay = states.eventList.getSelectedItem(),
			eventId = eventOnDisplay && eventOnDisplay.eventId ? eventOnDisplay.eventId : 0,
			PPVEventPurchaseInfo = $N.app.PPVHelper.getPPVEventPurchaseInfo(eventOnDisplay);
		if (eventId) {
			view.buttonIcons.recordButton.setVisible($N.app.PVRCapability.isPVREnabled() && $N.app.PVRUtil.isRecordable(eventOnDisplay) && !PPVEventPurchaseInfo);
		} else {
			view.buttonIcons.recordButton.setVisible(false);
		}
	}

	/**
	 * @method updateVoltarButton
	 * @public
	 */
	function updateVoltarButton() {
		var eventOnDisplay = states.eventList.getSelectedItem();
		if ((currentState === states.channelList && states.eventList.isTimeListMode())
				|| (currentState === states.eventList && $N.app.EventUtil.isEventShowingNow(eventOnDisplay))) {
			view.channelListGroup.backIcon.hide();
			view.channelListGroup.backIconLabel.hide();
		} else {
			view.channelListGroup.backIconLabel.setText(ListGuide.getString("vt"));
			view.channelListGroup.backIcon.show();
			view.channelListGroup.backIconLabel.show();
		}
	}

	/**
	 * @method updateCatchupTitle
	 * @param {Boolean} isCatchup
	 * @public
	 */
	function updateCatchupTitle(isCatchup) {
		log("updateCatchupTitle", "Enter");
		if (isCatchup && isCatchUpEnabled()) {
			guideTitle.showCatchup(ListGuide.getString("catchup"));
		} else {
			guideTitle.hideCatchup();
		}
		log("updateCatchupTitle", "Exit");
	}

	/**
	 * @method PVRStatusUpdateListener
	 * @status {Object} the status object for PVR
	 * @private
	 */
	function PVRStatusUpdateListener(status) {
		log("PVRStatusUpdateListener", "Enter");
		if ($N.apps.core.ContextManager.getActiveContext().getId() === "LISTGUIDE") {
			showOrHideRecordButtonIfPVREnabled();
		}
		log("PVRStatusUpdateListener", "Exit");
	}

	/**
	 * @method PIPEnabledListener
	 */
	function PIPEnabledListener() {
		log("PIPEnabledListener", "Enter");
		summary.setIsPIPEnabled(true);
		summary.activatePip();
		log("PIPEnabledListener", "Exit");
	}

	/**
	 * @method PIPDisabledListener
	 */
	function PIPDisabledListener() {
		log("PIPDisabledListener", "Enter");
		summary.setIsPIPEnabled(false);
		summary.deactivatePip();
		log("PIPDisabledListener", "Exit");
	}

	/**
	 * @method showSummary
	 * @public
	 */
	function showSummary() {
		log("showSummary", "Enter & Exit");
		summary.showSummary();
	}

	/**
	 * @method hideSummary
	 * @public
	 */
	function hideSummary() {
		log("hideSummary", "Enter & Exit");
		summary.hide();
	}

	/**
	 * Given an event object will update the info card with the
	 * event details
	 * @method updateSummary
	 * @public
	 * @param {Object} data
	 */
	function updateSummary(eventData, channelData) {
		log("updateSummary", "Enter");
		var isOptionsViewVisible = ($N.apps.core.ContextManager.getActiveContext().getId() === "OPTIONS"),
			eventInfo,
			serviceObj = states.channelList.getSelectedItem(),
			isCatchupEvent,
			channelUri;
		if (isEmptyChannel) {
			log("updateSummary", "Exit 1");
			return;
		}
		isLiveEvent = $N.app.EventUtil.isEventShowingNow(eventData);
		if (eventData && !isOptionsViewVisible) {
			summary.setFocusedEvent(states.eventList.getSelectedItem());
			summary.setFocusedChannel(serviceObj);
			isCatchupEvent = states.eventList.isCatchupEvent(eventData);
			channelUri = serviceObj.uri;
			if (!serviceObj || eventData.serviceId !== serviceObj.serviceId) {
				log("updateSummary", "Exit 2");
				return;
			}

			eventInfo = $N.app.epgUtil.getDataForInfoCard(eventData);
			if (eventInfo.isPVREventScheduled) {
				view.buttonIcons.recordButton.setText(ListGuide.getString("removeRecord"));
			} else {
				view.buttonIcons.recordButton.setText(ListGuide.getString("record"));
			}
			if (!eventData.isLocked && eventInfo.title !== ListGuide.getString("noEventTitle")) {
				showOrHideRecordButtonIfPVREnabled();
			} else {
				view.buttonIcons.recordButton.hide();
			}
			serviceObj = channelData || $N.app.epgUtil.getServiceById(eventData.serviceId);
			summary.updateSummary(eventInfo, serviceObj, channelUri, isEmptyChannel, isCatchupEvent, isOptionsMode);
		} else if (isOptionsViewVisible) {
			log("updateSummary", "inOption");
			summary.hideEventDetails();
		} else {
			//no data available
			log("updateSummary", "no data available");
		}
		log("updateSummary", "Exit 3");
	}

	/**
	 * @method updateIcons
	 * @private
	 */
	function updateIcons() {
		log("updateIcons", "Enter");
		if (!isOptionsMode) {
			summary.updateIcons(states.eventList.getSelectedItem());
		}
		states.eventList.updateIcons();
		log("updateIcons", "Exit");
	}

	/**
	 * @method stopUIRefreshTimeout
	 * @private
	 */
	function stopUIRefreshTimeout() {
		log("stopUIRefreshTimeout", "Enter");
		if (uiRefreshTimeoutId) {
			clearTimeout(uiRefreshTimeoutId);
			uiRefreshTimeoutId = null;
		}
		log("stopUIRefreshTimeout", "Exit");
	}

	/**
	 * @method stopAndStartUIRefreshTimeout
	 * @private
	 */
	function stopAndStartUIRefreshTimeout() {
		log("stopAndStartUIRefreshTimeout", "Enter");
		var UPDATE_ICONS_TIMEOUT = 500;
		stopUIRefreshTimeout();
		uiRefreshTimeoutId = setTimeout(updateIcons, UPDATE_ICONS_TIMEOUT);
		log("stopAndStartUIRefreshTimeout", "Exit");
	}

	/**
	 * @method uiRefreshListener
	 * @private
	 */
	function uiRefreshListener() {
		log("uiRefreshListener", "Enter");
		stopAndStartUIRefreshTimeout();
		log("uiRefreshListener", "Exit");
	}

	/**
	 * @method updateOptionIcon
	 * @public
	 * @param {Object} data
	 */
	function updateOptionIcon(data) {
		log("updateOptionIcon", "Enter");
		if (eventUtil.isValidEvent(data)) {
			view.buttonIcons.optionButton.setHref($N.app.constants.ACTIVE_OPTIONS_BUTTON_PATH);
		} else {
			view.buttonIcons.optionButton.setHref($N.app.constants.INACTIVE_OPTIONS_BUTTON_PATH);
		}
		log("updateOptionIcon", "Exit");
	}

	/**
	 * @method hideOptionsMenu
	 * @private
	 */
	function hideOptionsMenu() {
		log("hideOptionsMenu", "Enter");
		isOptionsMode = false;
		states.eventList.unsetSecondaryFocus();
		if (stateBeforeOption === states.channelList) {
			currentState.passivate(true);
			currentState = states.channelList;
			currentState.activate();
		}
		stateBeforeOption = null;
		summary.showSummaryDetail();
		updateIcons();
		log("hideOptionsMenu", "Exit");
	}

	/**
	 * @method optionsRefreshCallback
	 */
	function optionsRefreshCallback() {
		log("optionsRefreshCallback", "Enter");
		summary.showInOptionsMode();
		log("optionsRefreshCallback", "Exit");
	}

	/**
	 * @method showOptionsMenu
	 * @private
	 */
	function showOptionsMenu() {
		log("showOptionsMenu", "Enter");
		var event = null;

		if (!isEmptyChannel) {
			event = states.eventList.getSelectedItem();
			if (eventUtil.isValidEvent(event)) {
				isOptionsMode = true;
				stateBeforeOption = currentState;
				$N.app.ContextHelper.openContext("OPTIONS", {
					activationContext: {
						"data": event,
						"type": "epg",
						"showBackgroundGradient": false,
						"uiRefreshCallback": optionsRefreshCallback,
						"backgroundId": $N.app.BrandHelper.GUIDE_BACKGROUND_ID
					},
					navCompleteCallback: hideOptionsMenu,
					hideUnderlays: false
				});
				states.eventList.setSecondaryFocus();
				summary.showInOptionsMode();
			}
		}
		log("showOptionsMenu", "Exit");
	}

	/**
	 * Helper method for keyHandler to handle navigation to Synopsis
	 * @method backFromSynopsis
	 * @param {Boolean} forceRefresh
	 * @private
	 */
	function backFromSynopsis(forceRefresh) {
		if (forceRefresh && states.eventList.isTimeListMode()) {
			states.eventList.updateTimeList();
		}
		updateIcons();
	}

	/**
	 * Helper method for keyHandler to handle navigation to Synopsis
	 * @method navigateToSynopsis
	 * @private
	 */
	function navigateToSynopsis() {
		log("navigateToSynopsis", "Enter");
		setRememberEventOn();
		var eventOnDisplay = states.eventList.getSelectedItem(),
			focusService = $N.platform.btv.EPG.getChannelByServiceId(eventOnDisplay.serviceId),
			isChannelLocked = $N.app.ParentalControlUtil.isChannelLocked(focusService);
		if (eventUtil.isValidEvent(eventOnDisplay)) {
			if ($N.app.ParentalControlUtil.isChannelOrProgramLocked(eventOnDisplay) && $N.app.genreUtil.isAdultChannel(focusService)) {
				pinHelper.setDialogProperties({
					x: 0,
					y: 0,
					width: 1920,
					height: 1080,
					id: 'listGuidePinDialogId',
					title: isChannelLocked ? ListGuide.getString("channelLocked") : ListGuide.getString("programLocked"),
					description: isChannelLocked ? ListGuide.getString("unlockChannel") : ListGuide.getString("unlockShow"),
					cancelCallback: function () {
						pinHelper.hideDialog();
					}
				});
				pinHelper.setAuthenticationSuccessCallback(function () {
					$N.apps.core.ContextManager.dismissPreview();
					$N.app.epgUtil.navigateToSynopsis(eventOnDisplay, eventUtil.isEventShowingNow(eventOnDisplay), function () {
						backFromSynopsis(true);
					});
				});
				pinHelper.showPinDialog('master', true);
			} else {
				$N.apps.core.ContextManager.dismissPreview();
				$N.app.epgUtil.navigateToSynopsis(eventOnDisplay, eventUtil.isEventShowingNow(eventOnDisplay), function () {
					backFromSynopsis(true);
				});
			}
		}
		log("navigateToSynopsis", "Exit");
	}



	/**
	 * @method navigateToContext
	 * @private
	 * @param {Object} data
	 * @param {Object} serviceObj
	 * @param {String} targetContext
	 */
	function navigateToContext(data, serviceObj, targetContext) {
		log("itemSelectedNavigate", "Enter");
		switch (targetContext) {
		case "ZAPPER":
			log("itemSelectedNavigate", "ZAPPER");
			serviceObj.showBanner = true;
			$N.app.ContextHelper.openContext("ZAPPER", {
				activationContext: serviceObj
			});
			break;
		case "SYNOPSIS":
			log("itemSelectedNavigate", "SYNOPSIS");
			if (eventUtil.isValidEvent(data)) {
				$N.apps.core.ContextManager.dismissPreview();
				navigateToSynopsis();
			}
			break;
		case "CATCHUP":
			log("itemSelectedNavigate", "CATCHUP");
			if (eventUtil.isValidEvent(data)) {
				catchUpHelper.playCatchUp(data);
			}
			break;
		default:
			break;
		}
		log("itemSelectedNavigate", "Exit");
	}

	/**
	 * @method itemSelected
	 * @private
	 * @param {Object} data
	 */
	function itemSelected(data) {
		log("itemSelected", "Enter");
		var serviceObj,
			isEventShowingNow,
			isCatchUp,
			isAdultContent,
			targetContext = null,
			pinRequired = false;

		if (data) {
			serviceObj = $N.app.epgUtil.getServiceById(data.serviceId);
			isEventShowingNow = $N.app.EventUtil.isEventShowingNow(data);
			isCatchUp = catchUpHelper.isCatchUp(data);

			if (isEventShowingNow) {
				targetContext = "ZAPPER";
			} else if (isCatchUp) {
				targetContext = "CATCHUP";
			} else {
				targetContext = "SYNOPSIS";
			}

			//Show pin dialog only when
			//1. the channel or program are blocked and it is now playing event.
			//2. the channel or program are blocked and it is a catch up event
			//3. current channel is an adult channel (regardless of action)
			//4. current event is an adult program (regardless of action)

			// Pin pop is already handled on zapper context after OK press from GridGuide
			navigateToContext(data, serviceObj, targetContext);
		}
		log("itemSelected", "Exit");
	}


	/**
	 * @method serviceUpdated
	 */
	function serviceUpdated() {
		log("serviceUpdated", "Enter & Exit");
		if ($N.apps.core.ContextManager.getActiveContext().getId() === "LISTGUIDE") {
			states.channelList.updateChannelList(false);
		}
	}

	/**
	 * @method subscribeToPVRStatusUpdateEvent
	 * @private
	 */
	function subscribeToPVRStatusUpdateEvent() {
		if (PVRSubscriptionIds.length === 0) {
			// we are adding these subscribe events to an array as we do not specifically need to know the Ids
			PVRSubscriptionIds = $N.app.PVRCapability.subscribeToPVRCapabilityEvent(PVRStatusUpdateListener, PVRStatusUpdateListener, ListGuide);
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
	 * @method subscribeToPIPEnabledEvent
	 * @private
	 */
	function subscribeToPIPEnabledEvent() {
		log("subscribeToPIPEnabledEvent", "Enter & Exit");
		if (!PIPEnabledSubscriptionId) {
			PIPEnabledSubscriptionId = $N.apps.util.EventManager.subscribe("PIPEnabled", PIPEnabledListener, me);
		}
	}

	/**
	 * @method subscribeToPIPDisabledEvent
	 * @private
	 */
	function subscribeToPIPDisabledEvent() {
		log("subscribeToPIPDisabledEvent", "Enter & Exit");
		if (!PIPDisabledSubscriptionId) {
			PIPDisabledSubscriptionId = $N.apps.util.EventManager.subscribe("PIPDisabled", PIPDisabledListener, me);
		}
	}

	/**
	 * @method addServiceUpdatedListener
	 * @private
	 */
	function addServiceUpdatedListener() {
		log("addServiceUpdatedListener", "Enter & Exit");
		$N.app.ChannelManager.addServiceUpdatedListener(serviceUpdated, "ListGuide");
	}

	/**
	 * @method updateSummaryTitle
	 * @public
	 * @param {String} title
	 */
	function updateSummaryTitle(title) {
		log("updateSummaryTitle", "Enter & Exit");
		summary.setTitle(title);
	}

	/**
	 * @method setupOptionButtons
	 * @private
	 */
	function setupOptionButtons() {
		log("setupOptionButtons", "Enter");
		view.buttonIcons.searchButton.setText(ListGuide.getString("search"));
		view.buttonIcons.filterButton.setText(ListGuide.getString("filter"));
		view.buttonIcons.modeButton.setText(ListGuide.getString(displayListGuideModeText));
		view.buttonIcons.optionButton.setText(ListGuide.getString("options"));
		view.buttonIcons.recordButton.setText(ListGuide.getString("record"));

		log("setupOptionButtons", "Exit");
	}

	/**
	 * @method returnToChannelList
	 */
	function returnToChannelList() {
		log("returnToChannelList", "Enter");
		if (states.eventList.isTimeListMode()) {
			currentState = states.channelList;
			states.channelList.focus();
		}
		log("returnToChannelList", "Exit");
	}

	/**
	 * @method favouritesCallback
	 */
	function favouritesCallback() {
		log("favouritesCallback", "Enter");
		if (currentState === states.eventList) {
			returnToChannelList();
		}
		log("favouritesCallback", "Exit");
	}

	/**
	 * @method showNoFavoriteText
	 */
	function showNoFavoriteText() {
		if (states.eventList.isTimeListMode()) {
			noFavouriteChannelsView.center.setText(ListGuide.getString("noFavourites"));
			noFavouriteChannelsView.center.show();
			states.eventList.showBackgroundOnly();
		} else {
			noFavouriteChannelsView.left.setText(ListGuide.getString("noFavourites"));
			noFavouriteChannelsView.left.show();
			noFavouriteChannelsView.emptyGridBackgroundGroup.show();
		}
	}

	/**
	 * @method hideNoFavoriteText
	 */
	function hideNoFavoriteText() {
		if (states.eventList.isTimeListMode()) {
			noFavouriteChannelsView.center.hide();
		} else {
			noFavouriteChannelsView.left.hide();
			noFavouriteChannelsView.emptyGridBackgroundGroup.hide();
		}
	}

	/**
	 * @method favouritesCallback
	 */
	function showNoFavoriteChannel() {
		log("showNoFavoriteChannel", "Enter");
		updateCatchupTitle(false);
		showNoFavoriteText();
		//noFavouriteChannelsView.summary.setText(ListGuide.getString("noChannelsFound"));
		//noFavouriteChannelsView.summary.show();
		states.channelList.hideCatchupLabel();
		//noFavouriteChannelsView.noFavoriteChannelsSummary.setText(ListGuide.getString("noChannelsFound"));
		noFavouriteChannelsView.noFavoriteChannelsSummary.show();
		noFavouriteChannelsView.emptyChannelBackgroundGroup.show();
		//view.msgForFavourite.setText(ListGuide.getString("msgForFavourite"));
		//view.msgForFavourite.show();
		view.guideFavOK.okIcon.setText(ListGuide.getString("addToFavourite"));
		view.guideFavOK.okIcon.show();
		states.eventList.showBackgroundOnly();
		log("showNoFavoriteChannel", "Exit");
	}

	/**
	 * @method favouritesCallback
	 */
	function showNoFilterChannelInfo() {
		log("showNoFilterChannelInfo", "Enter");
		noFavouriteChannelsView.center.setText(ListGuide.getString("noFilterChannel"));
		noFavouriteChannelsView.center.show();
		view.msgForFavourite.hide();
		updateCatchupTitle(false);
		states.eventList.passivate();
		log("showNoFilterChannelInfo", "Exit");
	}

	/**
	 * @method favouritesCallback
	 */
	function hideNoFilterChannelInfo() {
		log("showNoFilterChannelInfo", "Enter");
		noFavouriteChannelsView.center.hide();
		noFavouriteChannelsView.noFavoriteChannelsSummary.hide();
		view.msgForFavourite.hide();
		view.guideFavOK.okIcon.hide();
		log("showNoFilterChannelInfo", "Exit");
	}

	/**
	 * @method hideNoFavoriteChannel
	 */
	function hideNoFavoriteChannel() {
		log("hideNoFavoriteChannel", "Enter");
		hideNoFavoriteText();
		noFavouriteChannelsView.emptyChannelBackgroundGroup.hide();
		noFavouriteChannelsView.noFavoriteChannelsSummary.hide();
		view.msgForFavourite.hide();
		view.guideFavOK.okIcon.hide();
		view.channelListGroup.show();
		$N.app.BrandHelper.show($N.app.BrandHelper.GUIDE_BACKGROUND_ID);
		$N.app.ClockDisplay.show();
		log("hideNoFavoriteChannel", "Exit");
	}

	/**
	 * @method updateNoChannel
	 */
	function gotoNoEpgState() {
		log("hideNoFavoriteChannel", "Enter");
		states.eventList.passivate();
		states.channelList.passivate();
		noFavouriteChannelsView.center.hide();
		noFavouriteChannelsView.summary.hide();
		view.msgForFavourite.hide();
		view.guideFavOK.okIcon.hide();
		$N.app.BrandHelper.hideAll();
		$N.app.ClockDisplay.hide();
		currentState = states.noEpg;
		currentState.activate();
		log("hideNoFavoriteChannel", "Exit");
	}

	/**
	 * @method channelSelectedCallback
	 */
	function channelSelectedCallback(channelData) {
		log("channelSelectedCallback", "Enter");
		currentState = states.eventList;
		currentState.activate(channelData);
		log("channelSelectedCallback", "exit");
	}

	/**
	 * @method channelHighlightedCallback
	 */
	function channelHighlightedCallback(focusedChannel, viewableChannels, scheduleEvent) {
		log("channelHighlightedCallback", "Enter");
		var selectedItem = states.eventList.getSelectedItem(),
			serviceId = null;
		states.eventList.preview(focusedChannel, viewableChannels, scheduleEvent);
		if (selectedItem && selectedItem.serviceId) {
			serviceId = selectedItem.serviceId;
		}
		log("event.serviceId and channel.servicdId", serviceId + " and " + focusedChannel.serviceId);
		if (serviceId === focusedChannel.servicdId) {
			updateSummary(selectedItem, focusedChannel);
			updateOptionIcon(selectedItem);
		}
		log("channelHighlightedCallback", "exit");
	}

	/**
	 * @method eventHighlightedCallback
	 */
	function eventHighlightedCallback(eventData, channelData) {
		log("eventHighlightedCallback", "Enter");

		//Adding context check as a temporary fix as the event highlighted callback
		// is getting called multiple times even if we exit to zapper.
		if (!isEmptyChannel && $N.apps.core.ContextManager.getActiveContext().getId() === "LISTGUIDE") {
			updateSummary(eventData, channelData);
			updateOptionIcon(eventData);
		}
		log("eventHighlightedCallback", "exit");
	}

	/**
	 * @method updateChannelListCallback
	 */
	function updateChannelListCallback(channelListStatus) {
		log("updateChannelListCallback", "Enter");
		switch (channelListStatus) {
		case $N.app.constants.CHANNEL_LIST_STATUS.FAVOURITE:
			hideNoFavoriteChannel();
			isEmptyChannel = false;
			break;
		case $N.app.constants.CHANNEL_LIST_STATUS.EMPTY_ALL:
			gotoNoEpgState();
			isEmptyChannel = true;
			break;
		case $N.app.constants.CHANNEL_LIST_STATUS.EMPTY_FAVOURITE:
			showNoFavoriteChannel();
			isEmptyChannel = true;
			break;
		case $N.app.constants.CHANNEL_LIST_STATUS.ALL:
			hideNoFavoriteChannel();
			isEmptyChannel = false;
			break;
		case $N.app.constants.CHANNEL_LIST_STATUS.EMPTY_FILTER:
			showNoFilterChannelInfo();
			isEmptyChannel = true;
			break;
		case $N.app.constants.CHANNEL_LIST_STATUS.FILTER:
			hideNoFilterChannelInfo();
			isEmptyChannel = false;
			break;
		default:
			break;
		}
		if (isEmptyChannel === true) {
			summary.stopPip();
			view.buttonIcons.hide();
			view.summary.hide();
		} else {
			view.buttonIcons.show();
		}
		log("updateChannelListCallback", "Exit");
	}

	/**
	 * @method changeFilter
	 * @param {Boolean} reset
	 * @param {Boolean} selectFirstChannel
	 * @param {Boolean} shouldUpdateTimeWindow
	 */
	function changeFilter(reset, selectFirstChannel, shouldUpdateTimeWindow) {
		log("changeFilter", "Enter");
		states.eventList.setShouldUpdateTimeWindow(shouldUpdateTimeWindow);
		noFavouriteChannelsView.emptyChannelBackgroundGroup.hide();
		noFavouriteChannelsView.emptyGridBackgroundGroup.hide();
		hideNoFavoriteText();
		updateCatchupTitle(false);
		states.channelList.changeFilter(reset, selectFirstChannel);
		log("changeFilter", "Exit");
	}

	/**
	 * @method changeMode
	 */
	function changeMode() {
		log("changeMode", "Enter");
		if (isEmptyChannel) {
			log("changeMode", "Exit 1");
			return;
		}
		setRememberEventOn();
		var noWidthChange = true;
		if (currentState === states.channelList) {
			currentState.passivate();
			currentState = states.eventList;
		}
		states.eventList.changeMode();
		if (states.eventList.isTimeListMode()) {
			states.channelList.showConnectorToEventList();
			view.buttonIcons.modeButton.setText(ListGuide.getString("grid"), noWidthChange);
		} else {
			states.channelList.hideConnectorToEventList();
			view.buttonIcons.modeButton.setText(ListGuide.getString("list"), noWidthChange);
		}
		log("changeMode", "Exit");
	}

	/**
	 * @method handleViewReset
	 * @return {Boolean} handled
	 */
	function handleViewReset() {
		log("handleViewReset", "Enter");
		var eventOnFocus = states.eventList.getSelectedItem(),
			channelOnFocus = states.channelList.getSelectedItem();
		if (!isEmptyChannel && !isCurrentStateChannelList() && !eventUtil.isEventShowingNow(eventOnFocus)) {
			states.eventList.activate();
			states.eventList.focusOnNowEvent(channelOnFocus);
			log("handleViewReset", "Exit 1");
			return true;
		}
		log("handleViewReset", "Exit 2");
		return false;
	}

	pinHelper = new $N.app.PinHelper(null, null, null, null, $N.app.constants.PIN_DIALOG_SHOW_TIME, false);

	/**
	 * @method directChannelEntryHandle
	 * @public
	 * @param {String} key
	 * @return {Boolean} handled
	 */
	function directChannelEntryHandler(key, repeats) {
		log("directChannelEntryHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			channelListController = states.channelList,
			isActiveOfDirectChannelEntry = channelListController.isActiveOfDirectChannelEntry(),
			event = states.eventList.getSelectedItem(),
			isEventShowingNow = $N.app.EventUtil.isEventShowingNow(event),
			handled = false;
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
			handled = channelListController.keyHandler(key, repeats);
			break;
		case keys.KEY_LEFT:
		case keys.KEY_OK:
			if (isActiveOfDirectChannelEntry) {
				handled = channelListController.keyHandler(key, repeats);
			}
			break;
		default:
			if ($N.app.GeneralUtil.isKeyReleaseEvent(key)) {
				log("directChannelEntryHandle", "Exit 1");
				return false;
			}
			if (isActiveOfDirectChannelEntry) {
				channelListController.cancelEntryForDirectChannelEntry();
			}
		}
		log("directChannelEntryHandle", "Exit 2");
		return handled;
	}

	return {
		/**
		 * Entry point of the application for the SVG onload event
		 * @method load
		 */
		load: function () {
			log("load", "Enter");
			$N.gui.ResolutionManager.initialiseContext(document);
			$N.apps.core.Language.importLanguageBundleForObject(ListGuide, ListGuide.init, "apps/listGuide/common/", "LanguageBundle.js", setupOptionButtons, window);
			log("load", "Exit");
		},

		/**
		 * Application lifecycle initialisation method to create the view
		 * @method init
		 */
		init: function () {
			log("init", "Enter");
			$N.gui.FrameworkCore.loadGUIFromXML("apps/listGuide/view/listGuide.xml", document.getElementById("content"), view, window);
			var eventList = new EventList(ListGuide, view.eventListGroup),
				channelList = new ChannelList(ListGuide, view.channelListGroup),
				noEpg = new NoEpg(ListGuide, view.noEpg);

			eventUtil = $N.app.EventUtil;
			parentalControl = $N.app.ParentalControlUtil;
			catchUpHelper = $N.app.CatchUpHelper;

			guideTitle = view.channelListGroup.guideTitle;
			noFavouriteChannelsView = view.noChannels.favorite;
			states = {
				channelList: channelList,
				eventList: eventList,
				noEpg: noEpg,
				nullState: {
					keyHandler: function () {
						return false;
					}
				}
			};
			states.eventList.initialise(returnToChannelList);
			states.channelList.initialise();
			states.channelList.setFavouritesToggledCallback(favouritesCallback);
			states.channelList.setUpdateChannelListCallback(updateChannelListCallback);
			states.channelList.setChannelHighlightedCallback(channelHighlightedCallback);
			states.channelList.setChannelSelectedCallback(channelSelectedCallback);

			states.eventList.setEventHighlightedCallback(eventHighlightedCallback);

			subscribeToPIPEnabledEvent();
			subscribeToPIPDisabledEvent();
			addServiceUpdatedListener();

			currentState = states.nullState;
			summary = view.summary;
			summaryFade = view.summaryFade;
			summary.setSummaryFade(summaryFade);
			summary.setIsPIPEnabled($N.app.FeatureManager.isPIPEnabled());
			displayListGuideModeText = (prefGuideMode === GUIDE_MODE.GRID) ? GUIDE_MODE.LIST : GUIDE_MODE.GRID;
			if (prefGuideMode === GUIDE_MODE.GRID) {
				displayListGuideModeText = GUIDE_MODE.LIST;
				states.channelList.hideConnectorToEventList();
			} else {
				displayListGuideModeText = GUIDE_MODE.GRID;
				states.channelList.showConnectorToEventList();
			}
			setupOptionButtons();
			summary.activatePip();
			guideTitle.setParentLabelCss("breadcrumbTitle inlineText");
			guideTitle.setChildLabelCss("breadcrumbSubTitle inlineText breadcrumbTitle");
			guideTitle.setCatchupLabelCss("titleHighlight guideTitle inlineText");
			view.guideFavOK.okIcon.setCssClassForLabel("addToFavTitle");
			$N.apps.core.ContextManager.initialisationComplete(ListGuide);
			log("init", "Exit");
		},

		/**
		 * Application lifecycle activation method to draw the view
		 * @method activate
		 * @param {Object} activationObject
		 */
		activate: function (activationObject) {
			log("activate", "Enter");
			states.channelList.preview(activationObject);
			setRememberEventOff();
			$N.app.BrandHelper.show($N.app.BrandHelper.GUIDE_BACKGROUND_ID);
			$N.app.ClockDisplay.show();
			$N.app.PVRUtil.registerUIRefreshListener(uiRefreshListener, this);
			// update view when user changes due to pin entry
			$N.platform.ca.ParentalControl.setUserChangedCallback(function () {
				if (!isOptionsMode) {
					updateSummary(states.eventList.getSelectedItem());
					states.eventList.update();
				}
			});
			subscribeToPVRStatusUpdateEvent();
			$N.app.PVRCapability.subscribeWHPvrDeviceUpdate(PVRStatusUpdateListener);
			states.eventList.setShouldUpdateTimeWindow(true);
			if (activationObject && activationObject.event && !isEmptyChannel) {
				states.channelList.defocus();
				currentState = states.eventList;
				currentState.activate(states.channelList.getSelectedItem());
			} else if (activationObject && activationObject.genreToBeLoaded) {
				states.channelList.setCurrentGenre(activationObject.genreToBeLoaded - 1);
				changeFilter(false, true, true);
			} else {
				currentState = states.channelList;
				currentState.activate();
			}
			if (states.channelList.getChannelListStatus() === $N.app.constants.CHANNEL_LIST_STATUS.EMPTY_ALL) {
				gotoNoEpgState();
			}
			states.channelList.subscribeToFavouritesToggledEvent();
			$N.platform.btv.PVRManager.setRecordingRequestConflictsCallback($N.app.Conflicts.onRecordingFailed);
			log("activate", "Exit");
		},

		/**
		 * Application lifecycle passivation method to hide the view
		 * @method passivate
		 */
		passivate: function () {
			log("passivate", "Enter");
			$N.app.BrandHelper.show($N.app.BrandHelper.GUIDE_BACKGROUND_ID);
			summary.stopPip();

			if (currentState === states.eventList) {
				states.channelList.passivate();
				states.noEpg.passivate();
				currentState.passivate();
			} else if (currentState === states.channelList) {
				currentState.passivate();
				states.eventList.passivate();
				states.noEpg.passivate();
			} else if (currentState === states.noEpg) {
				currentState.passivate();
				states.channelList.passivate();
			}
			states.channelList.unsubscribeFromFavouritesToggledEvent();
			currentState = states.nullState;
			isOptionsMode = false;
			stateBeforeOption = null;
			setRememberEventOff();
			$N.app.BrandHelper.hideAll();
			$N.app.ClockDisplay.hide();

			stopUIRefreshTimeout();
			$N.app.PVRUtil.unregisterUIRefreshListener(uiRefreshListener);
			unsubscribeFromPVRStatusUpdateEvent();
			$N.app.PVRCapability.unSubscribeWHPvrDeviceUpdate(PVRStatusUpdateListener);
			$N.app.TimerUtil.stopTimer("recordIcon");
			$N.platform.btv.PVRManager.setRecordingRequestConflictsCallback(function () {});
			try {
				$N.apps.util.EventManager.unSubscribe("WHPVRcreateTask");
			} catch (e) {
				log("passivate", "EventManager unSubscribe error");
			}
			log("passivate", "Exit");
		},

		/**
		 * @method focus
		 */
		focus: function () {
			log("focus", "Enter");
			var hiddenBy = $N.apps.core.ContextManager.getActiveContext().getHiddenBy();

			// Only reset the list guide if context is not overlaid or SEARCH/SYNOPSIS
			if (hiddenBy && (hiddenBy.getId() !== "SYNOPSIS") && (hiddenBy.getId() !== "SEARCH") && (hiddenBy.getId() !== "MEDIAPLAYER")) {
				if (currentState === states.eventList) {
					states.channelList.passivate();
					states.noEpg.passivate();
					currentState.passivate();
				} else if (currentState === states.channelList) {
					currentState.passivate();
					states.eventList.passivate();
					states.noEpg.passivate();
				} else if (currentState === states.noEpg) {
					currentState.passivate();
					states.channelList.passivate();
				}

				states.eventList.setShouldUpdateTimeWindow(true);
				states.channelList.preview();

				states.channelList.defocus();
				currentState = states.eventList;
				currentState.activate(states.channelList.getSelectedItem());
			} else {
				states.eventList.focus();
			}

			states.channelList.subscribeToFavouritesToggledEvent();
			updateSummary(states.eventList.getSelectedItem());
			$N.app.ClockDisplay.show();
			$N.app.BrandHelper.show($N.app.BrandHelper.GUIDE_BACKGROUND_ID);
			log("focus", "exit");
		},

		/**
		 * @method focus
		 */
		defocus: function () {
			log("defocus", "Enter");
			states.channelList.resetFilter();
			states.channelList.unsubscribeFromFavouritesToggledEvent();
			//To avoid the stop pip call if exit is pressed.
			//On exit, zapper activate gets called first and then list-guide defocus.
			//This caused the mini-guide-pip to disappear.
			if (!isExitPressed) {
				summary.stopPip();
			}
			isExitPressed = false;
			hideSummary();
			states.eventList.defocus();
			log("defocus", "exit");
		},

		/**
		 * Application lifecycle method to return the context name
		 * @method toString
		 */
		toString: function () {
			return "LISTGUIDE";
		},

		/**
		 * @method beforeEventChange
		 */
		beforeEventChange: function () {
			summary.onEventChange();
		},

		/**
		 * Main keyHandler method
		 * @param {String} key
		 */
		keyHandler: function (key, repeats) {
			log("keyHandler", key);
			var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
				handled = false,
				channelListStatus = states.channelList.getChannelListStatus(),
				currentGenre = states.channelList.getCurrentGenre();
			if (key === keys.KEY_BLUE) {
				showOptionsMenu();
				return true;
			}
			if (key === keys.KEY_OK) {
				if (currentGenre === $N.app.genreUtil.GENRE_FAVORITE) {
					if (channelListStatus === $N.app.constants.CHANNEL_LIST_STATUS.EMPTY_FAVOURITE) {
						$N.app.FavouritesUtil.launchFavoritesApp();
						return true;
					}
				}
			}
			if (key === keys.KEY_EXIT) {
				isExitPressed = true;
			}
			handled = currentState.keyHandler(key, repeats);
			$N.app.MemoryUtil.setOrUpdateGarbageCollectTimeoutAndInterval();

			if (!handled) {
				switch (key) {
				case keys.KEY_BACK:
					handled = handleViewReset();
					break;
				case keys.KEY_LEFT:
					if (currentState === states.channelList) {
						$N.app.ContextHelper.closeContext();
						handled = true;
					}
					break;
				case keys.KEY_GUIDE:
					summary.stopPip();
					states.channelList.resetFilter();
					$N.app.ContextHelper.closeContext();
					handled = true;
					break;
				case keys.KEY_INFO:
					if (!isEmptyChannel) {
						navigateToSynopsis();
						handled = true;
					}
					break;
				case keys.KEY_RED:
					if (!isEmptyChannel) {
						summary.stopPip();
						states.channelList.passivate();
						$N.app.ContextHelper.openContext("SEARCH", {
							activationContext: {
								confirmLeftExit : true
							}
						});
						handled = true;
					}
					break;
				case keys.KEY_YELLOW:
					changeMode();
					handled = true;
					break;
				case keys.KEY_GREEN:
					changeFilter(false, true, false);
					handled = true;
					break;
				case keys.KEY_PPV:
					states.channelList.setCurrentGenre($N.app.genreUtil.GENRE_PPV - 1);
					changeFilter(false, true, false);
					handled = true;
					break;
				}
			}
			log("keyHandler", "Exit");
			return handled;
		},

		/**
		 * @method selectChannel
		 */
		selectChannel: function () {
			var serviceId = states.channelList.getCurrentServiceId(),
				channelObject;
			if (eventUtil.isValidServiceId(serviceId)) {
				channelObject = $N.platform.btv.EPG.getChannelByServiceId(serviceId);
				states.channelList.itemSelected(channelObject);
			}
		},

		selectNextChannel: function () {
			return states.channelList.selectNext();
		},

		selectPreviousChannel: function () {
			return states.channelList.selectPrevious();
		},

		selectNextPageChannel: function () {
			return states.channelList.selectNextPage();
		},

		selectPreviousPageChannel: function () {
			return states.channelList.selectPreviousPage();
		},

		/**
		 * Returns the states object of the list guide
		 * @method getStates
		 * @return {Object}
		 */
		getStates: function () {
			return states;
		},

		/**
		 * Sets the list guide to the given state
		 * @method setState
		 * @param {Object} newState
		 */
		setState: function (newState) {
			currentState = newState;
		},

		/**
		 * @method hideSummaryElements
		 */
		hideSummaryElements: function () {
			log("hideSummaryElements", "Enter");
			view.buttonIcons.recordButton.hide();
			summary.hideTitle();
			summary.hideEventDetails();
			log("hideSummaryElements", "Exit");
		},

		/**
		 * @method getViewableChannelList
		 */
		getViewableChannelList: function () {
			return states.channelList.returnViewableList();
		},

		/**
		 * @method getSelectChannelIndex
		 */
		getSelectChannelIndex: function () {
			return states.channelList.getViewSelectedRowIndex();
		},

		/**
		 * @method focusOnEventList
		 */
		focusOnEventList: function () {
			var serviceObj = states.channelList.getSelectedItem();
			states.channelList.passivate();
			states.eventList.activate(serviceObj);
			currentState = states.eventList;
		},

		/**
		 * @method isFocusOnLiveEvent
		 */
		isFocusOnLiveEvent: function () {
			return isLiveEvent;
		},

		/**
		 * @method isRememberEventOn
		 * @return {Boolean}
		 */
		isRememberEventOn: function () {
			return _rememberEvent;
		},

		/**
		 * @method isTimeListMode
		 * @return {Boolean}
		 */
		isTimeListMode: function () {
			return states.eventList.isTimeListMode();
		},

		directChannelEntryHandler: directChannelEntryHandler,
		updateCatchupTitle: updateCatchupTitle,
		updateSummary: updateSummary,
		updateSummaryTitle: updateSummaryTitle,
		showSummary: showSummary,
		navigateToContext: navigateToContext,
		itemSelected: itemSelected,
		setRememberEventOn: setRememberEventOn,
		setRememberEventOff: setRememberEventOff,
		hideSummary: hideSummary,
		setBreadCrumbParentAndChildTitle: setBreadCrumbParentAndChildTitle,
		showNoFavoriteChannel: showNoFavoriteChannel,
		hideNoFavoriteChannel: hideNoFavoriteChannel,
		isCatchUpEnabled: isCatchUpEnabled,
		isCurrentStateChannelList: isCurrentStateChannelList,
		handleViewReset: handleViewReset,
		returnToChannelList: returnToChannelList,
		updateVoltarButton: updateVoltarButton
	};

}(window.parent.$N));
