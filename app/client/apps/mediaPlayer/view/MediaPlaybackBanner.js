/**
 * MediaPlaybackBanner is common Banner class which can be configured to handle Photo, Audio and Video playback
 * file for view and has components for navigation to Next, Prev, Shuffle, Play, Stop, Replay and Trick keys
 * @class MediaPlaybackBanner
 * @constructor
 * @extends BaseBanner
 * @param {Object} docRef
 * @param {Object} parent
 * @author Kiran
 */
var $N = window.parent.$N,
	BaseBanner = BaseBanner || {};

function MediaPlaybackBanner(docRef, parent) {
	'use strict';
	$N.apps.core.Language.adornWithGetString(MediaPlaybackBanner, "apps/mediaPlayer/common/");
	MediaPlaybackBanner.superConstructor.call(this, docRef);
	this._log = new $N.apps.core.Log("MediaPlayer", "MediaPlaybackBanner");
	this._log("MediaPlaybackBanner", "Enter");

	this.ICON_POSITION_Y = 250.5;
	this.CONTAINER_WIDTH = 60;
	this.SPACE_BETWEEN_ICONS = 30;
	this.PROGRESS_WIDTH = 393;
	this.playing = false;
	this.shuffleOn = false;
	this.repeatOn = false;
	this.trickKeysLabelText = null;

	this.availableIconsForBanner = $N.app.constants.TRICKPLAY_ICONS_FOR_PHOTO_AUDIO_VIDEO_PLAYBACK;
	this.configuredIcons = [];
	this.preferredIconsListLength = null;
	this._backgroundBox.setCssClass("miniguideBackground");

	this._stopContainer = new $N.gui.Container(docRef, this._container);
	this._stopIcon = new $N.gui.Image(docRef, this._stopContainer);
	this._stopIcon.iconUrl = "../../../customise/resources/images/%RES/icons/stop.png";

	this._replayContainer = new $N.gui.Container(docRef, this._container);
	this._replayIcon = new $N.gui.SVGlink(docRef, this._replayContainer);
	this._replayIcon.iconUrl = "../../../customise/resources/svg/icons.svg#playbackREPLAY";

	this._previousIconContainer = new $N.gui.Container(docRef, this._container);
	this._previousIcon = new $N.gui.Image(docRef, this._previousIconContainer);
	this.PREVIOUS_ICON_URL = "../../../customise/resources/images/%RES/icons/previous.png";

	this._shuffleContainer = new $N.gui.Container(docRef, this._container);
	this._shuffleIcon = new $N.gui.Image(docRef, this._shuffleContainer);
	this.SHUFFLE_ICON_URL = "../../../customise/resources/images/%RES/icons/Icn_shuffle.png";
	this.SHUFFLE_SELECTED_ICON_URL = "../../../customise/resources/images/%RES/icons/shuffle_highlight.png";

	this._nextIconContainer = new $N.gui.Container(docRef, this._container);
	this._nextIcon = new $N.gui.Image(docRef, this._nextIconContainer);
	this.NEXT_ICON_URL = "../../../customise/resources/images/%RES/icons/next.png";

	this._repeatIconContainer = new $N.gui.Container(docRef, this._container);
	this._repeatIcon = new $N.gui.Image(docRef, this._repeatIconContainer);
	this.REPEAT_ICON_URL = "../../../customise/resources/images/%RES/icons/repeat.png";
	this.REPEAT_SELECTED_ICON_URL = "../../../customise/resources/images/%RES/icons/repeat_highlighted.png";

	this._iconLabel = new $N.gui.Label(docRef, this._container);
	this._currentTrackLabel = new $N.gui.Label(docRef, this._container);
	this._totalTracksLabel = new $N.gui.Label(docRef, this._container);

	this._okIcon = new $N.gui.Image(docRef, this._container);
	this._okIcon.iconUrl = "../../../customise/resources/images/%RES/icons/botao_ok_branco.png";
	this._okIconPressLabel = new $N.gui.Label(docRef, this._container);
	this._okIconBackLabel = new $N.gui.Label(docRef, this._container);

	this._items = [];
	this._selectedItemIndex = 0;
	this._bannerTimeout = null;

	this._container.setCssClass("mediaPlaybackBanner");

	this._playPauseIcon.configure({
		x: 10.5,
		y: 11,
		height: 37.5,
		width: 36.5,
		href: this.PLAY_ICON_URL
	});

	this._iconLabel.configure({
		y: 198,
		height: 60,
		width: 100,
		cssClass: "playbackIconLabelText",
		visible: false
	});

	this._currentTrackLabel.configure({
		x: 847.5,
		y: 330,
		height: 60,
		width: 80,
		cssClass: "playbackIconLabelTextRightAlign",
		visible: false
	});

	this._totalTracksLabel.configure({
		x: 933,
		y: 330,
		height: 60,
		width: 100,
		cssClass: "playbackIconLabelTextLeftAlign",
		visible: false
	});

	this._stopContainer.configure({
		y: this.ICON_POSITION_Y,
		height: 60,
		width: this.CONTAINER_WIDTH,
		rounding: 2,
		cssClass: "timeShiftButton",
		visible: false
	});
	this._stopIcon.configure({
		x: 13.5,
		y: 14.5,
		height: 28,
		width: 28,
		href: this._stopIcon.iconUrl,
		visible: false
	});

	this._replayContainer.configure({
		y: this.ICON_POSITION_Y,
		height: 60,
		width: this.CONTAINER_WIDTH,
		rounding: 2,
		cssClass: "timeShiftButton",
		visible: false
	});
	this._replayIcon.configure({
		x: -6,
		y: -6,
		href: this._replayIcon.iconUrl,
		visible: false
	});

	this._previousIconContainer.configure({
		y: this.ICON_POSITION_Y,
		height: 60,
		width: this.CONTAINER_WIDTH,
		rounding: 2,
		cssClass: "timeShiftButton",
		visible: false
	});
	this._previousIcon.configure({
		x: 13.5,
		y: 15,
		height: 30,
		width: 30,
		href: this.PREVIOUS_ICON_URL,
		visible: false
	});

	this._playPauseContainer.configure({
		x: 950,
		y: this.ICON_POSITION_Y,
		visible: false
	});

	this._shuffleContainer.configure({
		y: this.ICON_POSITION_Y,
		height: 60,
		width: this.CONTAINER_WIDTH,
		rounding: 2,
		cssClass: "timeShiftButton",
		visible: false
	});
	this._shuffleIcon.configure({
		x: 13.5,
		y: 10,
		height: 35,
		width: 35,
		href: this.SHUFFLE_ICON_URL,
		visible: false
	});

	this._nextIconContainer.configure({
		y: this.ICON_POSITION_Y,
		height: 60,
		width: this.CONTAINER_WIDTH,
		rounding: 2,
		cssClass: "timeShiftButton",
		visible: false
	});
	this._nextIcon.configure({
		x: 13.5,
		y: 13.5,
		height: 30,
		width: 30,
		href: this.NEXT_ICON_URL,
		visible: false
	});

	this._repeatIconContainer.configure({
		y: this.ICON_POSITION_Y,
		height: 60,
		width: this.CONTAINER_WIDTH,
		rounding: 2,
		cssClass: "timeShiftButton",
		visible: false
	});
	this._repeatIcon.configure({
		x: 10,
		y: 10,
		height: 40,
		width: 40,
		href: this.REPEAT_ICON_URL,
		visible: false
	});

	this._progress.configure({
		y: this.ICON_POSITION_Y + 10,
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
			x: 100,
			y: 20,
			cssClass: "timeShiftProgressStartLabel"
		},
		endLabelProperties: {
			x: 280.5,
			y: 20,
			cssClass: "timeShiftProgressEndLabel"
		}
	});


	this._rewContainer.configure({
		y: this.ICON_POSITION_Y,
		visible: false
	});

	this._ffwContainer.configure({
		y: this.ICON_POSITION_Y,
		visible: false
	});

	this._okIcon.configure({
		x: 900,
		y: 275,
		height: 30,
		width: 30,
		href: this._okIcon.iconUrl,
		visible: false
	});
	this._okIconPressLabel.configure({
		x: 830,
		y: 300,
		height: 30,
		width: 50,
		cssClass: "playbackIconLabelTextRightAlign",
		visible: false
	});
	this._okIconBackLabel.configure({
		x: 975,
		y: 300,
		height: 30,
		width: 100,
		cssClass: "playbackIconLabelText",
		visible: false
	});

	this._ffwIcon.configure({
		x: 13.5,
		y: 12,
		height: 30,
		width: 30
	});

	this._rewIcon.configure({
		x: 13.5,
		y: 12,
		height: 30,
		width: 30
	});

	this._rootSVGRef = this._container.getRootSVGRef();

	if (parent) {
		parent.addChild(this);
	}
	this._log("MediaPlaybackBanner", "Exit");
}
$N.gui.Util.extend(MediaPlaybackBanner, BaseBanner);

