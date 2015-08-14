
var $N = $N || {};
$N.platform = $N.platform || {};
$N.platform.btv = $N.platform.btv || {};

$N.platform.btv.WHPVRRecordingFactory = (function () {

	var defineGetter,
		log = new $N.apps.core.Log("WHPVR", "WHPVRRecordingFactory"),
		TASK_TYPE = {
			REMINDER: "GRMDR",
			RECORDING: "REC",
			REBOOT: "REBOOT"
		},
		OBJECT_STATE = {
			BOOKED: 0,
			PROCESSING: 1,
			SUSPEND_PROCESSING: 2,
			STOP_PROCESSING: 3,
			PROCESSED: 4,
			FINAL: 5,
			ERROR: 6,
			DELETING: 7,
			DELETED: 8
		},
		COMPLETION_STATUS = {
			INVALID: 0,
			NONE: 1,
			PARTIAL: 2,
			FULL: 3
		},
		SCHEDULE_TASK_STATE = {
			TASK_STATE_INVALID: 0,
			TASK_STATE_WAITING_FOR_START: 1,
			TASK_STATE_RECORDING: 2,
			TASK_STATE_COMPLETED: 3,
			TASK_STATE_ERROR: 4,
			TASK_STATE_FATAL_ERROR: 5
		};
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

	/**
	 * @method convertISO8601toDate
	 * @private
	 * @param dtstr {String}
	 * @return {Integer} calculate the date in UTC milliseconds based on specified string.
	 */
	function convertISO8601toDate(dtstr) {
		var dtcomps = "",
			convdt = null;
		// replace anything but numbers by spaces
		dtstr = dtstr.replace(/\D/g, " ");
		// trim any hanging white space
		dtstr = dtstr.trim();
		// split on space
		dtcomps = dtstr.split(" ");
		// not all ISO 8601 dates can convert, as is
		// unless month and date specified, invalid
		if (dtcomps.length < 3) {
			return 0;
		} else if (dtcomps.length === 3) {
			convdt = new Date(Date.UTC(1970, 0, 1, dtcomps[0], dtcomps[1], dtcomps[2]));
			return convdt.getTime();
		}
		// modify month between 1 based ISO 8601 and zero based Date
		dtcomps[1]--;
		convdt = new Date(Date.UTC(dtcomps[0], dtcomps[1], dtcomps[2], dtcomps[3], dtcomps[4], dtcomps[5]));
		return convdt.getTime();
	}

	/**
	 * @method channelIdsTripletToServiceId
	 * @private
	 * @param channelIds {String}
	 * @return {String} service id.
	 */
	function channelIdsTripletToServiceId(channelIds) {
		var serviceId = "",
			ids = [],
			i,
			id;
		if (channelIds) {
			ids = channelIds.split(",");
			for (i = 0; i < ids.length; i++) {
				if (parseInt(ids[i], 10)) {
					break;
				}
			}
			if (i === ids.length) {
				return "";
			}
			for (i = 0; i < ids.length; i++) {
				id = parseInt(ids[i], 10).toString(16);
				serviceId += "0000".substr(0, 4 - id.length) + id;
			}
		}
		return serviceId;
	}

	/**
	 * @method checkDBServiceIdField
	 * @param {String} channelIdTriplet
	 * @return {String}
	 */
	function checkDBServiceIdField(channelIdTriplet) {
		var serviceId = "",
			result = {},
			resultArray = [];
		serviceId = channelIdsTripletToServiceId(channelIdTriplet);
		if (serviceId) {
			result = CCOM.EPG.getServicesRSByQuery("*", "serviceId='" + serviceId + "'", null);
			if (!result.error) {
				resultArray = result.getNext(1);
				result.reset();
				result = null;
				if (resultArray.length) {
					return serviceId;
				}
			}
		}
		serviceId = channelIdTriplet.split(",")[2];
		result = CCOM.EPG.getServicesRSByQuery("*", "broadcastServiceId='" + serviceId + "'", null);
		if (!result.error) {
			resultArray = result.getNext(1);
			result.reset();
			result = null;
			if (resultArray.length) {
				serviceId = resultArray[0].serviceId;
				return serviceId;
			}
		}
		return "";
	}

	function calculateCompletStatus(task) {
		var startTime = 0,
			endTime = 0,
			// Acceptable error range (5s)
			GAP_ERROR_RANGE = 5000,
			duration = 0;
		if (task.scheduledStartTime && task.scheduledStartTime.length > 0) {
			startTime = convertISO8601toDate(task.scheduledStartTime[0]);
		}
		if (task.scheduledEndTime && task.scheduledEndTime.length > 0) {
			endTime = convertISO8601toDate(task.scheduledEndTime[0]);
		}
		if (task.recordedDuration && task.recordedDuration.length > 0) {
			duration = convertISO8601toDate(task.recordedDuration[0]);
		}
		if (Math.abs(endTime - startTime - duration) <= GAP_ERROR_RANGE) {
			return COMPLETION_STATUS.FULL;
		}
		return COMPLETION_STATUS.PARTIAL;
	}

	function recordingMappedObject(obj, parentObject) {
		var whpvrDevice = parentObject,
			serviceId = "0",
			eventId = "",
			recordingEvent = null,
			genres = null,
			recordingExt = null,
			lang = null,
			i,
			mapped = {
				_data: obj
			};

		mapped._data.taskType = TASK_TYPE.RECORDING;
		mapped._data.objectState = OBJECT_STATE.FINAL;
		mapped._data.completeStatus = calculateCompletStatus(mapped._data);

		if (mapped._data.channelID && mapped._data.channelID.length > 0) {
			serviceId = channelIdsTripletToServiceId(mapped._data.channelID[0].value);
		}
		if (mapped._data.programID && mapped._data.programID.length > 0) {
			eventId = mapped._data.programID[0].value.split(",")[3];
			if (eventId === "(null)") {//MW changed to this if no available eventId
				eventId = "";
			}
			if (eventId) {
				recordingEvent = CCOM.EPG.getEventById(eventId);
			}
		}
		defineGetter(mapped, "whpvrDevice", function () {
			return whpvrDevice;
		});
		defineGetter(mapped, "taskId", function () {
			if (mapped._data.srsRecordTaskID && mapped._data.srsRecordTaskID.length > 0) {
				return parseInt(mapped._data.srsRecordTaskID[0], 10);
			}
			return 0;
		});
		defineGetter(mapped, "jobId", function () {
			if (mapped._data.srsRecordScheduleID && mapped._data.srsRecordScheduleID.length > 0) {
				return parseInt(mapped._data.srsRecordScheduleID[0], 10);
			}
			return 0;
		});
		defineGetter(mapped, "title", function () {
			return mapped._data.title;
		});
		defineGetter(mapped, "softPrepaddingDuration", function () {
			if (mapped._data.softPrepaddingDuration) {
				return mapped._data.softPrepaddingDuration;
			}
			return 0;
		});
		defineGetter(mapped, "softPostpaddingDuration", function () {
			if (mapped._data.softPostpaddingDuration) {
				return mapped._data.softPostpaddingDuration;
			}
			return 0;
		});
		defineGetter(mapped, "duration", function () {
			if (mapped._data.recordedDuration && mapped._data.recordedDuration.length > 0) {
				return convertISO8601toDate(mapped._data.recordedDuration[0]);
			}
			return 0;
		});
		defineGetter(mapped, "startTime", function () {
			if (mapped._data.scheduledStartTime && mapped._data.scheduledStartTime.length > 0) {
				return convertISO8601toDate(mapped._data.scheduledStartTime[0]);
			}
			return 0;
		});
		defineGetter(mapped, "endTime", function () {
			if (mapped._data.scheduledEndTime && mapped._data.scheduledEndTime.length > 0) {
				return convertISO8601toDate(mapped._data.scheduledEndTime[0]);
			}
			return 0;
		});
		defineGetter(mapped, "shortDesc", function () {
			if (mapped._data.description && mapped._data.description.length > 0) {
				return mapped._data.description[0];
			}
			return "";
		});
		defineGetter(mapped, "longDesc", function () {
			if (mapped._data.upnpLongDescription) {
				return mapped._data.upnpLongDescription;
			}
			return "";
		});
		defineGetter(mapped, "serviceId", function () {
			return serviceId;
		});
		defineGetter(mapped, "eventId", function () {
			return eventId;
		});
		defineGetter(mapped, "parentalRating", function () {
			if (mapped._data.rating && mapped._data.rating.length > 0) {
				return parseInt(mapped._data.rating[0].value, 10);
			}
			return "";
		});
		defineGetter(mapped, "url", function () {
			if (mapped._data.resource && mapped._data.resource.length > 0) {
				return mapped._data.resource[0].uri;
			}
			return "";
		});
		defineGetter(mapped, "recordingType", function () {
			if (mapped._data.seriesID && mapped._data.seriesID.length > 0) {
				return $N.data.Recording.RECORDING_TYPE.SERIES;
			} else {
				return $N.data.Recording.RECORDING_TYPE.SINGLE;
			}
		});
		defineGetter(mapped, "uiFolder", function () {
			if (mapped._data.userAnnotation && mapped._data.userAnnotation.length > 0) {
				return mapped._data.userAnnotation[0];
			} else {
				return "";
			}
		});
		defineGetter(mapped, "bookmark", function () {
			if (mapped._data.bookmarkID) {
				return whpvrDevice.getBookmarkById(mapped._data.id);
			}
			return 0;
		});
		defineGetter(mapped, "isPlayed", function () {
			return whpvrDevice.isRecordingPlayed(mapped._data.id);
		});
		defineGetter(mapped, "keep", function () {
			if (mapped._data.writeStatus && mapped._data.writeStatus.length > 0) {
				if (mapped._data.writeStatus[0] === "PROTECTED") {
					return 1;
				}
			}
			return 0;
		});
		defineGetter(mapped, "isAuthorized", function () {
			return true;
		});
		defineGetter(mapped, "isWHPVRTask", function () {
			return true;
		});
		defineGetter(mapped, "isWHPVRRecording", function () {
			return true;
		});

		// Getting extention information from local database
		if (recordingEvent && !recordingEvent.error) {
			genres = recordingEvent.genres || CCOM.EPG.getGenresByEventId(eventId);
			defineGetter(mapped, "netEventGenres", function () {
				return genres;
			});
			defineGetter(mapped, "seriesId", function () {
				return recordingEvent.seriesId;
			});
			defineGetter(mapped, "seasonId", function () {
				return recordingEvent.seasonId;
			});
			defineGetter(mapped, "episodeId", function () {
				return recordingEvent.episodeId;
			});
			defineGetter(mapped, "seriesName", function () {
				return recordingEvent.seriesName;
			});
			defineGetter(mapped, "netEpisodeName", function () {
				return recordingEvent.netEpisodeName;
			});
			lang = $N.app.constants.EVENT_EXTENDED_INFO.LANGUAGE;
			recordingExt = CCOM.EPG.getExtInfoByEventId(eventId, lang, 0);
			if (recordingExt && !recordingExt.error) {
				for (i = 0; i < recordingExt.length; i++) {
					if (recordingExt[i].extInfoKey === "Actors") {
						mapped.netActorCast = recordingExt[i].extInfoValue;
					} else if (recordingExt[i].extInfoKey === "Director") {
						mapped.netDirector = recordingExt[i].extInfoValue;
					} else if (recordingExt[i].extInfoKey === "country") {
						mapped.netCountry = recordingExt[i].extInfoValue;
					} else if (recordingExt[i].extInfoKey === "year") {
						mapped.netProdYear = recordingExt[i].extInfoValue;
					} else if (recordingExt[i].extInfoKey === "Originalname") {
						mapped.netOriginalName = recordingExt[i].extInfoValue;
					}
				}
			}
		} else {
			defineGetter(mapped, "seriesId", function () {
				if (mapped._data.seriesID && mapped._data.seriesID.length > 0) {
					return mapped._data.seriesID[0].value;
				}
				return 0;
			});
			defineGetter(mapped, "episodeId", function () {
				if (mapped._data.episodeID && mapped._data.episodeID.length > 0) {
					return mapped._data.episodeID[0];
				}
				return 0;
			});
		}
		return mapped;
	}

	function recordingMapArray(array, parentObject) {
		var i,
			mapped,
			mappedArray	= [];

		if (array && array.length > 0) {
			for (i = 0; i < array.length; i++) {
				mapped = recordingMappedObject(array[i], parentObject);
				mappedArray.push(mapped);
			}
		}
		return mappedArray;
	}

	function scheduleTaskGetMappedObject(obj, schedule) {
		var mapped = {
			_data: obj
		},
			event = null,
			eventEx = {},
			eventId = 0,
			lang,
			i,
			recordingType,
			serviceId = "",
			result = {},
			resultArray = [],
			genres = null;

		mapped._data.taskType = TASK_TYPE.RECORDING;
		if (obj.state === SCHEDULE_TASK_STATE.TASK_STATE_INVALID
				|| obj.state === SCHEDULE_TASK_STATE.TASK_STATE_ERROR
				|| obj.state === SCHEDULE_TASK_STATE.TASK_STATE_FATAL_ERROR) {
			mapped._data.objectState = OBJECT_STATE.ERROR;
		} else if (obj.state === SCHEDULE_TASK_STATE.TASK_STATE_WAITING_FOR_START) {
			mapped._data.objectState = OBJECT_STATE.BOOKED;
		} else if (obj.state === SCHEDULE_TASK_STATE.TASK_STATE_RECORDING) {
			mapped._data.objectState = OBJECT_STATE.PROCESSING;
		} else if (obj.state === SCHEDULE_TASK_STATE.TASK_STATE_COMPLETED) {
			mapped._data.objectState = OBJECT_STATE.FINAL;
			mapped._data.completeStatus = COMPLETION_STATUS.FULL;//FIXME for completeStatus
		}
		if (schedule) {
			defineGetter(mapped, "recordingType", function () {
				if (schedule.type === 3 || schedule.type === 2) {//CDS_EVENT or Manual
					recordingType = $N.data.Recording.RECORDING_TYPE.SINGLE;
				} else {
					recordingType = $N.data.Recording.RECORDING_TYPE.SERIES;
				}
				return recordingType;
			});
		}

		serviceId = checkDBServiceIdField(mapped._data.channelIds);
		eventId = obj.cdsEventObjectId;
		if (eventId) {
			eventId = eventId.substring("epg.".length);
			event = CCOM.EPG.getEventById(eventId);
		} else if (serviceId) {
			result = CCOM.EPG.getEventsRSByQuery("*", "startTime='" + String(obj.startDateTime) + "'" + " AND serviceId='" + serviceId + "'", "startTime");
			if (!result.error) {
				resultArray = result.getNext(1);
				result.reset();
				result = null;
				if (resultArray.length) {
					event = resultArray[0];
					eventId = event.eventId;
				}
			}
		}

		defineGetter(mapped, "whpvrDevice", function () {
			return mapped._data.whpvrDevice;
		});
		defineGetter(mapped, "isWHPVRScheduleTask", function () {
			return true;
		});
		defineGetter(mapped, "isWHPVRTask", function () {
			return true;
		});
		defineGetter(mapped, "taskId", function () {
			return mapped._data.taskId;
		});
		defineGetter(mapped, "eventId", function () {
			return eventId;
		});
		defineGetter(mapped, "jobId", function () {
			return mapped._data.scheduleId;
		});
		defineGetter(mapped, "title", function () {
			return mapped._data.title;
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
		defineGetter(mapped, "startTime", function () {
			return mapped._data.startDateTime;
		});
		defineGetter(mapped, "endTime", function () {
			return mapped._data.startDateTime + mapped._data.duration;
		});
		defineGetter(mapped, "serviceId", function () {
			return serviceId;
		});
		defineGetter(mapped, "uiFolder", function () {
			return schedule.userAnnotation;
		});

		if (event && !event.error) {
			genres = event.genres || CCOM.EPG.getGenresByEventId(event.eventId);
			defineGetter(mapped, "netEventGenres", function () {
				return genres;
			});
			defineGetter(mapped, "seriesId", function () {
				return event.seriesId;
			});
			defineGetter(mapped, "seasonId", function () {
				return event.seasonId;
			});
			defineGetter(mapped, "episodeId", function () {
				return event.episodeId;
			});
			defineGetter(mapped, "seriesName", function () {
				return event.seriesName;
			});
			defineGetter(mapped, "shortDesc", function () {
				return event.shortDesc;
			});
			defineGetter(mapped, "longDesc", function () {
				return event.longDesc;
			});
			defineGetter(mapped, "parentalRating", function () {
				return event.parentalRating;
			});
			defineGetter(mapped, "netEpisodeName", function () {
				return event.netEpisodeName;
			});
			lang = $N.app.constants.EVENT_EXTENDED_INFO.LANGUAGE;
			eventEx = CCOM.EPG.getExtInfoByEventId(eventId, lang, 0);
			if (eventEx && !eventEx.error) {
				/*To avoid jslint warning: no function is allowed in loop*/
				for (i = 0; i < eventEx.length; i++) {
					if (eventEx[i].extInfoKey === "Actors") {
						mapped.netActorCast = eventEx[i].extInfoValue;
					} else if (eventEx[i].extInfoKey === "Director") {
						mapped.netDirector = eventEx[i].extInfoValue;
					} else if (eventEx[i].extInfoKey === "country") {
						mapped.netCountry = eventEx[i].extInfoValue;
					} else if (eventEx[i].extInfoKey === "year") {
						mapped.netProdYear = eventEx[i].extInfoValue;
					} else if (eventEx[i].extInfoKey === "Originalname") {
						mapped.netOriginalName = eventEx[i].extInfoValue;
					}
				}
			}
		}
		return mapped;
	}

	function scheduleTaskGetMappedArray(array, schedule) {
		var i,
			mapped,
			mappedArray	= [];

		if (array.length > 0) {
			for (i = 0; i < array.length; i++) {
				mapped = scheduleTaskGetMappedObject(array[i], schedule);
				mappedArray.push(mapped);
			}
		}
		return mappedArray;
	}

	function scheduleTaskMapObject(obj, schedule) {
		if (obj) {
			return scheduleTaskGetMappedObject(obj, schedule);
		} else {
			return null;
		}
	}

	function scheduleTaskMapArray(array, schedule) {
		if (array) {
			return scheduleTaskGetMappedArray(array, schedule);
		} else {
			return [];
		}
	}

	return {
		recordingMappedObject: recordingMappedObject,
		recordingMapArray: recordingMapArray,
		scheduleTaskMapObject: scheduleTaskMapObject,
		scheduleTaskMapArray: scheduleTaskMapArray
	};
}());
