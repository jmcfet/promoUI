/**
 * OnDemandPlayer is a concrete implementation of BasePlayer and
 * allows playback of on demand content e.g vod and catchup
 * @class $N.app.players.OnDemandPlayer
 * @constructor
 * @extends $N.app.players.BasePlayer
 * @param {Object} controller
 * @param {Object} banner
 * @param {Object} fullscreenPlayer
 * @extends BasePlayer
 */

var $N = window.parent.$N;
$N.app = $N.app || {};
$N.app.players = $N.app.players || {};

(function ($N) {
	function OnDemandPlayer(controller, banner, fullscreenPlayer, loadingBar) {
		OnDemandPlayer.superConstructor.call(this, banner);
		this._log = new $N.apps.core.Log("MediaPlayer", "OnDemandPlayer");
		this._log("OnDemandPlayer", "Enter");
		this._controller = controller;
		this._fullscreenPlayer = fullscreenPlayer;
		this._loadingBar = loadingBar;
		this._startPosition = 0;
		this.PLAY_SPEED = 100;
		this.PAUSE_SPEED = 0;
		this.SPEED_REW_MULTIPLIERS = [ 100, 200, 400, 800, 1600, 3200, 6400 ];
		this.SPEED_FFW_MULTIPLIERS = [ 200, 400, 800, 1600, 3200, 6400 ];
		this.STOP_INDEX = 0;
		this.REPLAY_INDEX = 1;
		this.REW_INDEX = 2;
		this.PLAY_PAUSE_INDEX = 3;
		this.FFW_INDEX = 4;
		this._speedIndicatorTimeout = null;
		this._cachedBanner = null;
		this._isStartOver = false;
		this._activationContext = null;
		this.activatedCurrentPrefSubtitleTrack = false;

		this.RECORD_GAP_SECONDS = 300;

		this._playbackCompleteCallback = function () {};
		this._moreInfoCallback = function () {};

		this._log("OnDemandPlayer", "Exit");
	}
	$N.apps.util.Util.extend(OnDemandPlayer, $N.app.players.BasePlayer);

	/**
	 * @method initialise
	 */
	OnDemandPlayer.prototype.initialise = function () {
		this._log("initialise", "Enter");
		var me = this;

		OnDemandPlayer.superClass.initialise.call(this);

		this._failureCallback = function () {};

		this._playErrorCallback = function (err) {
			this._log('ERROR', err);
		};

		this._streamStartedListener = function () {};

		this._playerReachedEndCallback = function () {
			$N.app.ContextHelper.closeContext();
		};

		this._playerConnectedListener = function () {
			me._updateBannerPlayBackPositions();
		};

		$N.apps.core.Language.adornWithGetString($N.app.players.OnDemandPlayer);

		this._log("initialise", "Exit");
	};

	/**
	 * @method _setupForStartOver
	 * @param {Object} banner
	 */
	OnDemandPlayer.prototype._setupForStartOver = function (banner) {
		this._log("_setupForStartOver", "Enter");
		var episodeText = "";
		if (this._activationContext.contentObj && this._activationContext.contentObj.displaySeasonEpisode === true) {
			episodeText = $N.app.epgUtil.getSeasonEpisodeAbbreviation(this._activationContext.contentObj.seriesId, this._activationContext.contentObj.episodeId);
		}
		this._cachedBanner = this._banner;
		this._isStartOver = true;
		this._banner = banner;
		this.RETURN_TO_LIVE_INDEX = 0;
		this.STOP_INDEX = null;
		this.REPLAY_INDEX = null;
		this.REW_INDEX = 1;
		this.PLAY_PAUSE_INDEX = 2;
		this.FFW_INDEX = 3;
		this._banner.setStopKeyText(this._controller.getString("live"));
		this._banner.setEventNameText(this._activationContext.title, episodeText);
		this._banner.resetProgressBarPositon();
		this._log("_setupForStartOver", "Exit");
	};

	/**
	 * @method activate
	 * @param {Object} activationContext
	 * @param {Object} (optional) banner
	 */
	OnDemandPlayer.prototype.activate = function (activationContext, banner) {
		this._log("activate", "Enter");
		var me = this;
		this._activationContext = activationContext;
		if (activationContext.type === "STARTOVER" && banner) {
			this._setupForStartOver(banner);
		} else {
			this._tearDownForStartOver();
		}

		this.activatedCurrentPrefSubtitleTrack = false;

		this._loadingBar.setText($N.app.players.OnDemandPlayer.getString("preparingVideo"));
		this._loadingBar.setLoading(true);
		if (activationContext.successCallback) {
			this._streamStartedListener = function () {
				me._loadingBar.setLoading(false);
				activationContext.successCallback();
				if (!me.activatedCurrentPrefSubtitleTrack) {
					$N.app.TracksUtil.activateAudioByPriority();
					$N.app.TracksUtil.activateSubtitleByPriority();
					me.activatedCurrentPrefSubtitleTrack = true;
				}
				$N.app.fullScreenPlayer.unregisterPlayerConnectedListener(me._streamStartedListener);
			};
		} else {
			this._streamStartedListener = function () {
				me._loadingBar.setLoading(false);
				if (!me.activatedCurrentPrefSubtitleTrack) {
					$N.app.TracksUtil.activateAudioByPriority();
					$N.app.TracksUtil.activateSubtitleByPriority();
					me.activatedCurrentPrefSubtitleTrack = true;
				}
				$N.app.fullScreenPlayer.unregisterPlayerConnectedListener(me._streamStartedListener);
			};
		}
		$N.app.fullScreenPlayer.registerPlayerConnectedListener(this._streamStartedListener);
		if (activationContext.failureCallback) {
			this._failureCallback = activationContext.failureCallback;
		}
		$N.app.fullScreenPlayer.registerPlayerConnectFailedListener(this._failureCallback);
		if (activationContext.playbackCompleteCallback) {
			this._playbackCompleteCallback = activationContext.playbackCompleteCallback;
		}
		if (activationContext.moreInfoCallback) {
			this._moreInfoCallback = activationContext.moreInfoCallback;
		}
		$N.app.fullScreenPlayer.registerPlayerReachedEndListener(this._playerReachedEndCallback);

		if (activationContext.playErrorCallback) {
			this._playErrorCallback = activationContext.playErrorCallback;
		}
		$N.app.fullScreenPlayer.registerPlayErrorListener(this._playErrorCallback);

		this._trickPlayObj.setDirectMode(true);
		this._fullscreenPlayer.show();
		this._startPosition = activationContext.bookmark || 0;
		//this._getContentLengthText(this._startPosition), this._getContentLengthText($N.app.fullScreenPlayer.getContentLength())
		this._banner.setProgressBarStartEnd(this._getContentLengthText(this._startPosition), this._getContentLengthText($N.app.fullScreenPlayer.getContentLength()));
		//this._banner.setProgressBarStartEnd(this._activationContext.contentObj.startTime, this._activationContext.contentObj.endTime);
		this._banner.show();
		$N.app.fullScreenPlayer.registerPlayerConnectedListener(this._playerConnectedListener);
		OnDemandPlayer.superClass.activate.call(this, activationContext);
		this._updateBannerPlayBackPositions();
		this._startUpdateInterval();
		this._log("activate", "Exit");
	};

	/**
	 * @method _tearDownForStartOver
	 */
	OnDemandPlayer.prototype._tearDownForStartOver = function () {
		this._log("_tearDownForStartOver", "Enter");

		var episodeText = "";
		if (this._activationContext.contentObj && this._activationContext.contentObj.displaySeasonEpisode === true) {
			episodeText = $N.app.epgUtil.getSeasonEpisodeAbbreviation(this._activationContext.contentObj.seriesId, this._activationContext.contentObj.episodeId);
		}

		this._isStartOver = false;
		if (this._cachedBanner) {
			this._banner = this._cachedBanner;
			this._cachedBanner = null;
		}
		this.RETURN_TO_LIVE_INDEX = null;
		this.STOP_INDEX = 0;
		this.REPLAY_INDEX = 1;
		this.REW_INDEX = 2;
		this.PLAY_PAUSE_INDEX = 3;
		this.FFW_INDEX = 4;

		if (this._banner && this._banner.setEventNameText) {
			this._banner.setEventNameText(this._activationContext.title, episodeText);
		}

		this._log("_tearDownForStartOver", "Exit");
	};

	/**
	 * @method passivate
	 */
	OnDemandPlayer.prototype.passivate = function () {
		this._log("passivate", "Enter");
		this._loadingBar.setLoading(false);
		$N.app.fullScreenPlayer.unregisterPlayerConnectedListener(this._streamStartedListener);
		OnDemandPlayer.superClass.passivate.call(this);
		$N.app.fullScreenPlayer.unregisterPlayerConnectedListener(this._playerConnectedListener);
		$N.app.fullScreenPlayer.unregisterPlayerConnectFailedListener(this._failureCallback);
		$N.app.fullScreenPlayer.unregisterPlayerReachedEndListener(this._playerReachedEndCallback);
		$N.app.fullScreenPlayer.unregisterPlayErrorListener(this._playErrorCallback);
		if (this._isStartOver) {
			this._tearDownForStartOver();
		}
		this._log("passivate", "Exit");
	};

	/**
	 * @method _showStopPlaybackBanner
	 * private
	 * @param {Boolean} (optional) okPressed, to differentiate between STOP and GO TO LIVE for startOver
	 * @param {Boolean} (optional) returnToLive
	 */
	OnDemandPlayer.prototype._showStopPlaybackBanner = function (okPressed, returnToLive) {
		this._log("_showStopPlaybackBanner", "Enter");
		var me = this,
			selectAndShowBanner = function () {
				me._banner.select(me.STOP_INDEX || me.RETURN_TO_LIVE_INDEX);
				me._showBanner();
			},
			dialogueCallbackClose = function (e) {
				if (e && e.action === $N.app.constants.YES_OPTION) {
					selectAndShowBanner();
					setTimeout(function () { // Timeout required to see STOP button highlight
						if (returnToLive) {
							$N.app.ContextHelper.exitContext();
						} else {
							$N.app.ContextHelper.closeContext();
						}
					}, 100);
				} else {
					me._trickPlayObj.play();
				}
			},
			dialogueCallbackGoToLive = function (e) {
				if (e && e.action === $N.app.constants.YES_OPTION) {
					selectAndShowBanner();
					setTimeout(function () { // Timeout required to see STOP button highlight
						var activationContent = me._activationContext && me._activationContext.contentObj ? me._activationContext.contentObj : null,
							serviceId = activationContent && activationContent.serviceId ? activationContent.serviceId : 0,
							service = null;
						if (me._isStartOver && serviceId) {
							service = $N.app.epgUtil.getServiceById(serviceId);
							service.showBanner = true;
							$N.app.ContextHelper.openContext("ZAPPER", {activationContext: service});
						} else {
							$N.app.ContextHelper.closeContext();
						}
					}, 100);
				} else {
					me._trickPlayObj.play();
				}
			};

		this._trickPlayObj.pause();

		if (this._isStartOver) {
			$N.app.DialogueHelper.createAndShowDialogue(
				$N.app.constants.DLG_STOP_RECORDING_PLAYBACK,
				$N.app.players.OnDemandPlayer.getString("stopRecordingPlaybackTitle"),
				$N.app.players.OnDemandPlayer.getString("stopRecordingPlaybackMessage"),
				[{
					name: $N.app.players.OnDemandPlayer.getString("yes"),
					action: $N.app.constants.YES_OPTION
				}, {
					name: $N.app.players.OnDemandPlayer.getString("no"),
					action: $N.app.constants.NO_OPTION
				}],
				function (e) {
					if (okPressed) {
						dialogueCallbackGoToLive(e);
					} else {
						dialogueCallbackClose(e);
					}
				}
			);
		} else {
			$N.app.DialogueHelper.showNowDialog(
				$N.app.players.OnDemandPlayer.getString("stopRecordingPlaybackTitle"),
				$N.app.players.OnDemandPlayer.getString("stopRecordingPlaybackMessage"),
				[{
					name: $N.app.players.OnDemandPlayer.getString("yes"),
					action: function () {
						if (okPressed) {
							dialogueCallbackGoToLive({ action: $N.app.constants.YES_OPTION });
						} else {
							dialogueCallbackClose({ action: $N.app.constants.YES_OPTION });
						}
					}
				}, {
					name: $N.app.players.OnDemandPlayer.getString("no")
				}],
				null,
				null,
				function () {
					me._trickPlayObj.play();
				}
			);
		}

		this._log("_showStopPlaybackBanner", "Exit");
	};

	/**
	 * @method okPressedHandler
	 */
	OnDemandPlayer.prototype.okPressedHandler = function () {
		this._log("okPressedHandler", "Enter");
		var key,
			keys = $N.apps.core.KeyInterceptor.getKeyMap();
		if (this._banner.isVisible()) {
			switch (this._banner.getSelectedIndex()) {
			case this.RETURN_TO_LIVE_INDEX:
				this._showStopPlaybackBanner(true);
				return;
			case this.STOP_INDEX:
				key = keys.KEY_STOP;
				break;
			case this.REPLAY_INDEX:
				key = keys.KEY_REPLAY;
				break;
			case this.REW_INDEX:
				key = keys.KEY_REW;
				break;
			case this.PLAY_PAUSE_INDEX:
				key = keys.KEY_PLAY_PAUSE;
				break;
			case this.FFW_INDEX:
				key = keys.KEY_FFW;
				break;
			}
			this.keyHandler(key);
		} else {
			this._showBanner();
		}
		this._log("okPressedHandler", "Exit");
	};

	/**
	 * @method trickplayKeyHandler
	 * @param {Boolean} isRewind
	 */
	OnDemandPlayer.prototype.trickplayKeyHandler = function (isRewind) {
		this._log("trickplayKeyHandler", "Enter");
		var trickPlayMode = this._trickPlayObj.getTrickPlayMode();
		if ((!isRewind && trickPlayMode === "rew") || (isRewind && trickPlayMode === "ff")) {
			this._trickPlayObj.play();
		} else {
			this._trickPlayObj.setAllowSpeedCycle(false);
			if (isRewind) {
				this._trickPlayObj.setPlayRateMultipliers(this.SPEED_REW_MULTIPLIERS);
				this._banner.select(this.REW_INDEX);
			} else {
				this._trickPlayObj.setPlayRateMultipliers(this.SPEED_FFW_MULTIPLIERS);
				this._banner.select(this.FFW_INDEX);
			}
		}
		this._log("trickplayKeyHandler", "Exit");
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	OnDemandPlayer.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			me = this,
			replayPlaybackPosition = 0;
		switch (key) {
		case keys.KEY_INFO:
		case keys.KEY_RED:
			if (this._moreInfoCallback) {
				this._moreInfoCallback();
			}
			break;
		case keys.KEY_LEFT:
			if (this._banner.isVisible()) {
				this._banner.selectPrevious();
			}
			break;
		case keys.KEY_RIGHT:
			if (this._banner.isVisible()) {
				this._banner.selectNext();
			}
			break;
		case keys.KEY_OK:
			this.okPressedHandler();
			break;
		case keys.KEY_GREEN:
			if (this._banner.isVisible()) {
				this._banner.showCurrentAudioTrackAndToggle();
			}
			this._showBanner();
			return true;
		case keys.KEY_YELLOW:
			if (this._banner.isVisible()) {
				this._banner.showCurrentSubtitleStateAndToggle();
			}
			this._showBanner();
			return true;
		case keys.KEY_DOWN:
			this._banner.hide();
			return true;
		case keys.KEY_EXIT:
		case keys.KEY_BACK:
			if (this._banner.isVisible()) {
				this._banner.hide();
			} else {
				this._showStopPlaybackBanner(null, key === keys.KEY_EXIT);
			}
			return true;
		case keys.KEY_STOP:
			this._showStopPlaybackBanner();
			return true;
		case keys.KEY_FFW:
			this.trickplayKeyHandler(false);
			break;
		case keys.KEY_REW:
			this.trickplayKeyHandler(true);
			break;
		case keys.KEY_PLAY_PAUSE:
			this._banner.select(this.PLAY_PAUSE_INDEX);
			break;
		case keys.KEY_REPLAY:
			this._banner.select(this.REPLAY_INDEX);
			this._showBanner();
			if (this._isStartOver) {
				replayPlaybackPosition = $N.app.fullScreenPlayer.getPlaybackPosition() - 10;
				if (replayPlaybackPosition < 0) {
					replayPlaybackPosition = 0;
				}
			}
			this._banner.setSpeedIndicatorText('');
			setTimeout(function () { // Timeout required to see REPLAY button highlight
				$N.app.fullScreenPlayer.setPlaybackPosition(replayPlaybackPosition);
				me._banner.select(me.PLAY_PAUSE_INDEX);
				me._updateBannerPlayBackPositions(replayPlaybackPosition);
			}, 250);
			return true;
		case keys.KEY_UP:
			if (this._banner.isVisible()) {
				$N.app.ContextHelper.openContext("MINIGUIDE", {
					activationContext: {
						showBanner: true,
						hideBanner: false,
						inTrickplayMode: true
					}
				});
			} else {
				this._showBanner();
			}
			return true;
		}
		this._log("keyHandler", "Exit");
		return OnDemandPlayer.superClass.keyHandler.call(this, key);
	};

	/**
	 * @method _updateBannerPlayBackPositions
	 * @private
	 */
	OnDemandPlayer.prototype._updateBannerPlayBackPositions = function (playbackPosition) {
		this._log("_updateBannerPlayBackPositions", "Enter");
		var currentPosition = playbackPosition || $N.app.fullScreenPlayer.getPlaybackPosition(),
			assetLength = $N.app.fullScreenPlayer.getContentLength(),
			contentType = this._activationContext.contentObj.type,
			timeUntilEnd = this._activationContext.contentObj.endTime - Date.now(),
			bufferedTime = assetLength - (timeUntilEnd / 1000);

		if (contentType && contentType === 'STARTOVER') {
			this._banner.updateProgressBar(0, assetLength + this.RECORD_GAP_SECONDS, 0, bufferedTime + this.RECORD_GAP_SECONDS, currentPosition);
			this._banner.setProgressBarStartEnd(this._activationContext.contentObj.startTime - (this.RECORD_GAP_SECONDS * 1000), this._activationContext.contentObj.endTime + (this.RECORD_GAP_SECONDS * 1000));
		} else {
			this._banner.updateProgressBar(currentPosition, assetLength);
			this._banner.setProgressBarStartEnd(this._getContentLengthText(currentPosition), this._getContentLengthText(assetLength));
		}

		this._log("_updateBannerPlayBackPositions", "Exit");
	};

	/**
	 * @method _clearSpeedIndicatorTimer
	 */
	OnDemandPlayer.prototype._clearSpeedIndicatorTimer = function () {
		clearTimeout(this._speedIndicatorTimeout);
	};

	/**
	 * @method setHideSpeedIndicatorTimer
	 */
	OnDemandPlayer.prototype.setHideSpeedIndicatorTimer = function () {
		var me = this;
		this._clearSpeedIndicatorTimer();
		this._speedIndicatorTimeout = setTimeout(function () {
			me._banner.setSpeedIndicatorText("");
		}, 500);
	};

	/**
	 * @method _updateBannerTrickPlayIndicators
	 * @param {String} mode one of play, ff, rew, pause
	 * @param {Number} rate
	 * @private
	 */
	OnDemandPlayer.prototype._updateBannerTrickPlayIndicators = function (mode, rate) {
		this._log("_updateBannerTrickPlayIndicators", "Enter");
		this._banner.hideSpeedIndicator();
		if (this._isStartOver === true) {
			this._banner.setSpeedIndicatorX(mode);
		}
		switch (rate) {
		case this.PAUSE_SPEED:
			this._banner.togglePlayPauseIcon(false);
			this._banner.select(this.PLAY_PAUSE_INDEX);
			break;
		case this.PLAY_SPEED:
			this._banner.togglePlayPauseIcon(true);
			this._banner.select(this.PLAY_PAUSE_INDEX);
			this._banner.setSpeedIndicatorText("x1");
			this.setHideSpeedIndicatorTimer();
			if (this._isStartOver === false) {
				this._banner.setSpeedIndicatorX(this.PLAY_PAUSE_INDEX);
			}
			this._banner.showSpeedIndicator();
			break;
		default:
			this._clearSpeedIndicatorTimer();
			this._banner.togglePlayPauseIcon(false);
			this._banner.setSpeedIndicatorText("x" + String(Math.abs(rate) / 100));
			if (this._isStartOver === false) {
				this._banner.setSpeedIndicatorX(mode === $N.platform.output.TrickPlay.MODES.RW ? this.REW_INDEX : this.FFW_INDEX);
			}
			this._banner.showSpeedIndicator();
		}
		this._log("_updateBannerTrickPlayIndicators", "Exit");
	};

	/**
	 * @method _exitPlayback
	 * @param {Number} bookmarkPosition
	 * @private
	 */
	OnDemandPlayer.prototype._exitPlayback = function (bookmarkPosition) {
		this._log("_exitPlayback", "Enter");
		if (this._playbackCompleteCallback) {
			this._playbackCompleteCallback(bookmarkPosition);
		}
		this._log("_exitPlayback", "Exit");
	};

	/**
	 * @method _finishPlayback
	 * @private
	 */
	OnDemandPlayer.prototype._finishPlayback = function () {
		this._log("_finishPlayback", "Enter");
		var bookmarkPosition = $N.app.fullScreenPlayer.getPlaybackPosition();
		$N.app.fullScreenPlayer._retuneToCurrentChannel();
		this._exitPlayback(bookmarkPosition);
		this._log("_finishPlayback", "Exit");
	};

	$N.app.players.OnDemandPlayer = OnDemandPlayer;
}($N));
