/**
 * Defines a list that allows the user to pick one option out of many available options.
 * Useful for allowing the user to select options such as audio output format and video
 * output format for example.
 * @class $N.gui.PickListControl
 * @extends $N.gui.GUIObject
 *
 * @requires $N.gui.GUIObject
 * @requires $N.gui.Container
 * @requires $N.gui.SimpleListControl
 * @requires $N.gui.Label
 * @requires $N.gui.SVGlink
 * @requires $N.gui.Util
 * @requires $N.gui.FrameworkCore
 *
 * @constructor
 * @param {Object} docRef Document reference.
 */

define('jsfw/gui/GUIObjects/Controls/dialogs/PickListControl',
    [
    'jsfw/gui/GUIObjects/GUIObject',
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Controls/List/SimpleListControl',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/GUIObjects/Components/SVGlink',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/FrameworkCore'
    ],
    function (GUIObject, Container, SimpleListControl, Label, SVGlink, Util, FrameworkCore) {

		function PickListControl(docRef, parent) {
			PickListControl.superConstructor.call(this, docRef);

			this._container = new $N.gui.Container(docRef);
			this._container.setCssClass("pick_list_bg");
			this._container.setRounding("7");

			this._topBottomPad = 40;

			this._innerContainer = new $N.gui.Container(docRef, this._container);
			this._innerContainer.setCssClass("pick_list_bg_inner");
			this._innerContainer.setRounding("7");
			this._innerContainer.setX(10);
			this._innerContainer.setY(this._topBottomPad);

			this._header = new $N.gui.Label(docRef, this._container);
			this._header.setX(13);
			this._header.setY(25);
			this._header.setCssClass("header");

			this._footer = new $N.gui.SVGlink(docRef, this._container);
			this._footer.setX(13);
			this._footer.setCssClass("header");

			this._list = new $N.gui.SimpleListControl(docRef, this._container);
			this._list.setItemHeight(30);
			this._list.setX(15);
			this._list.setY(this._topBottomPad + 7);

			this._rootElement = this._container.getRootElement();

			this._cancelCallback = function () {};

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(PickListControl, $N.gui.GUIObject);

		/**
		 * Initialises the PickList.
		 * @method initialise
		 * @deprecated use init method
		 */
		PickListControl.prototype.initialise = function () {
			this.init();
		};

		/**
		 * Initialises the PickList.
		 * @method init
		 */
		PickListControl.prototype.init = function () {
			this._list.init();
		};

		/**
		 * Sets the CSS class that will be used to style the outer Container.
		 * @method setOuterCssClass
		 * @param {String} newClass The CSS class name.
		 */
		PickListControl.prototype.setOuterCssClass = function (newClass) {
			this._container.setCssClass(newClass);
		};

		/**
		 * Sets the CSS class that will be used to style the inner Container.
		 * @method setInnerCssClass
		 * @param {String} newClass The CSS class name.
		 */
		PickListControl.prototype.setInnerCssClass = function (newClass) {
			this._innerContainer.setCssClass(newClass);
		};

		/**
		 * Sets the CSS class that will be used to style the header.
		 * @method setHeaderCssClass
		 * @param {String} newClass The CSS class name.
		 */
		PickListControl.prototype.setHeaderCssClass = function (newClass) {
			this._header.setCssClass(newClass);
		};

		/**
		 * Sets the CSS class that will be used to style the footer.
		 * @method setFooterCssClass
		 * @param {String} newClass The CSS class name.
		 */
		PickListControl.prototype.setFooterCssClass = function (newClass) {
			this._footer.setCssClass(newClass);
		};

		/**
		 * Sets the header text.
		 * @method setHeader
		 * @param {String} text The header text.
		 */
		PickListControl.prototype.setHeader = function (text) {
			this._header.setText(text);
		};

		/**
		 * Sets the footer href value.
		 * @method setFooter
		 * @param {String} href Hyperlink to the footer icon.
		 */
		PickListControl.prototype.setFooter = function (href) {
			this._footer.setHref(href);
		};

		/**
		 * Sets the CSS class that will be used to style the list text.
		 * @method setTextCssClass
		 * @param {String} newClass
		 */
		PickListControl.prototype.setTextCssClass = function (newClass) {
			this._list.setTextCssClass(newClass);
		};

		/**
		 * Sets the number of rows that are visible within the list.
		 * @method setVisibleItemCount
		 * @param {Number} count The number of list items to be made visible.
		 */
		PickListControl.prototype.setVisibleItemCount = function (count) {
			this._list.setVisibleItemCount(count);
		};

		/**
		 * Sets the href value on the up arrow.
		 * @method setUpArrowHref
		 * @param {String} href Hyperlink to the up arrow icon.
		 */
		PickListControl.prototype.setUpArrowHref = function (href) {
			this._list.setUpArrowHref(href);
		};

		/**
		 * Sets the href value on the down arrow.
		 * @method setDownArrowHref
		 * @param {String} href Hyperlink to the down arrow icon.
		 */
		PickListControl.prototype.setDownArrowHref = function (href) {
			this._list.setDownArrowHref(href);
		};

		/**
		 * Entry point for key presses to be handled in the PickListControl object.
		 * @method keyHandler
		 * @param {String} key The key that was pressed.
		 * @return {Boolean} True if the key press was handled, false it it wasn't handled.
		 */
		PickListControl.prototype.keyHandler = function (key) {
			var keys = $N.gui.FrameworkCore.getKeys();
			switch (key) {
			case keys.KEY_LEFT:
			case keys.KEY_BACK:
				this._cancelCallback();
				return true;
			default:
				return this._list.keyHandler(key);
			}
		};

		/**
		 * Sets the height of the rows in the list, affecting the overall
		 * height of the PickList.
		 * @method setItemHeight
		 * @param {Number} height The height of each list item.
		 */
		PickListControl.prototype.setItemHeight = function (height) {
			this._list.setItemHeight(height);
		};

		/**
		 * Sets the width of the PickList.
		 * @method setWidth
		 * @param {Number} newWidth The overall width of the PickList.
		 */
		PickListControl.prototype.setWidth = function (newWidth) {
			this._container.setWidth(newWidth);
			this._innerContainer.setWidth(newWidth - 20);
			this._list.setWidth(newWidth - 30);
		};

		/**
		 * Sets the height of the PickList.
		 * @method setHeight
		 * @param {Number} newHeight The overall height of the PickList.
		 */
		PickListControl.prototype.setHeight = function (newHeight) {
			this._container.setHeight(newHeight);
			this._innerContainer.setHeight(newHeight - (this._topBottomPad * 2));
			this._footer.setY(newHeight - 25);
		};

		/**
		 * Defines the callback that will be executed when an item in the list is selected.
		 * @method setItemSelectedCallback
		 * @param {Function} callback The callback to be executed when an item in the list is selected.
		 */
		PickListControl.prototype.setItemSelectedCallback = function (callback) {
			this._list.setItemSelectedCallback(callback);
		};

		/**
		 * Populates the list data and selects the row at the specified index if
		 * the index parameter is supplied; uses index 1 if no index is supplied.
		 * @method setOptions
		 * @param {Object} list Contains the list data.
		 * @param {Number} index The row to be selected.
		 */
		PickListControl.prototype.setOptions = function (list, index) {
			this._list.setData(list);
			this._list.selectRowAtIndex((index || 1), true);
		};

		/**
		 * Selects the row at the given index.
		 * @method selectRowAtIndex
		 * @param {Number} index The row to select.
		 */
		PickListControl.prototype.selectRowAtIndex = function (index) {
			this._list.selectRowAtIndex(index, true);
		};

		/**
		 * Selects the row that matches the given text.
		 * @method selectRowWithText
		 * @param {String} itemText Text that identifies the row to be selected.
		 */
		PickListControl.prototype.selectRowWithText = function (itemText) {
			this.selectRowAtIndex(this._list.getItemIndex(itemText) + 1);
		};

		/**
		 * Defines the callback that will be executed when the user navigates away from the PickList.
		 * @method setCancelCallback
		 * @param {Function} callback The callback to be executed when the user navigates away from the PickList.
		 */
		PickListControl.prototype.setCancelCallback = function (callback) {
			this._cancelCallback = callback;
		};

		/**
		 * Sets the highlight rounding.
		 * @method setHighLightRounding
		 * @param {Number} rounding The amount of rounding to apply to the highlight.
		 */
		PickListControl.prototype.setHighLightRounding = function (rounding) {
			this._list.setHighLightRounding(rounding);
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.PickListControl = PickListControl;
		return PickListControl;
	}
);