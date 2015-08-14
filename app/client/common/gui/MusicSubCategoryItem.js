/**
 * MusicSubCategoryItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing an optional icon and text
 * stacked in horizontal formation.
 *
 * @class $N.gui.MusicSubCategoryItem
 * @constructor
 * @namespace $N.gui
 * @extends $N.gui.AbstractListItem
 * @requires $N.gui.ListItem
 * @requires $N.gui.Image
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @param {Object} docRef (DOM document)
 */
(function ($N) {
	function MusicSubCategoryItem(docRef) {

		this._log = new $N.apps.core.Log("CommonGUI", "MusicSubCategoryItem");
		MusicSubCategoryItem.superConstructor.call(this, docRef);

		this._container = new $N.gui.ListItem(this._docRef);
		this._container.configure({
			width: 645
		});

		this._icon = new $N.gui.Image(this._docRef, this._container);
		this._text = new $N.gui.Label(this._docRef, this._container);

		this._icon.configure({
			x: 0,
			y: 20
		});

		this._text.configure({
			x: 60,
			y: 22.5,
			cssClass: "musicSubCategoryItem"
		});

		this.setDataMapper({
			getText: function (obj) {
				return obj.name;
			},
			getIcon: function (obj) {
				return obj.icon;
			}
		});

		this._rootSVGRef = this._container.getRootSVGRef();

		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(MusicSubCategoryItem, $N.gui.AbstractListItem);

	/**
	 * Sets the width of the MusicSubCategoryItem.
	 * @method setWidth
	 * @param {Object} width The width of the MusicSubCategoryItem.
	 * @return {Object} The MusicSubCategoryItem object.
	 */
	MusicSubCategoryItem.prototype.setWidth = function (width) {
		this._width = width;
		return this;
	};

	/**
	 * Sets the height of the MusicSubCategoryItem.
	 * @method setHeight
	 * @param {Object} height The height of the MusicSubCategoryItem.
	 * @return {Object} The MusicSubCategoryItem object.
	 */
	MusicSubCategoryItem.prototype.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * Sets the width of the text Label.
	 * @method setWidth
	 * @param {Object} width The width of the text Label.
	 * @return {Object} The MusicSubCategoryItem object.
	 */
	MusicSubCategoryItem.prototype.setTextWidth = function (width) {
		this._text.setWidth(width);
		return this;
	};

	/**
	 * Sets the height of the text Label.
	 * @method setHeight
	 * @param {Object} height The height of the text Label.
	 * @return {Object} The MusicSubCategoryItem object.
	 */
	MusicSubCategoryItem.prototype.setTextHeight = function (height) {
		this._text.setHeight(height);
		return this;
	};

	/**
	 * Highlights the MusicSubCategoryItem.
	 * @method highlight
	 */
	MusicSubCategoryItem.prototype.highlight = function (instant) {
		var me = this;
		if (instant || !this._moveAnim) {
			me._text.setCssClass("musicSubCategoryItemSeleted");
		} else {
			this._moveAnim.setAnimationEndCallback(function () {
				me._text.setCssClass("musicSubCategoryItemSeleted");
			});
		}
	};

	/**
	 * Removes the highlight from the MusicSubCategoryItem.
	 * @method unHighlight
	 */
	MusicSubCategoryItem.prototype.unHighlight = function () {
		if (this._moveAnim) {
			this._moveAnim.setAnimationEndCallback(null);
		}
		this._text.setCssClass("musicSubCategoryItem");
	};

	/**
	 * Set the css for the MusicSubCategoryItem.
	 * @method setTextCssClass
	 * @param {string} cssClass
	 */
	MusicSubCategoryItem.prototype.setTextCssClass = function (cssClass) {
		this._text.setCssClass(cssClass);
	};

	/**
	 * Updates the data stored within the MusicSubCategoryItem.
	 * @method update
	 * @param {Object} data Object containing the new data.
	 */
	MusicSubCategoryItem.prototype.update = function (data) {
		this._log("update", "Enter");
		if (data) {
			this._text.setText(this._dataMapper.getText(data));
			var href = this._dataMapper.getIcon(data);
			if (href) {
				this._icon.setHref(href);
				this._icon.show();
			} else {
				this._icon.hide();
			}
		}
		this._log("update", "Exit");
	};

	$N.gui = $N.gui || {};
	$N.gui.MusicSubCategoryItem = MusicSubCategoryItem;

}($N || {}));
