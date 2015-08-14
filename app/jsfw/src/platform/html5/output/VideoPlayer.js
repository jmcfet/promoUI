/**
 * A wrapper class to maintain the components required for video playback
 * including, tuner, tracks and trick play.
 * @class $N.platform.output.VideoPlayer
 * @constructor
 * @param {Object} [player] reference to a player object. Defaults to the platform's player.
 * @param {Object} [docRef] reference to the DOM document object. Defaults to the current window's document reference.
 * @requires $N.apps.core.Log
 * @requires $N.platform.output.Tuner
 * @requires $N.platform.output.TrickPlay
 * @requires $N.platform.output.SeekTrickPlay
 * @requires $N.platform.output.Tracks
 * @author dthomas
 */

define('jsfw/platform/output/VideoPlayer',
     [
    	'jsfw/apps/core/Log',
    	'jsfw/platform/output/Tuner',
    	'jsfw/platform/output/TrickPlay',
    	'jsfw/platform/output/SeekTrickPlay',
    	'jsfw/platform/output/Tracks'
    ],
	function (Log, Tuner, TrickPlay, SeekTrickPlay, Tracks) {

		var log = new $N.apps.core.Log("output", "VideoPlayer");
		var instanceCount = 0;

		function VideoPlayer(player, docRef) {
			var me = this;
			docRef = docRef || document;
			this._player = player || docRef.getElementsByTagName("video")[instanceCount];
			instanceCount++;

			if (!this._player) {
				//for NMP Plugin
				if (docRef.getElementsByTagName("object")[0]) {
					this._player = docRef.getElementsByTagName("object")[0].mediaElement;
				}
			}

			if (!this._player) {
				log("constructor", "Failed to get player instance!", Log.LOG_ERROR);
			}

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
			this.tracks = new $N.platform.output.Tracks(this._player); //TODO: Tracks HTML abstraction

			this.setTrickPlayDirectMode(true);
		}

		var proto = VideoPlayer.prototype;

		//PUBLIC API

		/**
		 * Returns the platform player object used for video playback by this video player.
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
			return Math.floor(this._player.currentTime);
		};

		/**
		 * Returns an object consisting of start time, end time and current time for the player buffer.
		 * The values of each property are real time values in milliseconds.
		 *
		 * NOT SUPPORTED IN NMP/HTML PLAYER
		 * @method getReviewBufferInfo
		 * @return {Object} Contains startPosition, endPosition, currentPosition, and contentLength properties
		 */
		proto.getReviewBufferInfo = function () {
			log("getReviewBufferInfo", "Review buffer not supported in NMP/HTML player");
		};

		/**
		 * Returns a real time value for the starting time of the review buffer.
		 *
		 * NOT SUPPORTED IN NMP/HTML PLAYER
		 * @method getReviewBufferStartTime
		 * @return {Number} The starting time of the review buffer
		 */
		proto.getReviewBufferStartTime = function () {
			log("getReviewBufferStartTime", "Review buffer not supported in NMP/HTML player");
		};

		/**
		 * Returns a real time value for the ending time of the review buffer.
		 *
		 * NOT SUPPORTED IN NMP/HTML PLAYER
		 * @method getReviewBufferEndTime
		 * @return {Number} The ending time of the review buffer
		 */
		proto.getReviewBufferEndTime = function () {
			log("getReviewBufferEndTime", "Review buffer not supported in NMP/HTML player");
		};

		/**
		 * Returns a real time value for the current playback position of the review buffer.
		 *
		 * NOT SUPPORTED IN NMP/HTML PLAYER
		 * @method getReviewBufferPlaybackPosition
		 * @return {Number} The current playback position of the review buffer
		 */
		proto.getReviewBufferPlaybackPosition = function () {
			log("getReviewBufferPlaybackPosition", "Review buffer not supported in NMP/HTML player");
		};

		/**
		 * Sets the position of playback in seconds for the
		 * current stream
		 * @method setPlaybackPosition
		 * @param {Number} position in seconds
		 */
		proto.setPlaybackPosition = function (position) {
			log("setPlaybackPosition", "enter");
			this._player.currentTime = position;
		};

		/**
		 * Returns the content length (in seconds) of the current stream.
		 * Use `getReviewBufferInfo` to find the review buffer length.
		 * @method getContentLength
		 * @return {Number} seconds
		 */
		proto.getContentLength = function () {
			log("getContentLength", "enter");
			return this._player.duration;
		};

		/**
		 * Returns the current stream for the player
		 * @method getCurrentStream
		 * @return {Object} The stream object
		 */
		proto.getCurrentStream = function () {
			/*log("getCurrentStream", "enter");
			var stream = {};
			stream.uri = this._player.sourceUri;
			stream.pids = this._player.availableStreams;
			stream.pidsAvailable = stream.pids ? true : false;
			return stream;*/
		};

		/**
		 * Registers the given function to be called when the player has
		 * connected to the steam
		 * @method registerPlayerConnectedListener
		 * @param {Function} listener
		 */
		proto.registerPlayerConnectedListener = function (listener) {
			log("registerPlayerConnectedListener", "start and end");
			this._player.addEventListener("loadstart", listener);
		};

		/**
		 * Registers the given function to be called when the player has
		 * failed to connect to a stream
		 * @method registerPlayerConnectFailedListener
		 * @param {Function} listener
		 */
		proto.registerPlayerConnectFailedListener = function (listener) {
			log("registerPlayerConnectFailedListener", "start and end");
			this._player.addEventListener("abort", listener); //TODO: check //TODO: unless set to null?
		};

		/**
		 * Registers the given function to be called when the new content
		 * has started playing.
		 * @method registerPlayerPlayingListener
		 * @param {Function} listener
		 */
		proto.registerPlayerPlayingListener = function (listener) {
			log("registerPlayerPlayingListener", "start and end");
			this._player.addEventListener("playing", listener);
		};

		/**
		 * Registers the given function to be called if the player fails
		 * to play the stream
		 * @method registerPlayerPlayFailedListener
		 * @param {Function} listener
		 */
		proto.registerPlayerPlayFailedListener = function (listener) {
			log("registerPlayerPlayFailedListener", "start and end");
			this._player.addEventListener("error", listener);
		};

		/**
		 * Registers the given function to be called when the content is being
		 * buffered.
		 * @method registerPlayerBufferingListener
		 * @param {Function} listener
		 */
		proto.registerPlayerBufferingListener = function (listener) {
			log("registerPlayerBufferingListener", "start and end");
			this._player.addEventListener("waiting", listener);
		};

		/**
		 * Registers the given function to be called when the end of the content has been reached.
		 * @method registerPlayerReachedEndListener
		 * @param {Function} listener
		 */
		proto.registerPlayerReachedEndListener = function (listener) {
			log("registerPlayerReachedEndListener", "start and end");
			this._player.addEventListener("ended", listener);
		};

		/**
		 * Registers the given function to be called when the player reaches the
		 * beginning of the content.
		 * @method registerPlayerReachedStartListener
		 * @param {Function} listener
		 */
		proto.registerPlayerReachedStartListener = function (listener) {
			log("registerPlayerReachedStartListener", "start and end", Log.LOG_DEBUG);
			//this._player.addEventListener("onBoc", listener); //???????
		};

		/**
		 * Registers the given function to be called when the currently
		 * playing the live content.
		 *
		 * NOT SUPPORTED IN NMP/HTML PLAYER
		 * @method registerCaughtUptoLiveListener
		 * @param {Function} listener
		 */
		proto.registerCaughtUptoLiveListener = function (listener) {
			log("registerCaughtUptoLiveListener", "Review buffer not supported in NMP/HTML player");
		};

		/**
		 * Registers the given function to be called when the player position
		 * passes from one event boundary to another.
		 *
		 * NOT SUPPORTED IN NMP/HTML PLAYER
		 * @method registerEventBoundaryChangedListener
		 * @param {Function} listener
		 */
		proto.registerEventBoundaryChangedListener = function (listener) {
			log("registerEventBoundaryChangedListener", "Event boundary listeners not supported in NMP/HTML Player");
		};

		/**
		 * Unregisters the given function from firing when a
		 * new stream has been started.
		 * @method unregisterPlayerConnectedListener
		 * @param {Function} listener
		 */
		proto.unregisterPlayerConnectedListener = function (listener) {
			this._player.removeEventListener("loadstart", listener);
		};

		/**
		 * Unregisters the given function from firing when there is a
		 * failure in starting the requested stream.
		 * @method unregisterPlayerConnectFailedListener
		 * @param {Function} listener
		 */
		proto.unregisterPlayerConnectFailedListener = function (listener) {
			this._player.removeEventListener("abort", listener); //TODO: unless set to null?
		};

		/**
		 * Unregisters the given function from firing when the new content
		 * has started playing.
		 * @method unregisterPlayerPlayingListener
		 * @param {Function} listener
		 */
		proto.unregisterPlayerPlayingListener = function (listener) {
			this._player.removeEventListener("playing", listener);
		};

		/**
		 * Unregisters the given function from firing when currently playing
		 * content has been stopped for unsolicited reasons.
		 * @method unregisterPlayerPlayFailedListener
		 * @param {Function} listener
		 */
		proto.unregisterPlayerPlayFailedListener = function (listener) {
			this._player.removeEventListener("error", listener);
		};

		/**
		 * Unregisters the given function from firing when the content is being
		 * buffered.
		 * @method unregisterPlayerBufferingListener
		 * @param {Function} listener
		 */
		proto.unregisterPlayerBufferingListener = function (listener) {
			this._player.removeEventListener("waiting", listener);
		};

		/**
		 * Unregisters the given function from firing when the end of the content
		 * has been reached.
		 * @method unregisterPlayerReachedEndListener
		 * @param {Function} listener
		 */
		proto.unregisterPlayerReachedEndListener = function (listener) {
			this._player.removeEventListener("ended", listener);
		};

		/**
		 * Unregisters the given function to fire when the player reaches the
		 * beginning of the content.
		 * @method unregisterPlayerReachedStartListener
		 * @param {Function} listener
		 */
		proto.unregisterPlayerReachedStartListener = function (listener) {
		};

		/**
		 * Unregisters the given function from firing when the player has rejoined
		 * the live content
		 *
		 * NOT SUPPORTED IN NMP/HTML PLAYER
		 * @method unregisterCaughtUptoLiveListener
		 * @param {Function} listener
		 */
		proto.unregisterCaughtUptoLiveListener = function (listener) {
			log("unregisterCaughtUptoLiveListener", "Review buffer not supported in NMP/HTML player");
		};

		/**
		 * Unregisters the given function from being called when the player position
		 * passes from one event boundary to another.
		 *
		 * NOT SUPPORTED IN NMP/HTML PLAYER
		 * @method unregisterEventBoundaryChangedListener
		 * @param {Function} listener
		 */
		proto.unregisterEventBoundaryChangedListener = function (listener) {
			log("unregisterEventBoundaryChangedListener", "Event boundary listeners not supported in NMP/HTML Player");
		};

		/**
		 * Registers the given function to be called when there is locker lock info available.
		 *
		 * NOT SUPPORTED IN NMP/HTML PLAYER
		 * @method registerLockerStatusUpdateListener
		 * @param {Function} listener
		 */
		proto.registerLockerStatusUpdateListener = function (listener) {
			log("registerLockerStatusUpdateListener", "Locker status listeners not supported in NMP/HTML Player");
		};

		/**
		 * Unregisters the given function from firing when there is locker lock info available.
		 *
		 * NOT SUPPORTED IN NMP/HTML PLAYER
		 * @method unregisterLockerStatusUpdateListener
		 * @param {Function} listener
		 */
		proto.unregisterLockerStatusUpdateListener = function (listener) {
			log("unregisterLockerStatusUpdateListener", "Locker status listeners not supported in NMP/HTML Player");
		};

		/**
		 * Registers the given function to be called when the locked player has now unlocked.
		 *
		 * NOT SUPPORTED IN NMP/HTML PLAYER
		 * @method registerLockerUnlockListener
		 * @param {Function} listener
		 */
		proto.registerLockerUnlockListener = function (listener) {
			log("registerLockerUnlockListener", "Locker status listeners not supported in NMP/HTML Player");
		};

		/**
		 * Unregisters the given function from firing when the locked player has now unlocked.
		 *
		 * NOT SUPPORTED IN NMP/HTML PLAYER
		 * @method unregisterLockerUnlockListener
		 * @param {Function} listener
		 */
		proto.unregisterLockerUnlockListener = function (listener) {
			log("unregisterLockerUnlockListener", "Locker status listeners not supported in NMP/HTML Player");
		};

		/**
		 * Registers the given function to be called when the player failed due to lack of resources.
		 *
		 * NOT SUPPORTED IN NMP/HTML PLAYER
		 * @method registerResourcesLostListener
		 * @param {Function} listener
		 */
		proto.registerResourcesLostListener = function (listener) {
			log("registerResourcesLostListener", "Resources lost listeners not supported in NMP/HTML Player");
		};

		/**
		 * Unregisters the given function from firing when the player failed due to lack of resources.
		 *
		 * NOT SUPPORTED IN NMP/HTML PLAYER
		 * @method unregisterResourcesLostListener
		 * @param {Function} listener
		 */
		proto.unregisterResourcesLostListener = function (listener) {
			log("unregisterResourcesLostListener", "Resources lost listeners not supported in NMP/HTML Player");
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