/**
 * @class $N.gui.SelectionList
 * @constructor
 * @extends $N.gui.PageableListWithArrows
 *
 * @requires $N.gui.Label
 * @requires $N.apps.core.Log
 * @requires $N.gui.Util
 *
 * @param {Object} docRef (document relating the DOM)
 * @param {Object} parent (optional parent GUI object to attach to)
 */

$N.app.SelectionType = {
	SINGLE: "single",
	MULTIPLE: "multiple"
};

(function ($N) {
	var SelectionList = function (docRef, parent) {
		SelectionList.superConstructor.call(this, docRef);
		this._title = new $N.gui.Label(this._docRef, this._container);
		this._log = new $N.apps.core.Log("CommonGUI", "SelectionList");
		this._selectionType = $N.app.SelectionType.SINGLE;

		this._title.configure({
			x: 65,
			y: -68,
			cssClass: "medium normal ellipsis"
		});

		this._exitCallback = function () {};
	};
	$N.gui.Util.extend(SelectionList, $N.gui.PageableListWithArrows);

	/**
	 * function to hide all icons in the items.
	 * @method _hideAllIcons
	 */
	SelectionList.prototype._hideAllIcons = function () {
		var i,
			count = this._items.length;
		for (i = 0; i < count; i++) {
			this._items[i].hideIcon();
		}
	};

	/**
	 * Initialises the selection list control.  Check if the item template comply with the
	 * API requirement: exposing hideIcon and showIcon function.
	 * @method initialise
	 */
	SelectionList.prototype.initialise = function () {
		this._log("initialise", "Enter");
		SelectionList.superClass.initialise.call(this);
		if (typeof this._items[0].showIcon !== 'function' || typeof this._items[0].hideIcon !== 'function') {
			throw ("SelectionList - initialise: item template is not valid, please make sure it has showIcon and hideIcon function");
		}
		this._log("initialise", "Exit");
	};

	/**
	 * @methdo getFocusState
	 * @return {String}
	 */
	SelectionList.prototype.setSelectionType = function (selectionType) {
		this._selectionType = selectionType;
	};

	/**
	 * @methdo getFocusState
	 * @return {String}
	 */
	SelectionList.prototype.getSelectionType = function () {
		return this._selectionType;
	};

	/**
	 * @method _selectItem
	 * @param {Object} item
	 */
	SelectionList.prototype._selectItem = function (item) {
		var data = this._data.getSelectedItem();
		if (this._selectionType === $N.app.SelectionType.SINGLE) {
			this._hideAllIcons();
			item.showIcon();
		} else {
			item.toggleIconVisibility();
		}
		data.selected = true;
		this._itemSelectedCallback(data);
	};

	/**
	 * keyHandler method defines the logic to perform upon
	 * receiving a supplied key press.
	 * @method keyHandler
	 * @param {String} key
	 */
	SelectionList.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.gui.FrameworkCore.getKeys(),
			handled = false,
			selectedItem = this.getActualSelectedItem();
		switch (key) {
		case keys.KEY_OK:
			this._selectItem(selectedItem);
			handled = true;
			break;
		case keys.KEY_RIGHT:
			handled = true;
			break;
		case keys.KEY_LEFT:
		case keys.KEY_BACK:
			if (this._exitCallback) {
				handled = true;
				this._exitCallback();
			}
			break;
		}
		if (!handled) {
			SelectionList.superClass.keyHandler.call(this, key);
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	/**
	 * @method setTitle
	 * @param {String} value
	 */
	SelectionList.prototype.setTitle = function (value) {
		this._title.setText(value);
	};

	/**
	 * @method setExitCallback
	 * @param {Object} callback
	 */
	SelectionList.prototype.setExitCallback = function (callback) {
		this._log("setExitCallback", "Enter");
		this._exitCallback = callback;
		this._log("setExitCallback", "Exit");
	};
	$N.gui = $N.gui || {};
	$N.gui.SelectionList = SelectionList;
}($N || {}));
