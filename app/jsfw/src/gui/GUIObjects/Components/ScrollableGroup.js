/**
 * ScrollableGroup is an implementation of AbstractComponent. It is not directly related to
 * an `$N.gui.Group`, except that they are both containers for other components.
 *
 * It is used to define a scrolling group on screen that other mark-up objects can be drawn
 * (added) within.
 * Example mark-up:
 *
 *     <nagra:scrollableGroup id="scrollableGroup" x="50" y="50" width="100" height="100">
 *         <!-- components to add to the scrollable group /-->
 *     </nagra:scrollableGroup>
 *
 * Example code:
 *
 *     view.scrollableGroup.setAnimationDuration("2500ms");  // Scrolls last for 2.5 seconds
 *     [...]
 *     view.scrollableGroup.setScrollPosition(100, 100);     // Relative to top-left of group
 *
 * Important note: This component takes advantage of hardware acceleration features, and does
 * not perform in the same way as can be expected from the other GUI components. The area
 * defined as the scrollable group is fixed on screen. Everything within that area, regardless
 * of whether the screen changes, or whether there are layers, will be affected.
 *
 * Please also note:
 * <ol type="1">
 *   <li>All coordinate values are in pixels, and are relative to the top-left of the scrollable
 *       group.</li>
 *   <li>Negative values typically denote up/left, and positive ones down/right.</li>
 *   <li>The animation duration is in seconds if no unit is given.</li>
 *   <li>If you scroll to an area of the group that is beyond the bounds of your visible items
 *       (for example to the top-left of coordinates `(0, 0)`), then the remainder
 *       area will be filled with whitespace.</li>
 * <ol>
 *
 * @class $N.gui.ScrollableGroup
 * @extends $N.gui.AbstractComponent
 * @requires $N.gui.GUIObject
 * @requires $N.gui.AbstractComponent
 * @requires $N.gui.Util
 * @constructor
 * @param {Object} docRef DOM reference
 * @param {Object} parent Parent class
 */
