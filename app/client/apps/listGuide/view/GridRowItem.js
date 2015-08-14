/**
 * @class $N.gui.GridRowItem
 * @constructor
 * @namespace $N.gui
 * @extends $N.gui.AbstractListItem
 * @requires $N.gui.Group
 * @requires $N.gui.Container
 * @requires $N.gui.ReminderIcon
 * @requires $N.gui.RecordIcon
 * @requires $N.gui.StartOverIcon
 * @requires $N.gui.Label
 * @requires $N.gui.MaskIcon
 * @requires $N.gui.Container
 * @requires $N.gui.Util
 * @param {Object} docRef
 * @param {Object} [parent]
 */
(function ($N) {
	var GridRowItem = function (docRef, parent) {
		GridRowItem.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "GridRowItem");
		this._data = {};
		this.WHPVRTaskListenerId = 0;
		this._gridWidth = 1000;
		this.PADDING = 12;
		this.DOUBLE_PADDING = this.PADDING * 2;
		this.MIN_WIDTH = 4.5;
		this.ARROW_SIZE = 17;
		this.TEXT_ICON_PADDING = 24;
		this._MIN_ICON_WIDTH = $N.app.constants.THIRTY_MINUTES_IN_MS;
		this._MIN_TEXT_WIDTH = $N.app.constants.TEN_MINUTES_IN_MS;
		this._gridRowItemCallBack = null;
		this._isWideEnoughForIcons = true;
		this._isWideEnoughForTitle = true;
		this._isWideEnoughForSubtitle = true;

		this._ITEM_CSS = "gridRowItem border-medium";
		this._ITEM_TITLE_CSS = "gridItemTitle ellipsisLabel ellipsis small";
		this._ITEM_SUBTITLE_CSS = "gridRowItemSubtitle ellipsisLabel ellipsis small eventSubtitleColor";
		this._ICON_CSS = "icon relative";

		this._container = new $N.gui.Container(docRef);

		this._titleContainer = new $N.gui.Label(docRef, this._container);
		this._iconContainer = new $N.gui.Container(docRef, this._titleContainer);
		this._startOverIcon = new $N.gui.StartOverIcon(this._docRef, this._iconContainer);
		this._reminderIcon = new $N.gui.ReminderIcon(this._docRef, this._iconContainer);
		this._recordingIcon = new $N.gui.RecordIcon(this._docRef, this._iconContainer);
		this._title = new $N.gui.InlineLabel(docRef, this._titleContainer);

		this._subtitleContainer = new $N.gui.Label(docRef, this._container);
		this._leftArrow = new $N.gui.MaskIcon(this._docRef, this._subtitleContainer);
		this._subtitle = new $N.gui.InlineLabel(docRef, this._subtitleContainer);
		this._isInPast = false;
		this._container.configure({
			cssClass: this._ITEM_CSS + " gridRowItemBackground"
		});

		this._iconContainer.setCssClass("relative pullRight verticalAlignMiddle");

		this._titleContainer.configure({
			cssClass: this._ITEM_TITLE_CSS
		});

		this._recordingIcon.configure({
			visible: false,
			cssClass: this._ICON_CSS
		});
		this._reminderIcon.configure({
			visible: false,
			cssClass: this._ICON_CSS
		});
		this._startOverIcon.configure({
			visible: false,
			cssClass: this._ICON_CSS
		});
		this._subtitleContainer.configure({
			cssClass: this._ITEM_SUBTITLE_CSS
		});
		this._leftArrow.configure({
			cssClass: "relative verticalAlignMiddle leftArrow",
			width: 18,
			height: 30,
			href: "../../../customise/resources/images/icons/arrows/leftArrowIcon.png",
			color: "#8d9ba9",
			visible: false
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(GridRowItem, $N.gui.AbstractListItem);

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	GridRowItem.prototype.setWidth = function (width) {
		this._width = width;
		this._container.setWidth(width);
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	GridRowItem.prototype.setHeight = function (height) {
		this._height = height;
		this._container.setHeight(height);
	};

	/**
	 * @method setGridWidth
	 * @param {Number} gridWidth
	 */
	GridRowItem.prototype.setGridWidth = function (gridWidth) {
		this._gridWidth = gridWidth;
	};

	/**
	 * @method setGridRowItemCallback
	 * @param {function} callback function
	 */
	GridRowItem.prototype.setGridRowItemCallback = function (callback) {
		this._gridRowItemCallBack = callback;
	};

	/**
	 * @method setTitleSubTitlePlayable
	 * @param {Boolean} playable
	 */
	GridRowItem.prototype.setTitleSubTitlePlayable = function (playable) {
		if (playable) {
			this._titleContainer.setCssClass(this._ITEM_TITLE_CSS);
			this._subtitleContainer.setCssClass(this._ITEM_SUBTITLE_CSS);
		} else {
			this._titleContainer.setCssClass(this._ITEM_TITLE_CSS + " unplayable");
			this._subtitleContainer.setCssClass(this._ITEM_SUBTITLE_CSS + " unplayable");
		}
	};

	/**
	 * @method highlight
	 */
	GridRowItem.prototype.highlight = function () {
		if (this._isInPast) {
			this._container.setCssClass(this._ITEM_CSS  + " pastEventHighlightOn");
			this._titleContainer.setCssClass("gridItemTitle ellipsisLabel ellipsis small pastEventHighlightTitle");
			this._subtitleContainer.setCssClass("gridRowItemSubtitle ellipsisLabel ellipsis small pastEventHighlightSubTitle");
		} else {
			this._container.setCssClass(this._ITEM_CSS  + " eventHighlightOn");
			this._titleContainer.setCssClass(this._ITEM_TITLE_CSS);
			this._subtitleContainer.setCssClass(this._ITEM_SUBTITLE_CSS);
		}
	};

	/**
	 * @method unHighlight
	 */
	GridRowItem.prototype.unHighlight = function () {
		var dataMapper = this._dataMapper,
			data = this._data;
		this._isInPast = false;
		if (dataMapper.isEventOnNow(data)) {
			this.setTitleSubTitlePlayable(true);
			this._container.setCssClass(this._ITEM_CSS + " gridRowItemBackgroundOnNow");
		} else if (dataMapper.isCatchUp(data)) {
			this.setTitleSubTitlePlayable(true);
			this._container.setCssClass(this._ITEM_CSS + " gridRowItemBackgroundCatchup");
		} else if (dataMapper.isInPast(data)) {
			this.setTitleSubTitlePlayable(false);
			this._isInPast = true;
			this._container.setCssClass(this._ITEM_CSS + " gridRowItemBackgroundPast");
		} else if (data.overlapStartTime && !$N.app.LaunchUtil.isReleaseBuild()) {
			this.setTitleSubTitlePlayable(false);
			this._container.setCssClass(this._ITEM_CSS + " gridRowItemBackgroundOverlap");
		} else {
			this.setTitleSubTitlePlayable(true);
			this._container.setCssClass(this._ITEM_CSS + " gridRowItemBackground");
		}
	};

	/**
	 * @method setSecondaryFocusOn
	 */
	GridRowItem.prototype.setSecondaryFocusOn = function () {
		this._container.setCssClass(this._ITEM_CSS + " eventSecondaryFocusBackground");
	};

	/**
	 * @method setSecondaryFocusOff
	 */
	GridRowItem.prototype.setSecondaryFocusOff = function () {
		this._container.setCssClass(this._ITEM_CSS + " eventHighlightOn");
	};

	/**
	 * @method _updateSize
	 * @param {Number} startTime
	 * @param {Number} endTime
	 */
	GridRowItem.prototype._updateSize = function (startTime, endTime) {
		var windowStartTime = this._dataMapper.getWindowStartTime(),
			windowEndTime = windowStartTime + $N.app.constants.GRID_TIME_WINDOW,
			itemStart = Math.max(startTime, windowStartTime),
			itemEnd = Math.min(endTime, windowEndTime),
			itemDuration = itemEnd - itemStart,
			itemWidth = itemDuration * (this._gridWidth / $N.app.constants.GRID_TIME_WINDOW);

		this._isWideEnoughForTitle = itemDuration >= this._MIN_TEXT_WIDTH;
		this._isWideEnoughForSubtitle = itemDuration > this._MIN_TEXT_WIDTH;
		this._isWideEnoughForIcons = itemDuration >= this._MIN_ICON_WIDTH;

		if (itemEnd !== windowEndTime) {
			itemWidth = itemWidth - this.PADDING;
		}
		this.setWidth(itemWidth);
	};

	/**
	 * @method _updateArrows
	 */
	GridRowItem.prototype._updateArrows = function () {
		var INNER_PADDING = 10,
			subtitleWidth = this._width - this.DOUBLE_PADDING;
		if (this._dataMapper.getStartTime(this._data) < this._dataMapper.getWindowStartTime() && subtitleWidth > (this.ARROW_SIZE + INNER_PADDING)) {
			this._leftArrow.show();
		} else {
			this._leftArrow.hide();
		}
	};

	/**
	 * @method updateIcons
	 */
	GridRowItem.prototype.updateIcons = function () {
		this._log("updateIcons", "Enter");
		var uniqueEventId = this._dataMapper.getUniqueEventId(this._data);

		if (uniqueEventId && this._isWideEnoughForIcons) {
			this._reminderIcon.update(this._data);
			this._startOverIcon.update(this._data);
			this._recordingIcon.update(this._data);

		} else {
			this._reminderIcon.hide();
			this._recordingIcon.hide();
			this._startOverIcon.hide();
		}
		this._log("updateIcons", "Exit");
	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	GridRowItem.prototype.update = function (data) {
		var startTime = this._dataMapper.getStartTime(data),
			endTime = this._dataMapper.getEndTime(data);
		this._data = data;
		this.unHighlight();
		this._updateSize(startTime, endTime);
		this._updateArrows();
		if (this._isWideEnoughForTitle) {
			this._title.setText(this._dataMapper.getTitle(this._data));
		} else {
			this._title.setText("");
		}
		if (this._isWideEnoughForSubtitle) {
			this._subtitle.setText(this._dataMapper.getSubtitle(this._data));
		} else {
			this._subtitle.setText("");
		}
		this.updateIcons();
		this._dataMapper.markForUpdatingEventBackgroundAsTimePasses(data);
	};

	/**
	 * @method updateRecordIcon
	 * @param {Object} data
	 */
	GridRowItem.prototype.updateRecordIcon = function (data) {
		var SCHEDULE_TASK_STATE = {
				TASK_STATE_INVALID: 0,
				TASK_STATE_WAITING_FOR_START: 1,
				TASK_STATE_RECORDING: 2,
				TASK_STATE_COMPLETED: 3,
				TASK_STATE_ERROR: 4,
				TASK_STATE_FATAL_ERROR: 5
			},
			eventId = data.cdsEventObjectId.substring(4),
			recordingState = 0;
		//TODO: check event id
		//TODO: series record
		switch (data.state) {
		case SCHEDULE_TASK_STATE.TASK_STATE_WAITING_FOR_START:
			recordingState = $N.app.PVRUtil.SCHEDULED;
			break;
		case SCHEDULE_TASK_STATE.TASK_STATE_RECORDING:
			recordingState = $N.app.PVRUtil.ACTIVE;
			break;
		case SCHEDULE_TASK_STATE.ASK_STATE_COMPLETED:
			$N.apps.util.EventManager.unSubscribe(this.getWHPVRTaskOKEventSubscriptionId);
			break;
		default:
			$N.apps.util.EventManager.unSubscribe(this.getWHPVRTaskOKEventSubscriptionId);
			break;
		}

		this._recordingIcon.update(null, null, recordingState);
	};

	/**
	 * @method subscribeToWHPVRTask
	 */
	GridRowItem.prototype.subscribeToWHPVRTask = function () {
		this._log("subscribeToWHPVRTask", "Enter&Exit");
		var me = this;
		function WHPVRTaskListener(obj) {
			this._log("WHPVRTaskListener", "Enter");
			if (obj) {
				me.updateRecordIcon(obj.data);
			}
			this._log("WHPVRTaskListener", "Exit");
		}
		if (!this.WHPVRTaskListenerId) {
			this.WHPVRTaskListenerId = $N.apps.util.EventManager.subscribe("WHPVRcreateTask", WHPVRTaskListener, this);
		}
	};

	GridRowItem.prototype.keyHandler = function (key) {
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false,
			me = this,
			recordingCallback = function () {
				me.subscribeToWHPVRTask();
				if (me._gridRowItemCallBack) {
					me._gridRowItemCallBack(me._data);
				}
				me.updateIcons();
			};

		switch (key) {
		case keys.KEY_RECORD:
			if ($N.app.PVRUtil.isRecordable(this._data)) {
				$N.app.PVRUtil.recordOrCancelEvent(this._data, recordingCallback);
			}
			handled = true;
			break;

		case keys.KEY_STOP:
			$N.app.PVRUtil.cancelEvent(this._data, recordingCallback);
			handled = true;
			break;

		}

		return handled;
	};

	$N.gui = $N.gui || {};
	$N.gui.GridRowItem = GridRowItem;
}(window.parent.$N || {}));
