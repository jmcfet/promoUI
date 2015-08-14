/**
 * GenericReminderListItem is an item Template used for selecting each item in the reminder list
 * with two highlighter containers.
 *
 * @class GenericReminderListItem
 * @constructor
 * @namespace $N.gui
 * @extends $N.gui.TextItem
 * @requires $N.gui.ClippedGroup
 * @requires $N.gui.Container
 * @requires $N.gui.ChannelLogo
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @param {Object} docRef (DOM document)
 */
(function ($N) {
	function GenericReminderListItem(docRef) {

		GenericReminderListItem.superConstructor.call(this, docRef);

		this._container = new $N.gui.ClippedGroup(docRef);
		this._container.setWidth(1376);
		this._container.setHeight(102);
		this._container.configure({
			x: 0
		});

		this._INNER_CONTENT_HEIGHT = 96;

		this._logoHighlight = new $N.gui.Container(docRef, this._container);
		this._logoHighlight.configure({
			x: 21,
			width: 102,
			height: 102,
			cssClass: "settingschannelLogoItemHighlight",
			rounding: 1,
			visible: false
		});

		this._highlight = new $N.gui.Container(docRef, this._container);
		this._highlight.configure({
			x: 145,
			width: 1173,
			height: 102,
			cssClass: "channelListItemHighlight",
			visible: false
		});

		this._channelLogo = new $N.gui.ChannelLogo(docRef, this._container);
		this._channelLogo.configure({
			x: 24,
			y: 3,
			width: this._INNER_CONTENT_HEIGHT,
			height: this._INNER_CONTENT_HEIGHT
		});

		this._title = new $N.gui.Label(docRef, this._container);
		this._title.configure({
			x: 169.5,
			y: 5.5,
			width: 1120,
			cssClass: "dialogSubtitle"
		});

		this._subTitle = new $N.gui.Label(docRef, this._container);
		this._subTitle.configure({
			x: 169.5,
			y: 48.5,
			width: 1300,
			cssClass: "menuSubTitle"
		});

		this._rootSVGRef = this._container.getRootSVGRef();

		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(GenericReminderListItem, $N.gui.AbstractListItem);

	/**
	 * @method updateHighlight
	 */

	GenericReminderListItem.prototype.updateHighlight = function () {
		if (this.isHighlighted && this.isFocused) {
			this._highlight.setCssClass("channelListItemHighlight");
			this._logoHighlight.setCssClass("settingschannelLogoItemHighlight");
			this._logoHighlight.show();
			this._highlight.show();
		} else {
			this._logoHighlight.hide();
			this._highlight.hide();
		}
	};

	/**
	 * @method highlight
	 */

	GenericReminderListItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};


	/**
	 * @method updateIcon
	 * @param {Object} serviceData
	 */
	GenericReminderListItem.prototype.updateIcon = function (eventData) {
		if (eventData) {
			this._channelLogo.update(eventData);
			this._channelLogo.show();
		} else {
			this._channelLogo.hide();
		}
	};

	/**
	 * @method update
	 * @param {Object} eventData
	 */
	GenericReminderListItem.prototype.update = function (eventData) {
		var serviceData = {};
		if (eventData) {
			this._title.setText(this._dataMapper.getTitle(eventData));
			this._subTitle.setText(this._dataMapper.getSubTitle(eventData));
			serviceData = $N.app.epgUtil.getServiceById(eventData.serviceId);
			serviceData.channelLogo = $N.app.epgUtil.getChannelLogoUrl(eventData.serviceId);
			this.updateIcon(serviceData);
		}
	};

	/**
	 * @method unHighlight
	 */
	GenericReminderListItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method focus
	 */
	GenericReminderListItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};
	/**
	 * @method defocus
	 */
	GenericReminderListItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * @method setCssClassTitle
	 */
	GenericReminderListItem.prototype.setCssClassTitle = function (cssClass) {
		this._title.setCssClass(cssClass);
	};

	/**
	 * @method setCssClassSubtitle
	 */
	GenericReminderListItem.prototype.setCssClassSubtitle = function (cssClass) {
		this._subTitle.setCssClass(cssClass);
	};

	/**
	 * @method setDataMapper
	 * @param {Object} dataMapper
	 */
	GenericReminderListItem.prototype.setDataMapper = function (dataMapper) {
		GenericReminderListItem.superClass.setDataMapper.call(this, dataMapper);
		this._channelLogo.setDataMapper(dataMapper);
	};

	$N.gui = $N.gui || {};
	$N.gui.GenericReminderListItem = GenericReminderListItem;

}($N || {}));
