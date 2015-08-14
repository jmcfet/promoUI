/**
 * BrowserManager
 *
 * @class BrowserManager
 * @static
 * @namespace $N.app
 * @requires $N.apps.core.Log
 */

var $N = $N || {};
$N.app = $N.app || {};

$N.app.BrowserManager = (function () {
    var log = new $N.apps.core.Log("app", "BrowserManager"),
		view = {},
	    browser = null,
		removeFocus = null,
		video = null,
		browserContainer = null,
		xlinkNS = "http://www.w3.org/1999/xlink";

    return {
        /**
         * 
         * @method initialise
         */
        initialise : function (docRef, view) {
            log("initialise", "Initialising BrowserManager");
            browser = docRef.getElementById("browser");
            removeFocus = docRef.getElementById("removeFocus");
            video = view.fullScreenPlayer;
        },

        /**
         * @method activate
         */
        activate : function (activationContext) {
            log("activate", "Enter");
        },

        passivate : function () {
            log("passivate", "passivate");
            video.show();
			browser.setAttribute("style", "display:none");
            browser.setAttribute("src", "");
        },

        getBrowser : function () {
            return browser;
        },

        getRemoveFocus : function () {
            return removeFocus;
        },

        setBrowserVisible : function (visible) {
            log("setBrowserVisible", "visible  -- " + visible);
            if (visible) {
                video.hide();
                browser.setAttribute("style", "display:block");
            } else {
                video.show();
                browser.setAttribute("style", "display:none");
            }
        }
    };
}());
