/*global Portal*/
/**
 * Portal.
 * @module portal-menu
 */

/**
 * Controller class that defines the behaviour of the portal menu
 * application. This is the entry point of all the applications.
 * @class Portal
 * #depends PortalWindow.js
 * #depends view/PortalMessages.js
 * #depends view/RecordingPromotionItem.js
 * #depends view/MusicPromotionItem.js
 * #depends view/PortalIconTextItem.js
 * @static
 * @param {Object} $N namespace entry point
 */
var Portal = (function ($N) {
   
	var log = new $N.apps.core.Log("Portal", "Portal"),
		view = {},
		menu = null,
		PVRSubscriptionIds = [],
		PlaybackSubscriptionIds = [],
		mailStatusChangedSubID = null,
		menuItemMode = null,
       
		dataMapper = {
			getTitle: function (obj) {
				return Portal.getString(obj.title);
			},
			getLogo: function (obj) {
				return obj.logo;
			},
			getLogoHighlight: function (obj) {
				return obj.logoHighlight;
			},
			getLogoIndicator: function (obj) {
				if (obj.logoIndicator) {
					if (obj.title === "menuMessages" && $N.app.MessageUtil.hasMessageMailUnread()) {
						return obj.logoIndicator;
					}
				}
				return null;
			},
			getLogoIndicatorHighlight: function (obj) {
				if (obj.logoIndicatorHighlight) {
					if (obj.title === "menuMessages" && $N.app.MessageUtil.hasMessageMailUnread()) {
						return obj.logoIndicatorHighlight;
					}
				}
				return null;
			}
		},
		menuItems = null,
		isWindowSelected = false,
		portalWindow = null,
		pin = "",
		pinTimer = null,
		usageidOverride = false,
		mediaPlaybackSubscriptionId = null,
		DLNA_TIMER_INTERVAL = 3000; //The interval after which getDevicesOK listener for DLNA will be handled.

	function isHomeNetworkActive() {
		return ($N.app.FeatureManager.getMediaPlaybackFeatureStatus() && ($N.app.DlnaHelper.getAvailableDevices().length > 0) ? true : false);
	}

	/**
	 * Method to return the state of PVR
	 * @method isPVRActive
	 * @private
	 * @return {Boolean} true is PVR is enabled, otherwise false.
	 */
	function isPVRActive() {
		log("isPVRActive", "Enter & Exit");
		return $N.app.PVRCapability.isPVREnabled(true);
	}

	menuItems = [
		{
			title: "menuWatchTV",
			context: "ZAPPER",
			itemHandlerData: {
				getData: $N.app.PortalUtil.getWindowData,
				activationObject: {
					mode: "tv"
				}
			},
			logo: "../../../customise/resources/images/net/menu_portal_assistirtv_b.png",
			logoHighlight: "../../../customise/resources/images/net/menu_portal_assistirtv_w.png"
		}, {
			title: "menuNow",
			active: $N.app.FeatureManager.isVODEnabled,
			context: "NOW",
			itemHandlerData: {
				getData: $N.app.PortalUtil.getWindowData,
				activationObject: {
					mode: "NOW"
				}
			},
			logo: "../../../customise/resources/images/net/menu_portal_now_b.png",
			logoHighlight: "../../../customise/resources/images/net/menu_portal_now_w.png"
		}, {
			title: "menuTVGuide",
			context: "LISTGUIDE",
			itemHandlerData: {
				getData: $N.app.PortalUtil.getWindowData,
				activationObject: {
					mode: "guide"
				}
			},
			logo: "../../../customise/resources/images/net/menu_portal_guia_b.png",
			logoHighlight: "../../../customise/resources/images/net/menu_portal_guia_w.png"
		}
	];

	/**
	 * Returns the list of active options available in the portal menu
	 * @method getActiveMenuItems
	 * @private
	 * @return {Array} The menu items.
	 */
	function getActiveMenuItems() {
		return menuItems.filter(function (menuItem) {
			return (!menuItem.active || menuItem.active());
		});
	}
	/**
	 * Return the index in menu by the specific context
	 * @method getMenuIndexByContext
	 * @private
	 * @param {String} context, e.g.: "ZAPPER", "MUSIC".
	 * @return {Number}
	 */
	function getMenuIndexByContext(context) {
		var i,
			menuData = menu.getData();
		for (i = 0; i < menuData.length; i++) {
			if (context === menuData[i].context) {
				return i;
			}
		}
		return 0;
	}

	/**
	 * Returns the index in the MENU_DATA array of item matching the
	 * given contextName
	 * @method getIndexOfMenuItemForContext
	 * @private
	 * @param {String} contextName
	 *
	 * @return The menu index of the provided context.
	 */
	function getIndexOfMenuItemForContext(contextName) {
		var i,
			menuData = menu.getData(),
			menuDataLength = menuData.length;
		for (i = 0; i < menuDataLength; i++) {
			if (menuData[i].context && menuData[i].context === contextName) {
				return i;
			}
		}
		return null;
	}

	/**
	 * @method setMenuData
	 * @private
	 */
	function setMenuData() {
		menu.setData(getActiveMenuItems());
	}

	function portalUpdate(selectedItem) {
		menu.displayData(true, true); // TODO: combine with redrawPortal()
	}

	function subscribeMailStatusChangedEvent() {
		if (!mailStatusChangedSubID) {
			mailStatusChangedSubID = $N.apps.util.EventManager.subscribe("allMailsRead", portalUpdate, this);
		}
	}

	function unSubscribeMailStatusChangedEvent() {
		if (mailStatusChangedSubID) {
			$N.apps.util.EventManager.unSubscribe(mailStatusChangedSubID);
			mailStatusChangedSubID = null;
		}
	}

	/**
	 * @method refreshPortalWindowData
	 * @private
	 */
	function refreshPortalWindowData() {
		var selectedItem = menu.getSelectedItem(),
			mode;
		if (selectedItem && selectedItem.itemHandlerData.refreshOnFocus) {
			mode = selectedItem.itemHandlerData.activationObject.mode;
			selectedItem.itemHandlerData.getData(mode, function (data) {
				if (data && $N.apps.core.ContextManager.getActiveContext().getId() === "PORTAL") {
					portalWindow.refreshData(data);
				}
			});
		}
	}

	/**
	 * @method subscribeOnTasksChangedEvent
	 * @private
	 */
	function subscribeOnTasksChangedEvent() {
		window.parent.CCOM.Scheduler.addEventListener("onTasksChanged", refreshPortalWindowData);
	}

	/**
	 * @method unSubscribeOnTasksChangedEvent
	 * @private
	 */
	function unSubscribeOnTasksChangedEvent() {
		window.parent.CCOM.Scheduler.removeEventListener("onTasksChanged", refreshPortalWindowData, false);
	}

	/**
	 * Find a menu item, regardless of whether it's visible or not
	 * @method findMenuItemIndex
	 * @private
	 * @return index of the menu item, or -1 if not found
	 */
	function findMenuItemIndex(menuName) {
		var i = 0;

		for (i = 0; i < menuItems.length; i++) {
			if (menuName === menuItems[i].title) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Activates or highlights the menu Item based on the parameter passed
	 * @method restorePortalSelection
	 * @param {Object} menuItem : item to be highlighted.
	 * @param {boolean} isSelect : true will activate the portal window, false will just preview.
	 * @param {Number} currentPreviewIndex : previously selected cell index.
	 * @private
	 */
	function restorePortalSelection(menuItem, isSelect, currentPreviewIndex) {
		log("restorePortalSelection", "Enter");
		var activationObject;
		if (menuItem) {
			activationObject = {
				mode: menuItem.itemHandlerData.activationObject.mode
			};
			portalWindow.unPreview();
			if (menuItem.itemHandlerData.getData) {
				menuItem.itemHandlerData.getData(activationObject.mode, function (data) {
					if (data) {
						activationObject.data = data;
						if (isSelect) {
							menu.defocus();
							portalWindow.preview(activationObject);
							isWindowSelected = true;
							if (currentPreviewIndex !== null) {
								portalWindow.getCurrentTable().setRootCellIndex(currentPreviewIndex);
							}
							portalWindow.activate(activationObject);
						} else {
							portalWindow.preview(activationObject);
						}
					}
				});
			}
		}
		log("restorePortalSelection", "Exit");
	}

	/**
	 * @method getCurrentMenuItemIndex
	 * method to get the current menuItem index based on both recording and NOW availability
	 * @param {number} itemHighlightIndex: current item highlighted index
	 * @private
	 */
	function getCurrentMenuItemIndex(itemHighlightIndex) {
		log("getCurrentMenuItemIndex", "Enter");
		var isPVREnabled = isPVRActive(),
			currentMenuItemIndex;
		if (!isPVREnabled && !$N.app.FeatureManager.isVODEnabled()) {
			currentMenuItemIndex = itemHighlightIndex - 1;
		} else if (!isPVREnabled || !$N.app.FeatureManager.isVODEnabled()) {
			currentMenuItemIndex = itemHighlightIndex;
		} else {
			currentMenuItemIndex = itemHighlightIndex + 1;
		}
		log("getCurrentMenuItemIndex", "Exit");
		return currentMenuItemIndex;
	}

	// TODO: Fix this function with NETUI-1651
	/**
	 * redraws the portal menu
	 * highlight is brought back to the previously highlighted component
	 * @method redrawPortalMenu
	 * @private
	 */
	function redrawPortalMenu() {
		log("redrawPortalMenu", "Enter");
		var dvrMenuItemIndex = findMenuItemIndex("menuDVR"),
			itemHighlightIndex = 0,
			currentMenuItemIndex = 0,
			currentPreviewIndex = null,
			portalWindowTable = portalWindow.getCurrentTable(),
			selectedItem = menu.getSelectedItem(),
			currentlySelectedItemTitle = (selectedItem) ? selectedItem.title : null,
			activeMenuItems;

		//currentPreviewIndex gets back the index of the portal Window Table that is currently highlighted.
		if (portalWindowTable && portalWindowTable.getController()) {
			currentPreviewIndex = portalWindowTable.getController().getSelectedCellIndex();
		}

		//setting the property for the menuDVR item based on PVR Enabled or Disabled.
		if (dvrMenuItemIndex !== -1) {
			menuItems[dvrMenuItemIndex].active = isPVRActive;
			menuItems[dvrMenuItemIndex].context = "LIBRARY";
		}

		activeMenuItems = getActiveMenuItems();

		//get index of the current context from menuItems
		activeMenuItems.some(function (activeMenuItem, i) {
			if (activeMenuItem.itemHandlerData.activationObject.mode === menuItemMode) {
				itemHighlightIndex = i;
				return true;
			}
		});

		//resets the item selection to 0 if inside Media Playback or Home Network
		if (currentlySelectedItemTitle === "menuUSBPlayback" || currentlySelectedItemTitle === "menuHomeNetwork") {
			itemHighlightIndex = 0;
			menuItemMode = null;
		}

		currentMenuItemIndex = itemHighlightIndex + 1;

		menu.setData(activeMenuItems);
		menu.selectItemAtIndex(currentMenuItemIndex);
		menu.displayData(false, true);

		if (!currentlySelectedItemTitle || currentlySelectedItemTitle !== menu.getSelectedItem().title) {
			//menu item gets previewed or activated based on Portal Window selection.
			if (isWindowSelected) {
				restorePortalSelection(activeMenuItems[itemHighlightIndex], true, currentPreviewIndex);
			} else {
				restorePortalSelection(activeMenuItems[itemHighlightIndex], false);
			}
		}
		log("redrawPortalMenu", "Exit");
	}

	/**
	 * @method PVRStatusUpdateListener
	 * @status {Object} the status object for PVR
	 * @private
	 */
	function PVRStatusUpdateListener(status) {
		log("PVRStatusUpdateListener", "Enter");
		redrawPortalMenu();
		log("PVRStatusUpdateListener", "Exit");
	}

	/**
	 * @method subscribeToPVRCapabilitiesEvent
	 * @private
	 */
	function subscribeToPVRCapabilityEvent() {
		if (PVRSubscriptionIds.length === 0) {
			// we are adding these subscribe events to an array as we do not specifically need to know the Ids
			PVRSubscriptionIds = $N.app.PVRCapability.subscribeToPVRCapabilityEvent(PVRStatusUpdateListener, PVRStatusUpdateListener, Portal);
		}
	}

	/**
	 * @method unsubscribeFromPVRStatusUpdateEvent
	 * @private
	 */
	function unsubscribeFromPVRStatusUpdateEvent() {
		PVRSubscriptionIds = $N.app.PVRCapability.unSubscribeFromPVRCapabilityEvent(PVRSubscriptionIds);
	}

	function usbMediaPlaybackListener(status) {
		var usbIndex = findMenuItemIndex("menuUSBPlayback");
		menuItems[usbIndex].active = $N.app.UsbBrowserHelper.getMediaPlaybackStatus;
		redrawPortalMenu();
	}
	/**
	 * @method subscribeToUsbMediaPlaybackEvent
	 * @private
	 */
	function subscribeToUsbMediaPlaybackEvent() {
		if (PlaybackSubscriptionIds.length === 0) {
			// we are adding these subscribe events to an array as we do not specifically need to know the Ids
			PlaybackSubscriptionIds = $N.app.UsbBrowserHelper.subscribeToUsbMediaPlaybackEvent(usbMediaPlaybackListener, usbMediaPlaybackListener, Portal);
		}
	}
	/**
	 * @method unSubscribeToUsbMediaPlaybackEvent
	 * @private
	 */
	function unSubscribeToUsbMediaPlaybackEvent() {
		PlaybackSubscriptionIds = $N.app.UsbBrowserHelper.unSubscribeToUsbMediaPlaybackEvent(PlaybackSubscriptionIds);
	}
	/**
	 * @method itemHighlightedImmediate
	 * @param {Object} menuItem
	 * @private
	 */
	function itemHighlightedImmediate(menuItem) {
		portalWindow.unPreview();
	}

	/**
	 * show(or)hide the arrows that appear with a menu, when total items are more than the visible ones, based on current activity
	 * @method scrollIndicatorHandler
	 * @private
	 * @param {Object}component, {Object}scrollGroupObj
	 */
	function scrollIndicatorHandler(scrollGroupObj) {
		var isAtFirstPage = menu._data.isAtFirstPage(),
			isAtLastPage = menu._data.isAtLastPage();
		if (menu.getSize() > menu.getVisibleItemCount()) {
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
	 * @method itemHighlighted
	 * @param {Object} menuItem
	 * @private
	 */
	function itemHighlighted(menuItem) {
		log("itemHighlighted", "Enter");
		var activationObject = {},
			scrollComponent = view.scrollIndicator;
		menuItemMode = menuItem.itemHandlerData.activationObject.mode;
		if (menuItem.itemHandlerData.getData) {
			activationObject.mode = menuItem.itemHandlerData.activationObject.mode;
			menuItem.itemHandlerData.getData(activationObject.mode, function (data, mode, forcePreview) {
				log("getItemHandlerDataCallback", "Enter");
				if (forcePreview || (mode === menuItemMode && data)) {
				    activationObject.data = data;
				    $N.app.PortalWindow.activationObject = activationObject;
					portalWindow.preview(activationObject);
				}
				log("getItemHandlerDataCallback", "Exit");
			});
		}

		if (scrollComponent) {
			scrollIndicatorHandler(scrollComponent);
		}
		log("itemHighlighted", "Exit");
	}

	function dlnaOptionSelectedCallback(item) {
		var activationObject = {mode: "dlna", helper: $N.app.DlnaHelper};
		if (item) {
			$N.app.DlnaHelper.setDeviceParameters(item);
			$N.app.ContextHelper.openContext("MEDIABROWSER", {activationContext: activationObject});
			$N.app.DlnaHelper.hideDlnaDeviceListDialog();
		}
	}

	/**
	 * @method itemSelected
	 * @param {Object} menuItem
	 * @param {Boolean} isOKPressed (optional)
	 * @private
	 */
	function itemSelected(menuItem, isOKPressed) {
		log("itemSelected", "Enter");
		var activationObject;
		if (!isOKPressed) {
			activationObject = {
				mode: menuItem.itemHandlerData.activationObject.mode
			};
			if (menuItem.itemHandlerData.getData) {
				menuItem.itemHandlerData.getData(activationObject.mode, function (data) {
					if (data) {
						activationObject.data = data;
						menu.defocus();
						portalWindow.activate(activationObject);
						isWindowSelected = true;
					}
				});
			}
		} else if (menuItem && menuItem.context) {
			switch (menuItem.context) {
			case "MESSAGES":
				return;
			case "ZAPPER":
				$N.app.ContextHelper.openContext("ZAPPER", {activationContext: {showBanner: true}});
				return;
			case "MUSIC":
				activationObject = {
					activeMode: "portal"
				};
				break;
			case "SEARCH":
				activationObject = {
					confirmLeftExit: true
				};
				break;
			case "SETTINGS":
				activationObject = {
					id: menuItem.itemHandlerData.activationObject.id,
					isFromPortal: true
				};
				break;
			case "MEDIABROWSER":
				activationObject = menuItem.itemHandlerData.activationObject;
				if (activationObject.mode === 'dlna') {
					//add the callback here. Respective callback should be called based on the available devices count.
					$N.app.DlnaHelper.showDeviceList(dlnaOptionSelectedCallback, Portal.getString("dlnaPopUpTitle"), Portal.getString("dlnaPopUpMessage"));
					return;
				}
				break;
			}
			$N.app.ContextHelper.openContext(menuItem.context, {activationContext: activationObject});
		}
		log("itemSelected", "Exit");
	}

	/**
	 * @method clearTimer
	 */
	function clearTimer() {
		if (pinTimer) {
			clearTimeout(pinTimer);
		}
		pinTimer = null;
	}

	/**
	 * @method setPinTimer
	 */
	function setPinTimer() {
		clearTimer();
		pinTimer = setTimeout(
			function () {
				pin = "";
				clearTimer();
			},
			$N.app.constants.CHANNEL_ENTRY_TIMEOUT_MS
		);
	}

	/**
	 * Function to check if the correct factory reset pin is entered,
	 * If so the user will be redirected to first install for factory reset
	 * @method checkPin
	 * @private
	 * @param {Number} key
	 */
	function checkPin(key) {
		if (pin.length < 4) {
			pin += key;
		}
		if (pin.length === 4) {
			if (pin === $N.app.Config.getConfigValue("first.install.pin")) {
				$N.app.ContextHelper.openContext("FIRSTINSTALL");
			} else {
				pin = "";
			}
		}
		setPinTimer();
	}

	/**
	 * callback method that handles the dlna events like device lost/link down/link up.
	 * All these events eventually raise the getDevicesOK callback.
	 * When the callback is fired, portal menu gets redrawn
	 * @method onGetDevicesOK
	 * @private
	 */
	function onGetDevicesOK(e) {
		var dlnaIndex = null,
			testTimer = null;
		if (testTimer) {
			clearTimeout(testTimer);
		}
		//getDevicesOK listener gets fired multiple times.Each activation brings back different results.
		//so setting a timer that waits till the result is totally fetched.
		testTimer = setTimeout(function () {
			dlnaIndex = findMenuItemIndex("menuHomeNetwork");
			menuItems[dlnaIndex].active = isHomeNetworkActive;
			redrawPortalMenu();
			testTimer = null;
		}, DLNA_TIMER_INTERVAL);
	}
	/**
	 * subscribes the device detected event.
	 * @method subscribeToDlnaDeviceDetectEvent
	 * @private
	 */
	function subscribeToDlnaDeviceDetectEvent() {
		$N.app.DlnaHelper.registerGetDevicesOkEvent(onGetDevicesOK);
	}

	/**
	 * subscribes the device detected event.
	 * @method subscribeToMediaPlaybackFeatureEvent
	 * @private
	 */
	function subscribeToMediaPlaybackFeatureEvent() {
		if (!mediaPlaybackSubscriptionId) {
			mediaPlaybackSubscriptionId = $N.apps.util.EventManager.subscribe("MediaPlaybackFeatureStatusUpdated", usbMediaPlaybackListener, this);
		}
	}

	/**
	 * subscribes the device detected event.
	 * @method unSubscribeToMediaPlaybackFeatureEvent
	 * @private
	 */
	function unSubscribeToMediaPlaybackFeatureEvent() {
		if (mediaPlaybackSubscriptionId) {
			$N.apps.util.EventManager.unSubscribe(mediaPlaybackSubscriptionId);
			mediaPlaybackSubscriptionId = null;
		}
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
			$N.apps.core.Language.importLanguageBundleForObject(Portal, Portal.init, "apps/portal/common/", "LanguageBundle.js", null, window);
			log("load", "Exit");
		},

		/**
		 * Application lifecycle initialisation method to create the view
		 * @method init
		 */
		init: function () {
			log("init", "Enter");
			$N.gui.FrameworkCore.loadGUIFromXML("apps/portal/view/portal.xml", document.getElementById("content"), view, window);
			menu = view.menuList;
			menu.setDataMapper(dataMapper);
			menu.setItemHighlightedImmediateCallback(itemHighlightedImmediate);
			menu.setItemHighlightedCallback(itemHighlighted);
			menu.setItemSelectedCallback(itemSelected);

			menu.initialise();

			subscribeToPVRCapabilityEvent();
			subscribeToUsbMediaPlaybackEvent();
			portalWindow = $N.app.PortalWindow;
			portalWindow.setExitCallback(function () {
				portalWindow.passivate();
				menu.focus();
				isWindowSelected = false;
			});
			portalWindow.initialise(view.portalWindow);
			$N.apps.util.EventManager.subscribe("menuLanguageChanged", redrawPortalMenu, this);
			$N.apps.core.ContextManager.initialisationComplete(Portal);

			usageidOverride = ($N.app.Config.getConfigValue("usageid.manual.override") === "true");
			log("init", "Exit");
		},

		/**
		 * Application lifecycle activation method to draw the view
		 * @method activate
		 * @param {Object} activationObject
		 */
		activate: function (activationObject) {
			log("activate", "Enter");
			setMenuData();

			if (isWindowSelected) {
				portalWindow.passivate();
				menu.focus();
				isWindowSelected = false;
			}
			$N.app.BrandHelper.show($N.app.BrandHelper.AGORA_BACKGROUND_ID);
			if (activationObject && activationObject.context) {
				menu.selectItemAtIndex(getMenuIndexByContext(activationObject.context) + 1);
			} else {
				menu.selectItemAtIndex(1);
			}
			menu.displayData();
	//		$N.app.ClockDisplay.show();     jrm
			subscribeMailStatusChangedEvent();
			subscribeOnTasksChangedEvent();
			subscribeToDlnaDeviceDetectEvent();
			subscribeToMediaPlaybackFeatureEvent();
			log("activate", "Exit");
		},

		/**
		 * Application lifecycle passivation method to hide the view
		 * @method passivate
		 */
		passivate: function () {
			log("passivate", "Enter");
			this.defocus();
			unSubscribeMailStatusChangedEvent();
			unSubscribeOnTasksChangedEvent();
			unSubscribeToMediaPlaybackFeatureEvent();
			$N.app.BrandHelper.hideAll();
			$N.app.ClockDisplay.hide();
			log("passivate", "Exit");
		},

		/**
		 * Application lifecycle focus method to indicate user input enabled
		 * @method focus
		 */
		focus: function () {
			log("focus", "Enter");
			$N.app.BrandHelper.show($N.app.BrandHelper.AGORA_BACKGROUND_ID);
			$N.app.ClockDisplay.show();
			refreshPortalWindowData();
			log("focus", "Exit");
		},

		/**
		 * Application lifecycle focus method to indicate user input disabled
		 * @method defocus
		 */
		defocus: function () {
			log("defocus", "Enter");
			if (isWindowSelected) {
				portalWindow.passivate();
				menu.focus();
				isWindowSelected = false;
			}
			$N.app.ClockDisplay.hide();
			$N.app.BrandHelper.hideAll();
			log("defocus", "Exit");
		},

		/**
		 * Application lifecycle method to return the context name
		 * @method toString
		 * @return {String} The menu context name.
		 */
		toString: function () {
			return "PORTAL";
		},
		
		/**
		 * Main keyHandler method
		 * @method keyHandler
		 * @param {String} key
		 * @return {Boolean} True if the key press was handled; false if the key press
		 * was not handled.
		 */
		keyHandler: function (key, repeats) {
			log("keyHandler", "Enter");
			var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
				handled = false;
//jrm			$N.app.MemoryUtil.setOrUpdateGarbageCollectTimeoutAndInterval();

//jrm			if (usageidOverride) {
//				$N.app.FeatureManager.enableFeature(key);
//			}

//jrm			if (isWindowSelected) {
//				handled = portalWindow.keyHandler(key);
//			} else {
			    handled = menu.keyHandler(key, repeats);   //jrm
//jrm			}
			if (!handled) {
			    if (key == 'click') {
			        handled = true;
			        return;
			    }
				switch (key) {
				case keys.KEY_MENU:
					pin = "";
					setPinTimer();
					break;
				case keys.KEY_ZERO:
				case keys.KEY_ONE:
				case keys.KEY_TWO:
				case keys.KEY_THREE:
				case keys.KEY_FOUR:
				case keys.KEY_FIVE:
				case keys.KEY_SIX:
				case keys.KEY_SEVEN:
				case keys.KEY_EIGHT:
				case keys.KEY_NINE:
					if (pinTimer) {
						checkPin(key);
					} else {
						$N.app.ContextHelper.openContext("ZAPPER", {
							activationContext: {
								keyHandlerKey: key,
								showBanner: true,
								isDirectChannelEntryFromPortal: true
							}
						});
					}
					handled = true;
					break;
				case keys.KEY_LEFT:
					$N.app.ContextHelper.exitContext();
					handled = true;
					break;
				case keys.KEY_CHAN_UP:
				case keys.KEY_CHAN_DOWN:
					$N.app.ContextHelper.openContext("ZAPPER", {
						activationContext: {
							keyHandlerKey: key,
							showBanner: true
						}
					});
					handled = true;
					break;
				}
			}
			log("keyHandler", "Exit");
			return handled;
		}
	};
}(window.parent.$N));

