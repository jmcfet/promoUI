/**
 * A graphical representation of a dialog that can be used to display
 * a message on screen with a title and ok button. This class acts as
 * an example of how a dialog can be created, it may not necessarily be
 * used in this form but is by default used in the SDK's DialogManager
 * @class $N.gui.MessageDialog
 * @extends $N.gui.AbstractDialog
 *
 * @requires $N.gui.AbstractDialog
 * @requires $N.gui.Button
 * @requires $N.gui.Util
 *
 * @author mbrown
 * @constructor
 * @param {Object} docRef document element of the page
 * @param {Object} parent the gui object this should be added to
 */

define('jsfw/gui/GUIObjects/Controls/dialogs/MessageDialog',
    [
    'jsfw/gui/GUIObjects/Controls/dialogs/AbstractDialog',
    'jsfw/gui/GUIObjects/Controls/Button',
    'jsfw/gui/helpers/Util'
    ],
    function (AbstractDialog, Button, Util) {

		function MessageDialog(docRef, parent) {

				this._button = new $N.gui.Button(docRef);

				MessageDialog.superConstructor.call(this, docRef);

				this._container.addChild(this._button);
				this._button.highlight();

				if (parent) {
					parent.addChild(this);
				}
		}

		$N.gui.Util.extend(MessageDialog, $N.gui.AbstractDialog);

		var proto = MessageDialog.prototype;

		/**
		 * Sets the text to be displayed on the dialog ok button
		 * @method setButtonText
		 * @param {String} text
		 */
		proto.setButtonText = function (text) {
			this._button.setLabel(text);
		};

		/**
		 * Overrides the superclass setWidth method to also reposition
		 * the ok button
		 * @method setWidth
		 * @param {Number} width
		 */
		proto.setWidth = function (width) {
			MessageDialog.superClass.setWidth.call(this, width);
			this._button.setX(this.getWidth() - this._button.getWidth() - 20);
		};

		/**
		 * Overrides the superclass setHeight method to also reposition
		 * the ok button
		 * @method setHeight
		 * @param {Number} height
		 */
		proto.setHeight = function (height) {
			MessageDialog.superClass.setHeight.call(this, height);
			this._button.setY(this.getHeight() - this._button.getHeight() - 20);
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.MessageDialog = MessageDialog;
		return MessageDialog;
	}
);