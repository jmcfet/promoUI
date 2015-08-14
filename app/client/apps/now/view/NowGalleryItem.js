/**
 * @class $N.gui.NowGalleryItem
 * @constructor
 * @extends $N.gui.AbstractMosaicTile
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowGalleryItem = function (docRef, parent) {
		NowGalleryItem.superConstructor.call(this, docRef);

		this.isFocused = true;
		this.isHighlighted = false;

		this._container = new $N.gui.Group(docRef);
		this._image = new $N.gui.FadingImage(this._docRef, this._container);
		this._highlight = new $N.gui.Container(this._docRef, this._container);

		this._image.configure({
			width: 204,
			height: 285
		});
		this._highlight.configure({
			x: -4.5,
			y: -4.5,
			width: 213,
			height: 294,
			cssClass: "nowGalleryItemHighlight",
			visible: false
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowGalleryItem, $N.gui.AbstractMosaicTile);

	/**
	 * @method updateHighlight
	 */
	NowGalleryItem.prototype.updateHighlight = function () {
		if (this.isHighlighted && this.isFocused) {
			this._highlight.show();
		} else {
			this._highlight.hide();
		}
	};

	/**
	 * @method highLight
	 */
	NowGalleryItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighLight
	 */
	NowGalleryItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method focus
	 */
	NowGalleryItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	NowGalleryItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * @method setWidth
	 * @param {Object} data
	 */
	NowGalleryItem.prototype.update = function (data) {
		this._image.setHref(this._dataMapper.getHref(data));
	};

	$N.gui.NowGalleryItem = NowGalleryItem;
}($N || {}));