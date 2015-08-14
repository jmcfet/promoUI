/**
 * Utility class to aid with NPVR (SO and CU TV). This class also resolves the SDP eventUIds and
 * CCOM eventIds.
 * Usage:
 *  1. Include this file in the top level window and call `$N.services.sdp.Recordings.init()` after signing-on successfully.
 *  2. Call `$N.services.sdp.Recordings.fetchRecordings()` to fetch the list of recordings for the active
 * account/device. This should be called during activate and after successfully adding/removing a
 * recording
 *  3. Call `$N.services.sdp.Recordings.fetchEvents` for the window of events currently on screen. This should be
 * called each time the visible list of events on screen changes
 *  4. Call add/removeRecording passing the SDP or CCOM event. If add/removeRecording is called
 * with a CCOM event, the calling application must have already called fetchEvents so that
 * Recordings will have a reference to the SDP event. Failure to do so will result in an exception
 * being thrown.
 *
 * @class $N.services.sdp.Recordings
 * @static
 * @requires $N.apps.core.Log
 * @singleton
 * @author Sharif Macky
 * @requires $N.apps.core.Log
 */

/* global define */
define('jsfw/services/sdp/Recordings',
	[
		'jsfw/apps/core/Log'
	],
	function (Log) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};

		$N.services.sdp.Recordings = (function () {

			/*
			 * =================================================== Private
			 * ===================================================
			 */

			var log = new $N.apps.core.Log("sdp", "Recordings");

			var npvrEvents = {}, // the list of NPVR events returned from SDP indexed by CCOM eventId
				btvService,
				npvrService,
				locale;

			var fn;

			/**
			 * Interrogates an event to see whether it is a CCOM event based on whether it has a "seriesId"
			 * attribute
			 *
			 * @method isCCOMEvent
			 * @private
			 * @param {Object} event Object The event to check
			 * @return {boolean} True if the is a CCOM event, false otherwise
			 */
			var isCCOMEvent = function (event) {
				return event && event.seriesId !== undefined;
			};

			/**
			 * Returns the corresponding SDP event given a CCOM event.
			 *
			 * @method getQSPEvent
			 * @private
			 * @param {Object} ccomEvent Object The CCOM event
			 * @return {Object} The matching SDP event or null if the event is not within the current event
			 *         window from the last fetch
			 */
			var getQSPEvent = function (ccomEvent) {
				var qspEvent = null;
				var i;

				if (npvrEvents) {
					// get the list of npvrEvents (SDP events) on the same service as ccomEvent
					var events = npvrEvents[ccomEvent.serviceId];

					// the CCOM event matches the SDP event if service, start and end
					// times, are all the same
					if (events) {
						for (i = 0; i < events.length; i++) {
							if (events[i].startTime === ccomEvent.startTime && events[i].endTime === ccomEvent.endTime) {
								qspEvent = events[i];
								break;
							}
						}
					}
				}
				return qspEvent;
			};

			/**
			 * Returns the CCOM eventId and the corresponding SDP event object given a CCOM or SDP event
			 *
			 * @method getCCOMEventIdAndQSPEvent
			 * @private
			 * @param {Object} event Object A CCOM or SDP event
			 * @return {Object} Object contains CCOM eventId and the corresponding SDP event object
			 *         or null if a SDP event is passed which is not within the current event window from
			 *         the last fetch
			 */
			var getCCOMEventIdAndQSPEvent = function (event) {
				// we need the CCOM event id and SDP event object
				var qspEvent, eventId;
				if (isCCOMEvent(event)) {
					qspEvent = getQSPEvent(event);
					eventId = event.eventId;
				} else {
					// if we are passed a qspEvent then its event UID will be the same
					// as the CCOM event id. This is because the
					// EPGDataProvider creates the CCOM events using SDP events. This is
					// not true of DVB CCOM events ingested
					// through Lysis
					qspEvent = event;
					eventId = qspEvent.uid;
				}

				return qspEvent ? {
					ccomEventId: eventId,
					qspEvent: qspEvent
				} : null;
			};

			/*
			 * =================================================== Public API
			 * ===================================================
			 */

			var functions = {
				/**
				 * Marks the event to be recorded via CPVRoN by adding it to the account holders list of
				 * CPVRoN recordings stored on the server. It is the responsibility of the caller to ensure
				 * the event is of type CU and in the current event list returned from calling fetchEvents.
				 *
				 * @method addRecording
				 * @async
				 * @param {Object} event The event to add CCOM or SDP events are valid
				 * @param {Object} ctx The call context which will be used for the callback
				 * @param {Object} scb The success callback which will be called if the recording is added
				 *        successfully
				 * @param {Object} fcb The failure callback which will be called if the recording is not
				 *        added successfully
				 * @throws Exception If addRecording is called with invalid arguments
				 * @throws Exception If addRecording is called with a SDP event not in the current event
				 *         window from the last fetch or a SDP event which is not of type CU
				 */
				addRecording: function (event, ctx, scb, fcb) {
					var eventDetails = null;
					if (event) {
						eventDetails = getCCOMEventIdAndQSPEvent(event);
					}

					if (eventDetails) {
						if (/CU/.test(eventDetails.qspEvent.eventType)) {
							npvrService.setRecording(ctx, scb, fcb, eventDetails.ccomEventId, eventDetails.qspEvent.originKey,
									eventDetails.qspEvent.originID);

						} else {
							throw "Invalid SDP event passed. The event must be available for catchup. eventType should be SOCU or CU but was " + eventDetails.qspEvent.eventType;
						}
					} else {
						throw "Invalid SDP event passed. The event cannot be found in the current event window from the last fetch";
					}
				},

				/**
				 * Removes the event from the list of events marked to be recorded via CPVRoN on the server.
				 * It is the responsibility of the caller to ensure the event is of type CU and in the
				 * current event list returned from calling fetchEvents.
				 *
				 * @method removeRecording
				 * @async
				 * @param {Object} event The event to remove. CCOM or SDP events are valid
				 * @param {Object} ctx The call context which will be used for the callback
				 * @param {Object} scb The success callback which will be called if the recording is removed
				 *        successfully
				 * @param {Object} fcb The failure callback which will be called if the recording is not
				 *        removed successfully
				 * @throws Exception If removeRecording is called with invalid arguments
				 * @throws Exception If removeRecording is called with a SDP event not in the current event
				 *         window from the last fetch or a SDP event which is not of type CU
				 */
				removeRecording: function (event, ctx, scb, fcb) {
					var eventDetails = null;
					if (event) {
						eventDetails = getCCOMEventIdAndQSPEvent(event);
					}

					if (eventDetails) {
						if (/CU/.test(eventDetails.qspEvent.eventType)) {
							npvrService.cancelRecordingByAccAndDevice(ctx, scb, fcb, eventDetails.ccomEventId, eventDetails.qspEvent.originKey,
									eventDetails.qspEvent.originID);
						} else {
							throw "Invalid SDP event passed. The event must be of type catchup";
						}
					} else {
						throw "removeRecording called incorrectly. A valid event must be supplied. event=" + event;
					}
				},

				/**
				 * Fetches a matrix of NPVR events from the server for the given list of services and the
				 * given time window
				 *
				 * @method fetchEvents
				 * @async
				 * @param {Object} callerCtx The call context which will be used for the callback
				 * @param {Object} callerSCB The success callback which will be called if the fetch is successful
				 * @param {Object} callerFCB The failure callback which will be called if the fetch not successful
				 * @param {Object} lastRequest The arguments passed in to the previous request (null if first request)
				 * @throws Exception If fetchEvents is called with invalid arguments
				 */
				fetchEvents: (function () {
					var callerCtx, callerSCB, callerFCB, lastRequest;

					/**
					 * Success callback for fetchEvents. Calls back the registered function passing the list
					 * of npvrEvents in the form {ccomEventId, qspEvent}
					 *
					 * @method fetchEventsSCB
					 * @private
					 * @param {Object} result The result of the call returned from the service
					 */
					var fetchEventsSCB = function (result) {
						npvrEvents = result || {};

						// Return the list of NPVR events returned from SDP
						if (result) {
							callerSCB.apply(callerCtx, [ npvrEvents ]);
						}
					};

					/**
					 * Failure callback for fetchEvents. Calls back the registered function passing the
					 * failure code returned from the service
					 *
					 * @method fetchEventsFCB
					 * @private
					 * @param {Number} resultCode The result code returned from the service
					 */
					var fetchEventsFCB = function (resultCode) {
						npvrEvents = {};
						lastRequest = null;
						callerFCB.apply(callerCtx, [ resultCode ]);
					};

					return function (serviceList, startTime, endTime, type, ctx, scb, fcb) {
						if (serviceList && startTime && endTime && type) {
							// check if we have already (successfully) fetched using these
							// parameters before - if so return cached result
							/*
							 * This fails if the second request is made before the first one returns if
							 * (lastRequest && serviceList == lastRequest[0] && startTime == lastRequest[1] &&
							 * endTime == lastRequest[2] && type == lastRequest[3]) {
							 */
							lastRequest = arguments;

							// save the caller success and fail callbacks since we need to process the results before sending them
							// back to the caller
							callerCtx = ctx;
							callerSCB = scb;
							callerFCB = fcb;

							// create a comma separated list of all service ids as required for the btvService call
							var services = [];
							var serviceIds;
							var i;

							for (i = 0; i < serviceList.length; i++) {
								if (serviceList[i].isNPVR) {
									services.push(serviceList[i].serviceId);

								} else {
									log("fetchEvents", "Non NPVR service passed to fetchEvents. service=" + serviceList[i].serviceName);
								}
							}

							if (services.length > 0) {
								serviceIds = services.join(); // converts an array to a comma separated list
								btvService.getSOCUEventsByIdentifierTimeAndType(this, fetchEventsSCB, fetchEventsFCB, serviceIds, startTime, endTime, type, locale);
							} else {
								log("fetchEvents", "No NPVR services passed to fetchEvents");
								npvrEvents = {};
								scb.apply(ctx, [npvrEvents]);
							}
						} else {
							log("fetchEvents", "Invalid parameters passed to fetchEvents");
							npvrEvents = {};
							scb.apply(ctx, [npvrEvents]);
						}
					};
				}()),

				/**
				 * Fetches the list of CPVRoN recordings associated with the signed-in account and current
				 * device
				 *
				 * @method fetchRecordings
				 * @async
				 * @param {Object} ctx The call context which will be used for the callback
				 * @param {Object} scb The success callback which will be called if the fetch is successful
				 * @param {Object} fcb The failure callback which will be called if the fetch not successful
				 */
				fetchRecordings: function (ctx, scb, fcb) {
					// the list of recordings may be modified by the operator so we don't cache the result
					npvrService.fetchNPVREventsByAccAndDevice(ctx, scb, fcb, locale, 0, 50);
				},

				/**
				 * Sets the locale to be used when fetching data from the server.
				 * @method setLocale
				 * @param {String} localeToUse e.g. `en_gb`
				 */
				setLocale: function (localeToUse) {
					if (localeToUse) {
						locale = localeToUse;
					} else {
						locale = "en_gb";
					}
				}
			};

			// initially create the Recordings with just an init function. We copy the
			// functions from "functions" when initialised
			var recordings = {

				/**
				 * Initialises the recordings
				 * @method init
				 * @param {Object} btvSvc A reference to the BTV Service
				 * @param {Object} npvrSvc A reference to the NPVR Service
				 * @param {String} loc The locale of the recordings to fetch
				 */
				init: function (btvSvc, npvrSvc, loc) {
					var fn;

					btvService = btvSvc;
					npvrService = npvrSvc;
					locale = loc || "en_gb";

					for (fn in functions) {
						if (functions.hasOwnProperty(fn)) {
							recordings[fn] = functions[fn];
						}
					}

					$N.services.sdp.Recordings.getQSPEvent = function (ev) {
						return getQSPEvent(ev);
					};

				}
			};

			var initialFunction = function () {
				throw "Invalid usage! The Recordings must be initialised before it can be used.";
			};

			// create stubs for all functions in "functions" which throw an uninitialised exception. These are replaced with the
			// correct functions when init is called
			for (fn in functions) {
				if (functions.hasOwnProperty(fn)) {
					recordings[fn] = initialFunction;
				}
			}

			return recordings;
		}());
		return $N.services.sdp.Recordings;
	}
);