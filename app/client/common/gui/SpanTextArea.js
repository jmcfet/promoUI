/**
 * @class $N.gui.SpanTextArea
 * @constructor
 * @extends $N.gui.TextArea
 *
 * @requires $N.gui.GUIObject
 * @requires $N.gui.Util
 * @param {Object} docRef DOM document
 * @param {Object} [parent]
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


	function SpanTextArea(docRef, parent) {

		SpanTextArea.superConstructor.call(this, docRef);

		this._spanElement = null;
		this._spanCssClass = "SpanTextAreaText";

		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(SpanTextArea, $N.gui.TextArea);

	/**
	 * Sets the CSS class to be used for spanned text.
	 * @method setSpanCssClass
	 * @param {String} cssClass
	 */
	SpanTextArea.prototype.setSpanCssClass = function (cssClass) {
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
	SpanTextArea.prototype.setSpanOnText = function (text) {
		if (text) {
			var textToSearch = this.getText().toUpperCase(),
				searchText = text.toUpperCase(),
				regEx,
				indexOfText,
				lastIndex = 0,
				span = null;

			indexOfText = textToSearch.indexOf(searchText);

			if (indexOfText > -1) {
				if (indexOfText > 0) {
					this._innerSVG.textContent = this.getText().substring(0, indexOfText);
				} else {
					this._innerSVG.textContent = "";
				}
				lastIndex = indexOfText + text.length;
				this._spanElement = domAbstraction.createElement(this._docRef, this._innerSVG);
				this._spanElement.textContent = this.getText().substring(indexOfText, lastIndex);
				this._spanElement.setAttribute("class", this._spanCssClass);
				this._innerSVG.appendChild(this._spanElement);
				if (lastIndex < this.getText().length) {
					span = domAbstraction.createElement(this._docRef, this._innerSVG);
					span.textContent = this.getText().substring(lastIndex, this.getText().length);
					this._innerSVG.appendChild(span);
				}
			}
		} else {
			this.setText(this.getText());
		}
	};

	/**
	 * Return the name of this JavaScript class
	 * @method getClassName
	 * @return {String} The class name.
	 */
	SpanTextArea.prototype.getClassName = function () {
		return ("SpanTextArea");
	};
	$N.gui = $N.gui || {};
	$N.gui.SpanTextArea = SpanTextArea;
}($N || {}));
