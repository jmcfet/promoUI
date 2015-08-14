/**
 * ThumbnailWithAnimation shows Thumbnail image with animation 
 * @class ThumbnailWithAnimation
 * @constructor
 * @param {Object} docRef
 * @param {Object} parent
 * @extends $N.gui.GUIObject
 * @author Kiran
 */
var $N = window.parent.$N;

function ThumbnailWithAnimation(docRef, parent) {
	$N.apps.core.Language.adornWithGetString(ThumbnailWithAnimation, "apps/mediaPlayer/common/");
	ThumbnailWithAnimation.superConstructor.call(this, docRef);

	this._container = new $N.gui.Container(docRef);

	this._audioDetailGroup = new $N.gui.Container(docRef, this._container);
	this._thumbnail = new $N.gui.Image(docRef, this._audioDetailGroup);
	this._title = new $N.gui.DelayedScrollingLabel(docRef, this._audioDetailGroup);
	this._artist = new $N.gui.Label(docRef, this._audioDetailGroup);
	this._album = new $N.gui.Label(docRef, this._audioDetailGroup);

	this._clockDisplay = $N.app.ClockDisplay;
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
	this._audioDetailGroupXPosition = 0;
	this._audioDetailGroupYPosition = 0;

	this._audioDetailGroup.configure({
		x: this._audioDetailGroupXPosition,
		y: this._audioDetailGroupYPosition,
		width: this._AUDIO_DETAIL_GROUP_WIDTH,
		height: this._AUDIO_DETAIL_GROUP_HEIGHT,
		cssClass: "thumbnailAnimation startThumbnailAnimation"
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
		y: 10,
		width: 500,
		cssClass: "thumbnailTitle",
		duration: "250ms"
	});
	this._artist.configure({
		x: 320,
		y: 86,
		cssClass: "thumbnailsubtitle",
		width: 500
	});
	this._album.configure({
		x: 320,
		y: 123,
		cssClass: "thumbnailsubtitle",
		width: 500
	});

	this._X_INCREMENT = 3;
	this._Y_INCREMENT = 3;
	this._bounceAnimationTimer = null;
	this._BOUNCE_ANIMATION_INTERVAL = 10;

	if ($N.app.constants.BROWSER_MODE === "html") {
		this.exitLeft = 65;
	} else {
		this.exitLeft = 85;
	}
	this._defaultThumbnail = "";

	this._rootSVGRef = this._container.getRootSVGRef();

	if (parent) {
		parent.addChild(this);
	}
}

$N.gui.Util.extend(ThumbnailWithAnimation, $N.gui.GUIObject);

/**
 * Doing the animation - moving the details group in a particular time interval
 */

ThumbnailWithAnimation.prototype.doBounceAnimation = function () {
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
 * Called when the ThumbnailWithAnimation class is activated
 */
ThumbnailWithAnimation.prototype.activate = function (metadata) {
	var me = this;
	if (metadata) {
		this.setThumbnail(metadata.itemDetails[0].albumArtUri);
	}

	if (metadata.itemDetails[0].title) {
		this.setTitle(metadata.itemDetails[0].title);
	}

	if (metadata.itemDetails[0].artist) {
		this.setArtist(metadata.itemDetails[0].artist);
	}

	if (metadata.itemDetails[0].album) {
		this.setAlbum(ThumbnailWithAnimation.getString("album") + metadata.itemDetails[0].album);
	}

	this.show();

	if (metadata.itemDetails[0].title) {
		this._title.start();
	}
};
/**
 * Passivation method to reset this class
 * @method passivate
 */
ThumbnailWithAnimation.prototype.passivate = function () {
	clearInterval(this._bounceAnimationTimer);
	this._clockDisplay.show();
	this._title.stop();

	this.hide();
};

/**
 * clears thumbnail animation timer
 * @method clearThumbnailAnimationTimer
 */

ThumbnailWithAnimation.prototype.clearThumbnailAnimationTimer = function () {

	if (this._bounceAnimationTimer) {
		clearInterval(this._bounceAnimationTimer);
	}

};
/**
 * pause thumbnail animation
 * @method pauseThumbnailAnimation
 */

ThumbnailWithAnimation.prototype.pauseThumbnailAnimation = function () {

	this._audioDetailGroup.removeCssClass("startThumbnailAnimation");
	this._audioDetailGroup.addCssClass("pauseThumbnailAnimation");

};

/**
 * Restarts thumbnail animation
 * @method restartThumbnailAnimation
 */

ThumbnailWithAnimation.prototype.restartThumbnailAnimation = function () {

	this._audioDetailGroup.removeCssClass("pauseThumbnailAnimation");
	this._audioDetailGroup.addCssClass("startThumbnailAnimation");

};
/**
 * Set the Thumbnail image.
 * @method setThumbnail
 * @param {String} href
 */
ThumbnailWithAnimation.prototype.setThumbnail = function (href) {
	var me = this;
	if ((href === "") || !href) {
		this._setDefaultThumbnail(this._thumbnail, this._defaultThumbnail);
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
ThumbnailWithAnimation.prototype.setDefaultThumbnailUrl = function (url) {
	this._defaultThumbnail = url;
};
/**
 * Set the Default image for Thumbnail
 * @method _setDefaultThumbnail
 */
ThumbnailWithAnimation.prototype._setDefaultThumbnail = function (imageElement, url) {
	imageElement.setHref(url);
};
/**
 * Set the title.
 * @method setTitle
 * @param {String} text
 */
ThumbnailWithAnimation.prototype.setTitle = function (text) {

	this._title.setText(text + $N.app.constants.TRIPLE_SPACE_UNICODE);

};
/**
 * Sets the artist label text
 * @method setArtist
 * @param {String} text
 */
ThumbnailWithAnimation.prototype.setArtist = function (text) {
	this._artist.setText(text);
};
/**
 * Sets the album label text
 * @method setAlbum
 * @param {String} text
 */
ThumbnailWithAnimation.prototype.setAlbum = function (text) {
	this._album.setText(text);
};

/**
 * The main entry point for all updates of the banner. An object
 * updateValues is sent in where the properties match the above
 * setter methods.
 * @param {Object} updateValues
 */
ThumbnailWithAnimation.prototype.update = function (updateValues) {
	this.configure(updateValues);
};
/**
 * Returns a String representation of this class.
 * @method getClassName
 * @return {String} The name of this class.
 */
ThumbnailWithAnimation.prototype.getClassName = function () {
	return "ThumbnailWithAnimation";
};