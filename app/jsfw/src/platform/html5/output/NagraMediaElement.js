/*global jQuery, navigator, window, userAgent*/
/**
 * Wrapper class that takes a config object (see below for properties).
 *
 * It creates a video player element whether this be an NMP video element, HTML5 or NMP plug-in
 * and produces an object that conforms as best it can to the HTML5 MediaElement API. Any abstractions required
 * are done internally so that the developer need not worry about differences between platform implementations.
 * @class $N.platform.output.NagraMediaElement
 * @constructor
 * @requires $N.apps.core.Log
 * @requires $N.platform.output.Tracks
 * @requires $N.platform.output.SeekTrickPlay
 * @param {Object} configObj A configuration object with the following properties
 * @param {Object} [configObj.videoTag] The video/object element in the HTML page as is already passed to the NagraMediaElement constructor. If an NMP video/object tag is used the loaded event must have fired prior to instantiating the NagraMediaElement;
 * @param {Boolean} [configObj.forceHTML] If true will use the HTML5 player otherwise will use NMP;
 * @param {Object} [configObj.attributes] Player attributes e.g. {width: 640, height: 360, controls: true, autoplay: true}
 * @param {Object} [configObj.upgrade] Upgrade attributes e.g. {forceUpgrade: false, applicationData: appData, callback: upgradeCallback, pluginTimeoutMs: 5000 }
 * @param {Number} [configObj.upgrade.pluginTimeoutMs] Time in milliseconds to wait for the plugin to load. If after this time the plugin has not loaded, NagramediaElement will call NMPPluginHelper to check if an upgrade is required. Default is 10000 ms
 * @param {Object} [configObj.parent] The parent element for the video/object tag to be appended to. Must be passed in if a videoTag object is not passed in;
 * @param {Function} [configObj.videoLoadedCallback] Function that is run once the video has been loaded. For iNMP and NMP Android this will be fired from within the onJSBridgeAvailable method. For NMP plugin this will be fired to a method that is passed in the param onload attribute;
 * @param {Function} [configObj.videoFailedCallback] Function that is run if the video fails to load or if no video tag and no parent properties are passed in the config object.
 */


