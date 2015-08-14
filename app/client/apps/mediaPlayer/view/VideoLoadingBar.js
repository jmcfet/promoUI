/**
 * @class $N.gui.VideoLoadingBar
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = $N || {};
(function ($N) {
	var VideoLoadingBar = function (docRef, parent) {
		VideoLoadingBar.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("MediaPlayer", "VideoLoadingBar");

		this._radialGradientCentre = new $N.gui.BackgroundBox(this._docRef, this._additionalGradientGroup);
		this._radialGradientLeft = new $N.gui.BackgroundBox(this._docRef, this._additionalGradientGroup);
		this._radialGradientRight = new $N.gui.BackgroundBox(this._docRef, this._additionalGradientGroup);

		this._barGroup.configure({
			y: 301.5
		});
		this._basicGradientTop.configure({
			y: 112.5
		});
		this._basicGradientBottom.configure({
			y: 349.5
		});
		this._solidLineTop.configure({
			y: 151.5
		});
		this._solidLineBottom.configure({
			y: 348
		});
		this._barBackground.configure({
			height: 193.5
		});
		this._text.configure({
			y: 223,
			cssClass: "videoLoadingBarText"
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(VideoLoadingBar, $N.gui.LoadingBar);

	$N.gui.VideoLoadingBar = VideoLoadingBar;
}($N || {}));