/**
 * Returns Version Number of build
 *
 * @author dermotts
 * @class $N.apps.core.Version
 * @singleton
 */
define('jsfw/apps/core/Version',
    [],
	function () {
		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.core = $N.apps.core || {};

		/**
		 * Returns a string containing a version information for SDP, Ninja Framework & NMP (If Available)
		 */
		$N.apps.core.Version = {
			/**
			 * returns the version of sdp
			 * @property {string} sdp
			 */
			sdp:'All',
			/**
			 * returns the version of ninja
			 * @property {string} ninja
			 */
			ninja:'R-CLIENT-JSFW-2.3.0-b1'

		};
		/**
		 * returns the version of nmp
		 * @property {string} nmp
		 */
		Object.defineProperty($N.apps.core.Version, "nmp", {
			get: function () {
				return $N.env.playerVersion || "Not Available";
			}
		});
		return $N.apps.core.Version;
	}
);