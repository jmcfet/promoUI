/**
 * ChannelScanBox is a GUI component containing a menu and title
 * It is designed to be placed as a second/right box in the BoxMenu, but could be used separately
 *
 * @class ChannelScanBox
 * @extends GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	function ChannelScanBox(docRef, parent) {
		ChannelScanBox.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "ChannelScanBox");
		$N.apps.core.Language.importLanguageBundleForObject(ChannelScanBox, null, "apps/firstInstall/common/", "LanguageBundle.js", null, window);

		this._exitCallback = null;
		this._container = new $N.gui.Group(this._docRef);
		this._background = new $N.gui.Container(this._docRef, this._container);
		this._infoLabel = new $N.gui.Label(docRef, this._container);
		this._messageLabel = new $N.gui.Label(docRef, this._container);
		this._logo = new $N.gui.Image(docRef, this._container);

		this._width = 660;
		this._height = 576;

		this._container.configure({
			width: this._width,
			height: this._height
		});
		this._background.configure({
			width: this._width,
			height: this._height,
			cssClass: "menuBackgroundDefocus"
		});
		this._infoLabel.configure({
			x: 180,
			y: 300,
			cssClass: "dialogSubtitle"
		});
		this._messageLabel.configure({
			x: 0,
			y: 458,
			cssClass: "dialog_title_centre",
			text: ChannelScanBox.getString("channelScanMessage")
		});
		this._logo.configure({
			x: 208.5,
			y: 180,
			width: 243,
			height: 99,
			href: "../../../customise/resources/images/net/NET_logo.png"
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	}
	$N.gui.Util.extend(ChannelScanBox, $N.gui.GUIObject);

	/**
	 * @method initialise
	 */
	ChannelScanBox.prototype.initialise = function () {
		this._log("initialise", "Enter");
		this._strengthLabel.setText(ChannelScanBox.getString("signalStrength"));
		this._log("initialise", "Exit");
	};

	/**
	 * @method setScanUpdateInfo
	 * @param {String} value
	 */
	ChannelScanBox.prototype.setScanUpdateInfo = function (value) {
		this._log("_setData", "Enter");
		this._infoLabel.setText(value + " " + ChannelScanBox.getString("channelsFound"));
		this._log("_setData", "Exit");
	};

	/**
	 * @method setMessage
	 * @param {String} value
	 */
	ChannelScanBox.prototype.setMessage = function (value) {
		this._log("_setData", "Enter");
		this._messageLabel.setText(value);
		this._log("_setData", "Exit");
	};

	/**
	 * @method preview
	 * @param {Object} data
	 */
	ChannelScanBox.prototype.preview = function (data) {
		this._log("preview", "Enter");
		this.show();
		this._log("preview", "Exit");
	};

	/**
	 * @method activate
	 */
	ChannelScanBox.prototype.activate = function () {
		this._log("activate", "Enter");
		this._background.setCssClass("menuBackgroundFocus");
		this._infoLabel.setText("");
		this.setMessage(ChannelScanBox.getString("channelScanMessage"));
		this.show();
		this._log("activate", "Exit");
	};

	/**
	 * @method passivate
	 */
	ChannelScanBox.prototype.passivate = function () {
		this._log("passivate", "Enter");
		this.hide();
		this._background.setCssClass("menuBackgroundDefocus");
		this._log("passivate", "Exit");
	};

	/**
	 * @method setExitCallback
	 * @param {Object} callback
	 */
	ChannelScanBox.prototype.setExitCallback = function (callback) {
		this._log("setExitCallback", "Enter");
		this._exitCallback = callback;
		this._log("setExitCallback", "Exit");
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	ChannelScanBox.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;
		switch (key) {
		case keys.KEY_LEFT:
		case keys.KEY_BACK:
			handled = true;
			this.passivate();
			if (this._exitCallback) {
				this._exitCallback();
			}
			break;
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	$N.gui.ChannelScanBox = ChannelScanBox;
}($N || {}));