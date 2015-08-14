/**
 * MessageDialog is used to display a message overlay
 *
 * @class MessageDialog
 * @extends GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = $N || {};
$N.gui = $N.gui || {};

(function ($N) {
	var MessageDialog = function (docRef, parent) {
		this._log = new $N.apps.core.Log("CommonGUI", "MessageDialog");
		MessageDialog.superConstructor.call(this, docRef);

		this._blackUI = true;

		this._container = new $N.gui.Group(docRef);
		this._background = new $N.gui.BackgroundBox(this._docRef, this._container);
		this._barGroup = new $N.gui.Group(this._docRef, this._container);
		this._basicGradientTop = new $N.gui.BackgroundBox(this._docRef, this._barGroup);
		this._basicGradientBottom = new $N.gui.BackgroundBox(this._docRef, this._barGroup);
		this._solidLineTop = new $N.gui.BackgroundBox(this._docRef, this._barGroup);
		this._solidLineBottom = new $N.gui.BackgroundBox(this._docRef, this._barGroup);
		this._radialGradient = new $N.gui.BackgroundBox(this._docRef, this._barGroup);
		this._barBackground = new $N.gui.BackgroundBox(this._docRef, this._barGroup);
		this._text = new $N.gui.Label(this._docRef, this._barGroup);

		this._background.configure({
			x: 0,
			y: 0,
			width: 1920,
			height: 1080,
			cssClass: "nowDialogBackground"
		});

		this._barGroup.configure({
			x: 0,
			y: 337.5,
			width: 1920
		});
		this._basicGradientTop.configure({
			x: 0,
			y: 76.5,
			width: 1920,
			height: 39,
			cssClass: "nowFullAssetUniformGradient"
		});
		this._basicGradientBottom.configure({
			x: 0,
			y: 315,
			width: 1920,
			height: 39,
			cssClass: "nowFullAssetUniformGradientInvert"
		});
		this._solidLineTop.configure({
			x: 0,
			y: 115.5,
			width: 1920,
			height: 4.5,
			cssClass: "loadingBarSolidDivider"
		});
		this._solidLineBottom.configure({
			x: 0,
			y: 310.5,
			width: 1920,
			height: 4.5,
			cssClass: "loadingBarSolidDivider"
		});
		this._radialGradient.configure({
			x: 0,
			y: -33,
			width: 1920,
			height: 463.5,
			cssClass: "radialGradientBackground"
		});
		this._barBackground.configure({
			x: 0,
			y: 120,
			width: 1920,
			height: 190.5,
			cssClass: "blackFill"
		});
		this._text.configure({
			x: 0,
			y: 195,
			cssClass: "messageDialogText center"
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(MessageDialog, $N.gui.GUIObject);

	/**
	 * @method setMessage
	 * @param {String} message
	 */
	MessageDialog.prototype.setMessage = function (message) {
		if (message) {
			this._text.setText(message);
			this.show();
		} else {
			this.hide();
		}
	};

	/**
	 * @method setBlockUI
	 * @param {Boolean} message
	 */
	MessageDialog.prototype.setBlockUI = function (value) {
		this._blackUI = value;
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	MessageDialog.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		this._log("keyHandler", "Exit");
		return this._blackUI;
	};

	$N.gui.MessageDialog = MessageDialog;
}($N || {}));