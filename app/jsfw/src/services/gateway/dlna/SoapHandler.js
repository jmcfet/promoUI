/**
 * SOAP
 * @class $N.services.gateway.dlna.SoapHandler
 * @author Scott Dermott
 * @constructor
 * @requires xml2json
 * @requires $N.apps.core.AjaxHandler
 */

/* global $, X2JS */
/* global define */
define('jsfw/services/gateway/dlna/SoapHandler',
	[
		'jsfw/apps/core/AjaxHandler'
	],
	function (AjaxHandler) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.gateway = $N.services.gateway || {};
		$N.services.gateway.dlna = $N.services.gateway.dlna || {};
		$N.services.gateway.dlna.SoapHandler = (function () {

			'use strict';

			var convertJSON = null;

			function createSoapRequest(elementName, namespaceUrl, params) {
				var innerEnv = convertJSON.json2xml_str(params),
					soapEnvelope = '<?xml version="1.0" encoding="utf-8"?>' +
					'<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">' +
					'<s:Body>' + '<u:' + elementName + ' xmlns:u="' + namespaceUrl + '">' +
					innerEnv + '</u:' + elementName + '>' +
					'</s:Body>' + '</s:Envelope>';
				return soapEnvelope;
		    }

		    function sendRequest(url, elementName, namespaceUrl, params, callback) {
				if (!convertJSON) {
					convertJSON = new X2JS();
				}
				var soapEnvelope = createSoapRequest(elementName, namespaceUrl, params),
					SOAPHeaders = {
						'SOAPAction' : '"' + namespaceUrl + '#' + elementName + '"',
						'Content-Type' : 'text/xml; charset="utf-8"'
					},
					data = {},
					httpRequest = new $N.apps.core.AjaxHandler();

				httpRequest.responseCallback = function (xmlhttp) {
					data.httpCode = xmlhttp.status;
					data.httpText = xmlhttp.statusText;
					data.content = convertJSON.xml_str2json(xmlhttp.response);
					data.typeOf = "SOAPResponse";

					if (!xmlhttp || xmlhttp.status !== 200) {
						callback(data);
					} else {
						data.status = "success";
						data.content = data.content.Envelope.Body[elementName + 'Response'] || data.content.Envelope.Body;
						callback(data);
					}
				};
				httpRequest.postData(url, SOAPHeaders, soapEnvelope);
		    }

		    // PUBLIC API
			return {

				/**
				 * sendRequest contructs and sends a SOAP Request
				 * @method sendRequest
				 * @param {String} url
				 * @param {String} elementName
				 * @param {String} namespaceUrl
				 * @param {Object} params
				 * @param {Function} callback An asynchronous callback
				 */
				sendRequest: sendRequest
			};

		}());
		return $N.services.gateway.dlna.SoapHandler;
	}
);