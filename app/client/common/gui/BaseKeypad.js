/**
 * This class is creates the UI components of the
 * keypad. It has the functionalities to manage the keys
 * with the textinput box with a set of callbacks.
 * @class $N.gui.BaseKeypad
 * @constructor
 * @requires $N.app.SMSInput
 * @requires $N.app.KeyboardType
 * @requires $N.app.KeyboardUtils
 * @extends $N.gui.GUIObject
 * @author raj
 */
(function ($N) {
	var me = null,
		proto = null;

	function BaseKeypad(docRef, parent) {
		BaseKeypad.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "BaseKeypad");

		this._container = new $N.gui.Container(this._docRef);
		this._container.configure({
			cssClass : "outOfFocusBackground"
		});
		this._title = new $N.gui.Label(this._docRef, this._container);
		this._title.configure({
			x : 36,
			y : 30,
			width : 580,
			height : 75,
			cssClass : "zapperTitle"
		});
		this._textBox = new $N.gui.KeypadTextInput(this._docRef, this._container);
		this._textBox.configure({
			id : "textBox_check",
			x : 36,
			y : 84,
			width : 580,
			height : 100,
			cssClass : "keypadInputBar",
			cursorDisplay : null,
			clippedWidth : 580,
			clippedHeight : 75,
			labelY : 20,
			labelCssClass : "keypadInputTextNumeric",
			labelAutoAlign : false
		});
		this._textBox._cursor.setCssClass("keypadInputTextAlphaNumeric");
		this._keypad = new $N.gui.MultiItemTypeDynamicTable(this._docRef, this._container);
		this._keypad.configure({
			id : "keypad_check",
			x : 36,
			y : 201,
			width : 580,
			height : 320,
			cellPadding : 10
		});
		this._keypad.setItemTemplate("KeypadKeyItem");
		this._keyPressCallback = function () {};
		this._exitCallback = null;
		this._colorKeyCallbacks = null;
		this._isSplitInputModeEnabled = false;
		this._splitInputSeperator = null;
		this._splitInputLeftKeySize = null;
		this._splitInputRightKeySize = null;
		this._keypadType = null;
		this._maxNumericKeypadValue = null;
		this._minNumericKeypadValue = null;
		this.CURSOR_TEXT = '_ ';
		this.INVALID_ENTRY_TEXT = 'Invalid entry';
		this.CELLPADDING_NUMERIC_KEYPAD = 14;
		this.CURSOR_TEXT_LEFT_PADDING = 12;
		this.DEFAULT_WIDTH = 580;
		this.DEFAULT_MAX_CHARACTERS = 1000;
		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
		this._isLowerCaseMode = false;
		this._focusState = false;
		this._allCapsDisplayMode = false;
		this._smsInput = new $N.app.SMSInput();
	}
	$N.gui.Util.extend(BaseKeypad, $N.gui.GUIObject);

	proto = BaseKeypad.prototype;

	/**
	 * It is fired on every press of 'OK'
	 * on any key of the keypad either the numbers, delete
	 * or save key
	 * @method _handleKeyPress
	 * @param {Object} this class object
	 */
	function _handleKeyPress(me) {
		var selectedCellIndex = me._keypad._controller.getSelectedCellIndex(),
			key = me._keypad._tableItems[selectedCellIndex],
			keyDataItem = me._keypad._data.items[selectedCellIndex];
		switch (key.getId()) {
		case "delete":
			me.backSpaceText();
			break;
		case "space":
			me.enterSpace();
			break;
		case "save":
			if (!me.isMinimumValueAllowed(me.getInputValue())) {
				me.showErrorMessageAndReset(me);
				return false;
			}
			break;
		default:
			me.enterText(key);
		}
		if (keyDataItem.keyPressCallback) {
			keyDataItem.keypadReturnObject.value = me.getInputValue();
			keyDataItem.keyPressCallback(keyDataItem.keypadReturnObject);
		}
		return true;
	}

	function _handleColorKeyPress(me, key) {
		me._colorKeyCallbacks[key](me._textBox.getLabelText());
	}

	function toggleAlphaNumericKeyCase(me) {
		var currentSelectedIndex = me._keypad._controller.getSelectedCellIndex();
		if (!me._isLowerCaseMode) {
			$N.app.KeyboardUtils.showKeypad($N.app.KeyboardType.ALPHA_NUMERIC_LOWERCASE);
			me._isLowerCaseMode = true;
		} else if (me._isLowerCaseMode) {
			$N.app.KeyboardUtils.showKeypad($N.app.KeyboardType.ALPHA_NUMERIC_UPPERCASE);
			me._isLowerCaseMode = false;
		}
		me._keypad._highlightCell(currentSelectedIndex);
	}

	proto.isNumberAllowedToEnter = function (text) {
		if (this._keypadType === $N.app.KeyboardType.NUMERIC) {
			return (this._maxNumericKeypadValue === null || parseInt(text, 10) <= parseInt(this._maxNumericKeypadValue, 10));
		} else {
			return true;
		}
	};

	proto.isMinimumValueAllowed = function (text) {
		if (this._keypadType === $N.app.KeyboardType.NUMERIC) {
			return (this._minNumericKeypadValue === null || parseInt(text, 10) >= parseInt(this._minNumericKeypadValue, 10));
		} else {
			return true;
		}
	};

	proto.showErrorMessageAndReset = function (me) {
		this.clearInput();
		me._textBox.appendCharacter(me.INVALID_ENTRY_TEXT);
		if (me._isSplitInputModeEnabled) {
			setTimeout(function () {
				me.clearInput();
				me.setInputFormat(me._splitInputLeftKeySize, me._splitInputRightKeySize, me._splitInputSeperator);
			}, 2000);
		} else {
			setTimeout(function () {
				me.clearInput();
			}, 2000);
		}
	};

	proto.getKeypadTitle = function () {
		return this._title.getText();
	};

	proto.setKeypadTitle = function (title) {
		this._title.setText(title);
	};

	proto.setTitleY = function (y) {
		this._title.setY(y);
	};

	/**
	 * @method setCssClassForKeypadTitle
	 */
	proto.setCssClassForKeypadTitle = function (cssClass) {
		this._title.setCssClass(cssClass);
	};

	proto.getSize = function () {
		return this._keypad._tableItems.length;
	};

	proto.enterSpace = function () {
		this._textBox.appendCharacter(" ");
	};

	proto.enterSmsText = function (newText) {
		var keyPadText = null;
		if (this._keypadType !== $N.app.KeyboardType.NUMERIC || (this._keypadType === $N.app.KeyboardType.NUMERIC && this.isNumberAllowedToEnter(newText))) {
			if (this._isSplitInputModeEnabled) {
				keyPadText = this._textBox.getLabelText();
				keyPadText = keyPadText.replace(this.CURSOR_TEXT, newText);
				this._textBox.setLabelText(keyPadText);
			} else {
				this._textBox.setLabelText(newText);
			}
		}
	};

	proto.enterText = function (key) {
		var keyText = key.getText(),
			newValue = this.getInputValue() + keyText,
			keyPadText = null;
		if (this._keypadType !== $N.app.KeyboardType.NUMERIC || (this._keypadType === $N.app.KeyboardType.NUMERIC && this.isNumberAllowedToEnter(newValue))) {
			if (this._isSplitInputModeEnabled) {
				keyPadText = this._textBox.getLabelText();
				keyPadText = keyPadText.replace(this.CURSOR_TEXT, keyText);
				this._textBox.setLabelText(keyPadText);
			} else {
				this._textBox.appendCharacter(keyText);
			}
		}
	};

	proto.searchCharIndexInSplitterText = function () {
		var index,
			keyPadText = null;

		keyPadText = this._textBox.getLabelText();

		index = keyPadText.length - 1;
		while (keyPadText[index] === this._splitInputSeperator || keyPadText[index] === "_" || keyPadText[index] === " ") {
			index--;
		}
		return index;
	};

	proto.removeCharacterWithCursor = function () {
		var keyPadText = null,
			maxLengthOfSplitterText,
			index;

		keyPadText = this._textBox.getLabelText();
		maxLengthOfSplitterText = (this._splitInputRightKeySize + this._splitInputLeftKeySize) * 2 + this._splitInputSeperator.length;
		if (keyPadText.length < maxLengthOfSplitterText) {
			index = this.searchCharIndexInSplitterText();

			keyPadText = keyPadText.substr(0, index) + this.CURSOR_TEXT  + keyPadText.substr(index + 1);
			this._textBox.setLabelText(keyPadText);
		}
	};

	proto.backSpaceText = function () {
		if (this._isSplitInputModeEnabled) {
			this.removeCharacterWithCursor();
		} else {
			this._textBox.removeCharacter();
		}
	};

	proto.hasFocus = function () {
		return this._focusState;
	};

	proto.focus = function (bInitState) {
		var currentSelectedIndex;
		if (bInitState === undefined || bInitState === true) {
			currentSelectedIndex = 0;
			if (this._keypad._data && this._keypad._data.defaultHighlightCellIndex) {
				currentSelectedIndex = this._keypad._data.defaultHighlightCellIndex;
			}
		} else {
			currentSelectedIndex = this._keypad._controller.getSelectedCellIndex() || 0;
		}
		this._focusState = true;
		if (this._keypad._data.items) {
			this._keypad._highlightCell(currentSelectedIndex);
		}
		this._container.setCssClass("onFocusBackground");
	};

	proto.defocus = function () {
		this._focusState = false;
		if (this._keypad._data.items) {
			this._keypad._unHighlightCell();
		}
		this._container.setCssClass("outOfFocusBackground");
	};

	proto.reset = function () {
		this.hide();
	};

	proto.setMaxNumericKeypadValue = function (maximumNumber) {
		this._maxNumericKeypadValue = maximumNumber;
	};

	proto.setMinNumericKeypadValue = function (minimumNumber) {
		this._minNumericKeypadValue = minimumNumber;
	};

	proto.setCssClass = function (cssClass) {
		this._container.setCssClass(cssClass);
	};

	proto.setHeight = function (height) {
		this._container.setHeight(height);
	};

	proto.setWidth = function (width) {
		this._container.setWidth(width);
	};

	proto.setKeyConfig = function (keyConfig) {
		this._keypad.setItemConfig(keyConfig);
	};

	/**
	 * this function sets the key data on
	 * the dynamic table which acts as the
	 * keypad
	 * @method setKeys
	 * @param {Object} the key data object
	 */
	proto.setKeys = function (keysData) {
		if (this._keypadType === $N.app.KeyboardType.ALPHA_NUMERIC_UPPERCASE || this._keypadType === $N.app.KeyboardType.ALPHA_NUMERIC_LOWERCASE) {
			this._textBox.configure({
				labelCssClass : "keypadInputTextAlphaNumeric"
			});
		} else {
			this._textBox.configure({
				labelCssClass : "keypadInputTextNumeric"
			});
			this._keypad.configure({
				cellPadding : this.CELLPADDING_NUMERIC_KEYPAD
			});
		}
		this._keypad.setData(keysData);
	};

	proto.setCursorEnable = function (flag) {
		if (flag) {
			this.enableBlinkingCursor();
		}
	};

	proto.setLabelWidth = function (x) {
		this._textBox._label.setWidth(x);
	};

	proto.setLabelAutoAlign = function (flag) {
		this._textBox.setLabelAutoAlign(flag);
	};

	proto.setMaxCharacters = function (length) {
		this._textBox.setMaxCharacters(length);
	};

	proto.setClippedWidth = function (x) {
		this._textBox.setClippedWidth(x);
	};

	proto.setAllCapsDisplayMode = function (mode) {
		this._allCapsDisplayMode = mode;
	};

	proto.setTextInputAlignment = function (direction) {
		if (direction === "left") {
			this._textBox.setClippedX(this.CURSOR_TEXT_LEFT_PADDING);
		} else if (direction === "centre") {
			this._textBox._label.setWidth(580);
		}
	};

	proto.resetKeyPadConfig = function () {
		this._maxNumericKeypadValue = null;
		this._minNumericKeypadValue = null;
		this._allCapsDisplayMode = false;
		this.disableCursor();
		this._textBox.setLabelAutoAlign(false);
		this._textBox.setClippedWidth(this.DEFAULT_WIDTH);
		this._textBox.setMaxCharacters(this.DEFAULT_MAX_CHARACTERS);
		this._textBox.setClippedX(this.CURSOR_TEXT_LEFT_PADDING);
		this.clearInput();
		this._textBox.configure({
			labelCssClass : "keypadInputTextNumeric"
		});
	};

	proto.clearKeys = function () {
		var i;
		for (i = 0; i < this._keypad._tableItems.length; i++) {
			this._keypad._tableItems[i].destroy();
		}
		this._keypad._tableItems = [];
	};

	/**
	 * this clears the value of the
	 * textinput box
	 * @method clearInput
	 */
	proto.clearInput = function () {
		this._textBox.clear();
	};

	proto.getInputValue = function () {
		var keypadText = null, pattern;
		if (this._keypadType === $N.app.KeyboardType.NUMERIC) {
			pattern = new RegExp(this.CURSOR_TEXT, "g");
			keypadText = this._textBox.getLabelText().replace(pattern, "");
		} else {
			keypadText = this._textBox.getLabelText();
		}
		return keypadText;
	};

	/**
	 * It retrieves the data object based
	 * on the index of items
	 * @method getKeyDataByIndex
	 * @param {number} index of the data array
	 */
	proto.getKeyDataByIndex = function (index) {
		return this._keypad._data.items[index];
	};

	proto.setInputValue = function (input) {
		if (this._allCapsDisplayMode) {
			input = input.toUpperCase();
		}
		this._textBox.setLabelText(input);
	};

	/**
	 * This is to enable the text entry in a
	 * formatted way like date and time entry
	 * @method enableSplitInput
	 */
	proto.enableSplitInput = function () {
		this._isSplitInputModeEnabled = true;
	};

	proto.disableSplitInput = function () {
		this._isSplitInputModeEnabled = false;
	};

	/**
	 * It sets the seperator character for
	 * the formatted entry of text like ':', '/', etc...
	 * @method setSplitInputSeperator
	 * @param {String} the separator text for formatted entry
	 */
	proto.setSplitInputSeperator = function (splitInputSeperator) {
		this._splitInputSeperator = splitInputSeperator;
	};

	proto.setSplitInputLeftKeySize = function (splitInputLeftSize) {
		this._splitInputLeftKeySize = splitInputLeftSize;
	};

	proto.setSplitInputRightKeySize = function (splitInputRightSize) {
		this._splitInputRightKeySize = splitInputRightSize;
	};

	proto.setInputChangeCallback = function (callback) {
		this._textBox.setTextChangedCallback(callback);
	};

	proto.setKeyPressCallback = function (callback) {
		this._keyPressCallback = callback;
	};

	proto.setKeyCssClass = function (keyCssClass) {
		var i = null;
		for (i = 0; i < this._keypad._tableItems.length; i++) {
			this._keypad._tableItems.setCssClass(keyCssClass);
		}
	};

	proto.setKeyHighlightCssClass = function (keyHighlightCssClass) {
		this._keypad._highlight.setCssClass(keyHighlightCssClass);
	};

	proto.setTextBoxCssClass = function (textBoxCssClass) {
		this._textBox.setCssClass(textBoxCssClass);
	};

	proto.setTextInputCssClass = function (textInputCssClass) {
		this._textBox.setLabelCssClass(textInputCssClass);
	};

	proto.setExitCallback = function (callback) {
		this._exitCallback = callback;
	};

	proto.setColorKeyCallbacks = function (callbacks) {
		this._colorKeyCallbacks = callbacks;
	};

	proto.setInputFormat = function (leftInputSize, rightInputSize, splitter) {
		var i = null;
		this.setSplitInputRightKeySize(rightInputSize);
		this.setSplitInputLeftKeySize(leftInputSize);
		this.setSplitInputSeperator(splitter);
		this.enableSplitInput();
		for (i = 0; i < leftInputSize; i++) {
			this._textBox.appendCharacter(this.CURSOR_TEXT);
		}
		this._textBox.appendCharacter(splitter);
		for (i = 0; i < rightInputSize; i++) {
			this._textBox.appendCharacter(this.CURSOR_TEXT);
		}
	};

	proto.enableCursor = function () {
		this._textBox.setCursorDisplay("on");
	};

	proto.enableBlinkingCursor = function () {
		this._textBox._cursor.setAnimationDuration("500ms");
		this._textBox._cursor.show();
		this._textBox.setCursorDisplay("pulse");
	};

	proto.disableCursor = function () {
		this._textBox.setCursorDisplay(null);
	};

	/**
	 * @method setCssClasses
	 * @param {Object} classObject
	 */
	proto.setCssClasses = function (classObject) {
		if (classObject.keypadInputBar) {
			this._textBox.setCssClass(classObject.keypadInputBar);
		}
		if (classObject.keyInactive || classObject.keyActive) {
			this._keypad.doForAllItems(function (obj) {
				if (classObject.keyInactive) {
					obj.setCssClass(classObject.keyInactive);
				}
				if (classObject.keyActive) {
					obj.setHighlightCssClass(classObject.keyActive);
				}
			});
		}
	};

	proto.initialise = function (keypadType) {
		var	alphabets = null;
		this._keypadType = keypadType || $N.app.KeyboardType.ALPHA_NUMERIC_LOWERCASE;
		this._allCapsDisplayMode = false;
		switch (this._keypadType) {
		case $N.app.KeyboardType.ALPHA_NUMERIC_LOWERCASE:
			alphabets = BaseKeypad.getString("smsAlphabet");
			this._isLowerCaseMode = true;
			break;
		case $N.app.KeyboardType.ALPHA_NUMERIC_UPPERCASE:
			alphabets = BaseKeypad.getString("smsAlphabet");
			this._isLowerCaseMode = false;
			break;
		case $N.app.KeyboardType.NUMERIC:
			alphabets = BaseKeypad.getString("numericAlphabet");
			break;
		}
		this._smsInput.initKeypad(alphabets);
	};

	proto.keyHandler = function (key, repeats) {
		this._log("keyHandler", "Enter");
		var keys,
			handled = false,
			activeComponent,
			activeMenuItem,
			inputText = this._textBox.getLabelText(),
			newText = null,
			smsChar = null,
			term = null;

		keys = $N.apps.core.KeyInterceptor.getKeyMap();
		handled = this._keypad.keyHandler(key);
		if (!handled) {
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
				if (this.isNumberAllowedToEnter(this.getInputValue() + key)) {
					newText = this._smsInput.inputChar(key, inputText);
					smsChar = newText.charAt(newText.length - 1);
					term = newText.substr(0, newText.length - 1);

					if (this._isSplitInputModeEnabled) {
						if (!this._isLowerCaseMode) {
							term = smsChar;
						} else {
							term = smsChar.toLowerCase();
						}
					} else {
						if (!this._isLowerCaseMode) {
							term += smsChar;
						} else {
							term += smsChar.toLowerCase();
						}
					}
					this.enterSmsText(term);
					return true;
				}
				break;
			case keys.KEY_OK:
				if (_handleKeyPress(this)) {
					if (this._keypad._tableItems[this._keypad._controller.getSelectedCellIndex()].getId() === "save") { //passivate the numeric keypad, disabling the split input on keypad save,
						if (this._isSplitInputModeEnabled) {
							this.disableSplitInput();
						}
						this.resetKeyPadConfig();
					}
				}
				handled = true;
				break;
			case keys.KEY_LEFT:
			case keys.KEY_BACK:
			case keys.KEY_EXIT:
				if (!repeats) {
					if (this._exitCallback) {
						this._exitCallback(key);
						handled = true;
					}
				}
				if (this._isSplitInputModeEnabled) {
					this.disableSplitInput();
				}
				handled = true;
				break;
			case keys.KEY_YELLOW:
				if (this._keypadType !== $N.app.KeyboardType.NUMERIC) {
					toggleAlphaNumericKeyCase(this);
				}
				handled = true;
				break;
			case keys.KEY_BLUE:
			case keys.KEY_GREEN:
			case keys.KEY_RED:
				if (this._colorKeyCallbacks && this._colorKeyCallbacks[key]) {
					_handleColorKeyPress(this, key);
					handled = true;
				}
				break;
			}
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	$N.gui = $N.gui || {};
	$N.gui.BaseKeypad = BaseKeypad;
}($N || {}));
$N.apps.core.Language.adornWithGetString($N.gui.BaseKeypad);
