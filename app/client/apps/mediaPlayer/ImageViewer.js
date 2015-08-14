/**
 * This class enables the user to view images
 * On Browse mode animation will happen on key press
 * Pressing the keys will call the methods to show previous/next images in animation
 * On slideshow mode method to show next image will be called in an interval
 * @class ImageViewer
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 * @extends $N.gui.GUIObject
 * @author Kiran
 */
var $N = window.parent.$N;

function ImageViewer(docRef, parent) {
	$N.apps.core.Language.adornWithGetString(ImageViewer, "apps/mediaPlayer/common/");
	ImageViewer.superConstructor.call(this, docRef);
	this._log = new $N.apps.core.Log("MediaPlayer", "ImageViewer");

	this._bannerTimeout = null;
	this._slideShowType = null;
	this._transitionEffectTypes = $N.app.constants.USBDLNA_PHOTO_TRANSITION_EFFECTS_AVAILABLE;
	this._container = new $N.gui.Container(docRef);
	this._clockDisplay = $N.app.ClockDisplay;
	this.MAX_WIDTH = 1920;
	this.MAX_HEIGHT = 1080;
	this._defaultAnimationOffset = 1000;//duration of animation - 1s -> 1000ms
	this._isExit = false;
	this._arrowTimeout = null;

	this._container.configure({
		width: this.MAX_WIDTH,
		height: this.MAX_HEIGHT,
		cssStyle: "fill: #000000",
		cssClass: "imageContainer slider"
	});

	this._cannotLoadMessage = new $N.gui.Label(this._docRef, this._container);
	this._cannotLoadMessage.configure({
		x: 450,
		y: 550,
		width: 1080,
		height: 400,
		visible: false,
		cssClass: "noMailText"
	});

	this._createImage = function () {
		this._photoLayer = new $N.gui.Container(docRef, this._container);
		this._photoAlternateLayer = new $N.gui.Container(docRef, this._container);
		this._photo = new $N.gui.Image(docRef, this._photoLayer);
		this._photoAlternate = new $N.gui.Image(docRef, this._photoAlternateLayer);
		this._inProgressIndicator = new $N.gui.BufferIndicator(docRef, this._container);
		this._inProgressIndicator.configure({
			x: 1820,
			y: 50,
			imageWidth: 48,
			imageHeight: 48,
			image: "../../../customise/resources/images/net/loading.png"
		});

		this._photoLayer.configure({
			width: this.MAX_WIDTH,
			height: this.MAX_HEIGHT,
			cssClass: "imageContainer photoBackgroundColor imgClass"
		});

		this._photoAlternateLayer.configure({
			width: this.MAX_WIDTH,
			height: this.MAX_HEIGHT,
			cssClass: "imageContainer photoBackgroundColor imgClass"
		});

		this._photo.configure({
			quality: 1,
			cssClass: "imageContainer imageSize",
			maxBitMapSize: $N.app.constants.MAX_IMAGE_BITMAP_SIZE
		});

		this._photoAlternate.configure({
			quality: 1,
			cssClass: "imageContainer imageSize",
			maxBitMapSize: $N.app.constants.MAX_IMAGE_BITMAP_SIZE
		});

		this._photoViewer = {
			focus: this._photo,
			outOfFocus: this._photoAlternate,
			focusLayer: this._photoLayer,
			outOfFocusLayer: this._photoAlternateLayer
		};
	};

	if ($N.app.constants.BROWSER_MODE === "html") {
		this.exitLeft = 65;
	} else {
		this.exitLeft = 85;
	}

	this._PREVIOUS_X = -1920;
	this._NEXT_X = 1920;
	this._pauseMode = false;
	this._current = null;
	this._next = null;
	this._previous = null;
	this._playMode = null;
	this._shuffleMode = false;
	this._BROWSE_MODE = "BROWSE";
	this._SLIDESHOW_MODE = "SLIDESHOW";
	this._SINGLE_IMAGE_MODE = "SINGLE";
	this._index = null;
	this._slideShowTimeout = null;
	this._totalImages = 0;
	this._startIndex = 0;
	this._rootSVGRef = this._container.getRootSVGRef();
	this.isSlideshowStarted  = false;
	this.banner = null;
	this.availableIconsForBanner = null;
	this.START_ICON_FOUCS_INDEX = 1;
	this.isCallbackSuccess = null;
	if (parent) {
		parent.addChild(this);
	}
}
$N.gui.Util.extend(ImageViewer, $N.gui.GUIObject);

/**
 * Initialises the ImageViewer
 * @method initialise
 */
