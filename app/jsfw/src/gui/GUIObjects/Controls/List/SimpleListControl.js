/**
 * Defines methods that provide the functionality of a simple list.
 * @class $N.gui.SimpleListControl
 * @extends $N.gui.GUIObject
 *
 * @requires $N.gui.StandardList
 * @requires $N.gui.Container
 * @requires $N.gui.SVGlink
 * @requires $N.gui.GUIObject
 * @requires $N.gui.Util
 * @requires $N.gui.SimpleListItem
 * @requires $N.gui.FrameworkCore
 *
 * @constructor
 * @param {Object} docRef Document reference.
 */
define('jsfw/gui/GUIObjects/Controls/List/SimpleListControl',
    [
    'jsfw/gui/Logic/List/List',
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Components/SVGlink',
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Controls/List/SimpleListItem',
    'jsfw/gui/FrameworkCore'
    ],
    function (List, Container, SVGlink, GUIObject, Util, SimpleListItem, FrameworkCore) {

		function SimpleListControl(docRef, parent) {

			SimpleListControl.superConstructor.call(this, docRef);

			this._dataList = new $N.gui.StandardList();

			this._width = null;
			this._height = null;
			this._itemHeight = 20;
			this._visibleItems = [];
			this._textCssClass = null;

			this._highlightMoveDuration = "125ms";
			this._itemSelectedCallback = function () {};
			this._itemHighlightedCallback = function () {};

			this._dataMapper = {
				getText: function (obj) {
					return obj.description;
				}
			};

			this._container = new $N.gui.Container(this._docRef);
			this._container.setCssClass("simple_list_bg");
			this._container.setRounding("1");

			this._highlightBar = new $N.gui.Container(this._docRef, this._container);
			this._highlightBar.setCssClass("simple_list_highlight_bar");
			this._highlightBar.setHeight(this._itemHeight);
			this._highlightBar.setY(-4);
			this._highlightBar.setRounding(7);

			this._highlightBar.setAnimationDuration(this._highlightMoveDuration);
			this._highlightBar.addMoveAnimation(this._highlightBarAnim);

			this._upArrow = new $N.gui.SVGlink(this._docRef, this._container);
			this._upArrow.hide();
			this._upArrow.setY(-20);
			this._downArrow = new $N.gui.SVGlink(this._docRef, this._container);
			this._downArrow.hide();

			this._rootElement = this._container.getRootElement();

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(SimpleListControl, $N.gui.GUIObject);

		/**
		 * Initialises the ScrollList and creates the GUI objects that
		 * represent the visible data view.
		 * @method init
		 */
		SimpleListControl.prototype.init = function () {
			var i = 0;
			var listItem = null;

			for (i = 0; i < this._dataList.getVisibleRows(); i++) {
				listItem = new $N.gui.SimpleListItem(this._docRef);
				listItem.setHeight(this._itemHeight);
				listItem.setY(this._itemHeight * i);
				listItem.setWidth(this._width);
				if (this._textCssClass) {
					listItem.setTextCssClass(this._textCssClass);
				}
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
		SimpleListControl.prototype.initialise = function () {
			this.init();
		};

		/**
		 * Updates the visible data view with the items that are currently
		 * showing in the list. Should be called once after the initial data has
		 * been added to the list.
		 * @method displayData
		 */
		SimpleListControl.prototype.displayData = function () {

			var viewableList = this._dataList.returnViewableList();
			var i = null;

			for (i = 0; i < viewableList.length; i++) {
				this._visibleItems[i].setText(this._dataMapper.getText(viewableList[i]));
			}
			if (viewableList.length < this._dataList.getVisibleRows()) {
				for (i = viewableList.length; i < this._dataList.getVisibleRows(); i++) {
					this._visibleItems[i].setText(" ");
				}
			}
			this._resolveArrows();
		};

		/**
		 * Selects and highlights the next item in the list.
		 * @method selectNext
		 * @return {Boolean} True if the next list item was selected, false it it wasn't selected
		 * (e.g. the last item in the list was already selected).
		 */
		SimpleListControl.prototype.selectNext = function () {
			var me = this;
			var scrolled = this._dataList.selectNext();

			if (scrolled) {
				//this._moveHighlightToSelected(true);
				this.displayData();
			} else {
				this._moveHighlightToSelected();
			}
			//this.applySelectionTimeOut(this._selectedItemTimeOutMS);
			return scrolled;
		};

		/**
		 * Selects and highlights the previous item in the list.
		 * @method selectPrevious
		 * @return {Boolean} True if the previous list item was selected, false it it wasn't selected.
		 * (e.g. the first item in the list was already selected).
		 */
		SimpleListControl.prototype.selectPrevious = function () {
			var me = this;
			var scrolled = this._dataList.selectPrevious();

			if (scrolled) {
				//this._moveHighlightToSelected(true);
				me.displayData();
			} else {
				this._moveHighlightToSelected();
			}
			//this.applySelectionTimeOut(this._selectedItemTimeOutMS);
			return scrolled;
		};

		/**
		 * Returns the index of the item which has matching text.
		 * @method getItemIndex
		 * @param {String} itemText Text that is used to match the item.
		 * @return {Number} Index of the matched item or -1 if no match found.
		 */
		SimpleListControl.prototype.getItemIndex = function (itemText) {
			var viewableList = this._dataList.returnViewableList(),
				i;
			for (i = 0; i < viewableList.length; i++) {
				if (this._dataMapper.getText(viewableList[i]) === itemText) {
					return i;
				}
			}
			return -1;
		};

		/**
		 * Entry point for key presses to be handled in the ScrollList object.
		 * @method keyHandler
		 * @param key {String} The key that was pressed in the parent view.
		 * @return {Boolean} True if the keypress was handled, false it it wasn't handled.
		 */
		SimpleListControl.prototype.keyHandler = function (key) {
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
				}
				handled = true;
				break;
			case keys.KEY_DOWN:
				if (!this._dataList.isSelectedAtLast()) {
					this.selectNext();
				}
				handled = true;
				break;
			default:
				break;
			}
			return handled;
		};

		/**
		 * Sets the callback function that is to be called when the user presses OK.
		 * @method setItemSelectedCallback
		 * @param {Function} callback The callback to be executed when an item in the list is selected.
		 */
		SimpleListControl.prototype.setItemSelectedCallback = function (callback) {
			this._itemSelectedCallback = callback;
		};

		/**
		 * Sets the callback function that is to be called when the user moves up or down
		 * within the list.
		 * @method setItemHighlightedCallback
		 * @param {Function} callback The callback to be executed when an item in the list is highlighted.
		 */
		SimpleListControl.prototype.setItemHighlightedCallback = function (callback) {
			this._itemHighlightedCallback = callback;
		};

		/**
		 * Sets the width of the ScrollList and associated highlight bar and
		 * slider.
		 * @method setWidth
		 * @param {Number} newWidth The new width of the simple list.
		 */
		SimpleListControl.prototype.setWidth = function (newWidth) {
			this._width = newWidth;
			this._container.setWidth(this._width);
			this._highlightBar.setWidth(this._width);
			this._upArrow.setX((newWidth / 2) - 5);
			this._downArrow.setX((newWidth / 2) - 5);
		};

		/**
		 * Sets the height of the rows in the list, affecting the overall
		 * height of the ScrollList.
		 * @method setItemHeight
		 * @param {Number} newHeight The new height of the simple list.
		 */
		SimpleListControl.prototype.setItemHeight = function (newHeight) {
			this._itemHeight = newHeight;
			this._height = this._itemHeight * this._dataList.getVisibleRows();
			this._container.setHeight(this._height);
			this._highlightBar.setHeight(this._itemHeight);
			this._downArrow.setY(this._height + this._itemHeight);
		};

		/**
		 * Sets the list data to be the given array object.
		 * @method setData
		 * @param list {Array} The list data.
		 */
		SimpleListControl.prototype.setData = function (list) {
			this._dataList.setData(list);
		};

		/**
		 * Sets the number of rows that are visible, affecting the overall
		 * height of the ScrollList.
		 * @method setVisibleItemCount
		 * @param {Number} newCount The number of visible rows.
		 */
		SimpleListControl.prototype.setVisibleItemCount = function (newCount) {
			this._dataList.setVisibleRows(newCount);
			this._height = this._itemHeight * this._dataList.getVisibleRows();
			this._container.setHeight(this._height);
			this._downArrow.setY(this._height + this._itemHeight);
		};

		/**
		 * Highlights the list by showing the selection bar.
		 * @method highLight
		 */
		SimpleListControl.prototype.highLight = function () {
			this._highlightBar.show();
		};

		/**
		 * Un-highlights the list by removing the selection bar.
		 * @method unHighLight
		 */
		SimpleListControl.prototype.unHighLight = function () {
			this._highlightBar.hide();
		};

		/**
		 * Sets a reference to the dataMapper function that should be
		 * used to update the data in the list.
		 * @method setDataMapper
		 * @param newDataMapper {Object} The dataMapper function.
		 */
		SimpleListControl.prototype.setDataMapper = function (newDataMapper) {
			this._dataMapper = newDataMapper;
		};

		/**
		 * Returns the width of the ScrollList.
		 * @method getWidth
		 * @return {Number} The width of the ScrollList.
		 */
		SimpleListControl.prototype.getWidth = function () {
			return this._width;
		};

		/**
		 * Returns the height of the ScrollList.
		 * @method getHeight
		 * @return {Number} The height of the ScrollList.
		 */
		SimpleListControl.prototype.getHeight = function () {
			return this._height;
		};

		/**
		 * Returns the height of a row in the ScrollList.
		 * @method getItemHeight
		 * @return {Number} The row height of each item within the ScrollList.
		 */
		SimpleListControl.prototype.getItemHeight = function () {
			return this._itemHeight;
		};

		/**
		 * Returns the Y position of the highlight bar in the current
		 * bounding box, useful for attaching a slider.
		 * @method getHighlightPosition
		 * @return {Number} Y coordinate of the highlight bar in the current
		 * bounding box.
		 */
		SimpleListControl.prototype.getHighlightPosition = function () {
			return this._highlightBar.getY();
		};

		/**
		 * Selects the row at the given index.
		 * @method selectRowAtIndex
		 * @param {Number} index Row index to be selected.
		 * @param {Boolean} redraw True if the visible data should be updated/refreshed.
		 */
		SimpleListControl.prototype.selectRowAtIndex = function (index, redraw) {
			this._dataList.selectRowAtIndex(index);
			this._moveHighlightToSelected(true);
			if (redraw) {
				this.displayData();
			}
		};

		/**
		 * Returns the number of visible rows in the ScrollList.
		 * @method getVisibleItemCount
		 * @return {Number} The number of visible rows in the ScrollList.
		 */
		SimpleListControl.prototype.getVisibleItemCount = function () {
			return this._dataList.getVisibleRows();
		};

		/**
		 * Returns the selected list item.
		 * @method getSelectedItem
		 * @return {Object} The item currently selected/highlighted in the list.
		 */
		SimpleListControl.prototype.getSelectedItem = function () {
			return this._dataList.getSelectedItem();
		};

		/**
		 * Returns the item at the top of the visible list.
		 * @method getFirstVisibleRow
		 * @return {Object} The item at the top of the visible list.
		 */
		SimpleListControl.prototype.getFirstVisibleRow = function () {
			return this._dataList.getRowAtIndex(this._dataList.getFirstVisibleRowIndex());
		};

		/**
		 * Returns the item in the list that is at the given index.
		 * @method getRowAtIndex
		 * @param {Number} index The row index of the item to retrieve.
		 * @return {Object} The list item at the given row index.
		 */
		SimpleListControl.prototype.getRowAtIndex = function (index) {
			return this._dataList.getRowAtIndex(index);
		};

		/**
		 * Retrieves the number of entries in the list.
		 * @method getSize
		 * @return {Number} The number of entries in the list.
		 */
		SimpleListControl.prototype.getSize = function () {
			return this._dataList.getSize();
		};

		/**
		 * Resets the list so that it contains no items.
		 * @method clearList
		 */
		SimpleListControl.prototype.clearList = function () {
			this._dataList.clearList();
		};

		/**
		 * Sets the CSS class that will be used to style the text in the list.
		 * @method setTextCssClass
		 * @param {String} newClass Name of the CSS class to use.
		 */
		SimpleListControl.prototype.setTextCssClass = function (newClass) {
			this._textCssClass = newClass;
		};

		/**
		 * Sets the href value on the up arrow.
		 * @method setUpArrowHref
		 * @param {String} href Hyperlink to the up arrow icon.
		 */
		SimpleListControl.prototype.setUpArrowHref = function (href) {
			this._upArrow.setHref(href);
		};

		/**
		 * Sets the href value on the down arrow.
		 * @method setDownArrowHref
		 * @param {String} href Hyperlink to the down arrow icon.
		 */
		SimpleListControl.prototype.setDownArrowHref = function (href) {
			this._downArrow.setHref(href);
		};

		/**
		 * Sets the highlight rounding.
		 * @method setHighLightRounding
		 * @param {Number} rounding The amount of rounding to apply to the highlight.
		 */
		SimpleListControl.prototype.setHighLightRounding = function (rounding) {
			this._highlightBar.setRounding(rounding);
		};

		/* Private Helper Methods */

		/**
		 * Moves the highlight to the selected list item.
		 * @method _moveHighlightToSelected
		 * @private
		 * @param {Boolean} noAnimation True if no animation is to be shown; if false, animation
		 * will be used.
		 */
		SimpleListControl.prototype._moveHighlightToSelected = function (noAnimation) {
			var newY = (this._dataList.getViewSelectedRowIndex() - 1) * this._itemHeight;
			if (noAnimation) {
				this._highlightBar.move(0, newY);
			} else {
				this._highlightBar.doMove(0, newY);
			}
		};

		/**
		 * Determines whether or not up/down arrows should be displayed.
		 * For example, an up arrow is not required when the user cannot
		 * scroll to display any new items higher in the list, similarly,
		 * a down arrow is not required when the user cannot scroll to display
		 * any new items further down in the list.
		 * @method _resolveArrows
		 * @private
		 */
		SimpleListControl.prototype._resolveArrows = function () {
			if (this._dataList.getFirstVisibleRowIndex() > 1) {
				this._upArrow.show();
			} else {
				this._upArrow.hide();
			}
			if (this._dataList.getLastVisibleRowIndex() >= this._dataList.getSize()) {
				this._downArrow.hide();
			} else {
				this._downArrow.show();
			}
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.SimpleListControl = SimpleListControl;
		return SimpleListControl;
	}
);