/**
 * When a service provider wishes to show adverts when content is played back, this class can be used to generate
 * a playlist that will contain the main content and the adverts. Each playlist item will have the following attributes:
 * `type, data`. The `type` attribute indicates whether the playlist item is an advert or the actual
 * content (see `PLAYLIST_ITEM_TYPE`), and the `data` attribute has the actual content attributes that will
 * be used by a player (`duration`, `URL`, etc). Additionally, when `type` is `Content`, two additional
 * attributes - `startTime` and `endTime` are also available to indicate the starting and ending
 * times (in seconds) for the different portions of the main content. When `type` is `Advert`, however,
 * the attributes `index` and `totalAds` will be included. These indicate, respectively, the
 * ordinal number of the current advert and the total number in that set of adverts.
 *
 * The order in which the playlist items are returned is the order in which they are to be played out.
 * That is, AdvertManager ensures that pre-roll ads appear in the playlist before the main content, post-roll
 * ads after, and mid-roll ads at appropriate times in between.
 *
 * @class $N.platform.output.AdvertManager
 * @singleton
 *
 * @requires $N.apps.core.Log
 * @requires $N.services.sdp.Adverts
 * @requires $N.services.adverts.VASTDataAdapter
 * @requires jQuery
 */

define('jsfw/platform/output/AdvertManager',
	[
		'jsfw/apps/core/Log',
		'jsfw/services/adverts/VASTDataAdapter',
		'jsfw/services/sdp/Adverts'
	],
	function (Log, VASTDataAdapter, Adverts) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};

		$N.platform.output.AdvertManager = (function () {
			var log = new $N.apps.core.Log('output', 'AdvertManager'),
				assetDurationInSeconds,
				adInsertionPoints = [],
				playlist = [],
				preRollAds = [],
				midRollAds = [],
				postRollAds = [];

			/**
			 * Makes a copy of an existing object
			 * @method clone
			 * @private
			 * @param  {Object} inObj the object to be copied
			 * @return {Object} the cloned object
			 */
			function clone(inObj) {
				var newObj = {},
					key;
				for (key in inObj) {
					if (inObj.hasOwnProperty(key)) {
						newObj[key] = inObj[key];
					}
				}
				return newObj;
			}

			/**
			 * Returns the maximum duration of a given set of videos
			 * @method getMaxDuration
			 * @private
			 * @param {Array} videos the list of videos
			 * @return {Number} the maximum duration
			 */
			function getMaxDuration(videos) {
				var maxDuration = 0;
				$.each(videos, function (index, video) {
					var videoDuration = parseInt(video.duration, 10);
					if (maxDuration < videoDuration) {
						maxDuration = videoDuration;
					}
				});
				return maxDuration;
			}

			/**
			 * Returns a new ad object using the given parameters. This object will be part of the playlist
			 * that's finally sent out.
			 * @method getNewAdItem
			 * @private
			 * @param {Object} advertVideo the advert video
			 * @param {Object} adRollType object describing the roll-type (pre-, mid- or post-roll)
			 * @param {Object} skipPolicy object describing the skip policy for the advert
			 * @param {Number} adIndex the position of the ad in an ad pod
			 * @param {Number} totalAds the total number of ads in the ad pod
			 * @return {Object} the advert object that will be used in the playlist
			 */
			function getNewAdItem(advertVideo, adRollType, skipPolicy, adIndex, totalAds) {
				var adItem = {};
				adItem.type = $N.platform.output.AdvertManager.PLAYLIST_ITEM_TYPE.Advert;
				adItem.rollType = adRollType;
				adItem.data = advertVideo;
				adItem.skipPolicyType = skipPolicy.adSkipPolicyType;
				adItem.skipValue = skipPolicy.value;
				adItem.index = adIndex;
				adItem.totalAds = totalAds;
				return adItem;
			}

			/**
			 * Finds an item in a given playlist that starts before the specified start time
			 * @method findMatchingAsset
			 * @private
			 * @param  {Array} playlist    the playlist to pick the desired item from
			 * @param  {Number} adStartTime the start time of the ad
			 * @param  {Number} adDuration  the duration of the ad
			 * @return {Object} an object that contains the index of the item in the playlist and the item itself
			 */
			function findMatchingAsset(playlist, adStartTime, adDuration) {
				var outAsset = {};
				log('findMatchingAsset', 'ad start: ' + adStartTime + ', adDuration: ' + adDuration + ', endTime: ' + (adStartTime + adDuration));
				$.each(playlist, function (index, listItem) {
					log('findMatchingAsset', 'listItem type: ' + listItem.type + ', startTime: ' + listItem.startTime + ', endTime: ' + listItem.endTime);
					if (listItem.type === $N.platform.output.AdvertManager.PLAYLIST_ITEM_TYPE.Content &&
							(adStartTime >= listItem.startTime && (adStartTime + adDuration) < listItem.endTime)) {
						outAsset.index = index;
						outAsset.item = listItem;
						return false; // get out of $.each
					}
				});
				return outAsset;
			}

			/**
			 * Adds an item to the global `adInsertionPoints` array
			 * @method addInsertionPoint
			 * @private
			 * @param {Number} startTime the start time of the advert
			 * @param {Number} numberOfVideos the total number of videos
			 */
			function addInsertionPoint(startTime, numberOfVideos) {
				adInsertionPoints.push({
					time: startTime,
					count: numberOfVideos
				});
			}

			/**
			 * This function is called by `processAdTags` to insert pre-roll, post-roll
			 * and mid-roll advert videos at appropriate positions in the playlist. For mid-roll ads,
			 * this may involve splitting the content item into many parts.
			 * @method arrangeVideos
			 * @private
			 * @param  {Array} preRollList list of objects containing pre-roll ad data
			 * @param  {Array} postRollList list of objects containing post-roll ad data
			 * @param  {Array} midRollList list of objects containing mid-roll ad data
			 * @param  {Function} invalidDataCallback function to be invoked when it's not possible to insert mid-roll
			 * ads into the playlist
			 */
			function arrangeVideos(preRollList, postRollList, midRollList, invalidDataCallback) {
				// add pre-roll and post-roll ads first - these are straight-forward
				$.each(preRollList, function (index, adInfo) {
					var videos = adInfo.ads,
						preRollTotal = videos.length;
					$.each(videos, function (index, advertVideo) {
						preRollAds.push(getNewAdItem(advertVideo, $N.services.sdp.Adverts.ROLL_TYPE.PRE_ROLL, adInfo.tag.adSkipPolicy, (index + 1), preRollTotal));
					});
				});
				$.each(postRollList, function (index, adInfo) {
					var videos = adInfo.ads,
						postRollTotal = videos.length;
					$.each(videos, function (index, advertVideo) {
						postRollAds.push(getNewAdItem(advertVideo, $N.services.sdp.Adverts.ROLL_TYPE.POST_ROLL, adInfo.tag.adSkipPolicy, (index + 1), postRollTotal));
					});
				});
				$.each(midRollList, function (index, adInfo) {
					var tag = adInfo.tag,
						videos = adInfo.ads,
						adStartTime = tag.advert.value ? parseInt(tag.advert.value, 10) : 0,
						newPosition,
						oldItem,
						newItem,
						midRollTotal = videos.length;
					newPosition = findMatchingAsset(midRollAds, adStartTime, getMaxDuration(videos) || 0);
					if (!newPosition.item || newPosition.index === undefined || newPosition.index === null) {
						invalidDataCallback();
						return; // exit this callback and carry on with the next ad insertion tag
					}
					addInsertionPoint(adStartTime, midRollTotal);
					$.each(videos, function (index, advertVideo) {
						midRollAds.splice(++newPosition.index, 0, getNewAdItem(advertVideo, $N.services.sdp.Adverts.ROLL_TYPE.MID_ROLL, tag.adSkipPolicy, (index + 1), midRollTotal)); //increment newPosition.index to add the video after the item
					});
					oldItem = newPosition.item;
					newItem = clone(oldItem); // now, create a new item (content) to be inserted after the advert and adjust its start and end times
					newItem.startTime = adStartTime;
					newItem.endTime = oldItem.endTime;
					log('arrangeVideos', 'newItem.startTime: ' + newItem.startTime + ', newItem.endTime: ' + newItem.endTime);
					oldItem.endTime = adStartTime; // finally, change the end time of the content item
					log('arrangeVideos', 'oldItem.startTime: ' + oldItem.startTime + ', oldItem.endTime: ' + oldItem.endTime);
					midRollAds.push(newItem);
				});
				return preRollAds.concat(midRollAds, postRollAds);
			}

			/**
			 * This function processes ad insertion tags returned from SDP, and is the starting point in
			 * the generation of the playlist returned by `getPlaylist`
			 * @method processAdTags
			 * @private
			 * @param  {Array} adTags list of ad tags as returned by $N.services.sdp.Adverts
			 * @param  {Function} callback function that will be invoked with the final object
			 */
			function processAdTags(adTags, callback) {
				var adTagsTotal = adTags.length,
					adTagsProcessed = 0,
					preRollAdverts = [],
					midRollAdverts = [],
					postRollAdverts = [],
					invokeCallback = function () {
						adInsertionPoints.sort(function (a, b) {
							return a.time - b.time;
						});
						if (callback) {
							callback({'playlist': playlist, 'adInsertionPoints': adInsertionPoints});
						}
					},
					invalidDataCallback = function () {
						log('processAdTags', 'Invalid data: unable to process mid-roll ads for this tag, ignoring it', Log.LOG_ERROR);
						adTagsProcessed++; // Skip videos since the error is unrecoverable for this ad tag
						if (adTagsTotal === adTagsProcessed) {
							invokeCallback(); // send the data back to the caller if this is the last ad tag
						}
					};
				if (adTagsTotal === 0) {
					invokeCallback();
					return;
				}
				$.each(adTags, function (index, adTag) {
					var adRollType = adTag.advert.advertRollType;
					$N.services.adverts.VASTDataAdapter.getData(adTag, function (adVideos) {
						switch (adRollType) {
						case $N.services.sdp.Adverts.ROLL_TYPE.PRE_ROLL:
							addInsertionPoint(0, adVideos.length);
							preRollAdverts.push({
								ads: adVideos,
								tag: adTag
							});
							break;
						case $N.services.sdp.Adverts.ROLL_TYPE.POST_ROLL:
							addInsertionPoint(assetDurationInSeconds, adVideos.length);
							postRollAdverts.push({
								ads: adVideos,
								tag: adTag
							});
							break;
						case $N.services.sdp.Adverts.ROLL_TYPE.MID_ROLL:
							midRollAdverts.push({
								ads: adVideos,
								tag: adTag
							});
							break;
						}
						adTagsProcessed++;
						if (adTagsProcessed === adTagsTotal) {
							midRollAdverts.sort(function (a, b) {
								return a.tag.advert.value - b.tag.advert.value;
							});
							playlist = arrangeVideos(preRollAdverts, postRollAdverts, midRollAdverts, invalidDataCallback);
							invokeCallback();
						}
					});
				});
			}

			/**
			 * This is the main function that generates the playlist for a given VOD asset
			 * @method getPlaylist
			 * @private
			 * @param {Object} asset the VOD asset
			 * @param {Function} callback the function to invoke when the playlist has been created
			 */
			function getPlaylist(asset, callback) {
				playlist = [];
				adInsertionPoints = [];
				if (preRollAds.length > 0) {
					preRollAds.length = 0;
				}
				if (postRollAds.length > 0) {
					postRollAds.length = 0;
				}
				if (midRollAds.length > 0) {
					midRollAds.length = 0;
				}
				assetDurationInSeconds = Math.round(asset.durationInMillis / 1000);
				// the asset is the first item in the playlist, to start with
				midRollAds.push({
					type: $N.platform.output.AdvertManager.PLAYLIST_ITEM_TYPE.Content,
					data: asset,
					startTime: 0,
					endTime: assetDurationInSeconds
				});
				// get the ad insertion points for the asset
				$N.services.sdp.Adverts.getAdInfoForAsset(asset, function (adTags) {
					processAdTags(adTags, callback);
				});
			}

			return {
				/**
				 * Initialises required internal variables
				 * @method init
				 * @chainable
				 */
				init: function () {
					return this;
				},

				/**
				 * Gets a playlist consisting of the actual video asset and adverts
				 * @method getPlaylistForAsset
				 * @param {Object} asset the asset in question
				 * @param {Function} callback function that's to be invoked with the playlist as its input
				 * @async
				 */
				getPlaylistForAsset: getPlaylist,

				/**
				 * The different types of list item in the playlist generated by `getPlaylistForAsset`. Can be one of
				 * `Advert` or `Content`.
				 * @property {Object} PLAYLIST_ITEM_TYPE
				 */
				PLAYLIST_ITEM_TYPE: {
					'Advert': 0,
					'Content': 1
				}
			};

		}());
		return $N.platform.output.AdvertManager;
	}
);