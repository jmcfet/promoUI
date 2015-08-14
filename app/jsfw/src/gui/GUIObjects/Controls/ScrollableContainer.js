/**
 * `ScrollableContainer` is an implementation of `$N.gui.AbstractControl`.
 *
 * Creates a scrollable, styled container for holding other components and controls. It is similar in appearance
 * and use to a `$N.gui.ScrollingTextArea`, except that it accepts member components just as an
 * `$N.gui.Container` does. However, this control does not inherit directly from either of them.
 *
 * Example mark-up:
 *
 *     <nagra:scrollableContainer id="scrCon" x="100" y="400" width="700" height="160"
 *         scrollBarPosition="695"	scrollBarWidth="5" scrollStep="5" scrollBar="true"
 *         scrollBarOuterCssClass="outer" scrollBarInnerCssClass="inner">
 *     <!-- other components and controls /-->
 *     </nagra:scrollableContainer>
 *
 * Example code:
 *
 *     view.scrCon.setAnimationDuration("2500ms");  // Animated scrolls last for 2.5 seconds
 *     [...]
 *     view.scrCon.scrollTo(100);     // Jump to 100px down the content
 *     view.scrCon.doScrollTo(200);   // Perform a smooth transition to 100px down the content
 *
 * Note:
 * <ol type="1">
 *   <li>All coordinate values are in pixels, and are relative to the top-left of the scrollable
 *       group.</li>
 *   <li>The animation duration is in seconds if no unit is given.</li>
 *   <li>If you scroll to an area of the group that is beyond the bounds of your visible items
 *       (for example to the top-left of coordinates `(0, 0)`), then the remainder
 *       area will be filled with whitespace.</li>
 * <ol>
 * @class $N.gui.ScrollableContainer
 * @extends $N.gui.AbstractControl
 *
 * @requires $N.gui.AbstractControl
 * @requires $N.gui.ClippedGroup
 * @requires $N.gui.Container
 * @requires $N.gui.ProgressBar
 * @requires $N.gui.Util
 * @requires $N.gui.FrameworkCore
 *
 * @constructor
 * @param {Object} docRef Document Reference
 * @param {Object} parent The parent class/GUIObject.
 */
