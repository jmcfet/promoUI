/**
 * DoubleTextItem is an item Template used for selecting each item in the list
 * with a highlighter container.
 *
 * @class $N.gui.DoubleTextItem
 * @constructor
 * @extends $N.gui.TextItem
 * @requires $N.gui.Group
 * @requires $N.gui.Label
 * @requires $N.gui.AbstractListItem
 * @requires $N.gui.TextItem
 * @requires $N.gui.Util
 * @param {Object} docRef (DOM document)
 */
(function ($N) {
	function DoubleTextItem(docRef) {
		DoubleTextItem.superConstructor.call(this, docRef);
		this.isFocused = true;
		this.isHighlighted = false;
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

		this._channelNumber = new $N.gui.Label(this._docRef, this._container);
		this._channelNumber.configure({
			x: 60,
			y: 2,
			width: 1300,
			cssClass: "dialogSubtitle"
		});
		this._text = new $N.gui.Label(this._docRef, this._container);
		this._text.configure({
			x: 155,
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
	$N.gui.Util.extend(DoubleTextItem, $N.gui.TextItem);

	/**
	 * @method updateHighlight
	 */
	DoubleTextItem.prototype.updateHighlight = function () {
		if (this.isHighlighted && this.isFocused) {
			this._highlight.setCssClass("channelListItemHighlight");
			this._background.setCssClass("menuItemBackgroundFocus");
			this._background.show();
			this._highlight.show();
		} else {
			this._highlight.setCssClass("recordingsWindowBackground");
			this._background.setCssClass("menuItemBackgroundDefocus");
			this._background.hide();
			this._highlight.hide();
		}
	};

	/**
	 * @method highlight
	 */
	DoubleTextItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighlight
	 */
	DoubleTextItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};
	/**
	 * @method focus
	 */
	DoubleTextItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	DoubleTextItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};
	/**
	 * @method update
	 */
	DoubleTextItem.prototype.update = function (data) {
		if (data) {
			this._text.setText(this._dataMapper.getTitle(data));
			this._channelNumber.setText(this._dataMapper.getChannelNumber(data));
		}
		DoubleTextItem.superClass.update.call(this);
	};

	$N.gui = $N.gui || {};
	$N.gui.DoubleTextItem = DoubleTextItem;
}($N || {}));
