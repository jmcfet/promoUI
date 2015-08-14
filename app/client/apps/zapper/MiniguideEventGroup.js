/*global Zapper, MiniguideButtonGroup */
var $N = window.parent.$N;
/**
 * Class concerned with displaying the event data in the Miniguide.
 * @class MiniguideEventGroup
 * @constructor
 * @param {Object} docRef Reference to the document the list should be created in
 * @param {Object} parent The GUI object that this object should be attached to
 */
function MiniguideEventGroup(docRef, parent) {
	MiniguideEventGroup.superConstructor.call(this, docRef);
	this._log = new $N.apps.core.Log('ZAPPER', 'MiniguideEventGroup');
	this._container = new $N.gui.Container(docRef);
	this._dataMapper = {};

	// container for channel number,channel name and favourite icon.
	this._serviceContainer =  new $N.gui.Container(docRef, this._container);
	this._serviceNumber = new $N.gui.InlineLabel(docRef, this._serviceContainer);
	this._cursor = new $N.gui.InlineLabel(docRef, this._serviceContainer);
	this._serviceName = new $N.gui.InlineLabel(docRef, this._serviceContainer);

	this._time = new $N.gui.Label(docRef, this._container);
	this._leftBrowseArrow = new $N.gui.MaskIcon(docRef, this._container);
	this._rightBrowseArrow = new $N.gui.MaskIcon(docRef, this._container);
	this._reminderIcon = new $N.gui.ReminderIcon(docRef, this._container);
	this._recordIcon = new $N.gui.MiniguideRecordIcon(docRef, this._container);
	this._startOverIcon = new $N.gui.StartOverIcon(docRef, this._container);
	this._favouriteIcon = new $N.gui.Image(docRef, this._serviceContainer);
	this._ICON_SPACING = 12.5;
	this._audioChangeTimeout = null;
	this._audiolanguage = null;
	this._audioTrack = null;
	this._tempSubtitleTrackCode = null;
	this._AUDIO_SUBTITLE_CHANGE_TIMEOUT = 3000;
	this._subtitleChangeTimeout = null;
	this.isAudioSubtitleTogglingMode = false;
	this.resetBannerTimeoutOnAudioSubtitleChange = function () {};
	this.clearBannerTimeout = function () {};
	this.noSubtitleTracks = false;
	this._isFastScrollActive = false;
	this._SERVICE_CONTAINER_Y_POSITION = 19;

	// progress bar
	this._progressBarGroup = new $N.gui.Group(docRef, this._container);
	this._progress = new $N.gui.ContentProgressBar(docRef, this._progressBarGroup);
	this._startTime = new $N.gui.Label(docRef, this._progressBarGroup);
	this._endTime = new $N.gui.Label(docRef, this._progressBarGroup);

	// buttons
	this._buttonGroup = new MiniguideButtonGroup(docRef, this._container);

	this._eventLayer = new $N.gui.Container(docRef, this._container);
	this._titleContainer = new $N.gui.Container(docRef, this._eventLayer);
	this._title = new $N.gui.Label(docRef, this._titleContainer);
	this._nextTitleContainer = new $N.gui.Container(docRef, this._eventLayer);
	this._nextTitle = new $N.gui.Label(docRef, this._nextTitleContainer);
	this._parentalRatingIcon = new $N.gui.ParentalRatingIcon(docRef, this._titleContainer);

	this._isProgressBarDisplayed = false;
	this._isEventVisible = false;
	this._isViewCurrent = null;
	this._RECORD_ICON_X = 410;
	this._RECORD_ICON_NEXT_VIEW_X = 263;
	this._STARTOVER_ICON_X = 460;
    this._STARTOVER_ICON_NEXT_VIEW_X = 321.5;
    this._TITLE_WIDTH = 900;
    this._PADDING = 20;
    this._ADULT_INDEX = 10;

	this._container.configure({
		width: 1600,
		height: 195,
		x: 312,
		cssClass: "miniguideBackgroundLayer"
	});

	this._progressBarGroup.configure({
		width: 500,
		x: 47,
		y: 138,
		visible: false
	});

	this._startTime.configure({
		x: 0,
		y: 6,
		width: this._startTimeWidth,
		cssClass: 'startAndEndTimeMiniguideEventGroup'
	});

	this._progress.configure({
		x: 95,
		y: 20,
		width: 145.5,
		height: 15,
		outerCssClass: "progressOuter",
		innerCssClass: "progressInner glowEffect"
	});

	this._endTime.configure({
		x: 252,
		y: 6,
		width: 140,
		cssClass: 'startAndEndTimeMiniguideEventGroup'
	});

	this._serviceContainer.configure({
		x: 44,
		y: this._SERVICE_CONTAINER_Y_POSITION
	});

	this._serviceNumber.configure({
		cssClass: 'miniguideChannelNameAndNumber'
	});

	this._cursor.configure({
		cssClass: 'miniguideChannelNameAndNumber miniguideChannelNumberEntered'
	});

	this._serviceName.configure({
		cssClass: 'miniguideChannelNameAndNumber miniguideChannelNamePadding'
	});

	this._favouriteIcon.configure({
		height: 33,
		cssClass: 'pullRight verticalAlignMiddle miniguideFavIconPadding',
		href: "../../../customise/resources/images/720p/icons/favHeartIcon.png"
	});

	this._recordIcon.configure({
		x: this._RECORD_ICON_X,
		y: 141
	});

	this._reminderIcon.configure({
		width: 36,
		height: 37,
	    x: 380,
	    y: 141
	});

	this._startOverIcon.configure({
		x: this._STARTOVER_ICON_X,
		y: 141
	});

	this._time.configure({
		x: 1310,
		y: 57,
		cssClass: 'miniguideTime',
		width: 300
	});

	this._eventLayer.configure({
		x: 35,
		y: 69,
		width: 1395,
		height: 54,
		cssClass: "miniguideEventLayer"
	});

	this._titleContainer.configure({
		x: 0,
		y: 0,
		cssClass: "miniguideTitleContainer",
		width: 954,
		height: 54
	});

	this._title.configure({
		x: 10,
		y: 9,
		cssClass: "miniguideTitle",
		width: this._TITLE_WIDTH
	});

	this._parentalRatingIcon.configure({
		x: 909,
		y: 11
	});

	this._nextTitleContainer.configure({
		x: 966,
		y: 0,
		cssClass: "miniguideNextTitleContainer",
		width: 409.5,
		height: 54
	});

	this._nextTitle.configure({
		x: 10,
		y: 12,
		cssClass: "miniguideNextTitle",
		width: 390
	});

	this._leftBrowseArrow.configure({
		x: 0,
		y: 78,
		width: 18,
		height: 30,
		id: "leftBrowseArrow",
		href: "../../../customise/resources/images/icons/arrows/leftArrowIcon.png",
		color: "#8d9ba9",
		visible: false
	});
	this._rightBrowseArrow.configure({
		x: 1440,
		y: 78,
		width: 18,
		height: 30,
		id: "rightBrowseArrow",
		href: "../../../customise/resources/images/icons/arrows/rightArrowIcon.png",
		color: "#8d9ba9"
	});
	this.audioSequenceFunction = null;
	this.subtitleSequenceFunction = null;
	this.cycleAudio = null;
	this.toggleSubtitle = null;
	this.dictionary = {};
	this.callbackEmpty = function () {};
	this.callbackCycleAudioTrack = $N.app.fullScreenPlayer.tracks.cycleAudioTracks;
	this.callbacktoggleSubtitles = $N.app.TracksUtil.toggleSubtitles;
	this._rootSVGRef = this._container.getRootSVGRef();
	if (parent) {
		parent.addChild(this);
	}
}

