/**
 * EPGEventFactory creates an EPG event object or an array of EPG Event objects
 * passed in from an external application. This factory creates its output from
 * EPG events passed in from the HomeCruise Gateway.
 * @class $N.services.gateway.EPGEventFactory
 * @singleton
 * @author Jason Manly
 */

/* global define */
define('jsfw/services/gateway/EPGEventFactory',
	[],
	function () {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.gateway = $N.services.gateway || {};

		$N.services.gateway.EPGEventFactory = (function () {

			var defineGetter;
			if (Object.defineProperty) {
				defineGetter = function (obj, name, func) {
					Object.defineProperty(obj, name, {
						get: func
					});
				};
			} else {
				defineGetter = function (obj, name, func) {
					obj.__defineGetter__(name, func);
				};
			}

			function getMappedObject(obj) {

				var mapped = {
						_data: obj
					};
				defineGetter(mapped, "eventId", function () {
					return mapped._data.eit_info_event_id;
				});
				defineGetter(mapped, "serviceId", function () {
					return mapped._data.sid;
				});
				defineGetter(mapped, "startTime", function () {
					return mapped._data.eit_info_start_time_gmt;
				});
				defineGetter(mapped, "endTime", function () {
					return (mapped._data.eit_info_start_time_gmt + mapped._data.eit_info_duration);
				});
				defineGetter(mapped, "title", function () {
					return mapped._data.eit_info_event_name;
				});
				defineGetter(mapped, "shortDesc", function () {
					return mapped._data.eit_info_short_desc;
				});
				defineGetter(mapped, "longDesc", function () {
					return mapped._data.eit_info_long_desc;
				});
				defineGetter(mapped, "parentalRating", function () {
					return mapped._data.eit_info_private_rating;
				});
				defineGetter(mapped, "source", function () {
					return $N.data.EPGEvent.SOURCE.GATEWAY;
				});
				defineGetter(mapped, "duration", function () {
					return mapped._data.eit_info_duration;
				});
				defineGetter(mapped, "isBlackout", function () {
					return mapped._data.eit_info_is_blackout;
				});
				defineGetter(mapped, "definition", function () {
					return null;
				});
				defineGetter(mapped, "year", function () {
					return null;
				});
				defineGetter(mapped, "isnPvr", function() {
					return false;
				});
				return mapped;
			}

			function getMappedArray(array) {
				var i,
					mapped,
					mappedArray	= [];

				if (array.length > 0) {
					for (i = 0; i < array.length; i++) {
						mapped = getMappedObject(array[i]);
						mappedArray.push(mapped);
					}
				}
				return mappedArray;
			}

			return {
				/**
				 * Takes an event object as returned from the platform and returns an
				 * event object mapped to the framework standard as defined
				 * in $N.data.EPGEvent
				 * @method mapObject
				 * @param {Object} obj Object to map
				 * @return {Object}
				 */
				mapObject: function (obj) {
					if (obj) {
						return getMappedObject(obj);
					} else {
						return null;
					}
				},

				/**
				 * Takes an array of event objects from the platform and returns an
				 * array of event objects mapped to the framework standard as defined
				 * in $N.data.EPGEvent
				 * @method mapArray
				 * @param {Array} array Array of objects to map
				 * @return {Array}
				 */
				mapArray: function (array) {
					if (array) {
						return getMappedArray(array);
					} else {
						return [];
					}
				}
			};
		}());
		return $N.services.gateway.EPGEventFactory;
	}
);