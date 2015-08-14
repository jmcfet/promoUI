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
					var wrapper = docRef.createElement("div"),
						labelElement = docRef.createElement("p");
					wrapper.style.position = "absolute";
					labelElement.style["margin"] = "0px";
					labelElement.style["whiteSpace"] = "nowrap";
					labelElement.style.overflow = "hidden";
					labelElement.style["textOverflow"] = "ellipsis";

					wrapper.appendChild(labelElement);
					return {
						root: wrapper,
						inner : labelElement
					};
				},
				updateText: function (element, text) {
					element.innerText = text;
				},
				setFontSize: function (element, size) {
					$N.gui.GUIObject.abstractedMethods.changeStyle(element, "fontSize", size + "px");
				},
				setAlignment: function (guiObject, align) {
					var width = guiObject.getWidth(),
						element = guiObject._innerElement;
					if (align === Label.ALIGN_LEFT && width) {
						$N.gui.GUIObject.abstractedMethods.changeStyle(element, "textAlign", "left");
						$N.gui.GUIObject.abstractedMethods.changeStyle(element, "marginLeft", "0%");
					} else if (align === Label.ALIGN_LEFT && !width) {
						$N.gui.GUIObject.abstractedMethods.changeStyle(element, "marginLeft", "0%");
					} else if (align === Label.ALIGN_CENTRE && width) {
						$N.gui.GUIObject.abstractedMethods.changeStyle(element, "textAlign", "center");
						$N.gui.GUIObject.abstractedMethods.changeStyle(element, "marginLeft", "-50%");
					} else if (align === Label.ALIGN_CENTRE && !width) {
						$N.gui.GUIObject.abstractedMethods.changeStyle(element, "marginLeft", "-50%");
					} else if (align === Label.ALIGN_RIGHT && width) {
						$N.gui.GUIObject.abstractedMethods.changeStyle(element, "textAlign", "right");
						$N.gui.GUIObject.abstractedMethods.changeStyle(element, "marginLeft", "-100%");
					} else if (align === Label.ALIGN_RIGHT && !width) {
						$N.gui.GUIObject.abstractedMethods.changeStyle(element, "marginLeft", "-100%");
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

			this._positionedForHtml = false;
		}

		$N.gui.Util.extend(Label, $N.gui.AbstractComponent);

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

		proto.htmlCompatible = false;

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

		proto._positionForHtml = function () {
			if (!this._positionedForHtml && this.htmlCompatible && $N.gui.GUIObject.mode === "SVG" && this.getFontSize()) {
				this.setY(this.getTrueY() + this.getFontSize());
				this._positionedForHtml = true;
			}
		};

		/**
		 * Shows the label
		 * @method show
		 * @chainable
		 */
		proto.show = function () {
			Label.superClass.show.call(this);
			this._positionForHtml();
			return this;
		};

		/**
		 * Sets the text of the label and updates the SVG
		 * @method setText
		 * @chainable
		 * @param {string} newText
		 */
		proto.setText = function (newText) {
			this._text = newText;
			domAbstraction.updateText(this._innerElement, this._text);
			this._positionForHtml();
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
			return parseInt(this.getTextLength() / this.resolutionHorizontalFactor, 10);
		};

		/**
		 * Return the name of this JavaScript class
		 * @method getClassName
		 * @return {String} The class name.
		 */
		proto.getClassName = function () {
			return ("Label");
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.Label = Label;
		return Label;
    }
);