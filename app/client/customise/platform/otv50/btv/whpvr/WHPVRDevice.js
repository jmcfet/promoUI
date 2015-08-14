/*global CCOM, WHPVRScheduler*/
/**
 * @class $N.platform.btv.WHPVRDevice
 * @constructor
 *
 * @requires $N.apps.core.Log
 * @requires $N.platform.system.Preferences
 */
function WHPVRDevice(hnDevice, deviceEventCallback) {
	this._log = new $N.apps.core.Log("WHPVR", "WHPVRDevice");
	this._log("WHPVRDevice", "Enter");

	this.WHPVR_BROWSE_MAX_CONTENT_NUM = 50;
	this.recordings = [];
	this.udn = hnDevice.udn;
	this.friendlyName = hnDevice.friendlyName;
	this._browseContainerHandle = null;
	this._deleteObjectHandle = null;
	this._updateObjectHandle = null;
	this._searchContainerHandle = null;
	this._searchDataCallback = null;
	this._hnDevice = hnDevice;
	this._timerUpdateRecordings = null;
	this._subscribeHandle = null;
	this._subscribeOperation = "";
	this._needUpdateRecordings = false;
	this._updateBookmarkHandle = null;
	this._browseObjectHandles = [];
	this._bookmarkArray = [];
	this.browseContainer();
	this.subscribeService();
	this.deviceEventCallback = deviceEventCallback;
	this._scheduler = new $N.platform.btv.WHPVRScheduler(this);
	this._scheduler.init();
	this._log("WHPVRDevice", "Exit");
}

/**
 * @method eventNotify
 * @param {String} eventName
 * @param {Object} event object in CCOM.HomeNetworking
 * @return {Boolean} return true when this event belong to this device, unless return false;
 */
WHPVRDevice.prototype.eventNotify = function (eventName, event) {
	switch (eventName) {
	case 'browseContainerOK':
		if (this._browseContainerHandle === event.handle) {
			this.browseContainerResultCallback(true, event);
			return true;
		}
		break;
	case 'browseContainerFailed':
		if (this._browseContainerHandle === event.handle) {
			this.browseContainerResultCallback(false, event);
			return true;
		}
		break;
	case 'deleteObjectOK':
		if (this._deleteObjectHandle === event.handle) {
			this.deleteObjectResultCallback(true, event);
			return true;
		}
		break;
	case 'deleteObjectFailed':
		if (this._deleteObjectHandle === event.handle) {
			this.deleteObjectResultCallback(false, event);
			return true;
		}
		break;
	case 'updateObjectOK':
		if (this._updateObjectHandle === event.handle) {
			this.updateObjectResultCallback(true, event);
			return true;
		}
		break;
	case 'updateObjectFailed':
		if (this._updateObjectHandle === event.handle) {
			this.updateObjectResultCallback(false, event);
			return true;
		}
		break;
	case 'searchContainerOK':
		if (this._searchContainerHandle === event.handle) {
			this.searchContainerResultCallback(true, event);
			return true;
		}
		break;
	case 'searchContainerFailed':
		if (this._searchContainerHandle === event.handle) {
			this.searchContainerResultCallback(false, event);
			return true;
		}
		break;
	case 'subscribeServiceOK':
		if (this._subscribeHandle === event.handle) {
			this.subscribeServiceResultCallback(true, event);
			return true;
		}
		break;
	case 'subscribeServiceFailed':
		if (this._subscribeHandle === event.handle) {
			this.subscribeServiceResultCallback(false, event);
			return true;
		}
		break;
	case 'updateBookmarkOK':
		if (this._updateBookmarkHandle === event.handle) {
			this.updateBookmarkResultCallback(true, event);
			return true;
		}
		break;
	case 'updateBookmarkFailed':
		if (this._updateBookmarkHandle === event.handle) {
			this.updateBookmarkResultCallback(false, event);
			return true;
		}
		break;
	case 'browseObjectOK':
		return this.browseObjectResultCallback(true, event);
	case 'browseObjectFailed':
		return this.browseObjectResultCallback(false, event);
	case 'onSubscribedEvent':
		if (event.eventInfo && event.eventInfo.udn && this.udn === event.eventInfo.udn) {
			this.onSubscribedEvent(event);
			return true;
		}
		break;
	default:
		break;
	}
	return false;
};

