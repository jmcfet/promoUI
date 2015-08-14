/**
 * AnimTransform class maps to the AnimateTransform element and holds a
 * reference to a customised mark-up element that can be appended to
 * other mark-up elements dynamically.
 * @class $N.gui.AnimTransform
 * @constructor
 * @param {Object} docRef The document reference.
 * @param {Object} parent The parent class/GUIObject.
 */

define('jsfw/gui/GUIObjects/Animations/AnimTransform',
    [],
    function () {

		function AnimTransform(docRef, parent) {
			docRef = docRef || document;

			this._id = "";
			this._animationEndCallback = null;

			this._rootElement = docRef.createElement("animateTransform");
			this._rootElement.setAttribute("attributeType", "XML");
			this._rootElement.setAttribute("attributeName", "transform");
			this._rootElement.setAttribute("begin", "indefinite");
			this._rootElement.setAttribute("dur", "250ms");
			this._rootElement.setAttribute("fill", "freeze");
			this._rootElement.setAttribute("additive", "replace");
			this._rootElement.setAttribute("repeatCount", "1");
			this._rootElement.setAttribute("type","translate");
			if (parent) {
				parent.addChild(this);
			}
		}

		/**
		 * Sets the behaviour that should occur when the animation id finished
		 * @method setAnimationEndCallback
		 * @param {Function} callback a function definition
		 */
		AnimTransform.prototype.setAnimationEndCallback = function (callback) {
			if (callback === null) {
				this._rootElement.removeEventListener("endEvent", this._animationEndCallback, false);
				this._animationEndCallback = null;
			} else {
				if (this._animationEndCallback) {
					this._rootElement.removeEventListener("endEvent", this._animationEndCallback, false);
				}
				this._animationEndCallback = callback;
				this._rootElement.addEventListener("endEvent", this._animationEndCallback, false);
			}
		};

		/**
		 * Sets the mark-up additive attribute of the animation
		 * @method setAdditive
		 * @param {String} additive
		 */
		AnimTransform.prototype.setAdditive = function (additive) {
			this._rootElement.setAttribute("additive", additive);
			return this;
		};

		/**
		 * Sets the begin attribute on the AnimateTransform mark-up tag
		 * @method setBegin
		 * @param begin {string}
		 */
		AnimTransform.prototype.setBegin = function (begin) {
			this._rootElement.setAttribute("begin", begin);
		};

		/**
		 * Sets the attributeName attribute on the AnimateTransform mark-up tag
		 * @method setAttributeName
		 * @param attributeName {string}
		 */
		AnimTransform.prototype.setAttributeName = function (attributeName) {
			this._rootElement.setAttribute("attributeName", attributeName);
		};

		/**
		 * Sets the type attribute on the AnimateTransform mark-up tag
		 * @method setType
		 * @param type {string}
		 * @return {Object} A reference to AnimTransform (this).
		 */
		AnimTransform.prototype.setType = function (type) {
			this._rootElement.setAttribute("type", type);
			return this;
		};

		/**
		 * Sets the to attribute on the AnimateTransform mark-up tag
		 * @method setTo
		 * @param to {string}
		 */
		AnimTransform.prototype.setTo = function (to) {
			this._rootElement.setAttribute("to", to);
		};

		/**
		 * Sets the from attribute on the AnimateTransform mark-up tag
		 * @method setFrom
		 * @param from {string}
		 */
		AnimTransform.prototype.setFrom = function (from) {
			this._rootElement.setAttribute("from", from);
		};

		/**
		 * Sets the duration attribute on the AnimateTransform mark-up tag
		 * @method setDuration
		 * @param duration {string}
		 * @return {Object} A reference to AnimTransform (this).
		 */
		AnimTransform.prototype.setDuration = function (duration) {
			this._rootElement.setAttribute("dur", duration);
			return this;
		};

		/**
		 * Sets the values attribute on the AnimateTransform mark-up tag
		 * @method setValues
		 * @param {Object} values
		 */
		AnimTransform.prototype.setValues = function (values) {
			this._rootElement.setAttribute("values", values);
		};

		/**
		 * Sets the fill attribute on the AnimateTransform mark-up tag
		 * @method setFill
		 * @param {Object} fill
		 */
		AnimTransform.prototype.setFill = function (fill) {
			this._rootElement.setAttribute("fill", fill);
		};

		/**
		 * Sets the repeatCount attribute on the AnimateTransform mark-up tag
		 * WARNING: setting indefinite will cause lock ups in Ekioh on OTV5
		 * @method setRepeatCount
		 * @param {String} repeatCount
		 */
		AnimTransform.prototype.setRepeatCount = function (repeatCount) {
			this._rootElement.setAttribute("repeatCount", repeatCount);
		};

		/**
		 * Sets the keyTimes attribute on the Animate mark-up tag
		 * @method setKeyTimes
		 * @param {String} times The value to set
		 * @chainable
		 */
		AnimTransform.prototype.setKeyTimes = function (times) {
			this._rootElement.setAttribute("keyTimes", times);
			return this;
		};

		/**
		 * Sets the keySplines attribute on the Animate mark-up tag
		 * @method setKeySplines
		 * @param {String} newKeySplines The value to set
		 * @chainable
		 */
		// NETUI-2928: Non-linear animation support (function copied from Animate.js)
		AnimTransform.prototype.setKeySplines = function (newKeySplines) {
			this._rootElement.setAttribute("keySplines", newKeySplines);
			return this;
		};

		/**
		 * Sets the calcMode attribute on the Animate mark-up tag
		 * @method setCalcMode
		 * @param {String} newCalcMode The value to set
		 * @chainable
		 */
		// NETUI-2928: Non-linear animation support (function copied from Animate.js)
		AnimTransform.prototype.setCalcMode = function (newCalcMode) {
			this._rootElement.setAttribute("calcMode", newCalcMode);
			return this;
		};

		/**
		 * Stores and sets the id attribute on the AnimateTransform mark-up tag
		 * @method setId
		 * @param newId {String}
		 */
		AnimTransform.prototype.setId = function (newId) {
			this._id = newId;
			this._rootElement.setAttribute("id", this._id);
		};

		/**
		 * Begins the animation
		 * @method animate
		 */
		AnimTransform.prototype.animate = function () {
			this._rootElement.beginElement();
		};

		/**
		 * Returns the id of this object and mark-up tag
		 * @method getId
		 * @return {string}
		 */
		AnimTransform.prototype.getId = function () {
			return this._id;
		};

		/**
		 * Returns a reference to the AnimationTransform mark-up tag
		 * @method getRootSVGRef
		 * @deprecated use getRootElement
		 * @return {SVGObject}
		 */
		AnimTransform.prototype.getRootSVGRef = function () {
			return this.getRootElement();
		};

		/**
		 * Returns a reference to the AnimationTransform mark-up tag
		 * @method getRootElement
		 * @return {Object}
		 */
		AnimTransform.prototype.getRootElement = function () {
			return this._rootElement;
		};

		/**
		 * Cancels an animation on the Animate mark-up tag by setting its fill
		 * attribute to "remove" and ending the animation if currently running
		 * @method cancelAnimation
		 */
		AnimTransform.prototype.cancelAnimation = function () {
			this._rootElement.setAttribute("fill", "remove");
			this._rootElement.endElement();
		};

		/**
		 * Takes an object e.g. {x:5, y:10} and calls the mutator methods
		 * on the GUIObject that correspond to the given attributes
		 * @method configure
		 * @param {Object} confObj The object that contains configuration parameters
		 */
		AnimTransform.prototype.configure = function (confObj) {
		    var setMethod;
			var e = null;

		    for (e in confObj) {
				if (confObj.hasOwnProperty(e)) {
			        setMethod = this["set" + $N.gui.Util.upcaseFirstLetter(e)];
			        if (setMethod) {
			            setMethod.call(this, confObj[e]);
			        } else {
			            throw ("AnimTransform configure - no setter method for attribute " + e);
			        }
		        }
		    }
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.AnimTransform = AnimTransform;
		return AnimTransform;
    }
);
