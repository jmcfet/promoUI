/**
 * SVGLink is an implementation of AbstractComponent that includes the given
 * svg in the markup.
 * NOTE: in HTML there is no support for fragments of SVG so icons/drawings
 * need to be seperated in to different files
 * @class $N.gui.SVGlink
 * @extends $N.gui.AbstractComponent
 * @requires $N.gui.GUIObject
 * @requires $N.gui.AbstractComponent
 * @requires $N.gui.Util
 * @constructor
 * @param {Object} docRef The document reference.
 * @param {Object} parent The parent class.
 */
define('jsfw/gui/GUIObjects/Components/SVGlink',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/AbstractComponent',
    'jsfw/gui/helpers/Util'
    ],
    function (GUIObject, AbstractComponent, Util) {

	var domAbstraction = {
			SVG: {
				createElement: function (docRef) {
					return docRef.createElement("use");
				},
				setHref: function (guiObject, href) {
					guiObject._innerElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", href);
				}
			},
			HTML: {
				createElement: function (docRef) {
					var rootElement = docRef.createElement("image");

					rootElement.style.position = "absolute";
					rootElement.setAttribute("type", "image/svg+xml");
					rootElement.addEventListener("load", function () { rootElement.style.visibility = "visible"; }, false);
					rootElement.addEventListener("error", function () { rootElement.style.visibility = "hidden"; }, false);
					return rootElement;
				},
				setHref: function (guiObject, href) {
					guiObject._innerElement.setAttribute("src", href);
				}
			}
		}[$N.gui.GUIObject.mode];

		function SVGlink(docRef, parent) {
			SVGlink.superConstructor.call(this, docRef);

			this._rootElement = domAbstraction.createElement(docRef);
			this._innerElement = this._rootElement;
			this._href = "";

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(SVGlink, $N.gui.AbstractComponent);

		/**
		 * Stores the href of the SVG to link to and sets the SVG element's
		 * href attribute.
		 * @method setHref
		 * @param newHref {String} The new hyperlink href value.
		 */
		SVGlink.prototype.setHref = function (newHref) {
			this._href = newHref;
			domAbstraction.setHref(this, this._href);
		};

		/**
		 * Returns the href of the current SVGlink object.
		 * @method getHref
		 * @return {String} The href of the current SVGlink.
		 */
		SVGlink.prototype.getHref = function () {
			return this._href;
		};

		/**
		 * Applies an SVG scale transform on the current object.
		 * @method applyScale
		 * @param {Number} scaleFactor The scaling factor to apply.
		 */
		SVGlink.prototype.applyScale = function (scaleFactor) {
			this.setScale(scaleFactor);
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.SVGlink = SVGlink;
		return SVGlink;
    }
);