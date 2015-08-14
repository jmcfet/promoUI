/**
 * AudioBanner is displayed when we invoke the audioPlayers
 * @class AudioBanner
 * @constructor
 * @param {Object} docRef
 * @param {Object} parent
 * @extends $N.gui.GUIObject
 * @author beschi
 */
var $N = window.parent.$N;

function AudioBanner(docRef, parent) {
	$N.apps.core.Language.adornWithGetString(AudioBanner, "apps/mediaPlayer/common/");
	AudioBanner.superConstructor.call(this, docRef);

	this._container = new $N.gui.Container(docRef);

	this._audioDetailGroup = new $N.gui.Group(docRef, this._container);
	this._thumbnail = new $N.gui.Image(docRef, this._audioDetailGroup);
	this._title = new $N.gui.Label(docRef, this._audioDetailGroup);
	this._artist = new $N.gui.Label(docRef, this._audioDetailGroup);
	this._album = new $N.gui.Label(docRef, this._audioDetailGroup);
	this._playerDuration = new $N.gui.Label(docRef, this._audioDetailGroup);
	this._shuffleIcon = new $N.gui.Image(docRef, this._audioDetailGroup);
	this._pauseIcon = new $N.gui.Image(docRef, this._audioDetailGroup);

	this._helpLayer = new $N.gui.Group(docRef, this._container);
	this._playAllHelp = new $N.gui.Label(docRef, this._helpLayer);
	this._exitHelp = new $N.gui.Label(docRef, this._helpLayer);
	this._HELP_FADEOUT_TIME = parseInt($N.platform.system.Preferences.get($N.app.constants.PREF_ZAPPING_BANNER_TIMEOUT), 10) || $N.app.constants.SURFER_DURATION_DEFAULT;
	this._clockDisplay = $N.app.ClockDisplay;
	this._helpTimer = null;

	this._MIN_WIDTH = 0;
	this._MAX_WIDTH = 1920;
	this._MIN_HEIGHT = 0;
	this._MAX_HEIGHT = 1080;
	this._container.configure({
		x: 0,
		y: 0,
		width: this._MAX_WIDTH,
		height: this._MAX_HEIGHT,
		cssStyle: "fill: #000000"
	});

	this._AUDIO_DETAIL_GROUP_WIDTH = 820;
	this._AUDIO_DETAIL_GROUP_HEIGHT = 300;
	this._audioDetailGroupXPosition = 900;
	this._audioDetailGroupYPosition = 600;
	this._audioDetailGroup.configure({
		x: this._audioDetailGroupXPosition,
		y: this._audioDetailGroupYPosition,
		width: this._AUDIO_DETAIL_GROUP_WIDTH,
		height: this._AUDIO_DETAIL_GROUP_HEIGHT
	});
	this._thumbnail.configure({
		x: 0,
		y: 0,
		width: 300,
		height: 300,
		preserveAspect : true
	});
	this._title.configure({
		x: 320,
		y: 40,
		cssClass: "title",
		width: 500
	});
	this._artist.configure({
		x: 320,
		y: 70,
		cssClass: "subtitle"
	});
	this._album.configure({
		x: 320,
		y: 110,
		cssClass: "subtitle"
	});
	this._playerDuration.configure({
		x: 320,
		y: 278,
		cssClass: "subtitle3"
	});
	this._shuffleIcon.configure({
		x: 380,
		y: 250,
		width: 40,
		height: 40,
		href: "../../../customise/resources/images/%RES/icons/Icn_shuffle.png",
		preserveAspect : true,
		visible: false
	});
	this._pauseIcon.configure({
		x: 430,
		y: 250,
		width: 40,
		height: 40,
		href: "../../../customise/resources/images/%RES/icons/Icn_Surfer_pause.png",
		preserveAspect : true,
		visible: false
	});

	this._X_INCREMENT = 3;
	this._Y_INCREMENT = 3;
	this._bounceAnimationTimer = null;
	this._BOUNCE_ANIMATION_INTERVAL = 5;

	this._helpLayer.configure({
		x: 0,
		y: 0,
		width: this._MAX_WIDTH,
		height: this._MAX_HEIGHT
	});
	this._exitHelp.configure({
        x: 1870,
        y: 85,
        width: 400,
        text: AudioBanner.getString("exitHelp"),
        cssClass: "playerHelpText smallFont"
    });
    this._playAllHelp.configure({
        x: 1870,
        y: 110,
        width: 400,
        cssClass: "playerHelpText smallFont"
    });
    this._defaultThumbnail = "";

	this._rootSVGRef = this._container.getRootSVGRef();

	if (parent) {
		parent.addChild(this);
	}
}

