/**
 * MultiLineTextBox provides an implementation of a multi line text area control
 * (useful for adding to a Form control).
 *
 * Note, that the MultiLineTextBox control leaves the character input implementation
 * to the implementor.  The content of the text box is set using the setText method.
 * Therefore, you may need to make use of a virtual keyboard, and pass the returned
 * string back to the MultiLineTextBox.
 *
 * Example Markup :
 *
 *     <nagra:multiLineTextBox id="myTextBox" x="200" y="200" width="400" height="200" fontSize="12" />
 *
 * Example JavaScript :
 *
 *     $N.gui.FrameworkCore.extendWithGUIObjects(document.documentElement, view);
 *     // create an initial value for our text box
 *     view.myTextBox.setText("Please enter your name here.");
 *     var me = this;
 *     // lets create a keyboard dialogue and pass the result into our MultiLineTextBox
 *     var dialog = new $N.dialog.KeyboardDialog("myKeyboard", "Your Name :", function (result) {
 *         me.view.myTextBox.setText(result);
 *     });
 *     $N.dialog.DialogManager.showDialog(dialog, $N.dialog.DialogManager.LOW_PRIORITY, $N.dialog.DialogManager.DEFAULT_AUTO_CLOSE_TIMEOUT, null, null, null);
 *
 * The above example uses a virtual keyboard dialogue to capture character entry and update the text of the MultiLineTextBox.
 * Note that the dialogue used is purely for illustration purposes and is not part of the core JSFW,
 * but is provided in the SDK Workshop as an example implementation of a virtual keyboard (see Dialogue Workshop example 5).
 *
 * The text within the ScrollingTextArea can be formatted (styled). For more information on this,
 * please read the class-level jsdocs for `$N.gui.TextArea`.
 *
 * @class $N.gui.MultiLineTextBox
 * @extends $N.gui.GUIObject
 *
 * @requires $N.gui.Container
 * @requires $N.gui.TextArea
 * @requires $N.gui.Util
 * @requires $N.gui.GUIObject
 *
 * @constructor
 * @param {Object} docRef DOM Document
 */
define('jsfw/gui/GUIObjects/Controls/MultiLineTextBox',
    [
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Components/TextArea',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/GUIObject'
    ],
    function (Container, TextArea, Util, GUIObject) {

		function MultiLineTextBox(docRef, parent) {

			MultiLineTextBox.superConstructor.call(this, docRef);

			this._container = new $N.gui.Container(docRef);
			this._textArea = new $N.gui.TextArea(docRef, this._container);

			this._rootElement = this._container.getRootElement();

			this._width = 0;
			this._height = 0;

			this._container.setCssClass("multiline_textbox_bg");
			this._container.setRounding(16);
			this._textArea.setX(20);
			this._textArea.setY(20);
			this._textArea.setCssClass("multiline_textbox_text");

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(MultiLineTextBox, $N.gui.GUIObject);

		/**
		 * Set CSS styling methods
		 * @method setContainerCssStyle
		 * @deprecated use setContainerCssClass
		 * @param {Object} style
		 */
		MultiLineTextBox.prototype.setContainerCssStyle = function (style) {
			this._container.setCssStyle(style);
		};

		/**
		 * Set CSS class for styling the background container
		 * @method setContainerCssClass
		 * @param {Object} style
		 */
		MultiLineTextBox.prototype.setContainerCssClass = function (cssClass) {
			this._container.setCssClass(cssClass);
		};

		/**
		 * Sets the width of the MultiLineTextBox
		 * @method setWidth
		 * @param {Number} iw
		 */
		MultiLineTextBox.prototype.setWidth = function (iw) {
			this._width = iw;
			this._container.setWidth(this._width);
			this._textArea.setWidth(this._width - 40); //TODO: implement a padding method.
		};

		/**
		 * Sets the height of the MultiLineTextBox
		 * @method setHeight
		 * @param {Number} ih
		 */
		MultiLineTextBox.prototype.setHeight = function (ih) {
			this._height = ih;
			this._container.setHeight(this._height);
			this._textArea.setHeight(this._height - 40);
		};

		/**
		 * Sets the text of the MultiLineTextBox
		 * @method setText
		 * @param {String} text
		 */
		MultiLineTextBox.prototype.setText = function (text) {
			this._textArea.setText(text);
		};

		/**
		 * Sets the font size for the text in the MultiLineTextBox
		 * @method setFontSize
		 * @param {Number} size
		 */
		MultiLineTextBox.prototype.setFontSize = function (size) {
			this._textArea.setFontSize(size);
		};

		/**
		 * Defines the escape character or string to use for styling definitions. See method
		 * `$N.gui.TextArea.setStylingEscape` for more information.
		 *
		 * @method setStylingEscape
		 * @param {Object} stylingEscape the new escape char/string to use for styling definitions.
		 */
		MultiLineTextBox.prototype.setStylingEscape = function (stylingEscape) {
			this._textArea.setStylingEscape(stylingEscape);
		};

		/**
		 * Returns the width of the MultiLineTextBox
		 * @method getWidth
		 * @return {Number} the width of the MultiLineTextBox
		 */
		MultiLineTextBox.prototype.getWidth = function () {
			return this._width;
		};

		/**
		 * Returns the height of the MulitLineTextBox
		 * @method getHeight
		 * @return {Number} the height of the MultiLineTextBox
		 */
		MultiLineTextBox.prototype.getHeight = function () {
			return this._height;
		};

		/**
		 * Returns the text within the MulitLineTextBox
		 * @method getText
		 * @return {String} The text within the MultiLineTextBox
		 */
		MultiLineTextBox.prototype.getText = function () {
			return this._textArea.getText();
		};

		/**
		 * Returns the font size of the text within the MulitLineTextBox
		 * @method getFontSize
		 * @return {Number} The font size of the text within the MulitLineTextBox
		 */
		MultiLineTextBox.prototype.getFontSize = function () {
			return this._textArea.getFontSize();
		};

		/**
		 * Returns the class name for the MulitLineTextBox
		 * @method getClassName
		 * @return The class name for the MulitLineTextBox
		 */
		MultiLineTextBox.prototype.getClassName = function () {
			return "MultiLineTextBox";
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.MultiLineTextBox = MultiLineTextBox;
		return MultiLineTextBox;
	}
);