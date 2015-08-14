/**
 * @class $N.gui.ListLinker
 * @constructor
 * @extends $N.gui.AbstractListItem
 * @author ichellin
 * @requires $N.gui.Group
 * @requires $N.gui.Util
 * @param {Object} docRef
 * @param {Object} [parent]
 */
(function ($N) {
	var ListLinker = function (docRef, parent) {
		ListLinker.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "ListLinker");
		this._listTemplate = null;
		this._listItemTemplate = null;
		this._listDataMapper = null;
		this._list = null;
		this._focusCallback = function () {};
		this._container = new $N.gui.Group(docRef);
		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(ListLinker, $N.gui.AbstractListItem);

	/**
	 * @method initialise
	 */
	ListLinker.prototype.initialise = function () {
		this._list = new this._listTemplate(this._docRef, this._container);
		this._list.setItemTemplate(this._listItemTemplate);
		this._list.setDataMapper(this._dataMapper);
		this._list.setWidth(this._width);
		this._list.setHeight(this._height);
		this._list.setItemConfig({
			gridWidth: this._width
		});
		this._list.initialise();
	};

	/**
	 * @method initialise
	 */
	ListLinker.prototype.initialiseWhenReady = function () {
		if (this._listTemplate && this._listItemTemplate && this._listDataMapper) {
			this.initialise();
		}
	};

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	ListLinker.prototype.setWidth = function (width) {
		this._width = parseInt(width, 10);
		this._container.setWidth(width);
	};

	/**
	 * @method setHeight
	 * @param {Number} height
	 */
	ListLinker.prototype.setHeight = function (height) {
		this._height = parseInt(height, 10);
		this._container.setHeight(height);
	};

	/**
	 * @method setListTemplate
	 * @param {Object} listTemplate
	 */
	ListLinker.prototype.setListTemplate = function (listTemplate) {
		if (typeof listTemplate === "string") {
			this._listTemplate = window.$N.gui[listTemplate] || window[listTemplate];
		} else {
			this._listTemplate = listTemplate;
		}
		this.initialiseWhenReady();
	};

	/**
	 * @method setListItemTemplate
	 * @param {Object} listItemTemplate
	 */
	ListLinker.prototype.setListItemTemplate = function (listItemTemplate) {
		this._listItemTemplate = listItemTemplate;
		this.initialiseWhenReady();
	};

	/**
	 * @method setListItemTemplate
	 * @param {Object} listItemTemplate
	 */
	ListLinker.prototype.setDataMapper = function (dataMapper) {
		ListLinker.superClass.setDataMapper.call(this, dataMapper);
		this._listDataMapper = dataMapper;
		this.initialiseWhenReady();
	};

	/**
	 * @method setFocusCallback
	 * @param {Function} callback
	 */
	ListLinker.prototype.setFocusCallback = function (callback) {
		this._focusCallback = callback;
	};

	/**
	 * @method setGridRowItemCallback
	 * @param {Function} callback
	 */
	ListLinker.prototype.setGridRowItemCallback = function (callback) {
		this._list.setGridRowItemCallback(callback);
	};

	/**
	 * @method setDataValidationFunction
	 * @param {Function} testFunction - A test function to test data integrity
	 */
	ListLinker.prototype.setDataValidationFunction = function (testFunction) {
		this._list.setDataValidationFunction(testFunction);
	};

	/**
	 * @method highlight
	 */
	ListLinker.prototype.highlight = function () {
		this._log("highlight", "Enter");
		this._focusCallback(this._list.getData());
		this._list.focus();
		this._list.select(true);
		this._log("highlight", "Exit");
	};

	/**
	 * @method unHighlight
	 */
	ListLinker.prototype.unHighlight = function () {
		this._log("unHighlight", "Enter");
		this._list.defocus();
		this._log("unHighlight", "Exit");
	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	ListLinker.prototype.update = function (data) {
		this._log("update", "Enter");
		this._list.setData(data);
		this._list.displayData(true);
		this._log("update", "Exit");
	};

	/**
	 * @method updateIcons
	 * @param {Object} data
	 */
	ListLinker.prototype.updateIcons = function (data) {
		this._list.updateIcons(data);
	};

	/**
	 * @method selectLast
	 * @return {Object} selectedItem
	 */
	ListLinker.prototype.getSelectedItem = function () {
		this._log("getSelectedItem", "Enter");
		var selected = this._list.getSelectedItem();
		this._log("getSelectedItem", "Exit");
		return selected;
	};

	/**
	 * @method setItemHighlightedCallback
	 * @param {Function} callback
	 */
	ListLinker.prototype.setItemHighlightedCallback = function (callback) {
		this._list.setItemHighlightedCallback(callback);
	};

	/**
	 * @method setItemHighlightedImmediateCallback
	 * @param {Function} callback
	 */
	ListLinker.prototype.setItemHighlightedImmediateCallback = function (callback) {
		this._list.setItemHighlightedImmediateCallback(callback);
	};

	/**
	 * @method setItemSelectedCallback
	 * @param {Function} callback
	 */
	ListLinker.prototype.setItemSelectedCallback = function (callback) {
		this._list.setItemSelectedCallback(callback);
	};

	/**
	 * @method selectItemAtIndex
	 * @param {Number} index Row index to be selected.
	 * @param {Boolean} redraw True if the visible data should be updated/refreshed.
	 */
	ListLinker.prototype.selectItemAtIndex = function (index, redraw) {
		this._log("selectItemAtIndex", "Enter");
		this._list.selectItemAtIndex(index, redraw);
		this._log("selectItemAtIndex", "Exit");
	};

	/**
	 * @method selectFirst
	 */
	ListLinker.prototype.selectFirst = function () {
		this._log("selectFirst", "Enter");
		this._list.selectFirst();
		this._log("selectFirst", "Exit");
	};

	/**
	 * @method selectLast
	 */
	ListLinker.prototype.selectLast = function () {
		this._log("selectLast", "Enter");
		this._list.selectLast();
		this._log("selectLast", "Exit");
	};

	/**
	 * @method select
	 */
	ListLinker.prototype.select = function () {
		this._log("select", "Enter");
		this._list.select();
		this._log("select", "Exit");
	};
	/**
	 * @method selectDataItemOnNow
	 */
	ListLinker.prototype.selectDataItemOnNow = function () {
		this._log("selectDataItemOnNow", "Enter");
		this._list.selectDataItemOnNow();
		this._log("selectDataItemOnNow", "Exit");
	};

	/**
	 * @method keyHandler
	 * @param {String} key The key that was pressed.
	 * @return {Boolean} handled
	 */
	ListLinker.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var handled = this._list.keyHandler(key);
		this._log("keyHandler", "Exit");
		return handled;
	};

	$N.gui = $N.gui || {};
	$N.gui.ListLinker = ListLinker;
}($N || {}));
