/**
 * TitleSubtitleItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a text and a sub text
 *
 * @class $N.gui.TitleSubtitleItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 * @requires $N.gui.ClippedGroup
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @param {Object} docRef (DOM document)
 */
(function ($N) {
	function TitleSubtitleItem(docRef) {

		TitleSubtitleItem.superConstructor.call(this, docRef);

		this.isFocused = true;
		this.isHighlighted = false;

		this._container = new $N.gui.ClippedGroup(this._docRef);
		this._container.setWidth(800);
		this._container.setHeight(160);

		this._title = new $N.gui.Label(this._docRef, this._container);
		this._title.configure({
			x: 63,
			y: 30,
			width: 450,
			cssClass: "dialogSubtitle"
		});

		this._subTitle = new $N.gui.Label(this._docRef, this._container);
		this._subTitle.configure({
			x: 63,
			y: 75,
			width: 450,
			cssClass: "menuSubTitle"
		});

		this.setDataMapper({
			getText: function (obj) {
				return obj.name;
			}
		});

		this._rootSVGRef = this._container.getRootSVGRef();

		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(TitleSubtitleItem, $N.gui.AbstractListItem);

	/**
	 * @method setWidth
	 * @param {Object} width
	 * @return {Object} A reference to TitleSubtitleItem (this).
	 */
	TitleSubtitleItem.prototype.setWidth = function (width) {
		this._width = width;
		return this;
	};

	/**
	 * @method setHeight
	 * @param {Object} height
	 * @return {Object} A reference to TitleSubtitleItem (this).
	 */
	TitleSubtitleItem.prototype.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * @method highlight
	 */
	TitleSubtitleItem.prototype.highlight = function () {

	};

	/**
	 * @method unHighlight
	 */
	TitleSubtitleItem.prototype.unHighlight = function () {

	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	TitleSubtitleItem.prototype.update = function (data) {
		if (data) {
			this._title.setText(this._dataMapper.getTitle(data));
			this._subTitle.setText(this._dataMapper.getSubTitle(data));
		}
	};

	/**
	 * Sets the x coordinate of the title text label.
	 * @method setTitleXPosition
	 * @param {String} xPosition The X coordinate of the title text label.
	 */
	TitleSubtitleItem.prototype.setTitleXPosition = function (xPosition) {
		this._title.setX(xPosition);
	};

	/**
	 * Sets the y coordinate of the title text label.
	 * @method setTitleYPosition
	 * @param {String} yPosition The Y coordinate of the title text label.
	 */
	TitleSubtitleItem.prototype.setTitleYPosition = function (yPosition) {
		this._title.setY(yPosition);
	};

	/**
	 * Sets the width of the title text label.
	 * @method setTitleWidth
	 * @param {String} width The width to be set on the title text label.
	 */
	TitleSubtitleItem.prototype.setTitleWidth = function (width) {
		this._title.setWidth(width);
	};

	/**
	 * @method focus
	 */
	TitleSubtitleItem.prototype.focus = function () {
		this.isFocused = true;
	};

	/**
	 * @method defocus
	 */
	TitleSubtitleItem.prototype.defocus = function () {
		this.isFocused = false;
	};

	$N.gui = $N.gui || {};
	$N.gui.TitleSubtitleItem = TitleSubtitleItem;
}($N || {}));
