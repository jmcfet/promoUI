/**
 * @author Kiran
 * @class BlockingDialog
 */

(function ($N) {

	function BlockingDialog(docRef, parent) {

		var SCREEN_WIDTH = 1920,
			SCREEN_HEIGHT = 1080;

		BlockingDialog.superConstructor.call(this, docRef);

		this.DIALOGUE_BACKPLATE_Y = 450;
		this.DIALOGUE_BACKPLATE_H = 180;

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

		this._backplateUpperGlow = new $N.gui.BackgroundBox(docRef, this._backgroundContainer);
		this._backplateUpperGlow.configure({
			x: 0,
			y: 405,
			width: SCREEN_WIDTH,
			height: 50,
			cssClass: "dialogueGlowUpper"
		});

		this._backplateLowerGlow = new $N.gui.BackgroundBox(docRef, this._backgroundContainer);
		this._backplateLowerGlow.configure({
			x: 0,
			y: 630,
			width: SCREEN_WIDTH,
			height: 50,
			cssClass: "dialogueGlowLower"
		});

		// gui elements
		this._title.configure({
			x: 630,
			y: 550,
			cssClass: "blockingDialogTitle"
		});

		// bring to front because _title and _message are created by JSFW
		this._title.bringToFront();

		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(BlockingDialog, $N.gui.AbstractConfirmationDialog);

	BlockingDialog.prototype.setTitle = function (title) {
		this._title.setText(title);
	};

	/**
	 * Makes sure that no activity happens on keypress
	 * @method keyHandler
	 * @param {String} key
	 * @return {Boolean} True if key was handled, false otherwise.
	 */
	BlockingDialog.prototype.keyHandler = function (key) {
		return true;
	};

	$N.gui = $N.gui || {};
	$N.gui.BlockingDialog = BlockingDialog;

}($N || {}));

