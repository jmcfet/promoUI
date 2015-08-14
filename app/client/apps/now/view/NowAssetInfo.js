/**
 * @class $N.gui.NowAssetInfo
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowAssetInfo = function (docRef, parent) {
		NowAssetInfo.superConstructor.call(this, docRef);
		$N.apps.core.Language.importLanguageBundleForObject(NowAssetInfo, null, "apps/now/common/", "LanguageBundle.js", null, window);

		this._dataMapper = {};
		this._data = null;

		this._container = new $N.gui.Container(this._docRef);
		this._title = new $N.gui.TextArea(this._docRef, this._container);
		this._subtitle = new $N.gui.TextArea(this._docRef, this._container);
		this._price = new $N.gui.SpanLabel(this._docRef, this._container);
		this._rgContainer = new $N.gui.Container(this._docRef, this._container);
		this._ratingIcon = new $N.gui.Image(this._docRef, this._rgContainer);
		this._genres = new $N.gui.InlineLabel(this._docRef, this._rgContainer);
		this._episodes = new $N.gui.Label(this._docRef, this._container);
		this._syContainer = new $N.gui.Container(this._docRef, this._container);
		this._synopsis = new $N.gui.TextArea(this._docRef, this._syContainer);
		this._actors = new $N.gui.TextArea(this._docRef, this._container);
		this._directors = new $N.gui.TextArea(this._docRef, this._container);
		this._flags = new $N.gui.AudioVideoFlags(this._docRef, this._container);
		this._moreContainer = new $N.gui.Container(this._docRef, this._container);
		this._okIcon = new $N.gui.Image(this._docRef, this._moreContainer);
		this._moreInfoLabel = new $N.gui.Label(this._docRef, this._moreContainer);

		this._container.configure({
			width: 540,
			height: 684,
			cssClass: "nowAssetInfoContainer"
		});

		this._title.configure({
			width: 543,
			cssClass: "nowAssetInfo title"
		});

		this._subtitle.configure({
			width: 543,
			cssClass: "nowAssetInfo subtitle"
		});
		this._price.configure({
			cssClass: "nowAssetInfo price",
			spanCssClass: "nowFullAssetInfoPrice"
		});
		this._rgContainer.configure({
			cssClass: "nowAssetInfo ratingGenreContainer"
		});
		this._ratingIcon.configure({
			cssClass: "nowAssetInfo ratingIcon"
		});
		this._genres.configure({
			cssClass: "nowAssetInfo genres"
		});
		this._episodes.configure({
			cssClass: "nowAssetInfo misc"
		});
		this._syContainer.configure({
			width: 537,
			cssClass: "nowAssetInfo syContainer"
		});
		this._synopsis.configure({
			width: 537,
			cssClass: "nowAssetInfo synopsis"
		});
		this._actors.configure({
			width: 537,
			cssClass: "nowAssetInfo actors"
		});
		this._directors.configure({
			width: 537,
			cssClass: "nowAssetInfo director"
		});
		this._flags.configure({
			x: 0,
			cssClass: "nowAssetInfo flags"
		});
		this._moreContainer.configure({
			cssClass: "nowAssetInfo moreInfoContainer"
		});
		this._okIcon.configure({
			x: 0,
			href: "../../../customise/resources/images/%RES/icons/botao_ok_azul.png"
		});
		this._moreInfoLabel.configure({
			x: 48,
			cssClass: "nowAssetInfo moreLabel"
		});

		this._traxisProductUpdatedListenerId = $N.apps.util.EventManager.subscribe("traxisProductsUpdated", this.traxisProductUpdatedListener, this);

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowAssetInfo, $N.gui.GUIObject);

	/**
	 * @method traxisProductUpdatedListener
	 * @param {String} productId
	 */
	NowAssetInfo.prototype.traxisProductUpdatedListener = function (eventData) {
		var productId = eventData.data.productId,
			priceText,
			spanIndex;

		if (this._data && (this._dataMapper.getProductId(this._data) === productId)) {
			priceText = this._dataMapper.getPriceText(this._data);
			spanIndex = priceText.indexOf($N.app.MDSUtil.getString("priceNow"));
			this._price.setText(priceText);
			if (spanIndex > 0) {
				this._price.setSpanOnText(priceText.substring(spanIndex));
			}
		}
	};

	/**
	 * @method setData
	 * @param {Object} dataMapper
	 */
	NowAssetInfo.prototype.setDataMapper = function (dataMapper) {
		this._dataMapper = dataMapper;
	};

	/**
	 * @method _adjustSynopsis
	 */
	NowAssetInfo.prototype._adjustSynopsis = function () {
		var flexContainer = this._syContainer.getRootElement(),
			paragraphText = this._synopsis.getRootElement(),
			paragraphTextStyle = window.getComputedStyle(paragraphText),
			numLines = Math.round(flexContainer.clientHeight / parseInt(paragraphTextStyle.fontSize, 10));

		if (parseInt(paragraphTextStyle.height, 10) > flexContainer.clientHeight) {
			this._synopsis.setMaxLines(numLines - 1);
		}

	};

	/**
	 * @method setData
	 * @param {Object} data
	 */
	NowAssetInfo.prototype.update = function (data) {
		var episodes,
			actors = this._dataMapper.getActors(data),
			director = this._dataMapper.getDirectors(data),
			productId = this._dataMapper.getProductId(data),
			subtitle;
		if (productId) {
			$N.app.TraxisUtil.updateProductDetails(productId, data);
		}
		this._synopsis.setMaxLines(0);
		this._data = data;
		this._title.setText(this._dataMapper.getTitle(data));
		subtitle = $N.app.StringUtil.join(" \u00A0", this._dataMapper.getSubtitle(data), this._dataMapper.getSeriesInfo(data));
		if (subtitle) {
			this._subtitle.setText(subtitle);
			this._subtitle.show();
		} else {
			this._subtitle.hide();
		}
		this._price.setText(this._dataMapper.getPriceText(data));
		this._ratingIcon.setHref(this._dataMapper.getRatingIcon(data));
		this._genres.setText(this._dataMapper.getGenres(data));
		episodes = this._dataMapper.getEpisodes(data);
		if (episodes) {
			this._episodes.show();
			this._episodes.setText(episodes);
		} else {
			this._episodes.hide();
		}
		this._synopsis.setText(this._dataMapper.getDescription(data));
		this._actors.setText(actors || "");
		this._directors.setText(director ? NowAssetInfo.getString("director") + ": " + director : "");
		this._flags.update(this._dataMapper.getFlags(data));
		this._moreInfoLabel.setText(NowAssetInfo.getString("moreInformation"));
		this._adjustSynopsis();
	};

	$N.gui.NowAssetInfo = NowAssetInfo;
}($N || {}));
