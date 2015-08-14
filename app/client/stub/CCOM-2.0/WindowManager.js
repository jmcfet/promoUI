/**
 * Stub for CCOM 2.0 Window manager
 */

var CCOM = CCOM || {};

CCOM.WindowManager = CCOM.WindowManager || (function () {
	var eventListeners = {};

    return {
        //inputEventSignalTypes
        INPUT_EVENT_TYPE_STEAL_KEY: 0,

        //winmanInputEventTypes
        KEY_PRESS: 101,
        KEY_RELEASE: 102,

        registerInputEvents: function (winInputEvent, callback) {

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


