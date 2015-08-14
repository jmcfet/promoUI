/**
 * The clock display class deals with setting the format, displaying and updating the clock
 * The ClockDisplay has been added to $N.app so can be accessed with $N.app.ClockDisplay
 * To set the format of the clock first set the time and date formats using their methods
 * e.g.
 * ClockDisplay.setDateFormat("DD/MM/YYYY");
 * ClockDisplay.setTimeFormat("H:MM");
 * Then set the order you wish to display them in the clock using setDateTimeFormat
 * e.g.
 * ClockDisplay.setDateTimeFormat("DATE TIME");
 *
 * @class $N.app.ClockDisplay
 * #depends ../helper/StandardTimers.js
 * @static
 */
var $N = $N || {};
$N.app = $N.app || {};
$N.app.ClockDisplay = (function () {

	var log = new $N.apps.core.Log("CommonGUI", "ClockDisplay"),
		view = {},
		timeDateLabel,
		dayDateLabel,
		dateFormat = "DY DD/MM",
		timeFormat = $N.app.constants.TWENTY_FOUR_HOUR_TIME_FORMAT,
		dateTimeFormat = "TIME", // was "DATE TIME"
		includeMeridian = false;

	return {

		/**
		 * Adds the clock to the DOM and creates the Clock object
		 *
		 * @method initialise
		 */
		initialise: function (viewObject) {
			log("initialise", "Enter");
			var me = this;
			view = viewObject;
			$N.apps.core.Language.adornWithGetString($N.app.ClockDisplay);
			timeDateLabel = view.timeDateLabel;
			dayDateLabel = view.dayDateLabel;
			$N.app.StandardTimers.minuteTimer.register("ClockDisplay", function () {
				me.updateTime();
			});

			$N.app.StandardTimers.minuteTimer.enable("ClockDisplay");
			me.updateTime();
			log("initialise", "Exit");
		},

		/**
		 * Updates the time in the clock with the given date object
		 * or current date and time if no date is passed and displays it in the correct format
		 *
		 * @method updateTime
		 * @param {Object} date
		 */
		updateTime: function (date) {
			log("updateTime", "Enter");
			if (!date) {
				date = new Date();
			}
			var time = $N.app.DateTimeUtil.getFormattedTimeString(date, timeFormat);
			date = $N.apps.util.Util.formatDate(date, dateFormat, null, null, null, $N.app.ClockDisplay.getString("shortDays"));
			timeDateLabel.setText(time);
			timeDateLabel.setCaseSensitive(false);
			dayDateLabel.setText(date);
			dayDateLabel.setCaseSensitive(true);
			log("updateTime", "Exit");
		},

		/**
		 * Hides the clock
		 *
		 * @method hide
		 * @param {Boolean} isToggle is toggling between clock display and something else (e.g. volume control)
		 */
		hide: function (isToggle) {
			log("hide", "Enter");
			view.hide();
			if (!isToggle) {
				$N.app.VolumeControl.resetWasClockVisible();
			}
			log("hide", "Exit");
		},

		/**
		 * Shows the clock
		 *
		 * @method show
		 */
		show: function () {
			log("show", "Enter");
			$N.app.VolumeControl.hide();
			view.show();
			log("show", "Exit");
		},

		/**
		 * Sets the x coordinate position of the clock
		 *
		 * @method setX
		 * @param {Number} x
		 */
		setX: function (x) {
			log("setX", "Enter");
			view.setX(x);
			log("setX", "Exit");
		},

		/**
		 * Sets the y coordinate position of the clock
		 *
		 * @method setY
		 * @param {Number} y
		 */
		setY: function (y) {
			log("setY", "Enter");
			view.setY(y);
			log("setY", "Exit");
		},

		/**
		 * Sets the css class to use for the timeDateLabel
		 *
		 * @method setDateTimeCss
		 * @param {String} cssClass
		 */
		setDateTimeCss: function (cssClass) {
			log("setDateTimeCss", "Enter");
			timeDateLabel.setCssClass(cssClass);
			log("setDateTimeCss", "Exit");
		},

		/**
		 * Sets the css class to use for the dayDateLabels
		 *
		 * @method setDayDateCss
		 * @param {String} cssClass
		 */
		setDayDateCss: function (cssClass) {
			log("setDayDateCss", "Enter");
			dayDateLabel.setCssClass(cssClass);
			log("setDayDateCss", "Exit");
		},

		/**
		 * shows the background gradient behind the time
		 *
		 * @method showTimeBackground
		 */
		showTimeBackground: function () {
			log("showTimeBackground", "Enter");
			view.timeBackground.show();
			log("showTimeBackground", "Exit");
		},

		/**
		 * hides the background gradient behind the time
		 *
		 * @method hideTimeBackground
		 */
		hideTimeBackground: function () {
			log("hideTimeBackground", "Enter");
			view.timeBackground.hide();
			log("hideTimeBackground", "Exit");
		},

		/**
		 * @method isVisible
		 * @return {Boolean} isVisible
		 */
		isVisible: function () {
			return view.isVisible();
		}
	};

}());
