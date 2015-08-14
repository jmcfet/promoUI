/**
 * Concrete implementation of a Dialog that can be used to show a
 * message and offer 2 options to the user, this class simply wraps
 * the GUI version. (see - `$N.gui.OKCancelDialog`)
 * @class $N.apps.dialog.OkCancelDialog
 * @extends $N.apps.dialog.Dialog
 * @constructor
 * @param {String} id Unique ID of the dialog
 * @param {String} title Title of the dialog
 * @param {String} bodyContent Message to display
 * @param {String} okButtonText Text to display on the ok button
 * @param {String} cancelButtonText Text to display on the cancel button
 * @param {Function} okCallback Code to be executed when ok is pressed
 * @param {Function} cancelCallback Code to be executed when cancel is pressed
 * @param {Number} x x co-ordinate to show the dialog, null to use default
 * @param {Number} y y co-ordinate to show the dialog, null to use default
 * @param {Number} width width to show the dialog, null to use default
 * @param {Number} height height to show the dialog, null to use default
 * @param {Boolean} modal true if it should steal all key presses
 */

define('jsfw/apps/dialog/OkCancelDialog',
    [
    	'jsfw/apps/dialog/DialogManager',
    	'jsfw/apps/util/Util',
    	'jsfw/apps/dialog/Dialog',
    	'jsfw/gui/GUIObjects/Controls/dialogs/OkCancelDialog'
    ],
	function (DialogManager, Util, Dialog, GUIOkCancelDialog) {

		function OkCancelDialog(id, title, bodyContent, okButtonText, cancelButtonText, okCallback, cancelCallback, x, y, width, height, modal) {

			var me = this;

			OkCancelDialog.superConstructor.call(this, id, modal);

			okCallback = okCallback || function () {};
			cancelCallback = cancelCallback || function () {};

			this._dialogGUIObject = new OkCancelDialog.GUITemplateObject(document);
			this._dialogGUIObject.configure({
				id: id,
				title: title || id,
				message: bodyContent || "",
				okButtonText: okButtonText || "OK",
				cancelButtonText: cancelButtonText || "Cancel",
				okCallback: function () {
					$N.apps.dialog.DialogManager.hideDialog(me);
					okCallback();
				},
				cancelCallback: function () {
					$N.apps.dialog.DialogManager.hideDialog(me);
					cancelCallback();
				}
			});
			this._positionAndSizeDialog(x, y, width, height);
		}

		$N.apps.util.Util.extend(OkCancelDialog, $N.apps.dialog.Dialog);

		/**
		 * The OkCancelDialog GUI template, override for custom dialogs
		 * @property {Object} GUITemplateObject
		 */
		OkCancelDialog.GUITemplateObject = $N.gui.OkCancelDialog;

		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.dialog = $N.apps.dialog || {};
		$N.apps.dialog.OkCancelDialog = OkCancelDialog;
		return OkCancelDialog;
	}
);
