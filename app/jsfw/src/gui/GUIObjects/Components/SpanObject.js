/**
 * A span object is a simple GUI object that defines a block of text with CSS styling. This object
 * is designed for use with styled text GUI components, such as
 * `$N.gui.StyledTextArea`.
 *
 * Example mark-up (using an `$N.gui.StyledTextArea`):
 *
 *     <nagra:styledTextArea id="myStyledTextArea">
 *         <nagra:spanObject id="mySpan1" text="Green text." cssClass="green"/>
 *         <nagra:spanObject id="mySpan1" text="Blue text." cssClass="blue"/>
 *     </nagra:styledTextArea>
 *
 * Example code:
 *
 *     var styledTextArea = new styledTextArea(document),
 *         greenSpanObject = new SpanObject(),
 *         blueSpanObject = new SpanObject();
 *     greenSpanObject.setText("Green text.\n");
 *     greenSpanObject.setCssClass("green");
 *     blueSpanObject.setText("Blue text.");
 *     blueSpanObject.setCssClass("blue");
 *     styledTextArea.addChild(greenSpanObject);
 *     styledTextArea.addChild(blueSpanObject);
 *
 * Note: A single `SpanObject` instance may be used (appended) multiple times.
 * This is recommended in order to save memory.
 *
 * @class $N.gui.SpanObject
 * @extends $N.gui.AbstractComponent
 * @requires $N.gui.GUIObject
 * @requires $N.gui.AbstractComponent
 * @requires $N.gui.Util
 * @constructor
 * @param {Object} docRef reference to the DOM document object
 * @param {Object} [parent=null] reference to the parent GUIObject
 */

define('jsfw/gui/GUIObjects/Components/SpanObject',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/AbstractComponent',
    'jsfw/gui/helpers/Util'
    ],
    function (GUIObject, AbstractComponent, Util) {

		var domAbstraction = {
			SVG: {
				createSpanElement: function (docRef) {
					return docRef.createElement("tspan");
				}
			},
			HTML: {
				createSpanElement: function (docRef) {
					return docRef.createElement("span");
				}
			},
		}[$N.gui.GUIObject.mode];

		function SpanObject(docRef, parent) {
			SpanObject.superConstructor.call(this, docRef);
			this._rootElement = docRef;

			this._text = "";
			if (parent) {
				parent.addChild(this);
			}
		}
		$N.gui.Util.extend(SpanObject, $N.gui.AbstractComponent);

		/**
		 * Set the text that this span should contain. If no argument is provided, then
		 * the text will be set as an empty string.
		 *
		 * @method setText
		 * @param {String} text the text to set inside this span.
		 */
		SpanObject.prototype.setText = function (text) {
			this._text = text || "";
		};

		/**
		 * Set the name of the CSS class that this span should use for styling.
		 *
		 * @method setCssClass
		 * @param {String} text the CSS styling to use for this span.
		 */
		SpanObject.prototype.setCssClass = function (cssClass) {
			this._cssClass = cssClass;
		};

		/**
		 * Returns the text that has been set inside this span, which will be an empty
		 * string if no text has hitherto been set.
		 *
		 * @method getText
		 * @return {String} the text inside this span.
		 */
		SpanObject.prototype.getText = function () {
			return this._text;
		};

		/**
		 * Returns the name of the CSS class that this span should use for styling.
		 *
		 * @method getCssClass
		 * @return {String} setCssClass  the CSS styling being used for this span.
		 */
		SpanObject.prototype.getCssClass = function () {
			return this._cssClass;
		};

		/**
		 * Returns whether the text set inside this span contains one or more newline
		 * (`'\n'`) characters.
		 *
		 * @method hasNewlines
		 * @return {Boolean} true if the span's text contains newlines; false if not.
		 */
		SpanObject.prototype.hasNewlines = function () {
			return this._text.indexOf("\n") > -1;
		};

		/**
		 * Returns whether a CSS class has been set inside this span object.
		 *
		 * @method hasCssClass
		 * @return {Boolean} true if the span has a CSS class; false if not.
		 */
		SpanObject.prototype.hasCssClass = function () {
			return this._cssClass && this._cssClass.length !== 0;
		};

		/**
		 * Create and return a new span node that contains the text and (if set) the CSS class
		 * stored within this span object. Note: Escapes (such as the '\n' newline escape) are
		 * ignored; all the text set inside this object is taken as a literal.
		 *
		 * @method getSpanNode
		 * @return a span element representing the contents of this span object.
		 */
		SpanObject.prototype.getSpanNode = function () {
			var spanElement = domAbstraction.createSpanElement(this._rootElement);

			spanElement.appendChild(this._rootElement.createTextNode(this._text));
			// If a CSS class was defined, then set it
			if (this._cssClass) {
				spanElement.setAttribute("class", this._cssClass);
			}

			return spanElement;
		};

		/**
		 * Return the class name of this component.
		 * @method getClassName
		 * @return {string}
		 */
		SpanObject.prototype.getClassName = function () {
			return ("SpanObject");
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.SpanObject = SpanObject;
		return SpanObject;
    }
);