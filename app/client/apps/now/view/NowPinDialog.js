/**
 * @class $N.gui.NowPinDialog
 * @constructor
 * @extends $N.gui.PinDialog
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowPinDialog = function (docRef, parent) {
		NowPinDialog.superConstructor.call(this, docRef);

		this._dialogBackground.setCssClass("nowDialogBackground");
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
			y: 288,
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
		this._eventImage.configure({
			x: 1430,
			y: 510,
			id: "pineventimg",
			visible : true,
			href: "customise/resources/images/%RES/icons/DVR_controle_parental.png"
		});

		var i,
			loopLength = this._pinBoxArray.length;
		for (i = 0; i < loopLength; i++) {
			this._pinBoxArray[i].setCssClass("optionsMenuItem");
		}
	};
	$N.gui.Util.extend(NowPinDialog, $N.gui.PinDialog);

	/**
	 * @method setTitle
	 * @param {String} title
	 */
	NowPinDialog.prototype.setTitle = function (title) {
		this._title.setText(title);
	};

	/**
	 * @method setSubTitle
	 * @param {String} description
	 */
	NowPinDialog.prototype.setDescription = function (description) {
		if (this._title.getText() === "") {
			this.setTitle(description);
			this._description.setText("");
		} else {
			this._description.setText(description);
		}
	};

	/**
	 * @method setParentalIconVisible
	 * @param {Boolean} isVisible
	 */
	NowPinDialog.prototype.setParentalIconVisible = function (isVisible) {
		this._eventImage.setVisible(isVisible);
	};

	$N.gui.NowPinDialog = NowPinDialog;
}($N || {}));