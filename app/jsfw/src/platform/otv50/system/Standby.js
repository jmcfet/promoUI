/**
 * CCOM 2.0
 *
 * This class contains methods that put the STB into standby mode or wake it from a standby mode.
 * It makes use of a SystemStandby event listener and a SystemWake event listener for when the STB
 * is put into and out of standby mode respectively.
 * Callers can register listeners and perform any activities when the class goes into Standby mode.
 *
 * @class $N.platform.system.Standby
 * @singleton
 *
 *
 */

define('jsfw/platform/system/Standby',
	[
		'jsfw/apps/core/Log'
	],
	function (Log) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.system = $N.platform.system || {};

		$N.platform.system.Standby = (function () {
			var log = new $N.apps.core.Log('system', 'Standby'),
				LOG_LEVEL_INFO = 'info';

			return {
				/**
				 * Initialises the default listeners for the standby and wake events
				 *
				 * @method init
				 */
				init: function () {},

				/**
				 * Determines whether the STB is in standby mode.
				 *
				 * @method isInStandbyMode
				 * @return {Boolean} true if the STB is in standby mode, false otherwise.
				 */
				isInStandbyMode: function () {
				    return CCOM.System.getStandby().standby;
				},

				/**
				 * Registers a callback function to be invoked when the STB goes into Standby mode.
				 *
				 * @method registerStandbyListener
				 * @param callbackFunction {Function} callback function to be invoked
				 */
				registerStandbyListener: function (callbackFunction) {
					log("registerStandbyListener", "Enter", LOG_LEVEL_INFO);
					CCOM.System.addEventListener("onSystemStandby", callbackFunction, false);
					log("registerStandbyListener", "Exit", LOG_LEVEL_INFO);
				},

				/**
				 * Registers a callback function to be invoked when the STB wakes up from Standby mode.
				 *
				 * @method registerWakeListener
				 * @param callbackFunction {Function} callback function to be invoked
				 */
				registerWakeListener: function (callbackFunction) {
					log("registerWakeListener", "Enter", LOG_LEVEL_INFO);
					CCOM.System.addEventListener("onSystemWake", callbackFunction, false);
					log("registerWakeListener", "Exit", LOG_LEVEL_INFO);
				},

				/**
				 * Unregisters a previously registered callback function from the SystemWake event.
				 *
				 * @method UnregisterWakeListener
				 * @param callbackFunction {Function} callback function to be unregistered
				 */
				UnregisterWakeListener: function (callbackFunction) {
					log("UnregisterWakeListener", "Enter", LOG_LEVEL_INFO);
					CCOM.System.removeEventListener("onSystemWake", callbackFunction, false);
					log("UnregisterWakeListener", "Exit", LOG_LEVEL_INFO);
				},

				/**
				 * Unregisters a previously registered callback function from the SystemStandby event.
				 *
				 * @method UnregisterStandbyListener
				 * @param callbackFunction {Function} callback function to be unregistered
				 */
				UnregisterStandbyListener: function (callbackFunction) {
					log("UnregisterStandbyListener", "Enter", LOG_LEVEL_INFO);
					CCOM.System.removeEventListener("onSystemStandby", callbackFunction, false);
					log("UnregisterStandbyListener", "Exit", LOG_LEVEL_INFO);
				},

				/**
				 * Method to take the STB to Standby mode.
				 *
				 * @method standby
				 * @param control {Number} selects type of standby state. Usually set to 0. The values that this can be
				 * set to and what they mean are platform-specific.
				 * @return {Boolean} true if the system is already in, or made to go to standby mode; false otherwise.
				 */
				standby: function (control) {
					log("standby", "started", LOG_LEVEL_INFO);
					var result = true;
					if (!this.isInStandbyMode()) {
						result = CCOM.System.setStandby(true);
						if (result === undefined) {
						    result = false;
						}
					}
					log("standby", "completed", LOG_LEVEL_INFO);
					return result;
				},

				/**
				 * Method to wake up the STB from Standby mode.
				 *
				 * @method wake
				 * @return {Boolean} True if the STB is or made to wake up, false otherwise
				 */
				wake: function () {
					log("wake", "started", LOG_LEVEL_INFO);
					var result = true;
					if (this.isInStandbyMode()) {
						result = CCOM.System.setStandby(false);
						if (result === undefined) {
						    result = false;
						}
					}
					log("wake", "completed", LOG_LEVEL_INFO);
					return result;
				}
			};
		}());
		return $N.platform.system.Standby;
	}
);
