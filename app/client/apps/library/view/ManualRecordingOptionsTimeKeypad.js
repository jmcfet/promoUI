/**
 * ManualRecordingOptionsTimeKeypad is an extension of LibraryOptionsSubMenu containing additional
 * functionality to support menu item selection and success callback
 *
 * @class $N.gui.ManualRecordingOptionsTimeKeypad
 * @constructor
 * @extends $N.gui.LibraryOptionsSubMenu
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	function ManualRecordingOptionsTimeKeypad(docRef, parent) {
		ManualRecordingOptionsTimeKeypad.superConstructor.call(this, docRef, parent);
		$N.apps.core.Language.adornWithGetString(ManualRecordingOptionsTimeKeypad);
		this._log = new $N.apps.core.Log("CommonGUI", "ManualRecordingOptionsTimeKeypad");
		this._returnObj = {
			startTime: null,
			stopTime: null
		};
		this.stopTimeKeypad = null;
		this._menu = new $N.gui.BaseKeypad(this._docRef, this._container);
		this._successCallback = function () {};
	}

	$N.gui.Util.extend(ManualRecordingOptionsTimeKeypad, $N.gui.LibraryOptionsSubMenu);


	ManualRecordingOptionsTimeKeypad.prototype.setTimeKeyPad = function () {
		this._menu.resetKeyPadConfig();
		this._menu.clearInput();
		this._menu.setInputFormat(2, 2, ":");
	};


	ManualRecordingOptionsTimeKeypad.prototype.menuConfig = function () {
		this._menu.configure({
			exitCallback: this._exitCallback.bind(this),
			textInputAlignment: $N.app.KeyboardType.ALIGNMENT.CENTRE
		});
	};

	/**
	 * method used for getting the valid time format
	 * returns false if invalid
	 * @method getValidTime
	 * @private
	 * @param {String} time
	 */
	ManualRecordingOptionsTimeKeypad.prototype.getValidTime = function (time) {
		var me = this,
			newTime = time.split(":");
		if ($N.app.DateTimeUtil.isValidTime(newTime[0], newTime[1])) {
			return time;
		} else {
			$N.app.ErrorMessage.showInvalidTimeDialog(function () {
				me.setTimeKeyPad();
			});
			return false;
		}
	};

	/**
	 * @method saveOption
	 * @param {Object} data
	 */

	ManualRecordingOptionsTimeKeypad.prototype.saveOption = function (data) {
		this._log("_itemSelected", "Enter");
		var isValidTime = false;
		if (data.value) {
			isValidTime = this.getValidTime(data.value);
		}
		if (isValidTime !== false) {
			if (this._returnObj.startTime === null) {
				this._returnObj.startTime = isValidTime;
				this._menu.setKeypadTitle(ManualRecordingOptionsTimeKeypad.getString('manualRecordingStopTime'));
				this.stopTimeKeypad = true;
			} else {
				this._returnObj.stopTime = isValidTime;
			}
			this._successCallback(this._returnObj);
		}
		if (this._returnObj.stopTime !== null) {
			this._exitCallback();
		}
		this._log("_itemSelected", "Exit");
	};

	/**
	 * @method initialise
	 */

	ManualRecordingOptionsTimeKeypad.prototype.initialise = function () {
		this._log("initialise", "Enter");
		this._menu.initialise();
		this._log("initialise", "Exit");
	};



	/**
	 * @method setMaxNumericKeypadValue
	 * @param {Number} value
	 */

	ManualRecordingOptionsTimeKeypad.prototype.setMaxNumericKeypadValue = function (value) {
		this._log("setMaxNumericKeypadValue", "Enter & Exit");
		this._menu.setMaxNumericKeypadValue(Number(value));
	};

	/**
	 * @method setMaxCharacters
	 * @param {Number} length
	 */

	ManualRecordingOptionsTimeKeypad.prototype.setMaxCharacters = function (length) {
		this._log("setMaxCharacters", "Enter & Exit");
		this._menu.setMaxCharacters(Number(length));
	};



	/**
	 * @method _setData
	 * @param {Object} data
	 */

	ManualRecordingOptionsTimeKeypad.prototype._setData = function (data) {
		this._log("_setData", "Enter");
		this._menu.setKeypadTitle(data.title);
		this._successCallback = data.successCallback;
		this._log("_setData", "Exit");
	};

	/**
	 * @method _keyPadConfig
	 * @param {Object} data
	 */

	ManualRecordingOptionsTimeKeypad.prototype._keyPadConfig = function (selectedMenuItem) {
		this._menu.resetKeyPadConfig();
		this._menu.setKeypadTitle(ManualRecordingOptionsTimeKeypad.getString('manualRecordingStartTime'));
		selectedMenuItem.setFirstSubTitle('_ _ : _ _');
		selectedMenuItem.setSecondSubTitle('_ _ : _ _');
		this._returnObj.startTime = null;
		this._returnObj.stopTime = null;
		$N.app.KeyboardUtils.setKeypad(this._menu, $N.app.KeyboardType.NUMERIC);
		this.menuConfig();
		$N.app.KeyboardUtils.setKeypadReturnObject({});
		$N.app.KeyboardUtils.setSaveCallback(this.saveOption.bind(this));
		this.setTimeKeyPad();
		$N.app.KeyboardUtils.showKeypad($N.app.KeyboardType.NUMERIC);
	};


	/**
	 * @method activate
	 * @param {Object} selectedMenuItem
	 */

	ManualRecordingOptionsTimeKeypad.prototype.activate = function (selectedMenuItem) {
		this._log("activate", "Enter");
		this._keyPadConfig(selectedMenuItem);
		ManualRecordingOptionsTimeKeypad.superClass.activate.call(this);
		this._log("activate", "Exit");
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */

	ManualRecordingOptionsTimeKeypad.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter & Exit");
		var handled = false,
			keys = $N.apps.core.KeyInterceptor.getKeyMap();
		if (key === keys.KEY_GREEN) {
			//disable green key when ManualRecordingOptionsTimeKeypad is active.
			handled = true;
		} else {
			handled = this._menu.keyHandler(key);
		}
		if (key === keys.KEY_OK && this.stopTimeKeypad) {
			//if OK key is pressed then set the input format. reason - in BaseKeypad.js  setInputFormat is disabled on OK key press.
			this.setTimeKeyPad();
			this.stopTimeKeypad = false;
			handled = true;
		}
		return handled;
	};
	$N.gui.ManualRecordingOptionsTimeKeypad = ManualRecordingOptionsTimeKeypad;

}(window.parent.$N || {}));