/**
 * @class $N.gui.NowClubeInfo
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowClubeInfo = function (docRef, parent) {
		NowClubeInfo.superConstructor.call(this, docRef);
		$N.apps.core.Language.importLanguageBundleForObject(NowClubeInfo, null, "apps/now/common/", "LanguageBundle.js", null, window);

		this._data = null;
		this._dataMapper = {};

		this._container = new $N.gui.Container(this._docRef);
		this._title = new $N.gui.Label(this._docRef, this._container);
		this._prompt = new $N.gui.Label(this._docRef, this._container);
		this._synopsis = new $N.gui.TextArea(this._docRef, this._container);

		this._labelContainer = new $N.gui.Container(this._docRef, this._container);
		this._browseIcon = new $N.gui.MaskIcon(this._docRef, this._labelContainer);
		this._browseLabel = new $N.gui.Label(this._docRef, this._labelContainer);
		this._okIcon = new $N.gui.Image(this._docRef, this._labelContainer);
		this._subscribeLabel = new $N.gui.Label(this._docRef, this._labelContainer);

		this._title.configure({
			width: 620,
			cssClass: "medium large ellipsis relative nowClubeAssetTitle"
		});
		this._prompt.configure({
			cssClass: "normal ellipsis relative nowClubeAssetPrompt"
		});
		this._synopsis.configure({
			width: 620,
			maxLines: 8,
			cssClass: "normal ellipsis relative nowClubeAssetSynopsis"
		});

		this._labelContainer.configure({
			cssClass: "relative nowClubeAssetInfoLabels"
		});
		this._browseIcon.configure({
			x: 9,
			cssClass: "nowClubeAssetInfoMoreLabel",
			width: 18,
			height: 30,
			href: "../../../customise/resources/images/icons/arrows/rightArrowIcon.png",
			color: "#2c688f"
		});
		this._browseLabel.configure({
			x: 46.5,
			cssClass: "relative tiny nowClubeAssetInfoMoreLabel"
		});
		this._okIcon.configure({
			href: "../../../customise/resources/images/%RES/icons/botao_ok_azul.png",
			cssClass: "nowClubeAssetInfoMoreLabel",
			visible: false
		});
		this._subscribeLabel.configure({
			x: 46.5,
			cssClass: "relative tiny nowClubeAssetInfoMoreLabel",
			visible: false
		});

		this._traxisProductUpdatedListenerId = $N.apps.util.EventManager.subscribe("traxisProductsUpdated", this.traxisProductUpdatedListener, this);

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowClubeInfo, $N.gui.GUIObject);

	/**
	 * @method traxisProductUpdatedListener
	 * @param {Object} productData
	 */
	NowClubeInfo.prototype.traxisProductUpdatedListener = function (productData) {
		var productId = productData.data.productId;
		if (this._data && (this._dataMapper.getProductId(this._data) === productId)) {
			this._okIcon.hide();
			this._subscribeLabel.hide();
			if (this._dataMapper.getEntitlementId(this._data)) {
				this._prompt.setText(NowClubeInfo.getString("currentlySubscribed"));
			} else {
				this._prompt.setText(this._dataMapper.getPriceText(this._data, true, true));
				this._okIcon.show();
				this._subscribeLabel.setText(NowClubeInfo.getString("menuSubscribe").toLowerCase());
				this._subscribeLabel.show();
			}
		}
	};

	/**
	 * @method setData
	 * @param {Object} dataMapper
	 */
	NowClubeInfo.prototype.setDataMapper = function (dataMapper) {
		this._dataMapper = dataMapper;
	};

	/**
	 * @method setData
	 * @param {Object} data
	 */
	NowClubeInfo.prototype.update = function (data) {
		$N.app.TraxisUtil.updateProductDetails(this._dataMapper.getProductId(data), data);
		this._data = data;
		this._title.setText(this._dataMapper.getTitle(data));
		this._okIcon.hide();
		this._subscribeLabel.hide();
		if (this._dataMapper.getEntitlementId(data)) {
			this._prompt.setText(NowClubeInfo.getString("currentlySubscribed"));
		} else if (data.price) {
			this._prompt.setText(this._dataMapper.getPriceText(data, true, true));
			this._okIcon.show();
			this._subscribeLabel.setText(NowClubeInfo.getString("menuSubscribe").toLowerCase());
			this._subscribeLabel.show();
		} else {
			this._prompt.setText("");
		}
		this._synopsis.setText(this._dataMapper.getDescription(data));
		this._browseLabel.setText(NowClubeInfo.getString("browse"));
	};

	$N.gui.NowClubeInfo = NowClubeInfo;
}($N || {}));