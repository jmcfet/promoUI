/**
 * @class $N.common.helper.Analytics
 * @static
 * @author rvaughan
 */
(function ($N) {

	$N.common = $N.common || {};
	$N.common.helper = $N.common.helper || {};

	$N.common.helper.Analytics = (function () {
		var initialised = false,
			enabled = false,
			server = "";

		return {
			/**
			 * @method initialise
			 * @public
			 */
			initialise : function () {
				if (!initialised) {
					enabled = ($N.platform.system.Preferences.get("analytics.enabled") === "true");

					if (enabled) {
						server = $N.platform.system.Preferences.get("analytics.server");
					}
					initialised = true;
				}
			}
		};
	}());

}($N || {}));
