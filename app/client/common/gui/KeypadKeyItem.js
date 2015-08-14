/**
 * Its a GUI component that makes the individual
 * key of the keypad
 *
 * @class $N.gui.KeypadKeyItem
 * @constructor
 * @extends $N.gui.AbstractComponent
 * @requires $N.gui.Container
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @param {Object} docRef
 * @param {Object} [parent]
 */
(function ($N) {
	function KeypadKeyItem(docRef, parent) {
		this._log = new $N.apps.core.Log("CommonGUI", "KeypadKeyItem");
		KeypadKeyItem.superConstructor.call(this, docRef);

		this._container = new $N.gui.Container(docRef);
		this._container.configure({
			rounding: 2
		});
		this._highlight = new $N.gui.Container(docRef, this._container);
		this._highlight.configure({
			x: 0,
			width: 580.5,
			height: 105,
			cssClass: "keyActive",
			rounding: 4,
			visible: false
		});

		this._text = new $N.gui.Label(this._docRef, this._container);

		this._text.configure({
			x: -3,
			y : 7.5,
			cssClass : "center normal medium"
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	}
	$N.gui.Util.extend(KeypadKeyItem, $N.gui.AbstractComponent);
	var proto = KeypadKeyItem.prototype;

	proto.highlight = function (instant) {
		this._highlight.setWidth(this._container.getTrueWidth());
		this._highlight.setHeight(this._container.getTrueHeight());
		this._highlight.setX(-1);
		this._highlight.setY(-1);
		this._highlight.show();
	};

	proto.unHighlight = function () {
		this._highlight.hide();
	};

	proto.setCssClass = function (cssClass) {
		this._container.setCssClass(cssClass);
	};

	proto.setLabelCssClass = function (cssClass) {
		this._text.setCssClass(cssClass);
	};

	proto.setHighlightCssClass = function (cssClass) {
		this._highlight.setCssClass(cssClass);
	};

	proto.setHighlightOpacity = function (opacity) {
		this._highlight.setOpacity(opacity);
	};

	proto.setLabelFontSize = function (size) {
		this._text.setFontSize(size);
	};

	proto.setWidth = function (width) {
		this._container.setWidth(width);
		this._text.setWidth(width);
	};

	proto.setHeight = function (height) {
		this._container.setHeight(height);
		this._text.setHeight(height);
	};

	proto.setText = function (text) {
		this._text.setText(text);
	};

	proto.setTextY = function (y) {
		this._text.setY(y);
	};

	proto.setTextConfig = function (configObj) {
		this._text.configure(configObj);
	};

	proto.getText = function () {
		return this._text.getText();
	};

	$N.gui = $N.gui || {};
	$N.gui.KeypadKeyItem = KeypadKeyItem;
}($N || {}));