/**
 * @method release
 */
WHPVRDevice.prototype.release = function () {
	this._log("release", "Enter");
	if (this._timerUpdateRecordings) {
		clearTimeout(this._timerUpdateRecordings);
		this._timerUpdateRecordings = null;
	}
	this.unsubscribeService();
	this.recordings = [];
	this._bookmarkArray = [];
	this._browseObjectHandles = [];
	if (this._scheduler) {
		this._scheduler.schedulerRelease();
		this._scheduler = null;
	}
	this._log("release", "Exit");
};

/**
 * @method subscribeService
 */
WHPVRDevice.prototype.subscribeService = function () {
	this._subscribeOperation = "subscribeService";
	this._subscribeHandle = CCOM.HomeNetworking.subscribeService(this.udn, "ContentDirectory");
};

/**
 * @method unsubscribeService
 */
WHPVRDevice.prototype.unsubscribeService = function () {
	this._subscribeOperation = "cancelSubscribeService";
	this._subscribeHandle = CCOM.HomeNetworking.cancelSubscribedService(this.udn, "ContentDirectory");
};

/**
 * @method subscribeServiceResultCallback
 * @param {Boolean} successOrFailed
 * @param {Object} event object from CCOM.HomeNetworking.subscribeService when return 'subscribeServiceFailed' or 'subscribeServiceOK'
 */
WHPVRDevice.prototype.subscribeServiceResultCallback = function (successOrFailed, event) {
	this._log("subscribeServiceResultCallback", "Enter");
	if (successOrFailed) {
		this._log("subscribeServiceResultCallback", "operation:" + this._subscribeOperation + " - success");
	} else {
		this._log("subscribeServiceResultCallback", "operation:" + this._subscribeOperation + " - failed");
	}
	this._subscribeHandle = null;
	this._subscribeOperation = "";
	this._log("subscribeServiceResultCallback", "Exit");
};

/**
 * @method saveBookmark
 * @param {Object} task
 * @param {Number} bmPosition (player position)
 */
WHPVRDevice.prototype.saveBookmark = function (task, bmPosition) {
	this._log("saveBookmark", "Enter");
	this._log("saveBookmark", "bmPosition:" + bmPosition);
	if (!this._updateBookmarkHandle) {
		this._updateBookmarkHandle = CCOM.HomeNetworking.updateBookmark(this.udn, task._data.id, Math.floor(bmPosition), false);
	}
	this._log("saveBookmark", "Exit");
};

/**
 * @method updateBookmarkResultCallback
 * @param {Boolean} successOrFailed
 * @param {Object} event object from CCOM.HomeNetworking.updateBookmark when return 'updateBookmarkFailed' or 'updateBookmarkOK'
 */
WHPVRDevice.prototype.updateBookmarkResultCallback = function (successOrFailed, event) {
	this._log("updateBookmarkResultCallback", "Enter");
	if (successOrFailed) {
		this._log("updateBookmarkResultCallback", " - success");
	} else {
		this._log("updateBookmarkResultCallback", " - failed, Err:" + JSON.stringify(event));
	}
	this._updateBookmarkHandle = null;
	this._log("updateBookmarkResultCallback", "Exit");
};

/**
 * @method browseObject
 * @param {String} objectId
 */
WHPVRDevice.prototype.browseObject = function (objectId) {
	this._log("browseObject", "Enter");
	if (!this._browseObjectHandles[objectId]) {
		this._browseObjectHandles[objectId] = CCOM.HomeNetworking.browseObject(this.udn, objectId, "*");
	}
	this._log("browseObject", "Exit");
};

/**
 * @method browseObjectResultCallback
 * @param {Boolean} successOrFailed
 * @param {Object} event object from CCOM.HomeNetworking.browseObject when return 'browseObjectFailed' or 'browseObjectOK'
 */
