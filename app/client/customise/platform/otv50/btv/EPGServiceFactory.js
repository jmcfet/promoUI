/**
 * EPGServiceFactory creates an EPG Service object or an array of EPG Service objects
 * passed in from an external application. This factory creates its output from
 * EPG events passed in from OTV 5 MW.
 * @class $N.platform.btv.EPGServiceFactory
 * @singleton
 * @author Nigel Thorne
 */
/* global CCOM */

var $N = $N || {};
$N.platform = $N.platform || {};
$N.platform.btv = $N.platform.btv || {};

$N.platform.btv.EPGServiceFactory = (function () {
	var channelLogoTemplate = "";

	/**
	 * @method defineGetterSetter
	 * @param {Object} obj
	 * @param {String} propertyName
	 * @param {Function} getFunc
	 * @param {Function} setFunc
	 */
	function defineGetterSetter(obj, propertyName, getFunc, setFunc) {
		if (!setFunc) {
			setFunc = function () {};
		}
		Object.defineProperty(obj, propertyName, {
			set: setFunc,
			get: getFunc
		});
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
		case 128: // NET PPV Channels
			return $N.data.EPGService.SERVICE_TYPE.TV;
		case 2:
			return $N.data.EPGService.SERVICE_TYPE.RADIO;
		case 155: // NET Information channels
			return $N.data.EPGService.SERVICE_TYPE.OTHER;
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

	/**
	 * @method getChannelLogoByUniqueServiceId
	 * @param {String} uniqueServiceId
	 */
	function getChannelLogoByUniqueServiceId(uniqueServiceId) {
		if (!channelLogoTemplate) {
			channelLogoTemplate = $N.app.epgUtil.getPosterImageServer() + $N.app.Config.getConfigValue("epg.channelLogo.pattern");
		}
		return channelLogoTemplate.replace("%UNIQUE_SERVICE_ID%", uniqueServiceId);
	}

	/**
	 * @method getMappedObject
	 * @param {Object} serviceObject
	 * @return {Object}
	 */
	function getMappedObject(serviceObject) {
		var mapped = {
			_data: serviceObject
		};

		defineGetterSetter(mapped, "serviceId", function () {
			return mapped._data.serviceId;
		});
		defineGetterSetter(mapped, "uniqueServiceId", function () {
			return mapped._data.uniqueServiceId;
		});
		defineGetterSetter(mapped, "logicalChannelNum",  function () {
			return mapped._data.channelKey;
		});
		defineGetterSetter(mapped, "serviceType", function () {
			return getServiceTypeEnum(serviceObject); //TODO: test this
		});
		defineGetterSetter(mapped, "deliveryMethod", function () {
			return $N.data.EPGService.DELIVERY_TYPE.DVB;
		});
		defineGetterSetter(mapped, "serviceName", function () {
			return mapped._data.name;
		});
		Object.defineProperty(serviceObject, "shortName", {
			get: function () {
				return mapped._data.shortName;
			},
			set: function (value) {
				mapped._data.shortName = value;
			}
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
		defineGetterSetter(mapped, "tiServiceTipText", function () {
			return mapped._data.tiServiceTipText;
		});
		defineGetterSetter(mapped, "runningStatus", function () {
			return mapped._data.runningStatus;
		});
		Object.defineProperty(serviceObject, 'channelLogo', {
			get: function () {
				return mapped._data.channelLogo;
			},
			set: function () {
				mapped._data.channelLogo = getChannelLogoByUniqueServiceId(mapped._data.uniqueServiceId);
			}
		});
		defineGetterSetter(mapped, "definition", function () {
			var genreList,
				genreListLength,
				genreText = "SD",
				i;
			if (mapped.cachedDefinition) {
				return mapped.cachedDefinition;
			}
			genreList = CCOM.EPG.getGenresByServiceId(mapped._data.serviceId);
			genreListLength = genreList.length;
			/*jslint bitwise: true */
			for (i = 0; i < genreListLength; i++) {
				if (253 === (genreList[i].contentNibbleLevel1 << 4) + genreList[i].contentNibbleLevel2) {
					genreText = "HD";
					break;
				}
			}
			/*jslint bitwise: false*/
			mapped.cachedDefinition = genreText;
			return genreText;
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
