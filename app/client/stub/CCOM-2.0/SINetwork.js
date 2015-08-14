/**
 * Stub for CCOM 2.0 MediaLibrary
 */

var CCOM = CCOM || {};

CCOM.SINetwork = CCOM.SINetwork || (function () {

	var eventListeners = {},
		raiseEvent = function (event, parameter) {
			var listeners = eventListeners[event],
				i;
			if (listeners) {
				for (i = 0; i < listeners.length; i++) {
					listeners[i](parameter);
				}
			}
		};

    return {
        //ScanErrorCondition    
        BUSY: 1,
        CONFIGURATION_LOCKED: 2,
        CONNECTION_ERROR: 3,
        DATABASE_FULL: 4,
        RESOURCE_UNAVAILABLE: 5,
        SCAN_CANCELED: 6,
        SI_ERROR: 7,
        TIMEOUT_OCCURRED: 8,
        UNKNOWN_ERROR: 9,

		addEventListener: function (event, callback) {
			if (eventListeners[event] === undefined) {
				eventListeners[event] = [];
			}
			eventListeners[event].push(callback);
		},

		removeEventListener: function (event, callback) {
			var listeners = eventListeners[event],
				i;
			if (listeners) {
				for (i = 0; i < listeners.length; i++) {
					if (listeners[i] === callback) {
						listeners.splice(i, 1);
					}
				}
			}
		},

        lockConfiguration: function () { raiseEvent("lockConfigurationOK"); },
        unlockConfiguration: function () { },

        scan: function () { 
            raiseEvent("onScanComplete");
            // return result
            return { error:"error" }; 
        },

        cancelScan: function ( scanHandle ) {

        },

        getConnectionInfo: function ( sourceUri )   {
            return {error:"error"};
        },

        getScanProgress: function ( scanHandle )   {
            return {error:"error"};
        },

		fireEvent: raiseEvent
	};
}());
