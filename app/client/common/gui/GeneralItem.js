/**
 * GeneralItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a graphic and text
 * stacked in vertical formation.
 *
 * @class GeneralItem
 * @constructor
 * @namespace $N.gui
 * @extends $N.gui.AbstractListItem
 * @requires $N.gui.ClippedGroup
 * @requires $N.gui.Image
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @param {Object} docRef (DOM document)
 */

(function ($N) {
	function GeneralItem(docRef) {

		GeneralItem.superConstructor.call(this, docRef);

		this._log = new $N.apps.core.Log("CommonGUI", "GeneralItem");
		this._container = new $N.gui.ClippedGroup(docRef);
		this._container.setWidth(300);
		this._container.setHeight(60);
		this._image = new $N.gui.Image(docRef, this._container);
		this._text = new $N.gui.Label(docRef, this._container);

		this._text.configure({
			x: 40,
			y: 45,
			width: 115,
			cssClass: "generalItemText"
		});

		this._image.configure({
			x: 0,
			y: 24,
			width: 32,
			height: 28,
			quality: 1
		});

		this._rootSVGRef = this._container.getRootSVGRef();

		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(GeneralItem, $N.gui.AbstractListItem);

	/**
	 * Sets the width of the GeneralItem.
	 *
	 * @method setWidth
	 *
	 * @param {Number} width The width of the GeneralItem.
	 *
	 * @return {Object} The GeneralItem object.
	 */
	GeneralItem.prototype.setWidth = function (width) {
		this._log("setWidth", "Enter");
		if (width > this._container.getTrueWidth()) {
			this._container.setWidth(width);
		}
		this._width = width;
		this._text.setWidth(width - 40);
		this._log("setWidth", "Exit");
		return this;
	};

	/**
	 * Sets the height of the GeneralItem.
	 *
	 * @method setHeight
	 *
	 * @param {Number} height The height of the GeneralItem.
	 *
	 * @return {Object} The GeneralItem object.
	 */
	GeneralItem.prototype.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * Highlights the GeneralItem.
	 *
	 * @method highlight
	 */
	GeneralItem.prototype.highlight = function (instant) {
		var me = this;
		if (instant || !this._moveAnim) {
			me._text.setCssClass("selected");
		} else {
			this._moveAnim.setAnimationEndCallback(function () {
				me._text.setCssClass("selected");
			});
		}
	};

	/**
	 * Removes the highlight from the GeneralItem.
	 *
	 * @method unHighlight
	 */
	GeneralItem.prototype.unHighlight = function () {
		if (this._moveAnim) {
			this._moveAnim.setAnimationEndCallback(null);
		}
		this._text.setCssClass("generalItemText");
	};

	/**
	 * Updates the data stored within the GeneralItem.
	 *
	 * @method update
	 *
	 * @param {Object} data Object containing the new data.
	 */
	GeneralItem.prototype.update = function (data) {
		this._log("update", "Enter");
		if (data) {
			this._text.setText(this._dataMapper.getTitle(data));
			if (this._dataMapper.getIcon(data) === '') {
				this._image.hide();
			} else {
				this._image.setHref(this._dataMapper.getIcon(data));
				this._image.show();
			}
		}
		this._log("update", "Exit");
	};

	/**
	 * Sets the CSS class that will style the text.
	 *
	 * @method setTextClass
	 *
	 * @param {String} cssClassName The name of the CSS class to be used.
	 */
	GeneralItem.prototype.setTextClass = function (cssClassName) {
		this._text.setCssClass(cssClassName);
	};

	/**
	 * Sets the width of the label that contains the text.
	 * @method setTextWidth
	 * @param {Number} width The new width to be applied to the label that contains the text.
	 */
	GeneralItem.prototype.setTextWidth = function (width) {
		this._text.setWidth(width);
	};

	$N.gui = $N.gui || {};
	$N.gui.GeneralItem = GeneralItem;

}($N || {}));