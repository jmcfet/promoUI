/**
 * This control is for accepting numbers entered as IPv4 octets (IPv6 may be supported in the future). The user
 * can enter any number between 0-255 (in decimal only) in each of the octets. Any attempt to input a number above
 * 255 or any non-numeric character is ignored.
 * Pressing the RIGHT key on the RCU indicates that entry for an octet is complete. However, this is allowed
 * only if _something_ has been entered; if there has been no input at all, then RIGHT key presses are ignored.
 * Users of this class can also let the OK key act as input terminator by calling the `terminateWithOkKey` method
 * and passing a value of 'true' to it.
 *
 * @class $N.gui.OctetEntry
 *
 * @extends $N.gui.NumberEntry
 *
 * @requires $N.gui.Util
 * @requires $N.gui.NumberEntry
 * @requires $N.gui.FrameworkCore
 *
 * @author mjagadeesan
 * @constructor
 * @param docRef {Object} reference to the DOM document object
 * @param parent {Object} reference to the parent (containing) DOM object
 */
define('jsfw/gui/GUIObjects/Controls/OctetEntry',
    [
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/Controls/NumberEntry',
    'jsfw/gui/FrameworkCore'
    ],
    function (Util, NumberEntry, FrameworkCore) {

		function OctetEntry(docRef, parent) {
			OctetEntry.superConstructor.call(this, docRef);

			this._containerCSS = "octet_entry_bg";
			this._containerHighlightCSS = "octet_entry_bg_highlight";
			this._containerDisabledCSS = "octet_entry_bg_disabled";
			this._textCSS = "octet_entry_text";
			this._textHighlightCSS = "octet_entry_text_highlight";
			this._textDisabledCSS = "octet_entry_text_disabled";
			this._textChangedCallback = function (value) {};
			this._acceptOkKey = false;
			this._entryFinished = false;
			this.setPasswordChar('');
			this.setMaxCharacters(3);
			this.setHeight(OctetEntry.DEFAULT_HEIGHT);
			this.unHighlight();
			if (parent) {
				parent.addChild(this);
			}
		}

		$N.gui.Util.extend(OctetEntry, $N.gui.NumberEntry);

		/**
		 * The default height the field will be if not set using setHeight
		 * @property {Number} DEFAULT_HEIGHT
		 * @readonly 30
		 */
		OctetEntry.DEFAULT_HEIGHT = 30;

		/**
		 * Overrides the _alignText method of the base class, and adjusts the x co-ordinate of the text box
		 * @method _alignText
		 * @private
		 */
		OctetEntry.prototype._alignText = function () {
			OctetEntry.superClass._alignText.call(this);
			// This positions the text at the centre
			if (this._value.length === 0) {
				this._text.setX(this._text.getX() + 8);
			}
		};

		/**
		 * Sets the callback method that will be invoked when the user enters a value in an octet
		 *
		 * @method setTextChangedCallback
		 * @param callbackMethod {Function} function that will be invoked
		 */
		OctetEntry.prototype.setTextChangedCallback = function (callbackMethod) {
			this._textChangedCallback = callbackMethod;
		};

		/**
		 * Looks for key presses and appends them to the octet if they're valid; ignores them otherwise.
		 *
		 * @method keyHandler
		 * @param key {String} the key that was pressed
		 * @return {Boolean} true if the key press is handled; false otherwise
		 */
		OctetEntry.prototype.keyHandler = function (key) {
			var keys = $N.gui.FrameworkCore.getKeys(),
				value = parseInt(key, 10),
				currentLength = this._value.length;
			if (currentLength === 0 && (key === keys.KEY_RIGHT || (this._acceptOkKey && key === keys.KEY_OK))) {
				return true;
			}
			if (key === keys.KEY_RIGHT || (this._acceptOkKey && key === keys.KEY_OK)) {
				if (!this._entryFinished && this._selectedCallback) {
					this._selectedCallback(this._value);
					this._entryFinished = true;
					return true;
				}
				// input for this octet is already complete, so passing on the key press
				return false;
			}
			if (key === keys.KEY_LEFT) {
				if (currentLength > 0) {
					this._value = this._value.substring(0, currentLength - 1);
					this._text.setText(this._text.getText().substring(0, this._value.length));
					this._textChangedCallback(this._value);
					this._entryFinished = false;
					return true;
				}
				return false;
			}
			if (!isNaN(value) && parseInt(value, 10) < 10) {
				this._entryFinished = false;
				if (currentLength === 2) {
					if (this._value >= '00' &&
							((this._value === '25' && value <= 5) || (this._value <= '24' && value <= 9))) {
						this.appendNumber(value);
					}
				} else if (currentLength === 1 && this._value >= '0' && this._value <= '9') {
					this.appendNumber(value);
				} else if (currentLength === 0) {
					this.appendNumber(value);
				}
				this._textChangedCallback(this._value);
				return true;
			}
			return false;
		};

		/**
		 * Provides an option for users of this class to consider the OK key press as a valid input terminator (the
		 * default behaviour is to accept only the RIGHT key press)
		 *
		 * @method terminateWithOkKey
		 * @param acceptOkKey {Boolean} if true, OctetEntry considers the OK key as a valid input terminator
		 */
		OctetEntry.prototype.terminateWithOkKey = function (acceptOkKey) {
			this._acceptOkKey = acceptOkKey;
		};

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.OctetEntry = OctetEntry;
		return OctetEntry;
	}
);
