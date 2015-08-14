/**
 * Stub for CCOM 2.0 Application Manager
 */

var CCOM = CCOM || {};

CCOM.ApplicationManager = CCOM.ApplicationManager || (function () {
	var eventListeners = {};

    return {
        //o_appman_action_type_t
        REQUEST_TYPE_SHOW: 1,
        //o_appman_exit_reason_t
        APP_EXIT_ABNORMAL: 102,
        APP_EXIT_APP_CORRUPTED: 103,
        APP_EXIT_APP_DELETED: 104,
        APP_EXIT_FROM_REQUEST: 105,
        APP_EXIT_LOW_ON_RESOURCES: 106,
        APP_EXIT_NORMAL: 107,
        APP_EXIT_NO_MEMORY: 108,
        APP_EXIT_PERMISSION_DENIED: 109,
        APP_EXIT_SERVICE_NOT_FOUND: 110,
        APP_EXIT_SUSPENDED: 111,
        APP_EXIT_UNKNOWN: 112,
        //o_appman_launch_reason_t
        APP_LAUNCH_FROM_BOOT: 213,
        APP_LAUNCH_FROM_REQUEST: 214,
        APP_LAUNCH_FROM_SUSPEND: 215,
        APP_LAUNCH_UNKNOWN: 216,

        destroyApplication: function (appIdentifierInfo) {
            return {error: "error"};           
        },

        getAppPermissionInfo: function (appIdentifierInfo) {
            return {error: "error"};           
        },

        isApplicationRunning: function (appIdentifierInfo) {
            return {error: "error"};           
        },

        launchApplication: function (appIdentifierInfo) {
            return {error: "error"};           
        },

        listRunningApplications: function () {
            return {error: "error"};           
        },

        requestApplicationAction: function (appIdentifierInfo,actionType,playload) {
            return {error: "error"};
        },

        sendMessage: function (appIdentifierInfo,data) {
            return {error: "error"};
        },

        suspendAllApplications: function () {
            return {error: "error"};
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

