/**
 * This class manages interactions with HomeCruise.
 * @class $N.services.gateway.HomeCruise
 * @static
 * @requires jQuery
 * @requires $N.apps.core.Log
 * @requires $N.services.gateway.EPGServiceFactory
 * @requires $N.services.gateway.EPGEventFactory
 * @author Ian Wootten
 */

/*global jQuery, triggerListeners, onDeregistrationResponse, getChannelList, detune, fetchEitData, clearInterval, setInterval, window*/
define('jsfw/services/gateway/HomeCruise',
	[
		'jsfw/apps/core/Log',
		'jsfw/services/gateway/EPGServiceFactory',
		'jsfw/services/gateway/EPGEventFactory'
	],
	function (Log, EPGServiceFactory, EPGEventFactory) {

		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.gateway = $N.services.gateway || {};

		$N.services.gateway.HomeCruise = (function () {

			var log = new $N.apps.core.Log("gateway", "HomeCruise"),
				STATE = {
					UNKNOWN: 0,
					REGISTERED: 1,
					TUNED: 2
				},
				COMMANDS = {
					REGISTER: "create",
					PING: "ping",
					REMOVE: "delete",
					TUNE: "tune",
					DETUNE: "detune",
					SERVICES: "services",
					PIN_CHANGE: "parentalPIN",
					PIN_FETCH: "parentalPIN",
					RATING_CHANGE: "parentalRating",
					RATING_FETCH: "parentalRating",
					LOCK: "parentalLockedService",
					UNLOCK: "parentalLockedService",
					GETCONTENTKEY: "aes.key",
					SCAN: "scan",
					GETSCANSTATUS: "getscanstatus",
					EVENT_INFO: "eitInfo",
					STATUS: "status"
				},
				STATUS = {
					SUCCESS: 0,
					REQUEST_UNKNOWN: -29,
					ILLEGAL_ARGS: -30,
					UNKNOWN_REGISTRATION_ID: -31,
					BOOT_IN_PROGRESS: -32,
					UNKNOWN_SERVICE: -35,
					SERVICE_LIST_UNAVAILABLE: -36,
					SERVICE_UNAVAILABLE: -37,
					MAX_TUNER_COUNT_EXCEEDED: -39,
					BROADCAST_TIME_UNAVAILABLE: -40,
					BUSY_SCANNING_CHANNELS: -42,
					EMPTY_DB: -46,
					USER_NOT_AUTHORIZED: -49
				},
				PLAYER = {
					PC: 0,
					IPAD: 1,
					IPHONE: 2,
					MACOS: 3
				},
				ALERT = {
					TUNE_SUCCESS: 0,
					TUNE_FAIL: 1,
					TUNE_CANCELED: 2,
					TUNE_STARTED: 3,
					BLACKOUT_EVENT: 4,
					SMARTCARD_DISCONNECTED: 5,
					SMARTCARD_CONNECTED: 6,
					SMARTCARD_ERROR: 7,
					SOURCE_DISCONNECTED: 8,
					SOURCE_CONNECTED: 9,
					SCAN_DONE: 10,
					WRONG_PARENTAL_PIN: 11,
					SMARTCARD_INFO_UPDATED: 12,
					SMARTCARD_IRD_NEW_POPUP: 13
				},
				SMARTCARD_STATUS = {
					OK: 0,
					CARD_MISSING: -1,
					INVALID: -2,
					BLACKLISTED: -3,
					SUSPENDED: -4,
					NOT_PAIRED: -5,
					NEVER_PAIRED: -6,
					EXPIRED: -7,
					NOT_CERTIFIED: -8,
					COM_ERROR: -9,
					MUTE: -10,
					INCOMPATIBLE: -11
				},
				SCAN = [{
					displayName: "Input",
					defaultValue: 1,
					disable: true,
					hide: false,
					values: [{
						name: "DVB-S/S2",
						value: 0
					}, {
						name: "DVB-C/C2",
						value: 1
					}, {
						name: "DVB-T/T2",
						value: 2
					}, {
						name: "ATSC",
						value: 3
					}, {
						name: "IP tuner-T/T2",
						value: 4
					}]
				}, {
					displayName: "FEC Inner",
					defaultValue: 0,
					disable: false,
					hide: false,
					values: [{
						name: "1/2",
						value: 0
					}, {
						name: "2/3",
						value: 1
					}, {
						name: "3/4",
						value: 2
					}, {
						name: "5/6",
						value: 3
					}, {
						name: "7/8",
						value: 4
					}, {
						name: "8/9",
						value: 5
					}, {
						name: "3/5",
						value: 6
					}, {
						name: "4/5",
						value: 7
					}, {
						name: "9/10",
						value: 8
					}, {
						name: "NONE",
						value: 15
					}]
				}, {
					displayName: "Polarization",
					defaultValue: 0,
					disable: true,
					hide: true,
					values: [{
						name: "Horizontal",
						value: 0
					}, {
						name: "Vertical",
						value: 1
					}, {
						name: "Left circular",
						value: 2
					}, {
						name: "Right circular",
						value: 3
					}]
				}, {
					displayName: "Roll off",
					defaultValue: 0,
					disable: true,
					hide: true,
					values: [{
						name: "0.35",
						value: 0
					}, {
						name: "0.25",
						value: 1
					}, {
						name: "0.20",
						value: 2
					}]
				}, {
					displayName: "Modulation",
					defaultValue: 0,
					disable: false,
					hide: false,
					values: [{
						name: "Auto",
						value: 0
					}, {
						name: "QPSK",
						value: 1
					}, {
						name: "8PSK",
						value: 2
					}, {
						name: "16QAM",
						value: 3
					}, {
						name: "C_16_QAM",
						value: 1
					}, {
						name: "C_32_QAM",
						value: 2
					}, {
						name: "C_64_QAM",
						value: 3
					}, {
						name: "C_128_QAM",
						value: 4
					}, {
						name: "C_256_QAM",
						value: 5
					}]
				}, {
					displayName: "Frequency(khz)",
					defaultValue: "",
					disable: false,
					hide: false
				}, {
					displayName: "Symbol Rate",
					defaultValue: "",
					disable: false,
					hide: false
				}, {
					displayName: "Network Id",
					defaultValue: "",
					disable: false,
					hide: false
				}],
				HOME_CRUISE_URL_BASE = "/mediaserver/session",
				HOME_CRUISE_SECURE_URL_BASE = "/mediaserver",
				HOME_CRUISE_TIMEOUT = 20000,
				HOME_CRUISE_PING_INTERVAL = 3000,
				eventSid = null,
				epgList = null,
				listeners = {},
				registeredDevices = null,
				serviceList = null,
				sessionId = null,
				deviceName = "iPad",
				deviceVersion = "1.0",
				deviceId = "testing",
				audioLanguage = "en",
				parentalPin = "1234",
				state = STATE.UNKNOWN,
				self = this,
				videoUrl = "",
				_serviceListChangeCallback = null,
				_eitDataRetrievedCallback = null,
				_tuneCallback = null,
				_tuneFailedCallback = null,
				_detuneCallback = null,
				_detuneFailedCallback = null,
				_pinRetrievedCallback = null,
				_pinChangedCallback = null,
				_ratingRetrievedCallback = null,
				_ratingChangedCallback = null,
				_serviceLockedCallback = null,
				_serviceUnlockedCallback = null,
				_getContentKeyCallback = null,
				_scanCallback = null,
				_scanFailedCallback = null,
				_getScanStatusCallback = null,
				_getScanStatusFailedCallback = null,
				homeCruiseAddress = null,
				homeCruiseSecureAddress = null,
				_deregistering = false,
				_deregisterCallback = null,
				_deregisterFailedCallback = null,
				pingInt = null,
				_getStatusCallback = null,
				_getStatusFailedCallback = null;

			/**
			 * Initialises the class
			 * @method init
			 * @param {String} The ip address of the HomeCruise box
			 */
			function init(uri) {
				if (uri !== undefined) {
					homeCruiseAddress = uri;
					homeCruiseSecureAddress = homeCruiseAddress.replace("http", "https").replace(":80", ":443");
					// Check if there is a port in the sting now, if not then append it
					if (homeCruiseSecureAddress.lastIndexOf(":") < 6) {
						homeCruiseSecureAddress = homeCruiseSecureAddress + ":443";
					}
				}
			}

			/**
			 * Initialises the class
			 * @method initialise
			 * @deprecated use init()
			 * @param {String} The ip address of the HomeCruise box
			 */
			function initialise(uri) {
				init(uri);
			}

			/**
			 * Method to send HTTP requests to the HomeCruise API, and send responses to the
			 * appropriate callback function.
			 * @method sendCommand
			 * @private
			 * @param {String} command The name of a HomeCruise command to be invoked
			 * @param {Object} params Key-value pairs to be sent in the request query string
			 * @param {Function} callback The function to be called to handle the response
			 * @param {Function} commErrorCallback The function to be called to handle the communication error
			 * @param {Boolean} useSessionId appends the session id to the url command if set to true
			 * @param {Array} cbParams An optional array of parameters to be passed to the callback function
			 * @param {Boolean} {optional} isSecure - Flag indicating this is a secure request that should go via https
			 */
			function sendCommand(command, params, callback, commErrorCallback, useSessionId, cbParams, isSecure) {
				log("Sending command: " + command, params);

				var url;

				if ((isSecure !== null) && (isSecure === true)) {
					url = homeCruiseSecureAddress;
				} else {
					url = homeCruiseAddress + HOME_CRUISE_URL_BASE;
					if (typeof useSessionId === 'undefined' || useSessionId) {
						url += (!_deregistering && sessionId !== null) ? "/" + sessionId : "";
					}
				}

				url += "/" + command;

				url += (!jQuery.isEmptyObject(params)) ? ("?" + jQuery.param(params)) : "";

				jQuery.post(url).done(function (e) {
					callback(e);
				}).error(function (e) {
					log("sendCommand", "ERROR. Calling URL " + url);
					if (commErrorCallback) {
						commErrorCallback();
					} else {
						triggerListeners('CommunicationError', "ERROR");
					}
				});

				log("sendCommand", "Calling URL " + url);
			}

			/**
			 * @method onPingResponse
			 * @private
			 */
			var onPingResponse = function (response) {
				var status = parseInt(response.status, 10);
				if (status === STATUS.SUCCESS) {
					log("ping", "Gateway ping ok");
				} else {
					if (status === STATUS.UNKNOWN_REGISTRATION_ID) {
						clearInterval(pingInt);
						state = STATE.UNKNOWN;
						sessionId = null;
					}
					triggerListeners("PingError", status);

					log("onPingResponse", "PingError: " + status);
				}

				var alerts = response.alert;
				if (typeof alerts === 'undefined') {
					//Do nothing
				} else if (alerts.length && alerts.length > 0) {
					triggerListeners("PingMessage", alerts);
					log("onPingResponse", "PingMessage: " + JSON.stringify(alerts));
				}
			};

			/**
			 * Ping the HomeCruise. This method should be called regularly because lets us know
			 * that the HomeCruise is still reachable, and that we are still registered as a client
			 * (when HomeCruise reboots it loses its client list).
			 * Registration will be triggered if the client is not yet in a registered state.
			 * If HomeCruise does not respond to the ping, this instance will be taken out of service.
			 * @method ping
			 */
			function ping() {
				if (state >= STATE.REGISTERED) {
					sendCommand(COMMANDS.PING, {}, onPingResponse, function () {
						/*if(!_deregistering) {
							triggerListeners('CommunicationError', "ERROR");
						}*/
					});
				} else {
					log("ping", "Client not yet registered, registering");

					init();
				}
			}

			/**
			 * Deregisters the currently registered gateway
			 * @method deregister
			 * @param {Function} deregisterCallBack The callback to invoke once deregistering is complete.
			 * @param {Function} deregisterFailedCallback The callback to invoke if deregistering failed.
			 */
			function deregister(deregisterCallback, deregisterFailedCallback) {
				_deregisterCallback = deregisterCallback;
				_deregisterFailedCallback = deregisterFailedCallback;
				sendCommand(COMMANDS.REMOVE, {}, onDeregistrationResponse, function () {
					triggerListeners('CommunicationError', "ERROR");
				});
				_deregistering = true;
			}

			/**
			 * Callback to handle registration reponses from HomeCruise. These responses contain
			 * our clientId that must be used in subsequent calls to HomeCruise. After receiving
			 * a successful registration response and setting up a ping, the method will check
			 * whether a service list is cached locally, and if not, downloads it.
			 *
			 * @method _onRegistrationReponse
			 * @private
			 * @param {Object} response The response object from HomeCruise
			 */
			var onRegistrationReponse = function (response) {
				var responseStatus = parseInt(response.status, 10);

				if (response !== null && (response.hasOwnProperty("session_id") === true) && (responseStatus === STATUS.SUCCESS)) {
					log("onRegistrationResponse", "Registration callback success! - session_id=" + response.session_id);
					state = STATE.REGISTERED;
					sessionId = response.session_id;
					videoUrl = response.m3u8_index_url;

					triggerListeners('RegistrationSuccess', response);
					getChannelList();
					pingInt = setInterval(function () {
						ping();
					}, HOME_CRUISE_PING_INTERVAL);

				} else if (responseStatus === STATUS.MAX_TUNER_COUNT_EXCEEDED) {
					log("onRegistrationReponse", "Couldn't register with HomeCruise at " + homeCruiseAddress, "Number of tuners exceeded");
					triggerListeners('RegistrationError', responseStatus);
				} else {
					log("onRegistrationReponse", "Couldn't register with HomeCruise at " + homeCruiseAddress);
					triggerListeners('RegistrationError', responseStatus);
				}
			};

			/**
			 * Register as a client of the gateway. Registration is necessary before
			 * any tuning requests can be issued. The method requests HomeCruise's client
			 * list to check whether it is already registered.
			 * @method register
			 * @param {String} deviceIdIn The deviceId uniquely describing the device
			 * @param {String} deviceNameIn The user friendly name for the device
			 * @param {String} deviceVersionIn The API version number
			 * @param {String} audioLanguageIn Default Audio language
			 */
			function register(deviceIdIn, deviceNameIn, deviceVersionIn, audioLanguageIn) {

				if (deviceIdIn !== undefined && deviceNameIn !== undefined && deviceVersionIn !== undefined && audioLanguageIn !== undefined) {

					deviceId = deviceIdIn;
					deviceName = deviceNameIn;
					deviceVersion = deviceVersionIn;
					if (audioLanguageIn !== null) {
						audioLanguage = audioLanguageIn;
					}
				}

				sendCommand(COMMANDS.REGISTER, {
					nmp_device_id: deviceId,
					nmp_device_name: deviceName,
					nmp_device_version: deviceVersion,
					audio_language: audioLanguage
				}, onRegistrationReponse);
			}

			/**
			 * Callback to remove a registered session from HomeCruise.
			 * @method onDeregistrationResponse
			 * @private
			 * @param {Object} response The response object from HomeCruise
			 */
			var onDeregistrationResponse = function (response) {
				var responseStatus = parseInt(response.status, 10);
				if (responseStatus === STATUS.SUCCESS) {
					sessionId = null;
					window.clearInterval(pingInt);
					_deregistering = false;
					state = STATE.UNKNOWN;
					log("onDeregistrationResponse", "Device removed from Gateway");
					if (_deregisterCallback) {
						_deregisterCallback();
					}
				} else {
					if (_deregisterFailedCallback) {
						_deregisterFailedCallback(responseStatus);
					}
				}
			};

			/**
			 * Invokes the listeners for a particular event
			 * @method invokeListeners
			 * @private
			 * @param {String} eventName The name of the event to trigger
			 * @param {Object} data The data to pass to the event
			 */
			function triggerListeners(eventName, data) {
				var i, eventListeners;
				if (!listeners[eventName]) {
					return;
				}
				eventListeners = listeners[eventName];

				log("triggerListeners", "About to execute some listeners");

				for (i = 0; i < eventListeners.length; i++) {
					eventListeners[i](data);
				}
			}

			/**
			 * Refresh the cached HomeCruise EPG list.
			 * Registration will be triggered if the client is not yet in a registered state.
			 * @method onGetFullEPGListResponse
			 */
			function onGetFullEPGListResponse(response) {
				var startTime, endTime;

				startTime = new Date().getTime();
				endTime = startTime + (1000 * 60 * 60 * 24 * 7);

				if (response !== null) {
					epgList[epgList.length] = true;
				}

				if (epgList.length !== serviceList.length) {
					fetchEitData(serviceList[epgList.length].sid, startTime, endTime, onGetFullEPGListResponse);
				} else {
					log("onServiceListResponse", Date() + ": 7 Days of EPG Loaded");
				}

			}

			/**
			 * Callback to handle service responses from HomeCruise. Populates the local
			 * cached service list and triggers the serviceListChangeCallback
			 * @method onServiceListResponse
			 * @private
			 * @param {Object} response The response object from HomeCruise
			 */
			var onServiceListResponse = function (response) {
				var responseStatus = parseInt(response.status, 10);

				if (responseStatus === STATUS.SUCCESS) {
					serviceList = response.services;

					if (listeners.ChannelListUpdated !== null) {
						log("onServiceListResponse", "Service List changed - triggering listeners");
						triggerListeners('ChannelListUpdated', $N.services.gateway.EPGServiceFactory.mapArray(serviceList));
					}
					log("onServiceListResponse", "Successfully retrieved service list");
				} else {
					log("onServiceListResponse", "service list response error: " + responseStatus);
					triggerListeners('ChannelListError', responseStatus);
				}
			};

			/**
			 * Refresh the cached HomeCruise service list.
			 * Registration will be triggered if the client is not yet in a registered state.
			 * @method getChannelList
			 */
			function getChannelList() {
				if (STATE.UNKNOWN !== state) {
					sendCommand(COMMANDS.SERVICES, {}, onServiceListResponse);
				} else {
					log("getChannelList", "Client not yet registered, registering");
					init();
				}
			}

			/**
			 * Refresh the full cached HomeCruise 7 day EPG .
			 * Registration will be triggered if the client is not yet in a registered state.
			 * @method getFullEPG
			 */
			function getFullEPG() {
				if (STATE.UNKNOWN !== state) {
					epgList = [];
					onGetFullEPGListResponse();
				} else {
					log("getFullEPG", "Client not yet registered, registering");
					init();
				}
			}

			/**
			 * Callback to handle scan responses from HomeCruise. Triggers the service
			 * list population if a valid response is received.
			 * @method onScanResponse
			 * @private
			 * @param {Object} response The response object from HomeCruise
			 */
			var onScanResponse = function (response) {
				var responseStatus = parseInt(response.status, 10);

				if (responseStatus === STATUS.SUCCESS) {
					log("onScanResponse", "Scan ok");
					if (_scanCallback) {
						_scanCallback();
					}
				} else {
					log("onScanResponse", "Scan error: " + responseStatus);
					if (_scanFailedCallback) {
						_scanFailedCallback(responseStatus);
					}
				}
			};

			/**
			 * Callback to handle getscanstatus responses from HomeCruise.
			 * @method onGetScanStatusResponse
			 * @private
			 * @param {Object} response The response object from HomeCruise
			 */
			var onGetScanStatusResponse = function (response) {
				var myJsonObj = JSON.parse(response);
				var responseStatus = parseInt(myJsonObj.status, 10);

				if (responseStatus === STATUS.SUCCESS) {
					if (_getScanStatusCallback) {
						if (response.totalServicesFoundCount !== undefined) {
							//{ "status": "0", "totalServicesFoundCount": 300, "tvServicesFoundCount": 298, "radioServicesFoundCount": 2, "error_string": "Scan Successful" }
							_getScanStatusCallback(true); //Has finished
						} else {
							//{ "status": "0" }
							_getScanStatusCallback(false); //Has not finished
						}
					}
				} else {
					if (_getScanStatusFailedCallback) {
						_getScanStatusFailedCallback(responseStatus);
					}
				}
			};

			/**
			 * Callback to handle tune responses from HomeCruise.
			 * @method onTuneResponse
			 * @private
			 * @param {Object} response The response object from HomeCruise
			 */
			var onTuneResponse = function (response) {
				var responseStatus = parseInt(response.status, 10);

				if (responseStatus === STATUS.SUCCESS) {
					log("onTuneResponse", "Successfully tuned to a channel");

					state = STATE.TUNED;
					if (_tuneCallback) {
						_tuneCallback(videoUrl, response.audio);
					}
				} else {
					if (_tuneFailedCallback) {
						_tuneFailedCallback(responseStatus);
					}
				}
			};

			/**
			 * Callback to handle detune responses from HomeCruise.
			 * @method onDetuneResponse
			 * @private
			 * @param {Object} response The response object from HomeCruise
			 */
			var onDetuneResponse = function (response) {
				var responseStatus = parseInt(response.status, 10);

				if (responseStatus === STATUS.SUCCESS) {
					state = STATE.REGISTERED;
					log("onDetuneResponse", "Successfully detuned from a channel");
					if (_detuneCallback) {
						_detuneCallback();
					}
				} else {
					if (_detuneFailedCallback) {
						_detuneFailedCallback(responseStatus);
					}
				}
			};

			/**
			 * Callback to handle eit retrieval reponses from HomeCruise. Populates the local
			 * cached service list and triggers the serviceListChangeCallback
			 * @method onEitDataResponse
			 * @private
			 * @param {Object} response The response object from HomeCruise
			 */
			var onEitDataResponse = function (response) {

				if (listeners.EventListUpdated !== null) {
					log("onEitDataResponse", "Service List changed - triggering listeners");
					response.sid = eventSid;
					triggerListeners('EventListUpdated', response);
				}

				if ((_eitDataRetrievedCallback !== null) && (_eitDataRetrievedCallback !== undefined)) {
					log("onEitDataResponse", "Channel Eit Data retrieved");
					_eitDataRetrievedCallback($N.services.gateway.EPGEventFactory.mapArray(response.events));
				}
			};

			/**
			 * Lookup a channel in the cached Kojak service list.
			 * @method lookupChannel
			 * @private
			 * @param {String} sid The service id of the channel to lookup
			 * @return {Number} The Channel Object
			 */
			function lookupChannel(sid) {
				var service = null,
					i;

				for (i = 0; i < serviceList.length; i++) {
					if (parseInt(serviceList[i].sid, 10) === parseInt(sid, 10)) {
						service = serviceList[i];
						return service;
					}
				}
				return service;
			}

			/**
			 * Adds an event listener to HomeCruise
			 * @method addEventListener
			 * @param {String} eventName The name of the event to add the listener to
			 * @param {Function} callback The callback function to trigger when the event occurs
			 */
			function addEventListener(eventName, callback) {
				if (!listeners[eventName]) {
					listeners[eventName] = [];
				}
				listeners[eventName].push(callback);
			}

			/**
			 * Removes an event listener from HomeCruise
			 * @method removeEventListener
			 * @param {String} eventName The name of the event to remove the listener from
			 * @param {Function} callback The callback function to remove
			 */
			function removeEventListener(eventName, callback) {
				var found = false,
					currentListeners,
					i;

				if (listeners[eventName]) {
					currentListeners = listeners[eventName];
					for (i = 0; i < currentListeners.length; i++) {
						if (currentListeners[i] === callback) {
							currentListeners.splice(i, 1);
							found = true;
							break;
						}
					}
				}
				return found;
			}

			/**
			 * Check whether the specified channel is available on this HomeCruise device
			 *
			 * @method channelIsAvailable
			 * @param {String} sid The service id of the channel
			 * @return {Boolean} True if the channel is currently available
			 */
			function channelIsAvailable(sid) {
				return (state >= STATE.REGISTERED && lookupChannel(sid) !== null);
			}

			/**
			 * Tunes to the specified channel.
			 * @method tune
			 * @param {String} channelSid The service id of the channel to tune to.
			 * @param {String} language The audio language we want to select, or null if it's the current default.
			 * @param {Function} tuneCallBack The callback to invoke once tuning is complete.
			 * @param {Function} tuneFailedCallback The callback to invoke if tuning failed.
			 * @return {Boolean} Whether tuning request was successfully made or not.
			 */
			function tune(channelSid, language, tuneCallBack, tuneFailedCallback) {
				var channel;
				_tuneCallback = tuneCallBack;
				_tuneFailedCallback = tuneFailedCallback;
				if (language !== null && language !== undefined) {
					audioLanguage = language;
				}

				log("tune", "Tune request - enter");

				if (STATE.TUNED === state) {
					detune();
					return false;
				} else if (STATE.REGISTERED === state) {
					log("tune", "Tune request - registered");
					if (channelIsAvailable(channelSid)) {
						channel = lookupChannel(channelSid);
						log("tune", "Tune request - sending tune command to gateway...");
						sendCommand(COMMANDS.TUNE, {
							service: channel.sid,
							network: channel.oid,
							transport: channel.tid,
							parental_pin: parentalPin,
							audio_language: audioLanguage,
							subtitle: 'tune'
						}, onTuneResponse);
					} else {
						if (_tuneFailedCallback) {
							_tuneFailedCallback(STATUS.SERVICE_UNAVAILABLE);
						}
					}
				} else {
					log("tune", "Client not yet registered");
					return false;
				}

				return true;
			}

			/**
			 * Releases the tuner from the current channel.
			 * @method detune
			 * @param {Function} detuneCallBack The callback to invoke once detuning is complete.
			 * @param {Function} detuneFailedCallback The callback to invoke if detuning failed.
			 * @return {Boolean} True if the detuning request was accepted.
			 */
			function detune(detuneCallBack, detuneFailedCallback) {
				_detuneCallback = detuneCallBack;
				_detuneFailedCallback = detuneFailedCallback;
				if (state === STATE.TUNED) {
					log("detune", "Detuning from current tuner");
					sendCommand(COMMANDS.DETUNE, {}, onDetuneResponse);
					return true;
				}
				return false;
			}

			/**
			 * Allows a client to manually scan for services the Homecruise box to retrieve
			 * the full channel list. Registration will be triggered if the client is not yet in a registered state.
			 * @method scan
			 * @param {Function} scanCallback The callback to invoke once scanning is complete.
			 * @param {Function} scanFailedCallback The callback to invoke if scanning failed.
			 */
			function scan(network, fecInner, polarization, rolloff, modulation, frequency, symbolRate, networkId, scanCallback, scanFailedCallback) {
				_scanFailedCallback = scanFailedCallback;
				_scanCallback = scanCallback;
				sendCommand(COMMANDS.SCAN, {
					network: network,
					FECInner: fecInner,
					Polarization: polarization,
					RollOff: rolloff,
					Modulation: modulation,
					Frequency: frequency,
					SymbolRate: symbolRate,
					uiNetworkId: networkId
				}, onScanResponse, null, false);
			}

			/**
			 * Allows a client to get the scan for services status, since that call can last for minutes.
			 * @method getScanStatus
			 * @param {Function} getScanStatusCallback The callback to invoke once getScanStatus is complete.
			 * @param {Function} getScanStatusFailedCallback The callback to invoke if getScanStatus failed.
			 */
			function getScanStatus(getScanStatusCallback, getScanStatusFailedCallback) {
				_getScanStatusCallback = getScanStatusCallback;
				_getScanStatusFailedCallback = getScanStatusFailedCallback;
				sendCommand(COMMANDS.GETSCANSTATUS, {}, onGetScanStatusResponse, null, false);
			}

			/**
			 * Fetches epg data for a given channel.
			 * @method fetchEitData
			 * @param {String} channelSid					The service id of the channel to tune to.
			 * @param {String} inStartTime					The start time to retrieve EPG data from.
			 * @param {String} inEndTime					The end time to retrieve EPG data from.
			 * @param {Function} inEitDataRetrievedCallback	The callback to invoke once data retrieval is complete.
			 */
			function fetchEitData(channelSid, inStartTime, inEndTime, inEitDataRetrievedCallback) {

				_eitDataRetrievedCallback = inEitDataRetrievedCallback;

				eventSid = channelSid;

				if (STATE.UNKNOWN !== state) {
					if (channelIsAvailable(channelSid)) {
						var channel = lookupChannel(channelSid);
						log("fetchEitData", "Fetching EPG Data for: " + channel.sid + ": " + channel.sn);
						sendCommand(COMMANDS.EVENT_INFO, {
							network: channel.oid, // Network Id
							transport: channel.tid, // Transport Stream Id
							service: channel.sid, // Service Id
							nb_events: 5000, // Number of events to show
							window_start_gmt: inStartTime,
							window_end_gmt: inEndTime
						}, onEitDataResponse);
					}
				} else {
					log("fetchEitData", "Client not yet registered, registering");
					init();
				}
			}

			/**
			 * Callback to handle pin change responses from HomeCruise.
			 * @method onChangePinResponse
			 * @private
			 * @param {Object} response The response object from HomeCruise
			 */
			var onChangePinResponse = function (response) {
				var responseStatus;

				if ((response !== null) && (response.hasOwnProperty("status"))) {
					responseStatus = parseInt(response.status, 10);

					if (responseStatus === STATUS.SUCCESS) {
						log("onRetrievePinResponse", "Successfully retrieved Parental Control Pin");
						if (_pinChangedCallback !== null) {
							_pinChangedCallback(response);
						}
					}
				} else {
					log("onRetrievePinResponse", "Error retrieving Parental Control Pin");
				}
			};

			/**
			 * Callback to handle pin retrieval request responses from HomeCruise.
			 * @method onRetrievePinResponse
			 * @private
			 * @param {Object} response The response object from HomeCruise
			 */
			var onRetrievePinResponse = function (response) {
				var responseStatus;

				if ((response !== null) && (response.hasOwnProperty("status"))) {
					responseStatus = parseInt(response.status, 10);

					if (responseStatus === STATUS.SUCCESS) {
						log("onRetrievePinResponse", "Successfully retrieved Parental Control Pin");
						if (_pinRetrievedCallback !== null) {
							_pinRetrievedCallback(response);
						}
					}
				} else {
					log("onRetrievePinResponse", "Error retrieving Parental Control Pin");
				}
			};

			/**
			 * @method obfuscate
			 * @private
			 * @param {String} inItem The item to obfuscate
			 * @return {string} The obfuscated value
			 */
			function obfuscate(inItem) {
				// Obfuscation is defined in the SysAd as follows
				// RetItem = inItem XOR Mask
				// Mask = [nmp_device_id] XOR [Unicode value of Char(0) of SESSION_ID]
				// All items must be same length as inItem so nmp_device_id and SESSION_ID will either be expanded or trimmed
				var Mask = "",
					maskDev_id = String(deviceId),
					maskSess_id = String(sessionId).charCodeAt(0).toString(16).toUpperCase(),
					i,
					retCode = "";

				// Build The Session Id String
				while (maskSess_id.length < 4) {
					maskSess_id = "0" + maskSess_id;
				}

				while (maskSess_id.length < inItem.length) {
					maskSess_id += maskSess_id;
				}

				if (maskSess_id.length > inItem.length) {
					maskSess_id = maskSess_id.substring(0, inItem.length);
				}

				//Build the Device Id Strinf
				while (maskDev_id.length < inItem.length) {
					maskDev_id += maskDev_id;
				}

				if (maskDev_id.length > inItem.length) {
					maskDev_id = maskDev_id.substring(0, inItem.length);
				}

				// Make the Mask
				for (i = 0; i < maskSess_id.length; i++) {
					Mask = Mask + String.fromCharCode(maskDev_id.charCodeAt(i) ^ maskSess_id.charCodeAt(i));
				}

				// Make the obfuscated string
				for (i = 0; i < inItem.length; i++) {
					retCode = retCode + String.fromCharCode(Mask.charCodeAt(i) ^ inItem.charCodeAt(i));
				}

				return retCode;
			}

			/**
			 * @method changePin
			 * @private
			 * @param {String} inOldPin The old parental control pin
			 * @param {String} inNewPin The new parental control pin
			 * @param {Function} pinChangeCallBack The callback to invoke once the pin change call is complete.
			 */
			function changePin(inOldPin, inNewPin, pinChangeCallBack) {
				_pinChangedCallback = pinChangeCallBack;
				sendCommand(COMMANDS.PIN_CHANGE, {
					old_parental_pin: obfuscate(inOldPin),
					new_parental_pin: obfuscate(inNewPin)
				}, onChangePinResponse);
			}

			/**
			 * @method requestPin
			 * @param {Function} pinRetrievedCallback The callback to invoke once tuning is complete.
			 * @private
			 */
			function requestPin(pinRetrievedCallback) {
				_pinRetrievedCallback = pinRetrievedCallback;
				sendCommand(COMMANDS.PIN_FETCH, {}, onRetrievePinResponse);
			}

			/**
			 * Callback to handle pin rating change responses from HomeCruise.
			 * @method onChangeParentalRatingResponse
			 * @private
			 * @param {Object} response The response object from HomeCruise
			 */
			var onChangeParentalRatingResponse = function (response) {
				var responseStatus;

				if ((response !== null) && (response.hasOwnProperty("status"))) {
					responseStatus = parseInt(response.status, 10);

					if (responseStatus === STATUS.SUCCESS) {
						log("onChangeParentalRatingResponse", "Successfully changed Parental Rating Level");
						if (_ratingChangedCallback !== null) {
							_ratingChangedCallback(response);
						}
					}
				} else {
					log("onChangeParentalRatingResponse", "Error retrieving Parental Control Pin");
				}
			};

			/**
			 * Callback to handle parental control level retrieval request responses from HomeCruise.
			 * @method onRetrieveParentalRatingResponse
			 * @private
			 * @param {Object} response The response object from HomeCruise
			 */
			var onRetrieveParentalRatingResponse = function (response) {
				var responseStatus;

				if ((response !== null) && (response.hasOwnProperty("status"))) {
					responseStatus = parseInt(response.status, 10);

					if (responseStatus === STATUS.SUCCESS) {
						log("onRetrieveParentalRatingResponse", "Successfully retrieved Parental Control Level");
						if (_ratingRetrievedCallback !== null) {
							_ratingRetrievedCallback(response);
						}
					}
				} else {
					log("onRetrieveParentalRatingResponse", "Error retrieving Parental Control Level");
				}
			};

			/**
			 * Function to send off the call to change the current level of parental control
			 * @method changeParentalRating
			 * @private
			 * @param {String} inControlLevel The new parental control pin
			 * @param {Function} inRatingChangedCallback The callback to use on successful retrieval
			 */
			function changeParentalRating(inControlLevel, inRatingChangedCallback) {
				_ratingChangedCallback = inRatingChangedCallback;
				sendCommand(COMMANDS.RATING_CHANGE, {
					parental_rating: inControlLevel
				}, onChangeParentalRatingResponse);
			}

			/**
			 * Function to send off the call to retrieve the current level of parental control
			 * @method retrieveParentalRating
			 * @param {Function} inRatingRetrievedCallback The callback to use on successful retrieval
			 * @private
			 */
			function requestParentalRating(inRatingRetrievedCallback) {
				_ratingRetrievedCallback = inRatingRetrievedCallback;
				sendCommand(COMMANDS.RATING_FETCH, {}, onRetrieveParentalRatingResponse);
			}

			/**
			 * Callback to handle service locking request responses from HomeCruise.
			 * @method onServiceLockedResponse
			 * @private
			 * @param {Object} response The response object from HomeCruise
			 */
			var onServiceLockedResponse = function (response) {
				var responseStatus;

				if ((response !== null) && (response.hasOwnProperty("status"))) {
					responseStatus = parseInt(response.status, 10);

					if (responseStatus === STATUS.SUCCESS) {
						log("onServiceLockedResponse", "Successfully locked the given service");
						if (_serviceLockedCallback !== null) {
							_serviceLockedCallback(response);
						}
					}
				} else {
					log("onServiceLockedResponse", "Error locking a service");
				}
			};

			/**
			 * Callback to handle service unlocking request responses from HomeCruise.
			 * @method onServiceUnlockedResponse
			 * @private
			 * @param {Object} response The response object from HomeCruise
			 */
			var onServiceUnlockedResponse = function (response) {
				var responseStatus;

				if ((response !== null) && (response.hasOwnProperty("status"))) {
					responseStatus = parseInt(response.status, 10);

					if (responseStatus === STATUS.SUCCESS) {
						log("onServiceUnlockedResponse", "Successfully unlocked the given service");
						if (_serviceUnlockedCallback !== null) {
							_serviceUnlockedCallback(response);
						}
					}
				} else {
					log("onServiceUnlockedResponse", "Error unlocking a service");
				}
			};

			/**
			 * Function to send off the call to lock the given service
			 * @method lockService
			 * @private
			 * @param {Object} inService The service to lock
			 * @param {Function} inServiceLockedCallback The callback to use on successful locking
			 */
			function lockService(inService, inServiceLockedCallback) {
				_serviceLockedCallback = inServiceLockedCallback;
				sendCommand(COMMANDS.LOCK, {
					network: inService.oid,
					transport: inService.tid,
					service: inService.sid
				}, onServiceLockedResponse);
			}

			/**
			 * Function to send off the call to unlock the given service
			 * @method unlockService
			 * @private
			 * @param {Object} inService The service to unlock
			 * @param {Function} inServiceUnlockedCallback The callback to use on successful locking
			 */
			function unlockService(inService, inServiceUnlockedCallback) {
				_serviceUnlockedCallback = inServiceUnlockedCallback;
				sendCommand(COMMANDS.UNLOCK, {
					network: inService.oid,
					transport: inService.tid,
					service: inService.sid
				}, onServiceUnlockedResponse);
			}

			/**
			 * Callback to handle parental control level retrieval request responses from HomeCruise.
			 * @method onRetrieveContentKeyResponse
			 * @private
			 * @param {Object} response The response object from HomeCruise
			 */
			var onRetrieveContentKeyResponse = function (response) {
				var responseStatus;

				if ((response !== null) && (response.hasOwnProperty("status"))) {
					responseStatus = parseInt(response.status, 10);

					if (responseStatus === STATUS.SUCCESS) {
						log("onRetrieveContentKeyResponse", "Successfully retrieved Content Key");
						if (_getContentKeyCallback !== null) {
							_getContentKeyCallback(response);
						}
					}
				} else {
					log("onRetrieveContentKeyResponse", "Error retrieving Content Key");
				}
			};

			/**
			 * Function to send off the call to retrieve the decryption key for the content
			 * @method getContentKey
			 * @param {Function} inContentKeyRetrievedCallback The callback to use on successful retrieval
			 * @private
			 */
			function getContentKey(inContentKeyRetrievedCallback) {
				_getContentKeyCallback = inContentKeyRetrievedCallback;
				//command, params, callback, commErrorCallback, useSessionId, cbParams, isSecure
				sendCommand(COMMANDS.GETCONTENTKEY, {}, onRetrieveContentKeyResponse, null, true, {}, true);
			}

			/**
			 * Callback to handle box status information request from HomeCruise.
			 * @method onGetStatusResponse
			 * @private
			 * @param {String} response The response string from HomeCruise
			 */
			var onGetStatusResponse = function (response) {
				//REV 2.0|VER 0.0|Dec 19 2012|12:04:18|Notconnected|0:14:45:0:13:81|192.168.1.40|Notconnected|Notconnected|Connected|Locked|Locked|99|100|Locked|Locked|99|100|UNKNOWN|UNKNOWN|UNKNOWN|UNKNOWN|0|0|243000000|0.000000|256|243000000|0.000000|256|255255255255255255255255255255255255255255255255
				var responseArray = response.split("|");

				if (_getStatusFailedCallback) {
					if (!responseArray.length) {
						_getStatusFailedCallback();
					}
					if (responseArray.length < 31) {
						_getStatusFailedCallback();
					}
				}

				var status = {};
				status.hwVersion = responseArray[0];
				status.swVersion = responseArray[1];
				status.buildDate = responseArray[2];
				status.buildTime = responseArray[3];
				status.hdmi = responseArray[4];
				status.mac = responseArray[5];
				status.ip = responseArray[6];
				status.smart = responseArray[8];
				status.eth = responseArray[9];

				status.t0QamLock = responseArray[10];
				status.t0FecLock = responseArray[11];
				status.t0Level = responseArray[12];
				status.t0Quality = responseArray[13];

				status.t1QamLock = responseArray[14];
				status.t1FecLock = responseArray[15];
				status.t1Quality = responseArray[16];
				status.t1Quality = responseArray[17];

				status.cardVersion = responseArray[18];
				status.cardSerial = responseArray[19];
				status.cardFlags = responseArray[20];
				status.cardState = responseArray[21];
				status.cardProviderId = responseArray[22];
				status.cardSessionId = responseArray[23];

				status.t0Frequency = responseArray[24];
				status.t0BitErrorRate = responseArray[25];
				status.t0Modulation = responseArray[26];
				status.t1Frequency = responseArray[27];
				status.t1BitErrorRate = responseArray[28];
				status.t1Modulation = responseArray[29];
				status.deviceId = responseArray[30];

				if (_getStatusCallback) {
					_getStatusCallback(status);
				}
			};

			/**
			 * Function to get the box status information
			 * @method getStatus
			 * @param {Function} getStatusCallback - The callback to use on successful retrieval
			 * @param {Function} getStatusFailedCallback - The callback to use on a failed retrieval
			 */
			function getStatus(getStatusCallback, getStatusFailedCallback) {
				_getStatusCallback = getStatusCallback;
				_getStatusFailedCallback = getStatusFailedCallback;
				sendCommand(COMMANDS.STATUS, {}, onGetStatusResponse, null, false);
			}

			/**
			 * Fires upon successful registration with the gateway device
			 * @event RegistrationSuccess
			 * @param {Object} registration response object
			 */

			/**
			 * Fires upon unsuccessful registration with the gateway device
			 * @event RegistrationError
			 * @param {Number} Status code identifying the error
			 */

			/**
			 * Fires upon new channels being available in the gateway device
			 * @event ChannelListUpdated
			 * @param {Object} Array of channel objects
			 */

			/**
			 * Fires upon new event data being available from the gateway device
			 * @event EventListUpdated
			 * @param {Object} Array of events
			 */

			/**
			 * Fires upon an error obtaining channels from the gateway device
			 * @event ChannelListError
			 * @param {Object} Status code identifying the error
			 */

			/**
			 * Fires upon a general communication failure
			 * @event CommunicationError
			 * @param {Object} To be defined
			 */

			/**
			 * Fires upon a ping failure
			 * @event PingError
			 * @param {Object} Status code identifying the error
			 */

			/**
			 * Fires upon a ping alert
			 * @event PingMessage
			 * @param {Array} the alert messages
			 */

			return {
				/**
				 * A collection of error codes, one of
				 * SUCCESS,
				 * REQUEST_UNKNOWN,
				 * ILLEGAL_ARGS,
				 * UNKNOWN_REGISTRATION_ID,
				 * BOOT_IN_PROGRESS,
				 * UNKNOWN_SERVICE,
				 * SERVICE_LIST_UNAVAILABLE,
				 * SERVICE_UNAVAILABLE,
				 * MAX_TUNER_COUNT_EXCEEDED,
				 * BROADCAST_TIME_UNAVAILABLE,
				 * BUSY_SCANNING_CHANNELS,
				 * EMPTY_DB,
				 * USER_NOT_AUTHORIZED
				 * @property {Number} STATUS
				 */
				STATUS: STATUS,
				SCAN: SCAN,
				ALERT: ALERT,
				SMARTCARD_STATUS: SMARTCARD_STATUS,
				init: init,
				initialise: initialise,
				register: register,
				deregister: deregister,
				changePin: changePin,
				requestPin: requestPin,
				changeParentalRating: changeParentalRating,
				requestParentalRating: requestParentalRating,
				lockService: lockService,
				unlockService: unlockService,
				getContentKey: getContentKey,
				ping: ping,
				scan: scan,
				getScanStatus: getScanStatus,
				tune: tune,
				detune: detune,
				addEventListener: addEventListener,
				removeEventListener: removeEventListener,
				getChannelList: getChannelList,
				getFullEPG: getFullEPG,
				fetchEitData: fetchEitData,
				getStatus: getStatus
			};
		}());
		return $N.services.gateway.HomeCruise;
	}
);