/**
 * @class $N.gui.EpgProgressBar
 * @constructor
 * @requires $N.gui.LabelledProgressBar
 * @requires $N.gui.Util
 * @requires $N.gui.Label
 * @extends $N.gui.LabelledProgressBar
 *
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */
(function ($N) {
	function EpgProgressBar(docRef, parent) {
		EpgProgressBar.superConstructor.call(this, docRef, parent);
	}
	$N.gui.Util.extend(EpgProgressBar, $N.gui.LabelledProgressBar);

	/**
	 * resets the progress bar progress and sets the labels.
	 * @method resetProgressBarEpg
	 * @param {Number} minimum
	 * @param {Number} maximum
	 * @param {Number} elapsed
	 *
	 */
	EpgProgressBar.prototype.resetProgressBar = function (minimum, maximum, elapsed) {
		var startDate = "",
			endDate = "",
			startTime = "",
			endTime = "";

		if (minimum) {
			startDate = new Date(minimum);
			startTime = $N.app.DateTimeUtil.getFormattedAmPmTimeStringWithoutSuffix(startDate);
		}
		if (maximum) {
			endDate = new Date(maximum);
			endTime = $N.app.DateTimeUtil.getFormattedTimeString(endDate);
		}

		this.setProgressBarLabels(startTime, endTime);
		this.updateProgressBar(minimum, maximum, elapsed);
		this.show();
	};

	/**
	 * Returns the EpgProgressBar class name as a String.
	 * @method toString
	 * @return {String} The EpgProgressBar class name as a String.
	 */
	EpgProgressBar.prototype.toString = function () {
		return "EpgProgressBar";
	};

	$N.gui = $N.gui || {};
	$N.gui.EpgProgressBar = EpgProgressBar;
}($N || {}));