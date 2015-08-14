/**
 * List item is a GUIobject that is created and maintained
 * by a list holding many instances.  This list item is
 * not flexible and is a standard representation of what
 * a graphic list looks like.  It has an icon and either
 * 1 or 2 columns of text. Example use would be a list style
 * EPG using the PagingListControl
 * @class $N.gui.ListItem
 * @extends $N.gui.GUIObject
 *
 * @requires $N.gui.Container
 * @requires $N.gui.SVGlink
 * @requires $N.gui.Label
 * @requires $N.gui.GUIObject
 * @requires $N.gui.Util
 *
 * @constructor
 * @param {Object} docRef DOM reference
 */
define('jsfw/gui/GUIObjects/Controls/List/ListItem',
    [
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Components/SVGlink',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/helpers/Util'
    ],
    function (Container, SVGlink, Label, GUIObject, Util) {

		function ListItem(docRef) {

			ListItem.superConstructor.call(this, docRef);

			this._container = new $N.gui.Container(this._docRef);

			this._icon = new $N.gui.SVGlink(this._docRef, this._container);
			this._column1Label = new $N.gui.Label(this._docRef, this._container);
			this._column2Label = new $N.gui.Label(this._docRef, this._container);

			this._rootElement = this._container.getRootElement();

			this._width = 5;
			this._height = 0;
			this._column1Width = 0;
			this._column2Width = 0;
			this._itemPadding = 2;

			this._container.setCssClass("list_item_bg");

			this._iconColumnWidth = 25;

			this._icon.setHeight(this._iconColumnWidth);
			this._icon.setX(3);
			this._icon.setY(2);
			this._icon.hide();

			this._column2Label.setWidth(1);
			this._column1Label.setX(this._iconColumnWidth);
			this._column1Label.setTextOverflow("ellipsis");
			this._column2Label.setTextOverflow("ellipsis");
			this._column1Label.setCssClass("list_item_text");
			this._column2Label.setCssClass("list_item_text");  //TODO: make these into getters and setters for list control

		}

		$N.gui.Util.extend(ListItem, $N.gui.GUIObject);

		/**
		 * Sets the default padding to be used for this object
		 * @method setItemPadding
		 * @param {Number} pixels
		 */
		ListItem.prototype.setItemPadding = function (pixels) {
			this._itemPadding = pixels;
		};

		/**
		 * Sets the overall width of the list item, and
		 * adjusts the column widths accordingly
		 * @method setWidth
		 * @param {Number} width
		 */
		ListItem.prototype.setWidth = function (width) {
			if (this._column1Width === 0 || this._column1Width === this._width) {
				this._column1Label.setWidth(width - this._iconColumnWidth);
			} else {
				if (width - this._iconColumnWidth < this._column1Width) {
					this.setColumn1Width(width - this._iconColumnWidth);
				} else {
					this._column2Label.setX(this._column1Width + this._iconColumnWidth);
					this._column2Label.setWidth(width - this._column1Width - this._iconColumnWidth - 5);
				}
			}
			this._width = width;
			this._container.setWidth(this._width - this._itemPadding);
		};

		/**
		 * Sets the width of the first column and adjusts the
		 * width of the second to fill the remaining width
		 * @method setColumn1Width
		 * @param {Number} col1Width
		 */
		ListItem.prototype.setColumn1Width = function (col1Width) {  //TODO: allow this to handle the fact we now have an icon
			if (col1Width <= this._width) {
				this._column1Width = col1Width;
				this._column1Label.setWidth(this._column1Width);
				this._column2Label.setX(this._column1Width);
				this._column2Label.setWidth(this._width - this._column1Width - 5);
			} else {
				throw new Error("Column cannot be wider than the list");
			}
		};

		/**
		 * Sets the height of the list item
		 * @method setHeight
		 * @param {Number} height
		 */
		ListItem.prototype.setHeight = function (height) {
			this._height = height;
			//icon.setY((height - 20) / 2);
			this._column1Label.setY((this._height / 2) + 5);
			this._column2Label.setY((this._height / 2) + 5);
			this._icon.setY((this._height / 2) - (this._icon.getHeight() / 2));
			this._container.setHeight(this._height - this._itemPadding);
			// if the icon is larger than the height scale
			if (this._height < this._iconColumnWidth) {
				var scale = (this._height / this._iconColumnWidth) - 0.2; //0.2 for sure
				this._icon.applyScale(scale);
			}
		};

		/**
		 * Sets the font size for the column text
		 * @method setFontSize
		 * @param {Number} size
		 */
		ListItem.prototype.setFontSize = function (size) {
			this._column1Label.setFontSize(size);
			this._column2Label.setFontSize(size);
		};

		/**
		 * Sets the icon to be shown
		 * @method setIcon
		 * @param {String} href
		 */
		ListItem.prototype.setIcon = function (href) {
			if (this._icon.isVisible() && href === "") {
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
		 * Sets the CSS class to be used to display the icon
		 * @method setIconCssClass
		 * @param {String} cssClass
		 */
		ListItem.prototype.setIconCssClass = function (cssClass) {
			this._icon.setCssClass(cssClass);
		};

		/**
		 * Sets the text to be displayed in column 1
		 * @method setColumn1Text
		 * @param {String} newText
		 */
		ListItem.prototype.setColumn1Text = function (newText) {
			this._column1Label.setText(newText);
		};

		/**
		 * Sets the text to be displayed in column 2
		 * @method setColumn2Text
		 * @param {String} newText
		 */
		ListItem.prototype.setColumn2Text = function (newText) {
			this._column2Label.setText(newText);
		};

		/**
		 * Sets the CSS class to be used to display the column text
		 * @method setTextCssClass
		 * @param {String} className
		 */
		ListItem.prototype.setTextCssClass = function (className) {
			this._column1Label.setCssClass(className);
			this._column2Label.setCssClass(className);
		};

		/**
		 * Sets the CSS class to be used to display the background in
		 * a normal non-highlighted state
		 * @method setContainerCssClass
		 * @param {String} className
		 */
		ListItem.prototype.setContainerCssClass = function (className) {
			this._container.setCssClass(className);
		};

		/**
		 * Sets the CSS class to be used to display the background in
		 * a highlighted state
		 * @method setContainerCssHighlightClass
		 * @param {String} className
		 */
		ListItem.prototype.setContainerCssHighlightClass = function (className) {
			this._container.setCssHighlightClass(className);
		};

		/**
		 * Returns the width of this list item
		 * @method getWidth
		 * @return {Number}
		 */
		ListItem.prototype.getWidth = function () {
			return this._width;
		};

		/**
		 * Returns the height of this list item
		 * @method getHeight
		 * @return {Number}
		 */
		ListItem.prototype.getHeight = function () {
			return this._height;
		};

		/**
		 * Returns the width of the first column
		 * @method getColumn1Width
		 * @return {Number}
		 */
		ListItem.prototype.getColumn1Width = function () {
			return this._column1Width;
		};

		/**
		 * Returns the width of the second column
		 * @method getColumn2Width
		 * @return {Number}
		 */
		ListItem.prototype.getColumn2Width = function () {
			return this._column2Width;
		};

		/**
		 * Returns the font size used for the text
		 * @method getFontSize
		 * @return {Number}
		 */
		ListItem.prototype.getFontSize = function () {
			return this._column1Label.getFontSize();
		};

		/**
		 * Returns the text currently displayed in
		 * column 1
		 * @method getColumn1Text
		 * @return {String}
		 */
		ListItem.prototype.getColumn1Text = function () {
			return this._column1Label.getText();
		};

		/**
		 * Returns the text currently displayed in
		 * column 2
		 * @method getColumn2Text
		 * @return {String}
		 */
		ListItem.prototype.getColumn2Text = function () {
			return this._column2Label.getText();
		};

		/**
		 * Returns true if column 2 is visible
		 * @method isColumn2Visible
		 * @return {boolean}
		 */
		ListItem.prototype.isColumn2Visible = function () {
			return (this._column1Width < this._width);
		};

		/**
		 * Shows the list item as highlighted
		 * @method highLight
		 */
		ListItem.prototype.highLight = function () {
			this._container.highLight();
		};

		/**
		 * Shows the list item as normal
		 * @method unHighLight
		 */
		ListItem.prototype.unHighLight = function () {
			this._container.unHighLight();
		};

		/**
		 * Entry point for key presses to be handled in the ListItem object
		 * @method keyHandler
		 * @param {Object} e
		 * @return {boolean} true if handled, false if not
		 */
		ListItem.prototype.keyHandler = function (e) {
			switch (e.keyCode) {
			case 13:
				this.okCallback();
				return true;
			default:
				return false;
			}
		};

		/**
		 * Overrides the default x position of the icon
		 * @method setIconX
		 * @param {Number} xVal
		 */
		ListItem.prototype.setIconX = function (xVal) {
			this._icon.setX(xVal);
		};

		/**
		 * Overrides the default y position of the icon
		 * @method setIconY
		 * @param {Number} yVal
		 */
		ListItem.prototype.setIconY = function (yVal) {
			this._icon.setY(yVal);
		};

		/**
		 * Overrides the default alignment of the column
		 * 1 text
		 * @method setCol1Align
		 * @param {String} align
		 */
		ListItem.prototype.setCol1Align = function (align) {
			this._column1Label.setAlignment(align);
			switch (align) {
			case "right":
				this._column1Label.setX(this._column2Label.getX() - 10);
				break;
			case "centre":
				break;
			default:
				// do nothing
			}
		};

		/**
		 * Returns the name of the class
		 * @method getClassName
		 * @return {String}
		 */
		ListItem.prototype.getClassName = function () {
			return "ListItem";
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.ListItem = ListItem;
		return ListItem;
	}
);