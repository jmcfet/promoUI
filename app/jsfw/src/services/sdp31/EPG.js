/**
 * This class manages EPG data retrieved directly from SDP: it doesn't cache the data.
 *
 * @class $N.services.sdp.EPG
 * @static
 * @singleton
 * @requires $N.apps.core.Log
 * @requires $N.services.sdp.ServiceFactory
 * @requires $N.services.sdp.EPGServiceFactory
 * @requires $N.services.sdp.EPGEventFactory
 * @author Mahesh Jagadeesan
 */
/* global define */
define('jsfw/services/sdp/EPG',
	[
		'jsfw/apps/core/Log',
		'jsfw/services/sdp/ServiceFactory',
		'jsfw/services/sdp/EPGServiceFactory',
		'jsfw/services/sdp/EPGEventFactory'
	],
	function (Log, ServiceFactory, EPGServiceFactory, EPGEventFactory) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};

		$N.services.sdp.EPG = (function () {
			var btvService,
				chanService,
				accountUID,
				locale,
				serviceCache = {},
				log = new $N.apps.core.Log("sdp", "EPG"),
				MAX_EVENT_DURATION = 3 * 3600 * 1000,
				EVENT_TYPE_CATCHUP = 'CU';

			/**
			 * Invokes the supplied callback function when the current event has been fetched
			 * @method executeCurrentEventCallback
			 * @private
			 * @param {Array} eventList the list of events from which the current event will be retrieved
			 * @param {Function} currentEventCallback the function to be executed. This function should
			 * expect one argument which will either be the current event, or null if no current event
			 * info was available.
			 */
			function executeCurrentEventCallback(eventList, currentEventCallback) {
				var currentEvent = null,
					currentDate = new Date(),
					i,
					eventFound = false;
				if (eventList && eventList.length) {
					for (i = 0; i < eventList.length; i++) {
						currentEvent = eventList[i];
						if (currentEvent.startTime < currentDate.getTime() && currentEvent.endTime >= currentDate.getTime()) {
							eventFound = true;
							break;
						}
					}
				}
				currentEventCallback(eventFound ? $N.services.sdp.EPGEventFactory.mapObject(currentEvent, serviceCache) : null);
			}

			/**
			 * Invokes the supplied callback function when the next event has been fetched
			 * @method executeNextEventCallback
			 * @private
			 * @param {Array} eventList the list of events from which the next event will be retrieved
			 * @param {Function} nextEventCallback the function to be executed. This function should
			 * expect one argument which will either be the next event, or null if no next event
			 * info was available.
			 */
			function executeNextEventCallback(eventList, nextEventCallback) {
				var nextEvent = null,
					currentDate = new Date(),
					i,
					eventFound = false;
				if (eventList && eventList.length) {
					for (i = 0; i < eventList.length; i++) {
						nextEvent = eventList[i];
						if (nextEvent.startTime > currentDate.getTime()) {
							eventFound = true;
							break;
						}
					}
				}
				nextEventCallback(eventFound ? $N.services.sdp.EPGEventFactory.mapObject(nextEvent, serviceCache) : null);
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
					sortedEventsLookup[returnedEvents[i].serviceId].push(returnedEvents[i]);
				}
				for (channel in sortedEventsLookup) {
					if (sortedEventsLookup.hasOwnProperty(channel) && sortedEventsLookup[channel]) {
						sortedEventsArray = sortedEventsArray.concat(sortedEventsLookup[channel]);
					}
				}
				return sortedEventsArray;
			}

			function executeEventsByWindowCallback(requestedChannels, eventList, eventsByWindowCallback) {
				var finalEvents = [];
				if (eventList && eventList.length) {
					finalEvents = $N.services.sdp.EPGEventFactory.mapArray(eventList, serviceCache);
				}
				eventsByWindowCallback(sortEventsByChannel(requestedChannels, finalEvents));
			}

			function cacheServices(serviceArray) {
				var i = 0;
				for (i = 0; i < serviceArray.length; i++) {
					serviceCache[serviceArray[i].serviceId] = serviceArray[i];
				}
			}

			function executeChannelsCallback(channels, channelsCallback) {
				var mappedServices = $N.services.sdp.EPGServiceFactory.mapArray(channels);
				cacheServices(mappedServices);
				channelsCallback(mappedServices);
			}

			/**
			 * Function that's called when a call to get event information fails
			 * @method getDetEvtsFailureCallback
			 * @private
			 * @param {Object} result contains information about the failure
			 */
			function getDetEvtsFailureCallback(result) {
				log('getDetEvtsFailureCallback', 'no events found for specified service id', 'warn');
			}

			function fetchEventsByWindowAndExecuteCallback(serviceIds, startTime, endTime, successCallback, failureCallback, isCatchUp) {
				log('fetchEventsByWindowAndExecuteCallback', 'Enter');
				var i,
					resultForServices = [],
					resultForService = [],
					serviceIdString = "";

				if (serviceIds) {
					serviceIdString = serviceIds.join();
					btvService.getDetEvtsByChannelList(this, function (result) {
						for (i = 0; i < serviceIds.length; i++) {
							resultForService = result[serviceIds[i]];
							if (resultForService) {
								resultForServices = resultForServices.concat(resultForService);
							}
						}
						executeEventsByWindowCallback(serviceIds, resultForServices, successCallback);
					}, failureCallback || getDetEvtsFailureCallback, String(serviceIdString), startTime, endTime, locale, isCatchUp ? EVENT_TYPE_CATCHUP : null);
				}
				log('fetchEventsByWindowAndExecuteCallback', 'Exit');
			}

			return {
				/**
				 * Initialises the class
				 * @method init
				 * @param {Number} account account id
				 * @param {String} currentLocale the user's current locale (en_gb, es_es, etc.)
				 */
				init: function (account, currentLocale) {
					btvService = $N.services.sdp.ServiceFactory.get('BTVService');
					chanService = $N.services.sdp.ServiceFactory.get("ChannelService");
					accountUID = account || null;
					locale = currentLocale || 'en_gb';
				},

				/**
				 * Initialises the class
				 * @method initialise
				 * @deprecated use init()
				 * @param {Number} account account id
				 * @param {String} currentLocale the user's current locale (en_gb, es_es, etc.)
				 */
				initialise: function (account, currentLocale) {
					this.init(account, currentLocale);
				},

				/**
				 * Fetched all the channels available regardless of subscription from the SDP
				 * @method fetchAllChannels
				 * @param {Function} successCallback function that will be executed
				 * @param {Function} [failureCallback] function that will be executed if the SDP call fails
				 * @async
				 */
				fetchAllChannels: function (successCallback, failureCallback) {
					chanService.getAllChannels(this, function (result) {
						executeChannelsCallback(result, successCallback);
					}, failureCallback, locale, null);
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
					if (serviceId) {
						var currentDate = new Date();
						currentDate.setMinutes(0, 0, 0);
						var startTime = currentDate.getTime(),
							endTime = startTime + MAX_EVENT_DURATION;
						btvService.getDetEvtsByChannelList(this, function (result) {
							executeCurrentEventCallback(result[serviceId], successCallback);
						}, failureCallback || getDetEvtsFailureCallback, (String(serviceId)), startTime, endTime, locale, null);
					}
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
					if (serviceId) {
						var startTime = (new Date()).getTime(),
							endTime = startTime + MAX_EVENT_DURATION;
						btvService.getDetEvtsByChannelList(this, function (result) {
							executeNextEventCallback(result[serviceId], successCallback);
						}, failureCallback || getDetEvtsFailureCallback, (String(serviceId)), startTime, endTime, locale, null);
					}
				},

				/**
				 * Retrieves information about events falling within a specified time window. Since this call is asynchronous,
				 * the caller accesses the retrieved information by passing in a callback function.
				 * @method fetchEventsByWindow
				 * @async
				 * @param {Array} serviceIds Array of service ids
				 * @param {Number} startTime start time (in ms)
				 * @param {Number} endTime end time (in ms)
				 * @param {Function} successCallback function that will be invoked after the event information becomes
				 * available
				 * @param {Function} [failureCallback] function that will be executed if the SDP call fails
				 */
				fetchEventsByWindow: function (serviceIds, startTime, endTime, successCallback, failureCallback) {
					log('fetchEventsByWindow', 'Enter');
					fetchEventsByWindowAndExecuteCallback(serviceIds, startTime, endTime, successCallback, failureCallback);
					log('fetchEventsByWindow', 'Exit');
				},

				/**
				 * Retrieves catch-up events falling within a specified time window for the given list of services.
				 * @method fetchCatchUpEventsByWindow
				 * @async
				 * @param {Array} serviceIds list of service ids
				 * @param {Number} startTime start time in ms
				 * @param {Number} endTime end time in ms
				 * @param {Function} successCallback function that will be called if the request is successful
				 * @param {Array} successCallback.events list of events arranged in order of their start times
				 * @param {Function} failureCallback function that will be called if the request has failed
				 */
				fetchCatchUpEventsByWindow: function (serviceIds, startTime, endTime, successCallback, failureCallback) {
					log('fetchCatchUpEventsByWindow', 'Enter');
					fetchEventsByWindowAndExecuteCallback(serviceIds, startTime, endTime, successCallback, failureCallback, true);
					log('fetchCatchUpEventsByWindow', 'Exit');
				},

				/**
				 * Retrieves events that are deemed watchable within the given time window. For a window that's entirely in the past,
				 * this means only catch-up events; for a window that starts in the past and extends into the future, this means catch-up
				 * events for the past time window and all events in the future window; for a window that's entirely in the future,
				 * this means all events.
				 * @method fetchWatchableEventsByWindow
				 * @async
				 * @param {Array} serviceIds list of service ids
				 * @param {Number} startTime start time in ms
				 * @param {Number} endTime end time in ms
				 * @param {Function} successCallback function that will be called if the request is successful
				 * @param {Array} successCallback.events list of events arranged in order of their start times
				 * @param {Function} failureCallback function that will be called if the request fails
				 */
				fetchWatchableEventsByWindow: function (serviceIds, startTime, endTime, successCallback, failureCallback) {
					log('fetchWatchableEventsByWindow', 'Enter');
					fetchEventsByWindowAndExecuteCallback(serviceIds, startTime, endTime, function (eventList) {
						var now = new Date().getTime();
						eventList = eventList.filter(function (currentEvent) {
							return (currentEvent.startTime < now && currentEvent.endTime <= now) ? currentEvent.isCatchUp : true;
						});
						successCallback(eventList);
					}, failureCallback);
					log('fetchWatchableEventsByWindow', 'Exit');
				},

				fetchEventsForChannelWithDummyEvents: function (serviceId, startTime, endTime, successCallback, failureCallback) {
					//TODO: for implementation later, when we can consider IPDataLoader.js SDP abstraction/separation
				},

				/**
				 * Retrieves channels for the given package ids
				 * @method fetchChannelsForPackages
 				 * @param {Array} packageIds
 				 * @param {Function} callback
				 */
				fetchChannelsForPackages: function (packageIds, callback) {
					$N.services.sdp.ServiceFactory.get("ChannelService").getByPkgPattern(this, function (result) {
						callback($N.services.sdp.EPGServiceFactory.mapArray(result));
					}, callback, packageIds, locale);
				}
			};
		}());
		return $N.services.sdp.EPG;
	}
);