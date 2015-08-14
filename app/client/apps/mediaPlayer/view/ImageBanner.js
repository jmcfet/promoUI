/**
 * ImageBanner is common Banner class which can be configured to handle Photo, Audio and Video playback
 * file for view and has components for navigation to Next, Prev, Shuffle, Play, Stop, Replay and Trick keys
 * @class ImageBanner
 * @constructor
 * @extends BaseBanner
 * @param {Object} docRef
 * @param {Object} parent
 * @author Kiran
 */
var $N = window.parent.$N,
	BaseBanner = BaseBanner || {};

function ImageBanner(docRef, parent) {
	$N.apps.core.Language.adornWithGetString(ImageBanner, "apps/mediaPlayer/common/");
	ImageBanner.superConstructor.call(this, docRef);
	this._log = new $N.apps.core.Log("MediaPlayer", "ImageBanner");
	this._log("ImageBanner", "Enter");

	this.CONTAINER_WIDTH = 200;

	this.ICON_POSITION_Y = 200;
	this.SPACE_BETWEEN_ICONS = 30;
	this.PROGRESS_WIDTH = 393;
	this.playing = false;
	this.shuffleOn = false;
	this.repeatOn = false;
	this.trickKeysLabelText = null;
	this.iconUpdateTimer = null;

	this._container.configure({
		x: 0,
		y: 0,
		height: 580,
		width: 1920
	});

	this._backgroundBox.configure({
		x: 0,
		y: 0,
		height: 580,
		width: 1920,
		cssClass: "nowFullAssetUniformGradient",
		opacity: 1
	});

	this._slideshowContainer = new $N.gui.Container(docRef, this._container);
	this._slideshowIcon = new $N.gui.Image(docRef, this._slideshowContainer);
	this.SLIDESHOW_PLAY = "../../../customise/resources/images/%RES/icons/play_slideshow_icon.png";
	this.SLIDESHOW_STOP = "../../../customise/resources/images/%RES/icons/stop_slideshow_icon.png";

	this._backIconContainer = new $N.gui.Container(docRef, this._container);
	this._backIcon = new $N.gui.Image(docRef, this._backIconContainer);
	this._backIcon.iconUrl = "../../../customise/resources/images/%RES/icons/optionIcons/back_icon.png";

	this._slideshowIconLabel = new $N.gui.Label(docRef, this._slideshowContainer);
	this._backIconLabel = new $N.gui.Label(docRef, this._backIconContainer);

	this._imageInfoContainer = new $N.gui.Label(docRef, this._container);
	this._folderNameLabel = new $N.gui.InlineLabel(docRef, this._imageInfoContainer);
	this._imageNameLabel = new $N.gui.InlineLabel(docRef, this._imageInfoContainer);
	this._currentTrackLabel = new $N.gui.InlineLabel(docRef, this._imageInfoContainer);
	this._totalTracksLabel = new $N.gui.InlineLabel(docRef, this._imageInfoContainer);

	this._leftArrowHollowIcon = new $N.gui.Image(docRef, this._container);
	this._leftArrowSolidIcon = new $N.gui.Image(docRef, this._container);
	this.LEFT_ARROW_HOLLOW_ICON = "../../../customise/resources/images/%RES/icons/left_arrow_hollow.png";
	this.LEFT_ARROW_SOLID_ICON = "../../../customise/resources/images/%RES/icons/left_arrow_solid.png";

	this._rightArrowHollowIcon = new $N.gui.Image(docRef, this._container);
	this._rightArrowSolidIcon = new $N.gui.Image(docRef, this._container);
	this.RIGHT_ARROW_HOLLOW_ICON = "../../../customise/resources/images/%RES/icons/right_arrow_hollow.png";
	this.RIGHT_ARROW_SOLID_ICON = "../../../customise/resources/images/%RES/icons/right_arrow_solid.png";

	this._items = [];
	this._items = [this._slideshowContainer, this._backIconContainer];
	this._selectedItemIndex = 0;
	this._bannerTimeout = null;
	this.showOnlyArrows = false;

	this._imageInfoContainer.configure({
		x: 0,
		y: 509,
		height: 40,
		width: 1920,
		cssClass: "playerCenter"
	});

	this._slideshowContainer.configure({
		x: 850,
		y: 370,//360
		height: 48,
		width: this.CONTAINER_WIDTH,
		rounding: 2,
		cssClass: "timeShiftButton",
		visible: false
	});
	this._slideshowIcon.configure({
		x: 16.5,
		y: 6,
		height: 35,
		width: 35,
		href: this.SLIDESHOW_PLAY,
		visible: false
	});

	this._backIconContainer.configure({
		x: 850,
		y: 440,
		height: 48,
		width: this.CONTAINER_WIDTH,
		rounding: 2,
		cssClass: "timeShiftButton",
		visible: false
	});
	this._backIcon.configure({
		x: 19.5,
		y: 12,
		height: 24,
		width: 33,
		href: this._backIcon.iconUrl,
		visible: false
	});

	this._slideshowIconLabel.configure({
		x: 63,
		y: 6,
		height: 30,
		width: 150,
		cssClass: "photoPlayerIconLabelText",
		visible: false
	});

	this._backIconLabel.configure({
		x: 91.5,
		y: 6,
		height: 30,
		width: 150,
		cssClass: "photoPlayerIconLabelText",
		visible: false
	});

	this._leftArrowHollowIcon.configure({
		x: 60,
		y: 20,
		height: 30,
		width: 27,
		href: this.LEFT_ARROW_HOLLOW_ICON,
		visible: false
	});

	this._leftArrowSolidIcon.configure({
		x: 60,
		y: 20,
		height: 30,
		width: 27,
		href: this.LEFT_ARROW_SOLID_ICON,
		visible: false
	});
	this._rightArrowHollowIcon.configure({
		x: 1840,
		y: 35,
		height: 30,
		width: 27,
		href: this.RIGHT_ARROW_HOLLOW_ICON,
		visible: false
	});
	this._rightArrowSolidIcon.configure({
		x: 1840,
		y: 35,
		height: 30,
		width: 27,
		href: this.RIGHT_ARROW_SOLID_ICON,
		visible: false
	});

	this._currentTrackLabel.configure({
		cssClass: "photoPlayerLabelRightAlign",
		visible: false
	});

	this._totalTracksLabel.configure({
		cssClass: "photoPlayerLabelRightAlign",
		visible: false
	});

	this._folderNameLabel.configure({
		cssClass: "photoPlayerFolderLabel",
		visible: false
	});

	this._imageNameLabel.configure({
		cssClass: "photoPlayerImageLabel",
		visible: false
	});

	this._rootSVGRef = this._container.getRootSVGRef();

	if (parent) {
		parent.addChild(this);
	}
	this._log("ImageBanner", "Exit");
}
$N.gui.Util.extend(ImageBanner, BaseBanner);

