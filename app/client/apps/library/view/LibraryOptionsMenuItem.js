/**
 * LibraryOptionsMenuItem is a listItem-type GUI object
 * It contains a title and subtitle
 * It has support for defocussed highlight
 *
 * @class $N.gui.LibraryOptionsMenuItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	var LibraryOptionsMenuItem = function (docRef, parent) {
		LibraryOptionsMenuItem.superConstructor.call(this, docRef);

		this.isFocused = true;
		this.isHighlighted = false;

		this._container = new $N.gui.Group(docRef);
		this._background = new $N.gui.Container(docRef, this._container);
		this._title = new $N.gui.Label(docRef, this._container);
		this._subtitle = new $N.gui.Label(docRef, this._container);
		this._highlight = new $N.gui.Container(docRef, this._container);

		this._width = 660;
		this._height = 96;
		this.PADDING = 22.5;

		this._container.configure({
			width: this._width,
			height: this._height
		});
		this._background.configure({
			width: this._width,
			height: this._height,
			cssClass: "menuItemBackgroundFocus",

			rounding: 4,
			visible: false
		});
		this._title.configure({
			x: this.PADDING,
			y: 7.5,
			width: this._width - (this.PADDING * 2),
			cssClass: "ellipsis normal"
		});
		this._subtitle.configure({
			x: this.PADDING,
			y: 81,
			width: this._width - (this.PADDING * 2),
			cssClass: "ellipsis normal bold"
		});
		this._highlight.configure({
			width: this._width,
			height: this._height,
			cssClass: "menuItemHighlight",
			rounding: 4,
			visible: false
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(LibraryOptionsMenuItem, $N.gui.AbstractListItem);

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	LibraryOptionsMenuItem.prototype.setWidth = function (width) {
		this._width = width;
		this._container.setWidth(width);
		this._background.setWidth(width);
		this._highlight.setWidth(width);
		this._title.setWidth(width - (this.PADDING * 2));
		this._subtitle.setWidth(width - (this.PADDING * 2));
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	LibraryOptionsMenuItem.prototype.setHeight = function (height) {
		this._height = height;
		this._container.setHeight(height);
		this._background.setHeight(height);
		this._highlight.setHeight(height);
	};

	/**
	 * @method updateHighlight
	 */
	LibraryOptionsMenuItem.prototype.updateHighlight = function () {
		if (this.isHighlighted) {
			if (this.isFocused) {
				this._background.setCssClass("menuItemBackgroundFocus");
				this._background.show();
				this._highlight.show();
			} else {
				this._highlight.hide();
				this._background.setCssClass("menuItemBackgroundDefocus");
				this._background.show();
			}
		} else {
			this._highlight.hide();
			this._background.hide();
		}
	};

	/**
	 * @method highlight
	 */
	LibraryOptionsMenuItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighlight
	 */
	LibraryOptionsMenuItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method focus
	 */
	LibraryOptionsMenuItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	LibraryOptionsMenuItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	LibraryOptionsMenuItem.prototype.update = function (data) {
		this._title.setText(this._dataMapper.getTitle(data));
		this._subtitle.setText(this._dataMapper.getSubtitle(data));
	};

	$N.gui.LibraryOptionsMenuItem = LibraryOptionsMenuItem;
}(window.parent.$N || {}));