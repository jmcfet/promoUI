/**
 * PVROptionsUtil helper class that initialises default PVR recording options
 * and handles adding default option metadata to recording requests.
 *
 * @class $N.app.PVROptionsUtil
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.platform.system.Preferences
 * @requires $N.app.constants
 * @requires $N.app.PVRUtil
 * #depends PVRUtil.js
 * #depends ../Constants.js
*/
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.PVROptionsUtil = (function () {
		var log = new $N.apps.core.Log("Helper", "PVROptionsUtil"),
			Preferences = $N.platform.system.Preferences,
			Constants = $N.app.constants,
			PVRUtil = $N.app.PVRUtil,
			beforePadding,
			afterPadding,
			beforePaddingEpisodic,
			afterPaddingEpisodic,
			maxEpisodicRecordings;

		/**
		 * @method initialisePreferences
		 * @private
		 */
		function initialisePreferences() {
			var PVROptionsUtil = $N.app.PVROptionsUtil;
			if (!Preferences.get(Constants.PREF_BEFORE_PADDING)) {
				PVROptionsUtil.setBeforePadding(Constants.DEFAULT_BEFORE_PADDING);
			} else {
				beforePadding = parseInt(Preferences.get(Constants.PREF_BEFORE_PADDING), 10);
			}
			if (!Preferences.get(Constants.PREF_AFTER_PADDING)) {
				PVROptionsUtil.setAfterPadding(Constants.DEFAULT_AFTER_PADDING);
			} else {
				afterPadding = parseInt(Preferences.get(Constants.PREF_AFTER_PADDING), 10);
			}
			if (!Preferences.get(Constants.PREF_EPISODIC_BEFORE_PADDING)) {
				PVROptionsUtil.setBeforePaddingEpisodic(Constants.DEFAULT_BEFORE_PADDING);
			} else {
				beforePaddingEpisodic = parseInt(Preferences.get(Constants.PREF_EPISODIC_BEFORE_PADDING), 10);
			}
			if (!Preferences.get(Constants.PREF_EPISODIC_AFTER_PADDING)) {
				PVROptionsUtil.setAfterPaddingEpisodic(Constants.DEFAULT_AFTER_PADDING);
			} else {
				afterPaddingEpisodic = parseInt(Preferences.get(Constants.PREF_EPISODIC_AFTER_PADDING), 10);
			}
			if (!Preferences.get(Constants.PREF_EPISODIC_MAX_NOF_EPISODES)) {
				PVROptionsUtil.setMaxEpisodicRecordings(Constants.DEFAULT_EPISODIC_MAX_NOF_EPISODES);
			} else {
				maxEpisodicRecordings = parseInt(Preferences.get(Constants.PREF_EPISODIC_MAX_NOF_EPISODES), 10);
			}
			if (!Preferences.get(Constants.PREF_DEFAULT_KEEP_UNTIL)) {
				Preferences.set(Constants.PREF_DEFAULT_KEEP_UNTIL, Constants.KEEP_UNTIL_OPTION_SPACE_NEEDED);
			}
			if (!Preferences.get(Constants.PREF_EPISODIC_KEEP_UNTIL)) {
				Preferences.set(Constants.PREF_EPISODIC_KEEP_UNTIL, Constants.KEEP_UNTIL_OPTION_SPACE_NEEDED);
			}
			if (!Preferences.get(Constants.PREF_NON_EPISODIC_BLOCK_PLAYBACK)) {
				Preferences.set(Constants.PREF_NON_EPISODIC_BLOCK_PLAYBACK, "true");
			}
			if (!Preferences.get(Constants.PREF_EPISODIC_TYPE_OF_EPISODES)) {
				Preferences.set(Constants.PREF_EPISODIC_TYPE_OF_EPISODES, Constants.TYPE_OF_EPISODE_OPTION_ALL_EPISODE);
			}
		}

		return {
			/**
			 * initialise the PVROptionsUtil
			 * @method initialise
			 */
			initialise: function () {
				log("initialise", "Enter");
				initialisePreferences();
				log("initialise", "Exit");
			},

			/**
			 * Returns the current set pre padding duration in minutes
			 * @method getBeforePadding
			 * @return {Number}
			 */
			getBeforePadding: function () {
				log("getBeforePadding", "Enter & Exit");
				return beforePadding;
			},

			/**
			 * Sets the pre padding to the given duration
			 * @method setBeforePadding
			 */
			setBeforePadding: function (duration) {
				log("setBeforePadding", "Enter");
				Preferences.set(Constants.PREF_BEFORE_PADDING, String(duration));
				beforePadding = duration;
				log("setBeforePadding", "Exit");
			},

			/**
			 * Returns the current set post padding duration in minutes
			 * @method getAfterPadding
			 * @return {Number}
			 */
			getAfterPadding: function () {
				log("getAfterPadding", "Enter & Exit");
				return afterPadding;
			},

			/**
			 * Sets the post padding to the given duration
			 * @method setAfterPadding
			 */
			setAfterPadding: function (duration) {
				log("setAfterPadding", "Enter");
				Preferences.set(Constants.PREF_AFTER_PADDING, String(duration));
				afterPadding = duration;
				log("setAfterPadding", "Exit");
			},

			/**
			 * Returns the current set pre padding duration in minutes for Episodic Recordings
			 * @method getBeforePaddingEpisodic
			 * @return {Number}
			 */
			getBeforePaddingEpisodic: function () {
				log("getBeforePaddingEpisodic", "Enter & Exit");
				return beforePaddingEpisodic;
			},

			/**
			 * Sets the pre padding to the given duration for Episodic Recordings
			 * @method setBeforePaddingEpisodic
			 */
			setBeforePaddingEpisodic: function (duration) {
				log("setBeforePaddingEpisodic", "Enter");
				Preferences.set(Constants.PREF_EPISODIC_BEFORE_PADDING, String(duration));
				beforePaddingEpisodic = duration;
				log("setBeforePaddingEpisodic", "Exit");
			},

			/**
			 * Returns the current set post padding duration in minutes for Episodic Recordings
			 * @method getAfterPaddingEpisodic
			 * @return {Number}
			 */
			getAfterPaddingEpisodic: function () {
				log("getAfterPaddingEpisodic", "Enter & Exit");
				return afterPaddingEpisodic;
			},

			/**
			 * Sets the post padding to the given duration for Episodic Recordings
			 * @method setAfterPaddingEpisodic
			 */
			setAfterPaddingEpisodic: function (duration) {
				log("setAfterPaddingEpisodic", "Enter");
				Preferences.set(Constants.PREF_EPISODIC_AFTER_PADDING, String(duration));
				afterPaddingEpisodic = duration;
				log("setAfterPaddingEpisodic", "Exit");
			},

			/**
			 * Returns the maximum number of Episodic Recordings in a series
			 * @method getMaxEpisodicRecordings
			 */
			getMaxEpisodicRecordings: function () {
				log("getMaxEpisodicRecordings", "Enter & Exit");
				return maxEpisodicRecordings;
			},

			/**
			 * Sets the maximum number of Episodic Recordings in a series
			 * @method setMaxEpisodicRecordings
			 * @param {Number} max
			 */
			setMaxEpisodicRecordings: function (max) {
				log("setMaxEpisodicRecordings", "Enter");
				Preferences.set(Constants.PREF_EPISODIC_MAX_NOF_EPISODES, String(max));
				maxEpisodicRecordings = max;
				log("setMaxEpisodicRecordings", "Exit");
			},

			/**
			 * @method addNonEpisodicRecordingMetaData
			 * @private
			 * @param {Object} [metaData]
			 */
			addNonEpisodicRecordingMetaData: function (metaData) {
				var dateTimeUtil = $N.app.DateTimeUtil,
					playedBlocked = Preferences.get(Constants.PREF_NON_EPISODIC_BLOCK_PLAYBACK) || false;
				metaData = metaData || {};
				if (!$N.app.StringUtil.isNullOrUndefined(metaData.softPrepaddingDuration)) {
					metaData.softPrepaddingDuration = dateTimeUtil.convertMinutesToMs(metaData.softPrepaddingDuration);
				} else {
					metaData.softPrepaddingDuration = dateTimeUtil.convertMinutesToMs(beforePadding);
				}
				if (!$N.app.StringUtil.isNullOrUndefined(metaData.softPostpaddingDuration)) {
					metaData.softPostpaddingDuration = dateTimeUtil.convertMinutesToMs(metaData.softPostpaddingDuration);
				} else {
					metaData.softPostpaddingDuration = dateTimeUtil.convertMinutesToMs(afterPadding);
				}
				if (playedBlocked === "true" || playedBlocked === "1") {
					metaData.PlayedBlocked = PVRUtil.PLAYBACK_STATE.UNPLAYED_BLOCKED;
				}
				return metaData;
			},

			/**
			 * @method addEpisodicRecordingMetaData
			 * @private
			 * @param {Object} [metaData]
			 */
			addEpisodicRecordingMetaData: function (metaData) {
				var dateTimeUtil = $N.app.DateTimeUtil,
					playedBlocked = Preferences.get(Constants.PREF_EPISODIC_BLOCK_PLAYBACK) || false;
				metaData = metaData || {};
				if (!$N.app.StringUtil.isNullOrUndefined(metaData.softPrepaddingDuration)) {
					metaData.softPrepaddingDuration = dateTimeUtil.convertMinutesToMs(metaData.softPrepaddingDuration);
				} else {
					metaData.softPrepaddingDuration = dateTimeUtil.convertMinutesToMs(beforePaddingEpisodic);
				}
				if (!$N.app.StringUtil.isNullOrUndefined(metaData.softPostpaddingDuration)) {
					metaData.softPostpaddingDuration = dateTimeUtil.convertMinutesToMs(metaData.softPostpaddingDuration);
				} else {
					metaData.softPostpaddingDuration = dateTimeUtil.convertMinutesToMs(afterPaddingEpisodic);
				}
				if (maxEpisodicRecordings > 0) {
					metaData.maxEpisodicRecordings = parseInt(maxEpisodicRecordings, 10); // TODO: NETUI-1481 Check maxEpisodicRecordings when MW implementation is complete.
				}
				if ((playedBlocked === "true" || playedBlocked === "1")) {
					metaData.PlayedBlocked = PVRUtil.PLAYBACK_STATE.UNPLAYED_BLOCKED;
				}
				return metaData;
			}
		};
	}());

}($N || {}));
