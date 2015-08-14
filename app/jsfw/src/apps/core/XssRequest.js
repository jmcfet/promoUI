/**
 * An XssRequest performs an AJAX request using the most appropriate method
 * to avoid cros-ssite scripting (XSS) issues.
 * @class $N.apps.core.XssRequest
 * @requires $N.apps.core.Log
 *
 * @constructor
 * @param {String} verb The HTTP verb to use in the request [GET|POST|PUT|DELETE]
 * @param {String} url The full URL (including querystring) for the request
 * @param {Function} successCallback Function to be called when the request is successful
 * @param {Function} failureCallback Function to be called when the request has failed
 */

/* global window, $N, define */
/* jslint browser: true */
define('jsfw/apps/core/XssRequest', ['jsfw/apps/core/Log'], function(Log) {
	var log = new $N.apps.core.Log('apps.util', 'XssRequest'),
		XssTransport;

	function XssRequest(verb, url, successCallback, failureCallback) {
		log('ctor', 'ctor entered, ' + verb + ' ' + url);

		var xssRequest = this;
		this.transport = new XssTransport(verb, url, success, failure);
		this._failureCallback = failureCallback;

		// These callbacks will be triggered in the Transport's context
		function success(data) {
			log('success', 'Success callback entered');

			if(xssRequest._timeout) {
				clearTimeout(xssRequest._timeout);
			}

			try {
				// Fetch the contentType from the response
				// TODO: Expose these on the underlying transport, implementation specific detail as XDR differs from XHR in this respect
				var contentType = xssRequest.transport._request.getResponseHeader ? xssRequest.transport._request.getResponseHeader('Content-Type') : xssRequest.transport._request.contentType;
				if(contentType && contentType.indexOf('application/json') > -1 && xssRequest.transport._request.status !== 204 && xssRequest.transport._request.status !== 201) {
					log('success', 'Converting application/json response to JSON object');

					// TODO: Can we use JSON.parse now?
					/*jslint evil: true */
					data = eval('(' + data + ')');
					/*jslint evil: false */
				}
			} catch(e) {
				log('success', 'Unable to parse returned data as JSON');
				failureCallback(new XssRequest.XssError(e.message, e, this.httpStatus, this.responseText));
				return;
			}

			successCallback(data);

			log('success', 'Success callback exited');
		}

		function failure(e) {
			log('failure', 'onerror entered, error: ' + e.message);

			if(xssRequest._timeout) {
				clearTimeout(xssRequest._timeout);
			}

			failureCallback(e);

			log('failure', 'onerror exited');
		}

		log('ctor', 'ctor exited');
	}


	/**
	 * Send the underlying AJAX request with the supplied body
	 *
	 * @method send
	 * @param {String} [body] The string to be sent in the HTTP request's body
	 */
	XssRequest.prototype.send = function(body) {
		body = body || null;
		log('send', 'Sending with' + (body === null ? 'out' : '') + ' a request body');
		this.transport.send(body);
	};

	/**
	 * Set the value for the Content-Type request header.
	 *
	 * @method setContentType
	 * @param {String} type The MIME type for the request body, e.g. x-www-form-urlencoded or application/json
	 */
	XssRequest.prototype.setContentType = function(type) {
		this.transport.setContentType(type);
	};

	/**
	 * Set a timeout value and callback
	 *
	 * @method setTimeout
	 * @param {Number} timeout The length of time that constitutes a timeout, in milliseconds
	 */
	XssRequest.prototype.setTimeout = function(timeout) {
		var xssRequest = this;
		timeout = timeout || 60000;

		this._timeout = setTimeout(function() {
			log('_timeout', 'Timeout occured, aborting request');
			xssRequest.transport._hasTimedOut = true;
			xssRequest.transport._request.abort();
			xssRequest._failureCallback(new XssRequest.XssError('Timeout', null, 0, xssRequest.transport._request.responseText));
		}, timeout);
	};

	/**
	 * AJAX over XMLHttpRequest. XMLHttpRequest is the standard method for
	 * performing AJAX requests. Specifically, requires the new
	 * XMLHttpRequest 2 event handlers (onload, onerror).
	 *
	 * @class $N.apps.core.XssRequest.XHRTransport
	 * @constructor
	 * @private
	 *
	 * @param {String} verb The HTTP verb to use in the request [GET|POST|PUT|DELETE]
	 * @param {String} url The full URL (including querystring) for the request
	 * @param {Function} successCallback Function to be called when the request is successful
	 * @param {Function} failureCallback Function to be called when the request has failed
	 */
	function XHRTransport(verb, url, successCallback, failureCallback) {
		log('XHRTransport.ctor', 'ctor entered');
		var transport = this;

		this._request = new XMLHttpRequest();

		// We would like to utilise onload/onerror etc., however
		// Ekioh does not implement XMLHttpRequest2.
		// TODO: Replace with new XMLHttpRequest2 methods when Ekioh allows
		this._request.onreadystatechange = function() {
			if(this.readyState === 4 && !transport._hasTimedOut) {
				log('XHRTransport.onreadystatechange', 'onreadystatechange entered');
				if(this.readyState === 4 && this.status >= 200 && this.status < 300) {
					log('XHRTransport.onreadystatechange', 'XHR was successful');
					successCallback(this.responseText);
				} else if (this.status === 0 && this.getAllResponseHeaders()) {
					log('XHRTransport.onreadystatechange', 'XHR may have encountered a cross-origin error');
					failureCallback(new XssRequest.XssError('X-Origin error', null, 0));
				} else {
					log('XHRTransport.onreadystatechange', 'XHR failed with status: ' + this.status);
					failureCallback(new XssRequest.XssError('Bad HTTP response status', null, this.status, this.responseText));
				}
				log('XHRTransport.onreadystatechange', 'onreadystatechange exited');
			}
		};

		this._request.open(verb, url, true);
		log('XHRTransport.ctor', 'ctor exited');
	}

	/**
	 * Sends the underlying request with the optional request body
	 *
	 * @private
	 * @method send
	 * @param {String} [body] A string to be sent in the request body
	 */
	XHRTransport.prototype.send = function(body) {
		log('XHRTransport.send', 'Sending request');
		// Call send outside of onreadystatechange
		this._request.send(body);
	};

	/**
	 * Sets the content type for the underlying request.
	 *
	 * @private
	 * @method setContentType
	 * @param {String} type The value for the Content-Type request header
	 */
	XHRTransport.prototype.setContentType = function(type) {
		this._request.setRequestHeader('Content-Type', type);
	};


	/**
	 * AJAX over XDomainRequest. XDomainTransport provides XSS AJAX support for
	 * IE9, which does not offer CORS support for XMLHttpRequest.
	 *
	 * @class $N.apps.core.XssRequest.XDomainTransport
	 * @constructor
	 * @private
	 *
	 * @param {String} verb The HTTP verb to use in the request [GET|POST|PUT|DELETE]
	 * @param {String} url The full URL (including querystring) for the request
	 * @param {Function} successCallback Function to be called when the request is successful
	 * @param {Function} failureCallback Function to be called when the request has failed
	 */
	function XDomainTransport(verb, url, successCallback, failureCallback) {
		log('XDomainTransport.ctor', 'ctor entered');
		var transport = this;

		this._verb = verb;
		this._url = url;

		if(verb === XssRequest.Verbs.PUT || verb === XssRequest.Verbs.DELETE) {
			throw new Error('Invalid HTTP verb when using XDomainRequest');
		}

		this._request = new window.XDomainRequest();

		this._request.onload = function() {
			log('XDomainTransport.onload', 'onload entered');
			successCallback(this.responseText);
			log('XDomainTransport.onload', 'onload exited');
		};

		this._request.onerror = function(e) {
			log('XDomainTransport.onerror', 'onerror entered');
			if(!transport._hasTimedOut) {
				if(e) {
					failureCallback(new XssRequest.XssError(e.type, e, undefined, this.responseText));
				} else {
					failureCallback(new XssRequest.XssError('Unknown HTTP error', null, undefined, this.responseText));
				}
			}
			log('XDomainTransport.onerror', 'onerror exited');
		};

		// NINJA-1360 IE9 and IE10 aborting requests FIX
		this._request.onprogress = function () {};
		this._request.ontimeout = function () {};

		log('XDomainTransport.ctor', 'ctor exited');
	}

	/**
	 * After opening the request, triggers sending of the XDR object with the supplied request body.
	 * Performs conversion of x-www-form-urlencoded POSTs to a GET querystring.
	 *
	 * @private
	 * @method send
	 * @param {String} [body] A string to be sent in the request body
	 */
	XDomainTransport.prototype.send = function(body) {
		var transport = this;

		if(this._convertPostToGet) {
			this._request.open(XssRequest.Verbs.GET, this._url + '?' + body);
			body = null;
		} else {
			this._request.open(this._verb, this._url);
		}

		log('XDomainTransport.send', 'Sending request on next tick');
		// NINJA-1143 - XDomainRequest failing in ie9 FIX
		setTimeout(function() {
			log('XDomainTransport.send', 'Sending request');
			transport._request.send(body);
		}, 0);
	};


	/**
	 * Setting the content type of an XDR isn't possible, so silently ignore.
	 * If content type is x-www-form-urlencoded, set the transport up to
	 * convert POST params to a GET querystring on send.
	 *
	 * @private
	 * @method setContentType
	 * @param {String} type The value for the Content-Type request header
	 */
	XDomainTransport.prototype.setContentType = function(type) {
		// If we attempt to set a XDomainRequest's content type to x-www-form-urlencoded, as needed for SDP,
		// there is a good chance it won't work. Attempt to process it as a GET request instead.
		if(this._verb === XssRequest.Verbs.POST && type.indexOf('x-www-form-urlencoded') > -1) {
			log('XDomainTransport.setContentType', 'Attempting default fallback to GET with querystring');
			this._convertPostToGet = true;
		} else {
			log('XDomainTransport.setContentType', 'Ignoring content type (unsupported)');
		}
	};

	// Detect capabilities and choose a transport
	if((window.XDomainRequest) && navigator.userAgent.indexOf('MSIE 10.0') === -1) {
		XssTransport = XDomainTransport;
	} else {
		XssTransport = XHRTransport;
	}

	/**
	 * A XssError
	 * @class $N.apps.core.XssRequest.XssError
	 *
	 * @constructor
	 * @param {String} message A message indicating the cause of the XSS error
	 * @param {Object} [e] The underlying error object or event
	 * @param {Number} [code] The HTTP status returned, if no error was supplied, e.g. 500
	 */
	XssRequest.XssError = function(message, e, code, responseText) {
		this.message = message;
		this.error = e;
		this.httpStatus = code;
		this.responseText = responseText;
	};

	XssRequest.XssError.prototype = Error;

	/**
	 * Defines the supported HTTP verbs for an XssRequest
	 * @enum {String} $N.apps.core.XssRequest.Verbs
	 */
	XssRequest.Verbs = {
		GET: 'GET',
		POST: 'POST',
		PUT: 'PUT',
		DELETE: 'DELETE',
		HEAD: 'HEAD'
	};

	window.$N = window.$N || {};
	$N.apps = $N.apps || {};
	$N.apps.core = $N.apps.core || {};
	$N.apps.core.XssRequest = XssRequest;

	return $N.apps.core.XssRequest;
});

