/**
 * @class ScrollingGroup
 * @extends GUIObject
 * @constructor
 * @requires $N.gui.MaskIcon
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	var ScrollingGroup = function (docRef, parent) {
		ScrollingGroup.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "ScrollingGroup");

		this._scrollSpeed = 50;
		this._width = 500;
		this._height = 800;
		this._innerWidth = null;
		this._innerHeight = null;

		this._container = new $N.gui.Group(this._docRef);
		this._upArrow = new $N.gui.MaskIcon(this._docRef, this._container);
		this._downArrow = new $N.gui.MaskIcon(this._docRef, this._container);
		this._outerContainer = new $N.gui.ClippedGroup(this._docRef, this._container);
		this._innerContainer = new $N.gui.Layer(this._docRef, this._outerContainer);

		this._outerContainer.configure({
			width: this._width,
			height: this._height
		});
		this._innerContainer.configure({
			width: this._width,
			height: this._height
		});
		this._innerContainer.addMoveAnimation();

		this._upArrow.configure({
			x: 4.5,
			y: -22.5,
			width: 30,
			height: 18,
			href: "../../../customise/resources/images/icons/arrows/upArrowIcon.png",
			color: "#fff",
			visible: false
		});
		this._downArrow.configure({
			x: 4.5,
			y: 513,
			width: 30,
			height: 18,
			href: "../../../customise/resources/images/icons/arrows/downArrowIcon.png",
			color: "#fff",
			visible: false
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(ScrollingGroup, $N.gui.GUIObject);

	/**
	 * @method setUpArrowProperties
	 * @param {Object} config
	 */
	ScrollingGroup.prototype.setUpArrowProperties = function (config) {
		this._upArrow.configure(config);
	};

	/**
	 * @method setDownArrowProperties
	 * @param {Object} config
	 */
	ScrollingGroup.prototype.setDownArrowProperties = function (config) {
		this._downArrow.configure(config);
	};

	/**
	 * @method _isSelectionAtTop
	 * @return {Boolean}
	 */
	ScrollingGroup.prototype._isSelectionAtTop = function () {
		return (this._innerContainer.getTrueY() === 0);
	};

	/**
	 * @method _isSelectionAtBottom
	 * @return {Boolean}
	 */
	ScrollingGroup.prototype._isSelectionAtBottom = function () {
		return (this._innerContainer.getTrueY() === Math.floor(this._outerContainer.getTrueHeight() - this._innerContainer.getTrueHeight() + 1.5));
	};

	/**
	 * @method _updateArrowVisibility
	 */
	ScrollingGroup.prototype._updateArrowVisibility = function () {
		this._upArrow.setVisible(!this._isSelectionAtTop());
		this._downArrow.setVisible(!this._isSelectionAtBottom());
	};

	/**
	 * Override to allow adding of child to inner container rather than outer
	 * @method addChild
	 * @param {Object} childObj
	 */
	ScrollingGroup.prototype.addChild = function (childObj) {
		if (!this._children) {
			this._children = [];
		}
		this._children.push(childObj);
		if (childObj._setParent) {
			childObj._setParent(this);
		}
		this._innerContainer.getRootSVGRef().appendChild(childObj.getRootElement());
	};

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	ScrollingGroup.prototype.setWidth = function (width) {
		this._width = width;
		this._outerContainer.setWidth(width);
		if (!this._innerWidth) {
			this.setInnerWidth(width);
		}
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	ScrollingGroup.prototype.setHeight = function (height) {
		this._height = height;
		this._outerContainer.setHeight(height);
		this._downArrow.setY(height + 63);
		if (!this._innerHeight) {
			this.setInnerHeight(height);
		}
		this._updateArrowVisibility();
	};

	/**
	 * @method setInnerWidth
	 * @param {Number} innerWidth
	 */
	ScrollingGroup.prototype.setInnerWidth = function (innerWidth) {
		this._innerWidth = innerWidth;
		this._innerContainer.setWidth(innerWidth);
	};

	/**
	 * @method setInnerHeight
	 * @param {Number} innerHeight
	 */
	ScrollingGroup.prototype.setInnerHeight = function (innerHeight) {
		this._innerHeight = innerHeight;
		this._innerContainer.setHeight(innerHeight);
		this._updateArrowVisibility();
	};

	/**
	 * @method setScrollSpeed
	 * @param {Number} scrollSpeed
	 */
	ScrollingGroup.prototype.setScrollSpeed = function (scrollSpeed) {
		this._scrollSpeed = parseInt(scrollSpeed, 10);
	};

	/**
	 * @method scrollHorizontal
	 * @param {number} amount (-ve for left, +ve for right)
	 * @return {Boolean} handled
	 */
	ScrollingGroup.prototype.scrollHorizontal = function (amount) {
		var newXPos = this._innerContainer.getTrueX() + amount,
			handled = false;
		newXPos = Math.max(newXPos, Math.floor(this._outerContainer.getTrueWidth() - this._innerContainer.getTrueWidth() + 1.5));
		newXPos = Math.min(newXPos, 0);
		this._innerContainer.doMove(newXPos, this._innerContainer.getTrueY());
		return (newXPos !== this._innerContainer.getTrueX());
	};

	/**
	 * @method scrollVertical
	 * @param {number} amount (-ve for up, +ve for down)
	 * @return {Boolean} handled
	 */
	ScrollingGroup.prototype.scrollVertical = function (amount) {
		var newYPos = this._innerContainer.getTrueY() + amount,
			handled = false;
		newYPos = Math.max(newYPos, Math.floor(this._outerContainer.getTrueHeight() - this._innerContainer.getTrueHeight() + 1.5));
		newYPos = Math.min(newYPos, 0);
		this._innerContainer.doMove(this._innerContainer.getTrueX(), newYPos);
		this._updateArrowVisibility();
		return (newYPos !== this._innerContainer.getTrueY());
	};

	/**
	 * @method resetScroll
	 */
	ScrollingGroup.prototype.resetScroll = function () {
		this._innerContainer.move(0, 0);
		this._updateArrowVisibility();
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 * @return {Boolean} handled
	 */
	ScrollingGroup.prototype.keyHandler = function (key) {
		var keys = $N.gui.FrameworkCore.getKeys(),
			handled = false;
		switch (key) {
		case keys.KEY_UP:
			handled = this.scrollVertical(this._scrollSpeed);
			break;
		case keys.KEY_DOWN:
			handled = this.scrollVertical(-this._scrollSpeed);
			break;
		case keys.KEY_LEFT:
			handled = this.scrollHorizontal(this._scrollSpeed);
			break;
		case keys.KEY_RIGHT:
			handled = this.scrollHorizontal(-this._scrollSpeed);
			break;
		}
		return handled;
	};

	$N.gui.ScrollingGroup = ScrollingGroup;
}($N || {}));
