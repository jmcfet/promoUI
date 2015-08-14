/**
 * PurchaseListItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing a text and a sub text
 * @class $N.gui.PurchaseListItem
 * @constructor
 * @extends $N.gui.MenuItemWithHighlight
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @param {Object} docRef DOM document
 */
(function ($N) {
	function PurchaseListItem(docRef) {

		PurchaseListItem.superConstructor.call(this, docRef);

		this._container.configure({
			width: 1376,
			height: 102,
			y: -50
		});

		this._background.configure({
			x: 24,
			y: 2,
			width: 1290,
			height: 98,
			cssClass: "menuItemBackgroundFocus",
			visible: false
		});

		this._highlight.configure({
			x: 24,
			y: 2,
			width: 1290,
			height: 98,
			cssClass: "channelListItemHighlight",
			visible: false
		});

		this._title = new $N.gui.Label(this._docRef, this._container);
		this._title.configure({
			x: 50,
			y: 9,
			width: 1100,
			cssClass: "synopsisXSmall colorCCCCCC"
		});

		this._subTitle = new $N.gui.Label(this._docRef, this._container);
		this._subTitle.configure({
			x: 50,
			y: 48,
			width: 1100,
			cssClass: "synopsisSmall colorCCCCCC"
		});

		this._text.configure({
			x: 1160,
			y: 29,
			width: 130,
			cssClass: "synopsisSmall colorA3A3A3 rightAlign"
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

	$N.gui.Util.extend(PurchaseListItem, $N.gui.MenuItemWithHighlight);

	/**
	 * @method update
	 */
	PurchaseListItem.prototype.update = function (data) {
		if (data) {
			this._title.setText(this._dataMapper.getTitle(data));
			this._subTitle.setText(this._dataMapper.getSubTitle(data));
			this._text.setText(this._dataMapper.getAdditionalText(data));
		}
	};

	/**
	 * @method updateHighlight
	 */
	PurchaseListItem.prototype.updateHighlight = function () {
		PurchaseListItem.superClass.updateHighlight.call(this);
		if (this.isHighlighted && this.isFocused) {
			this._title.setCssClass("synopsisXSmall");
			this._subTitle.setCssClass("PPVHistoryEventNameFocused");
			this._text.setCssClass("PPVHistoryEventName rightAlign");
		} else {
			this._title.setCssClass("synopsisXSmall colorCCCCCC");
			this._subTitle.setCssClass("PPVHistoryEventName colorCCCCCC");
			this._text.setCssClass("PPVHistoryEventName colorA3A3A3 rightAlign");
		}
	};

	$N.gui = $N.gui || {};
	$N.gui.PurchaseListItem = PurchaseListItem;
}($N || {}));
