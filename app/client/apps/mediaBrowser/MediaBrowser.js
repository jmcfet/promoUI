/**
 * MediaBrowser.
 * @module MediaBrowser
 */
/**
 * Entry point for MediaBrowser context. This class is the main
 * controller for MediaBrowser and handles what should happen when the user navigates to/from
 * the MediaBrowser app.
 * @class MediaBrowser
 * @static
 * @param {Object} $N
 */
var MediaBrowser = (function ($N) {

	var log = new $N.apps.core.Log("MEDIABROWSER", "MediaBrowser"),
		view = {},
		menu = null,
		CCOM = window.parent.CCOM,
		activeComponent = null,
		mediaPanel = null,
		mediaList = null,
		breadCrumb = null,
		selectedIndexArray = [],
		_browserIndex = null,
		footerGroup = null,
		mediaHelper = null,
		loadingPanel = null,
		loadingIndicator = null,
		loadingBackgroundBox = null,
		loadingTitle = null,
		noDataLabel = null,
		fetchContentLablel = null,
		helperMode = null,
		mediaPreviewPanel = null,
		_playBackDisabled = null,
		_usbDataLoaded = null,
		activeMode = null,
		fetchContentTimer = null,
		MIN_FOOTER_WIDTH = '661',
		MAX_FOOTER_WIDTH = '1350',
		TIMER_INTERVAL = 3000,
		lastActiveHelper = null,
		lastActiveHelperArray = [],
		lastActiveMode = null,
		isContextExiting = false,
		START_INDEX = 1,
		settingsPanel = null,
		imagePanel = null,
		switchActiveComponent = function () {},
		mediaPreferencesHighlighted = function (menuItem) {
			var shortCutObject = settingsPanel.getSettingsShortcutObject("menuMediaPreferences");
			shortCutObject.getHelperMode = menuItem.getHelperMode;
			mediaPanel.hide();
			breadCrumb.reset();
			breadCrumb.push($N.app.StringUtil.upcaseFirstLetter(MediaBrowser.getString("menuMediaPreferences")));
			view.menuGroup.settingsPanelWindow.show();
			settingsPanel.preview(shortCutObject);
		},
		mediaPreferencesSelected = function (menuItem) {
			var shortCutObject = settingsPanel.getSettingsShortcutObject("menuMediaPreferences");
			shortCutObject.getHelperMode = menuItem.getHelperMode;
			if (!view.menuGroup.settingsPanelWindow.isVisible()) {
				mediaPreferencesHighlighted(menuItem);
			}
			if (settingsPanel.activate(shortCutObject, null)) {
				switchActiveComponent();
			}
		},
		menuItems = [{
			"title": "menuPhotos",
			"logo": "../../../customise/resources/images/net/photo_blue.png",
			"logoHighlight": "../../../customise/resources/images/net/photo_w.png",
			"url": "mnt",
			"mode": "Images"
		}, {
			"title": "menuMusic",
			"logo": "../../../customise/resources/images/net/music_blue.png",
			"logoHighlight": "../../../customise/resources/images/net/music_w.png",
			"url": "mnt",
			"mode": "Audios"
		}, {
			"title": "menuVideos",
			"logo": "../../../customise/resources/images/net/movie_blue.png",
			"logoHighlight": "../../../customise/resources/images/net/movie_w.png",
			"url": "mnt",
			"mode": "Videos"
		}, {
			"title": "menuPreferences",
			"logo": "../../../customise/resources/images/net/blue_icone-user.png",
			"logoHighlight": "../../../customise/resources/images/net/white_icone-user.png",
			"itemHighlighted": mediaPreferencesHighlighted,
			"itemSelected": mediaPreferencesSelected,
			"getHelperMode": function () {
				return helperMode;
			}
		}],
		isMediaDeviceDisabledDuringPlayback = false,
		isPreviewActualImage = false,
		folderName = "",
		isUsbLoadingIndicatorShown = false,
		previewImageUrl = null;

	/**
	 * show(or)hide the arrows that appear with a menu, when total items are more than the visible ones, based on current activity
	 * @method scrollIndicatorHandler
	 * @private
	 * @param {Object}component, {Object}scrollGroupObj
	 */
	function scrollIndicatorHandler(component, scrollGroupObj) {
		var isAtFirstPage = component._data.isAtFirstPage(),
			isAtLastPage = component._data.isAtLastPage();
		if (component.getSize() > component.getVisibleItemCount()) {
			if (!isAtFirstPage && !isAtLastPage) {
				scrollGroupObj.upArrow.show();
				scrollGroupObj.downArrow.show();
			} else if (isAtFirstPage) {
				scrollGroupObj.downArrow.show();
				scrollGroupObj.upArrow.hide();
			} else if (isAtLastPage) {
				scrollGroupObj.downArrow.hide();
				scrollGroupObj.upArrow.show();
			}
			scrollGroupObj.show();
		} else {
			scrollGroupObj.hide();
		}
	}

	/**
	 * displays the footer for the media browser
	 * @method footerHandler
	 * @private
	 * @param {Object}menuItem
	 */
	function footerHandler(menuItem) {
		var isVisible = false;
		footerGroup.show();
		footerGroup.footerBackgroundBox.show();
		footerGroup.backLabel.setText(MediaBrowser.getString("footerBack"));
		footerGroup.forwardLabel.setText(MediaBrowser.getString("footerForward"));
		if (menuItem && menuItem.type) {
			if (menuItem.type === "Folder") {
				footerGroup.footerBackgroundBox.setWidth(MIN_FOOTER_WIDTH);
				isVisible = false;
			} else if (menuItem.type === "File") {
				footerGroup.footerBackgroundBox.setWidth(MAX_FOOTER_WIDTH);
				isVisible = true;
				if (activeMode === "Images") {
					footerGroup.selectLabel.setText(MediaBrowser.getString("footerOK"));
					footerGroup.greenSelectLabel.setText(MediaBrowser.getString("footerSlideshow"));
				} else {
					footerGroup.selectLabel.setText(MediaBrowser.getString("footerPlay"));
					footerGroup.greenSelectLabel.setText(MediaBrowser.getString("footerPlayAll"));
				}
			}
			footerGroup.forwardLabel.setVisible(!isVisible);
			footerGroup.rightArrow.setVisible(!isVisible);
		}
		footerGroup.okIcon.setVisible(isVisible);
		footerGroup.selectLabel.setVisible(isVisible);
		footerGroup.greenKey.setVisible(isVisible);
		footerGroup.greenSelectLabel.setVisible(isVisible);
	}
	/**
	 * shows clock when media playback is stopped .
	 * @method returnFromMediaPlayer
	 * @private
	 */
	function returnFromMediaPlayer() {
		if ((activeMode === "Images") && previewImageUrl) {
			imagePanel.previewImage.setHref(previewImageUrl);
		}
		$N.app.ClockDisplay.show();
	}
	/**
	 * launches the player if file item gets selected.
	 * @method launchPlayer
	 * @private
	 */
	function launchPhotoPlayer(playList, indexinList, startSlidShowImmediately) {
		imagePanel.previewImage.setHref("");
		$N.app.BrandHelper.hideAll();
		$N.app.ContextHelper.openContext("MEDIAPLAYER", {activationContext: {
			controller: MediaBrowser,
			type: "PHOTO",
			playList: playList,
			selectedItemIndex: indexinList,
			startSlideShow: startSlidShowImmediately,
			folderName : folderName,
			context: "MEDIABROWSER"
		}, navCompleteCallback: returnFromMediaPlayer});
	}
	/**
	 * launches the player if file item gets selected.
	 * @method launchMusicPlayer
	 * @private
	 */
	function launchMusicPlayer(playList, indexinList, playShuffled) {
		$N.app.BrandHelper.hideAll();
		$N.app.ContextHelper.openContext("MEDIAPLAYER", {activationContext: {
			controller: MediaBrowser,
			type: "MUSIC",
			playList: playList,
			selectedItemIndex: indexinList,
			skip: false,
			trickplay: true,
			context: "MEDIABROWSER",
			isMusic: true,
			isPlayShuffleEnabled: playShuffled,
			defaultThumbnailUrl: "../../mediaBrowser/view/images/Audios.png"
		}, navCompleteCallback: returnFromMediaPlayer});
	}

	function findCurrentUrlIndex(playList, Url) {
		var i;
		for (i = 0; i < playList.length; i++) {
			if (playList[i] === Url) {
				return i;
			}
		}
		return 0;
	}
	/**
	 * launches the player if file item gets selected.
	 * @method launchMusicPlayer
	 * @private
	 */
	function launchVideoPlayer(playList, indexinList, playShuffled) {
		$N.app.BrandHelper.hideAll();
		$N.app.ContextHelper.openContext("MEDIAPLAYER", {activationContext: {
			controller: MediaBrowser,
			type: "VIDEO",
			playList: playList,
			selectedItemIndex: indexinList,
			skip: false,
			trickplay: true,
			context: "MEDIABROWSER",
			isMusic: false,
			isPlayShuffleEnabled: playShuffled
		}, navCompleteCallback: returnFromMediaPlayer});
	}
	/**
	 * launches the player if file item gets selected.
	 * @method launchPlayer
	 * @private
	 */
	function launchPlayer(menuItem, playAll) {
		var playList = mediaHelper.getPlayList(),
			currentItemUrl = mediaHelper.getCurrentFolderFullyQualifiedName(menuItem),
			indexinList = findCurrentUrlIndex(playList, currentItemUrl),
			playListLength = playList.length,
			i,
			metaData = null,
			playListWithDuration = [],
			trackDuration = null,
			itemDetails = null;

		if (playList.length > 0) {
			switch (menu.getSelectedItem().mode) {
			case "Images":
				launchPhotoPlayer(playList, indexinList, playAll);
				break;
			case "Audios":
				launchMusicPlayer(playList, indexinList, playAll);
				break;
			case "Videos":
				launchVideoPlayer(playList, indexinList, playAll);
				break;
			default:
				break;
			}
		}
	}
	/**
	 * @method showUsbLoadingIndicator
	 * @private
	 */
	function showUsbLoadingIndicator() {
		log("showUsbLoadingIndicator", "Enter");
		isUsbLoadingIndicatorShown = true;
		loadingPanel.usbLoadingTitle.setText(MediaBrowser.getString("usbLoadingTitle"));
		loadingPanel.usbLoadingMessage.setText(MediaBrowser.getString("usbLoadingMessage"));
		loadingPanel.show();
		loadingIndicator.setX("55");
		loadingIndicator.setY("150");
		loadingIndicator.setImageWidth("35");
		loadingIndicator.setImageHeight("35");
		loadingTitle.hide();
		loadingPanel.usbLoadingTitle.show();
		loadingPanel.usbLoadingMessage.show();
		loadingIndicator.show();
		log("showUsbLoadingIndicator", "Exit");
	}

	/**
	 * sets the loading icon visibility based on the parameter passed.
	 * @method setLoadingIconVisiblity
	 * @private
	 * @param isVisible{boolean} true/false
	 */
	function setLoadingIconVisiblity(isVisible) {
		loadingIndicator.setX("100");
		loadingIndicator.setY("200");
		loadingIndicator.setImageWidth("48");
		loadingIndicator.setImageHeight("48");
		loadingPanel.usbLoadingTitle.hide();
		loadingPanel.usbLoadingMessage.hide();
		loadingBackgroundBox.setVisible(isVisible);
		loadingIndicator.setVisible(isVisible);
		loadingTitle.setVisible(isVisible);
	}
	/**
	 * @method hideLoadingIndicator
	 * @private
	 */
	function hideLoadingIndicator() {
		log("hideLoadingIndicator", "Enter");
		isUsbLoadingIndicatorShown = false;
		scrollIndicatorHandler(mediaList, mediaPanel.scrollIndicator);
		setLoadingIconVisiblity(false);
		loadingPanel.hide();
		log("hideLoadingIndicator", "Exit");
	}
	/**
	 * @method showLoadingIndicator
	 * @private
	 */
	function showLoadingIndicator() {
		log("showLoadingIndicator", "Enter");
		mediaList.hide();
		mediaPanel.scrollIndicator.upArrow.hide();
		mediaPanel.scrollIndicator.downArrow.hide();
		mediaPreviewPanel.hide();
		noDataLabel.hide();
		if (mediaHelper.isMediaContentLoading()) {
			showUsbLoadingIndicator();
		} else if (!isUsbLoadingIndicatorShown) {
			setLoadingIconVisiblity(true);
		}
		loadingPanel.show();
		log("showLoadingIndicator", "Exit");
	}

	/**
	 * @method isLoadingIndicatorVisible
	 * @private
	 */
	function isLoadingIndicatorVisible() {
		return loadingPanel.isVisible();
	}
	/**
	 * fetchContentLablel shows up when back key is pressed while contents are being processed.
	 * This method hides the label
	 * @method hideFetchContentLable
	 * @private
	 */
	function hideFetchContentLable() {
		fetchContentLablel.hide();
	}
	/**
	 * This method hides the extension of footer if not needed.
	 * @method hideExtendedFooter
	 * @private
	 */
	function hideExtendedFooter() {
		footerGroup.footerBackgroundBox.setWidth(MIN_FOOTER_WIDTH);
		footerGroup.rightArrow.setVisible(false);
		footerGroup.forwardLabel.setVisible(false);
	}
	/**
	 * Updates the media list with the data. Used as a callback to serve
	 * the async and syn calls between DLNA and USB respectively.
	 * @method updateMediaListCallback
	 * @private
	 * @param {data} usually the data received from the helper
	 */
	function updateMediaListCallback(data) {
		log("updateMediaListCallback", "Enter");
		if (data) {
			hideLoadingIndicator();
			if (fetchContentTimer) {
				clearTimeout(fetchContentTimer);
				fetchContentTimer = null;
			}
			hideFetchContentLable();
			mediaList.show();
			mediaList.setData(data);
			mediaList.displayData(true, true);
			if (data.length > 0) {
				if (_browserIndex) {
					mediaList.selectItemAtIndex(_browserIndex, true);
				} else {
					mediaList.selectItemAtIndex(START_INDEX, true);
				}
				noDataLabel.hide();
			} else if ((data.length <= 0) && (mediaHelper.isMediaContentLoading())) { // If data is present and isMediaContentLoading = true, then showLoadingIndicator
				showLoadingIndicator();
				hideExtendedFooter();
			} else {
				noDataLabel.setText(MediaBrowser.getString("noContent"));
				noDataLabel.show();
				hideExtendedFooter();
			}
			activeComponent.focus();
			mediaList.show();
			mediaPanel.show();
		}
		log("updateMediaListCallback", "Exit");
	}

	/**
	 * draws the mediaPanel of folders and files
	 * @method drawMenu
	 * @private
	 * @param {mode} media mode, {folderName} selected folder
	 */
	function drawMenu(mode, folderObject) {
		log("drawMenu", "Enter");
		if (mediaHelper) {
			showLoadingIndicator();
			mediaHelper.navigateToSubFolder(mode, folderObject, updateMediaListCallback);
		}
		log("drawMenu", "Exit");
	}

	/**
	 * back key press is handled here
	 * @method handleBackKeyPress
	 * @private
	 */
	function handleBackKeyPress() {
		log("handleBackKeyPress", "Enter");
		switch (activeComponent) {
		case menu:
			isContextExiting = true;
			$N.app.ContextHelper.closeContext();
			break;
		case mediaList:
			var	isHandled = mediaHelper.navigateToParentFolder(menu.getSelectedItem().url);
			folderName = " ";
			if (isHandled) {
				showLoadingIndicator();
				_browserIndex = selectedIndexArray.pop();
				mediaHelper.getFolderContent(activeMode, mediaHelper.getCurrentFolderName(), updateMediaListCallback);
				activeComponent.focus();
				breadCrumb.pop();
			} else {
				activeComponent.selectItemAtIndex(START_INDEX, true);
				activeComponent.defocus();
				activeComponent = menu;
				activeComponent.focus();
				breadCrumb.reset();
				breadCrumb.show();
				breadCrumb.push(mediaHelper.getMediumName());
				selectedIndexArray = [];
				_browserIndex = null;
			}
			break;
		}
		log("handleBackKeyPress", "Exit");
	}

	switchActiveComponent = function () {
		if (activeComponent === menu) {
			activeComponent = settingsPanel;
		} else if (activeComponent === settingsPanel) {
			activeComponent = menu;
		}
	};

	function getSettingsPanelTitle() {
		return view.menuGroup.settingsPanelWindow.settingsPanelTitle;
	}

	function setSettingsPanelTitle(title) {
		view.menuGroup.settingsPanelWindow.settingsPanelTitle.setText($N.app.StringUtil.upcaseFirstLetter(title));
	}

	/**
	 * Callback for when a menu item is highlighted
	 * @method itemHighlighted
	 * @private
	 * @param {Object} menuItem
	 */
	function menuItemHighlighted(menuItem) {
		log("menuItemHighlighted", "Enter");
		var menuItemUrlObject = {'title' : menuItem.url};
		activeMode = menuItem.mode;
		if (menuItem.itemHighlighted) {
			menuItem.itemHighlighted(menuItem);
		} else if (mediaHelper) {
			breadCrumb.reset();
			breadCrumb.push(mediaHelper.getMediumName());
			view.menuGroup.settingsPanelWindow.hide();
			mediaPanel.show();
			mediaHelper.setActiveFileSystemMode(menuItem.mode);
			mediaHelper.rewindToBaseFolder();
			drawMenu(menuItem.mode, menuItemUrlObject);
			footerHandler(menuItem);
			mediaPreviewPanel.mediaTitle.setText("");
		}
		breadCrumb.show();
		log("menuItemHighlighted", "Exit");
	}

	/**
	 * Callback for when a menu item is selected
	 * @method itemSelected
	 * @private
	 * @param {Object} menuItem
	 */
	function menuItemSelected(menuItem) {
		log("menuItemSelected", "Enter");
		var navigationContextConfigObj = null;
		if (menuItem.navigationContext) {
			if (menuItem.navigationContextActivationObj) {
				navigationContextConfigObj = {"activationContext" : menuItem.navigationContextActivationObj};
			}
			$N.app.ContextHelper.openContext(menuItem.navigationContext, navigationContextConfigObj);
		} else if (menuItem.itemSelected) {
			menuItem.itemSelected(menuItem);
		} else {
			activeMode = menuItem.mode;
			activeComponent = mediaList;
			activeComponent.focus();
			activeComponent.selectItemAtIndex(START_INDEX, true);
		}
		log("menuItemSelected", "Exit");
	}
	/**
	 * Callback for when a media list item is selected
	 * @method mediaListItemSelected
	 * @private
	 * @param {Object} menuItem
	 */
	function mediaListItemSelected(menuItem) {
		if (menuItem) {
			if (menuItem.type === "Folder") {
				if (!isLoadingIndicatorVisible()) {//Avoid updating the breadcrumb when an active request is ongoing.
					breadCrumb.push(menuItem.title);
					folderName = menuItem.title;
					selectedIndexArray.push(mediaList.getSelectedItemIndex()); //the array stores the current selected index on each forward navigation.
					_browserIndex = null;
					drawMenu(activeMode, menuItem);
				}
			} else {
				launchPlayer(menuItem);
			}
		}
	}
	/**
	 * sets the image preview css based on height and width of the actual image
	 * @method setPreviewImageAspectRatio
	 * @private
	 * @param {string} Url, {boolean} isLandscape
	 */
	function setPreviewImageAspectRatio(Url, isLandscape) {
		if (isLandscape === null) {
			imagePanel.previewImage.setCssClass("previewImageSize previewImageMaxSize");
		} else if (isLandscape) {
			imagePanel.previewImage.setCssClass("previewImageSize previewImageWidth");
		} else {
			imagePanel.previewImage.setCssClass("previewImageSize previewImageHeight");
		}
	}
	/**
	 * @method imageLoadSuccessfulCallback
	 * @private
	 */
	function imageLoadSuccessfulCallback(currentHref) {
		if (currentHref === previewImageUrl) {
			imagePanel.previewImageThumbnail.hide();
			imagePanel.previewImage.show();
		}
	}
	/**
	 * @method loadPreviewImageCallback
	 * @private
	 * @param {string} url
	 */
	function loadPreviewImageCallback(url, isLandscape) {
		if (isPreviewActualImage && url && url !== "") {
			previewImageUrl = url;
			imagePanel.previewImage.setLoadSuccessful(imageLoadSuccessfulCallback);
			imagePanel.previewImage.setHref(url);
			setPreviewImageAspectRatio(url, isLandscape);
		}
	}
	/**
	 * handles the preview of the highlighted file- default thumbail gets displayed.
	 * @method handleMediaPreview
	 * @private
	 * @param {Object} menuItem
	 */
	function handleMediaPreview(menuItem) {
		var fullyQualifiedName = mediaHelper.getCurrentFolderFullyQualifiedName(menuItem),
			metaData = mediaHelper.getMediaMetadata(fullyQualifiedName, activeMode, menuItem),
			cleartime,
			thumbnailUrl;
		if (metaData && activeMode !== "Audios") {
			mediaPreviewPanel.mediaTitle.setText(metaData.data);
		}
		thumbnailUrl = mediaHelper.getThumbnailUrl(menuItem);
		previewImageUrl = thumbnailUrl;
		imagePanel.previewImage.hide();
		imagePanel.previewImage.setCssClass("previewImageSize");
		imagePanel.previewImageThumbnail.show();
		imagePanel.previewImageThumbnail.setHref(thumbnailUrl);
		isPreviewActualImage = true;
		mediaHelper.getActualImageUrlForPreview(menuItem, loadPreviewImageCallback);
	}

	/**
	 * Callback for when a media list item is highlighted
	 * @method mediaListItemHighlighted
	 * @private
	 * @param {Object} menuItem
	 */
	function mediaListItemHighlighted(menuItem) {
		log("mediaListItemHighlighted", "Enter");
		if (menuItem && menuItem.type === "File") {
			mediaPreviewPanel.show();
			handleMediaPreview(menuItem);
		} else {
			mediaPreviewPanel.hide();
		}
		log("mediaListItemHighlighted", "Exit");
	}
	/**
	 * Callback for when a media list item is immedietly highlighted
	 * @method mediaListItemHighlightedImmediate
	 * @private
	 * @param {Object} menuItem
	 */
	function mediaListItemHighlightedImmediate(menuItem) {
		var scrollComponent = mediaPanel.scrollIndicator;
		if (isPreviewActualImage) {
			isPreviewActualImage = false;
			mediaHelper.clearImageLoadTimer();
		}
		footerHandler(menuItem);
		if (scrollComponent) {
			scrollIndicatorHandler(mediaList, scrollComponent);
		}
	}

	/**
	 * redraws the media browser at situations where the same context stays over the other(USB/DLNA - both uses MediaBrowser)
	 * @method redrawBrowserMenu
	 * @private
	 */
	function redrawBrowserMenu() {
		mediaHelper = lastActiveHelper;
		helperMode = lastActiveMode;
		activeComponent = menu;
		menuItemHighlighted(menuItems[0]);

		breadCrumb.reset();
		breadCrumb.show();
		breadCrumb.push(mediaHelper.getMediumName());
	}
	/**
	 * Callback when USB is unplugged while inside browsing
	 * @method usbMediaPlaybackListener
	 * @private
	 * @param {Object} status
	 */
	function usbMediaPlaybackListener(status) {
		isContextExiting = true;
		if (helperMode === $N.app.constants.USB_HELPER_MODE) {
			$N.app.ContextHelper.closeContext();
		}
	}
	/**
	 * @method subscribeToUsbMediaPlaybackEvent
	 * @private
	 */
	function subscribeToUsbMediaPlaybackEvent() {
		if (!_playBackDisabled) {
			_playBackDisabled = $N.apps.util.EventManager.subscribe("usbMediaPlaybackDisabled", usbMediaPlaybackListener, MediaBrowser);
		}
	}
	/**
	 * @method unSubscribeToUsbMediaPlaybackEvent
	 * @private
	 */
	function unSubscribeToUsbMediaPlaybackEvent() {
		if (_playBackDisabled) {
			$N.apps.util.EventManager.unSubscribe(_playBackDisabled);
			_playBackDisabled = null;
		}
	}
	/**
	 * function called when the usb contents gets loaded.
	 * @method usbContentLoadedListener
	 * @private
	 */
	function usbContentLoadedListener() {
		if (mediaHelper.setMediaContentLoading) {
			mediaHelper.setMediaContentLoading(false);
		}
		menuItemHighlighted(menu.getSelectedItem());
	}
	/**
	 * @method subscribeToUSBDataLoadEvent
	 * @private
	 */
	function subscribeToUSBDataLoadEvent() {
		if (!_usbDataLoaded) {
			_usbDataLoaded = $N.apps.util.EventManager.subscribe("usbContentLoaded", usbContentLoadedListener, MediaBrowser);
		}
	}
	/**
	 * @method unSubscribeToUSBDataLoadEvent
	 * @private
	 */
	function unSubscribeToUSBDataLoadEvent() {
		if (_usbDataLoaded) {
			$N.apps.util.EventManager.unSubscribe(_usbDataLoaded);
			_usbDataLoaded = null;
		}
	}
	/**
	 * Callback to be executed when browseContainer fails in DLNA
	 * This method shows the error message pop-up and navigates the user back to the main menu list in media browser.
	 * @method browseContainerFailedCallback
	 * @private
	 */
	function browseContainerFailedCallback(e) {
		var noDataArray = [];
		//Communication error pop up.
		$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_DLNA_COMMUNICATION_ERROR,
			MediaBrowser.getString("dlnaBrowseFailTitle"),
			MediaBrowser.getString("dlnaBrowseFailMessage")
			);
		hideLoadingIndicator();
		mediaList.setData(noDataArray);
		mediaList.displayData(true, true);
		noDataLabel.setText(MediaBrowser.getString("noContent"));
		noDataLabel.show();
		mediaList.show();
		mediaPanel.show();
		footerGroup.footerBackgroundBox.setWidth(MIN_FOOTER_WIDTH);
		//setting the focus back to the main menu (Images/Audios/Videos)
		activeComponent = menu;
		activeComponent.focus();
		breadCrumb.reset();
		breadCrumb.show();
		breadCrumb.push(mediaHelper.getMediumName());
		selectedIndexArray = [];
		_browserIndex = null;
	}
	/**
	 * event registration for browseContainerFailed.
	 * @method subscribeToDlnaBrowseContainerFailedCallback
	 * @private
	 */
	function subscribeToDlnaBrowseContainerFailedCallback() {
		CCOM.HomeNetworking.addEventListener('browseContainerFailed', browseContainerFailedCallback, false);
	}
	/**
	 * callback method that handles the dlna device lost event
	 * if the current context is mediabrowser and the device name also matches, then it exits the context.
	 * @method onDlnaDeviceLost
	 * @private
	 */
	function onDlnaDeviceLost(e) {
		if (mediaHelper.getMediumName() === e.device.friendlyName) {
			$N.app.ContextHelper.closeContext("MEDIABROWSER");
		}
	}
	/**
	 * event registration for DLNA device loss.
	 * @method subscribeToDlnaDeviceLostEvent
	 * @private
	 */
	function subscribeToDlnaDeviceLostEvent() {
		$N.app.DlnaHelper.subscribeToDeviceLostEvent(onDlnaDeviceLost);
	}
	/**
	 * event unsubscription for DLNA device loss.
	 * @method unSubscribeToDlnaDeviceLostEvent
	 * @private
	 */
	function unSubscribeToDlnaDeviceLostEvent() {
		$N.app.DlnaHelper.unSubscribeToDeviceLostEvent(onDlnaDeviceLost);
	}
	/**
	 * @method pushToLastActiveHelperArray
	 * @private
	 */
	function pushToLastActiveHelperArray() {
		var i = 0;
		for (i = 0; i < lastActiveHelperArray.length; i++) {
			if (lastActiveHelperArray[i].mode === helperMode) {
				return;
			}
		}
		lastActiveHelperArray.push({'helper' : mediaHelper, 'mode' : helperMode});
	}
	// Public API
	return {
		/**
		 * Entry point of the application for the SVG onload event.
		 * @method load
		 */
		load: function () {
			log("load", "Enter");
			$N.gui.ResolutionManager.initialiseContext(document);
			$N.apps.core.Language.importLanguageBundleForObject(MediaBrowser, MediaBrowser.init, "customise/resources/", "LanguageBundle.js", null, window);
			log("load", "Exit");
		},

		/**
		 * Application lifecycle initialisation method to create the view.
		 * @method init
		 */
		init: function () {
			log("init", "Enter");
			$N.gui.FrameworkCore.loadGUIFromXML("apps/mediaBrowser/view/mediabrowser.xml", document.getElementById("content"), view, window);
			menu = view.menuGroup.mediaMenu;
			mediaPanel = view.menuGroup.mediaPanel;
			mediaList = mediaPanel.mediaMenuList;
			mediaPreviewPanel = mediaPanel.previewPanel;
			footerGroup = mediaPanel.mediaFooter;
			breadCrumb = view.breadcrumb;
			loadingPanel = mediaPanel.LoadingPanel;
			loadingBackgroundBox = loadingPanel.LoadingBackgroundBox;
			loadingIndicator = loadingPanel.imageLoadingIndicator;
			loadingTitle = loadingPanel.LoadingTitle;
			noDataLabel = mediaPanel.noDataLabel;
			fetchContentLablel = mediaPanel.fetchContent;
			imagePanel = mediaPreviewPanel.imagePanel;
			settingsPanel = new $N.gui.SettingsPanel(MediaBrowser, view.menuGroup.settingsPanelWindow.settingsPanel, document.getElementById("content"));
			//initialising the data for the fixed list
			menu.setDataMapper($N.app.DataMappers.getSettings());
			menu.setItemHighlightedCallback(menuItemHighlighted);
			menu.setItemHighlightedImmediateCallback(function () {});
			menu.setItemSelectedCallback(menuItemSelected);
			menu.setData(menuItems);
			menu.initialise(true);

			//initialising the data for the media list (first menu)
			mediaList.setDataMapper($N.app.DataMappers.getMenuUsbFolder());
			mediaList.setItemHighlightedCallback(mediaListItemHighlighted);
			mediaList.setItemHighlightedImmediateCallback(mediaListItemHighlightedImmediate);
			mediaList.setItemSelectedCallback(mediaListItemSelected);
			mediaList.initialise(true);
			mediaList.setUpDownPageable(true);

			breadCrumb.setParentLabelCss("breadcrumbTitle wrap ellipsisLabel parentSpan");
			breadCrumb.setChildLabelCss("breadcrumbSubTitle wrap ellipsisLabel");
			mediaPreviewPanel.hide();
			$N.apps.core.ContextManager.initialisationComplete(MediaBrowser);
			log("init", "Exit");
		},

		/**
		 * Application lifecycle activation method to draw the view.
		 * @method activate
		 * @param {Object} (activationObject)  an object containing the context of the menu item to display (if any)
		 */
		activate: function (activationObject) {
			log("activate", "Enter");
			view.menuGroup.show();
			view.breadcrumb.show();
			setLoadingIconVisiblity(true);
			isMediaDeviceDisabledDuringPlayback = false;
			mediaHelper = activationObject.helper;
			helperMode = activationObject.mode;
			activeComponent = menu;
			menu.displayData();
			$N.app.BrandHelper.show($N.app.BrandHelper.AGORA_BACKGROUND_ID);
			$N.app.ClockDisplay.show();
			this.registerListener();
			activeComponent.selectItemAtIndex(START_INDEX, true);
			subscribeToUsbMediaPlaybackEvent();
			subscribeToDlnaBrowseContainerFailedCallback();
			subscribeToDlnaDeviceLostEvent();
			subscribeToUSBDataLoadEvent();

			folderName = " ";
			breadCrumb.reset();
			breadCrumb.show();
			breadCrumb.push(mediaHelper.getMediumName());
			loadingTitle.setText(MediaBrowser.getString("pleaseWaitText"));
			log("activate", "Exit");
		},

		/**
		 * Application lifecycle passivation method to hide the view.
		 * @method passivate
		 */
		passivate: function (leaveAsPreview) {
			log("passivate", "Enter");
			$N.app.BrandHelper.hideAll();
			$N.app.ClockDisplay.hide();
			this.unRegisterListener();
			unSubscribeToUsbMediaPlaybackEvent();
			unSubscribeToDlnaDeviceLostEvent();
			unSubscribeToUSBDataLoadEvent();
			isContextExiting = false;
			lastActiveHelperArray = [];
			lastActiveHelper = null;
			lastActiveMode = null;
			if (activeComponent === settingsPanel) {
				settingsPanel.passivate(true);
			}
			log("passivate", "Exit");
		},

		/**
		 * Application lifecycle method to preview the view.
		 * @method preview
		 * @param {Object} (activationObject)  an object containing the context of the menu item to display (if any)
		 */
		preview: function (activationObject) {
			log("preview", "Enter");
			log("preview", "Exit");
		},

		/**
		 * Application lifecycle method to focus the view.
		 * @method focus
		 */
		focus: function () {
			log("focus", "Enter");
			if (lastActiveHelperArray.length > 1) {
				lastActiveHelper = lastActiveHelperArray[lastActiveHelperArray.length - 1].helper;
				lastActiveMode = lastActiveHelperArray[lastActiveHelperArray.length - 1].mode;
				lastActiveHelperArray.pop();
				redrawBrowserMenu();
			}
			if (isMediaDeviceDisabledDuringPlayback && !isContextExiting) {
				$N.app.ContextHelper.closeContext();
			} else {
				$N.app.BrandHelper.show($N.app.BrandHelper.AGORA_BACKGROUND_ID);
				$N.app.ClockDisplay.show();
				subscribeToDlnaDeviceLostEvent();
				subscribeToUsbMediaPlaybackEvent();
			}
			log("focus", "Exit");
		},

		/**
		 * Application lifecycle method to defocus the view.
		 * @method defocus
		 */
		defocus: function () {
			log("defocus", "Enter");
			if (!isContextExiting) {
				pushToLastActiveHelperArray();
			}
			unSubscribeToDlnaDeviceLostEvent();
			unSubscribeToUsbMediaPlaybackEvent();
			log("defocus", "Exit");
		},

		/**
		 * Application lifecycle method to unpreview the view.
		 * @method unPreview
		 */
		unPreview: function () {
			log("unPreview", "Enter");
			log("unPreview", "Exit");
		},

		/**
		 * launches the player if file item gets selected.
		 * @method launchPlayer
		 * @private
		 */
		getMetaDataForUrl: function (url) {
			var metaData = null,
				metaDataObject = {},
				trackDuration = null,
				itemDetails = {},
				selectedFolderName = null;
			if (url) {
				metaData = mediaHelper.getMediaMetadata(url, activeMode);
				//metadata will be available from the helper classes
				//If no metadata is available, empty metadata will be provided.
				if (metaData) {
					trackDuration = metaData.trackDuration;
					itemDetails = metaData.itemDetails;
					selectedFolderName = folderName;
				}
				metaDataObject = {'url' : url, 'duration' : trackDuration, 'itemDetails' : itemDetails, 'folderName' : selectedFolderName};
			}
			return metaDataObject;
		},

		/**
		 * sets the usb removed flag.
		 * @method setUsbDeviceRemovedFlag
		 * @private
		 */
		setMediaDeviceDiasbledFlag: function (isMediaDisbled) {
			isMediaDeviceDisabledDuringPlayback = isMediaDisbled;
		},

		/**
		 * Application lifecycle method to return the context name.
		 * @method toString
		 * @return {String} Application name.
		 */
		toString: function () {
			return "MEDIABROWSER";
		},

		/**
		 * registers the NetworkStateChange event listener
		 *
		 * @method registerListener
		 */
		registerListener : function () {
		},

		/**
		 * unregisters (removes) the NetworkStateChange event listener
		 *
		 * @method unRegisterListener
		 */
		unRegisterListener : function () {
		},

		/**
		 * Main key handler method that handles key presses.
		 * @method keyHandler
		 * @param {String} key The key that was pressed.
		 * @return {Boolean} True if the key press was handled, false if the
		 * key press wasn't handled.
		 */
		keyHandler: function (key, repeats) {
			log("keyHandler", "Enter");
			var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
				handled = false;
			$N.app.MemoryUtil.setOrUpdateGarbageCollectTimeoutAndInterval();
			handled = activeComponent.keyHandler(key, repeats);
			if (!handled) {
				switch (key) {
				case keys.KEY_DOWN:
				case keys.KEY_UP:
					break;
				case keys.KEY_RIGHT:
					break;
				case keys.KEY_LEFT:
				case keys.KEY_BACK:
					handleBackKeyPress();
					handled = true;
					break;
				case keys.KEY_GREEN:
					if (mediaList.getSelectedItem().type === "File") {
						launchPlayer(mediaList.getSelectedItem(), true);
						handled = true;
					}
					break;
				}
			}
			log("keyHandler", "Exit");
			return handled;
		},
		switchActiveComponent: switchActiveComponent,
		getSettingsPanelTitle: getSettingsPanelTitle,
		setSettingsPanelTitle: setSettingsPanelTitle
	};

}(window.parent.$N));
