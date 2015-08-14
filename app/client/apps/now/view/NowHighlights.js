/**
 * NowHighlights is a component designed for use in the NOW pane system.
 * Like portal, it contains a dynamicTable whose data will be populated from our portal server.
 * @class $N.gui.NowHighlights
 * @constructor
 * @extends $N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowHighlights = function (docRef, parent) {
		NowHighlights.superConstructor.call(this, docRef);

		this._container = new $N.gui.Group(this._docRef);
		this._table = new $N.gui.DynamicTable(this._docRef, this._container);
		this._table.configure({
			x: 0,
			y: 13.5,
			width: 1177.5,
			height: 577.5,
			itemTemplate: $N.gui.EventPromotionItem,
			dataMapper: $N.app.DataMappers.getServiceDataMapper()
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowHighlights, $N.gui.GUIObject);

	/**
	 * @method setData
	 * @param {Object} data
	 */
	NowHighlights.prototype.setData = function (data) {
		this._table.setData(data);
	};

	/**
	 * @method setItemConfig
	 * @param {Object} itemConfig
	 */
	NowHighlights.prototype.setItemConfig = function (itemConfig) {
		this._table.setItemConfig(itemConfig);
	};

	/**
	 * @method initialise
	 */
	NowHighlights.prototype.initialise = function () {
		this._table.initialise();
	};

	/**
	 * @method focus
	 */
	NowHighlights.prototype.focus = function () {
		this._table.activate();
	};

	/**
	 * @method defocus
	 */
	NowHighlights.prototype.defocus = function () {
		this._table.passivate();
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 * @return {bool} handled
	 */
	NowHighlights.prototype.keyHandler = function (key) {
		return this._table.keyHandler(key);
	};

	$N.gui.NowHighlights = NowHighlights;
}($N || {}));