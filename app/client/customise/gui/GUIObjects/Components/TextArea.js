/**
 * `TextArea` is an implementation of `AbstractComponent`.
 *
 * It is used for displaying text on a mark-up page or used to build controls.  Text is
 * wrapped to the dimensions of the `TextArea` width.
 *
 * Example mark-up:
 *
 *     <nagra:textArea id="textBox" x="10" y="10" width="150" height="100"
 *         text="This is a text box with wrapped text..."/>
 *
 * A `TextArea` can have newlines (line-breaks). To add a newline, use the '\n' character.
 * For example:
 *
 * `There is a line-break here: \nThat was a line-break.`
 *
 * @class $N.gui.TextArea
 * @extends $N.gui.AbstractComponent
 * @requires $N.gui.GUIObject
 * @requires $N.gui.AbstractComponent
 * @requires $N.gui.Util
 * @constructor
 */
define('jsfw/gui/GUIObjects/Components/TextArea',
	[
		'jsfw/gui/GUIObjects/GUIObject',
		'jsfw/gui/GUIObjects/Components/AbstractComponent',
		'jsfw/gui/helpers/Util'
	],
	function (GUIObject, AbstractComponent, Util) {

		var domAbstraction = {
			SVG: {
				createTextAreaElement: function (docRef) {
					return docRef.createElement("textArea");
				},
				createTextBreakElement: function (docRef) {
					return docRef.createElement("tbreak");
				},
				createSpanElement: function (docRef) {
					return docRef.createElement("tspan");
				},
				getContentHeight: function (guiObject) {
					var bBox = guiObject._rootElement.getBBox();
					return bBox === null ? 0 : bBox.height;
				}
			},
			HTML: {
				createTextAreaElement: function (docRef) {
					var textAreaElement = docRef.createElement("p");
					textAreaElement.style.whiteSpace = "normal";
					return textAreaElement;
				},
				createTextBreakElement: function (docRef) {
					return docRef.createElement("br");
				},
				createSpanElement: function (docRef) {
					return docRef.createElement("span");
				},
				getContentHeight: function (guiObject) {
					return window.getComputedStyle(guiObject._innerElement, null).getPropertyValue("height") || 0;
				}
			}
		}[$N.gui.GUIObject.mode];

		function TextArea(docRef, parent) {
			TextArea.superConstructor.call(this, docRef);
			this._rootElement = domAbstraction.createTextAreaElement(docRef);
			this._innerElement = this._rootElement;

			this._fontSize = 10;
			this._text = "";
			if (parent) {
				parent.addChild(this);
			}
		}
		$N.gui.Util.extend(TextArea, $N.gui.AbstractComponent);

		TextArea.prototype._mimicTextArea = null;

		/**
		 * Sets the size of the `TextArea`. Note: Setting the size here will override the CSS equivalent.
		 *
		 * @method setFontSize
		 * @param {Number} newSize the new font size to use.
		 */
		TextArea.prototype.setFontSize = function (newSize) {
			this._fontSize = newSize;
			this._innerElement.setAttribute("font-size", this._fontSize);
		};

		/**
		 * Sets the text inside the `TextArea`, and updates the mark-up. If
		 * `null` or `undefined` or nothing is passed in, then the
		 * text will be set to an empty string.
		 *
		 * @method setText
		 * @param {String} newText (Optional) the text to set inside the `TextArea`.
		 */
		TextArea.prototype.setText = function (newText) {
			var baseNode = this._innerElement;

			this._clearText();

			// If no new text was provided, consider it to be empty text
			if (!newText) {
				newText = "";
			}

			// Replace the contents of the text area with the new text
			this._text = newText;

			if (newText.indexOf("\n") > -1) {
				this._addNewlinedText(baseNode, newText);
			} else {
				baseNode.textContent = this._text;
			}
		};

		/**
		 * Appends a newline element to the given node.
		 *
		 * @method _addNewline
		 * @private
		 * @param {Object} baseNode the node from which to create a newline element.
		 * @param {Object} node     the node to append the newline node to.
		 */
		TextArea.prototype._addNewline = function (baseNode, node) {
			node.appendChild(domAbstraction.createTextBreakElement(baseNode));
		};

		/**
		 * Clears the text (including any nodes) from the text area.
		 *
		 * @method _clearText
		 * @private
		 */
		TextArea.prototype._clearText = function () {
			var baseNode = this._innerElement;
			while (baseNode.hasChildNodes()) {
				baseNode.removeChild(baseNode.lastChild);
			}
		};

		/**
		 * Parses text containing one or more newlines, and adds the text and the newlines to
		 * the given node.
		 *
		 * @method _addNewlinedText
		 * @private
		 * @param {Object} node the node to add the text and newlines to.
		 * @param {String} text the text containing newlines.
		 */
		TextArea.prototype._addNewlinedText = function (node, text) {
			var pointer = text.indexOf("\n"),
				remainingText = text,
				baseNode = this._docRef,
				textToInsert;

			while (pointer > -1) {
				textToInsert = remainingText.substring(0, pointer);
				remainingText = remainingText.substring(pointer + 1, remainingText.length);
				node.appendChild(baseNode.createTextNode(textToInsert));
				this._addNewline(baseNode, node);
				pointer = remainingText.indexOf("\n");
			}

			if (remainingText.length !== 0) {
				node.appendChild(baseNode.createTextNode(remainingText));
			}
		};

		/**
		 * Returns the current font size of the `TextArea`.
		 *
		 * @method getFontSize
		 * @return {Number}  the font size.
		 */
		TextArea.prototype.getFontSize = function () {
			return this._fontSize;
		};

		/**
		 * Returns the current text in the `TextArea`.
		 *
		 * @method getText
		 * @return {String}  the text content of the `TextArea`.
		 */

		TextArea.prototype.getText = function () {
			return this._text;
		};

		/**
		 * Returns the height of the text inside this `TextArea`.
		 * This method will only function correctly if the height of the text area has been defined
		 * as 'auto'.
		 *
		 * @method getContentHeight
		 * @return {Number} the height of the text area content of this `TextArea`.
		 */
		TextArea.prototype.getContentHeight = function () {
			// Modified from return domAbstraction.getContentHeight(this);
			return this._getMimicContentHeight();
		};

		/**
		 * Returns the name of this JavaScript class.
		 *
		 * @method getClassName
		 * @return {String}  the JavaScript class name.
		 */
		TextArea.prototype.getClassName = function () {
			return ("TextArea");
		};

		/**
		 * Sets the height of the text area element.
		 *
		 * @param {Number} height - the element height or 'auto'.
		 * @method setHeight
		 */
		TextArea.prototype.setHeight = function (height) {
			if (height === "auto") {
				this._rootElement.setAttribute('height', 'auto');
			} else {
				TextArea.superClass.setHeight.call(this, height);
			}
		};

		/**
		 * Returns the height of the text area element.
		 *
		 * @method getHeight
		 * @return {Number} the height of the text area element
		 */
		TextArea.prototype.getHeight = function () {
			var isAuto = this._rootElement.getAttribute('height') === "auto" ? true : false;
			return isAuto ? this.getContentHeight() : TextArea.superClass.getHeight.call(this);
		};

		// CUSTOMISATIONS START HERE //

		/**
		 * @method getMimicContentHeight
		 * @return {Number}
		 * @custom
		 */
		TextArea.prototype._getMimicContentHeight = function () {
			var contentHeight = 0;
			if (this._mimicTextArea && (this !== this._mimicTextArea)) {
				this._mimicTextArea.setText(this.getText());
				this._mimicTextArea.setWidth(this.getTrueWidth());
				this._mimicTextArea._innerElement.style.cssText = this._innerElement.style.cssText;
				this._mimicTextArea._innerElement.className = this._innerElement.className;
				this._mimicTextArea._innerElement.style.clip = "rect(1px, 1px, 1px, 1px)";
				contentHeight = parseFloat(domAbstraction.getContentHeight(this._mimicTextArea)) / this.resolutionVerticalFactor;
				this._mimicTextArea._innerElement.style.visibility = "hidden";
			}
			return contentHeight;
		};

		/**
		 * @method setMaxHeight
		 * @param {Number} height (optional)
		 */
		TextArea.prototype.setMaxHeight = function (height) {
			var maxHeight;
			if (height) {
				maxHeight = height * this.resolutionVerticalFactor;
				this._rootElement.style.maxHeight = maxHeight + "px";
			} else {
				this._rootElement.style.maxHeight = null;
			}
		};

		/**
		 * @method getMaxHeight
		 * @return {Number}
		 */
		TextArea.prototype.getMaxHeight = function () {
			return this._rootElement.style.maxHeight / this.resolutionVerticalFactor;
		};

		/**
		 * @method setMaxLines
		 * @param {Number} numberOfLines
		 * The TextArea will show up to a maximum numberOfLines, the rest will not be shown
		 */
		TextArea.prototype.setMaxLines = function (numberOfLines) {
			this._rootElement.style.display = "-webkit-box";
			this._rootElement.style["-webkit-box-orient"] = "vertical";

			if (numberOfLines) {
				this._rootElement.style["-webkit-line-clamp"] = numberOfLines;
			} else {
				this._rootElement.style.removeProperty("-webkit-line-clamp");
			}
		};

		/**
		 * @method getMaxLines
		 * @return {Number}
		 */
		TextArea.prototype.getMaxLines = function () {
			return this._rootElement.style["-webkit-line-clamp"];
		};

		// CUSTOMISATIONS END HERE //

		TextArea.domAbstraction = domAbstraction;

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.TextArea = TextArea;
		return TextArea;
	});