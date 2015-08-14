/**
 * @class $N.gui.NowLoading
 * @constructor
 * @extends $N.gui.GUIObject
 * @requires $N.app.LoadingTimeout
 * @param {Object} docRef
 * @param {Object} [parent]
 */
(function ($N) {
	var NowLoading = function (docRef, parent) {
		this._log = new $N.apps.core.Log("CommonGUI", "LoadingBar");
		NowLoading.superConstructor.call(this, docRef);

		this._loadingTimeout = $N.app.LoadingTimeout(this);
		this._container = new $N.gui.Group(docRef);
		this._background = new $N.gui.BackgroundBox(this._docRef, this._container);
		this._text = new $N.gui.TextArea(this._docRef, this._container);
		this._background.setRounding(12);

		this._container.configure({
			x: 755,
			y: 500,
			width: 400,
			height: 75
		});

		this._background.configure({
			x: 0,
			y: 0,
			width: 400,
			height: 75,
			cssClass: "nowLoadingBackground"
		});

		this._text.configure({
			x: 0,
			y: 15,
			width: 400,
			height: 40,
			cssClass: "nowLoadingText"
		});

		this._loadingTimeout._revealDelay = 500;

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowLoading, $N.gui.GUIObject);

	/**
	 * @method setText
	 * @param {String} text
	 */
	NowLoading.prototype.setText = function (text) {
		this._text.setText(text);
	};


	/**
	 * @method setTextX
	 * @param {Number} newX
	 */
	NowLoading.prototype.setTextX = function (newX) {
		this._text.setX(newX);
	};

	/**
	 * @method setLoading
	 * @param {Boolean} isLoading
	 */
	NowLoading.prototype.setLoading = function (isLoading) {
		this._loadingTimeout.setLoading(isLoading);
	};

	$N.gui = $N.gui || {};
	$N.gui.NowLoading = NowLoading;
}($N || {}));