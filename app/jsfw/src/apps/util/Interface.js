/**
 * Provides an extension allowing Java-style interfaces to be defined.
 *
 * A simple array of strings could be used to define an interface although extending the JavaScript language can cause some
 * very hard-to-trace bugs. By wrapping this functionality in a class we can strictly validate all arguments.
 *
 * Usage: Define the interface with a valid name and a list of expected method names:
 *
 *     var MyInterface = new $N.apps.util.Interface("MyInterface", ["myMethod01", "myMethod02", ...]);
 *
 * In the class constructor, call
 *
 *     $N.apps.util.Interface.ensureImplements(this, MyInterface);
 *
 * This can be also be used for abstract classes. Just ensure that the abstract class does not provide a concrete
 * realisation of any of the methods in its interface. e.g.
 *
 *     var abstractMethods = new $N.apps.util.Interface("MyObjAbstractMethods", ["method01", "method02", ...]);
 *
 * @class $N.apps.util.Interface
 * @constructor
 * @param {String} name Name of the interface
 * @param {Array} methods an array of method names that comprise the interface
 */

define('jsfw/apps/util/Interface',
	[],
	function () {
		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.util = $N.apps.util || {};

		$N.apps.util.Interface = (function () {

			/**
			 * Create an interface class and associate it with its methods.
			 *
			 * @method interfaceClass
			 * @private
			 * @param {String} name Name of the interface class.
			 * @param {Object} methods Object containing the class methods.
			 */
			var interfaceClass = function (name, methods) {
				// Valid interface/method names are any string of alphanumeric characters including underscores (\w), dollars
				// and hyphens
				var regExp = /[\w$\-]+/;
				var i = 0;
				var len;

				if (arguments.length !== 2) {
					throw new Error("Interface constructor called with " + String(arguments.length) + " arguments, but expected " +
									"exactly 2.");
				}
				if (typeof name !== "string" || !regExp.test(name)) {
					throw new Error("Argument 'name' must be a valid string representing a JavaScript identifier. " +
									"name=" + name);
				}
				/*
				 * (methods instanceof Array) won't work for Arrays that were created in a different context (or window),
				 * so we have to use the following code. See http://javascript.crockford.com/remedial.html for more details.
				 */
				if (typeof methods !== 'object' && methods.length && typeof methods.length !== 'number') {
					throw new Error("Argument 'methods' must be an array. typeof methods=" + typeof methods);
				}
				if (!methods.length) {
					throw new Error("At least 1 method must be defined in Methods");
				}

				this.name = name;
				this.methods = [];
				for (i = 0, len = methods.length; i < len; i++) {
					//Match method names with any alphanumeric characters including underscores (\w), dollars and hyphens
					if (typeof methods[i] !== 'string' || !regExp.test(methods[i])) {
						throw new Error("Interface method names must be strings repesenting valid JavaScript identifers. " +
										"method[" + String(i) + "]=" + methods[i]);
					}
					this.methods.push(methods[i]);
				}
			};

			/**
			 * Ensures the supplied object implements the supplied interfaces.
			 *
			 * @method ensureImplements
			 *
			 * @param object {Object} The object to be inspected.
			 * @param interfaceList {Object} A comma separated list of interfaces.
			 */
			/*
			TODO: Code review: Would probably be clearer if the interfaceList argument was either an Interface or an array rather than
			 * a comma separated list
			 */
			interfaceClass.ensureImplements = function (object, interfaceList) {
				var i = 0;
				var j = 0;
				var len;
				var methodsLen;
				var method = null;

				if (arguments.length < 2) {
					throw new Error("Interface.ensureImplements called with " + String(arguments.length) + " arguments, but expected " +
									"at least 2.");
				}
				for (i = 1, len = arguments.length; i < len; i++) {
					interfaceList = arguments[i];
					if (interfaceList.constructor !== interfaceClass) {
						throw new Error("Interface.ensureImplements expects arguments two and above to be instances of " +
										"Interface.");
					}

					for (j = 0, methodsLen = interfaceList.methods.length; j < methodsLen; j++) {
						method = interfaceList.methods[j];
						if (!object[method] || typeof object[method] !== 'function') {
							throw new Error("Error: The Object passed to ensureImplements does not implement the " +
											interfaceList.name + " interface correctly: Method " + method + " was not found. " +
											"This could be due to calling 'new' on an abstract class");
						}
					}
				}
			};

			$N.apps.util.Interface = interfaceClass;

			return interfaceClass;
		}());
		return $N.apps.util.Interface;
	}
);