WHPVRDevice.prototype.browseObjectResultCallback = function (successOrFailed, event) {
	this._log("browseObjectResultCallback", "Enter");
	var localUdn = $N.platform.system.Preferences.get($N.app.constants.DMR_UDN_CONFIG_PATH, true),
		objectId,
		pvrId;
	if (successOrFailed) {
		this._log("browseObjectResultCallback", " - success, objectId:" + objectId);
		objectId = event.content.id;
		if (event.content.className === "Bookmark" && this._browseObjectHandles[objectId] === event.handle) {
			if (localUdn.indexOf(event.content.deviceUdn) >= 0 && event.content.bookmarkedObjectID && event.content.bookmarkedObjectID.length > 0) {
				pvrId = event.content.bookmarkedObjectID[0];
				this._bookmarkArray[pvrId] = event.content.relativeTimePosition;
				this._log("browseObjectResultCallback", " - pvrId:" + pvrId + ",bm:" + event.content.relativeTimePosition);
			}
			delete this._browseObjectHandles[objectId];
			return true;
		}
	} else {
		for (objectId in this._browseObjectHandles) {
			if (this._browseObjectHandles[objectId] === event.handle) {
				this._log("browseObjectResultCallback", " - failed - objectId:" + objectId);
				delete this._browseObjectHandles[objectId];
				return true;
			}
		}
	}
	this._log("browseObjectResultCallback", "Exit");
	return false;
};

/**
 * @method getBookmarkById
 * @param {String} pvrId
 */
WHPVRDevice.prototype.getBookmarkById = function (pvrId) {
	this._log("getBookmarkById", "Enter");
	if (this._bookmarkArray[pvrId]) {
		return this._bookmarkArray[pvrId];
	}
	this._log("getBookmarkById", "Not found bookmark");
	return 0;
};

/**
 * Get the played status of whpvr recording, based on bookmark.
 * @method isRecordingPlayed
 * @param {String} pvrId
 */
WHPVRDevice.prototype.isRecordingPlayed = function (pvrId) {
	if (this._bookmarkArray[pvrId] || this._bookmarkArray[pvrId] === 0) {
		this._log("isRecordingPlayed", "ret - true, pvrId:" + pvrId);
		return true;
	}
	this._log("isRecordingPlayed", "ret - false because no bookmark for this recording," + pvrId);
	return false;
};

/**
 * Check if the recordings are required to update.
 * @method onSubscribedEvent
 * @param {Object} event object returned from "onSubscribedEvent" in CCOM.HomeNetworking
 */
WHPVRDevice.prototype.onSubscribedEvent = function (event) {
	//this._log("onSubscribedEvent", "Enter");
	if (event.eventInfo.eventType === "CdsContainerUpdateIDs" && event.eventInfo.eventValue.indexOf("pvr") === 0) {
		//required to update recordings
		this._needUpdateRecordings = true;
		this._log("onSubscribedEvent", "pvr - event.eventInfo: " + JSON.stringify(event.eventInfo));
		this._updateRecordings();
	}
	//this._log("onSubscribedEvent", "Exit");
};

/**
 * @method _updateRecordings
 */
WHPVRDevice.prototype._updateRecordings = function () {
	var DELAYUPDATE = 2000,
		me = this;
	if (this._timerUpdateRecordings) {
		clearTimeout(this._timerUpdateRecordings);
		this._timerUpdateRecordings = null;
	}

	/*
	 * Taking a delay to update is to ensure only once operation when get repeat events.
	 */
	this._timerUpdateRecordings = setTimeout(function () {
		me.browseContainer();
		this._timerUpdateRecordings = null;
	}, DELAYUPDATE);
};

/**
 * @method updateTask
 * @param {Object} reqMetaData JSON style object
 */
