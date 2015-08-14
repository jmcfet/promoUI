/**
 * Concrete implementation of a Dialog that can be used to show a
 * message and offer 2 options to the user, plus a pin entry field
 * this class simply wraps the GUI version. (see - `$N.gui.PinDialog`)
 *
 * @class $N.apps.dialog.PinDialog
 * @extends $N.apps.dialog.Dialog
 * @constructor
 * @param {String} id Unique ID of the dialog
 * @param {String} title Title of the dialog
 * @param {String} bodyContent Message to display
 * @param {String} okButtonText Text to display on the ok button
 * @param {String} cancelButtonText Text to display on the cancel button
 * @param {Function} okCallback Code to be executed when ok is pressed
 * @param {Function} cancelCallback Code to be executed when cancel is pressed
 * @param {Number} x x position to show the dialog, null to use default
 * @param {Number} y y position to show the dialog, null to use default
 * @param {Number} width width to show the dialog, null to use default
 * @param {Number} height height to show the dialog, null to use default
 * @param {Boolean} modal true if it should steal all key presses
 * @param {Boolean} noAutoHide true if it should not autohide the pin dialog upon calling the callbacks
 */

define('jsfw/apps/dialog/PinDialog',
    [
    	'jsfw/apps/dialog/DialogManager',
    	'jsfw/apps/util/Util',
    	'jsfw/apps/dialog/Dialog',
    	'jsfw/gui/GUIObjects/Controls/dialogs/PinDialog'
    ],
	function (DialogManager, Util, Dialog, GUIPinDialog) {

		function PinDialog(id, title, bodyContent, okButtonText, cancelButtonText, okCallback, cancelCallback, x, y, width, height, modal, noAutoHide) {

			var me = this;

			PinDialog.superConstructor.call(this, id, modal);

			okCallback = okCallback || function () {};
			cancelCallback = cancelCallback || function () {};

			this._dialogGUIObject = new PinDialog.GUITemplateObject(document);
			this._dialogGUIObject.configure({
				id: id,
				title: title || id,
				message: bodyContent || "",
				okButtonText: okButtonText || "OK",
				cancelButtonText: cancelButtonText || "Cancel",
				okCallback: function (value) {
					if (!noAutoHide) {
						$N.apps.dialog.DialogManager.hideDialog(me);
					}
					okCallback(value);
				},
				cancelCallback: function () {
					$N.apps.dialog.DialogManager.hideDialog(me);
					cancelCallback();
				}
			});
			this._positionAndSizeDialog(x, y, width, height);
		}

		$N.apps.util.Util.extend(PinDialog, $N.apps.dialog.Dialog);

		/**
		 * The PinDialog GUI template, override for custom dialogs
		 * @property {Object} GUITemplateObject
		 */
		PinDialog.GUITemplateObject = $N.gui.PinDialog;

		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.dialog = $N.apps.dialog || {};
		$N.apps.dialog.PinDialog = PinDialog;
		return PinDialog;
	}
);