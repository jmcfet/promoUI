/**
 * Stub for CCOM 2.0 System
 */

var CCOM = CCOM || {};

CCOM.System = (function () {

	var eventListeners = {};

	return {
		//analogue_cci
		ANALOGUE_CCI_COPY_FREELY: 1,
		ANALOGUE_CCI_COPY_NO_MORE: 2,
		ANALOGUE_CCI_COPY_ONCE: 3,
		ANALOGUE_CCI_COPY_NEVER: 4,
		//analogue_video_aspect_mode
		ANALOGUE_VIDEO_ASPECT_MODE_LETTER_BOX: 101,
		ANALOGUE_VIDEO_ASPECT_MODE_PAN_SCAN: 102,
		ANALOGUE_VIDEO_ASPECT_MODE_CENTER_CUT: 103,
		ANALOGUE_VIDEO_ASPECT_MODE_STRETCH: 104,
		//analogue_video_aspect_ratio
		ANALOGUE_VIDEO_ASPECT_RATIO_4_3: 201,
		ANALOGUE_VIDEO_ASPECT_RATIO_16_9: 202,
		//front_panel_capabilities
		FPCHAR_CAPABILITY_BLINK: 301,
		FPCHAR_CAPABILITY_FADE: 302,
		FPCHAR_CAPABILITY_7SEG: 303,
		FPCHAR_CAPABILITY_ASCII: 304,
		FPCHAR_CAPABILITY_UTF8: 305,
		//hdmi_3d_format
		HDMI_3D_FORMAT_FRAME_PACKING: 401,
		HDMI_3D_FORMAT_TOP_AND_BOTTOM: 402,
		HDMI_3D_FORMAT_SIDE_BY_SIDE_HALF: 403,
		//hdmi_audio_type
		HDMI_AUDIO_TYPE_PCM: 501,
		HDMI_AUDIO_TYPE_AC3: 502,
		HDMI_AUDIO_TYPE_DDPLUS: 503,
		//hdmi_event
		HDMI_EVENT_SINK_CONNECTED: 601,
		HDMI_EVENT_SINK_DISCONNECTED: 602,
		HDMI_EVENT_SINK_AUTHENTICATION_FAILED: 603,
		HDMI_EVENT_SINK_AUTHENTICATED: 604,
		HDMI_EVENT_SINK_REVOKED: 605,
		//hdmi_video_aspect_mode
		HDMI_VIDEO_ASPECT_MODE_PILLAR_BOX: 701,
		HDMI_VIDEO_ASPECT_MODE_STRETCH: 702,
		//hdmi_video_color_type
		HDMI_VIDEO_COLOR_TYPE_RGB: 801,
		HDMI_VIDEO_COLOR_TYPE_YCC_422: 802,
		HDMI_VIDEO_COLOR_TYPE_YCC_444: 803,
		//hdmi_video_format
		HDMI_VIDEO_FORMAT_480I: 901,
		HDMI_VIDEO_FORMAT_480P: 902,
		HDMI_VIDEO_FORMAT_576I: 903,
		HDMI_VIDEO_FORMAT_576P: 904,
		HDMI_VIDEO_FORMAT_720P: 905,
		HDMI_VIDEO_FORMAT_1080I: 906,
		HDMI_VIDEO_FORMAT_1080P: 907,
		//led_capabilities
		LED_CAPABILITY_BLINK: 1001,
		LED_CAPABILITY_SPIN: 1002,
		LED_CAPABILITY_FADE: 1003,
		LED_CAPABILITY_BI_COLOUR: 1004,
		//led_state
		LED_STATE_OFF: 1101,
		LED_STATE_ON: 1102,
		LED_STATE_BI_COLOUR_RED: 1103,
		LED_STATE_BI_COLOUR_GREEN: 1104,
		//scart_video_format
		SCART_VIDEO_FORMAT_CVBS: 1201,
		SCART_VIDEO_FORMAT_RGB: 1202,
		//system_info_type
		PI_STB_INFO_TYPE_STRING: 1301,
		PI_STB_INFO_TYPE_VALUE: 1302,
		PI_STB_INFO_TYPE_DATA: 1303,
		//system_standby_mode
		STB_STANDBY_OFF: 1401,
		STB_STANDBY_ON: 1402,
		STB_STANDBY_SUSPEND: 1403,
		//system_wake_reason
		STB_WAKE_REASON_BOOTUP: 1501,
		STB_WAKE_REASON_KEYPRESS: 1502,
		STB_WAKE_REASON_SCHEDULED: 1503,
		//3D Mode
		STEREOSCOPIC_3D_MODE_ON: 0,

		//properties
		bootloaderVersion: 'testBootloaderVersion',
		firmwareVersion: 'testFirmwareVersion',
		frontPanelAttribute: 'frontPanelAttribute',
		hardwareVersion: 'testModel',
		hdmi3dFormat: this.HDMI_3D_FORMAT_FRAME_PACKING,
		hdmiAudioType: this.HDMI_AUDIO_TYPE_AC3,
		hdmiVideoColor: this.HDMI_VIDEO_COLOR_TYPE_YCC_444,
		hdmiVideoFormat: this.HDMI_VIDEO_FORMAT_720P,
		ledAttribute: this.LED_CAPABILITY_BLINK,
		ledNumber: 1,
		manufacturer: 'HtmlDev',
		muteAudio: false,
		scartNumber: 1,
		softwareVersion: 'testSoftwareVersion',
		volume: 21,
		serialNumber: '12345678',
		model: '001',
		osVersion: 'testOsVersion',

		addEventListener: function (event, callback) {
			if (eventListeners[event] === undefined) {
				eventListeners[event] = [];
			}
			eventListeners[event].push(callback);
		},

		removeEventListener: function (event, callback) {
			var listeners = eventListeners[event];
			var i;
			for (i = 0; i < listeners.length; i++) {
				/*jslint eqeq:true*/
				if (listeners[i] == callback) {
					listeners.splice(i, 1);
				}
				/*jslint eqeq:false*/
			}
		},

		hdmiConnected: true,
		videoFormat: 5,
		aspectMode: 1,
		audioDelay: 0,
		audioType: 1,
		_3DFormat: 1,

		getHdmiVideoSettings: function () {
			if (this.hdmiConnected) {
				return {videoFormat: this.videoFormat};
			} else {
				return {error: "error"};
			}
		},

		setHdmiVideoSettings: function (res, type) {
			if (this.hdmiConnected) {
				this.videoFormat = res;
				return {};
			} else {
				return {error: "error"};
			}
		},

		getHdmiVideoAspectMode: function () {
			if (this.hdmiConnected) {
				return {aspectMode: this.aspectMode};
			} else {
				return {error: "error"};
			}
		},

		setHdmiVideoAspectMode: function (mode) {
			if (this.hdmiConnected) {
				this.aspectMode = mode;
				return {};
			} else {
				return {error: "error"};
			}
		},

		getHdmiAudioDelay: function () {
			if (this.hdmiConnected) {
				return {delayMs: this.audioDelay};
			} else {
				return {error: "error"};
			}
		},

		setHdmiAudioDelay: function (delay) {
			if (this.hdmiConnected) {
				this.audioDelay = delay;
				return {};
			} else {
				return {error: "error"};
			}
		},

		getHdmiAudioType: function () {
			if (this.hdmiConnected) {
				return {audioType: this.audioType};
			} else {
				return {error: "error"};
			}
		},

		setHdmiAudioType: function (type) {
			if (this.hdmiConnected) {
				this.audioType = type;
				return {};
			} else {
				return {error: "error"};
			}
		},

		getHdmi3dFormat: function () {
			if (this.hdmiConnected) {
				return {format: this._3DFormat};
			} else {
				return {error: "error"};
			}
		},

		setHdmi3dFormat: function (format) {
			if (this.hdmiConnected) {
				this._3DFormat = format;
				return {};
			} else {
				return {error: "error"};
			}
		},

		analogueConnected: true,
		analogueAspectMode: 1,
		aspectRatio: 1,

		getAnalogueVideoSettings: function () {
			if (this.analogueConnected) {
				return {};
			} else {
				return {error: "error"};
			}
		},

		getAnalogueVideoAspectMode: function () {
			if (this.analogueConnected) {
				return {aspectMode: this.analogueAspectMode};
			} else {
				return {error: "error"};
			}
		},

		setAnalogueVideoAspectMode: function (mode) {
			if (this.analogueConnected) {
				this.analogueAspectMode = mode;
				return {};
			} else {
				return {error: "error"};
			}
		},

		getAnalogueVideoAspectRatio: function () {
			if (this.analogueConnected) {
				return {aspectRatio: this.aspectRatio};
			} else {
				return {error: "error"};
			}
		},

		setAnalogueVideoAspectRatio: function (ratio) {
			if (this.analogueConnected) {
				this.aspectRatio = ratio;
				return {};
			} else {
				return {error: "error"};
			}
		},

		reboot: function () {
			return true;
		},

		frontPanelControl: function (on)    {

		},

		getAnalogueCCI: function () {
			return {error: "error"};
		},

		getLedState: function (ledName)    {
			// 0 means off
			return 0;
		},

		getScartVideoFormat: function ()    {
			return this.SCART_VIDEO_FORMAT_CVBS;
		},

		getStandby: function () {
			return false;
		},

		setStandby: function (standby) {

		},

		getStringById: function (id)    {
			return {error: "error"};
		},

		getValueById: function (id) {
			return {error: "error"};
		},

		setAnalogueCCI: function (cgi)  {

		},

		setFrontPanelConfiguration: function ( blinkPeriodMs, fadePeriodMs ) {

		},

		setFrontPanelString: function ( string )    {

		},

		setLedSpinState: function ( spinPeriodMs )    {

		},

		setLedState: function (ledName,state)   {

		},

		setFrontPanelIntensityLevel: function (level) {
			return {
				error: false
			};
		},

		setScartVideoFormat: function (format)    {

		},

		setSoftwareUpgradeData: function ( upgradeData )    {

		},

		setVcrScartRecord: function (record)  {

		},

		blankAnalogue: function ( blank )   {

		},

		getLedConfig: function ( ledName )  {
			return {error:"error"};
		},

		setLedConfig: function (ledName,blinkPeriodMs,fadePeriodMs)   {

		},

		wakeReasonGet: function ( ) {
			return {error:"error"};
		},

		set3dMode: function()	{

		}
	};
}());
