/**
 * CustomisablePagingList is a concrete implementation of AbstractCustomisableList
 * and provides the functionality and logic to produce a list displaying
 * a set number of items with the selected / highlighted denoted by a highlight bar.
 * Upon moving to the last visible item in the list the list scrolls if more items are
 * available.
 *
 * Example Markup:
 *
 *     <nagra:customisablePagingList id="list" x="200" y="200" width="400" itemTemplate="TextItem" />
 *
 * The CustomisablePagingList tag has specified some presentation parameters along with the item template
 * which we are going to use for our list items.  Note that we have not specified a height attribute.
 * This is becuase the height of the control is defined by the list item height (specified using the
 * setItemHeight method) and the number of visible items in the list (specified using the setVisibleItemCount method).
 * In this example we have used the TextItem from the JSFW (see $N.gui.TextItem).
 *
 * Example JavaScript :
 *
 *     $N.gui.FrameworkCore.extendWithGUIObjects(document.documentElement, view);
 *
 *     // create some dummy data
 *     var data = [{"title":"title one"}, {"title":"title two"}, {"title":"title three"}, {"title":"title four"}, {"title":"title five"}];
 *
 *     // define the data mapper to our dummy data
 *     var dataMapper = {
 *          getText: function (item) {
 *              return item.title;
 *          }
 *     }
 *
 *     // initialise the paging list control
 *     view.list.setDataMapper(dataMapper);
 *     view.list.setData(data);
 *     view.list.setVisibleItemCount(3);
 *     view.list.setItemSelectedCallback(myCallbackFunction);
 *     view.list.init();
 *
 * In the JavaScript code, we have created some dummy data to provide to our paging list.
 * With our dummy data, we need to define a data mapper.  The data mapper needs to map our data to the
 * list item used (in this example it's the TextItem, but we could use any object which extends AbstractListItem).
 * In our data mapper, we must implement the methods which are required by our list item (see TextItem for
 * a specification on what methods to implement in the data mapper).  TextItem requires only a single accessor
 * method as it only has a single line of text.
 *
 * Callbacks are handled using the itemSelected callback and itemHighlightedCallback (set using the
 * setItemSelectedCallback and setItemHighlightedCallback respectively).  Both methods can be passed
 * a function which will be executed upon firing of the event.  The firing of the highlight event can
 * be configured using the setItemHighlightedTimeoutMS method, which allows you to set a number of
 * milliseconds before the event is fired.  This is to avoid the event constantly firing whilst a user navigates
 * over the list.
 *
 * In addition to the usual selection and highlight callbacks, the CustomisablePagingList control also
 * exposes a 'paged' callback (setListPagedCallback), which gets fired whenever the list is 'paged' (i.e. there are more items in
 * the source list than specified within the setVisibleItemCount method).
 *
 * The AbstractCustomisableList family of GUI classes all implement their own key handling functionality,
 * therefore you only need to pass a key value to the controls keyHandler method, as follows;
 *
 *     var handled = view.list.keyHandler(key);
 *
 * @class $N.gui.CustomisablePagingList
 * @extends $N.gui.AbstractCustomisableList
 *
 * @requires $N.gui.List
 * @requires $N.gui.Container
 * @requires $N.gui.Util
 * @requires $N.gui.AbstractCustomisableList
 * @requires $N.gui.FrameworkCore
 *
 * @constructor
 * @param {Object} docRef (document relating the DOM)
 * @param {Object} parent (optional parent GUI object to attach to)
 */