$N.gui.Util.extend(AudioBanner, $N.gui.GUIObject);

/**
 * Doing the animation - moving the details group in a particular time interval
 */
AudioBanner.prototype.doBounceAnimation = function () {
	this._audioDetailGroupXPosition = this._audioDetailGroupXPosition + this._X_INCREMENT;
	this._audioDetailGroupYPosition = this._audioDetailGroupYPosition + this._Y_INCREMENT;
	this._audioDetailGroup.setX(this._audioDetailGroupXPosition);
	this._audioDetailGroup.setY(this._audioDetailGroupYPosition);
	if (this._X_INCREMENT > 0) {
		if (this._audioDetailGroupXPosition + this._AUDIO_DETAIL_GROUP_WIDTH >= this._MAX_WIDTH) {
			this._X_INCREMENT = this._X_INCREMENT * -1;
		}
	} else {
		if (this._audioDetailGroupXPosition <= this._MIN_WIDTH) {
			this._X_INCREMENT = this._X_INCREMENT * -1;
		}
	}
	if (this._Y_INCREMENT > 0) {
		if (this._audioDetailGroupYPosition + this._AUDIO_DETAIL_GROUP_HEIGHT >= this._MAX_HEIGHT) {
			this._Y_INCREMENT = this._Y_INCREMENT * -1;
		}
	} else {
		if (this._audioDetailGroupYPosition <= this._MIN_HEIGHT) {
			this._Y_INCREMENT = this._Y_INCREMENT * -1;
		}
	}
};

/**
 * Called when the AudioBanner class is activated
 */
AudioBanner.prototype.activate = function (activationContext) {
	var me = this,
		confirmationDialogShownCallback = function () {
			me.hideHelpLayer();
		};
	if (activationContext) {
		this.setDefaultThumbnailUrl(activationContext.defaultThumbnailUrl);
	}
	this.showHelpLayer();
	if (this._bounceAnimationTimer) {
		clearInterval(this._bounceAnimationTimer);
		this._bounceAnimationTimer = null;
	}
	this._bounceAnimationTimer = setInterval(function () { me.doBounceAnimation(); }, me._BOUNCE_ANIMATION_INTERVAL);
	$N.app.HotPlug.setDialogShownCallback(confirmationDialogShownCallback);
	$N.app.ErrorMessage.setDialogShownCallback(confirmationDialogShownCallback);
};

/**
 * Passivation method to reset this class
 * @method passivate
 */
AudioBanner.prototype.passivate = function () {
	this.hideShuffleIcon();
	this.hideHelpLayer();
	clearInterval(this._bounceAnimationTimer);
	this._bounceAnimationTimer = null;
	this._clockDisplay.show();
	$N.app.HotPlug.setDialogShownCallback(function () {});
	$N.app.ErrorMessage.setDialogShownCallback(function () {});
};

/**
 * Set the Thumbnail image.
 * @method setThumbnail
 * @param {String} href
 */
AudioBanner.prototype.setThumbnail = function (href) {
	var me = this;
	if (href === "") {
		this._setDefaultThumbnail();
	} else {
		this._thumbnail.setLoadFailedCallback(function () {
			me._setDefaultThumbnail(me._thumbnail, me._defaultThumbnail);
		});
		this._thumbnail.setHref(href);
	}
};

