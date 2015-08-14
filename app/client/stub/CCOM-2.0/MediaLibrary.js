/**
 * Stub for CCOM 2.0 MediaLibrary
 */

var CCOM = CCOM || {};

CCOM.MediaLibrary = CCOM.MediaLibrary || (function () {

	var TOTAL_HARD_DRIVE_SPACE = 1024;
	var FREE_HARD_DRIVE_SPACE = 512;

	var eventListeners = {};

	var raiseEvent = function (event, parameter) {
		var listeners = eventListeners[event];
		var i;
		if (listeners) {
			for (i = 0; i < listeners.length; i++) {
				listeners[i](parameter);
			}
		}
	};

	return {
		//ContentModifyType
		AVAILABLE: 1,
		DELETED: 2,
		UNKNOWN: 3,
		//DiskSpaceEventType
		RED_ALERT_EXCEEDED: 101,
		//FsCode
		FAT16_OVER_32M: 201,
		FAT16_UPTO_32M: 202,
		FAT32: 203,
		INVALID: 204,
		//SFS
		MediumCommand: 301,
		ASSOCIATE: 302,
		MOUNT: 303,
		UNKNOWN: 304,
		//MediumMode
		PVR: 305,
		ZAPPER0: 306,
		ZAPPER1: 307,
		//PartitionStatus
		BUSY: 401,
		FORMAT_FAILED: 402,
		FORMAT_REQUIRED: 403,
		FSCK_STARTED: 404,
		INVALID: 405,
		MOUNTED: 406,
		MOUNT_FAILED: 407,
		UNMOUNTED: 408,
		UNMOUNTING: 409,
		UNMOUNT_FAILED: 410,
		//mediaScanReason
		databaseFull: 501,
		diskError: 502,
		internalError: 503,
		normal: 504,
		//mediaScanState
		scanFailed: 601,
		scanStarted: 602,
		scanStopped: 603,

		associateMedia: function (command,mediumName) {
			raiseEvent("associateMediaFailed",
				{error: {
						domain: "com.opentv.MediaLibrary",
						name: "GenericError",
						message: ""
					}
				});
			return null;
		},

		deleteContent: function (medialibId,purgeMetaData) {
			raiseEvent("deleteContentFailed",
				{error: {
						domain: "com.opentv.MediaLibrary",
						name: "GenericError",
						message: ""
					}
				});
			return null;
		},

		getAllConnectedMedia: function () {
			raiseEvent("getAllConnectedMediaFailed",
				{error: {
						domain: "com.opentv.MediaLibrary",
						name: "GenericError",
						message: ""
					}
				});
			return null;
		},

		getAssociatedMedia: function () {
			raiseEvent("getAssociatedMediaFailed",
				{error: {
						domain: "com.opentv.MediaLibrary",
						name: "GenericError",
						message: ""
					}
				});
			return null;
		},

		getStbMode: function () {
			raiseEvent("getStbModeFailed",
				{error: {
						domain: "com.opentv.MediaLibrary",
						name: "GenericError",
						message: ""
					}
				});
			return null;
		},

		registerMediaEvent: function () {
			raiseEvent( "registerMediaEventFailed",
				{error: {
						domain: "com.opentv.MediaLibrary",
						name: "GenericError",
						message: ""
					}
				});
			return null;
		},

		getTotalPartitionSpace: function (partitionName) {
			raiseEvent("getTotalPartitionSpaceOK", {totalSpace: TOTAL_HARD_DRIVE_SPACE});
		},

		getFreePartitionSpace: function (partitionName) {
			raiseEvent("getFreePartitionSpaceOK", {freeSpace: FREE_HARD_DRIVE_SPACE});
		},

		addEventListener: function (event, callback) {
			if (eventListeners[event] === undefined) {
				eventListeners[event] = [];
			}
			eventListeners[event].push(callback);
		},

		removeEventListener: function (event, callback) {
			var listeners = eventListeners[event];
			var i;
			if (listeners) {
				for (i = 0; i < listeners.length; i++) {
					if (listeners[i] === callback) {
						listeners.splice(i, 1);
					}
				}
			}
		},

		deleteContent: function (taskId, is) {

		},

		updateEntry: function (taskId, entryObj) {
			CCOM.Scheduler.updateTask(taskId, entryObj);
			return {};
		},

		getEntryRSByQuery: function (fields, criteria, order) {
			return CCOM.Scheduler.getEntryRSByQuery(fields, criteria, order);
		},

		fireEvent: raiseEvent
	};
}());
