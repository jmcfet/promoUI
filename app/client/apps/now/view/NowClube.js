/**
 * @class $N.gui.NowClube
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowClube = function (docRef, parent) {
		NowClube.superConstructor.call(this, docRef);
		$N.apps.core.Language.importLanguageBundleForObject(NowClube, null, "apps/now/common/", "LanguageBundle.js", null, window);

		this._itemSelectedCallback = function () {};

		this._container = new $N.gui.Group(this._docRef);
		this._gallery = new $N.gui.PageableMosaic(this._docRef, this._container);
		this._detailsGroup = new $N.gui.Group(this._docRef, this._container);
		this._upArrow = new $N.gui.MaskIcon(this._docRef, this._detailsGroup);
		this._downArrow = new $N.gui.MaskIcon(this._docRef, this._detailsGroup);
		this._assetInfo = new $N.gui.NowClubeInfo(this._docRef, this._detailsGroup);

		var me = this;
		this._container.configure({
			x: -193
		});
		this._gallery.configure({
			x: 0,
			y: -62,
			width: 457.5,
			height: 630,
			columns: 1,
			rows: 3,
			itemTemplate: $N.gui.NowClubeItem,
			dataMapper: $N.app.MDSUtil.assetDataMapper,
			listPagedCallback: function () {
				me._upArrow.setVisible(!me._gallery.isAtFirstPage());
				me._downArrow.setVisible(!me._gallery.isAtLastPage());
			},
			itemHighlightedImmediateCallback: function (data) {
				$N.app.MDSUtil.clearRequest();
				me._assetInfo.update(data);
			},
			itemSelectedCallback: function (data) {
				var ticketId = $N.app.MDSUtil.assetDataMapper.getTicketId(data);
				$N.app.MDSUtil.clearRequest();
				if (ticketId && !$N.app.MDSUtil.assetDataMapper.getEntitlementId(data)) {
					$N.app.NowPlayback.purchaseProduct(data, ticketId, function () {
						$N.app.TraxisUtil.updateProductDetails($N.app.MDSUtil.assetDataMapper.getProductId(data), data);
					}, true);
				} else {
					me._itemSelectedCallback(data);
				}
			}
		});
		this._gallery.initialise();
		this._upArrow.configure({
			x: 439.5,
			y: -54,
			width: 30,
			height: 18,
			href: "../../../customise/resources/images/icons/arrows/upArrowIcon.png",
			color: "#fff"
		});
		this._downArrow.configure({
			x: 439.5,
			y: 619.5,
			width: 30,
			height: 18,
			href: "../../../customise/resources/images/icons/arrows/downArrowIcon.png",
			color: "#fff"
		});

		this._assetInfo.configure({
			x: 725,
			y: -10.5,
			dataMapper: $N.app.MDSUtil.assetDataMapper
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowClube, $N.gui.GUIObject);

	/**
	 * @method selectRowByValidation
	 * @param {Function} validationFunction
	 */
	NowClube.prototype.selectRowByValidation = function (validationFunction) {
		this._gallery.selectRowByValidation(validationFunction);
	};

	/**
	 * @method setItemSelectedCallback
	 * @param {Function} callback
	 */
	NowClube.prototype.setItemSelectedCallback = function (callback) {
		this._itemSelectedCallback = callback;
	};

	/**
	 * @method setData
	 * @param {Object} data
	 */
	NowClube.prototype.setData = function (data) {
		this._gallery.setData(data);
	};

	/**
	 * @method getSelectedItem
	 * @return {Object}
	 */
	NowClube.prototype.getSelectedItem = function () {
		return this._gallery.getSelectedItem();
	};

	/**
	 * @method displayData
	 * @param {Boolean} (optional) preview
	 * @param {Boolean} (optional) avoidHighlight
	 */
	NowClube.prototype.displayData = function (preview, avoidHighlight) {
		this._gallery.displayData(preview, avoidHighlight);
		this._upArrow.setVisible(!this._gallery.isAtFirstPage());
		this._downArrow.setVisible(!this._gallery.isAtLastPage());
	};

	/**
	 * @method select
	 */
	NowClube.prototype.select = function () {
		this._gallery.select();
	};

	/**
	 * @method focus
	 */
	NowClube.prototype.focus = function () {
		this._detailsGroup.show();
		this._gallery.focus();
	};

	/**
	 * @method defocus
	 */
	NowClube.prototype.defocus = function () {
		this._gallery.defocus();
		this._detailsGroup.hide();
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 * @return {bool} handled
	 */
	NowClube.prototype.keyHandler = function (key) {
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = this._gallery.keyHandler(key);
		if (!handled && (key === keys.KEY_RIGHT)) {
			this._itemSelectedCallback(this.getSelectedItem());
		}
		return handled;
	};

	$N.gui.NowClube = NowClube;
}($N || {}));