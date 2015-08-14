/**
 * This class is a subclass of DynamicTable built
 * to support different item templates
 *
 * @class $N.gui.MultiItemTypeDynamicTable
 * @constructor
 * @extends $N.gui.DynamicTable
 * @constructor
 * @param {Object} docRef (document relating the DOM)
 * @param {Object} [parent]
 */
(function ($N) {
	function MultiItemTypeDynamicTable(docRef, parent) {
		MultiItemTypeDynamicTable.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "MultiItemTypeDynamicTable");
		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(MultiItemTypeDynamicTable, $N.gui.DynamicTable);
	var proto = MultiItemTypeDynamicTable.prototype;

	/**
	 * @method _addCell
	 * @param {Number} index of the current cell
	 */
	proto._addCell = function (index) {
		this._log("_addCell", "Enter");
		var newCell = null,
			cellData = this._data.items[index],
			rootCellData = this._data.items[this._rootCellIndex];
		if (!this._itemTemplate) {
			throw ("MultiItemTypeDynamicTable - _addCell: No list item template provided");
		}
		if (this._tableItems.length > this._itemCount) {
			newCell = this._tableItems[this._itemCount];
			if (newCell.reset) {
				newCell.reset();
			} else {
				newCell.hide();
			}
		} else {
			newCell = new (this.getItemTemplateByIndex(index))(this._docRef, this._tableContainer);
			this._tableItems.push(newCell);
			newCell.hide();
		}
		this._itemCount = this._itemCount + 1;
		newCell.configure(this.getItemConfigByIndex(index));
		newCell.configure({
			x: cellData.x * this._tableScale.x,
			y: cellData.y * this._tableScale.y,
			width: (cellData.width * this._tableScale.x) - this._cellPadding,
			height: (cellData.height * this._tableScale.y) - this._cellPadding
		});
		if (newCell.update && this.getDataMapperByIndex(index)) {
			newCell.setDataMapper(this.getDataMapperByIndex(index));
			newCell.update(cellData.data);
		} else if (cellData.data) {
			newCell.configure(cellData.data);
		}
		newCell.show();

		if (!rootCellData || (cellData.x + cellData.y) < (rootCellData.x + rootCellData.y)) {
			this._rootCellIndex = index;
		}
		this._log("_addCell", "Exit");
	};

	/**
	 * @method initialise
	 */
	proto.initialise = function () {
		this._log("initialise", "Enter");
		var i,
			newCell,
			TABLE_INITIALISE_COUNT = 10;
		for (i = 0; i < TABLE_INITIALISE_COUNT; i++) {
			newCell = new (this.getItemTemplateByIndex(i))(this._docRef, this._tableContainer);
			this._tableItems.push(newCell);
			newCell.hide();
		}
		this._log("initialise", "Exit");
	};

	proto.setDataMapper = function (dataMapper) {
		this._dataMapper = dataMapper;
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
		var dataMapper = this._data.items[index].dataMapper;
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
	 * Fetches the configured itemTemplate for the item
	 * based on index
	 * If it is not available,
	 * returns the default value mentioned in XML
	 * @method getItemTemplateByIndex
	 * @param {number} index, index of the list item
	 */
	proto.getItemTemplateByIndex = function (index) {
		var template = this._data.items[index].template;
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
	 * Fetches the configured itemConfig for the item
	 * based on index
	 * If it is not available,
	 * returns the default value mentioned in XML
	 * @method getItemConfigByIndex
	 * @param {number} index, index of the list item
	 */
	proto.getItemConfigByIndex = function (index) {
		if (this._data.items[index].itemConfig) {
			return this._data.items[index].itemConfig;
		} else {
			return this._itemConfig;
		}
	};

	$N.gui = $N.gui || {};
	$N.gui.MultiItemTypeDynamicTable = MultiItemTypeDynamicTable;
}($N || {}));
