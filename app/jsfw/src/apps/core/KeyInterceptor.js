/**
 * Intercepts keypress events and passes translated key constants to the active controller.
 * Interceptors may be registered to consume the event, in which case the key code will not be propagated
 * to the controller. Interceptors are useful for specifying global key handling behaviour.
 * Controllers must implement the `keyPressed` function in order to receive key events from
 * this class, see the `keyPressed` function for more details.
 * @class $N.apps.core.KeyInterceptor
 * @requires $N.apps.core.Log
 * @author Mark Brown
 */

define('jsfw/apps/core/KeyInterceptor',
	[
		'jsfw/apps/core/Log'
	],
	function (Log) {
		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.core = $N.apps.core || {};
		$N.apps.core.KeyInterceptor = (function () {

			var log = new $N.apps.core.Log("INPUT", "KeyInterceptor"),
				interceptors = [],
				keyMap = null,
				keyListener,
				keyRepeatSuppressMS = null,
				KEY_UP_SUFFIX = "_rel",
				KEY_UP_EVENT = "keyup";

			function callListeners(keyDesc) {
				for (i = (interceptors.length - 1); i >= 0; i--) {
					if (interceptors[i].interceptor.call(interceptors[i].callFunc, keyDesc)) {
						log("keypressed", "Intercepted By: " + interceptors[i]);
						return true;
					}
				}
				return false;
			}

			//public API
			return {
				/**
				 * Sets up the key interceptor to receive keys pressed in the implementing application.
				 * The DOM keydown event is listened out for on the document element. If a defaultKeyHandler
				 * function is passed in, it is called provided it has not been overridden by a subsequent
				 * registration.  The `defaultKeyMap` is used if the platform and platformVariant variables
				 * cannot be resolved to find the correct keymap object.  For example if the platform is
				 * "Pace" and the platform variant is "UPC", the init method will attempt to instantiate a key
				 * map object of type "KeyMap_Pace_UPC", failing which it will try to fall back to "KeyMap_Pace".
				 * @method init
				 * @param {Object} defaultKeyMap generally an instance of the BaseKeyMap class
				 * @param {Function} defaultKeyHandler the main function to be run on key down
				 * @param {String} platform name of the system manufacturer
				 * @param {String} platformVariant name of the system manufacturer model
				 * @param {Number} keySuppressMS time in milliseconds to allow background tasks to process
				 * @param {Boolean} listenForKeyUpEvent NOTE: This is not supported with the key suppress. Every keyup event will be fired to the application
				 */
				init: function (defaultKeyMap, defaultKeyHandler, platform, platformVariant, keySuppressMS, listenForKeyUpEvent) {
					var me = this;
					keyMap = null;
					interceptors = [];
					keyListener = function (e) {
						me.keyPressed(e);
					};

					if (keySuppressMS) {
						keyRepeatSuppressMS = keySuppressMS;
					}

					// remove spaces and special characters
					if (platform && typeof platform === 'string') {
						platform = platform.replace(/[ |\-]/g, "");
					}

					var keyMapName = "KeyMap_" + platform + "_" + platformVariant;
					if (!window[keyMapName] && (!$N || !$N.platform || !$N.platform.input || !$N.platform.input[keyMapName])) {
						log("init", "No keymap found for platform: " + platform + " platformVariant: " + platformVariant, "warn");
						keyMapName = "KeyMap_" + platform;
					}
					if (window[keyMapName]) {
						keyMap = new window[keyMapName]();
					} else if ($N && $N.platform && $N.platform.input && $N.platform.input[keyMapName]) {
						keyMap = new $N.platform.input[keyMapName]();
					} else if (defaultKeyMap) {
						log("init", "No keymap found for platform: " + platform, "warn");
						if (defaultKeyMap) {
							log("init", "No keymap found, using default keymap", "warn");
							keyMap = defaultKeyMap;
						} else {
							log("init", "No default key map available, native keycodes will be used", "warn");
						}
					}
					if (defaultKeyHandler) {
						this.registerInterceptor(defaultKeyHandler, this);
					}
					//register the main key down event to catch the keys
					document.addEventListener("keydown", keyListener, false);

					if (listenForKeyUpEvent) {
						document.addEventListener(KEY_UP_EVENT, keyListener, false);
					}

				},
				/**
				 * Triggers a key event based on the Android remote key press
				 * @method androidKeyEvent
				 * @param {Number} androidKey Android key code - event.getKeyCode()
				 */
				androidKeyEvent: function (androidKey) {
					log('Android keyHandler', '- Dispatching Key Event');
				    var androidEvent = document.createEvent('KeyboardEvent');
				    Object.defineProperty(androidEvent, 'keyCode', {
						get : function() {
						    return this.keyCodeVal;
						}
				    });
				    Object.defineProperty(androidEvent, 'which', {
				        get : function() {
				            return this.keyCodeVal;
				        }
				    });
				    if (androidEvent.initKeyboardEvent) {
				        androidEvent.initKeyboardEvent("keydown", true, true, document.defaultView, false, false, false, false, androidKey, androidKey);
				    } else {
				        androidEvent.initKeyEvent("keydown", true, true, document.defaultView, false, false, false, false, androidKey, 0);
				    }
				    androidEvent.keyCodeVal = androidKey;
				    document.dispatchEvent(androidEvent);
				},
				/**
				 * Returns the active key map object.  This allows applications
				 * to access the properties of the key map to query the key code
				 * descriptions rather than using key codes directly.
				 * @method getKeyMap
				 * @return {Object} the active keymap (a class that implements the `BaseKeyMap` class)
				 */
				getKeyMap: function () {
					return keyMap;
				},
				/**
				 * Global key-handler function.
				 * All keypresses are delegated to the registered interceptors in
				 * reverse order to how they were added.  If a defaultKeyHandler was
				 * passed in on the init (which it should be) this is the last registered key-handler to be run.
				 *
				 * @method keyPressed
				 * @param {Event} e the DOM key event (passed by the container via the "onkeydown" event)
				 * @return {Boolean} true if the key was handled, false if it wasn't.
				 */
				keyPressed: function (e) {
					if (navigator.userAgent && navigator.userAgent.indexOf('Android') === -1) {
						e.preventDefault();
					}
					var keyval = e.keyCode || e.which,
						keyDesc =  keyMap ? keyMap.getKey(Math.floor(keyval)) : null,
						i = 0;
					log("keypressed", " - keyval = " + keyval + ", keyDesc = " + keyDesc);

					if (e.type === KEY_UP_EVENT && keyDesc) {
						keyDesc += KEY_UP_SUFFIX;
						callListeners(keyDesc);
						return true;
					} else if (e.type !== KEY_UP_EVENT) {
						if (keyRepeatSuppressMS) {
						 	document.removeEventListener("keydown", keyListener, false);
							setTimeout(function () {
								document.addEventListener("keydown", keyListener, false);
							}, keyRepeatSuppressMS);
						}
						return callListeners(keyDesc || keyval);
					}
					return false;
				},
				/**
				 * Registers an object to receive key events before the currently active screen.
				 * Interceptors must be functions which take the string
				 * description of the key pressed and return a boolean value indicating whether
				 * the key has been consumed.
				 * @method registerInterceptor
				 * @param {Function} interceptorFn a function to receive the key presses
				 * @param {Object} callingContext a reference back to the object containing the interceptor
				 */
				registerInterceptor: function (interceptorFn, callingContext) {
					log("registerInterceptor", "New Interceptor Added");
					interceptors.push({interceptor: interceptorFn, callFunc: callingContext});
				},
				/**
				 * Unregisters an object for key interception events which was previously
				 * registered using `registerInterceptor(...)`
				 * @method unregisterInterceptor
				 * @param {Function} interceptor
				 */
				unregisterInterceptor: function (interceptor) {
					var i;
					for (i = 0; i < interceptors.length; i++) {
						log("unregisterInterceptor", "Key Interceptor Removed");
						if (interceptors[i].interceptor === interceptor) {
							interceptors.splice(i, 1);
							break;
						}
					}
				}
			};

		}());
		return $N.apps.core.KeyInterceptor;
	}
);