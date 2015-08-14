/**
 * @class $N.gui.PageableMosaic
 * @constructor
 * @extends $N.gui.PagingMosaicMenu
 * @requires $N.gui.Util
 * @param {Object} docRef
 * @param {Object} [parent]
 */
(function ($N) {
	var PageableMosaic = function (docRef, parent) {
		PageableMosaic.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "PageableMosaic");

		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(PageableMosaic, $N.gui.PagingMosaicMenu);

	/**
	 * @method setListPagedCallback
	 * @param {Function} callback
	 */
	PageableMosaic.prototype.setListPagedCallback = function (callback) {
		this._listPagedCallback = callback;
	};

	/**
	 * @method getRowsPerPage
	 */
	PageableMosaic.prototype.getRowsPerPage = function () {
		return this._rows;
	};

	/**
	 * @method getColumnsPerPage
	 */
	PageableMosaic.prototype.getColumnsPerPage = function () {
		return this._columns;
	};

	/**
	 * @method isSelectedItemAtFirstColumn
	 * @return {Boolean} true if so; false otherwise
	 */
	PageableMosaic.prototype.isSelectedItemAtFirstColumn = function () {
		return this._items.isSelectedItemAtFirstColumn() || (this._columns === 1);
	};

	/**
	 * @method selectPrevious
	 */
	PageableMosaic.prototype.selectPrevious = function () {
		if (!this.isSelectedItemAtFirstColumn()) {
			this.selectItemAtPosition(this.getSelectedRowIndex(), this.getSelectedColumnIndex() - 1);
			return true;
		}
		return false;
	};

	/**
	 * @method selectNext
	 */
	PageableMosaic.prototype.selectNext = function () {
		if (!this.isSelectedItemAtLastColumn()) {
			this.selectItemAtPosition(this.getSelectedRowIndex(), this.getSelectedColumnIndex() + 1);
			return true;
		}
		return false;
	};

	/**
	 * @method pageUp
	 */
	PageableMosaic.prototype.pageUp = function () {
		if (!this.isAtFirstPage()) {
			this.selectItemAtPosition(this.getSelectedRowIndex(), this.getSelectedColumnIndex(), this.getCurrentPageNumber() - 1);
			return true;
		}
		return false;
	};

	/**
	 * @method pageDown
	 */
	PageableMosaic.prototype.pageDown = function () {
		var itemNumInNextPage,
			focusItemIndex;
		if (!this.isAtLastPage()) {
			itemNumInNextPage = this._data.getSize() - this.getCurrentPageNumber() * this.getItemsPerPage();
			focusItemIndex = this.getSelectedRowIndex() * this.getSelectedColumnIndex();
			if (itemNumInNextPage < focusItemIndex) {
				this.selectItemAtPosition(1, 1, this.getCurrentPageNumber() + 1);
			} else {
				this.selectItemAtPosition(this.getSelectedRowIndex(), this.getSelectedColumnIndex(), this.getCurrentPageNumber() + 1);
			}
			return true;
		}
		return false;
	};

	/**
	 * @method selectAbove
	 */
	PageableMosaic.prototype.selectAbove = function () {
		if (this.isSelectedItemAtFirstRow()) {
			if (!this.isAtFirstPage()) {
				this.moveToPreviousPage(this._rows, this.getSelectedColumnIndex());
				return true;
			}
		} else {
			this.selectItemAtPosition(this.getSelectedRowIndex() - 1, this.getSelectedColumnIndex());
			return true;
		}
		return false;
	};

	/**
	 * @method selectBelow
	 */
	PageableMosaic.prototype.selectBelow = function () {
		if (this.isSelectedItemAtLastRow()) {
			if (!this.isAtLastPage()) {
				this.moveToNextPage(1, this.getLastColumnIndex());
				return true;
			}
		} else {
			this.selectItemAtPosition(this.getSelectedRowIndex() + 1, this.getLastColumnIndex());
			return true;
		}
		return false;
	};

	/**
	 * returns the column index based on number of items available in last row.
	 * When the focus moves to the last row calculations are made, else it returns the selectedColumnIndex.
	 * @method getLastColumnIndex
	 * @return {integer} column index
	 */
	PageableMosaic.prototype.getLastColumnIndex = function () {
		var itemsInLastPage = null,
			itemsInLastRow = null,
			rowsInLastPage = null;

		//checks if it is the last page and the next selection is going to be the last row.
		//Calculates the number of columns in last row and number of rows in last page.
		if (this.isAtLastPage()) {
			itemsInLastPage = this._data.getSize() % this.getItemsPerPage();//returns the number of items in last page.
			rowsInLastPage = Math.ceil(itemsInLastPage / this._columns);
			//rowsInLastPage gives the number of rows in the last page
			if ((this.getSelectedRowIndex() + 1) === rowsInLastPage) {
				itemsInLastRow = itemsInLastPage % this._columns;//gives back number of items in the last row.
			}
		}
		//The following check is needed only if the control is in the last page.
		//On pressing down, the selection should not shift to any other column and hence checking made on the itemsInLastRow.
		//The selection moves only if the last row has lesser columns than previous row and the current selection is greater than the number of columns in last row.
		if (itemsInLastRow && (this.getSelectedColumnIndex() > itemsInLastRow)) {
			return itemsInLastRow;//column index if previously selected column index is greater than number of items in the last row.
		} else {
			return this.getSelectedColumnIndex();//current selected column index.
		}
	};
	/**
	 * @method selectRowByValidation
	 * @param {Function} validationFunction
	 */
	PageableMosaic.prototype.selectRowByValidation = function (validationFunction) {
		var i,
			loopLength = this._data.getSize(),
			itemData;
		for (i = 1; i <= loopLength; i++) {
			itemData = this._data.getRowAtIndex(i);
			if (itemData && validationFunction(itemData)) {
				this._data.selectRowAtIndex(i);
				this._items.selectRowAtIndex(this._data.getViewSelectedRowIndex());
				return;
			}
		}
		this._data.selectRowAtIndex(1);
		this._items.selectRowAtIndex(this._data.getViewSelectedRowIndex());
	};

	/**
	 * @method _moveSelection
	 * @private
	 */
	PageableMosaic.prototype._moveSelection = function () {
		this._items.getSelectedItem().unHighlight();
		this._items.selectRowAtIndex(this._data.getViewSelectedRowIndex());
		this._items.getSelectedItem().highlight();
		this._handleItemHighlighted(this.getSelectedItem());
	};

	/**
	 * @method initialise
	 */
	PageableMosaic.prototype.initialise = function () {
		this.setOrientation($N.gui.AbstractCustomisableList.consts.ORIENTAION_HORIZONTAL);
		PageableMosaic.superClass.initialise.call(this);
	};

	/**
	 * @method displayData
	 * @param {Boolean} (optional) preview
	 * @param {Boolean} (optional) avoidHighlight
	 */
	PageableMosaic.prototype.displayData = function (preview, avoidHighlight) {
		this._log("displayData", "Enter");
		var viewableList = this._data.returnViewableList(),
			i,
			currentItem,
			viewableListLength = viewableList.length,
			visibleRows = this._data.getVisibleRows();
		for (i = 0; i < viewableListLength; i++) {
			currentItem = this._items.getRowAtIndex(i + 1);
			currentItem.unHighlight();
			currentItem.update(viewableList[i]);
			if (!currentItem.isVisible()) {
				currentItem.show();
			}
		}
		if (viewableListLength < visibleRows) {
			for (i = viewableListLength; i < visibleRows; i++) {
				this._items.getRowAtIndex(i + 1).hide();
			}
		}
		if (preview) {
			this.defocus();
		}
		this._items.selectRowAtIndex(this._data.getViewSelectedRowIndex());
		this._items.getSelectedItem().highlight();
		if (!avoidHighlight) {
			this._handleItemHighlighted(this.getSelectedItem(), true);
		}
		this._log("displayData", "Exit");
	};

	/**
	 * @method focus
	 */
	PageableMosaic.prototype.focus = function () {
		var i,
			loopLength = this._items.getSize(),
			currentItem;
		for (i = 1; i <= loopLength; i++) {
			currentItem = this._items.getRowAtIndex(i);
			currentItem.focus();
		}
	};

	/**
	 * @method defocus
	 */
	PageableMosaic.prototype.defocus = function () {
		var i,
			loopLength = this._items.getSize(),
			currentItem;
		for (i = 1; i <= loopLength; i++) {
			currentItem = this._items.getRowAtIndex(i);
			currentItem.defocus();
		}
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	PageableMosaic.prototype.keyHandler = function (key) {
		var handled = PageableMosaic.superClass.keyHandler.call(this, key),
			keys = $N.apps.core.KeyInterceptor.getKeyMap();
		if (!handled) {
			switch (key) {
			case this._previousKeyRelease:
			case this._nextKeyRelease:
			case keys.KEY_DOWN + this._KEY_RELEASE_SUFFIX:
			case keys.KEY_UP + this._KEY_RELEASE_SUFFIX:
				if (this._itemHighlightedCallback) {
					this._itemHighlightedCallback(this._data.getSelectedItem());
				}
				handled = true;
				break;
			case keys.KEY_CHAN_UP:
				handled = this.pageUp();
				break;
			case keys.KEY_CHAN_DOWN:
				handled = this.pageDown();
				break;
			}
		}
		return handled;
	};
	$N.gui = $N.gui || {};
	$N.gui.PageableMosaic = PageableMosaic;
}($N || {}));
