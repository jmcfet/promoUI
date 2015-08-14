/**
 * ViewingStats is a singleton utility class used for retrieving and storing viewing statistics
 * for the current user. It uses the sdp Preferences class to set and get the viewing statistics from sdp
 *
 * @class $N.services.sdp.ViewingStats
 * @static
 * @singleton
 * @requires $N.services.sdp.Preferences
 * @requires $N.platform.system.Preferences
 * @author gstacey
 */

/* global define */
define('jsfw/services/sdp/ViewingStats',
	[
		'jsfw/services/sdp/Preferences',
		'jsfw/platform/system/Preferences',
		'jsfw/apps/util/Util'
	],
	function (Preferences, SystemPreferences, Util) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};

		$N.services.sdp.ViewingStats = (function () {

			var prefs,
				maxWatchedItems,
				itemsExpiry,
				DEFAULT_MAX_ITEMS = 20,
				DEFAULT_ITEMS_EXPIRE = 86400000 * 7, //7 days
				RECENT_WATCHED_PREF = "RECENTLY_WATCHED",
				MOST_WATCHED_PREF = "MOST_WATCHED",
				removeExpiredItemsTimer = null,
				isLocalStorage;

			function getRecentWatchedItems(success, failure) {
				var getSuccess = function (recentWatchedItems) {
						recentWatchedItems = recentWatchedItems ? JSON.parse(recentWatchedItems) : [];
						if (success) {
							success(recentWatchedItems);
						}
					},
					getFailure = function () {
						if (failure) {
							failure();
						}
					},
					response;

				if (isLocalStorage) {
					response = prefs.get(RECENT_WATCHED_PREF);
					if (response) {
						getSuccess(response);
					} else {
						getFailure();
					}
				} else {
					prefs.get(RECENT_WATCHED_PREF, getSuccess, getFailure);
				}
			}

			function getMostWatchedItems(success, failure) {
				var getSuccess = function (mostWatchedItems) {
						mostWatchedItems = mostWatchedItems ? JSON.parse(mostWatchedItems) : [];
						if (success) {
							success(mostWatchedItems);
						}
					},
					getFailure = function () {
						if (failure) {
							failure();
						}
					},
					response;

				if (isLocalStorage) {
					response = prefs.get(MOST_WATCHED_PREF);
					if (response) {
						getSuccess(response);
					} else {
						getFailure();
					}
				} else {
					prefs.get(MOST_WATCHED_PREF, getSuccess, getFailure);
				}
			}

			function storeItems(pref, items, success, failure) {
				var response;
				items = JSON.stringify(items);
				if (isLocalStorage) {
					response = prefs.set(pref, items);
					if (response) {
						success();
					} else {
						failure();
					}
				} else {
					prefs.set(pref, items, "String", "", success, failure);
				}
			}

			function convertMostWatchedItemsToArray(items) {
				var i,
					serviceId,
					serviceIdsArray = [],
					arrayToSort = [];

				//order mostWatchedItems
				for (serviceId in items) {
					if (items.hasOwnProperty(serviceId)) {
						arrayToSort.push([serviceId, items[serviceId]]);
					}
				}

				arrayToSort.sort(function (a, b) {
					if (b[1] === a[1]) {
						return a[0] - b[0];
					}
					return b[1] - a[1];
				});
				//convert back to object to be stored
				for (i = 0; i < arrayToSort.length; i++) {
					serviceIdsArray.push(arrayToSort[i][0]);
				}
				return serviceIdsArray;
			}

			function removeExpiredRecentlyWatchedItems() {
				var onItemsRetrieved = function (recentWatchedItems) {
					var i,
						expiryTime = new Date().getTime() - itemsExpiry;
					for (i = recentWatchedItems.length - 1; i >= 0; i--) {
						if (parseInt(recentWatchedItems[i].ts, 10)  < expiryTime) {
							recentWatchedItems.splice(i, 1);
						} else {
							break;
						}
					}
					if (recentWatchedItems && recentWatchedItems.length > 0) {
						removeExpiredItemsTimer = setTimeout(removeExpiredRecentlyWatchedItems, recentWatchedItems[recentWatchedItems.length - 1].ts - expiryTime);
					}
					storeItems(RECENT_WATCHED_PREF, recentWatchedItems, function () {}, function () {});
				};
				if (removeExpiredItemsTimer) {
					clearTimeout(removeExpiredItemsTimer);
					removeExpiredItemsTimer = null;
				}
				getRecentWatchedItems(onItemsRetrieved, function () {});
			}

			function mostWatchedItemsReceived(mostWatchedItems, newItemContentId, callback) {
				if (!mostWatchedItems) {
					mostWatchedItems = {};
				}
				if (!mostWatchedItems[newItemContentId]) {
					mostWatchedItems[newItemContentId] = 0;
				}
				mostWatchedItems[newItemContentId] += 1;

				storeItems(MOST_WATCHED_PREF, mostWatchedItems, function () {
					callback(true);
				}, function () {
					callback(false);
				});
			}

			function recentItemsRetrieved(recentWatchedItems, newWatchedItem, callback) {
				var startExpiredTimer = false;
				if (!recentWatchedItems || $N.apps.util.Util.isEmptyObject(recentWatchedItems) || recentWatchedItems.length === 0) {
					recentWatchedItems = [];
					startExpiredTimer = true;
				}
				var i;

				recentWatchedItems.unshift(newWatchedItem);

				//remove duplicates
				if (recentWatchedItems.length > 0) {
					for (i = 1; i < recentWatchedItems.length; i++) {
						if (recentWatchedItems[i].cId === newWatchedItem.cId && recentWatchedItems[i].cT === newWatchedItem.cT) { //do we need to parseInt?
							recentWatchedItems.splice(i, 1);
						}
					}
				}

				//trim down to maxWatchedItems size
				recentWatchedItems.splice(maxWatchedItems, recentWatchedItems.length - maxWatchedItems);
				storeItems(RECENT_WATCHED_PREF, recentWatchedItems, function () {
					if (startExpiredTimer) {
						removeExpiredRecentlyWatchedItems();
					}
					if (newWatchedItem.cT === $N.services.sdp.ViewingStats.CONTENT_TYPE.BTV) {
						getMostWatchedItems(function (items) {
							mostWatchedItemsReceived(items, newWatchedItem.cId, callback);
						}, function () {
							mostWatchedItemsReceived({}, newWatchedItem.cId, callback);
						});
					} else {
						callback(true);
					}
				}, function () {
					callback(false);
				});
			}

			return {

				/**
				 * Initialises the ViewinStats class with the given configuration object. This should contain maxWatchedItems, itemsExpiry and useLocalStorage properties.
				 * maxWatchedItems must be a number that defines the maximum amount of watched items that will be stored.
				 * itemsExpiry is a time in milliseconds after which items will be removed from storage.
				 * useLocalStorage is a boolean that when set to true will store in local storage otherwise will store in Head-end
				 * @method init
				 * @param {Object} config
				 * @param {Number} config.maxWatchedItems defines the maximum amount of watched items that will be stored - default 20
				 * @param {Number} config.itemsExpiry Time in milliseconds after which items will be removed from storage - default 7 days
				 * @param {Boolean} config.useLocalStorage If set to true will store in local storage otherwise will store in Head-end
				 */
				init: function (config) {
					maxWatchedItems = config ? config.maxWatchedItems : DEFAULT_MAX_ITEMS;
					itemsExpiry = config ? config.itemsExpiry : DEFAULT_ITEMS_EXPIRE;
					isLocalStorage = config && config.useLocalStorage ? true : false;
					prefs = isLocalStorage ? $N.platform.system.Preferences : $N.services.sdp.Preferences;
					removeExpiredRecentlyWatchedItems();
				},

				/**
				 * Initialises the ViewinStats class with the given configuration object. This should contain maxWatchedItems and itemsExpiry properties.
				 * maxWatchedItems must be a number that defines the maximum amount of watched items that will be stored.
				 * itemsExpiry is a time in milliseconds after which items will be removed from storage
				 * @method initialise
				 * @deprecated use init()
				 * @param {Object} config
				 */
				initialise: function (config) {
					this.init(config);
				},

				/**
				 * Register that the given content has been watched
				 * The callback is fired with a true parameter if successful
				 * and false if fails
				 * @method registerWatch
				 * @param {String} contentId
				 * @param {Number} contentType
				 * @param {Function} callback
				 */
				registerWatch: function (contentId, contentType, callback) {
					if (!callback) {
						callback = function () {};
					}
					var newWatchedItem = {
							cId: contentId,
							cT: contentType,
							ts: new Date().getTime()
						};

					getRecentWatchedItems(function (items) {
						recentItemsRetrieved(items, newWatchedItem, callback);
					}, function () {
						recentItemsRetrieved([], newWatchedItem, callback);
					});
				},

				/**
				 * Calls the given function with an array of serviceIds
				 * @method getMostWatchedChannels
				 * @param {Function} callback
				 */
				getMostWatchedChannels: function (callback) {
					getMostWatchedItems(function (items) {
						callback(convertMostWatchedItemsToArray(items));
					}, function () {
						callback([]);
					});
				},

				/**
				 * Calls the given function with an array of recently watch item objects
				 * Each item will contain cId (content id), cT (content type) and ts (timestamp) properties
				 * @method getRecentlyWatched
				 * @param {Function} callback
				 */
				getRecentlyWatched: function (callback) {
					getRecentWatchedItems(function (items) {
						callback(items);
					}, function () {
						callback([]);
					});
				},

				/**
				 * Clears the most watched data and calls the given function once complete
				 * @method clearMostWatchedData
				 * @param {Function} callback
				 */
				clearMostWatchedData: function (callback) {
					if (!callback) {
						callback = function () {};
					}
					storeItems(MOST_WATCHED_PREF, {}, function () {
						callback(true);
					}, function () {
						callback(false);
					});
				},

				/**
				 * Clears the recently watched data and calls the given function once complete
				 * @method clearRecentlyWatchedData
				 * @param {Function} callback
				 */
				clearRecentlyWatchedData: function (callback) {
					if (!callback) {
						callback = function () {};
					}
					storeItems(RECENT_WATCHED_PREF, [], function () {
						callback(true);
					}, function () {
						callback(false);
					});
				},

				/**
				 * Clears the recently and most watched data and calls the given function once complete
				 * @method clearAllData
				 * @param {Function} callback
				 */
				clearAllData: function (callback) {
					var me = this;
					if (!callback) {
						callback = function () {};
					}
					this.clearMostWatchedData(function () {
						me.clearRecentlyWatchedData(callback);
					});
				},

				/**
				 * One of CONTENT_TYPE.BTV and CONTENT_TYPE.VOD
				 * @property {Number} CONTENT_TYPE
				 * @readonly
				 */
				CONTENT_TYPE: {
					BTV: 1,
					VOD: 2
				},

				_resetForUnitTests: function () {
					if (removeExpiredItemsTimer) {
						clearTimeout(removeExpiredItemsTimer);
						removeExpiredItemsTimer = null;
					}
				}

			};

		}());
		return $N.services.sdp.ViewingStats;
	}
);