$N.gui.Util.extend(MiniguideEventGroup, $N.gui.GUIObject);

/**
 * @method setTitle
 * @param {String} text
 */
MiniguideEventGroup.prototype.setTitle = function (text) {
	this._log("setTitle", "Enter & Exit");
	this._title.setText(text);
};

/**
 * @method setTitle
 * @param {String} text
 */
MiniguideEventGroup.prototype.setNextTitle = function (text) {
	this._log("setTitle", "Enter & Exit");
	this._nextTitle.setText(text);
};

/**
 * @method setServiceName
 * @param {String} text
 */
MiniguideEventGroup.prototype.setServiceName = function (text) {
	this._log("setServiceName", "Enter & Exit");
	this._serviceName.setText(text);
};

/**
 * @method setServiceNumber
 * @param {Number} number
 */
MiniguideEventGroup.prototype.setServiceNumber = function (number) {
	this._log("setServiceNumber", "Enter & Exit");
	this._serviceNumber.setText($N.app.GeneralUtil.padNumberWithZeroes(number, 3));
};

/**
 * @method getServiceNumber
 * @return {Object} the service number label
 */
MiniguideEventGroup.prototype.getServiceNumber = function () {
	this._log("getServiceNumber", "Enter & Exit");
	return this._serviceNumber;
};

MiniguideEventGroup.prototype.getCursor = function () {
	this._log("getCursor", "Enter & Exit");
	return this._cursor;
};

/**
 * @method setTitleProperties
 * @param {Object} properties
 */
MiniguideEventGroup.prototype.setTitleProperties = function (properties) {
	this._log("setTitleProperties", "Enter & Exit");
	this._title.configure(properties);
};

/**
 * @method setDataMapper
 * @param {Object} dataMapper
 */
MiniguideEventGroup.prototype.setDataMapper = function (dataMapper) {
	this._log("setDataMapper", "Enter & Exit");
	this._dataMapper = dataMapper;
};

