/**
 * Helper class for language specific date and time strings
 *
 * @class $N.app.DateTimeUtil
 * @author rhill
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.app.constants
 * #depends ../Constants.js
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.DateTimeUtil = (function () {

		var log = new $N.apps.core.Log("Helper", "DateTimeUtil"),
			TWELVE_HOUR_TIME_FORMAT = $N.app.constants.TWELVE_HOUR_TIME_FORMAT,
			DAY_MONTH_YEAR_DATE_FORMAT = $N.app.constants.DAY_MONTH_YEAR_DATE_FORMAT,
			TWENTY_FOUR_HOUR_TIME_FORMAT = $N.app.constants.TWENTY_FOUR_HOUR_TIME_FORMAT,
			MILLISECONDS_IN_A_DAY = 86400000,
			INT_RADIX = 10,
			convertEpochDateToMilliseconds,
			getMinutesString,
			convertMinutesToMs,
			getTimeSuffixes,
			getFormattedTimeString,
			getFormattedDateString,
			getFormattedDateTimeString,
			getFormattedDurationString,
			getFormattedDurationStringFromMS,
			getDayMonthTimeStringFromMS,
			getWeekdayDayMonthTimeStringFromDate,
			getFormattedAmPmTimeStringWithoutSuffix,
			getFormattedTimeStringWithoutZeroMinutes,
			getFormattedStartEndTimeString,
			getDayMonthStringWithSlashFromDate,
			getDayMonthYearStringFromDate,
			getMonthYearStringFromDate,
			getDayMonthStringFromDate,
			getDayTimeStringFromTime,
			getMonthDayYearStringFromTime,
			getFormattedTimeStringFromTime,
			getDateDescriptionString,
			getDateDiffInDaysToToday,
			getTimeAtMidnight,
			isEventToday,
			isTimeInFuture,
			isEventBetweenOneAndSixDays,
			isEventAfterSixDays,
			getRecordedOnString;

		/**
		 * @method convertEpochDateToMilliseconds
		 * @param {Number} number
		 * @return {Number}
		 */
		convertEpochDateToMilliseconds = function (epochDate) {
			return epochDate * 1000;
		};

		/**
		 * @method getMinutesString
		 * @param {Number} minutes
		 * @return {String}
		 */
		getMinutesString = function (minutes) {
			return (Number(minutes) === 1) ? $N.app.DateTimeUtil.getString("minute") : $N.app.DateTimeUtil.getString("minutes");
		};

		/**
		 * @method convertMinutesToMs
		 * @param {Number} minutes
		 * @return {Number}
		 */
		convertMinutesToMs = function (minutes) {
			return parseInt(minutes, 10) * 60000;
		};

		/**
		 * Returns an object literal containing the correct am/pm
		 * strings for the currently selected language.
		 * @method getTimeSuffixes
		 * @return {Object}
		 */
		getTimeSuffixes = function () {
			var timeSuffixes = {
				am: $N.app.DateTimeUtil.getString("am"),
				pm: $N.app.DateTimeUtil.getString("pm")
			};
			return timeSuffixes;
		};

		/**
		 * Returns a formatted time string with the correct AM/PM text
		 * for the currently selected language.
		 * @method getFormattedTimeString
		 * @param {Object} time A Date object
		 * @param {String} format A time format passed to JSFW
		 * @return {String}
		 */
		getFormattedTimeString = function (time, format) {
			format = format || TWELVE_HOUR_TIME_FORMAT;
			return $N.apps.util.Util.formatTime(time, format, getTimeSuffixes());
		};

		/**
		 * Returns a formatted time string with the correct DD/MM/YYYY text format
		 * for the currently selected language.
		 * @method getFormattedTimeString
		 * @param {Object} date - Date object
		 * @param {String} format A time format passed to JSFW
		 * @return {String}
		 */
		getFormattedDateString = function (date, format) {
			format = format || DAY_MONTH_YEAR_DATE_FORMAT;
			return $N.apps.util.Util.formatDate(date, format);
		};

		/**
		 * Returns a formatted duration string with the correct format
		 * @method getFormattedDurationString
		 * @param {String} duration Duration with correct format MM:SS or HH:MM:SS (55:12 or 2:10:45 it should not be 02:10:45)
		 * @param {String} separator A separator to format the duration
		 */
		getFormattedDurationString = function (duration, separator) {
			var durationSplitByDot,
				durationSplitBySeparator,
				formattedDuration = '',
				timeSet = false,
				count = 0,
				i,
				durationSplitBySeparatorLength;
			if (!separator) {
				separator =  separator || ":";
			}
			durationSplitByDot = duration.split(".");
			durationSplitBySeparator = durationSplitByDot[0].split(separator);
			durationSplitBySeparatorLength = durationSplitBySeparator.length;
			if (durationSplitBySeparatorLength >= 2) {
				for (i = 0; i < durationSplitBySeparatorLength; i++) {
					if (timeSet) {
						formattedDuration = formattedDuration + ":" + durationSplitBySeparator[i];
						count++;
					} else {
						if (parseInt(durationSplitBySeparator[i], 10)) {
							formattedDuration = parseInt(durationSplitBySeparator[i], 10);
							timeSet = true;
							count++;
						}
					}
				}
				if (count >= 2) {
					return formattedDuration;
				} else {
					return "00:" + formattedDuration;
				}
			} else {
				return duration;
			}
		};

		/**
		 * Returns a formatted duration string with the format "dd/month, hh:mm"
		 * @method getDayMonthTimeStringFromMS
		 * @param {Number} duration Duration in MS
		 * @return {String}
		 */
		getDayMonthTimeStringFromMS = function (duration) {
			var date;
			function checkTime(i) {
				if (i < 10) {
					i = "0" + i;
				}
				return i;
			}
			if (typeof duration === "string") {
				date = new Date(parseInt(duration, 10));
			} else if (typeof duration === "number") {
				date = new Date(duration);
			} else {
				return null;
			}
			return checkTime(date.getDate()) + "/" + checkTime((date.getMonth() + 1)) + ", " + checkTime(date.getHours()) + ":" + checkTime(date.getMinutes());
		};

		/**
		 * @method getWeekdayDayMonthTimeStringFromDate
		 * @param {Date} date
		 * @return {String}
		 */
		getWeekdayDayMonthTimeStringFromDate = function (date) {
			var dateString,
				timeString;
			dateString = $N.apps.util.Util.formatDate(date, "DY DD/MM", null, null, null, $N.app.ClockDisplay.getString("shortDays"));
			timeString = $N.apps.util.Util.formatTime(date, "HH:MM");
			return dateString + ", " + timeString;
		};

		/**
		 * Returns a formatted duration string with the format "HH h MM mins" | "MM mins SS secs" | "SS secs"
		 * @method getFormattedDurationStringFromMS
		 * @param {Number} duration Duration in MS
		 * @return {String}
		 */
		getFormattedDurationStringFromMS = function (duration) {
			var hours = Math.floor(duration / 3600000),
				minutes = Math.floor(duration / 60000) - Math.round(hours * 60),
				seconds = Math.floor(duration / 1000) - Math.round(minutes * 60),
				durationStr = "";
			if (duration === 0) {
				return "";
			}
			if (hours > 0) {
				durationStr += String(hours) + " " +  $N.app.DateTimeUtil.getString("hoursShort") + " ";
			}
			if (minutes === 1) {
				durationStr += String(minutes) + " " + $N.app.DateTimeUtil.getString("min") + " ";
			} else {
				durationStr += String(minutes) + " " + $N.app.DateTimeUtil.getString("mins") + " ";
			}
			if (hours < 1) {
				if (seconds === 1) {
					durationStr += String(seconds) + " " + $N.app.DateTimeUtil.getString("sec");
				} else {
					durationStr += String(seconds) + " " + $N.app.DateTimeUtil.getString("secs");
				}
			}
			return durationStr;
		};

		/**
		 * Returns a formatted time string in AM/PM format, without the AM/PM text
		 * @method getFormattedAmPmTimeStringWithoutSuffix
		 * @param {Object} time A Date object
		 * @return {String}
		 */
		getFormattedAmPmTimeStringWithoutSuffix = function (time) {
			time = $N.apps.util.Util.formatTime(time, TWELVE_HOUR_TIME_FORMAT);
			time = time.split(' ');
			return time[0];
		};

		/**
		 * @method getFormattedDateTimeString
		 * @param {String}  dateString
		 * @param {String}  dateFormat
		 * @param {String}  timeFormat
		 *
		 * @return {String} formatted date string
		 */
		getFormattedDateTimeString = function (dateString, dateFormat, timeFormat) {
			dateFormat = dateFormat || DAY_MONTH_YEAR_DATE_FORMAT;
			timeFormat = timeFormat || TWENTY_FOUR_HOUR_TIME_FORMAT;
			var stringToReturn = "";
			if (dateString) {
				stringToReturn += $N.apps.util.Util.formatDate(new Date(dateString), dateFormat) + " ";
				stringToReturn += $N.apps.util.Util.formatTime(new Date(dateString), timeFormat);
			}
			return stringToReturn;
		};

		/**
		 * Returns a formatted time string, without the minutes if zero
		 * @method getFormattedTimeStringWithoutZeroMinutes
		 * @param {Object} time A Date object
		 * @return {String}
		 */
		getFormattedTimeStringWithoutZeroMinutes = function (time) {
			var timeSplitByColon,
				timeSplitByColonSplitBySpace;
			time = $N.apps.util.Util.formatTime(time, TWELVE_HOUR_TIME_FORMAT);
			timeSplitByColon = time.split(':');
			timeSplitByColonSplitBySpace = timeSplitByColon[1].split(' ');
			if (timeSplitByColonSplitBySpace[0] === '00') {
				return timeSplitByColon[0] + ' ' + timeSplitByColonSplitBySpace[1];
			}
			return time;
		};

		/**
		 * Returns a formatted start-end time string with the correct AM/PM text
		 * for the currently selected language.
		 * @method getFormattedStartEndTimeString
		 * @param {Object} startTime A Date object
		 * @param {Object} endTime A Date object
		 * @param {String} format A time format passed to JSFW
		 * @return {String}
		 */
		getFormattedStartEndTimeString = function (startTime, endTime, format) {
			return getFormattedTimeString(startTime, format) + ' - ' + getFormattedTimeString(endTime, format);
		};

		/**
		 * Returns a date string in the format "31/07"
		 * @method getDayMonthStringWithSlashFromDate
		 * @param {Object} date A Date object
		 * @return {String}
		 */
		getDayMonthStringWithSlashFromDate = function (date) {
			var padNumberWithZeroes = $N.app.GeneralUtil.padNumberWithZeroes,
				numericMonth = date.getMonth() + 1;
			return padNumberWithZeroes(date.getDate(), 2) + "/" + padNumberWithZeroes(numericMonth, 2);
		};

		/**
		 * Returns a date/time string in the format "Saturday, 9:00 pm" | "Today, 9:00 pm" | "Yesterday, 9:00 pm"
		 * @method getDayTimeStringFromTime
		 * @param {Number} time Time in ms
		 * @return {String}
		 */
		getDayTimeStringFromTime = function (time) {
			var date = new Date(parseInt(time, 10)),
				dayString = $N.app.DateTimeUtil.getString("days")[date.getDay()],
				timeString = getFormattedTimeString(date);
			return dayString + ", " + timeString;
		};

		/**
		 * Returns a date string in the format "JULY 31, 2011"
		 * @method getMonthDayYearStringFromTime
		 * @param {Number} time Time in ms
		 * @return {String}
		 */
		getMonthDayYearStringFromTime = function (time) {
			var date = new Date(parseInt(time, 10));
			return $N.apps.util.Util.formatDate(date, "MONTH DD, YYYY");
		};

		/**
		 * Returns a formatted date string by the given format
		 * @method getMonthDayYearStringFromTime
		 * @param {Number} time Time in ms
		 * @param {String} format A time format passed to JSFW
		 * @return {String}
		 */
		getFormattedTimeStringFromTime = function (time, format) {
			var date = new Date(parseInt(time, 10));
			return getFormattedTimeString(date, format);
		};

		/**
		 * Tells us whether an event is showing today
		 * @method isEventToday
		 * @param {Number} daysDiff difference between the event and today (already calculated)
		 * @return {Boolean} isEventToday
		 */
		isEventToday = function (daysDiff) {
			return (daysDiff === 0);
		};

		/**
		 * Is the Time in the Future ?
		 * @method isTimeInFuture
		 * @param {Number} The Current Time in MS since 1970
		 * @return {Boolean} isTimeInFuture
		 */
		isTimeInFuture = function (time) {
			var date = new Date(parseInt(time, 10));
			return (date > new Date());
		};

		/**
		 * Tells us whether an event is showing in 1 to 6 days from today
		 * @method isEventBetweenOneAndSixDays
		 * @param {Number} daysDiff difference between the event and today (already calculated)
		 * @return {Boolean} isEventBetweenOneAndSixDays
		 */
		isEventBetweenOneAndSixDays = function (daysDiff) {
			return (daysDiff > 0 && daysDiff < 7);
		};

		/**
		 * Tells us whether an event is showing after 6 days
		 * @method isEventAfterSixDays
		 * @param {Number} daysDiff difference between the event and today (already calculated)
		 * @return {Boolean} isEventAfterSixDays
		 */
		isEventAfterSixDays = function (daysDiff) {
			return (daysDiff > 6);
		};


		/**
		 * Gets the time in MS at midnight
		 * @method getTimeAtMidnight
		 * @param {Number} eventTime in MS
		 * @return {Number} time in ms
		 */

		getTimeAtMidnight = function (time) {
			var date = new Date(time),
				timeDifference = time - date.setHours(0, 0, 0, 0);
			date = null;
			return time - timeDifference;
		};

		/**
		 * Gets the difference in days between the STB date (at midnight) and the date time of the current event
		 * @method getDateDiffInDaysToToday
		 * @param {Number} eventTime time in ms
		 * @return {Number} number of days difference
		 */
		getDateDiffInDaysToToday = function (eventTime) {
			return parseInt(Math.abs(getTimeAtMidnight(Date.now()) - getTimeAtMidnight(eventTime)) / MILLISECONDS_IN_A_DAY, INT_RADIX);
		};

		/**
		 * Returns a date string as Tomorrow, Day of week, or date dd/mm/yyyy
		 * @method getDateDescriptionString
		 * @param {Number} eventTime time in ms
		 * @return {String}
		 */
		getDateDescriptionString = function (eventTime) {
			var eventDateTime,
				daysDiff = getDateDiffInDaysToToday(eventTime),
				dateDescription = "";
			if (!isEventToday(daysDiff)) {
				eventDateTime = new Date(eventTime);
				if (isEventBetweenOneAndSixDays(daysDiff)) {
					dateDescription = $N.app.DateTimeUtil.getString("days")[eventDateTime.getDay()];
				} else if (isEventAfterSixDays(daysDiff)) {
					dateDescription = $N.apps.util.Util.formatDate(eventDateTime, "DD/MM/YYYY");
				}
				eventDateTime = null;
			}
			return dateDescription;
		};

		/**
		 * Returns a date string in the format "31 JULY 2011"
		 * @method getDayMonthYearStringFromDate
		 * @param {String} date
		 * @return {String}
		 */
		getDayMonthYearStringFromDate = function (date) {
			var formattedDate;
			formattedDate = new Date(date);
			return $N.apps.util.Util.formatDate(formattedDate, "DD MONTH YYYY");
		};

		/**
		 * Returns a date string in the format "MM/YYYY"
		 * @method getDayMonthStringFromDate
		 * @param {String} date
		 * @return {String}
		 */
		getDayMonthStringFromDate = function (date) {
			var formattedDate;
			formattedDate = new Date(date);
			return $N.apps.util.Util.formatDate(formattedDate, "DD/MM");
		};

			/**
		 * Returns a date string in the format "31/2011"
		 * @method getMonthYearStringFromDate
		 * @param {String} date
		 * @return {String}
		 */
		getMonthYearStringFromDate = function (date) {
			var formattedDate;
			formattedDate = new Date(date);
			return $N.apps.util.Util.formatDate(formattedDate, "MM/YYYY");
		};


		/**
		 * @method getRecordedOnString
		 * @param {String} startTime
		 * @return {String}
		 */
		getRecordedOnString = function (startTime) {
			var dateTimeUtil = $N.app.DateTimeUtil,
				date = new Date(startTime),
				dateString = getDayMonthStringWithSlashFromDate(date),
				timeString = getFormattedTimeString(date, "HH:MM"),
				recordedOnString;
			if (!startTime) {
				return "";
			}

			return dateTimeUtil.getString("recordedOn") + dateString + dateTimeUtil.getString("at") + timeString;

		};

		/**
		 * @method isLeapYear
		 * @param {Number} year
		 * @return {Bool}
		 */
		function isLeapYear(year) {
			var returnVal = (!((year % 4) && (year % 100)) || (year % 400 === 0));
			return returnVal;
		}

		/**
		 * @method isValidDate
		 * @param {Number} year
		 * @param {Number} month
		 * @param {Number} day
		 * @return {Bool}
		 */
		function isValidDate(year, month, day) {
			var monthlen = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
			if (!year || !month || !day || month > 12) {
				return false;
			}
			if (isLeapYear(year) && month === 2) {
				monthlen[1]++;
			}
			if (day > monthlen[month - 1]) {
				return false;
			}
			return true;
		}

		/**
		 * @method isDateInFuture
		 * @param {Number} year
		 * @param {Number} month
		 * @param {Number} day
		 * @return {Bool}
		 */
		function isDateInFuture(year, month, day) {
			var presentDateObj = new Date(),
				presentYear = presentDateObj.getFullYear(),
				presentMonth = presentDateObj.getMonth() + 1,
				presentDate = presentDateObj.getDate();

			if (year > presentYear) {
				return true;
			} else if ((year === presentYear) && (month > presentMonth)) {
				return true;
			} else if ((year === presentYear) && (month === presentMonth) && (day >= presentDate)) {
				return true;
			}
			return false;
		}

		/**
		 * @method isValidTime
		 * @param {Number} hours
		 * @param {Number} mins
		 * @return {Bool}
		 */
		function isValidTime(hours, mins) {
			var MAX_HOURS = 24,
				MAX_MINUTES = 60;

			hours = parseInt(hours, 10);
			mins = parseInt(mins, 10);
			return (hours < MAX_HOURS && mins < MAX_MINUTES);
		}
		// Public
		return {

			/**
			 * @method initialise
			 */
			initialise: function () {
				log("initialise", "Enter");
				$N.apps.core.Language.adornWithGetString($N.app.DateTimeUtil);
				log("initialise", "Exit");
			},
			convertEpochDateToMilliseconds: convertEpochDateToMilliseconds,
			getMinutesString: getMinutesString,
			convertMinutesToMs: convertMinutesToMs,
			getFormattedTimeString: getFormattedTimeString,
			getFormattedDateString: getFormattedDateString,
			getFormattedDateTimeString: getFormattedDateTimeString,
			getFormattedStartEndTimeString: getFormattedStartEndTimeString,
			getFormattedAmPmTimeStringWithoutSuffix: getFormattedAmPmTimeStringWithoutSuffix,
			getFormattedTimeStringWithoutZeroMinutes: getFormattedTimeStringWithoutZeroMinutes,
			getDayMonthStringWithSlashFromDate: getDayMonthStringWithSlashFromDate,
			getDateDescriptionString: getDateDescriptionString,
			getDayMonthYearStringFromDate: getDayMonthYearStringFromDate,
			getDayTimeStringFromTime: getDayTimeStringFromTime,
			getMonthDayYearStringFromTime: getMonthDayYearStringFromTime,
			getFormattedTimeStringFromTime: getFormattedTimeStringFromTime,
			getFormattedDurationString: getFormattedDurationString,
			getFormattedDurationStringFromMS: getFormattedDurationStringFromMS,
			getMonthYearStringFromDate: getMonthYearStringFromDate,
			getDayMonthStringFromDate: getDayMonthStringFromDate,
			getDayMonthTimeStringFromMS: getDayMonthTimeStringFromMS,
			getWeekdayDayMonthTimeStringFromDate: getWeekdayDayMonthTimeStringFromDate,
			isEventToday: isEventToday,
			isEventBetweenOneAndSixDays: isEventBetweenOneAndSixDays,
			isEventAfterSixDays: isEventAfterSixDays,
			isTimeInFuture: isTimeInFuture,
			getTimeAtMidnight: getTimeAtMidnight,
			getDateDiffInDaysToToday: getDateDiffInDaysToToday,
			getRecordedOnString: getRecordedOnString,
			isValidDate: isValidDate,
			isValidTime: isValidTime,
			isDateInFuture: isDateInFuture
		};
	}());

}($N || {}));
