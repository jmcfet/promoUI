/**
 * LibraryOptionsSubMenuKeypad is an extension of LibraryOptionsSubMenu containing additional
 * functionality to support menu item selection and success callback
 *
 * @class $N.gui.LibraryOptionsSubMenuKeypad
 * @constructor
 * @extends $N.gui.LibraryOptionsSubMenu
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	function LibraryOptionsSubMenuKeypad(docRef, parent) {
		LibraryOptionsSubMenuKeypad.superConstructor.call(this, docRef, parent);
		$N.apps.core.Language.adornWithGetString(LibraryOptionsSubMenuKeypad);
		this._log = new $N.apps.core.Log("CommonGUI", "LibraryOptionsSubMenuKeypad");
		this._returnObj = {
			paddingBefore: null,
			paddingAfter: null
		};

		this._menu = new $N.gui.BaseKeypad(this._docRef, this._container);

		this._successCallback = function () {};
	}
	$N.gui.Util.extend(LibraryOptionsSubMenuKeypad, $N.gui.LibraryOptionsSubMenu);

	/**
	 * @method _resetAndShowKeypad
	 * @param {String} title
	 */
	LibraryOptionsSubMenuKeypad.prototype._resetAndShowKeypad = function (title) {
		this._menu.resetKeyPadConfig();
		this._menu.setKeypadTitle(title);
		$N.app.KeyboardUtils.setKeypad(this._menu, $N.app.KeyboardType.NUMERIC);
		this._menu.configure({
			exitCallback: this._exitCallback.bind(this),
			textInputAlignment: $N.app.KeyboardType.ALIGNMENT.CENTRE,
			maxCharacters: 2,
			maxNumericKeypadValue: 99
		});
		$N.app.KeyboardUtils.setKeypadReturnObject({});
		$N.app.KeyboardUtils.setSaveCallback(this.saveOption.bind(this));
		this._menu.clearInput();
		$N.app.KeyboardUtils.showKeypad($N.app.KeyboardType.NUMERIC);
		LibraryOptionsSubMenuKeypad.superClass.activate.call(this);
	};

	/**
	 * @method saveOption
	 * @param {Object} data
	 */
	LibraryOptionsSubMenuKeypad.prototype.saveOption = function (data) {
		this._log("_itemSelected", "Enter");
		if (data.value) {
			if (this._returnObj.paddingBefore === null) {
				this._returnObj.paddingBefore = data.value;
				this._resetAndShowKeypad(LibraryOptionsSubMenuKeypad.getString('paddingAfterEpisodic'));
			} else {
				this._returnObj.paddingAfter = data.value;
			}
			this._successCallback(this._returnObj);
		}
		if (this._returnObj.paddingAfter !== null) {
			this._exitCallback();
		}
		this._log("_itemSelected", "Exit");
	};

	/**
	 * @method initialise
	 */
	LibraryOptionsSubMenuKeypad.prototype.initialise = function () {
		this._log("initialise", "Enter");
		this._menu.initialise();
		this._log("initialise", "Exit");
	};

	/**
	 * @method setMaxNumericKeypadValue
	 * @param {Number} value
	 */
	LibraryOptionsSubMenuKeypad.prototype.setMaxNumericKeypadValue = function (value) {
		this._log("setMaxNumericKeypadValue", "Enter & Exit");
		this._menu.setMaxNumericKeypadValue(Number(value));
	};

	/**
	 * @method setMaxCharacters
	 * @param {Number} length
	 */
	LibraryOptionsSubMenuKeypad.prototype.setMaxCharacters = function (length) {
		this._log("setMaxCharacters", "Enter & Exit");
		this._menu.setMaxCharacters(Number(length));
	};

	/**
	 * @method _setData
	 * @param {Object} data
	 */
	LibraryOptionsSubMenuKeypad.prototype._setData = function (data) {
		this._log("_setData", "Enter");
		this._menu.setKeypadTitle(data.title);
		this._successCallback = data.successCallback;
		this._log("_setData", "Exit");
	};

	/**
	 * @method activate
	 * @param {Object} selectedMenuItem
	 */
	LibraryOptionsSubMenuKeypad.prototype.activate = function (selectedMenuItem) {
		this._log("activate", "Enter");
		selectedMenuItem.setFirstSubTitle("_ _ " + LibraryOptionsSubMenuKeypad.getString('minutes'));
		selectedMenuItem.setSecondSubTitle("_ _ " + LibraryOptionsSubMenuKeypad.getString('minutes'));
		this._returnObj.paddingBefore = null;
		this._returnObj.paddingAfter = null;
		this._resetAndShowKeypad(LibraryOptionsSubMenuKeypad.getString('paddingBeforeEpisodic'));
		this._log("activate", "Exit");
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	LibraryOptionsSubMenuKeypad.prototype.keyHandler = function (key, repeats) {
		this._log("keyHandler", "Enter & Exit");
		return this._menu.keyHandler(key, repeats);
	};

	$N.gui.LibraryOptionsSubMenuKeypad = LibraryOptionsSubMenuKeypad;
}(window.parent.$N || {}));
