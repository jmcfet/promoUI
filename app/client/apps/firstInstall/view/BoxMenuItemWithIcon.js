/**
 * BoxMenuItemWithIcon is a listItem-type GUI object
 * It contains a title and subtitle
 * It has support for defocussed highlight
 *
 * @class BoxMenuItemWithIcon
 * @extends AbstractListItem
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var BoxMenuItemWithIcon = function (docRef, parent) {
		BoxMenuItemWithIcon.superConstructor.call(this, docRef);

		this.isFocused = true;
		this.isHighlighted = false;

		this._container = new $N.gui.ListItem(docRef);
		this._background = new $N.gui.Container(docRef, this._container);
		this._title = new $N.gui.Label(docRef, this._container);
		this._highlight = new $N.gui.Container(docRef, this._container);
		this._icon = new $N.gui.Image(this._docRef, this._container);

		this._width = 660;
		this._height = 50;
		this.PADDING = 22.5;

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
			x: 63,
			y: 0,
			width: this._width - this.PADDING - 63,
			cssClass: "medium normal ellipsis"
		});
		this._highlight.configure({
			width: this._width,
			height: this._height,
			cssClass: "menuItemHighlight",
			visible: false
		});
		this._icon.configure({
			x: 24,
			y: 12,
			width: 25,
			height: 25,
			href: "../../../customise/resources/images/%RES/icons/tick_17x17.png",
			visible: true
		});
		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(BoxMenuItemWithIcon, $N.gui.AbstractListItem);

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	BoxMenuItemWithIcon.prototype.setWidth = function (width) {
		this._width = width;
		this._container.setWidth(width);
		this._background.setWidth(width);
		this._highlight.setWidth(width);
		this._highlight.setWidth(width);
		this._title.setWidth(width - this.PADDING - 63);
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	BoxMenuItemWithIcon.prototype.setHeight = function (height) {
		this._height = height;
		this._container.setHeight(height);
		this._background.setHeight(height);
		this._highlight.setHeight(height);
	};

	/**
	 * @method updateHighlight
	 */
	BoxMenuItemWithIcon.prototype.updateHighlight = function () {
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
	BoxMenuItemWithIcon.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighlight
	 */
	BoxMenuItemWithIcon.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method focus
	 */
	BoxMenuItemWithIcon.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	BoxMenuItemWithIcon.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	BoxMenuItemWithIcon.prototype.update = function (data) {
		if (data) {
			this._title.setText(this._dataMapper.getTitle(data));
			var href = this._dataMapper.getIcon(data) || this._icon.getHref(),
				selected = this._dataMapper.getSelected(data);
			if (href) {
				this._icon.setHref(href);
				this._icon.setVisible(selected);
			} else {
				this._icon.hide();
			}
		}
	};

	/**
	 * @method showIcon
	 */
	BoxMenuItemWithIcon.prototype.showIcon = function () {
		if (this._icon.getHref()) {
			this._icon.show();
		}
	};

	/**
	 * @method hideIcon
	 */
	BoxMenuItemWithIcon.prototype.hideIcon = function () {
		this._icon.hide();
	};

	/**
	 * @method toggleIconVisibility
	 */
	BoxMenuItemWithIcon.prototype.toggleIconVisibility = function () {
		if (this._icon.isVisible()) {
			this._icon.hide();
		} else {
			this._icon.show();
		}
	};

	$N.gui.BoxMenuItemWithIcon = BoxMenuItemWithIcon;
}($N || {}));