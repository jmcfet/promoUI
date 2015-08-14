/**
 * Concrete implementation of a Dialog that can be used to show a
 * message that simply wraps the GUI version. See - `$N.gui.MessageDialog`
 * @class $N.apps.dialog.BasicDialog
 * @extends $N.apps.dialog.Dialog
 * @constructor
 * @param {String} id Unique ID of the dialog
 * @param {String} title Title of the dialog
 * @param {String} bodyContent Message to display
 * @param {String}  okText - Text to display on the ok button
 * @param {Function} okCallback Code to be executed when ok is pressed
 * @param {Number} x x position to show the dialog, null to use default
 * @param {Number} y y position to show the dialog, null to use default
 * @param {Number} width width to show the dialog, null to use default
 * @param {Number} height height to show the dialog, null to use default
 * @param {Boolean} modal true if it should steal all key presses
 */

define('jsfw/apps/dialog/BasicDialog',
    [
    	'jsfw/apps/dialog/DialogManager',
    	'jsfw/apps/dialog/Dialog',
    	'jsfw/gui/GUIObjects/Controls/dialogs/MessageDialog',
    	'jsfw/apps/util/Util'
    ],
	function (DialogManager, Dialog, MessageDialog, Util) {

		function BasicDialog(id, title, bodyContent, okText, okCallback, x, y, width, height, modal) {

			var me = this;

			BasicDialog.superConstructor.call(this, id, modal);

			okCallback = okCallback || function () {};

			this._dialogGUIObject = new BasicDialog.GUITemplateObject(document);
			this._dialogGUIObject.configure({
				id: id,
				title: title || id,
				message: bodyContent || "",
				buttonText: okText || "OK",
				okCallback: function () {
					$N.apps.dialog.DialogManager.hideDialog(me);
					okCallback();
				}
			});
			this._positionAndSizeDialog(x, y, width, height);
		}

		$N.apps.util.Util.extend(BasicDialog, $N.apps.dialog.Dialog);

		/**
		 * The BasicDialog GUI template, override for custom dialogs
		 * @property {Object} GUITemplateObject
		 */
		BasicDialog.GUITemplateObject = $N.gui.MessageDialog;

		$N.apps = $N.apps || {};
		$N.apps.dialog = $N.apps.dialog || {};
		$N.apps.dialog.BasicDialog = BasicDialog;
		return BasicDialog;
	}
);
