/**
 * @class $N.gui.CollapsingGroupItem
 * @extends $N.gui.AbstractComponent
 *
 * @param {Object} docRef
 * @param {Object} parent
 */
(function ($N) {
	function CollapsingGroupItem(docRef, parent) {
		this._log = new $N.apps.core.Log("CommonGUI", "CollapsingGroupItem");
		CollapsingGroupItem.superConstructor.call(this, docRef);

		this._updatedCallback = function () {};

		this._container = new $N.gui.ListItem(docRef);
		this._image = new $N.gui.Image(this._docRef, this._container);
		this._label = new $N.gui.InlineLabel(this._docRef, this._container);

		this._label.configure({
			x: 49,
			y: 0,
			cssClass: "ellipsis small"
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	}
	$N.gui.Util.extend(CollapsingGroupItem, $N.gui.AbstractComponent);

	/**
	 * @method setWidth
	 * @param {Number} width
	 */
	CollapsingGroupItem.prototype.setWidth = function (width) {
		this._trueWidth = width;
		this._width = Math.round(width * this.resolutionHorizontalFactor);
		this._container.setWidth(width);
	};

	/**
	 * @method setHref
	 * @param {String} href
	 */
	CollapsingGroupItem.prototype.setHref = function (href) {
		this._image.setHref(href);
	};

	/**
	 * @method getHref
	 */
	CollapsingGroupItem.prototype.getHref = function () {
		return this._image.getHref();
	};

	/**
	 * @method setText
	 * @param {String} text
	 * @param {Boolean} noWidthChange (optional)
	 */
	CollapsingGroupItem.prototype.setText = function (text) {
		this._label.setText(text);
	};

	/**
	 * @method setCssClassForLabel
	 * @param {String} labelCssClass
	 */
	CollapsingGroupItem.prototype.setCssClassForLabel = function (labelCssClass) {
		this._label.setCssClass(labelCssClass);
	};

	/**
	 * @method setCssClass
	 * @param {String} cssClass
	 */
	CollapsingGroupItem.prototype.setCssClass = function (cssClass) {
		this._container.setCssClass(cssClass);
	};

	/**
	 * @method show
	 */
	CollapsingGroupItem.prototype.show = function () {
		CollapsingGroupItem.superClass.show.call(this);
	};

	/**
	 * @method hide
	 */
	CollapsingGroupItem.prototype.hide = function () {
		CollapsingGroupItem.superClass.hide.call(this);
	};

	$N.gui = $N.gui || {};
	$N.gui.CollapsingGroupItem = CollapsingGroupItem;
}($N || {}));
