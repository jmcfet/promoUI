/**
 * DiacriticSpanLabel is an implementation of AbstractComponent which inherits from Label.
 * It is used in the same way as a label but also allows a diacritic-insensitive matching
 * substring in the text content to be extracted into a span for
 * separate styling.
 *
 * Example markup:
 *
 *     <nagra:DiacriticSpanLabel id="message" x="10" y="10" spanCssClass="highlightText">
 *
 * The spanned text is dynamic and would usually be defined within the JavaScript using the setSpanOnText method.
 *
 * Example JavaScript:
 *
 *     view.message.setText("Today is Tuesday.");
 *     view.message.setSpanOnText("Tuesday");
 *
 * @class $N.gui.DiacriticSpanLabel
 * @constructor
 * @extends $N.gui.Label
 * @requires $N.gui.GUIObject
 * @requires $N.gui.AbstractComponent
 * @requires $N.gui.Util
 * @author mbrown
 * @param {Object} docRef DOM object
 * @param {Object} parent GUI Object
 */
(function ($N) {
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

	function DiacriticSpanLabel(docRef, parent) {
		DiacriticSpanLabel.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "DiacriticSpanLabel");
		this._spanElement = null;
		this._spanCssClass = "DiacriticSpanLabelText";
		this._caseSensitive = true;
		this._firstWordsOnly = false;
		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(DiacriticSpanLabel, $N.gui.Label);

	/**
	 * Sets the CSS class to be used for spanned text.
	 * @method setSpanCssClass
	 * @param {String} cssClass
	 */
	DiacriticSpanLabel.prototype.setSpanCssClass = function (cssClass) {
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
	DiacriticSpanLabel.prototype.setSpanOnText = function (text) {
		var textToSearch,
			searchText,
			regEx,
			indexOfText,
			lastIndex = 0,
			span = null,
			joinedText,
			i;
		if (text && (typeof (text) === "string")) {
			textToSearch = (this._caseSensitive) ? this.getText() : this.getText().toUpperCase();
			searchText = (this._caseSensitive) ? text : text.toUpperCase();
			lastIndex = 0;
			span = null;
			searchText = $N.app.SearchCriteriaUtil.getDiacriticisedKeyword(searchText);
			if (this._firstWordsOnly) {
				regEx = new RegExp("(^" + searchText + "|\\s+" + searchText + ")", 'i');
				indexOfText = textToSearch.search(regEx);
				if (indexOfText > -1) {
					while (textToSearch.charAt(indexOfText) === " ") {
						indexOfText++;
					}
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
		} else if (text && (typeof (text) === "object")) {
			for (i = 0; i < text.length; i++) {
				this.setSpanOnText(text[i]);
			}
			joinedText = text.join(" ");
			this.setSpanOnText(joinedText);
		} else {
			this.setText(this.getText());
		}
	};

	/**
	 * Sets whether the case should affect span text
	 * @method setCaseSensitive
	 * @param {Boolean} flag
	 */
	DiacriticSpanLabel.prototype.setCaseSensitive = function (flag) {
		this._caseSensitive = flag;
	};

	/**
	 * Sets whether the span should search for the term at the
	 * beginning of words
	 * @method setFirstWordsOnly
	 * @param {Boolean} flag
	 */
	DiacriticSpanLabel.prototype.setFirstWordsOnly = function (flag) {
		this._firstWordsOnly = flag;
	};

	/**
	 * Return the name of this JavaScript class
	 * @method getClassName
	 * @return {String} The class name.
	 */
	DiacriticSpanLabel.prototype.getClassName = function () {
		return ("DiacriticSpanLabel");
	};

	$N.gui = $N.gui || {};
	$N.gui.DiacriticSpanLabel = DiacriticSpanLabel;
}($N || {}));
