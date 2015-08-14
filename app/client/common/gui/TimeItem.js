/**
 * TimeItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a graphic and text
 * stacked in vertical formation.
 *
 * @class $N.gui.TimeItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 * @requires $N.gui.ClippedGroup
 * @requires $N.gui.Container
 * @requires $N.gui.Label
 * @requires $N.gui.SpanLabel
 * @requires $N.gui.RecordIcon
 * @requires $N.gui.ReminderIcon
 * @requires $N.gui.StartOverIcon
 * @requires $N.gui.Util
 * @requires $N.apps.core.Language
 * @param {Object} docRef DOM document
 */
(function ($N) {
	function TimeItem(docRef) {
		$N.apps.core.Language.adornWithGetString(TimeItem, "customise/resources/");
		this._log = new $N.apps.core.Log("CommonGUI", "TimeItem");
		TimeItem.superConstructor.call(this, docRef);

		this.isFocused = true;
		this.isHighlighted = false;
		this._isPlayable = true;
		this._noEventInfo = false;

		this._container = new $N.gui.Container(this._docRef);
		this._highlight = new $N.gui.Container(docRef, this._container);
		this._timeItem = new $N.gui.Container(docRef, this._container);
		this._iconContainer = new $N.gui.Container(this._docRef, this._timeItem);
		this._timeLine = new $N.gui.Container(docRef, this._container);

		this._time = new $N.gui.InlineLabel(this._docRef, this._timeItem);
		this._eventName = new $N.gui.InlineLabel(this._docRef, this._timeItem);
		this._subtitle = new $N.gui.InlineLabel(this._docRef, this._timeItem);
		this._startOverIcon = new $N.gui.StartOverIcon(this._docRef, this._iconContainer);
		this._reminderIcon = new $N.gui.ReminderIcon(this._docRef, this._iconContainer);
		this._recordIcon = new $N.gui.RecordIcon(this._docRef, this._iconContainer);

		this._RECORD_ICON_PADDING = 50;
		this._TIME_ITEM_CONTAINER_CSS = "timeListItemContainerSize";
		this._CLASS_BACKGROUND_HIGHLIGHT = 'timeListItemHighlight';
		this._CLASS_BACKGROUND_SECONDARY_HIGHLIGHT = 'eventSecondaryFocusBackground';
		this._CLASS_BACKGROUND_TIMELINE = 'timeListItemBackgroundCurrent';
		this._TIME_ITEM_CSS = "timeListItemPosition timeListItem small ellipsis";
		this._ICON_CSS = "icon relative";

		this._titleNoEvent = TimeItem.getString("noEventTitle");

		this._container.configure({
			cssClass: this._TIME_ITEM_CONTAINER_CSS
		});

		this._iconContainer.setCssClass("iconContainerPosition relative pullRight verticalAlignMiddle");

		this._highlight.configure({
			cssClass: this._CLASS_BACKGROUND_HIGHLIGHT
		});

		this._timeItem.setCssClass(this._TIME_ITEM_CSS);

		this._timeLine.configure({
			cssClass: "timeListItemTimeLine",
			rounding: 1,
			visible: false
		});

		this._time.configure({
			cssClass: "listEventTime-position"
		});

		this._isInPast = false;

		this._eventName.setCssClass("listEventName-position");
		this._subtitle.setCssClass("listEventName-position eventSubtitleColor");

		this._recordIcon.configure({
			cssClass: this._ICON_CSS,
			visible: false
		});

		this._reminderIcon.configure({
			cssClass: this._ICON_CSS,
			visible: false
		});

		this._startOverIcon.configure({
			cssClass: this._ICON_CSS
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(TimeItem, $N.gui.AbstractListItem);

	/**
	 * Sets the width of the TimeItem.
	 * @method setWidth
	 * @param {Number} width The width of the TimeItem.
	 * @return {Object} The TimeItem object.
	 */
	TimeItem.prototype.setWidth = function (width) {
		this._width = width;
		return this;
	};

	/**
	 * Sets the height of the TimeItem.
	 * @method setHeight The height of the TimeItem.
	 * @param {Number} height
	 * @return {Object} The TimeItem object.
	 */
	TimeItem.prototype.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * Sets the css style for catchup eventName.
	 * @method setCssOnCatchUpEventName
	 * @param {Object} eventName
	 * @param {Boolean} isPlayable.
	 */
	function setCssOnCatchUpEventName(eventName, isPlayable) {
		eventName.setCssClass("listEventName-position");
		if (isPlayable) {
			eventName.addCssClass("whiteText");
		} else {
			eventName.addCssClass("catchupItem");
		}
	}
	/**
	 * @method updateStyle
	 */
	TimeItem.prototype.updateStyle = function () {
		if (this._isInPast) {
			this._time.setCssClass("timeListItemTime catchupTime");
			setCssOnCatchUpEventName(this._eventName, this._isPlayable);
			this._subtitle.setCssClass("listEventName-position catchupItem");
		} else {
			this._time.setCssClass("timeListItemTime");
			this._eventName.setCssClass("listEventName-position");
			this._subtitle.setCssClass("listEventName-position eventSubtitleColor");
		}
	};

	/**
	 * @method updateHighlight
	 */
	TimeItem.prototype.updateHighlight = function () {
		/* for NETUI-827, no info text should be displayed at 4 row
		 * hide the 1st item highlight if no event*/
		if (this._noEventInfo) {
			this._container.removeCssClass("highlight");
			this._eventName.removeCssClass("catchupHighlight");
			return;
		}
		this.updateStyle();
		if (this.isHighlighted && this.isFocused) {
			this._container.addCssClass("highlight");
			if (this._isInPast) {
				setCssOnCatchUpEventName(this._eventName, this._isPlayable);
				this._subtitle.setCssClass("listEventName-position catchupTime");
			}
		} else {
			this._container.removeCssClass("highlight");
			this._eventName.removeCssClass("catchupTime");
			this._subtitle.removeCssClass("catchupTime");
		}
	};

	/**
	 * @method highlight
	 */
	TimeItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighlight
	 */
	TimeItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method setSecondaryHighlightOn
	 */
	TimeItem.prototype.setSecondaryHighlightOn = function () {
		this._timeItem.addCssClass(this._CLASS_BACKGROUND_SECONDARY_HIGHLIGHT);
	};

	/**
	 * @method setSecondaryHighlightOff
	 */
	TimeItem.prototype.setSecondaryHighlightOff = function () {
		this._timeItem.removeCssClass(this._CLASS_BACKGROUND_SECONDARY_HIGHLIGHT);
	};

	/**
	 * @method focus
	 */
	TimeItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	TimeItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
		this.setSecondaryHighlightOff();
	};

	/**
	 * Highlights TimeLine (current playing event).
	 * @method showTimeLine
	 */
	TimeItem.prototype.showTimeLine = function () {
		this._log("showTimeLine", "Enter");
		this._timeLine.show();
		this._log("showTimeLine", "Exit");
	};

	/**
	 * Removes the TimeLine highlight from the TimeItem.
	 * @method hideTimeLine
	 */
	TimeItem.prototype.hideTimeLine = function () {
		this._log("hideTimeLine", "Enter");
		this._timeLine.hide();
		this._log("hideTimeLine", "Exit");
	};

	/**
	 * @method updateIcons
	 * @param {Object} data
	 */
	TimeItem.prototype.updateIcons = function (data) {
		this._log("updateIcons", "Enter");
		this._recordIcon.update(data);
		this._reminderIcon.update(data);
		this._startOverIcon.update(data);
		this._log("updateIcons", "Exit");
	};

	/**
	 * Updates the data stored within the TimeItem.
	 * @method update
	 * @param {Object} data The new TimeItem data.
	 */
	TimeItem.prototype.update = function (data) {
		this._log("update", "Enter");
		var title = this._dataMapper.getTitle(data),
			seriesEpisodeText,
			containerCssClass = this._TIME_ITEM_CONTAINER_CSS;
		if (data) {
			if (data.startTime) {
				this._time.setText(this._dataMapper.getText1(data));
			}
			if (data.eventId === $N.app.epgUtil.BAD_EVENT_ID) {
				this._time.setText('');
				this._noEventInfo = true;
			} else {
				this._noEventInfo = false;
			}
			this._isInPast = this._dataMapper.isInPast(data);
			if (this._isInPast) {
				containerCssClass += " catchup";
				this._isPlayable = this._dataMapper.isCatchUp(data);
			} else {
				this._isPlayable = true;
			}
			seriesEpisodeText = $N.app.epgUtil.getSeasonEpisodeShort(data);
			if (seriesEpisodeText) {
				if (this._dataMapper.isBlockedAdultTitle()) {
					this._eventName.setText(title);
				} else {
					this._eventName.setText(title);
					this._subtitle.setText(seriesEpisodeText);
				}
			} else {
				if (!this._noEventInfo) {
					this._eventName.setText(title);
				} else {
					this._eventName.setText("");
				}
			}
			this.updateIcons(data);
			if (this._dataMapper.isEventOnNow(data)) {
				this.showTimeLine();
			} else {
				this.hideTimeLine();
			}
		} else {
			this._eventName.setText(this._titleNoEvent);
		}
		this._container.setCssClass(containerCssClass);
		this.updateStyle();
		this._log("update", "Exit");
	};

	$N.gui = $N.gui || {};
	$N.gui.TimeItem = TimeItem;
}($N || {}));

