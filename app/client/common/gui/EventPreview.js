/**
 * Extends event poster with video
 * @class $N.gui.EventPreview
 * @constructor
 * @extends $N.gui.EventPoster
 * @requires $N.gui.Util
 * @param {Object} docRef DOM document
 * @param {Object} parent
 */

(function ($N) {
	function EventPreview(docRef, parent) {
		EventPreview.superConstructor.call(this, docRef);
		$N.apps.core.Language.adornWithGetString(EventPreview);
		this._log = new $N.apps.core.Log("CommonGUI", "EventPreview");

		this._BOX_CSS = "mosaicPreviewBackground";
		this._POSTER_PROMPT_CSS = "mosaicPosterPrompt";

		this._LABEL_X_OFFSET = 66;
		this._LABEL_Y_OFFSET = 85.5;

		this._playoutCasId = { casId: null };
		this._Playout = {
			url: null,
			isLive: false,
			isMusic: null,
			context: null,
			serviceId: null
		};

	}
	$N.gui.Util.extend(EventPreview, $N.gui.EventPoster);

	var proto = EventPreview.prototype;
	/**
	 * overridden from Event poster as the requirement in mosaic needs blocked text to be displayed for
	 * services that are blocked in settings as well as the adult channels.
	 * @method showBlockText
	 * @private
	 */
	proto._showBlockText = function (service, event) {
		var hasPrompt = false;

		this._prompt.setText(" ");
		this._box.show();
		this._loadingImg.hide();

		if ($N.app.ParentalControlUtil.isChannelOrProgramLocked(event) || $N.app.genreUtil.isAdultChannel(service)) {
			this._showBlocked();
			this._poster.show();
			hasPrompt = true;
		}

		if (!hasPrompt) {
			this._loadingImg.show();
			this._prompt.hide();
		}
	};
	/**
	 * @method updatePreview
	 * @param {Object} service
	 * @param {Object} event
	 */
	proto.updatePreview = function (service, event) {
		this._setCurrentService(service);
		this._showBlockText(service, event);
	};

	/**
	 * @method showSmartCardNotInsertedText
	 */
	proto.showSmartCardNotInsertedText = function () {
		this._prompt.setText(" ");
		this._box.show();
		this._loadingImg.hide();
		this._poster.hide();
		this.setPoster("");
		this._prompt.show();

		this._prompt.setText(EventPreview.getString("caErrorSmartcardRemovedPipTitle"));
		this._prompt.setCssClass("mosaicUnsubscribePrompt smartCardNotInsertedText");
	};
	/**
	 * @method setScalePlayout
	 * @param {Object} service
	 * @param {Object} event
	 * @param {Boolean} isExit true if exit mosaic
	 */
	proto.setScalePlayout = function (service, event, isExit) {
		$N.app.AudioManager.mute();
		$N.app.fullScreenPlayer.tuner.hideVideo();

		this._Playout.url = service.uri;
		this._Playout.isMusic = $N.platform.btv.EPG.isRadioChannel(service);
		this._Playout.serviceId = service.serviceId;
		this._playoutCasId.casId = (service.conditionalAccessIDs) ? service.conditionalAccessIDs[0] : null;
		$N.app.fullScreenPlayer.requestPlayout(
			this._Playout,
			true,
			this._playoutCasId
		);
		$N.apps.util.EventManager.fire("channelChanged", service);
	};


	/**
	 * @method showNoResourcePoster
	 */
	proto.showNoResourcePoster = function () {
		this._prompt.setText(" ");
		this._box.show();
		this._loadingImg.hide();
		this._prompt.show();
		this._prompt.setCssClass("mosaicUnsubscribePrompt");
	};

	/**
	 * @method tuneScaledVideo
	 */
	proto.tuneScaledVideo = function (service, event) {
		this._log("tuneScaledVideo", "Enter");
		if (service) {
			this.setScalePlayout(service, event, false);
		}
		this._log("tuneScaledVideo", "Exit");
	};

	$N.gui = $N.gui || {};
	$N.gui.EventPreview = EventPreview;
}($N || {}));
