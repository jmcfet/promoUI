/**
 * Concrete implementation of a Dialog that can be used to show a
 * message and offer a list of options to the user.
 * This class is very close replica of the ConfirmationDialogue, except
 * for the list of visible options at the moment and the auto title and message indentation.
 * This is used to display conflicts between auto tune, reminder and between both.
 * @class ConflictDialogue
 * @constructor
 * @namespace $N.apps.dialog
 * @param {String} id Unique ID of the dialog
 * @param {String} title Title of the dialog
 * @param {String} messageText the text comprising the main body of the dialog
 * @param {Array} options An array of item objects to display in the list, each must have a name property.
 * @param {Function} callback Code to be executed when option is selected
 * @param {Function} highlightedImmediateCallback Code to be executed when option is highlighted
 * @param {Array} controls An array of GUI controls that should have a getHeight function.
 * @extends $N.apps.dialog.BaseDialog
 */
(function ($N) {

	function ConflictDialogue(id, title, messageText, options, callback, highlightedImmediateCallback, controls, orientation) {

		var me = this,
			DIALOGUE_TOP_LEFT_X = 0,
			DIALOGUE_TOP_LEFT_Y = 0,
			DIALOGUE_WIDTH_UNUSED = 1240,
			DIALOGUE_HEIGHT_UNUSED = 280;

		ConflictDialogue.superConstructor.call(this, id, true);
		this._dialogGUIObject = new ConflictDialogue.GUITemplateObject(document, null);
		if (orientation) {
			this._dialogGUIObject.setOrientation(orientation);
		}
		this._dialogGUIObject.setTitle(title);
		this._dialogGUIObject.setOptions(options);
		this._dialogGUIObject.setMessage(messageText);
		this._dialogGUIObject.setSelectedCallback(function (item) {
			$N.apps.dialog.DialogManager.hideDialog(me);
			if (callback) {
				callback(item);
			}
		});
		this.setExitCallback = function (callback) {
			this._dialogGUIObject.setExitCallback(function (items) {
				$N.apps.dialog.DialogManager.hideDialog(me);
				callback(items);
			});
		};
		// in the following function, 0,0 sets the top-left of the dialogue. 725,280 is the size, but has little or no effect.
		this._positionAndSizeDialog(DIALOGUE_TOP_LEFT_X, DIALOGUE_TOP_LEFT_Y, DIALOGUE_WIDTH_UNUSED, DIALOGUE_HEIGHT_UNUSED);
		this._dialogGUIObject.selectDefaultItem();
	}

	$N.apps.util.Util.extend(ConflictDialogue, $N.apps.dialog.BaseDialog);

    ConflictDialogue.prototype.show = function () {
        $N.app.TracksUtil.deactivateCurrentSubtitleTrack();
        ConflictDialogue.superClass.show.call(this);
    };

	/**
	 * The ConflictDialogue GUI template, override for custom dialogs
	 * @property GUITemplateObject
	 * @type {Object}
	 */
	ConflictDialogue.GUITemplateObject = $N.gui.ConflictDialog;

	$N.apps.dialog = $N.apps.dialog || {};
	$N.apps.dialog.ConflictDialogue = ConflictDialogue;

}($N = $N || {}));
