/**
 * The Device class provides methods for Set-Top Box management, such as accessing
 * specific hardware and software details, managing settings and resetting the system.
 *
 * @class $N.platform.system.Device
 * @singleton
 * @author fheath
 */

/*global CCOM, navigator*/

define('jsfw/platform/system/Device',
	[],
	function () {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.system = $N.platform.system || {};

		var strPreferedAudioLang = "jsfw.preferredAudioLanguage";
		var strPreferedSubtitleLang = "jsfw.preferredSubtitleLanguage";

		$N.platform.system.Device = (function () {
			var uaString,
				dataOS = [{
					string: navigator.platform,
					subString: "Win",
					identity: 'Windows'
				}, {
					string: navigator.platform,
					subString: "Mac",
					identity: 'Macintosh'
				}, {
					string: navigator.userAgent,
					subString: "iPad",
					identity: 'iPad'
				}, {
					string: navigator.userAgent,
					subString: 'Android',
					identity: 'Android'
			    }, {
					string: navigator.platform,
					subString: "Linux",
					identity: 'Linux'
				}],
				currentOS;

			/**
			 * Used to discover the OS the app is running on
			 * @method getCurrentOS
			 * @private
			 * @return {string} the player platform
			 */
			function getCurrentOS(data) {
				var i, dataString, dataProp, versionSearchString;
				for (i = 0; i < data.length; i++) {
					dataString = data[i].string;
					dataProp = data[i].prop;
					versionSearchString = data[i].versionSearch || data[i].identity;
					if (dataString) {
						if (dataString.indexOf(data[i].subString) !== -1) {
							return data[i].identity;
						}
					} else if (dataProp) {
						return data[i].identity;
					}
				}
			}

			function getIOSVersion() {
				var versionArray = uaString.exec(/OS (\d+)_/i);
				return (versionArray[0] && versionArray[1]) ? versionArray[1] : '';
			}

			function getWindowsVersion() {
				var versionArray = uaString.exec(/Windows (\w+?) (.*?);/);
				return (versionArray[0] && versionArray[1] === 'NT') ? versionArray[2] : '';
			}

			function getAndroidVersion() {
				var versionArray = uaString.exec(/Android ([^;]+?);/);
				return versionArray[1] || '';
			}

			return {
				/**
				 * Initialises the device class
				 * @method init
				 */
				init: function () {
					uaString = navigator.userAgent;
					currentOS = getCurrentOS(dataOS) || "an unknown OS";

					// iPad Safari fix
					if ((uaString.indexOf('Nagra') === -1) &&
							(uaString.indexOf('NMP') === -1)  &&
							(uaString.indexOf('IBC2012') === -1) &&
							(uaString.indexOf('iPad') === -1) &&
							(uaString.indexOf('iPhone') === -1) &&
							(uaString.indexOf('Windows') === -1) &&
							(uaString.indexOf('Android') === -1)) {
						currentOS = 'Mac';
					}
				},

				/**
				 * Initialises the device class
				 * @method initialise
				 * @deprecated use init()
				 */
				initialise: function () {
					this.init();
				},

				/**
				 * Returns a string containing the name of the serial number of the device
				 * @method getSerialNumber
				 * @return {String}
				 */
				getSerialNumber: function () {
					// return CCOM.system.serialNumber;
				},

				/**
				 * Returns a string containing the name of the hardware
				 * manufacturer
				 * @method getManufacturer
				 * @return {String}
				 */
				getManufacturer: function () {
					// return CCOM.system.manufacturer;
				},

				/**
				 * Returns a string containing the name of the hardware
				 * model
				 * @method getModel
				 * @return {String}
				 */
				getModel: function () {
					// return CCOM.system.model;
				},

				/**
				 * Returns a string containing version number of the boot
				 * loader
				 * @method getBootloaderVersion
				 * @return {String}
				 */
				getBootloaderVersion: function () {
					// return CCOM.system.BootloaderVersion;
				},

				/**
				 * Returns a string containing version number of the current
				 * firmware image
				 * @method getFirmwareVersion
				 * @return {String}
				 */
				getFirmwareVersion: function () {
					// return CCOM.system.firmwareVersion;
				},

				/**
				 * Returns a string containing version number of the operating
				 * system
				 * @method getOsVersion
				 * @return {String}
				 */
				getOsVersion: function () {
					if (currentOS === 'iPad') {
						return getIOSVersion();
					} else if (currentOS === 'Windows') {
						return getWindowsVersion();
					} else if (currentOS === 'Android') {
						return getAndroidVersion();
					}
				},

				/**
				 * Returns a string containing version of the hardware.
				 * @method getHardwareVersion
				 * @return {String}
				 */
				getHardwareVersion: function () {
					// return CCOM.system.model;
				},

				/**
				 * Returns the current global volume that the audio output
				 * is set to
				 * @method getVolume
				 * @return {Number}
				 */
				getVolume: function () {
					// return CCOM.system.volume;
				},

				/**
				 * Gets the preferred audio type: normal, hard of hearing and visually impaired.
				 * @method getPreferredAudioType
				 * @return {Number} 0: `NORMAL`, 1: `HARD_OF_HEARING` & 2: `VISUALLY_IMPAIRED`
				 */
				getPreferredAudioType: function () {
					// return CCOM.system.PreferredAudioType;
				},

				/**
				 * Returns an array of ISO639-2 compatible (3-character) strings of the
				 * preferred languages
				 * @deprecated used for backward compatibility only
				 * @method getPreferredLanguages
				 * @return {Array} the preferred audio languages in order of preference.
				 */
				getPreferredLanguages: function () {
					// return this.getPreferredAudioLanguage();
				},

				/**
				 * @method getPreferredAudioLanguage
				 * @return {String} the preferred audio language.
				 */
				getPreferredAudioLanguage: function () {
					// return $N.platform.system.Preferences.get(strPreferedAudioLang);
				},

				/**
				 * @method getPreferredSubtitleLanguages
				 * @return {String} the preferred subtitle language.
				 */
				getPreferredSubtitleLanguage: function () {
					// return $N.platform.system.Preferences.get(strPreferedSubtitleLang);
				},

				/**
				 * Returns the total amount of hard drive space in kilobytes
				 * @method getTotalHardDriveSpace
				 * @return {Number} amount in kilobytes
				 */
				getTotalHardDriveSpace: function () {
					// return CCOM.recorder.spaceTotal;
				},

				/**
				 * Returns the amount of free space on the hard drive in kilobytes
				 * @method getFreeHardDriveSpace
				 * @return {Number} amount in kilobytes
				 */
				getFreeHardDriveSpace: function () {
					// return CCOM.recorder.spaceFree;
				},

				/**
				 * Sets the global audio volume level. A value of 0 is mute
				 * @method setVolume
				 * @param {Number} volume
				 */
				setVolume: function (volume) {
					// CCOM.system.volume = volume;
				},

				/**
				 * Sets the preferred audio type: normal, hard of hearing and visually impaired.
				 * @method setPreferredAudioType
				 * @param {string} audioType possible values are: `System.SYSTEM_AUDIO_TYPE_NORMAL`
				 * `System.SYSTEM_AUDIO_TYPE_HARD_OF_HEARING` & `System.SYSTEM_AUDIO_TYPE_VISUALLY_IMPAIRED`
				 */
				setPreferredAudioType: function (audioType) {
					// CCOM.system.PreferredAudioType = audioType;
				},

				/**
				 * Sets the preferred audio channels: mono, stereo or surround sound
				 * @method setPreferredAudioChannels
				 * @param {Number} channels possible values: `$N.platform.system.Device.AUDIO_CHANNELS_MONO`
				 *     `$N.platform.system.Device.AUDIO_CHANNELS_STEREO` or `$N.platform.system.Device.AUDIO_CHANNELS_SURROUND`
				 */
				setPreferredAudioChannels: function (channels) {
					// CCOM.system.PreferredAudioChannels = channels;
				},

				/**
				 * Sets the preferred Languages used to choose audio channels
				 * @method setPreferredLanguages
				 * @deprecated used for backward compatibility only
				 * @param {Array} array of ISO639-2 (3-character) strings of the
				 * preferred languages in order of preference.
				 */
				setPreferredLanguages: function (langs) {
					// this.setPreferredAudioLanguage(langs[0]);
				},

				/**
				 * @method setPreferredAudioLanguage
				 * @param {String} lang A string representing the preferred audio Language.
				 */
				setPreferredAudioLanguage: function (lang) {
					/*$N.platform.system.Preferences.set(strPreferedAudioLang, lang);
					CCOM.system.preferredLanguages = lang;*/
				},

				/**
				 * @method setPreferredSubtitleLanguage
				 * @param {String} lang A string representing the preferred subtitle Language.
				 */
				setPreferredSubtitleLanguage: function (lang) {
					// $N.platform.system.Preferences.set(strPreferedSubtitleLang, lang);
				},

				/**
				 * Deletes the specified preferences
				 * @method deletePrefs
				 * @param {Array} prefsToDelete array of preference keys
				 * @return {Boolean} true if the delete is successful, false otherwise
				 */
				deletePrefs: function (prefsToDelete) {
					/*var isDeleteSuccess = true, //will be true if ALL preferences have been deleted
						numberOfPreferences = prefsToDelete.length,
						i = 0;
					for (i = 0; i < numberOfPreferences; i++) {
						if (!$N.platform.system.Preferences.deletePreference(prefsToDelete[i])) {
							isDeleteSuccess = false;
						}
					}
					return isDeleteSuccess;*/
				},

				/**
				 * Invokes CCOM.system.reset to performs a soft reset on the device,
				 * which should reboot directly.
				 * @method reboot
				 * @return {boolean} true if the reset is successful, false otherwise
				 */
				reboot: function () {
					// return CCOM.system.reset();
				},

				/**
				 * Returns a number containing the free system memory in kilobytes
				 * @method getFreeSystemMemory
				 * @return {Number}
				 */
				getFreeSystemMemory: function () {
					// return CCOM.system.freeSystemMemory;
				},

				/**
				 * Returns a number containing the total system memory in kilobytes
				 * @method getTotalSystemMemory
				 * @return {Number}
				 */
				getTotalSystemMemory: function () {
					// return CCOM.system.totalSystemMemory;
				},

				/**
				 * Returns a number containing the free Nexus device memory in kilobytes
				 * @method getFreeDeviceMemory
				 * @return {Number}
				 */
				getFreeDeviceMemory: function () {
					// return CCOM.system.freeDeviceMemory;
				},

				/**
				 * Returns a number containing the total Nexus device memory in kilobytes
				 * @method getTotalDeviceMemory
				 * @return {Number}
				 */
				getTotalDeviceMemory: function () {
					// return CCOM.system.totalDeviceMemory;
				},

				/**
				 * Determines if a hard drive is available.
				 * @method isHardDriveAvailable
				 * @return {boolean} true if available
				 * @deprecated use $N.platform.system.Device.isHardDriveAvailable instead
				 */
				isHardDriveAvailable: function () {
					/*return (CCOM.recorder !== null && typeof CCOM.recorder !== 'undefined' &&
							CCOM.recorder.spaceTotal !== null && typeof CCOM.recorder.spaceTotal !== 'undefined' &&
							CCOM.recorder.spaceTotal > 0);*/
				}

				/*AUDIO_CHANNELS_MONO: System.SYSTEM_AUDIO_CHANNELS_MONO,
				AUDIO_CHANNELS_STEREO: System.SYSTEM_AUDIO_CHANNELS_STEREO,
				AUDIO_CHANNELS_SURROUND: System.SYSTEM_AUDIO_CHANNELS_SURROUND,
				AUDIO_TYPE_NORMAL: System.SYSTEM_AUDIO_TYPE_NORMAL,
				AUDIO_TYPE_HARD_OF_HEARING: System.SYSTEM_AUDIO_TYPE_HARD_OF_HEARING*/

			};
		}());
		return $N.platform.system.Device;
	}
);