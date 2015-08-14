/**
 * The time shift player is displayed when a viewer initiates a
 * trick mode while watching broadcast TV and has components
 * for trickplay icons and a progress bar etc.
 * @class TimeShiftBanner
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 * @author bzhao
 */
var $N = window.parent.$N;

function TimeShiftBanner(docRef, parent) {
	'use strict';
	$N.apps.core.Language.adornWithGetString(TimeShiftBanner, "apps/mediaPlayer/common/");
	TimeShiftBanner.superConstructor.call(this, docRef);
	this._log = new $N.apps.core.Log("MediaPlayer", "TimeShiftBanner");
	this._log("TimeShiftBanner", "Enter");
	this._container = new $N.gui.Group(docRef);
	this._backgroundBox = new $N.gui.BackgroundBox(docRef, this._container);
	this._liveTVContainer = new $N.gui.Container(docRef, this._container);
	this._playPauseContainer = new $N.gui.Container(docRef, this._container);
	this._liveTVLabel = new $N.gui.Label(docRef, this._liveTVContainer);
	this._rewContainer = new $N.gui.Container(docRef, this._container);
	this._rewIcon = new $N.gui.Image(docRef, this._rewContainer);
	this._rewIcon.iconUrl = "../../../customise/resources/images/%RES/icons/rwd.png";
	this._ffwContainer = new $N.gui.Container(docRef, this._container);
	this._ffwIcon = new $N.gui.Image(docRef, this._ffwContainer);
	this._ffwIcon.iconUrl = "../../../customise/resources/images/%RES/icons/fwd.png";
	this._playIcon = new $N.gui.Image(docRef, this._playPauseContainer);
	this._pauseIcon = new $N.gui.Image(docRef, this._playPauseContainer);
	this.PLAY_ICON_URL = "../../../customise/resources/images/%RES/actionIcons/Icn_actionPlay.png";
	this.PAUSE_ICON_URL = "../../../customise/resources/images/%RES/actionIcons/Icn_actionPause.png";
	this._speedIndicator = new $N.gui.Label(docRef, this._container);
	this._eventName = new $N.gui.SpanLabel(docRef, this._container);
	this._progress = new $N.gui.LabelledProgressBar(docRef, this._container);
	this.dictionary = {};
	this._audiolanguage = null;
	this._audioTrack = null;
	this.resetBannerTimeoutOnAudioSubtitleChange = function () {};
	this._buttonGroup = new $N.gui.ButtonGroup(docRef, this._container);

	this._items = [this._liveTVContainer, this._rewContainer, this._playPauseContainer, this._ffwContainer];
	this._selectedItemIndex = 0;
	this._progressMarker = "../../../customise/resources/images/icons/player/timeShiftProgressMarker.png";
	this.SPEED_INDICATOR_REW_X = 480;
	this.SPEED_INDICATOR_PLAY_X = 567;
	this.SPEED_INDICATOR_FFW_X = 654;
	this.PROGRESS_WIDTH = 593.5;
	this.SPEED_INDICATOR_FADEOUT_TIME = 500;
	this._AUDIO_SUBTITLE_CHANGE_TIMEOUT = 3000;
	this._bannerTimeout = null;
	this._speedIndicatorTimeout = null;
	this.audioSequenceFunction = null;

	this._backgroundBox.configure({
		x: 0,
		y: 0,
		height: 480,
		width: 1920,
		cssClass: "miniguideBackground",
		opacity: 1
	});

	this._speedIndicator.configure({
		x: 495,
		y: 247.5,
		height: 60,
		width: 150,
		cssClass: "timeShiftSpeedIndicator",
		visible: false
	});

	this._eventName.configure({
		x: 750,
		y: 250.5,
		height: 60,
		width: this.PROGRESS_WIDTH,
		cssClass: "timeShiftEventName",
		spanCssClass: "timeShiftEpisodeInfo"
	});

	this._liveTVContainer.configure({
		x: 288,
		y: 299,
		height: 60,
		width: 150,
		rounding: 2,
		cssClass: "timeShiftButton"
	});

	this._liveTVLabel.configure({
		width: 120,
		cssClass: "liveTVTitle"
	});

	this._rewContainer.configure({
		x: 465,
		y: 299,
		height: 60,
		width: 60,
		rounding: 2,
		cssClass: "timeShiftButton"
	});

	this._rewIcon.configure({
		x: 14,
		y: 13,
		href: this._rewIcon.iconUrl
	});

	this._playPauseContainer.configure({
		x: 552,
		y: 299,
		height: 60,
		width: 60,
		rounding: 2,
		cssClass: "timeShiftButton"
	});

	this._playIcon.configure({
		x: 5,
		y: 4,
		height: 50,
		width: 50,
		href: this.PLAY_ICON_URL
	});

	this._pauseIcon.configure({
		x: 5,
		y: 4,
		height: 50,
		width: 50,
		href: this.PAUSE_ICON_URL,
		visible: false
	});

	this._ffwContainer.configure({
		x: 639,
		y: 299,
		height: 60,
		width: 60,
		rounding: 2,
		cssClass: "timeShiftButton"
	});

	this._ffwIcon.configure({
		x: 17,
		y: 13,
		href: this._ffwIcon.iconUrl
	});

	this._progress.configure({
		x: 750,
		y: 299,
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
			y: 30,
			cssClass: "timeShiftProgressStartLabel"
		},
		endLabelProperties: {
			x: this.PROGRESS_WIDTH - 75,
			y: 30,
			cssClass: "timeShiftProgressEndLabel"
		}
	});

	this._buttonGroup.configure({
		x: 1380,
		y: 288
	});


	this._progress.setPlayHead(this._progressMarker);
	this._rootSVGRef = this._container.getRootSVGRef();

	if (parent) {
		parent.addChild(this);
	}

	this._log("TimeShiftBanner", "Exit");
}
$N.gui.Util.extend(TimeShiftBanner, $N.gui.GUIObject);

