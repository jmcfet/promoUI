/**
 * @author gstacey
 * @class ReminderDialog
 */

/*global GlobalKeysInterceptor*/

var $N = $N || {};

(function ($N) {

	function ReminderDialog(docRef, parent) {

		ReminderDialog.superConstructor.call(this, docRef);

		// gui elements
		this._dialogueTypeLabel = new $N.gui.Label(docRef, this._container);
		this._dialogueTypeLabelSubText = new $N.gui.Label(docRef, this._container);
		this._reminderTitle = new $N.gui.TextArea(docRef, this._container);
		this._description = new $N.gui.TextArea(docRef, this._container);

		this._dialogueTypeLabel.configure({
			width: 255,
			x: 275,
			y: 70,
			cssClass: "dialogueTypeLabel"
		});
		this._dialogueTypeLabelSubText.configure({
			width: 255,
			x: 275,
			y: 120,
			cssClass: "dialogueTypeLabelSubText"
		});
		this._reminderTitle.configure({
			y: 13,
			x: 327.5,
			width: 680,
			height: 140,
			cssClass: "dialogTitle"
		});
		this._description.configure({
			y: 180,
			x: 327.5,
			width: 700,
			height: 140,
			cssClass: "dialogMessage"
		});

		this._menu.setY(100);
		this.setWidth(680);
		this.setHeight(300);
		this._container.addChild(this._dialogueTypeLabel);
		this._container.addChild(this._dialogueTypeLabelSubText);
		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(ReminderDialog, $N.gui.ConfirmationDialog);

	var proto = ReminderDialog.prototype;

	/**
	 * Checks if exit is pressed and if so simulates the user selecting the dont tune option
	 * If exit isnt pressed then passes the key onto the ConfirmationDialog class to handle
	 * @method keyHandler
	 * @param {String} key
	 * @return {Boolean} True if key was handled, false otherwise.
	 */
	proto.keyHandler = function (key) {
		var keys = $N.apps.core.KeyInterceptor.getKeyMap();

		switch (key) {
		// keys we want to handle after dismissing the dialogue
		case keys.KEY_POWER:
			GlobalKeysInterceptor.keyHandler(key);
			return true;

		// keys that close the dialogue
		case keys.KEY_EXIT:
			this._menu.selectItemAtIndex(3);
			this._menu.keyHandler(keys.KEY_OK);
			return true;

		default:
			return ReminderDialog.superClass.keyHandler.call(this, key);
		}
	};

	/**
	 * Selects the default item in the confirmation dialog
	 * @method selectDefaultItem
	 */
	proto.selectDefaultItem = function () {
		this._menu.selectItemAtIndex(1, true);
	};


	/**
	 * Sets the dialog type label
	 * @method setDialogueTypeLabel
	 * @param {String} text
	 */
	proto.setDialogueTypeLabel = function (string) {
		var textArray = string.split(' '),
			SPLIT_STRING_IF_OVER = 1;
		if (textArray.length > SPLIT_STRING_IF_OVER) {
			this._dialogueTypeLabel.setText(textArray.shift());
			this._dialogueTypeLabelSubText.setText(textArray.join(' '));
		} else {
			this._dialogueTypeLabel.setText(string);
			this._dialogueTypeLabelSubText.setText('');
		}
	};

	/**
	 * Sets the title for the dialog to the given text
	 * @method setTitle
	 * @param {String} text
	 */
	proto.setTitle = function (text) {
		this._reminderTitle.setText(text);
	};

	/**
	 * Sets the description for the dialog to the given text
	 * @method setDescription
	 * @param {String} text
	 */
	proto.setDescription = function (text) {
		this._description.setText(text);
	};

	$N.gui = $N.gui || {};
	$N.gui.ReminderDialog = ReminderDialog;
}($N || {}));

var ReminderDialog = $N.gui.ReminderDialog;
