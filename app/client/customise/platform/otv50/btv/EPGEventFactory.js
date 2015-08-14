/**
 * EPGEventFactory creates an EPG event object or an array of EPG Event objects
 * passed in from an external application. This factory creates its output from
 * EPG events passed in from OTV 5 MW.
 * @class $N.platform.btv.EPGEventFactory
 * @singleton
 * @author Nigel Thorne
 */
var $N = $N || {};
$N.platform = $N.platform || {};
$N.platform.btv = $N.platform.btv || {};

$N.platform.btv.EPGEventFactory = (function () {

	var defineGetter,
		CATCHUP_STATE = {
			CATCHUP: '1',
			STARTOVER: '2'
		};

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
			},
			_startOver = false,
			_catchUp = false,
			_ExtInfo = null,
			_uniqueEventId = null,
			_displaySeasonEpisode = true,
			_imageFilename = null,
			acquireExtInfo = function() {
				var _ExtInfo = $N.app.epgUtil.getExtendedInfoByEventId(mapped._data.eventId, $N.app.constants.EVENT_EXTENDED_INFO.CATCHUP);
				if (_ExtInfo) {
					if (_ExtInfo.catchupStartover) {
						if ($N.app.GeneralUtil.bitwiseAnd(_ExtInfo.catchupStartover, CATCHUP_STATE.CATCHUP)) {
							_catchUp = true;
						}
						if ($N.app.GeneralUtil.bitwiseAnd(_ExtInfo.catchupStartover, CATCHUP_STATE.STARTOVER)) {
							_startOver = true;
						}
					}
					if (_ExtInfo.displaySeasonEpisode === "0") {
						_displaySeasonEpisode = false;
					}
					_uniqueEventId = _ExtInfo.uniqueEventId;
				} else {
					// Assign a dummy event so that we can still fall through here.
					_ExtInfo = {};
				}
			};
		defineGetter(mapped, "eventId", function () {
			return mapped._data.eventId;
		});
		defineGetter(mapped, "uniqueEventId", function () {
			return mapped._data.netUniqueEventId;
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
			var rating = parseInt(mapped._data.parentalRating) || null;
			if (rating && rating >= 4 && rating < 7) {
				rating = 7; // Adjustment to new level for L events to allow blocking by morality level
			}
			return rating;
		}); // + 3 removed above which was to support DVB rating spec. (NET using PR2 spec. until Jan. 2015)
		defineGetter(mapped, "seriesId", function () {
			return mapped._data.seriesId;
		});
		defineGetter(mapped, "episodeId", function () {
			return mapped._data.episodeId;
		});
		defineGetter(mapped, "seasonId", function () {
			return mapped._data.seasonId;
		});
		defineGetter(mapped, "directors", function () {
			return mapped._data.netDirector;
		});
		defineGetter(mapped, "actors", function () {
			return mapped._data.netActorCast;
		});
		defineGetter(mapped, "seriesName", function () {
			return mapped._data.seriesName;
		});
		defineGetter(mapped, "promoImage", function () {
			var posterPath;
			if (!_imageFilename) {
				posterPath = $N.app.Config.getConfigValue("external.epg.poster.path");
				if (mapped._data.seriesId) {
					_imageFilename = posterPath + mapped._data.seriesId + $N.app.constants.EPG_POSTER_IMAGE_SUFFIX;
				}
				else {
					var tmp = $N.app.epgUtil.getExtendedInfoByEventId(mapped._data.eventId, $N.app.constants.EVENT_EXTENDED_INFO.EVENT_INFO);
					if (tmp && tmp.eventId) {
						_imageFilename = posterPath + tmp.eventId + $N.app.constants.EPG_POSTER_IMAGE_SUFFIX;
					} else {
						_imageFilename = "";
					}
				}
			}
			return _imageFilename;
		});
		defineGetter(mapped, "source", function () {
			return mapped._data.sourceId || mapped._data.sourceId === 0 ? mapped._data.sourceId : $N.data.EPGEvent.SOURCE.EIT;
		});
		defineGetter(mapped, "definition", function () {
			return null;
		});
		defineGetter(mapped, "year", function () {
			return mapped._data.netProdYear;
		});
		defineGetter(mapped, "country", function () {
			return mapped._data.netCountry;
		});
		defineGetter(mapped, "isCatchUp", function () {
			if (!_ExtInfo) {
				acquireExtInfo();
			}

			return _catchUp;
		});
		defineGetter(mapped, "isStartOver", function () {
			if (!_ExtInfo) {
				acquireExtInfo();
			}

			return _startOver;
		});
		defineGetter(mapped, "displaySeasonEpisode", function () {
			if (!_ExtInfo) {
				acquireExtInfo();
			}

			return _displaySeasonEpisode;
		});
		defineGetter(mapped, "originalName", function () {
			return mapped._data.netOriginalName;
		});
		defineGetter(mapped, "epOriginalName", function () {
			return mapped._data.netEpisodeName;
		});
		defineGetter(mapped, "netEventGenres", function () {
			return mapped._data.netEventGenres;
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
