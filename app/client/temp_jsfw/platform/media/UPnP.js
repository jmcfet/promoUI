// This class has been added to include a JSFW fix which is being tracked by
// ticket http://jira.opentv.com/browse/NETUI-2913.

/**
 * A utility class that will discover and browse any content that is publicly visible on UPnP
 * devices that are connected to the local network.
 *
 * @class $N.platform.media.UPnP
 * @singleton
 * @author mtowell
 */

/*global CCOM*/

define('jsfw/platform/media/UPnP',
	[],
	function () {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.media = $N.platform.media || {};

		$N.platform.media.UPnP = (function () {
			var getContentsCallback = function () {},
				currentDevice = null,
				devices = [],
				fileTypes = {
					AUDIO: 1,
					IMAGE: 2,
					VIDEO: 3,
					FOLDER: 4,
					FILE: 5,
					UNKNOWN: 6
				},
				MAX_CONTENT_ITEMS = 25,
				eventNameMap = {
					'DeviceFound': 'onDeviceFound',
					'DeviceLost': 'onDeviceLost',
					'DeviceListUpdated': 'getDevicesOK'
				},
				eventListeners = {};

			/**
			 * This method identifies and categorises the files and directories that have been detected
			 * on a local UPnP device.
			 * @method processContentResults
			 * @private
			 * @param {Array} results The files and directories that have been discovered on a UPnP device.
			 * @return {Array} The results array that was passed into the method with an additional "fileType"
			 * property attached to each result object in the results array.
			 */
			function processContentResults(results) {
				var contentItem = null,
					i,
					numberOfResults = results.length || -1,
					processedResults = [];

				for (i = 0; i < numberOfResults; i++) {
					contentItem = results[i];
					if (contentItem && contentItem.type === 1) {
						contentItem.fileType = fileTypes.FOLDER;
					} else if (contentItem && contentItem.resource.length) {
						if (contentItem.resource[0].protocolInfo.indexOf("http-get:*:image/") > -1) {
							contentItem.fileType = fileTypes.IMAGE;
							contentItem.resourceUrl = contentItem.resource[0].uri.replace("dlna://", "http://");
						} else if (contentItem.resource[0].protocolInfo.indexOf("http-get:*:audio/") > -1) {
							contentItem.fileType = fileTypes.AUDIO;
							contentItem.resourceUrl = contentItem.resource[0].uri;
						} else if (contentItem.resource[0].protocolInfo.indexOf("http-get:*:video/") > -1) {
							contentItem.fileType = fileTypes.VIDEO;
							contentItem.resourceUrl = contentItem.resource[0].uri;
						} else {
							continue;
						}
					}
					processedResults.push(contentItem);
				}
				return processedResults;
			}

			/**
			 * Called once browsing the local network for visible UPnP devices has ended.
			 * @method browseComplete
			 * @private
			 * @param {Object} e Object containing properties relevant to the outcome of the browse operation.
			 */
			function browseComplete(e) {
				if (getContentsCallback) {
					getContentsCallback(processContentResults(e.content), e.handle);
				}
			}

			/**
			 * Called when a UPnP device is no longer available on the local network. (The device may have been disconnected
			 * from the network or may no longer be publicly accessible.)
			 * @method removeDevice
			 * @private
			 * @param {Object} e Object containing properties relevant to the removal/disconnection of a UPnP device.
			 */
			function removeDevice(e) {
				startDeviceDiscovery();
			}

			/**
			 * Begins a discovery for UPnP devices on the local network.
			 * @method startDeviceDiscovery
			 * @private
			 */
			function startDeviceDiscovery() {
				CCOM.HomeNetworking.addEventListener("getDevicesOK", function (e) {
					devices = e.devices;
					if (eventListeners.getDevicesOK) {
						eventListeners.getDevicesOK.forEach(function (listener) {
							listener(devices);
						});
					}
				}, false);
				CCOM.HomeNetworking.addEventListener("getDevicesFailed", function (e) {}, false);
				CCOM.HomeNetworking.getDevices();
			}

			/**
			 * Creates event listeners that listen for events that are fired when UPnP devices are discovered on the local
			 * network and when UPnP devices are disconnected from the local network.
			 * from the local network.
			 * @method addListeners
			 * @private
			 */
			function addEventListeners() {
				CCOM.HomeNetworking.addEventListener('onDeviceFound', function (e) {
					if (eventListeners.onDeviceFound) {
						eventListeners.onDeviceFound.forEach(function (listener) {
							listener(e.device);
						});
					}
					startDeviceDiscovery();
				}, false);
				CCOM.HomeNetworking.addEventListener('onDeviceLost', function (e) {
					if (eventListeners.onDeviceLost) {
						eventListeners.onDeviceLost.forEach(function (listener) {
							listener(e.device);
						});
					}
					removeDevice(e);
				}, false);
				CCOM.HomeNetworking.addEventListener('browseContainerOK', browseComplete, false);
				CCOM.HomeNetworking.addEventListener('browseContainerFailed', function () {}, false);
			}

			// Public API.
			return {
				/**
				 * Object that contains constants used to identify different media types.
				 * @property {Number} fileTypes
				 * @readonly
				 */
				fileTypes: fileTypes,

				/**
				 * Initialisation method that begins the discovery of UPnP devices on the local network.
				 * @method init
				 */
				init: function () {
					if (CCOM && CCOM.HomeNetworking && CCOM.HomeNetworking.getDevices) {
						startDeviceDiscovery();
						addEventListeners();
					}
				},

				/**
				 * Initialisation method that begins the discovery of UPnP devices on the local network.
				 * @method initialise
				 * @deprecated use init()
				 */
				initialise: function () {
					this.init();
				},

				/**
				 * Retrieves the root level directories and any root-level content published by a UPnP device.
				 * @method getRootContentsForDevice
				 * @async
				 * @param {Object} device The UPnP device from which the root-level content should be retrieved.
				 * @param {Function} callback Callback to be executed upon retrieving the root-level content
				 * from a UPnP device.
				 */
				getRootContentsForDevice: function (device, callback) {
					currentDevice = device;
					getContentsCallback = callback;
					return CCOM.HomeNetworking.browseContainer(device.udn, "0", "", "*", 0, MAX_CONTENT_ITEMS);
				},

				/**
				 * Retrieves the contents of a directory located on a UPnP device.
				 * @method getContentsForFolder
				 * @async
				 * @param {String} folder The directory that is to be explored.
				 * @param {Function} callback Callback to be executed upon retrieving the contents of the
				 * specified directory.
				 * @param {Number} [start=0] The offset in the content list from which data will be returned
				 * @param {Number} [limit=25] number of items in the content list to be returned
				 */
				getContentsForFolder: function (folder, callback, start, limit) {
					getContentsCallback = callback;
					start = start || 0;
					limit = limit || MAX_CONTENT_ITEMS;
					return CCOM.HomeNetworking.browseContainer(currentDevice.udn, folder.id, "", "*", start, limit);
				},

				/**
				 * Returns an array of visible UPnP devices that are accessible on the local network.
				 * @method getDevices
				 * @return {Array} All visible UPnP devices that have been detected on the local network.
				 */
				getDevices: function () {
					return devices;
				},

				/**
				 * Returns the device that's currently selected
				 * @method getCurrentDevice
				 * @return {Object} the currently selected device
				 */
				getCurrentDevice: function () {
					return currentDevice;
				},

				/**
				 * Registers a callback function to be invoked when the specified event is fired
				 * @method addEventListener
				 * @chainable
				 * @param {String} event the name of the event to listen for
				 * @param {Function} callback the function to be invoked
				 */
				addEventListener: function (event, callback) {
					var mappedEvent = eventNameMap[event];
					if (event && callback && mappedEvent) {
						if (!eventListeners[mappedEvent]) {
							eventListeners[mappedEvent] = [];
						}
						eventListeners[mappedEvent].push(callback);
					}
				},

				/**
				 * Removes a previously registered event listener identified by the given
				 * name and callback
				 * @method removeEventListener
				 * @param {String} event the name of the event you are interested in listening to
				 * @param {Function} callback the function to execute when the event is fired
				 */
				removeEventListener: function (event, callback) {
					var mappedEvent = eventNameMap[event];
					if (event && callback && mappedEvent && eventListeners[mappedEvent]) {
						eventListeners[mappedEvent].filter(function (listener) {
							return (listener !== callback);
						});
					}
				}
			};
		}());
		return $N.platform.media.UPnP;
	}
);