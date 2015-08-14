/*global BasePlayer*/
/**
 * HLSPlayer is a concrete implementation of BasePlayer and
 * allows playback of on HLS demand content e.g vod and catchup
 * @class $N.app.players.HLSPlayer
 * @constructor
 * @extends $N.app.players.BasePlayer
 * @param {Object} controller controller object
 * @param {Object} banner Optional banner object
 * @param {Object} fullscreenPlayer The Video object used to dispaly fullscreen TV
 * @author gstacey
 */

var $N = window.parent.$N;
$N.app = $N.app || {};
$N.app.players = $N.app.players || {};

(function ($N) {
	function HLSPlayer(controller, banner, fullscreenPlayer) {
		HLSPlayer.superConstructor.call(this, banner);
		this._log = new $N.apps.core.Log("MediaPlayer", "HLSPlayer");
		this._log("HLSPlayer", "Enter");
		this._controller = controller;
		this._fullscreenPlayer = fullscreenPlayer;
		this._bookmarkManager = null;
		this._startPosition = 0;
		this._bookMarkedPosition = 0;
		this._trickPlayObj = $N.app.fullScreenPlayer.seekTrickPlay;
		this._trickPlayObj.setPlayRateMultipliers([200, 400, 800, 1600, 3200]);
		this._log("HLSPlayer", "Exit");
	}

	$N.apps.util.Util.extend(HLSPlayer, $N.app.players.BasePlayer);

	/**
	 * Defines the the behaviour for end and beginning of content
	 * and ui updates
	 * @method initialise
	 */
	HLSPlayer.prototype.initialise = function () {
		this._log("initialise", "Enter");
		var me = this;
		HLSPlayer.superClass.initialise.call(this);
		this._failureCallback = function () {};
		this._playerPlayingListener = function () {
			if (me._startPosition) {
				$N.app.fullScreenPlayer.seekTrickPlay.play();
				$N.app.fullScreenPlayer.setPlaybackPosition(me._startPosition);
			}
			me._bookmarkManager.setContentDuration($N.app.fullScreenPlayer.getContentLength());
			me._updateBannerContentLength();
			me._updateBannerPlayBackPositions();
			$N.app.fullScreenPlayer.unregisterPlayerPlayingListener(me._playerPlayingListener);
		};
		this._log("initialise", "Exit");
	};

	/**
	 * Registers the callbacks and performs the tune request to
	 * start playback.
	 * @method activate
	 * @param {Object} activationContext
	 */
	HLSPlayer.prototype.activate = function (activationContext) {
		this._log("activate", "Enter");
		var preview,
			me = this,
			confirmationDialogShownCallback = function () {
				this._log("confirmationDialogShownCallback", "Enter");
				me._banner.hide();
				this._controller.hideBackLabel();
				this._log("confirmationDialogShownCallback", "Exit");
			},
			currentServiceId = null;
		if (activationContext.failureCallback) {
			this._failureCallback = activationContext.failureCallback;
		}
		$N.app.fullScreenPlayer.registerPlayerConnectFailedListener(this._failureCallback);
		if (!activationContext.preview) {
			this._fullscreenPlayer.show();
			this._banner.update({
				title: activationContext.title,
				subtitle: activationContext.subtitle || "",
				channelLogo: activationContext.channelLogo || "",
				channelNumber: activationContext.channelNumber || "",
				image: activationContext.promoUrl || "",
				vodLabel: this._controller.getString("vod") || ""
			});
			this._startPosition = activationContext.startPosition || 0;
			if (activationContext.bookmark) {
				this._bookmarkManager = activationContext.bookmark;
			}
			$N.app.fullScreenPlayer.registerPlayerConnectedListener(this._playerPlayingListener);
			this._bookmarkManager.setContentDuration($N.app.fullScreenPlayer.getContentLength());
			HLSPlayer.superClass.activate.call(this, activationContext);
			this._updateBannerPlayBackPositions();
		} else {
			$N.app.fullScreenPlayer.stopPlayout();
			this._fullscreenPlayer.hide();
			this._banner.hide();
			this._controller.hideBackLabel();
			preview = activationContext.preview;
			$N.app.fullScreenPlayer.seekTrickPlay.setPlayerPlayingCallback(function () {});
			$N.app.fullScreenPlayer.seekTrickPlay.setPlayerAtBeginningCallback(function () {});
			$N.app.fullScreenPlayer.seekTrickPlay.setPlayerAtEndCallback(function () {
				$N.app.fullScreenPlayer.tuner.disconnect();
				$N.app.fullScreenPlayer.tuner.tune(activationContext.url);
			});
			$N.app.fullScreenPlayer.seekTrickPlay.setUIRefreshCallback(function () {});
			$N.app.fullScreenPlayer.seekTrickPlay.registerEventListeners();
			$N.app.fullScreenPlayer.tuner.tune(activationContext.url);
			$N.app.fullScreenPlayer.tuner.showInSVGVideo(preview.getRootSVGRef());
		}

		if (!$N.app.EnvironmentUtil.isSTBEnvironmentIP()) {
			$N.app.fullScreenPlayer.registerPlayerFailureListeners();
		}
		$N.app.HotPlug.setDialogShownCallback(confirmationDialogShownCallback);
		$N.app.ErrorMessage.setDialogShownCallback(confirmationDialogShownCallback);
		this._log("activate", "Exit");
	};

	/**
	 * Passivates the player unregistering any listeners
	 * @method passivate
	 */
	HLSPlayer.prototype.passivate = function () {
		this._log("passivate", "Enter");
		HLSPlayer.superClass.passivate.call(this);
		this._stopTrickPlay();
		$N.app.fullScreenPlayer.unregisterPlayerConnectedListener(this._playerConnectedListener);
		$N.app.fullScreenPlayer.unregisterPlayerConnectFailedListener(this._failureCallback);
		if (!$N.app.EnvironmentUtil.isSTBEnvironmentIP()) {
			$N.app.fullScreenPlayer.unregisterPlayerFailureListeners();
		}
		$N.app.HotPlug.setDialogShownCallback(function () {});
		$N.app.ErrorMessage.setDialogShownCallback(function () {});
		this._log("passivate", "Exit");
	};

	/**
	 * Updates the banner so that progress bar shows the
	 * correct length
	 * @method _updateBannerContentLength
	 * @private
	 */
	HLSPlayer.prototype._updateBannerContentLength = function () {
		this._log("_updateBannerContentLength", "Enter");
		var me = this,
			contentLength = $N.app.fullScreenPlayer.getContentLength(),
			contentPosition = $N.app.fullScreenPlayer.seekTrickPlay.getPlaybackPosition();
		this._banner.update({
			progressLowerBound: 0,
			progressUpperBound: contentLength,
			progressBarLowerLabel: this._getContentLengthText(contentPosition),
			progressBarUpperLabel: this._getContentLengthText(contentLength)
		});
		this._log("_updateBannerContentLength", "Exit");
	};

	/**
	 * Updates the banner to show the current playback positions
	 * @method _updateBannerPlayBackPositions
	 * @private
	 */
	HLSPlayer.prototype._updateBannerPlayBackPositions = function () {
		this._log("_updateBannerPlayBackPositions", "Enter");
		this._updateBannerContentLength();
		var playerPosition = $N.app.fullScreenPlayer.seekTrickPlay.getPlaybackPosition();
		this._banner.update({
			progressBarValue: playerPosition,
			progressHeadValue: playerPosition
		});
		this._log("_updateBannerPlayBackPositions", "Exit");
	};

	/**
	 * Updates the banner to show the trickplay mode
	 * @method _updateBannerTrickPlayIndicators
	 * @param {String} mode one of play, ff, rew, pause
	 * @param {Number} rate
	 * @private
	 */
	HLSPlayer.prototype._updateBannerTrickPlayIndicators = function (mode, rate) {
		this._log("_updateBannerTrickPlayIndicators", "Enter");
		this._banner.update({
			trickPlayIcon: mode,
			trickPlaySpeed: rate
		});
		this._log("_updateBannerTrickPlayIndicators", "Exit");
	};

	/**
	 * This is called when the playback has finished and sets the bookmark for the current content
	 * @method _finishPlayback
	 */
	HLSPlayer.prototype._finishPlayback = function () {
		this._log("_finishPlayback", "Enter");
		var bookMarkPosition = 0;
		if (!this._isTrailer) {
			this._bookmarkManager.setContentDuration($N.app.fullScreenPlayer.getContentLength());
			bookMarkPosition = $N.app.fullScreenPlayer.seekTrickPlay.getPlaybackPosition();
			if (this._bookmarkManager.deleteOrBookmarkCurrentPosition(bookMarkPosition)) {
				this._bookMarkedPosition = bookMarkPosition;
			} else {
				this._bookMarkedPosition = 0;
			}
		}
		this._playbackFinished = true;
		this._stopTrickPlay();
		$N.app.fullScreenPlayer.stopPlayout(true);
		this._log("_finishPlayback", "Exit");
	};

	/**
	 * Key handler for HLSPlayer
	 * @method keyHandler
	 * @param {String} key
	 */
	HLSPlayer.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap();
		switch (key) {
		case keys.KEY_LEFT:
			return true;
		}
		HLSPlayer.superClass.keyHandler.call(this, key);
		this._log("keyHandler", "Exit");
	};

	$N.app.players.HLSPlayer = HLSPlayer;

}($N));
