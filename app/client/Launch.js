/*global GlobalKeysInterceptor, Layer:true*/
// repository to store global objects and data
/**
 * @class $N.app.Launch
 * @requires $N.app.LaunchUtil
 * @requires $N.app.Config
 * @requires $N.app.constants
 * @requires $N.app.NetworkUtil
 * @requires $N.app.ErrorMessage
 */

var $N = $N || {};
$N.app = $N.app || {};

var Launch = (function () {
	var log = new $N.apps.core.Log("Launch", "Launch"),
		view = {},
		loadAppImmediately = true,
		contextsLoadedSubscriptionId = null,
		isAppLoaded = false,

		// functions
		getRatingData,
		doBootstrap,
		navigateToDefault,
		navigateToInstallWizard,
		finaliseInstallation,
		finishInstaller,
		overrideEthernetStateChangeCallbacks,
		onContextsLoadedListener,
		onEthernetUpListener,
		showProgress,
		checkLoadingComplete,
		loadApp,
		loadAppAndFinishInstaller,
		checkEthernetConnection,
		enterStandbyMode,
		enterWakeUpMode;

	// Since preferences is not persisted for HTML set defaults here for testing
	if (!$N.app.SystemUtil.isNative()) {
		$N.platform.system.Preferences.set($N.app.constants.PREF_ISINSTALLED, "true");
		$N.platform.system.Preferences.set($N.app.constants.PREF_LANGUAGE, "en_gb");
		$N.platform.system.Preferences.set($N.app.constants.PREF_UI_MIGRATION_STATUS, "true");
	}

	loadAppAndFinishInstaller = function () {
		log("loadAppAndFinishInstaller", "Enter");
		loadApp();
		if ($N.app.LaunchUtil.isSetupWizardRequired()) {
			finishInstaller();
		}
		log("loadAppAndFinishInstaller", "Exit");
	};

	getRatingData = function () {
		log("getRatingData", "Enter");
		var successCallback = function () {
		};
		$N.services.sdp.Ratings.cacheRatingTable($N.app.locale, successCallback);
		log("getRatingData", "Exit");
	};

	doBootstrap = function () {
		log("doBootstrap", "Enter");
		var contextServiceSuccess = function (context) {
				$N.app.LaunchUtil.setSDPAccountDetails(context);
				getRatingData();
			};
		$N.services.sdp.ServiceFactory.get("ContextService").getCurrentContext(this, contextServiceSuccess);
		$N.services.sdp.Signon.unregisterListener(doBootstrap);
		log("doBootstrap", "Exit");
	};

	enterStandbyMode = function () {
		log("enterStandbyMode", "Enter");
		// Force a UI 'reset' of sorts
		$N.app.ContextHelper.openContext("ZAPPER", {activationObject: {quietMode: true}});
		$N.app.fullScreenPlayer.stopPlayout(true);
		CCOM.UserAuth.resetUserProfile();
		log("enterStandbyMode", "Exit");
	};

	enterWakeUpMode = function () {
		log("enterWakeUpMode", "Enter");
		var isInstalled = $N.platform.system.Preferences.get($N.app.constants.PREF_ISINSTALLED) === "true";

		CCOM.UserAuth.getCurrentUserProfile();
		if ($N.app.NetworkUtil.isNetworkAvailable()) {
			CCOM.ControlCenter.HttpCache.clear();
		}
		if (!isInstalled) {
			$N.app.ContextHelper.openContext("FIRSTINSTALL");
		} else {
			// Need to retune to the Barker channel here as all of the players
			// will have been disconnected when we went into power management mode.
			$N.app.ChannelManager.tuneToBarkerChannel(true);
			$N.app.ContextHelper.openContext("PORTAL");
		}
		$N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK).setFeatureAvailabilityScheduler();
		if ($N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK).isAccountAvailable()) {
			$N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK).setSchedulerForTokenRenewal();
		}
		log("enterWakeUpMode", "Exit");
	};

	navigateToDefault = function (isInstallation) {
		log("navigateToDefault", "Enter");
		var logo = null,
			unLoadLogoAndNavigateToMenu = function () {
				log("unLoadLogoAndNavigateToMenu", "Enter");
				logo = document.getElementById("logo");
				if (logo) {
					logo.parentNode.removeChild(logo);
				}
				if (!isInstallation) {
					$N.app.ContextHelper.openContext("PORTAL");
				}
				log("unLoadLogoAndNavigateToMenu", "Enter");
			};

		$N.apps.util.EventManager.subscribe("SYSTEM_POWER_STANDBY", enterStandbyMode, Launch);
		$N.apps.util.EventManager.subscribe("SYSTEM_POWER_NORMAL", enterWakeUpMode, Launch);

		$N.apps.core.KeyInterceptor.registerInterceptor(GlobalKeysInterceptor.keyHandler, GlobalKeysInterceptor);
		$N.apps.core.KeyInterceptor.registerInterceptor(GlobalKeysInterceptor.defaultContextKeyHandler, GlobalKeysInterceptor);

		// RJV 2014-11-24 It's possible that depending on the power management required by NET that
		// this code is no longer correct. Leaving this marker here for the moment and will come
		// back here as this unfolds...
		$N.common.helper.FrontPanelManager.setFrontPanelDisplayToPreference();
		if (isInstallation) {
			$N.app.ContextHelper.openContext("FIRSTINSTALL", {navCompleteCallback: unLoadLogoAndNavigateToMenu});
		} else {
			// Only auto open the Portal and tune to the barker channel if the STB is
			// running in normal power mode.
			if ($N.common.helper.PowerManager.getCurrentPowerMode() === $N.common.helper.PowerManager.SYSTEM_POWER_NORMAL) {
//				$N.app.ChannelManager.tuneToBarkerChannel(true);    jrm
				// The Ekioh Garbage Collection occurring after contexts are loaded
				// occurs with a slightly different timing on minified builds.
				// This results in NETUI-4947 "After boot the portal takes a long time to load took 20 secs on one attempt and portal images do not appear on assiter tv until navigating down and up"
				// In order to ensure garbage is collected completely, before
				// Portal is activated, the following gc() call and setTimeout()
				// call are required. This may no longer be required when the
				// CACHE_LAZY_LOAD strategy is implemented for some contexts in R 2.1
				$N.app.MemoryUtil.collectGarbage();
				window.setTimeout(unLoadLogoAndNavigateToMenu, 1000);
			} else {
				logo = document.getElementById("logo");
				if (logo) {
					logo.parentNode.removeChild(logo);
				}
			}
		}

		log("navigateToDefault", "Exit");
	};

	navigateToInstallWizard = function () {
		log("navigateToInstallWizard", "Enter");
		var isInstallation = true;
		$N.apps.core.ContextManager.doPreCache();
		$N.app.UpgradeUtil.runNagraUIMigration();
		navigateToDefault(isInstallation);
		log("navigateToInstallWizard", "Exit");
	};

	finaliseInstallation = function () {
		log("finaliseInstallation", "Enter");
		$N.apps.core.KeyInterceptor.unregisterInterceptor(GlobalKeysInterceptor.keyHandler);
		$N.apps.core.KeyInterceptor.unregisterInterceptor(GlobalKeysInterceptor.defaultContextKeyHandler);
		loadAppImmediately = false;
		if ($N.app.NetworkUtil.isNetworkAvailable()) {
			checkEthernetConnection();
		} else {
			loadApp();
			finishInstaller();
		}
		log("finaliseInstallation", "Exit");
	};

	finishInstaller = function () {
		log("finishInstaller", "Enter");
		$N.common.helper.ScanManager.enableAutomaticScans();
		$N.platform.system.Preferences.set($N.app.constants.PREF_ISINSTALLED, "true");
		log("finishInstaller", "Exit");
	};

	onContextsLoadedListener = function () {
		if (contextsLoadedSubscriptionId) {
			$N.apps.util.EventManager.unSubscribe(contextsLoadedSubscriptionId);
			contextsLoadedSubscriptionId = null;
		}

		$N.app.ErrorMessage.registerListeners();
		$N.app.Version.updateSWVersion();

		navigateToDefault();
	};

	onEthernetUpListener = function () {
		$N.app.ErrorMessage.registerListeners();
	};

	/**
	 * Handles no ethernet on boot
	 * @method overrideEthernetStateChangeCallbacks
	 */
	overrideEthernetStateChangeCallbacks = function () {
		log("overrideEthernetStateChangeCallbacks", "Enter");
		$N.platform.system.Network.StateChange.setEthUpCallBack(onEthernetUpListener);
		log("overrideEthernetStateChangeCallbacks", "Exit");
	};

	/**
	 * checks progress according to percentage of loaded contexts.
	 * @method checkLoadingComplete
	 * @private
	 * @param {Number} loadedContexts
	 * @param {Number} totalContexts
	 */
	checkLoadingComplete = function (loadedContexts, totalContexts) {
		if (loadedContexts === totalContexts) {
			$N.apps.util.EventManager.fire("contextsLoaded");
		}
	};

	/**
	 * sets progress bar according to percentage of loaded contexts.
	 * @method showProgress
	 * @private
	 * @param {Number} loadedContexts
	 * @param {Number} totalContexts
	 */
	showProgress = function (loadedContexts, totalContexts) {
		// As we load a context switch which dot is highlighted
		switch (loadedContexts % 3) {
		case 0:
			view.logo.bootProgress1Label.setCssClass("splashScreenProgressHighlight");
			view.logo.bootProgress2Label.setCssClass("splashScreenProgress");
			view.logo.bootProgress3Label.setCssClass("splashScreenProgress");
			break;

		case 1:
			view.logo.bootProgress1Label.setCssClass("splashScreenProgress");
			view.logo.bootProgress2Label.setCssClass("splashScreenProgressHighlight");
			view.logo.bootProgress3Label.setCssClass("splashScreenProgress");
			break;

		case 2:
			view.logo.bootProgress1Label.setCssClass("splashScreenProgress");
			view.logo.bootProgress2Label.setCssClass("splashScreenProgress");
			view.logo.bootProgress3Label.setCssClass("splashScreenProgressHighlight");
			break;
		}

		// Hack to force screen redraw in Webkit (otherwise dot sequence will be inconsistent)
		view.logo.bootProgress1Label.hide();
		this._dummy = view.logo.bootProgress1Label.getRootElement().offsetHeight;
		view.logo.bootProgress1Label.show();

		checkLoadingComplete(loadedContexts, totalContexts);
	};

	/**
	 * Called once STB has successfully signed on
	 * @method loadApp
	 * @private
	 */
	loadApp = function () {
		log("loadApp", "Enter");
		if (!isAppLoaded) {
			$N.app.LaunchUtil.addContexts();
			if (loadAppImmediately) {
				$N.apps.core.ContextManager.setPreCacheProgressCallback(showProgress);
			} else {
				$N.apps.core.ContextManager.setPreCacheProgressCallback(checkLoadingComplete);
			}
			$N.app.LaunchUtil.continueNormalInitialisation(view);
			isAppLoaded = true;
		} else {
			// Added fire of contextsLoaded event here, as it otherwise does not fire after a first time install
			// The event will cause a call to navigateToDefault() which is desired too
			$N.apps.util.EventManager.fire("contextsLoaded");
		}
		log("loadApp", "Exit");
	};

	/**
	 * Check for newtork connection and run callback on success
	 * @method checkEthernetConnection
	 * @private
	 */
	checkEthernetConnection = function () {
		log("checkEthernetConnection", "Enter");

		// Force the DOCSIS modem to re-aquire its IP connection details.
		$N.platform.system.Network.renewAddress(CCOM.IpNetwork.INTERFACE_TYPE_DOCSIS);

		if ($N.app.NetworkUtil.isNetworkAvailable()) {
			loadAppAndFinishInstaller();
		} else {
			overrideEthernetStateChangeCallbacks();
			loadApp();
		}
		log("checkEthernetConnection", "Exit");
	};

	/**
	 * @method removeLoadingImage
	 * @private
	 */
	function removeLoadingImage() {
		var loadingImage = document.getElementById("splashLoadingImage");
		if (loadingImage.parentNode) {
			loadingImage.parentNode.removeChild(loadingImage);
		}
	}

	// public API

	return {
		load: function () {
			// Force CCOM to be initialised before we do anything else.
			document.getElementById("CCOM");

			//Load the language bundle
			$N.apps.core.Language.loadLanguageBundle(Launch.init, "customise/resources/", null, true);
		},

		init: function () {
			// Configure the JSFW log level
			$N.apps.core.Log.Config.configure($N.app.Config.getConfigValue("log.config"));
			$N.app.LaunchUtil.basicInitialisation(view);
			contextsLoadedSubscriptionId = $N.apps.util.EventManager.subscribe("contextsLoaded", onContextsLoadedListener, Launch);
			$N.app.LaunchUtil.initialiseVOD();
			$N.app.LaunchUtil.initialiseMDS();
			$N.app.LaunchUtil.initialiseSDP();
			$N.apps.core.ContextManager.addContext("FIRSTINSTALL", "apps/firstInstall/view/firstInstall.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false);
			if ($N.app.LaunchUtil.isSetupWizardRequired()) {
				navigateToInstallWizard();
				return;
			}
			checkEthernetConnection();
//jrm			removeLoadingImage();
		},
		finaliseInstallation: finaliseInstallation
	};

}());

/*
 * The code below is a workaround for getURL which is an Ekioh call and so
 * doesn't work in a HTML environment
 */
var getURL = getURL || function (url, onSuccess) {
	var status = {},
		xhttp = new XMLHttpRequest();
	xhttp.open("GET", url, false);
	xhttp.send();
	status.success = true;
	status.content = xhttp.responseText;
	onSuccess(status);
};

