/**
 * PivotList is a concrete implementation of AbstractCustomisableList
 * and provides the functionality and logic to produce a list displaying
 * an arbitrary number of items with a positional selected/highlighted item.
 * Upon moving to another item the list scrolls the selected item to the
 * required position.
 *
 * Example Markup :
 *
 *     <nagra:clippedGroup svg:width="200" svg:height="150">
 *         <nagra:pivotList id="list" x="0" y="10" itemTemplate="TextItem" focusAtTop="false">
 *             <nagra:itemConfig movementPositions="0,-30;0,0;0,30;0,60;0,90;0,120;0,150" opacityValues="0,0.4,0.8,1,0.8,0.4,0" />
 *         </nagra:pivotList>
 *     </nagra:clippedGroup>
 *
 * Here we have defined a PivotList within a ClippedGroup. This is to ensure that
 * the list items outside the current view are not displayed.
 *
 * In the `PivotList` tag, you can see some presentation parameters (within
 * the tag header) and an `itemConfig` tag (embedded within the
 * `PivotList` tag).
 *
 * The presentation parameters are:
 * <ol>
 * <li>`id` - the identifier that will be used to manipulate the PivotList
 *     in your JavaScript code</li>
 * <li>`x` and `y` - the position of the PivotList relative to the
 *     top-left corner of the enclosing object (here, a `clippedGroup`)</li>
 * <li>An `itemTemplate` type, which is the name of the JavaScript file that
 *     contains the text item definition</li>
 * <li>An optional `focusAtTop` tag, which if not present is set to
 *     `false`. This is explained in more detail later on.</li>
 * </ol>
 * The item configuration, in the `ItemConfig` tag, defines the positions of
 * each of the visible list items, and their opacity values.
 *
 * If the `focusAtTop` tag is set to `true`, then the z-order
 * (front-to-back order) of the list items is reorganised before they are moved
 * by manipulating the DOM. This ensures that, if the currently-selected item overlaps
 * others, then it will be displayed in front of the rest of them. This is very
 * computationally-expensive, so should only be used when necessary.
 *
 * Example JavaScript:
 *
 *     $N.gui.FrameworkCore.extendWithGUIObjects(document.documentElement, view);
 *
 *     // create some dummy data
 *     var data = [{"title":"title one"}, {"title":"title two"}, {"title":"title three"}, {"title":"title four"}, {"title":"title five"}];
 *
 *     // define the data mapper to our dummy data
 *     var dataMapper = {
 *         getText: function (item) {
 *             return item.title;
 *         }
 *     }
 *
 *     // initialise the pivot list
 *     view.list.setDataMapper(dataMapper);
 *     view.list.setData(data);
 *     view.list.setOrientation($N.gui.PivotList.consts.ORIENTAION_VERTICAL);
 *     view.list.setFocusPosition(2);
 *     view.list.setFocusAtTop(true);
 *     view.list.setItemSelectedCallback(myCallbackFunction);
 *     view.list.init();
 *
 * In the JavaScript code, we have created some dummy data to provide to our pivot list.
 * With our dummy data, we need to define a data mapper.  The data mapper needs to map our data to
 * the list item used (in this example it's the TextItem, but we could use any object which
 * extends AbstractListItem). In our data mapper, we must implement the methods which are required
 * by our list item (see TextItem for a specification on what methods to implement in the data
 * mapper).  TextItem requires only a single accessor method as it only has a single line of text.
 *
 * We have also set the orientation of the list using the `setOrientation` method. This
 * is not strictly required as the list will default to vertical orientation, but is shown for
 * illustrative purposes.  We could also set the list to a horizontal list by changing the
 * movement positions in the XML, and passing `ORIENTAION_HORIZONTAL` as the parameter
 * to `setOrientation`.
 *
 * Callbacks are handled using the itemSelected callback and itemHighlighted callback (set using
 * the `setItemSelectedCallback` and `setItemHighlightedCallback`
 * respectively). Both methods can be passed a function which will be executed upon firing of the
 * event.  The firing of the highlight event can be configured using the
 * `setItemHighlightedTimeoutMS` method, which allows you to set a number of
 * milliseconds before the event is fired.  This is to avoid the event constantly firing whilst
 * a user navigates over the list.
 *
 * The AbstractCustomisableList family of GUI classes all implement their own key handling
 * functionality. Therefore, you only need to pass a key value to the controls keyHandler method,
 * as follows;
 *
 *     var handled = view.list.keyHandler(key);
 *
 *
 * @class $N.gui.PivotList
 * @extends $N.gui.AbstractCustomisableList
 *
 * @requires $N.gui.CentralFocusList
 * @requires $N.gui.Group
 * @requires $N.gui.Util
 * @requires $N.gui.AbstractCustomisableList
 *
 * @constructor
 * @param {Object} docRef Document relating the DOM
 * @param {Object} parent Optional parent GUI object to attach to
 */
