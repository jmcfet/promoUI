/**
 * Application for hosting an HTML application.
 * @class HTMLApps
 * @static
 */
var HTMLApps = (function () {

	// Private functions and variables go here.
	var $N = window.parent.$N,
		log = new $N.apps.core.Log("HTMLApps", "HTMLApps"),
		popup = null,
		xlinkNS = "http://www.w3.org/1999/xlink",
		contextualMenu = null,
		contextualMenuItems = [],
		appsList = null,
		browser,
		CCOM = window.parent.CCOM,
		url = null,
		view = {},
		timeDisplay,
		itemsContextualMenu = null,
		focusStock = null,
		removeFocus = null,
		keyHandler,
        previousServiceToTune = null;

	/**
     * Adds parameters required to pass along the URL, to
     * launch the third party application 
     * @method addParametersToUrl
     * @private
     */
	function addParametersToUrl(url) {
		log("addParametersToUrl", "Enter--------------");
		var smartCardObject = $N.app.ConditionalAccessCAK73.getCASmartCardInfo(),
			keysObjectArray = [],
			docsisInfo = CCOM.IpNetwork.cableModem[0],
			systemObject = $N.app.ConditionalAccessCAK73.getCASystemInfo(),
			notAvailableText = "N.A.",
			isDebugValue = ($N.app.Config.getConfigValue("mds.developer.mode") === "on") ? true : false,
			currentEvent = $N.platform.btv.EPG.getCurrentEventForService($N.app.epgUtil.getChannelFromPrefs()),
			currentEventRating = (currentEvent && currentEvent.parentalRating) ? currentEvent.parentalRating : "",
			smartCardNumber = (smartCardObject.smartcardInfo) ? smartCardObject.smartcardInfo.serialNumber || notAvailableText : notAvailableText,
			systemConfiguration = $N.platform.system.Preferences.get($N.app.constants.PREF_SCAN_CONFIGURATION, false);
		systemConfiguration = JSON.parse(systemConfiguration);
		smartCardNumber = smartCardNumber.replace(/ /g, '');
		keysObjectArray.push({
			NIT : systemConfiguration.networkId,
			Smartcard : smartCardNumber,
			parentalPass : $N.platform.ca.PINHandler.getLocalMasterPin(),
			salesPass : $N.platform.system.Preferences.get($N.app.constants.PURCHASE_PIN_PATH, true),
			IPCM : (docsisInfo && docsisInfo.ipAddressExternal) ? docsisInfo.ipAddressExternal : notAvailableText,
			MacAdressCM : (docsisInfo && docsisInfo.macAddressExternal) ? docsisInfo.macAddressExternal : notAvailableText,
			SerialNumber : CCOM.System.getStringById($N.app.constants.SYSTEM_STB_SERIAL_NUMBER).string || notAvailableText,
			ServiceArea : $N.platform.system.Preferences.get($N.app.constants.PREF_AREA_ID, true),
			rating : currentEventRating.toString(),
			isBlocked : $N.app.ParentalControlUtil.isChannelOrProgramLocked(currentEvent),
			isDebug : isDebugValue,
			stbModel : CCOM.System.getStringById($N.app.constants.SYSTEM_STB_MODEL).string || notAvailableText,
			decoderCA : systemObject.systemInfo.serialNumber || notAvailableText
		});
		url = url + "?stbid=" + smartCardNumber + "&param=" + encodeURIComponent(JSON.stringify({Keys : keysObjectArray}));
		log("addParametersToUrl", "Exit--------------");
		return url;
	}

	/**
	 * Sets the focus on the browser so that the user can navigate around
	 * @method focusBrowser
	 * @private
	 */
	function focusBrowser() {
		browser.contentWindow.focus();
	}

	/**
	 * Listener to fire on keyPress for iframe and steal iframe's key event keyCode inside main Application
	 * @method dispatchEventFromSubApp
	 * @private
	 * @param {object} event object.
	 */
	function dispatchEventFromSubApp(e) {
		keyHandler(e.keyCode);
	}

	/**
	 * Listener to fire on load event of iframe.
	 * @method setSubAppCallback
	 * @private
	 * @param {object} event object.
	 * 
	 */
	function setSubAppCallback() {
		if (browser) {
			try {
				// Webkit uses contentDocument
				$N.app.BrowserManager.setBrowserVisible(true);
				var subDocument = (browser.contentWindow || browser.contentDocument);
				if (subDocument.document) {
					subDocument = subDocument.document;
				}
				subDocument.addEventListener("keydown", dispatchEventFromSubApp, false);
				focusBrowser();
			} catch (e) {
				log("====ERROR: Cannot set setSubAppCallback to child, i.e. Cannot steal key events from child." + e);
			}
		}
	}

	/**
	 * Main key handler method that handles key presses.
	 * @method keyHandler
	 * @param {number} keycode of the key that was pressed.
	 * @return {Boolean} True if the key press was handled, false if the
	 * key press wasn't handled.
	 */
	keyHandler = function (key) {
		log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;
		// since here key is the key code, hence we have to call keys.getKey(key) which will return the key name as string
		if (keys.getKey(key) === keys.KEY_EXIT) {
			$N.app.ContextHelper.exitContext(previousServiceToTune);
			handled = true;
			window.parent.focus();
		}
		return handled;
	};

	/**
	 * Sets the xlink:href attribute for the browser tag.
	 * Upon setting this the passed url will be loaded in the browser
	 * @method _loadUrl
	 * @private
	 * @param {String} urlToLoad - url that is to be loaded
	 */
	function loadUrl(urlToLoad) {
		var url = urlToLoad;
		log("loadUrl", "url: " + url);
		browser.addEventListener("load", setSubAppCallback);
		browser.setAttribute("src", url);
	}

	/**
	 * Removes the focus from the browser so that the user can not navigate within it
	 * @method _unFocusBrowser
	 * @private
	 */
	function unFocusBrowser() {
		log("unFocusBrowser", "Enter--------------");
		document.documentElement.setFocus(removeFocus);
	}

	function loadStartListener() {
		log("loadStartListener", "Enter--------------");
		unFocusBrowser();
		$N.app.BrowserManager.setBrowserVisible(false);
	}

	function loadListener() {
		log("loadListener", "url------" + browser.getAttributeNS(xlinkNS, "href"));
		focusBrowser();
		$N.app.BrowserManager.setBrowserVisible(true);
	}

	function errorListener() {
		log("errorListener", "Error--------------");
	}

	function registerListeners() {
		browser.addEventListener("loadstart", loadStartListener, false);
		browser.addEventListener("load", loadListener, false);
		browser.addEventListener("error", errorListener, false);
	}

	function unregisterListeners() {
		browser.removeEventListener("loadstart", loadStartListener, false);
		browser.removeEventListener("load", loadListener, false);
		browser.removeEventListener("error", errorListener, false);
	}

	/**
	 * Check if the title is in url of browser
	 * @method isScreen
	 * @param {string} title
	 */
	function isUrlLoaded(title) {
		log("isUrlLoaded", "match text  " + title);
		var currentUrl = browser.getAttributeNS(xlinkNS, "href"),
			index = currentUrl.indexOf(title),
			found = false;
		log("isUrlLoaded", "currentUrl  " + currentUrl);
		if (index !== -1) {
			found = true;
		}
		return found;
	}

	// Public API
	return {
		/**
		 * Entry point of the application for the SVG onload event.
		 * @method load
		 */
		load: function () {
			log("load", "Enter");
			//$N.platform.system.Preferences.deletePreference($N.app.constants.YahooNews_WATCHLIST);
			$N.gui.ResolutionManager.initialiseContext(document);
			$N.apps.core.Language.importLanguageBundleForObject(
				HTMLApps,
				HTMLApps.init,
				"apps/htmlapps/common/",
				"LanguageBundle.js",
				null,
				window
			);
			log("load", "Exit");
		},

		/**
		 * Application lifecycle initialisation method to create the view.
		 * @method init
		 */
		init: function () {
			log("init", "Enter");
			$N.gui.FrameworkCore.loadGUIFromXML("apps/htmlapps/view/htmlapps.xml", document.getElementById("content"), view, window);
			browser = $N.app.BrowserManager.getBrowser();
			$N.apps.core.ContextManager.initialisationComplete(HTMLApps);
			log("init", "Exit");
		},

		/**
		 * Application lifecycle activation method to draw the view.
		 * @method activate
		 */
		activate: function (activationContext) {
			log("activate", "Enter");
			$N.app.BrowserManager.activate();

			url = $N.platform.system.Preferences.get($N.app.constants.PREF_GENIE_SERVER, true) + activationContext.url;
			url = addParametersToUrl(url);
			loadUrl(url);
			previousServiceToTune = (activationContext && activationContext.previousService) ? activationContext.previousService : null;
		},

		/**
		 * Application lifecycle passivation method to hide the view.
		 * @method passivate
		 */
		passivate: function () {
			log("passivate", "Enter");
			browser.removeEventListener("load", setSubAppCallback);
			$N.app.BrowserManager.passivate();
			log("passivate", "Exit");
		},

		/**
		 * Application lifecycle method to preview the view.
		 * @method preview
		 */
		preview: function () {
			log("preview", "Enter");
			log("preview", "Exit");
		},

		/**
		 * Application lifecycle method to unpreview the view.
		 * @method dismissPreview
		 */
		dismissPreview: function () {
			log("dismissPreview", "Enter");
			log("dismissPreview", "Exit");
		},

		/**
		 * Application lifecycle method to return the context name.
		 * @method toString
		 * @return {String} Application name.
		 */
		toString: function () {
			return "HTMLAPPS";
		},

		keyHandler: keyHandler
	};
}());