/**
 * @class $N.gui.ImageScrapbook
 * @constructor
 * @extends $N.gui.GUIObject
 * @requires $N.gui.Group
 * @requires $N.gui.Util
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	var ImageScrapbook = function (docRef, parent) {
		ImageScrapbook.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "ImageScrapbook");

		this._imageWidth = 121.5;
		this._hrefArray = [];
		this._fadeQueue = [];
		this._timeoutId = null;

		this._container = new $N.gui.Group(this._docRef);
		this._images = [];

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(ImageScrapbook, $N.gui.GUIObject);

	/**
	 * @method _doForAllImages
	 * @param {Function} runMe
	 */
	ImageScrapbook.prototype._doForAllImages = function (runMe) {
		var i,
			loopLength = this._images.length;
		for (i = 0; i < loopLength; i++) {
			runMe(this._images[i], i);
		}
	};

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	ImageScrapbook.prototype.setWidth = function (width) {
		this._width = width;
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	ImageScrapbook.prototype.setHeight = function (height) {
		this._doForAllImages(function (image) {
			image.configure({
				width: height,
				height: height
			});
		});
		this._height = height;
	};

	/**
	 * @method setImageWidth
	 * @param {Number} imageWidth
	 */
	ImageScrapbook.prototype.setImageWidth = function (imageWidth) {
		this._imageWidth = imageWidth;
	};

	/**
	 * @method setImageConfig
	 * @param {Object} objConfig
	 */
	ImageScrapbook.prototype.setImageConfig = function (objConfig) {
		this._doForAllImages(function (image) {
			image.configure(objConfig);
		});
	};

	/**
	 * @method _showImage
	 * @param {Object} image
	 */
	ImageScrapbook.prototype._showImage = function (image) {
		var me = this;
		image.bringToFront();
		image.setOpacity(1);
		image.doFade(0);
		image.doFade(1);
		clearTimeout(this._timeoutId);
		this._timeoutId = setTimeout(function () {
			me._timeoutId = null;
			me._fadeNextImage();
		}, 500 + (Math.random() * 1000));
	};

	/**
	 * @method _fadeNextImage
	 */
	ImageScrapbook.prototype._fadeNextImage = function () {
		this._fadeQueue.shift();
		if (this._fadeQueue.length) {
			this._showImage(this._fadeQueue[0]);
		}
	};

	/**
	 * @method _imageReady
	 * @param {Object} image
	 */
	ImageScrapbook.prototype._imageReady = function (image) {
		this._fadeQueue.push(image);
		if (this._fadeQueue.length === 1) {
			this._showImage(image);
		}
	};

	/**
	 * @method _fetchNextImageHref
	 * @param {Object} image
	 */
	ImageScrapbook.prototype._fetchNextImage = function (image) {
		var href = "";
		if (this._hrefArray.length) {
			href = this._hrefArray.pop();
		}
		image.setOpacity(0);
		if (image.getHref() !== href) {
			image.setHref(href);
		} else {
			this._imageReady(image);
		}
	};

	/**
	 * @method setImageConfig
	 * @param {Array} positionArray
	 */
	ImageScrapbook.prototype.setImagePositions = function (positionArray) {
		var me = this,
			i,
			loopLength,
			newImage,
			imageReady = function () {
				me._imageReady(this);
			},
			fetchNextImage = function () {
				me._fetchNextImage(this);
			},
			availableRange = this._width - this._imageWidth;
		positionArray = $N.app.ArrayUtil.arrayShuffle(positionArray);
		if (!this._images.length) {
			loopLength = positionArray.length;
			for (i = 0; i < loopLength; i++) {
				newImage = new $N.gui.Image(this._docRef, this._container);
				newImage.addFadeAnimation();
				newImage.configure({
					width: this._imageWidth,
					height: this._height,
					opacity: 0,
					loadSuccessful: imageReady,
					loadFailedCallback: fetchNextImage,
					preserveAspect: true
				});
				this._images[i] = newImage;
			}
		}
		this._doForAllImages(function (image, index) {
			image.setX(positionArray[index] * availableRange);
		});
	};

	/**
	 * @method setHrefs
	 * @param {Array} hrefArray
	 */
	ImageScrapbook.prototype.setHrefs = function (hrefArray) {
		var me = this;
		this._fadeQueue = [];
		clearTimeout(this._timeoutId);
		this._hrefArray = hrefArray.slice(0);
		this._doForAllImages(function (image) {
			me._fetchNextImage(image);
		});
	};

	$N.gui = $N.gui || {};
	$N.gui.ImageScrapbook = ImageScrapbook;
}($N || {}));
