/*global Image*/
/**
 * Image is an implementation of AbstractComponent
 *
 * Creates an image in the document for use directly in the markup or within controls.
 *
 * Example markup:
 *
 *     <nagra:image id="alertImage" href="../common/images/alert.png">
 *
 * @class $N.gui.Image
 * @extends $N.gui.AbstractComponent
 * @requires $N.gui.GUIObject
 * @requires $N.gui.AbstractComponent
 * @requires $N.gui.Util
 * @constructor
 * @param {Object} docRef
 * @param {Object} parent
 */

define('jsfw/gui/GUIObjects/Components/Image',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/AbstractComponent',
    'jsfw/gui/helpers/Util'
    ],
    function (GUIObject, AbstractComponent, Util) {

		var domAbstraction = {
			SVG: {
				createElement: function (docRef) {
					return docRef.createElement("image");
				},
				setUrl: function (element, url, urlVar) {
					var fullUrl = url.replace("%1", urlVar);
					fullUrl = fullUrl.replace("%RES", Image.resolution);
					element.setAttributeNS("http://www.w3.org/1999/xlink", "href", fullUrl);
				},
				setMaxBitMapSize: function (element, size) {
					element.setAttributeNS("http://www.ekioh.com/2007/ekioh", "maxBitmapSize", size);
				},
				setPreserve: function (guiObject, preserve) {
					if (preserve) {
						guiObject._innerElement.setAttribute("preserveAspectRatio", "xMidYMid");
					} else {
						guiObject._innerElement.setAttribute("preserveAspectRatio", "none");
					}
				},
				addLoadFailedCallback: function (guiObject) {
					guiObject._innerElement.addEventListener("SVGPostload", guiObject._postLoadEvent, false);
				},
				removeLoadFailedCallback: function (guiObject) {
					guiObject._innerElement.removeEventListener("SVGPostload", guiObject._postLoadEvent, false);
				}
			},
			HTML: {
				createElement: function (docRef) {
					var imageElement = docRef.createElement("img");
					imageElement.style.visibility = "hidden";
					imageElement.addEventListener("load", function () { imageElement.style.visibility = "visible"; }, false);
					imageElement.addEventListener("error", function () { imageElement.style.visibility = "hidden"; }, false);
					return imageElement;
				},
				setUrl: function (element, url, urlVar) {
					var fullUrl = null;
					if (url) {
						fullUrl = url.replace("%1", urlVar);
						fullUrl = fullUrl.replace("%RES", Image.resolution);
					}
					if (fullUrl && fullUrl !== "") {
						element.style.visibility = "visible";
						element.setAttribute("src", fullUrl);
					} else {
						element.style.visibility = "hidden";
					}
				},
				setClickHandler: function (element, handler) {     //jrm
				    debugger;
				    element.onclick = handler;
				},
				setMaxBitMapSize: function (element, size) {
					// TODO html abstraction of setting the max bitmap size if available
				},
				setPreserve: function (guiObject, preserve) {
					if (preserve && guiObject.getWidth()) {
						guiObject.getRootElement().style.height = "auto";
					} else if (preserve && guiObject.getHeight()) {
						guiObject.getRootElement().style.width = "auto";
					} else {
						guiObject.getRootElement().style.height = guiObject.getHeight();
						guiObject.getRootElement().style.width = guiObject.getWidth();
					}
				},
				addLoadFailedCallback: function (guiObject) {
					guiObject._innerElement.addEventListener("load", guiObject._postLoadEvent, false);
					guiObject._innerElement.addEventListener("error", guiObject._postLoadEvent, false);
				},
				removeLoadFailedCallback: function (guiObject) {
					guiObject._innerElement.removeEventListener("load", guiObject._postLoadEvent, false);
					guiObject._innerElement.removeEventListener("error", guiObject._postLoadEvent, false);
				}
			}
		}[$N.gui.GUIObject.mode];

		function Image(docRef, parent) {

			Image.superConstructor.call(this, docRef);

			this._rootElement = domAbstraction.createElement(this._docRef);
			this._innerElement = this._rootElement;

			this._href = "";
			this._hrefVar = "";

			if (parent) {
				parent.addChild(this);
			}

			var me = this;

			this._loadFailedCallback = null;
			this._missingImageAlterative = null;

			this._postLoadEvent = function () {
				if (!me._innerElement.naturalWidth) {
					if (me._loadFailedCallback) {
						me._loadFailedCallback();
					} else if (me._missingImageAlterative && me._missingImageAlterative !== me._href) {
						setTimeout(function () {
							me.setHref(me._missingImageAlterative);
						}, 1);
					}
				} else {
					if (me._loadSuccessfulCallback) {
						me._loadSuccessfulCallback(me._href);
					}
				}
			};
		}

		$N.gui.Util.extend(Image, $N.gui.AbstractComponent);

		Image.resolution = "720p";

		var proto = Image.prototype;

		/**
		 * Sets the URL of the image to load
		 * @method setHref
		 * @param {String} newHref
		 */
		proto.setHref = function (newHref) {
			this._href = newHref;
			domAbstraction.setUrl(this._innerElement, this._href, this._hrefVar);
		};

		proto.setClickHandler = function (handler) {           //jrm
		    domAbstraction.setClickHandler(this._innerElement, handler);
		}

		proto.setHrefVar = function (hrefVar) {
			this._hrefVar = hrefVar;
			if (this._href !== "") {
				domAbstraction.setUrl(this._innerElement, this._href, this._hrefVar);
			}
		};
		/**
		 * Sets the maximum image suze.
		 * @method setMaxBitMapSize
		 * @param {String} size The maximum image size followed by the units eg 2MB or 1500KB
		 */
		proto.setMaxBitMapSize = function (size) {
			domAbstraction.setMaxBitMapSize(this._innerElement, size);
		};

		/**
		 * Returns the URL of the image.
		 * @method getHref
		 * @return {String} The URL of the image.
		 */
		proto.getHref = function () {
			var fullUrl = null;
			if (this._href) {
				fullUrl = this._href.replace("%1", this._hrefVar);
				fullUrl = fullUrl.replace("%RES", Image.resolution);
			}
			return fullUrl;
		};

		/**
		 * Sets whether the image should preserve its aspect ratio
		 * or not
		 * @method setPreserveAspect
		 * @param {Boolean} preserve true if should preserve
		 */
		proto.setPreserveAspect = function (preserve) {
			if (preserve === true || (typeof preserve === 'string' && preserve.toLowerCase() === 'true')) {
				domAbstraction.setPreserve(this, true);
			} else {
				domAbstraction.setPreserve(this, false);
			}
		};

		/**
		 * Sets the quality of the image
		 * @method setQuality
		 * @param {Number} value 1 for quality, 2 for speed
		 */
		proto.setQuality = function (value) {
			if ($N.gui.GUIObject.mode === "SVG") {
				switch (value) {
				case 1:
					this._innerElement.setAttribute("image-rendering", "optimizeQuality");
					break;
				case 2:
					this._innerElement.setAttribute("image-rendering", "optimizeSpeed");
					break;
				}
			}
		};

		/**
		 * Sets the function that should execute if the image hasn't been loaded
		 * e.g. its not available.
		 * @method setLoadFailedCallback
		 * @param {Function} callback
		 */
		proto.setLoadFailedCallback  = function (callback) {
			if (!this._missingImageAlterative && !this._loadFailedCallback && !this._loadSuccessfulCallback) {
				domAbstraction.addLoadFailedCallback(this);
			}
			if (callback === null && !this._missingImageAlterative && !this._loadSuccessfulCallback) {
				domAbstraction.removeLoadFailedCallback(this);
			}
			this._loadFailedCallback = callback;
		};

		/**
		 * Sets the function that should execute after the image has been successfully loaded
		 * @method setLoadSuccessful
		 * @param {Object} callback
		 */
		proto.setLoadSuccessful = function (callback) {
			if (!this._missingImageAlterative && !this._loadFailedCallback && !this._loadSuccessfulCallback) {
				domAbstraction.addLoadFailedCallback(this);
			}
			this._loadSuccessfulCallback = callback;
		};

		/**
		 * Sets a url of an image that should be used instead of the requested one
		 * if the requested one has failed to load.
		 * @method setMissingImageAlterative
		 * @param {String} imageAlterative
		 */
		proto.setMissingImageAlterative = function (imageAlterative) {
			if (!this._missingImageAlterative && !this._loadFailedCallback && !this._loadSuccessfulCallback) {
				domAbstraction.addLoadFailedCallback(this);
			}
			if (imageAlterative === null && !this._loadFailedCallback && !this._loadSuccessfulCallback) {
				domAbstraction.removeLoadFailedCallback(this);
			}
			this._missingImageAlterative = imageAlterative;
		};

		/**
		 * Sets the buffered-rendering property of an image which improves the rendering
		 * of static images in SVG. To achieve the desired hardware accleration setBufferedImage
		 * must be called prior to the the setHref method.
		 * @method setBufferedImage
		 * @param {Boolean} bufferImage true if the image should be buffered
		 */
		proto.setBufferedImage = function (bufferImage) {
			if (bufferImage && $N.gui.GUIObject.mode === "SVG") {
				this._innerElement.setAttribute("buffered-rendering", "static");
			}
		};

		/**
		 * Returns the natural height of the Image
		 * @method getNaturalHeight
		 * @return {Number}
		 */
		proto.getNaturalHeight = function () {
			return Math.round(this._innerElement.naturalHeight * this.resolutionVerticalFactor);
		};

		/**
		 * Returns the natural width of the Image
		 * @method getNaturalWidth
		 * @return {Number}
		 */
		proto.getNaturalWidth = function () {
			return Math.round(this._innerElement.naturalWidth * this.resolutionHorizontalFactor);

		};

		/**
		 * Returns the name of this class
		 * @method getClassName
		 * @return {String}
		 */
		proto.getClassName = function () {
			return "Image";
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.Image = Image;
		return Image;
    }
);