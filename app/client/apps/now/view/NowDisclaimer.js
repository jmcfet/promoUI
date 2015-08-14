/**
 * NowDisclaimer is a simple component used to display the terms and conditions for NOW inside a scrolling text area
 *
 * @class $N.gui.NowDisclaimer
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowDisclaimer = function (docRef, parent) {
		this._log = new $N.apps.core.Log("NOW", "NowDisclaimer");
		NowDisclaimer.superConstructor.call(this, docRef);
		var me = this;
		$N.apps.core.Language.importLanguageBundleForObject(NowDisclaimer, null, "apps/now/common/", "LanguageBundle.js", function () {
			me._resetText();
		}, window);

		this.acceptCallback = function () {};

		this._container = new $N.gui.Group(docRef);
		this._background = new $N.gui.BackgroundBox(this._docRef, this._container);
		this._title = new $N.gui.Label(this._docRef, this._container);
		this._okIcon = new $N.gui.Image(this._docRef, this._container);
		this._okText = new $N.gui.Label(this._docRef, this._container);
		this._exitIcon = new $N.gui.Image(this._docRef, this._container);
		this._exitText = new $N.gui.Label(this._docRef, this._container);
		this._text = new $N.gui.TextArea(this._docRef, this._container);

		this._background.configure({
			width: 1920,
			height: 1080,
			cssClass: "blackFill"
		});
		this._title.configure({
			x: 370.5,
			y: 103.5,
			cssClass: "nowDisclaimerTitle"
		});
		this._okIcon.configure({
			x: 382.5,
			y: 963,
			href: "../../../customise/resources/images/%RES/icons/botao_ok_azul.png"
		});
		this._okText.configure({
			x: 432,
			y: 961.5,
			cssClass: "nowDisclaimerButtonText"
		});
		this._exitIcon.configure({
			x: 685.5,
			y: 963,
			href: "../../../customise/resources/images/%RES/icons/botao_misc_azul.png"
		});
		this._exitText.configure({
			x: 735,
			y: 961.5,
			cssClass: "nowDisclaimerButtonText"
		});
		this._text.configure({
			x: 372,
			y: 208.5,
			width: 1176,
			cssClass: "nowDisclaimerText"
		});
		this._resetText();

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowDisclaimer, $N.gui.GUIObject);

	/**
	 * @method _resetText
	 */
	NowDisclaimer.prototype._resetText = function () {
		this._title.setText(NowDisclaimer.getString("disclaimerTitle"));
		this._okText.setText(NowDisclaimer.getString("disclaimerContinue"));
		this._exitText.setText(NowDisclaimer.getString("textExit"));
		this._text.setText(NowDisclaimer.getString("disclaimerText"));
	};

	/**
	 * @method setAcceptCallback
	 * @param {Function} callback
	 */
	NowDisclaimer.prototype.setAcceptCallback = function (callback) {
		this.acceptCallback = callback;
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 * @return {bool} handled
	 */
	NowDisclaimer.prototype.keyHandler = function (key) {
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;

		switch (key) {
		case keys.KEY_OK:
			$N.platform.system.Preferences.set($N.app.constants.PREF_NOW_DISCLAIMER_ACCEPTED, "true");
			this.acceptCallback();
			handled = true;
			break;
		case keys.KEY_LEFT:
		case keys.KEY_RIGHT:
			handled = true;
			break;
		}
		return handled;
	};

	$N.gui.NowDisclaimer = NowDisclaimer;
}($N || {}));