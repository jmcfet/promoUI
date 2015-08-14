/**
 * DeviceItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a graphic and text
 * stacked in vertical formation.
 *
 * @class DeviceItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 * @requires $N.gui.Group
 * @requires $N.gui.Label
 * @requires $N.gui.AbstractListItem
 * @requires $N.gui.Util
 * @param {Object} docRef (DOM document)
 */
(function ($N) {
	function DeviceItem(docRef) {

		DeviceItem.superConstructor.call(this, docRef);

		this._container = new $N.gui.ClippedGroup(this._docRef);
		this._container.setWidth(1300);
		this._container.setHeight(50);
		this._text = new $N.gui.Label(this._docRef, this._container);

		this._text.configure({
			x: 0,
			y: 35,
			width: 1300,
			cssClass: "selected"
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

	$N.gui.Util.extend(DeviceItem, $N.gui.AbstractListItem);

	/**
	 * Sets the width of the DeviceItem.
	 * @method setWidth
	 * @param {Object} width The width of the DeviceItem.
	 * @return {Object} The DeviceItem object.
	 */
	DeviceItem.prototype.setWidth = function (width) {
		this._width = width;
		return this;
	};

	/**
	 * Sets the height of the DeviceItem.
	 * @method setHeight
	 * @param {Object} height The height of the DeviceItem.
	 * @return {Object} The DeviceItem object.
	 */
	DeviceItem.prototype.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * Highlights the DeviceItem.
	 *
	 * @method highlight
	 */
	DeviceItem.prototype.highlight = function (instant) {
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
	 * Removes the highlight from the DeviceItem.
	 *
	 * @method unHighlight
	 */
	DeviceItem.prototype.unHighlight = function () {
		if (this._moveAnim) {
			this._moveAnim.setAnimationEndCallback(null);
		}
		this._text.setCssClass("selected");
	};

	/**
	 * Updates the data stored within the DeviceItem.
	 *
	 * @method update
	 *
	 * @param {Object} data Object containing the new data.
	 */
	DeviceItem.prototype.update = function (data) {
		if (data) {
			this._text.setText(this._dataMapper.getTitle(data));
		}
	};

	/**
	 * Changes the CSS style that is applied to the text.
	 * @method setCssClass
	 * @param {String} className The name of the CSS class to be applied to the text.
	 */
	DeviceItem.prototype.setCssClass = function (className) {
		this._text.setCssClass(className);
	};

	/**
	 * Sets the width of the label that contains the text.
	 * @method setTextWidth
	 * @param {Number} width The new width to be applied to the label that contains the text.
	 */
	DeviceItem.prototype.setTextWidth = function (width) {
		this._text.configure({
			width: width
		});
	};

	/**
	 * Sets the width of the container that contains the text.
	 * @method setContainerWidth
	 * @param {Number} width The new width to be applied to the container
	 */
	DeviceItem.prototype.setContainerWidth = function (width) {
		this._container.setWidth(width);
	};

	$N.gui = $N.gui || {};
	$N.gui.DeviceItem = DeviceItem;
}($N || {}));