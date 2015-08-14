/**
 * This component creates and controls a table structure that, like our lists, can contain an item of any type.
 * The table cells do not have to be uniform in size and position. Their positions are determined by the JSON data object passed in:
 *	{
 *		gridSize: {
 *			width: <integer width (1+)>,
 *			height: <integer height (1+)>
 *		},
 *		items: [
 *			{
 *				x: <integer x-pos (0 to width-1)>,
 *				y: <integer y-pos (0 to height-1)>,
 *				width: <integer width (1 to width)>,
 *				height: <integer width (1 to height)>,
 *				data: <data object in JSON format>
 *			},
 *			<e.t.c...>
 *		]
 *	};
 *
 * @class $N.gui.DynamicTable
 * @constructor
 * @extends $N.gui.GUIObject
 *
 * @param {Object} docRef
 * @param {Object} parent
 */
/*global DynamicTableController*/
(function ($N) {
	function DynamicTable(docRef, parent) {
		this._log = new $N.apps.core.Log("CommonGUI", "DynamicTable");
		DynamicTable.superConstructor.call(this, docRef);
		this._container = new $N.gui.Group(docRef);
		this._highlight = new $N.gui.Container(docRef, this._container);
		this._highlight.configure({
			cssClass: "dynamicTableHighlight",
			visible: false
		});
		this._tableContainer = new $N.gui.Group(docRef, this._container);
		this._tableItems = [];
		this._itemCount = 0;
		this._itemTemplate = null;
		this._itemConfig = {};
		this._data = {};
		this._dataMapper = null;

		this._itemHighlightedImmediateCallback = null;
		this._itemHighlightedCallback = null;
		this._itemSelectedCallback = null;

		this._tableScale = {};
		this._cellPadding = 24;

		this._rootCellIndex = null;

		this._emptyMessage = new $N.gui.Label(docRef, this._container);
		this._emptyMessage.configure({
			x: 3,
			y: 252,
			width: 1176,
			alignment: "centre",
			cssClass: "noMailText",
			visible: false
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
		this._controller = new $N.gui.DynamicTableController();
		this.hasFocus = false;
	}
	$N.gui.Util.extend(DynamicTable, $N.gui.GUIObject);

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	DynamicTable.prototype.setWidth = function (width) {
		this._width = width;
		this._container.setWidth(width);
		this._tableContainer.setWidth(width);
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	DynamicTable.prototype.setHeight = function (height) {
		this._height = height;
		this._container.setHeight(height);
		this._tableContainer.setHeight(height);
	};

	/**
	 * @method setCellPadding
	 * @param {Number} cellPadding
	 */
	DynamicTable.prototype.setCellPadding = function (cellPadding) {
		this._cellPadding = cellPadding;
	};

	/**
	 * @method setHighlightCssClass
	 * @param {String} cssClass
	 */
	DynamicTable.prototype.setHighlightCssClass = function (cssClass) {
		this._highlight.setCssClass(cssClass);
	};

	/**
	 * @method setHighlightRounding
	 * @param {Number} rounding
	 */
	DynamicTable.prototype.setHighlightRounding = function (rounding) {
		this._highlight.setRounding(rounding);
	};

	/**
	 * @method setItemTemplate
	 * @param {Object} itemTemplate
	 */
	DynamicTable.prototype.setItemTemplate = function (itemTemplate) {
		if (typeof itemTemplate === "string") {
			this._itemTemplate = window.$N.gui[itemTemplate] || window[itemTemplate];
		} else {
			this._itemTemplate = itemTemplate;
		}
	};


	/**
	 * @method setItemConfig
	 * @param {Object} configObj
	 */
	DynamicTable.prototype.setItemConfig = function (configObj) {
		this._itemConfig = configObj;
	};

	/**
	 * @method _highlightCell
	 * @param {Number} cellIndex
	 */
	DynamicTable.prototype._highlightCell = function (cellIndex) {
		this._log("_highlightCell", "Enter");
		var HIGHLIGHT_POSITION_OFFSET = -6,
			HIGHLIGHT_SCALE_OFFSET = 12,
			cellData = this._data.items[cellIndex],
			currentlyHighlightedCell = this._tableItems[this._controller.getSelectedCellIndex()];
		if (currentlyHighlightedCell && currentlyHighlightedCell.unHighlight) {
			currentlyHighlightedCell.unHighlight();
		}
		this._controller.setSelectedCellIndex(cellIndex);
		this._highlight.configure({
			x: (cellData.x * this._tableScale.x) + HIGHLIGHT_POSITION_OFFSET,
			y: (cellData.y * this._tableScale.y) + HIGHLIGHT_POSITION_OFFSET,
			width: (cellData.width * this._tableScale.x) - this._cellPadding + HIGHLIGHT_SCALE_OFFSET,
			height: (cellData.height * this._tableScale.y) - this._cellPadding + HIGHLIGHT_SCALE_OFFSET
		});
		this._handleItemHighlighted(cellData);
		this._log("_highlightCell", "Exit");
	};

	/**
	 * @method _unHighlightCell current highlighted cell
	 */
	DynamicTable.prototype._unHighlightCell = function () {
		var currentlyHighlightedCell = this._tableItems[this._controller.getSelectedCellIndex()];
		if (currentlyHighlightedCell && currentlyHighlightedCell.unHighlight) {
			currentlyHighlightedCell.unHighlight();
		}
	};

	/**
	 * @method _navigate
	 * @param {Number} direction Constant value: $N.app.constants.[UP|DOWN|LEFT|RIGHT]
	 */
	DynamicTable.prototype._navigate = function (direction) {
		this._log("_navigate", "Enter");
		var bestSearchResult = null;
		bestSearchResult = this._controller.getDestinationCellIndex(this._data.items, direction);
		if (bestSearchResult !== null) {
			this._highlightCell(bestSearchResult);
			return true;
		}
		this._log("_navigate", "Exit");
		return false;
	};

	/**
	 * @method _addCell
	 * @param {Number} index of the current cell
	 */
	DynamicTable.prototype._addCell = function (index) {
		this._log("_addCell", "Enter");
		var newCell = null,
			cellData = this._data.items[index],
			rootCellData = this._data.items[this._rootCellIndex];
		if (!this._itemTemplate) {
			throw ("DynamicTable - _addCell: No list item template provided");
		}
		if (this._tableItems.length > this._itemCount) {
			newCell = this._tableItems[this._itemCount];
			newCell.reset();
		} else {
			newCell = new this._itemTemplate(this._docRef, this._tableContainer);
			this._tableItems.push(newCell);
			newCell.hide();
		}
		this._itemCount = this._itemCount + 1;
		newCell.configure(this._itemConfig);
		newCell.configure({
			x: cellData.x * this._tableScale.x,
			y: cellData.y * this._tableScale.y,
			width: (cellData.width * this._tableScale.x) - this._cellPadding,
			height: (cellData.height * this._tableScale.y) - this._cellPadding
		});
		if (this._dataMapper && newCell.setDataMapper) {
			newCell.setDataMapper(this._dataMapper);
		}
		if (cellData.data) {
		    
            cellData.data.clickhandler = $N.app.PortalWindow.clicked;     //jrm
			newCell.configure(cellData.data);
		}
		newCell.show();

		if (!rootCellData || (cellData.x + cellData.y) < (rootCellData.x + rootCellData.y)) {
			this._rootCellIndex = index;
		}
		this._log("_addCell", "Exit");
	};

	/**
	 * @method _clearTable
	 */
	DynamicTable.prototype._clearTable = function () {
		this._log("_clearTable", "Enter");
		var i,
			tableLength = this._tableItems.length;
		for (i = 0; i < tableLength; i++) {
			this._tableItems[i].hide();
		}
		this._itemCount = 0;
		this._rootCellIndex = null;
		this._log("_clearTable", "Exit");
	};

	/**
	 * @method _drawTable
	 */
	DynamicTable.prototype._drawTable = function () {
		this._log("_drawTable", "Enter");
		var i,
			dataLength = this._data.items.length;
		this._clearTable();
		this._tableScale = {
			x: (Number(this._width) + Number(this._cellPadding)) / this._data.gridSize.width,
			y: (Number(this._height) + Number(this._cellPadding)) / this._data.gridSize.height
		};
		for (i = 0; i < dataLength; i++) {
			this._addCell(i);
		}
		this._log("_drawTable", "Exit");
	};

	/**
	 * @method setData
	 * @param {Object} data JSON data object containing necessary information to draw the table
	 */
	DynamicTable.prototype.setData = function (data) {
		var previousSelection = this._controller.getSelectedCellIndex(),
			dataLength = (data && data.items && data.items.length) ? data.items.length : 0;
		this._log("setData", "Enter");
		this._data = data;
		if (!dataLength) {
			this._clearTable();
		} else {
			this._drawTable();
			if (this.hasFocus) {
				previousSelection = (previousSelection < dataLength) ? previousSelection : 0;
				this._highlightCell(previousSelection);
			}
		}
		this._log("setData", "Exit");
	};

	/**
	 * @method initialise
	 */
	DynamicTable.prototype.initialise = function () {
		this._log("initialise", "Enter");
		var i,
			newCell,
			TABLE_INITIALISE_COUNT = 10;
		for (i = 0; i < TABLE_INITIALISE_COUNT; i++) {
			newCell = new this._itemTemplate(this._docRef, this._tableContainer);
			if (this._dataMapper && newCell.setDataMapper) {
				newCell.setDataMapper(this._dataMapper);
			}
			this._tableItems.push(newCell);
			newCell.hide();
		}
		this._log("initialise", "Exit");
	};

	/**
	 * @method preview
	 * @param {Object} data JSON data object containing necessary information to draw the table
	 *
	 */
	DynamicTable.prototype.preview = function (data) {
		this._log("preview", "Enter");
		if (data) {
			this._emptyMessage.hide();
			this.setData(data);
		} else {
			this.setData(null);
			this._emptyMessage.show();
		}
		this._log("preview", "Exit");
	};

	/**
	 * @method activate
	 */
	DynamicTable.prototype.activate = function () {
		this._log("activate", "Enter");
		this._highlightCell(this._rootCellIndex);
		this._highlight.show();
		this.hasFocus = true;
		this._log("activate", "Exit");
	};

	/**
	 * @method setRootCellIndex
	 * @param {Number} index : sets the _rootCellIndex to the specified index.
	 */
	DynamicTable.prototype.setRootCellIndex = function (index) {
		this._log("setRootCellIndex", "Enter");
		this._rootCellIndex = index;
		this._log("setRootCellIndex", "Exit");
	};
	/**
	 * @method getController
	 */
	DynamicTable.prototype.getController = function () {
		return this._controller;
	};

	/**
	 * @method activate
	 */
	DynamicTable.prototype.passivate = function () {
		this._log("passivate", "Enter");
		var selectedItem = this._tableItems[this._controller.getSelectedCellIndex()];
		if (selectedItem && selectedItem.unHighlight) {
			selectedItem.unHighlight();
		}
		this._highlight.hide();
		this.hasFocus = false;
		this._log("passivate", "Exit");
	};

	/**
	 * @method _handleItemHighlighted
	 * @private
	 * @param {Object} item
	 */
	DynamicTable.prototype._handleItemHighlighted = function (item) {
		var me = this,
			tableItem;
		tableItem = this._tableItems[this._controller.getSelectedCellIndex()];
		if (tableItem && tableItem.highlight) {
			tableItem.highlight();
		}
		if (this._itemHighlightedImmediateCallback) {
			this._itemHighlightedImmediateCallback(item);
		}
	};

	/**
	 * @method setItemSelectedCallback
	 * @param {Function} callback
	 */
	DynamicTable.prototype.setItemSelectedCallback = function (callback) {
		this._itemSelectedCallback = callback;
	};

	/**
	 * @method setItemHighlightedCallback
	 * @param {Object} callback
	 */
	DynamicTable.prototype.setItemHighlightedCallback = function (callback) {
		this._itemHighlightedCallback = callback;
	};

	/**
	 * @method setItemHighlightedImmediateCallback
	 * @param {Object} callback
	 */
	DynamicTable.prototype.setItemHighlightedImmediateCallback = function (callback) {
		this._itemHighlightedImmediateCallback = callback;
	};

	/**
	 * @method doForAllItems
	 * @param {function} runMe The function to run on each item in the table
	 */
	DynamicTable.prototype.doForAllItems = function (runMe) {
		var i,
			loopLength = this._tableItems.length;
		for (i = 0; i < loopLength; i++) {
			runMe(this._tableItems[i]);
		}
	};

	/**
	 * @method setEmptyText
	 * @param {String} emptyText
	 */
	DynamicTable.prototype.setEmptyText = function (emptyText) {
		this._emptyMessage.setText(emptyText);
	};

	/**
	 * @method setDataMapper
	 * @param {Object} dataMapper
	 */
	DynamicTable.prototype.setDataMapper = function (dataMapper) {
		this._dataMapper = dataMapper;
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	DynamicTable.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false,
			selectedCellIndex = this._controller.getSelectedCellIndex();
		switch (key) {
		case keys.KEY_LEFT:
			handled = this._navigate($N.app.constants.LEFT);
			break;
		case keys.KEY_RIGHT:
			handled = this._navigate($N.app.constants.RIGHT);
			break;
		case keys.KEY_UP:
			handled = this._navigate($N.app.constants.UP);
			break;
		case keys.KEY_DOWN:
			handled = this._navigate($N.app.constants.DOWN);
			break;
		case (keys.KEY_LEFT + this._KEY_RELEASE_SUFFIX):
		case (keys.KEY_RIGHT + this._KEY_RELEASE_SUFFIX):
		case (keys.KEY_UP + this._KEY_RELEASE_SUFFIX):
		case (keys.KEY_DOWN + this._KEY_RELEASE_SUFFIX):
			if (this._itemHighlightedCallback && selectedCellIndex !== null) {
				this._itemHighlightedCallback(this._data.items[selectedCellIndex]);
			}
			handled = true;
			break;
		}

		if (handled === false && selectedCellIndex !== null && this._tableItems[selectedCellIndex] && this._tableItems[selectedCellIndex].keyHandler) {
			handled = this._tableItems[selectedCellIndex].keyHandler(key);
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	$N.gui = $N.gui || {};
	$N.gui.DynamicTable = DynamicTable;
}($N || {}));
