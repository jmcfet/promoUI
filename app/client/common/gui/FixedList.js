/**
 * @class $N.gui.FixedList
 * @constructor
 * @extends $N.gui.AbstractCustomisableList
 * @requires $N.gui.Group
 * @requires $N.gui.Util
 * @param {Object} docRef Document relating the DOM
 * @param {Object} parent Optional parent GUI object to attach to
 */
(function ($N) {
	var FixedList = function (docRef, parent) {
			FixedList.superConstructor.call(this, docRef);

			this._data.setWrapAround(false);
			this._items = [];
			this._width = 1920;
			this._alignment = FixedList.consts.ALIGNMENT_LEFT;

			this._container = new $N.gui.ListGroup(this._docRef);
			this._container.setWidth(this._width);
			this._rootSVGRef = this._container.getRootSVGRef();

			this.setOrientation(FixedList.consts.ORIENTAION_VERTICAL);

			this.addCssClass("fixedList");

			if (parent) {
				parent.addChild(this);
			}
		};

	$N.gui.Util.extend(FixedList, $N.gui.AbstractCustomisableList);

	/**
	 * Overwrites the existing AbstractCustomisableList behaviour since FixedList uses _items as an array, not a 'BasicList' component
	 * @method setDataMapper
	 * @param {Object} dataMapper The data mapper to be used.
	 * @return {Object} The AbstractCustomisableList.
	 */
	FixedList.prototype.setDataMapper = function (dataMapper) {
		this._dataMapper = dataMapper;
		var itemCount = 0,
			i;

		if (this._initialised) {
			itemCount = this._items.length;
			for (i = 0; i < itemCount; i++) {
				this._items[i].setDataMapper(this._dataMapper);
			}
		}
		return this;
	};

	/**
	 * @method initialise
	 * @param {Boolean} initialiseAsActive if true the menu should start in Active mode
	 */
	FixedList.prototype.initialise = function (initialiseAsActive) {
		var itemCount,
			i;
		if (!this._itemConfig.movementPositions) {
			throw ("FixedList - initialise: No positions supplied in config");
		}
		if (!this._itemTemplate) {
			throw ("FixedList - initialise: No list item template provided");
		}
		if (typeof (this._itemConfig.movementPositions) === "string") {
			itemCount = this._itemConfig.movementPositions.split(";").length;
		} else {
			itemCount = this._itemConfig.movementPositions.length;
		}

		for (i = 0; i < itemCount; i++) {
			if (!this._items[i]) {
				this._items.push(new this._itemTemplate(this._docRef));
				this._rootSVGRef.appendChild(this._items[i].getRootSVGRef());
			}
			this._itemConfig.movementPosition = i + 1;
			this._items[i].configure(this._itemConfig);
			if (this._dataMapper) {
				this._items[i].setDataMapper(this._dataMapper);
			}
		}
		this._initialised = true;
		if (typeof (this._itemConfig.movementPositions) === "string") {
			this._nextItemDistance = (this._itemConfig.movementPositions.split(";").length - 1) / 2;
		} else {
			this._nextItemDistance = (this._itemConfig.movementPositions.length - 1) / 2;
		}
		if (initialiseAsActive) {
			this.displayData();
		}
	};

	/**
	 * @method setAlignment
	 * @param {String} alignment
	 */
	FixedList.prototype.setAlignment = function (alignment) {
		this._alignment = alignment;
	};

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	FixedList.prototype.setWidth = function (width) {
		this._width = width;
		this._container.setWidth(width);
	};

	/**
	 * @method doForAllItems
	 *
	 * @param {function} runMe The function to run on each item in the list
	 */
	FixedList.prototype.doForAllItems = function (runMe) {
		var i;
		for (i = 0; i < this._items.length; i++) {
			runMe(this._items[i]);
		}
	};

	/**
	 * @method displayData
	 */
	FixedList.prototype.displayData = function () {
		var itemsLength = this._items.length,
			data,
			i;
		for (i = 0; i < itemsLength; i++) {
			data = this._data.getRowAtIndex(i + 1);
			if (data) {
				this._items[i].update(data, this._getUpdateParameter());
				this._items[i].show();
				this._items[i].unHighlight();
				if (data === this._data.getSelectedItem()) {
					this._items[i].highlight();
				}
			} else {
				this._items[i].hide();
			}
		}
		this._handleItemHighlighted(this._data.getSelectedItem(), true);
	};

	/**
	 * @method selectPrevious
	 */
	FixedList.prototype.selectPrevious = function () {
		this._getSelectedObject().unHighlight();
		this._data.selectPrevious();
		this._getSelectedObject().highlight();
		this._selectPreviousSelectableItem();
	};
	/**
	 * @method selectNext
	 */
	FixedList.prototype.selectNext = function () {
		this._getSelectedObject().unHighlight();
		this._data.selectNext();
		this._getSelectedObject().highlight();
		this._selectNextSelectableItem();
	};


	/**
	 * @method selectNextSelectableItem
	 */
	FixedList.prototype._isSelectedItemNotSelectable = function () {
		var item = this._data.getSelectedItem();
		return (item && item.selectable !== undefined && item.selectable === false);
	};


	/**
	 * @method selectNextSelectableItem
	 */
	FixedList.prototype._selectNextSelectableItem = function () {
		var selectedItemIndex = this._data.getActualSelectedRowIndex() + 1,
			length = this._items.length;
		if (this._isSelectedItemNotSelectable()) {
			if (selectedItemIndex < length) {
				this.selectNext();
			} else if (selectedItemIndex >= length) {
				// if we are at the end of the list and the item is not selectable we go back to the previous item.
				this.selectPrevious();
			}
		}
	};

		/**
	 * @method selectPreviousSelectableItem
	 */
	FixedList.prototype._selectPreviousSelectableItem = function () {
		var selectedItemIndex = this._data.getActualSelectedRowIndex() + 1,
			length = this._items.length;
		if (this._isSelectedItemNotSelectable()) {
			if (selectedItemIndex > 2) {
				// if we are NOT at the beginning of the list move back in the list (if current element not visible)
				this.selectPrevious();
			} else if (selectedItemIndex <= 2) {
				// we have move moved to the beginning of the list, but the first element is not
				// selectable, therefore we select the first selectable element
				this.selectNext();
			}
		}
	};

	/**
	 * @method _getSelectedObject
	 * @return {Object} The currently selected _items[] object
	 */
	FixedList.prototype._getSelectedObject = function () {
		return this._items[this._data.getActualSelectedRowIndex() - 1];
	};

	/**
	 * Get current selected item index key
	 * @method getCurrentIndex
	 * @return {Integer}
	 */
	FixedList.prototype.getCurrentIndex = function () {
		return this._data.getActualSelectedRowIndex();
	};


	/**
	 * @method focus
	 */
	FixedList.prototype.focus = function () {
		var selectedItemIndex = this._data.getActualSelectedRowIndex() - 1;
		this._items[selectedItemIndex].highlight();
		this._selectNextSelectableItem();
	};

	/**
	 * @method defocus
	 */
	FixedList.prototype.defocus = function () {
		var selectedItemIndex = this._data.getActualSelectedRowIndex() - 1;
		this._items[selectedItemIndex].unHighlight();
	};

	/**
	 * Defines the logic to perform upon receiving a supplied key press.
	 * This keyHandler intentionally returns true on prev/next to stop
	 * handling being passed to any parent menu when the top/bottom of a
	 * list is reached.
	 * @method keyHandler
	 * @param {String} key The key that was pressed.
	 * @return {Boolean} True if the key press was handled, false if not.
	 */
	FixedList.prototype.keyHandler = function (key) {
		var selectedItemIndex = this._data.getActualSelectedRowIndex() - 1,
			handled = false,
			keys = $N.gui.FrameworkCore.getKeys();
		if (this._items[selectedItemIndex].keyHandler) {
			handled = this._items[selectedItemIndex].keyHandler(key);
		}
		if (!handled) {
			switch (key) {
			case this._previousKey:
				this.selectPrevious();
				handled = true;
				break;
			case this._nextKey:
				this.selectNext();
				handled = true;
				break;
			case this._previousKeyRelease:
			case this._nextKeyRelease:
				if (this._itemHighlightedCallback) {
					this._itemHighlightedCallback(this._data.getSelectedItem());
				}
				handled = true;
				break;
			case keys.KEY_RIGHT:
			case keys.KEY_OK:
				this._itemSelectedCallback(this._data.getSelectedItem());
				handled = true;
				break;
			}
		}
		return handled;
	};

	FixedList.consts = $N.gui.AbstractCustomisableList.consts;

	FixedList.consts.ALIGNMENT_LEFT = 'left';

	$N.gui = $N.gui || {};
	$N.gui.FixedList = FixedList;
}($N || {}));
