/**
 * A wrapper class to maintain the components required for video playback
 * including, tuner, tracks and trick play.
 * @class $N.platform.output.VideoPlayer
 *
 * @author dthomas
 * @constructor
 * @param {Object} videoTag [optional] The video element in the HTML/SVG page
 */

define('jsfw/platform/output/VideoPlayer',
	[
		'jsfw/apps/core/Log',
		'jsfw/platform/output/Tuner',
		'jsfw/platform/output/TrickPlay',
		'jsfw/platform/output/SeekTrickPlay',
		'jsfw/platform/output/Tracks',
		'jsfw/apps/util/Util'
	],
	function (Log, Tuner, TrickPlay, SeekTrickPlay, Tracks, Util) {

		var log = new $N.apps.core.Log("output", "VideoPlayer");
		var instanceCount = 0;

		function VideoPlayer(videoTag) {
			var me = this;

			this._playerObj = videoTag || null;

			this._playerPlayingListeners = [];
			this._playerBufferingListeners = [];
			this._lostResourcesListeners = [];

			// get player instance
			var playerManager = CCOM.PlayerManager,
				priority = instanceCount === 0 ? playerManager.INSTANCE_PRIORITY_HIGH : playerManager.INSTANCE_PRIORITY_LOW,
				enableReviewBuffer = instanceCount === 0 ? true : false,
				audioStatus = instanceCount === 0 ? playerManager.AUD_OUT_VAL_TRUE : playerManager.AUD_OUT_VAL_FALSE,
				instanceResult = playerManager.getInstance({destUri: "display://" + instanceCount, priority: priority});

			if (instanceResult.instance) {
				this._player = instanceResult.instance;
				log("constructor", "Player instance obtained from PlayerManager.", Log.LOG_INFO);

				playerManager.setReviewBufferState(this._player.instanceHandle, enableReviewBuffer);
				playerManager.setAudioStatus(this._player.instanceHandle, audioStatus);
				if (this._player.videoLayerProperties) {
					// NINJA-1753: VideoPlayer configuration issue causes timeshift pause to flash (this line of code has been reworked)
					this._player.setVideoLayerDetails({
						zorder: (instanceCount === 0 ? this._player.VIDEO_LAYER_ZORDER_TOP : this._player.VIDEO_LAYER_ZORDER_BOTTOM),
						opacity: 1.0
					});
				}
			} else {
				this._player = null;
				log("constructor", "Failed to get player instance!", Log.LOG_ERROR);
			}
			instanceCount++;

			/**
			 * The tuner instance
			 * @property {Object} tuner
			 */
			this.tuner = new $N.platform.output.Tuner(this._player);
			/**
			 * The trickPlay instance
			 * @property {Object} trickPlay
			 */
			this.trickPlay = new $N.platform.output.TrickPlay(this._player);
			/**
			 * The seekTrickPlay instance
			 * @property {Object} seekTrickPlay
			 */
			this.seekTrickPlay = new $N.platform.output.SeekTrickPlay(this._player);
			/**
			 * The tracks instance
			 * @property {Object} tracks
			 */
			this.tracks = new $N.platform.output.Tracks(this._player);

			this.setTrickPlayDirectMode(true);

			// register internal listeners
			this._player.addEventListener("onPlayStarted", function (e) {me._playStartedListener(e); });
			this._player.addEventListener("onBuffering", function (e) {me._bufferingListener(e); });
			this._player.addEventListener("onPlayError", function (e) {me._playErrorListener(e); });
		}

		var proto = VideoPlayer.prototype;

		/**
		 * Returns an object containing playerInstance and playerObj properties.
		 * The playerInstance is the instance of the player returned by the MW which can be used to make
		 * subsequent calls to MW to change things such as audio and opacity properties.
		 * The playerObj is the video tag that is passed into the VideoPlayer constructor. This can be used
		 * to change the positioning and size of the player
		 * @method getPlayerInstanceObj
		 * @return {Object} playerObj consisting of playerInstance and playerObj properties
		 */
		proto.getPlayerInstanceObj = function () {
			return {
				playerInstance: this._player,
				playerObj: this._playerObj || null
			};
		};

		/**
		 * Adds a listener to the supplied listener cache, if not already present.
		 * @method _addListener
		 * @private
		 * @param {Object} cache An array of functions representing the listeners
		 * @param {Object} listener A function which represents the listener
		 */
		proto._addListener = function (cache, listener) {
			if ($N.apps.util.Util.arrayContains(cache, listener)) {
				log("_addListener", "Listener already registered.", Log.LOG_WARN);
			} else {
				cache.push(listener);
			}
		};

		/**
		 * Removes a listener from the supplied listener cache.
		 * @method _removeListener
		 * @private
		 * @param {Object} cache An array of functions representing the listeners
		 * @param {Object} listener A function which represents the listener
		 */
		proto._removeListener = function (cache, listener) {
			var i, end = cache.length;
			for (i = 0; i < end; i++) {
				if (cache[i] === listener) {
					log("_removeListener", "listener removed", Log.LOG_DEBUG);
					cache.splice(i, 1);
					break;
				}
			}
		};

		/**
		 * Calls all listeners in the supplier array of listener functions.
		 * @method _callListeners
		 * @private
		 * @param {Object} listeners An array of functions representing the listeners
		 */
		proto._callListeners = function (listeners) {
			log("_callListeners", "start", Log.LOG_DEBUG);
			var i, end = listeners.length;
			for (i = 0; i < end; i++) {
				listeners[i]();
			}
		};

		/**
		 * Listens for buffering event and fires either buffering callback
		 * or player playing call back depending no whether the buffering
		 * has finished.
		 * @method _bufferingListener
		 * @private
		 * @param {Function} listener
		 */
		proto._bufferingListener = function (e) {
			log("_playerBufferingListeners", "start");
			if (e.bufferingInfo.percentBuffered < 100) {
				this._callListeners(this._playerBufferingListeners);
			} else {
				this._callListeners(this._playerPlayingListeners);
			}
		};

		/**
		 * Listens for playing event and calls the play playing callback.
		 * @method _playStartedListener
		 * @private
		 * @param {Function} listener
		 */
		proto._playStartedListener = function (e) {
			log("_playStartedListener", "enter");
			this._callListeners(this._playerPlayingListeners);
		};

		/**
		 * Called upon the onPlayError event being fired
		 * @method _playErrorListener
		 * @private
		 * @param {Object} e The event object that is returned
		 */
		proto._playErrorListener = function (e) {
			log("_playErrorListener", "enter");
			if (e.contentErrorInfo.reason === this._player.CONTENT_ERROR_REASON_RESOURCES_LOST) {
				this._callListeners(this._lostResourcesListeners);
			}
		};

		//PUBLIC API

		/**
		 * Returns the CCOM player object used for video playback by this video player.
		 * @method getPlayer
		 * @return {Object}
		 */
		proto.getPlayer = function () {
			return this._player;
		};

		/**
		 * Returns the current source URI of the player.
		 * @method getSource
		 * @return {String} URI of the active source
		 */
		proto.getSource = function () {
			return this.tuner.getCurrentUri();
		};

		/**
		 * Returns the position (in seconds) that the player is currently at in the stream.
		 * Use `getReviewBufferPlaybackPosition` or `getReviewBufferInfo` for review buffer
		 * @method getPlaybackPosition
		 * @return {Number} seconds
		 */
		proto.getPlaybackPosition = function () {
			log("getPlaybackPosition", "enter");
			return this._player.position / 1000;
		};

		/**
		 * Returns an object consisting of start time, end time and current time for the player buffer.
		 * The values of each property are real time values in milliseconds
		 * @method getReviewBufferInfo
		 * @return {Object} Contains startPosition, endPosition, currentPosition, and contentLength properties
		 */
		proto.getReviewBufferInfo = function () {
			log("getReviewBufferInfo", "enter");
			var realTimePosition = this._player.realTimePosition,
				contentLength;
			if (realTimePosition) {
				contentLength = (realTimePosition.endPosition - realTimePosition.startPosition) * 1000;
				return {
					startPosition: realTimePosition.startPosition * 1000,
					endPosition: realTimePosition.endPosition * 1000,
					currentPosition: realTimePosition.currentPosition * 1000,
					contentLength: contentLength
				};
			} else {
				return {
					startPosition: 0,
					endPosition: 0,
					currentPosition: 0,
					contentLength: 0
				};
			}
		};

		/**
		 * Returns a real time value for the starting time of the review buffer
		 * @method getReviewBufferStartTime
		 * @return {Number} The starting time of the review buffer
		 */
		proto.getReviewBufferStartTime = function () {
			log("getReviewBufferStartTime", "enter");
			return this._player.realTimePosition && this._player.realTimePosition.startPosition ? this._player.realTimePosition.startPosition * 1000 : 0;
		};

		/**
		 * Returns a real time value for the ending time of the review buffer
		 * @method getReviewBufferEndTime
		 * @return {Number} The ending time of the review buffer
		 */
		proto.getReviewBufferEndTime = function () {
			log("getReviewBufferEndTime", "enter");
			return this._player.realTimePosition && this._player.realTimePosition.endPosition ? this._player.realTimePosition.endPosition * 1000 : 0;
		};

		/**
		 * Returns a real time value for the current playback position of the review buffer
		 * @method getReviewBufferPlaybackPosition
		 * @return {Number} The current playback position of the review buffer
		 */
		proto.getReviewBufferPlaybackPosition = function () {
			log("getReviewBufferPlaybackPosition", "enter");
			return this._player.realTimePosition && this._player.realTimePosition.currentPosition ? this.getReviewBufferStartTime() + (this._player.realTimePosition.currentPosition * 1000) : 0;
		};

		/**
		 * Sets the position of playback in seconds for the
		 * current stream
		 * @method setPlaybackPosition
		 * @param {Number} position in seconds
		 */
		proto.setPlaybackPosition = function (position) {
			log("setPlaybackPosition", "enter");
			var timeMilliSeconds = position * 1000;
			var positionCommand = {
				whence: this._player.SEEK_SET,
				type: this._player.POSITION_TYPE_TIME_BASED,
				timePosition: timeMilliSeconds
			};
			this._player.setPosition(positionCommand);
		};

		/**
		 * Returns the content length (in seconds) of the current stream.
		 * Use `getReviewBufferInfo` to find the review buffer length.
		 * @method getContentLength
		 * @return {Number} seconds
		 */
		proto.getContentLength = function () {
			log("getContentLength", "enter");
			return this._player.duration / 1000;
		};

		/**
		 * Returns the current stream for the player
		 * @method getCurrentStream
		 * @return {Object} The stream object
		 */
		proto.getCurrentStream = function () {
			log("getCurrentStream", "enter");
			var stream = {};
			stream.uri = this._player.sourceUri;
			stream.pids = this._player.availableStreams;
			stream.pidsAvailable = stream.pids ? true : false;
			return stream;
		};

		/**
		 * Registers the given function to be called when the player has
		 * connected to the steam
		 * @method registerPlayerConnectedListener
		 * @param {Function} listener
		 */
		proto.registerPlayerConnectedListener = function (listener) {
			log("registerPlayerConnectedListener", "start and end");
			this._player.addEventListener("onStreamStarted", listener);
		};

		/**
		 * Registers the given function to be called when the player has
		 * failed to connect to a stream
		 * @method registerPlayerConnectFailedListener
		 * @param {Function} listener
		 */
		proto.registerPlayerConnectFailedListener = function (listener) {
			log("registerPlayerConnectFailedListener", "start and end");
			this._player.addEventListener("onPlayStartFailed", listener);
		};

		/**
		 * Registers the given function to be called when the new content
		 * has started playing.
		 * @method registerPlayerPlayingListener
		 * @param {Function} listener
		 */
		proto.registerPlayerPlayingListener = function (listener) {
			log("registerPlayerPlayingListener", "start and end");
			this._addListener(this._playerPlayingListeners, listener);
		};

		/**
		 * Registers the given function to be called if the player fails
		 * to play the stream
		 * @method registerPlayerPlayFailedListener
		 * @param {Function} listener
		 */
		proto.registerPlayerPlayFailedListener = function (listener) {
			log("registerPlayerPlayFailedListener", "start and end");
			this._player.addEventListener("onPlayError", listener);
		};

		/**
		 * Registers the given function to be called when the content is being
		 * buffered.
		 * @method registerPlayerBufferingListener
		 * @param {Function} listener
		 */
		proto.registerPlayerBufferingListener = function (listener) {
			log("registerPlayerBufferingListener", "start and end");
			this._addListener(this._playerBufferingListeners, listener);
		};

		/**
		 * Registers the given function to be called when the end of the content has been reached.
		 * @method registerPlayerReachedEndListener
		 * @param {Function} listener
		 */
		proto.registerPlayerReachedEndListener = function (listener) {
			log("registerPlayerReachedEndListener", "start and end");
			this._player.addEventListener("onEoc", listener);
		};

		/**
		 * Registers the given function to be called when the player reaches the
		 * beginning of the content.
		 * @method registerPlayerReachedStartListener
		 * @param {Function} listener
		 */
		proto.registerPlayerReachedStartListener = function (listener) {
			log("registerPlayerReachedStartListener", "start and end", Log.LOG_DEBUG);
			this._player.addEventListener("onBoc", listener);
		};

		/**
		 * Registers the given function to be called when the player has rejoined
		 * the live content
		 * @method registerCaughtUptoLiveListener
		 * @param {Function} listener
		 */
		proto.registerCaughtUptoLiveListener = function (listener) {
			log("registerCaughtUptoLiveListener", "start and end");
			this._player.addEventListener("onCaughtUptoLive", listener);
		};

		/**
		 * Registers the given function from being fired when the currently
		 * playing the live content fails
		 * @method registerSignalLoss
		 * @param {Function} listener
		 */
		proto.registerSignalLoss = function (listener) {
			log("registerSignalLoss", "start and end");
			this._player.addEventListener("onSignalLoss", listener);
		};

		/**
		 * Registers the given function to be called when the player position
		 * passes from one event boundary to another
		 * @method registerEventBoundaryChangedListener
		 * @param {Function} listener
		 */
		proto.registerEventBoundaryChangedListener = function (listener) {
			log("registerEventBoundaryChangedListener", "start and end");
			this._player.addEventListener("onEventBoundaryChanged", listener);
		};

		/**
		 * Unregisters the given function to not fire when a new stream has been started.
		 * @method unregisterPlayerConnectedListener
		 * @param {Function} listener
		 */
		proto.unregisterPlayerConnectedListener = function (listener) {
			this._player.removeEventListener("onStreamStarted", listener);
		};

		/**
		 * Unregisters the given function to not fire when there is a
		 * failure connecting to the requested stream.
		 * @method unregisterPlayerConnectFailedListener
		 * @param {Function} listener
		 */
		proto.unregisterPlayerConnectFailedListener = function (listener) {
			this._player.removeEventListener("onPlayStartFailed", listener);
		};

		/**
		 * Unregisters the given function to not fire when the new content
		 * has started playing.
		 * @method unregisterPlayerPlayingListener
		 * @param {Function} listener
		 */
		proto.unregisterPlayerPlayingListener = function (listener) {
			this._removeListener(this._playerPlayingListeners, listener);
		};

		/**
		 * Unregisters the given function to not fire when the player fails to play
		 * the stream.
		 * @method unregisterPlayerPlayFailedListener
		 * @param {Function} listener
		 */
		proto.unregisterPlayerPlayFailedListener = function (listener) {
			this._player.removeEventListener("onPlayError", listener);
		};

		/**
		 * Unregisters the given function to not fire when the content is being
		 * buffered.
		 * @method unregisterPlayerBufferingListener
		 * @param {Function} listener
		 */
		proto.unregisterPlayerBufferingListener = function (listener) {
			this._removeListener(this._playerBufferingListeners, listener);
		};

		/**
		 * Unregisters the given function from being fired when the end of the content has been reached.
		 * @method unregisterPlayerReachedEndListener
		 * @param {Function} listener
		 */
		proto.unregisterPlayerReachedEndListener = function (listener) {
			this._player.removeEventListener("onEoc", listener);
		};

		/**
		 * Unregisters the given function from being fired when the player reaches the
		 * beginning of the content.
		 * @method unregisterPlayerReachedStartListener
		 * @param {Function} listener
		 */
		proto.unregisterPlayerReachedStartListener = function (listener) {
			this._player.removeEventListener("onBoc", listener);
		};

		/**
		 * Unregisters the given function from being fired when the currently
		 * playing the live content
		 * @method unregisterCaughtUptoLiveListener
		 * @param {Function} listener
		 */
		proto.unregisterCaughtUptoLiveListener = function (listener) {
			this._player.removeEventListener("onCaughtUptoLive", listener);
		};

		/**
		 * Unregisters the given function from being fired when the currently
		 * playing the live content fails
		 * @method unregisterSignalLoss
		 * @param {Function} listener
		 */
		proto.unregisterSignalLoss = function (listener) {
			log("unregisterSignalLoss", "start and end");
			this._player.removeEventListener("onSignalLoss", listener);
		};

		/**
		 * Unregisters the given function to be called when the player position
		 * passes from one event boundary to another
		 * @method unregisterEventBoundaryChangedListener
		 * @param {Function} listener
		 */
		proto.unregisterEventBoundaryChangedListener = function (listener) {
			log("unregisterEventBoundaryChangedListener", "start and end");
			this._player.removeEventListener("onEventBoundaryChanged", listener);
		};

		/**
		 * Registers the given function to be called when there is locker lock info available
		 * @method registerLockerStatusUpdateListener
		 * @param {Function} listener
		 */
		proto.registerLockerStatusUpdateListener = function (listener) {
			log("registerLockerStatusUpdateListener", "start and end");
			this._player.addEventListener("onLockerStatusUpdate", listener);
		};

		/**
		 * Unregisters the given function to not fire when there is locker lock info available
		 * @method unregisterLockerStatusUpdateListener
		 * @param {Function} listener
		 */
		proto.unregisterLockerStatusUpdateListener = function (listener) {
			log("unregisterLockerStatusUpdateListener", "start and end");
			this._player.removeEventListener("onLockerStatusUpdate", listener);
		};

		/**
		 * Registers the given function to be called when the locked player has now been unlocked
		 * @method registerLockerUnlockListener
		 * @param {Function} listener
		 */
		proto.registerLockerUnlockListener = function (listener) {
			log("registerLockerUnlockListener", "start and end");
			this._player.addEventListener("onLockerUnlock", listener);
		};

		/**
		 * Unregisters the given function to not fire when the locked player has now been unlocked
		 * @method unregisterLockerUnlockListener
		 * @param {Function} listener
		 */
		proto.unregisterLockerUnlockListener = function (listener) {
			log("unregisterLockerUnlockListener", "start and end");
			this._player.removeEventListener("onLockerUnlock", listener);
		};

		/**
		 * Registers the given function to be called when the player failed due to lack of resources
		 * @method registerResourcesLostListener
		 * @param {Function} listener
		 */
		proto.registerResourcesLostListener = function (listener) {
			this._addListener(this._lostResourcesListeners, listener);
		};

		/**
		 * Unregisters the given function from being fired when the player failed due to lack of resources
		 * @method unregisterResourcesLostListener
		 * @param {Function} listener
		 */
		proto.unregisterResourcesLostListener = function (listener) {
			this._removeListener(this._lostResourcesListeners, listener);
		};

		/**
		 * Registers the given function to be called when the Stream Disabled due to lack of resources
		 * @method registerStreamDisabledListener
		 * @param {Function} listener
		 */
		proto.registerStreamDisabledListener = function (listener) {
			log("registerLockerUnlockListener", "start and end");
			this._player.addEventListener("onStreamDisabled", listener);
		};

		/**
		 * Unregisters the given function from being fired when the Stream is Disabled due to lack of resources
		 * @method unregisterStreamDisabledListener
		 * @param {Function} listener
		 */
		proto.unregisterStreamDisabledListener = function (listener) {
			log("registerLockerUnlockListener", "start and end");
			this._player.removeEventListener("onStreamDisabled", listener);
		};

		/**
		 * Registers the given function to be called when the Stream is enabled
		 * @method registerStreamEnabledListener
		 * @param {Function} listener
		 */
		proto.registerStreamEnabledListener = function (listener) {
			log("registerStreamEnabledListener ", "start and end");
			this._player.addEventListener("onStreamEnabled", listener);
		};

		/**
		 * Unregisters the given function from being fired when the Stream is enabled
		 * @method unregisterStreamEnabledListener
		 * @param {Function} listener
		 */
		proto.unregisterStreamEnabledListener = function (listener) {
			log("unregisterStreamEnabledListener ", "start and end");
			this._player.removeEventListener("onStreamEnabled", listener);
		};


		/**
		 * Sets the direct mode flag for the trickplay classes.
		 * When direct mode is true, pressing rewind while in fast forward will slow down
		 * the fast forward speed and vice versa
		 * @method setTrickPlayDirectMode
		 * @param {Boolean} flag
		 */
		proto.setTrickPlayDirectMode = function (flag) {
			this.trickPlay.setDirectMode(flag);
			this.seekTrickPlay.setDirectMode(flag);
		};

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.VideoPlayer = VideoPlayer;
		return VideoPlayer;
	}
);
