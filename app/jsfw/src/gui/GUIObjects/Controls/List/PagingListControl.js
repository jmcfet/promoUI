/**
 * PagingList is an object that represents a variable length GUI list
 * with 1 or 2 columns and an icon.  It can store any type of object and
 * facilitates mapping between the object attributes and the data displayed in
 * the ScrollList columns.  The ScrollList handles key pressed and maintains
 * the state for the selected item showing a highlight. This class wraps the
 * logical version of List with the specific GUI behaviour
 *
 * @class $N.gui.PagingListControl
 * @extends $N.gui.GUIObject
 *
 * @requires $N.gui.Container
 * @requires $N.gui.ListItem
 * @requires $N.gui.FrameworkCore
 * @requires $N.gui.GUIObject
 * @requires $N.gui.Util
 *
 * @constructor
 * @param {Object} docRef
 */
define('jsfw/gui/GUIObjects/Controls/List/PagingListControl',
    [
    'jsfw/gui/Logic/List/List',
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Controls/List/ListItem',
    'jsfw/gui/FrameworkCore',
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/helpers/Util'
    ],
    function (List, Container, ListItem, FrameworkCore, GUIObject, Util) {

		function PagingListControl(docRef) {

			PagingListControl.superConstructor.call(this, docRef);

			this._dataList = new $N.gui.PagingList();

			this._width = null;
			this._height = null;
			this._itemHeight = 20;
			this._visibleItems = [];
			this._column1Width = null;
			this._selectedItemTimeOutMS = 700;
			this._selectionTimeOut = null;
			this._highlightMoveDuration = "125ms";
			this._iconX = null;
			this._iconY = null;
			this._col1Align = "left";
			this._dynamicContainer = false;

			/*
			 * Holds a reference to a function that should be run once an item
			 * is selected in the list
			 */
			this._itemSelectedCallback = function () {
				return null;
			};
			this._itemHighlightedCallback = function () {
				return null;
			};
			this._listPagedCallback = function () {
				return null;
			};

			//default dataMapper to the DefaultListRow object
			this._dataMapper = {
				getIcon: function (obj) {
					return "";
				},
				getColumn1Text: function (obj) {
					return obj.getCode();
				},
				getColumn2Text: function (obj) {
					return obj.getText();
				},
				isActive: function (obj) {
					return obj.isActive();
				}
			};

			this._container = new $N.gui.Container(this._docRef);
			this._container.setCssClass("list_bg");
			this._container.setRounding("7");

			this._highlightBar = new $N.gui.Container(this._docRef, this._container);
			this._highlightBar.setCssClass("list_highlight_bar");
			this._highlightBar.setHeight(this._itemHeight - 2);
			this._highlightBar.setY(1);
			this._highlightBar.setAnimationDuration(this._highlightMoveDuration);
			this._highlightBar.addMoveAnimation(this._docRef);

			this._rootElement = this._container.getRootElement();
		}

		$N.gui.Util.extend(PagingListControl, $N.gui.GUIObject);

		/**
		 * Initialises the ScrollList and creates the GUI objects that
		 * represent the visible data view.
		 * @method init
		 */
		PagingListControl.prototype.init = function () {
			var i = 0;
			var listItem = null;

			for (i = 0; i < this._dataList.getVisibleRows(); i++) {
				listItem = new $N.gui.ListItem(this._docRef, false);
				listItem.setHeight(this._itemHeight);
				listItem.setY(this._itemHeight * i);
				listItem.setWidth(this._width);
				if (this._iconX !== null) {
					listItem.setIconX(this._iconX);
				}
				if (this._iconY !== null) {
					listItem.setIconY(this._iconY);
				}
				if (this._column1Width) {
					listItem.setColumn1Width(this._column1Width);
				}
				listItem.setCol1Align(this._col1Align);
				this._visibleItems.push(listItem);
				this._rootElement.appendChild(listItem.getRootElement());
			}
		};

		/**
		 * Initialises the ScrollList and creates the GUI objects that
		 * represent the visible data view.
		 * @method initialise
		 * @deprecated use init()
		 */
		PagingListControl.prototype.initialise = function () {
			this.init();
		};

		/**
		 * For each of the visible items calls the getIcon method of the
		 * datamapper to set the correct icon.
		 * @method updateIcons
		 */
		PagingListControl.prototype.updateIcons = function () {
			var viewableList = this._dataList.returnViewableList();
			var i = null;

			for (i = 0; i < viewableList.length; i++) {
				this._visibleItems[i].setIcon(this._dataMapper.getIcon(viewableList[i]));
			}
			if (viewableList.length < this._dataList.getVisibleRows()) {
				for (i = viewableList.length; i < this._dataList.getVisibleRows(); i++) {
					this._visibleItems[i].setIcon("");
				}
			}
		};

		/**
		 * Updates the visible data view with the items that are currently
		 * showing in the list. Should be called once after the initial data has
		 * been added to the list.
		 * @method displayData
		 */
		PagingListControl.prototype.displayData = function () {

			var viewableList = this._dataList.returnViewableList();
			var i = null;

			for (i = 0; i < viewableList.length; i++) {
				this._visibleItems[i].setIcon(this._dataMapper.getIcon(viewableList[i]));
				this._visibleItems[i].setColumn1Text(this._dataMapper.getColumn1Text(viewableList[i]));
				this._visibleItems[i].setColumn2Text(this._dataMapper.getColumn2Text(viewableList[i]));
				if (this._dataMapper.isActive(viewableList[i])) {
					this._visibleItems[i].setIconCssClass("list_item_icon");
					this._visibleItems[i].setTextCssClass("list_item_text");
				} else {
					this._visibleItems[i].setIconCssClass("list_item_icon_inactive");
					this._visibleItems[i].setTextCssClass("list_item_text_inactive");
				}
			}
			if (viewableList.length < this._dataList.getVisibleRows()) {
				for (i = viewableList.length; i < this._dataList.getVisibleRows(); i++) {
					this._visibleItems[i].setIcon("");
					this._visibleItems[i].setColumn1Text(" ");
					this._visibleItems[i].setColumn2Text(" ");
				}
			}

			// set height of dynamic background if defined
			if (this._dynamicContainer) {
				var backgroundSize = viewableList.length * this._itemHeight;
				this._container.setHeight(backgroundSize);
			}
		};

		/**
		 * Selects and highlights the next item in the list.
		 * @method selectNext
		 * @return {Boolean} - true if moved items
		 */
		PagingListControl.prototype.selectNext = function () {
			var me = this;
			var scrolled = this._dataList.selectNext();

			if (scrolled) {
				this._moveHighlightToSelected(true);
				this.displayData();
			} else {
				this._moveHighlightToSelected();
			}
			this._applySelectionTimeOut(this._selectedItemTimeOutMS);
			if (scrolled) {
				this._listPagedCallback();
			}
			return scrolled;
		};

		/**
		 * Selects and highlights the previous item in the list.
		 * @method selectPrevious
		 * @return {Boolean} - true if moved items
		 */
		PagingListControl.prototype.selectPrevious = function () {
			var me = this;
			var scrolled = this._dataList.selectPrevious();

			if (scrolled) {
				this._moveHighlightToSelected(true);
				me.displayData();
			} else {
				this._moveHighlightToSelected();
			}
			this._applySelectionTimeOut(this._selectedItemTimeOutMS);
			if (scrolled) {
				this._listPagedCallback();
			}
			return scrolled;
		};

		/**
		 * Entry point for key presses to be handled in the ScrollList object.
		 * @method keyHandler
		 * @param key {String} the key that was pressed in the parent view
		 * @return {Boolean} True if the key press has been handled, false if not.
		 */
		PagingListControl.prototype.keyHandler = function (key) {
			var handled = false;
			var keys = $N.gui.FrameworkCore.getKeys();
			switch (key) {
			case keys.KEY_OK:
			case keys.KEY_ENTER:
				this._itemSelectedCallback(this._dataList.getSelectedItem());
				handled = true;
				break;
			case keys.KEY_UP:
				if (!this._dataList.isSelectedAtFirst()) {
					this.selectPrevious();
				} else if (this._dataList.isSelectedAtFirst() && this._dataList.isPaged() && this._dataList.getWrapAround()) {
					this.selectRowAtIndex(this._dataList.getSize(), true);
				}
				handled = true;
				break;
			case keys.KEY_DOWN:
				if (!this._dataList.isSelectedAtLast()) {
					this.selectNext();
				} else if (this._dataList.isSelectedAtLast() && this._dataList.isPaged() && this._dataList.getWrapAround()) {
					this.selectRowAtIndex(1, true);
				}
				handled = true;
				break;
			case keys.KEY_PG_UP:
				if (this._dataList.pageUp()) {
					this._moveHighlightToSelected(true);
					this.displayData();
					this._applySelectionTimeOut(this._selectedItemTimeOutMS);
					this._listPagedCallback();
				}
				handled = true;
				break;
			case keys.KEY_PG_DOWN:
				if (this._dataList.pageDown()) {
					this._moveHighlightToSelected(true);
					this.displayData();
					this._applySelectionTimeOut(this._selectedItemTimeOutMS);
					this._listPagedCallback();
				}
				handled = true;
				break;
			default: //nothing
			}
			return handled;
		};

		/**
		 * Sets the callback function that is to be called when the user presses OK.
		 * @method setItemSelectedCallback
		 * @param {Function} callback
		 */
		PagingListControl.prototype.setItemSelectedCallback = function (callback) {
			this._itemSelectedCallback = callback;
		};

		/**
		 * Sets the callback function that is to be called when the user moves up or down.
		 * @method setItemHighlightedCallback
		 * @param {Function} callback
		 */
		PagingListControl.prototype.setItemHighlightedCallback = function (callback) {
			this._itemHighlightedCallback = callback;
		};

		/**
		 * Sets the callback function that is to be called when the user pages up or down.
		 * @method setListPagedCallback
		 * @param {Function} callback
		 */
		PagingListControl.prototype.setListPagedCallback = function (callback) {
			this._listPagedCallback = callback;
		};

		/**
		 * Sets the width of the ScrollList and associated highlight bar and
		 * slider.
		 * @method setWidth
		 * @param newWidth {Number}
		 */
		PagingListControl.prototype.setWidth = function (newWidth) {
			this._width = parseInt(newWidth, 10);
			this._container.setWidth(this._width);
			this._highlightBar.setWidth(this._width);
		};

		/**
		 * Sets the height of the rows in the list, affecting the overall
		 * height of the ScrollList.
		 * @method setItemHeight
		 * @param newHeight {Number}
		 */
		PagingListControl.prototype.setItemHeight = function (newHeight) {
			this._itemHeight = newHeight;
			this._height = this._itemHeight * this._dataList.getVisibleRows();
			this._container.setHeight(this._height);
			this._highlightBar.setHeight(this._itemHeight - 2);
		};

		/**
		 * Sets the list data to the given array object.
		 * @method setData
		 * @param list {Array}
		 */
		PagingListControl.prototype.setData = function (list) {
			this._dataList.setData(list);
		};

		/**
		 * Sets the number of rows that are visible, affecting the overall
		 * height of the ScrollList.
		 * @method setVisibleItemCount
		 * @param {Number} newCount
		 */
		PagingListControl.prototype.setVisibleItemCount = function (newCount) {
			this._dataList.setVisibleRows(newCount);
			this._height = this._itemHeight * this._dataList.getVisibleRows();
			this._container.setHeight(this._height);
		};

		/**
		 * Highlights the list by showing the selection bar.
		 * @method highLight
		 */
		PagingListControl.prototype.highLight = function () {
			this._highlightBar.show();
		};

		/**
		 * Un-highlights the list by showing the selection bar.
		 * @method unHighLight
		 */
		PagingListControl.prototype.unHighLight = function () {
			this._highlightBar.hide();
		};

		/**
		 * Set the width of the first data column in the list.
		 * @method setColumn1Width
		 * @param newWidth {Number}
		 */
		PagingListControl.prototype.setColumn1Width = function (newWidth) {
			this._column1Width = parseInt(newWidth, 10);
		};

		/**
		 * Sets a reference to the dataMapper function that should be
		 * used to update the data in the list.
		 * @method setDataMapper
		 * @param newDataMapper {Object}
		 */
		PagingListControl.prototype.setDataMapper = function (newDataMapper) {
			this._dataMapper = newDataMapper;
		};

		/**
		 * Returns the width of the ScrollList.
		 * @method getWidth
		 * @return {Number}
		 */
		PagingListControl.prototype.getWidth = function () {
			return this._width;
		};

		/**
		 * Returns the height of the ScrollList.
		 * @method getHeight
		 * @return {Number}
		 */
		PagingListControl.prototype.getHeight = function () {
			return this._height;
		};

		/**
		 * Returns the height of a row in the ScrollList.
		 * @method getItemHeight
		 * @return {Number}
		 */
		PagingListControl.prototype.getItemHeight = function () {
			return this._itemHeight;
		};

		/**
		 * Returns the Y position of the highlight bar in the current
		 * bounding box, useful for attaching a slider.
		 * @method getHighlightPosition
		 * @return {Number}
		 */
		PagingListControl.prototype.getHighlightPosition = function () {
			return this._highlightBar.getY();
		};

		/**
		 * Selects the row at the given index.
		 * @method selectRowAtIndex
		 * @param {Number} index
		 * @param {Boolean} redraw
		 */
		PagingListControl.prototype.selectRowAtIndex = function (index, redraw) {
			this._dataList.selectRowAtIndex(index);
			this._moveHighlightToSelected(true);
			if (redraw) {
				this.displayData();
				this._listPagedCallback(); //TODO: work out if the list truly has paged
			}
		};

		/**
		 * Returns the number of rows visible in the list.
		 * @method getVisibleItemCount
		 * @return {Number}
		 */
		PagingListControl.prototype.getVisibleItemCount = function () {
			return this._dataList.getVisibleRows();
		};

		/**
		 * Returns the selected Item.
		 * @method getSelectedItem
		 * @return {Object}
		 */
		PagingListControl.prototype.getSelectedItem = function () {
			return this._dataList.getSelectedItem();
		};

		/**
		 * Returns true if on first page of data.
		 * @method isAtFirstPage
		 * @return {Boolean}
		 */
		PagingListControl.prototype.isAtFirstPage = function () {
			return this._dataList.isAtFirstPage();
		};

		/**
		 * Returns true if on last page of data.
		 * @method isAtLastPage
		 * @return {Boolean}
		 */
		PagingListControl.prototype.isAtLastPage = function () {
			return this._dataList.isAtLastPage();
		};

		/**
		 * Returns the item at the top of the visible list.
		 * @method getFirstVisibleRow
		 * @return {Object}
		 */
		PagingListControl.prototype.getFirstVisibleRow = function () {
			return this._dataList.getRowAtIndex(this._dataList.getFirstVisibleRowIndex());
		};

		/**
		 * Gets the item in the list at the given index.
		 * @method getRowAtIndex
		 * @param {Number} index
		 * @return {Object}
		 */
		PagingListControl.prototype.getRowAtIndex = function (index) {
			return this._dataList.getRowAtIndex(index);
		};

		/**
		 * Returns the number of items in the list
		 * @method getSize
		 * @return {Number}
		 */
		PagingListControl.prototype.getSize = function () {
			return this._dataList.getSize();
		};

		/**
		 * Clears the list of any items
		 * @method clearList
		 */
		PagingListControl.prototype.clearList = function () {
			this._dataList.clearList();
		};

		/**
		 * Sets the time before the highlighted item call back is executed
		 * @method setSelectedItemTimeOutMS
		 * @param {Number} timeMS
		 */
		PagingListControl.prototype.setSelectedItemTimeOutMS = function (timeMS) {
			this._selectedItemTimeOutMS = timeMS;
		};

		/**
		 * Sets the x positions the icon in the list item should be drawn at
		 * @method setIconX
		 * @param {Object} xVal
		 */
		PagingListControl.prototype.setIconX = function (xVal) {
			this._iconX = xVal;
		};

		/**
		 * Sets the y positions the icon in the list item should be drawn at
		 * @method setIconY
		 * @param {Object} yVal
		 */
		PagingListControl.prototype.setIconY = function (yVal) {
			this._iconY = yVal;
		};

		/**
		 * Returns the number of visible items on show in the list
		 * @method getVisibleItems
		 * @return {Number}
		 */
		PagingListControl.prototype.getVisibleItems = function () {
			return this._visibleItems;
		};

		/**
		 * Returns the visible list item objects
		 * @method getVisibleData
		 * @return {Array}
		 */
		PagingListControl.prototype.getVisibleData = function () {
			return this._dataList.returnViewableList();
		};

		/**
		 * Sets the alignment that the list items should use for the
		 * text in column 1
		 * @method setCol1Align
		 * @param {String} align left, right or centre.
		 */
		PagingListControl.prototype.setCol1Align = function (align) {
			this._col1Align = align;
		};

		/**
		 * Sets the rounding value of the bounding container.
		 * @method setContainerRounding
		 * @param {Number} rounding
		 */
		PagingListControl.prototype.setContainerRounding = function (rounding) {
			this._container.setRounding(rounding);
		};

		/**
		 * Turns dynamic container adjustment on or off, if true the list
		 * will size to number of visible items
		 * @method setDynamicContainer
		 * @param {Boolean} booleanFlag
		 */
		PagingListControl.prototype.setDynamicContainer = function (booleanFlag) {
			this._dynamicContainer = booleanFlag;
		};

		/**
		 * Sets the highlight bar to focused mode.
		 * @method focusHighlightBar
		 */
		PagingListControl.prototype.focusHighlightBar = function () {
			this._highlightBar.setCssClass("list_highlight_bar");
		};

		/**
		 * Sets the highlight bar to defocused mode.
		 * @method defocusHighlightBar
		 */
		PagingListControl.prototype.defocusHighlightBar = function () {
			this._highlightBar.setCssClass("list_highlight_bar_blur");
		};

		/**
		 * Sets whether the list should return to the top once the bottom is
		 * reached, and vice versa.
		 * @method setWrapAround
		 * @param {Object} flag
		 */
		PagingListControl.prototype.setWrapAround = function (flag) {
			this._dataList.setWrapAround(flag);
		};

		/**
		 * Applies the itemHighlightedCallback
		 * @method select
		 */
		PagingListControl.prototype.select = function () {
			this._itemHighlightedCallback(this._dataList.getSelectedItem());
		};

		// private helper methods

		/**
		 * Fires the item highlighted callback, useful to refresh data.
		 * @method _applySelectionTimeOut
		 * @private
		 * @param {Number} timeOutMS
		 */
		PagingListControl.prototype._applySelectionTimeOut = function (timeOutMS) {
			var me = this;
			clearTimeout(this._selectionTimeOut);
			this._selectionTimeOut = setTimeout(function () {
				me._itemHighlightedCallback(me._dataList.getSelectedItem());
			}, timeOutMS);
		};

		/**
		 * Helper method to move the highlight bar
		 * @method _moveHighlightToSelected
		 * @private
		 * @param {Object} noAnimation
		 */
		PagingListControl.prototype._moveHighlightToSelected = function (noAnimation) {

			var newY = (this._dataList.getViewSelectedRowIndex() - 1) * this._itemHeight;

			if (noAnimation) {
				this._highlightBar.setY(newY);
			} else {
				this._highlightBar.doMove(this._highlightBar.getX(), newY);
			}
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.PagingListControl = PagingListControl;
		return PagingListControl;
	}
);