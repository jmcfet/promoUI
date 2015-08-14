/**
 * This class is responsible for caching EPG data.
 * It caches the EPG service and event data by adding
 * them to a Javascript cache
 * @class $N.platform.btv.EPGCache
 * @singleton
 * @requires $N.apps.core.Log
 * @author Gareth Stacey
 */
//TODO: Add a way to clear past events from cache
define('jsfw/platform/btv/EPGCache',
	[
		'jsfw/apps/core/Log'
	],
	function (Log) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.btv = $N.platform.btv || {};

		$N.platform.btv.EPGCache = (function () {

			var log = new $N.apps.core.Log("btv", "EPGCache"),
				cachedServices = [],
				cachedEvents = {};

			/**
			 * Returns the index number of the given service in the cachedServices array
			 * Returns -1 if service does not exist
			 * @method getCachedServiceIndex
			 * @private
			 * @param {Object} service
			 * @return {Number} index in cachedServices array. Returns -1 if service does not exist
			 */
			function getCachedServiceIndex(service) {
				var i,
					cachedServiceslength = cachedServices.length;
				for (i = 0; i < cachedServiceslength; i++) {
					if (service.serviceId === cachedServices[i].serviceId) {
						return i;
					}
				}
				return -1;
			}

			return {
				/**
				 * Initialises the class.
				 * @method init
				 */
				init: function () {

				},

				/**
				 * Adds the given event to the event cache
				 * @method cacheEvent
				 * @param {Object} epgEvent
				 * @param {Function} callback Called after event is cached
				 */
				cacheEvent: function (epgEvent, callback) {
					var eventIndex,
						i,
						isCached = false,
						eventsToRemove = [];

					if (!cachedEvents[epgEvent.serviceId]) {
						cachedEvents[epgEvent.serviceId] = [];
					}
					if (!epgEvent._data) {
						epgEvent._data = {};
					}
					epgEvent._data.cacheTimestamp = new Date().getTime();
					if (cachedEvents[epgEvent.serviceId].length === 0 ||
							cachedEvents[epgEvent.serviceId][cachedEvents[epgEvent.serviceId].length - 1].endTime <= epgEvent.startTime) {
						cachedEvents[epgEvent.serviceId].push(epgEvent);
					} else {
						for (i = 0; i < cachedEvents[epgEvent.serviceId].length; i++) {
							if (isCached) {
								if (cachedEvents[epgEvent.serviceId][i].startTime < epgEvent.endTime) {
									eventsToRemove.push(i);
								} else {
									break;
								}
							} else if (epgEvent.startTime < cachedEvents[epgEvent.serviceId][i].endTime) {
								cachedEvents[epgEvent.serviceId].splice(i, 0, epgEvent);
								isCached = true;
							}
						}
						if (eventsToRemove.length > 0) {
							for (i = eventsToRemove.length - 1; i >= 0; i--) {
								cachedEvents[epgEvent.serviceId].splice(eventsToRemove[i], 1);
							}
						}
					}
					if (callback) {
						callback(true);
					}

				},

				/**
				 * Adds an array of events to the event cache
				 * @method cacheEvents
				 * @param {Array} events
				 */
				cacheEvents: function (events) {
					var i;
					for (i = 0; i < events.length; i++) {
						this.cacheEvent(events[i]);
					}
				},

				/**
				 * Adds the given service to the service cache
				 * @method cacheService
				 * @param {Object} service
				 * @param {Function} callback Called after service is cached
				 */
				cacheService: function (service, callback) {
					var serviceIndex = getCachedServiceIndex(service);

					if (serviceIndex === -1) {
						cachedServices.push(service);
					} else {
						cachedServices[serviceIndex] = service;
					}
					if (callback) {
						callback(true);
					}
				},

				/**
				 * Returns the cached services
				 * @method getServices
				 * @return {Array} Service objects
				 */
				getServices: function () {
					return cachedServices;
				},

				/**
				 * Calls the callback with the cached services
				 * @method fetchServices
				 * @async
				 * @param {Function} callback
				 */
				fetchServices: function (callback) {
					var me = this;
					setTimeout(function () {
						callback(me.getServices());
					}, 1);
				},

				/**
				 * Updates the cached service for the given serviceId with
				 * the given service object
				 * @method updateService
				 * @param {Number} serviceId
				 * @param {Object} service
				 */
				updateService: function (serviceId, service) {
					var servicesLength = cachedServices.length,
						i;

					for (i = 0; i < servicesLength; i++) {
						if (cachedServices[i].serviceId === serviceId) {
							cachedServices[i] = service;
							break;
						}
					}
				},

				/**
				 *Returns the event with the specified event id
				 * @method getEventById
				 * @param {String} eventId
				 * @return {Object} EPGEvent
				 */
				getEventById: function (eventId) {
					var eventsLength,
						serviceId,
						i;
					for (serviceId in cachedEvents) {
						if (cachedEvents.hasOwnProperty(serviceId)) {
							eventsLength = cachedEvents[serviceId].length;
							for (i = 0; i < eventsLength; i++) {
								if (cachedEvents[serviceId][i].eventId === eventId) {
									return cachedEvents[serviceId][i];
								}
							}
						}
					}
					return null;
				},

				/**
				 * Calls the callback with the event that has the given event id
				 * @method fetchEventById
				 * @async
				 * @param {String} eventId
				 * @param {Function} callback
				 */
				fetchEventById: function (eventId, callback) {
					var me = this;
					setTimeout(function () {
						callback(me.getEventById(eventId));
					}, 1);
				},

				/**
				 * Returns the event currently showing on the specified service
				 * @method getEventCurrent
				 * @param {String} serviceId
				 * @return {Object} EPGEvent
				 */
				getEventCurrent: function (serviceId) {
					var now = new Date().getTime(),
						i,
						eventsLength,
						eventsForService;
					if (!cachedEvents[serviceId]) {
						return null;
					}
					eventsForService = cachedEvents[serviceId];
					eventsLength = eventsForService.length;
					for (i = 0; i < eventsLength; i++) {
						if (eventsForService[i].startTime <= now && eventsForService[i].endTime > now) {
							return eventsForService[i];
						}
					}
					return null;
				},

				/**
				 * Calls the callback with the event currently showing on the specified service
				 * @method fetchEventCurrent
				 * @async
				 * @param {String} serviceId
				 * @param {Function} callback
				 */
				fetchEventCurrent: function (serviceId, callback) {
					var me = this;
					setTimeout(function () {
						callback(me.getEventCurrent(serviceId));
					}, 1);
				},

				/**
				 * Returns the event showing immediately after a specified event on the same service
				 * @method getEventNext
				 * @param {String} eventId
				 * @return {Object} EPGEvent
				 */
				getEventNext: function (eventId) {
					var i,
						event = this.getEventById(eventId),
						serviceId,
						eventsForService,
						eventsLength;
					if (!event) {
						return null;
					}

					serviceId = event.serviceId;
					eventsForService = cachedEvents[serviceId];
					eventsLength = eventsForService.length;
					for (i = 0; i < eventsLength; i++) {
						if (eventsForService[i].startTime === event.endTime) {
							return eventsForService[i];
						}
					}
					return null;
				},

				/**
				 * Calls the callback with the event showing immediately after a specified event on the same service
				 * @method fetchEventNext
				 * @async
				 * @param {String} eventId
				 * @param {Function} callback
				 */
				fetchEventNext: function (serviceId, callback) {
					var event,
						eventId = null,
						me = this;

					event = this.getEventCurrent(serviceId);

					if (event) {
						eventId = event.eventId;
					}

					setTimeout(function () {
						callback(me.getEventNext(eventId));
					}, 1);
				},

				/**
				 * Returns the event showing immediately before a specified event on the same service
				 * @method getEventPrevious
				 * @param {String} eventId
				 * @return {Object} EPGEvent
				 */
				getEventPrevious: function (eventId) {
					var i,
						event = this.getEventById(eventId),
						serviceId,
						eventsForService,
						eventsLength;
					if (!event) {
						return null;
					}
					serviceId = event.serviceId;
					eventsForService = cachedEvents[serviceId];
					eventsLength = eventsForService.length;
					for (i = 0; i < eventsLength; i++) {
						if (eventsForService[i].endTime === event.startTime) {
							return eventsForService[i];
						}
					}
					return null;
				},

				/**
				 * Calls the callback with the event showing immediately before a specified event on the same service
				 * @method fetchEventPrevious
				 * @async
				 * @param {String} eventId
				 * @param {Function} callback
				 */
				fetchEventPrevious: function (eventId, callback) {
					var me = this;
					setTimeout(function () {
						callback(me.getEventPrevious(eventId));
					}, 1);
				},

				/**
				 * Returns an array of events for the given service ids that are showing between the
				 * given time window
				 * @method getEventsByWindow
				 * @param {Array} serviceIds
				 * @param {Number} startTime
				 * @param {Number} endTime
				 * @return {Array} Array of EPGEvent objects
				 */
				getEventsByWindow: function (serviceIds, startTime, endTime) {
					var i,
						j,
						serviceId,
						eventsForService,
						event,
						eventsInWindow = [];
					if (startTime === undefined || startTime === null ||
							endTime === undefined || endTime === null ||
							isNaN(startTime) || isNaN(endTime)) {
						return null;
					}
					for (i = 0; i < serviceIds.length; i++) {
						serviceId = serviceIds[i];
						eventsForService = cachedEvents[serviceId];
						if (eventsForService) {
							for (j = 0; j < eventsForService.length; j++) {
								event = eventsForService[j];
								if (event.endTime > startTime && event.startTime < endTime) {
									eventsInWindow.push(event);
								} else if (event.startTime > endTime) {
									break;
								}
							}
						}
					}
					return eventsInWindow;
				},

				/**
				 * Calls the callback with an array of events for the given service ids that are showing between the
				 * given time window
				 * @method fetchEventsByWindow
				 * @async
				 * @param {Array} serviceIds
				 * @param {Number} startTime
				 * @param {Number} endTime
				 * @param {Function} callback
				 */
				fetchEventsByWindow: function (serviceIds, startTime, endTime, callback) {
					var cachedEvents,
						me = this;
					setTimeout(function () {
						//TODO: Remove - added for testing only
						var i;
						cachedEvents = me.getEventsByWindow(serviceIds, startTime, endTime);
							if (cachedEvents) {
								callback(cachedEvents);
							} else {
								callback([]);
							}
						//END TODO
						//callback(me.getEventsByWindow(serviceIds, startTime, endTime));
					}, 1);
				},

				/**
				 * Returns an array of events that match the given query array.
				 * @method getEventsByQuery
				 * @param {Array} queryArray an array of query objects each of which contains
				 * the following properties:
				 *
				 *     property
				 *     value
				 *     comparison
				 *     exclusivity
				 * @return {Array} Array of EPGEvent objects
				 */
				getEventsByQuery: function (queryArray) {
					//TODO: convert queryArray to a query and search
				},

				/**
				 * Removes the event with the given event id from the cache
				 * @method removeEvent
				 * @param {String} eventId
				 */
				removeEvent: function (eventId) {
					var event,
						eventsLength,
						serviceId,
						i;
					for (serviceId in cachedEvents) {
						if (cachedEvents.hasOwnProperty(serviceId)) {
							eventsLength = cachedEvents[serviceId].length;
							for (i = 0; i < eventsLength; i++) {
								if (cachedEvents[serviceId][i] && cachedEvents[serviceId][i].eventId === eventId) {
									cachedEvents[serviceId].splice(i, 1);
									break;
								}
							}
						}
					}
				},

				/**
				 * Removes events older than a specified time from the cache
				 * @method removeEventsOlderThan
				 * @param {Number} time time in milliseconds as returned by the `Date` object's `getTime` method.
				 * @param {Function} [callback=null] the function that will be called after the delete operation. This function will
				 * receive either the number of events removed or false (if no events were removed).
				 */
				removeEventsOlderThan: function (time, callback) {
					var event,
						eventsLength,
						serviceId,
						i;
					if (time) {
						for (serviceId in cachedEvents) {
							if (cachedEvents.hasOwnProperty(serviceId)) {
								eventsLength = cachedEvents[serviceId].length;
								for (i = eventsLength - 1; i >= 0; i--) {
									if (cachedEvents[serviceId][i] && cachedEvents[serviceId][i].endTime < time) {
										cachedEvents[serviceId].splice(i, 1);
									}
								}
							}
						}
					} else if (callback) {
						callback(false);
					}
				},

				/**
				 * Removes the service with the given service id from the cache
				 * @method removeService
				 * @param {String} serviceId
				 */
				removeService: function (serviceId) {
					var servicesLength = cachedServices.length,
						i;
					for (i = 0; i < servicesLength; i++) {
						if (cachedServices[i].serviceId === serviceId) {
							cachedServices.splice(i, 1);
							break;
						}
					}
				},

				/**
				 * Removes all services and events from the cache
				 * @method clearCache
				 */
				clearCache: function () {
					cachedServices = [];
					cachedEvents = {};
				},

				/**
				 * Registers a callback to be invoked when the `EPGServicesUpdated` event is fired
				 * @method addEPGServicesUpdatedListener
				 * @param {Function} listener
				 */
				addEPGServicesUpdatedListener: function (listener) {

				},

				/**
				 * Removes a callback previously registered for the `EPGServicesUpdated` event
				 * @method removeEPGServicesUpdatedListener
				 * @param {Function} listener
				 */
				removeEPGServicesUpdatedListener: function (listener) {

				}
			};
		}());
		return $N.platform.btv.EPGCache;
	}
);
