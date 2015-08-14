/**
 * NowMenuItem is a simple extension of LongMenuItem which uses a different highlight css class
 *
 * @class $N.gui.NowMenuItem
 * @constructor
 * @extends $N.gui.LongMenuItem
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowMenuItem = function (docRef, parent) {
		NowMenuItem.superConstructor.call(this, docRef);

		this.isMaster = true;
		this._title.setCssClass("nowMenuItem");
	};
	$N.gui.Util.extend(NowMenuItem, $N.gui.LongMenuItem);

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	NowMenuItem.prototype.setWidth = function (width) {
		this._width = width;
		this._title.setWidth(width);
	};

	/**
	 * @method setIsMaster
	 * @param {bool} isMaster
	 */
	NowMenuItem.prototype.setIsMaster = function (isMaster) {
		this.isMaster = isMaster;
	};

	/**
	 * @method updateHighlight
	 */
	NowMenuItem.prototype.updateHighlight = function () {
		if (this.isHighlighted) {
			if (this.isFocused) {
				this._title.setCssClass("medium extraLarge ellipsis nowMenuItemHighlighted");
				this._title.setY(-3.0);
			} else {
				if (this.isMaster) {
					this._title.setCssClass("medium extraLarge ellipsis");
					this._title.setY(-3.0);
				} else {
					this._title.setCssClass("medium large ellipsis nowGrey");
					this._title.setY(0);
				}
			}
		} else {
			this._title.setCssClass("medium large ellipsis nowGrey");
			this._title.setY(0);
		}
	};

	$N.gui.NowMenuItem = NowMenuItem;
}($N || {}));