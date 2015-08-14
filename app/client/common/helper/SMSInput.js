/**
 * SMSInput handled the logic for input of characters using the number
 * keys on the remote control.  There is no GUI code in this class this
 * needs to managed outside of this class after calling inputChar
 * @class $N.app.SMSInput
 * @constructor
 * @author mbrown
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.SMSInput = function () {

		var lastKey = 0,
			timerActive = false,
			keypad = [],
			to,
			maxChars = 100,

			SMSKey = function (chars) {
				var characters = chars.split(","),
					charPointer = 0;

				this.getCharacterAndMoveNext = function () {
					var newChar = characters[charPointer];
					charPointer = (charPointer < (characters.length - 1)) ? ++charPointer : 0;
					return newChar;
				};

				this.getPreviousCharacter = function () {
					return (charPointer > 0) ? characters[charPointer - 1] : characters[0];
				};

				this.resetPointer = function () {
					charPointer = 0;
				};

				this.getCharacterLength = function () {

					return characters.length;

				};
			},

			/**
			* Clears the timer used to cycle through letters
			* @method clearTimer
			* @private
			*/
			clearTimer = function () {
				clearTimeout(to);
				timerActive = false;
			};

		/**
		 * Set the maximum number of characters that can be entered
		 * @method setMaxChars
		 * @param {Object} max
		 */
		this.setMaxChars = function (max) {
			maxChars = max;
		};

		/**
		 * Takes a multi-dimensional array representing the characters
		 * associated with the numbers
		 * @method initKeypad
		 * @param {Object} smsAlphabet
		 */
		this.initKeypad = function (smsAlphabet) {
			var i;
			for (i = 0; i < smsAlphabet.length; i++) {
				keypad[i] = new SMSKey(smsAlphabet[i]);
			}
		};

		/**
		 * Takes a number key and the current text and returns the new
		 * string based on what number was pressed
		 * @method inputChar
		 * @param {Object} keyNumber
		 * @param {Object} currentText
		 * @return {String} The new string based on what number was pressed.
		 */
		this.inputChar = function (keyNumber, currentText) {
			var prevChar = null,
				nextChar = null,
				newText = null;

			if ((keypad[keyNumber].getCharacterLength() > 1) && (keyNumber === lastKey) && timerActive) {
				clearTimer();
				prevChar = keypad[keyNumber].getPreviousCharacter();
				nextChar = keypad[keyNumber].getCharacterAndMoveNext();
				newText = currentText.substring(0, currentText.length - prevChar.length) + nextChar;
			} else {
				clearTimer();
				keypad[lastKey].resetPointer();
				nextChar = keypad[keyNumber].getCharacterAndMoveNext();
				newText = (currentText.length < maxChars) ? currentText + nextChar : currentText;
			}
			timerActive = true;
			to = setTimeout(clearTimer, $N.app.SMSInput.CYCLE_TIMEOUT);
			lastKey = keyNumber;

			return newText;
		};
	};
	$N.app.SMSInput.CYCLE_TIMEOUT = 1000;

}($N || {}));