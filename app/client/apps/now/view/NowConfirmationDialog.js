/**
 * @class $N.gui.NowConfirmationDialog
 * @constructor
 * @extends $N.gui.ConfirmationDialog
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowConfirmationDialog = function (docRef, parent) {
		NowConfirmationDialog.superConstructor.call(this, docRef);

		this._callbackData = null;
		this.VERTICAL_CHAR_COUNT = 20;
		this._useRealMessageHeight = true;

		this._dialogueBackground.setCssClass("nowDialogBackground");
		this._backplateUpperGlow.setCssClass("nowFullAssetUniformGradient");
		this._backplateLowerGlow.setCssClass("nowFullAssetUniformGradientInvert");
		this._dialogueBackplate.setCssClass("");
		this._solidLineTop = new $N.gui.BackgroundBox(this._docRef, this._dialogueBackplate);
		this._solidLineBottom = new $N.gui.BackgroundBox(this._docRef, this._dialogueBackplate);
		this._radialGradientTop = new $N.gui.BackgroundBox(this._docRef, this._dialogueBackplate);
		this._radialGradientBottom = new $N.gui.BackgroundBox(this._docRef, this._dialogueBackplate);
		this._barBackground = new $N.gui.BackgroundBox(this._docRef, this._dialogueBackplate);

		this._solidLineTop.configure({
			x: 0,
			y: -1.5,
			width: 1920,
			height: 4.5,
			cssClass: "loadingBarSolidDivider"
		});
		this._solidLineBottom.configure({
			x: 0,
			y: 601.5,
			width: 1920,
			height: 4.5,
			cssClass: "loadingBarSolidDivider"
		});
		this._radialGradientTop.configure({
			x: 0,
			y: -150,
			width: 1920,
			height: 463.5,
			cssClass: "radialGradientBackground"
		});
		this._radialGradientBottom.configure({
			x: 0,
			y: 258,
			width: 1920,
			height: 463.5,
			cssClass: "radialGradientBackground"
		});
		this._barBackground.configure({
			x: 0,
			y: 3,
			width: 1920,
			height: 598.5,
			cssClass: "blackFill"
		});

		this._priceText = new $N.gui.Label(docRef, this._container);
		this._priceText.configure({
			x: this.INDENTATION,
			cssClass: "nowFullAssetInfoPrice",
			visible: false
		});
		this._errorCode = new $N.gui.Label(docRef, this._container);
		this._errorCode.configure({
			x: 1920 - this.INDENTATION,
			cssClass: "errorCode",
			visible: false
		});

		this._menu.getItemConfig().cssClass = "optionsMenuItem";
		this._menu.getItemConfig().cssHighlightClass = "optionsMenuItemHighlighted";
	};
	$N.gui.Util.extend(NowConfirmationDialog, $N.gui.ConfirmationDialog);

	/**
	 * @method setPriceText
	 * @param {String} priceText
	 */
	NowConfirmationDialog.prototype.setPriceText = function (priceText) {
		if (priceText) {
			this._priceText.setText(priceText);
			this._priceText.show();
		} else {
			this._priceText.hide();
		}
	};

	/**
	 * @method setMessage
	 * @param {String} text
	 */
	NowConfirmationDialog.prototype.setMessage = function (text) {
		var insertText = "";
		if (this._priceText.isVisible()) {
			insertText = "\n";
		}
		NowConfirmationDialog.superClass.setMessage.call(this, insertText + text);
		this._priceText.setY(this._messageText.getTrueY() + 28.5);
	};

	/**
	 * @method setButtonPressedCallback
	 * @param {Function} callback
	 */
	NowConfirmationDialog.prototype.setButtonPressedCallback = function (callback) {
		var me = this;
		this._menu.setItemSelectedCallback(function (data) {
			callback(data, me._callbackData);
		});
	};

	/**
	 * @method setExitCallback
	 * @param {Function} callback
	 */
	NowConfirmationDialog.prototype.setExitCallback = function (callback) {
		this._callback = callback;
	};

	/**
	 * @method setCallbackData
	 * @param {Object} data
	 */
	NowConfirmationDialog.prototype.setCallbackData = function (data) {
		this._callbackData = data;
	};

	/**
	 * @method setErrorCode
	 * @param {String} errorCode
	 */
	NowConfirmationDialog.prototype.setErrorCode = function (errorCode) {
		if (errorCode) {
			this._errorCode.setText($N.app.MDSUtil.getString("errorCode") + errorCode);
			this._errorCode.show();
		} else {
			this._errorCode.hide();
		}
	};

	/**
	 * @method layoutDialogue
	 * @param {Object} controlsGroup
	 */
	NowConfirmationDialog.prototype.layoutDialogue = function (controlsGroup) {
		NowConfirmationDialog.superClass.layoutDialogue.call(this, controlsGroup);
		this._errorCode.setY(this._menu.getTrueY() + 25.5);
	};

	$N.gui.NowConfirmationDialog = NowConfirmationDialog;
}($N || {}));