define('jsfw/gui/GUIObjects/Controls/ScrollableContainer',
    [
    'jsfw/gui/GUIObjects/Controls/AbstractControl',
    'jsfw/gui/GUIObjects/Components/ClippedGroup',
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Controls/ProgressBar',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/FrameworkCore'
    ],
    function (AbstractControl, ClippedGroup, Container, ProgressBar, Util, FrameworkCore) {

		function ScrollableContainer(docRef, parent) {
			ScrollableContainer.superConstructor.call(this, docRef);

			// The top level container of the scrollable container
			this._container = new $N.gui.ClippedGroup(this._docRef);
			// The container that member components are added to
			this._content = new $N.gui.Container(this._docRef, this._container);
			// The scroll bar that the user can use to scroll through the scrollable container's member components
			this._scrollBar = new $N.gui.ProgressBar(this._docRef, this._container);

			this._docRef = docRef;
			this._rootElement = this._container.getRootElement();

			this._container.configure({
				x: 0,
				y: 0,
				width: 100,
				height: 100
			});

			this._content.configure({
				x: 0,
				y: 0,
				width: 100
			});

			this._scrollBar.configure({
				x: 90,
				y: 0,
				width: 10,
				height: 100
			});

			this._scrollBar.setOrientation($N.gui.ProgressBar.VERTICAL);
			this._scrollBar.init(0, 100);
			this._scrollBar.setRounding(3);

			// padding between inner and outer
			this._width = 100;
			this._height = 100;
			this._scrollWidth = 10;
			this._scrollPosition = 80;
			this._position = 0;
			this._scrollStep = 10;
			this._bottomLimit = 0;
			this._contentHeight = 0;
			this._enabled = false;
			this._scrollBarActive = true;
			this._currentlySelectedItem = null;

			this._content.setAnimationDuration("1s");
			this._content.addMoveAnimation();

			if (parent) {
				parent.addChild(this._container);
			}
		}

		$N.gui.Util.extend(ScrollableContainer, $N.gui.AbstractControl);

		/**
		 * Sets the Y-axis position of the content container to that given. If the position
		 * is less than 0, then it is set to 0; if the position is greater than the height
		 * of the content container, then it is set to the height of the content container.
		 * @method _setPosition
		 * @private
		 * @param {Number} position
		 */
		ScrollableContainer.prototype._setPosition = function (position) {
			this._position = (position > 0) ? position : 0;
			if (this._position > (this._contentHeight - this._scrollBar.getHeight())) {
				this._position = this._contentHeight - this._scrollBar.getHeight();
			}
		};

		/**
		 * Calculates and sets the bottom limit of the scroll area.
		 * @method _calculateBottomLimit
		 * @private
		 */
		ScrollableContainer.prototype._calculateBottomLimit = function () {
			this._bottomLimit = this._contentHeight - this._height;
			if (this._bottomLimit < this._height) {
				this._bottomLimit = this._height;
			}
		};

		/**
		 * Draws the scroll bar.
		 * @method _drawScrollBar
		 * @private
		 */
		ScrollableContainer.prototype._drawScrollBar = function () {
			var windowHeight = this._container.getHeight(),
			    contentHeight = this._contentHeight;

			var start,
			    visible;

			if (windowHeight < contentHeight && this._enabled) {
				start = this._position / contentHeight * 100;
				visible = windowHeight / contentHeight * 100;
				this._scrollBar.setProgress(start + visible, start);
				this._scrollBar.show();
			} else {
				this._scrollBar.hide();
			}
		};

		/**
		 * Updates the display, animating the move to the new position if applicable.
		 * @method _update
		 * @param {Boolean} animate whether to animate the moving of the content container to the new position (if any).
		 * @private
		 */
		ScrollableContainer.prototype._update = function (animate) {
			animate = animate && (animate === true || animate === "true");

			if (!animate) {
				this._content.setY(-this._position);
			}

			if (this._scrollBarActive) {
				this._drawScrollBar();
			}

			if (this._upIndicator) {
				if (this._position > 0) {
					this._upIndicator.show();
				} else {
					this._upIndicator.hide();
				}
			}

			if (this._downIndicator) {
				if (this._position < this._bottomLimit) {
					this._downIndicator.show();
				} else {
					this._downIndicator.hide();
				}
			}

			if (animate) {
				this._content.doMove(0, -this._position, 0, this._content.getY());
			}
		};

		/**
		 * Sets the duration of an animated move performed by invoking method
		 * `doScrollTo`.
		 * @method setAnimationDuration
		 * @param duration  the duration that the animated move should take.
		 */
		ScrollableContainer.prototype.setAnimationDuration = function (duration) {
			this._content.setAnimationDuration(duration);
		};

		/**
		 * Sets the width of the ScrollableContainer.
		 * @method setWidth
		 * @param {Number} width The width of the progress bar.
		 */
		ScrollableContainer.prototype.setWidth = function (width) {
			this._width = width;
			this._container.setWidth(width);
		};

		/**
		 * Sets the height of the ScrollableContainer.
		 * @method setHeight
		 * @param {Number} height The height of the progress bar.
		 */
		ScrollableContainer.prototype.setHeight = function (height) {
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
		ScrollableContainer.prototype.setScrollBarWidth = function (width) {
			this._scrollWidth = width;
			this._scrollBar.setWidth(width);
		};

		/**
		 * Sets the position (X-coordinate, relative to the scrollable container) of the scroll bar.
		 * If the width of the scrollable container is insufficient to contain the scroll bar, then
		 * the scrollable container will be resized accordingly.
		 *
		 * @method setScrollBarPosition
		 * @param {Number} position The position of the scroll bar.
		 */
		ScrollableContainer.prototype.setScrollBarPosition = function (position) {
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
		ScrollableContainer.prototype.setScrollStep = function (step) {
			this._scrollStep = parseInt(step, 10);
		};

		/**
		 * Defines whether this ScrollableContainer should have a scroll bar or not.
		 * @method setScrollBar
		 * @param {Boolean} active True if a scroll bar is required (default behaviour)
		 */
		ScrollableContainer.prototype.setScrollBar = function (active) {
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
		ScrollableContainer.prototype.setUpIndicator = function (guiComponent) {
			this._upIndicator = guiComponent;
			this._upIndicator.hide();
		};

		/**
		 * Defines a down indicator to be shown when down scrolling is possible.
		 * @method setDownIndicator
		 * @param {Object} guiComponent A NAGRA GUI component
		 */
		ScrollableContainer.prototype.setDownIndicator = function (guiComponent) {
			this._downIndicator = guiComponent;
			this._downIndicator.hide();
		};

		/**
		 * Sets the CSS class of the inner part of the scroll bar.
		 * @method setScrollBarInnerCssClass
		 * @param {String} cssClass The CSS class
		 */
		ScrollableContainer.prototype.setScrollBarInnerCssClass = function (cssClass) {
			this._scrollBar.setInnerCssClass(cssClass);
		};

		/**
		 * Sets the CSS class of the outer part of the scroll bar.
		 * @method setScrollBarOuterCssClass
		 * @param {String} cssClass The CSS class
		 */
		ScrollableContainer.prototype.setScrollBarOuterCssClass = function (cssClass) {
			this._scrollBar.setOuterCssClass(cssClass);
		};

		/**
		 * Sets the given item as the currently-selected item, de-selecting the previous
		 * selected item if there was one and highlighting the new one. The given item
		 * must already have been added to the scrollable container.
		 *
		 * @method setCurrentlySelectedItem
		 * @param {Object} selectedItem the item in the container to select.
		 */
		ScrollableContainer.prototype.setCurrentlySelectedItem = function (selectedItem) {
			if (this._currentlySelectedItem && this._currentlySelectedItem.unHighlight) {
				this._currentlySelectedItem.unHighlight();
			}
			this._currentlySelectedItem = selectedItem;
			if (this._currentlySelectedItem.highlight) {
				this._currentlySelectedItem.highlight();
			}
		};

		/**
		 * Returns the duration of an animated move performed by invoking method
		 * `doScrollTo`.
		 *
		 * @method getAnimationDuration
		 * @return the duration that an animated move will take.
		 */
		ScrollableContainer.prototype.getAnimationDuration = function () {
			return this._content.getAnimationDuration();
		};

		/**
		 * Gets the width of the ScrollableContainer.
		 * @method getWidth
		 * @return {Number} width
		 */
		ScrollableContainer.prototype.getWidth = function () {
			return this._width;
		};

		/**
		 * Gets the height of the ScrollableContainer.
		 * @method getHeight
		 * @return {Number} height
		 */
		ScrollableContainer.prototype.getHeight = function () {
			return this._height;
		};

		/**
		 * Returns the step increment of the scroll.
		 * @method getScrollStep
		 * @return {Number} The current step of the scroll.
		 */
		ScrollableContainer.prototype.getScrollStep = function () {
			return this._scrollStep;
		};

		/**
		 * Adds a component to this `ScrollableContainer`.
		 * @method addComponent
		 * @param {Object} component the component to add to this scrollable container.
		 */
		ScrollableContainer.prototype.addComponent = function (component) {
			this.addChild(component);
		};

		/**
		 * Adds a component to the scrollable container's content.
		 * @method addChild
		 * @param {Object} child component to add
		 */
		ScrollableContainer.prototype.addChild = function (child) {
			var lowerYCoord;

			// Any animations without a getY method are expected not to be visible (e.g. animations)
			if (child.getY) {
				lowerYCoord = child.getY() + child.getHeight();

				if (lowerYCoord > this._contentHeight) {
					this._contentHeight = lowerYCoord;
				}

				if (!this._currentlySelectedItem) {
					this._currentlySelectedItem = child;
					if (this._enabled && child.highlight) {
						child.highlight();
					}
				}

				this._content.addChild(child);
				this._calculateBottomLimit();
				this._update();
			}
		};

		/**
		 * Enables the scrollable container, if not enabled already, so that it can be scrolled
		 * and so that the currently-selected item (if any) is highlighted (if possible).
		 *
		 * Note: This method will show the scrollbar or up/down indicators if/as applicable, so
		 * use the setter methods for these prior to invoking `enable`.
		 * @method showEnabled
		 */
		ScrollableContainer.prototype.showEnabled = function () {
			if (this._currentlySelectedItem && this._currentlySelectedItem.highlight) {
				this._currentlySelectedItem.highlight();
			}
			this._enabled = true;
			this._update();
		};

		/**
		 * Disables the scrollable container, if not disabled already, so that it cannot be scrolled
		 * and so that the currently-selected item (if any) is un-highlighted (if possible).
		 * @method showDisabled
		 */
		ScrollableContainer.prototype.showDisabled = function () {
			if (this._currentlySelectedItem && this._currentlySelectedItem.unHighlight) {
				this._currentlySelectedItem.unHighlight();
			}
			this._enabled = false;
			this._update();
		};

		/**
		 * Jumps to the content in the specified Y-axis position.
		 *
		 * If the specified position is greater than the size of the supplied content, then
		 * the content container is scrolled to the bottom. Similarly, if the specified
		 * position is less than zero, then the content container is scrolled to the top.
		 *
		 * @method scrollTo
		 * @param {Number} position The position to scroll to.
		 */
		ScrollableContainer.prototype.scrollTo = function (position) {
			if (position !== this._position) {
				this._setPosition(position);
				this._update();
			}
		};

		/**
		 * Performs a smooth (animated) transition from th current coordinates to the
		 * content in the specified Y-axis position.
		 *
		 * If the specified position is greater than the size of the supplied content, then
		 * the content container is scrolled to the bottom. Similarly, if the specified
		 * position is less than zero, then the content container is scrolled to the top.
		 *
		 * @method doScrollTo
		 * @param {Number} position The position to scroll to.
		 */
		ScrollableContainer.prototype.doScrollTo = function (position) {
			var fromPosition;

			if (position !== this._position) {
				fromPosition = this._position;
				this._setPosition(position);
				this._update(true, fromPosition);
			}
		};

		/**
		 * Handles the key entry.
		 * @method keyHandler
		 * @param {Object} key
		 * @return {Boolean} True if the key press was handled, false otherwise.
		 */
		ScrollableContainer.prototype.keyHandler = function (key) {
			var handled = false,
			    keys = $N.gui.FrameworkCore.getKeys();

			if (this._enabled) {
				switch (key) {
				case keys.KEY_UP:
					this._position -= this._scrollStep;
					if (this._position < 0) {
						this._position = 0;
					}
					this._update();
					handled = true;
					break;
				case keys.KEY_DOWN:
					this._position += this._scrollStep;
					if (this._position > (this._contentHeight - this._scrollBar.getHeight())) {
						this._position = this._contentHeight - this._scrollBar.getHeight();
					}
					this._update();
					handled = true;
					break;
				}
			}

			return handled;
		};

		/**
		 * Returns the class name of this component.
		 * @method getClassName
		 * @return {String}
		 */
		ScrollableContainer.prototype.getClassName = function () {
			return ("ScrollableContainer");
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.ScrollableContainer = ScrollableContainer;
		return ScrollableContainer;
	}
);