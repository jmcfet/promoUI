/**
 * @class $N.gui.NowMySubscriptionsMenuItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowMySubscriptionsMenuItem = function (docRef, parent) {
		NowMySubscriptionsMenuItem.superConstructor.call(this, docRef);

		this.isFocused = true;
		this.isHighlighted = false;

		this._container = new $N.gui.ListItem(this._docRef);
		this._background = new $N.gui.Container(this._docRef, this._container);
		this._highlight = new $N.gui.Container(this._docRef, this._container);
		this._title = new $N.gui.SpanLabel(this._docRef, this._container);
		this._expiry = new $N.gui.Label(this._docRef, this._container);

		this._width = 1728;
		this._EXPIRY_BUFFER = 429;
		this._EXPIRY_WIDTH = 355.5;

		this._background.configure({
			width: this._width,
			height: 50,
			cssClass: "nowMySubscriptionsItemBackground"
		});
		this._highlight.configure({
			width: this._width,
			height: 50,
			cssClass: "nowMySubscriptionsItemHighlight",
			rounding: 1,
			visible: false
		});
		this._title.configure({
			x: 24,
			width: this._width - this._EXPIRY_BUFFER,
			cssClass: "nowMySubscriptionsItemText",
			spanCssClass: "nowMySubscriptionsSeriesText"
		});
		this._expiry.configure({
			x: this._width - this._EXPIRY_WIDTH,
			width: 331.5,
			cssClass: "nowMySubscriptionsItemText"
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowMySubscriptionsMenuItem, $N.gui.AbstractListItem);

	/**
	 * @method setWidth
	 */
	NowMySubscriptionsMenuItem.prototype.setWidth = function (width) {
		this._background.setWidth(width);
		this._highlight.setWidth(width);
		this._title.setWidth(width - this._EXPIRY_BUFFER);
		this._expiry.setX(width - this._EXPIRY_WIDTH);
		this._width = width;
	};

	/**
	 * @method updateHighlight
	 */
	NowMySubscriptionsMenuItem.prototype.updateHighlight = function () {
		if (this.isHighlighted && this.isFocused) {
			this._highlight.show();
		} else {
			this._highlight.hide();
		}
	};

	/**
	 * @method highlight
	 */
	NowMySubscriptionsMenuItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighlight
	 */
	NowMySubscriptionsMenuItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method focus
	 */
	NowMySubscriptionsMenuItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	NowMySubscriptionsMenuItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	NowMySubscriptionsMenuItem.prototype.update = function (data) {
		var	expiryText = "";
		if (data) {
			this.unHighlight();
			this._title.setText(this._dataMapper.getTitle(data));
			this._expiry.setText(expiryText);
		}
	};

	$N.gui.NowMySubscriptionsMenuItem = NowMySubscriptionsMenuItem;
}($N || {}));
