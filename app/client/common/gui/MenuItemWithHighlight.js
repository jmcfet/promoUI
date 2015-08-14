/**
 * MenuItemWithHighlight is an item Template used for selecting each item in the list
 * with a highlighter container.
 *
 * @class $N.gui.MenuItemWithHighlight
 * @constructor
 * @namespace $N.gui
 * @extends $N.gui.TextItem
 * @requires $N.gui.ListItem
 * @requires $N.gui.Container
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @param {Object} docRef (DOM document)
 */
(function ($N) {
	function MenuItemWithHighlight(docRef) {
		MenuItemWithHighlight.superConstructor.call(this, docRef);

		this.isFocused = true;
		this.isHighlighted = false;

		this._container = new $N.gui.ListItem(this._docRef);
		this._container.configure({
			width: 682
		});

		this._background = new $N.gui.Container(docRef, this._container);

		this._background.configure({
			width: 660,
			height: 49,
			cssClass: "menuItemBackgroundFocus",
			visible: false

		});
		this._highlight = new $N.gui.Container(docRef, this._container);
		this._highlight.configure({
			x: 0,
			width: 660,
			height: 49,
			cssClass: "channelListItemHighlight",
			visible: false
		});


		this._text = new $N.gui.Label(this._docRef, this._container);
		this._text.configure({
			x: 27,
			y: 0,
			width: 1300,
			cssClass: "dialogSubtitle"
		});

		this.setDataMapper({
			getText: function (obj) {
				return obj.name;
			}
		});

		this._rootSVGRef = this._container.getRootSVGRef();

		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(MenuItemWithHighlight, $N.gui.TextItem);



	/**
	 * @method updateHighlight
	 */
	MenuItemWithHighlight.prototype.updateHighlight = function () {
		if (this.isHighlighted && this.isFocused) {
			this._highlight.setCssClass("channelListItemHighlight");

			this._background.setCssClass("menuItemBackgroundFocus");

			this._background.show();
			this._highlight.show();
		} else {
			this._highlight.setCssClass("recordingsWindowBackgroundActivated");

			this._background.setCssClass("menuItemBackgroundDefocus");

			this._background.hide();
			this._highlight.hide();
		}
	};

	/**
	 * @method highlight
	 */
	MenuItemWithHighlight.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighlight
	 */
	MenuItemWithHighlight.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method focus
	 */
	MenuItemWithHighlight.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	MenuItemWithHighlight.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	$N.gui = $N.gui || {};
	$N.gui.MenuItemWithHighlight = MenuItemWithHighlight;
}($N || {}));
