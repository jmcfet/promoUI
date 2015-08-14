/**
 * This is a util class used to manage front panel actions
 *
 * Singleton class
 *
 * @class $N.common.helper.FrontPanelManager
 * @static
 * @author wcarvalh
 * @requires $N.apps.core.Log
 * @requires $N.app.constants
 * @requires $N.app.StandardTimers
 * #depends StandardTimers.js
 * #depends ../Constants.js
 */
(function ($N) {
	"use strict";
	$N.common = $N.common || {};
	$N.common.helper = $N.common.helper || {};

	var log = new $N.apps.core.Log("FrontPanelManager", "FrontPanelManager"),
		me = null,
		FRONTPANEL_DISPLAY_MODES = $N.app.constants.FRONTPANEL_DISPLAY_MODES,
		TWENTY_FOUR_HOUR_TIME_FORMAT = $N.app.constants.TWENTY_FOUR_HOUR_TIME_FORMAT,
		display = null,
		showCurrentTimeTimer = null,
		isChannelNumberDisplayed = false,
		FRONTPANEL_TIMEOUT_PERIOD = (10 * 1000),
		minuteTimer = $N.app.StandardTimers.minuteTimer,
		normalPowerMode = true;

	/**
	 * @private
	 */
	function updateFrontPanelTime(date) {
		log("updateFrontPanelTime", "Enter");
		var time;
		if (date && !isChannelNumberDisplayed) {
			// if front panel display is chosen to time and channel number is not updated, update and display time.
			time = $N.app.DateTimeUtil.getFormattedTimeString(date, TWENTY_FOUR_HOUR_TIME_FORMAT);
			CCOM.System.setFrontPanelString(time);
		}
		log("updateFrontPanelTime", "Exit");
	}

	/**
	 * @private
	 */
	function showCurrentTime() {
		log("showCurrentTime", "Enter");
		minuteTimer.enable("FrontPanelManagerClock");
		updateFrontPanelTime(new Date());
		log("showCurrentTime", "Exit");
	}

	/**
	 * Sets the Front Panel Intensity
	 * @method setFrontPanelIntensity
	 * @param {String} selectedLevelString
	 */
	function setFrontPanelIntensity(selectedLevelString) {
		log("setFrontPanelIntensity", "Enter");
		var intensityLevel,
			intensityNumber = selectedLevelString ? parseInt(selectedLevelString, 10) : 1;
		intensityLevel = CCOM.System.setFrontPanelIntensityLevel(intensityNumber);
		if (intensityLevel.error) {
			selectedLevelString = $N.platform.system.Preferences.get($N.app.constants.PREF_FRONTPANEL_INTENSITY);
			CCOM.System.setFrontPanelIntensityLevel(parseInt(selectedLevelString, 10));
			log("setFrontPanelIntensity", "Exit 1");
			return false;
		} else {
			$N.platform.system.Preferences.set($N.app.constants.PREF_FRONTPANEL_INTENSITY, selectedLevelString);
			log("setFrontPanelIntensity", "Exit 2");
			return true;
		}
	}

	function showBootupMessage() {
		log("showBootupMessage", "Enter");
		var frontPaneldisplay = $N.platform.system.Preferences.get($N.app.constants.PREF_FRONTPANEL_DISPLAY);

		if ($N.common.helper.PowerManager.getCurrentPowerMode() === $N.common.helper.PowerManager.SYSTEM_POWER_NORMAL) {
			normalPowerMode = true;
			if (frontPaneldisplay) {
				me.setFrontPanelString($N.app.constants.PREF_STRING_DURING_BOOT);
			}
		} else {
			normalPowerMode = false;
			setFrontPanelIntensity(1);
			me.setFrontPanelDisplay($N.app.constants.FRONTPANEL_DISPLAY_MODES.STAND_BY);
		}
		log("showBootupMessage", "Exit");
	}

	/**
	 * Reads in preferred values of the  intensityLevel and frontPaneldisplay
	 * and calls the method for setting front panel
	 * @method configureFrontPanel
	 * @private
	 */
	function configureFrontPanel() {
		log("configureFrontPanel", "Enter");
		var intensityLevel = $N.platform.system.Preferences.get($N.app.constants.PREF_FRONTPANEL_INTENSITY);

		if (intensityLevel) {
			setFrontPanelIntensity(intensityLevel);
		}

		log("configureFrontPanel", "Exit");
	}

	/**
	 * @method enterStandbyPowerMode
	 * @private
	 */
	function enterStandbyPowerMode() {
		log("enterStandbyPowerMode", "Enter");
		normalPowerMode = false;
		//sets front panel display to "time" whenever it enters Stand-by mode.
		me.setFrontPanelDisplay($N.app.constants.FRONTPANEL_DISPLAY_MODES.STAND_BY);
		setFrontPanelIntensity(1);
		log("enterStandbyPowerMode", "Exit");
	}

	/**
	 * @method enterNormalPowerMode
	 * @private
	 */
	function enterNormalPowerMode() {
		log("enterNormalPowerMode", "Enter");
		normalPowerMode = true;
		configureFrontPanel();
		log("enterNormalPowerMode", "Exit");
	}

	//Public API
	$N.common.helper.FrontPanelManager = {

		/**
		 * Initialise the system
		 */
		initialise: function () {
			log("initialise", "Enter");
			CCOM.System.frontPanelControl(true);
			minuteTimer.register("FrontPanelManagerClock", updateFrontPanelTime);
			$N.apps.core.Language.adornWithGetString(this);
			$N.apps.util.EventManager.subscribe("channelChanged", this.updateChannelNumber, this);
			$N.apps.util.EventManager.subscribe("SYSTEM_POWER_STANDBY", enterStandbyPowerMode, this);
			$N.apps.util.EventManager.subscribe("SYSTEM_POWER_NORMAL", enterNormalPowerMode, this);
			me = this;
			configureFrontPanel();
			showBootupMessage();
			log("initialise", "Exit");
		},

		/**
		 * Set the text to front panel
		 * @method setFrontPanelString
		 * @param {String} text
		 */
		setFrontPanelString: function (text) {
			log("setFrontPanelString", "Enter - text:" + text);
			if ($N.common.helper.PowerManager.getCurrentPowerMode() === $N.common.helper.PowerManager.SYSTEM_POWER_NORMAL) {
				CCOM.System.setFrontPanelString(text);
			}
			log("setFrontPanelString", "Exit");
		},

		/**
		 * Display the channel number on front display
		 * @method displayServiceNumber
		 * @param {Number} serviceNumber
		 */
		displayServiceNumber: function (serviceNumber) {
			log("displayServiceNumber", "Enter");
			var channelString;
			if (serviceNumber) {
				channelString = " " + $N.app.GeneralUtil.padNumberWithZeroes(serviceNumber, 3);
				me.setFrontPanelString(channelString);
				isChannelNumberDisplayed = true;
			}
			log("displayServiceNumber", "Exit");
		},

		/**
		 * @method setChannelNumber
		 * @param {String} serviceId
		 */
		setChannelNumber: function (serviceId) {
			log("setChannelNumber", "Enter");
			var service = $N.platform.btv.EPG.getChannelByServiceId(serviceId),
				serviceNumber;
			if (service) {
				serviceNumber = service.logicalChannelNum || service.number || service.channelKey || '';
				this.displayServiceNumber(serviceNumber);
			}
			log("setChannelNumber", "Exit");
		},

		/**
		 * Sets the Front Panel Display based on preferences(either "Time" or "channel").
		 * @method setFrontPanelDisplayToPreference
		 */

		setFrontPanelDisplayToPreference: function () {
			log("setFrontPanelDisplayToPreference", "Enter");
			if ($N.common.helper.PowerManager.getCurrentPowerMode() === $N.common.helper.PowerManager.SYSTEM_POWER_NORMAL) {
				display = $N.platform.system.Preferences.get($N.app.constants.PREF_FRONTPANEL_DISPLAY);
				if (display === $N.app.constants.FRONTPANEL_DISPLAY_TIME) {
					isChannelNumberDisplayed = false;
					showCurrentTime();
				} else {
					minuteTimer.disable("FrontPanelManagerClock");
					this.updateChannelNumber();
				}
			}
			log("setFrontPanelDisplayToPreference", "Exit");
		},

		/**
		 * Sets the Front Panel Display based on display mode.
		 * mode = (DEFAULT: 1,STAND_BY: 2,PVR_PLAY_BACK : 3,MUSIC : 4).
		 * Sets the Front Panel Display to time whenever STB is in stand-by  or PVR play-back mode.
		 * Sets the Front Panel Display to "AUDI" whenever STB is in music mode.
		 * @method setFrontPanelDisplay
		 * @param {String} mode (optional)
		 * @param {String} serviceId (optional)
		 */
		setFrontPanelDisplay: function (mode, serviceId) {
			log("setFrontPanelDisplay", "Enter");
			switch (mode) {
			case FRONTPANEL_DISPLAY_MODES.STAND_BY:
			case FRONTPANEL_DISPLAY_MODES.PVR_PLAY_BACK:
				isChannelNumberDisplayed = false;
				showCurrentTime();
				break;
			case FRONTPANEL_DISPLAY_MODES.WAKE_UP:
				me.updateChannelNumber();
				break;
			case FRONTPANEL_DISPLAY_MODES.MUSIC:
				minuteTimer.disable("FrontPanelManagerClock");
				if (showCurrentTimeTimer) {
					clearTimeout(showCurrentTimeTimer);
				}
				me.setFrontPanelString($N.app.constants.PREF_DEFAULT_STRING);
				break;
			case FRONTPANEL_DISPLAY_MODES.VOD:
				minuteTimer.disable("FrontPanelManagerClock");
				if (showCurrentTimeTimer) {
					clearTimeout(showCurrentTimeTimer);
				}
				me.setFrontPanelString($N.app.constants.PREF_STRING_VOD);
				break;
			case FRONTPANEL_DISPLAY_MODES.CATCHUP_STARTOVER:
				minuteTimer.disable("FrontPanelManagerClock");
				me.setChannelNumber(serviceId);
				break;
			default: // FRONTPANEL_DISPLAY_MODES.DEFAULT
				if (normalPowerMode) {
					me.setFrontPanelDisplayToPreference();
				}
				break;
			}
			log("setFrontPanelDisplay", "Exit");
		},

		/**
		 * Updates the channel number on front display
		 * @method updateChannelNumber
		 */
		updateChannelNumber: function () {
			log("updateChannelNumber", "Enter");
			if ($N.common.helper.PowerManager.getCurrentPowerMode() === $N.common.helper.PowerManager.SYSTEM_POWER_NORMAL) {
				var channelFromPref = $N.app.epgUtil.getChannelFromPrefs(),
					display = $N.platform.system.Preferences.get($N.app.constants.PREF_FRONTPANEL_DISPLAY);
				if (showCurrentTimeTimer) {
					clearTimeout(showCurrentTimeTimer);
				}
				if (display === $N.app.constants.FRONTPANEL_DISPLAY_TIME) {
					showCurrentTimeTimer = setTimeout(this.setFrontPanelDisplayToPreference, FRONTPANEL_TIMEOUT_PERIOD);
				}
				if (channelFromPref) {
					this.setChannelNumber(channelFromPref);
				}
			}
			log("updateChannelNumber", "Exit");
		},

		setFrontPanelIntensity: setFrontPanelIntensity
	};

}($N || {}));