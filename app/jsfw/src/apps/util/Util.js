/**
 * This class contains methods that deal with strings (removing spaces), check whether an element is
 * present in an array, format dates, and other assorted things.
 *
 * @class $N.apps.util.Util
 *
 * @singleton
 */
/*global alert, define*/

var $N = $N || {};

//set env property for classes to use
$N.env = {};

if (!window.define) {
	window.define = function (mod, dependency, func) {
		//console.log(func);
		var modNameSpace,
			i = 0,
			dependencyNamespaceObjs = [],
			getNameSpace = function (moduleLocation) {
				var namespaceObj = $N,
					i = 0;
				//namespace func
				moduleLocation = moduleLocation.replace("jsfw/", "");
				moduleLocation = moduleLocation.split("/");
				if (moduleLocation[0].toLowerCase() === "gui") {
					namespaceObj["gui"] = namespaceObj["gui"] || {};
					namespaceObj = namespaceObj["gui"][moduleLocation[moduleLocation.length - 1]];
				} else {
					for (i = 0; i < moduleLocation.length; i++) {
						namespaceObj[moduleLocation[i]] = namespaceObj[moduleLocation[i]] || {};
						namespaceObj = namespaceObj[moduleLocation[i]];
					}
				}
				return namespaceObj;
			};

		//set func params to namespaced objects
		for (i = 0; i < dependency.length; i++) {
			dependencyNamespaceObjs.push(getNameSpace(dependency[i]));
		}

		modNameSpace = getNameSpace(mod);
		modNameSpace = func;
		modNameSpace.apply(this, dependencyNamespaceObjs);
	};
}

if (!window.require) {
	window.require = function (dependency, func) {
		func.apply(this);
	};
}

