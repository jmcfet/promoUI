/**
 * ButtonBar creates and manages a container of buttons.
 * Buttons are created using the `createButton` method (you do not need to
 * create individual Button objects, ButtonBar handles this for you, although
 * you can add button objects directly using the `addButton` method).
 *
 * ButtonBar positions the buttons for you, to create rows, columns or a matrix of buttons.
 * The positioning can be configured using the setAlignmentEmphasis method, which
 * configures the ButtonBar to emphasise vertical or horizontal positioning.
 *
 * ButtonBar also handles navigation between the buttons depending on how they're
 * positioned, and also dynamically updates the navigation paths between buttons to
 * adapt a fluid UI experience.  This is most useful when moving between buttons of
 * different sizes.
 *
 * Example Markup:
 *
 *     <nagra:buttonBar id="myButtonBar" x="200" y="200" width="400" height="200" />
 *
 * Example JavaScript:
 *
 *     $N.gui.FrameworkCore.extendWithGUIObjects(document.documentElement, view);
 *     view.myButtonBar.setPadding(5);
 *     view.myButtonBar.setAlignmentEmphasis($N.gui.ButtonBar.VERTICAL_ALIGNMENT);
 *     view.myButtonBar.setSelectedCallback(function(result) {
 *         alert(result + " selected");
 *     });
 *     view.myButtonBar.createButton("button1", buttonConfigA);
 *     view.myButtonBar.createButton("button2", buttonConfigA);
 *     view.myButtonBar.createButton("button3", buttonConfigB);
 *     view.myButtonBar.enable();
 *
 * Buttons can also be dynamically updated within the button bar.  We can achieve this
 * using the `updateButton` method, which passes a new configuration object to an existing
 * button.  Or, we can also enable and disable buttons using the `enableButton` and `disableButton`
 * methods.  When disabling or enabling buttons, the ButtonBar will remap the navigation root
 * so that disabled buttons are skipped when the user attempts to select them. For example,
 *
 *     view.myButtonBar.updateButton("button1", newConfiguration);
 *     view.myButtonBar.updateButton("button2", {labelCssClass: "newLabelClass", image: "../images/home.png"} );
 *     view.myButtonBar.disableButton("button3");
 *
 * A spacer can be inserted into the ButtonBar using the `createSpacer` method.  This allows you
 * to define an area where buttons will not be placed, and provides more control over the
 * positioning of buttons.
 * For example,
 *
 *     view.myButtonBar.createSpacer(50, 50);
 *
 * In the above example we define a 50 by 50 spacer.  The spacer will be positioned by the ButtonBar
 * in the same way as a button, but will not be visible or selectable by the user.
 *
 * The button bar can also hold overidding CSS classes for use when it is in a disabled state.  These
 * classes are set using the methods `setDisabledButtonStandardCssClass`,
 * `setDisabledButtonHighlightCssClass` and `setDisabledButtonDisabledCssClass`.
 * If CSS classes are set using these methods, the button bar will update the style of all contained buttons when it is disabled.
 * The buttons will return to their original styling when the button bar is re-enabled.
 *
 * @class $N.gui.ButtonBar
 * @extends $N.gui.AbstractControl
 * @author dthomas
 *
 * @requires $N.gui.Button
 * @requires $N.gui.Container
 * @requires $N.gui.AbstractControl
 * @requires $N.gui.Util
 * @requires $N.gui.FrameworkCore
 *
 * @constructor
 * @param {Object} docRef DOM document
 * @param {Object} parent Parent of this Class.
 */
