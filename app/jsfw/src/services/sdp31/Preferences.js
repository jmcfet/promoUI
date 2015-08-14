/**
 * Preferences is a singleton utility class used for retrieving and storing a preference stored in SDP.
 *
 * @class $N.services.sdp.Preferences
 * @static
 * @singleton
 * @requires $N.services.sdp.ServiceFactory
 * @author gstacey
 */
/* global define */
define('jsfw/services/sdp/Preferences',
	[
		'jsfw/services/sdp/ServiceFactory'
	],
	function (ServiceFactory) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};

		$N.services.sdp.Preferences = (function () {
			var ACCOUNT_ID = "";
			var USER_ID = "";
			var preferenceService;
			var MAX_VALUE_SIZE = 100;
			var SIZE_SUFFIX = "_LENGTH";

			/* PRIVATE METHODS */

			/**
			 * Gets the list of prefs stored in SDP against user and account ids
			 * and then passes the pref to the given callback
			 * @method getPref
			 * @private
			 * @param {String} preference Name of the preference to find
			 * @param {Function} callback Function to run upon successfully retrieving the preference
			 * @param {Function} failure Function to run if preference is not found
			 */
			function getPref(preference, callback, failure) {
				var getListCallback = function (list) {
					var i;
					var pref = null;
					for (i = 0; i < list.length; i++) {
						if (list[i].paramName === preference) {
							pref = list[i];
							break;
						}
					}
					if (pref) {
						callback(pref);
					} else {
						failure();
					}
				};
				preferenceService.getList(this, getListCallback, failure, ACCOUNT_ID, null, USER_ID);
			}

			function splitAndStore(preference, value, type, domain, success, failure) {
				//split into chunks
				var valueLength = value.length,
					totalChunks = Math.ceil(value.length / MAX_VALUE_SIZE),
					chunk,
					callbackCounter = 0,
					callback = function () {
						callbackCounter++;
						if (callbackCounter === totalChunks + 1) {
							success();
						}
					};

				for (var i = 0; i < totalChunks; i++) {
					chunk = value.substring(i * MAX_VALUE_SIZE, (i + 1) * MAX_VALUE_SIZE);
					setPref(preference + "_" + i, chunk, type, domain, callback, callback, true);
				}

				setPref(preference + SIZE_SUFFIX, i, type, domain, callback, callback, true);
			}

			function setPref(preference, value, type, domain, success, failure, isChunk) {
				domain = domain ? domain.toUpperCase() : null;
				preference = preference.toUpperCase();
				var me = this;
				var create = function () {
					if (value.length > MAX_VALUE_SIZE) {
						splitAndStore(preference, value, type, domain, success, failure);
					} else {
						if (!isChunk) {
							deleteSizeSuffix(preference, function () {
								preferenceService.create(me, success, failure, ACCOUNT_ID, domain, USER_ID, preference, value, type, null, null);
							}, function () {
								preferenceService.create(me, success, failure, ACCOUNT_ID, domain, USER_ID, preference, value, type, null, null);
							});
						} else {
							preferenceService.create(me, success, failure, ACCOUNT_ID, domain, USER_ID, preference, value, type, null, null);
						}

					}
				};
				var setPref = function (list) {
					var i;
					var uid = null;
					for (i = 0; i < list.length; i++) {
						if (list[i].paramName === preference) {
							uid = list[i].uid;
							break;
						}
					}
					if (uid) {
						preferenceService.del(this, create, failure, uid);
					} else {
						create();
					}
				};
				preferenceService.getList(this, setPref, failure, ACCOUNT_ID, null, USER_ID);
			}

			function deleteSizeSuffix(preference, success, fail) {
				getPref(preference + SIZE_SUFFIX, function (pref) {
					preferenceService.del(this, success, fail, pref.uid);
				}, fail);
			}

			function getChunksAndJoin(preference, prefSize, success, failure) {
				var i,
					chunksArray = [],
					callbackCount = 0,
					iReference,
					getPrefFunc = function (index) {
						getPref(preference + "_" + index, function (value) {
							getChunkCallback(index, value);
						}, function () {
							failure();
						});
					},
					getChunkCallback = function (index, value) {
						callbackCount++;
						chunksArray[index] = value.paramValue;
						if (callbackCount === prefSize) {
							success(chunksArray.join(""));
						}
					};
				for (i = 0; i < prefSize; i++) {
					getPrefFunc(i);
				}
			}

			function deletePrefAndSizeSuffix(pref, callback) {
				var i;
				var deletedPrefsCounter = 0;
				var prefSize;
				var prefDeleted = function () {
					deletedPrefsCounter++;
					if (deletedPrefsCounter === prefSize) {
						deleteSizeSuffix(pref, callback, callback);
					}
				};
				var deletePref = function (preference) {
					getPref(preference, function (prefResult) {
						preferenceService.del(this, prefDeleted, prefDeleted, prefResult.uid);
					}, prefDeleted);
				};
				getPref(pref + SIZE_SUFFIX, function (prefResult) {
					prefSize = parseInt(prefResult.paramValue, 10);
					if (prefSize > 0) {
						for (i = 0; i < prefSize; i++) {
							deletePref(pref + "_" + i);
						}
					}
				}, callback);
			}

			/* PUBLIC METHODS */

			return {

				/**
				 * Initialise the Preference class with the account and user ids
				 * @method init
				 * @param {Number} accountID
				 * @param {Number} userID
				 */
				init: function (accountID, userID) {
					preferenceService = $N.services.sdp.ServiceFactory.get("PreferenceService");
					ACCOUNT_ID = accountID;
					USER_ID = userID;
				},

				/**
				 * Initialise the Preference class with the account and user ids
				 * @method initialise
				 * @deprecated use init()
				 * @param {Number} accountID
				 * @param {Number} userID
				 */
				initialise: function (accountID, userID) {
					this.init(accountID, userID);
				},

				/**
				 * Retrieves a specified preference value.
				 *
				 * @method get
				 * @param {String} preference the name of the preference we're interested in
				 * @param {Function} success Function to run upon successfully retrieving the given preference
				 * @param {Function} failure Function to run upon failing to retrieve the given preference
				 */
				get: function (preference, success, failure) {
					var callback = function (pref) {
						success(pref.paramValue);
					};
					var failureCall = function () {
						if (failure) {
							failure();
						}
					};
					var getPrefSize = function (pref) {
						var prefSize = parseInt(pref.paramValue, 10);
						if (prefSize > 0) {
							getChunksAndJoin(preference, prefSize, success, failure);
						}
					};
					var getPrefSizeFailure = function () {
						getPref(preference, callback, failureCall);
					};
					getPref(preference + SIZE_SUFFIX, getPrefSize, getPrefSizeFailure);
				},

				/**
				 * Stores a specified preference. We are currently unable to override a preference value more than once so we
				 * have to delete and the create a new preference when wishing to update an existing preference
				 * @method set
				 * @param {String} preference the name of the preference we're interested in
				 * @param {String} value the value to be set
				 * @param {String} type Defines the parameter type associated to the preference (e.g. Long, String, Boolean etc)
				 * @param {String} domain Domain associated to the preference. Must be upper case and words separated by underscore (e.g. BV, NVOD, COD, COR etc)
				 * @param {Function} success Function to run after successfully setting the preference
				 * @param {Function} failure Function to run upon failure to set the preference
				 * @param {Boolean} isChunk True if part of a chunk - should only be set internally
				 */
				set: function (preference, value, type, domain, success, failure) {
					var prefDeleted = function () {
						setPref(preference, value, type, domain, success, failure);
					};
					deletePrefAndSizeSuffix(preference, prefDeleted, prefDeleted);
				},

				/**
				 * Removes a specified preference
				 *
				 * @method deletePreference
				 * @param {String} preference the name of the preference we'd like to remove
				 * @param {Function} success Function to run upon successfully deleting the preference
				 * @param {Function} failure Function to run upon failure to delete the preference
				 */
				deletePreference: function (preference, success, failure) {
					var callback = function (pref) {
						preferenceService.del(this, success, failure, pref.uid);
					};
					deletePrefAndSizeSuffix(preference, function () {
						getPref(preference, callback, failure);
					}, function () {
						getPref(preference, callback, failure);
					});
				}
			};
		}());
		return $N.services.sdp.Preferences;
	}
);