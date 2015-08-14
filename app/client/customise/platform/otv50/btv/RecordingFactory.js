/**
 * RecordingFactory creates an Recording object or an array of Recording objects
 * passed in from an external application. This factory creates its output from
 * Recordings passed in from OTV 5 MW.
 * @class $N.platform.btv.RecordingFactory
 * @author Nigel Thorne
 * @constructor
 */
var $N = $N || {};
$N.platform = $N.platform || {};
$N.platform.btv = $N.platform.btv || {};

$N.platform.btv.RecordingFactory = (function () {

	var defineGetter;
	if (Object.defineProperty) {
		defineGetter = function (obj, property, getterFunction) {
			Object.defineProperty(obj, property, {
				get: getterFunction
			});
		};
	} else {
		defineGetter = function (obj, property, getterFunction) {
			obj.__defineGetter__(property, getterFunction);
		};
	}

	function getMappedObject(obj) {

		var recordingType,
			mapped = {
				_data: obj
			};

		defineGetter(mapped, "taskId", function () {
			return mapped._data.taskId;
		});
		defineGetter(mapped, "jobId", function () {
			return mapped._data.jobId;
		});
		defineGetter(mapped, "seriesId", function () {
			return mapped._data.seriesId;
		});
		defineGetter(mapped, "seasonId", function () {
			return mapped._data.seasonId;
		});
		defineGetter(mapped, "episodeId", function () {
			return mapped._data.episodeId;
		});
		defineGetter(mapped, "seriesName", function () {
			return mapped._data.seriesName;
		});
		defineGetter(mapped, "title", function () {
			return mapped._data.title;
		});
		defineGetter(mapped, "url", function () {
			return "pvr://" + mapped._data.taskId;
		});
		defineGetter(mapped, "eventId", function () {
			return mapped._data.eventId;
		});
		defineGetter(mapped, "startTime", function () {
			return mapped._data.startTime;
		});
		defineGetter(mapped, "endTime", function () {
			return mapped._data.endTime;
		});
		defineGetter(mapped, "softPrepaddingDuration", function () {
			return mapped._data.softPrepaddingDuration;
		});
		defineGetter(mapped, "softPostpaddingDuration", function () {
			return mapped._data.softPostpaddingDuration;
		});
		defineGetter(mapped, "netActorCast", function () {
			return mapped._data.netActorCast;
		});
		defineGetter(mapped, "netDirector", function () {
			return mapped._data.netDirector;
		});
		defineGetter(mapped, "netCountry", function () {
			return mapped._data.netCountry;
		});
		defineGetter(mapped, "netProdYear", function () {
			return mapped._data.netProdYear;
		});
		defineGetter(mapped, "netServiceName", function () {
			return mapped._data.netServiceName;
		});
		defineGetter(mapped, "netContentDesc", function () {
			return mapped._data.netContentDesc;
		});
		defineGetter(mapped, "duration", function () {
			return mapped._data.duration;
		});
		defineGetter(mapped, "serviceId", function () {
			return mapped._data.serviceId;
		});
		defineGetter(mapped, "shortDesc", function () {
			return mapped._data.shortDesc;
		});
		defineGetter(mapped, "longDesc", function () {
			return mapped._data.longDesc;
		});
		defineGetter(mapped, "contentDesc", function () {
			return mapped._data.contentDesc;
		});
		defineGetter(mapped, "keep", function () {
			return mapped._data.keep;
		});
		defineGetter(mapped, "bookmark", function () {
			return mapped._data.bookmark;
		});
		defineGetter(mapped, "parentalRating", function () {
			return mapped._data.parentalRating;
		});
		defineGetter(mapped, "extraInfo", function () {
			return mapped._data.extraInfo;
		});
		defineGetter(mapped, "netEventGenres", function () {
			return $N.app.genreUtil.getGenreObjectFromGenreString(mapped._data.netEventGenres);
		});
		defineGetter(mapped, "netOriginalName", function () {
			return mapped._data.netOriginalName;
		});
		defineGetter(mapped, "netEpisodeName", function () {
			return mapped._data.netEpisodeName;
		});
		defineGetter(mapped, "netEpisodeOriginalName", function () {
			return mapped._data.netEpisodeOriginalName;
		});
		defineGetter(mapped, "netDisplaySeasonEpisode", function () {
			// if we have an object returned & it is a daily event (set to zero) we return false otherwise we display the synopsis
			if (mapped._data.netDisplaySeasonEpisode && mapped._data.netDisplaySeasonEpisode === "0") {
				return false;
			}
			return true;
		});
		defineGetter(mapped, "recordingType", function () {
			// Condition added for "RPT_TIME" because for Manual series recording schedule type is "RPT_TIME"
			if ((mapped._data.scheduleType === "SERIES") || (mapped._data.scheduleType === "RPT_TIME")) {
				recordingType = $N.data.Recording.RECORDING_TYPE.SERIES;
			} else {
				recordingType = $N.data.Recording.RECORDING_TYPE.SINGLE;
			}
			return recordingType;
		});
		defineGetter(mapped, "uiFolder", function () {
			return mapped._data.uiFolder;
		});
		defineGetter(mapped, "scheduleType", function () {
			return mapped._data.scheduleType;
		});
		defineGetter(mapped, "repeatDaysArray", function () {
			return mapped._data.repeatDaysArray;
		});
		defineGetter(mapped, "sourceURL", function () {
			return mapped._data.sourceURL;
		});
		defineGetter(mapped, "timeOfDay", function () {
			return mapped._data.timeOfDay;
		});
		defineGetter(mapped, "isAuthorized", function () {
		    return mapped._data.isAuthorized;
		});
		defineGetter(mapped, "objectState", function () {
			return mapped._data.objectState;
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
		 * Takes a recording object as returned from the platform and returns a
		 * recording object mapped to the framework standard as defined
		 * in $N.data.Recording
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
		 * Takes an array of recording objects from the platform and returns an
		 * array of recording objects mapped to the framework standard as defined
		 * in $N.data.Recording
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