ImageViewer.prototype.initialise = function () {
	var PlaybackSubscriptionId = null,
		me = this;

	this._usbMediaPlaybackListener = function (status) {
		if (me.url[0].indexOf("file://") >= 0) {
			me.activationContext.controller.setMediaDeviceDiasbledFlag(true);
			//Following condition gets executed if the event is not fired due to USB safe removal.
			if (!status.data) {
				$N.app.ContextHelper.closeContext();
			}
		}
	};
	/**
	 * @method subscribeToUsbMediaPlaybackEvent
	 * @private
	 */
	this._subscribeToUsbMediaPlaybackEvent = function () {
		PlaybackSubscriptionId = $N.app.UsbBrowserHelper.subscribeToUsbMediaPlaybackEvent(this._usbMediaPlaybackListener, this._usbMediaPlaybackListener, this);
	};
	/**
	 * @method unSubscribeToUsbMediaPlaybackEvent
	 * @private
	 */
	this._unSubscribeToUsbMediaPlaybackEvent = function () {
		if (PlaybackSubscriptionId) {
			PlaybackSubscriptionId = $N.app.UsbBrowserHelper.unSubscribeToUsbMediaPlaybackEvent(PlaybackSubscriptionId);
			PlaybackSubscriptionId = null;
		}
	};
	/**
	 * callback method that handles the dlna device lost event
	 * if the current context is mediabrowser and the device name also matches, then it exits the context.
	 * @method onDlnaDeviceLost
	 * @private
	 */
	this._onDlnaDeviceLost = function (e) {
		if (($N.app.DlnaHelper.getMediumName() === e.device.friendlyName) && (me.url[0].indexOf("http://") >= 0)) {
			//Device disabled pop up.
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_DLNA_COMMUNICATION_ERROR,
				ImageViewer.getString("dlnaErrorTitle"),
				ImageViewer.getString("dlnaPlayFailMessage")
				);
			me.activationContext.controller.setMediaDeviceDiasbledFlag(true);
			$N.app.ContextHelper.closeContext();
		}
	};
	/**
	 * event registration for DLNA device loss.
	 * @method subscribeToDlnaDeviceLostEvent
	 * @private
	 */
	this._subscribeToDlnaDeviceLostEvent = function () {
		$N.app.DlnaHelper.subscribeToDeviceLostEvent(this._onDlnaDeviceLost);
	};
	/**
	 * event unsubscription for DLNA device loss.
	 * @method unSubscribeToDlnaDeviceLostEvent
	 * @private
	 */
	this._unSubscribeToDlnaDeviceLostEvent = function () {
		$N.app.DlnaHelper.unSubscribeToDeviceLostEvent(this._onDlnaDeviceLost);
	};
};

/**
 * Swapping the current photo in display and other one using for animation
 * @method _swapViewer
 */
ImageViewer.prototype._swapViewer = function () {
	if (this._photoViewer.focus === this._photo) {
		this._photoViewer = {
			focus: this._photoAlternate,
			outOfFocus: this._photo,
			focusLayer: this._photoAlternateLayer,
			outOfFocusLayer: this._photoLayer
		};
	} else {
		this._photoViewer = {
			focus: this._photo,
			outOfFocus: this._photoAlternate,
			focusLayer: this._photoLayer,
			outOfFocusLayer: this._photoAlternateLayer
		};
	}
};


/**
 * Get the current index of data to access; if dlna mode this will be always 0, for others it will be the actual this._current value
 * @method _getCurrentIndexOfData
 */
ImageViewer.prototype._getCurrentIndexOfData = function () {
	return this._current;
};

/**
 * shows loading indicator
 * @method _showLoadingIndicator
 */
ImageViewer.prototype._showLoadingIndicator = function () {
	this._inProgressIndicator.show();
};

/**
 * Called when the ImageViewer class is activated
 * @param {Object} activationContext
 * @param {view} banner
 */
ImageViewer.prototype.activate = function (activationContext, banner) {
	var me = this,
		dataIndex,
		selectedIndex = activationContext.selectedItemIndex,
		playListLength = activationContext.playList.length,
		i;
	this.url = null;
	this.banner = banner;
	this._slideShowType = $N.platform.system.Preferences.get($N.app.constants.PREF_USBDLNA_PHOTO_TRANSITION_EFFECTS);
	this._subscribeToUsbMediaPlaybackEvent();
	this._subscribeToDlnaDeviceLostEvent();
	$N.app.AudioManager.mute();
	$N.app.fullScreenPlayer.tuner.hideVideo();
	this._actualUrls = [];
	this._formatedUrls = [];
	this.activationContext = activationContext;
	for (i = 0; i < playListLength; i++) {
		this._actualUrls[i] = activationContext.playList[i];
		this._formatedUrls[i] = (activationContext.playList[i].split("?"))[0];
	}
	this._shuffledUrls = $N.app.ArrayUtil.arrayShuffle(this._actualUrls);
	this._shuffleMode = false;
	this._playMode = this._SINGLE_IMAGE_MODE;
	this._totalImages = this._actualUrls.length;
	this._setIndexes(selectedIndex);

	this.availableIconsForBanner = $N.app.constants.TRICKPLAY_ICONS_FOR_PHOTO_AUDIO_VIDEO_PLAYBACK;
	this.iconsList = [];
	if (this._totalImages > 1) {
		this._playMode = this._BROWSE_MODE;
		this.START_ICON_FOUCS_INDEX = 1;
		this.iconsList = [this.availableIconsForBanner.SLIDESHOW, this.availableIconsForBanner.BACK];
	} else {
		this.START_ICON_FOUCS_INDEX = 0;
		this.iconsList = [this.availableIconsForBanner.BACK];
	}
	this.banner.setIconsForBanner(this.iconsList);
	this.banner.setCurrentAndTotalTracks(String(selectedIndex + 1), String(this._totalImages));
	this.banner.setFolderName(activationContext.folderName);

	this._createImageAndsetAnimationType();
	this._showImageAtIndexWithoutAnimation(selectedIndex);
	this.show();
	this.banner.bringToFront();
	if (activationContext.startSlideShow) {
		this._startSlideshow();
	} else {
		this._showBanner();
	}
	this.banner.selectIconAtIndex(this.START_ICON_FOUCS_INDEX);
};

/**
 * Passivation method to reset this class
 * @method passivate
 */
