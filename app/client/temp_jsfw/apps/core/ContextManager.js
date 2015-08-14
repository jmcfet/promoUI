/**
 * The purpose of the Context Manager is to store and manage contexts (applications such as EPG)
 * allowing switching from one to another such that the one and only active context is receiving the
 * input from a user. Once the context manager has been initialised (using the init method)
 * it can be made aware of contexts by the `addContext` method. Switching between these contexts can
 * then be achieved using the `navigate` or `overlay` methods, the difference being that overlaid contexts
 * are stacked on top of the active context (without passivating it) while navigated contexts become active
 * by calling the `passivate` method of the currently active context (see the documentation for these methods
 * for more info).
 *
 * Contexts can be grouped together to share authentication status. E.g., applications that require parental
 * control authentication like EPG and Catch-up can be grouped together so that the user will be required to
 * authenticate himself / herself only once when switching from one to another (see `addContext`).
 *
 * @class $N.apps.core.ContextManager
 * @singleton
 * @requires $N.apps.core.Log
 * @requires $N.apps.core.Context
 * @requires $N.apps.core.ContextManagerHelper
 * @requires $N.apps.core.WatchDog
  */

/*global setTimeout,document*/

define('jsfw/apps/core/ContextManager',
	[
		'jsfw/apps/core/Log',
		'jsfw/apps/core/Context',
		'jsfw/apps/core/ContextManagerHelper',
		'jsfw/apps/core/WatchDog'
	],
	function (Log, Context, ContextManagerHelper, WatchDog) {
		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.core = $N.apps.core || {};
		$N.apps.core.ContextManager = (function () {

			//Constants
			var CACHE_PRE_CACHE = 0,						// Loaded and cached during boot-up
				CACHE_PRE_EMPTIVE = 1,						// Loaded and cached in a background process after the Home Page has loaded
				CACHE_LAZY_LOAD = 2,						// Loaded and cached when first requested
				CACHE_NO_CACHE = 3,							// Loaded each time its requested and all resources released after navigating away.
				READY = 0,									// (for future extensions) All pre-emptive screens have finished init
				PRE_CACHING = 1,							// No applications can be activated during this phase
				PRE_EMPTIVE_CACHING = 2,					// All pre-cache screens have finished init and the default screen has been activated
				LOADING = 3,
				LOG_ERROR = "error",
				LOG_WARN = "warn",
				LOG_INFO = "info",
				MAX_CONTEXT_STACK_LENGTH = 30;

			var currLoadingId = null,    // Context id that is currently getting loaded.
				activeResolution,
				contextGroupElem = null,
				status = null,
				contextList = [],
				activeContext = null,
				underlayContexts = [],
				previewContext = null,
				lastContext = null,
				watchDog = null,
				preEmptiveLoading = false,
				domAbstraction = null,
				log = new $N.apps.core.Log("context", "ContextManager"),
				eventListeners = {},
				contextLoadingExpiryTime = 180000,
				reloadingContexts = false;

			var contextLoadingCallback = function (inProgress) {},
				preCacheProgressCallback = null,
				loadedPreCachedContexts = 0,
				preCachedContexts = 0;

			/* private functions */
			/**
			 * Returns the number of contexts of a given type of caching
			 * @method getContextCountByCacheType
			 * @private
			 * @param {String} cType The type of caching we want to count contexts for
			 * @return {Number} The total amount of contexts that have cType caching
			 */
			var getContextCountByCacheType = function (cType) {
				log("getContextCountByCacheType", "Enter");
				var i = 0,
					ctx,
					total = 0;
				for (i = 0; i < contextList.length; i++) {
					ctx = contextList[i];
					if (ctx.getCachingStrategy() === cType) {
						total++;
					}
				}
				log("getContextCountByCacheType", "Cache Type: " + cType + " Count: " + String(total));
				log("getContextCountByCacheType", "Exit");
				return total;
			};

			/**
			 * Returns the valid url when a context url or context name is passed
			 * @method  getContextUrl
			 * @private
			 * @param {String} cUrlOrName
			 * @return {String} The url for the given context url or name
			 */
			var getContextUrl = function (cUrlOrName) {
				return $N.apps.core.ContextManager.getNavigationLink(cUrlOrName) || cUrlOrName;
			};

			/**
			 * This method true when the total number of 'loaded'
			 * contexts = total number of contexts marked to cache for the given type
			 * @method isCacheLoadComplete
			 * @private
			 * @param {String} type Cache Strategy to verify
			 * @return {Boolean} True if the cache types context have finished loading
			 */
			var isCacheLoadComplete = function (type) {
				log("isCacheLoadComplete", "Enter");
				var i = 0,
					cacheTotal = getContextCountByCacheType(type),
					res,
					total = 0;
				for (i = 0; i < contextList.length; i++) {
					var ctx = contextList[i];
					if (ctx.getCachingStrategy() === type) {
						if (ctx.isLoaded()) {
							total++;
						} else {
							log("isCacheLoadComplete", "Waiting For: " + ctx.getId());
						}
					}
				}
				log("isCacheLoadComplete", "Type: " + type + " Count: " + String(total) + " Total: " + String(cacheTotal));
				res = (total === cacheTotal) ?  true : false;

				log("isCacheLoadComplete", "Exit");
				return res;
			};

			/**
			 * Sets up a watchdog to defer navigation until the context
			 * has completed loading and initialising
			 * @method navigatePending
			 * @private
			 * @param {String} cUrl the context URL
			 * @param {Object} callBack function to run
			 */
			var navigatePending = function (cUrl, callBack) {
				log("navigatePending", "Enter");

				if (!isCacheLoadComplete(CACHE_PRE_CACHE)) {
					if (watchDog.getDelay_watchdog_retries() !== WatchDog.DELAY_WATCHDOG_TO) {
						watchDog.setDelay_watchdog_retries(watchDog.getDelay_watchdog_retries() + WatchDog.DELAY_WATCHDOG_RETRY_INTERVAL);
						log("navigatePending", "Delaying URL (" + cUrl + ") " + watchDog.getDelay_watchdog_retries() + "/" + WatchDog.DELAY_WATCHDOG_TO);
						setTimeout(callBack, WatchDog.DELAY_WATCHDOG_RETRY_INTERVAL);
					} else {
						log("navigatePending", "Navigate Timed out (" + cUrl + ")", LOG_ERROR);
					}
				} else {
					status = READY;
					currLoadingId = null;
				}
				log("navigatePending", "Exit");
			};

			/**
			 * Fires the loadFail event with the given context
			 * @method contextLoadFail
			 * @param {Object} context
			 * @private
			 */
			var contextLoadFail = function (context) {
				removeContext(context);
				fireEvent("loadFailure", context);
			};

			/**
			 * Creates a context element in the DOM for the given context and adds the context to the contextGroupElement
			 * @method createContextElement
			 * @private
			 * @param {Object} context The context object to be created
			 * @param {Object} contextGroupElement The group element within the DOM that the new context should be added to
			 * @return {Object} the context object that has been created
			 */
			var createContextElement = function (context, contextGroupElement) {
				log("createContextElement", "Enter");
				var contextElem;

				context.startLoadingTimer(contextLoadFail, contextLoadingExpiryTime);
				contextElem = domAbstraction.createContextElement(context.getId(), context.getWidth(), context.getHeight(), context.getX(), context.getY(), context.getUrl(), context.getHtmlType());
				contextGroupElement.appendChild(contextElem);
				context.setHandle(contextElem);
				log("createContextElement", "Created ID: " + context.getId() + " (" + context.getX() + ", " + context.getY() + ", " + context.getWidth() + "x" + context.getHeight() + ") URL: " + context.getUrl());
				log("createContextElement", "Exit");

				return context;
			};

			/**
			 * Creates or sets the correct handle for non cached contexts
			 * @method resolveContextHandle
			 * @private
			 * @param {Object} context The context that we wish to resolve the correct handle for
			 */
			var resolveContextHandle = function (context) {
				var cacheStrategy = context.getCachingStrategy();
				if (cacheStrategy === CACHE_LAZY_LOAD || cacheStrategy === CACHE_NO_CACHE) {
					contextLoadingCallback(true);
					createContextElement(context, contextGroupElem);
				}
			};

			/**
			 * get screen object from array based on URL parameter
			 * @method getContextByUrl
			 * @private
			 * @param {String} url Screen URL
			 * @return {Object} Context Object.
			 */
			var getContextByUrl = function (url) {
				var context = null,
					ctx = null,
					i = 0;
				for (i = 0; i < contextList.length; i++) {
					ctx = contextList[i];
					if (ctx.getUrl() === url) {
						context = ctx;
						break;
					}
				}
				return context;
			};

			/**
			 * Makes the given context visible on-screen and activates it
			 * @method showContext
			 * @private
			 * @param {Object} ctx The Context to show
			 * @param {Object} activationContext Used to pass information into the context
			 * @param {Boolean} isAuthenticated If set to true, the context will be activated
			 */
			var showContext = function (ctx, activationContext, isAuthenticated) {
				log("showContext", "Enter");
				if (ctx) {
					log("showContext", "Showing context: " + ctx.getId() + " in " +  ctx.getHandle().id);
					ctx.getController().activate(activationContext, (isAuthenticated || false));
					domAbstraction.bringContextToTop(ctx.getHandle());
					domAbstraction.showContextElement(ctx.getHandle());
					activeContext = ctx;
				} else {
					log("showContext", "Null Context");
				}
				log("showContext", "Exit");
			};

			var removeContext = function (ctx) {
				var cHandle = ctx.getHandle();
				ctx.setHandle(null);
				ctx.setLoaded(false);
				ctx.setController(null);
				setTimeout(function () {
					cHandle.parentNode.removeChild(cHandle);
				}, 1);
			};

			/**
			 * Makes the given context invisible and if context is
			 * of type no cache frees the DOM resources
			 * @method clearContext
			 * @private
			 * @param {Object} ctx The context to clear
			 */
			var clearContext = function (ctx) {
				log("clearContext", "Enter");
				if (ctx) {
					log("clearContext", "Clearing context: " + ctx.getId());

					domAbstraction.clearContextContent(ctx.getHandle());

					if (ctx.getCachingStrategy() === CACHE_NO_CACHE) {
						if (ctx.getController().unload) {
							ctx.getController().unload();
						}
						removeContext(ctx);
						// Context was loaded into a DB screen, remove the handle and state
						log("clearContext", "Context (" + ctx.getId() + ") NO_CACHE, resetting context");
					}
				}
				log("clearContext", "Exit");
			};

			/**
			 * Hides the given context so it is no longer visible on screen and
			 * executes the passivation routine
			 * @method hideContext
			 * @private
			 * @param {Object} ctx The context to hide
			 * @param {Boolean} skipPassivation If set, the context ctx passivate method will be skipped
			 * @param {Boolean} keepContextInDOM If set will keep the given context in DOM
			 */
			var hideContext = function (ctx, skipPassivation, keepContextInDOM) {
				log("hideContext", "Enter");
				var controller = null;
				if (ctx) {
					log("hideContext", "Hiding context: " + ctx.getId());
					controller = ctx.getController();
					if (!skipPassivation) {
						controller.passivate();
					} else if (controller.defocus) {
						controller.defocus();
					}
					domAbstraction.hideContextElement(ctx.getHandle());
					if (!keepContextInDOM && ctx.getCachingStrategy() === CACHE_NO_CACHE) {
						clearContext(ctx);
					}
				}
				log("hideContext", "Exit");
			};

			/**
			 * Performs the switch between fromCtx and toCtx passing the activationContext from
			 * one to the other. If fromCtx is null, then clears all the underlaid contexts
			 * @method switchContext
			 * @private
			 * @param {Object} fromCtx The context we are navigating from
			 * @param {Object} toCtx The context we are navigating to
			 * @param {Object} activationContext Used to pass information into the context
			 * @param {Object} navCompleteCallback Callback function for when navigation completes
			 */
			var switchContext = function (fromCtx, toCtx, activationContext, navCompleteCallback) {
				log("switchContext", "Enter");
				log("switchContext", "Switching To: " + toCtx.getId());
				/*
				 * Find out if the new context is in the same context group as the current context.
				 * If it is, then pass the authentication status from the current context to the new one.
				 */
				var isPreviousContextAuthenticated = false;
				if (fromCtx && fromCtx.contextGroup && toCtx.contextGroup &&
						fromCtx.contextGroup.toLowerCase() === toCtx.contextGroup.toLowerCase()) {
					if (fromCtx.getController().getAuthenticationStatus) {
						isPreviousContextAuthenticated = fromCtx.getController().getAuthenticationStatus();
					}
				}

				//we need to passivate all contexts if navigating
				if (fromCtx) {
					while (underlayContexts.length > 0) {
						hideContext(underlayContexts.pop().context);
					}
					fromCtx.getController().passivate();
				} else {
					lastContext = activeContext;
				}

				// show the new context
				showContext(toCtx, activationContext, isPreviousContextAuthenticated);
				if (fromCtx) {
					lastContext = fromCtx;
					// hide the previous one
					hideContext(fromCtx, true);
				}

				if (navCompleteCallback) {
					navCompleteCallback();
				}
				contextLoadingCallback(false);

				log("switchContext", "Exit");
			};

			/**
			 * Caches contexts for a given caching strategy
			 * @method cacheContexts
			 * @private
			 * @param {String} cacheType Cache Strategy
			 */
			var cacheContexts = function (cacheType) {
				log("cacheContexts", "Enter");
				var i = 0;
				preEmptiveLoading = false;
				log("cacheContexts", "Caching Contexts of strategy: " + cacheType);
				if (contextList) {
					for (i = 0; i < contextList.length; i++) {
						var ctx = contextList[i];

						// make sure it's not already been created or loaded i.e no handle
						if (!ctx.getHandle() && !ctx.isLoaded()) {
							if (ctx.getCachingStrategy() === cacheType) {
								// create the DOM element hidden.
								createContextElement(ctx, contextGroupElem);

								if (cacheType === CACHE_PRE_EMPTIVE) {
									preEmptiveLoading = true;
									break;
								}

							}
						}
					}
				}
				log("cacheContexts", "Exit");
			};

			/**
			 * Initiates the loading of the pre emptive contexts into memory
			 * @method doPreEmptiveCache
			 * @private
			 */
			var doPreEmptiveCache = function () {
				log("doPreEmptiveCache", "Enter");
				cacheContexts(CACHE_PRE_EMPTIVE);
				log("doPreEmptiveCache", "Exit");
			};

			/**
			 * get Context by ID
			 * @method getContextById
			 * @private
			 * @param {Number} id Context ID
			 * @return {Object} A Context object.
			 */
			var getContextById = function (id) {
				var context = null,
					i = 0,
					ctx;
				for (i = 0; i < contextList.length; i++) {
					ctx = contextList[i];
					if (ctx.getId() === id) {
						context = ctx;
						break;
					}
				}
				return context;
			};

			/**
			 * Fires the given event with the given payload
			 * @method fireEvent
			 * @private
			 * @param {String} event
			 * @param {String} parameter
			 */
			var fireEvent = function (event, parameter) {
				var listeners = eventListeners[event],
					i;
				if (listeners) {
					for (i = 0; i < listeners.length; i++) {
						listeners[i](parameter);
					}
				}
			};

			/**
			 * @method isContextDuplicated
			 * @private
			 * @param {Object} context to check
			 * @return {Boolean} isCtxDuplicated
			 */
			var isContextDuplicated = function (context) {
				log("isContextDuplicated", "Enter");
				var i,
					contextId = context.getId(),
					underlayContextsLength = underlayContexts.length;
				for (i = underlayContextsLength - 1; i >= 0; i--) {
					if (underlayContexts[i].context.getId() === contextId) {
						log("isContextDuplicated", "Exit, returning true");
						return true;
					}
				}
				log("isContextDuplicated", "Exit, returning false");
				return false;
			};

			/**
			 * Remove original context instance and all contexts before it in the stack
			 * @method removeDuplicateContextAndPriorHistory
			 * @private
			 * @param {Object} context to check
			 */
			var removeDuplicateContextAndPriorHistory = function (context) {
				log("removeDuplicateContextAndPriorHistory", "Enter");
				var i,
					j,
					contextId = context.getId(),
					underlayContextsLength = underlayContexts.length;
				for (i = underlayContextsLength - 1; i >= 0; i--) {
					if (underlayContexts[i].context.getId() === contextId) {
						for (j = i; j >= 1; j--) {
							hideContext(underlayContexts[j].context, false);
						}
						underlayContexts.splice(1, i);
						break;
					}
				}
				log("removeDuplicateContextAndPriorHistory", "Exit");
			};

			/**
			 * Maintain a maximum amount of contexts in the stack, to avoid any memory leak
			 * @method maintainContextStack
			 * @private
			 */
			var maintainContextStack = function () {
				log("maintainContextStack", "Enter");
				var i,
					underlayContextsLength = underlayContexts.length,
					context = null;
				if (underlayContextsLength > MAX_CONTEXT_STACK_LENGTH) {
					for (i = 1; i < underlayContextsLength; i++) {
						context = underlayContexts[i].context;
						if (context.isPlayerContext !== true) {
							hideContext(context, false);
							underlayContexts.splice(i, 1);
							break;
						}
					}
				}
				log("maintainContextStack", "Exit");
			};

			/* public API */
			return {
				/**
				 * Indicates caching and loading during UI startup
				 * @property {Number} CACHE_PRE_CACHE
				 * @readonly
				 */
				CACHE_PRE_CACHE: CACHE_PRE_CACHE,
				/**
				 * Indicates caching and loading after UI startup
				 * @property {Number} CACHE_PRE_EMPTIVE_CACHE
				 * @type
				 * @readonly
				 */
				CACHE_PRE_EMPTIVE: CACHE_PRE_EMPTIVE,
				/**
				 * Indicates caching when the context is loaded for the first time
				 * @property {Number} CACHE_LAZY_LOAD
				 * @readonly
				 */
				CACHE_LAZY_LOAD: CACHE_LAZY_LOAD,
				/**
				 * Indicates no caching
				 * @property {Number} CACHE_NO_CACHE
				 * @readonly
				 */
				CACHE_NO_CACHE: CACHE_NO_CACHE,
				/**
				 * Indicates that all pre-emptively cached contexts have loaded and their init methods called.
				 * @property {Number} READY
				 * @readonly
				 */
				READY: READY,
				/**
				 * Indicates contexts are being cached. No applications can be activated at this juncture.
				 * @property {Number} PRE_CACHING
				 * @readonly
				 */
				PRE_CACHING: PRE_CACHING,
				/**
				 * Indicates all contexts have loaded and the default context has been activated
				 * @property {Number} PRE_EMPTIVE_CACHING
				 * @readonly
				 */
				PRE_EMPTIVE_CACHING: PRE_EMPTIVE_CACHING,
				/**
				 * Indicates contexts are being loaded
				 * @property {Number} LOADING
				 * @readonly
				 */
				LOADING: LOADING,
				/**
				 * Returns the status of the ContextManger one of:
				 * `ContextManager.READY`,
				 * `ContextManager.PRE_CACHING`,
				 * `ContextManager.PRE_EMPTIVE_CACHING` or
				 * `ContextManager.LOADING`
				 * @method getStatus
				 * @return {Number} Status
				 */
				getStatus : function () {
					return status;
				},

				/**
				 * Returns an object containing the properties `height` and `width`
				 * representing the current graphics resolution
				 * @method getActiveResolution
				 * @return {Object} graphics mode
				 */
				getActiveResolution : function () {
					return activeResolution;
				},

				/**
				 * Returns the currently active context object representing the
				 * on-screen application
				 * @method getActiveContext
				 * @return {Object} The active Context
				 */
				getActiveContext : function () {
					return activeContext;
				},

				/**
				 * Returns the last navigated context (i.e. the one prior to the active)
				 *
				 * Note: this may be null or non-deterministic since only calls to switch context
				 * record the previous.
				 * @method getLastContext
				 * @return {Object} The last Context
				 */
				getLastContext : function () {
					return lastContext;
				},

				/**
				 * Returns default Context that will be activated once the `ContextManager` becomes ready.
				 * @method getDefaultContext
				 * @return {Object} The default Context
				 */
				getDefaultContext : function () {
					var defCtx = null;
					var i;
					var len = contextList.length;
					for (i = 0; i < len; i++) {
						var ctx = contextList[i];
						if (ctx.isDefault()) {
							defCtx = ctx;
							break;
						}
					}
					return defCtx;
				},

				/**
				 * This method returns the active controller, this being the JavaScript
				 * entry point of an application.
				 * @method getActiveController
				 * @return {Object} Screen controller
				 */
				getActiveController : function () {
					log("getActiveController", "Enter");
					var controller = null;
					if (activeContext) {
						controller = activeContext.getController();
					} else {
						log("getActiveController", "No Active Context", LOG_WARN);
					}
					log("getActiveController", "Controller: " + controller);
					log("getActiveController", "Exit");
					return controller;
				},

				/**
				 * This method returns the DOM object for the active context
				 * @method getActiveContextWindow
				 * @return {Object}
				 */
				getActiveContextWindow : function () {
					log("getActiveContextWindow", "Enter");
					var handle = null;
					if (activeContext) {
						handle = activeContext.getHandle();
					} else {
						log("getActiveContextWindow", "No Active Context", LOG_WARN);
					}
					log("getActiveContextWindow", "Exit");
					return handle;
				},

				/**
				 * Sets the time to wait for Contexts to load before
				 * producing an error
				 * @method setWatchdogTO
				 * @param {Number} timeout Milliseconds
				 */
				setWatchdogTO : function (timeout) {
					watchDog.setWatchdogTO(timeout);
				},

				/**
				 * Sets the time to wait for Contexts to load before
				 * producing an error
				 * @method setDelayWatchdogTO
				 * @param {Number} timeout Milliseconds
				 */
				setDelayWatchdogTO : function (timeout) {
					watchDog.setDelayWatchdogTO(timeout);
				},

				/**
				 * Callback to execute while a context is loading. Useful for showing
				 * feedback to the user that the application is doing something. The callback
				 * returns true if loading is in progress and false if it has finished
				 * @method setContextLoadingCallback
				 * @param {Function} callback
				 */
				setContextLoadingCallback: function (callback) {
					contextLoadingCallback = callback;
				},

				/**
				 * Callback to execute after a pre cache context has been loaded. The callback
				 * returns 2 parameters: the first is the number of contexts that have been loaded and the second
				 * is the total number of pre-cached contexts. These figures can be used to provide visual cues to
				 * the user about client application load status, e.g., a progress bar.
				 * @method setPreCacheProgressCallback
				 * @param {Function} callback
				 */
				setPreCacheProgressCallback: function (callback) {
					preCacheProgressCallback = callback;
				},

				/**
				 * This method initialises the basic objects needed for this class, this method
				 * must be called post instantiation and prior to any other method calls
				 * @method init
				 * @param {Object} resolution Required object with attributes `width` and `height`
				 */
				init: function (resolution) {
					log("init", "Enter");
					watchDog = new WatchDog();
					domAbstraction = ContextManagerHelper.getDomAbstraction();
					if (!resolution) {
						log("init", "No active graphics mode! Graphics mode must be supplied to the ContextManager", LOG_ERROR);
						//activeResolution = ContextManagerHelper.getCCOMActiveGraphicsMode();
					} else {
						activeResolution = resolution;
					}
					// set the current window dimensions according to the supplied resolution
					domAbstraction.setParentSize(activeResolution);

					// insert contexts at position spec'd in doc, if available, otherwise create at end
					contextGroupElem = document.getElementById("_contextGroup_");
					if (!contextGroupElem) {
						var contextElem = document.createElement("g");
						contextElem.setAttribute("id", "_contextGroup_");
						document.documentElement.appendChild(contextElem);
						contextGroupElem = contextElem;
					}
					log("init", "Exit");
				},

				/**
				 * This method creates a Context Object with the given parameters and
				 * makes it known to the Context Manager such that it can be navigated to. The cache
				 * type affects the loading of the context.
				 * @method addContext
				 * @param {String} id Unique identifier for this Context.
				 * @param {String} url Path to application entry page
				 * @param {Number} cacheStrategy Either `ContextManager.CACHE_PRE_CACHE`, `ContextManager.CACHE_PRE_EMPTIVE`,
				 *                           `ContextManager.CACHE_LAZY_LOAD` or `ContextManager.CACHE_NO_CACHE`.
				 * @param {Boolean} isDefault Defines if the Context becomes activate once the Context Manager is ready
				 * @param {Number} x X coordinate of the context on-screen
				 * @param {Number} y Y coordinate of the context on-screen
				 * @param {Number} height
				 * @param {Number} width
				 * @param {String} group Allows context controllers in the same group to implement getAuthenticationStatus methods to pass
				 *							on parental control authentication
				 * @param {String} htmlType changes the HTML Context from iFrames to Divs.
				 *							Either `DIV` or `null`
				 * @param {Boolean} (optional) isPlayerContext true if this is a special playback context and needs to be handled accordingly
				 */
				addContext : function (id, url, cacheStrategy, isDefault, x, y, height, width, group, htmlType, isPlayerContext) {
					log("addContext", "Enter");
					var ctx = getContextById(id);
					if (!ctx) {
						x = x || 0;
						y = y || 0;
						height = height || activeResolution.height;
						width = width || activeResolution.width;
						isPlayerContext = isPlayerContext || false;

						if (cacheStrategy === undefined || cacheStrategy === null) {
							cacheStrategy = CACHE_NO_CACHE;
						}
						log("addContext", "Creating ID: " + id + " Cache: " + String(cacheStrategy) + " URL: " + url);

						var context = new $N.apps.core.Context(id, url, cacheStrategy, isDefault, group, htmlType);

						if (isDefault) {
							var currentDefault = this.getDefaultContext();
								if (currentDefault) {
									currentDefault.setDefault(false);
								}
						}

						context.isPlayerContext = isPlayerContext;
						context.setX(x);
						context.setY(y);
						context.setHeight(height);
						context.setWidth(width);
						contextList.push(context);
					}
					log("addContext", "Exit");
				},

				/**
				 * Initiates the loading of all contexts marked as type `CACHE_PRE_CACHE`.
				 * This method is to be called once all the contexts have be added using the
				 * `addContext` method
				 * @method doPreCache
				 */
				doPreCache : function () {
					log("doPreCache", "Enter");
					status = PRE_CACHING;
					preCachedContexts = getContextCountByCacheType(CACHE_PRE_CACHE);
					cacheContexts(CACHE_PRE_CACHE);
					log("doPreCache", "Exit");
				},

				/**
				 * Allows the given context (represented by its name or URL) to be activated and shown over the
				 * top of the currently active context. Useful for maintaining the state of of the
				 * previous context while temporarily navigating to another. Data can be passed back in the call
				 * back. Classic example of an overlay would be on screen keyboard with input text being passed back
				 * to the main context.
				 * @method overlay
				 * @param {string} cUrlOrName Context Name, or URL of context as returned by `getNavigationLink()`
				 * @param {Object} activationContext Object that can be used to pass initial values into the context
				 * @param {Object} navCompleteCallback Callback to be called once the overlay has been closed
				 * @param {boolean} [hideUnderlays=false] If set to true, the underlying contexts will be hidden
				 */
				overlay : function (cUrlOrName, activationContext, navCompleteCallback, hideUnderlays) {
					var i, cUrl, end;

					log("overlay", "Enter");
					log("overlay", "Status: " + String(status));

					cUrl = getContextUrl(cUrlOrName);

					if (activeContext) {
						if (hideUnderlays) {
							// hide top context
							activeContext.setHiddenBy(getContextByUrl(cUrl));
							hideContext(activeContext, true);
							// hide underlying contexts
							for (i = 0, end = underlayContexts.length; i < end; i++) {
								hideContext(underlayContexts[i].context, true);
							}
						} else {
							activeContext.setHiddenBy(null);
						}
					}

					this.navigate(cUrl, activationContext, navCompleteCallback, true);

					log("overlay", "Exit");
				},

				/**
				 * Dismisses an overlaid context returning control back to the
				 * previous context that was active before the call to `overlay`.
				 * @method popOverlay
				 * @param {Object} callbackData data to be passed to the callback that will be invoked when the context
				 * is dismissed (`navCompleteCallback` parameter passed to `overlay`)
				 * @param {Boolean} [leaveAsPreview=false] If true, leaves the overlaid context as a previewed context
				 */
				popOverlay : function (callbackData, leaveAsPreview) {
					var i;
					log("popOverlay", "Enter");

					if (underlayContexts.length > 0) {
						if (leaveAsPreview) {
							if (previewContext) {
								hideContext(previewContext);
							}
							previewContext = activeContext;
							previewContext.getController().passivate(true);
						} else {
							hideContext(activeContext, isContextDuplicated(activeContext));
						}

						// show underlying contexts
						if (underlayContexts[underlayContexts.length - 1].context.getId() ===  activeContext.getId()) {
							//Bypassing the for loop in case two of the top lying contexts are same.
							domAbstraction.showContextElement(underlayContexts[underlayContexts.length - 1].context.getHandle());
						} else {
							for (i = underlayContexts.length - 1; i >= 0; i--) {
								if (!underlayContexts[i].hiddenById ||  underlayContexts[i].hiddenById === activeContext.getId()) {
									domAbstraction.showContextElement(underlayContexts[i].context.getHandle());
								} else if (underlayContexts[i].hiddenById &&  underlayContexts[i].hiddenById !== activeContext.getId()) {
									break;
								}
							}
						}

						activeContext = underlayContexts.pop().context;
						var currentUnderlay = underlayContexts[underlayContexts.length - 1] || null;
						currLoadingId = currentUnderlay ? currentUnderlay.context._id : null;

						if (activeContext.getController().focus) {
							activeContext.getController().focus();
						}
						if (activeContext.getOverlayClosedCallback()) {
							var callback = activeContext.getOverlayClosedCallback();
							callback(callbackData);
						}
					}
					log("popOverlay", "Exit");
				},

				/**
				 * Begins the process of navigating to the given Context and passivation of the current context.
				 * In other words, switches the focus from one application to another e.g Zapper to Guide. On
				 * successful navigation the given context becomes active and its controller's `activate`
				 * method is called.
				 * The previous context passivates via its controller's `passivate` method.
				 * @method navigate
				 * @param {String} cUrlOrName Context Name, or URL of context as returned by `getNavigationLink()`
				 * @param {Object} activationContext Used to pass values into the context
				 * @param {Function} navCompleteCallback Callback to execute on successful navigate
				 * @param {Boolean} [asOverlay=false] True if you wish to overlay (preferred method is to call `overlay()`)
				 */
				navigate : function (cUrlOrName, activationContext, navCompleteCallback, asOverlay) {
					log("navigate", "Enter");
					log("navigate", "Status: " + String(status));
					var cUrl;
					var performSwitch;
					var me = this;
					cUrl = getContextUrl(cUrlOrName);
					if (cUrl) {
						if (status === READY) {
							var context = getContextByUrl(cUrl);
							if (context) {
								var id = context.getId();
								if (context === previewContext) {
									previewContext = null;
								}
								watchDog.setDelay_watchdog_retries(0); // always reset this.
								log("navigate", "Context=" + id);
								if (!context.getHandle()) {
									log("navigate", "Context (" + id + ") handle not created.");
									resolveContextHandle(context);
								}

								if (asOverlay) {
									var hiddenBy = activeContext.getHiddenBy();
									activeContext.setOverlayClosedCallback(navCompleteCallback);

									if (context.isPlayerContext === true) {
										if (isContextDuplicated(context)) {
											removeDuplicateContextAndPriorHistory(context);
										}
									}

									underlayContexts.push({ context: activeContext,
															hiddenById: hiddenBy ? hiddenBy.getId() : null });
									maintainContextStack();

									var underlayContext = activeContext;
									performSwitch = function () {
										if (underlayContext.getController().defocus) {
											underlayContext.getController().defocus();
										}
										switchContext(null, context, activationContext);
									};
								} else {
									performSwitch = function () {
										me.dismissPreview();
										switchContext(activeContext, context, activationContext);
										if (navCompleteCallback) {
											navCompleteCallback();
										}
									};
								}

								if (context.isLoaded()) {
									currLoadingId = null;
									performSwitch(); //already loaded & initialised, switch the contexts
								} else {
									log("navigate", "Context (" + id + ") URL not loaded (Waiting..)");

									currLoadingId = id;
									// since the call back is asynchronous we need to wait for it to finish loading
									watchDog.setWatchdog_retries(0);
									watchDog.setLoadedCallback(performSwitch);
									watchDog.setFailedCallback(function () {
										clearContext(context);
										contextLoadingCallback(false);
									});
									watchDog.startWatchDog(context, activationContext);
								}
							} else {
								log("navigate", "No such context defined in the system.");
							}
						} else {
							// if we're still loading delay the navigate
							log("navigate", "Pre Caching - Delay the navigate");
							navigatePending(cUrl, function () {
								me.navigate(cUrl, activationContext, navCompleteCallback);
							});
						}
					}
					log("navigate", "Exit");
				},

				/**
				 * Performs (non-overlay) navigation to the registered default context.
				 * @method navigateToDefaultContext
				 * @param {Object} activationContext This object can be used to pass initial values
				 * into the context
				 * @param {Function} navCompleteCallback Callback to execute on successful navigate
				 */
				navigateToDefaultContext : function (activationContext, navCompleteCallback) {
					log("navigateToDefaultContext", "Enter");
					var defaultContext = this.getDefaultContext();
					if (defaultContext) {
						var defaultNavigationLink = this.getNavigationLink(defaultContext.getId());
						if (defaultNavigationLink) {
							this.navigate(defaultNavigationLink, activationContext, navCompleteCallback, false);
						}
					}
					log("navigateToDefaultContext", "Exit");
				},

				/**
				 * Previews the specified context
				 * @method preview
				 * @param {Object} cUrlOrName Context Name, or URL of context as returned by `getNavigationLink()`
				 * @param {Object} activationContext Object that can be used to pass values into the context
				 */
				preview: function (cUrlOrName, activationContext) {
					log("preview", "Enter");
					var cUrl;
					var previewHandle;
					cUrl = getContextUrl(cUrlOrName);
					previewContext = getContextByUrl(cUrl);
					if (previewContext) {
						previewHandle = previewContext.getHandle();
						if (previewContext.getController() && previewContext.getController().preview) {
							previewContext.getController().preview(activationContext);
						}
						domAbstraction.bringContextToTop(previewHandle);
						domAbstraction.showContextElement(previewHandle);
					}
					log("preview", "Exit");
				},

				/**
				 * Dismisses the currently previewing context
				 * @method dismissPreview
				 */
				dismissPreview: function () {
					log("dismissPreview", "Enter");
					if (previewContext) {
						domAbstraction.hideContextElement(previewContext.getHandle());
						if (previewContext.getController().unPreview) {
							previewContext.getController().unPreview();
						}
						previewContext = null;
					}
					log("dismissPreview", "Exit");
				},

				/**
				 * Get the URL for the supplied Context.
				 * @method getNavigationLink
				 * @param {Number} contextId ID of the context that we are retrieving the URL for
				 * @return {String} Context URL
				 */
				getNavigationLink: function (contextId) {
					var context = getContextById(contextId);
					return (context ? context.getUrl() : null);
				},

				/**
				 * Get the base URL for the supplied Context where the index file is running from.
				 * @method getContextBaseURL
				 * @param {Number} contextId ID of the context that we are retrieving the URL for
				 * @return {String} Context URL or null if context is not found
				 */
				getContextBaseURL: function (contextId) {
					var navLink = $N.apps.core.ContextManager.getNavigationLink(contextId);
					if (navLink) {
						return navLink.substring(0, navLink.lastIndexOf("/") + 1);
					}
					return null;
				},

				/**
				 * Restarts the currently active context
				 * @method restartActiveContext
				 * @param {Object} activationContext Object that can be used to pass information into the context
				 */
				restartActiveContext: function (activationContext) {
					activeContext.getController().passivate();
					activeContext.getController().activate(activationContext);
				},

				/**
				 * Called from a screen controller's `init` method. Once a context has completed loading,
				 * either from pre-caching or from navigating (if not cached), it notifies the ContextManager
				 * via this method that the context is loaded and can be navigated to.
				 *
				 * This method also kicks off the pre-emptive caching process once the last pre-cache context
				 * has completed loading.
				 * @method initialisationComplete
				 * @param {Object} screenCtrlObj reference to the screen controller.
				 */
				initialisationComplete : function (screenCtrlObj) {
					log("initialisationComplete", "Enter");
					var context = getContextById(screenCtrlObj.toString());
					if (context) {
						context.setController(screenCtrlObj);
						context.setLoaded(true);
						log("initialisationComplete", "Initialised: " + screenCtrlObj, LOG_INFO);
					} else {
						log("initialisationComplete", "Context for: " + screenCtrlObj + " not found!", LOG_ERROR);
					}
					if (context.getCachingStrategy() === CACHE_PRE_EMPTIVE && isCacheLoadComplete(CACHE_PRE_EMPTIVE)) {
						fireEvent("preEmptiveComplete");
					}
					if (!reloadingContexts) {
						// are we done pre-caching?
						if (status === PRE_CACHING) {
							loadedPreCachedContexts++;
							if (isCacheLoadComplete(CACHE_PRE_CACHE)) {
								status = READY;
								currLoadingId = null;
								fireEvent("preCachingComplete");
								doPreEmptiveCache();
							}
							if (preCacheProgressCallback) {
								preCacheProgressCallback(loadedPreCachedContexts, preCachedContexts);
							}
						}
						if (preEmptiveLoading && context.getCachingStrategy() === CACHE_PRE_EMPTIVE) {
							doPreEmptiveCache();
						}
					} else if (isCacheLoadComplete(CACHE_PRE_CACHE)) {
						status = READY;
						fireEvent("preCachingComplete");
					}
					log("initialisationComplete", "Exit");
				},

				/**
				 * Returns a handle to the currently previewing context if any
				 * @method getPreviewContext
				 * @return {Object} a reference to the Context object that's being previewed,
				 * or null if there are no current previews
				 */
				getPreviewContext: function () {
					return previewContext || null;
				},

				/**
				 * Shows / hides a context. This method does not activate / passivate the specified context.
				 * Hiding a context does not free DOM resources either (if it's a non-cached context).
				 * @method changeVisibility
				 * @param {String} contextUrl context URL
				 * @param {Boolean} [visible=true] if specified and true, shows the context; otherwise, hides it.
				 */
				changeVisibility: function (contextUrl, visible) {
					var context;
					if (contextUrl) {
						context = getContextByUrl(contextUrl);
						if (context) {
							if (visible) {
								domAbstraction.showContextElement(context.getHandle());
							} else {
								hideContext(context, true, true);
							}
						}
					}
				},

				/**
				 * Changes the context identified by contextId to be the default.
				 * @method setDefaultContext
				 * @param {String} contextId
				 */
				setDefaultContext: function (contextId) {
					var newDefault = getContextById(contextId);
					var oldDefault = $N.apps.core.ContextManager.getDefaultContext();
					if (oldDefault && newDefault) {
						oldDefault.setDefault(false);
						newDefault.setDefault(true);
					} else if (newDefault) {
						newDefault.setDefault(true);
					}
				},

				/**
				 * Determines if any context has been overlaid.
				 * @method isOverlayActive
				 * @return {Boolean} True if there currently is an overlay; false otherwise
				 */
				isOverlayActive: function () {
					return (underlayContexts.length > 0);
				},

				/**
				 * Determines if there is a playback context in the stack
				 * @method isPlaybackContextInStack
				 * @return {Boolean} true if there is a playback context; false otherwise
				 */
				isPlaybackContextInStack: function () {
					log("isPlaybackContextInStack", "Enter");
					var i,
						underlayContextsLength = underlayContexts.length,
						context = null;
					for (i = underlayContextsLength - 1; i >= 0; i--) {
						context = underlayContexts[i].context;
						if (context.isPlayerContext === true) {
							log("isPlaybackContextInStack", "Exit returning true");
							return true;
						}
					}
					log("isPlaybackContextInStack", "Exit returning false");
					return false;
				},

				/**
				 * Navigates down to the current playback context in the stack
				 * @method navigateToPlaybackContext
				 */
				navigateToPlaybackContext: function () {
					log("navigateToPlaybackContext", "Enter");
					var i,
						underlayContextsLength = underlayContexts.length,
						context = null;
					if (activeContext.isPlayerContext !== true) {
						hideContext(activeContext, false);
					}
					for (i = underlayContextsLength - 1; i >= 0; i--) {
						context = underlayContexts[i].context;
						if (context.isPlayerContext !== true) {
							hideContext(context, false);
						} else {
							underlayContexts.splice(i, (underlayContextsLength - i));
							break;
						}
					}
					domAbstraction.showContextElement(context.getHandle());
					activeContext = context;
					var currentUnderlay = underlayContexts[underlayContexts.length - 1] || null;
					currLoadingId = currentUnderlay ? currentUnderlay.context._id : null;
					if (activeContext.getController().focus) {
						activeContext.getController().focus();
					}
					log("navigateToPlaybackContext", "Exit");
				},

				/**
				 * Loads the given contexts if they have not been loaded.
				 * @method reloadContexts
				 * @param {Array} contextIds Array of context ids to be loaded
				 */
				reloadContexts: function (contextIds) {
					var i = 0,
						j = 0,
						ctx;
					if (contextList && contextIds) {
						reloadingContexts = true;
						for (j = 0; j < contextIds.length; j++) {
							for (i = 0; i < contextList.length; i++) {
								ctx = contextList[i];
								// loaded i.e no handle
								if (!ctx.isLoaded() && contextIds[j] === ctx.getId()) {
										// create the DOM element hidden.
									createContextElement(ctx, contextGroupElem);
									break;
								}
							}
						}
					}
				},

				/**
				 * Removes all underlay contexts which have previously
				 * been flagged for removal from the stack
				 * @method removeFlaggedContexts
				 * @public
				 */
				removeFlaggedContexts: function () {
					log("removeFlaggedContexts", "Enter");
					underlayContexts.forEach(function (underlayContext, i) {
						if (underlayContext.context.getController()._isFlaggedForRemoval) {
							hideContext(underlayContexts.splice(i, 1)[0].context);
						}
					});
					log("removeFlaggedContexts", "Exit");
				},

				/**
				 * Sets how long (milliseconds) to wait for a context to load before
				 * firing the loadFailure event
				 * @method setContextLoadExpiryTime
				 * @param {Number} timeMs
				 */
				setContextLoadExpiryTime: function (timeMs) {
					contextLoadingExpiryTime = timeMs;
				},

				/**
				 * Registers the listener for the given event
				 * @method addEventListener
				 * @param {Object} event
				 * @param {Object} listener
				 */
				addEventListener: function (event, listener) {
					if (eventListeners[event] === undefined) {
						eventListeners[event] = [];
					}
					eventListeners[event].push(listener);
				},

				/**
				 * Unregisters the listener for the given event
				 * @method removeEventListener
				 * @param {Object} event
				 * @param {Object} listener
				 */
				removeEventListener: function (event, listener) {
					var listeners = eventListeners[event],
						i;
					for (i = 0; i < listeners.length; i++) {
						if (listeners[i] === listener) {
							listeners.splice(i, 1);
						}
					}
				}

				/**
				 * Dispatched when a context fails to load
				 * @event loadFailure
				 */

				/**
				 * Dispatched when the pre cached contexts have finished loading
				 * @event preCachingComplete
				 */

				/**
				 * Dispatched when the pre emptive contexts have finished loading
				 * @event preEmptiveComplete
				 */
			};
		}());
		return $N.apps.core.ContextManager;
	}
);
