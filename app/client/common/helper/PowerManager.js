/**
 * @class $N.common.helper.PowerManager
 * @singleton
 *
 * @requires $N.apps.core.Log
 */
(function ($N) {
	"use strict";
	$N.common = $N.common || {};
	$N.common.helper = $N.common.helper || {};

	$N.common.helper.PowerManager = (function () {
		var log = new $N.apps.core.Log("system", "PowerManager"),
			_initialised = false,
			_currentMode = 0;

		/**
		 * @method powerModeChanged
		 */
		function powerModeChanged(e) {
			switch (e.pwrmgrMode) {
			case CCOM.Pwrmgr.STANDBY_OFF:
				log("powerModeChanged", "Switch out of standby.");
				_currentMode = 0;
				$N.apps.util.EventManager.fire("SYSTEM_POWER_NORMAL");
				break;
			case CCOM.Pwrmgr.STANDBY_ON:
				log("powerModeChanged", "Switched to standby.");
				_currentMode = 1;
				$N.apps.util.EventManager.fire("SYSTEM_POWER_STANDBY");
				break;
			case CCOM.Pwrmgr.LOW_POWER:
				log("powerModeChanged", "Switch to low power mode.");
				_currentMode = 2;
				$N.apps.util.EventManager.fire("SYSTEM_POWER_LOW");
				break;
			default:
				log("powerModeChanged", "Switch to an UNKNOWN power mode.");
				_currentMode = 0;
				$N.apps.util.EventManager.fire("SYSTEM_POWER_UNKNOWN");
				break;
			}
		}

		//public API
		return {
			/**
			 * Initialises the power manager
			 * @method initialise
			 */
			initialise : function () {

				if (!_initialised) {
					var result;

					log("initialise", "Initialising Scan Manager.");

					// Register all of the events that this manager can fire
					$N.apps.util.EventManager.create("SYSTEM_POWER_LOW");
					$N.apps.util.EventManager.create("SYSTEM_POWER_STANDBY");
					$N.apps.util.EventManager.create("SYSTEM_POWER_NORMAL");
					$N.apps.util.EventManager.create("SYSTEM_POWER_UNKNOWN");

					CCOM.Pwrmgr.addEventListener("onPwrmgrModeChanged", powerModeChanged);

					result = CCOM.Pwrmgr.userModeGet();
					_currentMode = result.mode;
					if (result.mode === CCOM.Pwrmgr.STANDBY_ON) {
						$N.apps.util.EventManager.fire("SYSTEM_POWER_STANDBY");
						_currentMode = 1;
					} else {
						$N.apps.util.EventManager.fire("SYSTEM_POWER_NORMAL");
						_currentMode = 0;
					}

					_initialised = true;

					log("initialise", "Initialisation complete.");
				}
			},

			/**
			 * Gets the current power mode of the system.
			 * @method getCurrentPowerMode
			 */
			getCurrentPowerMode : function () {
				return _currentMode;
			},

			/**
			 *
			 */
			enterStandby : function () {
				log("togglePowerState", "You are feeling sleepy, sleeeppy....");
				var result = CCOM.Pwrmgr.userModeSet(CCOM.Pwrmgr.STANDBY_ON);
			},

			/**
			 *
			 */
			wakeUp : function () {
				log("togglePowerState", "Wake up Jeff!.");
				var result = CCOM.Pwrmgr.userModeSet(CCOM.Pwrmgr.STANDBY_OFF);
			},

			/**
			 *
			 */
			togglePowerState : function () {
				log("togglePowerState", "Toggling power mode.");
				if (_currentMode === 1) {
					$N.common.helper.PowerManager.wakeUp();
				} else {
					$N.common.helper.PowerManager.enterStandby();
				}
			},

			/**
			 * Initiates a safe user-requested reboot.
			 * @method reboot
			 * @param {Boolean} (optional) forceReboot - TRUE for a forced reboot, FALSE for a safe reboot.
			 * A force reboot request cannot be cancelled once issued, it will reboot the set-top box immediately.
			 * A safe reboot reboots the set-top box only when it is safe to do so
			 * @return {Number} status - specifies the return status of the call: 0 for success, a negative value for failure.
			 */
			reboot : function (forceReboot) {
				log("reboot", "Initiating a safe user-requested reboot");
				forceReboot = forceReboot === true;
				return CCOM.Pwrmgr.userReboot(forceReboot);
			},

			SYSTEM_POWER_NORMAL: 0,
			SYSTEM_POWER_STANDBY: 1,
			SYSTEM_POWER_LOW: 2
		};
	}());

}($N || {}));
