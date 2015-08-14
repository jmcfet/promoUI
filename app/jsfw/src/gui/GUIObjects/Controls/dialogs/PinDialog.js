/**
 * A graphical representation of a dialog that can be used to display
 * a message on screen with a title, ok, cancel buttons and a pin entry
 * field. This class acts as an example of how a dialog can be created,
 * it may not necessarily be used in this form but is by default used
 * in the SDK's DialogManager
 * @class $N.gui.PinDialog
 * @extends $N.gui.OkCancelDialog
 *
 * @requires $N.gui.Form
 * @requires $N.gui.NumberEntry
 * @requires $N.gui.Util
 * @requires $N.gui.OkCancelDialog
 *
 * @author mbrown
 * @constructor
 * @param {Object} docRef document element of the page
 * @param {Object} parent the gui object this should be added to
 */
define('jsfw/gui/GUIObjects/Controls/dialogs/PinDialog',
    [
    'jsfw/gui/GUIObjects/Controls/dialogs/OkCancelDialog',
    'jsfw/gui/GUIObjects/Controls/Form',
    'jsfw/gui/GUIObjects/Controls/NumberEntry',
    'jsfw/gui/helpers/Util'
    ],
    function (OkCancelDialog, Form, NumberEntry, Util) {

		function PinDialog(docRef, parent) {
			var me = this;

			this._mainForm = new $N.gui.Form(docRef);
			this._pinEntry = new $N.gui.NumberEntry(docRef, this._mainForm);

			PinDialog.superConstructor.call(this, docRef);

			this._container.addChild(this._mainForm);

			this._pinEntry.configure({
				id: me.getId() + "PinEntry",
				x: 180,
				y: 90,
				maxCharacters: 4,
				passwordChar: "*"
			});

			this._mainForm.addControl(this._pinEntry);
			this._mainForm.addControl(this._buttons);

			this._buttons.unHighlight();
			this._mainForm.highlight();

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(PinDialog, $N.gui.OkCancelDialog);

		var proto = PinDialog.prototype;

		/**
		 * Overrides the superclass setOkCallback method to also
		 * pass back the value entered into the dialog.
		 * @method setOkCallback
		 * @param {Function} callback
		 */
		proto.setOkCallback = function (callback) {
			var me = this;
			this._okButton.setSelectedCallback(function () {
				callback(me._pinEntry.getValue());
			});
		};

		/**
		 * Overrides the superclass setWidth method to also reposition
		 * the pin entry
		 * @method setWidth
		 * @param {Number} width
		 */
		proto.setWidth = function (width) {
			PinDialog.superClass.setWidth.call(this, width);
			this._pinEntry.setX(this.getWidth() - this._pinEntry.getWidth() - 40);
		};

		/**
		 * Overrides the superclass setHeight method to also reposition
		 * the pin entry
		 * @method setHeight
		 * @param {Number} height
		 */
		proto.setHeight = function (height) {
			PinDialog.superClass.setHeight.call(this, height);
			this._pinEntry.setY(this.getHeight() - this._pinEntry.getHeight() - 100);
		};

		/**
		 * Overrides the superclass keyHandler to pass the keys on to
		 * the form holding the buttons. The class creating the dialog
		 * should pass the keys on to this function
		 * @method keyHandler
		 * @param {String} key
		 * @return {Boolean} True if key was handled, false otherwise.
		 */
		proto.keyHandler = function (key) {
			return this._mainForm.keyHandler(key);
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.PinDialog = PinDialog;
		return PinDialog;
	}
);