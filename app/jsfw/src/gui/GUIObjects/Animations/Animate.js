/**
 * Animate class maps to the Animate tag and holds a
 * reference to a customised mark-up element that can be appended to
 * other mark-up elements dynamically
 *
 * @class $N.gui.Animate
 * @requires $N.apps.core.Log
 * @constructor
 * @param {Object} docRef Document Reference
 * @param {Object} parent The parent class/GUIObject.
 */
define('jsfw/gui/GUIObjects/Animations/Animate',
    [
    'jsfw/apps/core/Log'
    ],
    function (Log) {

		function Animate(docRef, parent) {
			this._log = new $N.apps.core.Log("GUI", "Animate");
			this._id = "";
			this._rootElement = docRef.createElement("animate");
			this._rootElement.setAttribute("attributeType", "auto");
			this._rootElement.setAttribute("attributeName", "opacity");
			this._rootElement.setAttribute("begin", "indefinite");
			this._rootElement.setAttribute("dur", "125ms");
			this._rootElement.setAttribute("fill", "freeze");

			if (parent) {
				parent.addChild(this);
			}
		}

		/**
		 * Sets a callback to run once the animation has ended
		 * @method setAnimationEndCallback
		 * @param {Function} callback The callback to call
		 * @chainable
		 */
		Animate.prototype.setAnimationEndCallback = function (callback) {
			if (callback === null) {
				this._rootElement.removeEventListener("endEvent", this._animationEndCallback, false);
				this._animationEndCallback = null;
			} else {
				this._animationEndCallback = callback;
				this._rootElement.addEventListener("endEvent", this._animationEndCallback, false);
			}
			return this;
		};

		/**
		 * Sets the begin attribute on the Animate mark-up tag
		 * @method setBegin
		 * @param {String} begin The value to set
		 * @chainable
		 */
		Animate.prototype.setBegin = function (begin) {
			this._rootElement.setAttribute("begin", begin);
			return this;
		};

		/**
		 * Sets the from attribute on the Animate mark-up tag
		 * @method setFrom
		 * @param {String} value The value to set
		 * @chainable
		 */
		Animate.prototype.setFrom = function (value) {
			this._rootElement.setAttribute("from", value);
			return this;
		};

		/**
		 * Sets the to attribute on the Animate mark-up tag
		 * @method setTo
		 * @param {string} to The value to set
		 * @chainable
		 */
		Animate.prototype.setTo = function (to) {
			this._rootElement.setAttribute("to", to);
			return this;
		};

		/**
		 * Cancels an animation on the Animate mark-up tag by setting its fill
		 * attribute to "remove" and ending the animation if currently running
		 * @method cancelAnimation
		 */
		Animate.prototype.cancelAnimation = function () {
			this._rootElement.setAttribute("fill", "remove");
			this._rootElement.endElement();
		};

		/**
		 * Sets the dur attribute on the Animate mark-up tag
		 * @method setDuration
		 * @param {String} duration The value to set
		 * @chainable
		 */
		Animate.prototype.setDuration = function (duration) {
			this._rootElement.setAttribute("dur", duration);
			return this;
		};

		/**
		 * Sets the keySplines attribute on the Animate mark-up tag
		 * @method setKeySplines
		 * @param {String} newKeySplines The value to set
		 * @chainable
		 */
		Animate.prototype.setKeySplines = function (newKeySplines) {
			this._rootElement.setAttribute("keySplines", newKeySplines);
			return this;
		};

		/**
		 * Sets the calcMode attribute on the Animate mark-up tag
		 * @method setCalcMode
		 * @param {String} newCalcMode The value to set
		 * @chainable
		 */
		Animate.prototype.setCalcMode = function (newCalcMode) {
			this._rootElement.setAttribute("calcMode", newCalcMode);
			return this;
		};

		/**
		 * Sets the attributeName attribute on the Animate mark-up tag
		 * @method setAttributeName
		 * @param {String} attributeName The value to set
		 * @chainable
		 */
		Animate.prototype.setAttributeName = function (attributeName) {
			this._rootElement.setAttribute("attributeName", attributeName);
			return this;
		};

		/**
		 * Sets the attributeType attribute on the Animate mark-up tag
		 * @method setAttributeType
		 * @param {String} attributeType The value to set
		 * @chainable
		 */
		Animate.prototype.setAttributeType = function (attributeType) {
			this._rootElement.setAttribute("attributeType", attributeType);
			return this;
		};

		/**
		 * Sets the keyTimes attribute on the Animate mark-up tag
		 * @method setKeyTimes
		 * @param {String} times The value to set
		 * @chainable
		 */
		Animate.prototype.setKeyTimes = function (times) {
			this._rootElement.setAttribute("keyTimes", times);
			return this;
		};

		/**
		 * Sets the fill attribute on the AnimateTransform mark-up tag
		 * @method setFill
		 * @param {Object} fill
		 * @chainable
		 */
		Animate.prototype.setFill = function (fill) {
			this._rootElement.setAttribute("fill", fill);
			return this;
		};

		/**
		 * Defines animation values over time
		 * @method setValues
		 * @param values {String} a semicolon-separated list of one or more values
		 * @chainable
		 */
		Animate.prototype.setValues = function (values) {
			this._rootElement.setAttribute('values', values);
			return this;
		};

		/**
		 * Specifies the number of iterations of the animation function
		 * WARNING: setting indefinite will cause lock ups in Ekioh on OTV5
		 * @method setRepeatCount
		 * @param repeat {Mixed} a number or the string 'indefinite'
		 * @chainable
		 */
		Animate.prototype.setRepeatCount = function (repeat) {
			this._rootElement.setAttribute('repeatCount', repeat);
			return this;
		};

		/**
		 * Specifies the number of iterations of the animation function
		 * @method setRepeatDur
		 * @param repeat {Mixed} a number or the string 'indefinite'
		 */
		Animate.prototype.setRepeatDur = function (repeat) {
			this._rootElement.setAttribute('repeatDur', repeat);
			return this;
		};

		/**
		 * Begins the animation
		 * @method animate
		 * @chainable
		 */
		Animate.prototype.animate = function () {
			this._rootElement.beginElement();
			return this;
		};

		/**
		 * Sets the id attribute on the Animate mark-up tag
		 * @method setId
		 * @param {String} newId
		 * @chainable
		 */
		Animate.prototype.setId = function (newId) {
			this._id = newId;
			this._rootElement.setAttribute("id", this._id);
			return this;
		};

		/**
		 * Returns the id of this object and mark-up tag
		 * @method getId
		 * @return {String} The id of this object and mark-up tag
		 */
		Animate.prototype.getId = function () {
			return this._id;
		};

		/**
		 * Returns a reference to the Animate mark-up tag
		 * @method getRootSVGRef
		 * @deprecated use getRootElement
		 * @return {Object} The mark-up Object
		 */
		Animate.prototype.getRootSVGRef = function () {
			return this.getRootElement();
		};

		/**
		 * Returns a reference to the Animate mark-up tag
		 * @method getRootElement
		 * @return {Object} The mark-up Object
		 */
		Animate.prototype.getRootElement = function () {
			return this._rootElement;
		};

		/**
		 * Takes an object and calls the mutator methods
		 * on the Animate Object that correspond to the given attributes
		 * @method configure
		 * @param {Object} params The object that contains configuration parameters
		 * @chainable
		 */
		Animate.prototype.configure = function (params) {
			var name = "";
			var setter;

			for (name in params) {
				if (params.hasOwnProperty(name)) {
					setter = "set" + name.substr(0, 1).toUpperCase() + name.substr(1);
					if (!this[setter]) {
						this._log("configure", "configure failed, no method " + setter + " for " + name);
					}
					this[setter](params[name]);
				}
			}
			return this;
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.Animate = Animate;
		return Animate;
    }
);
