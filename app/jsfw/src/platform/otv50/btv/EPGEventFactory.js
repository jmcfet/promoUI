/**
 * EPGEventFactory creates an EPG event object or an array of EPG Event objects
 * passed in from an external application. This factory creates its output from
 * EPG events passed in from OTV 5 MW.
 * @class $N.platform.btv.EPGEventFactory
 * @requires $N.data.EPGEvent
 * @singleton
 * @author Nigel Thorne
 */
define('jsfw/platform/btv/EPGEventFactory',
	['jsfw/data/EPGEvent'],
	function (EPGEvent) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.btv = $N.platform.btv || {};

		$N.platform.btv.EPGEventFactory = (function () {

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
					return mapped._data.eventId;
				});
				defineGetter(mapped, "serviceId", function () {
					return mapped._data.serviceId;
				});
				defineGetter(mapped, "startTime", function () {
					return mapped._data.startTime;
				});
				defineGetter(mapped, "endTime", function () {
					return mapped._data.endTime;
				});
				defineGetter(mapped, "title", function () {
					return mapped._data.title;
				});
				defineGetter(mapped, "shortDesc", function () {
					return mapped._data.shortDesc;
				});
				defineGetter(mapped, "longDesc", function () {
					return mapped._data.longDesc;
				});
				defineGetter(mapped, "parentalRating", function () {
					return mapped._data.parentalRating + 3;
				});
				defineGetter(mapped, "seriesId", function () {
					return mapped._data.seriesId;
				});
				defineGetter(mapped, "episodeId", function () {
					return mapped._data.episodeId;
				});
				defineGetter(mapped, "seasonId", function () {
					return mapped._data.seasonId;
				});
				defineGetter(mapped, "seriesName", function () {
					return mapped._data.seriesName;
				});
				defineGetter(mapped, "promoImage", function () {
					return "";
				});
				defineGetter(mapped, "source", function () {
					return mapped._data.sourceId || $N.data.EPGEvent.SOURCE.EIT;
		        });
		        defineGetter(mapped, "definition", function () {
					return null;
				});
				defineGetter(mapped, "year", function () {
					return null;
				});
				defineGetter(mapped, "isnPvr", function() {
					return null;
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