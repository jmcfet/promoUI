/**
 * The aim of this class is to offer a single code base to
 * handle all tune requests from RTSP, IGMP, DVB, etc. and also disconnect requests.
 * The Tuner needs to be associated with a Player object. This
 * allows systems with multiple tuners to have 2+ player objects allowing
 * picture in picture. To use this class you instantiate it with
 * a player. Typically, you would do this once in an application.
 * For example, in a single player environment, this class should only
 * ever be instantiated once.
 * @class $N.platform.output.Tuner
 * @requires $N.apps.core.Log
 * @author mbrown
 *
 * @constructor
 * @param {Object} player reference to the platform Player object
 */

define('jsfw/platform/output/Tuner',
     [
    	'jsfw/apps/core/Log'
    ],
	function (Log) {

		var log = new $N.apps.core.Log("output", "Tuner");
		var instanceCount = 0;
		var READY_BUFFER_MS = 400;

		var Tuner = function (player) {
			var me = this;

			this._player = null; //the video element
			this._ready = true;
			this._queuedRequest = null;
			this._readyTO = null;
			this._playOption = true;

			if (player) {
				this.setPlayer(player);
			}

			function play() {
				if (me._playOption) {
					me._player.play();
				}
			}
			if (this._player) {// needed for unit tests
				this._player.addEventListener("canplaythrough", play);
			}

		};

		var proto = Tuner.prototype;

		//private helper files

		/**
		 * Updates the internal state of the class to allow tune requests
		 * to be serviced.  Since multiple tuner requests may be received in
		 * a short space of time there is a 400ms delay before they are
		 * serviced to avoid too many requests at once overloading the tuner.
		 * @method _updateReadyFlag
		 * @private
		 */
		proto._updateReadyFlag = function () {
	        log("updateReadyFlag", "ENTER - Setting ready flag to true");
			this._ready = true;
			if (this._queuedRequest) {
				log("updateReadyFlag", "Processing queued request with URI: " + this._queuedRequest.uri);
				this._tuneWithPlayOption(this._queuedRequest.uri, this._queuedRequest.playOption);
				this._queuedRequest = null;
			}
		};

		/**
		 * Private helper function to avoid duplicated code in the public API,
		 * Handles the tuning request
		 * @method tuneWithPlayOption
		 * @private
		 * @param {String} uri
		 * @param {Object} playOption
		 */
		proto._tuneWithPlayOption = function (uri, playOption) {
			log("tuneWithPlayOption", "ENTER - received tune request for URI: " + uri + " and playOption: " + playOption);

			var me = this;
			this._playOption = playOption;
			if (this.getCurrentUri() !== uri) {
				if (this._ready) {
					log("tuneWithPlayOption", "Ready flag true calling CCOM player.play");
					this._ready = false;
					this._player.src = uri;
					//this._player.load();
				} else {
					clearTimeout(this._readyTO);
					log("tuneWithPlayOption", "Not ready so queueing request for later");
					this._queuedRequest = {uri: uri, playOption: playOption};
				}
				this._readyTO = setTimeout(function () {
					me._updateReadyFlag();
				}, READY_BUFFER_MS);
			} else {
				log("tune", "Tune request to same stream ignoring");
			}
			log("tuneWithPlayOption", "EXIT");
		};

		// public API

		/**
		 * Sets the player to be used for the tuning process.
		 * @method setPlayer
		 * @param {Object} player CCOM player
		 */
		proto.setPlayer = function (player) {
			this._player = player;
		};

		/**
		 * Gets the player used for the tuning process.
		 * @method getPlayer
		 * @return {Object} player
		 */
		proto.getPlayer = function () {
			return this._player;
		};

		/**
		 * Sets the function to be executed if a tune request fails, either
		 * because of a stream problem or a player problem.
		 *
		 * NOT SUPPORTED FOR NMPPC
		 * @method setTuneFailedCallback
		 * @param {Function} callback function to execute
		 */
		proto.setTuneFailedCallback = function (callback) {
			log("setTuneFailedCallback", "Tune failed callback not supported");
		};

		/**
		 * Returns the current URI of the stream that is playing or null
		 * if the player is disconnected
		 * @method getCurrentUri
		 * @return {String}The current URI of the stream that is playing
		 */
		proto.getCurrentUri = function () {
			try {
				return this._player.src;
			} catch (e) {
				return null;
			}
		};

		/**
		 * Tunes the player to the given URI, and starts playing the stream. If
		 * liveDelay is true, PVR functionality is enabled.
		 * @method tune
		 * @param {String} uri
		 * @param {Boolean} liveDelay
		 */
		//TODO: allow a timePosition to be passed in to allow playback from bookmark
		proto.tune = function (uri, liveDelay) {
			log("tune", "ENTER - recieved tune request for URI: " + uri + " and liveDelay: " + liveDelay);
			this._tuneWithPlayOption(uri, true);
			log("tune", "EXIT");
		};

		/**
		 * Tunes the player to the given URI but doesn't play automatically
		 * @method tuneWithoutPlay
		 * @param {String} uri
		 */
		proto.tuneWithoutPlay = function (uri) {
			var playOption = null; //TODO: pass a value not to start playback
			log("tuneWithoutPlay", "ENTER");
			this._tuneWithPlayOption(uri, playOption);
			log("tuneWithoutPlay", "EXIT");
		};

		/**
		 * Disconnects the player and stream so that video is no
		 * longer output to the screen
		 * @method disconnect
		 */
		proto.disconnect =  function () {
			log("disconnect", "ENTER");
			if (this._player) {
				this._player.pause();
				this._player.currentTime = 0;
				this._player.src = null;
				this._player.load();
			}
			log("disconnect", "EXIT");
		};

		/**
		 * Shows the video full screen. This method exists for backwards compatibility, and
		 * it is recommended to manipulate the video element object to resize the video.
		 * @method showFullscreen
		 * @param {Object} [videoElement=player] parameter if the video element for this tuner is not in global document
		 */
		proto.showFullscreen = function (videoElement) {
			log("showFullscreen", "ENTER");
			if (!videoElement) {
				videoElement = this._player;
			}
			videoElement.fullscreen = true;
			log("showFullscreen", "EXIT");
		};

		/**
		 * Shows the video at the given x, y position and scaled to
		 * the given width and height. This method exists for backwards compatibility, and
		 * it is recommended to manipulate the video element object to resize the video.
		 * @method showScaled
		 * @param {Number} x
		 * @param {Number} y
		 * @param {Number} width
		 * @param {Number} height
		 * @param {Object} [videoElement=player] parameter if the video element for this tuner is not in global document
		 */
		proto.showScaled = function (x, y, width, height, videoElement) {
			log("showScaled", "ENTER");
			var videos;
			if (!videoElement) {
				videoElement = this._player;
			}
			if (videoElement) {
				videoElement.fullscreen = false;
				if (window.userAgent) {
					window.userAgent.setGlobalVideoPosition({
						left: x,
						top: y,
						zOrder: -1,
						width: width,
						height: height
					});
				} else {
					videoElement.style.left = x;
					videoElement.style.top = y;
					videoElement.width = width;
					videoElement.height = height;
				}

				log("showScaled", "Scaling video window");
			} else {
				log("showScaled", "Failed to scale video window no element found");
			}
			log("showScaled", "EXIT");
		};

		/**
		 * Given an SVG video element will calculate the correct position and
		 * scale to show the video, even if the video tag's position has been
		 * transformed by a parent element
		 * @method showInSVGVideo
		 * @param {Object} videoElement SVG Video Element reference
		 */
		proto.showInSVGVideo = function (videoElement) {
			//TODO: needs renaming and implementing
		};

		/**
		 * Detaches the video and audio from the player so that there is no
		 * playout on screen.
		 * @method hideVideo
		 */
		proto.hideVideo = function () {
			log("hideVideo", "ENTER");
			this._player.muted = true;
			this._player.setAttribute("style", "display: none");
			log("hideVideo", "EXIT");
		};

		/**
		 * Attaches the video and audio to the player.
		 * @method showVideo
		 */
		proto.showVideo = function () {
			log("showVideo", "ENTER");
			this._player.muted = false;
			this._player.setAttribute("style", "display: inline");
			log("showVideo", "EXIT");
		};


		/**
		 * Registers the given function to fire when the Quality Of
		 * Service is such that video can no longer play and buffering
		 * begins.
		 *
		 * NOT SUPPORTED IN NMPPC
		 * @method registerQosDegradedListener
		 * @param {Function} listener
		 */
		proto.registerQosDegradedListener = function (listener) {
			log("registerQosDegradedListener", "QOS Degraded Listeners not supported");
		};

		/**
		 * Registers the given function to fire when the Quality Of
		 * Service has returned to a state such that video can play
		 * and buffering ends.
		 *
		 * NOT SUPPORTED IN NMPPC
		 * @method registerQosImprovedListener
		 * @param {Function} listener
		 */
		proto.registerQosImprovedListener = function (listener) {
			log("registerQosImprovedListener", "QOS Improved Listeners not supported");
		};

		/**
		 * Unregisters the given function to NOT fire when the Quality
		 * Of Service is such that video can no longer play and buffering
		 * begins.
		 *
		 * NOT SUPPORTED IN NMPPC
		 * @method unregisterQosDegradedListener
		 * @param {Function} listener
		 */
		proto.unregisterQosDegradedListener = function (listener) {
			log("unregisterQosDegradedListener", "QOS Degraded Listeners not supported");
		};

		/**
		 * Unregisters the given function to NOT fire when the Quality
		 * Of Service has returned to a state such that video can play
		 * and buffering ends.
		 *
		 * NOT SUPPORTED IN NMPPC
		 * @method unregisterQosImprovedListener
		 * @param {Function} listener
		 */
		proto.unregisterQosImprovedListener = function (listener) {
			log("unregisterQosImprovedListener", "QOS Improved Listeners not supported");
		};

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.Tuner = Tuner;
		return Tuner;
	}
);
