/**
 * @class $N.gui.PageableList
 * @constructor
 * @extends $N.gui.AbstractCustomisableList
 * @requires $N.gui.CyclicPagingList
 * @requires $N.gui.ListGroup
 * @requires $N.gui.Util
 * @param {Object} docRef
 * @param {Object} [parent]
 */
(function ($N) {
	var PageableList = function (docRef, parent) {
		PageableList.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "PageableList");
		this._items = [];
		this._data = new $N.gui.CyclicPagingList();
		this._itemHeight = 20;
		this._container = new $N.gui.ListGroup(this._docRef);
		this._rootElement = this._container.getRootElement();
		this._scrollType = null;
		this._upDownPageable = false;
		this._keyupIndex = 1;
		this._listPagedCallback = function () {
			return null;
		};
		this._focusState = true;
		this.setOrientation(PageableList.consts.ORIENTAION_VERTICAL);
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(PageableList, $N.gui.AbstractCustomisableList);

	/**
	 * @method _getSelectedObject
	 * @return {Object} The currently selected _items[] object
	 */
	PageableList.prototype._getSelectedObject = function () {
		return this._items[this._data.getViewSelectedRowIndex() - 1];
	};

	/**
	 * Initialises the paging list control.  Creates the list items depending on
	 * the number of list items specified using the setVisibleItemCount method.
	 * and configuring them using the provided item configuration object
	 * @method initialise
	 */
	PageableList.prototype.initialise = function () {
		this._log("initialise", "Enter");
		if (!this._itemTemplate) {
			throw ("AbstractCustomisableList - initialise: No list item template provided");
		}
		var i,
			itemCount = this._data.getVisibleRows();
		this._items = [];
		for (i = 0; i < itemCount; i++) {
			this._items.push(new this._itemTemplate(this._docRef));

			this._items[i].configure(this._itemConfig);
			this._items[i].setY(i * this._itemHeight);
			if (this._dataMapper && this._items[i].setDataMapper) {
				this._items[i].setDataMapper(this._dataMapper);
			}
			var root = this._items[i].getRootElement();
			root.onclick = this._items[i].click;
			this._rootElement.appendChild(this._items[i].getRootElement());
		}
		this._log("initialise", "Exit");
	};

	/**
	 * Resets the paging list control.
	 * Destroys all the child list items of the list
	 * @method reset
	 */
	PageableList.prototype.reset = function () {
		this._log("reset", "Enter");
		if (this._items && this._items.length > 0) {
			var i,
				itemCount = this._items.length;
			for (i = 0; i < itemCount; i++) {
				this._items[i].destroy();
			}
			this._items = [];
			this._data.clearList();
		}
		this._log("reset", "Exit");
	};

	/**
	 * @method doForAllItems
	 * @param {function} runMe The function to run on each item in the list
	 */
	PageableList.prototype.doForAllItems = function (runMe) {
		var i,
			loopLength = this._items.length;
		for (i = 0; i < loopLength; i++) {
			runMe(this._items[i]);
		}
	};

	/**
	 * Updates the someone Item if it is visible.
	 * @method itemUpdate
	 */
	PageableList.prototype.visibleItemUpdate = function (index) {
		var viewableList = this._data.returnViewableList();
		index = index % viewableList.length;
		if (this._items && this._items[index].isVisible()) {
			this._items[index].update(viewableList[index]);
		}
	};

	/**
	 * Updates the Item icon.
	 * @method updateTickIconData
	 */
	PageableList.prototype.updateTickIconData = function (preview, avoidHighlight) {
		this._log("updateTickIconData", "Enter");
		var viewableList = this._data.returnViewableList(),
			viewableListLength = viewableList.length,
			i;
		for (i = 0; i < viewableListLength; i++) {
			this._items[i].updateIcon(viewableList[i]);
			if (!this._items[i].isVisible()) {
				this._items[i].show();
			}
		}
		if (viewableListLength < this._data.getVisibleRows()) {
			for (i = viewableListLength; i < this._data.getVisibleRows(); i++) {
				this._items[i].hide();
			}
		}
		if (!avoidHighlight) {
			this._applySelectionTimeOut();
		}
		this._log("updateTickIconData", "Exit");
	};

	/**
	 * Display data method visualises the data onto the relevant
	 * items in the list, this is called at least once and must be
	 * called after the initialise.
	 * @method displayData
	 * @param {Boolean} (optional) preview true if we are previewing the list
	 * @param {Boolean} (optional) avoidHighlight
	 */
	PageableList.prototype.displayData = function (preview, avoidHighlight) {
		this._log("displayData", "Enter");
		var viewableList = this._data.returnViewableList(),
			viewableListLength = viewableList.length,
			i;
		for (i = 0; i < viewableListLength; i++) {
			this._items[i].unHighlight();
			this._items[i].update(viewableList[i]);
			if (!this._items[i].isVisible()) {
				this._items[i].show();
			}
		}
		if (viewableListLength < this._data.getVisibleRows()) {
			for (i = viewableListLength; i < this._data.getVisibleRows(); i++) {
				this._items[i].hide();
			}
		}
		if (preview) {
			this.defocus();
		}
		this._getSelectedObject().highlight();
		if (!avoidHighlight) {
			this._applySelectionTimeOut();
		}

		this._keyupIndex = this.getViewSelectedRowIndex();

		this._log("displayData", "Exit");
	};

	/**
	 * Updates icons of the visible items.
	 * @method updateIcons
	 */
	PageableList.prototype.updateIcons = function () {
		this._log("updateIcons", "Enter");
		var viewableList = this._data.returnViewableList(),
			viewableListLength = viewableList.length,
			i;
		for (i = 0; i < viewableListLength; i++) {
			if (this._items[i].updateIcons && this._items[i].isVisible()) {
				this._items[i].updateIcons(viewableList[i]);
			}
		}
		this._log("updateIcons", "Exit");
	};

	/**
	 * Sets the behaviour that should occur when the list pages
	 * @method setListPagedCallback
	 * @param {Function} callback
	 */
	PageableList.prototype.setListPagedCallback = function (callback) {
		this._listPagedCallback = callback;
	};

	/**
	 * @method isSelectionAtTop
	 * @return {bool}
	 */
	PageableList.prototype.isSelectionAtTop = function () {
		var atTopOfList = false;
		if (!this.getWrapAround()) {
			if (this._data.getFirstVisibleRowIndex() === 1) {
				atTopOfList = true;
			}
		}
		return atTopOfList;
	};

	/**
	 * @method isSelectionAtBottom
	 * @return {bool}
	 */
	PageableList.prototype.isSelectionAtBottom = function () {
		var atBottomOfList = false;
		if (!this.getWrapAround()) {
			if (this._data.getLastVisibleRowIndex() === this._data.getSize()) {
				atBottomOfList = true;
			}
		}
		return atBottomOfList;
	};

	/**
	 * @method _firePagedCallback
	 */
	PageableList.prototype._firePagedCallback = function () {
		this._log("_firePagedCallback", "Enter");
		this._listPagedCallback(this.isSelectionAtTop(), this.isSelectionAtBottom());
		this._log("_firePagedCallback", "Exit");
	};

	/**
	 * Selects and highlights the next item in the list
	 * @method selectNext
	 * @param {Boolean} immediate
	 * @return {Boolean} true if the list paged
	 */
	PageableList.prototype.selectNext = function (immediate) {
		this._log("selectNext", "Enter");
		var scrolled = false;
		if (!this.getWrapAround() && this._data.isSelectedAtLast()) {
			return scrolled;
		}
		this._getSelectedObject().unHighlight();
		scrolled = this._data.selectNext();
		if (scrolled) {
			this.displayData(false, true);
		}
		this._getSelectedObject().highlight();
		if (this._focusState) {
			if (scrolled) {
				this._firePagedCallback();
			}
		}
		this._log("selectNext", "Exit");
		return scrolled;
	};

	/**
	 * Selects and highlights the previous item in the list
	 * @method selectPrevious
	 * @param {Boolean} immediate
	 * @return {Boolean} true if the list paged
	 */
	PageableList.prototype.selectPrevious = function (immediate) {
		this._log("selectPrevious", "Enter");
		var scrolled = false;
		if (!this.getWrapAround() && this._data.isSelectedAtFirst()) {
			return scrolled;
		}
		this._getSelectedObject().unHighlight();
		scrolled = this._data.selectPrevious();
		if (scrolled) {
			this.displayData(false, true);
		}
		this._getSelectedObject().highlight();
		if (this._focusState) {
			if (scrolled) {
				this._firePagedCallback();
			}
		}
		this._log("selectPrevious", "Exit");
		return scrolled;
	};

	/**
	 * @method setUpDownPageable
	 */
	PageableList.prototype.setUpDownPageable = function (pageable) {
		this._log("setUpDownPageable", "Enter");
		this._upDownPageable = pageable;
		this._log("setUpDownPageable", "Exit");
	};
	/**
	 * @method pageUp
	 */
	PageableList.prototype.pageUp = function () {
		this._log("pageUp", "Enter");
		if (this._upDownPageable) {
			this._getSelectedObject().unHighlight();
			this._data.pageUp();
			this.displayData(false, true);
			this._getSelectedObject().highlight();
			if (this._focusState) {
				this._applySelectionTimeOut();
				this._firePagedCallback();
			}
			return true;
		}
		this._log("pageUp", "Exit");
		return false;
	};

	/**
	 * @method pageDown
	 */
	PageableList.prototype.pageDown = function () {
		this._log("pageDown", "Enter");
		if (this._upDownPageable) {
			this._getSelectedObject().unHighlight();
			this._data.pageDown();
			this.displayData(false, true);
			this._getSelectedObject().highlight();
			if (this._focusState) {
				this._applySelectionTimeOut();
				this._firePagedCallback();
			}
			return true;
		}
		this._log("pageDown", "Exit");
		return false;
	};

	/**
	 * @method applyPageSelectionTimeOut
	 */
	PageableList.prototype.applyPageSelectionTimeOut = function () {
		this._log("applyPageSelectionTimeOut", "Enter");
		if (this._upDownPageable) {
			this._applySelectionTimeOut();
			return false;
		}
		this._log("applyPageSelectionTimeOut", "Exit");
		return false;
	};

	/**
	 * @method getVisibleItemCount
	 * @return {Number}
	 */
	PageableList.prototype.getVisibleItemCount = function () {
		return this._data.getVisibleRows();
	};

	/**
	 * Sets the number of rows that are visible, affecting the overall
	 * height of the ScrollList
	 * @method setVisibleItemCount
	 * @param {Number} newCount
	 */
	PageableList.prototype.setVisibleItemCount = function (newCount) {
		this._data.setVisibleRows(newCount);
		this._height = this._itemHeight * this._data.getVisibleRows();
		this._container.setHeight(this._height);
	};

	/**
	 * Sets the height of the rows in the list, affecting the overall
	 * height of the ScrollList
	 * @method setItemHeight
	 * @param newHeight {Number}
	 */
	PageableList.prototype.setItemHeight = function (newHeight) {
		this._itemHeight = newHeight;
		this._height = this._itemHeight * this._data.getVisibleRows();
		this._container.setHeight(this._height);
	};

	/**
	 * @method _selectItem
	 * @param {Object} selectedItem
	 * @param {Boolean} isOKPressed
	 */
	PageableList.prototype._selectItem = function (selectedItem, isOKPressed) {
		if (this._selectionTimeOut) {
			this._itemHighlightedCallback(this._data.getSelectedItem());
		}
		this._itemSelectedCallback(selectedItem, isOKPressed);
	};

	/**
	 * keyHandler method defines the logic to perform upon
	 * receiving a supplied key press.
	 * @method keyHandler
	 * @param {String} key
	 * @return {Boolean} True if the key press was handled.
	 */
	PageableList.prototype.keyHandler = function (key,label) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false,
			isOKPressed = false,
			selectedItem = this._data.getSelectedItem();

		if (key == 'click') {
		    var obj = this._data.SelectClickedItem(label);
		    this._selectItem(obj, false);
		}

		switch (key) {
         
		case this._previousKey:
			if ((this.getScrollType() === PageableList.consts.ScrollType.PAGE) && (!this._data.isAtFirstPage())) {
				handled = this._data.pageUp();
				this.displayData(false, false);
			} else {
				handled = this.selectPrevious();
			}
			break;
		case this._nextKey:
			if ((this.getScrollType() === PageableList.consts.ScrollType.PAGE) && (!this._data.isAtLastPage())) {
				handled = this._data.pageDown();
				this.displayData(false, false);
			} else {
				handled = this.selectNext();
			}
			break;
		case this._previousKeyRelease:
		case this._nextKeyRelease:
			if (this._keyupIndex !== this._data.getActualSelectedRowIndex()
					|| (this.getViewSelectedRowIndex() === this.getActualSelectedRowIndex())) {
				this._applySelectionTimeOut();
			}
			this._keyupIndex = this._data.getActualSelectedRowIndex();
			handled = true;
			break;
		case keys.KEY_CHAN_UP:
			handled = this.pageUp();
			break;
		case keys.KEY_CHAN_DOWN:
			handled = this.pageDown();
			break;
		case (keys.KEY_CHAN_UP + this._KEY_RELEASE_SUFFIX):
			handled = this.applyPageSelectionTimeOut();
			break;
		case (keys.KEY_CHAN_DOWN + this._KEY_RELEASE_SUFFIX):
			handled = this.applyPageSelectionTimeOut();
			break;
		case keys.KEY_OK:
			isOKPressed = true;
			this._selectItem(selectedItem, isOKPressed);
			handled = true;
			break;
		case keys.KEY_RIGHT:
			this._selectItem(selectedItem, isOKPressed);
			handled = true;
			break;
		}

		this._log("keyHandler", "Exit");
		return handled;
	};

	// private helper methods

	/**
	 * Applies the _itemHighlightedCallback after a timeout
	 * @method _applySelectionTimeOut
	 * @private
	 * @param {Boolean} immediate
	 */
	PageableList.prototype._applySelectionTimeOut = function () {
		this._log("_applySelectionTimeOut", "Enter");
		if (this._itemHighlightedImmediateCallback) {
			this._itemHighlightedImmediateCallback(this._data.getSelectedItem());
		}
		this._itemHighlightedCallback(this._data.getSelectedItem());
		this._log("_applySelectionTimeOut", "Exit");
	};

	/**
	 * @method focus
	 */
	PageableList.prototype.focus = function () {
		this._log("focus", "Enter");
		var i;
		for (i = 0; i < this._items.length; i++) {
			this._items[i].focus();
		}
		this._focusState = true;
		this._log("focus", "Exit");
	};

	/**
	 * @method defocus
	 */
	PageableList.prototype.defocus = function () {
		this._log("defocus", "Enter");
		var i;
		for (i = 0; i < this._items.length; i++) {
			this._items[i].defocus();
		}
		this._focusState = false;
		this._log("defocus", "Exit");
	};

	/**
	 * @method getActualSelectedRowIndex
	 * @return {Integer} index
	 */
	PageableList.prototype.getActualSelectedRowIndex = function () {
		return this._data.getActualSelectedRowIndex();
	};

	/**
	 * @method getDataSize
	 * @return {Integer} dataSize
	 */
	PageableList.prototype.getDataSize = function () {
		return this._data.getSize();
	};

	/**
	 * @method getViewSelectedRowIndex
	 * @return {Integer} index
	 */
	PageableList.prototype.getViewSelectedRowIndex = function () {
		return this._data.getViewSelectedRowIndex();
	};

	/**
	 * @method selectRowAtIndex
	 * @param {Integer} index
	 */
	PageableList.prototype.selectRowAtIndex = function (index) {
		this._getSelectedObject().unHighlight();
		this._data.selectRowAtIndex(index);
		this._getSelectedObject().highlight();
	};

	/**
	 * @method selectActualItemAtIndex
	 * @param {Integer} index
	 */
	PageableList.prototype.selectActualItemAtIndex = function (index) {
		var dataLength = this.getData().length;
		this._getSelectedObject().unHighlight();
		this.selectItemAtIndex((index && index <= dataLength) ? index : 0, true);
		this._getSelectedObject().highlight();
	};

	/**
	 * @method selectRowByValidation
	 * @param {Function} validationFunction
	 */
	PageableList.prototype.selectRowByValidation = function (validationFunction) {
		var i,
			loopLength = this._data.getSize(),
			itemData;
		for (i = 1; i <= loopLength; i++) {
			itemData = this._data.getRowAtIndex(i);
			if (itemData && validationFunction(itemData)) {
				this._data.selectRowAtIndex(i);
				return;
			}
		}
		this._data.selectRowAtIndex(1);
	};

	/**
	 * @method getActualSelectedItem
	 * @return {Object}
	 */
	PageableList.prototype.getActualSelectedItem = function () {
		var index = this._data.getViewSelectedRowIndex() || 1;

		if (this._items[index - 1]) {
			return this._items[index - 1];
		}
		return null;
	};

	/**
	 * Return viewable data list
	 * @method returnViewableList
	 */
	PageableList.prototype.returnViewableList = function () {
		return this._data.returnViewableList();
	};

	/**
	 * Return selected item
	 * @method getSelectedItem
	 */
	PageableList.prototype.getSelectedItem = function () {
		return this._data.getSelectedItem();
	};

	/**
	 * @methdo getFocusState
	 * @return {String}
	 */
	PageableList.prototype.hasFocus = function () {
		return this._focusState;
	};

	/**
	 * @methdo getFocusState
	 * @return {String}
	 */
	PageableList.prototype.setScrollType = function (scrollType) {
		this._scrollType = scrollType;
	};
	/**
	 * @methdo getFocusState
	 * @return {String}
	 */
	PageableList.prototype.getScrollType = function () {
		return this._scrollType;
	};

	/**
	 * @methdo getIndexByUniqueData
	 * @return {Number} index
	 */
	PageableList.prototype.getIndexByUniqueData = function (identifierKey, identifierValue) {
		var data = this.getData(),
			i = null;
		for (i = 0; i < data.length; i++) {
			if (data[i][identifierKey] === identifierValue) {
				return i;
			}
		}
	};

	/**
	 * @methdo setHeight
	 * @param {Number} height
	 */
	PageableList.prototype.setHeight = function (height) {
		this._container.setHeight(height);
	};

	/**
	 * @methdo getHeight
	 * @return {Number} height
	 */
	PageableList.prototype.getHeight = function () {
		return this._container.getHeight();
	};

	/**
	 * @methdo setWidth
	 * @param {Number} width
	 */
	PageableList.prototype.setWidth = function (width) {
		this._container.setWidth(width);
	};

	/**
	 * @methdo getWidth
	 * @return {Number} width
	 */
	PageableList.prototype.getWidth = function () {
		return this._container.getWidth();
	};

	/**
	 * Proxy function to get the underlying list data.
	 * @methdo getData
	 * @return {Array}
	 */
	PageableList.prototype.getData = function () {
		return this._data.getData();
	};

	PageableList.consts = $N.gui.AbstractCustomisableList.consts;

	PageableList.consts.ScrollType = {
		PAGE: "page",
		ITEM: "item"
	};

	$N.gui = $N.gui || {};
	$N.gui.PageableList = PageableList;
}($N || {}));
