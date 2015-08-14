/**
 * Implementation of a Button control, useful for adding to a Form
 * control and defining specific behaviour to occur when the OK key
 * is received at the button (i.e. the user pressed the button)
 *
 * Example Markup :
 *
 *		<nagra:button id="myButton" x="200" y="200" width="400" height="200" />
 *		<nagra:button id="myDisabledButton" x="200" y="200" width="400" height="200" enabled="false" />
 *
 * Example JavaScript :
 *
 *		$N.gui.FrameworkCore.extendWithGUIObjects(document.documentElement, view);
 *		view.myButton.setCssClass("buttonClass");
 *		view.myButton.setHighlightCssClass("buttonHighlightClass");
 *		view.myButton.setLabelCssClass("buttonLabelClass");
 *		view.myButton.showEnabled();
 *
 * @class $N.gui.Button
 * @extends $N.gui.AbstractControl
 *
 * @requires $N.gui.AbstractControl
 * @requires $N.gui.Container
 * @requires $N.gui.Image
 * @requires $N.gui.Label
 * @requires $N.gui.OuterGlow
 * @requires $N.gui.GUIObject
 * @requires $N.gui.Util
 * @requires $N.gui.FrameworkCore
 *
 * @author mbrown
 * @constructor
 * @param {Object} docRef document element of the page
 * @param {Object} parent the gui object this should be added to
 */
