/**
 * StartOverIcon deals with showing or hiding a start over icon.
 *
 * @class $N.gui.StartOverIcon
 * @constructor
 * @extends $N.gui.GUIObject
 *
 * @requires $N.apps.core.Log
 * @requires $N.gui.ClippedGroup
 * @requires $N.gui.CachedImage
 * @requires $N.app.StartOverHelper
 * @requires $N.gui.Util
 * @author hepton
 * @param {Object} docRef DOM document
 * @param {Object} [parent]
 */
(function ($N) {
	function StartOverIcon(docRef, parent) {

		StartOverIcon.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "StartOverIcon");

		this._startOverIcon = new $N.gui.CachedImage(this._docRef);
		this._startOverIcon.configure({
			width: 37.5,
			height: 37.5,
			href: "../../../customise/resources/images/%RES/icons/replay.png",
			quality: 1
		});

		this._rootSVGRef = this._startOverIcon.getRootSVGRef();

		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(StartOverIcon, $N.gui.GUIObject);

	/**
	 * Sets the X position of the start over icon.
	 * @method setX
	 * @param {Number} xCoordinate
	 */
	StartOverIcon.prototype.setX = function (xCoordinate) {
		this._startOverIcon.setX(xCoordinate);
	};

	/**
	 * Sets the Y position of the start over icon.
	 * @method setY
	 * @param {Number} yCoordinate
	 */
	StartOverIcon.prototype.setY = function (yCoordinate) {
		this._startOverIcon.setY(yCoordinate);
	};

	/**
	 * @method getCssClass
	 * @return {String} cssClass
	 */
	StartOverIcon.prototype.getCssClass = function () {
		return this._startOverIcon.getCssClass();
	};

	/**
	 * @method setCssClass
	 * @param {String} cssClass
	 */
	StartOverIcon.prototype.setCssClass = function (cssClass) {
		this._startOverIcon.setCssClass(cssClass);
	};

	/**
	 * Returns the true width of the start over icon
	 * @method getTrueWidth
	 * @return {Number} the true width of the container
	 */
	StartOverIcon.prototype.getTrueWidth = function () {
		return this._startOverIcon.getTrueWidth();
	};

	/**
	 * Returns the width of the start over icon
	 * @method getWidth
	 * @return {Number} the width of the container
	 */
	StartOverIcon.prototype.getWidth = function () {
		return this._startOverIcon.getWidth();
	};

	/**
	 * Is the start over icon visible
	 * @method isVisible
	 */
	StartOverIcon.prototype.isVisible = function () {
		return this._startOverIcon.isVisible();
	};

	/**
	 * @method hide
	 */
	StartOverIcon.prototype.hide = function () {
		this._log("hide", "Enter");
		this._startOverIcon.hide();
		StartOverIcon.superClass.hide.call(this);
		this._log("hide", "Exit");
	};

	/**
	 * Updates the start over icon to the relevant state
	 * @method update
	 * @param {Object} event
	 * @param {Number} xCoordinate - (optional) value for setting xCoordinate position of start over icon
	 */
	StartOverIcon.prototype.update = function (event, xCoordinate) {
		var isCatchUp = $N.app.CatchUpHelper.isCatchUp(event),
			isStartOver = $N.app.StartOverHelper.isStartOver(event);

		this._log("update", "Enter");

		if (isStartOver || isCatchUp) {
			if (xCoordinate) {
				this.setX(xCoordinate);
			}
			this._startOverIcon.show();
			this.show();
			this._log("update", "Show & Exit");
		} else {
			this.hide();
			this._log("update", "Hide & Exit");
		}
	};

	$N.gui = $N.gui || {};
	$N.gui.StartOverIcon = StartOverIcon;

}($N || {}));