/*global SettingsMenuHelper*/
/**
 * SettingsPanel.
 * @module SettingsPanel
 */
/**
 * Settings Panel is the class which manages all sub menu
 * contents, user interaction in settings application.
 * @class SettingsPanel
 * @static
 * @author maniguru
 * @param {Object} $N
 */
(function ($N) {
	var SettingsPanel = function (controller, parentGuiObject, targetDocument) {
		var view = {},
			log = new $N.apps.core.Log("SETTINGS", "SettingsPanel"),
			activeItemStack = [],
			itemSelected = null,
			settingsMenuHelper = null,
			isErrorDisplayed = false,
			isFooterHandled = false,
			activeMenu,
			settingsIpController,
			currentIndex = null,
			isMenuLanguageRefreshed = null,
			titleWithCrumb = null,
			settingsMainMenuTitle = null,
			settingsTitle = controller.getSettingsPanelTitle(),
			isrefreshMenu,
			doubleMenuItemSelected = null,
			addChannelItemToSecondMenu = null,
			handleDoubleMenuItem = null,
			removeChannelItemFromSecondMenu = null,
			me = null,
			footerConfigValue = null,
			scrollComponentIndex = 0,
			isFooterVisible = false,
			directChannelEntry = new $N.app.DirectChannelEntry($N.app.constants.MAX_CHANNEL_DIGITS, $N.app.constants.CHANNEL_ENTRY_TIMEOUT_MS),
			footerUIHandler,
			MAX_VISIBLE_MENU = 2,
			RECORDER_INDEX = 5,
			MOCA_INDEX = 6,
			passivateCallback = null,
			exitCallback = null,
			_isRefreshFavouritesList = false,
			isLastItemSelected = false,
			isFirstItemSelected = false,
			childIndex = null;

		$N.apps.core.Language.adornWithGetString(SettingsPanel);
		$N.gui.FrameworkCore.loadGUIFromXML("common/xml/SettingsPanel.xml", targetDocument, view);
		view = view.settingsPanelContent;

		for (childIndex = 0; childIndex < view._children.length; childIndex++) {
			parentGuiObject.addChild(view._children[childIndex]);
		}

		/**
		 * hides all children of a given UI object
		 * @method viewReset
		 * @private
		 * @param {Object}parent
		 */
		function hideChildren(parent) {
			var i = null,
				childrenArray = parent._children;
			for (i = 0; i < childrenArray.length; i++) {
				childrenArray[i].hide();
			}
			view.settingsBGLines.hide();
		}

		/**
		 * hides,removes the focus of view objects that are either not needed or to be refreshed before an activity
		 * @method viewReset
		 * @private
		 */
		function viewReset() {
			view.errorLabel.setText("");
			hideChildren(view);
		}

		/**
		 * sets width of the error label componet
		 * @method configureErrorLabelWidth
		 * @private
		 */
		function configureErrorLabelWidth(menuConfig) {
			view.errorLabel.setWidth(view[menuConfig[0].component]._background.getTrueWidth());
		}

		/**
		 * Handles if data error is present

		 * @method handleDataError

		 * @private

		 * @param {String} id Represents the menu ID.

		 * @param {Object} menuConfig This is the JSON object contains the settings menu configurations .

		 */
		function handleDataError(id, menuConfig) {
			switch (id) {
			case 'menuPosts':
			case 'menuReminders':
				view.errorLabel.setText(SettingsPanel.getString(menuConfig[0].errorText));
				configureErrorLabelWidth(menuConfig);
				view.errorLabel.show();
				view[menuConfig[0].component].defocus();
				isErrorDisplayed = true;
				break;
			case 'menuAutoTune':
				view.errorLabel.setText(SettingsPanel.getString("noAutoTuneSet"));
				configureErrorLabelWidth(menuConfig);
				footerUIHandler($N.app.FormatUtils.getAutoTuneFooterConfig(false));
				view.errorLabel.show();
				isFooterHandled = true;
				break;
			case 'menuHistoryOfPurchases':
			case 'adultContent':
				view.errorLabel.setText(SettingsPanel.getString(menuConfig[0].errorText));
				configureErrorLabelWidth(menuConfig);
				footerUIHandler($N.app.FormatUtils.getPurchasesFooterConfig());
				view.errorLabel.show();
				isFooterHandled = true;
				break;
			}
		}

		/**
		 * show(or)hide the arrows that appear with a menu, when total items are more than the visible ones, based on current activity
		 * @method scrollIndicatorHandler
		 * @private
		 * @param {Object}activeComponent, {Object}scrollGroupObj
		 */
		function scrollIndicatorHandler(activeComponent, scrollGroupObj) {
			var isAtFirstPage = activeComponent._data.isAtFirstPage(),
				isAtLastPage = activeComponent._data.isAtLastPage();
			if (activeComponent.getSize() > activeComponent.getVisibleItemCount()) {
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
		 * configures UI properties for different UI objects according to the menu item selected
		 * @method uiConfigHandler
		 * @private
		 */
		function uiConfigHandler(menuConfig) {
			var uiConfigObj = menuConfig.uiConfigs,
				dataConfigObj = uiConfigObj.dataConfig,
				componentUIConfigObj = uiConfigObj.componentConfig,
				component = view[menuConfig.component],
				i;
			if (dataConfigObj) {
				for (i = 0; i < dataConfigObj.length; i++) {
					component._data["set" + $N.apps.util.Util.upcaseFirstLetter(dataConfigObj[i].setter)](dataConfigObj[i].value);
				}
			}
			if (componentUIConfigObj) {
				for (i = 0; i < componentUIConfigObj.length; i++) {
					component["set" + $N.apps.util.Util.upcaseFirstLetter(componentUIConfigObj[i].setter)](componentUIConfigObj[i].value);
				}
			}
		}

		/**
		 * Reset the  footer components while navigating in settings menu

		 * @method resetFooterUIHandler

		 * @private

		 * @param {String} Represents the footer group.

		 */
		function resetFooterUIHandler(footerComp) {
			hideChildren(footerComp);
		}

		/**
		 * Redraw the footer for each settings menu while navigating

		 * @method footerUIHandler

		 * @private

		 * @param {footerConfiguration} Json Object representing the configurations for footer.

		 */
		footerUIHandler = function (footerConfiguration) {
			if (footerConfiguration) {
				var footerUIConfig = footerConfiguration.uiConfigs,
					footerUIConfigsLength,
					footerGroup,
					i,
					j,
					footerComponentConfigLength,
					compConfigIndex,
					uiConfigIndex,
					value;
				footerGroup = view[footerConfiguration.group];
				resetFooterUIHandler(footerGroup);
				if (footerUIConfig) {
					footerUIConfigsLength = footerUIConfig.length;
					for (i = 0; i < footerUIConfigsLength; i++) {
						footerComponentConfigLength = footerUIConfig[i].componentConfig.length;
						uiConfigIndex = footerUIConfig[i].component;
						for (j = 0; j < footerComponentConfigLength; j++) {
							compConfigIndex = footerUIConfig[i].componentConfig[j];
							if (compConfigIndex.setter === "text") {
								value = SettingsPanel.getString(compConfigIndex.value) || "";
							} else {
								value = compConfigIndex.value;
							}
							footerGroup[uiConfigIndex].show();
							footerGroup[uiConfigIndex]["set" + $N.apps.util.Util.upcaseFirstLetter(compConfigIndex.setter)](value);
						}
					}
				}
				footerGroup.show();
			}
		};

		/**
		 * checks if the input component is an object or an array of objects
		 * @method isComponentObject
		 * @param {Object} object
		 * @private
		 * @return {Boolean}
		 */
		function isComponentObject(object) {
			if (object.length) {
				return false;
			}
			return true;
		}

		function setSubMenuTitle(title, titleId) {
			if (titleId) {
				view[titleId].setText(title);
				view[titleId].show();
			} else {
				view.secondSubMenuTitle.setText(title);
				view.secondSubMenuTitle.show();
			}
		}

		function getActiveMenuItem() {
			if (activeItemStack.length > 0) {
				return activeItemStack[activeItemStack.length - 1];
			} else {
				return null;
			}
		}

		function getActiveBackground(bgComponent) {
			if (bgComponent.length > 0) {
				return view[bgComponent[bgComponent.length - 1]];
			}
		}

		function getActiveComponent(menuItem) {
			var i,
				activeComponent = null;
			if (!menuItem) {
				menuItem = getActiveMenuItem();
			}
			for (i = 0; i < menuItem.configs.length; i++) {
				if (view[menuItem.configs[i].component].hasFocus()) {
					activeComponent = view[menuItem.configs[i].component];
				}
			}
			if (!activeComponent) {
				activeComponent = view[menuItem.configs[0].component];
			}
			return activeComponent;
		}

		function getActiveMenuConfig() {
			var i,
				activeMenuConfig = null,
				menuItem = getActiveMenuItem();
			for (i = 0; i < menuItem.configs.length; i++) {
				if (view[menuItem.configs[i].component].hasFocus()) {
					activeMenuConfig = menuItem.configs[i];
				}
			}
			return activeMenuConfig;
		}

		/**
		 * @method getDoubleMenufooterConfig
		 * @param {Number} logicalChannelNumber
		 */
		function getDoubleMenufooterConfig(footerType, listName, menuItems) {
			var menuItem = menuItems || getActiveMenuItem(),
				footerConfig = null,
				selectedDataItem = null,
				isForwardLabelNeeded = false,
				activeComponent = getActiveComponent();
			switch (menuItem.title) {
			case "menuFavorites":
				if (footerType === "allChannels") {
					if (menuItems) {
						selectedDataItem = getActiveComponent().getData()[getActiveComponent()._data.getFirstVisibleRowIndex() - 1].channelInfo;
					} else {
						selectedDataItem = getActiveComponent().getSelectedItem();
					}
					if ($N.app.ChannelManager.isFavouriteChannel(selectedDataItem)) {
						footerType = "favorites";
						listName = "allChannelsList";
					} else {
						footerType = "allChannels";
						listName = "allChannelsList";
					}
				} else {
					footerType = "favorites";
				}
				footerConfig = $N.app.FormatUtils.getFavoriteFooterConfig(footerType, listName);
				break;
			case "menuBlockChannels":
				isForwardLabelNeeded = (view.secondSubMenuList.getSize() > 0) ? true : false;//forward label in the footer should be displayed only if there are any items present in second list
				if (footerType === "allChannels") {
					selectedDataItem = activeComponent.getSelectedItem();
					listName = "allChannelsList";
					if (activeComponent.getSize() === 0) {
						footerType = "empty";
					} else if ($N.app.ChannelManager.isBlockedChannel(selectedDataItem)) {
						footerType = "blocked";
					} else {
						log("getDoubleMenufooterConfig", "footer type is for all channels category");
					}
				} else {
					footerType = "blocked";
				}
				footerConfig = $N.app.FormatUtils.getBlockFooterConfig(footerType, listName, isForwardLabelNeeded);
				break;
			}
			return footerConfig;
		}

		function getFooterConfig(menuItem) {
			var firstComponent = view[menuItem.configs[0].component],
				footerConfigValue = null;
			if ($N.app.ChannelManager.isFavouriteChannel(firstComponent.getSelectedItem().channelInfo)) {
				footerConfigValue = getDoubleMenufooterConfig("favorites", "allChannelsList", menuItem);
				footerConfigValue = footerConfigValue.footerConfig;
			} else {
				footerConfigValue = menuItem.configs[0].footerConfig;
			}
			return footerConfigValue;
		}
		/**
		 * updates the footer text for favourites menu and block channels menu.
		 * @method updateFooterForBlocksAndFavorites
		 */
		function updateFooterForBlocksAndFavorites() {
			var activeComponent = getActiveComponent(),
				channelItem = activeComponent.getActualSelectedItem();
			if (channelItem._icon.getHref() === "" || channelItem._icon.getHref() === null) {
				footerConfigValue = getDoubleMenufooterConfig("allChannels", "allChannelsList");
				footerUIHandler(footerConfigValue.footerConfig);
			} else {
				footerConfigValue = getDoubleMenufooterConfig("favorites", "allChannelsList");
				footerUIHandler(footerConfigValue.footerConfig);
			}
		}

		/**
		 * rollback the channel number at selected item
		 * @method rollbackDirectChannelEntry
		 */
		function rollbackDirectChannelEntry() {
			var item = getActiveComponent().getActualSelectedItem();
			if (item) {
				item.setServiceNumber(item.getOriginalChannelNumber());
				item.updateForChannelEntryOver();
			}
			directChannelEntry.cancelEntry();
		}

		function directChannelEntryCallback(logicalChannelNumber) {
			log("directChannelEntryCallback", "Enter");
			var closestChannelNumber = null,
				activeComponent = getActiveComponent(),
				indexOfClosestChannel = null,
				activeMenuItem = getActiveMenuItem();
			if (logicalChannelNumber) {
				activeComponent.getActualSelectedItem().updateForChannelEntryOver();
				closestChannelNumber = $N.app.epgUtil.getNextClosestService(logicalChannelNumber, $N.app.ChannelManager.getAllChannelsOrderedByChannelNumber()).logicalChannelNum;
				closestChannelNumber = $N.app.FormatUtils.formatChannelNumber(closestChannelNumber);
				indexOfClosestChannel = activeComponent.getIndexByUniqueData("channelNumber", closestChannelNumber);
				if (indexOfClosestChannel > -1) {
					activeComponent.selectItemAtIndex(indexOfClosestChannel + 1, true);
					scrollIndicatorHandler(activeComponent, view[activeMenuItem.configs[0].scrollComponent]);
				}
			} else {
				rollbackDirectChannelEntry();
			}
			if (activeComponent && (activeComponent._id === "firstSubMenuList") && (activeMenuItem.title === "menuFavorites" || activeMenuItem.title === "menuBlockChannels")) {
				updateFooterForBlocksAndFavorites();
			}
			log("directChannelEntryCallback", "Exit");
		}


		function updateTitle(activeMenuItemTitle) {
			if (activeMenuItemTitle) {
				settingsTitle.setText(activeMenuItemTitle);
			}
		}

		function setSubMenuItemSelectedIndex(title, component, id) {
			var data = component.getData(),
				i;
			switch (title) {
			case "menuPosts":
				for (i = 0; i < data.length; i++) {
					if (id === $N.app.MessageUtil.getMessageId(data[i])) {
						component.selectRowAtIndex(i + 1);
						break;
					}
				}
				break;
			default:
				break;
			}
		}

		function drawMenu(menuItem, updateData) {
			log("drawMenu", "Enter");
			if (menuItem.configs) {
				var data,
					length,
					i,
					component,
					itemTemplate,
					dataMapper,
					menuFooterConfig,
					scrollType,
					customItemSelected,
					customItemHighlightedImmediate,
					activeMenuItem,
					activeComponent,
					menuConfig = menuItem.configs,
					menuTitle = menuItem.title,
					menuTitleString;
				for (i = 0; i < menuItem.configs.length; i++) {
					activeMenuItem = getActiveMenuItem();
					activeComponent = activeMenuItem ? getActiveComponent(activeMenuItem) : null;
					component = view[menuConfig[i].component];
					itemTemplate = menuConfig[i].itemTemplate;
					dataMapper = menuConfig[i].dataMapper;
					menuFooterConfig = menuConfig[i].footerConfig;
					scrollType = menuConfig[i].scrollType;
					customItemSelected = menuConfig[i].itemSelected;
					customItemHighlightedImmediate = menuConfig[i].itemHighlightedImmediate;
					component.reset();
					if (updateData) {
						data = updateData;
					} else {
						data = settingsMenuHelper.getData(menuTitle, menuItem, component._id);
					}
					if (itemTemplate) {
						component.setItemTemplate(itemTemplate);
					}
					if (dataMapper) {
						component.setDataMapper($N.app.DataMappers["get" + dataMapper]());
					}
					if (scrollType) {
						component.setScrollType(scrollType);
					}
					if (menuConfig[i].uiConfigs) {
						uiConfigHandler(menuConfig[i]);
					}
					if ((activeComponent === component || (activeItemStack.length > MAX_VISIBLE_MENU)) && !isrefreshMenu) {
						if (menuConfig[i].isClearView) {
							menuTitleString = SettingsPanel.getString(menuTitle) || menuTitle; //this is used for new keypad component without selecting any menu item
							updateTitle($N.app.StringUtil.upcaseFirstLetter(menuTitleString));
						}
					}
					if (menuConfig[i].showSubMenuTitle) {
						setSubMenuTitle(SettingsPanel.getString(menuTitle));
					}
					if (menuConfig[i].title) {
						setSubMenuTitle(SettingsPanel.getString(menuConfig[i].title), menuConfig[i].titleId);
					}
					if (data) {
						component.setData(data);
						component.initialise();
						if (menuConfig[i].selectedItemId) {
							setSubMenuItemSelectedIndex(menuTitle, component, menuConfig[i].selectedItemId);
							menuConfig[i].selectedItemId = 0;
						}
						if (customItemSelected) {
							component.setItemSelectedCallback(me[customItemSelected]);
						} else {
							component.setItemSelectedCallback(itemSelected);
						}
						if (customItemHighlightedImmediate) {
							component.setItemHighlightedImmediateCallback(me[customItemHighlightedImmediate]);
						} else {
							component.setItemHighlightedImmediateCallback(null);
						}
						component.setSuccessCallback(data.successCallback);
						component.setColorKeyCallbacks(data.colorKeyCallbacks);
						component.displayData(false, true);
						isErrorDisplayed = false;
						isFooterHandled = false;
						component.defocus();
						if (menuConfig[i].scrollComponent && data.length !== 0) {
							scrollIndicatorHandler(view[menuItem.configs[i].component], view[menuItem.configs[i].scrollComponent]);
						}
					} else {
						handleDataError(menuTitle, menuConfig);
					}
					if (menuFooterConfig && !isErrorDisplayed && isFooterVisible && !isFooterHandled) {
						if (menuFooterConfig.isFooterForDoubleMenu) {
							menuFooterConfig = getFooterConfig(menuItem);
						}
						footerUIHandler(menuFooterConfig);
					}
					component.show();
				}
				view.show();
			}
			log("drawMenu", "Exit");
		}

		function setInactiveMenuItemHighlight(inactiveComponent) {
			var inactiveListItem = inactiveComponent.getActualSelectedItem();
			if (inactiveListItem) {
				inactiveListItem._highlight.setCssClass("inactiveMenuItemHighlight").show();
			}
		}

		function saveActiveMenuItemState() {
			var activeMenuItem,
				activeComponent;

			if (activeItemStack.length > 0) {
				activeMenuItem = getActiveMenuItem();
				activeComponent = getActiveComponent(activeMenuItem);
				activeMenuItem.lastSelectedIndex = activeComponent.getData().length > 0 ? activeComponent.getSelectedItemIndex() : null;
			}
		}

		/**
		 * method for handling removal of a social account and
		 * displays back the account type option
		 * @method removeSocialAccountHandler
		 * @private
		 * @param {Object} menuItem
		 */
		function removeSocialAccountHandler() {
			var activeSettingsItem = null;
			me.passivate(true);
			activeSettingsItem = controller.getActiveSettingsItem();
			me.activate(activeSettingsItem);
			controller.switchActiveComponent();
		}
		/**
		 * Updates the ActiveItemStack.
		 * Removes the items from the array after a specified index.
		 * Checks whether isAvailable config property is true or false.
		 * If stopIndex is found, Items in the activetemStack from the specified index gets removed.
		 * @method updateActiveItemStack
		 * @public
		 */
		function updateActiveItemStack() {
			var index,
				stopIndex = null,
				menuIndex = 0,
				stackLength = activeItemStack.length,
				checkVisible;
			if (activeItemStack && activeItemStack.length > 0) {
				for (index = 0; index < activeItemStack.length; index++) {
					checkVisible = activeItemStack[index].configs[menuIndex].isAvailable;
					if (checkVisible && !checkVisible()) {
						stopIndex = index;
						break;
					}
				}
				if (stopIndex) {
					viewReset();
					activeItemStack.splice(stopIndex, stackLength - stopIndex);
				}
			}
		}
		/**
		 * Redraws the active menu stack and gets to the previous state
		 * when clearing the view is used.
		 * @method redrawMenuFromActiveStack
		 * @private
		 */
		function redrawMenuFromActiveStack(drawCount) {
			var component,
				menuItem,
				menuConfigs,
				i = null,
				j = null,
				startIndex = 0;
			if (drawCount) {
				startIndex = activeItemStack.length - drawCount;
			} else if ((activeItemStack.length > MAX_VISIBLE_MENU) && ((activeItemStack.length % MAX_VISIBLE_MENU) > 0)) {
				startIndex = (activeItemStack.length % MAX_VISIBLE_MENU) + 1;
			}
			for (i = startIndex; i < activeItemStack.length; i++) {
				menuItem = activeItemStack[i];
				menuConfigs = menuItem.configs;
				if (menuConfigs.isClearView) {
					viewReset();
				}
				drawMenu(menuItem);
				for (j = 0; j < menuConfigs.length; j++) {
					component = view[menuConfigs[j].component];
					if (menuItem.lastSelectedIndex) {
						if (component.getData().length < menuItem.lastSelectedIndex) {
							menuItem.lastSelectedIndex = component.getData().length;
						}
						component.selectItemAtIndex(menuItem.lastSelectedIndex, true);
					}
					if (menuConfigs.length <= 1) { //If the double menu is added to stack, we should not be setting inactivemenuItem
						setInactiveMenuItemHighlight(component);
					}
				}
			}
		}

		/**
		 * Handles the PVR Enabled/Disabled event which gets raised in settings
		 * @method handlePVRStatusUpdateListener
		 * @private
		 */
		function handlePVRStatusUpdateListener() {
			var updatedLastIndex = 1,
				currentSelectedIndex = 1,
				firstItemFromActiveStack = activeItemStack[0],
				activeComponent = null;
			if (activeItemStack && (activeItemStack.length > 0) && (firstItemFromActiveStack.title === "menuPreferences")) {
				//updates the active item stack to remove items if recorder exists.
				updateActiveItemStack();
				activeComponent = getActiveComponent();
				if (activeItemStack && activeItemStack.length === 1) {
					updatedLastIndex = getActiveComponent(firstItemFromActiveStack).getSelectedItemIndex();
					currentSelectedIndex = updatedLastIndex;
				} else {
					updatedLastIndex = firstItemFromActiveStack.lastSelectedIndex;
					currentSelectedIndex = activeComponent.getSelectedItemIndex();
				}
				//Correcting the index to the last highlighted one - based on PVR enabled or Disabled
				if ((RECORDER_INDEX <= updatedLastIndex) && $N.app.PVRCapability.isPVREnabled(true)) {
					updatedLastIndex = updatedLastIndex + 1; // incrementing the index of the items in preference menu if PVREnabled
				} else if ((RECORDER_INDEX <= updatedLastIndex) && !$N.app.PVRCapability.isPVREnabled(true)) {
					updatedLastIndex = updatedLastIndex - 1; // decrementing the index of the items in preference menu if PVRDisabled
				}
				firstItemFromActiveStack.lastSelectedIndex = updatedLastIndex;
				//redraws the menu if in first 2 components.
				if (activeItemStack && (activeItemStack.length <= MAX_VISIBLE_MENU)) {
					isrefreshMenu = true; // added so that the title doesn't get updated each time.
					redrawMenuFromActiveStack();
					activeComponent = getActiveComponent();
					if (activeItemStack.length === MAX_VISIBLE_MENU) {
						activeComponent.selectItemAtIndex(currentSelectedIndex, true);
					}
					activeComponent.focus();
					if (getActiveMenuConfig().scrollComponent) {
						scrollIndicatorHandler(activeComponent, view[getActiveMenuConfig().scrollComponent]);
					}
				}
			}
		}

		/**
		 * Handles the PVR Enabled/Disabled event which gets raised in settings
		 * @method handlePVRStatusUpdateListener
		 * @private
		 */
		function handleMoCAStatusUpdateListener(mocaEnabled) {
			var updatedLastIndex = 1,
				currentSelectedIndex = 1,
				firstItemFromActiveStack = activeItemStack[0],
				activeComponent = null;

			// TODO: This function (and the one above) need to be collapsed
			//        and/or refactored.

			if (activeItemStack && (activeItemStack.length > 0) && (firstItemFromActiveStack.title === "menuPreferences")) {
				//updates the active item stack to remove items if recorder exists.
				updateActiveItemStack();
				activeComponent = getActiveComponent();
				if (activeItemStack && activeItemStack.length === 1) {
					updatedLastIndex = getActiveComponent(firstItemFromActiveStack).getSelectedItemIndex();
					currentSelectedIndex = updatedLastIndex;
				} else {
					updatedLastIndex = firstItemFromActiveStack.lastSelectedIndex;
					currentSelectedIndex = activeComponent.getSelectedItemIndex();
				}
				//Correcting the index to the last highlighted one - based on PVR enabled or Disabled
				if ((MOCA_INDEX <= updatedLastIndex)) {
					if (mocaEnabled) {
						updatedLastIndex = updatedLastIndex + 1; // incrementing the index of the items in preference menu if PVREnabled
					} else {
						updatedLastIndex = updatedLastIndex - 1; // decrementing the index of the items in preference menu if PVRDisabled
					}
				}
				firstItemFromActiveStack.lastSelectedIndex = updatedLastIndex;
				//redraws the menu if in first 2 components.
				if (activeItemStack && (activeItemStack.length <= MAX_VISIBLE_MENU)) {
					isrefreshMenu = true; // added so that the title doesn't get updated each time.
					redrawMenuFromActiveStack();
					activeComponent = getActiveComponent();
					if (activeItemStack.length === MAX_VISIBLE_MENU) {
						activeComponent.selectItemAtIndex(currentSelectedIndex, true);
					}
					activeComponent.focus();
					if (getActiveMenuConfig().scrollComponent) {
						scrollIndicatorHandler(activeComponent, view[getActiveMenuConfig().scrollComponent]);
					}
				}
			}
		}

		function exitKeypad(folderName, menuItemFocusOnExitIndex) {
			var NO_OF_MENUS_TO_DRAW = 2,
				index,
				activeListItem,
				activeComponent = getActiveComponent();

			redrawMenuFromActiveStack(NO_OF_MENUS_TO_DRAW);
			activeComponent.focus();

			activeListItem = activeComponent.getActualSelectedItem();
			activeListItem._highlight.setCssClass("channelListItemHighlight").show();

			if (folderName) {
				index = activeComponent.getIndexByUniqueData("title", folderName);
				activeComponent.selectItemAtIndex(index + 1, true);
			} else {
				activeComponent.selectItemAtIndex(menuItemFocusOnExitIndex, true);
			}

			settingsTitle.setText($N.app.StringUtil.upcaseFirstLetter(SettingsPanel.getString(activeItemStack[0].title)));
			updateTitle(SettingsPanel.getString(activeItemStack[1].title)); //TODO: To define the logic more generic
		}

		function setPassivateCallback(callback) {
			passivateCallback = callback;
		}

		function setExitCallback(callback) {
			exitCallback = callback;
		}

		function showSocialAccountInformation(menuItemObj, accountInformation, isMenuDrawn) {
			var subMenuTitleConfig = menuItemObj.configs[0].subMenuTitleConfig,
				secondSubMenuTitleReloadMethod = function () {
					view.secondSubMenuTitle.configure(subMenuTitleConfig.defaultConfig);
				};
			if (!isMenuDrawn) {
				itemSelected(menuItemObj);
			}
			setSubMenuTitle(accountInformation.profileName);
			view.secondSubMenuTitle.configure(subMenuTitleConfig.modifiedConfig);
			view.secondSubMenuSubTitle.setText(SettingsPanel.getString("socialAccountLinkedDateText") + " " + accountInformation.linkedDate).show();
			view.secondSubMenuTitleImage.setHref(accountInformation.profileImageUrl);
			view.secondSubMenuTitleImage.show();
			setPassivateCallback(secondSubMenuTitleReloadMethod);
			setExitCallback(secondSubMenuTitleReloadMethod);
		}

		/**
		 * Method to get the scroll component of the
		 * currently focused list component
		 * @method getActiveMenuScrollComponent
		 * @private
		 */
		function getActiveMenuScrollComponent() {
			return view[getActiveMenuItem().configs[0].scrollComponent];
		}

		function keypadPanelSettings(menuItem) {
			viewReset();
			drawMenu(menuItem);
			updateTitle(SettingsPanel.getString("titleCreateNewFolder"));
		}

		function textWithTitleAndBKShow(title, content) {
			var txtTitle = view.textWithTitleAndBK.textTitle,
				txtContent = view.textWithTitleAndBK.textContent;
			view.textWithTitleAndBK.show();
			txtTitle.setText(title);
			if (txtTitle.getTrueHeight() > 60) {//the title has two lines
				txtContent.setY(180);
				txtContent.setHeight(376);
			} else {
				txtContent.setY(130);
				txtContent.setHeight(421);
			}
			txtContent.setText(content);
		}

		function textWithTitleAndBKHide() {
			view.textWithTitleAndBK.hide();
		}

		function messageItemHighlightedImmediate(obj) {
			if (this.hasFocus()) {
				textWithTitleAndBKShow(obj.title, obj.content);
			}
		}

		function messageTextBoxShow(component) {
			var obj = component.getSelectedItem();
			if (obj) {
				textWithTitleAndBKShow(obj.title, obj.content);
			}
		}

		/**
		 * called after 'OK' is pressed on a menu item to activate it and to push the selected item into a stack
		 * @method activateMenuItem
		 * @param {Object} menuItem
		 * @private
		 */
		function activateMenuItem(menuItem) {
			var menuConfig,
				component,
				activeComponent;
			menuConfig = menuItem.configs;
			component = view[menuConfig[0].component];
			if (menuItem.title === "menuFavorites") {
				$N.app.ChannelManager.initialiseFavouritesList();
			} else if (menuItem.title === "menuPosts") {
				messageTextBoxShow(component);
			}
			if (component.getSize() > 0) {
				component.focus();
			}
			if (activeItemStack.length > 0) {
				activeComponent = getActiveComponent();
				activeComponent.defocus();
				if (component !== activeComponent && !menuConfig[0].isClearView) {
					setInactiveMenuItemHighlight(activeComponent);
				}
			}
			activeItemStack.push(menuItem);
			getActiveComponent().focus();

			if (menuItem.drawMenuCallback) {
				settingsMenuHelper[menuItem.drawMenuCallback]();
			}

		}

		function getIndexOfChannelNumberVisible(componentToSearch, channelNumber) {
			var listItems = componentToSearch.getItems(),
				i = null;
			for (i = 0; i < listItems.length; i++) {
				if (listItems[i]._channelNumber.getText() === channelNumber) {
					return i;
				}
			}
			return -1;
		}

		doubleMenuItemSelected = function (menuItem, isOKPressed) {
			var firstComponent = view[getActiveMenuItem().configs[0].component],
				secondComponent = view[getActiveMenuItem().configs[1].component],
				activeComponent = getActiveComponent(),
				isIconVisible,
				selectedItem = null,
				indexOfService,
				indexOfFavorite;
			footerConfigValue = getDoubleMenufooterConfig("favorites");
			if (!isOKPressed) {
				if (firstComponent.hasFocus() && secondComponent.getSize() > 0) {
					firstComponent.defocus();
					secondComponent.focus();
					secondComponent.selectItemAtIndex(secondComponent._data.getFirstVisibleRowIndex(), true);
					footerUIHandler(footerConfigValue.footerConfig);
					scrollComponentIndex += 1;
				}
			} else {
				if (firstComponent.hasFocus() && (firstComponent.getSize() > 0)) {
					addChannelItemToSecondMenu(firstComponent.getSelectedItem(), secondComponent, firstComponent);
				} else if (secondComponent.hasFocus()) {
					removeChannelItemFromSecondMenu(secondComponent, firstComponent, secondComponent.getSelectedItemIndex() - 1);
				} else {
					log("doubleMenuItemSelected", "No operation required");
				}
			}
		};

		itemSelected = function (menuItem, isOKPressed) {
			var menuConfigs,
				i = 0;
			if (menuItem.configs) {
				menuConfigs = menuItem.configs;
				isrefreshMenu = false;
				saveActiveMenuItemState();
				if (menuConfigs[i].isClearView || (getActiveComponent() === getActiveComponent(menuItem))) {
					updateTitle(SettingsPanel.getString(menuItem.title));
					viewReset();
				}
				drawMenu(menuItem);
				activateMenuItem(menuItem);
				settingsMenuHelper.startAutoRefreshData(menuItem.title, getActiveComponent());
			}
		};

		handleDoubleMenuItem = function (menuItem, isExit) {
			var firstComponent = view[menuItem.configs[0].component],
				secondComponent = view[menuItem.configs[1].component],
				handled = false;

			if (secondComponent.hasFocus()) {
				secondComponent.defocus();
				firstComponent.focus();
				firstComponent.selectItemAtIndex(firstComponent._data.getFirstVisibleRowIndex(), true);
				footerConfigValue = getDoubleMenufooterConfig("allChannels", "allChannelsList", menuItem);
				footerUIHandler(footerConfigValue.footerConfig);
				handled = isExit ? false : true;
				scrollComponentIndex -= 1;
			}
			return handled;
		};

		addChannelItemToSecondMenu = function (favoriteData, secondComponent, firstComponent) {
			var menuItem = getActiveMenuItem(),
				favoritesChannelData = null,
				indexOfService;
			if (typeof (secondComponent.getIndexByUniqueData("channelNumber", favoriteData.channelNumber)) === "undefined") {
				firstComponent.getActualSelectedItem().setIconUrl(getActiveMenuItem().href);
				firstComponent.getActualSelectedItem().showIcon();
				secondComponent.appendData(favoriteData);
				favoritesChannelData = secondComponent.getData();
				favoritesChannelData = favoritesChannelData.sort($N.app.SortUtil.sortByChannel);
				secondComponent.setData(favoritesChannelData);
				secondComponent.displayData();
				switch (menuItem.title) {
				case "menuFavorites":
					$N.app.ChannelManager.addToFavouritesList(favoriteData.channelInfo);
					break;
				case "menuBlockChannels":
					$N.app.ChannelManager.addToBlockedList(favoriteData.channelInfo);
					break;
				}
				footerConfigValue = getDoubleMenufooterConfig("favorites", "allChannelsList");
				footerUIHandler(footerConfigValue.footerConfig);
			} else {
				indexOfService = secondComponent.getIndexByUniqueData("channelNumber", firstComponent.getSelectedItem().channelNumber);
				if (indexOfService > -1) {
					removeChannelItemFromSecondMenu(secondComponent, firstComponent, indexOfService);
				}
				footerConfigValue = getDoubleMenufooterConfig("allChannels", "allChannelsList");
				footerUIHandler(footerConfigValue.footerConfig);
			}
			scrollIndicatorHandler(secondComponent, view[menuItem.configs[1].scrollComponent]);
		};

		function handleEmptyList(key, keys) {
			var activeMenuItem = null,
				menuItemObj = {},
				handled = false;
			activeMenuItem = getActiveMenuItem();
			switch (activeMenuItem.title) {
			case 'menuAutoTune':
				if (key === keys.KEY_RIGHT || key === keys.KEY_OK || key ===  keys.KEY_GREEN) {
					menuItemObj.title = 'menuAutoTuneEdit';
					menuItemObj.drawMenuCallback = 'autoTuneTimeUpdate';
					$N.app.AutoTuneHelper.resetAutoTuneProperties();
					menuItemObj.configs = $N.app.FormatUtils.getAutoTuneEditConfig();
					itemSelected(menuItemObj);
					handled = true;
				}
				break;
			}
			return handled;
		}
		removeChannelItemFromSecondMenu = function (secondComponent, firstComponent, favDataIndex) {
			var favoritesChannelData,
				indexOfService,
				favoriteSelectedItem = secondComponent.getSelectedItem(),
				selectedItemIndex = null,
				menuItem = getActiveMenuItem();

			if (firstComponent.hasFocus()) {
				indexOfService = firstComponent._items.indexOf(firstComponent.getActualSelectedItem());
				favoriteSelectedItem = firstComponent.getSelectedItem();
				selectedItemIndex = firstComponent.getSelectedItemIndex();
			} else {
				indexOfService = getIndexOfChannelNumberVisible(firstComponent, favoriteSelectedItem.channelNumber);
				favoriteSelectedItem = secondComponent.getSelectedItem();
				selectedItemIndex = secondComponent.getSelectedItemIndex();
			}

			switch (menuItem.title) {
			case "menuFavorites":
				$N.app.ChannelManager.removeFromFavouritesList(favoriteSelectedItem.channelInfo);
				break;
			case "menuBlockChannels":
				$N.app.ChannelManager.removeFromBlockedList(favoriteSelectedItem.channelInfo);
				break;
			}

			if (indexOfService > -1 && firstComponent._items[indexOfService]._icon) {
				if (firstComponent._items[indexOfService]._icon.getHref() !== "") {
					firstComponent._items[indexOfService].updateIcon(firstComponent.getData()[selectedItemIndex - 1]);
				}
			}

			favoritesChannelData = secondComponent.getData();
			favoritesChannelData.splice(favDataIndex, 1);
			favoritesChannelData = secondComponent.getData();
			secondComponent.setData(favoritesChannelData);
			secondComponent.displayData();

			if (secondComponent.hasFocus()) {
				switch (favoritesChannelData.length) {
				case 0:
					me.passivate(false);
					firstComponent.selectItemAtIndex(1, true);
					break;
				case favDataIndex:
					secondComponent.selectItemAtIndex(favDataIndex, true);
					break;
				default:
					secondComponent.selectItemAtIndex(favDataIndex + 1, true);
				}
			}
			scrollIndicatorHandler(getActiveComponent(), view[getActiveMenuConfig().scrollComponent]);
		};

		/**
		 * A method to set auto tune. Called when a user passivates from
		 * auto tune configure view.
		 * @method setAutoTune
		 * @private
		 * @param {Object} menuItem
		 */
		function setAutoTune(menuItem) {
			var menuData,
				date,
				time,
				newDate,
				startTime,
				timeOfDay,
				frequency,
				repeatDaysArray,
				serviceUri,
				title,
				serviceId,
				entity = {},
				addInfoObj,
				autoTuneJobType,
				JOB_TYPE_SINGLE = "ONE_TIME",
				JOB_TYPE_REPEAT = "RPT_TIME",
				DURATION = 1,
				ONE_MINUTE = 60000;

			menuData = getActiveComponent().getData();
			frequency = menuData[0].frequency;
			date = menuData[1].date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3/$2/$1");
			time = menuData[2].time;

			newDate = new Date(date + "," + time);
			startTime = newDate.getTime();
			startTime = startTime - ONE_MINUTE; //Setting Auto tune to occur a minute before
			newDate = new Date(startTime);

			serviceUri = menuData[3].channelInfo.uri;
			title = menuData[3].channelInfo.serviceName;
			serviceId = menuData[3].channelInfo.serviceId;
			timeOfDay = (newDate.getHours() * 3600) + (newDate.getMinutes() * 60);

			switch (frequency) {
			case "weekly":
				repeatDaysArray = $N.platform.btv.PVRManager.getRepeatDaysArrayForFrequency($N.platform.btv.PVRManager.Frequency.WEEKLY, newDate);
				autoTuneJobType = JOB_TYPE_REPEAT;
				break;
			case "daily":
				repeatDaysArray = $N.platform.btv.PVRManager.getRepeatDaysArrayForFrequency($N.platform.btv.PVRManager.Frequency.DAILY);
				autoTuneJobType = JOB_TYPE_REPEAT;
				break;
			case "once":
				repeatDaysArray = $N.platform.btv.PVRManager.getRepeatDaysArrayForFrequency($N.platform.btv.PVRManager.Frequency.ONCE);
				autoTuneJobType = JOB_TYPE_SINGLE;
				break;
			}

			addInfoObj = {
				startTime: startTime,
				duration: DURATION,
				sourceURL: serviceUri,
				title: title,
				serviceId: serviceId,
				timeOfDay: timeOfDay,
				repeatDaysArray: repeatDaysArray,
				extraInfo: JSON.stringify({
					jobType: frequency
				})
			};

			if ($N.app.SystemUtil.isNative()) {
				if ($N.app.AutoTuneHelper.getAutoTuneProperty('jobId')) {
					$N.app.AutoTuneHelper.cancelAutoTune($N.app.AutoTuneHelper.getAutoTuneProperty('jobId'));
				}
				$N.app.AutoTuneHelper.setAutoTune(autoTuneJobType, addInfoObj, function (retVal, e) {
					var autoTuneData,
						activeComponent = getActiveComponent(),
						activeMenuItem = getActiveMenuItem();
					if (retVal) {
						autoTuneData = settingsMenuHelper.getAutoTuneData();
						if (autoTuneData) {
							me.refreshMenu(activeMenuItem, autoTuneData);
							activeComponent.selectItemAtIndex((activeMenuItem.lastSelectedIndex || 1), true);
							scrollIndicatorHandler(activeComponent, view[activeMenuItem.configs[0].scrollComponent]);
							footerUIHandler($N.app.FormatUtils.getAutoTuneFooterConfig(true));
							view.errorLabel.hide();
						} else {
							me.refreshMenu(activeMenuItem, autoTuneData);
							footerUIHandler($N.app.FormatUtils.getAutoTuneFooterConfig(false));
						}
					} else {
						log("ERROR IN ADDING AUTO TUNE", "Exit1");
					}
				});
			}

		}
		/**
		 * A method to hide the scroll component. Called when a user passivates.
		 * @method hideScrollComponent
		 * @private
		 * @param {Object} activeMenuItem
		 */
		function hideScrollComponent(activeMenuItem) {
			var i = null,
				activeMenuConfigs = null,
				scrollComponent = null;
			for (i = 0; i < activeMenuItem.configs.length; i++) {
				activeMenuConfigs = activeMenuItem.configs[i];
				scrollComponent = view[activeMenuConfigs.scrollComponent];
				if (scrollComponent) {
					scrollComponent.hide();
				}
			}
		}

		function getSettingsShortcutObject(shortcutTitle) {
			var functionName = "getShortCutConfigs" + $N.app.StringUtil.upcaseFirstLetter(shortcutTitle);
			return {
				title : shortcutTitle,
				configs : $N.app.FormatUtils[functionName]()
			};
		}

		function directChannelEntryKeyHandler(key, keys) {
			var handled = false,
				menu = getActiveComponent();
			switch (key) {
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
				if (!directChannelEntry.isActive()) {
					menu.getActualSelectedItem().updateForChannelEntry();
				}
				directChannelEntry.updateChannelDigits(key, menu.getActualSelectedItem()._channelNumber, menu.getActualSelectedItem()._cursor);
				handled = true;
				break;
			case keys.KEY_LEFT:
				if (directChannelEntry.isActive()) {
					directChannelEntry.updateChannelDigits(key, menu.getActualSelectedItem()._channelNumber, menu.getActualSelectedItem()._cursor);
					handled = true;
				}
				break;
			case keys.KEY_BACK:
				if (directChannelEntry.isActive()) {
					rollbackDirectChannelEntry();
					handled = true;
				}
				break;
			case keys.KEY_OK:
				if (directChannelEntry.okKeyHandler()) {
					log("keyHandler", "directChannelEntry - okKeyHandler - done.");
					handled = true;
				}
				break;
			default:
				if ($N.app.GeneralUtil.isKeyReleaseEvent(key)) {
					return false;
				}
				if (directChannelEntry.isActive()) {
					rollbackDirectChannelEntry();
				}
			}
			return handled;
		}
		// Public API
		return {
			preview: function (menuItem) {
				log("preview", "Enter");
				var activeComponent;

				me = this;
				isLastItemSelected = false;
				isFirstItemSelected = false;
				directChannelEntry.setChannelEnteredCallback(directChannelEntryCallback);
				if (settingsMenuHelper === null) {
					settingsMenuHelper = new $N.app.SettingsMenuHelper(this);
				}
				if (menuItem.configs) {
					viewReset();
					if (isMenuLanguageRefreshed) {
						redrawMenuFromActiveStack();
						isMenuLanguageRefreshed = null;
						activeComponent = getActiveComponent();
						if (getActiveMenuItem().lastSelectedIndex) {
							activeComponent.selectItemAtIndex(getActiveMenuItem().lastSelectedIndex, true);
						}
						activeComponent.focus();
						this.passivate(false);
					} else {
						drawMenu(menuItem);
					}
					log("preview", "Exit 1");
					return true;
				} else {
					view.hide();
					log("preview", "Exit 2");
					return false;
				}
			},

			activate: function (menuItem, settingsIpHandler) {
				log("activate", "Enter");
				var i,
					menuFooterConfig;
				settingsIpController = settingsIpHandler;
				if (!isErrorDisplayed && menuItem.configs) {
					activateMenuItem(menuItem);
					for (i = 0; i < menuItem.configs.length; i++) {
						menuFooterConfig = menuItem.configs[i].footerConfig;
						if (menuFooterConfig) {
							if (menuFooterConfig.isFooterForDoubleMenu) {
								menuFooterConfig = getFooterConfig(menuItem);
							}
							footerUIHandler(menuFooterConfig);
						}
					}
					isFooterVisible = true;
					log("activate", "Exit 1");
					return true;
				} else {
					log("activate", "Exit 2");
					return false;
				}
			},

			passivate: function (isExit) {
				log("passivate", "Enter");
				var activeMenuItem,
					activeComponent,
					activeMenuConfigs,
					scrollComponent,
					exitMenuItem,
					menuItem,
					doubleMenuPassivateHandle = false;
				isLastItemSelected = false;
				isFirstItemSelected = false;
				if (isExit) {
					exitMenuItem = activeItemStack[0];
					activeItemStack = [];
					activeItemStack.push(exitMenuItem);
					viewReset();
					controller.setSettingsPanelTitle(SettingsPanel.getString(exitMenuItem.title));
				}
				menuItem = getActiveMenuItem();
				if (menuItem.title === 'menuAutoTuneEdit') {
					settingsMenuHelper.stopAutoTuneTimeUpdate();
				}
				if (menuItem.title === 'menuPosts') {
					textWithTitleAndBKHide();
					activeComponent = getActiveComponent(activeMenuItem);
					activeComponent.defocus();
				}
				if (menuItem.configs.length > 1) {//TODO need to simplify in more generic way.
					doubleMenuPassivateHandle = handleDoubleMenuItem(menuItem, isExit);
				}

				if (!doubleMenuPassivateHandle) {
					activeMenuItem = activeItemStack.pop();
					activeComponent = getActiveComponent(activeMenuItem);
					activeMenuConfigs = activeMenuItem.configs[0];
					hideScrollComponent(activeMenuItem);
					view.textDescription.hide();
					activeComponent.hide();
					if (activeMenuConfigs.isClearView) {
						view.errorLabel.setText("");
						redrawMenuFromActiveStack();
						if (activeItemStack.length <= MAX_VISIBLE_MENU) {
							controller.setSettingsPanelTitle(SettingsPanel.getString(activeItemStack[0].title));
						}
						if (activeMenuItem.title === "menuBlockChannels") {
							$N.app.ChannelManager.saveBlockedChannelsList();
						}
					}
					settingsMenuHelper.stopAutoRefreshData();
					if (activeItemStack.length > 0) {
						activeMenuItem = getActiveMenuItem();
						activeComponent = getActiveComponent(activeMenuItem);
						activeMenuConfigs = activeMenuItem.configs[0];
						if (activeComponent.isVisible() && (menuItem.title !== 'menuAutoTuneEdit')) {
							footerUIHandler(activeMenuConfigs.footerConfig);
						} else {
							drawMenu(activeMenuItem);
							controller.setSettingsPanelTitle(SettingsPanel.getString(activeMenuItem.title));
						}
						view.firstSubMenuTitle.hide();
						view.secondSubMenuTitle.hide();
						view.secondSubMenuSubTitle.hide();
						view.secondSubMenuTitleImage.hide();
						if (activeMenuItem.lastSelectedIndex) {
							activeComponent.selectItemAtIndex(activeMenuItem.lastSelectedIndex, true);
							//Following condition is added to avoid the scrollIndicatorHandler call if no scrollComponent is defined for a list
							if (activeMenuItem.configs[scrollComponentIndex].scrollComponent) {
								scrollIndicatorHandler(activeComponent, view[activeMenuItem.configs[scrollComponentIndex].scrollComponent]);
							}
						}
						activeComponent.focus();
					} else {
						if (activeMenuItem.title === "menuFavorites") {
							$N.app.ChannelManager.saveFavouritesList();
							/*If Favourites is set for refresh from the settings, we should do a refresh during passivate.
							 * This is for the requirement: SETT-FAV-290. Favourites should reflect EPG change only
							 * when the user exits.
							 */
							if (_isRefreshFavouritesList) {
								$N.app.FavouritesUtil.refreshFavoriteChannels(true);
								_isRefreshFavouritesList = false; //resetting the refresh
							}
						}
						view[activeMenuConfigs.footerConfig.group].hide();
						isFooterVisible = false;
						drawMenu(activeMenuItem);
						controller.switchActiveComponent();
					}
					currentIndex = null;
					scrollComponentIndex = 0;
				}
				if (!isExit && passivateCallback) {
					passivateCallback();
					passivateCallback = null;
				} else if (isExit && exitCallback) {
					exitCallback();
					exitCallback = null;
				}
				log("passivate", "Exit");
			},

			refreshMenu: function (menuItem, data) {
				log("refreshMenu", "Enter");
				var activeComponent = getActiveComponent();
				if (menuItem === getActiveMenuItem()) {
					isrefreshMenu = true;
					drawMenu(menuItem, data);
					if (currentIndex && data) {
						if (currentIndex > data.length) {
							activeComponent.selectRowAtIndex(data.length);
						} else {
							activeComponent.selectRowAtIndex(currentIndex);
						}
						activeComponent.displayData();
					}
					activeComponent.focus();
				}
				log("refreshMenu", "Exit");
			},
			/**
			 * This method redraws the prefrence sub menu. Called when either USB or DLNA device is enabled/disabled.
			 * @method refreshSubMenu
			 * @public
			 * @param {Object} menuItem
			 */
			refreshSubMenu: function (menuItem) {
				log("refreshSubMenu", "Enter");
				var updatedLastIndex = 1,
					currentSelectedIndex = 1,
					firstItemFromActiveStack = activeItemStack[0],
					activeComponent = null;
				if (activeItemStack && (activeItemStack.length > 0) && (firstItemFromActiveStack.title === "menuPreferences")) {
					//updates the active item stack to remove items if recorder exists.
					activeComponent = getActiveComponent();
					if (activeItemStack && activeItemStack.length === 1) {
						updatedLastIndex = getActiveComponent(firstItemFromActiveStack).getSelectedItemIndex();
						currentSelectedIndex = updatedLastIndex;
					} else {
						updatedLastIndex = firstItemFromActiveStack.lastSelectedIndex;
						currentSelectedIndex = activeComponent.getSelectedItemIndex();
					}
					updateActiveItemStack();
					firstItemFromActiveStack.lastSelectedIndex = updatedLastIndex;
					//redraws the menu if in first 2 components.
					if (activeItemStack && (activeItemStack.length <= MAX_VISIBLE_MENU)) {
						isrefreshMenu = true; // added so that the title doesn't get updated each time.
						redrawMenuFromActiveStack();
						activeComponent = getActiveComponent();

						//If the current selection is on "Safely Remove" Menu, the highlight has to move one item back.
						if ((getActiveMenuItem().title === "menuMedia") && (activeComponent.getSize() < currentSelectedIndex)
								&& (!$N.app.UsbBrowserHelper.getMediaPlaybackStatus())) {
							currentSelectedIndex = activeComponent.getSize();
						}

						if (activeItemStack.length === MAX_VISIBLE_MENU) {
							activeComponent.selectItemAtIndex(currentSelectedIndex, true);
						}
						activeComponent.focus();
						if (getActiveMenuConfig().scrollComponent) {
							scrollIndicatorHandler(activeComponent, view[getActiveMenuConfig().scrollComponent]);
						}
					}
				}
				log("refreshSubMenu", "Exit");
			},

			refreshMenuLanguage: function () {
				saveActiveMenuItemState();
				isMenuLanguageRefreshed = true;
			},
			restorePortalMenuFocus: function () {
				controller.reselectActiveItem();
			},

			keyHandler: function (key, repeats) {
				log("keyHandler", "Enter");
				var keys,
					handled,
					activeComponent,
					activeMenuItem = getActiveMenuItem(),
					activeMenuConfig,
					i,
					channelItem;

				keys = $N.apps.core.KeyInterceptor.getKeyMap();
				activeComponent = getActiveComponent();
				activeMenuConfig = getActiveMenuConfig();
				if (directChannelEntry && activeMenuConfig
						&& activeMenuConfig.directChannelEntryEnabled && activeComponent.getSize() > 0) {
					if (directChannelEntryKeyHandler(key, keys)) {
						log("keyHandler", "Exit 1");
						return true;
					}
				}
				if (activeComponent.getSize() === 0) {
					handled = handleEmptyList(key, keys);
				}
				if (!handled && activeComponent.hasFocus()) {
					if (settingsMenuHelper.isPinDisplayed() && (key === keys.KEY_UP || key === keys.KEY_DOWN)) {
						handled = true;
					} else {
						handled = activeComponent.keyHandler(key, repeats);
						if ((activeMenuItem.configs[scrollComponentIndex].scrollComponent) && (key === keys.KEY_UP || key === keys.KEY_DOWN || key === keys.KEY_CHAN_UP || key === keys.KEY_CHAN_DOWN)) {
							scrollIndicatorHandler(activeComponent, view[activeMenuItem.configs[scrollComponentIndex].scrollComponent]);
							currentIndex = activeComponent._data.getFirstVisibleRowIndex();
						}
					}
				} else {
					handled = false;
				}

				if (activeComponent && (activeComponent._id === "firstSubMenuList") && (activeMenuItem.title === "menuFavorites" || activeMenuItem.title === "menuBlockChannels")
						&& (key === keys.KEY_UP || key === keys.KEY_DOWN || key === keys.KEY_CHAN_UP || key === keys.KEY_CHAN_DOWN)) {
					updateFooterForBlocksAndFavorites();
				}
				if (!handled) {
					switch (key) {
					case keys.KEY_GREEN:
						//Save the new auto tune.
						if (activeMenuItem.title === 'menuAutoTuneEdit') {
							setAutoTune(activeMenuItem);
							this.passivate(false);
						}
						handled = true;
						break;
					case keys.KEY_LEFT:
						this.passivate(false);
						handled = true;
						break;
					case keys.KEY_BACK:
						this.passivate(false);
						handled = true;
						break;
					case keys.KEY_YELLOW:
						if (getActiveMenuItem().title === "menuIPConnections") {
							settingsIpController.renewIpAddress();
							handled = true;
						}
						break;
					case keys.KEY_CHAN_UP:
						if (activeMenuConfig.isMultiplePageSupported && !isFirstItemSelected) {
							this.passivate(false);
							activeComponent = getActiveComponent();
							activeComponent.selectPrevious();
							if (activeComponent.isSelectedAtFirst()) {
								isFirstItemSelected = true;
							}
							this.itemSelected(activeComponent.getSelectedItem(), true);
							handled = true;
						}
						break;
					case keys.KEY_CHAN_DOWN:
						if (activeMenuConfig.isMultiplePageSupported && !isLastItemSelected) {
							this.passivate(false);
							activeComponent = getActiveComponent();
							activeComponent.selectNext();
							if (activeComponent.isSelectedAtLast()) {
								isLastItemSelected = true;
							}
							this.itemSelected(activeComponent.getSelectedItem(), true);
							handled = true;
						}
						break;
					default:
						if ($N.app.GeneralUtil.isKeyReleaseEvent(key)) {
							log("keyHandler", "Exit 2");
							return false;
						}
					}
				}
				log("keyHandler", "Exit 3");
				return handled;
			},

			getActiveMenuItem: getActiveMenuItem,
			getActiveComponent: getActiveComponent,
			getKeypadComponent: function () {
				return view.settingsKeypad;
			},

			getSettingsIpHandler: function () {
				return settingsIpController;
			},
			showBGLines: function () {
				view.settingsBGLines.show();
			},
			doubleMenuItemSelected: doubleMenuItemSelected,
			messageItemHighlightedImmediate: messageItemHighlightedImmediate,
			itemSelected: itemSelected,
			footerUIHandler: footerUIHandler,
			keypadPanelSettings: keypadPanelSettings,
			exitKeypad: exitKeypad,
			getActiveMenuScrollComponent: getActiveMenuScrollComponent,
			scrollIndicatorHandler: scrollIndicatorHandler,
			showSocialAccountInformation: showSocialAccountInformation,
			setPassivateCallback: setPassivateCallback,
			setExitCallback: setExitCallback,
			removeSocialAccountHandler: removeSocialAccountHandler,
			genericReminderDeletedListener: function () {
				settingsMenuHelper.genericReminderDeletedListener();
			},
			/**
			 * Set the favourites menu to refresh during the passivate.
			 * Used by the Settings class.
			 * @method setFavouritesRefresh
			 * @public
			 * @param {bool} value
			 */
			setFavouritesRefresh: function (value) {
				_isRefreshFavouritesList = value;
			},
			/**
			 * focus method will be called from the focus of Settings Class.
			 * @method focus
			 * @public
			 */
			focus: function () {
				var activeMenuItem = getActiveMenuItem(),
					activeComponent = null,
					selectedIndex = 1;

				if (activeMenuItem) {
					activeComponent = getActiveComponent(activeMenuItem);
				}
				if (activeComponent && (activeComponent._id === "firstSubMenuList" || activeComponent._id === "secondSubMenuList") && (activeMenuItem.title === "menuFavorites")) {
					selectedIndex = activeComponent.getSelectedItemIndex();
					redrawMenuFromActiveStack();
					activeComponent.focus();
					activeComponent.selectItemAtIndex(selectedIndex, true);
				}
			},
			/**
			 * defocus method will be called from the focus of Settings Class.
			 * @method defocus
			 * @public
			 */
			defocus: function () {
				var activeMenuItem = getActiveMenuItem(),
					activeComponent = null;
				if (activeMenuItem) {
					activeComponent = getActiveComponent(activeMenuItem);
				}
				if (activeComponent && (activeComponent._id === "firstSubMenuList" || activeComponent._id === "secondSubMenuList") && (activeMenuItem.title === "menuFavorites")) {
					$N.app.ChannelManager.saveFavouritesList();
				}
			},
			setSubMenuTitle: setSubMenuTitle,
			getDoubleMenufooterConfig: getDoubleMenufooterConfig,
			redrawMenuFromActiveStack: redrawMenuFromActiveStack,
			handlePVRStatusUpdateListener: handlePVRStatusUpdateListener,
			getSettingsShortcutObject: getSettingsShortcutObject
		};
	};
	$N.gui = $N.gui || {};
	$N.gui.SettingsPanel = SettingsPanel;
}($N || {}));
