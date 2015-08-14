/**
 * Contains logic for deciding which DRM should be used for decrypting content
 * Must be instantiated with a config object containing platform and playoutManager properties
 * playContent method can be called to play back content
 *
 * e.g.
 *
 *     DRM = new $N.platform.output.DRM({platform: "SAMSUNG", playoutManager: playerInstance});
 *     DRM.playContent(contentMapperInstance, DRM.ContentType.VOD);
 *
 * @class $N.platform.output.DRM
 * @author Gareth Stacey
 * @constructor
 * @param {Object} config Must contain the following properties:
 *
 *     playoutManager {Object}
 *     platform {String}
 */
/*global drmAgent*/

define('jsfw/platform/output/DRM',
    [
    	'jsfw/apps/core/Log',
    	'jsfw/apps/util/Util'
    ],
	function (Log, Util) {
		'use strict';

		var log = new $N.apps.core.Log("output", "DRM"),
			player,
			platform,
			errorListeners = [];

		function DRM(config) {
			platform = config.platform;
			player = config.playoutManager;
		}

		var proto = DRM.prototype;

		/*
		 * Public API
		 */

		/**
		 * Call to begin playback of given content
		 * @method playContent
		 * @param {Object} content Instance of a content mapper
		 */
		proto.playContent = function (content) {
			log("playContent", "Enter");
			var url = content.getUri();
			if (url.indexOf(".ismv") !== -1 || url.indexOf(".Manifest") !== -1) {
				url = url + "|COMPONENT=WMDRM";
			}
			log('playContent', '_playingContent URI: ' + url);
			player.src = url;
			log("playContent", "Exit");
		};

		/**
		 * Registers a listener that will be fired upon an error
		 * @method registerErrorListener
		 * @param {Function} listener
		 */
		proto.registerErrorListener = function (listener) {
			log("registerErrorListener", "Enter");
			if ($N.apps.util.Util.arrayContains(errorListeners, listener)) {
				log("registerErrorListener", "Listener already registered.");
			} else {
				errorListeners.push(listener);
			}
			log("registerErrorListener", "Exit");
		};

		/**
		 * Unregisters the error listener that was previously registered
		 * @method unregisterErrorListener
		 * @param {Function} listener
		 */
		proto.unregisterErrorListener = function (listener) {
			log("unregisterErrorListener", "Enter");
			var i;
			for (i = 0; i < errorListeners.length; i++) {
				if (errorListeners[i] === listener) {
					errorListeners.splice(i, 1);
					break;
				}
			}
			log("unregisterErrorListener", "Exit");
		};

		/**
		 * Defines constants for error types,
		 * one of LICENSE_EXPIRED, INVALID_LICENSE_DATA,
		 * ENTITLEMENT_RETRIEVAL_FAILED, SESSION_FAILED
		 * @property {Object} ErrorType
		 */
		proto.ErrorType = {
			LICENSE_EXPIRED: 1,
			INVALID_LICENSE_DATA: 2,
			ENTITLEMENT_RETRIEVAL_FAILED: 3,
			SESSION_FAILED: 4
		};

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.DRM = DRM;
		return DRM;
	}
);