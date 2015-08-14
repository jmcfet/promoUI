/**
 * TrickPlay contains the methods that control the Player's
 * playback speed. This allows for the following functionality:
 *
 * - Play/Pause
 * - Stop
 *
 * It registers listeners that listen out for the following events within the Player:
 *
 * - `PlayerPlaying`
 * - `PlayerAtEnd`
 *
 * Callbacks are used so that the application that calls the TrickPlay class can update
 * its GUI accordingly.
 * @class $N.platform.output.TrickPlay
 * @author gstacey
 *
 * @requires $N.apps.core.Log
 * @requires $N.apps.core.KeyInterceptor
 * @constructor
 * @param {Object} player the player object that this trickPlayHelper is
 * associated with and listening to events for.
 */

define('jsfw/platform/output/TrickPlay',
     [
    	'jsfw/apps/core/Log',
    	'jsfw/apps/core/KeyInterceptor'
    ],
	function (Log, KeyInterceptor) {

		var log = new $N.apps.core.Log("output", "Trickplay");

		function TrickPlay(player) {

			var me = this;

			this.PLAY_SPEED = 100;
			this.PAUSE_SPEED = 0;
			this._player = null;
			this._defaultSkipTime = 30; //30 seconds
			this._playRate = 0;

			// call backs for UI updates
			this._playerPlayingCallback = function () {
				me.play();
			};
			this._playerAtBeginningCallback = function () {
				me.play();
			};
			this._playerAtEndCallback = function () {
			};
			this._uiRefreshCallback = function (mode, speed) {
			};

			if (player) {
				this.setPlayer(player);
			}
		}

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
		 * easy abstraction
		 * @method _getPlayRate
		 * @private
		 */
		proto._getPlayRate = function () {
			return this._playRate * 100;
		};

		/**
		 * easy abstraction
		 * @method _setPlayRate
		 * @private
		 */
		proto._setPlayRate = function (rate) {
			if (rate === 0) {
				this._playRate = 0;
				this._player.pause();
			} else if (rate === 100) {
				this._playRate = 1;
				this._player.play();
			}
		};

		/**
		 * Set the player object that is being used for video playback
		 * @method setPlayer
		 * @param {Object} player
		 */
		proto.setPlayer = function (player) {
			if (this._player) {
				this.unRegisterEventListeners();
			}
			this._player = player;
			this.registerEventListeners();
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
		 * Sets the callback function to be executed upon receiving a positionChangeFailed event.
		 * The positionChangeFailed event is not currently supported
		 * @method setPositionChangeFailedCallback
		 * @param {Function} callback
		 */
		proto.setPositionChangeFailedCallback = function (callback) {
		};

		/**
		 * Sets the callback function to be executed when the playback position changes.
		 *
		 * The positionChange event is not currently supported
		 * @method setPositionChangeCallback
		 * @param {Function} callback
		 */
		proto.setPositionChangeCallback = function (callback) {
		};

		/**
		 * Sets whether fast-forward and rewind functionality should allow the various
		 * speeds to cycle. If true, and fast-forward / rewind is on the maximum speed, the
		 * playrate will cycle back to the lowest. If false, subsequent presses of
		 * the fast-forward / rewind keys when on maximum speed will have no effect.
		 *
		 * FF AND REW NOT SUPPORTED BY NMPPC PLAYER
		 * @method setAllowSpeedCycle
		 * @param {Boolean} allow
		 */
		proto.setAllowSpeedCycle = function (allow) {
			log("setAllowSpeedCycle", "Fast-Forward and Rewind not supported");
		};

		/**
		 * Sets the trickplay speeds to be used for fast-forward and rewind. If not set, the default
		 * is 400, 800, 1600 and 3200 which corresponds to 4x, 8x, 16x and 32x.
		 *
		 * FF AND REW NOT SUPPORTED BY NMPPC PLAYER
		 * @method setPlayRateMultipliers
		 * @param {Array} mutliplierArray
		 */
		proto.setPlayRateMultipliers = function (mutliplierArray) {
			log("setPlayRateMultipliers", "Fast-Forward and Rewind not supported");
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
		 * Registers relevant listeners to allow the UI callbacks to be executed.
		 * @method registerEventListeners
		 */
		proto.registerEventListeners = function () {
			this._player.addEventListener("playing", this._playerPlayingCallback, false);
			this._player.addEventListener("ended", this._playerAtEndCallback, false);
			//this._player.addEventListener("PlayerReachedBeginning", this._playerAtBeginningCallback, false); //TODO:
		};

		/**
		 * Unregisters the listeners to registered with `registerEventListeners`
		 * @method unRegisterEventListeners
		 */
		proto.unRegisterEventListeners = function () {
			this._player.removeEventListener("playing", this._playerPlayingCallback, false);
			this._player.removeEventListener("ended", this._playerAtEndCallback, false);
			//this._player.removeEventListener("PlayerReachedBeginning", this._playerAtBeginningCallback, false);
		};

		/**
		 * Toggles the video playback between play and pause
		 * @method playPause
		 * @param {Boolean} dedicated denotes if dedicated play button was pressed (not play / pause)
		 */
		proto.playPause = function (dedicated) {
			log("playPause", "Enter");
			if (this._getPlayRate() === this.PLAY_SPEED ||
					(dedicated && (this._getPlayRate() > this.PAUSE_SPEED))) {
					// If play, then pause
				log("playPause", "Playing so calling pause");
				this.pause();
			} else {
				// if we're rewinding, paused etc, then resume play at normal playing speed
				log("playPause", "Not paused so calling play");
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
			if (this._getPlayRate() !== this.PAUSE_SPEED) {
				this._setPlayRate(this.PAUSE_SPEED);
			}
			this._uiRefreshCallback(TrickPlay.MODES.PAUSE, this._getPlayRate());
			log("pause", "Exit");
		};

		/**
		 * Changes the player to play mode.
		 * @method play
		 */
		proto.play = function () {
			log("play", "Enter");
			if (this._getPlayRate() !== this.PLAY_SPEED) {
				this._setPlayRate(this.PLAY_SPEED);
			}
			this._uiRefreshCallback(TrickPlay.MODES.PLAY, this.PLAY_SPEED);
			log("play", "Exit");
		};

		/**
		 * Rewinds the content currently playing. Successive calls increase the rate at which the
		 * player rewinds. If `setAllowSpeedCycle` was called with `true` and the max. rewind speed
		 * is reached, calling this function sets the play rate to the minimum rewind speed. If false, the
		 * rewind speed will remain at the top speed.
		 *
		 * FF AND REW NOT SUPPORTED BY NMPPC PLAYER
		 * @method rewind
		 */
		proto.rewind = function () {
			log("rewind", "Rewind not supported");
		};

		/**
		 * Fast-forwards the content currently playing. Successive calls increase the rate at which the
		 * player fast-forwards. If `setAllowSpeedCycle` was called with `true` and the max. fast-forward speed
		 * is reached, calling this function sets the play rate to the minimum fast-forward speed. If false, the
		 * fast-forward speed will remain at the top speed.
		 *
		 * FF AND REW NOT SUPPORTED BY NMPPC PLAYER
		 * @method fastForward
		 */
		proto.fastForward = function () {
			log("fastForward", "Fast-Forward not supported");
		};

		/**
		 * Slow fast-forward will slow down the fast-forward speed if we are
		 * currently in a ff mode.  In the slowest mode it will revert to play mode
		 * FF AND REW NOT SUPPORTED BY NMPPC PLAYER
		 * @method slowFastForward
		 */
		proto.slowFastForward = function () {
			log("slowFastForward", "Fast-Forward and Rewind not supported");
		};

		/**
		 * Slow rewind will slow down the rewind speed if we are
		 * currently in a rew mode. In the slowest mode it will revert to play mode
		 * FF AND REW NOT SUPPORTED BY NMPPC PLAYER
		 * @method slowRewind
		 */
		proto.slowRewind = function () {
			log("slowRewind", "Fast-Forward and Rewind not supported");
		};

		/**
		 * Updates the current playback position to be +/- the given seconds.
		 * If playback position to be set is less than 0, then position is set to 0.
		 * Will not set the playback position if it is to be set past the content length
		 * @method skip
		 * @param {Number} timeSeconds negative is skip back
		 */
		proto.skip = function (timeSeconds) {
			var playbackPosition;
			timeSeconds = parseInt(timeSeconds, 10);
			this.play();
			playbackPosition = parseInt(this._player.currentTime, 10) + timeSeconds;
			if (playbackPosition < 0) {
				playbackPosition = 0;
			}
			if (playbackPosition < this._player.duration) {
				this._player.currentTime = playbackPosition;
			}
		};

		/**
		 * Returns the current playback mode depending on the playrate of the player
		 * @method getTrickPlayMode
		 * @return {String} string representation of the current trickplay mode
		 */
		proto.getTrickPlayMode = function () {
			if (this._getPlayRate() === this.PAUSE_SPEED) {
				return TrickPlay.MODES.PAUSE;
			} else {
				return TrickPlay.MODES.PLAY;
			}
		};

		/**
		 * Sets the direct mode flag. When direct mode is true, pressing rewind while in
		 * fast-forward will slow down the fast-forward speed and vice versa.
		 *
		 * FF AND REW NOT SUPPORTED BY NMPPC PLAYER
		 * @method setDirectMode
		 * @param {Boolean} flag
		 */
		proto.setDirectMode = function (flag) {
			log("setDirectMode", "Fast-Forward and Rewind not supported");
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

			var handled = true;
			var keys = $N.apps.core.KeyInterceptor.getKeyMap();
			switch (key) {
			case keys.KEY_PLAY:
			case keys.KEY_PLAY_PAUSE:
				this.playPause();
				break;
			case keys.KEY_PAUSE:
				this.playPause(true);
				break;
			case keys.KEY_REW:
				log("keyHandler", "Rewind not supported");
				break;
			case keys.KEY_FFW:
				log("keyHandler", "Fast-Forward not supported");
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
		$N.platform.output.TrickPlay = TrickPlay;
		return TrickPlay;
	}
);
