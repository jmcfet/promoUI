/**
 * NowEmptyPane is a component designed for use in the NOW pane system.
 * It contains a pageble list used to display rented assets or subscribed catalogues
 * @class $N.gui.NowEmptyPane
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowEmptyPane = function (docRef, parent) {
		NowEmptyPane.superConstructor.call(this, docRef);
		$N.apps.core.Language.importLanguageBundleForObject(NowEmptyPane, null, "apps/now/common/", "LanguageBundle.js", null, window);

		this._container = new $N.gui.Group(this._docRef);
		this._message = new $N.gui.TextArea(this._docRef, this._container);

		this._message.configure({
			x: 120,
			y: 100.5,
			width: 990,
			height: 300,
			cssClass: "nowMyContentItemText"
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowEmptyPane, $N.gui.GUIObject);



	/**
	 * @method setMessage
	 * @param {String} message
	 */
	NowEmptyPane.prototype.setMessage = function (message) {
		this._message.setText(message);
	};

	/**
	 * @method setData
	 * @param {Object} data
	 */
	NowEmptyPane.prototype.setData = function (data) {
		// do nothing
	};

	/**
	 * @method displayData
	 * @param {Boolean} preview
	 * @param {Boolean} avoidHighlight
	 */
	NowEmptyPane.prototype.displayData = function (preview, avoidHighlight) {
		// do nothing
	};

	/**
	 * @method focus
	 */
	NowEmptyPane.prototype.focus = function () {
		// do nothing
	};

	/**
	 * @method defocus
	 */
	NowEmptyPane.prototype.defocus = function () {
		// do nothing
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 * @return {bool} handled
	 */
	NowEmptyPane.prototype.keyHandler = function (key) {
		return false;
	};

	$N.gui.NowEmptyPane = NowEmptyPane;
}($N || {}));