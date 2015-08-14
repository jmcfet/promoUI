/**
 * @class $N.app.StringUtil
 * @static
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.StringUtil = (function () {

		var NOT_FOUND = -1,
			WORD_DELIMITER = ' ',
			START_OR_SPACE = '(^|\\s)',
			END_OR_SPACE = '($|\\s)';

		/**
		 * Verify if a string starts with a specified prefix
		 * @method isStringStartsWith
		 * @param {String} string to perform check on
		 * @param {String} prefix string to search for
		 * @return {Boolean}
		 */
		function isStringStartsWith(str, prefix) {
			return str.indexOf(prefix) === 0;
		}

		/**
		 * Verify if a string ends with a specified suffix
		 * @method isStringEndsWith
		 * @param {String} string to perform check on
		 * @param {String} suffix string to search for
		 * @return {Boolean}
		 */
		function isStringEndsWith(str, suffix) {
			return str.indexOf(suffix, str.length - suffix.length) !== -1;
		}


		/**
		 * @method isNullOrUndefined
		 * @param {String} string to perform check on
		 * @return {Boolean}
		 */
		function isNullOrUndefined(str) {
			return ((str === null) || (str === undefined));
		}

		/**
		 * Remove leading zeros from a string
		 * @method removeLeadingZeros
		 * @param {String} string to perform check on
		 * @return {String}
		 */
		function removeLeadingZeros(str) {
			if (str) {
				return str.toString().replace(/^0+/, '');
			}
			return "";
		}
		/**
		 * Capitalise each of the first letters within a string
		 * @method firstLetterPerWordCapitol
		 * @param {String} str the input sting
		 * @return {String}
		 */
		function firstLetterPerWordCapitol(str) {
			var lower = str.toLowerCase(),
				compFunc = function (x) {
					return x.toUpperCase();
				};
			return lower.replace(/(^| )(\w)/g, compFunc);
		}

		/**
		 * Given a string returns the same string but with the first letter
		 * capitalised
		 * @method upcaseFirstLetter
		 * @param {String} the input string
		 * @return {String}
		 */
		function upcaseFirstLetter(str) {
			if (str[0] === str[0].toLowerCase()) {
				return str.replace(/\b[a-z]/, function (chr) {
					return chr.toUpperCase();
				});
			} else {
				return str;
			}
		}

		/**
		 * Given a string returns the same string but with the first letter
		 * lower cased
		 * @method lowercaseFirstLetter
		 * @param {String} the input string
		 * @return {String}
		 */
		function lowercaseFirstLetter(str) {
			if (str[0] === str[0].toUpperCase()) {
				return str.replace(/\b[A-Z]/, function (chr) {
					return chr.toLowerCase();
				});
			} else {
				return str;
			}
		}

		/**
		 * Function to join the parameters from 2nd onwards by the specified delimiter as the 1st parameter
		 * Can also be passed a delimiter and array, joining each item in the array
		 * @method join
		 * @param {String} delimiter
		 * @param {Array} stringArray
		 * @return {String} the concatenated result
		 */
		function join(delimiter, stringArray) {
			var arrayToJoin = [],
				i,
				result = "",
				loopCount;
			if (Object.prototype.toString.call(stringArray) === "[object Array]") {
				arrayToJoin = stringArray;
			} else {
				arrayToJoin = Array.prototype.slice.call(arguments, 1);
			}
			loopCount = arrayToJoin.length;
			for (i = 0; i < loopCount; i++) {
				if (arrayToJoin[i] && typeof arrayToJoin[i] === "string") {
					result += arrayToJoin[i] + delimiter;
				}
			}
			return result.substring(0, result.lastIndexOf(delimiter));
		}

		/**
		 * Function to extract an object from a string split into key/value pairs
		 * e.g. 'PropertyOne=Value One;PropertyTwo=Value Two;Another Property=ValueHere'
		 * @method extractObjectFromString
		 * @param {String} strToParse - string to parse for key\value pairs
		 * @param {String} pairDelimiter - delimeter between each key\value pair
		 * @param {String} keyValueDelimeter - delimeter between each key and value within a pair
		 * @return {Object} an object extracted from a string
		 */
		function extractObjectFromString(strToParse, pairDelimiter, keyValueDelimeter) {
			var returnObject = {},
				keyValuePairs,
				keyValuePairsLength,
				element,
				i = 0;
			if (pairDelimiter && keyValueDelimeter) {
				keyValuePairs = strToParse.split(pairDelimiter);
				keyValuePairsLength = keyValuePairs.length;
				for (i = 0; i < keyValuePairsLength; i++) {
					element = keyValuePairs[i].split(keyValueDelimeter);
					returnObject[element[0]] = element[1];
				}
			}
			return returnObject;
		}

		/**
		 * Function to escape all apostrophes in a string for use with SQL queries
		 * @method escapeApostrophes
		 * @param {String} str
		 * @return {String} string with apostrophes escaped
		 */
		function escapeApostrophes(str) {
			return str.replace("'", "''");
		}

		/**
		 * @method addLeadingForwardSlash
		 * @param {String} str
		 * @return {String} string with leading forward slash added
		 */
		function addLeadingForwardSlash(str) {
			if (str && str.substring(0, 1) !== "/") {
				str = "/" + str;
			}
			return str;
		}

		/**
		 * @method removeLeadingForwardSlash
		 * @param {String} str
		 * @return {String} string with leading forward slash removed
		 */
		function removeLeadingForwardSlash(str) {
			if (str && str.substring(0, 1) === "/") {
				str = str.substring(1);
			}
			return str;
		}

		/**
		 * @method isStringInArray
		 * @param {String} str
		 * @param {Array} array of string
		 * @return {Boolean} returns true if found, false if not
		 */
		function isStringInArray(str, arrayOfStrings) {
			var i = 0,
				arrayOfStringsLength = 0;
			if (str && arrayOfStrings) {
				arrayOfStringsLength = arrayOfStrings.length;
				for (i = 0; i < arrayOfStringsLength; i++) {
					if (str === arrayOfStrings[i]) {
						return true;
					}
				}
			}
			return false;
		}

		/**
		 * @method getWordMatcher
		 * @param {String} word
		 * @return {RegExp}
		 */
		function getWordMatcher(word) {
			return new RegExp(START_OR_SPACE + word + END_OR_SPACE, 'g');
		}

		/**
		 * @method addWordUnique
		 * @param {String} originalString
		 * @param {String} word
		 * @return {String}
		 */
		function addWordUnique(originalString, word) {
			if (!originalString) {
				return word;
			}
			if (originalString.search(getWordMatcher(word)) === NOT_FOUND) {
				return originalString + WORD_DELIMITER + word;
			}
			return originalString;
		}

		/**
		 * @method removeWord
		 * @param {String} originalString
		 * @param {String} word
		 * @return {String}
		 */
		function removeWord(originalString, word) {
			if (!originalString) {
				return '';
			}
			return originalString.replace(getWordMatcher(word), WORD_DELIMITER);
		}

		// Public
		return {
			isStringStartsWith: isStringStartsWith,
			isStringEndsWith: isStringEndsWith,
			isStringInArray: isStringInArray,
			isNullOrUndefined: isNullOrUndefined,
			firstLetterPerWordCapitol: firstLetterPerWordCapitol,
			removeLeadingZeros: removeLeadingZeros,
			upcaseFirstLetter: upcaseFirstLetter,
			lowercaseFirstLetter: lowercaseFirstLetter,
			join: join,
			escapeApostrophes: escapeApostrophes,
			addLeadingForwardSlash: addLeadingForwardSlash,
			removeLeadingForwardSlash: removeLeadingForwardSlash,
			addWordUnique: addWordUnique,
			removeWord: removeWord,
			extractObject: extractObjectFromString
		};
	}());

}($N || {}));
