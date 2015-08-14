/**
 * A GeneralMosaicTile object is a graphical object made up of a border
 * containing a picture, title and subtitle. These tiles can be added to
 * a MosaicMenu (or objects derived from it).
 * @class $N.gui.GeneralMosaicTile
 * @extends $N.gui.AbstractMosaicTile
 *
 * @requires $N.gui.Container
 * @requires $N.gui.Image
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @requires $N.gui.AbstractMosaicTile
 *
 * @constructor
 * @param {Object} docRef Reference to the DOM
 * @param {Object} tileData Object holding the underlying data for the tile
 */
define('jsfw/gui/GUIObjects/Controls/List/GeneralMosaicTile',
    [
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Components/Image',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Controls/List/AbstractMosaicTile'
    ],
    function (Container, Image, Label, Util, AbstractMosaicTile) {

		function GeneralMosaicTile(docRef, tileData) {
			GeneralMosaicTile.superConstructor.call(this, docRef);

			this._container = new $N.gui.Container(this._docRef);
			this._container.setRounding(4);
			this._rootElement = this._container.getRootElement();

			this._highlighter = new $N.gui.Container(this._docRef, this._container);
			this._highlighter.setRounding(4);
			this._highlighter.setCssClass("mosaic-box-unhighlight");
			this._highlighter.setCssHighlightClass("mosaic-box-highlight");

			this._image = new $N.gui.Image(docRef, this._container);
			this._title = new $N.gui.Label(docRef, this._container);
			this._subTitle = new $N.gui.Label(docRef, this._container);
		}

		$N.gui.Util.extend(GeneralMosaicTile, $N.gui.AbstractMosaicTile);

		/**
		 * Set CSS styling methods (used to override mosaic styling)
		 * @method setContainerCssStyle
		 * @deprecated use classes
		 * @param {Object} style
		 */
		GeneralMosaicTile.prototype.setCssStyle = function (style) {
			this._highlighter.setCssStyle(style);
		};

		/**
		 * Sets the style to be used to highlight the tile
		 * @method setContainerCssHighlightStyle
		 * @deprecated use classes
		 * @param {Object} style
		 */
		GeneralMosaicTile.prototype.setCssHighlightStyle = function (style) {
			this._highlighter.setCssHighlightStyle(style);
		};

		/**
		 * Sets the CSS class to be used to style this tile
		 * when not highlighted
		 * @method setContainerCssClass
		 * @param {String} cssClass
		 */
		GeneralMosaicTile.prototype.setCssClass = function (cssClass) {
			this._highlighter.setCssClass(cssClass);
		};

		/**
		 * Sets the CSS class to be used to style this tile
		 * when highlighted
		 * @method setContainerCssHighlightClass
		 * @param {String} cssClass
		 */
		GeneralMosaicTile.prototype.setCssHighlightClass = function (cssClass) {
			this._highlighter.setCssHighlightClass(cssClass);
		};

		/**
		 * Shows the tile as highlighted in the mosaic
		 * @method highLight
		 */
		GeneralMosaicTile.prototype.highlight = function () {
			this._highlighter.highLight();
		};

		/**
		 * Shows the tile as normal in the mosaic
		 * @method unHighLight
		 */
		GeneralMosaicTile.prototype.unHighlight = function () {
			this._highlighter.unHighLight();
		};

		/**
		 * Sets the rounding value to be used on the tile border
		 * @method setContainerRounding
		 * @param {Number} rounding
		 */
		GeneralMosaicTile.prototype.setContainerRounding = function (rounding) {
			this._container.setRounding(rounding);
			this._highlighter.setRounding(rounding);
		};

		/**
		 * Sets the width of the mosaic tile, usually this method
		 * wouldn't be called directly but would be called from
		 * the Mosaic menu to keep a uniform look.
		 * @method setWidth
		 * @param {Number} newWidth
		 */
		GeneralMosaicTile.prototype.setWidth = function (newWidth) {
			GeneralMosaicTile.superClass.setWidth.call(this, newWidth);
			this._highlighter.setWidth(this._width - 10);
		};

		/**
		 * Sets the height of the mosaic tile, usually this method
		 * wouldn't be called directly but would be called from
		 * the Mosaic menu to keep a uniform look.
		 * @method setHeight
		 * @param {Object} newHeight
		 */
		GeneralMosaicTile.prototype.setHeight = function (newHeight) {
			GeneralMosaicTile.superClass.setHeight.call(this, newHeight);
			this._highlighter.setHeight(this._height);
		};

		/**
		 * Sets the tile's image URL
		 * @method setImageUrl
		 * @param {String} url URL of the tile's image
		 */
		GeneralMosaicTile.prototype.setImageUrl = function (url) {
			if (url) {
				this._image.setHref(url);
			}
		};

		/**
		 * Sets the tile's title
		 * @method setTitle
		 * @param {String} title Title of the tile
		 */
		GeneralMosaicTile.prototype.setTitle = function (title) {
			if (title) {
				this._title.setText(title);
			}
		};

		/**
		 * Sets the tile's subtitle
		 * @method setSubtitle
		 * @param {String} subtitle Subtitle of the tile
		 */
		GeneralMosaicTile.prototype.setSubtitle = function (subtitle) {
			if (subtitle) {
				this._subTitle.setText(subtitle);
			}
		};

		/**
		 * Configure's the class' components
		 * @method configure
		 */
		GeneralMosaicTile.prototype.configure = function () {
			if (!this._itemConfig) {
				throw ('GeneralMosaicTile - configure: item configuration details not found');
			}
			if (this._itemConfig.x) {
				this.setX(this._itemConfig.x);
			}
			if (this._itemConfig.y) {
				this.setY(this._itemConfig.y);
			}
			if (this._itemConfig.height) {
				this.setHeight(this._itemConfig.height);
			} else {
				this.setHeight(200);
			}
			if (this._itemConfig.width) {
				this.setWidth(this._itemConfig.width);
			} else {
				this.setWidth(200);
			}

			this._image.setX(5);
			this._image.setY(5);
			this._image.setWidth(180);
			this._image.setHeight(125);

			this._title.setX(200);
			this._title.setY(30);
			this._title.setWidth(100);
			this._title.setHeight(30);

			this._subTitle.setX(200);
			this._subTitle.setY(50);
			this._subTitle.setWidth(100);
			this._subTitle.setHeight(50);
		};

		/**
		 * Method to update the tile. Throws an exception if data is not supplied
		 * @method update
		 * @param {Object} data JS object containing the data to update the tile with
		 */
		GeneralMosaicTile.prototype.update = function (data) {
			if (!data && !this._data) {
				throw ('GeneralMosaicTile - update: no data found to update tile with');
			}
			this.setData(data);
			this.setTitle(this._dataMapper.getTitle(data));
			this.setSubtitle(this._dataMapper.getSubtitle(data));
			this.setImageUrl(this._dataMapper.getImageUrl(data));
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.GeneralMosaicTile = GeneralMosaicTile;
		return GeneralMosaicTile;
	}
);