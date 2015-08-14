/**
 * ListMenuItem is a listItem-type GUI object
 * It is simple, containing just a title and basic highlight behaviour
 *
 * @class ListMenuItem
 * @extends AbstractListItem
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = $N || {};

(function ($N) {
	var ListMenuItem = function (docRef, parent) {
		ListMenuItem.superConstructor.call(this, docRef);

		this.isFocused = true;
		this.isHighlighted = false;

		this._container = new $N.gui.ListItem(docRef);
		this._background = new $N.gui.Container(docRef, this._container);
		this._title = new $N.gui.Label(docRef, this._container);
		this._highlight = new $N.gui.Container(docRef, this._container);

		this._width = 660;
		this._height = 60;
		this.PADDING = 55.5;

		this._container.configure({
			width: this._width
		});
		this._background.configure({
			width: this._width,
			height: this._height,
			cssClass: "menuItemBackgroundFocus",
			visible: false
		});
		this._title.configure({
			x: this.PADDING,
			y: 9,
			width: this._width - (this.PADDING * 2),
			cssClass: "ellipsis normal"
		});
		this._highlight.configure({
			width: this._width,
			height: this._height,
			cssClass: "menuItemHighlight",
			visible: false
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(ListMenuItem, $N.gui.AbstractListItem);

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	ListMenuItem.prototype.setWidth = function (width) {
		this._width = width;
		this._container.setWidth(width);
		this._background.setWidth(width);
		this._highlight.setWidth(width);
		this._title.setWidth(width - (this.PADDING * 2));
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	ListMenuItem.prototype.setHeight = function (height) {
		this._height = height;
		this._container.setHeight(height);
		this._background.setHeight(height);
		this._highlight.setHeight(height);
	};

	/**
	 * @method updateHighlight
	 */
	ListMenuItem.prototype.updateHighlight = function () {
		if (this.isHighlighted && this.isFocused) {
			this._background.show();
			this._highlight.show();
		} else {
			this._highlight.hide();
			this._background.hide();
		}
	};

	/**
	 * @method highlight
	 */
	ListMenuItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighlight
	 */
	ListMenuItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method focus
	 */
	ListMenuItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	ListMenuItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	ListMenuItem.prototype.update = function (data) {
		this._title.setText(this._dataMapper.getTitle(data));
	};

	/**
	 * Sets the config object for the item title.
	 * @method setTitleConfig
	 * @param {Object} config
	 */
	ListMenuItem.prototype.setTitleConfig = function (config) {
		this._title.configure(config);
	};

	$N.gui.ListMenuItem = ListMenuItem;
}($N || {}));