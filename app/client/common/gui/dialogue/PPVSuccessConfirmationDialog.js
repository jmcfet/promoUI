/**
 * @class PPVSuccessConfirmationDialog
 * @extends ConfirmationDialog
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = $N || {};
(function ($N) {
	var proto,
		PPVSuccessConfirmationDialog = function (docRef, parent) {
			PPVSuccessConfirmationDialog.superConstructor.call(this, docRef);
			this.DIALOGUE_BACKPLATE_Y = 750;
			this.DIALOGUE_BACKPLATE_H = 222;
			this.BACKPLATE_UPPER_GLOW_Y = 700;
			this.BACKPLATE_LOWER_GLOW_Y = 970;
		};

	$N.gui.Util.extend(PPVSuccessConfirmationDialog, $N.gui.ConfirmationDialog);

	$N.gui.PPVSuccessConfirmationDialog = PPVSuccessConfirmationDialog;

	proto = PPVSuccessConfirmationDialog.prototype;

	/**
	 * This method is to reposition UI components, which
	 * get positioned automatically during object creation
	 * @method refreshPPVSuccessPositions
	 * @public
	 */
	proto.refreshPPVSuccessPositions = function () {
		this._dialogueBackground.configure({
			visible : false
		});
		this._dialogueBackplate.configure({
			y: this.DIALOGUE_BACKPLATE_Y,
			height: this.DIALOGUE_BACKPLATE_H,
			cssClass: "dialogueBackplate"
		});
		this._backplateUpperGlow.configure({
			y: this.BACKPLATE_UPPER_GLOW_Y
		});
		this._backplateLowerGlow.configure({
			y: this.BACKPLATE_LOWER_GLOW_Y
		});
		this._title.configure({
			x : 240,
			y : this.DIALOGUE_BACKPLATE_Y + 59,
			cssClass : "zapperTitle"
		});
		this._messageText.configure({
			x : 240,
			y : this.DIALOGUE_BACKPLATE_Y + 119,
			cssClass : "agoraEventName"
		});
		this._menu.configure({
			x: 1400,
			y : this.DIALOGUE_BACKPLATE_Y + 100,
			width: 208.5
		});
	};

	$N.apps.core.Language.adornWithGetString(PPVSuccessConfirmationDialog);
}($N || {}));