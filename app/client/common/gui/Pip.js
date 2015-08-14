/**
 * This class displays pip video or blocked/unsubscribed message if needed
 *
 * @class $N.gui.Pip
 * @constructor
 * @extends $N.gui.GUIObject
 *
 * @requires $N.apps.core.Language
 * @requires $N.app.constants
 * @requires $N.apps.core.Log
 * @requires $N.gui.Group
 * @requires $N.gui.Image
 * @requires $N.gui.TextArea
 * @requires $N.gui.Util
 *
 * @param {Object} docRef Document relating the DOM
 * @param {Object} [parent]
 */
(function ($N) {
	function Pip(docRef, parent) {
		Pip.superConstructor.call(this, docRef);
		$N.apps.core.Language.adornWithGetString(Pip);
		this._log = new $N.apps.core.Log("CommonGUI", "Pip");

		this._isPIPEnabled = true;

		this._contentStartFailed = $N.app.constants.CA_PLAY_ERRORS.contentStartFailedReason;
		this._contentError = $N.app.constants.CA_PLAY_ERRORS.contentErrorReason;
		this._streamDisabled = $N.app.constants.CA_PLAY_ERRORS.streamDisabledReason;

		this._container = new $N.gui.Group(docRef);

		this._eventImageContainer = new $N.gui.Container(docRef, this._container);
		this._eventImage = new $N.gui.Image(docRef, this._eventImageContainer);
		this._blockedText = new $N.gui.TextArea(docRef, this._eventImageContainer);
		this._imageServer = $N.app.epgUtil.getPosterImageServer();

		this._videoUnavailableContainer = new $N.gui.Container(docRef, this._container);
		this._videoUnavailableText = new $N.gui.TextArea(docRef, this._videoUnavailableContainer);

		this._focusedChannel = null;
		this._focusedEvent = null;

		this._callbackId = null;
		this._isImageLoadSuccessful = null;

		this._TEXT_X_OFFSET = 30;
		this._TEXT_Y_OFFSET = 50;

		this._PLAYING_TIMEOUT = 1000;
		this._validVideoSize = false;
		this._videoDetails = null;

		this._VIDEO_TEXT_Y_OFFSET = 130;
		this._videoUnavailableTimeout = null;
		this._VIDEO_UNAVAILABLE_TIMEOUT = 500;
		this._IMAGE_POSTER_Y_POS = -700;
		this._PIP_POSITION = null;
		this._PIP_POSITIONS = {
			LARGE_TOP_RIGHT: 1,
			SMALL_TOP_RIGHT: 2,
			LARGE_TOP_LEFT: 3,
			SMALL_TOP_LEFT: 4
		};

		this._eventImageContainer.configure({
			x: 1419,
			y: 43.5,
			width: 337.5,
			height: 193.5,
			cssClass: "eventImageContainer",
			visible: false
		});
		this._eventImage.configure({
			x: 0,
			y: 0,
			width: 333.5,
			height: 189.5,
			preserveAspect: false,
			quality: 1,
			visible: false
		});
		this._blockedText.configure({
			visible: false
		});

		this._videoUnavailableContainer.configure({
			x: 1419,
			y: 43.5,
			width: 337.5,
			height: 193.5,
			cssClass: "videoUnavailabBackground",
			visible: false
		});

		this._videoUnavailableText.configure({
			x: this._TEXT_X_OFFSET,
			y: this._VIDEO_TEXT_Y_OFFSET,
			width: 331.5 - this._TEXT_X_OFFSET * 2,
			height: 187.5 - this._VIDEO_TEXT_Y_OFFSET,
			cssClass: "videoUnavailableText",
			visible: false
		});

		this._rootSVGRef = this._container.getRootSVGRef();


		if (parent) {
			parent.addChild(this);
		}

		var me = this;

		this._eventImage.addFadeAnimation();

		this._eventImage.setLoadFailedCallback(function () {
			me._log("loadFailedCallback", "Enter");
			me._isImageLoadSuccessful = false;
			me.hideEventImage();
			me._eventImage.setHref("");
			me._log("loadFailedCallback", "Exit");
		});

		this._fadeAnim = this._eventImage.getFadeAnimation();
		this._fadeAnim.setAnimationEndCallback(function () {
			me._log("animationEndCallback", "Enter");
			me.showHideSmallVideoArea(true);
			me.hideEventImage();
			me.hideBlockedText();
			me._log("animationEndCallback", "Exit");
		});

		this._pipUnsubscribed = false;

		/**
		 * @method _resetCallbackId
		 * @private
		 */
		this._resetCallbackId = function () {
			this._log("_resetCallbackId", "Enter & Exit");
			this._callbackId = new Date().valueOf();
		};

		/**
		 * @method _clearCallbackId
		 * @private
		 */
		this._clearCallbackId = function () {
			this._log("_clearCallbackId", "Enter & Exit");
			this._callbackId = null;
		};

		this._smallVideoPlayStartedCallback = function () {
			me._log("_smallVideoPlayStartedCallback", "Enter & Exit");
		};

		this._smallVideoStreamAvailableCallback = function () {
			me._log("_smallVideoStreamAvailableCallback", "Enter");
			if (!me.isPIPCanPlaying()) {
				me._log("_smallVideoStreamAvailableCallback", "Exit 1");
				return;
			}
			if (!$N.app.EventUtil.isEventShowingNow(me._focusedEvent) || (me._focusedEvent.serviceId !== me._focusedChannel.serviceId)) {
				me._log("_smallVideoStreamAvailableCallback", "Exit 2");
				return;
			}
			$N.app.smallScreenPlayer.activatePIPVideoTrack();
			me._log("_smallVideoStreamAvailableCallback", "Exit 3");
		};

		this._smallVideoStreamStartedCallback = function () {
			me._log("_smallVideoStreamStartedCallback", "Enter");
			if ((!$N.app.EventUtil.isEventShowingNow(me._focusedEvent) || (me._focusedEvent.serviceId !== me._focusedChannel.serviceId)) && ($N.apps.core.ContextManager.getActiveContext().getId() === "LISTGUIDE")) {
				me.showHideSmallVideoArea(false);
				me.deactivatePIPVideo();
				me._log("_smallVideoStreamStartedCallback", "Exit 1");
				return;
			}
			me._log("_smallVideoStreamStartedCallback", "Exit 2");
		};

		/**
		 * Callback on received onIframeDecode
		 * @method _smallVideoIframeDecode
		 * @private
		 */
		this._smallVideoIframeDecode = function () {
			me._log("_smallVideoIframeDecode", "Enter");
			me.showHideSmallVideoArea(true);
			me.showHideSmallVideoLayer(true);
			if (!me._validVideoSize) {
				me._videoDetails = $N.app.smallScreenPlayer.getVideoDetail();
				me._log("_smallVideoIframeDecode", "Got Iframe:", me._videoDetails.width + " & " + me._videoDetails.height + " & " + me._videoDetails.aspect + " & " + me._videoDetails.format);
				me.smallVideoStreamPlaying();
				me._validVideoSize = true;
			}
			me._log("_smallVideoIframeDecode", "Exit");
		};

		/**
		 * Callback on received onPlayError
		 * @method _smallVideoPlayErrorCallback
		 * @private
		 */
		this._smallVideoPlayErrorCallback = function (e) {
			me._log("_smallVideoPlayErrorCallback", "Enter");
			me.showHideSmallVideoArea(false);
			me.showHideSmallVideoLayer(false);
			me.loadEventImage(me._focusedEvent);
			me.displayVideoUnavailableText();
			me.deactivatePIPVideo();
			me._log("_smallVideoPlayErrorCallback", "Exit");
		};

		/**
		 * Callback on received onPlayStartFailed
		 * @method _smallVideoPlayStartFailedCallback
		 * @private
		 */
		this._smallVideoPlayStartFailedCallback = function (e) {
			me._log("_smallVideoPlayStartFailedCallback", "Enter");
			me.showHideSmallVideoArea(false);
			me.showHideSmallVideoLayer(false);
			if (e && e.contentStartFailedInfo && e.contentStartFailedInfo.reason) {
				switch (e.contentStartFailedInfo.reason) {
				case me._contentStartFailed.CA_ACCESS_DENIED:
				case me._contentStartFailed.CA_ACCESS_BLACKED_OUT:
				case me._contentStartFailed.CA_NO_VALID_SECURE_DEVICE:
				case me._contentStartFailed.CA_ACCESS_PAIRING_REQUIRED:
				case me._contentStartFailed.CA_ACCESS_CHIPSET_PAIRING_REQUIRED:
					me.displayUnsubscribedText();
					me._pipUnsubscribed = true;
					break;
				case me._contentStartFailed.LACK_OF_RESOURCES:
				case me._contentStartFailed.CONFLICT:
					me.displayVideoUnavailableText();
					break;
				case me._contentStartFailed.CONTENT_PLAY_FAILED_REASON_NO_LOCK:
					break;
				default:
					break;
				}
			}
			me.deactivatePIPVideo();
			me._log("_smallVideoPlayStartFailedCallback", "Exit");
		};

		/**
		 * Callback on received onStreamDisabled
		 * @method _smallVideoStreamDisabledCallback
		 * @private
		 */
		this._smallVideoStreamDisabledCallback = function (e) {
			me._log("_smallVideoStreamDisabledCallback", "Enter");
			me.showHideSmallVideoArea(false);
			me.showHideSmallVideoLayer(false);
			if (e && e.streamDisabledInfo && e.streamDisabledInfo.reason) {
				switch (e.streamDisabledInfo.reason) {
				case me._streamDisabled.CA_ACCESS_DENIED:
				case me._streamDisabled.CA_ACCESS_BLACKED_OUT:
				case me._streamDisabled.CA_NO_VALID_SECURE_DEVICE:
				case me._streamDisabled.CA_ACCESS_PAIRING_REQUIRED:
				case me._streamDisabled.CA_ACCESS_CHIPSET_PAIRING_REQUIRED:
					me.displayUnsubscribedText();
					me._pipUnsubscribed = true;
					break;
				}
			}
			me._log("_smallVideoStreamDisabledCallback", "Exit");
		};

		/**
		 * Callback on received onLockerStatusUpdate
		 * @method _smallVideoBlockedCallback
		 * @private
		 */
		this._smallVideoBlockedCallback = function () {
			if (me._focusedEvent) {
				me._log("_smallVideoBlockedCallback", me._focusedEvent.eventId);
			}

			if ($N.app.genreUtil.isAdultChannel(me._focusedEvent)) {
				me.displayBlockedText(me._focusedEvent);
			} else {
				me.loadEventImage(me._focusedEvent);
			}
		};

		/**
		 * Callback on received onLockerUnlock
		 * @method _smallVideoUnblockedCallback
		 * @private
		 */
		this._smallVideoUnblockedCallback = function () {
			me._log("_smallVideoUnblockedCallback", "Enter & Exit");
			me.hideBlockedText();
		};

		/**
		 * Callback on received onSignalLoss
		 * @method _signalLoss
		 * @private
		 */
		this._signalLoss = function () {
			me._log("_signalLoss", me._focusedChannel.serviceId);
			me.hideEventImage();
			me.hideBlockedText();
		};
		/**
		 * Callback on received onSignalGain
		 * @method _signalGain
		 * @private
		 */
		this._signalGain = function () {
			me._log("_signalGain", me._focusedChannel.serviceId);
			var serviceObj = $N.app.epgUtil.getServiceById(me._focusedChannel.serviceId);
			if ($N.app.smallScreenPlayer.tuner.getCurrentUri()) {
				me.activatePIPVideo();
			} else {
				me.tuneSmallVideo(serviceObj.uri);
			}
		};

		/**
		 * Callback on received onStreamEnabled
		 * @method _smallVideoEnabledStream
		 * @private
		 */
		this._smallVideoEnabledStream = function () {
			me._log("_smallVideoEnabledStream", "Enter & Exit");
			me.hideBlockedText();
			if ($N.app.EventUtil.isEventShowingNow(me._focusedEvent)
					&& (me._focusedEvent.serviceId === me._focusedChannel.serviceId)
					&& ($N.app.smallScreenPlayer.getSource() === me._focusedChannel.uri)) {
				me.showHideSmallVideoArea(true);
			}
		};

		/**
		 * Callback on received onStreamStopped
		 * @method _smallVideoStreamStopped
		 * @private
		 */
		this._smallVideoStreamStopped = function () {
			me._log("_smallVideoStreamStopped", "Enter & Exit");
		};

		/**
		 * Callback on received onSmartCardInserted
		 * @method _smartCardInsert
		 * @private
		 */
		this._smartCardInsert = function (e) {
			me._pipUnsubscribed = false;
			if (e && e.state) {
				switch (e.state) {
				case CCOM.ConditionalAccess.EXPIRED:
				case CCOM.ConditionalAccess.INCOMPATIBLE:
				case CCOM.ConditionalAccess.ERROR:
				case CCOM.ConditionalAccess.NOT_CERTIFIED:
				case CCOM.ConditionalAccess.INVALID:
				case CCOM.ConditionalAccess.MUTE:
				case CCOM.ConditionalAccess.SUSPENDED:
				case CCOM.ConditionalAccess.BLACKLISTED:
					me._blockedText.hide();
					me.loadEventImage(me._focusedEvent);
					return;
				}
			}
			me._log("_smartCardInsert", "Enter & Exit");
		};
		/**
		 * Callback on received _smartCardRemoved
		 * @method _smartCardRemoved
		 * @private
		 */
		this._smartCardRemoved = function (e) {
			me.setEventImage("");
			me._blockedText.setText(" ");
			me._blockedText.show();
			me._eventImageContainer.show();
			me._eventImage.hide();
			me._blockedText.setText(Pip.getString("caErrorSmartcardRemovedMessage"));
			me._blockedText.setCssClass("pipUnsubscribePrompt");
		};
	}
	$N.gui.Util.extend(Pip, $N.gui.GUIObject);

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	Pip.prototype.setWidth = function (width) {
		this._container.setWidth(width);
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	Pip.prototype.setHeight = function (height) {
		this._container.setHeight(height);
	};

	/**
	 * @method setIsPIPEnabled
	 * @param {Boolean} isPIPEnabled
	 */
	Pip.prototype.setIsPIPEnabled = function (isPIPEnabled) {
		this._isPIPEnabled = isPIPEnabled;
	};

	/**
	 * @method setEventImage
	 * @param {String} href
	 */
	Pip.prototype.setEventImage = function (href) {
		this._log("setEventImage", "Enter - href: " + href);
		var me = this,
			callbackId = this._callbackId,
			loadSuccess = function () {
				if (callbackId !== me._callbackId) {
					me._log("loadSuccess", "image success does not match keypress");
					return;
				}
				me._isImageLoadSuccessful = true;
				me._clearCallbackId();
				me.showEventImage();
			};
		if (href === this._eventImage.getHref() && me._isImageLoadSuccessful) {
			this._log("setEventImage", "Exit 1");
			me.showEventImage();
			return;
		}
		this._eventImage.setLoadSuccessful(loadSuccess);
		this._eventImage.setHref(href);
		this._log("setEventImage", "Exit 2");
	};

	/**
	 * @method updatePipVideoNoInfo
	 * @param {Boolean} isEventShowingNow
	 * @param {String} serviceUri
	 * @param {String} channelUri
	 */
	Pip.prototype.updatePipVideoNoInfo = function (isEventShowingNow, serviceUri, channelUri) {
		this._log("updatePipVideoNoInfo", "Enter & Exit");
		this._fadeAnim.cancelAnimation();
		this.showHideSmallVideoArea(false);
		if (this._isPIPEnabled && isEventShowingNow) {
			this.showVideo(channelUri, serviceUri);
		} else {
			this.deactivatePIPVideo();
			this.hideEventImage();
		}
	};

	/**
	 * @method updatePipVideo
	 * @param {Object} eventInfo
	 * @param {String} serviceUri
	 * @param {String} channelUri
	 * @param {Boolean} isCatchupEvent
	 */
	Pip.prototype.updatePipVideo = function (eventInfo, serviceUri, channelUri, isCatchupEvent) {
		this._log("updatePipVideo", "Enter & Exit");
		this._fadeAnim.cancelAnimation();
		this._eventImage.setOpacity(1);
		if (this._isPIPEnabled && !isCatchupEvent && eventInfo.isEventShowingNow) {
			this.hideEventImage();
			this._blockedText.hide();
			this.loadEventImage(eventInfo);
			this.showVideo(channelUri, serviceUri);
		} else {
			this.loadEventImage(eventInfo);
			this.showHideSmallVideoArea(false);
			this.deactivatePIPVideo();
		}
	};

	Pip.prototype.updatePipLockedMessage = function (eventInfo, isAdultChannel) {
		if (isAdultChannel || $N.app.EventUtil.isEventShowingNow(eventInfo)) {
			this.hideEventImage();
			this.displayBlockedText(eventInfo);
		} else {
			this.hideBlockedText();
			this.loadEventImage(eventInfo);
		}
		/*stop pip video or hide event image*/
		this.showHideSmallVideoArea(false);
		this.deactivatePIPVideo();
	};

	Pip.prototype.showVideo = function (channelUri, serviceUri) {
		if ($N.app.smallScreenPlayer.getSource() === channelUri) {
			this.activatePIPVideo();
		} else {
			this.tuneSmallVideo(serviceUri);
		}

		if (this._videoUnavailableTimeout) {
			clearTimeout(this._videoUnavailableTimeout);
			this._videoUnavailableTimeout = null;
		}
	};

	/**
	 * Method to stop pip video when open other context
	 * @method stopPip
	 */
	Pip.prototype.stopPip = function () {
		this.showHideSmallVideoArea(false);
		this.stopPIPVideo();
	};

	/**
	 * @method setEventImageProperties
	 * @param {Object} properties
	 */
	Pip.prototype.setEventImageProperties = function (properties) {
		this._eventImage.configure(properties);
	};

	/**
	 * @method setEventImageContainerProperties
	 * @param {Object} properties
	 */
	Pip.prototype.setEventImageContainerProperties = function (properties) {
		this._eventImageContainer.configure(properties);
	};

	/**
	 * @method showEventImage
	 */
	Pip.prototype.showEventImage = function () {
		this._log("showEventImage", "Enter");
		if (!this._eventImage.getHref()) {
			this._log("showEventImage", "Exit 1");
			return;
		}
		this._eventImage.setOpacity(1);
		this._eventImage.show();
		this._eventImageContainer.show();
		this._log("showEventImage", "Exit 2");
	};

	/**
	 * @method hideEventImage
	 */
	Pip.prototype.hideEventImage = function () {
		this._log("hideEventImage", "Enter & Exit");
		this._eventImageContainer.hide();
		this._eventImage.hide();
	};

	/**
	 * @method tuneSmallVideo
	 * @param {string} url
	 */
	Pip.prototype.tuneSmallVideo = function (uri) {
		this._log("tuneSmallVideo", uri + " at " + $N.apps.core.ContextManager.getActiveContext().getId());
		if (!this.isPIPCanPlaying()) {
			return;
		}
		this._validVideoSize = false;
		this._pipUnsubscribed = false;
		this.showHideSmallVideoArea(false);
		this.deactivatePIPVideo();
		$N.app.smallScreenPlayer.requestPlayoutWithoutPlay(uri);
	};

	/**
	 * @method hideBlockedText
	 */
	Pip.prototype.hideBlockedText = function () {
		this._log("hideBlockedText", "Enter");
		if (this._blockedText.isVisible()) {
			this._eventImageContainer.hide();
			this._blockedText.hide();
		}
		this._log("hideBlockedText", "Exit");
	};

	/**
	 * @method displayBlockedText
	 * @param {Object} event object
	 */
	Pip.prototype.displayBlockedText = function (event) {
		this._log("displayBlockedText", "Enter");
		this.setEventImage("../../../customise/resources/images/net/Mosaico_blocked_content.png");
		this._blockedText.setText(Pip.getString("pipBlockedText"));
		this._blockedText.setCssClass("medium small posterTextColor blockedTextInGuide");
		this._blockedText.show();
		this._eventImageContainer.show();
		this._log("displayBlockedText", "Exit");
	};

	/**
	 * @method displayUnsubscribedText
	 * @param {Object} event object
	 */
	Pip.prototype.displayUnsubscribedText = function (event) {
		this._log("displayUnsubscribedText", "Enter");
		var smartCardObj = $N.app.ConditionalAccessCAK73.getCASmartCardInfo();

		if (!smartCardObj.smartcardInfo && smartCardObj.error.name === "NoSmartcard") {
			this.setEventImage("");
			this._blockedText.setText(" ");
			this._blockedText.show();
			this._eventImageContainer.show();
			this._eventImage.hide();
			this._blockedText.setText(Pip.getString("caErrorSmartcardRemovedMessage"));
			this._blockedText.setCssClass("pipUnsubscribePrompt");
		}
		this._log("displayUnsubscribedText", "Exit");
	};

	/**
	 * @method displayVideoUnavailableText
	 * @param {Object} event object
	 */
	Pip.prototype.displayVideoUnavailableText = function (event) {
		var me = this;
		this._log("displayVideoUnavailableText", "Enter");
		this._videoUnavailableContainer.show();
		this._videoUnavailableText.show();
		this._videoUnavailableText.setText(Pip.getString("videoUnavailable"));

		if (this._videoUnavailableTimeout) {
			clearTimeout(this._videoUnavailableTimeout);
			this._videoUnavailableTimeout = null;
		}
		this._videoUnavailableTimeout = setTimeout(function () {
			me._videoUnavailableContainer.hide();
			me._videoUnavailableText.hide();
		}, this._VIDEO_UNAVAILABLE_TIMEOUT);
		this._log("displayVideoUnavailableText", "Exit");
	};

	/**
	 * @method setCurrentChannel
	 * @param {Object} channel object
	 */
	Pip.prototype.setFocusedChannel = function (channelObj) {
		if (channelObj) {
			this._focusedChannel = channelObj;
		}
	};

	/**
	 * @method setFocusedEvent
	 * @param {Object} channel object
	 */
	Pip.prototype.setFocusedEvent = function (eventObj) {
		this._log("setFocusedEvent", "Enter");
		if (eventObj) {
			if (this._focusedEvent === null || eventObj.startTime !== this._focusedEvent.startTime || eventObj.serviceId !== this._focusedEvent.serviceId) {
				this._focusedEvent = eventObj;
				this.onEventChange();
			}
		}
		this._log("setFocusedEvent", "Exit");
	};

	Pip.prototype.onEventChange = function () {
		this._log("onEventChange", "Enter");
		this.hideEventImage();
		this._resetCallbackId();
		this.stopPip();
		this._log("onEventChange", "Exit");
	};

	/**
	 * @method loadEventImage
	 * @param {Object} event
	 */
	Pip.prototype.loadEventImage = function (event) {
		var me = this,
			callbackId = this._callbackId,
			getEventPoster = function (result) {
				me._log("getEventPoster", "Enter");
				if (callbackId !== me._callbackId) {
					me._log("getEventPoster", "Exit 1");
					return;
				}
				if (result && result.promoImage) {
					me.setEventImage(me._imageServer + result.promoImage);
				} else {
					me.setEventImage("");
					me._eventImageContainer.hide();
					me._log("getEventPoster", "Exit 2");
					return;
				}
				me._log("getEventPoster", "Exit 3");
			};
		me._log("loadEventImage", "Enter");

		if (!$N.platform.system.Network.isEthernetAvailable()) {
			me._log("loadEventImage", "Exit 1");
			return;
		}
		if (event) {
			if (event.promoImage) {
				me.setEventImage(me._imageServer + event.promoImage);
			} else {
				$N.app.epgUtil.getEventImageFromMDS(event, getEventPoster);
			}
		} else {
			me._log("loadEventImage", "Exit 2");
			return;
		}
		me._log("loadEventImage", "Exit 3");
	};

	/**
	 * @method showHideSmallVideoArea
	 * @param {Boolean} true for show small video area
	 */
	Pip.prototype.showHideSmallVideoArea = function (show) {
		this._log("showHideSmallVideoArea", "Enter: " + show);
		$N.gui.SmallVideoArea.setVisible(show);
		this._log("showHideSmallVideoArea", "Exit");
	};

	/**
	 * @method showHideSmallVideoLayer
	 * @param {Boolean} true for show small video layer
	 */
	Pip.prototype.showHideSmallVideoLayer = function (show) {
		this._log("showHideSmallVideoLayer", "Enter");
		$N.app.smallScreenPlayer.showHideSmallVideoLayer(show);
		this._log("showHideSmallVideoLayer", "Exit");
	};

	/**
	 * @method isStretchAspectMode
	 */
	Pip.prototype.isStretchAspectMode = function () {
		var isStretch = false,
			avOutput = $N.platform.output.AV;
		if (avOutput.isHDOutputAvailable() && avOutput.getHDVideoAspectMode() === avOutput.VideoAspectMode.HDMI_STRETCH) {
			this._log("isStretchAspectMode", "HD and Stretch");
			isStretch = true;
		} else if (avOutput.isAnalogueOutputAvailable() && avOutput.getAnalogueVideoAspectMode() === avOutput.VideoAspectMode.ANALOGUE_STRETCH) {
			this._log("isStretchAspectMode", "SD and Stretch");
			isStretch = true;
		}

		return isStretch;
	};

	/**
	 * @method isHDVideoResolution
	 */
	Pip.prototype.isHDVideoResolution = function () {
		var hdmiVideoResolution = $N.platform.system.Preferences.get($N.app.constants.PREF_HDMI_VIDEO_RESOLUTION, true),
			isHDOutput = false;

		switch (hdmiVideoResolution) {
		case 0:
		case 1:
			isHDOutput = false;
			break;
		case 4:
		case 5:
		case 6:
			isHDOutput = true;
			break;
		}
		this._log("isHDVideoResolution", isHDOutput);
		return isHDOutput;
	};

	/**
	 * Workaround for NETUI-3074(NO5SA-2098). Adjust the PIP area by output resolution, aspect mode, and video frame info.
	 * videoDetailInfo can be got when video is being decoded.
	 * When aspect mode is STRETCH, then reset the PIP window to original size.
	 * When aspect mode is PILLAR BOX,
	 * if video frame is 16:9 stream, then reset PIP window to original size on HD output, or resize to 2:1,
	 * if video frame is 4:3 stream, resize the PIP window to 4:3 in HD output and 3:2 in SD output,
	 * 4:3/3:2/2:1 is just estimated value of the SD video.
	 * @method resizePipWindow
	 */
	Pip.prototype.resizePipWindow = function () {
		this._log("resizePipWindow", "Enter");
		var videoWindow = document.getElementById("smallScreenBorder"),
			width = 0,
			x = 0,
			ratio = 1.5;
		this._log("resizePipWindow", "smallScreenBorder(before resize):" + $N.app.smallScreenPlayer.windowX + "& " + $N.app.smallScreenPlayer.windowW);
		if (this.isStretchAspectMode()) {
			$N.app.smallScreenPlayer.resetPipWindow();
		} else {
			if (this._videoDetails.aspect === $N.platform.output.AV.VideoAspectRatio.ASPECT_RATIO_4_3) {
				this._log("resizePipWindow", "the source video is 4:3");
				if (this.isHDVideoResolution()) {
					width = 4 / 3 * $N.app.smallScreenPlayer.sourceWindowH;
				} else {
					width = 3 / 2 * $N.app.smallScreenPlayer.sourceWindowH + 6;
				}
				x = $N.app.smallScreenPlayer.sourceWindowX + ($N.app.smallScreenPlayer.sourceWindowW - width) / 2;
				this._log("resizePipWindow", "resizePipWindow", "smallScreenBorder(after resize):" + x * ratio + "& " + width * ratio);
				$N.app.smallScreenPlayer.updatePipWindow(x * ratio, width * ratio);
			} else {
				this._log("resizePipWindow", "the source video is 16:9");
				if (this.isHDVideoResolution()) {
					$N.app.smallScreenPlayer.resetPipWindow();
				} else {
					width = 2 * $N.app.smallScreenPlayer.sourceWindowH + 6;
					x = $N.app.smallScreenPlayer.sourceWindowX + ($N.app.smallScreenPlayer.sourceWindowW - width) / 2;
					this._log("resizePipWindow", "smallScreenBorder(after resize):" + x * ratio + "& " + width * ratio);
					$N.app.smallScreenPlayer.updatePipWindow(x * ratio, width * ratio);
				}
			}

		}
		this._log("resizePipWindow", "Exit");
	};

	/**
	 * @method smallVideoStreamPlaying
	 */
	Pip.prototype.smallVideoStreamPlaying = function () {
		this._log("smallVideoStreamPlaying", "Enter");
		if (!this.isPIPCanPlaying()) {
			this._log("smallVideoStreamPlaying", "Exit 1");
			return;
		}
		this._eventImage.doFade(0);
		this.resizePipWindow();
		this._log("smallVideoStreamPlaying", "Exit 2");
	};

	/**
	 * @method stopPIPVideo
	 */
	Pip.prototype.stopPIPVideo = function () {
		this._log("stopPIPVideo", "Enter");
		this._fadeAnim.cancelAnimation();
		$N.app.smallScreenPlayer.stopPIPVideo();
		this._log("stopPIPVideo", "Exit");
	};

	/**
	 * @method deactivatePIPVideo
	 */
	Pip.prototype.deactivatePIPVideo = function () {
		this._log("deactivatePIPVideo", "Enter");
		$N.app.smallScreenPlayer.deactivatePIPVideoTrack();
		this._log("deactivatePIPVideo", "Exit");
	};
	/**
	 * @method activatePIPVideo
	 */
	Pip.prototype.activatePIPVideo = function () {
		this._log("activatePIPVideo", "Enter");
		if (this._pipUnsubscribed === true) {
			this.displayUnsubscribedText();
		} else {
			this._validVideoSize = false;
			$N.app.smallScreenPlayer.activatePIPVideoTrack();
		}
		this._log("activatePIPVideo", "Exit");
	};
	/**
	 * Method to register event listener
	 * @method registerSmallVideoPlayerCallbacks
	 * @private
	 */
	Pip.prototype.registerSmallVideoPlayerCallbacks = function () {
		if (!this._isPIPEnabled) {
			return;
		}
		/*play video success*/
		$N.app.smallScreenPlayer.registerPlayerPlayingListener(this._smallVideoPlayStartedCallback);
		$N.app.smallScreenPlayer.registerStreamAvailableListener(this._smallVideoStreamAvailableCallback);
		$N.app.smallScreenPlayer.registerPlayerConnectedListener(this._smallVideoStreamStartedCallback);
		$N.app.smallScreenPlayer.registerIframeDecodeListeners(this._smallVideoIframeDecode);

		/*stream stopped*/
		$N.app.smallScreenPlayer.registerStreamStoppedListeners(this._smallVideoStreamStopped);

		/*play video fail*/
		$N.app.smallScreenPlayer.registerPlayerConnectFailedListener(this._smallVideoPlayStartFailedCallback);
		$N.app.smallScreenPlayer.registerStreamDisabledListener(this._smallVideoStreamDisabledCallback);
		$N.app.smallScreenPlayer.registerPlayerPlayFailedListener(this._smallVideoPlayErrorCallback);

		/*blocked channel*/
		$N.app.smallScreenPlayer.registerBlockedCallbacks(this._smallVideoBlockedCallback, this._smallVideoUnblockedCallback);

		/*unsubscribed channel*/
		$N.app.smallScreenPlayer.registerStreamEnabledListeners(this._smallVideoEnabledStream);
		CCOM.ConditionalAccess.addEventListener('onSmartcardInserted', this._smartCardInsert);
		CCOM.ConditionalAccess.addEventListener('onSmartcardRemoved', this._smartCardRemoved);

		/*signal lost/gain*/
		$N.app.smallScreenPlayer.tuner.registerQosDegradedListener(this._signalLoss);
		$N.app.smallScreenPlayer.tuner.registerQosImprovedListener(this._signalGain);
	};

	/**
	 * Method to unregister event listener
	 * @method unregisterSmallVideoPlayerCallbacks
	 * @private
	 */
	Pip.prototype.unregisterSmallVideoPlayerCallbacks = function () {
		if (!this._isPIPEnabled) {
			return;
		}
		$N.app.smallScreenPlayer.unregisterPlayerPlayingListener(this._smallVideoPlayStartedCallback);
		$N.app.smallScreenPlayer.unregisterStreamAvailableListener(this._smallVideoStreamAvailableCallback);
		$N.app.smallScreenPlayer.unregisterPlayerConnectedListener(this._smallVideoStreamStartedCallback);
		$N.app.smallScreenPlayer.unregisterIframeDecodeListeners(this._smallVideoIframeDecode);

		$N.app.smallScreenPlayer.unregisterStreamStoppedListeners(this._smallVideoStreamStopped);

		$N.app.smallScreenPlayer.unregisterPlayerConnectFailedListener(this._smallVideoPlayStartFailedCallback);
		$N.app.smallScreenPlayer.unregisterStreamDisabledListener(this._smallVideoStreamDisabledCallback);
		$N.app.smallScreenPlayer.unregisterPlayerPlayFailedListener(this._smallVideoPlayErrorCallback);

		$N.app.smallScreenPlayer.unregisterBlockedCallbacks(this._smallVideoBlockedCallback, this._smallVideoUnblockedCallback);

		$N.app.smallScreenPlayer.unregisterStreamEnabledListeners(this._smallVideoEnabledStream);
		CCOM.ConditionalAccess.removeEventListener('onSmartcardInserted', this._smartCardInsert);
		CCOM.ConditionalAccess.removeEventListener('onSmartcardRemoved', this._smartCardRemoved);

		$N.app.smallScreenPlayer.tuner.unregisterQosDegradedListener(this._signalLoss);
		$N.app.smallScreenPlayer.tuner.unregisterQosImprovedListener(this._signalGain);
	};

	/**
	 * @method isPIPCanPlaying
	 */
	Pip.prototype.isPIPCanPlaying = function () {
		// var activeContext = $N.apps.core.ContextManager.getActiveContext().getId(),
			// canPlay = ((activeContext === "LISTGUIDE") || (activeContext === "OPTIONS") || (activeContext === "ZAPPER"));
		// this._log("isPIPCanPlaying", canPlay);
		// return true;
		return true; //Passing true since PIP needs to be displayed in miniguide as well.
					 //Commenting the previous piece of code.
	};


	/**
	 * Method to start pip video stream and register pip event listener when exit
	 * @method activatePip
	 */
	Pip.prototype.activatePip = function () {
		this.registerSmallVideoPlayerCallbacks();
		this.showHideSmallVideoArea(true);
	};

	/**
	 * Method to stop pip video stream when switch between events
	 * @method deactivatePip
	 */
	Pip.prototype.deactivatePip = function () {
		this.showHideSmallVideoArea(false);
		this.deactivatePIPVideo();
	};

	Pip.prototype._largePipEventImageConfigure = function (xPos) {
		this._container.configure({
			width: 420,
			height: 236
		});
		this._eventImageContainer.configure({
			x: xPos,
			y: -3,
			width: 427.5,
			height: 242
		});
		this._eventImage.configure({
			width: 424.5,
			height: 238.5
		});
	};

	Pip.prototype._smallPipEventImageConfigure = function (xPos) {
		this._container.configure({
			width: 320,
			height: 178
		});
		this._eventImageContainer.configure({
			x: xPos,
			y: -4.5,
			width: 326,
			height: 183
		});
		this._eventImage.configure({
			width: 322.5,
			height: 180
		});
	};


	Pip.prototype.rePositionPipWindow = function (isFromMiniguide) { //Work in progress for Pip in mini-guide.
		if (isFromMiniguide) {
			this._PIP_POSITION = parseInt($N.platform.system.Preferences.get($N.app.constants.PREF_MINIGUIDE_PIP_POSITION), 10) || $N.app.constants.PIP_POSITION_DEFAULT;
			this._container.setY(0);
			var eventImageContainerXPosition = null,
				X_POSTION_LARGE_TOP_RIGHT_PIP = 1315.5,
				X_POSTION_SMALL_TOP_RIGHT_PIP = 1420.5,
				X_POSTION_IN_TOP_LEFT_PIP = -3;
			switch (this._PIP_POSITION) {
			case this._PIP_POSITIONS.LARGE_TOP_RIGHT:
				eventImageContainerXPosition = X_POSTION_LARGE_TOP_RIGHT_PIP; // X position for LARGE_TOP_RIGHT PIP window event image container.
				this._largePipEventImageConfigure(eventImageContainerXPosition);
				break;
			case this._PIP_POSITIONS.SMALL_TOP_RIGHT:
				eventImageContainerXPosition = X_POSTION_SMALL_TOP_RIGHT_PIP; // X position for SMALL_TOP_RIGHT PIP window event image container.
				this._smallPipEventImageConfigure(eventImageContainerXPosition);
				break;
			case this._PIP_POSITIONS.LARGE_TOP_LEFT:
				eventImageContainerXPosition = X_POSTION_IN_TOP_LEFT_PIP; // X position for LARGE_TOP_LEFT PIP window event image container.
				this._largePipEventImageConfigure(eventImageContainerXPosition);
				break;
			case this._PIP_POSITIONS.SMALL_TOP_LEFT:
				eventImageContainerXPosition = X_POSTION_IN_TOP_LEFT_PIP; // X position for SMALL_TOP_LEFT PIP window event image container.
				this._smallPipEventImageConfigure(eventImageContainerXPosition);
				break;
			}
		} else {
			this._container.setY(0);
		}
		$N.app.smallScreenPlayer.rePositionPipWindow(isFromMiniguide);
	};

	$N.gui = $N.gui || {};
	$N.gui.Pip = Pip;
}($N || {}));
