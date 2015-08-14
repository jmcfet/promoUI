/**
 * Helper class for improving Gravity's performance
 *
 * @class $N.app.EventUtil
 * @author rhill
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.EventUtil = (function () {

		var log = new $N.apps.core.Log("Helper", "EventUtil"),
			BAD_EVENT_ID = 0,
			BAD_SERVICE_ID = -1;

		/**
		 * @method isEventShowingToday
		 * @param event {Object} an EPGEvent object
		 * @return {Boolean} true if the event is showing today, false otherwise
		 */
		function isEventShowingToday(event) {
			var today = new Date(),
				startDate = new Date(event.startTime);
			return (today.getDate() === startDate.getDate() && today.getMonth() === startDate.getMonth() && today.getFullYear() === startDate.getFullYear());
		}

		/**
		 * @method isEventShowingNow
		 * @param event {Object} an EPGEvent object
		 * @return {Boolean} true if the event is currently showing, false otherwise
		 */
		function isEventShowingNow(event) {
			return (event && event.startTime <= Date.now() && event.endTime >= Date.now());
		}

		/**
		 * Returns true if the event is currently playing.
		 * @method isEventPlayingNow
		 * @param {Object} event An EPG event object
		 * @return {Boolean} True if the event is playing now.
		 */
		function isEventPlayingNow(event) {
			var channel = $N.platform.btv.EPG.getChannelByServiceId(event.serviceId),
				eventStream,
				currentStream;
			if (channel) {
				eventStream = channel.uri;
				currentStream = $N.app.fullScreenPlayer.tuner.getCurrentUri();
				return (currentStream === eventStream && isEventShowingNow(event));
			}
			return false;
		}

		/**
		 * @method isFutureEvent
		 * @param {Object} eventObj
		 * @return {boolean}
		 */
		function isFutureEvent(eventObj) {
			return (eventObj && eventObj.startTime && eventObj.startTime > Date.now());
		}

		/**
		 * @method isPastEvent
		 * @param {Object} eventObj
		 * @return {boolean}
		 */
		function isPastEvent(eventObj) {
			return (eventObj && eventObj.endTime && eventObj.endTime < Date.now());
		}

		/**
		 * Returns whether the serviceId looks valid
		 * @method getisValidServiceIdNumServices
		 * @return {Boolean} True if the service Id appears valid
		 */
		function isValidServiceId(serviceId) {
			return (serviceId && serviceId !== BAD_SERVICE_ID);
		}

		/**
		 * @method isValidEvent
		 * @param {Object} eventObj
		 * @return {boolean}
		 *
		 */
		function isValidEvent(eventObj) {
			if ((eventObj && eventObj.eventId && isValidServiceId(eventObj.serviceId))) {
				return true;
			}
			return false;
		}

		/**
		 * @method getLiveEventIndex
		 * @param {Array} data - array of events
		 * @return {Number} liveEventIndex (1 base) or 0 if none found
		 */
		function getLiveEventIndex(data) {
			var dataLength = data.length,
				i;
			for (i = 0; i < dataLength; i++) {
				if (data[i] && isEventShowingNow(data[i])) {
					return i + 1;
				}
			}
			return 0;
		}

		/**
		 * Function to check if it is preview time for the
		 * event at the moment
		 * @method isEventPreviewTime
		 * @param event {Object} an EPGEvent object
		 * @return eventInfo {Object} event info object which has preview time inside it
		 */
		function isEventPreviewTime(event, eventInfo) {
			var SECS_IN_MS = 1000,
				previewEndTime = null;
			if (event && !eventInfo) {
				eventInfo = CCOM.ConditionalAccess.getEventInfo(event.eventId);
			}
			if (eventInfo.previewTime) {
				previewEndTime = event.startTime + (eventInfo.previewTime * SECS_IN_MS);//previewtime is obtained in seconds. it always occurs at start of the event
				return (event && (event.startTime <= Date.now()) && (Date.now() <= previewEndTime));
			} else {
				return false;
			}
		}

		// Public
		return {

			isEventShowingToday: isEventShowingToday,
			isEventShowingNow: isEventShowingNow,
			isEventPlayingNow: isEventPlayingNow,
			isFutureEvent: isFutureEvent,
			isPastEvent: isPastEvent,
			isValidEvent: isValidEvent,
			isValidServiceId: isValidServiceId,
			getLiveEventIndex: getLiveEventIndex,
			BAD_EVENT_ID: BAD_EVENT_ID,
			BAD_SERVICE_ID: BAD_SERVICE_ID,
			isEventPreviewTime: isEventPreviewTime

		};
	}());

}($N || {}));
