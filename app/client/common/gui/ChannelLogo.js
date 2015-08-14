/**
 * @class N.gui.ChannelLogo
 * @constructor
 * @extends N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	var ChannelLogo = function (docRef, parent) {
		ChannelLogo.superConstructor.call(this, docRef);

		this._LOGO_LABEL_Y_OFFSET = 8;
		this._DEFINITION_LABEL_Y_OFFSET = 21;

		this._width = 96;
		this._height = 96;

		this._dataMapper = {};

		this._container = new $N.gui.Container(docRef);
		this._definitionLabel = new $N.gui.Label(docRef, this._container);
		this._channelNameLabel = new $N.gui.Label(docRef, this._container);
		this._channelLogo = new $N.gui.CachedImage(docRef, this._container);

		this._container.configure({
			cssClass: "channelLogo channelLogoContainerSize"
		});
		this._definitionLabel.configure({
			cssClass: "center gigantic channelDefinitionPosition channelLogoDefinitionStyle blank"
		});
		this._channelNameLabel.configure({
			cssClass: "center channelLogoNamePosition channelLogoNameStyle"
		});
		var me = this;
		this._channelLogo.configure({
			cssClass: "channelLogoSize",
			loadSuccessful: function () {
				me._channelNameLabel.hide();
				me._definitionLabel.hide();
				me._channelLogo.show();
			}
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(ChannelLogo, $N.gui.GUIObject);

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	ChannelLogo.prototype.setWidth = function (width) {
		this._width = width;
		this._container.setWidth(width);
		this._channelNameLabel.setWidth(width);
		this._channelLogo.setWidth(width);
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	ChannelLogo.prototype.setHeight = function (height) {
		this._height = height;
		this._container.setHeight(height);
		this._channelNameLabel.setHeight(height);
		this._channelLogo.setHeight(height);
	};

	/**
	 * @method update
	 * @param {Object} data
	 * @param {String} [href]
	 */
	ChannelLogo.prototype.update = function (data, href) {
		var channelLogo = href || this._dataMapper.getChannelLogo(data);
		if (this._channelLogo.getHref() !== channelLogo) {
			this._channelLogo.hide();
			this._channelNameLabel.setText(this._dataMapper.getChannelAbbreviation(data));
			this._definitionLabel.setText(this._dataMapper.getDefinition(data));
			this._channelNameLabel.show();
			this._definitionLabel.show();
			this._channelLogo.setHref(channelLogo);
		}
	};

	/**
	 * @method setDataMapper
	 * @param {Object} dataMapper
	 */
	ChannelLogo.prototype.setDataMapper = function (dataMapper) {
		this._dataMapper = dataMapper;
	};

	$N.gui = $N.gui || {};
	$N.gui.ChannelLogo = ChannelLogo;
}($N || {}));
