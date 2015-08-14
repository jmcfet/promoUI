/**
 * @author maniguru
 * @class ConflictDialog
 */

/*global GlobalKeysInterceptor*/


(function ($N) {

	function ConflictDialog(docRef, parent) {

		var SCREEN_WIDTH = 1920,
			SCREEN_HEIGHT = 1080,
			VERTICAL_BUTTON_WIDTH = 1237,
			BUTTON_HEIGHT = 60,
			i;

		ConflictDialog.superConstructor.call(this, docRef);

		this.INDENTATION = 345;
		this.ORIENTATION = "VERTICAL";
		this.BUTTON_VERTICAL_SPACING = 50;
		this.DIALOGUE_BACKPLATE_Y = 236;
		this.DIALOGUE_BACKPLATE_H = 608;
		this.VISIBLE_OPTIONS_ROWS = 3;
		this.verticalButtonMode = true;
		this.numberOfButtons = 0;
		this.VERTICAL_MOVEMENT_POSITIONS = [];
		this.OPACITY_VALUES = [];

		this._dialogueBackground = new $N.gui.BackgroundBox(docRef, this._backgroundContainer);
		this._dialogueBackground.configure({
			x: 0,
			y: 0,
			width: SCREEN_WIDTH,
			height: SCREEN_HEIGHT,
			cssClass: "dialogueBackground"
		});

		this._dialogueBackplate = new $N.gui.BackgroundBox(docRef, this._backgroundContainer);
		this._dialogueBackplate.configure({
			x: 0,
			y: this.DIALOGUE_BACKPLATE_Y,
			width: SCREEN_WIDTH,
			height: this.DIALOGUE_BACKPLATE_H,
			cssClass: "dialogueBackplate"
		});

		this._alertImage = new $N.gui.Image(docRef, this._backgroundContainer);
		this._alertImage.configure({
			x: 114,
			y: 476,
			width: 177,
			height: 177,
			href: "customise/resources/images/%RES/icons/Icn_AlertLarge.png",
			opacity: 0.2,
			visible: true
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
			y: this.DIALOGUE_BACKPLATE_Y + 66,
			cssClass: "dialogTitle"
		});

		// _message is created by JSFW and trying to re-use it is problematic
		this._message.configure({
			visible: false
		});

		this._messageText = new $N.gui.TextArea(docRef, this._container);
		this._messageText.configure({
			x: this.INDENTATION,
			y: this.DIALOGUE_BACKPLATE_Y + 150,
			height: 160,
			width: SCREEN_WIDTH - (this.INDENTATION * 2),
			cssClass: "dialogMessage"
		});

		this.maxStrLength = 0;

		// bring to front because _title and _message are created by JSFW
		this._title.bringToFront();

		this._dialogueTypeLabel = new $N.gui.Label(docRef, this._container);

		this._dataMapper = {
			getTitle: function (obj) {
				return obj.name;
			},
			isVertical: function () {
				return true;
			},
			getVerticalItemWidth: function () {
				return VERTICAL_BUTTON_WIDTH;
			},
			getItemHeight: function () {
				return BUTTON_HEIGHT;
			}
		};
		this._menu = new $N.gui.PageableListWithArrows(docRef, this._container);
		this._menu.configure({
			x: this.INDENTATION,
			y: 520,
			itemHeight: 20,
			wrapAround: false,
			itemTemplate: "ButtonGroupItem",
			upArrowProperties: {
				x: 1209,
				y: -30,
				width: 28,
				height: 18,
				visible: true
			},
			downArrowProperties: {
				x: 1212,
				y: 232,
				width: 28,
				height: 18,
				visible: true
			}
		});

		this._menu.getItemConfig().opacityValues = this.OPACITY_VALUES;

		this._highlightedItemLabel = new $N.gui.Label(docRef, this._container);

		// configure gui elements
		this._MENU_CONF = {
	        itemTemplate: $N.gui.SubMenuItem
		};

		// add gui elements to the dialog container
		this._container.addChild(this._dialogueTypeLabel);
		this._container.addChild(this._menu);
		this._container.addChild(this._highlightedItemLabel);

		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(ConflictDialog, $N.gui.AbstractConfirmationDialog);

	var proto = ConflictDialog.prototype;

	/**
	 * Selects the default item in the confirmation dialog
	 * @method selectDefaultItem
	 */
	proto.selectDefaultItem = function () {
		this._menu.selectItemAtIndex(1, true);
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
		this._menu.setDataMapper(this._dataMapper);
		this._menu.getItemConfig().movementPositions = this.VERTICAL_MOVEMENT_POSITIONS;
		this._menu.setOrientation($N.gui.FixedList.consts.ORIENTAION_VERTICAL);
		this._menu._data.setVisibleRows(this.VISIBLE_OPTIONS_ROWS);
		if (!this._menu._items || this._menu._items.length === 0) {
			this._menu.initialise(false);
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

		switch (key) {
		// dialogue navigation keys, the only ones this dialogue is interested in
		case keys.KEY_UP:
		case keys.KEY_DOWN:
		case keys.KEY_OK:
			handled = this._menu.keyHandler(key);
			if (handled) {
				return true;
			}
			break;

		// keys that close the dialogue
		case keys.KEY_BACK:
		case keys.KEY_EXIT:
		case keys.KEY_LEFT:
			if (this._exitCallback) {
				this._exitCallback(this._menu._data.getData());
			} else {
				this._callback(null);
			}
			return true;

		// keys we want to handle but NOT dimiss the dialogue
		case keys.KEY_VOL_UP:
		case keys.KEY_VOL_DOWN:
		case keys.KEY_MUTE:
			GlobalKeysInterceptor.keyHandler(key);
			return true;

		// keys we want to handle after dismissing the dialogue
		case keys.KEY_HOME:  // portal
		case keys.KEY_POWER:
		case keys.KEY_MOSAIC:
		case keys.KEY_INFO:
		case keys.KEY_GUIDE:
		case keys.KEY_AGORA:
		case keys.KEY_FAVOURITES:
		case keys.KEY_CHAN_UP:
		case keys.KEY_CHAN_DOWN:
		case keys.KEY_MENU:  // portal
		case keys.KEY_VOD:   // ppv
		case keys.KEY_VIEW:  // now/vod
			GlobalKeysInterceptor.keyHandler(key);
			if (this._exitCallback) {
				this._exitCallback(this._menu._data.getData());
			} else {
				this._callback(null, key);
			}
			return true;

		default:
			return false;
		}

		if (!handled && key === keys.KEY_LEFT) {
			if (this._exitCallback) {
				this._exitCallback(this._menu._data.getData());
			}
			return true;
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

	proto.setDialogueTypeLabel = function (string) {
		var textArray = string.split(' '),
			SPLIT_STRING_IF_OVER = 1;
		if (textArray.length > SPLIT_STRING_IF_OVER) {
			this._dialogueTypeLabel.setText(textArray.shift());
		} else {
			this._dialogueTypeLabel.setText(string);
		}
	};

	proto.setTitle = function (title) {
		this._title.setText(title);
	};

	/**
	 * @method setMessage
	 * @param {String} text
	 */
	proto.setMessage = function (text) {
		this._messageText.setText(text);
	};

	proto.setOptions = function (options) {
		var i;
		if (options) {
			this.setVerticalOrientation();
			this._menu.setData(options);
			this.numberOfButtons = options.length;
			for (i = 0; i < options.length; i++) {
				this.VERTICAL_MOVEMENT_POSITIONS.push({x: 0, y: (this.BUTTON_HEIGHT + this.BUTTON_VERTICAL_SPACING) * i});
				this.OPACITY_VALUES.push(1);
				this._menu.getItemConfig().opacityValues = this.OPACITY_VALUES;
			}
		}
		this._menu.displayData();
		this._menu.focus();
	};

	proto.setHighlightedItemLabel = function (text) {
		this._highlightedItemLabel.setText(text);
	};

	proto.select = function () {
		this._menu.select();
	};

	$N.gui = $N.gui || {};
	$N.gui.ConflictDialog = ConflictDialog;

}($N || {}));
