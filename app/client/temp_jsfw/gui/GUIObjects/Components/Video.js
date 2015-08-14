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
			createElement: function (docRef) {
				var videoElement = docRef.createElement("video");
				videoElement.style.position = "absolute";
				return videoElement;
			},
			setUrl: function (element, url) {
				element.setAttribute("otv-video-destination", url);
				element.setAttribute("src", url);
			},
			setAspectRatio: function (element) {
				//Following code decides the aspect ratio. Attributes needed to fit the video in the specified border width/height.
				element.setAttribute("width", "1280px");
				element.setAttribute("height", "720px");
			}
		};

		function Video(docRef, parent) {

			Video.superConstructor.call(this, docRef);

			this._rootElement = domAbstraction.createElement(this._docRef);
			this._innerElement = this._rootElement;
			domAbstraction.setAspectRatio(this._innerElement);

			this._href = "";

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(Video, $N.gui.AbstractComponent);

		/**
		 * Sets the Video href.
		 * @method setHref
		 * @param {String} newHref The new href hyperlink value.
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

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.Video = Video;
		return Video;
    }
);
