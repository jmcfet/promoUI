/**
 * Container is an implementation of AbstractComponent
 *
 * Creates styled container for holding other components and controls.
 *
 * Example markup:
 *
 *     <nagra:container id="myContainer" x="50" y="50" width="100" height="100" cssClass="myClass">
 *         <!-- other components /-->
 *     </nagra:container>
 *
 * @class $N.gui.Container
 * @extends $N.gui.AbstractComponent
 *
 * @requires $N.gui.Util
 * @requires $N.gui.GUIObject
 * @requires $N.gui.AbstractComponent
 * @constructor
 * @param {Object} docRef
 * @param {Object} parent
 */
define('jsfw/gui/GUIObjects/Components/Container',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/AbstractComponent',
    'jsfw/gui/helpers/Util'
    ],
    function (GUIObject, AbstractComponent, Util) {

		var domAbstraction = {
			SVG: {
				createElements: function (docRef) {
					var rootElement = docRef.createElement("g");
					var inner = docRef.createElement("rect");
					rootElement.appendChild(inner);
					return {
						root: rootElement,
						inner: inner
					};
				},
				setRounding: function (element, radius) {
					$N.gui.GUIObject.abstractedMethods.changeStyle(element, "rx", radius);
					$N.gui.GUIObject.abstractedMethods.changeStyle(element, "ry", radius);
				}
			},
			HTML: {
				createElements: function (docRef) {
					var rootElement = docRef.createElement("div");
					return {
						root: rootElement,
						inner: rootElement
					};
				},
				setRounding: function (element, radius) {
					$N.gui.GUIObject.abstractedMethods.changeStyle(element, "borderRadius", radius);
				}
			}
		}[$N.gui.GUIObject.mode];

		function Container(docRef, parent) {
			Container.superConstructor.call(this, docRef);

			var elements = domAbstraction.createElements(this._docRef);

			this._rootElement = elements.root;
			this._innerElement = elements.inner;
			this._rounding = 0;
			this.unHighLight();

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(Container, $N.gui.AbstractComponent);

		var proto = Container.prototype;

		/**
		 * Sets the rounding value to be used to draw the rectangle
		 * the higher the value the more rounding will be applied to the corners
		 * @method setRounding
		 * @param rounding {Number}
		 * @chainable
		 */
		proto.setRounding = function (rounding) {
			this._rounding = rounding;
			domAbstraction.setRounding(this._innerElement, (String(this._rounding) + "px"));
			return this;
		};

		/**
		 * Returns the rounding value of the components bounding rectangle
		 * @method getRounding
		 * @return {Number}
		 */
		proto.getRounding = function () {
			return this._rounding;
		};

		/**
		 * Applies the highlight CCS style or CSS Class, class takes
		 * priority over style
		 * @method highLight
		 */
		proto.highLight = function () {
			if (this.getCssHighlightClass()) {
				this._innerElement.setAttribute("class", this.getCssHighlightClass());
			} else if (this.getCssHighlightStyle()) {
				this.setCssStyle(this.getCssHighlightStyle(), true);
			}
		};

		/**
		 * Applies the normal CCS style or CSS Class, class takes
		 * priority over style
		 * @method unHighLight
		 */
		proto.unHighLight = function () {
			if (this.getCssClass()) {
				this._innerElement.setAttribute("class", this.getCssClass());
			} else if (this.getCssStyle()) {
				this.setCssStyle(this.getCssStyle(), true);
			}
		};

		/**
		 * Returns the class name of this component
		 * @method getClassName
		 * @return {string}
		 */
		proto.getClassName = function () {
			return ("Container");
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.Container = Container;
		return Container;
    }
);