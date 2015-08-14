/**
 * @class N.gui.Brand
 * @constructor
 * @extends N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	var Brand = function (docRef, parent) {
		Brand.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "Brand");

		this._container = new $N.gui.Group(this._docRef);
		this._background = new $N.gui.Container(this._docRef, this._container);
		this._agoraGroup = new $N.gui.Group(this._docRef, this._container);
		this._agoraContainer = new $N.gui.Container(this._docRef, this._agoraGroup);
		this._guideBackgroundImage = new $N.gui.Image(this._docRef, this._container);
		this._mosaicGroup = new $N.gui.Group(this._docRef, this._container);
		this._mosaicBackgroundImage = new $N.gui.Image(this._docRef, this._mosaicGroup);
		this._mosaicContainerLeft = new $N.gui.Container(this._docRef, this._mosaicGroup);
		this._mosaicContainerBottom = new $N.gui.Container(this._docRef, this._mosaicGroup);
		this._mosaicContainerRight = new $N.gui.Container(this._docRef, this._mosaicGroup);
		this._musicBackgroundImage = new $N.gui.Image(this._docRef, this._container);
		this._searchGroup = new $N.gui.Group(this._docRef, this._container);
		this._searchBackgroundImage = new $N.gui.Image(this._docRef, this._searchGroup);
		this._searchContainer = new $N.gui.Container(this._docRef, this._searchGroup);
		this._searchVodGroup = new $N.gui.Group(this._docRef, this._container);
		this._searchVodContainer = new $N.gui.Container(this._docRef, this._searchVodGroup);
		this._searchVodStripe = new $N.gui.BackgroundBox(this._docRef, this._searchVodGroup);
		this._synopsisBackgroundGroup = new $N.gui.Group(this._docRef, this._container);
		this._synopsisBackground = new $N.gui.Container(this._docRef, this._synopsisBackgroundGroup);
		this._synopsisFadeGradientTop = new $N.gui.Container(this._docRef, this._synopsisBackgroundGroup);
		this._synopsisFadeGradientBottom = new $N.gui.Container(this._docRef, this._synopsisBackgroundGroup);
		this._logo = new $N.gui.Image(this._docRef, this._container);

		this._container.configure({
			x: 0,
			y: 0,
			visible: false
		});
		this._background.configure({
			x: 0,
			y: 0,
			width: 1920,
			height: 1080,
			cssClass: "fullScreenBackground",
			opacity: 0.9
		});
		this._agoraGroup.configure({
			x: 0,
			y: 0,
			visible: false
		});
		this._agoraContainer.configure({
			x: 0,
			y: 0,
			width: 1920,
			height: 1080,
			cssClass: "agoraBackground"
		});
		this._guideBackgroundImage.configure({
			x: 0,
			y: 0,
			width: 1920,
			height: 1080,
			href: "customise/resources/images/net/guideBackground.png",
			opacity: 0.95,
			bufferedImage: true,
			visible: false
		});
		this._mosaicGroup.configure({
			x: 0,
			y: 0,
			visible: false
		});
		this._mosaicBackgroundImage.configure({
			x: 0,
			y: 0,
			width: 1920,
			height: 286.5,
			cssClass: "mosaicBackground",
			href: "apps/mosaic/view/images/bg.png",
			bufferedImage: true
		});
		this._mosaicContainerLeft.configure({
			x: 0,
			y: 280.5,
			width: 1345.5,
			height: 780,
			cssClass: "mosaicBackground"
		});
		this._mosaicContainerBottom.configure({
			x: 1345.5,
			y: 561,
			width: 574.5,
			height: 510,
			cssClass: "mosaicBackground"
		});
		this._mosaicContainerRight.configure({
			x: 1834.5,
			y: 282,
			width: 94.5,
			height: 280.5,
			cssClass: "mosaicBackground"
		});
		this._musicBackgroundImage.configure({
			x: 0,
			y: 0,
			width: 1920,
			height: 1080,
			href: "customise/resources/images/logos/musica_fundo.png",
			bufferedImage: true,
			visible: false
		});
		this._logo.configure({
			x: 63,
			y: 70.5,
			width: 243,
			height: 99,
			href: "customise/resources/images/net/NET_logo.png",
			bufferedImage: true
		});
		this._synopsisBackgroundGroup.configure({
			x: 0,
			y: 0,
			width: 1920,
			height: 1080,
			opacity: 0.85,
			visible: false
		});
		this._synopsisBackground.configure({
			x: 0,
			y: 0,
			width: 1920,
			height: 1080,
			opacity: 0.85,
			cssClass: "fullScreenBackground"
		});
		this._synopsisFadeGradientTop.configure({
			x: 0,
			y: 0,
			width: 1920,
			height: 300,
			cssClass: "synopsisFadeGradientTop"
		});
		this._synopsisFadeGradientBottom.configure({
			x: 0,
			y: 780,
			width: 1920,
			height: 300,
			cssClass: "synopsisFadeGradientBottom"
		});
		this._searchGroup.configure({
			x: 0,
			y: 0,
			visible: false
		});
		this._searchBackgroundImage.configure({
			x: 0,
			y: 0,
			width: 1920,
			height: 300,
			cssClass: "searchBackground",
			href: "apps/search/view/images/bg.png",
			bufferedImage: true
		});
		this._searchContainer.configure({
			x: 0,
			y: 300,
			width: 1920,
			height: 780,
			cssClass: "searchBackground"
		});
		this._searchVodGroup.configure({
			visible: false
		});
		this._searchVodContainer.configure({
			width: 1920,
			height: 1080,
			cssClass: "blackFill"
		});
		this._searchVodStripe.configure({
			width: 1920,
			height: 7.5,
			cssClass: "nowColorStrip"
		});

		this._backgroundList = {};
		this._backgroundList[$N.app.BrandHelper.DEFAULT_BACKGROUND_ID] = this._background;
		this._backgroundList[$N.app.BrandHelper.AGORA_BACKGROUND_ID] = this._agoraGroup;
		this._backgroundList[$N.app.BrandHelper.GUIDE_BACKGROUND_ID] = this._guideBackgroundImage;
		this._backgroundList[$N.app.BrandHelper.MOSAIC_BACKGROUND_ID] = this._mosaicGroup;
		this._backgroundList[$N.app.BrandHelper.MUSIC_BACKGROUND_ID] = this._musicBackgroundImage;
		this._backgroundList[$N.app.BrandHelper.SYNOPSIS_BACKGROUND_ID] = this._synopsisBackgroundGroup;
		this._backgroundList[$N.app.BrandHelper.SEARCH_BACKGROUND_ID] = this._searchGroup;
		this._backgroundList[$N.app.BrandHelper.SEARCH_VOD_BACKGROUND_ID] = this._searchVodGroup;
		this._previousBackground = $N.app.BrandHelper.DEFAULT_BACKGROUND_ID;

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(Brand, $N.gui.GUIObject);

	/**
	 * @method hidePreviousBackground
	 */
	Brand.prototype.hidePreviousBackground = function () {
		this._backgroundList[this._previousBackground].hide();
		if (this._previousBackground === $N.app.BrandHelper.SYNOPSIS_BACKGROUND_ID || this._previousBackground === $N.app.BrandHelper.SEARCH_VOD_BACKGROUND_ID) {
			this._logo.show();
		}
	};

	/**
	 * @method show
	 * @param {Number} backgroundId
	 */
	Brand.prototype.show = function (backgroundId) {
		if (backgroundId !== this._previousBackground) {
			this.hidePreviousBackground();
			if (backgroundId === $N.app.BrandHelper.SYNOPSIS_BACKGROUND_ID || backgroundId === $N.app.BrandHelper.SEARCH_VOD_BACKGROUND_ID) {
				this._logo.hide();
			}
			this._backgroundList[backgroundId].show();
			this._previousBackground = backgroundId;
		}
		this._container.show();
	};

	/**
	 * @method hide
	 */
	Brand.prototype.hide = function () {
		this._container.hide();
	};

	$N.gui.Brand = Brand;
}($N || {}));
