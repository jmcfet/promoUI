/**
 * Dynamically loads the application's js files,
 * either all files, defined in applicationFiles.json
 * or a minified build.
 * The value is isMinified is set in build.xml
 *  @author rhill
 *
 * @class $N.app.ApplicationLoader
 * @static
 */
var $N = $N || {};
$N.app = $N.app || {};
$N.app.ApplicationLoader = (function ($N) {
	"use strict";
	return {

		/*
		 * Load all JS files into context
		 * @method load
		 * @param {String} json - Path to applicationFiles.json
		 * @param {Object} [doc] - Reference to a document to load the scripts into
		 * @param {Object} [context] - Reference to a window context to access the module
		 * @param {String} [module] - Name of a JS module
		 * @param {String} [callback] - Name of a JS module function to call when complete
		 * @public
		 */
		load: function (json, doc, context, module, callback) {
			var mode = navigator.userAgent.indexOf("Ekioh") > -1 ? "SVG" : "HTML",
				isEmulator = (typeof document.getElementById("CCOMid") !== "function"),
				docRef = doc || document,
				appendScriptTag,
				applicationUrls,
				urlsToLoad = [],
				script;

			function scriptsLoaded() {
				if (context && module && callback) {
					context[module][callback]();
				} else {
					window.Launch.load();
				}
			}

			function scriptLoadError(e) {
				var src = (e && e.target) ? e.target.src || e.target.getAttributeNS("http://www.w3.org/1999/xlink", "href") : "";
				throw new URIError("The script " + src + " is not accessible.");
			}

			function getJson(url) {
				var xmlhttp = new XMLHttpRequest();
				xmlhttp.open("GET", url, false);
				xmlhttp.send();
				return JSON.parse(xmlhttp.responseText);
			}

			function loadUrls(completeCallback) {
				if (urlsToLoad.length) {
					appendScriptTag(urlsToLoad.shift(), function () {
						loadUrls(completeCallback);
					});
				} else if (completeCallback) {
					completeCallback();
				}
			}

			appendScriptTag = {
				SVG: function (src, callback) {
					if (src) {
						script = docRef.createElementNS("http://www.w3.org/2000/svg", "script");
						script.setAttribute("type", "text/ecmascript");
						script.setAttributeNS("http://www.w3.org/1999/xlink", "href", src);
						script.onload = callback;
						script.addEventListener("error", scriptLoadError, false);
						docRef.documentElement.appendChild(script);
					} else if (callback) {
						callback();
					}
				},
				HTML: function (src, callback) {
					if (src) {
						script = docRef.createElement("script");
						script.setAttribute("type", "text/javascript");
						script.setAttribute("src", src);
						script.onload = callback;
						script.onerror = scriptLoadError;
						docRef.head.appendChild(script);
					} else if (callback) {
						callback();
					}
				}
			}[mode];

			applicationUrls = getJson(json);

			if (Array.isArray(applicationUrls)) {
				urlsToLoad = applicationUrls;
				loadUrls(scriptsLoaded);
			} else if (isEmulator) {
			    
				urlsToLoad = applicationUrls.EMULATOR;
				loadUrls(function () {
					urlsToLoad = applicationUrls.NATIVE;
					loadUrls(scriptsLoaded);
				});
			} else {
				urlsToLoad = applicationUrls.NATIVE;
				loadUrls(scriptsLoaded);
			}
		}

	};
}($N));
