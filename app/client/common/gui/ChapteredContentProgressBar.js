/**
 * ChapteredContentProgressBar extends the ContentProgressBar to allow it to also include
 * chapter indicators.
 * @class ContentProgressBar
 * @constructor
 * @requires $N.gui.ContentProgressBar
 * @requires $N.gui.Util
 * @requires $N.gui.ChapterIndicators
 * @extends $N.gui.ContentProgressBar
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */
(function ($N) {
	function ChapteredContentProgressBar(docRef, parent) {
		ChapteredContentProgressBar.superConstructor.call(this, docRef);

		this._chapterIndicators = new $N.gui.ChapterIndicators(docRef, this._progressBox);

		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(ChapteredContentProgressBar, $N.gui.ContentProgressBar);

	/**
	 * Sets the width of the ChapteredContentProgressBar.
	 * @method setWidth
	 * @param {Number} newWidth The width of the ChapteredContentProgressBar.
	 */
	ChapteredContentProgressBar.prototype.setWidth = function (newWidth) {
		ChapteredContentProgressBar.superClass.setWidth.call(this, newWidth);
		this._chapterIndicators.setWidth(newWidth);
	};

	/**
	 * Sets the height of the ChapteredContentProgressBar.
	 * @method setHeight
	 * @param {Number} newHeight The height of the ChapteredContentProgressBar.
	 */
	ChapteredContentProgressBar.prototype.setHeight = function (newHeight) {
		ChapteredContentProgressBar.superClass.setHeight.call(this, newHeight);
		this._chapterIndicators.setHeight(newHeight * 0.5);
		this._chapterIndicators.setY(newHeight / 2);
	};

	/**
	 * Creates the given number of chapter indicators based on the previously
	 * set width, chapters are drawn at equal distance.
	 * @method createChapterIndicators
	 * @param {Number} chapterCount
	 */
	ChapteredContentProgressBar.prototype.createChapterIndicators = function (chapterCount) {
		this._chapterIndicators.createIndicators(chapterCount);
	};

	/**
	 * Hides the chapter indicators, useful for when you have content without chapters
	 * @method hideChapterIndicators
	 */
	ChapteredContentProgressBar.prototype.hideChapterIndicators = function () {
		this._chapterIndicators.hide();
	};

	/**
	 * Shows the chapter indicators, making then visible
	 * @method showChapterIndicators
	 */
	ChapteredContentProgressBar.prototype.showChapterIndicators = function () {
		this._chapterIndicators.show();
	};

	$N.gui = $N.gui || {};
	$N.gui.ChapteredContentProgressBar = ChapteredContentProgressBar;
}($N || {}));