/**
 * @method setStopKeyText
 * @param {String} text
 */
TimeShiftBanner.prototype.setStopKeyText = function (text) {
	this._log("setStopKeyText", "Enter");
	this._liveTVLabel.setText(text);
	this._log("setStopKeyText", "Exit");
};

/**
 * A setter function to set the callback "resetBannerTimeoutOnAudioSubtitleChange()" from Miniguide.js
 * @method setResetBannerTimeout
 */
TimeShiftBanner.prototype.setResetBannerTimeout = function (callback) {
	this.resetBannerTimeoutOnAudioSubtitleChange = callback;
};

/**
 * Triggered by keyOkHandler() in MiniGuide.js to set this.isAudioSubtitleTogglingMode to false
 * @method setAudioSubtitleTogglingMode
 * @param {Boolean} flag
 */
TimeShiftBanner.prototype.setAudioSubtitleTogglingMode = function (flag) {
	this.isAudioSubtitleTogglingMode = flag;
};
/**
 * Sets the title for each menu option from the language bundle
 * @method importLanguageBundle
 */
TimeShiftBanner.prototype.importLanguageBundle = function () {
	this.dictionary.menuAudio = TimeShiftBanner.getString("menuAudio");
	this.dictionary.menuSubtitles = TimeShiftBanner.getString("menuSubtitles");
	this.dictionary.audioLanguage = TimeShiftBanner.getString("audioLanguage");
	this.dictionary.options = TimeShiftBanner.getString("options");
	this.dictionary.on = TimeShiftBanner.getString("on");
	this.dictionary.off = TimeShiftBanner.getString("off");
	this.dictionary.unavailable = TimeShiftBanner.getString("unavailable");
};

/**
 * set subtitles label state icon
 * @method setSubtitleStateIcon
 * @param {bool} state - true if available
 */
TimeShiftBanner.prototype.setSubtitleStateIcon = function (state) {
	var iconPath = state ? $N.app.constants.ACTIVE_SUBTITLE_BUTTON_PATH : $N.app.constants.INACTIVE_SUBTITLE_BUTTON_PATH;
	this._buttonGroup.setSubtitleIcon(iconPath);
};

	/* AUDIO / SUBTITLE - HEADER FUNCTION HELPERS START */