/**
 * @method hideAllIcons
 * This method hides all the icons and labels displayed before. This needs to be done because different will have different icon requirements.
 * so. whatever the icons displayed earlier needs to be hide before configuring for the another player.
 */
MediaPlaybackBanner.prototype.hideAllIcons = function () {

	this._playPauseContainer.hide();
	this._playPauseIcon.hide();
	this._stopContainer.hide();
	this._stopIcon.hide();
	this._ffwContainer.hide();
	this._ffwIcon.hide();
	this._rewContainer.hide();
	this._rewIcon.hide();
	this._nextIconContainer.hide();
	this._nextIcon.hide();
	this._previousIconContainer.hide();
	this._previousIcon.hide();
	this._shuffleContainer.hide();
	this._shuffleIcon.hide();
	this._replayContainer.hide();
	this._replayIcon.hide();
	this._iconLabel.hide();
	this._okIconPressLabel.hide();
	this._okIconBackLabel.hide();
	this._okIcon.hide();

	this._repeatIconContainer.hide();
	this._repeatIcon.hide();
	this._progress.hide();
};

/**
 * @method setIconsForBanner
 * This method configures the icons for the banner depending on the preferredIconsList, this method has to call before calling show().
 * One who wants to make use of banner has to pass the preferredIconsList needed for the banner and it should be in order of display.
 * @param {object} preferredIconsList,
 */