/**
 * @method hideAllIcons
 * This method hides all the icons and labels displayed before. This needs to be done because different will have different icon requirements.
 * so. whatever the icons displayed earlier needs to be hide before configuring for the another player.
 */
ImageBanner.prototype.hideAllIcons = function () {

	this._playPauseContainer.hide();
	this._playPauseIcon.hide();
	this._ffwContainer.hide();
	this._ffwIcon.hide();
	this._rewContainer.hide();
	this._rewIcon.hide();
	this._progress.hide();

	this._slideshowContainer.hide();
	this._slideshowIcon.hide();
	this._backIconContainer.hide();
	this._backIcon.hide();
	this._currentTrackLabel.hide();
	this._totalTracksLabel.hide();
	this._imageNameLabel.hide();
	this._folderNameLabel.hide();
};

/**
 * @method hideAllIcons
 * This method hides all the icons and labels displayed before. This needs to be done because different will have different icon requirements.
 * so. whatever the icons displayed earlier needs to be hide before configuring for the another player.
 */
ImageBanner.prototype.showAllIcons = function () {

	this._slideshowContainer.show();
	this._slideshowIcon.show();
	this._backIconContainer.show();
	this._backIcon.show();
	this._currentTrackLabel.show();
	this._totalTracksLabel.show();
	this._imageNameLabel.show();
	this._folderNameLabel.show();
	this._backgroundBox.show();
};

/**
 * @method setIconsForBanner
 * This method configures the icons for the banner depending on the preferredIconsList, this method has to call before calling show().
 * One who wants to make use of banner has to pass the preferredIconsList needed for the banner and it should be in order of display.
 * @param {object} preferredIconsList,
 */
