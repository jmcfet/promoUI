/**
 * Preferences is a singleton utility class for manipulating preferences. It contains methods to set and get
 * application preferences which may be as simple as a string or a number, or as complicated as an array of JS objects.
 *
 * @class $N.platform.system.Preferences
 * @singleton
 *
 * @requires $N.apps.util.JSON
 * @requires $N.apps.core.Log
 */

/*global window*/

define('jsfw/platform/system/Preferences',
	[
		'jsfw/apps/core/Log',
		'jsfw/apps/util/JSON'
	],
	function (Log, JSON) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.system = $N.platform.system || {};

		$N.platform.system.Preferences = (function (winRef) {
			var storage,
				log = new $N.apps.core.Log("system", "Preferences"),
				cookie = {};

			cookie.setItem = function (c_name,value) {
				var exdate=new Date(),
					exdays = 10;
				exdate.setDate(exdate.getDate() + exdays);
				var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
				document.cookie=c_name + "=" + c_value;
			};

			cookie.getItem = function (c_name) {
				var c_value = document.cookie,
					c_start = c_value.indexOf(" " + c_name + "=");
				if (c_start == -1) {
					c_start = c_value.indexOf(c_name + "=");
				}
				if (c_start == -1) {
					c_value = null;
				} else {
					c_start = c_value.indexOf("=", c_start) + 1;
					var c_end = c_value.indexOf(";", c_start);
					if (c_end == -1) {
						c_end = c_value.length;
					}
					c_value = unescape(c_value.substring(c_start,c_end));
				}
				return c_value;
			};

			function getStorageMethod() {
				try {
					localStorage.setItem("available", "true");
					return winRef.localStorage;
				} catch (e) {
					return cookie;
				}
			}

			return {
				/**
				 * Initialises the class. Must be called prior to using this class.
				 * @method init
				 */
				init: function () {
					storage = getStorageMethod();
				},

				/**
				 * Initialises the class. Must be called prior to using this class.
				 * @method initialise
				 * @deprecated use init()
				 */
				initialise: function () {
					this.init();
				},

				/**
				 * Retrieves a specified preference value as a string. If you need to retrieve a serialised object, use `getPreferenceObject`.
				 *
				 * @method get
				 * @param {String} preference the key of the preference we're interested in
				 * @return {String} the stringified value of the specified preference
				 */
				get: function (preference) {
					if (storage) {
						return storage.getItem(preference);
					}
					return null;
				},

				/**
				 * Stores a specified preference. Useful for storing strings and numbers. For more complex data types, see `setPreferenceObject`.
				 *
				 * @method set
				 * @param {String} preference the key of the preference we're interested in
				 * @param value {String} value the value to be set
				 * @return {Boolean} true if the value was set successfully; false otherwise
				 */
				set: function (preference, value) {
					if (storage) {
						storage.setItem(preference, value);
						return true;
					}
					return false;
				},
				/**
				 * Retrieves a specified preference value as a string. If you need to retrieve a serialised object, use `getPreferenceObject`.
				 *
				 * @method getPreference
				 * @deprecated use get
				 * @param {String} preference the key of the preference we're interested in
				 * @return {String} the value of the specified preference
				 */
				getPreference: function (preference) {
					log("getPreference", "Please use $N.platform.system.Preferences.get() instead", "warn");
					if (storage) {
						return storage.getItem(preference);
					}
					return null;
				},

				/**
				 * Stores a specified preference. Useful for storing strings and numbers. For more complex data types, see `setPreferenceObject`.
				 *
				 * @method setPreference
				 * @deprecated use set
				 * @param {String} preference the key of the preference we're interested in
				 * @param value {String} value the value to be set
				 * @return {Boolean} true if the value was set successfully; false otherwise
				 */
				setPreference: function (preference, value) {
					log("setPreference", "Please use $N.platform.system.Preferences.set() instead", "warn");
					if (storage) {
						storage.setItem(preference, value);
						return true;
					}
					return null;
				},

				/**
				 * Retrieves a specified preference value as a JavaScript object. This could be used for retrieving complex data types like arrays and
				 * hashes.
				 *
				 * @method getPreferenceObject
				 * @param {String} preference the key of the preference we're interested in
				 * @return {Object} the JavaScript object stored in preferences
				 */
				getPreferenceObject: function (preference) {
					var prefValue;
					if (storage) {
						prefValue = storage.getItem(preference);
						try {
							return prefValue ? $N.apps.util.JSON.parse(prefValue) : null;
						} catch (e) {
							return null;
						}
					}
					return null;
				},

				/**
				 * Stores a specified preference as a serialised JavaScript object. Uses `$N.apps.util.JSON` to serialise the object.
				 *
				 * @method setPreferenceObject
				 * @param {String} preference the key of the preference we're interested in
				 * @param {Object} value the value to be set
				 * @return {Boolean} true if the value was set successfully; false otherwise
				 */
				setPreferenceObject: function (preference, value) {
					if (storage) {
						if (value && typeof value === 'object') {
							storage.setItem(preference, $N.apps.util.JSON.stringify(value));
							return true;
						} else {
							return false;
						}
					}
					return false;
				},

				/**
				 * Removes a specified preference
				 *
				 * @method deletePreference
				 * @param {String} preference the key of the preference we'd like to remove
				 * @return {Boolean} true if the value was set successfully; false otherwise
				 */
				deletePreference: function (preference) {
					if (storage) {
						storage.removeItem(preference);
						return true;
					}
					return false;
				},

				/**
				 * Removes a specified value from a serialised JavaScript array.
				 *
				 * @method removeValueFromArray
				 * @param {String} preference the key of the preference we're interested in. This
				 * preference should be an array.
				 * @param {Object} value the value to be removed
				 * @return {Boolean} true if the value was found and removed successfully; false otherwise
				 */
				removeValueFromArray: function (preference, value) {
					var status = null,
						elementFound = false,
						i,
						arrayLength,
						storedArray;
					if (value) {
						storedArray = this.getPreferenceObject(preference);
						if (storedArray && typeof storedArray === 'object' && storedArray.hasOwnProperty('length')) {
							for (i = 0, arrayLength = storedArray.length; i < arrayLength; i++) {
								if (storedArray[i] === value) {
									storedArray.splice(i, 1);
									elementFound = true;
									break;
								}
							}
							if (elementFound) {
								storage.setItem(preference, $N.apps.util.JSON.stringify(storedArray));
								status = true;
							}
						}
					}
					return status;
				}
			};
		}(window));
		return $N.platform.system.Preferences;
	}
);