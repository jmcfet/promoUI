/**
 * ManualRecordingOptionsSubMenuConfirmation is an extension of ManualRecordingOptionsSubMenuConfirmation containing additional
 * functionality to support menu item selection and success callback
 *
 * @class $N.gui.ManualRecordingOptionsSubMenuConfirmation
 * @constructor
 * @extends $N.gui.LibraryOptionsSubMenu
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	function ManualRecordingOptionsSubMenuConfirmation(docRef, parent) {
		ManualRecordingOptionsSubMenuConfirmation.superConstructor.call(this, docRef, parent);
		this._log = new $N.apps.core.Log("CommonGUI", "ManualRecordingOptionsSubMenuConfirmation");
		this.directChannelEntry = new $N.app.DirectChannelEntry($N.app.constants.MAX_CHANNEL_DIGITS, $N.app.constants.CHANNEL_ENTRY_TIMEOUT_MS);
		this._label = new $N.gui.Label(docRef, this._container);
		this._label.configure({
			x: 57,
			y: 30,
			width: 546,
			cssClass: "libraryOptionsSubMenuTitle",
			visible: false
		});
		this._parentItem = null;
		this._menuItem = null;
		this._successCallback = function () {};
	}
	$N.gui.Util.extend(ManualRecordingOptionsSubMenuConfirmation, $N.gui.LibraryOptionsSubMenu);

	/**
	 * @method _itemSelected
	 * @param {Object} data
	 */
	ManualRecordingOptionsSubMenuConfirmation.prototype._itemSelected = function (data) {
		var listData = this._menu.getData(),
			i;
		this._log("_itemSelected", "Enter");
		if (data.value) {
			for (i = 0; i < listData.length; i++) {
				listData[i].selected = false;
			}
			data.selected = true;
			this._menu.displayData();
			if (data.channelNumber) {
				this._selectedItem = data.channelNumber;
				this._parentItem.setFirstSubTitle(data.channelNumber + " " + data.title);
				this._menuItem.subtitle = data.channelNumber + " " + data.title;
			} else {
				this._parentItem.setFirstSubTitle(data.title);
				this._menuItem.subtitle = data.title;
			}
			this._successCallback(data);
		}
		this._exitCallback();
		this._log("_itemSelected", "Exit");
	};

	/**
	 * @method _setData
	 * @param {Object} data
	 */
	ManualRecordingOptionsSubMenuConfirmation.prototype._setData = function (data) {
		this._log("_setData", "Enter");
		ManualRecordingOptionsSubMenuConfirmation.superClass._setData.call(this, data);
		this._successCallback = data.successCallback;
		this._log("_setData", "Exit");
	};

	/**
	 * Gives current Channel Information.
	 * @method currentChannelInfo
	 * @param {Object} menuItem
	 */
	ManualRecordingOptionsSubMenuConfirmation.prototype.currentChannelInfo = function (menuItem) {
		var currentChannel = menuItem.subtitle.split(" "),
			currentChannelLCN;
		if (typeof (this._selectedItem) === "string") {
			this._selectedItem = Number(this._selectedItem);
		}
		currentChannelLCN = Number(currentChannel[0]) || this._selectedItem;
		return $N.platform.btv.EPG.getChannelByLCN(currentChannelLCN);
	};

	/**
	 * Draws the channel list based on the selected/tuned service.
	 * @method selectTunedChannel
	 * @param {Object} menuItem
	 */
	ManualRecordingOptionsSubMenuConfirmation.prototype.selectTunedChannel = function (menuItem) {
		var menuItemChannelInfo = this.currentChannelInfo(menuItem),
			currentChannelServiceId = (!menuItem) ? $N.app.epgUtil.getChannelFromPrefs() : menuItemChannelInfo.serviceId,
			FIRST_ITEM_INDEX = 1,
			indexOfService = null;
		if (currentChannelServiceId) {
			indexOfService = this._menu.getIndexByUniqueData("serviceId", currentChannelServiceId.toString());
			if (indexOfService) {
				this._menu.selectItemAtIndex(indexOfService + 1, true);
			} else {
				this._menu.selectItemAtIndex(FIRST_ITEM_INDEX, true);
			}
		}
	};

	/**
	 * rollback the channel number at selected item
	 * @method rollbackDirectChannelEntry
	 */
	function rollbackDirectChannelEntry(thisObj) {
		var me = thisObj,
			item = me._menu.getActualSelectedItem();
		if (item) {
			item.setServiceNumber(item.getOriginalChannelNumber());
			item.updateForChannelEntryOver();
		}
		me.directChannelEntry.cancelEntry();
	}

	/**
	 * callback called from directChannel entry class, it moves the highlight to channel number/nearest channel number passed as callback data.
	 * @method directChannelEntryCallback
	 * @param {number} logicalChannelNumber
	 */
	ManualRecordingOptionsSubMenuConfirmation.prototype.setDirectChannelEnteredCallback = function () {
		var me = this,
			directChannelEntryCallback = function (logicalChannelNumber) {
				var closestChannelNumber = null,
					FIRST_ITEM_INDEX = 1,
					indexOfService = null;
				if (me._menuItem.isUpDownPageable && logicalChannelNumber) {
					me._menu.getActualSelectedItem().updateForChannelEntryOver();
					closestChannelNumber = $N.app.epgUtil.getNextClosestService(logicalChannelNumber, $N.app.ChannelManager.getAllChannelsOrderedByChannelNumber()).logicalChannelNum;
					closestChannelNumber = $N.app.FormatUtils.formatChannelNumber(closestChannelNumber);
					if (closestChannelNumber) {
						indexOfService = me._menu.getIndexByUniqueData("channelNumber", closestChannelNumber);
						if (indexOfService) {
							me._menu.selectItemAtIndex(indexOfService + 1, true);
						} else {
							me._menu.selectItemAtIndex(FIRST_ITEM_INDEX, true);
						}
					}
				} else if (me._menuItem.isUpDownPageable && !logicalChannelNumber) {
					rollbackDirectChannelEntry(me);
				}
				me._label.setText("");
			};
		this.directChannelEntry.setChannelEnteredCallback(directChannelEntryCallback);
	};
	/**
	 * @method activate
	 * @param {Object} parentItem
	 * @param {Object} optionsController
	 */
	ManualRecordingOptionsSubMenuConfirmation.prototype.activate = function (parentItem, optionsController) {
		var FIRST_ITEM_INDEX = 1;
		this._parentItem = parentItem;
		this._menuItem = optionsController.getSelectedItem();
		if (this._menuItem.isUpDownPageable) {
			this._menu.setUpDownPageable(true);
			this.setDirectChannelEnteredCallback();
		}
		ManualRecordingOptionsSubMenuConfirmation.superClass.activate.call(this);
		if (this._menuItem.title === $N.gui.ManualRecordingOptions.getString("manualRecordingChannel")) {
			this.selectTunedChannel(this._menuItem);
		} else {
			this._menu.selectItemAtIndex(FIRST_ITEM_INDEX, true);
		}
	};

	function directChannelEntryKeyHandler(thisObject, key, keys) {
		var handled = false,
			me = thisObject,
			directChannelEntry = me.directChannelEntry,
			menu = me._menu;
		switch (key) {
		case keys.KEY_ZERO:
		case keys.KEY_ONE:
		case keys.KEY_TWO:
		case keys.KEY_THREE:
		case keys.KEY_FOUR:
		case keys.KEY_FIVE:
		case keys.KEY_SIX:
		case keys.KEY_SEVEN:
		case keys.KEY_EIGHT:
		case keys.KEY_NINE:
			if (!directChannelEntry.isActive()) {
				menu.getActualSelectedItem().updateForChannelEntry();
			}
			directChannelEntry.updateChannelDigits(key, menu.getActualSelectedItem()._channelNumber, menu.getActualSelectedItem()._cursor);
			handled = true;
			break;
		case keys.KEY_LEFT:
			if (directChannelEntry.isActive()) {
				directChannelEntry.updateChannelDigits(key, menu.getActualSelectedItem()._channelNumber, menu.getActualSelectedItem()._cursor);
				handled = true;
			}
			break;
		case keys.KEY_BACK:
			if (directChannelEntry.isActive()) {
				rollbackDirectChannelEntry(me);
				handled = true;
			}
			break;
		case keys.KEY_OK:
			if (directChannelEntry.okKeyHandler()) {
				handled = true;
			}
			break;
		default:
			if ($N.app.GeneralUtil.isKeyReleaseEvent(key)) {
				return false;
			}
			if (directChannelEntry.isActive()) {
				rollbackDirectChannelEntry(me);
			}
		}
		return handled;
	}

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	ManualRecordingOptionsSubMenuConfirmation.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter & Exit");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;
		if (key === keys.KEY_RIGHT) {
			return false;
		}
		if (key === keys.KEY_GREEN) {
			//disable green key when ManualRecordingOptionsSubMenuConfirmation is active.
			handled = true;
		}
		if (this._menuItem.isUpDownPageable) {
			if (this.directChannelEntry && this._menu.getSize() > 0) {
				if (directChannelEntryKeyHandler(this, key, keys)) {
					return true;
				}
			}
		}
		if (!handled) {
			handled = ManualRecordingOptionsSubMenuConfirmation.superClass.keyHandler.call(this, key);
		}
		return handled;
	};

	$N.gui.ManualRecordingOptionsSubMenuConfirmation = ManualRecordingOptionsSubMenuConfirmation;
}(window.parent.$N || {}));
