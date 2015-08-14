/**
 * This class is responsible for handling subscribed IP channels.
 * If using IPDataLoader to load and cache channels, subscriptions will
 * refreshed on a regular interval. If not using IPDataLoader it is down
 * to the app to refresh the subscriptions using Subscriptions.refreshSubscriptions()
 * This must be called prior to requesting subscribed channels for the first time.
 * @class $N.services.sdp.Subscriptions
 * @static
 * @singleton
 * @requires $N.apps.core.Log
 * @requires $N.services.sdp.ServiceFactory
 * @requires $N.services.sdp.EPG
 * @requires $N.Config
 * @author Gareth Stacey
 */
/* global define */
define('jsfw/services/sdp/Subscriptions',
	[
		'jsfw/apps/core/Log',
		'jsfw/services/sdp/ServiceFactory',
		'jsfw/services/sdp/EPG',
		'jsfw/Config',
		'jsfw/apps/util/Util',
		'jsfw/apps/util/JSON'
	],
	function (Log, ServiceFactory, EPG, Config, Util, JSON) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};

		$N.services.sdp.Subscriptions = (function () {
			var channelLookup = {},
				eventLookup = {},
				JSON = window.JSON || $N.apps.util.JSON;

			function fireEvent(eventName, payload) {
		        if (eventLookup[eventName]) {
		            eventLookup[eventName].forEach(function (callback) {
		                callback(payload || null);
		            });
		        }
		    }

			function getSubscribedChannelIds() {
				var subscribedChannelIds = [];
				for (serviceId in channelLookup) {
					if (channelLookup.hasOwnProperty(serviceId)) {
						subscribedChannelIds.push(serviceId);
					}
				}
				return subscribedChannelIds;
			}

			function getChannelsForPackages(aclItems, callback) {
				var packageIds = [],
					i,
					packageIdsLookup = {},
					packageId;
				for (i = 0; i < aclItems.length; i++) {
					if (aclItems[i].purchasedItemType === "PKG" && aclItems[i].purchaseType === "SUBSCRIPTION") {
						packageId = aclItems[i].purchasedItemOriginKey || aclItems[i].purchasedItemUID;
						if (!packageIdsLookup[packageId]) {
							packageIds.push(packageId);
							packageIdsLookup[packageId] = true;
						}
					}
				}
				packageIds.sort(function (a, b) { return a - b; });
				if (packageIds.length > 0) {
					$N.services.sdp.EPG.fetchChannelsForPackages(packageIds, function (channels) {
						var newSubscribedChannelIds = [],
							newChannelsLookup = {},
							currentSubscribedChannelIds = getSubscribedChannelIds().sort();

						for (i = 0; i < channels.length; i++) {
							if (!newChannelsLookup[channels[i].serviceId]) {
								newChannelsLookup[channels[i].serviceId] = channels[i];
								newSubscribedChannelIds.push(channels[i].serviceId);
							}
						}
						newSubscribedChannelIds.sort();
						if (JSON.stringify(currentSubscribedChannelIds) !== JSON.stringify(newSubscribedChannelIds)) {
							channelLookup = newChannelsLookup;
							fireEvent("subscriptionsChanged", $N.services.sdp.Subscriptions.getSubscribedChannels());
						} else {
							channelLookup = newChannelsLookup;
						}
						callback();
					});
				} else {
					callback();
				}
			}

			function getPackages(locale, accountUid, callback) {
				$N.services.sdp.ServiceFactory.get("AcquiredContentListService").getByAccountUIDAndItemType(this, function (aclItems) {
					getChannelsForPackages(aclItems, callback);
				}, callback, accountUid, "CURRENT", "PKG", locale);
			}

			return {
				/**
				 * On first call will set up subscriptions and then will refresh]
				 * the subscriptions on any subsequent calls.
				 * Must be called prior to requesting subscribed channels the first time
				 * @method refreshSubscriptions
 				 * @param {Function} callback Callback function once complete
				 */
				refreshSubscriptions: function (callback) {
					if (!callback) {
						callback = function () {};
					}

					$N.services.sdp.ServiceFactory.get("ContextService").getCurrentContext(this, function (context) {
						getPackages(context.locale, context.accountUid, callback);
					}, function () {callback();});
				},

				/**
				 * Returns an array of subscribed channels.
				 * Each channel object within the array will be
				 * mapped to an EPGService data object
				 * @method getSubscribedChannels
				 */
				getSubscribedChannels: function () {
					var subscribedChannels = [];
					for (serviceId in channelLookup) {
						if (channelLookup.hasOwnProperty(serviceId)) {
							subscribedChannels.push(channelLookup[serviceId]);
						}
					}
					return subscribedChannels;
				},

				/**
				 * Returns true if the given service id is subscribed, false otherwise
				 * @method isChannelSubscribed
 				 * @param {String} serviceId
 				 * @return {Boolean} True if the given service id is subscribed, false otherwise
				 */
				isChannelSubscribed: function (serviceId) {
					if (channelLookup[serviceId]) {
						return true;
					}
					return false;
				},

				/**
				 * Registers a callback for a given event name
				 * @method addEventListener
				 * @param {String} eventName name of the event
				 * @param {Function} callback the listener
				 */
				addEventListener: function (eventName, callback) {
					if (!eventLookup[eventName]) {
			            eventLookup[eventName] = [];
			        }
			        eventLookup[eventName].push(callback);
				},

				/**
				 * Unregisters a callback for a given event name
				 * @method removeEventListener
				 */
				removeEventListener: function (eventName, callback) {
			        if (eventLookup[eventName]) {
			            eventLookup[eventName] = eventLookup[eventName].filter(function (value) { return value !== callback; });
			        }
			    }

			    /**
				 * Dispatched when the subscriptions change
				 * @event subscriptionsChanged
				 */
			};
		}());
		return $N.services.sdp.Subscriptions;
	}
);