TimeShiftBanner.prototype.updateIcons = function () {
	this._log("updateIcons", "Enter");
	var me = this;
	if (this._buttonTimeout) {
		clearTimeout(this._buttonTimeout);
		this._buttonTimeout = null;
	}
	this._buttonTimeout = setTimeout(function () {
		me.setAudioStateIcon($N.app.TracksUtil.isAudioTrackSelectable());
		me.setSubtitleStateIcon($N.app.TracksUtil.isSubtitleTrackSelectable());
	}, this.BUTTON_UPDATE_TIMEOUT);
	this._log("updateIcons", "Exit");
};

TimeShiftBanner.prototype.updateAudioAndSubtitleButtons = function () {
	this._log("updateAudioAndSubtitleButtons", "Enter");
	this.updateIcons();
	this.importLanguageBundle();
	this.audioSequenceFunction = this.setActiveAudioTitle;
	this.subtitleSequenceFunction = this.setSubtitleStatus;
	this.setAudioCycleFunction(this.callbackEmpty);
	this.setToggleSubtitlesFunction(this.callbackEmpty);
	this._buttonGroup.setAudioTrackLabel(this.dictionary.menuAudio);
	this._buttonGroup.setSubtitleLabel(this.dictionary.menuSubtitles);
	this._buttonGroup.setOptionsLabel(this.dictionary.options);
	this._buttonGroup.hideInfoAndOptionsIcons();
	this._buttonGroup.setSubtitleCssClass("bannerButtonText");
	this._buttonGroup.setAudioCssClass("bannerButtonText");
	this._buttonGroup.show();
	this._buttonGroup.showButtons();
	this._log("updateAudioAndSubtitleButtons", "Exit");
};

/**
 * Activating the audio/subtitle on OK,EXIT, PORTAL, MENU etc.. key is press
 * Handling the key makes sure the audio/Subtitle is activated immediately and appropriate text is changed upon exit.
 * @method activateAudioSubtitleOnKeyPress
 * @private
 */
TimeShiftBanner.prototype.activateAudioSubtitleOnKeyPress = function () {
	this._log("activateAudioSubtitleOnKeyPress", "Enter");
	var audioTrackText = this._buttonGroup.getAudioTrackText(),
		subtitleText = this._buttonGroup.getSubtitleText();
	if (this.isAudioSubtitleTogglingMode && this.isVisible()) {
		if (audioTrackText !== (TimeShiftBanner.getString("menuAudio"))) {
			this._buttonGroup.activateAudio();
		}
		if (subtitleText !== (TimeShiftBanner.getString("menuSubtitles"))) {
			this._buttonGroup.activateSubtitle();
		}
		this.setAudioSubtitleTogglingMode(false);
		this._log("activateAudioSubtitleOnKeyPress", "Exit true");
		return true;
	}
	this._log("activateAudioSubtitleOnKeyPress", "Exit false");
	return false;
};

TimeShiftBanner.prototype.getAudioSubtitleTogglingMode = function () {
	return this.isAudioSubtitleTogglingMode;
};

	/* AUDIO / SUBTITLE - HEADER FUNCTION HELPERS END */


	/* SUBTITLE - HEADER FUNCTIONS START */

/**
* @method getNextSubtitleText
* To get the next available subtitle track text code(ex: "eng" for English ), if not available then fetch "off"
* @param{string}, currentSubtitleTextCode
* @return{string}
*/
TimeShiftBanner.prototype.getNextSubtitleText = function (currentSubtitleTextCode) {
	var availableSubtitleTracks = $N.app.TracksUtil.getSubtitleTrackList(),
		currentIndex,
		nextSubtitleTrack;
	if (availableSubtitleTracks.indexOf(currentSubtitleTextCode) > -1) {
		currentIndex = availableSubtitleTracks.indexOf(currentSubtitleTextCode);
		if (availableSubtitleTracks[currentIndex + 1]) {
			nextSubtitleTrack = availableSubtitleTracks[currentIndex + 1];
			this._tempSubtitleTrackCode = nextSubtitleTrack;
			return this.dictionary.audioLanguage[nextSubtitleTrack];
		} else {
			this._tempSubtitleTrackCode = this.dictionary.off;
			return this.dictionary.off;
		}
	} else if (currentSubtitleTextCode === this.dictionary.off) { // if current Subtitle label is off, then again start the loop from the beginning by fetching the 1st element
		nextSubtitleTrack = availableSubtitleTracks[0];
		this._tempSubtitleTrackCode = nextSubtitleTrack;
		return this.dictionary.audioLanguage[nextSubtitleTrack];
	}
};

