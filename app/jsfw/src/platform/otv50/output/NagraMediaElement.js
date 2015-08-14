/**
 * Wrapper class that takes a config object (see below for properties).
 * It creates a video player and produces an object that conforms as best it can to the HTML5 MediaElement API. Any abstractions required are done internally so that the developer
 * need not worry about differences between OpenTV and HTML implementations.
 *
 * @class $N.platform.output.NagraMediaElement
 * @constructor
 * @param {Object} configObj The CCOM player object
 * @param {Object} [configObj.videoTag] The video element in the DOM as is already passed to the NagraMediaElement constructor.
 * @param {Object} [configObj.attributes] Player attributes e.g. {width: 640, height: 360, autoplay: true}
 * @param {Function} [configObj.videoLoadedCallback] Function that is run once the video has been loaded. For iNMP and NMP Android this will be fired from within the onJSBridgeAvailable method. For NMP plugin this will be fired to a method that is passed in the param onload attribute
 * @param {Function} [configObj.videoFailedCallback] Function that is run if the video fails to load
 */
define('jsfw/platform/output/NagraMediaElement',
    [
    	'jsfw/apps/core/Log',
    	'jsfw/platform/output/Tracks',
    	'jsfw/platform/output/SeekTrickPlay',
    	'jsfw/platform/output/TrickPlay',
    	'jsfw/platform/output/Tuner'
    ],
	function (Log, Tracks, SeekTrickPlay, TrickPlay, Tuner) {

		var log = new $N.apps.core.Log("output", "NagraMediaElement"),
			defineGetter,
			defineSetter,
			eventMap = {};

		if (Object.defineProperty) {
			defineGetter = function (obj, name, func) {
				Object.defineProperty(obj, name, {
					get: func,
					configurable: true
				});
			};
			defineSetter = function (obj, name, func) {
				Object.defineProperty(obj, name, {
					set: func
				});
			};
		} else {
			defineGetter = function (obj, name, func) {
				obj.__defineGetter__(name, func);
			};
			defineSetter = function (obj, name, func) {
				obj.__defineSetter__(name, func);
			};
		}

		eventMap.beginning = 'onBoc';
		eventMap.playing = 'onPlayStarted';
		eventMap.loadstart = 'onStreamStarted';
		eventMap.ratechange = 'onSpeedChanged';
		eventMap.seeked = 'onPositionChanged';
		eventMap.ended = 'onEoc';
		eventMap.error = 'onPlayError';

		function NagraMediaElement(config) {
			var self = this,
				PLATFORM_SVG = 'SVG',
				playerManager = CCOM.PlayerManager,
				instanceCount = 0,
				instanceResult,
				errorCallback,
				attribute;

			if (config && config.videoTag) {
				this._video = config.videoTag;
			} else {
				instanceResult = playerManager.getInstance({destUri: "display://" + instanceCount++});
				if (instanceResult.instance) {
					this._video = instanceResult.instance;
				} else {
					log('constructor', 'Could not find a player instance');
					this._video = null;
				}
			}
			if (config && config.attributes) {
				for (attribute in config.attributes) {
					if (config.attributes.hasOwnProperty(attribute)) {
						self[attribute] = config.attributes[attribute];
					}
				}
			}
			$N.env.platform = "OTV5_0";
			errorCallback = function (e) {
				self._fireEvent('error', e);
			};
			/*
			Add OTV5 error events to NME's 'error' event
			*/
			this._video.addEventListener('onPlayStartFailed', errorCallback);
			this._video.addEventListener('onPlayStopFailed', errorCallback);
			this._video.addEventListener('onPositionChangeFailed', errorCallback);
			this._video.addEventListener('onSpeedChangeFailed', errorCallback);

			this._platform = PLATFORM_SVG;
			this._eventLookup = {};

			/**
			 * Instance of $N.platform.output.Tuner
			 * @property {Object} tuner
			 */
			this.tuner = new $N.platform.output.Tuner(this._video);

			/**
			 * Instance of $N.platform.output.TrickPlay
			 * @property {Object} trickPlay
			 */
			this.trickPlay = new $N.platform.output.TrickPlay(this._video);

			/**
			 * Instance of $N.platform.output.SeekTrickPlay
			 * @property {Object} seekTrickPlay
			 */
			this.seekTrickPlay = new $N.platform.output.SeekTrickPlay(this._video);
			this.seekTrickPlay.setDirectMode(true);

			/**
			 * Instance of $N.platform.output.Tracks
			 * @property {Object} tracks
			 */
			this.tracks = new $N.platform.output.Tracks(this._video);

			/**
			 * Returns the content duration in seconds
			 * @property {Number} duration
			 * @readonly
			 */
			defineGetter(this, "duration", function () {
				return self._video.duration / 1000;
			});

			/**
			 * Returns the current position in seconds
			 * @property {Number} currentTime
			 */
			defineGetter(this, "currentTime", function () {
				return self.seekTrickPlay.getPlaybackPosition();
			});

			/**
			 * Returns the value of the 'error' attribute
			 * @property {Object} error
			 */
			defineGetter(this, "error", function () {
				// TODO
			});

			/**
			 * Sets or returns the media URL. If setting the URL, also starts playback
			 * @property {String} src
			 */
			defineGetter(this, "src", function () {
				return self.tuner.getCurrentUri();
			});

			defineSetter(this, 'src', function (url) {
				if (url !== '') {
					log('src', 'tuning to ' + url);
					self.tuner.tune(url);
				}
			});

			/**
			 * the value of the 'currentSrc' attribute
			 * @property {String} currentSrc
			 * @readonly
			 */
			defineGetter(this, "currentSrc", function () {
				return self.tuner.getCurrentUri();
			});

			/**
			 * the value of the 'networkState' attribute
			 * @property {Object} networkState
			 */
			defineGetter(this, "networkState", function () {
				// TODO
			});

			/**
			 * Sets or returns the 'preload' attribute
			 * @property {Boolean} preload
			 */
			defineGetter(this, "preload", function () {
				// not supported
			});

			defineSetter(this, 'preload', function (preload) {
				// not supported
			});

			/**
			 * contains time ranges of content that have been buffered
			 * @property {Object} buffered
			 * @readonly
			 */
			defineGetter(this, "buffered", function () {
				// TODO
			});

			/**
			 * the 'readyState' attribute
			 * @property {Number} readyState
			 * @readonly
			 */
			defineGetter(this, "readyState", function () {
				// TODO
			});

			/**
			 * Determines if the player is in 'seek' mode
			 * @property {Boolean} seeking
			 * @readonly
			 */
			defineGetter(this, "seeking", function () {
				// TODO
			});

			/**
			 * Returns the value of the 'startTime' attribute
			 * @property {Number} startTime
			 */
			defineGetter(this, "startTime", function () {
				// TODO
			});

			/**
			 * Determines whether the media playback is paused
			 * @property {Boolean} paused
			 */
			defineGetter(this, "paused", function () {
				return (self._video.speed === 0);
			});

			/**
			 * Sets or returns the default playback speed (normally 1)
			 * @property {Number} defaultPlaybackRate
			 */
			defineGetter(this, "defaultPlaybackRate", function () {
				return 1;
			});

			defineSetter(this, 'defaultPlaybackRate', function (rate) {
				// TODO
			});

			/**
			 * Sets or returns the current playback speed
			 * @property {Number} playbackRate
			 */
			defineGetter(this, "playbackRate", function () {
				return self._video.speed;
			});

			defineSetter(this, 'playbackRate', function (rate) {
				self._video.setSpeed(rate);
			});

			/**
			 * Returns time ranges of the content that was played
			 * @property {Object} played
			 */
			defineGetter(this, "played", function () {
				// TODO
			});

			/**
			 * Returns seekable content time ranges
			 * @property {Object} seekable
			 */
			defineGetter(this, "seekable", function () {
				// TODO
			});

			/**
			 * Determines if the content has reached the end
			 * @property {Boolean} ended
			 */
			defineGetter(this, "ended", function () {
				// TODO
			});

			/**
			 * Determines if the content is set to auto-play upon loading
			 * @property {Boolean} autoPlay
			 */
			defineGetter(this, "autoPlay", function () {
				// TODO
			});
			defineSetter(this, "autoPlay", function (autoplay) {
				// TODO
			});

			/**
			 * Reads the current loop state or sets the content to loop from the beginning
			 * once it has reached the end
			 * @property {Boolean} loop
			 */
			defineGetter(this, "loop", function () {
				// TODO
			});

			defineSetter(this, 'loop', function (loop) {
				// TODO
			});

			/**
			 *
			 * @property controls
			 */
			defineGetter(this, 'controls', function () {
				// TODO
			});
			defineSetter(this, 'controls', function (contols) {
				// TODO
			});

			/**
			 * Returns the current playback volume
			 * @property {Number} volume
			 */
			defineGetter(this, "volume", function () {
				// TODO use Device?
			});

			/**
			 * Checks if the audio output is muted
			 * @property {Boolean} muted
			 */
			defineGetter(this, "muted", function () {
				// TODO use Device?
			});

			/**
			 * Sets or returns the video element's width
			 * @property {Number} width
			 */
			defineGetter(this, "width", function () {
				// TODO
			});

			defineSetter(this, 'width', function (width) {
				// TODO
			});

			/**
			 * Sets or returns the video element's height
			 * @property {Number} height
			 */
			defineGetter(this, "height", function () {
				// TODO
			});

			defineSetter(this, 'height', function (height) {
				// TODO
			});

			/**
			 * Returns the intrinsic width of the video
			 * @property {Number} videoWidth
			 * @readonly
			 */
			defineGetter(this, "videoWidth", function () {
				// TODO
			});

			/**
			 * Returns the intrinsic height of the video
			 * @property {Number} videoHeight
			 * @readonly
			 */
			defineGetter(this, "videoHeight", function () {
				// TODO
			});

			/**
			 * Sets or returns the value of the 'poster' attribute. This URL, if present, will be used
			 * to represent the video before the player starts playing it.
			 * @property {String} poster
			 */
			defineGetter(this, "poster", function () {
				// TODO
			});

			defineSetter(this, "poster", function (posterURL) {
				// TODO
			});

			if (config && config.videoLoadedCallback) {
				setTimeout(config.videoLoadedCallback, 1);
			}
		}

		var proto = NagraMediaElement.prototype;

		/**
		 * Adds an internal event listener for the given event name
		 * @method _addEventListener
		 * @private
		 */
		proto._addEventListener = function (eventName, callback) {
			if (!this._eventLookup[eventName]) {
				this._eventLookup[eventName] = [];
			}
			this._eventLookup[eventName].push(callback);
		};

		/**
		 * Removes an internal event listener for the given event name
		 * @method _removeEventListener
		 * @private
		 */
		proto._removeEventListener = function (eventName, callback) {
			if (this._eventLookup[eventName]) {
				this._eventLookup[eventName] = this._eventLookup[eventName].filter(function (currentCallback) {
					return currentCallback !== callback;
				});
			}
		};

		/**
		 * Fires an internal event listener for the given event name
		 * @method _fireEvent
		 * @param {String} eventName name of the event
		 * @param {Object} eventPayload event data
		 * @private
		 */
	    proto._fireEvent = function (eventName, eventPayload) {
	        if (this._eventLookup[eventName]) {
	            this._eventLookup[eventName].forEach(function (callback) {
	                callback();
	            });
	        }
	    };

		/**
		 * Determines if the player can play a given media type and codec
		 * @method canPlayType
		 * @param {String} type media MIME type, along with optional codecs
		 */
		proto.canPlayType = function (type) {
			// TODO
		};

		/**
		 * Loads media from the given URL
		 * @method load
		 */
		proto.load = function () {
			// TODO
		};

		/**
		 * Plays media
		 * @method play
		 */
		proto.play = function () {
			log('play', 'Enter');
			this.tuner.showVideo();
			this.seekTrickPlay.play();
			log('play', 'Exit');
		};

		/**
		 * Pauses media playback
		 * @method pause
		 */
		proto.pause = function () {
			log('pause', 'Enter');
			this.seekTrickPlay.pause();
			log('pause', 'Exit');
		};

		/**
		 * Stops media playback
		 * @method stop
		 */
		proto.stop = function () {
			log('stop', 'Enter');
			if (this._video.stop) {
				log('stop', 'stopping the player');
				this._video.stop();
			} else {
				log('stop', 'pausing media playback');
				this.pause();
				this._fireEvent('ended');
			}
			log('stop', 'Resetting src');
			this.src = "";
			log('stop', 'Exit');
		};

		/**
		 * Sets a video player's attribute
		 * @method setAttribute
		 * @param {String} attr attribute
		 * @param {Object} value the value of the attribute
		 */
		proto.setAttribute = function (attr, value) {
			return this._video.setAttribute(attr, value);
		};

		/**
		 * Cycles through the fast forward speeds defined in the trickplay object property
		 * @method fastForward
		 */
		proto.fastForward = function () {
			log('fastForward', 'Enter');
			if (this.tuner.getCurrentUri().indexOf('http') === 0) {
				this.seekTrickPlay.fastForward();
			} else {
				this.trickplay.fastForward();
			}
			log('fastForward', 'Exit');
		};

		/**
		 * Cycles through the rewind speeds defined in the trickplay object property
		 * @method rewind
		 */
		proto.rewind = function () {
			log('rewind', 'Enter');
			if (this.tuner.getCurrentUri().indexOf('http') === 0) {
				this.seekTrickPlay.fastForward();
			} else {
				this.trickplay.fastForward();
			}
			log('rewind', 'Exit');
		};

		/**
		 * Adds a listener for a named event
		 * @method addEventListener
		 * @param {String} eventName name of the event
		 * @param {Function} callback the listener
		 * @return {Number} 0 if successful; 1 if the event is not supported; 2 if an
		 * argument is invalid
		 */
		proto.addEventListener = function (eventName, callback) {
			this._addEventListener(eventName, callback);
			if (eventMap[eventName]) {
				return this._video.addEventListener(eventMap[eventName], callback, true);
			}
			return 1;
		};

		/**
		 * Removes a listener for a named event
		 * @param {String} eventName name of the event
		 * @param {Function} callback the listener
		 * @method removeEventListener
		 * @return {Number} 0 if successful; 1 if the event is not supported; 2 if
		 * an argument is invalid; 3 if the event handler is invalid (the specified handler
		 * is not currently registered to this event); 4 if the event is invalid (the
		 * specified event is not currently registered with any handlers)
		 */
		proto.removeEventListener = function (eventName, callback) {
			this._removeEventListener(eventName, callback);
			if (eventMap[eventName]) {
				return this._video.removeEventListener(eventMap[eventName], callback);
			}
			return 1;
		};

		window.$N = $N || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.NagraMediaElement = NagraMediaElement;
		return NagraMediaElement;
	}
);