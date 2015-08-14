/**
 * @author bzhao | vbuika
 * @class ConfirmationDialogWithControls
 * @constructor
 * @extends $N.gui.ConfirmationDialog
 * @param {Object} docRef (document relating the DOM)
 * @param {Object} parent (optional parent GUI object to attach to)
 * @param {Array} a collection of GUI controls
 * @namespace $N.gui
 */

(function ($N) {
	var ConfirmationDialogWithControls = function (docRef, parent, controls) {
		this.state = null;
		this._controls = controls;
		this._docRef = docRef;
		this._totalControlItems = 0;
		this._activeControlItemIndex = 0;
		this._activeControlElement = null;
		this._folderNameListObject = null;
		this.dataMapper = {
			getTitle: function (itemData) {
				return itemData.name;
			},
			getAction: function (itemData) {
				return itemData.action;
			}
		};

		ConfirmationDialogWithControls.superConstructor.call(this, docRef);
		this._controlsGroup = new $N.gui.Group(docRef, this._container);
		this._controlsGroup.setWidth(1920);
		if (parent) {
			parent.addChild(this);
		}
	};

	$N.gui.Util.extend(ConfirmationDialogWithControls, $N.gui.ConfirmationDialog);


	/**
	 * @method getFixedHorizontalList
	 * @param {Object} controlItem
	 */
	ConfirmationDialogWithControls.prototype.getFixedHorizontalList = function (controlItem) {
		var fixedlist = this.setupFixedList(),
			me = this,
			i = 0,
			BUTTON_TITLE_PADDING = 36,
			AVG_LETTER_WIDTH = 24,
			MAX_STRING_LENGTH = 5,
			BUTTON_WIDTH = 60,
			horizontalButtonWidth = MAX_STRING_LENGTH * AVG_LETTER_WIDTH + BUTTON_TITLE_PADDING * 2 * 1.75,
			dataMapper = {
				getTitle: function (obj) {
					return obj.name;
				},
				isVertical: function () {
					return false;
				},
				getItemHeight: function () {
					return BUTTON_WIDTH;
				},
				getHorizontalItemWidth: function (obj) {
					if (obj) {
						return obj.width ||  horizontalButtonWidth;
					}
					return horizontalButtonWidth;
				}
			};

		fixedlist.setDataMapper(dataMapper);
		fixedlist.getItemConfig().movementPositions = controlItem.buttonMovementPositions || this.HORIZONTAL_MOVEMENT_POSITIONS;
		fixedlist.setOrientation($N.gui.FixedList.consts.ORIENTAION_HORIZONTAL);
		fixedlist.initialise(false);
		if (controlItem.buttons) {
			fixedlist.setData(controlItem.buttons);
		}
		fixedlist.displayData();
		fixedlist.setItemSelectedCallback(controlItem.callback);
		return fixedlist;
	};

	/**
	 * @method setCssForPopup
	 * @param {Object} controlItem
	 * @param {Object} listObject
	 */
	ConfirmationDialogWithControls.prototype.setCssForPopup = function (controlItem, listObject) {
		if (controlItem.textCssClass) {
			listObject.setTextCssClass(controlItem.textCssClass);
		}
		if (controlItem.cssClass) {
			listObject.setCssClass(controlItem.cssClass);
		}
		if (controlItem.highlightCssClass) {
			listObject.setHighlightCssClass(controlItem.highlightCssClass);
		}
	};

	/**
	 * Build optional controls list, index them and provide positioning parameters
	 * @method initialiseControls
	 */
	ConfirmationDialogWithControls.prototype.initialiseControls = function () {
		var CONTROL_GAP = 30,
			listObject,
			controlItem,
			containerHeight = 0,
			listItemHeight = 0,
			totalControls = 0,
			control,
			height;
		for (control in this._controls) {
			if (this._controls.hasOwnProperty(control)) {
				controlItem = this._controls[control];
				totalControls++;
				if (controlItem.listObjectName === "FixedList") {
					listObject = this.getFixedHorizontalList(controlItem);
				} else if (controlItem.listObjectName) {
					listObject = new $N.gui[controlItem.listObjectName](document, null, controlItem.title, null, controlItem.selectListWidth);
					if (typeof listObject.getHeight !== 'function') {
						throw new Error("Given list object require getHeight(), needed for positioning.");
					}
					if (typeof listObject.getSelectedItem !== 'function') {
						throw new Error("Given list object require getSelectedItem(), needed for general dialog callback selected key list.");
					}
				}
				listObject.selectable = (controlItem.selectable && controlItem.selectable === false) ? false : true;
				listObject.index = null;
				if (listObject.selectable === true) {
					listObject.index = this._totalControlItems;
					this._totalControlItems++;
				}

				this.setCssForPopup(controlItem, listObject);

				if (controlItem.highlightedCallback) {
					listObject.setItemHighlightedCallback(controlItem.highlightedCallback);
				}
				listObject.setData(controlItem.buttons, this.dataMapper);
				this._controls[control].listObject = listObject;
				this._controlsGroup.addChild(listObject);
				listObject.configure({
					x: this.INDENTATION,
					y: containerHeight
				});
				if (control === 'folderName') {
					this._folderNameListObject = listObject;
				}
				height = (listObject.getHeight) ? listObject.getHeight() : 50;
				containerHeight += height  + CONTROL_GAP;
			}
		}
		this._activeControlItemIndex = this._totalControlItems;
		this._controlsGroup.setHeight(containerHeight);
	};

	/**
	 * @method setControls
	 * @param {Object} controls
	 */
	ConfirmationDialogWithControls.prototype.setControls = function (controls) {
/*		TODO: Finish this setter method to enable updating of controls
		var control = null,
			controlItem = null;
		this._controls = controls;
		for (control in this._controls) {
			controlItem = this._controls[control];
			if (this._controls.hasOwnProperty(control)) {
				controlItem = this._controls[control];
				if (controlItem.listObjectName) {
				}
			}
		}*/
	};

	/**
	 * @method populateOptionalControlWithObjects
	 * @param {Object} optionalControl
	 * @param {Object} currentControl
	 * @return {Object} optionalControl
	 *
	 */
	ConfirmationDialogWithControls.prototype.populateOptionalControlWithObjects = function (optionalControl, currentControl) {
		var buttonToUpdate = this._controls[currentControl.title],
			buttonsLength = 0,
			singleControl,
			i;
		if (buttonToUpdate && buttonToUpdate.buttons.length) {
			buttonsLength = buttonToUpdate.buttons.length;
			for (i = 0; i < buttonsLength; i++) {
				singleControl = buttonToUpdate.buttons[i];
				if (singleControl.selectable) {
					optionalControl[singleControl.ctrlname] = {control: {value: singleControl.name}};
				}
			}
		}
		return optionalControl;
	};

/**
	 * callback with merged selected optional control attributes
	 * Dialog by default has root buttons and optional control buttons.
	 * This callback extends original callback by providing selected options
	 * This example represents optional control settings for ConfirmationDialogue
	 * <example>
	 *
	 * optionalControl = {
	 *			keepUntil: {
	 *				title: "$N.app.PVRUtil.getString("keepUtil")",
	 *				listObjectName: 'HorizontalSelectorControl',
	 *				buttons: [{
	 *					name: $N.app.PVRUtil.getString("manuallyDeleted"),
	 *					action: KEEP_UNTIL
	 *				}, {
	 *					name: $N.app.PVRUtil.getString("spaceNeeded"),
	 *					action: SPACE_NEEDED
	 *				}]
	 *			}
	 *		}
	 * </example>
	 */

	/**
	 * @method setSelectedCallback
	 * @param {Function} callback
	 */
	ConfirmationDialogWithControls.prototype.setSelectedCallback = function (callback) {
		var me = this,
			controlDialogCallback = function (keys) {
				var control,
					currentControl;
				keys = (Object.prototype.toString.call(keys) === '[object Object]') ? keys : {};
				keys.optionalControl = {};
				for (control in me._controls) {
					if (me._controls.hasOwnProperty(control)) {
						currentControl = me._controls[control];
						if (currentControl.listObjectName === "FixedList") {
							keys.optionalControl = me.populateOptionalControlWithObjects(keys.optionalControl, currentControl);
						} else {
							keys.optionalControl[control] = {control:  currentControl.listObject.getSelectedItem()};
						}
					}
				}
				callback(keys);
			};
		ConfirmationDialogWithControls.superClass.setSelectedCallback.call(this, controlDialogCallback);
	};

	/**
	 * Extended function to insert a collection of optional controls in between title and message
	 * @method layoutDialogue
	 * @param (optional) {Boolean} redraw true if this is a redraw of the dialog
	 */
	ConfirmationDialogWithControls.prototype.layoutDialogue = function (redraw) {
		if (!redraw) {
			this.initialiseControls();
		}
		ConfirmationDialogWithControls.superClass.layoutDialogue.call(this, this._controlsGroup);
	};

	/**
	 * @method _isControlItemSelectable
	 * @param {Number} controlItemIndex
	 * @private
	 */
	ConfirmationDialogWithControls.prototype._isControlItemSelectable = function (controlItemIndex) {
		var control;
		for (control in this._controls) {
			if (this._controls.hasOwnProperty(control)) {
				if (this._controls[control].listObject.index === controlItemIndex) {
					if (this._controls[control].selectable === false) {
						return false;
					}
				}
			}
		}
		return true;
	};

	/**
	 * move between optional control lists and focus on selected one
	 * @method _activateControlItem
	 * @private
	 */
	ConfirmationDialogWithControls.prototype._activateControlItem = function () {
		var control;
		for (control in this._controls) {
			if (this._controls.hasOwnProperty(control)) {
				if (this._controls[control].listObject.index === this._activeControlItemIndex) {
					if (this._activeControlElement) {
						this._activeControlElement.defocus();
					}
					this._controls[control].listObject.focus();
					this._activeControlElement = this._controls[control].listObject;
					this._menu.defocus();
				}
			}
		}
	};

	/**
	 * move to next available optional control object or switch to root dialog control
	 * @method moveNext
	 */
	ConfirmationDialogWithControls.prototype.moveNext = function () {
		var nextControlItemIndex = this._activeControlItemIndex + 1;
		if ((this._activeControlItemIndex < this._totalControlItems - 1) && this._isControlItemSelectable(nextControlItemIndex)) {
			this._activeControlItemIndex++;
			this._activateControlItem();
		} else {
			this._menu.focus();
			this._activeControlItemIndex = this._totalControlItems;
			if (this._activeControlElement) {
				this._activeControlElement.defocus();
			}
			this._activeControlElement = null;
		}
	};

	/**
	 * move to previous available optional control object
	 * From user point of view, last optional control is 1st item after defocus from main dialog control
	 * @method movePrevious
	 */
	ConfirmationDialogWithControls.prototype.movePrevious = function () {
		var previousControlItemIndex = this._activeControlItemIndex - 1;
		if (this._activeControlItemIndex > 0 && this._isControlItemSelectable(previousControlItemIndex)) {
			this._activeControlItemIndex--;
			this._activateControlItem();
		}
	};

	/**
	 * return optional control controller by name
	 * @method getOptionalControlComponent
	 * @param {String} optionName
	 * @return {Object} list object controller
	 */
	ConfirmationDialogWithControls.prototype.getOptionalControlComponent = function (optionName) {
		var listObject = null;
		if (this._controls.hasOwnProperty(optionName)) {
			listObject = this._controls[optionName].listObject;
		}
		return listObject;
	};

	/**
	 * @method setFolderName
	 * @param {Object} optionalControl
	 */
	ConfirmationDialogWithControls.prototype.setFolderName = function (optionalControl) {
		this._folderNameListObject.setData(optionalControl.buttons, this.dataMapper);
		// updates the CSS Classes for the FolderName box
		this.setCssForPopup(optionalControl, this._folderNameListObject);
		this.layoutDialogue(true);
	};

	/**
	 * Overrides the superclass keyHandler to pass the keys on to
	 * the form holding the buttons. The class creating the dialog
	 * should pass the keys on to this function
	 * @method keyHandler
	 * @param {String} key
	 * @return {Boolean} True if key was handled, false otherwise.
	 */
	ConfirmationDialogWithControls.prototype.keyHandler = function (key) {
		var handled = false,
			keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			isItemHighlightedCallback = this._activeControlElement && this._activeControlElement._itemHighlightedCallback,
			isShowKeypad = ((isItemHighlightedCallback) && this._activeControlElement._itemHighlightedCallback.toString().indexOf("showKeypad") > -1);
		if (this._keypad && this._keypad.isVisible()) {
			handled = this._keypad.keyHandler(key);
		} else {
			if (key === keys.KEY_OK && isShowKeypad) {
				this._activeControlElement._itemHighlightedCallback();
				handled = true;
			} else if (this._activeControlElement && this._activeControlElement.keyHandler(key)) {
				handled = true;
			} else {
				handled = ConfirmationDialogWithControls.superClass.keyHandler.call(this, key);
			}
			if (!handled) {
				switch (key) {
				case keys.KEY_UP:
					this.movePrevious();
					handled = true;
					break;
				case keys.KEY_DOWN:
					this.moveNext();
					handled = true;
					break;
				}
			}
		}
		return handled;
	};

	/**
	 * @method showKeypad
	 * @param {String} keypadTitle
	 * @return {String} The name of the control to update.
	 */
	ConfirmationDialogWithControls.prototype.showKeypad = function (keypadTitle, buttonToUpdate, index) {
		index = index || 0;
		this._keypad = new $N.gui.BaseKeypad(this._docRef, this._backgroundContainer);
		var me = this,
			showPopup = function () {
				me._keypad.reset();
				me._keypad = null;
				me._title.show();
				me._menu.show();
				me._controlsGroup.show();
				me._messageText.show();
			},
			returnObject = {value: this._keypad.getInputValue()},
			saveCallback = function (newValue) {
				if (me._controls[buttonToUpdate]) {
					if (me._controls[buttonToUpdate].buttons.length) {
						me._controls[buttonToUpdate].buttons[index].name = newValue.value;
					}
				}
				me.initialiseControls();
				showPopup();
			};

		this._keypad.reset();
		this._keypad.configure({
			keypadTitle: "title",
			x: 680,
			y: 270
		});

		this._keypad.resetKeyPadConfig();
		$N.app.KeyboardUtils.setKeypad(this._keypad, $N.app.KeyboardType.NUMERIC);
		this._keypad.configure({
			keypadTitle: keypadTitle,
			visible: true,
			exitCallback: showPopup,
			textInputAlignment: $N.app.KeyboardType.ALIGNMENT.CENTRE
		});

		$N.app.KeyboardUtils.setKeypadReturnObject(returnObject);
		$N.app.KeyboardUtils.setSaveCallback(saveCallback);
		this._keypad.clearInput();
		this._keypad.setInputFormat(2, 0, "");
		this._keypad.setMinNumericKeypadValue(0);
		this._keypad.setMaxNumericKeypadValue(99);
		$N.app.KeyboardUtils.showKeypad($N.app.KeyboardType.NUMERIC);
		// hide the popup controls
		this._messageText.hide();
		this._title.hide();
		this._menu.hide();
		this._controlsGroup.hide();
		this._keypad.focus();
		this._keypad.show();
	};

	$N.gui = $N.gui || {};
	$N.gui.ConfirmationDialogWithControls = ConfirmationDialogWithControls;
}($N || {}));