/**
 * 3rd level action to toggle between the subtitle text on/off
 *
 * @method toggleSubtitleTitle
 */
TimeShiftBanner.prototype.toggleSubtitleTitle = function () {
	this._log("toggleSubtitleTitle", "Enter");
	var currentSubtitleText = this._buttonGroup.getSubtitleText();
	if (currentSubtitleText === this.dictionary.menuSubtitles) {
		this.setSubtitleStatus();
	} else {
		this._buttonGroup.setSubtitleCssClass("bannerButtonTextChange");
		this._buttonGroup.setSubtitleLabel(this.getNextSubtitleText(this._tempSubtitleTrackCode));
		this.resetSubtitleTimeout();
	}
	this._log("toggleSubtitleTitle", "Exit");
};

/**
 * Show current subtitles state
 * The css is changed to options, based on wheather subtitle is available or not
 * @method setToggleSubtitleTitle
 */
TimeShiftBanner.prototype.setToggleSubtitleTitle = function () {
	this._log("setToggleSubtitleTitle", "When banner is active pressing YELLOW key", "Showing the current subtitle state");
	var subtitle = null;
	if (($N.app.TracksUtil.isSubtitleTrackSelectable())) {
		subtitle = $N.app.fullScreenPlayer.tracks.getActiveSubtitleTrack();
		this._buttonGroup.setSubtitleCssClass("bannerButtonTextChange");
		this._buttonGroup.setSubtitleLabel((subtitle && subtitle.language) ? this.dictionary.audioLanguage[subtitle.language] : this.dictionary.off);
		this.noSubtitleTracks = false;
		this._tempSubtitleTrackCode = (subtitle && subtitle.language) ? subtitle.language : this.dictionary.off;
	} else {
		this._buttonGroup.setSubtitleLabel(this.dictionary.unavailable);
		this._buttonGroup.setSubtitleCssClass("bannerNoOptionsText");
		this.noSubtitleTracks = true;
		this._tempSubtitleTrackCode = null;
	}
};

/**
 * 4th stage action to activate the subtitle after 3 seconds timeout
 *
 * @method resetSubtitleTimeout
 */
TimeShiftBanner.prototype.resetSubtitleTimeout = function () {
	var me = null;
	this.clearSubtitleTimeout();
	me = this;
	this._subtitleChangeTimeout = setTimeout(function () {
		me.activateSubtitle();
		if (me._buttonGroup.getAudioTrackText() === me.dictionary.menuAudio) { //setAudioSubtitleTogglingMode represents both audio and subtitle, which, if set to false in Subtitle timeout, Ok key for audio cannot be handled.
			me.setAudioSubtitleTogglingMode(false);
		}
	}, this._AUDIO_SUBTITLE_CHANGE_TIMEOUT);
};


/**
 * Clears the timer set for subtitle
 *
 * @method clearSubtitleTimeout
 */
TimeShiftBanner.prototype.clearSubtitleTimeout = function () {
	if (this._subtitleChangeTimeout) {
		clearTimeout(this._subtitleChangeTimeout);
		this._subtitleChangeTimeout = null;
	}
};

/* SUBTITLE FUNCTIONS START */

/**
 * 2nd stage action to show if subtitles on | off
 * Switch sequence to 3rd level - toggleSubtitleTitle
 *
 * @method setSubtitleStatus
 */
TimeShiftBanner.prototype.setSubtitleStatus = function () {
	this.subtitleSequenceFunction = this.toggleSubtitleTitle;
	this.setToggleSubtitleTitle();
	this.resetSubtitleTimeout();
	this.setAudioSubtitleTogglingMode(true); //Handle OK key on MiniGuide, true = audio/subtitle toggling mode. Set to false in MiniGuide.js keyOkHandler()
};

/**
 * Triggered by keyHandler to display current subtitle status on/off
 * @method showCurrentSubtitleStateAndToggle
 */
