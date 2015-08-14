/**
 *
 * @class $N.gui.EventPromotionItem
 * @constructor
 * @namespace $N.gui
 * @requires $N.gui.LabelledProgressBar
 * @requires $N.gui.Util
 * @requires $N.gui.Label
 * @extends $N.gui.PromotionItem
 *
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */
(function ($N) {
	function EventPromotionItem(docRef, parent) {
		EventPromotionItem.superConstructor.call(this, docRef, parent);
		var me = this;

		this._currentEvent = null;
		this._eventId = null;
		this._LOGO_PADDING_Y = 20;
		this._LOGO_WIDTH = 96;
		this._LOGO_HEIGHT = 96;
		this._PROGRESSBAR_GRADIENT_HEIGHT = 180;
		this._TITLE_AND_PROGRESSBAR_X = 127;
		this._progressBarVisible = false;

		this._channelLogo = new $N.gui.ChannelLogo(this._docRef, this._container);
		this._progressBar = new $N.gui.LabelledProgressBar(this._docRef, this._container);
		this._eventTime = new $N.gui.Label(this._docRef, this._container);

		this._eventTime.configure({
			x: this._DEFAULT_TEXT_PADDING_LEFT,
			cssClass: "promotionItemEventDetails"
		});

		this._progressBar.configure({
			x: this._TITLE_AND_PROGRESSBAR_X,
			y: 0,
			width: 400,
			progressBarLabelsCssClass: "startAndEndTimeProgressBarLabels",
			progressOuterCssClass: "progressOuter",
			progressInnerCssClass: "progressInner",
			progressBarHeight: 10,
			startLabelWidth: 80,
			visible: false
		});

		this._progressBar.initialise();

		this._channelLogo.configure({
			x: this._CELLPADDING_LEFT,
			height: this._LOGO_HEIGHT,
			width: this._LOGO_WIDTH
		});

	}
	$N.gui.Util.extend(EventPromotionItem, $N.gui.PromotionItem);

	/**
	 * Sets the start and end labels of the progress bar passing in the time in HH:mm format and sets the current progress to now.
	 * @method _initialiseProgressBar
	 */
	EventPromotionItem.prototype._initialiseProgressBar = function () {
		var startTime = $N.app.DateTimeUtil.getFormattedTimeString(new Date(this._currentEvent.startTime), "HH:mm"),
			endTime = $N.app.DateTimeUtil.getFormattedTimeString(new Date(this._currentEvent.endTime), "HH:mm");
		this._progressBar.setProgressBarLabels(startTime, endTime);
		this._progressBar.updateProgressBar(this._currentEvent.startTime, this._currentEvent.endTime, Date.now());
	};

	/**
	 * Method sets the current logo to display nothing and hides the progress call, it then makes a call to the superclass reset method.
	 * @method reset
	 */
	EventPromotionItem.prototype.reset = function () {
		this._channelLogo.hide();
		this._progressBar.hide();
		this._progressBarVisible = false;
		this._currentEvent = null;
		this._eventId = null;
		EventPromotionItem.superClass.reset.call(this);
	};

    /**
    * @method setLocalHref
    * @param {String} localHref
    */
	EventPromotionItem.prototype.setClickhandler = function (clicked) {      //jrm
	      this._container._innerElement.onclick = clicked;
	};
	/**
	 * Method calls superclass setHeight method and sets the Y positions of the logo and progress bar.
	 * @method setHeight
	 */

	EventPromotionItem.prototype.setHeight = function (height) {
		EventPromotionItem.superClass.setHeight.call(this, height);
		this._channelLogo.setY(height - this._LOGO_HEIGHT - this._CELLPADDING_BOTTOM);
		this._progressBar.setY(height - this._LOGO_PADDING_Y - 18);
		this._progressBar.setLabelYPositions(-18);
		this._eventTime.setY(height - 73);
	};

	/**
	 * This function moves the background up and makes it higher
	 * it also shows the progress bar
	 * @method _moveLayout
	 */
	EventPromotionItem.prototype._moveLayout = function () {
		this._title.setY(this._height - 95);
		this._eventTime.setY(this._height - this._title.getHeight() - 35);
		this._backgroundGradient.setY(this._height - this._PROGRESSBAR_GRADIENT_HEIGHT);
		this._backgroundGradient.setHeight(this._PROGRESSBAR_GRADIENT_HEIGHT);
		this._progressBar.show();
		this._progressBarVisible = true;
	};

	/**
	 * This function returns the title and gradient back to default location
	 * it also hides the progress bar
	 *
	 * @method _resetLayout
	 */
	EventPromotionItem.prototype._resetLayout = function () {
		this._title.setX(this._DEFAULT_TEXT_PADDING_LEFT);
		this._title.setY(this._height - 10);
		this._backgroundGradient.setY(this._height - (this._DEFAULT_GRADIENT_HEIGHT - 1));
		this._backgroundGradient.setHeight(this._DEFAULT_GRADIENT_HEIGHT);
		this._channelLogo.hide();
		this._progressBar.hide();
		this._progressBarVisible = false;
	};

	/**
	 * Runs every X minutes and if I have an event that is on now I update the progress bar,
	 * if the event is not on in the future I hide the progress bar and reset the text position.
	 * @method update
	 */
	EventPromotionItem.prototype.update = function () {
		var progress = 0;
		this._eventTime.hide();
		if (this._currentEvent) {
			progress = (this._currentEvent && this._currentEvent.startTime) ? Date.now() : 0;
			if ($N.app.EventUtil.isValidEvent(this._currentEvent) && $N.app.EventUtil.isEventShowingNow(this._currentEvent)) {
				if (!this._progressBarVisible) {
					this._moveLayout();
				}
				this._progressBar.updateProgressBar(this._currentEvent.startTime, this._currentEvent.endTime, progress);
				return;
			} else if ($N.app.EventUtil.isFutureEvent(this._currentEvent)) {
				this._eventTime.setText($N.app.DateTimeUtil.getDayMonthStringWithSlashFromDate(new Date(this._currentEvent.startTime)) +
										" " + $N.app.DateTimeUtil.getString("at") + " " +
										$N.app.DateTimeUtil.getFormattedTimeString(new Date(this._currentEvent.startTime), $N.app.constants.TWENTY_FOUR_HOUR_TIME_FORMAT));
				this._eventTime.show();
				return;
			}
		}
		this._currentEvent = null;
		$N.app.TimerUtil.removeItem(this);
		if (this._progressBarVisible) {
			this._resetLayout();
		}
	};

	/**
	 * This helper function shows a logo for the current event and sets up the progress bar
	 * @method _showEventInfo
	 */
	EventPromotionItem.prototype._showEventInfo = function () {
		this._currentEvent = $N.platform.btv.EPG.getEventById(this._eventId);
		var me = this,
			logoUrl = "",
			channelObject;
		if ($N.app.EventUtil.isValidEvent(this._currentEvent) && $N.app.EventUtil.isEventShowingNow(this._currentEvent)) {
			logoUrl = $N.app.epgUtil.getChannelLogoUrl(this._currentEvent.serviceId);
			channelObject = $N.platform.btv.EPG.getChannelByServiceId(this._currentEvent.serviceId);
			if (channelObject) {
				this._channelLogo.update(channelObject);
				this._title.setX(this._TITLE_AND_PROGRESSBAR_X);
				this._title.setWidth(this._width - me._TITLE_AND_PROGRESSBAR_X);
				this._channelLogo.show();
			} else {
				this._channelLogo.hide();
			}
		} else {
			this._channelLogo.hide();
		}

		if ($N.app.EventUtil.isValidEvent(this._currentEvent) && ($N.app.EventUtil.isEventShowingNow(this._currentEvent) || $N.app.EventUtil.isFutureEvent(this._currentEvent))) {
			this._initialiseProgressBar();
			this.update();
			$N.app.TimerUtil.addItem(this);
		} else {
			this._eventTime.hide();
		}
	};

	/**
	 * This method sets a local eventId and then calls showEventInfo that shows the logo and the progress bar (if showing now)
	 * @method setEventId
	 * @param {String} eventId
	 */
	EventPromotionItem.prototype.setEventId = function (eventId) {
		this._eventId = eventId;
		this._showEventInfo();
	};

	/**
		 * Tune to a service for the current Event.
		 * @method _tuneToService
	 */
	EventPromotionItem.prototype._tuneToService = function () {
		var service = null;
		if (this._currentEvent && this._currentEvent.serviceId) {
			service = $N.platform.btv.EPG.getChannelByServiceId(this._currentEvent.serviceId);
			$N.app.fullScreenPlayer.tuner.tune(service.uri);
			$N.app.epgUtil.storeChannelToPrefs(this._currentEvent.serviceId);
			$N.app.ContextHelper.exitContext();
			return true;
		} else {
			return false;
		}
	};

	/**
		 * Handle OK press and go to LISTGUIDE, SEARCH or LIVE TV.
		 * @method _handleOKKeyPress
	 */
	EventPromotionItem.prototype._handleOKKeyPress = function () {
		var eventTitle;
		if (this._eventId) {
			if (this._currentEvent && $N.app.EventUtil.isEventShowingNow(this._currentEvent)) {
				this._tuneToService();
			} else if (this._currentEvent && $N.app.EventUtil.isFutureEvent(this._currentEvent)) {
				$N.app.ContextHelper.openContext("LISTGUIDE", {activationContext: {event: this._currentEvent}});
			} else {
				eventTitle = this._currentEvent ? this._currentEvent.title : this._title.getText();
				$N.app.ContextHelper.openContext("SEARCH", {activationContext: {title: eventTitle}});
			}
		} else {
			EventPromotionItem.superClass._handleOKKeyPress.call(this);
		}
	};

	/**
	 * @method setDataMapper
	 * @param {Object} dataMapper
	 */
	EventPromotionItem.prototype.setDataMapper = function (dataMapper) {
		this._channelLogo.setDataMapper(dataMapper);
	};

	$N.gui = $N.gui || {};
	$N.gui.EventPromotionItem = EventPromotionItem;
}($N || {}));
