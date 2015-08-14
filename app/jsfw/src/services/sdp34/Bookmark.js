/**
 * This class manages bookmarks for a video content item
 * provided over IP such as VOD and catchup. Currently this class supports
 * only one bookmark per piece of content against a user account in line
 * with the SDP API.
 * @class $N.services.sdp.Bookmark
 * @requires $N.services.sdp.ServiceFactory
 * @requires $N.apps.core.Log
 * @constructor
 */
/* global define */
define('jsfw/services/sdp/Bookmark',
	[
		'jsfw/apps/core/Log',
		'jsfw/services/sdp/ServiceFactory'
	],
	function (Log, ServiceFactory) {

		var log = new $N.apps.core.Log("SDP", "Bookmark");
		var bookmark;
		var Bookmark = function () {
			this._bookMarkService = $N.services.sdp.ServiceFactory.get("BookmarkService");
			this._bookMarkUid = null;
			this._contentUid = null;
			this._contentType = null;
			this._duration = 0;
			this._acctUID = null;
			this._locale = "en_gb";
		};

		/**
		 * Enumerates the content types allowed for Bookmark requests. One of AST, ASSET, RECORDING
		 * @type {Object}
		 */
		Bookmark.ContentTypes = {
			AST: "AST",
			ASSET: "ASSET",
			RECORDING: "RECORDING"
		};

		Bookmark.init = function (accountId) {
			bookmark = new Bookmark();
			bookmark.setAccountId(accountId);
		};

		/**
		 * Requests the bookmark position for the given content
		 * @method getBookmarkForContent
		 * @async
		 * @param {String/Number} contentId
		 * @param {String} contentType
		 * @param {Function} callback
		 * @param {String} locale
		 */
		Bookmark.getBookmarkForContent = function (contentId, contentType, callback, locale) {
			bookmark.setContentUid(contentId);
			bookmark.setContentType(contentType);
			bookmark.setLocale(locale);
			bookmark.getCurrentBookmark(callback);
		};

		/**
		 * Checks if the position is bookmarkable for the given content as determined by `isCurrentPositionBookmarkable`
		 * and if it is, then bookmarks against the given position. Otherwise, it deletes the bookmark.
		 * @method deleteOrBookmarkCurrentPositionForContent
		 * @param {Number} position in seconds
		 * @param {Number} duration in seconds
		 * @param {String/Number} contentId
		 * @param {String} contentType
		 * @param {Function} callback
		 * @param {String} locale
		 */
		Bookmark.deleteOrBookmarkCurrentPositionForContent = function (position, duration, contentId, contentType, callback, locale) {
			bookmark.setContentUid(contentId);
			bookmark.setContentType(contentType);
			bookmark.setContentDuration(duration);
			bookmark.setLocale(locale);
			bookmark.deleteOrBookmarkCurrentPosition(position, callback);
		};

		/**
		 * Deletes the book mark for the given content
		 * @method deleteBookmarkForContent
		 * @param {String/Number} contentId
		 * @param {String} contentType
		 * @param {Function} callback
		 * @param {String} locale
		 */
		Bookmark.deleteBookmarkForContent = function (contentId, contentType, callback, locale) {
			bookmark.setContentUid(contentId);
			bookmark.setContentType(contentType);
			bookmark.setLocale(locale);
			bookmark.getCurrentBookmark(function (position) {
				if (position !== 0) {
					bookmark.deleteBookmark(callback);
				} else {
					if (callback) {
						callback(0);
					}
				}
			});
		};

		/**
		 * The amount of the content that can be bookmarked.
		 * @property {Number} BOOKMARKABLE_CONTENT_RATIO
		 */
		Bookmark.BOOKMARKABLE_CONTENT_RATIO = 0.96; //96%

		var proto = Bookmark.prototype;

		/**
		 * Returns the content uid used to store the bookmark against
		 * @method getContentUid
		 * @return {Number} uid
		 */
		proto.getContentUid = function () {
			return this._contentUid;
		};

		/**
		 * Sets the locale used in bookmark call
		 * @method setLocale
		 * @chainable
		 * @param {String} locale
		 */
		proto.setLocale = function (locale) {
			if (locale) {
				this._locale = locale;
			}
			return this;
		};

		/**
		 * Sets the content uid used to store the bookmark against
		 * @method setContentUid
		 * @chainable
		 * @param {Number} uid
		 */
		proto.setContentUid = function (uid) {
			this._contentUid = uid;
			return this;
		};

		/**
		 * Sets the content type, one of `ASSET` for VOD or `PROGRAM`
		 * from catchup
		 * @method setContentType
		 * @chainable
		 * @param {String} type
		 */
		proto.setContentType = function (type) {
			this._contentType = type;
			return this;
		};

		/**
		 * Sets the account id used to store the bookmark against
		 * @method setAccountId
		 * @chainable
		 * @param {Number} accountId
		 */
		proto.setAccountId = function (accountId) {
			this._acctUID = accountId;
			return this;
		};

		/**
		 * Convenience method to set all the required parameters: content UID,
		 * content type and Account Id.  This method or the individual setter
		 * methods must be called prior to setting or getting a bookmark.
		 * @method init
		 * @chainable
		 * @param {Number} contentUid
		 * @param {String} type
		 * @param {Number} accountId
		 * @param {String} locale
		 */
		proto.init = function (contentUid, type, accountId, locale) {
			this.setContentUid(contentUid);
			this.setContentType(type);
			this.setAccountId(accountId);
			this.setLocale(locale);
			return this;
		};

		/**
		 * Allow the duration of the content to be set. Useful when you
		 * have to wait to get duration based on video server data. This method
		 * allows the `deleteOrBookmarkCurrentPosition` method to operate.
		 * @method setContentDuration
		 * @param {Number} seconds
		 */
		proto.setContentDuration = function (seconds) {
			this._duration = parseInt(seconds, 10);
		};

		/**
		 * Requests the bookmark position for the cached content. To actually get a bookmark, you need to
		 * call the function returned by this method with a callback. This callback is asynchronously called
		 * with the bookmark position (or 0 if no bookmark was found) and the content id when the bookmark has been retrieved.
		 * @method getCurrentBookmark
		 * @async
		 * @param {Function} callback accepts the position and the content id
		 * @return {Function} You have to invoke this function with a callback. See method description.
		 */
		proto.getCurrentBookmark = (function () {
			var returnCallback,
				me;

			var getBookmarkForAccountAndContentSuccess = function (result, contentUid) {
				log("getBookmarkForAccountAndContentSuccess", "The result is " + result);
				if (result && result.position > 0) {
					if (result.uID && !result.uid) { //TODO: This is a hack. Will remove once confirmation received as to correct name of uid
						result.uid = result.uID;
					}
					log("getBookmarkForAccountAndContentSuccess", "The Position is  " + String(result.position));
					log("getBookmarkForAccountAndContentSuccess", "The Bookmark UID is  " + result.uid);
					me._bookMarkUid = result.uid;
					me._bookmarkPosition = result.position;
					returnCallback(me._bookmarkPosition, contentUid);
				} else {
					returnCallback(0, contentUid);
				}
			};

			var getBookmarkForAccountAndContentFailed = function (result, contentUid) {
				log("getBookmarkForAccountAndContentFailed", "Failed in Finding a book mark at position");
				returnCallback(0, contentUid);
			};

			//This is the public function that gets called on getCurrentBookmark
			return function (callback) {
				me = this;
				log("getCurrentBookmark", "Enter");
				returnCallback = callback;

				if (this._contentType === "ASSET" || this._contentType === "AST") {
					this._bookMarkService.getBookmarkForContent(this, function (response) {
						getBookmarkForAccountAndContentSuccess(response, me._contentUid);
					}, function (response) {
						getBookmarkForAccountAndContentFailed(response, me._contentUid);
					},
						this._contentUid,
						this._contentType,
						this._locale);
				} else {
					this._bookMarkService.getBookmarkForOrigin(this, function (response) {
						getBookmarkForAccountAndContentSuccess(response, me._contentUid);
					}, function (response) {
						getBookmarkForAccountAndContentFailed(response, me._contentUid);
					},
						2, // required for locker service
						this._contentUid,
						this._contentType,
						Bookmark.ContentTypes.ASSET);
				}
				log("getCurrentBookmark", "getCurrentBookmark Exit");
			};
		}());

		/**
		 * Determines if the given playback position is within the value specified
		 * in `BOOKMARKABLE_CONTENT_RATIO`.
		 * @method isCurrentPositionBookmarkable
		 * @param {Number} position the desired position
		 * @return {Boolean} true if the position can be bookmarked, false otherwise
		 */
		proto.isCurrentPositionBookmarkable = function (position) {
			var maxPosition = this._duration * Bookmark.BOOKMARKABLE_CONTENT_RATIO;
			return (position < maxPosition);
		};

		/**
		 * Bookmarks the content identified by the account Id, content UID and contentType
		 * previously set by initalisation of this class at the position given.
		 * @method bookmarkCurrentPosition
		 * @param {Object} position
		 */
		proto.bookmarkCurrentPosition = function (position, callback) {
			log("bookmarkCurrentPosition", "Enter ACC UID " + this._acctUID);

			if (!callback) {
				callback = function () {};
			}

			if (this._contentUid) {
				log("bookmarkCurrentPosition", "Book marking started playbackPosition " + position);

				if (this._contentType === "ASSET" || this._contentType === "AST") {
					this._bookMarkService.setBookmarkForContent(
						this,
						function (result) {
							log("bookmarkCurrentPosition", "Success in book marking " + result);
							callback(true);
						},
						function (result) {
							log("bookmarkCurrentPosition", "Failed in book marking " +	result);
							callback(false);
						},
						this._contentUid,
						this._contentType,
						parseInt(position, 10),
						this._locale
					);
				} else {
					this._bookMarkService.setBookmarkForOrigin(
						this,
						function (result) {
							log("bookmarkCurrentPosition", "Success in book marking by origin" + result);
							callback(true);
						},
						function (result) {
							log("bookmarkCurrentPosition", "Failed in book marking by origin" +	result);
							callback(false);
						},
						2, // required for locker service
						this._contentUid,
						this._contentType,
						Bookmark.ContentTypes.ASSET,
						parseInt(position, 10)
					);
				}
			} else {
				log("bookmarkCurrentPosition", "The current position is not book marked invalid account");
		    }
			log("bookmarkCurrentPosition", "Exit");
		};

		/**
		 * Checks if the position is bookmarkable as determined by `isCurrentPositionBookmarkable`
		 * and if it is, then bookmarks against the given position. Otherwise, it deletes the bookmark.
		 * @method deleteOrBookmarkCurrentPosition
		 * @param {Number} position in seconds
		 * @param {Function} callback
		 * @return {Boolean} True if position is bookmarked, false if deleted
		 */
		proto.deleteOrBookmarkCurrentPosition = function (position, callback) {
			if (!callback) {
				callback = function () {};
			}
			if (this.isCurrentPositionBookmarkable(position)) {
				this.bookmarkCurrentPosition(position, callback);
				return true;
			}
			this.deleteBookmark(callback);
			return false;
		};

		/**
		 * Deletes the book mark. Requires that a call to `getCurrentBookmark`
		 * has already take place.
		 * @method deleteBookmark
		 * @param {Function} callback
		 */
		proto.deleteBookmark = function (callback) {
			log("deleteBookmark", "Enter");
			if (!callback) {
				callback = function () {};
			}
			if (this._bookMarkUid) {
				this._bookMarkService.deleteBookmarkByUid(
					this,
					function (result) {
						log("deleteBookmark", "Bookmark successfully deleted ");
						callback(true);
					},
					function (result) {
						log("deleteBookmark", "Failed in deleting the bookmark");
						callback(false);
					},
					this._bookMarkUid
				);
		    }
			log("deleteBookmark", "Exit");
		};

		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};
		$N.services.sdp.Bookmark = Bookmark;
		return Bookmark;
	}
);
