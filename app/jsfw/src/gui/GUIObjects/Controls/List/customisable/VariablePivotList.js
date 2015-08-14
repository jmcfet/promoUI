/**
 * VariablePivotList is an extension of `PivotList`. It provides the functionality and
 * logic necessary to produce a list displaying an arbitrary number of items of arbitrary
 * widths and heights, one item of which is highlighted. The highlighted list item is in a
 * fixed position.
 *
 * Upon moving through the list, the list scrolls the newly-selected item to the required
 * position. It works in a similar way to a `PivotList`, except that the size of
 * individual list items can be dependent on various factors. These factors include (and
 * mainly consist of a combination of):
 * <ol>
 * <li>The implementation of a list item's `getWidth` and `getHeight`
 *     functions</li>
 * <li>The list item's horizontal and/or vertical padding values</li>
 * <li>The variable lists's visible width and height property values</li>
 * </ol>
 *
 * Example Mark-up:
 *
 *     <nagra:clippedGroup id="group" x="0" y="10" width="895" height="290">
 *         <nagra:variablePivotList id="list" x="10" y="10" itemTemplate="VariableListItem" orientation="horizontal" padding="10">
 *             <nagra:itemConfig movementPositions="-200,0;0,0;100,0;200,0;300,0;400,0;500,0" opacityValues="0,1,1,1,1,1,0"/>
 *         </nagra:variablePivotList>
 *     </nagra:clippedGroup>
 *
 * In the above example, we have defined a `VariablePivotList` within a
 * `ClippedGroup`. This is to ensure that the list items outside the current view are
 * not displayed. The `VariablePivotList` tag has been specified with some presentation
 * parameters, along with the item template which we are going to use for our list items. (In
 * this example, for the item template, we have our own `VariableListItem`. We go into
 * more detail on this later.)
 *
 * We have defined the configuration of each item using a single `ItemConfig` tag, by
 * specifying the initial movement positions and opacity values of each of the visible list
 * items. Note that, if the currently-selected list item changes, the list's movement
 * positions will be re-calculated automatically, and the initial movement positions will be
 * discarded.
 *
 * In the `variablePivotList` tag, we have the padding property. This sets the
 * horizontal and vertical padding value of each cell, in pixels. This can also be set via the
 * `VariablePivotList` class's `setPadding` method.
 *
 * <b>Please note:</b> The `setWidth` and `setHeight` methods must exist within
 * each of the list's list items (i.e. in the list item implementation referred to in the
 * `variablePivotList`'s `itemTemplate` parameter).
 *
 * Example JavaScript (which would make use of the above mark-up):
 *
 *     $N.gui.FrameworkCore.extendWithGUIObjects(document.documentElement, view);
 *
 *     // create some dummy data
 *     var data = [
 *         { title: "Item1" },
 *         { title: "LongerItem2" },
 *         { title: "VeryLongItemNumber3" },
 *         { title: "I4" },
 *         { title: "Item5" },
 *     ];
 *
 *     // Define the data mapper to our dummy data
 *     var dataMapper = {
 *         getTitle: function (item) {
 *             return item.title;
 *         }
 *     }
 *
 *     // Initialise the list
 *     var list = view.group.list;
 *     list.setDataMapper(dataMapper);
 *     list.setData(data);
 *     list.setFocusPosition(1);
 *     list.setWrapAround(false);
 *     list.setItemSelectedCallback(myCallbackFunction);
 *     list.init();
 *
 * In the above JavaScript code, we have created some dummy data to provide to our variable pivot list.
 *
 * With our dummy data, we define a data mapper. The data mapper maps our data to the list items. (In
 * this example, we are using our own list item implementation, `VariableListItem`. However,
 * we could use any object which extends `AbstractListItem`. and defines a
 * `getWidth` and `getHeight` method.) In our data mapper, we implement a
 * `getTitle` function, which returns the text that each list item will contain.
 *
 * "Item selected" and "item highlighted" callbacks can be handled using methods
 * `setItemSelectedCallback` and `setItemHighlightedCallback` respectively. Both
 * methods can be passed a function, which will be executed upon firing of the event. The firing of the
 * highlight event can be configured using the `setItemHighlightedTimeoutMS` method, which
 * allows you to set a number of milliseconds before the event is fired. This is to avoid the event
 * constantly firing while a user navigates over the list.
 *
 * The classes that inherit from `AbstractCustomisableList` (which include this one) all
 * implement their own key-handling functionalities. You should thus only need to pass a key value to
 * the `VariablePivotList`'s `keyHandler` method, similar to as follows:
 *
 *     keyhandler: function (key) {
 *         var keys = $N.input.KeyInterceptor.getKeyMap();
 *         var handled = view.group.list.keyHandler(key);
 *         return handled;
 *     }
 *
 * Note: This class makes occasional reference to "initialise-only mode". This mode cuts out some
 * of the steps that usually apply to updating a variable pivot list, such as showing and hiding
 * items, for efficiency purposes. Initialise-only mode is where the items (and, in particular,
 * their movement positions) need to be calculated for the first time, and much of the steps for
 * updating items is unnecessary.
 *
 * @class $N.gui.VariablePivotList
 * @extends $N.gui.PivotList
 *
 * @requires $N.gui.Util
 * @requires $N.gui.PivotList
 * @requires $N.gui.AbstractCustomisableList
 *
 *
 * @constructor
 * @param {Object} docRef Document relating to the DOM.
 * @param {Object} parent Optional parent GUI object to attach to.
 */