ImageViewer.prototype.passivate = function () {
	this._log("passivate", "Enter");
	this._actualUrls = [];
	this._shuffledUrls = [];
	this._photoViewer.focus.setHref("");
	this._photoViewer.focus.setLoadSuccessful(function () {});
	this._photoViewer.outOfFocus.setHref("");
	this._photoViewer.outOfFocus.setLoadSuccessful(function () {});
	this._photoLayer.destroy();
	this._photoAlternateLayer.destroy();
	this._photo.destroy();
	this._photoAlternate.destroy();
	this._photoViewer.outOfFocus.destroy();
	this._photoViewer.focus.destroy();
	this._playMode = this._BROWSE_MODE;
	if (this.isSlideshowStarted) {
		this._clearSlideshowTimer();
	}
	this.banner.deFocusSelectedIcon();
	this.banner.hide();
	this.hide();
	$N.app.ClockDisplay.hide();
	$N.app.AudioManager.unmute();
	this._unSubscribeToUsbMediaPlaybackEvent();
	this._unSubscribeToDlnaDeviceLostEvent();
	$N.app.fullScreenPlayer.tuner.showVideo();
	$N.app.TracksUtil.showSubtitles();
	this._log("passivate", "Exit");
};

/**
 * focus is called from Media player
 * @method focus
 */
ImageViewer.prototype.focus = function () {
	this._log("focus", "Enter");
	this._isExit = false;
	this._showBanner();
	$N.app.ClockDisplay.hide();
	this._log("focus", "Exit");
};

/**
 * defocus is called from Media player
 * @method defocus
 */
ImageViewer.prototype.defocus = function () {
	this._log("defocus", "Enter");
	if (!this._isExit) {
		$N.app.fullScreenPlayer.tuner.hideVideo();
		$N.app.TracksUtil.hideSubtitles();
	}
	this._log("defocus", "Exit");
};

ImageViewer.prototype._configureAnimation = function (animationObj, primary) {
	var me = this;

	if (primary) {
		animationObj.setId("photoLayerAni");
		animationObj.setAnimationEndCallback(function () { me._waitForNextTransition(); });
	} else {
		animationObj.setId("photoLayerAltAni");
	}
};

ImageViewer.prototype._setupTransition = function (fromAniObj, toAniObj) {
	/* Need to remove this method as a part of HTML migration*/
	//fromAniObj.linked = false;
	//toAniObj.linked = true;
	// fromAniObj.setBegin("indefinite");
	// toAniObj.setBegin(fromAniObj.getId() + ".begin");
};

ImageViewer.prototype._createImageAndsetAnimationType = function () {
	switch (this._slideShowType) {
	case this._transitionEffectTypes.SLIDE:
	case this._transitionEffectTypes.FADE:
	case this._transitionEffectTypes.CROSS_FADE:
		this._createImage();
		break;
	case this._transitionEffectTypes.ZOOM_FADE:
		this._createImage();
		this._photoLayer.removeCssClass("imgClass");
		this._photoAlternateLayer.removeCssClass("imgClass");
		this._photoLayer.removeCssClass("imageContainer");
		this._photoAlternateLayer.removeCssClass("imageContainer");
		this._photoLayer.addCssClass("zoomImageContainer");
		this._photoAlternateLayer.addCssClass("zoomImageContainer");
		this._photo.removeCssClass("imageContainer");
		this._photoAlternate.removeCssClass("imageContainer");
		this._photo.addCssClass("zoom-imgClass");
		this._photoAlternate.addCssClass("zoom-imgClass");
		break;
	case this._transitionEffectTypes.NONE:
		this._createImage();
		this._photoAlternateLayer.setCssClass("imageContainer");
		this._photoLayer.setCssClass("imageContainer");
		break;
	default:
		break;
	}
};
/**
 * Sets the indexes for the current, previous and next positions
 * in the url array
 * @method _setIndexes
 * @param {Object} currentIndex
 */
ImageViewer.prototype._setIndexes = function (currentIndex) {
	this._current = currentIndex;
	this._next = currentIndex + 1;
	this._previous = currentIndex - 1;
	if (this._next > this._totalImages - 1) {
		this._next = 0;
	}
	if (this._previous < 0) {
		this._previous = this._totalImages - 1;
	}
};

/**
 * function to handle different types of slideshow based on user selection
 * @method _changeSlideShowEffects
 * @private
 * @param {boolean, number}
 * if isAnimateNext true show next image else show previous image,
 * index of either previous or next index of item array depending upon from where
 * this function is called, if called from _animateToNext index= nextIndex
 * else if called from _animateToPrevious = previousIndex
 */
