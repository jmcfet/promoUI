/**
 * @class $N.gui.AgoraListItem
 * @constructor
 * @requires $N.gui.RecordIcon
 * @requires $N.gui.StartOverIcon
 * @requires $N.gui.ReminderIcon
 * @requires $N.gui.ChannelLogo
 * @requires $N.gui.DelayedScrollingLabel
 * @requires $N.gui.ContentProgressBar
 * @requires $N.gui.Util
 * @extends $N.gui.AbstractListItem
 *
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	function AgoraListItem(docRef, parent) {
		var me = this;
		AgoraListItem.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "AgoraListItem");

		this.EVENT_NAME_WIDTH = 676;
		this.isFocused = true;
		this.isHighlighted = false;
		this.recordIconTimeout = null;
		this._currentEventText = null;
		this.SEPARATOR = " - ";
		this._event = null;

		this._container = new $N.gui.ListItem(this._docRef);
		this._container.configure({
			width: 942
		});

		this._background = new $N.gui.Container(docRef, this._container);
		this._background.configure({
			x: 225,
			y: 0,
			width: 717,
			height: 97.5,
			cssClass: "agoraListItemBackground"
		});

		this._highlight = new $N.gui.Container(docRef, this._container);
		this._highlight.configure({
			x: 0,
			y: 0,
			width: 942,
			height: 97.5,
			cssClass: "channelListItemHighlight",
			visible: true
		});
		this._channelLogo = new $N.gui.ChannelLogo(this._docRef, this._container);
		this._channelLogo.configure({
			x: 115.5,
			y: 0,
			width: 96,
			height: 96
		});

		this._channelDetails = new $N.gui.Container(docRef, this._container);
		this._channelDetails.configure({
			x: 24,
			y: 19,
			width: 120,
			height: 60
		});
		this._channelNum = new $N.gui.InlineLabel(this._docRef, this._channelDetails);
		this._channelNum.configure({
			cssClass: "channelListChanNum"
		});

		this._cursor = new $N.gui.InlineLabel(this._docRef, this._channelDetails);
		this._cursor.configure({
			cssClass: "channelListChanNum"
		});

		this._eventName = new $N.gui.DelayedScrollingLabel(this._docRef, this._container);
		this._eventName.configure({
			x: 240,
			y: 3,
			width: me.EVENT_NAME_WIDTH,
			duration: "250ms"
		});



		this._eventSeriesEpisodeTitle = new $N.gui.Label(this._docRef, this._container);
		this._eventSeriesEpisodeTitle.configure({
			x: 240,
			y: 3,
			width: me.EVENT_NAME_WIDTH,
			height: 50,
			cssClass: "agoraSeriesEpisodeTitle"
		});

		// progress bar
		this._progressBarGroup = new $N.gui.Group(docRef, this._container);
		this._progress = new $N.gui.ContentProgressBar(docRef, this._progressBarGroup);
		this._startTime = new $N.gui.Label(docRef, this._progressBarGroup);
		this._endTime = new $N.gui.Label(docRef, this._progressBarGroup);
		this._progressBarGroup.configure({
			width: 808.5,
			height: 50,
			x: 240,
			y: 56,
			visible: true
		});
		this._startTime.configure({
			x: 0,
			y: -3,
			width: this._startTimeWidth,
			height: 50,
			text: "00:00",
			cssClass: 'startAndEndTimeMiniguideEventGroup'
		});
		this._progress.configure({
			x: 95,
			y: 12,
			width: 316.5,
			height: 10,
			minimumValue: 0,
			maximumValue: 300,
			progress: 150,
			outerCssClass: "agoraProgressOuter",
			innerCssClass: "agoraProgressInner glowEffect"
		});
		this._endTime.configure({
			x: 417,
			y: -3,
			width: 140,
			height: 50,
			text: "24:00",
			cssClass: 'startAndEndTimeMiniguideEventGroup'
		});

		// event status icons
		this._catchupIcn = new $N.gui.Image(docRef, this._container);
		this._startOverIcon = new $N.gui.StartOverIcon(docRef, this._container);
		/*
		 * $N.gui.RecordIcon is alternative.
		 */
		this._recordIcon = new $N.gui.RecordIcon(docRef, this._container);
		this._reminderIcn = new $N.gui.ReminderIcon(docRef, this._container);
		this._catchupIcn.configure({
			width: 36,
			height: 36,
			x: 910,
			y: 6,
			href: "../../../customise/resources/images/%RES/icons/optionIcons/catchup_icon.png",
			visible: false
		});
		this._startOverIcon.configure({
			x: 910,
			y: 6,
			visible: false
		});
		this._recordIcon.configure({
			x: 910,
			y: 6
		});
		this._reminderIcn.configure({
			x: 910,
			y: 6
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}

		this.iconX = 0;
		this.iconStepX = 48;
		this.setAnimationDuration("200ms");
		this.addMoveAnimation();
		this.addFadeAnimation();
	}
	$N.gui.Util.extend(AgoraListItem, $N.gui.AbstractListItem);

	/**
	 * Updates the position and text of event title and SeriesEpisodeTitle.
	 * @method update
	 *
	 * @param {Object} event data object.
	 */
	AgoraListItem.prototype.updateEventTitle = function (event) {
		var gapTextAndIcon = 12,
			MAX_EVENT_ICONS_START_POS_X = this._container.getTrueWidth() - this.iconStepX * 3;

		this._eventName.setText(this._dataMapper.getTitle(event), true);
		this._eventSeriesEpisodeTitle.setText(this._dataMapper.getSeriesEpisodeTitle(event), true);
		this.iconX = this._eventName.getTrueTextLength() + this._eventName.getTrueX() + gapTextAndIcon;
		if (this.iconX > MAX_EVENT_ICONS_START_POS_X) {
			this.iconX = MAX_EVENT_ICONS_START_POS_X;
			this._eventName.setWidth(this.iconX - this._eventName.getTrueX() - gapTextAndIcon);
			this._eventSeriesEpisodeTitle.hide();
			return;
		}
		this._eventSeriesEpisodeTitle.setX(this.iconX);
		this._eventSeriesEpisodeTitle.show();
		this.iconX += this._eventSeriesEpisodeTitle.getTrueTextLength() + gapTextAndIcon;
		if (this.iconX > MAX_EVENT_ICONS_START_POS_X) {
			this.iconX = MAX_EVENT_ICONS_START_POS_X;
			this._eventSeriesEpisodeTitle.setWidth(this.iconX - this._eventSeriesEpisodeTitle.getTrueX() - gapTextAndIcon);
		}
	};

	/**
	 * Updates the data stored within the AgoraListItem.
	 * @method update
	 *
	 * @param {Object} data Object containing the new data.
	 */
	AgoraListItem.prototype.updateRecordIcon = function () {
		if (this._event) {
			this._recordIcon.update(this._event);
		}
	};

	/**
	 * Updates the data stored within the AgoraListItem.
	 * @method update
	 *
	 * @param {Object} data Object containing the new data.
	 */
	AgoraListItem.prototype.updateEventIcons = function (event) {
		this._log("updateEventIcons", "Enter");
		this._recordIcon.update(event);
		this._recordIcon.setX(this._container.getTrueWidth() - this.iconStepX);
		this._reminderIcn.setX(this._container.getTrueWidth() - this.iconStepX);
		this._startOverIcon.setX(this._container.getTrueWidth() - this.iconStepX);
		if (this._recordIcon.isVisible()) {
			this._reminderIcn.setX(this._container.getTrueWidth() - 2 * this.iconStepX);
			this._startOverIcon.setX(this._container.getTrueWidth() - 2 * this.iconStepX);
		}
		this._reminderIcn.update(event);
		this._startOverIcon.update(event);
		this._log("updateEventIcons", "Exit");
	};

	/**
	 * Updates the red icon by event valid or not.
	 * @method updateRedIcon
	 *
	 * @param {Boolean} True if event is valid
	 */
	AgoraListItem.prototype.updateRedIcon = function (state) {
		var currentUrl =  this._dataMapper.getRedButton().getHref(),
			iconPath = state ? $N.app.constants.ACTIVE_INFO_BUTTON_PATH : $N.app.constants.INACTIVE_INFO_BUTTON_PATH;
		if (currentUrl !== iconPath) {
			this._dataMapper.getRedButton().setHref(iconPath);
		}
	};

	/**
	 * Updates the data stored within the AgoraListItem.
	 * @method update
	 *
	 * @param {Object} data Object containing the new data.
	 */
	AgoraListItem.prototype.update = function (data) {
		this._log("update", "Enter");
		if (data) {
			this._highlight._innerElement.style.visibility = "hidden";
			this._channelLogo.update(data);
			this.updateForChannelEntryOver();
			this._channelNum.show();
			this._eventName.show();
			this._channelNum.setText($N.app.GeneralUtil.padNumberWithZeroes(this._dataMapper.getChannelNumber(data), 3));
			var event = this._dataMapper.getEventObj(data);
			this._event = event;
			if (event) {
				this._eventName.setWidth(this.EVENT_NAME_WIDTH);
				this._eventSeriesEpisodeTitle.setWidth(this.EVENT_NAME_WIDTH);
				this._catchupIcn.hide();
				this._startOverIcon.hide();
				this._recordIcon.hide();
				this._reminderIcn.hide();
				if ($N.app.EventUtil.isValidEvent(event)) {
					this._progressBarGroup.show();
					if (this._dataMapper.isAseguirView()) {
						this._background.setCssClass("aseguirListItemBackground");
					} else {
						this._background.setCssClass("agoraListItemBackground");
					}
					this._eventName.setCssClass("agoraEventName");
					this.updateProgress(this._dataMapper.getProgressBarData(event));
					this.updateEventTitle(event);
					this.updateEventIcons(event);
				} else {
					this._eventName.setText(this._dataMapper.getString("programInfoUnavailable"), true);
					this._eventSeriesEpisodeTitle.hide();
					this._background.setCssClass("agoraInvalidChannelBackground");
					this._eventName.setCssClass("agoraInvalidEventName");
					this._progressBarGroup.hide();
				}
			}
			event = null;
		}
		this._log("update", "Exit");
	};

	/**
	 * @method updateProgress
	 * @param {Object} progressData an object comprising the data needed for the progress bar
	 * ...(minimum, maximum and progress values)
	 */
	AgoraListItem.prototype.updateProgress = function (progressData) {
		this._log("updateProgress", "Enter");
		var startLabel = $N.apps.util.Util.formatTime(new Date(progressData.minimum), "HH:MM"),
			endLabel = $N.apps.util.Util.formatTime(new Date(progressData.maximum), "HH:MM");
		this._progress.setMinimumValue(progressData.minimum);
		this._progress.setMaximumValue(progressData.maximum);
		this._startTime.setText(startLabel);
		this._endTime.setText(endLabel);
		this._progress.setProgress(progressData.progress);

		if (progressData.minimum > Date.now()) {
			this._progressBarGroup.show();
			this._progress.hide();
			this._endTime.hide();
			this._startTime.setText(startLabel + ' - ' + endLabel);
			this._isProgressBarDisplayed = false;
		} else {
			this._progress.show();
			this._endTime.show();
			this._progressBarGroup.show();
			this._isProgressBarDisplayed = true;
		}
		this._log("updateProgress", "Exit");
	};

	/**
	 * @method setServiceNumber
	 * @param {Number} number
	 */
	AgoraListItem.prototype.setServiceNumber = function (number) {
		this._log("setServiceNumber", "Enter & Exit");
		this._channelNum.setText($N.app.GeneralUtil.padNumberWithZeroes(number, 3));
	};

	/**
	 * @method getServiceNumber
	 * @return {Object} the service number label
	 */
	AgoraListItem.prototype.getServiceNumber = function () {
		this._log("getServiceNumber", "Enter & Exit");
		return this._channelNum.getText();
	};

	/**
	 * @method setServiceNumberCssClass
	 * @param {String} cssName
	 */
	AgoraListItem.prototype.setServiceNumberCssClass = function (cssClass) {
		this._channelNum.setCssClass(cssClass);
	};

	/**
	 * @method setCursorCssClass
	 * @param {String} cssName
	 */
	AgoraListItem.prototype.setCursorCssClass = function (cssClass) {
		this._cursor.setCssClass(cssClass);
	};

	/**
	 * @method updateForChannelEntry
	 */
	AgoraListItem.prototype.updateForChannelEntry = function () {
		this._channelDetails.setX(8);
		this._channelDetails.setY(8);
		this._channelNum.setCssClass("directChannelNumberEntry");
		this._cursor.setCssClass("directChannelNumberEntry");
	};

	/**
	 * @method updateForChannelEntryOver
	 */
	AgoraListItem.prototype.updateForChannelEntryOver = function () {
		this._channelDetails.setX(24);
		this._channelDetails.setY(19);
		this._channelNum.setCssClass("channelListChanNum");
	};

	/**
	 * @method updateHighlight
	 */
	AgoraListItem.prototype.updateHighlight = function () {
		if (this.isHighlighted) {
			if (this.isFocused) {
				this._highlight._innerElement.style.visibility = "visible";
				var service = this._dataMapper.getFocusService(),
					eventObject = this._dataMapper.getEventObj(service);
				if ($N.app.EventUtil.isValidEvent(eventObject)) {
					this.updateRedIcon(true);
				} else {
					this.updateRedIcon(false);
				}
				this._dataMapper.setReminderButtonLabel(eventObject);
				service = null;
				eventObject = null;
				this._eventName.start();
			} else {
				this._eventName.stop();
				this._highlight._innerElement.style.visibility = "hidden";
			}
		} else {
			this._eventName.stop();
			this._highlight._innerElement.style.visibility = "hidden";
		}
	};

	/**
	 * @method highlight
	 */
	AgoraListItem.prototype.highlight = function () {
		var currentEventNameWidth = null,
			currentEventName = null;
		this.isHighlighted = true;
		if (this._eventSeriesEpisodeTitle.getText().length > 0 && (this.EVENT_NAME_WIDTH > this._eventSeriesEpisodeTitle.getTrueWidth()) && !this._currentEventText) {
			currentEventName = this._currentEventText + this.SEPARATOR + this._eventSeriesEpisodeTitle.getText();
			currentEventNameWidth = this._eventName.getWidth() + this._eventSeriesEpisodeTitle.getWidth();
			this._currentEventText = this._eventName.getText();
			this._eventName.setText(this._currentEventText + this.SEPARATOR + this._eventSeriesEpisodeTitle.getText(), true);
			this._eventName.setWidth(currentEventNameWidth);
			this._eventSeriesEpisodeTitle.hide();
		}
		this.updateHighlight();
	};
	/**
	 * @method unHighlight
	 */
	AgoraListItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
		if ((!this._eventSeriesEpisodeTitle.isVisible()) && this._currentEventText) {
			this._eventName.setWidth(this.EVENT_NAME_WIDTH);
			this._eventName.setText(this._currentEventText, true);
			this._currentEventText = null;
			this._eventSeriesEpisodeTitle.show();
		}
	};
	/**
	 * @method focus
	 */
	AgoraListItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};
	/**
	 * @method defocus
	 */
	AgoraListItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};
	/**
	 * @method manualUpdateRcdIcon
	 */
	AgoraListItem.prototype.manualUpdateRecordIcon = function () {
		if (this.recordIconTimeout) {
			clearTimeout(this.recordIconTimeout);
			this.recordIconTimeout = null;
		}
		this.recordIconTimeout = setTimeout(this.updateRecordIcon(), 1000);
	};

	/**
	 * @method setDataMapper
	 * @param {Object} dataMapper
	 */
	AgoraListItem.prototype.setDataMapper = function (dataMapper) {
		AgoraListItem.superClass.setDataMapper.call(this, dataMapper);
		this._channelLogo.setDataMapper(dataMapper);
	};

	$N.gui = $N.gui || {};
	$N.gui.AgoraListItem = AgoraListItem;
}($N || {}));