MediaPlaybackBanner.prototype.setIconsForBanner = function (preferredIconsList, selectedIcons) {
	var iconsAvailable = $N.app.constants.TRICKPLAY_ICONS_FOR_PHOTO_AUDIO_VIDEO_PLAYBACK,
		SCREEN_WIDTH = 1920,
		iconsWholeWidth,
		startingPositionX,
		i,
		PREGRESSBAR_WIDTH = 0,
		isProgressbar = false;

	this.preferredIconsListLength = preferredIconsList.length;
	this.playing = false;
	this.shuffleOn = false;
	this.repeatOn = false;
	this._items = [];
	this.configuredIcons = [];

	this.hideAllIcons();
	if (this.preferredIconsListLength >= 1) {
		if (preferredIconsList[this.preferredIconsListLength - 1] === (iconsAvailable.PROGRESSBAR)) {
			PREGRESSBAR_WIDTH = 330;
			isProgressbar = true;
		}
		//calculate the starting X position for 1st Icon by using number of icons and Width of each container
		iconsWholeWidth = ((this.preferredIconsListLength - 1) * (this.CONTAINER_WIDTH + this.SPACE_BETWEEN_ICONS)) + PREGRESSBAR_WIDTH;
		startingPositionX = (SCREEN_WIDTH - iconsWholeWidth) / 2;
		for (i = 0; i < this.preferredIconsListLength; i++) {
			switch (preferredIconsList[i]) {
			case iconsAvailable.PLAY:
				this._items.push(this._playPauseContainer);
				this.configuredIcons.push(iconsAvailable.PLAY);
				this._playPauseContainer.setX(startingPositionX + (i * (this.CONTAINER_WIDTH + this.SPACE_BETWEEN_ICONS)));
				this._playPauseIcon.setHref(this.PLAY_ICON_URL);
				this._playPauseIcon.show();
				break;
			case iconsAvailable.STOP:
				this._items.push(this._stopContainer);
				this.configuredIcons.push(iconsAvailable.STOP);
				this._stopContainer.setX(startingPositionX + (i * (this.CONTAINER_WIDTH + this.SPACE_BETWEEN_ICONS)));
				this._stopIcon.show();
				break;
			case iconsAvailable.FWD:
				this._items.push(this._ffwContainer);
				this.configuredIcons.push(iconsAvailable.FWD);
				this._ffwContainer.setX(startingPositionX + (i * (this.CONTAINER_WIDTH + this.SPACE_BETWEEN_ICONS)));
				this._ffwIcon.show();
				break;
			case iconsAvailable.RWD:
				this._items.push(this._rewContainer);
				this.configuredIcons.push(iconsAvailable.RWD);
				this._rewContainer.setX(startingPositionX + (i * (this.CONTAINER_WIDTH + this.SPACE_BETWEEN_ICONS)));
				this._rewIcon.show();
				break;
			case iconsAvailable.NEXT:
				this._items.push(this._nextIconContainer);
				this.configuredIcons.push(iconsAvailable.NEXT);
				this._nextIconContainer.setX(startingPositionX + (i * (this.CONTAINER_WIDTH + this.SPACE_BETWEEN_ICONS)));
				this._nextIcon.show();
				break;
			case iconsAvailable.PREVIOUS:
				this._items.push(this._previousIconContainer);
				this.configuredIcons.push(iconsAvailable.PREVIOUS);
				this._previousIconContainer.setX(startingPositionX + (i * (this.CONTAINER_WIDTH + this.SPACE_BETWEEN_ICONS)));
				this._previousIcon.show();
				break;
			case iconsAvailable.SHUFFLE:
				this._items.push(this._shuffleContainer);
				this.configuredIcons.push(iconsAvailable.SHUFFLE);
				this._shuffleContainer.setX(startingPositionX + (i * (this.CONTAINER_WIDTH + this.SPACE_BETWEEN_ICONS)));
				this.shuffleOn = (selectedIcons && selectedIcons.shuffleModeEnabled) ? true : false;
				if (this.shuffleOn) {
					this._shuffleIcon.setHref(this.SHUFFLE_SELECTED_ICON_URL);
				} else {
					this._shuffleIcon.setHref(this.SHUFFLE_ICON_URL);
				}
				this._shuffleIcon.show();
				break;
			case iconsAvailable.REPLAY:
				this._items.push(this._replayContainer);
				this.configuredIcons.push(iconsAvailable.REPLAY);
				this._replayContainer.setX(startingPositionX + (i * (this.CONTAINER_WIDTH + this.SPACE_BETWEEN_ICONS)));
				this._replayIcon.show();
				break;
			case iconsAvailable.PROGRESSBAR:
				this._items.push(this._progress);
				this.configuredIcons.push(iconsAvailable.PROGRESSBAR);
				this._progress.setX(startingPositionX + (i * (this.CONTAINER_WIDTH + this.SPACE_BETWEEN_ICONS)));
				this._progress.setStartLabelProperties({
					x: 0,
					y: 23
				});
				this._progress.setEndLabelProperties({
					x: 280.5,
					y: 23
				});
				break;
			case iconsAvailable.REPEAT:
				this._items.push(this._repeatIconContainer);
				this.configuredIcons.push(iconsAvailable.REPEAT);
				this._repeatIconContainer.setX(startingPositionX + (i * (this.CONTAINER_WIDTH + this.SPACE_BETWEEN_ICONS)));
				this._repeatIcon.setHref(this.REPEAT_ICON_URL);
				this._repeatIcon.show();
				break;
			}
		}
		for (i = 0; i < this._items.length; i++) {
			this._items[i].show();
		}
		if (isProgressbar) {
			this._items.pop();
		}
	} else {
		//In PHOTO player show only the strings and OK icon
		this._okIconPressLabel.setText(MediaPlaybackBanner.getString("pressLabel"));
		this._okIconBackLabel.setText(MediaPlaybackBanner.getString("okToGoBackLabel"));
		this._okIconPressLabel.show();
		this._okIconBackLabel.show();
		this._okIcon.show();
	}
};

