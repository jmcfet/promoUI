/*global MiniguideEventGroup*/
/**
 * AnimatedMiniguide has two event groups and two service groups. When you animate the miniguide, it loads data for the new event and
 * service to be shown into the inactive groups, positions them either above or below the active groups (outside the clipping area)
 * and then animates the active and inactive groups. It also swaps some references to the active and inactive groups, so either just
 * before (or just after, I don't recall) the animation takes place, the active groups are now the data that's being displayed.
 *
 * Instantiated in the Miniguide class and used to update the gui elements within the zapper.
 *
 * @class AnimatedMiniguide
 */
var $N = window.parent.$N;

function AnimatedMiniguide(documentReference, parent) {

	AnimatedMiniguide.superConstructor.call(this, documentReference);

	this._log = new $N.apps.core.Log('AnimatedMiniguide', 'AnimatedMiniguide');

	this._itemHighlightedTimeout = null;
	this._itemHighlightedTimeoutMS = 500;
	this._bannerActive = false;

	this._itemHighlightedCallback = function () {};

	this._container = new $N.gui.Container(documentReference);

	this._upArrow = new $N.gui.MaskIcon(this._docRef, this._container);
	this._downArrow = new $N.gui.MaskIcon(this._docRef, this._container);

	this._activeChannelLogo = new $N.gui.ChannelLogo(this._docRef, this._container);
	this._inactiveChannelLogo = new $N.gui.ChannelLogo(this._docRef, this._container);

	this._activeChannelLogo.addCssClass("miniguideChannelLogoAnimation");
	this._activeChannelLogo.configure({
		x: 186,
		y: 51
	});
	this._inactiveChannelLogo.addCssClass("miniguideChannelLogoAnimation");
	this._inactiveChannelLogo.configure({
		x: 186,
		y: 51
	});

	this._activeEventGroup = new MiniguideEventGroup(documentReference, this._container);
	this._inactiveEventGroup = new MiniguideEventGroup(documentReference, this._container);

	this._upArrow.configure({
		x: 219,
		y: 18,
		width: 30,
		height: 18,
		href: "../../../customise/resources/images/icons/arrows/upArrowIcon.png",
		cssClass: "miniguideUpArrowIcon",
		color: "#8d9ba9"
	});
	this._downArrow.configure({
		x: 219,
		y: 162,
		width: 30,
		height: 18,
		href: "../../../customise/resources/images/icons/arrows/downArrowIcon.png",
		cssClass: "miniguideDownArrowIcon",
		color: "#8d9ba9"
	});

	this._activeEventGroup.toogleActiveGroup();
	this._activeEventGroup.moveTitle("");
	this._inactiveEventGroup.moveTitle("");

	this._rootSVGRef = this._container.getRootSVGRef();

	if (parent) {
		parent.addChild(this);
	}
}

$N.gui.Util.extend(AnimatedMiniguide, $N.gui.GUIObject);

/**
 * @method swapChannelLogos
 */
AnimatedMiniguide.prototype.swapChannelLogos = function () {
	this._log("swapChannelLogos", "Enter");
	var tempChannelLogo = this._activeChannelLogo;
	this._activeChannelLogo = this._inactiveChannelLogo;
	this._inactiveChannelLogo = tempChannelLogo;
	this._log("swapChannelLogos", "Exit");
};

/**
 * @method swapEventGroups
 */
AnimatedMiniguide.prototype.swapEventGroups = function () {
	this._log("swapEventGroups", "Enter");
	var tempEventGroup = this._activeEventGroup;
	this._activeEventGroup = this._inactiveEventGroup;
	this._inactiveEventGroup = tempEventGroup;
	this._log("swapEventGroups", "Exit");
};

/**
 * @method doEventTransition
 * @private
 */
AnimatedMiniguide.prototype.doEventTransition = function () {
	this._log("doEventTransition", "Enter");
	this._activeEventGroup.toogleActiveGroup();
	this._inactiveEventGroup.toogleActiveGroup();
	this._log("doEventTransition", "Exit");
};

/**
 * @method setServiceName
 * @param {String} text
 */
AnimatedMiniguide.prototype.setServiceName = function (text) {
	this._log("setServiceName", "Enter");
	this._activeEventGroup.setServiceName(text);
	this._log("setServiceName", "Exit");
};

/**
 * @method setServiceNumberCssClass
 * @param {String} cssName
 */
AnimatedMiniguide.prototype.setServiceNumberCssClass = function (cssClass) {
	this._log("setServiceNumberCssClass", "Enter");
	this._activeEventGroup.setServiceNumberCssClass(cssClass);
	this._log("setServiceNumberCssClass", "Exit");
};

