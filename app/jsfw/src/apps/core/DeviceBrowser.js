/**
 * DeviceBrowser is a facade that allows you to return and browse various types of media
 * devices available on the system / network.  Currently, the supported devices are UPnP and USB.
 * The class is a singleton and requires initialisation prior to use.
 *
 * To use the class, the first call required is `getDevices()` which returns any devices that are available
 * on the system for browsing. Subsequent navigation of the device contents can be done using the methods
 * `getRootContentsForDevice`, `browseFolder` and `navigateBack`. A bread crumb is maintained such
 * that the UI can display the current location in the device content tree to aid browsing.
 * @class $N.apps.core.DeviceBrowser
 * @singleton
 * @requires $N.platform.media.UPnP
 * @requires $N.platform.media.USB
 */

define('jsfw/apps/core/DeviceBrowser',
	[
		'jsfw/platform/media/UPnP',
		'jsfw/platform/media/USB'
	],
	function (UPnP, USB) {
		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.core = $N.apps.core || {};
		$N.apps.core.DeviceBrowser = (function () {
			var jsfwUpnp,
				jsfwUsb,
				currentDevice = null,
				currentDeviceType = null,
				currentJsfwClass = null,
				allDevices = [],
				fileTypes = {
					AUDIO: 1,
					IMAGE: 2,
					VIDEO: 3,
					FOLDER: 4,
					FILE: 5,
					UNKNOWN: 6
				};

			function mergeDevicesList(callback) {
				allDevices.length = 0;
				var usbFound = false,
					upnpFound = false,
					usbFoundCallback = function (deviceList) {
						allDevices = allDevices.concat(deviceList);
						usbFound = true;
						if (upnpFound) {
							callback(allDevices);
						}
					},
					upnpFoundCallback = function (deviceList) {
						allDevices = allDevices.concat(deviceList);
						upnpFound = true;
						// TODO: the following line needs to be removed once USB discovery starts working
						usbFound = true;
						if (usbFound) {
							callback(allDevices);
						}
					};
				jsfwUpnp.getDevices(upnpFoundCallback);
				jsfwUsb.getDevices(usbFoundCallback);
			}

			return {
				/**
				 * Defines the type of a device that can be returned from the getDevices() method.
				 * One of `USB` or `UPNP`
				 * @property {Object} deviceTypes
				 * @readonly
				 */
				deviceTypes: {
					UPNP: 1,
					USB: 2
				},

				/**
				 * Defines the type of content that can be returned when retrieving device contents.
				 * One of `AUDIO`, `IMAGE`, `VIDEO`, `FOLDER`, `FILE`, `UNKNOWN`
				 * @property {Object} fileTypes
				 * @readonly
				 */
				fileTypes: fileTypes,

				/**
				 * Initialises the DeviceBrowser such that it starts listening for new media devices
				 * @method initialise
				 * @deprecated use init
				 */
				initialise: function () {
					this.init();
				},

				/**
				 * Initialises the DeviceBrowser such that it starts listening for new media devices
				 * @method init
				 */
				init: function () {
					jsfwUpnp = $N.platform.media.UPnP;
					jsfwUsb = $N.platform.media.USB;
					jsfwUpnp.init();
					jsfwUsb.init();
				},

				/**
				 * Asynchronously returns an array of Device objects. If no devices are found, an empty array is returned.
				 * @method getDevices
				 * @async
				 * @param {Function} callback a function that accepts a parameter for the data to be returned on.
				 * Device objects contain the following properties:
				 *
				 *     friendlyName {String}
				 *     udn {String} (unique ID)
				 *     manufacturer {String}
				 *     modelName {String}
				 *     SerialNumber {String}
				 *     iconData {Object}
				 *     type {Number} (see `deviceTypes` for possible values).
				 *
				 */
				getDevices: function (callback) {
					mergeDevicesList(callback);
				},

				/**
				 * Asynchronously returns an array of Content objects available at the
				 * root of the given device.
				 * If no content is found, an empty array is returned.
				 *
				 * This method _must_ be called to start browsing the contents of a device.
				 *
				 * @method getRootContentsForDevice
				 * @async
				 * @param {Device} device the device object that you want the root content of
				 * @param {Function} callback a function that accepts a parameter for the data to be returned on
				 */
				getRootContentsForDevice: function (device, callback) {
					currentDevice = device;
					currentDeviceType = device.type;
					if (currentDeviceType === this.deviceTypes.UPNP) {
						currentJsfwClass = $N.platform.media.UPnP;
					} else {
						currentJsfwClass = $N.platform.media.USB;
					}
					currentJsfwClass.getRootContentsForDevice(currentDevice, callback);
				},

				/**
				 * Asynchronously returns an array of Content objects available at the
				 * given folder obtained from a previous call to this method or from `getRootContentsForDevice()`.
				 *
				 * If no content is found, an empty array is returned.
				 * @method getContentForFolder
				 * @async
				 * @param {Content} folder a Content object whose type is `FOLDER`
				 * @param {Function} callback a function that accepts a parameter for the data to be returned on.
				 * Content objects contain the following properties:
				 *
				 *     title {String}
				 *     id {String}
				 *     playable {Boolean} (true for playable content)
				 *     type {Number} (see fileTypes)
				 *     childCount {Number} (content count if folder)
				 *     res {Object} (which contains, among other things, `protocolInfo` and `uri` (to play the content)).
				 */
				getContentsForFolder: function (folder, callback) {
					if (folder) {
						currentJsfwClass.getContentsForFolder(folder, callback);
					}
				},

				/**
				 * Asynchronously returns an array of Content objects available at the
				 * given folder obtained from a previous call to this method or from `getRootContentsForDevice()`.
				 *
				 * If no content is found, an empty array is returned. Calling this method also maintains the position in
				 * the content tree such that a bread crumb can be produced or `navigateBack()` can be called.
				 * @method browseFolder
				 * @async
				 * @param {Content} folder a Content object whose type is `FOLDER`
				 * @param {Function} callback a function that accepts a parameter for the data to be returned on. Content objects
				 * contain the following properties:
				 *
				 *         title {String}
				 *         id {String}
				 *         playable {Boolean} (true for playable content)
				 *         type {Number} (see fileTypes)
				 *         childCount {Number} (content count if folder)
				 *         resourceUrl {String} (url to play the content).

				 */
				browseFolder: function (folder, callback) {
					if (folder) {
						currentJsfwClass.browseFolder(folder, callback);
					}
				},

				/**
				 * Asynchronously returns an array of Content objects via the callback parameter available at the
				 * parent folder to the current folder in the browse tree. Calling this method when at the root
				 * folder has no effect. If no content is found, an empty array is returned.
				 * @method navigateBack
				 * @async
				 * @param {Function} callback a function that accepts a parameter for the data to be returned on
				 */
				navigateBack: function (callback) {
					currentJsfwClass.navigateBack(callback);
				},

				/**
				 * Returns true if the last browse resulted in the contents at the root folder being displayed
				 * @method isAtRoot
				 * @return {Boolean}
				 */
				isAtRoot: function () {
					return currentJsfwClass ? currentJsfwClass.isAtRoot() : false;
				},

				/**
				 * Returns an array of strings each of which represents the folder that has been browsed to in the
				 * content tree using `browseFolder()`
				 * @method getBreadCrumbTrail
				 * @return {Array}
				 */
				getBreadCrumbTrail: function () {
					return currentJsfwClass ? currentJsfwClass.getBreadCrumbTrail() : [];
				},

				/**
				 * Returns a string delimited by the given parameter of the current browse tree.
				 * e.g root::Pictures::Wedding
				 * @method getBreadCrumbString
				 * @param {String} delimiter string that delimits the bread crumb
				 * @return {String}
				 */
				getBreadCrumbString: function (delimiter) {
					return currentJsfwClass ? currentJsfwClass.getBreadCrumbString(delimiter) : '';
				},

				/**
				 * Sets the global filter type for returned content to that of the type parameter.
				 * For example if type is set to `$N.apps.core.DeviceBrowser.fileTypes.IMAGE` then only images will be
				 * returned
				 * @method setFileTypeFilter
				 * @param {FileType} type one of fileTypes
				 */
				setFileTypeFilter: function (type) {

				},

				/**
				 * Adds an event listener for the Event identified by the supplied name,
				 * once the event is fired the callback function will be executed.  Multiple
				 * event listeners can be added for the same event.
				 * @method addEventListener
				 * @param {String} name the name of the event you are interested in listening to
				 * @param {Function} callback the function to execute when the event is fired
				 */
				addEventListener: function (name, callback) {

				},

				/**
				 * Removes a previously registered event listener identified by the given
				 * name and callback
				 * @method removeEventListener
				 * @param {String} name the name of the event you are interested in listening to
				 * @param {Function} callback the function to execute when the event is fired
				 */
				removeEventListener: function (name, callback) {

				}

				/**
				 * Fired when a new usb device is discovered and is available for browsing
				 * @event USBDeviceFound
				 * @param {Device} device the device that was found
				 */

				/**
				 * Fired when a new upnp device is discovered and is available for browsing
				 * @event UPNPDeviceFound
				 * @param {Device} device the device that was found
				 */

				/**
				 * Fired when a new device is discovered and is available for browsing
				 * @event DeviceFound
				 * @param {Device} device the device that was found
				 */

				/**
				 * Fired when a usb device is lost and is no longer available for browsing
				 * @event USBDeviceLost
				 * @param {String} udn the id of the device that was lost
				 */

				/**
				 * Fired when a upnp device is lost and is no longer available for browsing
				 * @event UPNPDeviceLost
				 * @param {String} udn the id of the device that was lost
				 */

				/**
				 * Fired when a device is lost and is no longer available for browsing
				 * @event DeviceLost
				 * @param {String} udn the id of the device that was lost
				 */

				/**
				 * Fired when the device list has been updated as a result of one or more devices
				 * having been discovered or dropped out
				 * @event DeviceListUpdated
				 * @param {Array} devices the updated device list
				 */
			};

		}());
		return $N.apps.core.DeviceBrowser;
	}
);