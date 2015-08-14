/* global define, $N, window */
/**
 * Class that allows interaction with the head end locker service
 * @class $N.services.sdp.NPVRManager
 * @constructor
 * @param {Object} locker LockerService instance
 * @param {String} [cacheRefreshBuffer] Buffer period to apply before attempting a cache refresh (Minutes)
 * @param {String} [cacheRefreshRetryInterval] Period after which to attempt cache refresh if cache is not updated as expected (Minutes)
 * @param {Function} [initCompleteCallback] Callback to execute once account info and cache have been initialised
*/
define('jsfw/services/sdp/NPVRManager',
	[
		'jsfw/apps/core/Log',
		'jsfw/services/sdp/MetadataService',
		'jsfw/services/sdp/EPG',
		'jsfw/services/sdp/RecordingFactory',
		'jsfw/services/sdp/ServiceFactory',
		'jsfw/services/sdp/EPGEventFactory'
	],
	function (Log, MetadataService, EPG, RecordingFactory, ServiceFactory, EPGEventFactory) {

		var DEFAULT_REFRESH_BUFFER = 3 * 60 * 1000,
			DEFAULT_RETRY_INTERVAL = 2 * 60 * 1000,
			MAXIMUM_EPOCH_DATE = 8640000000000000,
			ERROR = {
				SCHEDULED_RECORDING_NOT_FOUND: "Recording not found or not in a scheduled state",
				COMPLETED_RECORDING_NOT_FOUND: "Recording not found or not in a completed state",
				NO_VALID_RECORDING_ID_PROVIDED: "No valid recording id was provided",
				INVALID_MDS_EVENT: "Invalid MDS event provided",
				MDS_EVENT_NOT_SCHEDULED: "MDS event not scheduled",
				INCOMPLETE_PARAMS: "Recording not scheduled - incomplete parameters",
				RECORDING_ALREADY_SCHEDULED: "Recording already scheduled",
				FAILED_TO_UPDATE: "Failed to update recording request",
				FAILED_TO_CREATE: "Failed to create recording request",
				FAILED_TO_DELETE: "Failed to delete recording request",
				PROTECTED_RECORDING: "Failed to delete recording. Recording is protected",
				NO_SPID: "Unable to get NPVR account status. SPID not available",
				FAILED_TO_GET_ACCOUNT_DETAILS: "Failed to get account details",
				FAILED_TO_GET_NPVR_STATUS: "Failed to get account NPVR status",
				FAILED_TO_REFRESH_CACHE: "Failed to refresh cache",
				FAILED_TO_GET_STORAGE: "Failed to get available storage from locker service",
				ACCOUNT_NOT_SET: "AccountNumber not set",
				RECORDING_NOT_FOUND: "Recording not found",
				NO_DATA: "No data returned"
			},
			SORT_ORDER = {
				ASC: "ASC",
				DESC: "DESC"
			},
			STATUS = {
				NEW: "NEW",
				RECORDING: "RECORDING",
				RECORDED: "RECORDED",
				DELETED: "DELETED"
			},
			MAX_RESULTS = 9999,
			UNLIMITED_QUOTA = 3599996400;

		/*
		 * Private helper function that creates a lookup for the given data and key.
		 */
		function createLookup(data, key) {
			var lookup = {},
				i,
				len;

			if (data && key) {
				for (i = 0, len = data.length; i < len; i++) {
					lookup[data[i][key]] = data[i];
				}
			}
			return lookup;
		}

		/*
		 * Maps the programmeMetaData object on the RecordingRequest
		 */
		function mapEvents(recordings, services) {
			var i,
				len;

			for (i = 0, len = recordings.length; i < len; i++) {
				if (recordings[i].programmeMetaData) {
					recordings[i].programmeMetaData = $N.services.sdp.EPGEventFactory.mapObject(recordings[i].programmeMetaData, services);
				}
			}
			return recordings;
		}

		/*
		 * Private helper function that sorts recordings into sortField order. NOTE: sortField must be on root level of the object.
		 */
		function getSortedRecordings(recordingsArray, sortField, sortOrder) {
			var recording,
				isDescending,
				compare = function (a, b) {
					var result;
					if (a[sortField] < b[sortField]) {
						result = isDescending ? 1 : -1;
					} else if (a[sortField] > b[sortField]) {
						result = isDescending ? -1 : 1;
					} else {
						result = 0;
					}
					return result;
				};

			isDescending = (sortOrder === SORT_ORDER.DESC) ? true : false;
			if (recordingsArray && recordingsArray.length) {
				if (sortField) {
					recording = recordingsArray[0];
					if (recording[sortField]) {
						return recordingsArray.sort(compare);
					}
				}
				return recordingsArray;
			}
			return [];
		}

		function NPVRManager(locker, cacheRefreshBuffer, cacheRefreshRetryInterval, initCompleteCallback) {
			initCompleteCallback = initCompleteCallback || function () {};
			this._log = new $N.apps.core.Log("sdp", "NPVRManager");
			this._eventLookup = {};
			this._servicesLookup = {};
			this._recordingByProgrammeIdLookup = {};
			this._recordingByRecordingIdLookup = {};
			this._allRecordingsArray = [];
			this._completedRecordingsArray = [];
			this._scheduledRecordingsArray = [];
			this._activeRecordingsArray = [];
			this._refreshTimer = null;
			this._lockerService = locker;
			this._refreshBuffer = (cacheRefreshBuffer * 60 * 1000) || DEFAULT_REFRESH_BUFFER;
			this._refreshRetryInterval = (cacheRefreshRetryInterval * 60 * 1000) || DEFAULT_RETRY_INTERVAL;
			this._createServicesCache();
			this._fetchAccountDetails(initCompleteCallback);
			this._refreshCache(initCompleteCallback);
		}

		/**
		 * Gets and saves account details for the current logged in user
		 * @method _fetchAccountDetails
		 * @async
		 * @private
		 */
		NPVRManager.prototype._fetchAccountDetails = function (callback) {
			var me = this,
				successCallback = function (context) {
					if (context) {
						me._accountUid = context.accountUid;
						me._accountNumber = context.accountNumber;
						me._spid = context.spid;
						me._accountLookupComplete = true;
						if (me._cacheRefreshComplete) {
							callback();
						}
					} else {
						callback({error: ERROR.NO_DATA});
					}
				},
				failureCallback = function (error) {
					me._log("_fetchAccountDetails", ERROR.FAILED_TO_GET_ACCOUNT_DETAILS);
					callback({error: ERROR.FAILED_TO_GET_ACCOUNT_DETAILS});
				};

			callback = callback || function () {};
			$N.services.sdp.ServiceFactory.get("ContextService").getCurrentContext(this, successCallback, failureCallback);
		};

		/**
		 * Returns the NPVR status for the currently logged in account. The client application should decide how often to call this method
		 * in order to check if NPVR is enabled, disabled or cancelled.
		 * @param {Function} callback The callback function to execute once the request is complete
		 * @param {Object} callback.result Object containing the result of the getNpvrStatus request
		 * @param {String} [callback.result.data] Contains the NPVR status if the request was successful
		 * @param {String} [callback.result.error] Contains an error string if request was unsuccessful
		 * @async
		 * @method fetchNpvrStatusForAccount
		 */
		NPVRManager.prototype.fetchNpvrStatusForAccount = function (callback) {
			var me = this,
				successCallback = function (result) {
					var i,
						len,
						response = {};

					if (result) {
						for (i = 0, len = result.length; i < len; i++) {
							if (result[i].name === "NPVR_STATUS") {
								response.data = result[i].value;
							}
						}
					} else {
						me._log("fetchNpvrStatusForAccount", ERROR.NO_DATA);
						response.error = ERROR.NO_DATA;
					}
					callback(response);
				},
				failureCallback = function (error) {
					me._log("fetchNpvrStatusForAccount", ERROR.FAILED_TO_GET_NPVR_STATUS);
					callback({error: ERROR.FAILED_TO_GET_NPVR_STATUS});
				};

			callback = callback || function () {};
			if (this._spid) {
				$N.services.sdp.ServiceFactory.get("VisitorService").getGroup(this, successCallback, failureCallback, "COR_ACCOUNT", "NPVR_PROFILE", "NPVR_SMALL", this._spid);
			} else {
				this._log("fetchNpvrStatusForAccount", ERROR.NO_SPID);
				callback({error: ERROR.NO_SPID});
			}
		};

		/**
		 * Processes the response from the recordings service
		 * @method _processResponse
		 * @async
		 * @private
		 */
		NPVRManager.prototype._processResponse = function (recordings, callback) {
			var i,
				me = this,
				isFirstScheduledRecording = true,
				nextStatusChangeTime = null,
				prePaddingDuration,
				postPaddingDuration,
				cacheRefreshListeners;

			me._recordingByProgrammeIdLookup = {};
			me._activeRecordingsArray.length = 0;
			me._completedRecordingsArray.length = 0;
			me._scheduledRecordingsArray.length = 0;
			me._allRecordingsArray.length = 0;

			if (recordings) {
				for (i = 0; i < recordings.length; i++) {
					if (recordings[i].status !== STATUS.DELETED) {
						prePaddingDuration = recordings[i].softPrepaddingDuration || 0;
						postPaddingDuration = recordings[i].softPostpaddingDuration || 0;
						switch (recordings[i].status) {
						case STATUS.NEW:
							if (recordings[i].startTime && (recordings[i].startTime - prePaddingDuration) < (nextStatusChangeTime || MAXIMUM_EPOCH_DATE)) {
								nextStatusChangeTime = recordings[i].startTime - prePaddingDuration;
							}
							me._scheduledRecordingsArray.push(recordings[i]);
							break;
						case STATUS.RECORDING:
							if (recordings[i].endTime && (recordings[i].endTime + postPaddingDuration) < (nextStatusChangeTime || MAXIMUM_EPOCH_DATE)) {
								nextStatusChangeTime = recordings[i].endTime + postPaddingDuration;
							}
							me._activeRecordingsArray.push(recordings[i]);
							break;
						case STATUS.RECORDED:
							if (recordings[i].availabilityEndDate && recordings[i].availabilityEndDate < (nextStatusChangeTime || MAXIMUM_EPOCH_DATE)) {
								nextStatusChangeTime = recordings[i].availabilityEndDate;
							}
							me._completedRecordingsArray.push(recordings[i]);
							break;
						}
						me._recordingByProgrammeIdLookup[recordings[i]._data.programmeId] = recordings[i];
						me._recordingByRecordingIdLookup[recordings[i].taskId] = recordings[i];
						me._allRecordingsArray.push(recordings[i]);
					}
				}
			}
			if (nextStatusChangeTime) {
				me._setUpRefreshTimer(me, nextStatusChangeTime);
			}

			this._cacheRefreshComplete = true;
			me._fireEvent("cacheRefresh");
			if (this._accountLookupComplete) {
				callback();
			}
		};

		/**
		 * Private method that creates a services lookup object
		 * @method _createServicesCache
		 * @async
		 * @private
		 */
		NPVRManager.prototype._createServicesCache = function () {
			var me = this,
				fetchChannelsCallback = function (response) {
					me._servicesLookup = createLookup(response, "serviceId");
				};

			$N.services.sdp.EPG.fetchAllChannels(fetchChannelsCallback);
		};

		/**
		 * Private method that fetches recordings from the locker service and performs object mapping.
		 * @method _refreshCache
		 * @async
		 * @private
		 */
		NPVRManager.prototype._refreshCache = function (callback) {
			var me = this,
				recordings,
				sort = [{"id": "asc"}];

			callback = callback || function () {};

			function failureCallback(response) {
				me._log("_refreshCache", ERROR.FAILED_TO_REFRESH_CACHE);
				callback({error: response});
			}

			function fetchRecordingsSuccess(data) {
				if (data && data.results && data.results.recordingrequests) {
					recordings = data.results.recordingrequests;
					me._processResponse($N.services.sdp.RecordingFactory.mapArray(mapEvents(recordings, me._servicesLookup), me._servicesLookup), callback);
				} else {
					callback({error: ERROR.NO_DATA});
				}
			}
			this._lockerService.getAllRecordings(fetchRecordingsSuccess, failureCallback, null, sort, null, 0, null);
		};

		/**
		 * Creates a recording refresh timer
		 * @method _setUpRefreshTimer
		 * @private
		 */
		NPVRManager.prototype._setUpRefreshTimer = function (caller, nextStatusChangeTime) {
			var me = caller,
				currentTime = new Date().getTime(),
				interval,
				calculatedIntervalFromRecording = (nextStatusChangeTime - currentTime);

			if (me._refreshTimer) {
				clearTimeout(me._refreshTimer);
			}
			interval = calculatedIntervalFromRecording > 0 ? calculatedIntervalFromRecording + this._refreshBuffer : this._refreshRetryInterval;
			me._refreshTimer = setTimeout(function () { me._refreshCache(); }, interval);
		};

		/**
		 * Fires an internal event listener for the given event name
		 * @method _fireEvent
		 * @private
		 */
	    NPVRManager.prototype._fireEvent = function (eventName, payload) {
	        if (this._eventLookup[eventName]) {
	            this._eventLookup[eventName].forEach(function (callback) {
	                callback(payload || null);
	            });
	        }
	    };

		/**
		 * Registers a callback for a given event name.
		 * @method addEventListener
		 * @param {String} eventName name of the event
		 * @param {Function} callback callback to execute when event occurs
		 */
		NPVRManager.prototype.addEventListener = function (eventName, callback) {
			if (!this._eventLookup[eventName]) {
	            this._eventLookup[eventName] = [];
	        }
	        this._eventLookup[eventName].push(callback);
		};

		/**
		 * Unregisters a callback for a given event name
		 * @method removeEventListener
		 * @param {String} eventName name of the event
		 * @param {Function} callback callback to remove
		 */
		NPVRManager.prototype.removeEventListener = function (eventName, callback) {
			if (this._eventLookup[eventName]) {
	            this._eventLookup[eventName] = this._eventLookup[eventName].filter(function (value) { return value !== callback; });
	        }
		};

		/**
		 * Forces a refresh of the local Recordings cache
		 * @async
		 * @method forceCacheRefresh
		 * @param {Function} callback callback to execute once caching is complete.
		 */
		NPVRManager.prototype.forceCacheRefresh = function (callback) {
			this._refreshCache(callback);
		};

		/**
		 * Returns recordings for the current user regardless of recording status
		 * @method getAllRecordings
		 * @param {String} [sortField] Recording property to sort by.
		 * @param {String} [sortOrder] Sort order to sort recordings by. Must be one of the exposed SortOrders enums
		 * @return {Object} recordings Recordings object
		 */
		NPVRManager.prototype.getAllRecordings = function (sortField, sortOrder) {
			var tmpArray = this._allRecordingsArray.slice(0);
			return getSortedRecordings(tmpArray, sortField, sortOrder);
		};

		/**
		 * Returns all scheduled recordings for the current user
		 * @method getScheduledRecordings
		 * @param {String} [sortField] Recording property to sort by. Must be one of the exposed SortTypes enums
		 * @param {String} [sortOrder] Sort order to sort recordings by. Must be one of the exposed SortOrders enums
		 * @return {Array} recordings array of Recording objects
		 */
		NPVRManager.prototype.getScheduledRecordings = function (sortField, sortOrder) {
			var tmpArray = this._scheduledRecordingsArray.slice(0);
			return getSortedRecordings(tmpArray, sortField, sortOrder);

		};

		/**
		 * Returns all active recordings for the current user
		 * @method getActiveRecordings
		 * @param {String} [sortField] Recording property to sort by.
		 * @param {String} [sortOrder] Sort order to sort recordings by. Must be one of the exposed SortOrders enums
		 * @return {Object} recordings Recordings object
		 */
		NPVRManager.prototype.getActiveRecordings = function (sortField, sortOrder) {
			var tmpArray = this._activeRecordingsArray.slice(0);
			return getSortedRecordings(tmpArray, sortField, sortOrder);
		};

		/**
		 * Returns all completed recordings for the current user
		 * @method getCompletedRecordings
		 * @param {String} [sortField] Recording property to sort by.
		 * @param {String} [sortOrder] Sort order to sort recordings by. Must be one of the exposed SortOrders enums
		 * @return {Object} recordings Recordings object
		 */
		NPVRManager.prototype.getCompletedRecordings = function (sortField, sortOrder) {
			var tmpArray = this._completedRecordingsArray.slice(0);
			return getSortedRecordings(tmpArray, sortField, sortOrder);
		};
		/**
		 * Returns the recording object associated with the given ID
		 * @method getRecordingById
		 * @param {String} recordingId ID of the recording
		 * @return {Object} recording Matched recording object
		 */
		NPVRManager.prototype.getRecordingById = function (recordingId) {
			return this._recordingByRecordingIdLookup[recordingId] || null;
		};

		/**
		 * Returns a recording object for the supplied MDS event if such a recording exists
		 * @method getRecordingByEvent
		 * @param {Object} event MDS event object to return recording for
		 * @return {Object} Object containing multiple recording objects
		 */
		NPVRManager.prototype.getRecordingByEvent = function (event) {
			return this._recordingByProgrammeIdLookup[event.eventId] || null;
		};

		/**
		 * Schedules a recording for a given MDS event. Will not submit the request to the locker service if
		 * a recording is already scheduled for the given event
		 * @async
		 * @method requestEventRecording
		 * @param {Object} mdsEvent - MDS event to schedule recording for
		 * @param {Function} callback Callback to execute when complete
		 * @param {Object} callback.result Object containing the result of the request
		 * @param {String} [callback.result.data] Contains a status string if the request was successful
		 * @param {String} [callback.result.error] Contains an error string if request was unsuccessful
		 */
		NPVRManager.prototype.requestEventRecording = function (mdsEvent, callback) {
			var me = this,
				response = {
					requestId: mdsEvent.eventId || null
				},
				accountNumber = this._accountNumber,
				programmeId = mdsEvent ? mdsEvent.eventId : null,
				successCallback = function (data) {
					response.data = data;
					me._refreshCache(function (error) { callback(error || response); });
				},
				failureCallback = function (error) {
					me._log("requestEventRecording", ERROR.FAILED_TO_CREATE);
					response.error = error;
					callback(response);
				};

			callback = callback || function () {};
			if (programmeId && accountNumber) {
				if (!this._recordingByProgrammeIdLookup[programmeId]) {
					this._lockerService.createRecordingRequest(successCallback, failureCallback, programmeId, accountNumber);
				} else {
					this._log("requestEventRecording", ERROR.RECORDING_ALREADY_SCHEDULED);
					failureCallback(ERROR.RECORDING_ALREADY_SCHEDULED);
				}
			} else {
				this._log("requestEventRecording", ERROR.INCOMPLETE_PARAMS);
				failureCallback(ERROR.INCOMPLETE_PARAMS);
			}
		};

		/**
		 * Deletes a completed recording
		 * @async
		 * @method deleteRecording
		 * @param {Object} recording Recording to delete
		 * @param {Function} callback Callback to execute when complete
		 * @param {Object} callback.result Object containing the result of the request
		 * @param {String} [callback.result.data] Contains a status string if the request was successful
		 * @param {String} [callback.result.error] Contains an error string if request was unsuccessful
		 */
		NPVRManager.prototype.deleteRecording = function (recording, callback) {
			var cachedRecording;

			callback = callback || function () {};
			if (recording && recording.taskId) {
				cachedRecording = this._recordingByRecordingIdLookup[recording.taskId];
				if (cachedRecording && (cachedRecording.status === STATUS.RECORDED)) {
					if (!cachedRecording.keep) {
						this._doDelete(callback, recording.taskId);
					} else {
						this._log("deleteRecording", ERROR.PROTECTED_RECORDING);
						callback({request: recording.taskId, error: ERROR.PROTECTED_RECORDING});
					}
				} else {
					this._log("deleteRecording", ERROR.COMPLETED_RECORDING_NOT_FOUND);
					callback({request: recording.taskId, error: ERROR.COMPLETED_RECORDING_NOT_FOUND});
				}
			} else {
				this._log("deleteRecording", ERROR.NO_VALID_RECORDING_ID_PROVIDED);
				callback({error: ERROR.NO_VALID_RECORDING_ID_PROVIDED});
			}
		};

		/**
		 * Cancels a scheduled MDS event recording
		 * @async
		 * @method cancelEventRecording
		 * @param {Object} mdsEvent MDS event to cancel scheduled recording for
		 * @param {Function} callback Callback to execute when complete
		 * @param {Object} callback.result Object containing the result of the request
		 * @param {String} [callback.result.data] Contains a status string if the request was successful
		 * @param {String} [callback.result.error] Contains an error string if request was unsuccessful
		 */

		NPVRManager.prototype.cancelEventRecording = function (mdsEvent, callback) {
			var recording;

			callback = callback || function () {};
			if (mdsEvent && mdsEvent.eventId) {
				recording = this._recordingByProgrammeIdLookup[mdsEvent.eventId];
				if (recording && recording.taskId && (recording.status === STATUS.NEW || recording.status === STATUS.RECORDING)) {
					this._doDelete(callback, recording.taskId);
				} else {
					this._log("cancelEventRecording", ERROR.MDS_EVENT_NOT_SCHEDULED);
					callback({request : mdsEvent.eventId, error : ERROR.MDS_EVENT_NOT_SCHEDULED});
				}
			} else {
				this._log("cancelEventRecording", ERROR.INVALID_MDS_EVENT);
				callback({request : mdsEvent.eventId, error : ERROR.INVALID_MDS_EVENT});
			}
		};

		/**
		 * Cancels a scheduled recording for a given recording
		 * @async
		 * @method cancelScheduledRecording
		 * @param {Object} recording Recording to cancel
		 * @param {Function} callback Callback to execute when complete
		 * @param {Object} callback.result Object containing the result of the request
		 * @param {String} [callback.result.data] Contains a status string if the request was successful
		 * @param {String} [callback.result.error] Contains an error string if request was unsuccessful
		 */
		NPVRManager.prototype.cancelScheduledRecording = function (recording, callback) {
			var cachedRecording;

			callback = callback || function () {};
			if (recording && recording.taskId) {
				cachedRecording = this._recordingByRecordingIdLookup[recording.taskId];
				if (cachedRecording && (cachedRecording.status === STATUS.NEW || cachedRecording.status === STATUS.RECORDING)) {
					this._doDelete(callback, recording.taskId);
				} else {
					this._log("cancelScheduledRecording", ERROR.SCHEDULED_RECORDING_NOT_FOUND);
					callback({request: recording.taskId, error: ERROR.SCHEDULED_RECORDING_NOT_FOUND});
				}
			} else {
				this._log("cancelScheduledRecording", ERROR.NO_VALID_RECORDING_ID_PROVIDED);
				callback({error: ERROR.NO_VALID_RECORDING_ID_PROVIDED});
			}
		};

		/**
		 * Executes a LockerService delete request.
		 * @private
		 * @async
		 */
		NPVRManager.prototype._doDelete = function (callback, recordingId) {
			var me = this,
				cachedRecording,
				response = {
					requestId: recordingId || null
				},
				successCallback = function (data) {
					response.data = data;
					me._refreshCache(function (error) { callback(error || response); });
				},
				failureCallback = function (error) {
					me._log("_doDelete", ERROR.FAILED_TO_DELETE);
					response.error = error;
					callback(response);
				};

			this._lockerService.deleteRecordingRequest(successCallback, failureCallback, recordingId);
		};

		/**
		 * Determines if there is a scheduled recording for the given MDS event
		 * @method isEventScheduled
		 * @param {Object} mdsEvent MDS event to check scheduled recording for
		 * @return {Boolean}
		 */
		NPVRManager.prototype.isEventScheduled = function (mdsEvent) {
			var recording;

			if (mdsEvent && mdsEvent.eventId) {
				recording = this._recordingByProgrammeIdLookup[mdsEvent.eventId];
				if (recording && recording.status === STATUS.NEW) {
					return true;
				}
			}
			return false;
		};

		/**
		 * Determines if a recording corresponding to the given MDS event is currently in progress.
		 * @method isEventRecordingNow
		 * @param {Object} mdsEvent MDS event object used to check recordings for
		 * @return {Boolean}
		 */
		NPVRManager.prototype.isEventRecordingNow = function (mdsEvent) {
			var recording,
				isRecordingNow = false;

			if (mdsEvent && mdsEvent.eventId) {
				recording = this._recordingByProgrammeIdLookup[mdsEvent.eventId];
				isRecordingNow = (recording && recording.status === STATUS.RECORDING) ? true : false;
			}
			return isRecordingNow;
		};

		/**
		 * Returns the status of a scheduled recording corresponding to the supplied MDS event.
		 * @method getEventRecordingStatus
		 * @param {Object} mdsEvent MDS event object to check recording status for
		 * @return {String} String representation of the recording status.
		 */
		NPVRManager.prototype.getEventRecordingStatus = function (mdsEvent) {
			return mdsEvent && mdsEvent.eventId && this._recordingByProgrammeIdLookup[mdsEvent.eventId] ? this._recordingByProgrammeIdLookup[mdsEvent.eventId].status : ERROR.RECORDING_NOT_FOUND;
		};

		/**
		 * Protects a recording
		 * @async
		 * @method protectRecording
		 * @param {Object} recording Recording to protect
		 * @param {Function} callback Callback to execute when complete
		 * @param {Object} callback.result Object containing the result of the request
		 * @param {String} [callback.result.data] Contains a status string if the request was successful
		 * @param {String} [callback.result.error] Contains an error string if request was unsuccessful
		 */
		NPVRManager.prototype.protectRecording = function (recording, callback) {
			this._updateProtectionStatus(recording.taskId, callback, true);
		};

		/**
		 * Unprotects a recording
		 * @async
		 * @method unprotectRecording
		 * @param {Object} recording Recording to unprotect
		 * @param {Function} callback Callback to execute when complete
		 * @param {Object} callback.result Object containing the result of the request
		 * @param {String} [callback.result.data] Contains a status string if the request was successful
		 * @param {String} [callback.result.error] Contains an error string if request was unsuccessful
		 */
		NPVRManager.prototype.unprotectRecording = function (recording, callback) {
			this._updateProtectionStatus(recording.taskId, callback, false);
		};

		/**
		 * Updates the protection status for a given recording.
		 * @method _updateProtectionStatus
		 * @async
		 * @private
		 */
		NPVRManager.prototype._updateProtectionStatus = function (recordingId, callback, protectValue) {
			var me = this,
				response = {
					requestId: recordingId || null
				},
				updateObject = {},
				updateProtectionSuccess = function (data) {
					response.data = data;
					me._refreshCache(function (error) { callback(error || response); });
				},
				updateProtectionFailure = function (error) {
					response.error = error;
					callback(response);
					me._log("_updateProtectionStatus", ERROR.FAILED_TO_UPDATE);
				};

			if (recordingId) {
				if (this._accountNumber) {
					updateObject.isprotected = protectValue;
					updateObject.accountNumber = this._accountNumber;
					this._lockerService.updateRecordingRequest(updateProtectionSuccess, updateProtectionFailure, recordingId, updateObject);
				} else {
					this._log("_updateProtectionStatus", ERROR.ACCOUNT_NOT_SET);
					updateProtectionFailure(ERROR.ACCOUNT_NOT_SET);
				}
			} else {
				this._log("_updateProtectionStatus", ERROR.NO_VALID_RECORDING_ID_PROVIDED);
				updateProtectionFailure(ERROR.NO_VALID_RECORDING_ID_PROVIDED);
			}
		};

		/**
		 * Fetches available storage size for the current user
		 * @async
		 * @method fetchAvailableStorage
		 * @param {Function} callback Callback to execute when complete. Will be passed a number that represents the
		 * available amount of storage for an account expressed in seconds. (Available storage is total storage - used storage)
		 * @param {Object} callback.result Object containing the result of the request
		 * @param {String} [callback.result.data] Contains a status string if the request was successful
		 * @param {String} [callback.result.error] Contains an error string if request was unsuccessful
		 */
		NPVRManager.prototype.fetchAvailableStorage = function (callback) {
			var me = this,
				response = {},
				fetchAvailableStorageFailure = function (error) {
					me._log("fetchAvailableStorage", ERROR.FAILED_TO_GET_STORAGE);
					response.error = error;
					callback(response);
				},
				fetchAvailableStorageSuccess = function (data) {
					if (data) {
						response.data = (parseInt(data.quotausage.quotaTotal, 10) -  parseInt(data.quotausage.currentUsage, 10));
					} else {
						response.error = ERROR.NO_DATA;
					}
					callback(response);
				};

			callback = callback || function () {};
			if (this._accountNumber) {
				this._lockerService.getQuotaUsage(fetchAvailableStorageSuccess, fetchAvailableStorageFailure, this._accountNumber);
			} else {
				this._log("fetchAvailableStorage", ERROR.ACCOUNT_NOT_SET);
				callback({error: ERROR.ACCOUNT_NOT_SET});
			}
		};

		/**
		 * Fetches total storage size for the current user
		 * @async
		 * @method fetchTotalStorage
		 * @param {Function} callback Callback to execute when complete. Will be passed a number that represents the
		 * total amount of storage for an account expressed in seconds.
		 * @param {Object} callback.result Object containing the result of the request
		 * @param {String} [callback.result.data] Contains a status string if the request was successful
		 * @param {String} [callback.result.error] Contains an error string if request was unsuccessful
		 */
		NPVRManager.prototype.fetchTotalStorage = function (callback) {
			var me = this,
				response = {},
				fetchTotalStorageFailure = function (error) {
					me._log("fetchTotalStorage", ERROR.FAILED_TO_GET_STORAGE);
					response.error = error;
					callback(response);
				},
				fetchTotalStorageSuccess = function (data) {
					if (data) {
						response.data = parseInt(data.quotausage.quotaTotal, 10);
					} else {
						response.error = ERROR.NO_DATA;
					}
					callback(response);
				};

			callback = callback || function () {};
			if (this._accountNumber) {
				this._lockerService.getQuotaUsage(fetchTotalStorageSuccess, fetchTotalStorageFailure, this._accountNumber);
			} else {
				this._log("fetchTotalStorage", ERROR.ACCOUNT_NOT_SET);
				callback({error: ERROR.ACCOUNT_NOT_SET});
			}
		};

		/**
		 * Defines constants for status types,
		 * one of NEW, RECORDING or RECORDED
		 * @property {String} STATUS
		 */
		NPVRManager.prototype.STATUS = STATUS;

		/**
		 * Defines enumeration to sort either in ascending or descending order.
		 * One of ASC or DESC
		 * @property {String} SORT_ORDER
		 */
		NPVRManager.prototype.SORT_ORDER = SORT_ORDER;

		/**
		 * Defines constants for error types,
		 * one of:
		 *
		 * SCHEDULED_RECORDING_NOT_FOUND:
		 * COMPLETED_RECORDING_NOT_FOUND:
		 * NO_VALID_RECORDING_ID_PROVIDED:
		 * MDS_EVENT_NOT_SCHEDULED:
		 * INCOMPLETE_PARAMS:
		 * RECORDING_ALREADY_SCHEDULED:
		 * FAILED_TO_UPDATE:
		 * FAILED_TO_CREATE:
		 * FAILED_TO_DELETE:
		 * PROTECTED_RECORDING:
		 * NO_SPID:
		 * FAILED_TO_GET_ACCOUNT_DETAILS:
		 * FAILED_TO_GET_NPVR_STATUS:
		 * FAILED_TO_REFRESH_CACHE:
		 * FAILED_TO_GET_STORAGE:
		 * ACCOUNT_NOT_SET:
		 * RECORDING_NOT_FOUND:
		 * NO_DATA:
		 * INVALID_MDS_EVENT:
		 * @property {String} ERROR
		 */
		NPVRManager.ERROR = ERROR;

		/**
		 * Defines the value that represents unlimited quota usage
		 * @property {Number} UNLIMITED_QUOTA
		 */
		NPVRManager.UNLIMITED_QUOTA = UNLIMITED_QUOTA;

		/**
		 * Dispatched when cache has been refreshed due a recording status changed or recording being added/cancelled/deleted
		 * @event cacheRefresh
		 */

		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};
		$N.services.sdp.NPVRManager = NPVRManager;
		return NPVRManager;
	});
