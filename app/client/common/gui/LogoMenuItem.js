/**
 * @class $N.gui.LogoMenuItem
 * @constructor
 * @extends $N.gui.AbstractListItem
 * @requires $N.gui.ListItem
 * @requires $N.gui.Label
 * @requires $N.gui.Image
 * @requires $N.gui.Util
 * @param {Object} docRef
 */
(function ($N) {
	function LogoMenuItem(docRef) {
		LogoMenuItem.superConstructor.call(this, docRef);

		this.isFocused = true;
		this.isHighlighted = false;

		this._log = new $N.apps.core.Log("CommonGUI", "LogoMenuItem");
		this._container = new $N.gui.ListItem(docRef);
		this._highlightIcon = new $N.gui.CachedImage(docRef, this._container);
		this._highlightIconIndicator = new $N.gui.CachedImage(docRef, this._container);
		this._icon = new $N.gui.CachedImage(docRef, this._container);
		this._iconIndicator = new $N.gui.CachedImage(docRef, this._container);
		this._title = new $N.gui.Label(docRef, this._container);

		this._TITLE_ALTERNATE_X_POSITION = 90;

		this._title.configure({
			x: 0,
			y: 0,
			cssClass: "logoMenuItemUnhighlighted",
			visible: false
		});

		this._highlightIcon.configure({
			x: 0,
			y: 0,
			width: 60,
			height: 60,
			preserveAspect: true,
			visible: false,
			cssClass: "logoMenuItemIconHighlighted"
		});

		this._highlightIconIndicator.configure({
			x: 47.5,
			y: 0,
			width: 25,
			height: 25,
			preserveAspect: true,
			visible: false
		});

		this._icon.configure({
			x: 0,
			y: 0,
			width: 60,
			height: 60,
			preserveAspect: true
		});

		this._iconIndicator.configure({
			x: 47.5,
			y: 0,
			width: 25,
			height: 25,
			preserveAspect: true
		});

		this._iconPadding = 82;

		this._rootSVGRef = this._container.getRootSVGRef();

		this.setAnimationDuration("200ms");
		this.addMoveAnimation();
		this.addFadeAnimation();
	}

	$N.gui.Util.extend(LogoMenuItem, $N.gui.AbstractListItem);

	/**
	 * @method setWidth
	 * @param {Number} width The width of the MenuItem.
	 * @return {Object} The MenuItem object.
	 */
	LogoMenuItem.prototype.setWidth = function (width) {
		this._width = width;
		return this;
	};

	/**
	 * @method setHeight
	 * @param {Number} height The height of the MenuItem.
	 * @return {Object} The MenuItem object.
	 */
	LogoMenuItem.prototype.setHeight = function (height) {
		this._height = height;
		return this;
	};

	/**
	 * @method select
	 * @param {Object} [data]
	 */
	LogoMenuItem.prototype.select = function (data) {
		this._log("select", "Enter");
		if (this._itemHandler && data) {
			this._itemHandler.select(data);
		}
		this._log("select", "Exit");
	};
    //jrm
	LogoMenuItem.prototype.click = function (evt) {
	    debugger;
        
	    activeController = $N.apps.core.ContextManager.getActiveController();
	    activeController.clicked = evt.srcElement.innerText;
	    activeController.keyHandler('click', evt.srcElement.innerText)
	};
	/**
	 * @method enter
	 * @param {Object} [data]
	 */
	LogoMenuItem.prototype.enter = function (data) {
		this._log("enter", "Enter");
		if (this._itemHandler && data) {
			this._itemHandler.enter(data);
		}
		this._log("enter", "Exit");
	};

	/**
	 * @method updateHighlight
	 */
	LogoMenuItem.prototype.updateHighlight = function () {
		if (this.isHighlighted && !this.isFocused) {
			this._title.setOpacity(0.7);
			this._highlightIcon.setOpacity(0.7);
			this._highlightIconIndicator.setOpacity(0.7);
		} else {
			this._title.setOpacity(1);
			this._highlightIcon.setOpacity(1);
			this._highlightIconIndicator.setOpacity(1);
		}
		if (this.isHighlighted) {
			this._icon.hide();
			this._iconIndicator.hide();
			this._highlightIcon.show();
			this._highlightIconIndicator.show();
			this._title.setCssClass("logoMenuItemHighlighted");
		} else {
			this._highlightIcon.hide();
			this._highlightIconIndicator.hide();
			this._icon.show();
			this._iconIndicator.show();
			this._title.setCssClass("logoMenuItemUnhighlighted");
		}
	};

	/**
	 * @method highlight
	 * @param {Object} [data]
	 */
	LogoMenuItem.prototype.highlight = function (data) {
		this._log("highlight", "Enter");
		if (!this.isHighlighted) {
			this.isHighlighted = true;
			this.updateHighlight();
			if (this._itemHandler && data) {
				this._itemHandler.highlight(data);
			}
		}
		this._log("highlight", "Exit");
	};

	/**
	 * @method unHighlight
	 */
	LogoMenuItem.prototype.unHighlight = function () {
		this._log("unHighlight", "Enter");
		if (this.isHighlighted) {
			this.isHighlighted = false;
			this.updateHighlight();
		}
		this._log("unHighlight", "Exit");
	};

	/**
	 * @method focus
	 */
	LogoMenuItem.prototype.focus = function () {
		this._log("focus", "Enter");
		this.isFocused = true;
		this.updateHighlight();
		this._log("focus", "Exit");
	};

	/**
	 * @method defocus
	 */
	LogoMenuItem.prototype.defocus = function () {
		this._log("defocus", "Enter");
		this.isFocused = false;
		this.updateHighlight();
		this._log("defocus", "Exit");
	};

	/**
	 * Updates the data stored within the MenuItem.
	 *
	 * @method update
	 *
	 * @param {Object} data Object containing the new data.
	 */
	LogoMenuItem.prototype.update = function (data) {
		this._log("update", "Enter");
		var me = this,
			iconHref,
			iconIndicatorHref,
			highlightIconHref,
			highlightIconIndicatorHref,
			loadSuccessCallback = function () {
				me._title.show();
			},
			loadFailedCallback = function () {
				me._title.setX(0);
				me._title.show();
			};
		if (data) {
			this._title.setText(this._dataMapper.getTitle(data));
			iconHref = this._dataMapper.getLogo(data);
			if (iconHref && iconHref !== '') {
				this._title.setX(me._TITLE_ALTERNATE_X_POSITION);
				this._icon.setLoadFailedCallback(loadFailedCallback);
				this._icon.setLoadSuccessful(loadSuccessCallback);
				this._icon.setHref(iconHref);
				if (this._dataMapper.getLogoIndicator) {
					iconIndicatorHref = this._dataMapper.getLogoIndicator(data);
					if (iconIndicatorHref) {
						this._iconIndicator.setHref(iconIndicatorHref);
					} else {
						this._iconIndicator.setHref('');
					}
				}
			} else {
				this._icon.setLoadFailedCallback(null);
				this._icon.setLoadSuccessful(null);
				this._icon.setHref('');
				this._title.setX(0);
				this._title.show();
			}
			if (this._dataMapper.getLogoHighlight) {
				highlightIconHref = this._dataMapper.getLogoHighlight(data);
				if (highlightIconHref && highlightIconHref !== '') {
					this._title.setX(me._TITLE_ALTERNATE_X_POSITION);
					this._highlightIcon.setLoadFailedCallback(loadFailedCallback);
					this._highlightIcon.setLoadSuccessful(loadSuccessCallback);
					this._highlightIcon.setHref(highlightIconHref);
					if (this._dataMapper.getLogoIndicatorHighlight) {
						highlightIconIndicatorHref = this._dataMapper.getLogoIndicatorHighlight(data);
						if (highlightIconIndicatorHref) {
							this._highlightIconIndicator.setHref(highlightIconIndicatorHref);
						} else {
							this._highlightIconIndicator.setHref('');
						}
					}
				} else {
					this._highlightIcon.setLoadFailedCallback(null);
					this._highlightIcon.setLoadSuccessful(null);
					this._highlightIcon.setHref('');
					this._title.setX(0);
					this._title.show();
				}
			}
		}
		this._log("update", "Exit");
	};

	/**
	 * @method setCssClass
	 * @param {String} cssClass
	 */
	LogoMenuItem.prototype.setCssClass = function (cssClass) {
		this._log("setCssClass", "Enter");
		this._title.setCssClass(cssClass);
		this._log("setCssClass", "Exit");
	};

	/**
	 * @method setItemHandler
	 * @param {Object} ItemHandler
	 */
	LogoMenuItem.prototype.setItemHandler = function (ItemHandler) {
		this._log("setItemHandler", "Enter");
		this._itemHandler = new ItemHandler();
		this._log("setItemHandler", "Exit");
	};

	/**
	 * @method setHandlerData
	 * @param {Object} data
	 */
	LogoMenuItem.prototype.setHandlerData = function (data) {
		this._log("setHandlerData", "Enter");
		this._itemHandler.setHandlerData(data);
		this._log("setHandlerData", "Exit");
	};

	$N.gui = $N.gui || {};
	$N.gui.LogoMenuItem = LogoMenuItem;

}($N || {}));
