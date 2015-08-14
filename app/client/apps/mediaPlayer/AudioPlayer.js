/**
 * AudioPlayer is a concrete implementation of BasePlayer and
 * allows playback of audio files
 * @class $N.app.players.AudioPlayer
 * @constructor
 * @extends $N.app.players.BasePlayer
 * @param {Object} controller controller object
 * @param {Object} banner Banner object
 * @param {Object} fullscreenPlayer The Video object used to display fullscreen TV
 * @author beschi
 */

var $N = window.parent.$N;
$N.app = $N.app || {};
$N.app.players = $N.app.players || {};

(function ($N) {
	function AudioPlayer(controller, banner, fullscreenPlayer) {
		AudioPlayer.superConstructor.call(this, banner);
		this._log = new $N.apps.core.Log("MediaPlayer", "AudioPlayer");
		this._log("AudioPlayer", "Enter");
		this._controller = controller;
		this._fullscreenPlayer = fullscreenPlayer;
		this._player = $N.app.fullScreenPlayer.getPlayer();
		this._log("AudioPlayer", "Exit");
	}

	$N.apps.util.Util.extend(AudioPlayer, $N.app.players.BasePlayer);

	/**
	 * Initialises the Audio Player and initilaises super class
	 * @method initialise
	 */
	AudioPlayer.prototype.initialise = function () {
		this._log("initialise", "Enter");
		AudioPlayer.superClass.initialise.call(this);
		var me = this;
		this._failureCallback = function () {
			me._stopPlayback(true);
		};
		this._skip = false;
		this._trickPlay = false;
		this._context = null;
		this._isMusic = true;
		this._actualList = [];
		this._shuffledList = [];
		this._currentAudioList = [];
		this._shuffleMode = false;
		this._current = null;
		this._next = null;
		this._index = null;
		this._previous = null;
		this._itemCountToHideHelpLayer = 0;
		this._MAX_INDEX_TO_HIDE_HELP = 3;
		this._FIRST_INDEX_TO_HIDE_HELP = 1;
		this._PLAY_MODES = {
			"SINGLE": "SINGLE",
			"ALL": "ALL"
		};
		this._playMode = null;
		this._log("initialise", "Exit");
	};

	/**
	 * Sets the indexes for the current, previous and next positions
	 * @method _setIndexes
	 * @param {Number} currentIndex
	 */
	AudioPlayer.prototype._setIndexes = function (currentIndex) {
		this._log("_setIndexes", "Enter");
		this._current = currentIndex;
		this._next = currentIndex + 1;
		this._previous = currentIndex - 1;
		if (this._next > this._totalAudios - 1) {
			this._next = 0;
		}
		if (this._previous < 0) {
			this._previous = this._totalAudios - 1;
		}
		this._log("_setIndexes", "Exit");
	};

	/**
	 * Updates the banner content
	 * @method _updateBanner
	 */
	AudioPlayer.prototype._updateBanner = function () {
		this._log("_updateBanner", "Enter");
		this._banner.update({
			title: this._currentAudioList[this._current].title,
			artist: this._currentAudioList[this._current].artist,
			album: this._controller.getString("album") + ": " + this._currentAudioList[this._current].album,
			thumbnail: this._currentAudioList[this._current].thumbnail
		});
		this._log("_updateBanner", "Exit");
	};

	/**
	 * Activates the fullscreen player by calling the Baseplayer activation method
	 * @method _activateBasePlayer
	 */
	AudioPlayer.prototype._activateBasePlayer = function () {
		this._log("_activateBasePlayer", "Enter");
		this._index = this._currentAudioList[this._current].index;
		var currentAudioDetails = {
			url: this._currentAudioList[this._current].resourceUrl,
			isMusic: this._isMusic,
			context: this._context,
			skip: this._skip,
			trickPlay: this._trickPlay
		};

		AudioPlayer.superClass.activate.call(this, currentAudioDetails);
		AudioPlayer.superClass._startUpdateInterval.call(this);
		this._log("_activateBasePlayer", "Exit");
	};

	/**
	 * Registers the callbacks and performs the tune request to
	 * start playback.
	 * @method activate
	 * @param {Object} activationContext
	 */
	AudioPlayer.prototype.activate = function (activationContext) {
		this._log("activate", "Enter");
		if (activationContext.failureCallback) {
			this._failureCallback = activationContext.failureCallback;
		}
		$N.app.fullScreenPlayer.registerPlayerConnectFailedListener(this._failureCallback);
		this._fullscreenPlayer.show();
		this._skip = activationContext.skip;
		this._context = activationContext.context;
		this._trickPlay = activationContext.trickplay;
		this._current = activationContext.index;
		this._playMode = activationContext.mode;
		this._banner.activate({defaultThumbnailUrl: activationContext.defaultThumbnail});
		this._actualList = activationContext.audioList;
		this._shuffledList = $N.app.ArrayUtil.arrayShuffle(this._actualList);
		this._shuffleMode = false;
		this._currentAudioList = this._actualList;
		this._totalAudios = this._actualList.length;
		this._itemCountToHideHelpLayer = this._FIRST_INDEX_TO_HIDE_HELP;

		this._setIndexes(this._current);
		this._activateBasePlayer();
		if (this._playMode === this._PLAY_MODES.SINGLE) {
			this._banner.setPlayAllHelp(this._controller.getString("playAllHelp"));
		} else {
			this._banner.setPlayAllHelp(this._controller.getString("shuffleOnHelp"));
		}
		this._updateBanner();
		this._banner.show();
		if (!$N.app.EnvironmentUtil.isSTBEnvironmentIP()) {
			$N.app.fullScreenPlayer.registerPlayerFailureListeners();
		}
		this._log("activate", "Exit");
	};

	/**
	 * Passivates the player unregistering any listeners
	 * @method passivate
	 */
	AudioPlayer.prototype.passivate = function () {
		this._log("passivate", "Enter");
		this._banner.hide();
		this._actualList = [];
		this._shuffledList = [];
		this._currentAudioList = [];
		this._banner.passivate();
		this._playbackFinished = true;
		$N.app.fullScreenPlayer.stopPlayout(true);
		$N.app.fullScreenPlayer.unregisterPlayerConnectFailedListener(this._failureCallback);
		if (!$N.app.EnvironmentUtil.isSTBEnvironmentIP()) {
			$N.app.fullScreenPlayer.unregisterPlayerFailureListeners();
		}
		AudioPlayer.superClass.passivate.call(this);
		this._log("passivate", "Exit");
	};

	/**
	 * Toggles the shuffle mode, sets the next audio to be displayed is the first item
	 * @method _toggleShuffleMode
	 */
	AudioPlayer.prototype._toggleShuffleMode = function () {
		this._log("_toggleShuffleMode", "Enter");
		this._shuffleMode = !this._shuffleMode;
		if (this._shuffleMode) {
			this._currentAudioList = this._shuffledList;
			this._banner.setPlayAllHelp(this._controller.getString("shuffleOffHelp"));
			this._banner.showShuffleIcon();
		} else {
			this._currentAudioList = this._actualList;
			this._banner.setPlayAllHelp(this._controller.getString("shuffleOnHelp"));
			this._banner.hideShuffleIcon();
		}
		this._setIndexes(this._totalAudios);
		this._log("_toggleShuffleMode", "Exit");
	};

	/**
	 * Switches to play all mode when pressing play button
	 * @method _switchToPlayAllMode
	 */
	AudioPlayer.prototype._switchToPlayAllMode = function () {
		this._log("_switchToPlayAllMode", "Enter");
		this._playMode = this._PLAY_MODES.ALL;
		this._itemCountToHideHelpLayer = this._FIRST_INDEX_TO_HIDE_HELP;
		this._banner.setPlayAllHelp(this._controller.getString("shuffleOnHelp"));
		this._log("_switchToPlayAllMode", "Exit");
	};

	/**
	 * Key handler for Audio player.
	 * Handles the play and pause key presses if another button is
	 * pressed the key is passed to the super class to handle
	 * @method keyHandler
	 * @param {String} key
	 */
	AudioPlayer.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false,
			exitOnFinishPlayback = true;
		switch (key) {
		case keys.KEY_OK:
			this._banner.showHelpLayer();
			handled = true;
			break;
		case keys.KEY_PLAY:
			if (this._playMode === this._PLAY_MODES.SINGLE) {
				this._switchToPlayAllMode();
			}
			handled = true;
			break;
		case keys.KEY_PAUSE:
			$N.app.fullScreenPlayer.trickPlay.playPause();
			break;
		case keys.KEY_PLAY_PAUSE:
			if (this._playMode === this._PLAY_MODES.SINGLE) {
				this._switchToPlayAllMode();
			}
			$N.app.fullScreenPlayer.trickPlay.playPause();
			handled = true;
			break;
		case keys.KEY_RIGHT:
		case keys.KEY_SKIP_FW:
			this._playNext();
			handled = true;
			break;
		case keys.KEY_LEFT:
		case keys.KEY_SKIP_REW:
			this._playPrevious();
			handled = true;
			break;
		case keys.KEY_ZERO:
			if (this._playMode === this._PLAY_MODES.ALL) {
				this._toggleShuffleMode();
			}
			handled = true;
			break;
		case keys.KEY_REW:
		case keys.KEY_FFW:
			handled = this._trickPlayObj.keyHandler(key);
			break;
		case keys.KEY_STOP:
		case keys.KEY_EXIT:
		case keys.KEY_BACK:
			this._stopPlayback(exitOnFinishPlayback);
			handled = true;
			break;
		}
		if (!handled) {
			AudioPlayer.superClass.keyHandler.call(this, key);
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	/**
	 * Updates the banner to show or hide the pause icon
	 * @method _updateBannerTrickPlayIndicators
	 * @param {String} mode one of play, ff, rew, pause
	 * @param {Number} rate
	 * @private
	 */
	AudioPlayer.prototype._updateBannerTrickPlayIndicators = function (mode, rate) {
		this._log("_updateBannerTrickPlayIndicators", "Enter");
		if (rate === 0) {
			this._banner.showPauseIcon();
		} else {
			this._banner.hidePauseIcon();
		}
		this._log("_updateBannerTrickPlayIndicators", "Exit");
	};

	/**
	 * Playing audio file in the current index
	 * @method _playCurrentIndexItem
	 * @private
	 */
	AudioPlayer.prototype._playCurrentIndexItem = function () {
		this._log("_playCurrentIndexItem", "Enter");
		this._index = this._currentAudioList[this._current].index;
		$N.app.fullScreenPlayer.stopPlayout(true);
		$N.app.fullScreenPlayer.requestPlayout({
			url: this._currentAudioList[this._current].resourceUrl,
			isMusic: this._isMusic || false,
			context: this.context
		}, false, this.contentObj);
		this._updateBanner();
		this._log("_playCurrentIndexItem", "Exit");
	};

	/**
	 * Playing previous audio file in the list - setting the index and playing
	 * @method _playPrevious
	 * @private
	 */
	AudioPlayer.prototype._playPrevious = function () {
		this._log("_playPrevious", "Enter");
		this._setIndexes(this._previous);
		this._playCurrentIndexItem();
		this._log("_playPrevious", "Exit");
	};

	/**
	 * Playing next audio file in the list - setting the index and playing
	 * @method _playNext
	 * @private
	 */
	AudioPlayer.prototype._playNext = function () {
		this._log("_playNext", "Enter");
		this._itemCountToHideHelpLayer++;
		if (this._itemCountToHideHelpLayer === this._MAX_INDEX_TO_HIDE_HELP) {
			this._banner.hideHelpLayer();
		}
		this._setIndexes(this._next);
		this._playCurrentIndexItem();
		this._log("_playNext", "Exit");
	};

	/**
	 * Helper method to define the behaviour when playback is complete
	 * @param {Boolean} isExit whether to exit or play next
	 * @method _stopPlayback
	 * @private
	 */
	AudioPlayer.prototype._stopPlayback = function (isExit) {
		this._log("_stopPlayback", "Enter");
		var returnData = {};
		returnData.index = this._index;
		if (isExit) {
			$N.app.ContextHelper.closeContext();
		} else {
			if (this._playMode === this._PLAY_MODES.SINGLE) {
				this._playCurrentIndexItem();
			} else {
				this._playNext();
			}
		}
		this._log("_stopPlayback", "Exit");
	};

	/**
	 * Updates the Duration display to show the current playback positions
	 * @method _updateBannerPlayBackPositions
	 * @private
	 */
	AudioPlayer.prototype._updateBannerPlayBackPositions = function () {
		this._log("_updateBannerPlayBackPositions", "Enter");
		var me = this,
			contentPosition = $N.app.fullScreenPlayer.seekTrickPlay.getPlaybackPosition();
		this._banner.update({
			playerDuration: this._getContentDurationText(contentPosition)
		});
		this._log("_updateBannerPlayBackPositions", "Exit");
	};

	/**
	 * Returns the content duration string in mm:ss format
	 * @method _getContentDurationText
	 * @private
	 * @param {Number} contentLength Content length in seconds
	 */
	AudioPlayer.prototype._getContentDurationText = function (contentLength) {
		this._log("_getContentDurationText", "Enter");
		var mins = Math.floor(contentLength / 60),
			seconds = Math.floor(contentLength % 60);
		if (seconds < 10) {
			seconds = "0" + seconds;
		}
		this._log("_getContentDurationText", "Exit");
		return mins + ":" + seconds;
	};

	/**
	 * Abstract method to be overridden in the sub class
	 * @method _showBanner
	 * @private
	 */
	AudioPlayer.prototype._showBanner = function () {
	};

	$N.app.players.AudioPlayer = AudioPlayer;

}($N));