define('jsfw/gui/GUIObjects/Controls/List/customisable/PivotList',
    [
    'jsfw/gui/Logic/List/List',
    'jsfw/gui/GUIObjects/Components/Group',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Controls/List/customisable/AbstractCustomisableList'
    ],
    function (List, Group, Util, AbstractCustomisableList) {

		var PivotList = function (docRef, parent) {

			PivotList.superConstructor.call(this, docRef);

			this._data.setWrapAround(true);
			this._items = new $N.gui.FocusList();

			this._container = new $N.gui.Group(this._docRef);
			this._rootElement = this._container.getRootElement();

			this.setOrientation(PivotList.consts.ORIENTAION_VERTICAL);
			this.setFocusPosition(1);
			this._isFocusAtTop = false;

			if (parent) {
				parent.addChild(this);
			}
		};

		$N.gui.Util.extend(PivotList, $N.gui.AbstractCustomisableList);

		var proto = PivotList.prototype;

		/**
		 * Sets the focus position.
		 * @method setFocusPosition
		 * @param {Number} position the position (index) of the item to focus.
		 */
		proto.setFocusPosition = function (position) {
			this._focusPosition = parseInt(position, 10);
			this._items.setFocusPosition(this._focusPosition);
		};

		/**
		 * Returns the focus position.
		 * @method getFocusPosition
		 * @return {Number}  the position (index) of the item to focus.
		 */
		proto.getFocusPosition = function () {
			return this._focusPosition;
		};

		/**
		 * Sets whether DOM z-ordering is enabled, so that the currently-focused item is in front
		 * of the other items. (Enabled = true; disabled = false.)
		 *
		 * Note: This carries a significant computational overhead, so its use should be sparing.
		 *
		 * The default value (if `focusAtTop` is not specified in the mark-up) is
		 * `false`.
		 *
		 * See the file-level jsdocs for more detail.
		 *
		 * @method setFocusAtTop
		 * @param {Boolean} focusAtTop whether DOM z-ordering is enabled to bring the focus to the front.
		 */
		proto.setFocusAtTop = function (focusAtTop) {
			this._isFocusAtTop = (focusAtTop === true || focusAtTop === 'true');
		};

		/**
		 * Display data method visualises the data onto the relevant
		 * items in the list, this is called at least once and must be
		 * called after the initialise.
		 *
		 * @method displayData
		 */
		proto.displayData = function () {
			var itemIndex = 0,
			    items = this._items.returnViewableList(),
			    start = this._data.getActualSelectedRowIndex() - this._focusPosition,
			    end = start + this._items.getVisibleRows() - 1;

			var data,
			    i,
			    item;

			for (i = start; i <= end; i++) {
				data = this._data.getRowAtIndex(i);
				item = items[itemIndex];
				if (data) {
					item.update(data, this._getUpdateParameter());
					if (!item.isVisible()) {
						item.show();
					}
				} else if (item.isVisible()) {
					item.hide();
				}
				itemIndex++;
			}
			this._items.getSelectedItem().highlight(true, this._getHighlightParameter());
			if (this._isFocusAtTop) {
				this._reorderDOMNodes();
			}
		};

		/**
		 * Selects the previous item in the list scrolls the list if required.
		 * @method selectPrevious
		 * @return {Boolean} True if movement to the previous list item has been made, false if not.
		 */
		proto.selectPrevious = function () {
			var lastItem = this._items.getLastItem(),
			    itemCount = this._items.getSize();

			var i,
			    newData,
			    scrolled;

			// check we can move to the previous item
			if (!this._data.isSelectedAtFirst() || this._data.getWrapAround()) {
				this._items.getSelectedItem().unHighlight();
				scrolled = this._items.selectPrevious();
				this._items.getSelectedItem().highlight(false, this._getHighlightParameter());
				if (this._isFocusAtTop) {
					this._reorderDOMNodes();
				}
				if (scrolled) {
					newData = this._data.getRowAtIndex(this._data.getActualSelectedRowIndex() - (this._focusPosition + 1));
					if (newData) {
						lastItem.update(newData, this._getUpdateParameter());
						if (!lastItem.isVisible()) {
							lastItem.show();
						}
					} else {
						lastItem.hide();
					}
					this._data.selectPrevious();
					for (i = 1; i <= itemCount; i++) {
						this._items.getRowAtIndex(i).moveToNext();
					}
				}
				this._handleItemHighlighted(this._data.getSelectedItem());

				return true;
			}

			return false;
		};

		/**
		 * Selects the next item in the list and scrolls the list if required.
		 * @method selectNext
		 * @return {Boolean} True if movement to the next list item has been made, false if not.
		 */
		proto.selectNext = function () {
			var firstItem = this._items.getFirstItem(),
			    itemCount = this._items.getSize();

			var i,
			    newData,
			    scrolled;

			// check we can move to the next item
			if (!this._data.isSelectedAtLast() || this._data.getWrapAround()) {
				this._items.getSelectedItem().unHighlight();
				scrolled = this._items.selectNext();
				this._items.getSelectedItem().highlight(false, this._getHighlightParameter());
				if (this._isFocusAtTop) {
					this._reorderDOMNodes();
				}
				if (scrolled) {
					newData = this._data.getRowAtIndex(this._data.getActualSelectedRowIndex() + (this._items.getVisibleRows() - this._focusPosition));

					if (newData) {
						firstItem.update(newData, this._getUpdateParameter());
						if (!firstItem.isVisible()) {
							firstItem.show();
						}
					} else {
						firstItem.hide();
					}
					this._data.selectNext();
					for (i = 1; i <= itemCount; i++) {
						this._items.getRowAtIndex(i).moveToPrevious();
					}
				}
				this._handleItemHighlighted(this._data.getSelectedItem());
				return true;
			}
			return false;
		};

		/**
		 * Reorder the DOM nodes associated with the items inside the pivot list, so that the
		 * currently-selected item is displayed on top of the others.
		 * TODO: This needs to be redesigned for HTML-compliance, moved to GUIObject and made public.
		 *
		 * @method _reorderDOMNodes
		 * @private
		 */
		proto._reorderDOMNodes = function () {
			var selectedItem = this._items.getSelectedItem();

			// If there is no selected item yet, we can't continue
			if (!selectedItem) {
				return;
			}

			selectedItem.bringToFront();
		};

		/**
		 * A set of constants for a pivot list. Inherits from {{#crossLink "$N.gui.AbstractCustomisableList"}}{{/crossLink}}
		 * @property {Object} consts
		 * @readonly
		 * see `$N.gui.AbstractCustomisableList.consts`
		 */
		PivotList.consts = $N.gui.AbstractCustomisableList.consts;

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.PivotList = PivotList;
		return PivotList;
	}
);