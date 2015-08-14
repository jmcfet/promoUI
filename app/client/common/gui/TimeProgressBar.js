/**
 * @class $N.gui.TimeProgressBar
 * @constructor
 * @extends $N.gui.LabelledProgressBar
 *
 * @requires $N.gui.Util
 * @requires $N.app.DateTimeUtil
 *
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */
(function ($N) {
	function TimeProgressBar(docRef, parent) {
		TimeProgressBar.superConstructor.call(this, docRef, parent);
		this.configure({
			progressBarPaddingLeft: 0,
			startLabelWidth: 0
		});
	}
	$N.gui.Util.extend(TimeProgressBar, $N.gui.LabelledProgressBar);
	$N.apps.core.Language.adornWithGetString(TimeProgressBar, "customise/resources/");

	/**
	 * resets the progress bar progress and sets the labels.
	 * @method resetProgressBar
	 * @param {Number} minimum
	 * @param {Number} maximum
	 * @param {Number} elapsed
	 * @param {Number} elapsedOffset
	 *
	 */
	TimeProgressBar.prototype.resetProgressBar = function (minimum, maximum, elapsed, elapsedOffset) {
		var duration = parseInt(elapsed, 10) - parseInt(elapsedOffset || 0, 10);
		this.setProgressBarLabels("", $N.app.DateTimeUtil.getFormattedDurationStringFromMS(duration));
		this.updateProgressBar(minimum, maximum, elapsed, elapsedOffset);
		this.show();
	};

	/**
	 * Returns the TimeProgressBar class name as a String.
	 * @method toString
	 * @return {String} The TimeProgressBar class name as a String.
	 */
	TimeProgressBar.prototype.toString = function () {
		return "TimeProgressBar";
	};

	$N.gui = $N.gui || {};
	$N.gui.TimeProgressBar = TimeProgressBar;
}($N || {}));
