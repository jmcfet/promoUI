/**
 * MoCAManager manages the MoCA configuration of the system.
 * @class $N.app.MoCAManager
 * @static
 * @author rvaughan
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.MoCAManager = (function () {
		var log = new $N.apps.core.Log("Helper", "MoCAManager"),
			_initialised = false,
			_enabled = false,
			_currentConfig = null;

		return {
			/**
			 * Initialises the MoCAManager. This must be called before calling
			 * any other function otherwise random/undefined behaviour may
			 * be seen.
			 * @method initialise
			 * @public
			 */
			initialise : function () {
				var config = {},
					constants = $N.app.constants,
					preferences = $N.platform.system.Preferences;

				if (!_initialised) {
					_enabled = preferences.get(constants.PREF_MOCA_ENABLED, true);

					config = {
						enabled: preferences.get(constants.PREF_MOCA_ENABLED, true),
						privacyEnabled: preferences.get(constants.PREF_MOCA_PRIVACY_ENABLED, true),
						password: preferences.get(constants.PREF_MOCA_PRIVACY_PASSWORD, true),
						band: preferences.get(constants.PREF_MOCA_CHANNEL, true),
						bandMask: preferences.get(constants.PREF_MOCA_CHANNEL_MASK, true),
						txPower: preferences.get(constants.PREF_MOCA_TX_POWER, true),
						beaconPower: preferences.get(constants.PREF_MOCA_BEACON_POWER, true),
						networkController: preferences.get(constants.PREF_MOCA_NETWORK_CONTROLLER, true),
						phyTargetRate: preferences.get(constants.PREF_MOCA_PHYSICAL_TARGET_RATE, true),
						phyMargin: preferences.get(constants.PREF_MOCA_PHYSICAL_MARGIN, true)
					};

					_currentConfig = new $N.app.MoCADataMapper(config);

					_initialised = true;
				}
			},

			/**
			 * Returns TRUE if MoCA is currently enabled in the configuration
			 * or FALSE otherwise. Note: This may be different to the feature
			 * actually being enabled in the system itself.
			 * @method isEnabled
			 * @public
			 */
			isEnabled : function () {
				return _enabled;
			},

			/**
			 * Returns a configuration object containing the existing configuration
			 * of the MoCA feature.
			 * @method getCurrentConfiguration
			 * @public
			 */
			getCurrentConfiguration : function () {
				return _currentConfig;
			}
		};
	}());

}($N || {}));