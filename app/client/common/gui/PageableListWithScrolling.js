var $N = $N || {};
$N.app = $N.app || {};

/**
 * @class $N.gui.PageableListWithScrolling
 * @constructor
 * @extends $N.gui.PageableList
 * @requires $N.gui.Container
 * @requires $N.gui.MaskIcon
 * @requires $N.gui.Util
 * @param {Object} docRef
 * @param {Object} [parent]
 */
(function ($N) {
	var PageableListWithScrolling = function (docRef, parent) {
		PageableListWithScrolling.superConstructor.call(this, docRef, parent);
		this._log = new $N.apps.core.Log("CommonGUI", "PageableListWithScrolling");
		this._data = new $N.gui.CyclicPagingListWithScrolling();
	};
	$N.gui.Util.extend(PageableListWithScrolling, $N.gui.PageableList);

	$N.gui = $N.gui || {};
	$N.gui.PageableListWithScrolling = PageableListWithScrolling;

	/**
	 * @method selectRowAtIndex
	 * @param {Integer} index
	 * @param {Number} scrollDirection
	 * @param {Boolean} isScroll
	 */
	PageableListWithScrolling.prototype.selectRowAtIndex = function (index, scrollDirection, isScroll) {
		this._getSelectedObject().unHighlight();
		this._data.selectRowAtIndex(index, scrollDirection, isScroll);
		this._getSelectedObject().highlight();
	};

	/**
	 * @method resetScrollDirection
	 */
	PageableListWithScrolling.prototype.resetScrollDirection = function () {
		this._data.resetScrollDirection();
	};

}($N || {}));