/**
 * @method _setServiceContainerYposition
 * @param {Number} y position
 */
AnimatedMiniguide.prototype.setServiceContainerY = function (yPosition) {
	this._log("setServiceContainerY", "Enter");
	this._activeEventGroup.setServiceContainerY(yPosition);
	this._log("setServiceContainerY", "Exit");
};

/**
 * @method setCursorCssClass
 * @param {String} cssName
 */
AnimatedMiniguide.prototype.setCursorCssClass = function (cssClass) {
	this._log("setCursorCssClass", "Enter");
	this._activeEventGroup.setCursorCssClass(cssClass);
	this._log("setCursorCssClass", "Exit");
};

/**
 * @method setServiceNumber
 * @param {Number} number
 */
AnimatedMiniguide.prototype.setServiceNumber = function (number) {
	this._log("setServiceNumber", "Enter");
	this._activeEventGroup.setServiceNumber(number);
	this._log("setServiceNumber", "Exit");
};

/**
 * @method getServiceNumber
 * @return {String} the service number label
 */
AnimatedMiniguide.prototype.getServiceNumber = function () {
	this._log("getServiceNumber", "Enter & Exit");
	return this._activeEventGroup.getServiceNumber();
};

/**
 * @method getCursor
 * @return {String} the cursor label
 */
AnimatedMiniguide.prototype.getCursor = function () {
	this._log("getCursor", "Enter & Exit");
	return this._activeEventGroup.getCursor();
};

/**
 * @method setTitle
 * @param {String} text
 */
AnimatedMiniguide.prototype.setTitle = function (text) {
	this._log("setTitle", "Enter");
	this._activeEventGroup.setTitle(text);
	this._log("setTitle", "Exit");
};

/**
 * @method isUnlockOptionShowing
 * @return {Boolean}
 */
AnimatedMiniguide.prototype.isUnlockOptionShowing = function () {
	this._log("isUnlockOptionShowing", "Enter and Exit");
	return this._activeEventGroup.isUnlockOptionShowing();
};

/**
 * @method setBtvDataMappers
 * @param {Object} serviceDataMapper
 * @param {Object} eventDataMapper
 */
AnimatedMiniguide.prototype.setBtvDataMappers = function (serviceDataMapper, eventDataMapper) {
	this._log("setBtvDataMappers", "Enter");
	this._activeEventGroup.setDataMapper(eventDataMapper);
	this._inactiveEventGroup.setDataMapper(eventDataMapper);
	this._activeChannelLogo.setDataMapper(serviceDataMapper);
	this._inactiveChannelLogo.setDataMapper(serviceDataMapper);
	this._log("setBtvDataMappers", "Exit");
};

/**
 * @method updateService
 * @param {Object} service
 * @param {Boolean} isDisplayedEventPlaying
 */
AnimatedMiniguide.prototype.updateService = function (service) {
	this._log("updateService", "Enter");
	if (service) {
		this._activeChannelLogo.update(service);
		this._inactiveChannelLogo.update(service);
	}
	this._log("updateService", "Exit");
};
/**
 * Load subtitle and audio state and assign 1st level functions to callbacks
 *
 * @method reloadAudioSubtitleStatus
 * @param {Object} event - event returned by $N.app.fullScreenPlayer.registerPlayerConnectedListener
 */
AnimatedMiniguide.prototype.reloadAudioSubtitleStatus = function (event) {
	this._activeEventGroup.reloadAudioSubtitleStatus(event);
};
/**
  * Triggered by keyHandler to display currently playing audio language
  * @method showCurrentAudioTrackAndToggle
  */
AnimatedMiniguide.prototype.showCurrentAudioTrackAndToggle = function () {
	this._activeEventGroup.showCurrentAudioTrackAndToggle();
};
/**
 * Triggered by keyHandler to display current subtitle state on/off
 * @method showCurrentSubtitleStateAndToggle
 */
AnimatedMiniguide.prototype.showCurrentSubtitleStateAndToggle = function () {
	this._activeEventGroup.showCurrentSubtitleStateAndToggle();
};
/**
 * Triggered by keyOkHandler() in MiniGuide.js to set this.isAudioSubtitleTogglingMode to false in MiniguideEventGroup
 * @method setAudioSubtitleTogglingMode
 */
AnimatedMiniguide.prototype.setAudioSubtitleTogglingMode = function (flag) {
	this._activeEventGroup.setAudioSubtitleTogglingMode(flag);
};
/**
 * Triggered by keyOkHandler() in MiniGuide.js to get this.isAudioSubtitleTogglingMode from MiniguideEventGroup, to handle Ok key for Audio/Subtitles
 * @method getAudioSubtitleTogglingMode
 */
