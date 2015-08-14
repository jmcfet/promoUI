/**
 * Mosaic module description.
 *
 * Make sure that the text after @module does not contain a space, use a hyphen if you need to.
 * Only one module block is needed for each context.
 *
 * @module Mosaic
 */

/**
 * Mosaic class description.
 * @class Mosaic
 * @static
 */

var Mosaic = (function () {

	// Private functions and variables go here.
	var $N = window.parent.$N,
		log = new $N.apps.core.Log("Mosaic", "Mosaic"),
		MOSAIC_VSPACE = 63,
		MOSAIC_HSPACE = 90,
		SCREEN_WIDTH = 1920,
		GAP_BETWEEN_EVT_TITLE_SERIESINFO = 10,
		FIRST_ICON_X = 350,
		ICON_PADDING = 12,
		KEY_RELEASE_SUFFIX = $N.app.constants.KEY_RELEASE_SUFFIX,
		currentGenre = 0,
		isEmptyChannelList = true,
		isSubscribeChannel = true,
		fadeAnim = null,
		isLock = false,
		timerRefresh = null,
		pinHelper = null,
		keyReleaseTimeOut = null,
		KEY_RELEASE_DURATION = $N.app.constants.KEY_RELEASE_TIMEOUT_MS,
		endOfCurrentEvent = 0,
		PVRSubscriptionIds = [],
		evtPoster = "../../../customise/resources/images/net/ep1.png",
		streamDisabled = $N.app.constants.CA_PLAY_ERRORS.streamDisabledReason,
		ANIM_RESTART_INTERVAL = 1000,
		mosaicTitle = null,
		_smartCardInserted = true,
		channelDataMapper = {
			getEventObj: function (serviceObj) {
				if (serviceObj) {
					var service = serviceObj._data || serviceObj;
					return $N.app.epgUtil.getEvent("current", service.serviceId);
				} else {
					return null;
				}
			}
		},
		eventDataMapper = {
			getServiceName: function (serviceObj) {
				var service = serviceObj._data || serviceObj,
					serviceName = service.name || "";
				return serviceName;
			},
			getServiceNumber: function (serviceObj) {
				var service = serviceObj._data || serviceObj,
					serviceNumber = service.logicalChannelNum || service.number || service.channelKey || '';
				return serviceNumber;
			},
			getEventTitle: function (eventObject) {
				if (eventObject && $N.app.ParentalControlUtil.isChannelOrProgramLocked(eventObject)) {
					var service = $N.platform.btv.EPG.getChannelByServiceId(eventObject.serviceId);
					if (service && $N.app.genreUtil.isAdultChannel(service)) {
						return Mosaic.getString("adultContent");
					}
				}
				return eventObject.title || "";
			},
			getEventSeriesEpisodeTitle: function (eventObject, extendedInfo) {
				if (eventObject && !$N.platform.ca.ParentalControl.isCurrentUserMaster()) {
					var service = $N.platform.btv.EPG.getChannelByServiceId(eventObject.serviceId);
					if (service && $N.app.genreUtil.isAdultChannel(service)) {
						return "";
					}
				}
				return $N.app.epgUtil.getSeasonEpisodeShort(eventObject);
			},
			getEventGenre: function (eventObject) {
				var event = eventObject._data || eventObject;
				return $N.app.genreUtil.getGenresByEvent(event);
			},
			getRecordingStatus: function (eventObject) {
				var event = eventObject._data || eventObject;
				return $N.platform.btv.PVRManager.getRecordingStatusByEvent(event);
			},
			getDescription: function (eventObject) {
				var event = eventObject._data || eventObject,
					service;
				if (eventObject && $N.app.ParentalControlUtil.isChannelOrProgramLocked(eventObject)) {
					service = $N.platform.btv.EPG.getChannelByServiceId(eventObject.serviceId);
					if (service && $N.app.genreUtil.isAdultChannel(service)) {
						return Mosaic.getString("adultContent");
					} else if ($N.app.epgUtil.isAdultEvent(eventObject)) {
						return Mosaic.getString("synopsisUnavailable");
					}
				}
				return event.longDesc || event.shortDesc || "";
			},
			getProgressBarData: function (eventObject) {
				return {
					minimum: (eventObject && eventObject.startTime) ? eventObject.startTime : 0,
					maximum: (eventObject && eventObject.endTime) ? eventObject.endTime : 0,
					progress: (eventObject && eventObject.startTime) ? new Date().getTime() : 0
				};
			},
			isAdultChannel: function (eventObject) {
				var service = $N.platform.btv.EPG.getChannelByServiceId(eventObject.serviceId);
				return $N.app.genreUtil.isAdultChannel(service);
			}
		},
		validScrollWidth = 0,
		realScrollWidth = 0,
		isFromMediaPlayer = false,
		currentPlayUri = "",
		unSubscribedUri = "",
		isSingalLoss = false,
		mosaicMenu = {},
		mosaicPreview = {},
		eventInfo = {},
		view = {},
		storedServiceId = 0,
		favouritesToggledEventSubscriptionId = null,
		genreValueToRestore = null;

	/**
	 * @method displayOrHideRecordingIcon
	 * @private
	 */
	function displayOrHideRecordingIcon() {
		var focusedChannel = mosaicMenu.getSelectedItem(),
			currentEvent = channelDataMapper.getEventObj(focusedChannel);
		if (focusedChannel && currentEvent) {
			view.indicator.RCUIcn.setVisible($N.app.PVRCapability.isPVREnabled() && $N.app.PVRUtil.isRecordable(currentEvent, focusedChannel));
		} else {
			view.indicator.RCUIcn.setVisible(false);
		}
	}

	/**
	 * @method PVRStatusUpdateListener
	 * @status {Object} the status object for PVR
	 * @private
	 */
	function PVRStatusUpdateListener(status) {
		log("PVRStatusUpdateListener", "Enter");
		displayOrHideRecordingIcon();
		log("PVRStatusUpdateListener", "Exit");
	}

	/**
	 * Refresh the texts and the icons for now/next view
	 * @method refreshInfo
	 */
	function setInfoIconText() {
		view.indicator.redIcn.setText(Mosaic.getString("redKeyName"));
		view.indicator.greenIcn.setText(Mosaic.getString("greenKeyName"));
		view.indicator.RCUIcn.setText(Mosaic.getString("RCUKeyName"));
		view.OK.okIcn.setText(Mosaic.getString("okKeyName"));
	}
		/**
	 * Refresh the texts and the icons for now/next view
	 * @method refreshInfo
	 */
	function showIconText() {
		view.indicator.redIcn.show();
		view.OK.okIcn.show();
	}

	function updateRedIcon(state) {
		var currentUrl =  view.indicator.redIcn.getHref(),
			iconPath = state ? $N.app.constants.ACTIVE_INFO_BUTTON_PATH : $N.app.constants.INACTIVE_INFO_BUTTON_PATH;
		if (currentUrl !== iconPath) {
			view.indicator.redIcn.setHref(iconPath);
		}
		if ($N.app.PVRCapability.isPVREnabled() && state) {
			view.indicator.RCUIcn.show();
		} else {
			view.indicator.RCUIcn.hide();
		}
	}

	/**
	 * Refresh if unsubscribed channel, hide record and OK icon
	 * @method updateIconsForUnSubscribed
	 */
	function updateIconsForUnSubscribed() {
		if (!isSubscribeChannel) {
			view.indicator.RCUIcn.hide();
			view.OK.okIcn.hide();
		} else {
			displayOrHideRecordingIcon();
			view.OK.okIcn.show();
		}
	}

	function serviceTune(service, event) {
		if (service) {
			if (service.uri === unSubscribedUri) {
				mosaicPreview.setOpacity(1);
				if (!_smartCardInserted) {
					mosaicPreview.showSmartCardNotInsertedText();
				} else {
					mosaicPreview.showUnsubscribeText();
				}
				updateIconsForUnSubscribed();
			} else {
				if (service && currentPlayUri === service.uri) {
					mosaicPreview.setOpacity(0);
				} else {
					mosaicPreview.tuneScaledVideo(service, event);
					mosaicPreview.setOpacity(1);
				}
			}
		}
	}
	/**
	 * Method that is called from Focus, which will restore the genre value if it is set
	 * @method restoreGenreValueIfSet
	 */
	function restoreGenreValueIfSet() {
		log("restoreGenreValueIfSet", "Enter");
		if (genreValueToRestore) {
			currentGenre = genreValueToRestore;
			genreValueToRestore = null;
		}
		log("restoreGenreValueIfSet", "Exit");
	}
	/**
	 * Method that is called while navigating to synopsis to keep the genre value and
	 * use this genre value when come back from synopsis to maintain the same genre status
	 * @method saveCurrentGenreValue
	 */
	function saveCurrentGenreValue() {
		log("saveCurrentGenreValue", "Enter");
		genreValueToRestore = currentGenre;
		log("saveCurrentGenreValue", "Exit");
	}
	/**
	 * Method that is called after returning from the action panel for an epg event
	 * @method returnToMosaic
	 */
	function returnToMosaic() {
		log("returnToMosaic", "Enter");
		var focusedChannel = mosaicMenu.getSelectedItem(),
			currentEvent = channelDataMapper.getEventObj(focusedChannel);
		log("returnToMosaic", "Exit");
	}
	/**
	 * Helper method for keyOkHandler to handle navigation to Synopsis
	 * @method navigateToSynopsis
	 */
	function navigateToSynopsis() {
		log("navigateToSynopsis", "Enter");
		var focusedChannel = mosaicMenu.getSelectedItem(),
			isChannelLocked = $N.app.ParentalControlUtil.isChannelLocked(focusedChannel),
			CurrentEvent = channelDataMapper.getEventObj(focusedChannel);
		if ($N.app.ParentalControlUtil.isChannelOrProgramLocked(CurrentEvent) && $N.app.genreUtil.isAdultChannel(focusedChannel)) {
			pinHelper.setDialogProperties({
				x: 0,
				y: 0,
				width: 1920,
				height: 1080,
				id: 'mosaicPinDialogId',
				title: isChannelLocked ? Mosaic.getString("channelLocked") : Mosaic.getString("programLocked"),
				description: isChannelLocked ? Mosaic.getString("unlockChannel") : Mosaic.getString("unlockShow"),
				cancelCallback: function () {
					pinHelper.hideDialog();
				}
			});
			pinHelper.setAuthenticationSuccessCallback(function () {
				saveCurrentGenreValue();
				$N.app.epgUtil.navigateToSynopsis(CurrentEvent, false, returnToMosaic);
			});
			pinHelper.showPinDialog('master', true);
		} else {
			saveCurrentGenreValue();
			$N.app.epgUtil.navigateToSynopsis(CurrentEvent, false, returnToMosaic);
		}
	}

	/**
	 * @method updateDonwUpArrow
	 */
	function updateDownUpArrows() {
		if (isEmptyChannelList) {
			return;
		}
		if (mosaicMenu.isAtFirstPage()) {
			view.upArrow.hide();
		} else {
			view.upArrow.show();
		}
		if (mosaicMenu.isAtLastPage()) {
			view.downArrow.hide();
		} else {
			view.downArrow.show();
		}
	}



	/**
	 * @method updateProgressBar
	 * @param {Object} progressData an object comprising the data needed for the progress bar
	 * ...(minimum, maximum and progress values)
	 */
	function updateProgressBar(progressData) {
		log("updateProgressBar", "Enter");
		var startLabel = $N.apps.util.Util.formatTime(new Date(progressData.minimum), "HH:MM"),
			endLabel = $N.apps.util.Util.formatTime(new Date(progressData.maximum), "HH:MM");
		eventInfo.progressBar.setMinimumValue(progressData.minimum);
		eventInfo.progressBar.setMaximumValue(progressData.maximum);

		eventInfo.eventStartTime.setText(startLabel);
		eventInfo.eventEndTime.setText(endLabel);
		eventInfo.progressBar.setProgress(progressData.progress);
		endOfCurrentEvent = progressData.maximum;

		log("updateProgressBar", "Exit");
	}

	/**
	 * Modify event title and series episode position and length according to their real text length
	 *
	 * @method updateEventSeriesEpisodeTitle
	 */
	function updateEventSeriesEpisodeTitle(event, extendedInfo) {
		log("updateEventSeriesEpisodeTitle", "Enter");
		var infoGroupX = eventInfo.getTrueX(),
			SPACE_WITH_BORDER = 94,
			episodeDetail = "",
			eventTitle = "";

		validScrollWidth = SCREEN_WIDTH - infoGroupX  - SPACE_WITH_BORDER;

		episodeDetail = eventDataMapper.getEventSeriesEpisodeTitle(event, extendedInfo);
		eventTitle = eventDataMapper.getEventTitle(event);
		if (episodeDetail) {
			eventTitle = eventTitle + " - " + episodeDetail;
		}
		view.eventTitle.show();
		view.eventTitle.setText(eventTitle);
		if (view.eventTitle.isTextOverflow()) {
			view.eventTitleWithEpisode.hide();
		} else {
			view.eventTitle.hide();
			view.eventTitleWithEpisode.setText(eventTitle);
			view.eventTitleWithEpisode.setSpanOnText(episodeDetail);
			view.eventTitleWithEpisode.show();
		}
	}

	/**
	 * Method for updating event information
	 * @method updateRecIcons
	 */
	function updateRecIcons() {
		var event = channelDataMapper.getEventObj(mosaicMenu.getSelectedItem()),
			recordIconPosition = null;
		eventInfo.startOverIcon.update(event);
		recordIconPosition = eventInfo.startOverIcon.isVisible() ? FIRST_ICON_X + eventInfo.startOverIcon.getTrueWidth() + ICON_PADDING : FIRST_ICON_X;
		eventInfo.recordIcon.update(event, recordIconPosition);
	}

	/**
	 * Method for updating eventInfo group
	 * @method updateEventInfoExpectPreviewArea
	 * @param {Boolean} true if show event info content
	 */
	function updateEventInfoExpectPreviewArea(isShow) {
		if (isShow) {
			eventInfo.parentalRatingIcon.show();
			eventInfo.eventGenre.show();
			eventInfo.eventDescription.show();
			eventInfo.eventStartTime.show();
			eventInfo.progressBar.show();
			eventInfo.eventEndTime.show();
		} else {
			eventInfo.parentalRatingIcon.hide();
			eventInfo.eventGenre.hide();
			eventInfo.eventDescription.hide();
			eventInfo.eventStartTime.hide();
			eventInfo.progressBar.hide();
			eventInfo.eventEndTime.hide();
			eventInfo.recordIcon.hide();
			eventInfo.startOverIcon.hide();
		}
	}

	/**
	 * @method stopPlayingRecording
	 * @param {Object} activationObject
	 */
	function stopPlayingRecording(activationObject) {
		var returnToLiveTV = true;
		if (activationObject && activationObject.activeMode && activationObject.activeMode === "mosaicKey") {
			$N.app.fullScreenPlayer.stopPlayout(returnToLiveTV);
			isFromMediaPlayer = true;
		}
	}

	/**
	 * Method for updating event information
	 * @method updateEventInfo
	 */
	function updateEventInfo() {
		log("updateEventInfo", "Enter");
		var focusedChannel = null,
			currentEvent = null,
			extendedInfo = null;

		if (isEmptyChannelList) {
			$N.app.TracksUtil.deactivateAudioTrack();
			eventInfo.hide();
			view.eventTitle.show();
			view.eventTitleWithEpisode.hide();
			updateRedIcon(false);
			view.indicator.RCUIcn.hide();
			view.indicator.redIcn.show();
			view.indicator.greenIcn.show();
			view.eventTitle.setText("");
		} else {
			eventInfo.show();
			view.indicator.show();
			focusedChannel = mosaicMenu.getSelectedItem();
			currentEvent = channelDataMapper.getEventObj(focusedChannel);
			extendedInfo = $N.app.epgUtil.getExtendedInfoByEventId(currentEvent.eventId);
			$N.app.epgUtil.storeChannelToPrefs(focusedChannel.serviceId);
			if (isFromMediaPlayer) {
				serviceTune(focusedChannel, currentEvent);
				isFromMediaPlayer = false;
			}
			if (focusedChannel) {
				view.serviceName.setText(eventDataMapper.getServiceName(focusedChannel));
				view.serviceName.show();
				view.serviceNumber.setText(eventDataMapper.getServiceNumber(focusedChannel));
				view.serviceNumber.show();
			}
			if ($N.app.EventUtil.isValidEvent(currentEvent)) {
				//FIXME: update event poster.
				isLock = $N.app.ParentalControlUtil.isChannelOrProgramLocked(currentEvent) || eventDataMapper.isAdultChannel(currentEvent);
				isSubscribeChannel = true;
				updateIconsForUnSubscribed();
				//"Blocked Content" text needs to be shown even if the service is blocked in settings.
				if (isLock) {
					currentPlayUri = "";
					mosaicPreview.setOpacity(1);
					mosaicPreview.updatePreview(focusedChannel, currentEvent);
				} else {
					mosaicPreview.setOpacity(0);
					if ($N.app.fullScreenPlayer.getSource() === focusedChannel.uri) {
						currentPlayUri = $N.app.fullScreenPlayer.getSource();
						mosaicPreview.updateEventPoster(currentEvent);
					} else {
						mosaicPreview.updatePreview(focusedChannel, currentEvent);
						//if unsubscribed channel, doesn't load preview picture
						if (focusedChannel.isSubscribed) {
							mosaicPreview.updateEventPoster(currentEvent);
						}
					}
				}

				updateEventSeriesEpisodeTitle(currentEvent, extendedInfo);
				eventInfo.parentalRatingIcon.update(currentEvent);
				eventInfo.eventGenre.setText(eventDataMapper.getEventGenre(currentEvent));
				eventInfo.eventDescription.setText(eventDataMapper.getDescription(currentEvent));
				updateProgressBar(eventDataMapper.getProgressBarData(currentEvent));
				updateRecIcons();

				updateEventInfoExpectPreviewArea(true);
				/*hide genre title and synopsis*/
				if ($N.platform.system.Preferences.get($N.app.constants.PARENTAL_ADULT_CONTENT) === "true") {
					eventInfo.eventGenre.hide();
					eventInfo.eventDescription.hide();
				}
				updateRedIcon(true);

				if (eventDataMapper.getRecordingStatus(channelDataMapper.getEventObj(mosaicMenu.getSelectedItem())) === $N.platform.btv.PVRManager.TaskStatus.TASK_STATUS_UNSCHEDULED) {
					view.indicator.RCUIcn.setText(Mosaic.getString("RCUKeyName"));
				} else {
					view.indicator.RCUIcn.setText(Mosaic.getString("RCUCancelKeyName"));
				}
			} else {
				endOfCurrentEvent = 0;
				updateEventInfoExpectPreviewArea(false);
				if ($N.app.fullScreenPlayer.getSource() === focusedChannel.uri) {
					currentPlayUri = $N.app.fullScreenPlayer.getSource();
					if (!isLock) {
						mosaicPreview.hidePreviewArea();
					}
				} else if (!$N.app.fullScreenPlayer.getSource()) {
					mosaicPreview.updatePreview(focusedChannel, currentEvent);
				} else {
					mosaicPreview.showPreviewArea();
				}
				mosaicPreview.setPoster("");
				view.eventTitle.show();
				view.eventTitleWithEpisode.hide();
				view.eventTitle.setText(Mosaic.getString("programInfoUnavailable"));
				updateRedIcon(false);
				view.indicator.RCUIcn.setText(Mosaic.getString("RCUKeyName"));
			}
		}

		//restore the display of front panel
		$N.common.helper.FrontPanelManager.updateChannelNumber();
	}
	/**
	 * @method refreshEvent
	 */
	function refreshEvent() {
		log("refreshEvent", "Enter");
		if (timerRefresh) {
			clearTimeout(timerRefresh);
			timerRefresh = null;
		}
		if (endOfCurrentEvent !== 0) {
			if (new Date().getTime() > endOfCurrentEvent) {
				updateEventInfo();
			} else {
				eventInfo.progressBar.setProgress(new Date().getTime());
			}
		}
		timerRefresh = setTimeout(refreshEvent, 30000);
		log("refreshEvent", "Exit");
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
			listItems = mosaicMenu.getData(),
			pageNum,
			col,
			row,
			service = null,
			listItemsLength = listItems.length,
			itemsPerPage = null,
			columnsPerPage = null;
		if (channelNumber) {
			service = $N.app.epgUtil.getNextClosestService(channelNumber, listItems);
			if (service) {
				itemsPerPage = mosaicMenu.getItemsPerPage();
				columnsPerPage = mosaicMenu.getColumnsPerPage();
				for (i = 0; i < listItemsLength; i++) {
					if (listItems[i].logicalChannelNum === service.logicalChannelNum) {
						pageNum = Math.floor(i / itemsPerPage);
						row = Math.floor((i - pageNum * itemsPerPage) / columnsPerPage) + 1;
						col = (i - pageNum * itemsPerPage) % columnsPerPage + 1;
						mosaicMenu.selectItemAtPosition(row, col, pageNum + 1);
						return true;
					}
				}
			}
		}
		log("selectChannelByNumber", "Exit2");
		return false;
	}



	/**
	 * @method setBreadCrumbParentAndChildTitle
	 */
	function setBreadCrumbParentAndChildTitle() {
		var stringSubTitle = $N.app.genreUtil.getGenreTitle(currentGenre);
		mosaicTitle.reset();
		mosaicTitle.show();
		mosaicTitle.push(Mosaic.getString("title"));
		mosaicTitle.push(stringSubTitle);
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
	 * Method for updating channel information
	 * @method updateChannelInfo
	 */
	function updateChannelInfo() {
		var channels = null,
			mainTitle,
			selectChannelByNumberValue = false,
			channelByServiceId = $N.platform.btv.EPG.getChannelByServiceId(storedServiceId);
		channels = $N.app.ChannelManager.getChannelListByGenreIndex(currentGenre);
		mosaicMenu.setData(channels);

		if (channels.length > 0) {
			isEmptyChannelList = false;
			selectChannelByNumberValue = selectChannelByNumber(channelByServiceId.logicalChannelNum);
			if (!storedServiceId || !channelByServiceId || !selectChannelByNumberValue) {
				mosaicMenu.selectItemAtPosition(1, 1, 1);
				$N.app.epgUtil.storeChannelToPrefs(mosaicMenu.getSelectedItem().serviceId);
			}
			view.noChannelMsg.hide();
			view.mosaicFavOK.okIcon.hide();
			updateDownUpArrows();
			view.rightScreenToHidePlayer.hide();
			$N.app.TracksUtil.activateAudioTrack();
		} else {
			isEmptyChannelList = true;
			view.noChannelMsg.setText(Mosaic.getString("noChannel"));
			view.mosaicFavOK.okIcon.setText(Mosaic.getString("addToFavourite"));
			view.mosaicFavOK.okIcon.show();
			view.noChannelMsg.show();
			view.OK.okIcn.hide();
			view.serviceName.hide();
			view.serviceNumber.hide();
			view.upArrow.hide();
			view.downArrow.hide();
			view.rightScreenToHidePlayer.show();
			$N.app.TracksUtil.deactivateAudioTrack();
			mosaicMenu.displayData();
		}
		setBreadCrumbParentAndChildTitle();
	}

	/**
	 * Method scale video to preview area when enter mosaic
	 * @method scaleFullScreenPlayer
	 */
	function scaleFullScreenPlayer() {
		$N.app.fullScreenPlayer.tuner.showScaled(901, 191, 320, 180);
	}

	/**
	 * Method full screen video when exit from mosaic
	 * @method restoreFullScreenPlayer
	 */
	function restoreFullScreenPlayer() {
		log("restoreFullScreenPlayer", "Enter");
		$N.app.fullScreenPlayer.tuner.showFullscreen();
		log("restoreFullScreenPlayer", "Exit");
	}

	/**
	 * Method callback when received onStreamDisabled event
	 * @method playVideoFail
	 */
	function playVideoFail(e) {
		log("PlayVideoFail", "Enter" + e.streamDisabledInfo.reason);
		switch (e.streamDisabledInfo.reason) {
		case streamDisabled.CA_ACCESS_DENIED:
		case streamDisabled.CA_ACCESS_BLACKED_OUT:
		case streamDisabled.CA_NO_VALID_SECURE_DEVICE:
			isSubscribeChannel = false;
			if (mosaicMenu.getSelectedItem().uri === $N.app.fullScreenPlayer.getSource()) {
				mosaicPreview.setOpacity(1);
				unSubscribedUri = mosaicMenu.getSelectedItem().uri;
			}
			if (e.streamDisabledInfo.reason === streamDisabled.CA_NO_VALID_SECURE_DEVICE) {
				_smartCardInserted = false;
				mosaicPreview.showSmartCardNotInsertedText();
			} else {
				mosaicPreview.showUnsubscribeText();
			}
			if (fadeAnim) {
				fadeAnim.cancelAnimation();
			}
			updateIconsForUnSubscribed();
			break;
		}
		log("PlayVideoFail", "Exit");
	}

	/**
	 * Unmutes the Audio and shows the video.
	 * @method unmuteAudioAndShowVideo
	 */
	function unmuteAudioAndShowVideo() {
		log("unmuteAudioAndShowVideo", "Enter");
		$N.app.AudioManager.unmute();
		$N.app.fullScreenPlayer.tuner.showVideo();
		log("unmuteAudioAndShowVideo", "Exit");
	}
	/**
	 * Listens the player playing event.
	 * @method playerPlayingListener
	 */
	function playerPlayingListener() {
		unmuteAudioAndShowVideo();
	}
	/**
	 * Method fade out poster if received onPlayStarted event
	 * @method playVideoSuccess
	 */
	function playVideoSuccess() {
		log("playVideoSuccess", "Enter");
		var focusedChannel = mosaicMenu.getSelectedItem(),
			currentEvent = channelDataMapper.getEventObj(focusedChannel),
			isLocked = $N.app.ParentalControlUtil.isChannelOrProgramLocked(currentEvent),
			hideMosaicPreview = function () {
				mosaicPreview.hidePreviewArea();
			};

		unmuteAudioAndShowVideo();

		if (isLocked) {
			return;
		}
		if (!fadeAnim) {
			mosaicPreview.addFadeAnimation();
			fadeAnim = mosaicPreview.getFadeAnimation();
		}
		if (mosaicMenu.getSelectedItem().uri !== $N.app.fullScreenPlayer.getSource()) {
			log("playVideoSuccess, but Not the same service", mosaicMenu.getSelectedItem().uri + "====" + $N.app.fullScreenPlayer.getSource());
			mosaicPreview.setScalePlayout(mosaicMenu.getSelectedItem(), channelDataMapper.getEventObj(mosaicMenu.getSelectedItem()), true);
		}
		fadeAnim.setAnimationEndCallback(hideMosaicPreview);
		mosaicPreview.doFade(0);

		isSubscribeChannel = true;
		updateIconsForUnSubscribed();

		currentPlayUri = $N.app.fullScreenPlayer.getSource();
		$N.app.fullScreenPlayer.tracks.activateAudioTrackByLanguage($N.app.TracksUtil.getAudioLanguageFromPreferences());
		log("playVideoSuccess", "Exit");
	}

	/**
	 * Method callback if received onSmartcardInserted event
	 * @method smartCardInsert
	 */
	function smartCardInsert() {
		var focusedChannel = mosaicMenu.getSelectedItem(),
			currentEvent = channelDataMapper.getEventObj(focusedChannel),
			service = null;

		unSubscribedUri = "";
		_smartCardInserted = true;
		service = $N.platform.btv.EPG.getChannelByServiceId(currentEvent.serviceId);
		serviceTune(service, currentEvent);
	}
	/**
	 * Event handler for JSFW lockerStatusUpdate	 *
	 * @method lockStatusUpdate
	 * @private
	 */
	function lockStatusUpdate() {
		log("lockStatusUpdate", "Enter");
		var currentLiveEvent = $N.app.epgUtil.getEvent("current", mosaicMenu.getSelectedItem().serviceId);
		log("lockStatusUpdate", "Exit" + mosaicMenu.getSelectedItem().serviceId);
	}

	/**
	 * Method hide video when switch channel focus
	 * @method restorePreviewOpacity
	 */
	function restorePreviewOpacity() {
		log("restorePreviewOpacity", "Enter");
		var focusedChannel = mosaicMenu.getSelectedItem(),
			currentEvent = channelDataMapper.getEventObj(focusedChannel),
			isLocked = $N.app.ParentalControlUtil.isChannelOrProgramLocked(currentEvent);

		mosaicPreview.setOpacity(1);
		mosaicPreview.showPreviewArea();
		if (isLocked) {
			mosaicPreview.updatePreview(focusedChannel, currentEvent);
		}
		log("restorePreviewOpacity", "Exit");
	}

	/**
	 * Method set flag of signal loss
	 * @method signalLoss
	 */
	function signalLoss() {
		isSingalLoss = true;
	}

	/**
	 * Method set flag of signal gain
	 * @method signalGain
	 */
	function signalGain() {
		isSingalLoss = false;
		if (mosaicMenu.getSelectedItem() && (mosaicMenu.getSelectedItem().uri === currentPlayUri)) {
			mosaicPreview.setOpacity(0);
		}
	}

	/**
	 * Will be executed when a play request fails. And also if both the tuners are locked.
	 * @method playerConnectFailedListener
	 */
	function playerConnectFailedListener(e) {
		if (e.contentStartFailedInfo.reason === $N.app.constants.CA_PLAY_ERRORS.contentStartFailedReason.LACK_OF_RESOURCES) {
			$N.app.AudioManager.mute();
			$N.app.fullScreenPlayer.tuner.hideVideo();
			if (!isLock) {
				mosaicPreview.setOpacity(1);
				mosaicPreview.showNoResourcePoster();
			}
		} else {
			unmuteAudioAndShowVideo();
		}
	}
	/**
	 * @Method registerStreamListenersForMosaicPreview
	 */
	function registerStreamListenersForMosaicPreview() {
		$N.app.fullScreenPlayer.registerPlayerConnectedListener(playVideoSuccess);

		/*mointer onStreamDisabled event*/
		$N.app.fullScreenPlayer.unregisterStreamDiabledListeners();
		$N.app.fullScreenPlayer.registerStreamDisabledListener(playVideoFail);

		/*mointer player onLockerUnlock event when given permission */
		$N.app.fullScreenPlayer.unregisterBlockedCallbacks();
		$N.app.fullScreenPlayer.registerLockerStatusUpdateListener(lockStatusUpdate);
		$N.app.fullScreenPlayer.registerLockerUnlockListener(playVideoSuccess);

		/*mointer onStreamEnabled event*/
		window.parent.CCOM.ConditionalAccess.addEventListener('onSmartcardInserted', smartCardInsert);

		/*mointer player connect failer event*/
		$N.app.fullScreenPlayer.unregisterConnectFailedListener();

		$N.app.fullScreenPlayer.registerPlayerConnectFailedListener(playerConnectFailedListener);
		$N.app.fullScreenPlayer.registerPlayerPlayingListener(playerPlayingListener);

		$N.app.fullScreenPlayer.tuner.registerQosDegradedListener(signalLoss);
		$N.app.fullScreenPlayer.tuner.registerQosImprovedListener(signalGain);

		/*On SI update event*/
		$N.platform.btv.EPG.registerRefreshCallback(updateChannelInfo, this);
	}

	/**
	 * @method unregisterStreamListenersForMosaicPreview
	 */
	function unregisterStreamListenersForMosaicPreview() {
		$N.app.fullScreenPlayer.unregisterPlayerConnectedListener(playVideoSuccess);

		$N.app.fullScreenPlayer.registerStreamDiabledListeners();
		$N.app.fullScreenPlayer.unregisterStreamDisabledListener(playVideoFail);

		$N.app.fullScreenPlayer.registerBlockedCallbacks();
		$N.app.fullScreenPlayer.unregisterLockerStatusUpdateListener(lockStatusUpdate);
		$N.app.fullScreenPlayer.unregisterLockerUnlockListener(playVideoSuccess);

		window.parent.CCOM.ConditionalAccess.removeEventListener('onSmartcardInserted', smartCardInsert);

		$N.app.fullScreenPlayer.registerConnectFailedListener();

		$N.app.fullScreenPlayer.unregisterPlayerConnectFailedListener(playerConnectFailedListener);
		$N.app.fullScreenPlayer.unregisterPlayerPlayingListener(playerPlayingListener);

		$N.app.fullScreenPlayer.tuner.unregisterQosDegradedListener(signalLoss);
		$N.app.fullScreenPlayer.tuner.unregisterQosImprovedListener(signalGain);

		$N.platform.btv.EPG.unregisterRefreshCallback(updateChannelInfo, this);
	}

	/**
	 * Callback for a pin entry is canceled.
	 * @method pinCancelledCallback
	 * @private
	 */
	function pinCancelledCallback() {
		log("pinCancelledCallback", "Enter");
		pinHelper.hideDialog();
		log("pinCancelledCallback", "Exit");
	}

	/**
	 * Callback for a pin entry when key pressed.
	 * @method mosaicPinKeyPressCallback
	 * @private
	 */
	function mosaicPinKeyPressCallback(value, key) {
		log("mosaicPinKeyPressCallback", "Enter");
		var callback = function () {
			pinHelper.hideDialog();
		};
		pinHelper.handlePinKeyPressCallback(key, callback);
		log("mosaicPinKeyPressCallback", "Exit");
	}
	pinHelper = new $N.app.PinHelper(null, null, null, pinCancelledCallback, $N.app.constants.PIN_DIALOG_SHOW_TIME, false);

	/**
	 * @method showPinDialog
	 * @private
	 */
	function showPinDialog() {
		var selectedItem = mosaicMenu.getSelectedItem(),
			isTheChannelLocked = $N.app.ParentalControlUtil.isChannelLocked(selectedItem);
		pinHelper.setDialogProperties({
			x: 0,
			y: 0,
			width: 1920,
			height: 1080,
			id: 'mosaicPinDialogId',
			title: isTheChannelLocked ? Mosaic.getString("channelLocked") : Mosaic.getString("programLocked"),
			description: isTheChannelLocked ? Mosaic.getString("unlockChannel") : Mosaic.getString("unlockShow"),
			keyPressedCallback: mosaicPinKeyPressCallback
		});
		pinHelper.setAuthenticationSuccessCallback(function () {
			var focusedChannel = mosaicMenu.getSelectedItem();
			restoreFullScreenPlayer();
			mosaicPreview.setScalePlayout(focusedChannel, channelDataMapper.getEventObj(focusedChannel), true);
			selectedItem.showBanner = true;
			$N.app.ContextHelper.openContext("ZAPPER", {activationContext: selectedItem});
		});
		pinHelper.showPinDialog('master', true);
	}

	/**
	 * @method subscribeToPVRStatusUpdateEvent
	 * @private
	 */
	function subscribeToPVRStatusUpdateEvent() {
		if (PVRSubscriptionIds.length === 0) {
			// we are adding these subscribe events to an array as we do not specifically need to know the Ids
			PVRSubscriptionIds = $N.app.PVRCapability.subscribeToPVRCapabilityEvent(PVRStatusUpdateListener, PVRStatusUpdateListener, Mosaic);
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
	 * @method tuneToOriginalService
	 * @private
	 */
	function tuneToOriginalService() {
		log("tuneToOriginalService", "Enter");
		var originalService = $N.platform.btv.EPG.getChannelByServiceId(storedServiceId),
			focusedChannel = mosaicMenu.getSelectedItem(),
			currentEvent = channelDataMapper.getEventObj(focusedChannel);
		if (storedServiceId && originalService) {
			$N.app.epgUtil.storeChannelToPrefs(storedServiceId);
			if (currentEvent && (storedServiceId !== currentEvent.serviceId)) {
				mosaicPreview.setScalePlayout(originalService, channelDataMapper.getEventObj(originalService), true);
			}
			$N.common.helper.FrontPanelManager.setFrontPanelDisplay($N.app.constants.FRONTPANEL_DISPLAY_MODES.DEFAULT);
		}
		log("tuneToOriginalService", "Exit to Service" + storedServiceId);
	}

	/**
	 * @method favouritesToggledListener
	 * @private
	 */
	function favouritesToggledListener() {
		log("favouritesToggledListener", "Enter");
		var focusedChannel,
			currentEvent;
		if (currentGenre === $N.app.genreUtil.GENRE_FAVORITE) {
			currentGenre = $N.app.genreUtil.GENRE_ALLCHANNELS;
		} else {
			currentGenre = $N.app.genreUtil.GENRE_FAVORITE;
		}
		updateChannelInfo();

		focusedChannel = mosaicMenu.getSelectedItem();
		currentEvent = channelDataMapper.getEventObj(focusedChannel);
		serviceTune(focusedChannel, currentEvent);
		log("favouritesToggledListener", "Exit");
	}

	/**
	 * @method subscribeToFavouritesToggledEvent
	 * @private
	 */
	function subscribeToFavouritesToggledEvent() {
		if (!favouritesToggledEventSubscriptionId) {
			favouritesToggledEventSubscriptionId = $N.apps.util.EventManager.subscribe("favouritesToggled", favouritesToggledListener, Mosaic);
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
			//setting the preferences to all channels since it was zapping only through the favourite channels once favourite key is pressed while in Mosaic.
			$N.platform.system.Preferences.set($N.app.constants.PREF_TV_CATEGORY, $N.app.constants.FAVOURITE_ALL_CHANNELS);
		}
	}

	function switchGenre(focusedChannel) {
		updateChannelInfo();
		updateEventInfo();
		if (!mosaicMenu.getSelectedItem() || focusedChannel.serviceId !== mosaicMenu.getSelectedItem().serviceId) {
			restorePreviewOpacity();
		}
		if (timerRefresh) {
			clearTimeout(timerRefresh);
			timerRefresh = null;
		}
		timerRefresh = setTimeout(refreshEvent, 30000);
	}
	// Public API
	return {
		/**
		 * Entry point of the application for the SVG onload event.
		 * @method load
		 */
		load: function () {
			log("load", "Enter");
			$N.gui.ResolutionManager.initialiseContext(document);
			$N.apps.core.Language.importLanguageBundleForObject(
				Mosaic,
				Mosaic.init,
				"apps/mosaic/common/",
				"LanguageBundle.js",
				setInfoIconText,
				window
			);
			log("load", "Exit");
		},

		/**
		 * Application lifecycle initialisation method to create the view.
		 * @method init
		 */
		init: function () {
			log("init", "Enter");
			$N.gui.FrameworkCore.loadGUIFromXML("apps/mosaic/view/mosaic.xml", document.getElementById("content"), view, window);

			mosaicMenu = view.channelMosaic;
			mosaicTitle = view.Mosaictitle;
			$N.app.GeneralUtil.mixin(channelDataMapper, $N.app.DataMappers.getServiceDataMapper());
			mosaicMenu.setDataMapper(channelDataMapper);
			mosaicMenu.setItemHighlightedCallback(function () {
				log("init", "change hightlight");
				updateEventInfo();
				if (timerRefresh) {
					clearTimeout(timerRefresh);
					timerRefresh = null;
				}
				timerRefresh = setTimeout(refreshEvent, 30000);
			});
			mosaicMenu.setListPagedCallback(function () {
				updateDownUpArrows();
			});
			mosaicMenu.setOrientation($N.gui.AbstractCustomisableList.consts.ORIENTAION_HORIZONTAL);
			mosaicMenu.setVSpace(MOSAIC_VSPACE);
			mosaicMenu.setHSpace(MOSAIC_HSPACE);
			mosaicMenu.initialise();
			eventInfo = view.eventInfo;
			setInfoIconText();
			$N.apps.core.ContextManager.initialisationComplete(Mosaic);
			mosaicTitle.setParentLabelCss("breadcrumbTitle");
			mosaicTitle.setChildLabelCss("breadcrumbSubTitle breadcrumbTitle");
			view.mosaicFavOK.okIcon.setCssClassForLabel("addToFavTitle");

			mosaicMenu.hide();
			view.mosaicFavOK.okIcon.hide();
			view.upArrow.hide();
			view.downArrow.hide();
			log("init", "Exit");
		},

		/**
		 * Application lifecycle activation method to draw the view.
		 * @method activate
		 */
		activate: function (activationObject) {
			log("activate", "Enter");
			var focusedChannel = null,
				currentEvent = null;
			genreValueToRestore = null;
			stopPlayingRecording(activationObject);

			scaleFullScreenPlayer();
			currentPlayUri = "";
			unSubscribedUri = "";
			mosaicPreview = eventInfo.previewArea;
			mosaicPreview.configureComponents();
			mosaicPreview.addCssClass("deferredRendering");
			registerStreamListenersForMosaicPreview();
			currentGenre = $N.app.genreUtil.GENRE_ALLCHANNELS;
			$N.app.BrandHelper.show($N.app.BrandHelper.MOSAIC_BACKGROUND_ID);
			$N.app.ClockDisplay.show();
			$N.app.PVRUtil.registerUIRefreshListener(updateRecIcons, this);
			storedServiceId = $N.app.epgUtil.getChannelFromPrefs();
			setTimeout(function () {
				updateChannelInfo();
				mosaicMenu.setVisible(true);
			}, 10);
			focusedChannel = mosaicMenu.getSelectedItem();
			currentEvent = channelDataMapper.getEventObj(focusedChannel);
			if (timerRefresh) {
				clearTimeout(timerRefresh);
				timerRefresh = null;
			}
			timerRefresh = setTimeout(refreshEvent, 30000);
			subscribeToPVRStatusUpdateEvent();
			$N.app.PVRCapability.subscribeWHPvrDeviceUpdate(PVRStatusUpdateListener);
			$N.platform.btv.PVRManager.setRecordingRequestConflictsCallback($N.app.Conflicts.onRecordingFailed);
			view.eventTitle.start();
			subscribeToFavouritesToggledEvent();
			log("activate", "Exit");
		},

		/**
		 * Application lifecycle passivation method to hide the view.
		 * @method passivate
		 */
		passivate: function () {
			log("passivate", "Enter");
			$N.app.BrandHelper.hideAll();
			$N.app.ClockDisplay.hide();
			currentGenre = 0;
			if (timerRefresh) {
				clearTimeout(timerRefresh);
				timerRefresh = null;
			}
			$N.app.PVRUtil.unregisterUIRefreshListener(updateRecIcons);
			unregisterStreamListenersForMosaicPreview();
			unsubscribeFromPVRStatusUpdateEvent();
			$N.app.PVRCapability.unSubscribeWHPvrDeviceUpdate(PVRStatusUpdateListener);
			mosaicPreview.clearPoster();
			mosaicPreview.setCurrentEventId(null);
			restoreFullScreenPlayer();
			$N.app.TimerUtil.stopTimer("recordIcon");
			$N.platform.btv.PVRManager.setRecordingRequestConflictsCallback(function () { });
			$N.common.helper.FrontPanelManager.setFrontPanelDisplay($N.app.constants.FRONTPANEL_DISPLAY_MODES.DEFAULT);
			view.eventTitle.stop();
			unsubscribeFromFavouritesToggledEvent();
			$N.app.TracksUtil.activateAudioTrack();
			log("passivate", "Exit");
		},

		/**
		 * Application lifecycle method to preview the view.
		 * @method preview
		 */
		preview: function () {
			log("preview", "Enter");
			log("preview", "Exit");
		},

		/**
		 * Application lifecycle method to unpreview the view.
		 * @method dismissPreview
		 */
		dismissPreview: function () {
			log("dismissPreview", "Enter");
			log("dismissPreview", "Exit");
		},

		/**
		 * Application lifecycle method to return the context name.
		 * @method toString
		 * @return {String} Application name.
		 */
		toString: function () {
			return "MOSAIC";
		},

		/**
		 * @method focus
		 */
		focus: function () {
			restoreGenreValueIfSet();
			registerStreamListenersForMosaicPreview();
			log("focus", "Enter");
			scaleFullScreenPlayer();
			$N.app.BrandHelper.show($N.app.BrandHelper.MOSAIC_BACKGROUND_ID);
			view.eventTitle.start();
			subscribeToFavouritesToggledEvent();
			updateEventInfo();
			log("focus", "Exit");
		},

		/**
		 * @method defocus
		 */
		defocus: function () {
			unregisterStreamListenersForMosaicPreview();
			log("defocus", "Enter");
			if (timerRefresh) {
				clearTimeout(timerRefresh);
				timerRefresh = null;
			}
			view.eventTitle.stop();
			restoreFullScreenPlayer();
			resetFilter();
			unsubscribeFromFavouritesToggledEvent();
			$N.app.TracksUtil.activateAudioTrack();
			log("defocus", "Exit");
		},

		/**
		 * Main key handler method that handles key presses.
		 * @method keyHandler
		 * @param {String} key The key that was pressed.
		 * @return {Boolean} True if the key press was handled, false if the
		 * key press wasn't handled.
		 */
		keyHandler: function (key, repeats) {
			log("keyHandler", "Mosaic");
			var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
				focusedChannel = mosaicMenu.getSelectedItem(),
				currentEvent = channelDataMapper.getEventObj(focusedChannel),
				currentPlaying = "",
				storedServiceId = $N.app.epgUtil.getChannelFromPrefs(),
				currentPlayingServiceId = "";
			$N.app.MemoryUtil.setOrUpdateGarbageCollectTimeoutAndInterval();

			if (repeats) {
				switch (key) {
				case keys.KEY_GUIDE:
					log("keyHandler", "Exit by GUIDE/MENU");
					return true; // Absorb key-press
				}
			}

			switch (key) {
			case keys.KEY_OK:
				log("keyHandler", "KEY_OK");
				if (!isEmptyChannelList && isSubscribeChannel) {
					if ($N.app.ParentalControlUtil.isChannelOrProgramLocked(currentEvent)) {
						showPinDialog();
					} else {
						currentPlaying = $N.app.fullScreenPlayer.getSource();
						currentPlayingServiceId = currentPlaying.substring("tv://channel.".length);
						if (currentPlaying && (currentPlaying.indexOf(focusedChannel.serviceId) === -1) && $N.app.fullScreenPlayer.isPlayerConnectFailed()) {
							focusedChannel = $N.app.epgUtil.getServiceById(currentPlayingServiceId);
						}
						restoreFullScreenPlayer();
						focusedChannel.showBanner = true;

						if ((focusedChannel.serviceId === storedServiceId) && (currentPlayingServiceId !== storedServiceId)) { //the zapper rejects the tune request if the preference stored service and your request service are same
							mosaicPreview.setScalePlayout(focusedChannel, channelDataMapper.getEventObj(focusedChannel), true);
						}

						$N.app.ContextHelper.openContext("ZAPPER", {activationContext: focusedChannel});
					}
					serviceTune(focusedChannel, currentEvent);
					unmuteAudioAndShowVideo();
				}
				if (isEmptyChannelList) {
					$N.app.FavouritesUtil.launchFavoritesApp();
				}
				return true;
			case keys.KEY_STOP:
				log("keyHandler", "KEY_STOP");
				if (!isEmptyChannelList) {
					if ($N.app.EventUtil.isValidEvent(channelDataMapper.getEventObj(focusedChannel))) {
						$N.app.PVRUtil.cancelEvent(channelDataMapper.getEventObj(focusedChannel), updateEventInfo);
					}
				}
				return true;
			case keys.KEY_RECORD:
				log("keyHandler", "KEY_RECORD");
				if (!isEmptyChannelList
						&& focusedChannel.isSubscribed
						&& isSubscribeChannel
						&& $N.app.PVRUtil.isRecordable(currentEvent, focusedChannel)) {
					$N.app.PVRUtil.recordOrCancelEvent(currentEvent, updateEventInfo);
				}
				return true;
			case keys.KEY_RED:
			case keys.KEY_INFO:
				if (!isEmptyChannelList
						&& $N.app.EventUtil.isValidEvent(channelDataMapper.getEventObj(mosaicMenu.getSelectedItem()))) {
					restoreFullScreenPlayer();
					navigateToSynopsis();
				}
				log("keyHandler", "KEY_RED");
				return true;
			case keys.KEY_EXIT:
			case keys.KEY_BACK:
				restoreFullScreenPlayer();
				tuneToOriginalService();
				unmuteAudioAndShowVideo();
				return false;
			case keys.KEY_GREEN:
				currentGenre = currentGenre + 1 >= $N.app.genreUtil.getAmountOfGenres() ? 0 : currentGenre + 1;
				switchGenre(focusedChannel);
				log("keyHandler", "Exit8");
				return true;
			case keys.KEY_PPV:
				currentGenre = $N.app.genreUtil.GENRE_PPV;
				switchGenre(focusedChannel);
				log("keyHandler", "KEY_PPV");
				return true;
			}

			/*only direction keys, when focus move restore opacity*/
			switch (key) {
			case keys.KEY_UP:
				if (!mosaicMenu.isAtFirstPage()
						|| (mosaicMenu.isAtFirstPage() && !mosaicMenu.isSelectedItemAtFirstRow())) {
					restorePreviewOpacity();
				}
				break;
			case keys.KEY_DOWN:
				if (!mosaicMenu.isAtLastPage()
						|| (mosaicMenu.isAtLastPage() && !mosaicMenu.isSelectedItemAtLastRow())) {
					restorePreviewOpacity();
				}
				break;
			case keys.KEY_LEFT:
				if (mosaicMenu.getSelectedColumnIndex() !== 1) {
					restorePreviewOpacity();
				}
				break;
			case keys.KEY_RIGHT:
				if (mosaicMenu.getSelectedColumnIndex() !== mosaicMenu.getColumnsPerPage()
						|| (mosaicMenu.isAtLastPage()
								&& (((mosaicMenu.getSelectedRowIndex() - 1) * mosaicMenu.getColumnsPerPage() + mosaicMenu.getSelectedColumnIndex()) !== mosaicMenu.getNumberOfItemsInCurrentPage()))) {
					restorePreviewOpacity();
				}
				break;
			case keys.KEY_CHAN_UP:
			case keys.KEY_CHAN_DOWN:
				restorePreviewOpacity();
				break;
			case keys.KEY_HOME:
			case keys.KEY_MENU:
			case keys.KEY_GUIDE:
			case keys.KEY_AGORA:
			case keys.KEY_PPV:
			case keys.KEY_RADIO:
			case keys.KEY_VOD:
				tuneToOriginalService();
				updateChannelInfo();
				restorePreviewOpacity();
				unmuteAudioAndShowVideo();
				break;
			}

			/*tune only after the key_release*/
			switch (key) {
			case keys.KEY_UP + KEY_RELEASE_SUFFIX:
			case keys.KEY_DOWN + KEY_RELEASE_SUFFIX:
			case keys.KEY_LEFT + KEY_RELEASE_SUFFIX:
			case keys.KEY_RIGHT + KEY_RELEASE_SUFFIX:
			case keys.KEY_CHAN_UP + KEY_RELEASE_SUFFIX:
			case keys.KEY_CHAN_DOWN + KEY_RELEASE_SUFFIX:
			case keys.KEY_GREEN + KEY_RELEASE_SUFFIX:
				if (keyReleaseTimeOut) {
					clearInterval(keyReleaseTimeOut);
				}
				keyReleaseTimeOut = setTimeout(function () {
					serviceTune(focusedChannel, currentEvent);
				}, KEY_RELEASE_DURATION);
				break;
			}

			return mosaicMenu.keyHandler(key);
		},
		PVRStatusUpdateListener: PVRStatusUpdateListener,
		unsubscribeFromPVRStatusUpdateEvent: unsubscribeFromPVRStatusUpdateEvent,
		subscribeToPVRStatusUpdateEvent: subscribeToPVRStatusUpdateEvent

	};
}());
