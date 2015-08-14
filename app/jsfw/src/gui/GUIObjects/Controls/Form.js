/**
 * The Form class is used to group a series of controls together in such a
 * way that they allow navigation / focus to move between them by tabbing.
 * The default tab behaviour of a form is vertical, meaning that the up key
 * moves to the previous item in the form and the down button moves to the
 * next item in the form, this can be set to be horizontal if required.
 * The default tab order is defined by the order in which the controls were
 * added to the form.
 *
 * Example Markup :
 *
 *
 *     <nagra:form id="myForm" x="200" y="200" width="200" height="400">
 *         <nagra:label id="formName" x="10" y="10" />
 *         <nagra:button id="formButton" x="10" y="60" width="150" height="50" />
 *     </nagra:form/>
 *
 * Example JavaScript :
 *
 *     $N.gui.FrameworkCore.extendWithGUIObjects(document.documentElement, view);
 *	var _slider = new $N.gui.Slider(document, view.myForm); // create and configure a control
 *	_slider.configure({
 *		id: "mySlider",
 *		// rest of configuration
 *	});
 *	// add the controls to our form and activate it
 *	view.myForm.addControl(_slider);
 *	view.myForm.highlight();
 *
 * From within our keyHandler method, we pass the captured key to our form.  The Form
 * object will establish which of the added controls is in focus and filter the key
 * to the particular control.  For example:
 *
 *     function keyHandler (key) {
 *         var keys =  $N.gui.FrameworkCore.getKeys();
 *         var handled = view.myForm.keyHandler(key);
 *         // handle any non captured keys here...
 *         return handled;
 *     }
 *
 * We can then access the individual form elements via the form object, using the
 * component id as a reference. For example:
 *
 *     var percent = view.myForm.mySlider.getProgressPercent();
 *
 * @class $N.gui.Form
 * @extends $N.gui.AbstractControl
 *
 * @requires $N.gui.Group
 * @requires $N.gui.BasicList
 * @requires $N.gui.Util
 * @requires $N.gui.AbstractControl
 * @requires $N.gui.FrameworkCore
 *
 * @author mbrown
 * @constructor
 * @param {Object} docRef document element of the page
 * @param {Object} parent the gui object this should be added to
 *
 */
