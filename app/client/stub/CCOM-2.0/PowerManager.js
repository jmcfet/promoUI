var CCOM = CCOM || {};

CCOM.Pwrmgr = (function () {

    var eventListeners = {},
        currentMode = 0;

    return {
        STANDBY_ON: 0,
        STANDBY_OFF: 1,
        LOW_POWER:2,
        UNKNOWN: 4,

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
                /*jslint eqeq:true*/
                if (listeners[i] == callback) {
                    listeners.splice(i, 1);
                }
                /*jslint eqeq:false*/
            }
        },

        userModeGet: function() {
            return currentMode;
        },

        userModeSet: function(newMode) {
            currentMode = newMode;
        }
    };
}());
