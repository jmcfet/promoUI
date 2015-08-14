/**
 * Helper class for language specific date and time strings
 *
 * @class $N.app.GeneralUtil
 * @author rhill
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.GeneralUtil = (function () {

		var log = new $N.apps.core.Log("Helper", "GeneralUtil");
		/**
		 * Puts zeroes at the start of the given number as/if necessary to reach the given length, and returns
		 * the result as a string. If the given length is less than the number of characters in the given number,
		 * then the original number will be returned as a string.
		 * @method padNumberWithZeroes
		 * @param {Number} number  the number to pad and return as a string.
		 * @param {Number} length  the length of the string to return.
		 * @return {String} the given number as a string of the given lengisKeyReleaseEventth, padded with zeroes as/if necessary.
		 */
		function padNumberWithZeroes(number, length) {
			var numberStr = String(number),
				zeroesToAdd = length - numberStr.length,
				i;
			for (i = 0; i < zeroesToAdd; i++) {
				numberStr = "0" + numberStr;
			}
			return numberStr;
		}

		/**
		 * Creates a recording title from the given channel number  and date.
		 * @method createRecordingTitle
		 * @param {Number} channel  the channel number related to the recording.
		 * @param {Date} date  the start date of the recording, to use as part of the recording title.
		 * @return {String}  the title to use for the recording.
		 */
		function createRecordingTitle(channel, date) {
			var formattedDate = $N.app.DateTimeUtil.getDayMonthStringWithSlashFromDate(date),
				formattedTime = $N.app.DateTimeUtil.getFormattedTimeString(date);
			return String(channel) + " " + formattedDate + " " + formattedTime;
		}

		/**
		 * @method getPriceString
		 * @param {Number} originalPrice
		 * @param {String} decimalSeparator
		 * @param {Number} decimalPoints (optional) - how many numbers after the decimal point
		 * @return {String} priceString
		 */
		function getPriceString(originalPrice, decimalSeparator, decimalPoints) {
			var priceString;
			decimalPoints = decimalPoints || 2;
			priceString = originalPrice.toFixed(decimalPoints);
			priceString = priceString.replace('.', decimalSeparator);
			return priceString;
		}

		/**
		 * Method that Convert Bytes to Size
		 * @method bytesToSize
		 * @param {String} bytes
		 * @return {String} converted Bytes to Size in KB, MB OR MB.
		 */
		function bytesToSize(bytes) {
			var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'],
				i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
			if (bytes === 0) {
				return 'n/a';
			}
			if (i === 0) {
				return bytes + ' ' + sizes[i];
			}
			return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
		}

		/**
		 * General purpose memoisation function
		 * It checks if the passed object contains the passed parameter
		 * and returns it or false
		 * @method memoiser
		 * @param {Object} memo The memoisation cache
		 * @param {String} key The cached item key name
		 */
		function memoiser(memo, key) {
			if (memo.hasOwnProperty(key)) {
				return memo[key];
			}
			return false;
		}

		/**
		 * @method isKeyReleaseEvent
		 * @param {String} key
		 * @return {Boolean}
		 */
		function isKeyReleaseEvent(key) {
			var keyReleaseSuffix = $N.app.constants.KEY_RELEASE_SUFFIX;
			return (key.indexOf(keyReleaseSuffix) > 0);
		}


		/*jslint bitwise: true*/
		/**
		 * @method bitwiseAnd
		 * @param {Number} value1
		 * @param {Number} value2
		 * @return {Boolean}
		 */
		function bitwiseAnd(value1, value2) {
			return (value1 & value2);
		}

		/**
		 * @method bitwiseOr
		 * @param {Number} value1
		 * @param {Number} value2
		 * @return {Boolean}
		 */
		function bitwiseOr(value1, value2) {
			return (value1 | value2);
		}

		/**
		 * @method bitShiftLeft
		 * @param {Number} value
		 * @param {Number} bits
		 * @return {Boolean}
		 */
		function bitShiftLeft(value, bits) {
			return (value << bits);
		}

		/**
		 * @method bitShiftRight
		 * @param {Number} value
		 * @param {Number} bits
		 * @return {Boolean}
		 */
		function bitShiftRight(value, bits) {
			return (value >> bits);
		}
		/*jslint bitwise: false*/

		/**
		 * @method convertHexStringToNumber
		 * @param {String} hexString
		 * @return {Number} converted from hex or -1 if not able to convert
		 */
		function convertHexStringToNumber(hexString) {
			var result = parseInt(hexString, 16);
			return (result || result === 0) ? result : -1;
		}

		/**
		 * @method convertNumberToHexString
		 * @param {Number} number to be converted
		 * @param {Number} numberOfDigits - number of digits in the string (will pad with zeros)
		 * @return {String} hexString converted from hex or empty string if not able to convert
		 */
		function convertNumberToHexString(number, numberOfDigits) {
			var result = padNumberWithZeroes(number.toString(16), numberOfDigits);
			return result || "";
		}

		/**
		 * Function will attempt to JSON parse a string to turn it into an object, if it fails it will return null
		 *
		 * @method ParseJSON
		 * @param {String} jsonString - JSON string to be parsed
		 * @param {Function} reviver - function to alter the values parsed, before being returned
		 * @return {Object} object created by parsing the JSON or null on fail
		 */
		function ParseJSON(jsonString, reviver) {
			try {
				return JSON.parse(jsonString, reviver);
			} catch (err) {
				log("ParseJSON error in parsing the JSON");
				return null;
			}
		}

		/**
		 * Function return the exponent value of any number with base.
		 * If base is not mentioned, it's treated as 2.
		 *
		 * @method getExponentValue
		 * @param {Number} value
		 * @param {Number} base
		 * @return {Number} Exponent
		 */
		function getExponentValue(value, base) {
			var newBase = base || 2;
			try {
				return Math.log(value) / Math.log(base);
			} catch (err) {
				log("getExponentValue error in getting the exponent value");
				return null;
			}
		}

		/** @method isFloat
		 * @param {Number} value
		 * @return {Boolean}
		 */
		function isFloat(value) {
			if (Math.floor(value) !== value) {
				return true;
			}
			return false;
		}

		/** @method mixin
		 * @param {Object} to
		 * @param {Object} from
		 * @param {Boolean} overwrite
		 * @return {Object}
		 */
		function mixin(to, from, overwrite) {
			var property;
			for (property in from) {
				if (from.hasOwnProperty(property) && (!overwrite || !to.hasOwnProperty(property))) {
					to[property] = from[property];
				}
			}
			return to;
		}

		// Public
		return {
			padNumberWithZeroes: padNumberWithZeroes,
			createRecordingTitle: createRecordingTitle,
			getPriceString: getPriceString,
			bytesToSize: bytesToSize,
			memoiser: memoiser,
			bitwiseAnd: bitwiseAnd,
			bitwiseOr: bitwiseOr,
			bitShiftLeft: bitShiftLeft,
			bitShiftRight: bitShiftRight,
			convertHexStringToNumber: convertHexStringToNumber,
			convertNumberToHexString: convertNumberToHexString,
			ParseJSON: ParseJSON,
			isKeyReleaseEvent: isKeyReleaseEvent,
			getExponentValue: getExponentValue,
			isFloat: isFloat,
			mixin: mixin
		};
	}());

}($N || {}));