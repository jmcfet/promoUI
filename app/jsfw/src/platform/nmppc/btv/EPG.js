/**
 * This class manages EPG data: it retrieves cached EPG data from the EPGCache class. Typical
 * usage would be:
 *
 *     EPG.getRadioChannels()
 *     EPG.getSubscribedChannels()
 * and so on.
 *
 * @class $N.platform.btv.EPG
 * @singleton
 * @requires $N.apps.core.Log
 * @requires $N.data.EPGService
 * @requires $N.platform.btv.EPGCache
 * @requires $N.services.sdp.Ratings
 * @requires $N.services.gateway.HomeCruise
 * @requires $N.service.sdp.EPG
 * @requires
 * @author Gareth Stacey
 */

/* global define, setTimeout */

define('jsfw/platform/btv/EPG',
	[
		'jsfw/apps/core/Log',
		'jsfw/data/EPGService',
		'jsfw/platform/btv/EPGCache',
		'jsfw/platform/btv/PersistentCache',
		'jsfw/services/sdp/Ratings',
		'jsfw/services/sdp/EPG',
		'jsfw/platform/btv/HybridServiceFactory'
	],
	function (Log, EPGService, EPGCache, PersistentCache, Ratings, EPG, HybridServiceFactory) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.btv = $N.platform.btv || {};

		$N.platform.btv.EPG = (function () {
			var log = new $N.apps.core.Log("btv", "EPG"),
				LOG_LEVEL_INFO = 'info',
				DEFAULT_CACHE_EXPIRY_TIME = 3600000,
				DEFAULT_EXPIRED_EVENTS_TIME = 86400000 * 7,
				DEFAULT_CHECK_EXPIRED_EVENTS_TIME = 86400000,
				headEndServices = [],
				ipChannelList = [],
				subscribedChannelList = [],
				radioChannelList = [],
				videoChannelList = [],
				allChannels = {},
				allChannelList = [],
				epgCache,
				dataSources = [],
				serviceIdArray = [],
				ipServiceIdArray = [],
				refreshCallbacks = [],
				cacheEvents = true,
				merge = {
					doMerge: false,
					channelList: [],
					areChannelsTheSame: function () {},
					fieldList: [],
					includeUnmatched: false
				},
				cacheTypes = {
					Persistent: 'PC',
					RAM: 'RC'
				},
				DATA_SOURCES = {
					GATEWAY: 'GATEWAY',
					SDP: 'SDP'
				},
				dataSource,
				cacheExpiry;

//TODO: Need to cater for scenario where all channels in A list plus only matching channels in B list are returned

			var mergeChannelData = function () {
				var i,
					j,
					mdsChannels = headEndServices.slice(0),
					mergedChannel = {},
					mergedChannels = [];

				for (j = 0; j < mdsChannels.length; j++) {
					for (i = 0; i < merge.channelList.length; i++) {
						if (merge.areChannelsTheSame(mdsChannels[j], merge.channelList[i])) {
							mergedChannel = $N.platform.btv.HybridServiceFactory.mergeObjects(mdsChannels[j], merge.channelList[i], merge.fieldList);
							mergedChannels.push(mergedChannel);
							merge.channelList[i].hasBeenMerged = true;
							mdsChannels[j].hasBeenMerged = true;
						}
					}
				}

				if (merge.includeUnmatched) {
					for (i = 0; i < merge.channelList.length; i++) {
						if (!merge.channelList[i].hasBeenMerged) {
							mergedChannels.push(merge.channelList[i]);
						}
					}
					for (j = 0; j < mdsChannels.length; j++) {
						if (!mdsChannels[j].hasBeenMerged) {
							mergedChannels.push(mdsChannels[j]);
						}
					}
				}
				return mergedChannels;
			};

			/**
			 * Updates the cached service list. Categorises channels as DVB and IP, besides also
			 * recognising radio channels, and user-subscribed channels.
			 * Called by refreshChannels, mergeChannels and unMergeChannels
			 *
			 * @method refreshChannelData
			 * @private
			 */
			var refreshChannelData = function () {
				var i,
					channel;

				ipChannelList.length = 0;
				radioChannelList.length = 0;
				subscribedChannelList.length = 0;
				videoChannelList.length = 0;
				allChannels = {};
				serviceIdArray.length = 0;
				ipServiceIdArray.length = 0;

				if (merge.doMerge) {
					allChannelList = mergeChannelData();
				} else {
					allChannelList = headEndServices;
				}

				// populate the hashes and lists afresh
				for (i = 0; i < allChannelList.length; i++) {
					channel = allChannelList[i];
					allChannels[channel.serviceId] = channel;
					serviceIdArray.push(channel.serviceId);
					ipChannelList.push(channel);
					ipServiceIdArray.push(channel.serviceId);
					if (channel.isSubscribed) {
						subscribedChannelList.push(channel);
					}
					if (channel.serviceType === $N.data.EPGService.SERVICE_TYPE.RADIO) {
						radioChannelList.push(channel);
					}
					if (channel.serviceType === $N.data.EPGService.SERVICE_TYPE.TV) {
						videoChannelList.push(channel);
					}
				}
			};

			/**
			 * Updates the cached service list. Categorises channels as DVB and IP, besides also
			 * recognising radio channels, and user-subscribed channels.Mainly called when the
			 * EPGServicesUpdated event is fired, and also by other
			 * methods of this class.
			 *
			 * @method refreshChannels
			 * @private
			 * @param {Boolean} fireRefreshCallbacks
			 * @param {Function} callback Function to run once channels have been refreshed
			 */
			var refreshChannels = function (fireRefreshCallbacks, callback) {
				var channel,
					i,
					servicesLength;
				epgCache.fetchServices(function (services) {
					headEndServices = services;
					refreshChannelData();
					if (fireRefreshCallbacks) {
						for (i = 0; i < refreshCallbacks.length; i++) {
							refreshCallbacks[i].callbackFunction.call(refreshCallbacks[i].caller);
						}
					}
					if (callback) {
						callback();
					}
				});
			};

			var hasCachedEventExpired = function (cachedEvent) {
				return (new Date().getTime() - cachedEvent._data.cacheTimestamp >= cacheExpiry);
			};

			var haveCachedEventsExpired = function (eventArray) {
				var i,
					numEvents = eventArray.length;
				for (i = numEvents - 1; i >= 0; i--) {
					if (hasCachedEventExpired(eventArray[i])) {
						return true;
					}
				}
				return false;
			};

			/**
			 * Caches the channels returned by the gateway
			 *
			 * @method cacheGatewayChannels
			 * @private
			 */
			var cacheGatewayChannels = function (gatewayResponse) {
				var i,
					serviceToAdd;
				log("cacheGatewayChannels", "HomeCruise channels updated...updating cache.");
				for (i = 0; i < gatewayResponse.length; i++) {
					serviceToAdd = gatewayResponse[i];
					epgCache.cacheService(serviceToAdd);
				}
			};

			/**
			 * Caches the event data returned by the gateway
			 *
			 * @method cacheGatewayEventList
			 * @private
			 */
			var cacheGatewayEventList = function (gatewayResponse) {
				var i,
					channelSid,
					eventToAdd;

				log("cacheGatewayEventList", "HomeCruise Event Data updated...updating cache.");
				channelSid = gatewayResponse.sid;

				for (i = 0; i < gatewayResponse.events.length; i++) {
					eventToAdd = gatewayResponse.events[i];
					eventToAdd.sid = channelSid;
					cacheEvent(eventToAdd);
				}
			};
			/**
			 * Comparison method to compare logical channel number of two channel objects.
			 *
			 * @method compareLogicalChannelNum
			 * @param a {Object} first channel
			 * @param b {Object} second channel
			 * @return {Number} Difference
			 * @private
			 */
			var compareLogicalChannelNum = function (a, b) {
				return a.logicalChannelNum - b.logicalChannelNum;
			};

			/**
			 * Helper method to return a list of service ids from the
			 * given array of channels
			 * @method createServiceIdArray
			 * @private
			 * @param {Array} chanArray
			 */
			function createServiceIdArray(chanArray) {
				var serviceIds = [],
					i;
				for (i = 0; i < chanArray.length; i++) {
					serviceIds.push(chanArray[i].serviceId);
				}
				return serviceIds;
			}


			/**
			 * Helper method to return a list of service ids from the
			 * given array of channels
			 * @method padEventsList
			 * @private
			 * @param {Array} eventsForService
			 * @param {String} serviceId
			 * @param {Number} startTime
			 * @param {Number} endTime
			 * @param {Function} getDummyEvent a dummy event generator function
			 * @return {Array}
			 */
			function padEventsList(serviceId, startTime, endTime, getDummyEvent, eventsForService) {
				var eventArray = [],
					i,
					eventsForServiceLength = eventsForService ? eventsForService.length : 0;

				if (eventsForServiceLength > 0) {
					for (i = 0; i < eventsForServiceLength; i++) {
						//if first event in list check if we need dummy first
						if (i === 0 && eventsForService[i].startTime > startTime) {
							eventArray.push(getDummyEvent(serviceId, startTime, eventsForService[i].startTime));
						} else if (i !== 0 && eventsForService[i].startTime !== eventsForService[i - 1].endTime) {
							eventArray.push(getDummyEvent(serviceId, eventsForService[i - 1].endTime, eventsForService[i].startTime));
						}
						eventArray.push(eventsForService[i]);
					}
					// Does last event reach endTime?  If not, pad end with dummy
					if (eventsForService[i - 1].endTime < endTime) {
						eventArray.push(getDummyEvent(serviceId, eventsForService[i - 1].endTime, endTime));
					}
				} else {
					eventArray.push(getDummyEvent(serviceId, startTime, endTime));
				}
				return eventArray;
			}

			/**
			 * Returns true if given data source is configured
			 * @method isDataSourceConfigured
			 * @private
			 * @param {String} dataSource
			 * @return {Boolean}
			 */
			function isDataSourceConfigured(dataSource) {
				var i;
				for (i = 0; i < dataSources.length; i++) {
					if (dataSources[i] === dataSource) {
						return true;
					}
				}
				return false;
			}

			/**
			 * Retrieves event from cache and uses data source to get latest data if events expired in cache
			 * @method fetchEventFromCache
			 * @private
			 * @param {Function} cacheFetchMethod
			 * @param {Object} service
			 * @param {Function} gatewayCall
			 * @param {Function} sdpFetchCall
			 * @param {Function} callback
			 */
			function fetchEventFromCache(cacheFetchMethod, service, gatewayCall, sdpFetchCall, callback) {
				cacheFetchMethod.call($N.platform.btv.EPGCache, service.serviceId, function (event) {
					if (!event || hasCachedEventExpired(event)) {
						if (service.deliveryMethod === $N.data.EPGService.DELIVERY_TYPE.GATEWAY && isDataSourceConfigured(DATA_SOURCES.GATEWAY)) {
							gatewayCall();
						} else if (service.deliveryMethod === $N.data.EPGService.DELIVERY_TYPE.IP && isDataSourceConfigured(DATA_SOURCES.SDP)) {
							sdpFetchCall();
						} else {
							callback(null);
						}
					} else {
						callback(event);
					}
				});
			}

			function cacheEvent(event) {
				if (cacheEvents) {
					epgCache.cacheEvent(event);
				}
			}

			function cacheSDPEvent(event) {
				if (event) {
					var ratingLookup = $N.services.sdp.Ratings.getRatingLookup() || {};
					event.parentalRating = ratingLookup[event.eventRating] ? ratingLookup[event.eventRating].precedenceValue : null;
					cacheEvent(event);
				}
			}

			function addHomeCruiseListeners() {
				log("init", "registering for gateway channel list updates...");
				$N.services.gateway.HomeCruise.addEventListener('ChannelListUpdated', cacheGatewayChannels);
				$N.services.gateway.HomeCruise.addEventListener('EventListUpdated', cacheGatewayEventList);
			}

			//TODO: Add logic to listen for EPG updated

			return {
				/**
				 * Initialises the EPG class.
				 * @method init
				 * @param {Object} configuration Object containing the following optional properties:
				 * @param {String} configuration.cacheType One of $N.platform.btv.EPG.CACHE_TYPES
				 * @param {Array} [configuration.dataSources=[$N.platform.btv.DATA_SOURCES.SDP]] Array of one or more $N.platform.btv.EPG.DATA_SOURCES
				 * @param {Number} [configuration.cacheExpiryTime=3600000 (1 hour)] Amount of milliseconds that cached event is deemed valid
				 * @param {Boolean} [configuration.cacheEvents=true] False if events should not be cached
				 * @param {Number} [configuration.expiredEventsTime=86400000 * 7 (1 week)] Milliseconds in past that cached event should be removed from cache
				 * @param {Number} [configuration.checkForExpiredEventsTime=86400000 (1 day)] Milliseconds interval that should check for expired events
				 */
				init: function (configuration) {
					var i,
						expiredEventsTime,
						checkForExpiredEventsTime,
						currentDataSource;
					if (!configuration) {
						configuration = {
							cacheType: cacheTypes.RAM,
							dataSources: [DATA_SOURCES.SDP],
							cacheExpiryTime: DEFAULT_CACHE_EXPIRY_TIME,
							cacheEvents: true,
							expiredEventsTime: DEFAULT_EXPIRED_EVENTS_TIME,
							checkForExpiredEventsTime: DEFAULT_CHECK_EXPIRED_EVENTS_TIME
						};
					}

					expiredEventsTime = configuration.expiredEventsTime || DEFAULT_EXPIRED_EVENTS_TIME;
					checkForExpiredEventsTime = configuration.checkForExpiredEventsTime || DEFAULT_CHECK_EXPIRED_EVENTS_TIME;

					if (configuration.cacheType === cacheTypes.Persistent) {
						epgCache = $N.platform.btv.PersistentCache;
					} else {
						epgCache = $N.platform.btv.EPGCache;
					}

					if (configuration.cacheEvents === false) {
						cacheEvents = false;
					}

					if (configuration.dataSources && configuration.dataSources.length > 0) {
						for (i = 0; i < configuration.dataSources.length; i++) {
							currentDataSource = configuration.dataSources[i];
							if (currentDataSource === DATA_SOURCES.GATEWAY) {
								dataSources.push(currentDataSource);
								if (!($N.services.gateway && $N.services.gateway.HomeCruise)) {
									require(['jsfw/services/gateway/HomeCruise'], function(HomeCruise) {
										addHomeCruiseListeners();
									});
								}
							} else if (currentDataSource === DATA_SOURCES.SDP && $N.services.sdp.EPG) {
								dataSources.push(currentDataSource);
							}
						}
					}
					cacheExpiry = (configuration.cacheExpiryTime !== undefined && configuration.cacheExpiryTime !== null) ? configuration.cacheExpiryTime : DEFAULT_CACHE_EXPIRY_TIME;

					setInterval(function () {
						epgCache.removeEventsOlderThan(new Date().getTime() - expiredEventsTime);
					}, checkForExpiredEventsTime);
				},

				/**
				 * Initialises the EPG class.
				 * @method initialise
				 * @deprecated use init()
				 * @param {Object} configuration Object containing the following optional properties:
				 * @param {String} configuration.cacheType One of $N.platform.btv.EPG.CACHE_TYPES
				 * @param {Array} [configuration.dataSources=[$N.platform.btv.DATA_SOURCES.SDP]] Array of one or more $N.platform.btv.EPG.DATA_SOURCES
				 * @param {Number} [configuration.cacheExpiryTime=3600000 (1 hour)] Amount of milliseconds that cached event is deemed valid
				 * @param {Boolean} [configuration.cacheEvents=true] False if events should not be cached
				 * @param {Number} [configuration.expiredEventsTime=86400000 * 7 (1 week)] Milliseconds in past that cached event should be removed from cache
				 * @param {Number} [configuration.checkForExpiredEventsTime=86400000 (1 day)] Milliseconds interval that should check for expired events
				 */
				initialise: function (configuration) {
					this.init(configuration);
				},

				/**
				 * Forces a refresh of the cached EPG channel list.
				 *
				 * @method refresh
				 * @param {Function} callback Function to call once refresh has completed
				 */
				refresh: function (callback) {
					refreshChannels(true, callback);
				},

				/**
				 * Gets a list of all channels
				 *
				 * @method getAllChannels
				 * @return {Array} List of EPGService Objects
				 */
				getAllChannels: function () {
					return allChannelList;
				},


				/**
				 * Removes all channels in the EPG
				 *
				 * @method removeAllChannels
				 */
				removeAllChannels: function () {
					var i = 0;
					//ensure the channel list is up-to-date
					refreshChannels(false, function () {
						for (i = 0; i < allChannelList.length; i++) {
							epgCache.removeService(allChannelList[i].serviceId);
						}
					});
				},


				/**
				 * Gets a list of channels sorted by logical channel number
				 *
				 * @method getAllChannelsOrderedByChannelNumber
				 * @return {Array} List of EPGService Objects
				 */
				getAllChannelsOrderedByChannelNumber: function () {
					var tmpArray = allChannelList.slice(0);
					return tmpArray.sort(compareLogicalChannelNum);
				},

				/**
				 * Gets a list of subscribed channels sorted by logical channel number
				 *
				 * @method getSubscribedChannelsOrderedByChannelNumber
				 * @return {Array} List of EPGService Objects
				 */
				getSubscribedChannelsOrderedByChannelNumber: function () {
					var tmpArray = subscribedChannelList.slice(0);
					return tmpArray.sort(compareLogicalChannelNum);
				},

				/**
				 * Gets a list of radio channels sorted by logical channel number
				 *
				 * @method getRadioChannelsOrderedByChannelNumber
				 * @return {Array} List of EPGService Objects
				 */
				getRadioChannelsOrderedByChannelNumber: function () {
					var tmpArray = radioChannelList.slice(0);
					return tmpArray.sort(compareLogicalChannelNum);
				},

				/**
				 * Gets a list of video channels sorted by logical channel number
				 *
				 * @method getVideoChannelsOrderedByChannelNumber
				 * @return {Array} List of EPGService Objects
				 */
				getVideoChannelsOrderedByChannelNumber: function () {
					var tmpArray = videoChannelList.slice(0);
					return tmpArray.sort(compareLogicalChannelNum);
				},

				/**
				 * Gets a list of all IP channels
				 *
				 * @method getIPChannels
				 * @return {Array} List of EPGService Objects
				 */
				getIPChannels: function () {
					return ipChannelList;
				},

				/**
				 * Returns an array of service id that are of channel type IP
				 * @method getIPServiceIdArray
				 * @return {Array}
				 */
				getIPServiceIdArray: function () {
					return ipServiceIdArray;
				},

				/**
				 * Gets a list of all DVB channels
				 *
				 * @method getDVBChannels
				 * @return {Array} List of EPGService Objects
				 */
				getDVBChannels: function () {
					return [];
				},

				/**
				 * Gets a list of radio channels
				 *
				 * @method getRadioChannels
				 * @return {Array} List of EPGService Objects
				 */
				getRadioChannels: function () {
					return radioChannelList;
				},

				/**
				 * Gets a list of video channels
				 *
				 * @method getVideoChannels
				 * @return {Array} List of EPGService Objects
				 */
				getVideoChannels: function () {
					return videoChannelList;
				},

				/**
				 * Gets a list of all channels that the user is subscribed to
				 *
				 * @method getSubscribedChannels
				 * @return {Array} List of EPGService Objects
				 */
				getSubscribedChannels: function () {
					return subscribedChannelList;
				},

				/**
				 * Returns an EPGService matched by its logical channel number
				 *
				 * @method getChannelByLCN
				 * @param {Number} channelNumber logical channel number of the requested channel
				 * @return {Object} EPGService object, or null if no matching channel is found
				 */
				getChannelByLCN: function (channelNumber) {
					var retService = null,
						serviceId = '';
					for (serviceId in allChannels) {
						if (allChannels.hasOwnProperty(serviceId)) {
							if (allChannels[serviceId] && allChannels[serviceId].logicalChannelNum === channelNumber) {
								retService = allChannels[serviceId];
								break;
							}
						}
					}
					return retService;
				},

				/**
				 * Returns a channel matching the given service id
				 *
				 * @method getChannelByServiceId
				 * @param {String} serviceId service id of the channel that we're interested in
				 * @return {Object} EPGService object, or null if no matching channel is found
				 */
				getChannelByServiceId: function (serviceId) {
					return allChannels[String(serviceId)];
				},

				/**
				 * Returns the channel matching the URI given
				 *
				 * @method getChannelByServiceURI
				 * @param uri {String} the URI of the required channel
				 * @return {Object} the EPGService object, or null if no matching channel is found
				 */
				getChannelByServiceURI: function (uri) {
					var numberOfChannels,
						i;
					if (uri) {
						numberOfChannels = allChannelList.length;
						for (i = 0; i < numberOfChannels; i++) {
							if (allChannelList[i].uri && allChannelList[i].uri === uri) {
								return allChannelList[i];
							}
						}
					}
					return null;
				},

				/**
				 * Returns the channel matching the specified event
				 *
				 * @method getChannelByEventId
				 * @param eventId {Number} event id
				 * @return {Object} matching EPGService object or null
				 *
				 */
				getChannelByEventId: function (eventId) {
					var event = this.getEventById(eventId);
					if (event) {
						return allChannels[event.serviceId];
					}
					return null;
				},

				/**
				 * Gets events in the list of specified channels that are within the given time bounds
				 *
				 * @method getEventsByWindow
				 * @param {Array} serviceIdArray array of service ids that we're interested in
				 * @param {Date} vStartTime start time in milliseconds
				 * @param {Date} vEndTime end time in milliseconds
				 * @return {Array} list of EPGEvent objects
				 */
				getEventsByWindow: function (serviceIdArray, vStartTime, vEndTime) {
					var events = epgCache.getEventsByWindow(serviceIdArray, vStartTime, vEndTime);
					if (events) {
						return events;
					}
					return null;
				},

				/**
				 * Gets the event with the matching id
				 *
				 * @method getEventById
				 * @param {Number} eventId event id
				 * @return {Object} EPGEvent object matching the event id
				 */
				getEventById: function (eventId) {
					var event;
					eventId = String(eventId);
					event = epgCache.getEventById(eventId);
					return event;
				},

				/**
				 * Gets the current event on the given channel
				 *
				 * @method getCurrentEventForService
				 * @param {String} serviceId service id of the channel we're interested in
				 * @return {Object} current EPGEvent for the given service id
				 */
				getCurrentEventForService: function (serviceId) {
					return epgCache.getEventCurrent(String(serviceId));
				},

				/**
				 * Gets the event starting immediately after the current one on the given channel
				 *
				 * @method getNextEventForService
				 * @param {String} serviceId service id of the channel we're interested in
				 * @return {Object} EPGEvent object
				 */
				getNextEventForService: function (serviceId) {
					var currentEvent = this.getCurrentEventForService(serviceId);
					if (currentEvent) {
						return epgCache.getEventNext(currentEvent.eventId);
					}
					return null;
				},

				/**
				 * Gets the event starting immediately before the current one on the given channel
				 *
				 * @method getPreviousEventForService
				 * @param {String} serviceId service id of the channel we're interested in
				 * @return {Object} EPGEvent object
				 */
				getPreviousEventForService: function (serviceId) {
					var currentEvent = this.getCurrentEventForService(serviceId);
					if (currentEvent) {
						return epgCache.getEventPrevious(currentEvent.eventId);
					}
					return null;
				},

				/**
				 * Returns a list of service IDs
				 *
				 * @method getServiceIdArray
				 * @return {Array} a list of service ids
				 */
				getServiceIdArray: function () {
					return serviceIdArray || [];
				},

				/**
				 * Gets the events for the given service(s) and between the given start and end times.
				 * If there is a gap between one events end time and the next events start time then a dummy event is
				 * created using the given `getDummyEvent` function
				 * @method getEventsForChannelWithDummyEvents
				 * @param {String} serviceId
				 * @param {Number} startTime
				 * @param {Number} endTime
				 * @param {Function} getDummyEvent a dummy event generator function
				 * @return {Array}
				 */
				getEventsForChannelWithDummyEvents: function (serviceId, startTime, endTime, getDummyEvent) {
					var eventsForService = this.getEventsByWindow([serviceId], startTime, endTime);
					return padEventsList(serviceId, startTime, endTime, getDummyEvent, eventsForService);
				},

				/**
				 * Gets the events for the given service and between the given start and end times.
				 * If there is a gap between one event's end time and the next event's start time then a dummy event is
				 * created using the given `getDummyEvent` function, the start and end events are timed to start/end in the
				 * time window.
				 * @method getEventsForGridRow
				 * @param {String} serviceId
				 * @param {Number} startTime
				 * @param {Number} endTime
				 * @param {Function} getDummyEvent a dummy event generator function
				 * @return {Array}
				 */
				getEventsForGridRow: function (serviceId, startTime, endTime, getDummyEvent) {
					var eventArray = this.getEventsForChannelWithDummyEvents(serviceId, startTime, endTime, getDummyEvent);
					if (eventArray[0].startTime < startTime) {
						eventArray[0].displayStartTime = startTime;
					}
					if (eventArray[eventArray.length - 1].endTime > endTime) {
						eventArray[eventArray.length - 1].displayEndTime = endTime;
					} else if (eventArray[eventArray.length - 1].endTime < endTime) {
						eventArray.push(getDummyEvent(serviceId, eventArray[eventArray.length - 1].endTime, endTime));
					}
					return eventArray;
				},

				/**
				 * Returns the EPGService object for the currently tuned channel
				 *
				 * @method getCurrentlyTunedChannel
				 * @param tuner {Object} an instance of the Tuner object. This is available from the Player object.
				 * @return {Object} an EPGService object
				 */
				getCurrentlyTunedChannel: function (tuner) {
					var currentUri = tuner.getCurrentUri(),
						i,
						numberOfChannels = allChannelList.length;
					if (currentUri) {
						for (i = 0; i < numberOfChannels; i++) {
							if (allChannelList[i].uri && allChannelList[i].uri === currentUri) {
								return allChannelList[i];
							}
						}
					}
					return null;
				},

				/**
				 * Returns a service Id array that has been ordered using the logical channel number
				 * @method getServiceIdArraySortedByLCN
				 * @return {Array}
				 */
				getServiceIdArraySortedByLCN: function () {
					var chanArray = this.getAllChannelsOrderedByChannelNumber();
					return createServiceIdArray(chanArray);
				},

				/**
				 * Returns a service Id array that has been ordered using the logical channel number
				 * @method getSubscribedServiceIdArraySortedByLCN
				 * @return {Array}
				 */
				getSubscribedServiceIdArraySortedByLCN: function () {
					var chanArray = this.getSubscribedChannelsOrderedByChannelNumber();
					return createServiceIdArray(chanArray);
				},

				/**
				 * Returns a service Id array that has been ordered using the logical channel number
				 * @method getRadioServiceIdArraySortedByLCN
				 * @return {Array}
				 */
				getRadioServiceIdArraySortedByLCN: function () {
					var chanArray = this.getRadioChannelsOrderedByChannelNumber();
					return createServiceIdArray(chanArray);
				},

				/**
				 * Returns a service Id array that has been ordered using the logical channel number
				 * @method getVideoServiceIdArraySortedByLCN
				 * @return {Array}
				 */
				getVideoServiceIdArraySortedByLCN: function () {
					var chanArray = this.getVideoChannelsOrderedByChannelNumber();
					return createServiceIdArray(chanArray);
				},

				/**
				 * Gets the event with the matching id
				 *
				 * @method fetchEventById
				 * @param {Number} eventId event id
				 * @return {Object} EPGEvent object matching the event id
				 */
				fetchEventById: function (eventId, callback) {
					eventId = String(eventId);
					epgCache.fetchEventById(eventId, callback);
				},

				/**
				 * Gets the current event on the given channel asynchronously.
				 * This is the asynchronous version of `getCurrentEventForService`.
				 * @method fetchCurrentEventForService
				 * @async
				 * @param {String} serviceId service id of the channel we're interested in
				 * @param {Function} callback The callback function
				 */
				fetchCurrentEventForService: function (serviceId, callback) {
					var startTime,
						service,
						me = this,
						gatewayCall = function () {
							startTime = new Date().getTime();
							$N.services.gateway.HomeCruise.fetchEitData(serviceId, startTime, startTime + 500, function (results) {
								if (results.length > 0) {
									callback(results[0]);
									cacheEvent(results[0]);
								} else {
									callback(null);
								}
							});
						},
						sdpFetchCall = function () {
							$N.services.sdp.EPG.fetchCurrentEventForService(serviceId, function (event) {
								callback(event);
								cacheSDPEvent(event);
							});
						},
						fetchEvent = function () {
							service = me.getChannelByServiceId(serviceId);
							fetchEventFromCache(epgCache.fetchEventCurrent, service, gatewayCall, sdpFetchCall, callback);
						};

					// Check the array has been populated before searching it
					if (serviceIdArray.length === 0) {
						refreshChannels(false, fetchEvent);
					} else {
						fetchEvent();
					}
				},

				/**
				 * Gets the event starting immediately after the current one on the given channel asynchronously.
				 * This is the asynchronous version of `getNextEventForService`.
				 * @method fetchNextEventForService
				 * @async
				 * @param {String} serviceId service id of the channel we're interested in
				 * @param {Function} callback The callback function
				 */
				fetchNextEventForService: function (serviceId, callback) {
					var startTime,
						service,
						me = this,
						gatewayCall = function () {
							startTime = new Date().getTime();
							$N.services.gateway.HomeCruise.fetchEitData(serviceId, startTime, startTime + 500, function (results) {
								var resObj = results[0];
								if (resObj) {
									$N.services.gateway.HomeCruise.fetchEitData(resObj.serviceId, parseInt(resObj.endTime, 10) + 1, parseInt(resObj.endTime, 10) + 500, function (results) {
										callback(results[0]);
										cacheGatewayEventList([results[0]]);
									});
								} else {
									callback(null);
								}
							});
						},
						sdpFetchCall = function () {
							$N.services.sdp.EPG.fetchNextEventForService(serviceId, function (event) {
								callback(event);
								cacheSDPEvent(event);
							});
						},
						fetchEvent = function () {
							service = me.getChannelByServiceId(serviceId);
							fetchEventFromCache(epgCache.fetchEventNext, service, gatewayCall, sdpFetchCall, callback);
						};
					// Check the array has been populated before searching it
					if (serviceIdArray.length === 0) {
						refreshChannels(false, fetchEvent);
					} else {
						fetchEvent();
					}
				},

				/**
				 * Gets the event starting immediately before the current one on the given channel asynchronously.
				 * This is the asynchronous version of `getPreviousEventForService`.
				 * @method fetchPreviousEventForService
				 * @async
				 * @param {String} serviceId service id of the channel we're interested in
				 * @param {Function} callback The callback function
				 */
				fetchPreviousEventForService: function (serviceId, callback) {
					var startTime,
						me = this,
						service,
						dataSource,
						gatewayCall = function () {
							startTime = new Date().getTime();
							$N.services.gateway.HomeCruise.fetchEitData(serviceId, startTime, startTime + 500, function (results) {
								var resObj = results[0];
								if (resObj) {
									$N.services.gateway.HomeCruise.fetchEitData(resObj.serviceId, parseInt(resObj.startTime, 10) - 1, parseInt(resObj.startTime, 10) + 500, function (previousEvents) {
										if (previousEvents) {
											callback(previousEvents[0]);
											cacheGatewayEventList([previousEvents[0]]);
										} else {
											callback(null);
										}
									});
								} else {
									callback(null);
								}
							});
						},
						sdpFetchCall = function () {
							$N.services.sdp.EPG.fetchCurrentEventForService(serviceId, function (currentEvent) {
								$N.services.sdp.EPG.fetchEventsByWindow([serviceId], currentEvent.startTime - 60000, currentEvent.startTime, function (previousEvents) {
									callback(previousEvents[0]);
									cacheSDPEvent(previousEvents[0]);
								});
							});
						},
						fetchEvent = function () {
							service = me.getChannelByServiceId(serviceId);
							fetchEventFromCache(epgCache.fetchEventPrevious, service, gatewayCall, sdpFetchCall, callback);
						};

					// Check the array has been populated before searching it
					if (serviceIdArray.length === 0) {
						refreshChannels(false, fetchEvent);
					} else {
						fetchEvent();
					}

				},

				/**
				 * Gets events on the event channel that are within the given time bounds.
				 * This is the asynchronous version of getEventsByWindow.
				 * @method fetchEventsByWindow
				 * @async
				 * @param {Array} serviceIds Array of service ids of the channels we're interested in
				 * @param {Number} startTime Start time in milliseconds
				 * @param {Number} endTime End time in milliseconds
				 * @param {Function} callback The callback function
				 */
				fetchEventsByWindow: function (serviceIds, startTime, endTime, callback) {
					var i,
						sortedEvents = [],
						callsCompleted = 0, //counter for fetch calls that have completed for each service
						eventsLookup = {}, //all events returned
						updateCacheServices = [],
						me = this,

						/*
						 * Called after events retrieved from cache/data source for each service id that is in the serviceIds array
						 * If all events have been retrieved, the events are sorted into order by service id to match the
						 * order of the service id array that was passed in by the app
						 */
						fetchCallCompleted = function (events, serviceId, updateCache) {
							var cachedEvents,
								i,
								j;

							callsCompleted++;

							if (callsCompleted <= serviceIds.length) {
								eventsLookup[serviceId] = events;

								if (updateCache) {
									updateCacheServices.push(serviceId);
								}

								//if fetch calls complete for all services
								if (callsCompleted === serviceIds.length) {
									for (i = 0; i < serviceIds.length; i++) {
										if (eventsLookup[serviceIds[i]] && eventsLookup[serviceIds[i]].length > 0) {
											eventArray = eventsLookup[serviceIds[i]];
											sortedEvents = sortedEvents.concat(eventArray);
										}
									}

									callback(sortedEvents);

									//update cache with new events

									for (i = 0; i < updateCacheServices.length; i++) {
										cachedEvents = eventsLookup[updateCacheServices[i]];
										if (cachedEvents) {
											for (j = 0; j < cachedEvents.length; j++) {
												if ($N.platform.btv.EPG.getChannelByServiceId(updateCacheServices[i]).deliveryMethod === $N.data.EPGService.DELIVERY_TYPE.GATEWAY) {
													cacheGatewayEventList([cachedEvents[j]]);
												} else {
													cacheSDPEvent(cachedEvents[j]);
												}
											}
										}
									}
								}
							}
						},

						/*
						 * Retrieves the events from cache and checks if events for each service are invalid due to gaps in epg data or cache expiry time passing.
						 * If services are deemed invalid then retrieves events from data source for the invalid service
						 */
						fetchEvent = function () {
							epgCache.fetchEventsByWindow(serviceIds, startTime, endTime, function (events) {
								var previousServiceId,
									previousEvent,
									i,
									isServiceCacheInvalid = false,
									invalidServices = [],
									eventsForCurrentService = [],
									service,
									serviceCount = 0,
									successCallback = {},
									failureCallback = {},
									/*
									 * Either cache events so they can be sorted once all fetch calls are complete
									 * or add service to the invalidServices array so that we can retrieve events
									 * from data source
									 */
									processEventsForCurrentService = function () {
										if (!isServiceCacheInvalid && previousEvent.endTime >= endTime) {
											fetchCallCompleted(eventsForCurrentService, previousServiceId);
										} else {
											invalidServices.push(previousServiceId);
										}
									};

								//no events so all services deemed invalid
								if (!events || events.length === 0) {
									invalidServices = serviceIds;
								} else {
									for (i = 0; i < events.length; i++) {
										if (events[i].serviceId !== previousServiceId) {

											//check events have been returned for each service
											while (events[i].serviceId !== serviceIds[serviceCount]) {
												//if no events then service deemed invalid
												invalidServices.push(serviceIds[serviceCount]);
												serviceCount++;
											}
											serviceCount++;

											if (previousServiceId) {
												processEventsForCurrentService();
											}

											//reset values
											previousEvent = null;
											isServiceCacheInvalid = false;
											eventsForCurrentService = [];
										}

										//check if event is valid
										if (!isServiceCacheInvalid && ((previousEvent && events[i].startTime === previousEvent.endTime) || (!previousEvent && events[i].startTime <= startTime)) && !hasCachedEventExpired(events[i])) {
											eventsForCurrentService.push(events[i]);
										} else {
											isServiceCacheInvalid = true;
										}
										previousEvent = events[i];
										previousServiceId = events[i].serviceId;
									}
									processEventsForCurrentService();
									if (serviceCount < serviceIds.length) {
										invalidServices = invalidServices.concat(serviceIds.slice(serviceIds.length - (serviceIds.length - serviceCount)));
									}
								}

								//retrieve events from data sources for services that have been deemed invalid
								//due to gaps in epg data or cache expiry time passing

								for (i = 0; i < invalidServices.length; i++) {
									service = $N.platform.btv.EPG.getChannelByServiceId(invalidServices[i]);
									successCallback = (function (sid) {
										return function (newEvents) {
											fetchCallCompleted(newEvents, sid, true);
										};
									}(service.serviceId));
									failureCallback = (function (sid) {
										return function () {
											fetchCallCompleted([], sid, true);
										};
									}(service.serviceId));
									if (service.deliveryMethod === $N.data.EPGService.DELIVERY_TYPE.GATEWAY && isDataSourceConfigured(DATA_SOURCES.GATEWAY)) {
										$N.services.gateway.HomeCruise.fetchEitData(service.serviceId, startTime, endTime, successCallback, failureCallback);
									} else if (service.deliveryMethod === $N.data.EPGService.DELIVERY_TYPE.IP && isDataSourceConfigured(DATA_SOURCES.SDP)) {
										$N.services.sdp.EPG.fetchEventsByWindow([service.serviceId + ""], startTime, endTime, successCallback, failureCallback);
									} else {
										fetchCallCompleted([], service.serviceId);
									}
								}
							});
						};

					for (i = 0; i < serviceIds.length; i++) {
						eventsLookup[serviceIds[i]] = [];
					}

					// Check the array has been populated before searching it
					if (serviceIdArray.length === 0) {
						refreshChannels(false, fetchEvent);
					} else {
						fetchEvent();
					}
				},

				/**
				 * Gets the events for the given service and between the given start and end times, asynchronously.
				 * If there is a gap between one events end time and the next events start time then a dummy event is
				 * created using the given `getDummyEvent` function.
				 * This is the asynchronous version of getEventsForChannelWithDummyEvents.
				 * @method fetchEventsForChannelWithDummyEvents
				 * @async
				 * @param {String} serviceId service id of the channel we're interested in
				 * @param {Number} startTime Start time in milliseconds
				 * @param {Number} endTime End time in milliseconds
				 * @param {Function} getDummyEvent a dummy event generator function this must conform to EPGEvent Data object
				 * @param {Function} callback The callback function
				 */
				fetchEventsForChannelWithDummyEvents: function (serviceId, startTime, endTime, getDummyEvent, callback) {
					var me = this,
						fetchEvent = function () {
							me.fetchEventsByWindow([serviceId], startTime, endTime, function (events) {
								callback(padEventsList(serviceId, startTime, endTime, getDummyEvent, events));
							});
						};

					// Check the array has been populated before searching it
					if (serviceIdArray.length === 0) {
						refreshChannels(false, fetchEvent);
					} else {
						fetchEvent();
					}
				},

				/**
				 * Returns true if the passed service is a radio channel
				 *
				 * @method isRadioChannel
				 * @param {Object} service The EPG service object
				 * @return {Boolean} True if the service is a radio channel
				 */
				isRadioChannel: function (service) {
					return service.serviceType === $N.data.EPGService.SERVICE_TYPE.RADIO;
				},

				/**
				 * Registers a callback method that will be invoked whenever the refresh method of this class
				 * is called.
				 *
				 * @method registerRefreshCallback
				 * @param callback {Function} the function that will be invoked
				 * @param context {Object} the object whose method `callback` is presumed to be
				 */
				registerRefreshCallback: function (callback, context) {
					if (callback && context) {
						refreshCallbacks.push({callbackFunction: callback, caller: context});
					}
				},

				/**
				 * Unregisters the callback that was registered using `registerRefreshCallback`
				 *
				 * @method unregisterRefreshCallback
				 * @param callback {Function} the function that is to be removed
				 * @param context {Object} the calling context
				 */
				unregisterRefreshCallback: function (callback, context) {
					if (callback) {
						var i;
						for (i = 0; i < refreshCallbacks.length; i++) {
							if (refreshCallbacks[i].callbackFunction === callback && refreshCallbacks[i].caller === context) {
								refreshCallbacks.splice(i, 1);
							}
						}
					}
				},

				/**
				 * Start monitoring start of epg events
				 *
				 * @method monitorStartOfEvents
				 * @param {String} serviceId to be monitored
				 * @param {Number} notify number of seconds to notify prior to the event start
				 */
				monitorStartOfEvents: function (serviceId, notify) {
				},

				/**
				 * Cancel monitoring start of epg events
				 *
				 * @method unmonitorStartOfEvents
				 * @param {String} serviceId previously set up to be monitored
				 */
				unmonitorStartOfEvents: function (serviceId) {
				},

				/**
				 * Set up a listener to listen for the start of an epg event
				 * on the service set up using monitorStartOfEvents.
				 *
				 * @method setEventStartCallback
				 * @param {Function} callback to execute on a new event starting
				 */
				setEventStartCallback: function (callback) {
				},

				/**
				 * Remove the listener for the start of an epg event
				 *
				 * @method unsetEventStartCallback
				 * @param {Function} callback that was passed to setEventStartCallback
				 */
				unsetEventStartCallback: function (callback) {
				},

				/**
				 * Checks to see if any services have been set
				 * @method isChannelListPopulated
				 * @return {Boolean} True if the service list has been populated
				 */
				isChannelListPopulated: function () {
					if (allChannelList.length > 0) {
						return true;
					}
					return false;
				},

				/**
				 * Accepts a list of channels to be marked as subscribed to. Usually only called during the bootstrap
				 * process or when the channel list is updated.
				 *
				 * @method setSubscribedChannels
				 * @param channelList {Array} the list of channels that the user is subscribed to
				 */
				setSubscribedChannels: function (channelList) {
					log("setSubscribedChannels", "Enter", LOG_LEVEL_INFO);
					if (channelList) {
						subscribedChannelList = channelList;
						log("setSubscribedChannels", "Set " + channelList.length.toString() + ' subscribed channels');
					}
					log("setSubscribedChannels", "Exit", LOG_LEVEL_INFO);
				},

				/**
				* Accepts a list of channels to be merged into channel list retrieved from the head end and refreshes channel data.
				*
				* @method mergeChannels
				* @param channelList {Array} the list of channels that the user is subscribed to
				* @param areChannelsTheSame {Function} function that receives channel parameters and provides the logic to determine whther they are the same.
				* @param fieldList {Array} array containing a series of attributes to be used by the HybridServiceFactory to determine what
				* attributes in the passed in channels should override their merged equivalents
				* @param includeUnmatched {Boolean} boolean value to indicate whether unmatched channels should be included in the merge
				**/
				mergeChannels: function (channelList, areChannelsTheSame, fieldList, includeUnmatched) {
					merge.doMerge = true;
					merge.channelList = channelList.slice(0);
					merge.areChannelsTheSame = areChannelsTheSame;
					merge.fieldList = fieldList;
					merge.includeUnmatched = includeUnmatched;
					refreshChannelData();
				},

				/**
				* Clears out channels to be merged data, sets merge flag to false and refreshes channel data.
				*
				* @method unMergeChannels
				**/
				unMergeChannels: function () {
					merge.doMerge = false;
					merge.channelList.length = 0;
					merge.areChannelsTheSame = function () {};
					merge.fieldList.length = 0;
					refreshChannelData();
				},


				/**
				 * Defines constants for cache types. One of `Persistent` or `RAM`
				 * @property {Number} CACHE_TYPES
				 */
				CACHE_TYPES: cacheTypes,

				/**
				 * Defines constants for data sources,
				 * one of GATEWAY, SDP
				 * @property {Number} DATA_SOURCES
				 */
				DATA_SOURCES: DATA_SOURCES

			};
		}());
		return $N.platform.btv.EPG;
	}
);
