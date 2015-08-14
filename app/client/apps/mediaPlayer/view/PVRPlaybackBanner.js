/*global ButtonGroup, PlaybackBanner */
/**
 * The PVR playback banner is displayed when a viewer initiates
 * playback of a recording
 * @class PVRPlaybackBanner
 * @constructor
 * @extends PlaybackBanner
 * @param {Object} docRef
 * @param {Object} parent
 * @author hepton
 */
var $N = window.parent.$N;

function PVRPlaybackBanner(docRef, parent) {
	'use strict';
	$N.apps.core.Language.adornWithGetString(PVRPlaybackBanner, "apps/mediaPlayer/common/");
	PVRPlaybackBanner.superConstructor.call(this, docRef);
	this._log = new $N.apps.core.Log("MediaPlayer", "PVRPlaybackBanner");
	this._log("PVRPlaybackBanner", "Enter");

	this._AUDIO_SUBTITLE_CHANGE_TIMEOUT = 3000;
	this.PROGRESS_WIDTH = 593.5;
	this.BUTTON_UPDATE_TIMEOUT = 1000;
	this.PVR_BANNER_TIMEOUT = null;
	this._playerBannerTimer = null;

	this._buttonGroup = new $N.gui.ButtonGroup(docRef, this._container);

	this.resetBannerTimeoutOnAudioSubtitleChange = function () {};
	this.callbackCycleAudioTrack = $N.app.fullScreenPlayer.tracks.cycleAudioTracks;
	this.callbacktoggleSubtitles = $N.app.TracksUtil.toggleSubtitles;
	this.audioSequenceFunction = null;
	this._tempSubtitleTrackCode = null;
	this.subtitleSequenceFunction = null;
	this.cycleAudio = null;
	this.isAudioSubtitleTogglingMode = null;
	this.toggleSubtitle = null;
	this.dictionary = {};
	this.isBannerActive = false;
	this._audiolanguage = null;
	this._audioTrack = null;
	this._audioChangeTimeout = null;
	this._buttonTimeout = null;
	this._eventName = new $N.gui.SpanLabel(docRef, this._container);

	this._buttonGroup.configure({
		x: 1325,
		y: 300
	});

	this._progress.configure({
		x: 695,
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
			y: 19,
			cssClass: "timeShiftProgressStartLabel"
		},
		endLabelProperties: {
			x: this.PROGRESS_WIDTH - 112,
			y: 19,
			cssClass: "timeShiftProgressEndLabel"
		}
	});

	this._stopContainer.configure({
		x: 220
	});

	this._replayContainer.configure({
		x: 310
	});

	this._rewContainer.configure({
		x: 400
	});
	this._playPauseContainer.configure({
		x: 490
	});

	this._ffwContainer.configure({
		x: 580
	});

	this._eventName.configure({
		x: 692,
		y: 265,
		height: 60,
		width: this.PROGRESS_WIDTH,
		cssClass: "timeShiftEventName",
		spanCssClass: "timeShiftEpisodeInfo"
	});

	this._rewIcon.configure({
		x: 14,
		y: 13,
		href: this._rewIcon.iconUrl
	});

	this._playPauseIcon.configure({
		x: 5,
		y: 3,
		height: 53,
		width: 53,
		href: this.PLAY_ICON_URL
	});

	this._ffwIcon.configure({
		x: 17,
		y: 13,
		href: this._ffwIcon.iconUrl
	});
	/* AUDIO / SUBTITLE - HEADER FUNCTION HELPERS START */
	this.updateIcons = function () {
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

	this.updateAudioAndSubtitleButtons = function () {
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

	this.exitPVRPlaybackBanner = function () {
		this._log("exitPVRPlaybackBanner", "Enter");
		this.setAudioStateIcon(false);
		this.setSubtitleStateIcon(false);
		this._log("exitPVRPlaybackBanner", "Exit");
	};

	/**
	 * Activating the audio/subtitle on OK,EXIT, PORTAL, MENU etc.. key is press
	 * Handling the key makes sure the audio/Subtitle is activated immediately and appropriate text is changed upon exit.
	 * @method activateAudioSubtitleOnKeyPress
	 * @private
	 */
	this.activateAudioSubtitleOnKeyPress = function () {
		this._log("activateAudioSubtitleOnKeyPress", "Enter");
		var audioTrackText = this._buttonGroup.getAudioTrackText(),
			subtitleText = this._buttonGroup.getSubtitleText();
		if (this.isAudioSubtitleTogglingMode && this.isVisible()) {
			if (audioTrackText !== (PVRPlaybackBanner.getString("menuAudio"))) {
				this._buttonGroup.activateAudio();
			}
			if (subtitleText !== (PVRPlaybackBanner.getString("menuSubtitles"))) {
				this._buttonGroup.activateSubtitle();
			}
			this.setAudioSubtitleTogglingMode(false);
			this._log("activateAudioSubtitleOnKeyPress", "Exit true");
			return true;
		}
		this._log("activateAudioSubtitleOnKeyPress", "Exit false");
		return false;
	};

	this.getAudioSubtitleTogglingMode = function () {
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
	this.getNextSubtitleText = function (currentSubtitleTextCode) {
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
	this.toggleSubtitleTitle = function () {
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
	this.setToggleSubtitleTitle = function () {
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
	this.resetSubtitleTimeout = function () {
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
	this.clearSubtitleTimeout = function () {
		if (this._subtitleChangeTimeout) {
			clearTimeout(this._subtitleChangeTimeout);
			this._subtitleChangeTimeout = null;
		}
	};

	/* SUBTITLE - HEADER HELPER FUNCTIONS END*/

	/* AUDIO - HEADER HELPER FUNCTIONS START */


	this._showCurrentAudioStateAndToggle = function () {
		this.showCurrentAudioStateAndToggle();
	};

	/**
	 * Clears the timer set for audio
	 * @method clearAudioTimeout
	 */
	this.clearAudioTimeout = function () {
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
	this.resetAudioTimeout = function () {
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

	this.activateAudio = function () {
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
	this.setActiveAudioTitle = function () {
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
	this.setAudioLanguageTitle = function () {
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

	this._rootSVGRef = this._container.getRootSVGRef();

	if (parent) {
		parent.addChild(this);
	}
	this._log("PVRPlaybackBanner", "Exit");
}
$N.gui.Util.extend(PVRPlaybackBanner, PlaybackBanner);

/**
 * @method getBannerTimeOut
 * Reads the current PVR Player banner user preference and returns integer
 */
function getBannerTimeOut() {
	var prefferedBannerTimeOut = $N.platform.system.Preferences.get($N.app.constants.PREF_PLAYBACK_PLAYER_TIMEOUT) || $N.app.constants.SURFER_DURATION_DEFAULT;
	return parseInt(prefferedBannerTimeOut, 10);
}

/**
 * @method setBannerTimeout
 * @param isBannerTimoutAllowed
 */
PVRPlaybackBanner.prototype.setBannerTimeout = function (isBannerTimeoutAllowed) {
	this._log("PVRPlaybackBanner", "setBannerActive Enter");
	var me = this;
	if (isBannerTimeoutAllowed === undefined) {
		isBannerTimeoutAllowed = true;
	}
	this.PVR_BANNER_TIMEOUT = getBannerTimeOut();

	if (this._playerBannerTimer) {
		clearTimeout(this._playerBannerTimer);
	}

	if (this.PVR_BANNER_TIMEOUT > 0 && isBannerTimeoutAllowed) { //0 check is done after R1-R2 migration. We have migrated from -1 for Always to 0 to be consistent with teleidea.
		this._playerBannerTimer = setTimeout(function () {
			me.hide();
		}, this.PVR_BANNER_TIMEOUT);
	}
	this._log("PVRPlaybackBanner", "setBannerActive Exit");
};

/**
 * @method show
 * @param {Boolean} isBannerTimeoutAllowed
 */
PVRPlaybackBanner.prototype.show = function (isBannerTimeoutAllowed) {
	if (isBannerTimeoutAllowed === undefined) {
		isBannerTimeoutAllowed = true;
	}
	this._log("PVRPlaybackBanner", "show Enter");
	this.updateAudioAndSubtitleButtons();
	this.setBannerTimeout(isBannerTimeoutAllowed);
	this.isBannerActive = true;
	PVRPlaybackBanner.superClass.show.call(this);
	this._log("PVRPlaybackBanner", "show Exit");
};

/**
 * @method hide
 * @param {bool} forceHide
 * used to indicate if the banner is forcefully hidden by user action
 * from player. (KEYDOWN)
 */
PVRPlaybackBanner.prototype.hide = function (forceHide) {
	this._log("PVRPlaybackBanner", "Hide Enter");
	if (this._playerBannerTimer || forceHide) {//Either the banner should be hidden by timer or forcefully by user action
		clearTimeout(this._playerBannerTimer);
		this._log("PVRPlaybackBanner", "hide Exit 1");
		this._playerBannerTimer = null;
		this._buttonGroup.hide();
		this.isBannerActive = false;
		PVRPlaybackBanner.superClass.hide.call(this);
	}
	this._log("PVRPlaybackBanner", "Hide Exit 2");

};

/**
 * A setter function to set the callback "resetBannerTimeoutOnAudioSubtitleChange()" from Miniguide.js
 * @method setResetBannerTimeout
 */
PVRPlaybackBanner.prototype.setResetBannerTimeout = function (callback) {
	this.resetBannerTimeoutOnAudioSubtitleChange = callback;
};



/**
 * Triggered by keyOkHandler() in MiniGuide.js to set this.isAudioSubtitleTogglingMode to false
 * @method setAudioSubtitleTogglingMode
 * @param {Boolean} flag
 */
PVRPlaybackBanner.prototype.setAudioSubtitleTogglingMode = function (flag) {
	this.isAudioSubtitleTogglingMode = flag;
};
/**
 * Sets the title for each menu option from the language bundle
 * @method importLanguageBundle
 */
PVRPlaybackBanner.prototype.importLanguageBundle = function () {
	this.dictionary.menuAudio = PVRPlaybackBanner.getString("menuAudio");
	this.dictionary.menuSubtitles = PVRPlaybackBanner.getString("menuSubtitles");
	this.dictionary.audioLanguage = PVRPlaybackBanner.getString("audioLanguage");
	this.dictionary.options = PVRPlaybackBanner.getString("options");
	this.dictionary.on = PVRPlaybackBanner.getString("on");
	this.dictionary.off = PVRPlaybackBanner.getString("off");
	this.dictionary.unavailable = PVRPlaybackBanner.getString("unavailable");
};

PVRPlaybackBanner.prototype.isBannerActive = function () {
	return this.isBannerActive;
};

/* SUBTITLE FUNCTIONS START */

/**
 * 2nd stage action to show if subtitles on | off
 * Switch sequence to 3rd level - toggleSubtitleTitle
 *
 * @method setSubtitleStatus
 */
PVRPlaybackBanner.prototype.setSubtitleStatus = function () {
	this.subtitleSequenceFunction = this.toggleSubtitleTitle;
	this.setToggleSubtitleTitle();
	this.resetSubtitleTimeout();
	this.setAudioSubtitleTogglingMode(true); //Handle OK key on MiniGuide, true = audio/subtitle toggling mode. Set to false in MiniGuide.js keyOkHandler()
};

/**
 * Triggered by keyHandler to display current subtitle status on/off
 * @method showCurrentSubtitleStateAndToggle
 */
PVRPlaybackBanner.prototype.showCurrentSubtitleStateAndToggle = function () {
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
PVRPlaybackBanner.prototype.setSubtitleStateIcon = function (state) {
	var iconPath = state ? $N.app.constants.ACTIVE_SUBTITLE_BUTTON_PATH : $N.app.constants.INACTIVE_SUBTITLE_BUTTON_PATH;
	this._buttonGroup.setSubtitleIcon(iconPath);
};

/**
 * Triggered by keyHandler to display currently playing audio language
 * @method showCurrentAudioTrackAndToggle
 */
PVRPlaybackBanner.prototype.showCurrentAudioTrackAndToggle = function () {
	if (this.audioSequenceFunction && $N.app.TracksUtil.isAudioTrackSelectable()) {
		this.audioSequenceFunction();
	}
};

/**
 * Set toggle subtitles function
 * @method setToggleSubtitlesFunction
 * @param {Function} callback
 */
PVRPlaybackBanner.prototype.setToggleSubtitlesFunction = function (callback) {
	this.toggleSubtitle = callback;
};

/**
 * Action to activate the subtitle based on the on/off status on OK key is pressed
 *
 * @method activateSubtitle
 */
PVRPlaybackBanner.prototype.activateSubtitle = function () {
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

/* AUDIO FUNCTIONS START */

/**
 * set audio label state icon
 * @method setAudioStateIcon
 * @param {bool} state - true if available
 */
PVRPlaybackBanner.prototype.setAudioStateIcon = function (state) {
	var iconPath = state ? $N.app.constants.ACTIVE_LANGUAGE_BUTTON_PATH : $N.app.constants.INACTIVE_LANGUAGE_BUTTON_PATH;
	this._buttonGroup.setAudioTrackIcon(iconPath);
};

/**
 * Set audio cycle function
 *
 * @method setAudioCycleFunction
 * @param {Function} functionName - closure with active fullScreenPlayer call
 */
PVRPlaybackBanner.prototype.setAudioCycleFunction = function (callback) {
	this.cycleAudio = callback;
};

/**
 * set audio label state icon
 * @method setAudioStateIcon
 * @param {bool} state - true if available
 */
PVRPlaybackBanner.prototype.setAudioStateIcon = function (state) {
	var iconPath = state ? $N.app.constants.ACTIVE_LANGUAGE_BUTTON_PATH : $N.app.constants.INACTIVE_LANGUAGE_BUTTON_PATH;
	this._buttonGroup.setAudioTrackIcon(iconPath);
};

/**
 * 3rd stage action to toggle "text" of audio track label between all the available audio language
 *
 * @method toggleAudioTrackText
 */
PVRPlaybackBanner.prototype.toggleAudioTrackText = function () {
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

/**
 * @method setEventNameText
 * @param {String} text
 */
PVRPlaybackBanner.prototype.setEventNameText = function (eventName, seriesText) {
	this._log("setEventNameText", "Enter");
	var eventNameText = $N.app.StringUtil.join(" ", eventName, seriesText);
	this._eventName.setText(eventNameText || "");
	this._eventName.setSpanOnText(seriesText);
	this._log("setEventNameText", "Exit");
};

/* AUDIO FUNCTIONS END */

/**
 * Returns the class name as a String.
 * @method toString
 * @return {String} The class name as a String.
 */
PVRPlaybackBanner.prototype.toString = function () {
	return "PVRPlaybackBanner";
};
