/**
 * This class makes an XML-HTTP request to the specified URL. Requests can optionally be timed out by
 * the caller. If the request was successful, then the XHR object is passed back to the callback method
 * as an argument. If the request timed out, then the callback is invoked with a null argument. If the
 * request couldn't be completed because of network issues, then the exception is sent as the argument
 * to the callback. In the case of the failed requests, a second argument - (the Boolean literal) false -
 * is also sent to the callbacks. This enables callers to distinguish successful requests from failed ones.
 *
 * @class $N.apps.core.AjaxHandler
 * @constructor
 */

/*global window, setTimeout, clearTimeout*/

define('jsfw/apps/core/AjaxHandler',
	[],
	function () {
		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.core = $N.apps.core || {};
		$N.apps.core.AjaxHandler = function () {
			// The following line tells jslint not to worry about the fact that ActiveXObject and
			// XMLHttpRequest are not defined before it's used
			/*global ActiveXObject, XMLHttpRequest */

			var xmlhttp,
				readyStateTimer,
				me = this,
				method = '',
				messageBody = null,
				postMethodHeader,
				requestTimedout = false;

			/**
			 * Creates the XMLHttpObject
			 * @method getXmlHttpObject
			 * @private
			 * @return {Object} the XMLHttpObject if created, null otherwise
			 */
			var getXmlHttpObject = function () {
				var httpRequest = null;
				if (window.XMLHttpRequest) {
					// code for IE7+, Firefox, Chrome, Opera, Safari
					httpRequest = new XMLHttpRequest();
				}
				if (window.ActiveXObject) {
					// code for IE6, IE5
					httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
				}
				return httpRequest;
			};

			/**
			 * Calls the callback when the HTTP request is complete
			 * @method stateChanged
			 * @private
			 */
			var stateChanged = function () {
				var e;
				if (xmlhttp.readyState === 1) {
					try {
						if (method === 'POST' && typeof postMethodHeader === "string") {
							xmlhttp.setRequestHeader("Content-Length", 0);
							xmlhttp.setRequestHeader("Authorization", postMethodHeader);
							xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
							xmlhttp.setRequestHeader("Accept", "application/json");
						} if (method === 'POST' && typeof postMethodHeader === "object") {
							for (e in postMethodHeader) {
								if (postMethodHeader.hasOwnProperty(e)) {
									xmlhttp.setRequestHeader(e, postMethodHeader[e]);
								}
							}
						} else {
							xmlhttp.setRequestHeader("Content-Type", "text/plain; charset=UTF-8");
						}
						xmlhttp.send(messageBody);
					} catch (e) {
						console.log(e)
						if (e.code === 11) {
							xmlhttp.abort();
							if (me.responseCallback) {
								me.responseCallback(e, false);
							}
						}
					}
				} else if (xmlhttp.readyState === 4) {
					if (readyStateTimer) {
						clearTimeout(readyStateTimer);
					}
					if (!requestTimedout && me.responseCallback) {
						me.responseCallback(xmlhttp, true);
					}
				}
			};

			/**
			 * This can be set to a function to be called when the HTTP request has completed
			 * @property {Function} responseCallback
			 * @deprecated Use the setResponseCallback method instead
			 */
			this.responseCallback = function () {};


			/**
			 * Sets the callback function that will be invoked when the server responds. This function
			 * should expect its first argument to be the XHR object, and a second Boolean argument whose
			 * value will be true, except in case of failed requests when it will be false.
			 * @method setResponseCallback
			 * @param {Function} callback the function that will be invoked
			 *
			 */
			this.setResponseCallback = function (callback) {
				this.responseCallback = callback || function () {};
			};

			/**
			 * Makes an HTTP request to a given URL
			 * @method requestData
			 * @param {String} url The URL to connect to
			 * @param {Number} readyStateTimeoutTimeMS time in milliseconds to wait for ready
			 * state to be returned by the HTTP request
			 * @param {Boolean} [sync=false] indicates whether the request is to be synchronous. If specified
			 * and true, the request is synchronous; otherwise, the request is asynchronous (which is
			 * the default).
			 */
			this.requestData = function (url, readyStateTimeoutTimeMS, sync) {
				// asyncMode has the opposite meaning of the input parameter sync
				var asyncMode = (sync === true) ? false : true;
				if (readyStateTimeoutTimeMS) {
					readyStateTimer = setTimeout(function () {
						requestTimedout = true;
						me.responseCallback(null, false);
					}, readyStateTimeoutTimeMS);
				}
				method = "GET";
				xmlhttp.open(method, url, asyncMode);
			};

			/**
			 * Requests HTTP headers from a URL. This can be used to check if the resource
			 * exists at the specified URL.
			 * @method requestHeader
			 * @param {String} url The URL to connect to
			 * @param {Number} readyStateTimeoutTimeMS time in milliseconds to wait for ready
			 * state to be returned by the HTTP request
			 */
			this.requestHeader = function (url, readyStateTimeoutTimeMS) {
				if (readyStateTimeoutTimeMS) {
					readyStateTimer = setTimeout(function () {
						me.responseCallback(null, false);
					}, readyStateTimeoutTimeMS);
				}
				method = "HEAD";
				xmlhttp.open(method, url, true);
			};

			/**
			 * Makes an HTTP POST request to the given URL
			 * @method postData
			 * @param {String} url The URL to connect to
			 * @param {Object} header to send in an optional "Authorization" header field or an object containing all the header properties as specified for the XMLHttp object
			 * @param {String} body content to include in the POST request
			 */
			this.postData = function (url, header, body) {
				method = "POST";
				messageBody = body;
				postMethodHeader = header;
				xmlhttp.open(method, url, true);
			};

			/**
			 * Makes an HTTP DELETE request to the given URL
			 * @method deleteData
			 * @param {String} url The URL to call DELETE on
			 */
			this.deleteData = function (url) {
				method = "DELETE";
				messageBody = null;
				xmlhttp.open(method, url, true);
			};

			xmlhttp = getXmlHttpObject();
			xmlhttp.onreadystatechange = stateChanged;
		};
		return $N.apps.core.AjaxHandler;
	}
);