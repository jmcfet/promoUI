/**
 * @class NowNode
 * @constructor
 */
var $N = window.parent.$N;
(function ($N) {
	var NowNode = function (data, parent) {
		this.parent = null;
		this.children = [];
		this._data = data;
		this.assetCount = 0;

		if (parent) {
			this.parent = parent;
			this.parent.children.push(this);
		}
	};

	$N.gui.NowNode = NowNode;
}($N || {}));