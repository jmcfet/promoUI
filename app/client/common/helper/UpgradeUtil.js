/**
 * UpgradeUtil helper class is used for converting and retaining
 * user selections made using the older UI apps/ Teleidea UI.
 * This can be used in future for any corrections on field.
 *
 * @class $N.app.UpgradeUtil
 * @static
 * @author maniguru
 * @requires $N.app.constants
 * @requires $N.platform.system.Preferences
 * @requires $N.apps.core.Log
 * #depends ../Constants.js
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.UpgradeUtil = (function () {
		var JOB_OP_STATE = { /* Current Job op state */
				JOB_OP_STATE_CREATED: 0,
				JOB_OP_STATE_CREATED_DELETING: 1,
				JOB_OP_STATE_READY: 2,
				JOB_OP_STATE_TASK_DELETING: 3,
				JOB_OP_STATE_DELETED: 4
			},
			constants = $N.app.constants,
			preferences = $N.platform.system.Preferences,
			log = new $N.apps.core.Log("Helper", "UpgradeUtil");

		/**
		 * Gets all Teleidea reminders which are active
		 * @method getAllTIReminders
		 * @private
		 */
		function getAllTIReminders() {
			log("getAllTIReminders", "Enter");
			var fields = "jobId,eventId";
			return $N.platform.btv.PVRManager.getAllTimedReminders("eventId IS NOT NULL" + " AND jobOpState>=" + String(JOB_OP_STATE.JOB_OP_STATE_CREATED) + " AND jobOpState<=" + String(JOB_OP_STATE.JOB_OP_STATE_READY) + " AND scheduleType IS 'ONE_EVT'", fields);
		}

		/**
		 * Gets all Teleidea reminders which are active
		 * @method getAllTIAutoTunes
		 * @private
		 */
		function getAllTIAutoTunes() {
			log("getAllTIAutoTunes", "Enter");
			var job = null,
				condition = "jobOpState>=" + String(JOB_OP_STATE.JOB_OP_STATE_CREATED) + " AND jobOpState<=" + String(JOB_OP_STATE.JOB_OP_STATE_READY) + " AND title IS 'AutoTune'",
				queryString = "taskType='RMDR' AND " + condition,
				fields = "sourceURL, taskType, timeOfDay, endTime, startTime, duration, serviceId, repeatDaysArray, jobId, scheduleType, title, extraInfo";
			job = $N.platform.btv.PVRManager.getJobByQuery(queryString, "startTime", fields);
			log("getAllTIAutoTunes", "Exit");
			return job;
		}

		/**
		 * This method sets the new reminder for the event using Nagra's reminder
		 * and deletest the older Reminders set by Teleidea.
		 * @method setNewReminderAndDeleteTIReminder
		 * @private
		 */
		function setNewReminderAndDeleteTIReminder(eventObj, reminderJobId) {
			log("setNewReminderAndDeleteTIReminder", "Enter");
			$N.app.Reminders.setReminders(eventObj, function () {
				$N.platform.btv.PVRManager.deleteJob(reminderJobId);
			});
			log("setNewReminderAndDeleteTIReminder", "Exit");
		}

		/**
		 * This method converts all reminders set using the Teleidea UI
		 * @method convertTIReminders
		 * @private
		 */
		function convertTIReminders() {
			log("convertTIReminders", "Enter");
			var allTIReminders = getAllTIReminders(),
				i = 0,
				eventObj = null;
			for (i = 0; i < allTIReminders.length; i++) {
				eventObj = $N.platform.btv.EPG.getEventById(allTIReminders[i].eventId);
				if (eventObj) {
					setNewReminderAndDeleteTIReminder(eventObj, allTIReminders[i].jobId);
				}
			}
			log("convertTIReminders", "Exit");
		}

		/**
		 * This method taks repeatDaysArray as input and returns the repeat Type
		 * @method getRepeatType
		 * @param {array} repeatDaysArray
		 * @return {String} repeatType string once, daily, weekly
		 * @private
		 */
		function getRepeatType(repeatDaysArray) {
			var i = 0,
				repeatCounter = 0;
			if (!repeatDaysArray) { //If there is no repeatDaysArray, then it is an one_time job.
				return "once";
			}

			/* Loops through all the entries of the array
			 * and increases the counter based on true value
			 * daily = [true, true, true, true, true, true, true]
			 * weekly = [false, false, false, false, true, false, false]
			 */
			for (i = 0; i < repeatDaysArray.length; i++) {
				if (repeatDaysArray[i]) {
					repeatCounter++;
				}
			}

			switch (repeatCounter) {
			case 7:
				return "daily";
			default:
				return "weekly";
			}
		}

		/**
		 * This method converts all auto tunes set using the Teleidea UI
		 * @method convertTIAutotunes
		 * @private
		 */
		function convertTIAutotunes() {
			log("convertTIAutotunes", "Enter");
			var allTIAutoTunes = getAllTIAutoTunes(),
				i = 0,
				autoTuneObj = {},
				scheduleType = null,
				frequency = null,
				repeatDaysArray = [],
				timeOfDay = null,
				startTime = null,
				serviceObj = null,
				newDate = null,
				ONE_MINUTE = 60000;

			for (i = 0; i < allTIAutoTunes.length; i++) { //for each auto tunes created by the TI UI, we have to convert them to our Auto tunes.
				serviceObj = $N.app.epgUtil.getServiceById(allTIAutoTunes[i].serviceId);
				startTime = allTIAutoTunes[i].startTime - ONE_MINUTE;
				scheduleType = allTIAutoTunes[i].scheduleType;

				frequency = getRepeatType(allTIAutoTunes[i].repeatDaysArray);

				if (!allTIAutoTunes[i].timeOfDay) {
					newDate = new Date(startTime);
					timeOfDay = (newDate.getHours() * 3600) + (newDate.getMinutes() * 60);
				} else {
					timeOfDay = allTIAutoTunes[i].timeOfDay;
				}
				switch (frequency) {//based on frequency type, repeatDaysArray is formed. We cannot re-use the MW repeatDaysArray, because its of type BLOB and addJob looks for Array.
				case "weekly":
					repeatDaysArray = $N.platform.btv.PVRManager.getRepeatDaysArrayForFrequency($N.platform.btv.PVRManager.Frequency.WEEKLY, new Date(startTime));
					break;
				case "daily":
					repeatDaysArray = $N.platform.btv.PVRManager.getRepeatDaysArrayForFrequency($N.platform.btv.PVRManager.Frequency.DAILY);
					break;
				case "once":
					repeatDaysArray = $N.platform.btv.PVRManager.getRepeatDaysArrayForFrequency($N.platform.btv.PVRManager.Frequency.ONCE);
					break;
				}

				autoTuneObj = {
					startTime: startTime,
					duration: allTIAutoTunes[i].duration,
					sourceURL: allTIAutoTunes[i].sourceURL,
					title: serviceObj.serviceName,
					serviceId: allTIAutoTunes[i].serviceId,
					timeOfDay: timeOfDay,
					repeatDaysArray: repeatDaysArray,
					extraInfo: JSON.stringify({
						jobType: frequency
					})
				};

				//Create a new jobs with the datas from Teleidea's auto tune
				$N.app.AutoTuneHelper.setAutoTune(scheduleType, autoTuneObj);

				//Delete the older jobs from Teleidea
				$N.platform.btv.PVRManager.deleteJob(allTIAutoTunes[i].jobId);
			}
			log("convertTIAutotunes", "Exit");
		}

		/**
		 * This method converts the recorder settings set using the Teleidea UI
		 * @method convertTIReminders
		 * @private
		 */
		function convertTIRecorderSettings() {
			log("convertTIRecorderSettings", "Enter");
			var pvrKeepUntilUserValue = preferences.get(constants.PREF_DEFAULT_KEEP_UNTIL),
				pvrFoldersList = preferences.get(constants.PVR_NON_EPISODIC_FOLDER_LIST),
				pvrDefaultFolder = preferences.get(constants.PVR_NON_EPISODIC_DEFAULT_FOLDER),
				pvrPaddingBefore = preferences.get(constants.PREF_BEFORE_PADDING),
				pvrPaddingAfter = preferences.get(constants.PREF_AFTER_PADDING),
				i = 0;

			//30_DAYS keep until is not supported by our UI, hence converting the setting
			//to default Until_space_needed
			if (pvrKeepUntilUserValue === constants.KEEP_UNTIL_OPTION_30_DAYS) {
				preferences.set(constants.PREF_DEFAULT_KEEP_UNTIL, constants.KEEP_UNTIL_OPTION_SPACE_NEEDED);
			}

			//R1 UI has only one set of padding before and after values. So we use those values for episodic padding settings too.
			//Non-episodic padding config use the same path of R1 and so no need of manual overwriting
			if (pvrPaddingBefore) {
				preferences.set(constants.PREF_EPISODIC_BEFORE_PADDING, pvrPaddingBefore);
			}
			if (pvrPaddingAfter) {
				preferences.set(constants.PREF_EPISODIC_AFTER_PADDING, pvrPaddingAfter);
			}

			//Change the preferred root folder to our root folder name from TI
			if (pvrDefaultFolder === "/") {
				preferences.set(constants.PVR_NON_EPISODIC_DEFAULT_FOLDER, constants.ROOT_PVR_FOLDER_NAME);
			} else {
				pvrDefaultFolder = pvrDefaultFolder.replace(/\//g, "");
				preferences.set(constants.PVR_NON_EPISODIC_DEFAULT_FOLDER, pvrDefaultFolder);
			}

			//For each folder created in TI, we are getting / prefixed. We need to convert them and save it.
			for (i = 0; i < pvrFoldersList.length; i++) {
				if (pvrFoldersList[i].indexOf("/") > -1) {
					pvrFoldersList[i] = pvrFoldersList[i].replace(/\//g, "");
				}
			}
			preferences.set(constants.PVR_NON_EPISODIC_FOLDER_LIST, pvrFoldersList);
			log("convertTIRecorderSettings", "Exit");
		}

		/**
		 * This method converts all series link recordings and scheduled recordings set using the Teleidea UI
		 * @method convertTISeriesLink
		 * @private
		 */
		function convertTISeriesLink() {
			log("convertTISeriesLink", "Enter");
			var tasks = null,
				tasksLength = null,
				whereSqlQueryString = "taskType='REC' AND scheduleType='SERIES'",
				i = null,
				tempEpisodeNumber = null,
				tempUiFolder = null;
			tasks = $N.platform.btv.PVRManager.getTasksByQuery("taskId, jobId, uiFolder, title, episodeId", whereSqlQueryString, "startTime DESC");
			tasksLength = tasks.length;
			for (i = 0; i < tasksLength; i++) {
				tempEpisodeNumber = parseInt(tasks[i].episodeId.substr(0, 2), 10);
				tempUiFolder = tasks[i].title + "  Temp.  " + tempEpisodeNumber;
				tempUiFolder = $N.app.StringUtil.addLeadingForwardSlash(tasks[i].uiFolder);
				$N.app.PVRUtil.updateRecording(tasks[i].taskId, {uiFolder: tempUiFolder});
				CCOM.Scheduler.updateJob(tasks[i].jobId, {uiFolder: tempUiFolder});
			}
			log("convertTISeriesLink", "Exit");
		}

		/**
		 * This method converts all user generated recordings folder set using the Teleidea UI
		 * @method convertTIFolders
		 * @private
		 */
		function convertTIFolders() {
			log("convertTIFolders", "Enter");
			var tasks = null,
				tasksLength = null,
				whereSqlQueryString = "taskType='REC' AND scheduleType!='SERIES'",
				i = null,
				tempUiFolder = null;
			tasks = $N.platform.btv.PVRManager.getTasksByQuery("taskId, jobId, uiFolder, title, episodeId", whereSqlQueryString, "startTime DESC");
			tasksLength = tasks.length;
			for (i = 0; i < tasksLength; i++) {
				tempUiFolder = $N.app.StringUtil.addLeadingForwardSlash(tasks[i].uiFolder);
				$N.app.PVRUtil.updateRecording(tasks[i].taskId, {uiFolder: tempUiFolder});
				CCOM.Scheduler.updateJob(tasks[i].jobId, {uiFolder: tempUiFolder});
			}
			log("convertTIFolders", "Exit");
		}

		/**
		 * This method has is called to remove the 'CableEITPFOnly'
		 * scan config entries from the configman
		 * @method removeConfigEntries
		 * @private
		 */
		function removeConfigEntries() {
			var configEntry = "/network/siconfig/networkClasses/CableEITPFOnly";

			CCOM.ConfigManager.unsetValue(configEntry + "/transponders/0/dvbc/networkId");
			CCOM.ConfigManager.unsetValue(configEntry + "/transponders/0/dvbc/modulation");
			CCOM.ConfigManager.unsetValue(configEntry + "/transponders/0/dvbc/frequency");
			CCOM.ConfigManager.unsetValue(configEntry + "/transponders/0/dvbc/symbolRate");
			CCOM.ConfigManager.unsetValue(configEntry + "/transponders/0/dvbc");
			CCOM.ConfigManager.unsetValue(configEntry + "/transponders/0");
			CCOM.ConfigManager.unsetValue(configEntry + "/transponders");
			CCOM.ConfigManager.unsetValue(configEntry + "/networkClass");
			CCOM.ConfigManager.unsetValue(configEntry + "/enabled");
			CCOM.ConfigManager.unsetValue(configEntry + "/persistent");
			CCOM.ConfigManager.unsetValue(configEntry + "/useConnectedTuners");
			CCOM.ConfigManager.unsetValue(configEntry + "/automatic");
			CCOM.ConfigManager.unsetValue(configEntry);

			CCOM.SINetwork.unlockConfiguration();

			CCOM.SINetwork.removeEventListener("lockConfigurationOK", removeConfigEntries);
		}

		function deleteOldScanningEntries() {
			CCOM.SINetwork.addEventListener("lockConfigurationOK", removeConfigEntries);
			CCOM.SINetwork.addEventListener("lockConfigurationFailed", function () {
				log("runMigrationProcess", "Deleting the old entries failed, will retry in a moment.");
				window.setTimeout(deleteOldScanningEntries, 5000);
			});

			CCOM.SINetwork.lockConfiguration();
		}

		/**
		 * This method is used as the initiating function
		 * if migration has to happen from older Nagra UI to the latest.
		 * @method runNagraUIMigration
		 * @public
		 */
		function runNagraUIMigration() {
			var prefAudioLang = preferences.get(constants.PREF_AUDIO_LANGUAGE),
				prefSubtitlLang = preferences.get(constants.PREF_SUBTITLE_STATE);

			if (prefAudioLang === "dub") {
				preferences.set(constants.PREF_AUDIO_LANGUAGE, "por");
			}

			if (prefSubtitlLang === "CC") {
				preferences.set(constants.PREF_SUBTITLE_STATE, "por");
			}
		}

		/**
		 * This method is used as the initiating function
		 * if migration has to happen. Rest of the process is done
		 * sequentially on parent function's success callbacks
		 * @method runMigrationProcess
		 * @private
		 */
		function runMigrationProcess() {
			log("runMigrationProces", "Enter");
			convertTIRecorderSettings();
			convertTIAutotunes();
			convertTISeriesLink();
			convertTIFolders();

			deleteOldScanningEntries();

			// Finally, we can clear the squid cache as all of the old data is now irrelevant.
			CCOM.ControlCenter.HttpCache.clear();

			$N.platform.system.Preferences.set($N.app.constants.PREF_UI_MIGRATION_STATUS, true);//Set the migration status to done state once we complete the migration
			log("runMigrationProces", "Exit");
		}

		/* PUBLIC METHODS */
		return {
			runMigrationProcess : runMigrationProcess,
			runNagraUIMigration: runNagraUIMigration
		};

	}());

}($N || {}));
