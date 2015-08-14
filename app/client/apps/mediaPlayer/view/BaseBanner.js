/**
 * BaseBanner is a base class containing shared banner components
 *  for use in PlaybackBanner, TimeshiftBanner, etc.
 * @class BaseBanner
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 * @author hepton
 */
var $N = window.parent.$N;

function BaseBanner(docRef, parent) {
	'use strict';
	$N.apps.core.Language.adornWithGetString(BaseBanner, "apps/mediaPlayer/common/");
	BaseBanner.superConstructor.call(this, docRef);
	this._log = new $N.apps.core.Log("MediaPlayer", "BaseBanner");
	this._log("BaseBanner", "Enter");
	this._container = new $N.gui.Container(docRef);
	this._backgroundBox = new $N.gui.BackgroundBox(docRef, this._container);
	this._rewContainer = new $N.gui.Container(docRef, this._container);
	this._playPauseContainer = new $N.gui.Container(docRef, this._container);
	this._ffwContainer = new $N.gui.Container(docRef, this._container);
	this._rewIcon = new $N.gui.Image(docRef, this._rewContainer);
	this._ffwIcon = new $N.gui.Image(docRef, this._ffwContainer);
	this._playPauseIcon = new $N.gui.Image(docRef, this._playPauseContainer);
	this._speedIndicator = new $N.gui.Label(docRef, this._container);
	this._eventName = new $N.gui.Label(docRef, this._container);
	this._progress = new $N.gui.LabelledProgressBar(docRef, this._container);
	this._items = [this._rewContainer, this._playPauseContainer, this._ffwContainer];
	this._selectedItemIndex = 0;
	this._SPEED_INDICATOR_OFFSET = 15;
	this.SPEED_INDICATOR_REW_X = 475;
	this.SPEED_INDICATOR_PLAY_X = 562;
	this.SPEED_INDICATOR_FFW_X = 649;
	this._rewIcon.iconUrl = "../../../customise/resources/images/%RES/icons/rwd.png";
	this._ffwIcon.iconUrl = "../../../customise/resources/images/%RES/icons/fwd.png";
	this.PLAY_ICON_URL = "../../../customise/resources/images/%RES/actionIcons/Icn_actionPlay.png";
	this.PAUSE_ICON_URL = "../../../customise/resources/images/%RES/actionIcons/Icn_actionPause.png";
	this.PROGRESS_WIDTH = 793.5;
	this.SPEED_INDICATOR_FADEOUT_TIME = 500;
	this._bannerTimeout = null;
	this._speedIndicatorTimeout = null;

	this._container.configure({
		height: 480,
		width: 1920
	});

	this._backgroundBox.configure({
		x: 0,
		y: 0,
		height: 480,
		width: 1920,
		cssClass: "playbackBackground",
		opacity: 1
	});

	this._speedIndicator.configure({
		x: 492,
		y: 252,
		height: 60,
		width: 150,
		cssClass: "timeShiftSpeedIndicator",
		visible: false
	});

	this._eventName.configure({
		x: 750,
		y: 282.5,
		height: 60,
		width: this.PROGRESS_WIDTH,
		cssClass: "settingsDescriptionSmall"
	});

	this._rewContainer.configure({
		x: 510,
		y: 299,
		height: 60,
		width: 60,
		rounding: 2,
		cssClass: "timeShiftButton"
	});

	this._rewIcon.configure({
		x: 14,
		y: 18,
		href: this._rewIcon.iconUrl
	});

	this._playPauseContainer.configure({
		x: 600,
		y: 299,
		height: 60,
		width: 60,
		rounding: 2,
		cssClass: "timeShiftButton"
	});

	this._playPauseIcon.configure({
		x: 0,
		y: 0,
		href: this.PLAY_ICON_URL
	});

	this._ffwContainer.configure({
		x: 690,
		y: 299,
		height: 60,
		width: 60,
		rounding: 2,
		cssClass: "timeShiftButton"
	});

	this._ffwIcon.configure({
		x: 19,
		y: 18,
		href: this._ffwIcon.iconUrl
	});

	this._progress.configure({
		x: 795,
		y: 314,
		width: this.PROGRESS_WIDTH,
		progressOuterCssClass: "timeShiftProgressOuter",
		progressInnerCssClass: "timeShiftProgressInner",
		progressBarProperties: {
			x: 0,
			y: 2,
			height: 15,
			width: this.PROGRESS_WIDTH
		},
		startLabelProperties: {
			x: 0,
			y: 50,
			cssClass: "timeShiftProgressStartLabel"
		},
		endLabelProperties: {
			x: this.PROGRESS_WIDTH,
			y: 50,
			cssClass: "timeShiftProgressEndLabel"
		}
	});

	this._rootSVGRef = this._container.getRootSVGRef();

	if (parent) {
		parent.addChild(this);
	}
	this._log("BaseBanner", "Exit");
}
$N.gui.Util.extend(BaseBanner, $N.gui.GUIObject);

