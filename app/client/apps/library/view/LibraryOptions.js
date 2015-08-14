/**
 * LibraryOptions is a GUI component containing a menu, submenu and legend
 * The full data for all menus and submenus is passed to this class which forwards it to
 * the appropriate components
 * The data dictates what type of submenu is shown. For example:
 * "confirmation" > LibraryOptionsSubMenuConfirmation
 *
 * @class $N.gui.LibraryOptions
 * @constructor
 * @extends $N.gui.GUIObject
 * #depends LibraryOptionsSubMenuConfirmation.js
 * #depends LibraryOptionsSubMenuKeypad.js
 * #depends LibraryOptionsSubMenuFolder.js
 * #depends LibraryOptionsSubMenuKeyboard.js
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	function LibraryOptions(docRef, parent) {
		LibraryOptions.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "LibraryOptions");
		$N.apps.core.Language.importLanguageBundleForObject(LibraryOptions, null, "apps/library/common/", "LanguageBundle.js", null, window);

		this._container = new $N.gui.Group(this._docRef);
		this._background = new $N.gui.Container(this._docRef, this._container);
		this._menu = new $N.gui.PageableList(this._docRef, this._container);
		this._legend = new $N.gui.Container(this._docRef, this._container);
		this._legendBack = new $N.gui.Label(this._docRef, this._legend);
		this._okIcon = new $N.gui.Image(this._docRef, this._legend);
		this._okText = new $N.gui.Label(this._docRef, this._legend);
		this._legendEnter = new $N.gui.Label(this._docRef, this._legend);
		this._legendBackArrow = new $N.gui.MaskIcon(this._docRef, this._legend);
		this._legendEnterArrow = new $N.gui.MaskIcon(this._docRef, this._legend);
		this._upArrow = new $N.gui.MaskIcon(this._docRef, this._container);
		this._downArrow = new $N.gui.MaskIcon(this._docRef, this._container);
		this._title = new $N.gui.SpanLabel(this._docRef, this._container);
		this._titleArrays = [];

		this._container.configure({
			width: 1345.5,
			height: 576
		});
		this._title.configure({
			x: 20,
			y: -100,
			height: 100,
			FirstWordsOnly: true,
			cssClass: "newLibraryTitle",
			spanCssClass: "newLibraryTitleGray"
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
			x: 61.5,
			y: 15,
			cssClass: "filterTypeText"
		});
		this._legendEnter.configure({
			x: 483,
			y: 15,
			cssClass: "filterTypeText"
		});
		this._legendBackArrow.configure({
			x: 28.5,
			y: 21,
			width: 18,
			height: 30,
			href: "../../../customise/resources/images/icons/arrows/leftArrowIcon.png",
			color: "#fff"
		});
		this._legendEnterArrow.configure({
			x: 615,
			y: 21,
			width: 18,
			height: 30,
			href: "../../../customise/resources/images/icons/arrows/rightArrowIcon.png",
			color: "#fff"
		});
		this._upArrow.configure({
			x: 610,
			y: 20,
			width: 30,
			height: 18,
			href: "../../../customise/resources/images/icons/arrows/upArrowIcon.png",
			visible: false
		});
		this._downArrow.configure({
			x: 610,
			y: 540,
			width: 30,
			height: 18,
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
			confirmation: new $N.gui.LibraryOptionsSubMenuConfirmation(this._docRef, this._container),
			keypad: new $N.gui.LibraryOptionsSubMenuKeypad(this._docRef, this._container),
			folder: new $N.gui.LibraryOptionsSubMenuFolder(this._docRef, this._container),
			keyboard: new $N.gui.LibraryOptionsSubMenuKeyboard(this._docRef, this._container)
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
	$N.gui.Util.extend(LibraryOptions, $N.gui.GUIObject);

	/**
	 * @method focus
	 */
	LibraryOptions.prototype.focus = function () {
		this._log("focus", "Enter");
		this._menu.focus();
		this._background.setCssClass("menuBackgroundFocus");
		this._legend.setWidth(660);
		this._legendEnter.show();
		this._legendEnterArrow.show();
		this._okIcon.hide();
		this._okText.hide();
		this.subMenuActive = false;
		this._log("focus", "Exit");
	};

	/**
	 * @method _openSubMenu
	 */
	LibraryOptions.prototype._openSubMenu = function () {
		this._legendEnter.hide();
		this._legendEnterArrow.hide();
		this._okIcon.show();
		this._okText.show();
		this._okText.setText(LibraryOptions.getString("optionsFolderSelect"));
		this._legend.setWidth(1345.5);
		this._background.setCssClass("menuBackgroundDefocus");
		this._menu.defocus();
		this._menu.getActualSelectedItem()._highlight.setCssClass("inactiveMenuItemHighlight").show();
		this.currentSubMenu.activate(this._menu.getActualSelectedItem(), this);
		this.subMenuActive = true;
	};

	/**
	 * @method getSelectedItem
	 */
	LibraryOptions.prototype.getSelectedItem = function () {
		return this._menu.getSelectedItem();
	};

	/**
	 * @method getActualSelectedItem
	 */
	LibraryOptions.prototype.getActualSelectedItem = function () {
		return this._menu.getActualSelectedItem();
	};

	/**
	 * @method subMenuExit
	 */
	LibraryOptions.prototype.subMenuExit = function () {
		this.currentSubMenu.passivate();
		this.focus();
	};

	/**
	 * @method _itemHighlighted
	 * @param {Object} data
	 */
	LibraryOptions.prototype._itemHighlighted = function (data) {
		this._log("_itemHighlighted", "Enter");
		var menuType = this._dataMapper.getSubMenuType(data),
			menuData = this._dataMapper.getSubMenuData(data);
		this.currentSubMenu = null;
		if (menuType && menuData && this._subMenu[menuType]) {
			this.currentSubMenu = this._subMenu[menuType];
			this.currentSubMenu.preview(menuData);
		}
		this._log("_itemHighlighted", "Exit");
	};

	/**
	 * @method _itemSelected
	 * @param {Object} data
	 */
	LibraryOptions.prototype._itemSelected = function (data) {
		this._log("_itemSelected", "Enter");
		if (this.currentSubMenu) {
			this._openSubMenu();
		}
		this._log("_itemSelected", "Exit");
	};

	/**
	 * @method initialise
	 */
	LibraryOptions.prototype.initialise = function () {
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
	LibraryOptions.prototype.setDataMapper = function (dataMapper) {
		this._log("setDataMapper", "Enter");
		this._dataMapper = dataMapper;
		this._menu.setDataMapper(dataMapper);
		this._log("setDataMapper", "Exit");
	};

	/**
	 * @method titlePush
	 * @param {Object} newTitle
	 */

	LibraryOptions.prototype.titlePush = function (newTitle) {
		var oldPath = this._titleArrays.join(" ");
		this._titleArrays.push(newTitle);
		this._title.setText(this._titleArrays.join(" "));
		this._title.setSpanOnText(oldPath);
	};

	/**
	 * @method titlePopup
	 */
	LibraryOptions.prototype.titlePop = function () {
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
	 * @method activate
	 * @param {Object} data
	 */
	LibraryOptions.prototype.activate = function (data) {
		this._log("activate", "Enter");
		this.titlePush(LibraryOptions.getString("optionsTitle"));
		this._okIcon.hide();
		this._okText.hide();
		this._legendBack.setText(LibraryOptions.getString("menuSettingsBack"));
		this._legendEnter.setText(LibraryOptions.getString("menuSettingsForward"));
		if (this.currentSubMenu) {
			this.currentSubMenu.passivate();
		}
		this._menu.setData(data);
		this._menu.displayData();
		this._upArrow.setVisible(false);
		this._downArrow.setVisible(data.length > this._menu.getVisibleItemCount());
		this.show();
		this._log("activate", "Exit");
	};

	/**
	 * @method passivate
	 */
	LibraryOptions.prototype.passivate = function () {
		this._log("passivate", "Enter");
		if (this.subMenuActive) {
			this.subMenuExit();
		}
		this.titlePop();
		this.hide();
		this._log("passivate", "Exit");
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	LibraryOptions.prototype.keyHandler = function (key, repeats) {
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
			case keys.KEY_LEFT:
			case keys.KEY_BACK:
				if (this.subMenuActive) {
					this.subMenuExit();
					handled = true;
				}
				break;
			case keys.KEY_GREEN:
				if (this.subMenuActive) {
					handled = true;
				}
				break;
			}
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	$N.gui.LibraryOptions = LibraryOptions;
}(window.parent.$N || {}));
