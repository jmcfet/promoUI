/**
 * MusicGenreItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a graphic and text
 * stacked in vertical formation.
 *
 * @class $N.gui.MusicGenreItem
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
	function MusicGenreItem(docRef) {

		MusicGenreItem.superConstructor.call(this, docRef);

		this._log = new $N.apps.core.Log("CommonGUI", "MusicGenreItem");
		this._container = new $N.gui.ListItem(docRef);
		this._image = new $N.gui.Image(docRef, this._container);
		this._text = new $N.gui.Label(docRef, this._container);

		this._text.configure({
			x: 136.5,
			y: 22.5,
			width: 420,
			cssClass: "musicGenreItem"
		});

		this._image.configure({
			x: 2,
			y: 2,
			width: 96,
			height: 96,
			quality: 1
		});

		this._rootSVGRef = this._container.getRootSVGRef();

		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(MusicGenreItem, $N.gui.AbstractListItem);

	/**
	 * Sets the width of the MusicGenreItem.
	 *
	 * @method setWidth
	 *
	 * @param {Number} width The width of the MusicGenreItem.
	 *
	 * @return {Object} The MusicGenreItem object.
	 */
	MusicGenreItem.prototype.setWidth = function (width) {
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
	 * Sets the height of the MusicGenreItem.
	 *
	 * @method setHeight
	 *
	 * @param {Number} height The height of the MusicGenreItem.
	 *
	 * @return {Object} The MusicGenreItem object.
	 */
	MusicGenreItem.prototype.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * Highlights the MusicGenreItem.
	 *
	 * @method highlight
	 */
	MusicGenreItem.prototype.highlight = function (instant) {
		var me = this;
		if (instant || !this._moveAnim) {
			me._text.setCssClass("musicGenreItemSeleted");
		} else {
			this._moveAnim.setAnimationEndCallback(function () {
				me._text.setCssClass("musicGenreItemSeleted");
			});
		}
	};

	/**
	 * Removes the highlight from the MusicGenreItem.
	 *
	 * @method unHighlight
	 */
	MusicGenreItem.prototype.unHighlight = function () {
		if (this._moveAnim) {
			this._moveAnim.setAnimationEndCallback(null);
		}
		this._text.setCssClass("musicGenreItem");
	};

	/**
	 * Updates the data stored within the MusicGenreItem.
	 *
	 * @method update
	 *
	 * @param {Object} data Object containing the new data.
	 */
	MusicGenreItem.prototype.update = function (data) {
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
	MusicGenreItem.prototype.setTextClass = function (cssClassName) {
		this._text.setCssClass(cssClassName);
	};

	/**
	 * Sets the width of the label that contains the text.
	 * @method setTextWidth
	 * @param {Number} width The new width to be applied to the label that contains the text.
	 */
	MusicGenreItem.prototype.setTextWidth = function (width) {
		this._text.setWidth(width);
	};

	$N.gui = $N.gui || {};
	$N.gui.MusicGenreItem = MusicGenreItem;

}($N || {}));