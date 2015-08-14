/**
 * PvrPlayer is a concrete implementation of BasePlayer and
 * allows playback of recorded content.
 * @class $N.app.players.PvrPlayer
 * @constructor
 * @extends $N.app.players.BasePlayer
 * @param {Object} controller controller object
 * @param {Object} banner banner object
 * @param {Object} fullscreenPlayer The Video object used to display fullscreen TV
 * @param {Object} parentalLockIcon parentalLockIcon object used to display the parental lock
 * @extends BasePlayer
 * @author doldham
 */

var $N = window.parent.$N;
$N.app = $N.app || {};
$N.app.players = $N.app.players || {};

(function ($N) {
	function PvrPlayer(controller, banner, fullscreenPlayer, parentalLockIcon) {
		PvrPlayer.superConstructor.call(this, banner);
		this._log = new $N.apps.core.Log("MediaPlayer", "PvrPlayer");
		this._log("PvrPlayer", "Enter");
		this._controller = controller;
		this._fullscreenPlayer = fullscreenPlayer;
		this._parentalLockIcon = parentalLockIcon;
		this._startPosition = 0;
		this._bookMarkedPosition = 0;
		this._taskId = null;
		this._isStopPressed = false;
		this._playbackSpeed = null;
		this.PLAY_SPEED = 100;
		this.PAUSE_SPEED = 0;
		this.SPEED_REW_MULTIPLIERS = [ 100, 200, 400, 800, 1600, 3200, 6400 ];
		this.SPEED_FFW_MULTIPLIERS = [ 200, 400, 800, 1600, 3200, 6400 ];
		this.STOP_INDEX = 0;
		this.REPLAY_INDEX = 1;
		this.REW_INDEX = 2;
		this.PLAY_PAUSE_INDEX = 3;
		this.FFW_INDEX = 4;
		this.SPEED_INDICATOR_FADEOUT_TIME = 500;
		this._speedIndicatorTimeout = null;
		this.pvrDisabledSubscriptionId = null;
		this.pinHelper = null;
		this.activatedCurrentPrefSubtitleTrack = false;
		this._log("PvrPlayer", "Exit");
	}

	$N.apps.util.Util.extend(PvrPlayer, $N.app.players.BasePlayer);

	/**
	 * Defines the the behaviour for end and beginning of content
	 * and ui updates
	 * @method initialise
	 */
	PvrPlayer.prototype.initialise = function () {
		this._log("initialise", "Enter");
		var me = this;

		PvrPlayer.superClass.initialise.call(this);

		this._failureCallback = function () {};

		this._streamStartedListener = function (display) {
			if (!me.activatedCurrentPrefSubtitleTrack) {
				$N.app.TracksUtil.activateAudioByPriority();
				$N.app.TracksUtil.activateSubtitleByPriority();
				me.activatedCurrentPrefSubtitleTrack = true;
			}
		};

		this._playerReachedEndCallback = function () {
			me._endOfPlayback();
		};

		this._playerConnectedListener = function () {
			if (me._startPosition) {
				// TODO NINJA-287: JSFW-FIXED<2.0.4 Beta 3>: This is a work around, need an option to start playback with bookmark position
				//OR we can use onStreamStarted suggested by MW: https://jira-02.opentv.com/browse/OTV5-4013
				$N.app.fullScreenPlayer.tuner.hideVideo();
				//timeout required because setPlaybackPosition is not working immediately after playRequest
				setTimeout(function () {
					$N.app.fullScreenPlayer.setPlaybackPosition(me._startPosition);
					$N.app.fullScreenPlayer.tuner.showVideo();
				}, 100);
			}
			me._updateBannerPlayBackPositions();
		};

		this._showOrHideParentalLock = function (display) {
			if (display) {
				me._parentalLockIcon.show();
			} else {
				me._parentalLockIcon.hide();
			}
		};

		this._parentalLockListener = function (display) {
			me._showOrHideParentalLock(display);
		};
		this._banner.hide(true);//sends message to banner to forcefully hide the banner

		//pin entry callbacks for parentally blocked contents.
		//success callback launches the blocked content.
		this._pinSuccessCallback = function () {
			if (me._trickPlayObj.getTrickPlayMode() === $N.platform.output.TrickPlay.MODES.PAUSE) {
				me._banner.select(this.PLAY_PAUSE_INDEX);
				me._trickPlayObj.play();
			}
		};

		//pin key press call back to handle key presses.
		this._pinKeyPressCallback = function (value, key) {
			if (isNaN(parseInt(key, 10)) && key !== $N.apps.core.KeyInterceptor.getKeyMap().KEY_LEFT && key !== $N.apps.core.KeyInterceptor.getKeyMap().KEY_OK) {
				me.pinHelper.hideDialog();
				me.resetBannerTimeout();
				me._showBanner();
			}
		};
		//_pinCancelledCallback callback dismisses the pop up close the context.
		this._pinCancelledCallback = function () {
			$N.app.ContextHelper.closeContext();
		};
		//pinHelper object to launch pop ups.
		this.pinHelper = new $N.app.PinHelper(this._pinSuccessCallback, null, null, this._pinCancelledCallback, $N.app.constants.PIN_DIALOG_SHOW_TIME, false);
		this._log("initialise", "Exit");
	};

	/**
	 * Shows the pop up if the content is parentally blocked.
	 * @method _showParentalPinPopup
	 * @private
	 */
	PvrPlayer.prototype._showParentalPinPopup = function () {
		this._log("_showParentalPinPopup", "Enter");
		//If the current mode is Forward or Rewind,play or pause will happen.
		if ((this._trickPlayObj.getTrickPlayMode() === $N.platform.output.TrickPlay.MODES.FF) || this._trickPlayObj.getTrickPlayMode() === $N.platform.output.TrickPlay.MODES.RW) {
			this._trickPlayObj.playPause();//After this the trickmode state will be 'Play'
		}
		//If after the previous step its still in play mode, pause will happen.
		if (this._trickPlayObj.getTrickPlayMode() !== $N.platform.output.TrickPlay.MODES.PAUSE) {
			this._banner.select(this.PLAY_PAUSE_INDEX);
			this._trickPlayObj.playPause();
		}
		this.pinHelper.setDialogProperties({
			x: 0,
			y: 0,
			width: 1920,
			height: 1080,
			id: "PinDialog",
			title: $N.app.DialogueHelper.getString("programLocked"),
			description: $N.app.DialogueHelper.getString("unlockShow"),
			keyPressedCallback: this._pinKeyPressCallback,
			titleCssClass: "pinEntryTitle"
		});
		this.pinHelper.showPinDialog('master', true, null, true);
		this._banner.hide(true);

		this._log("_showParentalPinPopup", "Exit");
	};

	/**
	 * Registers the callbacks and performs the tune request to
	 * start playback.
	 * @method activate
	 * @param {Object} activationContext
	 */
	PvrPlayer.prototype.activate = function (activationContext) {
		this._log("activate", "Enter");

		var me = this,
			task = activationContext.playingEvent;
		this._activationContext = activationContext;
		this._taskId = task.taskId;
		this._isActiveRecording = activationContext.actualStopTime ? false : true;
		this._isStopPressed = false;

		this.activatedCurrentPrefSubtitleTrack = false;

		if ((task && task.bookmark && task.bookmark > 0) && !activationContext.clearBookmark) {
			this._bookMarkedPosition = task.bookmark;
		} else {
			this._bookMarkedPosition = 0;
		}
		this._recordingDurationinMS = $N.app.PVRUtil.getRecordingTimingsData(task).recordingDuration;
		this._recordingDurationInSecs = $N.app.epgUtil.calculateEventLengthInSeconds(0, this._recordingDurationinMS);

		$N.app.fullScreenPlayer.registerPlayerConnectedListener(this._streamStartedListener);
		if (activationContext.failureCallback) {
			this._failureCallback = activationContext.failureCallback;
		}
		//Set player show pin pop up on blocked event.
		$N.app.fullScreenPlayer.setPinPopUpOnBlockedEventCallback(function () {
			me._showParentalPinPopup();
		});

		//Set player hide pin pop up on unblocked event.
		$N.app.fullScreenPlayer.setHidePinPopUpForUnblockedEventCallback(function () {
			if (me.pinHelper.isPinShowing()) {
				me.pinHelper.hideDialog();
			}
		});
		$N.app.fullScreenPlayer.registerPlayerConnectFailedListener(this._failureCallback);
		$N.app.fullScreenPlayer.registerPlayErrorListener(this._failureCallback);
		if (this.pvrDisabledSubscriptionId !== null) {
			$N.apps.util.EventManager.unSubscribe(this.pvrDisabledSubscriptionId);
		}
		this.pvrDisabledSubscriptionId = $N.apps.util.EventManager.subscribe("PVRDisabled", function () {
			me._finishPlayback(true);
		}, this);

		$N.app.PVRUtil.setTaskAsPlaying(this._taskId);
		$N.app.fullScreenPlayer.registerPlayerReachedEndListener($N.app.PVRUtil.unsetTaskAsPlaying);
		$N.app.fullScreenPlayer.registerPlayerConnectFailedListener($N.app.PVRUtil.unsetTaskAsPlaying);

		$N.app.fullScreenPlayer.registerPvrPlayerParentalLockListener(this._parentalLockListener);

		this._trickPlayObj.setDirectMode(true);
		this._fullscreenPlayer.show();

		this._startPosition = activationContext.startPosition || 0;

		if (this._banner && this._banner.setEventNameText) {
			this._banner.setEventNameText(activationContext.title);
		}

		this._banner.setProgressBarStartEnd(this._getContentLengthText(this._startPosition), this._getContentLengthText(this._recordingDurationInSecs));
		this._banner.show();

		$N.app.fullScreenPlayer.registerPlayerConnectedListener(this._playerConnectedListener);

		if (activationContext.dontRestartStream && !activationContext.atEndOfPlayBack) {
			if (this._startPosition === 0) {
				$N.app.fullScreenPlayer.setPlaybackPosition(0); //To startover from beginning
			}
			this._trickPlayObj.play();
		}

		if (this._bookMarkedPosition && this._bookMarkedPosition > 0) {
			// pass bookmark on to BasePlayer activate to start at the correct position
			activationContext.bookmark = this._bookMarkedPosition;
		}

		PvrPlayer.superClass.activate.call(this, activationContext);

		this._updateBannerPlayBackPositions();
		this._startUpdateInterval();

		this._log("activate", "Exit");
	};

	/**
	 * Passivates the player unregistering any listeners
	 * @method passivate
	 */
	PvrPlayer.prototype.passivate = function () {
		this._log("passivate", "Enter");
		$N.app.fullScreenPlayer.unregisterPlayerConnectedListener(this._streamStartedListener);
		PvrPlayer.superClass.passivate.call(this);
		$N.app.fullScreenPlayer.unregisterPlayerConnectedListener(this._playerConnectedListener);
		$N.app.fullScreenPlayer.unregisterPlayerConnectFailedListener(this._failureCallback);
		$N.app.fullScreenPlayer.unregisterPlayErrorListener(this._failureCallback);
		$N.app.fullScreenPlayer.unregisterPvrPlayerParentalLockListener(this._parentalLockListener);
		$N.app.fullScreenPlayer.unregisterPlayerReachedEndListener($N.app.PVRUtil.unsetTaskAsPlaying);
		$N.app.fullScreenPlayer.unregisterPlayerConnectFailedListener($N.app.PVRUtil.unsetTaskAsPlaying);
		$N.app.fullScreenPlayer.setPinPopUpOnBlockedEventCallback(null);
		this._banner.hide(true);//sends message to banner to forcefully hide the banner
		this._log("passivate", "Exit");
	};

	/**
	 * OK button click handler
	 * @method okPressedHandler
	 */
	PvrPlayer.prototype.okPressedHandler = function () {
		var key,
			keys = $N.apps.core.KeyInterceptor.getKeyMap();
		if (this._banner.isVisible()) {
			switch (this._banner.getSelectedIndex()) {
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
	};

	/**
	 * @method _restoreTrickPlayMode
	 * @private
	 */
	PvrPlayer.prototype._restoreTrickPlayMode = function () {
		this._log("restoreTrickPlayMode", "");
		switch (this._playbackSpeed) {
		case this.PAUSE_SPEED:
			this._trickPlayObj.pause();
			this._banner.togglePlayPauseIcon(false);
			this._banner.select(this.PLAY_PAUSE_INDEX);
			break;
		case this.PLAY_SPEED:
			this._trickPlayObj.play();
			this._banner.togglePlayPauseIcon(true);
			this._banner.select(this.PLAY_PAUSE_INDEX);
			break;
		default:
			if (this._playbackSpeed < 0) {
				this._trickPlayObj.rewind();
				this._banner.select(this.REW_INDEX);
			} else {
				this._trickPlayObj.fastForward();
				this._banner.select(this.FFW_INDEX);
			}
		}
	};

	/**
	 * @method _showStopPlaybackBanner
	 * @param {Boolean} exitContext (optional) - Exit the context (or close context) after confirmation
	 * @private
	 */
	PvrPlayer.prototype._showStopPlaybackBanner = function (exitContext) {
		this._log("_showStopPlaybackBanner", "Enter");
		var me = this,
			dialogCallbackYes = function (key) {
				me._banner.select(me.STOP_INDEX);
				me._isStopPressed = true;
				me._banner.exitPVRPlaybackBanner();
				me._showBanner();
				setTimeout(function () { // Timeout required to see STOP button highlight
					if (me._shouldExitContext) {
						$N.app.ContextHelper.exitContext();
					} else {
						$N.app.ContextHelper.closeContext();
					}
				}, 100);
			},
			dialogCallbackNo = function (key) {
				me._restoreTrickPlayMode();
			},
			dialogCallback = function (key) {
				var yesKey = ((key && key.action === $N.app.constants.YES_OPTION) || (key.key && key.key.action === $N.app.constants.YES_OPTION));
				if (yesKey) {
					dialogCallbackYes(key);
				} else {
					dialogCallbackNo(key);
				}
			},
			dialogButtons = [{
				name: $N.app.DialogueHelper.getString("yes"),
				action: $N.app.constants.YES_OPTION
			}, {
				name: $N.app.DialogueHelper.getString("no"),
				action: $N.app.constants.NO_OPTION
			}];

		this._playbackSpeed = this._trickPlayObj.getSpeed();
		this._trickPlayObj.pause();
		this._shouldExitContext = exitContext;

		$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_STOP_PVR_PLAYBACK,
			$N.app.PVRUtil.getString("stopRecordingPlaybackTitle"),
			$N.app.PVRUtil.getString("stopRecordingPlaybackMessage"),
			dialogButtons,
			dialogCallback);
		this._log("_showStopPlaybackBanner", "Exit");
	};

	/**
	 * Key handler for specific ff / rew behaviour
	 * @method trickplayKeyHandler
	 * @param {Boolean} isRewind
	 */
	PvrPlayer.prototype.trickplayKeyHandler = function (isRewind) {
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
	 * Key handler for PvrPlayer
	 * @method keyHandler
	 * @param {String} key
	 */
	PvrPlayer.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			me = this,
			playingTaskId = null;
		switch (key) {
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
			this._banner.hide(true);//sends message to banner to forcefully hide the banner
			return true;
		case keys.KEY_EXIT:
			this._showStopPlaybackBanner(true);
			return true;
		case keys.KEY_BACK:
		case keys.KEY_STOP:
			this._showStopPlaybackBanner(false);
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
			// The following line resets the speed back to normal time, removing FF / RW timings if they were in place
			this._trickPlayObj.play();
			this._showBanner();
			setTimeout(function () { // Timeout required to see REPLAY button highlight
				$N.app.fullScreenPlayer.setPlaybackPosition(0);
				me._banner.select(me.PLAY_PAUSE_INDEX);
				me._updateBannerPlayBackPositions();
			}, 250);
			return true;
		case keys.KEY_RED:
		case keys.KEY_INFO:
			$N.app.PVRUtil.navigateToSynopsis(this._activationContext.playingEvent);
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
			this._log("keyHandler", "Exit 2 - KEY_UP handled");
			return true;
		default:
			this._isStopPressed = false;
			break;
		}
		this._log("keyHandler", key);
		this._log("keyHandler", "Exit");
		return PvrPlayer.superClass.keyHandler.call(this, key);
	};

	/**
	 * Updates the banner to show the current playback positions
	 * @method _updateBannerPlayBackPositions
	 * @private
	 */
	PvrPlayer.prototype._updateBannerPlayBackPositions = function () {
		this._log("_updateBannerPlayBackPositions", "Enter");
		var playerPosition = $N.app.fullScreenPlayer.getPlaybackPosition(),
			recordPosition = $N.app.fullScreenPlayer.getContentLength();
		this._banner.updateProgressBar(playerPosition, recordPosition);
		if (this._isActiveRecording && recordPosition) {
			this._banner.setProgressBarStartEnd(this._getContentLengthText(playerPosition), this._getContentLengthText(recordPosition));
		}
		this._log("_updateBannerPlayBackPositions", "Exit");
	};

	/**
	 * Clears the hide speed indicator timer
	 * @method _clearSpeedIndicatorTimer
	 */
	PvrPlayer.prototype._clearSpeedIndicatorTimer = function () {
		clearTimeout(this._speedIndicatorTimeout);
	};

	/**
	 * Sets the hide speed indicator timer
	 * @method setHideSpeedIndicatorTimer
	 */
	PvrPlayer.prototype.setHideSpeedIndicatorTimer = function () {
		var me = this;
		this._clearSpeedIndicatorTimer();
		this._speedIndicatorTimeout = setTimeout(function () {
			me._banner.setSpeedIndicatorText("");
		}, this.SPEED_INDICATOR_FADEOUT_TIME);
	};

	/**
	 * Updates the banner to show the trickplay mode
	 * @method _updateBannerTrickPlayIndicators
	 * @param {String} mode one of play, ff, rew, pause
	 * @param {Number} rate
	 * @private
	 */
	PvrPlayer.prototype._updateBannerTrickPlayIndicators = function (mode, rate) {
		this._log("_updateBannerTrickPlayIndicators", "Enter");
		this._banner.hideSpeedIndicator();
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
			this._banner.setSpeedIndicatorX(this.PLAY_PAUSE_INDEX);
			this._banner.showSpeedIndicator();
			break;
		default:
			this._clearSpeedIndicatorTimer();
			this._banner.togglePlayPauseIcon(false);
			this._banner.setSpeedIndicatorText("x" + String(Math.abs(rate) / 100));
			this._banner.setSpeedIndicatorX(mode === $N.platform.output.TrickPlay.MODES.RW ? this.REW_INDEX : this.FFW_INDEX);
			this._banner.showSpeedIndicator();
		}
		this._log("_updateBannerTrickPlayIndicators", "Exit");
	};

	/**
	 * This function saves a bookmark
	 * @method _saveBookMark
	 * @param bookMarkPosition
	 * @param contentLength
	 * private
	 */
	PvrPlayer.prototype._saveBookMark = function (bookMarkPosition, contentLength) {
		this._log("_saveBookMark", "Enter");
		bookMarkPosition = (bookMarkPosition >= 0) ? bookMarkPosition : $N.app.fullScreenPlayer.getPlaybackPosition();
		contentLength = contentLength || $N.app.fullScreenPlayer.getContentLength();

		if ($N.app.PVRUtil.deleteOrBookmarkCurrentPosition(bookMarkPosition, contentLength)) {
			this._bookMarkedPosition = bookMarkPosition;
		} else {
			this._bookMarkedPosition = 0;
		}

		$N.platform.btv.PVRManager.saveBookmark(this._activationContext.playingEvent, 0, this._bookMarkedPosition);

		this._log("_saveBookMark", "Exit");
	};

	/**
	 * This function goes back to recordings.
	 * @method _exitPlayback
	 * @param navigateToDefault True if we wish to ignore previous overlay and navigate straight to default
	 * @private
	 */
	PvrPlayer.prototype._exitPlayback = function (navigateToDefault) {
		this._log("_exitPlayback", "Enter");
		if (!this._bookMarkedPosition) {
			$N.app.fullScreenPlayer.jumpToLive();
		}
		this._banner.exitPVRPlaybackBanner();
		$N.app.PVRUtil.unsetTaskAsPlaying();
		this._playbackFinished = true;
		this._log("_exitPlayback", "Exit");
	};

	/**
	 * This is called when the playback is stopped and sets the bookmark for the current content.
	 * @method _finishPlayback
	 * @param navigateToDefault True if we wish to ignore previous overlay and navigate straight to default
	 * @private
	 */
	PvrPlayer.prototype._finishPlayback = function (navigateToDefault) {
		this._log("_finishPlayback", "Enter");
		var bookMarkPosition = $N.app.fullScreenPlayer.getPlaybackPosition(),
			contentLength = $N.app.fullScreenPlayer.getContentLength();
		this._stopTrickPlay();
		$N.app.fullScreenPlayer.jumpToLive();
		this._saveBookMark(bookMarkPosition, contentLength);
		if (this.pvrDisabledSubscriptionId) {
			$N.apps.util.EventManager.unSubscribe(this.pvrDisabledSubscriptionId);
		}
		this.pvrDisabledSubscriptionId = null;
		this._exitPlayback(navigateToDefault);
		this._log("_finishPlayback", "Exit");
	};


	PvrPlayer.prototype._haveFwToLiveTv = function (taskId) {
		return $N.platform.btv.PVRManager.isTaskRecordingNow(taskId);
	};

	/**
	 * This is called when the playback has finished and sets the bookmark for the current content
	 * and checks for an active recording case.
	 * @method _endOfPlayback
	 */
	PvrPlayer.prototype._endOfPlayback = function () {
		this._log("_endOfPlayback", "Enter");
		if (this._haveFwToLiveTv(this._taskId)) {
			this._trickPlayObj.play();
		} else { // At the end of a recording.
			this._saveBookMark();
			this._exitPlayback();
			if (this._hasFocus) {
				$N.app.ContextHelper.closeContext();
			}
		}
		this._log("_endOfPlayback", "Exit");
	};

	$N.app.players.PvrPlayer = PvrPlayer;

}($N));
