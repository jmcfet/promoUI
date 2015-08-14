/**
 * This class provides an API to handle the initialization
 * of screen resolution and setting of appropriate scaling
 * and stylesheets.
 *
 * @class $N.app.ResolutionManager
 * @static
 * @author vchauhan
 * @requires $N.platform.output.AV
 * @requires $N.app.constants
 * @requires $N.gui.Image
 * @requires $N.gui.GUIObject
 */
(function ($N) {
	"use strict";
	$N.gui = $N.gui || {};
	$N.gui.ResolutionManager = (function () {
		var RESOLUTION_720P = "720p",
			RESOLUTION_1080P = "1080p",
			RESOLUTION_DIMENSIONS_720P = {width: 1280, height: 720},
			RESOLUTION_DIMENSIONS_1080P = {width: 1920, height: 1080},

			resolution = null,
			resolutionDimensions = null;

		/**
		 * Reads the resolution set in user preferences.
		 * @method getPreferredRes
		 * @return {String} The user defined resolution or 720p if that is not available.
		 */
		function getPreferredRes() {
			return $N.platform.system.Preferences.get($N.app.constants.PREF_HDMI_VIDEO_RESOLUTION, true) || RESOLUTION_720P;
		}

		/**
		 * Switches the screen resolution and scaling factors.
		 * @method setRes
		 * @param {String} res Resolution to set.  Defaults to 720p.
		 * @return {String} The resolution that has been set.
		 */
		function setRes(res) {
			var selectedRes = null,
				audioVideo = $N.platform.output.AV,
				EXPONENT_BASE = 2;
			switch (res) {
			case $N.app.GeneralUtil.getExponentValue($N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_480I, EXPONENT_BASE):
				audioVideo.setResolution(audioVideo.VideoResolution.HDMI_VIDEO_FORMAT_480I);
				break;
			case $N.app.GeneralUtil.getExponentValue($N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_480P, EXPONENT_BASE):
				audioVideo.setResolution(audioVideo.VideoResolution.HDMI_VIDEO_FORMAT_480P);
				break;
			case $N.app.GeneralUtil.getExponentValue($N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_720P, EXPONENT_BASE):
				audioVideo.setResolution(audioVideo.VideoResolution.HDMI_VIDEO_FORMAT_720P);
				break;
			case $N.app.GeneralUtil.getExponentValue($N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_1080I, EXPONENT_BASE):
				audioVideo.setResolution(audioVideo.VideoResolution.HDMI_VIDEO_FORMAT_1080I);
				break;
			case $N.app.GeneralUtil.getExponentValue($N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_1080P, EXPONENT_BASE):
				audioVideo.setResolution(audioVideo.VideoResolution.HDMI_VIDEO_FORMAT_1080P);
				break;
			}
			$N.app.constants.VIEWBOX = "0 0 1280 720";
			$N.gui.Image.resolution = RESOLUTION_720P;
			$N.gui.GUIObject.prototype.resolutionHorizontalFactor = RESOLUTION_DIMENSIONS_720P.height / RESOLUTION_DIMENSIONS_1080P.height;
			$N.gui.GUIObject.prototype.resolutionVerticalFactor = RESOLUTION_DIMENSIONS_720P.width / RESOLUTION_DIMENSIONS_1080P.width;
			resolutionDimensions = RESOLUTION_DIMENSIONS_720P;
			selectedRes = RESOLUTION_720P;
			return selectedRes;
		}

		/**
		 * Sets up a style sheet to associate with the set resolution
		 * @method createCssLink
		 * @param {Object} docRef Reference to the DOM document object.
		 * @param {String} path The path/url of the style sheet.
		 */
		function createCssLink(docRef, path) {
			var styleElement = docRef.createElement("style");
			styleElement.setAttribute("xlink:href", path);
			docRef.documentElement.appendChild(styleElement);
		}

		return {

			/**
			 * Sets up the screen resolution.
			 * @method initialiseResolution
			 * @param {String} res Optional resolution to set (720p, 1080p), otherwise reads from stored settings.
			 */
			initialiseResolution: function (res) {
				resolution = res ? setRes(res) : setRes(getPreferredRes());
			},

			/**
			 * Sets up a stylesheet link
			 * @method setCss
			 * @param {Object} docRef DOM document.
			 * @param {String} url Stylesheet url.
			 */
			setCss: function (docRef, url) {
				createCssLink(docRef, url);
			},

			/**
			 * Sets up the document viewbox and stylesheet for the set resolution
			 * @method initialiseContext
			 * @param {Object} docRef DOM document.
			 * @param {String} defaultStyleUrl Alternative URL of default stylesheet.
			 */
			initialiseContext: function (docRef, defaultStyleUrl) {
				if (!defaultStyleUrl) {
					defaultStyleUrl = "../../../customise/resources/css/" + $N.gui.Image.resolution + "/common.css";
				}
				createCssLink(docRef, defaultStyleUrl);
			},

			/**
			 * Returns the current screen resolution.
			 * @method getResolution
			 * @return {String} The current resolution.
			 */
			getResolution: function () {
				return resolution;
			},

			/**
			 * Returns the current screen resolution dimensions (height and width).
			 * @method getResDimensions
			 * @return {Object} The current resolution dimensions.
			 */
			getResDimensions: function () {
				return resolutionDimensions;
			}
		};
	}());

}($N || {}));
