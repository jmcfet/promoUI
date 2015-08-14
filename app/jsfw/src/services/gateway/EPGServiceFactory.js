/**
 * EPGServiceFactory creates an EPG Service object or an array of EPG Service objects
 * passed in from an external application. This factory creates its output from
 * EPG events passed in from the HomeCruise gateway.
 * @class $N.services.gateway.EPGServiceFactory
 * @singleton
 * @author Ian Wootten
 */

/* global define */
define('jsfw/services/gateway/EPGServiceFactory',
	['jsfw/services/sdp/Subscriptions'],
	function (Subscriptions) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.gateway = $N.services.gateway || {};

		$N.services.gateway.EPGServiceFactory = (function () {

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

				var mapped = {_data: obj};

				defineGetter(mapped, "serviceId", function () {
					return mapped._data.sid;
				});
				defineGetter(mapped, "logicalChannelNum",  function () {
					return null;
				});
				defineGetter(mapped, "serviceType", function () {
					return $N.data.EPGService.SERVICE_TYPE.TV;
				});
				defineGetter(mapped, "deliveryMethod", function () {
					return $N.data.EPGService.DELIVERY_TYPE.GATEWAY;
				});
				defineGetter(mapped, "serviceName", function () {
					return mapped._data.sn;
				});
				defineGetter(mapped, "uri", function () {
					return null;
				});
				defineGetter(mapped, "isSubscribed", function () {
					return null;
				});
				defineGetter(mapped, "parentalRating", function () {
					return null;
				});
				defineGetter(mapped, "casId", function () {
					return null;
				});
				defineGetter(mapped, "logo", function () {
					return "logos/" + mapped._data.oid + "-" + mapped._data.sid + ".png";
				});
				defineGetter(mapped, "nPvrSupport", function () {
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
				 * Takes a service object from the platform and returns a
				 * service object mapped to the framework standard as defined
				 * in $N.data.EPGService
				 * @method mapObject
				 * @param {Object} obj Object to map
				 * @return {Object}
				 */
				mapObject: function (obj) {
					if (obj) {
						return getMappedObject(obj);
					}
					return null;
				},

				/**
				 * Takes an array of service objects from the platform and returns an
				 * array of service objects mapped to the framework standard as defined
				 * in $N.data.EPGService
				 * @method mapArray
				 * @param {Array} array Array of objects to map
				 * @return {Array}
				 */
				mapArray: function (array) {
					if (array) {
						return getMappedArray(array);
					}
					return [];
				}
			};
		}());
		return $N.services.gateway.EPGServiceFactory;
	}
);