/**
 * NowFullAssetInfo is a GUI component used to present full asset information to the user and trigger
 * rental / playback of an asset as well as many other features
 * @class $N.gui.NowFullAssetInfo
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowFullAssetInfo = function (docRef, parent) {
		NowFullAssetInfo.superConstructor.call(this, docRef);
		$N.apps.core.Language.importLanguageBundleForObject(NowFullAssetInfo, null, "apps/now/common/", "LanguageBundle.js", null, window);

		this._dataMapper = $N.app.MDSUtil.assetDataMapper;
		this._data = null;
		this._serverFailureCallback = function () {};
		this._assetFailureCallback = function () {};
		this._exitCallback = function () {};
		this._similarRecommendationsCallback = function () {};
		this._favouriteSetOnEntry = false;
		this._isAuthenticationSuccess = false;

		this._container = new $N.gui.Group(this._docRef);

		this._title = new $N.gui.Label(this._docRef, this._container);
		this._subtitle = new $N.gui.Label(this._docRef, this._container);
		this._expiryDate = new $N.gui.Label(this._docRef, this._container);
		this._scrollingContent = new $N.gui.ScrollingGroupWithFade(this._docRef, this._container);

		this._ratingIcon = new $N.gui.Image(this._docRef, this._scrollingContent);
		this._miscInfo = new $N.gui.Label(this._docRef, this._scrollingContent);

		this._price = new $N.gui.Label(this._docRef, this._scrollingContent);
		this._rentalDuration = new $N.gui.Label(this._docRef, this._scrollingContent);

		this._actors = new $N.gui.Label(this._docRef, this._scrollingContent);
		this._director = new $N.gui.Label(this._docRef, this._scrollingContent);
		this._synopsis = new $N.gui.TextArea(this._docRef, this._scrollingContent);

		this._title.configure({
			x: 103.5,
			y: 205.5,
			width: 1315.5,
			cssClass: "nowFullAssetInfoTitle"
		});
		this._subtitle.configure({
			x: 103.5,
			y: 267,
			width: 1315.5,
			cssClass: "nowFullAssetInfoSubtitle"
		});
		this._expiryDate.configure({
			x: 103.5,
			y: 267,
			width: 1315.5,
			cssClass: "nowFullAssetInfoExpiry"
		});
		this._scrollingContent.configure({
			x: 103.5,
			y: 247.5,
			width: 1320,
			height: 450,
			innerHeight: 450,
			scrollSpeed: 450,
			upArrowProperties: {
				y: -96
			}
		});
		this._ratingIcon.configure({
			x: 4.5,
			y: 0
		});
		this._miscInfo.configure({
			x: 61.5,
			y: -2,
			width: 1254,
			cssClass: "nowFullAssetInfoMisc"
		});
		this._price.configure({
			x: 0,
			y: 61.5,
			cssClass: "nowFullAssetInfoPrice"
		});
		this._rentalDuration.configure({
			x: 0,
			y: 70.5,
			cssClass: "nowFullAssetInfoRentalDuration"
		});
		this._actors.configure({
			x: 0,
			y: 123,
			width: 1315.5,
			cssClass: "nowFullAssetInfoActors"
		});
		this._director.configure({
			x: 0,
			y: 174,
			width: 1315.5,
			cssClass: "nowFullAssetInfoActors"
		});
		this._synopsis.configure({
			x: 0,
			y: 238.5,
			width: 1315.5,
			cssClass: "nowAssetInfoSynopsis"
		});

		this._image = new $N.gui.FadingImage(this._docRef, this._container);
		this._flags = new $N.gui.AudioVideoFlags(this._docRef, this._container);
		this._options = new $N.gui.OptionsBar(this._docRef, this._container);
		this._backArrow = new $N.gui.MaskIcon(this._docRef, this._container);

		this._image.configure({
			x: 1488,
			y: 174,
			width: 364.5,
			height: 510,
			underImageConfig: {
				visible: false
			}
		});
		this._flags.configure({
			x: 1488,
			y: 703.5
		});
		this._options.configure({
			x: 105,
			y: 900,
			itemSelectedCallback: function (obj) {
				if (obj.action) {
					obj.action();
				}
			}
		});
		this._options.initialise();
		this._backArrow.configure({
			x: 64.5,
			y: 477,
			width: 18,
			height: 30,
			color: "#fff",
			href: "../../../customise/resources/images/icons/arrows/leftArrowIcon.png"
		});

		this._divider = new $N.gui.Layer(this._docRef, this._container);
		this._basicGradient = new $N.gui.BackgroundBox(this._docRef, this._divider);
		this._solidLine = new $N.gui.BackgroundBox(this._docRef, this._divider);
		this._radialGradient = new $N.gui.BackgroundBox(this._docRef, this._divider);

		this._divider.configure({
			x: 0,
			y: 717,
			width: 1920,
			height: 120
		});
		this._basicGradient.configure({
			x: 0,
			y: 78,
			width: 1920,
			height: 39,
			cssClass: "nowFullAssetUniformGradient"
		});
		this._solidLine.configure({
			x: 0,
			y: 117,
			width: 1920,
			height: 3,
			cssClass: "nowFullAssetSolidDivider"
		});
		this._radialGradient.configure({
			x: 96,
			y: 0,
			width: 1728,
			height: 240,
			cssClass: "radialGradientBackground"
		});

		$N.apps.util.EventManager.subscribe("traxisProductsUpdated", this.traxisProductUpdatedListener, this);

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowFullAssetInfo, $N.gui.GUIObject);

	/**
	 * @method traxisProductUpdatedListener
	 */
	NowFullAssetInfo.prototype.traxisProductUpdatedListener = function (eventData) {
		var productId = eventData.data.productId;
		if (this._data && (this._dataMapper.getProductId(this._data) === productId)) {
			this._price.setText(this._dataMapper.getPriceText(this._data));
			this._updateRentalText();
			this._updateExpiryText();
			this._redrawOptions(this._data);
		}
	};

	/**
	 * @method _updateRentalText
	 */
	NowFullAssetInfo.prototype._updateRentalText = function () {
		var RENTAL_OFFSET = 21,
			rentalDate = this._dataMapper.getRentalExpiry(this._data),
			rentalText = "",
			MDSUtil = $N.app.MDSUtil,
			DateTimeUtil = $N.app.DateTimeUtil;

		if (!rentalDate) {
			rentalDate = new Date();
			rentalDate.setDate(rentalDate.getDate() + 2);
		}

		if (rentalDate && rentalDate > Date.now()) {
			rentalText = MDSUtil.getString("rentalTimePrefix") + DateTimeUtil.getFormattedTimeString(rentalDate, $N.app.constants.TWENTY_FOUR_HOUR_TIME_FORMAT);
			rentalText += MDSUtil.getString("rentalDatePrefix") + DateTimeUtil.getDayMonthStringFromDate(rentalDate);
		}

		this._rentalDuration.setX(this._price.getTrueX() + this._price.getTrueTextLength() + RENTAL_OFFSET);
		this._rentalDuration.setText(rentalText);
	};

	/**
	 * @method _updateExpiryText
	 */
	NowFullAssetInfo.prototype._updateExpiryText = function () {
		var expiryDate = this._dataMapper.getAssetExpiry(this._data),
			expiryText = "",
			MDSUtil = $N.app.MDSUtil,
			DateTimeUtil = $N.app.DateTimeUtil;

		if (expiryDate && expiryDate > Date.now()) {
			expiryText = MDSUtil.getString("myContentAssetExpiryTitle") + " " + DateTimeUtil.getFormattedDateString(expiryDate);
		}

		this._expiryDate.setText(expiryText);
	};

	/**
	 * @method hide
	 */
	NowFullAssetInfo.prototype.hide = function () {
		if (this._favouriteSetOnEntry && !$N.app.TraxisUtil.favourites.isInFavourites(this._dataMapper.getFilename(this._data))) {
			$N.apps.util.EventManager.fire("nowFavouriteRemoved", this._data);
		}
		NowFullAssetInfo.superClass.hide.call(this);
	};

	/**
	 * @method setDataMapper
	 * @param {Object} dataMapper
	 */
	NowFullAssetInfo.prototype.setDataMapper = function (dataMapper) {
		this._dataMapper = dataMapper;
	};

	/**
	 * @method setServerFailureCallback
	 * @param {Function} callback
	 */
	NowFullAssetInfo.prototype.setServerFailureCallback = function (callback) {
		this._serverFailureCallback = callback;
	};

	/**
	 * @method setAssetFailureCallback
	 * @param {Function} callback
	 */
	NowFullAssetInfo.prototype.setAssetFailureCallback = function (callback) {
		this._assetFailureCallback = callback;
	};

	/**
	 * @method setExitCallback
	 * @param {Function} callback
	 */
	NowFullAssetInfo.prototype.setExitCallback = function (callback) {
		this._exitCallback = callback;
	};

	/**
	 * @method setSimilarRecommendationsCallback
	 * @param {Function} callback
	 */
	NowFullAssetInfo.prototype.setSimilarRecommendationsCallback = function (callback) {
		this._similarRecommendationsCallback = callback;
	};

	/**
	 * @method _repositionComponents
	 */
	NowFullAssetInfo.prototype._repositionComponents = function () {
		var contentHeight = 750 - 399;
		if (this._subtitle.isVisible()) {
			this._expiryDate.configure({
				y: 318
			});
			this._scrollingContent.configure({
				y: 399,
				height: contentHeight,
				upArrowProperties: {
					y: -192
				}
			});
		} else {
			contentHeight = 750 - 355;
			this._expiryDate.configure({
				y: 267
			});
			this._scrollingContent.configure({
				y: 355,
				height: contentHeight,
				upArrowProperties: {
					y: -148
				}
			});
		}
		if (this._actors.isVisible()) {
			this._director.setY(this._actors.getTrueY() + 51);
		} else {
			this._director.setY(this._actors.getTrueY());
		}
		if (this._director.isVisible()) {
			this._synopsis.setY(this._director.getTrueY() + 64);
		} else {
			if (this._actors.isVisible()) {
				this._synopsis.setY(this._actors.getTrueY() + 64);
			} else {
				this._synopsis.setY(this._price.getTrueY() + 64);
			}
		}
		this._scrollingContent.setInnerHeight(Math.max(contentHeight + 1.5, this._synopsis.getTrueY() + this._synopsis.getContentHeight()));
		this._scrollingContent.resetScroll();
	};

	/**
	 * @method _getOptionsData
	 * @param {Object} assetData
	 * @return {Object} optionsData
	 */
	NowFullAssetInfo.prototype._getOptionsData = function (assetData, callback) {
		var me = this,
			optionsData = [],
			traxisTicketId = this._dataMapper.getTicketId(assetData),
			entitlementId = this._dataMapper.getEntitlementId(assetData),
			fileName = this._dataMapper.getFilename(assetData),
			price = this._dataMapper.getPrice(assetData),
			authenticateSuccess = function () {
				me._isAuthenticationSuccess = true;
				me._redrawOptions(me._data);
			},
			purchaseSuccessCallback = function () {
				$N.app.TraxisUtil.updateProductDetails(me._dataMapper.getProductId(assetData), assetData);
			};

		if (traxisTicketId || entitlementId) {
			if (entitlementId) {
				optionsData.push({
					title: NowFullAssetInfo.getString("menuWatch"),
					url: "../../../customise/resources/images/%RES/icons/optionIcons/watch_icon.png",
					action: function () {
						$N.app.NowPlayback.playAsset(assetData, entitlementId);
					}
				});
			} else if (price === 0) {
				optionsData.push({
					title: NowFullAssetInfo.getString("menuWatch"),
					url: "../../../customise/resources/images/%RES/icons/optionIcons/watch_icon.png",
					action: function () {
						$N.app.NowPlayback.purchaseProduct(assetData, traxisTicketId, purchaseSuccessCallback);
					}
				});
			} else if (this._dataMapper.isSubscription(assetData)) {
				optionsData.push({
					title: NowFullAssetInfo.getString("menuInfo"),
					url: "../../../customise/resources/images/%RES/icons/optionIcons/info_icon.png",
					action: function () {
						$N.app.NowPlayback.subscribeToProduct(assetData, traxisTicketId, purchaseSuccessCallback);
					}
				});
			} else {
				optionsData.push({
					title: (me._dataMapper.getDefinition(assetData) === "HD") ?  NowFullAssetInfo.getString("menuRentHD") : NowFullAssetInfo.getString("menuRent"),
					url: "../../../customise/resources/images/%RES/icons/optionIcons/rent_icon.png",
					action: function () {
						$N.app.NowPlayback.purchaseProduct(assetData, traxisTicketId, purchaseSuccessCallback);
					}
				});
			}

			if (this._dataMapper.getTrailerRef(assetData)) {
				optionsData.push({
					title: NowFullAssetInfo.getString("menuTrailer"),
					url: "../../../customise/resources/images/%RES/icons/optionIcons/trailer_icon.png",
					action: function () {
						$N.app.NowPlayback.playTrailer(assetData, null, function () {
							me._assetFailureCallback($N.app.errorCodes.NOW.MDS_DATA_FAILURE);
						});
					}
				});
			}

			if ($N.app.TraxisUtil.favourites.isInFavourites(this._dataMapper.getFilename(this._data)) === true) {
				optionsData.push({
					title: NowFullAssetInfo.getString("menuRemoveFavourite"),
					url: "../../../customise/resources/images/%RES/icons/optionIcons/vod_remove_favorite.png",
					type: "smallerText",
					action: function () {
						$N.app.TraxisUtil.favourites.removeFavouriteByFileName(fileName, function (data) {
							me._redrawOptions(me._data);
						}, function (data) {
							// TODO: Deal with failure to removeFavourite
							// Currently fails silently - Button will not toggle
						});
					}
				});
			} else {
				optionsData.push({
					title: NowFullAssetInfo.getString("menuAddFavourite"),
					url: "../../../customise/resources/images/%RES/icons/optionIcons/vod_add_favorite.png",
					type: "smallerText",
					action: function () {
						$N.app.TraxisUtil.favourites.addFavouriteByFileName(fileName, function (data) {
							me._redrawOptions(me._data);
						}, function (data) {
							// TODO: Deal with failure to addFavourite
							// Currently fails silently - Button will not toggle
						});
					}
				});
			}

			if ($N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK).isAccountAvailable()) { // post to FB option should be available only if account is available
				optionsData.push({
					title: NowFullAssetInfo.getString("menuFacebookPost"),
					url: "../../../customise/resources/images/%RES/icons/optionIcons/fb_icon.png",
					action: function () {
						$N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK).showPostToSocialAccountDialog({
							"title": me._title.getText()
						}, "NOW");
						$N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK).setAccountRemovalListener(function () {
							me._redrawOptions(me._data);
						});
					}
				});
			}
		}
		if ($N.app.FeatureManager.isVODRecommendationEnabled() && this._isAuthenticationSuccess) {
			optionsData.push({
				title: NowFullAssetInfo.getString("menuSimilarRecommendations"),
				url: "../../../customise/resources/images/%RES/icons/optionIcons/mais_como_icon.png",
				action: function () {
					me._similarRecommendationsCallback(assetData);
				}
			});
		} else {
			$N.app.VODRecommendationServerHelper.authenticateVODRecommendServer(authenticateSuccess);
		}
		optionsData.push({
			title: NowFullAssetInfo.getString("menuBack"),
			url: "../../../customise/resources/images/%RES/icons/optionIcons/back_icon.png",
			action: this._exitCallback
		});

		callback(optionsData);
	};

	NowFullAssetInfo.prototype._updateOptions = function (optionsData, resetIndex) {
		var selectedIndex = this._options.getSelectedItemIndex();
		this._options.setData(optionsData);
		if (!resetIndex) {
			this._options.selectItemAtIndex(selectedIndex);
		}
		this._options.displayData();
	};

	/**
	 * @method _redrawOptions
	 * @param {Object} assetData
	 * @param {Boolean} resetIndex
	 */
	NowFullAssetInfo.prototype._redrawOptions = function (assetData, resetIndex) {
		var me = this;
		this._getOptionsData(assetData, function (results) {
			me._updateOptions(results, resetIndex);
		});
	};

	/**
	 * @method update
	 * @param {Object} assetData
	 */
	NowFullAssetInfo.prototype.update = function (assetData) {
		var me = this,
			href = this._dataMapper.getHref(assetData),
			subtitle,
			actors = this._dataMapper.getActors(assetData),
			director = this._dataMapper.getDirectors(assetData);
		this._isAuthenticationSuccess = false;
		$N.app.TraxisUtil.updateProductDetails(this._dataMapper.getProductId(assetData), assetData, function () {
			if (me.isVisible()) {
				me._serverFailureCallback($N.app.errorCodes.NOW.TRAXIS_DATA_FAILURE);
			}
		});
		$N.app.VODRecommendationServerHelper.authenticateVODRecommendServer(function () {me._isAuthenticationSuccess = true; });
		this._favouriteSetOnEntry = $N.app.TraxisUtil.favourites.isInFavourites(this._dataMapper.getFilename(assetData));
		this._data = assetData;
		this._image.setHref(href);
		this._flags.update(this._dataMapper.getFlags(assetData));
		this._title.setText(this._dataMapper.getTitle(assetData));
		subtitle = $N.app.StringUtil.join(" \u00A0", this._dataMapper.getSubtitle(assetData), this._dataMapper.getSeriesInfo(assetData));
		if (subtitle) {
			this._subtitle.setText(subtitle);
			this._subtitle.show();
		} else {
			this._subtitle.hide();
		}
		this._ratingIcon.setHref(this._dataMapper.getRatingIcon(assetData));
		this._miscInfo.setText($N.app.StringUtil.join(" \u00A0", this._dataMapper.getGenres(assetData), this._dataMapper.getYear(assetData), this._dataMapper.getDuration(assetData), this._dataMapper.getCountries(assetData)));
		this._price.setText(this._dataMapper.getPriceText(assetData));
		this._updateRentalText();
		this._updateExpiryText();
		if (actors) {
			this._actors.show();
			this._actors.setText(actors);
		} else {
			this._actors.hide();
		}
		if (director) {
			this._director.show();
			this._director.setText($N.app.MDSUtil.getString("director") + ": " + director);
		} else {
			this._director.hide();
		}
		this._synopsis.setText(this._dataMapper.getSynopsis(assetData));
		this._repositionComponents();
		this._redrawOptions(assetData, true);
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 * @return {bool} handled
	 */
	NowFullAssetInfo.prototype.keyHandler = function (key) {
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;
		handled = this._options.keyHandler(key);
		if (!handled) {
			handled = this._scrollingContent.keyHandler(key);
		}
		if (!handled) {
			switch (key) {
			case keys.KEY_OK:
			case keys.KEY_BACK:
			case keys.KEY_LEFT:
				this._exitCallback();
				handled = true;
				break;
			}
		}
		return handled;
	};

	$N.gui.NowFullAssetInfo = NowFullAssetInfo;
}($N || {}));