/**
 * @method updateTime
 */
MiniguideEventGroup.prototype.updateTime = function () {
	this._time.setText($N.apps.util.Util.formatTime(new Date(), "HH:MM"));
};

/**
 * @method updateIconPositions
 */
MiniguideEventGroup.prototype.updateIconPositions = function () {
	this._log("updateIconPositions", "Enter");
	var reminderIconXPos = this._RECORD_ICON_NEXT_VIEW_X;
	// FIXME NETUI-237: Implement a multi-icon solution
	this._recordIcon.setX(this._isProgressBarDisplayed ? this._RECORD_ICON_X : this._RECORD_ICON_NEXT_VIEW_X);
	this._startOverIcon.setX(this._isProgressBarDisplayed ? this._STARTOVER_ICON_X : this._STARTOVER_ICON_NEXT_VIEW_X);
	if (this._recordIcon.isVisible()) {
		reminderIconXPos = this._recordIcon.getX() + this._recordIcon.getTrueWidth() + this._PADDING;
		reminderIconXPos = this._isProgressBarDisplayed ? (this._RECORD_ICON_X + reminderIconXPos) : (this._RECORD_ICON_NEXT_VIEW_X + reminderIconXPos);
	}
	if (this._startOverIcon.isVisible()) {
		reminderIconXPos = reminderIconXPos + this._startOverIcon.getX() + this._startOverIcon.getTrueWidth() + this._PADDING;
		reminderIconXPos = this._isProgressBarDisplayed ? (this._STARTOVER_ICON_X + reminderIconXPos) : (this._STARTOVER_ICON_NEXT_VIEW_X + reminderIconXPos);
	}
	this._reminderIcon.setX(reminderIconXPos);
	this._log("updateIconPositions", "Exit");
};

/**
 * @method updateTitleTextLength
 */
MiniguideEventGroup.prototype.updateTitleTextLength = function () {
	this._log("updateTitleTextLength", "Enter");
	if (this._parentalRatingIcon.isVisible()) {
		this._title.setWidth(this._TITLE_WIDTH - 10);
	} else {
		this._title.setWidth(this._TITLE_WIDTH);
	}
	this._log("updateTitleTextLength", "Exit");
};

/**
 * @method updateIcons
 * @param {Object} event
 */
MiniguideEventGroup.prototype.updateIcons = function (event) {
	this._log("updateIcons", "Enter");
	this._recordIcon.update(event);
	this._reminderIcon.update(event);
	this._startOverIcon.update(event);
	this._parentalRatingIcon.update(event);
	this.updateIconPositions();
	this.updateTitleTextLength();
	this.updateFavouriteStatus(event);
	this._log("updateIcons", "Exit");
};

/**
 * @method hideIcons
 */
MiniguideEventGroup.prototype.hideIcons = function () {
	this._log("hideIcons", "Enter");
	this._recordIcon.hide();
	this._reminderIcon.hide();
	this._startOverIcon.hide();
	this._parentalRatingIcon.hide();
	this._log("hideIcons", "Exit");
};

/**
 * @method updateProgress
 * @param {Object} progressData an object comprising the data needed for the progress bar
 * ...(minimum, maximum and progress values)
 */
MiniguideEventGroup.prototype.updateProgress = function (progressData) {
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
	} else if (progressData.minimum === 0 && progressData.maximum === 0) {
		this._progressBarGroup.hide();
		this._isProgressBarDisplayed = false;
	} else {
		if (this._isFastScrollActive) {
			this._progress.hide();
			this._endTime.hide();
			this._progressBarGroup.hide();
		} else {
			this._progress.show();
			this._endTime.show();
			this._progressBarGroup.show();
			this._isProgressBarDisplayed = true;
		}
	}
	this._log("updateProgress", "Exit");
};

/**
 * @method updateEventOnFastScroll
 * @param {Object} event
 * @param {Number} eventListIndex
 * @param {Boolean} isBlocked
 */
MiniguideEventGroup.prototype.updateEventOnFastScroll = function (event, eventListIndex, isBlocked) {
	this._log("updateEventOnFastScroll", "Enter");
	if (event) {
		var serviceObj = $N.app.epgUtil.getServiceById(event.serviceId);
		this._progressBarGroup.hide();
		this.hideIcons();
		this._buttonGroup.hide();
		this._isProgressBarDisplayed = false;
		this._isFastScrollActive = true;
		if (!isBlocked) {
			this.setTitle(this._dataMapper.getTitle(event));
			this.setNextTitle(this._dataMapper.getTitle(event.nextEvent || ""));
			this.setServiceName(this._dataMapper.getServiceName(serviceObj));
			this.setServiceNumber(this._dataMapper.getServiceNumber(serviceObj));
		} else {
			this.updateTitleIfBlocked(event, serviceObj);
		}
		this.setToCurrentOrFutureView(eventListIndex);
		this.updateTime();
	}
	this._log("updateEventOnFastScroll", "Exit");
};

