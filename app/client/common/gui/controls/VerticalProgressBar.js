/**
 * VerticalProgressBar extends ProgressBar by making the progress
 * update from bottom to top, as in a standard software volume control.
 *
 * @class $N.gui.VerticalProgressBar
 * @extends $N.gui.ProgressBar
 *
 * @requires $N.gui.ProgressBar
 * @requires $N.gui.Util
 * @requires $N.gui.Label
 * @author hepton
 * @constructor
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */
(function ($N) {

	function VerticalProgressBar(docRef, parent) {
		VerticalProgressBar.superConstructor.call(this, docRef, parent);

		this._orientation = VerticalProgressBar.VERTICAL_ASCEND;
	}

	$N.gui.Util.extend(VerticalProgressBar, $N.gui.ProgressBar);

	/**
	 * Constant to denote the vertical orientation of the progress bar with ascending progress (rather than default descending)
	 * @property {String} VERTICAL_ASCEND
	 * @readonly
	 */
	VerticalProgressBar.VERTICAL_ASCEND = "vertical_ascend";

	/**
	 * Calculates the position of the progress bar based on the amount of progress made.
	 * @method _getPosition
	 * @private
	 * @param {Number} progressValue The amount of progress made
	 * @return {Number} The position of the progress bar.
	 */
	VerticalProgressBar.prototype._getPosition = function (progressValue) {
		var isVertical = (this._orientation === VerticalProgressBar.VERTICAL || this._orientation === VerticalProgressBar.VERTICAL_ASCEND),
			total = isVertical ? this.getHeight() : this.getWidth();
		if (progressValue < this._minimum) {
			progressValue = this._minimum;
		}
		if (progressValue > this._maximum) {
			progressValue = this._maximum;
		}
		this._percentage = Math.ceil(((progressValue - this._minimum) / (this._maximum - this._minimum)) * 100);
		return Math.ceil(this._percentage * total / 100);
	};

	/**
	 * Sets the progress within the progress bar
	 * @method setProgress
	 * @chainable
	 * @param {Number} progress The amount of progress made.
	 * @param {Number} start (optional) The position from where the progress bar should begin
	 */
	VerticalProgressBar.prototype.setProgress = function (progress, start) {
		var startPosition = start ? this._getPosition(parseInt(start, 10)) : 0,
			endPosition = this._getPosition(parseInt(progress, 10));
		this._progress = Math.max(this._minimum, progress);
		this._progress = Math.min(this._maximum, progress);
		switch (this._orientation) {
		case VerticalProgressBar.VERTICAL_ASCEND:
			this._progressBox.setWidth(this.getWidth());
			this._progressBox.setY(this.getHeight() - endPosition);
			this._progressBox.setHeight(endPosition);
			if (this._headRef) {
				this._head.setY(endPosition);
			}
			break;
		case VerticalProgressBar.VERTICAL:
			this._progressBox.setWidth(this.getWidth());
			this._progressBox.setY(startPosition);
			this._progressBox.setHeight(endPosition - startPosition);
			if (this._headRef) {
				this._head.setY(endPosition);
			}
			break;
		default:
			this._progressBox.setHeight(this.getHeight());
			this._progressBox.setX(startPosition);
			this._progressBox.setWidth(endPosition - startPosition);
			if (this._headRef) {
				this._head.setX(endPosition);
			}
		}
		return this;
	};

	/**
	 * Returns the VerticalProgressBar class name as a String.
	 * @method toString
	 * @return {String} The VerticalProgressBar class name as a String.
	 */
	VerticalProgressBar.prototype.toString = function () {
		return "VerticalProgressBar";
	};

	/**
	 * Returns the VerticalProgressBar class name as a String.
	 * @method getClassName
	 * @return {String} The VerticalProgressBar class name as a String.
	 */
	VerticalProgressBar.prototype.getClassName = function () {
		return "VerticalProgressBar";
	};

	$N.gui = $N.gui || {};
	$N.gui.VerticalProgressBar = VerticalProgressBar;
}($N || {}));
