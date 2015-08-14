/**
 * ChapterIndicators is primarily used to extend a progress bar to divide the
 * bar into equal part that represent chapters of a piece of content. They
 * are a simple gui object.
 *
 * @class $N.gui.ChapterIndicators
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef document reference
 * @param {Object} parent object to add to
 */
(function ($N) {
	function ChapterIndicators(docRef, parent) {
		ChapterIndicators.superConstructor.call(this, docRef);

		this._log = new $N.apps.core.Log("CommonGUI", "ChapterIndicators");
		this._container = new $N.gui.Group(docRef);
		this._indicators = [];
		this._width = 200;
		this._height = 9;

		this._rootSVGRef = this._container.getRootSVGRef();

		if (parent) {
			parent.addChild(this);
		}

	}

	$N.gui.Util.extend(ChapterIndicators, $N.gui.GUIObject);

	// ***** Public API *****

	/**
	 * Sets the width that should be used to draw the chapter indicators
	 * @method setWidth
	 * @param {Number} width
	 */
	ChapterIndicators.prototype.setWidth = function (width) {
		this._width = width;
	};

	/**
	 * Sets the height that should be used to draw the chapter indicators
	 * @method setHeight
	 * @param {Number} height
	 */
	ChapterIndicators.prototype.setHeight = function (height) {
		this._height = height;
	};

	/**
	 * Creates the given number of chapter indicators based on the previously
	 * set width, chapters are drawn at equal distance.
	 * @method createIndicators
	 * @param {Number} chapterCount
	 */
	ChapterIndicators.prototype.createIndicators = function (chapterCount) {

		this._log("createIndicators", "Enter");
		var pixelsPerInterval = this._width / chapterCount,
			i,
			me = this;

		for (i = 1; i < chapterCount; i++) {
			this._indicators.push(new $N.gui.Container(this._docRef, this._container));
			this._indicators[i - 1].configure({
				x: i * pixelsPerInterval,
				width: 2,
				height: me._height,
				cssClass: "chapterIndicator"
			});
		}
		this._log("createIndicators", "Exit");
	};

	$N.gui = $N.gui || {};
	$N.gui.ChapterIndicators = ChapterIndicators;
}($N || {}));