/**
 * @method updateEvent
 * @param {Object} event
 * @param {Number} eventListIndex
 * @param {Boolean} isBlocked
 * @param {Boolean} isDisplayedEventPlaying
 */
MiniguideEventGroup.prototype.updateEvent = function (event, eventListIndex, isBlocked, isDisplayedEventPlaying, serviceObj) {
	this._log("updateEvent", "Enter");
	if (event) {
		var progressData = this._dataMapper.getProgressBarData(event),
			CHANNEL_NUMBER_DISPLAY_CSS = "miniguideChannelNameAndNumber",
			hasEventData = (event.eventId) && (event.eventId !== $N.app.epgUtil.BAD_EVENT_ID);
		serviceObj = serviceObj || $N.app.epgUtil.getServiceById(event.serviceId);
		this._progressBarGroup.show();
		this.updateAudioAndSubtitleButtons(isDisplayedEventPlaying, hasEventData);
		this._buttonGroup.show();
		this._isProgressBarDisplayed = true;
		this._isFastScrollActive = false;
		if (!isBlocked) {
			this.setTitle(this._dataMapper.getSeriesEpisodeTitle(event));
			this.setNextTitle(this._dataMapper.getTitle(event.nextEvent || ""));
			this.setServiceName(this._dataMapper.getServiceName(serviceObj));
			this.setServiceNumber(this._dataMapper.getServiceNumber(serviceObj));
			this.setServiceContainerY(this._SERVICE_CONTAINER_Y_POSITION);
			this.setServiceNumberCssClass(CHANNEL_NUMBER_DISPLAY_CSS);
			this.setCursorCssClass(CHANNEL_NUMBER_DISPLAY_CSS);
		} else {
			this.updateTitleIfBlocked(event, serviceObj);
		}
		if (progressData.minimum !== undefined && progressData.maximum !== undefined &&
				progressData.minimum < progressData.maximum) {
			this.updateProgress(progressData);

		} else {
			this._progressBarGroup.hide();
			this._isProgressBarDisplayed = false;
		}
		this.setToCurrentOrFutureView(eventListIndex);
		this.updateTime();
		this.updateIcons(event);
	}
	this._log("updateEvent", "Exit");
};

/**
 * @method updateTitleIfBlocked
 * @param {Object} event
 */
MiniguideEventGroup.prototype.updateTitleIfBlocked = function (event, serviceObj) {
	var currentServiceId = event.serviceId,
		channelList = $N.app.genreUtil.getAllChannelsByGenre(this._ADULT_INDEX),
		isAdultChannel = false,
		CHANNEL_NUMBER_DISPLAY_CSS = "miniguideChannelNameAndNumber",
		i;
	for (i = 0; i < channelList.length; i++) {
		if (currentServiceId === channelList[i].serviceId) {
			this.setTitle(Zapper.getString("adultContent"));
			this.setNextTitle(Zapper.getString("adultContent"));
			isAdultChannel = true;
			break;
		}
	}
	if (!isAdultChannel) {
		this.setTitle(this._dataMapper.getSeriesEpisodeTitle(event));
		this.setNextTitle(this._dataMapper.getTitle(event.nextEvent || ""));
	}
	this.setServiceName(this._dataMapper.getServiceName(serviceObj));
	this.setServiceNumber(this._dataMapper.getServiceNumber(serviceObj));
	this.setServiceContainerY(this._SERVICE_CONTAINER_Y_POSITION);
	this.setServiceNumberCssClass(CHANNEL_NUMBER_DISPLAY_CSS);
	this.setCursorCssClass(CHANNEL_NUMBER_DISPLAY_CSS);
};

/**
 * This method is designed to reset status by restoring 1st stage of workflow
 *
 * @method updateAudioAndSubtitleButtons
 * @param {Boolean} isDisplayedEventPlaying
 * @param {Boolean} hasEventData
 */
MiniguideEventGroup.prototype.updateAudioAndSubtitleButtons = function (isDisplayedEventPlaying, hasEventData) {
	this._log("updateAudioAndSubtitleButtons", "Enter");
	var subtitleTracks = $N.app.fullScreenPlayer.tracks.getSubtitleTracks(),
		isSubtitleAvailable;
	if (subtitleTracks.length === 0) {
		isSubtitleAvailable = false;
	} else {
		isSubtitleAvailable = true;
	}
    this.setAudioStateIcon($N.app.TracksUtil.isAudioTrackSelectable());
    this.setSubtitleStateIcon(isSubtitleAvailable);
	this.importLanguageBundle();
	this.audioSequenceFunction = this.setActiveAudioTitle;
	this.subtitleSequenceFunction = this.setSubtitleStatus;
	this.setAudioCycleFunction(this.callbackEmpty);
	this.setToggleSubtitlesFunction(this.callbackEmpty);
	this._buttonGroup.setAudioTrackLabel(this.dictionary.menuAudio);
	this._buttonGroup.setSubtitleLabel(this.dictionary.menuSubtitles);
	this._buttonGroup.setOptionsLabel(this.dictionary.options);
	this._buttonGroup.setButtonPositionsAndVisibility(isDisplayedEventPlaying, hasEventData);
	this._buttonGroup.setSubtitleCssClass("miniguideButtonText");
	this._buttonGroup.setAudioCssClass("miniguideButtonText");
	this._buttonGroup.show();
	this._log("updateAudioAndSubtitleButtons", "Exit");
};

