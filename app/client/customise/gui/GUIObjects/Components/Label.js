/**
 * Label is an implementation of AbstractComponent
 *
 * Creates a text element in the document for use directly in the markup or within controls.
 *
 * Example markup:
 *
 *     <nagra:label id="message" x="10" y="10" text="Hello World!">
 *
 *
 * @class $N.gui.Label
 * @extends $N.gui.AbstractComponent
 * @requires $N.gui.GUIObject
 * @requires $N.gui.AbstractComponent
 * @requires $N.gui.Util
 * @constructor
 * @param {Object} docRef
 * @param {Object} parent
 */
define('jsfw/gui/GUIObjects/Components/Label',
	[
	'jsfw/gui/GUIObjects/GUIObject',
	'jsfw/gui/GUIObjects/Components/AbstractComponent',
	'jsfw/gui/helpers/Util'
	],
	function (GUIObject, AbstractComponent, Util) {

		var domAbstraction = {
			SVG: {
				createElement: function (docRef) {
					var labelElement = docRef.createElement("text");
					return {
						root: labelElement,
						inner : labelElement
					};
				},
				updateText: function (element, text) {
					element.textContent = text;
				},
				setFontSize: function (element, size) {
					$N.gui.GUIObject.abstractedMethods.changeStyle(element, "font-size", size);
				},
				setAlignment: function (guiObject, align) {
					var element = guiObject._innerElement;
					switch (align) {
					case Label.ALIGN_RIGHT:
						$N.gui.GUIObject.abstractedMethods.changeStyle(element, "text-anchor", "end");
						break;
					case Label.ALIGN_CENTRE:
						$N.gui.GUIObject.abstractedMethods.changeStyle(element, "text-anchor", "middle");
						break;
					default:
						$N.gui.GUIObject.abstractedMethods.changeStyle(element, "text-anchor", "start");
					}
				},
				setOverflow: function (element, overflow) {
					$N.gui.GUIObject.abstractedMethods.changeStyle(element, "text-overflow", overflow);
				},
				getTextLength: function (element) {
					var length = 0;
					if (element.getBBox()) {
						length = element.getBBox().width;
					}
					return length;
				},
				getFontSize: function (innerElement) {
					try {
						return innerElement.getFloatTrait("font-size");
					} catch (err) {
						// element is not yet in render tree so return 0
						return 0;
					}
				}
			},
			HTML: {
				createElement: function (docRef) {
					// FIXES TO REMOVE CONTAINING DIV
					var labelElement = docRef.createElement("p");
					return {
						root: labelElement,
						inner: labelElement
					};
				},
				updateText: function (element, text) {
					element.innerText = text;
				},
				setFontSize: function (element, size) {
					$N.gui.GUIObject.abstractedMethods.changeStyle(element, "fontSize", size + "px");
				},
				setAlignment: function (guiObject, align) {
					var element = guiObject._innerElement;
					if (align === Label.ALIGN_LEFT) {
						$N.gui.GUIObject.abstractedMethods.changeStyle(element, "textAlign", "left");
					} else if (align === Label.ALIGN_CENTRE) {
						$N.gui.GUIObject.abstractedMethods.changeStyle(element, "textAlign", "center");
					} else if (align === Label.ALIGN_RIGHT) {
						$N.gui.GUIObject.abstractedMethods.changeStyle(element, "textAlign", "right");
					}
				},
				setOverflow: function (element, overflow) {
					$N.gui.GUIObject.abstractedMethods.changeStyle(element, "overflow", overflow);
				},
				getTextLength: function (element) {
					var indexOfPercentage = 0,
						indexOfPx = 0,
						trimmedMargin = "",
						margin = window.getComputedStyle(element, null).getPropertyValue("marginLeft");
					if (!margin) {
						return element.offsetWidth;
					} else {
						indexOfPercentage = margin.indexOf("%");
						indexOfPx = margin.toUpperCase().indexOf("PX");
						if (indexOfPercentage !== -1) {
							trimmedMargin = parseInt(margin.substring(0, indexOfPercentage), 10);
							if (trimmedMargin > 0) {
								return element.offsetWidth;
							} else {
								return (element.offsetWidth * 100 / (100 - trimmedMargin));
							}
						} else if (indexOfPx !== -1) {
							trimmedMargin = margin.substring(0, indexOfPx);
							return (element.offsetWidth - Math.abs(trimmedMargin));
						} else {
							return element.offsetWidth;
						}
					}
				},
				getFontSize: function (innerElement) {
					var fontSize = window.getComputedStyle(innerElement, null).getPropertyValue("font-size");
					if (fontSize) {
						return parseInt(fontSize.substr(0, fontSize.length - 2), 10);
					} else {
						return 0;
					}

				}
			}
		}[$N.gui.GUIObject.mode];

		function Label(docRef, parent) {

			Label.superConstructor.call(this, docRef);
			var element =  domAbstraction.createElement(docRef);
			this._rootElement = element.root;
			this._innerElement = element.inner;

			this._text = "";
			this._textOverflow = "none";
			this._alignment = Label.ALIGN_LEFT;

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(Label, $N.gui.AbstractComponent);

		Label.prototype._mimicLabel = null;

		/**
		 * Align text left
		 * @property {String} ALIGN_LEFT
		 * @readonly
		 */
		Label.ALIGN_LEFT = "left";

		/**
		 * Align text right
		 * @property {String} ALIGN_RIGHT
		 * @readonly
		 */
		Label.ALIGN_RIGHT = "right";

		/**
		 * Align text centre
		 * @property {String} ALIGN_CENTRE
		 * @readonly
		 */
		Label.ALIGN_CENTRE = "centre";

		var proto = Label.prototype;

		/**
		 * Sets the alignment of the label text in relation to
		 * it's bounding box
		 * @method setAlignment
		 * @chainable
		 * @deprecated use css styles instead
		 * @param {string} align as 'left' 'right' or 'centre'
		 */
		proto.setAlignment = function (align) {
			this._alignment = align;
			domAbstraction.setAlignment(this, this._alignment);
			return this;
		};

		/**
		 * Sets the size of the label text. Note: setting the
		 * size here will over-ride the CCS equivalent
		 * @method setFontSize
		 * @chainable
		 * @deprecated use css styles instead
		 * @param {Number} newSize
		 */
		proto.setFontSize = function (newSize) {
			domAbstraction.setFontSize(this._innerElement, newSize);
			return this;
		};

		/**
		 * Sets the text of the label and updates the SVG
		 * @method setText
		 * @chainable
		 * @param {string} newText
		 */
		proto.setText = function (newText) {
			if (newText !== this._text) {
				this._text = newText;
				domAbstraction.updateText(this._innerElement, this._text);
			}
			return this;
		};

		/**
		 * @method setCssClass
		 * @param {String} className Name of the CSS class.
		 * @chainable
		 */
		proto.setCssClass = function (className) {
			Label.superClass.setCssClass.call(this, className);
			return this;
		};

		/**
		 * Sets the text overflow behaviour and updates the markup
		 * text-overflow attribute
		 * @method setTextOverflow
		 * @chainable
		 * @deprecated use css styles instead
		 * @param {String} overflow Either "clip" or "ellipsis"
		 */
		proto.setTextOverflow = function (overflow) {
			this._textOverflow = overflow;
			domAbstraction.setOverflow(this._innerElement, this._textOverflow);
			return this;
		};

		/**
		 * Returns the current rendered font size.
		 * @method getFontSize
		 * @return {number} The label font size.
		 */
		proto.getFontSize = function () {
			return domAbstraction.getFontSize(this._innerElement);
		};

		/**
		 * Returns the current rendered height of the label, including stroke properties.
		 * @method getHeight
		 * @return {number} The label height.
		 */
		proto.getHeight = function () {
			var fontSize = this.getFontSize();
			try {
				return fontSize + this._innerElement.getFloatTrait("stroke-width") * 2;
			} catch (err) {
				// stroke-width is not defined so return font size
				return fontSize;
			}
		};

		/**
		 * Returns the current label text
		 * @method getText
		 * @return {string} The label text.
		 */
		proto.getText = function () {
			return this._text;
		};

		/**
		 * Returns the current text overflow behaviour
		 * @method getTextOverflow
		 * @return {string} The text overflow behaviour.
		 */
		proto.getTextOverflow = function () {
			return this._textOverflow;
		};

		/**
		 * Returns the current alignment of the label text, one of left' 'right' or 'centre'
		 * @method getAlignment
		 * @return {string} The label text alignment.
		 */
		proto.getAlignment = function () {
			return this._alignment;
		};

		/**
		 * Returns the calculated length of the text label on screen (in pixels).
		 * @method getTextLength
		 * @return {number} Length in pixels.
		 */
		proto.getTextLength = function () {
			return parseInt(domAbstraction.getTextLength(this._innerElement), 10);
		};

		/**
		 * Returns the calculated length of the text label on screen (in pixels).
		 * @method getTrueTextLength
		 * @return {number} Length in pixels.
		 */
		proto.getTrueTextLength = function () {
			//Modified from return parseInt(this.getTextLength() / this.resolutionHorizontalFactor, 10);
			var trueTextLength = parseInt(this.getTextLength() / this.resolutionHorizontalFactor, 10);
			if (!trueTextLength) {
				trueTextLength = this._getMimicTrueTextLength();
			}
			return trueTextLength;
		};

		/**
		 * Return the name of this JavaScript class
		 * @method getClassName
		 * @return {String} The class name.
		 */
		proto.getClassName = function () {
			return ("Label");
		};

		// CUSTOMISATIONS START HERE //

		/**
		 * Returns the calculated length of the mimic text label off screen (in pixels)
		 * @method _getMimicTrueTextLength
		 * @private
		 * @return {number} Length in pixels.
		 */
		Label.prototype._getMimicTrueTextLength = function () {
			var trueTextLength = 0;
			if (this._mimicLabel && (this !== this._mimicLabel)) {
				this._mimicLabel.setText(this.getText());
				this._mimicLabel.setWidth(this.getTrueWidth());
				this._mimicLabel.setCssClass(this.getCssClass());
				trueTextLength = parseInt(domAbstraction.getTextLength(this._mimicLabel._innerElement) / this.resolutionVerticalFactor, 10);
			}
			return trueTextLength;
		};

		// CUSTOMISATIONS END HERE //

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.Label = Label;
		return Label;
	}
);