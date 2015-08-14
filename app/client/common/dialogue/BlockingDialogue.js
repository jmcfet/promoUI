/**
 * Concrete implementation of a Dialog that can be used to show a message to the user.
 * @class BlockingDialogue
 * @constructor
 * @namespace $N.apps.dialog
 * @extends $N.apps.dialog.BaseDialog
 */
(function ($N) {

	function BlockingDialogue(id, title) {

		var me = this,
			DIALOGUE_TOP_LEFT_X = 0,
			DIALOGUE_TOP_LEFT_Y = 0,
			DIALOGUE_WIDTH_UNUSED = 780,
			DIALOGUE_HEIGHT_UNUSED = 280;

		BlockingDialogue.superConstructor.call(this, id, true);

		this._dialogGUIObject = new BlockingDialogue.GUITemplateObject(document);

		this._dialogGUIObject.setTitle(title);

		// in the following function, 0,0 sets the top-left of the dialogue. 725,280 is the size, but has little or no effect.
		this._positionAndSizeDialog(DIALOGUE_TOP_LEFT_X, DIALOGUE_TOP_LEFT_Y, DIALOGUE_WIDTH_UNUSED, DIALOGUE_HEIGHT_UNUSED);
	}

	$N.apps.util.Util.extend(BlockingDialogue, $N.apps.dialog.BaseDialog);

	/**
	 * The BlockingDialogue GUI template, override for custom dialogs
	 * @property GUITemplateObject
	 * @type {Object}
	 */
	BlockingDialogue.GUITemplateObject = $N.gui.BlockingDialog;

	$N.apps.dialog = $N.apps.dialog || {};
	$N.apps.dialog.BlockingDialogue = BlockingDialogue;

}($N = $N || {}));