/**
 * Makes the Banner visible and calls superconstructor to make GUIObject visible
 * @method show
 */
MediaPlaybackBanner.prototype.show = function () {
	this._log("show", "Enter");
	MediaPlaybackBanner.superClass.show.call(this);
	this.showTracksLabel();
	this._log("show", "Exit");
};

/**
 * @method setCurrentTrackLabel
 * @param {String} text
 */
MediaPlaybackBanner.prototype.setCurrentTrackLabel = function (text) {
	this._currentTrackLabel.setText(text);
};
/**
 * @method setTotalTracksLabel
 * @param {String} text
 */
MediaPlaybackBanner.prototype.setTotalTracksLabel = function (text) {
	this._totalTracksLabel.setText(text);
};
/**
 * @method showCurrentTrackLabel
 */
MediaPlaybackBanner.prototype.showCurrentTrackLabel = function () {
	this._currentTrackLabel.show();
};
/**
 * @method setTotalTracksLabel
 */
MediaPlaybackBanner.prototype.showTotalTracksLabel = function () {
	this._totalTracksLabel.show();
};
/**
 * @method showTracksLabel
 */
MediaPlaybackBanner.prototype.showTracksLabel = function () {
	this.showCurrentTrackLabel();
	this.showTotalTracksLabel();
};
/**
 * @method setCurrentAndTotalTracks
 * @param {number} currentTrack currently showing track(Image, video, audio) from the playlist
 * @param {number} totalTracks total number of tracks(Image, video, audio) in Playlist
 */