ImageViewer.prototype._changeSlideShowEffects = function (isAnimateNext, index, fileSize) {
	var me = this,
		photoLayer = me._photoViewer.focusLayer,
		photoAlternateLayer = me._photoViewer.outOfFocusLayer,
		fadeCallback = function () {},
		fadeCallbackSetOpacity = function () {},
		animationEndCallback = function () { me._waitForNextTransition(); },
		slideTransitionEnd = function () {
			photoAlternateLayer._innerElement.removeEventListener("webkitTransitionEnd", slideTransitionEnd, true);
			photoLayer._innerElement.style.visibility = "hidden";
			me._swapViewer();
			photoLayer._innerElement.style.webkitTransitionDuration = "0s";
			if (isAnimateNext) {
				photoLayer._innerElement.style.webkitTransform = "translate3d(50%,-50%,0px)";
				me.imageLayerObject = photoLayer;
			} else {
				photoLayer._innerElement.style.webkitTransform = "translate3d(-150%,-50%,0px)";
				me.imageLayerObject = photoLayer;
			}
			animationEndCallback();
			me.isCallbackSuccess = true;
		},
		crossFadeTransitionEnd = function () {
			photoAlternateLayer._innerElement.removeEventListener("webkitTransitionEnd", crossFadeTransitionEnd, true);
			me._swapViewer();
			animationEndCallback();
			me.isCallbackSuccess = true;
		},
		fadeInTransitionEnd = function () {
			photoAlternateLayer._innerElement.removeEventListener("webkitTransitionEnd", fadeInTransitionEnd, true);
			animationEndCallback();
			me.isCallbackSuccess = true;
		},
		fadeOutTransitionEnd = function () {
			photoLayer._innerElement.removeEventListener("webkitTransitionEnd", fadeOutTransitionEnd, true);
			me._swapViewer();
			photoAlternateLayer._innerElement.addEventListener("webkitTransitionEnd", fadeInTransitionEnd, true);
			photoAlternateLayer._innerElement.style.opacity = null;
		},
		zoomOutTransitionEnd = function () {
			photoLayer._innerElement.removeEventListener("webkitTransitionEnd", zoomOutTransitionEnd, true);
			photoAlternateLayer.show();
			photoAlternateLayer.removeCssClass("zoom-transition");
			photoLayer._innerElement.style["z-index"] = null;
			photoAlternateLayer._innerElement.style["z-index"] = "1";
			me._swapViewer();
			me.isCallbackSuccess = true;
			animationEndCallback();
		};
	this.isCallbackSuccess = false;
	this._inProgressIndicator.hide();
	switch (me._slideShowType) {
	case me._transitionEffectTypes.SLIDE:
		photoAlternateLayer._innerElement.addEventListener("webkitTransitionEnd", slideTransitionEnd, true);
		photoAlternateLayer._innerElement.style.visibility = null;
		photoAlternateLayer._innerElement.style.webkitTransitionDuration = "2s";
		if (isAnimateNext) {
			photoLayer._innerElement.style.webkitTransform = "translate3d(-150%,-50%,0px)";
		} else {
			photoLayer._innerElement.style.webkitTransform = "translate3d(150%,-50%,0px)";
		}
		photoAlternateLayer._innerElement.style.webkitTransform = null;
		break;
	case me._transitionEffectTypes.FADE:
		if (!fileSize) {
			this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransitionDuration = "3s";
			this._photoViewer.focusLayer._innerElement.style.webkitTransitionDuration = "3s";
		}
		if (fileSize > (1024 * 1024) && fileSize < (2 * 1024 * 1024)) {
			this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransitionDuration = "2s";
			this._photoViewer.focusLayer._innerElement.style.webkitTransitionDuration = "2s";
		} else if (fileSize > (2 * 1024 * 1024) && fileSize < (2.5 * 1024 * 1024)) {
			this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransitionDuration = "3.5s";
			this._photoViewer.focusLayer._innerElement.style.webkitTransitionDuration = "3.5s";
		} else if (fileSize > (2.5 * 1024 * 1024) && fileSize < (3 * 1024 * 1024)) {
			this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransitionDuration = "4s";
			this._photoViewer.focusLayer._innerElement.style.webkitTransitionDuration = "4s";
		} else if (fileSize > (3 * 1024 * 1024)) {
			this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransitionDuration = "5s";
			this._photoViewer.focusLayer._innerElement.style.webkitTransitionDuration = "5s";
		} else {
			this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransitionDuration = "1s";
			this._photoViewer.focusLayer._innerElement.style.webkitTransitionDuration = "1s";
		}
		photoLayer._innerElement.addEventListener("webkitTransitionEnd", fadeOutTransitionEnd, true);
		setTimeout(function () {
			photoLayer._innerElement.style.opacity = 0;
		}, 500);
		break;
	case me._transitionEffectTypes.CROSS_FADE:
		if (!fileSize) {
			this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransitionDuration = "3s";
			this._photoViewer.focusLayer._innerElement.style.webkitTransitionDuration = "3s";
		}
		if (fileSize > (1024 * 1024) && fileSize < (2 * 1024 * 1024)) {
			this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransitionDuration = "2.5s";
			this._photoViewer.focusLayer._innerElement.style.webkitTransitionDuration = "2.5s";
		} else if (fileSize > (2 * 1024 * 1024) && fileSize < (2.5 * 1024 * 1024)) {
			this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransitionDuration = "3.5s";
			this._photoViewer.focusLayer._innerElement.style.webkitTransitionDuration = "3.5s";
		} else if (fileSize > (2.5 * 1024 * 1024) && fileSize < (3 * 1024 * 1024)) {
			this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransitionDuration = "4.5s";
			this._photoViewer.focusLayer._innerElement.style.webkitTransitionDuration = "4.5s";
		} else if (fileSize > (3 * 1024 * 1024)) {
			this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransitionDuration = "5s";
			this._photoViewer.focusLayer._innerElement.style.webkitTransitionDuration = "5s";
		} else {
			this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransitionDuration = "1.5s";
			this._photoViewer.focusLayer._innerElement.style.webkitTransitionDuration = "1.5s";
		}
		photoAlternateLayer._innerElement.addEventListener("webkitTransitionEnd", null, true);
		photoLayer._innerElement.style.opacity = 0;
		setTimeout(function () {
			photoAlternateLayer._innerElement.style.opacity = null;
			me._swapViewer();
			me.isCallbackSuccess = true;
			animationEndCallback();
		}, 500);
		break;
	case me._transitionEffectTypes.ZOOM_FADE:
		photoAlternateLayer.hide();
		photoLayer._innerElement.addEventListener("webkitTransitionEnd", zoomOutTransitionEnd, true);
		photoLayer.removeCssClass("zoom-transition");
		photoLayer.addCssClass("zoom-transition");
		break;
	case me._transitionEffectTypes.NONE:
		photoLayer.hide();
		photoAlternateLayer.show();
		me._swapViewer();
		me.isCallbackSuccess = true;
		me._waitForNextTransition();
		break;
	default:
		break;
	}
	me.banner.updateCurrentTrack(index + 1);
};

