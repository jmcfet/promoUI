/**
 * @class $N.gui.GridRow
 * @constructor
 * @namespace $N.gui
 * @extends $N.gui.AbstractCustomisableList
 * @requires $N.gui.Group
 * @requires $N.gui.Util
 * @requires $N.gui.GridRowItem
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	var GridRow = function (docRef, parent) {
		GridRow.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "GridRow");
		this._data.setWrapAround(false);
		this.setOrientation(GridRow.consts.ORIENTAION_HORIZONTAL);
		this._itemPadding = 12;
		this._container = new $N.gui.Group(this._docRef);
		this._container.setCssClass("gridRow");
		this._items = [];
		this._dataValidationFunction = null;
		this._initialItemCount = 30;
		this._focusState = false;
		this._rootSVGRef = this._container.getRootSVGRef();
		this._gridRowItemCallBack = null;
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(GridRow, $N.gui.AbstractCustomisableList);

	/**
	 * @method getSelectedObject
	 * @return {Object} selectedObject
	 */
	GridRow.prototype.getSelectedObject = function () {
		return this._items[this.getSelectedItemIndex() - 1];
	};

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	GridRow.prototype.setWidth = function (width) {
		this._width = parseInt(width, 10);
		this._container.setWidth(this._width);
	};

	/**
	 * @method setDataValidationTest
	 * @param {Function} testFunction - A test function to ensure data integrity
	 */
	GridRow.prototype.setDataValidationFunction = function (testFunction) {
		this._dataValidationFunction = testFunction;
	};

	/**
	 * @method setGridRowItemCallback
	 * @param {Function} callback
	 */
	GridRow.prototype.setGridRowItemCallback = function (callback) {
		this._gridRowItemCallBack = callback;
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	GridRow.prototype.setHeight = function (height) {
		this._height = parseInt(height, 10);
		this._container.setHeight(this._height);
	};

	/**
	 * @method setInitialItemCount
	 * @param {Number} initialItemCount
	 */
	GridRow.prototype.setInitialItemCount = function (initialItemCount) {
		this._initialItemCount = parseInt(initialItemCount, 10);
	};

	/**
	 * @method setData
	 * @param {Object} data
	 */
	GridRow.prototype.setData = function (data) {
		this._log("setData", "Enter");
		var currentIndex = this.getSelectedItemIndex();
		GridRow.superClass.setData.call(this, data);
		this.selectItemAtIndex(currentIndex);
		this._log("setData", "Exit");
	};

	/**
	 * @method initialise
	 */
	GridRow.prototype.initialise = function () {
		this._log("initialise", "Enter");
		var i;
		if (this._initialised) {
			return;
		}
		if (!this._itemTemplate) {
			throw ("GridRow - initialise: No list item template provided");
		}

		for (i = 0; i < this._initialItemCount; i++) {
			this._items.push(new this._itemTemplate(this._docRef, this._container));
			this._items[i].configure(this._itemConfig);
			if (this._dataMapper) {
				this._items[i].setDataMapper(this._dataMapper);
			}
		}
		this._initialised = true;
		this._log("initialise", "Exit");
	};

	/**
	 * @method doForAllItems
	 * @param {function} runMe
	 */
	GridRow.prototype.doForAllItems = function (runMe) {
		var i;
		for (i = 0; i < this._items.length; i++) {
			runMe(this._items[i]);
		}
	};

	/**
	 * @method selectValidatedDataItem
	 */
	GridRow.prototype.selectValidatedDataItem = function () {
		var i,
			itemsLength = this._items.length,
			itemData;
		for (i = 1; i <= itemsLength; i++) {
			itemData = this._data.getRowAtIndex(i);
			if (itemData && this._dataValidationFunction(itemData)) {
				break;
			}
		}
		this._data.selectRowAtIndex(i);
	};

	/**
	 * @method displayData
	 * @param {Boolean} ignoreHighlight
	 */
	GridRow.prototype.displayData = function (ignoreHighlight) {
		this._log("displayData", "Enter");
		var itemsLength = this._items.length,
			itemData,
			i,
			currentItemOffset = 0,
			currentItem = null,
			selectedItem = this.getSelectedItemIndex() - 1;

		for (i = 0; i < itemsLength; i++) {
			itemData = this._data.getRowAtIndex(i + 1);

			currentItem = this._items[i];

			if (currentItem.setGridRowItemCallback && this._gridRowItemCallBack) {
				currentItem.setGridRowItemCallback(this._gridRowItemCallBack);
			}

			if (itemData) {
				currentItem.setX(currentItemOffset);
				currentItem.update(itemData);

				if (!ignoreHighlight && selectedItem === i) {
					currentItem.highlight();
				}
				currentItem.show();
				currentItemOffset = currentItemOffset + currentItem.getWidth() + this._itemPadding;
			} else {
				currentItem.hide();
			}
		}
		if (this._dataValidationFunction) {
			this.selectValidatedDataItem();
		}
		this._log("displayData", "Exit");
	};

	/**
	 * @method updateIcons
	 */
	GridRow.prototype.updateIcons = function () {
		this._log("updateIcons", "Enter");
		var me = this;
		this._items.forEach(function (item, i) {
			if (item.updateIcons && item.isVisible()) {
				item.updateIcons(me._data.getRowAtIndex(i + 1));
			}
		});
		this._log("updateIcons", "Exit");
	};

	/**
	 * @method selectPrevious
	 */
	GridRow.prototype.selectPrevious = function () {
		this._log("selectPrevious", "Enter");
		this._items[this.getSelectedItemIndex() - 1].unHighlight();
		this._data.selectPrevious();
		this._items[this.getSelectedItemIndex() - 1].highlight();
		this._handleItemHighlighted(this._data.getSelectedItem(), 'previous');
		this._log("selectPrevious", "Exit");
	};

	/**
	 * @method selectNext
	 */
	GridRow.prototype.selectNext = function () {
		this._log("selectNext", "Enter");
		this._items[this.getSelectedItemIndex() - 1].unHighlight();
		this._data.selectNext();
		this._items[this.getSelectedItemIndex() - 1].highlight();
		this._handleItemHighlighted(this._data.getSelectedItem(), 'next');
		this._log("selectNext", "Exit");
	};

	/**
	 * @method selectFirst
	 */
	GridRow.prototype.selectFirst = function () {
		this._log("selectFirst", "Enter");
		this._items[this.getSelectedItemIndex() - 1].unHighlight();
		this._data.selectFirstItem();
		this._items[this.getSelectedItemIndex() - 1].highlight();
		this._handleItemHighlighted(this._data.getSelectedItem());
		this._log("selectFirst", "Exit");
	};

	/**
	 * @method selectLast
	 */
	GridRow.prototype.selectLast = function () {
		this._log("selectLast", "Enter");
		this._items[this.getSelectedItemIndex() - 1].unHighlight();
		this._data.selectLastItem();
		this._items[this.getSelectedItemIndex() - 1].highlight();
		this._handleItemHighlighted(this._data.getSelectedItem());
		this._log("selectLast", "Exit");
	};

	/**
	 * @method selectRowAtIndex
	 */
	GridRow.prototype.selectRowAtIndex = function (index, ignoreHighlight) {
		this._log("selectRowAtIndex", "Enter");
		this._items[this.getSelectedItemIndex() - 1].unHighlight();
		this._data.selectRowAtIndex(index);
		if (!ignoreHighlight) {
			this._items[this.getSelectedItemIndex() - 1].highlight();
			this._handleItemHighlighted(this._data.getSelectedItem());
		}
		this._log("selectRowAtIndex", "Exit");
	};

	/**
	 * @method focus
	 */
	GridRow.prototype.focus = function () {
		this._log("focus", "Enter");
		this._focusState = true;
		if (this._items[this.getSelectedItemIndex() - 1]) {
			this._items[this.getSelectedItemIndex() - 1].highlight();
		}
		this._log("focus", "Exit");
	};

	/**
	 * @method defocus
	 */
	GridRow.prototype.defocus = function () {
		this._log("defocus", "Enter");
		this._focusState = false;
		if (this._items[this.getSelectedItemIndex() - 1]) {
			this._items[this.getSelectedItemIndex() - 1].unHighlight();
		}
		this._log("defocus", "Exit");
	};

	/**
	 * @method keyHandler
	 * @param {String} key The key that was pressed.
	 * @return {Boolean} handled
	 */
	GridRow.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.gui.FrameworkCore.getKeys(),
			emptyFunction = function () {},
			handled = false,
			itemSelectedIndex = this.getSelectedItemIndex() - 1;
		if (this._items[itemSelectedIndex] && this._items[itemSelectedIndex].keyHandler) {
			handled = this._items[itemSelectedIndex].keyHandler(key);
		}
		if (!handled) {
			switch (key) {
			case this._previousKey:
				if (!this.isSelectedAtFirst()) {
					GridRow._inKeyRepeat = true;
					this.selectPrevious();
					handled = true;
				}
				break;
			case this._nextKey:
				if (!this.isSelectedAtLast()) {
					GridRow._inKeyRepeat = true;
					this.selectNext();
					handled = true;
				}
				break;

			case (this._previousKey + this._KEY_RELEASE_SUFFIX):
			case (this._nextKey + this._KEY_RELEASE_SUFFIX):
			case (keys.KEY_UP + this._KEY_RELEASE_SUFFIX):
			case (keys.KEY_DOWN + this._KEY_RELEASE_SUFFIX):
				GridRow._inKeyRepeat = false;
				this._itemHighlightedCallback(this._data.getSelectedItem());
				handled = true;
				break;

			case keys.KEY_OK:
				if (this._itemSelectedCallback !== emptyFunction) {
					this._itemSelectedCallback(this._data.getSelectedItem());
					handled = true;
				}
				break;
			}
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	/**
	 * @method hasFocus
	 * @return {String}
	 */
	GridRow.prototype.hasFocus = function () {
		return this._focusState;
	};

	GridRow._inKeyRepeat = false;
	GridRow.consts = $N.gui.AbstractCustomisableList.consts;

	$N.gui = $N.gui || {};
	$N.gui.GridRow = GridRow;
}(window.parent.$N || {}));
