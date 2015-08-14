/**
 * RecordingFactory creates an Recording object or an array of Recording objects
 * passed in from an external application. This factory creates its output from
 * Recordings passed in from OTV 5 MW.
 * @class $N.platform.btv.RecordingFactory
 * @author Nigel Thorne
 * @requires $N.data.Recording
 * @constructor
 */
define('jsfw/platform/btv/RecordingFactory',
	[
		'jsfw/data/Recording'
	],
	function (Recording) {
		window.$N = $N || {};
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
					return mapped._data.parentalRating + 3;
				});
				defineGetter(mapped, "recordingType", function () {
					if (mapped._data.scheduleType === "SERIES") {
						recordingType = $N.data.Recording.RECORDING_TYPE.SERIES;
					} else {
						recordingType = $N.data.Recording.RECORDING_TYPE.SINGLE;
					}
					return recordingType;
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
		return $N.platform.btv.RecordingFactory;
	}
);