TimeShiftBanner.prototype.showCurrentSubtitleStateAndToggle = function () {
	this._log("showCurrentSubtitleStateAndToggle", "Enter");
	if ($N.app.TracksUtil.isSubtitleTrackSelectable()) {
		this.toggleSubtitleTitle();
	}
	this._log("showCurrentSubtitleStateAndToggle", "Exit");
};

/**
 * set subtitles label state icon
 * @method setSubtitleStateIcon
 * @param {bool} state - true if available
 */
TimeShiftBanner.prototype.setSubtitleStateIcon = function (state) {
	var iconPath = state ? $N.app.constants.ACTIVE_SUBTITLE_BUTTON_PATH : $N.app.constants.INACTIVE_SUBTITLE_BUTTON_PATH;
	this._buttonGroup.setSubtitleIcon(iconPath);
};

/**
 * Triggered by keyHandler to display currently playing audio language
 * @method showCurrentAudioTrackAndToggle
 */
TimeShiftBanner.prototype.showCurrentAudioTrackAndToggle = function () {
	if (this.audioSequenceFunction && $N.app.TracksUtil.isAudioTrackSelectable()) {
		this.audioSequenceFunction();
	}
};

/**
 * Set toggle subtitles function
 * @method setToggleSubtitlesFunction
 * @param {Function} callback
 */
TimeShiftBanner.prototype.setToggleSubtitlesFunction = function (callback) {
	this.toggleSubtitle = callback;
};

/**
 * Action to activate the subtitle based on the on/off status on OK key is pressed
 *
 * @method activateSubtitle
 */
TimeShiftBanner.prototype.activateSubtitle = function () {
	var currentSubtitleText = this._buttonGroup.getSubtitleText(),
		audioTrackLabel = null;

	if (currentSubtitleText !== this.dictionary.off) {
		$N.app.fullScreenPlayer.tracks.activateSubtitleTrackByLanguage(this._tempSubtitleTrackCode);
		this._log("activateSubtitle", "The subtitle track is enabled");
	} else {
		$N.app.TracksUtil.deactivateCurrentSubtitleTrack();
		this._log("activateSubtitle", 'The subtitle track is disabled');
	}
	this._buttonGroup.setSubtitleLabel(this.dictionary.menuSubtitles);
	this._buttonGroup.setSubtitleCssClass("bannerButtonText");
	audioTrackLabel = this._buttonGroup.getAudioTrackText();
	if (audioTrackLabel === this.dictionary.menuAudio) {
		this.resetBannerTimeoutOnAudioSubtitleChange(); // The timer should only start when both Audio or Legenda are displayed. If any blue text is displayed the mini guide stays in place.
	}
	this._log("activateSubtitle", "Banner Time is reset");
	this.clearSubtitleTimeout();
};

/* SUBTITLE FUNCTIONS END */

/* SUBTITLE - HEADER HELPER FUNCTIONS END*/

/* AUDIO - HEADER HELPER FUNCTIONS START */


TimeShiftBanner.prototype._showCurrentAudioStateAndToggle = function () {
	this.showCurrentAudioStateAndToggle();
};

/**
 * Clears the timer set for audio
 * @method clearAudioTimeout
 */
TimeShiftBanner.prototype.clearAudioTimeout = function () {
	if (this._audioChangeTimeout) {
		clearTimeout(this._audioChangeTimeout);
		this._audioChangeTimeout = null;
	}
};

/**
 * 4th stage action to activate the audio after 3 seconds timeout
 *
 * @method resetAudioTimeout
 */
TimeShiftBanner.prototype.resetAudioTimeout = function () {
	var me = null;
	this.clearAudioTimeout();
	me = this;
	this._audioChangeTimeout = setTimeout(function () {
		me.activateAudio();
		if (me._buttonGroup.getSubtitleText() === me.dictionary.menuSubtitles) { //setAudioSubtitleTogglingMode represents both audio and subtitle, which, if set to false in audio timeout, Ok key for subtitles cannot be handled.
			me.setAudioSubtitleTogglingMode(false);
		}
	}, this._AUDIO_SUBTITLE_CHANGE_TIMEOUT);
};
/**
 * Action to activate the selected audio after OK key is pressed
 *  @method activateAudio
 *
 */

