/**
 * @class ScrollingGroupWithFade
 * @extends ScrollingGroup
 * @constructor
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	var ScrollingGroupWithFade = function (docRef, parent) {
		ScrollingGroupWithFade.superConstructor.call(this, docRef, parent);
		this._log = new $N.apps.core.Log("CommonGUI", "ScrollingGroupWithFade");

		this._fadeSizeY = 30;

		this._clippingContainer = new $N.gui.ClippedGroup(this._docRef, this._container);
		this._outerContainer = new $N.gui.Group(this._docRef, this._clippingContainer);
		this._innerContainer = new $N.gui.Layer(this._docRef, this._outerContainer);
		this._topFade = new $N.gui.BackgroundBox(this._docRef, this._clippingContainer);
		this._bottomFade = new $N.gui.BackgroundBox(this._docRef, this._clippingContainer);

		this._clippingContainer.configure({
			width: this._width,
			height: this._height + (this._fadeSizeY * 2)
		});
		this._outerContainer.configure({
			x: 0,
			y: this._fadeSizeY,
			width: this._width,
			height: this._height
		});
		this._innerContainer.configure({
			width: this._width,
			height: this._height
		});
		this._topFade.configure({
			x: 0,
			y: 0,
			width: this._width,
			height: this._fadeSizeY,
			cssClass: "scrollingGroupFadeTop"
		});
		this._bottomFade.configure({
			x: 0,
			y: this._height + this._fadeSizeY,
			width: this._width,
			height: this._fadeSizeY,
			cssClass: "scrollingGroupFadeBottom"
		});

		this._innerContainer.addMoveAnimation();
	};
	$N.gui.Util.extend(ScrollingGroupWithFade, $N.gui.ScrollingGroup);

	/**
	 * @method setY
	 * @param {Number} ypos
	 */
	ScrollingGroupWithFade.prototype.setY = function (ypos) {
		ScrollingGroupWithFade.superClass.setY.call(this, ypos - this._fadeSizeY);
	};

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	ScrollingGroupWithFade.prototype.setWidth = function (width) {
		ScrollingGroupWithFade.superClass.setWidth.call(this, width);
		this._clippingContainer.setWidth(width);
		this._topFade.setWidth(width);
		this._bottomFade.setWidth(width);
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	ScrollingGroupWithFade.prototype.setHeight = function (height) {
		ScrollingGroupWithFade.superClass.setHeight.call(this, height);
		this._clippingContainer.setHeight(height + (this._fadeSizeY * 2));
		this._bottomFade.setY(height + this._fadeSizeY + 1);
	};

	$N.gui.ScrollingGroupWithFade = ScrollingGroupWithFade;
}($N || {}));