define('jsfw/gui/GUIObjects/Controls/ButtonBar',
    [
    'jsfw/gui/GUIObjects/Controls/Button',
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Controls/AbstractControl',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/FrameworkCore'
    ],
    function (Button, Container, AbstractControl, Util, FrameworkCore) {

		function ButtonBar(docRef, parent) {
			ButtonBar.superConstructor.call(this, docRef);

		    this._docRef = docRef;

			this._container = new $N.gui.Container(this._docRef);

			this._rootElement = this._container.getRootElement();

			if (parent) {
				parent.addChild(this._container);
			}

			// array of button objects
			this._buttons = [];

			// associative array of button navigation
			this._navigation = {};

			// array of button CSS class (holds backup button CSS classes when bar is disabled)
			this._buttonCssClass = [];

			// current button
			this._currentButton = null;
			this._currentIndex = 0;

			// padding between buttons
			this._padding = 0;

			// Default to vertical alignment
			this._alignment = ButtonBar.VERTICAL_ALIGNMENT;

			// if set to "true", default down navigation is to rightmost key below current key
			this._isVerticalMovementPreferenceRight = false;

			// callbacks
			this._selectedCallback = null;
			this._highlightedCallback = null;

			// CSS classes
			this._containerCssClass = null;
			this._containerDisabledCssClass = null;
			this._disabledButtonStandardCssClass = null;
			this._disabledButtonHighlightCssClass = null;
			this._disabledButtonDisabledCssClass = null;

			this._enabled = false;
		}

		$N.gui.Util.extend(ButtonBar, $N.gui.AbstractControl);

		/**
		 * Invokes the highlight call back function if defined.
		 * @method _itemHighlighted
		 * @private
		 * @param {Object} button The Button object
		 */
		ButtonBar.prototype._itemHighlighted = function (button) {
			if (this._highlightedCallback) {
				this._highlightedCallback(button.getId());
			}
		};

		/**
		 * Invokes the selected call back function if defined.
		 * @method _itemSelected
		 * @private
		 * @param {Object} button The Button object
		 */
		ButtonBar.prototype._itemSelected = function (button) {
			if (button._selectedCallback) {
				button._selectedCallback();
			}
			if (this._selectedCallback) {
				this._selectedCallback(button.getId());
			}
		};

		/**
		 * Returns true if the space described is free (ie, there are no overlapping buttons).
		 * @method _isSpaceFree
		 * @private
		 * @param {Number} x1 Start x coordinate
		 * @param {Number} y1 Start y coordinate
		 * @param {Number} x2 End x coordinate
		 * @param {Number} y2 End y coordinate
		 * @return {Boolean} True if the space is free
		 */
		ButtonBar.prototype._isSpaceFree = function (x1, y1, x2, y2) {
			var buttonsLength = this._buttons.length;
			var button, bx1, bx2, by1, by2, i;

			if (x2 > this._container.getWidth() || y2 > this._container.getHeight()) {
				return false;
			}

			for (i = 0; i < buttonsLength; i++) {
				button = this._buttons[i];
				bx1 = button.getX();
				bx2 = button.getX() + button.getWidth();
				if ((bx1 >= x1 && bx1 <= x2) || (bx2 >= x1 && bx2 <= x2) || (bx1 <= x1 && bx2 >= x2)) {
					by1 = button.getY();
					by2 = button.getY() + button.getHeight();
					if ((by1 >= y1 && by1 <= y2) || (by2 >= y1 && by2 <= y2) || (by1 <= y1 && by2 >= y2)) {
						return false;
					}
				}
			}
			return true;
		};

		/**
		 * Finds the highest and most left position for a given width and height,
		 * with precedence given to the highest point.
		 * @method _findHighestLeftMostFreeSpace
		 * @private
		 * @param {Number} width The required width
		 * @param {Number} height The required height
		 * @return {Object} An X and Y coordinate pair
		 */
		ButtonBar.prototype._findHighestLeftMostFreeSpace = function (width, height) {
			var x = this._container.getWidth();
			var y = this._container.getHeight();
			var buttonsLength = this._buttons.length;
			var i, button, buttonBottom;
			for (i = buttonsLength - 1; i >= 0; i--) {
				button = this._buttons[i];
				buttonBottom = button.getY() + button.getHeight() + this._padding;
				if (buttonBottom <= y && button.getX() < x) {
					if (this._isSpaceFree(button.getX(), buttonBottom, button.getX() + width, buttonBottom + height)) {
						x = button.getX();
						y = buttonBottom;
					}
				}
			}
			return {"x": x, "y": y};
		};

		/**
		 * Finds the most left and highest position for a given width and height,
		 * with precedence given to the left most point.
		 * @method _findLeftMostHighestFreeSpace
		 * @private
		 * @param {Number} width The required width
		 * @param {Number} height The required height
		 * @return {Object} An X and Y coordinate pair
		 */
		ButtonBar.prototype._findLeftMostHighestFreeSpace = function (width, height) {
			var x = this._container.getWidth();
			var y = this._container.getHeight();
			var buttonsLength = this._buttons.length;
			var i, button, buttonRight;
			for (i = buttonsLength - 1; i >= 0; i--) {
				button = this._buttons[i];
				buttonRight = button.getX() + button.getWidth() + this._padding;
				if (buttonRight <= x && button.getY() < y) {
					if (this._isSpaceFree(buttonRight, button.getY(), buttonRight + width, button.getY() + height)) {
						x = buttonRight;
						y = button.getY();
					}
				}
			}
			return {"x": x, "y": y};
		};

		/**
		 * Returns the next available X and Y coordinate pair within the button bar,
		 * for a button with a given width and height.  Accounts for padding and alignment emphasis.
		 * @method _getNextCoords
		 * @private
		 * @param {Number} width Width of button
		 * @param {Number} height Height of button
		 * @return {Object} coordinate pair of available space within bar
		 */
		ButtonBar.prototype._getNextCoords = function (width, height) {
			var x = 0, y = 0;
			var buttonsLength = this._buttons.length;
			var lastButton;

			// only bother if there are more buttons
			if (buttonsLength > 0) {
				// try placing new button right or below previous button depending on alignment emphasis
				lastButton = this._buttons[buttonsLength - 1];
				if (this._alignment === ButtonBar.VERTICAL_ALIGNMENT) {
					x = lastButton.getX();
					y = lastButton.getY() + lastButton.getHeight() + this._padding;
				} else {
					x = lastButton.getX() + lastButton.getWidth() + this._padding;
					y = lastButton.getY();
				}

				// if space is not free, find a new position
				if (!this._isSpaceFree(x, y, x + width, y + height)) {
					if (this._alignment === ButtonBar.VERTICAL_ALIGNMENT) {
						return this._findLeftMostHighestFreeSpace(width, height);
					}
					return this._findHighestLeftMostFreeSpace(width, height);
				}
			}
			return {"x": x, "y": y};
		};

		/**
		 * Returns an array of button references which are to the left and intersect the supplied coordinate range.
		 * @method _getButtonReferencesLeft
		 * @private
		 * @param {Number} x
		 * @param {Number} y
		 * @param {Number} height
		 * @return {Array} List of all button index to the left
		 */
		ButtonBar.prototype._getButtonReferencesLeft = function (x, y, height) {
			var list = [];
			var buttonsLength = this._buttons.length - 1;
			var i;
			var button;
			var bTop, bBottom;

			if (x > 0) {
				for (i = buttonsLength; i >= 0; i--) {
					button = this._buttons[i];
					bTop = button.getY();
					bBottom = button.getY() + button.getHeight();

					// if the button is to the left and its height intersects the coordinate range then add it to the list
					if (button.getX() < x &&
							((bTop <= y && bBottom >= y) ||
							(bTop <= y + height && bBottom >= y + height) ||
							(bTop >= y && bBottom <= y + height))) {
						list.push(i);
					}
				}
			}

			return list;
		};

		/**
		 * Returns an array of button references which are to the right and intersect the supplied coordinate range.
		 * @method _getButtonReferencesRight
		 * @private
		 * @param {Number} x
		 * @param {Number} y
		 * @param {Number} height
		 * @return {Array} List of all button index to the right
		 */
		ButtonBar.prototype._getButtonReferencesRight = function (x, y, height) {
			var list = [];
			var buttonsLength = this._buttons.length - 1;
			var i;
			var button;
			var bTop, bBottom;

			if (x > 0) {
				for (i = buttonsLength; i >= 0; i--) {
					button = this._buttons[i];
					bTop = button.getY();
					bBottom = button.getY() + button.getHeight();

					// if the button is to the right and its height intersects the coordinate range then add it to the list
					if (button.getX() > x &&
							((bTop <= y && bBottom >= y) ||
							(bTop <= y + height && bBottom >= y + height) ||
							(bTop >= y && bBottom <= y + height))) {
						list.push(i);
					}
				}
			}

			return list;
		};

		/**
		 * Returns an array of button references which are above and intersect the supplied coordinate range.
		 * @method _getButtonReferencesAbove
		 * @private
		 * @param {Number} x
		 * @param {Number} y
		 * @param {Number} width
		 * @return {Array} List of all button index above
		 */
		ButtonBar.prototype._getButtonReferencesAbove = function (x, y, width) {
			var list = [];
			var buttonsLength = this._buttons.length - 1;
			var i;
			var button;
			var bLeft, bRight;

			if (y > 0) {
				for (i = buttonsLength; i >= 0; i--) {
					button = this._buttons[i];
					bLeft = button.getX();
					bRight = button.getX() + button.getWidth();

					// if the button is above and its width intersects the coordinate range then add it to the list
					if (button.getY() < y &&
							((bLeft <= x && bRight >= x) ||
							(bLeft <= x + width && bRight >= x + width) ||
							(bLeft >= x && bRight <= x + width))) {
						list.push(i);
					}
				}
			}

			return list;
		};

		/**
		 * Returns an array of button references which are below and intersect the supplied coordinate range.
		 * @method _getButtonReferencesBelow
		 * @private
		 * @param {Number} x
		 * @param {Number} y
		 * @param {Number} width
		 * @return {Array} List of all button index below
		 */
		ButtonBar.prototype._getButtonReferencesBelow = function (x, y, width) {
			var list = [];
			var buttonsLength = this._buttons.length - 1;
			var i;
			var button;
			var bLeft, bRight;

			if (y > 0) {
				for (i = buttonsLength; i >= 0; i--) {
					button = this._buttons[i];
					bLeft = button.getX();
					bRight = button.getX() + button.getWidth();

					// if the button is above and its width intersects the coordinate range then add it to the list
					if (button.getY() > y &&
							((bLeft <= x && bRight >= x) ||
							(bLeft <= x + width && bRight >= x + width) ||
							(bLeft >= x && bRight <= x + width))) {
						list.push(i);
					}
				}
			}

			return list;
		};

		/**
		 * Moves selection to the supplied button index and updates its navigation path
		 * to point to the previous button, depending on what direction movement is from.
		 * @method _selectButton
		 * @private
		 * @param {Number} index Index of the new button
		 * @param {String} direction Direction from previous button
		 */
		ButtonBar.prototype._selectButton = function (index, direction) {
			var previousIndex = this._currentIndex;
			this._currentButton.unHighlight();
			this._currentIndex = index;
			this._currentButton = this._buttons[index];
			this._currentButton.highlight();

			// remap selected buttons navigation depending on previous button

			if (this._buttons[previousIndex].isEnabled()) {
				var nav = this._navigation[this._currentButton.getId()];
				switch (direction) {
				case "left":
					nav.right = previousIndex;
					break;
				case "right":
					nav.left = previousIndex;
					break;
				case "up":
					nav.down = previousIndex;
					break;
				case "down":
					nav.up = previousIndex;
					break;
				}
			}

			this._itemHighlighted(this._currentButton);
		};

		/**
		 * Defines the initial navigation links of the button at the specified index.
		 * @method _defineNavigationForButtonAtIndex
		 * @private
		 * @param {Number} index Index of the button
		 */
		ButtonBar.prototype._defineNavigationForButtonAtIndex = function (index) {
			var button = this._buttons[index];
			var id = button.getId();
			var i, indexRef, navRef;						// loop counters and temporary references
			var tempX, tempY;

			// arrays of all button index to left and above
			var leftButtonsArray = this._getButtonReferencesLeft(button.getX(), button.getY(), button.getHeight());
			var rightButtonsArray = this._getButtonReferencesRight(button.getX(), button.getY(), button.getHeight());
			var upButtonsArray = this._getButtonReferencesAbove(button.getX(), button.getY(), button.getWidth());
			var downButtonsArray = this._getButtonReferencesBelow(button.getX(), button.getY(), button.getWidth());

			var leftArrayLength = leftButtonsArray.length,
				upArrayLength = upButtonsArray.length,
				rightArrayLength = rightButtonsArray.length,
				downArrayLength = downButtonsArray.length;

			// initialise navigation node for button
			this._navigation[id] = {};
			this._navigation[id].index = index;

			// set 'left' navigation to first enabled button to left
			tempX = -1;
			for (i = 0; i < leftArrayLength; i++) {
				indexRef = leftButtonsArray[i];
				if (this._buttons[indexRef].isEnabled() && this._buttons[indexRef].getX() > tempX) {
					this._navigation[id].left = indexRef;
					tempX = this._buttons[indexRef].getX();
				}
			}

			// set 'right' navigation to first enabled button to right
			tempX = this._container.getWidth();
			for (i = 0; i < rightArrayLength; i++) {
				indexRef = rightButtonsArray[i];
				if (this._buttons[indexRef].isEnabled() && this._buttons[indexRef].getX() < tempX) {
					this._navigation[id].right = indexRef;
					tempX = this._buttons[indexRef].getX();
				}
			}

			// set 'up' navigation to first enabled button above
			tempY = -1;
			tempX = -1;

			for (i = 0; i < upArrayLength; i++) {
				indexRef = upButtonsArray[i];
				if ((this._buttons[indexRef].isEnabled() &&
					(this._buttons[indexRef].getY() > tempY ||
						(this._isVerticalMovementPreferenceRight === true &&
							this._buttons[indexRef].getY() === tempY &&
							this._buttons[indexRef].getX() < button.getX())))) {
					this._navigation[id].up = indexRef;
					tempY = this._buttons[indexRef].getY();
					tempX = this._buttons[indexRef].getX();
				}
			}

			// set 'down' navigation to first enabled button to below
			tempY = this._container.getHeight();

			for (i = 0; i < downArrayLength; i++) {
				indexRef = downButtonsArray[i];
				if (this._buttons[indexRef].isEnabled() && this._buttons[indexRef].getY() < tempY) {
					this._navigation[id].down = indexRef;
					tempY = this._buttons[indexRef].getY();
				}
			}

			// if button is enabled, update navigation of buttons above and to left of this button if required

			if (button.isEnabled()) {
				// update 'right' navigation of buttons to left of this button
				for (i = 0; i < leftArrayLength; i++) {
					navRef = this._navigation[this._buttons[leftButtonsArray[i]].getId()];
					if (!navRef.right || this._buttons[navRef.right].getX() > button.getX()) {
						navRef.right = index;
					}
				}

				// update 'down' navigation of buttons above this button
				for (i = 0; i < upArrayLength; i++) {
					navRef = this._navigation[this._buttons[upButtonsArray[i]].getId()];
					if (!navRef.down ||
							this._buttons[navRef.down].getY() > button.getY() ||
							(this._buttons[navRef.down].getY() === button.getY()  &&
							this._isVerticalMovementPreferenceRight === true && this._buttons[navRef.down].getX() <= button.getX())) {
						navRef.down = index;
					}
				}
			}
		};

		/**
		 * Returns the navigation options for the button with the specified id.
		 * @method getNavigation
		 * @param {Number} id id of button
		 * @return {Object} Nav options for button
		 */
		ButtonBar.prototype.getNavigation = function (id) {
			return this._navigation[id];
		};

		/**
		 * Sets the navigation options for the button with the specified id.
		 * @method setNavigation
		 * @param {Number} id id of button
		 * @param {Object} nav navigation options for button
		 */
		ButtonBar.prototype.setNavigation = function (id, nav) {
			this._navigation[id] = nav;
		};

		/**
		 * Returns the buttons on the button bar as an Array.
		 * @method getButtons
		 * @return {Array} List of all buttons
		 */

		ButtonBar.prototype.getButtons = function () {
			return this._buttons;
		};

		/**
		 * Sets the vertical movement preference to right.
		 * @method setVerticalMovementPreference
		 * @param {String} direction "left" (default) or "right"
		 */

		ButtonBar.prototype.setVerticalMovementPreference = function (direction) {
			if (direction === "right") {
				this._isVerticalMovementPreferenceRight = true;
			} else {
				this._isVerticalMovementPreferenceRight = false;
			}
		};


		/**
		 * Returns the vertical movement preference (left (default) or right).
		 * @method getVerticalMovementPreference
		 * @return {String} left / right dependent on whether the default down key navigates to the
		 *                   leftmopst or rightmost button
		 */
		ButtonBar.prototype.getVerticalMovementPreference = function () {
			if (this._isVerticalMovementPreferenceRight === true) {
				return "right";
			}
			return "left";
		};

		/**
		 * Called from createButton. Sets the button properties using supplied configuration parameters.
		 * @method setButtonProperties
		 * @param {Object} button
		 * @param {String} id Unique identification of the button.  This will be passed back to the callback function.
		 * @param {String} label Optional label override
		 * @param {Boolean} enabled Optional enabled override
		 * @param {Number} x Optional x position override
		 * @param {Number} y Optional y position override
		 * @param {Object} configuration Configuration JSON object
		 * @return
		 */
		ButtonBar.prototype.setButtonProperties = function (button, id, label, enabled, x, y, configuration) {
			var coord;
			button.setId(id);
			if (label) {
				button.setLabel(label);
				button.unHighlight();
			}
			if (enabled !== undefined) {
				button.setEnabled(enabled);
			}
			if (x && y) {
				button.setX(x);
				button.setY(y);
			} else {
				coord = this._getNextCoords(configuration.width, configuration.height);
				button.setX(coord.x);
				button.setY(coord.y);
			}
			button.configure(configuration);
			return button;
		};

		/**
		 * Called from createButton. Sets up the navigation direction for the supplied button
		 * @param {Object} button
		 */
		ButtonBar.prototype.defineNavigationForButton = function (button) {
			this._buttons.push(button);
			this._defineNavigationForButtonAtIndex(this._buttons.length - 1);
		};

		/**
		 * Creates a new button and adds it to this button bar.  The button will be configured using the configuration JSON object.
		 * The label can be specified within the configuration object or via the optional label parameter (this allows button configurations
		 * to be re-used for multiple buttons with different labels).
		 * @method createButton
		 * @param {String} id Unique identification of the button.  This will be passed back to the callback function.
		 * @param {Object} configuration Configuration JSON object
		 * @param {String} label Optional label override
		 * @param {Boolean} enabled Optional enabled override
		 * @param {Number} x Optional x position override
		 * @param {Number} y Optional y position override
		 */
		ButtonBar.prototype.createButton = function (id, configuration, label, enabled, x, y) {
			// create new button
			var button = new $N.gui.Button(this._docRef, this._container);
			button = this.setButtonProperties(button, id, label, enabled, x, y, configuration);
			this.defineNavigationForButton(button);
		};

		/**
		 * Adds a custom button object to this button bar.
		 * The object passed should extend $N.gui.Button.
		 * @method addButton
		 * @param {Object} button A button object which extends $N.gui.Button
		 */
		ButtonBar.prototype.addButton = function (button) {
			this._container.addChild(button);
			var coord = this._getNextCoords(button.getWidth(), button.getHeight());

			button.setX(coord.x);
			button.setY(coord.y);
			button.unHighlight();

			this._buttons.push(button);
			this._defineNavigationForButtonAtIndex(this._buttons.length - 1);
		};

		/**
		 * Given an id returns the button with a matching id.
		 * @method getButton
		 * @param {String} id The id of the button.
		 * @return {Object} Button with matching id
		 */
		ButtonBar.prototype.getButton = function (id) {

			var button;
			try {
				button = this._buttons[this._navigation[id].index];
			} catch (err) {
				return null;
			}
			return button;
		};

		/**
	     * Given an index value returns the button with a matching index.
	     * @method getButtonByIndex
		 * @param {Number} index The index of the button.
		 * @return {Object} Button with matching index
		 */
		ButtonBar.prototype.getButtonByIndex = function (index) {

			var button;
			try {
				button = this._buttons[index];
			} catch (err) {
				return null;
			}
			return button;
		};

		/**
		 * Returns the current button.
		 * @method getCurrentButton
		 * @return {Object} Current Button
		 */
		ButtonBar.prototype.getCurrentButton = function () {
			return this._currentButton;
		};

		/**
		 * Returns index of current button.
		 * @method getCurrentIndex
		 * @return {Number} index of current button
		 */
		ButtonBar.prototype.getCurrentIndex = function () {
			return this._currentIndex;
		};

		/**
		 * Selects the button with the supplied id.
		 * @method selectButton
		 * @param {String} id The id of the button.
		 */
		ButtonBar.prototype.selectButton = function (id, direction) {

			var index;

			if (direction) {
				index = this._navigation[id].index;
				this._selectButton(index, direction);
			} else {
				this._currentButton = this._buttons[this._navigation[id].index];
				this._currentIndex = this._navigation[id].index;
			}
		};

		/**
		 * Selects the button with the supplied index.
		 * @method selectButtonByIndex
		 * @param {Number} index The index of the button.
		 * @param {String} direction The direction of navigation.
		 */
		ButtonBar.prototype.selectButtonByIndex = function (index, direction) {
			this._selectButton(index, direction);
		};


		/**
		 * Updates the configuration of an existing button, identified by its id.
		 * @method updateButton
		 * @param {String} id The id of the button.
		 * @param {Object} configuration Configuration JSON object.
		 */
		ButtonBar.prototype.updateButton = function (id, configuration) {
			var i;
			var buttonsLength = this._buttons.length;
			var button = this._buttons[this._navigation[id].index];

			button.configure(configuration);

			// refresh navigation information due to changes in button configuration
			this._navigation = {};
			for (i = 0; i < buttonsLength; i++) {
				this._defineNavigationForButtonAtIndex(i);
			}

			this._currentButton.highlight();
		};

		/**
		 * Creates a spacer in the ButtonBar.
		 * The spacer is a blank area which ButtonBar will not use for positioning of new buttons.
		 * @method createSpacer
		 * @param {Number} width Width of the spacer
		 * @param {Number} height Height of the spacer
		 */
		ButtonBar.prototype.createSpacer = function (width, height) {
			var coord = this._getNextCoords(width, height);

			// create spacer object
			var spacer = {
				getId: function () { return "spacer"; },
				getX: function () { return coord.x; },
				getY: function () { return coord.y; },
				getWidth: function () { return width; },
				getHeight: function () { return height; },
				isEnabled: function () { return false; }
			};

			// add spacer to buttons collection and create dummy navigation node
			this._buttons.push(spacer);
			this._navigation.spacer = {};
		};

		/**
		 * Enables a button.
		 * @method enableButton
		 * @param {String} id The id of the button
		 */
		ButtonBar.prototype.enableButton = function (id) {
			this.updateButton(id, {enabled: true});
		};

		/**
		 * Disables a button.
		 * @method disableButton
		 * @param {String} id The id of the button
		 */
		ButtonBar.prototype.disableButton = function (id) {
			this.updateButton(id, {enabled: false});
		};

		/**
		 * Sets the width of the button bar.
		 * @method setWidth
		 * @param {Number} width The width of the button bar.
		 */
		ButtonBar.prototype.setWidth = function (width) {
			this._container.setWidth(width);
		};

		/**
		 * Sets the height of the button bar.
		 * @method setHeight
		 * @param {Number} height The height of the button bar.
		 */
		ButtonBar.prototype.setHeight = function (height) {
			this._container.setHeight(height);
		};

		/**
		 * Sets the button bar image.
		 * @method setImage
		 * @param {String} image URL of the image.
		 */
		ButtonBar.prototype.setImage = function (image) {
			this._container.setHref(image);
		};

		/**
		 * Sets the button bar icon.
		 * @method setImage
		 * @param {String} image URL of the image.
		 */
		ButtonBar.prototype.setIcon = function (icon) {
			this._container.setIcon(icon);
		};

		/**
		 * Sets the internal padding of the slider.
		 * @method setPadding
		 * @param {Number} padding The new padding value.
		 */
		ButtonBar.prototype.setPadding = function (padding) {
			this._padding = padding;
		};

		/**
		 * Sets the rounding of the slider bar.
		 * @method setRounding
		 * @param {Number} rounding The new rounding value.
		 */
		ButtonBar.prototype.setRounding = function (rounding) {
			this._container.setRounding(rounding);
		};

		/**
		 * Sets the CSS class of the button bar container.
		 * @method setCssClass
		 * @param {String} cssClass
		 */
		ButtonBar.prototype.setCssClass = function (cssClass) {
			this._containerCssClass = cssClass;
			this._container.setCssClass(cssClass);
		};

		/**
		 * Sets the CSS class of the button bar container when in a disabled state.
		 * @method setDisabledCssClass
		 * @param {String} cssClass
		 */
		ButtonBar.prototype.setDisabledCssClass = function (cssClass) {
			this._containerDisabledCssClass = cssClass;
		};

		/**
		 * Sets the CSS class of standard buttons when the button bar is in a state of disabled.
		 * @method setDisabledButtonCssClass
		 * @param {String} cssClass
		 */
		ButtonBar.prototype.setDisabledButtonStandardCssClass = function (cssClass) {
			this._disabledButtonStandardCssClass = cssClass;
		};

		/**
		 * Sets the CSS class of the highlighted button when the button bar is in a state of disabled.
		 * @method setDisabledButtonHighlightCssClass
		 * @param {String} cssClass
		 */
		ButtonBar.prototype.setDisabledButtonHighlightCssClass = function (cssClass) {
			this._disabledButtonHighlightCssClass = cssClass;
		};

		/**
		 * Sets the CSS class of the disabled buttons when the button bar is in a state of disabled.
		 * @method setDisabledButtonDisabledCssClass
		 * @param {String} cssClass
		 */
		ButtonBar.prototype.setDisabledButtonDisabledCssClass = function (cssClass) {
			this._disabledButtonDisabledCssClass = cssClass;
		};

		/**
		 * Sets the CSS styling of the button bar container.
		 * @method setCssStyle
		 * @param {String} style The new CSS style string.
		 */
		ButtonBar.prototype.setCssStyle = function (style) {
			this._container.setCssStyle(style);
		};

		/**
		 * Sets the emphasis of the button alignment when adding new buttons.
		 * @method setAlignmentEmphasis
		 * @param {Number} alignment Either ButtonBar.VERTICAL_ALIGNMENT or ButtonBar.HORIZONTAL_ALIGNMENT
		 */
		ButtonBar.prototype.setAlignmentEmphasis = function (alignment) {
			this._alignment = alignment;
		};

		/**
		 * Sets the call back function to invoke when a button has been selected.
		 * @method setSelectedCallback
		 * @param {Function} callback Function to be invoked on selected of a button.
		 */
		ButtonBar.prototype.setSelectedCallback = function (callback) {
			this._selectedCallback = callback;
		};

		/**
		 * Sets the call back function to be invoked when a button is highlighted.
		 * @method setHighlightedCallback
		 * @param {Function} callback Function to be invoked on highlight of a button.
		 */
		ButtonBar.prototype.setHighlightedCallback = function (callback) {
			this._highlightedCallback = callback;
		};

		/**
		 * Enables the button bar.  The current button will become highlighted.
		 * @method enable
		 */
		ButtonBar.prototype.enable = function () {
			var i;
			var button;
			var buttonsLength = this._buttons.length;

			if (this._containerCssClass) {
				this._container.setCssClass(this._containerCssClass);
			}

			// call unhighlight on all buttons.  This is to counter an ekioh issue.  The text properties of the
			// button labels can only obtained when they are in the render tree, so this forces the text to be
			// positioned depending on the css styling.

			for (i = 0; i < buttonsLength; i++) {
				button = this._buttons[i];
				if (button.unHighlight) {
					if (this._buttonCssClass[i]) {
						button.setCssClass(this._buttonCssClass[i]);
					}
					button.unHighlight();
				}
			}

			// set the current button to the first if its undefined
			if (!this._currentButton && buttonsLength > 0) {
				this._currentIndex = 0;
				this._currentButton = this._buttons[0];
			}

			// highlight current button
			if (this._currentButton) {
				this._currentButton.highlight();
			}

			this._enabled = true;
		};

		/**
		 * Disables the button bar.  All buttons will become unhighlighted, unless disabled CSS classes have been set
		 * using the setDisabledButtonBar...CssClass methods.
		 * @method disable
		 */
		ButtonBar.prototype.disable = function () {
			var i;
			var buttonsLength = this._buttons.length;
			var button;

			if (this._enabled) {
				if (this._disabledButtonStandardCssClass) {
					for (i = 0; i < buttonsLength; i++) {
						button = this._buttons[i];
						if (button.setCssClass) {
							// backup the current CSS class of the button
							this._buttonCssClass[i] = button.getCssClass();

							// overide the CSS class of the button with one of the disabled button overide classes
							if (!button.isEnabled() && this._disabledButtonDisabledCssClass) {
								button.setCssClass(this._disabledButtonDisabledCssClass);
							} else {
								button.setCssClass(this._disabledButtonStandardCssClass);
							}
						}
					}
				}

				if (this._disabledButtonHighlightCssClass) {
					this._currentButton.setCssClass(this._disabledButtonHighlightCssClass);
				} else {
					this._currentButton.unHighlight();
				}

				if (this._containerDisabledCssClass) {
					this._container.setCssClass(this._containerDisabledCssClass);
				}

				this._enabled = false;
			}
		};

		/**
		 * Handles the key entry.
		 * The navigation links between buttons are dynamically updated on movement,
		 * this provides a more fluid user experience when navigating between buttons of
		 * various sizes.
		 * @method keyHandler
		 * @param {Object} key
		 * @return {Boolean} True if the key press was handled.
		 */
		ButtonBar.prototype.keyHandler = function (key) {
			var keys = $N.gui.FrameworkCore.getKeys();
			var handled = false;
			var nav = this._navigation[this._currentButton.getId()];

			if (this._enabled) {
				switch (key) {
				case keys.KEY_RIGHT:
					if (nav.right !== undefined) {
						this._selectButton(nav.right, "right");
						handled = true;
					}
					break;
				case keys.KEY_LEFT:
					if (nav.left !== undefined) {
						this._selectButton(nav.left, "left");
						handled = true;
					}
					break;
				case keys.KEY_UP:
					if (nav.up !== undefined) {
						this._selectButton(nav.up, "up");
						handled = true;
					}
					break;
				case keys.KEY_DOWN:
					if (nav.down !== undefined) {
						this._selectButton(nav.down, "down");
						handled = true;
					}
					break;
				case keys.KEY_OK:
					this._itemSelected(this._currentButton);
					handled = true;
					break;
				default:
					break;
				}
			}

			return handled;
		};

		/**
		 * Returns the class name as a String.
		 * @method toString
		 * @return {String} The class name as a String.
		 */
		ButtonBar.prototype.toString = function () {
			return "ButtonBar";
		};

		/**
		 * Returns the class name as a String.
		 * @method getClassName
		 * @return {String} The class name as a String.
		 */
		ButtonBar.prototype.getClassName = function () {
			return this.toString();
		};

		/**
		 * Constant for vertically aligned buttons
		 * @property {Number} VERTICAL_ALIGNMENT
		 * @readonly
		 */
		ButtonBar.VERTICAL_ALIGNMENT = 'vertical';

		/**
		 * Constant for horizontal aligned buttons.
		 * @property {Number} HORIZONTAL_ALIGNMENT
		 * @readonly
		 */
		ButtonBar.HORIZONTAL_ALIGNMENT = 'horizontal';

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.ButtonBar = ButtonBar;
		return ButtonBar;
	}
);