AnimatedMiniguide.prototype.getAudioSubtitleTogglingMode = function () {
	return this._activeEventGroup.getAudioSubtitleTogglingMode();
};
/**
 * Triggered by keyHandler to switch audio
 * @method activateAudio
 */
AnimatedMiniguide.prototype.activateAudio = function () {
	this._activeEventGroup.activateAudio();
};
/**
 * Gets the current label text for audio
 * @method getAudioTrackText
 */
AnimatedMiniguide.prototype.getAudioTrackText = function () {
	return this._activeEventGroup.getAudioTrackText();
};
/**
 * A setter function to set the callback "resetBannerTimeout()" from Miniguide.js
 * @method setResetBannerTimeout
 */
AnimatedMiniguide.prototype.setResetBannerTimeout = function (callback) {
	this._activeEventGroup.setResetBannerTimeout(callback);
	this._inactiveEventGroup.setResetBannerTimeout(callback);
};
/**
 * A setter function to set the callback "clearBannerTimeout()" from Miniguide.js
 * @method setClearBannerTimeout
 */
AnimatedMiniguide.prototype.setClearBannerTimeout = function (callback) {
	this._activeEventGroup.setClearBannerTimeout(callback);
	this._inactiveEventGroup.setClearBannerTimeout(callback);
};
/**
 * Triggered by keyHandler to switch subtitles
 * @method activateSubtitle
 */
AnimatedMiniguide.prototype.activateSubtitle = function () {
	this._activeEventGroup.activateSubtitle();
};
/**
 * Gets the current label text for subtitle
 * @method getSubtitleText
 */
AnimatedMiniguide.prototype.getSubtitleText = function () {
	return this._activeEventGroup.getSubtitleText();
};

/**
 * To handle channel +/-, reset the text and clears the timeout when audio/subtitle is in toggling mode
 *
 * @method resetAudioSubtitle
 */
AnimatedMiniguide.prototype.resetAudioSubtitle = function () {
	this._activeEventGroup.resetAudioSubtitle();
};

/**
 * @method updateEvent
 * @param {Object} event
 * @param {Number} eventListIndex
 * @param {Boolean} isBlocked
 * @param {Boolean} isDisplayedEventPlaying
 */
AnimatedMiniguide.prototype.updateEvent = function (event, eventListIndex, isBlocked, isDisplayedEventPlaying, serviceObj) {
	this._log("updateEvent", "Enter");
	this._activeEventGroup.updateEvent(event, eventListIndex, isBlocked, isDisplayedEventPlaying, serviceObj);
	this._log("updateEvent", "Exit");
};

/**
 * @method updateIcons
 * @param {Object} event
 */
AnimatedMiniguide.prototype.updateIcons = function (event) {
	this._log("updateIcons", "Enter");
	this._activeEventGroup.updateIcons(event);
	this._log("updateIcons", "Exit");
};

/**
 * @method pinDisplayed
 */
AnimatedMiniguide.prototype.pinDisplayed = function () {
	this._log("pinDisplayed", "Enter");
	this._activeEventGroup.pinDisplayed();
	this._log("pinDisplayed", "Exit");
};

/**
 * @method getClassName
 * @return {String} the name of this class
 */
AnimatedMiniguide.prototype.getClassName = function () {
	this._log("getClassName", "Enter and Exit");
	return "AnimatedMiniguide";
};

/**
 * @method _clearItemHighlightedTimeout
 * @private
 */
AnimatedMiniguide.prototype._clearItemHighlightedTimeout = function () {
	this._log("_clearItemHighlightedTimeout", "Enter");
	if (this._itemHighlightedTimeout) {
		clearTimeout(this._itemHighlightedTimeout);
		this._itemHighlightedTimeout = null;
	}
	this._log("_clearItemHighlightedTimeout", "Exit");
};

/**
 * @method _resetItemHighlightedTimeout
 * @private
 */
AnimatedMiniguide.prototype._resetItemHighlightedTimeout = function () {
	this._log("_resetItemHighlightedTimeout", "Enter");
	var me = this;
	this._clearItemHighlightedTimeout();
	this._itemHighlightedTimeout = setTimeout(me._itemHighlightedCallback, this._itemHighlightedTimeoutMS);

	this._log("_resetItemHighlightedTimeout", "Exit");
};

/**
 * @method handleKeyUpEvent
 * @public
 */
AnimatedMiniguide.prototype.handleKeyUpEvent = function () {
	this._log("handleKeyUpEvent", "Enter");
	this._clearItemHighlightedTimeout();
	this._itemHighlightedCallback();
	this._log("handleKeyUpEvent", "Exit");
};

