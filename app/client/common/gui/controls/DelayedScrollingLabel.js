/**
 * The DelayedScrollingLabel is a "subclass" of JSFW's ScrollingLabel, and it is intended to scroll texts
 * only when they don't fit on their containers (ScrollingLabel default behavior) after 2 seconds.
 * Once the end of the text is visible, it should wait another 2 seconds, and then restart the text to its beginning.
 *
 * @author wcarvalh
 * @class DelayedScrollingLabel
 * @extends ScrollingLabel
 * @requires $N.gui.ScrollingLabel
 * @constructor
 * @param {Object} docRef
 * @param {Object} parent
 *
 */
(function ($N) {
	//"use strict";

	function DelayedScrollingLabel(docRef, parent) {
		DelayedScrollingLabel.superConstructor.call(this, docRef, parent);
		this._docRef = docRef;
		this._log = new $N.apps.core.Log("CommonGUI", "DelayedScrollingLabel");
		this._parent = parent;
		this.STRING_GAP = "      ";
		this.DELAY = 2000;
		this.delayTimeout = null;
		this.setScrollingCssClass("delayedScrollingLabel");
	}

	$N.gui.Util.extend(DelayedScrollingLabel, $N.gui.ScrollingLabel);

	/**
	 * Starts the animation or restarts it if it is already running.
	 * If it has not already been initialised during the setting of
	 * the duration, then it will be initialise using the default duration.
	 * @method start
	 */
	DelayedScrollingLabel.prototype.start = function () {
		this._log("start", "Enter");
		var me = this;

		if (this.delayTimeout) {
			clearTimeout(this.delayTimeout);
		}

		this.delayTimeout = setTimeout(function () {
			// start animation if content requires it
			if (me._innerElement.clientWidth > me._container.getRootElement().clientWidth) {
				if (me._durationPerCharacter) {
					me._innerElement.style.webkitAnimationDuration = (((me._text.length + me.STRING_GAP.length) * me.getDuration()) * 1.2) + "ms";
				}

				/*  Duplicate the string and gap, but we should only animate 50% of the length to create a
					cyclic effect for the scrolling label */
				me._label.setText(me._text + me.STRING_GAP + me._text + me.STRING_GAP);

				me._label.addCssClass("animate");
			}
		}, this.DELAY);

		this._log("start", "Exit");
	};

	/**
	 * Stops the scroll animation at the end of its current cycle.
	 * @method stop
	 */
	DelayedScrollingLabel.prototype.stop = function () {
		if (this.delayTimeout) {
			clearTimeout(this.delayTimeout);
			this.delayTimeout = null;
		}
		this._label.removeCssClass("animate");
		this._label.setText(this._text);
	};

	/**
	 * @method setDuration
	 * @param duration
	 * This method has been overridden to make sure that all animation will be applied per character
	 */
	DelayedScrollingLabel.prototype.setDuration = function (duration) {
		this._log("setDuration", "Enter");
		this._duration = duration;
		this._durationPerCharacter = true;
		this._log("setDuration", "Exit");
	};

	DelayedScrollingLabel.prototype.setText = function (text, suppressStart) {
		if (text !== this._text) {
			this.stop();
			this._text = text;
			this._label.setText(text);
			if (suppressStart !== true) {
				this.start();
			}
		}
	};

	DelayedScrollingLabel.prototype.getCssClass = function () {
		return this._label.getCssClass();
	};

	$N.gui.DelayedScrollingLabel = DelayedScrollingLabel;
}($N || window.parent.$N || {}));
