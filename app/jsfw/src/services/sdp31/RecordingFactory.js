/* global define */
define('jsfw/services/sdp/RecordingFactory',
	[
		'jsfw/data/Recording',
		'jsfw/apps/util/Util'
	],
	function (Recording, Util) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};

		$N.services.sdp.RecordingFactory = (function () {

			var defineGetter;
			if (Object.defineProperty) {
				defineGetter = function (obj, property, getterFunction) {
					Object.defineProperty(obj, property, {
						get: getterFunction,
						enumerable: true
					});
				};
			} else {
				defineGetter = function (obj, property, getterFunction) {
					obj.__defineGetter__(property, getterFunction);
				};
			}

			function getGuardTime(mapped, serviceLookup) {
				var service,
					serviceId;
				if (mapped._data.programmeMetaData && mapped._data.programmeMetaData.serviceId) {
					serviceId = mapped._data.programmeMetaData.serviceId;
					service = serviceLookup[serviceId];
					if (service && service._data && service._data.editorial && service._data.editorial.guardTime) {
						return service._data.editorial.guardTime * 1000;
					}
				}
				return null;
			}

			function getMappedObject(obj, serviceLookup) {
				var recordingType,
					mapped = {
						_data: obj,
						isNPVRRecording: true,
						_metadata : {}
					};

				if (obj.metadata) {
					obj.metadata.forEach(function (element) {
						mapped._metadata[element.key] = element.value;
					});
				}

				defineGetter(mapped, "taskId", function () {
					return mapped._data.id;
				});
				defineGetter(mapped, "jobId", function () {
					return null;
				});
				defineGetter(mapped, "seriesId", function () {
					return null;
				});
				defineGetter(mapped, "seasonId", function () {
					return null;
				});
				defineGetter(mapped, "episodeId", function () {
					return null;
				});
				defineGetter(mapped, "seriesName", function () {
					return null;
				});
				defineGetter(mapped, "title", function () {
					return (mapped._data.programmeMetaData && mapped._data.programmeMetaData.title) ? mapped._data.programmeMetaData.title : null;
				});
				defineGetter(mapped, "url", function () {
					return mapped._metadata.DeliveryUrl || null;
				});
				defineGetter(mapped, "eventId", function () {
					return mapped._data.programmeId || null;
				});
				defineGetter(mapped, "startTime", function () {
					return (mapped._data.programmeMetaData && mapped._data.programmeMetaData.startTime) ? mapped._data.programmeMetaData.startTime : null;
				});
				defineGetter(mapped, "endTime", function () {
					return (mapped._data.programmeMetaData && mapped._data.programmeMetaData.endTime) ? mapped._data.programmeMetaData.endTime : null;
				});
				defineGetter(mapped, "softPrepaddingDuration", function () {
					return getGuardTime(mapped, serviceLookup);
				});
				defineGetter(mapped, "softPostpaddingDuration", function () {
					return getGuardTime(mapped, serviceLookup);
				});
				defineGetter(mapped, "duration", function () {
					return (mapped._data.programmeMetaData && mapped._data.programmeMetaData._data && mapped._data.programmeMetaData._data.period) ? mapped._data.programmeMetaData._data.period.duration : null;
				});
				defineGetter(mapped, "serviceId", function () {
					return (mapped._data.programmeMetaData && mapped._data.programmeMetaData.serviceId) ? mapped._data.programmeMetaData.serviceId : null;
				});
				defineGetter(mapped, "shortDesc", function () {
					return (mapped._data.programmeMetaData && mapped._data.programmeMetaData.shortDesc) ? mapped._data.programmeMetaData.shortDesc : null;
				});
				defineGetter(mapped, "longDesc", function () {
					return (mapped._data.programmeMetaData && mapped._data.programmeMetaData.longDesc) ? mapped._data.programmeMetaData.longDesc : null;
				});
				defineGetter(mapped, "contentDesc", function () {
					return (mapped._data.programmeMetaData && mapped._data.programmeMetaData.contentDesc) ? mapped._data.programmeMetaData.contentDesc : null;
				});
				defineGetter(mapped, "keep", function () {
					return mapped._data.isprotected;
				});
				defineGetter(mapped, "bookmark", function () {
					return null;
				});
				defineGetter(mapped, "parentalRating", function () {
					return (mapped._data.programmeMetaData && mapped._data.programmeMetaData.parentalRating) ? mapped._data.programmeMetaData.parentalRating : null;
				});
				defineGetter(mapped, "recordingType", function () {
					return $N.data.Recording.RECORDING_TYPE.SINGLE;
				});
				defineGetter(mapped, "image", function () {
					return (mapped._data.programmeMetaData && mapped._data.programmeMetaData.promoImage) ? mapped._data.programmeMetaData.promoImage : "";
				});
				defineGetter(mapped, "status", function () {
					return mapped._data.status;
				});
				defineGetter(mapped, "casId", function () {
					var service = serviceLookup[mapped.serviceId];
					return service ? service.casId : null;
				});
				defineGetter(mapped, "availabilityEndDate", function () {
					var returnDate = $N.apps.util.Util.getDateFromISOString(mapped._data.availabilityEndDate);
					return (returnDate && returnDate instanceof Date) ? returnDate.getTime() : null;
				});
				return mapped;
			}

			function getMappedArray(array, serviceLookup) {
				var i,
					mapped,
					mappedArray	= [];

				if (array.length > 0) {
					for (i = 0; i < array.length; i++) {
						mapped = getMappedObject(array[i], serviceLookup);
						mappedArray.push(mapped);
					}
				}
				return mappedArray;
			}

			return {
				mapObject: function (obj, serviceLookup) {
					if (obj) {
						return getMappedObject(obj, serviceLookup);
					} else {
						return null;
					}
				},

				mapArray: function (array, serviceLookup) {
					if (array) {
			            return getMappedArray(array, serviceLookup);
					} else {
						return [];
					}
		        }
			};
		}());
		return $N.services.sdp.RecordingFactory;
	});
