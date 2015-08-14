/**
 * `StyledTextArea` is an implementation of `AbstractComponent`.
 *
 * It is used for displaying text on a mark-up page or used to build controls. Text is
 * wrapped to the dimensions of the `StyledTextArea` width. CSS styling can
 * be applied to arbitrary sections of the text.
 *
 * A styled text area's content can either be set in the same way as with `$N.gui.TextArea`
 * (using the `setText/code> method and the `text` attribute in mark-up), or built up
 * using a combination of span objects (containing text and CSS styling) and newline objects.
 * Please note that EITHER the "set content" approach OR the "build content" approach should be used,
 * not a mixture of both. If the "build content" method approach is used, then subsequent calls to
 * method `getText` will return inaccurate content.
 *
 * Example mark-up using the "set content" approach:
 *
 *     <nagra:styledTextArea id="myStyledTextArea" text="My text."/>
 *
 * Note that styling (including newlines) can NOT be applied using this approach.
 * Example mark-up using the "build content" method:
 *
 *     <nagra:styledTextArea id="myStyledTextArea">
 *         <nagra:spanObject text="Green text." cssClass="green"/>
 *         <nagra:newlineObject/>
 *         <nagra:spanObject text="Blue text." cssClass="blue"/>
 *     </nagra:styledTextArea>
 *
 * Note that newlines can be added in mark-up by embedding `nagra:newlineObject`s.
 * Example code using the "set content" approach:
 *
 *     var styledTextArea = new StyledTextArea(document),
 *         greenSpanObject = new SpanObject(),
 *         blueSpanObject = new SpanObject();

 *     greenSpanObject.setText("Green text.\n");
 *     greenSpanObject.setCssClass("green");
 *     blueSpanObject.setText("Blue text.");
 *     blueSpanObject.setCssClass("blue");

 *     styledTextArea.addChild(greenSpanObject);
 *     styledTextArea.addChild(blueSpanObject);
 *
 * Please note that newlines can be added in code in three ways:
 *     <ol type="1">
 *         <li>Using the `\n` character, embedded within text </li>(as in the above example)
 *         <li>Using a `NewlineObject`:
 *             `styledTextArea.addChild($N.gui.NewlineObject.instance);`
 *         </li>
 *         <li>Using StyledTextArea's addNewline method:
 *             `styledTextArea.addNewline();`
 *         </li>
 *     </ol>
 * Please also note:
 * <ol type="1">
 *   <li>Although `$N.gui.TextArea` has a functioning `setText`
 *       method, `StyledTextArea` does not. Please use the
 *       `addChild` and `addNewline` methods to add objects
 *       representing text spans and newlines.</li>
 *   <li>`StyledTextArea` does not support the CSS attribute
 *       `font-size`. In some circumstances, different lines of text will
 *       not be spaced correctly.</li>
 * </ol>
 *
 * @class $N.gui.StyledTextArea
 * @extends $N.gui.TextArea
 *
 * @requires $N.gui.Util
 * @requires $N.gui.TextArea
 * @constructor
 */
define('jsfw/gui/GUIObjects/Components/StyledTextArea',
    [
    'jsfw/gui/GUIObjects/Components/TextArea',
    'jsfw/gui/helpers/Util'
    ],
    function (TextArea, Util) {

		var domAbstraction = $N.gui.TextArea.domAbstraction;
		function StyledTextArea(docRef, parent) {
			StyledTextArea.superConstructor.call(this, docRef, parent);
			if (parent) {
				parent.addChild(this);
			}
		}
		$N.gui.Util.extend(StyledTextArea, $N.gui.TextArea);

		/**
		 * Removes the children objects from this styled text area, in the event that you
		 * want to replace its contents from scratch.
		 *
		 * @method clearChildren
		 */
		StyledTextArea.prototype.clearChildren = function () {
			this._clearText();
		};

		/**
		 * Adds the given string as a text node inside the styled text area's DOM. If the
		 * string contains newlines, then these will be rendered as line-break nodes as
		 * necessary.
		 *
		 * @method _addChildString
		 * @private
		 * @param {String} child the text to add (append) to the styled text area's content.
		 */
		StyledTextArea.prototype._addChildString = function (child) {
			var newNode;

			if (child.indexOf("\n") === -1) {
				newNode = domAbstraction.createSpanElement(this._docRef);
				newNode.appendChild(this._docRef.createTextNode(child));
				this._innerElement.appendChild(newNode);
			} else {
				this._addNewlinedText(this._innerElement, child);
			}
		};

		/**
		 * Adds the text and optional associated CSS styling in the given
		 * `$N.gui.SpanObject` as a node inside the styled text area's DOM. If the
		 * text contains newlines, then these will be rendered as line-break nodes as
		 * necessary.
		 *
		 * @method _addChildSpan
		 * @private
		 * @param {Object} child the span object to add (append) to the styled text area's content.
		 */
		StyledTextArea.prototype._addChildSpan = function (child) {
			var newNode;

			if (child.hasNewlines()) {
				newNode = domAbstraction.createSpanElement(this._docRef);
				if (child.hasCssClass()) {
					newNode.setAttribute("class", child.getCssClass());
				}
				this._addNewlinedText(newNode, child.getText());
				this._innerElement.appendChild(newNode);
			} else {
				this._innerElement.appendChild(child.getSpanNode(this._docRef));
			}
		};

		/**
		 * Adds an object to this `StyledTextArea`, and updates the mark-up.
		 * The `child` is appended to the end of the existing children (if
		 * any), and can be one of:
		 * <ol type="1">
		 *   <li>A `$N.gui.SpanObject` (text and CSS styling)</li>
		 *   <li>A `String` (raw text with no specific CSS styling)</li>
		 *   <li>A `$N.gui.NewlineObject` (a newline)</li>
		 * </ol>
		 *
		 * Do not use this method if you have used method `setText` or used
		 * the "text" attribute of `StyledTextArea` within the mark-up.
		 *
		 * @method addChild
		 * @param {Object} child an `$N.gui.SpanObject` representing the text (and an
		 *                        optional CSS class name) to add (append) to the textual content.
		 */
		StyledTextArea.prototype.addChild = function (child) {
			if (typeof child === "string") {
				this._addChildString(child);
			} else if (child.getClassName() === "SpanObject") {
				this._addChildSpan(child);
			} else if (child.getClassName() === "NewlineObject") {
				this.addNewline();
			} else {
				throw ("Unknown child object to add: " + String(child));
			}
		};

		/**
		 * Appends a newline child to the `StyledTextArea`. This is the equivalent
		 * of embedding a "\n" inside the text to display, or adding a child which is a
		 * `$N.gui.NewlineObject`.
		 *
		 * Do not use this method if you have used method `setText` or used the
		 * "text" attribute of `StyledTextArea` within the mark-up.
		 *
		 * @method addNewline
		 */
		StyledTextArea.prototype.addNewline = function () {
			this._addNewline(this._docRef, this._innerElement);
		};

		/**
		 * Returns the name of this JavaScript class.
		 *
		 * @method getClassName
		 * @return {String}  the JavaScript class name.
		 */
		StyledTextArea.prototype.getClassName = function () {
			return ("StyledTextArea");
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.StyledTextArea = StyledTextArea;
		return StyledTextArea;
    }
);