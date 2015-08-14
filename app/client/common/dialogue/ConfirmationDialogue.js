/**
 * Concrete implementation of a Dialog that can be used to show a
 * message and offer a list of options to the user.
 * This class wraps both FullscreenConfirmationDialog and MinimisedConfirmationDialog,
 * depending on the minimised parameter.
 * @class ConfirmationDialogue
 * @constructor
 * @namespace $N.apps.dialog
 * @param {String} id Unique ID of the dialog
 * @param {String} title Title of the dialog
 * @param {String} messageText the text comprising the main body of the dialog
 * @param {Array} options An array of item objects to display in the list, each must have a name property.
 * @param {Function} callback Code to be executed when option is selected
 * @param {Function} highlightedImmediateCallback Code to be executed when option is highlighted
 * @param {Array} controls An array of GUI controls that should have a getHeight function.
 * @param {String} orientation Button layout, HORIZONTAL / VERTICAL
 * @param {String} titleImage used by PPV for event poster
 * @param {Object} guiTemplate Dialogue Template used by PPV, VOD etc to provide alternate GUI template
 *
 * @extends $N.apps.dialog.BaseDialog
 */
(function ($N) {

	function ConfirmationDialogue(id, title, messageText, options, callback, highlightedImmediateCallback, controls, orientation, titleImage, GUITemplate) {
		var me = this,
			DIALOGUE_TOP_LEFT_X = 0,
			DIALOGUE_TOP_LEFT_Y = 0,
			DIALOGUE_WIDTH_UNUSED = 1240,
			DIALOGUE_HEIGHT_UNUSED = 280;

		ConfirmationDialogue.superConstructor.call(this, id, true);
		if ((controls !== undefined) && (controls !== null) && (controls !== false)) {
			this._dialogGUIObject = new $N.gui.ConfirmationDialogWithControls(document, null, controls);
		} else if ((GUITemplate !== undefined) && (GUITemplate !== null) && (GUITemplate !== false)) {
			this._dialogGUIObject = new GUITemplate(document);
		} else {
			this._dialogGUIObject = new ConfirmationDialogue.GUITemplateObject(document);
		}
		if (orientation) {
			this._dialogGUIObject.setOrientation(orientation);
		}
		this._dialogGUIObject.setTitle(title);
		this._dialogGUIObject.setOptions(options);
		this._dialogGUIObject.setMessage(messageText);
		this._dialogGUIObject.setSelectedCallback(function (item) {
			$N.apps.dialog.DialogManager.hideDialog(me);
			if (callback) {
				callback(item);
			}
		});
		this._dialogGUIObject.setHighlightedCallback(function (item) {
			if (highlightedImmediateCallback) {
				highlightedImmediateCallback(item);
			}
		});
		this.setExitCallback = function (callback) {
			this._dialogGUIObject.setExitCallback(function (items, key) {
				$N.apps.dialog.DialogManager.hideDialog(me);
				callback(items, key);
			});
		};
		// in the following function, 0,0 sets the top-left of the dialogue. 725,280 is the size, but has little or no effect.
		this._positionAndSizeDialog(DIALOGUE_TOP_LEFT_X, DIALOGUE_TOP_LEFT_Y, DIALOGUE_WIDTH_UNUSED, DIALOGUE_HEIGHT_UNUSED);
		// Condition check added as some GUI template does not have setTitleImage method.
		if (this._dialogGUIObject.setTitleImage && titleImage) {
			this._dialogGUIObject.setTitleImage(titleImage);
		}
		this._dialogGUIObject.selectDefaultItem();
	}

	$N.apps.util.Util.extend(ConfirmationDialogue, $N.apps.dialog.BaseDialog);

	/**
	 * Set or replace the selected callback for the dialogue
	 * @method setSelectedCallback
	 * @param {Object} callback
	 */
	ConfirmationDialogue.prototype.setSelectedCallback = function (callback) {
		var me = this;

		this._dialogGUIObject.setSelectedCallback(function (item) {
			$N.apps.dialog.DialogManager.hideDialog(me);
			if (callback) {
				callback(item);
			}
		});
	};

	/**
	 * Set or replace the highlighted callback for the dialogue
	 * @method setHighlightedCallback
	 * @param {Function} callback
	 */
	ConfirmationDialogue.prototype.setHighlightedCallback = function (callback) {
		this._dialogGUIObject.setHighlightedCallback(function (item) {
			if (callback) {
				callback(item);
			}
		});
	};

	/**
	 * The ConfirmationDialogue GUI template, override for custom dialogs
	 * @property GUITemplateObject
	 * @type {Object}
	 */
	ConfirmationDialogue.GUITemplateObject = $N.gui.ConfirmationDialog;

	$N.apps.dialog = $N.apps.dialog || {};
	$N.apps.dialog.ConfirmationDialogue = ConfirmationDialogue;

}($N = $N || {}));
