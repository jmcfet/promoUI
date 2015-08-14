/**
 * AbstractMosaicTile is an abstract class, providing a template for classes that
 * can be used as tiles in a mosaic type list. It allows for dynamic item configuration
 * and update. Basic framework for highlighting a tile is provided.
 * Concrete implementations of this class will benefit from having to worry only about
 * the layout of various elements in the tile, and how the tile should update its appearance
 * based on the underlying data.
 *
 * @class $N.gui.AbstractMosaicTile
 * @extends $N.gui.AbstractListItem
 *
 * @requires $N.gui.Util
 * @requires $N.gui.AbstractListItem
 *
 * @constructor
 * @param {Object} docRef Reference to the DOM
 * @param {Object} tileData Object holding the underlying data
 */
define('jsfw/gui/GUIObjects/Controls/List/AbstractMosaicTile',
    [
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Controls/List/customisable/AbstractListItem'
    ],
    function (Util, AbstractListItem) {

		function AbstractMosaicTile(docRef, tileData) {
			AbstractMosaicTile.superConstructor.call(this, docRef);

			this._width = 0;
			this._height = 0;
			this._data = tileData;
			this._dataMapper = {};
			this._itemConfig = {};
		}

		$N.gui.Util.extend(AbstractMosaicTile, $N.gui.AbstractListItem);

		/**
		 * Sets the item configuration object
		 * @method setItemConfig
		 * @param {Object} configObj Data that helps configure the object's GUI
		 */
		AbstractMosaicTile.prototype.setItemConfig = function (configObj) {
			this._itemConfig = configObj;
		};

		/**
		 * Sets the width of the mosaic tile. Usually this method
		 * wouldn't be called directly but would be called from
		 * the Mosaic menu to keep a uniform look.
		 * @method setWidth
		 * @param {Number} newWidth
		 */
		AbstractMosaicTile.prototype.setWidth = function (newWidth) {
			this._width = newWidth;
		};

		/**
		 * Sets the height of the mosaic tile. Usually this method
		 * wouldn't be called directly but would be called from
		 * the Mosaic menu to keep a uniform look.
		 * @method setHeight
		 * @param {Object} newHeight
		 */
		AbstractMosaicTile.prototype.setHeight = function (newHeight) {
			this._height = newHeight;
		};

		/**
		 * Sets the data that this tile holds, e.g the tile may
		 * hold EPG event data for example
		 * @method setData
		 * @param {Object} newData
		 */
		AbstractMosaicTile.prototype.setData = function (newData) {
			this._data = newData;
		};

		/**
		 * Returns the width of this tile
		 * @method getWidth
		 * @return {Number}
		 */
		AbstractMosaicTile.prototype.getWidth = function () {
			return this._width;
		};

		/**
		 * Returns the height of this tile
		 * @method getHeight
		 * @return {Number}
		 */
		AbstractMosaicTile.prototype.getHeight = function () {
			return this._height;
		};

		/**
		 * Configure's the class' components. Any additional configuration can be performed
		 * by the implementer.
		 * @method configure
		 */
		AbstractMosaicTile.prototype.configure = function () {
			if (!this._itemConfig) {
				throw ('AbstractMosaicTile - configure: item configuration details not found');
			}
			AbstractMosaicTile.superClass.configure.call(this, this._itemConfig);
		};

		/**
		 * Method to update the tile. Throws an exception if data is not supplied
		 * @method update
		 * @param {Object} data JS object containing the data to update the tile with
		 */
		AbstractMosaicTile.prototype.update = function (data) {
			if (!data && !this._data) {
				throw ('AbstractMosaicTile - update: no data found to update tile with');
			}
			// the actual update mechanism will be left to the implementer
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.AbstractMosaicTile = AbstractMosaicTile;
		return AbstractMosaicTile;
	}
);