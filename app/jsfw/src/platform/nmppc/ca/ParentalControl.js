/**
 * ParentalControl deals with functions that determine whether a given programme or channel can be
 * viewed, given the current maturity rating and parental controls set. Covers blocking /
 * time-locking channels
 *
 * @class $N.platform.ca.ParentalControl
 * @singleton
 * @requires $N.platform.system.Preferences
 * @requires $N.apps.core.Log
 * @author gstacey
 */
/*global define*/
define('jsfw/platform/ca/ParentalControl',
	[
		'jsfw/apps/core/Log',
		'jsfw/platform/system/Preferences'
	],
	function (Log, Preferences) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.ca = $N.platform.ca || {};

		$N.platform.ca.ParentalControl = (function () {
			var log = new $N.apps.core.Log("ca", "ParentalControl"),
				lockedServices = null,
				MAXIMUM_AGE_RATING = 100,
				userRating = MAXIMUM_AGE_RATING,
				authenticationEnabled = true,
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
			 * Returns a service object if the service is locked.
			 * @method getLockedObjectForService
			 * @private
			 * @param {String} serviceId
			 * @return {Object} lockedService
			 */
			function getLockedObjectForService(serviceId) {
				var lockedItems,
					lockedService = null,
					i,
					service;

				if (!lockedServices) {
					return null;
				}

				lockedItems = lockedServices.services;

				for (i = 0; i < lockedItems.length; i++) {
					service = lockedItems[i];
					if (serviceId === service.serviceId) {
						lockedService = service;
						break;
					}
				}

				return lockedService;
			}

			/**
			 * Retrieves locked services as a JSON object.
			 * @method getLockedServices
			 * @private
			 * @return {Object} Currently locked services
			 */
			function getLockedServices() {
				var lockedServices = $N.platform.system.Preferences.getPreferenceObject('user.lockedServices');
				if (!lockedServices) {
					// if no locked service info held in prefs, then an initial locked channels object
					lockedServices = {
						'categories': [],
						'services': []
					};
				}

				return lockedServices;
			}

			/**
			 * Persists the locally held locking settings to preferences.
			 * @method setLockPrefs
			 * @private
			 */
			function setLockPrefs() {
				$N.platform.system.Preferences.setPreferenceObject('user.lockedServices', lockedServices);
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
					if (ratingLookup) {
						this.setRatingLookUp(ratingLookup);
					}
					lockedServices = getLockedServices();
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
				 * Enables the user authentication system
				 * @method enableAuthentication
				 */
				enableAuthentication: function () {
					log("enableAuthentication", "Enter");
					authenticationEnabled = true;
					log("enableAuthentication", "Exit");
				},

				/**
				 * Disables the user authentication system
				 * @method disableAuthentication
				 */
				disableAuthentication: function () {
					log("disableAuthentication", "Enter");
					authenticationEnabled = false;
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
				 * NOT SUPPORTED IN HTML/NMP
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
				},

				/**
				 * Sets the callback for when the current user is reset to the default user.
				 *
				 * Not supported in HTML/NMP
				 * @method setUserChangedCallback
				 * @param {Function} callback
				 */
				setUserChangedCallback: function (callback) {
				},

				/**
				 * Checks that the current user has permission to view VOD content for the given age rating
				 * @method isVODRatingPermitted
				 * @param {String} ageRating
				 * @return {Boolean} true if the current user is permitted, false otherwise
				 */
				isVODRatingPermitted: function (ageRating) {
					log("isRatingPermitted", "Enter and Exit");
					if (!authenticationEnabled || !ageRating) {
						return true;
					}
					return userRating >= ageRating;
				},

				/**
				 * Checks that the current user has permission to view content for the given age rating
				 * @method isRatingPermitted
				 * @param {String} ageRating
				 * @return {Boolean} true if the current user is permitted, false otherwise
				 */
				isRatingPermitted: function (ageRating) {
					log("isRatingPermitted", "Enter and Exit");
					if (!authenticationEnabled || !ageRating) {
						return true;
					}
					return userRating >= ageRating;
				},

				/**
				 * Checks if the current user has permission to view the given service and event by
				 * <ol type="a">
				 * <li>checking the user's list of restricted channels against the service</li>
				 * <li>checking the user's age rating against the age rating of the service and event</li>
				 * @method isServiceAndEventPermitted
				 * @param {Object} epgService
				 * @param {Object} epgEvent
				 * @return {Boolean} true if the current user is permitted, false otherwise
				 */
				isServiceAndEventPermitted: function (epgService, epgEvent) {
					log("isServiceAndEventPermitted", "Enter");
					var now = new Date().getTime(),
						isLocked = false;

					if (!epgService || !authenticationEnabled) {
						log("isServiceAndEventPermitted", "Called with an invalid service or authentication is disabled. Returning true");
						return true;
					}

					// check has user blocked this channel
					if (this.isServiceIdRestricted(epgService.serviceId)) {
						return false;
					}

					// check if user has time-locked this channel and event
					// for future events, just check if they fall within the channel time-lock
					// for current events, be more specific and check if the current time is
					// within the channel time-lock
					if (epgEvent && epgEvent.startTime > now) {
						isLocked = this.isServiceLockedAtTime(epgService.serviceId, epgEvent.startTime, epgEvent.endTime);
					} else if (epgEvent && epgEvent.startTime <= now && epgEvent.endTime >= now) {
						isLocked = this.isServiceLockedAtTime(epgService.serviceId, now, epgEvent.endTime);
					} else {
						isLocked = this.isServiceLockedAtTime(epgService.serviceId, now, now);
					}

					if (isLocked) {
						return false;
					}

					// check user is rated to view the service
					if (!this.isRatingPermitted(epgService.parentalRating)) {
						return false;
					}

					// check user is rated to view the current event
					if (epgEvent && !this.isEventPermitted(epgEvent)) {
						return false;
					}

					log("isServiceAndEventPermitted", "Exit, canView=true");
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
					if (!authenticationEnabled) {
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
				 * @param {String} [userPin=''] Not needed in HTML/NMP build
				 */
				setUserRatingValue: function (ageRating, userPin) {
					log("setUserRatingValue", "Enter");
					userRating = ageRating;
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
					var lockedObj = getLockedObjectForService(serviceId);
					if (lockedObj && lockedObj.startTime !== undefined && lockedObj.startTime !== null) {
						log("isTimeLocked", "Exit");
						return true;
					}
					log("isTimeLocked", "Exit");
					return false;
				},

				/**
				 * Sets a time lock for the given time window (startTime -> endTime) against the given service for the given user
				 * @method setTimeLocked
				 * @param {String} serviceId
				 * @param {Number} startTime seconds from midnight
				 * @param {Number} endTime seconds from midnight
				 * @param {String} [userPin=''] Not needed in HTML/NMP build
				 * @param {Function} [callback=null] Not needed in HTML/NMP build
				 */
				setTimeLocked: function (serviceId, startTime, endTime, userPin, callback) {
					log("setTimeLocked", "Enter");
					var lockedItems = lockedServices.services,
						lockedItem = getLockedObjectForService(serviceId);

					// add it if it does not exist
					if (!lockedItem) {
						lockedItem = {
							'serviceId': serviceId
						};
						lockedItems.push(lockedItem);
					}

					lockedItem.startTime = startTime;
					lockedItem.endTime = endTime;

					setLockPrefs();
					log("setTimeLocked", "Exit");
				},

				/**
				 * Removes all time locks for the given serviceId for the given user
				 * @method removeTimeLock
				 * @param {String} serviceId
				 * @param {String} [userPin=''] Not needed in HTML/NMP build
				 * @param {Function} [callback=null] Not needed in HTML/NMP build
				 */
				removeTimeLock: function (serviceId, userPin, callback) {
					log("removeTimeLock", "Enter");
					var lockedItems = lockedServices.services,
						i,
						service;
					for (i = 0; i < lockedItems.length; i++) {
						service = lockedItems[i];
						if (serviceId === service.serviceId && service.startTime && service.endTime) {
							lockedItems.splice(i, 1);
							break;
						}
					}
					setLockPrefs();
					log("removeTimeLock", "Enter");
				},

				/**
				 * Checks if the given channel will be locked at all between the given start and end time for the current user.
				 * This check is carried out against the user's time locked channels.
				 * Returns true if channel will be locked at all between given time window, false otherwsie
				 * @method isServiceLockedAtTime
				 * @param {String} serviceId
				 * @param {Number} startTime seconds since midnight
				 * @param {Number} endTime seconds since midnight
				 * @return {Boolean} true if service is locked at time window, false otherwise
				 */
				isServiceLockedAtTime: function (serviceId, startTime, endTime) {
					log("isServiceLockedAtTime", "Enter");
					var lockStartTime,
						lockEndTime,
						startTimeIsLocked,
						endTimeIsLocked,
						acrossLock;

					if (startTime === null || startTime === undefined || endTime === null || endTime === undefined) {
						log("isServiceLockedAtTime", "Exit");
						return true;
					}

					startTime = startTime * 1000;
					endTime = endTime * 1000;

					if (this.isTimeLocked(serviceId)) {
						lockStartTime = this.getServiceLockStartTime(serviceId) * 1000;
						lockEndTime = this.getServiceLockEndTime(serviceId) * 1000;

						// If time spans midnight, adjust for easier calcs
						if (lockStartTime > lockEndTime && lockEndTime < startTime) {
							lockEndTime += 86400000; // 24hrs
						} else if (lockStartTime > lockEndTime) {
							lockStartTime -= 86400000; // 24hrs
						}

						startTimeIsLocked = (lockStartTime <= startTime && startTime <= lockEndTime);
						if (endTime !== undefined && endTime !== null) {
							endTimeIsLocked = (lockStartTime < endTime && endTime <= lockEndTime);
							acrossLock = startTime <= lockStartTime && endTime >= lockEndTime;
						}
						log("isServiceLockedAtTime", "Exit");
						return startTimeIsLocked || endTimeIsLocked || acrossLock;
					}
					log("isServiceLockedAtTime", "Exit");
					return false;
				},

				/**
				 * Returns the next time that the given service will be locked due to the current user's restrictions
				 * @method getServiceLockStartTime
				 * @param {String} serviceId
				 * @return {Number} Time in seconds from midnight or null if not time locked
				 */
				getServiceLockStartTime: function (serviceId) {
					log("getServiceLockStartTime", "Enter");
					var lockedServiceObj = getLockedObjectForService(serviceId);
					log("getServiceLockStartTime", "Exit");
					return lockedServiceObj ? lockedServiceObj.startTime : null;
				},

				/**
				 * Returns the next time that the given service will be unlocked due to the current user's restrictions
				 * @method getServiceLockEndTime
				 * @param {String } serviceId
				 * @return {Number} Time in seconds from midnight or null if not time locked
				 */
				getServiceLockEndTime: function (serviceId) {
					log("getServiceLockEndTime", "Enter");
					var lockedServiceObj = getLockedObjectForService(serviceId);
					log("getServiceLockEndTime", "Exit");
					return lockedServiceObj ? lockedServiceObj.endTime : null;
				},


				/**
				 * Returns an array of objects with properties `serviceId`, `startTime` and `endTime`.
				 * @method getTimeLockedServices
				 * @return {Object} Array of objects with `serviceId`, `startTime` and `endTime` properties
				 */
				getTimeLockedServices: function () {
					log("getTimeLockedServices", "Enter");
					var lockedItems = lockedServices.services,
						i,
						timeLockedServices = [];
					for (i = 0; i < lockedItems.length; i++) {
						if (lockedItems[i].startTime !== undefined && lockedItems[i].startTime !== null) {
							timeLockedServices.push(lockedItems[i]);
						}
					}
					log("getTimeLockedServices", "Exit");
					return timeLockedServices;
				},

				/**
				 * Returns the number of time locked services for the current user
				 * @method getTimeLockedServicesCount
				 * @return {Number} Number of locked services
				 */
				getTimeLockedServicesCount: function () {
					log("getTimeLockedServicesCount", "Enter and Exit");
					return this.getTimeLockedServices().length;
				},

				/**
				 * Returns the number of restricted services for the current user
				 * @method getRestrictedServicesCount
				 * @return {Number} Number of locked services
				 */
				getRestrictedServicesCount: function () {
					log("getRestrictedServicesCount", "Enter & Exit");
					return this.getRestrictedServices().length;
				},

				/**
				 * Restricted the given service for the given user
				 * @method setRestrictedService
				 * @param {String} serviceId
				 * @param {String} [userPin=''] Not needed in HTML/NMP build
				 * @param {Function} [callback=null] Not needed in HTML/NMP build
				 */
				setRestrictedService: function (serviceId, userPin, callback) {
					log("setRestrictedService", "Enter");
					var lockedItems = lockedServices.services,
						lockedItem = getLockedObjectForService(serviceId);

					if (lockedItem) {
						delete lockedItem.startTime;
						delete lockedItem.endTime;
					} else {
						lockedItems.push({
							'serviceId': serviceId
						});
					}
					setLockPrefs();
					log("setRestrictedService", "Exit");
				},

				/**
				 * Removes the given service from the restricted list of services for the given user
				 * @method unsetRestrictedService
				 * @param {String} serviceId
				 * @param {String} [userPin=''] Not needed in HTML/NMP build
				 * @param {Function} [callback=null] Not needed in HTML/NMP build
				 */
				unsetRestrictedService: function (serviceId, userPin, callback) {
					log("unsetRestrictedService", "Enter");
					var lockedItems = lockedServices.services,
						i,
						service;
					for (i = 0; i < lockedItems.length; i++) {
						service = lockedItems[i];
						if (serviceId === service.serviceId) {
							lockedItems.splice(i, 1);
							break;
						}
					}
					setLockPrefs();
					log("unsetRestrictedService", "Exit");
				},

				/**
				 * Sets the given services as restricted for the given user.
				 * These will override the current restricted services list
				 * @method setRestrictedServices
				 * @param {Object} serviceIds Array of serviceIds
				 * @param {String} [userPin=''] Not needed in HTML/NMP build
				 * @param {Function} [callback=null] Not needed in HTML/NMP build
				 */
				setRestrictedServices: function (serviceIds, userPin, callback) {
					log("setRestrictedServices", "Enter");
					var i;
					for (i = 0; i < serviceIds.length; i++) {
						this.setRestrictedService(serviceIds[i]);
					}
					log("setRestrictedServices", "Exit");
				},

				/**
				 * Removes the given services from the restricted list for the given user
				 * @method unsetRestrictedServices
				 * @param {Object} serviceIds Array of serviceIds
				 * @param {String} [userPin=''] Not needed in HTML/NMP build
				 * @param {Function} [callback=null] Not needed in HTML/NMP build
				 */
				unsetRestrictedServices: function (serviceIds, userPin, callback) {
					log("unsetRestrictedServices", "Enter");
					var i;
					for (i = serviceIds.length - 1; i >= 0; i--) {
						this.unsetRestrictedService(serviceIds[i]);
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
					var lockedItems = lockedServices.services,
						i,
						restrictedServiceIds = [];
					for (i = 0; i < lockedItems.length; i++) {
						if (lockedItems[i].startTime === undefined || lockedItems[i].startTime === null) {
							restrictedServiceIds.push(lockedItems[i].serviceId);
						}
					}
					return restrictedServiceIds;
				},

				/**
				 * Returns true if the given serviceId is restricted for the current user
				 * @method isServiceIdRestricted
				 * @param {String} serviceId
				 * @return {Boolean} True if the serviceId is restricted, false otherwise
				 */
				isServiceIdRestricted: function (serviceId) {
					log("isServiceIdRestricted", "Enter");
					if (!authenticationEnabled) {
						log("isServiceIdRestricted", "Exit");
						return false;
					}
					if (!serviceId) {
						log("isServiceIdRestricted", "Exit");
						return false;
					}
					if (getLockedObjectForService(serviceId)) {
						log("isServiceIdRestricted", "Exit");
						return true;
					}
					log("isServiceIdRestricted", "Exit");
					return false;
				},

				/**
				 * Creates a new user with same rights as the default user. These rights can be updated
				 * calling `setUserRatingValue()` and `setRestrictedService/setRestrictedServices()`.
				 * The new user will have the `userPin` as its PIN number.
				 *
				 * Not supported in HTML/NMP
				 * @method createUser
				 * @param {String} masterPin
				 * @param {String} userPin
				 */
				createUser: function (userPin) {
				},

				/**
				 * The current user will be set to the default user after the given time has passed.
				 * To cancel the authentication timer pass in 0 seconds
				 * Not supported in HTML/NMP
				 * @method setAuthenticationTimeout
				 * @param {Number} time Seconds
				 */
				setAuthenticationTimeout: function (time) {
				},

				/**
				 * Returns the time (in seconds) set for the authentication timer
				 *
				 * Not supported in HTML/NMP
				 * @method getAuthenticationTimeout
				 * @return {Number} The authentication timeout in seconds
				 */
				getAuthenticationTimeout: function () {
				},

				/**
				 * Returns true if the current user is the master user, false if not
				 *
				 * Not supported in HTML/NMP
				 * @method isCurrentUserMaster
				 * @return {Boolean} true if current user is the master user
				 */
				isCurrentUserMaster: function () {
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
