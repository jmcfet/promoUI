/**
 * CCOM 2.0
 * ParentalControl deals with functions that determine whether a given programme or channel can be
 * viewed, given the current maturity rating and parental controls set on the STB. Covers blocking /
 * time-locking channels
 *
 * @class $N.platform.ca.ParentalControl
 * @singleton
 * @requires $N.platform.apps.core.Log
 * @requires $N.platform.system.Preferences
 * @requires $N.platform.ca.PINHandler
 * @author gstacey
 */

/*global CCOM */
define('jsfw/platform/ca/ParentalControl',
	[
		'jsfw/apps/core/Log',
		'jsfw/platform/system/Preferences',
		'jsfw/platform/ca/PINHandler'
	],
	function (Log, Preferences, PINHandler) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.ca = $N.platform.ca || {};

		$N.platform.ca.ParentalControl = (function () {
			var log = new $N.apps.core.Log("ca", "ParentalControl"),
				restrictedChannels = [],
				timeLockedChannels = {},
				MAXIMUM_AGE_RATING = 100,
				userRating = MAXIMUM_AGE_RATING,
				isCurrentUserMaster = false,
				authenticationEnabled = false,
				AUTHENTICATION_TIMEOUT_PATH = "/users/preferences/userauth/defaultDurationSec",
				CURRENT_USER_PATH = "/users/current/updated",
				ccomUserAuth,
				getUserCallback = function (e) {},
				modifyUserCallback = function (e) {},
				userChangedCallback = function () {},
				ratingLookUp = {
					'0': {
						ratingCode: "U",
						description: "Universal"
					},
					'12': {
						ratingCode: "12",
						description: "12"
					},
					'15': {
						ratingCode: "15",
						description: "15"
					},
					'18': {
						ratingCode: "18",
						description: "18"
					},
					'21': {
						ratingCode: "X",
						description: "X"
					}
				};

			/**
			 * Returns a time in the format HH:MM for the given time
			 * where the given time is amount of seconds since midnight
			 * @method getTimeStringForSeconds
			 * @private
			 * @param {Number} seconds
			 * @return {String} time string such as 13:00
			 */
			function getTimeStringForSeconds(seconds) {
				var hours = Math.floor(seconds / 3600),
					minutes = Math.round((seconds - (hours * 3600)) / 60);
				return String(hours) + ":" + String(minutes);
			}

			/**
			 * Returns the amount of seconds since midnight for the given timeStr
			 * which is of format HH:MM e.g. "18:00"
			 * @method getSecondsForTimeString
			 * @private
			 * @param {String} timeStr
			 * @return {Number} amount of seconds since midnight
			 */
			function getSecondsForTimeString(timeStr) {
				var timeArray = timeStr.split(":"),
					hoursAsSeconds = parseInt(timeArray[0], 10) * 3600,
					minutesAsSeconds = parseInt(timeArray[1], 10) * 60;
				return hoursAsSeconds + minutesAsSeconds;
			}

			/**
			 * Converts the given timestamp (milliseconds) to a time
			 * and returns amount of seconds since midnight for that time
			 * @method getTimestampToSecondsSinceMidnight
			 * @private
			 * @param {Number} dateTime milliseconds
			 * @return {Number} seconds since midnight for time
			 */
			function getTimestampToSecondsSinceMidnight(dateTime) {
				var date = new Date(dateTime);
				return getSecondsForTimeString(String(date.getHours()) + ":" + String(date.getMinutes()));
			}

			/**
			 * Returns the start and end time as an object with startTime and endTime properties
			 * for the given startEndTimeStr which is of format HH:MM-HH:MM e.g "18:00-21:00"
			 * @method getStartEndTimeObj
			 * @private
			 * @param {String} startEndTimeStr
			 * @return {Object}
			 */
			function getStartEndTimeObj(startEndTimeStr) {
				var timeStringArray = startEndTimeStr.split("-");
				return {
					startTime: getSecondsForTimeString(timeStringArray[0]),
					endTime: getSecondsForTimeString(timeStringArray[1])
				};
			}

			function cacheRestrictedAndTimeLockedServices(restrictedChannelsToCache) {
				var i,
					j,
					timeWindowObj,
					timeWindowStartIndex,
					timeWindowEndIndex,
					timeWindowArray,
					serviceId;
				restrictedChannelsToCache = restrictedChannelsToCache || [];
				restrictedChannels = [];
				timeLockedChannels = {};
				for (i = 0; i < restrictedChannelsToCache.length; i++) {
					timeWindowStartIndex = restrictedChannelsToCache[i].indexOf("[");
					if (timeWindowStartIndex !== -1) {
						timeWindowEndIndex = restrictedChannelsToCache[i].indexOf("]");
						timeWindowArray = restrictedChannelsToCache[i].substring(timeWindowStartIndex + 1, timeWindowEndIndex).split(",");
						serviceId = restrictedChannelsToCache[i].substring(0, timeWindowStartIndex);
						timeLockedChannels[serviceId] = [];
						for (j = 0; j < timeWindowArray.length; j++) {
							timeLockedChannels[serviceId].push(getStartEndTimeObj(timeWindowArray[j]));
						}
					} else {
						restrictedChannels.push(restrictedChannelsToCache[i]);
					}
				}
			}

			/**
			 * Updates the cached restricted channels, time locked channels and user age rating
			 * for the current user
			 * @method cacheUserProperties
			 * @private
			 * @param {Object} e
			 */
			function cacheUserProperties(e) {
				if (!e.error && e.property) {
					userRating = e.property.userAge || MAXIMUM_AGE_RATING;
					cacheRestrictedAndTimeLockedServices(e.property && e.property.restrictedChannels ? e.property.restrictedChannels : []);
				}
			}

			/**
			 * Replaces the restrictedChannels array in the profileProperty with an empty array
			 * containing an empty string if the restrictedChannels array is an empty array.
			 * This is needed since Configman requires that the restrictedChannels and authorizedChannels
			 * not be passed as an empty array.
			 * @method parseProfileProperty
			 * @private
			 */
			function parseProfileProperty(profileProperty) {
				var restrictedChannels;
				if (profileProperty.restrictedChannels) {
					restrictedChannels = profileProperty.restrictedChannels || [];
					if (restrictedChannels.length === 0) {
						restrictedChannels = [""];
					}
					profileProperty.restrictedChannels = restrictedChannels;
				}
				return profileProperty;
			}

			/**
			 * Modifies the user (for the given userPin) profile with the given profileProperty and calls callback
			 * @method modifyUser
			 * @param {String} masterPin
			 * @param {String} userPin
			 * @param {Object} profileProperty
			 * @param {Function} callback
			 */
			function modifyUser(masterPin, userPin, profileProperty, callback) {
				modifyUserCallback = function (e) {
					if (!e.error) {
						callback(true);
					} else {
						callback(false);
					}
				};
				parseProfileProperty(profileProperty);
				ccomUserAuth.modifyUserProfile(masterPin, userPin, profileProperty);
			}

			/**
			 * Fired when call is made to retrieve current user profile
			 * @method getCurrentUserProfileListener
			 * @private
			 * @param {Object} e
			 */
			function getCurrentUserProfileListener(e) {
				if (e.error && e.error.name === "PinOrCurrentUserIsMaster") {
					isCurrentUserMaster = true;
				} else {
					isCurrentUserMaster = false;
					cacheUserProperties(e);
				}
				userChangedCallback();
			}

			/**
			 * Fired when the user authentication system is disabled
			 * @private
			 * @method disableSystemListener
			 * @param {Object} e
			 */
			function disableSystemListener(e) {
				if (!e.error) {
					authenticationEnabled = false;
					restrictedChannels = [];
					timeLockedChannels = {};
					userRating = MAXIMUM_AGE_RATING;
				}
			}

			/**
			 * Fired when the user authentication system is enabled
			 * @private
			 * @method enableSystemListener
			 * @param {Object} e
			 */
			function enableSystemListener(e) {
				if (!e.error) {
					authenticationEnabled = true;
					ccomUserAuth.getCurrentUserProfile();
				}
			}

			/**
			 * Fired when the current user is set
			 * @method setCurrentUserListener
			 * @private
			 * @param {Object} e
			 */
			function setCurrentUserListener(e) {
				if (!e.error) {
					isCurrentUserMaster = true;
				}
			}

			/**
			 * Called when getUserProfileOK or getUserProfileFailed  events are fired
			 * @method getUserProfileListener
			 * @param {Object} e
			 */
			function getUserProfileListener(e) {
				getUserCallback(e);
				getUserCallback = function (e) {};
			}

			/**
			 * Called when modifyUserProfileOK or modifyUserProfileFailed  events are fired
			 * @method modifyUserProfileListener
			 * @param {Object} e
			 */
			function modifyUserProfileListener(e) {
				modifyUserCallback(e);
				modifyUserCallback = function (e) {};
			}

			/**
			 * Fired when the CURRENT_USER_PATH value changes
			 * @method currentUserUpdatedListener
			 * @private
			 * @param {Number} value The value of the CURRENT_USER_PATH
			 */
			function currentUserUpdatedListener(value) {
				ccomUserAuth.getCurrentUserProfile();
			}

			/**
			 * Fired when the master user is authenticated
			 * @method masterUserAuthenticated
			 * @private
			 */
			function masterUserAuthenticated() {
				ccomUserAuth.setCurrentUserProfile($N.platform.ca.PINHandler.getLocalMasterPin());
			}

			return {

				/**
				 * Sets up the rating lookup table that will be associated with IP services and events.
				 * Adds the listeners for the User Authentication events
				 * @method init
				 * @param {Object} ratingLookup
				 */
				init: function (ratingLookup) {
					log("init", "Enter");
					ccomUserAuth = CCOM.UserAuth;
					if (ratingLookup) {
						this.setRatingLookUp(ratingLookup);
					}
					ccomUserAuth.addEventListener("enableSystemOK", enableSystemListener);
					ccomUserAuth.addEventListener("enableSystemFailed", enableSystemListener);
					ccomUserAuth.addEventListener("disableSystemOK", disableSystemListener);
					ccomUserAuth.addEventListener("disableSystemFailed", disableSystemListener);
					ccomUserAuth.addEventListener("getCurrentUserProfileOK", getCurrentUserProfileListener);
					ccomUserAuth.addEventListener("getCurrentUserProfileFailed", getCurrentUserProfileListener);
					ccomUserAuth.addEventListener("setCurrentUserProfileOK", setCurrentUserListener);
					ccomUserAuth.addEventListener("setCurrentUserProfileFailed", setCurrentUserListener);
					ccomUserAuth.addEventListener("getUserProfileOK", getUserProfileListener);
					ccomUserAuth.addEventListener("getUserProfileFailed", getUserProfileListener);
					ccomUserAuth.addEventListener("modifyUserProfileOK", modifyUserProfileListener);
					ccomUserAuth.addEventListener("modifyUserProfileFailed", modifyUserProfileListener);
					$N.platform.system.Preferences.monitorValue(CURRENT_USER_PATH, currentUserUpdatedListener, this, true);
					window.document.addEventListener("masterUserAuthenticated", masterUserAuthenticated, false);
					log("init", "Exit");
				},

				/**
				 * Sets up the rating lookup table that will be associated with IP services and events.
				 * Adds the listeners for the User Authentication events
				 * @method initialise
				 * @deprecated use init()
				 * @param {Object} ratingLookup
				 */
				initialise: function (ratingLookup) {
					this.init(ratingLookup);
				},

				/**
				 * Enables the user authentication system. Caches the locked channels for the current user
				 * @method enableAuthentication
				 */
				enableAuthentication: function () {
					log("enableAuthentication", "Enter");
					ccomUserAuth.enableSystem();
					log("enableAuthentication", "Exit");
				},

				/**
				 * Disables the user authentication system. Clears the cached locked channels
				 * @method disableAuthentication
				 */
				disableAuthentication: function () {
					log("disableAuthentication", "Enter");
					ccomUserAuth.disableSystem($N.platform.ca.PINHandler.getLocalMasterPin());
					log("disableAuthentication", "Exit");
				},

				/**
				 * Determines if the authentication system has been enabled
				 * @method isAuthenticationEnabled
				 * @return {Boolean} True if the authentication system has been enabled, false otherwise
				 */
				isAuthenticationEnabled: function () {
					log("isAuthenticationEnabled", "Enter & Exit returning " + String(authenticationEnabled));
					return authenticationEnabled;
				},

				/**
				 * Sets the policy modifer which defines when the master user will revert to the default user.
				 * @method setPolicyModifier
				 * @param {Array} policyModifier Array of objects consisting of type and data properties e.g.
				 *
				 *     [{type: $N.platform.ca.ParentalControl.PolicyModifiers.TIMEOUT, data: 1800},
				 *     {type: $N.platform.ca.ParentalControl.PolicyModifiers.CHANNEL_CHANGE, data: ""},
				 *     {type: $N.platform.ca.ParentalControl.PolicyModifiers.EVENT_CHANGE, data: ""}];
				 * The `TIMEOUT` type requires a number in seconds. When this time expires, the user will revert to the default user
				 *
				 * The `CHANNEL_CHANGE` and `EVENT_CHANGE` types require data as an empty string.
				 *
				 * When `CHANNEL_CHANGE` is passed in as a policy modifier, the user will revert to the default user when the current channel changes.
				 *
				 * When `EVENT_CHANGE` is passed in as a policy modifier, the user will revert to the default user when the current event changes.
				 */
				setPolicyModifier: function (policyModifier) {
					ccomUserAuth.setPolicyModifier($N.platform.ca.PINHandler.getLocalMasterPin(), policyModifier);
				},

				/**
				 * Sets the callback for when the current user is reset to the default user
				 * @method setUserChangedCallback
				 * @param {Function} callback
				 */
				setUserChangedCallback: function (callback) {
					userChangedCallback = callback;
				},

				/**
				 * Checks that the current user has permission to view VOD content for the given age rating
				 * @method isVODRatingPermitted
				 * @param {String} ageRating
				 * @return {Boolean} true if the current user is permitted, false otherwise
				 */
				isVODRatingPermitted: function (ageRating) {
					log("isRatingPermitted", "Enter");
					if (isCurrentUserMaster || !ageRating) {
						return true;
					}
					log("isRatingPermitted", "Exit");
					return userRating >= ageRating;
				},

				/**
				 * Checks that the current user has permission to view content for the given age rating
				 * @method isRatingPermitted
				 * @param {String} ageRating
				 * @return {Boolean} true if the current user is permitted, false otherwise
				 */
				isRatingPermitted: function (ageRating) {
					log("isRatingPermitted", "Enter");
					if (isCurrentUserMaster || !ageRating) {
						return true;
					}
					log("isRatingPermitted", "Exit");
					return userRating >= ageRating; //have to add 3 for dvb rating
				},

				/**
				 * Checks if the current user has permission to view the given service and event by
				 *
				 * 	a. checking the user's list of restricted channels against the service
				 * 	b. checking the user's age rating against the age rating of the service and event
				 *
				 * @method isServiceAndEventPermitted
				 * @param {Object} epgService
				 * @param {Object} epgEvent
				 * @return {Boolean} true if the current user is permitted, false otherwise
				 */
				isServiceAndEventPermitted: function (epgService, epgEvent) {
					log("isServiceAndEventPermitted", "Enter");
					var startTime,
						endTime;
					if (isCurrentUserMaster || !epgService || !epgEvent) {
						return true;
					}

					if (!this.isRatingPermitted(epgService.parentalRating)) {
						log("isServiceAndEventPermitted", "Exit");
						return false;
					}

					if (!this.isRatingPermitted(epgEvent.parentalRating)) {
						log("isServiceAndEventPermitted", "Exit");
						return false;
					}

					if (this.isServiceIdRestricted(epgService.serviceId)) {
						log("isServiceAndEventPermitted", "Exit");
						return false;
					}

					startTime = getTimestampToSecondsSinceMidnight(epgEvent.startTime);
					endTime = getTimestampToSecondsSinceMidnight(epgEvent.endTime);
					if (this.isServiceLockedAtTime(epgService.serviceId, startTime, endTime)) {
						log("isServiceAndEventPermitted", "Exit");
						return false;
					}
					log("isServiceAndEventPermitted", "Exit");
					return true;
				},

				/**
				 * Checks the current user has permission to view the given event by checking the user's restricted age rating
				 * against the age rating of the event
				 * @method isEventPermitted
				 * @param {Object} epgEvent
				 * @return {Boolean} true if the current user is permitted, false otherwise
				 */
				isEventPermitted: function (epgEvent) {
					log("isEventPermitted", "Enter & Exit");
					if (isCurrentUserMaster) {
						return true;
					}
					return this.isRatingPermitted(epgEvent.parentalRating);
				},

				/**
				 * Checks the current user has permission to view the given service by checking the user's restricted channels
				 * and user's age rating against the service
				 * @method isServicePermitted
				 * @param {Object} epgService
				 * @return {Boolean} true if the current user is permitted, false otherwise
				 */
				isServicePermitted: function (epgService) {
					log("isServicePermitted", "Enter");
					if (isCurrentUserMaster) {
						return true;
					}
					if (!this.isRatingPermitted(epgService.parentalRating)) {
						log("isServicePermitted", "Enter");
						return false;
					}

					if (this.isServiceIdRestricted(epgService.serviceId)) {
						log("isServicePermitted", "Enter");
						return false;
					}
					log("isServicePermitted", "Enter");
					return true;
				},

				/**
				 * Sets the rating lookup table that will be associated with IP services and events
				 * @method setRatingLookUp
				 * @param {Object} lookUpObj
				 */
				setRatingLookUp: function (lookUpObj) {
					log("setRatingLookUp", "Enter");
					if (lookUpObj) {
						ratingLookUp = lookUpObj;
					}
					log("setRatingLookUp", "Exit");
				},

				/**
				 * Returns the rating lookup table that is associated with IP services and events
				 * @method getRatingLookUp
				 * @return {Object} Rating LookUp table
				 */
				getRatingLookUp: function () {
					log("getRatingLookUp", "Enter & Exit");
					return ratingLookUp;
				},

				/**
				 * Returns the rating details that are associated with the given rating value.
				 * Returns null if no rating lookup table has been set
				 * or the rating value does not exist in the table
				 * @method getRatingDetailsForValue
				 * @param {String} ageRating
				 * @return {Object} The rating object associated with the given rating value
				 */
				getRatingDetailsForValue: function (ageRating) {
					log("getRatingDetailsForValue", "Enter");
					var ratingObj = ratingLookUp[ageRating];
					log("getRatingDetailsForValue", "Exit");
					return ratingObj || null;
				},

				/**
				 * Returns the rating code that is associated with the given rating value.
				 * Returns an empty string if no rating lookup table has been set
				 * or the rating value does not exist in the table
				 * @method getRatingCodeForValue
				 * @param {String} ageRating
				 * @return {String} The rating code for the given rating value
				 */
				getRatingCodeForValue: function (ageRating) {
					log("getRatingCodeForValue", "Enter");
					var rating = ratingLookUp[ageRating];
					if (rating && rating.ratingCode) {
						return rating.ratingCode;
					}
					log("getRatingCodeForValue", "Exit");
					return "";
				},

				/**
				 * Returns the rating description that is associated with the given rating value.
				 * Returns an empty string if no rating lookup table has been set
				 * or the rating value does not exist in the table
				 * @method getRatingDescriptionForValue
				 * @param {String} ageRating
				 * @return {String} The description for the given rating value
				 */
				getRatingDescriptionForValue: function (ageRating) {
					log("getRatingDescriptionForValue", "Enter");
					var rating = ratingLookUp[ageRating];
					if (rating && rating.description) {
						log("getRatingDescriptionForValue", "Exit");
						return rating.description;
					}
					log("getRatingDescriptionForValue", "Exit");
					return "";
				},


				/**
				 * Sets the age rating value for the given user
				 * @method setUserRatingValue
				 * @param {String} ageRating
				 * @param {String} userPin pin number of user to update, if undefined/null then default user is modified
				 */
				setUserRatingValue: function (ageRating, userPin) {
					log("setUserRatingValue", "Enter");
					if (!userPin) {
						userPin = "";
					}
					if ($N.platform.ca.PINHandler.isPinCurrentUser(userPin)) {
						userRating = ageRating;
					}
					modifyUser($N.platform.ca.PINHandler.getLocalMasterPin(), userPin, {userAge: ageRating}, function (isModified) {});
					log("setUserRatingValue", "Exit");
				},

				/**
				 * Returns the age rating value for the current user
				 * @method getUserRatingValue
				 * @return {String} age rating value for current user
				 */
				getUserRatingValue: function () {
					log("getUserRatingValue", "Enter & Exit returning " + String(userRating));
					return userRating;
				},

				/**
				 * Checks if the given service has a time lock associated with it for the current user
				 * @method isTimeLocked
				 * @param {String} serviceId
				 * @return {Boolean} true if the service does have a time lock, false otherwise
				 */
				isTimeLocked: function (serviceId) {
					log("isTimeLocked", "Enter & Exit serviceId " + serviceId);
					if (isCurrentUserMaster) {
						return false;
					}
					return timeLockedChannels[serviceId] ? true : false;
				},

				/**
				 * Sets a time lock for the given time window (startTime -> endTime) against the given service for the given user
				 * @method setTimeLocked
				 * @param {String} serviceId
				 * @param {Number} startTime seconds from midnight
				 * @param {Number} endTime seconds from midnight
				 * @param {String} [userPin=''] pin number of user to update. If undefined / null then default user is modified
				 * @param {Function} [callback=null] Called once the time lock has been set. If call fails will pass a false
				 * parameter to the callback, if succeeds will pass true parameter
				 */
				setTimeLocked: function (serviceId, startTime, endTime, userPin, callback) {
					log("setTimeLocked", "Enter");
					var usersRestrictedChannels;
					if (!userPin) {
						userPin = ""; //default user
					}
					if (!callback) {
						callback = function (isSet) {};
					}
					getUserCallback = function (e) {
						if (!e.error) {
							usersRestrictedChannels = e.property && e.property.restrictedChannels ? e.property.restrictedChannels : [];
							usersRestrictedChannels.push(serviceId + "[" + getTimeStringForSeconds(startTime) + "-" + getTimeStringForSeconds(endTime) + "]");
							if ($N.platform.ca.PINHandler.isPinCurrentUser(userPin)) {
								cacheRestrictedAndTimeLockedServices(usersRestrictedChannels);
							}
							modifyUser($N.platform.ca.PINHandler.getLocalMasterPin(), userPin, {restrictedChannels: usersRestrictedChannels}, callback);
						} else {
							callback(false);
						}
					};
					if (serviceId && startTime && endTime && endTime > startTime) {
						ccomUserAuth.getUserProfile(userPin);
					}
					log("setTimeLocked", "Exit");
				},

				/**
				 * Removes all time locks for the given serviceId for the given user
				 * @method removeTimeLock
				 * @param {String} serviceId
				 * @param {String} [userPin=''] pin number of user to update, if undefined/null then default user is modified
				 * @param {Function} [callback=null] Called once the time lock has been removed. If call fails will pass a false
				 * parameter to the callback, if succeeds will pass true parameter
				 */
				removeTimeLock: function (serviceId, userPin, callback) {
					log("removeTimeLock", "Enter");
					var	usersRestrictedChannels = [],
						i,
						indexOfServiceIdEnd,
						newRestrictedChannels = [];
					if (!userPin) {
						userPin = ""; //default user
					}
					if (!callback) {
						callback = function (isModified) {};
					}
					getUserCallback = function (e) {
						if (!e.error) {
							usersRestrictedChannels = e.property && e.property.restrictedChannels ? e.property.restrictedChannels : [];
							for (i = 0; i < usersRestrictedChannels.length; i++) {
								indexOfServiceIdEnd = usersRestrictedChannels[i].indexOf("[");
								if (indexOfServiceIdEnd === -1 || serviceId !== usersRestrictedChannels[i].substring(0, indexOfServiceIdEnd)) {
									newRestrictedChannels.push(usersRestrictedChannels[i]);
								}
							}
							modifyUser($N.platform.ca.PINHandler.getLocalMasterPin(), userPin, {restrictedChannels: newRestrictedChannels}, callback);
						} else {
							callback(false);
						}
					};
					if (serviceId) {
						ccomUserAuth.getUserProfile(userPin);
					}
					log("removeTimeLock", "Enter");
				},

				/**
				 * Checks if the given channel will be locked at all between the given start and end time for the current user.
				 * This check is carried out against the user's time locked channels.
				 * Returns true if channel will be locked at all between given time window, false otherwise
				 * @method isServiceLockedAtTime
				 * @param {String} serviceId
				 * @param {Number} startTime seconds since midnight
				 * @param {Number} endTime seconds since midnight
				 * @return {Boolean} true if service is locked at time window, false otherwise
				 */
				isServiceLockedAtTime: function (serviceId, startTime, endTime) {
					log("isServiceLockedAtTime", "Enter");
					var lockedTimesForService = timeLockedChannels[serviceId],
						lockedServiceStartTime,
						lockedServiceEndTime,
						i;
					if (isCurrentUserMaster) {
						return false;
					}
					if (startTime === null || startTime === undefined || endTime === null || endTime === undefined) {
						log("isServiceLockedAtTime", "Exit");
						return true;
					}
					if (!lockedTimesForService) {
						log("isServiceLockedAtTime", "Exit");
						return false;
					}
					for (i = 0; i < lockedTimesForService.length; i++) {
						lockedServiceStartTime = lockedTimesForService[i].startTime;
						lockedServiceEndTime = lockedTimesForService[i].endTime;
						if ((lockedServiceStartTime >= startTime && lockedServiceEndTime <= endTime) ||
							(lockedServiceStartTime <= startTime && lockedServiceEndTime >= endTime) ||
							(lockedServiceStartTime <= startTime && lockedServiceEndTime > startTime) ||
							(lockedServiceStartTime >= startTime && lockedServiceStartTime < endTime)) {
							log("isServiceLockedAtTime", "Exit");
							return true;
						}
					}
					log("isServiceLockedAtTime", "Exit");
					return false;
				},

				/**
				 * Returns the next time that the given service will be locked due to the current user's restrictions
				 * @method getServiceLockStartTime
				 * @param {String} serviceId
				 * @return {Number} Time in seconds from midnight
				 */
				getServiceLockStartTime: function (serviceId) {
					log("getServiceLockStartTime", "Enter");
					var lockedTimes = [],
						i,
						currentTime = new Date(),
						currentTimeSeconds = getSecondsForTimeString(String(currentTime.getHours()) + ":" + String(currentTime.getMinutes())),
						startTime = null;
					if (!serviceId || !timeLockedChannels[serviceId]) {
						log("getServiceLockStartTime", "Exit");
						return null;
					}
					for (i = timeLockedChannels[serviceId].length - 1; i >= 0; i--) {
						if (timeLockedChannels[serviceId][i].startTime > currentTimeSeconds) {
							startTime = timeLockedChannels[serviceId][i].startTime;
						}
						if (i === 0 && startTime === null) {
							startTime = timeLockedChannels[serviceId][0].startTime;
						}
					}
					log("getServiceLockStartTime", "Exit");
					return startTime;
				},

				/**
				 * Returns the next time that the given service will be unlocked due to the current user's restrictions
				 * @method getServiceLockEndTime
				 * @param {String } serviceId
				 * @return {Number} Time in seconds from midnight
				 */
				getServiceLockEndTime: function (serviceId) {
					log("getServiceLockEndTime", "Enter");
					var i,
						currentTime = new Date(),
						currentTimeSeconds = getSecondsForTimeString(String(currentTime.getHours()) + ":" + String(currentTime.getMinutes())),
						endTime = null;
					if (!serviceId || !timeLockedChannels[serviceId]) {
						log("getServiceLockEndTime", "Exit");
						return null;
					}
					for (i = timeLockedChannels[serviceId].length - 1; i >= 0; i--) {
						if (timeLockedChannels[serviceId][i].endTime > currentTimeSeconds) {
							endTime = timeLockedChannels[serviceId][i].endTime;
						}
						if (i === 0 && endTime === null) {
							endTime = timeLockedChannels[serviceId][0].endTime;
						}
					}
					log("getServiceLockEndTime", "Exit");
					return endTime;
				},


				/**
				 * Returns an array of objects with properties `serviceId` and `lockedTimes`. LockedTimes is an object itself
				 * containing properties `startTime` and `endTime`
				 * @method getTimeLockedServices
				 * @return {Object} Array of objects with `serviceId`, `lockedTimes` properties
				 */
				getTimeLockedServices: function () {
					log("getTimeLockedServices", "Enter");
					var timeLockedServices = [],
						i,
						timeLockedServiceObj,
						serviceId;
					for (serviceId in timeLockedChannels) {
						if (timeLockedChannels.hasOwnProperty(serviceId)) {
							timeLockedServiceObj = {};
							timeLockedServiceObj.serviceId = serviceId;
							timeLockedServiceObj.lockedTimes = [];
							for (i = 0; i < timeLockedChannels[serviceId].length; i++) {
								timeLockedServiceObj.lockedTimes.push({
									startTime: timeLockedChannels[serviceId][i].startTime,
									endTime: timeLockedChannels[serviceId][i].endTime
								});
							}
							timeLockedServices.push(timeLockedServiceObj);
						}
					}
					log("getTimeLockedServices", "Exit");
					return timeLockedServices;
				},

				/**
				 * Returns the number of time locked services for the current user
				 * @method getTimeLockedServicesCount
				 * @return {Number} number of locked services
				 */
				getTimeLockedServicesCount: function () {
					log("getTimeLockedServicesCount", "Enter");
					var count = 0,
						serviceId;
					for (serviceId in timeLockedChannels) {
						if (timeLockedChannels.hasOwnProperty(serviceId)) {
							count++;
						}
					}
					log("getTimeLockedServicesCount", "Exit");
					return count;
				},

				/**
				 * Returns the number of restricted services for the current user
				 * @method getRestrictedServicesCount
				 * @return {Number} number of locked services
				 */
				getRestrictedServicesCount: function () {
					log("getRestrictedServicesCount", "Enter & Exit");
					return restrictedChannels && restrictedChannels.length ? restrictedChannels.length : 0;
				},

				/**
				 * Restricted the given service for the given user
				 * @method setRestrictedService
				 * @param {String} serviceId
				 * @param {String} [userPin=''] pin number of user to update. If undefined / null then default user is modified
				 * @param {Function} [callback=null] Called once the service has been set to restricted. If call fails will pass a false
				 * parameter to the callback, if succeeds will pass true parameter
				 */
				setRestrictedService: function (serviceId, userPin, callback) {
					log("setRestrictedService", "Enter");
					var usersRestrictedChannels = [];
					if (!userPin) {
						userPin = ""; //default user
					}
					if (!callback) {
						callback = function (isModified) {};
					}
					getUserCallback = function (e) {
						if (!e.error) {
							usersRestrictedChannels = e.property && e.property.restrictedChannels ? e.property.restrictedChannels : [];
							usersRestrictedChannels.push(serviceId);
							if ($N.platform.ca.PINHandler.isPinCurrentUser(userPin)) {
								cacheRestrictedAndTimeLockedServices(usersRestrictedChannels);
							}
							modifyUser($N.platform.ca.PINHandler.getLocalMasterPin(), userPin, {restrictedChannels: usersRestrictedChannels}, callback);
						} else {
							callback(false);
						}
					};

					if (serviceId) {
						ccomUserAuth.getUserProfile(userPin);
					}
					log("setRestrictedService", "Exit");
				},

				/**
				 * Removes the given service from the restricted list of services for the given user
				 * @method unsetRestrictedService
				 * @param {String} serviceId
				 * @param {String} [userPin=''] pin number of user to update. If undefined / null then default user is modified
				 * @param {Function} [callback=null] Called once the service restriction has been unset. If call fails will pass a false
				 * parameter to the callback, if succeeds will pass true parameter
				 */
				unsetRestrictedService: function (serviceId, userPin, callback) {
					log("unsetRestrictedService", "Enter");
					var usersRestrictedChannels = [],
						i;
					if (!userPin) {
						userPin = ""; //default user
					}
					if (!callback) {
						callback = function (isModified) {};
					}
					getUserCallback = function (e) {
						if (!e.error) {
							usersRestrictedChannels = e.property && e.property.restrictedChannels ? e.property.restrictedChannels : [];
							for (i = 0; i < usersRestrictedChannels.length; i++) {
								if (serviceId === usersRestrictedChannels[i]) {
									usersRestrictedChannels.splice(i, 1);
								}
							}
							if ($N.platform.ca.PINHandler.isPinCurrentUser(userPin)) {
								cacheRestrictedAndTimeLockedServices(usersRestrictedChannels);
							}
							modifyUser($N.platform.ca.PINHandler.getLocalMasterPin(), userPin, {restrictedChannels: usersRestrictedChannels}, callback);
						} else {
							callback(false);
						}
					};

					if (serviceId) {
						ccomUserAuth.getUserProfile(userPin);
					}
					log("unsetRestrictedService", "Exit");
				},

				/**
				 * Sets the given services as restricted for the given user.
				 * These will override the current restricted services list
				 * @method setRestrictedServices
				 * @param {Object} serviceIds Array of serviceIds
				 * @param {String} [userPin=''] pin number of user to update. If undefined / null then default user is modified
				 * @param {Function} [callback=null] Called once the services have been set to restricted. If call fails will pass a false
				 * parameter to the callback, if succeeds will pass true parameter
				 */
				setRestrictedServices: function (serviceIds, userPin, callback) {
					log("setRestrictedServices", "Enter");
					var usersRestrictedChannels = [],
						i,
						usersTimeLockedChannels = [];
					if (!userPin) {
						userPin = ""; //default user
					}
					if (!callback) {
						callback = function (isModified) {};
					}
					getUserCallback = function (e) {
						if (!e.error) {
							usersRestrictedChannels = e.property && e.property.restrictedChannels ? e.property.restrictedChannels : [];
							for (i = 0; i < usersRestrictedChannels.length; i++) {
								if (usersRestrictedChannels[i].indexOf("[") !== -1) {
									usersTimeLockedChannels.push(usersRestrictedChannels[i]);
								}
							}
							if ($N.platform.ca.PINHandler.isPinCurrentUser(userPin)) {
								cacheRestrictedAndTimeLockedServices(usersTimeLockedChannels.concat(serviceIds));
							}
							modifyUser($N.platform.ca.PINHandler.getLocalMasterPin(), userPin, {restrictedChannels: usersTimeLockedChannels.concat(serviceIds)}, callback);
						} else {
							callback(false);
						}
					};
					if (serviceIds) {
						ccomUserAuth.getUserProfile(userPin);
					}
					log("setRestrictedServices", "Exit");
				},

				/**
				 * Removes the given services from the restricted list for the given user
				 * @method unsetRestrictedServices
				 * @param {Object} serviceIds Array of serviceIds
				 * @param {String} [userPin=''] pin number of user to update. If undefined / null then default user is modified
				 * @param {Function} [callback=null] Called once the services restrictions have been unset. If call fails will pass a false
				 * parameter to the callback, if succeeds will pass true parameter
				 */
				unsetRestrictedServices: function (serviceIds, userPin, callback) {
					log("unsetRestrictedServices", "Enter");
					var usersRestrictedChannels = [],
						i,
						serviceIdsIndex = {},
						newRestrictedChannels = [];
					if (!userPin) {
						userPin = ""; //default user
					}
					if (!callback) {
						callback = function (isModified) {};
					}
					getUserCallback = function (e) {
						for (i = 0; i < serviceIds.length; i++) {
							serviceIdsIndex[serviceIds[i]] = true;
						}
						if (!e.error) {
							usersRestrictedChannels = e.property && e.property.restrictedChannels ? e.property.restrictedChannels : [];
							for (i = 0; i < usersRestrictedChannels.length; i++) {
								if (!serviceIdsIndex[usersRestrictedChannels[i]]) {
									newRestrictedChannels.push(usersRestrictedChannels[i]);
								}
							}
							if ($N.platform.ca.PINHandler.isPinCurrentUser(userPin)) {
								cacheRestrictedAndTimeLockedServices(newRestrictedChannels);
							}
							modifyUser($N.platform.ca.PINHandler.getLocalMasterPin(), userPin, {restrictedChannels: newRestrictedChannels}, callback);
						} else {
							callback(false);
						}
					};

					if (serviceIds && serviceIds.length > 0) {
						ccomUserAuth.getUserProfile(userPin);
					}
					log("unsetRestrictedServices", "Exit");
				},

				/**
				 * Returns an array of service ids that have been set as restricted for the current user
				 * @method getRestrictedServices
				 * @return {Object} Array of serviceIds
				 */
				getRestrictedServices: function () {
					log("getRestrictedServices", "Enter & Exit");
					return restrictedChannels || [];
				},

				/**
				 * Returns true if the given serviceId is restricted for the current user
				 * @method isServiceIdRestricted
				 * @param {String} serviceId
				 * @return {Boolean} True if the serviceId is restricted, false otherwise
				 */
				isServiceIdRestricted: function (serviceId) {
					log("isServiceIdRestricted", "Enter");
					var i;
					if (isCurrentUserMaster || !serviceId || !restrictedChannels) {
						log("isServiceIdRestricted", "Exit");
						return false;
					}
					for (i = 0; i < restrictedChannels.length; i++) {
						if (serviceId === restrictedChannels[i]) {
							log("isServiceIdRestricted", "Exit");
							return true;
						}
					}
					log("isServiceIdRestricted", "Exit");
					return false;
				},

				/**
				 * Creates a new user with same rights as the default user. These rights can be updated
				 * calling `setUserRatingValue()` and `setRestrictedService/setRestrictedServices()`.
				 * The new user will have the `userPin` as its PIN number.
				 * @method createUser
				 * @param {String} masterPin
				 * @param {String} userPin
				 */
				createUser: function (userPin) {
					log("createUser", "Enter");
					//TODO: only supported in OTV5.1
					log("createUser", "Exit");
				},

				/**
				 * The current user will be set to the default user after the given time has passed.
				 * To cancel the authentication timer pass in 0 seconds
				 * @method setAuthenticationTimeout
				 * @param {Number} time Seconds
				 */
				setAuthenticationTimeout: function (time) {
					log("setAuthenticationTimeout", "Enter");
					CCOM.ConfigManager.setValue(AUTHENTICATION_TIMEOUT_PATH, time);
					log("setAuthenticationTimeout", "Exit");
				},

				/**
				 * Returns the time (in seconds) set for the authentication timer
				 * @method getAuthenticationTimeout
				 * @return {Number} The authentication timeout in seconds
				 */
				getAuthenticationTimeout: function () {
					log("getAuthenticationTimeout", "Enter & Exit");
					return CCOM.ConfigManager.getValue(AUTHENTICATION_TIMEOUT_PATH).keyValue;
				},

				/**
				 * Returns true if the current user is the master user, false if not
				 * @method isCurrentUserMaster
				 * @return {Boolean} true if current user is the master user
				 */
				isCurrentUserMaster: function () {
					return isCurrentUserMaster;
				},

				/**
				 * Deprecated, use setRestrictedService
				 * @method setBlocked
				 * @param {Object} serviceId
				 * @deprecated use setRestrictedService
				 */
				setBlocked: function (serviceId) {
					log("setBlocked", "DEPRECATED - USE setRestrictedService");
					this.setRestrictedService(serviceId);
				},

				/**
				 * Deprecated, use unsetRestrictedService
				 * @method unsetBlocked
				 * @param {Object} serviceId
				 * @deprecated use unsetRestrictedService
				 */
				unsetBlocked: function (serviceId) {
					log("unsetBlocked", "DEPRECATED - USE unsetRestrictedService");
					this.unsetRestrictedService(serviceId);
				},

				/**
				 * Deprecated
				 * @method getDefaultLockStartTime
				 * @deprecated this method is no longer supported
				 */
				getDefaultLockStartTime: function () {
					log("getDefaultLockStartTime", "DEPRECATED");
				},

				/**
				 * Deprecated
				 * @method getDefaultLockEndTime
				 * @deprecated this method is no longer supported
				 */
				getDefaultLockEndTime: function () {
					log("getDefaultLockEndTime", "DEPRECATED");
				},

				/**
				 * Deprecated
				 * @method startChanLockTimer
				 * @param {Object} serviceId
				 * @deprecated this method is no longer supported
				 */
				startChanLockTimer: function (serviceId) {
					log("startChanLockTimer", "DEPRECATED");
				},

				/**
				 * Deprecated, use isServicePermitted
				 * @method isServiceCurrentlyPermitted
				 * @param {Object} epgService
				 * @deprecated use isServicePermitted
				 */
				isServiceCurrentlyPermitted: function (epgService) {
					log("isServiceCurrentlyPermitted", "DEPRECATED - USE isServicePermitted");
					this.isServicePermitted(epgService);
				},

				/**
				 * Deprecated, use isServiceLockedAtTime
				 * @method isChannelLockedAtTime
				 * @param {Object} serviceId
				 * @param {Object} startTime
				 * @param {Object} endTime
				 * @deprecated use isServiceLockedAtTime
				 */
				isChannelLockedAtTime: function (serviceId, startTime, endTime) {
					log("isChannelLockedAtTime", "DEPRECATED - USE isServiceLockedAtTime");
					this.isServiceLockedAtTime(serviceId, startTime, endTime);
				},

				/**
				 * Deprecated, use getServiceLockStartTime
				 * @method getChannelLockStartTime
				 * @param {Object} serviceId
				 * @deprecated use getServiceLockStartTime
				 */
				getChannelLockStartTime: function (serviceId) {
					log("getChannelLockStartTime", "DEPRECATED - USE getServiceLockStartTime");
					this.getServiceLockStartTime(serviceId);
				},

				/**
				 * Deprecated, use getServiceLockEndTime
				 * @method getChannelLockEndTime
				 * @param {Object} serviceId
				 * @deprecated use getServiceLockEndTime
				 */
				getChannelLockEndTime: function (serviceId) {
					log("getChannelLockEndTime", "DEPRECATED - USE getServiceLockEndTime");
					this.getServiceLockEndTime(serviceId);
				},

				/**
				 * Deprecated, use getLockedServicesCount
				 * @method getLockedChannelsCount
				 * @deprecated use getLockedServicesCount
				 */
				getLockedChannelsCount: function () {
					log("getLockedChannelsCount", "DEPRECATED - USE getLockedServicesCount");
					this.getLockedServicesCount();
				},

				/**
				 * Enumeration of the policy modifier types
				 * Possible values are `TIMEOUT`, `CHANNEL_CHANGE`, `EVENT_CHANGE`
				 * @property {Number} PolicyModifiers
				 */
				PolicyModifiers: {
					TIMEOUT: 1,
					CHANNEL_CHANGE: 2,
					EVENT_CHANGE: 4
				}
			};
		}());
		return $N.platform.ca.ParentalControl;
	}
);
