/**
 * @class $N.gui.MusicPromotionItem
 * @constructor
 * @namespace $N.gui
 * @extends $N.gui.GUIObject
 *
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */
(function ($N) {
	function MusicPromotionItem(docRef, parent) {
		this._log = new $N.apps.core.Log("CommonGUI", "MusicPromotionItem");
		MusicPromotionItem.superConstructor.call(this, docRef);

		this._container = new $N.gui.Group(docRef);
		this.index = null;
		this._highlight = new $N.gui.Container(docRef, this._container);
		this._highlight.configure({
			x: 0,
			y: 0,
			width: 387,
			height: 175,
			cssClass: "highlightSolid",
			visible: false
		});

		this._imageBg = new $N.gui.CachedImage(this._docRef, this._container);
		this._imageIcon = new $N.gui.CachedImage(this._docRef, this._container);
		this._title = new $N.gui.Label(this._docRef, this._container);
		this.Clickhandler = null;

/*		this._imageBg._innerElement.setAttribute("preserveAspectRatio", "xMidYMid slice");
		this._imageIcon._innerElement.setAttribute("preserveAspectRatio", "xMidYMid slice");*/
		this._DEFAULT_TEXT_PADDING_LEFT = 16;
		this._imageBg.configure({
			x: 6,
			y: 6,
			width: 375,
			height: 173
		});
		this._imageIcon.configure({
			x: 16,
			y: 37,
			width: 100,
			height: 100
		});
		this._title.configure({
			x: 84,
			y: 129,
			cssClass: "musicPromotionItemTitle"
		});
		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}

		var me = this;

		this._imageBg.setLoadSuccessful(function () {
			me._imageBg.show();
		});

		this._imageBg.setLoadFailedCallback(function () {
			me._imageBg.hide();
		});

		this._imageIcon.setLoadSuccessful(function () {
			me._imageIcon.show();
		});

		this._imageIcon.setLoadFailedCallback(function () {
			me._imageIcon.hide();
		});
	}
	$N.gui.Util.extend(MusicPromotionItem, $N.gui.GUIObject);

	/**
	 * Method restores cell to its initial state.
	 * @method reset
	 */
	MusicPromotionItem.prototype.reset = function () {
		this._title.setText("");
		this._title.setWidth(this._width - this._DEFAULT_TEXT_PADDING_LEFT);
		this._highlight.configure({
			x: 0,
			y: 0,
			width: 387,
			height: 185,
			cssClass: "highlightSolid",
			visible: false
		});
	};

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	MusicPromotionItem.prototype.setWidth = function (width) {
		this._width = width;
		this._container.setWidth(width);
		this._title.setWidth(width - this._title.getX());
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	MusicPromotionItem.prototype.setHeight = function (height) {
		this._height = height;
		this._container.setHeight(height);
	};
	/**
	 * @method setHrefBg
	 * @param {String} hrefBg
	 */
	MusicPromotionItem.prototype.setClickhandler = function (hrefBg) {
	    debugger;
	    this._imageBg.setClickHandler(hrefBg);
	};

    /**
	 * @method setHrefBg
	 * @param {String} hrefBg
	 */
	MusicPromotionItem.prototype.setHrefBg = function (hrefBg) {
	    this._imageBg.setHref(hrefBg);
	};

	/**
	 * @method setHref
	 * @param {String} href
	 */
	MusicPromotionItem.prototype.setHref = function (href) {
		//this._imageIcon.setHref(href);
	};

	/**
	 * @method setText
	 * @param {String} text
	 */
	MusicPromotionItem.prototype.setText = function (text) {
		this._title.setText(text);
	};

	/**
	 * @method highlight
	 */
	MusicPromotionItem.prototype.highlight = function () {
		var me = this;
		me._highlight.setCssClass("highlightSolid");
		me._highlight.show();
	};

	/**
	 * @method unHighlight
	 */
	MusicPromotionItem.prototype.unHighlight = function () {
		this._highlight.setCssClass("portalColour");
		this._highlight.hide();
	};

	/**
	 * @method setCssClass
	 * @param {String} cssClass
	 */
	MusicPromotionItem.prototype.setCssClass = function (cssClass) {
		this._title.setCssClass(cssClass);
	};

	MusicPromotionItem.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;

		if (key === keys.KEY_OK) {
			if (!this._id) {
				return false;
			} else {
				$N.app.ContextHelper.openContext("MUSIC", {activationContext: {"id" : this._id, "activeMode": "portal"}});
			}
			handled = true;
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	$N.gui = $N.gui || {};
	$N.gui.MusicPromotionItem = MusicPromotionItem;
}(window.parent.$N || {}));
