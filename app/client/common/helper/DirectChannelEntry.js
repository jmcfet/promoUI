/**
 * DirectChannelEntry class updates the channel display for when a user input a channel
 * number using the keypad. Upon a successful channel being entered, a callback is run
 *
 * @author Gareth Stacey
 * @class $N.app.DirectChannelEntry
 * @constructor
 * @param {Number} maxChannelNumberDigits The maximum amount of digits that can be input
 * @param {Number} channelNumberTimeoutMS Time in milliseconds to wait for next key input
 */
(function ($N) {
	"use strict";
	function DirectChannelEntry(maxChannelNumberDigits, channelNumberTimeoutMS) {
		this._maxChannelNumberDigits = maxChannelNumberDigits;
		this._channelNumberString = "";
		this._channelNumberTimeoutMS = channelNumberTimeoutMS;
		this._channelNumberTimeout = null;
		this._channelEnteredCallback = function () {};
		this._invalidClassName = "invalidChannelNumber";
		this._channelNumberText = {};
		this._cursorObj = null;
		this._active = false;
		this._callCancelChannelEntry = false;
		this._allowZero = false;
		this.CURSOR_STR = "_";
		this.ANIMATION_DURATION = "500ms";
		this.NON_ZERO_NUMBER = "1";
		this.ZERO_NUMBER = 0;
		this.CHANGE_IMMEDIATE_TIMEOUT = 200;
	}


	/**
	 * @method setResetToNonZeroNumber
	 * @param {Boolean} value
	 */
	DirectChannelEntry.prototype.allowZero = function (value) {
		this._allowZero = value;
	};


	/**
	 * Sets the callback for when a channel is entered
	 * @method setChannelEnteredCallback
	 * @param {Object} callback
	 */
	DirectChannelEntry.prototype.setChannelEnteredCallback = function (callback) {
		this._channelEnteredCallback = callback;
	};

	/**
	 * @method cancelEntry
	 * @param {boolean} doCallback
	 * */
	DirectChannelEntry.prototype.cancelEntry = function (doCallback) {
		if (this.isActive()) {
			this.clearTimer();
			if (this._cursorObj) {
				this._cursorObj.hide();
			}
			if (this._channelNumberText) {
				this._channelNumberText.show();
			}
			if (doCallback) {
				this._channelEnteredCallback(null);
			}
			this._channelNumberString = "";
			this._callCancelChannelEntry = false;
			this._callChannelEntryWait = false;
			this._active = false;
		}
	};

	/**
	 * @method _setChannelNumberTimeout
	 * */
	DirectChannelEntry.prototype._setChannelNumberTimeout = function () {
		this._callCancelChannelEntry = this._callCancelChannelEntry || false;
		this._callChannelEntryWait = this._callChannelEntryWait || false;
		var me = this;
		if ((this._callCancelChannelEntry || this._callChannelEntryWait) && this._active) {
			this._channelNumberTimeout = setTimeout(
				function () {
					if (me._callChannelEntryWait && me._channelNumberString) {
						me._showChannelEntered();
					} else {
						me.cancelEntry(true);
					}
				},
				this._channelNumberTimeoutMS
			);
		}
	};
	/**
	 * @method _removeChannelDigit
	 */
	DirectChannelEntry.prototype._removeChannelDigit = function () {
		this._channelNumberString = this._channelNumberString.substring(0, this._channelNumberString.length - 1);
		// if we have more than 1 number display the channel number and run the Channel Entry Wait function.
		if (this._channelNumberString.length > 0) {
			this._setChannelNumberText(this._channelNumberString);
			if (this._cursorObj) {
				this.updateCursorPostion(this._channelNumberString);
			}
			this._callChannelEntryWait = true;
		} else {
			// else cancel entry of channel
			if (this._cursorObj) {
				this._setChannelNumberText("_");
			} else {
				this._setChannelNumberText("");
			}
			this._callCancelChannelEntry = true;
		}
	};

	/**
	 * @method _addChannelDigit
	 * @param {Number} digit the number that is pressed on the remote
	 */
	DirectChannelEntry.prototype._addChannelDigit = function (digit) {
		var keys = $N.apps.core.KeyInterceptor.getKeyMap();
		this._active = true;
		digit -= keys.KEY_ZERO;

		// if the number of digits entered is less than max digits
		if (this._channelNumberString.length < this._maxChannelNumberDigits) {
			//append current digit
			this._channelNumberString += digit.toString();
			if (this._channelNumberString.length <= this._maxChannelNumberDigits) {
				this._setChannelNumberText(this._channelNumberString);
				if (this._cursorObj) {
					this.updateCursorPostion(this._channelNumberString);
				}
			}
			this._callChannelEntryWait = true;
		}
	};

	/**
	 * Calculates the digits that are to be displayed
	 * @method updateChannelDigits
	 * @param {Number} digit the number that is pressed on the remote
	 * @param {Object} labelObject The label that will be updated with the digit.
	 * @param {Object} cursorObj The cursor that will be updated with the digit.
	 */
	DirectChannelEntry.prototype.updateChannelDigits = function (digit, labelObject, cursorObj) {
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			me;
		this._channelNumberText = labelObject;
		if (cursorObj) {
			this.configureCursor(cursorObj);
		}
		this.clearTimer();
		if (digit === keys.KEY_LEFT) {
			if (!this._active) {
				return false;
			}
			this._removeChannelDigit();
		} else {
			this._addChannelDigit(digit);
		}
		if (this._channelNumberString.length === this._maxChannelNumberDigits) {
			me = this;
			setTimeout(function () {
				me.okKeyHandler();
			}, me.CHANGE_IMMEDIATE_TIMEOUT);
		} else {
			this._setChannelNumberTimeout();
		}
		return true;
	};
	/**
	 * Displays the channel number that has been entered and run the callback
	 * @method _showChannelEntered
	 * @private
	 */
	DirectChannelEntry.prototype._showChannelEntered = function () {
		if (!this._allowZero && parseInt(this._channelNumberString, 10) === this.ZERO_NUMBER) {
			this._channelNumberString = this.NON_ZERO_NUMBER;
		}
		this._setChannelNumberText(this._channelNumberString);
		this._channelEnteredCallback(parseInt(this._channelNumberString, 10));
		this._channelNumberString = "";
		if (this._cursorObj) {
			this._cursorObj.hide();
			this._cursorObj._attributeAnim.opacity.cancelAnimation();
		}
		this._callCancelChannelEntry = false;
		this._callChannelEntryWait = false;
		this._active = false;
	};
	/**
	 * clears the timeout for the channel number
	 * @method clearTimer
	 */
	DirectChannelEntry.prototype.clearTimer = function () {
		if (this._channelNumberTimeout) {
			clearTimeout(this._channelNumberTimeout);
		}
	};

	DirectChannelEntry.prototype.isActive = function () {
		return this._active;
	};

	/**
	 * displays the given channel number
	 * @method _setChannelNumberText
	 * @param {String} chanNum
	 */
	DirectChannelEntry.prototype._setChannelNumberText = function (chanNum) {
		if (chanNum === this.CURSOR_STR && this._cursorObj) {
			this._cursorObj.show();
			this._channelNumberText.hide();
		} else {
			this._channelNumberText.show();
			this._channelNumberText.setText(chanNum);
		}
	};

	/**
	 * update the position of the cursor as and when the number is entered
	 * @method updateCursorPostion
	 * @param {String} chanNum
	 */
	DirectChannelEntry.prototype.updateCursorPostion = function (chanNum) {
		if (chanNum.length < this._maxChannelNumberDigits) {
			this._cursorObj.show();
		}
	};

	/**
	 * Configuration for the Cursor
	 * @method configureCursor
	 * @param {String} cursorObj
	 */
	DirectChannelEntry.prototype.configureCursor = function (cursorObj) {
		this._cursorObj = cursorObj;
		this._cursorObj.setText(this.CURSOR_STR);
		this._cursorObj.hide();
		this.animateCursor();
	};

	/**
	 * Animation for the Cursor
	 * @method animateCursor
	 */
	DirectChannelEntry.prototype.animateCursor = function () {
		this._cursorObj.setAnimationDuration(this.ANIMATION_DURATION);
		this._cursorObj.addFadeAnimation();
		this._cursorObj.doFade(0, true, false);
	};

	/**
	 * Checks if the user is inputting a channel number and runs the callback if so
	 * @method okKeyHandler
	 * @return {boolean} true if user is in direct channel entry mode, false otherwise
	 */
	DirectChannelEntry.prototype.okKeyHandler = function () {
		if (this.isActive()) {
			this.clearTimer();
			if (this._channelNumberString) {
				this._showChannelEntered();
			} else {
				this.cancelEntry(true);
			}
			return true;
		}
		return false;
	};

	$N.app = $N.app || {};
	$N.app.DirectChannelEntry = DirectChannelEntry;

}($N || {}));
