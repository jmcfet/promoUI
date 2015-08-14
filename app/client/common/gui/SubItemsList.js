/**
 * @class $N.gui.SubItemsList
 * @constructor
 * @extends $N.gui.CentralPivotList
 * @requires $N.gui.Util
 * @param {Object} docRef Document relating the DOM
 * @param {Object} [parent]
 */
(function ($N) {
	function SubItemsList(docRef, parent) {
		SubItemsList.superConstructor.call(this, docRef);

		var _expandPosition = -1,
			_expandCount = 0,
			expandCallback = function () {},
			shrinkCallback = function () {};
	}
	$N.gui.Util.extend(SubItemsList, $N.gui.CentralPivotList);

	var proto = SubItemsList.prototype;

	/**
	 * Sets the behaviour to execute on expanding a folder
	 *
	 * @method setExpandCallback
	 * @param {Function} callback
	 */
	proto.setExpandCallback = function (callback) {
		this.expandCallback = callback;
	};

	/**
	 * Sets the behaviour to execute on shrinking a folder
	 *
	 * @method setShrinkCallback
	 * @param {Function} callback
	 */
	proto.setShrinkCallback = function (callback) {
		this.shrinkCallback = callback;
	};

	/**
	 * Expands a folder at the provided index. This function first calls shrinkSubList()
	 *
	 * @method expandAtIndex
	 * @param {int} index The index to expand from
	 */
	proto.expandAtIndex = function (index) {
		this.shrinkSubList();

		var data = this.getData(),
			subRecordings = data[index - 1].subRecordings,
			selectedItemIndex;

		if (subRecordings) {
			selectedItemIndex = this.getSelectedItemIndex();

			Array.prototype.splice.apply(data, [index, 0].concat(subRecordings));
			this._data.setData(data);

			this._expandPosition = index;
			this._expandCount = subRecordings.length;

			if (selectedItemIndex > this._expandPosition) {
				selectedItemIndex = selectedItemIndex + this._expandCount;
			}
			this.selectItemAtIndex(selectedItemIndex);

			this.expandCallback(index);
		}
	};

	/**
	 * Shrinks the expanded folder (if there is one)
	 *
	 * @method shrinkSubList
	 */
	proto.shrinkSubList = function () {
		var data,
			selectedItemIndex;

		if (this._expandCount > 0) {
			data = this.getData();
			selectedItemIndex = this.getSelectedItemIndex();

			Array.prototype.splice.apply(data, [this._expandPosition, this._expandCount]);
			this._data.setData(data);

			if (selectedItemIndex > this._expandPosition) {
				selectedItemIndex = Math.max(this._expandPosition, selectedItemIndex - this._expandCount);
			}
			this.selectItemAtIndex(selectedItemIndex);

			this._expandPosition = -1;
			this._expandCount = 0;

			this.shrinkCallback();
		}
	};

	/**
	 * Toggles expand/shrink on the currently selected item
	 *
	 * @method toggleExpandOnSelection
	 */
	proto.toggleExpandOnSelection = function () {
		if (this.getSelectedItemIndex() === this._expandPosition) {
			this.shrinkSubList();
		} else {
			this.expandAtIndex(this.getSelectedItemIndex());
		}
	};

	/**
	 * Augments existing behaviour such that navigating outside of the expanded episodes collapses them
	 *
	 * @method selectNext
	 */
	proto.selectNext = function () {
		if (!this._data.isSelectedAtLast() || this._data.getWrapAround()) {
			if ((this._expandCount > 0) && (this.getSelectedItemIndex() >= (this._expandPosition + this._expandCount))) {
				this.shrinkSubList();
				this.displayData();
			}
		}
		SubItemsList.superClass.selectNext.call(this);
	};

	/**
	 * Augments existing behaviour such that navigating outside of the expanded episodes collapses them
	 *
	 * @method selectPrevious
	 */
	proto.selectPrevious = function () {
		if (!this._data.isSelectedAtFirst() || this._data.getWrapAround()) {
			if ((this._expandCount > 0) && (this.getSelectedItemIndex() <= this._expandPosition)) {
				this.shrinkSubList();
				this.displayData();
			}
		}
		SubItemsList.superClass.selectPrevious.call(this);
	};

	/**
	 * Augments existing behaviour such that our tracking variables are reset on receiving new data
	 *
	 * @method setData
	 * @param {Array} data The data used to populate the list.
	 * @return {Object} The SubItemsList.
	 */
	proto.setData = function (data) {
		SubItemsList.superClass.setData.call(this, data);
		this._expandPosition = -1;
		this._expandCount = 0;
		return this;
	};

	SubItemsList.consts = $N.gui.CentralPivotList.consts;

	$N.gui = $N.gui || {};
	$N.gui.SubItemsList = SubItemsList;
}($N || {}));