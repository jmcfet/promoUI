/**
 * Superclass for all components, a component is a single GUIObject that is
 * the smallest part of the GUI jigsaw, multiple components are used to
 * create controls. Each component has an associated mark-up tag reference.
 * AbstractComponent extends the GUIObject class therefore inheriting position
 * values etc plus defines size attributes etc.
 *
 * @class $N.gui.AbstractComponent
 * @extends $N.gui.GUIObject
 * @requires $N.gui.GUIObject
 * @requires $N.gui.Util
 * @constructor
 * @param {Object} docRef Document reference.
 */
define('jsfw/gui/GUIObjects/Components/AbstractComponent',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/PresentationManager',
    'jsfw/Config'
    ],
    function (GUIObject, Util, PresentationManager, Config) {

		function AbstractComponent(docRef) {
			var me = this;
			AbstractComponent.superConstructor.call(this, docRef);
			this._width = 0;
			this._height = 0;
			this._trueWidth = 0;
			this._trueHeight = 0;
			this._cssClass = null;
			this._cssHighlightClass = null;
			this._cssHighlightStyle = "";
			this._selectable = false;
			this._innerElement = {};

			// added to maintain backwards compatibility with GUI objects extended outside of the framework
			if (Object.defineProperty) {
	            Object.defineProperty(this, "_innerSVG", {
	                get: function () {
						return me._innerElement;
					},
	                set: function (val) {
						me._innerElement = val;
					}
				}, {writable: true});
		    } else {
				this.__defineGetter__("_innerSVG", function () {
					return me._innerElement;
				});
				this.__defineSetter__("_innerSVG", function (val) {
					me._innerElement = val;
				});
			}
		}

		$N.gui.Util.extend(AbstractComponent, $N.gui.GUIObject);

		var proto = AbstractComponent.prototype;

		/**
		 * Adds an animation tag
		 * @deprecated Use addMoveAnimation etc
		 * @method addAnimation
		 * @param {Object} animObj Reference to GUI Framework Animation Object
		 * @chainable
		 */
		proto.addAnimation = function (animObj) {
			this._innerElement.appendChild(animObj.getRootElement());
			return this;
		};

		/**
		 * Stores the given CSS class name and updates the component's mark-up 'class' attribute.
		 * @method setCssClass
		 * @param {String} className Name of the CSS class.
		 * @chainable
		 */
		proto.setCssClass = function (className) {
			this._cssClass = className;
			this._innerElement.setAttribute("class", this._cssClass);
			if ($N.Config.PRESENTATION_MANAGER) {
				this.configure($N.gui.PresentationManager.getPresentation(this._cssClass));
			}
			return this;
		};

		/**
		 * Stores the given CSS style and updates the component's mark-up 'style' attribute.
		 * @method setCssStyle
		 * @deprecated use CSS classes instead
		 * @param style {String} Name of the CSS class.
		 * @chainable
		 */
		proto.setCssStyle = function (style, dontRememeber) {
			var i,
				styleArray,
				styleDefinition;
			if (!dontRememeber) {
				this._cssStyle = style;
			}
			if ($N.gui.GUIObject.mode === "HTML" && style) {
				if (style.indexOf(';')) {
					styleArray = style.split(/;\s*/);
				} else {
					styleArray.push(style);
				}
				for (i = styleArray.length - 1; i >= 0; i--) {
					styleDefinition = styleArray[i].split(/:\s*/);
					if (styleDefinition[0]) {
						this._innerElement.style[styleDefinition[0]] = styleDefinition[1];
					}
				}
			} else {
				this._innerElement.setAttribute("style", style);
			}
			return this;
		};

		/**
		 * Stores the given CSS class name for component highlight.
		 * @method setCssHighlightClass
		 * @param {String} className Name of the CSS class.
		 * @chainable
		 */
		proto.setCssHighlightClass = function (className) {
			this._cssHighlightClass = className;
			return this;
		};

		/**
		 * Stores the given CSS style for component highlight.
		 * @method setCssHighlightStyle
		 * @deprecated use CSS classes instead
		 * @param {String} style Name of the CSS class.
		 * @chainable
		 */
		proto.setCssHighlightStyle = function (style) {
			this._cssHighlightStyle = style;
			return this;
		};

		/**
		 * Stores the given width for the component and updates the
		 * mark-up 'width' attributes.
		 * @method setWidth
		 * @param {Number} width The new width value.
		 * @chainable
		 */
		proto.setWidth = function (width) {
			this._trueWidth = width;
			this._width = Math.round(width * this.resolutionHorizontalFactor);
			$N.gui.GUIObject.abstractedMethods.changeStyle(this._innerElement, "width", (String(this._width) + "px"));
			this._redrawChildren();
			return this;
		};

		/**
		 * Stores the given height for the component and updates the
		 * mark-up 'height' attributes.
		 * @method setHeight
		 * @param {Number} height The new height value.
		 * @chainable
		 */
		proto.setHeight = function (height) {
			this._trueHeight = height;
			this._height = Math.round(height * this.resolutionVerticalFactor);
			$N.gui.GUIObject.abstractedMethods.changeStyle(this._innerElement, "height", (String(this._height) + "px"));
			this._redrawChildren();
			return this;
		};

		/**
		 * Sets whether a component is selectable in the UI when treated
		 * as a control by the view.
		 * @method setSelectable
		 * @param isSelectable {Boolean} True if the component can be selected, false if it cannot
		 * be selected.
		 * @chainable
		 */
		proto.setSelectable = function (isSelectable) {
			this._selectable = isSelectable;
			return this;
		};

		/**
		 * Returns the stored CSS class for normal draw.
		 * @method getCssClass
		 * @return {String} The CSS class used for normal draw.
		 */
		proto.getCssClass = function () {
			return this._cssClass;
		};

		/**
		 * Returns the stored CSS style for normal draw.
		 * @method getCssStyle
		 * @deprecated use CSS classes instead
		 * @return {String} The CSS style used for normal draw.
		 */
		proto.getCssStyle = function () {
			return this._cssStyle;
		};

		/**
		 * Returns the stored CSS class for highlighted draw.
		 * @method getCssHighlightClass
		 * @return {String} The CSS class used for highlighted draw.
		 */
		proto.getCssHighlightClass = function () {
			return this._cssHighlightClass;
		};

		/**
		 * Returns the stored CSS style for highlighted draw.
		 * @method getCssHighlightStyle
		 * @deprecated use CSS classes instead
		 * @return {String} The CSS style used for highlighted draw.
		 */
		proto.getCssHighlightStyle = function () {
			return this._cssHighlightStyle;
		};

		/**
		 * Returns the width of the component.
		 * @method getWidth
		 * @return {Number} Width of the component.
		 */
		proto.getWidth = function () {
			return this._width;
		};

		/**
		 * Returns the height of the component.
		 * @method getHeight
		 * @return {Number} Height of the component.
		 */
		proto.getHeight = function () {
			return this._height;
		};

		/**
		 * Returns the true width of the component.
		 * This is the width of the component before it is resized for resolution
		 * @method getTrueWidth
		 * @return {Number} True Width of the component.
		 */
		proto.getTrueWidth = function () {
			return this._trueWidth;
		};

		/**
		 * Returns the true height of the component.
		 * This is the height of the component before it is resized for resolution
		 * @method getTrueHeight
		 * @return {Number} True Height of the component.
		 */
		proto.getTrueHeight = function () {
			return this._trueHeight;
		};

		/**
		 * Returns whether this component is selectable by the view.
		 * @method getSelectable
		 * @return {Boolean} True if the component can be selected, false if it cannot
		 * be selected.
		 */
		proto.getSelectable = function () {
			return this._selectable;
		};

		/**
		 * Abstract method to be defined by sub-class if required when
		 * the component receives focus.
		 * @method highLight
		 */
		proto.highLight = function () {
			// content to be defined by sub-class if required
		};

		/**
		 * Abstract method to be defined by sub-class if required when
		 * the component no longer has focus.
		 * @method unHighLight
		 */
		proto.unHighLight = function () {
			// content to be defined by sub-class if required
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.AbstractComponent = AbstractComponent;
		return AbstractComponent;
    }
);