//TODO: orientation, hide highlightbar, call item highlight methods
define('jsfw/gui/GUIObjects/Controls/List/customisable/CustomisablePagingList',
    [
    'jsfw/gui/Logic/List/List',
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Controls/List/customisable/AbstractCustomisableList',
    'jsfw/gui/FrameworkCore'
    ],
    function (List, Container, Util, AbstractCustomisableList, FrameworkCore) {

		function CustomisablePagingList(docRef, parent) {
			CustomisablePagingList.superConstructor.call(this, docRef);

			this._items = [];
			this._data = new $N.gui.PagingList();
			this._itemHeight = 20;
			this._highlightMoveDuration = "125ms";
			this._container = new $N.gui.Container(this._docRef);
			this._container.setCssClass("list_bg");

			this._highlightBar = new $N.gui.Container(this._docRef, this._container);
			this._highlightBar.setCssClass("list_highlight_bar");

			this._highlightBar.setAnimationDuration(this._highlightMoveDuration);
			this._highlightBar.addMoveAnimation(this._docRef);

			this._rootElement = this._container.getRootElement();

			this._listPagedCallback = function () {
				return null;
			};

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(CustomisablePagingList, $N.gui.AbstractCustomisableList);

		/**
		 * Initialises the paging list control.  Creates the list items depending on
		 * the number of list items specified using the setVisibleItemCount method.
		 * and configuring them using the provided item configuration object
		 * @method init
		 */
		CustomisablePagingList.prototype.init = function () {
			if (!this._itemTemplate) {
				throw ("AbstractCustomisableList - init: No list item template provided");
			}
			var i = 0;
			var itemCount = this._data.getVisibleRows();
			this._items = [];

			for (i = 0; i < itemCount; i++) {
				this._items.push(new this._itemTemplate(this._docRef));

				this._items[i].configure(this._itemConfig);
				this._items[i].setY(i * this._itemHeight);
				if (this._dataMapper) {
					this._items[i].setDataMapper(this._dataMapper);
				}
				this._rootElement.appendChild(this._items[i].getRootElement());
			}
		};

		/**
		 * Initialises the paging list control.  Creates the list items depending on
		 * the number of list items specified using the setVisibleItemCount method.
		 * and configuring them using the provided item configuration object
		 * @method initialise
		 * @deprecated use init()
		 */
		CustomisablePagingList.prototype.initialise = function () {
			this.init();
		};

		/**
		 * Display data method visualises the data onto the relevant
		 * items in the list, this is called at least once and must be
		 * called after the initialise.
		 * @method displayData
		 */
		CustomisablePagingList.prototype.displayData = function () {

			var viewableList = this._data.returnViewableList();
			var i = null;

			for (i = 0; i < viewableList.length; i++) {
				this._items[i].update(viewableList[i]);
				if (!this._items[i].isVisible()) {
					this._items[i].show();
				}
			}
			if (viewableList.length < this._data.getVisibleRows()) {
				for (i = viewableList.length; i < this._data.getVisibleRows(); i++) {
					this._items[i].hide();
				}
			}
		};

		/**
		 * Selects and highlights the next item in the list
		 * @method selectNext
		 * @return {Boolean} true if the list paged
		 */
		CustomisablePagingList.prototype.selectNext = function () {
			var me = this;

			var scrolled = this._data.selectNext();

			if (scrolled) {
				this._moveHighlightToSelected(true);
				this.displayData();
			} else {
				this._moveHighlightToSelected();
			}
			this._applySelectionTimeOut(this._selectedItemTimeOutMS);
			if (scrolled) {
				this._listPagedCallback();
			}
			return scrolled;
		};

		/**
		 * Selects and highlights the previous item in the list
		 * @method selectPrevious
		 * @return {Boolean} true if the list paged
		 */
		CustomisablePagingList.prototype.selectPrevious = function () {
			var me = this;
			var scrolled = this._data.selectPrevious();

			if (scrolled) {
				this._moveHighlightToSelected(true);
				me.displayData();
			} else {
				this._moveHighlightToSelected();
			}
			this._applySelectionTimeOut(this._selectedItemTimeOutMS);
			if (scrolled) {
				this._listPagedCallback();
			}
			return scrolled;
		};

		/**
		 * Sets the number of rows that are visible, affecting the overall
		 * height of the ScrollList
		 * @method setVisibleItemCount
		 * @param {Number} newCount
		 */
		CustomisablePagingList.prototype.setVisibleItemCount = function (newCount) {
			this._data.setVisibleRows(newCount);
			this._height = this._itemHeight * this._data.getVisibleRows();
			this._container.setHeight(this._height);
		};

		/**
		 * Sets the width of the list affecting the highlight bar if on
		 * @method setWidth
		 * @param {Number} width
		 */
		CustomisablePagingList.prototype.setWidth = function (width) {
			this._highlightBar.setWidth(width);
		};

		/**
		 * Sets the height of the rows in the list, affecting the overall
		 * height of the ScrollList
		 * @method setItemHeight
		 * @param newHeight {Number}
		 */
		CustomisablePagingList.prototype.setItemHeight = function (newHeight) {
			this._itemHeight = newHeight;
			this._height = this._itemHeight * this._data.getVisibleRows();
			this._container.setHeight(this._height);
			this._highlightBar.setHeight(this._itemHeight);
		};

		/**
		 * keyHandler method defines the logic to perform upon
		 * receiving a supplied key press.
		 * @method keyHandler
		 * @param {String} key
		 * @return {Boolean} True if the key press was handled.
		 */
		CustomisablePagingList.prototype.keyHandler = function (key) {
			var keys = $N.gui.FrameworkCore.getKeys();
			switch (key) {
			case keys.KEY_UP:
				return this.selectPrevious();
			case keys.KEY_DOWN:
				return this.selectNext();
			case keys.KEY_OK:
			case keys.KEY_RIGHT:
				this._itemSelectedCallback(this._data.getSelectedItem());
				return true;
			}
		};

		/**
		 * Sets the behaviour that should occur when the list pages
		 * @method setListPagedCallback
		 * @param {Function} callback
		 */
		CustomisablePagingList.prototype.setListPagedCallback = function (callback) {
			this._listPagedCallback = callback;
		};

		/**
		 * Sets the CSS class of the highlight bar.
		 * @method setHighlightCssClass
		 * @param {String} cssClass The CSS class.
		 */
		CustomisablePagingList.prototype.setHighlightCssClass = function (cssClass) {
			this._highlightBar.setCssClass(cssClass);
		};

		// private helper methods

		/**
		 * Applies the _itemHighlightedCallback after a timeout
		 * @method _applySelectionTimeOut
		 * @private
		 * @param {Object} timeOutMS
		 */
		CustomisablePagingList.prototype._applySelectionTimeOut = function (timeOutMS) {
			var me = this;
			clearTimeout(this._selectionTimeOut);
			this._selectionTimeOut = setTimeout(function () {me._itemHighlightedCallback(me._data.getSelectedItem()); }, timeOutMS);
		};

		/**
		 * Helper method to move the highlight bar
		 * @method _moveHighlightToSelected
		 * @private
		 * @param {Object} noAnimation
		 */
		CustomisablePagingList.prototype._moveHighlightToSelected = function (noAnimation) {

			var newY = (this._data.getViewSelectedRowIndex() - 1) * this._itemHeight;

			if (noAnimation) {
				this._highlightBar.setY(newY);
			} else {
				this._highlightBar.doMove(this._highlightBar.getX(), newY);
			}
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.CustomisablePagingList = CustomisablePagingList;
		return CustomisablePagingList;
	}
);