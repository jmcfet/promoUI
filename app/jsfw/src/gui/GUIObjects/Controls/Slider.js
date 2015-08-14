/**
 * Slider creates a slider type input control.
 *
 * The slider allows the user to select a numeric value within a range of values, using
 * the directional buttons on the RCU.
 *
 * A minimum and maximum value can be configured using the initialise method.
 *
 * Styling of the slider is achieved using the setInnerClass and setOuterClass
 * (in addition to the associated highlight class methods).  The outer is the
 * whole slider bar, and the inner is the progress or filled area of the bar.
 * The setHeight method controls the total height of the outer bar,
 * and the setPadding method controls the padding between the outer and inner bars.
 *
 * A slider head can also be defined using the setHead method.  This will create an
 * animated button at the end of the progress.
 *
 * The current value can be retrieved using getValue method.
 *
 * Example Markup:
 *
 *		<nagra:slider id="mySlider" x="100" y="100" width="200" height="15" />
 *
 * Example JavaScript :
 *
 *		$N.gui.FrameworkCore.extendWithGUIObjects(document.documentElement, view);
 *		view.mySlider.setPadding(2);
 *		view.mySlider.setInnerCssClass: "innerClass";
 *		view.mySlider.setOuterCssClass: "outerClass";
 *		view.mySlider.setInnerHighlightCssClass: "innerHighlightClass";
 *
 * @class $N.gui.Slider
 * @extends $N.gui.AbstractControl
 *
 * @requires $N.gui.AbstractControl
 * @requires $N.gui.Container
 * @requires $N.gui.SVGlink
 * @requires $N.gui.Util
 * @requires $N.gui.FrameworkCore
 *
 * @author dthomas
 * @constructor
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 *
 */
