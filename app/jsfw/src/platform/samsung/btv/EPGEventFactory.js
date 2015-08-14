/**
 * EPGEventFactory creates an EPG event object or an array of EPG Event objects
 * passed in from an external application. This factory creates its output from
 * EPG events passed in from OTV 5 MW.
 * @class $N.platform.btv.EPGEventFactory
 * @singleton
 * @requires $N.services.sdp.Ratings
 * @requires $N.services.sdp.ServiceFactory
 */
/* global define */
define('jsfw/platform/btv/EPGEventFactory',
	[
		'jsfw/services/sdp/Ratings',
		'jsfw/services/sdp/ServiceFactory'
	],
	function (Ratings, ServiceFactory) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.btv = $N.platform.btv || {};

		$N.platform.btv.EPGEventFactory = (function () {

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

		    function getMappedObject(obj) {
				//TODO: add the other properties as defined in EPGEvent
				var mapped = {
					_year: null,
					_promoImage: null,
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
					return $N.services.sdp.Ratings ? $N.services.sdp.Ratings.getUserAgeRatingForRatingId(mapped._data.eventRating) : null;
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
					return mapped._data.source || "";
		        });
		        defineGetter(mapped, "isnPvr", function() {
					return (mapped._data.isnPvr === "true" || mapped._data.isnPvr === true) ? true : false;
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
		return $N.platform.btv.EPGEventFactory;
	}
);
