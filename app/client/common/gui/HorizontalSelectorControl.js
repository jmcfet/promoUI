/**
 * @class $N.gui.HorizontalSelectorControl
 * @constructor
 * @extends $N.gui.GUIObject
 * @requires $N.gui.BasicList
 * @requires $N.gui.Group
 * @requires $N.gui.Container
 * @requires $N.gui.Label
 * @requires $N.gui.MaskIcon
 * @requires $N.gui.Util
 * @param {Object} docRef
 * @param {Object} [parent]
 * @param {String} label
 * @param {Object} [list] (optional list to drive the options, test doubles can be injected for unit testing purpose)
 * @param {Number} selectListWidth
 * @namespace $N.gui
 */
(function ($N) {
	var HorizontalSelectorControl = function (docRef, parent, label, list, selectListWidth) {
		HorizontalSelectorControl.superConstructor.call(this, docRef);

		this.ARROW_HEIGHT = 20;
		this.ARROW_WIDTH = 12;
		this.RIGHT_ARROW_OFFSET = 24;
		this.OPTIONS_WIDTH = selectListWidth || 630;

		this._lists = list || new $N.gui.BasicList();
		this._dataMapper = null;
		this._container = new $N.gui.Group(docRef);
		this._optionsContainer = new $N.gui.Container(docRef, this._container);
		this._rootSVGRef = this._container.getRootSVGRef();

		this._leftLabel = new $N.gui.Label(docRef, this._container);
		this._leftArrow = new $N.gui.MaskIcon(docRef, this._optionsContainer);
		this._rightArrow = new $N.gui.MaskIcon(docRef, this._optionsContainer);
		this._optionLabel = new $N.gui.Label(docRef, this._optionsContainer);
		this._height = 67.5;
		this._cssClassName = "popupButton";
		this._highlightCssClassName = "popupButton_highlight";
		this._optionLabelCssClassName = "recordingDialogOptionText";
		this._itemHighlightedCallback = function () {};
		this._itemSelectedCallback = function () {};

		this._container.configure({
			x: 0,
			y: 0,
			height: this._height,
			width: 1035
		});
		this._leftLabel.configure({
			x: 0,
			y: 5,
			width: 400,
			cssClass: "dialogButtonTextLabel",
			text: label
		});
		this._optionsContainer.configure({
			x: 406,
			y: 0,
			height: this._height,
			width: this.OPTIONS_WIDTH,
			cssClass: this._cssClassName
		});
		this._leftArrow.configure({
			x: 8,
			y: this.calculateArrowY(),
			width: 18,
			height: 30,
			opacity: 0.5,
			href: "customise/resources/images/icons/arrows/leftArrowIcon.png",
			color: "#fff",
			visible: false
		});
		this._rightArrow.configure({
			x: this.OPTIONS_WIDTH - this.RIGHT_ARROW_OFFSET,
			y: this.calculateArrowY(),
			width: 18,
			height: 30,
			opacity: 0.5,
			href: "customise/resources/images/icons/arrows/rightArrowIcon.png",
			color: "#fff",
			visible: false
		});
		this._optionLabel.configure({
			x: 40,
			y: 5,
			width: this.OPTIONS_WIDTH - 55,
			cssClass: this._optionLabelCssClassName
		});

		if (parent) {
			parent.addChild(this);
		}

		/**
		 * Tries to show the left and right arrows depending on the selected item
		 * @method _updateArrowsVisibility
		 * @private
		 */
		this._updateArrowsVisibility = function () {
			this._leftArrow.setVisible(!this._lists.isSelectedAtFirst());
			this._rightArrow.setVisible(!this._lists.isSelectedAtLast());
		};

		/**
		 * Returns the caption for the option label based on the selected item.
		 * @method _getCaption
		 * @private
		 * @return {String} caption
		 */
		this._getCaption = function () {
			return this._dataMapper ? this._dataMapper.getTitle(this._lists.getSelectedItem()) : this._lists.getSelectedItem();
		};

		/**
		 * Perform the selection by updating the option label content and tries
		 * to show the arrows
		 * @method _doSelect
		 * @private
		 */
		this._doSelect = function () {
			this._optionLabel.setText(this._getCaption());
			this._updateArrowsVisibility();
		};
	};

	$N.gui.Util.extend(HorizontalSelectorControl, $N.gui.GUIObject);

	/**
	 * Sets the height of the List
	 * The y position of the arrows are also adjusted to match
	 * @method setHeight
	 * @param {value} height The height to set
	 */
	HorizontalSelectorControl.prototype.setHeight = function (height) {
		var arrowY;
		this._height = height;
		this._container.setHeight(height);
		this._optionsContainer.setHeight(height);
		arrowY = this.calculateArrowY();
		this._leftArrow.setY(arrowY);
		this._rightArrow.setY(arrowY);
	};

	/**
	 * Gets the height of the List
	 * @method getHeight
	 */
	HorizontalSelectorControl.prototype.getHeight = function () {
		return this._height;
	};

	/**
	 * Sets the width of the List
	 * The x position of the right arrow is also adjusted to match
	 * @method setWidth
	 * @param {value} width The width to set
	 */
	HorizontalSelectorControl.prototype.setWidth = function (width) {
		this._container.setWidth(405 + width);
		this._optionsContainer.setWidth(width);
		this._rightArrow.setX(width - this.RIGHT_ARROW_OFFSET);
	};

	/**
	 * Sets the cssClass name
	 * @method setCssClassName
	 * @param {String} name
	 */
	HorizontalSelectorControl.prototype.setCssClass = function (name) {
		this._cssClassName = name;
		this._optionsContainer.setCssClass(this._cssClassName);
	};

	/**
	 * Sets the highlightCssClass name
	 * @method setHighlightCssClassName
	 * @param {String} name
	 */
	HorizontalSelectorControl.prototype.setHighlightCssClass = function (name) {
		this._highlightCssClassName = name;
		this._optionsContainer.setCssHighlightClass(this._highlightCssClassName);
	};

	/**
	 * Sets the setTextCssClass name
	 * @method setTextCssClass
	 * @param {String} name
	 */
	HorizontalSelectorControl.prototype.setTextCssClass = function (name) {
		this._optionLabelCssClassName = name;
		this._optionLabel.setCssClass(name);
	};

	/**
	 * Sets the cssClass for option label
	 * @method setLabelCssClass
	 * @param {String} cssClass
	 */
	HorizontalSelectorControl.prototype.setLabelCssClass = function (cssClass) {
		this._leftLabel.setCssClass(cssClass);
	};

	/**
	 * Sets the cssClass for option label
	 * @method setLabelCssClass
	 * @param {String} cssClass
	 */
	HorizontalSelectorControl.prototype.setOptionCssClass = function (cssClass) {
		this._optionLabel.setCssClass(cssClass);
	};

	/**
	 * Sets the behaviour to perform when an item in the list is highlighted
	 * @method setItemHighlightedCallback
	 * @param {Function} callback The function to be executed
	 */
	HorizontalSelectorControl.prototype.setItemHighlightedCallback = function (callback) {
		this._itemHighlightedCallback = callback;
	};

	/**
	 * Sets the behaviour to perform when 'OK' is pressed on an item
	 * in the list.
	 * @method setItemSelectedCallback
	 * @param {Function} callback The function to be executed on an 'OK' keypress.
	 */
	HorizontalSelectorControl.prototype.setItemSelectedCallback = function (callback) {
		this._itemSelectedCallback = callback;
	};

	/**
	 * Assigns focus to the list and display arrows
	 * @method focus
	 */
	HorizontalSelectorControl.prototype.focus = function () {
		this._optionsContainer.setCssClass(this._highlightCssClassName);
		this._updateArrowsVisibility();
	};

	/**
	 * Removes focus from the list and hide arrows
	 * @method defocus
	 */
	HorizontalSelectorControl.prototype.defocus = function () {
		this._optionsContainer.setCssClass(this._cssClassName);
		this._leftArrow.hide();
		this._rightArrow.hide();
	};

	/**
	 * Returns a boolean value to indicate whether or not
	 * the control is in focus.
	 * @method hasFocus
	 * @returns {Boolean}
	 */
	HorizontalSelectorControl.prototype.hasFocus = function () {
		return this._optionsContainer.getCssClass() === this._highlightCssClassName;
	};

	/**
	 * Calculates the y position based on the height of the overall control
	 * @method calculateArrowY
	 * @return {Number} Y position.
	 */
	HorizontalSelectorControl.prototype.calculateArrowY = function () {
		return Math.floor((this._height / 2) - (this.ARROW_HEIGHT / 2) - 4);
	};

	/**
	 * Sets the underlying array
	 * @method setData
	 * @param {Array} data
	 */
	HorizontalSelectorControl.prototype.setData = function (data, mapper) {
		var i, size = data.length;
		this._lists.setData(data);
		if (mapper) {
			this._dataMapper = mapper;
		}
		for (i = 0; i < size; i++) {
			if (data[i].isDefault) {
				this._lists.selectRowAtIndex(i + 1);	// basicList is 1 based instead of 0 based hence the increase.
				this._itemSelectedCallback(this._dataMapper.getAction(this._lists.getSelectedItem()));
				break;
			}
		}
		this._optionLabel.setText(this._getCaption());
	};

	/**
	 * Selects the next item and update the option label content
	 * @method selectNext
	 */
	HorizontalSelectorControl.prototype.selectNext = function () {
		this._lists.selectNext();
		this._doSelect();
		this._itemHighlightedCallback(this._dataMapper.getAction(this._lists.getSelectedItem()));
		this._itemSelectedCallback(this._dataMapper.getAction(this._lists.getSelectedItem()));
	};

	/**
	 * Selects the previous item and update the option label content
	 * @method selectPrevious
	 */
	HorizontalSelectorControl.prototype.selectPrevious = function () {
		this._lists.selectPrevious();
		this._doSelect();
		this._itemHighlightedCallback(this._dataMapper.getAction(this._lists.getSelectedItem()));
		this._itemSelectedCallback(this._dataMapper.getAction(this._lists.getSelectedItem()));
	};

	/**
	 * Return selected item
	 * @method getSelectedItem
	 */
	HorizontalSelectorControl.prototype.getSelectedItem = function () {
		return this._lists.getSelectedItem();
	};

	/**
	 * Defines the logic to perform upon receiving a supplied key press.
	 * This keyHandler intentionally returns true on prev/next to stop
	 * handling being passed to any parent menu when the top/bottom of a
	 * list is reached.
	 * @method keyHandler
	 * @param {String} key The key that was pressed.
	 * @return {Boolean} True if the key press was handled, false if not.
	 */
	HorizontalSelectorControl.prototype.keyHandler = function (key) {
		var keys = $N.gui.FrameworkCore.getKeys();
		switch (key) {
		case keys.KEY_LEFT:
			this.selectPrevious();
			return true;
		case keys.KEY_RIGHT:
			this.selectNext();
			return true;
		case keys.KEY_OK:
			return true;
		}
		return false;
	};

	/**
	 * Returns the class name as a String.
	 * @method toString
	 * @return {String} The class name as a String.
	 */
	HorizontalSelectorControl.prototype.toString = function () {
		return "HorizontalSelectorControl";
	};

	$N.gui = $N.gui || {};
	$N.gui.HorizontalSelectorControl = HorizontalSelectorControl;

}($N || {}));
