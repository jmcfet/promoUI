/**
 * The playback banner is displayed when a viewer initiates
 * playback of a recording or on demand content and has components
 * for trickplay icons and a progress bar etc.
 * @class PlaybackBanner
 * @constructor
 * @extends BaseBanner
 * @param {Object} docRef
 * @param {Object} parent
 * @author hepton
 */
var $N = window.parent.$N,
	BaseBanner = BaseBanner || {};

function PlaybackBanner(docRef, parent) {
	'use strict';
	$N.apps.core.Language.adornWithGetString(PlaybackBanner, "apps/mediaPlayer/common/");
	PlaybackBanner.superConstructor.call(this, docRef);
	this._log = new $N.apps.core.Log("MediaPlayer", "PlaybackBanner");
	this._log("PlaybackBanner", "Enter");

	this._radialGradient = new $N.gui.BackgroundBox(docRef, this._container);

	this._stopContainer = new $N.gui.Container(docRef, this._container);


	this._stopIcon = new $N.gui.Image(docRef, this._stopContainer);
	this._stopIcon.iconUrl = "../../../customise/resources/images/%RES/icons/stop.png";

	this._replayContainer = new $N.gui.Container(docRef, this._container);

	this._replayIcon = new $N.gui.Image(docRef, this._replayContainer);
	this._replayIcon.iconUrl = "../../../customise/resources/images/%RES/icons/restart.png";

	this._items = [this._stopContainer, this._replayContainer, this._rewContainer, this._playPauseContainer, this._ffwContainer];

	this._radialGradient.configure({
		x: 96,
		y: 360,
		width: 1728,
		height: 240,
		cssClass: "radialGradientBackground"
	});

	this._rewIcon.configure({
		x: 14,
		y: 13,
		href: this._rewIcon.iconUrl
	});

	this._ffwIcon.configure({
		x: 17,
		y: 13,
		href: this._ffwIcon.iconUrl
	});

	this._progress.configure({
		x: 795,
		y: 317,
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
			y: 19,
			cssClass: "timeShiftProgressStartLabel"
		},
		endLabelProperties: {
			x: this.PROGRESS_WIDTH - 112,
			y: 19,
			cssClass: "timeShiftProgressEndLabel"
		}
	});

	this._playPauseIcon.configure({
		x: 5,
		y: 3,
		height: 53,
		width: 53,
		href: this.PLAY_ICON_URL
	});

	this._stopContainer.configure({
		x: 330,
		y: 299,
		height: 60,
		width: 60,
		rounding: 2,
		cssClass: "timeShiftButton"
	});

	this._stopIcon.configure({
		x: 16,
		y: 16,
		width: 25,
		height: 25,
		href: this._stopIcon.iconUrl
	});

	this._replayContainer.configure({
		x: 420,
		y: 299,
		height: 60,
		width: 60,
		rounding: 2,
		cssClass: "timeShiftButton"
	});

	this._replayIcon.configure({
		x: 12,
		y: 15,
		width: 38,
		height: 24,
		href: this._replayIcon.iconUrl
	});

	this._rootSVGRef = this._container.getRootSVGRef();

	if (parent) {
		parent.addChild(this);
	}
	this._log("PlaybackBanner", "Exit");
}
$N.gui.Util.extend(PlaybackBanner, BaseBanner);

/**
 * Adaptor method sets the start and end labels of the progress bar
 * @method setProgressBarStartEnd
 * @param {String} startTimeString
 * @param {String} endTimeString
 */
PlaybackBanner.prototype.setProgressBarStartEnd = function (startTimeString, endTimeString) {
	this._progress.setProgressBarLabels(startTimeString, endTimeString);
};

/**
 * Returns the class name as a String.
 * @method toString
 * @return {String} The class name as a String.
 */
PlaybackBanner.prototype.toString = function () {
	return "PlaybackBanner";
};
