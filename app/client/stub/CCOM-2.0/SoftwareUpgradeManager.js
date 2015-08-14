/**
 * Stub for CCOM 2.0 Software Upgrade Manager
 */

var CCOM = CCOM || {};

CCOM.SoftwareUpgradeManager = CCOM.SoftwareUpgradeManager || (function () {
	var eventListeners = {};

    return {
        //o_sum_error_t
        O_SUM_ERROR_DOWNLOAD_FAILED: 0,
        O_SUM_ERROR_FAILED: 1,
        O_SUM_ERROR_INVALID_IMAGE: 2,
        O_SUM_ERROR_INVALID_PARAMS: 3,
        O_SUM_ERROR_NO_UPGRADE_REQUESTED: 4,
        O_SUM_ERROR_PERMISSION_DENIED: 5,
        O_SUM_ERROR_SCHEDULE_FAILED: 6,
        O_SUM_ERROR_UPGRADE_PENDING: 7,
        O_SUM_ERROR_USER_CANCELLED: 8,

        //o_sum_state_t
        O_SUM_STATE_DOWNLOAD_COMPLETE: 9,
        O_SUM_STATE_DOWNLOAD_PROGRESS: 10,
        O_SUM_STATE_DOWNLOAD_SCHEDULED: 11,
        O_SUM_STATE_ERROR: 12,
        O_SUM_STATE_IDLE: 13,
        O_SUM_STATE_IMAGE_AVAILABLE: 14,
        O_SUM_STATE_REBOOT_SCHEDULED: 15,
        O_SUM_STATE_STOPPING: 16,
        O_SUM_STATE_UPDATE_COMPLETE: 17,

        getUpgradeStatus: function () {
            return {error:"error"};
        },

        requestUpgrade: function (isCancel,upgradeInfo) {
            return {error:"error"};
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
			for (i = 0; i < listeners.length; i++) {
				if (listeners[i] === callback) {
					listeners.splice(i, 1);
				}
			}
		}
	};
}());


