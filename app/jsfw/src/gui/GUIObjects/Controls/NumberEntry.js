/**
 * NumberEntry provides an implementation of a number field control,
 * useful for adding to a Form control and defining specific behaviour to
 * occur when numbers are input from the remote.
 *
 * Example Markup:
 *
 *		<nagra:numberEntry id="myNumberEntry" x="200" y="200" width="200" height="40" maxCharacters="6" />
 *
 * Example JavaScript:
 *
 *		$N.gui.FrameworkCore.extendWithGUIObjects(document.documentElement, view);
 *		view.myNumberEntry.setCssClass("pinEntryClass");
 *
 * We pass captured key codes to the keyHandler, which will interpret and add the values to
 * the number field.
 *
 *		view.myNumberEntry.keyHandler(key);
 *
 * The value of the number can be obtained using the getValue method.
 *
 *		var number = view.myNumberEntry.getValue();
 *
 * @class $N.gui.NumberEntry
 * @extends $N.gui.AbstractControl
 *
 * @requires $N.gui.Container
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @requires $N.gui.AbstractControl
 * @requires $N.gui.FrameworkCore
 *
 * @author mbrown
 * @constructor
 * @param {Object} docRef document element of the page
 * @param {Object} parent the gui object this should be added to
 */
define('jsfw/gui/GUIObjects/Controls/NumberEntry',
    [
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Controls/AbstractControl',
    'jsfw/gui/FrameworkCore'
    ],
    function (Container, Label, Util, AbstractControl, FrameworkCore) {

		function NumberEntry(docRef, parent) {

			NumberEntry.superConstructor.call(this, docRef);

			this._container = new $N.gui.Container(docRef);
			this._text = new $N.gui.Label(docRef, this._container);
			this._rootElement = this._container.getRootElement();

			this._containerCSS = "number_entry_bg";
			this._containerHighlightCSS = "number_entry_bg_highlight";
			this._containerDisabledCSS = "number_entry_bg_disabled";
			this._textCSS = "number_entry_text";
			this._textHighlightCSS = "number_entry_text_highlight";
			this._textDisabledCSS = "number_entry_text_disabled";

			this._passwordChar = null;
			this._delayPasswordMode = false;
			this._passwordDelayTimerMS = 5000;
			this._passwordDelayTimer = null;
			this._value = "";
			this._defaultValue = "";
			this._maxCharacters = 10;
			this._selectedCallback = null;
			this._disabled = false;
			this._verticalAlign = true;

			this._maxValue = null;

			this.setHeight(NumberEntry.DEFAULT_HEIGHT);
			this.setWidth(NumberEntry.DEFAULT_WIDTH);
			this.setRounding(NumberEntry.DEFAULT_ROUNDING);
			this.unHighlight();

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(NumberEntry, $N.gui.AbstractControl);

		/**
		 * The default height the field will be if not set using setHeight
		 * @property {Number} DEFAULT_HEIGHT
		 * @readonly 30
		 */
		NumberEntry.DEFAULT_HEIGHT = 30;

		/**
		 * The default width the field will be if not set using setWidth
		 * @property {Number} DEFAULT_WIDTH
		 * @readonly 200
		 */
		NumberEntry.DEFAULT_WIDTH = 200;

		/**
		 * The default rounding the field will use if not set using setRounding
		 * @property {Number} DEFAULT_ROUNDING
		 * @readonly 0
		 */
		NumberEntry.DEFAULT_ROUNDING = 0;

		var proto = NumberEntry.prototype;

		/**
		 * Positions the text so that it is vertically central to the container.
		 * Note that this method will only work if there is currently text on the
		 * document, because the getHeight method of the Label uses the font-size
		 * attribute which is only populated when in the render tree.
		 * @method _alignText
		 * @private
		 */
		proto._alignText = function () {
			if (this._verticalAlign) {
				var height = this._container.getHeight();
				var fs = this._text.getHeight();
				var pos = (height / 2) + (fs / 3.4);
				this._text.setY(pos);
			}
		};

		/**
		 * Method that given a character will add the character to the
		 * field and update the value accordingly. The method checks maximum
		 * length, maximum value and if it should display the password char.
		 * @method appendNumber
		 * @param {String} value the character to be appended
		 */
		proto.appendNumber = function (value) {
			var me = this;
			var totalValue = this._value  + value;

			if (this._maxValue === null || parseInt(totalValue, 10) <= parseInt(this._maxValue, 10)) {
				this._cancelDelayTimer();
				if (this._value.length < this._maxCharacters) {
					this._value += value;
					if (this._passwordChar) {
						if (!this._delayPasswordMode) {
							this._text.setText(this._text.getText() + this._passwordChar);
						} else {
							if (this._text.getText().length > 0) {
								this._text.setText(this._text.getText().substring(0, this._text.getText().length - 1) + this._passwordChar + value);
							} else {
								this._text.setText(this._text.getText() + value);
							}
							this._passwordDelayTimer = setTimeout(function () {
								me._text.setText(me._text.getText().substring(0, me._text.getText().length - 1) + me._passwordChar);
							}, this._passwordDelayTimerMS);
						}
					} else {
						this._text.setText(this._text.getText() + value);
					}
				}
			}

			this._alignText();
		};

		/**
		 * Given a width as a number will set the width of the field and
		 * label inside the field
		 * @method setWidth
		 * @param {Number} width
		 */
		proto.setWidth = function (width) {
			this._container.setWidth(width);
			this._text.setWidth(width);
		};

		/**
		 * Returns the width in pixels of the field
		 * @method getWidth
		 * @return {Number}
		 */
		proto.getWidth = function () {
			return this._container.getWidth();
		};

		/**
		 * Given a height as a number will set the height of the field and
		 * label inside the field
		 * @method setHeight
		 * @param {Number} height
		 */
		proto.setHeight = function (height) {
			this._container.setHeight(height);
			this._alignText();
		};

		/**
		 * Returns the height in pixels of the field
		 * @method getHeight
		 * @return {Number}
		 */
		proto.getHeight = function () {
			return this._container.getHeight();
		};

		/**
		 * Given a radius value in pixels will set the rounding of the
		 * fields container
		 * @method setRounding
		 * @param {Number} rounding
		 */
		proto.setRounding = function (rounding) {
			this._container.setRounding(rounding);
		};

		/**
		 * Focuses the field so that it is deemed to be highlighted in a
		 * form for example.
		 * @method highlight
		 */
		proto.highlight = function () {
			this._container.setCssClass(this._containerHighlightCSS);
			this._text.setCssClass(this._textHighlightCSS);
		};

		/**
		 * Defocuses the field so that it is shown as normal.
		 * @method unHighlight
		 */
		proto.unHighlight = function () {
			this._container.setCssClass(this._containerCSS);
			this._text.setCssClass(this._textCSS);
		};

		/**
		 * Disable the element so it does not allow to write or delete numbers
		 * @method disable
		 */
		proto.disable = function () {
			this._disabled = true;
			this.showDisabled();
		};

		/**
		 * Enable the element so new numbers can be added or deleted
		 * @method enable
		 */
		proto.enable = function () {
			this._disabled = false;
			this.showEnabled();
		};

		/**
		 * Sets the CSS of the field components such that it is
		 * shown as disabled not being able to receive focus
		 * @method showDisabled
		 */
		proto.showDisabled = function () {
			this._container.setCssClass(this._containerDisabledCSS);
			this._text.setCssClass(this._textDisabledCSS);
		};

		/**
		 * Sets the CSS of the field components such that it is
		 * shown as enabled and being able to receive focus
		 * @method showEnabled
		 */
		proto.showEnabled = function () {
			this._container.setCssClass(this._containerCSS);
			this._text.setCssClass(this._textCSS);
			this.unHighlight();
		};

		/**
		 * Sets the behaviour of the field when ok field is pressed,
		 * the passed in callback will be executed, behaviour can be
		 * cleared by passing null.
		 * @method setSelectedCallback
		 * @param {Function} callback
		 */
		proto.setSelectedCallback = function (callback) {
			this._selectedCallback = callback;
		};

		/**
		 * Returns the value entered into the NumberEntry field
		 * @method getValue
		 * @return {String}
		 */
		proto.getValue = function () {
			return this._value;
		};

		/**
		 * Given a value in string or number form will attempt to set
		 * the field contents to that value.  Any values that don't
		 * represent a number will be ignored.
		 * @method setValue
		 * @param {String} value
		 */
		proto.setValue = function (value) {
			var i;
			this._text.setText("");
			this._value = "";
			var strVal = String(value);
			if (isNaN(parseInt(strVal, 10))) {
				return;
			}
			var len = Math.min(strVal.length, this.getMaxCharacters());
			for (i = 0; i < len; i++) {
				this.appendNumber(strVal.charAt(i));
			}
		};

		/**
		 * Given a defaultValue in string or number form will set
		 * the default value that should be set in the field if it is
		 * reset.  If the value has not already been set then the default
		 * value is used here to set the value
		 * @method setDefaultValue
		 * @param {String} defaultValue
		 */
		proto.setDefaultValue = function (defaultValue) {
			if (isNaN(parseInt(defaultValue, 10))) {
				return;
			}
			this._defaultValue = defaultValue;
			if (this.getValue() === "") {
				this.reset();
			}
		};

		/**
		 * Returns the number that will be used if the field is
		 * reset.
		 * @method getDefaultValue
		 * @return {String}
		 */
		proto.getDefaultValue = function () {
			return this._defaultValue;
		};

		/**
		 * Sets the field back to show the value that has been set
		 * as the default value, or an empty string if not set.
		 * @method reset
		 */
		proto.reset = function () {
			if (this.getDefaultValue() === "") {
				this.setValue("");
			} else {
				this.setValue(this.getDefaultValue());
			}
		};

		/**
		 * Sets the character that is used to hide the value of the
		 * characters in the field, e.g. "*". If null is passed in then
		 * no password character is used and the field displayed exactly
		 * what is entered.
		 * @method setPasswordChar
		 * @param {String} character
		 */
		proto.setPasswordChar = function (character) {
			this._passwordChar = character || "";
		};

		/**
		 * If set to true then will show the input digit for a time (defined in
		 * this._passwordDelayTimerMS) then will change to the password character
		 * @method setDelayPasswordMode
		 * @param {Boolean} flag
		 */
		proto.setDelayPasswordMode = function (flag) {
			this._delayPasswordMode = flag;
		};

		/**
		 * Sets the maximum value permitted
		 * @method setMaxValue
		 * @param {Number} maximum permitted value
		 */
		proto.setMaxValue = function (value) {
			this._maxValue = value;
		};

		/**
		 * Sets the delay time for showing the password character
		 * @method setDelayPasswordTime
		 * @param {Number} milliseconds
		 */
		proto.setDelayPasswordTime = function (milliseconds) {
			this._passwordDelayTimerMS = milliseconds;
		};

		/**
		 * Sets the maximum number of characters that the field will accept.
		 * @method setMaxCharacters
		 * @param {Number} charCount
		 */
		proto.setMaxCharacters = function (charCount) {
			this._maxCharacters = parseInt(charCount, 10);
		};

		/**
		 * Returns the maximum number of characters that the field will accept.
		 * @method getMaxCharacters
		 * @return {Number}
		 */
		proto.getMaxCharacters = function () {
			return this._maxCharacters;
		};

		/**
		 * Sets the CSS style of the number text.
		 * @method setCssStyle
		 * @param {String} cssStyle The new CSS style string.
		 */
		proto.setCssStyle = function (cssStyle) {
			this._text.setCssStyle(cssStyle);
		};

		/**
		 * Sets the CSS class of the number text.
		 * @method setCssClass
		 * @param {String} cssClass The new CSS class.
		 */
		proto.setCssClass = function (cssClass) {
			this.setTextCssClass(cssClass);
		};

		/**
		 * Sets the CSS class of the number text.
		 * @method setTextCssClass
		 * @param {String} cssClass
		 */
		proto.setTextCssClass = function (cssClass) {
			this._text.setCssClass(cssClass);
			this._textCSS = cssClass;
		};

		/**
		 * Sets the CSS class of the number text when disabled.
		 * @method setTextDisabledCss
		 * @param {String} cssClass The new CSS class.
		 */
		proto.setTextDisabledCssClass = function (cssClass) {
			this._textDisabledCSS = cssClass;
		};

		/**
		 * Sets the CSS class of the number text when highlighted.
		 * @method setTextHighlightCss
		 * @param {String} cssClass The new CSS class.
		 */
		proto.setTextHighlightCssClass = function (cssClass) {
			this._textHighlightCSS = cssClass;
		};

		/**
		 * Sets the CSS class of the container.
		 * @method setContainerCss
		 * @param {String} cssClass The new CSS class.
		 */
		proto.setContainerCssClass = function (cssClass) {
			this._container.setCssClass(cssClass);
			this._containerCSS = cssClass;
		};

		/**
		 * Sets the CSS class of the container when disabled.
		 * @method setContainerDisabledCss
		 * @param {String} cssClass The new CSS class.
		 */
		proto.setContainerDisabledCssClass = function (cssClass) {
			this._containerDisabledCSS = cssClass;
		};

		/**
		 * Sets the CSS class of the container when highlighted.
		 * @method setContainerHighlightCss
		 * @param {String} cssClass The new CSS class.
		 */
		proto.setContainerHighlightCssClass = function (cssClass) {
			this._containerHighlightCSS = cssClass;
		};

		/**
		 * Sets whether the text should be vertically aligned centrally in its container
		 * @method setVerticalAlign
		 * @param {Boolean} flag
		 */
		proto.setVerticalAlign = function (flag) {
			this._verticalAlign = flag;
		};

		/**
		 * Clears the timeout for the cancel delay timer
		 * @method _cancelDelayTimer
		 * @private
		 */
		proto._cancelDelayTimer = function () {
			if (this._passwordDelayTimer) {
				clearTimeout(this._passwordDelayTimer);
			}
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
			var keys = $N.gui.FrameworkCore.getKeys();
			var value = parseInt(key, 10);
			if (this._disabled) {
				return false;
			}

			if (key === keys.KEY_OK && this._selectedCallback) {
				this._cancelDelayTimer();
				this._selectedCallback(this._value);
				return true;
			}
			if (key === keys.KEY_LEFT && this._value.length > 0) {
				this._cancelDelayTimer();
				this._value = this._value.substring(0, this._value.length - 1);
				this._text.setText(this._text.getText().substring(0, this._value.length));
				return true;
			}
			if (!isNaN(value)) {
				this.appendNumber(value);
				return true;
			}
			return false;
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.NumberEntry = NumberEntry;
		return NumberEntry;
	}
);
