/**
 * ParentalRatingIcon deals with showing a parental rating icon for an event or task.
 *
 * @class $N.gui.ParentalRatingIcon
 * @constructor
 * @extends $N.gui.GUIObject
 * @requires $N.gui.ClippedGroup
 * @requires $N.gui.CachedImage
 * @requires $N.gui.Util
 * @param {Object} docRef DOM document
 * @param {Object} [parent]
 */

(function ($N) {

	function ParentalRatingIcon(docRef, parent) {
		ParentalRatingIcon.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "ParentalRatingIcon");
		this._baseCssClasses = "parentalRating";
		this._parentalRatingIcon = new $N.gui.Container(this._docRef);
		this._parentalRatingIcon.configure({
			cssClass: this._baseCssClasses,
			visible: false
		});

		this._rootSVGRef = this._parentalRatingIcon.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	}
	$N.gui.Util.extend(ParentalRatingIcon, $N.gui.GUIObject);

	/**
	 * @method setX
	 * @param {Number} xCoordinate
	 */
	ParentalRatingIcon.prototype.setX = function (xCoordinate) {
		this._parentalRatingIcon.setX(xCoordinate);
	};

	/**
	 * @method setY
	 * @param {Number} yCoordinate
	 */
	ParentalRatingIcon.prototype.setY = function (yCoordinate) {
		this._parentalRatingIcon.setY(yCoordinate);
	};

	/**
	 * @method getCssClass
	 * @return {String} cssClass
	 */
	ParentalRatingIcon.prototype.getCssClass = function () {
		return this._parentalRatingIcon.getCssClass();
	};

	/**
	 * @method setCssClass
	 * @param {String} cssClass
	 */
	ParentalRatingIcon.prototype.setCssClass = function (cssClass) {
		this._baseCssClasses = cssClass + " parentalRating";
		this._parentalRatingIcon.setCssClass(this._baseCssClasses);
	};

	/**
	 * @method getTrueWidth
	 * @return {Number} the true width of the container
	 */
	ParentalRatingIcon.prototype.getTrueWidth = function () {
		return this._parentalRatingIcon.getTrueWidth();
	};

	/**
	 * @method getWidth
	 * @return {Number} the width of the container
	 */
	ParentalRatingIcon.prototype.getWidth = function () {
		return this._parentalRatingIcon.getWidth();
	};

	/**
	 * @method hide
	 */
	ParentalRatingIcon.prototype.hide = function () {
		this._parentalRatingIcon.hide();
		ParentalRatingIcon.superClass.hide.call(this);
	};

	/**
	 * @method update
	 * @param {Object} event
	 */
	ParentalRatingIcon.prototype.update = function (event) {
		if (event && event.parentalRating) {
			this._parentalRatingIcon.setCssClass(this._baseCssClasses + " " + (event.parentalRating <= 7 ? "L" : "R" + event.parentalRating));
			this._parentalRatingIcon.show();
		} else {
			this._parentalRatingIcon.hide();
		}
	};

	/**
	 * @method isVisible
	 * @return {Boolean}
	 */
	ParentalRatingIcon.prototype.isVisible = function () {
		return this._parentalRatingIcon.isVisible();
	};

	$N.gui = $N.gui || {};
	$N.gui.ParentalRatingIcon = ParentalRatingIcon;

}($N || {}));