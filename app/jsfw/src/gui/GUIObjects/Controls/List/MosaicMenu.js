/**
 * MosaicMenu is a grid type control where each item can be
 * navigated to using left and right or up and down. The graphical
 * representation is made up of uniformly spaced tiles
 * @class $N.gui.MosaicMenu
 * @extends $N.gui.GUIObject
 *
 * @requires $N.gui.Mosaic
 * @requires $N.gui.Container
 * @requires $N.gui.GUIObject
 * @requires $N.gui.Util
 * @requires $N.gui.FrameworkCore
 *
 * @constructor
 * @param {Object} docRef
 */
define('jsfw/gui/GUIObjects/Controls/List/MosaicMenu',
    [
    'jsfw/gui/Logic/List/Mosaic',
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/FrameworkCore'
    ],
    function (Mosaic, Container, GUIObject, Util, FrameworkCore) {

		function MosaicMenu(docRef) {
			var my = {};
			MosaicMenu.superConstructor.call(this, docRef);
			$N.gui.Mosaic.call(this, null, my);
			this._tileWidth = 140;
			this._tileHeight = 140;
			this._hSpace = 40;
			this._vSpace = 40;
			this._container = new $N.gui.Container(this._docRef);
			this._rootElement = this._container.getRootElement();
			this.itemSelectedCallback = function () {
				return null;
			};
			this.okCallback = function () {
				return null;
			};
			this._container.setCssStyle("display:none");
		}

		$N.gui.Util.extend(MosaicMenu, $N.gui.GUIObject);

		/**
		 * Returns an object representing the x and y position of the
		 * selected tile
		 * @method getSelectedTilePosition
		 * @return {Object} with properties x and y
		 */
		MosaicMenu.prototype.getSelectedTilePosition = function () {
			var selectedItem = this.getSelectedItem();
			return {
				x: selectedItem.getX(),
				y: selectedItem.getY()
			};
		};

		/**
		 * Sets the width to be used for tiles when new ones are
		 * added to the mosaic
		 * @method setTileWidth
		 * @param {Number} width
		 */
		MosaicMenu.prototype.setTileWidth = function (width) {
			this._tileWidth = width;
			//TODO: need to apply new size to any existing tiles...
		};

		/**
		 * Sets the height to be used for tiles when new ones
		 * are added to the mosaic
		 * @method setTileHeight
		 * @param {Number} height
		 */
		MosaicMenu.prototype.setTileHeight = function (height) {
			this._tileHeight = height;
			//TODO: need to apply new size to any existing tiles...
		};

		/**
		 * Sets the horizontal spacing to be used between tiles
		 * that are added to the mosaic
		 * @method setHSpace
		 * @param {Object} space
		 */
		MosaicMenu.prototype.setHSpace = function (space) {
			this._hSpace = space;
			//TODO: need to apply new spacing to any existing tiles...
		};

		/**
		 * Sets the vertical spacing to be used between tiles
		 * that are added to the mosaic
		 * @method setVSpace
		 * @param {Number} space
		 */
		MosaicMenu.prototype.setVSpace = function (space) {
			this._vSpace = space;
			//TODO: need to apply new spacing to any existing tiles...
		};

		/**
		 * Returns the width used when adding tiles to the mosaic
		 * @method getTileWidth
		 * @return {Number}
		 */
		MosaicMenu.prototype.getTileWidth = function () {
			return this._tileWidth;
		};

		/**
		 * Returns the height used when adding tiles to the mosaic
		 * @method getTileHeight
		 * @return {Number}
		 */
		MosaicMenu.prototype.getTileHeight = function () {
			return this._tileHeight;
		};

		/**
		 * Returns the horizontal space between tiles
		 * @method getHSpace
		 * @return {Number}
		 */
		MosaicMenu.prototype.getHSpace = function () {
			return this._hSpace;
		};

		/**
		 * Returns the vertical space between tiles
		 * @method getVSpace
		 * @return {Number}
		 */
		MosaicMenu.prototype.getVSpace = function () {
			return this._vSpace;
		};

		/**
		 * Resets the mosaic so that the first item is highlighted
		 * @method reset
		 */
		MosaicMenu.prototype.reset = function () {
			this.getSelectedItem().unHighLight();
			this.selectRowAtIndex(1);
		};

		/**
		 * Adds the given instantiated tile to the mosaic.  The tile object
		 * is usually one of MosaicTile or AnimatedMosaicTile although
		 * new tile objects could be created if they conform to the same
		 * interface
		 * @method addNewMenuItem
		 * @param {Object} tileObj
		 */
		MosaicMenu.prototype.addNewMenuItem = function (tileObj) {
			tileObj.setWidth(this._tileWidth);
			tileObj.setHeight(this._tileHeight);
			this.addExistingItem(tileObj);
			var xPos = (this.getXIndexOfLast() - 1) * (this._tileWidth + this._hSpace);
			var yPos = (this.getYIndexOfLast() - 1) * (this._tileHeight + this._vSpace);
			tileObj.setX(xPos);
			tileObj.setY(yPos);
			this._rootElement.appendChild(tileObj.getRootElement());
		};

		/**
		 * Removes all the tiles from the mosaic menu
		 * @method removeMenuItems
		 */
		MosaicMenu.prototype.removeMenuItems = function () {
			this.initialize();
			while (this._rootElement.hasChildNodes()) {
				this._rootElement.removeChild(this._rootElement.lastChild);
			}
		};


		/**
		 * Receives keys from the UI and responds to the direction
		 * keys moving the highlight around the mosaic. Returns
		 * true if the key was handled.
		 * @method keyHandler
		 * @param {String} key
		 * @return {Boolean}
		 */
		MosaicMenu.prototype.keyHandler = function (key) {
			var handled = false;
			var keys = $N.gui.FrameworkCore.getKeys();
			switch (key) {
			case keys.KEY_LEFT:
				this.getSelectedItem().unHighLight();
				this.selectPrevious();
				this.getSelectedItem().highLight();
				this.itemSelectedCallback(this.getSelectedItem().getDataObj());
				handled = true;
				break;
			case keys.KEY_UP:
				this.getSelectedItem().unHighLight();
				this.selectAbove();
				this.getSelectedItem().highLight();
				this.itemSelectedCallback(this.getSelectedItem().getDataObj());
				handled = true;
				break;
			case keys.KEY_RIGHT:
				this.getSelectedItem().unHighLight();
				this.selectNext();
				this.getSelectedItem().highLight();
				this.itemSelectedCallback(this.getSelectedItem().getDataObj());
				handled = true;
				break;
			case keys.KEY_DOWN:
				this.getSelectedItem().unHighLight();
				this.selectBelow();
				this.getSelectedItem().highLight();
				this.itemSelectedCallback(this.getSelectedItem().getDataObj());
				handled = true;
				break;
			case keys.KEY_OK:
				this.okCallback(this.getSelectedItem().getDataObj());
				handled = true;
				break;
			default: //nothing
			}
			return handled;
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.MosaicMenu = MosaicMenu;
		return MosaicMenu;
	}
);