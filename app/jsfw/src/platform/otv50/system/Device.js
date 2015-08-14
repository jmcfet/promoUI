/**
 * The Device class provides methods for Set-Top Box management, such as accessing
 * specific hardware and software details, managing settings and resetting the system.
 * @class $N.platform.system.Device

 *
 * @singleton
 * @author mbrown
 */

/*global CCOM, setInterval*/

define('jsfw/platform/system/Device',
	[
		'jsfw/apps/core/Log',
		'jsfw/platform/system/Preferences'
	],
	function (Log, Preferences) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.system = $N.platform.system || {};

		$N.platform.system.Device = (function () {

			var log = new $N.apps.core.Log("system", "Device"),
				totalHardDriveSpace = 0,
				freeHardDriveSpace = 0,
				freespaceCallback = null,
				mediaDrive,
				diskPartitions = ["sdb1"],
				count = 0,
				lookup = {},
				MEDIA_LIST_PREF = "/system/opentv/mpm/mediaList",
				partitionListPref = "/system/opentv/mpm/sda/partitionList",
				AUDIO_TYPE_PREF = "system/audioType",
				AUDIO_CHANNELS_PREF = "system/audioChannels",
				AUDIO_LANGUAGE_PREF = "/users/preferences/audioLanguage",
				SUBTITLE_LANGUAGE_PREF = "/users/preferences/subtitleLanguage",
				COUNTRY_CODE_PREF = "system/countryCode",
				diskSpaceInterval;

			function getMountedPointForPartition(partition) {
				var mountedPointPref = "/system/opentv/mpm/" + mediaDrive + "/" + partition + "/mountPoint";
				return $N.platform.system.Preferences.get(mountedPointPref, true);
			}

			function getHDSpace() {
				var i;
				freeHardDriveSpace = 0;
				totalHardDriveSpace = 0;
				count = 0;
				lookup = {};
				for (i = 0; i < diskPartitions.length; i++) {
					lookup[CCOM.MediaLibrary.getTotalPartitionSpace(getMountedPointForPartition(diskPartitions[i]))] = diskPartitions[i];
					lookup[CCOM.MediaLibrary.getFreePartitionSpace(getMountedPointForPartition(diskPartitions[i]))] = diskPartitions[i];
				}

			}

			function getTotalPartitionSpaceListener(e) {
				log("getTotalPartitionSpaceListener", "total space of " + lookup[e.handle] + " is " + e.totalSpace);
				totalHardDriveSpace += e.totalSpace || 0;
			}

			function getFreePartitionSpaceListener(e) {
				log("getFreePartitionSpaceListener", "free space of " + lookup[e.handle] + " is " + e.freeSpace);
				freeHardDriveSpace += e.freeSpace || 0;
				if (++count === diskPartitions.length && freespaceCallback) {
					freespaceCallback(freeHardDriveSpace);
					freespaceCallback = null;
				}
			}

			var publicApi = {

				/**
				 * Initialises the class and registers internal event listeners.
				 * @method init
				 */
				init: function () {
					mediaDrive = $N.platform.system.Preferences.get(MEDIA_LIST_PREF, true);
					partitionListPref = "/system/opentv/mpm/" + mediaDrive + "/partitionList";
					diskPartitions = String($N.platform.system.Preferences.get(partitionListPref, true)).split(",");
					CCOM.MediaLibrary.addEventListener("getTotalPartitionSpaceOK", getTotalPartitionSpaceListener);
					CCOM.MediaLibrary.addEventListener("getTotalPartitionSpaceFailed", getTotalPartitionSpaceListener);
					CCOM.MediaLibrary.addEventListener("getFreePartitionSpaceOK", getFreePartitionSpaceListener);
					CCOM.MediaLibrary.addEventListener("getFreePartitionSpaceFailed", getFreePartitionSpaceListener);
					getHDSpace();
					diskSpaceInterval = setInterval(getHDSpace, 120000);
				},

				/**
				 * Initialises the class and registers internal event listeners.
				 * @method initialise
				 * @deprecated use init()
				 */
				initialise: function () {
					this.init();
				},

				/**
				 * Unregisters platform listeners and stops caching the disk space
				 * @method unregister
				 */
				unregister: function () {
					CCOM.MediaLibrary.removeEventListener("getTotalPartitionSpaceOK", getTotalPartitionSpaceListener);
					CCOM.MediaLibrary.removeEventListener("getTotalPartitionSpaceFailed", getTotalPartitionSpaceListener);
					CCOM.MediaLibrary.removeEventListener("getFreePartitionSpaceOK", getFreePartitionSpaceListener);
					CCOM.MediaLibrary.removeEventListener("getFreePartitionSpaceFailed", getFreePartitionSpaceListener);
					clearInterval(diskSpaceInterval);
				},

				/**
				 * Returns a string containing the name of the serial number of the device
				 * @method getSerialNumber
				 * @return {String}
				 */
				getSerialNumber: function () {
					return CCOM.ConditionalAccess.getSystemInfo().systemInfo.serialNumber;
				},

				/**
				 * Returns a string containing the name of the hardware
				 * manufacturer
				 * @method getManufacturer
				 * @return {String}
				 */
				getManufacturer: function () {
					return CCOM.System.manufacturer;
				},

				/**
				 * Returns a string containing the name of the hardware
				 * model
				 * @method getModel
				 * @return {String}
				 */
				getModel: function () {
					return CCOM.System.model;
				},

				/**
				 * Returns a string containing version number of the boot
				 * loader
				 * @method getBootloaderVersion
				 * @return {String}
				 */
				getBootloaderVersion: function () {
					return CCOM.System.bootloaderVersion;
				},

				/**
				 * Returns a string containing version number of the current
				 * firmware image
				 * @method getFirmwareVersion
				 * @return {String}
				 */
				getFirmwareVersion: function () {
					return CCOM.System.firmwareVersion;
				},

				/**
				 * Returns a string containing version number of the operating
				 * system.
				 * @method getOsVersion
				 * @return {String}
				 */
				getOsVersion: function () {
					return CCOM.System.softwareVersion;
				},

				/**
				 * Returns a string containing version of the hardware.
				 * @method getHardwareVersion
				 * @return {String}
				 */
				getHardwareVersion: function () {
					return CCOM.System.hardwareVersion;
				},

				/**
				 * Returns the current global volume that the audio output
				 * is set to
				 * @method getVolume
				 * @return {Number}
				 */
				getVolume: function () {
					return Number(CCOM.System.volume);
				},

				/**
				 * Returns a string containing the current preferred audio type
				 * @method getPreferredAudioType
				 * @return {String}
				 */
				getPreferredAudioType: function () {
					return $N.platform.system.Preferences.get(AUDIO_TYPE_PREF);
				},

				/**
				 * Returns an object containing the current preferred audio channels
				 * @method getPreferredAudioChannels
				 * @return {Object}
				 */
				getPreferredAudioChannels: function () {
					return $N.platform.system.Preferences.getPreferenceObject(AUDIO_CHANNELS_PREF);
				},

				/**
				 * Returns an array of ISO639-2 compatible (3-character) strings of the
				 * preferred languages
				 * @method getPreferredLanguages
				 * @deprecated used for backward compatibility only
				 * @return {String} Representing the preferred audio Language
				 */
				getPreferredLanguages: function () {
					return $N.platform.system.Device.getPreferredAudioLanguage();
				},
				/**
				 * Returns a string containing the current preferred audio language
				 * @method getPreferredLanguage
				 * @return {String} Representing the preferred audio Language
				 */
				getPreferredAudioLanguage: function () {
					return $N.platform.system.Preferences.get(AUDIO_LANGUAGE_PREF, true);
				},
				/**
				 * Returns a string containing the current preferred subtitle language
				 * @method getPreferredSubtitleLanguage
				 * @return {String} Representing the preferred subtitle Language
				 */
				getPreferredSubtitleLanguage: function () {
					return $N.platform.system.Preferences.get(SUBTITLE_LANGUAGE_PREF, true);
				},

				/**
				 * Returns a string that represents the country code
				 * @method getCountryCode
				 * @return {String}
				 */
				getCountryCode: function () {
					return $N.platform.system.Preferences.get(COUNTRY_CODE_PREF);
				},

				/**
				 * Returns the total amount of hard drive space in kilobytes
				 * @method getTotalHardDriveSpace
				 * @return {Number} amount in kilobytes
				 */
				getTotalHardDriveSpace: function () {
					return totalHardDriveSpace;
				},

				/**
				 * Returns the amount of free space on the hard drive in kilobytes, if no callback is supplied the
				 * free space is as it was queries in the last 2 minutes.
				 * @method getFreeHardDriveSpace
				 * @async
				 * @param {Function} callback function to get up-to-the-minute accurate free space
				 * @return {Number} amount in kilobytes
				 */
				getFreeHardDriveSpace: function (callback) {
					if (callback) {
						freespaceCallback = callback;
						getHDSpace();
					} else {
						freespaceCallback = null;
					}
					return freeHardDriveSpace;
				},

				/**
				 * Returns a String containing the software version
				 */
				getSoftwareVersion: function () {
					return CCOM.System.softwareVersion;
				},

				/**
				 * Sets the global audio volume level. A value of 0 is mute
				 * @method setVolume
				 * @param {Number} volume
				 */
				setVolume: function (volume) {
					volume = Number(volume);
					if (volume >= 0) {
						CCOM.System.volume = parseInt(volume, 10);
					}
				},

				/**
				 * Sets the current preferred audio type to the given string
				 * @method audioType
				 * @param {string} audioType possible values are: `System.SYSTEM_AUDIO_TYPE_NORMAL`
				 * `System.SYSTEM_AUDIO_TYPE_HARD_OF_HEARING` & `System.SYSTEM_AUDIO_TYPE_VISUALLY_IMPAIRED`
				 */
				setPreferredAudioType: function (audioType) {
					$N.platform.system.Preferences.set(AUDIO_TYPE_PREF, audioType);
				},

				/**
				 * Sets the current preferred audio channels to the given object
				 * @method setPreferredAudioChannels
				 * @param {Number} channels possible values: `$N.platform.system.Device.AUDIO_CHANNELS_MONO`
				 *     `$N.platform.system.Device.AUDIO_CHANNELS_STEREO` or `$N.platform.system.Device.AUDIO_CHANNELS_SURROUND`
				 */
				setPreferredAudioChannels: function (channels) {
					$N.platform.system.Preferences.setPreferenceObject(AUDIO_CHANNELS_PREF, channels);
				},

				/**
				 * @method setPreferredLanguages
				 * @deprecated used for backward compatibility only
				 * @param {Array} langs An array of strings representing the preferred audio Languages
				 */
				setPreferredLanguages: function (langs) {
					$N.platform.system.Device.setPreferredAudioLanguage(langs[0]);
				},

				/**
				 * Sets the preferred audio language to the given string
				 * @method setPreferredAudioLanguage
				 * @param {String} lang A string representing the preferred audio Language.
				 */
				setPreferredAudioLanguage: function (lang) {
					$N.platform.system.Preferences.set(AUDIO_LANGUAGE_PREF, lang, true);
				},

				/**
				 * Sets the preferred subtitle language to the given string
				 * @method setPreferredSubtitleLanguage
				 * @param {String} lang A string representing the preferred subtitle Language.
				 */
				setPreferredSubtitleLanguage: function (lang) {
					$N.platform.system.Preferences.set(SUBTITLE_LANGUAGE_PREF, lang, true);
				},

				/**
				 * Sets the country code to the given String
				 * @method setCountryCode
				 * @param {String} isoCode
				 */
				setCountryCode: function (isoCode) {
					$N.platform.system.Preferences.set(COUNTRY_CODE_PREF, isoCode);
				},

				/**
				 * Deletes the specified preferences
				 * @method deletePrefs
				 * @param {Array} prefsToDelete array of preference keys
				 * @return {Boolean} true if the delete is successful, false otherwise
				 */
				deletePrefs: function (prefsToDelete) {
					var isDeleteSuccess = true, //will be true if ALL preferences have been deleted
						numberOfPreferences = prefsToDelete.length,
						i = 0;
					for (i = 0; i < numberOfPreferences; i++) {
						if (!$N.platform.system.Preferences.deletePreference(prefsToDelete[i])) {
							isDeleteSuccess = false;
						}
					}
					return isDeleteSuccess;
				},

				/**
				 * Invokes CCOM.System.reboot to performs a soft reset on the device,
				 * which should reboot directly.
				 * @method doFactoryReset
				 * @return {Boolean} true if the reset is successful, false otherwise
				 */
				reboot: function () {
					var isSuccess = true;
					if (!CCOM.System.reboot()) {
						isSuccess = false;
					}
					return isSuccess;
				},

				/**
				 * Determines if a hard drive is available.
				 * @method isHardDriveAvailable
				 * @return {Boolean} true if available
				 */
				isHardDriveAvailable: function () {
					mediaDrive = $N.platform.system.Preferences.get(MEDIA_LIST_PREF, true);
					return mediaDrive ? true : false;
				},

				/**
				 * Sets the partitions that are queried for free space
				 * @method setDiskPartition
				 * @param {Array} partitions names of the partitions
				 */
				setDiskPartitions: function (partitions) {
					diskPartitions = partitions;
					getHDSpace();
				}

			};
			return publicApi;
		}());
		return $N.platform.system.Device;
	}
);
