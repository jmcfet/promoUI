/**
 * @class $N.gui.FadingImage
 * @constructor
 * @extends $N.gui.GUIObject
 * @requires $N.gui.Group
 * @requires $N.gui.CachedImage
 * @requires $N.gui.Util
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	var FadingImage = function (docRef, parent) {
		var me = this;
		FadingImage.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "FadingImage");

		this._container = new $N.gui.Container(this._docRef);
		this._underImage = new $N.gui.CachedImage(this._docRef, this._container);
		this._image = new $N.gui.Image(this._docRef, this._container);

		this._underImage.configure({
			width: 204,
			height: 285,
			href: $N.app.ImageUtil.DEFAULT_TITLE_IMAGE,
			preserveAspect: false
		});
		this._image.configure({
			cssClass: "fadingImage",
			width: 204,
			height: 285,
			loadSuccessful: function () {
				this.addCssClass("loaded");
			},
			preserveAspect: false
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(FadingImage, $N.gui.GUIObject);

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	FadingImage.prototype.setWidth = function (width) {
		this._underImage.setWidth(width);
		this._image.setWidth(width);
		this._width = width;
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	FadingImage.prototype.setHeight = function (height) {
		this._underImage.setHeight(height);
		this._image.setHeight(height);
		this._height = height;
	};

	/**
	 * @method setUnderImageConfig
	 * @param {Object} objConfig
	 */
	FadingImage.prototype.setUnderImageConfig = function (objConfig) {
		this._underImage.configure(objConfig);
	};

	/**
	 * @method setImageConfig
	 * @param {Object} objConfig
	 */
	FadingImage.prototype.setImageConfig = function (objConfig) {
		this._image.configure(objConfig);
	};

	/**
	 * @method setHref
	 * @param {String} href
	 */
	FadingImage.prototype.setHref = function (href) {
		if (this._image.getHref() !== href) {
			this._underImage.show();
			this._image.setHref(href);
			if (this._image._innerElement.complete) {
				this._image.addCssClass("loaded");
			} else {
				this._image.removeCssClass("loaded");
			}
		} else {
			this._image.addCssClass("loaded");
		}
	};

	$N.gui = $N.gui || {};
	$N.gui.FadingImage = FadingImage;
}($N || {}));
