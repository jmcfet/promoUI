/**
 * @class $N.gui.SearchResultListItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 *
 * @requires $N.apps.core.Log
 * @requires $N.gui.ListItem
 * @requires $N.gui.Container
 * @requires $N.gui.DiacriticSpanLabel
 * @requires $N.gui.Util
 *
 * @param {Object} docRef DOM document
 * @param {Object} parent
 */
(function ($N) {
	function SearchResultListItem(docRef, parent) {
		SearchResultListItem.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("Search", "SearchResultListItem");
		this._isHighlighted = false;
		this._isFocused = false;

		this._backgroundCssClass = "searchResultListItemBackground";
		this._highlightedCssClass = "searchResultListItemHighlighted highlightRoundedCorner";

		this._container = new $N.gui.ListItem(this._docRef);
		this._container.configure({
			width: 1162.5
		});
		this._background = new $N.gui.Container(docRef, this._container);
		this._background.configure({
			x: 5,
			y: 5,
			width: 1152.5,
			height: 51,
			cssClass: this._backgroundCssClass
		});
		this._content = new $N.gui.DiacriticSpanLabel(this._docRef, this._container);
		this._content.configure({
			x: 12,
			y: 6,
			width: 1138.5,
			height: 51,
			TextOverflow: "...",
			FirstWordsOnly: true,
			cssClass: "searchResultListItemContent",
			spanCssClass: "searchResultListItemContentSpan"
		});
		this._content.setFirstWordsOnly(true);
		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
		this.setAnimationDuration("200ms");
		this.addMoveAnimation();
		this.addFadeAnimation();
	}
	$N.gui.Util.extend(SearchResultListItem, $N.gui.AbstractListItem);

	/**
	 * Updates the data stored within the SearchResultListItem.
	 * @method update
	 *
	 * @param {Object} data Object containing the new data.
	 */
	SearchResultListItem.prototype.update = function (data) {
		this._log("update", "Enter");
		var spanText,
			i;
		if (data) {
			this._content.setText(this._dataMapper.getContent(data));
			spanText = this._dataMapper.getContentSpanText(data);
			this._content.setSpanOnText(spanText);
		}
		this._log("update", "Exit");
	};

	/**
	 * @method highlight
	 */
	SearchResultListItem.prototype.highlight = function () {
		this._isHighlighted = true;
		if (this._isFocused) {
			this._background.setCssClass(this._highlightedCssClass);
			this._content.setCssClass("searchResultListItemContentHighlighted");
			this._content.setSpanCssClass("searchResultListItemContentSpanHighlighted");
		}
	};
	/**
	 * @method unHighlight
	 */
	SearchResultListItem.prototype.unHighlight = function () {
		this._isHighlighted = false;
		this._background.setCssClass(this._backgroundCssClass);
		this._content.setCssClass("searchResultListItemContent");
		this._content.setSpanCssClass("searchResultListItemContentSpan");
	};
	/**
	 * @method focus
	 */
	SearchResultListItem.prototype.focus = function () {
		if (this._isHighlighted) {
			this._background.setCssClass(this._highlightedCssClass);
			this._content.setCssClass("searchResultListItemContentHighlighted highlightRoundedCorner");
			this._content.setSpanCssClass("searchResultListItemContentSpanHighlighted highlightRoundedCorner");
		}
		this._isFocused = true;
	};
	/**
	 * @method defocus
	 */
	SearchResultListItem.prototype.defocus = function () {
		this._background.setCssClass(this._backgroundCssClass);
		this._content.setCssClass("searchResultListItemContent");
		this._content.setSpanCssClass("searchResultListItemContentSpan");
		this._isFocused = false;
	};

	/**
	 * @method setCssClass
	 * @param {Object} cssClass
	 */
	SearchResultListItem.prototype.setCssClass = function (cssClass) {
		this._backgroundCssClass = cssClass || "searchResultListItemBackground";
	};

	/**
	 * @method setHighlightCssClass
	 * @param {Object} cssClass
	 */
	SearchResultListItem.prototype.setHighlightCssClass = function (cssClass) {
		this._highlightedCssClass = cssClass || "searchResultListItemHighlighted keyActive";
	};
	$N.gui = $N.gui || {};
	$N.gui.SearchResultListItem = SearchResultListItem;
}($N || {}));

