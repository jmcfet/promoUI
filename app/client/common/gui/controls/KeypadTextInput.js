/**
 * @class $N.gui.KeypadTextInput
 * @extends $N.gui.TextInput
 * @constructor
 * @param {Object} docRef DOM Document
 */
(function ($N) {
	function KeypadTextInput(docRef, parent) {
		KeypadTextInput.superConstructor.call(this, docRef);
		if (parent) {
			parent.addChild(this);
		}
	}
	$N.gui.Util.extend(KeypadTextInput, $N.gui.TextInput);

	/**
	 * Sets alignment of label dependent on text length.
	 * @method _setAlignment
	 * @private
	 */
	KeypadTextInput.prototype._setAlignment = function () {

		if (this._isLabelAutoAlign) {

			if (this.getLabelTextLength() > this.getTrueClippedWidth()) {
				if (this.getLabelAlignment() !== $N.gui.Label.ALIGN_RIGHT) {
					this.setLabelX(this.getTrueClippedWidth());
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
	 * Gets the True width of the Text Container
	 * @method getTrueWidth
	 * @return {Number} width
	 */
	KeypadTextInput.prototype.getTrueWidth = function () {
		return this._container.getWidth() / this.resolutionHorizontalFactor;
	};

	/**
	 * Sets the cursor css class for the Container
	 * @method setCssClass
	 * @param {String} cssClass
	 */
	KeypadTextInput.prototype.setCursorCssClass = function (cssClass) {
		this._cursor.setCssClass(cssClass);
	};


	/**
	 * Method that given a character will add the character to the
	 * field and update the value accordingly. The method checks maximum
	 * length
	 * @method appendCharacter
	 * @param {String} chr the character to be appended
	 */
	KeypadTextInput.prototype.appendCharacter = function (chr) {
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
			this._cursor.setX(Math.min(this.getLabelTextLength(), this.getTrueWidth()));
		}
	};

	/**
	 * Gets the true width of the Clipped Group
	 * @method getTrueClippedWidth
	 * @return {String} width of clipped group
	 */
	KeypadTextInput.prototype.getTrueClippedWidth = function () {
		return this._clippedGroup.getWidth() / this.resolutionHorizontalFactor;
	};

	/**
	 * Sets the text of the Label
	 * @method setLabelText
	 * @param {String} text
	 */
	KeypadTextInput.prototype.setLabelText = function (text) {
		if (text.length < this._maxCharacters) {
			this._label.setText(text);
		} else {
			this._label.setText(text.substring(0, this._maxCharacters));
		}
		this._cursor.setX(Math.min(this.getLabelTextLength(), this.getTrueWidth()));
		if (this._text !== this._label.getText()) {
			this._text = this._label.getText();
			if (this._textChangedCallback) {
				this._textChangedCallback(this.getLabelText());
			}
		}
	};


	$N.gui = $N.gui || {};
	$N.gui.KeypadTextInput = KeypadTextInput;
}($N || {}));
