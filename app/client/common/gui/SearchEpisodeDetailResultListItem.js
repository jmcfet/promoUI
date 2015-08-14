/**
 * SearchEpisodeDetailResultListItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a graphic and text
 * stacked in vertical formation.
 *
 * @class $N.gui.SearchEpisodeDetailResultListItem
 * @constructor
 * @extends $N.gui.SearchActorDetailResultListItem
 *
 * @requires $N.apps.core.Language
 * @requires $N.apps.core.Log
 * @requires $N.gui.Util
 *
 * @param {Object} docRef DOM document
 */
(function ($N) {
	function SearchEpisodeDetailResultListItem(docRef) {
		$N.apps.core.Language.adornWithGetString(SearchEpisodeDetailResultListItem, "customise/resources/");
		this._log = new $N.apps.core.Log("CommonGUI", "SearchEpisodeDetailResultListItem");
		SearchEpisodeDetailResultListItem.superConstructor.call(this, docRef);
	}

	$N.gui.Util.extend(SearchEpisodeDetailResultListItem, $N.gui.SearchActorDetailResultListItem);

	/**
	 * Shifts the positions of all ui components to left aligned.
	 * @method shiftPositionsToLeft
	 */
	SearchEpisodeDetailResultListItem.prototype.shiftPositionsToLeft = function () {
		this._title.configure({
			x: 22.5,
			y: 40,
			width: 700,
			cssClass: "searchDetailResultListItemText"
		});

		this._date.configure({
			x: 22.5,
			y: 40,
			cssClass: "searchDetailResultListItemText"
		});

		this._startEndTime.configure({
			x: 337.5,
			y: 40,
			cssClass: "searchDetailResultListItemText"
		});

		this._vodTitle.configure({
			x: 732.5,
			y: 40,
			width: 460,
			cssClass: "searchDetailResultListItemText"
		});

		this._channelNum.configure({
			x: 771,
			y: 40,
			cssClass: "searchDetailResultListItemText"
		});
		this._channelName.configure({
			x: 849,
			y: 40,
			width: 320,
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
	 * Resets the positions of all ui components
	 * @method resetPositions
	 */
	SearchEpisodeDetailResultListItem.prototype.resetPositions = function () {
		this._title.configure({
			x: 22.5,
			y: 40,
			width: 700,
			cssClass: "searchDetailResultListItemText"
		});

		this._date.configure({
			x: 732.5,
			y: 40,
			cssClass: "searchDetailResultListItemText"
		});

		this._startEndTime.configure({
			x: 950,
			y: 40,
			cssClass: "searchDetailResultListItemText"
		});

		this._vodTitle.configure({
			x: 732.5,
			y: 40,
			width: 460,
			cssClass: "searchDetailResultListItemText"
		});

		this._channelNum.configure({
			x: 1228,
			y: 40,
			cssClass: "searchDetailResultListItemText"
		});
		this._channelName.configure({
			x: 1308,
			y: 40,
			width: 320,
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
	 * Updates the data stored within the SearchEpisodeDetailResultListItem.
	 * @method update
	 * @param {Object} data The new SearchEpisodeDetailResultListItem data.
	 */
	SearchEpisodeDetailResultListItem.prototype.update = function (data) {
		this._log("update", "Enter");
		var xCoordinate = 0,
			uniqueEventId,
			episodeTitle;
		if (data) {
			uniqueEventId = data.uniqueEventId;
			this._vodTitle.hide();
			episodeTitle = this._dataMapper.getEpisodeTitle(data);
			if ((episodeTitle === "") || (episodeTitle === " ") || (!episodeTitle)) {
				this._title.hide();
				this.shiftPositionsToLeft();
			} else {
				this.resetPositions();
				this._title.show();
				this._title.setText(episodeTitle);
			}
			if (data.startTime) {
				this._date.setText(this._dataMapper.getDate(data));
			} else {
				this._date.setText('');
			}
			if (data.type === $N.app.constants.SEARCH_TYPE.CATCHUP) {
				this._startEndTime.setText(this._dataMapper.getCatchupIndicator(data));
			} else {
				this._startEndTime.setText(this._dataMapper.getStartEndTime(data));
			}
			this._channelNum.setText($N.app.GeneralUtil.padNumberWithZeroes(this._dataMapper.getChannelNumber(data), 3));
			this._channelName.setText(this._dataMapper.getChannelName(data));
			this._recordIcon.update(data, xCoordinate);
			this._reminderIcon.update(data, xCoordinate);
			this._startOverIcon.update(data, xCoordinate);

		}
		this._highlight.hide();
		this._log("update", "Exit");
	};
	$N.gui = $N.gui || {};
	$N.gui.SearchEpisodeDetailResultListItem = SearchEpisodeDetailResultListItem;
}($N || {}));
