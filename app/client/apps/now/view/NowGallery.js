/**
 * @class $N.gui.NowGallery
 * @constructor
 * @extends $N.gui.GUIObject
 * #depends ../view/NowGalleryItem.js
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowGallery = function (docRef, parent) {
		NowGallery.superConstructor.call(this, docRef);
		$N.apps.core.Language.importLanguageBundleForObject(NowGallery, null, "apps/now/common/", "LanguageBundle.js", null, window);

		this._itemSelectedCallback = function () {};

		this._container = new $N.gui.Group(this._docRef);
		this._gallery = new $N.gui.PageableMosaic(this._docRef, this._container);
		this._detailsGroup = new $N.gui.Group(this._docRef, this._container);
		this._upArrow = new $N.gui.MaskIcon(this._docRef, this._detailsGroup);
		this._downArrow = new $N.gui.MaskIcon(this._docRef, this._detailsGroup);

		this._selectionPosition = new $N.gui.Label(this._docRef, this._detailsGroup);
		this._assetInfo = new $N.gui.NowAssetInfo(this._docRef, this._container);

		var me = this;
		this._gallery.configure({
			y: -111,
			width: 1140,
			height: 621,
			columns: 5,
			rows: 2,
			hSpace: 24,
			vSpace: 25.5,
			itemTemplate: $N.gui.NowGalleryItem,
			dataMapper: $N.app.MDSUtil.assetDataMapper,
			listPagedCallback: function () {
				me._upArrow.setVisible(!me._gallery.isAtFirstPage());
				me._downArrow.setVisible(!me._gallery.isAtLastPage());
			},
			itemHighlightedImmediateCallback: function (data) {
				$N.app.MDSUtil.clearRequest();
				me._selectionPosition.setText(this.getSelectedItemIndex() + NowGallery.getString("xOfY") + this.getSize());
				me._assetInfo.update(data);
			},
			itemSelectedCallback: function (data) {
				$N.app.MDSUtil.clearRequest();
				me._itemSelectedCallback(data);
			}
		});
		this._gallery.initialise();
		this._upArrow.configure({
			x: 573,
			y: -46.5,
			width: 30,
			height: 18,
			href: "../../../customise/resources/images/icons/arrows/upArrowIcon.png",
			color: "#fff"
		});
		this._downArrow.configure({
			x: 573,
			y: 609,
			width: 30,
			height: 18,
			href: "../../../customise/resources/images/icons/arrows/downArrowIcon.png",
			color: "#fff"
		});

		this._selectionPosition.configure({
			x: 997.5,
			y: 600,
			width: 150,
			cssClass: "nowGalleryPosition right"
		});

		this._assetInfo.configure({
			x: 1203,
			y: -48,
			dataMapper: $N.app.MDSUtil.assetDataMapper
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowGallery, $N.gui.GUIObject);

	/**
	 * @method selectRowByValidation
	 * @param {Function} validationFunction
	 */
	NowGallery.prototype.selectRowByValidation = function (validationFunction) {
		this._gallery.selectRowByValidation(validationFunction);
	};

	/**
	 * @method setItemSelectedCallback
	 * @param {Function} callback
	 */
	NowGallery.prototype.setItemSelectedCallback = function (callback) {
		this._itemSelectedCallback = callback;
	};

	/**
	 * @method setData
	 * @param {Object} data
	 */
	NowGallery.prototype.setData = function (data) {
		this._gallery.setData(data);
		this._upArrow.hide();
		this._downArrow.setVisible(!this._gallery.isAtLastPage());
	};

	/**
	 * @method getSelectedItem
	 * @return {Object}
	 */
	NowGallery.prototype.getSelectedItem = function () {
		return this._gallery.getSelectedItem();
	};

	/**
	 * @method displayData
	 * @param {Boolean} (optional) preview
	 * @param {Boolean} (optional) avoidHighlight
	 */
	NowGallery.prototype.displayData = function (preview, avoidHighlight) {
		this._gallery.displayData(preview, avoidHighlight);
	};

	/**
	 * @method select
	 */
	NowGallery.prototype.select = function () {
		this._gallery.select();
	};

	/**
	 * @method focus
	 */
	NowGallery.prototype.focus = function () {
		this._detailsGroup.show();
		this._assetInfo.show();
		this._gallery.focus();
	};

	/**
	 * @method defocus
	 */
	NowGallery.prototype.defocus = function () {
		this._gallery.defocus();
		this._detailsGroup.hide();
		this._assetInfo.hide();
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 * @return {bool} handled
	 */
	NowGallery.prototype.keyHandler = function (key) {
		return this._gallery.keyHandler(key);
	};

	$N.gui.NowGallery = NowGallery;
}($N || {}));