/**
 * Base player is the superclass of all the player types and defines all the
 * common functionality that a video player should have. The subclasses are
 * free to override the methods here to define custom behaviour
 * @class $N.app.players.BasePlayer
 * @constructor
 * @param {Object} banner an optional gui banner
 * @author mbrown
 */
var $N = window.parent.$N;
$N.app = $N.app || {};
$N.app.players = $N.app.players || {};

(function ($N) {
	function BasePlayer(banner) {
		this._log = new $N.apps.core.Log("MediaPlayer", "BasePlayer");
		this._log("BasePlayer", "Enter");
		this._banner = banner || {
			show: function () {},
			hide: function () {},
			update: function () {}
		};
		this._bannerTimeout = null;
		this._backLabelTimeout = null;
		this._updateInterval = null;
		this._trickplayEnabled = true;
		this._skipEnabled = false;
		this._isTrailer = false;
		this._DEFAULT_MODE = "play";
		this._DEFAULT_RATE = 100;
		this._BANNER_UPDATE_INTERVAL = 1000;
		this._BANNER_TIMEOUT_DEFAULT = 5000;
		this._SKIP_TIME = $N.app.constants.DEFAULT_SKIP_TIME_SECS;
		this._trickPlayObj = $N.app.fullScreenPlayer.trickPlay;
		this._clockDisplay = $N.app.ClockDisplay;
		this._hasFocus = false;
		this._log("BasePlayer", "Exit");
	}

	/**
	 * This function is used so that we always retrieve the current value of the PREF_ZAPPING_BANNER_TIMEOUT
	 * @method _getBannerTimeout
	 * @private
	 * @return {Number} Banner timeout in MS
	 */

	BasePlayer.prototype._getBannerTimeout = function () {
		return parseInt($N.platform.system.Preferences.get($N.app.constants.PREF_PLAYBACK_PLAYER_TIMEOUT), 10) || this._BANNER_TIMEOUT_DEFAULT;
	};

	/**
	 * Returns the content length string for the progress bar in hh:mm:ss format
	 * @method _getContentLengthText
	 * @private
	 * @param {Number} contentLength Content length in seconds
	 */
	BasePlayer.prototype._getContentLengthText = function (contentLength) {
		this._log("_getContentLengthText", "Enter");
		contentLength = Math.max(contentLength, 0);
		var hours = Math.floor(contentLength / (60 * 60)),
			minutes = Math.floor((contentLength - (hours * 60 * 60)) / 60),
			seconds = Math.floor(contentLength - (hours * 3600) - (minutes * 60));
		if (seconds === 60) {
			minutes++;
			seconds = 0;
		}
		if (minutes === 60) {
			hours++;
			minutes = 0;
		}
		if (hours < 10) {
			hours = "0" + hours;
		}
		if (minutes < 10) {
			minutes = "0" + minutes;
		}
		if (seconds < 10) {
			seconds = "0" + seconds;
		}
		this._log("_getContentLengthText", "Exit");
		return hours + ':' + minutes + ':' + seconds;
	};

	/**
	 * Defines the the behaviour for end and beginning of content
	 * and ui updates
	 * @method initialise
	 */
	BasePlayer.prototype.initialise = function () {
		this._log("initialise", "Enter");
		var me = this;
		this._player = $N.app.fullScreenPlayer.getPlayer();

		this._playerReachedEndCallback = function () {
			me._log("_playerReachedEndCallback", "Enter");
			if (this._hasFocus) {
				$N.app.ContextHelper.closeContext();
			}
			// TODO: NETUI-3179 - Need to display a message on screen to indicate the player has reached the end of the playback.
			me._log("_playerReachedEndCallback", "Exit");
		};

		this._playerReachedBeginningCallback = function () {
			me._log("_playerReachedBeginningCallback", "Enter");
			me._trickPlayObj.play();
			me._log("_playerReachedBeginningCallback", "Exit");
		};

		this._playerPlayingCallback = function () {
			me._log("_playerPlayingCallback", "Enter");
			if (!me._isTrailer) {
				me._showBanner();
			}
			me._log("_playerPlayingCallback", "Exit");
		};

		this._uiRefreshCallback = function (mode, rate) {
			me._log("_uiRefreshCallback", "Enter");
			me._updateBannerTrickPlayIndicators(mode, rate);
			me._showBanner(mode);
			if (mode !== $N.platform.output.TrickPlay.MODES.PLAY) {
				me._cancelBannerHide();
			}
			me._log("_uiRefreshCallback", "Exit");
		};
		this._log("initialise", "Exit");
	};

	/**
	 * Registers the callbacks and performs the tune request to
	 * start playback.
	 * @method activate
	 * @param {Object} activationContext
	 * @param {Object} trickPlayObj
	 */
	BasePlayer.prototype.activate = function (activationContext) {
		this._log("activate", "Enter");
		var me = this,
			retryCallback = activationContext.retryCallback;
		this._skipEnabled = activationContext.skip;
		this._trickplayEnabled = activationContext.trickplay;
		this._playbackFinished = false;
		this._isTrailer = false;
		this._updateBannerTrickPlayIndicators(this._DEFAULT_MODE, this._DEFAULT_RATE);
		this._trickPlayObj.setPlayerPlayingCallback(this._playerPlayingCallback);
		this._trickPlayObj.setPlayerAtBeginningCallback(this._playerReachedBeginningCallback);
		this._trickPlayObj.setPlayerAtEndCallback(this._playerReachedEndCallback);
		this._trickPlayObj.setUIRefreshCallback(this._uiRefreshCallback);
		this._trickPlayObj.registerEventListeners();

		// TODO NETUI-2729: REMOVE hardcoded vod stuff below. It is for off-site playback only
		if ($N.app.Config.getConfigValue("faked.playback") === "true" && (activationContext.type === "ASSET" || activationContext.type === "STARTOVER" || activationContext.type === "CATCHUP")) {
			$N.app.fullScreenPlayer.requestPlayout(
				{
					url: $N.app.Config.getConfigValue("faked.playback.serviceUri"),
					isLive: false,
					isMusic: false,
					serviceId: $N.app.Config.getConfigValue("faked.playback.serviceId")
				},
				true,
				activationContext.contentObj,
				retryCallback
			);
		} else {
			$N.app.fullScreenPlayer.requestPlayout(
				{
					url: activationContext.url,
					isMusic: activationContext.isMusic || false,
					context: activationContext.context,
					bookmark: activationContext.bookmark
				},
				false,
				activationContext.contentObj,
				retryCallback
			);
		}

		if (this._isTrailer) {
			this._hideBannerAndClock();
			this._cancelBannerHide();
			if (this._getBannerTimeout() !== -1) {
				this._backLabelTimeout = window.parent.setTimeout(function () {
					me._controller.hideBackLabel();
				}, this._getBannerTimeout());
			}

			this._controller.showBackLabel();
		} else {
			this._showBanner();
		}
		this._hasFocus = true;
		this._log("activate", "Exit");
	};

	/**
	 * Passivates the player unregistering any listeners
	 * @method passivate
	 */
	BasePlayer.prototype.passivate = function () {
		this._log("passivate", "Enter");
		this._cancelBannerHide();
		this._banner.hide();
		this._controller.hideBackLabel();
		this._stopUpdateInterval();
		this._finishPlayback();
		this._trickPlayObj.unRegisterEventListeners();
		this._trickPlayObj.setPlayerPlayingCallback(function () {});
		this._trickPlayObj.setPlayerAtBeginningCallback(function () {});
		this._trickPlayObj.setPlayerAtEndCallback(function () {});
		this._trickPlayObj.setUIRefreshCallback(function (mode, speed) {});
		if (!this._playbackFinished) {
			$N.app.fullScreenPlayer.manageStream();
		}
		this._hasFocus = false;
		this._log("passivate", "Exit");
	};

	/**
	 * Focus received by the player
	 * @method focus
	 */
	BasePlayer.prototype.focus = function () {
		this._hasFocus = true;
		$N.app.ClockDisplay.hide();
	};

	/**
	 * Defocus the player
	 * @method defocus
	 */
	BasePlayer.prototype.defocus = function () {
		this._hasFocus = false;
	};

	/**
	 * @method playGivenURL
	 */
	BasePlayer.prototype.playGivenURL = function (activationContext) {
		this._log("playGivenURL", "Enter");
		var retryCallback = activationContext.retryCallback;
		$N.app.fullScreenPlayer.requestPlayout(
			{
				url: activationContext.url,
				isMusic: activationContext.isMusic || false,
				context: activationContext.context
			},
			false,
			activationContext.contentObj,
			retryCallback
		);
		this._log("playGivenURL", "Exit");
	};

	/**
	 * @method ifTrailerShowBackLabel
	 */
	BasePlayer.prototype._ifTrailerShowBackLabel = function () {
		this._log("_ifTrailerShowBackLabel", "Enter");
		if (this._isTrailer) {
			this._controller.showBackLabel();
		}
		this._log("_ifTrailerShowBackLabel", "Enter");
	};

	/**
	 * Default key handler for all players checks for trickplay and
	 * handles the key presses appropriately.
	 * @method keyHandler
	 * @param {Object} key
	 * @return {Boolean} True if the key press was handled, false otherwise
	 */
	BasePlayer.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var me = this,
			keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;
		switch (key) {
		case keys.KEY_OK:
		case keys.KEY_UP:
		case keys.KEY_DOWN:
		case keys.KEY_LEFT:
		case keys.KEY_RIGHT:
			this._ifTrailerShowBackLabel();
			if (!this._banner.isVisible()) {
				this._showBanner();
			}
			handled = true;
			break;
		case keys.KEY_INFO:
			if (this._banner.isVisible()) {
				this._stopUpdateInterval();
				this._controller.hideBackLabel();
				this._banner.hide();
			} else {
				this._ifTrailerShowBackLabel();
				this._showBanner();
			}
			this._log("keyHandler", "Exit1");
			return true;
		case keys.KEY_STOP:
			$N.app.ContextHelper.closeContext();
			this._log("keyHandler", "Exit2");
			return true;
		case keys.KEY_SKIP_REW:
			this._skip(-1);
			this._log("keyHandler", "Exit3");
			return true;
		case keys.KEY_SKIP_FW:
			this._skip(1);
			this._log("keyHandler", "Exit4");
			return true;
		}
		if (this._trickplayEnabled) {
			this._log("keyHandler", "Exit5");
			return handled || this._trickPlayObj.keyHandler(key);
		}
		this._log("keyHandler", "Exit6");
		return handled;
	};

	/**
	 * Helper method to handle skip requests
	 * @method _skip
	 * @private
	 * @param {Number} direction 1 for forward -1 for back
	 */
	BasePlayer.prototype._skip = function (direction) {
		this._log("_skip", "Enter");
		if (this._skipEnabled) {
			this._trickPlayObj.skip(this._SKIP_TIME * direction);
			this._updateBannerPlayBackPositions();
			this._ifTrailerShowBackLabel();
			this._showBanner();
		}
		this._log("_skip", "Exit");
	};


	/**
	 * If an asset is being fast forwarded or rewound this function stops it.
	 * @method _stopTrickPlay
	 * @private
	 */
	BasePlayer.prototype._stopTrickPlay = function () {
		this._log("_stopTrickPlay", "Enter");
		var TRICKPLAY_MODE_FASTFORWARD = "ff",
			TRICKPLAY_MODE_REWIND = "rew",
			trickPlayMode = this._trickPlayObj.getTrickPlayMode();
		if ((this._trickplayEnabled) && (trickPlayMode === TRICKPLAY_MODE_FASTFORWARD || trickPlayMode === TRICKPLAY_MODE_REWIND)) {
			this._trickPlayObj.pause();
		}
		this._log("_stopTrickPlay", "Exit");
	};

	/**
	 * @method resetBannerTimeout
	 * @private
	 */
	BasePlayer.prototype.resetBannerTimeout = function () {
		this._log("resetBannerTimeout", "Enter");
		var me = this;
		if (this._bannerTimeout) {
			window.parent.clearTimeout(this._bannerTimeout);
		}
		if (this._getBannerTimeout() !== -1) {
			this._bannerTimeout = window.parent.setTimeout(function () {
				me._stopUpdateInterval();
				me._clockDisplay.hide();
				me._controller.hideBackLabel();
				me._banner.hide();
			}, this._getBannerTimeout());
		}

		this._log("resetBannerTimeout", "Exit");
	};

	/**
	 * Helper method to manage the timed display of the banner
	 * @method _showBanner
	 * @param {String} mode - the current mode of the trick player
	 * @private
	 */
	BasePlayer.prototype._showBanner = function (mode) {
		this._log("_showBanner", "Enter");
		var me = this,
			bannerTimeoutValue = this._getBannerTimeout(),
			bannerTimeoutCallback,
			isBannerTimeoutAllowed = true;
		switch (mode) {
		case $N.platform.output.TrickPlay.MODES.PAUSE:
		case $N.platform.output.TrickPlay.MODES.FF:
		case $N.platform.output.TrickPlay.MODES.RW:
			isBannerTimeoutAllowed = false;
			break;
		}
		this._cancelBannerHide();
		if (bannerTimeoutValue !== -1 && isBannerTimeoutAllowed) {
			bannerTimeoutCallback = function () {
				me._stopUpdateInterval();
				me._clockDisplay.hide();
				me._controller.hideBackLabel();
				me._banner.hide();
			};
			this._bannerTimeout = window.parent.setTimeout(bannerTimeoutCallback, bannerTimeoutValue);
		} else {
			isBannerTimeoutAllowed = false;
		}
		if (!this._banner.isVisible()) {
			this._startUpdateInterval();
			this._ifTrailerShowBackLabel();
			this._banner.show(isBannerTimeoutAllowed);
		} else if (this._banner.setBannerTimeout) {
			this._banner.setBannerTimeout(isBannerTimeoutAllowed);
		}
		this._log("_showBanner", "Exit");
	};

	/**
	 * @method _hideBannerAndClock
	 * @private
	 */
	BasePlayer.prototype._hideBannerAndClock = function () {
		this._log("_hideBannerAndClock", "Enter");
		this._stopUpdateInterval();
		this._clockDisplay.hide();
		this._controller.hideBackLabel();
		this._banner.hide();
		this._log("_hideBannerAndClock", "Exit");
	};

	/**
	 * Helper method to cancel the auto hide feature of the banner
	 * @method _cancelBannerHide
	 * @private
	 */
	BasePlayer.prototype._cancelBannerHide = function () {
		this._log("_cancelBannerHide", "Enter");
		if (this._bannerTimeout) {
			window.parent.clearTimeout(this._bannerTimeout);
		}
		if (this._backLabelTimeout) {
			window.parent.clearTimeout(this._backLabelTimeout);
		}
		this._log("_cancelBannerHide", "Exit");
	};

	/**
	 * Starts the process of updating the banner display with the
	 * current playback positions and content length
	 * @method _startUpdateInterval
	 * @private
	 */
	BasePlayer.prototype._startUpdateInterval = function (progressUpdateInterval) {
		this._log("_startUpdateInterval", "Enter");
		var me = this;
		this._updateBannerPlayBackPositions();
		if (this._updateInterval) {
			window.parent.clearInterval(this._updateInterval);
			this._updateInterval = null;
		}
		if (!progressUpdateInterval) {
			progressUpdateInterval = this._BANNER_UPDATE_INTERVAL;
		}
		this._updateInterval = window.parent.setInterval(function () {
			me._updateBannerPlayBackPositions();
		}, progressUpdateInterval);
		this._log("_startUpdateInterval", "Exit");
	};

	/**
	 * Stops the process of updating the banner display with the
	 * current playback positions and content length
	 * @method _stopUpdateInterval
	 * @private
	 */
	BasePlayer.prototype._stopUpdateInterval = function () {
		this._log("_stopUpdateInterval", "Enter");
		if (this._updateInterval) {
			window.parent.clearInterval(this._updateInterval);
			this._updateInterval = null;
		}
		this._log("_stopUpdateInterval", "Exit");
	};

	/**
	 * Helper method to define the behaviour when playback is complete
	 * generally when stop is pressed or playback reaches the end
	 * @method _finishPlayback
	 * @private
	 * @param {Object} data
	 */
	BasePlayer.prototype._finishPlayback = function (data) {
		this._log("_finishPlayback", "Enter");
		this._playbackFinished = true;
		this._controller.hideBackLabel();
		this._stopTrickPlay();
		this._log("_finishPlayback", "Exit");
	};

	/**
	 * Abstract method to be overridden in the sub class
	 * @method _updateBannerContentLength
	 * @private
	 */
	BasePlayer.prototype._updateBannerContentLength = function () {

	};

	/**
	 * Abstract method to be overridden in the sub class
	 * @method _updateBannerPlayBackPositions
	 * @private
	 */
	BasePlayer.prototype._updateBannerPlayBackPositions = function () {

	};

	/**
	 * Abstract method to be overridden in the sub class
	 * @method _updateBannerTrickPlayIndicators
	 * @private
	 * @param {String} mode One of "ff", "rew", "play" and "pause"
	 * @param {Number} rate Speed of playback
	 */
	BasePlayer.prototype._updateBannerTrickPlayIndicators = function (mode, rate) {

	};

	$N.app.players.BasePlayer = BasePlayer;

}($N));
