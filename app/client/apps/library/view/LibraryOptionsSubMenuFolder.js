/**
 * LibraryOptionsSubMenuFolder is an extension of LibraryOptionsSubMenu containing additional
 * functionality to support menu item selection and success callback
 *
 * @class $N.gui.LibraryOptionsSubMenuFolder
 * @constructor
 * @extends $N.gui.LibraryOptionsSubMenu
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {

	function LibraryOptionsSubMenuFolder(docRef, parent) {
		LibraryOptionsSubMenuFolder.superConstructor.call(this, docRef, parent);
		this._log = new $N.apps.core.Log("CommonGUI", "LibraryOptionsSubMenuFolder");
		this._optionsController = null;
		this._parentItem = null;
		this._menuItem = null;
		this._keypadBackground = new $N.gui.Container(this._docRef, this._container);
		this._keypad = new $N.gui.BaseKeypad(this._docRef, this._container);
		this._menu.configure({
			itemTemplate: "LibraryOptionsSubMenuIconItem"
		});
		this._keypad.configure({
			x: -685.5
		});
		this._keypadBackground.configure({
			x: -685.5,
			width: this._width,
			height: this._height,
			cssClass: "menuBackgroundDefocus"
		});
		this._footer = new $N.gui.Group(this._docRef, this._container);
		this._greenIcon = new $N.gui.Image(this._docRef, this._footer);
		this._greenIconText = new $N.gui.Label(this._docRef, this._footer);
		this._footer.configure({
			y : 601.5
		});
		this._greenIcon.configure({
			x : 380,
			y : 18,
			href : "../../../customise/resources/images/%RES/icons/botao_verde.png"
		});
		this._greenIconText.configure({
			x : 430,
			y : 15,
			cssClass : "recordingsOptionFooterText"
		});
		this._successCallback = function () {};
	}

	$N.gui.Util.extend(LibraryOptionsSubMenuFolder, $N.gui.LibraryOptionsSubMenu);

	LibraryOptionsSubMenuFolder.prototype._itemSelected = function (data) {
		var listData = this._menu.getData(),
			i;
		if (data.selected) {//if the data is already selected then exit from second sub-menu to to first sub - menu.
			this._exitCallback();
			return;
		}
		for (i = 0; i < listData.length; i++) {
			listData[i].selected = false;
		}
		data.selected = true;
		this._menu.displayData();
		this._parentItem.setFirstSubTitle(data.title);
		this._successCallback(data.value);
		this._exitCallback();
	};

	LibraryOptionsSubMenuFolder.prototype.hideKeypad = function () {
		this._keypad.hide();
		this._keypadBackground.hide();
	};

	function keypadExit() {
		this.hideKeypad();
		this.afterHideKeypad();
	}

	function keypadGreenKeyCallback(txt) {
		this._log("keypadGreenKeyCallback", "Enter");
		var folderName = '',
			listData = this._menu.getData(),
			folderList = $N.platform.system.Preferences.get($N.app.constants.PVR_NON_EPISODIC_FOLDER_LIST),
			i,
			newItem = {};
		if (txt) {
			txt = $N.app.StringUtil.firstLetterPerWordCapitol(txt);
			folderName = txt.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
			this._log("keypadGreenKeyCallback", "New folder name is " + folderName + ";");
		}
		if (!folderName) {
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_INVALID_FOLDER_NAME,
						$N.gui.LibraryOptions.getString("optionsFolderErrorTitle"),
						$N.gui.LibraryOptions.getString("optionsFolderInvalidName"));
		} else {
			newItem = {
				title: folderName,
				value: folderName,
				selected: false
			};
			if (folderList.indexOf(folderName) > -1) {
				$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_DUPLICATE_FOLDER_NAME,
						$N.gui.LibraryOptions.getString("optionsFolderErrorTitle"),
						$N.gui.LibraryOptions.getString("optionsFolderDupName"));
				return;
			} else if (this._parentItem._firstSubTitle.getText() !== "---" && this._parentItem._firstSubTitle.getText() === folderName) {
				$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_DUPLICATE_FOLDER_NAME,
						$N.gui.LibraryOptions.getString("optionsFolderErrorTitle"),
						$N.gui.LibraryOptions.getString("optionsFolderDupName"));
				return;
			} else {
				folderList.splice(0, 0, folderName.toString());
				$N.platform.system.Preferences.set($N.app.constants.PVR_NON_EPISODIC_FOLDER_LIST, folderList);
			}
			listData.splice(1, 0, newItem);
			listData = $N.app.FolderUtil.sortFolderList(listData);//sort the array of folders based on title.
			this._menu.setData(listData);
			this._menu.displayData();
			this.hideKeypad();
			this.afterHideKeypad();
			this.showList();
		}
		this._log("keypadGreenKeyCallback", "Exit");
	}

	LibraryOptionsSubMenuFolder.prototype._setData = function (data) {
		LibraryOptionsSubMenuFolder.superClass._setData.call(this, data);
		this._successCallback = data.successCallback;
	};

	LibraryOptionsSubMenuFolder.prototype.beforeShowKeypad = function () {
		this._log("beforeShowKeypad", "Enter");
		this._optionsController.titlePush($N.gui.LibraryOptions.getString("optionsFolderCreate"));
		this._optionsController._background.hide();
		this._optionsController._menu.hide();
		this._optionsController._okIcon.hide();
		this._optionsController._okText.hide();
		this._optionsController._upArrow.setHref("");
		this._optionsController._downArrow.setHref("");
		this._optionsController._legend.setWidth(660);
		this._log("beforeShowKeypad", "Exit");
	};

	LibraryOptionsSubMenuFolder.prototype.afterHideKeypad = function () {
		this._log("afterHideKeypad", "Enter");
		this._optionsController.titlePop();
		this._optionsController._background.show();
		this._optionsController._menu.show();
		this._optionsController._okIcon.show();
		this._optionsController._okText.show();
		this._optionsController._upArrow.setHref("../../../customise/resources/images/icons/arrows/upArrowIcon.png");
		this._optionsController._downArrow.setHref("../../../customise/resources/images/icons/arrows/downArrowIcon.png");
		this._optionsController._legend.setWidth(1345.5);
		this._log("afterHideKeypad", "Exit");
	};

	LibraryOptionsSubMenuFolder.prototype.keypadInitialise = function () {
		this._keypad.resetKeyPadConfig();
		$N.app.KeyboardUtils.setKeypad(this._keypad, $N.app.KeyboardType.ALPHA_NUMERIC_UPPERCASE);
		this._keypad.setMaxCharacters(18);
		this._keypad.enableCursor();
		this._keypad.setColorKeyCallbacks({
			"green" : keypadGreenKeyCallback.bind(this)
		});
		this._keypad.setExitCallback(keypadExit.bind(this));
		$N.app.KeyboardUtils.showKeypad($N.app.KeyboardType.ALPHA_NUMERIC_UPPERCASE);
	};

	LibraryOptionsSubMenuFolder.prototype.showKeypad = function (title) {
		this._keypad.setKeypadTitle(title);
		this._keypad.clearInput();
		this._keypadBackground.show();
		this._keypad.show();
		this._keypad.focus();
		this.showFooter("keypad");
	};

	LibraryOptionsSubMenuFolder.prototype.showList = function () {
		var FIRST_ITEM_INDEX = 1;
		this._background.show();
		this._title.show();
		this._menu.show();
		this._menu.focus();
		this._menu.selectItemAtIndex(FIRST_ITEM_INDEX, true);
		this.showFooter("list");
	};

	LibraryOptionsSubMenuFolder.prototype.hideList = function () {
		this._background.hide();
		this._title.hide();
		this._menu.hide();
	};

	LibraryOptionsSubMenuFolder.prototype.showFooter = function (type) {
		if (type === "list") {
			this._greenIconText.setText($N.gui.LibraryOptions.getString("optionsFolderNew"));
			this._greenIcon.setX(380);
			this._greenIconText.setX(430);
		} else if (type === "keypad") {
			this._greenIconText.setText($N.gui.LibraryOptions.getString("optionsFolderCreate"));
			this._greenIcon.setX(-370);
			this._greenIconText.setX(-320);
		}
		this._greenIcon.setY(13);
	};

	LibraryOptionsSubMenuFolder.prototype.activate = function (parentItem, optionsController) {
		this._log("activate", "Enter");
		var listData = this._menu.getData();
		this._optionsController = optionsController;
		this._parentItem = parentItem;
		this._menuItem = optionsController.getSelectedItem();
		this.keypadInitialise();
		if (listData.length < 0) { //if folder list is having no items then keypad should be shown for creating a new folder.
			this.showKeypad($N.gui.LibraryOptions.getString("optionsNewFolderName"));
			this.hideList();
		} else {
			this.showList();
			this.hideKeypad();
		}
		this.show();
		this._log("activate", "Exit");
	};

	LibraryOptionsSubMenuFolder.prototype.initialise = function () {
		LibraryOptionsSubMenuFolder.superClass.initialise.call(this);
		this._keypad.initialise();
	};

	LibraryOptionsSubMenuFolder.prototype.keyHandler = function (key, repeats) {
		var handled = false,
			keys = $N.apps.core.KeyInterceptor.getKeyMap();
		this._log("keyHandler", "Enter");
		if (this._keypad.isVisible()) {
			handled = this._keypad.keyHandler(key, repeats);
			if (!this._keypad.isVisible()) {
				if (!this._menu.getData().length) {
					handled = false;
				} else {
					this.showList();
					// need to let global Key_handler handle EXIT, hence why we return false for this case.
					handled = (key !== keys.KEY_EXIT);
				}
			}
		} else {
			if (key === keys.KEY_GREEN) {
				this.beforeShowKeypad();
				this.showKeypad($N.gui.LibraryOptions.getString("optionsNewFolderName"));
				this.hideList();
				handled = true;
			} else {
				handled = LibraryOptionsSubMenuFolder.superClass.keyHandler.call(this, key);
			}
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	$N.gui.LibraryOptionsSubMenuFolder = LibraryOptionsSubMenuFolder;
}(window.parent.$N || {}));
