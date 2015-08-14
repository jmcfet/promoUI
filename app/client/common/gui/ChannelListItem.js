/**
 * @class ChannelListItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 *
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	function ChannelListItem(docRef, parent) {
		ChannelListItem.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "ChannelListItem");

		this._CHANNEL_LIST_ITEM_CSS = 'channelListItem';

		this.isFocused = true;
		this.isHighlighted = false;

		var me = this;
		this._container = new $N.gui.Container(this._docRef);
		this._container.configure({
			cssClass: this._CHANNEL_LIST_ITEM_CSS
		});
		this._channelNumber = null;
		this._HIGHLIGHT_BUFFER = 5;
		this._INNER_CONTENT_HEIGHT = 102 - (this._HIGHLIGHT_BUFFER * 2);
		this._LOGO_LABEL_Y_OFFSET = 14;
		this._LABEL_CONTAINER_WIDTH = 393;
		this._LABEL_CONTAINER_X_OFFSET = 111;
		this._LABEL_BUFFER = 13.5;
		this._CONNECTOR_WIDTH = 11;

		this._channelLogo = new $N.gui.ChannelLogo(this._docRef, this._container);

		this._channelBox = new $N.gui.Container(this._docRef, this._container);
		this._channelBox.configure({
			cssClass: "channelBoxPosition channelBox"
		});
        this._channelNumberContainer = new $N.gui.Container(this._docRef, this._channelBox);
		this._channelNumberContainer.configure({
			cssClass: "channelListChanNum"
		});

		this._channelNum = new $N.gui.InlineLabel(this._docRef, this._channelNumberContainer);
		this._cursor = new $N.gui.InlineLabel(this._docRef, this._channelNumberContainer);

		this._soIcon = new $N.gui.Image(this._docRef, this._container);
		this._soIcon.configure({
			x: 450,
			y: 10,
			visible: false,
			href: '../../../customise/resources/images/720p/icons/replay.png'
		});

		this._cursor.configure({
			cssClass: "channelList directChannelNumberEntry channelNumberEntry"
		});
		this._channelName = new $N.gui.Label(this._docRef, this._channelBox);
		this._channelName.configure({
			cssClass: "channelListChanName",
			maxWidth: 255
		});

		this._connector = new $N.gui.Container(this._docRef, this._container);
		this._connector.configure({
			cssClass: "channelBoxConnector"
		});
		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	}
	$N.gui.Util.extend(ChannelListItem, $N.gui.AbstractListItem);
	/**
	 * Updates the data stored within the ChannelListItem.
	 * @method update
	 *
	 * @param {Object} data Object containing the new data.
	 */
	ChannelListItem.prototype.update = function (data) {
		var me = this;

		this._log("update", "Enter");
		if (data) {
			this._container.setCssClass(this._CHANNEL_LIST_ITEM_CSS);
			this._channelLogo.update(data);
			this._channelNum.show();
			this._channelName.show();

			this._soIcon.hide();

			$N.services.sdp.MetadataService.getData(me,
				function (response) {
					if (response && response.services[0] && response.services[0].technical && response.services[0].technical.catchUpSupport) {
						me._soIcon.show();
					}
				},
				function (response) {},
				"btv/services",
				{"technical.id": data._data.uniqueServiceId + "_1", "locale": "pt_BR"},
				null,
				["technical.catchUpSupport"]);

			this._channelNum.setText(this._dataMapper.getChannelNumber(data));
			this._channelName.setText(this._dataMapper.getChannelName(data));
		}
		this._log("update", "Exit");
	};

	/**
	 * Get item channel number labels
	 * @method getNumberItem
	 * @return {Object} channelNum
	 */
	ChannelListItem.prototype.getNumberItem = function () {
		if (!this._channelNumber) {
			this._channelNumber = this._channelNum.getText();
		}
		this._channelName.hide();
		return this._channelNum;
	};

	/**
	 * @method getCursor
	 * @return {Object} the cursor label
	 */
	ChannelListItem.prototype.getCursor = function () {
		this._log("getCursor", "Enter & Exit");
		return this._cursor;
	};

	/**
	 * Restore channel number
	 * @method restoreNumberItem
	 */
	ChannelListItem.prototype.restoreNumberItem = function () {
		if (this._channelNumber) {
			this._channelNum.setText(this._channelNumber);
			this._channelName.show();
			this._channelNumber = null;
		}
	};

	/**
	 * resets channel number css class
	 * @method resetCss
	 */
	ChannelListItem.prototype.resetCss = function () {
        this._channelNumberContainer.setCssClass("channelListChanNum");
	};

	/**
	 * sets channel number css class for direct entry
	 * @method setDirectEntryCss
	 */
	ChannelListItem.prototype.setDirectEntryCss = function () {
        this._channelNumberContainer.setCssClass("channelList directChannelNumberEntry channelNumberEntry");
	};

	/**
	 * Clear cached channel number
	 * @method clearNumberItem
	 */
	ChannelListItem.prototype.clearNumberItem = function () {
		this._channelName.show();
		this._channelNumber = null;
	};

	/**
	 * @method updateHighlight
	 */
	ChannelListItem.prototype.updateHighlight = function () {
		if (this.isHighlighted) {
			if (this.isFocused) {
				this._container.setCssClass(this._CHANNEL_LIST_ITEM_CSS + ' event-highlight');
			} else {
				this._container.setCssClass(this._CHANNEL_LIST_ITEM_CSS + ' selected');
			}
		} else {
			this._container.setCssClass(this._CHANNEL_LIST_ITEM_CSS);
		}
	};

	/**
	 * @method highlight
	 */
	ChannelListItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};
	/**
	 * @method unHighlight
	 */
	ChannelListItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};
	/**
	 * @method focus
	 */
	ChannelListItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};
	/**
	 * @method defocus
	 */
	ChannelListItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * @method setDataMapper
	 * @param {Object} dataMapper
	 */
	ChannelListItem.prototype.setDataMapper = function (dataMapper) {
		ChannelListItem.superClass.setDataMapper.call(this, dataMapper);
		this._channelLogo.setDataMapper(dataMapper);
	};

	$N.gui = $N.gui || {};
	$N.gui.ChannelListItem = ChannelListItem;
}($N || {}));

