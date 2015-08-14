/**
 * RecordItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a recording icon and text
 * stacked in horizontal formation.
 *
 * @class $N.gui.RecordItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 *
 * @requires $N.apps.core.Log
 * @requires $N.gui.Group
 * @requires $N.gui.RecordIcon
 * @requires $N.gui.Label
 * @requires $N.gui.AbstractListItem
 * @requires $N.gui.Util
 *
 * @param {Object} docRef (DOM document)
 */
(function () {
	function RecordItem(docRef) {

		this._log = new $N.apps.core.Log("CommonGUI", "RecordItem");
		RecordItem.superConstructor.call(this, docRef);

		this._container = new $N.gui.Group(this._docRef);
		this._container.setWidth(210);
		this._container.setHeight(60);
		this._recordIcon = new $N.gui.RecordIcon(this._docRef, this._container);
		this._text = new $N.gui.Label(this._docRef, this._container);

		this._recordIcon.configure({
			x: 0,
			y: 30
		});

		this._text.configure({
			x: 60,
			y: 47,
			cssClass: "textItemText"
		});

		this.setDataMapper({
			getText: function (obj) {
				return obj.name;
			}
		});

		this._rootSVGRef = this._container.getRootSVGRef();

		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(RecordItem, $N.gui.AbstractListItem);

	/**
	 * Sets the width of the RecordItem.
	 * @method setWidth
	 * @param {Object} width The width of the RecordItem.
	 * @return {Object} The RecordItem object.
	 */
	RecordItem.prototype.setWidth = function (width) {
		this._width = width;
		return this;
	};

	/**
	 * Sets the height of the RecordItem.
	 * @method setHeight
	 * @param {Object} height The height of the RecordItem.
	 * @return {Object} The RecordItem object.
	 */
	RecordItem.prototype.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * Highlights the RecordItem.
	 * @method highlight
	 */
	RecordItem.prototype.highlight = function () {
	};

	/**
	 * Removes the highlight from the RecordItem.
	 * @method unHighlight
	 */
	RecordItem.prototype.unHighlight = function () {
	};

	/**
	 * Set the css for the label.
	 * @method setTextCssClass
	 * @param {string} cssClass
	 */
	RecordItem.prototype.setTextCssClass = function (cssClass) {
		this._text.setCssClass(cssClass);
	};

	/**
	 * Updates the data stored within the RecordItem.
	 * @method update
	 * @param {Object} data Object containing the new data.
	 */
	RecordItem.prototype.update = function (data) {
		this._log("update", "Enter");
		if (data) {
			this._text.setText(this._dataMapper.getText(data));
			this._recordIcon.update(data);
		}
		this._log("update", "Exit");
	};

	$N.gui = $N.gui || {};
	$N.gui.RecordItem = RecordItem;

}($N || {}));