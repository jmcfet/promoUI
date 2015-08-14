/*global Miniguide*/
/**
 * Static Zapper application object.
 * @class Zapper
 */

var Zapper = (function () {
	var $N = window.parent.$N,
		epgUtil = $N.app.epgUtil,
		log = new $N.apps.core.Log("ZAPPER", "Zapper"),
		view = {},
		currentlyShowingServiceId,
		currentlyShowingServiceNumber,
		previousService = null,
		channelList = null,
		alwaysShowUnsubscribedChannels = false,
		favouritesToggledEventSubscriptionId = null,
		isReviewBufferAvailable = false,
		hideNoSignalDialogueSubscriptionId = null,
		PVRSubscriptionIds = [],
		caAccessDeniedSubscriptionId = null,
		caAccessDeniedUnsubscriptionCallback = null,

		miniguidePIP = null,

		summaryFade = null,

		pipData = null,

		isOptionsLaunched = false,
		channelCategories = {
			"RADIO" : "radioChannels",
			"SUBSCRIBED_CHANNELS" : "subscribedChannels",
			"ALL_CHANNELS" : "allChannels"
		},

		playoutRequest = {
			url: null,
			isLive: true,
			isMusic: null,
			context: null,
			serviceId: null,
			logicalChannelNum: null
		},

		playoutCasId = { casId: null },

		/**
		 * Makes a request to play a service based on the details stored in <code>playoutRequest</code>
		 * and <code>playoutCasId</code>.
		 * @method doRequestPlayout
		 * @private
		 */
		doRequestPlayout = function () {
			log("doRequestPlayout", "Enter");
			$N.app.fullScreenPlayer.requestPlayout(
				playoutRequest,
				true,
				playoutCasId
			);
			log("doRequestPlayout", "Exit");
		},

		/**
		 * Store the ID of the currently-playing service within this class and also in prefs, and update
		 * other state variables (such as the previous service).
		 * @method storeCurrentlyPlayingService
		 * @private
		 */
		storeCurrentlyPlayingService = function () {
			log("storeCurrentlyPlayingService", "Enter");
			previousService = Zapper.getCurrentService();
			currentlyShowingServiceId = playoutRequest.serviceId;
			currentlyShowingServiceNumber = epgUtil.getServiceById(currentlyShowingServiceId).logicalChannelNum;
			epgUtil.storeChannelToPrefs(currentlyShowingServiceId);
			log("storeCurrentlyPlayingService", "Exit");
		},

		// defined later due to circular jsLint issue with recordingRequestConflictsCallback
		setRecordingConflictsCallback,

		// callback when playout tuning is blocked by conflict management
		tuneBlockedByConflictCallback,

		/**
		 * The callback that is invoked if there are conflicts that need to be resolved before a
		 * channel can be recorded.
		 * @method recordingRequestConflictsCallback
		 * @param {array} failingTasks An array of task objects that are causing a conflict.
		 * @param {array} conflictingTasks An array of task objects that are conflicting with the failing tasks
		 */
		recordingRequestConflictsCallback = function (failingTasks, conflictingTasks) {
			log("recordingRequestConflictsCallback", "Enter");
			Zapper.miniguide.passivate();
			$N.app.Conflicts.recordingRequestConflictsCallback(failingTasks, conflictingTasks, setRecordingConflictsCallback);
			log("recordingRequestConflictsCallback", "Exit");
		},

		playerAtBeginningCallback = function () {
			log("playerAtBeginningCallback", "Enter - called back by the playerAtBeginning event");
			$N.app.fullScreenPlayer.trickPlay.play();
			Zapper.inTrickplayMode = true;
			log("playerAtBeginningCallback", "Exit");
		},

		playerCaughtUptoLiveListener = function () {
			log("playerCaughtUptoLiveCallback", "Enter");
			Zapper.inTrickplayMode = false;
			log("playerCaughtUptoLiveCallback", "Exit");
		},

		uiRefreshCallback = function (mode, speed) {
			log("uiRefreshCallback", "Enter - playback mode: " + mode + ", speed: " + speed);
			// This function will be required when trickplay functionality is implemented in NET
			log("uiRefreshCallback", "Exit");
		},

		/**
		 * Returns the service Id of the currently airing service
		 *
		 * @method getCurrentServiceId
		 * @return {Number} The number of the service Id
		 */
		getCurrentServiceId = function () {
			var currentServiceId = currentlyShowingServiceId || epgUtil.getChannelFromPrefs();
			return currentServiceId || null;
		};

	setRecordingConflictsCallback = function () {
		log("setRecordingConflictsCallback", "Enter");
		$N.platform.btv.PVRManager.setRecordingRequestConflictsCallback(recordingRequestConflictsCallback);
		$N.platform.btv.PVRManager.setTaskAboutToStartConflictCallback(recordingRequestConflictsCallback);
		Zapper.miniguide.updateIconsUIRefreshListener();
		log("setRecordingConflictsCallback", "Exit");
	};

	tuneBlockedByConflictCallback = function () {
		log("tuneBlockedByConflictCallback", "Enter");
		var recordings = $N.platform.btv.PVRManager.getActiveRecordings(),
			recordingsLength = recordings.length,
			i,
			service;
		if ($N.apps.core.ContextManager.getActiveContext().getId() !== "ZAPPER") {
			return;
		}
		if (recordings && recordingsLength) {
			if (!previousService) {
				previousService = Zapper.getCurrentService();
			}
			for (i = 0; i < recordingsLength; i++) {
				if (recordings[i]._data.serviceId === previousService.serviceId || recordings[i].serviceId === previousService.serviceId) {
					Zapper.updateBannerAndTuneIfNeeded(previousService);
					return;
				}
			}
			service = epgUtil.getServiceById(recordings[0]._data.serviceId || recordings[0].serviceId);
			Zapper.updateBannerAndTuneIfNeeded(service);
		} else {
			Zapper.updateBannerAndTuneIfNeeded(previousService);
		}
		log("tuneBlockedByConflictCallback", "Exit");
	};

	//$N.app.fullScreenPlayer.trickPlay.setPlayerAtBeginningCallback(playerAtBeginningCallback);
	//$N.app.fullScreenPlayer.registerCaughtUptoLiveListener(playerCaughtUptoLiveListener);
	//$N.app.fullScreenPlayer.setTuneBlockedByConflictManagmentCallback(tuneBlockedByConflictCallback);
	//$N.app.fullScreenPlayer.trickPlay.setUIRefreshCallback(uiRefreshCallback);

	/**
	 * @method PVRStatusUpdateListener
	 * @status {Object} the status object for PVR
	 * @private
	 */
	function PVRStatusUpdateListener(status) {
		log("PVRStatusUpdateListener", "Enter");
		if (!$N.app.PVRCapability.isPVREnabled()) {
			Zapper.updateBannerAndTuneIfNeeded(Zapper.getCurrentService());
		}
		log("PVRStatusUpdateListener", "Exit");
	}

	/**
	 * @method subscribeToPVRStatusUpdateEvent
	 * @private
	 */
	function subscribeToPVRStatusUpdateEvent() {
		if (PVRSubscriptionIds.length === 0) {
			// we are adding these subscribe events to an array as we do not specifically need to know the Ids
			PVRSubscriptionIds = $N.app.PVRCapability.subscribeToPVRCapabilityEvent(PVRStatusUpdateListener, PVRStatusUpdateListener, Zapper);
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
	 * @method reviewBufferSuccessListener
	 * @status {Object} e - the status object for the review buffer
	 * @private
	 */
	function reviewBufferSuccessListener(e) {
		log("reviewBufferSuccessListener", "Enter - review buffer");
		isReviewBufferAvailable = true;
		log("reviewBufferSuccessListener", "Exit");
	}


	/**
	 * @method reviewBufferFailedListener
	 * @status {Object} e - the status object for the review buffer
	 * @private
	 */
	function reviewBufferFailedListener(e) {
		log("reviewBufferFailedListener", "Enter - no review buffer");
		isReviewBufferAvailable = false;
		Zapper.inTrickplayMode = false;
		log("reviewBufferFailedListener", "Exit");
	}

	/**
	 * @method subscribeToReviewBufferUpdateEvent
	 * @private
	 */
	function subscribeToReviewBufferUpdateEvent() {
		$N.app.fullScreenPlayer.registerReviewBufferCallbacks(reviewBufferSuccessListener, reviewBufferFailedListener);
	}

	/**
	 * @method unsubscribeFromReviewBufferUpdateEvent
	 * @private
	 */
	function unsubscribeFromReviewBufferUpdateEvent() {
		$N.app.fullScreenPlayer.unregisterReviewBufferCallbacks(reviewBufferSuccessListener, reviewBufferFailedListener);
	}

	/**

	 * @method subscribeHideNoSignalDialogueListener

	 * @private

	 */

	function subscribeHideNoSignalDialogueListener() {

		if (!hideNoSignalDialogueSubscriptionId) {

			hideNoSignalDialogueSubscriptionId = $N.apps.util.EventManager.subscribe("HideNoSignalDialogue", Zapper.hideNoSignalDialogue, Zapper);

		}

	}



	/**
	 * @method unSubscribeHideNoSignalDialogueListener

	 * @private

	 */

	function unSubscribeHideNoSignalDialogueListener() {

		if (hideNoSignalDialogueSubscriptionId) {

			$N.apps.util.EventManager.unSubscribe(hideNoSignalDialogueSubscriptionId);

			hideNoSignalDialogueSubscriptionId = null;

		}
	}



	/**
	 * Sets the data of the GridList to the given channels, and
	 * refreshes if redraw is true
	 * @method setChannelData
	 * @private
	 */
	function setChannelData(channels, redraw) {
		channelList.setData(channels);
		var storedServiceId = $N.app.epgUtil.getChannelFromPrefs(),
			index = Zapper.getServiceIndex(storedServiceId);
		if (currentlyShowingServiceId && redraw) {
			if (!storedServiceId || $N.app.epgUtil.getNumServices() === 0 || index === null) {
				channelList.selectRowAtIndex(0);
				Zapper.miniguide.update(channels[0], null);
			} else {
				channelList.selectRowAtIndex(index);
				Zapper.miniguide.update(channels[index], null);
			}
		}
	}

	/**
	 * Checks whether channel exists in Favourites folder
	 *
	 * @method isChannelInFavourites
	 * @param {Int} serviceId
	 * @private
	 * @return true if channel found in Favourites folder, false otherwise
	 */
	function isChannelInFavourites(serviceId) {
		var found = false,
			i,
			currentFavs = $N.platform.btv.Favourites.getFavouriteChannels($N.platform.system.Preferences.get($N.app.constants.PREF_TV_CATEGORY));
		for (i = 0; i < currentFavs.length; i++) {
			if (currentFavs[i].serviceId === serviceId) {
				found = true;
				break;
			}
		}
		return found;
	}

	/**
	 * If current channel isn't a favourite, then we want to remove it from favourite list,
	 * as we don't want it to appear on zapper any more
	 *
	 * @method validateFavouritesList
	 * @param {Object} channel - the current channel object
	 * @param {Int} channelId - the current channel id
	 * @param {Array} favouritesList
	 * @param {Boolean} isCalled - a flag to indicate if the method has already been called (true);
	*					the reason for that is that the method can be called from different
	*					places in the code and we want to ensure it's only called once per channel change
	 * @private
	 * @return true if current channel removed from favourite list, false otherwise
	 */
	function validateFavouritesList(channel, channelId, favouritesList, isCalled) {
		var popped = false;

		if (!isChannelInFavourites(channelId) && !isCalled) {
			favouritesList.pop(channel);
			popped = true;
		}
		return popped;
	}

	/**
	 * Callback used when exiting CA popups
	 * @method handleCAPopupExit
	 * @param {Object, String} items object, key string
	 */
	function handleCAPopupExit(item, key) {
		var keys = $N.apps.core.KeyInterceptor.getKeyMap();
		if (item.action === $N.app.constants.OK_OPTION || key === keys.KEY_LEFT || key === keys.KEY_BACK || key === keys.KEY_EXIT) {
			Zapper.updateBannerAndTuneIfNeeded(previousService);
		}
	}

	/**
	 * Tunes to the selected service. Also sets the new service id in CCOM preferences.
	 *
	 * @method changeChannel
	 * @param {Object} service
	 */
	function changeChannel(service) {
		log("changeChannel", "Enter");
		if (service && Zapper.isShowingFavourites() && service !== Zapper.getCurrentService()) {
			validateFavouritesList(Zapper.getCurrentService(), Zapper.getCurrentServiceId(), Zapper.getServicesArray());
		}
		var previousService = Zapper.getCurrentService();
		if (service) {
			if (service.isSubscribed || alwaysShowUnsubscribedChannels) {
				log("changeChannel", "channel URI: " + service.uri + ", service id: " + service.serviceId);
				playoutRequest.url = service.uri;
				playoutRequest.isMusic = $N.platform.btv.EPG.isRadioChannel(service);
				playoutRequest.serviceId = service.serviceId;
				playoutRequest.context = Zapper.toString();
				playoutRequest.logicalChannelNum = service.logicalChannelNum;
				playoutCasId.casId = (service.conditionalAccessIDs) ? service.conditionalAccessIDs[0] : null;
				storeCurrentlyPlayingService();
				$N.app.TracksUtil.deactivateCurrentSubtitleTrack();
				Zapper.miniguide.setAudioSubtitleChangedOnStreamStartedStatus(false);
				doRequestPlayout();
			} else {
				$N.app.fullScreenPlayer.stopPlayout();
				storeCurrentlyPlayingService();
				log("changeChannel", "the current service has been set in CCOM prefs to: " + service.serviceId);
			}
			$N.apps.util.EventManager.fire("channelChanged", {previousService: previousService, currentService: service});
		} else {
			log("changeChannel", "service id is invalid or null");
		}
		log("changeChannel", "Exit");
	}

	/**
	 * Adds the current channel to the given service list if it is not in it
	 * @method addCurrentChannel
	 * @private
	 * @return {Array} list of services with the current channel in
	 */
	function addCurrentChannel(services) {
		var currentChannelInList = false,
			currentService = Zapper.getCurrentService(),
			i;
		for (i = 0; i < services.length; i++) {
			if (services[i].logicalChannelNum === currentService.logicalChannelNum) {
				currentChannelInList = true;
				break;
			}
		}
		if (!currentChannelInList) {
			services.push(currentService);
		}
		return services;
	}

	/**
	 * @method getChannelsByCurrentCategoryName
	 * @param {String} currentCategoryName
	 * @private
	 */
	function getChannelsByCurrentCategoryName(currentCategoryName) {
		var channels = [];
		if (currentCategoryName === channelCategories.ALL_CHANNELS) {
			channels =  $N.platform.btv.EPG.getVideoChannelsOrderedByChannelNumber();
		} else if (currentCategoryName === channelCategories.SUBSCRIBED_CHANNELS) {
			channels =  $N.platform.btv.EPG.getSubscribedChannelsOrderedByChannelNumber();
		} else if (currentCategoryName === channelCategories.RADIO) {
			channels =  $N.platform.btv.EPG.getRadioChannelsOrderedByChannelNumber();
		} else {
			channels = $N.app.epgUtil.getChannelsForCategory(currentCategoryName);
			channels = addCurrentChannel(channels);
		}
		return channels;
	}

	/**
	 * overlay callback function to perform tasks such as switch channels or display miniguide.
	 * @method returnFromTimeshiftCallback
	 * @param {Object} data
	 * @private
	 */
	function returnFromTimeshiftCallback(data) {
		if (data && data.key) {
			Zapper.keyHandler(data.key, false);
		} else if (!data) {
			Zapper.updateBannerAndTuneIfNeeded(Zapper.getCurrentService());
		}
	}


	/**
	 * @method navigateToTimeShiftPlayer
	 * @param {String} key
	 * @private
	 */
	function navigateToTimeShiftPlayer(key) {
		var currentEvent = $N.app.epgUtil.getEvent("current", Zapper.getCurrentServiceId()),
			currentAudio = $N.app.fullScreenPlayer.tracks.getActiveAudioTrack(),
			currentSubtitle = $N.app.fullScreenPlayer.tracks.getActiveSubtitleTrack();
		$N.app.ContextHelper.openContext("MEDIAPLAYER", {
			activationContext: {
				type : "TIMESHIFT",
				skip: true,
				trickplay: true,
				triggerKey: key,
				event: currentEvent,
				audiotrack: currentAudio,
				subtitletrack: currentSubtitle,
				context: "ZAPPER"
			},
			navCompleteCallback: returnFromTimeshiftCallback
		});
	}
	/**
	 * @method favouritesToggledListener
	 * @private
	 */
	function favouritesToggledListener() {
		var currentCategoryName = $N.platform.system.Preferences.get($N.app.constants.PREF_TV_CATEGORY),
			channels = getChannelsByCurrentCategoryName(currentCategoryName);
		setChannelData(channels);
	}

	/**
	 * @method subscribeToFavouritesToggledEvent
	 * @private
	 */
	function subscribeToFavouritesToggledEvent() {
		if (!favouritesToggledEventSubscriptionId) {
			favouritesToggledEventSubscriptionId = $N.apps.util.EventManager.subscribe("favouritesToggled", favouritesToggledListener, Zapper);
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
		}
	}

	/**
	 * Called to allow access denied popups to appear
	 * @method subscribeCaAccessDeniedEvent
	 * @private
	 */
	function subscribeCaAccessDeniedEvent() {
		if (!caAccessDeniedSubscriptionId) {
			caAccessDeniedSubscriptionId = $N.apps.util.EventManager.subscribe("caPPVAccessDenied", Zapper.miniguide.caPPVAccessDeniedListener, Zapper);
		}
	}

	/**
	 * Called to stop access denied popups from appearing
	 * @method unSubscribeCaAccessDeniedEvent
	 * @private
	 */
	function unSubscribeCaAccessDeniedEvent() {
		if (caAccessDeniedSubscriptionId) {
			$N.apps.util.EventManager.unSubscribe(caAccessDeniedSubscriptionId);
			caAccessDeniedSubscriptionId = null;
			if (caAccessDeniedUnsubscriptionCallback) {
				caAccessDeniedUnsubscriptionCallback();
			}
		}
	}

	/**
	 * Called when the EPG update happens
	 * @method channelListRefreshCallback
	 * @private
	 */
	function channelListRefreshCallback() {
		var currentService = Zapper.getCurrentService(),
			currentCategoryName = $N.platform.system.Preferences.get($N.app.constants.PREF_TV_CATEGORY),
			channels = getChannelsByCurrentCategoryName(currentCategoryName),
			me = this;

		setChannelData(channels, false);

		if (!currentService.serviceId) { //when the current service is removed we have to retune to the same logical channel nummber so that it tunes to nearest number.
			this.channelNumberEntered(currentlyShowingServiceNumber);
		}
	}
	/**
	 * @method pipActivatedListener
	 * @private
	 */
	function pipActivatedListener(data) {
		pipData = data;
	}
	/**
	 * @method pipActivatedListener
	 * @private
	 */
	function pipDeActivatedListener() {
		pipData = null;
		this.miniguide.activate();
	}
	/**
	 * @method subscribeToPipActivatedListener
	 * @private
	 */
	function subscribeToPipActivatedListener() {
		$N.apps.util.EventManager.subscribe("pipActivated", pipActivatedListener, Zapper);
	}
	/**
	 * @method subscribeToPipDeActivatedListener
	 * @private
	 */
	function subscribeToPipDeActivatedListener() {
		$N.apps.util.EventManager.subscribe("pipDeActivated", pipDeActivatedListener, Zapper);
	}
	/**
	 * handles the swap pip click in Options only if the pip is active.
	 * @method handleSwapPip
	 * @private
	 */
	function handleSwapPip() {
		if ($N.app.FeatureManager.isPIPActive() && pipData) {
			var currentService = Zapper.getCurrentService(),
				eventInfo = $N.platform.btv.EPG.getCurrentEventForService(currentService.serviceId),
				eventInfoForPip = epgUtil.getDataForInfoCard(eventInfo),
				serviceForPip = $N.platform.btv.EPG.getChannelByServiceId(currentService.serviceId),
				serviceObject = null,
				swapData = pipData;
			serviceObject = serviceForPip;
			serviceObject.isPip = true;
			serviceObject.eventInfo = eventInfoForPip;
			setTimeout(miniguidePIP.pipActivatedListener(serviceObject), 200);
			pipData = serviceObject;
			Zapper.updateBannerAndTuneIfNeeded(epgUtil.getServiceById(swapData.data ? swapData.data.serviceId : swapData.serviceId));
		}
	}
	return {
		/**
		 * Gets the strings from the language bundles and then calls initialise method
		 *
		 * @method load
		 */
		load: function () {
			log("load", "Enter");
			$N.gui.ResolutionManager.initialiseContext(document);
			$N.apps.core.Language.importLanguageBundleForObject(Zapper, function () {
				Zapper.initialise();
			}, "apps/zapper/common/", "LanguageBundle.js");
			log("load", "Exit");
		},
		/**
		 * Initialises the variables used in this application: services. Also
		 * initialises the view.
		 *
		 * @method initialise
		 */
		initialise: function () {
			log("initialise", "Enter");
			//$N.gui.FrameworkCore.loadGUIFromXML("apps/zapper/view/zapper.xml", document.getElementById("content"), view, window);
			//this.inTrickplayMode = false;
			//this.miniguide = new Miniguide(this, view);
			//this.miniguide.initialise();
			//channelList = new $N.gui.BasicList();
			//channelList.setWrapAround(true);
			$N.apps.core.ContextManager.initialisationComplete(this);
			//subscribeToReviewBufferUpdateEvent();
			//alwaysShowUnsubscribedChannels = $N.platform.system.Preferences.get($N.app.constants.PREF_SHOW_UNSUBSCRIBED_CHANNELS) === "true";

			//miniguidePIP = view.miniguidePIP;
			//miniguidePIP.setIsPIPEnabled($N.app.FeatureManager.isPIPEnabled());

			//miniguidePIP.registerPipEvents();
			//view.miniguidePIP.show();

			//subscribeToPipActivatedListener();
			//subscribeToPipDeActivatedListener();
			//$N.apps.util.EventManager.subscribe("swapPip", handleSwapPip, Miniguide);
			log("initialise", "Exit");
		},
		/**
		 * Activates the zapper: changes the channel, and activates the view. This function may be
		 * called from, among other places, the main menu after a user selects a channel.
		 *
		 * @method activate
		 * @param {Object} activationContext An object that has a service id in the key 'serviceId'
		 */
		activate: function (activationContext) {
			log("activate", "Enter");
			var currentCategoryName = $N.platform.system.Preferences.get($N.app.constants.PREF_TV_CATEGORY),
				channels,
				me = this,
				currentService,
				currentServiceId,
				confirmationDialogShownCallback = function () {
					log("confirmationDialogShownCallback", "Enter");
					me.miniguide.passivate();
					log("confirmationDialogShownCallback", "Exit");
				},
				errorDialogShownCallback = function () {
					log("errorDialogShownCallback", "Enter");
					me.miniguide.passivate();
					log("errorDialogShownCallback", "Exit");
				};
			if (!activationContext || (activationContext && !activationContext.quietMode)) {
				$N.app.MessageUtil.activateMessageIndicator(false);
				subscribeToFavouritesToggledEvent();

				Zapper.registerStreamListenersForAudioAndSubtitleTracks();
				$N.platform.btv.EPG.registerRefreshCallback(channelListRefreshCallback, this);

				channels = getChannelsByCurrentCategoryName(currentCategoryName);

				$N.platform.btv.PVRManager.setRecordingRequestConflictsCallback(recordingRequestConflictsCallback);
				$N.platform.btv.PVRManager.setTaskAboutToStartConflictCallback(recordingRequestConflictsCallback);

				setChannelData(channels);
				currentServiceId = (channels[0]) ? parseInt(channels[0].serviceId, 10) : 0;

				if (!epgUtil.getChannelFromPrefs()) {
					epgUtil.storeChannelToPrefs(currentServiceId);
				} else {
					currentServiceId = epgUtil.getChannelFromPrefs();
				}

				if (Zapper.getServiceIndex(currentServiceId) === 0) {
					currentlyShowingServiceId = Zapper.getServicesArray()[0].serviceId;
				} else {
					currentlyShowingServiceId = currentServiceId;
				}

				$N.app.fullScreenPlayer.setCurrentServiceId(currentlyShowingServiceId);
				log("activate", "currentlyShowingServiceId was set to: " + currentlyShowingServiceId);
				channelList.selectRowAtIndex(Zapper.getServiceIndex(currentlyShowingServiceId) + 1);
				$N.app.PPVHelper.intialiseBoundaryChangeListener();
				subscribeCaAccessDeniedEvent();
				currentService = this.getCurrentService();
				if (activationContext && activationContext.keyHandlerKey) {
					log("activate", "activationContext was passed, keyHandlerKey: " + activationContext.keyHandlerKey);
					setTimeout(function () {
						Zapper.keyHandler(activationContext.keyHandlerKey, false);
					}, 1);
				} else if (activationContext && activationContext.serviceId) {
					log("activate", "activationContext was passed, service id: " + activationContext.serviceId);
					this.updateBannerAndTuneIfNeeded(activationContext);
					if (currentService.serviceId !== activationContext.serviceId) {
						previousService = currentService;
					}
					currentService = activationContext;
					currentlyShowingServiceId = currentService.serviceId;
					channelList.selectRowAtIndex(Zapper.getServiceIndex(currentService.serviceId) + 1);
				} else if ($N.app.fullScreenPlayer.tuner.getCurrentUri()) {
					$N.app.fullScreenPlayer.tuner.showFullscreen();
				}
				if (activationContext && activationContext.showBanner) {
					this.miniguide.activate();
				} else {//hides the banner and brings up PIN popup if required on exiting from any other context
					this.miniguide.hideBanner();
				}

				$N.app.fullScreenPlayer.trickPlay.registerEventListeners();
				$N.app.fullScreenPlayer.enableReconnectingDialog();
				$N.app.fullScreenPlayer.setPinPopUpOnBlockedEventCallback(me.miniguide.showPinPopUpOnBlockedEvent);
				$N.app.fullScreenPlayer.setHidePinPopUpForUnblockedEventCallback(me.miniguide.hidePinPopUpForUnblockedEvent);
				$N.app.fullScreenPlayer.registerEventBoundaryChangedListener(me.miniguide.eventBoundaryChangedListener);
				$N.app.Conflicts.setDialogShownCallback(confirmationDialogShownCallback);
				$N.app.HotPlug.setDialogShownCallback(confirmationDialogShownCallback);
				$N.app.Reminders.setShowDialogCallback(confirmationDialogShownCallback);
				$N.app.ErrorMessage.setDialogShownCallback(errorDialogShownCallback);
				$N.app.DialogueHelper.setCaDialogExitCallback(handleCAPopupExit);
				$N.app.PVRUtil.registerUIRefreshListener(me.miniguide.updateIconsUIRefreshListener, this);
				subscribeToPVRStatusUpdateEvent();
				subscribeHideNoSignalDialogueListener();

				$N.app.PVRCapability.subscribeWHPvrDeviceUpdate(PVRStatusUpdateListener);
				if (!view.miniguideShadow.animatedMiniguide.isVisible()) {
					$N.apps.util.EventManager.fire("zapperOpened");
				}
			}
			if (activationContext && activationContext.isDirectChannelEntryFromPortal) {
				this.miniguide.hidePinPopUpForUnblockedEvent();
			} else {
				this.miniguide.showPinPopUpOnBlockedEvent();
			}

			if ($N.app.FeatureManager.isPIPActive() && pipData && !isOptionsLaunched) {
				miniguidePIP.pipActivatedListener(pipData);
			} else {
				miniguidePIP.stopPip();
			}
			isOptionsLaunched = false;
			log("activate", "Exit");
		},

		/**
		 * Registers a listener for the VOD Expiring Dialog and hides the back plate
		 * @method focus
		 */
		focus: function () {
			log("focus", "Enter");
			var currentServiceId = null;
			$N.app.MessageUtil.activateMessageIndicator(false);
			subscribeToFavouritesToggledEvent();
			$N.app.fullScreenPlayer.setPinPopUpOnBlockedEventCallback(this.miniguide.showPinPopUpOnBlockedEvent);
			$N.app.fullScreenPlayer.registerEventBoundaryChangedListener(this.miniguide.eventBoundaryChangedListener);
			$N.platform.btv.PVRManager.setRecordingRequestConflictsCallback(recordingRequestConflictsCallback);
			$N.platform.btv.PVRManager.setTaskAboutToStartConflictCallback(recordingRequestConflictsCallback);
			subscribeCaAccessDeniedEvent();
			$N.app.DialogueHelper.setCaDialogExitCallback(handleCAPopupExit);
			if (epgUtil.getChannelFromPrefs()) {
				currentServiceId = epgUtil.getChannelFromPrefs();
			}
			if (Zapper.getServiceIndex(currentServiceId) === 0) {
				currentlyShowingServiceId = Zapper.getServicesArray()[0].serviceId;
			} else {
				currentlyShowingServiceId = currentServiceId;
			}
			$N.app.fullScreenPlayer.setCurrentServiceId(currentlyShowingServiceId);
			channelList.selectRowAtIndex(Zapper.getServiceIndex(currentlyShowingServiceId) + 1);
			this.update();
			//$N.app.fullScreenPlayer.trickPlay.registerEventListeners();
			if (!view.miniguideShadow.animatedMiniguide.isVisible()) {
				$N.apps.util.EventManager.fire("zapperOpened");
			}
			$N.platform.ca.ParentalControl.setUserChangedCallback(function () {
				if (this.miniguide.isBannerActive()) {
					this.miniguide.update();
				}
			});
			this.miniguide.showPinPopUpOnBlockedEvent();

			if ($N.app.FeatureManager.isPIPActive() && pipData && !isOptionsLaunched) {
				miniguidePIP.pipActivatedListener(pipData);
			}
			isOptionsLaunched = false;
			log("focus", "Exit");
		},

		/**
		 * Unregisters a listener for the VOD Expiring Dialog
		 * @method defocus
		 */
		defocus: function () {
			$N.app.fullScreenPlayer.setPinPopUpOnBlockedEventCallback(null);
			log("defocus", "Enter");
			// PiP state to be maintained in zapper on focus/defocus
			if ($N.app.FeatureManager.isPIPActive() && !isOptionsLaunched) {
				miniguidePIP.pipDeActivatedListener();
			}

			$N.platform.ca.ParentalControl.setUserChangedCallback(function () {});
			unSubscribeCaAccessDeniedEvent();
			this.miniguide.clearBannerTimeout();
			$N.app.MessageUtil.deactivateMessageIndicator();
			$N.app.fullScreenPlayer.unregisterEventBoundaryChangedListener(this.miniguide.eventBoundaryChangedListener);
			unsubscribeFromFavouritesToggledEvent();
			Zapper.miniguide.hidePinDialog();
			$N.app.DialogueHelper.setCaDialogExitCallback(null);
			$N.apps.util.EventManager.fire("zapperClosed");
			log("defocus", "Enter");
		},

		/**
		 * calls the view update method
		 * @method update
		 */
		update: function () {
			log("update", "Enter");
			if (this.miniguide.isUpdateRequired()) {
				this.miniguide.update();
			}
			log("update", "Exit");
		},
		/**
		 * removes the trickplay listeners and calls the view passivate method
		 *
		 * @method passivate
		 */
		passivate: function () {
			log("passivate", "Enter");
			$N.app.MessageUtil.deactivateMessageIndicator();
			unsubscribeFromFavouritesToggledEvent();
			$N.app.fullScreenPlayer.trickPlay.unRegisterEventListeners();
			this.miniguide.passivate();
			$N.app.Reminders.setShowDialogCallback(function () {});
			$N.app.Conflicts.setDialogShownCallback(function () {});
			$N.app.HotPlug.setDialogShownCallback(function () {});
			$N.app.ErrorMessage.setDialogShownCallback(function () {});
			$N.app.fullScreenPlayer.disableReconnectingDialog();
			$N.app.fullScreenPlayer.unregisterEventBoundaryChangedListener(this.miniguide.eventBoundaryChangedListener);
			$N.app.PVRUtil.unregisterUIRefreshListener(this.miniguide.updateIconsUIRefreshListener);
			$N.platform.btv.PVRManager.setRecordingRequestConflictsCallback(function () { });
			$N.platform.btv.PVRManager.setTaskAboutToStartConflictCallback(function () { });
			Zapper.unregisterStreamListenersForAudioAndSubtitleTracks();
			unsubscribeFromPVRStatusUpdateEvent();
			$N.app.PVRCapability.unSubscribeWHPvrDeviceUpdate(PVRStatusUpdateListener);
			$N.app.PPVHelper.removeBoundaryChangeListener();
			unSubscribeCaAccessDeniedEvent();
			unSubscribeHideNoSignalDialogueListener();
			$N.app.DialogueHelper.setCaDialogExitCallback(null);
			$N.apps.util.EventManager.fire("zapperClosed");
			log("passivate", "Exit");
		},

		/**
		 * Returns the service Id of the currently airing service
		 * @method getCurrentServiceId
		 * @return {Number} The number of the service Id
		 */
		getCurrentServiceId: getCurrentServiceId,

		/**
		 * Returns the service object of the currently airing service
		 * @method getCurrentService
		 * @return {Object} The current service object
		 */
		getCurrentService: function () {
			log("getCurrentService", "Enter");
			var currentServiceId = this.getCurrentServiceId(),
				service = epgUtil.getServiceById(currentServiceId);
			log("getCurrentService", "Exit");
			return service || null;
		},

		/**
		 * Returns the service object of previously tuned service
		 * @method getPreviousService
		 * @return {Object} The previous service object
		 */
		getPreviousService: function () {
			log("getPreviousService", "Enter");
			return previousService;
		},

		/**
		 * Returns string representation of this class
		 *
		 * @method toString
		 * @return {String}
		 */
		toString: function () {
			return "ZAPPER";
		},
		/**
		 * Handles remote control key presses.
		 *
		 * @method keyHandler
		 * @param {String} key
		 * @return {Boolean} true if handled; false otherwise
		 */
		keyHandler: function (key, repeats) {
			log("keyHandler", "Enter");
			var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
				handled = false;

			$N.app.MemoryUtil.setOrUpdateGarbageCollectTimeoutAndInterval();

			if (!this.miniguide.isBannerActive() && key === keys.KEY_RIGHT) {
				$N.app.ContextHelper.openContext("PORTAL");
				handled = true;
			}

			if (!handled) {
				handled = this.miniguide.keyHandler(key, repeats);
			}

			if (!handled) {
				switch (key) {
				case keys.KEY_BACK:
					if (previousService) {
						this.updateBannerAndTuneIfNeeded(previousService);
					}
					handled = true;
					break;
				case keys.KEY_EXIT:
					this.miniguide.passivate();
					handled = true;
					break;
				case keys.KEY_VOL_DOWN:
				case keys.KEY_VOL_UP:
				case keys.KEY_MUTE:
					this.miniguide.passivate();
					break;
				case keys.KEY_REW:
				case keys.KEY_PLAY:
				case keys.KEY_PAUSE:
				case keys.KEY_SKIP_FW:
				case keys.KEY_SKIP_REW:
				case keys.KEY_REPLAY:
				case keys.KEY_PLAY_PAUSE:
					log("keyHandler", "PVR Available: " + $N.app.PVRCapability.isPVREnabled());
					log("keyHandler", " RB Available: " + isReviewBufferAvailable);
					if ($N.app.PVRCapability.isPVREnabled() && isReviewBufferAvailable) {
						navigateToTimeShiftPlayer(key);
						Zapper.inTrickplayMode = true;
					} else {
						Zapper.inTrickplayMode = false;
					}
					handled = true;
					break;
				case keys.KEY_STOP:
					if (this.inTrickplayMode) {
						Zapper.updateBannerAndTuneIfNeeded(Zapper.getCurrentService());
						handled = true;
						break;
					}
					log("keyHandler", "Exit4");
					break;
				}

			}
			log("keyHandler", "Exit5");
			return handled;
		},

		/**
		 * Try to find the given channel number in the servicesArray and then update the banner
		 * for this service and tune to it
		 *
		 * @method channelNumberEntered
		 * @param {Number} enteredNumber
		 */
		channelNumberEntered: function (enteredNumber) {
			log("channelNumberEntered", "Enter");
			var services = this.getServicesArray(),
				service = null,
				currentCategoryName = $N.platform.system.Preferences.get($N.app.constants.PREF_TV_CATEGORY),
				i;

			if (services) {
				for (i = 0; i < services.length; i++) {
					if (services[i].logicalChannelNum === enteredNumber) {
						service = services[i];
						break;
					}
				}
			}
			// handle case where channel doesn't exist in the current favourites list
			if (!service && this.isShowingFavourites()) {
				services = $N.app.epgUtil.getChannelsForCategory($N.app.constants.FAVOURITE_ALL_CHANNELS);
				for (i = 0; i < services.length; i++) {
					if (services[i].logicalChannelNum === enteredNumber) {
						service = services[i];
						$N.platform.system.Preferences.set($N.app.constants.PREF_TV_CATEGORY, $N.app.constants.FAVOURITE_ALL_CHANNELS);
						setChannelData(services, true);
						break;
					}
				}
			}
			// if new channel is in favourites list and previous channel we need to
			// ensure that current channel isn't added to the favourites list unnecessarilty
			if (service && this.isShowingFavourites()) {
				validateFavouritesList(this.getCurrentService(), this.getCurrentServiceId(), services, true);
			}

			if (!service) {
				service = $N.app.epgUtil.getNextClosestService(enteredNumber, channelList.getData());
			}

			//if number entered is not found change number to current number
			if (service === null) {
				this.miniguide.update(this.getCurrentService());
			} else {
				this.updateBannerAndTuneIfNeeded(service);
			}
			log("channelNumberEntered", "Exit");
		},

		/**
		 * Updates the event information in the banner
		 * @method updateBanner
		 * @param {Object} (service)    the service to display in the banner and tune to.
		 * @param {Object} (eventData)  the service data to display in the banner.
		 */
		updateBanner: function (service, eventData) {
			log("updateBanner", "Enter");
			Zapper.miniguide.update(service, eventData);
			if (service.serviceId === getCurrentServiceId() && this.inTrickplayMode) {
				this.inTrickplayMode = false;
			}
			log("updateBanner", "Exit");
		},

		/**
		 * Updates the event information in the banner, then tunes to the given service if it is different
		 * from the current service.
		 *
		 * @method updateBannerAndTuneIfNeeded
		 * @param {Object} (service)    the service to display in the banner and tune to.
		 * @param {Object} (optional) (eventData)  the service data to display in the banner.
		 */
		updateBannerAndTuneIfNeeded: function (service, eventData) {
			if (service) {
				log("updateBannerAndTuneIfNeeded", "Enter");
				var serviceId = service.serviceId || service._data.serviceId;
				// FIXME NETUI-227: Investigate why Zapper::activate is setting currentServiceId on first boot and fix
				if (this.getCurrentServiceId() !== serviceId) {
					changeChannel(service);
				}
				if (!eventData) {
					eventData = Zapper.miniguide.getEventDataForService(service);
				}
				Zapper.updateBanner(service, eventData);
				log("updateBannerAndTuneIfNeeded", "Exit");
			}
		},

		/**
		 * Tunes to the given service if it is different from the current service without
		 * affecting the state of the banner.
		 *
		 * @method tuneWithoutBannerUpdate
		 * @param {Object} (service)    the service to display in the banner and tune to.
		 */
		tuneWithoutBannerUpdate: function (service) {
			if (service) {
				log("tuneWithoutBannerUpdate", "Enter");
				var serviceId = service.serviceId || service._data.serviceId;
				// FIXME NETUI-227: Investigate why Zapper::activate is setting currentServiceId on first boot and fix
				if (this.getCurrentServiceId() !== serviceId) {
					changeChannel(service);
				}
				log("tuneWithoutBannerUpdate", "Exit");
			}
		},

		/**
		 * Returns the service list
		 *
		 * @method getServicesArray
		 * @return {Object} array of services
		 */
		getServicesArray: function () {
			return channelList.getData();
		},

		/**
		 * Get the index position in a list of services
		 * @method getServiceIndex
		 * @param {Integer} serviceId The Service Id of the Service
		 * @return {Integer} The index position of the service, or null if not in the list
		 */
		getServiceIndex: function (serviceId) {
			log("getServiceIndex", "Enter");
			if (serviceId !== $N.app.epgUtil.BAD_SERVICE_ID) {
				var i,
					serviceIdArray = this.getServicesArray(),
					serviceIdArrayLength = serviceIdArray.length;
				for (i = 0; i < serviceIdArrayLength; i++) {
					if (serviceIdArray[i].serviceId === serviceId) {
						log("getServiceIndex", "Exit");
						return i;
					}
				}
			}
			log("getServiceIndex", "Exit");
			return null;
		},

		/**
		 * Are we showing a favourites list
		 * @method isShowingFavourites
		 * @param {String} categoryName Optional category/favourites name
		 * @return {Boolean} True if a favourites lists is being used
		 */
		isShowingFavourites: function (categoryName) {
			log("isShowingFavourites", "Enter");
			var currentCategoryName = categoryName || $N.platform.system.Preferences.get($N.app.constants.PREF_TV_CATEGORY);
			if (currentCategoryName && currentCategoryName !== $N.app.SettingsAPI.getDefaultFavourite()) {
				log("isShowingFavourites", "Exit");
				return true;
			}
			log("isShowingFavourites", "Exit");
			return false;
		},

		/**
		 * move channel up or down
		 * @method moveChannelUpDown
		 * @param {Number} channelsToJump Number of channels to move i.e. -1 or 1
		 * @param {Boolean} suppressBanner
		 */
		moveChannelUpDown: function (channelsToJump, suppressBanner) {
			log("moveChannelUpDown", "Enter");
			Zapper.miniguide.setChannelUpDown(channelsToJump, suppressBanner);
			log("moveChannelUpDown", "Exit");
		},

		/**
		 * @method registerStreamListenersForAudioAndSubtitleTracks
		 */
		registerStreamListenersForAudioAndSubtitleTracks: function () {
			$N.app.fullScreenPlayer.registerPlayerConnectedListener(Zapper.miniguide.updatePrefAudioAndSubtitle);
		},

		/**
		 * @method unregisterStreamListenersForAudioAndSubtitleTracks
		 */
		unregisterStreamListenersForAudioAndSubtitleTracks: function () {
			$N.app.fullScreenPlayer.unregisterPlayerConnectedListener(Zapper.miniguide.updatePrefAudioAndSubtitle);
		},

		showNoSignalDialogue: function () {
			Zapper.miniguide.showNoSignalDialogue();
		},
		hideNoSignalDialogue: function () {
			Zapper.miniguide.hideNoSignalDialogue();
		},
		isCaAccessDeniedSubscribed: function () {
			return (caAccessDeniedSubscriptionId) ? true : false;
		},
		setCaAccessDeniedUnsubscriptionCallback: function (callback) {
			caAccessDeniedUnsubscriptionCallback = callback;
		},

		setOptionsLaunch: function (value) {
			isOptionsLaunched = value;
		}
	};
}());