/**
 * Load subtitle and audio state and assign 1st level functions to callbacks
 *
 * @method reloadAudioSubtitleStatus
 * // FIXME NETUI-110: stream event is not working properly and requires to be fixed
 * officially this event should be returned 1-4 times (video, audio, subtitles, data)
 * @param {Object} event - event returned by $N.app.fullScreenPlayer.registerPlayerConnectedListener
 * null is acceptable
 */
MiniguideEventGroup.prototype.reloadAudioSubtitleStatus = function (event) {
	var audioState = false,
		subtitleState = false;
		// if audio track selectable and if it is not having invalid audio track then show the solid audio icon by setting audioState to true.
	if ($N.app.TracksUtil.isAudioTrackSelectable() === true) {
		audioState = true;
		this.setAudioCycleFunction(this.callbackCycleAudioTrack);
	}
	if ($N.app.TracksUtil.isSubtitleTrackSelectable() === true) {
		subtitleState = true;
		this.setToggleSubtitlesFunction(this.callbacktoggleSubtitles);
	}
	this.setAudioStateIcon(audioState);
	this.setSubtitleStateIcon(subtitleState);
	this._buttonGroup.show();
};

/**
 * Set audio language title
 * Set audio language cssClass
 * Depending on the number of audio options available the css is set
 * @method setAudioLanguageTitle
 */
MiniguideEventGroup.prototype.setAudioLanguageTitle = function () {
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
			this._buttonGroup.setAudioCssClass("miniguideNoOptionsText");
		} else {
		// show blue color text next to audio icon.
			this._buttonGroup.setAudioCssClass("miniguideButtonTextChange");
		}
	}
};

/**
 * Set audio cycle function
 *
 * @method setAudioCycleFunction
 * @param {Function} functionName - closure with active fullScreenPlayer call
 */
MiniguideEventGroup.prototype.setAudioCycleFunction = function (callback) {
	this.cycleAudio = callback;
};

/**
 * set audio label state icon
 * @method setAudioStateIcon
 * @param {bool} state - true if available
 */
MiniguideEventGroup.prototype.setAudioStateIcon = function (state) {
	this._buttonGroup.setAudioTrackIconActive(state);
};

/**
 * set subtitles label state icon
 * @method setSubtitleStateIcon
 * @param {bool} state - true if available
 */
MiniguideEventGroup.prototype.setSubtitleStateIcon = function (state) {
	this._buttonGroup.setSubtitleIconActive(state);
};

/**
 * Set toggle subtitles function
 * @method setToggleSubtitlesFunction
 * @param {Function} callback
 */
MiniguideEventGroup.prototype.setToggleSubtitlesFunction = function (callback) {
	this.toggleSubtitle = callback;
};

/**
 * Show current subtitles state
 * The css is changed to options, based on wheather subtitle is available or not
 * @method setToggleSubtitleTitle
 */
MiniguideEventGroup.prototype.setToggleSubtitleTitle = function () {
	this._log("setToggleSubtitleTitle", "When banner is active pressing YELLOW key", "Showing the current subtitle state");
	var subtitle = null;
	if ($N.app.TracksUtil.isSubtitleTrackSelectable()) {
		subtitle = $N.app.fullScreenPlayer.tracks.getActiveSubtitleTrack();
		this._buttonGroup.setSubtitleCssClass("miniguideButtonTextChange");
		this._buttonGroup.setSubtitleLabel((subtitle && subtitle.language) ? this.dictionary.audioLanguage[subtitle.language] : this.dictionary.off);
		this.noSubtitleTracks = false;
		this._tempSubtitleTrackCode = (subtitle && subtitle.language) ? subtitle.language : this.dictionary.off;
	} else {
		this._buttonGroup.setSubtitleLabel(this.dictionary.unavailable);
		this._buttonGroup.setSubtitleCssClass("miniguideNoOptionsText");
		this.noSubtitleTracks = true;
		this._tempSubtitleTrackCode = null;
	}
};

/**
 * Sets the title for each menu option from the language bundle
 * @method importLanguageBundle
 */
