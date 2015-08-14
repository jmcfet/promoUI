/**
 * Mosaic contains the logic for row objects within a mosaic menu.
 * It is used with a MosaicMenu object to add new rows and navigate between rows.
 * @class $N.gui.Mosaic
 *
 * @requires $N.gui.BasicList
 * @constructor
 * @param {Object} rowObject
 * @param {Object} my
 */


define('jsfw/gui/Logic/List/Mosaic',
    [
    'jsfw/gui/Logic/List/List'
    ],
    function (List) {

		var Mosaic = function (rowObject, my) {

			my = my || {};
			$N.gui.BasicList.call(this, rowObject, my);
			var superClass = {};

			var itemsWide;

			this.initialize = function () {
				my.lastRow = 0;
				my.listItems = [];
			};


			/**
			 * Returns the amount of items per row
			 * @method getItemsWide
			 * @return {Number} amount of items
			 */
			this.getItemsWide = function () {
				return itemsWide;
			};

			/**
			 * Sets the amount of items per row
			 * @method setItemsWide
			 */
			this.setItemsWide = function (noOfItems) {
				itemsWide = parseInt(noOfItems, 10);
			};

			/**
			 * Adds the given item to the mosaic
			 * @method addExistingItem
			 * @param {Object} item the item to be added
			 */
			this.addExistingItem = function (item) {
				my.listItems[my.listItems.length] = item;
				my.lastRow++;
			};

			/**
			 * Selects the item directly above the currently selected item
			 * @method selectAbove
			 */
			this.selectAbove = function () {
				var indexAbove = this.getActualSelectedRowIndex() - this.getItemsWide();
				if (indexAbove < 1) {
					var rows = Math.ceil(this.getSize() / this.getItemsWide());
					var offset = (rows * this.getItemsWide()) + indexAbove;
					var newIndex = offset > this.getSize() ? offset - this.getItemsWide() : offset;
					this.selectRowAtIndex(newIndex);
				} else {
					this.selectRowAtIndex(indexAbove);
				}
			};

			/**
			 * Selects the item directly below the currently selected item
			 * @method selectBelow
			 */
			this.selectBelow = function () {
				var indexBelow = this.getActualSelectedRowIndex() + this.getItemsWide();
				if (indexBelow > this.getSize()) {
					var offset = 1 + ((indexBelow - 1) % this.getItemsWide());
					this.selectRowAtIndex(offset);
				} else {
					this.selectRowAtIndex(indexBelow);
				}
			};

			/**
			 * Returns the column number that the last item in the Mosaic Menu is in
			 * @method getXIndexOfLast
			 * @return {Number} the column that the last item in the Mosaic Menu is in
			 */
			this.getXIndexOfLast = function () {
				return (1 + ((my.lastRow - 1) % this.getItemsWide()));
			};

			/**
			 * Returns the row that the last item in the Mosaic Menu is in
			 * @method getYIndexOfLast
			 * @return {Number} the row that the last item in the Mosaic Menu is in
			 */
			this.getYIndexOfLast = function () {
				return Math.ceil(this.getSize() / this.getItemsWide());
			};

			/**
			 * Determines whether the currently selected item is at the last column
			 * @method isAtLastColumn
			 * @return {Boolean} true if the currently selected item is at the last column;
			 * false otherwise
			 */
			this.isSelectedItemAtLastColumn = function () {
				return ((this.getActualSelectedRowIndex() % this.getItemsWide()) === 0);
			};

			/**
			 * Determines whether the currently selected item is at the first column
			 * @method isAtFirstColumn
			 * @return {Boolean} true if the currently selected item is at the first column;
			 * false otherwise
			 */
			this.isSelectedItemAtFirstColumn = function () {
				return ((this.getActualSelectedRowIndex() % this.getItemsWide()) === 1);
			};
		};
		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.Mosaic = Mosaic;
		return Mosaic;
	}
);