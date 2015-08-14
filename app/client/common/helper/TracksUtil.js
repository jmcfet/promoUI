/**
 * Helper class for subtitles
 *
 * @class $N.app.TracksUtil
 * @author rhill
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.platform.system.Preferences
 * @requires $N.app.constants
 * #depends ../Constants.js
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.TracksUtil = (function () {

		var log = new $N.apps.core.Log("Helper", "TracksUtil");

		$N.platform.system.Preferences.set($N.app.constants.PREF_SUBTITLE_STATE, null);

		function isSubtitleTrackAvailable(language) {
			var availableSubtitleTracks = $N.app.fullScreenPlayer.tracks.getSubtitleTracks(),
				availableSubtitleTracksLength = availableSubtitleTracks.length,
				i;
			for (i = 0; i < availableSubtitleTracksLength; i++) {
				if (availableSubtitleTracks[i].language === language) {
					return true;
				}
			}
			return false;
		}

		function isAudioTrackAvailable(language) {
			var availableAudioTracks = $N.app.fullScreenPlayer.tracks.getAudioTracks(),
				availableAudioTracksLength = availableAudioTracks.length,
				i;
			for (i = 0; i < availableAudioTracksLength; i++) {
				if (availableAudioTracks[i].language === language) {
					return true;
				}
			}
			return false;
		}

		/**
		 * method for finding if the audio track is valid or not
		 * @method isValidAudioTrack
		 * @param audioTrack
		 * @public
		 * @return {Boolean} true if the track is valid.
		 */
		function isValidAudioTrack(audioTrack) {
			if (audioTrack && audioTrack.iaudio && audioTrack.iaudio.InvalidStreamFormat) {
				return false;
			}
			return true;
		}

		/**
		 * method for finding invalid audio track
		 * @method isInvalidAudioTrackAvailable
		 * @public
		 * @return {Boolean} true if invalid audio track is present.
		 */

		function isInvalidAudioTrackAvailable() {
			var i,
				availableAudioTracks = $N.app.fullScreenPlayer.tracks.getAudioTracks(),
				availableAudioTracksLength = availableAudioTracks.length;
			for (i = 0; i < availableAudioTracksLength; i++) {
				if (availableAudioTracks[i].iaudio.InvalidStreamFormat) {
					return true;
				}
			}
			return false;
		}

		/**
		 * method for getting the next audio track from the available tracks
		 * @method getNextAudioTrack
		 * @param {optional} audioTrack object
		 * @public
		 * @return {Object} audioTrack
		 */
		function getNextAudioTrack(audioTrack) {
			var currentAudioTrack = audioTrack || $N.app.fullScreenPlayer.tracks.getActiveAudioTrack(), //if audio track is not passed, active audio track is taken
				availableAudioTrackArray = $N.app.fullScreenPlayer.tracks.getAudioTracks(),
				trackIndex = 0;

			trackIndex = $N.app.ArrayUtil.getIndex(
				availableAudioTrackArray,
				function (element) {
					return element.id === currentAudioTrack.id;
				}
			);
			if ((trackIndex === (availableAudioTrackArray.length - 1) && isValidAudioTrack(availableAudioTrackArray[0]))
					|| ((trackIndex + 1) >= (availableAudioTrackArray.length - 1) && !isValidAudioTrack(availableAudioTrackArray[trackIndex + 1]))) { //if the track index is the last one or if the next audio track is invalid
				return availableAudioTrackArray[0];
			} else if (isValidAudioTrack(availableAudioTrackArray[trackIndex + 1])) {
				return availableAudioTrackArray[trackIndex + 1];
			}
		}

		/**
		 * method to find the language which is selected in settings if it is available on the track
		 * @method getLanguageForSubtitleTrackBasedOnPreference
		 * @public
		 * @return {string} if subtitle track is present else return null.
		 */

		function getLanguageForSubtitleTrackBasedOnPreference(language) {
			switch (language) {
			case $N.app.constants.SUBTITLE_CATEGORIES.POR:
			case $N.app.constants.SUBTITLE_CATEGORIES.ENG:
				if (isSubtitleTrackAvailable(language)) {
					return language;
				} else {
					return null;
				}
			// This is a special case where subtitle can be displayed based on the priority. Ref- NETUI -3826
			case $N.app.constants.SUBTITLE_CATEGORIES.CC:
				if (isSubtitleTrackAvailable(language)) {
					return language;
				} else if (isSubtitleTrackAvailable($N.app.constants.SUBTITLE_CATEGORIES.POR)) {
					return $N.app.constants.SUBTITLE_CATEGORIES.POR;
				} else if (isSubtitleTrackAvailable($N.app.constants.SUBTITLE_CATEGORIES.LEG)) {
					return $N.app.constants.SUBTITLE_CATEGORIES.LEG;
				} else if (isSubtitleTrackAvailable($N.app.constants.SUBTITLE_CATEGORIES.ENG)) {
					return $N.app.constants.SUBTITLE_CATEGORIES.ENG;
				} else {
					return null;
				}
			}
		}

		// Public
		return {

			/**
			 * @method deactivateCurrentSubtitleTrack
			 */
			deactivateCurrentSubtitleTrack: function () {
				var activeSubtitleTrack = $N.app.fullScreenPlayer ? $N.app.fullScreenPlayer.tracks.getActiveSubtitleTrack() : false;
				if (activeSubtitleTrack) {
					log("deactivateCurrentSubtitleTrack", activeSubtitleTrack.language);
					$N.app.fullScreenPlayer.tracks.deactivateTrack(activeSubtitleTrack);
				}
			},

			/**
			 * @method activateCurrentPrefSubtitleTrack
			 */
			activateCurrentPrefSubtitleTrack: function () {
				var prefSubtitleState = $N.platform.system.Preferences.get($N.app.constants.PREF_SUBTITLE_STATE) || $N.app.constants.SUBTITLE_STATE_DEFAULT,
					subtitleLanguage;
				/* Teleidea used the subtitle state as "off", "eng" and "por"
				 * Where as we have it as "off" and "on" only as per FSR.
				 * So to replace their implementation and retain user's selection, we have to change
				 * the way we are selecting the languages with off state, since "off" is common between
				 * TI and Nagra.
				 */
				if (prefSubtitleState !== $N.app.constants.SUBTITLE_STATE_OFF) {
					log("activateCurrentPrefSubtitleTrack", prefSubtitleState);
					subtitleLanguage = getLanguageForSubtitleTrackBasedOnPreference(prefSubtitleState);
					if (subtitleLanguage) {
						$N.app.fullScreenPlayer.tracks.activateSubtitleTrackByLanguage(subtitleLanguage);
					} else {
						this.deactivateCurrentSubtitleTrack();
					}
				}
			},

			/**
			 * @method getLanguageforSubtitleTrack
			 * Method to get the language for the subtitle track
			 * If more than one subtitles is available in the track, then the first subtitle track language is displayed.
			 */
			getLanguageforSubtitleTrack: function () {
				var subtitleTracks,
					subtitleLanguage;
				subtitleTracks = $N.app.fullScreenPlayer.tracks.getSubtitleTracks();
				subtitleLanguage = $N.app.fullScreenPlayer.tracks.getLanguage(subtitleTracks[0]);//first available subtitle track will be displayed
				return subtitleLanguage;
			},

			/**
			 * @method getSubtitleTrackList
			 * Method to get the list of language available for a particular event
			 * @return{array}
			 */
			getSubtitleTrackList: function () {
				var availableSubtitleTracks = $N.app.fullScreenPlayer.tracks.getSubtitleTracks(),
					availableSubtitleTracksLength = availableSubtitleTracks.length,
					subtitleLanguageList = [],
					i;
				for (i = 0; i < availableSubtitleTracksLength; i++) {
					subtitleLanguageList.push(availableSubtitleTracks[i].language);
				}
				return subtitleLanguageList;
			},

			/**
			 * @method activateCurrentPrefAudioTrack
			 */
			activateCurrentPrefAudioTrack: function () {
				var audioLanguage = $N.platform.system.Preferences.get($N.app.constants.PREF_AUDIO_LANGUAGE) || $N.app.constants.AUDIO_LANGUAGE_DEFAULT;
				if (isAudioTrackAvailable(audioLanguage)) {
					log("activateCurrentPrefSubtitleTrack", audioLanguage);
					$N.app.fullScreenPlayer.tracks.activateAudioTrackByLanguage(audioLanguage);
				}
			},

			/**
			 * @method getCurrentPrefSubtitleState
			 */
			getCurrentPrefSubtitleState: function () {
				return $N.platform.system.Preferences.get($N.app.constants.PREF_SUBTITLE_STATE);
			},

			/**
			 * @method isAudioTrackSelectable
			 * @return {Boolean}
			 */
			isAudioTrackSelectable: function () {
				return ($N.app.fullScreenPlayer && $N.app.fullScreenPlayer.tracks.getAudioTracks().length > 1);
			},

			/**
			 * @method isSubtitleTrackSelectable
			 * @return {Boolean}
			 */
			isSubtitleTrackSelectable: function () {
				var isSubtitleTracks = $N.app.fullScreenPlayer.tracks.getSubtitleTracks();
				if (isSubtitleTracks.length !== 0) {
					return true;
				} else {
					return false;
				}
			},
			/**
			 * @method toggleSubtitles
			 */
			toggleSubtitles: function () {
				var activeSubtitleTrack = $N.app.fullScreenPlayer.tracks.getActiveSubtitleTrack();
				if (activeSubtitleTrack) {
					$N.app.fullScreenPlayer.tracks.deactivateTrack(activeSubtitleTrack);
				} else {
					$N.app.fullScreenPlayer.tracks.activateSubtitleTrackByLanguage(this.getLanguageforSubtitleTrack());
				}
			},
			/**
			 * @method hideSubtitles
			 */
			hideSubtitles: function () {
				var streamControlObj = $N.app.fullScreenPlayer.tracks._player.setStreamControl("subtitle-hide", {hide: true});
				if (streamControlObj && streamControlObj.error) {
					log('hideSubtitles' + streamControlObj.error.name);
				}
				return streamControlObj;
			},
			/**
			 * @method showSubtitles
			 */
			showSubtitles: function () {
				var streamControlObj = $N.app.fullScreenPlayer.tracks._player.setStreamControl("subtitle-hide", {hide: false});
				if (streamControlObj && streamControlObj.error) {
					log('showSubtitles' + streamControlObj.error.name);
				}
				return streamControlObj;
			},
			initialise: function () {
				$N.apps.core.Language.adornWithGetString(this);
			},
			/**
			 * @method getAudioLanguageFromPreferences
			 * At System level, Portuguese audio language in Settings is saved as "dub" in preference. If the stream has "por" audio track, "dub" should treated as Portuguese and vice versa
			 */
			getAudioLanguageFromPreferences: function () {
				var audioLanguage = $N.platform.system.Preferences.get($N.app.constants.PREF_AUDIO_LANGUAGE) || $N.app.constants.AUDIO_LANGUAGE_DEFAULT,
					availableAudioTracks = $N.app.fullScreenPlayer.tracks.getAudioTracks(),
					availableAudioTracksSize = availableAudioTracks.length,
					i;

				for (i = 0; i < availableAudioTracksSize; i++) {
					if ((this.getString("audioLanguage")[availableAudioTracks[i].language]) === (this.getString("audioLanguage")[audioLanguage])) {
						audioLanguage = availableAudioTracks[i].language;
						return audioLanguage;
					}
				}
			},

			/**
			 * @method deactivateAudioTrack
			 */
			deactivateAudioTrack: function () {
				var audioTrack = $N.app.fullScreenPlayer.tracks.getActiveAudioTrack();
				if (audioTrack) {
					$N.app.fullScreenPlayer.tracks.deactivateTrack(audioTrack);
				}
			},
			/**
			 * @method getFirstOtherAudioLanguage
			 * Method to get the first audio track if the priority is others, i.e., non-eng or non-por audio
			 */
			getFirstOtherAudioLanguage: function () {
				var availableAudioTracks,
					i;
				availableAudioTracks = $N.app.fullScreenPlayer.tracks.getAudioTracks();

				for (i = 0; i < availableAudioTracks.length; i++) {
					if (availableAudioTracks[i].language !== "eng" || availableAudioTracks[i].language !== "por" || availableAudioTracks[i].language !== "dub") {
						return availableAudioTracks[i];
					}
				}
			},
			/**
			 * @method activateAudioByPriority
			 * Method to activate audio track based on priority described by NET
			 * Priority is specified in NETUI-5611
			 */
			activateAudioByPriority: function () {
				var pref_audioLanguage = $N.platform.system.Preferences.get($N.app.constants.PREF_AUDIO_LANGUAGE) || $N.app.constants.AUDIO_LANGUAGE_DEFAULT,
					pref_subtitleLanguage = $N.platform.system.Preferences.get($N.app.constants.PREF_SUBTITLE_STATE) || $N.app.constants.SUBTITLE_STATE_DEFAULT,
					audioLanguage_priorityList,
					firstOtherAudioTrack,
					i;

				log("activateAudioByPriority", "Audio Preference : " + pref_audioLanguage);
				log("activateAudioByPriority", "Subtitle Preference : " + pref_subtitleLanguage);

				audioLanguage_priorityList = $N.app.constants.AUDIO_PRIORITY[pref_audioLanguage][pref_subtitleLanguage];

				log("activateAudioByPriority", "Audio Priority : " + audioLanguage_priorityList);

				for (i = 0; i < audioLanguage_priorityList.length; i++) {
					if (audioLanguage_priorityList[i] === "other") {
						firstOtherAudioTrack = $N.app.TracksUtil.getFirstOtherAudioLanguage();
						if (firstOtherAudioTrack) {
							$N.app.fullScreenPlayer.tracks.activateAudioTrackByLanguage(firstOtherAudioTrack);
							return true;
						} else {
							return false; //if we are browsing thru other tracks and if we don't have it, MW is already playing the correct track
						}
					} else if ($N.app.fullScreenPlayer.tracks.activateAudioTrackByLanguage(audioLanguage_priorityList[i])) {
						log("activateAudioByPriority", "Activated audio track: " + audioLanguage_priorityList[i]);
						return true;
					}
				}
			},
			/**
			 * @method activateSubtitleByPriority
			 * Method to activate subtitle track based on priority described by NET
			 * Priority is specified in NETUI-5611
			 */
			activateSubtitleByPriority: function () {
				var pref_audioLanguage = $N.platform.system.Preferences.get($N.app.constants.PREF_AUDIO_LANGUAGE) || $N.app.constants.AUDIO_LANGUAGE_DEFAULT,
					pref_subtitleLanguage = $N.platform.system.Preferences.get($N.app.constants.PREF_SUBTITLE_STATE) || $N.app.constants.SUBTITLE_STATE_DEFAULT,
					subtitleLanguage_priorityList,
					i;

				if (pref_subtitleLanguage === $N.app.constants.SUBTITLE_STATE_OFF) {
					this.deactivateCurrentSubtitleTrack();
					return true;
				}

				log("activateSubtitleByPriority", "Audio Preference :  " + pref_audioLanguage);
				log("activateSubtitleByPriority", "Subtitle Preferece : " + pref_subtitleLanguage);
				subtitleLanguage_priorityList = $N.app.constants.SUBTITLE_PRIORITY[pref_subtitleLanguage][pref_audioLanguage];

				log("activateSubtitleByPriority", "Subtitle Priority : " + subtitleLanguage_priorityList);

				for (i = 0; i < subtitleLanguage_priorityList.length; i++) {
					if ($N.app.fullScreenPlayer.tracks.activateSubtitleTrackByLanguage(subtitleLanguage_priorityList[i])) {
						log("activateSubtitleByPriority", "Activated subtitle track: " + subtitleLanguage_priorityList[i]);
						return true;
					} else {
						this.deactivateCurrentSubtitleTrack();
					}
				}
			},
			/**
			 * @method activateAudioTrack
			 */
			activateAudioTrack: function () {
				var audioTracks = $N.app.fullScreenPlayer.tracks.getAudioTracks(),
					audioLanguage;
				if (audioTracks[0]) {
					if (audioTracks.length > 1) {
						audioLanguage = this.getAudioLanguageFromPreferences();
						$N.app.fullScreenPlayer.tracks.activateAudioTrackByLanguage(audioLanguage);
					} else {
						$N.app.fullScreenPlayer.tracks.activateAudioTrackByLanguage(audioTracks[0].language);
					}
				}
			},
			isInvalidAudioTrackAvailable: isInvalidAudioTrackAvailable,
			isValidAudioTrack: isValidAudioTrack,
			getLanguageForSubtitleTrackBasedOnPreference: getLanguageForSubtitleTrackBasedOnPreference,
			getNextAudioTrack: getNextAudioTrack
		};
	}());

}($N || {}));
