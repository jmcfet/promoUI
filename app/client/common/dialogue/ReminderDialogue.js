/**
 * Concrete implementation of a Dialog that can be used to show a
 * message and offer a list of options to the user.
 * This class wraps both FullscreenConfirmationDialog and MinimisedConfirmationDialog,
 * depending on the minimised parameter.
 * @class ReminderDialogue
 * @constructor
 * @namespace $N.apps.dialog
 * @param {String} id Unique ID of the dialog
 * @param {Array} options An array of item objects to display in the list, each must have a name property.
 * @param {Function} callback Code to be executed when option is selected
 * @extends $N.apps.dialog.BaseDialog
 */
(function ($N) {

	function ReminderDialogue(id, options, selectedCallback, highlightedCallback) {

		var me = this,
			mode = "minimised",
			x = 450,
			y = 735,
			okCallback;
		if (!selectedCallback) {
			selectedCallback = function () {};
		}
		if (!highlightedCallback) {
			highlightedCallback = function () {};
		}

		ReminderDialogue.superConstructor.call(this, id, true);
		this._dialogGUIObject = new ReminderDialogue.GUITemplateObject(document);
		okCallback = selectedCallback || function () {};

		this._dialogGUIObject.setMode(mode);
		this._dialogGUIObject.setOptions(options);
		this._dialogGUIObject.setSelectedCallback(function (item) {
			$N.apps.dialog.DialogManager.hideDialog(me);
			selectedCallback(item);
		});
		this._dialogGUIObject.setHighlightedCallback(highlightedCallback);
		this._positionAndSizeDialog(x, y, 725, 280);
		this._dialogGUIObject.selectDefaultItem();

	}

	$N.apps.util.Util.extend(ReminderDialogue, $N.apps.dialog.BaseDialog);

    ReminderDialogue.prototype.show = function () {
        $N.app.TracksUtil.deactivateCurrentSubtitleTrack();
        ReminderDialogue.superClass.show.call(this);
    };

	/**
	 * The ConfirmationDialogue GUI template, override for custom dialogs
	 * @property GUITemplateObject
	 * @type {Object}
	 */
	ReminderDialogue.GUITemplateObject = $N.gui.ReminderDialog;

	$N.apps.dialog = $N.apps.dialog || {};
	$N.apps.dialog.ReminderDialogue = ReminderDialogue;

}($N = $N || {}));