ImageBanner.prototype.setIconsForBanner = function (preferredIconsList, selectedIcons) {
	var iconsAvailable = $N.app.constants.TRICKPLAY_ICONS_FOR_PHOTO_AUDIO_VIDEO_PLAYBACK,
		i;
	this._items = [];
	this.configuredIcons = [];
	this.hideAllIcons();
	this.preferredIconsListLength = preferredIconsList.length;
	if (this.preferredIconsListLength > 1) {

		for (i = 0; i < this.preferredIconsListLength; i++) {
			switch (preferredIconsList[i]) {
			case iconsAvailable.SLIDESHOW:
				this._items.push(this._slideshowContainer);
				this.configuredIcons.push(iconsAvailable.SLIDESHOW);
				if (this.slideshowOn) {
					this._slideshowIcon.setHref(this.SLIDESHOW_STOP);
				} else {
					this._slideshowIcon.setHref(this.SLIDESHOW_PLAY);
				}
				this._slideshowIcon.show();
				this._slideshowIconLabel.setText(ImageBanner.getString("slideshow"));
				this._slideshowIconLabel.show();
				break;
			case iconsAvailable.BACK:
				this._items.push(this._backIconContainer);
				this.configuredIcons.push(iconsAvailable.BACK);
				this._backIcon.show();
				this._backIconLabel.setText(ImageBanner.getString("back"));
				this._backIconLabel.show();
				break;
			}
		}
		this.showHollowArrows();
		for (i = 0; i < this._items.length; i++) {
			this._items[i].show();
		}
	} else {
		this._items.push(this._backIconContainer);
		this.configuredIcons.push(iconsAvailable.BACK);
		this._backIcon.show();
		this._backIconLabel.setText("back");
		this._backIconLabel.show();
		this._items[0].show();
		this.hideArrows();
	}
};

/**
 * Makes the Banner visible and calls superconstructor to make GUIObject visible
 * @method show
 */
ImageBanner.prototype.show = function () {
	this._log("show", "Enter");
	this.showOnlyArrows = false;
	if (this.preferredIconsListLength > 1) {
		this.showAllIcons();
	}
	ImageBanner.superClass.show.call(this);
	this._container._innerElement.style.zIndex = 2;
	this.showTracksLabel();
	this._log("show", "Exit");
};
/**
 * Makes the Banner visible and calls superconstructor to make GUIObject visible
 * @method show
 */
ImageBanner.prototype.showArrows = function () {
	this._log("show", "Enter");
	this.showOnlyArrows = true;
	this.hideAllIcons();
	this._backgroundBox.hide();
	//this._fullInfo.hide();
	ImageBanner.superClass.show.call(this);
	this.showHollowArrows();
	this._log("show", "Exit");
};

/**
 * @method setCurrentTrackLabel
 * @param {String} text
 */
ImageBanner.prototype.setImageName = function (text) { //PUBLIC
	this._imageNameLabel.setText(" \u00A0" + text);
	if (!this.showOnlyArrows) {
		this._imageNameLabel.show();
	}
};

/**
 * @method setCurrentTrackLabel
 * @param {String} text
 */
ImageBanner.prototype.setFolderName = function (text) { //PUBLIC
	this._folderNameLabel.setText(text);
	this._folderNameLabel.show();
	this.setImageName();
};

/**
 * @method setCurrentTrackLabel
 * @param {String} text
 */
ImageBanner.prototype.clearUpdateIconTimer = function () { //private
	if (this.iconUpdateTimer) {
		clearTimeout(this.iconUpdateTimer);
		this.iconUpdateTimer = null;
	}
};

/**
 * @method setCurrentTrackLabel
 * @param {String} text
 */
ImageBanner.prototype.updateIconAfterTimeout = function (callback) { //private
	if (this.iconUpdateTimer) {
		this.clearUpdateIconTimer();
	}
	this.iconUpdateTimer = setTimeout(callback, 1000);
};

/**
 * @method setCurrentTrackLabel
 * @param {String} text
 */
ImageBanner.prototype.unHighlightLeftArrow = function () { //private
	this._leftArrowSolidIcon.hide();
	this._leftArrowHollowIcon.show();
};
/**
 * @method setCurrentTrackLabel
 * @param {String} text
 */
ImageBanner.prototype.unHighlightRightArrow = function () { //Private
	this._rightArrowSolidIcon.hide();
	this._rightArrowHollowIcon.show();
};
/**
 * @method setCurrentTrackLabel
 * @param {String} text
 */
ImageBanner.prototype.highlightRightArrow = function () { // PUBLIC
	var me = this,
		unHighlightRightArrowCallback = function () {
			me._rightArrowSolidIcon.hide();
			me._rightArrowHollowIcon.show();
		};
	this.clearUpdateIconTimer();
	this.unHighlightLeftArrow();
	this._rightArrowHollowIcon.hide();
	this._rightArrowSolidIcon.hide();
	this._rightArrowSolidIcon.show();
	this.updateIconAfterTimeout(unHighlightRightArrowCallback);
};
/**
 * @method setCurrentTrackLabel
 * @param {String} text
 */
