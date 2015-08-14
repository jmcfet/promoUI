/**
 * ProgressBar creates graphical representation of the progress of any event.
 *
 * ProgressBar can be useful to represent the progress of a current TV program
 * or the progress of a downloading file. This class contains the logic for getting and
 * setting progress bar properties such as width, height and current progress.
 *
 * When defining a ProgressBar, we would usually set the minimum and maximum values, which
 * is achieved using the setMinimumValue and setMaximumValue methods.  These would usually
 * be configured within the JavaScript rather than the markup as the size of the asset
 * will probably by dynamic.
 *
 * The progress of the ProgressBar is specified using the setProgress method.  An optional
 * start parameter can be specified which allows the rendering of a progress bar which does not
 * start from the minimum value defined using the setMinimumValue method. (useful when displaying
 * the recorded segment of a partial PVR recording).
 *
 * The progress bar can be defined using a horizontal or vertical orientation using the
 * `setOrientation` method.  The default orientation is horizontal.
 *
 * A head indicator can be defined using the setHead method.  This will create an
 * animated button at the end of the progress.  The url of the head indicator should be
 * a section of markup identified by its id attribute.
 *
 * Example Markup :
 *
 *     <nagra:progressBar id="myProgressBar" x="200" y="200" width="400" height="10" outerCssClass="progClass" innerCssClass="progInnerClass" />
 *
 * Example JavaScript :
 *
 *     $N.gui.FrameworkCore.extendWithGUIObjects(document.documentElement, view);
 *     view.myProgressBar.setMinimumValue(0);
 *     view.myProgressBar.setMinimumValue(250);
 *     view.myProgressBar.setProgress(100);
 *     var percentage = view.myProgressBar.getProgressPercent();
 *
 * @class $N.gui.ProgressBar
 * @extends $N.gui.GUIObject
 *
 * @requires $N.gui.Container
 * @requires $N.gui.SVGlink
 * @requires $N.gui.GUIObject
 * @requires $N.gui.Util
 *
 * @author mjagadeesan
 * @constructor
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */
define('jsfw/gui/GUIObjects/Controls/ProgressBar',
    [
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Components/SVGlink',
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/helpers/Util',
    ],
    function (Container, SVGlink, GUIObject, Util) {

		function ProgressBar(docRef, parent) {
			ProgressBar.superConstructor.call(this, docRef);

			this._outerBox = new $N.gui.Container(this._docRef);
			this._progressBox = new $N.gui.Container(this._docRef, this._outerBox);
			this._head = new $N.gui.SVGlink(this._docRef, this._outerBox);

			this._rootElement = this._outerBox.getRootElement();

			if (parent) {
				parent.addChild(this._outerBox);
			}

			this._outerBox.configure({
				x: 0,
				y: 0,
				cssClass: 'progressOuter'
			});

			this._progressBox.configure({
				x: 0,
				y: 0,
				width: 0,
				cssClass: 'progressInner'
			});

			this._minimum = 0;
			this._maximum = 0;
			this._progress = 0;
			this._percentage = 0;
			this._headRef = null;
			this._orientation = ProgressBar.HORIZONTAL;
		}

		$N.gui.Util.extend(ProgressBar, $N.gui.GUIObject);

		/**
		 * Constant to denote the horizontal orientation of the progress bar
		 * @property {String} HORIZONTAL
		 * @readonly
		 */
		ProgressBar.HORIZONTAL = "horizontal";

		/**
		 * Constant to denote the vertical orientation of the progress bar
		 * @property {String} VERTICAL
		 * @readonly
		 */
		ProgressBar.VERTICAL = "vertical";

		/**
		 * Calculates the position of the progress bar based on the amount of progress made.
		 * @method _getPosition
		 * @private
		 * @param {Number} progressValue The amount of progress made
		 * @return {Number} The position of the progress bar.
		 */
		ProgressBar.prototype._getPosition = function (progressValue) {
			var total = (this._orientation === ProgressBar.VERTICAL) ? this.getHeight() : this.getWidth();
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
		 * Positions the head depending on the size and alignment of the progress bar.
		 * @method _positionHead
		 * @private
		 */
		ProgressBar.prototype._positionHead = function () {
			if (this._orientation === ProgressBar.VERTICAL) {
				this._head.setX(this._outerBox.getTrueWidth() / 2);
			} else {
				this._head.setY(this._outerBox.getTrueHeight() / 2);
			}
		};

		/**
		 * Initialised the progress bar.
		 * @method init
		 * @param {Number} min The minimum value of the progress bar.
		 * @param {Number} max The maximum value of the progress bar.
		 */
		ProgressBar.prototype.init = function (min, max) {
			if (min !== undefined && max !== undefined) {
				this.setMinimumValue(min);
				this.setMaximumValue(max);
			} else {
				throw "Exception: progressbar minimum and maximum values are not valid";
			}
		};

		/**
		 * Initialised the progress bar.
		 * @method initialise
		 * @deprecated use init()
		 * @param {Number} min The minimum value of the progress bar.
		 * @param {Number} max The maximum value of the progress bar.
		 */
		ProgressBar.prototype.initialise = function (min, max) {
			this.init(min, max);
		};

		/**
		 * Sets the orientation of the progress bar.
		 * @method setOrientation
		 * @chainable
		 * @param {String} orientation Progressbar.VERTICAL or ProgressBar.HORIZONTAL
		 */
		ProgressBar.prototype.setOrientation = function (orientation) {
			this._orientation = orientation;
			return this;
		};

		/**
		 * Sets the minimum value of the progress bar.
		 * @method setMinimumValue
		 * @chainable
		 * @param {Number} minValue The minimum value of the progress bar.
		 */
		ProgressBar.prototype.setMinimumValue = function (minValue) {
			this._minimum = minValue;
			return this;
		};

		/**
		 * Sets the maximum value of the progress bar.
		 * @method setMaximumValue
		 * @chainable
		 * @param {Number} maxValue The maximum value of the progress bar.
		 */
		ProgressBar.prototype.setMaximumValue = function (maxValue) {
			this._maximum = maxValue;
			return this;
		};

		/**
		 * Retrieves the width of the progress bar.
		 * @method getWidth
		 * @return {Number} The width of the progress bar.
		 */
		ProgressBar.prototype.getWidth = function () {
			return this._outerBox.getTrueWidth();
		};

		/**
		 * Retrieves the height of the progress bar.
		 * @method getHeight
		 * @return {Number} The height of the progress bar.
		 */
		ProgressBar.prototype.getHeight = function () {
			return this._outerBox.getTrueHeight();
		};

		/**
		 * Sets the width of the progress bar.
		 * @method setWidth
		 * @chainable
		 * @param {Number} newWidth The width of the progress bar.
		 */
		ProgressBar.prototype.setWidth = function (newWidth) {
			this._outerBox.setWidth(newWidth);
			this._positionHead();
			return this;
		};

		/**
		 * Sets the height of the progress bar.
		 * @method setHeight
		 * @chainable
		 * @param {Number} newHeight The height of the progress bar.
		 */
		ProgressBar.prototype.setHeight = function (newHeight) {
			this._outerBox.setHeight(newHeight);
			this._positionHead();
			return this;
		};

		/**
		 * Sets the URL that should be used to draw the head.
		 * @method setHead
		 * @chainable
		 * @param {String} head The URL of the head
		 */
		ProgressBar.prototype.setHead = function (head) {
			this._headRef = head;
			this._head.setHref(head);
			this._positionHead();
			return this;
		};

		/**
		 * Sets the progress width within the progress bar and
		 * sets the x co-ordinate to the start position if provided
		 * @method setProgress
		 * @chainable
		 * @param {Number} progress The amount of progress made.
		 * @param {Number} start The position from where the progress bar should begin
		 */
		ProgressBar.prototype.setProgress = function (progress, start) {
			var startPosition = start ? this._getPosition(parseInt(start, 10)) : 0;
			var endPosition = this._getPosition(parseInt(progress, 10));
			this._progress = Math.max(this._minimum, progress);
			this._progress = Math.min(this._maximum, progress);

			if (this._orientation === ProgressBar.VERTICAL) {
				this._progressBox.setWidth(this.getWidth());
				this._progressBox.setY(startPosition);
				this._progressBox.setHeight(endPosition - startPosition);
				if (this._headRef) {
					this._head.setY(endPosition);
				}
			} else {
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
		 * Calculates the progress made as a percentage.
		 * @method getProgressPercent
		 * @return {Number} The progress made as a percentage.
		 */
		ProgressBar.prototype.getProgressPercent = function () {
			return this._percentage || 0;
		};

		/**
		 * Retrieves the progress made.
		 * @method getProgress
		 * @return {Number} The progress made.
		 */
		ProgressBar.prototype.getProgress = function () {
			return this._progress;
		};

		/**
		 * Increments the progress bar by the given value
		 * @method increment
		 * @return {Number} value the amount to increment by
		 */
		ProgressBar.prototype.increment = function (value) {
			var currentPos = this.getProgress();
			value = value || 1;
			this.setProgress(currentPos + value);
		};

		/**
		 * Decrements the progress bar by the given value
		 * @method decrement
		 * @return {Number} value the amount to decrement by
		 */
		ProgressBar.prototype.decrement = function (value) {
			var currentPos = this.getProgress();
			value = value || 1;
			this.setProgress(currentPos - value);
		};

		/**
		 * Sets the css class for the inner progress bar.
		 * @method setInnerCssClass
		 * @param {String} className The name of the CSS class to be applied.
		 */
		ProgressBar.prototype.setInnerCssClass = function (className) {
			this._progressBox.setCssClass(className);
		};

		/**
		 * Sets the css class for the inner progress bar.
		 * @method setOuterCssClass
		 * @param {String} className The name of the CSS class to be applied.
		 */
		ProgressBar.prototype.setOuterCssClass = function (className) {
			this._outerBox.setCssClass(className);
		};

		/**
		 * Sets the css style for the inner progress bar.
		 * @method setInnerCssStyle
		 * @param {String} cssStyle The CSS style to be applied.
		 */
		ProgressBar.prototype.setInnerCssStyle = function (cssStyle) {
			this._progressBox.setCssStyle(cssStyle);
		};

		/**
		 * Sets the rounding of the progress bar.
		 * @method setRounding
		 * @chainable
		 * @param {Object} rounding The new rounding value.
		 */
		ProgressBar.prototype.setRounding = function (rounding) {
			this._outerBox.setRounding(rounding);
			this._progressBox.setRounding(rounding);
			return this;
		};

		/**
		 * Returns the ProgressBar class name as a String.
		 * @method toString
		 * @return {String} The ProgressBar class name as a String.
		 */
		ProgressBar.prototype.toString = function () {
			return "ProgressBar";
		};

		/**
		 * Returns the ProgressBar class name as a String.
		 * @method getClassName
		 * @return {String} The ProgressBar class name as a String.
		 */
		ProgressBar.prototype.getClassName = function () {
			return "ProgressBar";
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.ProgressBar = ProgressBar;
		return ProgressBar;
	}
);