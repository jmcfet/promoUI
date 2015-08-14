/**
 * This class contains the logic for storing and retrieving EPG data to/from a database.
 * @class $N.platform.btv.PersistentCache
 * @requires $N.data.EPGEvent
 * @requires $N.data.EPGService
 * @requires $N.platform.btv.EPGServiceFactory
 * @requires $N.platform.btv.EPGEventFactory
 * @requires $N.services.sdp.Ratings
 * @singleton
 *
 * @author Gareth Stacey
 */

/*global CCOM*/

define('jsfw/platform/btv/PersistentCache',
	[
		'jsfw/data/EPGEvent',
		'jsfw/data/EPGService',
		'jsfw/platform/btv/EPGServiceFactory',
		'jsfw/platform/btv/EPGEventFactory',
		'jsfw/services/sdp/Ratings'
	],
	function (EPGEvent, EPGService, EPGServiceFactory, EPGEventFactory, Ratings) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.btv = $N.platform.btv || {};

		$N.platform.btv.PersistentCache = (function () {
			var addServiceCallbackLookup = {},
				addEventCallbackLookup = {},
				removeEventCallbackLookup = {},
				removeExpiredEventsCallbackLookup = {},
				removeServiceCallbackLookup = {};

			/**
			 * This method maps SDP service types to EPG service types
			 * @method getServiceTypeEnum
			 * @private
			 * @param channel {Object} Channel object. Should be a channel returned by SDP
			 * @return {Number}
			 */
			function getServiceTypeEnum(channel) {
				switch (channel.type) {
				case "BTV":
					return $N.data.EPGService.SERVICE_TYPE.TV;
				case "RADIO":
					return $N.data.EPGService.SERVICE_TYPE.RADIO;
				default:
					return $N.data.EPGService.SERVICE_TYPE.OTHER;
				}
			}

			/**
			 * Returns an object that conforms to the DB Event schema
			 * @method getInMappedEvent
			 * @param {Object} eventObject Event object to be mapped to schema
			 * @return {Object}
			 */
			function getInMappedEvent(eventObject) {
				var mappedObj = {};
					// NA = "N/A";
				if (eventObject.hasOwnProperty("eit_info_short_desc")) { // GATEWAY
					mappedObj.eventId = eventObject.eit_info_event_id;
					mappedObj.serviceId = eventObject.sid;
					mappedObj.sourceId = $N.data.EPGEvent.SOURCE.GATEWAY;
					mappedObj.startTime = eventObject.eit_info_start_time_gmt;
					mappedObj.endTime = eventObject.eit_info_start_time_gmt + eventObject.eit_info_duration;
					mappedObj.title = eventObject.eit_info_event_name;
					mappedObj.shortDesc = eventObject.eit_info_short_desc;
					mappedObj.parentalRating = eventObject.eit_info_private_rating;
					mappedObj.privateRating = eventObject.eit_info_private_rating;
					/*mappedObj.broadcastOnId = NA;
					mappedObj.broadcastTsId = NA;
					mappedObj.broadcastServiceId = NA;
					mappedObj.broadcastEventId = NA;
					mappedObj.runningStatus = NA;
					mappedObj.scrambledStatus = NA;
					mappedObj.longDesc = null;
					mappedObj.contentDesc = null;
					mappedObj.naspBlackout = null;
					mappedObj.naspCA = null;
					mappedObj.naspPPV = null;
					mappedObj.zoneSelect = null;*/
				} else if (eventObject.eventId) { // MDS
					mappedObj.eventId = eventObject.id.toString();
					mappedObj.serviceId = eventObject.serviceRef.toString();
					mappedObj.sourceId = $N.data.EPGEvent.SOURCE.MDS;
					mappedObj.startTime = eventObject.period.start * 1000;
					mappedObj.endTime = eventObject.period.end * 1000;
					mappedObj.title = eventObject.Title;
					mappedObj.shortDesc = eventObject.Description;
					mappedObj.longDesc = eventObject.Synopsis;
					mappedObj.parentalRating = eventObject.Rating.precedence;
					mappedObj.privateRating = eventObject.Rating.precedence;
				} else { //SDP
					mappedObj.eventId = eventObject.uid.toString();
					mappedObj.serviceId = eventObject.channelUID.toString();
					mappedObj.sourceId = $N.data.EPGEvent.SOURCE.SDP;
					mappedObj.startTime = eventObject.startTime;
					mappedObj.endTime = eventObject.endTime;
					mappedObj.title = eventObject.eventName;
					mappedObj.shortDesc = eventObject.shortDescription;
					mappedObj.longDesc = eventObject.shortDescription;
					mappedObj.parentalRating = eventObject.eventRating;
					mappedObj.privateRating = eventObject.eventRating;
					/*mappedObj.broadcastOnId = NA;
					mappedObj.broadcastTsId = NA;
					mappedObj.broadcastServiceId = NA;
					mappedObj.broadcastEventId = NA;
					mappedObj.runningStatus = NA;
					mappedObj.scrambledStatus = NA;
					mappedObj.contentDesc = null;
					mappedObj.naspBlackout = null;
					mappedObj.naspCA = null;
					mappedObj.naspPPV = null;
					mappedObj.zoneSelect = null;*/
				}
				return mappedObj;
			}

			/**
			 * Returns an object that conforms to the DB Service schema
			 * @method getInMappedService
			 * @param {Object} serviceObject Service object from to be mapped to schema
			 * @return {Object}
			 */
			function getInMappedService(serviceObject) {
				var mappedObj = {},
					drmId = serviceObject.drmID,
					NA = "N/A";
				if (serviceObject.sid) { // GATEWAY
					mappedObj.serviceId = serviceObject.sid;
					mappedObj.type = $N.data.EPGService.SERVICE_TYPE.TV;
					mappedObj.name = serviceObject.sn;
					mappedObj.uri = NA;
					/*mappedObj.broadcastOnId = NA;
					mappedObj.broadcastTsId = NA;
					mappedObj.broadcastServiceId = NA;
					mappedObj.eitpfPresent = NA;
					mappedObj.eitsPresent = NA;
					mappedObj.runningStatus = NA;
					mappedObj.scrambledStatus = NA;
					mappedObj.providerName = null;
					mappedObj.content = null;
					mappedObj.naspCA = null;
					mappedObj.channelKey = null;
					mappedObj.uriBlackoutAlternate = null;
					mappedObj.telephoneInfo = null;
					mappedObj.contactInfo = null;
					mappedObj.zoneSelect = null;
					mappedObj.remoteControlKeyId = null;*/
				} else if (serviceObject.mainContentUID) { // SDP 3.4
					mappedObj.serviceId = serviceObject.mainContentUID;
					mappedObj.channelKey = serviceObject.number;
					mappedObj.name = serviceObject.name;
					if (drmId) {
					    mappedObj.uri = serviceObject.networkLocation + "?sdp_prm_id=" + drmId;
					} else {
						mappedObj.uri = serviceObject.networkLocation;
					}
					mappedObj.providerName = serviceObject.name;
					mappedObj.type = $N.data.EPGService.SERVICE_TYPE.TV;
				} else if (serviceObject.editorial) { // MDS
					mappedObj.serviceId = serviceObject.editorial.id;
					mappedObj.channelKey = serviceObject.editorial.tvChannel;
					mappedObj.name = serviceObject.technical.Title;
					if (drmId) {
					    mappedObj.uri = serviceObject.technical.NetworkLocation + "?sdp_prm_id=" + drmId;
					} else {
						mappedObj.uri = serviceObject.technical.NetworkLocation;
					}
					mappedObj.providerName = serviceObject.editorial.provider;

					mappedObj.type = $N.data.EPGService.SERVICE_TYPE.TV;
				} else { // SDP 3.1
					mappedObj.serviceId = serviceObject.uid.toString();
					mappedObj.uri = serviceObject.networkLocation;
					mappedObj.type = getServiceTypeEnum(serviceObject);
					mappedObj.name = serviceObject.name;
					mappedObj.providerName = serviceObject.name;
					mappedObj.channelKey = serviceObject.number;
					/*mappedObj.broadcastOnId = null;
					mappedObj.broadcastTsId = null;
					mappedObj.broadcastServiceId = null;
					mappedObj.eitpfPresent = null;
					mappedObj.eitsPresent = null;
					mappedObj.runningStatus = null;
					mappedObj.scrambledStatus = null;
					mappedObj.content = null;
					mappedObj.naspCA = null;
					mappedObj.uriBlackoutAlternate = null;
					mappedObj.telephoneInfo = null;
					mappedObj.contactInfo = null;
					mappedObj.zoneSelect = null;
					mappedObj.remoteControlKeyId = null;
					mappedObj.merlinAccessCriteria = null;*/
				}
				return mappedObj;
			}

			/**
			 * Store information in the ServiceTag table for attributes like 'rating' and 'promoImage'
			 * that are not available in the CCOM EPG schema
			 * @method tagMappedService
			 * @private
			 * @async
			 * @param {Object} mappedServiceObject the service object
			 */
			function tagMappedService(mappedServiceObject) {
				var serviceId;

				// The only difference between SDP 3.4 and other versions is that for 3.4, we store
				// only the technical channel, and therefore need to store the mainContentUID as serviceId
				if (mappedServiceObject.mainContentUID) {
					serviceId = mappedServiceObject.mainContentUID.toString();
				} else if (mappedServiceObject.editorial) {
					serviceId = mappedServiceObject.editorial.id;
				} else {
					serviceId = mappedServiceObject.uid.toString();
				}
				if (mappedServiceObject.ratingID) {
					CCOM.EPG.tagService(serviceId, "rating", String(mappedServiceObject.ratingID));
				}
				if (mappedServiceObject.promoImage) {
					CCOM.EPG.tagService(serviceId, "promoImage", mappedServiceObject.promoImage);
				} else if (mappedServiceObject.technical && mappedServiceObject.technical.PromoImages && mappedServiceObject.technical.PromoImages.length) {
					CCOM.EPG.tagService(serviceId, "promoImage", mappedServiceObject.technical.PromoImages[0]);
				}
				if (mappedServiceObject.locale) {
					CCOM.EPG.tagService(serviceId, "locale", mappedServiceObject.locale);
				}
			}

			function fireCallback(handle, lookup, param) {
				if (handle && lookup[handle]) {
					lookup[handle](param);
				}
				lookup[handle] = null;
			}

			function addServiceOKListener(e) {
				fireCallback(e.handle, addServiceCallbackLookup, true);
			}

			function addServiceFailedListener(e) {
				fireCallback(e.handle, addServiceCallbackLookup, false);
			}

			function addEventOKListener(e) {
				fireCallback(e.handle, addEventCallbackLookup, true);
			}

			function addEventFailedListener(e) {
				fireCallback(e.handle, addEventCallbackLookup, false);
			}

			function removeEventOKListener(e) {
				fireCallback(e.handle, removeEventCallbackLookup, 1);
			}

			function removeEventFailedListener(e) {
				fireCallback(e.handle, removeEventCallbackLookup, false);
			}

			function removeExpiredEventsOKListener(e) {
				fireCallback(e.handle, removeExpiredEventsCallbackLookup, true);
			}

			function removeExpiredEventsFailedListener(e) {
				fireCallback(e.handle, removeExpiredEventsCallbackLookup, false);
			}

			function removeServiceOKListener(e) {
				fireCallback(e.handle, removeServiceCallbackLookup, 1);
			}

			function removeServiceFailedListener(e) {
				fireCallback(e.handle, removeServiceCallbackLookup, false);
			}

			return {

				/**
				 * Should be called prior to using the PersistentCache class.
				 * Will check if a database is available and set it up ready for data storage and retrieval.
				 * @method init
				 */
				init: function () {
					CCOM.EPG.addEventListener("addServiceOK", addServiceOKListener, false);
					CCOM.EPG.addEventListener("addServiceFailed", addServiceFailedListener, false);
					CCOM.EPG.addEventListener("addEventOK", addEventOKListener, false);
					CCOM.EPG.addEventListener("addEventFailed", addEventFailedListener, false);
					CCOM.EPG.addEventListener("removeEventOK", removeEventOKListener, false);
					CCOM.EPG.addEventListener("removeEventFailed", removeEventFailedListener, false);
					CCOM.EPG.addEventListener("removeExpiredEventsOK", removeExpiredEventsOKListener, false);
					CCOM.EPG.addEventListener("removeExpiredEventsFailed", removeExpiredEventsFailedListener, false);
					CCOM.EPG.addEventListener("removeServiceOK", removeServiceOKListener, false);
					CCOM.EPG.addEventListener("removeServiceFailed", removeServiceFailedListener, false);
				},

				/**
				 * Adds the given service to the service cache
				 * @method cacheService
				 * @async
				 * @param {Object} serviceToAdd the EPG service that's to be cached
				 * @param {Function} callback function that's to be called back when the service has been
				 * cached successfully
				 */
				cacheService: function (serviceToAdd, callback) {
					if (serviceToAdd) {
						var service = getInMappedService(serviceToAdd._data),
							handle = CCOM.EPG.addService(service, 1);
						addServiceCallbackLookup[handle] = function (addedSuccessfully) {
							if (addedSuccessfully) { // attempt to tag additional properties only if service was cached successfully
								tagMappedService(serviceToAdd._data);
							}
							callback(addedSuccessfully);
						};
					}
				},

				/**
				 * Adds the given event to the event cache
				 * @method cacheEvent
				 * @async
				 * @param {Object} eventToAdd the EPG event that's to be cached
				 * @param {Function} callback function that's to be called back when the event has been
				 * cached successfully
				 */
				cacheEvent: function (eventToAdd, callback) {
					if (eventToAdd) {
						var event = getInMappedEvent(eventToAdd._data),
							handle = CCOM.EPG.addEvent(event, 1);
						addEventCallbackLookup[handle] = callback;
					}
				},

				/**
				 * Adds an array of events to the event cache
				 * @method cacheEvents
				 * @param {Array} events
				 */
				cacheEvents: function (events) {
					var i,
						doNothing = function () {};
					for (i = 0; i < events.length; i++) {
						this.cacheEvent(events[i], doNothing);
					}
				},

				/**
				 * Returns the cached services
				 * @method getServices
				 * @return {Array} array of EPG services
				 */
				getServices: function () {
					var resultSet,
						resultArray;
					resultSet = CCOM.EPG.getServicesRSByQuery("*", null, null);
					resultArray = resultSet.getNext(999);
					resultSet.reset();
					resultSet = null;
					return resultArray;
				},

				/**
				 * Returns the cached services
				 * @method fetchServices
				 * @async
				 * @param {Function} callback function that will be called with the array of service objects
				 */
				fetchServices: function (callback) {
					var me = this;
					setTimeout(function () {
						callback(me.getServices());
					}, 1);
				},

				/**
				 * If the given service.serviceId exists then this record will be overwritten by the given service object
				 * otherwise the service object will be added to the cache as a new record
				 * @method updateService
				 * @async
				 * @param {Number} serviceId
				 * @param {Object} service
				 * @param {Function} callback function that will be called once the service has been updated
				 */
				updateService: function (serviceId, service, callback) {
					this.cacheService(service, callback);
				},

				/**
				 * Returns the event with the specified event id
				 * @method getEventById
				 * @param {String} eventId
				 * @return {Object} EPG event
				 */
				getEventById: function (eventId) {
					return CCOM.EPG.getEventById(eventId);
				},

				/**
				 * Returns the event with the specified event id
				 * @method fetchEventById
				 * @async
				 * @param {String} eventId
				 * @param {Function} callback function that will be called with the desired EPG event
				 */
				fetchEventById: function (eventId, callback) {
					setTimeout(function () {
						callback(CCOM.EPG.getEventById(eventId));
					}, 1);
				},

				/**
				 * Returns the event currently showing on the specified service
				 * @method getEventCurrent
				 * @param {String} serviceId
				 * @return {Object} the current event
				 */
				getEventCurrent: function (serviceId) {
					return CCOM.EPG.getEventCurrent(serviceId);
				},

				/**
				 * Returns the event currently showing on the specified service
				 * @method fetchEventCurrent
				 * @async
				 * @param {String} serviceId
				 * @param {Function} callback function that will be called with the current event
				 */
				fetchEventCurrent: function (serviceId, callback) {
					setTimeout(function () {
						callback(CCOM.EPG.getEventCurrent(serviceId));
					}, 1);
				},

				/**
				 * Returns the event showing immediately after a specified event on the same service
				 * @method getEventNext
				 * @param {String} eventId id of the event in question
				 * @return {Object} EPG event
				 */
				getEventNext: function (eventId) {
					return CCOM.EPG.getEventNext(eventId);
				},

				/**
				 * Returns the event showing immediately after a specified event on the same service
				 * @method fetchEventNext
				 * @async
				 * @param {String} eventId
				 * @param {Function} callback function that will be called with the next event or null (if no such
				 * event is found)
				 */
				fetchEventNext: function (eventId, callback) {
					setTimeout(function () {
						callback(CCOM.EPG.getEventNext(eventId));
					}, 1);
				},

				/**
				 * Returns the event showing immediately before a specified event on the same service
				 * @method getEventPrevious
				 * @param {String} eventId id of the event in question
				 * @return {Object} EPG event
				 */
				getEventPrevious: function (eventId) {
					return CCOM.EPG.getEventPrevious(eventId);
				},

				/**
				 * Returns the event showing immediately before a specified event on the same service
				 * @method fetchEventPrevious
				 * @param {String} eventId
				 * @param {Function} callback function that will be called with the previous event or null (if no such
				 * event is found)
				 */
				fetchEventPrevious: function (eventId, callback) {
					setTimeout(function () {
						callback(CCOM.EPG.getEventPrevious(eventId));
					}, 1);
				},

				/**
				 * Returns an array of events for the given service ids scheduled to show in the
				 * given time window
				 * @method getEventsByWindow
				 * @param {Array} serviceIds
				 * @param {Number} startTime
				 * @param {Number} endTime
				 * @return {Array} an array of EPG events
				 */
				getEventsByWindow: function (serviceIds, startTime, endTime) {
					return CCOM.EPG.getEventsByWindow(serviceIds, startTime, endTime);
				},

				/**
				 * Returns an array of events for the given service ids scheduled to show in the
				 * given time window
				 * @method fetchEventsByWindow
				 * @async
				 * @param {Array} serviceIds
				 * @param {Number} startTime
				 * @param {Number} endTime
				 * @param {Function} callback function that will be called with the array of events or an empty
				 * array (if no matching events are found)
				 */
				fetchEventsByWindow: function (serviceIds, startTime, endTime, callback) {
					setTimeout(function () {
						callback(CCOM.EPG.getEventsByWindow(serviceIds, startTime, endTime));
					}, 1);
				},

				/**
				 * Removes the event with the given event id from the cache
				 * @method removeEvent
				 * @async
				 * @param {String} eventId
				 * @param {Function} [callback=null] function that will be called after the delete operation has been
				 * performed. The number of rows deleted will be passed in to this callback if the delete was
				 * successful, or a Boolean false if it wasn't.
				 */
				removeEvent: function (eventId, callback) {
					if (eventId) {
						var handle = CCOM.EPG.removeEvent(eventId);
						removeEventCallbackLookup[handle] = callback;
					}
				},

				/**
				 * Removes events older than a specified time from the cache
				 * @method removeEventsOlderThan
				 * @async
				 * @param {Number} time time in milliseconds as returned by the `Date` object's `getTime` method.
				 * @param {Function} [callback=null] the function that will be called after the delete operation. This function will
				 * receive true if successful or false if it fails.
				 */
				removeEventsOlderThan: function (time, callback) {
					if (time) {
						var handle = CCOM.EPG.removeExpiredEvents(time);
						removeExpiredEventsCallbackLookup[handle] = callback;
					}
				},

				/**
				 * Removes the service with the given service id from the cache
				 * @method removeService
				 * @async
				 * @param {String} serviceId
				 * @param {Function} [callback=null] function that will be called after the delete operation has been
				 * performed. The number of rows deleted will be passed in to this callback if the delete was
				 * successful, or a Boolean false if it wasn't.
				 */
				removeService: function (serviceId, callback) {
					if (serviceId) {
						var handle = CCOM.EPG.removeService(serviceId);
						removeServiceCallbackLookup[handle] = callback;
					}
				},

				/**
				 * Removes all services and events from the cache
				 * @method clearCache
				 * @async
				 * @param {Function} [callback=null] function that will be called after the cache has been cleared
				 */
				clearCache: function (callback) {
					//TODO
				},

				/**
				 * Determines whether the persistent cache database is available
				 * @method isDBAvailable
				 * @return {Boolean} true if the cache database is available, false otherwise
				 */
				isDBAvailable: function () {
					return CCOM.EPG ? true : false;
				},

				/**
				 * Registers a callback to be invoked when the `EPGServicesUpdated` event is fired
				 * @method addEPGServicesUpdatedListener
				 * @param {Function} listener
				 */
				addEPGServicesUpdatedListener: function (listener) {
					CCOM.EPG.addEventListener("servicesUpdated", listener, false);
				},

				/**
				 * Removes a callback previously registered for the `EPGServicesUpdated` event
				 * @method removeEPGServicesUpdatedListener
				 * @param {Function} listener
				 */
				removeEPGServicesUpdatedListener: function (listener) {
					CCOM.EPG.removeEventListener("servicesUpdated", listener);
				}
			};
		}());
		return $N.platform.btv.PersistentCache;
	}
);
