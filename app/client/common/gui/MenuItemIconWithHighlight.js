/**
 * MenuItemIconWithHighlight is an item Template used for selecting each item in the list
 * with a highlighter container.
 *
 * @class $N.gui.MenuItemIconWithHighlight
 * @constructor
 * @extends $N.gui.TextItem
 * @requires $N.gui.Group
 * @requires $N.gui.Container
 * @requires $N.gui.Label
 * @requires $N.gui.Image
 * @requires $N.gui.Util
 * @param {Object} docRef
 */
(function ($N) {
	function MenuItemIconWithHighlight(docRef) {

		MenuItemIconWithHighlight.superConstructor.call(this, docRef);

		this._container = new $N.gui.Group(this._docRef);
		this._container.setWidth(682);
		this._container.setHeight(54);

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
			x: 63,
			y: -1.5,
			width: 660,
			cssClass: "dialogSubtitle"
		});
		this._icon = new $N.gui.Image(this._docRef, this._container);

		this._icon.configure({

			x: 24,

			y: 12,

			width: 25,

			height: 25,

			href: "../../../customise/resources/images/%RES/icons/tick_17x17.png",

			visible: true

		});
		this.setDataMapper({
			getTitle: function (obj) {
				return obj.name;
			},
			getIcon: function (obj) {

				return obj.icon;
			}
		});

		this._rootSVGRef = this._container.getRootSVGRef();

		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(MenuItemIconWithHighlight, $N.gui.TextItem);

	/**

	 * @method updateHighlight

	 */

	MenuItemIconWithHighlight.prototype.updateHighlight = function () {

		if (this.isHighlighted && this.isFocused) {

			this._background.setCssClass("menuItemBackgroundFocus");

			this._background.show();

			this._highlight.show();

		} else {

			this._background.setCssClass("menuItemBackgroundDefocus");

			this._background.hide();

			this._highlight.hide();

		}

	};



	/**

	 * @method highlight

	 */

	MenuItemIconWithHighlight.prototype.highlight = function () {
		this.isHighlighted = true;

		this.updateHighlight();

	};


	/**

	 * @method updateIcon

	 */

	MenuItemIconWithHighlight.prototype.updateIcon = function (data) {

		if (data) {
			var href = this._dataMapper.getIcon(data);
			if (href) {
				this._icon.setHref(href);
				this._icon.show();
			} else {
				this._icon.hide();
			}
		}

	};


	/**

	 * @method update

	 */

	MenuItemIconWithHighlight.prototype.update = function (data) {

		if (data) {
			this._text.setText(this._dataMapper.getTitle(data));
			var href = this._dataMapper.getIcon(data);
			if (href) {
				this._icon.setHref(href);
				this._icon.show();
			} else {
				this._icon.hide();
			}
		}

	};


	/**

	 * @method unHighlight

	 */

	MenuItemIconWithHighlight.prototype.unHighlight = function () {
		this.isHighlighted = false;

		this.updateHighlight();

	};


	/**

	 * @method focus

	 */

	MenuItemIconWithHighlight.prototype.focus = function () {

		this.isFocused = true;

		this.updateHighlight();

	};


	/**

	 * @method defocus

	 */

	MenuItemIconWithHighlight.prototype.defocus = function () {
		this.isFocused = false;

		this.updateHighlight();

	};

	/**

	 * @method setTextWidth

	 */

	MenuItemIconWithHighlight.prototype.setTextWidth = function (width) {
		this._text.setWidth(width);
	};

	$N.gui = $N.gui || {};
	$N.gui.MenuItemIconWithHighlight = MenuItemIconWithHighlight;

}($N || {}));
