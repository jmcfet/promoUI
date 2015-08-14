/*global TimeList, GridController*/
/**
 * EventList is a sub_controller of list guide and is used to controll
 * event list and event grid
 * @module ListGuide
 * @class NoEpg
 * @constructor
 * @param {Object} controller
 * @param {Object} NoEpgView
 */
var NoEpg = function (controller, view) {
	var $N = window.parent.$N,
		log = new $N.apps.core.Log("ListGuide", "NoEpg");

	/* Public API */
	return {

		/**
		 * Initialises the state
		 * @method initialise
		 * @param {Function} callback
		 */
		initialise: function () {
			log("initialise", "Enter");
			$N.apps.core.Language.importLanguageBundleForObject(this, null, "apps/listGuide/common/", "LanguageBundle.js", null, window);

			log("initialise", "Exit");
		},

		preview: function () {
			log("preview", "Enter");
			log("preview", "Exit");
		},

		unPreview: function (data) {
			log("unPreview", "Enter");
			log("unPreview", "Exit");
		},

		/**
		 * Activates the state
		 * @method activate
		 * @param {Object} data
		 */
		activate: function () {
			log("activate", "Enter");

			view.noEPGTitle.setText(controller.getString("noEPGTitle"));
			view.noEPGinfo.setText(controller.getString("noEPGinfo"));
			view.show();
			log("activate", "Exit");
		},

		/**
		 * Passivates the state
		 * @method passivate
		 * @param {Boolean} leaveAsPreview
		 */
		passivate: function (leaveAsPreview) {
			log("passivate", "Enter");
			view.hide();
			log("passivate", "Exit");
		},

		/**
		 * Key handler for the state
		 * @method keyHandler
		 * @param {String} key
		 */
		keyHandler: function (key) {
			log("keyHandler", "Enter");
			var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
				handled = false;
			$N.app.MemoryUtil.setOrUpdateGarbageCollectTimeoutAndInterval();
			switch (key) {
			case keys.KEY_OK:
				log("keyHandler", "Exit1");
				$N.app.ContextHelper.closeContext();
				handled = true;
				break;
			default:
				log("keyHandler", "Exit2");
				handled = false;
				break;
			}

			log("keyHandler", "Exit");
			return handled;
		}
	};
};