/**
 * Saves the defautl thumbnail url
 * @method _defaultThumbnail
 */
AudioBanner.prototype.setDefaultThumbnailUrl = function (url) {
	this._defaultThumbnail = url;
};

/**
 * Set the Default image for Thumbnail
 * @method _setDefaultThumbnail
 */
AudioBanner.prototype._setDefaultThumbnail = function (imageElement, url) {
	imageElement.setHref(url);
};

/**
 * Set the title.
 * @method setTitle
 * @param {String} text
 */
AudioBanner.prototype.setTitle = function (text) {
	this._title.setText(text);
};

/**
 * Sets the artist label text
 * @method setArtist
 * @param {String} text
 */
AudioBanner.prototype.setArtist = function (text) {
	this._artist.setText(text);
};

/**
 * Sets the album label text
 * @method setAlbum
 * @param {String} text
 */
AudioBanner.prototype.setAlbum = function (text) {
	this._album.setText(text);
};

/**
 * Sets the playerDuration label text
 * @method setPlayerDuration
 * @param {String} text
 */
AudioBanner.prototype.setPlayerDuration = function (text) {
	this._playerDuration.setText(text);
};
/**
 * Sets the exitHelp label text
 * @method setExitHelp
 * @param {String} text
 */
AudioBanner.prototype.setExitHelp = function (text) {
	this._exitHelp.setText(text);
};

/**
 * Sets the playAllHelp label text
 * @method setPlayAllHelp
 * @param {String} text
 */
AudioBanner.prototype.setPlayAllHelp = function (text) {
	this._playAllHelp.setText(text);
};

/**
 * The main entry point for all updates of the banner. An object
 * updateValues is sent in where the properties match the above
 * setter methods.
 * @param {Object} updateValues
 */
AudioBanner.prototype.update = function (updateValues) {
	this.configure(updateValues);
};

/**
 * Shows the pause icon
 * @method showPauseIcon
 */
AudioBanner.prototype.showPauseIcon = function () {
	this._pauseIcon.show();
	if (this._bounceAnimationTimer) {
		clearInterval(this._bounceAnimationTimer);
		this._bounceAnimationTimer = null;
	}
};

/**
 * Hides the pause icon
 * @method hidePauseIcon
 */
AudioBanner.prototype.hidePauseIcon = function () {
	var me = this;
	this._pauseIcon.hide();
	if (this._bounceAnimationTimer) {
		clearInterval(this._bounceAnimationTimer);
		this._bounceAnimationTimer = null;
	}
	this._bounceAnimationTimer = setInterval(function () { me.doBounceAnimation(); }, me._BOUNCE_ANIMATION_INTERVAL);
};

/**
 * Shows the Shuffle icon
 * @method showShuffleIcon
 */
AudioBanner.prototype.showShuffleIcon = function () {
	this._shuffleIcon.show();
};

/**
 * Hides the Shuffle icon
 * @method hideShuffleIcon
 */
AudioBanner.prototype.hideShuffleIcon = function () {
	this._shuffleIcon.hide();
};

/**
 * Hides the help layer after the time interval
 * @method _hideHelpLayer
 */
AudioBanner.prototype.hideHelpLayer = function () {
	if (this._helpTimer) {
		clearTimeout(this._helpTimer);
	}
	this._clockDisplay.hide();
	this._helpLayer.hide();
};

/**
 * Displays the help layer and starts the timer to hide
 * @method _showHelpLayer
 */
AudioBanner.prototype.showHelpLayer = function () {
	var me = this;
	if (this._helpTimer) {
		clearTimeout(this._helpTimer);
	}
	this._clockDisplay.show();
	this._helpLayer.show();
	this._helpTimer = setTimeout(function () {
		me.hideHelpLayer();
	}, this._HELP_FADEOUT_TIME);
};

/**
 * Returns a String representation of this class.
 * @method getClassName
 * @return {String} The name of this class.
 */
AudioBanner.prototype.getClassName = function () {
	return "AudioBanner";
};