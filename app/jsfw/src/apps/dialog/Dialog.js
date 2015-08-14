/**
 * Super class of all dialogs managed by `$N.apps.dialog.DialogManager`. Functionality defined
 * in this class is responsible for showing and hiding the various dialog instances
 * as well as passing keys pressed by the user on to the dialog via the keyHandler.
 * Any custom dialogs that are written must conform to the the same interface defined
 * in this class for them to work with `$N.apps.dialog.DialogManager`.
 * @class $N.apps.dialog.Dialog
 * @requires $N.apps.core.Log
 * @constructor
 * @param {String} id unique name for the Dialog
 * @param {Boolean} modal set this to true if the dialog should steal all key presses
 */

define('jsfw/apps/dialog/Dialog',
    [
    	'jsfw/apps/core/Log',
    	'jsfw/apps/dialog/DialogManager',
    	'jsfw/apps/core/KeyInterceptor'
    ],
	function (Log, DialogManager, KeyInterceptor) {

		var log = new $N.apps.core.Log("dialog", "Dialog");

		function Dialog(id, modal) {
			this.id = id;
			this.lastKeyPress = null;
			this.visible = false;
			this.frozen = false;
			this.persist = false;
			this.modal = modal || false;
			this._dialogGUIObject = null;
		}

		var proto = Dialog.prototype;

		/**
		 * Configures the underlying GUI dialog instance to the given position
		 * defined by the x and / or y parameters. If not set, uses the DialogManager
		 * defaults if available. Also sets the width and height in the same
		 * manner.
		 * @method _positionAndSizeDialog
		 * @private
		 * @param {Object} x
		 * @param {Object} y
		 * @param {Object} width
		 * @param {Object} height
		 */
		proto._positionAndSizeDialog = function (x, y, width, height) {
			var paramObj = $N.apps.dialog.DialogManager.getDefaultDialogSizeAndPosition();
			var actualParamObj = {};
			var attrib;
			paramObj.x = (x !== null && x !== undefined) ? x : paramObj.x;
			paramObj.y = (y !== null && y !== undefined) ? y : paramObj.y;
			paramObj.width = width || paramObj.width;
			paramObj.height = height || paramObj.height;
			for (attrib in paramObj) {
				if (paramObj[attrib] !== null) {
					actualParamObj[attrib] = paramObj[attrib];
				}
			}
			this._dialogGUIObject.configure(actualParamObj);
		};

		/**
		*  Given a configuration object that has properties matching the GUI
		*  dialog instance's setter methods, will call those setter methods.
		*  @method customise
		*  @param {Object} configObj
		*/
		proto.customise = function (configObj) {
			if (this._dialogGUIObject) {
				this._dialogGUIObject.configure(configObj);
			}
		};

		/**
		 * Makes the dialog visible again if it has previously been frozen or
		 * if not been shown before. Injects the dialog markup into the document
		 * element, i.e. the last element in the document.
		 * @method show
		 */
		proto.show = function () {
			var dialogue_container;
			if (this.frozen) {
				this._dialogGUIObject.show();
			} else {
				if (document.body) { //HTML
					dialogue_container =  document.getElementById("_dialogues_");
					if (typeof (dialogue_container) === 'undefined' || dialogue_container === null) {
						dialogue_container = document.createElement("div");
						dialogue_container.id = "_dialogues_";
						dialogue_container.style.position = "absolute";
						dialogue_container.style.top = "0px";
						dialogue_container.style.left = "0px";
						document.body.appendChild(dialogue_container);
					}
					dialogue_container.appendChild(this._dialogGUIObject.getRootElement());
				} else { //SVG
					document.documentElement.appendChild(this._dialogGUIObject.getRootElement());
				}
				this._dialogGUIObject.show();
			}
		};

		/**
		 * Hides the dialog by removing the element from the DOM if it's
		 * finished with
		 * @method hide
		 * @param {Boolean} temporarily if true, the dialog is hidden temporarily (frozen)
		 */
		proto.hide = function (temporarily) {
			log("hide", "Dialog - Hiding - " + this.id);
			var svgRef = this._dialogGUIObject.getRootElement();
	        if (this.persist || temporarily) {
				this._dialogGUIObject.hide();
				this.frozen = true;
	        } else {
				if (svgRef.parentNode) {
					svgRef.parentNode.removeChild(svgRef);
				}
				this.frozen = false;
	        }
		    this.visible = false;
		};

		/**
		 * Default keyHandler for the Dialog can and should be overridden in the
		 * subclasses
		 * @method keyHandler
		 * @param {String} key key that was pressed
		 * @return {Boolean} True if the key press was handled; false otherwise
		 */
		proto.keyHandler = function (key) {
			var keys = $N.apps.core.KeyInterceptor.getKeyMap();
			if (this._dialogGUIObject.keyHandler(key)) {
				return true;
			}
			if (this.modal && (key === keys.KEY_LEFT || key === keys.KEY_RIGHT || key === keys.KEY_UP || key === keys.KEY_DOWN)) {
				return true;
			}
			return this.modal;
		};

		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.dialog = $N.apps.dialog || {};
		$N.apps.dialog.Dialog = Dialog;
		return Dialog;
	}
);