TimeShiftBanner.prototype.activateAudio = function () {
	var currentSubtitleText = null;
	if (this._audioTrack) {
		$N.app.fullScreenPlayer.tracks.activateAudioTrackById(this._audioTrack.id);
	} else {
		$N.app.fullScreenPlayer.tracks.activateAudioTrackByLanguage(this._audiolanguage);
	}
	this._buttonGroup.setAudioTrackLabel(this.dictionary.menuAudio);
	this._buttonGroup.setAudioCssClass("bannerButtonText");
	currentSubtitleText = this._buttonGroup.getSubtitleText();
	if (currentSubtitleText === this.dictionary.menuSubtitles) {
		this.resetBannerTimeoutOnAudioSubtitleChange(); // The timer should only start when both Audio or Legenda are displayed. If any blue text is displayed the mini guide stays in place.
	}
	this._log("activateAudio", "Banner Time is reset");
	this.clearAudioTimeout();
	this._log("activateAudio", "The audio track is changed" + this._audiolanguage);
};

/**
 * 2nd stage action which shows current selected audio and assigns new function for next click
 *
 * @method setActiveAudioTitle
 */
TimeShiftBanner.prototype.setActiveAudioTitle = function () {
	this.audioSequenceFunction = this.toggleAudioTrackText;
	this.setAudioLanguageTitle(); //set the current audio
	this.resetAudioTimeout();
	this.setAudioSubtitleTogglingMode(true); //Handle OK key on MiniGuide, true = audio/subtitle toggling mode. Set to false in MiniGuide.js keyOkHandler()
};

/**
 * Set audio language title
 * Set audio language cssClass
 * Depending on the number of audio options available the css is set
 * @method setAudioLanguageTitle
 */
TimeShiftBanner.prototype.setAudioLanguageTitle = function () {
	this._log("setAudioLanguageTitle", "When banner is active pressing GREEN key", "Showing the current audio track");
	var audio = $N.app.fullScreenPlayer.tracks.getActiveAudioTrack(),
		isInvalidAudioTrack = $N.app.TracksUtil.isInvalidAudioTrackAvailable(),
		availableAudioTracksLength = 0,
		availableAudioTracks = null;
	if (audio) {
		this._buttonGroup.setAudioTrackLabel(this.dictionary.audioLanguage[audio.language] || audio.language);
		availableAudioTracks = $N.app.fullScreenPlayer.tracks.getAudioTracks();
		availableAudioTracksLength = availableAudioTracks.length;
		// if available audio tracks length is one or invalid audio track is present then show white color text next to audio icon.
		if ((availableAudioTracksLength === 1) || (availableAudioTracksLength === 1 && isInvalidAudioTrack)) {
			this._buttonGroup.setAudioCssClass("bannerNoOptionsText");
		} else {
			// show blue color text next to audio icon.
			this._buttonGroup.setAudioCssClass("bannerButtonTextChange");
		}
	}
};

/* AUDIO - HEADER HELPER FUNCTIONS END */

/* AUDIO FUNCTIONS START */

/**
 * set audio label state icon
 * @method setAudioStateIcon
 * @param {bool} state - true if available
 */
TimeShiftBanner.prototype.setAudioStateIcon = function (state) {
	var iconPath = state ? $N.app.constants.ACTIVE_LANGUAGE_BUTTON_PATH : $N.app.constants.INACTIVE_LANGUAGE_BUTTON_PATH;
	this._buttonGroup.setAudioTrackIcon(iconPath);
};

/**
 * Set audio cycle function
 *
 * @method setAudioCycleFunction
 * @param {Function} functionName - closure with active fullScreenPlayer call
 */
TimeShiftBanner.prototype.setAudioCycleFunction = function (callback) {
	this.cycleAudio = callback;
};

/**
 * set audio label state icon
 * @method setAudioStateIcon
 * @param {bool} state - true if available
 */
TimeShiftBanner.prototype.setAudioStateIcon = function (state) {
	var iconPath = state ? $N.app.constants.ACTIVE_LANGUAGE_BUTTON_PATH : $N.app.constants.INACTIVE_LANGUAGE_BUTTON_PATH;
	this._buttonGroup.setAudioTrackIcon(iconPath);
};

