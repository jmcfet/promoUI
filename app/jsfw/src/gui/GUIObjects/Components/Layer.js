/**
 * Layer is an implementation of AbstractComponent
 *
 * Creates a hardware accelerated container for wrapping other GUI components and controls.
 * Layer can be used as a direct replacement for a container within environments which support
 * hardware acceleration.
 *
 * Example markup:
 *
 *     <nagra:layer id="myLayer" x="10" y="10" width="200" height="200">
 *         <!-- other components /-->
 *     </nagra:layer>
 *
 * @class $N.gui.Layer
 * @extends $N.gui.AbstractComponent
 * @requires $N.gui.Util
 * @requires $N.gui.GUIObject
 * @requires $N.gui.AbstractComponent
 * @constructor
 * @param {Object} docRef DOM object
 * @param {Object} parent GUIObject
 */
define('jsfw/gui/GUIObjects/Components/Layer',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/AbstractComponent',
    'jsfw/gui/helpers/Util'
    ],
    function (GUIObject, AbstractComponent, Util) {

		var Layer;

		if ($N.gui.GUIObject.mode === "HTML") {
			Layer = $N.gui.ClippedGroup;
		} else {
			Layer = function (docRef, parent) {

				Layer.superConstructor.call(this, docRef);
				this._rootElement = this._docRef.createElementNS("http://www.ekioh.com/2007/ekioh", "layer");
				this._rootElement.setAttributeNS("http://www.ekioh.com/2007/ekioh", "layerType", "hardware");
				this._innerElement = this._rootElement;

				if (parent) {
					parent.addChild(this);
				}
			};

			$N.gui.Util.extend(Layer, $N.gui.AbstractComponent);

			Layer.prototype.setX = function (ix) {
				this._trueX = parseInt(ix, 10);
				this._x = Math.round(this._trueX * this.resolutionHorizontalFactor);
				this._rootElement.setAttribute("x", this._x);
			};

			Layer.prototype.setY = function (iy) {
				this._trueY = parseInt(iy, 10);
				this._y = Math.round(this._trueY * this.resolutionVerticalFactor);
				this._rootElement.setAttribute("y", this._y);
			};

			Layer.prototype.getClassName = function () {
				return ("Layer");
			};
		}

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.Layer = Layer;
		return Layer;
    }
);