define('jsfw/gui/GUIObjects/Controls/List/customisable/VariablePivotList',
    [
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Controls/List/customisable/PivotList',
    'jsfw/gui/GUIObjects/Controls/List/customisable/AbstractCustomisableList'
    ],
    function (Util, PivotList, AbstractCustomisableList) {

		var VariablePivotList = function (docRef, parent) {
			VariablePivotList.superConstructor.call(this, docRef);
			this._padding = 0;
			if (parent) {
				parent.addChild(this);
			}
		};

		$N.gui.Util.extend(VariablePivotList, $N.gui.PivotList);

		/**
		 * Recalculates and returns the new movement positions of each of the list items,
		 * based on the position of the new currently-selected list item, and sets the new
		 * movement positions within the list.
		 *
		 * @method _calculateNewMovementPositions
		 * @param {Number} offset the position of the new currently-selected list item
		 *                        relative to the previous one. For example, a value of
		 *                        `-1` would refer to the item immediately before
		 *                        the currently-selected item.
		 * @private
		 * @return {Array} the new movement position of each of the list items. Each element
		 *                 is an object consisting of an `x` and a `y`
		 *                 dimension.
		 */
		VariablePivotList.prototype._calculateNewMovementPositions = function (offset) {
			var items = this._items.getData(),
			    itemCount = this._items.getSize(),
			    positions = this._movementPositions || items[0].getMovementPositions(),
			    sizes = new Array(itemCount),
			    focus = this._focusPosition,
			    isHorizontal = (this._orientation === $N.gui.AbstractCustomisableList.consts.ORIENTAION_HORIZONTAL);

			var i,
			    pos;

			// find sizes for each visible item
			offset--;

			for (i = 0; i < itemCount; i++) {
				pos = items[i]._movementPositions.getActualSelectedRowIndex() + offset;
				if (pos > 0) {
					sizes[pos] = (isHorizontal ? items[i].getWidth() : items[i].getHeight());
				}
			}

			// calculate start position based on focus point
			offset = parseInt((isHorizontal ? positions[focus].x : positions[focus].y), 10);

			for (i = focus - 1; i > 0; i--) {
				offset -= sizes[i] + this._padding;
			}
			for (i = 1; i < itemCount - 1; i++) {
				if (isHorizontal) {
					positions[i].x = offset;
				} else {
					positions[i].y = offset;
				}
				offset += sizes[i] + this._padding;
			}
			this._movementPositions = positions;

			return positions;
		};

		/**
		 * Calculates the positions of each list item, using the given position offset, and
		 * sets these recalculated positions inside each item.
		 *
		 * @method _calculateAndSetNewMovementPositions
		 * @param {Number} offset the position of the new currently-selected list item
		 *                        relative to the previous one. For example, a value of
		 *                        `-1` would refer to the item immediately before
		 *                        the currently-selected item.
		 * see _calculateNewMovementPositions
		 * @private
		 */
		VariablePivotList.prototype._calculateAndSetNewMovementPositions = function (offset) {
			var positions = this._calculateNewMovementPositions(offset),
			    itemCount = this._items.getSize(),
			    items = this._items.getData();

			var i;

			for (i = 0; i < itemCount; i++) {
				items[i].setNewMovementPositions(positions);
			}
		};

		/**
		 * Creates the list items that make up the visual aspect of the list. There is a set
		 * number of visible items as defined by the size of the movement positions that the
		 * items can move to.
		 *
		 * @method init
		 */
		VariablePivotList.prototype.init = function () {
			VariablePivotList.superClass.init.call(this);
			this._selectCurrent();
		};

		/**
		 * Creates the list items that make up the visual aspect of the list. There is a set
		 * number of visible items as defined by the size of the movement positions that the
		 * items can move to.
		 *
		 * @method initialise
		 * @deprecated use init()
		 */
		VariablePivotList.prototype.initialise = function () {
			this.init();
		};

		/**
		 * Selects the previous list item (i.e. the one immediately to the left of the
		 * currently-selected one), if `wrapAround` is set to `true` or if
		 * the currently-selected item is not the first item. If `wrapAround` is
		 * set to `true` and the first item in the list is already selected, then
		 * the previous item becomes the last item in the list.
		 *
		 * @method selectPrevious
		 * @param {Boolean} initOnly used internally. DO NOT SET THIS PARAMETER.
		 * @return {Boolean} True if movement to the previous list item has been made, false if not.
		 */
		VariablePivotList.prototype.selectPrevious = function (initOnly) {
			var items = this._items.getData(),
			    itemCount = this._items.getSize(),
			    lastItem = this._items.getLastItem(),
			    shouldBeMoved = !this._data.isSelectedAtFirst() || this._data.getWrapAround();

			var i,
			    newData,
			    scrolled,
			    item,
			    next;

			this._calculateAndSetNewMovementPositions(1);

			// check we can move to the previous item
			if (shouldBeMoved) {
				if (!initOnly) {
					this._items.getSelectedItem().unHighlight();
				}
				scrolled = this._items.selectPrevious();
				if (!initOnly) {
					this._highlightSelectedItem();
				}
				if (scrolled) {
					newData = this._data.getRowAtIndex(this._data.getActualSelectedRowIndex() - (this._focusPosition + 1));
					this._updateDataAndVisibilityOfItem(lastItem, newData, initOnly);
					this._data.selectPrevious();
					for (i = 1; i <= itemCount; i++) {
						item = this._items.getRowAtIndex(i);
						if (initOnly) {
							item._movementPositions.selectNext();
							next = item._movementPositions.getSelectedItem();
							item._moveItem(next, true);
						} else {
							item.moveToNext();
						}
					}
				}
				if (!initOnly) {
					this._handleItemHighlighted(this._data.getSelectedItem());
				}
			}

			return shouldBeMoved;
		};

		/**
		 * Selects the next list item (i.e. the one immediately to the right of the
		 * currently-selected one), if `wrapAround` is set to `true` or if
		 * the currently-selected item is not the last item. If `wrapAround` is set
		 * to `true` and the last item in the list is already selected, then
		 * the next item becomes the first item in the list.
		 *
		 * @method selectNext
		 * @param {Boolean} initOnly used internally. DO NOT SET THIS PARAMETER.
		 * @return {Boolean} True if movement to the next list item has been made, false if not.
		 */
		VariablePivotList.prototype.selectNext = function (initOnly) {
			var items = this._items.getData(),
			    itemCount = this._items.getSize(),
			    firstItem = this._items.getFirstItem(),
			    shouldBeMoved = !this._data.isSelectedAtLast() || this._data.getWrapAround();

			var i,
			    newData,
			    scrolled,
			    item,
			    next;

			this._calculateAndSetNewMovementPositions(-1);

			// check we can move to the next item
			if (shouldBeMoved) {
				if (!initOnly) {
					this._items.getSelectedItem().unHighlight();
				}
				scrolled = this._items.selectNext();
				if (!initOnly) {
					this._highlightSelectedItem();
				}
				if (scrolled) {
					newData = this._data.getRowAtIndex(this._data.getActualSelectedRowIndex() + (this._items.getVisibleRows() - this._focusPosition));
					this._updateDataAndVisibilityOfItem(firstItem, newData, initOnly);
					this._data.selectNext();
					for (i = 1; i <= itemCount; i++) {
						item = this._items.getRowAtIndex(i);
						if (initOnly) {
							item._movementPositions.selectPrevious();
							next = item._movementPositions.getSelectedItem();
							item._moveItem(next, true);
						} else {
							item.moveToPrevious();
						}
					}
				}
				if (!initOnly) {
					this._handleItemHighlighted(this._data.getSelectedItem());
				}
			}
			return shouldBeMoved;
		};

		/**
		 * Visualises the data onto the relevant items in the list. This is called at least once, and must be
		 * called after the initialise.
		 *
		 * @method displayData
		 */
		VariablePivotList.prototype.displayData = function () {
			var rootNode = this._rootElement,
			    children = rootNode.childNodes;

			var items,
			    itemCount,
			    childCount,
			    i,
			    styleValue;

			if (children && children.length !== 0) {
				items = this._items.getData();
				itemCount = this._items.getSize();

				// Force each item into the render tree by adding "visibility:hidden" to the CSS style in the DOM
				childCount = children.length;
				for (i = 0; i < childCount; i++) {
					styleValue = children[i].getAttribute("style");
					if (styleValue && styleValue !== "") {
						children[i].setAttribute("style", "visibility:hidden;" + styleValue);
					} else {
						children[i].setAttribute("style", "visibility:hidden;");
					}
				}

				this._calculateAndSetNewMovementPositions(0);
				this._updateData();

				this.selectNext(true);
				this.selectPrevious(true);

				VariablePivotList.superClass.displayData.call(this);

				// Remove the "visibility:hidden" CSS style from each item in the DOM
				for (i = 0; i < childCount; i++) {
					styleValue = children[i].getAttribute("style");
					if (styleValue === "visibility:hidden;") {
						children[i].removeAttribute("style");
					} else {
						children[i].setAttribute("style", styleValue.substring(18));
					}
				}
			}
		};

		/**
		 * Sets the padding value of each list item, in pixels. The padding value is the
		 * width of space between each list item.
		 *
		 * @method setPadding
		 * @param {Number} padding the padding value of each list item, in pixels.
		 */
		VariablePivotList.prototype.setPadding = function (padding) {
			this._padding = Number(padding, 10);
		};

		/**
		 * Visualises the data onto the relevant items in the list. Similar to method
		 * `$N.gui.PivotList.displayData`, except doesn't show, hide or
		 * reorder items, saving unnecessary computation when visualising items for
		 * the first time.
		 *
		 * @method _updateData
		 * @private
		 */
		VariablePivotList.prototype._updateData = function () {
			var itemIndex = 0,
			    items = this._items.returnViewableList(),
			    start = this._data.getActualSelectedRowIndex() - this._focusPosition,
			    end = start + this._items.getVisibleRows() - 1;

			var data,
			    i;

			for (i = start; i <= end; i++) {
				data = this._data.getRowAtIndex(i);
				if (data) {
					items[itemIndex].update(data, this._getUpdateParameter());
				}
				itemIndex++;
			}
		};

		/**
		 * An amalgam of methods `selectNext` and `selectPrevious`, except
		 * that the list is not moved forwards or backwards, highlight and un-highlight are not
		 * carried out and nothing is returned. Used in calculating the item positions for the
		 * first time, when method `displayData` is called.
		 *
		 * @method _selectCurrent
		 * @private
		 */
		VariablePivotList.prototype._selectCurrent = function () {
			var items = this._items,
			    data = this._data,
			    itemCount = items.getSize(),
			    currItem = items.getRowAtIndex(items.getFocusPosition());

			var i,
			    newData;

			for (i = 1; i < itemCount; i++) {
				newData = data.getRowAtIndex(i);
				items.getRowAtIndex(i).update(newData, this._getUpdateParameter());
			}
		};

		/**
		 * Highlights the currently-selected item and (if needed) recalculates the DOM node
		 * ordering. Do not call this method if in the process of initialising the method.
		 *
		 * @method _highlightSelectedItem
		 * @private
		 */
		VariablePivotList.prototype._highlightSelectedItem = function () {
			this._items.getSelectedItem().highlight(false, this._getHighlightParameter());
			if (this._isFocusAtTop) {
				this._reorderDOMNodes();
			}
		};


		/**
		 * Updates the given item with the given data, and updates its visibility accordingly.
		 *
		 * @method _updateDataAndVisibilityOfItem
		 * @param item      {Object} the displayable item to update.
		 * @param newData   {Object) the data to display in the item.
		 * @param initOnly  {Boolean} whether this method was called in "initialise-only" mode. If true,
		 *                  then the item visibility need not be updated.
		 * @private
		 */
		VariablePivotList.prototype._updateDataAndVisibilityOfItem = function (item, newData, initOnly) {
			if (newData) {
				item.update(newData, this._getUpdateParameter());
				if (!initOnly && !item.isVisible()) {
					item.show();
				}
			} else if (!initOnly) {
				item.hide();
			}
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.VariablePivotList = VariablePivotList;
		return VariablePivotList;
	}
);