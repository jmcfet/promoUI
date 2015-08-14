/**
 * CentralPivotList is a concrete implementation of AbstractCustomisableList
 * and provides the functionality and logic to produce a list displaying
 * an odd number of items with the selected / highlighted item at the centre.
 * Upon moving to another item the list scrolls the selected item to the
 * centre position.
 *
 * Example Markup :
 *
 *     <nagra:clippedGroup svg:width="200" svg:height="150">
 *          <nagra:centralPivotList id="list" x="0" y="10" itemTemplate="TextItem">
 *              <nagra:itemConfig movementPositions="0,-30;0,0;0,30;0,60;0,90;0,120;0,150" opacityValues="0,0.4,0.8,1,0.8,0.4,0" />
 *          </nagra:centralPivotList>
 *     </nagra:clippedGroup>
 *
 * Here we have defined a CentralPivotList within a ClippedGroup.  This is to ensure that
 * the list items outside the current view are not displayed.  The CetralPivotList tag has
 * specified some presentation parameters along with the item template which we are going
 * to use for our list items.  In this example we have used the TextItem from the JSFW (see $N.gui.TextItem).
 * Also, within the CentralPivotList tag, we have defined the item configuration using the ItemConfig tag.
 * Here we have specified the positions of each of the visible list items, and their opacity values.
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
 *     // initialise the central pivot list
 *     view.list.setDataMapper(dataMapper);
 *     view.list.setData(data);
 *     view.list.setOrientation($N.gui.CentralPivotList.consts.ORIENTAION_VERTICAL);
 *     view.list.setItemSelectedCallback(myCallbackFunction);
 *     view.list.init();
 *
 * In the JavaScript code, we have created some dummy data to provide to our central pivot list.
 * With our dummy data, we need to define a data mapper.  The data mapper needs to map our data to the
 * list item used (in this example it's the TextItem, but we could use any object which extends AbstractListItem).
 * In our data mapper, we must implement the methods which are required by our list item (see TextItem for
 * a specification on what methods to implement in the data mapper).  TextItem requires only a single accessor
 * method as it only has a single line of text.
 *
 * We have also set the orientation of the list using the `setOrientation` method.  This is not strictly required
 * as the list will default to vertical orientation, but is shown for illustrative purposes.  We could also set
 * the list to a horizontal list by changing the movement positions in the XML, and passing `ORIENTAION_HORIZONTAL`
 * as the parameter to `setOrientation`.
 *
 * Callbacks are handled using the itemSelected callback and itemHighlighted callback (set using the
 * `setItemSelectedCallback` and `setItemHighlightedCallback` respectively).  Both methods can be passed
 * a function which will be executed upon firing of the event.  The firing of the highlight event can
 * be configured using the `setItemHighlightedTimeoutMS` method, which allows you to set a number of
 * milliseconds before the event is fired.  This is to avoid the event constantly firing whilst a user navigates
 * over the list.
 *
 * The AbstractCustomisableList family of GUI classes all implement their own key handling functionality,
 * therefore you only need to pass a key value to the controls keyHandler method, as follows;
 *
 *     var handled = view.list.keyHandler(key);
 *
 * @class $N.gui.CentralPivotList
 * @extends $N.gui.AbstractCustomisableList
 *
 * @requires $N.gui.List
 * @requires $N.gui.Group
 * @requires $N.gui.Util
 * @requires $N.gui.AbstractCustomisableList
 *
 * @constructor
 * @param {Object} docRef Document relating the DOM
 * @param {Object} parent Optional parent GUI object to attach to
 */
define('jsfw/gui/GUIObjects/Controls/List/customisable/CentralPivotList',
    [
    'jsfw/gui/Logic/List/List',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Components/Group',
   	'jsfw/gui/GUIObjects/Controls/List/customisable/AbstractCustomisableList'
    ],
    function (List, Util, Group, AbstractCustomisableList) {

		var CentralPivotList = function (docRef, parent) {

			CentralPivotList.superConstructor.call(this, docRef);

			this._data.setWrapAround(true);
			this._items = new $N.gui.CentralFocusList();

			this._container = new $N.gui.Group(this._docRef);
			this._rootElement = this._container.getRootElement();

			this.setOrientation(CentralPivotList.consts.ORIENTAION_VERTICAL);

			if (parent) {
				parent.addChild(this);
			}
		};

		$N.gui.Util.extend(CentralPivotList, $N.gui.AbstractCustomisableList);

		var proto = CentralPivotList.prototype;

		/**
		 * Initialises the list creating the required list items
		 * and configuring them using the provided item configuration object.
		 *
		 * @method init
		 */
		proto.init = function () {
			if (!this._itemConfig.movementPositions) {
				throw ("CentralPivotList - init: No positions supplied in config");
			}
			CentralPivotList.superClass.init.call(this);
			if (typeof (this._itemConfig.movementPositions) === "string") {
				this._nextItemDistance = (this._itemConfig.movementPositions.split(";").length - 1) / 2;
			} else {
				this._nextItemDistance = (this._itemConfig.movementPositions.length - 1) / 2;
			}

		};

		/**
		 * Initialises the list creating the required list items
		 * and configuring them using the provided item configuration object.
		 *
		 * @method initialise
		 * @deprecated use init()
		 */
		proto.initialise = function () {
			this.init();
		};

		/**
		 * Display data method visualises the data onto the relevant
		 * items in the list, this is called at least once and must be
		 * called after the initialise.
		 *
		 * @method displayData
		 */
		proto.displayData = function () {
			var itemIndex = 0;
			var items = this._items.returnViewableList();
			var start = this._data.getActualSelectedRowIndex() - this._nextItemDistance;
			var end = this._data.getActualSelectedRowIndex() + this._nextItemDistance;
			var data;
			var i;

			for (i = start; i <= end; i++) {
				data = this._data.getRowAtIndex(i);
				if (data) {
					items[itemIndex].update(data, this._getUpdateParameter());
					if (!items[itemIndex].isVisible()) {
						items[itemIndex].show();
					}
				} else {
					items[itemIndex].hide();
				}
				itemIndex++;
			}
			this._items.getSelectedItem().highlight(true, this._getHighlightParameter());
		};

		CentralPivotList.consts = $N.gui.AbstractCustomisableList.consts;

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.CentralPivotList = CentralPivotList;
		return CentralPivotList;
	}
);