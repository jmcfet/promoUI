/**
 * ScrollingTextArea creates a scrollable text area which can controlled using the
 * up/down keys.
 *
 * Example mark-up definition:
 *
 *     <nagra:scrollingTextArea id="textArea" width="200" height="300" scrollBarPosition="200" scrollBarWidth="5" scrollStep="30"
 *          textCssClass="text" scrollBarOuterCssClass="outer" scrollBarInnerCssClass="inner" />
 *
 * Example JavaScript using `setText` (only allows newline formatting):
 *
 *     $N.gui.FrameworkCore.extendWithGUIObjects(document.documentElement, view);
 *     view.textArea.setText("This is my text/ncontent!");
 *
 * Example JavaScript without using `setText` (allows CSS formatting of
 * specific portions of text):
 *
 *     $N.gui.FrameworkCore.extendWithGUIObjects(document.documentElement, view);
 *     view.textArea.addStyledText("This is my text/n", "greenText"); // Uses CSS class "greenText"
 *     view.textArea.addStyledText("content!");                       // Does not apply CSS styling
 *     view.textArea.addNewline(); // An alternate way of adding a newline
 *
 * The scrolling area will adjust itself depending on the rendered height of the
 * contained text.  If the text fits within the dimensions of the ScrollingTextArea
 * then no scroll bar will be displayed, otherwise an animated scroll bar will
 * show the position of the viewable area within the text content.  The scroll bar
 * can be disabled using `setScrollBar(false)` from javaScript,
 * or `scrollBar="false"` from the markup.
 *
 * If up / down indicators are required, you can define any GUI component and attach
 * it to the ScrollingTextArea using the `setUpIndicator` and `setDownIndicator`
 * methods. The ScrollingTextArea will then show and hide the indicators depending on whether
 * there is content above or below the current scroll position.
 *
 * The scrolling of the text area is controlled by passing key codes to the
 * classes `keyHandler` method.
 *
 *     view.textArea.keyHandler(key);
 *
 * For more information about applying styling (CSS styles and newlines), please read the
 * class-level jsdocs for `$N.gui.StyledTextArea`.
 *
 * @class $N.gui.ScrollingTextArea
 * @extends $N.gui.AbstractControl
 *
 * @requires $N.gui.ClippedGroup
 * @requires $N.gui.StyledTextArea
 * @requires $N.gui.ProgressBar
 * @requires $N.gui.Util
 * @requires $N.gui.AbstractControl
 * @requires $N.gui.FrameworkCore
 *
 * @author dthomas
 * @constructor
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */
define('jsfw/gui/GUIObjects/Controls/ScrollingTextArea',
    [
    'jsfw/gui/GUIObjects/Components/ClippedGroup',
    'jsfw/gui/GUIObjects/Components/StyledTextArea',
    'jsfw/gui/GUIObjects/Controls/ProgressBar',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Controls/AbstractControl',
    'jsfw/gui/FrameworkCore'
    ],
    function (ClippedGroup, StyledTextArea, ProgressBar, Util, AbstractControl, FrameworkCore) {

		function ScrollingTextArea(docRef, parent) {
			ScrollingTextArea.superConstructor.call(this, docRef);

			this._docRef = docRef;

			this._container = new $N.gui.ClippedGroup(this._docRef);
			this._textArea = new $N.gui.StyledTextArea(this._docRef, this._container);
			this._scrollBar = new $N.gui.ProgressBar(this._docRef, this._container);

			this._rootElement = this._container.getRootElement();

			if (parent) {
				parent.addChild(this._container);
			}

			this._container.configure({
				x: 0,
				y: 0,
				width: 200,
				height: 200
			});

			this._textArea.configure({
				x: 0,
				y: 0,
				width: 200
			});

			this._scrollBar.configure({
				x: 190,
				y: 0,
				width: 10,
				height: 200
			});
			this._scrollBar.setOrientation($N.gui.ProgressBar.VERTICAL);
			this._scrollBar.init(0, 100);
			this._scrollBar.setRounding(3);

			// padding between inner and outer
			this._width = 200;
			this._height = 200;
			this._scrollWidth = 10;
			this._scrollPosition = 180;
			this._position = 0;
			this._scrollStep = 10;
			this._bottomLimit = 0;
			this._enabled = false;
			this._scrollBarActive = true;
		}

		$N.gui.Util.extend(ScrollingTextArea, $N.gui.AbstractControl);

		/**
		 * Private method to calculate the bottom limit of the scroll area.
		 * @method _calculateBottomLimit
		 * @private
		 */
		ScrollingTextArea.prototype._calculateBottomLimit = function () {
			this._bottomLimit = this._textArea.getContentHeight() - this._height;
		};

		/**
		 * Private method which draws the scroll bar.
		 * @method _drawScrollBar
		 * @private
		 */
		ScrollingTextArea.prototype._drawScrollBar = function () {
			var windowHeight = this._container.getHeight();
			var textHeight = this._textArea.getContentHeight();

			var start,
			    visible;

			if (windowHeight < textHeight && this._enabled) {
				start = this._position / textHeight * 100;
				visible = windowHeight / textHeight * 100;
				this._scrollBar.setProgress(start + visible, start);
				this._scrollBar.show();
			} else {
				this._scrollBar.hide();
			}
		};

		/**
		 * Private method which updates the display.
		 * @method _update
		 * @private
		 */
		ScrollingTextArea.prototype._update = function () {
			this._textArea.setY(-this._position);

			if (this._scrollBarActive) {
				this._drawScrollBar();
			}

			if (this._upIndicator) {
				if (this._position > 0 && this._enabled) {
					this._upIndicator.show();
				} else {
					this._upIndicator.hide();
				}
			}

			if (this._downIndicator) {
				if (this._position < this._bottomLimit && this._enabled) {
					this._downIndicator.show();
				} else {
					this._downIndicator.hide();
				}
			}
		};

		/**
		 * Sets the textual content within this `ScrollingTextArea` to the text
		 * given. This text may contain newline characters (`\n`).
		 *
		 * If you use this method, do not use `addStyledText` and
		 * `addNewline`.
		 *
		 * @method setText
		 * @param text {String} the text to set inside this scrolling text area.
		 */
		ScrollingTextArea.prototype.setText = function (text) {
			this._textArea.setText(text);
			this._calculateBottomLimit();
			this._update();
		};

		/**
		 * Sets the size of the `TextArea`. Note: Setting the size here will override the CSS equivalent.
		 *
		 * @method setFontSize
		 * @param {Number} newSize the new font size to use.
		 */
		ScrollingTextArea.prototype.setFontSize = function (newSize) {
			this._textArea._fontSize = newSize;
			this._textArea._innerElement.setAttribute("font-size", newSize);
		};

		/**
		 * Adds a styled text object (i.e. an `$N.gui.SpanObject`) to the textual
		 * content within this `ScrolledTextArea`.
		 *
		 * Do not use this method if you have used method `setText` or used the
		 * "text" attribute of `ScrollingTextArea` within the mark-up.
		 *
		 * @method addStyledText
		 * @param {Object} child an `$N.gui.SpanObject` representing the text (and an
		 *                        optional CSS class name) to add (append) to the textual content.
		 */
		ScrollingTextArea.prototype.addStyledText = function (child) {
			this._textArea.addChild(child);
			this._calculateBottomLimit();
		};

		/**
		 * Adds (appends) a line break to the textual content within this
		 * `ScrollingTextArea`.
		 *
		 * Do not use this method if you have used method `setText` or used the
		 * "text" attribute of `ScrollingTextArea` within the mark-up.
		 *
		 * @method addNewline
		 */
		ScrollingTextArea.prototype.addNewline = function () {
			this._textArea.addNewline();
		};

		/**
		 * Sets the width of the ScrollingTextArea.
		 * @method setWidth
		 * @param {Number} width The width of the progress bar.
		 */
		ScrollingTextArea.prototype.setWidth = function (width) {
			this._width = width;
			this._container.setWidth(width);
			this._textArea.setWidth(width);
		};

		/**
		 * Sets the height of the ScrollingTextArea.
		 * @method setHeight
		 * @param {Number} height The height of the progress bar.
		 */
		ScrollingTextArea.prototype.setHeight = function (height) {
			this._height = height;
			this._container.setHeight(height);
			this._scrollBar.setHeight(height);
			this._calculateBottomLimit();
		};

		/**
		 * Sets the width of the scroll bar.
		 * @method setScrollBarWidth
		 * @param {Number} width The width of the scroll bar.
		 */
		ScrollingTextArea.prototype.setScrollBarWidth = function (width) {
			this._scrollWidth = width;
			this._scrollBar.setWidth(width);
		};

		/**
		 * Sets the position of the scroll bar.
		 * @method setScrollBarPosition
		 * @param {Number} position The position of the scroll bar.
		 */
		ScrollingTextArea.prototype.setScrollBarPosition = function (position) {
			this._scrollPosition = position;
			this._scrollBar.setX(position);
			if (position + this._scrollWidth > this._width) {
				this._container.setWidth(position + this._scrollWidth);
			}
		};

		/**
		 * Sets the step increment of the scroll.  The default value is 10.
		 * @method setScrollStep
		 * @param {Number} step The step of the scroll.
		 */
		ScrollingTextArea.prototype.setScrollStep = function (step) {
			this._scrollStep = parseInt(step, 10);
		};

		/**
		 * Defines whether this ScrollingTextArea should have a scroll bar or not.
		 * @method setScrollBar
		 * @param {Boolean} active True if a scroll bar is required (default behaviour)
		 */
		ScrollingTextArea.prototype.setScrollBar = function (active) {
			if (active === true || active === "true") {
				this._scrollBarActive = true;
				this._scrollBar.show();
			} else {
				this._scrollBarActive = false;
				this._scrollBar.hide();
			}
		};

		/**
		 * Defines an up indicator to be shown when up scrolling is possible.
		 * @method setUpIndicator
		 * @param {Object} guiComponent A NAGRA GUI component
		 */
		ScrollingTextArea.prototype.setUpIndicator = function (guiComponent) {
			this._upIndicator = guiComponent;
			this._upIndicator.hide();
		};

		/**
		 * Defines a down indicator to be shown when down scrolling is possible.
		 * @method setDownIndicator
		 * @param {Object} guiComponent A NAGRA GUI component
		 */
		ScrollingTextArea.prototype.setDownIndicator = function (guiComponent) {
			this._downIndicator = guiComponent;
			this._downIndicator.hide();
		};

		/**
		 * Returns the textual content within this `ScrollingTextArea`. This
		 * text may contain newline characters (`\n`).
		 *
		 * If you have used methods `addStyledText` and/or `addNewline`,
		 * then this method will not return an accurate value.
		 *
		 * @method getText
		 */
		ScrollingTextArea.prototype.getText = function () {
			return this._textArea.getText();
		};

		/**
		 * Gets the width of the ScrollingTextArea.
		 * @method getWidth
		 * @return {Number} width
		 */
		ScrollingTextArea.prototype.getWidth = function () {
			return this._width;
		};

		/**
		 * Gets the height of the ScrollingTextArea.
		 * @method getHeight
		 * @return {Number} height
		 */
		ScrollingTextArea.prototype.getHeight = function () {
			return this._height;
		};

		/**
		 * Returns the step increment of the scroll.
		 * @method getScrollStep
		 * @return {Number} The current step of the scroll.
		 */
		ScrollingTextArea.prototype.getScrollStep = function () {
			return this._scrollStep;
		};

		/**
		 * Sets the CSS class of the text.
		 * @method setTextCssClass
		 * @param {String} cssClass The CSS class
		 */
		ScrollingTextArea.prototype.setTextCssClass = function (cssClass) {
			this._textArea.setCssClass(cssClass);
		};

		/**
		 * Sets the CSS class of the inner part of the scroll bar.
		 * @method setScrollBarInnerCssClass
		 * @param {String} cssClass The CSS class
		 */
		ScrollingTextArea.prototype.setScrollBarInnerCssClass = function (cssClass) {
			this._scrollBar.setInnerCssClass(cssClass);
		};

		/**
		 * Sets the CSS class of the outer part of the scroll bar.
		 * @method setScrollBarOuterCssClass
		 * @param {String} cssClass The CSS class
		 */
		ScrollingTextArea.prototype.setScrollBarOuterCssClass = function (cssClass) {
			this._scrollBar.setOuterCssClass(cssClass);
		};

		/**
		 * Enables the ScrollingTextArea.
		 * @method enable
		 */
		ScrollingTextArea.prototype.enable = function () {
			this._enabled = true;
			this._update();
		};

		/**
		 * Disables the ScrollingTextArea.
		 * @method disable
		 */
		ScrollingTextArea.prototype.disable = function () {
			this._enabled = false;
			this._update();
		};

		/**
		 * Scrolls the text to the specified position.  If the specified position is
		 * greater than the size of the supplied text, then the text is scrolled to
		 * the bottom.
		 * @method scrollTo
		 * @param {Number} position The position to scroll to
		 */
		ScrollingTextArea.prototype.scrollTo = function (position) {
			this._position = position > 0 ? position : 0;
			if (this._bottomLimit > 0 && this._position > this._bottomLimit) {
				this._position = this._bottomLimit;
			}
			this._update();
		};

		/**
		 * Handles the key entry.
		 * @method keyHandler
		 * @param {Object} key
		 * @return {Boolean} True if the key press was handled, false otherwise.
		 */
		ScrollingTextArea.prototype.keyHandler = function (key) {
			var handled = false,
			    keys = $N.gui.FrameworkCore.getKeys();

			if (this._enabled) {
				switch (key) {
				case keys.KEY_UP:
					if (this._position > 0) {
						this._position -= this._scrollStep;
						if (this._position < 0) {
							this._position = 0;
						}
						this._update();
						handled = true;
					}
					break;
				case keys.KEY_DOWN:
					if (this._position < this._bottomLimit) {
						this._position += this._scrollStep;
						if (this._position > this._bottomLimit) {
							this._position = this._bottomLimit;
						}
						this._update();
						handled = true;
					}
					break;
				}
			}

			return handled;
		};

		/**
		 * Returns the ScrollingTextArea class name as a String.
		 * @method toString
		 * @return {String} The ScrollingTextArea class name as a String.
		 */
		ScrollingTextArea.prototype.toString = function () {
			return "ScrollingTextArea";
		};

		/**
		 * Returns the ScrollingTextArea class name as a String.
		 * @method getClassName
		 * @return {String} The ScrollingTextArea class name as a String.
		 */
		ScrollingTextArea.prototype.getClassName = function () {
			return this.toString();
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.ScrollingTextArea = ScrollingTextArea;
		return ScrollingTextArea;
	}
);