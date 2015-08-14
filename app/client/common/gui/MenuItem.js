/**
 * MenuItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a graphic and text
 * stacked in vertical formation.
 *
 * @class $N.gui.MenuItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 * @requires $N.gui.Layer
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @param {Object} docRef
 */
(function ($N) {
	function MenuItem(docRef) {
		MenuItem.superConstructor.call(this, docRef);
		this.DEFAULT_WIDTH = 254;
		this._log = new $N.apps.core.Log("CommonGUI", "MenuItem");
		this._width = this.DEFAULT_WIDTH;
		this._height = 50;
		this._container = new $N.gui.Layer(this._docRef);
		this._container.setWidth(this._width);
		this._container.setHeight(this._height);
		this._title = new $N.gui.Label(this._docRef, this._container);

		this._title.configure({
			x: this._width,
			y: 38,
			width: this._width,
			cssClass: "menuItem"
		});

		this.setDataMapper({
			getText: function (obj) {
				return obj.name;
			}
		});

		this._rootSVGRef = this._container.getRootSVGRef();

		this.setAnimationDuration("200ms");
		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(MenuItem, $N.gui.AbstractListItem);

	/**
	 * Sets the width of the MenuItem.
	 * @method setWidth
	 *
	 * @param {Number} width The width of the MenuItem.
	 * @return {Object} The MenuItem object.
	 */
	MenuItem.prototype.setWidth = function (width) {
		this._width = width;
		this._container.setWidth(width);
		this._title.setWidth(width);
		return this;
	};

	/**
	 * Sets the alignment of the MenuItem.
	 * @method setAlignment
	 *
	 * @param {String} alignment Accepts value "left" for left-align, otherwise aligns right
	 * @return {Object} The MenuItem object.
	 */
	MenuItem.prototype.setAlignment = function (alignment) {
		if (alignment === "left") {
			this._title.configure({
				x: 0,
				cssClass: "menuItemLeft"
			});
		} else {
			this._title.configure({
				x: this._width,
				cssClass: "menuItem"
			});
		}
		return this;
	};

	/**
	 * Sets the height of the MenuItem.
	 *
	 * @method setHeight
	 *
	 * @param {Number} height The height of the MenuItem.
	 *
	 * @return {Object} The MenuItem object.
	 */
	MenuItem.prototype.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * Highlights the MenuItem.
	 *
	 * @method highlight
	 * @param {Boolean} instant True if the highlight action takes place instantly.
	 */
	MenuItem.prototype.highlight = function (instant) {
		this._log("highlight", "Enter");
		this._log("highlight", "Exit");
	};

	/**
	 * Removes the highlight from the MenuItem.
	 *
	 * @method unHighlight
	 */
	MenuItem.prototype.unHighlight = function () {
		this._log("unHighlight", "Enter");
		this._log("unHighlight", "Exit");
	};

	/**
	 * Updates the data stored within the MenuItem.
	 *
	 * @method update
	 *
	 * @param {Object} data Object containing the new data.
	 */
	MenuItem.prototype.update = function (data) {
		this._log("update", "Enter");
		if (data) {
			var textArray = this._dataMapper.getTitle(data).split(' '),
				SPLIT = 1,
				MAX_CHAR = 12,
				text = "",
				i;
			if (textArray.length > SPLIT && this._width <= this.DEFAULT_WIDTH) {
				for (i = 0; i < textArray.length; i++) {
					if ((text.length + textArray[i].length) < MAX_CHAR) {
						text += textArray[i] + " ";
					} else {
						break;
					}
				}
				this._title.setText(text);
			} else {
				this._title.setText(this._dataMapper.getTitle(data));
			}
		}
		this._log("update", "Exit");
	};

	/**
	 * Moves the ListItem to the next position defined in
	 * the movementPositions list and applies fade if enabled.
	 * @method moveToNext
	 */
	MenuItem.prototype.moveToNext = function (instant) {
		if (!instant) {
			instant = this._movementPositions.isSelectedAtLast();
		}
		this._movementPositions.selectNext();
		var next = this._movementPositions.getSelectedItem();
		this._moveItem(next, instant);
	};

	/**
	 * Moves the ListItem to the previous position defined in
	 * the movementPositions list and applies fade if enabled.
	 * @method moveToPrevious
	 */
	MenuItem.prototype.moveToPrevious = function (instant) {
		if (!instant) {
			instant = this._movementPositions.isSelectedAtFirst();
		}
		this._movementPositions.selectPrevious();
		var next = this._movementPositions.getSelectedItem();
		this._moveItem(next, instant);
	};

	$N.gui = $N.gui || {};
	$N.gui.MenuItem = MenuItem;

}($N || {}));