define('jsfw/gui/GUIObjects/Components/ScrollableGroup',
    [
    'jsfw/gui/Animations/Animate',
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/AbstractComponent',
    'jsfw/gui/helpers/Util'
    ],
    function (Animate, GUIObject, AbstractComponent, Util) {

		var domAbstraction = {
			SVG: {
				createElement: function (docRef) {
					var newElement = docRef.createElementNS("http://www.ekioh.com/2007/ekioh", "scrollableGroup");
					return {
						root: newElement,
						inner : newElement
					};
				},
				setXScrollPosition: function (guiObject, element, x, factor) {
					var duration = guiObject.getAnimationDuration();
					guiObject._xScrollAnim.setDuration(0);
					element.setAttributeNS("http://www.ekioh.com/2007/ekioh", "scrollX", x / factor);
					guiObject._xScrollAnim.setDuration(duration);
				},
				setYScrollPosition: function (guiObject, element, y, factor) {
					var duration = guiObject.getAnimationDuration();
					guiObject._yScrollAnim.setDuration(0);
					element.setAttributeNS("http://www.ekioh.com/2007/ekioh", "scrollY", y / factor);
					guiObject._yScrollAnim.setDuration(duration);
				},
				setXScrollAnim: function (guiObject) {
					guiObject._xScrollAnim = new $N.gui.Animate(guiObject._docRef, guiObject);
					guiObject._xScrollAnim.setAttributeName("ekioh:scrollX");
					guiObject._xScrollAnim.setDuration(guiObject.getAnimationDuration());
				},
				setYScrollAnim: function (guiObject) {
					guiObject._yScrollAnim = new $N.gui.Animate(guiObject._docRef, guiObject);
					guiObject._yScrollAnim.setAttributeName("ekioh:scrollY");
					guiObject._yScrollAnim.setDuration(guiObject.getAnimationDuration());
				},
				scrollXTo: function (guiObject, from, to) {
					guiObject._xScrollAnim.setFrom(from);
					guiObject._xScrollAnim.setTo(to);
					guiObject._xScrollAnim.animate();
				},
				scrollYTo: function (guiObject, from, to) {
					guiObject._yScrollAnim.setFrom(from);
					guiObject._yScrollAnim.setTo(to);
					guiObject._yScrollAnim.animate();
				}
			},
			HTML: {
				createElement: function (docRef) {
					var rootElement = docRef.createElement("div");
					rootElement.style.padding = "0px";
					rootElement.style.position = "absolute";
					rootElement.style.overflow = "hidden";
					return {
						root: rootElement,
						inner: rootElement
					};
				},
				setXScrollPosition: function (guiObject, element, x, factor) {
					guiObject.getRootElement().scrollLeft = Math.round(x / factor);
				},
				setYScrollPosition: function (guiObject, element, y, factor) {
					guiObject.getRootElement().scrollTop = Math.round(y / factor);
				},
				setXScrollAnim: function (guiObject) {
				},
				setYScrollAnim: function (guiObject) {
				},
				scrollXTo: function (guiObject, from, to) {
					$(guiObject.getRootElement()).animate({scrollLeft: to}, guiObject.getAnimationDuration());
				},
				scrollYTo: function (guiObject, from, to) {
					$(guiObject.getRootElement()).animate({scrollTop: to}, guiObject.getAnimationDuration());
				}
			}
		}[$N.gui.GUIObject.mode];

		function ScrollableGroup(docRef, parent) {
			ScrollableGroup.superConstructor.call(this, docRef);

			var element = domAbstraction.createElement(this._docRef);

			this._rootElement = element.root;
			this._innerElement = element.inner;

			this._xScrollPosition = 0;
			this._yScrollPosition = 0;

			if (parent) {
				parent.addChild(this);
			}

			domAbstraction.setXScrollAnim(this);
			domAbstraction.setYScrollAnim(this);
			this.setAnimationDuration("1");
		}

		$N.gui.Util.extend(ScrollableGroup, $N.gui.AbstractComponent);

		/**
		 * Sets the duration of the animation to use for the scrollable group and also the contents
		 * of the scrollable group. The value should be presented as a number followed by a unit.
		 * (If no unit is probided, the duration value is assumed to be in seconds.) This method
		 * should be called in code, not in the mark-up.
		 *
		 * Examples of acceptable values:
		 * `4500ms` - 4,500 milliseconds
		 *
		 * Please note - if set in the mark-up, this method will not have any effect on the
		 * scrollable group's contents, only on the group itself. This is because the scroll
		 * animations are not available at that point in order to add the durations to them.
		 *
		 * @method setAnimationDuration
		 * @param {String} duration the duration of the animation, in milliseconds.
		 */
		ScrollableGroup.prototype.setAnimationDuration = function (duration) {
			ScrollableGroup.superClass.setAnimationDuration.call(this, duration);
			if (this._xScrollAnim && this._yScrollAnim) {
				this._animationDuration = duration;
				this._xScrollAnim.setDuration(duration);
				this._yScrollAnim.setDuration(duration);
			}
		};

		/**
		 * Sets (jumps to) the given absolute coordinates of the group's viewable area.
		 *
		 * @method setScrollPosition
		 * @param {Number} x the absolute x-coordinate to jump to.
		 * @param {Number} y the absolute y-coordinate to jump to.
		 */
		ScrollableGroup.prototype.setScrollPosition = function (x, y) {
			domAbstraction.setXScrollPosition(this, this._innerElement, x, this.resolutionHorizontalFactor);
			this._xScrollPosition = x;
			domAbstraction.setYScrollPosition(this, this._innerElement, y, this.resolutionHorizontalFactor);
			this._yScrollPosition = y;
		};

		/**
		 * Returns the x-coordinate of the group's viewable area.
		 *
		 * @method getXScrollPosition
		 * @return {Number} the x-coordinate of the group's viewable area.
		 */
		ScrollableGroup.prototype.getXScrollPosition = function () {
			return this._xScrollPosition;
		};

		/**
		 * Returns the y-coordinate of the group's viewable area.
		 *
		 * @method getYScrollPosition
		 * @return {Number} the y-coordinate of the group's viewable area.
		 */
		ScrollableGroup.prototype.getYScrollPosition = function () {
			return this._yScrollPosition;
		};

		/**
		 * Returns the scroll animation object being used for the x-axis. Use this method to
		 * augment or change the attributes of the animation that cannot be done in one of
		 * the setters, such as a callback.
		 *
		 * @method getXScrollAnimation
		 * @return the x-axis scroll animation object.
		 */
		ScrollableGroup.prototype.getXScrollAnimation = function () {
			return this._xScrollAnim;
		};

		/**
		 * Returns the scroll animation object being used for the y-axis. Use this method to
		 * augment or change the attributes of the animation that cannot be done in one of
		 * the setters, such as a callback.
		 *
		 * @method getYScrollAnimation
		 * @return the y-axis scroll animation object.
		 */
		ScrollableGroup.prototype.getYScrollAnimation = function () {
			return this._yScrollAnim;
		};

		/**
		 * Scrolls (animates the transition of) the group's viewable area, from the
		 * current coordinates to the absolute (x, y) coordinates given.
		 *
		 * @method scrollTo
		 * @param {Number} x the absolute x-coordinate to scroll to.
		 * @param {Number} y the absolute y-coordinate to scroll to.
		 */
		ScrollableGroup.prototype.scrollTo = function (x, y) {
			if (x !== this._xScrollPosition) {
				domAbstraction.scrollXTo(this, this._xScrollPosition, x);
				this._xScrollPosition = x;
			}
			if (y !== this._yScrollPosition) {
				domAbstraction.scrollYTo(this, this._yScrollPosition, y);
				this._yScrollPosition = y;
			}
		};

		/**
		 * Scrolls (animates the transition of) the x-axis of the group's viewable area
		 * by the given number of pixels. A negative value will scroll to the left, and
		 * a positive value will scroll to the right.
		 *
		 * @method scrollXPosition
		 * @param {Number} x the number of pixels to scroll by, along the x-axis.
		 */
		ScrollableGroup.prototype.scrollXPosition = function (x) {
			if (x !== 0) {
				domAbstraction.scrollXTo(this, this._xScrollPosition, this._xScrollPosition + x);
				this._xScrollPosition += x;
			}
		};

		/**
		 * Scrolls (animates the transition of) the y-axis of the group's viewable area
		 * by the given number of pixels. A negative value will scroll up, and a positive
		 * value will scroll down.
		 *
		 * @method scrollYPosition
		 * @param {Number} y the number of pixels to scroll by, along the y-axis.
		 */
		ScrollableGroup.prototype.scrollYPosition = function (y) {
			if (y !== 0) {
				domAbstraction.scrollYTo(this, this._yScrollPosition, this._yScrollPosition + y);
				this._yScrollPosition += y;
			}
		};

		/**
		 * Returns the class name of this component.
		 * @method getClassName
		 * @return {String} the class name of this component.
		 */
		ScrollableGroup.prototype.getClassName = function () {
		    return ("ScrollableGroup");
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.ScrollableGroup = ScrollableGroup;
		return ScrollableGroup;
    }
);