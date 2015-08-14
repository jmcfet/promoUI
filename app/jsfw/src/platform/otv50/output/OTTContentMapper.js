/**
 * Contains logic for mapping an OTT object to a playable object for playout manager
  *
 * @class $N.platform.output.OTTContentMapper
 * @constructor
 *
 * @author Gareth Stacey
 */
/* global $N, define, window */
define('jsfw/platform/output/OTTContentMapper',
    [
		'jsfw/apps/core/Log',
		'jsfw/services/sdp/ServiceFactory',
		'jsfw/Config'
    ],
	function (Log, ServiceFactory, Config) {
		'use strict';

		var log = new $N.apps.core.Log("output", "OTTContentMapper"),
			contentObj,
			videoPath,
			socuVideoPath,
			contentType,
			harmonicVideoPath,
			ottSessionService;

		function OTTContentMapper() {
			this.activeSession = null;
			this.sessionsEnabled = null;
		}

		function prependUrlWithVideo(url, path) {
			if (url.indexOf('://') === -1) {
				return path + url;
			}
			return url;
		}

		function getContentIdentifiers() {
			var identifiers = null;
			switch (contentType) {
			case "VOD":
				if (contentObj.id) {
					identifiers = {
						id: contentObj.id,
						type: "AST"
					};
				}
				break;
			case "BTV":
				if (contentObj.serviceId) {
					identifiers = {
						id: contentObj.serviceId,
						type: "CHN"
					};
				}
				break;
			}
			return identifiers;
		}

		var proto = OTTContentMapper.prototype;

		/**
		 * Returns true if the given content can be played using this content mapper
		 * @method isPlayableType
 		 * @param {Object} content
 		 * @return {Boolean}
		 */
		proto.isPlayableType = function (content) {
			if ((content.serviceId || content.media || content.fileName || content.isNPVRRecording) && !(content._data && content._data.defaultPlaybackInfo)) {
				contentObj = content;
				if (content.isNPVRRecording) {
					contentType = "RECORDING";
				} else if (content.serviceId) {
					contentType = "BTV";
				} else {
					contentType = "VOD";
				}
				return true;
			}
			return false;
		};

		/**
		 * Executes pre-playback tasks and triggers the provided callback if successful.
		 * @method prePlaybackCheck
		 * @param {Function} callback - Callback to execute if successful
		 * @param {Boolean} sessionsEnabled - States if session functionality is to be used
		 */
		proto.prePlaybackCheck = function (callback, sessionsEnabled) {
			var me = this,
				tearDownCallback = function (result) {
					if (result === false) {
						log('prePlaybackCheck', 'Failed to tear down session. Attempting new session creation');
					}
					me._createSession(callback);
				};

			this.sessionsEnabled = sessionsEnabled;
			if (this.sessionsEnabled) {
				if (this.activeSession) {
					this.tearDownSession(tearDownCallback);
				} else {
					this._createSession(callback);
				}
			} else {
				callback(true);
			}
		};

		/**
		 * Attempts to tear down the existing active session
		 * @method tearDownSession
		 * @param {Function} callback - Callback to execute when complete or in case of failure
		 */
		proto.tearDownSession = function (callback) {
			var success = function (data) {
					this.activeSession = null;
					if (callback) {
						callback(true);
					}
				},
				failure = function (error) {
					log('tearDownSession', 'Failed to tear down session. Error: ' + error);
					if (callback) {
						callback(false);
					}
				};

			if (this.sessionsEnabled) {
				callback = callback || function () {};
				if (this.activeSession) {
					ottSessionService.tearDown(this, success, failure, this.activeSession);
				} else {
					log('tearDownSession', 'No active session to tear down');
					if (callback) {
						callback(false);
					}
				}
			}
		};

		/**
		 * Attempts to create a new session for the currently set content object
		 * @method _createSession
		 * @private
		 * @param {Function} callback - Callback to execute when complete or in case of failure
		 */
		proto._createSession = function (callback) {
			var i,
				identifiers = getContentIdentifiers(),
				sessionErrors = [83953, 83955, 83956, 83909, 83914],
				success = function (data) {
					if (data && data.uid) {
						this.activeSession = data.uid;
					} else {
						log('_createSession', 'Created session but failed to get session ID');
					}
					callback(true);
				},
				failure = function (error) {
					if (error) {
						for (i = 0; i < sessionErrors.length; i++) {
							if (error.indexOf(sessionErrors[i]) !== -1) {
								callback(sessionErrors[i]);
								return;
							}
						}
					}
					callback(1000);
				};

			if (this.sessionsEnabled && contentType !== "RECORDING") {
				callback = callback || function () {};
				ottSessionService = $N.services.sdp.ServiceFactory.get("OttSessionService");
				if (identifiers) {
					ottSessionService.setUp(this, success, failure, identifiers.id, identifiers.type);
				} else {
					callback(83955);
				}
			}
		};

		/**
		 * Returns true if the content supports ad insertions
		 * @method doesSupportAds
 	 	 * @param {Object} content
 	 	 * @return {Boolean}
		 */
		proto.doesSupportAds = function (content) {
			if (content.media || content.fileName || content.eventId || content.isNPVRRecording) {
				return true;
			}
			return false;
		};

		/**
		 * Returns the drm id for the content set with isPlayableType for encrypted playback
		 * @method getDRMId
		 * @return {String} the drm id
		 */
		proto.getDRMId = function () {
			if (contentObj.media) {
				if (contentObj.media.AV_PlaylistName) {
					return contentObj.media.AV_PlaylistName.drmId;
				} else if (contentObj.media.AV_HarmonicOSPlaylistName) {
					return contentObj.media.AV_HarmonicOSPlaylistName.drmId;
				}
			} else if (contentObj.serviceId || contentObj.isNPVRRecording) {
				return contentObj.casId;
			} else if (contentObj.fileName) {
				return contentObj.casId;
			}
			return null;
		};

		/**
		 * Returns the uri for playback
		 * @method getUri
		 * @return {String} the uri
		 */
		proto.getUri = function () {
			if (contentObj.isNPVRRecording) {
				return prependUrlWithVideo(contentObj.url, harmonicVideoPath);
			} else if (contentObj.serviceId || contentObj.impressions) {
				return contentObj.uri;
			} else if (contentObj.media && contentObj.media.AV_PlaylistName && contentObj.media.AV_PlaylistName.fileName) {
				return prependUrlWithVideo(contentObj.media.AV_PlaylistName.fileName, videoPath);
			} else if (contentObj.media && contentObj.media.AV_HarmonicOSPlaylistName && contentObj.media.AV_HarmonicOSPlaylistName.fileName) {
				return prependUrlWithVideo(contentObj.media.AV_HarmonicOSPlaylistName.fileName, socuVideoPath);
			} else if (contentObj.url) {
				return prependUrlWithVideo(contentObj.url, videoPath);
			}
		};

		/**
		 * Returns the unique identify for the content
		 * @method getContentId
		 * @return {String} unique identifier for content
		 */
		proto.getContentId = function () {
			if (contentObj.isNPVRRecording) {
				return contentObj.eventId;
			} else if (contentObj.eventId) {
				return contentObj.eventId;
			} else if (contentObj.serviceId) {
				return contentObj.serviceId;
			} else if (contentObj.technicalAsset && contentObj.technicalAsset.id) {
				return contentObj.technicalAsset.id;
			}
			return null;
		};

		/**
		 * Returns the content object that was passed into the isPlayableType method
		 * @method getContent
		 * @return {Object} the content object
		 */
		proto.getContent = function () {
			return contentObj;
		};

		/**
		 * Returns the type of license retrieval method
		 * @method getLicenseMethod
		 * @return {String} the license retrieval method type
		 */
		proto.getLicenseMethod = function () {
			return "FETCH_ENTITLEMENT";
		};

		/**
		 * Sets the video path for vod content
		 * @method setVideoPath
  		 * @param {String} path
		 */
		proto.setVideoPath = function (path) {
			videoPath = path;
		};

		/**
		 * Sets the video path for startover and catchup content
		 * @method setSOCUVideoPath
  		 * @param {String} path
		 */
		proto.setSOCUVideoPath = function (path) {
			socuVideoPath = path;
		};

		/**
		 * Sets the video path for NPVR content
		 * @method setHarmonicVideoPath
		 * @param {String} path
		 */
		proto.setHarmonicVideoPath = function (path) {
			harmonicVideoPath = path;
		};

		/**
		 * Returns the type of content either "BTV", "VOD" or "RECORDING"
		 * @method getContentType
		 * @return {String}
		 */
		proto.getContentType = function () {
			return contentType;
		};

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.OTTContentMapper = OTTContentMapper;
		return OTTContentMapper;
	}
);
