/**
 * Stub for CCOM 2.0 ConditionalAccess
 */

var CCOM = CCOM || {};

CCOM.ConditionalAccess = CCOM.ConditionalAccess || (function () {
	var eventListeners = {};

    return {
        //caAccess
        BLACKED_OUT: 1,
        CLEAR: 2,
        DENIED: 3,
        DENIED_CHIPSET_PAIRING_REQUIRED: 4,
        DENIED_COPY_PROTECTED: 5,
        DENIED_DIALOG_REQUIRED: 6,
        DENIED_NO_VALID_CREDIT: 7,
        DENIED_PAIRING_REQUIRED: 8,
        DENIED_PARENTAL_CONTROL: 9,
        EMI_UNSUPPORTED: 10,
        FREE: 11,
        GRANTED: 12,
        NO_VALID_SECURE_DEVICE: 13,
        //mailPriority
        emergency: 101,
        high: 102,
        normal: 103,
        //popupPersistence
        //normal: 201, ??? tow normal value
        timeout: 202,
        userAck: 203,
        //productFlags
        IMPULSIVE: 301,
        MULTIPLE_PURCHASE: 302,
        NOT_LOADED: 303,
        OFFLINE_CONSUMPTION: 304,
        OFFLINE_PURCHASE: 305,
        ONLINE_PURCHASE: 306,
        PURCHASABLE: 307,
        PURCHASED: 308,
        SMS_PURCHASE: 309,
        //productType
        EVENT: 401,
        EVENT_PACKAGE: 402,
        FREE_PREVIEW: 403,
        N_OF_M_CHANNELS: 404,
        N_OF_M_EVENTS: 405,
        N_OF_M_SHOWINGS: 406,
        PAY_PER_TIME: 407,
        PPT_BY_POINTS: 408,
        RENTAL_SUBSCRIPTION: 409,
        SERVICE: 410,
        SERVICE_PACKAGE: 411,
        UNDEFINED: 412,
        VOD_PACKAGE: 413,
        VOD_RENTAL: 414,
        VOD_SUBSCRIPTION: 415,
        //smartcardFlags
        BLACKLISTED: 501,
        ERROR: 502,
        EXPIRED: 503,
        INCOMPATIBLE: 504,
        INVALID: 505,
        MUTE: 506,
        NEVER_PAIRED: 507,
        NOT_CERTIFIED: 508,
        NOT_PAIRED: 509,
        OK: 510,
        SUSPENDED: 511,
        //systemFlags
        SOFTWARE_UPGRADE_RECOMMENDED: 601,
        SOFTWARE_UPGRADE_REQUIRED: 602,

        //properties
        //no properties in CA Object

        //functions
        getEventInfo: function (eventId) {
            return {
                caAccess: 0,
                previewTime: 0,
                products: {}
            };
        },

        getIrdAllMail: function () {
            return {
                mailInfo: {}
            };
        },

        getIrdMail: function (mailId) {
            return {
                message: ""
            };
        },

        getIrdPopupMessage: function () {
            return {
                popupInfo: {}
            };
        },

        getServiceAccess: function (serviceId) {
			return {
				//FREE
                caAccess: 11
            };
        },

        getSmartcardInfo: function () {
            return {
                smartcardInfo: {
					smartcardSlotId: 0,
					smartcardStatus: "SC_OK",
					smartcardNum: "00142773428",
					serialNumber: "226896962133"
                }
            };
        },

        getSystemInfo: function () {
            return {
				systemInfo: {
					caSystemId: 0,
					name: "Conax",
					softwareVersion: "1.0",
					interfaceVersion: "1.1",
					chipsetId: 123,
					deviceId: 987
				}
            };
        },

        removeIrdMail: function (mailId) {
            return {
                error: {
                    domain: "com.opentv.ConditionalAccess",
                    name: "OperationFailed",
                    message: "The operation has failed because the mail ID does not exist."
                }
            };
        },

		addEventListener: function (event, callback) {
			if (eventListeners[event] === undefined) {
				eventListeners[event] = [];
			}
			eventListeners[event].push(callback);
		},

		removeEventListener: function (event, callback) {
			var listeners = eventListeners[event],
				i;
			for (i = 0; i < listeners.length; i++) {
				if (listeners[i] === callback) {
					listeners.splice(i, 1);
				}
			}
		}
	};
}());


