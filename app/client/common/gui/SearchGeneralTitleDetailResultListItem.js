/**
 * SearchGeneralTitleDetailResultListItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a graphic and text
 * stacked in vertical formation.
 *
 * @class $N.gui.SearchGeneralTitleDetailResultListItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 *
 * @requires $N.apps.core.Language
 * @requires $N.apps.core.Log
 * @requires $N.gui.ListItem
 * @requires $N.gui.Container
 * @requires $N.gui.Label
 * @requires $N.gui.RecordIcon
 * @requires $N.gui.ReminderIcon
 * @requires $N.gui.StartOverIcon
 * @requires $N.gui.Util
 *
 * @param {Object} docRef DOM document
 */
(function ($N) {
	function SearchGeneralTitleDetailResultListItem(docRef) {
		$N.apps.core.Language.adornWithGetString(SearchGeneralTitleDetailResultListItem, "customise/resources/");
		this._log = new $N.apps.core.Log("CommonGUI", "SearchGeneralTitleDetailResultListItem");
		SearchGeneralTitleDetailResultListItem.superConstructor.call(this, docRef);

		this.isFocused = true;
		this.isHighlighted = false;

		this._container = new $N.gui.ListItem(this._docRef);
		this._background = new $N.gui.Container(docRef, this._container);

		this._container.configure({
			width: 1755
		});
		this._date = new $N.gui.Label(this._docRef, this._container);
		this._startEndTime = new $N.gui.Label(this._docRef, this._container);
		this._vodTitle = new $N.gui.DelayedScrollingLabel(this._docRef, this._container);
		this._episodeTitle = new $N.gui.Label(this._docRef, this._container);
		this._channelNum = new $N.gui.Label(this._docRef, this._container);
		this._channelName = new $N.gui.Label(this._docRef, this._container);
		this._recordIcon = new $N.gui.RecordIcon(this._docRef, this._container);
		this._reminderIcon = new $N.gui.ReminderIcon(this._docRef, this._container);
		this._startOverIcon = new $N.gui.StartOverIcon(this._docRef, this._container);

		this._RECORD_ICON_PADDING = 50;
		this._ROW_BACKGROUND_HEIGHT = 51;
		this._ROW_BACKGROUND_WIDTH = 1755;
		this._CLASS_BACKGROUND = "timeListItemBackground";
		this._CLASS_BACKGROUND_HIGHLIGHT = "searchResultListItemHighlighted highlightRoundedCorner";
		this._CLASS_BACKGROUND_TIMELINE = "timeListItemBackgroundCurrent";

		this._background.configure({
			x: 0,
			y: 0,
			width: this._ROW_BACKGROUND_WIDTH,
			height: this._ROW_BACKGROUND_HEIGHT,
			cssClass: this._CLASS_BACKGROUND
		});

		this.resetPositions();

		this._rootSVGRef = this._container.getRootSVGRef();
		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(SearchGeneralTitleDetailResultListItem, $N.gui.AbstractListItem);

	/**
	 * Sets the width of the SearchGeneralTitleDetailResultListItem.
	 * @method setWidth
	 * @param {Number} width The width of the SearchGeneralTitleDetailResultListItem.
	 * @return {Object} The SearchGeneralTitleDetailResultListItem object.
	 */
	SearchGeneralTitleDetailResultListItem.prototype.setWidth = function (width) {
		this._width = width;
		return this;
	};

	/**
	 * Sets the width of the SearchGeneralTitleDetailResultListItem.
	 * @method resetPositions
	 */
	SearchGeneralTitleDetailResultListItem.prototype.resetPositions = function () {
		this._date.configure({
			x: 22.5,
			y: 3,
			cssClass: "searchDetailResultListItemText"
		});

		this._startEndTime.configure({
			x: 337.5,
			y: 3,
			cssClass: "searchDetailResultListItemText"
		});

		this._channelNum.configure({
			x: 670,
			y: 3,
			cssClass: "searchDetailResultListItemText"
		});

		this._channelName.configure({
			x: 748,
			y: 3,
			width: 600,
			cssClass: "searchDetailResultListItemText"
		});

		this._vodTitle.configure({
			x: 1300,
			y: 3,
			width: 730,
			duration: "250ms",
			cssClass: "searchDetailResultListItemText"
		});

		this._episodeTitle.configure({
			x: 1300,
			y: 3,
			width: 730,
			cssClass: "searchDetailResultListItemText"
		});

		this._recordIcon.configure({
			x: 1660,
			y: 8,
			visible: false
		});

		this._reminderIcon.configure({
			x: 1710,
			y: 8,
			visible: false
		});

		this._startOverIcon.configure({
			x: 1710,
			y: 8,
			visible: false
		});
	};

		/**
	 * Sets the width of the SearchGeneralTitleDetailResultListItem.
	 * @method setPositionsForSeries
	 */
	SearchGeneralTitleDetailResultListItem.prototype.setPositionsForSeries = function () {
		this._date.configure({
			x: 22.5,
			y: 3,
			cssClass: "searchDetailResultListItemText"
		});

		this._startEndTime.configure({
			x: 300,
			y: 3,
			cssClass: "searchDetailResultListItemText"
		});

		this._channelNum.configure({
			x: 600,
			y: 3,
			cssClass: "searchDetailResultListItemText"
		});

		this._channelName.configure({
			x: 680,
			y: 3,
			width: 600,
			cssClass: "searchDetailResultListItemText"
		});

		this._episodeTitle.configure({
			x: 1120,
			y: 3,
			width: 520,
			cssClass: "searchDetailResultListItemText"
		});

		this._vodTitle.configure({
			x: 1120,
			y: 3,
			width: 520,
			cssClass: "searchDetailResultListItemText"
		});

	};
	/**
	 * @method setCssClass
	 * @param {Object} cssClass
	 */
	SearchGeneralTitleDetailResultListItem.prototype.setCssClass = function (cssClass) {
		this._CLASS_BACKGROUND = cssClass || "timeListItemBackground";
	};

	/**
	 * @method setHighlightCssClass
	 * @param {Object} cssClass
	 */
	SearchGeneralTitleDetailResultListItem.prototype.setHighlightCssClass = function (cssClass) {
		this._CLASS_BACKGROUND_HIGHLIGHT = cssClass || "timeListItemHighlight highlightRoundedCorner";
	};

	/**
	 * Sets the height of the SearchGeneralTitleDetailResultListItem.
	 * @method setHeight The height of the SearchGeneralTitleDetailResultListItem.
	 * @param {Number} height
	 * @return {Object} The SearchGeneralTitleDetailResultListItem object.
	 */
	SearchGeneralTitleDetailResultListItem.prototype.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * @method updateHighlight
	 */
	SearchGeneralTitleDetailResultListItem.prototype.updateHighlight = function () {
		if (this.isHighlighted && this.isFocused) {
			this._background.setCssClass(this._CLASS_BACKGROUND_HIGHLIGHT);
			this._date.setCssClass("searchDetailResultListItemTextHighlighted");
			this._startEndTime.setCssClass("searchDetailResultListItemTextHighlighted");
			this._channelNum.setCssClass("searchDetailResultListItemTextHighlighted");
			this._channelName.setCssClass("searchDetailResultListItemTextHighlighted");
			this._vodTitle.setCssClass("searchDetailResultListItemTextHighlighted");
		} else {
			this._background.setCssClass(this._CLASS_BACKGROUND);
			this._date.setCssClass("searchDetailResultListItemText");
			this._startEndTime.setCssClass("searchDetailResultListItemText");
			this._channelNum.setCssClass("searchDetailResultListItemText");
			this._channelName.setCssClass("searchDetailResultListItemText");
			this._vodTitle.setCssClass("searchDetailResultListItemText");
		}
	};

	/**
	 * @method highlight
	 */
	SearchGeneralTitleDetailResultListItem.prototype.highlight = function () {
		if (!this.isHighlighted) {
			this._background.setCssClass(this._CLASS_BACKGROUND_HIGHLIGHT);
			this.isHighlighted = true;
			this.updateHighlight();
			if (this._vodTitle.isVisible()) {
				this._vodTitle.start();
			}
		}
	};

	/**
	 * @method unHighlight
	 */
	SearchGeneralTitleDetailResultListItem.prototype.unHighlight = function () {
		this._background.setCssClass(this._CLASS_BACKGROUND);
		if (this.isHighlighted) {
			this.isHighlighted = false;
			this.updateHighlight();
			if (this._vodTitle.isVisible()) {
				this._vodTitle.stop();
			}
		}
	};

	/**
	 * @method focus
	 */
	SearchGeneralTitleDetailResultListItem.prototype.focus = function () {
		this._background.setCssClass(this._CLASS_BACKGROUND_HIGHLIGHT);
		if (!this.isFocused) {
			if (this._vodTitle.isVisible()) {
				this._vodTitle.start();
			}
			this.isFocused = true;
			this.updateHighlight();
		}
	};

	/**
	 * @method defocus
	 */
	SearchGeneralTitleDetailResultListItem.prototype.defocus = function () {
		this._background.setCssClass(this._CLASS_BACKGROUND);
		if (this.isFocused) {
			if (this._vodTitle.isVisible()) {
				this._vodTitle.stop();
			}
			this.isFocused = false;
			this.updateHighlight();
		}
	};

	SearchGeneralTitleDetailResultListItem.prototype.showBTVRelatedFields = function (data) {
		this._recordIcon.update(data);
		this._reminderIcon.update(data);
		this._channelNum.setText($N.app.GeneralUtil.padNumberWithZeroes(this._dataMapper.getChannelNumber(data), 3));
		this._channelName.setText(this._dataMapper.getChannelName(data));
		this._startOverIcon.update(data);
	};

	/**
	 * Updates the data stored within the SearchGeneralTitleDetailResultListItem.
	 * @method update
	 * @param {Object} data The new SearchGeneralTitleDetailResultListItem data.
	 */
	SearchGeneralTitleDetailResultListItem.prototype.update = function (data) {
		this._log("update", "Enter");
		var uniqueEventId,
			episodeTitle,
			eventTitle;
		if (data) {
			uniqueEventId = data.uniqueEventId;
			this._channelNum.show();
			if (data.type === $N.app.constants.SEARCH_TYPE.EPG || data.type === $N.app.constants.SEARCH_TYPE.MDSEPG) {
				this._log("update", "EPG item");
				if (data.startTime) {
					this._date.setText(this._dataMapper.getDate(data));
					this._startEndTime.setText(this._dataMapper.getStartEndTime(data));
				} else {
					this._date.setText("");
					this._startEndTime.setText("");
				}
				this.setPositionsForSeries();
				this._vodTitle.show();
				this._vodTitle.setText(this._dataMapper.getTitle(data));
				this._episodeTitle.hide();
				this._date.show();
				this._startEndTime.show();
				this._channelName.show();
				this.showBTVRelatedFields(data);
			} else if (data.type === $N.app.constants.SEARCH_TYPE.VOD) {
				this._log("update", "VOD item");
				this._vodTitle.show();
				this._vodTitle.setText(this._dataMapper.getTitle(data));
				this._date.setText(this._dataMapper.getVodSeries(data));
				this._date.show();
				this._startEndTime.hide();
				this._episodeTitle.hide();
				this._channelNum.hide();
				this.setPositionsForSeries();
				this._channelName.setText(this._dataMapper.getChannelName(data));
				this._channelName.show();
				this._date.setX(1264);
				this._vodTitle.setX(22.5);
				this._channelName.setX(800);
			} else if (data.type === $N.app.constants.SEARCH_TYPE.CATCHUP) {
				this._log("update", "CU item");
				this._date.setText(this._dataMapper.getCathupDate(data));
				this._startEndTime.setText(this._dataMapper.getCatchupIndicator(data));
				this._vodTitle.hide();
				this.setPositionsForSeries();
				this._vodTitle.show();
				this._vodTitle.setText(this._dataMapper.getTitle(data));
				this._episodeTitle.hide();
				this._date.show();
				this._startEndTime.show();
				this._channelName.show();
				this.showBTVRelatedFields(data);
			} else if (data.type === $N.app.constants.SEARCH_TYPE.PVR) {
				this._log("update", "PVR item");
				this._date.setText(this._dataMapper.getRecordedDate(data));
				this.setPositionsForSeries();
				this._vodTitle.show();
				this._vodTitle.setText(data.title);
				this._episodeTitle.hide();
				this._date.show();
				this._startEndTime.hide();
				this._channelName.setText(this._dataMapper.getChannelName(data));
				this._channelName.show();
				this.showBTVRelatedFields(data);
			} else {
				this._log("update", "Unknown item type (" + data.type + ")");
				this.resetPositions();
				this._vodTitle.show();
				this._vodTitle.setText(data.title);
				this._date.hide();
				this._episodeTitle.hide();
				this._startEndTime.hide();
				this._vodTitle.show();
				this._channelNum.hide();
				this._channelName.hide();
			}
			if (this._vodTitle.isVisible()) {
				this._vodTitle.stop();
			}
		}
		this._log("update", "Exit");
	};
	$N.gui = $N.gui || {};
	$N.gui.SearchGeneralTitleDetailResultListItem = SearchGeneralTitleDetailResultListItem;
}($N || {}));
