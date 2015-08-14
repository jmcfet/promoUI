/**
 * A singleton class to provide an API to satisfy companion device use cases such as
 * requesting play out of video on another device, getting details of video playing on
 * another device, controlling play back (such as trick play) on another device.  The
 * current implementation uses the cross device SDP messaging service, which is limited in
 * its functionality but the API defined here should be able to remain intact even if the
 * delivery mechanism is updated at a later stage.
 * @class $N.services.sdp.CompanionDevice
 * @static
 * @singleton
 * @since SDP 3.4
 * @requires $N.apps.core.Log
 * @requires $N.services.sdp.ServiceFactory
 * @author mbrown
 */
/*global define*/
define('jsfw/services/sdp/CompanionDevice',
	[
		'jsfw/apps/core/Log',
		'jsfw/services/sdp/ServiceFactory'
	],
	function (Log, ServiceFactory) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};
		$N.services.sdp.CompanionDevice = (function () {
			'use strict';

			var log = new $N.apps.core.Log('SDP', 'CompanionDevice'),
				protocolVersion = 1,
				eventLookup = {},
				deviceId = null,
				deviceName = null,
				deviceList = [],
				companionMessageService = null,
				requestLookup = {},
				DEFAULT_POLL_INTERVAL = 1000,
				pollInterval = DEFAULT_POLL_INTERVAL,
				pollIntervalHandle = null,
				commands = {
					"SEND_CONTENT": "send_content",
					"FETCH_CONTENT": "fetch_content",
					"SCHEDULE_DVR_EVENT": "schedule_dvr_event",
					"SCHEDULE_REMINDER_EVENT": "schedule_reminder_event",
					"CONTROL_PLAYER": "control_player",
					"REQUEST_PLAYER_STATE": "player_state",
					"CUSTOM_REQUEST": "custom_request"
				},
				commandEventLookup = {
					"send_content": "ContentPlayRequest",
					"fetch_content": "ContentFetchRequest",
					"schedule_dvr_event": "RemoteRecordRequest",
					"schedule_reminder_event": "RemoteRemindRequest",
					"control_player": "ControlPlayerRequest",
					"player_state": "PlayerStateRequest",
					"notify_success": "RequestSuccess",
					"notify_fail": "RequestFail"
				},
				SDP = {
					_deviceCallback: null,
					_getAccountDevicesSuccess: function (result) {
						var filteredDeviceList = filterDevices(result);
						if (this._deviceCallback) {
							this._deviceCallback(filteredDeviceList);
							this._deviceCallback = null;
						}
						deviceList = filteredDeviceList;
					},
					_getAccountDevicesFail: function () {
						if (this._deviceCallback) {
							this._deviceCallback([]);
							this._deviceCallback = null;
						}
						deviceList = [];
					},
					_postMessageSuccess: function () {
						log("_postMessageSuccess", "");
					},
					_postMessageFail: function () {
						log("_postMessageFail", "");
					},
					_getMessageSuccess: function (result) {
						var messageObj = null,
							postResult;
						if (result) {
							log("_getMessageSuccess", "got message, processing..." + result);
							messageObj = decodeMessage(result);
							messageObj.parameters.handle = messageObj.handle;
							requestLookup[messageObj.handle] = messageObj;
							log("_getMessageSuccess", "handle: " + messageObj.handle);
						} else {
							log("_getMessageSuccess", "no result returned from SDP - ignoring" + result);
							return;
						}
						if (commandEventLookup[messageObj.command]) {
							if (eventLookup[commandEventLookup[messageObj.command]] && eventLookup[commandEventLookup[messageObj.command]].length > 0) {
								log("_getMessageSuccess", "firing listener: " + commandEventLookup[messageObj.command]);
								requestLookup[messageObj.handle] = messageObj;
								fireEvent(commandEventLookup[messageObj.command], messageObj.parameters);
							} else if (commandEventLookup[messageObj.command] !== commandEventLookup.nofify_fail && commandEventLookup[messageObj.command] !== commandEventLookup.nofify_success) {
								postResult = $N.services.sdp.CompanionDevice.postFail(messageObj.handle, {
									code: $N.services.sdp.CompanionDevice.Errors.FEATURE_NOT_IMPLEMENTED,
									description: "No listeners on target device"
								});
								log("_getMessageSuccess", "No listener posting fail:" + postResult);
							}
						} else {
							if (messageObj.command === commands.CUSTOM_REQUEST) {
								if (eventLookup[messageObj.parameters.eventName] && eventLookup[messageObj.parameters.eventName].length > 0) {
									log("_getMessageSuccess", "firing listener: " + messageObj.parameters.eventName);
									requestLookup[messageObj.handle] = messageObj;
									fireEvent(messageObj.parameters.eventName, messageObj.parameters);
								} else {
									postResult = $N.services.sdp.CompanionDevice.postFail(messageObj.handle, {
										code: $N.services.sdp.CompanionDevice.Errors.FEATURE_NOT_IMPLEMENTED,
										description: "No listeners on target device"
									});
									log("_getMessageSuccess", "No listener posting fail:" + postResult);
								}
							} else {
								log("_getMessageSuccess", "unknown command request received - ignoring");
							}
						}
					},
					_getMessageFail: function () {
						log("_getMessageFail", "error occurred during SDP message get");
					},
					postMessage: function (deviceId, message) {
						companionMessageService.postMessage(this, this._postMessageSuccess, this._postMessageFail, deviceId, message);
					},
					getMessage: function () {
						companionMessageService.getMessage(this, this._getMessageSuccess, this._getMessageFail);
					},
					getDevices: function (callback) {
						if (callback) {
							this._deviceCallback = callback;
						}
						companionMessageService.getAccountDevices(this, this._getAccountDevicesSuccess, this._getAccountDevicesFail);
					}
				};

			function fireEvent(eventName, params) {
				if (eventLookup[eventName]) {
					eventLookup[eventName].forEach(function (callback) {
						callback(params);
					});
					return true;
				}
				return false;
			}

			function createMessage(command, parameters, handle) {
				return {
					command: command,
					parameters: parameters,
					protocolVersion: protocolVersion,
					handle: handle,
					device: deviceId
				};
			}

			function encodeMessage(messageObj) {
				return JSON.stringify(messageObj);
			}

			function decodeMessage(messageString) {
				return JSON.parse(messageString);
			}

			function createMessageString(command, parameters, handle) {
				return encodeMessage(createMessage(command, parameters, handle));
			}

			function getRequestHandle() {
				return new Date().getTime().toString();
			}

			function filterDevices(deviceList) {
				var filteredList = deviceList.filter(function (device) { return deviceId !== device.id; });
				return filteredList;
			}

			function deleteRequest(handle) {
				if (requestLookup[handle]) {
					delete requestLookup[handle];
				}
			}
			//PUBLIC API
			return {
				/**
				 * Defines constants for types of content that play out can be requested for,
				 * one of: `VOD`, `CU`, `BTV`
				 * @property {String} ContentType
				 * @readonly
				 */
				ContentType: {
					VOD: "vod",
					CU: "cu",
					BTV: "btv"
				},
				/**
				 * Defines constants for player state that can be controlled by another device,
				 * one of: `PLAY`, `PAUSE`, `FF`, `REW`
				 * @property {String} PlayStates
				 * @readonly
				 */
				PlayStates: {
					PLAY: "play",
					PAUSE: "pause",
					STOP: "stop",
					FF: "ff",
					REW: "rew"
				},
				/**
				 * Defines the constants for the field returned in the event for a successful/failed request to
				 * match the success or failure back to a request type. One of:
				 * `SEND_CONTENT`, `FETCH_CONTENT`, `SCHEDULE_DVR_EVENT`, `SCHEDULE_REMINDER_EVENT`, `CONTROL_PLAYER`, `REQUEST_PLAYER_STATE`
				 * @property RequestType
				 * @readonly
				 */
				RequestType: commands,
				/**
				 * Defines constants that should be passed back on postFail, it is down to the application
				 * to pick the most suitable error code for the failure as to why a request could not be
				 * fulfilled. Constants are:
				 * `PLAY_REQUEST_FAILED`, `CONTENT_NOT_FOUND`, `POSITION_OUT_OF_BOUNDS`, `NO_CONTENT_PLAYING`, `UNSUPPORTED_CONTENT`
				 * `FEATURE_NOT_SUPPORTED`, `FEATURE_NOT_IMPLEMENTED`, `EVENT_ALREADY_SCHEDULED`, `EVENT_NOT_FOUND`, `GENERIC_ERROR`
				 * @property {Number} Errors
				 * @readonly
				 */
				Errors: {
					"PLAY_REQUEST_FAILED": 1,
					"CONTENT_NOT_FOUND": 2,
					"POSITION_OUT_OF_BOUNDS": 3,
					"NO_CONTENT_PLAYING": 4,
					"UNSUPPORTED_CONTENT": 5,
					"FEATURE_NOT_SUPPORTED": 6,
					"FEATURE_NOT_IMPLEMENTED": 7,
					"EVENT_ALREADY_SCHEDULED": 8,
					"EVENT_NOT_FOUND": 9,
					"GENERIC_ERROR": 10
				},
				_resetForUnitTests: function () {
					eventLookup = {};
					deviceId = null;
					deviceName = null;
					deviceList = [];
					companionMessageService = null;
					requestLookup = {};
					pollInterval = DEFAULT_POLL_INTERVAL;
					pollIntervalHandle = null;
				},
				/**
				 * Initialises the class.
				 *
				 * Must be called prior to use with the configuration for the device
				 * @method init
				 * @param {Object} config parameters of this object include `deviceId` and `deviceName`
				 * @return {Boolean} true if initialisation was successful
				 */
				init: function (config) {
					if (config) {
						deviceId = config.deviceId;
						deviceName = config.deviceName;
						if (config.pollInterval) {
							this.setPollingInterval(config.pollInterval);
						}
					} else {
						return false;
					}
					companionMessageService = $N.services.sdp.ServiceFactory.get("CompanionMessageService");
					this.startPolling();
					return true;
				},
				/**
				 * Initialises the class.
				 *
				 * Must be called prior to use with the configuration for the device
				 * @method initialise
				 * @deprecated use init()
				 * @param {Object} config parameters of this object include `deviceId` and `deviceName`
				 * @return {Boolean} true if initialisation was successful
				 */
				initialise: function (config) {
					return this.init(config);
				},
				/**
				  * Determines if the polling for requests is active
				  * @method isPolling
				  * @return {Boolean} true if polling is active, false otherwise
				  */
				isPolling: function () {
					return (pollIntervalHandle !== null);
				},
				/**
				 * Starts polling for message requests at the pre-defined interval
				 * @method startPolling
				 */
				startPolling: function () {
					if (this.isPolling()) {
						this.stopPolling();
					}
					pollIntervalHandle = setInterval(
						function () {
							SDP.getMessage();
						},
						pollInterval
					);
				},
				/**
				 * Stops polling for message requests until `startPolling` is called
				 * @method stopPolling
				 */
				stopPolling: function () {
					if (pollIntervalHandle) {
						clearInterval(pollIntervalHandle);
						pollIntervalHandle = null;
					}
				},
				/**
				 * Returns the current polling interval
				 * @method getPollingInterval
				 * @return {Number} interval in milliseconds
				 */
				getPollingInterval: function () {
					return pollInterval;
				},
				/**
				 * Sets the interval at which polling for new messages should occur.
				 * If polling is already active, the interval will be updated automatically; otherwise
				 * it will be used the next time `startPolling` is called.
				 * @method setPollingInterval
				 * @param {Number} intervalMS a time in milliseconds at which to poll
				 * @chainable
				 */
				setPollingInterval: function (intervalMS) {
					pollInterval = intervalMS;
					if (this.isPolling()) {
						this.startPolling();
					}
					return this;
				},
				/**
				 * Returns the list of devices, excluding this device,
				 * that are associated with the same account and have presence.
				 *
				 * Note: this method returns a cached copy of the devices and may be out of date. For an up to
				 * date list use `fetchDeviceList`
				 * @method getDeviceList
				 * @return {Array} list of device objects with id and name
				 */
				getDeviceList: function () {
					return deviceList;
				},
				/**
				 * Asynchronously returns the list of devices that are associated under the same account and have presence,
				 * excluding this device.
				 *
				 * Note: this method returns the data via the given callback as an array of objects with id and name
				 * @method fetchDeviceList
				 * @param {Function} callback a function to execute to return the device list
				 * @async
				 */
				fetchDeviceList: function (callback) {
					SDP.getDevices(callback);
				},
				/**
				 * Messages the given device to request play back of the given content. After the message has
				 * been processed by the targeted device, a `RequestSuccess` or `RequestFail` can be expected
				 * @method sendContent
				 * @param {String} deviceId the unique identifier of the device to send to as returned from `getDeviceList` or `fetchDeviceList`
				 * @param {String} contentType one of `$N.services.sdp.CompanionDevice.ContentType`
				 * @param {String} contentId the unique identifier for the content, e.g. asset uid, service id
				 * @param {Number} position the position in seconds for where play back should begin from
				 * @return {String} unique handle for the request
				 */
				sendContent: function (deviceId, contentType, contentId, position) {
					var parameters = {
							contentType: contentType,
							contentId: contentId,
							position: position
						},
						handle = getRequestHandle();
					SDP.postMessage(deviceId, createMessageString(commands.SEND_CONTENT, parameters, handle));
					return handle;
				},
				/**
				  * Messages the given device to respond with data detailing the current
				  * content that is playing on the given device.  After the message has
				  * been processed by the targeted device a `RequestSuccess` or `RequestFail` can be expected
				  * @method fetchContent
				  * @param {String} deviceId the unique identifier of the device to send to as returned from `getDeviceList` or `fetchDeviceList`
				  * @return {String} unique handle for the request
				  */
				fetchContent: function (deviceId) {
					var handle = getRequestHandle();
					SDP.postMessage(deviceId, createMessageString(commands.FETCH_CONTENT, {}, handle));
					return handle;
				},
				/**
				 * Requests that an event identified by eventId be scheduled for a reminder on the given device
				 * @method scheduleEventReminder
				 * @param {String} deviceId the unique identifier of the device to send to as returned from `getDeviceList` or `fetchDeviceList`
				 * @param {String} eventId the unique identifier of the event that should be scheduled to remind
				 * @return {String} unique handle for the request
				 */
				scheduleEventReminder: function (deviceId, eventId) {
					var handle = getRequestHandle();
					SDP.postMessage(deviceId, createMessageString(commands.SCHEDULE_REMINDER_EVENT, {eventId: eventId}, handle));
					return handle;
				},
				/**
				 * Requests that an event identified by eventId be scheduled to record on the given device
				 * @method scheduleEventRecord
				 * @param {String} deviceId the unique identifier of the device to send to as returned from `getDeviceList` or `fetchDeviceList`
				 * @param {String} eventId the unique identifier of the event that should be scheduled to record
				 * @return {String} unique handle for the request
				 */
				scheduleEventRecord: function (deviceId, eventId) {
					var handle = getRequestHandle();
					SDP.postMessage(deviceId, createMessageString(commands.SCHEDULE_DVR_EVENT, {eventId: eventId}, handle));
					return handle;
				},
				/**
				 * Requests a change in play back states for the given device e.g. pause video play back
				 * @method controlPlayer
				 * @param {String} deviceId the unique identifier of the device to send to as returned from `getDeviceList` or `fetchDeviceList`
				 * @param {String} state one of `$N.services.sdp.CompanionDevice.PlayStates`
				 * @return {String} unique handle for the request
				 */
				controlPlayer: function (deviceId, state) {
					var handle = getRequestHandle();
					SDP.postMessage(deviceId, createMessageString(commands.CONTROL_PLAYER, {state: state}, handle));
					return handle;
				},
				/**
				 * Requests details of trick play mode, duration and current position from the given device
				 * @method requestPlayerState
				 * @param {String} deviceId the unique identifier of the device to send to as returned from `getDeviceList` or `fetchDeviceList`
				 * @return {String} unique handle for the request
				 */
				requestPlayerState: function (deviceId) {
					var handle = getRequestHandle();
					SDP.postMessage(deviceId, createMessageString(commands.REQUEST_PLAYER_STATE, {}, handle));
					return handle;
				},
				/**
				 * Send a custom request that allows non pre-defined messages and requests to be made. This method is available
				 * to extend the use case coverage without having to update the API.
				 * @method sendCustomRequest
				 * @param {String} deviceId the unique identifier of the device to send to as returned from `getDeviceList` or `fetchDeviceList`
				 * @param {Object} params an object with parameters defined for data to be passed in the request
				 * @param {String} eventName the name of the event that should fire when the request is picked up by the device
				 * @return {String} unique handle for the request
				 */
				sendCustomRequest: function (deviceId, params, eventName) {
					var handle = getRequestHandle();
					params.eventName = eventName;
					SDP.postMessage(deviceId, createMessageString(commands.CUSTOM_REQUEST, params, handle));
					return handle;
				},
				/**
				 * Posts a message to confirm that the request identified by the handle was
				 * successfully dealt with
				 * @method postSuccess
				 * @param {String} handle unique identifier for the original request
				 * @param {Object} data a set of data that is specific to the type of request made
				 * @return {Boolean} Returns true if the request was found by its handle and `postSuccess` request was made
				 */
				postSuccess: function (handle, data) {
					var request = requestLookup[handle],
						parameters = {};
					if (request) {
						parameters.command = request.command;
						parameters.data = data;
						parameters.device = deviceId;
						SDP.postMessage(request.device, createMessageString("notify_success", parameters, handle));
						deleteRequest(handle);
						return true;
					}
					return false;
				},
				/**
				 * Posts a message to confirm that failure occurred when responding to a request event.
				 * @method postFail
				 * @param {String} handle unique identifier for the original request
				 * @param {Object} error details the code, one of `$N.services.sdp.CompanionDevice.Errors` and the description if available
				 * @return {Boolean} Returns true if the request was found by its handle and `postSuccess` request was made
				 */
				postFail: function (handle, error) {
					var request = requestLookup[handle],
						parameters = {};
					if (request) {
						parameters.command = request.command;
						parameters.error = error;
						parameters.device = deviceId;
						SDP.postMessage(request.device, createMessageString("notify_fail", parameters, handle));
						deleteRequest(handle);
						return true;
					}
					return false;
				},
				/**
				 * Adds a callback to execute against the given event name
				 * @method addEventListener
				 * @param {String} eventName the name of the event that you wish to listen for
				 * @param {Function} callback the function that should execute when the event fires
				 */
				addEventListener: function (eventName, callback) {
					if (!eventLookup[eventName]) {
						eventLookup[eventName] = [];
					}
					eventLookup[eventName].push(callback);
				},
				/**
				 * Removes the given callback function such that it will no longer be called when the event
				 * fires
				 * @method removeEventListener
				 * @param {String} eventName the name of the event that you wish to remove a listener for
				 * @param {Function} callback the function that should execute when the event fires
				 */
				removeEventListener: function (eventName, callback) {
					if (eventLookup[eventName]) {
						eventLookup[eventName] = eventLookup[eventName].filter(function (value) { return value !== callback; });
					}
				}
				/**
				 * Fired when a message has been received by the device to play a piece of video content
				 * @event ContentPlayRequest
				 * @param {String} handle a unique code identifying the request
				 * @param {String} contentType one of `$N.services.sdp.CompanionDevice.ContentType`
				 * @param {String} contentId the unique identifier for the content, e.g. asset uid, service id
				 * @param {Number} position the position in seconds for where play back should begin from
				 */

				/**
				 * Fired when a message has been received by the device to respond with data relating
				 * to the video content currently playing
				 * @event ContentFetchRequest
				 * @param {String} handle a unique code identifying the request
				 */

				/**
				 * Fired when a message has been received by the device to request a DVR recording
				 * for a given event
				 * @event RemoteRecordRequest
				 * @param {String} handle a unique code identifying the request
				 * @param {String} eventId a unique identifier to the event that should be set to record
				 */

				/**
				 * Fired when a message has been received by the device to request a reminder be set
				 * for a given event
				 * @event RemoteRemindRequest
				 * @param {String} handle a unique code identifying the request
				 * @param {String} eventId a unique identifier to the event that a reminder should be set on
				 */

				/**
				 * Fired when a message has been received by the device to request a change in player play back state,
				 * e.g play, pause, ff, rew
				 * @event ControlPlayerRequest
				 * @param {String} handle a unique code identifying the request
				 * @param {String} State one of `$N.services.sdp.CompanionDevice.PlayStates`
				 */

				/**
				 * Fired when a message has been received by the device to report back the current
				 * player state including, trick play mode, duration and currentPosition
				 * @event PlayerStateRequest
				 * @param {String} handle a unique code identifying the request
				 * @param {String} State one of `$N.services.sdp.CompanionDevice.PlayStates`
				 * @param {String} duration the duration of the content playing
				 * @param {String} position the position in seconds of the content playing
				 */

				/**
				 * Fired in response to a successful request
				 * @event RequestSuccess
				 * @param {String} handle a unique code identifying the request
				 * @param {Object} data an object containing return data from the request
				 */

				/**
				 * Fired in response to an unsuccessful request
				 * @event RequestFail
				 * @param {String} handle a unique code identifying the request
				 * @param {Object} error an object containing error data from the request, parameters include code, description
				 */
			};
		}());
		return $N.services.sdp.CompanionDevice;
	}
);