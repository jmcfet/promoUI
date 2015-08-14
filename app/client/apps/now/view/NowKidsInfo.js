/**
 * @class NowKidsInfo
 * @extends GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowKidsInfo = function (docRef, parent) {
		NowKidsInfo.superConstructor.call(this, docRef);
		$N.apps.core.Language.importLanguageBundleForObject(NowKidsInfo, null, "apps/now/common/", "LanguageBundle.js", null, window);

		this._data = null;
		this._dataMapper = {};

		this._container = new $N.gui.Group(this._docRef);
		this._title = new $N.gui.Label(this._docRef, this._container);
		this._prompt = new $N.gui.Label(this._docRef, this._container);
		this._synopsis = new $N.gui.TextArea(this._docRef, this._container);
		this._labelContainer = new $N.gui.Group(this._docRef, this._container);
		this._browseIcon = new $N.gui.MaskIcon(this._docRef, this._labelContainer);
		this._browseLabel = new $N.gui.Label(this._docRef, this._labelContainer);
		this._okIcon = new $N.gui.Image(this._docRef, this._labelContainer);
		this._subscribeLabel = new $N.gui.Label(this._docRef, this._labelContainer);

		this._title.configure({
			x: 0,
			y: 43.5,
			width: 620,
			cssClass: "nowAssetInfoTitle"
		});
		this._prompt.configure({
			x: 0,
			y: 109.5,
			cssClass: "nowAssetInfoMisc"
		});
		this._synopsis.configure({
			x: 0,
			y: 148.5,
			width: 620,
			maxHeight: 388.5,
			cssClass: "nowAssetInfoMisc"
		});
		this._labelContainer.configure({
			x: 0,
			y: 564
		});
		this._browseIcon.configure({
			x: 9,
			width: 18,
			height: 30,
			href: "../../../customise/resources/images/icons/arrows/rightArrowIcon.png",
			color: "#2c688f"
		});
		this._browseLabel.configure({
			x: 46.5,
			y: 28.5,
			cssClass: "nowAssetInfoMoreLabel"
		});
		this._okIcon.configure({
			y: 51,
			href: "../../../customise/resources/images/%RES/icons/botao_ok_azul.png",
			visible: false
		});
		this._subscribeLabel.configure({
			x: 46.5,
			y: 79.5,
			cssClass: "nowAssetInfoMoreLabel",
			visible: false
		});

		this._traxisProductUpdatedListenerId = $N.apps.util.EventManager.subscribe("traxisProductsUpdated", this.traxisProductUpdatedListener, this);

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowKidsInfo, $N.gui.GUIObject);

	/**
	 * @method traxisProductUpdatedListener
	 * @param {Object} productData
	 */
	NowKidsInfo.prototype.traxisProductUpdatedListener = function (productData) {
		var productId = productData.data.productId;
		if (this._data && (this._dataMapper.getProductId(this._data) === productId)) {
			this._okIcon.hide();
			this._subscribeLabel.hide();
			if (this._dataMapper.getEntitlementId(this._data)) {
				this._prompt.setText(NowKidsInfo.getString("currentlySubscribed"));
			} else {
				this._prompt.setText(this._dataMapper.getPriceText(this._data, true, true));
				this._okIcon.show();
				this._subscribeLabel.setText(NowKidsInfo.getString("menuSubscribe").toLowerCase());
				this._subscribeLabel.show();
			}
		}
	};

	/**
	 * @method setData
	 * @param {Object} dataMapper
	 */
	NowKidsInfo.prototype.setDataMapper = function (dataMapper) {
		this._dataMapper = dataMapper;
	};

	/**
	 * @method setData
	 * @param {Object} data
	 */
	NowKidsInfo.prototype.update = function (data) {
		$N.app.TraxisUtil.updateProductDetails(this._dataMapper.getProductId(data), data);
		this._data = data;
		this._title.setText(this._dataMapper.getTitle(data));
		this._okIcon.hide();
		this._subscribeLabel.hide();
		if (this._dataMapper.getEntitlementId(data)) {
			this._prompt.setText(NowKidsInfo.getString("currentlySubscribed"));
		} else if (data.price) {
			this._prompt.setText(this._dataMapper.getPriceText(data, true, true));
			this._okIcon.show();
			this._subscribeLabel.setText(NowKidsInfo.getString("menuSubscribe").toLowerCase());
			this._subscribeLabel.show();
		} else {
			this._prompt.setText("");
		}
		this._synopsis.setText(this._dataMapper.getDescription(data));
		this._browseLabel.setText(NowKidsInfo.getString("browse"));
		this._labelContainer.setY(this._synopsis.getTrueY() + this._synopsis.getTrueHeight() + 40.5);
	};

	$N.gui.NowKidsInfo = NowKidsInfo;
}($N || {}));