MediaPlaybackBanner.prototype.setCurrentAndTotalTracks = function (currentTrack, totalTracks) {
	this.setCurrentTrackLabel(currentTrack);
	this.setTotalTracksLabel(MediaPlaybackBanner.getString("of") + " " + totalTracks);
};
/**
 * @method updateCurrentTrack
 * This updates the current track(Image, video, audio) number shown
 * @param {number} currentTrack
 */
MediaPlaybackBanner.prototype.updateCurrentTrack = function (currentTrack) {
	this.setCurrentTrackLabel(currentTrack);
	this._currentTrackLabel.show();
};

/**
 * @method setIconLabelXCoordinate
 * This method sets the selected icon label X-Coordinate and sets the text to label for that icon
 * This method makes use of Preferred icons stored in constants and the configured icons for the banner to set X-coordinate
 * @param {number} index
 */
MediaPlaybackBanner.prototype.setIconLabelXCoordinate = function (index) {
	this._log("setIconLabelXCoordinate", "Enter");
	var x = 0,
		adjustIconLabelX = 20;

	switch (this.configuredIcons[index]) {
	case this.availableIconsForBanner.STOP:
		x = this._stopContainer.getTrueX() - adjustIconLabelX;
		this._iconLabel.setText(MediaPlaybackBanner.getString("stop"));
		break;
	case this.availableIconsForBanner.REPLAY:
		x = this._replayContainer.getTrueX() - adjustIconLabelX;
		this._iconLabel.setText(MediaPlaybackBanner.getString("restart"));
		break;
	case this.availableIconsForBanner.PREVIOUS:
		x = this._previousIconContainer.getTrueX() - adjustIconLabelX;
		this._iconLabel.setText(MediaPlaybackBanner.getString("previous"));
		break;
	case this.availableIconsForBanner.PLAY:
		x = this._playPauseContainer.getTrueX() - adjustIconLabelX;
		if (this.playing) {
			this._iconLabel.setText(MediaPlaybackBanner.getString("pause"));
		} else {
			this._iconLabel.setText(MediaPlaybackBanner.getString("play"));
		}
		break;
	case this.availableIconsForBanner.SHUFFLE:
		x = this._shuffleContainer.getTrueX() - adjustIconLabelX;
		if (this.shuffleOn) {
			this._iconLabel.setText(MediaPlaybackBanner.getString("shuffleOff"));
		} else {
			this._iconLabel.setText(MediaPlaybackBanner.getString("shuffleOn"));
		}
		break;
	case this.availableIconsForBanner.NEXT:
		x = this._nextIconContainer.getTrueX() - adjustIconLabelX;
		this._iconLabel.setText(MediaPlaybackBanner.getString("next"));
		break;
	case this.availableIconsForBanner.REPEAT:
		x = this._repeatIconContainer.getTrueX() - adjustIconLabelX;
		if (this.repeatOn) {
			this._iconLabel.setText(MediaPlaybackBanner.getString("repeatOff"));
		} else {
			this._iconLabel.setText(MediaPlaybackBanner.getString("repeatOn"));
		}
		break;
	case this.availableIconsForBanner.FWD:
		x = this._ffwContainer.getTrueX() - adjustIconLabelX;
		if (this.playing) {
			this._iconLabel.setText(MediaPlaybackBanner.getString("forward"));
		} else {
			if (parseInt(this.trickKeysLabelText, 10) > 0) {
				this._iconLabel.setText(this.trickKeysLabelText);
			} else {
				this._iconLabel.setText(MediaPlaybackBanner.getString("forward"));
			}
		}
		break;
	case this.availableIconsForBanner.RWD:
		x = this._rewContainer.getTrueX() - adjustIconLabelX;
		if (this.playing) {
			this._iconLabel.setText(MediaPlaybackBanner.getString("rewind"));
		} else {
			if (parseInt(this.trickKeysLabelText, 10) < 0) {
				this._iconLabel.setText(this.trickKeysLabelText);
			} else {
				this._iconLabel.setText(MediaPlaybackBanner.getString("rewind"));
			}
		}
		break;
	default:
		break;
	}
	this._iconLabel.setX(x);
	this._log("setIconLabelXCoordinate", "Exit");
};

