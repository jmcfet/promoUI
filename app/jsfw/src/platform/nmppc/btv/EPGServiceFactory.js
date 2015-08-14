/**
 * EPGServiceFactory creates an EPG Service object or an array of EPG Service objects
 * passed in from an external application. This factory creates its output from
 * EPG events passed in from OTV 5 MW.
 * @class $N.platform.btv.EPGServiceFactory
 * @singleton
 * @requires $N.apps.core.Log
 * @requires $N.data.EPGService
 * @requires $N.services.sdp.Ratings
 */
/* global define */
define('jsfw/platform/btv/EPGServiceFactory',
	[
		'jsfw/apps/core/Log',
		'jsfw/data/EPGService',
		'jsfw/services/sdp/Ratings',
		'jsfw/services/sdp/Subscriptions'
	],
	function (Log, EPGService, Ratings, ServiceFactory, Subscriptions) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.btv = $N.platform.btv || {};

		$N.platform.btv.EPGServiceFactory = (function () {

			var	DVB = "dvb://",
				IGMP = "igmp://",
				defineGetter,
				log = new $N.apps.core.Log("btv", "EPGServiceFactory");

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
			 * Infers the protocol from a URI
			 * @method getProtocolFromURI
			 * @private
			 * @param uri {String} the URI
			 * @return {String}
			 */
			function getProtocolFromURI(uri) {
				var protocol = '';
				if (uri && uri.indexOf("://") > -1) {
					//protocol exists in uri so return blank string
					return protocol;
				} else if (uri && uri.indexOf('.') !== -1) {
					var numberOfDots = uri.replace(new RegExp("[^.]", "g"), "").length;
					if (numberOfDots === 2) {
						protocol = DVB;
					} else if (numberOfDots === 3) {
						protocol = IGMP;
					} else {
						log("getProtocolFromURI", "Unable to determine service protocol.", Log.LOG_ERROR);
					}
				}
				return protocol;
			}

		    function getMappedObject(obj) {
				var mapped = {
					_data: obj
				};

		        defineGetter(mapped, "serviceId", function () {
					return mapped._data.uid + "";
		        });
		        defineGetter(mapped, "logicalChannelNum", function () {
					return mapped._data.number;
		        });
		        defineGetter(mapped, "serviceType", function () {
		            return getServiceTypeEnum(mapped._data);
		        });
		        defineGetter(mapped, "deliveryMethod", function () {
		            return parseInt(mapped._data.deliveryMethod, 10) || $N.data.EPGService.DELIVERY_TYPE.IP;
		        });
		        defineGetter(mapped, "serviceName", function () {
					return mapped._data.callLetters;
		        });
		        defineGetter(mapped, "uri", function () {
					return mapped._data.networkLocation ? getProtocolFromURI(mapped._data.networkLocation) + mapped._data.networkLocation : null;
		        });
				defineGetter(mapped, "parentalRating", function () {
					return $N.services && $N.services.sdp && $N.services.sdp.Ratings ? $N.services.sdp.Ratings.getUserAgeRatingForRatingId(mapped._data.ratingID) : null;
		        });
				defineGetter(mapped, "isSubscribed", function () {
					return $N.services && $N.services.sdp && $N.services.sdp.Subscriptions && $N.services.sdp.Subscriptions.isChannelSubscribed(mapped.serviceId) ? true : false;
				});
		        defineGetter(mapped, "casId", function () {
					return mapped._data.casID;
		        });
		        defineGetter(mapped, "logo", function () {
					return mapped._data.promoImage; //TODO: test this
		        });
		        defineGetter(mapped, "nPvrSupport", function () {
					return (mapped._data.nPvrSupport === "true" || mapped._data.nPvrSupport === true) ? true : false;
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
				 * Takes an array of service objects from the platform and returns an
				 * array of service objects mapped to the framework standard as defined
				 * in $N.data.EPGService
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
		return $N.platform.btv.EPGServiceFactory;
	}
);
