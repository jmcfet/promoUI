/**
 * @class $N.app.ArrayUtil
 * @static
 */
(function ($N) {
	"use strict";
	$N = $N || {};
	$N.app = $N.app || {};
	$N.app.ArrayUtil = (function () {

		var EQUAL = 0,
			GREATER_THAN = 1,
			LESS_THAN = -1;

		/**
		 * function to search for an element across the array against a
		 * criteria encapsulated by a function.
		 *
		 * @method getIndex
		 * @public
		 * @param {function} predict function which returns a boolean value to
		 * indicate if the argument meets the search criteria
		 * @returns {integer} the value of the index if found, else -1
		 */
		function getIndex(array, predict) {
			var i, count, item;
			count = array.length;
			for (i = 0; i < count; i++) {
				item = array[i];
				if (predict(item)) {
					return i;
				}
			}
			return -1;
		}

		/**
		 * Removes any empty cells from an array
		 * @method removeEmptyElementsFromArray
		 * @param {Array} actual - the array to be cleaned
		 * @return {Array}  the cleaned array
		 **/
		function removeEmptyElementsFromArray(actual) {
			var newArray = [],
				i;
			for (i = 0; i < actual.length; i++) {
				if (actual[i]) {
					newArray.push(actual[i]);
				}
			}
			return newArray;
		}

		/**
		 * Shuffles a given array and returns
		 * @method arrayShuffle
		 * @private
		 * @param {Array} inputArray Array to be shuffled
		 * @return {Array} newArray Shuffled array
		 */
		function arrayShuffle(inputArray) {
			var newArray = inputArray.slice(),
				len = newArray.length,
				i = len,
				p,
				t;
			while (i--) {
				p = parseInt(Math.random() * len, 10);
				t = newArray[i];
				newArray[i] = newArray[p];
				newArray[p] = t;
			}
			return newArray;
		}

		/**
		 * Returns difference between two arrays
		 * @method arrayDifference
		 * @param {Array} array1
		 * @param {Array} array2
		 * @param {Boolean} secondAttempt If false, the function will call itself again with the arrays flipped
		 * @return {Array}
		 */
		function arrayDifference(array1, array2, secondAttempt) {
			var returnArray = [],
				i,
				j = 0;

			for (i = 0; i < array1.length; i++) {
				if (array2.indexOf(array1[i]) === -1) {
					returnArray[j] = array1[i];
					j++;
				}
			}

			if (returnArray.length === 0 && !secondAttempt) {
				return arrayDifference(array2, array1, true);
			}
			return returnArray;
		}

		/**
		 * Remove duplicates from an array,
		 * pass in the array and a comparison function
		 * Designed to work with any array via the use of the compareFunction
		 * @method removeDuplicates
		 * @private
		 * @param {Array} array
		 * @param {Function} compareFunction
		 */
		function removeDuplicates(array, compareFunction) {
			var i;
			for (i = 1; i < array.length; i) {
				if (compareFunction(array[i - 1], array[i]) === EQUAL) {
					array.splice(i, 1);
				} else {
					i++;
				}
			}
			return array;
		}

		/**
		 * Sort and remove duplicates from an array,
		 * pass in the array and a comparison function
		 * Designed to work with any array via the use of the compareFunction
		 * @method sortAndRemoveDuplicates
		 * @private
		 * @param {Array} array
		 * @param {Function} compareFunction
		 */
		function sortAndRemoveDuplicates(array, compareFunction) {
			array.sort(compareFunction);
			return removeDuplicates(array, compareFunction);
		}

		/**
		 * @method sortByProperty
		 * @private
		 * @param {Array} array
		 * @param {String} property name
		 * @param {Boolean} descending or not
		 * @param {Function} transformation
		 */
		function sortByProperty(array, property, desc, transformation) {
			var sorter = function (a, b) {
				if (desc) {
					return transformation && typeof transformation === "Function" ? transformation(b[property]) - transformation(a[property]) : b[property] - a[property];
				}
				return transformation && typeof transformation === "Function" ? transformation(a[property]) - transformation(b[property]) : a[property] - b[property];
			};

			array.sort(sorter);
		}

		/**
		 * @method sortByStringProperty
		 * @private
		 * @param {Array} array
		 * @param {String} property name
		 * @param {Boolean} descending or not
		 */
		function sortByStringProperty(array, property, desc) {
			var sorter = function (a, b) {
				if (a[property] === b[property]) {
					return EQUAL;
				}
				if (desc) {
					if (b[property] > a[property]) {
						return GREATER_THAN;
					}
				} else {
					if (a[property] > b[property]) {
						return GREATER_THAN;
					}
				}
				return LESS_THAN;
			};

			array.sort(sorter);
		}

		// Public
		return {
			getIndex: getIndex,
			removeEmptyElementsFromArray: removeEmptyElementsFromArray,
			arrayShuffle: arrayShuffle,
			removeDuplicates: removeDuplicates,
			sortAndRemoveDuplicates: sortAndRemoveDuplicates,
			sortByProperty: sortByProperty,
			sortByStringProperty: sortByStringProperty,
			arrayDifference: arrayDifference,
			EQUAL: EQUAL,
			GREATER_THAN: GREATER_THAN,
			LESS_THAN: LESS_THAN
		};
	}());

}($N || {}));