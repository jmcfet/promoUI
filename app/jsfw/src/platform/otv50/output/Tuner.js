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

		var log = $N.apps.core.Log("output", "Tuner");
		var instanceCount = 0;
		var readyBufferMs = 400;

		var Tuner = function (player) {
			var me = this;

			this._instance = instanceCount++;
			this._player = null;
			this._ready = true;
			this._queuedRequest = null;
			this._readyTO = null;
			this._qosDegradedListener = null;
			this._qosImprovedListener = null;

			this._tuneFailedCallback = function () {};

			this._playFailedListener = function (e) {
				me._tuneFailedCallback("Player", null, e.error.message);
			};

			this._playStartFailedListener = function (e) {
				me._tuneFailedCallback("Player", null, e);
			};

			this._streamStartFailedListener = function (e) {
				me._tuneFailedCallback("Source", null, e);
			};

			if (player) {
				this.setPlayer(player);
			}

		};

		var proto = Tuner.prototype;

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

			if (this.getCurrentUri() !== uri) {
				if (this._ready) {
					log("tuneWithPlayOption", "Ready flag true calling CCOM player.play");
					this._ready = false;
					this._player.play(uri, playOption ? [playOption] : []);
				} else {
					clearTimeout(this._readyTO);
					log("tuneWithPlayOption", "Not ready so queueing request for later");
					this._queuedRequest = {uri: uri, playOption: playOption};
				}
				this._readyTO = setTimeout(function () {
					me._updateReadyFlag();
				}, readyBufferMs);
			} else {
				log("tune", "Tune request to same stream ignoring");
			}
			log("tuneWithPlayOption", "EXIT");
		};

		// public API

		/**
		 * Sets the player to be for used the tuning process.
		 * @method setPlayer
		 * @param {Object} player CCOM player
		 */
		proto.setPlayer = function (player) {
			this._player = player;
			this._player.addEventListener("playFailed", this._playFailedListener);
			this._player.addEventListener("onPlayStartFailed", this._playStartFailedListener);
			this._player.addEventListener("onStreamStartFailed", this._streamStartFailedListener);
		};

		/**
		 * Gets the player used for the tuning process.
		 * @method getPlayer
		 * @return {Object} player - CCOM player
		 */
		proto.getPlayer = function () {
			return this._player;
		};

		/**
		 * Sets the time to wait before setting the player status to ready after calling tune()
		 * @method setReadyBufferMs
		 * @param {Number} ms Amount of milliseconds to wait
		 */
		proto.setReadyBufferMs = function (ms) {
			readyBufferMs = ms;
		};

		/**
		 * Sets the function to be executed if a tune request fails, either
		 * because of a stream problem or a player problem.
		 * @method setTuneFailedCallback
		 * @param {Function} callback function to execute
		 */
		proto.setTuneFailedCallback = function (callback) {
			this._tuneFailedCallback = callback;
		};

		/**
		 * Returns the current URI of the stream that is playing or null
		 * if the player is disconnected
		 * @method getCurrentUri
		 * @return {String}The current URI of the stream that is playing
		 */
		proto.getCurrentUri = function () {
			try {
				return this._player.sourceUri;
			} catch (e) {
				return null;
			}
		};

		/**
		 * Method no longer supported.
		 * @method getStream
		 * @return {Object} The current steam that is playing
		 */
		proto.getStream = function () {
			// defunct method
		};

		/**
		 * Tunes the player to the given URI, and starts playing the stream from the given position
		 * @method tune
		 * @param {String} uri
		 * @param {Number} position Position to begin playback in seconds
		 */
		proto.tune = function (uri, position) {
			if (!position) {
				position = 0;
			} else if (uri.indexOf(".m3u8") > -1) {
				uri = uri.replace(/http:/g, "ahls:");
			}
			var playOption = {
				commandType: this._player.PLAY_CONTROL_CMD_POSITION,
				positionCommandData: {
					whence: this._player.SEEK_SET,
					type: this._player.POSITION_TYPE_TIME_BASED,
					timePosition: position * 1000
				}
			};
			log("tune", "ENTER - received tune request for URI: " + uri + " and start position: " + position);
			this._tuneWithPlayOption(uri, playOption);
			log("tune", "EXIT");
		};

		/**
		 * Tunes the player to the given URI but doesn't play automatically
		 * @method tuneWithoutPlay
		 * @param {String} uri
		 */
		proto.tuneWithoutPlay = function (uri) {
			log("tuneWithoutPlay", "ENTER");
			var playOption = {
				commandType: this._player.PLAY_CONTROL_CMD_DONT_START_STREAMS
			};
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
			var i,
				streamTypes = [];
			if (this._player) {
				for (i = 0; i < this._player.availableStreams.length; i++) {
					streamTypes.push({"stopStreamTypes": this._player.availableStreams[i].type});
				}
				this._player.stopStreams(streamTypes);
			}
			log("disconnect", "EXIT");
		};

		/**
		 * Shows the video full screen. This method exists for backwards compatibility, and
		 * it is recommended to manipulate the video element object to resize the video.
		 * @method showFullscreen
		 * @param {Object} [videoElement] parameter if the video element for this tuner is not in global document
		 */
		proto.showFullscreen = function (videoElement) {
			log("showFullscreen", "ENTER");
			var videos;

			if (!videoElement) {
				videos = document.getElementsByTagName("video");
				videoElement = videos[this._instance];
			}
			if (videoElement) {
				videoElement.setAttribute("x", 1); //force a change in the video element in case the video plane was resized from another element
				videoElement.setAttribute("x", 0);
				videoElement.setAttribute("y", 0);
				videoElement.setAttribute("width", window.innerWidth);
				videoElement.setAttribute("height", window.innerHeight);
				log("showFullscreen", "Restoring video window to full screen");
			} else {
				log("showFullscreen", "Failed to restore video window no element found");
			}
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
		 * @param {Object} videoEl optional parameter if the video element for this tuner is not in global document
		 */
		proto.showScaled = function (x, y, width, height, videoEl) {
			log("showScaled", "ENTER");
			var videos;

			if (!videoEl) {
				videos = document.getElementsByTagName("video");
				videoEl = videos[this._instance];
			}
			if (videoEl) {
				videoEl.setAttribute("x", 1); //force a change in the video element in case the video plane was resized from another element
				videoEl.setAttribute("x", x);
				videoEl.setAttribute("y", y);
				videoEl.setAttribute("width", width);
				videoEl.setAttribute("height", height);
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
			var width = parseInt(videoElement.getAttribute("width"), 10);
			var height = parseInt(videoElement.getAttribute("height"), 10);
			var point = new SVGPoint();
			var actualPoint;

			log("showInSVGVideo", "ENTER");
			point.x = parseFloat(videoElement.getAttribute("x"));
			point.y = parseFloat(videoElement.getAttribute("y"));
			actualPoint = point.matrixTransform(videoElement.getScreenCTM());
			this.showScaled(Math.round(actualPoint.x), Math.round(actualPoint.y), width, height);
			log("showInSVGVideo", "EXIT");
		};

		/**
		 * Detaches the video and audio from the player so that there is no
		 * playout on screen.
		 * @method hideVideo
		 */
		proto.hideVideo = function () {
			log("hideVideo", "ENTER");
			this._player.blankVideo();
			log("hideVideo", "EXIT");
		};

		/**
		 * Attaches the video and audio to the player.
		 * @method showVideo
		 */
		proto.showVideo = function () {
			log("showVideo", "ENTER");
			this._player.unblankVideo();
			log("showVideo", "EXIT");
		};


		/**
		 * Registers the given function to fire when the Quality Of
		 * Service is such that video can no longer play and buffering
		 * begins
		 * @method registerQosDegradedListener
		 * @param {Function} listener
		 */
		proto.registerQosDegradedListener = function (listener) {
			this._qosDegradedListener = listener;
			this._player.addEventListener("onSignalLoss", listener);
		};

		/**
		 * Registers the given function to fire when the Quality Of
		 * Service has returned to a state such that video can play
		 * and buffering ends
		 * @method registerQosImprovedListener
		 * @param {Function} listener
		 */
		proto.registerQosImprovedListener = function (listener) {
			this._qosImprovedListener = listener;
			this._player.addEventListener("onSignalGain", listener);
		};
		/**
		 * Unregisters the given function to NOT fire when the Quality
		 * Of Service is such that video can no longer play and buffering
		 * begins
		 * @method unregisterQosDegradedListener
		 * @param {Function} listener
		 */
		proto.unregisterQosDegradedListener = function (listener) {
			this._qosDegradedListener = null;
			this._player.removeEventListener("onSignalLoss", listener);
		};

		/**
		 * Unregisters the given function to NOT fire when the Quality
		 * Of Service has returned to a state such that video can play
		 * and buffering ends
		 * @method unregisterQosImprovedListener
		 * @param {Function} listener
		 */
		proto.unregisterQosImprovedListener = function (listener) {
			this._qosImprovedListener = null;
			this._player.removeEventListener("onSignalGain", listener);
		};

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.Tuner = Tuner;
		return Tuner;
	}
);
