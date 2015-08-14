/**
 * This is the helper class for manual recording options menu.
 * It takes care of the recording options menu data.
 *  @author malatesh
 *
 * @class $N.app.ManualRecordingOptionHelper
 * @static
 * @requires $N.platform.btv.PVRManager
 * @requires $N.app.PVRUtil
 * @requires $N.app.constants
 * @requires $N.app.StandardTimers
 */
(function ($N) {
	$N.app = $N.app || {};
	$N.app.ManualRecordingOptionHelper = (function () {

		var PVRUtil = $N.app.PVRUtil,
			constants = $N.app.constants,
			minuteTimer = $N.app.StandardTimers.minuteTimer,
			manualRecordingproperties = {
				"startTime": null,
				"stopTime": null,
				"date": null,
				"frequency": null,
				"channel": null,
				"channelInfo": null,
				"folder": null,
				"keepUntill": null,
				"isTimeOrDateModified": false
			},
			recordingFrequencyValues = {
				ONCE: $N.platform.btv.PVRManager.Frequency.ONCE,
				DAILY: $N.platform.btv.PVRManager.Frequency.DAILY,
				WEEKLY: $N.platform.btv.PVRManager.Frequency.WEEKLY,
				WEEKDAYS: $N.platform.btv.PVRManager.Frequency.WEEKDAYS,
				WEEKENDS: $N.platform.btv.PVRManager.Frequency.WEEKENDS
			};


		/**
		 * @method getFolderIndexFromData
		 * @private
		 * @param {Object} data
		 * @param {String} folderName
		 * @return {Integer} folderIndex
		 */
		function getFolderIndexFromData(data, folderName) {
			folderName = folderName || "";
			var i,
				folderIndex,
				folderValuesToFind = [
					$N.app.constants.LEGACY_DEFAULT_NON_EPISODIC_FOLDER_NAME,
					""];
			if (folderName.length && !$N.app.FolderUtil.isFolderRootFolder(folderName)) {
				folderIndex = data.indexOf(folderName);
			} else {
				for (i = 0; i < folderValuesToFind.length; i++) {
					folderIndex = data.indexOf(folderValuesToFind[i]);
					if (folderIndex > -1) {
						break;
					}
				}
			}
			return folderIndex;
		}

		/**
		 * @method manualRecordingStartTime
		 * @param {string} data(optional)
		 * @public
		 */
		function manualRecordingStartTime() {
			var startTime = $N.app.DateTimeUtil.getFormattedTimeString(new Date(), constants.TWENTY_FOUR_HOUR_TIME_FORMAT),
				hours,
				mins,
				timeAndMinArray = startTime.split(":");
			hours = Number(timeAndMinArray[0]);
			mins = Number(timeAndMinArray[1]);
			if (hours === 23 && mins >= 30) {
				// if HH:MM = 23:30 then HH:MM = 00:00.
				hours = "00";
				mins = "00";
			} else if (hours <= 23 && mins < 30) {
				// if HH:MM = 22:29 then HH:MM = 22:30.
				mins = "30";
			} else {
				// if HH:MM = 22:30 then HH:MM = 23:00
				hours = (hours + 1).toString();
				mins = "00";
			}
			return (hours + ":" + mins);
		}

		/**
		 * @method manualRecordingStopTime
		 * @public
		 */
		function manualRecordingStopTime() {
			var stopTime = manualRecordingStartTime(),
				hours,
				mins,
				timeAndMinArray = stopTime.split(":");
			hours = Number(timeAndMinArray[0]) + 1;
			mins =  timeAndMinArray[1];
			hours = hours.toString();
			if (hours === "24") {
				hours = "00";
			}
			return (hours + ":" + mins);
		}

		/**
		 * Returns a date string in the format "DD/MM/YYYY"
		 * Returns date of next day If start Time of Manual Recording is 00:00
		 * @method getValidDate
		 * @public
		 * @return {String}
		 */

		function getValidDate() {
			var startTime = manualRecordingStartTime(),
				newDate = $N.apps.util.Util.formatDate(new Date(), "dd/mm/yyyy"),
				dateTobeDisplayed,
				convertedDateFormat,
				startTimeObj,
				startTimeInMs,
				dateOfTommorow,
				newTime;
			if (startTime === "00:00") {//if Start time is 00:00 then show the date of next day.
				convertedDateFormat = $N.apps.util.Util.formatDate(new Date(), "yyyy/mm/dd");
				startTimeObj = new Date(convertedDateFormat + "," + startTime);
				startTimeInMs = startTimeObj.getTime();//converting the time object to seconds.
				newTime = (startTimeInMs + (24 * 60 * 60 * 1000)); // adding 1 day to present day 24hr * 60min * 60sec * 1000ms
				dateOfTommorow = $N.apps.util.Util.formatDate(new Date(newTime), "dd/mm/yyyy");
				dateTobeDisplayed = dateOfTommorow;
			} else {
				dateTobeDisplayed = newDate;
			}
			return dateTobeDisplayed;
		}


		/**
		 * @method manualRecordingChanneldata
		 * @public
		 */
		function manualRecordingChanneldata() {
			var channelData = $N.app.ChannelManager.getAllChannelsOrderedByChannelNumber(),
				channelDataFormatted = $N.app.FormatUtils.formatFavouriteBlockChannelsData(channelData),
				currentChannel = $N.app.epgUtil.getServiceById($N.app.epgUtil.getChannelFromPrefs()),
				i;
			if (channelDataFormatted) {
				for (i = 0; i < channelDataFormatted.length; i++) {
					channelDataFormatted[i].value = true;
					if (currentChannel.serviceName === channelDataFormatted[i].title) {
						channelDataFormatted[i].selected = true;
					} else {
						channelDataFormatted[i].selected = false;
					}
				}
			}
			return channelDataFormatted;
		}

		/**
		 * @method getChannelNameWithchannelNumber
		 * @public
		 */
		function getChannelNameWithchannelNumber(channel) {
			var	currentChannel = channel || $N.app.epgUtil.getServiceById($N.app.epgUtil.getChannelFromPrefs()),
				channelData = $N.app.ChannelManager.getAllChannelsOrderedByChannelNumber(),
				channelNamewithChannelNumber;
			channelNamewithChannelNumber = ($N.app.FormatUtils.formatChannelNumber(currentChannel.logicalChannelNum) + ' ' + currentChannel.serviceName);
			return channelNamewithChannelNumber;
		}

		/**
		 * @method getManualRecordingsFolderOptionData
		 * @public
		 */
		function getManualRecordingsFolderOptionData() {
			var folderName = $N.app.FolderUtil.getString('pvrSettingsRecordingHighlights'),
				folderIndex,
				i,
				data = [];
			data = $N.platform.system.Preferences.get($N.app.constants.PVR_NON_EPISODIC_FOLDER_LIST);
			data = $N.app.FormatUtils.formatRecordingsFolderListData(data, folderName);
			folderIndex = getFolderIndexFromData(data, folderName);
			for (i = 0; i < data.length; i++) {
				data[i].selected = (folderName === data[i].title);
			}
			data = $N.app.FolderUtil.sortFolderList(data);//sort the array of folders based on title.
			return data;
		}

		/**
		 * @method getManualRecordingsFolderOptionData
		 * @public
		 */
		function getManualRecordingsFrequencyOptionData() {
			var data = [
				{
					title: $N.app.ManualRecordingOptionHelper.getString("manualRecordingFrequencyOnce"),
					value: recordingFrequencyValues.ONCE,
					selected: true
				},
				{
					title: $N.app.ManualRecordingOptionHelper.getString("manualRecordingFrequencyDaily"),
					value: recordingFrequencyValues.DAILY,
					selected: false
				},
				{
					title:  $N.app.ManualRecordingOptionHelper.getString("manualRecordingFrequencyWeekly"),
					value: recordingFrequencyValues.WEEKLY,
					selected: false
				},
				{
					title:  $N.app.ManualRecordingOptionHelper.getString("manualRecordingFrequencyWeekDays"),
					value: recordingFrequencyValues.WEEKDAYS,
					selected: false
				},
				{
					title:  $N.app.ManualRecordingOptionHelper.getString("manualRecordingFrequencyWeekend"),
					value: recordingFrequencyValues.WEEKENDS,
					selected: false
				}
			];
			return data;
		}

		/**
		 * Resets the manualRecording properties to default
		 * @method resetManualRecordingproperties
		 * @public
		 */
		function resetManualRecordingproperties() {
			var currentChannelInfo = $N.app.epgUtil.getServiceById($N.app.epgUtil.getChannelFromPrefs()),
				channelData = manualRecordingChanneldata(),
				ChannelNamewithChannelNumber = getChannelNameWithchannelNumber(),
				folderData = getManualRecordingsFolderOptionData(),
				startTime = manualRecordingStartTime(),
				stopTime = manualRecordingStopTime(),
				date = getValidDate();
			manualRecordingproperties = {
				"startTime": startTime,
				"stopTime": stopTime,
				"date": date,
				"frequency": recordingFrequencyValues.ONCE,
				"channel": ChannelNamewithChannelNumber,
				"channelInfo": currentChannelInfo,
				"folder": $N.app.FolderUtil.getNonEpisodicDefaultFolder(),
				"keepUntill": constants.KEEP_UNTIL_OPTION_SPACE_NEEDED,
				"isTimeOrDateModified": false
			};
		}

		/**
		 * sets value of one property of manual recording
		 * @method setManualRecordingProperty
		 * @public
		 * @param {Object} prop name of the property
		 * @param {Object} value of the property
		 */
		function setManualRecordingProperty(prop, value) {
			manualRecordingproperties[prop] = value;
		}

		/**
		 * get one manual recording property, like 'startTime'
		 * @method getManualRecordingProperty
		 * @public
		 * @param {Object} prop name of the property
		 */
		function getManualRecordingProperty(prop) {
			return manualRecordingproperties[prop];
		}

		/**
		 * Gets all the manual recording properties
		 * @method getAllManualRecordingProperties
		 * @public
		 */
		function getAllManualRecordingProperties() {
			return manualRecordingproperties;
		}

		/**
		 * This data is passed to Library.js so as to invoke LibraryWindow.js
		 * @method getManualRecordingsDummyData
		 * @public
		 */
		function getManualRecordingsDummyData() {
			var	menuItems = [
					{
						title: "manualRecordingKeepTitle",
						firstSubTitle: "SPACE NEEDED"
					}];
			return menuItems;
		}

		/**
		 * Callback method used by ManualRecordingOption Class to
		 * handle manual recording failure event.
		 * @method manualRecordingSetFailedCallback
		 * @param e - callback info object
		 * @public
		 */
		function manualRecordingSetFailedCallback(e) {
			if ($N.apps.core.ContextManager.getActiveContext().getId() === "LIBRARY") {
				//Show a failure message to the user if setting manual recording failes
				$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_MANUAL_REC_MSG,
					$N.app.ManualRecordingOptionHelper.getString("manualRecordingFailureTitle"),
					$N.app.ManualRecordingOptionHelper.getString("manualRecordingFailureMessage"));
				//When we are reusing the same dialogue id with different text, dialogue is not updated and re-drawn hence updateTitle and text is used.
				$N.app.DialogueHelper.updateDialogueTitleAndMessage($N.app.constants.DLG_MANUAL_REC_MSG,
					$N.app.ManualRecordingOptionHelper.getString("manualRecordingFailureTitle"),
					$N.app.ManualRecordingOptionHelper.getString("manualRecordingFailureMessage"));
			}
		}

		/**
		 * Callback method used by ManualRecordingOption Class to
		 * handle manual recording success event.
		 * @method manualRecordingSetOKCallback
		 * @param e - callback info object
		 * @public
		 */
		function manualRecordingSetOKCallback(e) {
			//Show the success message if the setting manual recording succeeded
			if (e && e.jobId && ($N.apps.core.ContextManager.getActiveContext().getId() === "LIBRARY")) {
				var jobObj = $N.platform.btv.PVRManager.getJob(e.jobId),
					successMessage = "";

				if (jobObj.scheduleType === "RPT_TIME") {
					successMessage = $N.app.ManualRecordingOptionHelper.getString("manualRecordingSuccessMessageRepeat");
				} else {
					successMessage = $N.app.ManualRecordingOptionHelper.getString("manualRecordingSuccessMessageSingle");
				}

				$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_MANUAL_REC_MSG,
					$N.app.ManualRecordingOptionHelper.getString("manualRecordingSuccessTitle"),
					successMessage + '"' + jobObj.title + '".');
				//When we are reusing the same dialogue id with different text, dialogue is not updated and re-drawn hence updateTitle and text is used.
				$N.app.DialogueHelper.updateDialogueTitleAndMessage($N.app.constants.DLG_MANUAL_REC_MSG,
					$N.app.ManualRecordingOptionHelper.getString("manualRecordingSuccessTitle"),
					successMessage + '"' + jobObj.title + '".');

			}
		}

		/**
		 * This Method is called from the ManualRecording options to set the time based recording
		 * No input needed at any given point, this method expects that the manual recording property is updated.
		 * @method createManualRecording
		 * @public
		 */
		function createManualRecording() {
			var manualRecordingPropertyObj = getAllManualRecordingProperties(), //get the current manual recording property as per user preference in the time based menu.
				convertedDateFormat = manualRecordingPropertyObj.date.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3/$2/$1"), //convert the date as 'YYYY/MM/DD' format to easily make a new Date object
				startTimeObj = new Date(convertedDateFormat + "," + manualRecordingPropertyObj.startTime),
				startTimeInSeconds = startTimeObj.getTime() / 1000, //converting the time object to seconds as JSFW method accepts startTime seconds
				stopTimeInSeconds = new Date(convertedDateFormat + "," + manualRecordingPropertyObj.stopTime).getTime() / 1000, //converting the time object to seconds as JSFW method accepts endTime seconds
				frequencyType = manualRecordingPropertyObj.frequency, //Type of frequency  ONCE, DAILY, WEEKLY, WEEKDAYS or WEEKENDS
				serviceId = manualRecordingPropertyObj.channelInfo.serviceId,
				sourceUrl = manualRecordingPropertyObj.channelInfo.uri,
				keepUntil = parseInt(manualRecordingPropertyObj.keepUntill, 10), //Converting to integer as Scheduler's job table accepts integer value for this field
				folderName = manualRecordingPropertyObj.folder, //User preffered folder name. "" if default folder is choosen.
				metaData = {},
				title = $N.app.ManualRecordingOptionHelper.getString("manualRecordingTimeBased") + ' - ',
				timeInms = null;
			//If stop time is belongs to next day then day needs to be incremented
			if (manualRecordingPropertyObj.stopTime < manualRecordingPropertyObj.startTime) {
				timeInms = new Date(convertedDateFormat + "," + manualRecordingPropertyObj.stopTime).getTime();
				stopTimeInSeconds = (timeInms + (24 * 60 * 60 * 1000)) / 1000; // adding 1 day to present day 24hr * 60min * 60sec * 1000ms
			}
			switch (frequencyType) { //Based on the frequency type, we have to set the title
			case $N.platform.btv.PVRManager.Frequency.ONCE:
				title = title + $N.app.ManualRecordingOptionHelper.getString("manualRecordingFrequencyOnce");//"Timebased - Once";
				break;
			case $N.platform.btv.PVRManager.Frequency.DAILY:
				title = title + $N.app.ManualRecordingOptionHelper.getString("manualRecordingFrequencyDaily");//"Timebased - Daily";
				break;
			case $N.platform.btv.PVRManager.Frequency.WEEKLY:
				title = title + $N.app.ManualRecordingOptionHelper.getString("manualRecordingFrequencyWeekly");//"Timebased - Weekly";
				break;
			case $N.platform.btv.PVRManager.Frequency.WEEKDAYS:
				title = title + $N.app.ManualRecordingOptionHelper.getString("manualRecordingFrequencyWeekDays");//"Timebased - Weekdays";
				break;
			case $N.platform.btv.PVRManager.Frequency.WEEKENDS:
				title = title + $N.app.ManualRecordingOptionHelper.getString("manualRecordingFrequencyWeekend");//"Timebased - Weekends";
				break;
			}

			metaData = {
				url: sourceUrl,
				uiFolder: $N.app.StringUtil.addLeadingForwardSlash(folderName),
				title: title,
				repeatDaysArray: $N.platform.btv.PVRManager.getRepeatDaysArrayForFrequency(frequencyType, startTimeObj)
			};
			//JSFW request to created time based recording
			$N.platform.btv.PVRManager.requestTimeRecording(startTimeInSeconds, stopTimeInSeconds, frequencyType, serviceId, keepUntil, metaData);
		}


		return {
			manualRecordingStartTime: manualRecordingStartTime,
			manualRecordingStopTime: manualRecordingStopTime,
			getValidDate: getValidDate,
			manualRecordingChanneldata: manualRecordingChanneldata,
			getManualRecordingsFolderOptionData: getManualRecordingsFolderOptionData,
			getManualRecordingsDummyData: getManualRecordingsDummyData,
			getChannelNameWithchannelNumber: getChannelNameWithchannelNumber,
			getManualRecordingsFrequencyOptionData: getManualRecordingsFrequencyOptionData,
			resetManualRecordingproperties: resetManualRecordingproperties,
			setManualRecordingProperty: setManualRecordingProperty,
			getManualRecordingProperty: getManualRecordingProperty,
			getAllManualRecordingProperties: getAllManualRecordingProperties,
			createManualRecording: createManualRecording,
			manualRecordingSetFailedCallback: manualRecordingSetFailedCallback,
			manualRecordingSetOKCallback: manualRecordingSetOKCallback
		};
	}());
	$N.apps.core.Language.adornWithGetString($N.app.ManualRecordingOptionHelper);
}(window.parent.$N || {}));