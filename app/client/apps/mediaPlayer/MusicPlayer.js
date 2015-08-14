/**
 * MusicPlayer is a concrete implementation of BasePlayer and
 * allows playback of media(USB and DLNA) content.
 * @class $N.app.players.MusicPlayer
 * @constructor
 * @extends $N.app.players.BasePlayer
 * @param {Object} controller controller object
 * @param {Object} banner banner object
 * @param {Object} fullscreenPlayer The Video object used to display fullscreen TV
 * @param {Object} thumbnailImage to show clipart image of currently playing track
 * @extends BasePlayer
 * @author Kiran
 */

var $N = window.parent.$N;
$N.app = $N.app || {};
$N.app.players = $N.app.players || {};

(function ($N) {
	function MusicPlayer(controller, banner, thumbnailImage, fullscreenPlayer) {
		$N.apps.core.Language.adornWithGetString(MusicPlayer, "apps/mediaPlayer/common/");
		MusicPlayer.superConstructor.call(this, banner);
		this._log = new $N.apps.core.Log("MediaPlayer", "MusicPlayer");
		this._log("MusicPlayer", "Enter");
		this._controller = controller;
		this._fullscreenPlayer = fullscreenPlayer;
		this.thumbnailImage = thumbnailImage;
		this._startPosition = 0;
		this._isStopPressed = false;
		this._speedIndicatorTimeout = null;
		this.START_ICON_FOUCS_INDEX = 5;
		this._playMode = null;
		this._counter = 0;
		this._log("MusicPlayer", "Exit");
	}

	$N.apps.util.Util.extend(MusicPlayer, $N.app.players.BasePlayer);

	/**
	 * Defines the the behaviour for end and beginning of content
	 * and ui updates
	 * @method initialise
	 */
	MusicPlayer.prototype.initialise = function () {
		this._log("initialise", "Enter");
		var me = this,
			PlaybackSubscriptionId;

		MusicPlayer.superClass.initialise.call(this);

		this._failureCallback = function (e) {
			if (e.contentErrorInfo) {
				var streamWrongType = $N.app.constants.CA_PLAY_ERRORS.contentErrorReason.CONTENT_ERROR_REASON_STREAM_WRONG_TYPE,
					streamCodecNotFound = $N.app.constants.CA_PLAY_ERRORS.contentErrorReason.CONTENT_ERROR_REASON_STREAM_CODEC_NOT_FOUND;
				if ((e.contentErrorInfo.reason === streamWrongType) || (e.contentErrorInfo.reason === streamCodecNotFound)) {
					$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_DLNA_COMMUNICATION_ERROR,
						MusicPlayer.getString("playerErrorTitle"),
						MusicPlayer.getString("playerAudioErrorMessage")
						);
				}
			}
			$N.app.fullScreenPlayer.jumpToLive();
			$N.app.ContextHelper.closeContext();
		};

		this._playerReachedEndCallback = function () {
			me._endOfPlayback();
		};

		this._playerConnectedListener = function () {
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
				//Device disabled pop up.
				$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_DLNA_COMMUNICATION_ERROR,
					MusicPlayer.getString("dlnaErrorTitle"),
					MusicPlayer.getString("dlnaPlayFailMessage")
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
	MusicPlayer.prototype._setIndexes = function (currentIndex) {
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
	MusicPlayer.prototype.activate = function (activationContext) {
		this._log("activate", "Enter");
		var playListLength = null,
			selectedIndex,
			i,
			urlWithMetatdata,
			selectedIconsInBanner = {};
		this._fullscreenPlayer.show();
		this._startPosition = 0;
		this._counter = 0;
		this.activationContext = activationContext;
		playListLength = activationContext.playList.length;
		this._actualUrls = [];
		this.iconsList = [];
		for (i = 0; i < playListLength; i++) {
			this._actualUrls[i] = activationContext.playList[i];
		}
		this._shuffledUrls = $N.app.ArrayUtil.arrayShuffle(this._actualUrls);
		this._shuffleMode = false;
		this._repeatMode = false;
		this._totalTracks = this._actualUrls.length;
		selectedIndex = (activationContext.selectedItemIndex === undefined) ? 0 : activationContext.selectedItemIndex;
		selectedIconsInBanner.shuffleModeEnabled = false;
		if (activationContext.isPlayShuffleEnabled) {
			this._shuffleMode = true;
			selectedIndex = 0;
			selectedIconsInBanner.shuffleModeEnabled = true;
		}
		this.availableIconsForBanner = $N.app.constants.TRICKPLAY_ICONS_FOR_PHOTO_AUDIO_VIDEO_PLAYBACK;
		if (this._totalTracks > 1) {
			//If more than one image in the list, Banner contains all the icons
			this.START_ICON_FOUCS_INDEX = 4;
			this.iconsList = [this.availableIconsForBanner.STOP, this.availableIconsForBanner.SHUFFLE, this.availableIconsForBanner.PREVIOUS, this.availableIconsForBanner.PLAY, this.availableIconsForBanner.NEXT, this.availableIconsForBanner.PROGRESSBAR];
		} else {
			//If only one image in the list, Banner contains the icons except Shuffle, Next and Previous icons
			this.START_ICON_FOUCS_INDEX = 1;
			this.iconsList = [this.availableIconsForBanner.STOP, this.availableIconsForBanner.PLAY, this.availableIconsForBanner.PROGRESSBAR];
		}
		activationContext.url = this._shuffleMode ? this._shuffledUrls[selectedIndex] : this._actualUrls[selectedIndex];
		this.activationContext.url = activationContext.url;
		selectedIndex = this._getActualListIndex();
		this._setIndexes(selectedIndex);
		this._banner.setIconsForBanner(this.iconsList, selectedIconsInBanner);
		this._banner.setCurrentAndTotalTracks(String(selectedIndex + 1), String(this._totalTracks));
		this._showBanner();
		this._startUpdateInterval();
		this._banner.selectIconAtIndex(this.START_ICON_FOUCS_INDEX);
		this._subscribeToUsbMediaPlaybackEvent();
		this._subscribeToDlnaDeviceLostEvent();
		$N.app.fullScreenPlayer.registerPlayerConnectedListener(this._playerConnectedListener);
		$N.app.fullScreenPlayer.registerPlayerConnectFailedListener(this._failureCallback);
		$N.app.fullScreenPlayer.registerPlayerPlayFailedListener(this._failureCallback);
		this._trickPlayObj.setDirectMode(true);
		MusicPlayer.superClass.activate.call(this, activationContext);
		this.thumbnailImage.setDefaultThumbnailUrl(activationContext.defaultThumbnailUrl);
		urlWithMetatdata = this.activationContext.controller.getMetaDataForUrl(activationContext.url);
		this.thumbnailImage.activate(urlWithMetatdata);
		this._log("activate", "Exit");
	};

	/**
	 * Passivates the player unregistering any listeners
	 * @method passivate
	 */
	MusicPlayer.prototype.passivate = function () {
		this._log("passivate", "Enter");
		this._finishPlayback();
		$N.app.fullScreenPlayer.jumpToLive();
		this._banner.deFocusSelectedIcon();
		if (this._repeatMode) {
			this._banner.toggleRepeatIconAndLabel(false);
		}
		MusicPlayer.superClass.passivate.call(this);
		this._fullscreenPlayer.hide();
		this.thumbnailImage.passivate();
		this._unSubscribeToUsbMediaPlaybackEvent();
		this._unSubscribeToDlnaDeviceLostEvent();
		$N.app.fullScreenPlayer.unregisterPlayerConnectedListener(this._playerConnectedListener);
		$N.app.fullScreenPlayer.unregisterPlayerConnectFailedListener(this._failureCallback);
		$N.app.fullScreenPlayer.unregisterPlayerPlayFailedListener(this._failureCallback);
		$N.app.ClockDisplay.hide();
		this._log("passivate", "Exit");
	};

	/**
	 * focus is called from Media player
	 * @method focus
	 */
	MusicPlayer.prototype.focus = function () {
		this._log("focus", "Enter");
		this._showBanner();
		$N.app.ClockDisplay.hide();
		this._log("focus", "Exit");
	};

	/**
	 * This function plays the next track in the playlist.
	 * @method _playNextTrack
	 */
	MusicPlayer.prototype._playNextTrack = function (nextIndex) {
		this._log("_playNextTrack", "Enter");
		if (this._totalTracks > 1) {
			var currentTrackIndex,
				trackIndex;
			this._counter = 0;
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
			this.playGivenURL(this.activationContext);
			this._banner.updateCurrentTrack(trackIndex + 1);
			this._setIndexes(this._next);
			this._updateThumbnailMetadata(nextIndex);
		}
		this._log("_playNextTrack", "Exit");
	};

	/**
	 * This function plays the previous track in the playlist.
	 * @method _playPreviousTrack
	 */
	MusicPlayer.prototype._playPreviousTrack = function (previousIndex) {
		this._log("_playPreviousTrack", "Enter");
		if (this._totalTracks > 1) {
			var currentTrackIndex,
				trackIndex,
				playerPosition = $N.app.fullScreenPlayer.getPlaybackPosition();
			if (this._counter < 1 || playerPosition >= 4) {
				if (playerPosition >= 4) {
					this._counter = 1;
					this._restartCurrentTrack();
					return;
				}
			}
			this._counter = 0;
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
			this.playGivenURL(this.activationContext);
			this._banner.updateCurrentTrack(trackIndex + 1);
			this._setIndexes(this._previous);
			this._updateThumbnailMetadata(previousIndex);
		}
		this._log("_playPreviousTrack", "Exit");
	};

	/**
	 * This is called when the playback has finished
	 * @method _endOfPlayback
	 */
	MusicPlayer.prototype._endOfPlayback = function () {
		this._log("_endOfPlayback", "Enter");
		this._counter = 0;
		if (this._repeatMode) {
			this._restartCurrentTrack();
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
	 * This is called when the playback has finished
	 * @method _restartCurrentPlayback
	 */
	MusicPlayer.prototype._restartCurrentTrack = function () {
		this._log("_restartCurrentPlayback", "Enter");
		var trickPlayMode = this._trickPlayObj.getTrickPlayMode();
		if (trickPlayMode === "pause") {
			this._trickPlayObj.play();
		}
		$N.app.fullScreenPlayer.setPlaybackPosition(0);
		this._trickPlayObj.play();
		this._updateBannerPlayBackPositions();
		this._log("_restartCurrentPlayback", "Exit");
	};

	/**
	 * This is called each time when track is changed. This will call thumbnail to update the metadata
	 * @method _updateThumbnailMetadata
	 */
	MusicPlayer.prototype._updateThumbnailMetadata = function (currentTrackIndex) {
		this._log("_updateThumbnailMetadata", "Enter");
		var urlWithMetatdata;
		if (this._shuffleMode) {
			currentTrackIndex = this._actualUrls.indexOf(this.activationContext.url);
		}
		urlWithMetatdata = this.activationContext.controller.getMetaDataForUrl(this.activationContext.url);
		this.thumbnailImage.activate(urlWithMetatdata);
		this._log("_updateThumbnailMetadata", "Exit");
	};

	/**
	 * This will returns the index of url in the actual track list
	 * @method _getActualListIndex
	 */
	MusicPlayer.prototype._getActualListIndex = function () {
		this._log("_getActualListIndex", "Enter & Exit");
		return this._actualUrls.indexOf(this.activationContext.url);
	};
	/**
	 * Starts the slideshow when pressing PLAY button
	 * @method _startSlideshow
	 */
	MusicPlayer.prototype._toggleShuffleMode = function () {
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
	MusicPlayer.prototype._toggleRepeatMode = function () {
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
	MusicPlayer.prototype._updateBannerPlayBackPositions = function () {
		this._log("_updateBannerPlayBackPositions", "Enter");
		var playerPosition = $N.app.fullScreenPlayer.getPlaybackPosition(),
			contentLength = $N.app.fullScreenPlayer.getContentLength();
		this._banner.updateProgressBar(playerPosition, contentLength);
		if (contentLength) {
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
	MusicPlayer.prototype._updateBannerTrickPlayIndicators = function (mode, rate) {
		if (rate === 0) {
			this.thumbnailImage.pauseThumbnailAnimation();
			this._cancelBannerHide();
			this._stopUpdateInterval();
			this._banner.togglePlayPauseIcon(false);
		} else {
			this.thumbnailImage.restartThumbnailAnimation();
			this._startUpdateInterval();
			this._banner.togglePlayPauseIcon(true);
		}
	};

	/**
	 * Helper method to cancel the auto hide feature of the banner
	 * @method _cancelBannerHide
	 * @private
	 */
	MusicPlayer.prototype._cancelBannerHide = function () {
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
	MusicPlayer.prototype._getBannerTimeout = function () {
		return (($N.platform.system.Preferences.get($N.app.constants.PREF_USBDLNA_PLAYER_BANNER_TIMEOUT)) * 1000);
	};

	/**
	 * Helper method to manage the timed display of the banner
	 * @method _showBanner
	 * @private
	 */
	MusicPlayer.prototype._showBanner = function () {
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
	MusicPlayer.prototype.okPressedHandler = function () {
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
	 * Key handler for MusicPlayer
	 * @method keyHandler
	 * @param {String} key
	 */
	MusicPlayer.prototype.keyHandler = function (key) {
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
			this._banner.updateFocusForIcon(this.availableIconsForBanner.NEXT);
			this._playNextTrack(this._next);
			return true;
		case keys.KEY_REW:
			this._showBanner();
			this._banner.updateFocusForIcon(this.availableIconsForBanner.PREVIOUS);
			this._playPreviousTrack(this._previous);
			return true;
		case keys.KEY_PLAY_PAUSE:
			this._showBanner();
			this._banner.updateFocusForIcon(this.availableIconsForBanner.PLAY);
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
		MusicPlayer.superClass.keyHandler.call(this, key);
		this._log("keyHandler", key);
		this._log("keyHandler", "Exit");
	};

	$N.app.players.MusicPlayer = MusicPlayer;

}($N));
