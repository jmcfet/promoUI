/**
 * This class fetches start-over TV events from the SDP back-end using the HUE interface.
 *
 * Usage:
 * <ol>
 *  <li>Include this file in the top level window and call `$N.services.sdp.StartOver.init()` after successfully
 * signing-on.</li>
 *  <li>Call `$N.services.sdp.StartOver.getSOEvents()` to fetch the list of SO/CU events for the current time window (48 hours).</li>
 *  <li>Alternatively call `$N.services.sdp.StartOver.getSOEventForServiceAndTime()` to get SO/CU Events for specific services at specific times</li>
 * </ol>
 *
 * @class $N.services.sdp.StartOver
 * @static
 * @singleton
 * @author Gareth Stacey
 * @requires $N.apps.core.Log
 * @requires $N.services.sdp.ServiceFactory
 * @requires $N.platform.btv.EPG
 */

/* global define */
define('jsfw/services/sdp/StartOver',
	[
		'jsfw/apps/core/Log',
		'jsfw/services/sdp/ServiceFactory',
		'jsfw/platform/btv/EPG'
	],
	function (Log, ServiceFactory, EPG) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};

		$N.services.sdp.StartOver = (function () {
			/*
			 * =================================================== Private Functions
			 * ===================================================
			 */

			var log = new $N.apps.core.Log("sdp", "StartOver");

			// constants

			/**
			 * how often we re-fetch the list of SO events (hrs)
			 * @property {Number} FETCH_INTERVAL_HRS
			 * @private
			 */
			var FETCH_INTERVAL_HRS = 1;

			/**
			 * how far into the past we should fetch so events (hrs)
			 * @property {Number} FETCH_PAST_HRS
			 * @private
			 */
			var FETCH_PAST_HRS = 0;

			/**
			 * How far into the future we should fetch so events (hrs)
			 * @property {Number} FETCH_FUTURE_HRS
			 * @private
			 */
			var FETCH_FUTURE_HRS = 48;

			/**
			 * Length of time to wait before retrying a fetch if the call to the service
			 * fails (minutes)
			 * @property {Number} FETCH_RETRY_INTERVAL_MINS
			 * @private
			 */
			var FETCH_RETRY_INTERVAL_MINS = 60;

			// StartOver states

			/**
			 * Uninitialised - no SO events are available
			 * @property {Number} STATE_UNINITIALISED
			 * @private
			 */
			var STATE_UNINITIALISED = 0;

			/**
			 * Fetching SO events. SO events are still not available
			 * @property {Number} STATE_FETCHING
			 * @private
			 */
			var STATE_FETCHING = 1;

			/**
			 * Fetch is complete and SO events are available for the current services
			 * @property {Number} STATE_READY
			 * @private
			 */
			var STATE_READY = 2;

			/**
			 * Re-fetching SO events. calling `getSOEvents()` during this state returns stale data
			 * @property {Number} STATE_REFETCHING
			 * @private
			 */
			var STATE_REFETCHING = 3;

			/**
			 * delay between responding to CCOM.EPGServicesUpdated events. if more than 1
			 * event fires in less than this delay then only the last event will be responded to
			 * @property {Number} SERVICES_UPDATED_DELAY
			 * @private
			 */
			var SERVICES_UPDATED_DELAY = 3000;

			// variables

			/**
			 * Associative array eventIds to SO EPGEvents
			 * @property {Object} soEvents
			 * @private
			 */
			var soEvents = null;

			/**
			 * state of fetching SO events
			 * @property {Number} state
			 * @private
			 */
			var state = STATE_UNINITIALISED;

			/**
			 * timer used with SERVICES_UPDATED_DELAY to ensure multiple successive fetches are avoided
			 * @property {Object} fetchTimer
			 * @private
			 */
			var fetchTimer = null;

			/**
			 * Service used to fetch the SO events
			 * @property {Object} btvService
			 * @private
			 */
			var btvService = null;

			/**
			 * The locale to search SO events for
			 *
			 * @property {String} locale
			 * @private
			 */
			var locale = null;

			/**
			 * Success callback function for BTVService.getSOCUEventsByIdentifierTimeAndType method
			 *
			 * @method fetchSOEventsOK
			 * @private
			 * @param {Object} result The response returned from the service. This is a 2D array of services and their
			 *        related SO events
			 */
			var fetchSOEventsOK = function (result) {
				log("fetchSOEventsOK", "Enter - SO events retrieved successfully");

				soEvents = {};

				if (result) {
					soEvents = result;
				}

				state = STATE_READY;

				log("fetchSOEventsOK", "Exit");
			};

			/**
			 * Failure callback function for BTVService.getSOCUEventsByIdentifierTimeAndType method
			 *
			 * @method fetchSOEventsFail
			 * @private
			 * @param {String} reasonCode The reasonCode returned from the service
			 */
			var fetchSOEventsFail = function (reasonCode) {
				log("fetchSOEventsFail", "Failed to retrive SO events: " + reasonCode);
				var me = this;
				state = STATE_READY;
				// try to re-fetch in FETCH_RETRY_INTERVAL_MINS minutes
				setTimeout(me.fetchSOEvents, FETCH_RETRY_INTERVAL_MINS * 60 * 1000);
			};

			/**
			 * Asynchronously fetches the list of SO events using the BTVService
			 * getSOCUEventsByIdentifierTimeAndType
			 *
			 * @method fetchSOEvents
			 * @private
			 */
			var fetchSOEvents = function () {
				log("fetchSOEvents", "Enter");
				var me = this;
				if (soEvents) {
					state = STATE_REFETCHING;
				} else {
					state = STATE_FETCHING;
				}

				// define the time window for which we want SO events
				var fromDate = new Date().getTime() - FETCH_PAST_HRS * 60 * 60 * 1000;
				var toDate = new Date().getTime() + FETCH_FUTURE_HRS * 60 * 60 * 1000;

				// create a comma separated list of all service ids as required for the btvService call
				var serviceIdList = [];
				var ccomServices = $N.platform.btv.EPG.getAllChannels();
				var size = ccomServices.length;
				var i;
				var serviceToAdd;

				for (i = 0; i < size; i++) {
					serviceToAdd = ccomServices[i];
					if (serviceToAdd.isNPVR) {
						serviceIdList.push(serviceToAdd.serviceId);
					}
				}
				var serviceIds = serviceIdList.join(); // converts an array to a comma separated list

				// don't fetch if there aren't any serviceIds
				if (serviceIds) {
					// both IP and DVBC call
					btvService.getSOCUEventsByIdentifierTimeAndType(me, fetchSOEventsOK, fetchSOEventsFail, serviceIds,
							fromDate, toDate, "SO", locale);
				} else {
					log("fetchSOEvents", "No CCOM services found to fetch SOEvents for. Doing nothing!");
					state = STATE_READY;
				}
				log("fetchSOEvents", "Exit");
			};

			/**
			 * Event listener for EPGServicesUpdated events. calls fetchSOEvents if the StartOver.state is
			 * STATE_READY If this event fires more than once in less time than SERVICES_UPDATED_DELAY, then
			 * only the last event causes a call to fetchSOEvents
			 *
			 * @method epgServicesUpdated
			 * @private
			 * @param {Object} e The CCOM EPGServicesUpdated event
			 */
			var epgServicesUpdated = function (e) {
				log("epgServicesUpdated", "Enter");
				if (state === STATE_READY) {
					if (fetchTimer) {
						clearTimeout(fetchTimer);
					}
					fetchTimer = setTimeout(function () {
						fetchSOEvents();
					}, SERVICES_UPDATED_DELAY);
				}

				log("epgServicesUpdated", "Exit");
			};

			/*
			 * ===========Public API====================
			 */

			return {

				/**
				 * Initialises StartOver
				 *
				 * @method init
				 * @param {Object} [btvSvc=BTVService] The service used to fetch the SOEvents
				 * @param {String} [locale='en_gb'] The locale of the events to fetch
				 */
				init: function (btvSvc, locale) {
					log("init", "Enter");
					var me = this;
					// Don't allow StartOver to be initialised more than once
					if (state !== STATE_UNINITIALISED) {
						log("init", "The StartOver has already been initialised... doing nothing!");
						return;
					}

					btvService = btvSvc || $N.services.sdp.ServiceFactory.get("BTVService");
					locale = locale || "en_gb";
					fetchSOEvents();

					// register a listener to update the list of SO events every time EPG services change
					$N.platform.btv.EPG.registerRefreshCallback(epgServicesUpdated, this);

					// re-fetch the list of SO events every FETCH_INTERVAL_HRS
					setInterval(fetchSOEvents, FETCH_INTERVAL_HRS * 3600 * 1000);

					log("init", "Exit");
				},

				/**
				 * Get the list of SOEvents. This method returns the list already held by the StartOver and does not
				 * perform a fetch from the service
				 *
				 * @method getSOEvents
				 * @return {Object} The associative array of start-over events or null if a fetch has not returned
				 *         successfully, the StartOver has not been initialised or there are no SOEvents.
				 */
				getSOEvents: function () {
					log("getSOEvents", "Enter");

					if (state === STATE_UNINITIALISED) {
						log("getSOEvents", "Error: The StartOver must be initialised first!");
					}
					if (state === STATE_FETCHING) {
						log("getSOEvents", "Still fetching SOEvents try again later");
					}
					if (state === STATE_REFETCHING) {
						log("getSOEvents", "Re-fetching SOEvents. returning stale data");
					}

					log("getSOEvents", "Exit");
					return soEvents;
				},

				/**
				 * Method to return a Start Over event for the given service and on the given time.
				 * If no event is found null is returned
				 *
				 * @method getSOEventForServiceAndTime
				 * @param {Number} serviceId
				 * @param {Number} startTime The start time of the event we are looking for
				 * @param {Number} endTime The end time of the event we are looking for
				 * @return {Object} The event if found, null otherwise.
				 */
				getSOEventForServiceAndTime: function (serviceId, startTime, endTime) {
					log("getSOEventForServiceAndTime", "Enter");
					var i,
						soEvent = null,
						events;

					log("getSOEventForServiceAndStartTime", "Enter");

					if (state === STATE_UNINITIALISED) {
						log("getSOEventForServiceAndStartTime", "Error: The StartOver must be initialised first!");
					}
					if (state === STATE_FETCHING) {
						log("getSOEventForServiceAndStartTime", "Still fetching SOEvents try again later");
					}
					if (state === STATE_REFETCHING) {
						log("getSOEventForServiceAndStartTime", "Re-fetching SOEvents. returning stale data");
					}

					if (soEvents) {
						events = soEvents[serviceId];
						if (events) {
							for (i = 0; i < events.length; i++) {
								if (events[i].startTime === startTime) {
									if (!endTime) {
										soEvent = events[i];
										break;
									} else if (events[i].endTime === endTime) {
										soEvent = events[i];
										break;
									}
								}
							}
						}
					}
					log("getSOEventForServiceAndStartTime", "Exit");
					return soEvent;
				},

				/**
				 * Method to check if an event is a start over event
				 *
				 * @method isStartOverEvent
				 * @param {Number} serviceId
				 * @param {Object} event EPG Event to be checked. This should belong to the service.
				 * @return {Boolean} True if this event supports start over; false otherwise.
				 */
				isStartOverEvent: function (serviceId, event) {
					var tmpEvent = this.getSOEventForServiceAndTime(serviceId, event.startTime, event.endTime);
					return (tmpEvent !== null);
				},

				/**
				 * Sets the locale to be used when fetching data from the server.
				 * @method setLocale
				 * @param {String} localeToUse e.g. `en_gb`
				 */
				setLocale: function (localeToUse) {
					locale = localeToUse;
				}
			};
		}());
		return $N.services.sdp.StartOver;
	}
);