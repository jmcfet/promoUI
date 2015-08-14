/**
 * EPGEventFactory creates an EPG event object or an array of EPG Event objects
 * passed in from an external application. This factory creates its output from
 * EPG events passed in from SDP.
 * @class $N.services.sdp.EPGEventFactory
 * @singleton
 * @requires $N.data.EPGEvent
 * @requires $N.services.sdp.Ratings
 * @requires $N.services.sdp.EPGEventFactory
 * @author Nigel Thorne
 */
/* global define */
define('jsfw/services/sdp/EPGEventFactory',
	[
		'jsfw/data/EPGEvent',
		'jsfw/services/sdp/Ratings',
		'jsfw/services/sdp/ServiceFactory'
	],
	function (EPGEvent, Ratings, ServiceFactory) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};

		$N.services.sdp.EPGEventFactory = (function () {

			var defineGetter;

			if (Object.defineProperty) {
				defineGetter = function (obj, name, func) {
					Object.defineProperty(obj, name, {
						get: func,
						enumerable: true
					});
				};
			} else {
				defineGetter = function (obj, name, func) {
					obj.__defineGetter__(name, func);
				};
			}

			function getMappedObject(obj, serviceLookup) {
				//TODO: add the other properties as defined in EPGEvent
				var mapped = {
					_promoImage: null,
					_year: null,
					_data: obj
				};

				defineGetter(mapped, "eventId", function () {
					return mapped._data.uid.toString();
				});
				defineGetter(mapped, "serviceId", function () {
					return mapped._data.channelUID.toString();
				});
				defineGetter(mapped, "startTime", function () {
					return mapped._data.startTime;
				});
				defineGetter(mapped, "endTime", function () {
					return mapped._data.endTime;
				});
				defineGetter(mapped, "title", function () {
					return mapped._data.eventName;
				});
				defineGetter(mapped, "shortDesc", function () {
					return mapped._data.shortDescription;
				});
				defineGetter(mapped, "longDesc", function () {
					return mapped._data.shortDescription;
				});
				defineGetter(mapped, "parentalRating", function () {
					return $N.services.sdp.Ratings && $N.services.sdp.Ratings.getRatingLookup()[mapped._data.eventRating] ? $N.services.sdp.Ratings.getRatingLookup()[mapped._data.eventRating].precedenceValue : null;
				});
				defineGetter(mapped, "definition", function () {
					return mapped._data.definition;
				});
				defineGetter(mapped, "promoImage", function () {
					var localCallback,
						serverCallback,
						programService = $N.services.sdp.ServiceFactory.get("ProgramService");
					if (mapped._promoImage === null && programService) {
						serverCallback = function (result) {
							if (localCallback) {
								mapped._promoImage = result.promoImage || "";
								localCallback(mapped._promoImage);
							}
						};
						//TODO: find a way to automatically detect locale
						programService.getVerboseProgramByEventUID(this, serverCallback, serverCallback, mapped.eventId, "en_gb");
						return function (callback) {
							localCallback = callback;
						};
					}
					return mapped._promoImage || "";
				});
				defineGetter(mapped, "year", function () {
					var localCallback,
						serverCallback,
						programService = $N.services.sdp.ServiceFactory.get("ProgramService");
					if (mapped._year === null && programService) {
						serverCallback = function (result) {
							if (localCallback) {
								mapped._year = result.year || "";
								localCallback(mapped._year);
							}
						};
						//TODO: find a way to automatically detect locale
						programService.getVerboseProgramByEventUID(this, serverCallback, serverCallback, mapped.eventId, "en_gb");
						return function (callback) {
							localCallback = callback;
						};
					}
					return mapped._year || "";
				});
				defineGetter(mapped, "source", function () {
					return $N.data.EPGEvent.SOURCE.SDP;
				});
				defineGetter(mapped, "isCatchUp", function () {
					return (mapped._data.eventType ? (mapped._data.eventType === 'CU' || mapped._data.eventType === 'SOCU') : false);
				});
				defineGetter(mapped, "isStartOver", function () {
					return (mapped._data.eventType ? (mapped._data.eventType === 'SO' || mapped._data.eventType === 'SOCU') : false);
				});
				defineGetter(mapped, "uri", function () {
		        	var now,
		        		service;
		        	if (mapped.isCatchUp || mapped.isStartOver) {
		        		now = new Date().getTime();
		        		service = serviceLookup[mapped.serviceId];
						if (mapped.isStartOver && mapped.endTime > now && mapped.startTime < now) {
							return "Startover/Channel(name=" + service.serviceName + ",startTime=" + mapped.startTime + "000)/index.m3u8";
						} else if (mapped.isCatchUp && mapped.endTime < now) {
							return "Catchup/Channel(name=" + service.serviceName + ",startTime=" + mapped.startTime + "000,endTime=" + mapped.endTime + "000)/index.m3u8";
						}
		        	}
		        	return null;
		        });
		        defineGetter(mapped, "casId", function () {
		        	var now,
		        		service;
		        	if (mapped.isCatchUp || mapped.isStartOver) {
		        		service = serviceLookup[mapped.serviceId];
						return service.casId;
		        	}
		        	return null;
		        });
		        defineGetter(mapped, "isnPvr", function() {
					return false;
				});
				return mapped;
			}

			function getMappedArray(array, serviceLookup) {
				var i,
					mapped,
					mappedArray	= [];

				if (array.length > 0) {
					for (i = 0; i < array.length; i++) {
						mapped = getMappedObject(array[i], serviceLookup);
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
				mapObject: function (obj, serviceLookup) {
					if (obj) {
						return getMappedObject(obj, serviceLookup);
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
				mapArray: function (array, serviceLookup) {
					if (array) {
						return getMappedArray(array, serviceLookup);
					} else {
						return [];
					}
				}
			};
		}());
		return $N.services.sdp.EPGEventFactory;
	}
);