/**
 * exit photo player to media Browser
 * @method _exitPlayer
 */
ImageViewer.prototype._exitPlayer = function () {
	this._log("exitPlayer", "Enter");

	var me = this;
	if (me.isSlideshowStarted) {
		me._clearSlideshowTimer();
	}
	$N.app.ContextHelper.closeContext();
	this._log("exitPlayer", "Exit");

};

/**
 * exit photo player to media Browser
 * @method _exitPlayer
 */
ImageViewer.prototype.showCannotLoadImage = function () {
	this._log("exitPlayer", "Enter");

	var me = this;
	me._cannotLoadMessage.setText(ImageViewer.getString("playerImageErrorMessage"));
	me._cannotLoadMessage.show();
	this._log("exitPlayer", "Exit");

};

/**
 * exit photo player to media Browser
 * @method _exitPlayer
 */
ImageViewer.prototype.setImageName = function (fileName) {
	this._log("exitPlayer", "Enter");
	this.banner.setImageName(fileName);
	this._log("exitPlayer", "Exit");

};

ImageViewer.prototype._transitionEffects = function () {
	var me = this,
		photoLayer = me._photoViewer.focusLayer,
		photoAlternateLayer = me._photoViewer.outOfFocusLayer;

	switch (me._slideShowType) {
	case me._transitionEffectTypes.SLIDE:
		this._photoViewer.focusLayer._innerElement.style.webkitTransform = null;
		this._photoViewer.outOfFocusLayer._innerElement.style.visibility = "hidden";
		this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransform = "translate3d(50%,-50%,0px)";
		this._photoViewer.focusLayer._innerElement.style.webkitTransitionDuration = "2s";
		this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransitionDuration = "2s";
		break;
	case me._transitionEffectTypes.FADE:
	case me._transitionEffectTypes.CROSS_FADE:
		this._photoViewer.focusLayer._innerElement.style.opacity = null;
		this._photoViewer.outOfFocusLayer._innerElement.style.opacity = 0;
		this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransitionDuration = "2s";
		this._photoViewer.focusLayer._innerElement.style.webkitTransitionDuration = "2s";
		break;
	case me._transitionEffectTypes.ZOOM_FADE:
		this._photoViewer.focusLayer._innerElement.style.zIndex = 1;
		this._photoViewer.outOfFocusLayer._innerElement.style.zIndex = 0;
		break;
	case me._transitionEffectTypes.NONE:
		break;
	default:
		break;
	}
};
/**
 * Show the image file in the current index without animation
 * @method _showImageAtIndexWithoutAnimation
 * @private
 */
ImageViewer.prototype._showImageAtIndexWithoutAnimation = function (index) {
	var me = this,
		urlWithMetatdata;
	this.url = (this._shuffleMode) ? this._shuffledUrls[index] : this._actualUrls[index];
	urlWithMetatdata = this.activationContext.controller.getMetaDataForUrl(this.url);
	this.setImageName(urlWithMetatdata.itemDetails[0].fileName);
	//Below function is no more required to render the image in center. This is done in CSS3
	/*if (urlWithMetatdata.itemDetails[0]) {
		this._setActualImageWidthHeight(urlWithMetatdata.itemDetails[0].width, urlWithMetatdata.itemDetails[0].height);
	}*/
	this.url = this.url.split("?");
	this._cannotLoadMessage.hide();
	this._photoViewer.focus.setLoadSuccessful(function () {
		me._inProgressIndicator.hide();
		me._cannotLoadMessage.hide();
	});
	this._photoViewer.focus.setLoadFailedCallback(function () {
		me.showCannotLoadImage();
	});
	this._photoViewer.focus.setHref(this.url[0]);
	this._transitionEffects();
	this.isCallbackSuccess = true;
	this._setIndexes(index);
};

/**
 * Show the image file in the current index
 * @method _showImageAtIndex
 * @private
 */
ImageViewer.prototype._showImageAtIndex = function (index) {
	var me = this,
		currentTrackIndex,
		trackIndex,
		urlWithMetatdata;
	this._showLoadingIndicator();
	if (this._shuffleMode) {
		this.url = this._shuffledUrls[index];
		this.url = this.url.split("?");
		index = this._getActualListIndex();
	} else {
		this.url = this._actualUrls[index];
		urlWithMetatdata = this.activationContext.controller.getMetaDataForUrl(this.url);
		this.url = this.url.split("?");
	}
	//Below function is no more required to render the image in center. This is done in CSS3
	/*if (urlWithMetatdata.itemDetails[0]) {
		this._setActualImageWidthHeight(urlWithMetatdata.itemDetails[0].width, urlWithMetatdata.itemDetails[0].height);
	}*/
	this._photoViewer.outOfFocus.setHref("");
	this._cannotLoadMessage.hide();
	this._photoViewer.outOfFocus.setHref(this.url[0]);
	this._photoViewer.outOfFocus.setLoadSuccessful(function () {
		me._changeSlideShowEffects(true, index);
		me._cannotLoadMessage.hide();
		me.setImageName(urlWithMetatdata.itemDetails[0].fileName);
	});
	this._photoViewer.outOfFocus.setLoadFailedCallback(function () {
		me._changeSlideShowEffects(true, index);
		me.setImageName(urlWithMetatdata.itemDetails[0].fileName);
		me.showCannotLoadImage();
	});
	this._setIndexes(index);
};
/**
 * Called when the down key is pressed and performs an animation to display the next image
 * @method animateToNext
 * @param {Number} nextIndex index of the item to be displayed next
 */
