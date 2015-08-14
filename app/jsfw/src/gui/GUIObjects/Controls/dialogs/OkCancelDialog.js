/**
 * A graphical representation of a dialog that can be used to display
 * a message on screen with a title, ok and cancel buttons. This class acts as
 * an example of how a dialog can be created, it may not necessarily be
 * used in this form but is by default used in the SDK's DialogManager
 * @class $N.gui.OkCancelDialog
 * @extends $N.gui.AbstractDialog
 *
 * @requires $N.gui.AbstractDialog
 * @requires $N.gui.Form
 * @requires $N.gui.Button
 * @requires $N.gui.Util
 *
 * @author mbrown
 * @constructor
 * @param {Object} docRef document element of the page
 * @param {Object} parent the gui object this should be added to
 */

define('jsfw/gui/GUIObjects/Controls/dialogs/OkCancelDialog',
    [
    'jsfw/gui/GUIObjects/Controls/dialogs/AbstractDialog',
    'jsfw/gui/GUIObjects/Controls/Form',
    'jsfw/gui/GUIObjects/Controls/Button',
    'jsfw/gui/helpers/Util'
    ],
    function (AbstractDialog, Form, Button, Util) {

		function OkCancelDialog(docRef, parent) {
			var me = this;

			this._buttons = new $N.gui.Form(docRef);

			OkCancelDialog.superConstructor.call(this, docRef);

			this._okButton = new $N.gui.Button(docRef, this._buttons);
			this._cancelButton = new $N.gui.Button(docRef, this._buttons);

			this._container.addChild(this._buttons);

			this._buttons.configure({
				x: 140,
				y: 140,
				defaultTabDirection: "horizontal"
			});
			this._okButton.configure({
				id: me.getId() + "OkButton",
				x: 10
			});
			this._cancelButton.configure({
				id: me.getId() + "CancelButton",
				x: 140
			});

			this._buttons.addControl(this._okButton);
			this._buttons.addControl(this._cancelButton);

			this._buttons.highlight();

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(OkCancelDialog, $N.gui.AbstractDialog);

		var proto = OkCancelDialog.prototype;

		/**
		 * Sets the text to appear on the ok button
		 * @method setOkButtonText
		 * @param {String} text
		 */
		proto.setOkButtonText = function (text) {
			this._okButton.setLabel(text);
		};

		/**
		 * Sets the text to appear on the cancel button
		 * @method setCancelButtonText
		 * @param {String} text
		 */
		proto.setCancelButtonText = function (text) {
			this._cancelButton.setLabel(text);
		};

		/**
		 * Sets the function that is to executed when the ok button
		 * is pressed.
		 * @method setOkCallback
		 * @param {Function} callback
		 */
		proto.setOkCallback = function (callback) {
			this._okButton.setSelectedCallback(callback);
		};

		/**
		 * Sets the function that is to executed when the cancel button
		 * is pressed.
		 * @method setCancelCallback
		 * @param {Function} callback
		 */
		proto.setCancelCallback = function (callback) {
			this._cancelButton.setSelectedCallback(callback);
		};

		/**
		 * Overrides the superclass setWidth method to also reposition
		 * the buttons
		 * @method setWidth
		 * @param {Number} width
		 */
		proto.setWidth = function (width) {
			OkCancelDialog.superClass.setWidth.call(this, width);
			this._buttons.setX(this.getWidth() - 260);
		};

		/**
		 * Overrides the superclass setHeight method to also reposition
		 * the buttons
		 * @method setHeight
		 * @param {Number} height
		 */
		proto.setHeight = function (height) {
			OkCancelDialog.superClass.setHeight.call(this, height);
			this._buttons.setY(this.getHeight() - 60);
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
			return this._buttons.keyHandler(key);
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.OkCancelDialog = OkCancelDialog;
		return OkCancelDialog;
	}
);