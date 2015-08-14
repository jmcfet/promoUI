/**
 * PresentationManager provides functionality to dynamically modify the layout and styling of Nagra GUI components.
 *
 * A presentation pack should be defined, containing the configuration parameters of
 * each GUI component (identified by its Id) requiring styling by the PresentationManager.
 * The presentation pack should be deposited as 'path/locale/skin/PresentationPack.js'.
 * The 'skin' folder is optional and depends on whether skins are being used.
 *
 * An example presentation pack could contain
 *
 *     function PresentationPack() {
 *         this.label_title = {
 *             x: 200, y: 100,
 *             fontSize: 30,
 *             alignment: "left"
 *         };
 *     };
 *
 * and could be deployed at
 *
 *     apps/zapperApplication/resources/en_gb/indigo/PresentationPack.js
 *
 * where 'zapperApplication' is our application folder, `en_gb` is a locale, and 'indigo' is a skin.
 *
 * The presentation pack is registered with the PresentationManager using the loadPresentationPack
 * method.  Note that the 'path' parameter should point to the base path which does not
 * include the 'locale' and 'skin' folders (in our example above, the path would be
 * `apps/zapperApplication/resources/`).
 *
 * The locale and skin is controlled using the setLocale and setSkin methods respectively.
 * These can be modified at any time during the application life cycle.  If changed, the
 * refreshPresentationPacks method should be invoked, which will cause all presentation packs
 * to be reloaded using the new locale and skin, and the registered refresh callbacks invoked.
 *
 * Typically, we would set the locale and skin within our launch JavaScript (the values could be obtained from a preferences file);
 *
 *     $N.gui.PresentationManager.setLocale("en_gb");
 *     $N.gui.PresentationManager.setSkin("indigo");
 *
 * Within an applications init method, we could then register a presentation pack:
 *
 *     $N.gui.PresentationManager.loadPresentationPack(presCallback,
 *         "apps/zapperApplication/resources/", "PresentationPack.js", presCallback);
 *
 * We can then style our components within our callback function:
 *
 *     $N.gui.PresentationManager.configure(view.label_title);
 *     $N.gui.PresentationManager.configure(view.button_start);
 *     $N.gui.PresentationManager.configure(view.button_cancel);
 *
 * If we make changes to the locale or skin during the applications life cycle, we can activate the styling changes using
 *
 *     $N.gui.PresentationManager.refreshPresentationPacks();
 *
 *
 * @class $N.gui.PresentationManager
 * @static
 *
 * @author Dylan Thomas
 * @requires $N.apps.core.Log
 */
define('jsfw/gui/PresentationManager',
    [
    'jsfw/apps/core/Log'
    ],
    function (Log) {

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.PresentationManager = (function () {
			var resourceCache = [];
			var repository = {};
			var locale = "";
			var skin = "";
			var log = new $N.apps.core.Log("SDKSystem", "PresentationManager");

			/**
			 * Adds a presentation pack of configuration objects to the current configuration repository.
			 * @method addToRepository
			 * @private
			 * @param {Object} config A JSON object describing a GUI configuration.
			 */
			function addToRepository(config) {
				var property;
				for (property in config) {
					if (config.hasOwnProperty(property)) {
						repository[property] = config[property];
					}
				}
			}

			/**
			 * Adds a presentation packs meta information to the resource cache.
			 * @method addToResourceCache
			 * @private
			 * @param {String} path The path of the presentation pack.
			 * @param {String} file The file name of the presentation pack.
			 * @param {Function} callback An optional function to be called when a refresh occurs.
			 */
			function addToResourceCache(path, file, callback) {
				resourceCache.push({'path': path, 'file': file, 'callback': callback});
			}

			/**
			 * Imports a presentation pack from a URL.
			 * @method importPack
			 * @private
			 * @param {String} url URL to be loaded.
			 * @param {Function} callback Function to be invoked on successful loading.
			 */
			function importPack(url, callback) {
				var stringObj,
					xmlhttp = new XMLHttpRequest();
				xmlhttp.open("GET", url, false);
				xmlhttp.send(null);
				try {
					/*jslint evil: true */
					eval("stringObj = new " + xmlhttp.responseText + "();");
					/*jslint evil: false */
					addToRepository(stringObj);
					log("importPack", "Retrieved presentation pack:" + url);
				} catch (e) {
					log("importPack", "Failed to retrieve presentation pack: " + url + " : " + e);
				}
				if (callback) {
					callback();
				}
			}

			return {

				/**
				 * Sets the locale of the PresentationManager.
				 * Note that this is not related to the locale of the Language module.
				 * @method setLocale
				 * @param {String} newLocale The new locale.
				 */
				setLocale: function (newLocale) {
					locale = newLocale;
					return this;
				},

				/**
				 * Returns the current locale of the PresentationManager.
				 * Note that this is not related to the locale of the Language module.
				 * @method getLocale
				 * @return {String} The current locale.
				 */
				getLocale: function () {
					return locale;
				},

				/**
				 * Sets the skin of the PresentationManager.
				 * @method setSkin
				 * @param {String} newSkin The new skin.
				 */
				setSkin: function (newSkin) {
					skin = newSkin;
					return this;
				},

				/**
				 * Returns the skin of the PresentationManager.
				 * @method getSkin
				 * @return {String} The current skin.
				 */
				getSkin: function () {
					return skin;
				},

				/**
				 * Loads a presentation pack into the PresentationManager.
				 * @method loadPresentationPack
				 * @param {Function} loadedCallback Function to call after initial loading.
				 * @param {String} path Path of the presentation pack.
				 * @param {String} file The file name of the presentation pack.
				 * @param {Function} refreshCallback An optional function to be called after a refresh of the PresentationManager.
				 */
				loadPresentationPack: function (loadedCallback, path, file, refreshCallback) {
					var url = path;
					url += locale ? locale + "/" : "";
					url += skin ? skin + "/" : "";
					url += file;

					log("loadConfigurations", "Loading presentation pack " + url);

					importPack(url, loadedCallback);
					addToResourceCache(path, file, refreshCallback);
					return this;
				},

				/**
				 * Causes the PresentationManager to refresh all presentation packs by reloading
				 * them and calling the refresh callbacks if available.
				 * @method refreshPresentationPacks
				 */
				refreshPresentationPacks: function () {
					var i;
					var end = resourceCache.length;
					var resource;
					var url;

					for (i = 0; i < end; i++) {
						resource = resourceCache[i];
						url = resource.path;
						url += locale ? locale + "/" : "";
						url += skin ? skin + "/" : "";
						url += resource.file;
						importPack(url, resource.callback);
					}
					return this;
				},

				/**
				 * Configures a Nagra GuiObject with a presentation configuration.
				 * @method configure
				 * @param {Object} guiObject A Nagra GuiObject.
				 */
				configure: function (guiObject) {
					var id,
						presentation;
					if (guiObject.getId) {
						id = guiObject.getId();
						presentation = $N.gui.PresentationManager.getPresentation(id);
						guiObject.configure(presentation);
					}
					return this;
				},

				/**
				 * Returns a presentation configuration for the supplied id.
				 * @method getConfiguration
				 * @param {String} id The id of the gui object
				 * @return {Object} A Nagra GuiObject JSON configuration
				 */
				getPresentation: function (id) {
					return repository[id];
				}

			};
		}());
		return $N.gui.PresentationManager;
    }
);