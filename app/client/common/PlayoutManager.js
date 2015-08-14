/**
 * @author mbrown
 */

(function ($N) {

	// The audio lock time is needed as a work around to a CCOM error 13996
	var AUDIO_LOCK_TIME = 8000; // in Milli Seconds

	/**
	 * Object constructor
	 * @method PlayoutManager
	 * @param videoTag The video tag that this playout manager is to be
	 *          associated with.
	 */
	function PlayoutManager(videoTag) {

		PlayoutManager.superConstructor.call(this, videoTag);

		var me = this;

		this._log = new $N.apps.core.Log("HELPER", "PlayoutManager");
		this._NOTIFY_SECONDS = 0;
		this._parentalControlHelper = $N.app.ParentalControlUtil;
		this._powerManager = $N.common.helper.PowerManager;

		this._activeRequest = null;
		this._activeManage = null;
		this._casIdObj = null;
		this._lastLiveRequest = null;
		this._currentServiceId = null;
		this._locked = null;
		this._managed = false;
		this._playerChanged = false; //state which is turned on when the same video tag instance is used from different context. Useful in deciding the audio/subtitle selection from different contexts

		this._backPlateImage = null;
		this._backPlateLockHref = null;
		this._backPlateNoVideoHref = null;
		this._bufferIcon = null;
		this._liveBufferIcon = null;

		this._isReconnecting = false;
		this._position = 0;
		this._bufferTimer = null;
		this._retuneTimer = null;

		this._retuneCounter = 0; //counter which is used to count the number of retunes made
		this._MAX_RETUNE_ATTEMPTS = 1; //Maximum allowed retunes that the system can make starting from index 0

		this._isReconnectingDialogEnabled = false;
		this._BUFFERING_TIME_BEFORE_RECONNECT = 30000;
		this._isPlayerConnectFailed = false;
		this._isFirstRequestPlayout = false;

		this._audioLanguage = null;
		this._subtitleLanguage = null;
		this._prefSubState = null;
		this._retryCallback = null;

		this.contentStartFailed = $N.app.constants.CA_PLAY_ERRORS.contentStartFailedReason;
		this.contentError = $N.app.constants.CA_PLAY_ERRORS.contentErrorReason;
		this.streamDisabled = $N.app.constants.CA_PLAY_ERRORS.streamDisabledReason;

		this._requestPlayoutCallback = function () { };
		this._pvrPlayerParentalLockCallback = function () { };
		this._tuneBlockedByConflictManagmentCallback = function () {};
		this._streamEnabledCallback = function () {};
		this._pinPopUpOnBlockedEventCallback = function () {};
		this._hidePinPopUpForUnblockedEventCallback = function () {};

		this._playerBufferingListener = function (e) {
			me._log("_playerBufferingListener", "Enter");
			me._clearBufferTimer();
			me._bufferIcon.show();
			me._bufferTimer = setInterval(function () {
				me._reconnectToStream();
			}, me._BUFFERING_TIME_BEFORE_RECONNECT);
			me._log("_playerBufferingListener", "Exit");
		};

		this._playerPlayingListener = function (e) {
			$N.app.ConditionalAccessCAK73.setStreamDisabled(false);
			me._log("_playerPlayingListener", "Enter");
			me._bufferIcon.hide();
			if (me._isReconnecting && me._activeRequest && !me._activeRequest.isLive) {
				me.setPlaybackPosition(me._position);
				me._position = 0;
			}
			me._clearBufferTimer();
			me._clearRetuneTimer();
			me._retuneCounter = 0;//reset the counter
			$N.app.ErrorMessage.hideNoSignalDialogue();
			$N.app.PPVHelper.hidePPVRelatedDialogs();
			$N.app.ErrorMessage.hideErrorMessageDialogWithId($N.app.ErrorMessageType.reconnecting);
			me._isReconnecting = false;
			me._isPlayerConnectFailed = false;
			me._log("_playerPlayingListener", "Exit");
		};

		this._onIframeDecodeListener = function (e) {
			me._log("_onIframeDecodeListener", "Enter");
			if (me._playerChanged) {//Only if the player changed from different player, we choose the audio and subtitle from priority matrix. Useful in context switch case from same video tags.
				$N.app.TracksUtil.activateAudioByPriority();
				$N.app.TracksUtil.activateSubtitleByPriority();
				me._playerChanged = false;
			}
			me._log("_onIframeDecodeListener", "Exit");
		};

		this._playerPlayFailedListener = function (e) {
			me._log("_playerPlayFailedListener", "Enter");
			if (!me._isReconnecting && me._activeRequest && !me._activeRequest.isLive) {
				me._position = e.position;
			}
			if (e && e.ContentErrorInfo && e.ContentErrorInfo.reason) {
				switch (e.ContentErrorInfo.reason) {
				case me.contentError.CA_ACCESS_DENIED:
				case me.contentError.CA_ACCESS_BLACKED_OUT:
				case me.contentError.CA_NO_VALID_SECURE_DEVICE:
				case me.contentError.CA_ACCESS_PAIRING_REQUIRED:
				case me.contentError.CA_ACCESS_CHIPSET_PAIRING_REQUIRED:
					$N.app.ConditionalAccessCAK73.handleError(e.ContentErrorInfo.reason);
					break;
				}
			}
			me._log("_playerPlayFailedListener", "Exit");
		};

		this._streamDisabledListener = function (e) {
			$N.app.ConditionalAccessCAK73.setStreamDisabled(true);
			$N.app.TracksUtil.hideSubtitles();
			me._log("_streamDisabledListener", "Enter");
			switch (e.streamDisabledInfo.reason) {
			case me.streamDisabled.CA_ACCESS_DENIED:
			case me.streamDisabled.CA_ACCESS_BLACKED_OUT:
			case me.streamDisabled.CA_NO_VALID_SECURE_DEVICE:
			case me.streamDisabled.CA_ACCESS_PAIRING_REQUIRED:
			case me.streamDisabled.CA_ACCESS_CHIPSET_PAIRING_REQUIRED:
				$N.app.ConditionalAccessCAK73.handleError(e.streamDisabledInfo.reason);
				break;
			}
		};
		this._streamEnabledListener = function (e) {
			me._log("_streamEnabledListener", "Enter");
			$N.app.ConditionalAccessCAK73.setStreamDisabled(false);
			$N.app.PPVHelper.hidePPVRelatedDialogs();
			$N.app.TracksUtil.showSubtitles();
			if (me._streamEnabledCallback) {
				me._streamEnabledCallback();
			}
		};
		this._isTuneBlockByConflictManagement = function (e) {
			me._log("_isTuneBlockByConflictManagement", "Enter & Exit");
			return (e.contentStartFailedInfo.reason === me.contentStartFailed.LACK_OF_RESOURCES ||
					e.contentStartFailedInfo.reason === me.contentStartFailed.CONFLICT);
		};

		this._playerConnectFailedListener = function (e) {
			me._log("_playerConnectFailedListener", "Enter e.contentStartFailedInfo.reason: " + e.contentStartFailedInfo.reason);
			var recordings,
				currentLiveEvent,
				isRtsp;
			if (me._isTuneBlockByConflictManagement(e)) {
				if (me._isFirstRequestPlayout === true) {
					recordings = $N.app.PVRUtil.getActiveRecordingsOrderedByJobId();
					if (recordings.length && recordings[0].serviceId) {
						$N.app.AutoTuneHelper.tuneToChannel(recordings[0].serviceId, true);
					}
				} else {
					recordings = $N.app.PVRUtil.getActiveAndSuspendedRecordingsOrderedByJobId();
					currentLiveEvent = $N.app.epgUtil.getEvent("current", me._currentServiceId);
					// TODO NETUI-2729: remove "faked.playback" check and first condition from here
					isRtsp = ($N.app.Config.getConfigValue("faked.playback") === "true") ? ($N.app.StringUtil.isStringStartsWith(e.contentStartFailedInfo.sourceUri, "rtsp://") || (e.contentStartFailedInfo.sourceUri === $N.app.Config.getConfigValue("faked.playback.serviceUri"))) : ($N.app.StringUtil.isStringStartsWith(e.contentStartFailedInfo.sourceUri, "rtsp://"));
					if (isRtsp) {
						$N.app.Conflicts.showConflictDialog(
							currentLiveEvent,
							recordings,
							$N.app.PVRUtil.VOD_PLAYBACK_CONFLICT,
							me._retryCallback || function () {}
						);
					} else {
						if (recordings && recordings.length) {
							$N.app.Conflicts.showConflictDialog(
								currentLiveEvent,
								recordings,
								$N.app.PVRUtil.WATCH_CONFLICT,
								function () {
									me._tuneToChannel(me._activeRequest, me._activeManage, me._casIdObj);
								}
							);
						} else {
							$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_TUNE_FAILED_MSG);
						}
						me._tuneBlockedByConflictManagmentCallback(currentLiveEvent);
					}
				}
			} else {
				switch (e.contentStartFailedInfo.reason) {
				case me.contentStartFailed.CA_ACCESS_DENIED:
				case me.contentStartFailed.CA_ACCESS_BLACKED_OUT:
				case me.contentStartFailed.CA_NO_VALID_SECURE_DEVICE:
				case me.contentStartFailed.CA_ACCESS_PAIRING_REQUIRED:
				case me.contentStartFailed.CA_ACCESS_CHIPSET_PAIRING_REQUIRED:
					$N.app.ConditionalAccessCAK73.handleError(e.contentStartFailedInfo.reason);
					break;
				case me.contentStartFailed.CONTENT_PLAY_FAILED_REASON_NO_LOCK:
					//This is a case when the RF cable is plugged out and zapped to different channel
					//When the user is not in Zapper context, we should not show the signal lost pop up.
					/*
					 * The below lines of code is a work around for issue: https://jira.opentv.com/browse/NETUI-2396
					 * TODO:https://jira.opentv.com/browse/NETUI-2539 and https://jira.opentv.com/browse/NO5SA-1510
					 */
					if (me._retuneCounter <= me._MAX_RETUNE_ATTEMPTS) { //retune to the channel until _MAX_RETUNE_ATTEMPTS is exceeded
						me._retuneToCurrentChannel();
						me._retuneCounter++;
					} else { //Show the error message to the user only if the _MAX_RETUNE_ATTEMPTS exceeded
						me._clearRetuneTimer();
						//When the STB is in Standby mode, we should never re-tune to the service
						if ($N.common.helper.PowerManager.getCurrentPowerMode() === $N.common.helper.PowerManager.SYSTEM_POWER_NORMAL) {
							if ($N.apps.core.ContextManager.getActiveContext().getId() === "ZAPPER") { //Not showing the popup if the user is not in Zapper mode.
								$N.app.ErrorMessage.showErrorDialog($N.app.ErrorMessageType.noSignal);
							}
							me._retuneTimer = setInterval(function () {
								me._retuneToCurrentChannel();
							}, $N.app.constants.NO_TUNER_LOCK_CHANNEL_RETUNE_TIMEOUT);
						}
					}
					break;
				}
			}
			me._isPlayerConnectFailed = true;
			me._log("_playerConnectFailedListener", "Exit");
		};

		this._reachedEndOfContentListener = function (e) {
			me._log("_reachedEndOfContentListener", "Enter");
			me._returnToLive();
			me._log("_reachedEndOfContentListener", "Exit");
		};

		this._reachedStartOfContentListener = function (e) {
			me._log("_reachedStartOfContentListener", "Enter");
			// bypass as e.event passed from CCOM has eventId = 0 and serviceId = 0 for some reason...
			var currentLiveEvent = $N.app.epgUtil.getEvent("current", me._currentServiceId);
			e.event = currentLiveEvent;
			me._log("_reachedStartOfContentListener", "Exit");
		};

		/**
		 * Event handler for JSFW lockerStatusUpdate
		 *
		 * @method onBlockedCallback
		 * @private
		 */
		this._onBlockedCallback = function () {
			me._log("_onBlockedCallback", "Enter");
			me._locked = true;
			me._manageBackPlateForContent();
			me._pinPopUpOnBlockedEventCallback();
			var currentLiveEvent = $N.app.epgUtil.getEvent("current", me._currentServiceId);
			$N.app.TracksUtil.deactivateAudioTrack();
			me._log("_onBlockedCallback", "Exit");
		};

		/**
		 * Event handler for JSFW lockerUnlock
		 *
		 * @method onUnblockedCallback
		 * @private
		 */
		this._onUnblockedCallback = function () {
			me._log("_onUnblockedCallback", "Enter");
			me._locked = false;
			me._hidePinPopUpForUnblockedEventCallback();
			$N.app.fullScreenPlayer.tuner.showVideo();
			me._manageBackPlateForContent((me._activeRequest ? me._activeRequest.isMusic : false));
			$N.app.TracksUtil.activateAudioByPriority();
			$N.app.TracksUtil.activateSubtitleByPriority();
			me._log("_onUnblockedCallback", "Exit");
		};

		/**
		 * Handler for JSFW registerResourceLostListener
		 *
		 * @method _resourcesLostListener
		 * @private
		 */
		this._resourcesLostListener = function () {
			me._log("_resourcesLostListener", "Enter");
			var tasks = $N.platform.btv.PVRManager.getActiveRecordings(),
				playoutRequest;
			if (tasks.length > 0) {
				playoutRequest = me._createPlayoutRequestFromTaskId(tasks[0].taskId);
				me.requestPlayout(playoutRequest, true, me._casIdObj);
			}
			me._log("_resourcesLostListener", "Exit");
		};

		/**
		 * Creates a playout request object
		 * from a recording task id
		 *
		 * @method _createPlayoutRequestFromTaskId
		 * @private
		 * @return {Object} playoutRequest
		 */
		this._createPlayoutRequestFromTaskId = function (taskId) {
			me._log("_createPlayoutRequestFromTaskId", "Enter");
			var event = $N.platform.btv.EPG.getEventById($N.platform.btv.PVRManager.getTask(taskId).eventId),
				service = $N.platform.btv.EPG.getChannelByServiceId(event.serviceId),
				playoutRequest = {
					url: service.uri,
					isMusic: $N.platform.btv.EPG.isRadioChannel(service),
					serviceId: service.serviceId,
					context: "ZAPPER",
					casId: (service.conditionalAccessIDs) ? service.conditionalAccessIDs[0] : null
				};
			me._log("_createPlayoutRequestFromTaskId", "Exit");
			return playoutRequest;
		};

		$N.platform.btv.EPG.setEventStartCallback(me._reachedStartOfContentListener);
		$N.apps.util.EventManager.subscribe("settingsUpdated", this._setAndActivateAudioAndSubtitleLanguages, this);
	}

	$N.apps.util.Util.extend(PlayoutManager, $N.platform.output.VideoPlayer);

	/**
	 * @method initialise
	 * @param {Object} view
	 */
	PlayoutManager.prototype.initialise = function (view) {
		this._log("initialise", "Enter");
		this.setBackPlateImage(view.fullScreenPlayer.fullScreenBackPlate);
		this.setLiveBufferIcon(view.fullScreenPlayer.bufferingIcon);
		this.setBackPlateLockHref("");
		this.setBackPlateNoVideoHref("");
		this.setTrickPlayDirectMode(false);
		this.registerPlayerListeners();
		if ($N.app.EnvironmentUtil.isIPEnabled()) {
			this.registerPlayerFailureListeners();
		}
		this.registerStreamDiabledListeners();
		this.registerStreamEnabledListeners();
		this.registerOnIframeDecodeListener();
		this._log("initialise", "Exit");
	};

	/**
	 * @method _retuneToCurrentChannel
	 * Private method used for retuning the current channel when the
	 * CONTENT_ERROR_NO_LOCK player content start failed event occur.
	 */
	PlayoutManager.prototype._retuneToCurrentChannel = function () {
		this._log("_retuneToCurrentChannel", "Enter");
		if (this._lastLiveRequest) {
			this.requestPlayout(this._lastLiveRequest, true, this._liveCasIdObj, this._retryCallback);
		}
		this._log("_retuneToCurrentChannel", "Exit");
	};

	PlayoutManager.prototype._returnToLive = function () {
		this._log("_returnToLive", "Enter");
		var result = null;
		// check to see if this is a review buffer playback as it doesn't have a url
		if (!this._activeRequest.url) {
			this._log("_returnToLive", "I am in the review buffer, so jumpToLive");
			result = this.getPlayer().jumpToLive();
			if (result && result.error) {
				this._log("_returnToLive", "jumpToLive failed: " + result.error.domain + " " + result.error.name + " " + result.error.message);
			} else {
				this._log("_returnToLive", "jumpToLive succeeded");
			}
		} else {
			if (this._lastLiveRequest) {
				if (this._activeRequest.url && ($N.app.StringUtil.isStringStartsWith(this._activeRequest.url, "pvr://") || $N.app.StringUtil.isStringStartsWith(this._activeRequest.url, "rtsp://") || ($N.app.StringUtil.isStringStartsWith(this._activeRequest.url, "file://") || ($N.app.StringUtil.isStringStartsWith(this._activeRequest.url, "dlna://") || (this._activeRequest.url === $N.app.Config.getConfigValue("faked.playback.serviceUri")))))) { // TODO NETUI-2729: remove last condition from here
					this._playerChanged = true;
					this.requestPlayout(this._lastLiveRequest, true, this._liveCasIdObj);
				}
			} else {
				this._manageBackPlateForContent(true);
			}
		}
		this._log("_returnToLive", "Exit");
	};

	PlayoutManager.prototype._reconnectToStream = function () {
		this._log("_reconnectToStream", "Enter");
		this._bufferIcon.show();
		if (this._isReconnectingDialogEnabled) {
			$N.app.ErrorMessage.showErrorDialog($N.app.ErrorMessageType.reconnecting);
		}
		this.tuner.disconnect();
		if ($N.platform.system.Preferences.get($N.app.constants.PREF_PRM_ENABLED) === "true") {
			$N.app.ca.disposeLicense();
		}
		this.requestPlayout(this._activeRequest, this._activeManage, this._casIdObj);
		this._isReconnecting = true;
		this._log("_reconnectToStream", "Exit");
	};

	PlayoutManager.prototype._clearBufferTimer = function () {
		if (this._bufferTimer) {
			clearInterval(this._bufferTimer);
			this._bufferTimer = null;
		}
	};

	/**
	 * @method _clearRetuneTimer
	 */
	PlayoutManager.prototype._clearRetuneTimer = function () {
		if (this._retuneTimer) {
			clearInterval(this._retuneTimer);
			this._retuneTimer = null;
		}
	};
	PlayoutManager.prototype._manageBackPlateForContent = function (noVideo) {
		this._log("_manageBackPlateForContent", "Enter");
		if (this._backPlateImage) {
			if (noVideo && !this._locked) {
				this._backPlateImage.setHref(this._backPlateNoVideoHref);
				this._backPlateImage.show();
			} else if (this._locked) {
				this._backPlateImage.setHref(this._backPlateLockHref);
				this._backPlateImage.show();
				this._pvrPlayerParentalLockCallback(true);
			} else {
				this._backPlateImage.hide();
				this._pvrPlayerParentalLockCallback(false);
			}
		}
		this._log("_manageBackPlateForContent", "Exit");
	};

	/**
	 * Sets the "request playout" callback, which is invoked after the <code>requestPlayout</code>
	 * method has finished. The callback will be passed a single Boolean parameter.
	 * <p/>
	 * If there were resource conflicts when trying to change the channel, then the callback will
	 * be called with a single parameter of <code>true</code>; otherwise, it will be called with a
	 * single parameter of <code>false</code>.
	 *
	 * @param {Object} (callback)  the callback to use after method<code>requestPlayout</code> has
	 *                             finished, which gets passed a single Boolean parameter.
	 */
	PlayoutManager.prototype.setRequestPlayoutCallback = function (callback) {
		this._requestPlayoutCallback = callback || function () { };
	};

	PlayoutManager.prototype.setTuneBlockedByConflictManagmentCallback = function (callback) {
		this._tuneBlockedByConflictManagmentCallback = callback || function () {};
	};

	PlayoutManager.prototype.setPinPopUpOnBlockedEventCallback = function (callback) {
		this._pinPopUpOnBlockedEventCallback = callback || function () {};
	};


	PlayoutManager.prototype.setHidePinPopUpForUnblockedEventCallback = function (callback) {
		this._hidePinPopUpForUnblockedEventCallback = callback || function () {};
	};

	PlayoutManager.prototype.setBackPlateImage = function (guiImageObj) {
		this._log("setBackPlateImage", "Enter");
		this._backPlateImage = guiImageObj;
		this._log("setBackPlateImage", "Exit");
	};

	PlayoutManager.prototype.setBackPlateLockHref = function (href) {
		this._log("setBackPlateLockHref", "Enter");
		this._backPlateLockHref = href;
		this._log("setBackPlateLockHref", "Exit");
	};

	PlayoutManager.prototype.setBackPlateNoVideoHref = function (href) {
		this._log("setBackPlateNoVideoHref", "Enter");
		this._backPlateNoVideoHref = href;
		this._log("setBackPlateNoVideoHref", "Exit");
	};

	PlayoutManager.prototype.setBufferIcon = function (bufferIndicatorObj) {
		this._log("setBufferIcon", "Enter");
		//hide previous
		if (this._bufferIcon) {
			this._bufferIcon.hide();
		}
		this._bufferIcon = bufferIndicatorObj;
		this._log("setBufferIcon", "Exit");
	};

	PlayoutManager.prototype.setBufferIconToLive = function () {
		this._log("setBufferIconToLive", "Enter");
		//hide previous
		if (this._bufferIcon) {
			this._bufferIcon.hide();
		}
		this._bufferIcon = this._liveBufferIcon;
		this._log("setBufferIconToLive", "Exit");
	};

	PlayoutManager.prototype.setLiveBufferIcon = function (bufferIndicatorObj) {
		this._log("setLiveBufferIcon", "Enter");
		this._liveBufferIcon = bufferIndicatorObj;
		this.setBufferIconToLive();
		this._log("setLiveBufferIcon", "Exit");
	};

	PlayoutManager.prototype.enableReconnectingDialog = function () {
		this._log("enableReconnectingDialog", "Enter");
		this._isReconnectingDialogEnabled = true;
		this._log("enableReconnectingDialog", "Exit");
	};

	PlayoutManager.prototype.disableReconnectingDialog = function () {
		this._log("disableReconnectingDialog", "Enter");
		this._isReconnectingDialogEnabled = false;
		this._log("disableReconnectingDialog", "Exit");
	};

	PlayoutManager.prototype.registerPlayerListeners = function () {
		this.registerPlayerPlayingListener(this._playerPlayingListener);
		this.registerPlayerPlayingListener(this._playerPlayingListener);
		this.registerBlockedCallbacks();
		this.registerResourcesLostListener(this._resourcesLostListener);
		this.registerPlayerConnectFailedListener(this._playerConnectFailedListener);
	};

	PlayoutManager.prototype.registerPlayerFailureListeners = function () {
		//Used to separate buffering events. These are registered only for HLS content
		this.registerPlayerBufferingListener(this._playerBufferingListener);
		this.registerPlayerPlayFailedListener(this._playerPlayFailedListener);
		this.registerPlayerConnectFailedListener(this._playerConnectFailedListenerForHlsPlayer);
	};
	PlayoutManager.prototype.registerStreamDiabledListeners = function () {
		this.registerStreamDisabledListener(this._streamDisabledListener);
	};

	PlayoutManager.prototype.registerStreamEnabledListeners = function () {
		this._player.addEventListener("onStreamEnabled", this._streamEnabledListener);
	};

	PlayoutManager.prototype.registerOnIframeDecodeListener = function () {
		this._player.addEventListener("onIframeDecode", this._onIframeDecodeListener);
	};

	PlayoutManager.prototype.unregisterOnIframeDecodeListener = function () {
		this._player.removeEventListener("onIframeDecode", this._onIframeDecodeListener);
	};

	PlayoutManager.prototype.registerConnectFailedListener = function () {
		this.registerPlayerConnectFailedListener(this._playerConnectFailedListener);
	};

	PlayoutManager.prototype.registerPlayErrorListener = function (listener) {
		this._player.addEventListener("onPlayError", listener);
	};

	PlayoutManager.prototype.unregisterPlayErrorListener = function (listener) {
		this._player.removeEventListener("onPlayError", listener);
	};

	PlayoutManager.prototype.unregisterConnectFailedListener = function () {
		this.unregisterPlayerConnectFailedListener(this._playerConnectFailedListener);
	};

	PlayoutManager.prototype.unregisterStreamEnabledListeners = function () {
		this._player.removeEventListener("onStreamEnabled", this._streamEnabledListener);
	};

	PlayoutManager.prototype.unregisterStreamDiabledListeners = function () {
		this.unregisterStreamDisabledListener(this._streamDisabledListener);
	};

	PlayoutManager.prototype.unregisterPlayerListeners = function () {
		this.unregisterPlayerPlayingListener(this._playerPlayingListener);
		this.unregisterPlayerPlayingListener(this._playerPlayingListener);
		this.unregisterPlayerConnectFailedListener(this._playerConnectFailedListener);
	};

	PlayoutManager.prototype.unregisterPlayerFailureListeners = function () {
		this.unregisterPlayerBufferingListener(this._playerBufferingListener);
		this.unregisterPlayerPlayFailedListener(this._playerPlayFailedListener);
		this.unregisterPlayerConnectFailedListener(this._playerConnectFailedListener);
		this.unregisterPlayerConnectFailedListener(this._playerConnectFailedListenerForHlsPlayer);
	};

	PlayoutManager.prototype.registerReviewBufferCallbacks = function (successCallback, failureCallback) {
		if (successCallback) {
			this._player.addEventListener("onReviewBufferStarted", successCallback);
		}
		if (failureCallback) {
			this._player.addEventListener("onReviewBufferStopped", failureCallback);
			this._player.addEventListener("onReviewBufferDisabled", failureCallback);
		}
	};

	PlayoutManager.prototype.unregisterReviewBufferCallbacks = function (successCallback, failureCallback) {
		if (successCallback) {
			this._player.removeEventListener("onReviewBufferStarted", successCallback, false);
		}
		if (failureCallback) {
			this._player.removeEventListener("onReviewBufferStopped", failureCallback, false);
			this._player.removeEventListener("onReviewBufferDisabled", failureCallback, false);
		}
	};

	PlayoutManager.prototype.registerPvrPlayerParentalLockListener = function (callback) {
		this._pvrPlayerParentalLockCallback = callback || function () { };
	};

	PlayoutManager.prototype.unregisterPvrPlayerParentalLockListener = function (callback) {
		this._pvrPlayerParentalLockCallback = function () { };
	};

	PlayoutManager.prototype.setStreamEnabledCallback = function (callback) {
		this._streamEnabledCallback = callback;
	};
	/**
	 * Sets the audio and subtitle languages, and activates them on the current track.
	 * @method setAndActivateAudioAndSubtitleLanguages
	 * @private
	 */
	PlayoutManager.prototype._setAndActivateAudioAndSubtitleLanguages = function () {
		// Set audio and subtitle languages
		this._audioLanguage = $N.app.TracksUtil.getAudioLanguageFromPreferences();
		this._prefSubState = $N.platform.system.Preferences.get($N.app.constants.PREF_SUBTITLE_STATE) || $N.app.constants.SUBTITLE_STATE_DEFAULT;
		$N.app.TracksUtil.activateAudioByPriority();
		$N.app.TracksUtil.activateSubtitleByPriority();

	};

	/**
	 * Tunes to the channel relating to the information given.
	 * <p/>
	 * The <code>request</code> parameter must contain the following attributes:<br/>
	 * <code>url</code> - String - the URL of the string to attempt to play.<br/>
	 * <code>isLive</code> - Boolean - whether it is a live stream.<br/>
	 * <code>isMusic</code> - Boolean - whether the stream is audio-only.<br/>
	 * <code>context</code> - String - the name of the class that called this method.<br/>
	 * <code>serviceId</code> - Number -the unique ID of the stream to attempt to play.<br/>
	 * <p/>
	 * The <code>casIdObj</code> parameter must contain the following attributes:<br/>
	 * <code>casId</code> - Number - the unique CAS ID of the stream.<br/>
	 *
	 * @method _tuneToChannel
	 * @private
	 * @param {Object}  request   an object containing data about the channel to change to.
	 * @param {Boolean} manage    whether to manage the stream.
	 * @param {Object}  casIdObj  an object containing CAS-related data.
	 */
	PlayoutManager.prototype._tuneToChannel = function (request, manage, casIdObj) {
		this._log("_tuneToChannel", "Enter");
		var position = request.bookmark;
		this._activeManage = manage;
		this._locked = false;
		if (this.isManaged()) {
			this.unManageStream();
		}
		if (request.isLive) {
			this._isFirstRequestPlayout = request.isFromLaunch;
			this._lastLiveRequest = request;
			this._liveCasIdObj = casIdObj;
		}
		this._activeRequest = request;
		this._casIdObj = casIdObj;
		if (manage) {
			this.manageStream(request.serviceId);
		}
		this.playStream(request.url, position);
		this._manageBackPlateForContent(request.isMusic);
		this._isReconnecting = false;
		this._setAndActivateAudioAndSubtitleLanguages();
		this._log("_tuneToChannel", "Exit");
	};

	/**
	 * Decides whether to change the channel based on the information given, and changes if
	 * appropriate.
	 * <p/>
	 * The <code>request</code> parameter must contain the following attributes:<br/>
	 * <code>url</code> - String - the URL of the string to attempt to play.<br/>
	 * <code>isLive</code> - Boolean - whether it is a live stream.<br/>
	 * <code>isMusic</code> - Boolean - whether the stream is audio-only.<br/>
	 * <code>context</code> - String - the name of the class that called this method.<br/>
	 * <code>serviceId</code> - Number -the unique ID of the stream to attempt to play.<br/>
	 * <p/>
	 * The <code>casIdObj</code> parameter must contain the following attributes:<br/>
	 * <code>casId</code> - Number - the unique CAS ID of the stream.<br/>
	 *
	 * @method requestPlayout
	 * @param {Object}  request   an object containing data about the channel to change to.
	 * @param {Boolean} manage    whether to manage the stream.
	 * @param {Object}  casIdObj  an object containing CAS-related data.
	 */
	PlayoutManager.prototype.requestPlayout = function (request, manage, casIdObj, retryCallback) {
		this._log("requestPlayout", "Enter");
		if (this._activeRequest !== request) {
			this._retuneCounter = 0;
		}
		this._retryCallback = retryCallback;
		this._tuneToChannel(request, manage, casIdObj);
		this._log("requestPlayout", "Exit");
	};

	PlayoutManager.prototype.jumpToLive = function () {
		this._log("jumpToLive", "Enter");
		var lastLiveRequest = this.getLastLiveRequest();
		if (lastLiveRequest) {
			this._returnToLive();
		}
		this._log("jumpToLive", "Exit");
	};

	PlayoutManager.prototype.stopPlayout = function (returnToLive) {
		this._log("stopPlayout", "Enter");
		if (returnToLive) {
			this.jumpToLive();
		}
		this._locked = false;
		if (this.getActivePlayoutRequest() && this.getActivePlayoutRequest().isLive) {
			this._lastLiveRequest = null;
			this._liveCasIdObj = null;
		}
		this.tuner.disconnect();
		this._manageBackPlateForContent(true);
		this._isReconnecting = false;
		this._retryCallback = null;
		this._log("stopPlayout", "Exit");
	};

	PlayoutManager.prototype.getActivePlayoutRequest = function () {
		this._log("getActivePlayoutRequest", "Enter and Exit");
		return this._activeRequest;
	};

	PlayoutManager.prototype.isActiveRequestLive = function () {
		this._log("isActiveRequestLive", "Enter and Exit");
		return this._activeRequest.isLive ? true : false;
	};

	PlayoutManager.prototype.getActiveContentObj = function () {
		this._log("getActiveContentObj", "Enter and Exit");
		return this._casIdObj;
	};

	PlayoutManager.prototype.getLastLiveRequest = function () {
		this._log("getLastLiveRequest", "Enter and Exit");
		return this._lastLiveRequest;
	};

	PlayoutManager.prototype.setPlayerChangedState = function (state) {
		this._log("setPlayerChangedState", "Enter and Exit");
		this._playerChanged = state;
	};

	PlayoutManager.prototype.isPlayerConnectFailed = function () {
		this._log("isPlayerConnectFailed", "Enter and Exit");
		return this._isPlayerConnectFailed;
	};

	PlayoutManager.prototype.applyParentalControl = function (serviceId) {
		this._log("applyParentalControl", "Enter");
		var me = this,
			currentLiveEvent,
			service;
		this._previousId = this._currentServiceId;
		this.previousService = $N.app.epgUtil.getServiceById(this._previousId);
		serviceId = serviceId || this._currentServiceId;
		currentLiveEvent = $N.app.epgUtil.getEvent("current", serviceId);
		service = $N.app.epgUtil.getServiceById(serviceId);
		this._locked = this._parentalControlHelper.isChannelOrProgramLocked(currentLiveEvent);
		if (currentLiveEvent.eventId === $N.app.epgUtil.BAD_EVENT_ID) {
			currentLiveEvent.serviceId = serviceId;
		}
		this._log("applyParentalControl", "Exit");
		//return isParentallyLocked;
		return this._locked;
	};

	PlayoutManager.prototype.manageStream = function (serviceId) {
		this._log("manageStream", "Enter");
		this._managed = true;
		if (this._activeRequest && !this._activeRequest.isLive) {
			this.registerPlayerReachedEndListener(this._reachedEndOfContentListener);
		} else if (this._activeRequest && this._activeRequest.isLive) {
			// remove monitor of previous channel
			if (this._currentServiceId) {
				$N.platform.btv.EPG.unmonitorStartOfEvents(this._currentServiceId);
			}
			this.applyParentalControl(serviceId);
			$N.platform.btv.EPG.monitorStartOfEvents(serviceId, this._NOTIFY_SECONDS);
		}
		this._currentServiceId = serviceId;
		this._log("manageStream", "Exit");
	};

	PlayoutManager.prototype.unManageStream = function () {
		this._log("unManageStream", "Enter");
		this._managed = false;
		this.unregisterPlayerReachedEndListener(this._reachedEndOfContentListener);
		this._log("unManageStream", "Exit");
	};

	PlayoutManager.prototype.isManaged = function () {
		this._log("isManaged", "Enter and Exit");
		return this._managed;
	};

	PlayoutManager.prototype.playStream = function (url, startPos) {
		var me = this;
		me._log("playStream", "Enter");
		if (startPos) {
			url += "&startPos=" + startPos * 1000;
		}
		this.tuner.tune(url, startPos);
		me._log("playStream", "Exit");
	};

	PlayoutManager.prototype.setCurrentServiceId = function (serviceId) {
		this._log("setCurrentServiceId", "Enter");
		this._currentServiceId = serviceId;
		this._log("setCurrentServiceId", "Exit");
	};

	/**
	 * If true, sets the zorder of the videoLayer to BOTTOM,
	 * otherwise to TOP (if not already set to this value)
	 * @method setVideoLayerZorder
	 * @param {Boolean} toLowest (true for bottom, false for top)
	 */
	PlayoutManager.prototype.setVideoLayerZorder = function (toLowest) {
		this._log("setVideoLayerZorder", "Enter");
		var isPlayerOnTop = (this._player.videoLayerProperties.zorder === this._player.VIDEO_LAYER_ZORDER_TOP),
			isZorderUpdateRequired = ((isPlayerOnTop && toLowest) || (!isPlayerOnTop && !toLowest));
		if (isZorderUpdateRequired) {
			this._log("setVideoLayerZorder", "Modifying zorder");
			this._player.setVideoLayerDetails({
				opacity: 1.0,
				zorder: (toLowest) ? this._player.VIDEO_LAYER_ZORDER_BOTTOM : this._player.VIDEO_LAYER_ZORDER_TOP
			});
		}
		this._log("setVideoLayerZorder", "Exit");
	};

	/**
	 * Registers callbacks with JSFW
	 *
	 * @method registerBlockedCallbacks
	 */
	PlayoutManager.prototype.registerBlockedCallbacks = function () {
		this._log("registerBlockedCallbacks", "Enter");
		$N.app.fullScreenPlayer.registerLockerStatusUpdateListener(this._onBlockedCallback);
		$N.app.fullScreenPlayer.registerLockerUnlockListener(this._onUnblockedCallback);
		this._log("registerBlockedCallbacks", "Exit");
	};

	/**
	 * Unregisters callbacks with JSFW
	 *
	 * @method unregisterBlockedCallbacks
	 */
	PlayoutManager.prototype.unregisterBlockedCallbacks = function () {
		this._log("unregisterBlockedCallbacks", "Enter");
		$N.app.fullScreenPlayer.unregisterLockerStatusUpdateListener(this._onBlockedCallback);
		$N.app.fullScreenPlayer.unregisterLockerUnlockListener(this._onUnblockedCallback);
		this._log("unregisterBlockedCallbacks", "Exit");
	};

	$N.app = $N.app || {};
	$N.app.PlayoutManager = PlayoutManager;

}($N || {}));
