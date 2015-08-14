/**
 * This class is a concrete implementation of `$N.gui.AbstractCustomisableList` and allows
 * for items that are displayed in a mosaic. The mosaic can have any number of rows and columns, and is
 * capable of handling items spanning across pages.
 * @class $N.gui.PagingMosaicMenu
 * @extends $N.gui.AbstractCustomisableList
 *
 * @requires $N.gui.PagingList
 * @requires $N.gui.Mosaic
 * @requires $N.gui.Container
 * @requires $N.apps.core.Log
 * @requires $N.gui.AbstractCustomisableList
 * @requires $N.gui.Util
 * @requires $N.gui.FrameworkCore
 *
 * @constructor
 * @param {Object} docRef Document reference.
 */
define('jsfw/gui/GUIObjects/Controls/List/PagingMosaicMenu',
    [
    'jsfw/gui/Logic/List/List',
    'jsfw/gui/Logic/List/Mosaic',
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/apps/core/Log',
    'jsfw/gui/GUIObjects/Controls/List/customisable/AbstractCustomisableList',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/FrameworkCore'
    ],
    function (List, Mosaic, Container, Log, AbstractCustomisableList, Util, FrameworkCore) {

		function PagingMosaicMenu(docRef) {
			PagingMosaicMenu.superConstructor.call(this, docRef);
			this._data = new $N.gui.PagingList();
			this._items = new $N.gui.Mosaic();
			this._container = new $N.gui.Container(docRef);
			this._rootElement = this._container.getRootElement();
			this._hspace = 20;
			this._vspace = 10;
			this._tileHeight = 130; // default tile height
			this._tileWidth = 200; // default tile width
			this._rows = 3; // default number of rows
			this._columns = 3; // default number of columns
			this._customKeyHandler = null;
			this._listPagedCallback = function () {};
			this._log = new $N.apps.core.Log('LIST', 'PagingMosaicMenu');
		}

		$N.gui.Util.extend(PagingMosaicMenu, $N.gui.AbstractCustomisableList);

		PagingMosaicMenu.consts = $N.gui.AbstractCustomisableList.consts;

		// default height and width for the mosaic menu
		PagingMosaicMenu.SCREEN_WIDTH = 1100;
		PagingMosaicMenu.SCREEN_HEIGHT = 540;

		var proto = PagingMosaicMenu.prototype;

		/**
		 * Sets / resets the height of the mosaic grid
		 * @method setHeight
		 * @param {Number} newHeight height of the mosaic
		 */
		proto.setHeight = function (newHeight) {
			if (newHeight) {
				this._height = newHeight;
			}
			return this;
		};

		/**
		 * Sets / resets the width of the mosaic grid
		 * @method setWidth
		 * @param {Number} newWidth width of the mosaic
		 */
		proto.setWidth = function (newWidth) {
			if (newWidth) {
				this._width = newWidth;
			}
			return this;
		};

		/**
		 * Sets the space between two adjacent columns
		 * @method setHSpace
		 * @param {Number} space number (in pixels)
		 */
		proto.setHSpace = function (space) {
			this._hspace = space;
			return this;
		};

		/**
		 * Sets the space between two adjacent rows
		 * @method setVSpace
		 * @param {Number} space number (in pixels)
		 */
		proto.setVSpace = function (space) {
			this._vspace = space;
			return this;
		};

		/**
		 * Sets the number of rows to be displayed in a page
		 * @method setRows
		 * @param {Number} rows number of rows
		 */
		proto.setRows = function (rows) {
			this._rows = parseInt(rows, 10);
			return this;
		};

		/**
		 * Sets the number of columns to be displayed in a page
		 * @method setColumns
		 * @param {Number} columns number of columns
		 */
		proto.setColumns = function (columns) {
			this._columns = parseInt(columns, 10);
			return this;
		};

		/**
		 * Calculates the tile height and width, and also space between adjacent columns and rows
		 * @method _calculateTileDimensions
		 * @private
		 */
		proto._calculateTileDimensions = function () {
			var height;
			var width;
			var itemConfig = this._itemConfig;
			if (itemConfig.height !== undefined && itemConfig.height !== null) {
				this._tileHeight = itemConfig.height;
			} else {
				height = this._height / this._rows;
				if (!itemConfig.vSpace) {
					this._vspace = height / (this._rows + 1);
				}
				this._tileHeight = height - this._vspace;
			}
			if (itemConfig.width !== undefined && itemConfig.width !== null) {
				this._tileWidth = itemConfig.width;
			} else {
				width = this._width / this._columns;
				if (!itemConfig.hSpace) {
					this._hspace = width / (this._columns + 1);
				}
				this._tileWidth = width - this._hspace;
			}
		};

		/**
		 * Adds an item to the mosaic at the next available slot in the current page.
		 * Each item is expected to be derived from AbstractMosaicTile. Additionally,
		 * item configuration data and a data mapper must also be set before calling this
		 * method; if not, this method throws exceptions.
		 * @method _addMosaicItem
		 * @param {Object} item The item to be added
		 * @private
		 */
		proto._addMosaicItem = function (item) {
			var currentRow,
				currentCol,
				x,
				y;
			if (!this._dataMapper) {
				throw ('PagingMosaicMenu - _addMosaicItem: no item data mapper set');
			}
			if (!this._itemConfig) {
				throw ('PagingMosaicMenu - _addMosaicItem: no item configuration data found');
			}
			item.setDataMapper(this._dataMapper);
			this._items.addExistingItem(item);
			currentCol = this._items.getXIndexOfLast();
			currentRow = this._items.getYIndexOfLast();
			// make sure only this._columns * this._rows items are added to this._items
			if ((currentCol * currentRow) <= this.getItemsPerPage()) {
				x = ((currentCol - 1) * this._tileWidth) + (this._hspace * currentCol);
				y = ((currentRow - 1) * this._tileHeight) + (this._vspace * currentRow);
			}
			item.setX(x);
			item.setY(y);
			item.setItemConfig(this._itemConfig);
			item.configure();
		};

		/**
		 * Moves the highlighter to whichever data item has been selected
		 *
		 * @method _moveSelection
		 * @private
		 */
		proto._moveSelection = function () {
			this._items.getSelectedItem().unHighlight();
			this._items.selectRowAtIndex(this._data.getViewSelectedRowIndex());
			var currentItem = this._items.getSelectedItem();
			currentItem.highlight();
			this._handleItemHighlighted(currentItem);
		};

		/**
		 * Selects the item at the specified row and column. Optionally, the page number
		 * can also be specified.
		 * @method selectItemAtPosition
		 * @param {Number} row row of item. Row numbers start at 1
		 * @param {Number} column column of item. Column numbers start at 1
		 * @param {Number} [page] Optional. If specified, selects the item at the specified row
		 * and column on this page. Defaults to the current page if not specified. Page numbers
		 * start at 1
		 */
		proto.selectItemAtPosition = function (row, column, page) {
			if (!row || !column) {
				return null;
			}
			var refreshPage = false;
			if (page === undefined || page === null) {
				page = this.getCurrentPageNumber();
			} else if (page !== this.getCurrentPageNumber()) {
				refreshPage = true;
			}
			var newItemIndex,
				currentItemIndex = this._data.getActualSelectedRowIndex();
			if (row <= this._rows && column <= this._columns) {
				newItemIndex = (page - 1) * this.getItemsPerPage() + ((row - 1) * this._columns) + column;
				// if new position doesn't exist, try to move to the previous row
				while (newItemIndex > this._data.getSize()) {
					if ((page !== this.getCurrentPageNumber()) || (column !== this.getSelectedColumnIndex())) {
						newItemIndex -= 1;
					} else if (row !== this.getSelectedRowIndex()) {
						newItemIndex -= this._columns;
					}
				}
				if (newItemIndex !== currentItemIndex) {
					if (newItemIndex >= 1) {
						this._data.selectRowAtIndex(newItemIndex);
					} else {
						this._log('selectItemAtPosition', 'could not find an item to select', 'warn');
						// Should we select the first / last item here?
						/*
						if (newItemIndex > this._data.getSize()) {
							this._data.selectLastItem();
						} else if (newItemIndex < 1) {
							this._data.selectFirstItem();
						}
						*/
					}
					if (refreshPage) {
						this._listPagedCallback();
						this.displayData(false);
					}
					this._moveSelection();
				}
			}
			return this;
		};

		/**
		 * Returns the number of items configured to be displayed in a page
		 * @method getItemsPerPage
		 * @return {Number}
		 */
		proto.getItemsPerPage = function () {
			return this._columns * this._rows;
		};

		/**
		 * Returns the number of items displayed in the current page
		 * @method getNumberOfItemsInCurrentPage
		 * @return {Number} the number of items
		 */
		proto.getNumberOfItemsInCurrentPage = function () {
			return this._data.returnViewableList().length;
		};

		/**
		 * Returns the total number of pages available to display
		 * @method getTotalNumberOfPages
		 * @return {Number}
		 */
		proto.getTotalNumberOfPages = function () {
			return Math.ceil(this._data.getSize() / this.getItemsPerPage());
		};

		/**
		 * Returns the current page number
		 * @method getCurrentPageNumber
		 * @return {Number} current page number
		 */
		proto.getCurrentPageNumber = function () {
			return Math.ceil(this._data.getFirstVisibleRowIndex() / this.getItemsPerPage());
		};

		/**
		 * Determines whether we're at the last page
		 * @method isAtLastPage
		 * @return {Boolean} true if there is at least one more page; false otherwise
		 */
		proto.isAtLastPage = function () {
			return (this.getCurrentPageNumber() === this.getTotalNumberOfPages());
		};

		/**
		 * Determines whether there are additional pages available from the current page
		 * @method isAtFirstPage
		 * @return {Boolean} true if there is at least one more page; false otherwise
		 */
		proto.isAtFirstPage = function () {
			return (this.getCurrentPageNumber() === 1);
		};

		/**
		 * Returns the column index of the currently selected item
		 * @method getSelectedColumnIndex
		 * @return {Number}
		 */
		proto.getSelectedColumnIndex = function () {
			return (this._items.getActualSelectedRowIndex() % this._columns) || this._columns;
		};

		/**
		 * Returns the row index of the currently selected item
		 * @method getSelectedRowIndex
		 * @return {Number}
		 */
		proto.getSelectedRowIndex = function () {
			return Math.ceil(this._items.getActualSelectedRowIndex() / this._columns);
		};

		/**
		 * Determines whether the currently selected item is at the last column
		 * @method isSelectedItemAtLastColumn
		 * @return {Boolean} true if so; false otherwise
		 */
		proto.isSelectedItemAtLastColumn = function () {
			return this._items.isSelectedItemAtLastColumn();
		};

		/**
		 * Determines whether the currently selected item is at the first column
		 * @method isSelectedItemAtFirstColumn
		 * @return {Boolean} true if so; false otherwise
		 */
		proto.isSelectedItemAtFirstColumn = function () {
			return this._items.isSelectedItemAtFirstColumn();
		};

		/**
		 * Determines whether the currently selected item is at the first row
		 * @method isSelectedItemAtFirstRow
		 * @return {Boolean} true if so; false otherwise
		 */
		proto.isSelectedItemAtFirstRow = function () {
			return (this.getSelectedRowIndex() === 1);
		};

		/**
		 * Determines whether the currently selected item is at the last row
		 * @method isSelectedItemAtLastRow
		 * @return {Boolean} true if so; false otherwise
		 */
		proto.isSelectedItemAtLastRow = function () {
			return (this.getSelectedRowIndex() === this._rows);
		};

		/**
		 * Initialises the mosaic tiles. Overrides the parent method. Arranges tiles
		 * into a grid based on the number of rows and columns specified for the mosaic
		 * by the caller. Each item will be an instantce of the class specified as the
		 * item template
		 * @method init
		 */
		proto.init = function () {
			if (this._initialised) {
				return;
			}
			if (!this._itemTemplate) {
				throw ("PagingMosaicMenu - init: No list item template provided");
			}
			var i,
				newItem,
				itemCount = this.getItemsPerPage();
			this._calculateTileDimensions();
			this._data.setVisibleRows(itemCount);
			this._items.setItemsWide(this._columns);
			if (!this._itemConfig.width) {
				this._itemConfig.width = this._tileWidth;
			}
			if (!this._itemConfig.height) {
				this._itemConfig.height = this._tileHeight;
			}
			for (i = 0; i < itemCount; i++) {
				newItem = new this._itemTemplate(this._docRef);
				this._addMosaicItem(newItem);
				this._rootElement.appendChild(newItem.getRootElement());
			}
			this._initialised = true;
			return this;
		};

		/**
		 * Initialises the mosaic tiles. Overrides the parent method. Arranges tiles
		 * into a grid based on the number of rows and columns specified for the mosaic
		 * by the caller. Each item will be an instantce of the class specified as the
		 * item template
		 * @method initialise
		 * @deprecated use init()
		 */
		proto.initialise = function () {
			return this.init();
		};

		/**
		 * Selects the item previous to the current. Moves to the previous page if
		 * the current selection is at the first column
		 * @method selectPrevious
		 */
		proto.selectPrevious = function () {
			if (this._data.isSelectedAtFirst()) {
				if (this._data.getWrapAround()) {
					this.moveToLastPage(this._rows, this._columns);
				}
			// else if we're on the first column
			} else if (this.isSelectedItemAtFirstColumn()) {
				// if we're on the first page,
				if (this.isAtFirstPage()) {
					// so check if we're wrapping around
					if (this._data.getWrapAround()) {
						// if we're, then move the selection to the previous page
						this.moveToLastPage(this.getSelectedRowIndex(), this._columns);
					} else {
						// and if not, move to the last column of the previous row
						this.selectItemAtPosition(this.getSelectedRowIndex() - 1, this._columns);
					}
				} else {
					// select the last column of the previous row
					this.moveToPreviousPage(this.getSelectedRowIndex(), this._columns);
				}
			} else {
				this.selectItemAtPosition(this.getSelectedRowIndex(), this.getSelectedColumnIndex() - 1);
			}
			return this;
		};

		/**
		 * Selects the item next to the current. Moves to the next page if
		 * the current selection is at the last column
		 * @method selectNext
		 */
		proto.selectNext = function () {
			if (this._data.isSelectedAtLast()) {
				if (this._data.getWrapAround()) {
					this.moveToFirstPage(1, 1);
				}
			// else if we're on the last column
			} else if (this.isSelectedItemAtLastColumn()) {
				if (this.isAtLastPage()) {
					// we're at the last page, so check if we're wrapping around
					if (this._data.getWrapAround()) {
						// and if not, move to the first column of previous row
						this.moveToFirstPage(this.getSelectedRowIndex(), 1);
					} else {
						this.selectItemAtPosition(this.getSelectedRowIndex() + 1, 1);
					}
				} else {
					// select the first column on the same row of the previous page
					this.moveToNextPage(this.getSelectedRowIndex(), 1);
				}
			} else {
				this.selectItemAtPosition(this.getSelectedRowIndex(), this.getSelectedColumnIndex() + 1);
			}
			return this;
		};

		/**
		 * Selects the item directly above the current selection. Moves to the previous page
		 * if necessary.
		 * @method selectAbove
		 */
		proto.selectAbove = function () {
			if (this._data.isSelectedAtFirst()) {
				if (this._data.getWrapAround()) {
					this.moveToLastPage(this._rows, this._columns);
				}
			} else if (this.isSelectedItemAtFirstRow()) {
				if (this.isSelectedItemAtFirstColumn()) {
					if (!this.isAtFirstPage()) {
						this.moveToPreviousPage(this._rows, this._columns);
					}
				} else {
					this.selectItemAtPosition(this._rows, this.getSelectedColumnIndex() - 1);
				}
			} else {
				this.selectItemAtPosition(this.getSelectedRowIndex() - 1, this.getSelectedColumnIndex());
			}
			return this;
		};

		/**
		 * Selects the item directly below the current selection. Moves to the next page
		 * if necessary.
		 * @method selectBelow
		 */
		proto.selectBelow = function () {
			if (this._data.isSelectedAtLast()) {
				if (this._data.getWrapAround()) {
					this.moveToFirstPage(1, 1);
				}
			} else if (this.isSelectedItemAtLastRow()) {
				if (this.isSelectedItemAtLastColumn()) {
					if (!this.isAtLastPage()) {
						this.moveToNextPage(1, 1);
					}
				} else {
					this.selectItemAtPosition(1, this.getSelectedColumnIndex() + 1);
				}
			} else {
				this.selectItemAtPosition(this.getSelectedRowIndex() + 1, this.getSelectedColumnIndex());
			}
			return true;
		};

		/**
		 * If not at the first page, scrolls to the previous page and tries to keep the highlighter
		 * at the (optionally) specified row and column position, or the current row and column otherwise.
		 * If there's no item in that position, keeps moving back one item at a time.
		 * @method moveToPreviousPage
		 * @param {Number} [row] new row position for highlighting
		 * @param {Number} [column] new column position for highlighting
		 */
		proto.moveToPreviousPage = function (row, column) {
			if (!this.isAtFirstPage()) {
				this.selectItemAtPosition(row || this.getSelectedRowIndex(), column || this.getSelectedColumnIndex(), this.getCurrentPageNumber() - 1);
			}
			return this;
		};

		/**
		 * If not at the last page, scrolls to the next page and tries to keep the highlighter
		 * at the current row and column position. If there's no item in that position, keeps
		 * moving back one item at a time.
		 * @method moveToNextPage
		 * @param {Number} [row] new row position for highlighting
		 * @param {Number} [column] new column position for highlighting
		 */
		proto.moveToNextPage = function (row, column) {
			if (!this.isAtLastPage()) {
				this.selectItemAtPosition(row || this.getSelectedRowIndex(), column || this.getSelectedColumnIndex(), this.getCurrentPageNumber() + 1);
			}
			return this;
		};

		/**
		 * Scrolls to the first page, and selects the item specified, if any; selects the first item otherwise.
		 * @method moveToFirstPage
		 * @param {Number} [row] new row position for highlighting
		 * @param {Number} [column] new column position for highlighting
		 */
		proto.moveToFirstPage = function (row, column) {
			this.selectItemAtPosition(row || this.getSelectedRowIndex(), column || this.getSelectedColumnIndex(), 1);
			return this;
		};

		/**
		 * Scrolls to the last page, and selects the item specified, if any; selects the last item otherwise.
		 * @method moveToLastPage
		 * @param {Number} [row] new row position for highlighting
		 * @param {Number} [column] new column position for highlighting
		 */
		proto.moveToLastPage = function (row, column) {
			this.selectItemAtPosition(row || this.getSelectedRowIndex(), column || this.getSelectedColumnIndex(), this.getTotalNumberOfPages());
			return this;
		};

		/**
		 * Displays the items on the current page. Overrides the parent method.
		 * @method displayData
		 */
		proto.displayData = function (highlightSelected) {
			if (highlightSelected === undefined || highlightSelected === null) {
				highlightSelected = true;
			}
			var viewableList = this._data.returnViewableList();
			var i,
				currentItem;
			// show viewable items
			for (i = 0; i < viewableList.length; i++) {
				currentItem = this._items.getRowAtIndex(i + 1);
				currentItem.update(viewableList[i]);
				if (!currentItem.isVisible()) {
					currentItem.show();
				}
			}
			// hide on-screen items that are no longer viewable
			if (viewableList.length < this._data.getVisibleRows()) {
				for (i = viewableList.length; i < this._data.getVisibleRows(); i++) {
					this._items.getRowAtIndex(i + 1).hide();
				}
			}
			// highlight the selected item
			if (highlightSelected) {
				this._items.getSelectedItem().highlight();
			}
			return this;
		};

		/**
		 * Handles key presses pertaining to item selection (up, down, right, left, OK)
		 * @method keyHandler
		 * @param {String} key the key code of the key pressed
		 * @return {Boolean} true if the key press was handled; false otherwise
		 */
		proto.keyHandler = function (key) {
			var handled;
			if (this._customKeyHandler) {
				handled = this._customKeyHandler.call(this, key);
			}
			if (handled) {
				return handled;
			}
			var keys = $N.gui.FrameworkCore.getKeys();
			switch (key) {
			case this._previousKey:
				return this.selectPrevious();
			case this._nextKey:
				return this.selectNext();
			case keys.KEY_DOWN:
				return this.selectBelow();
			case keys.KEY_UP:
				return this.selectAbove();
			case keys.KEY_OK:
				this._itemSelectedCallback(this._data.getSelectedItem());
				return true;
			default:
				return false;
			}
		};

		/**
		 * Sets the custom key handler for this object. This custom handler should be a
		 * function that accepts a single argument (the key pressed), and returns a Boolean
		 * value that indicates whether the key press was handled.
		 * @method setCustomKeyHandler
		 * @param {Function} customHandler function that will handle key presses
		 */
		proto.setCustomKeyHandler = function (customHandler) {
			if (customHandler) {
				this._customKeyHandler = customHandler;
			}
			return this;
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.PagingMosaicMenu = PagingMosaicMenu;
		return PagingMosaicMenu;
	}
);