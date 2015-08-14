/**
 * @class $N.gui.NowClubeItem
 * @constructor
 * @extends $N.gui.AbstractMosaicTile
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowClubeItem = function (docRef, parent) {
		NowClubeItem.superConstructor.call(this, docRef);

		this.isFocused = true;
		this.isHighlighted = false;

		this._container = new $N.gui.Group(docRef);
		this._image = new $N.gui.FadingImage(this._docRef, this._container);
		this._highlight = new $N.gui.Container(this._docRef, this._container);

		this._image.configure({
			width: 456,
			height: 186,
			imageConfig: {
				preserveAspect: true
			},
			underImageConfig: {
				visible: false
			}
		});
		this._highlight.configure({
			x: -3.0,
			y: -3.0,
			width: 462,
			height: 192,
			cssClass: "nowGalleryItemHighlight",
			visible: false
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowClubeItem, $N.gui.AbstractMosaicTile);

	/**
	 * @method updateHighlight
	 */
	NowClubeItem.prototype.updateHighlight = function () {
		if (this.isHighlighted && this.isFocused) {
			this._highlight.show();
		} else {
			this._highlight.hide();
		}
	};

	/**
	 * @method highlight
	 */
	NowClubeItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighlight
	 */
	NowClubeItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method focus
	 */
	NowClubeItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	NowClubeItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	NowClubeItem.prototype.update = function (data) {
		this._image.setHref(this._dataMapper.getHref(data));
	};

	$N.gui.NowClubeItem = NowClubeItem;
}($N || {}));