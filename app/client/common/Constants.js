/*global $N*/
(function ($N) {

	$N.app = $N.app || {};
	$N.app.constants = {
		//Universal constants
		TEN_SECONDS: 10,
		MINUTE_IN_MS: 60000,
		FIVE_MINUTES_IN_MS: 60000 * 5,
		TEN_MINUTES_IN_MS: 60000 * 10,
		THIRTY_MINUTES_IN_MS: 60000 * 30,
		DAY_IN_MS: 3600 * 24 * 1000,
		DAY_IN_HOURS: 24,
		HOUR_IN_MS: 3600 * 1000,
		SECOND_IN_MS: 1000,
		HTTP_PROTOCOL: "http://",
		MAX_IMAGE_BITMAP_SIZE: 1980 * 1080 * 4 * 1.3, // Upper bound for decompressed image size as 1080p + a third at 32bpp

		ROOT_PVR_FOLDER_NAME: "<ROOT_FOLDER>",
		ROOT_PVR_FOLDER_VALUE: "/",

		//Preferences
		PREF_TV_CURRENT_SERVICE_ID: "tv.currentServiceId",
		PREF_ZAPPING_BANNER_TIMEOUT: "zapping.banner.timeout",
		PREF_MINIGUIDE_PIP_POSITION: "miniguiuide.pip.pos",
		PREF_RECENT_SEARCH_TERMS: "search.recentSearchTerms",
		PREF_SDP_ENABLED: "network.server.qsp.enabled",
		PREF_SDP_PATH: "network.server.qsp.path",
		PREF_EPG_CACHE_EXPIRY: "epg.cache.expiry",
		PREF_METADATA_LANGUAGE: "metadata.language",
		PREF_METADATA_BASE_URI: "metadata.baseUri",
		PREF_METADATA_SEARCH_URI: "metadata.searchUri",
		PREF_METADATA_PROVIDER: "metadata.provider",
		PREF_METADATA_SERVER: "/network/siconfig/CustomDescriptorTags/netMdsServer",
		PREF_GENIE_SERVER: "/network/siconfig/CustomDescriptorTags/teleIdeaGenieVod",
		PREF_VOD_COVERS: "vod.covers.url",
		PREF_USER_RATING: "user.rating",
//		PREF_LOCKED_SERVICE_IDS: "locked.service.ids",
		PREF_LANGUAGE: "language",
		PREF_ISINSTALLED: "installation.complete",
		PREF_NOW_DISCLAIMER_ACCEPTED: "now.disclaimer.accepted",
		PREF_TV_CATEGORY: "tv.currentCategory",
		PREF_TV_SORT: "tv.sort",
		PREF_HARD_OF_HEARING: "hard.of.hearing",
		PREF_GUIDE_TEXT_SIZE: "guide.text.size",
		PREF_AUDIO_LANGUAGE: "audio.language",
		PREF_SUBTITLE_STATE: "subtitle.language",
		PREF_VOD_DO_NOT_WARN: "vod.do.not.warn",
		PREF_EXCLUDE_UNSUBSCRIBED_CHANNELS: "exclude.unsubscribed.channels",
		PREF_SHOW_UNSUBSCRIBED_CHANNELS: "show.unsubscribed.channels",
		PREF_NETWORK_HTTP_PROXY: "network.http.proxy",
		PREF_MOCK_PVR: "mock.pvr.manager",
		PREF_PRM_ENABLED: "prm.enabled",
		PREF_CASN: "casn",
		PREF_BEFORE_PADDING: "before.padding",
		PREF_AFTER_PADDING: "after.padding",
		PREF_DEFAULT_KEEP_UNTIL: "pvr.keep",//changed as part of R1 - R2 migration
		PREF_NON_EPISODIC_BLOCK_PLAYBACK: "pvr.lock",//changed as part of R1 - R2 migration
		PREF_SEND_DESCRIBE: "/network/vod/send_describe",
		//Audio and Video
		//default elements in AV options list
		PREF_DEFAULT_ASPECT_RATIO_HD: "/system/devices/dopmgr/hdVideoAspectMode",
		PREF_DEFAULT_ASPECT_RATIO_ANALOGUE: "/system/devices/aopmgr/sdAspectMode",
		PREF_DEFAULT_AUDIO_DELAY:  "av.default.audio_delay",
		PREF_DEFAULT_AUDIO_FORMAT: "av.default.audio_format",
		PREF_PREFERRED_AUDIO_FORMAT: "audio.prefFormat",
		PREF_STEREO_3D_ENABLED: "av.default.stereo_3d_enabled",
		PREF_DEFAULT_VOLUME_LEVEL: "av.default.volume_level",
		PREF_CURRENT_VOLUME: "system.current.volume",
		PREF_PCM_VOLUME: "/system/devices/audmgr/pcmAttenuation",
		PREF_HDMI_AUDIO_TYPE: "/system/devices/audmgr/hdmiFormat",
		PREF_SPDIF_AUDIO_TYPE: "/system/devices/audmgr/spdifFormat",
		HDMI_AUDIO_PCM_STRING: "pcm",
		HDMI_AUDIO_PCM: 4,
		HDMI_AUDIO_DOLBY: 6,
		PREF_USBDLNA_PHOTO_DISPLAY_DURATION: "usbdlna.photo.display.duration",
		PREF_USBDLNA_PHOTO_TRANSITION_EFFECTS: "usbdlna.photo.transition.effects",
		PREF_USBDLNA_PLAYER_BANNER_TIMEOUT: "usbdlna.player.banner.timeout",
		PREF_SCAN_CONFIGURATION: "dvb.scan.configuration",
		SERVICE_RUNNING_STATUS_NOT_RUNNING: 1,

		HDMI_AUDIO_PCM_OUTPUT: 4,
		HDMI_AUDIO_DOLBY_OUTPUT: 6,

		//first install
		PREF_DEFAULT_NETWORK_ID: "0",
		PREF_DEFAULT_FREQUENCY: "0",
		PREF_DEFAULT_SYMBOL_RATE: "5217",
		PREF_DEFAULT_MODULATION: "5",
		PREF_IMPEDENCE_VALUE: "75",

		//Locales
		LANG_ENGLISH_GB: "en_gb",
		LANG_PORTUGUESE_BR: "pt_br",
		LANG_AVAILABLE_MENU_LOCALES: ["pt_br", "en_gb"], //Add to this if you add a language.

		//Date/Time Format
		TWELVE_HOUR_TIME_FORMAT: "H:MM AM",
		TWENTY_FOUR_HOUR_TIME_FORMAT: "HH:MM",
		DAY_MONTH_YEAR_DATE_FORMAT: "dd/mm/yyyy",

		//Front panel
		PREF_DEFAULT_STRING: "AU0I", //The letter 'D' is not support on front panel LED, using '0' instead.
		PREF_STRING_DURING_BOOT: "----", //String used for displaying on FP during boot-up until STB is tuned to barker-service.
		PREF_STRING_VOD: "Uod", //String used for displaying on FP when playing VOD

		PREF_FRONTPANEL_INTENSITY: "system.frontpanel.intensity",
		PREF_FRONTPANEL_DISPLAY: "system.frontpanel.channel",

		FRONTPANEL_DISPLAY_CHANNEL: "2",
		FRONTPANEL_DISPLAY_TIME: "1",
		FRONTPANEL_INTENSITY_BRIGHT: "7",
		FRONTPANEL_INTENSITY_FADE: "1",
		FRONTPANEL_DISPLAY_MODES: {
			DEFAULT: 1,
			STAND_BY: 2,
			PVR_PLAY_BACK : 3,
			MUSIC : 4,
			VOD: 5,
			CATCHUP_STARTOVER: 6,
			WAKE_UP : 7
		},

		//Zapper
		MAX_CHANNEL_DIGITS: 3,
		CHANNEL_ENTRY_TIMEOUT_MS: 2500,
		NO_TUNER_LOCK_CHANNEL_RETUNE_TIMEOUT: 5000, //Timeout for retuning to the current channel when NO_TUNER_LOCK event occurs
		MAX_EPG_DAYS: 7,
		NO_SERVICE_ID_AVAILABLE: -1,
		SURFER_DURATION_DEFAULT: 5000,  // in milli seconds
		POSSIBLE_SURFER_DURATIONS: [1000, 2000, 3000, 5000, 10000, 0], // in  milli seconds
		PIP_POSITION_DEFAULT: 1,
		POSSIBLE_PIP_POSITIONS: [1, 2, 3, 4],
		MAIL_INDICATOR_DURATIONS: 5000, //msec

		//USB-DLNA
		USB_MOUNT_POINT: "mnt",
		SINGLE_SPACE_UNICODE: "\u00A0",
		TRIPLE_SPACE_UNICODE: "\u00A0\u00A0\u00A0",
		USB_HELPER_MODE: "UsbMediaPlayback",

		//Settings
		HARD_OF_HEARING_DEFAULT: false,
		PARENT_ADULT_CONTROL_DEFAULT: false,
		GUIDE_TEXT_SIZE_DEFAULT: "Standard",
		MENU_LANGUAGE_DEFAULT: "pt_br",
		AUDIO_LANGUAGE_DEFAULT: "por", //TODO: confirm with Hugo for the translate value for now dub is portuguese language
		SUBTITLE_STATE_DEFAULT: "off",
		SUBTITLE_STATE_ON: "on",
		SUBTITLE_STATE_OFF: "off",
		LANG_AVAILABLE_AUDIO: ["por", "eng"], //TODO: confirm with Hugo for the translate value for now dub is portuguese language
		AVAILABLE_SUBTITLE_STATES: ["off", "por", "eng"],
		SUBTITLE_CATEGORIES: {
			CC : "CC",
			POR : "por",
			ENG : "eng",
			LEG : "leg"
		},

		/*
		 * Subtitle priority Matrix to be picked when user zaps channel with preferences made (requirement from NET covered in NETUI-5611)
		 */
		SUBTITLE_PRIORITY: {
			por: { //subtitle pref is por and
				por: ["por"], //audio pref is por
				eng: ["por", "leg"] //audio pref is eng
			},
			eng: { //subtitle pref is eng
				eng: ["eng"], //audio pref is eng
				por: ["eng"] //audio pref is por
			},
			off: { //subtitle pref is off
				eng: ["off"], //audio pref is eng
				por: ["off"] //audio pref is por
			}
		},
		/*
		 * Audio priority Matrix to be picked when user zaps channel with preferences made (requirement from NET covered in NETUI-5611)
		 */
		AUDIO_PRIORITY: {
			por: { //audio pref is por and
				por: ["por", "eng", "other", "dub"], //subtitle pref is por
				eng: ["por", "eng", "other", "dub"], //subtitle pref is eng
				off: ["por", "dub", "eng", "other"] //subtitle pref is off
			},
			eng: { //audio pref is eng
				por: ["eng", "por", "other", "dub"], //subtitle pref is por
				eng: ["eng", "por", "other", "dub"], //subtitle pref is eng
				off: ["eng", "por", "other", "dub"] //subtitle pref is off
			}
		},
		AVAILABLE_SUBTITLE_LANGUAGE: "por",

		POSSIBLE_AUTOTUNE_FREQUENCY: ["once", "daily", "weekly"],
		DEFAULT_AUTOTUNE_FREQUENCY: "once",

		DEFAULT_FAVOURITE_NAME: "Favourites",
		FAVOURITE_ALL_CHANNELS: "allChannels",
		FAVOURITE_SUBSCRIBED_CHANNELS: "subscribedChannels",
		DEFAULT_BEFORE_PADDING: 15, //changed as part of R1 - R2 migration
		DEFAULT_AFTER_PADDING: 15, //changed as part of R1 - R2 migration
		DEFAULT_EPISODIC_MAX_NOF_EPISODES: -1,
		PVR_NON_EPISODIC_FOLDER_LIST: "pvr.folders", //changed as part of R1 - R2 migration
		PVR_NON_EPISODIC_DEFAULT_FOLDER: "pvr.defaultfolder", //changed as part of R1 - R2 migration
		PVR_NON_EPISODIC_PADDING_BEFORE: "pvr.nonEpisodic.paddingBefore",
		SYSTEM_NETWORK_USAGEID : "/network/usageId",

		SYSTEM_STB_SERIAL_NUMBER: 6,	// This maps to a middleware PI value
		SYSTEM_STB_MODEL: 8,			// This maps to a middleware PI value

		KEEP_UNTIL_OPTION_30_DAYS: "2",// as part of R1 - R2 migration, we have to use to convert 30_days
		KEEP_UNTIL_OPTION_MANUAL_DELETE: "1",//changed as part of R1 - R2 migration
		KEEP_UNTIL_OPTION_SPACE_NEEDED: "0",//changed as part of R1 - R2 migration

		MAX_NOF_EPISODE_OPTIONS: [-1, 1, 2, 3, 4, 5, 10, 25],

		TYPE_OF_EPISODE_OPTION_ALL_EPISODE: "type_all_episodes",
		TYPE_OF_EPISODE_OPTION_NEW_EPISODE: "new_episodes",
		TYPE_OF_EPISODE_OPTION_JUST_THIS_EPISODE: "just_this_episode",

		DISPLAY_CONTAINER_IN_LEFT: "left",
		DISPLAY_CONTAINER_IN_RIGHT: "right",

		DISPLAY_GUIDE_MODE: "mode.viewType",
		MUSIC_LAST_PLAYED_CHANNEL: "music.lastPlayed.channel",

		USBDLNA_PHOTO_TRANSITION_EFFECTS_AVAILABLE: {
			NONE: -1,
			SLIDE: 1,
			FADE: 2,
			CROSS_FADE: 3,
			ZOOM_FADE: 4
		},

		//For social
		SOCIAL: "social",
		SOCIAL_FACEBOOK_EMAIL: "social.facebook.email",
		SOCIAL_FACEBOOK_PIN_SETTING: "social.facebook.pinSetting",
		SOCIAL_FACEBOOK_PIN: "social.facebook.pin",
		SOCIAL_STB_URL: "social.stb.url",
		SOCIAL_STB_TOKEN_RENEWAL_URL: "social.stb.token.renewal.url",
		SOCIAL_STB_AUTH_CODE_FETCH_URL: "social.stb.auth.code.fetch.url",
		SOCIAL_FACEBOOK_FEATURE_AVAILABILITY: "social.facebook.featureAvailability",
		SOCIAL_FACEBOOK_FEATURE_FORCE_DISABLE: "social.facebook.forceDisable",
		FACEBOOK_FEATURE_AVAILABILITY_SCHEDULER_TITLE: "facebookFeatureAvailabilityCheck",
		TIME_OF_FACEBOOK_SCHEDULER_RUN: "social.facebook.timeOfSchedulerRun",
		TIME_OF_FACEBOOK_RENEWAL_SCHEDULER_RUN: "social.facebook.timeOfRenewalSchedulerRun",
		FACEBOOK_TOKEN_RENEWAL_SCHEDULER_TITLE: "facebookAccessTokenRenewal",
		SHARED_SALT: "social.facebook.sharedSalt",
		SECRET_KEY: "social.facebook.secretAesKey",

		PURCHASE_PIN_PATH: "/users/preferences/userauth/ppvTransactionPin",
		CHANNEL_TYPE_PPV: 128,
		PURCHASE_LIST: "teleidea/purchaselist",//path has been modified to teleidea's path to include purchases made by teleidea too
		SUBSCRIPTION_APP_LAUNCH_CHANNEL: "ppv.subscriptionApp.launchChannel",
		SUBSCRIPTION_CHANNEL: "250",

		APPLICATION_LAUNCH_URL: "applicationLaunch.url",
		APPLICATION_LAUNCH_CONFIG: "applicationLaunch.config",
		APPLICATION_LAUNCH_CONFIG_FETCH_SCHEDULER_TITLE: "applicationLaunchConfigFetchCheck",
		TIME_OF_APP_LAUNCH_CONFIG_FETCH_SCHEDULER_RUN: "applicationLaunch.timeOfSchedulerRun",

		//For Episodic Recordings sub menu
		PREF_EPISODIC_BEFORE_PADDING: "pvr.episodic.before.padding",
		PREF_EPISODIC_AFTER_PADDING: "pvr.episodic.after.padding",
		PREF_EPISODIC_KEEP_UNTIL: "pvr.episodic.keep.until",
		PREF_EPISODIC_TYPE_OF_EPISODES: "pvr.episodic.typeOfEpisodes",
		PREF_EPISODIC_BLOCK_PLAYBACK: "pvr.episodic.blockPlayback",

		PREF_PLAYBACK_PLAYER_TIMEOUT: "pvr.banner.timeout", //changed as part of R1 - R2 migration
		POSSIBLE_PLAYBACK_PLAYER_TIMEOUTS: ["1000", "2000", "3000", "4000", "5000", "10000", "0"], // in  milli seconds //changed as part of R1 - R2 migration

		PREF_DEFAULT_TIPSFROMNET: "ti.net.servicetips",
		PREF_ASPECT_RATIO: "/system/devices/aopmgr/sdAspectRatio",
		PREF_HDMI_AUDIO_OUTPUT: "audio.prefFormat",
		PREF_HDMI_VIDEO_RESOLUTION: "/system/devices/dopmgr/hdVideoFormat",

		PREF_AUTO_STANDBY: "system.inactivitytimer",

		//Upgrade setting
		PREF_UI_MIGRATION_STATUS: "ui.migration.status",


		// both of these constants are used for standby functionality
		POWER_OFF : true,
		POWER_ON : false,

		PREF_VIDEO_SYSTEM: "/system/devices/aopmgr/videoEncStd",
		PREF_AUDIO_LIPSYNC_DELAY: "/system/devices/audmgr/digitalDelayMs",
		POSSIBLE_STANDBY_DURATIONS: ["240", "300", "360", "420", "480", "-1"], // in Minutes, as part of R1 - R2 migration, we have to store it in minutes than hours
		PI_VID_STD_PAL_M: 3,/* lines=525 (active=480), fields=60, frame rate = 29.97Hz */
		PI_VID_STD_NTSC_M: 5, /* lines=525 (active=480), fields=60, frame rate = 29.97Hz */
		PVR_CAPABILITY: {
			CONNECTED: 1, // PLUGGED, Physically connected to HDD
			DISCONNECTED: 2,
			ENABLED: 3 // MEDIUM_READY, Ready to Record
		},

		TRICKPLAY_ICONS_FOR_PHOTO_AUDIO_VIDEO_PLAYBACK : {
			PLAY : 0,
			STOP : 1,
			FWD : 2,
			RWD : 3,
			NEXT : 4,
			PREVIOUS : 5,
			SHUFFLE : 6,
			REPLAY : 7,
			PROGRESSBAR : 8,
			REPEAT : 9,
			SLIDESHOW : 10,
			BACK : 11
		},

		// EventExtInfo (extInfoKey -> propertyKey)
		EVENT_EXTENDED_INFO: {
			LANGUAGE: "por",
			FIELDS: {
				"Actors"      : "actors",
				"Director"    : "director",
				"year"        : "year",
				"country"     : "country",
				"shortName"   : "shortName",
				"Originalname": "Originalname",
				"EpisodeID"   : "episode"
			},
			EPISODIC_INFO: {
				"SeriesID"      : "series",
				"EpisodeID"     : "episode",
				"Originalname"  : "Originalname",
				"epOriginalname": "epOriginalname",
				"shortName"     : "seriesName",
				"episodeName"   : "episodeName",
				"epName"		: "epName"
			},
			EVENT_INFO: {
				"EventId" : "eventId",
				"extInfoKey": "EventId"
			},
			CATCHUP: {
				"CatchupStartover"    : "catchupStartover",
				"DisplaySeasonEpisode": "displaySeasonEpisode",
				"UniqueEventId"       : "uniqueEventId"
			}
		},

		//Parental Control
		MAX_PIN_DIGITS: 4,
		MAX_PIN_ENTRY_ATTEMPTS: 3,
		PIN_DIALOG_SHOW_TIME: 60000,
		MASTER_EXPIRATION_TIME: 28800,
		CHANNEL_LOCK_STATUS_CACHE_LIMIT: 300,
		CHANNEL_OR_PROGRAM_LOCK_STATUS_CACHE_LIMIT: 600,
		DEFAULT_PARENTAL_PIN: "0000",

		//On demand
		RTSP_PROTOCOL: "rtsp://",
		VOD_PURCHASE_CURRENCY: "\u00A3",
		CONTENT_CHAPTER_COUNT: 10,
		ASSET_TYPE: "ASSET",
		PROGRAM_TYPE: "PROGRAM",
		PREF_AREA_ID: "/network/vod/AreaID",
		VOD_HIGHLIGHTS_FOLDER: "Destaques",
		VOD_CLUBE_FOLDER: "NOW%20Clube",
		VOD_MENU_SEARCH: "-1",
		VOD_MENU_MY_VIDEOS: "-2",
		VOD_MENU_EXIT: "",
		VOD_MENU_MY_VIDEOS_RENTED: "-11",
		VOD_MENU_MY_VIDEOS_SUBSCRIPTIONS: "-12",
		VOD_MENU_MY_VIDEOS_ADULT: "-13",
		VOD_MENU_MY_VIDEOS_FAVORITES: "-14",
		VOD_MENU_RECOMMENDATIONS: "-15",
		VOD_EMPTYNODE_REFRESH: "vod.emptynode.refresh",

		// VOD Asset Types
		VOD_ASSET_TYPE: {
			VOD: "ASSET",
			CATCHUP: "CATCHUP",
			STARTOVER: "STARTOVER"
		},

		//Catchup
		CATCHUP_CATALOGUE_ID: 735,

		//Search
		SEARCH_TERM_MINIMUM_INPUT_LENGTH: 3,
		SEARCH_TERM_MAXIMUM_INPUT_LENGTH: 20,
		SEARCH_PAGE_SIZE: 10,

		//Grid guide
		GRID_ROW_HEIGHT: 90,
		GRID_HOURS: 2.5,
		GRID_INTERVAL_MS: 1800000, // 30 mins.
		GRID_TIME_WINDOW: 60 * 60 * 1000 * 2.5, // 2.5 hours

		EPG_POSTER_IMAGE_SUFFIX: "_epg_poster.jpg",

		// Warnings about VOD assets expiring.
		SHOW_VOD_ASSETS_EXPIRING_ON_START_UP_AFTER_SEC: 120,
		WARN_IF_ASSET_HAS_LESS_THAN_HOURS_TO_EXPIRE: 24,
		VOD_ASSETS_EXPIRING_DIALOG_TIMEOUT_SEC: 600,

		// Catch-up related
		CATCHUP_TYPE: 'CU',
		//7 days in milliseconds
		CATCHUP_EVENTS_FOR: 7 * 24 * 60 * 60 * 1000,

		// STB environment
		STB_ENVIRONMENT_IP: 'IP',
		STB_ENVIRONMENT_DVB: 'DVB',
		STB_ENVIRONMENT_HYBRID: 'HYBRID',
		CONFIG_STB_ENVIRONMENT_TYPE: "stb.environment",
		CONFIG_STB_TUNER_TYPE: "stb.tuner.type",

		//Volume
		VOLUME_STEP: 5,
		VOLUME_FULL: 100,
		VOLUME_HALF: 50,
		VOLUME_MUTE: 0,

		//character entry wheel
		DEFAULT_MINIMUM_CHARACTERS: 1,
		DEFAULT_MAXIMUM_CHARACTERS: 20,

		//Audio Delay
		AUDIO_DELAY_MIN: 0,
		AUDIO_DELAY_MAX: 200,
		AUDIO_DELAY_INCREMENTS: 10,

		//Reminder
		DEFAULT_REMINDER_TIME: 120,

		//trickplay
		DEFAULT_SKIP_TIME_SECS: 30,

		//IMAGE_LABEL
		FILTER_ICON_COLOR_VOD: "blue",

		//VOD modes
		VOD_MODE: {
			ALL: 0,
			SVOD: 1,
			CATCHUP: 2
		},

		//Adult Content
		PARENTAL_ADULT_CONTENT: "adult.content",

		// MoCA (for now assumes a single MoCA device)
		PREF_MOCA_ENABLED: "/system/devices/mocamgr/moca0/enabled",
		PREF_MOCA_PRIVACY_ENABLED: "/system/devices/mocamgr/moca0/privacyEnabled",
		PREF_MOCA_PRIVACY_PASSWORD: "/system/devices/mocamgr/moca0/privacyPassword",
		PREF_MOCA_CHANNEL: "/system/devices/mocamgr/moca0/chanPlanBand",
		PREF_MOCA_CHANNEL_MASK: "/system/devices/mocamgr/moca0/chanPlanMask",
		PREF_MOCA_TX_POWER: "/system/devices/mocamgr/moca0/txPwrLevel",
		PREF_MOCA_BEACON_POWER: "/system/devices/mocamgr/moca0/beaconPwrLevel",
		PREF_MOCA_NETWORK_CONTROLLER: "/system/devices/mocamgr/moca0/networkController",
		PREF_MOCA_PHYSICAL_TARGET_RATE: "/system/devices/mocamgr/moca0/phyTargetRate",
		PREF_MOCA_PHYSICAL_MARGIN: "/system/devices/mocamgr/moca0/phyMargin",

		// Directions
		UP: 0,
		DOWN: 1,
		LEFT: 2,
		RIGHT: 3,

		//Garbage collection
		DEFAULT_GARBAGE_COLLECTION_TIMEOUT_DELAY: 30000, //ms
		DEFAULT_GARBAGE_COLLECTION_INTERVAL: 15000, //ms

		ACTIVE_INFO_BUTTON_PATH: "../../../customise/resources/images/%RES/icons/botao_vermelho.png",
		INACTIVE_INFO_BUTTON_PATH: "../../../customise/resources/images/%RES/icons/botao_vermelho_inactive.png",
		ACTIVE_LANGUAGE_BUTTON_PATH: "../../../customise/resources/images/%RES/icons/botao_verde.png",
		INACTIVE_LANGUAGE_BUTTON_PATH: "../../../customise/resources/images/%RES/icons/botao_verde_inactive.png",
		ACTIVE_SUBTITLE_BUTTON_PATH: "../../../customise/resources/images/%RES/icons/botao_amarelo.png",
		INACTIVE_SUBTITLE_BUTTON_PATH: "../../../customise/resources/images/%RES/icons/botao_amarelo_inactive.png",
		ACTIVE_OPTIONS_BUTTON_PATH: "../../../customise/resources/images/%RES/icons/botao_azul.png",
		INACTIVE_OPTIONS_BUTTON_PATH: "../../../customise/resources/images/%RES/icons/botao_azul_inactive.png",
		NET_IMAGES_PATH: "../../../customise/resources/images/net/",
		PRIMARY_NETWORK_CONFIG_PATH: '/system/opentv/network/config/primary',
		SECONDARY_NETWORK_CONFIG_PATH: '/system/opentv/network/config/secondary',
		WIFI_NETWORK_CONFIG_PATH: '/system/opentv/network/config/wifi',
		FAVOURITE_FOLDER_NAME: "default",

		// Portal
		PORTAL_RECORDINGS_LIMIT: 8,

		// CA_ENUMS
		CA_PLAY_ERRORS : {
			contentStartFailedReason : {
				LACK_OF_RESOURCES: -2,
				CONFLICT: -3,
				CA_ACCESS_DENIED: -15,
				CA_ACCESS_BLACKED_OUT: -16,
				CA_ACCESS_PAIRING_REQUIRED: -21,
				CA_ACCESS_CHIPSET_PAIRING_REQUIRED: -22,
				CA_NO_VALID_SECURE_DEVICE: -23,
				DUPLICATE_URI: -26,
				CONTENT_PLAY_FAILED_REASON_NO_LOCK: -28
			},
			contentErrorReason : {
				CA_ACCESS_DENIED: -44,
				CA_ACCESS_BLACKED_OUT: -45,
				CA_ACCESS_PAIRING_REQUIRED: -50,
				CA_ACCESS_CHIPSET_PAIRING_REQUIRED: -51,
				CA_NO_VALID_SECURE_DEVICE: -52,
				CONTENT_ERROR_REASON_STREAM_WRONG_TYPE: -29,
				CONTENT_ERROR_REASON_STREAM_CODEC_NOT_FOUND: -30
			},
			streamDisabledReason : {
				CA_ACCESS_BLACKED_OUT: -1,
				CA_ACCESS_DENIED: -2,
				CA_ACCESS_PAIRING_REQUIRED: -7,
				CA_ACCESS_CHIPSET_PAIRING_REQUIRED: -8,
				CA_NO_VALID_SECURE_DEVICE: -9
			}
		},

		FILM_GENRE_GROUP_ID : 4,
		NONFICTION_GENRE_GROUP_ID : 7,
		EDUCATION_GENRE_GROUP_ID : 8,
		ADULT_GENRE_GROUP_ID : 9,
		EROTICO_GENRE_IN_FILM_GROUP_ID : 6,
		EROTICO_GENRE_IN_EDUCATION_GROUP_ID : 7,
		//search type
		SEARCH_TYPE: {
			EPG: "epg",
			MDSEPG: "mdsepg",
			VOD: "vod",
			CATCHUP: "catchup",
			PVR: "pvr"
		},
		//Search MDS adult categories for VOD and BTV
		MDS_VOD_ADULT_CATEGORIES: ["Erótico", "Adult", "Anal", "Bebida", "BDSM", "Orgia"],
		MDS_EPG_ADULT_CATEGORIES: ["9:1:0:0", "9:2:0:0", "9:3:0:0", "9:4:0:0", "9:6:0:0"],
		//channel list status
		CHANNEL_LIST_STATUS: {
			ALL: 0,
			EMPTY_ALL: 1,
			FAVOURITE: 2,
			EMPTY_FAVOURITE: 3,
			FILTER: 4,
			EMPTY_FILTER: 5
		},
		DIACRITICTERMSSUFFIX: "DiacriticTerms",
		pt_brDiacriticTerms: {
			'a': "[Aa\u00C1\u00E1\u00C2\u00E2\u00C3\u00E3\u00C0\u00E0]",
			'c': "[Cc\u00C7\u00E7]",
			'e': "[Ee\u00C9\u00E9\u00CA\u00EA]",
			'i': "[Ii\u00CD\u00ED]",
			'o': "[Oo\u00D3\u00F3\u00D4\u00F4\u00D5\u00F5]",
			'u': "[Uu\u00DA\u00FA\u00DC\u00FC]"
		},
		DMS_NAME_CONFIG_PATH: '/users/preferences/homeNetworking/dmsName',
		DMS_DEFAULT_NAME: "NET STB",
		DMS_UDN_CONFIG_PATH: '/system/opentv/homeNetworking/dmsUuid',
		DMR_UDN_CONFIG_PATH: '/system/opentv/homeNetworking/dmrUuid',
		PVR_REVIEW_BUFFER_PERCENT_PREF: '/system/opentv/dsm/reviewBufferAlloc',
		PVR_REVIEW_BUFFER_PERCENT_DEFAULT: 10,
		DMS_ENABLE_CONFIG_PATH: 'dms.enable',
		RECORD_SERVER_UDN: 'record.server.udn',
		WHPVR_FEATURE: "whpvr.feature.enabled",
		CATCHUP_FEATURE: "catchup.enabled", // TODO: NETUI-2105 - Remove this constant when new mechinism is in place
		STARTOVER_FEATURE: "startover.enabled", // TODO: NETUI-2105 - Remove this constant when new mechinism is in place
		MOCA_FEATURE: "moca.enabled", // TODO: NETUI-2105 - Remove this constant when new mechinism is in place
		PIP_FEATURE: "pip.enabled", // TODO: NETUI-2105 - Remove this constant when new mechinism is in place
		KEY_RELEASE_SUFFIX: "_rel",
		KEY_RELEASE_TIMEOUT_MS: 300,
		VOD_RECOMMENDATION_FEATURE: "VOD.recommendation.feature.enabled",

		MDS_RETRY_TIMEOUT: 30000,
		MDS_MAX_RECORDS_RETURNED: 1000,

		// FOLDERS
		LEGACY_DEFAULT_NON_EPISODIC_FOLDER_NAME : "My Recording Highlights",
		MEDIA_PLAYBACK_FEATURE: "media.playback.feature.enabled",

		PREF_BARKER_CHANNEL_CONFIG_PATH: '/network/siconfig/CustomDescriptorTags/teleIdeaHDChannelID',

		EPG_SOURCE_DVB: 0,

		YES_OPTION: 1,
		NO_OPTION: 2,
		OK_OPTION: 6,

		DLG_STOP_PLAYBACK_GO_TO_MUSICA: 7,
		DLG_STOP_PLAYBACK_GO_TO_MOSAIC: 8,
		DLG_REMOTE_ACCESS_AUTH: 9,
		DLG_PORTAL_RESUME_RECORDING: 12,
		DLG_INVALID_FOLDER_NAME: 13,
		DLG_LIBRARY_RESUME_RECORDING: 14,
		DLG_NOW_RESUME_OR_STARTOVER: 16,
		DLG_CONFLICT_RESOLUTION: 17,
		DLG_AUTO_TUNE: 18,
		DLG_REMINDER: 19,
		DLG_DISK_SPACE: 20,
		DLG_PPV_EVENT: 21,
		DLG_PPV_PURCHASE_SUCCESS: 22,
		DLG_NEW_POPUP_CA: 24,
		DLG_YES_NO_CONFIRMATION: 25,
		DLG_USB_MEDIA_UNPLUGGED: 26,
		DLG_DVR_OPERATOR_DISABLED: 27,
		DLG_DVR_DISC_NOT_PRESENT: 28,
		DLG_PPV_RECORDING_BLOCKED: 29,
		DLG_USB_FORMAT_ERROR: 30,
		DLG_WHPVR_PLAY_ERROR: 31,
		DLG_WHPVR_RECORD_ERROR: 32,
		DLG_RECORD_CONFIRMATION: 33,
		DLG_CANCEL_RECORD: 34,
		DLG_AUTO_TUNE_CONFLICT: 35,
		DLG_STANDBY_CONFIRMATION: 38,
		DLG_USB_MEDIA_DETECTED: 39,
		DLG_USB_STB_ALREADY_ASSOCIATED: 40,
		DLG_USB_STB_ASSOCIATED: 41,
		DLG_USB_INCOMPATIBLE: 42,
		DLG_USB_FORMAT_COMPLETE: 44,
		DLG_NO_SIGNAL: 45,
		DLG_ETHERNET_DISCONNECTED: 46,
		DLG_WIFI_DISCONNECTED: 47,
		DLG_RECONNECTING: 49,
		DLG_STOP_RECORDING_PLAYBACK: 50,
		DLG_USB_MEDIA: 51,
		DLG_NO_VIDEO: 52,
		DLG_IP_RENEWAL: 53,
		DLG_SAVE_FAVOURITES_ERROR: 54,
		DLG_SAVING_FAVOURITES: 55,
		DLG_FETCHING_FAVORITES_ERROR: 56,
		DLG_SAVE_BLOCKED_CHANNELS: 57,
		DLG_DUPLICATE_FOLDER_NAME: 58,
		DLG_USB_DRIVE_ATTACHED: 59,
		DLG_PURCHASE_PIN_CHANGE: 61,
		DLG_PARENTAL_PIN_CHANGE: 62,
		DLG_INVALID_DATE: 66,
		DLG_INVALID_TIME: 67,
		DLG_FACEBOOK_PIN_CHANGE_SUCCESS: 68,
		DLG_FACEBOOK_PIN_CHANGE_FAILURE: 69,
		DLG_FACEBOOK_PIN_MISMATCH: 70,
		DLG_FACEBOOK_AUTHORISED: 71,
		DLG_CANCEL_SERIES: 73,
		DLG_FACEBOOK_ACCOUNT: 72,
		DLG_ACCOUNT_LINKED: 74,
		DLG_FACTORY_RESET_RECORDING: 75,
		DLG_FACTORY_RESET_SCHEDULED: 76,
		DLG_USB_WAITING: 77,
		DLG_FACTORY_RESET_CONFIRMATION: 78,
		DLG_UNAUTHORISED_RECORDING: 79,
		DLG_FACEBOOK_AUTH_ERROR: 80,
		DLG_SOCIAL_ACCOUNT_AUTHORISED: 81,
		DLG_FACEBOOK_POST_ACCOUNT: 82,
		DLG_FACEBOOK_DISCONNECT_ACCOUNT: 83,
		DLG_PPV_PURCHASE_ERROR: 84,
		DLG_CHANNEL_SUBSCRIPTION: 85,
		DLG_PPV_CHANNEL_SUBSCRIPTION: 86,
		DLG_USB_DEVICE_DETECTED: 87,
		DLG_AUTO_TUNE_START: 88,
		DLG_ATA_FORMAT_COMPLETE: 89,
		DLG_WHPVR_SERVER_NOT_PRESENT: 90,
		DLG_CHANNEL_UNSUBSCRIBED: 91,
		DLG_WHPVR_SWITCH: 92,
		DLG_MEDIA_DEVICE_UNPLUGGED: 93,
		DLG_DLNA_COMMUNICATION_ERROR: 94,
		DLG_FORCED_SOFTWARE_UPDATE: 95,
		DLG_DVR_DUPLICATE_FOLDER_ERROR: 97,
		DLG_STARTOVER_PLAYBACK_CONFIRM: 98,
		DLG_CA_SMART_CARD_EXPIRED: 99,
		DLG_CA_SMART_CARD_NOT_CERTIFIED: 100,
		DLG_CA_SMART_CARD_INVALID: 101,
		DLG_CA_SMART_CARD_MUTE: 102,
		DLG_CA_SMART_CARD_SUSPENDED: 103,
		DLG_CA_SMART_CARD_BLACKLISTED: 104,
		DLG_CA_SMART_CARD_NOT_PAIRED: 105,
		DLG_CA_SMART_CARD_NEEDS_CHIPSET_PAIRING: 106,
		DLG_CA_SMART_CARD_BLACKOUT: 107,
		DLG_CA_SMART_CARD_ACCESS_DENIED: 108,
		DLG_CA_SMART_CARD_INCOMPATIBLE: 109,
		DLG_CA_SMART_CARD_REMOVED: 110,
		DLG_CA_SMART_CARD_NEVER_PAIRED: 111,
		DLG_MANUAL_REC_MSG: 112,
		DLG_ONDEMAND_PLAYER: 115,
		DLG_STOP_PVR_PLAYBACK: 116,
		DLG_UNPLUG_HARDDISK: 117,
		DLG_STOP_RECORDING: 118,
		DLG_MORE_ON_NOW: 119,
		DLG_PIN_MISMATCH: 120,
		DLG_MANUAL_REC_FAIL_MSG : 121,
		DLG_CATCHUP_SYSTEM_MSG: 122,
		DLG_PVR_JOB_FAILED_MSG: 123,
		DLG_STARTOVER_RESUME_OR_STARTOVER: 124,
		DLG_CONFIRM_LEAVE_INSTALLER: 125,
		DLG_DELETE_RECORD: 126,
		DLG_TS_SIGNAL_LOSS: 127,
		DLG_MEDIA_DEVICE_SAFE_REMOVE: 128,
		DLG_CANCEL_LIVE_RECORD: 129,
		DLG_SAFE_REMOVE_HARDDISK: 130,
		DLG_SAFE_REMOVE_HARDDISK_FAILED: 131,
		DLG_SAFE_REMOVE_HARDDISK_OK: 132,
		DLG_AT_TASK_FAILED_MSG: 133,
		DLG_TUNE_FAILED_MSG: 134,
		DLG_PVR_INVALID_EVENT_MSG: 135,
		DLG_USB_DOMAIN_UNCERTAIN: 136,
		DLG_EXIT_APP: 137,
		DLG_SAFE_REMOVE_HARDDISK_RECORDING_IN_PROGRESS: 138,
		DLG_CA_SMART_CARD_ACCESS_DENIED_PPV: 139,
		DLG_NEW_POPUP_CA_AUTOTIMEOUT: 140,
		DLG_NEW_POPUP_MAIL: 141,
		DLG_FACEBOOK_AUTHENTICATION: 142,
		DLG_FACEBOOK_PIN_CHANGE: 143,
		DLG_NO_FOLDER_NAME: 144,
		DLG_FOLDER_NAME_EXISTS: 145,
		DLG_CATCHUP_NOT_FOUND: 146,
		DLG_CATCHUP_FORBIDDEN: 147,

		DLG_ACTIONS: {
			CONTINUE_CANCEL_EPISODE_OPTION: 1,
			CONTINUE_CANCEL_SERIES_OPTION: 3,
			EXIT_OPTION: 2
		},
		POPUP_MULTIROW_DATA_TYPE: {
			LABEL: "label",
			POPUP: "popup",
			DIRECT_ENTRY: "directTextEntry"
		}
	};

}($N || {}));

