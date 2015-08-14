/**
 * NowKidsItem is a simple extension of LongMenuItem which uses a different highlight css class
 *
 * @class NowKidsItem
 * @extends LongMenuItem
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowKidsItem = function (docRef, parent) {
		NowKidsItem.superConstructor.call(this, docRef);

		this.isMaster = true;
		this._title.setCssClass("nowKidsMenuItem");
	};
	$N.gui.Util.extend(NowKidsItem, $N.gui.LongMenuItem);

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	NowKidsItem.prototype.setWidth = function (width) {
		this._width = width;
		this._title.setWidth(width);
	};

	/**
	 * @method setIsMaster
	 * @param {bool} isMaster
	 */
	NowKidsItem.prototype.setIsMaster = function (isMaster) {
		this.isMaster = isMaster;
	};

	/**
	 * @method updateHighlight
	 */
	NowKidsItem.prototype.updateHighlight = function () {
		if (this.isHighlighted) {
			if (this.isFocused) {
				this._title.setCssClass("nowKidsMenuItemHighlighted");
				this._title.setY(4.5);
			} else {
				if (this.isMaster) {
					this._title.setCssClass("nowKidsMenuItemDefocusHighlighted");
					this._title.setY(4.5);
				} else {
					this._title.setCssClass("nowKidsMenuItem");
					this._title.setY(0);
				}
			}
		} else {
			this._title.setCssClass("nowKidsMenuItem");
			this._title.setY(0);
		}
	};

	$N.gui.NowKidsItem = NowKidsItem;
}($N || {}));
