/**
 * TextInput is designed to be used with ButtonBar and creation of keyboards.
 *
 * It does allow the realignment so if the width of the text exceeds the
 * width of the container then text is aligned right instead of left.
 * This means that the user can continue to view the text that they are typing.
 *
 * To enable this pass in true to setLabelAutoAlign function.
 *
 * @class $N.gui.TextInput
 * @extends $N.gui.AbstractControl
 *
 * @requires $N.gui.AbstractControl
 * @requires $N.gui.Container
 * @requires $N.gui.ClippedGroup
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 *
 * @constructor
 * @param {Object} docRef DOM Document
 */
define('jsfw/gui/GUIObjects/Controls/TextInput',
    [
    'jsfw/gui/GUIObjects/Controls/AbstractControl',
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Components/ClippedGroup',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/helpers/Util'
    ],
    function (AbstractControl, Container, ClippedGroup, Label, Util) {

		function TextInput(docRef, parent) {

			TextInput.superConstructor.call(this, docRef);

			this._docRef = docRef;

			this._container = new $N.gui.Container(this._docRef);
			this._clippedGroup = new $N.gui.ClippedGroup(this._docRef, this._container);
			this._maxCharacters = 1000; // max characters for text
			this._isLabelAutoAlign = true;

			this._passwordChar = null;
			this._delayPasswordMode = false;
			this._passwordDelayTimerMS = 5000;
			this._passwordDelayTimer = null;
			this._passwordText = "";

			this._rootElement = this._container.getRootElement();

			if (parent) {
				parent.addChild(this._container);
			}
			this._label = new $N.gui.Label(docRef, this._clippedGroup);
			this._cursor = new $N.gui.Label(docRef, this._clippedGroup);
			this._cursor.setText("_");
			this._cursor.hide();

			this._cursor.setAnimationDuration("1500ms"); //TODO: allow this to be configurable
			this._cursor.addFadeAnimation();
		}

		$N.gui.Util.extend(TextInput, $N.gui.AbstractControl);

		/**
		 * Sets alignment of label dependent on text length.
		 * @method _setAlignment
		 * @private
		 */
		TextInput.prototype._setAlignment = function () {

			if (this._isLabelAutoAlign) {

				if (this.getLabelTextLength() > this.getClippedWidth()) {
					if (this.getLabelAlignment() !== $N.gui.Label.ALIGN_RIGHT) {
						this.setLabelX(this.getClippedWidth());
						this.setLabelAlignment($N.gui.Label.ALIGN_RIGHT);
					}
				} else {
					if (this.getLabelAlignment() !== $N.gui.Label.ALIGN_LEFT) {
						this.setLabelX(0);
						this.setLabelAlignment($N.gui.Label.ALIGN_LEFT);
					}
				}
			}
		};

		/**
		 * Sets the width of the Text Container
		 * @method setWidth
		 * @param {Number} width
		 */
		TextInput.prototype.setWidth = function (width) {
			this._container.setWidth(width);
		};

		/**
		 * Gets the width of the Text Container
		 * @method getWidth
		 * @return {Number} width
		 */
		TextInput.prototype.getWidth = function () {
			return this._container.getWidth();
		};

		/**
		 * Sets the height of the Text Container
		 * @method setHeight
		 * @param {Number} height
		 */
		TextInput.prototype.setHeight = function (height) {
			this._container.setHeight(height);
		};

		/**
		 * Sets the rounding value for the Container edges
		 * @method setRounding
		 * @param {Number} rounding
		 */
		TextInput.prototype.setRounding = function (rounding) {
			this._container.setRounding(rounding);
		};

		/**
		 * Sets the css class for the Container
		 * @method setCssClass
		 * @param {String} cssClass
		 */
		TextInput.prototype.setCssClass = function (cssClass) {
			this._container.setCssClass(cssClass);
		};

		/**
		 * Sets the maximum number of characters that the field will accept.
		 * @method setMaxCharacters
		 * @param {Number} charCount
		 */
		TextInput.prototype.setMaxCharacters = function (charCount) {
			this._maxCharacters = parseInt(charCount, 10);
		};

		/**
		* Callback method invoked on change to text.
		* @method setTextChangedCallback
		* @param {Function} callback The callback function invoked when a character is appended or removed
		*/
		TextInput.prototype.setTextChangedCallback = function (callback) {
			this._textChangedCallback = callback;
		};

		/**
		 * Method that given a character will add the character to the
		 * field and update the value accordingly. The method checks maximum
		 * length
		 * @method appendCharacter
		 * @param {String} chr the character to be appended
		 */
		TextInput.prototype.appendCharacter = function (chr) {
			var text = this.getLabelText(),
				me = this;
			this._passwordText += chr;
			if (text.length < this._maxCharacters) {
				if (this._passwordChar) {
					if (!this._delayPasswordMode) {
						this.setLabelText(this.getLabelText() + this._passwordChar);
					} else {
						if (this.getLabelText().length > 0) {
							this.setLabelText(this.getLabelText().substring(0, this.getLabelText().length - 1) + this._passwordChar + chr);
						} else {
							this.setLabelText(this.getLabelText() + chr);
						}
						this._passwordDelayTimer = setTimeout(function () {
							me.setLabelText(me.getLabelText().substring(0, me.getLabelText().length - 1) + me._passwordChar);
						}, this._passwordDelayTimerMS);
					}
				} else {
					this.setLabelText(this.getLabelText() + chr);
				}
				this._setAlignment();
				this._cursor.setX(Math.min(this.getLabelTextLength(), this.getWidth()));
			}
			if (this._textChangedCallback) {
				this._textChangedCallback(this.getLabelText());
			}
		};

		/**
		 * Method that remove a character from the end of the text field
		 * @method removeCharacter
		 */
		TextInput.prototype.removeCharacter = function () {
			var text = this.getLabelText();
			this._passwordText = this._passwordText.slice(0, this._passwordText.length - 1);
			this.setLabelText(text.substring(0, text.length - 1));
			this._setAlignment();
			if (this._textChangedCallback) {
				this._textChangedCallback(this.getLabelText());
			}
		};

		/**
		 * Method that sets the value of the label to any empty string
		 * @method clear
		 */
		TextInput.prototype.clear = function () {
			this.setLabelText("");
		};

		/**
		 * Sets the x position of the ClippedGroup
		 * @method setClipGroupX
		 * @param {Number} x
		 */
		TextInput.prototype.setClippedX = function (x) {
			this._clippedGroup.setX(x);
		};

		/**
		 * Sets the y position of the ClippedGroup
		 * @method setClipGroupY
		 * @param {Number} y
		 */
		TextInput.prototype.setClippedY = function (y) {
			this._clippedGroup.setY(y);
		};

		/**
		 * Sets the width of the Clipped Group
		 * @method setClippedWidth
		 * @param {Number} width
		 */
		TextInput.prototype.setClippedWidth = function (width) {
			this._clippedGroup.setWidth(width);
		};

		/**
		 * Gets the width of the Clipped Group
		 * @method getClippedWidth
		 * @return {String} width of clipped group
		 */
		TextInput.prototype.getClippedWidth = function () {
			return this._clippedGroup.getWidth();
		};

		/**
		 * Sets the height of the Clipped Group
		 * @method setClippedHeight
		 * @param {Number} height
		 */
		TextInput.prototype.setClippedHeight = function (height) {
			this._clippedGroup.setHeight(height);
		};

		/**
		 * Gets the height of the Clipped Group
		 * @method getClippedHeight
		 * @return {Number} height
		 */
		TextInput.prototype.getClippedHeight = function () {
			return this._clippedGroup.getHeight();
		};

		/**
		 * Sets the horizontal margin for the Clipped Group
		 * @method setClippedHorizontalMargin
		 * @param {Number} margin
		 */
		TextInput.prototype.setClippedHorizontalMargin = function (margin) {
			this.setClippedX(margin);
			this.setClippedWidth(this.getWidth() - (margin * 2));
		};

		/**
		 * Sets the x position of the Label
		 * @method setLabelX
		 * @param {Number} x
		 */
		TextInput.prototype.setLabelX = function (x) {
			this._label.setX(x);
		};

		/**
		 * Sets the y position of the Label
		 * @method setLabelY
		 * @param {Number} y
		 */
		TextInput.prototype.setLabelY = function (y) {
			this._label.setY(y);
			this._cursor.setY(y);
		};

		/**
		 * Sets the text of the Label
		 * @method setLabelText
		 * @param {String} text
		 */
		TextInput.prototype.setLabelText = function (text) {
			if (text.length < this._maxCharacters) {
				this._label.setText(text);
			} else {
				this._label.setText(text.substring(0, this._maxCharacters));
			}
			this._cursor.setX(Math.min(this.getLabelTextLength(), this.getWidth()));
		};

		/**
		 * Gets the text of the Label
		 * @method getLabelText
		 * @return {String} text
		 */
		TextInput.prototype.getLabelText = function () {
			return this._label.getText();
		};

		/**
		 * Sets both the actual value of the text when a password is input
		 * and the obfuscated displayed value.
		 * @method setPasswordText
		 * @param {String} password
		 */
		TextInput.prototype.setPasswordText = function (password) {
			var i,
				text = "";
			this._passwordText = password;
			if (this._passwordChar) {
				for (i = 0; i < password.length; i++) {
					text += this._passwordChar;
				}
				this.setLabelText(text);
			} else {
				this.setLabelText(password);
			}
		};

		/**
		 * Gets the actual value of the text when a password is input
		 * @method getPasswordText
		 * @return {String} passwordText
		 */
		TextInput.prototype.getPasswordText = function () {
			return this._passwordText;
		};

		/**
		 * Identifies whether a label is a password and hence whether the display is obfuscated
		 * @method isPassword
		 * @return {Boolean} true when the text is a password
		 */
		TextInput.prototype.isPassword = function () {
			if (this._passwordChar) {
				return true;
			}
			return false;
		};

		/**
		 * Gets the length of the Label Text
		 * @method getLabelTextLength
		 * @return {Number} textLength
		 */
		TextInput.prototype.getLabelTextLength = function () {
			return this._label.getTrueTextLength();
		};

		/**
		 * Sets the css class of the Label
		 * @method setLabelCssClass
		 * @param {String} direction
		 */
		TextInput.prototype.setLabelCssClass = function (cssClass) {
			this._label.setCssClass(cssClass);
		};

		/**
		 * Sets the alignment of the Label
		 * @method setLabelAlignment
		 * @param {String} direction
		 */
		TextInput.prototype.setLabelAlignment = function (direction) {
			this._label.setAlignment(direction);
		};
		/**
		 * Gets the alignment of the Label
		 * @method getLabelAlignment
		 * @return {String} alignment
		 */
		TextInput.prototype.getLabelAlignment = function () {
			return this._label.getAlignment();
		};

		/**
		 * Sets auto alignment on the Label
		 * @method setLabelAutoAlign
		 * @param {Boolean} isLabelAutoAlign
		 */
		TextInput.prototype.setLabelAutoAlign = function (isLabelAutoAlign) {
			this._isLabelAutoAlign = isLabelAutoAlign;
		};

		/**
		 * Turns the cursor at the end of the text on or off.
		 * @method setCursorDisplay
		 * @param {String} flag one of "on", "off" or "pulse"
		 * @return {Object} this instance
		 */
		TextInput.prototype.setCursorDisplay = function (flag) {
			switch (flag) {
			case "on":
				this._cursor.getFadeAnimation().cancelAnimation();
				this._cursor.show();
				break;
			case "pulse":
				this._cursor.show();
				this._cursor.doFade(0, true, true);
				break;
			default:
				this._cursor.hide();
				this._cursor.getFadeAnimation().cancelAnimation();
			}
			return this;
		};

		/**
		 * Sets the character that is used to hide the value of the
		 * characters in the field, e.g. "*". If null is passed in then
		 * no password character is used and the field displayed exactly
		 * what is entered.
		 * @method setPasswordChar
		 * @param {String} character
		 */
		TextInput.prototype.setPasswordChar = function (character) {
			if (character) {
				this._passwordChar = character;
			} else {
				this._passwordChar = null;
			}
		};

		/**
		 * If set to true then will show the input digit for a time (defined in
		 * this._passwordDelayTimerMS) then will change to the password character
		 * @method setDelayPasswordMode
		 * @param {Boolean} flag
		 */
		TextInput.prototype.setDelayPasswordMode = function (flag) {
			this._delayPasswordMode = flag;
		};

		/**
		 * Sets the delay time for showing the password character
		 * @method setDelayPasswordTime
		 * @param {Number} milliseconds
		 */
		TextInput.prototype.setDelayPasswordTime = function (milliseconds) {
			this._passwordDelayTimerMS = milliseconds;
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.TextInput = TextInput;
		return TextInput;
	}
);