ImageViewer.prototype._animateToNext = function (nextIndex) {
	var me = this,
		currentTrackIndex,
		trackIndex,
		urlWithMetatdata;
	this._showLoadingIndicator();
	if (this._shuffleMode) {
		this.url = this._shuffledUrls[nextIndex];
		urlWithMetatdata = this.activationContext.controller.getMetaDataForUrl(this.url);
		this.url = this.url.split("?");
		trackIndex = this._getActualListIndex();
	} else {
		currentTrackIndex = this._getActualListIndex();
		nextIndex = currentTrackIndex + 1;
		if (nextIndex > this._totalImages - 1) {
			nextIndex = 0;
		}
		this.url = this._actualUrls[nextIndex];
		trackIndex = nextIndex;
		urlWithMetatdata = this.activationContext.controller.getMetaDataForUrl(this.url);
		this.url = this.url.split("?");
	}
	//Below function is no more required to render the image in center. This is done in CSS3
	/*if (urlWithMetatdata.itemDetails[0]) {
		//this._setActualImageWidthHeight(urlWithMetatdata.itemDetails[0].width, urlWithMetatdata.itemDetails[0].height);
	}*/
	this._photoViewer.outOfFocus.setHref("dummy.jpg");
	this._cannotLoadMessage.hide();
	if (this._slideShowType === this._transitionEffectTypes.SLIDE) {
		this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransform = "translate3d(50%,-50%,0px)";
	}
	this._photoViewer.outOfFocus.setLoadSuccessful(function () {
		me._changeSlideShowEffects(true, trackIndex, urlWithMetatdata.itemDetails[0].fileSize);
		me._cannotLoadMessage.hide();
		me.setImageName(urlWithMetatdata.itemDetails[0].fileName);
	});
	this._photoViewer.outOfFocus.setLoadFailedCallback(function () {
		me._changeSlideShowEffects(true, trackIndex);
		me.isCallbackSuccess = true;
		me.setImageName(urlWithMetatdata.itemDetails[0].fileName);
		me.showCannotLoadImage();
	});
	this.isCallbackSuccess = false;
	this._photoViewer.outOfFocus.setHref(this.url[0]);
	this._setIndexes(this._next);
};

/**
 * Called when the up key is pressed and performs an animation to display the previous image
 * @method animateToPrevious
 * @param {Number} previousIndex index of the item to be displayed previous
 */
ImageViewer.prototype._animateToPrevious = function (previousIndex) {
	var me = this,
		currentTrackIndex,
		trackIndex,
		urlWithMetatdata;
	this._showLoadingIndicator();
	if (this._shuffleMode) {
		this.url = this._shuffledUrls[previousIndex];
		urlWithMetatdata = this.activationContext.controller.getMetaDataForUrl(this.url);
		this.url = this.url.split("?");
		trackIndex = this._getActualListIndex();
	} else {
		currentTrackIndex = this._getActualListIndex();
		previousIndex = currentTrackIndex - 1;
		if (previousIndex < 0) {
			previousIndex = this._totalImages - 1;
		}
		this.url = this._actualUrls[previousIndex];
		trackIndex = previousIndex;
		urlWithMetatdata = this.activationContext.controller.getMetaDataForUrl(this.url);
		this.url = this.url.split("?");
	}
	//Below function is no more required to render the image in center. This is done in CSS3
	/*if (urlWithMetatdata.itemDetails[0]) {
		//this._setActualImageWidthHeight(urlWithMetatdata.itemDetails[0].width, urlWithMetatdata.itemDetails[0].height);
	}*/
	this._photoViewer.outOfFocus.setHref("dummy.jpg");
	this._cannotLoadMessage.hide();
	if (this._slideShowType === this._transitionEffectTypes.SLIDE) {
		this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransitionDuration = "0s";
		this._photoViewer.outOfFocusLayer._innerElement.style.webkitTransform = "translate3d(-150%,-50%,0px)";
	}

	this._photoViewer.outOfFocus.setLoadSuccessful(function () {
		me._changeSlideShowEffects(false, trackIndex, urlWithMetatdata.itemDetails[0].fileSize);
		me._cannotLoadMessage.hide();
		me.setImageName(urlWithMetatdata.itemDetails[0].fileName);
	});
	this._photoViewer.outOfFocus.setLoadFailedCallback(function () {
		me._changeSlideShowEffects(false, trackIndex);
		me.isCallbackSuccess = true;
		me.setImageName(urlWithMetatdata.itemDetails[0].fileName);
		me.showCannotLoadImage();
	});
	this.isCallbackSuccess = false;
	this._photoViewer.outOfFocus.setHref(this.url[0]);
	this._setIndexes(this._previous);
};

/**
 * This will set the Image container to the actual image width and height and also it sets the X and Y position of the image.
 * This will help to retain the original image size while display.
 * @method _setActualImageWidthHeight
 */
