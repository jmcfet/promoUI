/**
 * @class $N.gui.MediaBrowserMenuItem
 * @constructor
 * @requires $N.gui.ListItem
 * @requires $N.gui.DelayedScrollingLabel
 * @requires $N.gui.Util
 * @extends $N.gui.TextItem
 *
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	function MediaBrowserMenuItem(docRef, parent) {
		MediaBrowserMenuItem.superConstructor.call(this, docRef);
		this.log = new $N.apps.core.Log("MediaBrowserMenuItem", "MediaBrowserMenuItem");
		this.FOLDER_X_POSITION = 85;
		this.TEXT_X_POSITION = 24;

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
			rounding: 1,
			visible: false
		});


		this._text = new $N.gui.DelayedScrollingLabel(this._docRef, this._container);
		this._text.configure({
			x: 24,
			y: 3,
			width: 660,

			height: 48,
			cssClass: "dialogSubtitle",
			duration: "250ms"
		});
		this._icon = new $N.gui.Image(this._docRef, this._container);

		this._icon.configure({
			x: 24,
			y: 7.5,
			width: 48,
			height: 31.5,
			href: "../../../customise/resources/images/%RES/icons/DVR_pasta_menor.png",
			visible: true
		});
		this.setDataMapper({
			getTitle: function (obj) {
				return obj.title;
			},
			getAdditionalIcon: function (obj) {
				return obj.foldericon;
			}
		});

		this._rootSVGRef = this._container.getRootSVGRef();

		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(MediaBrowserMenuItem, $N.gui.TextItem);

	/**
	 * @method updateHighlight
	 */

	MediaBrowserMenuItem.prototype.updateHighlight = function () {
		this.log("updateHighlight", "Enter");
		if (this.isHighlighted && this.isFocused) {
			this._background.setCssClass("menuItemBackgroundFocus");
			this._background.show();
			this._highlight.show();
			if (this._text.isVisible()) {
				this._text.start();
			}
		} else {
			this._background.setCssClass("menuItemBackgroundDefocus");
			this._background.hide();
			this._highlight.hide();
			if (this._text.isVisible()) {
				this._text.stop();
			}
		}
		this.log("updateHighlight", "Exit");
	};

	/**
	 * @method highlight
	 */

	MediaBrowserMenuItem.prototype.highlight = function () {
		this.log("highlight", "Enter");
		this.isHighlighted = true;
		this.updateHighlight();
		this.log("highlight", "Exit");

	};

	/**
	 * @method update
	 */

	MediaBrowserMenuItem.prototype.update = function (data) {
		this.log("update", "Enter");
		if (data) {
			this._text.setText(this._dataMapper.getTitle(data), true);
			var href = this._dataMapper.getAdditionalIcon(data);
			if (href !== "MOVETEXT") {
				this._icon.setHref(href);

				this._text.setWidth(537);
				this._text.setX(this.FOLDER_X_POSITION);
				this._icon.show();
			} else {

				this._text.setWidth(585);
				this._text.setX(this.TEXT_X_POSITION);
				this._icon.hide();
			}
		}
		this.log("update", "Exit");
	};


	/**
	 * @method unHighlight
	 */

	MediaBrowserMenuItem.prototype.unHighlight = function () {
		this.log("unHighlight", "Enter");
		this.isHighlighted = false;
		this.updateHighlight();
		this.log("unHighlight", "Exit");
	};

	/**
	 * @method focus
	 */

	MediaBrowserMenuItem.prototype.focus = function () {
		this.log("focus", "Enter");
		this.isFocused = true;
		this.updateHighlight();
		this.log("focus", "Exit");
	};

	/**
	 * @method defocus
	 */

	MediaBrowserMenuItem.prototype.defocus = function () {
		this.log("defocus", "Enter");
		this.isFocused = false;
		this.updateHighlight();
		this.log("defocus", "Exit");
	};

	$N.gui = $N.gui || {};
	$N.gui.MediaBrowserMenuItem = MediaBrowserMenuItem;
}($N || {}));

