/**
 * MediaPlayer is an extension of VideoPlayer with additional support added
 * to allow a list of content items music / video to be played sequentially
 * (aka user generated playlists). If this additional functionality is not
 * required then it is advised to use the VideoPlayer instead. Any existing instance
 * of VideoPlayer can be updated to MediaPlayer and it will still maintain
 * the same functionality plus the additional functionality.  The class maintains
 * a sequential play list such that as one content item finishes playing it will
 * automatically start playing the next item in the list.  Methods are made
 * available to query the current state including total tracks in the play list and
 * content type.
 * @class $N.platform.output.MediaPlayer
 * @extends $N.platform.output.VideoPlayer
 * @constructor
 * @requires $N.apps.core.KeyInterceptor
 * @requires $N.apps.util.Util
 * @requires $N.platform.output.VideoPlayer
 */

/*
 * IMPLEMENTATION:
 * internal array to hold play list
 * variable to denote current position in playlist
 * Default constants:
 *  - skipKey
 *  - pauseBetweenItems = 0
 */

//TODO: once implemented the class needs to be implemented for CCOM2
define('jsfw/platform/output/MediaPlayer',
    [
    	'jsfw/apps/core/KeyInterceptor',
    	'jsfw/apps/util/Util',
    	'jsfw/platform/output/VideoPlayer'
    ],
	function (KeyInterceptor, Util, VideoPlayer) {

		function MediaPlayer() {
			MediaPlayer.superConstructor.call(this);
			this._playList = [];
			this._loopMode = false;
			this._currentIndex = null;
			this._currentItem = null;

			var keys = $N.apps.core.KeyInterceptor.getKeyMap();
			this._skipKey = keys.KEY_FFW;
			this._playKey = keys.KEY_PLAY;
			this._pauseKey = keys.KEY_PAUSE;
		}

		$N.apps.util.Util.extend(MediaPlayer, $N.platform.output.VideoPlayer);

		var currentPrototype = MediaPlayer.prototype;

		/**
		 * Takes an array of objects that represent a set of media to be played, and starts playing them.
		 * At a minimum, the objects must contain a `url` property but can also contain any
		 * other metadata that the UI may find useful. This method overwrites any previously
		 * set playlist.
		 * @method setPlaylist
		 * @chainable
		 * @param {Array} playlist an array of objects representing the items to play
		 */
		currentPrototype.setPlaylist = function (playlist) {
			if (playlist) {
				var self = this;
				this._playList = playlist;
				this._currentIndex = 0;
				this._currentItem = playlist[0];
				this.registerPlayerReachedEndListener(function () {
					self.skipToNext();
					// TODO: do we need a gap between one video and the next?
				});
				this.tuner.tune(this.getCurrentUrl());
			} else {
				this._playList = [];
				this._currentIndex = -1;
				this._currentItem = null;
			}
			return this;
		};

		/**
		 * Appends the given array / object of playable items to the current playlist. This method
		 * accepts a single item to play or an array.
		 * @method addToPlaylist
		 * @chainable
		 * @param {Object} items an object or array of item(s)
		 */
		currentPrototype.addToPlaylist = function (items) {
			if (typeof items === 'object') {
				if (items.splice) {
					this._playList = this._playList.concat(items);
				} else {
					this._playList.push(items);
				}
			}
			return this;
		};

		/**
		 * If set to true, once the content reaches the end of the playlist playback will
		 * restart at the beginning of the playlist.
		 * @method setLoop
		 * @chainable
		 * @param {Boolean} loop true to loop, false not to (default)
		 */
		currentPrototype.setLoop = function (loop) {
			this._loopMode = loop || false;
			return this;
		};

		/**
		 * Skips the currently playing item and starts playing the next item in the playlist
		 * if not at the end. If at the end, and loop mode is active, then skips to the first
		 * item in the list.
		 * @method skipToNext
		 * @return {Boolean} true if skipped
		 */
		currentPrototype.skipToNext = function () {
			var playing = true;
			if (this._playList.length) {
				// start with the first item if necessary
				if (this._currentIndex === undefined || this._currentIndex === null) {
					this._currentIndex = 0;
				} else if (this._currentIndex < this._playList.length - 1) {
					this._currentIndex++;
				} else if (this._currentIndex === this._playList.length - 1) {
					if (this._loopMode) {
						this._currentIndex = 0;
					} else {
						// if not in loop mode when at the last item, don't do anything
						playing = false;
					}
				}
				if (playing) {
					this._currentItem = this._playList[this._currentIndex];
					this.tuner.tune(this.getCurrentUrl());
					return true;
				}
			}
			return false;
		};

		/**
		 * Skips the currently playing item and starts playing the previous item in the playlist
		 * if not at the beginning. If at the beginning, and loop mode is active, then skips to
		 * the last item in the list.
		 * @method skipToPrevious
		 * @return {Boolean} true if skipped
		 */
		currentPrototype.skipToPrevious = function () {
			var playing = true;
			if (this._playList.length) {
				if (this._currentIndex > 0) {
					this._currentIndex--;
				} else if (this._currentIndex === 0) {
					if (this._loopMode) {
						this._currentIndex = this._playList.length - 1;
					} else {
						// if not in loop mode when at the first item, don't do anything
						playing = false;
					}
				}
				if (playing) {
					this._currentItem = this._playList[this._currentIndex];
					this.tuner.tune(this.getCurrentUrl());
					return true;
				}
			}
			return false;
		};

		/**
		 * Clears down the playlist and stops any media currently playing back
		 * @method clearPlaylist
		 */
		currentPrototype.clearPlaylist = function () {
			this.tuner.disconnect();
			this._playList.length = 0;
			this._currentIndex = null;
			this._currentItem = null;
		};

		/**
		 * Overrides the default skip key
		 * @method setSkipKey
		 * @chainable
		 * @param {String} key the key to set to activate the 'skip' functionality
		 */
		currentPrototype.setSkipKey = function (key) {
			this._skipKey = key;
			return this;
		};

		/**
		 * Convenience method that allows the UI to pass on the key press to this
		 * component for handling.
		 * @method keyHandler
		 * @param {String} key string constant representing the key that was pressed
		 * @return {Boolean} true if the key was handled
		 */
		currentPrototype.keyHandler = function (key) {
			var handled = false;
			switch (key) {
			case this._skipKey:
				this.skipToNext();
				handled = true;
				break;
			}
			return handled;
		};

		/**
		 * Returns the full list of objects that are in were set in the playlist using
		 * `setPlaylist` or `addToPlaylist`
		 * @method getPlaylist
		 * @return {Array} the playlist
		 */
		currentPrototype.getPlaylist = function () {
			return this._playList;
		};

		/**
		 * Returns the total number of items in the playlist
		 * @method getPlayListSize
		 * @return {Number}
		 */
		currentPrototype.getPlayListSize = function () {
			return this._playList ? this._playList.length : 0;
		};

		/**
		 * Returns the current item in the playlist that is playing
		 * @method getCurrentItem
		 * @return {Object}
		 */
		currentPrototype.getCurrentItem = function () {
			return this._currentItem;
		};

		/**
		 * Returns the index of the current item in the playlist that is playing
		 * @method getCurrentItemIndex
		 * @return {Number} the index, or -1 if there are no items in the play list
		 */
		currentPrototype.getCurrentItemIndex = function () {
			return (this._currentIndex !== null && this._currentIndex !== undefined) ? this._currentIndex : -1;
		};

		/**
		 * Returns the URL of the currently playing item
		 * @method getCurrentUrl
		 * @return {String} URL
		 */
		currentPrototype.getCurrentUrl = function () {
			return this._playList[this._currentIndex] ? this._playList[this._currentIndex].url : '';
		};

		/**
		 * Adds an event listener for the Event identified by the supplied name,
		 * once the event is fired the callback function will be executed.  Multiple
		 * event listeners can be added for the same event.
		 * @method addEventListener
		 * @param {String} name the name of the event you are interested in listening to
		 * @param {Function} callback the function to execute when the event is fired
		 */

		/**
		 * Removes a previously registered event listener identified by the given
		 * name and callback
		 * @method removeEventListener
		 * @param {String} name the name of the event you are interested in listening to
		 * @param {Function} callback the function to execute when the event is fired
		 */

		/**
		 * Fired once when all the items in the playlist have been played and
		 * there is no more content to play.
		 * @event ReachedEndOfPlayList
		 */

		/**
		 * Fired at the start of each item in the playlist commencing play back. The UI can
		 * register a listener for this event to update the application display.
		 * @event ItemPlaying
		 * @param {Object} item the object from the playlist that is playing
		 * @param {Number} index the index of this item
		 * @param {Number} total the total number of items in the playlist
		 */

		/**
		 * Fired when new items are set or added to the playlist. The UI can
		 * register a listener for this event to update the application display.
		 * @event ItemsAdded
		 * @param {Number} total the total number of items in the playlist
		 */


		//TODO: implement start and stop only if required
		/*
		 * Stops the currently playing item, sets the
		 * @method stop
		 */

		/*
		 *
		 * @method start
		 */

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.MediaPlayer = MediaPlayer;
		return MediaPlayer;
	}
);

