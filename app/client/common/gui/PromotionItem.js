/**
 * @class $N.gui.PromotionItem
 * @constructor
 * @extends $N.gui.GUIObject
 * @requires $N.apps.core.Log
 * @requires $N.gui.ClippedGroup
 * @requires $N.gui.CachedImage
 * @requires $N.gui.BackgroundBox
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @param {Object} docRef (DOM document)
 * @param {Object} [parent]
 */
(function ($N) {
	function PromotionItem(docRef, parent) {
		this._log = new $N.apps.core.Log("CommonGUI", "PromotionItem");
		PromotionItem.superConstructor.call(this, docRef);

		this._itemSelectedCallback = null;
		this._link = null;

		this._container = new $N.gui.ClippedGroup(docRef);
		this._backgroundGradient = new $N.gui.BackgroundBox(docRef, this._container);
		this._title = new $N.gui.Label(this._docRef, this._container);

		this._DEFAULT_GRADIENT_HEIGHT = 75;
		this._CELLPADDING_LEFT = 15;
		this._CELLPADDING_BOTTOM = 16;
		this._DEFAULT_TEXT_PADDING_LEFT = 16;

		this._backgroundGradient.configure({
			x: 0,
			height: this._DEFAULT_GRADIENT_HEIGHT,
			cssClass: "textUnderlayGradient",
			visible: false
		});
		this._title.configure({
			x: this._DEFAULT_TEXT_PADDING_LEFT,
			height: 46,
			cssClass: "promotionItemTitle"
		});

		this._container.configure({
			cssClass: "promotionalItemImage"
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
		var me = this;
	}
	$N.gui.Util.extend(PromotionItem, $N.gui.GUIObject);

	/**
	 * @method setItemSelectedCallback
	 * @param {Function} callback
	 */
	PromotionItem.prototype.setItemSelectedCallback = function (callback) {
		this._itemSelectedCallback = callback;
	};

	/**
	 * Method restores cell to its initial state.
	 * @method reset
	 */
	PromotionItem.prototype.reset = function () {
		this._link = null;
		this._backgroundGradient.hide();
		this._title.setText("");
		this._title.setWidth(this._width - this._DEFAULT_TEXT_PADDING_LEFT);
		this._title.setX(this._DEFAULT_TEXT_PADDING_LEFT);
		this._title.setY(this._height - 43);
	};

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	PromotionItem.prototype.setWidth = function (width) {
		this._width = width;
		this._container.setWidth(width);
		this._title.setWidth(this._width - this._DEFAULT_TEXT_PADDING_LEFT);
		this._backgroundGradient.setWidth(width);
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	PromotionItem.prototype.setHeight = function (height) {
		this._height = height;
		this._container.setHeight(height);
		this._title.setY(height - 43);
		this._backgroundGradient.setY(height - (this._DEFAULT_GRADIENT_HEIGHT - 1));
	};

	/**
	 * @method setHref
	 * @param {String} href
	 */
	PromotionItem.prototype.setHref = function (href) {
		this._container._innerElement.style.backgroundImage = "url('" + href + "')";
	};

	/**
	 * @method setLocalHref
	 * @param {String} localHref
	 */
	PromotionItem.prototype.setLocalHref = function (localHref) {
		var netMdsServer = $N.platform.system.Preferences.get("/network/siconfig/CustomDescriptorTags/netMdsServer", true);

		if ($N.app.Config.getConfigValue("mds.developer.mode") === "on") {
			netMdsServer = $N.app.Config.getConfigValue("mds.developer.server");
		}
		this._container._innerElement.style.backgroundImage = "url('" + netMdsServer + localHref + "')";
	};

   
	/**
	 * @method setText
	 * @param {String} text
	 */
	PromotionItem.prototype.setText = function (text) {
		this._title.setText(text);
		if (text !== "") {
			this._backgroundGradient.show();
		} else {
			this._backgroundGradient.hide();
		}
	};

	/**
	 * @method setLink
	 * @param {Object} link
	 */
	PromotionItem.prototype.setLink = function (link) {
		this._link = link;
	};

	/**
	 * @method highlight
	 */
	PromotionItem.prototype.highlight = function () {
	};

	/**
	 * @method unHighlight
	 */
	PromotionItem.prototype.unHighlight = function () {
	};

	/**
	 * @method setCssClass
	 * @param {String} cssClass
	 */
	PromotionItem.prototype.setCssClass = function (cssClass) {
		this._title.setCssClass(cssClass);
	};

	/**
	 * @method _handleOKKeyPress
	 */
	PromotionItem.prototype._handleOKKeyPress = function () {
		if (this._itemSelectedCallback) {
			this._itemSelectedCallback(this._link);
		} else if (this._link && this._link.context) {
			this._link.activationObject.isPromotionSearch = true;
			$N.app.ContextHelper.openContext(this._link.context, {activationContext: this._link.activationObject});
		}
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	PromotionItem.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;

		if (key === keys.KEY_OK) {
			this._handleOKKeyPress();
			handled = true;
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	$N.gui = $N.gui || {};
	$N.gui.PromotionItem = PromotionItem;
}($N || {}));
