/**
 * @class AbstractConfirmationDialog
 */

(function ($N) {
	function AbstractConfirmationDialog(docRef) {

		var BACKGROUND_WIDTH = 1920;
		var BACKGROUND_HEIGHT = 1080;

		AbstractConfirmationDialog.superConstructor.call(this, docRef);

		this._backgroundContainer = new $N.gui.Group(docRef, this._container);
		this._backgroundContainer.configure({
			x: 0,
			y: 0,
			width: BACKGROUND_WIDTH,
			height: BACKGROUND_HEIGHT
		});
	}

	$N.gui.Util.extend(AbstractConfirmationDialog, $N.gui.AbstractDialog);

	$N.gui = $N.gui || {};
	$N.gui.AbstractConfirmationDialog = AbstractConfirmationDialog;
}($N || {}));

