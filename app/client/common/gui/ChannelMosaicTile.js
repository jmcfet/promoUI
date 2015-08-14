/**
 * A ChannelMosaicTile object is a graphical object made up of a border
 * containing a picture, title and subtitle. These tiles can be added to
 * a MosaicMenu (or objects derived from it).
 * @class $N.gui.ChannelMosaicTile
 * @constructor
 * @extends $N.gui.AbstractMosaicTile
 * @param {Object} docRef Reference to the DOM
 * @param {Object} tileData Object holding the underlying data for the tile
 */
(function ($N) {

	function ChannelMosaicTile(docRef, tileData) {
		ChannelMosaicTile.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "ChannelMosaicTile");

		this.isHighlighted = false;

		this._container = new $N.gui.Container(this._docRef);
		this._container.setRounding(4);
		this._rootElement = this._container.getRootElement();

		this._highlighter = new $N.gui.Container(this._docRef, this._container);
		this._highlighter.configure({
			x: -6,
			y: -6,
			width: 108,
			height: 108,
			cssClass: "mosaicChannelHighlight",
			rounding: 4,
			visible: true
		});

		this._channelLogo = new $N.gui.ChannelLogo(this._docRef, this._container);
		this._channelLogo.configure({
			x: 0,
			y: 0,
			width: 96,
			height: 96
		});
	}

	$N.gui.Util.extend(ChannelMosaicTile, $N.gui.AbstractMosaicTile);

	/**
	 * Set CSS styling methods (used to override mosaic styling)
	 * @method setContainerCssStyle
	 * @deprecated use classes
	 * @param {Object} style
	 */
	ChannelMosaicTile.prototype.setCssStyle = function (style) {
		this._highlighter.setCssStyle(style);
	};

	/**
	 * Sets the style to be used to highlight the tile
	 * @method setContainerCssHighlightStyle
	 * @deprecated use classes
	 * @param {Object} style
	 */
	ChannelMosaicTile.prototype.setCssHighlightStyle = function (style) {
		this._highlighter.setCssHighlightStyle(style);
	};

	/**
	 * Sets the CSS class to be used to style this tile
	 * when not highlighted
	 * @method setContainerCssClass
	 * @param {String} cssClass
	 */
	ChannelMosaicTile.prototype.setCssClass = function (cssClass) {
		this._highlighter.setCssClass(cssClass);
	};

	/**
	 * Sets the CSS class to be used to style this tile
	 * when highlighted
	 * @method setContainerCssHighlightClass
	 * @param {String} cssClass
	 */
	ChannelMosaicTile.prototype.setCssHighlightClass = function (cssClass) {
		this._highlighter.setCssHighlightClass(cssClass);
	};

	/**
	 * Shows the tile as highlighted in the mosaic
	 * @method highLight
	 */
	ChannelMosaicTile.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * Shows the tile as normal in the mosaic
	 * @method unHighLight
	 */
	ChannelMosaicTile.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	ChannelMosaicTile.prototype.updateHighlight = function () {
		if (this.isHighlighted) {
			this._highlighter._innerElement.style.visibility = "visible";
		} else {
			this._highlighter._innerElement.style.visibility = "hidden";
		}
	};

	/**
	 * Sets the rounding value to be used on the tile border
	 * @method setContainerRounding
	 * @param {Number} rounding
	 */
	ChannelMosaicTile.prototype.setContainerRounding = function (rounding) {
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
	ChannelMosaicTile.prototype.setWidth = function (newWidth) {
		ChannelMosaicTile.superClass.setWidth.call(this, newWidth);
		this._highlighter.setWidth(this._width - 10);
	};

	/**
	 * Sets the height of the mosaic tile, usually this method
	 * wouldn't be called directly but would be called from
	 * the Mosaic menu to keep a uniform look.
	 * @method setHeight
	 * @param {Object} newHeight
	 */
	ChannelMosaicTile.prototype.setHeight = function (newHeight) {
		ChannelMosaicTile.superClass.setHeight.call(this, newHeight);
		this._highlighter.setHeight(this._height);
	};

	/**
	 * Configure's the class' components
	 * @method configure
	 */
	ChannelMosaicTile.prototype.configure = function () {
		if (!this._itemConfig) {
			throw ('ChannelMosaicTile - configure: item configuration details not found');
		}
	};

	/**
	 * Method to update the tile. Throws an exception if data is not supplied
	 * @method update
	 * @param {Object} data JS object containing the data to update the tile with
	 */
	ChannelMosaicTile.prototype.update = function (data) {
		if (!data && !this._data) {
			throw ('ChannelMosaicTile - update: no data found to update tile with');
		}
		this.setData(data);
		this._channelLogo.update(data);
	};

	/**
	 * @method setDataMapper
	 * @param {Object} dataMapper
	 */
	ChannelMosaicTile.prototype.setDataMapper = function (dataMapper) {
		ChannelMosaicTile.superClass.setDataMapper.call(this, dataMapper);
		this._channelLogo.setDataMapper(dataMapper);
	};

	$N.gui = $N.gui || {};
	$N.gui.ChannelMosaicTile = ChannelMosaicTile;
}($N || {}));
