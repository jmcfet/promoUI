/**
 * Contains logic for mapping a Gateway object to a playable object for playout manager
  *
 * @class $N.platform.output.GWContentMapper
 * @constructor
 *
 * @author Scott Dermott
 */

define('jsfw/platform/output/GWContentMapper',
    [
		'jsfw/apps/core/Log',
		'jsfw/apps/core/AjaxHandler'
    ],
	function (Log, AjaxHandler) {
		'use strict';

		var log = new $N.apps.core.Log("output", "GWContentMapper"),
			contentObj,
			contentType;


		function GWContentMapper() {}

		var proto = GWContentMapper.prototype;

		/**
		 * Returns true if the given content can be played using this content mapper
		 * @method isPlayableType
 		 * @param {Object} content
 		 * @return {Boolean}
		 */
		proto.isPlayableType = function (content) {
			if (content._data.defaultPlaybackInfo) {
				contentObj = content;
				contentType = content.taskId ? "RECORDING" : "BTV";
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
			httpRequest.requestData(contentObj._data.defaultPlaybackInfo.url, 8000, false);
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
			return contentObj._data.defaultPlaybackInfo.lcm;
		};

		/**
		 * Returns the uri for playback
		 * @method getUri
		 * @return {String} the uri
		 */
		proto.getUri = function () {
			return contentObj._data.defaultPlaybackInfo.url;
		};

		/**
		 * Returns the unique identify for the content
		 * @method getContentId
		 * @return {String} unique identifier for content
		 */
		proto.getContentId = function () {
			return contentObj.taskId || content.serviceId;
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
		 * Returns the type of content either "BTV" or "RECORDING"
		 * @method getContentType
		 * @return {String}
		 */
		proto.getContentType = function () {
			return contentType;
		};

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.GWContentMapper = GWContentMapper;
		return GWContentMapper;
	}
);
