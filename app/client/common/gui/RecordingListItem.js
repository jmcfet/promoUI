/**
 * Recording list item is a class that deals with Recording items
 * @class $N.gui.RecordingListItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 *
 * @requires $N.gui.ClippedGroup
 * @requires $N.gui.Container
 * @requires $N.gui.Image
 * @requires $N.gui.Label
 * @requires $N.gui.ActiveRecordIcon
 * @requires $N.gui.PartialRecordIcon
 * @requires $N.gui.Util
 *
 * @param {Object} docRef DOM document
 */

(function ($N) {
	function RecordingListItem(docRef) {
		this._log = new $N.apps.core.Log("CommonGUI", "RecordingListItem");
		RecordingListItem.superConstructor.call(this, docRef);

		this._RECORD_NAME_CLASS = "normal ellipsis recordingListItemLabel";
		this._RECORD_DATE_CLASS = "normal recordingDate";
		this.isFocused = true;
		this.isHighlighted = false;
		this._data = null;

		this._container = new $N.gui.ListItem(docRef);
		this._icon = new $N.gui.Image(docRef, this._container);
		this._nameContainer = new $N.gui.Container(this._docRef, this._container);
		this._name = new $N.gui.InlineLabel(this._docRef, this._nameContainer);
		this._numberOfEpisodes = new $N.gui.InlineLabel(this._docRef, this._nameContainer);
		this._novoIcon = new $N.gui.Image(docRef, this._nameContainer);
		this._partialRecordIcon = new $N.gui.PartialRecordIcon(docRef, this._nameContainer);
		this._activeRecordIcon = new $N.gui.ActiveRecordIcon(docRef, this._nameContainer);
		this._recordDate = new $N.gui.Label(this._docRef, this._container);

		this._container.configure({
			cssClass: "eventHighlightOff",
			width: 1291.5,
			height: 72,
			visible: true
		});
		this._icon.configure({
			cssClass: "recordingListItemIcon",
			visible: false,
			loadSuccessful: this._icon.show.bind(this)
		});
		this._nameContainer.configure({
			cssClass: "recordingListItemContainer"
		});
		this._name.configure({
			cssClass: this._RECORD_NAME_CLASS + " wrap relative"
		});
		this._numberOfEpisodes.configure({
			cssClass: "normal recordingListItemEpisodes relative"
		});
		this._novoIcon.configure({
			cssClass: "recordingListItemIconCell relative",
			width: 85.5,
			height: 27,
			visible: false,
			loadSuccessful: this._novoIcon.show.bind(this)
		});
		this._partialRecordIcon.configure({
			cssClass: "recordingListItemIconCell relative",
			visible: false
		});
		this._activeRecordIcon.configure({
			cssClass: "recordingListItemIconCell relative",
			visible: false
		});
		this._recordDate.configure({
			cssClass: this._RECORD_NAME_CLASS
		});

		this._rootSVGRef = this._container.getRootSVGRef();
	}
	$N.gui.Util.extend(RecordingListItem, $N.gui.AbstractListItem);

	/**
	 * @method updateHighlight
	 */
	RecordingListItem.prototype.updateHighlight = function () {
		if (this.isHighlighted && this.isFocused) {
			this._container.setCssClass("eventHighlightOn");
		} else {
			this._container.setCssClass("eventHighlightOff");
		}
	};

	/**
	 * @method highlight
	 */
	RecordingListItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighlight
	 */
	RecordingListItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method focus
	 */
	RecordingListItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	RecordingListItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * @method _updateIcon
	 * @private
	 * @param {Object} icon to update
	 * @param {String} iconHref
	 */
	RecordingListItem.prototype._updateIcon = function (icon, iconHref) {
		if (icon.getHref() !== iconHref) {
			icon.setHref(iconHref);
		}
		icon.show();
	};

	/**
	 * @method _updateName
	 * @param {Object} data
	 * @param {Boolean} isFolder
	 * @private
	 */
	RecordingListItem.prototype._updateName = function (data, isFolder) {
		var isFolderUserGenerated = this._dataMapper.isFolderUserGenerated(data);
		if ($N.app.PVRUtil.isTaskBlockedTitle(data)) {
			if (isFolder) {
				if (!isFolderUserGenerated) {
					this._name.setText($N.app.PVRUtil.getString("adultContent"));
				} else {
					this._name.setText(this._dataMapper.getTitle(data).trim());
				}
			} else {
				this._name.setText($N.app.PVRUtil.getString("adultContent"));
			}
		} else {
			this._name.setText(this._dataMapper.getTitle(data).trim());
		}
	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	RecordingListItem.prototype.update = function (data) {
		this._log("update", "Enter");
		var iconHref = this._dataMapper.getIcon(data),
			novoIconHref = this._dataMapper.getNovoIcon(data),
			eventId = this._dataMapper.getEventId(data),
			uiFolder = this._dataMapper.getFolderName(data),
			isFolder = this._dataMapper.isFolder(data),
			isAuthorized = this._dataMapper.getAuthorizationStatus(data),
			numberOfEpisodes = this._dataMapper.getNumberOfEpisodes(data) || "";
		this._icon.hide();
		this._novoIcon.hide();
		if (iconHref) {
			this._updateIcon(this._icon, iconHref);
		}
		this._updateName(data, isFolder);
		this._numberOfEpisodes.setText(numberOfEpisodes);
		if (novoIconHref) {
			this._updateIcon(this._novoIcon, novoIconHref);
		}
		this._data = data;
		this._recordDate.setText(this._dataMapper.getRecordDate(data));
		if (isFolder) {
			this._activeRecordIcon.updateFolder(uiFolder);
			this._partialRecordIcon.updateFolder(uiFolder);
		} else {
			this._activeRecordIcon.updateByTask(data);
			this._partialRecordIcon.updateByTask(data);
		}
		if (isAuthorized) {
			//this._nameContainer.setCssClass(this._RECORD_NAME_CLASS);
			this._recordDate.setCssClass(this._RECORD_DATE_CLASS);
		} else {
			//this._nameContainer.setCssClass(this._RECORD_NAME_CLASS + " unplayable");
			this._recordDate.setCssClass(this._RECORD_DATE_CLASS + " unplayable");
		}
		this._log("update", "Exit");
	};
	$N.gui = $N.gui || {};
	$N.gui.RecordingListItem = RecordingListItem;
}($N || {}));