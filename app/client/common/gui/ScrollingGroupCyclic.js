/**
 * ScrollingGroupCyclic creates a cyclic scrollable group cyclic.
 *
 * Example mark-up definition:
 *
 *     <ScrollingGroupCyclic id="scrollingGroupCyclic" x="0" y="0" width="200" height="300"
 *          scrollBarOuterCssClass="outer" scrollBarInnerCssClass="inner" />
 *
 * Example code:
 *
 *     view.ScrollingGroupCyclic.update(100, 300, 1000);  // group visible area, real width, interval
 *     view.ScrollingGroupCyclic.startXAnim();  // start move
 * *
 * @class $N.gui.ScrollingGroupCyclic
 * @constructor
 * @extends $N.gui.ScrollableGroup
 *
 * @requires $N.apps.core.Log
 * @requires $N.gui.Util
 *
 * @param {Object} docRef DOM document
 * @param {Object} [parent]
 */
(function ($N) {
	function ScrollingGroupCyclic(docRef, parent) {

		ScrollingGroupCyclic.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonHELP", "ScrollingGroupCyclic");

		// default values & local references
		this._XAnim = null;
		this._validWidth = 0;
		this._realWidth = 0;
		this._interval = 0;
		this._timerDelay = null;
		this._INTERVAL_PER_HUNDRED_PIXELS = 40;

		this._isRightToLeft = true;
		this._isScroll = false;
	}

	$N.gui.Util.extend(ScrollingGroupCyclic, $N.gui.ScrollableGroup);

	/**
	 * Sets the given width as the group's viewable area width.
	 * @method _setValidWidth
	 * @param {Number} the width
	 */
	ScrollingGroupCyclic.prototype._setValidWidth = function (width) {
		this._validWidth = width;
	};

	/**
	 * Returns the the group's viewable area width.
	 * @method getValidWidth
	 * @return {Number} the group's viewable area width
	 */
	ScrollingGroupCyclic.prototype.getValidWidth = function () {
		return this._validWidth;
	};

	/**
	 * Sets the given width as the group's contents real width.
	 * @method _setRealWidth
	 * @param {Number} the width
	 */
	ScrollingGroupCyclic.prototype._setRealWidth = function (width) {
		this._realWidth = width;
	};

	/**
	 * Returns the the group's contents real width.
	 * @method getRealWidth
	 * @return {Number} the group's real width
	 */
	ScrollingGroupCyclic.prototype.getRealWidth = function () {
		return this._realWidth;
	};

	/**
	 * Sets the time interval when move animation end.
	 * @method _setInterval
	 * @param {Number} the interval
	 */
	ScrollingGroupCyclic.prototype._setInterval = function (interval) {
		this._interval = interval;
	};

	/**
	 * Returns the the interval when move to the end.
	 * @method getInterval
	 * @return {Number} the time interval as ms
	 */
	ScrollingGroupCyclic.prototype.getInterval = function () {
		return this._interval;
	};

	/**
	 * Judge if the group's contents need be scrolled.
	 * @method _isXScrollable
	 * @return {Boolean} true if the group's contents need be scrolled, false otherwise
	 */
	ScrollingGroupCyclic.prototype._isXScrollable = function () {
		var bScroll = false;
		if (this._validWidth < this._realWidth) {
			bScroll = true;
		}
		return bScroll;
	};

	/**
	 * Sets the move speed, 50ms per one hundred pixels.
	 * @method _setDuration
	 */
	ScrollingGroupCyclic.prototype._setDuration = function () {
		var duration = 1;
		if (this._realWidth > this._validWidth) {
			duration = (this._realWidth - this._validWidth) * this._INTERVAL_PER_HUNDRED_PIXELS;
		}
		this.setAnimationDuration(duration + "ms");
	};

	/**
	 * Callback when the animation got "endEvent".
	 * @method _animationEndCallback
	 */
	ScrollingGroupCyclic.prototype._animationEndCallback = function () {
		var me = this;
		this._log("_animationEndCallback", "Enter");
		if (this._timerDelay) {
			clearTimeout(this._timerDelay);
			this._timerDelay = null;
		}
		this._timerDelay = setTimeout(function () {
			if (me._isRightToLeft) {
				me._isRightToLeft = false;
				me.startXAnim(false);
			} else {
				me._isRightToLeft = true;
				me.startXAnim(true);
			}
		}, this._interval);

		this._log("_animationEndCallback", "Exit");
	};

	/**
	 * Sets animation end callback.
	 * @method _setAnimationEndCallback
	 */
	ScrollingGroupCyclic.prototype._setAnimationEndCallback = function () {
		this._XAnim = this.getXScrollAnimation();

		// start animation if content requires it
		if (this._isXScrollable()) {
			var me = this;
			this._XAnim.setAnimationEndCallback(function () {
				me._animationEndCallback();
			});
		}
	};

	/**
	 * Method to update scrollable group condition.
	 * @method update
	 * @param {Number} the visiable area width
	 * @param {Number} the real area width
	 * @param {Number} interval when move to the end
	 */
	ScrollingGroupCyclic.prototype.update = function (validWidth, realWidth, interval) {
		this._setValidWidth(validWidth);
		this._setRealWidth(realWidth);
		this._setInterval(interval);
		this._setDuration();
		this._setAnimationEndCallback();
	};

	/**
	 * Method to start horizontal direction move.
	 * @method startXAnim
	 */
	ScrollingGroupCyclic.prototype.startXAnim = function () {
		this._log("startXAnim", "Enter");
		var yPos = this.getYScrollPosition();
		this._XAnim = this.getXScrollAnimation();

		if (this._isXScrollable()) {
			if (this._isRightToLeft) {
				this.setScrollPosition(0, yPos);
				this.scrollXPosition((this._realWidth - this._validWidth) * this.resolutionHorizontalFactor);
			} else {
				this.setScrollPosition((this._realWidth - this._validWidth) * this.resolutionHorizontalFactor, yPos);
				this.scrollXPosition((this._validWidth - this._realWidth) * this.resolutionHorizontalFactor);
			}
			this._isScroll = true;
		}
		this._log("startXAnim", "Exit");
	};

	/**
	 * Method to stop the horizontal direction move animation.
	 * This will remove the padding bounce is set to true.
	 * @method stopXAnim
	 */
	ScrollingGroupCyclic.prototype.stopXAnim = function () {
		this._log("stopXAnim", "Enter");
		var yPos = this.getYScrollPosition();
		this._XAnim = this.getXScrollAnimation();
		// stop the animation if it has been defined
		if (this._isXScrollable() && this._isScroll) {
			this._isRightToLeft = true;
			if (this._timerDelay) {
				clearTimeout(this._timerDelay);
				this._timerDelay = null;
			}
			this._XAnim.setAnimationEndCallback(null);
			this.setScrollPosition(0, yPos);
			this._isScroll = false;
			this._log("stopXAnim", "Exit");
		}
	};

	/**
	 * Method to judge the animation has been started
	 * @method isScrolling
	 */
	ScrollingGroupCyclic.prototype.isScrolling = function () {
		return this._isScroll;
	};

	/**
	 * Method to init animation flag
	 * @method resetXAnimFlag
	 */
	ScrollingGroupCyclic.prototype.resetXAnimFlag = function () {
		this._isScroll = false;
		this._isRightToLeft = true;
	};

	$N.gui = $N.gui || {};
	$N.gui.ScrollingGroupCyclic = ScrollingGroupCyclic;
}($N || {}));