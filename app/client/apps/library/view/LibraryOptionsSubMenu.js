/**
 * LibraryOptionsSubMenu is a GUI component containing a menu and title
 * It is designed to fit inside the LibraryOptions as a submenu, but could be used separately
 * It should not be used on its own, but should be extended by menus such as LibraryOptionsSubMenuConfirmation
 *
 * @class $N.gui.LibraryOptionsSubMenu
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	function LibraryOptionsSubMenu(docRef, parent) {
		LibraryOptionsSubMenu.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "LibraryOptionsSubMenu");
		this._container = new $N.gui.Group(this._docRef);
		this._background = new $N.gui.Container(this._docRef, this._container);
		this._title = new $N.gui.Label(docRef, this._container);
		this._menu = new $N.gui.PageableListWithArrows(this._docRef, this._container);

		this._width = 660;
		this._height = 576;

		this._container.configure({
			width: this._width,
			height: this._height
		});
		this._background.configure({
			width: this._width,
			height: this._height,
			cssClass: "menuBackgroundDefocus"
		});
		this._title.configure({
			x: 57,
			y: 30,
			width: 546,
			cssClass: "libraryOptionsSubMenuTitle"
		});
		this._menu.configure({
			x: 0,
			y: 105,
			itemHeight: 72,
			visibleItemCount: 6,
			itemTemplate: "LibraryOptionsSubMenuItem",
			dataMapper: {
				getTitle: function (data) {
					return data.title;
				},
				getIcon: function (data) {
					return data.href || "";
				},
				getChannelNumber: function (data) {
					return data.channelNumber;
				},
				getSelected: function (data) {
					return data.selected;
				}
			}
		});
		this._menu._upArrow.configure({
			x: 610,
			y: -45,
			visible: false
		});
		this._menu._downArrow.configure({
			x: 610,
			y: 435,
			visible: false
		});
		this._exitCallback = function () {};

		this._rootSVGRef = this._container.getRootSVGRef();

		if (parent) {
			parent.addChild(this);
		}
	}
	$N.gui.Util.extend(LibraryOptionsSubMenu, $N.gui.GUIObject);

	/**
	 * @method setExitCallback
	 * @param {Function} callback
	 */
	LibraryOptionsSubMenu.prototype.setExitCallback = function (callback) {
		this._exitCallback = callback;
	};

	/**
	 * @method _itemSelected
	 * @abstract
	 * @param {Object} data
	 */
	LibraryOptionsSubMenu.prototype._itemSelected = function (data) {
		throw ("LibraryOptionsSubMenu - _itemSelected: Illegal operation on an abstract method");
	};

	/**
	 * @method initialise
	 */
	LibraryOptionsSubMenu.prototype.initialise = function () {
		this._log("initialise", "Enter");
		this._menu.setItemSelectedCallback(this._itemSelected.bind(this));
		this._menu.initialise();
		this._log("initialise", "Exit");
	};

	/**
	 * @method _setData
	 * @param {Object} data
	 */
	LibraryOptionsSubMenu.prototype._setData = function (data) {
		this._log("_setData", "Enter");
		this._title.setText(data.title);
		this._menu.setData(data.options);
		this._menu.displayData(true);
		this._log("_setData", "Exit");
	};

	/**
	 * @method preview
	 * @param {Object} data
	 */
	LibraryOptionsSubMenu.prototype.preview = function (data) {
		this._log("preview", "Enter");
		this._setData(data);
		this._log("preview", "Exit");
	};

	/**
	 * @method activate
	 */
	LibraryOptionsSubMenu.prototype.activate = function () {
		this._log("activate", "Enter");
		this._background.setCssClass("menuBackgroundFocus");
		this._menu.focus();
		this.show();
		this._log("activate", "Exit");
	};

	/**
	 * @method passivate
	 */
	LibraryOptionsSubMenu.prototype.passivate = function () {
		this._log("passivate", "Enter");
		this.hide();
		this._menu.defocus();
		this._background.setCssClass("menuBackgroundDefocus");
		this._log("passivate", "Exit");
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	LibraryOptionsSubMenu.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter & Exit");
		return this._menu.keyHandler(key);
	};

	$N.gui.LibraryOptionsSubMenu = LibraryOptionsSubMenu;

}(window.parent.$N || {}));
