/**
 * Extends the NumberEntry class in the framework to have a cursor within the text to represent input position
 *
 * @class $N.gui.NumberEntryWithCursor
 * @constructor
 * @namespace $N.gui
 * @extends $N.gui.NumberEntry
 * @requires $N.gui.Util
 * @param {Object} docRef (DOM document)
 * @param {Object} [parent]
 */
(function ($N) {
	function NumberEntryWithCursor(docRef, parent) {
		NumberEntryWithCursor.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "NumberEntryWithCursor");
		this._cursor = "_";
		this._text.setText(this._cursor);
		this._textChangedCallback = function () {};
	}
	$N.gui.Util.extend(NumberEntryWithCursor, $N.gui.NumberEntry);

	var proto = NumberEntryWithCursor.prototype;

	/**
	 * Set the character to be used for the cursor
	 * @method setCursor
	 * @param {String} cursor
	 */
	proto.setCursor = function (cursor) {
		this._cursor = cursor;
	};

	/**
	 * Method that given a character will add the character to the
	 * field and update the value accordingly. The method checks maximum
	 * length and also checks if it should display the password char.
	 * @method appendNumber
	 * @param {String} value the character to be appended
	 */
	proto.appendNumber = function (value) {
		this._log("appendNumber", "Enter");
		var me = this,
			totalValue = this._value  + value;
		this._cancelDelayTimer();

		if (this._maxValue === null || parseInt(totalValue, 10) <= parseInt(this._maxValue, 10)) {
			if (this._value.length < this._maxCharacters) {
				this._value += value;
				if (this._passwordChar) {
					if (!this._delayPasswordMode) {
						this._text.setText(this._text.getText() + this._passwordChar + this._cursor);
					} else {
						if (this._text.getText().length > 1) {
							this._appendLastDigitToPassword();
							this._setNumberText(this._text.getText().substring(0, this._text.getText().length - 1) + value);
						} else {
							this._setNumberText(this._text.getText().substring(0, this._text.getText().length - 1) + value);
						}
						this._passwordDelayTimer = setTimeout(function () {
							me._appendLastDigitToPassword();
						}, this._passwordDelayTimerMS);
					}
				} else {
					this._setNumberText(this._text.getText().substring(0, this._text.getText().length - 1) + value);
				}
			}
		}
		this._alignText();
		this._log("appendNumber", "Exit");
	};

	/**
	 * Sets the value calling the superclass setValue method then adds the cursor to the text
	 * @method setValue
	 * @param {Object} value
	 */
	proto.setValue = function (value) {
		this._log("setValue", "Enter");
		NumberEntryWithCursor.superClass.setValue.call(this, value);
		if (this._text.getText() === "") {
			this._text.setText(this._cursor);
			this._textChangedCallback(this._text.getText());
		}
		this._log("setValue", "Exit");
	};

	/**
	 * Changes all text in the number entry to the password character
	 * (not including the cursor)
	 * @method changeTextToPassword
	 */
	proto.changeTextToPassword = function () {
		this._log("changeTextToPassword", "Enter");
		var lastChar = this._text.getText().length - 1,
			i,
			text = "";
		//if cursor is not visible change last character too
		if (this.getValue().length === this._maxCharacters && this._text.getText()[this._text.getText().length - 1] !== this._cursor) {
			lastChar = this._text.getText().length;
		}
		for (i = 0; i < lastChar; i++) {
			text = text + this._passwordChar;
		}
		this._setNumberText(text);
		this._log("changeTextToPassword", "Exit");
	};


	/**
	 * Changes the last digit in the number entry field to a password character
	 * @method _appendLastDigitToPassword
	 * @private
	 */
	proto._appendLastDigitToPassword = function () {
		this._log("_appendLastDigitToPassword", "Enter");
		if (this.getValue().length === this._maxCharacters && this._text.getText()[this._text.getText().length - 1] !== this._cursor) {
			this._setNumberText(this._text.getText().substring(0, this._text.getText().length - 1) + this._passwordChar);
		} else {
			this._setNumberText(this._text.getText().substring(0, this._text.getText().length - 2) + this._passwordChar);
		}
		this._log("_appendLastDigitToPassword", "Exit");
	};

	/**
	 * Sets the text to be displayed to the given text and adds the cursor if all
	 * digits have not been entered
	 * @method _setNumberText
	 * @private
	 * @param {String} text
	 */
	proto._setNumberText = function (text) {
		this._log("_setNumberText", "Enter");
		if (text.length < this._maxCharacters) {
			text = text + this._cursor;
		}
		this._text.setText(text);
		this._textChangedCallback(this._text.getText());
		this._log("_setNumberText", "Exit");
	};

	/**
	 * Callback that is called when the text in the number entry is changed
	 * @method setTextChangedCallback
	 * @param {Object} callback
	 */
	proto.setTextChangedCallback = function (callback) {
		this._textChangedCallback = callback;
	};

	/**
	 * Returns the text without the cursor
	 * @method getTextWithoutCursor
	 * @return {String}
	 */
	proto.getTextWithoutCursor = function () {
		return this._text.getText().replace(new RegExp(this._cursor, "gi"), "");
	};

	/**
	 * Defines the behaviour that should occur on keys being
	 * received.  The parent object should pass the keys on to
	 * this method for the field to be updated.
	 * @method keyHandler
	 * @param {String} key
	 * @return {Boolean} True if the key was handled.
	 */
	proto.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var handled = NumberEntryWithCursor.superClass.keyHandler.call(this, key),
			keys = $N.gui.FrameworkCore.getKeys();
		if (handled && key === keys.KEY_LEFT) {
			this._text.setText(this._text.getText() + this._cursor);
			this._textChangedCallback(this._text.getText());
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	$N.gui = $N.gui || {};
	$N.gui.NumberEntryWithCursor = NumberEntryWithCursor;

}($N || {}));