/**
 * @method setItemHighlightedCallback
 */
AnimatedMiniguide.prototype.setItemHighlightedCallback = function (callback) {
	this._itemHighlightedCallback = callback;
};

/**
 * @method fastVerticalScroll
 * @param {Number} direction 1 to scroll up, -1 to scroll down
 * @param {object} service
 * @param {object} event
 * @param {Number} eventListIndex
 * @param {Boolean} isBlocked
 */
AnimatedMiniguide.prototype.fastVerticalScroll = function (direction, service, event, eventListIndex, isBlocked) {
	if (service) {
		this._log("fastVerticalScroll", "Enter");
		if (!event) {
			event = $N.app.epgUtil.getEvent('current', service.serviceId);
		}
		this._activeChannelLogo.update(service);
		this._activeEventGroup.updateEventOnFastScroll(event, eventListIndex, isBlocked);
		this._resetItemHighlightedTimeout();
		this._log("fastVerticalScroll", "Exit");
	}
};

/**
 * @method animatedVerticalScroll
 * @param {Number} direction 1 to scroll up, -1 to scroll down
 * @param {object} service
 * @param {object} event
 * @param {Number} eventListIndex
 * @param {Boolean} isBlocked
 * @param {Boolean} isDisplayedEventPlaying
 */
AnimatedMiniguide.prototype.animatedVerticalScroll = function (direction, service, event, eventListIndex, isBlocked, isDisplayedEventPlaying) {
	if (service) {
		this._log("animatedVerticalScroll", "Enter");
		if (!event) {
			event = $N.app.epgUtil.getEvent('current', service.serviceId);
		}
		this._inactiveChannelLogo.update(service);
		this._inactiveEventGroup.updateEvent(event, eventListIndex, isBlocked, isDisplayedEventPlaying);
		if (direction === 1) {
			this._activeChannelLogo.getRootElement().style.webkitAnimationName = "activeServiceScrollUp";
			this._inactiveChannelLogo.getRootElement().style.webkitAnimationName = "inactiveServiceScrollUp";
		} else {
			this._activeChannelLogo.getRootElement().style.webkitAnimationName = "activeServiceScrollDown";
			this._inactiveChannelLogo.getRootElement().style.webkitAnimationName = "inactiveServiceScrollDown";
		}

		this._inactiveEventGroup.moveTitle("");
		this._activeEventGroup.moveTitle("");
		this.doEventTransition();

		this.swapChannelLogos();
		this.swapEventGroups();
		this._log("animatedVerticalScroll", "Exit");
	}
};

/**
 * @method fastRightScroll
 * @param {Object} event
 * @param {Boolean} isBlocked
 */
AnimatedMiniguide.prototype.fastRightScroll = function (event, isBlocked, eventListIndex) {
	this._log("fastRightScroll", "Enter");
	this._resetItemHighlightedTimeout();
	this._activeEventGroup.updateEventOnFastScroll(event, eventListIndex, isBlocked);
	this._log("fastRightScroll", "Exit");
};

/**
 * @method fastLeftScroll
 * @param {Object} event
 * @param {Boolean} isBlocked
 * @param {Number} eventListIndex
 */
AnimatedMiniguide.prototype.fastLeftScroll = function (event, isBlocked, eventListIndex) {
	this._log("fastLeftScroll", "Enter");
	this._resetItemHighlightedTimeout();
	this._activeEventGroup.updateEventOnFastScroll(event, eventListIndex, isBlocked);
	this._log("fastLeftScroll", "Exit");
};

/**
 * @method animatedRightScroll
 * @param {Object} event
 * @param {Boolean} isBlocked
 * @param {Number} eventListIndex
 * @param {Boolean} isDisplayedEventPlaying
 */
AnimatedMiniguide.prototype.animatedRightScroll = function (event, isBlocked, eventListIndex, isDisplayedEventPlaying) {
	this._log("animatedRightScroll", "Enter");
	this._inactiveEventGroup.updateEvent(event, eventListIndex, isBlocked, isDisplayedEventPlaying);
	this._activeEventGroup.moveTitle("activeEventScrollRight");
	this._inactiveEventGroup.moveTitle("inactiveEventScrollRight");
	this.doEventTransition();
	this.swapEventGroups();
	this._log("animatedRightScroll", "Exit");
};

/**
 * @method animatedLeftScroll
 * @param {Object} event
 * @param {Boolean} isBlocked
 * @param {Number} eventListIndex
 * @param {Boolean} isDisplayedEventPlaying
 */