define('jsfw/gui/GUIObjects/Controls/Slider',
    [
    'jsfw/gui/GUIObjects/Controls/AbstractControl',
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Components/SVGlink',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/FrameworkCore'
    ],
    function (AbstractControl, Container, SVGlink, Util, FrameworkCore) {

		function Slider(docRef, parent) {
			Slider.superConstructor.call(this, docRef);

			this._docRef = docRef;

			this._outer = new $N.gui.Container(this._docRef);
			this._inner = new $N.gui.Container(this._docRef, this._outer);
			this._head = new $N.gui.SVGlink(this._docRef, this._outer);

			this._rootElement = this._outer.getRootElement();

			if (parent) {
				parent.addChild(this._outer);
			}

			this._orientation = Slider.consts.ORIENTATION_HORIZONTAL;

			this._outer.configure({
				x: 0,
				y: 0
			});

			this._inner.configure({
				x: 0,
				y: 0
			});

			this._minimum = 0;
			this._maximum = 0;
			this._value = 0;

			// padding between inner and outer
			this._padding = 0;
		}

		$N.gui.Util.extend(Slider, $N.gui.AbstractControl);

		/**
		 * Initialise the slider.
		 * @method init
		 * @param {Number} min The minimum value of the progress bar.
		 * @param {Number} max The maximum value of the progress bar.
		 * @param {Number} current The initial value.
		 */
		Slider.prototype.init = function (min, max, current) {
			if (min !== undefined && max !== undefined) {
				this.setMinimumValue(min);
				this.setMaximumValue(max);
				if (current && current <= max && current >= min) {
					this.setValue(current);
				} else {
					this.setValue(min);
				}
			} else {
				throw "Exception: slider minimum and maximum values are not valid";
			}
		};

		/**
		 * Initialise the slider.
		 * @method initialise
		 * @deprecated use init()
		 * @param {Number} min The minimum value of the progress bar.
		 * @param {Number} max The maximum value of the progress bar.
		 * @param {Number} current The initial value.
		 */
		Slider.prototype.initialise = function (min, max, current) {
			this.init(min, max, current);
		};

		/**
		 * Sets the minimum value of the slider.
		 * @method setMinimumValue
		 * @param {Number} minValue The minimum value of the progress bar.
		 */
		Slider.prototype.setMinimumValue = function (minValue) {
			this._minimum = minValue;
		};

		/**
		 * Sets the maximum value of the slider.
		 * @method setMaximumValue
		 * @param {Number} maxValue The maximum value of the progress bar.
		 */
		Slider.prototype.setMaximumValue = function (maxValue) {
			this._maximum = maxValue;
		};

		/**
		 * Sets the width of the slider.
		 * @method setWidth
		 * @param {Number} newWidth The width of the progress bar.
		 */
		Slider.prototype.setWidth = function (newWidth) {
			this._width = newWidth - (this._padding * 2);
			this._outer.setWidth(newWidth);
			if (this._orientation === Slider.consts.ORIENTATION_VERTICAL) {
				this._head.setX(newWidth / 2);
				this._inner.setWidth(this._width);
			}
		};

		/**
		 * Sets the height of the slider.
		 * @method setHeight
		 * @param {Number} newHeight The height of the progress bar.
		 */
		Slider.prototype.setHeight = function (newHeight) {
			this._height = newHeight - (this._padding * 2);
			this._outer.setHeight(newHeight);
			if (this._orientation === Slider.consts.ORIENTATION_HORIZONTAL) {
				this._head.setY(newHeight / 2);
				this._inner.setHeight(this._height);
			}
		};

		/**
		 * Gets the height of the slider.
		 * @method getHeight
		 * @return {Number} Slider height
		 */
		Slider.prototype.getHeight = function () {
			return this._outer.getHeight();
		};

		/**
		 * Sets the orientation of the slider.
		 * @method setOrientation
		 * @param {Number} newOrientation The orientation of the Slider.
			 * It will be 'horizontal' or 'vertical'
		 */
		Slider.prototype.setOrientation = function (newOrientation) {
			this._orientation = newOrientation;
		};

		/**
		 * Gets the orientation of the slider.
		 * @method getOrientation
		 * @return {Number} Slider orientation
		 */
		Slider.prototype.getOrientation = function () {
			return this._orientation;
		};

		/**
		 * Sets the internal padding of the slider.
		 * @method setPadding
		 * @param {Object} padding The new padding value.
		 */
		Slider.prototype.setPadding = function (padding) {
			this._padding = padding;
			this._inner.setX(padding);
			this._inner.setY(padding);
			this._inner.setHeight(this._outer.getHeight() - (padding * 2));
			this._width = this._outer.getWidth() - (padding * 2);
		};

		/**
		 * Sets the rounding of the slider bar.
		 * @method setRounding
		 * @param {Object} rounding The new rounding value.
		 */
		Slider.prototype.setRounding = function (rounding) {
			this._outer.setRounding(rounding);
			this._inner.setRounding(rounding);
		};

		/**
		 * Sets the url that should be used to draw the head
		 * @method setHead
		 * @param {Object} head
		 */
		Slider.prototype.setHead = function (head) {
			this._headRef = head;
			this._head.setHref(head);
		};

		/**
		 * Sets the CSS styling of the inner slider bar.
		 * @method setInnerStyle
		 * @deprecated use CSS classes instead
		 * @param {Object} style The new CSS style string.
		 */
		Slider.prototype.setInnerStyle = function (style) {
			this._inner.setCssStyle(style);
		};

		/**
		 * Sets the CSS styling of the outer slider bar.
		 * @method setOuterStyle
		 * @deprecated use CSS classes instead
		 * @param {Object} style The new CSS style string.
		 */
		Slider.prototype.setOuterStyle = function (style) {
			this._outer.setCssStyle(style);
		};

		/**
		 * Sets the CSS class of the inner slider bar.
		 * @method setInnerCssClass
		 * @param {Object} newClass
		 */
		Slider.prototype.setInnerCssClass = function (newClass) {
			this._inner.setCssClass(newClass);
		};

		/**
		 * Sets the CSS class of the outer slider bar.
		 * @method setOuterCssClass
		 * @param {Object} newClass
		 */
		Slider.prototype.setOuterCssClass = function (newClass) {
			this._outer.setCssClass(newClass);
		};

		/**
		 * Sets the CSS styling of the inner slider bar during focus.
		 * @method setInnerHighlightStyle
		 * @deprecated use CSS classes instead
		 * @param {Object} style The new CSS style string.
		 */
		Slider.prototype.setInnerHighlightStyle = function (style) {
			this._inner.setCssHighlightStyle(style);
		};

		/**
		 * Sets the CSS styling of the outer slider bar during focus.
		 * @method setOuterHighlightStyle
		 * @deprecated use CSS classes instead
		 * @param {Object} style The new CSS style string.
		 */
		Slider.prototype.setOuterHighlightStyle = function (style) {
			this._outer.setCssHighlightStyle(style);
		};

		/**
		 * Sets the CSS class of the inner slider bar when the slider is focused.
		 * @method setInnerHighlightCssClass
		 * @param {Object} newClass
		 */
		Slider.prototype.setInnerHighlightCssClass = function (newClass) {
			this._inner.setCssHighlightClass(newClass);
		};

		/**
		 * Sets the CSS class of the outer slider bar when the slider is focused.
		 * @method setOuterHighlightCssClass
		 * @param {Object} newClass
		 */
		Slider.prototype.setOuterHighlightCssClass = function (newClass) {
			this._outer.setCssHighlightClass(newClass);
		};

		/**
		 * Focusses the slider by adjusting the CSS styling.
		 * @method highlight
		 */
		Slider.prototype.highlight = function () {
			this._inner.highLight();
			this._outer.highLight();
		};

		/**
		 * Defocuses the slider by adjusting the CSS styling.
		 * @method unHighlight
		 */
		Slider.prototype.unHighlight = function () {
			this._inner.unHighLight();
			this._outer.unHighLight();
		};

		/**
		 * Sets the progress width within the progress bar.
		 * @method setProgress
		 * @param {Number} value The amount of progress made.
		 */
		Slider.prototype.setValue = function (value) {
			this._value = value;
			this._drawSliderBar();
		};

		/**
		 * Returns the current value of the slider.
		 * @method getValue
		 * @return {Number} The current value
		 */
		Slider.prototype.getValue = function () {
			return this._value;
		};

		/**
		 * Increments the slider.
		 * @method increment
		 */
		Slider.prototype.increment = function () {
			if (this._value < this._maximum) {
				this._value++;
			}
			this._drawSliderBar();
		};

		/**
		 * Decrements the slider.
		 * @method decrement
		 */
		Slider.prototype.decrement = function () {
			if (this._value > this._minimum) {
				this._value--;
				this._drawSliderBar();
			}
		};

		Slider.prototype._drawSliderBar = function () {
			if (this._orientation === Slider.consts.ORIENTATION_HORIZONTAL) {
				this._drawSliderBarHorizontal();
			} else if (this._orientation === Slider.consts.ORIENTATION_VERTICAL) {
				this._drawSliderBarVertical();
			}
		};

		/**
		 * A method to actually draw the control with horizontal orientation
		 * @method _drawSliderBarHorizontal
		 * @private
		 */
		Slider.prototype._drawSliderBarHorizontal = function () {
			var segment = this._width / (this._maximum - this._minimum);
			var width = segment * (this._value - this._minimum);
			this._inner.setWidth(width);
			if (this._headRef) {
				this._head.setX(width);
			}
		};

		/**
		 * A method to actually draw the control with vertical orientation
		 * @method _drawSliderBarVertical
		 * @private
		 */
		Slider.prototype._drawSliderBarVertical = function () {
			var segment = this._height / (this._maximum - this._minimum);
			var height = segment * (this._value - this._minimum);
			var y = this._height - (this._value * segment);
			this._inner.setY(y);
			this._inner.setHeight(height);
			this._inner.setWidth(this._width);

			if (this._headRef) {
				this._head.setY(y); //If write "height" instead "y", head runs in oposite way
			}
		};

		/**
		 * Handles the key entry.
		 * @method keyHandler
		 * @param {Object} key
		 * @return {Boolean} True if the key press was handled.
		 */
		Slider.prototype.keyHandler = function (key) {
			var handled = false;
			var keys = $N.gui.FrameworkCore.getKeys();
			switch (key) {
			case keys.KEY_RIGHT:
				this.increment();
				handled = true;
				break;
			case keys.KEY_LEFT:
				this.decrement();
				handled = true;
				break;
			default:
				break;
			}

			return handled;
		};

		/**
		 * Returns the Slider class name as a String.
		 * @method toString
		 * @return {String} The Slider class name as a String.
		 */
		Slider.prototype.toString = function () {
			return "Slider";
		};

		/**
		 * Returns the Slider class name as a String.
		 * @method getClassName
		 * @return {String} The Slider class name as a String.
		 */
		Slider.prototype.getClassName = function () {
			return this.toString();
		};

		/**
		 * Constants that identify the orientation (vertical or horizontal) of the List. One of
		 * `ORIENTATION_VERTICAL` or `ORIENTATION_HORIZONTAL`
		 * @property {Number} consts
		 * @readonly
		 */
		Slider.consts = {
			ORIENTATION_VERTICAL: 'vertical',
			ORIENTATION_HORIZONTAL : 'horizontal'
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.Slider = Slider;
		return Slider;
	}
);