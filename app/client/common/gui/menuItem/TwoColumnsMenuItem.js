/**
 * TwoColumnsMenuItem is a listItem-type GUI object
 * It contains 2 labels positioned in a 2 columns fashion
 *
 * @class TwoColumnsMenuItem
 * @extends AbstractListItem
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = $N || {};
(function ($N) {
	var TwoColumnsMenuItem = function (docRef, parent) {
		TwoColumnsMenuItem.superConstructor.call(this, docRef);

		this.isFocused = true;
		this.isHighlighted = false;

		this._container = new $N.gui.Group(docRef);
		this._background = new $N.gui.Container(docRef, this._container);
		this._title1 = new $N.gui.Label(docRef, this._container);
		this._title2 = new $N.gui.Label(docRef, this._container);
		this._highlight = new $N.gui.Container(docRef, this._container);

		this._width = 1345.5;
		this._height = 72;
		this.PADDING = 27;
		this._COLUMN_2_X = 622.4;

		this._container.configure({
			width: this._width,
			height: this._height
		});
		this._background.configure({
			width: this._width,
			height: this._height,
			cssClass: "menuItemBackgroundFocus",
			visible: false
		});
		this._title1.configure({
			x: this.PADDING,
			y: 50,
			width: this._COLUMN_2_X - this.PADDING,
			cssClass: "ellipsis normal"
		});
		this._title2.configure({
			x: this._COLUMN_2_X,
			y: 50,
			width: this._width - this._COLUMN_2_X,
			cssClass: "ellipsis normal bold"
		});
		this._highlight.configure({
			width: this._width,
			height: this._height,
			cssClass: "menuItemHighlight",
			rounding: 1,
			visible: false
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(TwoColumnsMenuItem, $N.gui.AbstractListItem);

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	TwoColumnsMenuItem.prototype.setWidth = function (width) {
		this._width = width;
		this._container.setWidth(width);
		this._background.setWidth(width);
		this._highlight.setWidth(width);
		this._title2.setWidth(this._width - this._COLUMN_2_X);
	};

	/**
	 * @method setColumn2X
	 * @param {Number} value
	 */
	TwoColumnsMenuItem.prototype.setColumn2X = function (value) {
		this._COLUMN_2_X = value;
		this._title1.setWidth(this._COLUMN_2_X - this.PADDING);
		this._title2.setWidth(this._width - this._COLUMN_2_X);
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	TwoColumnsMenuItem.prototype.setHeight = function (height) {
		this._height = height;
		this._container.setHeight(height);
		this._background.setHeight(height);
		this._highlight.setHeight(height);
	};

	/**
	 * @method updateHighlight
	 */
	TwoColumnsMenuItem.prototype.updateHighlight = function () {
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
	TwoColumnsMenuItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighlight
	 */
	TwoColumnsMenuItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method focus
	 */
	TwoColumnsMenuItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	TwoColumnsMenuItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	TwoColumnsMenuItem.prototype.update = function (data) {
		this._title1.setText(this._dataMapper.getKey(data));
		this._title2.setText(this._dataMapper.getValue(data));
	};

	$N.gui.TwoColumnsMenuItem = TwoColumnsMenuItem;
}($N || {}));