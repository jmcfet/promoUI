/*global jQuery, $, window, userAgent*/
/**
 * Extension of the NagraMediaElement class to offer an API that accepts content objects from different
 * sources, currently BTV Channel, VOD Asset, startover/catchup event or recording. The class currently features optional plug-in components for DRM
 * licence management for transparent play back of encrypted content. This is an advertising module that will
 * add pre/post and mid roll adverts to the content in the form of a play list, with adverts played at the appropriate times.
 * Additional methods and events support UI feedback such as when adverts can be skipped.
 *
 * @class $N.platform.output.PlayoutManager
 * @extends $N.platform.output.NagraMediaElement
 * @constructor
 * @param {Object} config
 * @requires $N.apps.core.Log
 * @requires $N.platform.output.Adverts
 * @requires $N.platform.output.DRM
 * @requires $N.apps.util.Util
 * @requires $N.platform.output.NagraMediaElement
 * @requires $N.platform.output.OTTContentMapper
 * @requires $N.platform.output.GWContentMapper
 */

define('jsfw/platform/output/PlayoutManager',
    [
    	'jsfw/apps/core/Log',
    	'jsfw/apps/util/Util',
    	'jsfw/platform/output/DRM',
    	'jsfw/platform/output/NagraMediaElement',
    	'jsfw/platform/output/OTTContentMapper',
    	'jsfw/platform/output/GWContentMapper',
    	'jsfw/Config'
    ],
	function (Log, Util, DRM, NagraMediaElement, OTTContentMapper, GWContentMapper, Config) {
		'use strict';

		var log = new $N.apps.core.Log("output", "PlayoutManager"),
			adverts = null,
			CONTENT_TYPE = {
				'BTV': 1,
				'VOD': 2,
				'RECORDING' : 3
			},
			videoPath = "",
			socuVideoPath = "",
			listenersRegistered = false,
			ottContentMapper,
			gwContentMapper,
			contentMappers = [],
			pluginLookup = {},
			sessionsEnabled;


		function PlayoutManager(inConfig) {
			var me = this,
				i,
				config = inConfig || {},
				configVideoLoadedCallback = config.videoLoadedCallback || function () {},
				videoLoadedCallback = function () {
					if (inConfig.adverts) {
						require(['jsfw/platform/output/Adverts'], function (Adverts) {
							adverts = new $N.platform.output.Adverts(me);
						});
					}

					sessionsEnabled = inConfig.sessionsEnabled;
					if (inConfig.contentMappers) {
						contentMappers = inConfig.contentMappers;
						for (i = 0; i < contentMappers.length; i++) {
							if (contentMappers[i].setVideoPath) {
								ottContentMapper = contentMappers[i];
							}
						}
					} else {
						contentMappers = [ottContentMapper, gwContentMapper];
					}

					if ($N.Config.DRM) {
						me.drm = new $N.platform.output.DRM({platform: $N.env.platform, playoutManager: me});
						me.drm.registerErrorListener(function (error) {
							me._drmError = error;
							me._fireEvent("error", {code: me._drmError});
						});
					}

					if (inConfig.plugins && inConfig.plugins.length > 0) {
						for (i = 0; i < inConfig.plugins.length; i++) {
							pluginLookup[inConfig.plugins[i].name] = inConfig.plugins[i].plugin;
							inConfig.plugins[i].plugin.init(me, inConfig.plugins[i].initParams);
							inConfig.plugins[i].plugin.start();
						}
					}

					me._nagraMediaElementError = me.error;

					PlayoutManager.superClass.addEventListener.call(me, "error", function () {
						log('error', 'video error');
						me._fireEvent("error");
					});

					if (configVideoLoadedCallback) {
						configVideoLoadedCallback();
					}
				};

			config.videoLoadedCallback = videoLoadedCallback;
			ottContentMapper = new $N.platform.output.OTTContentMapper();
			gwContentMapper = new $N.platform.output.GWContentMapper();


			PlayoutManager.superConstructor.call(this, config);

			this._playingContentMapper = null;
			this._startPosition = -1;
			this._eventListeners = {};
			this._drmError = 0;
			this._contentMapperError = 0;

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
					me._drmError = 0;
					//We're in the NMP player, so we have to translate
					if ($N.env.platform === "IOS" || ($N.env.platform === "ANDROID" && (!window.videoAgent))) {
						userAgent.translatePlaylistUrl(url, "$N.platform.output.NagraMediaElement._onTranslateCompleteCallback");
					} else if ($N.env.platform === "SAMSUNG") {
						if (url.indexOf(".m3u8") !== -1) {
							url = url + "|COMPONENT=HLS";
						}
						if (me._video.status === me._playerStates.STARTED || me._video.status === me._playerStates.PAUSED) {
							me._video.stop();
						}
						me._video.open(url);
						me._currentTime = 0;
						if (me._autoPlay) {
							me._video.play(function () {
								me._fireEvent('canplay');
								me._playingSuccesful();
							}, me._playingFailed);
						}
					} else if ($N.env.platform === "OTV5_0") {
						me.tuner.tune(url);
					} else {
						me._video.src = url;
						if (me._autoPlay) {
							me._video.play();
						}
					}
				}
			});

			/**
			 * Returns an IHTMLMediaError object containing a code property representing the current error state of the media element
			 * Codes are defined either in the ERROR_CODES property or one of the submodules (ie. DRM)
			 * Returns null if no error
			 * @property {Object} error
			 */
			Object.defineProperty(this, "error", {
				get: function () {
					if (me._drmError) {
						return {code: me._drmError};
					} else if (me._contentMapperError) {
						return {code: me._contentMapperError};
					}
					return me._nagraMediaElementError;
				}
			});

			/**
			 * Called when the ended event is fired
			 * @method _endedListener
			 * @private
			 * @param {Object} event
			 */
			this._endedListener = function (event) {
				if (me._playingContentMapper && me._playingContentMapper.tearDownSession) {
					me._playingContentMapper.tearDownSession();
				}
				me._fireEvent('contentPlaybackStopped', event);
			};

			/**
			 * Called when the canplay event is fired
			 * @method _canplayListener
			 * @private
			 */
			this._canplayListener = function () {
				if (me._autoPlay) {
					me._play();
				}
			};
		}

		$N.apps.util.Util.extend(PlayoutManager, $N.platform.output.NagraMediaElement);
		var proto = PlayoutManager.prototype;

		/**
		 * Fires the given event withn the given payload data
		 * @method _fireEvent
		 * @private
		 * @param {String} eventName
		 * @param {Object} payload
		 */
		proto._fireEvent = function (eventName, payload) {
			log("_fireEvent", eventName);
			if (eventName === "error") {
				if (this._eventListeners[eventName]) {
					this._eventListeners[eventName].forEach(function (callback) {
						callback(payload || null);
					});
				}
			} else {
				PlayoutManager.superClass._fireEvent.call(this, eventName, payload);
			}
		};

		/**
		 * Registers a callback for a given event name.
		 * Overrides the addEventListener in NagraMediaElement
		 * @method addEventListener
		 * @param {String} eventName name of the event
		 * @param {Function} callback the listener
		 * @param {Boolean} bubbles
		 */
		proto.addEventListener = function (eventName, callback, bubbles) {
			if (eventName === "error") {
				if (!this._eventListeners[eventName]) {
					this._eventListeners[eventName] = [];
				}
				this._eventListeners[eventName].push(callback);
			} else {
				PlayoutManager.superClass.addEventListener.call(this, eventName, callback, bubbles);
			}
		};

		/**
		 * Unregisters a callback for a given event name
		 * @method removeEventListener
		 * @param {String} eventName name of the event
		 * @param {Function} callback the listener
		 */
		proto.removeEventListener = function (eventName, callback) {
			if (eventName === "error") {
				if (this._eventListeners[eventName]) {
					this._eventListeners[eventName] = this._eventListeners[eventName].filter(function (value) { return value !== callback; });
				}
			} else {
				PlayoutManager.superClass.removeEventListener.call(this, eventName, callback);
			}

		};

		/**
		 * Registers the required listeners with the player
		 * @method _registerListeners
		 * @private
		 */
		proto._registerListeners = function () {
			var me = this;
			if (!listenersRegistered) {
				me.addEventListener("canplay", this._canplayListener);
				me.addEventListener("ended", this._endedListener);
				listenersRegistered = true;
			}
		};

		/**
		 * Unregisters the required listeners with the player
		 * @method _unregisterListeners
		 * @private
		 */
		proto._unregisterListeners = function () {
			var me = this;
			if (listenersRegistered) {
				me.removeEventListener("canplay", this._canplayListener);
				me.removeEventListener("ended", this._endedListener);
				listenersRegistered = false;
			}
		};

		/**
		 * Sets the start playback position for samsung
		 * @method _setStartTimeForSamsung
		 * @private
		 * @param {Number} position
		 */
		proto._setStartTimeForSamsung = function (position) {
			var me = this;
			if (this._video.status === 4) {
				setTimeout(function () {
					me.currentTime = parseInt(me._playingContentMapper.startTime, 10);
				}, 2000);
			} else {
				setTimeout(function () {
					me._setStartTimeForSamsung(position);
				}, 1000);
			}

		};

		/**
		 * Plays back a list item from the beginning or from a previously saved position.
		 * @method _play
		 * @private
		 */
		proto._play = function () {
			var eventPayload = {
				target: this
			};
			if (this._startPosition > -1) {
				if ($N.env.platform === "SAMSUNG") {
					this._setStartTimeForSamsung(this._startPosition);
				} else {
					this.currentTime = parseInt(this._startPosition, 10);
				}
			}
			this.play();
			eventPayload.content = this._playingContentMapper.getContent();
			eventPayload.playbackPosition = this.currentTime;
			this._fireEvent('contentPlaybackStarted', {});
		};

		/**
		 * Plays the given content mapper object
		 * @method _playContentMapperObject
		 * @private
		 */
		proto._playContentMapperObject = function (contentMapper, position) {
			var eventPayload = {},
				me = this,
				beginPlayback = function (response) {
				if (response === true) {
					if (position) {
						me._startPosition = position;
					}
					if (me.drm) {
						me.drm.playContent(contentMapper);
					} else {
						me.src = contentMapper.getUri();
						me.load();
					}
					eventPayload.content = contentMapper.getContent();
					eventPayload.playbackPosition = me.currentTime;
					me._fireEvent('contentPlaybackStarted', eventPayload);
				} else {
					me._contentMapperError = response;
					me._fireEvent("error", {code: response});
				}
			};
			this._contentMapperError = 0;
			if (contentMapper.prePlaybackCheck) {
				contentMapper.prePlaybackCheck(beginPlayback, sessionsEnabled);
			} else {
				beginPlayback(true);
			}
		};

		/**
		 * Sets the video path that is prefixed a URL if the filename provided by the
		 * content object doesn't contain the full path
		 * @method setVideoPath
		 * @param {String} path
		 */
		proto.setVideoPath = function (path) {
			ottContentMapper.setVideoPath(path || "");
		};

		/**
		 * Sets the SOCU (startover and catch up) video path that is prefixed to a URL if the filename provided by the
		 * content object doesn't contain the full path
		 * @method setSOCUVideoPath
		 * @param {String} path
		 */
		proto.setSOCUVideoPath = function (path) {
			ottContentMapper.setSOCUVideoPath(path || "");
		};

		/**
		 * Sets the (harmonic) video path that is prefixed a URL if the filename provided by the
		 * content object doesn't contain the full path
		 * @method setHarmonicVideoPath
		 * @param {String} path
		 */
		proto.setHarmonicVideoPath = function (path) {
			ottContentMapper.setHarmonicVideoPath(path || "");
		};

		/**
		 * Starts video play back for the given content object
		 * @method playContent
		 * @param {Object} content e.g. VOD Asset, Channel or catch up item that is to be played
		 * @param {Number} position Start position in seconds. Will start from beginning if not passed
		 * @param {Object} customContentMapperObj Optional object that will be passed on to isPlayableType method of content mappers
		 */
		proto.playContent = function (content, position, customContentMapperObj) {
			var me = this,
				advertsSupported = false,
				i,
				contentMapperForContent = null;
			log("playContent ", "Enter");
			this._startPosition = position || -1;
			this._playingContentMapper = {};

			for (i = 0; i < contentMappers.length; i++) {
				if (contentMappers[i].isPlayableType(content, customContentMapperObj)) {
					if (contentMappers[i].doesSupportAds(content)) {
						advertsSupported = true;
					}
					contentMapperForContent = contentMappers[i];
					break;
				}
			}
			if (contentMapperForContent) {
				this._playingContentMapper = contentMapperForContent;
				if (adverts && advertsSupported) {
					adverts.playContent(contentMapperForContent, position);
				} else {
					if (adverts) {
						adverts.unregisterListeners();
					}
					this._registerListeners();
					this._playContentMapperObject(contentMapperForContent);
				}
			}

		};

		/**
		 * Returns the plugin for the given name.
		 * @method getPluginByName
		 * @param {String} name
		 * @return {Object} plugin instance or null if there is no plugin for the given name
		 */
		proto.getPluginByName = function (name) {
			if (pluginLookup[name]) {
				return pluginLookup[name];
			}
			return null;
		};

		/*
		 * Returns the content type enumeration
		 */
		proto.CONTENT_TYPE = CONTENT_TYPE;
		/*
		 * Returns the content type
		 * @method getContentType
		 * @return {Number} one of 'CONTENT_TYPE.VOD' or 'CONTENT_TYPE.BTV' or `CONTENT_TYPE.RECORDING' or null if content type is not recognised.
		 */
		proto.getContentType = function () {
			if (this._playingContentMapper) {
				return CONTENT_TYPE[this._playingContentMapper.getContentType()];
			}
			return null;
		};

		/**
		 * Skips an advert if one is currently playing and its skip policy allows it. Should be
		 * called in response to the `canSkipAdvert` event. Doesn't do anything if an
		 * advert is not currently playing.
		 * @method skip
		 */
		proto.skip = function () {
			log("skip", "Enter");
			if (adverts) {
				adverts.skip();
			}
			log("skip", "Exit");
		};

		/**
		 * Restarts the playlist.
		 * @method restart
		 */
		proto.restart = function () {
			log("restart ", "Enter");
			if (adverts) {
				adverts.restart();
			}
			log("restart ", "Exit");
		};

		/**
		 * Get the list of ad insertion points for the content requested in playContent
		 * @method getAdInsertionPoints
		 * @return {Array} list of ad insertion point objects, each containing two attributes:
		 * `time` (the time (in seconds) at which ads will start) and `count` (the
		 * number of ads starting at `time`)
		 */
		proto.getAdInsertionPoints = function () {
			if (adverts) {
				adverts.getAdInsertionPoints();
			}
			return [];
		};

		/**
		 * Stops the current playback
		 * @method stop
		 */
		proto.stop = function () {
			if (this._playingContentMapper && this._playingContentMapper.tearDownSession) {
				this._playingContentMapper.tearDownSession();
			}
			PlayoutManager.superClass.stop.call(this);
		};

		/**
		 * Defines constants for error codes
		 * one of UNKNOWN_ERROR, MAX_DEVICES_REACHED, SESSION_LIMIT_REACHED, SESSION_INVALID_CONTENT_ID, SESSION_NOT_SUBSCRIBED, SESSION_NOT_SIGNED_ON
		 * @property {Number} ErrorType
		 */
		proto.ERROR_CODES = {
			UNKNOWN_ERROR: 1000,
			MAX_DEVICES_REACHED: 1001,
			SP_SESSION_LIMIT_REACHED: 83953,
			SESSION_INVALID_CONTENT_ID: 83955,
			SESSION_NOT_SUBSCRIBED: 83956,
			SESSION_NOT_SIGNED_ON: 83909,
			SESSION_LIMIT_REACHED: 83914
		};

		/**
		 * Dispatched when the content starts or resumes playing
		 * @event contentPlaybackStarted
		 */

		/**
		 * Dispatched when the content stops playing
		 * @event contentPlaybackStopped
		 */

		/**
		 * Dispatched when an advert starts playing
		 * @event advertStarted
		 */

		/**
		 * Dispatched when an advert finishes playing
		 * @event advertEnded
		 */

		/**
		 * Dispatched when an advert can be skipped
		 * @event canSkipAdvert
		 */

		/**
		 * Dispatched when initial play back starts, whether that be for an
		 * advert or main content.
		 * @event playListStarted
		 */

		/**
		 * Dispatched when the all play back including any adverts has finished
		 * @event playListEnded
		 */

		/**
		 * jQuery Plug-in method
		 * @method PlayoutManager
		 */
		if (window.jQuery) {
			jQuery.fn.PlayoutManager = function () {
				return new PlayoutManager({videoTag: this[0]});
			};
		}

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.PlayoutManager = PlayoutManager;
		return PlayoutManager;
	}
);
