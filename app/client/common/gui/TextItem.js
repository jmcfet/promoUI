/**
 * TextItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a graphic and text
 * stacked in vertical formation.
 *
 * @class $N.gui.TextItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 * @requires $N.gui.Group
 * @requires $N.gui.Label
 * @requires $N.gui.AbstractListItem
 * @requires $N.gui.Util
 * @param {Object} docRef (DOM document)
 */
(function ($N) {
	function TextItem(docRef) {
		TextItem.superConstructor.call(this, docRef);

		this._container = new $N.gui.ClippedGroup(this._docRef);
		this._container.setWidth(1300);
		this._container.setHeight(50);
		this._text = new $N.gui.Label(this._docRef, this._container);

		this._text.configure({
			x: 0,
			y: 35,
			width: 1300,
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

	$N.gui.Util.extend(TextItem, $N.gui.AbstractListItem);

	/**
	 * Sets the width of the TextItem.
	 * @method setWidth
	 * @param {Object} width The width of the TextItem.
	 * @return {Object} The TextItem object.
	 */
	TextItem.prototype.setWidth = function (width) {
		this._width = width;
		return this;
	};

	/**
	 * Sets the height of the TextItem.
	 * @method setHeight
	 * @param {Object} height The height of the TextItem.
	 * @return {Object} The TextItem object.
	 */
	TextItem.prototype.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * Highlights the TextItem.
	 *
	 * @method highlight
	 */
	TextItem.prototype.highlight = function (instant) {
		this._text.setCssClass("selected");
	};

	/**
	 * Removes the highlight from the TextItem.
	 *
	 * @method unHighlight
	 */
	TextItem.prototype.unHighlight = function () {
		this._text.setCssClass("textItemText");

	};

	/**
	 * Updates the data stored within the TextItem.
	 * @method update
	 * @param {Object} data Object containing the new data.
	 */
	TextItem.prototype.update = function (data) {
		if (data) {
			this._text.setText(this._dataMapper.getTitle(data));
		}
	};

	/**
	 * Changes the CSS style that is applied to the text.
	 * @method setCssClass
	 * @param {String} className The name of the CSS class to be applied to the text.
	 */
	TextItem.prototype.setCssClass = function (className) {
		this._text.setCssClass(className);
	};

	/**
	 * Sets the width of the label that contains the text.
	 * @method setTextWidth
	 * @param {Number} width The new width to be applied to the label that contains the text.
	 */
	TextItem.prototype.setTextWidth = function (width) {
		this._text.configure({
			width: width
		});
	};

	/**
	 * Sets the width of the container that contains the text.
	 * @method setContainerWidth
	 * @param {Number} width The new width to be applied to the container
	 */
	TextItem.prototype.setContainerWidth = function (width) {
		this._container.setWidth(width);
	};

	$N.gui = $N.gui || {};
	$N.gui.TextItem = TextItem;
}($N || {}));
