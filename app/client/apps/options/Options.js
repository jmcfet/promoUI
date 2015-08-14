/**
 * A horizontal Options menu which can be overlaid on other Contexts
 * @module Options
 * @class Options
 */
var Options = (function () {

	var $N = window.parent.$N,
		log = new $N.apps.core.Log("Options", "Options"),
		view = {},
		optionsMenu = null,
		entity = null,
		entityType = null,
		isEntityPlaying = false,
		isFavourite = false,
		optionIconsPath = "../../../customise/resources/images/%RES/icons/optionIcons/",
		menuIndex = 0,
		uiRefreshCallback = null,
		backgroundId = null,
		pinHelper = new $N.app.PinHelper(null, null, null, null, $N.app.constants.PIN_DIALOG_SHOW_TIME, false),
		// menu items
		MAIL = {action: "MAIL", url: optionIconsPath + "mail_icon.png", title: "", active: true},
		INFO = {action: "INFO", url: optionIconsPath + "info_icon.png", title: "", active: true},
		LIKE = {action: "LIKE", url: optionIconsPath + "like_icon.png", title: "", active: true},
		FAVOURITE = {action: "FAVOURITE", url: optionIconsPath + "favorite_icon.png", title: "", active: true, command: "add"},
		RERUNS = {action: "RERUNS", url: optionIconsPath + "reprises_icon.png", title: "", active: true},
		STARTOVER = {action: "STARTOVER", url: optionIconsPath + "replay.png", title: "", active: true},
		RECORD = {action: "RECORD", url: optionIconsPath + "record_icon.png", title: "", active: true},
		CATCHUP = {action: "CATCHUP", url: optionIconsPath + "catchup_icon.png", title: "", active: true},
		REMINDER = {action: "REMINDER", url: optionIconsPath + "catchup_icon.png", title: "", active: true},
		BACK = {action: "BACK", url: optionIconsPath + "back_icon.png", title: "", active: true},
		FACEBOOK_POST = {action: "FACEBOOK_POST", url: optionIconsPath + "fb_icon.png", title: "", active: true},
		NOW = {action: "NOW", url: optionIconsPath + "now_icon.png", title: "", active: true},
		PPV = {action: "PPV", url: optionIconsPath + "rent_icon.png", title: "", active: true},
		PIP = {action: "PIP", url: optionIconsPath + "updateStartPip.png", title: "", active: true},
		CHANGE_PIP = {action: "CHANGE_PIP", url: optionIconsPath + "updateStartPip.png", title: "", active: true},
		SWAP_PIP = {action: "SWAP_PIP", url: optionIconsPath + "swapPipIcon.png", title: "", active: true},
		_isInitiatedByZapper = false;//flag to check if menu options are viewed through zapper context.

	/*
	 * Private methods
	 */

	/**
	 * @method setEntityFromActivationContext
	 * @param {Object} context
	 * @private
	 */
	function setEntityFromActivationContext(context) {
		if (context && context.data && context.type) {
			entity = context.data;
			entityType = context.type;
			isEntityPlaying =  $N.app.EventUtil.isEventPlayingNow(entity);
		}
	}

	/**
	 * Sets the title for each menu option from the language bundle
	 * @method importLanguageBundle
	 * @private
	 */
	function importLanguageBundle() {
		MAIL.title = Options.getString("menuMail");
		INFO.title = Options.getString("menuInfo");
		LIKE.title = Options.getString("menuLike");
		FAVOURITE.title = Options.getString("menuFavourite");
		RERUNS.title = Options.getString("menuReruns");
		STARTOVER.title = Options.getString("menuStartover");
		RECORD.title = Options.getString("menuRecord");
		CATCHUP.title = Options.getString("menuCatchup");
		REMINDER.title = Options.getString("menuReminderSchedule");
		BACK.title = Options.getString("menuBack");
		FACEBOOK_POST.title = Options.getString("menuFacebookPost");
		NOW.title = Options.getString("menuNow");
		PPV.title = Options.getString("menuPPV");
		PIP.title = Options.getString("menuPIPStart");
		CHANGE_PIP.title = Options.getString("menuChangePip");
		SWAP_PIP.title = Options.getString("menuSwapPip");
	}

	/**
	 * @method onRecordingFailed
	 * @private
	 * @param {Array} tasks an array of Task Objects that overlapping and are going to fail.
	 * @param {Array} conflicts an array of Task Object that are causing a conflict.
	 */
	function onRecordingFailed(tasks, conflicts) {
		if (!$N.platform.btv.Reminders.isReminderSetForEventId(entity) && conflicts.length > 1) {
			$N.app.Conflicts.recordingRequestConflictsCallback(tasks, conflicts, function () {});
		}
	}


	/**
	 * @method setRecordMenuOption
	 * @private
	 */
	function setRecordMenuOption() {
		if ($N.app.PVRUtil.isRecordingSetForEvent(entity)) {
			RECORD.title = Options.getString("menuCancelRecording");
		} else {
			RECORD.title = Options.getString("menuRecord");
		}
	}

	/**
	 * Check is this channel is already in favourites and alter
	 * the options accordingly (add/remove)
	 * @method getMenuOptionFavouriteStatus
	 * @private
	 * @return void
	 */
	function getMenuOptionFavouriteStatus() {
		var favouriteServiceIds,
			favouriteServiceIdsLength,
			i;
		FAVOURITE.title = Options.getString("menuFavourite");
		FAVOURITE.url = optionIconsPath + "favorite_icon.png";
		isFavourite = false;

		favouriteServiceIds = $N.platform.btv.Favourites.getFavouriteServiceIds($N.app.constants.FAVOURITE_FOLDER_NAME);

		if (favouriteServiceIds) {
			favouriteServiceIdsLength = favouriteServiceIds.length;
			for (i = 0; i < favouriteServiceIdsLength; i++) {
				if (favouriteServiceIds[i] === entity.serviceId) {
					FAVOURITE.title = Options.getString("menuFavouriteRemove");
					FAVOURITE.url = optionIconsPath + "icon_fav-.png";
					isFavourite = true;
				}
			}
		}
	}

	/**
	 * @method createMenuOptionsArrayForEpgEvent
	 * @private
	 * @return {Object} An array of menu options
	 */
	function createMenuOptionsArrayForEpgEvent() {
		var menu = [],
			isEventIdValid = (entity && entity.eventId && entity.eventId !== $N.app.epgUtil.BAD_EVENT_ID),
			isRecordingAllowed = ($N.app.PVRCapability.isPVREnabled() && isEventIdValid),
			entityHasData = entity.title ? true : false,
			isPastEvent = (entity && entity.endTime && entity.endTime < Date.now()),
			isFacebookAccountAvailable = $N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK).isAccountAvailable(),
			isPostOptionValid = $N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK).isPostOptionValid(entity),
			currentContextId = $N.apps.core.ContextManager.getActiveContext().getId(),
			purchasableObject = $N.app.PPVHelper.getPurchasableObject(entity),
			PPVEventPurchaseInfo = $N.app.PPVHelper.getPPVEventPurchaseInfo(entity),
			service = $N.platform.btv.EPG.getChannelByServiceId(entity.serviceId),
			isInteractiveChannel = $N.app.ChannelManager.isInteractiveChannel(service);
		if ($N.apps.core.ContextManager.getLastContext().getId() === "ZAPPER" && $N.app.MessageUtil.hasMessageMailUnread()) {
			menu.push(MAIL);
		}
		if (purchasableObject) {
			menu.push(PPV);
		}
		if ((currentContextId !== "SYNOPSIS") && (currentContextId !== "ZAPPER") && (_isInitiatedByZapper === false)) {
			//if menu options are not viewed through zapper context or current active context is not synopsis
			//then push Main info as first member to the array(menu options).
			if (entityHasData) {
				menu.push(INFO);
			}
		}
		if (isRecordingAllowed && !isPastEvent && !PPVEventPurchaseInfo && !isInteractiveChannel) {
			setRecordMenuOption();
			menu.push(RECORD);
		}
		if ($N.app.StartOverHelper.isStartOver(entity)) {
			menu.push(STARTOVER);
		}
		if (entity.eventId !== ($N.app.epgUtil.getEvent("current", entity.serviceId).eventId) && !isPastEvent) {
			if (entity.eventId && $N.platform.btv.Reminders.isReminderSetForEventId(entity)) {
				REMINDER.title = Options.getString("menuReminderCancel");
				menu.push(REMINDER);
			} else {
				REMINDER.title = Options.getString("menuReminderSchedule");
				menu.push(REMINDER);
			}
		}
		if (entityHasData) {
			if (!($N.app.ParentalControlUtil.isChannelOrProgramLocked(entity) && ($N.app.epgUtil.isAdultEvent(entity) || $N.app.genreUtil.isAdultChannel(service)))) {
				menu.push(RERUNS);
			}
		}
		if ($N.app.FeatureManager.isVODEnabled()) {
			if ($N.app.NowMappingUtil.getChannelNode(service.shortName)) {
				menu.push(NOW);
			}
		}
		getMenuOptionFavouriteStatus();
		menu.push(FAVOURITE);
		if (isFacebookAccountAvailable && isPostOptionValid) {
			menu.push(FACEBOOK_POST);
		}
		if (currentContextId === "ZAPPER" || (currentContextId === "OPTIONS" && _isInitiatedByZapper === true)) {
			if (($N.app.FeatureManager.isPIPEnabled())) {
				if (!$N.app.FeatureManager.isPIPActive()) { // if pip is not active
					if ((entity.eventId === ($N.app.epgUtil.getEvent("current", entity.serviceId).eventId))) { // show start pip for the current event.
						PIP.url = optionIconsPath + "updateStartPip.png";
						PIP.title = Options.getString("menuPIPStart");
						menu.push(PIP);
					}
				} else {
					if ((entity.eventId === ($N.app.epgUtil.getEvent("current", entity.serviceId).eventId)) || !isPastEvent) { // if pip is active then show stop pip for the current/future event.
						PIP.url = optionIconsPath + "disablePip.png";
						PIP.title = Options.getString("menuPIPStop");
						menu.push(PIP);
						if (service.uri !== $N.app.smallScreenPlayer.getSource() && (entity.eventId === ($N.app.epgUtil.getEvent("current", entity.serviceId).eventId))) {
							CHANGE_PIP.title = Options.getString("menuChangePip");
							menu.push(CHANGE_PIP);
						}
						if ($N.app.fullScreenPlayer.getSource() !== $N.app.smallScreenPlayer.getSource()) {
							SWAP_PIP.title = Options.getString("menuSwapPip");
							menu.push(SWAP_PIP);
						}
					}
				}
			}
			//if current active context is zapper or menu options are  viewed through zapper context and current active context is options then
			//push Main info as second last option to the array (menu options).
			if (entityHasData) {
				menu.push(INFO);
			}
		}
		return menu;
	}

	/**
	 * @method getMenuOptions
	 * @private
	 * @return {Object}
	 */
	function getMenuOptions() {
		log("getMenuOptions", "Enter");
		var menu = [];
		switch (entityType) {
		case "epg":
			log("getMenuOptions", "Exit1");
			menu = createMenuOptionsArrayForEpgEvent();
			break;
		case "vod":
			break;
		case "catchUp":
			break;
		case "pvr":
			break;
		default:
			log("getMenuOptions", "Exit2");
		}
		menu.push(BACK);
		return menu;
	}

	/**
	 * @method drawOptionsMenu
	 * @private
	 */
	function drawOptionsMenu() {
		log("drawOptionsMenu", "Enter");
		var lastContext = $N.apps.core.ContextManager.getLastContext().getId(),
			OPTIONS_ZAPPER_X_POS = 174,
			OPTIONS_ZAPPER_Y_POS = 873,
			OPTIONS_LISTGRID_X_POS = 81,
			OPTIONS_LISTGRID_Y_POS = 903;
		if ((lastContext === "ZAPPER" || _isInitiatedByZapper) && lastContext !== "LISTGUIDE") { //To keep the alignment of the Options menu intact, when navigated from Zapper.
			_isInitiatedByZapper = true;
			optionsMenu.setX(OPTIONS_ZAPPER_X_POS);
			optionsMenu.setY(OPTIONS_ZAPPER_Y_POS);
		} else {
			if (lastContext !== "OPTIONS") {
				_isInitiatedByZapper = false;
			}
			optionsMenu.setX(OPTIONS_LISTGRID_X_POS);
			optionsMenu.setY(OPTIONS_LISTGRID_Y_POS);
		}
		menuIndex = optionsMenu.getCurrentIndex();
		optionsMenu.setData(getMenuOptions());
		optionsMenu.displayData();
		optionsMenu.selectItemAtIndex(menuIndex, true);
		log("drawOptionsMenu", "Exit");
	}

	/**
	 * @method dataChangedListener
	 * @param e {object}
	 * @private
	 */
	function dataChangedListener(e) {
		log("dataChangedListener", "Enter");
		drawOptionsMenu();
		log("dataChangedListener", "Exit");
	}

	/**
	 * @method closeContext
	 * @private
	 */
	function closeContext() {
		log("closeContext", "Enter");
		$N.app.ContextHelper.closeContext();
		log("closeContext", "Exit");
	}

	/**
	 * @method itemSelected
	 * @param {Object} menuOption
	 */
	function itemSelected(menuOption) {
		log("itemSelected", "Enter");
		var service,
			isChannelLocked,
			facebookAccountObject = $N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK);
		switch (menuOption.action) {
		case "MAIL":
			$N.app.ContextHelper.openContext("PORTAL", {activationContext: {context: "MESSAGES"}});
			break;
		case "INFO":
			service = $N.platform.btv.EPG.getChannelByServiceId(entity.serviceId);
			isChannelLocked = $N.app.ParentalControlUtil.isChannelLocked(service);
			if ($N.app.ParentalControlUtil.isChannelOrProgramLocked(entity) && $N.app.genreUtil.isAdultChannel(service)) {
				pinHelper.setDialogProperties({
					x: 0,
					y: 0,
					width: 1920,
					height: 1080,
					id: 'optionsPinDialogId',
					title: isChannelLocked ? Options.getString("channelLocked") : Options.getString("programLocked"),
					description: isChannelLocked ? Options.getString("unlockChannel") : Options.getString("unlockShow"),
					cancelCallback: function () {
						pinHelper.hideDialog();
					}
				});
				pinHelper.setAuthenticationSuccessCallback(function () {
					$N.app.TimerUtil.stopTimer("recordIcon");
					$N.app.epgUtil.navigateToSynopsis(entity, isEntityPlaying, function () {});
				});
				pinHelper.showPinDialog('master', true);
			} else {
				$N.app.TimerUtil.stopTimer("recordIcon");
				$N.app.epgUtil.navigateToSynopsis(entity, isEntityPlaying, function () {});
			}
			break;
		case "FAVOURITE":
			if (isFavourite === true) {
				$N.platform.btv.Favourites.removeFavouriteChannel(entity, $N.app.constants.FAVOURITE_FOLDER_NAME);
				FAVOURITE.url = optionIconsPath + "favorite_icon.png";
			} else {
				$N.platform.btv.Favourites.addFavouriteChannel(entity, $N.app.constants.FAVOURITE_FOLDER_NAME);
				FAVOURITE.url = optionIconsPath + "icon_fav-.png";
			}
			break;
		case "RECORD":
			$N.app.PVRUtil.recordOrCancelEvent(entity, closeContext);
			break;
		case "CANCEL":
			$N.app.PVRUtil.cancelEvent(entity, closeContext);
			break;
		case "BACK":
			$N.app.ContextHelper.closeContext();
			break;
		case "RERUNS":
			$N.app.ContextHelper.openContext("SEARCH", {
				activationContext: {
					event: entity,
					searchType: "reruns",
					confirmLeftExit: true
				}
			});
			break;
		case "FACEBOOK_POST":
			$N.app.ContextHelper.closeContext();
			facebookAccountObject.showPostToSocialAccountDialog(entity, entityType);
			facebookAccountObject.setAccountRemovalListener(drawOptionsMenu);// registers callback to redraw options when social account is removed
			break;
		case "REMINDER":
			if (entity.eventId && $N.platform.btv.Reminders.isReminderSetForEventId(entity)) {
				$N.platform.btv.Reminders.cancelReminder(entity);
			} else {
				$N.app.Reminders.setReminders(entity, function () {
					drawOptionsMenu();
				});
			}
			$N.app.ContextHelper.closeContext();
			break;
		case "NOW":
			service = $N.platform.btv.EPG.getChannelByServiceId(entity.serviceId);
			if (service) {
				$N.app.ContextHelper.openContext("NOW", {
					activationContext: {
						stringPath: [ Options.getString("moreOnNowTitle") ],
						idPath: [ $N.app.NowMappingUtil.getChannelNode(service.shortName) ]
					}
				});
			}
			break;
		case "PPV":
			$N.app.PPVHelper.initiatePPVEventPurchase(entity);
			break;
		case "STARTOVER":
			$N.app.StartOverHelper.playStartOver(entity);
			break;
		case "PIP":
			if (!$N.app.FeatureManager.isPIPActive()) {
				$N.app.FeatureManager.setIsPIPActive(true);
				service = $N.platform.btv.EPG.getChannelByServiceId(entity.serviceId);
				service.isPip = true;
				service.eventInfo = $N.app.epgUtil.getDataForInfoCard(entity);
				$N.apps.util.EventManager.fire("pipActivated", service);
				$N.app.ContextHelper.closeContext();
			} else {
				$N.app.FeatureManager.setIsPIPActive(false);
				$N.apps.util.EventManager.fire("pipDeActivated");
				$N.app.ContextHelper.closeContext();
			}
			break;
		case "SWAP_PIP":
			if ($N.app.FeatureManager.isPIPActive()) {
				$N.apps.util.EventManager.fire("swapPip");
				$N.app.ContextHelper.closeContext();
			}
			break;
		case "CHANGE_PIP":
			if ($N.app.FeatureManager.isPIPActive()) {
				service = $N.platform.btv.EPG.getChannelByServiceId(entity.serviceId);
				service.isPip = true;
				service.eventInfo = $N.app.epgUtil.getDataForInfoCard(entity);
				$N.apps.util.EventManager.fire("pipActivated", service);
				$N.app.ContextHelper.closeContext();
			}
			break;
		}
		drawOptionsMenu();
		log("itemSelected", "Exit");
	}

	/**
	 * @method initialiseOptionsMenu
	 * @private
	 */
	function initialiseOptionsMenu() {
		optionsMenu = view.optionsMenu;
		optionsMenu.hide();
		optionsMenu.setItemSelectedCallback(itemSelected);
		optionsMenu.initialise();
	}
	/*
	 * Public API
	 */
	return {

		load: function () {
			log("load", "Enter");
			$N.gui.ResolutionManager.initialiseContext(document);
			$N.apps.core.Language.importLanguageBundleForObject(Options, Options.init, "apps/options/common/", "LanguageBundle.js", importLanguageBundle, window);
			log("load", "Exit");
		},

		init: function () {
			log("init", "Enter");
			$N.gui.FrameworkCore.loadGUIFromXML("apps/options/view/options.xml", document.getElementById("content"), view, window);
			importLanguageBundle();
			$N.apps.core.ContextManager.initialisationComplete(Options);
			initialiseOptionsMenu();
			log("init", "Exit");
		},

		activate: function (context) {
			log("activate", "Enter");
			if (context && context.showBackgroundGradient) {
				view.optionsShadow.show();
			} else {
				view.optionsShadow.hide();
			}
			if (context && context.uiRefreshCallback) {
				uiRefreshCallback = context.uiRefreshCallback;
			}
			if (context && context.backgroundId) {
				backgroundId = context.backgroundId;
			}
			$N.app.fullScreenPlayer.registerEventBoundaryChangedListener(dataChangedListener);
			$N.app.HotPlug.registerSingleUSBEventListener("onMediaChanged", dataChangedListener);
			setEntityFromActivationContext(context);
			drawOptionsMenu();
			optionsMenu.show();
			$N.app.PVRUtil.registerUIRefreshListener(drawOptionsMenu, this);
			$N.platform.btv.PVRManager.addEventListener("stopTaskOK", drawOptionsMenu);
			$N.platform.btv.PVRManager.addEventListener("deleteJobOK", drawOptionsMenu);
			$N.platform.btv.PVRManager.setRecordingRequestConflictsCallback(onRecordingFailed);
			log("activate", "Exit");
		},

		passivate: function () {
			log("passivate", "Enter");
			var emptyFunction = function () {};
			optionsMenu.selectItemAtIndex(1, false);
			$N.app.PVRUtil.unregisterUIRefreshListener(drawOptionsMenu, this);
			$N.platform.btv.PVRManager.removeEventListener("stopTaskOK", drawOptionsMenu);
			$N.platform.btv.PVRManager.removeEventListener("deleteJobOK", drawOptionsMenu);
			$N.platform.btv.PVRManager.setRecordingRequestConflictsCallback(emptyFunction);
			$N.app.fullScreenPlayer.unregisterEventBoundaryChangedListener(dataChangedListener);
			$N.app.HotPlug.removeSingleUSBEventListener("onMediaChanged", dataChangedListener);
			backgroundId = null;
			optionsMenu.hide();
			log("passivate", "Exit");
		},

		preview: function (context) {
			log("preview", "Enter");
			setEntityFromActivationContext(context);
			log("preview", "Exit");
		},

		focus: function () {
			log("focus", "Enter");
			if (uiRefreshCallback) {
				uiRefreshCallback();
			}
			if (backgroundId) {
				$N.app.BrandHelper.show(backgroundId);
			}
			drawOptionsMenu();
			if (!_isInitiatedByZapper) {
				$N.app.ClockDisplay.show();
			}
			log("focus", "Exit");
		},

		defocus: function () {
			log("defocus", "Enter");
			if (backgroundId) {
				$N.app.BrandHelper.hideAll();
			}
			if (!_isInitiatedByZapper) {
				$N.app.ClockDisplay.hide();
			}
			log("defocus", "Exit");
		},

		keyHandler: function (key) {
			log("keyHandler", "Enter");
			var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
				handled = false;
			handled = optionsMenu.keyHandler(key);
			if (!handled) {
				switch (key) {
				case keys.KEY_INFO:
				case keys.KEY_GUIDE:
				case keys.KEY_BLUE:
				case keys.KEY_LEFT:
					$N.app.ContextHelper.closeContext();
					break;
				}
			}
			log("keyHandler", "Exit");
			return handled;
		},

		toString: function () {
			return "OPTIONS";
		}
	};
}());
