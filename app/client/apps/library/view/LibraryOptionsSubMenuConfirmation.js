/**
 * LibraryOptionsSubMenuConfirmation is an extension of LibraryOptionsSubMenu containing additional
 * functionality to support menu item selection and success callback
 *
 * @class $N.gui.LibraryOptionsSubMenuConfirmation
 * @constructor
 * @extends $N.gui.LibraryOptionsSubMenu
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	function LibraryOptionsSubMenuConfirmation(docRef, parent) {
		LibraryOptionsSubMenuConfirmation.superConstructor.call(this, docRef, parent);
		this._log = new $N.apps.core.Log("CommonGUI", "LibraryOptionsSubMenuConfirmation");
		this._parentItem = null;
		this._successCallback = function () {};
	}
	$N.gui.Util.extend(LibraryOptionsSubMenuConfirmation, $N.gui.LibraryOptionsSubMenu);

	/**
	 * @method _itemSelected
	 * @param {Object} data
	 */
	LibraryOptionsSubMenuConfirmation.prototype._itemSelected = function (data) {
		var listData = this._menu.getData(),
			listDataLength = listData.length,
			i;
		this._log("_itemSelected", "Enter");
		if (data.value) {
			for (i = 0; i < listDataLength; i++) {
				listData[i].selected = false;
			}
			data.selected = true;
			this._menu.displayData();
			this._parentItem.setFirstSubTitle(data.title);
			this._successCallback(data.value);
		}
		this._exitCallback();
		this._log("_itemSelected", "Exit");
	};

	/**
	 * @method _setData
	 * @param {Object} data
	 */
	LibraryOptionsSubMenuConfirmation.prototype._setData = function (data) {
		this._log("_setData", "Enter");
		LibraryOptionsSubMenuConfirmation.superClass._setData.call(this, data);
		this._successCallback = data.successCallback;
		this._log("_setData", "Exit");
	};

	/**
	 * @method activate
	 * @param {Object} parentItem
	 * @param {Object} optionsController
	 */
	LibraryOptionsSubMenuConfirmation.prototype.activate = function (parentItem, optionsController) {
		this._log("activate", "Enter");
		var FIRST_ITEM_INDEX = 1;
		this._parentItem = parentItem;
		LibraryOptionsSubMenuConfirmation.superClass.activate.call(this);
		this._menu.selectItemAtIndex(FIRST_ITEM_INDEX, true);
		this._log("activate", "Exit");
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	LibraryOptionsSubMenuConfirmation.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter & Exit");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap();
		if (key === keys.KEY_RIGHT) {
			return false;
		}
		return LibraryOptionsSubMenuConfirmation.superClass.keyHandler.call(this, key);
	};

	$N.gui.LibraryOptionsSubMenuConfirmation = LibraryOptionsSubMenuConfirmation;
}(window.parent.$N || {}));
