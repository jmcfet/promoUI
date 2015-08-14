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

		load: function (json) {
			var mode = navigator.userAgent.indexOf("Ekioh") > -1 ? "SVG" : "HTML",
				appendScriptTag,
				applicationUrls = {},
				urlsToLoad = [],
				script;

			function scriptsLoaded() {
				window.Launch.load();
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

			function loadCommonUrls() {
				urlsToLoad = applicationUrls.COMMON;
				loadUrls(scriptsLoaded);
			}

			appendScriptTag = {
				SVG: function (src, callback) {
					var href = (typeof src === "object") ? src[mode] : src;
					if (href) {
						script = document.createElementNS("http://www.w3.org/2000/svg", "script");
						script.setAttribute("type", "text/ecmascript");
						script.setAttributeNS("http://www.w3.org/1999/xlink", "href", href);
						script.onload = callback;
						script.addEventListener("error", scriptLoadError, false);
						document.documentElement.appendChild(script);
					} else if (callback) {
						callback();
					}
				},
				HTML: function (src, callback) {
					var href = (typeof src === "object") ? src[mode] : src;
					if (href) {
						script = document.createElement("script");
						script.setAttribute("type", "text/javascript");
						script.setAttribute("src", href);
						script.onload = callback;
						script.onerror = scriptLoadError;
						document.head.appendChild(script);
					} else if (callback) {
						callback();
					}
				}
			}[mode];

			applicationUrls = getJson(json);
			urlsToLoad = applicationUrls[mode];

			if (urlsToLoad) {
				loadUrls(loadCommonUrls);
			} else {
				loadCommonUrls();
			}
		}

	};
}($N));
