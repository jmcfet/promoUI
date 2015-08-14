/*global Miniguide*/
/**
 * Static Zapper application object.
 * @class Zapper
 */

var Zapper = (function () {
	var $N = window.parent.$N,
		epgUtil = $N.app.epgUtil,
		log = new $N.apps.core.Log("MINIGUIDE", "Zapper"),
		view = {},
		currentlyShowingServiceId,
		previousService = null,
		channelList = null,
		alwaysShowUnsubscribedChannels = false,
		favouritesToggledEventSubscriptionId = null,
		isReviewBufferAvailable = false,
		PVRSubscriptionIds = [],

		channelCategories = {
			"RADIO" : "radioChannels",
			"SUBSCRIBED_CHANNELS" : "subscribedChannels",
			"ALL_CHANNELS" : "allChannels"
		},

		// defined later due to circular jsLint issue with recordingRequestConflictsCallback
		setRecordingConflictsCallback,

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
		log("setRecordingConflictsCallback", "Exit");
	};

	$N.app.fullScreenPlayer.trickPlay.setPlayerAtBeginningCallback(playerAtBeginningCallback);
	$N.app.fullScreenPlayer.trickPlay.setUIRefreshCallback(uiRefreshCallback);

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
		log("reviewBufferSuccessListener", "Enter");
		isReviewBufferAvailable = true;
		log("reviewBufferSuccessListener", "Exit");
	}

	/**
	 * @method reviewBufferFailedListener
	 * @status {Object} e - the status object for the review buffer
	 * @private
	 */
	function reviewBufferFailedListener(e) {
		log("reviewBufferFailedListener", "Enter");
		isReviewBufferAvailable = false;
		Zapper.inTrickplayMode = false;
		log("reviewBufferFailedListener", "Exit");
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
	 * @method changeChannel
	 * @param {Object} service
	 */
	function changeChannel(service) {
		log("changeChannel", "Enter");
		service.showBanner = true;
		$N.app.ContextHelper.openContext("ZAPPER", {
			activationContext: service
		});
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
	 * @method navigateToTimeShiftPlayer
	 * @private
	 */
	function navigateToTimeShiftPlayer() {
		log("navigateToTimeShiftPlayer", "Enter");
		$N.app.ContextHelper.closeContext();
		log("navigateToTimeShiftPlayer", "Exit");
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
			}, "apps/miniGuide/common/", "LanguageBundle.js");
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
			$N.gui.FrameworkCore.loadGUIFromXML("apps/miniGuide/view/miniGuide.xml", document.getElementById("content"), view, window);
			this.inTrickplayMode = false;
			this.miniguide = new Miniguide(this, view);
			this.miniguide.initialise();
			channelList = new $N.gui.BasicList();
			channelList.setWrapAround(true);
			$N.apps.core.ContextManager.initialisationComplete(this);
			alwaysShowUnsubscribedChannels = $N.platform.system.Preferences.get($N.app.constants.PREF_SHOW_UNSUBSCRIBED_CHANNELS) === "true";
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

			$N.app.BrandHelper.hideAll();

			subscribeToFavouritesToggledEvent();

			channels = getChannelsByCurrentCategoryName(currentCategoryName);

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

			currentService = this.getCurrentService();
			if (activationContext && activationContext.keyHandlerKey) {
				log("activate", "activationContext was passed, keyHandlerKey: " + activationContext.keyHandlerKey);
				if (activationContext.inTrickplayMode === true) {
					isReviewBufferAvailable = true;
					this.inTrickplayMode = true;
				}
				Zapper.keyHandler(activationContext.keyHandlerKey, false);
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
			} else if (activationContext && activationContext.hideBanner === false) {
				return;
			} else {//hides the banner and brings up PIN popup if required on exiting from any other context
				this.miniguide.hideBanner();
			}
			log("activate", "Exit");
		},

		/**
		 * Registers a listener for the VOD Expiring Dialog and hides the back plate
		 * @method focus
		 */
		focus: function () {
			log("focus", "Enter");
			$N.app.MessageUtil.activateMessageIndicator();
			subscribeToFavouritesToggledEvent();
			log("focus", "Exit");
		},

		/**
		 * Unregisters a listener for the VOD Expiring Dialog
		 * @method defocus
		 */
		defocus: function () {
			log("defocus", "Enter");
			$N.app.MessageUtil.deactivateMessageIndicator();
			unsubscribeFromFavouritesToggledEvent();
			Zapper.miniguide.hidePinDialog();
			log("defocus", "Enter");
		},

		/**
		 * calls the view update method
		 *
		 * @method update
		 */
		update: function () {
			log("update", "Enter");
			this.miniguide.update();
			log("update", "Exit");
		},
		/**
		 * removes the trickplay listeners and calls the view passivate method
		 *
		 * @method passivate
		 */
		passivate: function () {
			log("passivate", "Enter");
			this.miniguide.passivate();
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
		 * Returns string representation of this class
		 *
		 * @method toString
		 * @return {String}
		 */
		toString: function () {
			return "MINIGUIDE";
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

			handled = this.miniguide.keyHandler(key, repeats);

			if (!handled) {
				switch (key) {
				case keys.KEY_BACK:
					if (previousService) {
						this.updateBannerAndTuneIfNeeded(previousService);
					}
					handled = true;
					break;
				case keys.KEY_EXIT:
				case keys.KEY_VOL_DOWN:
				case keys.KEY_VOL_UP:
				case keys.KEY_MUTE:
				case keys.KEY_FFW:
				case keys.KEY_REW:
				case keys.KEY_PLAY:
				case keys.KEY_PAUSE:
				case keys.KEY_SKIP_FW:
				case keys.KEY_SKIP_REW:
				case keys.KEY_PLAY_PAUSE:
					$N.app.ContextHelper.closeContext();
					handled = true;
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
				i;
			if (services) {
				for (i = 0; i < services.length; i++) {
					if (services[i].logicalChannelNum === enteredNumber) {
						service = services[i];
						break;
					}
				}
			}
			$N.app.ContextHelper.openContext("ZAPPER", {
				activationContext: service
			});
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
				$N.app.fullScreenPlayer.setPlaybackPosition($N.app.fullScreenPlayer.getContentLength());
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
			log("updateBannerAndTuneIfNeeded", "Enter");
			var serviceId = service.serviceId || service._data.serviceId;
			// FIXME NETUI-227: Investigate why Zapper::activate is setting currentServiceId on first boot and fix
			if (this.getCurrentServiceId() !== serviceId) {
				changeChannel(service);
			}
			if (!eventData) {
				eventData = $N.platform.btv.EPG.getCurrentEventForService(serviceId) || {};
				eventData.nextEvent = $N.platform.btv.EPG.getNextEventForService(serviceId || {});
			}
			Zapper.updateBanner(service, eventData);
			log("updateBannerAndTuneIfNeeded", "Exit");
		},

		/**
		 * Tunes to the given service if it is different from the current service without
		 * affecting the state of the banner.
		 *
		 * @method tuneWithoutBannerUpdate
		 * @param {Object} (service)    the service to display in the banner and tune to.
		 */
		tuneWithoutBannerUpdate: function (service) {
			log("tuneWithoutBannerUpdate", "Enter");
			var serviceId = service.serviceId || service._data.serviceId;
			// FIXME NETUI-227: Investigate why Zapper::activate is setting currentServiceId on first boot and fix
			if (this.getCurrentServiceId() !== serviceId) {
				changeChannel(service);
			}
			log("tuneWithoutBannerUpdate", "Exit");
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
		}
	};
}());
