/**
 * Represents a graphical object containing an icon and
 * text, typically used in a EPG grid.
 * @class $N.gui.GridItem
 * @extends $N.gui.GUIObject
 *
 * @requires $N.gui.GUIObject
 * @requires $N.gui.Container
 * @requires $N.gui.SVGlink
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 *
 * @constructor
 * @param {Object} docRef DOM reference
 */
define('jsfw/gui/GUIObjects/Controls/grid/GridItem',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Components/SVGlink',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/helpers/Util'
    ],
    function (GUIObject, Container, SVGlink, Label, Util) {

		function GridItem(docRef) {

			GridItem.superConstructor.call(this, docRef);

			this._container = new $N.gui.Container(this._docRef);
			this._icon = new $N.gui.SVGlink(this._docRef, this._container);
			this._leftArrow = new $N.gui.SVGlink(this._docRef, this._container);
			this._rightArrow = new $N.gui.SVGlink(this._docRef, this._container);
			this._label = new $N.gui.Label(this._docRef, this._container);

			this._rootElement = this._container.getRootElement();

			this._width = 0;
			this._height = 0;
			this._expired = false;
			this._itemPadding = 2;
			this._iconWidth = 25;

			this._container.setCssClass("eventBg");
			this._container.setCssHighlightClass("eventBgHighlight");
			this._container.setRounding(3);

			this._icon.setX(8);
			this._icon.setY(3);
			this._icon.setWidth(this._iconWidth);
			this._icon.setHeight(this._iconWidth);
			this._icon.hide();

			this._leftArrow.setX(1);
			this._leftArrow.setY(10);
			this._leftArrow.setWidth(6);
			this._leftArrow.setHeight(6);
			this._leftArrow.hide();
			this._leftArrow.setHref(GridItem.leftArrowHref);

			this._rightArrow.setY(10);
			this._rightArrow.setWidth(6);
			this._rightArrow.setHeight(6);
			this._rightArrow.hide();
			this._rightArrow.setHref(GridItem.rightArrowHref);

			this._label.setCssClass("eventText");
			this._label.setX(this._iconWidth + 5);
			this._label.setY(17);
			this._label.setTextOverflow("ellipsis");
		}

		$N.gui.Util.extend(GridItem, $N.gui.GUIObject);

		/**
		 * Image to use for the left arrow
		 * @property {string} leftArrowHref
		 * @static
		 */
		GridItem.leftArrowHref = "#leftArrow";
		/**
		 * Image to use for the right arrow
		 * @property {string} rightArrowHref
		 * @static
		 */
		GridItem.rightArrowHref = "#rightArrow";

		/**
		 * Returns true if this item has been flagged as expired
		 * @method getExpired
		 * @return {Boolean}
		 */
		GridItem.prototype.getExpired = function () {
			return this._expired;
		};

		/**
		 * Sets the expired flag of the item
		 * @method setExpired
		 * @param {Boolean} exp
		 * @param {Boolean} curr
		 */
		GridItem.prototype.setExpired = function (exp, curr) {
			this._expired = exp;
			//TODO: don't hard code style
			if (this._expired) {
				this._container.setCssClass("eventBgDisabled");
			} else if (curr) {
				this._container.setCssClass("eventBgCurrent");
			} else {
				this._container.setCssClass("eventBg");
			}
		};

		/**
		 * Displays an arrow at the beginning of the item
		 * @method showLeftArrow
		 */
		GridItem.prototype.showLeftArrow = function () {
			if (!this._leftArrow.isVisible()) {
				this._leftArrow.show();
			}
		};

		/**
		 * Hides the arrow at the beginning of the item
		 * @method hideLeftArrow
		 */
		GridItem.prototype.hideLeftArrow = function () {
			if (this._leftArrow.isVisible()) {
				this._leftArrow.hide();
			}
		};

		/**
		 * Displays an arrow at the end of the item
		 * @method showRightArrow
		 */
		GridItem.prototype.showRightArrow = function () {
			if (!this._rightArrow.isVisible()) {
				this._rightArrow.show();
			}
		};

		/**
		 * Hides the arrow at the end of the item
		 * @method hideRightArrow
		 */
		GridItem.prototype.hideRightArrow = function () {
			if (this._rightArrow.isVisible()) {
				this._rightArrow.hide();
			}
		};

		/**
		 * Sets the padding to be used when drawing the border
		 * @method setItemPadding
		 * @param {Number} pixels
		 */
		GridItem.prototype.setItemPadding = function (pixels) {
			this._itemPadding = pixels;
			//TODO: update width
		};

		/**
		 * Sets the width of the overall item
		 * @method setWidth
		 * @param {Number} width
		 */
		GridItem.prototype.setWidth = function (width) {
			this._width = width;
			this._container.setWidth(this._width - this._itemPadding);
			var labelWidth = this._width - this._iconWidth - 15;
			labelWidth = labelWidth <= 0 ? 1 : labelWidth;
			this._label.setWidth(labelWidth);
			this._rightArrow.setX(this._width - (7 + this._itemPadding));
		};

		/**
		 * Sets the height of the item
		 * @method setHeight
		 * @param {Number} height
		 */
		GridItem.prototype.setHeight = function (height) {
			this._height = height;
			this._label.setY((this._height / 2) + 2);
			this._icon.setY((this._height / 2) - (this._icon.getHeight() / 2));
			this._container.setHeight(this._height - this._itemPadding);
			// if the icon is larger than the height scale
			if (this._height < this._iconWidth) {
				var scale = (this._height / this._iconWidth) - 0.2; //0.2 for sure
				this._icon.applyScale(scale);
			}
		};

		/**
		 * Sets the font size of the text in the item
		 * @method setFontSize
		 * @param {Number} size
		 */
		GridItem.prototype.setFontSize = function (size) {
			this._label.setFontSize(size);
		};

		/**
		 * Sets the icon to be displayed in the item
		 * @method setIcon
		 * @param {String} href
		 */
		GridItem.prototype.setIcon = function (href) {
			if ((this._icon.isVisible() && href === "") || this.getWidth() < 35) {
				this._icon.hide();
				this._icon.setHref(href);
			} else {
				this._icon.setHref(href);
				if (!this._icon.isVisible()) {
					this._icon.show();
				}
			}
		};

		/**
		 * Sets the text to be displayed
		 * @method setText
		 * @param {String} newText
		 */
		GridItem.prototype.setText = function (newText) {
			this._label.setText(newText);
		};

		/**
		 * Returns the text displayed in the item
		 * @method getText
		 * @return {String}
		 */
		GridItem.prototype.getText = function () {
			return this._label.getText();
		};

		/**
		 * Returns the width of the list item
		 * @method getWidth
		 * @return {Number}
		 */
		GridItem.prototype.getWidth = function () {
			return this._width;
		};

		/**
		 * Returns the height of the list item
		 * @method getHeight
		 * @return {Number}
		 */
		GridItem.prototype.getHeight = function () {
			return this._height;
		};

		/**
		 * Returns the font size used for the text
		 * @method getFontSize
		 * @return {Number}
		 */
		GridItem.prototype.getFontSize = function () {
			return this._label.getFontSize();
		};

		/**
		 * Shows the item as highlighted
		 * @method highLight
		 */
		GridItem.prototype.highLight = function () {
			this._container.highLight();
		};

		/**
		 * Shows the item as normal
		 * @method unHighLight
		 */
		GridItem.prototype.unHighLight = function () {
			this._container.unHighLight();
		};

		/**
		 * Allow the icon to be configured to override the
		 * default position
		 * @method configureIcon
		 * @param {Object} conf
		 */
		GridItem.prototype.configureIcon = function (conf) {
			this._icon.configure(conf);
		};

		/**
		 * Returns the class name
		 * @method getClassName
		 * @return {String}
		 */
		GridItem.prototype.getClassName = function () {
			return ("GridItem");
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.GridItem = GridItem;
		return GridItem;
	}
);