/**
 * This class manages EPG data: it retrieves and caches EPG data from DVB and IP streams. The channels
 * that are returned by this class conform to the object structure defined in EPGService.
 *
 * @class $N.platform.btv.EPG
 * @singleton
 *
 * @author Mahesh Jagadeesan
 *
 */
/*global setInterval*/

var $N = $N || {};
$N.platform = $N.platform || {};
$N.platform.btv = $N.platform.btv || {};

$N.platform.btv.EPG = (function () {

	var log = new $N.apps.core.Log("btv", "EPG"),
		DEFAULT_CACHE_EXPIRY_TIME = 3600000,
		DEFAULT_EXPIRED_EVENTS_TIME = 86400000 * 7,
		DEFAULT_CHECK_EXPIRED_EVENTS_TIME = 86400000,
		dvbChannelList = [],
		ipChannelList = [],
		subscribedChannelList = [],
		videoChannelList = [],
		radioChannelList = [],
		allChannels = {},
		allChannelList = [],
		serviceIdArray = [],
		ipServiceIdArray = [],
		refreshCallbacks = [],
		epgCache,
		dataSources = [],
		useRAMCache = true,
		cacheTypes = {
			Persistent: 'PC',
			RAM: 'RC'
		},
		DATA_SOURCES = {
			GATEWAY: 'GATEWAY',
			SDP: 'SDP'
		},
		cacheExpiry,
		serviceGapsLookUp = {},
		tempArray = [],
		RECORD_COUNT = 20,
		updateEventCache = true,  // TODO: NETUI-3437 - Log change to true with JSFW Team
		isExtendedIPSchedule = false,
		ethernetConnected = false;

	/**
	 * Returns an array of all services from CCOM.
	 * @method getServicesArrayFromCCOM
	 * @private
	 * @return {Array} An array of service objects
	 */
	function getServicesArrayFromCCOM() {
		log("getServicesArrayFromCCOM", "loading services...");
		var services = $N.platform.btv.PersistentCache.getServices();
		return $N.platform.btv.EPGServiceFactory.mapArray(services);
	}

	/**
	 * Helper method which takes an array of EPG events and adds dummy events where required.
	 * @method augmentEventArrayWithDummyEvents
	 * @param {Array} events An array of EPG events
	 * @param {Number} startTime The start time of the event window
	 * @param {Number} endTime The end time of the event window
	 * @param {String} serviceId The service id to be used when creating dummy EPG events
	 * @param {Function} getDummyEvent The method used to create the dummy events
	 */
	function augmentEventArrayWithDummyEvents(events, startTime, endTime, serviceId, getDummyEvent) {
		var eventArray = [];
		var i;
		var event, next;
		var eventsLength = events ? events.length : 0;
		if (eventsLength > 0) {
			if (events[0].startTime > startTime) {
				eventArray.push(getDummyEvent(serviceId, startTime, events[0].startTime));
			}
			for (i = 0; i < eventsLength; i++) {
				event = events[i];
				next = events[i + 1];
				eventArray.push(event);
				if (next && event.endTime < next.startTime) {
					eventArray.push(getDummyEvent(serviceId, event.endTime, next.startTime));
				}
			}
			if (event.endTime < endTime) {
				eventArray.push(getDummyEvent(serviceId, event.endTime, endTime));
			}
		} else {
			eventArray.push(getDummyEvent(serviceId, startTime, endTime));
		}
		return eventArray;
	}

	/**
	 * Updates the cached service list. Categorises channels as DVB and IP, besides also
	 * recognising radio channels, and user-subscribed channels.Mainly called when the
	 * EPGServicesUpdated event is fired, and also by other
	 * methods of this class.
	 *
	 * @method refreshChannels
	 * @private
	 */
	function refreshChannels() {
		var services = getServicesArrayFromCCOM(),
			channel,
			i,
			j,
			cachedChannels;

		// Re-initialise the hashes and lists as they may have already been populated earlier
		dvbChannelList = [];
		ipChannelList = [];
		videoChannelList = [];
		radioChannelList = [];
		subscribedChannelList = [];
		allChannels = {};
		serviceIdArray = [];
		ipServiceIdArray = [];

		cachedChannels = epgCache.getServices();
		if (cachedChannels && cachedChannels.length > 0) {
			services = services.concat(cachedChannels);
		}
 
		// populate the hashes and lists afresh
		for (i = 0; i < services.length; i++) {
			channel = services[i];
			if (channel.runningStatus !== $N.app.constants.SERVICE_RUNNING_STATUS_NOT_RUNNING) {
				allChannelList.push(channel);
				allChannels[channel.serviceId] = channel;
				serviceIdArray.push(channel.serviceId);
				if ((channel.uri) && (channel.uri.substring(0, 6) === 'dvb://')) {
					dvbChannelList.push(channel);
					subscribedChannelList.push(channel);
					channel.isSubscribed = true;
				} else {
					ipChannelList.push(channel);
					ipServiceIdArray.push(channel.serviceId);
					if (channel.isSubscribed) {
						subscribedChannelList.push(channel);
					}
				}

				if (channel.serviceType === $N.data.EPGService.SERVICE_TYPE.TV) {
					videoChannelList.push(channel);
				} else if (channel.serviceType === $N.data.EPGService.SERVICE_TYPE.RADIO) {
					radioChannelList.push(channel);
				}
			}
		}
		for (j = 0; j < refreshCallbacks.length; j++) {
			refreshCallbacks[j].callbackFunction.call(refreshCallbacks[j].caller);
		}
	}

	/**
	 * Determines whether a cached event has expired
	 * @method hasCachedEventExpired
	 * @private
	 * @param {Object} cachedEvent event that has been cached
	 * @return {Boolean} hasCachedEventExpired true/false to indicate whether event has expired
	 */
	function hasCachedEventExpired(cachedEvent) {
		return (new Date().getTime() - cachedEvent._data.cacheTimestamp >= cacheExpiry);
	}

	/**
	 * Determines whether cached events have expired
	 * @method haveCachedEventsExpired
	 * @private
	 * @param {Array} eventArray events that have been cached
	 * @return {Boolean} haveCachedEventsExpired true/false to indicate whether an event in the array has expired
	 */
	function haveCachedEventsExpired(eventArray) {
		var i,
			numEvents = eventArray.length;
		for (i = numEvents - 1; i >= 0; i--) {
			if (hasCachedEventExpired(eventArray[i])) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Copy events to cache.
	 * @method cacheEvents
	 * @param {Array} events array of events
	 * @private
	 */
	function cacheEvents(events) {
		if (updateEventCache) {
			$N.platform.btv.PersistentCache.cacheEvents(events);
			if (useRAMCache) {
				epgCache.cacheEvents(events);
			}
		}
	}

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
			cacheEvents([eventToAdd]);
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
	function compareLogicalChannelNum(a, b) {
		return a.logicalChannelNum - b.logicalChannelNum;
	}

	/**
	 * Helper method to return a list of service ids from the
	 * given array of channels
	 * @method createServiceIdArray
	 * @private
	 * @param {Array} chanArray
	 */
	function createServiceIdArray(chanArray) {
		var serviceIds = [];
		var i;
		for (i = 0; i < chanArray.length; i++) {
			serviceIds.push(chanArray[i].serviceId);
		}
		return serviceIds;
	}

	/**
	 * Creates and executes a ResultSet and registers the callback.
	 * @method executeResultSet
	 * @async
	 * @param {String} criteria The SQL query string
	 * @param {Function} processSuccess The post process function to use when a result set is fetched successfully
	 * @param {Function} processFailure The post process function to use if an error occurs
	 */
	function executeResultSet(criteria, order, processSuccess, processFailure, maxResults) {
		log("executeResultSet", "Enter");
		var resultSet = CCOM.EPG.getEventsRSByQuery("*", criteria, order),
			results = [],
			resetAll = function () {
				resultSet.reset();
				resultSet = null;
				resultSet.removeEventListener('fetchNextOK', fetchNextOK);
				resultSet.removeEventListener('fetchNextFailed', fetchNextFailed);
			},
			fetchNextOK = function (data) {
				if (data.results && data.results.length) {
					log("executeResultSet", "fetchNextOK, got data records: " + data.results.length);
					results = results.concat([].slice.call(data.results, 0));
					if ((maxResults && results.length < maxResults) || data.results.length === RECORD_COUNT) {
						log("executeResultSet", "fetchNextOK, fetching more records");
						resultSet.fetchNext(RECORD_COUNT);
					} else {
						log("executeResultSet", "fetchNextOK, no more to fetch");
						resetAll();
						processSuccess(results);
					}
				} else {
					log("executeResultSet", "fetchNextOK, no array of data returned");
					resetAll();
					processSuccess(results);
				}
			},
			fetchNextFailed = function (result) {
				log("executeResultSet", "Error executing result set: " + result.error.message, "error");
				processFailure();
				resetAll();
			};

		if (!resultSet.error) {
			log("executeResultSet", "Registering Listeners");
			resultSet.addEventListener('fetchNextOK', fetchNextOK);
			resultSet.addEventListener('fetchNextFailed', fetchNextFailed);

			if (maxResults < RECORD_COUNT) {
				log("executeResultSet", "Fetching data for " + maxResults + " records");
				resultSet.fetchNext(maxResults);
			} else {
				log("executeResultSet", "Fetching data for " + RECORD_COUNT + " records");
				resultSet.fetchNext(RECORD_COUNT);
			}
		} else {
			log("executeResultSet", "Error creating result set: " + resultSet.error.message, "error");
			processFailure();
		}
	}

	/**
	 * Extracts all results from a result set and returns them as an array.
	 * @method getArrayFromResultSet
	 * @private
	 */
	function getArrayFromResultSet(resultSet) {
		log("getArrayFromResultSet", "Enter");
		var rsArray,
			returnArray = [],
			i,
			len;

		if (!resultSet.error) {
			rsArray = resultSet.getNext(RECORD_COUNT);
			while (rsArray && rsArray.length) {
				len = rsArray.length;
				log("getArrayFromResultSet", "Processing " + String(len) + " records...");
				for (i = 0; i < len; i++) {
					returnArray.push($N.platform.btv.EPGEventFactory.mapObject(rsArray[i]));
				}
				if (len < RECORD_COUNT) {
					log("getArrayFromResultSet", "No more results");
					rsArray = null;
				} else {
					log("getArrayFromResultSet", "More results getting next set of records...");
					rsArray = resultSet.getNext(RECORD_COUNT);
				}
			}
			log("getArrayFromResultSet", "Resetting ResultsSet");
		} else {
			log("getArrayFromResultSet", "error : " + resultSet.error.message);
		}
		if (resultSet) {
			resultSet.reset();
			resultSet = null;
		}
		log("getArrayFromResultSet", "Exit - returnArray length = " + String(returnArray.length));
		return returnArray;
	}

	/**
	 * Returns true if given data source is configured
	 * @method isDataSourceConfigured
	 * @private
	 * @param {String} source
	 * @return {Boolean}
	 */
	function isDataSourceConfigured(source) {
		var i;
		for (i = 0; i < dataSources.length; i++) {
			if (dataSources[i] === source) {
				return true;
			}
		}
		return false;
	}

	/**
	 * creates a service gap object for a supplied service id
	 * @method createServiceGap
	 * @param {String} service id
	 * @return {Object} serviceGap a servic egap object
	 * @private
	 */
	function createServiceGap(serviceId) {
		var serviceGap = {};
		serviceGap.serviceId = serviceId;
		serviceGap.gapsArray = [];
		return serviceGap;
	}

	/**
	 * adds gaps to a serviceGaps object used to identify gaps in a time window
	 * @method addServiceGap
	 * @param {String} service id
	 * @param {Date} gapStartTime start time of gap
	 * @param {Date} gapEndTime end time of gap
	 * @private
	 */
	function addServiceGap(serviceId, gapStartTime, gapEndTime) {
		var	serviceGap;
		if (!serviceGapsLookUp[serviceId]) {
			serviceGap = createServiceGap(serviceId);
			serviceGap.gapsArray.push({"startTime" : gapStartTime, "endTime": gapEndTime});
			serviceGapsLookUp[serviceId] = serviceGap;
			tempArray.push(serviceGap);
		} else {
			serviceGap = serviceGapsLookUp[serviceId];
			serviceGap.gapsArray.push({"startTime" : gapStartTime, "endTime": gapEndTime});
		}
	}

	/**
	 * Identifies gaps in a schedule for a series of service ids and series events between a given
	 * start time and end time.
	 * @method populateServiceGapsArray
	 * @param {Array} array of events
	 * @param {Array} array of service ids
	 * @param {Date} startTime start time of window
	 * @param {Date} endTime end time of window
	 * @return {Object} serviceGaps containing an array of gaps PLUS a gaps lookup table
	 * @private
	 */
	function populateServiceGapsArray(events, serviceIds, startTime, endTime) {
		var event,
			i,
			j,
			serviceGaps = null,
			serviceGapsArray = [],
			newService = true,
			presentServiceIds = {};

		serviceGapsLookUp = {};
		tempArray = [];

		for (i = 0; i < events.length; i++) {
			if (i === 0) {
				presentServiceIds[events[i].serviceId] = true;
			} else if (i > 0 && events[i].serviceId !== events[i - 1].serviceId) {
				if (events[i - 1].endTime < endTime) {
					addServiceGap(events[i - 1].serviceId, events[i - 1].endTime, endTime);
				}
				newService = true;
				presentServiceIds[events[i].serviceId] = true;
			}
			if (newService) {
				if (events[i].startTime > startTime) {
					addServiceGap(events[i].serviceId, startTime, events[i].startTime);
				}
			} else {
				if (events[i].startTime !== events[i - 1].endTime) {
					addServiceGap(events[i].serviceId, events[i - 1].endTime, events[i].startTime);
				}
			}
			newService = false;
		}
		if (events[i - 1] && events[i - 1].endTime < endTime) {
			addServiceGap(events[i - 1].serviceId, events[i - 1].endTime, endTime);
		}

		// populate with serviceIds that are not present in the events
		for (i = 0; i < serviceIds.length; i++) {
			if (!presentServiceIds[serviceIds[i]]) {
				addServiceGap(serviceIds[i], startTime, endTime);
			}
		}
		// reorder array in order of serviceIds array.
		if (tempArray.length > 0) {
			for (i = 0; i < serviceIds.length; i++) {
				for (j = 0; j < tempArray.length; j++) {
					if (serviceIds[i] === tempArray[j].serviceId) {
						serviceGapsArray.push(tempArray[j]);
						break;
					}
				}
			}
		}
		return ({"array": serviceGapsArray, "lookUp": serviceGapsLookUp});
	}

	/**
	 * Fills in gaps in a schedule for an array of series using an array of existing events and an array of new events.
	 * @method mergeEvents
	 * @param {Array} serviceIds array of service ids
	 * @param {Object} serviceGaps object containing service gap details
	 * @param {Array} existingEvents existing events into which new events are to be merged in
	 * @param {Array} newEvents the new events to be merged into existing events
	 * @return {Array} existingEvents updated array with merged in data
	 * @private
	 */
	function mergeEvents(serviceIds, serviceGaps, existingEvents, newEvents) {
		var existingEventsPos = 0,
			newEventsPos = 0,
			serviceGap,
			gapsArray = [],
			i,
			j;

		for (i = 0; i < serviceIds.length; i++) {
			serviceGap = serviceGaps.lookUp[serviceIds[i]];
			if (serviceGap && newEvents[newEventsPos]) {
				if (newEvents[newEventsPos].serviceId === serviceIds[i]) {
					gapsArray = serviceGap.gapsArray;
					for (j = 0; j < gapsArray.length; j++) {
						while (newEvents[newEventsPos] && newEvents[newEventsPos].serviceId === serviceIds[i] && newEvents[newEventsPos].startTime < gapsArray[j].endTime) {
							if (gapsArray[j].startTime !== gapsArray[j].endTime &&
									((newEvents[newEventsPos].startTime < gapsArray[j].startTime && newEvents[newEventsPos].endTime > gapsArray[j].startTime) ||
									(newEvents[newEventsPos].startTime >= gapsArray[j].startTime && newEvents[newEventsPos].endTime <= gapsArray[j].endTime) ||
									(newEvents[newEventsPos].startTime < gapsArray[j].endTime && newEvents[newEventsPos].endTime > gapsArray[j].endTime))) {
							// position existing event index
								while (existingEvents[existingEventsPos] &&
										existingEvents[existingEventsPos].serviceId === serviceIds[i] &&
										existingEvents[existingEventsPos].endTime <= gapsArray[j].startTime) {
									existingEventsPos++;
								}
								if (existingEvents.length > existingEventsPos) {
									existingEvents.splice(existingEventsPos, 0, newEvents[newEventsPos]);
								} else {
									existingEvents.push(newEvents[newEventsPos]);
								}
								gapsArray[j].startTime = newEvents[newEventsPos].endTime;
							}
							newEventsPos++;
						}
					}
				}
			}
			// reposition arrays
			if (existingEvents && existingEvents[existingEventsPos]) {
				while (existingEventsPos < existingEvents.length && existingEvents[existingEventsPos].serviceId === serviceIds[i]) {
					existingEventsPos++;
				}
			}
			if (newEvents && newEvents[newEventsPos]) {
				while (newEventsPos < newEvents.length && newEvents[newEventsPos].serviceId === serviceIds[i]) {
					newEventsPos++;
				}
			}
		}
		return existingEvents;
	}

	/**
	 * Retrieves events from RAM cache for an array of service ids.
	 * @method fetchEventsFromCacheForWindow
	 * @param {Object} serviceGaps object containing service gap details
	 * @param {Date} startTime start time of window
	 * @param {Date} endTime end time of window
	 * @param {Function} callback function to be executed after the SDP call.
	 * @private
	 * @async
	 */
	function fetchEventsFromCacheForWindow(serviceGaps, startTime, endTime, callback) {
		var i,
			sdpServices = [];

		var cacheCallback = function (cachedEvents) {
			if (cachedEvents && !haveCachedEventsExpired(cachedEvents)) {
				callback(cachedEvents);
			} else {
				callback(null);
			}
		};
		for (i = 0; i < serviceGaps.array.length; i++) {
			sdpServices.push(serviceGaps.array[i].serviceId);
		}
		epgCache.fetchEventsByWindow(sdpServices, startTime, endTime, cacheCallback);
	}

	/**
	 * Calls SDP to retrieve events for an array of service ids.
	 * @method fetchEventsFromSDPForWindow
	 * @param {Object} serviceGaps object containing service gap details
	 * @param {Date} startTime start time of window
	 * @param {Date} endTime end time of window
	 * @param {Function} callback function to be executed after the SDP call.
	 * @private
	 * @async
	 */
	function fetchEventsFromSDPForWindow(serviceGaps, startTime, endTime, callback) {
		var i,
			sdpServices = [],
			me = this;

		var successCallback = function (sdpEvents) {
			if (sdpEvents) {
				cacheEvents(sdpEvents);
				callback(sdpEvents);
			} else {
				callback(null);
			}
		};
		var failureCallback = function () {
			callback(null);
		};
		for (i = 0; i < serviceGaps.array.length; i++) {
			sdpServices.push(serviceGaps.array[i].serviceId);
		}
		$N.services.sdp.EPG.fetchEventsByWindow(sdpServices, startTime, endTime, successCallback, failureCallback);
	}

	/**
	 * Calls Gateway to retrieve events for an array of service ids.
	 * @method fetchEventsFromGatewayForWindow
	 * @param {Object} serviceGaps object containing service gap details
	 * @param {Date} startTime start time of window
	 * @param {Date} endTime end time of window
	 * @param {Function} callback function to be executed after the gateway call.
	 * @private
	 * @async
	 */
	function fetchEventsFromGatewayForWindow(serviceGaps, startTime, endTime, callback) {
		var i,
			gatewayServices = [],
			me = this;

		var successCallback = function (gatewayEvents) {
			if (gatewayEvents) {
				cacheEvents(gatewayEvents);
				callback(gatewayEvents);
			} else {
				callback(null);
			}
		};
		var failureCallback = function () {
			callback(null);
		};
		for (i = 0; i < serviceGaps.array.length; i++) {
			gatewayServices.push(serviceGaps.array[i].serviceId);
		}
		//TODO: fetchEitData should really accept an array rather than a single service id
		$N.services.gateway.HomeCruise.fetchEitData(gatewayServices[0], startTime, endTime, successCallback, failureCallback);
	}

	/**
	 * Tests whether call to cache is allowable.
	 * @method setCacheHouseKeeping
	 * @private
	 * @param  {Date} expiredEventsTime time after which events are expired
	 * @param  {Date} interval after which the housekeeping is invoked
	 */
	function setCacheHouseKeeping(expiredEventsTime, checkForExpiredEventsTime) {
		setInterval(function () {
			epgCache.removeEventsOlderThan(new Date().getTime() - expiredEventsTime);
		}, checkForExpiredEventsTime);
	}

	/**
	 * Retrieves event from cache and uses data source to get latest data if events expired in cache
	 * @method fetchEventFromCache
	 * @private
	 * @param {Function} cacheFetchMethod
	 * @param {Object} servicer
	 * @param {Function} gatewayCall
	 * @param {Function} sdpFetchCall
	 * @param {Function} callback
	 */
	function fetchEventFromCache(cacheFetchMethod, service, gatewayCall, sdpFetchCall, callback) {
		cacheFetchMethod.call($N.platform.btv.EPGCache, service.serviceId, function (event) {
			if (!event || hasCachedEventExpired(event)) {
				if (service.deliveryMethod === $N.data.EPGService.DELIVERY_TYPE.GATEWAY && isDataSourceConfigured(DATA_SOURCES.GATEWAY)) {
					gatewayCall();
				} else if ((isExtendedIPSchedule || service.deliveryMethod === $N.data.EPGService.DELIVERY_TYPE.IP) && isDataSourceConfigured(DATA_SOURCES.SDP)) {
					sdpFetchCall();
				} else {
					callback(null);
				}
			} else {
				callback(event);
			}
		});
	}

	/**
	 * gets service object or dummy service object if no service object is found
	 * @method getChannelOrDummyChannelByServiceId
	 * @private
	 * @param  {String} serviceId
	 * @return {Object} service object or dummy service object
	 */
	function getChannelOrDummyChannelByServiceId(serviceId) {
		var service;
		service = allChannels[String(serviceId)];
		if (service) {
			return service;
		}
		return {"serviceId": serviceId, "deliveryMethod": $N.data.EPGService.DELIVERY_TYPE.IP};
	}

	return {
		//TODO: need to add a wrapper for CCOM eventsUpdated event

		/**
		 * Initialises the EPG class.
		 * @method init
		 * @param {Object} configuration Object containing the following optional properties:
		 * @param {String} configuration.cacheType One of $N.platform.btv.EPG.CACHE_TYPES
		 * @param {Array} [configuration.dataSources=[$N.platform.btv.DATA_SOURCES.SDP]] Array of one or more $N.platform.btv.EPG.DATA_SOURCES
		 * @param {Number} [configuration.cacheExpiryTime=3600000 (1 hour)] Amount of milliseconds that cached event is deemed valid
		 * @param {Boolean} [configuration.useRAMCache=true] False if events should not be cached
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
					dataSources: [DATA_SOURCES.SDP],
					cacheExpiryTime: DEFAULT_CACHE_EXPIRY_TIME,
					cacheType: cacheTypes.RAM,
					useRAMCache: true,
					cacheEvents: true,
					expiredEventsTime: DEFAULT_EXPIRED_EVENTS_TIME,
					checkForExpiredEventsTime: DEFAULT_CHECK_EXPIRED_EVENTS_TIME,
					extendedIPSchedule: false
				};
			}

			expiredEventsTime = configuration.expiredEventsTime || DEFAULT_EXPIRED_EVENTS_TIME;
			checkForExpiredEventsTime = configuration.checkForExpiredEventsTime || DEFAULT_CHECK_EXPIRED_EVENTS_TIME;
			epgCache = $N.platform.btv.EPGCache;

			// TODO: NETUI-3437 - Log changes in this area with JSFW Team
			if (configuration.useRAMCache === false || configuration.cacheType === cacheTypes.Persistent) {
				useRAMCache = false;
			} else {
				useRAMCache = true;
			}

			isExtendedIPSchedule = configuration.extendedIPSchedule || false;
			updateEventCache = configuration.cacheEvents || false;
			// END OF CHANGES

			if (configuration.dataSources && configuration.dataSources.length > 0) {
				for (i = 0; i < configuration.dataSources.length; i++) {
					currentDataSource = configuration.dataSources[i];
					if (currentDataSource === DATA_SOURCES.GATEWAY && $N.services && $N.services.gateway && $N.services.gateway.HomeCruise) {
						dataSources.push(currentDataSource);
						log("init", "registering for gateway channel list updates...");
						$N.services.gateway.HomeCruise.addEventListener('ChannelListUpdated', cacheGatewayChannels);
						$N.services.gateway.HomeCruise.addEventListener('EventListUpdated', cacheGatewayEventList);
					} else if (currentDataSource === DATA_SOURCES.SDP && $N.services && $N.services.sdp && $N.services.sdp.EPG) {
						dataSources.push(currentDataSource);
					}
				}
			}
			cacheExpiry = (configuration.cacheExpiryTime !== undefined && configuration.cacheExpiryTime !== null) ? configuration.cacheExpiryTime : DEFAULT_CACHE_EXPIRY_TIME;
			setCacheHouseKeeping(expiredEventsTime, checkForExpiredEventsTime);
			$N.platform.btv.PersistentCache.addEPGServicesUpdatedListener(refreshChannels);
			refreshChannels();
			ethernetConnected = $N.platform.system.Network.isNetworkAvailable($N.platform.system.Network.NetworkType.ETHERNET);
		},

		/**
		 * Initialises the EPG class.
		 * @method initialise
		 * @deprecated use init()
		 * @param {Object} configuration Object containing the following optional properties:
		 * @param {String} configuration.cacheType One of $N.platform.btv.EPG.CACHE_TYPES
		 * @param {Array} [configuration.dataSources=[$N.platform.btv.DATA_SOURCES.SDP]] Array of one or more $N.platform.btv.EPG.DATA_SOURCES
		 * @param {Number} [configuration.cacheExpiryTime=3600000 (1 hour)] Amount of milliseconds that cached event is deemed valid
		 * @param {Boolean} [configuration.useRAMCache=true] False if events should not be cached
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
		 */
		refresh: refreshChannels,

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
		 * @method removeAllChannels
		 */
		removeAllChannels: function () {
			//TODO: once CCOM2 supports this
		},

		/**
		 * Gets a list of channels sorted by logical channel number
		 *
		 * @method getAllChannelsOrderedByChannelNumber
		 * @return {Array} List of EPGService Objects
		 */
		getAllChannelsOrderedByChannelNumber: function () {
			if (allChannelList.length > 0) {
				var tmpArray = allChannelList.slice(0);
				return tmpArray.sort(compareLogicalChannelNum);
			} else {
				return [];
			}
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
		 * Gets a list of service ids of IP channels
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
			return dvbChannelList;
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
		 * Accepts a list of channels to be marked as subscribed to. Usually only called during the bootstrap
		 * process or when the channel list is updated.
		 *
		 * @method setSubscribedChannels
		 * @param channelList {Array} the list of channels that the user is subscribed to
		 */
		setSubscribedChannels: function (channelList) {
			log("setSubscribedChannels", "Enter");
			if (channelList) {
				subscribedChannelList = channelList;
				log("setSubscribedChannels", "Set " + channelList.length.toString() + ' subscribed channels');
			}
			log("setSubscribedChannels", "Exit");
		},

		/**
		 * Gets a list of all channels that the user is subscribed to
		 * @method getSubscribedChannels
		 * @return {Array} List of EPGService Objects
		 */
		getSubscribedChannels: function () {
			return subscribedChannelList;
		},

		/**
		 * Returns an EPGService matched by its logical channel number
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
		 * @method getChannelByServiceId
		 * @param {Number} serviceId service id of the channel that we're interested in
		 * @return {Object} EPGService object, or null if no matching channel is found
		 */
		getChannelByServiceId: function (serviceId) {
			return allChannels[String(serviceId)];
		},

		/**
		 * Returns the channel matching the URI given
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
		 * @param {Array} serviceIds Array of service ids that we're interested in
		 * @param {Number} startTime Start time in milliseconds
		 * @param {Number} endTime End time in milliseconds
		 * @return {Array} Array of EPGEvent objects
		 */
		getEventsByWindow: function (serviceIds, startTime, endTime) {
			log("getEventsByWindow", "begin with startTime:" + startTime + " endTime:" + endTime, $N.apps.core.Log.LOG_DEBUG);
			var events = $N.platform.btv.PersistentCache.getEventsByWindow(serviceIds, Math.floor(startTime), Math.floor(endTime));
			if (events.error === undefined) {
				return $N.platform.btv.EPGEventFactory.mapArray(events);
			}
			return [];
		},

		/**
		 * Gets the event with the matching id
		 *
		 * @method getEventById
		 * @param {Number} eventId event id
		 * @return {Object} EPGEvent object matching the event id
		 */
		getEventById: function (eventId) {
			log("getEventById", "for event " + eventId, $N.apps.core.Log.LOG_DEBUG);
			return $N.platform.btv.PersistentCache.getEventById(eventId);
		},

		/**
		 * Gets the current event on the given channel
		 *
		 * @method getCurrentEventForService
		 * @param {Number} serviceId service id of the channel we're interested in
		 * @return {Object} current EPGEvent for the given service id
		 */
		getCurrentEventForService: function (serviceId) {
			log("getCurrentEventForService", "for service " + serviceId, $N.apps.core.Log.LOG_DEBUG);
			return $N.platform.btv.PersistentCache.getEventCurrent(serviceId);
		},

		/**
		 * Gets the event starting immediately after the current one on the given channel
		 *
		 * @method getNextEventForService
		 * @param {Number} serviceId service id of the channel we're interested in
		 * @return {Object} EPGEvent object
		 */
		getNextEventForService: function (serviceId) {
			log("getNextEventForService", "for service " + serviceId, $N.apps.core.Log.LOG_DEBUG);
			var event = this.getCurrentEventForService(serviceId),
				eventId = event ? event.eventId : null;
			return eventId ? $N.platform.btv.PersistentCache.getEventNext(eventId) : null;
		},

		/**
		 * Gets the event starting immediately before the current one on the given channel
		 *
		 * @method getPreviousEventForService
		 * @param {Number} serviceId service id of the channel we're interested in
		 * @return {Object} EPGEvent object
		 */
		getPreviousEventForService: function (serviceId) {
			log("getPreviousEventForService", "for service " + serviceId, $N.apps.core.Log.LOG_DEBUG);
			var event = this.getCurrentEventForService(serviceId),
				eventId = event ? event.eventId : null;
			return eventId ? $N.platform.btv.PersistentCache.getEventPrevious(eventId) : null;
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
		 * Gets the events for the given service and between the given start and end times.
		 * If there is a gap between one events end time and the next events start time then a dummy event is
		 * created using the given `getDummyEvent` function
		 * @method getEventsForChannelWithDummyEvents
		 * @param {Number} serviceId
		 * @param {Number} startTime
		 * @param {Number} endTime
		 * @param {Function} getDummyEvent a dummy event generator function
		 * @return {Array}
		 */
		getEventsForChannelWithDummyEvents: function (serviceId, startTime, endTime, getDummyEvent) {
			var eventsForService = this.getEventsByWindow([serviceId], startTime, endTime);
			eventsForService = augmentEventArrayWithDummyEvents(eventsForService, startTime, endTime, serviceId, getDummyEvent);
			return eventsForService;
		},

		/**
		 * Gets the events for the given service and between the given start and end times.
		 * If there is a gap between one event's end time and the next event's start time then a dummy event is
		 * created using the given `getDummyEvent` function, the start and end events are timed to start/end in the
		 * time window.
		 * @method getEventsForGridRow
		 * @param {Number} serviceId
		 * @param {Number} startTime
		 * @param {Number} endTime
		 * @param {Function} getDummyEvent a dummy event generator function
		 * @return {Array}
		 */
		getEventsForGridRow: function (serviceId, startTime, endTime, getDummyEvent) {
			log("getEventsForGridRow", "begin with service " + serviceId, $N.apps.core.Log.LOG_DEBUG);
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
			var chanArray = this.getVideoChannelsOrderedByChannelNumber();
			// TODO: Above line customised for NET which does not use All channels, only Video channels
			// Implements NETUI-2048 - Update the EPG.js based on NINJA-1582
			var serviceIds = [];
			var i;
			var chanArrayLength = chanArray.length;
			for (i = 0; i < chanArrayLength; i++) {
				serviceIds.push(chanArray[i].serviceId);
			}
			return serviceIds;
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
		 * @method fetchEventById
		 * @param {string} eventId eventId required
		 * @param {Function} callback function that will be executed after the event information becomes fetched
		 */
		fetchEventById : function (eventId, callback) {
			// TODO: NETUI-3437 - Log with JSFW Team
			var returnedEvent,
				gatewayCall = function () {},
				sdpFetchCall = function () {
					$N.services.sdp.EPG.fetchEventById(eventId, function (event) {
						callback(event);
						cacheEvents([event]);
					});
				},
				processSuccess = function (data) {
					if (data) {
						setTimeout(function () {
							callback(data);
						}, 1);
					} else {
						fetchEventFromCache(epgCache.fetchEventCurrent, eventId, gatewayCall, sdpFetchCall, callback);
					}
				},
				processFailure = function () {
					fetchEventFromCache(epgCache.fetchEventById, eventId, gatewayCall, sdpFetchCall, callback);
				};

			returnedEvent = this.getEventById(eventId);
			if (returnedEvent) {
				processSuccess(returnedEvent);
			} else {
				processFailure();
			}
		},

		/**
		 * Retrieves the current event on the given channel asynchronously.
		 * This is the asynchronous version of `getCurrentEventForService`.
		 * @method fetchCurrentEventForService
		 * @async
		 * @param {Number} serviceId service id of the channel we're interested in
		 * @param {Function} callback The callback function
		 */
		fetchCurrentEventForService: function (serviceId, callback) {
			log("fetchCurrentEventForService", "for service " + serviceId, $N.apps.core.Log.LOG_DEBUG);
			var startTime,
				service,
				currentTime = new Date().getTime(),
				currentEvent,
				me = this,
				gatewayCall = function () {
					startTime = new Date().getTime();
					$N.services.gateway.HomeCruise.fetchEitData(serviceId, startTime, startTime + 500, function (results) {
						if (results.length > 0) {
							callback(results[0]);
							cacheEvents(results);
						} else {
							callback(null);
						}
					});
				},
				sdpFetchCall = function () {
					$N.services.sdp.EPG.fetchCurrentEventForService(serviceId, function (event) {
						callback(event);
						cacheEvents([event]);
					});
				},
				processSuccess = function (data) {
					if (data) {
						setTimeout(function () {
							callback(data);
						}, 1);
					} else {
						service = getChannelOrDummyChannelByServiceId(serviceId);
						fetchEventFromCache(epgCache.fetchEventCurrent, service, gatewayCall, sdpFetchCall, callback);
					}
				},
				processFailure = function () {
					//TODO: Do we report OTV call failure or simply get data from cache?
					service = getChannelOrDummyChannelByServiceId(serviceId);
					fetchEventFromCache(epgCache.fetchEventCurrent, service, gatewayCall, sdpFetchCall, callback);
				};
			currentEvent = me.getCurrentEventForService(serviceId);
			if (currentEvent) {
				processSuccess(currentEvent);
			} else {
				processFailure();
			}
		},

		/**
		 * Retrieves the event starting immediately after the current one on the given channel asynchronously.
		 * This is the asynchronous version of `getNextEventForService`.
		 * @method fetchNextEventForService
		 * @async
		 * @param {Number} serviceId service id of the channel we're interested in
		 * @param {Function} callback The callback function
		 */
		fetchNextEventForService: function (serviceId, callback) {
			log("fetchNextEventForService", "for service " + serviceId, $N.apps.core.Log.LOG_DEBUG);
			var startTime,
				service,
				me = this,
				criteria = "",
				results,
				nextEvent,
				order = "startTime ASC",
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
						cacheEvents([event]);
					});
				},
				processSuccess = function (event) {
					if (event) {
						callback($N.platform.btv.EPGEventFactory.mapObject(event));
					} else {
						service = getChannelOrDummyChannelByServiceId(serviceId);
						fetchEventFromCache(epgCache.fetchEventNext, service, gatewayCall, sdpFetchCall, callback);
					}
				},
				processFailure = function () {
					//TODO: Do we report OTV call failure or simply get data from cache?
					service = getChannelOrDummyChannelByServiceId(serviceId);
					fetchEventFromCache(epgCache.fetchEventNext, service, gatewayCall, sdpFetchCall, callback);
				};
			nextEvent = me.getNextEventForService(serviceId);
			if (nextEvent) {
				processSuccess(nextEvent);
			} else {
				processFailure();
			}
		},

		/**
		 * Retrieves the event starting immediately before the current one on the given channel asynchronously.
		 * This is the asynchronous version of `getPreviousEventForService`.
		 * @method fetchPreviousEventForService
		 * @async
		 * @param {Number} serviceId service id of the channel we're interested in
		 * @param {Function} callback The callback function
		 */
		fetchPreviousEventForService: function (serviceId, callback) {
			log("fetchPreviousEventForService", "for service " + serviceId, $N.apps.core.Log.LOG_DEBUG);
			var startTime,
				service,
				me = this,
				results,
				criteria = "",
				previousEvent,
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
						$N.services.sdp.EPG.fetchEventsByWindow([serviceId], currentEvent.startTime - 1, currentEvent.startTime, function (previousEvents) {
							callback(previousEvents[0]);
							cacheEvents(previousEvents);
						});
					});
				},
				processSuccess = function (event) {
					if (event) {
						callback($N.platform.btv.EPGEventFactory.mapObject(event));
					} else {
						service = getChannelOrDummyChannelByServiceId(serviceId);
						fetchEventFromCache(epgCache.fetchEventPrevious, service, gatewayCall, sdpFetchCall, callback);
					}
				},
				processFailure = function () {
					//TODO: Do we report OTV call failure or simply get data from cache?
					service = getChannelOrDummyChannelByServiceId(serviceId);
					fetchEventFromCache(epgCache.fetchEventPrevious, service, gatewayCall, sdpFetchCall, callback);
				};
			previousEvent = me.getPreviousEventForService(serviceId);
			if (previousEvent) {
				processSuccess(previousEvent);
			} else {
				processFailure();
			}
		},

		/**
		 * Retrieves events on the event channel that are within the given time bounds.
		 * This is the asynchronous version of getEventsByWindow.
		 * @method fetchEventsByWindow
		 * @async
		 * @param {Array} serviceIds Array of service ids that we're interested in
		 * @param {Number} startTime Start time in milliseconds
		 * @param {Number} endTime End time in milliseconds
		 * @param {Function} callback The callback function
		 */
		fetchEventsByWindow: function (serviceIds, startTime, endTime, callback) {
			log("fetchEventsByWindow", "for services " + serviceIds.length, $N.apps.core.Log.LOG_DEBUG);
			var newEvents = [],
				fetchedEvents = null,
				serviceGaps = {},
				services = {},
				service,
				requestServiceIds,
				mergedEvents = null,
				events = this.getEventsByWindow(serviceIds, Math.floor(startTime), Math.floor(endTime)),
				me = this;

			if (events) {
				var getEventsFromCacheCallback = function (cachedEvents) {
					var getEventsFromSourceCallback = function (sourceEvents) {
							if (sourceEvents) {
								events = mergeEvents(serviceIds, serviceGaps, events, sourceEvents);
							}
							callback(events);
						};
					if (cachedEvents && !haveCachedEventsExpired(cachedEvents)) {
						events = mergeEvents(serviceIds, serviceGaps, events, cachedEvents);
						serviceGaps = populateServiceGapsArray(events, serviceIds, startTime, endTime);
					}
					if (ethernetConnected && serviceGaps.array.length > 0) {
						service = getChannelOrDummyChannelByServiceId(serviceIds[0]);
						if ((isExtendedIPSchedule || (service && service.deliveryMethod === $N.data.EPGService.DELIVERY_TYPE.GATEWAY)) && isDataSourceConfigured(DATA_SOURCES.GATEWAY)) {
							fetchEventsFromGatewayForWindow(serviceGaps, startTime, endTime, getEventsFromSourceCallback);
						} else if (isDataSourceConfigured(DATA_SOURCES.SDP) && (!service || isExtendedIPSchedule || service.deliveryMethod === $N.data.EPGService.DELIVERY_TYPE.IP)) {
							fetchEventsFromSDPForWindow(serviceGaps, startTime, endTime, getEventsFromSourceCallback);
						} else {
							callback(events);
						}
					} else {
						callback(events);
					}
				};
				serviceGaps = populateServiceGapsArray(events, serviceIds, startTime, endTime);
				if (serviceGaps.array.length > 0) {
					fetchEventsFromCacheForWindow(serviceGaps, startTime, endTime, getEventsFromCacheCallback);
				} else {
					setTimeout(function () {
						callback(events);
					}, 1);
				}
			}
		},

		/**
		 * Retrieves the events for the given service and between the given start and end times asynchronously.
		 * If there is a gap between one event's end time and the next event's start time, then a dummy event is
		 * created using the given `getDummyEvent` function.
		 * This is the asynchronous version of getEventsForChannelWithDummyEvents.
		 * @method fetchEventsForChannelWithDummyEvents
		 * @async
		 * @param {Number} serviceId service id of the channel we're interested in
		 * @param {Number} startTime Start time in milliseconds
		 * @param {Number} endTime End time in milliseconds
		 * @param {Function} getDummyEvent a dummy event generator function
		 * @param {Function} callback The callback function
		 */
		fetchEventsForChannelWithDummyEvents: function (serviceId, startTime, endTime, getDummyEvent, callback) {
			log("fetchEventsForChannelWithDummyEvents", "for service " + serviceId, $N.apps.core.Log.LOG_DEBUG);
			this.fetchEventsByWindow([serviceId], startTime, endTime, function (events) {
				if (events) {
					callback(augmentEventArrayWithDummyEvents(events, startTime, endTime, serviceId, getDummyEvent));
				} else {
					callback([]);
				}
			});
		},

		/**
		 * Determines if a given service represents a radio channel
		 *
		 * @method isRadioChannel
		 * @param {Object} service The EPG service object
		 * @return {Boolean} True if the service is a radio channel
		 */
		isRadioChannel: function (service) {
			return (service && service.serviceType === $N.data.EPGService.SERVICE_TYPE.RADIO);
		},

		/**
		 * Registers a callback method that will be invoked whenever the `refresh` method of this class
		 * is called.
		 *
		 * @method registerRefreshCallback
		 * @param callback {Function} the function that will be invoked
		 * @param context {Object} the object whose method callback is presumed to be
		 */
		registerRefreshCallback: function (callback, context) {
			if (callback && context) {
				refreshCallbacks.push({'callbackFunction': callback, 'caller': context});
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
		 * Begins the monitoring the start of epg events
		 *
		 * @method monitorStartOfEvents
		 * @param {Number} serviceId to be monitored
		 * @param {Number} notify number of seconds to notify prior to the event start
		 */
		monitorStartOfEvents: function (serviceId, notify) {
			//TODO : CCOM 2.0
			//ccomEpg.monitorEventStart(serviceId, notify);
		},

		/**
		 * Cancels monitoring the start of epg events
		 *
		 * @method unmonitorStartOfEvents
		 * @param {Number} serviceId previously set up to be monitored
		 */
		unmonitorStartOfEvents: function (serviceId) {
			//TODO : CCOM 2.0
			//ccomEpg.cancelmonitorEventStart(serviceId);
		},

		/**
		 * Sets up a listener to listen for the start of an epg event
		 * on the service set up using monitorStartOfEvents.
		 *
		 * @method setEventStartCallback
		 * @param {Function} callback to execute on a new event starting
		 */
		setEventStartCallback: function (callback) {
				//TODO : CCOM 2.0
				//ccomEpg.addEventListener('EPGEventStarting', callback, false);
		},
		/**
		 * Checks to see if any serivces are available yet
		 * @method isChannelListPopulated
		 * @return {Boolean} True if the service list has been populated
		 */
		isChannelListPopulated: function () {
			if (allChannelList.length > 0) {
				return true;
			} else {
				return false;
			}
		},

		/**
		 * @method setEthernetConnected
		 * @param {Boolean} connected - is the ethernet connected
		 */
		setEthernetConnected : function (connected) {
			ethernetConnected = connected;
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
