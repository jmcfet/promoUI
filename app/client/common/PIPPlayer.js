/**
 * Helper class for controlling PIP video window
 *
 * @class PIPPlayer
 */

(function ($N) {
	/**
	 * Object constructor
	 * @method PIPPlayer
	 * @param videoTag The video tag that this playout manager is to be
	 *          associated with.
	 */
	function PIPPlayer(videoTag) {

		PIPPlayer.superConstructor.call(this, videoTag);

		var me = this;
		this._log = new $N.apps.core.Log("HELPER", "PIPPlayer");
		this.sourceWindowYforGuide = 557;
		this.sourceWindowYforMiniGuide = 59;
		this._PIP_POSITION = null;
		this._PIP_POSITIONS = {
			LARGE_TOP_RIGHT: 1,
			SMALL_TOP_RIGHT: 2,
			LARGE_TOP_LEFT: 3,
			SMALL_TOP_LEFT: 4
		};
		this.smallVideoGroup = null;
	}

	$N.apps.util.Util.extend(PIPPlayer, $N.platform.output.VideoPlayer);
	/**
	 * @method _largePipVideoConfigure
	 * @param {Number} x position of PIP window
	 */
	PIPPlayer.prototype._largePipVideoConfigure = function (xValue) { //used in Zapper
		this._log("_largePipVideoConfigure", "Enter & Exit");
		this.sourceWindowX = this.windowX = (xValue);
		this.sourceWindowY = this.windowY = (this.sourceWindowYforMiniGuide);
		this.sourceWindowW = this.windowW = (282);
		this.sourceWindowH = this.windowH = (159);
	};

	/**
	 * @method _smallPipVideoConfigure
	 * @param {Number} x position of PIP window
	 */
	PIPPlayer.prototype._smallPipVideoConfigure = function (xValue) { //used in Zapper
		this._log("_smallPipVideoConfigure", "Enter & Exit");
		this.sourceWindowX = this.windowX = xValue;
		this.sourceWindowY = this.windowY = this.sourceWindowYforMiniGuide;
		this.sourceWindowW = this.windowW = 212;
		this.sourceWindowH = this.windowH = 120;
	};

	/**
	 * @method _normalPipVideoConfigure
	 */
	PIPPlayer.prototype._normalPipVideoConfigure = function () { //used in List/grid Guide
		this._log("_smallPipVideoConfigure", "Enter & Exit");
		this.sourceWindowX = this.windowX = 1000;
		this.sourceWindowY = this.windowY = this.sourceWindowYforGuide;
		this.sourceWindowW = this.windowW = 225;
		this.sourceWindowH = this.windowH = 129;
	};

	PIPPlayer.prototype.rePositionPipWindow = function (isFromMiniguide) {
		// Work is under progress for pip in miniguide. Have to get the values from Settings when implemented.
		if (isFromMiniguide) {
			this._PIP_POSITION = parseInt($N.platform.system.Preferences.get($N.app.constants.PREF_MINIGUIDE_PIP_POSITION), 10) || $N.app.constants.PIP_POSITION_DEFAULT;
			var sourceWindowXPosition = null,
				X_POSTION_LARGE_TOP_RIGHT_PIP = 939,
				X_POSTION_SMALL_TOP_RIGHT_PIP = 1009,
				X_POSTION_IN_TOP_LEFT_PIP = 59;
			switch (this._PIP_POSITION) {
			case this._PIP_POSITIONS.LARGE_TOP_RIGHT:
				sourceWindowXPosition = X_POSTION_LARGE_TOP_RIGHT_PIP; // X position for LARGE_TOP_RIGHT PIP window
				this._largePipVideoConfigure(sourceWindowXPosition);
				break;
			case this._PIP_POSITIONS.SMALL_TOP_RIGHT:
				sourceWindowXPosition = X_POSTION_SMALL_TOP_RIGHT_PIP; // X position for SMALL_TOP_RIGHT PIP window
				this._smallPipVideoConfigure(sourceWindowXPosition);
				break;
			case this._PIP_POSITIONS.LARGE_TOP_LEFT:
				sourceWindowXPosition = X_POSTION_IN_TOP_LEFT_PIP; // X position for LARGE_TOP_LEFT PIP window
				this._largePipVideoConfigure(sourceWindowXPosition);
				break;
			case this._PIP_POSITIONS.SMALL_TOP_LEFT:
				sourceWindowXPosition = X_POSTION_IN_TOP_LEFT_PIP; // X position for SMALL_TOP_LEFT PIP window
				this._smallPipVideoConfigure(sourceWindowXPosition);
				break;
			}
		} else {
			this._normalPipVideoConfigure();
		}
		this.resetPipWindow();
	};

	/**
	 * @method initialise
	 * @param {Object} view
	 */
	PIPPlayer.prototype.initialise = function (view) {
		this._log("initialise", "Enter & Exit");
		this.smallVideoGroup = view.smallVideoGroup;
		this.sourceWindowX = this.windowX = view.smallVideoGroup.smallScreenBorder.getX();
		this.sourceWindowY = this.windowY = view.smallVideoGroup.smallScreenBorder.getY();
		this.sourceWindowW = this.windowW = view.smallVideoGroup.smallScreenBorder.getWidth();
		this.sourceWindowH = this.windowH = view.smallVideoGroup.smallScreenBorder.getHeight();
	};

	/**
	 * @method updatePipWindow
	 * @param {Number} x position of PIP window
	 * @param {Number} width of PIP window
	 */
	PIPPlayer.prototype.updatePipWindow = function (x, width) {
		this._log("updatePipWindow");
		this.smallVideoGroup.setX(x);
		this.smallVideoGroup.setWidth(width);
		this.smallVideoGroup.smallScreenVideo.setX(-2 * 1.5);

		this.smallVideoGroup.smallScreenBorder.setWidth(width);
		this.smallVideoGroup.smallScreenVideo.setWidth(width + 5);
	};
	/**
	 * @method resetPipWindow
	 * @param reset to original 16:9 size window
	 */
	PIPPlayer.prototype.resetPipWindow = function () {
		this._log("resetPipWindow");
		var ratio = 1.5,
			x = this.sourceWindowX * ratio,
			y = this.sourceWindowY * ratio,
			w = this.sourceWindowW * ratio,
			h = this.sourceWindowH * ratio;

		this.smallVideoGroup.setX(x);
		this.smallVideoGroup.setY(y);
		this.smallVideoGroup.setWidth(w);
		this.smallVideoGroup.setHeight(h);

		this.smallVideoGroup.smallScreenVideo.setX(-2 * ratio);
		this.smallVideoGroup.smallScreenVideo.setY(3 * ratio);
		this.smallVideoGroup.smallScreenBorder.setX(-3 * ratio); // setting x position for small screen border. 
		this.smallVideoGroup.smallScreenBorder.setWidth(w + 7);
		this.smallVideoGroup.smallScreenVideo.setWidth(w + 5);

		this.smallVideoGroup.smallScreenBorder.setHeight(h + 6);
		this.smallVideoGroup.smallScreenVideo.setHeight(h - 3);
	};

	/**
	 * @method requestPlayoutWithoutPlay
	 * @param {String} url
	 */
	PIPPlayer.prototype.requestPlayoutWithoutPlay = function (url) {
		this._log("requestPlayoutWithoutPlay", "Enter");

		if ($N.platform.system.Preferences.get($N.app.constants.PREF_PRM_ENABLED) !== "true") {
			if (this.tuner.getCurrentUri() !== url) {
				this.tuner.tuneWithoutPlay(url);
			}
		} else {
			this.tuner.disconnect();
		}

		this._log("requestPlayoutWithoutPlay", "Exit");
	};

	/**
	 * @method activatePIPVideoTrack
	 */
	PIPPlayer.prototype.activatePIPVideoTrack = function () {
		var videoTracks = $N.app.smallScreenPlayer.tracks.getVideoTracks();
		if (videoTracks[0]) {
			this._log("activatePIPVideoTrack_len: ", videoTracks.length + "and id:" + videoTracks[0].id);
			$N.app.smallScreenPlayer.tracks.activateTrack(videoTracks[0]);
		}
	};
	/**
	 * @method deactivatePIPVideoTrack
	 */
	PIPPlayer.prototype.deactivatePIPVideoTrack = function () {
		var videoTrack = $N.app.smallScreenPlayer.tracks.getActiveVideoTrack();
		if (videoTrack) {
			this._log("deactivatePIPVideoTrack ", videoTrack.id);
			$N.app.smallScreenPlayer.tracks.deactivateTrack(videoTrack);
		}
	};
	/**
	 * @method stopPIPVideo
	 */
	PIPPlayer.prototype.stopPIPVideo = function () {
		this._player.stop();
	};
	/**
	 * @method getVideoDetail
	 */
	PIPPlayer.prototype.getVideoDetail = function () {
		this._log("this._player.videoDetails:", this._player.videoDetails.width + " & " + this._player.videoDetails.height);
		return this._player.videoDetails;
	};

	/**
	 * If true, sets the zorder of the fullScreenPlayer videoLayer
	 * to TOP, otherwise to BOTTOM (if not already set to this value)
	 *
	 * This is a workaround for a MW issue (NO5SA2-357)
	 * in which the small screen video layer is not hideable
	 * after a playback error such as RESOURCES_LOST.
	 *
	 * @method showHideSmallVideoLayer
	 * @param {Boolean} true for show small video layer
	 */
	PIPPlayer.prototype.showHideSmallVideoLayer = function (show) {
		this._log("showHideSmallVideoLayer", "Enter: " + show);
		$N.app.fullScreenPlayer.setVideoLayerZorder(show);
		this._log("showHideSmallVideoLayer", "Exit");
	};

	/**
	 * Registers callbacks with JSFW
	 *
	 * @method registerStreamAvailableListener
	 */
	PIPPlayer.prototype.registerStreamAvailableListener = function (callback) {
		this._player.addEventListener("onStreamAvailable", callback);
	};

	/**
	 * Unregisters callbacks with JSFW
	 *
	 * @method unregisterStreamAvailableListener
	 */
	PIPPlayer.prototype.unregisterStreamAvailableListener = function (callback) {
		this._player.removeEventListener("onStreamAvailable", callback);
	};

	/**
	 * Registers callbacks with JSFW
	 *
	 * @method registerStreamEnabledListeners
	 */
	PIPPlayer.prototype.registerStreamEnabledListeners = function (callback) {
		this._player.addEventListener("onStreamEnabled", callback);
	};

	/**
	 * Unregisters callbacks with JSFW
	 *
	 * @method unregisterStreamEnabledListeners
	 */
	PIPPlayer.prototype.unregisterStreamEnabledListeners = function (callback) {
		this._player.removeEventListener("onStreamEnabled", callback);
	};

	/**
	 * Registers callbacks with JSFW
	 *
	 * @method registerBlockedCallbacks
	 */
	PIPPlayer.prototype.registerBlockedCallbacks = function (blockedCallback, unblockedCallback) {
		this._log("registerBlockedCallbacks", "Enter");
		$N.app.smallScreenPlayer.registerLockerStatusUpdateListener(blockedCallback);
		$N.app.smallScreenPlayer.registerLockerUnlockListener(unblockedCallback);
		this._log("registerBlockedCallbacks", "Exit");
	};

	/**
	 * Unregisters callbacks with JSFW
	 *
	 * @method unregisterBlockedCallbacks
	 */
	PIPPlayer.prototype.unregisterBlockedCallbacks = function (blockedCallback, unblockedCallback) {
		this._log("unregisterBlockedCallbacks", "Enter");
		$N.app.smallScreenPlayer.unregisterLockerStatusUpdateListener(blockedCallback);
		$N.app.smallScreenPlayer.unregisterLockerUnlockListener(unblockedCallback);
		this._log("unregisterBlockedCallbacks", "Exit");
	};

	/**
	 * Registers callbacks with JSFW
	 *
	 * @method registerStreamEnabledListeners
	 */
	PIPPlayer.prototype.registerStreamStoppedListeners = function (callback) {
		this._player.addEventListener("onStreamStopped", callback);
	};

	/**
	 * Unregisters callbacks with JSFW
	 *
	 * @method unregisterStreamEnabledListeners
	 */
	PIPPlayer.prototype.unregisterStreamStoppedListeners = function (callback) {
		this._player.removeEventListener("onStreamStopped", callback);
	};

	/**
	 * Registers callbacks with JSFW
	 *
	 * @method registerIframeDecodeListeners
	 */
	PIPPlayer.prototype.registerIframeDecodeListeners = function (callback) {
		this._player.addEventListener("onIframeDecode", callback);
	};

	/**
	 * Registers callbacks with JSFW
	 *
	 * @method registerIframeDecodeListeners
	 */
	PIPPlayer.prototype.unregisterIframeDecodeListeners = function (callback) {
		this._player.removeEventListener("onIframeDecode", callback);
	};

	$N.app = $N.app || {};
	$N.app.PIPPlayer = PIPPlayer;

}($N || {}));
