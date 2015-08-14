/**
 * ButtonGroupItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing just a text label.
 *
 * @class $N.gui.ButtonGroupItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 *
 * @param {Object} docRef DOM document
 */

(function ($N) {

	function ButtonGroupItem(docRef) {
		ButtonGroupItem.superConstructor.call(this, docRef);
		this._container = new $N.gui.ListItem(this._docRef);
		this._icon = new $N.gui.Image(this._docRef, this._container);
		this._title = new $N.gui.Label(this._docRef, this._container);
		this._cursor = new $N.gui.Label(docRef, this._container);
		this._directChannelEntry = null;
		this._container.configure({
			cssClass: "flexContainerRow optionsMenuItem buttonGroupItemContainer",
			cssHighlightClass: "flexContainerRow optionsMenuItem optionsMenuItemHighlighted",
			opacity: 1
		});
		this._originalValue = null;

		this._title.configure({
			cssClass: "dialogButtonText buttonGroupItems"
		});

		this._cursor.configure({
			cssClass: 'popupDirectTextEntryCursor buttonGroupItems'
		});

		this.setDataMapper({
			getTitle: function (obj) {
				return obj.title;
			}
		});

		this._rootSVGRef = this._container.getRootSVGRef();
	}

	$N.gui.Util.extend(ButtonGroupItem, $N.gui.AbstractListItem);


	/**
	 * If a parameter is set in the parent object selectable: false the element will not be selectable
	 * If no parameter is set the element will be selectable as default
	 * @method _isSelectable
	 * @param {Object} data
	 * @return {Boolean}
	 */
	ButtonGroupItem.prototype._isSelectable = function (data) {
		if (data && !$N.app.StringUtil.isNullOrUndefined(data.selectable)) {
			return data.selectable;
		}
		return true;
	};

	/**
	 * @method _isLabel
	 * @param {Object} data
	 * @return {Boolean}
	 */
	ButtonGroupItem.prototype._isLabel = function (data) {
		return (data.type && data.type === $N.app.constants.POPUP_MULTIROW_DATA_TYPE.LABEL);
	};

	/**
	 * @method _isDirectTextEntry
	 * @param {Object} data
	 * @return {Boolean}
	 */
	ButtonGroupItem.prototype._isDirectTextEntry = function (data) {
		return (data.type && data.type === $N.app.constants.POPUP_MULTIROW_DATA_TYPE.DIRECT_ENTRY);
	};

	/**
	 * @method _initDirectTextEntry
	 * @param {Object} data
	 */
	ButtonGroupItem.prototype._initDirectTextEntry = function (data) {
		var directChannelEntryLength = data.maxLength || 2,
			DEFAULT_TIMEOUT = 1200,
			me = this;
		this._directChannelEntry = new $N.app.DirectChannelEntry(directChannelEntryLength, DEFAULT_TIMEOUT);
		this._directChannelEntry.allowZero(true);
		this._directChannelEntry.setChannelEnteredCallback(
			function (number) {
				//reset the value to original value if null or undefined, ie 0 or greater value is valid
				if ($N.app.StringUtil.isNullOrUndefined(number)) {
					number = this._originalValue;
				} else {
					number = $N.app.StringUtil.removeLeadingZeros(number);
					if (number === "") {
						number = 0;
					}
				}
				me._title.setText(number);
				this._originalValue = number;
				if (data.callback) {
					data.callback(number);
				}
			}
		);
	};

	/**
	 * @method highlight
	 */
	ButtonGroupItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this._container.highLight();
	};

	/**
	 * @method unHighlight
	 */
	ButtonGroupItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this._container.unHighLight();
	};

	/**
	 * @method updateHighlight
	 */

	ButtonGroupItem.prototype.updateHighlight = function () {
		if (this.isHighlighted && this.isFocused) {
			this.highlight();
		} else {
			this.unHighlight();
		}
	};

	/**
	 * @method focus
	 */

	ButtonGroupItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	ButtonGroupItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * @method styleVerticalNavigation
	 */
	ButtonGroupItem.prototype.styleVerticalNavigation = function (data) {
		var RIGHT_PADDING_OFFSET = 50;
		this._container.setWidth(this._dataMapper.getVerticalItemWidth());
		this._container.setHeight(this._dataMapper.getItemHeight());
		this._title.setX(30);
		this._title.setWidth(this._dataMapper.getVerticalItemWidth() - RIGHT_PADDING_OFFSET);
		this._title.setCssClass('dialogButtonTextLeft');
	};

	/**
	 * @method styleHorizontalNavigation
	 */
	ButtonGroupItem.prototype.styleHorizontalNavigation = function (data, textCssClass) {
		this._container.setWidth(this._dataMapper.getHorizontalItemWidth(data));
		this._container.setHeight(this._dataMapper.getItemHeight());
		if (!this._isLabel(data)) {
			this._title.setX(0);
		}
		this._title.setCssClass(textCssClass);

	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	ButtonGroupItem.prototype.update = function (data) {
		var directChannelEntryLength = data.maxLength || 2,
			DEFAULT_TIMEOUT = 1200,
			me = this,
			containerCssClass = "flexContainerRow optionsMenuItem",
			containerCssHighlightClass = "flexContainerRow optionsMenuItem optionsMenuItemHighlighted",
			textCssClass = "dialogButtonText",
			title = (data) ? this._dataMapper.getTitle(data) : "";

		if (this._isLabel(data)) {
			containerCssClass = "labelBackplate";
			containerCssHighlightClass = "labelBackplate";
			textCssClass = "dialogButtonTextLabel";
		} else {
			if (this._isDirectTextEntry(data)) {
				this._initDirectTextEntry(data);
			}
			if (!this._isSelectable(data)) {
				title = "0";
				containerCssClass = "unSelectableOptionsMenuItem";
				containerCssHighlightClass = "unSelectableOptionsMenuItem";
				textCssClass = "unSelectableDialogButtonText";
			}
		}
		this._container.configure({
			cssClass: containerCssClass,
			cssHighlightClass: containerCssHighlightClass,
			opacity: 1
		});
		if (data.xPos) {
			this._container.setX(data.xPos);
		}
		if (data.width) {
			this._container.setWidth(data.width);
		}
		if (this._dataMapper.isVertical()) {
			this.styleVerticalNavigation(data);
		} else {
			this.styleHorizontalNavigation(data, textCssClass);
		}
		if (title) {
			this._originalValue = title;
			this._title.setText(title);
		}
	};

	/**
	 * @method getWidth
	 */
	ButtonGroupItem.prototype.getWidth = function () {
		return this._container.getWidth();
	};

	/**
	 * @method setCssClass
	 * @param {String} cssClass
	 */
	ButtonGroupItem.prototype.setCssClass = function (cssClass) {
		this._container.setCssClass(cssClass);
	};

	/**
	 * @method setCssClass
	 * @param {String} cssClass
	 */
	ButtonGroupItem.prototype.setCssHighlightClass = function (cssClass) {
		this._container.setCssHighlightClass(cssClass);
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 * @return {Boolean} True if key was handled, false otherwise.
	 */
	ButtonGroupItem.prototype.keyHandler = function (key) {
		var keys = $N.apps.core.KeyInterceptor.getKeyMap();

		if (this._directChannelEntry) {
			switch (key) {
			case keys.KEY_LEFT:
			case keys.KEY_ZERO:
			case keys.KEY_ONE:
			case keys.KEY_TWO:
			case keys.KEY_THREE:
			case keys.KEY_FOUR:
			case keys.KEY_FIVE:
			case keys.KEY_SIX:
			case keys.KEY_SEVEN:
			case keys.KEY_EIGHT:
			case keys.KEY_NINE:
				return this._directChannelEntry.updateChannelDigits(key, this._title, this._cursor, true);
			}
		}
		return false;
	};

	$N.gui = $N.gui || {};
	$N.gui.ButtonGroupItem = ButtonGroupItem;

}($N || {}));
