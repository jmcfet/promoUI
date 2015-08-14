/**
 * RecordingFactory creates an Recording object or an array of Recording objects
 * passed in from an external application. This factory creates its output from
 * Recordings passed in from OTV 5 gateway.
 * @class $N.services.gateway.dlna.RecordingFactory
 * @author Mark Brown
 * @constructor
 */
/* global define */
define('jsfw/services/gateway/dlna/RecordingFactory',
	[
		'jsfw/data/Recording'
	],
	function (Recording) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.gateway = $N.services.gateway || {};
		$N.services.gateway.dlna = $N.services.gateway.dlna || {};

		$N.services.gateway.dlna.RecordingFactory = (function () {

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

			function getDurationMilliseconds(duration) {
				//duration in format P01:02:33
				var timeArray = duration.split(":");
				var hoursAsMilliseconds = timeArray[0].substring(1) * 3600000;
				var minutesAsMillisecond = timeArray[1] * 60000;
				var secondsAsMillisecond = timeArray[2] * 1000;
				return (hoursAsMilliseconds + minutesAsMillisecond + secondsAsMillisecond);
			}

			function isValidDate(d) {
				if (Object.prototype.toString.call(d) !== "[object Date]")
					return false;
				return !isNaN(d.getTime());
			}

			function getMappedObject(obj) {
				var recordingType,
					mapped = {
						_data: obj
					};

				defineGetter(mapped, "taskId", function () {
					return mapped._data.id || mapped._data.scheduledCDSObjectID;
				});
				defineGetter(mapped, "jobId", function () {
					return mapped._data.recordScheduleID || mapped._data.srsRecordScheduleID.text;
				});
				defineGetter(mapped, "seriesId", function () {
					if (mapped._data.matchingID){
						return mapped._data.matchingID.text;
					} else if (mapped._data.seriesID) {
						return mapped._data.seriesID.text;
					}
					return null;
				});
				defineGetter(mapped, "seasonId", function () {
					return null;
				});
				defineGetter(mapped, "episodeId", function () {
					return null;
				});
				defineGetter(mapped, "seriesName", function () {
					if (mapped._data.programTitle){
						return mapped._data.programTitle.text || mapped._data.programTitle;
					} else if (mapped._data.title){
						return mapped._data.title.text || mapped._data.title;
					}
					return null;
				});
				defineGetter(mapped, "title", function () {
					if (mapped._data.title){
						return mapped._data.title.text || mapped._data.title;
					}
					return null;
				});
				defineGetter(mapped, "url", function () {
					if (mapped._data.defaultPlaybackInfo) {
						return mapped._data.defaultPlaybackInfo.url;
					}
					return null;
				});
				defineGetter(mapped, "eventId", function () {
					return mapped._data.programID ? mapped._data.programID.text : mapped._data.id;
				});
				defineGetter(mapped, "startTime", function () {
					if (mapped._data.taskStartDateTime) {
						return isValidDate(new Date(mapped._data.taskStartDateTime)) ? new Date(mapped._data.taskStartDateTime) : mapped._data.taskStartDateTime;
					} else if (mapped._data.recordedStartDateTime) {
						return isValidDate(new Date(mapped._data.recordedStartDateTime.text)) ? new Date(mapped._data.recordedStartDateTime.text) : mapped._data.recordedStartDateTime.text;
					} else if (mapped._data.scheduledStartDateTime) {
						return isValidDate(new Date(mapped._data.scheduledStartDateTime)) ? new Date(mapped._data.scheduledStartDateTime) : mapped._data.scheduledStartDateTime;
					}
					return null;
				});
				defineGetter(mapped, "endTime", function () {
					return null; //new Date(mapped._data.res[0].duration).getTime();
				});
				defineGetter(mapped, "softPrepaddingDuration", function () {
					return null;
				});
				defineGetter(mapped, "softPostpaddingDuration", function () {
					return null;
				});
				defineGetter(mapped, "duration", function () {
					if (mapped._data.taskDuration) {
						return getDurationMilliseconds(mapped._data.taskDuration);
					} else if (mapped._data.recordedDuration) {
						return getDurationMilliseconds(mapped._data.recordedDuration.text);
					} else if (mapped._data.scheduledDuration) {
						return getDurationMilliseconds(mapped._data.scheduledDuration);
					}
					return null;
				});
				defineGetter(mapped, "serviceId", function () {
					return mapped._data.refID || mapped._data.recordedCDSObjectID; //TODO: only have name at the moment is there a service ID in OTV5?
				});
				defineGetter(mapped, "shortDesc", function () {
					if (mapped._data.description) {
						return mapped._data.description.text || "";
					}
					return null;
				});
				defineGetter(mapped, "longDesc", function () {
					if (mapped._data.longDescription) {
						return mapped._data.longDescription.text || "";
					}
					return null;
				});
				defineGetter(mapped, "contentDesc", function () {
					if (mapped._data.longDescription) {
						return mapped._data.longDescription.text || "";
					}
					return null;
				});
				defineGetter(mapped, "keep", function () {
					return mapped._data.restricted;
				});
				defineGetter(mapped, "bookmark", function () {
					return null;
				});
				defineGetter(mapped, "parentalRating", function () {
					return mapped._data.rating.text || mapped._data.rating;
				});
				defineGetter(mapped, "recordingType", function () {
					if(mapped._data.matchingID){
						return $N.data.Recording.RECORDING_TYPE.SERIES;
					} else if (mapped._data.currentRecordTaskCount) {
					    if (parseInt(mapped._data.currentRecordTaskCount,10) > 1) {
					        return $N.data.Recording.RECORDING_TYPE.SERIES;
					    }
					}
					return $N.data.Recording.RECORDING_TYPE.SINGLE;
				});
				defineGetter(mapped, "image", function () {
					return mapped._data.albumArtURI || "";
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
				 * in Recording
				 * @method mapObject
				 * @param {Object} obj the object to map
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
				 * in Recording
				 * @method mapArray
				 * @param {Object} array the objects to map
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
		return $N.services.gateway.dlna.RecordingFactory;
	}
);