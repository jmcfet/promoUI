/**
 * @class $N.gui.EventPoster
 * @constructor
 * @extends $N.gui.GUIObject
 * @requires $N.gui.Group
 * @requires $N.gui.Container
 * @requires $N.gui.BufferIndicator
 * @requires $N.gui.Image
 * @requires $N.gui.TextArea
 * @requires $N.gui.Util
 * @param {Object} docRef DOM document
 * @param {Object} parent
 */

(function ($N) {
	function EventPoster(docRef, parent) {
		EventPoster.superConstructor.call(this, docRef);
		$N.apps.core.Language.adornWithGetString(EventPoster);
		this._log = new $N.apps.core.Log("CommonGUI", "EventPoster");

		this._LABEL_X_OFFSET = 44;
		this._LABEL_Y_OFFSET = 44;

		this._LOADING_WIDTH = 48;
		this._LOADING_HEIGHT = 48;

		this._BORDER_WIDTH = 2;

		EventPoster._CONTENT_BLOCKED_HREF = "../../../customise/resources/images/net/Mosaico_blocked_content.png";
		this._POSTER_PROMPT_CSS = "posterPrompt";

		this._BOX_CSS = "eventImageContainer";

		this._service = null;
		this._eventId = null;
		this._posterTimer = null;

		this._container = new $N.gui.Group(this._docRef);
		this._box = new $N.gui.Container(this._docRef, this._container);
		this._poster = new $N.gui.Image(this._docRef, this._container);
		this._prompt = new $N.gui.TextArea(this._docRef, this._container);
		this._loadingImg = new $N.gui.BufferIndicator(this._docRef, this._container);
		this._posterImageServer = $N.app.epgUtil.getPosterImageServer();
		this.hidePreviewArea();

		if (parent) {
			parent.addChild(this);
		}

		this._rootSVGRef = this._container.getRootSVGRef();

	}
	$N.gui.Util.extend(EventPoster, $N.gui.GUIObject);

	var proto = EventPoster.prototype;

	proto.setWidth = function (width) {
		this._width = width;
	};

	proto.setHeight = function (height) {
		this._height = height;
	};

	proto.configureComponents = function () {

		var me = this;

		this._container.configure({
			width: this._width,
			height: this._height
		});

		this._box.configure({
			width: this._width,
			height: this._height,
			cssClass: this._BOX_CSS
		});

		this._loadingImg.configure({
			x: Math.round(this._width / 2 - this._LOADING_WIDTH / 2),
			y: Math.round(this._height / 2 - this._LOADING_HEIGHT / 2),
			imageWidth: this._LOADING_WIDTH,
			imageHeight: this._LOADING_HEIGHT,
			image: "../../../customise/resources/images/net/loading.png"
		});

		this._poster.configure({
			x: this._BORDER_WIDTH,
			y: this._BORDER_WIDTH,
			width: this._width - this._BORDER_WIDTH * 2,
			height: this._height - this._BORDER_WIDTH * 2,
			loadSuccessful: function () {
				me.posterTimerClear();
				me._poster.show();
				me._box.show();
				me._loadingImg.hide();
				me._log("load_preview_picture", "success");
			},
			loadFailedCallback: function () {
				me._log("load_preview_picture", "fail");
				me.posterTimerClear();
				me._loadingImg.hide();
				me._showImageMissing();
			}
		});

		this._prompt.configure({
			x: this._BORDER_WIDTH,
			y: this._BORDER_WIDTH,
			width: 270,
			height: 180,
			visible: false
		});

	};

	proto.updateEventPoster = function (event) {
		var service = null,
			isEventLocked = $N.app.ParentalControlUtil.isChannelOrProgramLocked(event),
			callbackId,
			me = this;

		this._callbackId = new Date().valueOf();
		callbackId = this._callbackId;

		function getEventCallback(result) {
			me._poster.show();
			if (result && result.promoImage) {
				if (callbackId !== me._callbackId) {
					return;
				}
				me.setPoster(me._posterImageServer + result.promoImage);
			} else {
				me._showImageMissing();
			}
		}
		service = $N.platform.btv.EPG.getChannelByServiceId(event.serviceId);
		if (isEventLocked && (service && $N.app.genreUtil.isAdultChannel(service))) {
			this._showBlocked();
			return;
		}
		if (this._poster.getHref() === "") {
			this._box.hide();
		}
		if (event.promoImage) {
			this.setPoster(this._posterImageServer + event.promoImage);
		} else {
			$N.app.epgUtil.getEventImageFromMDS(event, getEventCallback);
		}
	};

	/**
	 * @method _showBlocked
	 * @private
	 */
	proto._showBlocked = function () {
		this._poster.setHref(EventPoster._CONTENT_BLOCKED_HREF);
		this._poster.show();
		this._setBlockText();
	};

	/**
	 * @method showImageMissing
	 * @private
	 */
	proto._showImageMissing = function () {
		this.hidePreviewArea();
	};


	proto.posterTimerClear = function () {
		if (this._posterTimer) {
			clearTimeout(this._posterTimer);
			this._posterTimer = null;
		}
	};

	proto.posterTimerStart = function () {
		var me = this;
		this.posterTimerClear();
		this._posterTimer = setTimeout(function () {
			me._loadingImg.hide();
			if (me._poster.getHref() && (me._poster.getHref().indexOf("Mosaico_blocked_content.png")) > -1) {
				me._poster.show();
			}
		}, 3000);
	};

	/**
	 * @method setCurrentService
	 * @private
	 */
	proto._setCurrentService = function (service) {
		this._service = service;
	};

	/**
	 * @method setCurrentEventId
	 */
	proto.setCurrentEventId = function (eventId) {
		this._eventId = eventId;
	};

	/**
	 * @method _setBlockText
	 */
	proto._setBlockText = function () {
		this._prompt.setText(EventPoster.getString("blockedContent"));
		this._prompt.setCssClass("posterPrompt ");
		this._prompt.show();
	};


	/**
	 * @method showBlockText
	 * @private
	 */
	proto._showBlockText = function (service, event) {
		var hasPrompt = false;

		this._prompt.setText(" ");
		this._box.show();
		this._loadingImg.hide();

		if ($N.app.ParentalControlUtil.isChannelOrProgramLocked(event)) {
			if ($N.app.genreUtil.isAdultChannel(service)) {
				this._showBlocked();
			}

			this._poster.show();
			hasPrompt = true;
		}

		if (!hasPrompt) {
			this._loadingImg.show();
			this._prompt.hide();
		}
	};

	/**
	 * @method showUnsubscribeText
	 */
	proto.showUnsubscribeText = function () {
		this._prompt.setText(" ");
		this._box.show();
		this._loadingImg.hide();
		this._poster.hide();
		this._prompt.show();

		this._prompt.setText(EventPoster.getString("unSubscribedContent"));
		this._prompt.setCssClass("mosaicUnsubscribePrompt");
	};

	/**
	 * @method clearPoster
	 */
	proto.clearPoster = function () {
		this.setPoster("");
		this._box.hide();
	};

	/**
	 * @method setPoster
	 */
	proto.setPoster = function (newHref) {
		this._log = new $N.apps.core.Log("setPoster", newHref);
		this._prompt.hide();
		this._poster.setHref(newHref);
		this.posterTimerStart();
	};

	/**
	 * @method hidePreviewArea
	 */
	proto.hidePreviewArea = function () {
		this._box.hide();
		this._loadingImg.hide();
		this._prompt.hide();
		this._poster.hide();
	};

	/**
	 * @method showPreviewArea
	 */
	proto.showPreviewArea = function () {
		this._box.show();
		this._prompt.hide();
		this._loadingImg.show();
		this._poster.hide();
	};

	$N.gui = $N.gui || {};
	$N.gui.EventPoster = EventPoster;
}($N || {}));