define('jsfw/apps/util/Util',
    [],
	function () {
		var util = {};

		/**
		 * Given a table, a hash map and a value, looks up the value from the hash map, and returns a
		 * value from the table corresponding to the hash value.
		 *
		 * @method lookup
		 * @param table {Object} the table which contains the value to be returned
		 * @param map {Object} hash map which will be used to look up the final value from the table
		 * @param value {Object} hash value from map
		 * @return {Object} desired value from the table if found; null otherwise
		 */
		util.lookup = function (table, map, value) {
			var returnVal = null;
			var mappedValue = map[value];
			/*
			 * The condition below needs to check for null and undefined. A mere "if (mappedValue)"
			 * doesn't quite cut it since mappedValue may be 0 or an empty string.
			 */
			if (mappedValue !== null && mappedValue !== undefined) {
				var optionValue = table[mappedValue];
				if (optionValue) {
					returnVal = optionValue;
				}
			}
			return returnVal;
		};

		/**
		 * Removes all spaces from a given string
		 *
		 * @method removeSpaces
		 * @param charString {String} input string
		 * @return {String} input string minus all occurrences of the space character
		 */
		util.removeSpaces = function (charString) {
			if (charString) {
				charString = String(charString).split(' ').join('');
			}
			return charString || null;
		};

		/**
		 * Determines whether the HDD on the STB has any free space left
		 *
		 * @method isHardDriveAvailable
		 * @deprecated use STB instead
		 * @return {Boolean} true if there is any space left on the HDD; false otherwise
		 */
		util.isHardDriveAvailable = function () {
			return (CCOM && CCOM.recorder !== null && typeof CCOM.recorder !== 'undefined' &&
					CCOM.recorder.spaceTotal !== null && typeof CCOM.recorder.spaceTotal !== 'undefined' &&
					CCOM.recorder.spaceTotal > 0);
		};

		/**
		 * Extends a base class
		 *
		 * @method extend
		 * @param subClass {Object} The derived class
		 * @param baseClass {Object} The base class which the subclass will inherit from
		 */
		util.extend = function (subClass, baseClass) {
			var F = function () {};
			F.prototype = baseClass.prototype;
			subClass.prototype = new F();
			subClass.prototype.constructor = subClass;
			subClass.superConstructor = baseClass;
			subClass.superClass = baseClass.prototype;
		};

		/**
		 * Returns the number of occurrences of a specified element in a specified array.
		 *
		 * @method arrayContains
		 * @param theArray {Array} the source array
		 * @param elem {Object} element to look for in the array. Could be a string, number, anything
		 * @return {Number} the number of times the specified element was found in the specified array.
		 */
		util.arrayContains = function (theArray, elem) {
			var i = 0, count = 0;
			if (theArray && elem) {
				for (i = 0; i < theArray.length; i++) {
					if (theArray[i] === elem) {
						count++;
					}
				}
			}
			return count;
		};

		/**
		 * Determines whether a given character is alphanumeric or a hyphen
		 *
		 * @method isInputChar
		 * @param charString {String} input character
		 * @return {Boolean} true if given string is is alphanumeric or a hyphen; false otherwise
		 */
		util.isInputChar = function (charString) {
			var regex = /^[0-9A-Za-z\-]$/;
			return regex.test(charString);
		};

		/**
		 * Retrieves all the non-function attributes of a JS object
		 *
		 * @method getObjectAttributes
		 * @param obj {Object} the object whose attributes are to be returned
		 * @return {Array} an array of objects each of which has the following structure:
		 *
		 *         name: the name of the attribute
		 *         obj: the actual object itself, and
		 *         parent: the input object
		 */
		util.getObjectAttributes = function (obj) {
			var resultList = [], e;
			for (e in obj) {
				if (typeof obj[e] !== "function") {
					resultList.push({
					    name: e,
					    obj: obj[e],
					    parent: obj
					});
				}
			}
			return resultList;
		};

		/**
		 * Formats a date to a given format (e.g. "dd/mm/yyyy"). Possible format-strings are
		 * "D", "DY", "DD", "Day", "M", "Mon", "Month", "YY" and "YYYY", where "DY" is the short version of the day
		 * (e.g. Tues) and "DAY" is long version of the day (e.g. "Tuesday"). Each format-string can
		 * only be used once.
		 *
		 * @method formatDate
		 * @param dateobj {Object} Date object to be converted into a string
		 * @param dateFormat {String} the format that we want to have the date in. Not case-sensitive.
		 * @param {Array} MONTHS array of full names of months
		 * @param {Array} MONTHS_SHORT_NAMES array of short names of months
		 * @param {Array} DAYS array of full names of days of week
		 * @param {Array} DAYS_SHORT_NAMES array of short names of days of week
		 * @return {String} the formatted date
		 */
		util.formatDate = function (dateobj, dateFormat, MONTHS, MONTHS_SHORT_NAMES, DAYS, DAYS_SHORT_NAMES) {
			var month = null;
			var date = null;
			var yyyy = null;
			var yyStr = null;
			var yyyyStr = null;
			var day = null;
			var day_short = null;
			var monthNameStr = null;
			var monNameStrShort = null;
			var monthStr = null;
			var dateStr = null;
			var fmt = dateFormat.toUpperCase();
			var codes;
			var i;
			var indexOfChange;

			MONTHS = MONTHS || [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
			MONTHS_SHORT_NAMES = MONTHS_SHORT_NAMES || [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
			DAYS = DAYS || [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];
			DAYS_SHORT_NAMES = DAYS_SHORT_NAMES || [ "Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat" ];

			month = dateobj.getMonth() + 1; // add 1 because jan = 0
			date = dateobj.getDate();

			yyyy = dateobj.getFullYear();

			yyyyStr = yyyy.toString();
			yyStr = yyyyStr.substring(yyyyStr.length - 2, yyyyStr.length);

			day = DAYS[dateobj.getDay()];
			day_short = DAYS_SHORT_NAMES[dateobj.getDay()];
			monthNameStr = MONTHS[month - 1];
			monNameStrShort = MONTHS_SHORT_NAMES[month - 1];

			if (month < 10) {
				monthStr = "0" + month.toString();
			} else {
				monthStr = month.toString();
			}
			if (date < 10) {
				dateStr = "0" + date.toString();
			} else {
				dateStr = date.toString();
			}

			// The order of this array is important: longer strings must be before
			// shorter strings that they contain as sub strings. EG MONTH must be
			// before MON.
			codes = [ {
			    formatStr: "DAY",
			    value: day
			}, {
			    formatStr: "DD",
			    value: dateStr
			}, {
			    formatStr: "DY",
			    value: day_short
			}, {
			    formatStr: "D",
			    value: date.toString()
			}, {
			    formatStr: "MONTH",
			    value: monthNameStr
			}, {
			    formatStr: "MON",
			    value: monNameStrShort
			}, {
			    formatStr: "MM",
			    value: monthStr
			}, {
			    formatStr: "M",
			    value: month.toString()
			}, {
			    formatStr: "YYYY",
			    value: yyyy.toString()
			}, {
			    formatStr: "YY",
			    value: yyStr
			} ];

			// Precondition the format string. This is nesseccary to stop
			// the replacement of substrings eg Month => March => 3arch.
			for (i = 0; i < codes.length; i++) {
				indexOfChange = fmt.indexOf(codes[i].formatStr);
				if (indexOfChange !== -1 && fmt[indexOfChange - 1] !== "$") {
					fmt = this.replaceSubStr(fmt, codes[i].formatStr, "$" + codes[i].formatStr + "#");
				}
			}

			for (i = 0; i < codes.length; i++) {
				fmt = this.replaceSubStr(fmt, "$" + codes[i].formatStr + "#", codes[i].value);
			}

			return fmt;
		};

		/**
		 * Formats the time for a given Date object.
		 * @method formatTime
		 * @param dateObj {Object} the Date object
		 * @param format {String} string format. Uses "h/hh" for hour, "m/mm" for minute ("hh" and "mm" return,
		 * respectively, 0-padded numbers). Also accepts an optional "am/pm" suffix, without which it uses
		 * a default format of "H:MM AM"
		 * @param meridianStrings {Object} Array is also permissible. If Object this should contain `am` and `pm` properties.
		 * The values should be strings for the AM and PM text respectively. If not passed in will use "am" and "pm"
		 * @param prefixMeridian {Boolean} When set to true, causes AM / PM to prefix the date
		 * @return {String}
		 */
		util.formatTime = function formatTime(dateObj, format, meridianStrings, prefixMeridian) {
			var fmt = format.toUpperCase();
		    var re = /^(?:H|HH)(?::MM)(?::SS)?(?: AM)?$/;
			var MM = "0" + dateObj.getMinutes().toString();
		    var SS = "0" + dateObj.getSeconds().toString();
			var H = dateObj.getHours().toString();
		    var HH = "0" + H;
			var amString = "am";
			var pmString = "pm";
			var result = "";
			var meridian = "";

			if (meridianStrings) {
				if (meridianStrings.length) { // array
					amString = meridianStrings[0];
					pmString = meridianStrings[1];
				} else { // object
					if (meridianStrings.am) {
						amString = meridianStrings.am;
					}
					if (meridianStrings.pm) {
						pmString = meridianStrings.pm;
					}
				}
			}

			if (!re.test(fmt)) {
				fmt = "H:MM AM";
			}

		    MM = MM.substring(MM.length - 2, MM.length);
		    SS = SS.substring(SS.length - 2, SS.length);
		    HH = HH.substring(HH.length - 2, HH.length);

		    if (fmt.indexOf("AM") !== -1) {
				meridian = amString;

				if (HH === "00") {
					// If the hour is midnight, display 12 AM.
					HH = "12";
					meridian = amString;
				} else if (HH === "12") {
					// Otherwise the hour is midday, so display 12 PM.
					meridian = pmString;
				}

				if (parseInt(HH, 10) > 12) {
					meridian = pmString;
					H = String(parseInt(HH, 10) - 12);
					HH = "0" + H;
					HH = HH.substring(HH.length - 2, HH.length);
				}
			}

			if (fmt.indexOf("HH") === -1) {
				// If the hour is midnight, H should be 12, not 0.
				if (H === '0') {
					H = '12';
				}
				result += H + ":" + MM;
			} else {
				result += HH + ":" + MM;
			}

			if (fmt.indexOf("SS") !== -1) {
				result += ":" + SS;
			}
			if (fmt.indexOf("AM") !== -1) {
				if (prefixMeridian) {
					result = meridian + " " + result;
				} else {
					result = result + " " + meridian;
				}
			}
			return result;
		};

		/**
		 * Given a time in UTC format returns a time in UTC format rounded to the nearest minute.
		 * @method getTimeRoundedToMinute
		 * @param UTCTime {Number} number of milliseconds since 01/01/1970
		 * @return {Number} number of minutes since 01/01/1970
		 */
		util.getTimeRoundedToMinute = function (UTCtime) {
			var tempDate = new Date(UTCtime);

			if (tempDate.getUTCSeconds() >= 30) {
				tempDate.setUTCMinutes(tempDate.getUTCMinutes() + 1);
			}
			return Date.UTC(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate(), tempDate.getHours(), tempDate.getMinutes());
		};


		/**
		 * Replaces a substring within a given string.
		 *
		 * @method replaceSubStr
		 * @param str {String} the string that contains sub string to be replaced
		 * @param before {String} the substring we wish to replace
		 * @param after {String} the string to replace 'before' with
		 * @param [replaceEverywhere=false] {Boolean} Optional. Specifies whether all occurrences of the
		 *        substring are to be replaced.
		 * @return {String} the new string with the substring replaced
		 */
		util.replaceSubStr = function (str, before, after, replaceEverywhere) {
			var substrIndex = str.indexOf(before), _beforeIt, _afterIt;
			if (replaceEverywhere) {
				while (substrIndex !== -1) {
					_beforeIt = str.substring(0, substrIndex);
					_afterIt = str.substring(substrIndex + before.length, str.length);
					str = _beforeIt + after + _afterIt;
					substrIndex = str.indexOf(before);
				}

			} else {
				if (substrIndex >= 0) {
					_beforeIt = str.substring(0, substrIndex);
					_afterIt = str.substring(substrIndex + before.length, str.length);
					str = _beforeIt + after + _afterIt;
				}
			}
			return str;
		};

		/**
		 * Returns the string representation of the time from a date object.
		 *
		 * @method timeString
		 * @param timeDate {Object} JavaScript Date object. Alternatively, you could also pass in the
		 *        number of milliseconds since the beginning of the epoch.
		 * @return {String} a string of the time
		 */
		util.timeString = function (timeDate) {
			var timeStr = '';
			if (timeDate) {
				// Convert milliseconds since epoch to hh:mm string
				if (typeof timeDate === "number") {
					timeDate = new Date(timeDate);
				}
				var hours = timeDate.getHours();
				var mins = timeDate.getMinutes();
				hours = (hours < 10) ? ("0" + hours.toString()) : hours.toString();
				mins = (mins < 10) ? ("0" + mins.toString()) : mins.toString();
				timeStr = String(hours) + ":" + String(mins);
			}
			return timeStr;
		};

		/**
		 * Returns the string representation of the date from the given Date object.
		 *
		 * @method dateString
		 * @param timeDate {Object} JavaScript Date object. Alternatively, you could also pass in the
		 *        number of milliseconds since the beginning of the epoch.
		 * @param langStrings {Object} An object containing an attribute called `monthNames` which
		 *        contains month names as strings. A sample would be:
		 *        `langStrings = {monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]};`
		 * @return {String} a string representation of the date
		 */
		util.dateString = function (timeDate, langStrings) {
			if (typeof timeDate === "number") {
				timeDate = new Date(timeDate);
			}
			var day = timeDate.getDate().toString();
			var month = langStrings.monthNames[timeDate.getMonth()];
			var year = timeDate.getFullYear().toString();
			return (day + " " + month + " " + year);
		};

		/**
		 * Alerts the properties of an object.
		 *
		 * @method probeObject
		 * @param {Object} obj The object to display
		 */
		util.probeObject = function (obj, depth) {
			var p, i, indent = "";
			depth = depth || 0;
			for (i = 0; i < depth; i++) {
				indent += "    ";
			}
			for (p in obj) {
				if (obj.hasOwnProperty(p)) {
					if (typeof obj[p] === 'object') {
						alert(indent + p + " : {");
						this.probeObject(obj[p], depth + 1);
						alert(indent + "}");
					} else {
						alert(indent + p + " : " + obj[p]);
					}
				}
			}
		};

		/**
		 * Converts a ISO date in string format (e.g. 2014-05-19T22:34:17+00:00) to date.
		 *
		 * @method getDateFromISOString
		 * @param {String} isoDate The date in ISO formats to be converted into ASCII.
		 * @return {Date} the returned date object.
		 */
		util.getDateFromISOString = function (isoDate) {
			var date = isoDate.indexOf("Z") > 1 ? isoDate.substring(0, isoDate.indexOf("Z")) : isoDate;
			var dateTimeArray = date.split("T");
			var dateArray = dateTimeArray[0].split("-");
			var timeArray = dateTimeArray[1].split(":");
			return new Date(dateArray[0], parseInt(dateArray[1], 10) - 1, dateArray[2], timeArray[0], timeArray[1], timeArray[2]);
		};

		/**
		 * Converts a hexadecimal string to ASCII.
		 *
		 * @method hexToAscii
		 * @param {String} hexValue The hexadecimal string that is to be converted into ASCII.
		 * @return {String} The ASCII string.
		 */
		util.hexToAscii = function (hexValue) {
			var source = hexValue;
			var result = "";

			// Convert from right to left (because each character is two hex digits and may have one left over on
			// the left-hand side if first char value <= 0x0F).
			while (source.length > 0) {
				if (source.length < 2) {
					break;
				}

				// Get the last two characters, convert from hex to decimal, then from ASCII to character and prepend to result.
				result = String.fromCharCode(parseInt(source.substr(-2), 16)) + result;

				// Remove last two characters from input and continue
				source = source.substr(0, source.length - 2);
			}
			return result;
		};

		/**
		 * Converts a value in bytes to the corresponding value in kB (KiB), MB (MiB), GB (GiB) etc.
		 * For example, 10385656 bytes would return 9.9 MiB if the binary prefix flag was set to true or
		 * 10.4 MB if the binary prefix flag was set to false (values are correct to one decimal place).
		 * If the binary prefix flag is set and if the result is divisible by 1024, the conversion will continue
		 * until the result is no longer divisible by 1024 (or 1000 if the binary prefix flag is not set).
		 * This ensures that the returned value is given the most appropriate units.
		 * For example, 10385656 bytes returns 9.9 MiB (10.4 MB) rather than 10142.2 KiB (10385.7 kB).
		 * @method convertFromBytes
		 * @param {Number} numberOfBytes The value in bytes to be converted.
		 * @param {Number} decimalPlaces The number of decimal places to include in the converted value.
		 * @param {Boolean} useBinaryPrefix If true, values will be returned using base 2 values
		 * (e.g. a kilobyte is 2^10 [1024] bytes). If false, values will be returned using base 10 values
		 * (e.g. a kilobyte is 10^3 [1000] bytes).
		 * @return {String} The converted value in kB (KiB), MB (MiB), GB (GiB) as appropriate.
		 */
		util.convertFromBytes = function (numberOfBytes, decimalPlaces, useBinaryPrefix) {
			var units = [
				{
					"denary": " bytes",
					"binary": " bytes"
				},
				{
					"denary": " kB",
					"binary": " KiB"
				},
				{
					"denary": " MB",
					"binary": " MiB"
				},
				{
					"denary": " GB",
					"binary": " GiB"
				},
				{
					"denary": " TB",
					"binary": " TiB"
				},
				{
					"denary": " PB",
					"binary": " PiB"
				},
				{
					"denary": " EB",
					"binary": " EiB"
				},
				{
					"denary": " ZB",
					"binary": " ZiB"
				},
				{
					"denary": " YB",
					"binary": " YiB"
				}
			],
				unitsString = " bytes",
				originalNumberOfBytes = parseInt(numberOfBytes, 10),
				numberOfDecimalPlaces = ((decimalPlaces >= 0) ? decimalPlaces : 0),
				divisor = useBinaryPrefix ? 1024 : 1000,
				orderOfMagnitude = 0,
				numberOfMagnitudes = units.length - 1,
				result = originalNumberOfBytes;

			while (result >= divisor) {
				result /= divisor;
				orderOfMagnitude++;
			}
			result = result.toFixed(numberOfDecimalPlaces);

			if (orderOfMagnitude <= numberOfMagnitudes) {
				unitsString = useBinaryPrefix ? units[orderOfMagnitude].binary : units[orderOfMagnitude].denary;
			} else if (orderOfMagnitude > numberOfMagnitudes) {
				// Return a valid conversion using the yotta prefix e.g. 1500 YB/YiB.
				unitsString = useBinaryPrefix ? units[numberOfMagnitudes].binary : units[numberOfMagnitudes].denary;
			}

			return (result.toString() + unitsString);
		};

		util.augmentWithLog = function (className, withClass) {
			var prop;
			var fn;
			var args;
			withClass = withClass || this;
			for (prop in withClass) {
				if (withClass.hasOwnProperty(prop)) {
					fn = withClass[prop];
					if (typeof fn === 'function') {
						args = arguments;
						withClass[prop] = (function (name, fn) {
			                return function () {
								alert(className + " " + name + " in.."); //logger(prop, "..enter");
								//setTimeout(function () { alert(className + " " + name + " ..out");}, 1); //logger(prop, "exit..");
								return fn.apply(this, arguments);
							};
			            }(prop, fn));
					}
				}
			}
		};

		/**
		 * Given the path of the root app, sub application and file path relative to the
		 * root application will return the file path relative to the sub application
		 * @method remapRelativeFilePath
		 * @param {String} mainPagePath
		 * @param {String} subPagePath
		 * @param {String} filePath
		 * @return {string}
		 */
		util.remapRelativeFilePath = function (mainPagePath, subPagePath, filePath) {
			var lastSlash = mainPagePath.lastIndexOf("/");
			var trimmedSubPagePath = subPagePath.substring(lastSlash + 1);
			var subPageArray = trimmedSubPagePath.split("/");
			var filePathArray = filePath.split("/");
			var newPathArray = [];
			var returnPath;
			var i;
			var loopLength = Math.max(subPageArray.length, filePathArray.length);
			var lastItemIsFolder = filePath.indexOf(".") < 0;

			for (i = 0; i < loopLength - 1; i++) {
				if (filePathArray[i] !== subPageArray[i]) {
					if (i < subPageArray.length - 1) {
						newPathArray.unshift("..");
					}
					if (i < filePathArray.length  - 1 || (i === loopLength - 1 && lastItemIsFolder)) {
						newPathArray.push(filePathArray[i]);
					}
				}
			}
			newPathArray.push(filePathArray[filePathArray.length - 1]);
			returnPath = newPathArray.join("/");
			return returnPath;
		};

		/**
		 * Returns the number of member properties that the given object has. If the object
		 * is `null` or `undefined`, then `-1` is returned.
		 *
		 * @method getMemberCount
		 * @param  {Object} obj  the object to return a member count for.
		 * @return {Number} the number of member properties in the given object, or `-1`.
		 */
		util.getMemberCount = function (obj) {
			var count = 0;
			var prop;

			if (!obj) {
				return -1;
			}

			for (prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					count++;
				}
			}

			return count;
		};

		/**
		 * Returns the first-encountered member property of the given object, or
		 * `null` if the given object is `null`, `undefined`
		 * or empty.
		 *
		 * Note that the member that is encountered first (and thus returned) is not
		 * guaranteed.
		 *
		 * @method getFirstMember
		 * @param {Object} obj the object to return the first-encountered member property of.
		 * @return {Object} the first-encountered member property in the given object, or
		 *                  `null`.
		 */
		util.getFirstMember = function (obj) {
			var prop;

			if (!obj) {
				return null;
			}

			for (prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					return prop;
				}
			}

			return null;
		};

		/**
		 * Given a string returns the same string but with the first letter
		 * of every word capitalised
		 * @method upcaseFirstLetter
		 * @param {String} the input string
		 * @return {String}
		 */
		util.upcaseFirstLetter = function (str) {
			var i,
				returnString = "",
				array = str.split(" ");

			for (i = 0; i < array.length; i++) {
				returnString += array[i].substr(0, 1).toUpperCase() + array[i].substr(1);
				if (i < array.length - 1) {
					returnString += " ";
				}
			}
			return returnString;
		};

		/**
		 * Returns true if the given object is an empty object
		 * @method isEmptyObject
		 * @param {Object} obj
		 * @return {Boolean} True if the object is empty, false otherwise
		 */
		util.isEmptyObject = function (obj) {
			var prop;
			for (prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					return false;
				}
			}
			return true;
		};

		/**
		 * Returns true if the current platform is the NMP plugin
		 * @method isPlatformNMPPlugin
		 * @return {Boolean}
		 */
		util.isPlatformNMPPlugin = function () {
			var objectElements = document.getElementsByTagName("object"),
				i;
			for (i = 0; i < objectElements.length; i++) {
				if (objectElements[i].drmAgent) {
					return true;
				}
			}
			return false;
		};

		$N.apps = $N.apps || {};
		$N.apps.util = $N.apps.util || {};
		$N.apps.util.Util = util;
		return $N.apps.util.Util;
	}
);
