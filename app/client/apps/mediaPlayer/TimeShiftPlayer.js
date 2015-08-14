/*global BasePlayer*/
/**
 * TimeShiftPlayer is a concrete implementation of BasePlayer, it is displayed when a viewer initiates a
 * trick mode while watching broadcast TV and has components
 * for trickplay icons and a progress bar etc.
 * @class $N.app.players.TimeShiftPlayer
 * @constructor
 * @extends $N.app.players.BasePlayer
 * @param {Object} controller controller object
 * @param {Object} banner banner object
 * @param {Object} fullscreenPlayer The Video object used to display fullscreen TV
 * @author doldham
 */

var $N = window.parent.$N;
$N.app = $N.app || {};
$N.app.players = $N.app.players || {};

(function ($N) {
	function TimeShiftPlayer(controller, banner, fullscreenPlayer) {
		TimeShiftPlayer.superConstructor.call(this, banner);
		this._log = new $N.apps.core.Log("MediaPlayer", "TimeShiftPlayer");
		this._log("TimeShiftPlayer", "Enter");
		this._controller = controller;
		this._fullscreenPlayer = fullscreenPlayer;
		this._startPosition = 0;
		this._event = {};
		this._isStopPressed = false;
		this.SPEED_INDICATOR_FADEOUT_TIME = 500;
		this.PLAY_SPEED = 100;
		this.PAUSE_SPEED = 0;
		this.SPEED_REW_MULTIPLIERS = [ 100, 200, 400, 800, 1600, 3200, 6400 ];
		this.SPEED_FFW_MULTIPLIERS = [ 200, 400, 800, 1600, 3200, 6400 ];
		this.RETURN_TO_LIVE_INDEX = 0;
		this.REW_INDEX = 1;
		this.PLAY_PAUSE_INDEX = 2;
		this.FFW_INDEX = 3;
		this._speedIndicatorTimeout = null;
		this._closeContext = false;
		this._log("TimeShiftPlayer", "Exit");
		this.pinHelper = null;
		this.isReviewBufferActive = false; //sets the status of the Review Buffer(Active or Not).
		this._boundPlayerCaughtUptoLiveListener = null;
	}

	$N.apps.util.Util.extend(TimeShiftPlayer, $N.app.players.BasePlayer);

	/**
	 * Defines the the behaviour for end and beginning of content
	 * and ui updates
	 * @method initialise
	 */
	TimeShiftPlayer.prototype.initialise = function () {
		this._log("initialise", "Enter");
		var me = this;

		TimeShiftPlayer.superClass.initialise.call(this);

		this._failureCallback = function () {};

		this._playerOnSignalLostCallback = function () {
			var BACK_OPTION = 1,
				buttonArray = [{
					name: me._controller.getString("back"),
					action: BACK_OPTION
				}],
				dialogCallback = function (popupResult) {
					if (popupResult && popupResult.action === BACK_OPTION) {
						me.exit();
					}
				};

			$N.app.DialogueHelper.createAndShowDialogue(
				$N.app.constants.DLG_TS_SIGNAL_LOSS,
				me._controller.getString("timeshiftStoppedTitle"),
				me._controller.getString("timeshiftStoppedSubTitle"),
				buttonArray,
				dialogCallback
			);
		};

		this._streamStartedListener = function (display) {
			$N.app.TracksUtil.activateCurrentPrefSubtitleTrack();
		};

		this._playerCaughtUptoLiveListener = function () {
			me._log("_playerCaughtUptoLiveListener", "Enter");
			me.exit();
			me.resetBannerTimeout();
			me._log("_playerCaughtUptoLiveListener", "Exit");
		};

		this._eventBoundaryChangedListener = function (data) {
			me._log("_eventBoundaryChangedListener", "Enter");
			var newEventId = data.eventBoundaryChangedInfo.eventID;
			if (newEventId && newEventId !== me._event.eventId) {
				me._event = $N.app.epgUtil.getMappedEventById(newEventId);
				me._updateBannerEventInfo();
				me._showPopUpIfBlocked();//if the event is blocked, the pin pop up will be shown.
			}
			me._log("_eventBoundaryChangedListener", "Exit");
		};

		this._playerConnectedListener = function () {
			me._log("_playerConnectedListener", "Enter");
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
			me._log("_playerConnectedListener", "Exit");
		};

		this._reviewBufferFailedListener = function (e) {
			me._log("_reviewBufferFailedListener", "Enter");
			me.exit();
			me.resetBannerTimeout();
			me._log("_reviewBufferFailedListener", "Exit");
		};

		//pin entry callbacks for parentally blocked contents.
		//success callback launches the blocked content.
		this._pinSuccessCallback = function () {
			this.isReviewBufferActive = false;
			setTimeout(function () {
				if ($N.apps.core.ContextManager.getDefaultContext().getId() === "ZAPPER") {
					$N.apps.core.ContextManager.getDefaultContext().getController().updateBannerAndTuneIfNeeded($N.platform.btv.EPG.getChannelByServiceId(me._event.serviceId), me._event);
				}
				$N.app.TracksUtil.activateAudioTrack();
				me._showBanner();
			}, 1000);
		};

		this._pinKeyPressCallback = function (value, key) {
			var callback = function () {
				me.pinHelper.hideDialog();
				me.resetBannerTimeout();
				me._showBanner();
			};
			me.pinHelper.handlePinKeyPressCallback(key, callback);
		};

		//_pinCancelledCallback callback dismisses the pop up and shows the banner.
		this._pinCancelledCallback = function () {
			me._showBanner();
		};
		//pinHelper object to launch pop ups.
		this.pinHelper = new $N.app.PinHelper(this._pinSuccessCallback, null, null, this._pinCancelledCallback, $N.app.constants.PIN_DIALOG_SHOW_TIME, false);
		this._log("initialise", "Exit");
	};

	/**
	 * Registers the callbacks and performs the tune request to
	 * start playback.
	 * @method activate
	 * @param {Object} activationContext
	 */
	TimeShiftPlayer.prototype.activate = function (activationContext) {
		this._log("activate", "Enter");
		this._event = activationContext.event;
		this._isActiveRecording = activationContext.actualStopTime ? false : true;
		this._isStopPressed = false;
		this.isReviewBufferActive = true;
		this._failureCallback = function () {};
		$N.app.fullScreenPlayer.registerPlayerConnectedListener(this._playerConnectedListener);
		if (activationContext.failureCallback) {
			this._failureCallback = activationContext.failureCallback;
		}
		$N.app.fullScreenPlayer.registerPlayerConnectFailedListener(this._failureCallback);

		this._boundPlayerCaughtUptoLiveListener = this._playerCaughtUptoLiveListener.bind(this);
		$N.app.fullScreenPlayer.registerCaughtUptoLiveListener(this._boundPlayerCaughtUptoLiveListener);
		$N.app.fullScreenPlayer.registerSignalLoss(this._playerOnSignalLostCallback);
		$N.app.fullScreenPlayer.registerEventBoundaryChangedListener(this._eventBoundaryChangedListener);
		$N.app.fullScreenPlayer.registerReviewBufferCallbacks(null, this._reviewBufferFailedListener);

		this._fullscreenPlayer.show();
		this._banner.setStopKeyText(this._controller.getString("live"));
		this._updateBannerEventInfo();
		this._trickPlayObj.setDirectMode(true);
		this._trickPlayObj.setAllowSpeedCycle(false);

		this._startPosition = activationContext.startPosition || 0;

		if (activationContext.dontRestartStream && !activationContext.atEndOfPlayBack) {
			if (this._startPosition === 0) {
				$N.app.fullScreenPlayer.setPlaybackPosition(0); //To startover from beginning
			}
			this._trickPlayObj.play();
		}
		TimeShiftPlayer.superClass.activate.call(this, activationContext);

		if ($N.app.fullScreenPlayer) {
			if (activationContext.audiotrack) {
				$N.app.fullScreenPlayer.tracks.activateAudioTrackByLanguage(activationContext.audiotrack.language);
			}
			if (activationContext.subtitletrack) {
				$N.app.fullScreenPlayer.tracks.activateSubtitleTrackByLanguage(activationContext.subtitletrack.language);
			} else {
				$N.app.TracksUtil.deactivateCurrentSubtitleTrack();
			}
		}
		this._startUpdateInterval();
		this.keyHandler(activationContext.triggerKey);
		this._log("activate", "Exit");
	};

	/**
	 * Passivates the player unregistering any listeners
	 * @method passivate
	 */
	TimeShiftPlayer.prototype.passivate = function () {
		this._log("passivate", "Enter");
		this.isReviewBufferActive = false;
		TimeShiftPlayer.superClass.passivate.call(this);
		$N.app.fullScreenPlayer.jumpToLive();
		$N.app.fullScreenPlayer.unregisterPlayerConnectedListener(this._playerConnectedListener);
		$N.app.fullScreenPlayer.unregisterPlayerConnectFailedListener(this._failureCallback);
		$N.app.fullScreenPlayer.unregisterCaughtUptoLiveListener(this._boundPlayerCaughtUptoLiveListener);
		$N.app.fullScreenPlayer.unregisterSignalLoss(this._playerOnSignalLostCallback);
		$N.app.fullScreenPlayer.unregisterEventBoundaryChangedListener(this._eventBoundaryChangedListener);
		$N.app.fullScreenPlayer.unregisterReviewBufferCallbacks(null, this._reviewBufferFailedListener);
		this._boundPlayerCaughtUptoLiveListener = null;
		this._closeContext = false;
		this._log("passivate", "Exit");
	};

	/**
	 * Focus received by the player
	 * @method focus
	 */
	TimeShiftPlayer.prototype.focus = function () {
		this._log("focus", "Enter");
		this.isReviewBufferActive = true;
		TimeShiftPlayer.superClass.focus.call(this);
		if (this._closeContext) {
			this._closeContext = false;
			$N.app.ContextHelper.closeContext();
		}
		this._log("focus", "Exit");
	};

	/**
	 * Focus removed from the player
	 * @method defocus
	 */
	TimeShiftPlayer.prototype.defocus = function () {
		this._log("defocus", "Enter");
		this.isReviewBufferActive = false;
		TimeShiftPlayer.superClass.defocus.call(this);
		this._log("defocus", "Exit");
	};

	/**
	 * Helper method to manage the timed display of the banner (Overridden from BasePlayer)
	 * @method _showBanner
	 * @private
	 */
	TimeShiftPlayer.prototype._showBanner = function () {
		this._log("_showBanner", "Enter");
		var me = this;
		this._cancelBannerHide();
		if (this._getBannerTimeout() !== -1) {
			this._bannerTimeout = window.parent.setTimeout(function () {
				me._stopUpdateInterval();
				me._clockDisplay.hide();
				me._controller.hideBackLabel();
				me._banner.hide();
				//shows the pop up if the review buffer is active and content is blocked.
				if (me.isReviewBufferActive) {
					me._showPopUpIfBlocked();
				}
			}, this._getBannerTimeout());
		}
		if (!this._banner.isVisible()) {
			this._startUpdateInterval();
			this._ifTrailerShowBackLabel();
			this._banner.show();
		}
		this._log("_showBanner", "Exit");
	};


	/**
	 *(Overridden from BasePlayer)
	 * @method resetBannerTimeout
	 * @private
	 */
	TimeShiftPlayer.prototype.resetBannerTimeout = function () {
		this._log("resetBannerTimeout", "Enter");
		var me = this;
		if (this._bannerTimeout) {
			window.parent.clearTimeout(this._bannerTimeout);
		}
		if (this._getBannerTimeout() !== -1) {
			this._bannerTimeout = window.parent.setTimeout(function () {
				me._stopUpdateInterval();
				me._clockDisplay.hide();
				me._controller.hideBackLabel();
				me._banner.hide();
				//shows the pop up if the review buffer is active and content is blocked.
				if (me.isReviewBufferActive) {
					me._showPopUpIfBlocked();
				}
			}, this._getBannerTimeout());
		}

		this._log("resetBannerTimeout", "Exit");
	};
	/**
	 * Key handler for TimeShiftPlayer
	 * @method keyHandler
	 * @param {String} key
	 */
	TimeShiftPlayer.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var handled = false,
			keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			me = this,
			playerPosition = null,
			newPosition = 0,
			startPosition = 1, //setting to 1 as the start position comes as 0.001 and floating point comparison is not allowed.
			replayInterval = 10;
		if (!$N.app.PVRCapability.isPVREnabled) {
			this.goBackToZapper(key);
			handled = true;
		} else {
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
			case keys.KEY_FAVOURITES:
				this.goToMiniGuideWithKey(key);
				handled = true;
				break;
			case keys.KEY_CHAN_UP:
			case keys.KEY_CHAN_DOWN:
				$N.app.ContextHelper.openContext("ZAPPER", {
					activationContext: {
						keyHandlerKey: key,
						showBanner: true
					}
				});
				handled = true;
				break;
			case keys.KEY_LEFT:
				if (this._banner.isVisible()) {
					this._banner.selectPrevious();
				}
				handled = true;
				break;
			case keys.KEY_RIGHT:
				if (this._banner.isVisible()) {
					this._banner.selectNext();
				}
				handled = true;
				break;
			case keys.KEY_OK:
				this.okPressedHandler();
				handled = true;
				break;
			case keys.KEY_EXIT:
			case keys.KEY_BACK:
			case keys.KEY_DOWN:
				this._banner.hide();
				this._showPopUpIfBlocked();
				handled = true;
				break;
			case keys.KEY_STOP:
				this.exit();
				this.isReviewBufferActive = false;
				handled = true;
				break;
			case keys.KEY_FFW:
				if (this._trickPlayObj.getTrickPlayMode() === $N.platform.output.TrickPlay.MODES.RW) {
					this._trickPlayObj.play();
				} else {
					this._trickPlayObj.setPlayRateMultipliers(this.SPEED_FFW_MULTIPLIERS);
					this._banner.select(this.FFW_INDEX);
					this._trickPlayObj.fastForward();
				}
				handled = true;
				break;
			case keys.KEY_REW:
				if (this._trickPlayObj.getTrickPlayMode() === $N.platform.output.TrickPlay.MODES.FF) {
					this._trickPlayObj.play();
				} else {
					this._trickPlayObj.setPlayRateMultipliers(this.SPEED_REW_MULTIPLIERS);
					this._banner.select(this.REW_INDEX);
					this._trickPlayObj.rewind();
				}
				handled = true;
				break;
			case keys.KEY_PLAY:
			case keys.KEY_PAUSE:
			case keys.KEY_PLAY_PAUSE:
				this._banner.select(this.PLAY_PAUSE_INDEX);
				this._trickPlayObj.playPause();
				handled = true;
				break;
			case keys.KEY_REPLAY:
				this._trickPlayObj.play();
				this._updateBannerPlayBackPositions();
				playerPosition = $N.app.fullScreenPlayer.getPlaybackPosition();
				//timeout required because setPlaybackPosition is not working immediately after playRequest
				setTimeout(function () {
					if (playerPosition <= startPosition) {
						playerPosition = ($N.app.fullScreenPlayer.getReviewBufferInfo().currentPosition) / 1000;
					}
					if (playerPosition > replayInterval) {
						newPosition = playerPosition - replayInterval;
						$N.app.fullScreenPlayer.setPlaybackPosition(newPosition);
						me._updateBannerPlayBackPositions();
					}
				}, 100);
				handled = true;
				break;
			case keys.KEY_GREEN:
				if (this._banner.isVisible()) {
					this._banner.showCurrentAudioTrackAndToggle();
				}
				this._showBanner();
				handled = true;
				break;
			case keys.KEY_YELLOW:
				if (this._banner.isVisible()) {
					this._banner.showCurrentSubtitleStateAndToggle();
				}
				this._showBanner();
				handled = true;
				break;
			case keys.KEY_INFO:
			case keys.KEY_RED:
				$N.app.epgUtil.navigateToSynopsis(this._event);
				handled = true;
				break;
			case keys.KEY_UP:
				if (this._banner.isVisible()) {
					$N.app.ContextHelper.openContext("MINIGUIDE", {
						activationContext: {
							keyHandlerKey: key,
							showBanner: true,
							hideBanner: false,
							inTrickplayMode: true
						}
					});
				} else {
					this._showBanner();
				}
				handled = true;
				break;
			case keys.KEY_RECORD:
				if (this._event && this._event.eventId && $N.app.PVRUtil.isRecordable(this._event)) {
					$N.app.PVRUtil.recordOrCancelEvent(this._event);
					handled = true;
				}
				break;
			default:
				this._isStopPressed = false;
				break;
			}

			if (handled) {
				if (this._trickPlayObj.getTrickPlayMode() === $N.platform.output.TrickPlay.MODES.PLAY) {
					this.resetBannerTimeout();
				}
			} else {
				handled = TimeShiftPlayer.superClass.keyHandler.call(this, key);
			}
		}
		this._log("keyHandler", key);
		this._log("keyHandler", "Exit");
		return handled;
	};

	/**
	 * function to transfer context back to zapper when channel change command is issued.
	 * @method goBackToZapper
	 */
	TimeShiftPlayer.prototype.goBackToZapper = function () {
		this._log("goBackToZapper", "Enter");
		$N.app.ContextHelper.closeContext();
		this._log("goBackToZapper", "Exit");
	};

	/**
	 * function to transfer context to mini guide
	 * @method goToMiniGuideWithKey
	 */
	TimeShiftPlayer.prototype.goToMiniGuideWithKey = function (key) {
		this._log("goToMiniGuideWithKey", "Enter");
		$N.app.ContextHelper.openContext("MINIGUIDE", {
			activationContext: {
				keyHandlerKey: key,
				hideBanner: false,
				inTrickplayMode: true
			}
		});
		this._log("goToMiniGuideWithKey", "Exit");
	};

	/**
	 * Exits the player
	 * @method exit
	 */
	TimeShiftPlayer.prototype.exit = function () {
		this._log("exit", "Enter");
		if (this._trickPlayObj.getTrickPlayMode() !== $N.platform.output.TrickPlay.MODES.PLAY) {
			this._trickPlayObj.play();
		}
		if (this._hasFocus) {
			$N.app.ContextHelper.closeContext();
		} else {
			this._closeContext = true;
		}
		this._log("exit", "Exit");
	};

	/**
	 * Cancels the hide speed indicator timeout.
	 * @method cancelHideSpeedIndicatorTimer@
	 */
	TimeShiftPlayer.prototype.cancelHideSpeedIndicatorTimer = function () {
		if (this._speedIndicatorTimeout) {
			clearTimeout(this._speedIndicatorTimeout);
			this._speedIndicatorTimeout = null;
		}
	};

	/**
	 * Sets the hide speed indicator timer
	 * @method setHideSpeedIndicatorTimer
	 */
	TimeShiftPlayer.prototype.setHideSpeedIndicatorTimer = function () {
		var me = this,
			hideTimer = function () {
				me._banner.setSpeedIndicatorText("");
			};
		this._speedIndicatorTimeout = setTimeout(hideTimer, this.SPEED_INDICATOR_FADEOUT_TIME);

	};

	/**
	 * OK button click handler
	 * @method okPressedHandler
	 */
	TimeShiftPlayer.prototype.okPressedHandler = function () {
		var key,
			keys = $N.apps.core.KeyInterceptor.getKeyMap();
		if (this._banner.isVisible()) {
			switch (this._banner.getSelectedIndex()) {
			case this.RETURN_TO_LIVE_INDEX:
				key = keys.KEY_STOP;
				this.isReviewBufferActive = false;
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
	 * Updates the banner so that progress bar shows the
	 * correct event title, start and end time.
	 * @method _updateBannerEventInfo
	 * @private
	 */
	TimeShiftPlayer.prototype._updateBannerEventInfo = function () {
		this._log("_updateBannerEventInfo", "Enter");
		var episodeText = "";
		if ($N.app.EventUtil.isValidEvent(this._event)) {
			if (this._event.displaySeasonEpisode === true) {
				episodeText = $N.app.epgUtil.getSeasonEpisodeAbbreviation(this._event.seriesId, this._event.episodeId);
			}
			this._banner.setEventNameText(this._event.title, episodeText);
			this._banner.setProgressBarStartEnd(this._event.startTime, this._event.endTime);
		} else {
			this._banner.setEventNameText("");
			this._banner.setProgressBarStartEnd($N.app.fullScreenPlayer.getReviewBufferStartTime(), $N.app.fullScreenPlayer.getReviewBufferEndTime());
		}
		this._log("_updateBannerEventInfo", "Exit");
	};

	/**
	 * Shows the pop up if the channel is parentally blocked.
	 * @method _showPopUpIfBlocked
	 * @private
	 */
	TimeShiftPlayer.prototype._showPopUpIfBlocked = function () {
		if (this._event) {
			var service = $N.platform.btv.EPG.getChannelByServiceId(this._event.serviceId),
				isTheChannelLocked = $N.app.ParentalControlUtil.isChannelLocked(service);

			if ($N.app.ParentalControlUtil.isChannelOrProgramLocked(this._event) && this.isReviewBufferActive) {
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
					title: isTheChannelLocked ? this._controller.getString("channelLocked") : this._controller.getString("programLocked"),
					description: isTheChannelLocked ? this._controller.getString("unlockChannel") : this._controller.getString("unlockShow"),
					keyPressedCallback: this._pinKeyPressCallback,
					titleCssClass: "pinEntryTitle"
				});
				this.pinHelper.showPinDialog('master', true, null, true);
				$N.app.fullScreenPlayer.tuner.hideVideo();
				$N.app.TracksUtil.deactivateAudioTrack();
			}
		}
	};
	/**
	 * Updates the banner to show the current playback positions
	 * @method _updateBannerPlayBackPositions
	 * @private
	 */
	TimeShiftPlayer.prototype._updateBannerPlayBackPositions = function () {
		this._log("_updateBannerPlayBackPositions", "Enter");
		var bufferInfo = $N.app.fullScreenPlayer.getReviewBufferInfo();
		if ($N.app.EventUtil.isValidEvent(this._event)) {
			this._banner.updateProgressBar(this._event.startTime, this._event.endTime, bufferInfo.startPosition, bufferInfo.endPosition, bufferInfo.currentPosition);
		} else {
			this._banner.setProgressBarStartEnd($N.app.fullScreenPlayer.getReviewBufferStartTime(), $N.app.fullScreenPlayer.getReviewBufferEndTime());
			this._banner.updateProgressBar(bufferInfo.startPosition, bufferInfo.endPosition, bufferInfo.startPosition, bufferInfo.endPosition, bufferInfo.currentPosition);
		}
		this._log("_updateBannerPlayBackPositions", "Exit");
	};

	/**
	 * Updates the banner to show the trickplay mode
	 * @method _updateBannerTrickPlayIndicators
	 * @param {String} mode one of play, ff, rew, pause
	 * @param {Number} rate
	 * @private
	 */
	TimeShiftPlayer.prototype._updateBannerTrickPlayIndicators = function (mode, rate) {
		this._log("_updateBannerTrickPlayIndicators", "Enter");
		if (mode === null || rate === null) {
			this._log("_updateBannerTrickPlayIndicators", "Exit 1");
			return;
		}
		this._banner.hideSpeedIndicator();
		switch (rate) {
		case this.PAUSE_SPEED:
			this._banner.togglePlayPauseIcon(false);
			this._banner.select(this.PLAY_PAUSE_INDEX);
			this._banner.setSpeedIndicatorX(mode);
			break;
		case this.PLAY_SPEED:
			this._banner.togglePlayPauseIcon(true);
			this._banner.select(this.PLAY_PAUSE_INDEX);
			this._banner.setSpeedIndicatorText("x1");
			this._banner.setSpeedIndicatorX(mode);
			this.setHideSpeedIndicatorTimer();
			this._banner.showSpeedIndicator();
			break;
		default:
			this._banner.togglePlayPauseIcon(false);
			this._banner.setSpeedIndicatorText("x" + String(Math.abs(rate) / 100));
			this._banner.setSpeedIndicatorX(mode);
			this.cancelHideSpeedIndicatorTimer();
			this._banner.showSpeedIndicator();
		}
		this._log("_updateBannerTrickPlayIndicators", "Exit");
	};

	/**
	 * Updates the banner to show the title or parentally lock the title
	 * @method _updateBannerTitle
	 * @param {String} title
	 * @private
	 */
	TimeShiftPlayer.prototype._updateBannerTitle = function (title) {
		this._log("_updateBannerTitle", "Enter");
		this._log("_updateBannerTitle", "Exit");
	};

	$N.app.players.TimeShiftPlayer = TimeShiftPlayer;

}($N));
