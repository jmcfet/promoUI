/**
 * NowMySubscriptions is a component designed for use in the NOW pane system.
 * It contains a pageble list used to display rented assets or subscribed catalogues
 * @class $N.gui.NowMySubscriptions
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowMySubscriptions = function (docRef, parent) {
		NowMySubscriptions.superConstructor.call(this, docRef);
		$N.apps.core.Language.importLanguageBundleForObject(NowMySubscriptions, null, "apps/now/common/", "LanguageBundle.js", null, window);

		this._data = [];
		this._itemSelectedCallback = function () {};

		this._container = new $N.gui.Group(this._docRef);
		this._content = new $N.gui.Group(this._docRef, this._container);
		this._list = new $N.gui.PageableListWithArrows(this._docRef, this._content);
		this._okIcon = new $N.gui.Image(this._docRef, this._content);
		this._subscriptionMoreInfoLabel = new $N.gui.Label(this._docRef, this._content);
		this._itemCount = new $N.gui.Label(this._docRef, this._content);

		this._emptyMessageGroup = new $N.gui.Group(this._docRef, this._container);
		this._emptyRentalsMessage = new $N.gui.TextArea(this._docRef, this._emptyMessageGroup);

		var me = this;
		this._list.configure({
			x: 3,
			y: 18,
			itemHeight: 61.5,
			itemTemplate: $N.gui.NowMySubscriptionsMenuItem,
			visibleItemCount: 9,
			dataMapper: $N.app.MDSUtil.productDataMapper,
			itemHighlightedCallback: function (data) {

			},
			itemSelectedCallback: function (data) {
				$N.app.MDSUtil.clearRequest();
				me._itemSelectedCallback(data);
			},
			upArrowProperties: {
				x: 1644,
				y: -37.5
			},
			downArrowProperties: {
				x: 1644,
				y: 558
			}
		});
		this._list.initialise();
		this._okIcon.configure({
			x: 28.5,
			y: 592.5,
			href: "../../../customise/resources/images/%RES/icons/botao_ok_azul.png"
		});
		this._subscriptionMoreInfoLabel.configure({
			x: 76.5,
			y: 591,
			cssClass: "nowAssetInfoMoreLabel",
			visible: false
		});
		this._itemCount.configure({
			x: 1374,
			y: 591,
			cssClass: "nowAssetInfoMoreLabel"
		});
		this._emptyRentalsMessage.configure({
			x: 120,
			y: 100.5,
			width: 990,
			height: 300,
			cssClass: "nowMySubscriptionsItemText",
			visible: true
		});
		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowMySubscriptions, $N.gui.GUIObject);

	/**
	 * @method setEmptyRentalsText
	 * @param {String} emptyText
	 */
	NowMySubscriptions.prototype.setEmptyRentalsText = function (emptyText) {
		this._emptyRentalsMessage.setText(emptyText);
	};

	/**
	 * @method setSubscriptionMoreInfoText
	 * @param {String} subscriptionMoreInfoText
	 */
	NowMySubscriptions.prototype.setSubscriptionMoreInfoText = function (subscriptionMoreInfoText) {
		this._subscriptionMoreInfoLabel.setText(subscriptionMoreInfoText);
	};

	/**
	 * @method setData
	 * @param {Object} data
	 */
	NowMySubscriptions.prototype.setData = function (data) {
		var contentType = data.dataType;
		this._data = data.assets;

		this._list.setData(this._data);

		// TODO : remove this when adding button press
		this._subscriptionMoreInfoLabel.hide();
		this._okIcon.hide();

		this._itemCount.setText(this._data.length + " " + NowMySubscriptions.getString("textSubscriptions"));
	};

	/**
	 * @method displayData
	 * @param {Boolean} preview
	 * @param {Boolean} avoidHighlight
	 */
	NowMySubscriptions.prototype.displayData = function (preview, avoidHighlight) {
		if (this._list.isEmpty()) {
			this._content.hide();
			this._emptyMessageGroup.show();
		} else {
			this._emptyMessageGroup.hide();
			this._list.displayData(preview, avoidHighlight);
			this._content.show();
		}
	};

	/**
	 * @method setItemSelectedCallback
	 * @param {Function} callback
	 */
	NowMySubscriptions.prototype.setItemSelectedCallback = function (callback) {
		this._itemSelectedCallback = callback;
	};

	/**
	 * @method focus
	 */
	NowMySubscriptions.prototype.focus = function () {
		var me = this;
		this._list.focus();
		$N.platform.ca.ParentalControl.setUserChangedCallback(function () {
			me._list.setData(me._data);
			me._list.displayData();
		});
	};

	/**
	 * @method defocus
	 */
	NowMySubscriptions.prototype.defocus = function () {
		this._list.defocus();
		$N.platform.ca.ParentalControl.setUserChangedCallback(function () {});
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 * @return {bool} handled
	 */
	NowMySubscriptions.prototype.keyHandler = function (key) {
		if (!this._list.isEmpty()) {
			return this._list.keyHandler(key);
		}
		return false;
	};

	$N.gui.NowMySubscriptions = NowMySubscriptions;
}($N || {}));
