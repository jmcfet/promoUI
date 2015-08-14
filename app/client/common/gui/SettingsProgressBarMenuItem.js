/**
 * SettingsProgressBarMenuItem is a list item extending AbstractListItem
 * represents parameter with it's title, a progress bar to indicate the value graphically
 * and a label towards the right of the progress to display the value
 *
 * @class $N.gui.SettingsProgressBarMenuItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 *
 * @requires $N.gui.Group
 * @requires $N.gui.Label
 * @requires $N.gui.ProgressBar
 * @requires $N.gui.Util
 *
 * @param {Object} docRef (DOM document)
 */

(function ($N) {

	function SettingsProgressBarMenuItem(docRef, parent) {

		SettingsProgressBarMenuItem.superConstructor.call(this, docRef);
		this.isFocused = true;
		this.isHighlighted = false;
		this._progressBarMinimum = 0;
		this._progressBarMaximum = 100;
		this._PROGRESSBAR_GLOW_HEIGHT_DIFFERENCE = 19;
		this._container = new $N.gui.Group(this._docRef);
		this._container.setWidth(1350);
		this._container.setHeight(40);
		this._title = new $N.gui.Label(this._docRef, this._container);
		this._title.configure({
			x: 39,
			y: -3,
			width: 450,
			cssClass: "fullViewLeftSubtitle"
		});

		this._progressBar = new $N.gui.ProgressBar(docRef, this._container);
		this._progressBar.configure({
			x: 663,
			y: 9,
			innerCssClass: "progressInner glowEffect",
			outerCssClass: "progressOuter",
			height: 10,
			width: 210,
			minimumValue: this._progressBarMinimum,
			maximumValue: this._progressBarMaximum
		});

		this._progressText = new $N.gui.Label(this._docRef, this._container);
		this._progressText.configure({
			x: 895,
			y: -3,
			cssClass: "fullViewRightSubtitle"
		});

		this.setDataMapper({
			getTitle: function (obj) {
				return obj.title;
			},
			getProgress: function (obj) {
				return obj.progress;
			}
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}

		this.addMoveAnimation();
		this.addFadeAnimation();
		this.progressIndicatorText = "%";
	}

	$N.gui.Util.extend(SettingsProgressBarMenuItem, $N.gui.AbstractListItem);

	var proto = SettingsProgressBarMenuItem.prototype;

	function formatProgress(me, progress, min, max) {
		var progMin = min || me._progressBarMinimum,
			progMax = max || me._progressBarMaximum;
		progress = progress < progMin ? Math.max(progMin, progress) : progress;
		progress = progress > progMax ? Math.min(progMax, progress) : progress;
		return {value : progress,  text : progress + me.progressIndicatorText};
	}


	/**
	 * @method setProgressIndicatorText
	 * sets the Progress bar text.
	 */
	proto.setProgressIndicatorText = function (text) {
		this.progressIndicatorText = text;
	};


	/**
	 * @method setProgressBarMinimum
	 */
	proto.setProgressBarMinimum = function (min) {
		this._progressBarMinimum = min;
		this._progressBar.setMinimumValue(min);
	};


	/**
	 * @method setProgressBarMaximum
	 */
	proto.setProgressBarMaximum = function (max) {
		this._progressBarMaximum = max;
		this._progressBar.setMaximumValue(max);
	};

	/**
	 * @method focus
	 */
	proto.focus = function () {
		this.isFocused = true;
	};

	/**
	 * @method defocus
	 */
	proto.defocus = function () {
		this.isFocused = false;
	};

	/**
	 * @method setWidth
	 */
	proto.setWidth = function (width) {
		this._width = width;
		return this;
	};

	/**
	 * @method setHeight
	 */
	proto.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * @method highlight
	 */
	proto.highlight = function () {

	};

	/**
	 * @method unHighlight
	 */
	proto.unHighlight = function () {

	};

	/**
	 * Set the minimum value of the progress bar
	 * @method setProgressBarMinimumValue
	 * @param {Number} minimum
	 */
	proto.setProgressBarMinimumValue = function (minimum) {
		this._progressBar.setMinimumValue(minimum);
	};

	/**
	 * Set the maximum value of the progress bar
	 * @method setProgressBarMaximumValue
	 * @param {Number} maximum
	 */
	proto.setProgressBarMaximumValue = function (maximum) {
		this._progressBar.setMaximumValue(maximum);
	};

	/**
	 * Set the current progress both graphically and textually
	 * @method updateProgressBar
	 * @param {Number} minimum
	 * @param {Number} maximum
	 * @param {Number} progressValue
	 * @param {Number} offset
	 */
	proto.updateProgressBar = function (minimum, maximum, progressText, offset) {
		var progressObject = formatProgress(this, progressText, minimum, maximum);
		offset = offset || 0;
		this._progressBar.setMinimumValue(minimum);
		this._progressBar.setMaximumValue(maximum);
		this._progressBar.setProgress(progressObject.value, offset);
		this._progressText.setText(progressObject.text);
	};

	proto.setProgressBarHeight = function (height) {
		this._progressBar.setHeight(height);
	};

	proto.setProgressBarWidth = function (width) {
		this._progressBar.setWidth(width);
	};

	proto.setTitleConfig = function (config) {
		this._title.configure(config);
	};

	proto.setProgressTextConfig = function (config) {
		this._progressText.configure(config);
	};

	/**
	 * @method setHeight
	 */
	proto.setProgressBarConfig = function (config) {
		this._progressBar.configure(config);
	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	proto.update = function (data) {
		if (data) {
			this._title.setText(this._dataMapper.getTitle(data));
			this.updateProgressBar(this._progressBar._minimum, this._progressBar._maximum, this._dataMapper.getProgress(data));
		}
	};
	$N.gui = $N.gui || {};
	$N.gui.SettingsProgressBarMenuItem = SettingsProgressBarMenuItem;
}($N || {}));
