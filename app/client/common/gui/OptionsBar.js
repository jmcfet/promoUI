/**
 * OptionsBar is a simple extension of FixedList used to define some default / commonly used
 * behaviour and thereby reduce code duplication
 *
 * @class $N.gui.OptionsBar
 * @constructor
 * @extends $N.gui.FixedList
 * @requires $N.app.OptionsMenuItem
 * @requires $N.app.MenuUtil
 * @requires $N.gui.Util
 * @param {Object} docRef (DOM document)
 * @param {Object} [parent]
 */
(function ($N) {
	var OptionsBar = function (docRef, parent) {
		OptionsBar.superConstructor.call(this, docRef);

		this._itemTemplate = $N.gui.OptionsMenuItem;
		this._data.setWrapAround(false);
		this._itemConfig.movementPositions = $N.app.MenuUtil.getItemPositionsOptionsMenu();
		this.setOrientation($N.gui.FixedList.consts.ORIENTAION_HORIZONTAL);
		this.setDataMapper({
			getText: function (obj) {
				return obj.title;
			},
			getTitle: function (obj) {
				return obj.title;
			},
			getIcon: function (obj) {
				return obj.url;
			},
			getType: function (obj) {
				return obj.type;
			}
		});

		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(OptionsBar, $N.gui.FixedList);

	/**
	 * @method initialise
	 */
	OptionsBar.prototype.initialise = function () {
		OptionsBar.superClass.initialise.call(this, true);
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	OptionsBar.prototype.keyHandler = function (key) {
		var keys = $N.gui.FrameworkCore.getKeys(),
			handled = false;
		switch (key) {
		case this._previousKey:
			if (!this.isSelectedAtFirst()) {
				this.selectPrevious();
				handled = true;
			} else {
				handled = false;
			}
			break;
		case this._nextKey:
			if (!this.isSelectedAtLast()) {
				this.selectNext();
				handled = true;
			}
			break;
		case keys.KEY_RIGHT:
		case keys.KEY_OK:
			this._itemSelectedCallback(this._data.getSelectedItem());
			handled = true;
			break;
		}
		return handled;
	};

	$N.gui = $N.gui || {};
	$N.gui.OptionsBar = OptionsBar;
}($N || {}));
