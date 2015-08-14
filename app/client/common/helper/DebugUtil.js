/*global alert, console */
/**
 * Helper class for debugging
 * TODO: This is a dev helper class only. It should be removed from production builds
 * see: https://jira.opentv.com/browse/NETUI-1756
 *
 * @class $N.app.DebugUtil
 * @author rhill
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.DebugUtil = (function () {

		var timerStart,
			timerStop,
			timerDifference,
			CONSOLE_COLORS = {
				RESET: "\x1B[0m",
				BLACK: "\x1B[30m",
				RED: "\x1B[31m",
				GREEN: "\x1B[32m",
				YELLOW: "\x1B[33m",
				BLUE: "\x1B[34m",
				MAGENTA: "\x1B[35m",
				CYAN: "\x1B[36m",
				WHITE: "\x1B[37m"
			};

		function outputGlobalObjects() {
			var i = 0,
				obj;

			console.log("##################################");
			console.log("global objects:");
			console.log("##################################");
			for (obj in window) {
				if (window.hasOwnProperty(obj)) {
					console.log(obj);
					i++;
				}
			}
			console.log("##################################");
			console.log("global objects: " + i);
			console.log("##################################\n\n");
		}

		function getPercentMemoryUsage() {
			return Math.round((window.jsHeapUsed / window.jsHeapMax) * 10000, 2) / 100;
		}

		function outputMemoryUsage() {
			console.log("Percentage jsHeap usage: " + getPercentMemoryUsage() + "%");
		}

		function outputJsHeapUsed() {
			var date = new Date(),
				dateString = date.toISOString();
			dateString = dateString.substring(0, 10);
			console.log(dateString + "," + date.toLocaleTimeString() + "," + window.jsHeapUsed);
		}

		function outputDOMNodeCount(ctx) {
			var context = ctx || document;
			console.log("##################################");
			console.log("DOM node count: " + context.getElementsByTagName("*").length);
			console.log("##################################\n\n");
		}

		function startTimer() {
			console.log("##################################");
			console.log("Starting timer");
			timerStart = new Date();
			console.log("##################################\n\n");
		}

		function getTimerDifference() {
			console.log("##################################");
			timerDifference = timerStop - timerStart;
			console.log("timerDifference: " + timerDifference + " ms");
			console.log("##################################\n\n");
		}

		function resetTimer() {
			console.log("##################################");
			console.log("Reseting timer");
			timerStart = null;
			timerStop = null;
			timerDifference = null;
			console.log("##################################\n\n");
		}

		function stopTimer() {
			console.log("##################################");
			console.log("Stopping timer");
			timerStop = new Date();
			getTimerDifference();
			resetTimer();
			console.log("##################################\n\n");
		}
		/*
		 * Write to an external node.js server
		 *
		 * Run the following file in node.js
		 * It will output your log to the console and write to
		 * a file called log.txt in the same directory:
		 *
				var express = require('express'),
					app = express(),
					fs = require('fs');

				app.post('/log', function (req, res) {
					"use strict";

					var body = '';
					req.on('data', function (data) {
						body += data;
					});
					req.on('end', function () {
						console.log(body);
						fs.appendFile('log.txt', body + "\n");
					});

				});

				app.listen(2020);
				console.log('Listening on port 2020');
		 *
		 */
		function writeToExternalLog(obj, url) {
			var httpRequest = new $N.apps.core.AjaxHandler(),
				address = url || "http://10.8.2.54:2020/log",
				header = { 'Content-Type': 'application/json' };
			httpRequest.responseCallback = function () {};
			httpRequest.postData(address, header, JSON.stringify(obj));
		}


		/**
		 * combines any number of arguments (or arrays) into one single array
		 * @method combineArguments
		 * @params {Multiple} any number of parameters
		 */
		function combineArguments() {
			var retArgs = [];
			retArgs = retArgs.concat.apply(retArgs, arguments);
			return retArgs;
		}

		/**
		 * outputs to the terminal in color
		 * @method show
		 * @param {String} text - May include formatting
		 * @param {Enum} color - color to display in
		 * @params {Multiple} any number of parameters to be passed on to console.debug command
		 */
		function showText(text, color) {
			var additionalArguments = Array.prototype.slice.call(arguments, 2);
			console.debug.apply(console, combineArguments(color + text + CONSOLE_COLORS.RESET, additionalArguments));
		}

		/**
		 * outputs to the terminal in color
		 * @method show
		 * @param {String} text - May include formatting
		 * @param {Enum} color - color to display in
		 * @params {Multiple} any number of parameters to be passed on to console.debug command
		 */
		function showBox(text, color) {
			var additionalArguments = Array.prototype.slice.call(arguments, 2);

			console.debug(color + "*************************************************" + CONSOLE_COLORS.RESET);
			console.debug.apply(console, combineArguments(color + text + CONSOLE_COLORS.RESET, additionalArguments));
			console.debug(color + "*************************************************" + CONSOLE_COLORS.RESET);
		}

		/**
		 * outputs to the terminal in color
		 * @method show
		 * @param {String} text - May include formatting
		 * @param {Boolean} noBox - Dont display a box
		 * @param {Enum} color - color to display in
		 * @params {Multiple} any number of parameters to be passed on to console.debug command
		 */
		function show(text, noBox, color) {
			var additionalArguments = Array.prototype.slice.call(arguments, 3);

			if (noBox) {
				showText.apply(null, combineArguments(text, color, additionalArguments));
			} else {
				showBox.apply(null, combineArguments(text, color, additionalArguments));
			}
		}

		/**
		 * outputs to the terminal in green
		 * @method green
		 * @param  {String} text - May include formatting
		 * @param  {Boolean} noBox - Dont display a box
		 * @params {Multiple} any number of parameters to be passed on to console.debug command
		 */
		function green(text, noBox) {
			var additionalArguments = Array.prototype.slice.call(arguments, 2);
			show.apply(null, combineArguments(text, noBox, CONSOLE_COLORS.GREEN, additionalArguments));
		}

		/**
		 * outputs to the terminal in red
		 * @method red
		 * @param  {String} text - May include formatting
		 * @param  {Boolean} noBox - Dont display a box
		 * @params {Multiple} any number of parameters to be passed on to console.debug command
		 */
		function red(text, noBox) {
			var additionalArguments = Array.prototype.slice.call(arguments, 2);
			show.apply(null, combineArguments(text, noBox, CONSOLE_COLORS.RED, additionalArguments));
		}

		/**
		 * outputs to the terminal in blue
		 * @method blue
		 * @param  {String} text - May include formatting
		 * @param  {Boolean} noBox - Dont display a box
		 * @params {Multiple} any number of parameters to be passed on to console.debug command
		 */
		function blue(text, noBox) {
			var additionalArguments = Array.prototype.slice.call(arguments, 2);
			show.apply(null, combineArguments(text, noBox, CONSOLE_COLORS.BLUE, additionalArguments));
		}

		/**
		 * outputs to the terminal in white
		 * @method white
		 * @param  {String} text - May include formatting
		 * @param  {Boolean} noBox - Dont display a box
		 * @params {Multiple} any number of parameters to be passed on to console.debug command
		 */
		function white(text, noBox) {
			var additionalArguments = Array.prototype.slice.call(arguments, 2);
			show.apply(null, combineArguments(text, noBox, CONSOLE_COLORS.WHITE, additionalArguments));
		}

		/**
		 * outputs to the terminal in yellow
		 * @method ywllow
		 * @param  {String} text - May include formatting
		 * @param  {Boolean} noBox - Dont display a box
		 * @params {Multiple} any number of parameters to be passed on to console.debug command
		 */
		function yellow(text, noBox) {
			var additionalArguments = Array.prototype.slice.call(arguments, 2);
			show.apply(null, combineArguments(text, noBox, CONSOLE_COLORS.YELLOW, additionalArguments));
		}

		/**
		 * outputs to the terminal in cyan
		 * @method cyan
		 * @param  {String} text - May include formatting
		 * @param  {Boolean} noBox - Dont display a box
		 * @params {Multiple} any number of parameters to be passed on to console.debug command
		 */
		function cyan(text, noBox) {
			var additionalArguments = Array.prototype.slice.call(arguments, 2);
			show.apply(null, combineArguments(text, noBox, CONSOLE_COLORS.CYAN, additionalArguments));
		}

		/**
		 * @method es6Support
		 */
		function ifExists(obj) {
			return (obj) ? true : false;
		}

		/**
		 * @method es6Support
		 */
		function es6Support() {
			console.log("Object.assign: " + ifExists(Object.assign));
			console.log("Object.create: " + ifExists(Object.create));
			console.log("Object.defineProperties: " + ifExists(Object.defineProperties));
			console.log("Object.defineProperty: " + ifExists(Object.defineProperty));
			console.log("Object.freeze: " + ifExists(Object.freeze));
			console.log("Object.getOwnPropertyDescriptor: " + ifExists(Object.getOwnPropertyDescriptor));
			console.log("Object.getOwnPropertyNames: " + ifExists(Object.getOwnPropertyNames));
			console.log("Object.getOwnPropertySymbols: " + ifExists(Object.getOwnPropertySymbols));
			console.log("Object.getPrototypeOf: " + ifExists(Object.getPrototypeOf));
			console.log("Object.is: " + ifExists(Object.is));
			console.log("Object.isExtensible: " + ifExists(Object.isExtensible));
			console.log("Object.isFrozen: " + ifExists(Object.isFrozen));
			console.log("Object.isSealed: " + ifExists(Object.isSealed));
			console.log("Object.keys: " + ifExists(Object.keys));
			console.log("Object.preventExtensions : " + ifExists(Object.preventExtensions));
			console.log("Object.prototype: " + ifExists(Object.prototype));
			console.log("Object.seal: " + ifExists(Object.seal));
			console.log("Object.setPrototypeOf: " + ifExists(Object.setPrototypeOf));
			console.log("Object.mixin: " + ifExists(Object.mixin));
			console.log("Map: " + ifExists(window.Map));
			console.log("WeakMap: " + ifExists(window.WeakMap));
			console.log("Set: " + ifExists(window.Set));
			console.log("WeakSet: " + ifExists(window.WeakSet));
			console.log("Symbol: " + ifExists(window.Symbol));
			console.log("ArrayBuffer: " + ifExists(window.ArrayBuffer));
			console.log("TypedArray: " + ifExists(window.TypedArray));
			console.log("Int8Array: " + ifExists(window.Int8Array));
			console.log("DataView: " + ifExists(window.DataView));
			console.log("Promise: " + ifExists(window.Promise));
		}

		/**
		 * @method es7Support
		 */
		function es7Support() {
			console.log("Object.observe: " + ifExists(Object.observe));
		}

		// Public
		return {
			green: green,
			red: red,
			blue: blue,
			white: white,
			yellow: yellow,
			cyan: cyan,
			outputGlobalObjects: outputGlobalObjects,
			outputMemoryUsage: outputMemoryUsage,
			outputDOMNodeCount: outputDOMNodeCount,
			getPercentMemoryUsage: getPercentMemoryUsage,
			outputJsHeapUsed: outputJsHeapUsed,
			startTimer: startTimer,
			stopTimer: stopTimer,
			writeToExternalLog: writeToExternalLog,
			es6Support: es6Support,
			es7Support: es7Support
		};
	}());

}($N || {}));

// display a selection of ES6 and ES7 support details just after boot
/*window.setTimeout(function () {
	//$N.app.DebugUtil.es6Support();
	//$N.app.DebugUtil.es7Support();
}, 10000);*/

// receive console output about number of DOM nodes
//window.setInterval($N.app.DebugUtil.outputDOMNodeCount, 5000);

// receive console output about memory usage
//window.setInterval($N.app.DebugUtil.outputJsHeapUsed, 5000);

// post memory usage to node.js server log
/*
window.setInterval(function () {
	var obj = {
		"time": String(Date.now()),
		"jsHeapUsed": String(window.jsHeapUsed),
		"percentageJsHeapUsed": String($N.app.DebugUtil.getPercentMemoryUsage()),
		"DOMNodeCount": String(document.getElementsByTagName("*").length)
	};
	$N.app.DebugUtil.writeToExternalLog(obj);
}, 10000);
*/


// receive console output about global objects
//window.setInterval($N.app.DebugUtil.outputGlobalObjects, 20000);

// turn on profiling --- currently this will crash gravity even when jsHeap is increased fourfold via ekioh.cfg
//window.profiling = true;
