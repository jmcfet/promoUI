/**
 * @class $N.gui.PinDialog
 * @constructor
 * @extends $N.gui.AbstractDialog
 * @requires $N.apps.core.Log
 * @requires $N.gui.Group
 * @requires $N.gui.BackgroundBox
 * @requires $N.gui.NumberEntry
 * @requires $N.gui.Label
 * @requires $N.gui.Image
 * @requires $N.app.constants
 * @requires $N.gui.BufferIndicator
 * @requires $N.gui.MaskIcon
 * @param {Object} docRef DOM document
 * @param {Object} [parent]
 */
(function ($N) {
	function PinDialog(docRef, parent) {
		PinDialog.superConstructor.call(this, docRef);
		var me = this,
			SCREEN_WIDTH = 1920,
			SCREEN_HEIGHT = 1080,
			i = null,
			labelObject = null;
		this.PIN_ENTRY_Y = 130;
		this.PIN_ENTRY_Y_PADDING = 10;
		this.TITLE_IMAGE_SPACING = 20;
		this._log = new $N.apps.core.Log("CommonGUI", "PinDialog");
		this._container = new $N.gui.Group(docRef);
		this._dialogBackground = new $N.gui.BackgroundBox(docRef, this._container);
		this._backplateUpperGlow = new $N.gui.BackgroundBox(docRef, this._container);
		this._backplateLowerGlow = new $N.gui.BackgroundBox(docRef, this._container);
		this._dialogueBackplate = new $N.gui.Container(docRef, this._container);
		this._pinEntry = new $N.gui.NumberEntry(docRef, this._container);
		this._pinBackArrow = new $N.gui.MaskIcon(docRef, this._container);
		this._title = new $N.gui.Label(docRef, this._container);
		this._subTitle = new $N.gui.Label(docRef, this._container);
		this._description = new $N.gui.Label(docRef, this._container);
		this._pinBoxArray = [];
		this._eventImage = new $N.gui.Image(docRef, this._container);
		this._titleImage = new $N.gui.Image(docRef, this._container);
		this._numberOfDigits = $N.app.constants.MAX_PIN_DIGITS;
		this._docRef = docRef;
		this._inProgressAppearance = false;
		this._inProgressIndicator = new $N.gui.Label(docRef, this._container);

		this._dialogBackground.configure({
			x: 0,
			y: 0,
			width: SCREEN_WIDTH,
			height: SCREEN_HEIGHT,
			cssClass: "dialogueBackground"
		});

		this._backplateUpperGlow.configure({
			x: 0,
			y: 184.5,
			width: SCREEN_WIDTH,
			height: 52.5,
			cssClass: "dialogueGlowUpper"
		});

		this._backplateLowerGlow.configure({
			x: 0,
			y: 841,
			width: SCREEN_WIDTH,
			height: 52.5,
			cssClass: "dialogueGlowLower"
		});

		this._dialogueBackplate.configure({
			x: 0,
			y: 236,
			width: SCREEN_WIDTH,
			height: 609,
			cssClass: "dialogueBackplate"
		});

		this._pinBackArrow.configure({
			x: 88,
			y: 525,
			width: 18,
			height: 30,
			href: "customise/resources/images/icons/arrows/leftArrowIcon.png",
			color: "#fff",
			visible: true
		});

		this._inProgressIndicator.configure({
			x: 700,
			y: 600,
			visible: false,
			cssClass: 'dialogSubtitle'
		});

		for (i = 0; i < this._numberOfDigits; i++) {
			this.addPinEntryBox();
			this._pinBoxArray[0].highlight();
		}

		this._uiKeyPressedCallback = function (pinValue, key) {
			var i = null;
			for (i = 0; i < this._numberOfDigits; i++) {
				if (i < pinValue.length) {
					this._pinBoxArray[i].setText("*");
				} else {
					this._pinBoxArray[i].setText("");
				}
				if (i === pinValue.length) {
					this._pinBoxArray[i].highlight();
				} else {
					this._pinBoxArray[i].unHighlight();
				}
			}
		};

		this._pinEntry.configure({
			visible: false
		});
		this._eventImage.configure({
			x: 1430,
			y: 510,
			id: "pineventimg",
			visible : true,
			href: "customise/resources/images/%RES/icons/DVR_controle_parental.png"
		});
		this._titleImage.configure({
			x: 435,
			y: 316,
			id: "titleimg",
			width : 60,
			height : 60,
			visible : false
		});
		this._title.configure({
			x: 434,
			y: 320,
			cssClass: 'pinEntryTitle'
		});
		this._description.configure({
			x: 435,
			y: 393,
			cssClass: 'dialogSubtitle'
		});
		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	}
	$N.gui.Util.extend(PinDialog, $N.gui.AbstractDialog);

	/**
	 * Appends one pin entry box to the holder
	 * @method addPinEntryBox
	 */
	PinDialog.prototype.addPinEntryBox = function () {
		var labelObject = new $N.gui.KeypadKeyItem(this._docRef, this._container);
		labelObject.configure({
			width : 225,
			height : 292.5,
			x : 435 + (240 * this._pinBoxArray.length),
			y : 459,
			cssClass : "optionsMenuItem",
			highlightCssClass : "optionsMenuItemHighlighted",
			highlightOpacity : "0.5",
			textConfig : {
				y : 24,
				cssClass : "pinKeys"
			}
		});
		this._pinBoxArray.push(labelObject);
	};

	/**
	 * Sets the CSS class of the title label
	 *
	 * @method setTitleCssClass
	 * @param {String} cssClass
	 */
	PinDialog.prototype.setNumberOfDigits = function (numberOfDigits) {
		var i = 0,
			difference = null;
		if (numberOfDigits) {
			if (numberOfDigits > this._numberOfDigits) {
				difference = numberOfDigits - this._numberOfDigits;
				for (i = 0; i < difference; i++) {
					this.addPinEntryBox();
				}
			}
			this._numberOfDigits = numberOfDigits;
		}
	};

	/**
	 * Sets the CSS class of the title label
	 *
	 * @method setTitleCssClass
	 * @param {String} cssClass
	 */
	PinDialog.prototype.setTitleCssClass = function (cssClass) {
		this._title.setCssClass(cssClass);
	};

	/**
	 * Set the x position of the pin dialog
	 *
	 * @method setX
	 * @param {x} x coordinate
	 */
	PinDialog.prototype.setX = function (x) {
		this._container.setX(x);
	};

	/**
	 * Set the y position of the pin entry and non entered digits dialog
	 *
	 * @method setPinEntryY
	 * @param {y} y coordinate
	 */
	PinDialog.prototype.setPinEntryY = function (y) {
		y = y || this.PIN_ENTRY_Y;
		if (y !== this.PIN_ENTRY_Y) {
			this._pinEntry.setY(y);
		}
	};

	/**
	 * Set the y position of the pin dialog
	 *
	 * @method setY
	 * @param {y} y coordinate
	 */
	PinDialog.prototype.setY = function (y) {
		this._container.setY(y);
	};

	PinDialog.prototype.resetTitlePosition = function () {
		this._title.configure({
			x: 435,
			y: 429,
			cssClass: 'pinEntryTitle'
		});
	};

	PinDialog.prototype.resetDescriptionPosition = function () {
		this._description.configure({
			x: 435,
			y: 370,
			cssClass: 'pinDialogMessage'
		});
	};

	/**
	 * Sets the text for the title for the pin
	 *
	 * @method setTitle
	 * @param {String} title
	 */
	PinDialog.prototype.setTitle = function (title) {
		this._title.setText(title);
		if (this._title.getText() === "") {
			this.resetDescriptionPosition();
		}
	};

	/**
	 * Sets the text for the subtitle for the pin
	 *
	 * @method setSubTitle
	 * @param {String} subtitle
	 */
	PinDialog.prototype.setSubTitle = function (subtitle) {
		this._subTitle.setText(subtitle);
	};

	/**
	 * Sets the css class for the subtitle
	 * @method setSubTitleCssClass
	 * @param {String} subtitle
	 */
	PinDialog.prototype.setSubTitleCssClass = function (cssClass) {
		this._subTitle.setCssClass(cssClass);
	};

	/**
	 * Sets the x position for the subtitle
	 * @method setSubTitleX
	 * @param {String} subtitle
	 */
	PinDialog.prototype.setSubTitleX = function (x) {
		this._subTitle.setX(x);
	};

	/**
	 * Sets the y position for the subtitle
	 * @method setSubTitleY
	 * @param {String} subtitle
	 */
	PinDialog.prototype.setSubTitleY = function (y) {
		this._subTitle.setY(y);
	};

	/**
	 * Sets the text for the description for the pin
	 *
	 * @method setSubTitle
	 * @param {String} description
	 */
	PinDialog.prototype.setDescription = function (description) {
		this._description.setText(description);
		if (this._description.getText() === "") {
			this.resetTitlePosition();
		}
	};

	/**
	 * Sets the href of the title image
	 *
	 * @method setTitleImage
	 * @param {String} href
	 */
	PinDialog.prototype.setTitleImage = function (href) {
		if (href) {
			this._titleImage.setHref(href);
			this._titleImage.show();
			this._title.setX(this._titleImage.getTrueX() + this._titleImage.getTrueWidth() + this.TITLE_IMAGE_SPACING);
		}
	};

	/**
	 * Sets the href of the event image
	 *
	 * @method setEventImage
	 * @param {String} href
	 */
	PinDialog.prototype.setEventImage = function (href) {
		if (href) {
			this._eventImage.setHref(href);
			this._eventImage.show();
		}
	};

	/**
	 * Displays the progress indicator and hides
	 * the pin entry boxes
	 * @method showInProgressMode
	 * @param {Object} pindialog object
	 */
	function showInProgressMode(me) {
		var i = 0;
		for (i = 0; i < me._pinBoxArray.length; i++) {
			me._pinBoxArray[i].hide();
		}
		me._inProgressIndicator.show();
	}

	/**
	 * Sets the appearance of pin entry as in progress
	 * @method setInProgressAppearance
	 * @param {String} href
	 */
	PinDialog.prototype.setInProgressAppearance = function (inProgressAppearance) {
		this._inProgressAppearance = inProgressAppearance;
	};

	/**
	 * Sets the appearance of pin entry as in progress
	 * @method setInProgressAppearance
	 * @param {String} href
	 */
	PinDialog.prototype.setInProgressIndicatorText = function (text) {
		this._inProgressIndicator.setText(text);
	};

	/**
	 * Sets the config of the event image
	 * @method setEventImageConfig
	 * @param {String} href
	 */
	PinDialog.prototype.setEventImageConfig = function (config) {
		if (config) {
			this._eventImage.configure(config);
		}
	};

	/**
	 * Sets the href of the event image
	 *
	 * @method setEventImage
	 * @param {String} href
	 */
	PinDialog.prototype.setEventImageVisibility = function (isImageToBeDisplayed) {
		if (isImageToBeDisplayed === true) {
			this._eventImage.show();
		} else if (isImageToBeDisplayed === false) {
			this._eventImage.hide();
		}
	};

	/**
	 * @method setLeftArrowVisibility
	 * @param {Boolean} showLeftArrow
	 */
	PinDialog.prototype.setLeftArrowVisibility = function (showLeftArrow) {
		if (showLeftArrow === true) {
			this._pinBackArrow.show();
		} else if (showLeftArrow === false) {
			this._pinBackArrow.hide();
		}
	};

	/**
	 * Setter for ok button text which is passed from PinDialog in framework
	 * Does not actually set anything as the pin dialogs in gravity do not use ok buttons
	 *
	 * @method setOkButtonText
	 * @param {String} text
	 */
	PinDialog.prototype.setOkButtonText = function (text) {
	};

	/**
	 * Setter for cancel button text which is passed from PinDialog in framework
	 * Does not actually set anything as the pin dialogs in gravity do not use cancel buttons
	 *
	 * @method setCancelButtonText
	 * @param {String} text
	 */
	PinDialog.prototype.setCancelButtonText = function (text) {
	};

	/**
	 * Sets the callback for when a pin number is entered
	 *
	 * @method setOkCallback
	 * @param {Object} callback
	 */
	PinDialog.prototype.setOkCallback = function (callback) {
		this._pinEntry.setSelectedCallback(callback);
	};

	/**
	 * Setter the cancel callback which is passed from PinDialog in framework
	 * Currently does not actually set anything
	 *
	 * @method setCancelCallback
	 * @param {Object} callback
	 */
	PinDialog.prototype.setCancelCallback = function (callback) {
		this._cancelCallback = callback;
	};

	/**
	 * Calls the reset method in the NumberEntry class
	 *
	 * @method reset
	 * @param {Boolean} flag
	 */
	PinDialog.prototype.setReset = function (flag) {
		var i = null;
		if (flag) {
			this._pinEntry.reset();
			this._uiKeyPressedCallback(this._pinEntry.getValue(), null);
			this._inProgressIndicator.hide();
			this._inProgressAppearance = false;
			for (i = 0; i < this._pinBoxArray.length; i++) {
				this._pinBoxArray[i].show();
			}
		}
	};

	/**
	 * Sets the callback for when a key is pressed
	 *
	 * @method setKeyPressedCallback
	 * @param {Object} callback
	 */
	PinDialog.prototype.setKeyPressedCallback = function (callback) {
		this._keyPressedCallback = callback;
	};

	/**
	 * The keyhandler for when a key is pressed and the pin dialog is displayed.
	 * Passed the key press to the NumberEntry class to deal with
	 *
	 * @method keyHandler
	 * @param {String} key
	 * @return {Boolean} True if the key press was handled, false otherwise.
	 */
	PinDialog.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled;
		switch (key) {
		case keys.KEY_RIGHT:
			handled = true;
			break;
		case keys.KEY_BACK:
			this._cancelCallback(key);
			handled = true;
			break;
		case keys.KEY_HOME:
		case keys.KEY_EXIT:
		case keys.KEY_MOSAIC:
		case keys.KEY_RADIO:
		case keys.KEY_GUIDE:
		case keys.KEY_AGORA:
		case keys.KEY_PPV:
		case keys.KEY_VIEW:
		case keys.KEY_MENU:
		case keys.KEY_PORTAL:
		case keys.KEY_VOD:
			this._cancelCallback(key);
			break;
		case keys.KEY_FFW:
		case keys.KEY_REW:
		case keys.KEY_PLAY_PAUSE:
		case keys.KEY_STOP:
			handled = true;
			break;
		default:
			if ($N.app.GeneralUtil.isKeyReleaseEvent(key)) {
				return false;
			}
			if (key === keys.KEY_LEFT && this._pinEntry.getValue() === "") {
				this._cancelCallback(key);
				handled = true;
			} else {
				handled = this._pinEntry.keyHandler(key);
				if (this._pinEntry.getValue().length === this._numberOfDigits) {
					if (this._inProgressAppearance) {
						showInProgressMode(this);
					}
					this._pinEntry._cancelDelayTimer();
					this._pinEntry._selectedCallback(this._pinEntry.getValue());
					handled = true;
				}
				if (this._keyPressedCallback) {
					this._keyPressedCallback(this._pinEntry.getValue(), key);
				}
				this._uiKeyPressedCallback(this._pinEntry.getValue(), key);
			}
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	$N.gui = $N.gui || {};
	$N.gui.PinDialog = PinDialog;

}($N || {}));
