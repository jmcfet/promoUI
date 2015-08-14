/**
 * This class displays information about a highlighted programme
 *
 * @class $N.gui.MiniguidePip
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
	var me = null;
	function MiniguidePip(docRef, parent) {
		MiniguidePip.superConstructor.call(this, docRef);
		$N.apps.core.Language.adornWithGetString(MiniguidePip);
		me = this;

		this._contentStartFailed = $N.app.constants.CA_PLAY_ERRORS.contentStartFailedReason;
		this._contentError = $N.app.constants.CA_PLAY_ERRORS.contentErrorReason;
		this._streamDisabled = $N.app.constants.CA_PLAY_ERRORS.streamDisabledReason;

		this._log = new $N.apps.core.Log("CommonGUI", "MiniguidePip");
		this._container = new $N.gui.Group(docRef);

		this._pipWindow = new $N.gui.Pip(this._docRef, this._container);
		this._rootSVGRef = this._container.getRootSVGRef();

		if (parent) {
			parent.addChild(this);
		}
	}
	$N.gui.Util.extend(MiniguidePip, $N.gui.GUIObject);

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	MiniguidePip.prototype.setWidth = function (width) {
		this._container.setWidth(width);
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	MiniguidePip.prototype.setHeight = function (height) {
		this._container.setHeight(height);
	};

	/**
	 * @method setIsPIPEnabled
	 * @param {Boolean} isPIPEnabled
	 */
	MiniguidePip.prototype.setIsPIPEnabled = function (isPIPEnabled) {
		this._pipWindow.setIsPIPEnabled(isPIPEnabled);
	};

	/**
	 * @method getEventImageHref()
	 * @returns {String} eventImageHref
	 */
	MiniguidePip.prototype.getEventImageHref = function () {
		this._pipWindow.getEventImageHref();
	};

	/**
	 * @method showDefaultSummary
	 */
	MiniguidePip.prototype.showDefaultSummary = function (eventInfo, isOptionsMode, service, channelUri, isCatchupEvent, isEmptyChannel) {
		this._log("showDefaultSummary", "Enter");
		if (!isOptionsMode) {
			this.showSummaryDetail();
		}
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
	MiniguidePip.prototype.showNoInfoSummary = function (eventInfo, channelUri, serviceUri) {
		this._log("showNoInfoSummary", "Enter");
		this.hideSummaryDetail();
		this._pipWindow.updatePipVideoNoInfo(eventInfo.isEventShowingNow, serviceUri, channelUri);
		this._log("showNoInfoSummary", "Exit");
	};

	MiniguidePip.prototype.showLockedSummary = function (eventInfo, isAdultChannel) {
		this._log("showLockedSummary", "Enter");
		this.showSummaryDetail();
		/*stop pip video or hide event image*/
		this._pipWindow.updatePipLockedMessage(eventInfo, isAdultChannel);
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
	MiniguidePip.prototype.updateSummary = function (eventInfo, service, channelUri, isEmptyChannel, isCatchupEvent, isOptionsMode) {
		if (eventInfo.isLocked) {
			this.showLockedSummary(eventInfo, $N.app.genreUtil.isAdultChannel(service));
		} else {
			this._pipWindow.hideBlockedText();
			if (eventInfo.title === MiniguidePip.getString("noEventTitle")) {
				this.showNoInfoSummary(eventInfo, channelUri, service.uri);
			} else {
				this.showDefaultSummary(eventInfo, isOptionsMode, service, channelUri, isCatchupEvent, isEmptyChannel);
			}
		}
	};

	/**
	 * Method to stop pip video when open other context
	 * @method stopPip
	 */
	MiniguidePip.prototype.stopPip = function () {
		this._pipWindow.stopPip();
	};

	/**
	 * @method showSummary
	 * @public
	 */
	MiniguidePip.prototype.showSummary = function (isEmptyChannel) {
		this._log("showSummary", "Enter");
		if (!isEmptyChannel) {
			this.show();
		}
		this._log("showSummary", "Exit");
	};

	/**
	 * @method fadeSummary
	 * @param {Object} event
	 * @public
	 */
	MiniguidePip.prototype.fadeSummary = function (event) {
		this._log("fadeSummary", "Enter");
		this._log("fadeSummary", "Exit");
	};


	/**
	 * @method showSummaryDetail
	 * @public
	 */
	MiniguidePip.prototype.showSummaryDetail = function () {
		this._log("showSummaryDetail", "Enter");
		this._log("showSummaryDetail", "Exit");
	};


	/**
	 * @method hideSummaryDetail
	 * @public
	 */
	MiniguidePip.prototype.hideSummaryDetail = function () {
		this._log("hideSummaryDetail", "Enter");
		this.hideEventDetails();
		this._log("hideSummaryDetail", "Exit");
	};

	/**
	 * @method hideEventDetails
	 */
	MiniguidePip.prototype.hideEventDetails = function () {
		this._log("hideEventDetails", "Enter");
		this._pipWindow.hideEventImage();
		this._pipWindow.hideBlockedText();
		this._log("hideEventDetails", "Exit");
	};

	/**
	 * @method getClassName
	 */
	MiniguidePip.prototype.getClassName = function () {
		return "MiniguidePip";
	};

	/**
	 * @method setCurrentChannel
	 * @param {Object} channel object
	 */
	MiniguidePip.prototype.setFocusedChannel = function (channelObj) {
		this._pipWindow.setFocusedChannel(channelObj);
	};

	/**
	 * @method setFocusedEvent
	 * @param {Object} channel object
	 */
	MiniguidePip.prototype.setFocusedEvent = function (eventObj) {
		this._log("setFocusedEvent", "Enter");
		this._pipWindow.setFocusedEvent(eventObj);
		this._log("setFocusedEvent", "Exit");
	};

	MiniguidePip.prototype.onEventChange = function () {
		this._log("onEventChange", "Enter");
		this._pipWindow.onEventChange();
		this._log("onEventChange", "Exit");
	};

	/**
	 * @method showHideSmallVideoArea
	 * @param {Boolean} true for show small video area
	 */
	MiniguidePip.prototype.showHideSmallVideoArea = function (show) {
		this._pipWindow.showHideSmallVideoArea(show);
	};

	/**
	 * Method to register event listener
	 * @method registerSmallVideoPlayerCallbacks
	 * @private
	 */
	MiniguidePip.prototype.registerSmallVideoPlayerCallbacks = function () {
		this._pipWindow.registerSmallVideoPlayerCallbacks();
	};

	/**
	 * Method to unregister event listener
	 * @method unregisterSmallVideoPlayerCallbacks
	 * @private
	 */
	MiniguidePip.prototype.unregisterSmallVideoPlayerCallbacks = function () {
		this._pipWindow.unregisterSmallVideoPlayerCallbacks();
	};

	/**
	 * Method to start pip video stream and register pip event listener when exit
	 * @method activatePip
	 */
	MiniguidePip.prototype.activatePip = function () {
		this.registerSmallVideoPlayerCallbacks();
		this._pipWindow.activatePip();
	};

	/**
	 * Method to stop pip video stream when switch between events
	 * @method deactivatePip
	 */
	MiniguidePip.prototype.deactivatePip = function () {
		this._pipWindow.deactivatePIPVideo();
	};
	/**
	 * Method to handle pip activated listener
	 * @method pipActivatedListener
	 * @private
	 */
	MiniguidePip.prototype.pipActivatedListener = function (pipData) {
		me.setIsPIPEnabled(true);
		if (pipData) {
			var isEmptyChannel = false,
				eventInfo = pipData.data ? pipData.data.eventInfo : pipData.eventInfo,
				isOptionsMode = false,
				isCatchupEvent = false;
			isCatchupEvent = eventInfo.isCatchUp;
			me._pipWindow.rePositionPipWindow(true);
			me.setFocusedEvent(eventInfo);
			me.setFocusedChannel(pipData.data || pipData);
			me.updateSummary(eventInfo, (pipData.data || pipData), (pipData.data ? pipData.data.uri : pipData.uri), isEmptyChannel, isCatchupEvent, isOptionsMode);
			me.activatePip();
		}
	};

	/**
	 * Method to handle pip de-activated listener
	 * @method pipDeActivatedListener
	 * @private
	 */
	MiniguidePip.prototype.pipDeActivatedListener = function (pipData) {
		me.setIsPIPEnabled(false);
		me.stopPip();
	};

	/**
	 * Method to handle pip de-activated listener on stand-by mode
	 * @method pipDeActivatedListenerOnStandBy
	 * @private
	 */
	MiniguidePip.prototype.pipDeActivatedListenerOnStandBy = function () {
		$N.app.FeatureManager.setIsPIPActive(false);
		me.pipDeActivatedListener();
	};

	/**
	 * Method to register pip activated listener
	 * @method registerPipActivatedEvent
	 * @private
	 */
	MiniguidePip.prototype.registerPipEvents = function () {
		$N.apps.util.EventManager.subscribe("SYSTEM_POWER_STANDBY", this.pipDeActivatedListenerOnStandBy, MiniguidePip);
		$N.apps.util.EventManager.subscribe("pipActivated", this.pipActivatedListener, MiniguidePip);
		$N.apps.util.EventManager.subscribe("pipDeActivated", this.pipDeActivatedListener, MiniguidePip);
	};

	$N.gui = $N.gui || {};
	$N.gui.MiniguidePip = MiniguidePip;
}($N || {}));
