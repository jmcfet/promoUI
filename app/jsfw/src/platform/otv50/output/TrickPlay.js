/**
 * TrickPlay contains the methods that control the Player's
 * playback speed. This allows for the following functionality:
 *
 * - Rewind
 * - Fast-Forward
 * - Play/Pause
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
 * its GUI accordingly.
 * @class $N.platform.output.TrickPlay
 * @author doldham
 *
 * @requires $N.apps.core.Log
 * @requires $N.apps.core.KeyInterceptor
 * @constructor
 * @param {Object} player the player object that this trickPlayHelper is
 *			associated with and listening to events for.
 */

define('jsfw/platform/output/TrickPlay',
     [
    	'jsfw/apps/core/Log',
    	'jsfw/apps/core/KeyInterceptor'
    ],
	function (Log, KeyInterceptor) {

		var log = new $N.apps.core.Log("output", "Trickplay");

		var TrickPlay = function (player) {

			var me = this;
			this._isAwaitingSpeedChangeEvent = false;
			this.PLAY_SPEED = 100;
			this.PAUSE_SPEED = 0;
			this._player = null;
			this._speedIDX = 0;
			this._newSpeedIDX = 0;
			this._SPEED_MULTIPLIERS = [ 200, 400, 800, 1600, 3200 ];
			this._allowSpeedCycle = true;
			this._defaultSkipTimeInSeconds = 30;
			this._isDirectMode = true;
			this._savedPlayerMode = null;
			this._savedPlayerSpeed = null;

			this._dealWithStreamPlayedOrPausedByMw = function () {
				me._newSpeedIDX = 0;
				me._speedChangeCallback();
			};

			// default call backs for UI updates
			this._playerPlayingCallback = function () {
				log("_playerPlayingCallback", "start and end", Log.LOG_DEBUG);
				me._dealWithStreamPlayedOrPausedByMw();
			};

			this._playerAtBeginningCallback = function () {
				log("_playerAtBeginningCallback", "start and end", Log.LOG_DEBUG);
				me._dealWithStreamPlayedOrPausedByMw();
			};

			this._playerAtEndCallback = function () {
				log("_playerAtEndCallback", "start and end", Log.LOG_DEBUG);
				me._dealWithStreamPlayedOrPausedByMw();
			};

			this._playerCaughtUptoLiveCallBack = function () {
				log("_playerCaughtUptoLiveCallBack", "start and end", Log.LOG_DEBUG);
				me._dealWithStreamPlayedOrPausedByMw();
			};

			this._uiRefreshCallback = function (mode, speed) {
			};

			this._positionChangeFailedCallback = function () {
			};

			this._positionChangeCallback = function () {
			};

			this._speedChangeFailedCallback = function () {
				log("_speedChangeFailedCallback", "Enter - onSpeedChanged has FAILED");
				me._isAwaitingSpeedChangeEvent = false;
				// call _uiRefreshCallback with the saved state
				if (me._savedPlayerSpeed !== me._player.speed) {
					me._setSpeed(me._savedPlayerSpeed);
					me._uiRefreshCallback(me._savedPlayerMode, me._savedPlayerSpeed);
				}
				log("_speedChangeFailedCallback", "Exit");
			};

			this._speedChangeCallback = function () {
				log("_speedChangeCallback", "Enter - onSpeedChanged has SUCCEEDED");
				me._isAwaitingSpeedChangeEvent = false;
				me._uiRefreshCallback(me.getTrickPlayMode(), me._player.speed);
				me._speedIDX = me._newSpeedIDX;
				log("_speedChangeCallback", "Exit");
			};

			if (player) {
				this.setPlayer(player);
			}
		};

		/**
		 * A set of constants used to denote the current state to
		 * report back to the UI. One of:
		 * `PLAY`, `PAUSE`, `FF` or `RW`
		 * @property {String} MODES
		 * @readonly
		 */
		TrickPlay.MODES = {
			PLAY : "play",
			PAUSE : "pause",
			FF : "ff",
			RW : "rew"
		};

		var proto = TrickPlay.prototype;

		/**
		 * Set the player object that is being used for video playback
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
			var me = this;
			this._playerPlayingCallback = function () {
				log("_playerPlayingCallback", "start and end", Log.LOG_DEBUG);
				me._dealWithStreamPlayedOrPausedByMw();
				callback();
			};
		};

		/**
		 * Overrides the behaviour for when the player reaches the start of the content.
		 * The default player behaviour is to start playing.
		 * @method setPlayerAtBeginningCallback
		 * @param {Function} callback
		 */
		proto.setPlayerAtBeginningCallback = function (callback) {
			var me = this;
			this._playerAtBeginningCallback = function () {
				log("_playerAtBeginningCallback", "start and end", Log.LOG_DEBUG);
				me._dealWithStreamPlayedOrPausedByMw();
				callback();
			};
		};

		/**
		 * Overrides the behaviour for when the player reaches the end of the content.
		 * The default behaviour is to pause the player.
		 * @method setPlayerAtEndCallback
		 * @param {Function} callback
		 */
		proto.setPlayerAtEndCallback = function (callback) {
			var me = this;
			this._playerAtEndCallback  = function () {
				log("_playerAtEndCallback", "start and end", Log.LOG_DEBUG);
				me._dealWithStreamPlayedOrPausedByMw();
				callback();
			};
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
		 * Sets the callback function to be executed upon receiving a positionChangeFailed event.
		 * @method setPositionChangeFailedCallback
		 * @param {Function} callback
		 */
		proto.setPositionChangeFailedCallback = function (callback) {
			this._positionChangeFailedCallback = callback;
		};

		/**
		 * Sets the callback function to be executed when the playback position changes.
		 * @method setPositionChangeCallback
		 * @param {Function} callback
		 */
		proto.setPositionChangeCallback = function (callback) {
			this._positionChangeCallback = callback;
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
		 * @method setspeedMultipliers
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
			this._defaultSkipTimeInSeconds = timeSeconds;
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
		 * Saves the current player mode and speed. This will be used in case a player speed change
		 * request fails.
		 * @method _saveCurrentPlayerState
		 * @private
		 */
		proto._saveCurrentPlayerState = function () {
			log("_saveCurrentPlayerState", "Enter");
			this._savedPlayerMode = this.getTrickPlayMode();
			this._savedPlayerSpeed = this.getSpeed();
			log("_saveCurrentPlayerState", "Exit");
		};

		/**
		 * Registers relevant listeners to allow the UI callbacks to be executed.
		 * @method registerEventListeners
		 */
		proto.registerEventListeners = function () {
			this._player.addEventListener("onPlayStarted", this._playerPlayingCallback, false);
			this._player.addEventListener("onBuffering", this._bufferingListener, false);
			this._player.addEventListener("onEoc", this._playerAtEndCallback, false);
			this._player.addEventListener("onBoc", this._playerAtBeginningCallback, false);
			this._player.addEventListener("onCaughtUptoLive", this._playerCaughtUptoLiveCallBack, false);
			this._player.addEventListener("onPositionChangeFailed", this._positionChangeFailedCallback, false);
			this._player.addEventListener("onPositionChange", this._positionChangeCallback, false);
			this._player.addEventListener("onSpeedChangeFailed", this._speedChangeFailedCallback, false);
			this._player.addEventListener("onSpeedChanged", this._speedChangeCallback, false);
		};

		/**
		 * Unregisters the listeners to registered with `registerEventListeners`
		 * @method unRegisterEventListeners
		 */
		proto.unRegisterEventListeners = function () {
			this._player.removeEventListener("onPlayStarted", this._playerPlayingCallback, false);
			this._player.removeEventListener("onBuffering", this._bufferingListener, false);
			this._player.removeEventListener("onEoc", this._playerAtEndCallback, false);
			this._player.removeEventListener("onCaughtUptoLive", this._playerCaughtUptoLiveCallBack, false);
			this._player.removeEventListener("onBoc", this._playerAtBeginningCallback, false);
			this._player.removeEventListener("onPositionChangeFailed", this._positionChangeFailedCallback, false);
			this._player.removeEventListener("onPositionChange", this._positionChangeCallback, false);
			this._player.removeEventListener("onSpeedChangeFailed", this._speedChangeFailedCallback, false);
			this._player.removeEventListener("onSpeedChanged", this._speedChangeCallback, false);
		};

		/**
		 * Toggles the video playback between play and pause
		 * @method playPause
		 * @param {Boolean} dedicated denotes if dedicated play button was pressed (not play / pause)
		 */
		proto.playPause = function (dedicated) {
			log("playPause", "Enter");

			if (this._player.speed === this.PLAY_SPEED ||
					(dedicated && (this._player.speed > this.PAUSE_SPEED || this._player.speed < this.PAUSE_SPEED))) {
					// If play, then pause
				log("playPause", "Playing so calling pause");
				this.pause();
			} else {
				// if we're rewinding, paused etc, then resume play at normal playing speed
				log("playPause", "Paused so calling play");
				this.play();
			}
			log("playPause", "Exit");
		};

		proto._setSpeed = function (speed) {
			log("_setSpeed", "Enter - speed = " + speed);
			this._isAwaitingSpeedChangeEvent = true;
			this._player.setSpeed(speed);
			log("_setSpeed", "Exit ");
		};

		/**
		 * Pauses the video playback and calls the function registered by `setUIRefreshCallback`
		 * @method pause
		 */
		proto.pause = function () {
			log("pause", "Enter");
			this._newSpeedIDX = 0;
			if (this._player.speed !== this.PAUSE_SPEED) {
		        this._setSpeed(this.PAUSE_SPEED);
		    }
			log("pause", "Exit");
		};

		/**
		 * Changes the player to play mode.
		 * @method play
		 */
		proto.play = function () {
			log("play", "Enter, this._player.speed = " + this._player.speed);
			this._newSpeedIDX = 0;
			if (this._player.speed !== this.PLAY_SPEED) {
		        this._setSpeed(this.PLAY_SPEED);
		    }
			log("play", "Exit");
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
			this._newSpeedIDX = this._speedIDX;

			if (!this._allowSpeedCycle && (this._speedIDX >= this._SPEED_MULTIPLIERS.length)) {
				return;
			}
			// save the current speed and mode
			this._saveCurrentPlayerState();
			// check if we need to start at the slowest speed;
			if ((this._player.speed > this.PAUSE_SPEED) ||
					(this._speedIDX >= this._SPEED_MULTIPLIERS.length)) {
				this._newSpeedIDX = 0;
			}
			// get the speed, make it negative
			this._newSpeedIDX++;
			this._setSpeed(-this._SPEED_MULTIPLIERS[this._newSpeedIDX - 1]);
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
			this._newSpeedIDX = this._speedIDX;

			if (!this._allowSpeedCycle && (this._speedIDX >= this._SPEED_MULTIPLIERS.length)) {
				return;
			}

			// check if we need to start at the slowest speed;
			if ((this._player.speed < this.PAUSE_SPEED) ||
					(this._speedIDX >= this._SPEED_MULTIPLIERS.length)) {
				this._newSpeedIDX = 0;
			}
			// save the current speed and mode
			this._saveCurrentPlayerState();
			// get the speed.
			this._newSpeedIDX++;
			this._setSpeed(this._SPEED_MULTIPLIERS[this._newSpeedIDX - 1]);
			log("fastForward", "Exit");
		};

		/**
		 * Slow fast-forward will slow down the fast-forward speed or if in rewind mode will speed up the rewind speed
		 * It is called from the keyHandler when rewind key is pressed and it is not in direct mode
		 * @method slowFastForward
		 */
		proto.slowFastForward = function () {
			log("slowFastForward", "Enter");
			this._newSpeedIDX = this._speedIDX;

			if (!this._allowSpeedCycle &&
					(this._speedIDX >= this._SPEED_MULTIPLIERS.length) &&
					(this._player.speed < this.PAUSE_SPEED)) {
				return;
			}
			// save the current speed and mode
			this._saveCurrentPlayerState();
			// check if we are in ff mode
			if ((this._player.speed > this.PLAY_SPEED)) {
				if (this._speedIDX === 1) {
					this._setSpeed(this.PLAY_SPEED);
					this._newSpeedIDX = 0;
				} else {
					this._newSpeedIDX--;
					this._setSpeed(this._SPEED_MULTIPLIERS[this._newSpeedIDX - 1]);
				}
			} else {
				if (this._speedIDX >= this._SPEED_MULTIPLIERS.length) {
					this._newSpeedIDX = 0;
				}
				// get the playspeed
				this._newSpeedIDX++;
				this._setSpeed(-this._SPEED_MULTIPLIERS[this._newSpeedIDX - 1]);
			}
			log("slowFastForward", "Exit");
		};

		/**
		 * Slow rewind will slow down the rewind speed or if in ff mode will speed up the fast ff speed
		 * It is called from the keyHandler when fast-forward key is pressed and it is not in direct mode
		 * @method slowRewind
		 */
		proto.slowRewind = function () {
			log("slowRewind", "Enter");
			this._newSpeedIDX = this._speedIDX;

			if (!this._allowSpeedCycle &&
					(this._speedIDX >= this._SPEED_MULTIPLIERS.length) &&
					(this._player.speed > this.PLAY_SPEED)) {
				return;
			}
			// save the current speed and mode
			this._saveCurrentPlayerState();
			// check if we are in rewind mode
			if ((this._player.speed < this.PAUSE_SPEED)) {
				if (this._speedIDX === 1) {
					this._setSpeed(this.PLAY_SPEED);
					this._newSpeedIDX = 0;
				} else {
					this._newSpeedIDX--;
					this._setSpeed(-this._SPEED_MULTIPLIERS[this._newSpeedIDX - 1]);
				}
			} else {
				if (this._speedIDX >= this._SPEED_MULTIPLIERS.length) {
					this._newSpeedIDX = 0;
				}
				// get the playspeed
				this._newSpeedIDX++;
				this._setSpeed(this._SPEED_MULTIPLIERS[this._newSpeedIDX - 1]);
			}
			log("slowRewind", "Exit");
		};

		/**
		 * Updates the current playback position to be +/- the given seconds.
		 * If playback position to be set is less than 0, then position is set to 0.
		 * Will not set the playback position if it is to be set past the content length
		 * @method skip
		 * @param {Number} timeSeconds negative is skip back
		 */
		proto.skip = function (timeSeconds) {
			log("skip ", "Enter - timeSeconds = " + timeSeconds);
			var skipPosition = parseInt(timeSeconds, 10) * 1000 + this._player.position;
			var positionCommand = {
				whence: this._player.SEEK_SET,
				type: this._player.POSITION_TYPE_TIME_BASED,
				timePosition: skipPosition
			};
			this.play();
			this._player.setPosition(positionCommand);
			log("skip ", "Exit");
		};

		/**
		 * Returns the current playback mode depending on the speed of the player
		 * @method getTrickPlayMode
		 * @return {String} string representation of the current trickplay mode
		 */
		proto.getTrickPlayMode = function () {
			log("getTrickPlayMode", "this._player.speed = " + (this._player.speed ? String(this._player.speed) : "[not set]"));

			if (this._player.speed < 0) {
				return TrickPlay.MODES.RW;
			} else if (this._player.speed === this.PAUSE_SPEED) {
				return TrickPlay.MODES.PAUSE;
			} else if (this._player.speed > this.PLAY_SPEED) {
				return TrickPlay.MODES.FF;
			} else {
				return TrickPlay.MODES.PLAY;
			}
		};

		/**
		 * Returns the current playback speed
		 * @method getSpeed
		 * @return {Number} the current trickplay speed, with 100 being play, -200 being rw at 2x etc.
		 */
		proto.getSpeed = function () {
			return this._player.speed;
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
		 * A convenience method that can be called to avoid having to redefine
		 * the default key handling behaviour for trick play.
		 * @method keyHandler
		 * @param {String} key a string representation of the pressed key
		 * @return {Boolean} True if key was handled, false if not
		 */
		proto.keyHandler = function (key) {
			log("keyHandler", "Enter - key = " + key);

			var handled = true;
			var keys = $N.apps.core.KeyInterceptor.getKeyMap();
			if (this._isAwaitingSpeedChangeEvent) {
				return true;
			}
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
				this.skip(this._defaultSkipTimeInSeconds);
				break;
			case keys.KEY_SKIP_REW:
				this.skip(-this._defaultSkipTimeInSeconds);
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
		$N.platform.output.TrickPlay = TrickPlay;
		return TrickPlay;
	}
);
