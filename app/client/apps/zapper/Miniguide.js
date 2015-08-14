/*global MiniguideEventManager, MailIndicator*/
/**
 * Static class for implementing the zapper view.
 * @class Miniguide
 * @requires  $N.app.DialogueHelper
 * @param {Object} controller (this applications controller)
 * @param {Object} view (the view for this application)
 */
var Miniguide = function (controller, view) {
	var $N = window.parent.$N,
		pinDialogId = "PinDialog",
		miniguideShadow = view.miniguideShadow,
		animatedMiniguide = view.miniguideShadow.animatedMiniguide,
		tipsFromNetBackGroundBox = view.rightSideTipsGroup,
		noSignalMessageBox = view.noSignalMessageBox,
		noSignalBackgroundBlack = view.noSignalBackgroundBlack,
		dialogueHelper = $N.app.DialogueHelper,
		miniguideEventManager = new MiniguideEventManager(),
		log = new $N.apps.core.Log('ZAPPER', 'Miniguide'),
		directChannelEntry = new $N.app.DirectChannelEntry($N.app.constants.MAX_CHANNEL_DIGITS, $N.app.constants.CHANNEL_ENTRY_TIMEOUT_MS),
		zapperTimer = null,
		eventOnDisplay, // holds the current event that's displayed in the banner
		channelIndex, // keeps track of the channel (using an index in serviceArray) whose information is currently displayed
		parentalControlHelper = $N.app.ParentalControlUtil,
		pinHelper = null,
		eventDataMapper = {},
		isDisplayedEventPlaying = function () {},
		lastKeyPressTimestamp = 0,
		lastKeyPress = null,
		pipShowTimeout = null,
		iconTimeOut = null,
		KEY_REPEAT_THRESHOLD_MS = 450,
		CHANNEL_NUMBER_DISPLAY_CSS = "miniguideChannelNameAndNumber",
		CHANNEL_NUMBER_ENTRY_CSS = "directChannelNumberEntry miniguideChannelNumberEntered",
		KEY_RELEASE_SUFFIX = $N.app.constants.KEY_RELEASE_SUFFIX,
		audioSubtitleChangedOnStreamStarted = false,
		isExitToBeHandled = true,
		keyOkHandlerWhenParentallyLocked = function () {},
		minuteTimer = $N.app.StandardTimers.minuteTimer,
		me = null,
		showBanner = null,
		isMiniguideUpdateRequired = true; // denotes whether a miniguide update is required or not.

	eventDataMapper = {
		getTitle: function (eventObject) {
			var title = "";
			if (eventObject && eventObject.title) {
				if (eventObject.title === controller.getString("noEventTitle")) {
					title = controller.getString("eventInfoUnavailable");
				} else {
					title = eventObject.title;
				}
			} else {
				title = controller.getString("eventInfoUnavailable");
			}
			return title;
		},
		getSeriesEpisodeTitle: function (eventObject) {
			var episodeTitle = "";
			if (eventObject && eventObject.title) {
				if (eventObject.title === controller.getString("noEventTitle")) {
					episodeTitle = controller.getString("eventInfoUnavailable");
				} else {
					episodeTitle = eventObject.title;
					episodeTitle += $N.app.epgUtil.getSeasonEpisodeShort(eventObject, " ");
				}
			} else {
				episodeTitle = controller.getString("eventInfoUnavailable");
			}
			return episodeTitle;
		},
		getServiceName: function (serviceObj) {
			var service = serviceObj._data || serviceObj;
			return service.name || service.serviceName;
		},
		getServiceNumber: function (serviceObj) {
			var service = serviceObj._data || serviceObj;
			return service.logicalChannelNum || service.number || service.channelKey || '';
		},
		getAudioString: function (eventObject) {
			var activeAudioTrack;
			if (isDisplayedEventPlaying()) {
				activeAudioTrack = $N.app.fullScreenPlayer.tracks.getActiveAudioTrack();
				if (activeAudioTrack && activeAudioTrack.language) {
					return activeAudioTrack.language;
				}
			}
			return null;
		},
		getSubtitleString: function (eventObject) {
			var activeSubtitleTrack;
			if (!$N.app.TracksUtil.isSubtitleTrackSelectable()) {
				return controller.getString("unavailable");
			}
			activeSubtitleTrack = $N.app.fullScreenPlayer.tracks.getActiveSubtitleTrack();
			return activeSubtitleTrack ? controller.getString("off") : controller.getString("on");
		},
		getProgressBarData: function (eventObject) {
			return {
				minimum: (eventObject && eventObject.startTime) ? eventObject.startTime : 0,
				maximum: (eventObject && eventObject.endTime) ? eventObject.endTime : 0,
				progress: (eventObject && eventObject.startTime) ? new Date().getTime() : 0
			};
		},
		getRecordingStatus: function (eventObject) {
			return $N.platform.btv.PVRManager.getRecordingStatusByEvent(eventObject);
		}
	};

	/**
	 * Returns true if the current event displayed in the zapper is the event playing in fullscreen TV
	 * @method isDisplayedEventPlaying
	 * @private
	 * @return {Boolean} True if event in zapper is playing
	 */
	isDisplayedEventPlaying = function () {
		var service = controller.getServicesArray()[channelIndex];
		return (miniguideEventManager.getCurrentEventPosition() === 0 && service && service.serviceId === controller.getCurrentServiceId());
	};

	/**
	 * Resets the eventOnDisplay back to nowEvent
	 * @method resetEventOnDisplay
	 * @private
	 */
	function resetEventOnDisplay() {
		eventOnDisplay = miniguideEventManager.getCurrentEventForService(controller.getCurrentService());
	}

	/**
	 * Function to hide Tips From Net on miniguide time out
	 * @method showTipsFromNetBackgroundBox
	 */
	function hideTipsFromNetBackgroundBox() {
		tipsFromNetBackGroundBox.hide();
	}
	/**
	 * Function to show Tips From Net if currently showing event is in SD and available in HD channel
	 * @method showTipsFromNetBackgroundBox
	 */
	function showTipsFromNetBackgroundBox() {
		var serviceObj = controller.getServicesArray()[channelIndex],
			CHAR_IN_ONE_LINE = 17,
			HEIGHT_FOR_ONE_LINE = 35,
			DEFAULT_HEIGHT_OF_BACKGROUND_BOX = 114,
			DEFAULT_HEIGHT_OF_TEXTAREA_BOX = 200,
			extraHeightToAdd,
			extraTextLength;
		if (serviceObj && serviceObj.tiServiceTipText) {
			if (serviceObj.tiServiceTipText.length > (CHAR_IN_ONE_LINE * 2)) {
				extraTextLength = (serviceObj.tiServiceTipText.length - (CHAR_IN_ONE_LINE * 2));
				extraHeightToAdd = Math.ceil(extraTextLength / CHAR_IN_ONE_LINE) * HEIGHT_FOR_ONE_LINE;
				tipsFromNetBackGroundBox.rightSideTipsBackgroundBox.setHeight(DEFAULT_HEIGHT_OF_BACKGROUND_BOX + extraHeightToAdd);
				tipsFromNetBackGroundBox.title.setHeight(DEFAULT_HEIGHT_OF_TEXTAREA_BOX + extraHeightToAdd);
			} else {
				tipsFromNetBackGroundBox.rightSideTipsBackgroundBox.setHeight(DEFAULT_HEIGHT_OF_BACKGROUND_BOX);
				tipsFromNetBackGroundBox.title.setHeight(DEFAULT_HEIGHT_OF_TEXTAREA_BOX);
			}
			tipsFromNetBackGroundBox.title.setText(serviceObj.tiServiceTipText);
			tipsFromNetBackGroundBox.show();
		} else {
			hideTipsFromNetBackgroundBox();
		}
	}

	/**
	 * Function to hide no signal popup
	 * @method hideNoSignalDialogue
	 */
	function hideNoSignalDialogue() {
		noSignalMessageBox.hide();
		noSignalBackgroundBlack.hide();
	}
	/**
	 * Function to show no signal popup
	 * @method showNoSignalDialogue
	 */
	function showNoSignalDialogue() {
		noSignalBackgroundBlack.show();
		noSignalMessageBox.noSignalMessageBoxTitle.setText(controller.getString("noSignalTitle"));
		noSignalMessageBox.noSignalMessage.setText(controller.getString("noSignalMessage"));
		noSignalMessageBox.noSignalCode.setText(controller.getString("errorCode") + dialogueHelper.mapDialogueErrorCode($N.app.constants.DLG_NO_SIGNAL));
		noSignalMessageBox.show();
	}

	/**
	 * Hides the banner by fading it out or instantly if instantly is set
	 * @method hideBanner
	 * @private
	 * @param {Boolean} instantly
	 */
	function hideBanner(instantly) {
		log("hideBanner", "Enter");
		var currentEventFromPPV = null,
			currentServiceId = $N.app.epgUtil.getServiceById($N.app.epgUtil.getChannelFromPrefs()).serviceId,
			currentlyTunedEvent = $N.app.epgUtil.getEvent("current", currentServiceId);

		animatedMiniguide.setBannerActive(false);
		hideTipsFromNetBackgroundBox();
		if (zapperTimer) {
			window.parent.clearTimeout(zapperTimer);
		}
		if (instantly) {
			miniguideShadow.hide();
		} else {
			miniguideShadow.removeCssClass("active");
		}
		/* Now we should check if event/channel is parentally locked and if displayed event
		 * is playing and if hide banner is not called instantly to hide.
		 */
		if (!instantly && $N.app.ParentalControlUtil.isChannelOrProgramLocked(eventOnDisplay) && isDisplayedEventPlaying() === true) {
			keyOkHandlerWhenParentallyLocked();
		} else if (!instantly) {
			currentEventFromPPV = $N.app.PPVHelper.getCurrentEvent();
			if (currentEventFromPPV && (currentEventFromPPV.serviceId !== currentServiceId)) {
				currentEventFromPPV = null;
			}
			$N.app.PPVHelper.showPurchaseOptionsIfAvailable((currentEventFromPPV || currentlyTunedEvent),
				function () {
					if (controller.isCaAccessDeniedSubscribed()) {
						showBanner();
					}
				});
		}
		resetEventOnDisplay();
		$N.app.TimerUtil.stopTimer("recordIcon");
		$N.apps.util.EventManager.fire("zapperOpened");
		log("hideBanner", "Exit");
	}

	/**
	 * Activating the audio/subtitle on OK,EXIT, PORTAL, MENU etc.. key is press
	 * Handling the key makes sure the audio/Subtitle is activated immediately and appropriate text is changed upon exit.
	 * @method activateAudioSubtitleOnKeyPress
	 * @private
	 */
	function activateAudioSubtitleOnKeyPress() {
		var audioTrackText = animatedMiniguide.getAudioTrackText(),
			subtitleText = animatedMiniguide.getSubtitleText(),
			isAudioSubtitleTogglingMode = animatedMiniguide.getAudioSubtitleTogglingMode();
		if (isAudioSubtitleTogglingMode && animatedMiniguide.isBannerActive()) {
			if (audioTrackText !== (controller.getString("menuAudio"))) {
				animatedMiniguide.activateAudio();
			}
			if (subtitleText !== (controller.getString("menuSubtitles"))) {
				animatedMiniguide.activateSubtitle();
			}
			animatedMiniguide.setAudioSubtitleTogglingMode(false);
			return true;
		}
		return false;
	}

	/**
	 * Clears the timeout that's used for hiding the banner automatically.
	 * @method clearBannerTimeout
	 * @private
	 */
	function clearBannerTimeout() {
		if (zapperTimer) {
			window.parent.clearTimeout(zapperTimer);
			zapperTimer = null;
		}
	}

	/**
	 * Resets the timeout that's used for hiding the banner automatically. Called explicitly by the
	 * key handlers and by showBanner.
	 * @method resetBannerTimeout
	 * @private
	 */
	function resetBannerTimeout() {
		var timeout = $N.platform.system.Preferences.get($N.app.constants.PREF_ZAPPING_BANNER_TIMEOUT) || $N.app.constants.SURFER_DURATION_DEFAULT;
		timeout = parseInt(timeout, 10);
		clearBannerTimeout();
		if (timeout > 0) {
			zapperTimer = window.parent.setTimeout(hideBanner, timeout);
		}
	}

	/**
	 * Updates the marker position and if in start over updates the progress bar
	 * @method updateProgress
	 * @private
	 */
	function updateProgress() {
		log("updateProgress", "Enter");
		animatedMiniguide.updateProgress(eventDataMapper.getProgressBarData(eventOnDisplay));
		log("updateProgress", "Exit");
	}

	/**
	 * @method hideArrows
	 * @private
	 */
	function hideArrows() {
		animatedMiniguide.hideLeftBrowseArrow();
		animatedMiniguide.hideRightBrowseArrow();
	}

	/**
	 * @method displayUnlockOption Displays the unlock option when the content is locked
	 * @private
	 */
	function displayUnlockOption() {
		animatedMiniguide.showUnlockOptions();
	}

	/**
	 * @method hideUnlockOption hides the unlock option when the content is not locked
	 * @private
	 */
	function hideUnlockOption() {
		animatedMiniguide.hideUnlockOptions();
	}

	/**
	 * Tune to the next nearest favourite channel
	 * wrap round when the highest channel number is reached in favourite list
	 * favourite list = [1,5 16,17,18]
	 * entered key => pick up channel
	 *	1 => 5, 2 => 1, 3 => 1, 4 => 5, 17 => 18, 18 => 1
	 * @method zapThroughFavourite
	 * @private
	 */
	function zapThroughFavourite() {
		var favServices = [],
			channelArray = [],
			favService,
			channelNumber,
			index,
			favServicesLength,
			currentServiceId = $N.platform.system.Preferences.get($N.app.constants.PREF_TV_CURRENT_SERVICE_ID),
			channel = $N.platform.btv.EPG.getChannelByServiceId(currentServiceId);
		favServices = $N.platform.btv.Favourites.getFavouriteChannels($N.app.constants.FAVOURITE_FOLDER_NAME);
		favServices.sort($N.app.SortUtil.sortByLogicalChannelNum);
		favServicesLength = favServices.length;
		// If no favourite channel is set,then channel zap will not happen
		if (favServicesLength < 1) {
			favService = channel;
		} else if (favServicesLength === 1) {
			//if only one favourite channel is there then tune to that channel.
			favService = favServices[0];
		} else {
			// If favourite channel is set,then zap to the next nearest channel in the favourite list.
			// channelArray is created from favServices array by using map function, so as to get the index value.
			channelArray = favServices.map(function (obj) {
				return obj.logicalChannelNum.toString();
			});
			if (channel) {
				channelNumber = channel.logicalChannelNum;
			}
			favService = $N.app.epgUtil.getNextClosestService(channelNumber, favServices);
			// if current channel is there in the favourite list.
			if (favService.logicalChannelNum === channel.logicalChannelNum) {
				index = channelArray.indexOf(favService.logicalChannelNum.toString());
				// if end of the favourite list is not reached then zap to the next nearest channel by incrementing index by 1.
				if (index < (favServicesLength - 1)) {
					favService = favServices[index + 1];
				} else {
					// if end of the favourite list is reached then zap to the first channel in the favourite list.
					favService = favServices[0];
				}
			}
		}
		controller.updateBannerAndTuneIfNeeded(favService);
	}

	/**
	 * Updates the zapper banner with the service object and event information, if supplied.
	 * @method updateBanner
	 * @private
	 * @param {Object} service	the service to display in the banner and tune to.
	 * @param {Object} event  the event data to display in the banner.
	 */
	function updateBanner(service, event) {
		var isBlocked = false,
			serviceObj = service._data || service;
		if (serviceObj && (serviceObj.serviceId || serviceObj.uid)) {
			animatedMiniguide.updateService(service);
		}
		if (event) {
			if (event.serviceId === $N.app.epgUtil.BAD_SERVICE_ID && serviceObj) {
				event.serviceId = serviceObj.serviceId || serviceObj.uid;
			}
			isBlocked = parentalControlHelper.isChannelOrProgramLocked(event);
			animatedMiniguide.updateEvent(
				event,
				miniguideEventManager.getCurrentEventPosition(),
				isBlocked,
				isDisplayedEventPlaying(),
				serviceObj
			);
		}
		if (isBlocked) {
			displayUnlockOption();
		} else {
			hideUnlockOption();
		}
	}

	/**
	 * Updates the browse arrows for the displayed event by hiding or showing them
	 * @method updateBrowseArrows
	 * @param {Boolean} isLocked
	 * @private
	 */
	function updateBrowseArrows(isLocked) {
		var isEventInFuture = (miniguideEventManager.getCurrentEventPosition() !== 0);
		if (isEventInFuture && !isLocked) {
			animatedMiniguide.showLeftBrowseArrow();
		} else {
			animatedMiniguide.hideLeftBrowseArrow();
		}
		if (eventOnDisplay.nextEvent) {
			animatedMiniguide.showRightBrowseArrow();
		} else {
			animatedMiniguide.hideRightBrowseArrow();
		}
	}

	/**
	 * @method updatePrefAudioAndSubtitle
	 * @private
	 */
	function updatePrefAudioAndSubtitle() {
		log("updatePrefAudioAndSubtitle", "Enter & Exit");
		var audioLanguage,
			prefSubState,
			subtitleLanguage = null;

		// FIXME NETUI-110: this does not help, because event is not used anyway
		// remove timout once event will be fixed
		setTimeout(function () {
			animatedMiniguide.reloadAudioSubtitleStatus();
		}, 1000);

		//audioSubtitleChangedOnStreamStarted is boolean variable used to stop the audio change in Mini Guide once taken from preference after tuning to a channel.
		if (audioSubtitleChangedOnStreamStarted === false) {
			$N.app.TracksUtil.activateAudioByPriority();
			$N.app.TracksUtil.activateSubtitleByPriority();
			audioSubtitleChangedOnStreamStarted = true;
		}
	}

	/**
	 * @method setAudioSubtitleChangedOnStreamStartedStatus
	 * This variable is used by Zapper.js to make the variable to false.
	 * @param flag
	 * @private
	 */
	function setAudioSubtitleChangedOnStreamStartedStatus(flag) {
		audioSubtitleChangedOnStreamStarted = flag;
	}

	/**
	 * This should be called whenever we update the banner. This will save us having to duplicate code
	 * when we update the banner by calling animatedMiniguide.scrollLeft, animatedMiniguide.scrollRight etc or
	 * updateBanner. This checks if we need to update the progressBar for start over event and if so,
	 * repositions the playback marker. Also starts a new interval for updating the progress bar and
	 * resets the zapper timeout
	 * @method bannerUpdated
	 * @private
	 */
	function bannerUpdated() {
		if (eventOnDisplay) {
			log("bannerUpdated", "Enter");
			var currentlyLocked = parentalControlHelper.isChannelOrProgramLocked(eventOnDisplay);
			updateBrowseArrows(currentlyLocked);
			if ($N.platform.system.Preferences.get($N.app.constants.PREF_DEFAULT_TIPSFROMNET) === "true") {
				showTipsFromNetBackgroundBox();
			}
			if (currentlyLocked) {
				displayUnlockOption();
			} else {
				hideUnlockOption();
			}
			resetBannerTimeout();
			log("bannerUpdated", "Exit");
		}
	}

	/**
	 * Displays the banner with the current event for a given service by fading it in. Sets a
	 * timeout for auto-hiding it.
	 * @method showBanner
	 * @private
	 * @param {Object} service
	 */
	showBanner = function () {
		log("showBanner", "Enter");
		$N.apps.util.EventManager.fire("zapperClosed");
		var service = controller.getCurrentService();
		$N.app.VolumeControl.hide();
		eventOnDisplay = miniguideEventManager.getCurrentEventForService(service);
		channelIndex = controller.getServicesArray().indexOf(service);
		updateBanner(service, eventOnDisplay);
		miniguideShadow.show();
		miniguideShadow.addCssClass("active");
		animatedMiniguide.setBannerActive(true);
		bannerUpdated();
		log("showBanner", "Exit");
	};

	function pinSuccessCallback() {
		// FIXME 1717: Remove timeout and investigate the reason for the callback being sent too early
		setTimeout(function () {
			controller.updateBannerAndTuneIfNeeded(controller.getServicesArray()[channelIndex], eventOnDisplay);
			$N.app.TracksUtil.activateAudioTrack();
		}, 1000);
	}
	function pinKeyPressCallback(value, key) {
		var callback = function () {
			pinHelper.hideDialog();
			showBanner();
		};
		pinHelper.handlePinKeyPressCallback(key, callback);
		resetBannerTimeout();
	}
	function pinCancelledCallback(key) {
		var keys = $N.apps.core.KeyInterceptor.getKeyMap();
		isExitToBeHandled = false;
		if (key === keys.KEY_LEFT || key === keys.KEY_BACK || key === keys.KEY_EXIT) {
			controller.updateBannerAndTuneIfNeeded(controller.getPreviousService());
		}
		pinHelper.hideDialog();
	}
	pinHelper = new $N.app.PinHelper(pinSuccessCallback, null, null, pinCancelledCallback, $N.app.constants.PIN_DIALOG_SHOW_TIME, false);

	/**
	 * Handles the 'down' and 'up' key press: updates channelIndex and the service/event information
	 * displayed on the banner. Shows the banner if it's currently hidden, sets the browseTime variable if not already set,
	 * updates the eventArray by calling updateEventArray
	 * @method keyUpDownHandler
	 * @private
	 * @param {Number} direction -1 if scrolling up, 1 if scrolling down
	 * @param {Boolean} suppressBanner true if the banner should not be displayed
	 * @return {Boolean} true if we have selected a new channel which is not blocked (i.e: can be navigated to)
	 */
	function keyUpDownHandler(direction, suppressBanner) {
		log('keyUpDownHandler', 'Enter');
		var isBlocked = false,
			servicesArray = controller.getServicesArray(),
			servicesArrayLength = servicesArray.length,
			service,
			miniGuideTimeout = $N.platform.system.Preferences.get($N.app.constants.PREF_ZAPPING_BANNER_TIMEOUT),
			displayedEvent;
		if (suppressBanner !== true && !animatedMiniguide.isBannerActive()) {
			showBanner();
		} else {
			channelIndex = channelIndex + direction;
			if (channelIndex > servicesArrayLength - 1) {
				channelIndex = 0;
			} else if (channelIndex < 0) {
				channelIndex = servicesArrayLength - 1;
			}
			service = servicesArray[channelIndex];
			displayedEvent = miniguideEventManager.getCurrentEventForService(service);
			if (displayedEvent && displayedEvent.serviceId && service && service.serviceId && displayedEvent.serviceId === $N.app.epgUtil.BAD_SERVICE_ID) {
				displayedEvent.serviceId = service.serviceId;
			}
			isBlocked = parentalControlHelper.isChannelOrProgramLocked(displayedEvent);
			eventOnDisplay = displayedEvent;
			animatedMiniguide.handleVerticalScroll(direction, service, displayedEvent, miniguideEventManager.getCurrentEventPosition(), isBlocked, isDisplayedEventPlaying());

			bannerUpdated();
		}
		if (isBlocked || channelIndex === controller.getServiceIndex(controller.getCurrentServiceId())) {
			log('keyUpDownHandler', 'Exit');
			return false;
		}
		log('keyUpDownHandler', 'Exit');
		return true;
	}

	/**
	 * Handles the 'left' key press: updates eventOnDisplay and the event information displayed on
	 * the banner. Shows the banner if it's currently hidden, clears the browseTime variable so it can be set
	 * when user begins to navigate up or down
	 * @method keyLeftHandler
	 * @private
	 */
	function keyLeftHandler() {
		log('keyLeftHandler', 'Enter');
		var isBlocked = false,
			prevEvent;
		if (animatedMiniguide.isBannerActive()) {
			prevEvent = miniguideEventManager.getPreviousEvent();
			if (prevEvent && !parentalControlHelper.isChannelLocked(controller.getServicesArray()[channelIndex])) {
				isBlocked = parentalControlHelper.isChannelOrProgramLocked(prevEvent);
				eventOnDisplay = prevEvent;
				animatedMiniguide.handleRightScroll(prevEvent, isBlocked, miniguideEventManager.getCurrentEventPosition(), isDisplayedEventPlaying());
				bannerUpdated();
			} else {
				animatedMiniguide.hideLeftBrowseArrow();
				resetBannerTimeout();
			}
		} else {
			showBanner();
		}
		log('keyLeftHandler', 'Exit');
	}

	/**
	 * Handles the 'RIGHT' key press: updates eventOnDisplay and the event information displayed on
	 * the banner. Shows the banner if it's currently hidden, clears the browseTime variable so it can be set
	 * when user begins to navigate up or down
	 * @method keyRightHandler
	 * @private
	 */
	function keyRightHandler() {
		var nextEvent,
			isBlocked = false;
		log('keyRightHandler', 'Enter');
		if (animatedMiniguide.isBannerActive()) {
			nextEvent = miniguideEventManager.getNextEvent();
			if (nextEvent && !parentalControlHelper.isChannelLocked(controller.getServicesArray()[channelIndex])) {
				isBlocked = parentalControlHelper.isChannelOrProgramLocked(nextEvent);
				eventOnDisplay = nextEvent;
				animatedMiniguide.handleLeftScroll(nextEvent, isBlocked, miniguideEventManager.getCurrentEventPosition(), isDisplayedEventPlaying());
				bannerUpdated();
				// Hide the right arrow in case of last event
				// nextEvent object has property 'nextEvent' which wont be there in case if it is the last event.
				if (!nextEvent.nextEvent) {
					animatedMiniguide.hideRightBrowseArrow();
				} else {
					animatedMiniguide.showRightBrowseArrow();
				}
			} else {
				animatedMiniguide.hideRightBrowseArrow();
			}
		} else {
			showBanner();
		}
		log('keyRightHandler', 'Exit');
	}

	/**
	 * Method that is called after returning from the action panel for an epg event
	 * @method returnToMiniguide
	 */
	function returnToMiniguide() {
		isMiniguideUpdateRequired = true;
		resetBannerTimeout();
		animatedMiniguide.updateIcons(eventOnDisplay);
	}

	/**
	 * Helper method for keyOkHandler to handle when parentally locked
	 * @method keyOkHandlerWhenParentallyLocked
	 */
	keyOkHandlerWhenParentallyLocked = function () {
		var serviceObj = controller.getServicesArray()[channelIndex],
			isTheChannelLocked;
		if (!pinHelper.isPinShowing()) {//added this check as pinHelper.setDialogProperties creates new new GUI pin dialog every time
			animatedMiniguide.pinDisplayed();
			isTheChannelLocked = parentalControlHelper.isChannelLocked(serviceObj);
			pinHelper.setDialogProperties({
				x: 0,
				y: 0,
				width: 1920,
				height: 1080,
				id: pinDialogId,
				title: isTheChannelLocked ? controller.getString("channelLocked") : controller.getString("programLocked"),
				description: isTheChannelLocked ? controller.getString("unlockChannel") : controller.getString("unlockShow"),
				keyPressedCallback: pinKeyPressCallback,
				titleCssClass: "pinEntryTitle",
				cancelCallback: pinCancelledCallback
			});
			pinHelper.showPinDialog('master', true, null, true);
			$N.app.fullScreenPlayer.tuner.hideVideo();
			$N.app.TracksUtil.deactivateAudioTrack();
			$N.app.TracksUtil.deactivateCurrentSubtitleTrack();
		}
	};

	/**
	 * Helper method for keyOkHandler to handle navigation to Synopsis
	 * @method navigateToSynopsis
	 */
	function navigateToSynopsis() {
		var serviceObj = $N.platform.btv.EPG.getChannelByServiceId(eventOnDisplay.serviceId),
			isTheChannelLocked = parentalControlHelper.isChannelLocked(serviceObj);
		if ($N.app.EventUtil.isValidEvent(eventOnDisplay)) {
			if ($N.app.ParentalControlUtil.isChannelOrProgramLocked(eventOnDisplay) && $N.app.genreUtil.isAdultChannel(serviceObj)) {
				pinHelper.setDialogProperties({
					x: 0,
					y: 0,
					width: 1920,
					height: 1080,
					id: pinDialogId,
					title: isTheChannelLocked ? controller.getString("channelLocked") : controller.getString("programLocked"),
					description: controller.getString("unlockChannel"),
					cancelCallback: function () {
						pinHelper.hideDialog();
					}
				});
				pinHelper.setAuthenticationSuccessCallback(function () {
					window.parent.clearTimeout(zapperTimer);
					isMiniguideUpdateRequired = false;
					$N.app.epgUtil.navigateToSynopsis(eventOnDisplay, isDisplayedEventPlaying(), returnToMiniguide);
				});
				pinHelper.showPinDialog('master', true, null, true);
			} else {
				window.parent.clearTimeout(zapperTimer);
				isMiniguideUpdateRequired = false;
				$N.app.epgUtil.navigateToSynopsis(eventOnDisplay, isDisplayedEventPlaying(), returnToMiniguide);
			}
		}
	}

	/**
	 * Handles the 'ok' key press: if the banner is currently visible, calls the controller's
	 * activate method with the selected service to re-tune to it; if user is in direct channel entry mode
	 * then the directChannelEntry okKeyHandler method is called; otherwise, just shows the banner.
	 * @method keyOkHandler
	 * @private
	 * @param {Boolean} suppressBanner true if the banner should not be displayed
	 */
	function keyOkHandler(suppressBanner) {
		log('keyOkHandler', 'ok key pressed');
		var servicesArray = controller.getServicesArray(),
			servicesArrayLength = servicesArray.length,
			serviceObj,
			nowEventForServiceObjEventId,
			currentServiceId,
			currentEventId,
			eventInfoForPip = null;

		if (directChannelEntry && directChannelEntry.okKeyHandler()) {
			return;
		}

		//Selected Audio and Subtitle option in Mini Guide is activated if isAudioSubtitleTogglingMode is set to "true" in MiniguideEventGroup.js
		if (activateAudioSubtitleOnKeyPress()) {
			log('keyOkHandler', 'Audio and Subtitle Toggle Handling: ');
			return;
		}

		if (animatedMiniguide.isBannerActive() || suppressBanner === true) {
			if (servicesArrayLength > 0) {
				serviceObj = servicesArray[channelIndex];
				nowEventForServiceObjEventId = $N.app.epgUtil.getEvent("current", serviceObj.serviceId).eventId;
				currentServiceId = controller.getCurrentServiceId();
				currentEventId = miniguideEventManager.getCurrentEvent().eventId;
				eventInfoForPip = $N.app.epgUtil.getDataForInfoCard(miniguideEventManager.getCurrentEventForService(controller.getCurrentService()));
				log('keyOkHandler', 'channel index: ' + String(channelIndex));
				if (eventOnDisplay.eventId === nowEventForServiceObjEventId) {
					if ((currentEventId !== eventOnDisplay.eventId) || (currentServiceId !== serviceObj.serviceId)) {
						window.parent.clearTimeout(zapperTimer);
						view.largeRecordIcon.hide();
						controller.updateBannerAndTuneIfNeeded(serviceObj, eventOnDisplay);
					} else {
						hideBanner();
					}
				} else {
					hideBanner();
				}
			}
		} else {
			if (suppressBanner !== true) {
				showBanner();
			}
		}
		animatedMiniguide.reloadAudioSubtitleStatus();
	}

	/**
	 * Detects a key repeat and sets handleVerticalScroll to the appropriate function
	 * @method keyRepeatHandler
	 * @param {String} key
	 * @param {Object} keys
	 * @private
	 */
	function keyRepeatHandler(key, keys) {
		var now = new Date().getTime(),
			isKeyPressWithinThreshold = (lastKeyPressTimestamp && (now - lastKeyPressTimestamp) <= KEY_REPEAT_THRESHOLD_MS);

		switch (key) {
		case keys.KEY_UP:
		case keys.KEY_DOWN:
		case keys.KEY_LEFT:
		case keys.KEY_RIGHT:
		case keys.KEY_CHAN_UP:
		case keys.KEY_CHAN_DOWN:
			if (key === lastKeyPress && isKeyPressWithinThreshold) {
				animatedMiniguide.setToFastScroll();
			} else {
				animatedMiniguide.setToAnimatedScroll();
			}
			break;
		default:
		}

		lastKeyPress = key;
		lastKeyPressTimestamp = now;

	}

	/**
	 * Callback to show the event details after fast scrolling is complete
	 * @method bannerHighlightedCallback
	 * @private
	 */
	function bannerHighlightedCallback() {
		var event = miniguideEventManager.getCurrentEvent(),
			service = $N.app.epgUtil.getServiceById(event.serviceId);
		updateBanner(service, event);
		updateProgress();
	}

	/**
	 * Function to show the record icon and fade out.
	 * @method showRecordIcon
	 * @private
	 */
	function showRecordIcon() {
		if ($N.app.EventUtil.isEventShowingNow(eventOnDisplay)) {
			view.largeRecordIcon.show();

			if (iconTimeOut) {
				clearTimeout(iconTimeOut);
			}
			iconTimeOut = setTimeout(function () {
				view.largeRecordIcon.hide();
				iconTimeOut = null;
			}, $N.app.constants.SURFER_DURATION_DEFAULT);
		}
	}

	/**
	 * Function to toggle the visibility of the large record icon based on the recording status.
	 * @method toggleLargeRecordIcon
	 * @param {Object} event
	 * @private
	 */
	function toggleLargeRecordIcon(event) {
		var recordingStatus = $N.platform.btv.PVRManager.getRecordingStatusByEvent(event),
			manualRecordingStatus = null;
		switch (recordingStatus) {
		case $N.app.PVRUtil.ACTIVE:
		case $N.app.PVRUtil.ACTIVE_IN_SERIES:
			showRecordIcon();
			animatedMiniguide.updateIcons(event);
			return;
		}
		if (event && event.serviceId) {
			manualRecordingStatus = $N.platform.btv.PVRManager.getServiceRecordingStatus(event.serviceId);
			switch (manualRecordingStatus) {
			case $N.app.PVRUtil.ACTIVE:
			case $N.app.PVRUtil.ACTIVE_IN_SERIES:
				showRecordIcon();
				animatedMiniguide.updateIcons(event);
				break;
			case $N.app.PVRUtil.COMPLETED:
			case $N.app.PVRUtil.PARTIAL:
				animatedMiniguide.updateIcons(event);
				break;
			}
		}
	}

	/**
	 * Function to show the pin pop up if the next event on play has higher rating.
	 * @method showPinPopUpOnBlockedEvent
	 * @private
	 */
	function showPinPopUpOnBlockedEvent() {
		if (parentalControlHelper.isChannelOrProgramLocked(eventOnDisplay)) {
			if (animatedMiniguide.isBannerActive()) {
				hideBanner();
			} else {
				keyOkHandlerWhenParentallyLocked();
			}
		}
	}

	/**
	 *Function to hide pin pop up when next event has lesser rating
	 * @method  hidePinPopUpForUnblockedEvent
	 * @private
	 */
	function hidePinPopUpForUnblockedEvent() {
		me.hidePinDialog();
	}

	/**
	 * Function to hide banner and show purchase popup
	 * when access is denied because of PPV
	 * @method  caPPVAccessDeniedListener
	 * @private
	 */
	function caPPVAccessDeniedListener(eventObj) {
		if (controller.isCaAccessDeniedSubscribed()) {
			hideBanner();
			controller.setCaAccessDeniedUnsubscriptionCallback(function () {
				$N.app.PPVHelper.hidePPVRelatedDialogs();
			});
		}
	}

	/**
	 * Function to update the miniguide banner when event boundary changes
	 * when miniguide is set to always
	 * @method  eventBoundaryChangedListener
	 * @param {object}, data object contains next event information
	 */
	function eventBoundaryChangedListener(data) {
		var eventId = data.eventBoundaryChangedInfo.eventID,
			service = null,
			isBoundaryChanged = true;

		if (eventOnDisplay.eventId === eventId) {
			isBoundaryChanged = false;
		}

		if (animatedMiniguide.isBannerActive() && isBoundaryChanged) {
			service = controller.getCurrentService();
			eventOnDisplay = miniguideEventManager.getCurrentEventForService(service);
			channelIndex = controller.getServicesArray().indexOf(service);
			updateBanner(service, eventOnDisplay);
			bannerUpdated();
		}
	}

	return {
		/**
		 * Initialises the zapper banner, positions it, sets its data mapper function,
		 * sets the channelEnteredCallback for the directChannelEntry class
		 * @method initialise
		 */
		initialise: function () {
			me = this;
			log('initialise', 'Enter');
			animatedMiniguide.setItemHighlightedCallback(bannerHighlightedCallback);
			animatedMiniguide.setBtvDataMappers($N.app.DataMappers.getServiceDataMapper(), eventDataMapper);
			directChannelEntry.setChannelEnteredCallback(
				function (enteredNumber) {
					if (enteredNumber) {
						log("ChannelEnteredCallback", "Enter");
						controller.channelNumberEntered(enteredNumber);
						resetEventOnDisplay();
					} else {
						//If all the entered number in DCE is removed using LEFT key, after timeout the Miniguide should be updated with current service
						me.update(controller.getCurrentService());
					}
					animatedMiniguide.setServiceNumberCssClass(CHANNEL_NUMBER_DISPLAY_CSS);
					log("ChannelEnteredCallback", "Exit");
				}
			);
			animatedMiniguide.setResetBannerTimeout(resetBannerTimeout);
			animatedMiniguide.setClearBannerTimeout(clearBannerTimeout);
			$N.app.fullScreenPlayer.tuner.registerQosImprovedListener(hideNoSignalDialogue);
			log("initialise", "Exit");
		},
		/**
		 * Activates the zapper banner, optionally with a channel index
		 * @method activate
		 * @param {Number} [channelIndex] index of the service from serviceArray
		 */
		activate: function (channelIndex) {
			log("activate", "Enter");
			if (channelIndex === undefined || channelIndex === null) {
				channelIndex = controller.getServiceIndex(controller.getCurrentServiceId()) || 0;
			}
			showBanner();
			// update view when user changes due to pin entry
			$N.platform.ca.ParentalControl.setUserChangedCallback(function () {
				if (animatedMiniguide.isBannerActive()) {
					me.update($N.app.epgUtil.getServiceById(eventOnDisplay.serviceId), eventOnDisplay);
				}
			});
			minuteTimer.register("MiniguideClock", function () {
				animatedMiniguide._activeEventGroup.updateTime();
				updateProgress(); // When miniguide is set to always update the progress bar in one minute time interval
			});
			minuteTimer.enable("MiniguideClock");
			log("activate", "Exit");
		},
		/**
		 * Updates the zapper banner and shows it if it's not already shown. Service object or event
		 * information may optionally be supplied; if they're not, current channel and programme
		 * information is used.
		 * @method update
		 * @param {Object} [service]
		 * @param {EPGEvent} [eventData]
		 */
		update: function (service, eventData) {
			log("update", "Enter");
			var serviceId;
			if (!service || !service.serviceId) {
				serviceId = controller.getCurrentServiceId();
				if (!service) {
					service = $N.app.epgUtil.getServiceById(serviceId);
				}
			} else {
				serviceId = service.serviceId;
			}
			if (eventData === undefined || eventData === null) {
				eventData = miniguideEventManager.getCurrentEventForService(service);
			}
			log('update', 'service id: ' + serviceId + ', event: ' + eventData.title);
			channelIndex = controller.getServiceIndex(serviceId) || 0;
			hideArrows();
			updateBanner(service, eventData);
			eventOnDisplay = eventData;
			if (animatedMiniguide.isBannerActive()) {
				resetBannerTimeout();
				bannerUpdated();
			} else {
				showBanner();
			}
			log("update", "Exit");
		},
		/**
		 *Updates the miniguide if returned true.
		 *@method isUpdateRequired
		 *@return {boolean} isMiniguideUpdateRequired
		 */
		isUpdateRequired: function () {
			log("isUpdateRequired", "Enter");
			return isMiniguideUpdateRequired;
		},
		/**
		 * Hides the banner and resets the channelIndex to the current service
		 * @method passivate
		 */
		passivate: function () {
			log("passivate", "Enter");
			channelIndex = controller.getServiceIndex(controller.getCurrentServiceId()) || 0;
			hideBanner(true);
			clearBannerTimeout();
			$N.platform.ca.ParentalControl.setUserChangedCallback(function () {});
			log("passivate", "Exit");
		},

		/**
		 * @method setChannelUpDown Changes to the channel up or down
		 * @param {Number} channelsToJump eg. -1 to move down one position, 1 to move up one position
		 * @param {Boolean} suppressBanner true if the banner should not be displayed
		 */
		setChannelUpDown: function (channelsToJump, suppressBanner) {
			log("setChannelUpDown", "Enter");
			var isBlocked = false,
				servicesArray = controller.getServicesArray(),
				servicesArrayLength = servicesArray.length,
				service,
				displayedEvent;

			if (suppressBanner !== true && !animatedMiniguide.isBannerActive()) {
				showBanner();
			}

			channelIndex = controller.getServicesArray().indexOf(controller.getCurrentService());
			channelIndex = channelIndex + channelsToJump;
			if (channelIndex > servicesArrayLength - 1) {
				channelIndex = 0;
			} else if (channelIndex < 0) {
				channelIndex = servicesArrayLength - 1;
			}

			service = servicesArray[channelIndex];

			displayedEvent = miniguideEventManager.getCurrentEventForService(service);
			if (displayedEvent && displayedEvent.serviceId && service && service.serviceId && displayedEvent.serviceId === $N.app.epgUtil.BAD_SERVICE_ID) {
				displayedEvent.serviceId = service.serviceId;
			}

			isBlocked = parentalControlHelper.isChannelOrProgramLocked(displayedEvent);
			eventOnDisplay = displayedEvent;
			controller.tuneWithoutBannerUpdate(service, eventOnDisplay);

			animatedMiniguide.handleVerticalScroll(channelsToJump, service, displayedEvent, miniguideEventManager.getCurrentEventPosition(), isBlocked, isDisplayedEventPlaying());
			bannerUpdated();

			animatedMiniguide.reloadAudioSubtitleStatus();

			log("setChannelUpDown", "Exit");
		},

		/**
		 * @method keyHandler Handles key presses.
		 * @param {String} key
		 * @return {Boolean} true if handled; false if not
		 */
		keyHandler: function (key, repeats) {
			log("keyHandler", "Enter");
			var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
				SERVICE_CONTAINER_Y_POSITION = 0,
				recordingStateChangedCallback = function (returnObj) {
					if (returnObj && returnObj.event) {
						animatedMiniguide.updateIcons(returnObj.event);
					}
				};
			if (!$N.app.GeneralUtil.isKeyReleaseEvent(key)) {
				keyRepeatHandler(key, keys);
			}

			if (repeats) {
				switch (key) {
				case keys.KEY_EXIT:
					return true; // Absorb key-press
				}
			}

			if (pinHelper.isPinShowing()) {
				resetBannerTimeout();
				pinHelper.keyHandler(key);
			} else {
				switch (key) {

				case keys.KEY_LEFT:
					if (directChannelEntry.isActive()) {
						directChannelEntry.updateChannelDigits(key, animatedMiniguide.getServiceNumber(), animatedMiniguide.getCursor());
					}
					break;
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
					if (!animatedMiniguide.isBannerActive()) {
						showBanner();
					}
					hideArrows();
					animatedMiniguide.setServiceName("");
					animatedMiniguide.hideFavouriteStatus();
					animatedMiniguide.setServiceContainerY(SERVICE_CONTAINER_Y_POSITION);
					animatedMiniguide.setServiceNumberCssClass(CHANNEL_NUMBER_ENTRY_CSS);
					animatedMiniguide.setCursorCssClass(CHANNEL_NUMBER_ENTRY_CSS);
					directChannelEntry.updateChannelDigits(key, animatedMiniguide.getServiceNumber(), animatedMiniguide.getCursor());
					resetBannerTimeout();
					log("keyHandler", "Exit1");
					return true;
				case keys.KEY_RED:
					if (animatedMiniguide.isBannerActive() && eventOnDisplay.eventId !== $N.app.epgUtil.BAD_EVENT_ID) {
						resetBannerTimeout();
						navigateToSynopsis();
					} else {
						keyOkHandler();
					}
					log("keyHandler", "Exit2");
					return true;
				case keys.KEY_GREEN:
					resetBannerTimeout();
					if (animatedMiniguide.isBannerActive()) {
						animatedMiniguide.showCurrentAudioTrackAndToggle();
					} else {
						keyOkHandler();
					}
					log("keyHandler", "Exit3");
					return true;
				case keys.KEY_YELLOW:
					resetBannerTimeout();
					if (animatedMiniguide.isBannerActive()) {
						animatedMiniguide.showCurrentSubtitleStateAndToggle();
					} else {
						keyOkHandler();
					}
					log("keyHandler", "Exit4");
					return true;
				case keys.KEY_OK:
					resetBannerTimeout();
					keyOkHandler(false);
					log("keyHandler", "Exit5");
					return true;
				default:
					if ($N.app.GeneralUtil.isKeyReleaseEvent(key)) {
						return false;
					}
					directChannelEntry.cancelEntry();
				}
				switch (key) {
				case keys.KEY_UP:
					activateAudioSubtitleOnKeyPress();
					keyUpDownHandler(1);
					break;
				case keys.KEY_DOWN:
					activateAudioSubtitleOnKeyPress();
					keyUpDownHandler(-1);
					break;
				case keys.KEY_RIGHT:
					keyRightHandler();
					break;
				case keys.KEY_LEFT:
					keyLeftHandler();
					break;
				case (keys.KEY_UP + KEY_RELEASE_SUFFIX):
				case (keys.KEY_DOWN + KEY_RELEASE_SUFFIX):
				case (keys.KEY_RIGHT + KEY_RELEASE_SUFFIX):
				case (keys.KEY_LEFT + KEY_RELEASE_SUFFIX):
					animatedMiniguide.handleKeyUpEvent();
					break;
				case keys.KEY_INFO:
					if (!animatedMiniguide.isBannerActive()) {
						showBanner();
					} else {
						activateAudioSubtitleOnKeyPress(); //activation of audio/subtitle and appropriate text change is made sure before exit.
						resetBannerTimeout();
						navigateToSynopsis();
					}
					break;
				case keys.KEY_BLUE:
					if (!animatedMiniguide.isBannerActive()
							&& $N.app.MessageUtil.isMailIconDisplaying()) {
						$N.app.MessageUtil.mailIconKeyProcess();
						break;
					}
					if (eventOnDisplay.eventId !== $N.app.epgUtil.BAD_EVENT_ID) {
						controller.setOptionsLaunch(true);
						if (!parentalControlHelper.isChannelOrProgramLocked(eventOnDisplay)) {
							$N.platform.btv.PVRManager.setRecordingRequestConflictsCallback(function () { });
							activateAudioSubtitleOnKeyPress();
							window.parent.clearTimeout(zapperTimer);
						}
						isMiniguideUpdateRequired = false;
						$N.app.ContextHelper.openContext("OPTIONS", {
							activationContext: {
								"data": eventOnDisplay,
								"type": "epg",
								"showBackgroundGradient": true
							},
							navCompleteCallback: returnToMiniguide
						});
					}
					break;
				case keys.KEY_CHAN_DOWN:
					animatedMiniguide.resetAudioSubtitle();
					this.setChannelUpDown(-1);
					break;
				case keys.KEY_CHAN_UP:
					animatedMiniguide.resetAudioSubtitle();
					this.setChannelUpDown(1);
					break;
				case keys.KEY_TV:
					if (!animatedMiniguide.isBannerActive()) {
						showBanner();
					}
					break;
				case keys.KEY_RECORD:
					if ($N.app.PVRUtil.isRecordable(eventOnDisplay)) {
						$N.app.PVRUtil.eventOrManualRecordSetOrCancel(eventOnDisplay, recordingStateChangedCallback);
					}
					break;
				case keys.KEY_STOP:
					$N.app.PVRUtil.cancelEventOrManualRecord(eventOnDisplay, recordingStateChangedCallback);
					break;
				case keys.KEY_FAVOURITES:
					if (!animatedMiniguide.isBannerActive()) {
						showBanner();
					} else {
						zapThroughFavourite();
					}
					break;
				case keys.KEY_EXIT:
					activateAudioSubtitleOnKeyPress(); //activation of audio/subtitle and appropriate text change is made sure before exit.
					if (!animatedMiniguide.isBannerActive() && $N.app.FeatureManager.isPIPActive()) {
						hideBanner(true); // if true is passed then it will hide animated mini-guide.
						$N.app.FeatureManager.setIsPIPActive(false);
						$N.apps.util.EventManager.fire("pipDeActivated");
					} else {
						if (isExitToBeHandled === true) {
							hideBanner(); // if false / nothing is passed then it will set fade value to 0 so that miniguide is vanished.
						} else {
							isExitToBeHandled = true;
						}
					}
					return true;
				default:
					activateAudioSubtitleOnKeyPress(); //activation of audio/subtitle and appropriate text change is made sure before exit.
					clearBannerTimeout();
					log("keyHandler", "Exit6");
					return false;
				}

			}
			log("keyHandler", "Exit7");
			return true;
		},
		/**
		 * Returns string representation of this class
		 * @method toString
		 * @return {String}
		 */
		toString: function () {
			return "Miniguide";
		},
		/**
		 * Updates the record icon in the active zapper banner
		 * Called from $N.platform.btv.PVRManager.registerUIRefreshListener
		 * that is registered in Zapper.activate()
		 * @method updateIconsUIRefreshListener
		 */
		updateIconsUIRefreshListener: function () {
			toggleLargeRecordIcon(eventOnDisplay);
		},
		isBannerActive: function () {
			return animatedMiniguide.isBannerActive();
		},
		hidePinDialog: function () {
			if (pinHelper.isPinShowing()) {
				pinHelper.hideDialog();
			}
		},
		getNextEvent: function () {
			return miniguideEventManager.getNextEvent();
		},
		/**
		 * returns current and next event for the corresponding service
		 * @method getEventDataForService
		 * @public
		 * @param {object} service
		 */

		getEventDataForService: function (service) {
			miniguideEventManager.getCurrentEventForService(service);
		},
		updatePrefAudioAndSubtitle: updatePrefAudioAndSubtitle,
		setAudioSubtitleChangedOnStreamStartedStatus: setAudioSubtitleChangedOnStreamStartedStatus,
		hideBanner: hideBanner,
		showNoSignalDialogue: showNoSignalDialogue,
		hideNoSignalDialogue: hideNoSignalDialogue,
		showPinPopUpOnBlockedEvent: showPinPopUpOnBlockedEvent,
		clearBannerTimeout: clearBannerTimeout,
		hidePinPopUpForUnblockedEvent: hidePinPopUpForUnblockedEvent,
		caPPVAccessDeniedListener: caPPVAccessDeniedListener,
		eventBoundaryChangedListener: eventBoundaryChangedListener
	};
};
