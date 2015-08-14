/**
 * @class $N.gui.PortalIconTextItem
 * @constructor
 * @namespace $N.gui
 * @extends $N.gui.GUIObject
 *
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */
(function ($N) {
	function PortalIconTextItem(docRef, parent) {
		this._log = new $N.apps.core.Log("CommonGUI", "PortalIconTextItem");
		PortalIconTextItem.superConstructor.call(this, docRef);

		this._container = new $N.gui.Group(docRef);
		this.index = null;
		this._highlight = new $N.gui.Container(docRef, this._container);
		this._highlight.configure({
			x: 0,
			y: 50,
			width: 580.5,
			height: 120,
			cssClass: "dynamicSettingsTableHighlightSolid",
			visible: false
		});
		this._image = new $N.gui.CachedImage(this._docRef, this._container);
		this._title = new $N.gui.Label(this._docRef, this._container);

		this._image._innerElement.setAttribute("preserveAspectRatio", "xMidYMid slice");

		this._DEFAULT_TEXT_PADDING_LEFT = 16;

		this._title.configure({
			height: 26,
			cssClass: "promotionItemTitle"
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}

		var me = this;

		this._image.setLoadSuccessful(function () {
			me._image.show();
		});

		this._image.setLoadFailedCallback(function () {
			me._image.hide();
		});
	}
	$N.gui.Util.extend(PortalIconTextItem, $N.gui.GUIObject);

	/**
	 * Method restores cell to its initial state.
	 * @method reset
	 */
	PortalIconTextItem.prototype.reset = function () {
		this._title.setText("");
		this._title.setWidth(this._width - this._DEFAULT_TEXT_PADDING_LEFT);
		this._title.setX(this._DEFAULT_TEXT_PADDING_LEFT);
	};

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	PortalIconTextItem.prototype.setWidth = function (width) {
		this._width = width;
		this._container.setWidth(width);
		this._title.setWidth(width);
		this._image.setWidth(75);
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	PortalIconTextItem.prototype.setHeight = function (height) {
		var HIGHTLIGHT_Y = this._highlight.getTrueY();
		this._height = height;
		this._container.setHeight(height);
		this._title.setHeight(60);
		this._image.setHeight(75);
		this._title.setY(HIGHTLIGHT_Y + 37);
		this._image.setY(HIGHTLIGHT_Y + 20);
		this._title.setX(130);
		this._image.setX(27);
	};
	/**
	 * @method setHref
	 * @param {String} href
	 */
	PortalIconTextItem.prototype.setHref = function (href) {
		this._image.setHref(href);
	};

	/**
	 * @method setText
	 * @param {String} text
	 */
	PortalIconTextItem.prototype.setText = function (text) {
		this._title.setText(text);
	};

	/**
	 * @method highlight
	 */
	PortalIconTextItem.prototype.highlight = function () {
		var me = this;
		me._highlight.setCssClass("dynamicSettingsTableHighlightSolid");
		me._highlight.show();
	};

	/**
	 * @method unHighlight
	 */
	PortalIconTextItem.prototype.unHighlight = function () {
		this._highlight.setCssClass("portalColour");
		this._highlight.hide();
	};

	/**
	 * @method setCssClass
	 * @param {String} cssClass
	 */
	PortalIconTextItem.prototype.setCssClass = function (cssClass) {
		this._title.setCssClass(cssClass);
	};

	PortalIconTextItem.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;

		if (key === keys.KEY_OK) {
			if (!this._id) {
				return false;
			} else {
				$N.app.ContextHelper.openContext("SETTINGS", {activationContext: {"id" : this._id, "isFromPortal": true}});
			}
			handled = true;
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	$N.gui = $N.gui || {};
	$N.gui.PortalIconTextItem = PortalIconTextItem;
}(window.parent.$N || {}));