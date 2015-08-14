/**
 * Interacts with the head end LockerService
 * @class $N.services.sdp.LockerService
 * @constructor
 * @param{String} baseUrl - Locker Service Base URL
 * @param{String} port - Locker Service port
 * @param{String} servicePath - Path of the required LockerService API (E.G. - api/npvrlocker/v1)
 * @param{String} securityRequired - True or false depending on whether HTTPS should be used
 * @param{String} serviceProviderId - Service Provider ID
 */
/* global define, $N, window, */
define('jsfw/services/sdp/LockerService',
	[
		'jsfw/apps/core/Log',
		'jsfw/services/sdp/BaseService',
		'jsfw/apps/util/JSON',
		'jsfw/apps/core/XssRequest',
		'jsfw/services/sdp/Signon'
	],
	function (Log, BaseService, JSON, XssRequest, Signon) {
		var ConstructorTypes = {
				OBJ: "OBJ",
				STR: "STR",
				ARR: "ARR"
			},
			SERVER_RESPONSES = {
				CANNOT_DELETE_PROTECTED: "Cannot DELETE a protected RecordingRequest",
				COULD_NOT_LOOKUP_PROGRAM: "Could not look up Programme",
				QUOTA_EXCEEDED: "Quota exceeded"
			},
			ERROR = {
				CANNOT_DELETE_PROTECTED: "Unable to delete a protected Recording",
				UNAUTHORISED: "Unauthorised",
				INTERNAL_ERROR: "Locker Server Internal Error",
				FORBIDDEN: "Forbidden",
				FAILED_TO_PARSE: "Failed to parse server response",
				COULD_NOT_LOOKUP_PROGRAM: "Could not find program to record",
				QUOTA_EXCEEDED: "The quota for the account has been exceeded",
				UNKNOWN: "Unknown Error"
			},
			ERROR_CODES = {
				401: ERROR.UNAUTHORISED,
				403: ERROR.FORBIDDEN,
				500: ERROR.INTERNAL_ERROR,
				DEFAULT: ERROR.UNKNOWN
			};

		/*
		 * Private helper function used to determine constructor type.
		 */
		function getConstructorType(input) {
			var stringConstructor  = "test".constructor,
				objectConstructor = {}.constructor,
				arrayConstructor = [].constructor,
				inputConstructor = input.constructor,
				constructorType;

			if (inputConstructor === stringConstructor) {
				constructorType = ConstructorTypes.STR;
			} else if (inputConstructor === objectConstructor) {
				constructorType = ConstructorTypes.OBJ;
			} else if (inputConstructor === arrayConstructor) {
				constructorType = ConstructorTypes.ARR;
			}
			return constructorType;
		}

		/*
		 * Private helper function that builds a single query string item using a given key and value
		 */
		function createQueryParam(key, value) {
			var queryParam,
				valueType;

			if (key && (value || value === 0)) {
				valueType = getConstructorType(value);
				switch (valueType) {
				case ConstructorTypes.STR:
					value = encodeURIComponent(value);
					break;
				case ConstructorTypes.OBJ:
				case ConstructorTypes.ARR:
					value = encodeURIComponent($N.apps.util.JSON.stringify(value));
					break;
				}
				if (value !== "") {
					queryParam = encodeURIComponent(key) + "=" + value;
				}
			}
			return queryParam || null;
		}

		/*
		 * Private helper function that builds a query string based on the provided parameters
		 */
		function buildQueryString(paramsArray) {
			var i,
				len,
				kvp,
				key,
				value,
				flatParamsArray = [],
				param;

			for (i = 0, len = paramsArray.length; i < len; i++) {
				kvp = paramsArray[i];
				key = kvp[0];
				value = kvp[1];
				if (key &&  (value || value === 0)) {
					param = createQueryParam(key, value);
					if (param) {
						flatParamsArray.push(param);
					}
				}
			}
			return flatParamsArray.join("&");
		}

		/*
		 * Private helper function to remove "/" characters from the start or the end of a String.
		 */
		function sanitiseUrlComponent(component) {
			if (component) {
				if (component.charAt(component.length - 1) === "/") {
					component = component.substring(0, component.length - 1);
				}
				if (component.charAt(0) === "/") {
					component = component.substring(1);
				}
			}
			return component;
		}

		/*
		 * Main LockerService Constructor
		 */
		function LockerService(baseUrl, port, servicePath, securityRequired, serviceProviderId) {
			/**
			 * Enumerates the various sort types allowed for HTTP methods. One of GET, POST, PUT, DELETE
			 * @type {Object}
			 */
			this.HttpMethods = {
				GET: "GET",
				POST: "POST",
				PUT: "PUT",
				DELETE: "DELETE"
			};

			this.serviceEndpoints = {
				RECORDING_REQUESTS : "recordingrequests",
				QUOTA_USAGE : "quotausage"
			};

			this.ContentTypes = {
				JSON: "application/json"
			};

			this.reSignonAttempted = false;
			this.baseUrl = sanitiseUrlComponent(baseUrl);
			this.serviceProviderId = sanitiseUrlComponent(serviceProviderId);
			this.servicePath = sanitiseUrlComponent(servicePath);
			this.port = port;
			this.securityRequired = securityRequired;
			this._log = new $N.apps.core.Log("sdp", "LockerService");
		}

		/*
		 * Private helper function used to create the server URL.
		 */
		LockerService.prototype._createUrl = function (serviceType) {
			var protocol = this.securityRequired ? "https://" : "http://",
				path = this.servicePath ? (this.servicePath + "/" + serviceType + "/" + this.serviceProviderId) : (serviceType + "/" + this.serviceProviderId);

			return protocol + this.baseUrl + (this.port ? ":" + this.port + "/" + path : "/" + path);
		};

		/**
		 * Asynchronously invokes the specified locker service method.
		 * @method _invokeMethod
		 * @async
		 * @param {Function} successCallback - Function to execute on success
		 * @param {Function} failureCallback - Function to execute on failure
		 * @param {String} url - URL of web service
		 * @param {String} httpMethod - HTTP method to use
		 * @param {String} httpPayload - Parameters to be appended to URL or request body depending on HTTP method
		 * @param {String} queryParams - Query params to be added to URL
		 * @private
		 */
		LockerService.prototype._invokeMethod = function (successCallback, failureCallback, url, httpMethod, httpPayload, queryParams) {
			var me = this,
				token = this._getAuthToken(),
				xssRequest,
				fullQueryString = "",
				payloadConstructor,
				args = arguments,
				constructedUrl,
				parsedPayload,
				xssRequestSuccess = function (data) {
					me.reSignonAttempted = false;
					if (successCallback) {
						successCallback(data);
					}
				},
				xssRequestFailure = function (error) {
					if (error && error.httpStatus) {
						switch (error.httpStatus) {
						case 500:
							if (error.responseText && error.responseText.indexOf(SERVER_RESPONSES.COULD_NOT_LOOKUP_PROGRAM) !== -1) {
								failureCallback(ERROR.COULD_NOT_LOOKUP_PROGRAM);
							} else {
								failureCallback(ERROR_CODES[error.httpStatus]);
							}
							break;
						case 403:
							if (error.responseText && error.responseText.indexOf(SERVER_RESPONSES.CANNOT_DELETE_PROTECTED) !== -1) {
								failureCallback(ERROR.CANNOT_DELETE_PROTECTED);
							} else {
								failureCallback(ERROR_CODES[error.httpStatus]);
							}
							break;
						case 401:
							if (!me.reSignonAttempted) {
								me.reSignonAttempted = true;
								me._attemptResignon(args);
							} else {
								if(error.responseText.indexOf(SERVER_RESPONSES.QUOTA_EXCEEDED) !== -1) {
									failureCallback(ERROR.QUOTA_EXCEEDED);
								} else {
									failureCallback(ERROR_CODES[error.httpStatus]);
								}
							}
							break;
						default:
							failureCallback(ERROR_CODES[error.httpStatus] || ERROR_CODES.DEFAULT);
						}
					} else {
						failureCallback(ERROR_CODES.DEFAULT);
					}
				};

			if (token) {
				fullQueryString += "token=" + encodeURIComponent(token);
			}
			if (queryParams) {
				fullQueryString += token ? "&" + queryParams : queryParams;
			}
			constructedUrl = fullQueryString.length > 0 ? url + "?" + fullQueryString : url;
			xssRequest = new $N.apps.core.XssRequest(httpMethod, constructedUrl, xssRequestSuccess, xssRequestFailure);
			if ((httpMethod === this.HttpMethods.PUT || httpMethod === this.HttpMethods.POST) && httpPayload) {
				if (getConstructorType(httpPayload) === ConstructorTypes.OBJ) {
					xssRequest.setContentType(this.ContentTypes.JSON);
					parsedPayload = $N.apps.util.JSON.stringify(httpPayload);
				}
				xssRequest.send(parsedPayload);
			} else {
				xssRequest.send();
			}
		};

		/**
		 * Attempts re-sign on if the token is expired
		 * @private
		 */
		LockerService.prototype._attemptResignon = function (args) {
			var me = this,
			    signonSuccess = function () {
				    me._invokeMethod.apply(me, args);
					$N.services.sdp.Signon.unregisterListener(signonSuccess);
				};
			$N.services.sdp.Signon.registerListener(signonSuccess, this);
			$N.services.sdp.BaseService._RE_AUTHORISE_REQUEST.reIssueRequest();
		};

		/**
		 * Gets the Auth Token from BaseService
		 * @method getAuthToken
		 * @return{String} Auth token
		 * @private
		 */
		LockerService.prototype._getAuthToken = function () {
			return $N.services.sdp.BaseService._AUTH_TOKEN;
		};

		/**
		 * Asynchronously gets all recordings
		 * @method getAllRecordings
		 * @async
		 * @param {Function} successCallback - Function to execute on success
		 * @param {Function} failureCallback - Function to execute on failure
		 * @param {Object} filter - Filters to be applied to the request
		 * @param {Object} sortOrder - Order in which to return recordings
		 * @param {Object} fieldList - Fields to return
		 * @param {Number} count - Number of recordings to return
		 * @param {Number} offset - Offset
		 */
		LockerService.prototype.getAllRecordings = function (successCallback, failureCallback, filter, sortOrder, fieldList, count, offset) {
			var queryParams = buildQueryString([["filter", filter], ["sort", sortOrder], ["fields", fieldList], ["limit", count], ["offset", offset]]),
				url = this._createUrl(this.serviceEndpoints.RECORDING_REQUESTS);
			this._invokeMethod(successCallback, failureCallback, url, this.HttpMethods.GET, null, queryParams);
		};

		/**
		 * Asynchronously gets a single recording
		 * @method getSingleRecording
		 * @async
		 * @param {Function} successCallback - Function to execute on success
		 * @param {Function} failureCallback - Function to execute on failure
		 * @param {String} recordingId - ID of the recording to get
		 * @param {Object} fieldList - Fields to return
		 */
		LockerService.prototype.getSingleRecording = function (successCallback, failureCallback, recordingId, fieldList) {
			var queryParams = buildQueryString([["fields", fieldList]]),
				url = this._createUrl(this.serviceEndpoints.RECORDING_REQUESTS) + "/" + encodeURIComponent(recordingId);
			this._invokeMethod(successCallback, failureCallback, url, this.HttpMethods.GET, null, queryParams);
		};

		/**
		 * Asynchronously creates a recording request
		 * @method createRecordingRequest
		 * @async
		 * @param {Function} successCallback - Function to execute on success
		 * @param {Function} failureCallback - Function to execute on failure
		 * @param {String} mdsProgrammeId - ID of the MDS Event to schedule a recording for
		 * @param {String} accountId - ID of the account to associate with a scheduled recording
		 */
		LockerService.prototype.createRecordingRequest = function (successCallback, failureCallback, mdsProgrammeId, accountId) {
			var url = this._createUrl(this.serviceEndpoints.RECORDING_REQUESTS),
				httpPayload = {
					accountNumber: accountId,
					programmeId: mdsProgrammeId
				};
			this._invokeMethod(successCallback, failureCallback, url, this.HttpMethods.POST, httpPayload, null);
		};

		/**
		 * Asynchronously updates a recording request
		 * @method updateRecordingRequest
		 * @async
		 * @param {Function} successCallback - Function to execute on success
		 * @param {Function} failureCallback - Function to execute on failure
		 * @param {String} recordingId - ID of the recording to update
		 * @param {Object} payload - Recording request data to update.
		 */
		LockerService.prototype.updateRecordingRequest = function (successCallback, failureCallback, recordingId, payload) {
			var filter = {
					id: recordingId
				},
				queryString = buildQueryString([["filter", filter]]),
				url = this._createUrl(this.serviceEndpoints.RECORDING_REQUESTS);

			this._invokeMethod(successCallback, failureCallback, url, this.HttpMethods.PUT, payload, queryString);
		};

		/**
		 * Asynchronously deletes a recording
		 * @method deleteRecordingRequest
		 * @async
		 * @param {Function} successCallback - Function to execute on success
		 * @param {Function} failureCallback - Function to execute on failure
		 * @param {String} recordingId - ID of the recording to get
		 */
		LockerService.prototype.deleteRecordingRequest = function (successCallback, failureCallback, recordingId) {
			var url = this._createUrl(this.serviceEndpoints.RECORDING_REQUESTS) + "/" + encodeURIComponent(recordingId);
			this._invokeMethod(successCallback, failureCallback, url, this.HttpMethods.DELETE, null, null);
		};

		/**
		 * Asynchronously gets quota usage
		 * @method getQuotaUsage
		 * @async
		 * @param {Function} successCallback - Function to execute on success
		 * @param {Function} failureCallback - Function to execute on failure
		 * @param {String} accountNumber - ID of the account to get quota usage for
		 */
		LockerService.prototype.getQuotaUsage = function (successCallback, failureCallback, accountNumber) {
			var queryString = buildQueryString([["accountNumber", accountNumber]]),
				url = this._createUrl(this.serviceEndpoints.QUOTA_USAGE);
			this._invokeMethod(successCallback, failureCallback, url, this.HttpMethods.GET, null, queryString);
		};

		/**
		 * Defines constants for error types,
		 * one of:
		 * UNAUTHORISED,
		 * INTERNAL_ERROR,
		 * FORBIDDEN,
		 * UNKNOWN,
		 * CANNOT_DELETE_PROTECTED
		 * MAX_SIGNON_ATTEMPTS_REACHED
		 * @property {String} ERROR
		 */
		LockerService.ERROR = ERROR;

		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};
		$N.services.sdp.LockerService = LockerService;
		return LockerService;
	});
