/**
 * AudioManager manages the audio configuration of the system.
 * @class $N.app.AudioManager
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.app.HDMIManager
 * @requires $N.app.constants
 * @requires $N.platform.system.Preferences
 * @requires $N.platform.system.Device
 * @author rvaughan
 */
(function ($N) {
	"use strict";
	$N = $N || {};
	$N.app = $N.app || {};
	$N.app.AudioManager = (function () {
		var preferredAudio,
			actualAudio,
			currentVolume = 50,
			initialised = false,
			log = new $N.apps.core.Log("Helper", "AudioManager");

		/**
		 * Check the audio capabilites of the device connected via HDMI against
		 * the users preferred audio settings and configure the system accordingly.
		 * @method checkAudioCapabilities
		 * @private
		 */
		function checkAudioCapabilities() {
			log("checkAudioCapabilities", "Enter");

			if ($N.app.GeneralUtil.bitwiseAnd(preferredAudio, $N.app.HDMIManager.getCurrentAudioCapabilities())) {
				actualAudio = preferredAudio;
			} else {
				// We can't select the audio that we want, so we have to drop
				// back to the lowest common denominator which is PCM.
				actualAudio = $N.app.constants.HDMI_AUDIO_PCM_OUTPUT;
			}

			CCOM.ConfigManager.setValue($N.app.constants.PREF_HDMI_AUDIO_TYPE, actualAudio);
			$N.platform.system.Preferences.set($N.app.constants.PREF_PREFERRED_AUDIO_FORMAT, preferredAudio);
			log("checkAudioCapabilities", "Exit");
		}

		/**
		 * Mutes the audio unless the audio is already muted.
		 * @method mute
		 * @public
		 */
		function mute() {
			if (currentVolume !== $N.app.constants.VOLUME_MUTE) {
				// Store the current volume before mute.
				$N.platform.system.Preferences.set($N.app.constants.PREF_CURRENT_VOLUME, String(currentVolume));
				$N.platform.system.Device.setVolume($N.app.constants.VOLUME_MUTE);
				$N.platform.system.Preferences.set($N.app.constants.PREF_PCM_VOLUME, $N.app.constants.FULL, true);
				if (!CCOM.System.muteAudio) {
					CCOM.System.muteAudio = true; //As per recommendation from MW team, we are directly using this muteAudio property - NETUI-5618
				}
				currentVolume = $N.app.constants.VOLUME_MUTE;
			}
		}

		/**
		 * Unmutes the audio unless the audio is already unmuted.
		 * @method unmute
		 * @public
		 */
		function unmute() {
			if (currentVolume === $N.app.constants.VOLUME_MUTE) {
				if (CCOM.System.muteAudio) {
					CCOM.System.muteAudio = false; //As per recommendation from MW team, we are directly using this muteAudio property - NETUI-5618
				}
				currentVolume = $N.platform.system.Preferences.get($N.app.constants.PREF_CURRENT_VOLUME);
				if (currentVolume) {
					currentVolume = parseInt(currentVolume, 10);
					$N.platform.system.Device.setVolume(currentVolume);
					if (currentVolume < $N.app.constants.VOLUME_FULL) {
						$N.platform.system.Preferences.set($N.app.constants.PREF_PCM_VOLUME, $N.app.constants.VOLUME_FULL - currentVolume, true);
					} else {
						$N.platform.system.Preferences.set($N.app.constants.PREF_PCM_VOLUME, 1, true);
					}
				} else {
					$N.platform.system.Device.setVolume(50);
					$N.platform.system.Preferences.set($N.app.constants.PREF_PCM_VOLUME, $N.app.constants.VOLUME_HALF, true);
				}
			}
		}

		return {
			/**
			 * Initialises the AudioManager. This must be called before calling
			 * any other function otherwise random/undefined behaviour may
			 * be seen.
			 * @method initialise
			 * @public
			 */
			initialise : function () {
				var cfgPreferredAudio = $N.platform.system.Preferences.get($N.app.constants.PREF_PREFERRED_AUDIO_FORMAT);

				if (!initialised) {
					preferredAudio = $N.app.constants.HDMI_AUDIO_PCM_OUTPUT;
					actualAudio = $N.app.constants.HDMI_AUDIO_PCM_OUTPUT;

					if (cfgPreferredAudio && !cfgPreferredAudio.error) {
						preferredAudio = cfgPreferredAudio.keyValue;
					} else {
						$N.platform.system.Preferences.set($N.app.constants.PREF_PREFERRED_AUDIO_FORMAT, preferredAudio);
					}

					checkAudioCapabilities();

					currentVolume = this.getCurrentVolume();

					initialised = true;
				}
			},

			/**
			 * Get's the users current preferred audio selection.
			 * @public
			 * @returns The users selected preferred audio type.
			 */
			getPreferredAudioType : function () {
				return preferredAudio;
			},

			/**
			 * Sets the preferred audio type for the system.
			 * @public
			 * @param value The audio type to be used as the preferred option.
			 */
			setPreferredAudioType : function (value) {
				log("setPreferredAudioType", "Enter");
				if (value === CCOM.System.HDMI_AUDIO_TYPE_PCM) {
					preferredAudio = $N.app.constants.HDMI_AUDIO_PCM_OUTPUT;
				} else {
					preferredAudio = $N.app.constants.HDMI_AUDIO_DOLBY_OUTPUT;
				}

				checkAudioCapabilities();
				log("setPreferredAudioType", "Exit");
			},

			/**
			 * Get the actual type of audio being used by the system.
			 * @public
			 * @return The actual type of audio being used by the system.
			 */
			getActualAudioType : function () {
				return actualAudio;
			},

			/**
			 * Gets the current volume level of the system.
			 * @return An integer between 0 and 100 representing the current volume.
			 * @public
			 */
			getCurrentVolume : function () {
				var vol = $N.platform.system.Preferences.get($N.app.constants.PREF_CURRENT_VOLUME),
					newVol;

				if (!initialised) {
					// 0 is a valid value so we need to explicitly check for invalid values
					if (vol === null || vol === undefined) {
						vol = $N.app.constants.VOLUME_HALF;
					}
					currentVolume = Math.round(parseInt(vol, 10) / $N.app.constants.VOLUME_STEP) * $N.app.constants.VOLUME_STEP;

					$N.platform.system.Preferences.set($N.app.constants.PREF_CURRENT_VOLUME, String(currentVolume));
					$N.platform.system.Device.setVolume(currentVolume);
					$N.platform.system.Preferences.set($N.app.constants.PREF_PCM_VOLUME, $N.app.constants.VOLUME_FULL - currentVolume, true);
				}

				return currentVolume;
			},

			mute : mute,
			unmute : unmute,

			/**
			 * Increases the current volume on the system. If the system is already
			 * at the maximum volume then there is no effect. If the system is
			 * currently muted then the audio is automatically unmuted.
			 * @returns The volume level following the operation.
			 * @public
			 */
			increaseVolume : function () {
				var newVolume = 0;

				if (currentVolume < $N.app.constants.VOLUME_FULL) {
					if (currentVolume === $N.app.constants.VOLUME_MUTE) {
						unmute();
					}
					if (currentVolume !== $N.app.constants.VOLUME_FULL) {
						newVolume = currentVolume + $N.app.constants.VOLUME_STEP;
						$N.platform.system.Device.setVolume(newVolume);
						$N.platform.system.Preferences.set($N.app.constants.PREF_PCM_VOLUME, $N.app.constants.VOLUME_FULL - newVolume, true);
						currentVolume = newVolume;
						$N.platform.system.Preferences.set($N.app.constants.PREF_CURRENT_VOLUME, String(currentVolume));
					}
				}

				return currentVolume;
			},

			/**
			 * Reduces the current volume on the system. If the system is already
			 * at the minimum volume then the audio will be muted.
			 * @returns The volume level following the operation.
			 * @public
			*/
			reduceVolume : function () {
				var newVolume = 0,
					prefVolume;

				// if we are currently muted, VOL- is expected to unmute
				if (currentVolume === $N.app.constants.VOLUME_MUTE) {
					prefVolume = $N.platform.system.Preferences.get($N.app.constants.PREF_CURRENT_VOLUME);
					if (prefVolume !== undefined) {
						prefVolume = parseInt(prefVolume, 10);
					} else {
						prefVolume = 0;
					}

					// but if we're muted because VOL- was held down until we reached 0 that gives a nasty flickering
					// so only allow VOL- to take us out of MUTE if we didn't get here with VOL-
					if (prefVolume > $N.app.constants.VOLUME_STEP) {
						unmute();
						return currentVolume;
					}
				}

				if (currentVolume > $N.app.constants.VOLUME_MUTE) {
					newVolume = currentVolume - $N.app.constants.VOLUME_STEP;

					if (newVolume <= $N.app.constants.VOLUME_MUTE) {
						mute();
						return $N.app.constants.VOLUME_MUTE;
					}

					$N.platform.system.Device.setVolume(newVolume);
					$N.platform.system.Preferences.set($N.app.constants.PREF_PCM_VOLUME, $N.app.constants.VOLUME_FULL - newVolume, true);
					$N.platform.system.Preferences.set($N.app.constants.PREF_CURRENT_VOLUME, String($N.platform.system.Device.getVolume()));
					currentVolume = newVolume;
				}

				return currentVolume;
			},

			/**
			 * This function toggles the current muted state of the system.
			 * @public
			 */
			toggleMute : function () {
				if (currentVolume === $N.app.constants.VOLUME_MUTE) {
					unmute();
				} else {
					mute();
				}
			}
		};
	}());

}($N || {}));