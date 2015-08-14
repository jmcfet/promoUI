/**
 * SpanLabel is an implementation of AbstractComponent which inherits from Label.
 * It is used in the same way as a label but also allows a matching
 * substring in the text content to be extracted into a span for
 * separate styling.
 *
 * Example markup:
 *
 *     <nagra:spanLabel id="message" x="10" y="10" spanCssClass="highlightText">
 *
 * The spanned text is dynamic and would usually be defined within the JavaScript using the setSpanOnText method.
 *
 * Example JavaScript:
 *
 *     view.message.setText("Today is Tuesday.");
 *     view.message.setSpanOnText("Tuesday");
 *
 * @class $N.gui.SpanLabel
 * @extends $N.gui.Label
 *
 * @requires $N.gui.GUIObject
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @author mbrown
 * @constructor
 * @param {Object} docRef DOM object
 * @param {Object} parent GUI Object
 */
define('jsfw/gui/GUIObjects/Components/SpanLabel',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/helpers/Util'
    ],
    function (GUIObject, Label, Util) {

		var domAbstraction = {
			SVG: {
				createElement: function (docRef, rootSVGRef) {
					return docRef.createElement("tspan");
				}
			},
			HTML: {
				createElement: function (docRef, rootSVGRef) {
					return docRef.createElement("span");
				}
			}
		}[$N.gui.GUIObject.mode];


		function SpanLabel(docRef, parent) {

			SpanLabel.superConstructor.call(this, docRef);

			this._spanElement = null;
			this._spanCssClass = "SpanLabelText";
			this._caseSensitive = true;
			this._firstWordsOnly = false;

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(SpanLabel, $N.gui.Label);

		var proto = SpanLabel.prototype;

		/**
		 * Sets the CSS class to be used for spanned text.
		 * @method setSpanCssClass
		 * @param {String} cssClass
		 */
		proto.setSpanCssClass = function (cssClass) {
			this._spanCssClass = cssClass;
			if (this._spanElement) {
				this._spanElement.setAttribute("class", this._spanCssClass);
			}
		};

		/**
		 * Sets the text that should be spanned if the given string
		 * is found as a substring of the labels text
		 * @method setSpanOnText
		 * @param text
		 */
		proto.setSpanOnText = function (text) {
			if (text) {
				var textToSearch = (this._caseSensitive) ? this.getText() : this.getText().toUpperCase();
				var searchText = (this._caseSensitive) ? text : text.toUpperCase();
				var regEx;
				var indexOfText;
				var lastIndex = 0;
				var span = null;

				if (this._firstWordsOnly) {
					regEx = new RegExp("(^" + searchText + "|\\s+" + searchText + ")", 'i');
					indexOfText = textToSearch.search(regEx);
					if (indexOfText > -1 && textToSearch.charAt(indexOfText) === " ") {
						indexOfText++;
					}
				} else {
					indexOfText = textToSearch.indexOf(searchText);
				}

				if (indexOfText > -1) {
					if (indexOfText > 0) {
						this._innerElement.textContent = this.getText().substring(0, indexOfText);
					} else {
						this._innerElement.textContent = "";
					}
					lastIndex = indexOfText + text.length;
					this._spanElement = domAbstraction.createElement(this._docRef, this._innerElement);
					this._spanElement.textContent = this.getText().substring(indexOfText, lastIndex);
					this._spanElement.setAttribute("class", this._spanCssClass);
					this._innerElement.appendChild(this._spanElement);
					if (lastIndex < this.getText().length) {
						span = domAbstraction.createElement(this._docRef, this._innerElement);
						span.textContent = this.getText().substring(lastIndex, this.getText().length);
						this._innerElement.appendChild(span);
					}
				}
			} else {
				this.setText(this.getText());
			}
		};

		/**
		 * Sets whether the case should affect span text
		 * @method setCaseSensitive
		 * @param {Boolean} flag
		 */
		proto.setCaseSensitive = function (flag) {
			this._caseSensitive = flag;
		};

		/**
		 * Sets whether the span should search for the term at the
		 * beginning of words
		 * @method setFirstWordsOnly
		 * @param {Boolean} flag
		 */
		proto.setFirstWordsOnly = function (flag) {
			this._firstWordsOnly = flag;
		};

		/**
		 * Return the name of this JavaScript class
		 * @method getClassName
		 * @return {String} The class name.
		 */
		proto.getClassName = function () {
			return ("SpanLabel");
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.SpanLabel = SpanLabel;
		return SpanLabel;
    }
);