/**
 * This is a simple implementation of a logging mechanism that has
 * been abstracted to use CCOM's log methods for SVG, and console.log for
 * HTML. By instantiating this class you get a function back that
 * when called will output the debug to the console in the given
 * module and class contexts. For example, you could log context
 * management using a `moduleContext` of 'core' and `classContext` of
 * 'ContextManager'.
 *
 * @class $N.apps.core.Log
 * @author mbrown
 * @constructor
 * @param moduleContext The module context.
 * @param classContext The class context.
 * @return {Function} See the `log` method below
 */

/*global navigator,console*/
define('jsfw/apps/core/Log',
    ['jsfw/apps/util/Util'],
	function (Util) {
		window.$N = $N || {};

		if (!window.console) { //fix for IE
			window.console = {
				log: function () {}
			};
		}

		var mode = navigator.userAgent.indexOf("Ekioh") > -1 ? "SVG" : "HTML",
			domAbstraction = {
				SVG: {
					/**
					* Logs a message to the logger.
					* @method log
					* @param {String} method The name of the calling method.
					* @param {String} message The log message.
					* @param {String} type The logging level.
					*
					*		var log = new $N.apps.core.Log("LOG CONTEXT", "APP CONTEXT");
					*		log("Method Name", "Debug Message", "debug");
					*/
					log: function (logContext, appContext, method, message, type) {
						/*global alert: false */
						alert(logContext + "[" + appContext + "." + method + "] " + message);
						/*global alert: true */
					}
				},
				HTML: {
					//No need to YUIDoc as it is taken care of in the SVG abstraction
					log: function (logContext, appContext, method, message, type) {
						if ($N.apps.log4javascript) {
							$N.apps.log4javascript[type](logContext, "[" + appContext + "." + method + "] " + message);
						} else {
							console.log(logContext + " [" + appContext + "." + method + "] " + message);
						}
					}
				}
			}[mode];

		function Log(moduleContext, classContext) {
			return function (method, message, type) {
				if (!type) {
					type = "debug";
				}
				if (Log.Config.isLogToBeOutput(moduleContext, classContext, method, type)) {
					domAbstraction.log(moduleContext, classContext, method, message, type);
				}
			};
		}

		/**
		 * Constant to denote a logged error message
		 * @property {String} LOG_ERROR
		 * @static
		 * @readonly
		 */
		Log.LOG_ERROR = "error";

		/**
		 * Constant to denote a logged warning message
		 * @property {String} LOG_WARN
		 * @static
		 * @readonly
		 */
		Log.LOG_WARN = "warn";

		/**
		 * Constant to denote a logged debug message
		 * @property {String} LOG_DEBUG
		 * @static
		 * @readonly
		 */
		Log.LOG_DEBUG = "debug";

		/**
		 * Constant to denote a logged information message
		 * @property {String} LOG_INFO
		 * @static
		 * @readonly
		 */
		Log.LOG_INFO = "info";

		/**
		 * This config object allows an application to disable / enable logging
		 * and can configure which modules / classes / methods should be logged.
		 * The logging can be configured by passing a JSON object to the
		 * $N.apps.core.Log.Config.configure method such as
		 *
		 *     $N.apps.core.Log.Config.configure({
		 *         enableLogging: true,
		 *         defaultValues: 1,
		 *         loggingLevels: {error: 1, warn: 1, debug: 1, info: 1 },
		 *         moduleLogging: {System: 1, btv: 0, ZAPPER: 1},
		 *         classLogging: {zapperView: 1, STB: 0, Network: 0},
		 *         methodLogging: {activate: 1, passivate: 0}
		 *     });
		 *
		 * By default all modules, classes and methods will output logs when
		 * `enableLogging` is set to true. The module / class / method Logging methods
		 * allow the apps to disable / enable specific modules / classes / methods logging.
		 *
		 * When `defaultValues` is set to 0, no modules / classes / methods will be logged
		 * except for those passed into the set logging methods with a value of 1.
		 * When the defaultValues is set to 1, all modules / classes / methods will be logged
		 * except for those passed into the set logging methods with a value of 0.
		 * @property {Object} Config
		 * @static
		 */
		Log.Config = {

			isEnabled: true,
			defaultValues: 1,
			loggingLevels: {
				error: 1,
				warn: 1,
				debug: 1,
				info: 1
			},
			moduleLogging: {},
			classLogging: {},
			methodLogging: {},

			_isLevelEnabled: function (level) {
				if ((this.defaultValues === 1 && (this.loggingLevels[level] === 1 || this.loggingLevels[level] === undefined)) || (this.defaultValues === 0 && this.loggingLevels[level] === 1)) {
					return true;
				}
				return false;
			},

			/**
			 * Enables logging if true is passed in and disables logging if false is passed in
			 * @method setEnableLogging
			 * @param {Boolean} enabled if true, enables logging
			 */
			setEnableLogging: function (enabled) {
				this.isEnabled = enabled;
			},

			/**
			 * Sets the default logging behaviour to include all modules / classes / methods if set to 1,
			 * or to ignore all as default if set to 0
			 * @method setDefaultValues
			 * @param {Number} defaultVal 0 or 1
			 *
			 */
			setDefaultValues: function (defaultVal) {
				this.defaultValues = defaultVal;
			},

			/**
			 * Sets the logging levels to be included or ignored
			 * @method setLoggingLevels
			 * @param {Object} levels Object consisting of the following properties:
			 * @param {Number} levels.error
			 * @param {Number} levels.warn
			 * @param {Number} levels.debug
			 * @param {Number} levels.info
			 * Set the value to 1 to include and 0 to ignore. If not set, the default value is used
			 * By default all logging levels are enabled:
			 *		$N.apps.core.Log.Config.setLoggingLevels({error: 1, warn: 0, debug: 1, info: 0});
			 */
			setLoggingLevels: function (levelsObj) {
				this.loggingLevels = levelsObj;
			},

			/**
			 * Sets the modules to ignore/include when logging.
			 * @method setModuleLogging
			 * @param {Object} moduleObj Object consisting of properties which are Module names
			 * that contain a value of 0 or 1. 0 will disable the logging for that module.
			 *		$N.apps.core.Log.Config.setModuleLogging({ZAPPER: 0, btv: 0, System: 1});
			 */
			setModuleLogging: function (moduleObj) {
				this.moduleLogging = moduleObj;
			},

			/**
			 * Sets the classes to ignore/include when logging.
			 * @method setClassLogging
			 * @param {Object} classObj Object consisting of properties which are Class names
			 * that contain a value of 0 or 1. 0 will disable the logging for that class.
			 *		$N.apps.core.Log.Config.setModuleLogging({zapperView: 0, EPG: 0, STB: 1});
			 */
			setClassLogging: function (classObj) {
				this.classLogging = classObj;
			},

			/**
			 * Sets the methods to ignore/include when logging.
			 * @method setMethodLogging
			 * @param {Object} methodObj Object consisting of properties which are Method names
			 * that contain a value of 0 or 1. 0 will disable the logging for that method.
			 *		$N.apps.core.Log.Config.setModuleLogging({activate: 0, passivate: 0, registerListener: 1});
			 */
			setMethodLogging: function (methodObj) {
				this.methodLogging = methodObj;
			},

			/**
			 * Takes an object and calls the setter methods
			 * that correspond to the given attributes
			 * @method configure
			 * @param {Object} confObj The object that contains configuration parameters.
			 *		$N.apps.core.Log.Config.configure({
			 *			enableLogging: true,
			 *			defaultValues: 1,
			 *			loggingLevels: {warn: 1, debug: 1, error: 1, info: 0},
			 *			moduleLogging: {System: 1, btv: 0, ZAPPER: 1},
			 *			classLogging: {zapperView: 1, STB: 0, Network: 0},
			 *			methodLogging: {activate: 1, passivate: 0}
			 *		});
			 */
			configure: function (confObj) {
				var setMethod,
					e = null;
				for (e in confObj) {
					if (confObj.hasOwnProperty(e)) {
						setMethod = this["set" + $N.apps.util.Util.upcaseFirstLetter(e)];
						if (setMethod) {
							setMethod.call(this, confObj[e]);
						} else {
							throw ("Log.Config configure - no setter method for attribute " + e);
						}
					}
				}
			},

			/**
			 * Determines if the logs should be sent to the output for the specified module / class / method/level
			 * @method isLogToBeOutput
			 * @private
			 * @param {String} logModule
			 * @param {String} logClass
			 * @param {String} logMethod
			 * @param {String} level
			 * @return {Boolean} True if the log should be output; false if not
			 */
			isLogToBeOutput: function (logModule, logClass, logMethod, level) {
				if (this.isEnabled && this._isLevelEnabled(level)) {
					if (this.defaultValues === 0) {
						if ((this.moduleLogging[logModule] === 1 && this.classLogging[logClass] !== 0 && this.methodLogging[logMethod] !== 0) ||
								(this.classLogging[logClass] === 1 && this.classLogging[logMethod] !== 0) || this.methodLogging[logMethod] === 1) {
							return true;
						}
					} else if ((this.moduleLogging[logModule] === undefined || this.moduleLogging[logModule] === 1) && (this.classLogging[logClass] === undefined || this.classLogging[logClass] === 1) &&
							(this.methodLogging[logMethod] === undefined || this.methodLogging[logMethod] === 1)) {
						return true;
					}
				}
				return false;
			}
		};

		$N.apps = $N.apps || {};
		$N.apps.core = $N.apps.core || {};
		$N.apps.core.Log = Log;
		return Log;
	}
);
