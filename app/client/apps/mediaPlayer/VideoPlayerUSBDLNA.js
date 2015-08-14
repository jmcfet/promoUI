/**
 * VideoPlayerUSBDLNA is a concrete implementation of BasePlayer and
 * allows playback of video(USB and DLNA) content.
 * @class $N.app.players.VideoPlayerUSBDLNA
 * @constructor
 * @extends $N.app.players.BasePlayer
 * @param {Object} controller controller object
 * @param {Object} banner banner object
 * @param {Object} fullscreenPlayer The Video object used to display fullscreen TV
 * @extends BasePlayer
 * @author Kiran
 */

var $N = window.parent.$N;
$N.app = $N.app || {};
$N.app.players = $N.app.players || {};

(function ($N) {
	function VideoPlayerUSBDLNA(controller, banner, fullscreenPlayer, loadingBar) {
		$N.apps.core.Language.adornWithGetString(VideoPlayerUSBDLNA, "apps/mediaPlayer/common/");
		VideoPlayerUSBDLNA.superConstructor.call(this, banner);
		this._log = new $N.apps.core.Log("MediaPlayer", "VideoPlayerUSBDLNA");
		this._log("VideoPlayerUSBDLNA", "Enter");
		this._controller = controller;
		this._fullscreenPlayer = fullscreenPlayer;
		this._startPosition = 0;
		this._isStopPressed = false;
		this._speedIndicatorTimeout = null;
		this.START_ICON_FOUCS_INDEX = 0;
		this.KILO_BYTE = 1024;

		this.PLAY_SPEED = 100;
		this.PAUSE_SPEED = 0;
		this.SPEED_REW_MULTIPLIERS = [ 100, 200, 400, 800, 1600, 3200, 6400, -100];
		this.SPEED_FFW_MULTIPLIERS = [ 200, 400, 800, 1600, 3200, 6400, 100];
		this._trickKeyIndex = null;
		this._loadingBar = loadingBar;
		this._log("VideoPlayerUSBDLNA", "Exit");
	}

	$N.apps.util.Util.extend(VideoPlayerUSBDLNA, $N.app.players.BasePlayer);

	/**
	 * Defines the the behaviour for end and beginning of content
	 * and ui updates
	 * @method initialise
	 */
	VideoPlayerUSBDLNA.prototype.initialise = function () {
		this._log("initialise", "Enter");
		var me = this,
			PlaybackSubscriptionId;

		VideoPlayerUSBDLNA.superClass.initialise.call(this);

		this._failureCallback = function (e) {
			if (e.contentErrorInfo) {
				var streamWrongType = $N.app.constants.CA_PLAY_ERRORS.contentErrorReason.CONTENT_ERROR_REASON_STREAM_WRONG_TYPE,
					streamCodecNotFound = $N.app.constants.CA_PLAY_ERRORS.contentErrorReason.CONTENT_ERROR_REASON_STREAM_CODEC_NOT_FOUND;
				if ((e.contentErrorInfo.reason === streamWrongType) || (e.contentErrorInfo.reason === streamCodecNotFound)) {
					$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_DLNA_COMMUNICATION_ERROR,
						VideoPlayerUSBDLNA.getString("playerErrorTitle"),
						VideoPlayerUSBDLNA.getString("playerVideoErrorMessage")
						);
				}
			}
			me._loadingBar.hide();
			$N.app.fullScreenPlayer.jumpToLive();
			$N.app.ContextHelper.closeContext();
		};

		this._playerReachedEndCallback = function () {
			me._endOfPlayback();
		};

		this._playerConnectedListener = function () {
			me._loadingBar.hide();
			if (me._startPosition) {
				$N.app.fullScreenPlayer.tuner.hideVideo();
				//timeout required because setPlaybackPosition is not working immediately after playRequest
				setTimeout(function () {
					$N.app.fullScreenPlayer.setPlaybackPosition(me._startPosition);
					$N.app.fullScreenPlayer.tuner.showVideo();
				}, 100);
			}
			me._updateBannerPlayBackPositions();
		};
		this._usbMediaPlaybackListener = function (status) {
			if (me.activationContext.url.indexOf("file://") >= 0) {
				me._loadingBar.setLoading(false);
				$N.app.fullScreenPlayer.jumpToLive();
				me.activationContext.controller.setMediaDeviceDiasbledFlag(true);
				//Following condition gets executed if the event is not fired due to USB safe removal.
				if (!status.data) {
					$N.app.ContextHelper.closeContext();
				}
			}
		};
		/**
		 * @method subscribeToUsbMediaPlaybackEvent
		 * @private
		 */
		this._subscribeToUsbMediaPlaybackEvent = function () {
			PlaybackSubscriptionId = $N.app.UsbBrowserHelper.subscribeToUsbMediaPlaybackEvent(this._usbMediaPlaybackListener, this._usbMediaPlaybackListener, this);
		};
		/**
		 * @method unSubscribeToUsbMediaPlaybackEvent
		 * @private
		 */
		this._unSubscribeToUsbMediaPlaybackEvent = function () {
			PlaybackSubscriptionId = $N.app.UsbBrowserHelper.unSubscribeToUsbMediaPlaybackEvent(PlaybackSubscriptionId);
		};
		/**
		 * callback method that handles the dlna device lost event
		 * if the current context is mediabrowser and the device name also matches, then it exits the context.
		 * @method onDlnaDeviceLost
		 * @private
		 */
		this._onDlnaDeviceLost = function (e) {
			if (($N.app.DlnaHelper.getMediumName() === e.device.friendlyName) && (me.activationContext.url.indexOf("dlna://") >= 0)) {
				me._loadingBar.setLoading(false);
				$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_DLNA_COMMUNICATION_ERROR,
					VideoPlayerUSBDLNA.getString("dlnaErrorTitle"),
					VideoPlayerUSBDLNA.getString("dlnaPlayFailMessage")
					);
				$N.app.fullScreenPlayer.jumpToLive();
				me.activationContext.controller.setMediaDeviceDiasbledFlag(true);
				$N.app.ContextHelper.closeContext();
			}
		};
		/**
		 * event registration for DLNA device loss.
		 * @method subscribeToDlnaDeviceLostEvent
		 * @private
		 */
		this._subscribeToDlnaDeviceLostEvent = function () {
			$N.app.DlnaHelper.subscribeToDeviceLostEvent(this._onDlnaDeviceLost);
		};
		/**
		 * event unsubscription for DLNA device loss.
		 * @method unSubscribeToDlnaDeviceLostEvent
		 * @private
		 */
		this._unSubscribeToDlnaDeviceLostEvent = function () {
			$N.app.DlnaHelper.unSubscribeToDeviceLostEvent(this._onDlnaDeviceLost);
		};
	};

	/**
	 * Sets the indexes for the current, previous and next positions
	 * in the url array
	 * @method _setIndexes
	 * @param {Object} currentIndex
	 */
	VideoPlayerUSBDLNA.prototype._setIndexes = function (currentIndex) {
		this._current = currentIndex;
		this._next = currentIndex + 1;
		this._previous = currentIndex - 1;
		if (this._next > this._totalTracks - 1) {
			this._next = 0;
		}
		if (this._previous < 0) {
			this._previous = this._totalTracks - 1;
		}
	};
	/**
	 * Registers the callbacks and performs the tune request to
	 * start playback.
	 * @method activate
	 * @param {Object} activationContext
	 */
	VideoPlayerUSBDLNA.prototype.activate = function (activationContext) {
		this._log("activate", "Enter");
		var playListLength = null,
			selectedIndex,
			selectedIconsInBanner = {},
			i;

		this._startPosition = 0;
		this.activationContext = activationContext;
		selectedIndex = (activationContext.selectedItemIndex === undefined) ? 0 : activationContext.selectedItemIndex;
		this._shuffleMode = false;
		selectedIconsInBanner.shuffleModeEnabled = false;
		if (activationContext.isPlayShuffleEnabled) {
			this._shuffleMode = true;
			selectedIndex = 0;
			selectedIconsInBanner.shuffleModeEnabled = true;
		}
		playListLength = activationContext.playList.length;
		this._actualUrls = [];
		this.iconsList = [];
		for (i = 0; i < playListLength; i++) {
			this._actualUrls[i] = activationContext.playList[i];
		}
		this._shuffledUrls = $N.app.ArrayUtil.arrayShuffle(this._actualUrls);

		activationContext.url = this._shuffleMode ? this._shuffledUrls[selectedIndex] : this._actualUrls[selectedIndex];
		this.activationContext.url = activationContext.url;
		this._showLoadingBarIfNeeded();

		this._repeatMode = false;
		this._totalTracks = this._actualUrls.length;
		this._setIndexes(selectedIndex);
		this.availableIconsForBanner = $N.app.constants.TRICKPLAY_ICONS_FOR_PHOTO_AUDIO_VIDEO_PLAYBACK;
		if (this._totalTracks > 1) {
			//If more than one tracks in the list, Banner contains all the icons
			this.START_ICON_FOUCS_INDEX = 5;
			this.iconsList = [this.availableIconsForBanner.STOP, this.availableIconsForBanner.PREVIOUS, this.availableIconsForBanner.RWD, this.availableIconsForBanner.PLAY, this.availableIconsForBanner.FWD, this.availableIconsForBanner.NEXT, this.availableIconsForBanner.PROGRESSBAR];
		} else {
			//If only one tracks in the list, Banner contains the icons except Shuffle, Next and Previous icons
			this.START_ICON_FOUCS_INDEX = 3;
			this.iconsList = [this.availableIconsForBanner.STOP, this.availableIconsForBanner.RWD, this.availableIconsForBanner.PLAY, this.availableIconsForBanner.FWD, this.availableIconsForBanner.PROGRESSBAR];
		}
		selectedIndex = this._getActualListIndex();
		this._banner.setIconsForBanner(this.iconsList, selectedIconsInBanner);
		this._banner.setCurrentAndTotalTracks(String(selectedIndex + 1), String(this._totalTracks));
		this._showBanner();
		this._startUpdateInterval();
		this._banner.selectIconAtIndex(this.START_ICON_FOUCS_INDEX);
		this._subscribeToUsbMediaPlaybackEvent();
		this._subscribeToDlnaDeviceLostEvent();
		this._fullscreenPlayer.show();
		this._trickPlayObj.setDirectMode(true);
		$N.app.fullScreenPlayer.registerPlayerConnectedListener(this._playerConnectedListener);
		$N.app.fullScreenPlayer.registerPlayerConnectFailedListener(this._failureCallback);
		$N.app.fullScreenPlayer.registerPlayerPlayFailedListener(this._failureCallback);
		$N.app.fullScreenPlayer.registerStreamDisabledListener(this._failureCallback);
		VideoPlayerUSBDLNA.superClass.activate.call(this, activationContext);
		this._log("activate", "Exit");
	};

	/**
	 * Passivates the player unregistering any listeners
	 * @method passivate
	 */
	VideoPlayerUSBDLNA.prototype.passivate = function () {
		this._log("passivate", "Enter");
		this._finishPlayback();
		$N.app.fullScreenPlayer.jumpToLive();
		this._banner.deFocusSelectedIcon();
		if (this._repeatMode) {
			this._banner.toggleRepeatIconAndLabel(false);
		}
		VideoPlayerUSBDLNA.superClass.passivate.call(this);
		this._unSubscribeToUsbMediaPlaybackEvent();
		this._unSubscribeToDlnaDeviceLostEvent();
		$N.app.fullScreenPlayer.unregisterPlayerConnectedListener(this._playerConnectedListener);
		$N.app.fullScreenPlayer.unregisterPlayerConnectFailedListener(this._failureCallback);
		$N.app.fullScreenPlayer.unregisterPlayerPlayFailedListener(this._failureCallback);
		this._fullscreenPlayer.hide();
		this._log("passivate", "Exit");
	};

	/**
	 * focus is called from Media player
	 * @method focus
	 */
	VideoPlayerUSBDLNA.prototype.focus = function () {
		this._log("focus", "Enter");
		this._showBanner();
		$N.app.ClockDisplay.hide();
		this._log("focus", "Exit");
	};
	/**
	 * This function plays the next track in the playlist.
	 * @method _playNextTrack
	 */
	VideoPlayerUSBDLNA.prototype._playNextTrack = function (nextIndex) {
		this._log("_playNextTrack", "Enter");
		if (this._totalTracks > 1) {
			var currentTrackIndex,
				trackIndex;
			if (this._shuffleMode) {
				this.activationContext.url = this._shuffledUrls[nextIndex];
				trackIndex = this._getActualListIndex();
			} else {
				currentTrackIndex = this._getActualListIndex();
				nextIndex = currentTrackIndex + 1;
				if (nextIndex > this._totalTracks - 1) {
					nextIndex = 0;
				}
				this.activationContext.url = this._actualUrls[nextIndex];
				trackIndex = nextIndex;
			}
			this._showLoadingBarIfNeeded();
			this.playGivenURL(this.activationContext);
			this._banner.updateCurrentTrack(trackIndex + 1);
			this._setIndexes(this._next);
		}
		this._log("_playNextTrack", "Exit");
	};

	/**
	 * This function plays the previous track in the playlist.
	 * @method _playPreviousTrack
	 */
	VideoPlayerUSBDLNA.prototype._playPreviousTrack = function (previousIndex) {
		this._log("_playPreviousTrack", "Enter");
		if (this._totalTracks > 1) {
			var currentTrackIndex,
				trackIndex;
			if (this._shuffleMode) {
				this.activationContext.url = this._shuffledUrls[previousIndex];
				trackIndex = this._getActualListIndex();
			} else {
				currentTrackIndex = this._getActualListIndex();
				previousIndex = currentTrackIndex - 1;
				if (previousIndex < 0) {
					previousIndex = this._totalTracks - 1;
				}
				this.activationContext.url = this._actualUrls[previousIndex];
				trackIndex = previousIndex;
			}
			this._showLoadingBarIfNeeded();
			this.playGivenURL(this.activationContext);
			this._banner.updateCurrentTrack(trackIndex + 1);
			this._setIndexes(this._previous);
		}
		this._log("_playPreviousTrack", "Exit");
	};

	/**
	 * This is called when the playback has finished
	 * @method _endOfPlayback
	 */
	VideoPlayerUSBDLNA.prototype._endOfPlayback = function () {
		this._log("_endOfPlayback", "Enter");
		if (this._repeatMode) {
			$N.app.fullScreenPlayer.setPlaybackPosition(0);
			this._trickPlayObj.play();
			this._updateBannerPlayBackPositions();
		} else {
			if (this._totalTracks > 1) {
				this._playNextTrack(this._next);
			} else {
				$N.app.ContextHelper.closeContext();
			}
		}
		this._log("_endOfPlayback", "Exit");
	};

	/**
	 * This will restart the current track from begining
	 * @method _restartCurrentPlayback
	 */
	VideoPlayerUSBDLNA.prototype._restartCurrentTrack = function () {
		this._log("_restartCurrentPlayback", "Enter");
		var trickPlayMode = this._trickPlayObj.getTrickPlayMode();
		this._trickPlayObj.setPlayRateMultipliers([100]);
		if (trickPlayMode !== "play") {
			this._trickPlayObj.play();
		}
		$N.app.fullScreenPlayer.setPlaybackPosition(0);
		this._trickPlayObj.play();
		this._updateBannerPlayBackPositions();
		this._log("_restartCurrentPlayback", "Exit");
	};

	/**
	 * This method will show the loading bar depending on the size of track
	 * @method _showLoadingBarIfNeeded
	 */
	VideoPlayerUSBDLNA.prototype._showLoadingBarIfNeeded = function () {
		this._log("_showLoadingBarIfNeeded", "Enter");
		var urlMetadata = this.activationContext.controller.getMetaDataForUrl(this.activationContext.url),
			sizeInBytes = null,
			sizeInKiloBytes = null,
			sizeInMegaBytes = null;

		if (urlMetadata.itemDetails && urlMetadata.itemDetails[0].fileSize) {
			sizeInBytes = urlMetadata.itemDetails[0].fileSize;
			sizeInKiloBytes = (sizeInBytes > this.KILO_BYTE) ? (sizeInBytes / this.KILO_BYTE) : null;
			sizeInMegaBytes = (sizeInKiloBytes && sizeInKiloBytes > this.KILO_BYTE) ? (sizeInKiloBytes / this.KILO_BYTE) : null;
			if (sizeInMegaBytes && (sizeInMegaBytes > 200)) {
				this._loadingBar.setText(VideoPlayerUSBDLNA.getString("preparingVideo"));
				this._loadingBar.show();
			}
		}
		this._log("_showLoadingBarIfNeeded", "Exit");
	};

	/**
	 * This will returns the index of url in the actual track list
	 * @method _getActualListIndex
	 */
	VideoPlayerUSBDLNA.prototype._getActualListIndex = function () {
		this._log("_getActualListIndex", "Enter & Exit");
		return this._actualUrls.indexOf(this.activationContext.url);
	};
	/**
	 * Key handler for specific ff / rew behaviour
	 * @method trickplayKeyHandler
	 * @param {Boolean} isRewind
	 */
	VideoPlayerUSBDLNA.prototype.trickplayKeyHandler = function (isRewind) {
		this._log("trickplayKeyHandler", "Enter");
		var trickPlayMode = this._trickPlayObj.getTrickPlayMode();
		if ((!isRewind && trickPlayMode === "rew") || (isRewind && trickPlayMode === "ff")) {
			this._trickPlayObj.play();
		} else {
			this._trickPlayObj.setAllowSpeedCycle(true);
			if (isRewind) {
				this._trickPlayObj.setPlayRateMultipliers(this.SPEED_REW_MULTIPLIERS);
			} else {
				this._trickPlayObj.setPlayRateMultipliers(this.SPEED_FFW_MULTIPLIERS);
			}
		}
		this._log("trickplayKeyHandler", "Exit");
	};

	/**
	 * Starts the slideshow when pressing PLAY button
	 * @method _startSlideshow
	 */
	VideoPlayerUSBDLNA.prototype._toggleShuffleMode = function () {
		if (this._shuffleMode) {
			this._shuffleMode = false;
			this._banner.toggleShuffleIconAndLabel(this._shuffleMode);
		} else {
			this._shuffleMode = true;
			this._banner.toggleShuffleIconAndLabel(this._shuffleMode);
		}
	};

	/**
	 * Starts the slideshow when pressing PLAY button
	 * @method _startSlideshow
	 */
	VideoPlayerUSBDLNA.prototype._toggleRepeatMode = function () {
		if (this._repeatMode) {
			this._repeatMode = false;
			this._banner.toggleRepeatIconAndLabel(this._repeatMode);
		} else {
			this._repeatMode = true;
			this._banner.toggleRepeatIconAndLabel(this._repeatMode);
		}
	};

	/**
	 * Updates the banner to show the current playback positions
	 * @method _updateBannerPlayBackPositions
	 * @private
	 */
	VideoPlayerUSBDLNA.prototype._updateBannerPlayBackPositions = function () {
		this._log("_updateBannerPlayBackPositions", "Enter");
		var playerPosition = $N.app.fullScreenPlayer.getPlaybackPosition(),
			contentLength = $N.app.fullScreenPlayer.getContentLength();
		if (contentLength && (playerPosition >= 0)) {
			this._banner.updateProgressBar(playerPosition, contentLength);
			this._banner.setProgressBarStartEnd(this._getContentLengthText(playerPosition), this._getContentLengthText(contentLength));
		}
		this._log("_updateBannerPlayBackPositions", "Exit");
	};

	/**
	 * Updates the banner to show or hide the pause icon
	 * @method _updateBannerTrickPlayIndicators
	 * @param {String} mode one of play, ff, rew, pause
	 * @param {Number} rate
	 * @private
	 */
	VideoPlayerUSBDLNA.prototype._updateBannerTrickPlayIndicators = function (mode, rate) {
		this._log("_updateBannerTrickPlayIndicators", "Enter");
		switch (rate) {
		case this.PAUSE_SPEED:
			this._cancelBannerHide();
			this._banner.updateFocusForIcon(this.availableIconsForBanner.PLAY);
			this._banner.togglePlayPauseIcon(false);
			this._stopUpdateInterval();
			break;
		case this.PLAY_SPEED:
			this._banner.togglePlayPauseIcon(true);
			if (this._trickKeyIndex) {
				this._banner.setTrickKeysLabel(rate, this.availableIconsForBanner.PLAY);
				this._trickKeyIndex = null;
			}
			this._startUpdateInterval();
			break;
		default:
			this._trickKeyIndex  = (mode === $N.platform.output.TrickPlay.MODES.RW ? this.availableIconsForBanner.RWD : this.availableIconsForBanner.FWD);
			this._banner.setTrickKeysLabel(rate, this._trickKeyIndex);
			this._cancelBannerHide();
			this._banner.togglePlayPauseIcon(false);
			this._startUpdateInterval((1000 / 2));
		}
		this._log("_updateBannerTrickPlayIndicators", "Exit");
	};

	/**
	 * Helper method to cancel the auto hide feature of the banner
	 * @method _cancelBannerHide
	 * @private
	 */
	VideoPlayerUSBDLNA.prototype._cancelBannerHide = function () {
		this._log("_cancelBannerHide", "Enter");
		if (this._bannerTimeout) {
			window.parent.clearTimeout(this._bannerTimeout);
		}
		this._log("_cancelBannerHide", "Exit");
	};

	/**
	 * Helper method to get the preferred Banner timeout from constants.
	 * @method _getBannerTimeout
	 * @private
	 */
	VideoPlayerUSBDLNA.prototype._getBannerTimeout = function () {
		return (($N.platform.system.Preferences.get($N.app.constants.PREF_USBDLNA_PLAYER_BANNER_TIMEOUT)) * 1000);
	};

	/**
	 * Helper method to manage the timed display of the banner
	 * @method _showBanner
	 * @private
	 */
	VideoPlayerUSBDLNA.prototype._showBanner = function () {
		this._log("_showBanner", "Enter");
		var me = this;
		if (!this._banner.isVisible()) {
			this._banner.show();
		}
		this._cancelBannerHide();
		this._bannerTimeout = window.parent.setTimeout(function () {
			me._banner.hide();
		}, this._getBannerTimeout());
		this._log("_showBanner", "Exit");
	};

	/**
	 * OK button click handler
	 * @method okPressedHandler
	 */
	VideoPlayerUSBDLNA.prototype.okPressedHandler = function () {
		var key,
			keys = $N.apps.core.KeyInterceptor.getKeyMap();
		if (this._banner.isVisible()) {
			switch (this.iconsList[this._banner.getSelectedIndex()]) {
			case this.availableIconsForBanner.STOP:
				key = keys.KEY_STOP;
				break;
			case this.availableIconsForBanner.REPEAT:
				this._showBanner();
				this._toggleRepeatMode();
				break;
			case this.availableIconsForBanner.PREVIOUS:
				this._playPreviousTrack(this._previous);
				break;
			case this.availableIconsForBanner.PLAY:
				key = keys.KEY_PLAY_PAUSE;
				break;
			case this.availableIconsForBanner.SHUFFLE:
				this._toggleShuffleMode();
				break;
			case this.availableIconsForBanner.NEXT:
				this._playNextTrack(this._next);
				break;
			case this.availableIconsForBanner.FWD:
				key = keys.KEY_FFW;
				break;
			case this.availableIconsForBanner.RWD:
				key = keys.KEY_REW;
				break;
			case this.availableIconsForBanner.REPLAY:
				key = keys.KEY_REPLAY;
				break;
			}
			this.keyHandler(key);
		} else {
			this._showBanner();
		}
	};

	/**
	 * Key handler for VideoPlayerUSBDLNA
	 * @method keyHandler
	 * @param {String} key
	 */
	VideoPlayerUSBDLNA.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			me = this,
			playingTaskId = null;
		switch (key) {
		case keys.KEY_LEFT:
			if (this._banner.isVisible()) {
				this._banner.selectPrevious();
			}
			this._showBanner();
			break;
		case keys.KEY_RIGHT:
			if (this._banner.isVisible()) {
				this._banner.selectNext();
			}
			this._showBanner();
			break;
		case keys.KEY_OK:
			this.okPressedHandler();
			this._showBanner();
			break;
		case keys.KEY_DOWN:
			this._banner.hide();
			return true;
		case keys.KEY_FFW:
			this._showBanner();
			this.trickplayKeyHandler(false);
			break;
		case keys.KEY_REW:
			this._showBanner();
			this.trickplayKeyHandler(true);
			break;
		case keys.KEY_PLAY_PAUSE:
			this._showBanner();
			break;
		case keys.KEY_STOP:
		case keys.KEY_BACK:
			$N.app.ContextHelper.closeContext();
			return true;
		case keys.KEY_EXIT:
			$N.app.ContextHelper.exitContext();
			return true;
		case keys.KEY_RADIO:
		case keys.KEY_MOSAIC:
		case keys.KEY_POWER:
		case keys.KEY_VOD:
		case keys.KEY_TV:
			$N.app.ContextHelper.closeContext();
			break;
		default:
			this._isStopPressed = false;
			break;
		}
		VideoPlayerUSBDLNA.superClass.keyHandler.call(this, key);
		this._log("keyHandler", key);
		this._log("keyHandler", "Exit");
	};

	$N.app.players.VideoPlayerUSBDLNA = VideoPlayerUSBDLNA;

}($N));
