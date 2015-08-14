/**
 * Now: Also known as VOD
 * This class is the main controller for Now and handles what should happen when the user
 * navigates to/from the app. It also handles the main menu structure
 * @module Now
 * @class Now
 * #depends NowNavigation.js
 * #depends NowPlayback.js
 * #depends NowNodeUtil.js
 * #depends view/NowMenuItem.js
 * #depends view/NowPane.js
 * #depends view/NowHighlights.js
 * #depends view/NowGallery.js
 * #depends view/NowAssetInfo.js
 * #depends view/NowFullAssetInfo.js
 * #depends view/NowClube.js
 * #depends view/NowClubeItem.js
 * #depends view/NowClubeInfo.js
 * #depends view/NowMyContent.js
 * #depends view/NowMyContentMenuItem.js
 * #depends view/NowMySubscriptions.js
 * #depends view/NowMySubscriptionsMenuItem.js
 * #depends view/NowDisclaimer.js
 * #depends view/NowPinDialog.js
 * #depends view/NowConfirmationDialog.js
 * #depends view/NowEmptyPane.js
 * #depends view/NowLoading.js
 * @static
 * @param {Object} $N
 */
var Now = (function ($N) {
	var log = new $N.apps.core.Log("NOW", "Now"),
		view = {},
		navigation,
		playback,
		loadingBar,
		disclaimer,
		pinHelper,
		purchasePinHelper,
		breadcrumb,
		masterPane,
		slavePane,
		menuSeparator,
		navigateBackArrow,
		fullAssetInfo,
		masterMenu,
		slaveMenu,
		masterGallery,
		slaveGallery,
		emptyPane,
		clube,
		highlights,
		myContent,
		mySubscriptions,
		MODE = {
			NAVIGATION: 1,
			FULL_ASSET_INFO: 2,
			DISCLAIMER: 3
		},
		currentMode = MODE.NAVIGATION,
		defaultGallerySelectedCallback,
		overrideGallerySelectedCallback,
		overrideDataRetryTimeout = null,
		SLAVE_PANE_DEFAULT_X = 690,
		SLAVE_PANE_FULL_SCREEN_X = 103.5,
		serviceToTune = null,
		isServiceTuneNeeded = false;

	/**
	 * @method augmentCatalogueData
	 * @param {Object} data
	 * @return {Boolean} Returns true if all items in the data are augmented
	 */
	function augmentCatalogueData(data, categoryData) {
		var i,
			loopLength = data.length,
			dataItem,
			categoryDataItem;
		for (i = 0; i < loopLength; i++) {
			dataItem = data[i];
			categoryDataItem = categoryData[dataItem.title];
			if (categoryDataItem) {
				dataItem.image = categoryDataItem.image;
				dataItem.Synopsis = categoryDataItem.synopsis;
				if (categoryDataItem.productId) {
					dataItem.technicals = [{
						products: [{
							id: categoryDataItem.productId
						}]
					}];
				}
			}
		}
		if (loopLength) {
			return true;
		}
		return false;
	}

	/**
	 * @method updateMyContentText
	 */
	function updateMyContentText() {
		myContent.configure({
			rentalExpiryText: Now.getString("myContentRentalExpiryTitle"),
			assetExpiryText: Now.getString("myContentAssetExpiryTitle"),
			emptyRentalsText: Now.getString("myContentRentalsEmpty"),
			emptyFavouritesText: Now.getString("myContentFavouritesEmpty"),
			moreInfoText: Now.getString("moreInformation")
		});
		emptyPane.setMessage(Now.getString("emptyMessage"));
	}

	/**
	 * @method updateMySubscriptionsText
	 */
	function updateMySubscriptionsText() {
		mySubscriptions.configure({
			emptyRentalsText: Now.getString("myContentRentalsEmpty"),
			subscriptionMoreInfoText: Now.getString("subscriptionGallery")
		});
	}

	/**
	 * @method toggleFocusPane
	 */
	function toggleFocusPane() {
		log("toggleFocusPane", "Enter");
		if (navigation.isMasterInFocus()) {
			slavePane.defocus();
			masterPane.focus();
		} else {
			masterPane.defocus();
			slavePane.focus();
			slavePane.show();
		}
		log("toggleFocusPane", "Exit");
	}

	/**
	 * @method updatePane
	 * @param {Object} pane
	 * @param {Object} data
	 * @param {Number} contentID
	 * @param {Number} itemID (optional) ID of the item we wish to select in the list (or 'true' to select 1st)
	 */
	function updatePane(pane, data, contentID, itemID) {
		var paneType = data.type,
			paneObj = null,
			CONTENT_TYPE = $N.app.MDSUtil.CONTENT_TYPE,
			galleryCallback;
		switch (paneType) {
		case CONTENT_TYPE.CATALOGUES:
			if (pane === masterPane) {
				paneObj = masterMenu;
			} else {
				paneObj = slaveMenu;
			}
			break;
		case CONTENT_TYPE.ASSETS:
			if (data.isAugmented) {
				galleryCallback = overrideGallerySelectedCallback;
			} else {
				galleryCallback = defaultGallerySelectedCallback;
			}
			if (pane === masterPane) {
				paneObj = masterGallery;
				masterGallery.setItemSelectedCallback(galleryCallback);
			} else {
				paneObj = slaveGallery;
				slaveGallery.setItemSelectedCallback(galleryCallback);
			}
			break;
		case CONTENT_TYPE.CLUBE:
			paneObj = clube;
			break;
		case CONTENT_TYPE.HIGHLIGHTS:
			paneObj = highlights;
			break;
		case CONTENT_TYPE.MYCONTENT:
			paneObj = myContent;
			break;
		case CONTENT_TYPE.MYSUBSCRIPTIONS:
			paneObj = mySubscriptions;
			break;
		case CONTENT_TYPE.EMPTY:
			paneObj = emptyPane;
			break;
		}

		pane.update(paneType, paneObj, data.content, contentID, itemID);
	}

	/**
	 * @method hideMasterPane
	 */
	function hideMasterPane() {
		masterPane.hide();
		menuSeparator.hide();
		slavePane.setX(SLAVE_PANE_FULL_SCREEN_X);
		navigateBackArrow.show();
	}

	/**
	 * @method restoreMasterPane
	 */
	function restoreMasterPane() {
		if (navigation.getDepth() <= 2) {
			navigateBackArrow.hide();
		}
		slavePane.setX(SLAVE_PANE_DEFAULT_X);
		menuSeparator.show();
		masterPane.show();
	}

	/**
	 * @method showFullAssetCallback
	 * @param {Object} assetData
	 */
	function showFullAssetCallback(assetData) {
		view.navigationGroup.hide();
		fullAssetInfo.show();
		fullAssetInfo.update(assetData);
		currentMode = MODE.FULL_ASSET_INFO;
		$N.apps.util.EventManager.fire("mdsContentLoading", false);
	}

	/**
	 * @method showFullAssetInfo
	 * @param {Object} assetData
	 */
	function showFullAssetInfo(assetData) {
		log("showFullAssetInfo", "Enter");
		navigation.showFullAssetInfo(assetData, showFullAssetCallback);
		log("showFullAssetInfo", "Exit");
	}

	/**
	 * @method hideFullAssetInfo
	 */
	function hideFullAssetInfo() {
		log("hideFullAssetInfo", "Enter");
		fullAssetInfo.hide();
		view.navigationGroup.show();
		currentMode = MODE.NAVIGATION;
		log("hideFullAssetInfo", "Exit");
	}

	/**
	 * @method showDisclaimer
	 * @param {Function} successCallback
	 */
	function showDisclaimer(successCallback) {
		log("showDisclaimer", "Enter");
		var acceptCallback = function () {
			disclaimer.hide();
			breadcrumb.show();
			currentMode = MODE.NAVIGATION;
			successCallback();
		};
		view.navigationGroup.hide();
		breadcrumb.hide();
		currentMode = MODE.DISCLAIMER;
		disclaimer.setAcceptCallback(acceptCallback);
		disclaimer.show();
		log("showDisclaimer", "Exit");
	}

	/**
	 * @method resetNavigationCallback
	 * @param {Object} dataObject
	 */
	function resetNavigationCallback(dataObject) {
		updatePane(masterPane, dataObject, null);
		view.navigationGroup.show();
	}

	/**
	 * @method exitFullAssetInfo
	 */
	function exitFullAssetInfo() {
		log("exitFullAssetInfo", "Enter");
		if (navigation.getDepth() > 1) {
			hideFullAssetInfo();
		} else if (($N.apps.core.ContextManager.getLastContext().getId() === "SEARCH")) {
			hideFullAssetInfo();
			navigation.reset(resetNavigationCallback);
			$N.app.ContextHelper.closeContext();
		} else {
			$N.app.ContextHelper.closeContext();
		}
		log("exitFullAssetInfo", "Exit");
	}

	/**
	 * @method jumpToContentCallback
	 * @param {Object} activationObject
	 * @param {Object} dataObject
	 * @param {Object} parentDataObject
	 */
	function jumpToContentCallback(activationObject, dataObject, parentDataObject) {
		var idPath = activationObject.idPath,
			idPathLength = idPath.length;
		breadcrumb.setPath(activationObject.stringPath);
		if (navigation.isMasterInFocus()) {
			updatePane(masterPane, dataObject, idPath[idPathLength - 1], activationObject.target);
		} else {
			masterPane.defocus();
			slavePane.focus();
			updatePane(masterPane, parentDataObject, idPath[idPathLength - 2], idPath[idPathLength - 1]);
			updatePane(slavePane, dataObject, idPath[idPathLength - 1], activationObject.target);
			if (slavePane.getType() === $N.app.MDSUtil.CONTENT_TYPE.ASSETS) {
				hideMasterPane();
			} else if (slavePane.getType() !== $N.app.MDSUtil.CONTENT_TYPE.HIGHLIGHTS) {
				menuSeparator.show();
			}
			slavePane.show();
		}
		if (navigation.getFocusPane().getType() === $N.app.MDSUtil.CONTENT_TYPE.ASSETS ||
				navigation.getFocusPane().getType() === $N.app.MDSUtil.CONTENT_TYPE.MYCONTENT ||
				navigation.getFocusPane().getType() === $N.app.MDSUtil.CONTENT_TYPE.MYSUBSCRIPTIONS) {
			view.navigationGroup.menuFadeGradient.hide();
		}
		if (navigation.getDepth() > 2) {
			navigateBackArrow.show();
		}
		if (activationObject.navigateToAsset) {
			if (navigation.isMasterInFocus()) {
				showFullAssetCallback(masterGallery.getSelectedItem());
			} else {
				showFullAssetCallback(slaveGallery.getSelectedItem());
			}
		} else {
			view.navigationGroup.show();
		}
	}

	/**
	 * @method previewNextCallback
	 * @param {Object} targetInfo
	 * @param {Object} dataObject
	 */
	function previewNextCallback(targetInfo, dataObject) {
		if (navigation.isMasterInFocus()) {
			updatePane(slavePane, dataObject, targetInfo.id);
			if (slavePane.getType() !== $N.app.MDSUtil.CONTENT_TYPE.HIGHLIGHTS) {
				menuSeparator.show();
			} else {
				menuSeparator.hide();
			}
			slavePane.show();
			slavePane.animate();
		}
	}

	/**
	 * @method navigationCompleteCallback
	 * @param {Object} targetInfo
	 * @param {Object} dataObject
	 */
	function navigateDeeperCallback(targetInfo, dataObject) {
		var contentID = targetInfo.id;
		breadcrumb.push(targetInfo.title);
		toggleFocusPane();
		if (navigation.isMasterInFocus()) {
			if (!masterPane.isVisible()) {
				restoreMasterPane();
			}
			navigateBackArrow.show();
			menuSeparator.hide();
			slavePane.hide();
			updatePane(masterPane, dataObject, contentID);
		} else {
			updatePane(slavePane, dataObject, contentID);
			if (slavePane.getType() === $N.app.MDSUtil.CONTENT_TYPE.ASSETS) {
				hideMasterPane();
			} else if (slavePane.getType() !== $N.app.MDSUtil.CONTENT_TYPE.HIGHLIGHTS) {
				menuSeparator.show();
			} else {
				menuSeparator.hide();
			}
		}
		if (navigation.getFocusPane().getType() === $N.app.MDSUtil.CONTENT_TYPE.ASSETS ||
				navigation.getFocusPane().getType() === $N.app.MDSUtil.CONTENT_TYPE.MYCONTENT ||
				navigation.getFocusPane().getType() === $N.app.MDSUtil.CONTENT_TYPE.MYSUBSCRIPTIONS) {
			view.navigationGroup.menuFadeGradient.hide();
		} else {
			view.navigationGroup.menuFadeGradient.show();
		}
		if (navigation.getFocusPane().getType() === $N.app.MDSUtil.CONTENT_TYPE.CLUBE) {
			view.nowLogo.hide();
			breadcrumb.pop();
			breadcrumb.setX(708);
			view.nowClubeLogo.show();
		}

	}

	/**
	 * @method navigateBackCallback
	 * @param {Number} previousContentID
	 * @param {Number} contentID
	 * @param {Number} parentContentID
	 * @param {Object} dataObject
	 * @param {Object} parentDataObject
	 */
	function navigateBackCallback(previousContentID, contentID, parentContentID, dataObject, parentDataObject) {
		breadcrumb.pop();
		toggleFocusPane();
		if (navigation.isMasterInFocus()) {
			if (navigation.getDepth() <= 1) {
				view.nowClubeLogo.hide();
				breadcrumb.setX(364.5);
				view.nowLogo.show();
			}
			if (!masterPane.isVisible()) {
				restoreMasterPane();
			}
			updatePane(masterPane, dataObject, contentID, previousContentID);
		} else {
			if (navigation.getDepth() <= 2) {
				navigateBackArrow.hide();
			}
			updatePane(slavePane, dataObject, contentID, previousContentID);
			updatePane(masterPane, parentDataObject, parentContentID, contentID);

			if (slavePane.getType() === $N.app.MDSUtil.CONTENT_TYPE.ASSETS) {
				hideMasterPane();
			} else if (slavePane.getType() !== $N.app.MDSUtil.CONTENT_TYPE.HIGHLIGHTS) {
				menuSeparator.show();
			} else {
				menuSeparator.hide();
			}
		}
		if (navigation.getFocusPane().getType() !== $N.app.MDSUtil.CONTENT_TYPE.ASSETS &&
				navigation.getFocusPane().getType() !== $N.app.MDSUtil.CONTENT_TYPE.MYCONTENT &&
				navigation.getFocusPane().getType() !== $N.app.MDSUtil.CONTENT_TYPE.MYSUBSCRIPTIONS) {
			view.navigationGroup.menuFadeGradient.show();
		} else {
			view.navigationGroup.menuFadeGradient.hide();
		}
	}

	/**
	 * @method showSimilarRecommendations
	 */
	function showSimilarRecommendations(assetData) {
		log("showSimilarRecommendations", "Enter");
		var callback = function (data) {
				hideFullAssetInfo();
				navigation.navigateDeeperCallback(assetData, data, navigateDeeperCallback);
			},
			cancelCallback = function () {
				hideFullAssetInfo();
				$N.app.MDSUtil.clearRequest();
			};
		$N.app.MDSUtil.clearRequest();
		$N.apps.util.EventManager.fire("mdsContentLoading", true);
		$N.app.VODRecommendationServerHelper.getSimilarRecommendations(assetData.id, callback, cancelCallback);
		log("showSimilarRecommendations", "Exit");
	}

	/**
	 * @method resetNavigation
	 */
	function resetNavigation() {
		log("resetNavigation", "Enter");
		view.nowClubeLogo.hide();
		breadcrumb.setX(364.5);
		view.nowLogo.show();
		disclaimer.hide();
		hideFullAssetInfo();
		restoreMasterPane();
		view.navigationGroup.hide();
		view.navigationGroup.menuFadeGradient.show();
		menuSeparator.hide();
		navigateBackArrow.hide();
		slavePane.hide();
		breadcrumb.show();
		breadcrumb.reset();
		masterPane.focus();
		slavePane.defocus();
		masterPane.show();
		log("resetNavigation", "Exit");
	}

	/**
	 * @method errorDialogKeyHandler
	 * @param {String} button
	 * @param {String} key
	 */
	function errorDialogKeyHandler(button, key) {
		log("errorDialogKeyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap();
		if (isServiceTuneNeeded) {
			$N.app.ContextHelper.exitContext(serviceToTune);
		} else if (key === keys.KEY_EXIT) {
			$N.app.ContextHelper.exitContext();
		} else {
			$N.app.ContextHelper.closeContext();
		}
		log("errorDialogKeyHandler", "Exit");
	}

	/**
	 * @method navigationFailureCallback
	 * @param {Function} retryCallback
	 */
	function navigationFailureCallback(retryCallback, errorCode) {
		var buttonConfig = [
			{
				name: $N.app.MDSUtil.getString("retry"),
				action: function () {
					if (retryCallback) {
						retryCallback();
					}
				},
				simpleExit: true
			},
			{
				name: $N.app.MDSUtil.getString("cancel")
			}
		];
		errorCode = errorCode || $N.app.errorCodes.NOW.MDS_DATA_FAILURE;
		$N.app.DialogueHelper.showNowDialog(Now.getString("noNetworkTitle"), Now.getString("noNetworkText"), buttonConfig, null, errorCode, errorDialogKeyHandler);
	}

	/**
	 * @method showFailureDialog
	 * @param {String} errorCode
	 * @param {Function} dialogClosedCallback
	 */
	function showFailureDialog(errorCode, dialogClosedCallback) {
		log("showFailureDialog", "Enter");
		var buttonConfig = [
			{
				name: $N.app.MDSUtil.getString("cancel")
			}
		];
		errorCode = errorCode || $N.app.errorCodes.NOW.PLAYBACK_FAILURE;
		$N.app.DialogueHelper.showNowDialog(Now.getString("noTraxisTitle"), Now.getString("noTraxisText"), buttonConfig, null, errorCode, dialogClosedCallback);
		log("showFailureDialog", "Exit");
	}

	/**
	 * @method serverFailureCallback
	 * @param {String} errorCode
	 */
	function serverFailureCallback(errorCode) {
		log("serverFailureCallback", "Enter");
		showFailureDialog(errorCode, errorDialogKeyHandler);
		log("serverFailureCallback", "Exit");
	}

	/**
	 * @method assetFailureCallback
	 * @param {String} errorCode
	 */
	function assetFailureCallback(errorCode) {
		log("assetFailureCallback", "Enter");
		showFailureDialog(errorCode);
		log("assetFailureCallback", "Exit");
	}

	/**
	 * @method itemHighlightedImmediate
	 * @param {Object} data
	 */
	function itemHighlightedImmediate(data) {
		log("itemHighlightedImmediate", "Enter");
		$N.app.MDSUtil.clearRequest();
		log("itemHighlightedImmediate", "Exit");
	}

	/**
	 * @method itemHighlighted
	 * @param {Object} data
	 */
	function itemHighlighted(data) {
		log("itemHighlighted", "Enter");
		$N.app.MDSUtil.clearRequest();
		if (data && data.id) {
			navigation.previewNext(data, previewNextCallback);
		} else {
			if (navigation.isMasterInFocus()) {
				menuSeparator.hide();
				slavePane.hide();
			}
		}
		log("itemHighlighted", "Exit");
	}

	/**
	 * @method itemSelected
	 * @param {Object} data
	 */
	function itemSelected(data) {
		log("itemSelected", "Enter");
		var cancelCallback = function () {
			if (navigation.isMasterInFocus) {
				itemHighlighted(masterMenu.getSelectedItem());
			}
		};
		$N.app.MDSUtil.clearRequest();
		if (data) {
			if (data.action) {
				data.action();
			}
			if (data.id) {
				navigation.navigateDeeper(data, navigateDeeperCallback, cancelCallback);
			}
		}
		log("itemSelected", "Exit");
	}

	/**
	 * @method handleExit
	 */
	function handleExit() {
		$N.app.ClockDisplay.hide();
		$N.app.ContextHelper.exitContext(serviceToTune);
	}

	/**
	 * @method confirmExit
	 */
	function confirmExit() {
		$N.app.DialogueHelper.showNowDialog(
			Now.getString("attention"),
			Now.getString("confirmExitMessage"),
			[{
				name: Now.getString("yes"),
				action: function () {
					if (isServiceTuneNeeded) {
						$N.app.ContextHelper.exitContext(serviceToTune);
					} else {
						$N.app.ContextHelper.closeContext();
					}
				}
			}, {
				name: Now.getString("no")
			}]
		);
	}

	/**
	 * @method createMenu
	 * @param {Object} itemConfig
	 * @param {Object} menuConfig
	 */
	function createMenu(itemConfig, menuConfig) {
		log("createMenu", "Enter");
		var newMenu = new $N.gui.PageableListWithArrows(document.getElementById("content").ownerDocument);
		newMenu.configure({
			itemHeight: 87,
			itemTemplate: $N.gui.NowMenuItem,
			itemSelectedCallback: itemSelected,
			visibleItemCount: 7,
			itemConfig: itemConfig,
			itemHighlightedImmediateCallback: itemHighlightedImmediate,
			dataMapper: $N.app.MDSUtil.assetDataMapper
		});
		if (menuConfig) {
			newMenu.configure(menuConfig);
		}
		newMenu.initialise();
		log("createMenu", "Exit");
		return newMenu;
	}

	/**
	 * @method checkDisclaimer
	 * @param {Function} successCallback
	 */
	function checkDisclaimer(successCallback) {
		log("checkDisclaimer", "Enter");
		if ($N.platform.system.Preferences.get($N.app.constants.PREF_NOW_DISCLAIMER_ACCEPTED) !== "true") {
			showDisclaimer(successCallback);
		} else {
			successCallback();
		}
		log("checkDisclaimer", "Exit");
	}

	/**
	 * @method clearPinEntryFlags
	 * Resets temporary pin entry flags for navigation section
	 * as pin handling has to be done in a different way 
	 * in NOW compared to other areas
	 */
	function clearPinEntryFlags() {
		navigation.setAssetRatingPinEntryFlag(false);
		navigation.setAssetAdultPinEntryFlag(false);
	}

	/**
	 * @method activate
	 * @param {Object} activationObject
	 */
	function activate(activationObject) {
		log("activate", "Enter");
		var continueActivation = function () {
			var target = activationObject ? activationObject.target : null,
				idPath = activationObject ? activationObject.idPath : null;
			if (target || (idPath && idPath.length > 0)) {
				if (activationObject.directToAsset === true) {
					navigation.jumpToContent(activationObject, showFullAssetInfo);
				} else {
					navigation.jumpToContent(activationObject, jumpToContentCallback);
				}
			} else {
				navigation.reset(resetNavigationCallback);
			}
		};
		isServiceTuneNeeded = (activationObject && activationObject.previousService) ? true : false;
		serviceToTune = $N.app.ChannelManager.getBarkerChannel();
		view.navigationGroup.hide();
		$N.app.ClockDisplay.show();
		$N.app.BrandHelper.hideAll();
		resetNavigation();
		//$N.app.TraxisUtil.favourites.getFavourites();
		//checkDisclaimer(continueActivation);
		//clearPinEntryFlags();
		//$N.app.VODRecommendationServerHelper.createGeneralRecommendations();
		log("activate", "Exit");
	}

	/**
	 * @method initialiseComponents
	 */
	function initialiseComponents() {
		log("initialiseComponents", "Enter");
		var docRef = document.getElementById("content").ownerDocument,
			keepCurrentUser = true;
		breadcrumb = view.breadcrumb;
		loadingBar = view.loadingBar;
		disclaimer = view.disclaimer;

		$N.apps.util.EventManager.create("nowFavouriteRemoved");

		$N.apps.dialog.PinDialog.GUITemplateObject = $N.gui.NowPinDialog;
		pinHelper = new $N.app.PinHelper(null, null, null, null, 0, keepCurrentUser);
		pinHelper.setDialogProperties({
			x: 0,
			y: 0,
			width: 1920,
			height: 1080,
			id: "now",
			parentalIconVisible: true
		});
		purchasePinHelper = new $N.app.PinHelper(null, null, null, null, 0);
		purchasePinHelper.setDialogProperties({
			x: 0,
			y: 0,
			width: 1920,
			height: 1080,
			id: "now",
			parentalIconVisible: false
		});
		$N.apps.dialog.PinDialog.GUITemplateObject = $N.gui.PinDialog;

		masterPane = view.navigationGroup.masterPane;
		slavePane = view.navigationGroup.slavePane;

		menuSeparator = view.navigationGroup.menuSeparator;
		navigateBackArrow = view.navigationGroup.navigateBackArrow;

		fullAssetInfo = view.fullAssetInfo;
		fullAssetInfo.configure({
			dataMapper: $N.app.MDSUtil.assetDataMapper,
			serverFailureCallback: serverFailureCallback,
			assetFailureCallback: assetFailureCallback,
			exitCallback: exitFullAssetInfo,
			similarRecommendationsCallback: showSimilarRecommendations
		});

		masterMenu = createMenu({
			width: 575
		});
		masterMenu.setItemHighlightedCallback(itemHighlighted);
		slaveMenu = createMenu({
			isMaster: false,
			width: 1120
		}, {
			x: 40
		});

		clube = new $N.gui.NowClube(docRef);
		clube.setItemSelectedCallback(itemSelected);

		highlights = new $N.gui.NowHighlights(docRef);
		highlights.setItemConfig({
			itemSelectedCallback: function (data) {
				data.activationObject.idPath.splice(0, 0, null);
				activate(data.activationObject);
			}
		});
		highlights.initialise();

		defaultGallerySelectedCallback = showFullAssetInfo;
		overrideGallerySelectedCallback = itemSelected;

		masterGallery = new $N.gui.NowGallery(docRef);
		masterGallery.setItemSelectedCallback(defaultGallerySelectedCallback);

		slaveGallery = new $N.gui.NowGallery(docRef);
		slaveGallery.setItemSelectedCallback(defaultGallerySelectedCallback);

		emptyPane = new $N.gui.NowEmptyPane(docRef);

		myContent = new $N.gui.NowMyContent(docRef);
		myContent.setItemSelectedCallback(showFullAssetInfo);
		updateMyContentText();

		mySubscriptions = new $N.gui.NowMySubscriptions(docRef);
		mySubscriptions.setItemSelectedCallback(function () {});
		updateMySubscriptionsText();

		$N.apps.util.EventManager.subscribe("mdsContentLoading", function (loading) {
			if (loading) {
				loadingBar.setText(Now.getString("loading"));
			}
			loadingBar.setLoading(loading.data);
		}, this);
		log("initialiseComponents", "Exit");
	}

	/**
	 * @method fetchSupplementaryCategoryData
	 */
	function fetchSupplementaryCategoryData() {
		var netMdsServer = $N.platform.system.Preferences.get("/network/siconfig/CustomDescriptorTags/netMdsServer", true),
			url = null,
			failureCallback = function () {
				if (overrideDataRetryTimeout) {
					clearTimeout(overrideDataRetryTimeout);
				}
				overrideDataRetryTimeout = setTimeout(function () {
					fetchSupplementaryCategoryData();
					overrideDataRetryTimeout = null;
				}, $N.app.constants.MINUTE_IN_MS * 0.5);
			};
		if ($N.app.Config.getConfigValue("mds.developer.mode") === "on") {
			netMdsServer = $N.app.Config.getConfigValue("mds.developer.server");
		}
		url = netMdsServer + $N.app.Config.getConfigValue("now.catalogue.override.url");
		if (url && $N.app.NetworkUtil.isNetworkAvailable()) {
			$N.app.NetworkUtil.ajaxRequest(url, function (response) {
				var responseItem,
					catalogueNames = [];
				response = JSON.parse(response);
				for (responseItem in response) {
					if (response.hasOwnProperty(responseItem)) {
						catalogueNames.push(encodeURIComponent(responseItem));
					}
				}
				$N.app.MDSUtil.getNodesByNameArray(catalogueNames, function (results) {
					var i,
						loopLength = results.length,
						resultItem,
						finalData = {};
					for (i = 0; i < loopLength; i++) {
						resultItem = results[i];
						finalData[resultItem.id] = response[resultItem.title];
					}
					navigation.setSupplementaryCategoryData(finalData);
				}, failureCallback);
			}, failureCallback);
		} else {
			failureCallback();
		}
	}

	/**
	 * @method updateHardCodedMenus
	 */
	function updateHardCodedMenus() {
		var activeNowcatalogues = [],
			nowcatalogues = [
				{
					id: $N.app.constants.VOD_MENU_RECOMMENDATIONS,
					title: Now.getString("vodRecommendations"),
					Rating: {
						code: 1
					},
					isActive: $N.app.FeatureManager.isVODRecommendationEnabled()
				},
				{
					id: $N.app.constants.VOD_MENU_SEARCH,
					title: Now.getString("textSearch"),
					Rating: {
						code: 1
					},
					isActive: true
				},
				{
					id: $N.app.constants.VOD_MENU_MY_VIDEOS,
					title: Now.getString("textMyContent"),
					Rating: {
						code: 1
					},
					isActive: true
				},
				{
					id: $N.app.constants.VOD_MENU_EXIT,
					title: Now.getString("textExit"),
					action: function () {
						handleExit();
					},
					Rating: {
						code: 1
					},
					isActive: true
				}
			],
			i;

		for (i = 0; i < nowcatalogues.length; i++) {
			if (nowcatalogues[i].isActive) {
				activeNowcatalogues.push(nowcatalogues[i]);
			}
		}
		$N.app.MDSUtil.setDefaultNOWCatalogues(activeNowcatalogues);
		$N.app.MDSUtil.setMyContentCatalogues([
			{
				id: $N.app.constants.VOD_MENU_MY_VIDEOS_RENTED,
				title: Now.getString("textRentals"),
				Rating: {
					code: 1
				}
			}, {
				id: $N.app.constants.VOD_MENU_MY_VIDEOS_SUBSCRIPTIONS,
				title: Now.getString("textSubscriptions"),
				Rating: {
					code: 1
				}
			}, {
				id: $N.app.constants.VOD_MENU_MY_VIDEOS_ADULT,
				title: Now.getString("textAdultContent"),
				Rating: {
					code: $N.app.ParentalControlUtil.PARENTAL_RATING_ADULT_VALUE
				}
			}, {
				id: $N.app.constants.VOD_MENU_MY_VIDEOS_FAVORITES,
				title: Now.getString("textFavourites"),
				Rating: {
					code: 1
				}
			}
		]);
		$N.app.MDSUtil.setSearchCatalogues([
			{
				id: "",
				title: Now.getString("textSearchByTitle"),
				action: function () {
					$N.app.ContextHelper.openContext("SEARCH", {
						activationContext: {
							isVodSearch: true,
							searchType: "title",
							confirmLeftExit: false
						}
					});
				},
				Rating: {
					code: 1
				}
			}, {
				id: "",
				title: Now.getString("textSearchByActorDir"),
				action: function () {
					$N.app.ContextHelper.openContext("SEARCH", {
						activationContext: {
							isVodSearch: true,
							searchType: "actors",
							confirmLeftExit: false
						}
					});
				},
				Rating: {
					code: 1
				}
			}
		]);
	}



	/**
	 * @method load
	 */
	function load() {
		log("load", "Enter");
		$N.gui.ResolutionManager.initialiseContext(document);
		$N.apps.core.Language.importLanguageBundleForObject(Now, Now.init, "apps/now/common/", "LanguageBundle.js", function () {
			updateMyContentText();
			updateHardCodedMenus();
		}, window);
		log("load", "Exit");
	}

	/**
	 * @method init
	 */
	function init() {
		log("init", "Enter");
		$N.gui.FrameworkCore.loadGUIFromXML("apps/now/view/now.xml", document.getElementById("content"), view, window);
		$N.services.sdp.MetadataService.setVODSortOrder([["voditem.DisplayPriority", 1]]);
		$N.services.sdp.MetadataService.setVODNodeSortOrder([["nodeOrder", 1]]);
		initialiseComponents();
		navigation = $N.app.NowNavigation;
		navigation.setFailureCallback(navigationFailureCallback);
		navigation.setErrorDialogKeyHandler(errorDialogKeyHandler);
		navigation.initialise(masterPane, slavePane, pinHelper);
		playback = $N.app.NowPlayback;
		playback.setFailureCallback(serverFailureCallback);
		playback.initialise(navigation, purchasePinHelper, $N.app.DialogueHelper.showNowDialog);
		updateHardCodedMenus();
		fetchSupplementaryCategoryData();
		$N.app.MDSUtil.setDataAugmentFunction(augmentCatalogueData);
		$N.apps.core.ContextManager.initialisationComplete(Now);
		log("init", "Exit");
	}

	/**
	 * @method passivate
	 */
	function passivate() {
		log("passivate", "Enter");
		$N.app.MDSUtil.clearRequest();
		$N.app.ClockDisplay.hide();
		clearPinEntryFlags();
		log("passivate", "Exit");
	}

	/**
	 * @method keyHandler
	 * @param {String} key
	 * @return {bool} handled
	 */
	function keyHandler(key) {
		log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;
		$N.app.MemoryUtil.setOrUpdateGarbageCollectTimeoutAndInterval();

		switch (currentMode) {
		case MODE.NAVIGATION:
			handled = navigation.getFocusPane().keyHandler(key);
			break;
		case MODE.FULL_ASSET_INFO:
			handled = fullAssetInfo.keyHandler(key);
			break;
		case MODE.DISCLAIMER:
			handled = disclaimer.keyHandler(key);
			break;
		}

		if (!handled) {
			switch (key) {
			case keys.KEY_LEFT:
				if (navigation.getDepth() > 1) {
					$N.app.MDSUtil.clearRequest();
					navigation.navigateBack(navigateBackCallback);
				} else {
					confirmExit();
				}
				handled = true;
				break;
			case keys.KEY_BACK:
				if (navigation.getDepth() > 1) {
					$N.app.MDSUtil.clearRequest();
					navigation.navigateBack(navigateBackCallback);
				} else {
					if (isServiceTuneNeeded) {
						$N.app.ContextHelper.exitContext(serviceToTune);
					} else {
						$N.app.ContextHelper.closeContext();
					}
				}
				handled = true;
				break;
			case keys.KEY_VOD:
			case keys.KEY_VIEW:
			case keys.KEY_EXIT:
				handleExit();
				handled = true;
				break;
			}
		}
		log("keyHandler", "Exit");
		return handled;
	}

	/**
	 * @method toString
	 * @return {String}
	 */
	function toString() {
		return "NOW";
	}

	return {
		load: load,
		init: init,
		activate: activate,
		passivate: passivate,
		keyHandler: keyHandler,
		toString: toString
	};

}(window.parent.$N));
