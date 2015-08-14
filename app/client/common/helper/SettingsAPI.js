/**
 * This class will contain common logic that will be used for setting or getting settings for the STB
 * @class $N.app.SettingsAPI
 * @static
 * @author gstacey
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.app.ParentalControlUtil
 * @requires $N.app.constants
 * @requires $N.platform.output.AV
 * @requires $N.platform.system.Device
 * @requires $N.platform.system.Scan
 * #depends ParentalControlUtil.js
 * #depends ../Constants.js
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.SettingsAPI = (function () {
		var CONNECTION_TIMEOUT_MILLIS = 3000,
			log = new $N.apps.core.Log("Helper", "SettingsAPI"),
			parentalControlHelper = $N.app.ParentalControlUtil,
			dvbsLnbProfilePath = '/system/devices/tnrmgr',
			dvbsLnbPrameterKeys = {
				lnbLowFrequency: 'lnbFreqLoKhz',
				lnbHighFrequency: 'lnbFreqHiKhz',
				lnbSwitchingFrequency: 'lnbFreqSwKhz',
				lnbPower: 'lnbPower'
			},
			prefsList = [
				$N.app.constants.PREF_TV_CURRENT_SERVICE_ID,
				$N.app.constants.PREF_RECENT_SEARCH_TERMS,
				$N.app.constants.PREF_LANGUAGE,
				$N.app.constants.PREF_ISINSTALLED,
				$N.app.constants.PREF_USER_RATING,
				$N.app.constants.PREF_ZAPPING_BANNER_TIMEOUT,
				$N.app.constants.PREF_RECENT_SEARCH_TERMS,
				$N.app.constants.PREF_TV_CATEGORY,
				$N.app.constants.PREF_TV_SORT,
				$N.app.constants.PREF_HARD_OF_HEARING,
				$N.app.constants.PREF_GUIDE_TEXT_SIZE,
				$N.app.constants.PREF_AUDIO_LANGUAGE,
				$N.app.constants.PREF_SUBTITLE_STATE,
				$N.app.constants.PREF_DEFAULT_AUDIO_FORMAT,
				$N.app.constants.PREF_DEFAULT_ASPECT_RATIO_HD,
				$N.app.constants.PREF_DEFAULT_ASPECT_RATIO_ANALOGUE,
				$N.app.constants.PREF_DEFAULT_AUDIO_DELAY,
				$N.app.constants.PREF_NETWORK_HTTP_PROXY,
				$N.app.constants.PREF_BEFORE_PADDING,
				$N.app.constants.PREF_AFTER_PADDING,
				$N.app.constants.PREF_ASPECT_RATIO,
				$N.app.constants.PREF_HDMI_VIDEO_RESOLUTION,
				$N.app.constants.DISPLAY_GUIDE_MODE,
				$N.app.constants.SOCIAL_FACEBOOK_PIN
			],
			aspectRatioLookupHD = {
				hdmiPillarBox: $N.platform.output.AV.VideoAspectMode.HDMI_PILLAR_BOX,
				hdmiStretch: $N.platform.output.AV.VideoAspectMode.HDMI_STRETCH
			},
			aspectRatioLookupAnalogue = {
				analogueLetterBox: $N.platform.output.AV.VideoAspectMode.ANALOGUE_LETTER_BOX,
				analoguePanScan: $N.platform.output.AV.VideoAspectMode.ANALOGUE_PAN_SCAN,
				analogueCenterCut: $N.platform.output.AV.VideoAspectMode.ANALOGUE_CENTER_CUT,
				analogueStretch: $N.platform.output.AV.VideoAspectMode.ANALOGUE_STRETCH
			},
			audioFormatLookup = {
				mono: $N.platform.system.Device.AUDIO_CHANNELS_MONO,
				stereo: $N.platform.system.Device.AUDIO_CHANNELS_STEREO,
				surround: $N.platform.system.Device.AUDIO_CHANNELS_SURROUND
			},
			defaultFavourite = null,
			defaultScanParameters = {
				lnbPolarization: $N.platform.system.Scan.DVBS_Polarization.LINEAR_HORIZONTAL,
				fecInner: $N.platform.system.Scan.DVBS_InnerFEC._3_4,
				fecOuter: $N.platform.system.Scan.DVBC_OuterFEC.AUTO,
				symbolRate: 27500,
				frequency: 11953000,
				modulation: $N.platform.system.Scan.DVBS_ModulationType.QPSK,
				lnbLowFrequency: 9750,
				lnbHighFrequency: 10600,
				lnbSwitchingFrequency: 11700,
				lnbPower: true,
				rollOff: $N.platform.system.Scan.DVBS_RollOff._0_20,
				isDVBS2: false,
				isDVBC2: false
			},
			wifiNetworks = null,
			wifiInterface = null,
			ethernetInterface = null,
			availableConnections = [],
			CONNECT = {action: "NETWORK_CONNECT", url: "../../../customise/resources/images/%RES/actionIcons/Icn_actionConnect.png", title: ""},
			ADVANCED_SETTINGS = {action: "ADVANCED_SETTINGS", url: "../../../customise/resources/images/%RES/actionIcons/Icn_actionConnect.png", title: "ADVANCED SETTINGS"},
			ENTER_PASSWORD = {action: "ENTER_PASSWORD", url: "../../../customise/resources/images/%RES/actionIcons/Icn_actionConnect.png", title: ""},
			SHOW = {action: "SHOW", url: "../../../customise/resources/images/%RES/actionIcons/Icn_actionConnect.png", title: ""},
			OTHER_NETWORK = {protocol: 14, security: null, ssid: "Join Other", encryptMode: null, quality: 100, key: "", type: "", name: "Join Other"};

		/**
		 * Generates the menu options to be added for network connections
		 * @method getActionsForNetwork
		 * @private
		 * @return {Object} An array of menu options
		 */
		function getActionsForNetwork() {
			var menu = [];
			menu.push(CONNECT);
			return menu;
		}

		function getActionsForWifi() {
			var menu = [];
			menu.push(ADVANCED_SETTINGS);
			return menu;
		}

		/**
		 * Sets availableConnections with networks passed from CCOM
		 * @method scanforWirelessNetworksOKListener
		 * @param {Object} e An event object.
		 */
		function scanforWirelessNetworksOKListener(e) {
			var i = 0;
			wifiNetworks = e.networks;
			log('initialise', wifiNetworks.length + ' wireless networks found');
			/*
			the CCOM API
				a. doesn't include 'ethernet' as a network connection
				b. doesn't have the attributes 'type' and 'name' for wireless networks
			so we add them here to have some uniformity
			*/
			for (i = wifiNetworks.length - 1; i >= 0; i--) {
				wifiNetworks[i].type = $N.platform.system.Network.NetworkType.WIFI;
				wifiNetworks[i].name = wifiNetworks[i].ssid;
			}
			wifiNetworks.sort(function (a, b) {
				return b.quality - a.quality;
			});
			availableConnections = availableConnections.concat(wifiNetworks).concat(OTHER_NETWORK);
		}

		/**
		 * @method scanforWirelessNetworksFailedListener
		 * @param {Object} e An event object.
		 */
		function scanforWirelessNetworksFailedListener(e) {
			log('initialise', 'wireless networks not found: ' + e.error.name);
			availableConnections = [];
			availableConnections = availableConnections.concat(OTHER_NETWORK);
		}

		/**
		 * For DVBC tuner set the default parameters using configman
		 * @private
		 * @method setDefaultScanningParamsForDVBC
		 */
		function setDefaultScanningParamsForDVBC() {
			var DVBCProfilePath = $N.app.DVBScanUtil.getDVBCProfilePath();
			defaultScanParameters.frequency = $N.platform.system.Preferences.get(DVBCProfilePath + '/frequency', true);
			defaultScanParameters.fecInner = $N.platform.system.Preferences.get(DVBCProfilePath + '/fecInner', true);
			defaultScanParameters.modulation = $N.platform.system.Preferences.get(DVBCProfilePath + '/modulation', true);
			defaultScanParameters.isDVBC2 = $N.platform.system.Preferences.get(DVBCProfilePath + '/isDvbC2', true);
			defaultScanParameters.symbolRate = $N.platform.system.Preferences.get(DVBCProfilePath + '/symbolRate', true);
			defaultScanParameters.fecOuter = $N.platform.system.Preferences.get(DVBCProfilePath + '/fecOuter', true);
		}

		/**
		 * Sets DVBS default LNB parameters using configman values
		 * @private
		 * @method setDefaultScanningParamsForDVBS
		 */
		function setDefaultScanningParamsForDVBS() {
			var paramName = null;
			for (paramName in dvbsLnbPrameterKeys) {
				if (dvbsLnbPrameterKeys.hasOwnProperty(paramName) && dvbsLnbPrameterKeys[paramName]) {
					defaultScanParameters[paramName] = $N.platform.system.Preferences.get(dvbsLnbProfilePath + '/' + dvbsLnbPrameterKeys[paramName], true);
				}

			}
		}

		/**
		 * Returns DVBC/DVBS default scanning preferences from defaultScanParameters
		 * @private
		 * @method getDefaultScanPreferences
		 * @param {boolean} isDVBCTuner
		 * @return {object} defaultPreferences
		 */
		function getDefaultScanPreferences(isDVBCTuner) {
			var defaultPreferences = {};
			//Common parameters for both DVBC and DVBS
			defaultPreferences.frequency = defaultScanParameters.frequency;
			defaultPreferences.fecInner = defaultScanParameters.fecInner;
			defaultPreferences.symbolRate = defaultScanParameters.symbolRate;
			defaultPreferences.modulation = defaultScanParameters.modulation;
			if (isDVBCTuner) {
				//DVBC specific parameters
				defaultPreferences.fecOuter = defaultScanParameters.fecOuter;
				defaultPreferences.isDVBC2 = defaultScanParameters.isDVBC2;
				defaultPreferences.networkId = $N.platform.system.Scan.NetworkType.DVBC;
			} else {
				//DVBS specific parameters
				defaultPreferences.lnbPolarization = defaultScanParameters.lnbPolarization;
				defaultPreferences.rollOff = defaultScanParameters.rollOff;
				defaultPreferences.isDVBS2 = defaultScanParameters.isDVBS2;
				defaultPreferences.networkId = $N.platform.system.Scan.NetworkType.DVBS;
				defaultPreferences.lnbLowFrequency = defaultScanParameters.lnbLowFrequency;
				defaultPreferences.lnbHighFrequency = defaultScanParameters.lnbHighFrequency;
				defaultPreferences.lnbSwitchingFrequency = defaultScanParameters.lnbSwitchingFrequency;
				defaultPreferences.lnbPower = defaultScanParameters.lnbPower;
			}

			return defaultPreferences;
		}

		/**
		 * Updates the LNB default values in configman
		 * @private
		 * @method updateLnbConfigmanDefaultValues
		 * @param {string} configmanKey
		 * @param {number|boolean} updatedValue
		 */
		function updateLnbConfigmanDefaultValue(configmanKey, updatedValue) {
			$N.platform.system.Preferences.set(dvbsLnbProfilePath + '/' + configmanKey, updatedValue, true);
		}

		/* Public API */
		return {
			/**
			 * initialise the SettingAPI
			 * @method initialise
			 */
			initialise: function () {
				log("initialise", "Enter");
				var currentCategory = $N.platform.btv.ChannelCategories.getCurrentCategory(),
					networkLength,
					i;
				OTHER_NETWORK.type = $N.platform.system.Network.NetworkType.WIFI;
				availableConnections = [];
				defaultFavourite = $N.platform.system.Preferences.get($N.app.constants.PREF_EXCLUDE_UNSUBSCRIBED_CHANNELS) === "true" ? $N.app.constants.FAVOURITE_SUBSCRIBED_CHANNELS : $N.app.constants.FAVOURITE_ALL_CHANNELS;
				if (currentCategory !== defaultFavourite && (currentCategory === $N.app.constants.FAVOURITE_SUBSCRIBED_CHANNELS ||
					currentCategory === $N.app.constants.FAVOURITE_ALL_CHANNELS)) {
					$N.platform.btv.ChannelCategories.setCurrentCategory(defaultFavourite);
				}
				$N.apps.core.Language.adornWithGetString(this);
				if ($N.platform.system.Network.isEthernetAvailable() && $N.platform.system.Network.isNetworkAvailable($N.platform.system.Network.NetworkType.ETHERNET)) {
					log('initialise', 'ethernet available');
					ethernetInterface = $N.platform.system.Network.getNetworkByType($N.platform.system.Network.NetworkType.ETHERNET);
					availableConnections.push(ethernetInterface);
					ethernetInterface.type = $N.platform.system.Network.NetworkType.ETHERNET;
					CONNECT.title = this.getString("menuConnect");
				}
				log("initialise", "Exit");
			},

			/**
			 * Returns the default favourite folder name
			 * @method getDefaultFavourite
			 * @return {String} The default favourite folder name
			 */
			getDefaultFavourite: function () {
				log("getDefaultFavourite", "Enter & Exit");
				return defaultFavourite;
			},

			/**
			 * Returns the iso639 (3 letter codes) of the subtitle languages available on the STB
			 * @method availableSubtitleLanguages
			 * @return {array} iso639 of subtitle languages bundles available as strings
			 */
			availableSubtitleStates: function () {
				log("availableSubtitleLanguages", "Enter & Exit");
				return $N.app.constants.AVAILABLE_SUBTITLE_STATES;
			},

			/**
			 * Returns the iso639 (3 letter codes) of the audio languages available on the STB
			 * @method availableLanguages
			 * @return {array} iso639 of audio languages bundles currently available as strings
			 */
			availableAudioLanguages: function () {
				log("availableAudioLanguages", "Enter & Exit");
				return $N.app.constants.LANG_AVAILABLE_AUDIO;
			},


			/**
			 * Returns the iso-locale-code of languages bundles currently available
			 * @method availableLanguages
			 * @return {array} iso-locale-code of languages bundles currently available as strings
			 */
			availableLanguages: function () {
				log("availableLanguages", "Enter & Exit");
				return $N.app.constants.LANG_AVAILABLE_MENU_LOCALES;
			},

			/**
			 * Returns the surfer duration times currently available
			 * @method availableSurferDurations
			 * @return {array} surfer times (in seconds) currently available eg [5,10,20]
			 */
			availableSurferDurations: function () {
				log("availableSurferDurations", "Enter & Exit");
				return $N.app.constants.POSSIBLE_SURFER_DURATIONS;
			},

			/**
			 * Returns the currently available PIP positions
			 * @method getAvailableMiniguidePipPositions
			 * @return {array} currently available eg [1,2]
			 */
			getAvailableMiniguidePipPositions: function () {
				log("getAvailableMiniguidePipPositions", "Enter & Exit");
				return $N.app.constants.POSSIBLE_PIP_POSITIONS;
			},

			/**
			 * Returns the media transition effects currently available
			 * @method getAvailableTransitionEffects
			 * @return {array} transition effect types currently available eg [-1, 1, 2, 3]
			 */
			getAvailableTransitionEffects: function () {
				log("getAvailableTransitionEffects", "Enter & Exit");
				return $N.app.constants.USBDLNA_PHOTO_TRANSITION_EFFECTS_AVAILABLE;
			},

			/**
			 * Returns the playback player timeouts currently available
			 * @method availPlaybackPlayerOptions
			 * @return {array} playback player options currently available eg [-1 for Never Disappear, 1000 for 1 second, 2000 for 2 seconds,...]
			 */
			availPlaybackPlayerOptions: function () {
				log("availPlaybackPlayerOptions", "Enter & Exit");
				return $N.app.constants.POSSIBLE_PLAYBACK_PLAYER_TIMEOUTS;
			},

			/**
			 * Stores the morality level to prefs and updates the user rating value in parental control class
			 * @method setMoralityLevel
			 * @param {Object} level
			 */
			setMoralityLevel: function (level) {
				log("setMoralityLevel", "Enter");
				$N.platform.ca.ParentalControl.setUserRatingValue(level);
				$N.platform.system.Preferences.set($N.app.constants.PREF_USER_RATING, String(level));
				parentalControlHelper.updateVideoBlocker();
				log("setMoralityLevel", "Exit");
			},

			/**
			 * Gets the morality level from prefs or from \parentalControl class if this does not exist
			 */
			getMoralityLevel: function () {
				log("getMoralityLevel", "Enter");
				var level = $N.platform.ca.ParentalControl.getUserRatingValue();
				log("getMoralityLevel", "Exit");
				return level;
			},

			isChannelLocked: function (serviceId) {
				log("isChannelLocked", "Enter & Exit - serviceId = " + serviceId);
				return $N.platform.ca.ParentalControl.isServiceIdRestricted(serviceId);
			},

			isCurrentUserMaster: function () {
				log("isCurrentUserMaster", "Enter & Exit");
				return $N.platform.ca.ParentalControl.isCurrentUserMaster();
			},

			/**
			 * Resets the preferences file to remove user settings
			 * and removed services
			 * @method clearChannelsAndPrefs
			 */
			clearChannelsAndPrefs: function () {
				log("clearChannelsAndPrefs", "Enter");
				$N.platform.system.Device.deletePrefs(prefsList);
				$N.platform.btv.EPG.removeAllChannels();
				$N.platform.btv.Favourites.deleteAll();
				$N.app.ChannelManager.removeAllChannelsFromBlockedList();
				log("clearChannelsAndPrefs", "Exit");
			},

			/**
			 * Sets the prefered Audio Format
			 * @method setAudioFormatsetAudioFormat
			 * @param {Number} selectedAudioFormat
			 * @param {String} prefValue mono, stereo or surround
			 */
			setAudioFormat: function (selectedAudioFormat, prefValue) {
				log("setAudioFormat", "Enter - selectedAudioFormat = " + selectedAudioFormat + ", prefValue = " + prefValue);
				$N.platform.system.Device.setPreferredAudioChannels(selectedAudioFormat);
				$N.platform.system.Preferences.set($N.app.constants.PREF_DEFAULT_AUDIO_FORMAT, prefValue);
				log("setAudioFormat", "Exit");
			},

			/**
			 * Sets the preferred Aspect Ratio
			 * @method setVideoAspectMode
			 * @param {Number} selectedAspectRatio
			 * @param {String} preferredAspectRatio [hdmiPillarBox,hdmiStretch,analogueLetterBox,analoguePanScan,analogueCenterCut,analogueStretch]
			 */
			setHdVideoAspectMode: function (selectedAspectRatio, preferredAspectRatio) {
				var isSet = $N.platform.output.AV.setHDVideoAspectMode(selectedAspectRatio);
				if (!isSet) {
					preferredAspectRatio = $N.platform.output.AV.getHDVideoAspectMode();
					$N.platform.output.AV.setHDVideoAspectMode(preferredAspectRatio);
					return false;
				} else {
					$N.platform.system.Preferences.set($N.app.constants.PREF_DEFAULT_ASPECT_RATIO_HD, preferredAspectRatio);
					return true;
				}
			},

			/**
			 * Sets the preferred Aspect Ratio
			 * @method setVideoAspectMode
			 * @param {Number} selectedAspectRatio
			 * @param {String} preferredAspectRatio [hdmiPillarBox,hdmiStretch,analogueLetterBox,analoguePanScan,analogueCenterCut,analogueStretch]
			 */
			setSdVideoAspectMode: function (selectedAspectRatio, preferredAspectRatio) {
				var isSet = $N.platform.output.AV.setAnalogueVideoAspectMode(selectedAspectRatio);
				if (!isSet) {
					preferredAspectRatio = $N.platform.system.Preferences.get($N.app.constants.PREF_DEFAULT_ASPECT_RATIO_ANALOGUE, true);
					$N.platform.output.AV.setAnalogueVideoAspectMode(preferredAspectRatio);
					return false;
				} else {
					$N.platform.system.Preferences.set($N.app.constants.PREF_DEFAULT_ASPECT_RATIO_ANALOGUE, preferredAspectRatio, true);
					return true;
				}
			},

			setAspectRatio: function (selectedAspectRatio, preferredAspectRatio) {
				var isSet = $N.platform.output.AV.setAspectRatio(selectedAspectRatio);
				if (!isSet) {
					preferredAspectRatio = $N.platform.system.Preferences.get($N.app.constants.PREF_ASPECT_RATIO, true);
					$N.platform.output.AV.setAspectRatio(preferredAspectRatio);
					return false;
				} else {
					$N.platform.system.Preferences.set($N.app.constants.PREF_ASPECT_RATIO, preferredAspectRatio, true);
					return true;
				}
			},

			setHdmiAudioType: function (selectedAudioType, preferredAudioType) {
				if (preferredAudioType === $N.app.constants.HDMI_AUDIO_PCM_STRING) {
					$N.platform.system.Preferences.set($N.app.constants.PREF_HDMI_AUDIO_TYPE, $N.app.constants.HDMI_AUDIO_PCM, true);
				} else {
					// Assume it to be Dolby
					$N.platform.system.Preferences.set($N.app.constants.PREF_HDMI_AUDIO_TYPE, $N.app.constants.HDMI_AUDIO_DOLBY, true);
				}
				$N.app.AudioManager.setPreferredAudioType(selectedAudioType);
				return true;
			},

			setSpdifAudioType: function (selectedAudioType, preferredAudioType) {
				if (preferredAudioType === $N.app.constants.HDMI_AUDIO_PCM_STRING) {
					$N.platform.system.Preferences.set($N.app.constants.PREF_SPDIF_AUDIO_TYPE, $N.app.constants.HDMI_AUDIO_PCM, true);
				} else {
					// Assume it to be Dolby
					$N.platform.system.Preferences.set($N.app.constants.PREF_SPDIF_AUDIO_TYPE, $N.app.constants.HDMI_AUDIO_DOLBY, true);
				}
				$N.platform.system.Preferences.set($N.app.constants.PREF_SPDIF_AUDIO_OUTPUT, preferredAudioType);
				return true;
			},

			setHdmiVideoResolution: function (selectedResolution, preferredResolution) {
				var isSet = $N.platform.output.AV.setResolution(selectedResolution);
				if (!isSet) {
					preferredResolution = $N.platform.system.Preferences.get($N.app.constants.PREF_HDMI_VIDEO_RESOLUTION, true);
					$N.platform.output.AV.setResolution(preferredResolution);
					return false;
				} else {
					$N.platform.system.Preferences.set($N.app.constants.PREF_HDMI_VIDEO_RESOLUTION, preferredResolution, true);
					return true;
				}

			},

			/**
			 * Returns the available standby durations
			 * @method availableStandbyDurations
			 * @return {array} standby durations (in hours) available eg [5,6,7]
			 */
			availableStandbyDurations: function () {
				log("availableStandbyDurations", "Enter & Exit");
				return $N.app.constants.POSSIBLE_STANDBY_DURATIONS;
			},

			setAudioDelay: function () {
				var lipSyncDelayNumber,
					preferredLipsyncDelay = $N.platform.system.Preferences.get($N.app.constants.PREF_AUDIO_LIPSYNC_DELAY, true);
				if (preferredLipsyncDelay) {
					lipSyncDelayNumber = parseInt(preferredLipsyncDelay, 10);
					$N.platform.output.AV.setAudioDelay(lipSyncDelayNumber);
				}
			},

			/**
			 * Reads in default values of the  audioFormat,
			 * aspectRatio and audioDelay from the
			 * preferences file.
			 * @method initialiseAVOptions
			 */
			initialiseAVOptions: function () {
				log("initialiseAVOptions", "Enter");
				var audioFormat = $N.platform.system.Preferences.get($N.app.constants.PREF_DEFAULT_AUDIO_FORMAT),
					aspectRatio = $N.platform.system.Preferences.get($N.app.constants.PREF_ASPECT_RATIO, true),
					displayFormatHd = $N.platform.output.AV.getHDVideoAspectMode(),
					displayFormatAnalogue = $N.platform.system.Preferences.get($N.app.constants.PREF_DEFAULT_ASPECT_RATIO_ANALOGUE, true),
					hdmiVideoResolution = $N.platform.system.Preferences.get($N.app.constants.PREF_HDMI_VIDEO_RESOLUTION, true),
					hdmiAudioType = $N.platform.system.Preferences.get($N.app.constants.PREF_HDMI_AUDIO_OUTPUT),
					lipsyncDelay = $N.platform.system.Preferences.get($N.app.constants.PREF_AUDIO_LIPSYNC_DELAY, true);

				if (audioFormat) {
					$N.platform.system.Device.setPreferredAudioChannels(audioFormatLookup[audioFormat]);
				}

				if (aspectRatio === $N.platform.output.AV.VideoAspectRatio.ASPECT_RATIO_4_3) {
					this.setAspectRatio($N.platform.output.AV.VideoAspectRatio.ASPECT_RATIO_4_3, aspectRatio);
				} else {
					this.setAspectRatio($N.platform.output.AV.VideoAspectRatio.ASPECT_RATIO_16_9, aspectRatio);
				}

				if (displayFormatAnalogue === $N.platform.output.AV.VideoAspectMode.ANALOGUE_STRETCH) {
					this.setSdVideoAspectMode($N.platform.output.AV.VideoAspectMode.ANALOGUE_STRETCH, displayFormatAnalogue);
				} else {
					this.setSdVideoAspectMode($N.platform.output.AV.VideoAspectMode.ANALOGUE_LETTER_BOX, displayFormatAnalogue);
				}

				if (displayFormatHd === $N.platform.output.AV.VideoAspectMode.HDMI_STRETCH) {
					this.setHdVideoAspectMode($N.platform.output.AV.VideoAspectMode.HDMI_STRETCH, displayFormatHd);
				} else {
					this.setHdVideoAspectMode($N.platform.output.AV.VideoAspectMode.HDMI_PILLAR_BOX, displayFormatHd);
				}

				if (hdmiVideoResolution === 1) {
					this.setHdmiVideoResolution($N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_480I, hdmiVideoResolution);
				} else if (hdmiVideoResolution === 2) {
					this.setHdmiVideoResolution($N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_480P, hdmiVideoResolution);
				} else if (hdmiVideoResolution === 5) {
					this.setHdmiVideoResolution($N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_720P, hdmiVideoResolution);
				} else if (hdmiVideoResolution === 6) {
					this.setHdmiVideoResolution($N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_1080I, hdmiVideoResolution);
				} else if (hdmiVideoResolution === 7) {
					this.setHdmiVideoResolution($N.platform.output.AV.VideoResolution.HDMI_VIDEO_FORMAT_1080P, hdmiVideoResolution);
				}

				if (hdmiAudioType === $N.app.constants.HDMI_AUDIO_PCM) {
					this.setHdmiAudioType(CCOM.System.HDMI_AUDIO_TYPE_PCM, hdmiAudioType);
				} else {
					this.setHdmiAudioType(CCOM.System.HDMI_AUDIO_TYPE_DDPLUS, hdmiAudioType);
				}

				if (lipsyncDelay) {
					this.setAudioDelay();
				}
				log("initialiseAVOptions", "Exit");
			},

			/**
			 * Cancel a satellite scan
			 * @method cancelScan
			 */
			cancelScan: function () {
				log("cancelScan", "Enter & Exit");
				$N.common.helper.ScanManager.stopScan();
			},

			/**
			 * Returns the default scanning parameters
			 * @method getDefaultScanningParams
			 * @return {Object} the scanning parameters
			 */
			getDefaultScanningParams: function () {
				log("getDefaultScanningParams", "Enter");
				if ($N.app.DVBScanUtil.getIsDVBCTuner()) {
					setDefaultScanningParamsForDVBC();
				} else {
					setDefaultScanningParamsForDVBS();
				}
				log("getDefaultScanningParams", "Exit");
				return defaultScanParameters;
			},

			/**
			 * If the given sdp pin does not match the sdp pin on the box then
			 * the pins are set to the given pin
			 * @method storeSdpPin
			 * @param {String} sdpPin
			 */
			storeSdpPin: function (sdpPin) {
				log("storeSdpPin", "Enter - sdpPin = " + sdpPin);
				if (sdpPin) {
					var prevSdpPin = $N.platform.ca.PINHandler.getAccountMasterPin();
					if (!prevSdpPin || prevSdpPin !== sdpPin) {
						//new SDP PIN so override current PINs with this
						$N.platform.ca.PINHandler.setAccountMasterPin(sdpPin);
						$N.platform.ca.PINHandler.setLocalMasterPin(sdpPin);
						$N.platform.ca.PINHandler.setLocalSlavePin(sdpPin);
					}
				}
				log("storeSdpPin", "Exit");
			},

			getAvailableNetworks: function () {
				return availableConnections;
			},

			getActionsForNetwork: getActionsForNetwork,

			getActionsForWifi: getActionsForWifi,

			connectToWirelessNetwork: function (networkId, networkSSID, security, key, encryptMode, connectedCallback, connectionFailedCallback) {
				if (connectedCallback) {
					CCOM.IpNetwork.addEventListener('connectToWirelessNetworkOK', connectedCallback);
				}
				if (connectionFailedCallback) {
					CCOM.IpNetwork.addEventListener('connectToWirelessNetworkFailed', connectionFailedCallback);
				}
				CCOM.IpNetwork.connectToWirelessNetwork(networkId, networkSSID, security, key, encryptMode);
			},

			controlInterface: function (id, state, controlInterfaceOK, controlInterfaceFailed) {
				if (controlInterfaceOK) {
					CCOM.IpNetwork.addEventListener('controlInterfaceOK', controlInterfaceOK);
				}
				if (controlInterfaceFailed) {
					CCOM.IpNetwork.addEventListener('controlInterfaceFailed', controlInterfaceFailed);
				}
				CCOM.IpNetwork.controlInterface(id, state);
			},
			setWirelessConfig: function (id, details) {
				var test = CCOM.IpNetwork.setWirelessConfig(id, details);
			},
			setInterfaceConfig: function (id, ip, mac, netmask, gateway) {
				var test = CCOM.IpNetwork.setInterfaceConfig(id, ip, mac, netmask, gateway);
			},
			setIpAddressAndGateway: function (id, ip, netmask, gateway) {
				var test = CCOM.IpNetwork.setIpAddressAndGateway(id, ip, netmask, gateway);
			},
			getVersion: function () {
				var versionString = "",
					major = $N.platform.system.Preferences.get("/system/softwareMajorVersion", true),
					minor = $N.platform.system.Preferences.get("/system/softwareMinorVersion", true),
					type = $N.platform.system.Preferences.get("/system/softwareBuildType", true);

				if (major !== undefined && minor !== undefined && type !== undefined) {
					versionString = String(major) + "." + minor + " " + type;
				} else {
					versionString = "Unavailable";
				}

				return versionString;
			}
		};
	}());

}($N || {}));