/**
 * 3rd stage action to toggle "text" of audio track label between all the available audio language
 *
 * @method toggleAudioTrackText
 */
TimeShiftBanner.prototype.toggleAudioTrackText = function () {
	var audioTrackLabel = this._buttonGroup.getAudioTrackText(),
		nextAudioLanguageLabel,
		nextAudioTrack;

	if (audioTrackLabel === this.dictionary.menuAudio) {
		this.setActiveAudioTitle();
	} else {
		nextAudioTrack = $N.app.TracksUtil.getNextAudioTrack(this._audioTrack);
		nextAudioLanguageLabel = this.dictionary.audioLanguage[nextAudioTrack.language] || nextAudioTrack.language;
		this._audiolanguage = nextAudioTrack.language;
		this._audioTrack = nextAudioTrack;
		this._buttonGroup.setAudioTrackLabel(nextAudioLanguageLabel);
		this.resetAudioTimeout();
	}
};
/* AUDIO FUNCTIONS END */

/**
 * Set toggle subtitles function
 * @method setToggleSubtitlesFunction
 * @param {Function} callback
 */
TimeShiftBanner.prototype.setToggleSubtitlesFunction = function (callback) {
	this.toggleSubtitle = callback;
};

/**
 * Triggered by keyHandler to display currently playing audio language
 * @method showCurrentAudioTrackAndToggle
 */
TimeShiftBanner.prototype.showCurrentAudioTrackAndToggle = function () {
	if (this.audioSequenceFunction && $N.app.TracksUtil.isAudioTrackSelectable()) {
		this.audioSequenceFunction();
	}
};
/**
 * Triggered by keyHandler to display current subtitle status on/off
 * @method showCurrentSubtitleStateAndToggle
 */
TimeShiftBanner.prototype.showCurrentSubtitleStateAndToggle = function () {
	this._log("showCurrentSubtitleStateAndToggle", "Enter");
	if ($N.app.TracksUtil.isSubtitleTrackSelectable()) {
		this.toggleSubtitleTitle();
	}
	this._log("showCurrentSubtitleStateAndToggle", "Exit");
};


/**
 * @method setEventNameText
 * @param {String} text
 */
TimeShiftBanner.prototype.setEventNameText = function (eventName, seriesText) {
	this._log("setEventNameText", "Enter");
	var eventNameText = $N.app.StringUtil.join(" ", eventName, seriesText);
	this._eventName.setText(eventNameText || "");
	this._eventName.setSpanOnText(seriesText);
	this._log("setEventNameText", "Exit");
};

/**
 * Hide the TimeShiftBanner
 * @method setSpeedIndicatorText
 * @param {String} value for the speed indicator label.
 */
TimeShiftBanner.prototype.setSpeedIndicatorText = function (value) {
	this._log("setSpeedIndicatorText", "Enter");
	this._speedIndicator.setText(value);
	this._log("setSpeedIndicatorText", "Exit");
};

/**
 * @method hideSpeedIndicator
 */
TimeShiftBanner.prototype.hideSpeedIndicator = function () {
	this._log("hideSpeedIndicator", "Enter");
	this._speedIndicator.hide();
	this._log("hideSpeedIndicator", "Exit");
};

/**
 * @method showSpeedIndicator
 */
TimeShiftBanner.prototype.showSpeedIndicator = function () {
	this._log("showSpeedIndicator", "Enter");
	this._speedIndicator.show();
	this._log("showSpeedIndicator", "Exit");
};

/**
 * Sets the x position of speed indicator label
 * @param {String} mode
 */
TimeShiftBanner.prototype.setSpeedIndicatorX = function (mode) {
	this._log("setSpeedIndicatorX", "Enter");
	var x = 0,
		textLength,
		DOUBLE_NUMBER_OFFSET = 13;

	switch (mode) {
	case $N.platform.output.TrickPlay.MODES.RW:
		x = this.SPEED_INDICATOR_REW_X;
		break;
	case $N.platform.output.TrickPlay.MODES.FF:
		x = this.SPEED_INDICATOR_FFW_X;
		break;
	default:
		x = this.SPEED_INDICATOR_PLAY_X;
		break;
	}
	textLength = this._speedIndicator.getText().length;
	if (textLength > 2) {
		x -= DOUBLE_NUMBER_OFFSET;
	}
	this._speedIndicator.setX(x);
	this._log("setSpeedIndicatorX", "Exit");
};

