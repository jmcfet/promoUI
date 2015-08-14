/**
 * @class N.gui.BufferIndicator
 * @constructor
 * @extends N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	function BufferIndicator(docRef, parent) {
		BufferIndicator.superConstructor.call(this, docRef);

		this._loadingImage = new $N.gui.Image(docRef);

		this._imageWidth = 48;
		this._imageHeight = 48;

		this._loadingImage.configure({
			cssClass: "bufferIndicator",
			width: this._imageWidth,
			height: this._imageHeight
		});

		this._rootSVGRef = this._loadingImage.getRootSVGRef();

		if (parent) {
			parent.addChild(this);
		}

		this.hide();
	}

	$N.gui.Util.extend(BufferIndicator, $N.gui.GUIObject);


	BufferIndicator.prototype.show = function () {
		BufferIndicator.superClass.show.call(this);
		this._loadingImage.addCssClass("animate");
	};


	BufferIndicator.prototype.hide = function () {
		this._loadingImage.removeCssClass("animate");
		BufferIndicator.superClass.hide.call(this);
	};


	BufferIndicator.prototype.setImage = function (href) {
		this._loadingImage.setHref(href);
	};


	BufferIndicator.prototype.setImageWidth = function (width) {
		this._loadingImage.setWidth(width);
		this._imageWidth = this._loadingImage.getWidth();
	};


	BufferIndicator.prototype.setImageHeight = function (height) {
		this._loadingImage.setHeight(height);
		this._imageHeight = this._loadingImage.getHeight();
	};


	BufferIndicator.prototype.getClassName = function () {
		return "BufferIndicator";
	};

	$N.gui = $N.gui || {};
	$N.gui.BufferIndicator = BufferIndicator;
}($N || {}));
