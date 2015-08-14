/**
 * EPGServiceFactory creates an EPG Service object or an array of EPG Service objects
 * passed in from an external application. This factory creates its output from
 * EPG events passed in from Metadata server.
 * @class $N.services.sdp.EPGServiceFactory
 * @singleton
 * @author Mark Brown
 */
var $N = $N || {};
$N.services = $N.services || {};
$N.services.sdp = $N.services.sdp || {};

$N.services.sdp.EPGServiceFactory = (function () {

	var	DVB = "dvb://",
		IGMP = "igmp://",
		defineGetter,
		log = new $N.apps.core.Log("sdp", "EPGServiceFactory");

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
		///switch (channel.type) {
		//case "BTV":
		return $N.data.EPGService.SERVICE_TYPE.TV;
		//case "RADIO":
		//	return $N.data.EPGService.SERVICE_TYPE.RADIO;
		//default:
		//	return $N.data.EPGService.SERVICE_TYPE.OTHER;
		//}
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
				log("getProtocolFromURI", "Unable to determine service protocol.", $N.apps.core.Log.LOG_ERROR);
			}
		}
		return protocol;
	}

    function getMappedObject(obj) {
		var mapped = {
			_data: obj
		};

        defineGetter(mapped, "serviceId", function () {
			return String(mapped._data.editorial.id);
        });
        defineGetter(mapped, "logicalChannelNum", function () {
			return mapped._data.editorial.tvChannel;
        });
        defineGetter(mapped, "serviceType", function () {
            return getServiceTypeEnum(mapped._data);
        });
        defineGetter(mapped, "deliveryMethod", function () {
            return $N.data.EPGService.DELIVERY_TYPE.IP; //TODO: calculate this based on protocol
        });
        defineGetter(mapped, "serviceName", function () {
			return mapped._data.editorial.longName;
        });
		defineGetter(mapped, "shortName", function () {
			return mapped._data.shortName;
		});
        defineGetter(mapped, "uri", function () {
			return getProtocolFromURI(mapped._data.technical.NetworkLocation) + mapped._data.technical.NetworkLocation;
        });
		defineGetter(mapped, "parentalRating", function () {
			return $N.services.sdp.Ratings ? $N.services.sdp.Ratings.getUserAgeRatingForRatingId(mapped._data.editorial.Rating) : null;
        });

		mapped.isSubscribed = false; //gets set once subscription is known

        defineGetter(mapped, "casId", function () {
			return mapped._data.technical.drmId;
        });
        defineGetter(mapped, "logo", function () {
			return mapped._data.technical.PromoImages ? mapped._data.technical.PromoImages[0] : "";
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
			var objectMap = null;
			if (obj) {
				objectMap = getMappedObject(obj);
			} else {
				objectMap = null;
			}
			return objectMap;
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
			} else {
				return [];
			}
        }
	};
}());
