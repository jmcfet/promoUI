/**
 * MaskIcon deals with showing showing an Icon and allows you to recolorise it.
 * You can also specify a colour while hightlighted
 *
 * @author nwilliam
 * @class $N.gui.MaskIcon
 * @constructor
 * @extends $N.gui.GUIObject
 * @requires $N.apps.core.Log
 * @requires $N.gui.Container
 * @param {Object} docRef DOM document
 * @param {Object} [parent]
 */
(function ($N) {

	function MaskIcon(docRef, parent) {
		MaskIcon.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "MaskIcon");

		this._container = new $N.gui.Container(this._docRef);
		this._rootElement = this._container._rootElement;
		this._color = null;
		this._highLightColor = null;
		this._cssClass = null;
		this._highLightCssClass = null;

		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(MaskIcon, $N.gui.GUIObject);
	var proto = MaskIcon.prototype;

	/**
	 * Sets the image color
	 * @method _setIconColor
	 * @param {String} color
	 * @private
	 */
	proto._setIconColor = function (color) {
		this._rootElement.style["background-color"] = color;
	};

	/**
	 * Sets the image to display
	 * @method setHref
	 * @param {String} href
	 */
	proto.setHref = function (href) {
		this._rootElement.style["-webkit-mask-box-image"] = "url(" + href + ")";
	};

	/**
	 * Sets the color
	 * @method setColor
	 * @param {String} color
	 */
	proto.setColor = function (color) {
		this._color = color;
		this._setIconColor(color);
	};

	/**
	 * Sets the color when hightlighted.
	 * @method setHighlightColor
	 * @param {String} color
	 */
	proto.setHighlightColor = function (color) {
		this._highLightColor = color;
	};

	/**
	 * Sets the cssClass
	 * @method setCssClass
	 * @param {String} cssClass
	 */
	proto.setCssClass = function (cssClass) {
		this._cssClass = cssClass;
		this._container.setCssClass(cssClass);
	};

	/**
	 * Sets the cssClass when hightlighted.
	 * @method setCssHighlightClass
	 * @param {String} cssClass
	 */
	proto.setCssHighlightClass = function (cssClass) {
		this._cssHighlightClass = cssClass;
	};

	/**
	 * Sets the X position of the record icon.
	 * @method setX
	 * @param {Number} xCoordinate
	 */
	proto.setX = function (xCoordinate) {
		this._container.setX(xCoordinate);
	};

	/**
	 * Sets the Y position of the record icon.
	 * @method setY
	 * @param {Number} yCoordinate
	 */
	proto.setY = function (yCoordinate) {
		this._container.setY(yCoordinate);
	};

	/**
	 * Sets the width of the MaskIcon.
	 * @method setWidth
	 * @param {Number} width
	 */
	proto.setWidth = function (width) {
		this._container.setWidth(width);
	};

	/**
	 * Sets the height of the MaskIcon.
	 * @method setHeight
	 * @param {Number} height
	 */
	proto.setHeight = function (height) {
		this._container.setHeight(height);
	};

	/**
	 * Applies the highlight CCS style or CSS Class, class takes
	 * priority over style
	 * @method highLight
	 */
	proto.highLight = function () {
		if (this._cssHighlightClass) {
			this._container.setCssClass(this._cssHighlightClass);
		}
		if (this._highLightColor) {
			this._setIconColor(this._highLightColor);
		}
	};

	/**
	 * Applies the normal CCS style or CSS Class, class takes
	 * priority over style
	 * @method unHighLight
	 */
	proto.unHighLight = function () {
		if (this._cssClass) {
			this._container.setCssClass(this._cssClass);
		}
		if (this._color) {
			this._setIconColor(this._color);
		}
	};

	$N.gui = $N.gui || {};
	$N.gui.MaskIcon = MaskIcon;
}($N || {}));