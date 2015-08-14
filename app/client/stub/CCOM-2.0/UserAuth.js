/**
 * Stub for CCOM 2.0 UserAuth
 */
var CCOM = CCOM || {};

CCOM.UserAuth = CCOM.UserAuth || (function () {
	var USERS = [],
		USER_TYPES = {
			MASTER: 1,
			CUSTOM: 2,
			DEFAULT: 3
		},
		currentUser = null,
		eventListeners = {},
		DEFAULT_USER_AGE = 18,
		DEFAULT_RESTRICTED_CHANNELS = [],
		raiseEvent = function (event, parameter) {
			var listeners = eventListeners[event],
				i;
			if (listeners) {
				for (i = 0; i < listeners.length; i++) {
					listeners[i](parameter);
				}
			}
		};

	function addUser(type, pin, property) {
		var userObj = {
			type: type,
			pin: pin,
			property: property
		};
		USERS.push(userObj);
	}

	function getMasterPin() {
		var i;
		for (i = 0; i < USERS.length; i++) {
			if (USERS[i].type === USER_TYPES.MASTER) {
				return USERS[i].pin;
			}
		}
	}

	function getDefaultUser() {
		var i;
		for (i = 0; i < USERS.length; i++) {
			if (USERS[i].type === USER_TYPES.DEFAULT) {
				return USERS[i];
			}
		}
	}

	function getDefaultUserIndex() {
		var i;
		for (i = 0; i < USERS.length; i++) {
			if (USERS[i].type === USER_TYPES.DEFAULT) {
				return i;
			}
		}
	}

	function getUserForPin(pin) {
		var i;
		for (i = 0; i < USERS.length; i++) {
			if (USERS[i].pin === pin) {
				return USERS[i];
			}
		}
	}

	function getUserIndexForPin(pin) {
		var i;
		for (i = 0; i < USERS.length; i++) {
			if (USERS[i].pin === pin) {
				return i;
			}
		}
	}

    return {
        //PolicyType
        POLICY_NONE: 1,
        POLICY_UNTIL_MAX_TIMEOUT: 2,
        POLICY_UNTIL_NEXT_CHANNEL: 3,
        POLICY_UNTIL_NEXT_EVENT: 4,
        POLICY_UNTIL_TIMEOUT: 5,

		changeMasterPin: function (masterPin, newPin) {
			var index;
			if (masterPin === getMasterPin()) {
				index = getUserIndexForPin(masterPin);
				USERS[index].pin = newPin;
				raiseEvent("changeMasterPinOK", {});
			} else {
				raiseEvent("changeMasterPinFailed", {error: {}});
			}
		},
		createMasterPin: function () {

		},
		deleteMasterPin: function (masterPin) {
			var storedMasterPin = getMasterPin();
			if (masterPin === storedMasterPin) {
				this.setCurrentUserProfile(masterPin);
				USERS = [];
				raiseEvent("deleteMasterPinOK", {});
			}
			raiseEvent("deleteMasterPinFailed", {error: {}});
		},
		disableSystem: function (masterPin) {
			var storedMasterPin = getMasterPin();
			if (masterPin === storedMasterPin) {
				this.setCurrentUserProfile(storedMasterPin);
				raiseEvent("disableSystemOK", {});
			}
			raiseEvent("disableSystemFailed", {error: {}});
		},
		enableSystem: function () {
			addUser(USER_TYPES.MASTER, "1234", {userAge: 100, restrictedChannels: []});
			addUser(USER_TYPES.DEFAULT, "1111", {userAge: DEFAULT_USER_AGE, restrictedChannels: DEFAULT_RESTRICTED_CHANNELS});
			this.setCurrentUserProfile("1111");
			raiseEvent("enableSystemOK", {});
		},
		getCurrentUserProfile: function () {
			var i;
			for (i = 0; i < USERS.length; i++) {
				if (USERS[i].pin === currentUser) {
					raiseEvent("getCurrentUserProfileOK", {property: USERS[i].property});
				}
			}
		},
		getPolicyModifier: function () {

		},
		getAllRestrictedChannels: function () {},
		getUserProfile: function (userPin) {
			var retrievedUser,
				eventRaised = false;
			if (!userPin) {
				retrievedUser = getDefaultUser();
			} else if (userPin === getMasterPin()) {
				eventRaised = true;
				raiseEvent("getUserProfileFailed", {error: {name: "PinOrCurrentUserIsMaster"}});
			} else {
				retrievedUser = getUserForPin();
			}
			if (retrievedUser) {
				raiseEvent("getUserProfileOK", {property: retrievedUser.property});
			} else if (!eventRaised) {
				raiseEvent("getUserProfileFailed", {error: {}});
			}
		},
		modifyUserProfile: function (masterPin, userPin, profileObj) {
			var retrievedUserIndex,
				prop;
			if (masterPin === getMasterPin()) {
				if (!userPin) {
					retrievedUserIndex = getDefaultUserIndex();
				} else {
					retrievedUserIndex = getUserIndexForPin(userPin);
				}
				for (prop in profileObj) {
					if (profileObj.hasOwnProperty(prop)) {
						USERS[retrievedUserIndex].property[prop] = profileObj[prop];
					}
				}
				raiseEvent("modifyUserProfileOK", {});
			} else {
				raiseEvent("modifyUserProfileFailed", {error: {}});
			}
		},
		setCurrentUserProfile: function (pin) {
			currentUser = pin;
			raiseEvent("setCurrentUserProfileOK", {property: getUserForPin(pin).property});
		},
		setPolicyModifier: function () {

		},
		getUsers: function () {
			return USERS;
		},
		reset: function () {
			USERS = [];
			currentUser = null;
			DEFAULT_USER_AGE = 18;
			DEFAULT_RESTRICTED_CHANNELS = [];
        },
        resetDefaultProfile: function () {
			USERS = [];
			currentUser = null;
			DEFAULT_USER_AGE = 18;
            DEFAULT_RESTRICTED_CHANNELS = [];

            raiseEvent("resetDefaultProfileOK", {});
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


