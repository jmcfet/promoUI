/**
 * LongMenuItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a graphic and text
 * stacked in vertical formation.
 *
 * @class $N.gui.LongMenuItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 * @requires $N.gui.ListItem
 * @requires $N.gui.Group
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @param {Object} docRef
 */
(function ($N) {
	function LongMenuItem(docRef) {
		LongMenuItem.superConstructor.call(this, docRef);

		this.isFocused = true;
		this.isHighlighted = false;

		this._log = new $N.apps.core.Log("CommonGUI", "LongMenuItem");
		this._container = new $N.gui.ListItem(docRef);
		this._title = new $N.gui.Label(docRef, this._container);

		this._title.configure({
			x: 0,
			y: 38,
			cssClass: "logoMenuItemUnhighlighted"
		});

		this._rootSVGRef = this._container.getRootSVGRef();

		this.setAnimationDuration("200ms");
		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(LongMenuItem, $N.gui.AbstractListItem);

	/**
	 * Sets the width of the MenuItem.
	 *
	 * @method setWidth
	 *
	 * @param {Number} width The width of the MenuItem.
	 *
	 * @return {Object} The MenuItem object.
	 */
	LongMenuItem.prototype.setWidth = function (width) {
		this._width = width;
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
	LongMenuItem.prototype.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * @method updateHighlight
	 */
	LongMenuItem.prototype.updateHighlight = function () {
		if (this.isHighlighted && !this.isFocused) {
			this._title.setOpacity(0.7);
		} else {
			this._title.setOpacity(1);
		}
		if (this.isHighlighted) {
			this._title.setCssClass("logoMenuItemHighlighted");
		} else {
			this._title.setCssClass("logoMenuItemUnhighlighted");
		}
	};

	/**
	 * @method highlight
	 */
	LongMenuItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighlight
	 */
	LongMenuItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method focus
	 */
	LongMenuItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	LongMenuItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * Updates the data stored within the MenuItem.
	 *
	 * @method update
	 *
	 * @param {Object} data Object containing the new data.
	 */
	LongMenuItem.prototype.update = function (data) {
		this._log("update", "Enter");
		if (data) {
			this.unHighlight();
			this._title.setText(this._dataMapper.getTitle(data));
		}
		this._log("update", "Exit");
	};

	/**
	 * @method setCssClass
	 * @param {String} cssClass
	 */
	LongMenuItem.prototype.setCssClass = function (cssClass) {
		this._log("setCssClass", "Enter");
		this._title.setCssClass(cssClass);
		this._log("setCssClass", "Exit");
	};

	$N.gui = $N.gui || {};
	$N.gui.LongMenuItem = LongMenuItem;

}($N || {}));