/**
 * return the selected item index
 * @method select
 * @return {Number}
 */
TimeShiftBanner.prototype.getSelectedIndex = function () {
	return this._selectedItemIndex;
};

/**
 * Select the button by highlighting it and unhighlight the previously selected button
 * @method select
 */
TimeShiftBanner.prototype.select = function (index) {
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
TimeShiftBanner.prototype.selectNext = function () {
	if (this._selectedItemIndex < this._items.length - 1) {
		this.select(this._selectedItemIndex + 1);
	}
};

/**
 * Select the previous button by highlighting it and unhighlight the previously selected button
 * @method select
 */
TimeShiftBanner.prototype.selectPrevious = function () {
	if (this._selectedItemIndex > 0) {
		this.select(this._selectedItemIndex - 1);
	}
};

/**
 * Adaptor method sets the start and end labels of the progress bar
 * @method setProgressBarLabels
 * @param {Number} startTime in milliseconds
 * @param {Number} endTime in milliseconds
 */
TimeShiftBanner.prototype.setProgressBarStartEnd = function (startTime, endTime) {
	var startStr,
		endStr;
	if (startTime && endTime) {
		startStr = $N.app.DateTimeUtil.getFormattedTimeStringFromTime(startTime, "HH:mm");
		endStr = $N.app.DateTimeUtil.getFormattedTimeStringFromTime(endTime, "HH:mm");
		this._progress.setProgressBarLabels(startStr, endStr);
	}
};

/**
 * Updates the buffer end and progress marker position.
 * @method updateProgressBar
 * @param {Number} startTime in milliseconds
 * @param {Number} endTime in milliseconds
 * @param {Number} bufferStart in milliseconds
 * @param {Number} bufferEnd in milliseconds
 * @param {Number} progress in milliseconds
 */
TimeShiftBanner.prototype.updateProgressBar = function (startTime, endTime, bufferStart, bufferEnd, progress) {
	var length = endTime - startTime,
		position,
		elapsed = bufferEnd - startTime,
		elapsedOffset = bufferStart - startTime;
	if ((bufferStart + progress >= startTime) && (bufferStart + progress <= endTime)) {
		position = (bufferStart + progress - startTime) / length * this.PROGRESS_WIDTH;
	} else if (bufferStart + progress < startTime) {
		position = 0;
	} else {
		position = this.PROGRESS_WIDTH;
	}
	this._progress.updateProgressBar(0, length, elapsed, elapsedOffset);
	if (progress && progress > 0) {
		this._progress.setMarkerPosition(position);
	}
};

/**
 * @method resetProgressBarPositon
 */
TimeShiftBanner.prototype.resetProgressBarPositon = function () {
	this._progress.setMarkerPosition(0);
};

/**
 * Toggles the play/pause icon
 * @method togglePlayPauseIcon
 * @param {Boolean} isPlaying to indicate if the initial state is in play
 */
TimeShiftBanner.prototype.togglePlayPauseIcon = function (isPlaying) {
	var isInPlay = isPlaying === undefined ? this._playIcon.isVisible() : isPlaying;
	if (isInPlay) {
		this._playIcon.hide();
		this._pauseIcon.show();
	} else {
		this._playIcon.show();
		this._pauseIcon.hide();
	}
};

/**
 * @method show
 * @param {Boolean} isBannerTimeoutAllowed
 */
TimeShiftBanner.prototype.show = function (isBannerTimeoutAllowed) {
	this._log("TimeShiftBanner", "show Enter");
	this.updateAudioAndSubtitleButtons();
	TimeShiftBanner.superClass.show.call(this);
	this._log("TimeShiftBanner", "show Exit");
};

/**
 * Returns the class name as a String.
 * @method toString
 * @return {String} The class name as a String.
 */
TimeShiftBanner.prototype.toString = function () {
	return "TimeShiftBanner";
};
