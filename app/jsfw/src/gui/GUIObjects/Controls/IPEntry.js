/**
 * This control is for accepting IPv4/6 addresses. It uses four instances of the OctetEntry class for
 * each of the IP address octets.
 *
 * To use this class, the caller should do one of the following:
 *  include a tag for IPEntry in the markup using the nagra namespace
 *
 *     <nagra:IPEntry id="ipEntryBox" width="300" />
 *
 * create an instance of IPEntry where required.
 *
 *     var ipEntryBox = new IPEntry(documentRef, parentElement);
 *
 * After getting an instance of IPEntry, the caller needs to ensure that `setEntryFinishedCallback` is called
 * with an appropriate callback method to receive the IP address entered. Calls to setWidth and setHeight
 * will help in changing the appearance of the control as needed as also will calls to setCssStyle. Once an
 * octet has enough digits, it will accept an input terminator key press to signal end of input. When the
 * input terminator key is pressed on the last octet, the callback method of the class (set by calling
 * `setFinishedCallback`) is invoked.
 * @class $N.gui.IPEntry
 * @extends $N.gui.AbstractControl
 *
 * @requires $N.gui.AbstractControl
 * @requires $N.gui.Container
 * @requires $N.gui.OctetEntry
 * @requires $N.gui.Label
 * @requires $N.gui.Util
 * @requires $N.gui.FrameworkCore
 *
 * @author mbrown
 * @constructor
 * @param {Object} docRef document element of the page
 * @param {Object} parent the gui object this should be added to
 */