/**
 * @method setEventNameText
 * @param {String} text
 */
BaseBanner.prototype.setEventNameText = function (text) {
	this._log("setEventNameText", "Enter");
	this._eventName.setText(text || "");
	this._log("setEventNameText", "Exit");
};

/**
 * @method setSpeedIndicatorText
 * @param {String} value for the speed indicator label.
 */
BaseBanner.prototype.setSpeedIndicatorText = function (value) {
	this._log("setSpeedIndicatorText", "Enter");
	this._speedIndicator.setText(value);
	this._log("setSpeedIndicatorText", "Exit");
};

/**
 * @method hideSpeedIndicator
 */
BaseBanner.prototype.hideSpeedIndicator = function () {
	this._log("hideSpeedIndicator", "Enter");
	this._speedIndicator.hide();
	this._log("hideSpeedIndicator", "Exit");
};

/**
 * @method showSpeedIndicator
 */
BaseBanner.prototype.showSpeedIndicator = function () {
	this._log("showSpeedIndicator", "Enter");
	this._speedIndicator.show();
	this._log("showSpeedIndicator", "Exit");
};

/**
 * Sets the x position of speed indicator label
 * @param {Number} index (optional)
 */
BaseBanner.prototype.setSpeedIndicatorX = function (index) {
	this._log("setSpeedIndicatorX", "Enter");
	var DOUBLE_NUMBER_OFFSET = 13,
		relevantItemTrueX = index ? this._items[index]._trueX : this._items[this._selectedItemIndex]._trueX,
		x = relevantItemTrueX + this._SPEED_INDICATOR_OFFSET,
		textLength = this._speedIndicator.getText().length;
	if (textLength > 2) {
		x -= DOUBLE_NUMBER_OFFSET;
	}
	this._speedIndicator.setX(x);
	this._log("setSpeedIndicatorX", "Exit");
};

/**
 * return the selected item index
 * @method getSelectedIndex
 * @return {Number}
 */
BaseBanner.prototype.getSelectedIndex = function () {
	return this._selectedItemIndex;
};

/**
 * Select the button by highlighting it and unhighlight the previously selected button
 * @method select
 * @param {Number} index of item to select
 */
BaseBanner.prototype.select = function (index) {
	var item = this._items[this._selectedItemIndex];
	if (index === this._selectedItemIndex) {
		item.setCssClass("timeShiftButton_highlight");
		return;
	}
	if (item) {
		item.setCssClass("timeShiftButton");
	}
	item = this._items[index];
	if (item) {
		this._selectedItemIndex = index;
		item.setCssClass("timeShiftButton_highlight");
	}
};

/**
 * Select the next button by highlighting it and unhighlight the previously selected button
 * @method selectNext
 */
BaseBanner.prototype.selectNext = function () {
	if (this._selectedItemIndex < this._items.length - 1) {
		this.select(this._selectedItemIndex + 1);
	}
};

/**
 * Select the previous button by highlighting it and unhighlight the previously selected button
 * @method selectPrevious
 */
BaseBanner.prototype.selectPrevious = function () {
	if (this._selectedItemIndex > 0) {
		this.select(this._selectedItemIndex - 1);
	}
};

/**
 * Adaptor method sets the start and end labels of the progress bar
 * @method setProgressBarStartEnd
 * @param {Number} startTime in milliseconds
 * @param {Number} endTime in milliseconds
 */
BaseBanner.prototype.setProgressBarStartEnd = function (startTime, endTime) {
	var startStr,
		endStr;
	if (startTime && endTime) {
		startStr = $N.app.DateTimeUtil.getFormattedTimeStringFromTime(startTime, "HH:mm");
		endStr = $N.app.DateTimeUtil.getFormattedTimeStringFromTime(endTime, "HH:mm");
		this._progress.setProgressBarLabels(startStr, endStr);
	}
};

/**
 * Updates the progress marker position and end position.
 * @method updateProgressBar
 * @param {Number} playerPosition in milliseconds
 * @param {Number} recordPosition in milliseconds
 */
BaseBanner.prototype.updateProgressBar = function (playerPosition, recordPosition) {
	this._progress.updateProgressBar(0, recordPosition, playerPosition);
};

/**
 * Toggles the play/pause icon
 * @method togglePlayPauseIcon
 * @param {Boolean} isPlaying to indicate if the initial state is in play
 */
BaseBanner.prototype.togglePlayPauseIcon = function (isPlaying) {
	var isInPlay = isPlaying === undefined ? this._playPauseIcon.getHref() === this.PLAY_ICON_URL : isPlaying,
		iconHref = isInPlay ? this.PAUSE_ICON_URL : this.PLAY_ICON_URL;
	this._playPauseIcon.setHref(iconHref);
};

/**
 * Returns the class name as a String.
 * @method toString
 * @return {String} The class name as a String.
 */
BaseBanner.prototype.toString = function () {
	return "BaseBanner";
};
