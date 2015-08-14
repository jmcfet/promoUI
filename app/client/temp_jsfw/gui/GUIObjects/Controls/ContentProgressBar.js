/**
 * ContentProgressBar extends ProgressBar by adding additional meta information, such as labels
 * and a graphical position marker.
 *
 * The position marker is defined using the setPlayHead method, and should be provided with a mark-up
 * reference (i.e. this could be an external mark-up file with an anchor to a definition within the file).
 *
 * Example Markup :
 *
 *     <nagra:contentProgressBar id="myProgressBar" x="200" y="200" width="400" height="30" outerCssClass="progClass" innerCssClass="progInnerClass" />
 *
 * Example JavaScript :
 *
 *     $N.gui.FrameworkCore.extendWithGUIObjects(document.documentElement, view);
 *     view.myProgressBar.setStartLabel("0%");
 *     view.myProgressBar.setEndLabel("100%");
 *     view.myProgressBar.setPlayHead("common/resources/svg/icons.svg#playHead");
 *     view.myProgressBar.setMinimumValue(0);
 *     view.myProgressBar.setMinimumValue(250);
 *     view.myProgressBar.setProgress(100);
 *     view.myProgressBar.showPositionMarker();
 *     var percentage = view.myProgressBar.getProgressPercent();
 *
 * @class $N.gui.ContentProgressBar
 * @extends $N.gui.ProgressBar
 *
 * @requires $N.gui.ProgressBar
 * @requires $N.gui.Util
 * @requires $N.gui.Label
 * @requires $N.gui.SVGlink
 * @requires $N.gui.Image
 *
 * @author mjagadeesan
 * @constructor
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */
define('jsfw/gui/GUIObjects/Controls/ContentProgressBar',
    [
    'jsfw/gui/GUIObjects/Controls/ProgressBar',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/GUIObjects/Components/SVGlink',
    'jsfw/gui/GUIObjects/Components/Image',
    'jsfw/gui/helpers/Util'
    ],
    function (ProgressBar, Label, SVGlink, Image, Util) {

		function ContentProgressBar(docRef, parent) {
			ContentProgressBar.superConstructor.call(this, docRef, parent);

			this._startLabel = new $N.gui.Label(this._docRef, this._outerBox);
			this._endLabel = new $N.gui.Label(this._docRef, this._outerBox);
			this._positionMarker = new $N.gui.SVGlink(this._docRef, this._outerBox);
			this._startLabelPadding = 5;
			this._endLabelPadding = 12;
			this._DEFAULT_Y_OFFSET = -3;

			this._startLabel.configure({
				x: -this._startLabelPadding,
				y: 13,
				cssClass: 'progressTextStart'
			});

			this._endLabel.configure({
				y: 13,
				cssClass: 'progressTextEnd'
			});

			this._positionMarker.configure({
				y: this._DEFAULT_Y_OFFSET
			});
		}

		$N.gui.Util.extend(ContentProgressBar, $N.gui.ProgressBar);

		/**
		 * Sets the width of the ContentProgressBar.
		 * @method setWidth
		 * @param {Number} newWidth The width of the ContentProgressBar.
		 */
		ContentProgressBar.prototype.setWidth = function (newWidth) {
			ContentProgressBar.superClass.setWidth.call(this, newWidth);
			this._endLabel.setX(parseInt(newWidth, 10) + this._endLabelPadding);
			this.setMarkerPosition(this._getPosition(this.getProgress()));
		};

		/**
		 * Sets the height of the ContentProgressBar.
		 * @method setHeight
		 * @param {Number} newHeight The height of the ContentProgressBar.
		 */
		ContentProgressBar.prototype.setHeight = function (newHeight) {
			ContentProgressBar.superClass.setHeight.call(this, newHeight);
			this._startLabel.setY(newHeight - 3);
			this._endLabel.setY(newHeight - 3);
		};

		/**
		 * Sets the text label content at the beginning of the progress bar.
		 * @method setStartLabel
		 * @param {String} text The text to appear at the beginning of the progress bar.
		 */
		ContentProgressBar.prototype.setStartLabel = function (text) {
			this._startLabel.setText(text);
		};

		/**
		 * Sets the text label content at the end of the progress bar.
		 * @method setEndLabel
		 * @param {String} text The text to appear at the end of the progress bar.
		 */
		ContentProgressBar.prototype.setEndLabel = function (text) {
			this._endLabel.setText(text);
		};

		/**
		 * Sets the y position of both the start and end labels
		 * @method setVerticalLabelPosition
		 * @param {Number} value the y coordinate to draw the labels
		 */
		ContentProgressBar.prototype.setVerticalLabelPosition = function (value) {
			this._labelPaddingY = value;
			this._startLabel.setY(this._labelPaddingY);
			this._endLabel.setY(this._labelPaddingY);
		};

		/**
		 * Sets the padding for the endLabel
		 * @method setEndLabelPadding
		 * @param {Number} value sets The X Padding before the label and after the progress bar.
		 */
		ContentProgressBar.prototype.setEndLabelPadding = function (value) {
			this._endLabelPadding = value;
			this._endLabel.setX(parseInt(this.getWidth(), 10) + this._endLabelPadding);
		};

		/**
		 * Sets the padding for the startLabel
		 * @method setStartLabelPadding
		 * @param {Number} value sets The X Padding of the start label before the progress bar.
		 */
		ContentProgressBar.prototype.setStartLabelPadding = function (value) {
			this._startLabelPadding = value;
			this._startLabel.setX(-this._startLabelPadding);
		};

		/**
		 * Sets the position at which the marker is located.
		 * @method setMarkerPosition
		 * @param {Number} value The position at which the marker is to be placed.
		 */
		ContentProgressBar.prototype.setMarkerPosition = function (value) {
			this._positionMarker.setX(this._getPosition(value));
		};

		/**
		 * Hides the position marker
		 * @method hidePositionMarker
		 */
		ContentProgressBar.prototype.hidePositionMarker = function () {
			this._positionMarker.hide();
		};

		/**
		 * Shows the position marker
		 * @method showPositionMarker
		 */
		ContentProgressBar.prototype.showPositionMarker = function () {
			this._positionMarker.show();
		};

		/**
		 * Sets the icon that is used to denote the play head.  The passed href should be the path to
		 * an SVG resource file or an image file.
		 * @method setPlayHead
		 * @param {String} href file location
		 */
		ContentProgressBar.prototype.setPlayHead = function (href) {
			if (href && href.indexOf("svg") > -1) {
				this._positionMarker.setHref(href);
			} else {
				this._positionMarker.destroy();
				this._positionMarker = new $N.gui.Image(this._docRef, this._outerBox);
				this._positionMarker.configure({
					y: this._DEFAULT_Y_OFFSET
				});
				this._positionMarker.setHref(href);
			}
		};

		/**
		 * Returns the ContentProgressBar class name as a String.
		 * @method toString
		 * @return {String} The ContentProgressBar class name as a String.
		 */
		ContentProgressBar.prototype.toString = function () {
			return "ContentProgressBar";
		};

		/**
		 * Returns the ContentProgressBar class name as a String.
		 * @method getClassName
		 * @return {String} The ContentProgressBar class name as a String.
		 */
		ContentProgressBar.prototype.getClassName = function () {
			return "ContentProgressBar";
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.ContentProgressBar = ContentProgressBar;
		return ContentProgressBar;
	}
);
