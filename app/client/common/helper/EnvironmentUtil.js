/**
 * Helper class for debugging
 *
 * @class $N.app.EnvironmentUtil
 * @author rhill
 * @static
 * @requires $N.app.Config
 * @requires $N.app.constants
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.EnvironmentUtil = (function () {

		// Public
		return {

			isSTBEnvironmentDVB: function () {
				return ($N.app.Config.getConfigValue($N.app.constants.CONFIG_STB_ENVIRONMENT_TYPE) === $N.app.constants.STB_ENVIRONMENT_DVB) ? true : false;
			},

			isSTBEnvironmentIP: function () {
				return ($N.app.Config.getConfigValue($N.app.constants.CONFIG_STB_ENVIRONMENT_TYPE) === $N.app.constants.STB_ENVIRONMENT_IP) ? true : false;
			},

			isSTBEnvironmentHybrid: function () {
				return ($N.app.Config.getConfigValue($N.app.constants.CONFIG_STB_ENVIRONMENT_TYPE) === $N.app.constants.STB_ENVIRONMENT_HYBRID) ? true : false;
			},

			isDVBEnabled: function () {
				return (($N.app.Config.getConfigValue($N.app.constants.CONFIG_STB_ENVIRONMENT_TYPE) === $N.app.constants.STB_ENVIRONMENT_HYBRID) || ($N.app.Config.getConfigValue($N.app.constants.CONFIG_STB_ENVIRONMENT_TYPE) === $N.app.constants.STB_ENVIRONMENT_DVB)) ? true : false;
			},

			isIPEnabled: function () {
				return (($N.app.Config.getConfigValue($N.app.constants.CONFIG_STB_ENVIRONMENT_TYPE) === $N.app.constants.STB_ENVIRONMENT_HYBRID) || ($N.app.Config.getConfigValue($N.app.constants.CONFIG_STB_ENVIRONMENT_TYPE) === $N.app.constants.STB_ENVIRONMENT_IP)) ? true : false;
			},

			getSTBEnvironmentType: function () {
				return $N.app.Config.getConfigValue($N.app.constants.CONFIG_STB_ENVIRONMENT_TYPE);
			}

		};
	}());

}($N || {}));