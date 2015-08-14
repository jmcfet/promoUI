/**
 * Simple list item is a GUIobject that is created and maintained
 * by a list holding many instances.  This list item is
 * not flexible and is a standard representation of what
 * a graphic list looks like.  A simple list item only contains text.
 * Example use would be a drop down selection using the PickListControl
 * @class $N.gui.SimpleListItem
 * @extends $N.gui.GUIObject
 *
 * @requires $N.gui.Group
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @requires $N.gui.GUIObject
 *
 * @constructor
 * @param {Object} docRef
 */
define('jsfw/gui/GUIObjects/Controls/List/SimpleListItem',
    [
    'jsfw/gui/GUIObjects/Components/Group',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/GUIObject'
    ],
    function (Group, Label, Util, GUIObject) {

		function SimpleListItem(docRef) {

			SimpleListItem.superConstructor.call(this, docRef);

			this._container = new $N.gui.Group(this._docRef);

			this._label = new $N.gui.Label(this._docRef);

			this._rootElement = this._container.getRootElement();
			this._rootElement.appendChild(this._label.getRootElement());

			this._width = 100;
			this._height = 30;
			this._labelPadding = 10;
			this._itemPadding = 2;

			this._label.setWidth(this._width - (this._itemPadding * 2));
			this._label.setX(this._labelPadding);
			this._label.setTextOverflow("ellipsis");
			this._label.setCssClass("simple_list_item_text");
		}

		$N.gui.Util.extend(SimpleListItem, $N.gui.GUIObject);

		/**
		 * Sets the padding to be applied to the label
		 * @method setLabelPadding
		 * @param {Number} pixels
		 */
		SimpleListItem.prototype.setLabelPadding = function (pixels) {
			this._labelPadding = pixels;
			this._label.setWidth(this._width - (this._labelPadding * 2));
			this._label.setX(this._labelPadding);
		};

		/**
		 * Sets the default padding to be used for this object
		 * @method setItemPadding
		 * @param {Number} pixels
		 */
		SimpleListItem.prototype.setItemPadding = function (pixels) {
			this._itemPadding = pixels;
		};

		/**
		 * Sets the overall width of the simple list item by adjusting the label and container widths
		 * @method setWidth
		 * @param {Number} width
		 */
		SimpleListItem.prototype.setWidth = function (iw) {
			this._width = iw;
			this._container.setWidth(this._width);
			this._label.setWidth(this._width - (this._labelPadding * 2));
		};

		/**
		 * Sets the height of the simple list item
		 * @method setHeight
		 * @param {Number} ih
		 */
		SimpleListItem.prototype.setHeight = function (ih) {
			this._height = ih;
			this._label.setY((this._height / 2) + 2);
			this._container.setHeight(this._height - this._itemPadding);
		};

		/**
		 * Sets the font size for the label text
		 * @method setFontSize
		 * @param {Number} size
		 */
		SimpleListItem.prototype.setFontSize = function (size) {
			this._label.setFontSize(size);
		};

		/**
		 * Sets the text to be displayed for the label
		 * @method setText
		 * @param {String} newText
		 */
		SimpleListItem.prototype.setText = function (newText) {
			this._label.setText(newText);
		};

		/**
		 * Sets the CSS class to be used to display the label text
		 * @method setTextCssClass
		 * @param {String} className
		 */
		SimpleListItem.prototype.setTextCssClass = function (className) {
			this._label.setCssClass(className);
		};

		/**
		 * Sets the CSS class to be used to display the background in
		 * a normal non-highlighted state
		 * @method setContainerCssClass
		 * @param {String} className
		 */
		SimpleListItem.prototype.setContainerCssClass = function (className) {
			this._container.setCssClass(className);
		};

		/**
		 * Sets the CSS class to be used to display the background in
		 * a highlighted state
		 * @method setContainerCssHighlightClass
		 * @param {String} className
		 */
		SimpleListItem.prototype.setContainerCssHighlightClass = function (className) {
			this._container.setCssHighlightClass(className);
		};

		/**
		 * Returns the width of this list item
		 * @method getWidth
		 * @return {Number}
		 */
		SimpleListItem.prototype.getWidth = function () {
			return this._width;
		};

		/**
		 * Returns the height of this list item
		 * @method getHeight
		 * @return {Number}
		 */
		SimpleListItem.prototype.getHeight = function () {
			return this._height;
		};

		/**
		 * Returns the font size used for the label text
		 * @method getFontSize
		 * @return {Number}
		 */
		SimpleListItem.prototype.getFontSize = function () {
			return this._label.getFontSize();
		};

		/**
		 * Shows the simple list item as highlighted
		 * @method highLight
		 */
		SimpleListItem.prototype.highLight = function () {
			this._container.highLight();
		};

		/**
		 * Shows the simple list item as normal
		 * @method unHighLight
		 */
		SimpleListItem.prototype.unHighLight = function () {
			this._container.unHighLight();
		};

		/**
		 * Returns the name of the class
		 * @method getClassName
		 * @return {String}
		 */
		SimpleListItem.prototype.getClassName = function () {
			return "SimpleListItem";
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.SimpleListItem = SimpleListItem;
		return SimpleListItem;
	}
);