/**
 * Implementation of a Key control, useful for adding to a Form
 * control and defining specific behaviour to occur when the OK key
 * is received at the button (i.e. the user pressed the button)
 *
 * @class $N.gui.Key
 * @extends $N.gui.Button
 *
 * @author mbrown
 * @constructor
 * @param {Object} docRef document element of the page
 * @param {Object} parent the gui object this should be added to
 */
(function ($N) {

	function Key(docRef, parent) {
		Key.superConstructor.call(this, docRef);

		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(Key, $N.gui.Button);

	/**
	 * Centrally positions the text label within the button.
	 * @method _positionLabel
	 * @private
	 */
	Key.prototype._positionLabel = function () {
		var x = 0, y = 0;

		if (this._labelLeft === "centre") {
			x = this._container.getTrueWidth() / 2;
			this._label.setAlignment("centre");
		} else {
			x = parseInt(this._labelLeft, 10);
			this._label.setAlignment("left");
		}

		if (this._labelTop === "centre") {
			y = (this._container.getTrueHeight() / 2) + (this._label.getFontSize() / 3.4);
		} else {
			y = parseInt(this._labelTop, 10);
		}

		this._label.setX(x);
		this._label.setY(y);
	};

	$N.gui = $N.gui || {};
	$N.gui.Key = Key;
}($N || {}));
