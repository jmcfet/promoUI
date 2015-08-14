/**
 * @class SocialAccountAuthDialog
 * @extends ConfirmationDialog
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = $N || {};
(function ($N) {
	var proto,
		SCREEN_WIDTH = 1920,
		SocialAccountAuthDialog = function (docRef, parent) {
			SocialAccountAuthDialog.superConstructor.call(this, docRef);
			//configure purchase rate text.
			this._alertImageText.configure({
				x : 735,
				y : 248 + this.DIALOGUE_BACKPLATE_Y,
				visible: true,
				cssClass: "socialAuthCode"
			});

			//configure the genreInfo text label.
			this._alertImageSubText.configure({
				x: 16.5,
				width: SCREEN_WIDTH - 100,
				y : this.DIALOGUE_BACKPLATE_Y + this.DIALOGUE_BACKPLATE_H - 60.5,
				cssClass: "dialogMessage timerText",
				visible: true
			});
		};
	$N.gui.Util.extend(SocialAccountAuthDialog, $N.gui.ConfirmationDialog);
	$N.gui.SocialAccountAuthDialog = SocialAccountAuthDialog;
	proto = SocialAccountAuthDialog.prototype;
	/**
	 * This method is to reconfigure come components, which
	 * gets positioned automatically during creation
	 * @method reconfigurePositions
	 * @public
	 */
	proto.reconfigure = function () {
		var alertImageConfig = {"height": 258, "width": 258, "y": 390, "cssClass": "pinDialogMessage", "opacity" : 0.8, "visible": true};
		this._title.configure({
			y: 62.5 + this.DIALOGUE_BACKPLATE_Y
		});
		this._titleImage.configure({
			y: 62.5 + this.DIALOGUE_BACKPLATE_Y
		});
		this._messageText.configure({
			y: 140 + this.DIALOGUE_BACKPLATE_Y
		});
		this._menu.configure({
			y: 420 + this.DIALOGUE_BACKPLATE_Y
		});
		this.setAlertImage(alertImageConfig, $N.app.constants.DISPLAY_CONTAINER_IN_RIGHT, true);
	};

	/**
     * To set the config for alert image. It overwrites
     * the same method in parent class 
     * @method setAlertImage
	 * @public 
     */
	proto.setQrCode = function (qrCodeUrl) {
		this._alertImage.setHref(qrCodeUrl);
	};

	$N.apps.core.Language.adornWithGetString(SocialAccountAuthDialog);
}($N || {}));