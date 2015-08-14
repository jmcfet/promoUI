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

		function ScrollingLabel(docRef, parent) {

			ScrollingLabel.superConstructor.call(this, docRef);

			this._container = new $N.gui.ClippedGroup(docRef);
			this._label = new $N.gui.Label(docRef, this._container);

			this._rootElement = this._container.getRootElement();
			this._innerElement = this._label.getRootElement();

			if (parent) {
				parent.addChild(this._container);
			}

			// default values & local references
			this._text = "";
			this._duration = "3s";
			this._durationPerCharacter = false;
			this._defaultScrollingClass = "scrollingLabel";
		}

		$N.gui.Util.extend(ScrollingLabel, $N.gui.AbstractComponent);

		/**
		 * Sets the width of the ScrollingLabel element.
		 * @method setWidth
		 * @param {Number} width The width of the ScrollingLabel.
		 */
		ScrollingLabel.prototype.setWidth = function (width) {
			this._container.setWidth(width);
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
			this._label.setText(text);
			this.stop();
			if (suppressStart !== true) {
				this.start();
			}
		};

		/**
		 * Sets the CSS style of the text.
		 * @method setCssStyle
		 * @deprecated use setCssClass
		 * @param cssStyle
		 */
		ScrollingLabel.prototype.setCssStyle = function (cssStyle) {
			this._label.setCssStyle(cssStyle);
		};

		/**
		 * Sets the CSS class of the text.
		 * @method setCssClass
		 * @param cssClass
		 */
		ScrollingLabel.prototype.setCssClass = function (cssClass) {
			this._label.setCssClass(cssClass);
			this._label.addCssClass(this._defaultScrollingClass);
		};

		/**
		 * Sets the CSS class to configure the scrolling appearance.
		 * @method setScrollingCssClass
		 * @param cssClass
		 */
		ScrollingLabel.prototype.setScrollingCssClass = function (cssClass) {
			this._label.removeCssClass(this._defaultScrollingClass);
			this._defaultScrollingClass = cssClass;
			this._label.addCssClass(cssClass);
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
			return this._label.getFontSize();
		};

		/**
		 * Returns the current height of the ScrollingLabel.
		 * @method getHeight
		 * @return {Number} The current height.
		 */
		ScrollingLabel.prototype.getHeight = function () {
			return this._label.getHeight();
		};

		/**
		 * Returns the current scroll animation duration.
		 * @method getDuration
		 * @return {String} The animation duration.
		 */
		ScrollingLabel.prototype.getDuration = function () {
			if (this._durationPerCharacter) {
				var durationValue = parseFloat(this._duration);

				if (this._duration.indexOf('ms') >= 0) {
					return durationValue;
				} else if (this._duration.indexOf('s') >= 0) {
					return durationValue * 1000;
				}

				return durationValue;
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
			// start animation if content requires it
			if (this._innerElement.clientWidth > this._container.getWidth()) {
				if (this._durationPerCharacter) {
					this._innerElement.style.webkitAnimationDuration = ((this._text.length + this.STRING_GAP.length) * this.getDuration()) + "ms";
				}
				this._label.addCssClass("animate");
			}
		};

		/**
		 * Stops the scroll animation at the end of its current cycle.
		 * @method stop
		 */
		ScrollingLabel.prototype.stop = function () {
			this._label.removeCssClass("animate");
		};

		/**
		 * Returns boolean indicating whether text length exceeds container width.
		 * @method isTextOverflow
		 */
		ScrollingLabel.prototype.isTextOverflow = function () {
			if (this._innerElement.clientWidth > this._container.getWidth()) {
				return true;
			}
			return false;
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
			return this._label.getTrueTextLength();
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.ScrollingLabel = ScrollingLabel;
		return ScrollingLabel;
	}
);
