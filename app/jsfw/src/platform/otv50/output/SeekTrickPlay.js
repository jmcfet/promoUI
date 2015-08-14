/**
 * SeekTrickPlay contains the methods that control the Player's
 * playback speed. This allows for the following functionality:
 *
 * - Rewind
 * - Fast-Forward
 * - Play / Pause
 * - Stop
 *
 * It registers listeners that listen out for the following events within the Player:
 *
 * - `PlayerPlaying`
 * - `PlayerSpeedChanged`
 * - `PlayerAtBeginning`
 * - `PlayerAtEnd`
 *
 * Callbacks are used so that the application that calls the TrickPlay class can update
 * its GUI accordingly. It should only be applied to HLS content.
 *
 * @class $N.platform.output.SeekTrickPlay
 * @author gstacey
 *
 * @requires $N.apps.core.Log
 * @requires $N.apps.core.KeyInterceptor
 * @constructor
 * @param {Object} player the player object that this trickPlayHelper is
 *			associated with and listening to events for.
 */

/*global clearInterval, setInterval, clearTimeout, setTimeout*/

define('jsfw/platform/output/SeekTrickPlay',
    [
    	'jsfw/apps/core/Log',
    	'jsfw/apps/core/KeyInterceptor'
    ],
	function (Log, KeyInterceptor) {

		var log = new $N.apps.core.Log("output", "SeekTrickPlay");

		var SeekTrickPlay = function (player) {
			var me = this;
			this.PLAY_SPEED = 100;
			this.PAUSE_SPEED = 0;
			this._player = null;
			this._speedIDX = 0;
			this._SPEED_MULTIPLIERS = [ 400, 800, 1600, 3200 ]; //use 400, 800 etc to keep consistent with TrickPlay.js
			this._allowSpeedCycle = true;
			this._defaultSkipTime = 30; //30 seconds
			this._ffRwInterval = null;
			this._ffRwIntervalMS = 1000; //1 second by default
			this._trickPlayMode = null;
			this._ffRwPosition = 0;
			this._isffRW = false;
			this._trickRate = 0;
			this._isDirectMode = true;
			this._tempPlaybackPosition = null;
			this._tempPositionTimeout = null;

			// call backs for UI updates
			this._playerPositionChangedCallback = function (response) {
				me._isffRW = false;
			};
			this._playerPositionChangeFailedCallback = function (response) {
				me._isffRW = false;
			};
			this._playerPlayingCallback = function () {
				me.play();
			};
			this._playerAtBeginningCallback = function () {
				me.play();
			};
			this._playerAtEndCallback = function () {
				me.pause();
			};
			this._uiRefreshCallback = function (mode, speed) {
			};

			if (player) {
				this.setPlayer(player);
			}
		};

		/**
		 * A set of constants used to denote the current state to
		 * report back to the UI the MODES object contains:
		 * `PLAY`, `PAUSE`, `FF` and `RW` properties
		 * @property {String} MODES
		 */
		SeekTrickPlay.MODES = {
			PLAY : "play",
			PAUSE : "pause",
			FF : "ff",
			RW : "rew"
		};

		var proto = SeekTrickPlay.prototype;

		proto.MODES = SeekTrickPlay.MODES;

		/**
		 * Sets the playback position to the given time
		 * @method setPosition
		 * @param {Number} position The position to set in milliseconds
		 */
		proto._setPosition = function (position) {
			var positionCommand = {
				whence: this._player.SEEK_SET,
				type: this._player.POSITION_TYPE_TIME_BASED,
				timePosition: position
			};
			this._player.setPosition(positionCommand);
		};

		/**
		 * Set the player object that is to be used for video playback
		 * @method setPlayer
		 * @param {Object} player
		 */
		proto.setPlayer = function (player) {
			this._player = player;
		};

		/**
		 * Returns the player in use for video playback
		 * @method getPlayer
		 * @return {Object} player
		 */
		proto.getPlayer = function () {
			return this._player;
		};

		/**
		 * Overrides the default behaviour for when the player starts
		 * playing, the callback function will be called when the player
		 * starts playing
		 * @method setPlayerPlayingCallback
		 * @param {Function} callback
		 */
		proto.setPlayerPlayingCallback = function (callback) {
			this._playerPlayingCallback = callback;
		};

		/**
		 * Overrides the behaviour for when the player reaches the start of the content.
		 * The default player behaviour is to start playing.
		 * @method setPlayerAtBeginningCallback
		 * @param {Function} callback
		 */
		proto.setPlayerAtBeginningCallback = function (callback) {
			this._playerAtBeginningCallback = callback;
		};

		/**
		 * Overrides the behaviour for when the player reaches the end of the content.
		 * The default behaviour is to pause the player.
		 * @method setPlayerAtEndCallback
		 * @param {Function} callback
		 */
		proto.setPlayerAtEndCallback = function (callback) {
			this._playerAtEndCallback = callback;
		};

		/**
		 * Sets the callback function to be executed for updating the UI.
		 * The callback is executed after calling the trick play methods such as
		 * play, pause, fast-forward etc.
		 * @method setUIRefreshCallback
		 * @param {Function} callback
		 */
		proto.setUIRefreshCallback = function (callback) {
			this._uiRefreshCallback = callback;
		};

		/**
		 * Sets the direct mode flag. When direct mode is true, pressing rewind while in
		 * fast-forward will slow down the fast-forward speed and vice versa
		 * @method setDirectMode
		 * @param {Boolean} flag
		 */
		proto.setDirectMode = function (flag) {
			this._isDirectMode = flag;
		};

		/**
		 * Sets whether fast-forward and rewind functionality should allow the various
		 * speeds to cycle. If true, and fast-forward / rewind is on the maximum speed, the
		 * playrate will cycle back to the lowest. If false, subsequent presses of
		 * the fast-forward / rewind keys when on maximum speed will have no effect.
		 * @method setAllowSpeedCycle
		 * @param {Boolean} allow
		 */
		proto.setAllowSpeedCycle = function (allow) {
			this._allowSpeedCycle = allow;
		};

		/**
		 * Sets the trickplay speeds to be used for fast-forward and rewind. If not set, the default
		 * is 400, 800, 1600 and 3200 which corresponds to 4x, 8x, 16x and 32x.
		 * @method setPlayRateMultipliers
		 * @param {Array} mutliplierArray
		 */
		proto.setPlayRateMultipliers = function (mutliplierArray) {
			this._SPEED_MULTIPLIERS = mutliplierArray;
		};

		/**
		 * Sets the default time to skip in the content when the keyHandler
		 * receives a request to skip forwards or back.
		 * @method setDefaultSkipTime
		 * @param {Number} timeSeconds time to skip in seconds
		 */
		proto.setDefaultSkipTime = function (timeSeconds) {
			this._defaultSkipTime = timeSeconds;
		};

		/**
		 * Listener for buffering event. If buffering is complete calls the
		 * player playing call back.
		 * @method _bufferingListener
		 * @private
		 */
		proto._bufferingListener = function (e) {
			log("_bufferingListener", "start and end", Log.LOG_DEBUG);
			if (e.percentBuffered >= 100) {
				this._playerPlayingCallback();
			}
		};

		/**
		 * Registers relevant listeners to allow the UI callbacks to be executed.
		 * @method registerEventListeners
		 */
		proto.registerEventListeners = function () {
			this._player.addEventListener("onPositionChanged", this._playerPositionChangedCallback, false);
			this._player.addEventListener("onPositionChangeFailed", this._playerPositionChangeFailedCallback, false);
			this._player.addEventListener("onPlayStarted", this._playerPlayingCallback, false);
			this._player.addEventListener("onBuffering", this._bufferingListener, false);
			this._player.addEventListener("onEoc", this._playerAtEndCallback, false);
			this._player.addEventListener("onBoc", this._playerAtBeginningCallback, false);
		};

		/**
		 * Unregisters the listeners to registered with `registerEventListeners`
		 * @method unRegisterEventListeners
		 */
		proto.unRegisterEventListeners = function () {
			this._player.removeEventListener("onPositionChanged", this._playerPositionChangedCallback, false);
			this._player.removeEventListener("onPositionChangeFailed", this._playerPositionChangeFailedCallback, false);
			this._player.removeEventListener("onPlayStarted", this._playerPlayingCallback, false);
			this._player.removeEventListener("onBuffering", this._bufferingListener, false);
			this._player.removeEventListener("onEoc", this._playerAtEndCallback, false);
			this._player.removeEventListener("onBoc", this._playerAtBeginningCallback, false);
		};

		/**
		 * Sets the time interval for updating the playback position when in ff / rew mode
		 * @method setFfRwIntervalTime
		 * @param {Object} time
		 */
		proto.setFfRwIntervalTime = function (time) {
			this._ffRwIntervalMS = time;
		};

		/**
		 * Stops updating the playback position when in FF/REW mode.
		 * @method stopFfRwInterval
		 */
		proto.stopFfRwInterval = function () {
			if (this._ffRwInterval) {
				clearInterval(this._ffRwInterval);
			}
		};

		/**
		 * Returns playback position. Gets the temporary stored position if in ff / rew mode
		 * @method getPlaybackPosition
		 */
		proto.getPlaybackPosition = function () {
			if (this._speedIDX !== 0 || this._isffRW) {
				return this._ffRwPosition / 1000;
			} else {
				try {
					return this._player.position / 1000;
				} catch (e) {
					log("getPlaybackPosition", "Caught exception, returning zero.");
					return 0;
				}
			}
		};

		/**
		 * Returns the updated trickplay rate e.g. 4, 8, -4, -8 etc
		 * after the given trickplay mode has been performed
		 * @method _getUpdatedTrickPlayRate
		 * @private
		 * @param {String} mode The trickplay mode
		 * @param {Boolean} forceMode If true will force rewind or fast-forward regardless of direct mode
		 * @return {Number} The trickplay rate
		 */
		proto._getUpdatedTrickPlayRate = function (mode, forceMode) {
			var multiplier; //will be -1 if rewind, 1 if fast-forward
			if (mode === SeekTrickPlay.MODES.RW || mode === SeekTrickPlay.MODES.FF) {
				if (!forceMode && ((this.getTrickPlayMode() === SeekTrickPlay.MODES.RW && mode === SeekTrickPlay.MODES.FF) ||
					(this.getTrickPlayMode() === SeekTrickPlay.MODES.FF && mode === SeekTrickPlay.MODES.RW))) {
					if (this._speedIDX === 1) {
						return 1;
					} else if (this._speedIDX > 1) {
						this._speedIDX--;
					}
					multiplier = (this.getTrickPlayMode() === SeekTrickPlay.MODES.RW) ? -1 : 1;
				} else {
					if (this._trickPlayMode !== mode) {
						this._speedIDX = 1;
					} else if (this._speedIDX < this._SPEED_MULTIPLIERS.length) {
						this._speedIDX++;
					} else if (this._allowSpeedCycle) {
						this._speedIDX = 1;
					}
					multiplier = (mode === SeekTrickPlay.MODES.RW) ? -1 : 1;
				}
				this._trickRate = this._SPEED_MULTIPLIERS[this._speedIDX - 1] * multiplier;
				return this._trickRate / this.PLAY_SPEED;
			} else if (mode === SeekTrickPlay.MODES.PLAY) {
				this._trickRate = 100;
				return 1;
			} else {
				this._trickRate = 0;
				return 0;
			}
		};

		/**
		 * Toggles the video playback between play and pause
		 * @method playPause
		 * @param {Boolean} dedicated denotes if dedicated play button was pressed (not play / pause)
		 */
		proto.playPause = function (dedicated) {
			log("playPause", "Enter");
			if (this._player.speed === this.PLAY_SPEED || (dedicated && (this._trickRate > this.PAUSE_SPEED || this._trickRate < this.PAUSE_SPEED))) {
				this.pause();
			} else {
				this.play();
			}
			log("playPause", "Exit");
		};

		/**
		 * Pauses the video playback and calls the function registered by `setUIRefreshCallback`
		 * @method pause
		 */
		proto.pause = function () {
			log("pause", "Enter");
			this.stopFfRwInterval();
			this._speedIDX = 0;
			if (this._player.speed !== this.PAUSE_SPEED) {
				this._player.setSpeed(this.PAUSE_SPEED);
			}
			this._uiRefreshCallback(SeekTrickPlay.MODES.PAUSE, this.PAUSE_SPEED);
			this._trickPlayMode = SeekTrickPlay.MODES.PAUSE;
			log("pause", "Exit");
		};

		/**
		 * Changes the player to play mode.
		 * @method play
		 */
		proto.play = function () {
			log("play", "Enter");
			if (this._player.speed !== this.PLAY_SPEED) {
				this._player.setSpeed(this.PLAY_SPEED); //need to play before we set position for HLS
			}
			if (this._speedIDX !== 0) {
				this._isffRW = true;
				this._setPosition(this._ffRwPosition);
			}
			this.stopFfRwInterval();
			this._speedIDX = 0;
			this._uiRefreshCallback(SeekTrickPlay.MODES.PLAY, this.PLAY_SPEED);
			this._trickPlayMode = SeekTrickPlay.MODES.PLAY;
			log("play", "Exit");
		};

		/**
		 * Performs either ff / rew trickplay
		 * @method _rwFfTrickPlay
		 * @private
		 * @param {String} mode The trickplay mode
		 * @param {Boolean} forceMode If true will force rewind or fast-forward regardless of direct mode
		 */
		proto._rwFfTrickPlay = function (mode, forceMode) {
			var me = this,
				rate = this._getUpdatedTrickPlayRate(mode, forceMode);
			if (rate === 1) {
				this.play();
			} else {
				if (this._speedIDX === 1 && this._trickPlayMode !== SeekTrickPlay.MODES.RW && this._trickPlayMode !== SeekTrickPlay.MODES.FF) {
					this._ffRwPosition = this._player.position;
					this._player.setSpeed(this.PAUSE_SPEED);
				} else {
					this.stopFfRwInterval();
				}
				if (rate > 0) {
					this._trickPlayMode = SeekTrickPlay.MODES.FF;
				} else {
					this._trickPlayMode = SeekTrickPlay.MODES.RW;
				}
				this._ffRwInterval = setInterval(function () {
					me._ffRwPosition = me._ffRwPosition + (rate * 1000);
					if (mode === SeekTrickPlay.MODES.RW) {
						if (me._ffRwPosition <= 0) {
							//BOC
							me._playerAtBeginningCallback();
						}
					} else {
						if (me._ffRwPosition >= me._player.duration) {
							//EOC
							me._playerAtEndCallback();
						}
					}
				}, this._ffRwIntervalMS);
			}
			this._uiRefreshCallback(this._trickPlayMode, rate * this.PLAY_SPEED);
		};

		/**
		 * Rewinds the content currently playing. Successive calls increase the rate at which the
		 * player rewinds. If `setAllowSpeedCycle` was called with `true` and the max. rewind speed
		 * is reached, calling this function sets the play rate to the minimum rewind speed. If false, the
		 * rewind speed will remain at the top speed.
		 * @method rewind
		 */
		proto.rewind = function () {
			log("rewind", "Enter");
			this._rwFfTrickPlay(SeekTrickPlay.MODES.RW, true);
			log("rewind", "Exit");
		};

		/**
		 * Fast-forwards the content currently playing. Successive calls increase the rate at which the
		 * player fast-forwards. If `setAllowSpeedCycle` was called with `true` and the max. fast-forward speed
		 * is reached, calling this function sets the play rate to the minimum fast-forward speed. If false, the
		 * fast-forward speed will remain at the top speed.
		 * @method fastForward
		 */
		proto.fastForward = function () {
			log("fastForward", "Enter");
			this._rwFfTrickPlay(SeekTrickPlay.MODES.FF, true);
			log("fastForward", "Exit");
		};

		/**
		 * Slow fast-forward will slow down the fast-forward speed, or if in rewind mode, will increase the rewind speed.
		 * It is called from the keyHandler when rewind key is pressed and it is not in direct mode
		 * @method slowFastForward
		 */
		proto.slowFastForward = function () {
			log("slowFastForward", "Enter");
			this._rwFfTrickPlay(SeekTrickPlay.MODES.RW);
			log("slowFastForward", "Exit");
		};

		/**
		 * Slow rewind will slow down the rewind speed, or if in ff mode, will increase the fast ff speed.
		 * It is called from the keyHandler when fast-forward key is pressed and it is not in direct mode
		 * @method slowRewind
		 */
		proto.slowRewind = function () {
			log("slowRewind", "Enter");
			this._rwFfTrickPlay(SeekTrickPlay.MODES.FF);
			log("slowRewind", "Exit");
		};

		/**
		* Updates the current playback position to be +/- the given seconds.
		* If playback position to be set is less than 0, then position is set to 0.
		* Will not set the playback position if it is to be set past the content length
		* @method skip
		* @param {Number} timeSeconds time in seconds. Negative values tell the player to skip back
		*/
		proto.skip = function (timeSeconds) {
			var playbackPosition,
				me = this;
			timeSeconds = parseInt(timeSeconds, 10);
			this.play();
			if (this._tempPlaybackPosition) {
				playbackPosition = this._tempPlaybackPosition + timeSeconds;
			} else {
				playbackPosition = this._player.position + (timeSeconds * 1000);
			}
			if (playbackPosition < 0) {
				playbackPosition = 0;
			}
			if (playbackPosition < this._player.duration) {
				this._tempPlaybackPosition = playbackPosition;
				this._setPosition(playbackPosition);
				if (this._tempPositionTimeout) {
					clearTimeout(this._tempPositionTimeout);
				}
				this._tempPositionTimeout = setTimeout(function () {
					me._tempPlaybackPosition = null;
				}, 1000);
			}
		};

		/**
		 * Returns the current playback mode depending on the playrate of the player
		 * @method getTrickPlayMode
		 * @return {String} string representation of the current trickplay mode
		 */
		proto.getTrickPlayMode = function () {
			return this._trickPlayMode;
		};

		/**
		 * Returns the trickplay rate which will be the playing speed, pause speed or
		 * one of the Play Rate Multipliers. Negative values indicate rewind speed
		 * @method getTrickPlayRate
		 * @return {Number} the trick play rate
		 */
		proto.getTrickPlayRate = function () {
			return this._trickRate;
		};

		/**
		 * A convenience method that can be called to avoid having to redefine
		 * the default key handling behaviour for trick play.
		 * @method keyHandler
		 * @param {String} key a string representation of the pressed key
		 * @return {Boolean} True if key was handled, false if not
		 */
		proto.keyHandler = function (key) {
			log("keyHandler", "Enter");

			var handled = true,
				keys = $N.apps.core.KeyInterceptor.getKeyMap();
			switch (key) {
			case keys.KEY_PLAY:
			case keys.KEY_PLAY_PAUSE:
				this.playPause();
				break;
			case keys.KEY_PAUSE:
				this.playPause(true);
				break;
			case keys.KEY_REW:
				if (this._isDirectMode) {
					this.rewind();
				} else {
					this.slowFastForward();
				}
				break;
			case keys.KEY_FFW:
				if (this._isDirectMode) {
					this.fastForward();
				} else {
					this.slowRewind();
				}
				break;
			case keys.KEY_SKIP_FW:
				this.skip(this._defaultSkipTime);
				break;
			case keys.KEY_SKIP_REW:
				this.skip(-this._defaultSkipTime);
				break;
			default:
				handled = false;
			}

			log("keyHandler", "Exit");
			return handled;
		};

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.SeekTrickPlay = SeekTrickPlay;
		return SeekTrickPlay;
	}
);