MiniguideEventGroup.prototype.importLanguageBundle = function () {
	this.dictionary.menuAudio = Zapper.getString("menuAudio");
	this.dictionary.menuSubtitles = Zapper.getString("menuSubtitles");
	this.dictionary.audioLanguage = Zapper.getString("audioLanguage");
	this.dictionary.options = Zapper.getString("options");
	this.dictionary.on = Zapper.getString("on");
	this.dictionary.off = Zapper.getString("off");
	this.dictionary.unavailable = Zapper.getString("unavailable");
};

/**
  * Triggered by keyHandler to display currently playing audio language
  * @method showCurrentAudioTrackAndToggle
  */
MiniguideEventGroup.prototype.showCurrentAudioTrackAndToggle = function () {
	this.audioSequenceFunction();
};

/**
 * Triggered by keyHandler to display current subtitle status on/off
 * @method showCurrentSubtitleStateAndToggle
 */
MiniguideEventGroup.prototype.showCurrentSubtitleStateAndToggle = function () {
	if (!this.noSubtitleTracks) {
		this.subtitleSequenceFunction();
	} else {
		this.setSubtitleStatus();
	}
};

/**
 * Triggered by keyOkHandler() in MiniGuide.js to set this.isAudioSubtitleTogglingMode to false
 * @method setAudioSubtitleTogglingMode
 */
MiniguideEventGroup.prototype.setAudioSubtitleTogglingMode = function (flag) {
	this.isAudioSubtitleTogglingMode = flag;
};

/**
 * Triggered by keyOkHandler() in MiniGuide.js to get this.isAudioSubtitleTogglingMode so that Ok key is handled to change Audio and Subtitles
 * @method getAudioSubtitleTogglingMode
 */
MiniguideEventGroup.prototype.getAudioSubtitleTogglingMode = function () {
	return this.isAudioSubtitleTogglingMode;
};

/**
 * 2nd stage action which shows current selected audio and assigns new function for next click
 *
 * @method setActiveAudioTitle
 */
MiniguideEventGroup.prototype.setActiveAudioTitle = function () {
	this.audioSequenceFunction = this.toggleAudioTrackText;
	this.setAudioLanguageTitle();//set the current audio
	this.clearBannerTimeout();
	this.resetAudioTimeout();
	this.setAudioSubtitleTogglingMode(true); //Handle OK key on MiniGuide, true = audio/subtitle toggling mode. Set to false in MiniGuide.js keyOkHandler()
};
/**
 * Gets the current label text for audio
 * @method getAudioTrackText
 */
MiniguideEventGroup.prototype.getAudioTrackText = function () {
	return this._buttonGroup.getAudioTrackText();
};

/**
 * 3rd stage action to toggle "text" of audio track label between all the available audio language
 *
 * @method toggleAudioTrackText
 */
MiniguideEventGroup.prototype.toggleAudioTrackText = function () {
	var audioTrackLabel = this.getAudioTrackText(),
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
		this.clearBannerTimeout();
		this.resetAudioTimeout();
	}
};

/**
 * 4th stage action to activate the audio after 3 seconds timeout
 *
 * @method resetAudioTimeout
 */
MiniguideEventGroup.prototype.resetAudioTimeout = function () {
	var me = null;
	this.clearAudioTimeout();
	me = this;
	this._audioChangeTimeout = setTimeout(function () {
		me.activateAudio();
		if (me.getSubtitleText() === me.dictionary.menuSubtitles) {//setAudioSubtitleTogglingMode represents both audio and subtitle, which, if set to false in audio timeout, Ok key for subtitles cannot be handled.
			me.setAudioSubtitleTogglingMode(false);
		}
	}, this._AUDIO_SUBTITLE_CHANGE_TIMEOUT);
};

/**
 * Action to activate the selected audio after OK key is pressed
 *
 * @method activateAudio
 */
MiniguideEventGroup.prototype.activateAudio = function () {
	var currentSubtitleText = null;
	if (this._audioTrack) {
		$N.app.fullScreenPlayer.tracks.activateAudioTrackById(this._audioTrack.id);
	} else {
		$N.app.fullScreenPlayer.tracks.activateAudioTrackByLanguage(this._audiolanguage);
	}
	this._buttonGroup.setAudioTrackLabel(this.dictionary.menuAudio);
	this._buttonGroup.setAudioCssClass("miniguideButtonText");
	currentSubtitleText = this.getSubtitleText();
	if (currentSubtitleText === this.dictionary.menuSubtitles) {
		this.resetBannerTimeoutOnAudioSubtitleChange();// The timer should only start when both Audio or Legenda are displayed. If any blue text is displayed the mini guide stays in place.
	}
	this._log("activateAudio", "Banner Time is reset");
	this.clearAudioTimeout();
	this._log("activateAudio", "The audio track is changed" + this._audiolanguage);
};

