/**
 * This class displays information about a highlighted programme
 *
 * @class $N.gui.Summary
 * @constructor
 * @extends $N.gui.GUIObject
 *
 * @requires $N.apps.core.Language
 * @requires $N.app.constants
 * @requires $N.apps.core.Log
 * @requires $N.gui.Group
 * @requires $N.gui.Label
 * @requires $N.gui.SpanTextArea
 * @requires $N.input.KeyInterceptor
 * @requires $N.gui.Util
 *
 * @param {Object} docRef Document relating the DOM
 * @param {Object} [parent]
 */
(function ($N) {
	function Summary(docRef, parent) {
		Summary.superConstructor.call(this, docRef);
		$N.apps.core.Language.adornWithGetString(Summary);

		this._isPIPEnabled = true;

		this._contentStartFailed = $N.app.constants.CA_PLAY_ERRORS.contentStartFailedReason;
		this._contentError = $N.app.constants.CA_PLAY_ERRORS.contentErrorReason;
		this._streamDisabled = $N.app.constants.CA_PLAY_ERRORS.streamDisabledReason;

		this._log = new $N.apps.core.Log("CommonGUI", "Summary");
		this._container = new $N.gui.Group(docRef);

		this._eventTitles = new $N.gui.Container(this._docRef, this._container);
		this._title = new $N.gui.InlineLabel(docRef, this._eventTitles);
		this._seasonAndEpisode = new $N.gui.InlineLabel(docRef, this._eventTitles);

		this._eventDetails = new $N.gui.Container(this._docRef, this._container);
		this._startAndEndTime = new $N.gui.InlineLabel(this._docRef, this._eventDetails);
		this._genres = new $N.gui.InlineLabel(this._docRef, this._eventDetails);
		this._parentalRatingIcon = new $N.gui.ParentalRatingIcon(this._docRef, this._eventDetails);

		this._startOverIcon = new $N.gui.StartOverIcon(this._docRef, this._eventDetails);
		this._reminderIcon = new $N.gui.ReminderIcon(this._docRef, this._eventDetails);
		this._recordIcon = new $N.gui.RecordIcon(this._docRef, this._eventDetails);

		this._description = new $N.gui.SpanTextArea(docRef, this._container);
		this._pipWindow = new $N.gui.Pip(this._docRef, this._container);

		this._PADDING = 15;
		this._ICON_Y_POS = 92;

		this._TEXT_OPACITY_SUBSCRIBED = 1.0;
		this._TEXT_OPACITY_NOT_SUBSCRIBED = 0.5;

		this._title.configure({
			cssClass: 'large ellipsis nowrap'
		});
		this._description.configure({
			y: 144,
			width: 1359,
			height: 83,
			cssClass: "small ellipsis ellipsisTwoLines"
		});
		this._eventTitles.configure({
			y: 31.5,
			width: 1100
		});
		this._eventDetails.configure({
			y: 92,
			cssClass: "summaryEventDetails"
		});
		this._startAndEndTime.configure({
			cssClass: "tiny ellipsis lessImportant verticalAlignMiddle"
		});
		this._genres.configure({
			cssClass: "tiny ellipsis lessImportant verticalAlignMiddle"
		});
		this._seasonAndEpisode.configure({
			cssClass: "summarySeasonAndEpisode ellipsis lessImportant inlineText"
		});
		this._recordIcon.configure({
			cssClass: "icon-small relative inlineBlock verticalAlignMiddle",
			visible: false
		});
		this._reminderIcon.configure({
			visible: false,
			cssClass: "icon-small relative inlineBlock verticalAlignMiddle"
		});
		this._startOverIcon.configure({
			visible: false,
			cssClass: "icon-small relative inlineBlock verticalAlignMiddle"
		});
		this._parentalRatingIcon.configure({
			cssClass: "icon-small relative inlineBlock verticalAlignMiddle"
		});

		this._rootSVGRef = this._container.getRootSVGRef();

		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(Summary, $N.gui.GUIObject);

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	Summary.prototype.setWidth = function (width) {
		this._container.setWidth(width);
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	Summary.prototype.setHeight = function (height) {
		this._container.setHeight(height);
	};

	/**
	 * @method setIsPIPEnabled
	 * @param {Boolean} isPIPEnabled
	 */
	Summary.prototype.setIsPIPEnabled = function (isPIPEnabled) {
		this._pipWindow.setIsPIPEnabled(isPIPEnabled);
	};

	/**
	 * @method setSummaryFade
	 * @param {Object} summaryFade
	 */
	Summary.prototype.setSummaryFade = function (summaryFade) {
		this._summaryFade = summaryFade;
	};

	/**
	 * @method setTitle
	 * @param {String} title
	 */
	Summary.prototype.setTitle = function (title) {
		this._title.setText(title);
	};

	/**
	 * @method showTitle
	 */
	Summary.prototype.showTitle = function () {
		this._title.show();
	};

	/**
	 * @method hideTitle
	 */
	Summary.prototype.hideTitle = function () {
		this._log("hideTitle", "Enter & Exit");
		this._title.hide();
	};

	/**
	 * @method setDescription
	 * @param {String} description
	 */
	Summary.prototype.setDescription = function (description) {
		this._log("setDescription", "Enter");
		this._description.setText(description);
		this._log("setDescription", "Exit");
	};

	/**
	 * @method setSeasonAndEpisode
	 * @param {String} seasonAndEpisode
	 */
	Summary.prototype.setSeasonAndEpisode = function (seasonAndEpisode) {
		this._log("setSeasonAndEpisode", "Enter");
		this._seasonAndEpisode.setText(seasonAndEpisode);
		this._log("setSeasonAndEpisode", "Exit");
	};

	/**
	 * @method setStartAndEndTime
	 * @param {String} startAndEndTime
	 */
	Summary.prototype.setStartAndEndTime = function (startAndEndTime) {
		this._log("setStartAndEndTime", "Enter");
		this._startAndEndTime.setText(startAndEndTime);
		this._log("setStartAndEndTime", "Exit");
	};

	/**
	 * @method setGenresText
	 * @param {String} genres
	 */
	Summary.prototype.setGenresText = function (genres) {
		this._log("setGenresText", "Enter");
		this._genres.setText(genres);
		this._log("setGenresText", "Exit");
	};

	/**
	 * @method showInOptionsMode
	 */
	Summary.prototype.showInOptionsMode = function () {
		this._log("showInOptionsMode", "Enter");
		this.hideSummaryDetail();
		this.showTitle();
		this.showSeasonAndEpisode();
		this.show();
		this._log("showInOptionsMode", "Exit");
	};

	Summary.prototype.showDefaultSummary = function (eventInfo, isOptionsMode, service, channelUri, isCatchupEvent, isEmptyChannel) {
		this._log("showDefaultSummary", "Enter");
		if (!isOptionsMode) {
			this.showSummaryDetail();
		}
		this.setStartAndEndTime(eventInfo.startEndTime);
		this.showTitle();
		if (eventInfo) {
			this.setTitle(eventInfo.title);
			this.setDescription(eventInfo.description);
			this.setGenresText(eventInfo.genres);

			this.setSeasonAndEpisode(eventInfo.seasonEpisodeShort);
			this.updateIcons(eventInfo);
		}
		this._parentalRatingIcon.update(eventInfo);
		this.setTextOpacity(!service.isSubscribed ? this._TEXT_OPACITY_NOT_SUBSCRIBED : this._TEXT_OPACITY_SUBSCRIBED);
		this._pipWindow.updatePipVideo(eventInfo, service.uri, channelUri, isCatchupEvent);
		this.showSummary(isEmptyChannel);
		this._log("showDefaultSummary", "Exit");
	};

	/**
	 * @method showNoInfoSummary
	 * @param {Object} eventInfo
	 * @param {String} channelUri
	 * @param {String} serviceUri
	 */
	Summary.prototype.showNoInfoSummary = function (eventInfo, channelUri, serviceUri) {
		this._log("showNoInfoSummary", "Enter");
		this.hideSummaryDetail();
		this.setTitle(eventInfo.title);
		this.setDescription("");
		this.setSeasonAndEpisode("");
		this.setGenresText("");
		this.setStartAndEndTime("");
		this.showTitle();
		this._pipWindow.updatePipVideoNoInfo(eventInfo.isEventShowingNow, serviceUri, channelUri);
		this._parentalRatingIcon.update();
		this._log("showNoInfoSummary", "Exit");
	};

	Summary.prototype.showLockedSummary = function (eventInfo, isAdultChannel) {
		this._log("showLockedSummary", "Enter");
		this.showSummaryDetail();
		this.hideIcons();
		this._pipWindow.hideBlockedText();
		this.showTitle();
		this.setStartAndEndTime(eventInfo.startEndTime);
		this.setDescription(Summary.getString("synopsisUnavailable"));
		if (isAdultChannel) {
			this.setTitle(Summary.getString("adultContent"));
			this.setSeasonAndEpisode("");
			/*stop pip video or hide event image*/
			this._pipWindow.updatePipLockedMessage(eventInfo, isAdultChannel);
		} else {
			this.setTitle(eventInfo.title);
			this.setSeasonAndEpisode(eventInfo.seasonEpisodeShort);
			this.setDescription(eventInfo.description);
			this._pipWindow.loadEventImage(eventInfo);
		}
		this.show();

		if (eventInfo) {
			this.setGenresText(eventInfo.genres);
			this.updateIcons(eventInfo);
		}
		this._parentalRatingIcon.update(eventInfo);
		this._log("showLockedSummary", "Exit");
	};

	/**
	 * @method updateSummary
	 * @param {Object} eventInfo
	 * @param {Object} service
	 * @param {String} channelUri
	 * @param {Boolean} isEmptyChannel
	 * @param {Boolean} isCatchupEvent
	 * @param {Boolean} isOptionsMode
	 */
	Summary.prototype.updateSummary = function (eventInfo, service, channelUri, isEmptyChannel, isCatchupEvent, isOptionsMode) {
		this._pipWindow.rePositionPipWindow(false); //passing false to identify the call is made from ListGuide.
		if (eventInfo.isLocked) {
			this.showLockedSummary(eventInfo, $N.app.genreUtil.isAdultChannel(service));
		} else {
			this._pipWindow.hideBlockedText();
			if (eventInfo.title === Summary.getString("noEventTitle")) {
				this.showNoInfoSummary(eventInfo, channelUri, service.uri);
			} else {
				this.showDefaultSummary(eventInfo, isOptionsMode, service, channelUri, isCatchupEvent, isEmptyChannel);
			}
		}
		this.fadeSummary(eventInfo);
	};

	Summary.prototype.setTextOpacity = function (textOpacity) {
		this.setTitleProperties({opacity: textOpacity});
		this.setDescriptionProperties({opacity: textOpacity});
	};

	/**
	 * Method to stop pip video when open other context
	 * @method stopPip
	 */
	Summary.prototype.stopPip = function () {
		this._pipWindow.stopPip();
	};

	/**
	 * @method showSummary
	 * @public
	 */
	Summary.prototype.showSummary = function (isEmptyChannel) {
		this._log("showSummary", "Enter");
		if (!isEmptyChannel) {
			this.showEventDetails();
			this.show();
		}
		this._log("showSummary", "Exit");
	};

	/**
	 * @method fadeSummary
	 * @param {Object} event
	 * @public
	 */
	Summary.prototype.fadeSummary = function (event) {
		this._log("fadeSummary", "Enter");
		this._summaryFade.setVisible(!event.isCatchUp && event.endTime < Date.now());
		this._log("fadeSummary", "Exit");
	};


	/**
	 * @method showSummaryDetail
	 * @public
	 */
	Summary.prototype.showSummaryDetail = function () {
		this._log("showSummaryDetail", "Enter");
		this.showSeasonAndEpisode();
		this.showEventDetails();
		this._log("showSummaryDetail", "Exit");
	};


	/**
	 * @method hideSummaryDetail
	 * @public
	 */
	Summary.prototype.hideSummaryDetail = function () {
		this._log("hideSummaryDetail", "Enter");
		this.hideSeasonAndEpisode();
		this.hideEventDetails();
		this._log("hideSummaryDetail", "Exit");
	};

	/**
	 * @method updateIcons
	 * @param {Number} event - the current event
	 */
	Summary.prototype.updateIcons = function (event) {
		this._log("updateIcons", "Enter");
		this._recordIcon.update(event);
		this._reminderIcon.update(event);
		this._startOverIcon.update(event);
		this._log("updateIcons", "Exit");
	};

	/**
	 * @method showSeasonAndEpisode
	 */
	Summary.prototype.showSeasonAndEpisode = function () {
		this._log("showSeasonAndEpisode", "Enter & Exit");
		this._seasonAndEpisode.show();
	};

	/**
	 * @method hideSeasonAndEpisode
	 */
	Summary.prototype.hideSeasonAndEpisode = function () {
		this._log("hideSeasonAndEpisode", "Enter & Exit");
		this._seasonAndEpisode.hide();
	};

	/**
	 * @method setTitleProperties
	 * @param {Object} properties
	 */
	Summary.prototype.setTitleProperties = function (properties) {
		this._title.configure(properties);
	};

	/**
	 * @method setDescriptionProperties
	 * @param {Object} properties
	 */
	Summary.prototype.setDescriptionProperties = function (properties) {
		this._description.configure(properties);
	};

	/**
	 * @method hideEventDetails
	 */
	Summary.prototype.hideEventDetails = function () {
		this._log("hideEventDetails", "Enter");
		this._startAndEndTime.hide();
		this._genres.hide();
		this._description.hide();
		this.hideIcons();
		this._pipWindow.hideEventImage();
		this._pipWindow.hideBlockedText();
		this._log("hideEventDetails", "Exit");
	};

	/**
	 * @method showEventDetails
	 */
	Summary.prototype.showEventDetails = function () {
		this._log("showEventDetails", "Enter");
		this._startAndEndTime.show();
		this._genres.show();
		this._parentalRatingIcon.show();
		this._description.show();
		this._log("showEventDetails", "Exit");
	};

	/**
	 * @method hideIcons
	 */
	Summary.prototype.hideIcons = function () {
		this._log("hideIcons", "Enter");
		this._parentalRatingIcon.hide();
		this._reminderIcon.hide();
		this._recordIcon.hide();
		this._startOverIcon.hide();
		this._log("hideIcons", "Exit");
	};

	/**
	 * @method getClassName
	 */
	Summary.prototype.getClassName = function () {
		return "Summary";
	};

	/**
	 * @method setCurrentChannel
	 * @param {Object} channel object
	 */
	Summary.prototype.setFocusedChannel = function (channelObj) {
		this._pipWindow.setFocusedChannel(channelObj);
	};

	/**
	 * @method setFocusedEvent
	 * @param {Object} channel object
	 */
	Summary.prototype.setFocusedEvent = function (eventObj) {
		this._log("setFocusedEvent", "Enter");
		this._pipWindow.setFocusedEvent(eventObj);
		this._log("setFocusedEvent", "Exit");
	};

	Summary.prototype.onEventChange = function () {
		this._log("onEventChange", "Enter");
		this._pipWindow.onEventChange();
		this._log("onEventChange", "Exit");
	};

	/**
	 * @method showHideSmallVideoArea
	 * @param {Boolean} true for show small video area
	 */
	Summary.prototype.showHideSmallVideoArea = function (show) {
		this._pipWindow.showHideSmallVideoArea(show);
	};

	/**
	 * Method to register event listener
	 * @method registerSmallVideoPlayerCallbacks
	 * @private
	 */
	Summary.prototype.registerSmallVideoPlayerCallbacks = function () {
		this._pipWindow.registerSmallVideoPlayerCallbacks();
	};

	/**
	 * Method to unregister event listener
	 * @method unregisterSmallVideoPlayerCallbacks
	 * @private
	 */
	Summary.prototype.unregisterSmallVideoPlayerCallbacks = function () {
		this._pipWindow.unregisterSmallVideoPlayerCallbacks();
	};

	/**
	 * Method to start pip video stream and register pip event listener when exit
	 * @method activatePip
	 */
	Summary.prototype.activatePip = function () {
		this.registerSmallVideoPlayerCallbacks();
		this._pipWindow.showHideSmallVideoArea(false);
	};

	/**
	 * Method to stop pip video stream when switch between events
	 * @method deactivatePip
	 */
	Summary.prototype.deactivatePip = function () {
		this._pipWindow.showHideSmallVideoArea(false);
		this._pipWindow.deactivatePIPVideo();
	};

	$N.gui = $N.gui || {};
	$N.gui.Summary = Summary;
}($N || {}));