define('jsfw/gui/GUIObjects/Controls/Button',
    [
    'jsfw/gui/GUIObjects/Controls/AbstractControl',
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Components/Image',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/helpers/OuterGlow',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/FrameworkCore'
    ],
    function (AbstractControl, Container, Image, Label, OuterGlow, Util, GUIObject, FrameworkCore) {

		function Button(docRef, parent) {
			Button.superConstructor.call(this, docRef);

			this._container = new $N.gui.Container(docRef);
			this._image = new $N.gui.Image(docRef, this._container);
			this._label = new $N.gui.Label(docRef, this._container);
			this._glow = null;

			this._docRef = docRef;
			this._rootElement = this._container.getRootElement();

			this._containerCSS = "button_bg";
			this._containerHighlightCSS = "button_bg_highlight";
			this._containerDisabledCSS = "button_bg_disabled";
			this._labelCSS = "button_text";
			this._labelHighlightCSS = "button_text_highlight";
			this._labelDisabledCSS = "button_text_disabled";
			this._imageCSS = "button_image";
			this._imageHighlightCSS = "button_image_highlight";
			this._imageDisabledCSS = "button_image_disabled";

			this._labelTop = "centre";
			this._labelLeft = "centre";

			this._enabled = true;

			this._selectedCallback = null;

			this.setHeight(Button.DEFAULT_HEIGHT);
			this.setWidth(Button.DEFAULT_WIDTH);
			this.setRounding(Button.DEFAULT_ROUNDING);

			this.unHighlight();

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(Button, $N.gui.AbstractControl);

		/**
		 * The default height the button will be if not set using setHeight
		 * @property {Number} DEFAULT_HEIGHT
		 * @readonly 40
		 */
		Button.DEFAULT_HEIGHT = 40;

		/**
		 * The default width the button will be if not set using setWidth
		 * @property {Number} DEFAULT_WIDTH
		 * @readonly 100
		 */
		Button.DEFAULT_WIDTH = 100;

		/**
		 * The default rounding the button will use if not set using setRounding
		 * @property {Number} DEFAULT_ROUNDING
		 * @readonly 0
		 */
		Button.DEFAULT_ROUNDING = 0;

		var proto = Button.prototype;

		/**
		 * Centrally positions the text label within the button.
		 * @method _positionLabel
		 * @private
		 */
		proto._positionLabel = function () {
			var x = 0, y = 0;

			if (this._labelLeft === "centre") {
				x = this._container.getWidth() / 2;
				this._label.setAlignment("centre");
			} else {
				x = parseInt(this._labelLeft, 10);
				this._label.setAlignment("left");
			}

			if (this._labelTop === "centre") {
				y = (this._container.getHeight() / 2) + (this._label.getFontSize() / 3.4);
			} else {
				y = parseInt(this._labelTop, 10);
			}

			this._label.setX(x);
			this._label.setY(y);
		};

		proto.setX = function (x) {
			Button.superClass.setX.call(this, x);
			if (this._glow) {
				this._glow.refresh();
			}
		};

		/**
		 * Given a width as a number will set the width of the button and
		 * label inside the button
		 * @method setWidth
		 * @param {Number} width
		 */
		proto.setWidth = function (width) {
			this._container.setWidth(width);
			this._label.setWidth(width);
			this._positionLabel();
		};

		/**
		 * Returns the width in pixels of the button
		 * @method getWidth
		 * @return {Number}
		 */
		proto.getWidth = function () {
			return this._container.getWidth();
		};

		/**
		 * Given a height as a number will set the height of the button and
		 * label inside the button
		 * @method setHeight
		 * @param {Number} height
		 */
		proto.setHeight = function (height) {
			this._container.setHeight(height);
		};

		/**
		 * Returns the height in pixels of the button
		 * @method getHeight
		 * @return {Number}
		 */
		proto.getHeight = function () {
			return this._container.getHeight();
		};

		/**
		 * Given a string will set the text displayed inside the button
		 * to be that of the string
		 * @method setLabel
		 * @param {String} text
		 */
		proto.setLabel = function (text) {
			this._label.setText(text);
			this._positionLabel();
		};

		/**
		 * Sets the top (Y) position of the button's label to that given. The value
		 * provided can be "centre" (centre of the button - the default) or a number (the
		 * number of pixels from the left of the button).
		 *
		 * @method setLabelTop
		 * @param {String} top the top (Y) position to use for the label.
		 */
		proto.setLabelTop = function (top) {
			this._labelTop = top;
			this._positionLabel();
		};

		/**
		 * Sets the left-hand (X) position of the button's label to that given. The value
		 * provided can be "centre" (centre of the button - the default) or a number (the
		 * number of pixels from the left of the button).
		 *
		 * @method setLabelLeft
		 * @param {String} left the left (X) position to use for the label.
		 */
		proto.setLabelLeft = function (left) {
			this._labelLeft = left;
			this._positionLabel();
		};

		/**
		 * Returns the label
		 * @method getLabel
		 * @return {String}
		 */
		proto.getLabel = function () {
			return this._label;
		};

		/**
		 * Sets the button image.
		 * @method setImage
		 * @param {String} image URL of the image.
		 */
		proto.setImage = function (image) {
			this._image.setHref(image);
		};

		/**
		 * Sets the left edge of the image within the button.
		 * @method setImageLeft
		 * @param {Number} left The left edge.
		 */
		proto.setImageLeft = function (left) {
			this._image.setX(left);
		};

		/**
		 * Sets the top edge of the image within the button.
		 * @method setImageTop
		 * @param {Number} top The top edge.
		 */
		proto.setImageTop = function (top) {
			this._image.setY(top);
		};

		/**
		 * Given a radius value in pixels will set the rounding of the
		 * button container
		 * @method setRounding
		 * @param {Number} rounding
		 */
		proto.setRounding = function (rounding) {
			this._container.setRounding(rounding);
		};

		/**
		 * Returns the rounding value
		 * @method getRounding
		 * @return {Number} rounding
		 */
		proto.getRounding = function () {
			return this._container.getRounding();
		};

		/**
		 * Sets the CSS of the button components such that it is
		 * shown as disabled not being able to receive focus
		 * @method showDisabled
		 */
		proto.showDisabled = function () {
			this._container.setCssClass(this._containerDisabledCSS);
			this._label.setCssClass(this._labelDisabledCSS);
			this._image.setCssClass(this._imageDisabledCSS);
			this._positionLabel();
		};

		/**
		 * Sets the CSS of the button components such that it is
		 * shown as enabled and being able to receive focus
		 * @method showEnabled
		 */
		proto.showEnabled = function () {
			this._container.setCssClass(this._containerCSS);
			this._label.setCssClass(this._labelCSS);
			this._image.setCssClass(this._imageCSS);
			this._positionLabel();
		};

		/**
		 * Focuses the button so that it is deemed to be highlighted in a
		 * form for example.
		 * @method highlight
		 */
		proto.highlight = function () {
			this._container.setCssClass(this._containerHighlightCSS);
			this._label.setCssClass(this._labelHighlightCSS);
			this._image.setCssClass(this._imageHighlightCSS);
			this._positionLabel();
			if (this._highlightedCallback) {
				this._highlightedCallback();
			}
			if (this._glow) {
				this._glow.show();
			}
		};

		/**
		 * Defocuses the button so that it is shown as normal.
		 * @method unHighlight
		 */
		proto.unHighlight = function () {
			if (this._enabled) {
				this.showEnabled();
			} else {
				this.showDisabled();
			}
			if (this._glow) {
				this._glow.hide();
			}
		};

		/**
		 * Sets the behaviour of the button when ok button is pressed,
		 * the passed in callback will be executed, behaviour can be
		 * cleared by passing null.
		 * @method setSelectedCallback
		 * @param {Function} callback
		 */
		proto.setSelectedCallback = function (callback) {
			this._selectedCallback = callback;
		};

		/**
		 * Sets the CSS class of the button component.
		 * @method setCssClass
		 * @param {String} cssClass
		 */
		proto.setCssClass = function (cssClass) {
			this._containerCSS = cssClass;
			this._container.setCssClass(cssClass);
		};

		/**
		 * Sets the CSS class of the button component when highlighted.
		 * @method setHighlightCssClass
		 * @param {String} cssClass
		 */
		proto.setHighlightCssClass = function (cssClass) {
			this._containerHighlightCSS = cssClass;
		};

		/**
		 * Sets the CSS class of the button component when disabled.
		 * @method setDisabledCssClass
		 * @param {String} cssClass
		 */
		proto.setDisabledCssClass = function (cssClass) {
			this._containerDisabledCSS = cssClass;
		};

		/**
		 * Sets the CSS class of the text label.
		 * @method setLabelCssClass
		 * @param {String} cssClass
		 */
		proto.setLabelCssClass = function (cssClass) {
			this._labelCSS = cssClass;
			this._label.setCssClass(cssClass);
			this._positionLabel();
		};

		/**
		 * Sets the CSS class of the text label when highlighted.
		 * @method setLabelHighlightCssClass
		 * @param {String} cssClass
		 */
		proto.setLabelHighlightCssClass = function (cssClass) {
			this._labelHighlightCSS = cssClass;
		};

		/**
		 * Sets the CSS class of the text label when disabled.
		 * @method setLabelDisabledCssClass
		 * @param {String} cssClass
		 */
		proto.setLabelDisabledCssClass = function (cssClass) {
			this._labelDisabledCSS = cssClass;
		};

		/**
		 * Sets the CSS class of the image.
		 * @method setImageCssClass
		 * @param {String} cssClass
		 */
		proto.setImageCssClass = function (cssClass) {
			this._imageCSS = cssClass;
			this._image.setCssClass(cssClass);
		};

		/**
		 * Sets the CSS class of the image when highlighted.
		 * @method setImageHighlightCssClass
		 * @param {String} cssClass
		 */
		proto.setImageHighlightCssClass = function (cssClass) {
			this._imageHighlightCSS = cssClass;
		};

		/**
		 * Sets the CSS class of the image when disabled.
		 * @method setImageDisabledCssClass
		 * @param {String} cssClass
		 */
		proto.setImageDisabledCssClass = function (cssClass) {
			this._imageDisabledCSS = cssClass;
		};

		/**
		 * Returns the CSS class of the button.
		 * @method getCssClass
		 * @return {String} cssClass
		 */
		proto.getCssClass = function () {
			return this._containerCSS;
		};

		/**
		 * Returns the CSS class of the text label.
		 * @method getLabelCssClass
		 * @return {String} cssClass
		 */
		proto.getLabelCssClass = function () {
			return this._labelCSS;
		};

		/**
		 * Allows the enabling or disabling of a button.
		 * @method setEnabled
		 * @param {Boolean} enabled Button will be enabled if true or "true"
		 */
		proto.setEnabled = function (enabled) {
			if (enabled === true || enabled === "true") {
				this._enabled = true;
				this.showEnabled();
			} else {
				this._enabled = false;
				this.showDisabled();
			}
		};

		/**
		 * Returns true if this button is enabled.
		 * @method isEnabled
		 * @return {Boolean} true if the button is enabled
		 */
		proto.isEnabled = function () {
			return this._enabled;
		};

		/**
		 * Sets the highlight glow colour for the button.
		 * @method setHighlightGlowColour
		 * @deprecated use CSS3 for HTML
		 * @param {String} colour An RGB hash colour string, such as #FF00FF
		 */
		proto.setHighlightGlowColour = function (colour) {
			this._glowColour = colour;
			if (!this._glow && this._glowIntensity) {
				this._glow = new $N.gui.OuterGlow(this._docRef, this, this._glowColour, this._glowIntensity);
				this._glow.hide();
			}
		};

		/**
		 * Sets the highlight glow intensity for the button.
		 * @method setHighlightGlowIntensity
		 * @deprecated use CSS3 for HTML
		 * @param {Number} intensity The intensity of the highlight glow
		 */
		proto.setHighlightGlowIntensity = function (intensity) {
			this._glowIntensity = intensity;
			if (!this._glow && this._glowColour) {
				this._glow = new $N.gui.OuterGlow(this._docRef, this, this._glowColour, this._glowIntensity);
				this._glow.hide();
			}
		};

		/**
		 * Defines the behaviour that should occur on keys being
		 * received.
		 * @method keyHandler
		 * @param {String} key
		 * @return (Boolean} True if the key press was handled.
		 */
		proto.keyHandler = function (key) {
			var keys = $N.gui.FrameworkCore.getKeys();
			if (key === keys.KEY_OK && this._selectedCallback) {
				this._selectedCallback();
				return true;
			}
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.Button = Button;
		return Button;
	}
);