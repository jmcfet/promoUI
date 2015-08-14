/**
 * USB is a singleton object that allows you to return and browse USB media devices
 * available on the system. The class  requires initialisation prior to use.  To use the
 * class the first call required is getDevices() which returns any devices on the system
 * that are available for browsing.  Subsequent navigation of the device contents can be
 * done using the methods; getRootContentsForDevice, browseFolder and navigateBack.
 * A bread crumb is maintained such that a UI can display the current location in the
 * device content tree to aid browsing.
 * @class $N.platform.media.USB
 * @singleton
 */

define('jsfw/platform/media/USB',
	[],
	function () {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.media = $N.platform.media || {};

		$N.platform.media.USB = (function () {

			//TODO: Implementation of private data and functions

			return {

				/**
				 * Defines the type of content that can be returned when retrieving device contents
				 * one of "FOLDER", "IMAGE", "VIDEO", "MUSIC", "OTHER", "UNKNOWN"
				 * @property {Object} fileTypes
				 * @readonly
				 */
				fileTypes: {

				},

				/**
				 * Initialises the USB object such that it starts listening
				 * for new USB devices
				 * @method init
				 */
				init: function () {

				},

				/**
				 * Initialises the USB object such that it starts listening
				 * for new USB devices
				 * @method initialise
				 * @deprecated use init()
				 */
				initialise: function () {
					this.init();
				},

				/**
				 * Asynchronously returns an array of USB Device objects via the callback parameter
				 * Device objects contain the following properties, friendlyName, udn (unique ID),
				 * manufacturer, model, SerialNumber, Icon, Type (see deviceTypes).  If no devices are
				 * found an empty array is returned.
				 * @method getDevices
				 * @param {Function} callback a function that defines a parameter for the data to be returned on
				 */
				getDevices: function (callback) {

				},

				/**
				 * Asynchronously returns an array of Content objects via the callback parameter available at the
				 * root of the given device, this is the initial call to start browsing content of a device.
				 * Content objects contain the following properties, title, id, playable (true for playable content)
				 * type (see fileTypes), childCount (content count if folder), resourceUrl (url to play the content).
				 * If no content is found an empty array is returned.
				 * @method getRootContentsForDevice
				 * @param {Object} device the device object that you want the root content of
				 * @param {Function} callback a function that defines a parameter for the data to be returned on
				 */
				getRootContentsForDevice: function (device, callback) {

				},

				/**
				 * Asynchronously returns an array of Content objects via the callback parameter available at the
				 * given folder obtained from a previous call to this method or from getRootContentsForDevice().
				 * Content objects contain the following properties, title, id, playable (true for playable content)
				 * type (see fileTypes), childCount (content count if folder), resourceUrl (url to play the content).
				 * If no content is found an empty array is returned.
				 * @method getContentForFolder
				 * @param {Object} folder a Content object whose type is "FOLDER"
				 * @param {Function} callback a function that defines a parameter for the data to be returned on
				 */
				getContentForFolder: function (folder, callback) {

				},

				/**
				 * Asynchronously returns an array of Content objects via the callback parameter available at the
				 * given folder obtained from a previous call to this method or from getRootContentsForDevice().
				 * Content objects contain the following properties, title, id, playable (true for playable content)
				 * type (see fileTypes), childCount (content count if folder), resourceUrl (url to play the content).
				 * If no content is found an empty array is returned. Calling this method also maintains the position in
				 * the content tree such that a bread crumb can be produced or navigateBack can be called.
				 * @method browseFolder
				 * @param {Object} folder a Content object whose type is "FOLDER"
				 * @param {Function} callback a function that defines a parameter for the data to be returned on
				 */
				browseFolder: function (folder, callback) {

				},

				/**
				 * Asynchronously returns an array of Content objects via the callback parameter available at the
				 * parent folder to the current folder in the browse tree. Calling this method when at the root
				 * folder has no effect.  If no content is found an empty array is returned.
				 * @method navigateBack
				 * @param {Function} callback a function that defines a parameter for the data to be returned on
				 */
				navigateBack: function (callback) {

				},

				/**
				 * Returns true if the last browse resulted in the contents at the root folder being displayed
				 * @method isAtRoot
				 * @return {Boolean}
				 */
				isAtRoot: function () {

				},

				/**
				 * Returns an array of Strings that represent each of the folders that have been browsed to in the
				 * content tree using browseFolder()
				 * @method getBreadCrumbTrail
				 * @return {Array}
				 */
				getBreadCrumbTrail: function () {

				},

				/**
				 * Returns a string delimeted by the given parameter of the current browse tree.
				 * e.g root::Pictures::Wedding
				 * @method getBreadCrumbString
				 * @return {String}
				 */
				getBreadCrumbString: function (delimeter) {

				},

				/**
				 * Sets the global filter type for returned content to that of the type parameter.
				 * For example if type is set to $N.platform.system.DeviceBrowser.fileTypes.IMAGE then only images will be
				 * returned
				 * @method setFileTypeFilter
				 * @param {Object} type one of fileTypes
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
				 * Fired when a new device is discovered and is available for browsing
				 * @event DeviceFound
				 * @param {Object} device the device that was found
				 */

				/**
				 * Fired when a device is lost and is no longer available for browsing
				 * @event DeviceLost
				 * @param {String} udn the id of the device that was lost
				 */

			};

		}());
		return $N.platform.media.USB;
	}
);