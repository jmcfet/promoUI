/**
 * OptionsMenuItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing an optional graphic and text
 * stacked in vertical formation. It is intended to me used by the OptionsMenu gui component
 *
 * @class $N.gui.OptionsMenuItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 * @requires $N.gui.Container
 * @requires $N.gui.Image
 * @requires $N.gui.TextArea
 * @requires $N.gui.Util
 * @param {Object} docRef
 */
(function ($N) {

	function OptionsMenuItem(docRef) {
		OptionsMenuItem.superConstructor.call(this, docRef);

		this._container = new $N.gui.ListItem(this._docRef);
		this._topContainer = new $N.gui.Container(this._docRef, this._container);
		this._icon = new $N.gui.Image(this._docRef, this._topContainer);
		this._bottomContainer = new $N.gui.Container(this._docRef, this._container);
		this._title = new $N.gui.TextArea(this._docRef, this._bottomContainer);

		this._container.configure({
			width: 121.5,
			height: 121.5,
			cssClass: "flexContainerColumn optionsMenuItem",
			cssHighlightClass: "flexContainerColumn optionsMenuItemHighlighted"
		});

		this._topContainer.configure({
			cssClass : "optionsMenuItemTop"
		});

		this._icon.configure({
			cssClass: "optionsMenuItemIcon",
			quality: 1
		});

		this._bottomContainer.configure({
			cssClass : "optionsMenuItemBottom"
		});

		this._title.configure({
			cssClass: "optionsMenuItemTitle"
		});

		this.setDataMapper({
			getTitle: function (obj) {
				return obj.title;
			},
			getIcon: function (obj) {
				return obj.url;
			}
		});

		this._rootSVGRef = this._container.getRootSVGRef();
	}

	$N.gui.Util.extend(OptionsMenuItem, $N.gui.AbstractListItem);

	/**
	 * @method highlight
	 */
	OptionsMenuItem.prototype.highlight = function () {
		this._container.highLight();
	};

	/**
	 * @method unHighlight
	 */
	OptionsMenuItem.prototype.unHighlight = function () {
		this._container.unHighLight();
	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	OptionsMenuItem.prototype.update = function (data) {
		var href,
			type;
		if (data) {
			href = this._dataMapper.getIcon(data);
			type = this._dataMapper.getType(data);
			this._icon.setHref(href);
			this._title.setText(this._dataMapper.getTitle(data));
			if (type === "smallerText") {
				this._title.setCssClass("optionsMenuItemTitleSmaller");
			}
		}
	};

	/**
	 * @method getWidth
	 */
	OptionsMenuItem.prototype.getWidth = function () {
		return this._container.getWidth();
	};

	$N.gui = $N.gui || {};
	$N.gui.OptionsMenuItem = OptionsMenuItem;

}($N || {}));
