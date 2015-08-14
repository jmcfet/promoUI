/**
 * ImageBar allows the display of a set of images .
 *
 * @class $N.gui.ImageBar
 * @extends $N.gui.AbstractControl
 * @author nthorne
 *
 * @requires $N.gui.Image
 * @requires $N.apps.core.Log
 * @requires $N.gui.Group
 * @requires $N.gui.Util
 * @requires $N.gui.AbstractControl
 *
 * @constructor
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */
define('jsfw/gui/GUIObjects/Controls/ImageBar',
    [
    'jsfw/gui/GUIObjects/Components/Image',
    'jsfw/apps/core/Log',
    'jsfw/gui/GUIObjects/Components/Group',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Controls/AbstractControl'
    ],
    function (Image, Log, Group, Util, AbstractControl) {

		function ImageBar(docRef, parent) {

			ImageBar.superConstructor.call(this, docRef);

			this._log = new $N.apps.core.Log("CommonGUI", "ImageBar");
			this._container = new $N.gui.Group(docRef);
			this._ImageBar = [];
			this._maxImages = 5;
			this._imageWidth = 37.5;
			this._imageHeight = 18;
			this._padding = 6;
			this._imageCount = 0;
			this._isAlignRight = false;
			this._width = 200;

			this._rootElement = this._container.getRootElement();

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(ImageBar, $N.gui.AbstractControl);

		/**
		 * Sets the maximum number of images for the image bar.
		 * @method setMaxImages
		 * @param {Number} maxNumberOfImages maximum number of images
		 */
		ImageBar.prototype.setMaxImages = function (maxNumberOfImages) {
			this._maxImages = maxNumberOfImages;
		};

		/**
		 * Sets the height of images.
		 * @method setImageHeight
		 * @param {Number} height height of images
		 */
		ImageBar.prototype.setImageHeight = function (height) {
			this._imageHeight = height;
		};

		/**
		 * Sets the width of images.
		 * @method setImageWidth
		 * @param {Number} width width of images
		 */
		ImageBar.prototype.setImageWidth = function (width) {
			this._imageWidth = width;
		};

		/**
		 * Sets the padding between images.
		 * @method setPadding
		 * @param {Number} padding padding between images
		 */
		ImageBar.prototype.setPadding = function (padding) {
			this._padding = padding;
		};

		/**
		 * Sets the alignment of the images (left is default).
		 * @method setAlignRight
		 * @param {Boolean} isAlignRight when true the images are aligned from the right, when false images are aligned from the left
		 */
		ImageBar.prototype.setAlignRight = function (isAlignRight) {
			if (isAlignRight === true || isAlignRight === "true") {
				this._isAlignRight = true;
			} else {
				this._isAlignRight = false;
			}
		};

		/**
		 * Initialises the image bar.
		 * @method init
		 */
		ImageBar.prototype.init = function () {
			var i;
			var xcoord = 0;
			var me = this;

			for (i = 0; i < this._maxImages; i++) {
				this._ImageBar[i] = new $N.gui.Image(this._docRef, this._container);

				if (this._isAlignRight) {
					xcoord = this._container.getX() - ((me._imageWidth + me._padding) * i);
				} else {
					xcoord = (me._imageWidth + me._padding) * i;
				}

				this._ImageBar[i].configure({
					x: xcoord,
					y: 0,
					width: me._imageWidth,
					height: me._imageHeight,
					visible: false
				});
			}
		};

		/**
		 * Initialises the image bar.
		 * @method initialise
		 * @deprecated use init()
		 */
		ImageBar.prototype.initialise = function () {
			this.init();
		};

		/**
		 * Sets the images on the image bar.
		 * @method setImages
		 * @param {Array} imageUrlArray string array containing relative paths to images
		 */
		ImageBar.prototype.setImages = function (imageUrlArray) {

			imageUrlArray = imageUrlArray || [];
			var i;

			for (i = 0; i < this._maxImages; i++) {
				if (imageUrlArray[i]) {
					this._ImageBar[i].setHref(imageUrlArray[i]);
					this._ImageBar[i].show();
				} else {
					this._ImageBar[i].hide();
				}
			}

			this._imageCount = imageUrlArray.length;
		};

		/**
		 * Returns the width of the ImageBar GUI component, depending on the number of ImageBar displayed.
		 * @method getWidth
		 * @return {Number} Width of the GUI component.
		 */
		ImageBar.prototype.getWidth = function () {
			return (this._imageWidth + this._padding) * this._imageCount;
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.ImageBar = ImageBar;
		return ImageBar;
	}
);