WHPVRDevice.prototype.updateTask = function (task, reqMetaData) {
	var oldCds = {},
		newCds = {},
		currentCds = task._data;
	this._log("updateTask", "Enter");
	if (task.isWHPVRRecording) {
		oldCds.objectType = currentCds.objectType;
		oldCds.parentId = currentCds.parentId;
		oldCds.id = currentCds.id;
		oldCds.restricted = currentCds.restricted;
		oldCds.title = currentCds.title;
		oldCds["class"] = currentCds["class"];
		oldCds.className = currentCds.className;
		oldCds.userAnnotation = currentCds.userAnnotation;
		oldCds.writeStatus = currentCds.writeStatus;

		newCds.objectType = currentCds.objectType;
		newCds.parentId = currentCds.parentId;
		newCds.id = currentCds.id;
		newCds.restricted = currentCds.restricted;
		newCds.title = currentCds.title;
		newCds["class"] = currentCds["class"];
		newCds.className = currentCds.className;
		newCds.userAnnotation = currentCds.userAnnotation;
		newCds.writeStatus = currentCds.writeStatus;
		if (reqMetaData && reqMetaData.uiFolder) {
			newCds.userAnnotation = [reqMetaData.uiFolder];
		} else if (reqMetaData && reqMetaData.keep) {
			if (reqMetaData.keep === 0) {
				newCds.writeStatus = ["WRITABLE"];
			} else {
				newCds.writeStatus = ["PROTECTED"];
			}
		}
		this._updateObjectHandle = CCOM.HomeNetworking.updateObject(this.udn, oldCds, newCds);
		this._log("updateTask", this.friendlyName + ", handle:" + this._deleteObjectHandle);
	}
	this._log("updateTask", "Exit");
};

/**
 * @method updateObjectResultCallback
 * @param {Boolean} successOrFailed, true for success and false for failed.
 * @param {Object} event
 */
WHPVRDevice.prototype.updateObjectResultCallback = function (successOrFailed, event) {
	this._log("updateObjectResultCallback", "Enter");
	if (successOrFailed) {
		this._log("updateObjectResultCallback", "handle:" + this._updateObjectHandle + " - success");
	} else {
		this._log("updateObjectResultCallback", "handle:" + this._updateObjectHandle + " - failed");
	}
	this._updateObjectHandle = null;
	this._log("updateObjectResultCallback", "Exit");
};

/**
 * @method _searchContainer
 * @param {String} containerId
 * @param {String} searchCriteria
 * @param {String} sortCriteria
 * @param {String} filter
 * @param {Number} startIndex
 * @param {Number} maxResults
 */
WHPVRDevice.prototype._searchContainer = function (containerId, searchCriteria, sortCriteria, filter, startIndex, maxResults) {
	this._log("searchContainer", "Enter");
	this._searchContainerHandle = CCOM.HomeNetworking.searchContainer(this.udn, containerId, searchCriteria, sortCriteria, filter, startIndex, maxResults);
	this._log("searchContainer", this.friendlyName + ", handle:" + this._searchContainerHandle);
	this._log("searchContainer", "Exit");
};

WHPVRDevice.prototype.searchByCriteria = function (criteria, properties, dataCallback, exactMatch, sort) {
	this._log("searchByCriteria", "Enter");
	this._searchDataCallback = dataCallback;
	this._searchContainer("pvr", criteria, "dc:title", "*", 0, this.WHPVR_BROWSE_MAX_CONTENT_NUM);
	this._log("searchByCriteria", "Exit");
};

WHPVRDevice.prototype.searchByActorsDirector = function (keyword, properties, dataCallback, exactMatch, sort) {
	this._log("searchByActorsDirector", "Enter");
	this._searchDataCallback = dataCallback;
	//this._searchContainer("pvr", criteria, sort, properties, 0, 999);
	this._log("searchByActorsDirector", "Exit");
};

/**
 * @method searchContainerResultCallback
 * @param {Boolean} successOrFailed, true for success and false for failed.
 * @param {Object} event
 */
WHPVRDevice.prototype.searchContainerResultCallback = function (successOrFailed, event) {
	this._log("searchContainerResultCallback", "Enter");
	var searchResult = [];
	if (successOrFailed) {
		this._log("searchContainerResultCallback", "handle:" + this._searchContainerHandle + " - success");
		if (this._searchDataCallback) {
			this.retrieveBookmarks(event.content);
			searchResult = $N.platform.btv.WHPVRRecordingFactory.recordingMapArray(event.content, this);
			this._searchDataCallback(searchResult);
		}
	} else {
		this._log("searchContainerResultCallback", "handle:" + this._searchContainerHandle + " - failed");
	}
	this._searchContainerHandle = null;
	this._log("searchContainerResultCallback", "Exit");
};

/**
 * @method isSearchFinished
 * @param {Boolean}
 */
WHPVRDevice.prototype.isSearchFinished = function () {
	return this._searchContainerHandle === null;
};

/**
 * @method deleteTask
 * @param {String} objectId
 */
