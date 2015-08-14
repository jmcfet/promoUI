/**
 * Singleton instance instantiated in the top level window that contains methods
 * for getting and setting the video and audio output settings.
 * @class $N.platform.output.AV
 * @singleton
 *
 * @requires $N.apps.core.Log
 * @author mbrown
 */

define('jsfw/platform/output/AV',
	[
		'jsfw/apps/core/Log'
	],
	function (Log) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};

		$N.platform.output.AV = (function () {
			var log = new $N.apps.core.Log("output", "AV");

			/* Public API */
			var publicApi = {
				/**
				 * Initialises the AV singleton must be called prior to any
				 * other methods in this class
				 * @method init
				 */
				init: function () {
					/*$N.platform.output.AV.VideoResolution = this.VideoResolution();
					$N.platform.output.AV.VideoAspectRatio = this.VideoAspectRatio();
					$N.platform.output.AV.VideoAspectMode = this.VideoAspectMode();
					$N.platform.output.AV.Video3dFormat = this.Video3dFormat();
					$N.platform.output.AV.AudioType = this.AudioType();*/
				},

				/**
				 * Initialises the AV singleton must be called prior to any
				 * other methods in this class
				 * @method initialise
				 * @deprecated use init()
				 */
				initialise: function () {
					this.init();
				},

				/**
				 * Returns true if an HD output such as HDMI is available and
				 * connected to a display device such as a TV, false otherwise
				 * @method isHDOutputAvailable
				 * @return {Boolean}
				 */
				isHDOutputAvailable: function () {
					return true;
				},

				/**
				 * Returns true if an SD/Analogue output such as SCART is available, false otherwise
				 * @method isAnalogueOutputAvailable
				 * @return {Boolean}
				 */
				isAnalogueOutputAvailable: function () {
					return true;
				},

				/**
				 * Returns the current resolution that the HD output is running at.
				 * @method getResolution
				 * @return {Number} one of the $N.platform.output.AV.VideoResolution constants:
				 *   HDMI_VIDEO_FORMAT_480I,
				 *   HDMI_VIDEO_FORMAT_480P,
				 *   HDMI_VIDEO_FORMAT_576I,
				 *   HDMI_VIDEO_FORMAT_576P,
				 *   HDMI_VIDEO_FORMAT_720P,
				 *   HDMI_VIDEO_FORMAT_1080I,
				 *   HDMI_VIDEO_FORMAT_1080P
				 * or null if there is no active output
				 */
				getResolution: function () {
					/*var videoSetting = CCOM.System.getHdmiVideoSettings();
					if (videoSetting.error) {
						return null;
					}
					return videoSetting.videoFormat;*/
				},

				/**
				 * Sets the resolution of the HD outputs such as HDMI (note: this method has
				 * no affect on other outputs).
				 * @method setResolution
				 * @param {Number} videoResolution one of the $N.platform.output.AV.VideoResolution constants:
				 *   HDMI_VIDEO_FORMAT_480I,
				 *   HDMI_VIDEO_FORMAT_480P,
				 *   HDMI_VIDEO_FORMAT_576I,
				 *   HDMI_VIDEO_FORMAT_576P,
				 *   HDMI_VIDEO_FORMAT_720P,
				 *   HDMI_VIDEO_FORMAT_1080I,
				 *   HDMI_VIDEO_FORMAT_1080P
				 * @return {Boolean} true if successful, otherwise false
				 */
				setResolution: function (videoResolution) {
					// return CCOM.System.setHdmiVideoSettings(videoResolution, CCOM.System.HDMI_VIDEO_COLOR_TYPE_RGB).error ? false : true;
				},

				/**
				 * Returns the current aspect mode of the HD outputs.
				 * @method getHDVideoAspectMode
				 * @return {Number} one of the $N.platform.output.AV.VideoAspectMode constants:
				 *   HDMI_PILLAR_BOX,
				 *   HDMI_STRETCH,
				 * or null if there is no active output
				 */
				getHDVideoAspectMode: function () {
					/*var aspectMode = CCOM.System.getHdmiVideoAspectMode();
					if (aspectMode.error) {
						return null;
					}
					return aspectMode.aspectMode;*/
				},

				/**
				 * Sets the aspect mode of the HD output so the video can
				 * be stretched for example.
				 * @method setHDVideoAspectMode
				 * @param {Number} aspectMode one of the $N.platform.output.AV.VideoAspectMode constants:
				 *   HDMI_PILLAR_BOX,
				 *   HDMI_STRETCH
				 * @return {Boolean} true if successful, otherwise false
				 */
				setHDVideoAspectMode: function (aspectMode) {
					// return CCOM.System.setHdmiVideoAspectMode(aspectMode).error ? false : true;
				},

				/**
				 * Returns the current aspect mode of the analogue outputs.
				 * @method getAnalogueVideoAspectMode
				 * @return {Number} one of the $N.platform.output.AV.VideoAspectMode constants:
				 *   ANALOGUE_LETTER_BOX,
				 *   ANALOGUE_PAN_SCAN,
				 *   ANALOGUE_CENTER_CUT,
				 *   ANALOGUE_STRETCH or null if there is no active output
				 */
				getAnalogueVideoAspectMode: function () {
					/*var aspectMode = CCOM.System.getAnalogueVideoAspectMode();
					if (aspectMode.error) {
						return null;
					}
					return aspectMode.aspectMode;*/
				},

				/**
				 * Sets the aspect mode of the analogue outputs so the video can
				 * be stretched for example.
				 * @method setAnalogueVideoAspectMode
				 * @param {Number} aspectMode one of the $N.platform.output.AV.VideoAspectMode constants:
				 *   ANALOGUE_LETTER_BOX,
				 *   ANALOGUE_PAN_SCAN,
				 *   ANALOGUE_CENTER_CUT,
				 *   ANALOGUE_STRETCH
				 * @return {Boolean} true if successful, otherwise false
				 */
				setAnalogueVideoAspectMode: function (aspectMode) {
					// return CCOM.System.setAnalogueVideoAspectMode(aspectMode).error ? false : true;
				},

				/**
				 * DEPRECATED: Use setHDVideoAspectMode or setAnalogueVideoAspectMode
				 * @method setScaleMethod
				 * @deprecated use one of: setHDVideoAspectMode or setAnalogueVideoAspectMode
				 */
				setScaleMethod: function (scaleMethod) {
					// this._setAnalogueVideoAspectMode(scaleMethod);
				},

				/**
				 * Returns the current aspect ratio of the analogue outputs.
				 * @method getAspectRatio
				 * @return {Number} one of the $N.platform.output.AV.VideoAspectRatio constants:
				 *   ASPECT_RATIO_4_3,
				 *   ASPECT_RATIO_16_9
				 * or null if there is no active output
				 */
				getAspectRatio: function () {
					/*var aspectRatio = CCOM.System.getAnalogueVideoAspectRatio();
					if (aspectRatio.error) {
						return null;
					}
					return aspectRatio.aspectRatio;*/
				},

				/**
				 * Sets the aspect ratio of the analogue outputs so the video can
				 * be stretched for example.
				 * @method setAspectRatio
				 * @param {Number} aspectRatio one of the $N.platform.output.AV.VideoAspectRatio constants:
				 *   ASPECT_RATIO_4_3,
				 *   ASPECT_RATIO_16_9
				 * @return {Boolean} true if successful, otherwise false
				 */
				setAspectRatio: function (aspectRatio) {
					// return CCOM.System.setAnalogueVideoAspectRatio(aspectRatio).error ? false : true;
				},

				/**
				 * Gets the audio delay applied to compatible outputs.
				 * @method getAudioDelay
				 * @return {Number} The amount of Audio Delay in milliseconds.
				 */
				getAudioDelay: function () {
					/*var audioDelay = CCOM.System.getHdmiAudioDelay();
					if (audioDelay.error) {
						return null;
					}
					return audioDelay.delayMs;*/
				},

				/**
				 * Sets the audio delay for all compatible outputs.
				 * @method setAudioDelay
				 * @param {Number} delay The amount of Audio Delay in milliseconds.
				 */
				setAudioDelay: function (delay) {
					// return CCOM.System.setHdmiAudioDelay(delay).error ? false : true;
				},

				/**
				 * Gets the audio type applied to the HDMI output.
				 * @method getAudioType
				 * @return {Number} One of the $N.platform.output.AV.AudioType constants:
				 *   PCM,
				 *   AC3
				 * or null if there is no active output
				 */
				getAudioType: function () {
					/*var audioType = CCOM.System.getHdmiAudioType();
					if (audioType.error) {
						return null;
					}
					return audioType.audioType;*/
				},

				/**
				 * Sets the audio type of the HDMI output.
				 * @method setAudioType
				 * @param {Number} type One of the $N.platform.output.AV.AudioType constants:
				 *   PCM,
				 *   AC3
				 * @return {Boolean} true if successful, otherwise false
				 */
				setAudioType: function (type) {
					// return CCOM.System.setHdmiAudioType(type).error ? false : true;
				},

				/**
				 * Returns the 3D format that is active on the HDMI output
				 * @method get3DFormat
				 * @return {Number} one of the $N.platform.output.AV.Video3dFormat constants:
				 *   FRAME_PACKING,
				 *   TOP_AND_BOTTOM,
				 *   SIDE_BY_SIDE
				 * or null if there is no active output
				 */
				get3DFormat: function () {
					/*var format = CCOM.System.getHdmi3dFormat();
					if (format.error) {
						return null;
					}
					return format.format;*/
				},

				/**
				 * Sets the 3D format to use on the HDMI output
				 * @method set3DFormat
				 * @param {Number} mode one of the $N.platform.output.AV.Video3dFormat constants:
				 *   FRAME_PACKING,
				 *   TOP_AND_BOTTOM,
				 *   SIDE_BY_SIDE
				 * @return {Boolean} true if successful, otherwise false
				 */
				set3DFormat: function (mode) {
					// return CCOM.System.setHdmi3dFormat(mode).error ? false : true;
				},

				/**
				 * Enumerations of the video resolutions, available values are:
				 *   HDMI_VIDEO_FORMAT_480I
				 *   HDMI_VIDEO_FORMAT_480P
				 *   HDMI_VIDEO_FORMAT_576I
				 *   HDMI_VIDEO_FORMAT_576P
				 *   HDMI_VIDEO_FORMAT_720P
				 *   HDMI_VIDEO_FORMAT_1080I
				 *   HDMI_VIDEO_FORMAT_1080P
				 * @property {Number} VideoResolution
				 */
				VideoResolution: function () {
					/*return {
						HDMI_VIDEO_FORMAT_480I : CCOM.System.HDMI_VIDEO_FORMAT_480I,
						HDMI_VIDEO_FORMAT_480P : CCOM.System.HDMI_VIDEO_FORMAT_480P,
						HDMI_VIDEO_FORMAT_576I : CCOM.System.HDMI_VIDEO_FORMAT_576I,
						HDMI_VIDEO_FORMAT_576P : CCOM.System.HDMI_VIDEO_FORMAT_576P,
						HDMI_VIDEO_FORMAT_720P : CCOM.System.HDMI_VIDEO_FORMAT_720P,
						HDMI_VIDEO_FORMAT_1080I : CCOM.System.HDMI_VIDEO_FORMAT_1080I,
						HDMI_VIDEO_FORMAT_1080P : CCOM.System.HDMI_VIDEO_FORMAT_1080P
					};*/
				},

				/**
				 * Enumerations of the analogue aspect ratios, available values are:
				 *   ASPECT_RATIO_4_3
				 *   ASPECT_RATIO_16_9
				 * @property {number} VideoAspectRatio
				 */

				VideoAspectRatio: function () {
					/*return {
						ASPECT_RATIO_4_3 : CCOM.System.ANALOGUE_VIDEO_ASPECT_RATIO_4_3,
						ASPECT_RATIO_16_9 : CCOM.System.ANALOGUE_VIDEO_ASPECT_RATIO_16_9
					};*/
				},

				/**
				 * Enumerations of the video aspect modes, available values are:
				 *   HDMI_PILLAR_BOX
				 *   HDMI_STRETCH
				 *   ANALOGUE_LETTER_BOX
				 *   ANALOGUE_PAN_SCAN
				 *   ANALOGUE_CENTER_CUT
				 *   ANALOGUE_STRETCH
				 * @property {Number} VideoAspectMode
				 */
				VideoAspectMode: function () {
					/*return {
						HDMI_PILLAR_BOX : CCOM.System.HDMI_VIDEO_ASPECT_MODE_PILLAR_BOX,
						HDMI_STRETCH : CCOM.System.HDMI_VIDEO_ASPECT_MODE_STRETCH,
						ANALOGUE_LETTER_BOX : CCOM.System.ANALOGUE_VIDEO_ASPECT_MODE_LETTER_BOX,
						ANALOGUE_PAN_SCAN : CCOM.System.ANALOGUE_VIDEO_ASPECT_MODE_PAN_SCAN,
						ANALOGUE_CENTER_CUT : CCOM.System.ANALOGUE_VIDEO_ASPECT_MODE_CENTER_CUT,
						ANALOGUE_STRETCH : CCOM.System.ANALOGUE_VIDEO_ASPECT_MODE_STRETCH
					};*/
					//TODO: use device orientation for this
				},

				/**
				 * Enumerations of the 3D video formats, available values are:
				 *   FRAME_PACKING
				 *   TOP_AND_BOTTOM
				 *   SIDE_BY_SIDE
				 * @property {Number} Video3dFormat
				 */
				Video3dFormat: function () {
					/*return {
						FRAME_PACKING : CCOM.System.HDMI_3D_FORMAT_FRAME_PACKING,
						TOP_AND_BOTTOM : CCOM.System.HDMI_3D_FORMAT_TOP_AND_BOTTOM,
						SIDE_BY_SIDE_HALF : CCOM.System.HDMI_3D_FORMAT_SIDE_BY_SIDE_HALF
					};*/
				},

				/**
				 * Enumerations of the audio types, available values are:
				 *   `PCM`
				 *   `AC3`
				 * @property {number} AudioType
				 */
				AudioType: function () {
					/*return {
						PCM : CCOM.System.HDMI_AUDIO_TYPE_PCM,
						AC3 : CCOM.System.HDMI_AUDIO_TYPE_AC3
					};*/
				}

			};
			return publicApi;
		}());
		return $N.platform.output.AV;
	}
);