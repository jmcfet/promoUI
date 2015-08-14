/**
 * This class will contains common logic that will be used for setting front panel display and intensity for the STB
 * @class $N.app.SystemUtil
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.app.constants
 * @requires $N.app.StandardTimers
 * #depends StandardTimers.js
 * #depends ../Constants.js
 * @author kiran
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.SystemUtil = (function () {
		var log = new $N.apps.core.Log("Util", "SystemUtil"),
			timeFormat = $N.app.constants.TWENTY_FOUR_HOUR_TIME_FORMAT,
			defaultMode = $N.app.constants.FRONTPANEL_DISPLAY_MODES.DEFAULT,
			standbyMode = $N.app.constants.FRONTPANEL_DISPLAY_MODES.STAND_BY,
			PVRPlayBackMode = $N.app.constants.FRONTPANEL_DISPLAY_MODES.PVR_PLAY_BACK,
			musicMode = $N.app.constants.FRONTPANEL_DISPLAY_MODES.MUSIC,
			standbyTimer = null,
			standbyConfirmationTimer = null,
			me,
			showCurrentTimeTimer = null,
			display = null,
			_isChannelNumberDisplayed = false,
			FRONTPANEL_TIMEOUT_PERIOD = (10 * 1000),
			minuteTimer = $N.app.StandardTimers.minuteTimer;


		function confirmCancelDialogueCallback(result) {
			$N.apps.dialog.DialogManager.hideDialogWithId($N.app.constants.DLG_STANDBY_CONFIRMATION);
			if (result) {
				if (result.action === true) {
					if (standbyTimer) {
						clearTimeout(standbyTimer);
						standbyTimer = null;
						me.setAndRefreshStandbyTimer();
					}
				}
			}
		}

		function systemStandby() {
			if (standbyTimer) {
				clearTimeout(standbyTimer);
				$N.common.helper.PowerManager.enterStandby();
			}
		}

		function showStandbyConfirmationDialogue() {
			if (standbyConfirmationTimer) {
				clearTimeout(standbyConfirmationTimer);
				$N.app.DialogueHelper.createAndShowDialogue(
					$N.app.constants.DLG_STANDBY_CONFIRMATION,
					$N.app.SystemUtil.getString("autoStandby"),
					$N.app.SystemUtil.getString("standByConfirmationMessage"),
					null, // Default OK button
					confirmCancelDialogueCallback
				);
				standbyTimer = setTimeout(systemStandby, 60000);
			}
		}

		/* Public API */
		return {
			/**
			 * initialise the SystemUtil
			 * @method initialise
			 */
			initialise: function () {
				log("initialise", "Enter");
				$N.apps.core.Language.adornWithGetString($N.app.SystemUtil);
				me = this;
				log("initialise", "Exit");
			},

			/**
			 * Sets and refresh the Auto standby timer,
			 * Reads preferred standby value from the configman and starts the timer with this preferred value
			 * @method setAndRefreshStandbyTimer
			 */
			setAndRefreshStandbyTimer: function () {
				var preferredAutoStandby,
					preferredValueInMilliseconds;
				if (standbyConfirmationTimer) {
					clearTimeout(standbyConfirmationTimer);
					standbyConfirmationTimer = null;
					standbyTimer = null;
				}
				preferredAutoStandby = parseInt($N.platform.system.Preferences.get($N.app.constants.PREF_AUTO_STANDBY), 10);
				if (preferredAutoStandby !== -1) {
					preferredValueInMilliseconds = preferredAutoStandby * 60000;//converting minutes into milliseconds
					standbyConfirmationTimer = setTimeout(showStandbyConfirmationDialogue, (preferredValueInMilliseconds - 60000));
				}
			},

			/**
			 * NET STB factory reset
			 * @method doFactoryReset
			 */
			doFactoryReset: function () {
				$N.app.fullScreenPlayer.tuner.disconnect();
				$N.platform.system.Preferences.set($N.app.constants.PREF_ISINSTALLED, "false");
				$N.platform.system.Preferences.set($N.app.constants.PREF_NOW_DISCLAIMER_ACCEPTED, "false");
				CCOM.ConfigManager.setValue("/network/siconfig/scans/cable_persistent/enabled", false);
				CCOM.System.reset();
			},

			/**
			 * Determines if running on an OpenTV target
			 * @method isNative
			 * @return {Boolean} true if OpenTV target, false if not
			 */
			isNative: function () {
				return (typeof CCOM === "function");
			}
		};
	}());

}($N || {}));
