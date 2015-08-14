/**
 * @class $N.gui.LoadingBar
 * @constructor
 * @extends $N.gui.GUIObject
 * @requires $N.gui.Group
 * @requires $N.gui.BackgroundBox
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @requires $N.app.LoadingTimeout
 * @param {Object} docRef
 * @param {Object} [parent]
 */
(function ($N) {
	var LoadingBar = function (docRef, parent) {
		this._log = new $N.apps.core.Log("CommonGUI", "LoadingBar");
		LoadingBar.superConstructor.call(this, docRef);

		this._loadingTimeout = $N.app.LoadingTimeout(this);

		this._container = new $N.gui.Group(docRef);
		this._background = new $N.gui.BackgroundBox(this._docRef, this._container);
		this._barGroup = new $N.gui.Group(this._docRef, this._container);
		this._basicGradientTop = new $N.gui.BackgroundBox(this._docRef, this._barGroup);
		this._basicGradientBottom = new $N.gui.BackgroundBox(this._docRef, this._barGroup);
		this._solidLineTop = new $N.gui.BackgroundBox(this._docRef, this._barGroup);
		this._solidLineBottom = new $N.gui.BackgroundBox(this._docRef, this._barGroup);
		this._additionalGradientGroup = new $N.gui.Group(this._docRef, this._barGroup);
		this._barBackground = new $N.gui.BackgroundBox(this._docRef, this._barGroup);
		this._text = new $N.gui.Label(this._docRef, this._barGroup);

		this._background.configure({
			x: 0,
			y: 0,
			width: 1920,
			height: 1080,
			cssClass: "loadingBarBackground"
		});

		this._barGroup.configure({
			x: 0,
			y: 337.5
		});
		this._basicGradientTop.configure({
			x: 0,
			y: 112.5,
			width: 1920,
			height: 39,
			cssClass: "nowFullAssetUniformGradient"
		});
		this._basicGradientBottom.configure({
			x: 0,
			y: 250.5,
			width: 1920,
			height: 39,
			cssClass: "nowFullAssetUniformGradientInvert"
		});
		this._solidLineTop.configure({
			x: 0,
			y: 151.5,
			width: 1920,
			height: 1.5,
			cssClass: "loadingBarSolidDivider"
		});
		this._solidLineBottom.configure({
			x: 0,
			y: 249,
			width: 1920,
			height: 1.5,
			cssClass: "loadingBarSolidDivider"
		});
		this._barBackground.configure({
			x: 0,
			y: 153,
			width: 1920,
			height: 95.5,
			cssClass: "barFill"
		});
		this._text.configure({
			x: 0,
			y: 180,
			width: 1920,
			cssClass: "loadingBarText"
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(LoadingBar, $N.gui.GUIObject);

	/**
	 * @method setCss
	 * @param {Object} configObject defining any number of css classes for the loading bar
	 */
	LoadingBar.prototype.setCss = function (configObject) {
		if (configObject) {
			if (configObject.backgroundClass) {
				this._background.setCssClass(configObject.backgroundClass);
			}
			if (configObject.basicGradientTopClass) {
				this._basicGradientTop.setCssClass(configObject.basicGradientTopClass);
			}
			if (configObject.basicGradientBottomClass) {
				this._basicGradientBottom.setCssClass(configObject.basicGradientBottomClass);
			}
			if (configObject.solidLineTopClass) {
				this._solidLineTop.setCssClass(configObject.solidLineTopClass);
			}
			if (configObject.solidLineBottomClass) {
				this._solidLineBottom.setCssClass(configObject.solidLineBottomClass);
			}
			if (configObject.barBackgroundClass) {
				this._barBackground.setCssClass(configObject.barBackgroundClass);
			}
			if (configObject.textClass) {
				this._text.setCssClass(configObject.textClass);
			}
		}
	};

	/**
	 * @method setText
	 * @param {String} text
	 */
	LoadingBar.prototype.setText = function (text) {
		this._text.setText(text);
	};


	/**
	 * @method setTextX
	 * @param {Number} newX
	 */
	LoadingBar.prototype.setTextX = function (newX) {
		this._text.setX(newX);
	};

	/**
	 * @method setLoading
	 * @param {Boolean} isLoading
	 */
	LoadingBar.prototype.setLoading = function (isLoading) {
		this._loadingTimeout.setLoading(isLoading);
	};

	$N.gui = $N.gui || {};
	$N.gui.LoadingBar = LoadingBar;
}($N || {}));