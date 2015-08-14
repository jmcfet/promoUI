/**
 * MultipleTitleSubtitleItem is a concrete implementation of AbstractListItem and
 * represents a list item object containing either one or two pairs
 * of Label objects to represent a key value like appearance
 * whereas the pairs are placed side by side
 * and each pair's content stacked in vertical formation.
 *
 * @class $N.gui.MultipleTitleSubtitleItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 * @requires $N.gui.ListItem
 * @requires $N.gui.Container
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @param {Object} docRef
 */
(function ($N) {

	function MultipleTitleSubtitleItem(docRef) {

		MultipleTitleSubtitleItem.superConstructor.call(this, docRef);
		this.isFocused = true;
		this.isHighlighted = false;

		this._container = new $N.gui.ListItem(docRef);
		this._container.configure({
			width: 661
		});

		this._background = new $N.gui.Container(docRef, this._container);
		this._background.configure({
			width: 660,
			height: 100,
			cssClass: "menuItemBackgroundFocus",
			visible: false
		});

		this._highlight = new $N.gui.Container(docRef, this._container);
		this._highlight.configure({
			x: 0,
			width: 660,
			height: 100,
			cssClass: "channelListItemHighlight",
			visible: false
		});

		this._firstTitle = new $N.gui.Label(this._docRef, this._container);
		this._firstTitle.configure({
			x: 27,
			y: 5,
			cssClass: "dialogSubtitle"
		});

		this._firstSubTitle = new $N.gui.Label(this._docRef, this._container);
		this._firstSubTitle.configure({
			x: 27,
			y: 50,
			cssClass: "menuSubTitle"
		});

		this._secondTitle = new $N.gui.Label(this._docRef, this._container);
		this._secondTitle.configure({
			x: 360,
			y: 5,
			width: 317,
			cssClass: "dialogSubtitle"
		});

		this._secondSubTitle = new $N.gui.Label(this._docRef, this._container);
		this._secondSubTitle.configure({
			x: 360,
			y: 50,
			width: 317,
			cssClass: "menuSubTitle"
		});

		this.setDataMapper({
			getFirstTitle: function (obj) {
				return obj.firstTitle;
			},
			getFirstSubTitle: function (obj) {
				return obj.firstSubTitle;
			},
			getSecondTitle: function (obj) {
				return obj.secondTitle;
			},
			getSecondSubTitle: function (obj) {
				return obj.secondSubTitle;
			}
		});

		this._rootSVGRef = this._container.getRootSVGRef();

		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(MultipleTitleSubtitleItem, $N.gui.AbstractListItem);

	var proto = MultipleTitleSubtitleItem.prototype;

	proto.setSecondTitleSubTitleData = function (data) {
		this.setFirstTitleWidth(317);
		this.setFirstSubTitleWidth(317);
		this._secondTitle.setText(this._dataMapper.getSecondTitle(data));
		this._secondSubTitle.setText(this._dataMapper.getSecondSubTitle(data));
	};

	/**
	 * @method setWidth
	 * @param {Object} width
	 * @return {Object} A reference to MultipleTitleSubtitleItem (this).
	 */
	proto.setWidth = function (width) {
		this._width = width;
		return this;
	};

	/**
	 * @method setHeight
	 * @param {Object} height
	 * @return {Object} A reference to MultipleTitleSubtitleItem (this).
	 */
	proto.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * @method updateHighlight
	 */
	proto.updateHighlight = function () {
		if (this.isHighlighted && this.isFocused) {
			this._highlight.setCssClass("channelListItemHighlight");
			this._background.setCssClass("menuItemBackgroundFocus");
			this._highlight.show();
			this._background.show();
		} else {
			this._background.setCssClass("menuItemBackgroundDefocus");
			this._highlight.hide();
			this._background.hide();
		}
	};

	/**
	 * @method highlight
	 */
	proto.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighlight
	 */
	proto.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method focus
	 */
	proto.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	proto.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	proto.update = function (data) {
		if (data) {
			this._firstTitle.setText(this._dataMapper.getFirstTitle(data));
			this._firstSubTitle.setText(this._dataMapper.getFirstSubTitle(data));
			if (this._dataMapper.getSecondTitle(data)) {
				this.setSecondTitleSubTitleData(data);
			} else {
				this.setFirstTitleWidth(661);
				this.setFirstSubTitleWidth(610);
				this._secondTitle.setText("");
				this._secondSubTitle.setText("");
			}
		}
	};

	/**
	 * Sets the width of the firstTitle.
	 * @method setFirstTitleWidth
	 * @param {String} width The width to be set on the title text label.
	 */
	proto.setFirstTitleWidth = function (width) {
		this._firstTitle.setWidth(width);
	};

	/**
	 * Sets the width of the firstSubTitle.
	 * @method setFirstSubTitleWidth
	 * @param {String} width The width to be set on the image.
	 */
	proto.setFirstSubTitleWidth = function (width) {
		this._firstSubTitle.setWidth(width);
	};

	/**
	 * Sets the value of the firstSubtitle.
	 * @method setFirstSubTitle
	 * @param {String} value, The firstSubtitle value to be set.
	 */
	proto.setFirstSubTitle = function (value) {
		this._firstSubTitle.setText(value);
	};

	/**
	 * Sets the value of the setSecondSubTitle.
	 * @method setSecondSubTitle
	 * @param {String} value, The setSecondSubTitle value to be set.
	 */
	proto.setSecondSubTitle = function (value) {
		this._secondSubTitle.setText(value);
	};

	$N.gui = $N.gui || {};
	$N.gui.MultipleTitleSubtitleItem = MultipleTitleSubtitleItem;
}($N || {}));