/**
 * @method setIconLabelText
 * @param {String} text
 */
MediaPlaybackBanner.prototype.setIconLabelText = function (text) {
	this._iconLabel.setText(text);
};
/**
 * @method showIconLabel
 */
MediaPlaybackBanner.prototype.showIconLabel = function () {
	this._log("showIconLabel", "Enter");
	this._iconLabel.show();
	this._log("showIconLabel", "Exit");
};

/**
 * @method hideIconLabel
 */
MediaPlaybackBanner.prototype.hideIconLabel = function () {
	this._log("hideIconLabel", "Enter");
	this._iconLabel.hide();
	this._log("hideIconLabel", "Exit");
};

/**
 * return the selected item index
 * @method getSelectedIndex
 * @return {Number}
 */
MediaPlaybackBanner.prototype.getSelectedIndex = function () {
	return this._selectedItemIndex;
};

/**
 * return the icon index in banner
 * @method getIndexForIcon
 * @return {Number} iconNumber of the icon in constant
 */
MediaPlaybackBanner.prototype.getIndexForIcon = function (iconNumber) {
	var i,
		itemLength = this.configuredIcons.length;
	for (i = 0; i < itemLength; i++) {
		if (this.configuredIcons[i] === iconNumber) {
			return i;
		}
	}
	return null;
};

/**
 * return the selected item index
 * @method updateFocusForIcon
 * @return {Number}
 */
MediaPlaybackBanner.prototype.updateFocusForIcon = function (iconNumber) {
	var index;
	index = this.getIndexForIcon(iconNumber);
	if (index !== null) {
		this.deFocusSelectedIcon();
		this.selectIconAtIndex(index);
	}
};

/**
 * unhighlight currently selected button
 * @method deFocusSelectedIcon
 */
MediaPlaybackBanner.prototype.deFocusSelectedIcon = function () {
	var item = this._items[this._selectedItemIndex];
	if (item) {
		item.setCssClass("timeShiftButton");
	}
};
/**
 * Select the button by highlighting it and unhighlight the previously selected button for the index
 * @method selectIconAtIndex
 */
MediaPlaybackBanner.prototype.selectIconAtIndex = function (index) {
	var item = this._items[index],
		itemLength = this._items.length,
		i;
	for (i = 0; i < itemLength; i++) {
		if (item) {
			item.setCssClass("timeShiftButton");
		}
	}
	if (item) {
		this._selectedItemIndex = index;
		item.setCssClass("timeShiftButton_highlight");
	}
};
/**
 * Select the button by highlighting it and unhighlight the previously selected button
 * @method select
 */
