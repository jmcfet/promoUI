/**
 * Contains configuration flags
 *
 * @author gstacey
 * @class $N.Config
 * @singleton
 */
define('jsfw/Config',
    ['jsfw/apps/util/Util'],
	function (Util) {
		window.$N = $N || {};

		if (!$N.Config || $N.apps.util.Util.isEmptyObject($N.Config)) {
			/**
			 * Returns a string containing a version information for SDP, Ninja Framework & NMP (If Available)
			 */
			$N.Config = {
				/**
				 * Defines if DRM functionality is to be used
				 * @property {Boolean} DRM
				 */
				DRM: false,
				/**
				 * Defines if Tracks functionality is to be used
				 * @property {Boolean} TRACKS
				 */
				TRACKS: false,
				/**
				 * Defines if Persistent Cache is to be used by IPDataLoader when caching channels and events
				 * @property {Boolean} PERSISTENT_CACHE
				 */
				PERSISTENT_CACHE: false,
				/**
				 * Defines if Adverts functionality is to be used
				 * @property {Boolean} ADVERTS
				 */
				ADVERTS: false,
				/**
				 * Defines if Presentation Manager is to be used
				 * @property {Boolean} PRESENTATION_MANAGER
				 */
				PRESENTATION_MANAGER: false,
				/**
				 * Defines if promotions functionality is to be used
				 * @property {Boolean} PROMOTIONS
				 */
				PROMOTIONS: false,
				/**
				 * Defines Plugin Version Prefix e.g "NagraQA."
				 * @property {String} PLUGIN_VER_PREFIX
				 */
				PLUGIN_VER_PREFIX: ""
			};
		}
		return $N.Config;
	}
);