define('jsfw/gui/GUIObjects/Controls/IPEntry',
    [
    'jsfw/gui/GUIObjects/Controls/AbstractControl',
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Controls/OctetEntry',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/FrameworkCore'
    ],
    function (AbstractControl, Container, OctetEntry, Label, Util, FrameworkCore) {

		function IPEntry(docRef, parent) {
			var self = this,
				i;

			this._entryFinishedCallback = function (text) {
				if (text.length > 0) {
					self._ipAddress = '';
					for (i = 1; i <= self._currentOctetIndex; i++) {
						if (self._ipAddress.length > 0) {
							self._ipAddress += '.';
						}
						self._ipAddress += self['_octet' + String(i)].getValue();
					}
					if (self._currentOctetIndex === 4) {
						self._entryFinishedCallback(self._ipAddress);
					} else if (self._currentOctetIndex < 4) {
						self._currentOctet.unHighlight();
						self._currentOctetIndex++;
						self._currentOctet = self['_octet' + String(self._currentOctetIndex)];
						self._currentOctet.highlight();
					}
				}
			};

			IPEntry.superConstructor.call(this, docRef);
			this._container = new $N.gui.Container(docRef, parent);
			this._octet1Config = {
				x: 5,
				y: 5,
				width: 40,
				maxCharacters: 3
			};
			this._octet2Config = {
				x: 50,
				y: 5,
				width: 40,
				maxCharacters: 3
			};
			this._octet3Config = {
				x: 95,
				y: 5,
				width: 40,
				maxCharacters: 3
			};
			this._octet4Config = {
				x: 140,
				y: 5,
				width: 40,
				maxCharacters: 3
			};
			this._ipAddress = '';
			this._octet1 = new $N.gui.OctetEntry(docRef, this._container);
			this._octet2 = new $N.gui.OctetEntry(docRef, this._container);
			this._seperator1 = new $N.gui.Label(docRef, this._container);
			this._seperator1.setCssClass("octet_entry_text");
			this._octet3 = new $N.gui.OctetEntry(docRef, this._container);
			this._seperator2 = new $N.gui.Label(docRef, this._container);
			this._seperator2.setCssClass("octet_entry_text");
			this._octet4 = new $N.gui.OctetEntry(docRef, this._container);
			this._seperator3 = new $N.gui.Label(docRef, this._container);
			this._seperator3.setCssClass("octet_entry_text");
			this._currentOctet = this._octet1;
			this._currentOctet.highlight();
			this._currentOctetIndex = 1;

			this._octet1.configure(this._octet1Config);
			this._octet1.setSelectedCallback(this._entryFinishedCallback);
			this._octet2.configure(this._octet2Config);
			this._octet2.setSelectedCallback(this._entryFinishedCallback);
			this._octet3.configure(this._octet3Config);
			this._octet3.setSelectedCallback(this._entryFinishedCallback);
			this._octet4.configure(this._octet4Config);
			this._octet4.setSelectedCallback(this._entryFinishedCallback);
			this._octet4.terminateWithOkKey(true);
			this._entryFinishedCallback = null;

			this._rootElement = this._container.getRootElement();

			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(IPEntry, $N.gui.AbstractControl);

		var proto = IPEntry.prototype;

		/**
		 * Handles key presses for this control. Numeric and input terminator key presses are handled by
		 * the individual octets, except for the last octet.
		 *
		 * @method keyHandler
		 * @param key {String} the key that was pressed
		 * @return {Boolean} true if the key press was handled; false otherwise
		 */
		proto.keyHandler = function (key) {
			var keys = $N.gui.FrameworkCore.getKeys(),
				handled = this._currentOctet.keyHandler(key);
			if (!handled) {
				if (key === keys.KEY_LEFT) {
					if (this._currentOctetIndex > 1) {
						this._currentOctet.unHighlight();
						this._currentOctetIndex--;
						this._currentOctet = this['_octet' + String(this._currentOctetIndex)];
						this._currentOctet.highlight();
						handled = true;
					}
				}
				if (key === keys.KEY_OK) {
					if (this._currentOctet === this._octet4) {
						if (this._entryFinishedCallback) {
							this._entryFinishedCallback(this._ipAddress);
						}
						handled = true;
					}
				}
			}
			return handled;
		};

		/**
		 * Sets the callback method that will be invoked when the user has finished entering an IP address
		 *
		 * @method setFinishedCallback
		 * @param callbackMethod {Function} function that will be invoked
		 */
		proto.setFinishedCallback = function (callbackMethod) {
			this._entryFinishedCallback = callbackMethod;
		};

		/**
		 * Sets the callback method that will be invoked when the user enters a value in an octet
		 *
		 * @method setTextChangedCallback
		 * @param callbackMethod {Function} function that will be invoked
		 */
		proto.setTextChangedCallback = function (callbackMethod) {
			this._textChangedCallback = callbackMethod;
			this._octet1.setTextChangedCallback(this._textChangedCallback);
			this._octet2.setTextChangedCallback(this._textChangedCallback);
			this._octet3.setTextChangedCallback(this._textChangedCallback);
			this._octet4.setTextChangedCallback(this._textChangedCallback);
		};


	/**
		 * Gets the IP address entered by the user at the point of calling
		 *
		 * @method getCurrentIPText
		 *
		 */
		proto.getCurrentIPText = function () {
			var currentIPText = "";
			if (this._octet1.getValue() !== "") {
				currentIPText = this._octet1.getValue();
			}
			if (this._octet2.getValue() !== "") {
				currentIPText = currentIPText + "." + this._octet2.getValue();
			}
			if (this._octet3.getValue() !== "") {
				currentIPText = currentIPText + "." + this._octet3.getValue();
			}
			if (this._octet4.getValue() !== "") {
				currentIPText = currentIPText + "." + this._octet4.getValue();
			}

			return currentIPText;
		};

		/**
		 * Sets the width of this control
		 * @method setWidth
		 * @param width {Number} new width
		 */
		proto.setWidth = function (width) {
			this._container.setWidth(width);
			var octetWidth = (width / 4) - 6,
				adjustmentFactor = 5;
			this._octet1.setWidth(octetWidth);

			this._octet2.setX(this._octet1.getTrueX() + octetWidth + adjustmentFactor);
			this._octet2.setWidth(octetWidth);
			this._seperator1.setX(this._octet2.getTrueX());

			this._octet3.setX(this._octet2.getTrueX() + octetWidth + adjustmentFactor);
			this._octet3.setWidth(octetWidth);
			this._seperator2.setX(this._octet3.getTrueX());

			this._octet4.setX(this._octet3.getTrueX() + octetWidth + adjustmentFactor);
			this._octet4.setWidth(octetWidth);
			this._seperator3.setX(this._octet4.getTrueX());
		};

		/**
		 * Sets the height of this control
		 * @method setHeight
		 * @param height {Number} new height
		 */
		proto.setHeight = function (height) {
			this._container.setHeight(height);
			this._seperator1.setY(height);
			this._seperator2.setY(height);
			this._seperator3.setY(height);
		};

		/**
		 * Sets the CSS style for this control
		 * @method setCssStyle
		 * @param style {String} new style rules
		 */
		proto.setCssStyle = function (style) {
			this._container.setCssStyle(style);
		};

		/**
		 * Sets the CSS class for this control
		 * @method setCssClass
		 * @param cssClass {String} new style rules
		 */
		proto.setCssClass = function (cssClass) {
			this._container.setCssClass(cssClass);
		};

		/**
		 * Returns the IP address entered thus far
		 * @method getIPAddress
		 * @return {String} the IP address
		 */
		proto.getIPAddress = function () {
			return this._ipAddress;
		};

		/**
		 * Sets the IP address for this control
		 * @method setIPAddress
		 * @param ipAddress {String} the IP address
		 */
		// TODO: set the text in the individual octets.
		proto.setIPAddress = function (ipAddress) {
		    this._ipAddress = ipAddress;
		};

		/**
		 * Returns the value of the octet that currently has focus
		 * @method getCurrentOctet
		 * @return {String} the value entered in the octet that currently has focus
		 */
		proto.getCurrentOctet = function () {
			return this['_octet' + String(this._currentOctetIndex)].getValue();
		};

		/**
		 * Resets the IPEntry to it's initial empty state
		 * @method clearValues
		 */
		proto.clearValues = function () {
			this._octet1.reset();
			this._octet2.reset();
			this._octet3.reset();
			this._octet4.reset();
			this._currentOctet.unHighlight();
			this._currentOctetIndex = 1;
			this._currentOctet = this._octet1;
			this._currentOctet.highlight();
			this.setIPAddress("");
		};

		/**
		 * Sets the character to use to seperate each octet entry
		 * @method setSeperatorChar
		 * @param {string} character
		 */
		proto.setSeperatorChar = function (character) {
			this._seperator1.setText(character);
			this._seperator2.setText(character);
			this._seperator3.setText(character);
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.IPEntry = IPEntry;
		return IPEntry;
	}
);