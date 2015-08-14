// TODO: Remove temp_jsfw AbstractCustomisableList.js when keyup handling is included in JSFW
// see https://jira.opentv.com/browse/NETUI-1777
/**
 * AbstractCustomisableList provides the template to create a GUI list
 * that can be created using different list item objects. It maintains
 * the common logic for a list which can be made more specific through
 * inheritance. The list can contain any data passed in as an array
 * and uses a datamapper object to display the data appropriate for the
 * list item.
 * @class $N.gui.AbstractCustomisableList
 * @extends $N.gui.GUIObject
 * @constructor
 * @param {Object} docRef Document reference.
 */
(function ($N) {

	function AbstractCustomisableList(docRef) {

		AbstractCustomisableList.superConstructor.call(this, docRef);

		this._data = new $N.gui.BasicList();
		this._items = null; //set in concrete implementation to an instance of list item type
		this._nextItemDistance = 1;
		this._itemTemplate = null;
		this._itemConfig = {};
		this._dataMapper = null;
		this._itemSelectedCallback = function () {};
		this._itemHighlightedCallback = function () {};
		this._itemHighlightedImmediateCallback = function () {};
		/* NETUI-1545 disabled to ensure use of key up handling
		this._itemHighlightedTimeout = null;
		this._itemHighlightedTimeoutMS = 500;
		*/
		this._initialised = false;
		this._enabled = true;
		this._allMovementPositions = [];
		this._orientation = AbstractCustomisableList.consts.ORIENTAION_VERTICAL;
		this._KEY_RELEASE_SUFFIX = "_rel"; // TODO: temp_jsfw fix for keyup handling - see https://atlassian.hq.k.grp/jira/browse/NINJA-1557
	}

	$N.gui.Util.extend(AbstractCustomisableList, $N.gui.GUIObject);

	/**
	 * Creates the list items that make up the visual aspect
	 * of the list. There is a set number of visible items as
	 * defined by the size of the movementPositions that the
	 * items can move to.
	 * @method init
	 */
	AbstractCustomisableList.prototype.init = function () {
		var itemCount;
		if (this._initialised) {
			return;
		}
		if (!this._itemConfig.movementPositions) {
			throw ("AbstractCustomisableList - initialise: No positions supplied in config");
		}
		if (!this._itemTemplate) {
			throw ("AbstractCustomisableList - initialise: No list item template provided");
		}
		if (typeof this._itemConfig.movementPositions === "string") {
			itemCount = this._itemConfig.movementPositions.split(";").length;
		} else {
			itemCount = this._itemConfig.movementPositions.length;
		}
		var items = [];
		var i;

		for (i = 0; i < itemCount; i++) {
			items.push(new this._itemTemplate(this._docRef));
			this._itemConfig.movementPosition = i + 1;
			items[i].configure(this._itemConfig);
			if (this._dataMapper) {
				items[i].setDataMapper(this._dataMapper);
			}
			this._rootElement.appendChild(items[i].getRootElement());
		}
		this._items.setData(items);
		this._initialised = true;
	};

	/**
	 * Creates the list items that make up the visual aspect
	 * of the list. There is a set number of visible items as
	 * defined by the size of the movementPositions that the
	 * items can move to.
	 * @method initialise
	 * @deprecated use init()
	 */
	AbstractCustomisableList.prototype.initialise = function () {
		this.init();
	};

	/**
	 * Retrieves the highlight timeout in milliseconds.
	 * @method getItemHighlightedTimeoutMS
	 * @return {Number} The highlight timeout in milliseconds.
	 */
	/* NETUI-1545 disabled to ensure use of key up handling
	AbstractCustomisableList.prototype.getItemHighlightedTimeoutMS = function () {
		return this._itemHighlightedTimeoutMS;
	};
	*/

	/**
	 * Sets the highlight timeout in milliseconds.
	 * @method setItemHighlightedTimeoutMS
	 * @param {Number} ms The highlight timeout in milliseconds.
	 */
	/* NETUI-1545 disabled to ensure use of key up handling
	AbstractCustomisableList.prototype.setItemHighlightedTimeoutMS = function (ms) {
		this._itemHighlightedTimeoutMS = ms;
	};
	*/

	/**
	 * Returns all the data held within the list.
	 * @method getData
	 * @return {Array} data The list data.
	 */
	AbstractCustomisableList.prototype.getData = function () {
		return this._data.getData();
	};

	/**
	 * Adds data to the end of the current list.
	 * @method appendData
	 * @param {Object} data The data to be appended to the end of the list.
	 */
	AbstractCustomisableList.prototype.appendData = function (data) {
		this._data.appendData(data);
	};

	/**
	 * Sets the data of the list to be the data provided by the data parameter.
	 * @method setData
	 * @param {Array} data The data used to populate the list.
	 * @return {Object} The AbstractCustomisableList.
	 */
	AbstractCustomisableList.prototype.setData = function (data) {
		this._data.setData(data);
		return this;
	};

	/**
	 * Updates the data item at the specified index with the new data
	 * @method updateDataAtIndex
	 * @param {Number} index
	 * @param {Object} data
	 */
	AbstractCustomisableList.prototype.updateDataAtIndex = function (index, data) {
		this._data.insertDataAtIndex(index, data);
		this.displayData();
	};

	/**
	 * Updates the data item at the specified index with the new data. Unlike updateDataAtIndex,
	 * doesn't call displayData
	 * @method refreshDataAtIndex
	 * @param  {Number} index position of the item in the list
	 * @param  {Object} data  new data
	 */
	AbstractCustomisableList.prototype.refreshDataAtIndex = function (index, data) {
		this._data.insertDataAtIndex(index, data);
	};

	/**
	 * Selects the list item at the given index.
	 * @method selectItemAtIndex
	 * @param {Number} index Row index to be selected.
	 * @param {Boolean} redraw True if the visible data should be updated/refreshed.
	 */
	AbstractCustomisableList.prototype.selectItemAtIndex = function (index, redraw) {
		this._data.selectRowAtIndex(index);
		if (redraw) {
			this.displayData();
		}
	};

	/**
	 * Returns the data mapper being used to display the data.
	 * @method getDataMapper
	 * @return {Object} The data mapper that is in use.
	 */
	AbstractCustomisableList.prototype.getDataMapper = function () {
		return this._dataMapper;
	};

	/**
	 * Sets the data mapper object used for displaying the data.
	 * @method setDataMapper
	 * @param {Object} dataMapper The data mapper to be used.
	 * @return {Object} The AbstractCustomisableList.
	 */
	AbstractCustomisableList.prototype.setDataMapper = function (dataMapper) {
		this._dataMapper = dataMapper;
		var itemCount = 0;
		var i;

		if (this._initialised) {
			itemCount = this._items.getSize();
			for (i = 1; i <= itemCount; i++) {
				this._items.getRowAtIndex(i).setDataMapper(this._dataMapper);
			}
		}
		return this;
	};

	/**
	 * Returns the class template that is being used to create the
	 * items in the list.
	 * @method getItemTemplate
	 * @return {Object} The AbstractCustomisableList class template.
	 */
	AbstractCustomisableList.prototype.getItemTemplate = function () {
		return this._itemTemplate;
	};

	/**
	 * Sets the class template that is to be used in the creation of the
	 * items in the list.
	 * @method setItemTemplate
	 * @param {Object} itemTemplate The item template to be used.
	 * @return {Object} The AbstractCustomisableList.
	 */
	AbstractCustomisableList.prototype.setItemTemplate = function (itemTemplate) {
		if (typeof itemTemplate === "string") {
			this._itemTemplate = window.$N.gui[itemTemplate] || window[itemTemplate];
		} else {
			this._itemTemplate = itemTemplate;
		}
		return this;
	};

	/**
	 * Returns the object that holds the configuration values to
	 * be used in the creation of the items in the list.
	 * @method getItemConfig
	 * @return {Object} Object containing the list creation configuration values.
	 */
	AbstractCustomisableList.prototype.getItemConfig = function () {
		return this._itemConfig;
	};

	/**
	 * Sets the object that is holding the values that are to be used in
	 * the creation of the items in the list.
	 * @method setItemConfig
	 * @param {Object} configObj The configuration object.
	 * @return {Object} The AbstractCustomisableList.
	 */
	AbstractCustomisableList.prototype.setItemConfig = function (configObj) {
		this._itemConfig = configObj;
		return this;
	};

	/**
	 * Returns the data object relating to the currently selected item in
	 * the list.
	 * @method getSelectedItem
	 * @return {Object} The data object relating to the currently selected item in
	 * the list
	 */
	AbstractCustomisableList.prototype.getSelectedItem = function () {
		return this._data.getSelectedItem();
	};

	/**
	 * Returns the index of the currently selected data object in the
	 * data list.
	 * @method getSelectedItemIndex
	 * @return {Number} The index of the currently selected data object in the
	 * data list.
	 */
	AbstractCustomisableList.prototype.getSelectedItemIndex = function () {
		return this._data.getActualSelectedRowIndex();
	};

	/**
	 * Sets the behaviour to perform when 'OK' is pressed on an item
	 * in the list.
	 * @method setItemSelectedCallback
	 * @param {Function} callback The function to be executed on an 'OK' keypress.
	 * @return {Object} The AbstractCustomisableList.
	 */
	AbstractCustomisableList.prototype.setItemSelectedCallback = function (callback) {
		this._itemSelectedCallback = callback;
		return this;
	};

	/**
	 * Sets the behaviour to perform when a user moves over an item
	 * in the list.
	 * @method setItemHighlightedCallback
	 * @param {Object} callback The function to be executed when a user highlights a list item.
	 * @return {Object} The AbstractCustomisableList.
	 */
	AbstractCustomisableList.prototype.setItemHighlightedCallback = function (callback) {
		this._itemHighlightedCallback = callback;
		return this;
	};

	/**
	 * Sets the behaviour to perform immediately
	 * when a user moves over an item in the list.
	 * @method setItemHighlightedImmediateCallback
	 * @param {Object} callback The function to be executed.
	 * @return {Object} The AbstractCustomisableList.
	 */
	AbstractCustomisableList.prototype.setItemHighlightedImmediateCallback = function (callback) {
		this._itemHighlightedImmediateCallback = callback;
		return this;
	};

	/**
	 * Reselects the currently selected list item.
	 * i.e. Reinvoke the item selected callback.
	 * @method select
	 */
	AbstractCustomisableList.prototype.select = function () {
		var selectedItem = this._data.getSelectedItem();
		if (this._itemHighlightedImmediateCallback) {
			this._itemHighlightedImmediateCallback(selectedItem);
		}
		this._itemHighlightedCallback(selectedItem);
	};

	/**
	 * Cancels any timeouts that are associated with item highlight events.
	 * @method cancelSelect
	 */
	/* NETUI-1545 disabled to ensure use of key up handling
	AbstractCustomisableList.prototype.cancelSelect = function () {
		if (this._itemHighlightedTimeout) {
			clearTimeout(this._itemHighlightedTimeout);
			this._itemHighlightedTimeout = null;
		}
	};
	*/

	/**
	 * Selects the previous item in the list scrolls the list
	 * if required.
	 * @method selectPrevious
	 * @return {Boolean} True if movement to the next list item has been made,
	 * false if movement to the next list item was not made.
	 */
	AbstractCustomisableList.prototype.selectPrevious = function () { // TODO: temp_jsfw fix for keyup handling - see https://atlassian.hq.k.grp/jira/browse/NINJA-1557

		var lastItem = this._items.getLastItem();
		var itemCount = this._items.getSize();
		var newData;
		var i;

		// check we can move to the previous item
		if (!this._data.isSelectedAtFirst() || this._data.getWrapAround()) {

			this._items.getSelectedItem().unHighlight();
			var scrolled = this._items.selectPrevious();
			this._items.getSelectedItem().highlight(false, this._getHighlightParameter());
			if (scrolled) {
				newData = this._data.getRowAtIndex(this._data.getActualSelectedRowIndex() - (this._nextItemDistance + 1));
				if (newData) {
					lastItem.update(newData, this._getUpdateParameter());
					if (!lastItem.isVisible()) {
						lastItem.show();
					}
				} else {
					lastItem.hide();
				}
				this._data.selectPrevious();
				for (i = 1; i <= itemCount; i++) {
					this._items.getRowAtIndex(i).moveToNext();
				}
			}
			this._handleItemHighlighted(this._data.getSelectedItem());
			return true;
		}
		return false;
	};

	/**
	 * Selects the next item in the list and scrolls the list
	 * if required.
	 * @method selectNext
	 * @return {Boolean} True if movement to the next list item has been made,
	 * false if movement to the next list item was not made.
	 */
	AbstractCustomisableList.prototype.selectNext = function () { // TODO: temp_jsfw fix for keyup handling - see https://atlassian.hq.k.grp/jira/browse/NINJA-1557

		var firstItem = this._items.getFirstItem();
		var itemCount = this._items.getSize();
		var newData;
		var i;

		// check we can move to the next item
		if (!this._data.isSelectedAtLast() || this._data.getWrapAround()) {

			this._items.getSelectedItem().unHighlight();
			var scrolled = this._items.selectNext();
			this._items.getSelectedItem().highlight(false, this._getHighlightParameter());
			if (scrolled) {
				newData = this._data.getRowAtIndex(this._data.getActualSelectedRowIndex() + (this._nextItemDistance + 1));

				if (newData) {
					firstItem.update(newData, this._getUpdateParameter());
					if (!firstItem.isVisible()) {
						firstItem.show();
					}
				} else {
					firstItem.hide();
				}
				this._data.selectNext();
				for (i = 1; i <= itemCount; i++) {
					this._items.getRowAtIndex(i).moveToPrevious();
				}
			}
			this._handleItemHighlighted(this._data.getSelectedItem());
			return true;
		}
		return false;
	};

	/**
	 * Returns a boolean value indicating if selected item is the first
	 * item in the list.
	 * @method isSelectedAtFirst
	 * @return {Boolean} True if the select item is first in the list, false if it is not.
	 */
	AbstractCustomisableList.prototype.isSelectedAtFirst = function () {
		return this._data.isSelectedAtFirst();
	};

	/**
	 * Returns a boolean value indicating if selected item is the last
	 * item in the list.
	 * @method isSelectedAtLast
	 * @return {Boolean} True if the select item is last in the list, false if it is not.
	 */
	AbstractCustomisableList.prototype.isSelectedAtLast = function () {
		return this._data.isSelectedAtLast();
	};

	/**
	 * Determines whether or not wrap around is enabled.
	 * @method getWrapAround
	 * @return {Boolean} True if wrap around is enabled, false if it is disabled.
	 */
	AbstractCustomisableList.prototype.getWrapAround = function () {
		return this._data.getWrapAround();
	};

	/**
	 * Enables items in list.
	 * @method enable
	 */
	AbstractCustomisableList.prototype.enable = function () {
		var items,
			item,
			i;
		items = this._items.getData();
		for (i = 0; i < items.length; i++) {
			item = items[i];
			if (item.enable) {
				item.enable();
			}
		}
		this._enabled = true;
	};

	/**
	 * Disable items in list.
	 * @method disable
	 */
	AbstractCustomisableList.prototype.disable = function () {
		var items,
			item,
			i;
		items = this._items.getData();
		for (i = 0; i < items.length; i++) {
			item = items[i];
			if (item.disable) {
				item.disable();
			}
		}
		this._enabled = false;
	};

	/**
	 * Sets whether or not the list will wrap to the bottom when the user navigates
	 * past the first item and to the top when the user navigates past the last item.
	 * @method setWrapAround
	 * @param {Boolean} wrap If true, the list will wrap; if false then the list will not wrap.
	 */
	AbstractCustomisableList.prototype.setWrapAround = function (wrap) {
		if (typeof wrap === "string") {
			wrap = (wrap === "true") ? true : false;
		}
		this._data.setWrapAround(wrap);
	};

	/**
	 * Decides whether or not the data list contains any items.
	 * @method isEmpty
	 * @return {Boolean} True if the data list is empty, false if not.
	 */
	AbstractCustomisableList.prototype.isEmpty = function () {
		return this._data.isEmpty();
	};

	/**
	 * Returns the number of data items in the list.
	 * @method getSize
	 * @return {Number} The number of data items in the list.
	 */
	AbstractCustomisableList.prototype.getSize = function () {
		return this._data.getSize();
	};

	/**
	 * Abstract method to be defined in subclasses.
	 * @method displayData
	 */
	AbstractCustomisableList.prototype.displayData = function () {
		throw ("AbstractCustomisableList - displayData: Illegal operation on an abstract method");
	};

	/**
	 * Takes a 2 dimensional array of points that the make up positions and
	 * alternative positions the item can be moved to
	 * @method setMovementPositions
	 * @param {Array} multiPositions
	 */
	AbstractCustomisableList.prototype.setMovementPositions = function (multiPositions) {
		this._allMovementPositions = multiPositions;
	};

	/**
	 * Sets the position of this item to an alternative positon based on previously set values
	 * @method setAlternativePosition
	 * @param {Object} index
	 * @param {Object} redraw
	 */
	AbstractCustomisableList.prototype.setAlternativePosition = function (index, redraw) {
		var items = this._items.returnViewableList(),
			i;
		for (i = 0; i < items.length; i++) {
			items[i].setNewMovementPositions(this._allMovementPositions[index], redraw);
		}
	};

	/**
	 * Sets the scale value for each item in the list
	 * @method setScaleValues
	 * @param {Object} multiScales Array of scale values or comma-separated list (String).
	 */
	AbstractCustomisableList.prototype.setScaleValues = function (multiScales) {
		var items = this._items.returnViewableList(),
			i;
		for (i = 0; i < items.length; i++) {
			items[i].setScaleValues(multiScales);
		}
	};

	/**
	 * Sets the opacity value for the each item in the list
	 * @method setOpacityValues
	 * @param {Object} multiValues Array of opacity values or comma-separated list (String).
	 */
	AbstractCustomisableList.prototype.setOpacityValues = function (multiValues) {
		var items = this._items.returnViewableList(),
			i;
		for (i = 0; i < items.length; i++) {
			items[i].setOpacityValues(multiValues);
		}
	};

	/**
	 * Creates a timeout and applies the item highlighted callback to the specified list item.
	 * @method _handleItemHighlighted
	 * @private
	 * @param {Object} item A list item.
	 * @param {Boolean} immediate
	 */
	AbstractCustomisableList.prototype._handleItemHighlighted = function (item, immediate) { // TODO: temp_jsfw fix for keyup handling - see https://atlassian.hq.k.grp/jira/browse/NINJA-1557
		if (this._itemHighlightedImmediateCallback) {
			this._itemHighlightedImmediateCallback(item);
		}
		if (immediate) {
			if (this._itemHighlightedCallback) {
				this._itemHighlightedCallback(item);
			}
		}
	};

	/**
	 * For internal use allows this method to be overridden to pass additional
	 * information to the items update method in addition to the data itself.
	 * @method _getUpdateParameter
	 * @private
	 * @return {Object}
	 */
	AbstractCustomisableList.prototype._getUpdateParameter = function () {
		return null;
	};

	/**
	 * For internal use allows this method to be overridden to pass additional
	 * information to the items highlight method.
	 * @method _getHighlightParameter
	 * @private
	 * @return {Object}
	 */
	AbstractCustomisableList.prototype._getHighlightParameter = function () {
		return null;
	};

	/**
	 * Sets the orientation (vertical or horizontal) of the list.
	 * @method setOrientation
	 * @param {Number} orientation Value identifying which orientation to use.
	 */
	AbstractCustomisableList.prototype.setOrientation = function (orientation) { // TODO: temp_jsfw fix for keyup handling - see https://atlassian.hq.k.grp/jira/browse/NINJA-1557
		var keys =  $N.gui.FrameworkCore.getKeys();
		// also check for old numeric constants for backward compatibility
		if (orientation === AbstractCustomisableList.consts.ORIENTAION_VERTICAL || orientation === '1') {
			this._nextKey = keys.KEY_DOWN;
			this._previousKey = keys.KEY_UP;
			this._nextKeyRelease = keys.KEY_DOWN + this._KEY_RELEASE_SUFFIX;
			this._previousKeyRelease = keys.KEY_UP + this._KEY_RELEASE_SUFFIX;
		} else if (orientation === AbstractCustomisableList.consts.ORIENTAION_HORIZONTAL || orientation === '2') {
			this._nextKey = keys.KEY_RIGHT;
			this._previousKey = keys.KEY_LEFT;
			this._nextKeyRelease = keys.KEY_RIGHT + this._KEY_RELEASE_SUFFIX;
			this._previousKeyRelease = keys.KEY_LEFT + this._KEY_RELEASE_SUFFIX;
		}
		this._orientation = orientation;
	};

	/**
	 * Returns the orientation (vertical or horizontal) of the list.
	 * @method getOrientation
	 * @return the orientation (vertical or horizontal) of the list.
	 */
	AbstractCustomisableList.prototype.getOrientation = function () {
		return this._orientation;
	};

	/**
	* Stores the given CSS class name and updates the component's 'class' attribute.
	* @method setCssClass
	* @param {String} className Name of the CSS class.
	*/
	AbstractCustomisableList.prototype.setCssClass = function (className) {
		this._cssClass = className;
		this._rootElement.setAttribute("class", this._cssClass);
		if ($N.gui.PresentationManager) {
			this.configure($N.gui.PresentationManager.getPresentation(this._cssClass));
		}
	};

	/**
	 * Defines the logic to perform upon receiving a supplied key press.
	 * @method keyHandler
	 * @param {String} key The key that was pressed.
	 * @return {Boolean} True if the key press was handled, false if not.
	 */
	AbstractCustomisableList.prototype.keyHandler = function (key) { // TODO: temp_jsfw fix for keyup handling - see https://atlassian.hq.k.grp/jira/browse/NINJA-1557
		var keys = $N.gui.FrameworkCore.getKeys();
		switch (key) {
		case this._previousKey:
			return this.selectPrevious();
		case this._nextKey:
			return this.selectNext();
		case this._previousKeyRelease:
			this._itemHighlightedCallback(this._data.getSelectedItem());
			return true;
		case this._nextKeyRelease:
			this._itemHighlightedCallback(this._data.getSelectedItem());
			return true;
		case keys.KEY_OK:
		case keys.KEY_RIGHT:
			this._itemSelectedCallback(this._data.getSelectedItem());
			return true;
		}
		return false;
	};

	/**
	 * Returns the GUI objects that are the items in the list
	 * @method getItems
	 * @return {Object} list
	 */
	AbstractCustomisableList.prototype.getItems = function () {
		return this._items;
	};

	/**
	 * Constants that identify the orientation (vertical or horizontal) of the List - `ORIENTAION_VERTICAL` and
	 * `ORIENTAION_HORIZONTAL`
	 * @property {Number} consts
	 * @readonly
	 */
	AbstractCustomisableList.consts = {
		ORIENTAION_VERTICAL: 'vertical',
		ORIENTAION_HORIZONTAL : 'horizontal'
	};

	$N.gui = $N.gui || {};
	$N.gui.AbstractCustomisableList = AbstractCustomisableList;
}($N || {}));
