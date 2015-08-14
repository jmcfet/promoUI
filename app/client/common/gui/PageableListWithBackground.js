/**
 * @class $N.gui.PageableListWithBackground
 * @constructor
 * @extends $N.gui.PageableList
 * @requires $N.gui.Container
 * @requires $N.gui.Util
 * @param {Object} docRef
 * @param {Object} [parent]
 */
(function ($N) {
	var PageableListWithBackground = function (docRef, parent) {
		PageableListWithBackground.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "PageableListWithBackground");
		this._background = new $N.gui.Container(docRef, this._container);
		this.ON_FOCUS_BACKGROUNDCLASS = "menuBackgroundFocus";
		this.OUT_OF_FOCUS_BACKGROUNDCLASS = "menuBackgroundDefocus";
		this._colorKeyCallbacks = null;
		this._successCallback = function () {};
	};
	$N.gui.Util.extend(PageableListWithBackground, $N.gui.PageableList);
	PageableListWithBackground.prototype.setBackgroundConfig = function (configObj) {
		this._background.configure(configObj);
	};

	/**
	 * Display data method visualises the data onto the relevant
	 * items in the list, this is called at least once and must be
	 * called after the initialise. Calls the super class displayData
	 * and then shows background.
	 * @method displayData
	 * @param {Boolean} (optional) preview true if we are previewing the list
	 * @param {Boolean} (optional) avoidHighlight
	 */
	PageableListWithBackground.prototype.displayData = function (preview, avoidHighlight) {
		this._log("displayData", "Enter");
		PageableListWithBackground.superClass.displayData.call(this, preview, avoidHighlight);
		this._background.show();
		this._log("displayData", "Exit");
	};
	/**
	 * Focuses the list. Super class method is called and
	 * the background is updated with on focus css class
	 * @method focus
	 */
	PageableListWithBackground.prototype.focus = function () {
		this._log("focus", "Enter");
		PageableListWithBackground.superClass.focus.call(this);
		this._background.setCssClass(this.ON_FOCUS_BACKGROUNDCLASS);
		this._log("focus", "Exit");
	};

	/**
	 * Defocuses the list. Super class method is called and
	 * the background is updated with out of focus css class
	 * @method defocus
	 */
	PageableListWithBackground.prototype.defocus = function () {
		this._log("defocus", "Enter");
		PageableListWithBackground.superClass.defocus.call(this);
		this._background.setCssClass(this.OUT_OF_FOCUS_BACKGROUNDCLASS);
		this._log("defocus", "Exit");
	};

	/**
	 * sets the success callback function which
	 * will be fired on _selectItem call
	 * @method setSuccessCallback
	 * @param {function} callback
	 */
	PageableListWithBackground.prototype.setSuccessCallback = function (callback) {
		this._successCallback = callback;
	};

	/**
	 * @method _selectItem
	 * @param {Object} selectedItem
	 * @param {Boolean} isOKPressed
	 */
	PageableListWithBackground.prototype._selectItem = function (selectedItem, isOKPressed) {
		var successCallback = null,
			selectedRowIndex = this.getActualSelectedRowIndex(),
			selectedItemObject = this.getActualSelectedItem();
		PageableListWithBackground.superClass._selectItem.call(this, selectedItem, isOKPressed);
		if (selectedRowIndex <= this.getSize()) {
			successCallback = this.getSuccessCallbackByIndex(selectedRowIndex);
			if (successCallback) {
				successCallback(selectedItem, isOKPressed, selectedItemObject);
			}
		}
	};

	/**
	 * Fetches the configured successCallback for the item
	 * based on index
	 * If it is not available,
	 * returns the default value mentioned in XML
	 * @method getSuccessCallbackByIndex
	 * @param {number} index, index of the list item
	 */
	PageableListWithBackground.prototype.getSuccessCallbackByIndex = function (index) {
		var successCallback = this._data.getRowAtIndex(index).successCallback;
		if (successCallback) {
			return successCallback;
		} else {
			return this._successCallback;
		}
	};

	/**
	 * sets an object callbacks for handling
	 * colour keys
	 * @method setColorKeyCallbacks
	 * @param {Object} callbacks
	 */
	PageableListWithBackground.prototype.setColorKeyCallbacks = function (callbacks) {
		this._colorKeyCallbacks = callbacks;
	};

	/**
	 * fired the configured callback for
	 * the pressed colour key
	 * @method _handleColorKeyPress
	 * @param {Object} me
	 * @param {Object} key
	 * @param {Object} selectedItem
	 * @param {Boolean} isOKPressed
	 */
	function _handleColorKeyPress(me, key, selectedItem) {
		me._colorKeyCallbacks[key](selectedItem, me.getActualSelectedItem());
	}

	/**
	 * keyHandler method defines the logic to perform upon
	 * receiving a supplied key press.
	 * @method keyHandler
	 * @param {String} key
	 * @return {Boolean} True if the key press was handled.
	 */
	PageableListWithBackground.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false,
			selectedItem = this._data.getSelectedItem();

		handled = PageableListWithBackground.superClass.keyHandler.call(this, key);

		if (!handled) {
			switch (key) {
			case keys.KEY_BLUE:
			case keys.KEY_GREEN:
			case keys.KEY_RED:
			case keys.KEY_YELLOW:
			case keys.KEY_INFO:
				if (this._colorKeyCallbacks && this._colorKeyCallbacks[key]) {
					_handleColorKeyPress(this, key, selectedItem);
					handled = true;
				}
				break;
			}
		}
		this._log("keyHandler", "Exit");
		return handled;
	};
	$N.gui = $N.gui || {};
	$N.gui.PageableListWithBackground = PageableListWithBackground;
}($N || {}));
