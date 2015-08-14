/**
 * ScrollingLabel creates an auto scrolling text label.
 * Text will only scroll when it is larger than the width of the ScrollingLabel.  The height of the component
 * is not necessary as the component will auto configure itself to accomodate for the height of the text font.
 *
 * Example mark-up definition:
 *
 *     <nagra:scrollingLabel id="myLabel" x="100" y="450" width="300" fontSize="20" duration="5s" bounce="true" />
 *
 * The text of the ScrollingLabel is set via the setText method.  Scrolling will commence whenever
 * the ScrollingLabel contains text which is larger than its width.  The auto scrolling can be suppressed when
 * invoking the setText method by passing true to suppressStart (under this situation, the scrolling motion is
 * explicitly invoked by calling the `start` method.  The stop method is used to stop the scroll
 * animation.
 *
 * The behaviour of the motion is configured using the `setBounce` and `setDuration` methods.
 *
 * A bouncing effect (default behaviour) or a continuous motion can be achieved using the `setBounce` method.
 * When bouncing, the text scrolls to the end, and then scrolls in the opposite direction to return to its original
 * position (this is repeated indefinitely).  During continuous motion, the text wraps itself and continuously scrolls
 * to the left.
 *
 * The duration of the animation is controlled using the `setDuration` method, which allows the duration
 * to apply to the whole text string or on a 'per character' basis.  When scrolling with a 'per character' behaviour,
 * the scroll speed is consistent across varying lengths of string, whereas the default behaviour causes the scrolling
 * to increase in speed if the contained text is larger, so that the overall duration of the movement is the same
 * regardless of the text string length.
 *
 * @class $N.gui.ScrollingLabel
 * @extends $N.gui.AbstractComponent
 *
 * @requires $N.gui.ClippedGroup
 * @requires $N.gui.Group
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @requires $N.gui.AbstractComponent
 * @requires $N.gui.GUIObject
 *
 * @author dthomas
 * @constructor
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */
define('jsfw/gui/GUIObjects/Controls/ScrollingLabel',
    [
    'jsfw/gui/GUIObjects/Components/ClippedGroup',
    'jsfw/gui/GUIObjects/Components/Group',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Components/AbstractComponent',
    'jsfw/gui/GUIObjects/GUIObject'
    ],
    function (ClippedGroup, Group, Label, Util, AbstractComponent, GUIObject) {

    	(function ($N) {

			var domAbstraction = {
				SVG: {
					createElement: function (docRef) {
						return docRef.createElement("tspan");
					}
				}
			}[$N.gui.GUIObject.mode];


			function ScrollingLabelSpan(docRef, parent) {

				var element =  domAbstraction.createElement(docRef);
				this._rootElement = element;
				this._innerElement = element;

				this._text = "";
				this._textOverflow = "none";
				this._alignment = ScrollingLabelSpan.ALIGN_LEFT;

				if (parent) {
					parent.addChild(this);
				}
			}

			$N.gui.Util.extend(ScrollingLabelSpan, $N.gui.Label);

			var proto = ScrollingLabelSpan.prototype;

			$N.gui = $N.gui || {};
			$N.gui.ScrollingLabelSpan = ScrollingLabelSpan;
		}($N || {}));

		function ScrollingLabel(docRef, parent) {

			ScrollingLabel.superConstructor.call(this, docRef);

			this._container = new $N.gui.ClippedGroup(docRef);
			this._content = new $N.gui.Group(docRef, this._container);
			this._label = new $N.gui.Label(docRef, this._content);
			this._textElement = this._label;
			if ($N.gui.GUIObject.mode === "SVG") {
				this._label._rootElement.setAttribute("x", 0);
				this._textElement = new $N.gui.ScrollingLabelSpan(docRef, this._label);
			}

			this._rootElement = this._container.getRootElement();
			this._innerElement = this._label.getRootElement();

			if (parent) {
				parent.addChild(this._container);
			}

			// default values & local references
			this._moveAnim = null;
			this._text = "";
			this._textLength = 0;
			this._duration = "3s";
			this._durationPerCharacter = false;
			this._bounce = true;
			this._isTextOverflow = false;
			this._alignment = $N.gui.Label.ALIGN_LEFT;
			this._padding = false;
			this._isFirstLoop = true;
		}

		$N.gui.Util.extend(ScrollingLabel, $N.gui.AbstractComponent);

		/**
		 * Sets the width of the ScrollingLabel element.
		 * @method setWidth
		 * @param {Number} width The width of the ScrollingLabel.
		 */
		ScrollingLabel.prototype.setWidth = function (width) {
			this._container.setWidth(width);
			//this._label.setWidth(width); currently removed as no scroll happens
		};

		/**
		 * Sets the movement behaviour of the text to a bouncing motion or continuous.
		 * This will remove the padding bounce is set to true.
		 * @method setBounce
		 * @param {Boolean} bounce If true, the label will bounce, else the label will show continuous motion.
		 */
		ScrollingLabel.prototype.setBounce = function (bounce) {
			if (bounce === true || bounce === 'true') {
				this._bounce = true;
				this._padding = false;
			} else {
				this._bounce = false;
			}
			this.stop();
		};

		/**
		 * Sets the movement behaviour of the text to a bouncing motion or continuous.
		 * This will remove the bounce if padding is set to true.
		 * @method setBounce
		 * @param {Boolean} bounce If true, the label will bounce, else the label will show continuous motion.
		 */
		ScrollingLabel.prototype.setPadding = function (padding) {
			if (padding === true || padding === 'true') {
				this._padding = true;
				this._bounce = false;
			} else {
				this._padding = false;
			}
			this.stop();
		};

		/**
		 * Sets the text within the ScrollingLabel.  If the text is larger than the scrollingLabel,
		 * it will start scrolling unless you specify that the start should be suppressed.
		 * @method setText
		 * @param {String} text The text string.
		 * @param {Boolean} suppressStart If true, the label will NOT automatically start scrolling.
		 */
		ScrollingLabel.prototype.setText = function (text, suppressStart) {
			this._text = text;
			this._textElement.setText(text);
			this._textLength = this._textElement.getTextLength();
			this._content.setX(0);
			this._adjustContainer();
			if (this._moveAnim && this._durationPerCharacter) {
				this._moveAnim.setDuration(this.getDuration());
			}
			this.stop();
			if (suppressStart !== true) {
				this.start();
			}
		};

		/**
		 * Sets the font size of the text within the ScrollingLabel.
		 * @method setFontSize
		 * @param {Number} fontSize The size of the font.
		 */
		ScrollingLabel.prototype.setFontSize = function (fontSize) {
			this._textElement.setFontSize(fontSize);
			this._adjustContainer();
		};

		/**
		 * Sets the CSS style of the text.
		 * @method setCssStyle
		 * @deprecated use setCssClass
		 * @param cssStyle
		 */
		ScrollingLabel.prototype.setCssStyle = function (cssStyle) {
			this._textElement.setCssStyle(cssStyle);
			this._adjustContainer();
		};

		/**
		 * Sets the CSS class of the text.
		 * @method setCssClass
		 * @param cssClass
		 */
		ScrollingLabel.prototype.setCssClass = function (cssClass) {
			this._textElement.setCssClass(cssClass);
			this._refresh();
			this._adjustContainer();
		};

		/**
		 * Sets the CSS class of the content group.
		 * @method setContentCssClass
		 * @param cssClass
		 */
		ScrollingLabel.prototype.setContentCssClass = function (cssClass) {
			this._content.setCssClass(cssClass);
		};

		/**
		 * Sets the duration of the scroll animation for the ScrollingLabel.
		 * For example; "3s" - 3 seconds, "250ms" -250 milliseconds
		 * You can optionally specify whether the animation should be an absolute
		 * value for the whole text, or if it's per character.
		 * @method setDuration
		 * @param {String} duration The duration of the scroll animation.
		 * @param {Boolean} perCharacter If true, the duration is per character.
		 */
		ScrollingLabel.prototype.setDuration = function (duration, perCharacter) {
			this._duration = duration;
			this._durationPerCharacter = perCharacter;
			this._initialiseAnimation();
		};

		/**
		 * Returns the width of the ScrollingLabel element.
		 * @method getWidth
		 * @return {Number} The width of the ScrollingLabel.
		 */
		ScrollingLabel.prototype.getWidth = function () {
			return this._container.getWidth();
		};

		/**
		 * Returns the true width of the ScrollingLabel element.
		 * @method getTrueWidth
		 * @return {Number} The true width of the ScrollingLabel.
		 */
		ScrollingLabel.prototype.getTrueWidth = function () {
			return this._container.getTrueWidth();
		};

		/**
		 * Returns the current text of the ScrollingLabel.
		 * @method getText
		 * @return {String} The label text.
		 */
		ScrollingLabel.prototype.getText = function () {
			return this._text;
		};

		/**
		 * Returns the current font size of the ScrollingLabel.
		 * @method getFontSize
		 * @return {Number} The font size.
		 */
		ScrollingLabel.prototype.getFontSize = function () {
			return this._textElement.getFontSize();
		};

		/**
		 * Returns the current height of the ScrollingLabel.
		 * @method getHeight
		 * @return {Number} The current height.
		 */
		ScrollingLabel.prototype.getHeight = function () {
			return this._textElement.getHeight();
		};

		/**
		 * Returns the current scroll animation duration.
		 * @method getDuration
		 * @return {String} The animation duration.
		 */
		ScrollingLabel.prototype.getDuration = function () {
			if (this._durationPerCharacter) {
				var duration = this._duration;
				var ind = duration.indexOf('m');
				if (ind < 0) {
					ind = duration.indexOf('s');
				}
				var num = duration.substring(0, ind);
				var unit = duration.substring(ind, this._duration.length);
				var dif;
				// if continuous motion then need to use the full text width
				if (this._bounce) {
					dif = this._textLength - this.getWidth();
				} else if (this._padding && !this._isFirstLoop) {
					dif = this._textLength + this.getWidth();
				} else {
					dif = this._textLength;
				}
				var mul = dif / this.getFontSize();
				return String(num * mul) + unit;
			}
			return this._duration;
		};

		/**
		 * Starts the animation or restarts it if it is already running.
		 * If it has not already been initialised during the setting of
		 * the duration, then it will be initialise using the default duration.
		 * @method start
		 */
		ScrollingLabel.prototype.start = function () {
			this._moveAnim = null;
			this._initialiseAnimation();
			this._isFirstLoop = true;
			// start animation if content requires it
			if (this._textLength > this._container.getWidth()) {
				// adjust the text of the label depending on whether continuous motion is required
				this._textElement.setText(this._bounce || this._padding ? this._text : this._text + " " + this._text);
				var me = this;
				this._moveAnim.setAnimationEndCallback(function () {
					if (me._isFirstLoop && me._padding) {
						me._isFirstLoop = false;
						me._content.setAnimationDuration(me.getDuration());
					}
					me._animationEndCallback();
				});
				this._animationEndCallback();
			}
		};

		/**
		 * Requests the animated move
		 * @method _doMove
		 * @private
		 * @param {Number} x
		 * @param {Number} y
		 */
		ScrollingLabel.prototype._doMove = function (x, y) {
			if ($N.gui.GUIObject.mode === "SVG") {
				this._label.doAttributeAnimation("x", x);
			} else {
				this._content.doMove(x, y);
			}
		};

		/**
		 * Stops the scroll animation at the end of its current cycle.
		 * @method stop
		 */
		ScrollingLabel.prototype.stop = function () {
			// stop the animation if it has been defined
			if (this._moveAnim) {
				this._moveAnim.setAnimationEndCallback(null);
				this._doMove(0, 0);
				this._content.setX(0);
				// if not bouncing, set the text back to a single instance
				if (!this._bounce && !this._padding) {
					this._textElement.setText(this._text);
				}
			}
		};

		/**
		 * Refreshes DOM values after a change in CSS styling.
		 * @method _refresh
		 * @private
		 */
		ScrollingLabel.prototype._refresh = function () {
			this._textElement.setText(this._text);
			this._textLength = this._textElement.getTextLength();
			if (this._moveAnim && this._durationPerCharacter) {
				this._moveAnim.setDuration(this.getDuration());
			}
		};

		/**
		 * Returns boolean indicating whether text length exceeds container width.
		 * @method isTextOverflow
		 */
		ScrollingLabel.prototype.isTextOverflow = function () {
			if (this._textLength > (this._container.getWidth())) {
				return true;
			}
			return false;
		};

		/**
		 * Initialises the animation by creating an animate element using the passed duration.
		 * @method _initialiseAnimation
		 * @private
		 */
		ScrollingLabel.prototype._initialiseAnimation = function () {
			if ($N.gui.GUIObject.mode === "SVG") {
				this._label.setAnimationDuration(this.getDuration());
				if (this._moveAnim === null) {
					this._label.addAttributeAnimation("x");
					this._moveAnim = this._label._attributeAnim["x"];
					this._moveAnim.setAttributeType("XML");
				}
			} else {
				this._content.setAnimationDuration(this.getDuration());
				if (this._moveAnim === null) {
					this._content.addMoveAnimation();
					this._moveAnim = this._content._moveAnim;
				}
			}
		};

		/**
		 * Call back method at end of animation cycle.  Changes direction of the animation.
		 * @method _animationEndCallback
		 * @private
		 */
		ScrollingLabel.prototype._animationEndCallback = function () {
			var endX;
			var width = this._container.getWidth();
			var movingElement = ($N.gui.GUIObject.mode === "SVG") ? this._label : this._content;
			if (this._bounce) {
				if (movingElement.getX() === 0) {
					endX = (width - this._textLength) / this.resolutionVerticalFactor;
				} else {
					endX = 0;
				}
			} else if (this._padding && !this._isFirstLoop) {
				endX = -this._textLength;
				movingElement.setX(this.getWidth());
			} else {
				endX = -this._textLength;
				this._content.setX(0);
			}
			this._doMove(endX, 0);
		};

		/**
		 * Adjusts the height of the container and the position of the inner Label,
		 * depending on the font size.
		 * @method _adjustContainer
		 * @private
		 */
		ScrollingLabel.prototype._adjustContainer = function () {
			var height = Math.round(this._textElement.getHeight() / this.resolutionVerticalFactor);
			if ($N.gui.GUIObject.mode === "SVG") {
				this._container.setHeight(height);
				this._label.setY(Math.round(height * 0.72));
			} else {
				this._container.setHeight(height + Math.ceil(this.getFontSize() / 9));
			}
			this._textLength = this._textElement.getTextLength();
		};

		/**
		 * Returns the ScrollingLabel class name as a String.
		 * @method toString
		 * @return {String} The class name as a String.
		 */
		ScrollingLabel.prototype.toString = function () {
			return "ScrollingLabel";
		};

		/**
		 * Returns the ScrollingLabel label text length before re-scaling for resolution.
		 * @method getTrueTextLength
		 * @return {Number} The true text length.
		 */
		ScrollingLabel.prototype.getTrueTextLength = function () {
			return this._textElement.getTrueTextLength();
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.ScrollingLabel = ScrollingLabel;
		return ScrollingLabel;
	}
);