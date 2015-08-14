/**
 * This class acts as the base Dialog for all Dialogs in Gravity UI, containing functionality
 * common to those Dialogs, such as other KEYS to be handled that are not handled in the JSFW Dialog key handler.
 *
 * @class $N.apps.dialog.BaseDialog
 * @constructor
 * @param {String} id Unique ID of the dialog
 * @param {Boolean} modal
 * @extends $N.apps.dialog.Dialog
 */
(function ($N) {
	function BaseDialog(id, modal) {
		BaseDialog.superConstructor.call(this, id, modal);
	}
	$N.apps.util.Util.extend(BaseDialog, $N.apps.dialog.Dialog);

	/**
	 * This Key handler handles the POWER Button key press for dialog, if not power call the default key handler
	 * @method keyHandler
	 * @param {String} key
	 * @return {Boolean} false if the key got handled by POWER BUTTON else call the superclass keyHandler.
	 */
	BaseDialog.prototype.keyHandler = function (key) {
		var RCU_POWER_KEY = 61455; // FIXME 2101: REPLACE WITH keys.KEY_POWER when NINJA 614 is complete GRAVITY- 2101
		if (key === RCU_POWER_KEY) {
			return false;
		}
		return BaseDialog.superClass.keyHandler.call(this, key);
	};

	BaseDialog.prototype.toString = function () {
		return "BaseDialog";
	};
	$N.apps = $N.apps || {};
	$N.apps.dialog = $N.apps.dialog || {};
	$N.apps.dialog.BaseDialog = BaseDialog;
}($N = $N || {}));