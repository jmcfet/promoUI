/**
 * This class manages EPG data retrieved directly from the Metadata Server: it doesn't cache the data.
 *
 * @class $N.services.sdp.EPG
 * @static
 * @singleton
 * @requires $N.services.sdp.EPGServiceFactory
 * @requires $N.services.sdp.EPGEventFactory
 * @requires $N.apps.core.Log
 * @author Mahesh Jagadeesan
 */

var $N = $N || {};
$N.services = $N.services || {};
$N.services.sdp = $N.services.sdp || {};

$N.services.sdp.EPG = (function () {
	var metaDataService,
		accountUID,
		locale,
		cacheEvents = true,
		log = new $N.apps.core.Log("sdp", "EPG"),
		MAX_EVENT_DURATION = 3 * 3600 * 1000 * 1000;

	/**
	 * Creates a filter for a mds call to fetch events between start and end times
	 * @method createFilterForCurrentEvent
	 * @param {Object} mdsEvent object containing channel id and time window of the event
	 * @return {Object} programFilter filter object to be passed to mds
	 * @private
	 */
	function createFilterForCurrentEvent(mdsEvent) {
		var programFilter = {};
		programFilter.serviceRef = mdsEvent.channelId;
		if (mdsEvent.startTime) {
			programFilter["period.start"] = {"$gte": mdsEvent.startTime / 1000};
		}
		if (mdsEvent.endTime) {
			programFilter["period.end"] = {"$lte": mdsEvent.endTime / 1000};
		}
		return programFilter;
	}

	/**
	 * Creates a filter for a mds call to fetch an event with a specified channel id and start time
	 * @method createFilterForNextEvent
	 * @param {Object} mdsEvent object containing channel id and time window of the event
	 * @return {Object} programFilter filter object to be passed to mds
	 * @private
	 */
	function createFilterForNextEvent(mdsEvent) {
		var programFilter = {};
		programFilter.serviceRef = mdsEvent.channelId;
		if (mdsEvent.startTime) {
			programFilter["period.start"] =  {"$gte": mdsEvent.startTime / 1000};
		}
		return programFilter;
	}

	/**
	 * Creates a filter for a mds call to fetch events by window
	 * @method createFilterForWindow
	 * @param {Object} timeWindow object containing an array of serviceids and a window start and end time
	 * @return {Object} programFilter filter object to be passed to mds
	 * @private
	 */
	function createFilterForWindow(timeWindow) {
		var programFilter = {};
		if (timeWindow.channelIds.length === 1) {
			programFilter.serviceRef = timeWindow.channelIds[0];
		} else {
			programFilter.serviceRef = {"$in": timeWindow.channelIds};
		}
		if (timeWindow.endTime) {
			programFilter["period.start"] = {"$lt": timeWindow.endTime / 1000};
		}
		if (timeWindow.startTime) {
			programFilter["period.end"] = {"$gt": timeWindow.startTime / 1000};
		}
		return programFilter;
	}

	/**
	 * @method createFilterForLatestOrEarliestEvent
	 * @param {Object} mdsEvent object optionally containing channel id and start time
	 */
	function createFilterForLatestOrEarliestEvent(mdsEvent) {
		var programFilter = {};
		if (mdsEvent.channelId) {
			programFilter.serviceRef = mdsEvent.channelId;
		}
		return programFilter;
	}

	function sortEventsByChannel(requestedChannels, returnedEvents) {
		var i,
			j,
			channel,
			sortedEventsLookup = {},
			sortedEventsArray = [];

		for (i = 0; i < requestedChannels.length; i++) {
			sortedEventsLookup[requestedChannels[i]] = [];
		}
		for (i = 0; i < returnedEvents.length; i++) {
			if (returnedEvents[i] && sortedEventsLookup[returnedEvents[i].serviceId]) {
				sortedEventsLookup[returnedEvents[i].serviceId].push(returnedEvents[i]);
			}
		}
		for (channel in sortedEventsLookup) {
			if (sortedEventsLookup.hasOwnProperty(channel) && sortedEventsLookup[channel]) {
				sortedEventsArray = sortedEventsArray.concat(sortedEventsLookup[channel]);
			}
		}
		return sortedEventsArray;
	}

	function cacheEvent(event) {
		if (cacheEvents) {
			$N.platform.btv.EPGCache.cacheEvent(event);
		}
	}

	return {
		/**
		 * Initialises the class
		 * @method initialise
		 * @param {Number} account account id
		 * @param {String} currentLocale the user's current locale (en_gb, es_es, etc.)
		 */
		initialise: function (account, currentLocale) {
			accountUID = account || null;
			locale = currentLocale || 'en_GB';
			metaDataService = $N.services.sdp.MetadataService;
		},

		/**
		 * Fetched all the channels available regardless of subscription from the SDP
		 * @method getAllChannels
		 * @param {Function} successCallback function that will be executed
		 * @param {Function} [failureCallback] function that will be executed if the SDP call fails
		 * @asysnc
		 */
		fetchAllChannels: function (successCallback, failureCallback) {
			log('fetchAllChannels', 'Enter');
			var filter = {},
				processSuccess = function (response) {
					var channels = [];
					if (response && response.services && response.services.length > 0) {
						channels = $N.services.sdp.EPGServiceFactory.mapArray(response.services);
						successCallback(channels);
					} else {
						successCallback(null);
					}
				},
				processFailure = function (response) {
					failureCallback(response);
				};
			metaDataService.getEPGData(this, processSuccess, processFailure, metaDataService.RequestType.Channels, filter, [["Title", 1]], null);
			log('fetchAllChannels', 'Exit');
		},

		/**
		 * @method fetchLatestEvent
		 * @param {Function} callback function that will be executed
		 * @param {String} serviceId
		 * @asysnc
		 */
		fetchLatestEvent: function (callback, serviceId) {
			//TODO: NETUI-2981 - This needs to be logged with JSFW
			log('fetchLatestEvent', 'Enter');
			var mdsEvent = {},
				latestEvent,
				filter,
				processSuccess = function (response) {
					if (response && response.programmes && response.programmes.length > 0) {
						latestEvent = $N.services.sdp.EPGEventFactory.mapObject(response.programmes[0]);
						callback(latestEvent);
					} else {
						callback(null);
					}
				},
				processFailure = function (response) {
					log('fetchLatestEvent failure', "processFailure response = " + String(response));
					callback(null);
				};

			if (serviceId) {
				mdsEvent.channelId = $N.app.ChannelManager.getServiceRef(serviceId);
			}

			filter = createFilterForLatestOrEarliestEvent(mdsEvent);
			metaDataService.getEPGData(this, processSuccess, processFailure, metaDataService.RequestType.Events, filter, [["period.end", -1]], null, 1, null);

			log('fetchLatestEvent', 'Exit');
		},

		/**
		 * @method fetchEarliestEvent
		 * @param {Function} callback function that will be executed
		 * @param {String} (optional) serviceId
		 * @asysnc
		 */
		fetchEarliestEvent: function (callback, serviceId) {
			//TODO: NETUI-2981 - This needs to be logged with JSFW
			log('fetchEarliestEvent', 'Enter');
			var mdsEvent = {},
				earliestEvent,
				filter,
				processSuccess = function (response) {
					log('fetchEarliestEvent processSuccess');
					if (response && response.programmes && response.programmes.length > 0) {
						earliestEvent = $N.services.sdp.EPGEventFactory.mapObject(response.programmes[0]);
						callback(earliestEvent);
					} else {
						callback(null);
					}
				},
				processFailure = function (response) {
					log('fetchEarliestEvent failure', "processFailure response = " + String(response));
					callback(null);
				};

			if (serviceId) {
				mdsEvent.channelId = $N.app.ChannelManager.getServiceRef(serviceId);
			} else {
				mdsEvent.channelId = "SPOSNYHD"; // TODO - NETUI-4455 - Remove else, this is a query optimisation for Grid until we have a better mechanism
			}

			filter = createFilterForLatestOrEarliestEvent(mdsEvent);
			metaDataService.getEPGData(this, processSuccess, processFailure, metaDataService.RequestType.Events, filter, [["period.start", 1]], null, 1, null);
			log('fetchEarliestEvent', 'Exit');
		},

		/**
		 * @method fetchEventById
		 * @param {string} eventId eventId required
		 * @param {Function} successCallback function that will be executed after the event information becomes
		 * fetched
		 * @param {Function} failureCallback (optional) function that will be executed if the SDP call fails
		 * @asysnc
		 */
		fetchEventById : function (eventId, successCallback, failureCallback) {
			// TODO: NETUI-3437 - Log with JSFW Team
			var event,
				filter = {},
				processSuccess = function (response) {
					log('fetchEventById processSuccess');
					if (response && response.programmes && response.programmes.length > 0) {
						event = $N.services.sdp.EPGEventFactory.mapObject(response.programmes[0]);
						successCallback(event);
					} else {
						successCallback();
					}
				},
				processFailure = function (response) {
					log('fetchEventById failure', "processFailure response = " + String(response));
					if (failureCallback) {
						failureCallback();
					}
				};
			filter.id = eventId;
			metaDataService.getEPGData(this, processSuccess, processFailure, metaDataService.RequestType.Events, filter, null, null, 1, null);
			log('fetchEventById', 'Exit');
		},

		/**
		 * Retrieves information about the currently showing event for the specified channel. Since this
		 * call is asynchronous, the caller accesses the retrieved information by passing  in a callback
		 * function.
		 * @method fetchCurrentEventForService
		 * @async
		 * @param {String} serviceId service id of the requested channel
		 * @param {Function} successCallback function that will be executed after the event information becomes
		 * fetched
		 * @param {Function} [failureCallback] function that will be executed if the SDP call fails
		 */
		fetchCurrentEventForService: function (serviceId, successCallback, failureCallback) {
			log('fetchCurrentEventForService', 'Enter');
			var mdsEvent = {},
				currentEvent,
				filter,
				currentDate = new Date(),
				startDate = new Date(),
				endDate = new Date(),
				processSuccess = function (response) {
					if (response && response.programmes && response.programmes.length > 0) {
						currentEvent = $N.services.sdp.EPGEventFactory.mapObject(response.programmes[0]);
						cacheEvent(currentEvent);
						successCallback(currentEvent);
					} else {
						successCallback(null);
					}
				},
				processFailure = function (response) {
					log("fetchCurrentEventForService failure", "processFailure response = " + String(response));
				};
			if (serviceId) {
				startDate.setMinutes(0, 0, 0);
				mdsEvent.channelId = serviceId;
				mdsEvent.startTime = startDate.getTime();
				mdsEvent.endTime = startDate.getTime() + MAX_EVENT_DURATION;
				filter = createFilterForCurrentEvent(mdsEvent);
				metaDataService.getEPGData(this, processSuccess, processFailure, metaDataService.RequestType.Events, filter, [["period.start", 1]], null, 1, null);
			}
			log('fetchCurrentEventForService', 'Exit');
		},

		/**
		 * Retrieves information about the next event for the specified channel. Since this call is asynchronous,
		 * the caller accesses the retrieved information by passing in a callback function.
		 * @method fetchNextEventForService
		 * @async
		 * @param {String} serviceId service id of the requested channel
		 * @param {Function} successCallback function that will be executed after the event information becomes
		 * available
		 * @param {Function} [failureCallback] function that will be executed if the SDP call fails
		 */
		fetchNextEventForService: function (serviceId, successCallback, failureCallback) {
			log('fetchNextEventForService', 'Enter');
			var me = this,
				filter,
				nextEvent,
				mdsEvent = {},
				processCurrentSuccess = function (currentResponse) {
					var startTime,
						endTime,
						processNextSuccess = function (nextResponse) {
							if (nextResponse && nextResponse.programmes.length > 0) {
								nextEvent = $N.services.sdp.EPGEventFactory.mapObject(nextResponse.programmes[0]);
								cacheEvent(nextEvent);
								successCallback(nextEvent);
							} else {
								successCallback(null);
							}
						},
						processNextFailure = function (nextResponse) {
							log("fetchNextEventForService Next failure", "for service " + serviceId, $N.apps.core.Log.LOG_DEBUG);
						};
					if (currentResponse) {
						startTime = currentResponse.endTime;
						endTime = currentResponse.endTime + (60 * 1000);
						mdsEvent.channelId = serviceId;
						mdsEvent.startTime = startTime;
						filter = createFilterForNextEvent(mdsEvent);
						metaDataService.getEPGData(this, processNextSuccess, processNextFailure, metaDataService.RequestType.Events, filter, [["period.start", 1]], null, 1);
					} else {
						successCallback(null);
					}
				},
				processCurrentFailure = function (currentResponse) {
					log("fetchNextEventForService Current failure", "for service " + serviceId, $N.apps.core.Log.LOG_DEBUG);
				};
			if (serviceId) {
				me.fetchCurrentEventForService(serviceId, processCurrentSuccess, processCurrentFailure);
			}
			log('fetchNextEventForService', 'Exit');
		},

		/**
		 * Retrieves information about events falling within a specified time window. Since this call is asynchronous,
		 * the caller accesses the retrieved information by passing in a callback function.
		 * @method fetchEventsByWindow
		 * @async
		 * @param {Array} serviceIds Array of serviceids)
		 * @param {Number} startTime start time (in ms)
		 * @param {Number} endTime end time (in ms)
		 * @param {Function} successCallback function that will be invoked after the event information becomes
		 * available
		 * @param {Function} [failureCallback] function that will be executed if the SDP call fails
		 */
		fetchEventsByWindow: function (serviceIds, startTime, endTime, successCallback, failureCallback) {
			log('fetchEventsByWindow', 'Enter');
			var	filter,
				i,
				timeWindow = {},
				events = [],
				processSuccess = function (response) {
					if (response && response.programmes && response.programmes.length > 0) {
						events = $N.services.sdp.EPGEventFactory.mapArray(response.programmes);
						successCallback(sortEventsByChannel(serviceIds, events));
					} else {
						successCallback([]);
					}
				},
				processFailure = function (response) {
					log("fetchEventsByWindow failure", "processFailure response = " + String(response));
					successCallback([]);
				};
			if (serviceIds.length > 0) {
				var serviceRefs = [];
				for (i = 0; i < serviceIds.length; i++) {
					var id = $N.app.ChannelManager.getServiceRef(serviceIds[i]);

					if (id !== undefined) {
						serviceRefs.push(id);
					}
				}

				if (serviceRefs.length > 0) {
					timeWindow.channelIds = serviceRefs;
					timeWindow.startTime = startTime;
					timeWindow.endTime = endTime;
					filter = createFilterForWindow(timeWindow);
					metaDataService.getEPGData(this, processSuccess, processFailure, metaDataService.RequestType.Events, filter, [["period.start", 1]], null, 100);
				} else {
					processFailure();
				}
			}
			log('fetchEventsByWindow', 'Exit');
		},

		fetchEventsForChannelWithDummyEvents: function (serviceId, startTime, endTime, successCallback, failureCallback) {
			//TODO: for implementation later, when we can consider IPDataLoader.js SDP abstraction/separation
		}
	};
}());
