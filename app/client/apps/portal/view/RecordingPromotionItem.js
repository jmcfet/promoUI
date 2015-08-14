/**
 *
 * @class $N.gui.RecordingPromotionItem
 * @constructor
 * @namespace $N.gui
 * @requires $N.gui.Util
 * @requires $N.gui.Label
 * @extends $N.gui.PromotionItem
 *
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */
(function ($N) {
	function RecordingPromotionItem(docRef, parent) {
		RecordingPromotionItem.superConstructor.call(this, docRef, parent);
		$N.apps.core.Language.adornWithGetString(RecordingPromotionItem, "customise/resources/");
		this._eventId = null;
		this._gotoDVRLibrary = false;
		this._recordingObj = null;
		this._pinHelper = null;
		this._LOGO_SIZE = 96;
		this._TITLE_X = 120;
		this._ICON_PADDING = 12;
		this._ICON_PADDING_RIGHT = 4;

		this._channelLogo = new $N.gui.ChannelLogo(this._docRef, this._container);
		this._topRow = new $N.gui.Container(this._docRef, this._container);
		this._scrollingTitle = new $N.gui.DelayedScrollingLabel(this._docRef, this._topRow);	// May redefine to _title?
		this._activeRecordIcon = new $N.gui.ActiveRecordIcon(this._docRef, this._topRow);
		this._bottomRow = new $N.gui.Container(this._docRef, this._container);
		this._eventDetails = new $N.gui.InlineLabel(this._docRef, this._bottomRow);
		this._partialRecordIcon = new $N.gui.PartialRecordIcon(this._docRef, this._bottomRow);

		this._container.configure({
			height: this._LOGO_SIZE
		});
		this._channelLogo.configure({
			width: this._LOGO_SIZE,
			height: this._LOGO_SIZE
		});

		this._topRow.configure({
			x: this._TITLE_X,
			y: 6,
			width: 453,
			cssClass: "recordingPromotionItemTopRow"
		});

		this._bottomRow.configure({
			x: this._TITLE_X,
			y: 54
		});

		this._eventDetails.configure({
			cssClass: "recordingPromotionItemEventDetails"
		});

		this._scrollingTitle.configure({
			duration: "250ms",
			cssClass: "promotionItemTitle"
		});
		this._scrollingTitle._container.addCssClass("recordingPromotionItemTitle");
		this._activeRecordIcon.configure({
			cssClass: "portalRecordIcon"
		});
		this._partialRecordIcon.setCssClass("portalPartialRecordIcon");
		this._backgroundGradient.configure({
			x: 0,
			y: 0,
			height: this._DEFAULT_GRADIENT_HEIGHT,
			cssClass: "portalHighlightUnderlay",
			visible: false
		});
	}
	$N.gui.Util.extend(RecordingPromotionItem, $N.gui.PromotionItem);

	/**
	 * @method reset
	 */
	RecordingPromotionItem.prototype.reset = function () {
		this._backgroundGradient.hide();
		this._channelLogo.hide();
		if (this._scrollingTitle.isVisible()) {
			this._scrollingTitle.stop();
		}
		this._eventDetails.setText("");
	};

		/**
	 * @method _getTask
	 * @return {Object} task
	 */
	RecordingPromotionItem.prototype._getTask = function () {
		var includeActiveRecordingsOnly = false;
		return $N.platform.btv.PVRManager.getTask(
			this._taskId,
			$N.platform.btv.PVRManager.WIDE_TASK_FIELD_FILTER,
			includeActiveRecordingsOnly
		);
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	RecordingPromotionItem.prototype.setHeight = function (height) {
		this._height = height;
		this._container.setHeight(this._LOGO_SIZE);
		this._backgroundGradient.setHeight(this._LOGO_SIZE);
	};

	/**
	 * @method update
	 */
	RecordingPromotionItem.prototype.update = function () {
	};

	/**
	 * This helper function shows a logo for the current event
	 * @method _showEventInfo
	 */
	RecordingPromotionItem.prototype._showEventInfo = function () {
		var channelObject,
			language = $N.platform.system.Preferences.get($N.app.constants.PREF_LANGUAGE);
		if (this._serviceId) {
			channelObject = $N.platform.btv.EPG.getChannelByServiceId(this._serviceId) || {};
			if (this._gotoDVRLibrary) {
				this._channelLogo.update(channelObject, $N.app.constants.NET_IMAGES_PATH + "all_recordings_icon_with_stroke.png");
				this._channelLogo.show();
			} else {
				if (channelObject) {
					this._channelLogo.update(channelObject);
					this._channelLogo.show();
				} else {
					this._channelLogo.hide();
				}
			}
		}
	};

	/**
	 * @method _updateRecordIcon
	 * @param {String} eventId
	 * @private
	 */
	RecordingPromotionItem.prototype._updateRecordIcon = function (eventId) {
		var task = null;
		if (this._taskId) {
			task = this._getTask();
			this._activeRecordIcon.updateByTask(task);
			this._partialRecordIcon.updateByTask(task);
		} else {
			this._activeRecordIcon.hide();
			this._partialRecordIcon.hide();
		}
	};

	/**
	 * @method setGotoDVRLibrary
	 * @param {Boolean} gotoDVRMenu
	 */
	RecordingPromotionItem.prototype.setGotoDVRLibrary = function (gotoDVRMenu) {
		this._gotoDVRLibrary = gotoDVRMenu;
	};

	/**
	 * This method sets a local _serviceId
	 * @method setServiceId
	 * @param {String} serviceId
	 */
	RecordingPromotionItem.prototype.setServiceId = function (serviceId) {
		this._serviceId = serviceId;
	};

	/**
	 * This method sets a local eventId and then calls showEventInfo that shows the logo
	 * @method setEventId
	 * @param {String} eventId
	 */
	RecordingPromotionItem.prototype.setEventId = function (eventId) {
		this._eventId = eventId;
		this._showEventInfo();
	};

	/**
	 * @method setGotoDVRLibrary
	 * @param {Boolean} gotoDVRMenu
	 */
	RecordingPromotionItem.prototype.setGotoDVRLibrary = function (gotoDVRMenu) {
		this._gotoDVRLibrary = gotoDVRMenu;
	};

	/**
	 * @method setTaskId
	 * @param {String} taskId
	 */
	RecordingPromotionItem.prototype.setTaskId = function (taskId) {
		this._taskId = taskId;
	};

	/**
	 * @method setStartTime
	 * @param {String} startTime
	 */
	RecordingPromotionItem.prototype.setStartTime = function (startTime) {
		this._startTime = startTime;
	};

	/**
	 * @method setText
	 * @param {String} text
	 */
	RecordingPromotionItem.prototype.setText = function (text) {
		this._updateRecordIcon(this._eventId);
		this._scrollingTitle.setText(text, true);
	};

	/**
	 * @method highlight
	 */
	RecordingPromotionItem.prototype.highlight = function () {
		this._backgroundGradient.show();
		if (this._scrollingTitle.isVisible()) {
			this._scrollingTitle.start();
		}
	};

	/**
	 * @method unHighlight
	 */
	RecordingPromotionItem.prototype.unHighlight = function () {
		this._backgroundGradient.hide();
		if (this._scrollingTitle.isVisible()) {
			this._scrollingTitle.stop();
		}
	};

	/**
	 * @method setEventDetails
	 * @param {String} eventDetails
	 */
	RecordingPromotionItem.prototype.setEventDetails = function (eventDetails) {
		this._eventDetails.setText(eventDetails);
	};

	/**
	 * @method setRecordingObj
	 * @param {Object} recordingObj
	 */
	RecordingPromotionItem.prototype.setRecordingObj = function (recordingObj) {
		this._recordingObj = recordingObj;
	};



	/**
	 * @method _playVideo
	 */
	RecordingPromotionItem.prototype._playVideo = function () {
		var title = this._scrollingTitle.getText() + " " + this._eventDetails.getText(),
			message = RecordingPromotionItem.getString("resumeRecordingDialogueSubTitle"),
			task = this._getTask(),
			date = $N.apps.util.Util.formatDate(new Date(task.startTime), "dd/mm"),
			channelLogo = $N.app.epgUtil.getChannelLogoUrl(task.serviceId),
			config = $N.app.PVRUtil.getVideoConfig(
				this._scrollingTitle.getText() + this._eventDetails.getText(),
				'',
				0,
				date,
				channelLogo,
				task
			),
			RESUME_OPTION,
			me,
			RESTART_OPTION,
			buttonArray,
			dialogCallback,
			dialog;

		config.dontRestartStream = false;
		config.atEndOfPlayBack = false;
		config.playingEvent = task;

		if (task.bookmark) {
			RESUME_OPTION = 1;
			me = this;
			RESTART_OPTION = 2;
			buttonArray = [{
				name: RecordingPromotionItem.getString("resumeRecordingDialogueWatch"),
				action: RESUME_OPTION
			}, {
				name: RecordingPromotionItem.getString("resumeRecordingDialogueRestart"),
				action: RESTART_OPTION
			}];
			dialogCallback = function (popupResult) {
				if (popupResult && (popupResult.action === RESTART_OPTION || popupResult.action === RESUME_OPTION)) {
					if (popupResult.action === RESTART_OPTION) {
						// clear the bookmark and dont jump to position & reload
						$N.platform.btv.PVRManager.saveBookmark({taskId: me._taskId}, 0, 0);
						config.clearBookmark = true;
					}
					$N.app.ContextHelper.openContext("MEDIAPLAYER", {activationContext: config});
				}
			};

			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_PORTAL_RESUME_RECORDING,
				title,
				message,
				buttonArray,
				dialogCallback,
				null, // no option highlighted callback
				"VERTICAL", // orientation
				null, // no title image
				null, // no dialog config object
				false  // show alert icon
				);
			$N.app.DialogueHelper.updateDialogueTitleAndMessage($N.app.constants.DLG_PORTAL_RESUME_RECORDING, title, message);
		} else {
			$N.app.ContextHelper.openContext("MEDIAPLAYER", {activationContext: config});
		}
	};

	/**
	 * @method _pinKeyPressCallback
	 * @private
	 * @param {Number} value
	 * @param {String} key
	 */
	RecordingPromotionItem.prototype._pinKeyPressCallback = function (value, key) {
		var me = this,
			callback = function () {
				if (me._pinHelper) {
					me._pinHelper.hideDialog();
				}
			};
		if (this._pinHelper) {
			this._pinHelper.handlePinKeyPressCallback(key, callback);
		}
	};

	/**
	 * @method _pinCancelledCallback
	 * @private
	 */
	RecordingPromotionItem.prototype._pinCancelledCallback = function () {
		if (this._pinHelper) {
			this._pinHelper.hideDialog();
		}
	};

	/**
	 * @method _checkRatingAndShowSynopsis
	 * @private
	 */
	RecordingPromotionItem.prototype._checkRatingAndShowSynopsis = function (recordingObj) {
		var task = this._getTask(),
			successCallback =  function (data) {
				$N.app.PVRUtil.navigateToSynopsis(data);
			};
		if ($N.app.PVRUtil.isTaskBlockedSynopsis(task)) {
			$N.app.ParentalControlUtil.parentalDialog(task, successCallback, this._pinCancelledCallback, this._pinKeyPressCallback);
		} else {
			$N.app.PVRUtil.navigateToSynopsis(recordingObj);
		}
	};
	/**
	 * @method _checkRatingAndPlayVideo
	 * @private
	 */
	RecordingPromotionItem.prototype._checkRatingAndPlayVideo = function () {
		var task = this._getTask(),
			me = this,
			dialogButtons = [{name: "OK", action: 1}],
			successCallback =  function (data) {
				me._playVideo(data);
			},
			isManualRecording,
			isTaskBlockedPlaying,
			isTaskBlocked;
		if ($N.platform.btv.PVRManager.getTaskAuthorizationStatus(task)) {
			isManualRecording = $N.app.ManualRecordingHelper.isManualRecordingTask(task);
			isTaskBlockedPlaying = $N.app.PVRUtil.isTaskBlockedPlaying(task);
			isTaskBlocked = $N.app.PVRUtil.isTaskBlocked(task);
			if (!isManualRecording && (isTaskBlockedPlaying || isTaskBlocked)) {
				$N.app.ParentalControlUtil.parentalDialog(task, successCallback, this._pinCancelledCallback, this._pinKeyPressCallback);
			} else {
				this._playVideo();
			}
		} else {
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_UNAUTHORISED_RECORDING,
				RecordingPromotionItem.getString("unauthorizedRecordingTitle"),
				RecordingPromotionItem.getString("unauthorizedRecordingText"),
				dialogButtons);
		}
	};
	/**
	 * @method _cancelRecording
	 * @private
	 */
	RecordingPromotionItem.prototype._cancelRecording = function () {
		if ($N.platform.btv.PVRManager.isTaskRecordingNow(this._taskId)) {
			$N.app.PVRUtil.cancelTask(this._recordingObj);
		}
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	RecordingPromotionItem.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;
		switch (key) {
		case keys.KEY_OK:
			if (this._gotoDVRLibrary) {
				$N.app.ContextHelper.openContext("LIBRARY");
			} else {
				this._checkRatingAndPlayVideo();
			}
			handled = true;
			break;
		case keys.KEY_PLAY_PAUSE:
			this._checkRatingAndPlayVideo();
			handled = true;
			break;
		case keys.KEY_RED:
		case keys.KEY_INFO:
			if (this._recordingObj) {
				this._checkRatingAndShowSynopsis(this._recordingObj);
			}
			handled = true;
			break;
		case keys.KEY_STOP:
			this._cancelRecording();
			handled = true;
			break;
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	/**
	 * @method setDataMapper
	 * @param {Object} dataMapper
	 */
	RecordingPromotionItem.prototype.setDataMapper = function (dataMapper) {
		this._channelLogo.setDataMapper(dataMapper);
	};

	$N.gui = $N.gui || {};
	$N.gui.RecordingPromotionItem = RecordingPromotionItem;
}(window.parent.$N || {}));
