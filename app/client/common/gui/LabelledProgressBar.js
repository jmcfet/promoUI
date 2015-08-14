/**
 * @class $N.gui.LabelledProgressBar
 * @constructor
 * @namespace $N.gui
 * @requires $N.gui.ProgressBar
 * @requires $N.gui.Util
 * @requires $N.gui.Label
 * @requires $N.gui.SVGlink
 * @extends $N.gui.GUIObject
 *
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */

(function ($N) {
	function LabelledProgressBar(docRef, parent) {
		LabelledProgressBar.superConstructor.call(this, docRef, parent);
		this._progressBarLabelsCssClass = "startAndEndTimeProgressBar";
		this._width = 550;
		this._height = 40;
		this._progressBarPaddingLeft = 10;
		this._progressBarPaddingRight = 10;
		this._progressBarHeight = 3;
		this._startLabelWidth = 120;
		this._endLabelWidth = 150;
		this._labelOffset = 10;
		this._outerBox = new $N.gui.Group(docRef);
		if (parent) {
			parent.addChild(this._outerBox);
		}
		this._outerBox.configure({
			x: 0,
			y: 0,
			width: this._width,
			height: this._height
		});


		this._progress = new $N.gui.ProgressBar(docRef, this._outerBox);
		this._startLabel = new $N.gui.Label(docRef, this._outerBox);
		this._endLabel = new $N.gui.Label(docRef, this._outerBox);
		this._progress.configure({
			innerCssClass: "progressBarInner",
			outerCssClass: "progressBarOuter",
			height: this._progressBarHeight
		});
		this._rootElement = this._outerBox.getRootElement();
		this._positionMarker = new $N.gui.SVGlink(this._docRef, this._outerBox);
		this._DEFAULT_Y_OFFSET = -3;
		this._positionMarker.configure({
			y: this._DEFAULT_Y_OFFSET,
			x: this._startLabelWidth + this._progressBarPaddingLeft
		});
	}
	$N.gui.Util.extend(LabelledProgressBar, $N.gui.GUIObject);

	/**
	 * Initialise the advanced progress bar
	 * @method initialise
	 */
	LabelledProgressBar.prototype.initialise = function () {
		var progressBarWidth = this._width - (this._startLabelWidth + this._progressBarPaddingLeft + this._progressBarPaddingRight + this._endLabelWidth),
			labelsYPos = this._progressBarHeight + this._labelOffset;
		this._progress.setWidth(progressBarWidth);
		this._progress.setX(this._startLabelWidth + this._progressBarPaddingLeft);

		//set startlabel parameters
		this._startLabel.configure({
			x: 0,
			y: labelsYPos,
			width: this._startLabelWidth,
			cssClass: this._progressBarLabelsCssClass
		});

		// set endlabel parameters
		this._endLabel.configure({
			x: (this._width - this._endLabelWidth),
			y: labelsYPos,
			width: this._endLabelWidth,
			cssClass: this._progressBarLabelsCssClass
		});
	};

	/**
	 * Calculates the position of the progress bar based on the amount of progress made.
	 * @method _getPosition
	 * @private
	 * @param {Number} progressValue The amount of progress made
	 * @return {Number} The position of the progress bar.
	 */
	LabelledProgressBar.prototype._getPosition = function (progressValue) {
		this._progress._getPostiton(progressValue);
	};

	/**
	 * @method setX
	 * @param {Number} x
	 */
	LabelledProgressBar.prototype.setX = function (posX) {
		this._outerBox.setX(posX);
	};
	/**
	 * @method setY
	 * @param {Number} y
	 */
	LabelledProgressBar.prototype.setY = function (posY) {
		this._outerBox.setY(posY);
	};

	/**
	 * @method hide
	 */
	LabelledProgressBar.prototype.hide = function () {
		this._outerBox.hide();
	};
	/**
	 * @method show
	 */
	LabelledProgressBar.prototype.show = function () {
		this._outerBox.show();
	};

	/**
	 * @method getWidth
	 */
	LabelledProgressBar.prototype.getWidth = function () {
		return this._width;
	};

	/**
	 * @method setWidth
	 */
	LabelledProgressBar.prototype.setWidth = function (width) {
		var progressBarWidth = width - (this._startLabelWidth + this._progressBarPaddingLeft + this._progressBarPaddingRight + this._endLabelWidth);
		this._width = width;
		this._progress.setWidth(progressBarWidth);
	};

	/**
	 * @method getProgressBarWidth
	 */
	LabelledProgressBar.prototype.getProgressBarWidth = function () {
		return this._progress.getWidth();
	};

	/**
	 * @method setStartLabelWidth
	 */
	LabelledProgressBar.prototype.setStartLabelWidth = function (width) {
		this._startLabelWidth = width;
	};

	/**
	 * @method setEndLabelWidth
	 */
	LabelledProgressBar.prototype.setEndLabelWidth = function (width) {
		this._endLabelWidth = width;
	};

	/**
	 * @method getHeight
	 * @return {Number} height
	 */
	LabelledProgressBar.prototype.getHeight = function () {
		return this._height;
	};

	/**
	 * @method setProgressBarLabelsCssClass
	 * @param {String} cssClass
	 */
	LabelledProgressBar.prototype.setProgressBarLabelsCssClass = function (cssClass) {
		this._progressBarLabelsCssClass = cssClass;
	};

	/**
	 * @method setProgressOuterCssClass
	 * @param {String} cssClass
	 */
	LabelledProgressBar.prototype.setProgressOuterCssClass = function (cssClass) {
		this._progress.setOuterCssClass(cssClass);
	};

		/**
	 * @method setProgressInnerCssClass
	 * @param {String} cssClass
	 */
	LabelledProgressBar.prototype.setProgressInnerCssClass = function (cssClass) {
		this._progress.setInnerCssClass(cssClass);
	};

	/**
	 * @method setStartLabelWidth
	 * @param {Number} value
	 */
	LabelledProgressBar.prototype.setStartLabelWidth = function (value) {
		this._startLabelWidth = value;
	};

	/**
	 * @method setEndLabelWidth
	 * @param {Number} value
	 */
	LabelledProgressBar.prototype.setEndLabelWidth = function (value) {
		this._endLabelWidth = value;
	};

	/**
	 * @method setProgressBarPaddingLeft
	 * @param {Number} value
	 */
	LabelledProgressBar.prototype.setProgressBarPaddingLeft = function (value) {
		this._progressBarPaddingLeft = value;
	};

	/**
	 * @method setProgressBarPaddingRight
	 * @param {Number} value
	 */
	LabelledProgressBar.prototype.setProgressBarPaddingRight = function (value) {
		this._progressBarPaddingRight = value;
	};

	/**
	 * @method setLabelOffset
	 * @param {Number} value
	 */
	LabelledProgressBar.prototype.setLabelOffset = function (value) {
		this._labelOffset = value;
	};

	/**
	 * @method setProgressBarHeight
	 * @param {Number} value
	 */
	LabelledProgressBar.prototype.setProgressBarHeight = function (value) {
		this._progressBarHeight = value;
	};

	/**
	 * @method setEndLabelWidth
	 * @param {Number} value
	 */
	LabelledProgressBar.prototype.setEndLabelWidth = function (value) {
		this._endLabelWidth = value;
	};

	/**
	 * Sets the text label content at the end of the progress bar.
	 * @method setProgressBarLabels
	 * @param {String} startLabelText The text to appear at the end of the progress bar.
	 * @param {String} endLabelText The text to appear at the end of the progress bar.
	 *
	 */
	LabelledProgressBar.prototype.setProgressBarLabels = function (startLabelText, endLabelText) {
		this._startLabel.setText(startLabelText);
		this._endLabel.setText(endLabelText);
	};

	/**
	 * Set the end time
	 * @method updateProgressBar
	 * @param {Number} minimum
	 * @param {Number} maximum
	 * @param {Number} elapsed
	 * @param {Number} elapsedOffset
	 */
	LabelledProgressBar.prototype.updateProgressBar = function (minimum, maximum, elapsed, elapsedOffset) {
		elapsedOffset = elapsedOffset || 0;
		this._progress.setMinimumValue(minimum);
		this._progress.setMaximumValue(maximum);
		this._progress.setProgress(elapsed, elapsedOffset);
	};

	/**
	 * @method setProgressBarHeight
	 * @param {Number} height
	 *
	 */
	LabelledProgressBar.prototype.setProgressBarHeight = function (height) {
		this._progress.setHeight(height);
	};

	/**
	 * This method takes the current position of the (progress bar - start label and padding) and updates the position of the diamond
	 * @method updateMarkerPosition
	 */
	LabelledProgressBar.prototype.updateMarkerPosition = function () {
		this._positionMarker.setX(this._progress._getPosition(this._progress.getProgress()) + this._startLabelWidth + (this._progressBarPaddingLeft));
	};

	/**
	 * @method setMarkerPosition
	 * @param {Number} value The position at which the marker is to be placed.
	 */
	LabelledProgressBar.prototype.setMarkerPosition = function (value) {
		this._positionMarker.setX(value);
	};

	/**
	 * @method hidePositionMarker
	 */
	LabelledProgressBar.prototype.hidePositionMarker = function () {
		this._positionMarker.hide();
	};

	/**
	 * @method showPositionMarker
	 */
	LabelledProgressBar.prototype.showPositionMarker = function () {
		this._positionMarker.show();
	};

	/**
	 * Sets the icon that is used to denote the play head.  The passed href should be the path to
	 * an SVG resource file or an image file.
	 * @method setPlayHead
	 * @param {String} href file location
	 */
	LabelledProgressBar.prototype.setPlayHead = function (href) {
		if (href && href.indexOf("svg") > -1) {
			this._positionMarker.setHref(href);
		} else {
			this._positionMarker.destroy();
			this._positionMarker = new $N.gui.Image(this._docRef, this._outerBox);
			this._positionMarker.configure({
				y: this._DEFAULT_Y_OFFSET
			});
			this._positionMarker.setHref(href);
		}
	};

	/**
	 * @method setLabelYPositions
	 * @param {Number} value sets The Y position of the progress bar labels
	 */
	LabelledProgressBar.prototype.setLabelYPositions = function (value) {
		this._startLabel.setY(value);
		this._endLabel.setY(value);
	};

	/**
	 * @method setProgressBarConfig
	 * @param {Object} value sets the config of the progress bar
	 */
	LabelledProgressBar.prototype.setProgressBarProperties = function (value) {
		this._progress.configure(value);
	};

	/**
	 * @method setStartLabelConfig
	 * @param {Object} value sets the config of the progress bar start label
	 */
	LabelledProgressBar.prototype.setStartLabelProperties = function (value) {
		this._startLabel.configure(value);
	};

	/**
	 * @method setEndLabelConfig
	 * @param {Object} value sets the config of the progress bar end label
	 */
	LabelledProgressBar.prototype.setEndLabelProperties = function (value) {
		this._endLabel.configure(value);
	};

	/**
	 * Returns the LabelledProgressBar class name as a String.
	 * @method toString
	 * @return {String} The LabelledProgressBar class name as a String.
	 */
	LabelledProgressBar.prototype.toString = function () {
		return "LabelledProgressBar";
	};


	/**
	 * Returns the LabelledProgressBar class name as a String.
	 * @method getClassName
	 * @return {String} The LabelledProgressBar class name as a String.
	 */
	LabelledProgressBar.prototype.getClassName = function () {
		return "LabelledProgressBar";
	};


	$N.gui = $N.gui || {};
	$N.gui.LabelledProgressBar = LabelledProgressBar;
}($N || {}));