ImageBanner.prototype.highlightLeftArrow = function () { // PUBLIC
	var me = this,
		unHighlightLeftArrowCallback = function () {
			me._leftArrowSolidIcon.hide();
			me._leftArrowHollowIcon.show();
		};
	this.clearUpdateIconTimer();
	this.unHighlightRightArrow();
	this._leftArrowHollowIcon.hide();
	this._leftArrowSolidIcon.hide();
	this._leftArrowSolidIcon.show();
	this.updateIconAfterTimeout(unHighlightLeftArrowCallback);
};

/**
 * @method setCurrentTrackLabel
 * @param {String} text
 */
ImageBanner.prototype.hideArrows = function () { // PUBLIC
	this._leftArrowSolidIcon.hide();
	this._rightArrowSolidIcon.hide();
	this._leftArrowHollowIcon.hide();
	this._rightArrowHollowIcon.hide();
};

/**
 * @method setCurrentTrackLabel
 * @param {String} text
 */
ImageBanner.prototype.showHollowArrows = function () { // PUBLIC
	this.clearUpdateIconTimer();
	this._leftArrowSolidIcon.hide();
	this._rightArrowSolidIcon.hide();
	this._leftArrowHollowIcon.show();
	this._rightArrowHollowIcon.show();
};

/**
 * @method setCurrentTrackLabel
 * @param {String} text
 */
ImageBanner.prototype.setCurrentTrackLabel = function (text) {
	this._currentTrackLabel.setText(text);
};
/**
 * @method setTotalTracksLabel
 * @param {String} text
 */
ImageBanner.prototype.setTotalTracksLabel = function (text) {
	this._totalTracksLabel.setText(text);
};

/**
 * @method showTracksLabel
 */
ImageBanner.prototype.showTracksLabel = function () {
	this._currentTrackLabel.show();
	this._totalTracksLabel.show();
};

/**
 * @method setCurrentAndTotalTracks
 * @param {number} currentTrack currently showing track(Image, video, audio) from the playlist
 * @param {number} totalTracks total number of tracks(Image, video, audio) in Playlist
 */
ImageBanner.prototype.setCurrentAndTotalTracks = function (currentTrack, totalTracks) {
	this.setCurrentTrackLabel(" \u00A0" + currentTrack);
	this.setTotalTracksLabel("\u00A0" + ImageBanner.getString("of") + " " + totalTracks);
};

/**
 * @method updateCurrentTrack
 * This updates the current track(Image, video, audio) number shown
 * @param {number} currentTrack
 */
ImageBanner.prototype.updateCurrentTrack = function (currentTrack) {
	this.setCurrentTrackLabel(" \u00A0" + currentTrack);
	if (!this.showOnlyArrows) {
		this._currentTrackLabel.show();
	}
};

/**
 * Toggles the play/pause icon
 * @method ImageBanner
 * @param {Boolean} isPlaying to indicate if the initial state is in play
 */
ImageBanner.prototype.toggleSlideShowIcon = function (isPlaying) {
	var iconHref = isPlaying ? this.SLIDESHOW_STOP : this.SLIDESHOW_PLAY;
	this.slideshowOn = isPlaying;
	this._slideshowIcon.setHref(iconHref);
};

/**
 * return the selected item index
 * @method getSelectedIndex
 * @return {Number}
 */
ImageBanner.prototype.getSelectedIndex = function () {
	return this._selectedItemIndex;
};

/**
 * return the icon index in banner
 * @method getIndexForIcon
 * @return {Number} iconNumber of the icon in constant
 */
ImageBanner.prototype.getIndexForIcon = function (iconNumber) {
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
ImageBanner.prototype.updateFocusForIcon = function (iconNumber) {
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
ImageBanner.prototype.deFocusSelectedIcon = function () {
	var item = this._items[this._selectedItemIndex];
	if (item) {
		item.setCssClass("timeShiftButton");
	}
};
/**
 * Select the button by highlighting it and unhighlight the previously selected button for the index
 * @method selectIconAtIndex
 */
ImageBanner.prototype.selectIconAtIndex = function (index) {
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
ImageBanner.prototype.select = function (index) {
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
ImageBanner.prototype.selectNext = function () {
	if (this._selectedItemIndex < this._items.length - 1) {
		this.select(this._selectedItemIndex + 1);
	}
};

/**
 * Select the previous button by highlighting it and unhighlight the previously selected button
 * @method select
 */
ImageBanner.prototype.selectPrevious = function () {
	if (this._selectedItemIndex > 0) {
		this.select(this._selectedItemIndex - 1);
	}
};

/**
 * Returns the class name as a String.
 * @method toString
 * @return {String} The class name as a String.
 */
ImageBanner.prototype.toString = function () {
	return "ImageBanner";
};
