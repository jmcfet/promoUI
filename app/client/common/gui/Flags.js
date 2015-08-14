/**
 * @class $N.gui.Flags
 * @constructor
 * @namespace $N.gui
 * @extends $N.gui.GUIObject
 * @requires $N.gui.Group
 * @requires $N.gui.Util
 * @param {Object} docRef Document relating the DOM
 * @param {Object} parent Optional parent GUI object to attach to
 */
(function ($N) {

	function Flags(docRef, parent) {

		Flags.superConstructor.call(this, docRef);

		this._log = new $N.apps.core.Log("CommonGUI", "Flags");
		this._container = new $N.gui.Group(docRef);
		this._flags = [];
		this._maxFlags = 5;
		this._flagWidth = 37.5;
		this._flagHeight = 18;
		this._padding = 6;
		this._flagCount = 0;

		this._rootSVGRef = this._container.getRootSVGRef();

		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(Flags, $N.gui.GUIObject);

	Flags.prototype.setMaxFlags = function (numberOfFlags) {
		this._maxFlags = numberOfFlags;
	};

	Flags.prototype.setFlagHeight = function (height) {
		this._flagHeight = height;
	};

	Flags.prototype.setFlagWidth = function (width) {
		this._flagWidth = width;
	};

	Flags.prototype.setPadding = function (padding) {
		this._padding = padding;
	};

	Flags.prototype.initialise = function () {
		this._log("initialise", "Enter");
		var i,
			me = this;
		for (i = 0; i < this._maxFlags; i++) {
			this._flags[i] = new $N.gui.Image(this._docRef, this._container);
			this._flags[i].configure({
				x: (me._flagWidth + me._padding) * i,
				y: 0,
				width: me._flagWidth,
				height: me._flagHeight,
				visible: false
			});
		}
		this._log("initialise", "Exit");
	};

	Flags.prototype.setFlags = function (flagUrlArray) {
		this._log("setFlags", "Enter");
		flagUrlArray = flagUrlArray || [];
		var i;
		for (i = 0; i < this._maxFlags; i++) {
			if (flagUrlArray[i]) {
				this._flags[i].setHref(flagUrlArray[i]);
				this._flags[i].show();
			} else {
				this._flags[i].hide();
			}
		}

		this._flagCount = flagUrlArray.length;
		this._log("setFlags", "Exit");
	};

	/**
	 * Returns the width of the flags GUI component, depending on the number of flags displayed.
	 * @method getWidth
	 * @returns {Number} Width of the GUI component.
	 */
	Flags.prototype.getWidth = function () {
		return (this._flagWidth + this._padding) * this._flagCount;
	};

	$N.gui = $N.gui || {};
	$N.gui.Flags = Flags;

}($N || {}));


