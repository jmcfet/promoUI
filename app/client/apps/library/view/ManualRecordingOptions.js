/**
 * ManualRecordingOptions is a GUI component containing a menu, submenu and legend
 * The full data for all menus and submenus is passed to this class which forwards it to
 * the appropriate components
 * The data dictates what type of submenu is shown. For example:
 * "confirmation" > ManualRecordingOptionsSubMenuConfirmation
 *
 * @class $N.gui.ManualRecordingOptions
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	function ManualRecordingOptions(docRef, parent) {
		ManualRecordingOptions.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "ManualRecordingOptions");
		$N.apps.core.Language.importLanguageBundleForObject(ManualRecordingOptions, null, "apps/library/common/", "LanguageBundle.js", null, window);

		this._container = new $N.gui.Group(this._docRef);
		this._background = new $N.gui.Container(this._docRef, this._container);
		this._menu = new $N.gui.PageableList(this._docRef, this._container);
		this._legend = new $N.gui.Container(this._docRef, this._container);
		this._legendBack = new $N.gui.Label(this._docRef, this._legend);
		this._legendEnter = new $N.gui.Label(this._docRef, this._legend);
		this._legendSave = new $N.gui.Label(this._docRef, this._legend);
		this._okIcon = new $N.gui.Image(this._docRef, this._legend);
		this._okText = new $N.gui.Label(this._docRef, this._legend);
		this._legendGreenButton = new $N.gui.Image(this._docRef, this._legend);
		this._legendBackArrow = new $N.gui.BackgroundBox(this._docRef, this._legend);
		this._legendEnterArrow = new $N.gui.BackgroundBox(this._docRef, this._legend);
		this._upArrow = new $N.gui.Image(this._docRef, this._container);
		this._downArrow = new $N.gui.Image(this._docRef, this._container);
		this._title = new $N.gui.SpanLabel(this._docRef, this._container);
		this._titleArrays = [];

		this._container.configure({
			width: 1345.5,
			height: 576
		});
		this._title.configure({
			x: -179,
			y: -168,
			height: 75,
			FirstWordsOnly: true,
			cssClass: "libraryTitle",
			spanCssClass: "libraryTitleGray"
		});
		this._background.configure({
			width: 660,
			height: 576,
			cssClass: "menuBackgroundFocus"
		});
		this._menu.configure({
			x: 0,
			y: 63,
			itemHeight: 120,
			visibleItemCount: 4,
			itemTemplate: "MultipleTitleSubtitleItem"
		});
		this._legend.configure({
			x: 0,
			y: 600,
			width: 660,
			height: 72,
			cssClass: "menuBackgroundDefocus"
		});
		this._legendBack.configure({
			x: 54,
			y: 15,
			cssClass: "settingsFooterLabel"
		});
		this._legendEnter.configure({
			x: 502,
			y: 15,
			cssClass: "settingsFooterLabel"
		});
		this._legendSave.configure({
			x: 305,
			y: 15,
			cssClass: "filterTypeText"
		});
		this._legendGreenButton.configure({
			x: 250,
			y: 15,
			href: $N.app.constants.ACTIVE_LANGUAGE_BUTTON_PATH
		});
		this._legendBackArrow.configure({
			x: 28.5,
			y: 21,
			cssClass: "settingsLeftArrowIcon"
		});
		this._legendEnterArrow.configure({
			x: 620,
			y: 21,
			cssClass: "settingsRightArrowIcon"
		});
		this._upArrow.configure({
			x: 610,
			y: 20,
			href: "../../../customise/resources/images/icons/arrows/upArrowIcon.png",
			visible: false
		});
		this._downArrow.configure({
			x: 610,
			y: 540,
			href: "../../../customise/resources/images/icons/arrows/downArrowIcon.png",
			visible: false
		});
		this._okIcon.configure({
			x : 730,
			y : 18,
			href: "../../../customise/resources/images/%RES/icons/botao_ok_branco.png"
		});
		this._okText.configure({
			x : 784,
			y : 15,
			cssClass : "recordingsOptionFooterText"
		});
		this.currentSubMenu = null;
		this.subMenuActive = false;
		this._subMenu = {
			confirmation: new $N.gui.ManualRecordingOptionsSubMenuConfirmation(this._docRef, this._container),
			dateKeyPad: new $N.gui.ManualRecordingDateKeypad(this._docRef, this._container),
			timeKeypad: new $N.gui.ManualRecordingOptionsTimeKeypad(this._docRef, this._container),
			folder: new $N.gui.ManualRecordingOptionsSubMenuFolder(this._docRef, this._container),
			keyboard: new $N.gui.LibraryOptionsSubMenuKeyboard(this._docRef, this._container),
			keypad: new $N.gui.LibraryOptionsSubMenuKeypad(this._docRef, this._container)
		};

		this._subMenu.confirmation.configure({
			x: 685.5,
			y: 0,
			visible: false
		});
		this._subMenu.keypad.configure({
			x: 685.5,
			y: 0,
			visible: false,
			maxCharacters: 3,
			maxNumericKeypadValue: 100
		});

		this._subMenu.timeKeypad.configure({
			x: 685.5,
			y: 0,
			visible: false,
			maxNumericKeypadValue: 100
		});


		this._subMenu.dateKeyPad.configure({
			x: 685.5,
			y: 0,
			visible: false,
			maxNumericKeypadValue: 100
		});

		this._subMenu.folder.configure({
			x: 685.5,
			y: 0,
			visible: false
		});
		this._subMenu.keyboard.configure({
			x: 685.5,
			y: 0,
			visible: false,
			maxCharacters: 30
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	}
	$N.gui.Util.extend(ManualRecordingOptions, $N.gui.GUIObject);

	/**
	 * @method focus
	 */
	ManualRecordingOptions.prototype.focus = function () {
		this._log("focus", "Enter");
		this._menu.focus();
		this._background.setCssClass("menuBackgroundFocus");
		this._legend.setWidth(660);
		this._legendEnter.show();
		this._legendSave.show();
		this._legendEnter.show();
		this._legendGreenButton.show();
		this._legendEnterArrow.show();
		this._okIcon.hide();
		this._okText.hide();
		this.subMenuActive = false;
		this._log("focus", "Exit");
	};

	/**
	 * @method _openSubMenu
	 */
	ManualRecordingOptions.prototype._openSubMenu = function () {
		this._log("_openSubMenu", "Enter");
		this._legendEnter.hide();
		this._legendEnterArrow.hide();
		this._legendGreenButton.hide();
		this._legendSave.hide();
		this._okIcon.show();
		this._okText.show();
		this._okText.setText(ManualRecordingOptions.getString("optionsFolderSelect"));
		this._legend.setWidth(1345.5);
		this._background.setCssClass("menuBackgroundDefocus");
		this._menu.defocus();
		this._menu.getActualSelectedItem()._highlight.setCssClass("inactiveMenuItemHighlight").show();
		this.currentSubMenu.activate(this._menu.getActualSelectedItem(), this);
		this.subMenuActive = true;
		this._log("_openSubMenu", "Exit");
	};

	/**
	 * @method getSelectedItem
	 */
	ManualRecordingOptions.prototype.getSelectedItem = function () {
		return this._menu.getSelectedItem();
	};

	/**
	 * @method getActualSelectedItem
	 */
	ManualRecordingOptions.prototype.getActualSelectedItem = function () {
		return this._menu.getActualSelectedItem();
	};

	/**
	 * @method subMenuExit
	 */
	ManualRecordingOptions.prototype.subMenuExit = function () {
		this._menu.displayData(true);
		this.currentSubMenu.passivate();
		this.focus();
	};

	/**
	 * @method _itemHighlighted
	 * @param {Object} data
	 */
	ManualRecordingOptions.prototype._itemHighlighted = function (data) {
		this._log("_itemHighlighted", "Enter");
		//TempFix: We are moving the itemHighlighted to itemselected for the regression in the PageableList. contact doug on this.
		this._log("_itemHighlighted", "Exit");
	};

	/**
	 * @method _itemSelected
	 * @param {Object} data
	 */
	ManualRecordingOptions.prototype._itemSelected = function (data) {
		this._log("_itemSelected", "Enter");
		var menuType = this._dataMapper.getSubMenuType(data),
			menuData = this._dataMapper.getSubMenuData(data);

		this.currentSubMenu = null;
		if (menuType && menuData && this._subMenu[menuType]) {
			this.currentSubMenu = this._subMenu[menuType];
			this.currentSubMenu.preview(menuData);
		}
		if (this.currentSubMenu) {
			this._openSubMenu();
		}
		this._log("_itemSelected", "Exit");
	};

	/**
	 * @method registerJobCallbacks
	 */
	ManualRecordingOptions.prototype.registerJobCallbacks = function () {
		$N.app.PVRUtil.registerUIRefreshListener($N.app.ManualRecordingOptionHelper.manualRecordingSetOKCallback, this);
		CCOM.Scheduler.addEventListener("onAddTaskFailed", $N.app.ManualRecordingOptionHelper.manualRecordingSetFailedCallback);
	};

	/**
	 * @method unregisterJobCallbacks
	 */
	ManualRecordingOptions.prototype.unregisterJobCallbacks = function () {
		$N.app.PVRUtil.unregisterUIRefreshListener($N.app.ManualRecordingOptionHelper.manualRecordingSetOKCallback);
		CCOM.Scheduler.removeEventListener("onAddTaskFailed", $N.app.ManualRecordingOptionHelper.manualRecordingSetFailedCallback, false);
	};

	/**
	 * @method initialise
	 */
	ManualRecordingOptions.prototype.initialise = function () {
		this._log("initialise", "Enter");
		var me = this,
			submenu,
			pagedCallback = function (atTopOfList, atBottomOfList) {
				me._log("pagedCallback", "Enter");
				me._upArrow.setVisible(atBottomOfList);
				me._downArrow.setVisible(atTopOfList);
				me._log("pagedCallback", "Exit");
			};
		this._menu.setItemHighlightedCallback(this._itemHighlighted.bind(this));
		this._menu.setItemSelectedCallback(this._itemSelected.bind(this));
		this._menu.initialise();
		for (submenu in this._subMenu) {
			if (this._subMenu.hasOwnProperty(submenu)) {
				this._subMenu[submenu].initialise();
				this._subMenu[submenu].setExitCallback(this.subMenuExit.bind(this));
			}
		}
		this._menu.setListPagedCallback(pagedCallback);
		this._log("initialise", "Exit");
	};

	/**
	 * @method setDataMapper
	 * @param {Object} dataMapper
	 */
	ManualRecordingOptions.prototype.setDataMapper = function (dataMapper) {
		this._log("setDataMapper", "Enter");
		this._dataMapper = dataMapper;
		this._menu.setDataMapper(dataMapper);
		this._log("setDataMapper", "Exit");
	};


	/**
	 * @method isSubmenuActive
	 * @return {Bool}
	 */
	ManualRecordingOptions.prototype.isSubmenuActive = function () {
		return this.subMenuActive;
	};

	/**
	 * @method refreshMenuData
	 * refreshes the menu data and redraws the menu based on last selected index.
	 */
	ManualRecordingOptions.prototype.refreshMenuData = function (data) {
		var currentIndex = this._menu.getActualSelectedRowIndex();
		this._menu.setData(data);
		this._menu.displayData(false, true);
		this._menu.selectItemAtIndex(currentIndex, true);
	};

	/**
	 * @method _validateAndSetRecording
	 * validate the start time and stop time entries entered by the user.
	 * if data is valid then manual recording is set with the user rendered data.
	 * if data is invalid the error message is shown on the screen and manual recording is not set.
	 */
	ManualRecordingOptions.prototype._validateAndSetRecording = function () {
		var manualRecordingProperties = $N.app.ManualRecordingOptionHelper.getAllManualRecordingProperties(),
			startDate = manualRecordingProperties.date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3/$2/$1"),
			startTimeInMs = new Date(startDate + "," + manualRecordingProperties.startTime).getTime(),
			stopTimeInMs = new Date(startDate + "," + manualRecordingProperties.stopTime).getTime(),
			currentTimeInMs = new Date().getTime();
		if ((startTimeInMs < currentTimeInMs) || (startTimeInMs === stopTimeInMs)) {
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_MANUAL_REC_FAIL_MSG,
				$N.app.ManualRecordingOptionHelper.getString("manualRecordingFailureTitle"),
				$N.app.ManualRecordingOptionHelper.getString("manualRecordingErrorMessage"));
			return true; //User should stay in this menu to correct and proceed.
		} else {
			$N.app.ManualRecordingOptionHelper.createManualRecording();
			$N.app.ManualRecordingOptionHelper.setManualRecordingProperty("isTimeOrDateModified", false);
			return false; //Manual recording values are valid and hence user can passivate to library.
		}
	};

	/**
	 * @method titlePush
	 * @param {Object} newTitle
	 */

	ManualRecordingOptions.prototype.titlePush = function (newTitle) {
		var oldPath = this._titleArrays.join(" ");
		this._titleArrays.push(newTitle);
		this._title.setText(this._titleArrays.join(" "));
		this._title.setSpanOnText(oldPath);
	};

	/**
	 * @method titlePopup
	 * @param {Object} newTitle
	 */
	ManualRecordingOptions.prototype.titlePop = function () {
		var length = this._titleArrays.length;
		if (!length) {
			return;
		}
		this._titleArrays.pop();
		if (!this._titleArrays.length) {
			return;
		} else if (this._titleArrays.length === 1) {
			this._title.setText(this._titleArrays[0]);
			this._title.setSpanOnText("");
		} else {
			this._title.setText(this._titleArrays.join(" "));
			this._title.setSpanOnText(this._titleArrays.slice(0, length - 1).join(" "));
		}
	};

	/**
	 * @method preview
	 * @param {Object} data
	 */
	ManualRecordingOptions.prototype.preview = function (data) {
		this._log("preview", "Enter");
		this._legend.hide();
		if (this.currentSubMenu) {
			this.currentSubMenu.passivate();
		}
		this._menu.setData(data);
		this._menu.displayData(true);
		this._menu.setVisible(true);
		this._upArrow.setVisible(false);
		this._downArrow.setVisible(false);
		this._background.setCssClass("menuBackgroundDefocus");
		this._background.setVisible(true);
		this.show();
		this._log("preview", "Exit");
	};

	ManualRecordingOptions.prototype.activate = function (data) {
		this._log("activate", "Enter");
		this.registerJobCallbacks();
		this._legend.show();
		this._legendBack.setText(ManualRecordingOptions.getString("menuSettingsBack"));
		this._legendEnter.setText(ManualRecordingOptions.getString("menuSettingsForward"));
		this._legendSave.setText(ManualRecordingOptions.getString("manualRecordingSave"));
		this._okIcon.hide();
		this._okText.hide();
		if (this.currentSubMenu) {
			this.currentSubMenu.passivate();
		}
		this._menu.setData(data);
		this._menu.displayData();
		this._upArrow.setVisible(false);
		this._downArrow.setVisible(data.length > this._menu.getVisibleItemCount());
		this.show();
		this.focus();
		this._log("activate", "Exit");
	};

	/**
	 * @method passivate
	 */
	ManualRecordingOptions.prototype.passivate = function () {
		this._log("passivate", "Enter");
		this.unregisterJobCallbacks();
		this._legendBack.setText(ManualRecordingOptions.getString("menuSettingsBack"));
		this._legendEnter.setText(ManualRecordingOptions.getString("menuSettingsForward"));
		this._legendSave.setText(ManualRecordingOptions.getString("manualRecordingSave"));
		if (this.subMenuActive) {
			this.subMenuExit();
		}
		$N.app.ManualRecordingOptionHelper.setManualRecordingProperty("isTimeOrDateModified", false);
		$N.app.StandardTimers.minuteTimer.disable("ManualRecordingMenuHelperClock");
		this._background.setCssClass("menuBackgroundDefocus");
		this._menu.defocus();
		this.titlePop();
		this.hide();
		this._log("passivate", "Exit");
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	ManualRecordingOptions.prototype.keyHandler = function (key, repeats) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;
		if (this.subMenuActive) {
			handled = this.currentSubMenu.keyHandler(key, repeats);
		} else {
			handled = this._menu.keyHandler(key, repeats);
		}
		if (!handled) {
			switch (key) {
			case keys.KEY_GREEN:
				//Save the user configs and create a manual recording out of it.
				handled = this._validateAndSetRecording();
				break;
			case keys.KEY_BLUE:
			case keys.KEY_RIGHT:
			case keys.KEY_RED:
			case keys.KEY_INFO:
			case keys.KEY_YELLOW:
				handled = true;
				break;
			case keys.KEY_HOME:
			case keys.KEY_MENU:
				if (this.subMenuActive) {
					this.subMenuExit();
				} else {
					this.passivate();
				}
				handled = false;
				break;
			case keys.KEY_LEFT:
			case keys.KEY_BACK:
				if (this.subMenuActive) {
					this.subMenuExit();
					handled = true;
				} else {
					this.passivate();
					handled = false;
				}
				break;
			case keys.KEY_EXIT:
				this.passivate();
				break;
			}
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	$N.gui.ManualRecordingOptions = ManualRecordingOptions;
}(window.parent.$N || {}));
