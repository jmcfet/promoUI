/**
 * @class $N.gui.MultiItemTypePageableList
 * @constructor
 * @extends $N.gui.PageableListWithBackground
 * @requires $N.app.Container
 * @requires $N.gui.Util
 * @param {Object} docRef (document relating the DOM)
 * @param {Object} [parent]
 */
(function ($N) {
	function MultiItemTypePageableList(docRef, parent) {
		MultiItemTypePageableList.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "MultiItemTypePageableList");
		this._isDefaultHighlightEnabled = true;
		this._defaultHighlight = new $N.gui.Container(docRef, this._container);
	}

	$N.gui.Util.extend(MultiItemTypePageableList, $N.gui.PageableListWithBackground);
	var proto = MultiItemTypePageableList.prototype;

	/**
	 * Initialises the paging list control.  Creates the list items depending on
	 * the number of list items specified using the setVisibleItemCount method.
	 * and configuring them using the provided item configuration object
	 * @method initialise
	 */
	proto.initialise = function () {
		this._log("initialise", "Enter");
		if (!this._itemTemplate) {
			throw ("MultiItemTypePageableList - initialise: No list item template provided");
		}
		var i,
			itemCount = this._data.getSize() >= this._data.getVisibleRows() ? this._data.getVisibleRows() : this._data.getSize(),
			itemObject = null,
			itemConfig = null,
			dataMapper = null;
		this._items = [];
		for (i = 0; i < itemCount; i++) {
			itemObject = new (this.getItemTemplateByIndex(i))(this._docRef);
			dataMapper = this.getDataMapperByIndex(i);
			itemConfig = this.getItemConfigByIndex(i);
			this._items.push(itemObject);
			this._items[i].configure(itemConfig);
			this._items[i].setY(i * this._itemHeight);
			if (dataMapper) {
				this._items[i].setDataMapper(dataMapper);
			}
			this._rootElement.appendChild(this._items[i].getRootElement());
		}
		this._log("initialise", "Exit");
	};

	/**
	 * Display data method visualises the data onto the relevant
	 * items in the list, this is called at least once and must be
	 * called after the initialise.
	 * Based on the assumption that all list items are of same item template,
	 * list reuses item template objects and just updates data during scroll.
	 * As this list supports different item templates ,
	 * item to be displayed might have different template configured other than
	 * the current one that is supposed to be reused.
	 * For this case we check and replace the current list item with new item template object
	 * @method displayData
	 * @param {Boolean} (optional) preview true if we are previewing the list
	 * @param {Boolean} (optional) avoidHighlight
	 */
	proto.displayData = function (preview, avoidHighlight) {
		this._log("displayData", "Enter");
		var viewableList = this._data.returnViewableList(),
			i,
			dataMapper = null,
			itemConfig = null,
			firstVisibleItemIndex = this._data.getFirstVisibleRowIndex() - 1,
			itemCount = this._data.getSize() >= this._data.getVisibleRows() ? this._data.getVisibleRows() : this._data.getSize(),
			currentItemTemplate = null,
			newItem;
		for (i = 0; i < itemCount; i++) {
			if (i < viewableList.length) {
				this._items[i].unHighlight();
				currentItemTemplate = this.getItemTemplateByIndex(firstVisibleItemIndex + i);
				if (this._items[i].constructor !== currentItemTemplate) {
					dataMapper = this.getDataMapperByIndex(firstVisibleItemIndex + i);
					itemConfig = this.getItemConfigByIndex(firstVisibleItemIndex + i);
					newItem = new (this.getItemTemplateByIndex(firstVisibleItemIndex + i))(this._docRef);
					this.replaceListItem(i, newItem);
					this._items[i].setDataMapper(dataMapper);
					this._items[i].configure(itemConfig);
					this._items[i].setY(i * this._itemHeight);
				}
				this._items[i].update(viewableList[i]);
				if (!this._items[i].isVisible()) {
					this._items[i].show();
				}
			} else {
				this._items[i].hide();
			}
		}
		if (preview) {
			this.defocus();
		}
		this._getSelectedObject().highlight();
		if (!avoidHighlight) {
			this._applySelectionTimeOut(true);
		}
		this._background.show();
		this._log("displayData", "Exit");
	};

	proto.setDefaultHighlightConfig = function (config) {
		this._defaultHighlight.configure(config);
	};

	proto.enableDefaultHighlight = function () {
		this._isDefaultHighlightEnabled = true;
	};

	proto.disableDefaultHighlight = function () {
		this._isDefaultHighlightEnabled = false;
	};

	proto.hideDefaultHighlight = function () {
		if (this._isDefaultHighlightEnabled && this.getScrollType() === MultiItemTypePageableList.consts.ScrollType.ITEM) {
			this._defaultHighlight.hide();
		}
	};

	proto.itemHighlight = function () {
		if (this._isDefaultHighlightEnabled && this.getScrollType() === MultiItemTypePageableList.consts.ScrollType.ITEM) {
			var selectedItem = this.getActualSelectedItem();
			if (!selectedItem.isHighlighted) {
				this._defaultHighlight.configure({
					y : selectedItem.getTrueY(),
					height : selectedItem._container.getTrueHeight(),
					visible : true
				});
			} else {
				this.hideDefaultHighlight();
			}
		}
	};

	proto.focus = function () {
		MultiItemTypePageableList.superClass.focus.call(this);
		this.itemHighlight();
	};

	proto.defocus = function () {
		MultiItemTypePageableList.superClass.defocus.call(this);
		this.hideDefaultHighlight();
	};

	/**
	 * Replaces a list item with another based on index
	 * @method replaceListItem
	 * @param {number} oldItemIndex, index of the list item to be replaced
	 * @param {Object} newItem, the new list item to replace the one at mentioned index
	 */
	proto.replaceListItem = function (oldItemIndex, newItem) {
		var oldItem = this._items[oldItemIndex];
		this.getRootElement().insertBefore(newItem.getRootElement(), oldItem.getRootElement());
		this._items[oldItemIndex] = newItem;
		oldItem.destroy();
	};

	/**
	 * Fetches the configured dataMapper for the item
	 * based on index
	 * If it is not available,
	 * returns the default value mentioned in XML
	 * @method getDataMapperByIndex
	 * @param {number} index, index of the list item
	 */
	proto.getDataMapperByIndex = function (index) {
		var dataMapper = this._data.getRowAtIndex(index + 1).dataMapper;
		if (dataMapper) {
			if (typeof dataMapper === "string") {
				dataMapper = window.$N.app.DataMappers["get" + dataMapper]();
			}
		} else {
			dataMapper = this._dataMapper;
		}
		return dataMapper;
	};

	/**
	 * Fetches the configured itemConfig for the item
	 * based on index
	 * If it is not available,
	 * returns the default value mentioned in XML
	 * @method getItemConfigByIndex
	 * @param {number} index, index of the list item
	 */
	proto.getItemConfigByIndex = function (index) {
		var itemConfig = this._data.getRowAtIndex(index + 1).itemConfig;
		if (!itemConfig) {
			itemConfig = this._itemConfig;
		}
		return itemConfig;
	};

	/**
	 * Fetches the configured itemTemplate for the item
	 * based on index
	 * If it is not available,
	 * returns the default value mentioned in XML
	 * @method getItemTemplateByIndex
	 * @param {number} index, index of the list item
	 */
	proto.getItemTemplateByIndex = function (index) {
		var template = this._data.getRowAtIndex(index + 1).template;
		if (template) {
			if (typeof template === "string") {
				template = window.$N.gui[template] || window[template];
			}
		} else {
			template = this._itemTemplate;
		}
		return template;
	};

	/**
	 * keyHandler method defines the logic to perform upon
	 * receiving a supplied key press.
	 * @method keyHandler
	 * @param {String} key
	 * @return {Boolean} True if the key press was handled.
	 */
	proto.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.gui.FrameworkCore.getKeys(),
			handled = false;

		handled = MultiItemTypePageableList.superClass.keyHandler.call(this, key);

		switch (key) {
		case keys.KEY_UP:
		case keys.KEY_DOWN:
			if (this.getScrollType() !== MultiItemTypePageableList.consts.ScrollType.PAGE) {
				this.itemHighlight();
			}
			break;
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	MultiItemTypePageableList.consts = $N.gui.PageableList.consts;

	$N.gui = $N.gui || {};
	$N.gui.MultiItemTypePageableList = MultiItemTypePageableList;
}($N || {}));