WHPVRDevice.prototype.deleteTask = function (task) {
	var objectId;
	this._log("deleteTask", "Enter");
	if (task.isWHPVRRecording) {
		objectId = task._data.id;
		this._deleteObjectHandle = CCOM.HomeNetworking.deleteObject(this.udn, objectId);
		this._log("deleteTask", this.friendlyName + ", objectId:" + objectId + ", handle:" + this._deleteObjectHandle);
	} else if (task.isWHPVRScheduleTask) {
		this._scheduler.schedulerDeleteTask(task);
	}
	this._log("deleteTask", "Exit");
};

/**
 * @method browseContainerResultCallback
 * @param {Boolean} successOrFailed, true for success and false for failed.
 * @param {Object} event
 */
WHPVRDevice.prototype.deleteObjectResultCallback = function (successOrFailed, event) {
	this._log("deleteObjectResultCallback", "Enter");
	if (successOrFailed) {
		this._log("deleteObjectResultCallback", "handle:" + this._deleteObjectHandle + " - success");
	} else {
		this._log("deleteObjectResultCallback", "handle:" + this._deleteObjectHandle + " - failed");
	}
	this._deleteObjectHandle = null;
	this._log("deleteObjectResultCallback", "Exit");
};

/**
 * @method browseContainer
 */
WHPVRDevice.prototype.browseContainer = function () {
	this._log("browseContainer", "Enter");
	this._browseContainerHandle = CCOM.HomeNetworking.browseContainer(this.udn, "pvr", "", "*", 0, this.WHPVR_BROWSE_MAX_CONTENT_NUM);
	this.recordings = [];
	this._log("browseContainer", "Exit");
};

/**
 * @method retrieveBookmarks
 */
WHPVRDevice.prototype.retrieveBookmarks = function (contents) {
	this._log("retrieveBookmarks", "Enter");
	var i,
		len = contents.length;
	//this._bookmarkArray = [];
	this._browseObjectHandles = [];
	for (i = 0; i < len; i++) {
		if (contents[i].bookmarkID) {
			this.browseObject(contents[i].bookmarkID[0]);
			this._log("retrieveBookmarks", " - objectId:" + contents[i].bookmarkID[0]);
		}
	}
	this._log("retrieveBookmarks", "Exit");
};

/**
 * @method browseContainerResultCallback
 * @param {Boolean} successOrFailed, true for success and false for failed.
 * @param {Object} event
 */
WHPVRDevice.prototype.browseContainerResultCallback = function (successOrFailed, event) {
	this._log("browseContainerResultCallback", "Enter");
	var i;
	if (successOrFailed) {
		this._log("browseContainerResultCallback", "friendlyName:" + this.friendlyName);
		this.retrieveBookmarks(event.content);
		this.recordings = $N.platform.btv.WHPVRRecordingFactory.recordingMapArray(event.content, this);
	} else {
		this.recordings = [];
	}

	this._log("browseContainerResultCallback", "successOrFailed: " + successOrFailed + ", " + this._needUpdateRecordings);
	if (this._needUpdateRecordings) {
		this.deviceEventCallback("recordingUpdated", this.udn);
		this._needUpdateRecordings = false;
	}
	this._browseContainerHandle = null;
	this._log("browseContainerResultCallback", "Exit");
};

WHPVRDevice.prototype.getSchedules = function () {
	return this._scheduler.schedulerGetTasks();
};

WHPVRDevice.prototype.requestEventRecording = function (metaData) {
	this._scheduler.requestEventRecording(metaData);
};

WHPVRDevice.prototype.requestSeriesRecording = function (metaData) {
	this._scheduler.requestSeriesRecording(metaData);
};

WHPVRDevice.prototype.deleteSeriesSchedule = function (seriesId) {
	this._scheduler.schedulerDeleteSeries(seriesId);
};

WHPVRDevice.prototype.deleteSingleSchedule = function (event) {
	this._scheduler.schedulerDeleteSingle(event);
};

WHPVRDevice.prototype.getTaskByEvent = function (event) {
	return this._scheduler.getTaskByEvent(event);
};

var $N = $N || {};
$N.platform = $N.platform || {};
$N.platform.btv = $N.platform.btv || {};
$N.platform.btv.WHPVRDevice = WHPVRDevice;