/**
 * A setter function to set the callback "resetBannerTimeoutOnAudioSubtitleChange()" from Miniguide.js
 * @method setResetBannerTimeout
 */
MiniguideEventGroup.prototype.setResetBannerTimeout = function (callback) {
	this.resetBannerTimeoutOnAudioSubtitleChange = callback;
};
/**
 * A setter function to set the callback "clearBannerTimeout()" from Miniguide.js
 * @method setClearBannerTimeout
 */
MiniguideEventGroup.prototype.setClearBannerTimeout = function (callback) {
	this.clearBannerTimeout = callback;
};
/**
 * Clears the timer set for audio
 *
 * @method clearAudioTimeout
 */
MiniguideEventGroup.prototype.clearAudioTimeout = function () {
	if (this._audioChangeTimeout) {
        clearTimeout(this._audioChangeTimeout);
        this._audioChangeTimeout = null;
    }
};
/**
 * Clears the timer set for subtitle
 *
 * @method clearSubtitleTimeout
 */
MiniguideEventGroup.prototype.clearSubtitleTimeout = function () {
	if (this._subtitleChangeTimeout) {
		clearTimeout(this._subtitleChangeTimeout);
		this._subtitleChangeTimeout = null;
    }
};

/**
 * To handle channel +/-, reset the text and clears the timeout when audio/subtitle is in toggling mode
 *
 * @method resetAudioSubtitle
 */
MiniguideEventGroup.prototype.resetAudioSubtitle = function () {
	var currentSubtitleText = this.getSubtitleText(),
		audioTrackLabel = this.getAudioTrackText();
	if (currentSubtitleText !== this.dictionary.menuSubtitles) {
		this._buttonGroup.setSubtitleLabel(this.dictionary.menuSubtitles);
	}
	if (audioTrackLabel !== this.dictionary.menuAudio) {
		this._buttonGroup.setAudioTrackLabel(this.dictionary.menuAudio);
	}
	this._tempSubtitleTrackCode = null;
	this.clearAudioTimeout();
	this.clearSubtitleTimeout();
};

/**
 * 2nd stage action to show if subtitles on | off
 * Switch sequence to 3rd level - toggleSubtitleTitle
 *
 * @method setSubtitleStatus
 */
MiniguideEventGroup.prototype.setSubtitleStatus = function () {
	this.subtitleSequenceFunction = this.toggleSubtitleTitle;
	this.setToggleSubtitleTitle();
	this.clearBannerTimeout();
	this.resetSubtitleTimeout();
	this.setAudioSubtitleTogglingMode(true); //Handle OK key on MiniGuide, true = audio/subtitle toggling mode. Set to false in MiniGuide.js keyOkHandler()
};
/**
 * Gets the current label text for subtitle
 * @method getSubtitleText
 */
MiniguideEventGroup.prototype.getSubtitleText = function () {
	return this._buttonGroup.getSubtitleText();
};

/**
 * 3rd level action to toggle between the subtitle text on/off
 *
 * @method toggleSubtitleTitle
 */
MiniguideEventGroup.prototype.toggleSubtitleTitle = function () {
	var currentSubtitleText = this.getSubtitleText();
	if (currentSubtitleText === this.dictionary.menuSubtitles) {
		this.setSubtitleStatus();
	} else {
		this._buttonGroup.setSubtitleCssClass("miniguideButtonTextChange");
		this._buttonGroup.setSubtitleLabel(this.getNextSubtitleText(this._tempSubtitleTrackCode));
		this.clearBannerTimeout();
		this.resetSubtitleTimeout();
	}
};
/**
 * 4th stage action to activate the subtitle after 3 seconds timeout
 *
 * @method resetSubtitleTimeout
 */
MiniguideEventGroup.prototype.resetSubtitleTimeout = function () {
	var me = null;
	this.clearSubtitleTimeout();
	me = this;
	this._subtitleChangeTimeout = setTimeout(function () {
		me.activateSubtitle();
		if (me.getAudioTrackText() === me.dictionary.menuAudio) {//setAudioSubtitleTogglingMode represents both audio and subtitle, which, if set to false in Subtitle timeout, Ok key for audio cannot be handled.
			me.setAudioSubtitleTogglingMode(false);
		}
	}, this._AUDIO_SUBTITLE_CHANGE_TIMEOUT);
};

/**
 * @method getNextSubtitleText
 * To get the next available subtitle track text code(ex: "eng" for English ), if not available then fetch "off"
 * @param{string}, currentSubtitleTextCode
 * @return{string}
 */
