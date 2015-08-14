/**
 * A MosaicTile object is a graphical object made up of
 * a border containing a picture and text.  These tiles can
 * be added to a MosaicMenu.
 * @class $N.gui.MosaicTile
 * @extends $N.gui.GUIObject
 *
 * @requires $N.gui.Container
 * @requires $N.gui.Image
 * @requires $N.gui.Label
 * @requires $N.gui.GUIObject
 * @requires $N.gui.Util
 *
 * @constructor
 * @param {Object} docRef Reference to the DOM
 * @param {Object} tileDataObj Object holding the underlying data
 * @param {Object} tileUrl points to the href of a picture
 * @param {Object} tileType for future use
 */
define('jsfw/gui/GUIObjects/Controls/List/MosaicTile',
    [
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Components/Image',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/helpers/Util'
    ],
    function (Container, Image, Label, GUIObject, Util) {

		function MosaicTile(docRef, tileDataObj, tileUrl, tileType) {

			MosaicTile.superConstructor.call(this, docRef);

			this._container = new $N.gui.Container(this._docRef);
			this._image = new $N.gui.Image(this._docRef, this._container);
			this._label = new $N.gui.Label(this._docRef, this._container);

			this._rootElement = this._container.getRootElement();

			this._container.setRounding(4);
			this._container.setCssClass("mosaicTileNormal");
			this._container.setCssHighlightClass("mosaicTileHighlight");
			this._image.setX(10);
			this._image.setY(10);
			this._label.setAlignment($N.gui.Label.ALIGN_CENTRE);
			this._label.setCssClass("mosaicTileText");

			this._width = 0;
			this._height = 0;
			this._title = "";
			this._dataObj = tileDataObj;
			this._url = tileUrl;
			this._type = tileType;
		}

		Util.extend(MosaicTile, GUIObject);

		/**
		 * Sets the width of the mosaic tile, usually this method
		 * wouldn't be called directly but would be called from
		 * the Mosaic menu to keep a uniform look.
		 * @method setWidth
		 * @param {Number} newWidth
		 */
		MosaicTile.prototype.setWidth = function (newWidth) {
			this._width = newWidth;
			this._container.setWidth(this._width);
			this._image.setWidth(this._width - 20);
			this._label.setWidth(this._width - 20);
			this._label.setX(this._width / 2);
			this._label.setAlignment($N.gui.Label.ALIGN_CENTRE);
		};

		/**
		 * Sets the height of the mosaic tile, usually this method
		 * wouldn't be called directly but would be called from
		 * the Mosaic menu to keep a uniform look.
		 * @method setHeight
		 * @param {Object} newHeight
		 */
		MosaicTile.prototype.setHeight = function (newHeight) {
			this._height = newHeight;
			this._container.setHeight(this._height);
			this._image.setHeight(this._height - 30);
			this._label.setY(this._height - 10);
		};

		/**
		 * Sets the title to be displayed for this tile
		 * @method setTitle
		 * @param {String} newTitle
		 */
		MosaicTile.prototype.setTitle = function (newTitle) {
			this._title = newTitle;
			this._label.setText(this._title);
		};

		/**
		 * Sets the data that this tile holds, e.g the tile may
		 * hold EPG event data for example
		 * @method setDataObj
		 * @param {Object} newDataObj
		 */
		MosaicTile.prototype.setDataObj = function (newDataObj) {
			this._dataObj = newDataObj;
		};

		/**
		 * Sets the URL for the picture to be displayed on the tile
		 * @method setUrl
		 * @param {String} newUrl
		 */
		MosaicTile.prototype.setUrl = function (newUrl) {
			this._url = newUrl;
			this._image.setHref(this._url);
		};

		/**
		 * Sets the type of the tile. This is for future use so
		 * that tiles could have video instead of pictures
		 * @method setType
		 * @param {String} newType
		 */
		MosaicTile.prototype.setType = function (newType) {
			this._type = newType;
			//TODO: can set between video and image
		};

		/**
		 * Returns the width of this tile
		 * @method getWidth
		 * @return {Number}
		 */
		MosaicTile.prototype.getWidth = function () {
			return this._width;
		};

		/**
		 * Returns the height of this tile
		 * @method getHeight
		 * @return {Number}
		 */
		MosaicTile.prototype.getHeight = function () {
			return this._height;
		};

		/**
		 * Returns the title of this mosaic tile object
		 * @method getTitle
		 * @return {String}
		 */
		MosaicTile.prototype.getTitle = function () {
			return this._title;
		};

		/**
		 * Returns the data stored in the tile object
		 * @method getDataObj
		 * @return {Object}
		 */
		MosaicTile.prototype.getDataObj = function () {
			return this._dataObj;
		};

		/**
		 * Returns the URL of the picture for this tile
		 * @method getUrl
		 * @return {String}
		 */
		MosaicTile.prototype.getUrl = function () {
			return this._url;
		};

		/**
		 * Returns the type of this tile, not currently used
		 * @method getType
		 * @return {String}
		 */
		MosaicTile.prototype.getType = function () {
			return this._type;
		};

		/**
		 * Shows the tile as highlighted in the mosaic
		 * @method highLight
		 */
		MosaicTile.prototype.highLight = function () {
			this._container.highLight();
		};

		/**
		 * Shows the tile as normal in the mosaic
		 * @method unHighLight
		 */
		MosaicTile.prototype.unHighLight = function () {
			this._container.unHighLight();
		};

		/**
		 * Sets the rounding value to be used on the tile
		 * border
		 * @method setContainerRounding
		 * @param {Number} rounding
		 */
		MosaicTile.prototype.setContainerRounding = function (rounding) {
			this._container.setRounding(rounding);
		};

		/**
		 * Set CSS styling methods (used to override mosaic styling)
		 * @method setContainerCssStyle
		 * @deprecated use classes
		 * @param {Object} style
		 */
		MosaicTile.prototype.setContainerCssStyle = function (style) {
			this._container.setCssStyle(style);
		};

		/**
		 * Sets the style to be used to highlight the tile
		 * @method setContainerCssHighlightStyle
		 * @deprecated use classes
		 * @param {Object} style
		 */
		MosaicTile.prototype.setContainerCssHighlightStyle = function (style) {
			this._container.setCssHighlightStyle(style);
		};

		/**
		 * Sets the style of the label
		 * @method setLabelCssStyle
		 * @deprecated uses classes
		 * @param {Object} style
		 */
		MosaicTile.prototype.setLabelCssStyle = function (style) {
			this._label.setCssStyle(style);
		};

		/**
		 * Sets the CSS class to be used to style this tile
		 * when not highlighted
		 * @method setContainerCssClass
		 * @param {String} cssClass
		 */
		MosaicTile.prototype.setContainerCssClass = function (cssClass) {
			this._container.setCssClass(cssClass);
		};

		/**
		 * Sets the CSS class to be used to style this tile
		 * when highlighted
		 * @method setContainerCssHighlightClass
		 * @param {String} cssClass
		 */
		MosaicTile.prototype.setContainerCssHighlightClass = function (cssClass) {
			this._container.setCssHighlightClass(cssClass);
		};

		/**
		 * Sets the CSS class to be used to style the title of
		 * the tile
		 * @method setLabelCssClass
		 * @param {String} cssClass
		 */
		MosaicTile.prototype.setLabelCssClass = function (cssClass) {
			this._label.setCssClass(cssClass);
		};

		/**
		 * Returns the name of this class
		 * @method getClassName
		 * @return {String}
		 */
		MosaicTile.prototype.getClassName = function () {
			return ("MosaicTile");
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.MosaicTile = MosaicTile;
		return MosaicTile;
	}
);