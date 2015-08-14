/**
 * @class $N.gui.ScheduledRecordingItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 *
 * @requires $N.apps.core.Log
 * @requires $N.gui.ClippedGroup
 * @requires $N.gui.Container
 * @requires $N.gui.ChannelLogo
 * @requires $N.gui.Label
 * @requires $N.gui.ActiveRecordIcon
 * @requires $N.gui.Util
 *
 * @param {Object} docRef DOM document
 */


(function ($N) {
	function ScheduledRecordingItem(docRef) {
		ScheduledRecordingItem.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "ScheduledRecordingItem");

		this.isFocused = true;
		this.isHighlighted = false;
		this._data = null;

		this._container = new $N.gui.ListItem(docRef);
		this._channelLogo = new $N.gui.ChannelLogo(this._docRef, this._container);
		this._logoHighlight = new $N.gui.Container(docRef, this._container);
		this._highlight = new $N.gui.Container(docRef, this._container);
		this._nameContainer = new $N.gui.Label(this._docRef, this._container);
		this._name = new $N.gui.InlineLabel(this._docRef, this._nameContainer);
		this._activeRecordIcon = new $N.gui.ActiveRecordIcon(docRef, this._nameContainer);
		this._recordDate = new $N.gui.Label(this._docRef, this._container);

		this._LOGO_SIZE = 102;

		this._container.configure({
			width: 1291.5,
			height: 120,
			visible: true
		});
		this._highlight.configure({
			x: 127,
			y: 2,
			width: 1152.5,
			height: this._LOGO_SIZE,
			cssClass: "recordingListItemHighlight",
			visible: false
		});
		this._channelLogo.configure({
			x: 3,
			y: 3,
			width: this._LOGO_SIZE,
			height: this._LOGO_SIZE
		});
		this._logoHighlight.configure({
			width: this._LOGO_SIZE + 4.5,
			height: this._LOGO_SIZE + 4.5,
			cssClass: "recordingListLogoHighlight",
			visible: false
		});
		this._nameContainer.configure({
			x: 144,
			y: 10,
			width: 1074,
			height: 44,
			cssClass: "normal ellipsis scheduledItemName"
		});
		this._name.configure({
			cssClass: "scheduledItemName relative"
		});
		this._activeRecordIcon.configure({
			cssClass: "scheduledListItemIcon relative"
		});
		this._recordDate.configure({
			x: 144,
			y: 53,
			width: 1074,
			height: 39,
			cssClass: "recordingItemName"
		});

		this._rootSVGRef = this._container.getRootSVGRef();
	}
	$N.gui.Util.extend(ScheduledRecordingItem, $N.gui.AbstractListItem);

	/**
	 * @method updateHighlight
	 */
	ScheduledRecordingItem.prototype.updateHighlight = function () {
		if (this.isHighlighted && this.isFocused) {
			this._highlight.show();
			this._logoHighlight.show();
		} else {
			this._highlight.hide();
			this._logoHighlight.hide();
		}
	};

	/**
	 * @method highlight
	 */
	ScheduledRecordingItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighlight
	 */
	ScheduledRecordingItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method focus
	 */
	ScheduledRecordingItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	ScheduledRecordingItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * @method showActiveRecordIcon
	 * @param {String} eventId
	 */
	ScheduledRecordingItem.prototype.showActiveRecordIcon = function (data) {
		if (data) {
			this._activeRecordIcon.updateByTask(data);
		} else {
			this._activeRecordIcon.hide();
		}
	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	ScheduledRecordingItem.prototype.update = function (data) {
		this._log("update", "Enter");
		var nameText = "",
			serviceData = $N.app.epgUtil.getServiceById(data.serviceId);
		serviceData.channelLogo = $N.app.epgUtil.getChannelLogoUrl(data.serviceId);
		this._highlight.hide();
		this._logoHighlight.hide();
		this._channelLogo.update(serviceData);
		this._recordDate.setText(this._dataMapper.getRecordDate(data) + " " + this._dataMapper.getRecordTime(data));
		if ($N.app.PVRUtil.isTaskBlockedTitle(data)) {
			nameText = $N.app.PVRUtil.getString("adultContent");
		} else {
			nameText = this._dataMapper.getSeriesEpisodeTitle(data);
			if (this._dataMapper.getDisplaySeasonEpisode(data)) {
				nameText += " " + this._dataMapper.getSeasonEpisodeShort(data);
			}
		}
		this._name.setText(nameText);
		this.showActiveRecordIcon(data);
		this._data = data;
		this._log("update", "Exit");
	};

	/**
	 * @method setDataMapper
	 * @param {Object} dataMapper
	 */
	ScheduledRecordingItem.prototype.setDataMapper = function (dataMapper) {
		ScheduledRecordingItem.superClass.setDataMapper.call(this, dataMapper);
		this._channelLogo.setDataMapper(dataMapper);
	};

	$N.gui = $N.gui || {};
	$N.gui.ScheduledRecordingItem = ScheduledRecordingItem;
}($N || {}));