define('jsfw/gui/GUIObjects/Controls/Form',
    [
    'jsfw/gui/GUIObjects/Components/Group',
    'jsfw/gui/Logic/List/List',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Controls/AbstractControl',
    'jsfw/gui/FrameworkCore'
    ],
    function (Group, List, Util, AbstractControl, FrameworkCore) {

		function Form(docRef, parent) {

			Form.superConstructor.call(this, docRef);

			this._container = new $N.gui.Group(docRef);
			this._rootElement = this._container.getRootElement();

			if (parent) {
				parent.addChild(this);
			}

			this._defaultNextTabKey = "down";
			this._defaultPreviousTabKey = "up";
			this._defaultTabDirection = Form.VERTICAL;

			this._controlList = new $N.gui.BasicList();
			this._controlList.setWrapAround(true);
			this._controlLookup = {};

			this._controlHighlightedCallback = null;
		}

		$N.gui.Util.extend(Form, $N.gui.AbstractControl);

		/**
		 * Constant to denote the tabbing of the form is horizontal
		 * @property {String} HORIZONTAL
		 */
		Form.HORIZONTAL = "horizontal";

		/**
		 * Constant to denote the tabbing of the form is vertical
		 * @property {String} VERTICAL
		 */
		Form.VERTICAL = "vertical";

		var proto = Form.prototype;

		/**
		 * Sets the default key that is to be used for tabbing to the next control
		 * in the form either as a keymap constant or string
		 * @method setDefaultNextTabKey
		 * @param {String} key
		 */
		proto.setDefaultNextTabKey = function (key) {
			var keys = $N.gui.FrameworkCore.getKeys();
			if (keys[key]) {
				this._defaultNextTabKey = keys[key];
			} else {
				this._defaultNextTabKey = key;
			}
		};

		/**
		 * Sets the default key that is to be used for tabbing to the previous control
		 * in the form
		 * @method setDefaultPreviousTabKey
		 * @param {String} key
		 */
		proto.setDefaultPreviousTabKey = function (key) {
			var keys = $N.gui.FrameworkCore.getKeys();
			if (keys[key]) {
				this._defaultPreviousTabKey = keys[key];
			} else {
				this._defaultPreviousTabKey = key;
			}
		};

		/**
		 * Convenience method that allows the default tab keys to be changed
		 * using a direction constant of Form.HORIZONTAL or Form.VERTICAL
		 * @method setDefaultTabDirection
		 * @param {Object} direction
		 */
		proto.setDefaultTabDirection = function (direction) {
			switch (direction) {
			case Form.HORIZONTAL:
				this.setDefaultNextTabKey("right");
				this.setDefaultPreviousTabKey("left");
				this._defaultTabDirection = direction;
				break;
			case Form.VERTICAL:
				this.setDefaultNextTabKey("down");
				this.setDefaultPreviousTabKey("up");
				this._defaultTabDirection = direction;
				break;
			}
		};

		/**
		 * Sets whether wrap around of controls is enabled or not.
		 * @method setWrapAround
		 * @param {Boolean} enable Set to true if wrap around is required
		 */
		proto.setWrapAround = function (enable) {
			if (enable === true || (typeof enable === 'string' && enable.toLowerCase() === 'true')) {
				this._controlList.setWrapAround(true);
			} else {
				this._controlList.setWrapAround(false);
			}
		};

		/**
		 * Adds the passed instantiated control to the form, the control object
		 * must be a subclass of AbstractControl.  Once added a property is created
		 * on the form instance that matches the id of the control for easy access.
		 * @method addControl
		 * @param {Object} control
		 */
		proto.addControl = function (control) {
			var nextIndex = this._controlList.getSize() + 1;
			var id = control.getId();
			var controlObj = {
				index: nextIndex
			};
			this._controlList.addExistingItem(control);
			this._controlLookup[id] = controlObj;
			this[id] = control;
		};

		/**
		 * Returns the currently highlighted control if any otherwise null
		 * @method getHighlightedControl
		 * @return {Object}
		 */
		proto.getHighlightedControl = function () {
			return this._controlList.getSelectedItem();
		};

		/**
		 * Gives focus to the form by highlighting the control that
		 * is correctly selected/highlighted
		 * @method highlight
		 */
		proto.highlight = function () {
			var item = this._controlList.getSelectedItem();
			if (item) {
				item.highlight();
				if (this._controlHighlightedCallback) {
					this._controlHighlightedCallback(item);
				}
			}
		};

		/**
		 * Removes focus from the form by unhighlighting the control that
		 * is correctly selected/highlighted
		 * @method unHighlight
		 */
		proto.unHighlight = function () {
			var item = this._controlList.getSelectedItem();
			if (item) {
				item.unHighlight();
			}
		};

		/**
		 * Moves focus to the next enabled control on the form
		 * @method selectNext
		 */
		proto.selectNext = function () {
			var item = this._controlList.getSelectedItem();
			//see if we have a custom tab defined
			if (this.selectControl(item.getNextTabObject())) {
				return;
			}
			this.unHighlight();
			do {
				this._controlList.selectNext();
			} while (!this._controlList.getSelectedItem().isEnabled());
			this.highlight();
		};

		/**
		 * Moves focus to the previous enabled control on the form
		 * @method selectPrevious
		 */
		proto.selectPrevious = function () {
			var item = this._controlList.getSelectedItem();
			//see if we have a custom tab defined
			if (this.selectControl(item.getPreviousTabObject())) {
				return;
			}
			this.unHighlight();
			do {
				this._controlList.selectPrevious();
			} while (!this._controlList.getSelectedItem().isEnabled());
			this.highlight();
		};

		/**
		 * Given a named control in the form, selects it, if it's enabled.
		 * @method selectControl
		 * @param {String} name
		 * @return {Boolean} true if control was highlighted false otherwise
		 */
		proto.selectControl = function (name) {
			var success = false;
			var item = this._controlLookup[name];

			if (item && this._controlList.getRowAtIndex(item.index).isEnabled()) {
				this.unHighlight();
				this._controlList.selectRowAtIndex(item.index);
				this.highlight();
				success = true;
			}
			return success;
		};

		/**
		 * Defines the key behaviour of the form and associates the default tabbing
		 * and overridden tabbing behaviour to the correct keys.
		 * @method keyHandler
		 * @param {String} key
		 * @return {Boolean} true if key was handled false otherwise
		 */
		proto.keyHandler = function (key) {
			var item = this._controlList.getSelectedItem();
			var handled = false;
			if (item && item.keyHandler) {
				handled = item.keyHandler(key);
				if (handled) {
					return true;
				}
			}
			if (item.getNextTabKeys()) {
				if (item.getNextTabKeys()[key]) {
					this.selectNext();
					return true;
				}
			} else {
				if (key === this._defaultNextTabKey) {
					this.selectNext();
					return true;
				}
			}
			if (item.getPreviousTabKeys()) {
				if (item.getPreviousTabKeys()[key]) {
					this.selectPrevious();
					return true;
				}
			} else {
				if (key === this._defaultPreviousTabKey) {
					this.selectPrevious();
					return true;
				}
			}
		};

		/**
		 * Sets the behavior that should occur when any control in
		 * the form is highlighted, the selected control is passed back
		 * set to null to remove the behaviour
		 * @method setControlHighlightedCallback
		 * @param {Function} callback
		 */
		proto.setControlHighlightedCallback = function (callback) {
			this._controlHighlightedCallback = callback;
		};

		/**
		 * Returns the string "Form" being the class name
		 * @method getClassName
		 * @return {String} The name of this class.
		 */
		proto.getClassName = function () {
			return "Form";
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.Form = Form;
		return Form;
	}
);