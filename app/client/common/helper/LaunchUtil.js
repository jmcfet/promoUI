/*global EPGUtil, GenreUtil, GlobalKeysInterceptor*/
/**
 * Helper class for application Launch
 *
 * @class $N.app.LaunchUtil
 * @author rhill
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	$N.app = $N.app || {};
	$N.app.LaunchUtil = (function ($N) {

		var log = new $N.apps.core.Log("Helper", "LaunchUtil"),
			_isReleaseBuild;

		return {

			/**
			 * @method setSdpAccountDetails
			 * @param {Object} account
			 */
			setSDPAccountDetails: function (account) {
				log("setSdpAccountDetails", "Enter");
				$N.app.userUid = account.userUid;
				$N.app.accountUid = account.accountUid;
				$N.app.locale = account.locale;
				log("setSdpAccountDetails", "Exit");
			},

			/**
			 * @method basicInitialisation
			 * @param {Object} view
			 */
			basicInitialisation: function (view) {
				log("basicInitialisation", "Enter");
				var socialAccountObject;
				$N.app.epgUtil = new EPGUtil();
				$N.app.genreUtil = new GenreUtil();

				$N.common.helper.PowerManager.initialise();

				this.initialiseEvents();

				$N.app.Config.initialise();

				$N.app.HDMIManager.initialise();
				$N.app.AudioManager.initialise();
				$N.app.MoCAManager.initialise();

				$N.platform.system.Network.StateChange.registerListener();
				$N.app.NetworkUtil.setWiredInterfaceName();

				this.initialiseFrameworkModules();
				this.initialiseLanguage();

				// Create the view objects
				$N.gui.FrameworkCore.loadGUIFromXML("launch.xml", document.getElementById("content"), view);

				$N.app.BrowserManager.initialise(document, view);

				$N.app.PVRUtil.initialiseRemoteAccess(view.remoteAccessIndicator);
				view.logo.bootMessageTextArea.setText($N.app.LaunchUtil.getString("bootMessage"));

				$N.gui.Label.prototype._mimicLabel = view.mimicLabel;
				$N.gui.TextArea.prototype._mimicTextArea = view.mimicTextArea;

				this.initialiseApplicationModules(view);

				$N.gui.ResolutionManager.initialiseContext(document, "customise/resources/css/" + $N.gui.Image.resolution + "/common.css");
				$N.apps.core.ContextManager.init($N.gui.ResolutionManager.getResDimensions());

				$N.apps.core.KeyInterceptor.init(new $N.platform.input.BaseKeyMap(), null, $N.platform.system.Device.getManufacturer(), $N.platform.system.Device.getModel(), 0, true);

				//this.initialiseFullScreenPlayer(view);      jrm
				//this.initialiseSmallPlayer(view);

				//$N.app.ConditionalAccessCAK73 = new $N.app.ConditionalAccessNagraCAK73(new $N.app.CAKALMEHandler());
				//$N.app.SystemUtil.setAndRefreshStandbyTimer();

				//$N.gui.SmallVideoArea = view.smallVideoGroup;
				//$N.gui.SmallVideoArea.hide();

				//$N.common.helper.ScanManager.initialise();

				//$N.app.ChannelManager.initialise();

				$N.app.NowMappingUtil.init();

				// set a garbage collection interval
				$N.app.MemoryUtil.setOrUpdateGarbageCollectInterval();
				socialAccountObject = $N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK);
				socialAccountObject.setFeatureAvailabilityScheduler();
				if (socialAccountObject.isAccountAvailable()) {
					socialAccountObject.setSchedulerForTokenRenewal();
				}
				$N.app.ApplicationLauncher.initialise();

				_isReleaseBuild = ($N.app.Config.getConfigValue("build.mode") === "RELEASE");
				log("basicInitialisation", "Exit");
			},

			/**
			 * @method initialiseLanguage
			 */
			initialiseLanguage: function () {
				log("initialiseLanguage", "Enter");
				var language = $N.platform.system.Preferences.get($N.app.constants.PREF_LANGUAGE);
				if (language && (language === "en_gb" || language === "pt_br")) {
					$N.apps.core.Language.setLocale(language);
					$N.apps.core.Language.refreshLanguageBundles();
				}
				log("initialiseLanguage", "Exit");
			},

			/**
			 * @method initialiseFullScreenPlayer
			 * @param {Object} view
			 */
			initialiseFullScreenPlayer: function (view) {
				log("initialiseFullScreenPlayer", "Enter");
				$N.app.fullScreenPlayer = new $N.app.PlayoutManager(view.fullScreenPlayer.fullScreenVideo.getRootElement());
				$N.app.fullScreenPlayer.initialise(view);
				if ($N.platform.system.Preferences.get($N.app.constants.PREF_PRM_ENABLED) === "true") {
					$N.app.ca = new $N.platform.ca.ConditionalAccessNagraCAK72();
					$N.app.ca.setPlayer($N.app.fullScreenPlayer);
				}
				log("initialiseFullScreenPlayer", "Exit");
			},

			/**
			 * @method initialiseSmallPlayer
			 * @param {Object} view
			 */
			initialiseSmallPlayer: function (view) {
				log("initialiseSmallPlayer", "Enter");
				$N.app.smallScreenPlayer = new $N.app.PIPPlayer(view.smallVideoGroup.smallScreenVideo.getRootElement());
				$N.app.smallScreenPlayer.initialise(view);
				log("initialiseSmallPlayer", "Exit");
			},

			/**
			 * @method initialiseVOD
			 */
			initialiseVOD: function () {
				log("initialiseVOD", "Enter");
				var preferences = $N.platform.system.Preferences,
					constants = $N.app.constants,
					sdp = $N.services.sdp;
				sdp.VOD.initialise($N.app.accountUid, $N.app.userUid, null, true, preferences.get(constants.PREF_METADATA_LANGUAGE), null);
				$N.app.MDSUtil.init();
				log("initialiseVOD", "Exit");
			},

			/**
			 * @method initialiseMDS
			 */
			initialiseMDS: function (forceInitialise) {
				log("initialiseMDS", "Enter");
				var preferences = $N.platform.system.Preferences,
					constants = $N.app.constants,
					sdp = $N.services.sdp,
					MDS_REQUEST_TIMEOUT = 30000;//FIXME: It should be 10,000 ms only. At present MDS response is very slow, hence as per Evan's suggestion we have increased to 30s.

				sdp.MetadataService.initialise(
					sdp.BaseService.getServerURL(),
					null,
					preferences.get(constants.PREF_METADATA_BASE_URI),
					preferences.get(constants.PREF_METADATA_PROVIDER),
					MDS_REQUEST_TIMEOUT,
					preferences.get(constants.PREF_METADATA_LANGUAGE),
					null,
					null,
					preferences.get(constants.PREF_METADATA_SEARCH_URI),
					false,
					false,
					forceInitialise
				);
				log("initialiseMDS", "Enter");
			},

			/**
			 * @method initialiseSDP
			 */
			initialiseSDP: function () {
				log("initialiseSDP", "Enter");
				var constants = $N.app.constants,
					preferences = $N.platform.system.Preferences;

				$N.platform.btv.EPG.initialise({
					dataSources: [$N.platform.btv.EPG.DATA_SOURCES.SDP],
					useRAMCache: true,
					cacheEvents: false,
					extendedIPSchedule: true,
					cacheExpiryTime: preferences.get(constants.PREF_EPG_CACHE_EXPIRY),
					cacheType: $N.platform.btv.EPG.CACHE_TYPES.RAM
				});

				$N.services.sdp.EPG.initialise($N.app.accountUid, $N.app.locale);
				log("initialiseSDP", "Exit");
			},

			/**
			 * @method initialiseEvents
			 */
			initialiseEvents: function () {
				log("initialiseEvents", "Enter");
				$N.apps.util.EventManager.create("settingsUpdated");
				$N.apps.util.EventManager.create("contextsLoaded");
				$N.apps.util.EventManager.create("zapperOpened");
				$N.apps.util.EventManager.create("zapperClosed");
				$N.apps.util.EventManager.create("channelChanged");
				$N.apps.util.EventManager.create("menuLanguageChanged");
				$N.apps.util.EventManager.create("allMailsRead");
				$N.apps.util.EventManager.create("oneMailRead");
				$N.apps.util.EventManager.create("contextChanged");
				$N.apps.util.EventManager.create("usbInterfaceStatus");
				$N.apps.util.EventManager.create("PVREnabled");
				$N.apps.util.EventManager.create("PVRDisabled");
				$N.apps.util.EventManager.create("WHPVREnabled");
				$N.apps.util.EventManager.create("WHPVRDisabled");
				$N.apps.util.EventManager.create("VODEnabled");
				$N.apps.util.EventManager.create("VODDisabled");
				$N.apps.util.EventManager.create("favouritesToggled");
				$N.apps.util.EventManager.create("genericReminderJobUpdated");
				$N.apps.util.EventManager.create("favouritesListUpdated");
				$N.apps.util.EventManager.create("usbMediaPlaybackEnabled");
				$N.apps.util.EventManager.create("usbContentLoaded");
				$N.apps.util.EventManager.create("usbMediaPlaybackDisabled");
				$N.apps.util.EventManager.create("audioCapabilitiesUpdated");
				$N.apps.util.EventManager.create("MediaPlaybackFeatureStatusUpdated");
				$N.apps.util.EventManager.create("usageIdChanged");
				$N.apps.util.EventManager.create("caPPVAccessDenied");
				$N.apps.util.EventManager.create("MoCAEnabled");
				$N.apps.util.EventManager.create("MoCADisabled");
				$N.apps.util.EventManager.create("PIPEnabled");
				$N.apps.util.EventManager.create("PIPDisabled");
				$N.apps.util.EventManager.create("StartOverEnabled");
				$N.apps.util.EventManager.create("StartOverDisabled");
				$N.apps.util.EventManager.create("CatchUpDisabled");
				$N.apps.util.EventManager.create("CatchUpEnabled");
				$N.apps.util.EventManager.create("HideNoSignalDialogue");
				$N.apps.util.EventManager.create("pipActivated");
				$N.apps.util.EventManager.create("pipDeActivated");
				$N.apps.util.EventManager.create("changePip");
				$N.apps.util.EventManager.create("swapPip");
				log("initialiseEvents", "Exit");
			},

			/**
			 * @method initialiseFrameworkModules
			 */
			initialiseFrameworkModules: function () {
				log("initialiseFrameworkModules", "Enter");
				var mdsAddress;
				if ($N.app.Config.getConfigValue("mds.developer.mode") === "off") {
					mdsAddress = $N.platform.system.Preferences.get("/network/siconfig/CustomDescriptorTags/netMdsServer", true);
				} else {
					mdsAddress = $N.app.Config.getConfigValue("mds.developer.server") + "/net";
				}
				// The JSFW code doesn't like it if we use the 'http' prefix for the server
				// address so this should be removed before configuration begins. This is an
				// issue because the information put into the custom SI descriptor by NET
				// includes this prefix information.
				if (mdsAddress && mdsAddress.slice(0, 7) === "http://") {
					mdsAddress = mdsAddress.slice(7);
				}
				$N.platform.system.Preferences.initialise();
				$N.platform.output.AV.initialise();
				$N.gui.ResolutionManager.initialiseResolution();
				$N.common.helper.ScanManager.initialise();
				$N.app.DVBScanUtil.initialise();
				$N.platform.btv.Favourites.init();
				$N.services.sdp.BaseService.initialise(mdsAddress, null, null, null, $N.platform.system.Preferences.get($N.app.constants.PREF_SDP_PATH));
				log("initialiseFrameworkModules", "Exit");
			},

			/**
			 * @method initialiseApplicationModules
			 * @param {Object} view
			 */
			initialiseApplicationModules: function (view) {
				log("initialiseApplicationModules", "Enter");
				$N.common.helper.Analytics.initialise();
				$N.app.ErrorMessage.initialise();
				$N.app.PVRCapability.initialise();
				$N.app.HotPlug.initialise();
				$N.app.UsbBrowserHelper.initialise();
				$N.app.DlnaHelper.initialise();
				$N.app.DialogueHelper.initialise();
				$N.app.ParentalControlUtil.initialise();
				$N.app.BrandHelper.initialise(view.branding);
				$N.app.CatchUpHelper.initialise(view.commonLoadingBar);
				$N.app.StartOverHelper.initialise(view.commonLoadingBar);
				$N.app.DateTimeUtil.initialise();
	//			$N.app.ClockDisplay.initialise(view.clockContainer);   jrm
				$N.app.MessageUtil.initialise(view.messageIndicator);
				$N.app.ErrorMessage.initialise();
				$N.app.DataMappers.initialise();
				$N.app.FormatUtils.initialise();
				$N.app.FolderUtil.initialise();
				$N.app.FavouritesUtil.initialise();
				$N.app.SettingsAPI.initialise();
				$N.app.TracksUtil.initialise();
				$N.app.SystemUtil.initialise();
				$N.common.helper.FrontPanelManager.initialise();
				$N.app.SignalInfoUtil.initialise();
				$N.app.FeatureManager.initialise();
				log("initialiseApplicationModules", "Exit");
			},

			/**
			 * @method continueNormalInitialisation
			 * @param {String} mode
			 * @param {Object} view
			 */
			continueNormalInitialisation: function (view) {
				log("continueNormalInitialisation", "Enter");
				if (!$N.platform.system.Preferences.get($N.app.constants.PREF_UI_MIGRATION_STATUS)) {//We have to run this only when the migration process is not done before.
					$N.app.UpgradeUtil.runMigrationProcess();
				}
				$N.app.UpgradeUtil.runNagraUIMigration();
				if ($N.app.SystemUtil.isNative()) {
					$N.platform.btv.ConflictManager = new $N.platform.btv.ConflictManager($N.platform.btv.PVRManager);
					$N.platform.btv.WHPVRManager.init();
					$N.platform.btv.PVRManager.init($N.platform.btv.ConflictManager);
				}

				$N.app.VODHelper.initialise();
				$N.platform.ca.ParentalControl.initialise();
				$N.platform.ca.ParentalControl.enableAuthentication();
				$N.platform.ca.PINHandler.init();
				$N.apps.dialog.PinDialog.GUITemplateObject = $N.gui.PinDialog;
				$N.app.VolumeControl.initialise(view.volumeContainer);
				$N.app.Reminders.initialise();
				$N.app.AutoTuneHelper.initialise();
				$N.app.Conflicts.initialise();
				$N.platform.btv.ChannelCategories.initialise();
				$N.app.PVRUtil.initialise();
				$N.app.SettingsPortalData.initialise();
				$N.app.FavouritesUtil.initialise();
				$N.app.SettingsAPI.initialiseAVOptions();
				$N.app.MusicCategoriesData.initialise();
				if ($N.app.EnvironmentUtil.isIPEnabled()) {
					$N.platform.media.UPnP.init();
				}
				log("continueNormalInitialisation", "Exit");
			},

			/**
			 * @method addContexts
			 * @param {String} mode
			 */
			addContexts: function () {
				log("addContexts", "Enter");
				var IS_DEFAULT_CONTEXT = true,
					IS_PLAYBACK_CONTEXT = true;
				$N.apps.core.ContextManager.addContext("ZAPPER", "apps/zapper/view/zapper.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, IS_DEFAULT_CONTEXT);
				$N.apps.core.ContextManager.addContext("PORTAL", "apps/portal/view/portal.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false);
				//$N.apps.core.ContextManager.addContext("LISTGUIDE", "apps/listGuide/view/listGuide.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false);
				//$N.apps.core.ContextManager.addContext("SEARCH", "apps/search/view/search.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false);
				//$N.apps.core.ContextManager.addContext("SETTINGS", "apps/settings/view/settings.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false);
				//$N.apps.core.ContextManager.addContext("MEDIABROWSER", "apps/mediaBrowser/view/mediabrowser.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false);
				//$N.apps.core.ContextManager.addContext("MINIGUIDE", "apps/miniGuide/view/miniGuide.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false);
				//$N.apps.core.ContextManager.addContext("MEDIAPLAYER", "apps/mediaPlayer/view/mediaPlayer.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false, null, null, null, null, null, null, IS_PLAYBACK_CONTEXT);
				$N.apps.core.ContextManager.addContext("NOW", "apps/now/view/now.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false);
				//$N.apps.core.ContextManager.addContext("LIBRARY", "apps/library/view/library.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false);
				//$N.apps.core.ContextManager.addContext("SYNOPSIS", "apps/synopsis/view/synopsis.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false);
				//$N.apps.core.ContextManager.addContext("OPTIONS", "apps/options/view/options.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false);
				//$N.apps.core.ContextManager.addContext("AGORA", "apps/agora/view/agora.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false);
				//$N.apps.core.ContextManager.addContext("MOSAIC", "apps/mosaic/view/mosaic.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false);
				//$N.apps.core.ContextManager.addContext("MUSIC", "apps/music/view/music.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false);
				//$N.apps.core.ContextManager.addContext("CHANNELSUBSCRIPTION", "apps/channelSubscription/view/channelSubscription.html", $N.apps.core.ContextManager.CACHE_PRE_CACHE, false);

				// This next check is a temporary workaround whilst we decide how best to deal with
				// migrating the entire application to HTML. So, for now, these applications will
				// only be loaded in SVG mode.
				//$N.apps.core.ContextManager.addContext("HTMLAPPS", "apps/htmlapps/view/htmlapps.html", $N.apps.core.ContextManager.CACHE_LAZY_LOAD, false);
				//$N.apps.core.ContextManager.addContext("SMARTCARD", "apps/smartcard/view/smartcard.html", $N.apps.core.ContextManager.CACHE_LAZY_LOAD, false);
				$N.apps.core.ContextManager.doPreCache();
				log("addContexts", "Exit");
			},

			/**
			 * @method isSetupWizardRequired
			 * @return {Boolean}
			 */
			isSetupWizardRequired: function () {
				var isWizardRequired = $N.platform.system.Preferences.get($N.app.constants.PREF_ISINSTALLED) !== "true";
				log("isSetupWizardRequired", "Enter & Exit - isWizardRequired = " + isWizardRequired);
				return isWizardRequired;
			},

			/**
			 * @method isReleaseBuild
			 * @return {Boolean} isReleaseBuild
			 */
			isReleaseBuild : function () {
				return _isReleaseBuild;
			}
		};

	}($N));
	$N.apps.core.Language.adornWithGetString($N.app.LaunchUtil);

}($N || {}));
