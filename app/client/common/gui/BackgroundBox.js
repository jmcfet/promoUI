/**
 * BackgroundBox is a general purpose rectangle.
 *
 * @class $N.gui.BackgroundBox
 * @constructor
 * @extends $N.gui.AbstractComponent
 * @param {Object} docRef (DOM document)
 */

(function ($N) {

	var domAbstraction = {
			SVG: {
				createElements: function (docRef) {
					var inner = docRef.createElement("rect");
					return {
						root: inner,
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
					rootElement.style.padding = "0px";
					rootElement.style.position = "absolute";
					//rootElement.style.overflow = "hidden";
					rootElement.style.overflow = "visible";
					return {
						root: rootElement,
						inner: rootElement
					};
				},
				setRounding: function (element, radius) {
					$N.gui.GUIObject.abstractedMethods.changeStyle(element, "border-radius", radius);
				}
			}
		}[$N.gui.GUIObject.mode];

	function BackgroundBox(docRef, parent) {

		BackgroundBox.superConstructor.call(this, docRef);

		var elements = domAbstraction.createElements(this._docRef);

		this._rootSVGRef = elements.root;
		this._innerSVG = elements.inner;
		this._rounding = 0;
		this.unHighLight();

		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(BackgroundBox, $N.gui.AbstractComponent);

	/**
	 * Sets the rounding value to be used to draw the rectangle
	 * ry maps directly to the ry SVG attribute
	 * @method setRounding
	 * @param rounding {float}
	 */
	BackgroundBox.prototype.setRounding = function (rounding) {
		this._rounding = rounding;
		domAbstraction.setRounding(this._innerSVG, (String(this._rounding) + "px"));
	};

	/**
	 * Returns the rounding value of the components bounding rectangle
	 * @method getRounding
	 * @return {float}
	 */
	BackgroundBox.prototype.getRounding = function () {
		return this._rounding;
	};

	/**
	 * Applies the highlight CCS style or CSS Class, class takes
	 * priority over style
	 * @method highLight
	 */
	BackgroundBox.prototype.highLight = function () {
		if (this.getCssHighlightClass()) {
			this._innerSVG.setAttribute("class", this.getCssHighlightClass());
		} else if (this.getCssHighlightStyle()) {
			this._innerSVG.setAttribute("style", this.getCssHighlightStyle());
		}
	};

	/**
	 * Applies the normal CCS style or CSS Class, class takes
	 * priority over style
	 * @method unHighLight
	 */
	BackgroundBox.prototype.unHighLight = function () {
		if (this.getCssClass()) {
			this._innerSVG.setAttribute("class", this.getCssClass());
		} else if (this.getCssStyle()) {
			this._innerSVG.setAttribute("style", this.getCssStyle());
		}
	};

	/**
	 * Returns the class name of this component
	 * @method getClassName
	 * @return {string}
	 */
	BackgroundBox.prototype.getClassName = function () {
		return ("BackgroundBox");
	};

	$N.gui = $N.gui || {};
	$N.gui.BackgroundBox = BackgroundBox;
}($N || {}));