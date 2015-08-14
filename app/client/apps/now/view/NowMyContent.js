/**
 * NowMyContent is a component designed for use in the NOW pane system.
 * It contains a pageble list used to display rented assets or subscribed catalogues
 * @class $N.gui.NowMyContent
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowMyContent = function (docRef, parent) {
		NowMyContent.superConstructor.call(this, docRef);
		$N.apps.core.Language.importLanguageBundleForObject(NowMyContent, null, "apps/now/common/", "LanguageBundle.js", null, window);

		this._data = [];
		this._itemSelectedCallback = function () {};
		this._favouriteRemovedSubscriptionId = null;
		this._contentType = null;

		this._container = new $N.gui.Group(this._docRef);
		this._content = new $N.gui.Group(this._docRef, this._container);
		this._list = new $N.gui.PageableListWithArrows(this._docRef, this._content);
		this._rentalExpiryTitle = new $N.gui.Label(this._docRef, this._content);
		this._assetExpiryTitle = new $N.gui.Label(this._docRef, this._content);
		this._okIcon = new $N.gui.Image(this._docRef, this._content);
		this._moreInfoLabel = new $N.gui.Label(this._docRef, this._content);
		this._itemCount = new $N.gui.Label(this._docRef, this._content);

		this._emptyMessageGroup = new $N.gui.Group(this._docRef, this._container);
		this._emptyRentalsMessage = new $N.gui.TextArea(this._docRef, this._emptyMessageGroup);
		this._emptyFavouritesMessage = new $N.gui.TextArea(this._docRef, this._emptyMessageGroup);

		this._favouritesInfo = new $N.gui.Group(this._docRef, this._content);
		this._ratingIcon = new $N.gui.Image(this._docRef, this._favouritesInfo);
		this._image = new $N.gui.FadingImage(this._docRef, this._favouritesInfo);
		this._flags = new $N.gui.AudioVideoFlags(this._docRef, this._favouritesInfo);

		var me = this;
		this._list.configure({
			x: 3,
			y: 18,
			itemHeight: 61.5,
			itemTemplate: $N.gui.NowMyContentMenuItem,
			visibleItemCount: 9,
			dataMapper: $N.app.MDSUtil.assetDataMapper,
			itemHighlightedCallback: function (data) {
				var href = $N.app.MDSUtil.assetDataMapper.getHref(data);
				me._ratingIcon.setHref($N.app.MDSUtil.assetDataMapper.getRatingIcon(data));
				me._image.setHref(href);
				me._flags.update($N.app.MDSUtil.assetDataMapper.getFlags(data));
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
		this._rentalExpiryTitle.configure({
			x: 1374,
			y: -37.5,
			cssClass: "nowAssetInfoSynopsis"
		});
		this._assetExpiryTitle.configure({
			x: 942,
			y: -37.5,
			cssClass: "nowAssetInfoSynopsis"
		});
		this._okIcon.configure({
			x: 28.5,
			y: 592.5,
			href: "../../../customise/resources/images/%RES/icons/botao_ok_azul.png"
		});
		this._moreInfoLabel.configure({
			x: 76.5,
			y: 591,
			cssClass: "nowAssetInfoMoreLabel"
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
			cssClass: "nowMyContentItemText",
			visible: false
		});
		this._emptyFavouritesMessage.configure({
			x: 120,
			y: 100.5,
			width: 990,
			height: 300,
			cssClass: "nowMyContentItemText",
			visible: false
		});

		this._ratingIcon.configure({
			x: 1708.5,
			y: -30
		});
		this._image.configure({
			x: 1380,
			y: 18,
			width: 364.5,
			height: 510,
			underImageConfig: {
				href: "../../../customise/resources/images/%RES/thumbnails/Icn_showCardTitle_large.png"
			}
		});
		this._flags.configure({
			x: 1380,
			y: 547.5
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowMyContent, $N.gui.GUIObject);

	/**
	 * @method setRentalExpiryText
	 * @param {String} expiryText
	 */
	NowMyContent.prototype.setRentalExpiryText = function (expiryText) {
		this._rentalExpiryTitle.setText(expiryText);
	};

	/**
	 * @method setAssetExpiryText
	 * @param {String} expiryText
	 */
	NowMyContent.prototype.setAssetExpiryText = function (expiryText) {
		this._assetExpiryTitle.setText(expiryText);
	};

	/**
	 * @method setEmptyRentalsText
	 * @param {String} emptyText
	 */
	NowMyContent.prototype.setEmptyRentalsText = function (emptyText) {
		this._emptyRentalsMessage.setText(emptyText);
	};

	/**
	 * @method setEmptyFavouritesText
	 * @param {String} emptyText
	 */
	NowMyContent.prototype.setEmptyFavouritesText = function (emptyText) {
		this._emptyFavouritesMessage.setText(emptyText);
	};

	/**
	 * @method setMoreInfoText
	 * @param {String} moreInfoText
	 */
	NowMyContent.prototype.setMoreInfoText = function (moreInfoText) {
		this._moreInfoLabel.setText(moreInfoText);
	};

	/**
	 * @method toggleInfoPane
	 * @param {Boolean} isInfoPaneVisible
	 */
	NowMyContent.prototype._toggleInfoPane = function (isInfoPaneVisible) {
		if (isInfoPaneVisible) {
			this._rentalExpiryTitle.hide();
			this._list.configure({
				upArrowProperties: {
					x: 1212
				},
				downArrowProperties: {
					x: 1212
				}
			});
			this._itemCount.setX(942);
			this._list.doForAllItems(function (listItem) {
				listItem.setWidth(1296);
			});
			this._favouritesInfo.show();
			this._assetExpiryTitle.show();
		} else {
			this._assetExpiryTitle.hide();
			this._favouritesInfo.hide();
			this._list.configure({
				upArrowProperties: {
					x: 1644
				},
				downArrowProperties: {
					x: 1644
				}
			});
			this._itemCount.setX(1374);
			this._list.doForAllItems(function (listItem) {
				listItem.setWidth(1728);
			});
			this._rentalExpiryTitle.show();
		}
	};

	/**
	 * @method setData
	 * @param {Object} data
	 */
	NowMyContent.prototype.setData = function (data) {
		this._contentType = data.dataType;
		this._data = data.assets;

		this._list.setData(this._data);
		if (this._contentType === "favourites") {
			this._toggleInfoPane(false);
			this._rentalExpiryTitle.hide();
			this._itemCount.setText(this._data.length + " " + NowMyContent.getString("textFavourites"));
			this._emptyRentalsMessage.hide();
			this._emptyFavouritesMessage.show();
		} else {
			this._toggleInfoPane(false);
			this._itemCount.setText(this._data.length + " " + NowMyContent.getString("textRentals"));
			this._emptyFavouritesMessage.hide();
			this._emptyRentalsMessage.show();
		}
		this._moreInfoLabel.show();
	};

	/**
	 * @method displayData
	 * @param {Boolean} preview
	 * @param {Boolean} avoidHighlight
	 */
	NowMyContent.prototype.displayData = function (preview, avoidHighlight) {
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
	NowMyContent.prototype.setItemSelectedCallback = function (callback) {
		this._itemSelectedCallback = callback;
	};

	/**
	 * @method _favouriteRemovedListener
	 * @param {Object} removedItem
	 */
	NowMyContent.prototype._favouriteRemovedListener = function (removedItem) {
		var currentFavourites = this._list.getData(),
			getProductId = $N.app.MDSUtil.assetDataMapper.getProductId,
			contentTypeText = (this._contentType === "favourites") ? "textFavourites" : "textRentals",
			itemCountText = "",
			newFavourites = [];

		newFavourites = currentFavourites.filter(function (favourite) {
			return (getProductId(favourite) !== getProductId(removedItem.data));
		});

		this._list.setData(newFavourites);
		this.displayData();

		itemCountText = (newFavourites.length) ? newFavourites.length + " " + NowMyContent.getString(contentTypeText) : "";
		this._itemCount.setText(itemCountText);
	};

	/**
	 * @method focus
	 */
	NowMyContent.prototype.focus = function () {
		var me = this;
		this._list.focus();
		if (this._favouriteRemovedSubscriptionId) {
			$N.apps.util.EventManager.unSubscribe(this._favouriteRemovedSubscriptionId);
		}
		this._favouriteRemovedSubscriptionId = $N.apps.util.EventManager.subscribe("nowFavouriteRemoved", this._favouriteRemovedListener, this);
		$N.platform.ca.ParentalControl.setUserChangedCallback(function () {
			me._list.setData(me._data);
			me._list.displayData();
		});
	};

	/**
	 * @method defocus
	 */
	NowMyContent.prototype.defocus = function () {
		this._list.defocus();
		if (this._favouriteRemovedSubscriptionId) {
			$N.apps.util.EventManager.unSubscribe(this._favouriteRemovedSubscriptionId);
			this._favouriteRemovedSubscriptionId = null;
		}
		$N.platform.ca.ParentalControl.setUserChangedCallback(function () {});
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 * @return {bool} handled
	 */
	NowMyContent.prototype.keyHandler = function (key) {
		if (!this._list.isEmpty()) {
			return this._list.keyHandler(key);
		}
		return false;
	};

	$N.gui.NowMyContent = NowMyContent;
}($N || {}));