ImageViewer.prototype._setActualImageWidthHeight = function (width, height) {
	var xPos = 0,
		yPos = 0;
	if (width === null || height === null) {
		width = this.MAX_WIDTH;
		height = this.MAX_HEIGHT;
	} else if (height < this.MAX_HEIGHT && width >= this.MAX_WIDTH) {
		xPos = 0;
		yPos = (this.MAX_HEIGHT - height) / 2;
		width = this.MAX_WIDTH;
	} else if (height >= this.MAX_HEIGHT && width < this.MAX_WIDTH) {
		xPos = (this.MAX_WIDTH - width) / 2;
		yPos = 0;
		height = this.MAX_HEIGHT;
	} else if (height < this.MAX_HEIGHT && width < this.MAX_WIDTH) {
		xPos = (this.MAX_WIDTH - width) / 2;
		yPos = (this.MAX_HEIGHT - height) / 2;
	} else {
		width = this.MAX_WIDTH;
		height = this.MAX_HEIGHT;
	}
	if (this._photoViewer.focus === this._photo) {
		this._photoAlternate.setX(xPos);
		this._photoAlternate.setY(yPos);
		this._photoAlternate.setWidth(width);
		this._photoAlternate.setHeight(height);
	} else {
		this._photo.setX(xPos);
		this._photo.setY(yPos);
		this._photo.setWidth(width);
		this._photo.setHeight(height);
	}
};

/**
 * This will returns the index of url in the actual track list
 * @method _getActualListIndex
 */
ImageViewer.prototype._getActualListIndex = function () {
	this._log("_getActualListIndex", "Enter & Exit");
	return this._formatedUrls.indexOf(this.url[0]);
};

/**
 * Clears _slideShowTimeout for the ImageViewer class
 * @method _clearSlideshowTimer
 */
ImageViewer.prototype._clearSlideshowTimer = function () {
	if (this._slideShowTimeout) {
		this.isSlideshowStarted  = false;
		clearTimeout(this._slideShowTimeout);
		this.banner.toggleSlideShowIcon(false);
	}
};

/**
 * Starts the slideshow when pressing PLAY button
 * @method _startSlideshow
 */
ImageViewer.prototype._startSlideshow = function (restartSlideShow) {
	this._log("_startSlideShow", "Enter");
	var me = this;
	//Banner Play icon toggle
	this.isSlideshowStarted = true;
	this.banner.toggleSlideShowIcon(true);

	if (restartSlideShow) {
		this._showImageAtIndex(this._startIndex);
	}

	this._slideShowTimeout = setTimeout(function () {
		me._animateToNext(me._next);
	}, this._getSlideShowDuration());
	//slideshow duration is the time for which the image is properly visible for the user(can be 5s, 1s etc).
	//we should neglect the time taken for animation in this process.Hence adding the offset which is the time taken for animation (1000 ms).
	//Mainly adding because when the slideshow duration is 1s, conflict happens.
	this._log("_startSlideShow", "Exit");
};

ImageViewer.prototype._waitForNextTransition = function () {
	var me = this;

	if (this.isSlideshowStarted) {
		clearTimeout(this._slideShowTimeout);
		this._slideShowTimeout = setTimeout(function () {
			me._animateToNext(me._next);
		}, this._getSlideShowDuration());
	}
};

/**
 * Starts the shuffle when pressing PLAY button
 * @method _startSlideshow
 */
ImageViewer.prototype._toggleShuffleMode = function () {
	if (this._shuffleMode) {
		this._shuffleMode = false;
		this.banner.toggleShuffleIconAndLabel(false);
	} else {
		this._shuffleMode = true;
		this.banner.toggleShuffleIconAndLabel(true);
	}
};
/**
 * Helper method to cancel the auto hide feature of the banner
 * @method _cancelBannerHide
 * @private
 */
ImageViewer.prototype._cancelBannerHide = function () {
	this._log("_cancelBannerHide", "Enter");
	if (this._bannerTimeout) {
		window.parent.clearTimeout(this._bannerTimeout);
	}
	this._log("_cancelBannerHide", "Exit");
};
/**
 * Helper method to get the preferred slide show duration from constants.
 * @method _getSlideShowDuration
 * @private
 */
ImageViewer.prototype._getSlideShowDuration = function () {
	return (($N.platform.system.Preferences.get($N.app.constants.PREF_USBDLNA_PHOTO_DISPLAY_DURATION)) * 1000);
};
/**
 * Helper method to get the preferred Banner timeout from constants.
 * @method _getBannerTimeout
 * @private
 */
ImageViewer.prototype._getBannerTimeout = function () {
	return (($N.platform.system.Preferences.get($N.app.constants.PREF_USBDLNA_PLAYER_BANNER_TIMEOUT)) * 1000);
};
/**
 * Helper method to manage the timed display of the banner
 * @method _showBanner
 * @private
 */
ImageViewer.prototype._showBanner = function () {
	this._log("_showBanner", "Enter");
	var me = this;
	this._cancelBannerArrowHide();
	this.banner.show();
	this._cancelBannerHide();
	this._bannerTimeout = window.parent.setTimeout(function () {
		me.banner.hide();
	}, this._getBannerTimeout());
	this._log("_showBanner", "Exit");
};

/**
 * Helper method to cancel the auto hide feature of the banner
 * @method _cancelBannerHide
 * @private
 */
ImageViewer.prototype._cancelBannerArrowHide = function () {
	this._log("_cancelBannerArrowHide", "Enter");
	if (this._arrowTimeout) {
		window.parent.clearTimeout(this._arrowTimeout);
		this._arrowTimeout = null;
	}
	this._log("_cancelBannerArrowHide", "Exit");
};

