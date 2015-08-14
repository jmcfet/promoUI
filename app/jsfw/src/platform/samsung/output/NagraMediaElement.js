/*global jQuery, window*/
/**
 * Wrapper class that takes a config object (see below for properties).
 * It creates a Samsung video player and produces an object that conforms as best it can to the HTML5 MediaElement API. Any abstractions required are done internally so that the developer
 * need not worry about differences between Samsung and HTML implementations.
 *
 * @class $N.platform.output.NagraMediaElement
 * @requires $N.apps.core.log
 * @constructor
 * @param {Object} config
 * @param {Object} [config.videoTag] The video element in the DOM as is already passed to the NagraMediaElement constructor.
 * @param {Object} [config.attributes] Player attributes e.g. {width: 640, height: 360, autoplay: true}
 * @param {Function} [config.videoLoadedCallback] Function that is run once the video has been loaded. For iNMP and NMP Android this will be fired from within the onJSBridgeAvailable method. For NMP plugin this will be fired to a method that is passed in the param onload attribute.
 * @param {Function} [config.videoFailedCallback] Function that is run if the video fails to load.
 */

/*global webapis*/

define('jsfw/platform/output/NagraMediaElement',
    [
    	'jsfw/apps/core/Log',
    	'jsfw/platform/output/DRM',
    	'jsfw/platform/output/TrickPlay'
    ],
	function (Log, DRM, TrickPlay) {
		'use strict';

		var log = new $N.apps.core.Log("output", "NagraMediaElement");

		function NagraMediaElement(config) {
			var me = this,
				audioControl = webapis.audiocontrol,
				playCallback = {
					oncurrentplaytime: function (time) {
						me._currentTime = Math.ceil(time.millisecond / 1000);
						me._fireEvent("timeupdate");
					},
					onstreamcompleted: function () {
						me._fireEvent("ended");
					},
					onerror: function (error) {
						me._fireEvent("error");
					}
				},
				bufferingCallback = {
					onbufferingstart : function () {
						me._fireEvent("waiting");
					},

					onbufferingprogress: function (percent) {
						me._fireEvent("progress", percent);
					},
					onbufferingcomplete: function () {
						me._fireEvent("playing");
					}
				},
				getAvPlaySuccess = function (video) {
					var attribute;
					video.init({
						playCallback: playCallback,
						bufferingCallback: bufferingCallback
					});
					me._video = video;
					me.trickplay.setPlayer(me._video);
					if (config && config.attributes) {
						for (attribute in config.attributes) {
							if (config.attributes.hasOwnProperty(attribute)) {
								me[attribute] = config.attributes[attribute];
							}
						}
					}
					if (config && config.videoLoadedCallback) {
						setTimeout(config.videoLoadedCallback, 10);
					}
				},
				getAvPlayFailed = function () {
					if (config && config.videoFailedCallback) {
						config.videoFailedCallback();
					}
				};
			this._eventLookup = {};
			$N.env.platform = "SAMSUNG";
			this._currentTime  = 0;
			this._playerWidth = window.innerWidth;
			this._playerHeight = window.innerHeight;
			this._playerLeft = 0;
			this._playerTop = 0;
			this._autoPlay = false;

			this._playingSuccesful = function () {
				me._fireEvent("loadstart");
				me._fireEvent("playing");
			};

			this._playingFailed = function (error) {
				this._fireEvent("error");
			};

			/**
			 * Returns the duration in seconds
			 * @property {Number} duration
			 * @readonly
			 */
			Object.defineProperty(this, "duration", {
				get: function () {
					return me._video.duration / 1000;
				}
			});

			/**
			 * Sets or returns the current position in seconds
			 * @property {Number} currentTime
			 */
			Object.defineProperty(this, "currentTime", {
				get: function () {
					return me._currentTime;
				},
				set: function (pos) {
					var seek = pos - me._currentTime;
					if (seek < 0) {
						me._video.jumpBackward(seek * -1);
					} else {
						me._video.jumpForward(seek);
					}
				}
			});

			/**
			 * Returns an IHTMLMediaError object representing the current error state of the media element.
			 * Not supported by Samsung
			 * @property {Object} error
			 */
			Object.defineProperty(this, "error", {
				get: function () {
					//not supported
				},
				configurable: true
			});

			/**
			 * Sets or gets the address or URL of the a media resource.
			 * @property {String} src
			 */
			Object.defineProperty(this, "src", {
				get: function () {
					return me._video.url;
				},
				set: function (url) {
					var params = "";
					if (url.indexOf(".m3u8") !== -1) {
						params = "|COMPONENT=HLS";
					}
					if (me._video.status === me._playerStates.STARTED || me._video.status === me._playerStates.PAUSED) {
						me._video.stop();
					}
					me._video.open(url + params);
					me._currentTime = 0;
					if (me._autoPlay) {
						me._video.play(me._playingSuccesful, me._playingFailed);
					}
				},
				configurable : true
			});

			/**
			 * Gets the address or URL of the current media resource that is selected
			 * @property {String} currentSrc
			 * @readonly
			 */
			Object.defineProperty(this, "currentSrc", {
				get: function () {
					return me._video.url;
				}
			});

			/**
			 * Gets the current network activity for the element.
			 * Not supported by Samsung
			 * @property {Number} networkState
			 */
			Object.defineProperty(this, "networkState", {
				get: function () {
					//not supported
				}
			});

			/**
			 * Gets or sets a hint to how much buffering is advisable for a media resource, even if auto-play is not specified
			 * Not supported by Samsung
			 * @property {Object} preload
			 */
			Object.defineProperty(this, "preload", {
				get: function () {

				},
				set: function () {
					//TODO:
				}
			});

			/**
			 * Gets a collection of buffered time ranges... Not supported...
			 * @property {Object} buffered
			 */
			Object.defineProperty(this, "buffered", {
				get: function () {
					//not supported in Samsung
				}
			});

			/**
			 * Returns the readiness state of a TextTrack with values that let you determine whether the track is loaded, is loading, or failed to load
			 * Not supported by Samsung
			 * @property {Number} readyState
			 * @readonly
			 */
			Object.defineProperty(this, "readyState", {
				get: function () {
					//not supported in Samsung
				}
			});

			/**
			 * Gets a flag that indicates whether the the client is currently moving to a new playback position in the media resource.
			 * @property {Boolean} seeking
			 * @readonly
			 */
			Object.defineProperty(this, "seeking", {
				get: function () {
					//not supported in Samsung
				}
			});

			/**
			 * Returns the text track cue start time in seconds... Not currently supported...
			 * @property {Number} startTime
			 * @readonly
			 */
			Object.defineProperty(this, "startTime", {
				get: function () {
					//not supported in Samsung
				}
			});

			/**
			 * Gets a flag that specifies whether playback is paused.
			 * @property {Boolean} paused
			 * @readonly
			 */
			Object.defineProperty(this, "paused", {
				get: function () {
					if (me._video.status === me._playerStates.PAUSED) {
						return true;
					}
					return false;
				}
			});

			/**
			 * Gets or sets the default playback rate when the user is not using fast forward or reverse for a video or audio resource.
			 * Unable to set on Samsung player
			 * @property {Number} defaultPlaybackRate
			 */
			Object.defineProperty(this, "defaultPlaybackRate", {
				get: function () {
					return 1;
				},
				set: function (rate) {
				}
			});

			/**
			 * Gets or sets the current speed for the media resource to play. This speed is expressed as a multiple of the normal speed of the media resource.
			 * @property {Number} playbackRate
			 */
			Object.defineProperty(this, "playbackRate", {
				get: function () {
					return 1;
				},
				set: function (rate) {
				}
			});

			/**
			 * Gets TimeRanges for the current media resource that has been played... Not currently supported...
			 * @property {Object} played
			 */
			Object.defineProperty(this, "played", {
				get: function () {
					//not supported in Samsung
				}
			});

			/**
			 * Returns a TimeRanges object that represents the ranges of the current media resource that can be seeked... Not currently supported...
			 * @property {Object} seekable
			 */
			Object.defineProperty(this, "seekable", {
				get: function () {
					//not supported in Samsung
				}
			});

			/**
			 * Returns true if the content has reached the end. Not supported by Samsung
			 * @property {Boolean} ended
			 */
			Object.defineProperty(this, "ended", {
				get: function () {
				}
			});

			/**
			 * Gets or sets a value that indicates whether to start playing the media automatically.
			 * @property {Boolean} autoPlay
			 */
			Object.defineProperty(this, "autoPlay", {
				get: function () {
					return me._autoPlay;
				},
				set: function (autoPlay) {
					me._autoPlay = autoPlay;
				}
			});

			/**
			 * Gets or sets a flag that specifies whether playback should restart after it completes.
			 * Not supported by Samsung
			 * @property {Boolean} loop
			 */
			Object.defineProperty(this, "loop", {
				get: function () {
				},
				set: function (loop) {
				}
			});

			/**
			 * Gets or sets a flag that indicates whether the client provides a set of controls for the media (in case the developer does not include controls for the player).
			 * Not supported by Samsung
			 * @property {Boolean} controls
			 */
			Object.defineProperty(this, "controls", {
				get: function () {
				},
				set: function (controls) {
				}
			});

			/**
			 * Gets or sets the volume level for audio portions of the media element.
			 * @property {Number} volume
			 */
			Object.defineProperty(this, "volume", {
				get: function () {
					return audioControl.getVolume();
				},
				set: function (volume) {
					if (volume < 0) {
						volume = 0;
					} else if (volume > 100) {
						volume = 100;
					}
					audioControl.setVolume(volume);
				}
			});

			/**
			 * Gets or sets a flag that indicates whether the audio (either audio or the audio track on video media) is muted.
			 * @property {Boolean} muted
			 */
			Object.defineProperty(this, "muted", {
				get: function () {
					return audioControl.getMute();
				},
				set: function (mute) {
					if (mute) {
						audioControl.setMute(true);
					} else {
						audioControl.setMute(false);
					}
				}
			});

			/**
			 * Gets or sets the width of the video element.
			 * Not supported use videoWidth
			 * @property {Number} width
			 */
			Object.defineProperty(this, "width", {
				get: function () {
					return me._playerWidth;
				},
				set: function (width) {
					me._video.setDisplayArea({
						left: me._playerLeft,
						top: me._playerTop,
						width: width,
						height: me._playerHeight
					});
					me._playerWidth = width;
				}
			});

			/**
			 * Gets or sets the height of the video element.
			 * @property {Number} height
			 */
			Object.defineProperty(this, "height", {
				get: function () {
					return me._playerHeight;
				},
				set: function (height) {
					me._video.setDisplayArea({
						left: me._playerLeft,
						top: me._playerTop,
						width: me._playerWidth,
						height: height
					});
					me._playerHeight = height;
				}
			});

			/**
			 * Gets the intrinsic width of a video in CSS pixels, or zero if the dimensions are not known.
			 * @property {Number} videoWidth
			 * @readonly
			 */
			Object.defineProperty(this, "videoWidth", {
				get: function () {
					return me._video.videoWidth;
				}
			});

			/**
			 * Gets the intrinsic height of a video in CSS pixels, or zero if the dimensions are not known.
			 * @property {Number} videoHeight
			 * @readonly
			 */
			Object.defineProperty(this, "videoHeight", {
				get: function () {
					return me._video.videoHeight;
				}
			});

			/**
			 * Gets or sets a URL of an image to display, for example, like a movie poster.
			 * This can be a still frame from the video, or another image if no video data is available.
			 * Not supported by Samsung
			 * @property {String} poster
			 */
			Object.defineProperty(this, "poster", {
				get: function () {
					//Not supported
				}
			});

			/**
			 * Trick play object to allow setting of trick play options
			 * @property {Object} trickplay
			 */
			this.trickplay = new $N.platform.output.TrickPlay();

			if ($N.platform.output.DRM) {
				this.drm = new $N.platform.output.DRM({platform: $N.env.platform, playoutManager: this});
			}
			webapis.avplay.getAVPlay(getAvPlaySuccess, getAvPlayFailed);
		}

		var proto = NagraMediaElement.prototype;

		proto._playerStates = {
			INITIALIZED: 1,
			STOPPED: 2,
			PREPARED: 3,
			STARTED: 4,
			PAUSED: 5
		};

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
	            this._eventLookup[eventName] = this._eventLookup[eventName].filter(function (value) { return value !== callback; });
	        }
	    };

		/**
		 * Fires an internal event listener for the given event name
		 * @method _fireEvent
		 * @private
		 */
	    proto._fireEvent = function (eventName, payload) {
	        if (this._eventLookup[eventName]) {
	            this._eventLookup[eventName].forEach(function (callback) {
	                callback(payload);
	            });
	        }
	    };

		/**
		 * Returns a string that specifies whether the client can play a given media resource type.
		 * Not supported on Samsung
		 * @method canPlayType
		 * @param {String} type
		 * @param {String} canPlay
		 */
		proto.canPlayType = function (type, canPlay) {
			//not supported on Samsung
		};

		/**
		 * Resets the MediaElement and loads a new media resource.
		 * @method load
		 */
		proto.load = function () {
			log("load", "enter");
		};

		/**
		 * Loads and starts playback of a media resource.
		 * @method play
		 */
		proto.play = function () {
			log("play", "enter");
			var me = this;
			if (this._video.status  === this._playerStates.PAUSED || this._video.status  === this._playerStates.STARTED) {
				this._video.resume();
			} else {
				this._video.play(me._playingSuccesful, me._playingFailed);
			}
			this.trickplay.play();
		};

		/**
		 * Pauses the current playback and sets `paused` to true.
		 * @method pause
		 */
		proto.pause = function () {
			log("pause", "enter");
			this._video.pause();
			this.trickplay.pause();
		};

		/**
		 * Stops the current playback
		 * @method stop
		 */
		proto.stop = function () {
			log("stop", "enter");
			this._video.stop();
		};

		/**
		 * Cycles through the fast forward speeds defined in the trickplay object property
		 * @method fastForward
		 */
		proto.fastForward = function () {
			log("fastForward", "enter");
			this.trickplay.fastForward();
		};

		/**
		 * Cycles through the rewind speeds defined in the trickplay object property
		 * @method rewind
		 */
		proto.rewind = function () {
			log("rewind", "enter");
			this.trickplay.rewind();
		};

		/**
		 * Sets the value of a given attribute on the video element
		 * Supports top and left attributes
		 * @method setAttribute
		 */
		proto.setAttribute = function (attr, value) {
			if (attr === "left") {
				this._playerLeft = value;
				this._video.setDisplayArea({
					left: value,
					top: this._playerTop,
					width: this._playerWidth,
					height: this._playerHeight
				});
			} else if (attr === "top") {
				this._playerTop = value;
				this._video.setDisplayArea({
					left: this._playerLeft,
					top: value,
					width: this._playerWidth,
					height: this._playerHeight
				});
			} else if (attr === "visibility") {
				if (value) {
					this._video.show();
				} else {
					this._video.hide();
				}
			}
		};

		/**
		 * Registers a callback for a given event name
		 * @method addEventListener
		 * @param {String} eventName name of the event
		 * @param {Function} callback the listener
		 * @param {Boolean} bubbles
		 */
		proto.addEventListener = function (eventName, callback, bubbles) {
			log("addEventListener", "enter");
			this._addEventListener(eventName, callback, bubbles);
		};

		/**
		 * Unregisters a callback for a given event name
		 * @method removeEventListener
		 */
		proto.removeEventListener = function (eventName, callback, bubbles) {
			log("removeEventListener", "enter");
			this._removeEventListener(eventName, callback, bubbles);
		};

		/**
		 * jQuery Plug-in method
		 * @method NagraMediaElement
		 */
		if (jQuery) {
			jQuery.fn.NagraMediaElement = function () {
				return new NagraMediaElement({videoTag: this[0]});
			};
		}

		/**
		 * Dispatched when the current playback position changes
		 * @event timeupdate
		 */

		/**
		 * Dispatched when playback reaches end of content
		 * @event ended
		 */

		/**
		 * Dispatched if an error occurs with the player such as failure to playback content
		 * @event error
		 */

		/**
		 * Dispatched when playback is successful
		 * @event playing
		 */

		/**
		 * Fired when playback pauses but is expected to resume (e.g. when content is buffering)
		 * @event waiting
		 */

		/**
		 * Fired when player is in the process of getting media data
		 * @event progress
		 */

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.NagraMediaElement = NagraMediaElement;
		return NagraMediaElement;
	}
);