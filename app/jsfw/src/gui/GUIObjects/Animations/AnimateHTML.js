/**
 * AnimateHTML class uses `setInterval` to perform a transformation
 * on a GUIObject. If an animation is called whilst an animation of the same type (fade, move, scale, etc)
 * is already playing on the GUIObject, the animation is instantly completed so the next can play.
 * @class $N.gui.AnimateHTML
 * @constructor
 * @param {Object} guiObject The gui object that we wish to perform a move animation on
 * @param {String} attribute The attribute which is to be animated on
 */

define('jsfw/gui/GUIObjects/Animations/AnimateHTML',
    [],
    function () {

		function AnimateHTML(guiObject, attribute) {
			this._ANIMATIONS_PER_SECOND = 20;
			this._guiObject = guiObject;
			this._animationInterval = null;
			this._attribute = attribute;
			this._resetFunction = function () {};
			this._animID = AnimateHTML._ID_COUNTER++;
		}

		AnimateHTML._ID_COUNTER = 0;
		AnimateHTML._animationQTO = null;
		AnimateHTML._animationQ = {};
		/**
		 * Time in milliseconds after which to process the CSS animation queue
		 * @property QUEUE_DELAY
		 * @static
		 */
		AnimateHTML.QUEUE_DELAY = 20;
		/**
		 * Boolean flag to enable/disable CSS3 animations, false will default back to timeouts
		 * @property
		 * @static
		 */
		AnimateHTML.USE_CSS3 = true;

		/**
		 * Performs a transformation to the given x and y coordinates
		 * @method _move
		 * @private
		 * @param {Object} x
		 * @param {Object} y
		 * @param {Object} is3DAnimation
		 */
		AnimateHTML.prototype._move = function (x, y, is3DAnimation) {
			if (is3DAnimation) {
				this._transform3D(x, y);
			} else {
				this._transform(x, y);
			}
		};

		AnimateHTML.prototype.setId = function () {};

		/**
		 * Function to call once an animation has completed or if you wish to finish the animation.
		 * Use for animations using timers not CSS animation
		 * @method _completeAnimation
		 * @private
		 * @param {Function} animation Function to run that will put GUI Object in its final state
		 */
		AnimateHTML.prototype._completeAnimation = function (animFunction) {
			clearInterval(this._animationInterval);
			this._animationInterval = null;
			animFunction();
			this.animatedCallback();
		};

		/**
		 * Calculates the correct duration in milliseconds
		 * @method _calculateDuration
		 * @private
		 */
		AnimateHTML.prototype._calculateDuration = function () {
			var duration;
			if (this._guiObject.getAnimationDuration().toLowerCase().indexOf("ms") !== -1) {
				duration = parseFloat(this._guiObject.getAnimationDuration());
			} else {
				duration = parseFloat(this._guiObject.getAnimationDuration()) * 1000;
			}
			if (this._bounce) {
				duration /= 2;
			}
			return duration;
		};

		/**
		 * Sets up the call backs for repeat animations
		 * @method _setupRepeatMoveAnimation
		 * @private
		 */
		AnimateHTML.prototype._setupRepeatMoveAnimation = function (fromX, fromY, toX, toY, is3DAnimation, repeat, bounce) {
			var me = this;
			this._repeat = repeat;
			this._bounce = bounce;
			if (repeat && bounce) {
				this.bounceDirection = 1;
				this._repeatFunction = function () {
					if (me.bounceDirection === 0) {
						me._animatedMove(fromX, fromY, toX, toY, is3DAnimation);
						me.bounceDirection = 1;
					} else {
						me._animatedMove(toX, toY, fromX, fromY, is3DAnimation);
						me.bounceDirection = 0;
					}
				};
			} else if (repeat) {
				this._repeatFunction = function () {
					me._animatedMove(fromX, fromY, toX, toY, is3DAnimation);
				};
			} else {
				this._repeatFunction = null;
			}
			this._resetFunction = function () {
				me._move(fromX, fromY, is3DAnimation);
			};
		};

		/**
		 * Performs a move animation using CSS3 transforms and transitions
		 * @method _animatedCSSMove
		 * @private
		 * @param {Number} fromX
		 * @param {Number} fromY
		 * @param {Number} toX
		 * @param {Number} toY
		 * @param {Boolean} is3DAnimation true if you wish to perform a translate3D transformation
		 */
		AnimateHTML.prototype._animatedCSSMove = function (fromX, fromY, toX, toY, is3DAnimation) {
			var me = this,
				duration = this._calculateDuration() + "ms",
				ended = function () {
					me._guiObject.getRootElement().removeEventListener("webkitTransitionEnd", ended, false);
					me._guiObject.getRootElement().removeEventListener("oTransitionEnd", ended, false);
					me.animatedCallback();
				};
			if (AnimateHTML._animationQTO) {
				clearTimeout(AnimateHTML._animationQTO);
			}
			this._guiObject.getRootElement().style["-webkit-transition-duration"] = null;
			this._guiObject.getRootElement().style["transitionDuration"] = null;
			this._move(fromX, fromY, is3DAnimation);

			AnimateHTML._animationQ["" + this._animID] = function () {
				me._guiObject.getRootElement().addEventListener("webkitTransitionEnd", ended, false);
				me._guiObject.getRootElement().addEventListener("oTransitionEnd", ended, false);
				me._guiObject.getRootElement().style["-webkit-transition-duration"] = duration;
				me._guiObject.getRootElement().style["transitionDuration"] = duration;
				me._move(toX, toY, is3DAnimation);
			};

			AnimateHTML._animationQTO = setTimeout(function () {
				for (var e in AnimateHTML._animationQ) {
					if (AnimateHTML._animationQ.hasOwnProperty(e)) {
						AnimateHTML._animationQ[e]();
						delete AnimateHTML._animationQ[e];
					}
				}
			}, AnimateHTML.QUEUE_DELAY);
		};

		/**
		 * Private version of animated move
		 * @method _animatedMove
		 * @private
		 * @param {Number} fromX
		 * @param {Number} fromY
		 * @param {Number} toX
		 * @param {Number} toY
		 * @param {Boolean} is3DAnimation true if you wish to perform a translate3D transformation
		 */
		AnimateHTML.prototype._animatedMove = function (fromX, fromY, toX, toY, is3DAnimation) {
			var xIncrement,
				yIncrement,
				currentX,
				currentY,
				step,
				totalSteps,
				duration = this._calculateDuration(),
				me = this;

			if (AnimateHTML.USE_CSS3) {
				this._animatedCSSMove(fromX, fromY, toX, toY, is3DAnimation);
				return;
			}
			if (this._animationInterval) {
				this._completeAnimation(function () {
					me._move(fromX, fromY, is3DAnimation);
				});
			}
			totalSteps = Math.round(this._ANIMATIONS_PER_SECOND / (1000 / duration));
			totalSteps = totalSteps === 0 ? 1 : totalSteps;
			xIncrement = (toX - fromX) / totalSteps;
			yIncrement = (toY - fromY) / totalSteps;
			currentX = fromX;
			currentY = fromY;
			step = 0;
			this._animationInterval = setInterval(function () {
				if (step === totalSteps) {
					me._completeAnimation(function () {
						me._move(toX, toY, is3DAnimation);
					});
				} else {
					currentX = parseFloat(currentX) + parseFloat(xIncrement);
					currentY = parseFloat(currentY) + parseFloat(yIncrement);
					me._move(currentX, currentY, is3DAnimation);
				}
				step++;
			}, duration / totalSteps);
		};

		/**
		 * Performs an animated move on the gui object
		 * @method animatedMove
		 * @param {Number} fromX
		 * @param {Number} fromY
		 * @param {Number} toX
		 * @param {Number} toY
		 * @param {Boolean} is3DAnimation true if you wish to perform a translate3D transformation
		 * @param {Boolean} repeat whether the animation should repeat
		 * @param {Boolean} bounce whether the animation should reverse
		 */
		AnimateHTML.prototype.animatedMove = function (fromX, fromY, toX, toY, is3DAnimation, repeat, bounce) {
			this._setupRepeatMoveAnimation(fromX, fromY, toX, toY, is3DAnimation, repeat, bounce);
			this._animatedMove(fromX, fromY, toX, toY, is3DAnimation);
		};

		/**
		 * Sets the duration of the animation
		 * @method setDuration
		 * @param {String} duration
		 */
		AnimateHTML.prototype.setDuration = function (duration) {
			if (duration.toLowerCase().indexOf("ms") !== -1) {
				this._duration = parseFloat(duration);
			} else {
				this._duration = parseFloat(duration) * 1000;
			}
		};

		/**
		 * Performs an attribute animation using CSS3 and transitions
		 * @method _doCSSAnimation
		 * @private
		 */
		AnimateHTML.prototype._doCSSAnimation = function (from, to) {
			var me = this,
				duration = this._calculateDuration() + "ms",
				ended = function () {
					me._guiObject.getRootElement().removeEventListener("webkitTransitionEnd", ended, false);
					me._guiObject.getRootElement().removeEventListener("oTransitionEnd", ended, false);
					me.animatedCallback();
				};
			if (AnimateHTML._animationQTO) {
				clearTimeout(AnimateHTML._animationQTO);
			}
			this._guiObject.getRootElement().style["-webkit-transition-duration"] = null;
			this._guiObject.getRootElement().style["transitionDuration"] = null;
			this._animation(from);

			AnimateHTML._animationQ["" + this._animID] = function () {
				me._guiObject.getRootElement().addEventListener("webkitTransitionEnd", ended, false);
				me._guiObject.getRootElement().addEventListener("oTransitionEnd", ended, false);
				me._guiObject.getRootElement().style["-webkit-transition-duration"] = duration;
				me._guiObject.getRootElement().style["transitionDuration"] = duration;
				me._animation(to);
			};

			AnimateHTML._animationQTO = setTimeout(function () {
				for (var e in AnimateHTML._animationQ) {
					if (AnimateHTML._animationQ.hasOwnProperty(e)) {
						AnimateHTML._animationQ[e]();
						delete AnimateHTML._animationQ[e];
					}
				}
			}, AnimateHTML.QUEUE_DELAY);
		};

		/**
		 * Performs the animation for scaling or an attribute (height, width, opacity)
		 * @method _doAnimation
		 * @private
		 * @param {Number} from
		 * @param {Number} to
		 */
		AnimateHTML.prototype._doAnimation = function (from, to) {
			var increment,
				current,
				step,
				totalSteps,
				duration = this._calculateDuration(),
				me = this;

			if (AnimateHTML.USE_CSS3) {
				this._doCSSAnimation(from, to);
				return;
			}

			if (this._animationInterval) {
				this._completeAnimation(function () {
					me._animation(from);
				});
			}
			totalSteps = Math.round(this._ANIMATIONS_PER_SECOND / (1000 / duration));
			totalSteps = totalSteps === 0 ? 1 : totalSteps;
			increment = (to - from) / totalSteps;
			current = from;
			step = 0;
			this._animationInterval = setInterval(function () {
				if (step === totalSteps) {
					me._completeAnimation(function () {
						me._animation(to);
					});
				} else {
					current = parseFloat(current) + parseFloat(increment);
					me._animation(current);
				}
				step++;
			}, duration / totalSteps);
		};

		/**
		 * Sets up the call backs for repeat animations
		 * @method _setupRepeatAnimation
		 * @private
		 */
		AnimateHTML.prototype._setupRepeatAnimation = function (from, to, repeat, bounce) {
			var me = this;
			this._repeat = repeat;
			this._bounce = bounce;
			if (repeat && bounce) {
				this.bounceDirection = 1;
				this._repeatFunction = function () {
					if (me.bounceDirection === 0) {
						me._doAnimation(to, from);
						me.bounceDirection = 1;
					} else {
						me._doAnimation(from, to);
						me.bounceDirection = 0;
					}
				};
			} else if (repeat) {
				this._repeatFunction = function () {
					me._doAnimation(from, to);
				};
			} else {
				this._repeatFunction = null;
			}
			this._resetFunction = function () {
				me._animation(from);
			};
		};

		/**
		 * Performs an animated scale on the gui object
		 * @method animatedScale
		 * @param {Number} from
		 * @param {Number} to
		 * @param {Boolean} repeat whether the animation should repeat
		 * @param {Boolean} bounce whether the animation should reverse
		 */
		AnimateHTML.prototype.animatedScale = function (from, to, repeat, bounce) {
			var me = this;
			this._animation = function (toValue) {
				me._updateWebkitTransform("scale", toValue);
			};
			this._setupRepeatAnimation(from, to, repeat, bounce);
			this._doAnimation(from, to);
		};

		/**
		 * Performs an animation on the gui object of its attribute type
		 * @method animatedAttribute
		 * @param {Number} from
		 * @param {Number} to
		 * @param {Boolean} repeat whether the animation should repeat
		 * @param {Boolean} bounce whether the animation should reverse
		 */
		AnimateHTML.prototype.animatedAttribute = function (from, to, repeat, bounce) {
			var me = this;
			this._animation = function (toValue) {
				me._guiObject.getRootElement().style[me._attribute] = toValue;
			};
			this._setupRepeatAnimation(from, to, repeat, bounce);
			this._doAnimation(from, to);
		};

		/**
		 * Runs the animated callback function
		 * @method animatedCallback
		 */
		AnimateHTML.prototype.animatedCallback = function () {
			if (this._repeatFunction) {
				this._repeatFunction();
			}
			if (this._animatedCallback) {
				this._animatedCallback();
			}
		};

		/**
		 * Sets the animated callback to run once animation has completed
		 * @method setAnimatedCallback
		 * @param {Function} callback The callback to run
		 */
		AnimateHTML.prototype.setAnimationEndCallback = function (callback) {
			this._animatedCallback = callback;
		};

		/**
		 * Updates the -webkit-transform style for the given attribute (scale, translate) with the given value
		 * @method _updateWebkitTransform
		 * @private
		 * @param {String} attribute
		 * @param {String} value
		 */
		AnimateHTML.prototype._updateWebkitTransform = function (attribute, value) {
			var transformNames = ["-webkit-transform", "-o-transform"],
				transforms,
				transformsArray = [],
				i,
				tmpArray = [],
				newTransformString = "";
			for (j = 0; j < transformNames.length; j++) {
				transforms = this._guiObject.getRootElement().style[transformNames[j]];
				if (transforms && transforms !== "") {
					if (transforms.indexOf(attribute) === -1) {
						this._guiObject.getRootElement().style[transformNames[j]] += attribute + "(" + value + ")";
					} else {
						transformsArray = transforms.split(")");
						for (i = 0; i < transformsArray.length; i++) {
							tmpArray = transformsArray[i].split("(");
							transformsArray[i] = {
								attribute: tmpArray[0].replace(/^\s+|\s+$/g, ''), //trim
								value: tmpArray[1]
							};
							if (transformsArray[i].attribute === attribute) {
								transformsArray[i].value = value;
							}
							if (transformsArray[i].value) {
								newTransformString += transformsArray[i].attribute + "(" + transformsArray[i].value + ")";
							}
						}
						this._guiObject.getRootElement().style[transformNames[j]] = newTransformString;
					}
				} else {
					this._guiObject.getRootElement().style[transformNames[j]] = attribute + "(" + value + ")";
				}
			}
		};

		/**
		 * Performs the transformation to the given x and y co-ordinates
		 * @method _transform
		 * @private
		 * @param {Number} x
		 * @param {Number} y
		 */
		AnimateHTML.prototype._transform = function (x, y) {
			this._guiObject.getRootElement().style.OTransform = "translate(" + x + "px," + y + "px)";
			this._updateWebkitTransform("translate", x + "px," + y + "px");
		};

		/**
		 * Performs a 3D transformation to the given x and y co-ordinates
		 * @method _transform3D
		 * @private
		 * @param {Number} x
		 * @param {Number} y
		 */
		AnimateHTML.prototype._transform3D = function (x, y) {
			this._guiObject.getRootElement().style.OTransform = "translate(" + x + "px," + y + "px)";
			this._updateWebkitTransform("translate3d", x + "px," + y + "px,0px");
		};

		/**
		 * Returns true if the animation is a repeat animation
		 * @method isRepeat
		 * @return {Boolean}
		 */
		AnimateHTML.prototype.isRepeat = function () {
			return this._repeat || false;
		};

		/**
		 * Restarts the animation if it was set up as a repeat animation and was
		 * previously cancelled
		 * @method restartAnimation
		 */
		AnimateHTML.prototype.restartAnimation = function () {
			this._repeatFunction();
		};

		/**
		 * Cancels an animation and reverts the object to it's original location
		 * @method cancelAnimation
		 */
		AnimateHTML.prototype.cancelAnimation = function () {
			var me = this;
			if (this._animationInterval) {
				clearInterval(this._animationInterval);
				this._animationInterval = null;
				this._resetFunction();
				this._guiObject.move(this._guiObject.getX(), this._guiObject.getY());
			} else if (AnimateHTML.USE_CSS3) {
				delete AnimateHTML._animationQ[this._animID];
				this._guiObject.getRootElement().style["-webkit-transition-duration"] = null;
				this._guiObject.getRootElement().style["transitionDuration"] = null;
				this._resetFunction();
			}
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.AnimateHTML = AnimateHTML;
		return AnimateHTML;
    }
);