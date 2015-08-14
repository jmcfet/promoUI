/**
 * ImageViewer is an instantiable class that provides the functionality to
 * display a set of pictures either automatically in a slide show fashion or
 * allows the ability to skip trough images on a key press.  The control can
 * be sized and positioned and styled using CSS.  Currently supported transitions
 * are only fade out and fade in additional transitions will be added at later dates.
 * @class $N.gui.ImageViewer
 * @extends $N.gui.AbstractControl
 *
 * @requires $N.gui.Container
 * @requires $N.gui.FrameworkCore
 * @requires $N.gui.Util
 * @requires $N.gui.AbstractControl
 *
 * @author mbrown
 * @constructor
 * @param {Object} docRef document element of the page
 * @param {Object} parent the gui object this should be added to
 */
define('jsfw/gui/GUIObjects/Controls/ImageViewer',
    [
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/FrameworkCore',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Controls/AbstractControl'
    ],
    function (Container, FrameworkCore, Util, AbstractControl) {

		var DEFAULT_TRANSITION_TIME = 1000;

		function ImageViewer(docRef, parent) {
			this._imageList = [];
			this._currentImage = null;
			this._currentIndex = 0;

			this._container = $N.gui.Container(docRef);
			this._rootElement = this._container.getRootElement();

			var keys = $N.gui.FrameworkCore.getKeys();
			this._skipKey = keys.KEY_FFW;
			this._playKey = keys.KEY_PLAY;
			this._pauseKey = keys.KEY_PAUSE;
			this._transitionTime = DEFAULT_TRANSITION_TIME;

			this._loadedCallback = function () { };
			this._loadingCallback = function () { };
			this._loadingFailedCallback = function () { };

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(ImageViewer, $N.gui.AbstractControl);

		var currentPrototype = ImageViewer.prototype;

		/**
		 * Takes an array of objects that represent a set of images that are to be displayed
		 * at a minimum the objects must contain a href property but can also contain any
		 * other metadata that the UI may find useful
		 * @method setImages
		 * @param {Array} imageList an array of objects with at least one property href
		 * @return {Object} this instance
		 */
		currentPrototype.setImages = function (imageList) {
			this._imageList = imageList || [];
			return this;
		};

		/**
		 * Returns the array of image objects that are to be displayed that were previously set
		 * using the setImages method
		 * @method getImages
		 * @return {Array} the list of images that are set in the viewer
		 */
		currentPrototype.getImages = function () {
			return this._imageList;
		};

		/**
		 * Returns the total number of image objects that are to be displayed that were previously set
		 * using the setImages method
		 * @method getImagecount
		 * @return {Number} the count of images that are set in the viewer
		 */
		currentPrototype.getImagecount = function () {
			return this._imageList.length;
		};

		/**
		 * Returns the object that contains details of the image that is currently being displayed
		 * by this object
		 * @method getCurrentImage
		 * @return {Object} an object that contains details of the current image with at least one property of href
		 */
		currentPrototype.getCurrentImage = function () {
			return this._currentImage;
		};

		/**
		 * Returns the index in the list of the image that is currently being displayed
		 * by this object
		 * @method getCurrentImageIndex
		 * @return {Number}
		 */
		currentPrototype.getCurrentImageIndex = function () {
			return this._currentIndex;
		};


		/**
		 * If the component is not already in slide show mode then calling this method will
		 * start the slide show with the previously set transition time and type
		 * @method play
		 */
		currentPrototype.play = function () {
			// do something;
		};

		/**
		 * If the component is in slide show mode this will stop the slide show at the current
		 * image and will not automatically move to the next image until the play method is called
		 * @method pause
		 */
		currentPrototype.pause = function () {
			// do something;
		};

		/**
		 * Sets the amount of time that images get show before moving to the next
		 * @param {Number} milliseconds the delay time between images
		 * @method setTransitionDelay
		 * @param {Number} delay the delay in milliseconds
		 * @return {Object} this instance
		 */
		currentPrototype.setTransitionDelay = function (delay) {
			this._transitionTime = delay || DEFAULT_TRANSITION_TIME;
			return this;
		};

		/**
		 * Convenience method that allows the UI to pass on the key press to this
		 * component for handling.
		 * @method keyHandler
		 * @param {String} key string constant representing the key that was pressed
		 * @return {Boolean} true if the key was handled
		 */
		currentPrototype.keyHandler = function (key) {
			var handled = false;
			return handled;
		};

		/**
		 * Overrides the default skip key to allow image viewer to be moved to the
		 * next image on the given key
		 * @method setSkipKey
		 * @param {String} newSkipKey new key that should be used to skip
		 * @return {Object} this instance
		 */
		currentPrototype.setSkipKey = function (newSkipKey) {
			this._skipKey = newSkipKey;
			return this;
		};

		/**
		 * Overrides the default play key to allow image viewer to be set into
		 * slide show mode
		 * @method setPlayKey
		 * @param {String} newPlayKey new key that should be used to play the slideshow
		 * @return {Object} this instance
		 */
		currentPrototype.setPlayKey = function (newPlayKey) {
			this._playKey = newPlayKey;
			return this;
		};

		/**
		 * Overrides the default pause key to allow image viewer to be set into
		 * pause slide show mode
		 * @method setPauseKey
		 * @param {String} newPauseKey new key that should be used to pause the slideshow
		 * @return {Object} this instance
		 */
		currentPrototype.setPauseKey = function (newPauseKey) {
			this._pauseKey = newPauseKey;
			return this;
		};

		/**
		 * If the image viewer is not currently showing the last image then this method
		 * will request the next image be show irrespective of whether slide show mode is active
		 * or not
		 * @method skip
		 */
		currentPrototype.skip = function () {
			// do something;
		};

		/**
		 * Sets the function that will be called while an image is loading, this is useful
		 * for the application to show some kind of loading feedback to the user
		 * @method setLoadingCallback
		 * @param {Function} callback function that should be called while an image is loading
		 * @return {Object} this instance
		 */
		currentPrototype.setLoadingCallback = function (callback) {
			this._loadingCallback = callback || function () { };
			return this;
		};

		/**
		 * Sets the function that will be called once an image has completed loading, works
		 * with the setLoadingCallback method to allow any loading notification to be hidden
		 * @method setLoadedCallback
		 * @param {Function} callback function that should be called after an image is loaded
		 * @return {Object} this instance
		 */
		currentPrototype.setLoadedCallback = function (callback) {
			this._loadedCallback = callback || function () { };
			return this;
		};

		/**
		 * Sets the function that will be called if an image fails to load, the reason
		 * for the failure will be passed back to the callback function
		 * @method setLoadingFailedCallback
		 * @param {Function} callback function that should be called if an image fails to load
		 * @return {Object} this instance
		 */
		currentPrototype.setLoadingFailedCallback = function (callback) {
			this._loadingFailedCallback = callback || function () { };
			return this;
		};

		/**
		 * Sets the overall width of this component, note that images will retain their aspect
		 * ratio by default so this affects the background more then the image if the image
		 * size is different to the component width
		 * @method setWidth
		 * @param {Number} width the new width
		 * @return {Object} this instance
		 */
		currentPrototype.setWidth = function (width) {
			this._container.width = width;
			return this;
		};

		/**
		 * Sets the overall height of this component, note that images will retain their aspect
		 * ratio by default so this affects the background more then the image if the image
		 * size is different to the component heigh
		 * @method setHeight
		 * @param {Number} height the new height
		 * @return {Object} this instance
		 */
		currentPrototype.setHeight = function (height) {
			this._container.height = height;
			return this;
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.ImageViewer = ImageViewer;
		return ImageViewer;
	}
);