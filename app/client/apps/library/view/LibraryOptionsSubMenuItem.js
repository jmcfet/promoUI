/**
 * LibraryOptionsSubMenuItem is a listItem-type GUI object
 * It is simple, containing just a title and basic highlight behaviour
 * @class $N.gui.LibraryOptionsSubMenuItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	var LibraryOptionsSubMenuItem = function (docRef, parent) {
		LibraryOptionsSubMenuItem.superConstructor.call(this, docRef);

		this.isFocused = true;
		this.isHighlighted = false;

		this._container = new $N.gui.ListItem(docRef);
		this._background = new $N.gui.Container(docRef, this._container);

		this._highlight = new $N.gui.Container(docRef, this._container);
		this._title = new $N.gui.Label(docRef, this._container);
		this._icon = new $N.gui.Image(docRef, this._container);

		this._channelNumber = new $N.gui.Label(docRef, this._container);
		this._cursor = new $N.gui.Label(docRef, this._container);
		this._originalChannelNumber = null;

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
			y: 7,
			width: this._width - (this.PADDING * 2),
			cssClass: "dialogSubtitle"
		});
		this._highlight.configure({
			width: this._width,
			height: this._height,
			cssClass: "channelListItemHighlight",
			visible: false
		});
		this._icon.configure({
			x: 14,
			y: 18,
			width: 25,
			height: 25,
			href: "../../../customise/resources/images/%RES/icons/tick_17x17.png",
			visible: false
		});
		this._channelNumber.configure({
			x: this.PADDING,
			y: 7.5,
			width: this._width - (this.PADDING * 2),
			cssClass: "ellipsis normal"
		});

		this._cursor.configure({
			x: 24,
			y: 60,
			width: 120,
			height: 52.5,
			cssClass: "textUbuntuMedium directChannelEntryFeedback"
		});
		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(LibraryOptionsSubMenuItem, $N.gui.AbstractListItem);

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	LibraryOptionsSubMenuItem.prototype.setWidth = function (width) {
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
	LibraryOptionsSubMenuItem.prototype.setHeight = function (height) {
		this._height = height;
		this._container.setHeight(height);
		this._background.setHeight(height);
		this._highlight.setHeight(height);
	};

	/**
	 * @method updateHighlight
	 */
	LibraryOptionsSubMenuItem.prototype.updateHighlight = function () {
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
	LibraryOptionsSubMenuItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighlight
	 */
	LibraryOptionsSubMenuItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method focus
	 */
	LibraryOptionsSubMenuItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	LibraryOptionsSubMenuItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	LibraryOptionsSubMenuItem.prototype.update = function (data) {
		if (data) {
			var href = this._dataMapper.getIcon(data) || this._icon.getHref(),

				selected = this._dataMapper.getSelected(data),
				channelNumber = this._dataMapper.getChannelNumber(data);

			if (channelNumber) {
				this._originalChannelNumber = channelNumber;
				this._channelNumber.setText(channelNumber);
				this._channelNumber.setVisible(true);
				this._title.setX(this.PADDING + 80);
			} else {
				this._channelNumber.setVisible(false);
				if (this._secIcon) {
					this._title.setX(this.PADDING + 62);
				} else {
					this._title.setX(this.PADDING);
				}
			}
			this._title.setText(this._dataMapper.getTitle(data));

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
	LibraryOptionsSubMenuItem.prototype.showIcon = function () {
		if (this._icon.getHref()) {
			this._icon.show();
		}
	};

	/**
	 * @method hideIcon
	 */
	LibraryOptionsSubMenuItem.prototype.hideIcon = function () {
		this._icon.hide();
	};

	/**
	 * @method toggleIconVisibility
	 */
	LibraryOptionsSubMenuItem.prototype.toggleIconVisibility = function () {
		if (this._icon.isVisible()) {
			this._icon.hide();
		} else {
			this._icon.show();
		}
	};
	/**
	 * @method getOriginalChannelNumber
	 */
	LibraryOptionsSubMenuItem.prototype.getOriginalChannelNumber = function () {
		return this._originalChannelNumber;
	};

	/**
	 * @method updateForChannelEntry
	 */
	LibraryOptionsSubMenuItem.prototype.updateForChannelEntry = function () {
		this._channelNumber.setCssClass("textUbuntuMedium directChannelEntryFeedback");
	};

	/**
	 * @method updateForChannelEntryOver
	 */
	LibraryOptionsSubMenuItem.prototype.updateForChannelEntryOver = function () {
		this._channelNumber.setCssClass("ellipsis normal");
	};

	/**
	 * @method setServiceNumber
	 */
	LibraryOptionsSubMenuItem.prototype.setServiceNumber = function (channelNumber) {
		this._channelNumber.setText(channelNumber);
	};
	$N.gui.LibraryOptionsSubMenuItem = LibraryOptionsSubMenuItem;
}(window.parent.$N || {}));
