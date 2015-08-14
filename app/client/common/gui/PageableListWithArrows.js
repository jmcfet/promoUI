/**
 * @class $N.gui.PageableListWithArrows
 * @constructor
 * @extends $N.gui.PageableList
 * @requires $N.gui.Container
 * @requires $N.gui.MaskIcon
 * @requires $N.gui.Util
 * @param {Object} docRef
 * @param {Object} [parent]
 */
(function ($N) {
	var PageableListWithArrows = function (docRef, parent) {
		PageableListWithArrows.superConstructor.call(this, docRef, parent);
		this._log = new $N.apps.core.Log("CommonGUI", "PageableListWithArrows");

		this._arrowsContainer = new $N.gui.Container(this._docRef, this._container);
		this._arrowsContainer.hide();
		this._upArrow = new $N.gui.MaskIcon(this._docRef, this._arrowsContainer);
		this._downArrow = new $N.gui.MaskIcon(this._docRef, this._arrowsContainer);

		this._upArrow.configure({
			x: -1.5,
			y: -76.5,
			width: 30,
			height: 18,
			href: "./customise/resources/images/icons/arrows/upArrowIcon.png",
			color: "#fff",
			visible: false
		});
		this._downArrow.configure({
			x: -1.5,
			y: 612,
			width: 30,
			height: 18,
			href: "./customise/resources/images/icons/arrows/downArrowIcon.png",
			color: "#fff",
			visible: false
		});
	};
	$N.gui.Util.extend(PageableListWithArrows, $N.gui.PageableList);

	/**
	 * function to set any properties of up arrow, e.g.: position and href etc.
	 * Only caveat is this element is a SVG link instead of an image.
	 * @method setUpArrowProperties
	 * @param {Object} config
	 */
	PageableListWithArrows.prototype.setUpArrowProperties = function (config) {
		this._upArrow.configure(config);
	};

	/**
	 * function to set any properties of down arrow, e.g.: position and href etc.
	 * Only caveat is this element is a SVG link instead of an image.
	 * @method setDownArrowProperties
	 * @param {Object} config
	 */
	PageableListWithArrows.prototype.setDownArrowProperties = function (config) {
		this._downArrow.configure(config);
	};

	/**
	 * @method focus
	 */
	PageableListWithArrows.prototype.focus = function () {
		PageableListWithArrows.superClass.focus.call(this);
		this._arrowsContainer.show();
	};

	/**
	 * @method defocus
	 */
	PageableListWithArrows.prototype.defocus = function () {
		PageableListWithArrows.superClass.defocus.call(this);
		this._arrowsContainer.hide();
	};

	/**
	 * @method _updateArrowVisibility
	 */
	PageableListWithArrows.prototype._updateArrowVisibility = function () {
		this._upArrow.setVisible(!this.isSelectionAtTop());
		this._downArrow.setVisible(!this.isSelectionAtBottom());
	};

	/**
	 * @method displayData
	 * @param {Boolean} preview
	 * @param {Boolean} avoidHighlight
	 */
	PageableListWithArrows.prototype.displayData = function (preview, avoidHighlight) {
		PageableListWithArrows.superClass.displayData.call(this, preview, avoidHighlight);
		this._updateArrowVisibility();
	};

	/**
	 * @method _firePagedCallback
	 */
	PageableListWithArrows.prototype._firePagedCallback = function () {
		PageableListWithArrows.superClass._firePagedCallback.call(this);
		this._updateArrowVisibility();
	};

	$N.gui = $N.gui || {};
	$N.gui.PageableListWithArrows = PageableListWithArrows;
}($N || {}));
