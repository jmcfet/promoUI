/**
 * EPGEventFactory creates an EPG event object or an array of EPG Event objects
 * passed in from an external application. This factory creates its output from
 * EPG events passed in from Metadata Server.
 * @class $N.services.sdp.EPGEventFactory
 * @singleton
 * @author Mark Brown
 */
var $N = $N || {};
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

	/**
	 * There are two kinds of private meta data format could be fetched.
	 * one is JSON format: {"DisplaySeasonEpisode":"0","TV ratings":"TVG"}
	 * two is like: DisplaySeasonEpisode=0;TV ratings=TVG
	 * @method parsePrivateMetaData
	 * @param {String} private meta data string
	 * @return {Object}
	 */
	function parsePrivateMetaData(privateMetaData) {
		if (privateMetaData) {
			try {
				return $N.apps.util.JSON.parse(privateMetaData);
			} catch (e) {
				return $N.app.StringUtil.extractObject(privateMetaData, ';', '=');
			}
		} else {
			return "";
		}
	}

	function getMappedObject(obj) {
		//TODO: add the other properties as defined in EPGEvent
		var mapped = {
				_data: obj
			},
			privateMetaDataObject = null,
			eventId = null;

		defineGetter(mapped, "eventId", function () {
			if (!eventId) {
				eventId = $N.app.ChannelManager.getServiceIdFromServiceRef(mapped._data.serviceRef) +
					$N.app.GeneralUtil.convertNumberToHexString(mapped._data.eventId, 4);
			}
			return eventId;
		});
		defineGetter(mapped, "broadcastEventId", function () {
			return String(mapped._data.eventId);
		});
		defineGetter(mapped, "uniqueEventId", function () {
			var eventIdParts = String(mapped._data.id).split('-');
			return eventIdParts[eventIdParts.length-1];
		});
		defineGetter(mapped, "serviceId", function () {
			return $N.app.ChannelManager.getServiceIdFromServiceRef(mapped._data.serviceRef);
		});
		defineGetter(mapped, "startTime", function () {
			return new Date(mapped._data.period.start * 1000).getTime();
		});
		defineGetter(mapped, "endTime", function () {
			return new Date(mapped._data.period.end * 1000).getTime();
		});
		defineGetter(mapped, "title", function () {
			return mapped._data.Title;
		});
		defineGetter(mapped, "seriesName", function () {
			return mapped._data.ShortTitle;
		});
		defineGetter(mapped, "shortDesc", function () {
			return mapped._data.Description;
		});
		defineGetter(mapped, "longDesc", function () {
			return mapped._data.Description;
		});
		defineGetter(mapped, "parentalRating", function () {
			var rating = mapped._data.editorial ? parseInt(mapped._data.editorial.Rating.precedence) : null;
			if (rating && rating >= 4 && rating < 7) {
				rating = 7; // Adjustment to new level for L events to allow blocking by morality level
			}
			return rating;
		});
		defineGetter(mapped, "seriesId", function () {
			return mapped._data.editorial ? mapped._data.editorial.seriesRef : null;
		});
		defineGetter(mapped, "episodeId", function () {
			return mapped._data.editorial && mapped._data.editorial.episodeNumber ? String(mapped._data.editorial.episodeNumber) : null;
		});
		defineGetter(mapped, "promoImage", function () {
			var posterPath = mapped._data.PromoImages && mapped._data.PromoImages.length ? mapped._data.PromoImages[0] : "";
			if (posterPath) {
				posterPath = posterPath.replace("epg.jpg", "epg_poster.jpg");
			}
			return posterPath;
		});
		defineGetter(mapped, "definition", function () {
			return "";
		});
		defineGetter(mapped, "actors", function () {
			return mapped._data.Actors ? mapped._data.Actors.join(", ") : "";
		});
		defineGetter(mapped, "directors", function () {
			return mapped._data.Directors ? mapped._data.Directors.join(", ") : "";
		});
		defineGetter(mapped, "year", function () {
			return mapped._data.Year;
		});
		defineGetter(mapped, "country", function () {
			return (mapped._data.Countries && mapped._data.Countries.length) ? mapped._data.Countries[0] : "";
		});
		defineGetter(mapped, "source", function () {
			return $N.data.EPGEvent.SOURCE.MDS;
		});
		defineGetter(mapped, "genres", function () {
			return $N.app.genreUtil.getGenreObjectFromGenreString(mapped._data.DvbCategories);
		});
		defineGetter(mapped, "isCatchUp", function () {
			return mapped._data.isCatchUp;
		});
		defineGetter(mapped, "isStartOver", function () {
			return mapped._data.isStartOver;
		});
		defineGetter(mapped, "id", function () {
			return mapped._data.id;
		});
		defineGetter(mapped, "contentRef", function () {
			return mapped._data.contentRef;
		});
		defineGetter(mapped, "originalName", function () {
			if (!privateMetaDataObject) {
				privateMetaDataObject = privateMetaDataObject || parsePrivateMetaData(mapped._data.PrivateMetadata);
			}
			return privateMetaDataObject.Originalname;
		});
		defineGetter(mapped, "epOriginalName", function () {
			if (!privateMetaDataObject) {
				privateMetaDataObject = privateMetaDataObject || parsePrivateMetaData(mapped._data.PrivateMetadata);
			}
			return privateMetaDataObject.epOriginalname;
		});
		defineGetter(mapped, "displaySeasonEpisode", function () {
			if (!privateMetaDataObject) {
				privateMetaDataObject = privateMetaDataObject || parsePrivateMetaData(mapped._data.PrivateMetadata);
			}
			return (privateMetaDataObject.DisplaySeasonEpisode !== "0");
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
			var objectMap = null;
			if (obj) {
				objectMap = getMappedObject(obj);
			} else {
				objectMap = null;
			}
			return objectMap;
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
