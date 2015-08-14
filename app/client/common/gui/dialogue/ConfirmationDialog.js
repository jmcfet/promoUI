/**
 * @author Jayne Gilmour
 * @class ConfirmationDialog
 */

/*global GlobalKeysInterceptor*/


(function ($N) {

	function ConfirmationDialog(docRef, parent) {

		var DEFAULT_INDENTATION = 345,
			SCREEN_WIDTH = 1920,
			SCREEN_HEIGHT = 1080,
			HORIZONTAL_BUTTON_WIDTH = 210,
			VERTICAL_BUTTON_WIDTH = 1237,
			BUTTON_HEIGHT = 60,
			i;

		ConfirmationDialog.superConstructor.call(this, docRef);

		this.INDENTATION = docRef.indentation || DEFAULT_INDENTATION;
		this._docRef = docRef;
		this.ORIENTATION = "HORIZONTAL";
		this.BUTTON_HORIZONTAL_SPACING = 30;
		this.BUTTON_VERTICAL_SPACING = 30;
		this.VERTICAL_CHAR_COUNT = 40;
		this.DIALOGUE_BACKPLATE_Y = 236;
		this.DIALOGUE_BACKPLATE_H = 608;
		this.verticalButtonMode = false;
		this.numberOfButtons = 0;
		this.HORIZONTAL_BUTTON_WIDTH  = 210;
		this.HORIZONTAL_MOVEMENT_POSITIONS = [];
		this.VERTICAL_MOVEMENT_POSITIONS = [];
		this.OPACITY_VALUES = [];
		this.TITLE_IMAGE_SPACING = 20;
		this.ERROR_HORIZONTAL_POS = 1800;

		this._useRealMessageHeight = true;

		for (i = 0; i < 5; i++) {
			this.HORIZONTAL_MOVEMENT_POSITIONS.push({x: (HORIZONTAL_BUTTON_WIDTH + this.BUTTON_HORIZONTAL_SPACING) * i, y: 0});
			this.VERTICAL_MOVEMENT_POSITIONS.push({x: 0, y: (BUTTON_HEIGHT + this.BUTTON_VERTICAL_SPACING) * i});
			this.OPACITY_VALUES.push(1);
		}

		this._dialogueBackground = new $N.gui.BackgroundBox(docRef, this._backgroundContainer);
		this._dialogueBackground.configure({
			x: 0,
			y: 0,
			width: SCREEN_WIDTH,
			height: SCREEN_HEIGHT,
			cssClass: "dialogueBackground"
		});

		this._dialogueBackplate = new $N.gui.Container(docRef, this._backgroundContainer);
		this._dialogueBackplate.configure({
			x: 0,
			y: this.DIALOGUE_BACKPLATE_Y,
			width: SCREEN_WIDTH,
			height: this.DIALOGUE_BACKPLATE_H,
			cssClass: "dialogueBackplate glowEffect"
		});

		this._titleImage = new $N.gui.Image(docRef, this._backgroundContainer);
		this._titleImage.configure({
			x: this.INDENTATION,
			y: 0,
			width: 60,
			height: 60,
			visible: false
		});

		this._alertImageBackGround = new $N.gui.Container(docRef, this._backgroundContainer);
		this._alertImageBackGround.configure({
			x: 0,
			y: 386,
			width: 267,
			height: 266,
			cssClass: "displayQrCodeBackground",
			visible: false
		});

		this._alertImage = new $N.gui.Image(docRef, this._backgroundContainer);
		this._alertImage.configure({
			x: 114,
			y: 476,
			width: 177,
			height: 177,
			href: "customise/resources/images/%RES/icons/Icn_AlertLarge.png",
			opacity: 0.2,
			visible: false
		});

		this._backplateUpperGlow = new $N.gui.BackgroundBox(docRef, this._backgroundContainer);
		this._backplateUpperGlow.configure({
			x: 0,
			y: 186,
			width: SCREEN_WIDTH,
			height: 50,
			cssClass: "dialogueGlowUpper"
		});

		this._backplateLowerGlow = new $N.gui.BackgroundBox(docRef, this._backgroundContainer);
		this._backplateLowerGlow.configure({
			x: 0,
			y: 842,
			width: SCREEN_WIDTH,
			height: 50,
			cssClass: "dialogueGlowLower"
		});

		// gui elements
		this._title.configure({
			x: this.INDENTATION,
			y: 0,
			cssClass: "dialogTitle"
		});

		this._keypad = null;

		// _message is created by JSFW and trying to re-use it is problematic
		this._message.configure({
			visible: false
		});

		this._messageText = new $N.gui.TextArea(docRef, this._container);
		this._messageText.configure({
			x: this.INDENTATION,
			y: 50,
			width: SCREEN_WIDTH - (this.INDENTATION * 2),
			maxHeight: 348,
			cssClass: "dialogMessage"
		});

		// bring to front because _title and _message are created by JSFW
		this._title.bringToFront();

		this._errorCode = new $N.gui.Label(docRef, this._container);
		this._errorCode.configure({
			x: 1920 - this.INDENTATION,
			cssClass: "errorCode",
			visible: false
		});

		this._alertImageText = new $N.gui.Label(docRef, this._container);
		this._alertImageText.configure({
			"x" : 645,
			"y" : 67.5 + this.DIALOGUE_BACKPLATE_Y,
			"width" : 1000,
			visible: false,
			cssClass: "messageListItemTitle"
		});

		this._alertImageSubText = new $N.gui.TextArea(docRef, this._container);
		this._alertImageSubText.configure({
			"x" : 645,
			"y" : 79.5 + this.DIALOGUE_BACKPLATE_Y,
			"width" : 1000,
			visible: false,
			cssClass: "fullViewLeftSubtitle fontSize22"
		});

		this._dataMapper = {
			getTitle: function (obj) {
				return obj.name;
			},
			isVertical: function () {
				return false;
			},
			getHorizontalItemWidth: function () {
				return HORIZONTAL_BUTTON_WIDTH;
			},
			getVerticalItemWidth: function () {
				return VERTICAL_BUTTON_WIDTH;
			},
			getItemHeight: function () {
				return BUTTON_HEIGHT;
			}
		};

		this._menu = this.setupFixedList();


		this._highlightedItemLabel = new $N.gui.Label(docRef, this._container);

		// configure gui elements
		this._MENU_CONF = {
			itemTemplate: $N.gui.SubMenuItem
		};

		// add gui elements to the dialog container
		this._container.addChild(this._menu);
		this._container.addChild(this._highlightedItemLabel);

		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(ConfirmationDialog, $N.gui.AbstractConfirmationDialog);

	var proto = ConfirmationDialog.prototype;


	proto.setupFixedList = function () {
		var list = new $N.gui.FixedList(this._docRef, this._container);
		list.configure({
			x: this.INDENTATION,
			y: 650,
			width: 462
		});
		list.setWrapAround(false);
		list.getItemConfig().opacityValues = this.OPACITY_VALUES;
		list.setItemTemplate("ButtonGroupItem");
		return list;
	};

	/**
	 * Move title, message and buttons to be vertically centred and spaced accroding to GAD design
	 * @method layoutDialogue
	 * @param {Object} controlsGroup
	 */
	proto.layoutDialogue = function (controlsGroup) {
		var TITLE_HEIGHT = 47,
			BUTTON_HEIGHT = 60,
			configBackplate = $N.app.DialogueHelper.configureBackPlateUsingContent(this._title, controlsGroup, this._messageText, TITLE_HEIGHT, this.numberOfButtons, BUTTON_HEIGHT, this.BUTTON_VERTICAL_SPACING, this.verticalButtonMode, this._useRealMessageHeight),
			dialogueBackplateY = configBackplate.backplateY,
			dialogueBackplateH = configBackplate.backplateH,
			backplateUpperGlow = configBackplate.backplateUpperGlow,
			backplateLowerGlow = configBackplate.backplateLowerGlow,
			overallHeightOfContent = configBackplate.overallHeightOfContent,
			heightOfButtons = configBackplate.heightOfButtons,
			configInfoMessage = configBackplate.messageTextConfig;

		this._dialogueBackplate.configure({
			y: dialogueBackplateY,
			height: dialogueBackplateH
		});
		this._backplateUpperGlow.configure({
			y: backplateUpperGlow
		});
		this._backplateLowerGlow.configure({
			y: backplateLowerGlow
		});

		if (configInfoMessage) {
			this._messageText.configure(configInfoMessage);
		}

		$N.app.DialogueHelper.layoutConfirmationDialog(this._title, controlsGroup, this._messageText, this._menu, dialogueBackplateY, dialogueBackplateH, TITLE_HEIGHT, heightOfButtons, overallHeightOfContent);

		this._errorCode.setY(this._menu.getTrueY() + 25.5);
	};


	/**
	 * Selects the default item in the confirmation dialog
	 * @method selectDefaultItem
	 */
	proto.selectDefaultItem = function () {
		this._menu.selectItemAtIndex(1, true);
	};

	/**
	 * @method useRealMessageHeight
	 * @param {Boolean} mode
	 */
	proto.setMessageMeasurementMode = function (mode) {
		this._useRealMessageHeight = mode;
	};

	proto.setMode = function (mode) {
		this._highlightedItemLabel.configure(this._highlightedItemLabelConf);
		this._menu.configure(this._MENU_CONF);
		this._menu.initialise();
	};

	/**
	 * @method setOrientation
	 */
	proto.setOrientation = function (orientation) {
		this.ORIENTATION = orientation;
	};
	/**
	 * @method setVerticalOrientation
	 */
	proto.setVerticalOrientation = function () {
		this.verticalButtonMode = true;
		this._dataMapper.isVertical = function () {
			return true;
		};
		this._menu.setDataMapper(this._dataMapper);
		this._menu.getItemConfig().movementPositions = this.VERTICAL_MOVEMENT_POSITIONS;
		this._menu.setOrientation($N.gui.FixedList.consts.ORIENTAION_VERTICAL);
		this._menu.initialise(false);
	};

	/**
	 * @method setHorizontalOrientation
	 */
	proto.setHorizontalOrientation = function (maxStrLength, list) {
		var me = this,
			i = 0,
			buttonTitlePadding = 36,
			AVG_LETTER_WIDTH = 24;

		me.horizontalButtonWidth = maxStrLength * AVG_LETTER_WIDTH + buttonTitlePadding * 2 * 1.75;

		this.verticalButtonMode = false;
		this._dataMapper.isVertical = function () {
			return false;
		};

		if (this.HORIZONTAL_BUTTON_WIDTH < me.horizontalButtonWidth) {

			this.HORIZONTAL_MOVEMENT_POSITIONS = [];
			this._dataMapper.getHorizontalItemWidth = function () {
				return me.horizontalButtonWidth;
			};
			for (i = 0; i < 5; i++) {
				this.HORIZONTAL_MOVEMENT_POSITIONS.push({x: (me.horizontalButtonWidth + me.BUTTON_HORIZONTAL_SPACING) * i, y: 0});
			}
		}
		list.setDataMapper(this._dataMapper);
		list.getItemConfig().movementPositions = this.HORIZONTAL_MOVEMENT_POSITIONS;
		list.setOrientation($N.gui.FixedList.consts.ORIENTAION_HORIZONTAL);
		list.initialise(false);
		return list;
	};

	/**
	 * @method _determinateOrientationMode
	 */
	proto._determinateOrientationMode = function (data) {
		var maxStrLength = 0,
			dataLength = data.length,
			i;
		for (i = 0; i < dataLength; i++) {
			maxStrLength = (data[i].name.length > maxStrLength) ? data[i].name.length : maxStrLength;
		}
		if ((maxStrLength > this.VERTICAL_CHAR_COUNT) || (dataLength > 5) || this.ORIENTATION === "VERTICAL") {
			this.setVerticalOrientation();
		} else {
			this._menu = this.setHorizontalOrientation(maxStrLength, this._menu);
		}
	};

	/**
	 * Selects the default item in the confirmation dialog
	 * @method selectDefaultItem
	 */
	proto.invokeCallback = function (key) {
		if (this._exitCallback) {
			this._exitCallback(this._menu._data.getData(), key);
		} else {
			this._callback(null, key);
		}
	};

	/**
	 * Overrides the superclass keyHandler to pass the keys on to
	 * the form holding the buttons. The class creating the dialog
	 * should pass the keys on to this function
	 * @method keyHandler
	 * @param {String} key
	 * @return {Boolean} True if key was handled, false otherwise.
	 */
	proto.keyHandler = function (key) {
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;


		if (this._keypad && this._keypad.isVisible()) {
			handled = this._keypad.keyHandler(key);
		} else {
			switch (key) {
			// dialogue navigation keys, the only ones the dialogue is really interested in
			case keys.KEY_UP:
			case keys.KEY_DOWN:
			case keys.KEY_RIGHT:
			case keys.KEY_OK:
				handled = this._menu.keyHandler(key);
				if (handled) {
					return true;
				}
				break;
			case keys.KEY_LEFT:     // LEFT key is special, handling both moving between dialogue controls and exiting the dialogue
				// you can't navigate left/right in vertical mode, nor when you're already in the left-most position
				if (this.verticalButtonMode || (this._menu.getCurrentIndex() === 1)) {
					this.invokeCallback(key);
					return true;
				}

				handled = this._menu.keyHandler(key);
				if (handled) {
					return true;
				}
				break;

			// keys that close the dialogue
			case keys.KEY_BACK:
			case keys.KEY_EXIT:
				this.invokeCallback(key);
				return true;

			// keys we want to handle but NOT dimiss the dialogue
			case keys.KEY_VOL_UP:
			case keys.KEY_VOL_DOWN:
			case keys.KEY_MUTE:
				GlobalKeysInterceptor.keyHandler(key);
				return true;

			case keys.KEY_CHAN_UP:
			case keys.KEY_CHAN_DOWN:
				// call zapper?
				this.invokeCallback(key);
				GlobalKeysInterceptor.defaultContextKeyHandler(key);
				return true;


			// keys we want to handle after dismissing the dialogue
			case keys.KEY_HOME:  // portal
			case keys.KEY_POWER:
			case keys.KEY_MOSAIC:
			case keys.KEY_INFO:
			case keys.KEY_GUIDE:
			case keys.KEY_AGORA:
			case keys.KEY_FAVOURITES:
			case keys.KEY_MENU:  // portal
			case keys.KEY_VOD:
			case keys.KEY_VIEW:  // now/vod
			case keys.KEY_PPV:
				GlobalKeysInterceptor.keyHandler(key);
				this.invokeCallback(key);
				return true;

			default:
				return false;
			}
		}
	};

	proto.setSelectedCallback = function (callback) {
		this._menu.setItemSelectedCallback(callback);
		this._callback = callback;
		this._exitCallback = null;
	};

	proto.setExitCallback = function (callback) {
		this._exitCallback = callback;
	};

	proto.setHighlightedCallback = function (callback) {
		this._menu.setItemHighlightedImmediateCallback(callback);
	};

	proto.setTitle = function (title) {
		this._title.setText(title);
	};

	proto.setTitleImage = function (href) {
		if (href) {
			this._titleImage.setHref(href);
			this._titleImage.show();
			this._titleImage.setY(this._title.getTrueY());
			this._title.setX(this._titleImage.getTrueX() + this._titleImage.getTrueWidth() + this.TITLE_IMAGE_SPACING);
		}
	};

	/**
	 * @method setErrorCode
	 * @param {String} errorCode, this must include any prefix, e.g. "Cod:"
	 */
	proto.setErrorCode = function (errorCode) {
		if (errorCode) {
			this._errorCode.setText(errorCode);
			this._errorCode.show();
		} else {
			this._errorCode.hide();
		}
	};

	proto.setAlertImageTextConfig = function (config) {
		if (config) {
			this._alertImageText.configure(config);
		}
	};

	proto.setAlertImageSubTextConfig = function (config) {
		if (config) {
			this._alertImageSubText.configure(config);
		}
	};

	/**
	 * Sets the big warning icon for the dialog
	 * @method setAlertBigVisibility
	 * @param {boolean} flag true to display the alert icon
	 */
	proto.setAlertBigVisibility = function (flag) {
		if (flag) {
			this._alertImage.show();
		} else {
			this._alertImage.hide();
		}
	};


	proto.setAlertImage = function (configObj, displayPosition, isBackgroundDisplay) {
		if (configObj) {
			var TOP_SPACING = 26,
				LEFT_SPACING = 25;
			this._alertImage.show();
			if (displayPosition === "right") {
				this._alertImage.setX(this._messageText.getTrueWidth() + this._messageText.getTrueX() - LEFT_SPACING);
			} else {
				this._alertImage.setX(LEFT_SPACING);
			}
			this._alertImage.configure(configObj);
			if (isBackgroundDisplay) {
				this.displayAlertImageBackGround(displayPosition);
			}
		}
	};

	/**
	 * Set configuration for alert image's
	 * background component. Automatically adjusts
	 * x, y, height, width based on alert image
	 * @method setAlertImageBackground
	 * @param {Object} configObject should have padding property
	 * and all other configs seperately in an object
	 */
	proto.setAlertImageBackground = function (configObject) {
		var backgroundConfig = configObject.backgroundConfig,
			imagePadding = configObject.imagePadding || 0;
		this._alertImageBackGround.configure(backgroundConfig);
		this._alertImageBackGround.configure({
			"x" : this._alertImage.getTrueX() - imagePadding,
			"y" : this._alertImage.getTrueY() - imagePadding,
			"height" : this._alertImage.getTrueHeight() + (imagePadding * 2),
			"width" : this._alertImage.getTrueWidth() + (imagePadding * 2)
		});
	};

	proto.displayAlertImageBackGround = function (displayPosition) {
		var LEFT_SPACING = 30;
		this._alertImageBackGround.show();
		if (displayPosition === "right") {
			this._alertImageBackGround.setX(this._messageText.getTrueWidth() + this._messageText.getTrueX() - LEFT_SPACING);
		} else {
			this._alertImageBackGround.setX(LEFT_SPACING);
		}
	};

	/**
	 * @method setMessage
	 * @param {String} text
	 */
	proto.setMessage = function (text) {
		this._messageText.setText(text);
		this.layoutDialogue();
	};

	proto.setOptions = function (options) {
		if (options) {
			this._determinateOrientationMode(options);
			this._menu.setData(options);
			this.numberOfButtons = options.length;
		}
		this._menu.displayData();
	};

	proto.setOptionsText = function (options) {
		if (options) {
			this._menu.setData(options);
		}
		this._menu.displayData();
	};

	/**
	 * Set default active button then dialog is activated
	 * DO NOT USE, LEFT-MOST BUTTON SHOULD ALWAYS BE DEFAULT
	 *
	 * @method setDefaultButton
	 * @param {Integer} key - button action key value
	 */
	proto.setDefaultButton = function (key) {
		var menuData = this._menu.getData(),
			menuDataLength = menuData.length,
			i;

		for (i = 0; i < menuData.length; i++) {
			if (menuData[i].action === key) {
				this._menu.selectItemAtIndex(i + 1, true);
				break;
			}
		}
	};

	proto.setHighlightedItemLabel = function (text) {
		this._highlightedItemLabel.setText(text);
	};

	proto.select = function () {
		this._menu.select();
	};

	$N.gui = $N.gui || {};
	$N.gui.ConfirmationDialog = ConfirmationDialog;

}($N || {}));
