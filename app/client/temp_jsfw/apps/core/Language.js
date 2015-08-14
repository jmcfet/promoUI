/**
 * The primary function of this class is to load Language Bundle files onto an object
 * so that text in an application can be localised for a particular region.  There
 * are 2 types of language bundles, common and application-specific. A common language
 * bundle would be expected to be loaded only once, application language bundles
 * would contain strings specific to that application.
 *
 * A language bundle is simply a function definition containing string properties.
 * The class assumes that the language bundles for different locales are stored in
 * a directory matching the locale and that the files between the locales are named
 * the same.  Once loaded either via `loadLanguageBundle` or `importLanguageBundleForObject`
 * the internal language repository is maintained. Languages can be switched using the
 * `setLocale` and `refreshLanguageBundles` methods, any listeners registered with this class
 * will be executed once the repository is refreshed. `importLanguageBundleForObject`
 * attaches a method called getString to the passed object which when called returns the
 * language specific representation of the given string. This allows dynamic updates when
 * languages have been switched.
 *
 * @class $N.apps.core.Language
 * @singleton
 * @requires $N.apps.core.Log
 */

/*global location, XMLHttpRequest*/

define('jsfw/apps/core/Language',
	[
		'jsfw/apps/core/Log'
	],
	function (Log) {

		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.core = $N.apps.core || {};
		$N.apps.core.Language = (function () {

			var log = new $N.apps.core.Log("system", "Language"),
				locale = "en_gb",
				languageRepository = {common: {strings: {}}},
				listeners = [],
				lastLbPath = "";

			// private helper functions

			/**
			 * Applies a _strings property to the receivingObject which maps back to
			 * the common/application language bundle for the last loaded language
			 * bundle.  If initDateStrings is true then the receivingObject is also
			 * extended with dayNames, monthNames and shortMonthNames arrays.
			 * @method makeBackwardsCompatible
			 * @private
			 * @deprecated used for backward compatibility only
			 * @param {Object} receivingObject an object to receive the _strings parameter
			 * @param {Boolean} initDateStrings apply data strings to object
			 */
			function makeBackwardsCompatible(receivingObject, initDateStrings) {
				var str;
				receivingObject._strings = languageRepository.common.strings;
				if (languageRepository[lastLbPath]) {
					for (str in languageRepository[lastLbPath].strings) {
						if (languageRepository[lastLbPath].strings.hasOwnProperty(str)) {
							receivingObject._strings[str] = languageRepository[lastLbPath].strings[str];
						}
					}
				}
				if (initDateStrings) {
					receivingObject.dayNames = [receivingObject._strings.sunday, receivingObject._strings.monday, receivingObject._strings.tuesday, receivingObject._strings.wednesday, receivingObject._strings.thursday, receivingObject._strings.friday, receivingObject._strings.saturday];
					receivingObject._strings.dayNames = receivingObject.dayNames;

					receivingObject.monthNames = [receivingObject._strings.january, receivingObject._strings.february, receivingObject._strings.march, receivingObject._strings.april, receivingObject._strings.may, receivingObject._strings.june, receivingObject._strings.july, receivingObject._strings.august, receivingObject._strings.september, receivingObject._strings.october, receivingObject._strings.november, receivingObject._strings.december];
					receivingObject._strings.monthNames = receivingObject.monthNames;

					receivingObject.shortMonthNames = [receivingObject._strings.jan, receivingObject._strings.feb, receivingObject._strings.mar, receivingObject._strings.apr, receivingObject._strings.may, receivingObject._strings.jun, receivingObject._strings.jul, receivingObject._strings.aug, receivingObject._strings.sep, receivingObject._strings.oct, receivingObject._strings.nov, receivingObject._strings.dec];
					receivingObject._strings.shortMonthNames = receivingObject.shortMonthNames;
				}
			}

			/**
			 * Calls the registered listeners
			 * @method applyListeners
			 * @private
			 */
			function applyListeners() {
				log("applyListeners", "Enter");
				var i;

				for (i = listeners.length - 1; i >= 0; i--) {
					log("applyListeners", "Applying listener...");
					listeners[i].listener.apply(listeners[i].listeningObject, []);
				}
				log("applyListeners", "Exit");
			}

			/**
			 * Using the given key, adds the strings object to the languageRepository.
			 * @method addStringsObjectToRepository
			 * @private
			 * @param {String} key unique code to identify the language in the repository
			 * @param {String} path where the language bundle was loaded from
			 * @param {Object} strings The object containing the localised strings
			 * @param {String} name the name of the language bundle
			 */
			function addStringsObjectToRepository(key, path, strings, name) {
				log("addStringsObjectToRepository", "Adding to language repository : Key: " + key + " Path: " + path);
				languageRepository[key] = {
					path: path,
					strings: strings,
					locale: locale,
					name: name
				};
			}

			// public API

			return {
				//This is to be used only for unit testing
				REQUEST_OBJECT: XMLHttpRequest,

				/**
				 * Sets the locale to be used for loading language bundles
				 * @method setLocale
				 * @chainable
				 * @param {String} localeCode in the form `en_gb`, etc
				 */
				setLocale: function (localeCode) {
					locale = localeCode;
					return this;
				},

				/**
				 * Returns the locale to be used for loading language bundles
				 * @method getLocale
				 * @return {String}
				 */
				getLocale: function () {
					return locale;
				},

				/**
				 * Reloads the language bundle files that have been previously added to the
				 * language repository. This method would be called if the locale has
				 * been changed, for example. Once reloaded, any listeners registered to
				 * be notified of the refresh will be called.
				 * @method refreshLanguageBundles
				 */
				refreshLanguageBundles: function () {
					var lb,
						data,
						totalToLoad = 0,
						numberLoaded = 0;

					var loadedCallback = function () {
						numberLoaded++;
						log("refreshLanguageBundles", "completed language bundle reload " + String(numberLoaded) + " of " + String(totalToLoad));
						if (numberLoaded === totalToLoad) {
							log("refreshLanguageBundles", "calling listeners");
							applyListeners();
						}
					};

					for (lb in languageRepository) {
						if (languageRepository.hasOwnProperty(lb)) {
							totalToLoad++;
						}
					}

					for (lb in languageRepository) {
						if (languageRepository.hasOwnProperty(lb)) {
							data = languageRepository[lb];
							$N.apps.core.Language.loadLanguageBundle(loadedCallback, data.path, data.name, (lb === "common"));
						}
					}
					log("refreshLanguageBundles", "initiated reload of " + String(totalToLoad) + " language bundles");
				},

				/**
				 * Determines if the common language bundle has been
				 * loaded and is available in the repository
				 * @method isCommonLanuageBundleLoaded
				 * @return {Boolean} true if yes, false if not
				 */
				isCommonLanuageBundleLoaded: function () {
					if (languageRepository.common) {
						return true;
					}
					return false;
				},

				/**
				 * Determines if the language bundle identified by the lbPath has been
				 * loaded and is available in the repository.
				 * @method isLanguageBundleLoaded
				 * @param {String} lbPath the path of the language bundle
				 * @return {Boolean} true if yes, false if not
				 */
				isLanguageBundleLoaded: function (lbPath) {
					if (languageRepository[lbPath]) {
						return true;
					}
					return false;
				},

				/**
				 * Given an lbPath and lbName this function will load the language
				 * bundle that exists at the derived location as follows:
				 * lbPath<locale>/lbName. loadedCallback if passed to this function
				 * will be executed on load.
				 * @method loadLanguageBundle
				 * @param {Function} loadedCallback
				 * @param {String} lbpath path to the folder containing the language bundle either relative to the main page or absolute file path.
				 * @param {String} [lbName="LanguageBundle.js"] name of the language bundle file.
				 * @param {Boolean} [isCommon=false] whether the language bundle is a common one
				 */
				loadLanguageBundle: function (loadedCallback, lbpath, lbName, isCommon) {
					var key = isCommon ? "common" : lbpath,
						actualName = lbName || "LanguageBundle.js",
						stringObj,
						xmlhttp = new $N.apps.core.Language.REQUEST_OBJECT(),
						actualFilePath;

					if (window.CCOM && CCOM.recorder && lbpath.indexOf("http://") === -1) {
						//temporary fix due to issue with CCOM1.3 affecting relative paths when exposed in sub-applications
						actualFilePath = location.href.substring(0, location.href.lastIndexOf("/") + 1) + lbpath + locale + "/" + actualName;
					} else {
						actualFilePath = lbpath + locale + "/" + actualName;
					}
					log("loadLanguageBundle", "Loading language bundle " + actualFilePath);
					xmlhttp.open("GET", actualFilePath, false);
					xmlhttp.send(null);
					try {
						/*jslint evil: true */
						eval(xmlhttp.responseText);
						if (typeof CommonLanguageBundle !== "undefined") {
							stringObj = new CommonLanguageBundle();
						} else if (typeof LanguageBundle !== "undefined") {
							stringObj = new LanguageBundle();
						} else {
							throw new Error();
						}
						/*jslint evil: false */
						addStringsObjectToRepository(key, lbpath, stringObj, actualName);
						log("loadLanguageBundle", "Retrieved language bundle:" + actualFilePath);
					} catch (e) {
						log("loadLanguageBundle", "Failed to retrieve language bundle: " + actualFilePath + " : " + e);
					}
					if (loadedCallback) {
						loadedCallback();
					}
				},

				/**
				 * Removes the language bundle file identified by lbPath from the
				 * language repository.
				 * @method unloadLanguageBundle
				 * @param {String} lbpath unique path of the language bundle
				 */
				unloadLanguageBundle: function (lbpath) {
					delete languageRepository[lbpath];
				},

				/**
				 * Extends the `receivingObject` with a method `getString` that, when called with a
				 * parameter matching a property in the common language bundle or the
				 * language bundle identified by `lbPath`, returns the localised string.
				 * @method adornWithGetString
				 * @param {Object} receivingObject the object that is to be extended with localised strings
				 * @param {String} [lbPath=""] path to the language bundle
				 */
				adornWithGetString: function (receivingObject, lbPath) {
					log("adornWithGetString", "Enter");
					var getString = function (stringToGet) {
						if (languageRepository[lbPath]) {
							return languageRepository[lbPath].strings[stringToGet] || languageRepository.common.strings[stringToGet];
						}
						return languageRepository.common.strings[stringToGet];
					};
					receivingObject.getString = getString;
					log("adornWithGetString", "Exit");
				},

				/**
				 * See `adornWithGetString`. In addition, this method attaches a
				 * `_strings` property to the `receivingObject`
				 * @method initLanguageBundle
				 * @deprecated Use adornWithGetString
				 * @param {Object} receivingObject
				 * @param {Object} initDateStrings
				 */
				initLanguageBundle: function (receivingObject, initDateStrings) {
					$N.apps.core.Language.adornWithGetString(receivingObject, lastLbPath);
					makeBackwardsCompatible(receivingObject, initDateStrings);
				},

				/**
				 * Registers a function to be executed upon successful language
				 * bundle refresh. Many methods can be registered by repeat calls.
				 * @method registerListener
				 * @chainable
				 * @param {Function} listener a function to execute on refresh
				 * @param {Object} listeningObject a reference back to the object containing the listener
				 */
				registerListener: function (listener, listeningObject) {
					log("registerListener", "New Listener Added");
					listeners.push({listener: listener, listeningObject: listeningObject});
					return this;
				},

				/**
				 * Unregisters the previously registered function identified by the
				 * listener parameter. After calling this method, the function will
				 * no longer execute upon successful refresh
				 * @method unregisterListener
				 * @chainable
				 * @param {Function} listener
				 */
				unregisterListener: function (listener) {
					var i;
					for (i = 0; i < listeners.length; i++) {
						if (listeners[i].listener === listener) {
							log("unregisterListener", "Listener Removed");
							listeners.splice(i, 1);
							break;
						}
					}
					return this;
				},

				/**
				 * Convenience method for loading a language bundle if not already loaded,
				 * extending the receivingObject with the `getString` method and
				 * registering a callback for refresh calls.
				 * @method importLanguageBundleForObject
				 * @param {Object} receivingObject generally the object requesting the load
				 * @param {Function} loadedCallback code to execute when language bundle has loaded
				 * @param {String} lbpath path to the folder containing the language bundle without the locale
				 * @param {String} lbName name of the language bundle file
				 * @param {Function} updateCallback callback to register for when the language bundle is reloaded
				 * @param {Object} callbackContext (optional) context in which the loadedCallback will be invoked
				 */
				importLanguageBundleForObject: function (receivingObject, loadedCallback, lbpath, lbName, updateCallback, callbackContext) {
					var internalLoadedCallback = function () {
						$N.apps.core.Language.adornWithGetString(receivingObject, lbpath);
						if (updateCallback) {
							$N.apps.core.Language.registerListener(updateCallback, receivingObject);
						}
						if (loadedCallback) {
							if (callbackContext) {
								loadedCallback.call(callbackContext);
							} else {
								loadedCallback();
							}
						}
					};

					if ($N.apps.core.Language.isLanguageBundleLoaded(lbpath)) {
						internalLoadedCallback();
					} else {
						$N.apps.core.Language.loadLanguageBundle(internalLoadedCallback, lbpath, lbName, false);
					}
				}

			};

		}());
		return $N.apps.core.Language;
	}
);
