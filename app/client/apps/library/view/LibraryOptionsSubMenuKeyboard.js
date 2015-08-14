/**
 * LibraryOptionsSubMenuKeyboard is an extension of LibraryOptionsSubMenu containing additional
 * functionality to support menu item selection and success callback
 *
 * @class $N.gui.LibraryOptionsSubMenuKeyboard
 * @constructor
 * @extends $N.gui.LibraryOptionsSubMenu
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	function LibraryOptionsSubMenuKeyboard(docRef, parent) {
		LibraryOptionsSubMenuKeyboard.superConstructor.call(this, docRef, parent);
		$N.apps.core.Language.adornWithGetString(LibraryOptionsSubMenuKeyboard);
		this._log = new $N.apps.core.Log("CommonGUI", "LibraryOptionsSubMenuKeyboard");
		this._menu = new $N.gui.BaseKeypad(this._docRef, this._container);
		this._footer = new $N.gui.Group(this._docRef, this._container);
		this._greenIcon = new $N.gui.Image(this._docRef, this._footer);
		this._greenIconText = new $N.gui.Label(this._docRef, this._footer);
		this._footer.configure({
			y : 601.5
		});
		this._greenIcon.configure({
			x : 350,
			y : 18,
			href : "../../../customise/resources/images/%RES/icons/botao_verde.png"
		});
		this._greenIconText.configure({
			x : 400,
			y : 15,
			cssClass : "recordingsOptionFooterText"
		});
		this._successCallback = function () {};
	}
	$N.gui.Util.extend(LibraryOptionsSubMenuKeyboard, $N.gui.LibraryOptionsSubMenu);

	/**
	 * @method saveOption
	 * @param {Object} data
	 */
	LibraryOptionsSubMenuKeyboard.prototype.saveOption = function (data) {
		this._log("saveOption", "Enter");
		if (data.value) {
			this._successCallback();
		}
		this._exitCallback();
		this._log("saveOption", "Exit");
	};

	/**
	 * @method initialise
	 */
	LibraryOptionsSubMenuKeyboard.prototype.initialise = function () {
		this._log("initialise", "Enter");
		this._menu.initialise();
		this._log("initialise", "Exit");
	};

	/**
	 * @method setMaxCharacters
	 * @param {Number} length
	 */
	LibraryOptionsSubMenuKeyboard.prototype.setMaxCharacters = function (length) {
		this._log("setMaxCharacters", "Enter & Exit");
		this._menu.setMaxCharacters(Number(length));
	};

	/**
	 * @method _setData
	 * @param {Object} data
	 */
	LibraryOptionsSubMenuKeyboard.prototype._setData = function (data) {
		this._log("_setData", "Enter");
		this._menu.setKeypadTitle(data.title);
		this._menu.setColorKeyCallbacks({
			"green" : data.successCallback
		});
		this._menu.setInputValue(data.labelText);
		this._greenIconText.setText(data.greenIconText);
		this._successCallback = data.successCallback;
		this._log("_setData", "Exit");
	};

	/**
	 * @method activate
	 * @param {Object} selectedMenuItem
	 */
	LibraryOptionsSubMenuKeyboard.prototype.activate = function (selectedMenuItem) {
		this._log("activate", "Enter");
		$N.app.KeyboardUtils.setKeypad(this._menu, $N.app.KeyboardType.ALPHA_NUMERIC_UPPERCASE);
		this._menu.configure({
			exitCallback: this._exitCallback.bind(this),
			textInputAlignment: $N.app.KeyboardType.ALIGNMENT.LEFT,
			maxCharacters: $N.app.FolderUtil.FOLDER_NAME_MAX_CHARACTERS,
			cursorEnable: true
		});
		$N.app.KeyboardUtils.setSaveCallback(this.saveOption.bind(this));
		$N.app.KeyboardUtils.showKeypad($N.app.KeyboardType.ALPHA_NUMERIC_UPPERCASE);
		LibraryOptionsSubMenuKeyboard.superClass.activate.call(this);
		this._log("activate", "Exit");
	};

	/**
	 * @method passivate
	 */
	LibraryOptionsSubMenuKeyboard.prototype.passivate = function () {
		this._log("passivate", "Enter");
		this.hide();
		this._menu.defocus();
		this._log("passivate", "Exit");
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	LibraryOptionsSubMenuKeyboard.prototype.keyHandler = function (key, repeats) {
		this._log("keyHandler", "Enter & Exit");
		return this._menu.keyHandler(key, repeats);
	};

	$N.gui.LibraryOptionsSubMenuKeyboard = LibraryOptionsSubMenuKeyboard;
}(window.parent.$N || {}));