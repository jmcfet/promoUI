/**
 * Video is an implementation of AbstractComponent
 *
 * It is used to define video output areas within the document, for use by the Tuner CCOM object.
 *
 * Example markup:
 *
 *     <!-- video -->
 *     <nagra:video id="vidFullscreen" x="0" y="0" width="1280" height="720"></nagra:video>
 *     <!-- Picture In Picture -->
 *     <nagra:video id="vidPip" x="830" y="300" width="280" height="160"></nagra:video>
 *
 * In the above example we have created two video container.  We can attach a new player to the PIP video tag:
 *
 *     $N.gui.FrameworkCore.extendWithGUIObjects(document.documentElement, view);
 *     var pipPlayer = new $N.output.VideoPlayer();
 *     pipPlayer.tuner.showInVideo(view.vidPip);
 *
 * @class $N.gui.Video
 * @extends $N.gui.AbstractComponent
 *
 * @requires $N.gui.GUIObject
 * @requires $N.gui.AbstractComponent
 * @requires $N.gui.Util
 *
 * @author mbrown
 * @constructor
 * @param {Object} docRef Document reference.
 * @param {Object} parent Parent class.
 */

define('jsfw/gui/GUIObjects/Components/Video',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/AbstractComponent',
    'jsfw/gui/helpers/Util'
    ],
    function (GUIObject, AbstractComponent, Util) {

		var domAbstraction = {
			SVG: {
				createElement: function (docRef) {
					var videoElement = docRef.createElement("video");
					videoElement.setAttributeNS("http://www.ekioh.com/2007/ekioh", "colourKey", "#00000001");
					videoElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", "");
					videoElement.setAttribute("x", "0");
					videoElement.setAttribute("y", "0");
					return videoElement;
				},
				setUrl: function (element, url) {
					element.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
				}
			},
			HTML: {
				createElement: function (docRef) {
					var videoElement = docRef.createElement("video");
					videoElement.style.position = "absolute";
					return videoElement;
				},
				setUrl: function (element, url) {
					element.setAttribute("src", url);
				}
			}
		}[$N.gui.GUIObject.mode];

		function Video(docRef, parent) {

			Video.superConstructor.call(this, docRef);

			this._rootElement = domAbstraction.createElement(this._docRef);
			this._innerElement = this._rootElement;

			this._href = "";

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(Video, $N.gui.AbstractComponent);

		/**
		 * Sets the Video href.
		 * @method setHref
		 * @param {Object} newHref The new href hyperlink value.
		 */
		Video.prototype.setHref = function (newHref) {
			this._href = newHref;
			domAbstraction.setUrl(this._innerElement, this._href);
		};

		/**
		 * Retrieves the current Video href.
		 * @method getHref
		 * @return {String} The current Video href.
		 */
		Video.prototype.getHref = function () {
			return this._href;
		};

		/**
		 * Sets the x position of the graphical object in relation to its parent
		 * @method setX
		 * @param {Number} ix the new x coordinate
		 */
		Video.prototype.setX = function (ix) {
			if ($N.gui.GUIObject.mode === "SVG") {
				this._trueX = parseInt(ix, 10);
				this._x = Math.round(this._trueX * this.resolutionHorizontalFactor);
				this._rootElement.setAttribute("x", this._x);
			} else {
				Video.superClass.setX.call(this, ix);
			}
		};

		/**
		 * Sets the y position of the graphical object in relation to its parent
		 * @method setY
		 * @param {Number} iy the new y coordinate
		 */
		Video.prototype.setY = function (iy) {
			if ($N.gui.GUIObject.mode === "SVG") {
				this._trueY = parseInt(iy, 10);
				this._y = Math.round(this._trueY * this.resolutionVerticalFactor);
				this._rootElement.setAttribute("y", this._y);
			} else {
				Video.superClass.setY.call(this, iy);
			}
		};
		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.Video = Video;
		return Video;
    }
);
