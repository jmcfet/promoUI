/**
 * @class $N.gui.NowMyContentMenuItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	var NowMyContentMenuItem = function (docRef, parent) {
		NowMyContentMenuItem.superConstructor.call(this, docRef);

		this.isFocused = true;
		this.isHighlighted = false;

		this._container = new $N.gui.ListItem(this._docRef);
		this._background = new $N.gui.Container(this._docRef, this._container);
		this._highlight = new $N.gui.Container(this._docRef, this._container);
		this._title = new $N.gui.SpanLabel(this._docRef, this._container);
		this._expiry = new $N.gui.Label(this._docRef, this._container);

		this._width = 1728;
		this._EXPIRY_BUFFER = 429;
		this._EXPIRY_WIDTH = 355.5;

		this._background.configure({
			width: this._width,
			height: 50,
			cssClass: "nowMyContentItemBackground"
		});
		this._highlight.configure({
			width: this._width,
			height: 50,
			cssClass: "nowMyContentItemHighlight",
			rounding: 1,
			visible: false
		});
		this._title.configure({
			x: 24,
			width: this._width - this._EXPIRY_BUFFER,
			cssClass: "nowMyContentItemText",
			spanCssClass: "nowMyContentSeriesText"
		});
		this._expiry.configure({
			x: this._width - this._EXPIRY_WIDTH,
			width: 331.5,
			cssClass: "nowMyContentItemText"
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};
	$N.gui.Util.extend(NowMyContentMenuItem, $N.gui.AbstractListItem);

	/**
	 * @method setWidth
	 */
	NowMyContentMenuItem.prototype.setWidth = function (width) {
		this._background.setWidth(width);
		this._highlight.setWidth(width);
		this._title.setWidth(width - this._EXPIRY_BUFFER);
		this._expiry.setX(width - this._EXPIRY_WIDTH);
		this._width = width;
	};

	/**
	 * @method updateHighlight
	 */
	NowMyContentMenuItem.prototype.updateHighlight = function () {
		if (this.isHighlighted && this.isFocused) {
			this._highlight.show();
		} else {
			this._highlight.hide();
		}
	};

	/**
	 * @method highlight
	 */
	NowMyContentMenuItem.prototype.highlight = function () {
		this.isHighlighted = true;
		this.updateHighlight();
	};

	/**
	 * @method unHighlight
	 */
	NowMyContentMenuItem.prototype.unHighlight = function () {
		this.isHighlighted = false;
		this.updateHighlight();
	};

	/**
	 * @method focus
	 */
	NowMyContentMenuItem.prototype.focus = function () {
		this.isFocused = true;
		this.updateHighlight();
	};

	/**
	 * @method defocus
	 */
	NowMyContentMenuItem.prototype.defocus = function () {
		this.isFocused = false;
		this.updateHighlight();
	};

	/**
	 * @method update
	 * @param {Object} data
	 */
	NowMyContentMenuItem.prototype.update = function (data) {
		var seriesText,
			expiryDate,
			timeUntilExpiry,
			expiryText = "";
		if (data) {
			this.unHighlight();
			seriesText = $N.app.StringUtil.join(" \u00A0", this._dataMapper.getSubtitle(data), this._dataMapper.getSeriesInfo(data));
			this._title.setText($N.app.StringUtil.join(" ", this._dataMapper.getFilteredTitle(data), seriesText));
			this._title.setSpanOnText(seriesText);
			expiryDate = this._dataMapper.getRentalExpiry(data);

			if (expiryDate) {
				timeUntilExpiry = expiryDate - Date.now();
				if (timeUntilExpiry <= $N.app.constants.DAY_IN_MS * 180) {
					expiryText = $N.app.DateTimeUtil.getWeekdayDayMonthTimeStringFromDate(expiryDate);
				} else {
					expiryText = "-";
				}
			}

			this._expiry.setText(expiryText);
		}
	};

	$N.gui.NowMyContentMenuItem = NowMyContentMenuItem;
}($N || {}));