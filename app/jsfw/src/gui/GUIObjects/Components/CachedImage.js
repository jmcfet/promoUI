/**
 * CachedImage is an extension of Image that clones an image into a cache
 * to reduce the hits of a HTTP request to load the image
 *
 * Creates an CachedImage in the document for use directly in the markup or within controls.
 * Example markup:
 *
 *     <nagra:CachedImage id="alertCachedImage" href="../common/CachedImages/alert.png">
 *
 * @class $N.gui.CachedImage
 * @extends $N.gui.Image
 *
 * @requires $N.gui.GUIObject
 * @requires $N.gui.AbstractComponent
 * @requires $N.gui.Image
 * @requires $N.gui.Util
 * @constructor
 * @param {Object} docRef
 * @param {Object} parent
 */
define('jsfw/gui/GUIObjects/Components/CachedImage',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/AbstractComponent',
    'jsfw/gui/GUIObjects/Components/Image',
    'jsfw/gui/helpers/Util'
    ],
    function (GUIObject, AbstractComponent, Image, Util) {

		function CachedImage(docRef, parent) {
			var me = this;

			CachedImage.superConstructor.call(this, docRef);

			if (parent) {
				parent.addChild(this);
			}

			this._postLoadCheck = function () {
				if (me._innerElement.naturalWidth && !CachedImage.cache[me._href]) {
					CachedImage.cache[me._href] = me._rootElement.cloneNode(false);
					if ($N.gui.GUIObject.mode === "HTML") {
						CachedImage.cache[me._href].style.display = "none";
						me._docRef.body.appendChild(CachedImage.cache[me._href]);
					} else {
						CachedImage.cache[me._href].setAttribute("display", "none");
						me._docRef.documentElement.appendChild(CachedImage.cache[me._href]);
					}
				}
			};
			if ($N.gui.GUIObject.mode === "SVG") {
				this._innerElement.addEventListener("SVGPostload", this._postLoadCheck, false);
			} else {
				this._innerElement.addEventListener("load", this._postLoadCheck, false);
				this._innerElement.addEventListener("error", this._postLoadCheck, false);
			}
		}

		CachedImage.cache = {};

		/**
		 * Removes an image with the given url from the cache
		 * NB: this only removes the image references created
		 * here, the browser may still hold references to the image elsewhere.
		 * @method clearImage
		 * @param {string} href of the image to remove
		 */
		CachedImage.clearImage = function (href) {
			if (CachedImage.cache[href]) {
				CachedImage.cache[href].parentNode.removeChild(CachedImage.cache[href]);
				delete CachedImage.cache[href];
			}
		};

		/**
		 * Removes all the cached images NB: this only removes the image references created
		 * here, the browser may still hold references to the image elsewhere.
		 * @method clearCache
		 */
		CachedImage.clearCache = function () {
			for (var href in CachedImage.cache) {
				CachedImage.cache[href].parentNode.removeChild(CachedImage.cache[href]);
				delete CachedImage.cache[href];
			}
		};

		$N.gui.Util.extend(CachedImage, $N.gui.Image);

		var proto = CachedImage.prototype;

		/**
		 * Removes this CachedImage instance from the cache
		 * @method clearFromCache
		 */
		proto.clearFromCache = function() {
			if (CachedImage.cache[this._href]) {
				CachedImage.cache[this.href].parentNode.removeChild(CachedImage.cache[this.href]);
				delete CachedImage.cache[this.href];
			}
		};


		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.CachedImage = CachedImage;
		return CachedImage;
    }
);