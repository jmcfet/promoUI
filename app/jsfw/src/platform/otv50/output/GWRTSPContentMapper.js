/**
 * Contains logic for mapping Gateway RTSP content object to a playable object for playout manager
  *
 * @class $N.platform.output.GWRTSPContentMapper
 * @constructor
 *
 * @author Scott Dermott
 */

define('jsfw/platform/output/GWRTSPContentMapper',
    [
		'jsfw/apps/core/Log',
		'jsfw/apps/core/AjaxHandler',
		'jsfw/services/gateway/dlna/MediaDevice'
    ],
	function (Log, AjaxHandler, MediaDevice) {
		'use strict';

		var log = new $N.apps.core.Log("output", "GWRTSPContentMapper"),
			contentObj,
			customObj,
			contentType;


		function GWRTSPContentMapper() {}

		var proto = GWRTSPContentMapper.prototype;

		/**
		 * Returns true if the given content can be played using this content mapper
		 * @method isPlayableType
 		 * @param {Object} content
 		 * @return {Boolean}
		 */
		proto.isPlayableType = function (content, customObject) {
			if (customObject &&  customObject.assetId && customObject.entitlement && content) {
				contentObj = content;
				customObj = customObject;
				contentType = "VOD";
				return true;
			}
			return false;
		};

		/**
		 * Fires a callback with true if the content can be played otherwise an error code is returned
		 * @method prePlaybackCheck
		 * @async
		 * @param {Function} callback
		 * @param {Boolean} sessionsEnabled - States if session functionality is to be used
		 */
		proto.prePlaybackCheck = function (callback, sessionsEnabled) {
			var httpRequest = new $N.apps.core.AjaxHandler(),
				handle = {};
			httpRequest.responseCallback = function (xmlhttp) {
				if (xmlhttp) {
					switch (xmlhttp.status) {
					case 200 :
						callback(true);
						break;
					case 503 :
						callback(1001);
						break;
					default :
						callback(1000);
					}
				} else {
					callback(1000);
				}
			};
			httpRequest.requestData(proto.getUri(), 8000, false);
		};

		/**
		 * Returns true if the content supports ad insertions
		 * @method doesSupportAds
 	 	 * @param {Object} content
 	 	 * @return {Boolean}
		 */
		proto.doesSupportAds = function (content) {
			return false;
		};

		/**
		 * Returns the drm id for the content set with isPlayableType for encrypted playback
		 * @method getDRMId
		 * @return {String} the drm id
		 */
		proto.getDRMId = function () {
			return $N.services.gateway.dlna.MediaDevice.getLCM();
		};

		/**
		 * Returns the uri for playback
		 * @method getUri
		 * @return {String} the uri
		 */
		proto.getUri = function () {
			var dmsObj = $N.services.gateway.dlna.MediaDevice.getDMSDetails(),
				lcmID = $N.services.gateway.dlna.MediaDevice.getLCMId(),
				resCode = $N.services.gateway.dlna.MediaDevice.DEFAULT_RESOLUTION.code,
				gwHLSUrl;

			if (dmsObj && lcmID && customObj.assetId && customObj.entitlement) {
				gwHLSUrl = dmsObj.url.split(":")[1];
				return "http:" + gwHLSUrl + ":8081/VOD/" + resCode + "/master.m3u8?license=" + lcmID + "&rtsp=" + customObj.assetId + "%3fEntitlement%3d" + customObj.entitlement;
			}
			return null;
		};

		/**
		 * Returns the unique identify for the content
		 * @method getContentId
		 * @return {String} unique identifier for content
		 */
		proto.getContentId = function () {
			return customObj.assetId;
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
			return "TRANSFORM";
		};

		/**
		 * Returns the type of content
		 * @method getContentType
		 * @return {String}
		 */
		proto.getContentType = function () {
			return contentType;
		};

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.GWRTSPContentMapper = GWRTSPContentMapper;
		return GWRTSPContentMapper;
	}
);