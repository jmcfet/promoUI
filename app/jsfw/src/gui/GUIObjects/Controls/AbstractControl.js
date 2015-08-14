/**
 * AbstractControl is an abstract class that is the parent class for
 * all complex controls.  The class defines properties and methods that
 * allow controls to be added to forms, enabled and disabled, maintain
 * a number of properties that define the tab behaviour. This class
 * should not be instantiated directly but instead should be called
 * by the constructor of a subclass.
 * @class $N.gui.AbstractControl
 * @extends $N.gui.GUIObject
 *
 * @requires $N.gui.GUIObject
 * @requires $N.gui.Util
 *
 * @author mbrown
 * @constructor
 * @param {Object} docRef document element of the page
 */
define('jsfw/gui/GUIObjects/Controls/AbstractControl',
    [
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/GUIObject'
    ],
    function (Util, GUIObject) {

		function AbstractControl(docRef) {

			AbstractControl.superConstructor.call(this, docRef);

			this._nextTabKeys = null;
			this._previousTabKeys = null;
			this._nextTabObject = null;
			this._previousTabObject = null;
			this._enabled = true;
			this._highlightedCallback = null;
		}

		$N.gui.Util.extend(AbstractControl, $N.gui.GUIObject);

		var proto = AbstractControl.prototype;

		/**
		 * Returns a object from an array of strings where the strings inside
		 * the array form the properties and value of the return object.
		 * @method _createObjectFromArray
		 * @private
		 * @param {Array} arrayObj
		 * @return {Object}
		 */
		proto._createObjectFromArray = function (arrayObj) {
			var returnObj = {}, i;
			for (i = 0; i < arrayObj.length; i++) {
				returnObj[arrayObj[i]] = arrayObj[i];
			}
			return returnObj;
		};

		/**
		 * Returns true such that all instances of an AbstractControl
		 * know they are a control
		 * @method isControl
		 * @return {Boolean}
		 */
		proto.isControl = function () {
			return true;
		};

		/**
		 * Returns true if this control is enabled, false otherwise
		 * @method isEnabled
		 * @return {Boolean}
		 */
		proto.isEnabled = function () {
			return this._enabled;
		};

		/**
		 * Sets the enabled property of the Control to true
		 * @method enable
		 */
		proto.enable = function () {
			this.setEnabled(true);
			return this;
		};

		/**
		 * Sets the enabled property of the Control to false
		 * @method disable
		 */
		proto.disable = function () {
			this.setEnabled(false);
			return this;
		};

		/**
		 * Enables or disables the control using the given flag
		 * true for enable and false for disable
		 * @method setEnabled
		 * @param {Boolean} flag
		 */
		proto.setEnabled = function (flag) {
			if (typeof flag === "string") {
				flag = (flag === "true") ? true : false;
			}
			if (flag) {
				this.showEnabled();
			} else {
				this.showDisabled();
			}
			this._enabled = Boolean(flag);
			return this;
		};

		/**
		 * Takes a string of comma separated keys constants e.g. up,down,left
		 * and converts it to an object (see _createObjectFromArray) or takes
		 * an object with property names matching the key constants and sets
		 * the _nextTabKeys property of this class that object
		 * @method setNextTabKeys
		 * @param {Object} keyObject
		 */
		proto.setNextTabKeys = function (keyObject) {
			if (typeof keyObject === "string") {
				this._nextTabKeys = this._createObjectFromArray(keyObject.split(","));
			} else {
				this._nextTabKeys = keyObject;
			}
			return this;
		};

		/**
		 * Takes a string of comma separated keys constants e.g. up,down,left
		 * and converts it to an object (see _createObjectFromArray) or takes
		 * an object with property names matching the key constants and sets
		 * the _previousTabKeys property of this class that object
		 * @method setPreviousTabKeys
		 * @param {Object} keyObject
		 */
		proto.setPreviousTabKeys = function (keyObject) {
			if (typeof keyObject === "string") {
				this._previousTabKeys = this._createObjectFromArray(keyObject.split(","));
			} else {
				this._previousTabKeys = keyObject;
			}
			return this;
		};

		/**
		 * Returns the object that holds 1 or more properties matching key
		 * constants for a next tab, or null if none have been set.
		 * @method getNextTabKeys
		 * @return {Object}
		 */
		proto.getNextTabKeys = function () {
			return this._nextTabKeys;
		};

		/**
		 * Returns the object that holds 1 or more properties matching key
		 * constants for a previous tab, or null if none have been set.
		 * @method getPreviousTabKeys
		 * @return {Object}
		 */
		proto.getPreviousTabKeys = function () {
			return this._previousTabKeys;
		};

		/**
		 * Sets the id of the next object that should be tabbed to if
		 * this control is in a form.
		 * @method setNextTabObject
		 * @param {String} tabObject
		 */
		proto.setNextTabObject = function (tabObject) {
			this._nextTabObject = tabObject;
			return this;
		};

		/**
		 * Sets the id of the previous object that should be tabbed to if
		 * this control is in a form.
		 * @method setPreviousTabObject
		 * @param {String} tabObject
		 */
		proto.setPreviousTabObject = function (tabObject) {
			this._previousTabObject = tabObject;
			return this;
		};

		/**
		 * Returns the id of the next object that will be tabbed to from
		 * this object or null if not set
		 * @method getNextTabObject
		 * @return {String}
		 */
		proto.getNextTabObject = function () {
			return this._nextTabObject;
		};

		/**
		 * Returns the id of the previous object that will be tabbed to from
		 * this object or null if not set
		 * @method getPreviousTabObject
		 * @return {String}
		 */
		proto.getPreviousTabObject = function () {
			return this._previousTabObject;
		};

		/**
		 * Sets the behaviour of the button when highlighted,
		 * the passed in callback will be executed, behaviour can be
		 * cleared by passing null.
		 * @method setHighlightedCallback
		 * @param {Function} callback
		 */
		proto.setHighlightedCallback = function (callback) {
			this._highlightedCallback = callback;
			return this;
		};

		/**
		 * Abstract to be overridden in concrete implementation
		 * @method highlight
		 */
		proto.highlight = function () {
		};

		/**
		 * Abstract to be overridden in concrete implementation
		 * @method unHighlight
		 */
		proto.unHighlight = function () {
		};

		/**
		 * Abstract to be overridden in concrete implementation
		 * @method showDisabled
		 */
		proto.showDisabled = function () {
		};

		/**
		 * Abstract to be overridden in concrete implementation
		 * @method showEnabled
		 */
		proto.showEnabled = function () {
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.AbstractControl = AbstractControl;
		return AbstractControl;
	}
);