ImageViewer.prototype._getBannerArrowTimeout = function () {
	this._log("_getBannerArrowTimeout", "Enter");
	return 5000;
};

/**
 * Helper method to manage the timed display of the banner
 * @method _showArrows
 * @private
 */
ImageViewer.prototype._showArrows = function () {
	this._log("_showArrows", "Enter");
	var me = this;
	this.banner.showArrows();
	this._cancelBannerArrowHide();
	this._arrowTimeout = window.parent.setTimeout(function () {
		me.banner.hide();
	}, this._getBannerArrowTimeout());
	this._log("_showArrows", "Exit");
};

/**
 * OK button click handler
 * @method okPressedHandler
 */
ImageViewer.prototype.okPressedHandler = function () {
	this._log("okPressedhandler", "Enter");
	var key,
		keys = $N.apps.core.KeyInterceptor.getKeyMap();
	if (this.banner.isVisible()) {
		switch (this.iconsList[this.banner.getSelectedIndex()]) {
		case this.availableIconsForBanner.SLIDESHOW:
			key = keys.KEY_PLAY;
			break;
		case this.availableIconsForBanner.BACK:
			key = keys.KEY_BACK;
			break;
		}
		this.keyHandler(key);
	} else {
		this.banner.show();
	}
	this._log("okPressedHandler", "Exit");
};

/**
 * Key handler for this class
 * @method keyHandler
 * @param {String} key
 * @return {Boolean} True if handled, false if not
 */
ImageViewer.prototype.keyHandler = function (key) {
	this._log("keyHandler", "Enter");
	var me = this,
		handled = false,
		keys = $N.apps.core.KeyInterceptor.getKeyMap();
	if (this._playMode === this._BROWSE_MODE) {
		switch (key) {
		case keys.KEY_OK:
			this._showBanner();
			this.okPressedHandler();
			break;
		case keys.KEY_RIGHT:
		case keys.KEY_FFW:
			if (this._totalImages > 1 && this.isCallbackSuccess) {
				if (!this.banner.isVisible() || this._arrowTimeout) {
					this._showArrows();
				} else {
					this._showBanner();
				}
				this.banner.highlightRightArrow();
				if (this.isSlideshowStarted) {
					clearTimeout(this._slideShowTimeout);
				}
				this._animateToNext(this._next);
			}
			handled = true;
			break;
		case keys.KEY_LEFT:
		case keys.KEY_REW:
			if (this._totalImages > 1 && this.isCallbackSuccess) {
				if (!this.banner.isVisible() || this._arrowTimeout) {
					this._showArrows();
				} else {
					this._showBanner();
				}
				this.banner.highlightLeftArrow();
				if (this.isSlideshowStarted) {
					clearTimeout(this._slideShowTimeout);
				}
				this._animateToPrevious(this._previous);
			}
			handled = true;
			break;
		case keys.KEY_PLAY:
		case keys.KEY_PLAY_PAUSE:
			this._showBanner();
			if (!this.isSlideshowStarted) {
				this._startSlideshow();
			} else {
				this._clearSlideshowTimer();
			}
			handled = true;
			break;
		case keys.KEY_STOP:
			this._showBanner();
			this.banner.updateFocusForIcon(this.availableIconsForBanner.STOP);
			if (this.isSlideshowStarted) {
				this._clearSlideshowTimer();
			}
			$N.app.ContextHelper.closeContext();
			handled = true;
			break;
		case keys.KEY_UP:
			if (this.banner.isVisible()) {
				this._showBanner();//update the timer
				this.banner.selectPrevious();
			} else {
				this._showBanner();
			}
			handled = true;
			break;
		case keys.KEY_DOWN:
			if (this.banner.isVisible()) {
				if (this.banner.getSelectedIndex() >= this.iconsList.length - 1) {
					this.banner.hide();
				} else {
					this._showBanner();//update the timer
					this.banner.selectNext();
				}
			}
			handled = true;
			break;
		case keys.KEY_INFO:
			this._showBanner();
			handled = true;
			break;
		case keys.KEY_BACK:
			if (this.isSlideshowStarted) {
				this._clearSlideshowTimer();
			}
			$N.app.ContextHelper.closeContext();
			handled = true;
			break;
		case keys.KEY_EXIT:
			if (this.isSlideshowStarted) {
				this._clearSlideshowTimer();
			}
			this._isExit = true;
			$N.app.ContextHelper.exitContext();
			handled = true;
			break;
		}
	} else if (this._playMode === this._SINGLE_IMAGE_MODE) {
		switch (key) {
		case keys.KEY_OK:
		case keys.KEY_BACK:
			$N.app.ContextHelper.closeContext();
			handled = true;
			break;
		case keys.KEY_EXIT:
			this._isExit = true;
			$N.app.ContextHelper.exitContext();
			handled = true;
			break;
		case keys.KEY_UP:
			this._showBanner();
			handled = true;
			break;
		case keys.KEY_DOWN:
			this.banner.hide();
			handled = true;
			break;
		}
	}
	if (!handled) {
		switch (key) {
		case keys.KEY_VOL_UP:
		case keys.KEY_VOL_DOWN:
		case keys.KEY_MUTE:
			handled = true;
			break;
		case keys.KEY_RADIO:
		case keys.KEY_MOSAIC:
		case keys.KEY_POWER:
		case keys.KEY_VOD:
		case keys.KEY_TV:
			$N.app.ContextHelper.closeContext();
			break;
		}
	}
	this._log("keyHandler", "Exit");
	return handled;
};
