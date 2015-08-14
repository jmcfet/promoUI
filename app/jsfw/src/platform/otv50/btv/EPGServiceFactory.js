/**
 * EPGServiceFactory creates an EPG Service object or an array of EPG Service objects
 * passed in from an external application. This factory creates its output from
 * EPG events passed in from OTV 5 MW.
 * @class $N.platform.btv.EPGServiceFactory
 * @requires $N.data.EPGService
 * @singleton
 * @author Nigel Thorne
 */
/* global CCOM */

define('jsfw/platform/btv/EPGServiceFactory',
	['jsfw/data/EPGService'],
	function (EPGService) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.btv = $N.platform.btv || {};

		$N.platform.btv.EPGServiceFactory = (function () {
			var defineGetterSetter;
			if (Object.defineProperty) {
				defineGetterSetter = function (obj, name, getFunc, setFunc) {
					if (!setFunc) {
						setFunc = function () {};
					}
					Object.defineProperty(obj, name, {
						set: setFunc,
						get: getFunc
					});
				};
			} else {
				defineGetterSetter = function (obj, name, getFunc, setFunc) {
					if (!setFunc) {
						setFunc = function () {};
					}
					obj.__defineGetter__(name, getFunc);
					obj.__defineSetter__(name, setFunc);
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
				case 1:
					return $N.data.EPGService.SERVICE_TYPE.TV;
				case 2:
					return $N.data.EPGService.SERVICE_TYPE.RADIO;
				default:
					return $N.data.EPGService.SERVICE_TYPE.OTHER;
				}
			}

			/**
			 * Retrieves the specified tag information for a service
			 * @method getTagForService
			 * @private
			 * @param {String} serviceId unique identifier for the service
			 * @param {String} tag the tagId
			 * @return {String|Number} the value of the tag
			 */
			function getTagForService(serviceId, tag) {
				var tags = CCOM.EPG.getTagsByServiceId(serviceId),
					i;
				for (i = tags.length - 1; i >= 0; i--) {
					if (tags[i].tagId === tag) {
						return tags[i].tagValue;
					}
				}
				return null;
			}

			function getMappedObject(obj) {
				var mapped = {
					_data: obj
				};

				defineGetterSetter(mapped, "serviceId", function () {
					return mapped._data.serviceId;
				});
				defineGetterSetter(mapped, "logicalChannelNum",  function () {
					return mapped._data.channelKey;
				});
				defineGetterSetter(mapped, "serviceType", function () {
					return getServiceTypeEnum(obj); //TODO: test this
				});
				defineGetterSetter(mapped, "deliveryMethod", function () {
					return $N.data.EPGService.DELIVERY_TYPE.DVB;
				});
				defineGetterSetter(mapped, "serviceName", function () {
					return mapped._data.name;
				});
				defineGetterSetter(mapped, "uri", function () {
					return mapped._data.uri;
				});
				defineGetterSetter(mapped, "isSubscribed", function () {
					return true;
				}, function (value) {
					mapped._data.isSubscribed = value;
				});
				defineGetterSetter(mapped, "parentalRating", function () {
					return getTagForService(mapped._data.serviceId, "rating");
				});
				defineGetterSetter(mapped, "casId", function () {
					return mapped._data.naspCA;
				});
				defineGetterSetter(mapped, "logo", function () {
					return getTagForService(mapped._data.serviceId, "promoImage");
				});
				defineGetterSetter(mapped, "nPvrSupport", function () {
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
				 * Takes a service object from the platform and returns a
				 * service object mapped to the framework standard as defined
				 * in $N.data.EPGService
				 * @method mapObject
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
		return $N.platform.btv.EPGServiceFactory;
	}
);