define('jsfw/platform/output/NagraMediaElement',
    [
    	'jsfw/apps/core/Log',
    	'jsfw/platform/output/Tracks',
    	'jsfw/platform/output/SeekTrickPlay',
    	'jsfw/platform/output/NMPPluginHelper',
    	'jsfw/Config'
    ],
	function (Log, Tracks, SeekTrickPlay, NMPPluginHelper, Config) {
		'use strict';

		var log = new $N.apps.core.Log("output", "NagraMediaElement");

		function NagraMediaElement(configObj) {
			var me = this,
				videoTag,
				paramElement,
				videoLoadedTimeout,
				config = {};

			if (configObj.toString() === "<JSAPI-Auto Javascript Object>" || configObj.toString() === "[object HTMLVideoElement]") {
				config.videoTag = configObj; //for backwards compatibility
			} else {
				config = configObj;
			}

			function GetAttributesCallback() {
				this.attributes = function (attributes) {
					if (typeof attributes === "string") {
						attributes = eval(attributes);
						attributes = attributes[0];
					}
					$N.env.playerType = attributes.platform;
					$N.env.playerVersion = attributes.version;
					log("GetAttributesCallback", "Player Type identified as: " + $N.env.playerType);
					log("GetAttributesCallback", "Player Version identified as: " + $N.env.playerVersion);
				};
			}

			function browserPluginHelper (platform, version) {
				var response = {},
					versionCheckCallback = function (data) {
						if (data.status === "PLAYER_UPGRADE_REQUIRED" || (data.status === "PLAYER_UPGRADE_RECOMMENDED" && config.upgrade.forceUpgrade === true)) {
							$N.platform.output.NMPPluginHelper.installNMPBrowserPlugin(data);
							if (version === '0') {
								response.status = "PLAYER_INSTALLING";
							} else {
								response.status = "PLAYER_UPGRADING";
							}
						}
						response.playerState = data.status;
						config.upgrade.callback(response);
					};
				if (!version) {
					version = "0";
					switch(navigator.platform) {
						case 'Mac68K':
						case 'MacPPC':
						case 'MacIntel':
							platform = "MacOS";
							break;
						default:
							platform = navigator.platform;
					}
				}
				$N.platform.output.NMPPluginHelper.checkNMPUpgradeRequired(config.upgrade.applicationData, platform, version, versionCheckCallback);
			}

			function startPluginLoadedTimeout() {
				var pluginTimeoutMs;
				if (config.upgrade && !config.forceHTML) {
					pluginTimeoutMs = config.upgrade.pluginTimeoutMs || 10000;
					videoLoadedTimeout = setTimeout(browserPluginHelper,pluginTimeoutMs);
				}
			}

			var videoLoaded = function () {
				var prop;
				if (videoTag && videoTag.drmAgent) {
					clearTimeout(videoLoadedTimeout);
					me._videoTag = videoTag;
					me._video = videoTag.videoElement;
					$N.env.platform = "NMP_PLUGIN";
					window.drmAgent = videoTag.drmAgent;
					window.secureStorageAgent = videoTag.secureStorageAgent;
					window.userAgent = videoTag.userAgent;
					window.ccSettingsAgent = videoTag.ccSettingsAgent;
					window.serviceDiscoveryAgent = videoTag.serviceDiscoveryAgent;
					log("pluginUserAgent", "Player Version identified as: " + $N.Config.PLUGIN_VER_PREFIX + window.userAgent.version);
					$N.env.playerType = window.userAgent.platform;
					$N.env.playerVersion = $N.Config.PLUGIN_VER_PREFIX + window.userAgent.version;
					if (config.upgrade) {
						browserPluginHelper(window.userAgent.platform, window.userAgent.version);
					}
				} else {
					me._video = (!config.forceHTML && window.videoAgent) ? window.videoAgent : videoTag;
					if (navigator.userAgent.indexOf('Windows') !== -1 && window.userAgent) {
						$N.env.platform = "PC";
						$N.env.playerVersion = window.userAgent.version;
						$N.env.playerType = window.userAgent.platform;
					} else if (window.userAgent && navigator.userAgent.indexOf('Android') !== -1) {
						$N.env.platform = "ANDROID";
						$N.platform.output.NagraMediaElement._getAttributesCallbackInstance = new GetAttributesCallback();
						userAgent.getGlobalAttributes("$N.platform.output.NagraMediaElement._getAttributesCallbackInstance");
					} else if ((navigator.userAgent.indexOf('iPad') !== -1 || navigator.userAgent.indexOf('iPhone') !== -1) && window.userAgent) {
						$N.env.platform = "IOS";
						$N.platform.output.NagraMediaElement._getAttributesCallbackInstance = new GetAttributesCallback();
						userAgent.getGlobalAttributes("$N.platform.output.NagraMediaElement._getAttributesCallbackInstance");
					} else {
						$N.env.platform = "HTML5";
					}
					if ($N.env.platform !== "HTML5" || config.forceHTML) {
						clearTimeout(videoLoadedTimeout);
					}
				}
				me.autoplay = false;
				if (config.attributes) {
					for (prop in config.attributes) {
						if (config.attributes.hasOwnProperty(prop)) {
							me[prop] = config.attributes[prop];
						}
					}
				}

				me.trickplay.setPlayer(me._video);
				me.trickplay.setPlatform($N.env.platform);

				if ($N.env.platform === "IOS" || ($N.env.platform === "ANDROID" && (!window.videoAgent))) {
					NagraMediaElement._onTranslateCompleteCallback = {
						localUrl: function (url) {
							me.setAttribute('src', "");
							me.setAttribute('src', url);
							if ($N.env.platform === "IOS") {
								me.load();
							}
							if (me._autoPlay) {
								me._video.play();
							}
						}
					};
				} else if ($N.env.platform === "PC" || $N.env.platform === "HTML5") {
					me.addEventListener("canplaythrough", function () {
						if (me._autoPlay) {
							me._video.play();
						}
					}, false);
				}

				if (Config.TRACKS) {
					/**
					 * Tracks object to allow setting of tracks
					 * @property {Object} tracks
					 */
					me.tracks = new $N.platform.output.Tracks(me._video);
				}
				if (config.videoLoadedCallback) {
					config.videoLoadedCallback();
				}
				log("constructor", "Platform identified as: " + $N.env.platform);
			};

			this._videoTag = null;//needed for setting height and width on nmp plugin

			if (!config) {
				return "Error: No config object passed to NagraMediaElement";
			}
			if (!config.videoTag) {
				if (!config.parent) {
					return "Error: No video tag and no parent element";
				}
				if (!$N.platform.output.NagraMediaElement._jsBridgeFired) {
					window.onJSBridgeAvailable = function () {
						if (!videoTag) {
							videoTag = document.getElementById("__nmpcbrowserplugin");
						}
						videoLoaded();
					};
				}
				if (navigator.userAgent.indexOf("Android") === -1) {
					if (config.forceHTML ||
							navigator.userAgent.indexOf("iNMP") !== -1 ||
							navigator.userAgent.indexOf("Nagra Media Player") !== -1) {
						videoTag = document.createElement("video");
						videoTag.setAttribute("id", "videoElement");
						config.parent.appendChild(videoTag);
					} else {
						config.parent.innerHTML = "<object id='__nmpcbrowserplugin' type='application/x-nmpcbrowserplugin'><param name='onload' value='onJSBridgeAvailable'/></object>";
						startPluginLoadedTimeout();
					}
				}

			} else {
				videoTag = config.videoTag;
				startPluginLoadedTimeout();
			}

			/**
			 * Returns the duration in seconds, see HTML5 specification for more info
			 * @property {Number} duration
			 * @readonly
			 */
			Object.defineProperty(this, "duration", {
				get: function () {
					if (me._platform === "NMP_PLUGIN") {
						return me._video.duration / 1000;
					}
					return me._video.duration;
				}
			});

			/**
			 * Sets or returns the current position in seconds, see HTML5 specification for more info
			 * @property {Number} currentTime
			 */
			Object.defineProperty(this, "currentTime", {
				get: function () {
					return this.trickplay.getPlaybackPosition();
				},
				set: function (pos) {
					if (me._platform === "NMP_PLUGIN") {
						me._video.currentTime = pos * 1000;
					} else {
						me._video.currentTime = pos;
					}
				}
			});

			/**
			 * Returns an IHTMLMediaError object with a code property representing the current error state of the media element.
			 * Returns null if no error
			 * @property {Object} error
			 */
			Object.defineProperty(this, "error", {
				get: function () {
					return me._video.error;
				},
				configurable: true
			});

			/**
			 * Sets or gets the address or URL of the a media resource.
			 * @property {String} src
			 */
			Object.defineProperty(this, "src", {
				get: function () {
					var currentSrc = me._video.src;
					if (currentSrc && currentSrc.indexOf("originalUrl=") !== -1) {
						currentSrc = currentSrc.split("originalUrl=")[1];
					}
					return currentSrc;
				},
				set: function (url) {
					//We're in the NMP player, so we have to translate
					if ($N.env.platform === "IOS" || $N.env.platform === "ANDROID") {
						userAgent.translatePlaylistUrl(url, "$N.platform.output.NagraMediaElement._onTranslateCompleteCallback");
					} else {
						me._video.src = url;
						if (me._autoPlay) {
							me._video.play();
						}
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
					var currentSrc = me._video.currentSrc;
					if (currentSrc && currentSrc.indexOf("originalUrl=") !== -1) {
						currentSrc = currentSrc.split("originalUrl=")[1];
					}
					return currentSrc;
				}
			});

			/**
			 * Gets the current network activity for the element.
			 * @property {Number} networkState
			 */
			Object.defineProperty(this, "networkState", {
				get: function () {
					return me._video.networkState;
				}
			});

			/**
			 * Gets or sets a hint to how much buffering is advisable for a media resource, even if auto-play is not specified
			 * @property {Object} preload
			 */
			Object.defineProperty(this, "preload", {
				get: function () {
					if (me._platform !== "NMP") {
						return me._video.preload;
					}
					//not supported in NMP?
				},
				set: function () {
					//TODO:
				}
			});

			/**
			 * Gets a collection of buffered time ranges... Not currently supported...
			 * @property {Object} buffered
			 * @readonly
			 */
			Object.defineProperty(this, "buffered", {
				get: function () {
					//not supported in NMP
				}
			});

			/**
			 * Returns the readiness state of a TextTrack with values that let you determine whether the track is loaded, is loading, or failed to load
			 * @property {Number} readyState
			 * @readonly
			 */
			Object.defineProperty(this, "readyState", {
				get: function () {
					return me._video.readyState;
				}
			});

			/**
			 * Gets a flag that indicates whether the the client is currently moving to a new playback position in the media resource.
			 * @property {Boolean} seeking
			 * @readonly
			 */
			Object.defineProperty(this, "seeking", {
				get: function () {
					//not supported in NMP
				}
			});

			/**
			 * Returns the text track cue start time in seconds... Not currently supported...
			 * @property {Number} startTime
			 * @readonly
			 */
			Object.defineProperty(this, "startTime", {
				get: function () {
					//not supported in NMP
				}
			});

			/**
			 * Gets a flag that specifies whether playback is paused.
			 * @property {Boolean} paused
			 * @readonly
			 */
			Object.defineProperty(this, "paused", {
				get: function () {
					return me._video.paused;
				}
			});

			/**
			 * Gets or sets the default playback rate when the user is not using fast forward or reverse for a video or audio resource.
			 * @property {Number} defaultPlaybackRate
			 */
			Object.defineProperty(this, "defaultPlaybackRate", {
				get: function () {
					//not supported in NMP
					if (me._platform === "NMP") {
						return 1;
					}
					return me._video.defaultPlaybackRate;
				},
				set: function (rate) {
					if (me._platform !== "NMP") {
						me._video.defaultPlaybackRate = rate;
					}
				}
			});

			/**
			 * Gets or sets the current speed for the media resource to play. This speed is expressed as a multiple of the normal speed of the media resource.
			 * @property {Number} playbackRate
			 */
			Object.defineProperty(this, "playbackRate", {
				get: function () {
					//not supported in NMP
					if (me._platform === "NMP") {
						return 1;
					}
					return me._video.playbackRate;
				},
				set: function (rate) {
					if (me._platform !== "NMP") {
						me._video.playbackRate = rate;
					} //TODO: this should be passed to trick play object
				}
			});

			/**
			 * Gets TimeRanges for the current media resource that has been played... Not currently supported...
			 * @property {Object} played
			 */
			Object.defineProperty(this, "played", {
				get: function () {
					//not supported in NMP
				}
			});

			/**
			 * Returns a TimeRanges object that represents the ranges of the current media resource that can be seeked... Not currently supported...
			 * @property {Object} seekable
			 */
			Object.defineProperty(this, "seekable", {
				get: function () {
					//not supported in NMP
				}
			});

			/**
			 * Returns true if the content has reached the end, see HTML5 specification for more info
			 * @property {Boolean} ended
			 */
			Object.defineProperty(this, "ended", {
				get: function () {
					return me._video.ended;
				}
			});

			/*
			 * kept for backwards compatibility
			 */
			Object.defineProperty(this, "autoPlay", {
				get: function () {
					return me.autoplay;
				},
				set: function (autoPlay) {
					me.autoplay = autoPlay;
				}
			});

			/**
			 * Gets or sets a value that indicates whether to start playing the media automatically.
			 * @property {Boolean} autoplay
			 */
			Object.defineProperty(this, "autoplay", {
				get: function () {
					return me._autoPlay;
				},
				set: function (autoPlay) {
					me._video.autoplay = autoPlay ? true : false;
					me._autoPlay = autoPlay;
				}
			});

			/**
			 * Gets or sets a flag that specifies whether playback should restart after it completes.
			 * @property {Boolean} loop
			 */
			Object.defineProperty(this, "loop", {
				get: function () {
					return me._video.loop;
				},
				set: function (loop) {
					me._video.loop = loop;
				}
			});

			/**
			 * Gets or sets a flag that indicates whether the client provides a set of controls for the media (in case the developer does not include controls for the player).
			 * @property {Boolean} controls
			 */
			Object.defineProperty(this, "controls", {
				get: function () {
					return me._video.controls;
				},
				set: function (controls) {
					me._video.controls = controls;
				}
			});

			/**
			 * Gets or sets the volume level for audio portions of the media element... Not currently supported...
			 * @property {Number} volume
			 */
			Object.defineProperty(this, "volume", {
				get: function () {
					//not supported in NMP
				}
			});

			/**
			 * Gets or sets a flag that indicates whether the audio (either audio or the audio track on video media) is muted... Not currently supported...
			 * @property {Boolean} muted
			 */
			Object.defineProperty(this, "muted", {
				get: function () {
					//not supported in NMP
				},
				set: function (mute) {
					//not supported in NMP
				}
			});

			/**
			 * Gets or sets the width of the video element.
			 * @property {Number} width
			 */
			Object.defineProperty(this, "width", {
				get: function () {
					if (me._videoTag) {
						return me._videoTag.width;
					}
					return me._video.width;
				},
				set: function (width) {
					if (me._videoTag) {
						me._videoTag.width = width;
					} else {
						me._video.width = width;
					}
				}
			});

			/**
			 * Gets or sets the height of the video element.
			 * @property {Number} height
			 */
			Object.defineProperty(this, "height", {
				get: function () {
					if (me._videoTag) {
						return me._videoTag.height;
					}
					return me._video.height;
				},
				set: function (height) {
					if (me._videoTag) {
						me._videoTag.height = height;
					} else {
						me._video.height = height;
					}
				}
			});

			/**
			 * Gets the intrinsic width of a video in CSS pixels, or zero if the dimensions are not known.
			 * @property {Number} videoWidth
			 * @readonly
			 */
			Object.defineProperty(this, "videoWidth", {
				get: function () {
					return me._video.videoWidth || 0; //not supported in NMP
				}
			});

			/**
			 * Gets the intrinsic height of a video in CSS pixels, or zero if the dimensions are not known.
			 * @property {Number} videoHeight
			 * @readonly
			 */
			Object.defineProperty(this, "videoHeight", {
				get: function () {
					return me._video.videoHeight || 0; //not supported in NMP
				}
			});

			/**
			 * Gets or sets a URL of an image to display, for example, like a movie poster.
			 * This can be a still frame from the video, or another image if no video data is available.
			 * @property {String} poster
			 */
			Object.defineProperty(this, "poster", {
				get: function () {
					return me._video.poster;
				}
			});

			this._eventLookup = {};

			/**
			 * Trick play object to allow setting of trick play options
			 * @property {Object} trickplay
			 */
			this.trickplay = new $N.platform.output.SeekTrickPlay(this._video, $N.env.platform);

			this.trickplay.setPlayerAtBeginningCallback(function () {
				me._fireEvent("beginning");
				me.play();
			});
			this.trickplay.setPlayerAtEndCallback(function () {
				me.currentTime = me.duration - 1;
				me.play();
			});
			this.trickplay.setUpdateCallback(function () {
				//me._fireEvent("seeking"); //TODO: decide if we should have a trickplay event
				me._fireEvent("timeupdate");
			});
			//this.trickplay.setUIRefreshCallback(function () {
				//TODO: hook into the rate change event
			//});
			if ((config.forceHTML && !config.videoTag) ||
					config.videoTag ||
					$N.platform.output.NagraMediaElement._jsBridgeFired ||
					(navigator.userAgent.indexOf('Android') !== -1 && window.videoAgent) ||
					(navigator.userAgent.indexOf('Android') === -1 && window.userAgent)) {
				window.onJSBridgeAvailable = function () {};
				setTimeout(videoLoaded, 100);
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
	                callback(payload || null);
	            });
	        }
	    };

		/**
		 * Returns a string that specifies whether the client can play a given media resource type.
		 * @method canPlayType
		 * @param {String} type
		 * @param {String} canPlay
		 */
		proto.canPlayType = function (type, canPlay) {
			//may not be supported on NMP
			return this._video.canPlayType(type, canPlay);
		};

		/**
		 * Resets the MediaElement and loads a new media resource.
		 * @method load
		 */
		proto.load = function () {
			log("load", "enter");
			log("load", "exit");
			return this._video.load();
		};

		/**
		 * Loads and starts playback of a media resource.
		 * @method play
		 */
		proto.play = function () {
			log("play", "enter");
			this.trickplay.play();
			log("play", "exit");
		};

		/**
		 * Pauses the current playback and sets `paused` to true.
		 * @method pause
		 */
		proto.pause = function () {
			log("pause", "enter");
			this.trickplay.pause();
			log("pause", "exit");
		};

		/**
		 * Stops the current playback
		 * @method stop
		 */
		proto.stop = function () {
			var interruptLoadingString = ".";
			log("stop", "enter");
			this.trickplay.stopTrickPlay();
			if ($N.env.platform === "ANDROID") {
				// Android exits video automatically
				if (window.videoAgent) {
					window.videoAgent.stop();
				}
			} else if ($N.env.platform === "IOS") {
				this.setAttribute('src', interruptLoadingString);
			} else {
				this.src = "";
			}
			log("stop", "exit");
		};

		/**
		 * Cycles through the fast forward speeds defined in the trickplay object property
		 * @method fastForward
		 */
		proto.fastForward = function () {
			log("fastForward", "enter");
			this.trickplay.fastForward();
			log("fastForward", "exit");
		};

		/**
		 * Cycles through the rewind speeds defined in the trickplay object property
		 * @method rewind
		 */
		proto.rewind = function () {
			log("rewind", "enter");
			this.trickplay.rewind();
			log("rewind", "exit");
		};

		/**
		 * Sets the value of a given attribute on the video element
		 * @method setAttribute
		 */
		proto.setAttribute = function (attr, value) {
			return this._video.setAttribute(attr, value);
		};

		/**
		 * Registers a callback for a given event name
		 * @method addEventListener
		 * @param {String} eventName name of the event
		 * @param {Function} callback the listener
		 * @param {Boolean} bubbles
		 */
		proto.addEventListener = function (eventName, callback, bubbles) {
			this._addEventListener(eventName, callback, bubbles);
			switch (eventName) {
			case "beginning":
				//do nothing new event
				break;
			default:
				if (this._video.attachEvent) {
					return this._video.attachEvent("on" + eventName, callback);
				}
				return this._video.addEventListener(eventName, callback, bubbles);
			}
		};

		/**
		 * Unregisters a callback for a given event name
		 * @method removeEventListener
		 */
		proto.removeEventListener = function (eventName, callback, bubbles) {
			this._removeEventListener(eventName, callback, bubbles);
			if (this._video.detachEvent) {
				return this._video.detachEvent("on" + eventName, callback);
			}
			return this._video.removeEventListener(eventName, callback, bubbles);
		};

		/**
		 * Attempts to enter fullscreen mode. Depending on the platform, this method may need to be triggered by a user action.
		 * Does not currently support NMP Browser Plugin for Mac or IE version < 10.
		 * @method enterFullScreen
		 */
		proto.enterFullScreen = function () {
			var videoElement = document.getElementById("videoElement");
			if ($N.env.platform === "NMP_PLUGIN") {
				window.userAgent.fullScreen = true;
			} else if (videoElement) {
				if (videoElement.requestFullscreen) {
					videoElement.requestFullscreen();
				} else if (videoElement.msRequestFullscreen) {
					videoElement.msRequestFullscreen();
				} else if (videoElement.mozRequestFullScreen) {
					videoElement.mozRequestFullScreen();
				} else if (videoElement.webkitRequestFullScreen) {
					videoElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
					if (!document.webkitCurrentFullScreenElement) {
						videoElement.webkitRequestFullScreen();
					}
				} else if (videoElement.webkitEnterFullscreen) {
					videoElement.webkitEnterFullscreen();
				}else {
					log("enterFullScreen", "Browser / platform does not support this operation");
				}
			} else {
				log("enterFullScreen", "No video tag found");
			}
		};

		/**
		 * Attempts to exit fullscreen mode. Depending on the platform, this method may need to be triggered by a user action.
		 * @method exitFullScreen
		 */
		proto.exitFullScreen = function () {
			if ($N.env.platform === "NMP_PLUGIN") {
				window.userAgent.fullScreen = false;
			} else {
				if (document.exitFullscreen) {
					document.exitFullscreen();
				} else if (document.msExitFullscreen) {
					document.msExitFullscreen();
				} else if (document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				} else if (document.webkitExitFullscreen) {
					document.webkitExitFullscreen();
				} else {
					log("exitFullScreen", "Browser / platform does not support this operation");
				}
			}
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
		 * Dispatched when data for a stream starts loading
		 * @event loadstart
		 */

		/**
		 * Dispatched when data for a stream is being buffered
		 * @event progress
		 */

		/**
		 * Dispatched when data is intentionally not being buffered
		 * @event suspend
		 */

		/**
		 * Dispatched when an error occurs while fetching media data
		 * @event error
		 */

		/**
		 * Dispatched when enough data has been buffered at the current playback position for the first time
		 * @event loadeddata
		 */

		/**
		 * Dispatched when a stream starts playback from the beginning
		 * @event beginning
		 */

		/**
		 * Dispatched when playback can be resumed. However, further buffering may be required.
		 * @event canplay
		 */

		/**
		 * Dispatched when enough data has been buffered for playback to be completed without
		 * further buffering.
		 * @event canplaythrough
		 */

		/**
		 * Dispatched when playback is ready to start after having been paused or delayed due to buffering
		 * @event playing
		 */

		/**
		 * Dispatched when playback is occurring
		 * @event play
		 */

		/**
		 * Dispatched when playback has been paused
		 * @event pause
		 */

		/**
		 * Dispatched when either the defaultPlaybackRate or playbackRate has just been updated
		 * @event ratechange
		 */

		/**
		 * Dispatched when playback cannot continue due to lack of media data. The player will continue its
		 * ongoing buffering effort.
		 * @event waiting
		 */

		/**
		 * Dispatched when the desired playback position is being sought
		 * @event seeking
		 */

		/**
		 * Dispatched when the desired playback position has been sought
		 * @event seeked
		 */

		/**
		 * Dispatched when data for a stream begins loading
		 * @event timeupdate
		 */

		/**
		 * Dispatched when media playback has ended
		 * @event ended
		 */
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.NagraMediaElement = NagraMediaElement;
		return NagraMediaElement;
	}
);

function onJSBridgeAvailable() {
	$N.platform.output.NagraMediaElement._jsBridgeFired = true;
}