MiniguideEventGroup.prototype.getNextSubtitleText = function (currentSubtitleTextCode) {
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
 * Action to activate the subtitle based on the on/off status on OK key is pressed
 *
 * @method activateSubtitle
 */
MiniguideEventGroup.prototype.activateSubtitle = function () {
	var currentSubtitleText = this.getSubtitleText(),
		audioTrackLabel = null;
	if (currentSubtitleText !== this.dictionary.off) {
		$N.app.fullScreenPlayer.tracks.activateSubtitleTrackByLanguage(this._tempSubtitleTrackCode);
		this._log("activateSubtitle", "The subtitle track is enabled");
	} else {
		$N.app.TracksUtil.deactivateCurrentSubtitleTrack();
		this._log("activateSubtitle", 'The subtitle track is disabled');
	}
	this._buttonGroup.setSubtitleLabel(this.dictionary.menuSubtitles);
	this._buttonGroup.setSubtitleCssClass("miniguideButtonText");
	audioTrackLabel = this.getAudioTrackText();
	if (audioTrackLabel === this.dictionary.menuAudio) {
		this.resetBannerTimeoutOnAudioSubtitleChange(); // The timer should only start when both Audio or Legenda are displayed. If any blue text is displayed the mini guide stays in place.
	}
	this._log("activateSubtitle", "Banner Time is reset");
	this.clearSubtitleTimeout();
};

/**
 * @method setServiceNumberCssClass
 * @param {String} cssName
 */
MiniguideEventGroup.prototype.setServiceNumberCssClass = function (cssClass) {
	this._serviceNumber.setCssClass(cssClass);
};

/**
 * @method setServiceContainerYposition
 * @param {Number} y position
 */
MiniguideEventGroup.prototype.setServiceContainerY = function (yPosition) {
	this._serviceContainer.configure({
		y: yPosition
	});
};

/**
 * @method setCursorCssClass
 * @param {String} cssName
 */
MiniguideEventGroup.prototype.setCursorCssClass = function (cssClass) {
	this._cursor.setCssClass(cssClass);
};

/**
 * @method setToCurrentOrFutureView
 * @param {Number} eventListIndex
 */
MiniguideEventGroup.prototype.setToCurrentOrFutureView = function (eventListIndex) {
	var inCurrentView = eventListIndex > 0;

	if (inCurrentView !== this._isViewCurrent) {
		if (inCurrentView) {
			this.showLeftBrowseArrow();
			this._title.setCssClass("miniguideTitleGrey");
		} else {
			this.hideLeftBrowseArrow();
			this._title.setCssClass("miniguideTitle");
		}

		this._isViewCurrent = inCurrentView;
	}
};

/**
 * @method hideLeftBrowseArrow
 */
MiniguideEventGroup.prototype.hideLeftBrowseArrow = function () {
	this._log("hideLeftBrowseArrow", "Enter & Exit");
	this._leftBrowseArrow.hide();
};

/**
 * @method showLeftBrowseArrow
 */
MiniguideEventGroup.prototype.showLeftBrowseArrow = function () {
	this._log("showLeftBrowseArrow", "Enter & Exit");
	this._leftBrowseArrow.show();
};

/**
 * @method hideRightBrowseArrow
 */
MiniguideEventGroup.prototype.hideRightBrowseArrow = function () {
	this._log("hideRightBrowseArrow", "Enter & Exit");
	this._rightBrowseArrow.hide();
};

/**
 * @method showRightBrowseArrow
 */
MiniguideEventGroup.prototype.showRightBrowseArrow = function () {
	this._log("showRightBrowseArrow", "Enter & Exit");
	this._rightBrowseArrow.show();
};

/**
 * @method pinDisplayed
 */
MiniguideEventGroup.prototype.pinDisplayed = function () {
	this._log("pinDisplayed", "Enter");
	this._progressBarGroup.hide();
	this._isProgressBarDisplayed = false;
	this._log("pinDisplayed", "Exit");
};

/**
 * @method toString
 * @return {String}
 */
MiniguideEventGroup.prototype.toString = function () {
	return "MiniguideEventGroup";
};

/**
 * @method updateFavouriteStatus
 * @return {String}
 */
MiniguideEventGroup.prototype.updateFavouriteStatus = function (event) {
	if ($N.app.ChannelManager.isFavouriteChannel($N.app.epgUtil.getServiceById(event.serviceId))) {
		this._favouriteIcon.show();
	} else {
		this._favouriteIcon.hide();
	}
};

/**
 * @method hideFavouriteStatus
 * @return {String}
 */
MiniguideEventGroup.prototype.hideFavouriteStatus = function (event) {
	this._favouriteIcon.hide();
};

/**
 * @method toogleActiveGroup
 */
MiniguideEventGroup.prototype.toogleActiveGroup = function () {
	this._container.toggleCssClass("active");
};

/**
 * @method moveTitle
 * @param {String} animationName - Name of CSS animation to use
 */
MiniguideEventGroup.prototype.moveTitle = function (animationName) {
	this._eventLayer.getRootElement().style.webkitAnimationName = animationName;
};
