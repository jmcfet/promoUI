/**
 * Contains logic for building a playlist consisting of the content and adverts
 * and starts playback of this playlist
 *
 * @class $N.platform.output.Adverts
 * @constructor
 *
 * @author Gareth Stacey
 */

define('jsfw/platform/output/Adverts',
    [
    	'jsfw/platform/output/AdvertManager',
    	'jsfw/apps/core/Log'
    ],
	function (AdvertManager, Log) {
		'use strict';

		var log = new $N.apps.core.Log("output", "Adverts"),
			player,
			Playlist,
			PLAYLIST_ITEM_TYPE = {
				'Advert': 0,
				'Content': 1
			},
			listenersRegistered = false,
			controlsEnabled = false,
			autoPlay = false;

		function Adverts(playoutManager) {
			var me = this;
			Playlist = (function () {
				/*
				 * This class is used internally by Adverts
				 *
				 * @class Playlist
				 * @singleton
				 * @for Adverts
				 */
				//Private members
				var items = [],
					currentItemIndex,
					contentStartTime = -1,
					playListEnded = false;

				return {

					/*
					 * Initialises the playlist
					 * @method init
					 */
					init: function () {
						currentItemIndex = -1;
						playListEnded = false;
					},

					/*
					 * Initialises the playlist
					 * @method initialise
					 * @deprecated use init()
					 */
					initialise: function () {
						this.init();
					},

					/*
					 * Populates the playlist with the given list of items
					 * @method setItems
					 * @chainable
					 * @param {Array} itemList list of items
					 */
					setItems: function (itemList) {
						items.length = 0;
						items = itemList;
						return this;
					},

					/*
					 * Returns the items in the playlist
					 * @method getItems
					 * @return {Array} list of items
					 */
					getItems: function () {
						return items;
					},

					/*
					 * Returns the item that's to be played back next. Also updates the list by removing adverts that
					 * have already been played / skipped.
					 * @method getNextItem
					 * @for PlayoutManager
					 * @return {Object} the next item in the list, or null if the last item has been played back.
					 */
					getNextItem: function () {
						var currentItem,
							nextItem,
							previousItem,
							i,
							newTotal;
						currentItem = items[currentItemIndex];
						if (currentItem && isItemAdvert(currentItem)) {
							if (currentItemIndex === 0) {
								items.splice(currentItemIndex, 1);
								--currentItemIndex;
							} else {
								previousItem = items[currentItemIndex - 1];
								if (isItemContent(previousItem)) {
									nextItem = items[currentItemIndex + 1];
									if (nextItem && isItemContent(nextItem)) {
										contentStartTime = nextItem.startTime;
										nextItem.startTime = 0;
										items.splice(currentItemIndex - 1, 2);
										currentItemIndex -= 2;
									} else {
										items.splice(currentItemIndex, 1);
										--currentItemIndex;
									}
								}
							}
							nextItem = items[currentItemIndex + 1];
							if (nextItem && isItemAdvert(nextItem)) {
								nextItem.totalAds--;
								newTotal = nextItem.totalAds;
								for (i = currentItemIndex + 1; i < items.length; i++) {
									nextItem = items[i];
									if (nextItem && isItemAdvert(nextItem)) {
										nextItem.index--;
										nextItem.totalAds = newTotal;
									} else {
										break; // we're concerned only about updating the current set of ads
									}
								}
							}
						}
						return items[++currentItemIndex] || null;
					}
				};
			}());
			player = playoutManager;
			$N.platform.output.AdvertManager.init();
			this._adInsertionPoints = [];
			this._skipEventFired = false;
			this._contentMapper = null;
			this._savedCurrentTime = 0;

			/**
			 * Called when the ended event is fired
			 * @method _endedListener
			 * @private
			 * @param {Object} event
			 */
			this._endedListener = function () {
				log('ended', 'video ended ' + player.currentTime);
				var eventPayload = {
						target: me
					};
				if (me._playingContent && isItemAdvert(me._playingContent)) {
					eventPayload.index = me._playingContent.index;
					eventPayload.totalAds = me._playingContent.totalAds;
					player._fireEvent('advertEnded', eventPayload);
				} else {
					eventPayload.content = me._playingContent;
					eventPayload.playbackPosition = player.currentTime;
				}
				me._playNextItem();
			};

			/**
			 * Called when the timeupdate event is fired
			 * @method _timeupdateListener
			 * @private
			 * @param {Object} event
			 */
			this._timeupdateListener = function () {
				var eventPayload = {
						target: me
					};
				if (!isItemAdvert(me._playingContent) && me._playingContent.endTime && me._playingContent.endTime > 0 && me._playingContent.endTime <= player.currentTime) {
					me._savedCurrentTime = player.currentTime;
					me._playNextItem();
				} else if (isItemAdvert(me._playingContent) && me.canSkipCurrentAdvert() && (!me._skipEventFired)) {
					eventPayload.index = me._playingContent.index;
					eventPayload.totalAds = me._playingContent.totalAds;
					player._fireEvent("canSkipAdvert", eventPayload);
					me._skipEventFired = true;
				}
			};

			/**
			 * Called when the canplay event is fired
			 * @method _canplayListener
			 * @private
			 */
			this._canplayListener = function () {
				var eventPayload = {
						target: me
					};
				if (me._playingContent && isItemAdvert(me._playingContent)) {
					eventPayload.index = me._playingContent.index;
					eventPayload.totalAds = me._playingContent.totalAds;
					player._fireEvent("advertStarted", eventPayload);
					me._reportAdImpression();
				}
			};

			/**
			 * Called when the error event is fired
			 * @method _errorListener
			 * @private
			 */
			this._errorListener = function () {
				if (me.src !== '') {
					me._playNextIfAdvertError();
				}
			}
		}

		function isItemAdvert(item) {
			return item ? (item.type === PLAYLIST_ITEM_TYPE.Advert) : false;
		}

		function isItemContent(item) {
			return item ? (item.type === PLAYLIST_ITEM_TYPE.Content) : false;
		}

		var proto = Adverts.prototype;

		/*
		 * Private Methods
		 */

		/**
		 * Calls the URLs in the 'impressions' data attribute of the ad. This is for VAST conformance.
		 * @method _reportAdImpression
		 * @private
		 */
		proto._reportAdImpression = function () {
			var impressions = this._playingContent.data.impressions;
			if (impressions && impressions.length) {
				impressions.forEach(function (impression) {
					$.get(impression, function (data, status) {
						log('_reportAdImpression', 'data: ' + data + ', status: ' + status);
					});
				});
			}
		};

		/**
		 * Forces playback to the next item if an advert play back fails
		 * @method _playNextIfAdvertError
		 * @private
		 */
		proto._playNextIfAdvertError = function () {
			log('_playNextIfAdvertError', 'Enter');
			if (this._playingContent && isItemAdvert(this._playingContent)) {
				this._playNextItem();
			}
			log('_playNextIfAdvertError', 'Exit');
		};

		/**
		 * Fetches and plays the next (if any) item in the playlist
		 * @method _playNextItem
		 * @private
		 */
		proto._playNextItem = function () {
			log('_playNextItem', 'Enter');
			var contentURL,
				eventPayload,
				startTime;
			this._playingContent = Playlist.getNextItem();
			if (this._playingContent) {
				this.playCount = 0;
				if (isItemAdvert(this._playingContent)) {
					player._unregisterListeners();
					this._skipEventFired = false;
					this._playingContent.skipTime = this._getSkipValue(this._playingContent);
					player.controls = false;
					contentURL = this._playingContent.data.uri;
					player.src = contentURL;
					player.load(); // required for NMPC
					player.autoPlay = true;
				} else {
					player._registerListeners();
					startTime = this._savedCurrentTime > -1 ? this._savedCurrentTime : 0;
					player._playContentMapperObject(this._contentMapper, startTime);
					player.controls = controlsEnabled;
				}
			} else {
				log('_playNextItem', 'no more items, stopping playback');
				player.stop();
				player._fireEvent("playListEnded", {target: this, playlist: Playlist.getItems()});
				player.autoPlay = autoPlay;
				this.unregisterListeners();
				player._registerListeners();
			}
			log('_playNextItem', 'Exit');
		};

		/**
		 * Returns the number of seconds after which the advert can be skipped.
		 * @method _getSkipValue
		 * @private
		 * @param  {Object} playListItem the playlist item for which the skip value is to be determined
		 * @return {Number} the skip value
		 */
		proto._getSkipValue = function (playListItem) {
			var skipValue = null;

			if (playListItem.skipPolicyType) {
				switch (playListItem.skipPolicyType) {
				case "SKIP_AFTER_SEC":
					skipValue = playListItem.skipValue ? parseInt(playListItem.skipValue, 10) : 0;
					break;
				case "NO_SKIP":
					skipValue = playListItem.skipValue ? null : -1; //TODO: check this - assuming skipValue is true / false when skipPolicy is NO_SKIP
					break;
				}
			}
			return skipValue;
		};

		/**
		 * Checks whether the currently playing advert can be skipped (as determined by its skip policy)
		 * @method canSkipCurrentAdvert
		 * @return {Boolean} true if it's okay to skip the advert, false if the current item is not an advert
		 * or if its skip policy doesn't allow it
		 */
		proto.canSkipCurrentAdvert = function () {
			var skipTime = (this._playingContent.skipTime !== undefined && this._playingContent.skipTime !== null) ? this._playingContent.skipTime : -1;
			return skipTime !== -1 && player.currentTime >= skipTime;
		};

		/**
		 * Skips an advert if one is currently playing and its skip policy allows it. Should be
		 * called in response to the `canSkipAdvert` event. Doesn't do anything if an
		 * advert is not currently playing.
		 * @method skip
		 */
		proto.skip = function () {
			log("skip", "Enter");
			if (this.canSkipCurrentAdvert()) {
				this._playNextItem();
			}
			log("skip", "Exit");
		};

		/**
		 * Restarts the playlist.
		 * @method restart
		 */
		proto.restart = function () {
			log("restart ", "Enter");
			var payload = {
				target: this,
				playlist: Playlist.getItems()
			};
			Playlist.init();
			this._savedCurrentTime = -1;
			player._fireEvent('playListStarted', payload);
			this._playNextItem();
		};

		/**
		 * Registers the required listeners with the player
		 * @method _registerListeners
		 * @private
		 */
		proto._registerListeners = function () {
			if (!listenersRegistered) {
				player.addEventListener("ended", this._endedListener);
				player.addEventListener("timeupdate",  this._timeupdateListener);
				player.addEventListener("canplay",  this._canplayListener);
				player.addEventListener("error",  this._errorListener);
				listenersRegistered = true;
			}
		};

		/**
		 * Unregisters the previously registered listeners from the player
		 * @method unregisterListeners
		 */
		proto.unregisterListeners = function () {
			if (listenersRegistered) {
				player.removeEventListener("ended",  this._endedListener);
				player.removeEventListener("timeupdate",  this._timeupdateListener);
				player.removeEventListener("canplay",  this._canplayListener);
				player.removeEventListener("error",  this._errorListener);
				listenersRegistered = false;
			}
		};

		/**
		 * Plays the given content. Will create a playlist consisting of adverts and the content passed.
		 * The content should be an instance of a content mapper
		 * @method playContent
 		 * @param {Object} content
 		 * @param {Object} position in seconds where to begin playback
		 */
		proto.playContent = function (content, position) {
			log("playContent ", "Enter");
			var me = this,
				eventPayload = {
					target: me
				};
			this._content = content.getContent();
			this._contentMapper = content;
			this._adInsertionPoints = [];
			this._savedCurrentTime = position || -1;
			controlsEnabled = player.controls;
			autoPlay = player.autoPlay;
			log('playContent', 'getting playlist using advertManager');
			$N.platform.output.AdvertManager.getPlaylistForAsset(this._content, function (output) {
				eventPayload.playlist = output.playlist;
				me._adInsertionPoints = output.adInsertionPoints;
				Playlist.setItems(output.playlist);
				Playlist.init();
				player._fireEvent('playListStarted', eventPayload);
				if (output.playlist.length > 1) {
					me._registerListeners();
				}
				me._playNextItem();
			});
		};

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.Adverts = Adverts;
		return Adverts;
	}
);