MediaPlaybackBanner.prototype.select = function (index) {
	var item = this._items[this._selectedItemIndex];
	if (index === this._selectedItemIndex) {
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
 * @method select
 */
MediaPlaybackBanner.prototype.selectNext = function () {
	if (this._selectedItemIndex < this._items.length - 1) {
		this.select(this._selectedItemIndex + 1);
	}
};

/**
 * Select the previous button by highlighting it and unhighlight the previously selected button
 * @method select
 */
MediaPlaybackBanner.prototype.selectPrevious = function () {
	if (this._selectedItemIndex > 0) {
		this.select(this._selectedItemIndex - 1);
	}
};

/**
 * Toggles the play/pause icon
 * @method togglePlayPauseIcon
 * @param {Boolean} isPlaying to indicate if the initial state is in play
 */
MediaPlaybackBanner.prototype.togglePlayPauseIcon = function (isPlaying) {
	var iconHref = isPlaying ? this.PAUSE_ICON_URL : this.PLAY_ICON_URL;
	this.playing = isPlaying;
	this._playPauseIcon.setHref(iconHref);
};

/**
 * Toggles the play/pause icon label
 * @method togglePlayPauseIconLabel
 * @param {Boolean} isPlaying to indicate if the initial state is in play
 */
MediaPlaybackBanner.prototype.togglePlayPauseIconLabel = function (isPlaying) {
	if (this.configuredIcons[this.getSelectedIndex()] === this.availableIconsForBanner.PLAY) {
		var labeText = isPlaying ? MediaPlaybackBanner.getString("pause") : MediaPlaybackBanner.getString("play");
		this.playing = isPlaying;
		this.setIconLabelText(labeText);
		this.showIconLabel();
	}
};

/**
 * Toggles the shuffle icon and It's lbel'
 * @method toggleShuffleIconAndLabel
 * @param {Boolean} isShuffleOn to indicate if the shuffle mode is on or not
 */
MediaPlaybackBanner.prototype.toggleShuffleIconAndLabel = function (isShuffleOn) {
	var labeText;
	if (isShuffleOn) {
		this._shuffleIcon.setHref(this.SHUFFLE_SELECTED_ICON_URL);
		labeText = MediaPlaybackBanner.getString("shuffleOff");
	} else {
		this._shuffleIcon.setHref(this.SHUFFLE_ICON_URL);
		labeText = MediaPlaybackBanner.getString("shuffleOn");
	}
	this.shuffleOn = isShuffleOn;
};

/**
 * Toggles the shuffle icon and It's lbel'
 * @method toggleRepeatIconAndLabel
 * @param {Boolean} isShuffleOn to indicate if the shuffle mode is on or not
 */
MediaPlaybackBanner.prototype.toggleRepeatIconAndLabel = function (isRepeatOn) {
	var labeText;
	if (isRepeatOn) {
		this._repeatIcon.setHref(this.REPEAT_SELECTED_ICON_URL);
		labeText = MediaPlaybackBanner.getString("repeatOff");
	} else {
		this._repeatIcon.setHref(this.REPEAT_ICON_URL);
		labeText = MediaPlaybackBanner.getString("repeatOn");
	}
	this.repeatOn = isRepeatOn;
};

/**
 * sets the speed of FWD and RWD icons in terms of 2x, 3x, 4x....
 * @method setTrickKeysLabel
 * @param {number} playback rate
 * @param {number} trickKeyIndex of FWD or RWD icons
 */
MediaPlaybackBanner.prototype.setTrickKeysLabel = function (rate, trickKeyIndex) {
	var selectedIndex = this.configuredIcons[this.getSelectedIndex()],
		playSpeed = 100;
	this.trickKeysLabelText = (String((rate) / 100) + "x");
	if (rate === playSpeed) {
		this.deFocusSelectedIcon();
		this.selectIconAtIndex(this.getIndexForIcon(trickKeyIndex));
		this.trickKeysLabelText = MediaPlaybackBanner.getString("forward");
		this.hideIconLabel();
		return;
	}
	if (rate !== playSpeed) {
		this.deFocusSelectedIcon();
		this.selectIconAtIndex(this.getIndexForIcon(trickKeyIndex));
		this.setIconLabelXCoordinate(this.getIndexForIcon(trickKeyIndex));
		this.setIconLabelText(this.trickKeysLabelText);
		this.showIconLabel();
	}
};

/**
 * Adaptor method sets the start and end labels of the progress bar
 * @method setProgressBarStartEnd
 * @param {String} startTime
 * @param {String} endTime
 */
MediaPlaybackBanner.prototype.setProgressBarStartEnd = function (startTime, endTime) {
	this._progress.setProgressBarLabels(startTime, endTime);
};

/**
 * Returns the class name as a String.
 * @method toString
 * @return {String} The class name as a String.
 */
MediaPlaybackBanner.prototype.toString = function () {
	return "MediaPlaybackBanner";
};
