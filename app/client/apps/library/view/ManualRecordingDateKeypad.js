/**
 * ManualRecordingDateKeypad is an extension of LibraryOptionsSubMenu containing additional
 * functionality to support menu item selection and success callback
 *
 * @class $N.gui.ManualRecordingDateKeypad
 * @constructor
 * @extends $N.gui.LibraryOptionsSubMenu
 * @param {Object} docRef
 * @param {Object} parent
 * @author malatesh
 */
(function ($N) {

	function ManualRecordingDateKeypad(docRef, parent) {
		ManualRecordingDateKeypad.superConstructor.call(this, docRef, parent);
		$N.apps.core.Language.adornWithGetString(ManualRecordingDateKeypad);
		this._log = new $N.apps.core.Log("CommonGUI", "ManualRecordingDateKeypad");
		this._returnObj = {
			startRecordingDate: null
		};
		this._menu = new $N.gui.BaseKeypad(this._docRef, this._container);
		this._successCallback = function () {};
	}
	$N.gui.Util.extend(ManualRecordingDateKeypad, $N.gui.LibraryOptionsSubMenu);



	ManualRecordingDateKeypad.prototype.setDateKeyPad = function () {
		this._menu.resetKeyPadConfig();
		this._menu.clearInput();
		this._menu.setInputFormat(2, 2, "/");
	};

	ManualRecordingDateKeypad.prototype.menuConfig = function () {
		this._menu.configure({
			exitCallback: this._exitCallback.bind(this),
			textInputAlignment: $N.app.KeyboardType.ALIGNMENT.CENTRE
		});
	};
	/**
	 * method used for getting the valid date format
	 * returns false if invalid
	 * @method getValidDate
	 * @private
	 * @param {String} date
	 */
	ManualRecordingDateKeypad.prototype.getValidDate = function (date) {
		var me = this,
			presentDate = new Date(),
			dateTimeUtil = $N.app.DateTimeUtil,
			dateEntered = $N.apps.util.Util.removeSpaces(date);
		presentDate = dateEntered;
		dateEntered = presentDate.split("/");

		if (dateTimeUtil.isValidDate(parseInt(dateEntered[2], 10), parseInt(dateEntered[1], 10), parseInt(dateEntered[0], 10))) {
			if (!dateTimeUtil.isDateInFuture(parseInt(dateEntered[2], 10), parseInt(dateEntered[1], 10), parseInt(dateEntered[0], 10))) {
				dateEntered[2] = parseInt(dateEntered[2], 10) + 1; //Incrementing the year if the date is in past
			}
			presentDate = dateEntered.join("/");
			return presentDate;
		} else {
			$N.app.ErrorMessage.showInvalidDateDialog(function () {
				me.setDateKeyPad();
			});
			return false;
		}
	};

	/**
	 * @method saveOption
	 * @param {Object} data
	 */
	ManualRecordingDateKeypad.prototype.saveOption = function (data) {
		this._log("saveOption", "Enter");
		var isValidDate = false;
		if (data.value) {
			isValidDate = this.getValidDate(data.value.concat("/" + new Date().getUTCFullYear()));
			if (isValidDate !== false) {
				this._returnObj.startRecordingDate = isValidDate;
				this._successCallback(this._returnObj);
				this._exitCallback();
			}
		}
		this._log("saveOption", "Exit");

	};

	/**
	 * @method initialise
	 */

	ManualRecordingDateKeypad.prototype.initialise = function () {
		this._log("initialise", "Enter");
		this._menu.initialise();
		this._log("initialise", "Exit");
	};

	/**
	 * @method setMaxNumericKeypadValue
	 * @param {Number} value
	 */

	ManualRecordingDateKeypad.prototype.setMaxNumericKeypadValue = function (value) {
		this._log("setMaxNumericKeypadValue", "Enter & Exit");
		this._menu.setMaxNumericKeypadValue(Number(value));
	};

	/**
	 * @method setMaxCharacters
	 * @param {Number} length
	 */

	ManualRecordingDateKeypad.prototype.setMaxCharacters = function (length) {
		this._log("setMaxCharacters", "Enter & Exit");
		this._menu.setMaxCharacters(Number(length));
	};

	/**
	 * @method _setData
	 * @param {Object} data
	 */

	ManualRecordingDateKeypad.prototype._setData = function (data) {
		this._log("_setData", "Enter");
		this._menu.setKeypadTitle(data.title);
		this._successCallback = data.successCallback;
		this._log("_setData", "Exit");
	};

	/**
	 * @method activate
	 * @param {Object} selectedMenuItem
	 */

	ManualRecordingDateKeypad.prototype.activate = function (selectedMenuItem) {
		this._log("activate", "Enter");
		this._menu.resetKeyPadConfig();
		this._menu.setKeypadTitle(ManualRecordingDateKeypad.getString('manualRecordingDate'));
		selectedMenuItem.setFirstSubTitle('_ _ /_ _');
		this._returnObj.startRecordingDate = null;
		$N.app.KeyboardUtils.setKeypad(this._menu, $N.app.KeyboardType.NUMERIC);
		this.menuConfig();
		$N.app.KeyboardUtils.setKeypadReturnObject({});
		$N.app.KeyboardUtils.setSaveCallback(this.saveOption.bind(this));
		this.setDateKeyPad();
		$N.app.KeyboardUtils.showKeypad($N.app.KeyboardType.NUMERIC);
		ManualRecordingDateKeypad.superClass.activate.call(this);
		this._log("activate", "Exit");
	};


	ManualRecordingDateKeypad.prototype.passivate = function () {
		this._log("passivate", "Enter");
		this.hide();
		this._menu.defocus();
		this._log("passivate", "Exit");
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */

	ManualRecordingDateKeypad.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter & Exit");
		var handled = false,
			keys = $N.apps.core.KeyInterceptor.getKeyMap();
		if (key === keys.KEY_GREEN) {
			//disable green key when ManualRecordingDateKeypad is active.
			handled = true;
		} else {
			handled = this._menu.keyHandler(key);
		}
		return handled;
	};

	$N.gui.ManualRecordingDateKeypad = ManualRecordingDateKeypad;
}(window.parent.$N || {}));