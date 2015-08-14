/**
 * SettingsSystemMenuItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a text and a sub text and
 * a container to show line for each item in settings system view
 *
 * @class $N.gui.SettingsSystemMenuItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 *
 * @requires $N.gui.ListItem
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 *
 * @param {Object} docRef (DOM document)
 */
(function ($N) {
	function SettingsSystemMenuItem(docRef) {

		SettingsSystemMenuItem.superConstructor.call(this, docRef);

		this._container = new $N.gui.ListItem(this._docRef);
		this._container.configure({
			width: 1350
		});

		this._title = new $N.gui.Label(this._docRef, this._container);
		this._title.configure({
			x: 39,
			y: -3,
			width: 500,
			cssClass: "fullViewLeftSubtitle"
		});

		this._subTitle = new $N.gui.Label(this._docRef, this._container);
		this._subTitle.configure({
			x: 664.5,
			y: -3,
			width: 625,
			cssClass: "fullViewRightSubtitle"
		});

		this.setDataMapper({
			getText: function (obj) {
				return obj.name;
			}
		});

		this.isFocused = true;
		this.isHighlighted = false;

		this._rootSVGRef = this._container.getRootSVGRef();

		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(SettingsSystemMenuItem, $N.gui.AbstractListItem);

	/**
	 * @method setWidth
	 * @param {Object} width
	 * @return {Object} A reference to SettingsSystemMenuItem (this).
	 */
	SettingsSystemMenuItem.prototype.setWidth = function (width) {
		this._width = width;
		return this;
	};

	/**
	 * @method setHeight
	 * @param {Object} height
	 * @return {Object} A reference to SettingsSystemMenuItem (this).
	 */
	SettingsSystemMenuItem.prototype.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * @method highlight
	 */
	SettingsSystemMenuItem.prototype.highlight = function () {

	};

	/**
	 * @method unHighlight
	 */
	SettingsSystemMenuItem.prototype.unHighlight = function () {

	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	SettingsSystemMenuItem.prototype.update = function (data) {
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
	SettingsSystemMenuItem.prototype.setTitleXPosition = function (xPosition) {
		this._title.setX(xPosition);
	};

	/**
	 * Sets the y coordinate of the title text label.
	 * @method setTitleYPosition
	 * @param {String} yPosition The Y coordinate of the title text label.
	 */
	SettingsSystemMenuItem.prototype.setTitleYPosition = function (yPosition) {
		this._title.setY(yPosition);
	};

	/**
	 * Sets the width of the title text label.
	 * @method setTitleWidth
	 * @param {String} width The width to be set on the title text label.
	 */
	SettingsSystemMenuItem.prototype.setTitleWidth = function (width) {
		this._title.setWidth(width);
	};

	/**
	 * @method focus
	 */
	SettingsSystemMenuItem.prototype.focus = function () {
		this.isFocused = true;
	};

	/**
	 * @method defocus
	 */
	SettingsSystemMenuItem.prototype.defocus = function () {
		this.isFocused = false;
	};
	$N.gui = $N.gui || {};
	$N.gui.SettingsSystemMenuItem = SettingsSystemMenuItem;
}($N || {}));
