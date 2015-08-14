/*global OnDemandPlayer, HLSPlayer, PvrPlayer, TimeShiftPlayer, AudioPlayer*/
/**
 * Media Player.
 * @module media-player
 * @class MediaPlayer
 * #depends OnDemandPlayer.js
 * #depends PvrPlayer.js
 * #depends TimeShiftPlayer.js
 * #depends AudioPlayer.js
 * #depends MusicPlayer.js
 * #depends VideoPlayerUSBDLNA.js
 */

/**
 * MediaPlayer is an application that can be used for video/audio playback
 * it runs as a context and can be overlaid over other applications. The
 * activate method receives an object describing the type of content and
 * the appropriate player/banner is used.
 * @class MediaPlayer
 * @static
 * @param {Object} $N namespace entry point
 */
var MediaPlayer = (function ($N) {

	var log = new $N.apps.core.Log("MediaPlayer", "MediaPlayer"),
		view = {},
		onDemandPlayer = null,
		hlsPlayer = null,
		pvrPlayer = null,
		timeShiftPlayer = null,
		audioPlayer = null,
		activationParams = {},
		customKeyHandler = null,
		activePlayer = null,
		lastActivePlayer = null,
		imageViewer = null,
		musicPlayer = null,
		videoPlayer = null,
		PVRSubscriptionIds = [];

	/**
	 * Informs ContextManager that this context is flagged for
	 * removal from the navigation stack
	 * @method flagContextForRemoval
	 * @param {Boolean} isToBeRemoved
	 * @private
	 */
	function flagContextForRemoval(isToBeRemoved) {
		log("flagContextForRemoval", "Enter & Exit: " + isToBeRemoved);
		MediaPlayer._isFlaggedForRemoval = isToBeRemoved;
	}

	/**
	 * @method PVRStatusUpdateListener
	 * @param {Object} status object for PVR
	 * @private
	 */
	function PVRStatusUpdateListener(status) {
		log("PVRStatusUpdateListener", "Enter");
		var isToBeRemoved = !$N.app.PVRCapability.isPVREnabled(true);
		flagContextForRemoval(isToBeRemoved);
		log("PVRStatusUpdateListener", "Exit");
	}

	/**
	 * @method subscribeToPVRStatusUpdateEvent
	 * @private
	 */
	function subscribeToPVRStatusUpdateEvent() {
		if (PVRSubscriptionIds.length === 0) {
			// we are adding these subscribe events to an array as we do not specifically need to know the Ids
			PVRSubscriptionIds = $N.app.PVRCapability.subscribeToPVRCapabilityEvent(PVRStatusUpdateListener, PVRStatusUpdateListener, MediaPlayer);
		}
	}

	/**
	 * @method unsubscribeFromPVRStatusUpdateEvent
	 * @private
	 */
	function unsubscribeFromPVRStatusUpdateEvent() {
		PVRSubscriptionIds = $N.app.PVRCapability.unSubscribeFromPVRCapabilityEvent(PVRSubscriptionIds);
	}

	/* Public API */
	return {
		/**
		 * Entry point of the application for the SVG onload event
		 * @method load
		 */
		load: function () {
			log("load", "Enter");
			$N.gui.ResolutionManager.initialiseContext(document);
			$N.apps.core.Language.importLanguageBundleForObject(MediaPlayer, MediaPlayer.init, "apps/mediaPlayer/common/", "LanguageBundle.js", null, window);
			log("load", "Exit");
		},

		/**
		 * Application lifecycle initialisation method to create the view
		 * @method init
		 */
		init: function () {
			log("init", "Enter");
			$N.gui.FrameworkCore.loadGUIFromXML("apps/mediaPlayer/view/mediaPlayer.xml", document.getElementById("content"), view, window);
			onDemandPlayer = new $N.app.players.OnDemandPlayer(MediaPlayer, view.pvrPlaybackBanner, view.videoFullScreen, view.loadingBar);
			onDemandPlayer.initialise();
			hlsPlayer = new $N.app.players.HLSPlayer(MediaPlayer, view.playbackBanner, view.videoFullScreen);
			hlsPlayer.initialise();
			pvrPlayer = new $N.app.players.PvrPlayer(MediaPlayer, view.pvrPlaybackBanner, view.videoFullScreen, view.parentalLockIcon);
			pvrPlayer.initialise();
			timeShiftPlayer = new $N.app.players.TimeShiftPlayer(MediaPlayer, view.timeShiftBanner, view.videoFullScreen);
			timeShiftPlayer.initialise();
			audioPlayer = new $N.app.players.AudioPlayer(MediaPlayer, view.audioBanner, view.videoFullScreen);
			audioPlayer.initialise();
			musicPlayer = new $N.app.players.MusicPlayer(MediaPlayer, view.mediaPlaybackBanner, view.thumbnailImage, view.videoFullScreen);
			musicPlayer.initialise();
			videoPlayer = new $N.app.players.VideoPlayerUSBDLNA(MediaPlayer, view.mediaPlaybackBanner, view.videoFullScreen, view.loadingBar);
			videoPlayer.initialise();
			imageViewer = view.imageViewer;
			imageViewer.initialise();
			view.backLabelContainer.backLabel.setText(MediaPlayer.getString("pressBack"));
			view.backLabelContainer.backLabel.setSpanCssClass("green");
			view.backLabelContainer.backLabel.setSpanOnText(MediaPlayer.getString("pressBackHighlight"));
			$N.apps.core.ContextManager.initialisationComplete(MediaPlayer);
			log("init", "Exit");
		},

		showBackLabel: function () {
			view.backLabelContainer.show();
		},

		hideBackLabel: function () {
			view.backLabelContainer.hide();
		},

		/**
		 * Application lifecycle activation method to draw the view.
		 * receives an object with a minimum of on 1 property of name type
		 * to denote the content type (currently ASSET only). All other properties
		 * relate specifically to the player in use .If no activationObject is passed in the
		 * last known one is used.
		 * @method activate
		 * @param {Object} activationObject
		 */
		activate: function (activationObject) {
			log("activate", "Enter");
			var banner;
			activationParams = activationObject || activationParams;
			activationParams.context = activationParams.context || MediaPlayer.toString();
			customKeyHandler = activationParams.customKeyHandler;
			$N.app.ClockDisplay.hide();
			$N.app.BrandHelper.hideAll();
			$N.app.MessageUtil.activateMessageIndicator(true);
			$N.app.fullScreenPlayer.setBufferIcon(view.bufferingIcon);
			switch (activationParams.type) {
			case "ASSET":
				activePlayer = onDemandPlayer;
				$N.common.helper.FrontPanelManager.setFrontPanelDisplay($N.app.constants.FRONTPANEL_DISPLAY_MODES.VOD);
				break;
			case "CATCHUP":
				activePlayer = onDemandPlayer;
				$N.common.helper.FrontPanelManager.setFrontPanelDisplay($N.app.constants.FRONTPANEL_DISPLAY_MODES.CATCHUP_STARTOVER, activationObject.contentObj.serviceId);
				break;
			case "STARTOVER":
				activePlayer = onDemandPlayer;
				banner = view.timeShiftBanner;
				$N.common.helper.FrontPanelManager.setFrontPanelDisplay($N.app.constants.FRONTPANEL_DISPLAY_MODES.CATCHUP_STARTOVER, activationObject.contentObj.serviceId);
				break;
			case "HLS":
				activePlayer = hlsPlayer;
				break;
			case "PVR":
				activePlayer = pvrPlayer;
				$N.common.helper.FrontPanelManager.setFrontPanelDisplay($N.app.constants.FRONTPANEL_DISPLAY_MODES.PVR_PLAY_BACK); //Show time on FP when active player is PVR player.
				subscribeToPVRStatusUpdateEvent();
				break;
			case "TIMESHIFT":
				activePlayer = timeShiftPlayer;
				break;
			case "AUDIO":
				activePlayer = audioPlayer;
				break;
			case "PHOTO":
				activePlayer = imageViewer;
				banner = view.imageBanner;
				break;
			case "MUSIC":
				activePlayer = musicPlayer;
				break;
			case "VIDEO":
				activePlayer = videoPlayer;
				break;
			default:
				activePlayer = lastActivePlayer;
			}
			activePlayer.activate(activationParams, banner);
			log("activate", "Exit");
		},

		/**
		 * Application lifecycle passivation method to hide the view
		 * @method passivate
		 */
		passivate: function () {
			log("passivate", "Enter");
			lastActivePlayer = activePlayer;
			$N.app.fullScreenPlayer.setBufferIconToLive();
			$N.app.MessageUtil.deactivateMessageIndicator();
			activePlayer.passivate();
			$N.common.helper.FrontPanelManager.setFrontPanelDisplay($N.app.constants.FRONTPANEL_DISPLAY_MODES.DEFAULT);
			if (activePlayer === pvrPlayer) {
				unsubscribeFromPVRStatusUpdateEvent();
			}
			log("passivate", "Exit");
		},

		/** Unloads the application from Memory
		 * @method unload
		 */
		unload: function () {
			$N.apps.core.Language.unloadLanguageBundle("apps/mediaPlayer/common/");
		},

		/**
		 * Application lifecycle focus method to indicate user input enabled
		 * @method focus
		 */
		focus: function () {
			$N.app.MessageUtil.activateMessageIndicator(true);
			if (activePlayer.focus) {
				activePlayer.focus();
			}
		},

		/**
		 * Application lifecycle focus method to indicate user input disabled
		 * @method defocus
		 */
		defocus: function () {
			$N.app.MessageUtil.deactivateMessageIndicator();
			if (activePlayer.defocus) {
				activePlayer.defocus();
			}
		},

		/**
		 * Application lifecycle method to return the context name
		 * @method toString
		 * @return {String} The main menu context name.
		 */
		toString: function () {
			return "MEDIAPLAYER";
		},

		/**
		 * Main keyHandler method
		 * @method keyHandler
		 * @param {String} key
		 * @return {Boolean} True if the key press was handled; false if the key press
		 * was not handled.
		 */
		keyHandler: function (key) {
			log("keyHandler", "Enter");
			var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
				handled = false;
			if (customKeyHandler) {
				handled = customKeyHandler(key);
			}
			if (!handled) {
				log("keyHandler", "Exit 1");
				return activePlayer.keyHandler(key);
			}
			log("keyHandler", "Exit 2");
			return handled;
		}

	};
}(window.parent.$N));
