/*
 * The core module contains classes that deal with all the Context functionality such as initialising the
 * contexts and navigating between them.
 *
 */

/**
 * This class holds information about each Context. A context is a running instance of a client application.
 * Contexts are not created directly by applications using the constructor; instead, they are typically created
 * by a call to `$N.apps.core.ContextManager.addContext()`. Contexts thus created can then be accessed
 * by calling methods like `$N.apps.core.ContextManager.getActiveContext()` or
 * `$N.apps.core.ContextManager.getLastContext()`.
 *
 * The ContextManager class maintains a collection of Contexts.
 *
 * @class $N.apps.core.Context
 * @constructor
 * @param {String} id Unique identifier for this Context
 * @param {String} url Path to application controller and supporting markup/CSS.
 * @param {Number} caching One of `PRE_CACHE`, `PRE_EMPTIVE`, `LAZY_LOAD` or `NO_CACHE`
 * @param {Boolean} isDefault Indicates whether the context is to be the default
 * @param {String} contextGroup Indicates the Context Group that this context is to be a part of
 */
define('jsfw/apps/core/Context',
    [],
	function () {
		var Context = function (id, url, caching, isDefault, contextGroup, htmlType) {
		    this._LOG_CONTEXT = "context";
		    this._APP_NAME = "Context";

		    this._id = id;
		    this._url = url;
		    this._caching = caching;
		    this._isLoaded = false;
		    this._controller = null;
		    this._handle = null;
		    this._height = null;
		    this._width = null;
		    this._posX = null;
		    this._posY = null;
			this._overlayClosedCallback = function () {};
			this._hiddenBy = null;
		    this._isDefault = isDefault;
		    this.contextGroup = contextGroup || '';
		    this._htmlType = htmlType || '';
		    this._loadFailTimer = null;
		};

		var proto = Context.prototype;

		/*
		 * ===================================================
		 *                       GETTERS
		 * ===================================================
		 */

		/**
		 * Returns the unique id of the context
		 * @method getId
		 * @return {String} id of this instance
		 */
		proto.getId = function () {
		    return this._id;
		};

		/**
		 * Returns the URL of the context
		 * @method getUrl
		 * @return {String} URL of this context
		 */
		proto.getUrl = function () {
		    return this._url;
		};

		/**
		 * Returns the cache type of the context. One of `ContextManager.CACHE_PRE_CACHE, CACHE_PRE_EMPTIVE,
		 * CACHE_LAZY_LOAD` or `CACHE_NO_CACHE`
		 * @method getCachingStrategy
		 * @return {Number} a number that represents the cache type of the context
		 */
		proto.getCachingStrategy = function () {
		    return this._caching;
		};

		/**
		 * Determines if this context is marked as the default context (first context to load)
		 * @method isDefault
		 * @return {Boolean} true if this context is the default; false otherwise
		 */
		proto.isDefault = function () {
		    return this._isDefault;
		};

		/**
		 * Returns the JavaScript object that is the main
		 * controller for the context/application
		 * @method getController
		 * @return {Object} the controller of this context
		 */
		proto.getController = function () {
		    return this._controller;
		};

		/**
		 * Determines if the context is loaded and in memory
		 * @method isLoaded
		 * @return {Boolean} true if the context is loaded in memory
		 */
		proto.isLoaded = function () {
		    return this._isLoaded;
		};

		/**
		 * Returns the DOM object representing this context
		 * @method getHandle
		 * @return {Object} DOM Element representing this context
		 */
		proto.getHandle = function () {
		    return this._handle;
		};

		/**
		 * Returns the height value of this context
		 * @method getHeight
		 * @return {Number} height of this context
		 */
		proto.getHeight = function () {
		    return this._height;
		};

		/**
		 * Returns the width value of this context
		 * @method getWidth
		 * @return {Number} width of this context
		 */
		proto.getWidth = function () {
		    return this._width;
		};

		/**
		 * Returns the x co-ordinate of this context
		 * @method getX
		 * @return {Number} x co-ordinate of this context
		 */
		proto.getX = function () {
		    return this._posX;
		};

		/**
		 * Returns the y co-ordinate of this context
		 * @method getY
		 * @return {Number} y co-ordinate of this context
		 */
		proto.getY = function () {
		    return this._posY;
		};

		/**
		 * Returns the context that was activated to hide this context
		 * @method getHiddenBy
		 * @return {Object} context that hid this one
		 */
		proto.getHiddenBy = function () {
			return this._hiddenBy;
		};

		/**
		 * Returns the callback that will be invoked when an overlay is closed
		 * @method getOverlayClosedCallback
		 * @return {Function} callback
		 */
		proto.getOverlayClosedCallback = function () {
			return this._overlayClosedCallback;
		};
		/**
		 * Returns the html type either DIV or null (NULL defaults to iframe)
		 * @method getHtmlType
		 * @return {String} DIV or null
		 */
		proto.getHtmlType = function () {
			return this._htmlType;
		};

		/*
		 * ===================================================
		 *                       SETTERS
		 * ===================================================
		 */

		/**
		 * Sets the controller (think MVC) object for the context
		 * @method setController
		 * @param {Object} controller
		 */
		proto.setController = function (controller) {
		    this._controller = controller;
		};

		/**
		 * Sets the URL for the context
		 * @method setUrl
		 * @param {String} url
		 */
		proto.setUrl = function (url) {
		    this._url = url;
		};

		/**
		 * Sets the loaded state for the context
		 * @method setLoaded
		 * @param {Boolean} state
		 */
		proto.setLoaded = function (state) {
		    if (state === null || typeof state !== 'boolean') {
		        state = false;
		    }
		    this._isLoaded = state;
		    if (state && this._loadFailTimer) {
		    	clearTimeout(this._loadFailTimer);
		    	this._loadFailTimer = null;
		    }
		};

		/**
		 * Sets the default value for the context
		 * @method setDefault
		 * @param {Boolean} isDefault if set to true, this context becomes the default
		 */
		proto.setDefault = function (isDefault) {
		    this._isDefault = isDefault;
		};

		/**
		 * Sets the reference to the DOM object holding the context
		 * @method setHandle
		 * @param {Object} handle
		 */
		proto.setHandle = function (handle) {
		    this._handle = handle;
		};

		/**
		 * Sets the height value for the context
		 * @method setHeight
		 * @param {Number} height
		 */
		proto.setHeight = function (height) {
		    this._height = height;
		};

		/**
		 * Sets the width value for the context
		 * @method setWidth
		 * @param {Number} width
		 */
		proto.setWidth = function (width) {
		    this._width = width;
		};

		/**
		 * Sets the x co-ordinate for the context
		 * @method setX
		 * @param {Number} x x co-ordinate
		 */
		proto.setX = function (x) {
		    this._posX = x;
		};

		/**
		 * Sets the y co-ordinate for the context
		 * @method setY
		 * @param {Number} y y co-ordinate
		 */
		proto.setY = function (y) {
		    this._posY = y;
		};

		/**
		 * Sets the group that the context belongs to
		 * @method setGroup
		 * @param {String} group
		 */
		proto.setGroup = function (group) {
			this.contextGroup = group;
		};

		/**
		 * Sets the callback to run when an overlay is closed to reveal this context
		 * @method setOverlayClosedCallback
		 * @param {Object} callback
		 */
		proto.setOverlayClosedCallback = function (callback) {
			this._overlayClosedCallback = callback;
		};

		/**
		 * Sets the context that was activated to hide this context
		 * @method setHiddenBy
		 * @param {Object} context
		 */
		proto.setHiddenBy = function (context) {
			this._hiddenBy = context;
		};

		/**
		 * Starts the loading timer. If this expires then the failure callback is called
		 * @method startLoadingTimer
		 * @param {Function} failureCallback
		 * @param {Number} timeMs Time in milliseconds that the context has to successfully load before the failure callback is called
		 */
		proto.startLoadingTimer = function (failureCallback, timeMs) {
			var me = this;
			this._loadFailTimer = setTimeout(function () {
				failureCallback(me);
			}, timeMs);
		};

		/**
		 * returns the string representation of this context
		 * @method toString
		 * @return {String} string representation of this context
		 */
		proto.toString = function () {
			return '[Context ' + this._id + ']';
		};

		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.core = $N.apps.core || {};
		$N.apps.core.Context = Context;
		return Context;
	}
);
