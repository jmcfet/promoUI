/**
 * The brand helper class deals with setting the client logo, background and displaying/hiding them
 * The Branding has been added to $N.app so can be accessed with $N.app.BrandHelper
 *
 * @class $N.app.BrandHelper
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	"use strict";
	$N = $N || {};
	$N.app = $N.app || {};
	$N.app.BrandHelper = (function () {
		var log = new $N.apps.core.Log("CommonGUI", "BrandHelper"),
			view = {},
			DEFAULT_BACKGROUND_ID = 0,
			AGORA_BACKGROUND_ID = 1,
			GUIDE_BACKGROUND_ID = 2,
			MOSAIC_BACKGROUND_ID = 3,
			MUSIC_BACKGROUND_ID = 4,
			SYNOPSIS_BACKGROUND_ID = 5,
			SEARCH_BACKGROUND_ID = 6,
			SEARCH_VOD_BACKGROUND_ID = 7;

		/**
		 * @method initialise
		 * @param {Object} viewObject
		 */
		function initialise(viewObject) {
			log("initialise", "Enter");
			view = viewObject;
			log("initialise", "Exit");
		}

		/**
		 * @method hideAll
		 */
		function hideAll() {
			log("hide", "Enter");
			view.hide();
			log("hide", "Exit");
		}

		/**
		 * @method show
		 * @param {Number} backgroundId
		 */
		function show(backgroundId) {
			log("show", "Enter");
			backgroundId = backgroundId || DEFAULT_BACKGROUND_ID;
			view.show(backgroundId);
			log("show", "Exit");
		}

		return {
			initialise: initialise,
			hideAll: hideAll,
			show: show,
			DEFAULT_BACKGROUND_ID: DEFAULT_BACKGROUND_ID,
			AGORA_BACKGROUND_ID: AGORA_BACKGROUND_ID,
			GUIDE_BACKGROUND_ID: GUIDE_BACKGROUND_ID,
			MOSAIC_BACKGROUND_ID: MOSAIC_BACKGROUND_ID,
			MUSIC_BACKGROUND_ID: MUSIC_BACKGROUND_ID,
			SYNOPSIS_BACKGROUND_ID: SYNOPSIS_BACKGROUND_ID,
			SEARCH_BACKGROUND_ID: SEARCH_BACKGROUND_ID,
			SEARCH_VOD_BACKGROUND_ID: SEARCH_VOD_BACKGROUND_ID
		};
	}());

}($N || {}));