AnimatedMiniguide.prototype.animatedLeftScroll = function (event, isBlocked, eventListIndex, isDisplayedEventPlaying) {
	this._log("animatedLeftScroll", "Enter");
	this._inactiveEventGroup.updateEvent(event, eventListIndex, isBlocked, isDisplayedEventPlaying);
	this._activeEventGroup.moveTitle("activeEventScrollLeft");
	this._inactiveEventGroup.moveTitle("inactiveEventScrollLeft");
	this.doEventTransition();
	this.swapEventGroups();
	this._log("animatedLeftScroll", "Exit");
};

/**
 * Defaults to animatedVerticalScroll, but is switched for fastVerticalScroll to handle fast scrolling
 * @method handleVerticalScroll
 */
AnimatedMiniguide.prototype.handleVerticalScroll = AnimatedMiniguide.prototype.animatedVerticalScroll;

/**
 * Defaults to animatedRightScroll, but is switched for fastRightScroll to handle fast scrolling
 * @method handleRightScroll
 */
AnimatedMiniguide.prototype.handleRightScroll = AnimatedMiniguide.prototype.animatedRightScroll;

/**
 * Defaults to animatedLeftScroll, but is switched for fastLeftScroll to handle fast scrolling
 * @method handleLeftScroll
 */
AnimatedMiniguide.prototype.handleLeftScroll = AnimatedMiniguide.prototype.animatedLeftScroll;

/**
 * @method setToFastScroll
 */
AnimatedMiniguide.prototype.setToFastScroll = function () {
	this.handleVerticalScroll = this.fastVerticalScroll;
	this.handleLeftScroll = this.fastLeftScroll;
	this.handleRightScroll = this.fastRightScroll;
};

/**
 * @method setToAnimatedScroll
 */
AnimatedMiniguide.prototype.setToAnimatedScroll = function () {
	this.handleVerticalScroll = this.animatedVerticalScroll;
	this.handleLeftScroll = this.animatedLeftScroll;
	this.handleRightScroll = this.animatedRightScroll;
};

/**
 * @method showLeftBrowseArrow
 */
AnimatedMiniguide.prototype.showLeftBrowseArrow = function () {
	this._log("showLeftBrowseArrow", "Enter");
	this._activeEventGroup.showLeftBrowseArrow();
	this._log("showLeftBrowseArrow", "Exit");
};

/**
 * @method hideLeftBrowseArrow
 */
AnimatedMiniguide.prototype.hideLeftBrowseArrow = function () {
	this._log("hideLeftBrowseArrow", "Enter");
	this._activeEventGroup.hideLeftBrowseArrow();
	this._log("hideLeftBrowseArrow", "Exit");
};

/**
 * @method showRightBrowseArrow
 */
AnimatedMiniguide.prototype.showRightBrowseArrow = function () {
	this._log("showRightBrowseArrow", "Enter");
	this._activeEventGroup.showRightBrowseArrow();
	this._log("showRightBrowseArrow", "Exit");
};

/**
 * @method hideRightBrowseArrow
 */
AnimatedMiniguide.prototype.hideRightBrowseArrow = function () {
	this._log("hideRightBrowseArrow", "Enter");
	this._activeEventGroup.hideRightBrowseArrow();
	this._log("hideRightBrowseArrow", "Exit");
};

/**
 * @method updateProgress
 * @param {Object} progressData
 */
AnimatedMiniguide.prototype.updateProgress = function (progressData) {
	this._log("updateProgress", "Enter");
	this._activeEventGroup.updateProgress(progressData);
	this._log("updateProgress", "Exit");
};

/**
 * @method hideFavouriteStatus
 */
AnimatedMiniguide.prototype.hideFavouriteStatus = function () {
	this._log("hideFavouriteStatus", "Enter");
	this._activeEventGroup.hideFavouriteStatus();
	this._log("hideFavouriteStatus", "Exit");
};

/**
 * @method isBannerActive
 * @return {Boolean}
 */
AnimatedMiniguide.prototype.isBannerActive = function () {
	this._log("isBannerActive", "Enter & Exit");
	return this._bannerActive;
};

/**
 * @method setBannerActive
 * @param {Boolean} active
 */
AnimatedMiniguide.prototype.setBannerActive = function (active) {
	this._log("setBannerActive", "Enter");
	this._bannerActive = active;

	if (!this._bannerActive) {
		this._activeChannelLogo.getRootElement().style.webkitAnimationName = "";
		this._inactiveChannelLogo.getRootElement().style.webkitAnimationName = "";
		this._inactiveEventGroup.moveTitle("");
		this._activeEventGroup.moveTitle("");
	}

	this._log("setBannerActive", "Exit");
};
