/**
 * LabelTwoLines is a text label that wraps over exactly two lines.

 * @class $N.gui.LabelTwoLines
 * @constructor
 * @extends $N.gui.AbstractComponent
 * @author ichellin
 * @requires $N.gui.Group
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @param {Object} docRef
 * @param {Object} [parent]
 */
(function ($N) {

	function LabelTwoLines(docRef, parent) {

		LabelTwoLines.superConstructor.call(this, docRef);

		this._container = new $N.gui.Group(docRef);
		this._superLabel = new $N.gui.Label(docRef, this._container);
		this._subLabel = new $N.gui.Label(docRef, this._container);
		this._rootSVGRef = this._container.getRootSVGRef();

		if (parent) {
			parent.addChild(this._container);
		}

		// default values & local references
		this._text = "";
		this._gap = 0;
		//this._alignment = $N.gui.Label.ALIGN_RIGHT;
	}

	$N.gui.Util.extend(LabelTwoLines, $N.gui.AbstractComponent);

	/**
	 * Sets the width of the LabelTwoLines element.
	 * @method setWidth
	 * @param {Number} width The width of the LabelTwoLines.
	 */
	LabelTwoLines.prototype.setWidth = function (width) {
		this._container.setWidth(width);
		this._superLabel.setWidth(width);
		this._subLabel.setWidth(width);
	};

	/**
	 * Sets the text within the LabelTwoLines.
	 * @method setText
	 * @param {String} text The text string.
	 */
	LabelTwoLines.prototype.setText = function (text) {
		this._text = text;
		var textArray = text.split(' '),
			SPLIT_STRING_IF_OVER = 1;

		if (textArray.length > SPLIT_STRING_IF_OVER) {
			this._superLabel.setText(textArray.shift());
			this._subLabel.setText(textArray.join(' '));
		} else {
			this._superLabel.setText(text);
			this._subLabel.setText('');
		}
		this._adjustContainer();
	};

	/**
	 * Sets the font size of the text within the LabelTwoLines.
	 * @method setFontSize
	 * @param {Number} superFontSize The size of the font for the super text.
	 * @param {Number} subFontSize The size of the font for the sub text. If left blank the sub will have the same font size as the super.
	 */
	LabelTwoLines.prototype.setFontSize = function (superFontSize, subFontSize) {
		this._superLabel.setFontSize(superFontSize);
		if (subFontSize) {
			this._subLabel.setFontSize(subFontSize);
		} else {
			this._subLabel.setFontSize(superFontSize);
		}
		this._adjustContainer();
	};

	/**
	 * Sets the CSS class of the text.
	 * @method setCssClass
	 * @param supperCssClass The css class for the super text.
	 * @param subCssClass The css class for the sub text.  If left blank the sub will have the same css class as the super.
	 */
	LabelTwoLines.prototype.setCssClass = function (superCssClass, subCssClass) {
		this._superLabel.setCssClass(superCssClass);
		if (subCssClass) {
			this._subLabel.setCssClass(subCssClass);
		} else {
			this._subLabel.setCssClass(superCssClass);
		}
		this._refresh();
	};

	/**
	 * Sets the vertical gap between the two lines of text.
	 * @method setGap
	 * @param {Number} gap The vertical gap between the two lines of text.
	 */
	LabelTwoLines.prototype.setGap = function (gap) {
		this._gap = gap;
		this._adjustContainer();
	};

	/**
	 * Returns the vertical gap between the two lines of text.
	 * @method setGap
	 * @return {Number} The vertical gap between the two lines of text.
	 */
	LabelTwoLines.prototype.getGap = function () {
		return this._gap;
	};

	/**
	 * Returns the width of the LabelTwoLines element.
	 * @method getWidth
	 * @return {Number} The width of the LabelTwoLines.
	 */
	LabelTwoLines.prototype.getWidth = function () {
		return this._container.getWidth();
	};

	/**
	 * Returns the true width of the LabelTwoLines element.
	 * @method getTrueWidth
	 * @return {Number} The true width of the LabelTwoLines.
	 */
	LabelTwoLines.prototype.getTrueWidth = function () {
		return this._container.getTrueWidth();
	};

	/**
	 * Returns the current text of the LabelTwoLines.
	 * @method getText
	 * @return {String} The label text.
	 */
	LabelTwoLines.prototype.getText = function () {
		return this._text;
	};

	/**
	 * Returns the current font size of the LabelTwoLines.
	 * @method getFontSize
	 * @return {Object} Object with the super and sub font sizes.
	 */
	LabelTwoLines.prototype.getFontSize = function () {
		return {
			superFontSize: this._superLabel.getFontSize(),
			subFontSize: this._subLabel.getFontSize()
		};
	};

	/**
	 * Returns the current height of the LabelTwoLines.
	 * @method getHeight
	 * @return {Number} The current height.
	 */
	LabelTwoLines.prototype.getHeight = function () {
		return this._container.getHeight();
	};

	/**
	 * Refreshes DOM values after a change in CSS styling.
	 * @method _refresh
	 * @private
	 */
	LabelTwoLines.prototype._refresh = function () {
		this.setText(this._text);
	};

	/**
	 * Adjusts the height of the container and the position of the two text elements,
	 * depending on the font size.
	 * @method _adjustContainer
	 * @private
	 */
	LabelTwoLines.prototype._adjustContainer = function () {
		var height = this._superLabel.getHeight() + this._gap + this._subLabel.getHeight();
		this._container.setHeight(height);
		this._subLabel.setY(this._superLabel.getHeight() + this._gap);
	};

	/**
	 * @method getTrueTextLength
	 * @return {Number} The true width of the upper label
	 */
	LabelTwoLines.prototype.getTrueTextLength = function () {
		return this._superLabel.getTrueTextLength();
	};

	/**
	 * Returns the LabelTwoLines class name as a String.
	 * @method toString
	 * @return {String} The class name as a String.
	 */
	LabelTwoLines.prototype.toString = function () {
		return "LabelTwoLines";
	};

	$N.gui = $N.gui || {};
	$N.gui.LabelTwoLines = LabelTwoLines;
}($N || {}));
