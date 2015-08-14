/**
 * Conforms to the CCOM 2.0 API
 *
 * Preferences is a singleton utility class for manipulating with a CCOM.preference. It contains methods to set and get
 * application preferences which may be as simple as a string or a number, or as complicated as an array of JS objects.
 *
 * @class $N.platform.system.Preferences
 * @singleton
 *
 * @requires $N.apps.util.JSON
 * @requires $N.apps.core.Log
 */

/*global CCOM*/

define('jsfw/platform/system/Preferences',
	[
		'jsfw/apps/core/Log',
		'jsfw/apps/util/JSON'
	],
	function (Log, JSON) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.system = $N.platform.system || {};

		$N.platform.system.Preferences = (function () {
			var log = new $N.apps.core.Log("system", "Preferences"),
				callbackList = {},
				jsfwPrefsPrefix = "/applications/shared/";

			var onChangeHandler = function (e) {
				var i,
					callbacks;
				if (callbackList[e.keyPath]) {
					callbacks = callbackList[e.keyPath];
					for (i = 0; i < callbacks.length; i++) {
						callbacks[i].callback.call(callbacks[i].context, e.keyValue);
					}
				}
			};

			var removeFromPrefsArray = function (preference, value) {
				var prefObject = CCOM.ConfigManager.getValue(preference),
				    storedArray,
				    i,
				    arrayLength,
				    isElementRemoved = false;

				try {
					storedArray = prefObject.error ? [] : $N.apps.util.JSON.parse(prefObject.keyValue);
				} catch (e) {
					storedArray = [];
				}

				if (storedArray && typeof storedArray === 'object' && storedArray.hasOwnProperty('length')) {
					for (i = 0, arrayLength = storedArray.length; i < arrayLength; i++) {
						if (storedArray[i] === value) {
							storedArray.splice(i, 1);
							isElementRemoved = true;
							break;
						}
					}
				}

				return {
					removed: isElementRemoved,
					newArray: storedArray
				};
			};

			var parsePreference = function (preference) {
				return jsfwPrefsPrefix + preference;
			};

			return {
				/**
				 * This method is required to initialise the event listener required by the preferences object
				 * when the CCOM object becomes available. Must be called prior to using this class.
				 * @method init
				 */
				init: function () {
					log("init", "Initialising Preferences...");
					CCOM.ConfigManager.addEventListener('onValueChanged', onChangeHandler);
				},

				/**
				 * This method is required to initialise the event listener required by the preferences object
				 * when the CCOM object becomes available. Must be called prior to using this class.
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
				 * @param {Boolean} [absolute] Set to true if preference is an absolute path
				 * @return {String} the stringified value of the specified preference
				 */
				get: function (preference, absolute) {
					var pref = absolute ? preference : parsePreference(preference),
						returnValue = CCOM.ConfigManager.getValue(pref);
					log("get", "path " + pref);
					if (returnValue && !returnValue.error) {
						return returnValue.keyValue;
					}
					return undefined;
				},

				/**
				 * Stores a specified preference. Useful for storing strings and numbers. For more complex data types, see `setPreferenceObject`.
				 *
				 * @method set
				 * @param {String} preference the key of the preference we're interested in
				 * @param {String} value the value to be set
				 * @param {Boolean} [absolute] Set to true if preference is an absolute path
				 * @return {Boolean} true if the value was set successfully; false otherwise
				 */
				set: function (preference, value, absolute) {
					var pref = absolute ? preference : parsePreference(preference),
						retValue = null;
					log("set", "path " + pref);
					if (value) {
						retValue = CCOM.ConfigManager.setValue(pref, value);
					}
					return (retValue && !retValue.error);
				},

				/**
				 * Retrieves a specified preference value as a JavaScript object. This could be used for retrieving complex data types like arrays and
				 * hashes.
				 *
				 * @method getPreferenceObject
				 * @param {String} preference the key of the preference we're interested in
				 * @param {Boolean} [absolute] Set to true if preference is an absolute path
				 * @return {Object} the JavaScript object stored in preferences
				 */
				getPreferenceObject: function (preference, absolute) {
					var pref = absolute ? preference : parsePreference(preference),
						prefValue = CCOM.ConfigManager.getValue(pref);
					log("getPreferenceObject", "path " + pref);
					try {
						return prefValue.error ? null : $N.apps.util.JSON.parse(prefValue.keyValue);
					} catch (e) {
						return null;
					}
				},

				/**
				 * Stores a specified preference as a serialised JavaScript object. Uses `$N.apps.util.JSON` to serialise the object.
				 *
				 * @method setPreferenceObject
				 * @param {String} preference the key of the preference we're interested in
				 * @param {Object} value the value to be set
				 * @param {Boolean} [absolute] Set to true if preference is an absolute path
				 * @return {Boolean} true if the value was set successfully; false otherwise
				 */
				setPreferenceObject: function (preference, value, absolute) {
					var pref = absolute ? preference : parsePreference(preference),
						retValue = null;
					log("setPreferenceObject", "path " + pref);
					if (value && typeof value === 'object') {
						retValue = CCOM.ConfigManager.setValue(pref, $N.apps.util.JSON.stringify(value));
					}
					return (retValue && !retValue.error);
				},

				/**
				 * Removes a specified preference
				 *
				 * @method deletePreference
				 * @param {String} preference the key of the preference we'd like to remove
				 * @param {Boolean} [absolute=false] Set to true if preference is an absolute path
				 * @return {Boolean} true if the value was set successfully; false otherwise
				 */
				deletePreference: function (preference, absolute) {
					var pref = absolute ? preference : parsePreference(preference),
						retValue = CCOM.ConfigManager.unsetValue(pref);
					log("delete", "path " + pref);
					return (retValue && !retValue.error);
				},

				/**
				 * Removes a specified value from a serialised JavaScript array.
				 *
				 * @method removeValueFromArray
				 * @param {String} preference the key of the preference we're interested in. This
				 * preference should be an array.
				 * @param {Object} value the value to be removed
				 * @param {Boolean} [absolute] Set to true if preference is an absolute path
				 * @return {Boolean} true if the value was found and removed successfully; false otherwise
				 */
				removeValueFromArray: function (preference, value, absolute) {
					var pref = absolute ? preference : parsePreference(preference),
						retValue = null,
						returnValue = removeFromPrefsArray(pref, value);
					log("removeValueFromArray", "path " + pref);
					if (returnValue && returnValue.removed) {
						retValue = CCOM.ConfigManager.setValue(pref, $N.apps.util.JSON.stringify(returnValue.newArray));
					}
					return (retValue && !retValue.error);
				},

				/**
				 * Watches the specified preference, and invokes the supplied callback in the supplied
				 * context when the value of the preference changes. The new value of the preference is
				 * passed to the callback in its invocation.
				 *
				 * @method monitorValue
				 * @param {String} preference the preference to be monitored
				 * @param {Object} callback the function that will be invoked when the value of the preference changes
				 * @param {Object} callbackContext the context in which the callback function will be invoked
				 * @param {Boolean} [absolute] Set to true if preference is an absolute path
				 */
				monitorValue: function (preference, changeCallback, callbackContext, absolute) {
					var pref = absolute ? preference : parsePreference(preference);
					log("monitorValue", "path " + pref);
					if (changeCallback) {
						if (!callbackList[pref]) {
							callbackList[pref] = [];
						}
						callbackList[pref].push({callback: changeCallback, context: callbackContext});
						CCOM.ConfigManager.addNotify(pref);
					}
				},

				/**
				 * Stops monitoring the specified preference, and unlinks the associated callback from the preference
				 *
				 * @method unmonitorValue
				 * @param {String} preference the preference in question
				 * @param {Function} callback the function that needs to be removed
				 * @param {Object} callbackContext the context in which the callback function was invoked
				 * @param {Boolean} [absolute] Set to true if preference is an absolute path
				 */
				unmonitorValue: function (preference, changeCallback, callbackContext, absolute) {
					var pref = absolute ? preference : parsePreference(preference),
						i,
						len;
					log("unmonitorValue", "path " + pref);
					if (pref && callbackList[pref] && callbackList[pref].length !== 0) {
						for (i = 0, len = callbackList[pref].length; i < len; i++) {
							if (callbackList[pref][i].callback === changeCallback && callbackList[pref][i].context === callbackContext) {
								callbackList[pref].splice(i, 1);
								break;
							}
						}
					}
				}
			};

		}());
		return $N.platform.system.Preferences;
	}
);
