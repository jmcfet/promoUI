/**
 * Reminders helper class that initialises the reminders class in the jsfw
 * and handles showing the dialog when a task alert is fired
 * Contains the options to display once the reminder is fired
 *
 * @class $N.app.Reminders
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.Reminders = (function () {
		var TUNE_NOW = 1,
			OK = 2,
			DONT_TUNE = 3,
			CANCEL_ALL = 4,
			showRemindersDialogCallback = function () {},
			dialogTimedOutCallback = function () {},
			cancelReminderdialogTimedOutCallback = function () {},
			DEFAULT_REMINDER_TIME = 60,
			serviceToTune = null,
			dialogs = [],
			/* Current Job op state */
			JOB_OP_STATE = {
				JOB_OP_STATE_CREATED: 0,
				JOB_OP_STATE_CREATED_DELETING: 1,
				JOB_OP_STATE_READY: 2,
				JOB_OP_STATE_TASK_DELETING: 3,
				JOB_OP_STATE_DELETED: 4
			},
			log = new $N.apps.core.Log("app", "Reminders");

		/**
		 * Returns the string to display when when ok option is highlighted
		 * @method getTuneReminderString
		 * @private
		 * @return {String} String to be displayed
		 */
		function getTuneReminderString() {
			return $N.app.Reminders.getString("autoTune") + parseInt(DEFAULT_REMINDER_TIME / 60, 10) + " " + $N.app.Reminders.getString("tuneMinutes");
		}

		/**
		 * The callback to run once an option has been highlighted (such as tune now)
		 * @method optionHighlightedCallback
		 * @private
		 * @param {Object} item The highlighted item
		 */
		function optionHighlightedCallback(item) {
			var description,
				event;
			if (item && item.action) {
				switch (item.action) {
				case TUNE_NOW:
					event = $N.platform.btv.EPG.getEventById(item.eventId);
					description = $N.app.Reminders.getString("immediatelyTune") + "'" + event.title.replace(/^\s+|\s+$/g, '').replace(/(\r\n|\n|\r)/gm, "") + "'. " + $N.app.Reminders.getString("selectToContinue");
					break;
				case OK:
					description = getTuneReminderString();
					break;
				case DONT_TUNE:
					description = $N.app.Reminders.getString("selectToCancel");
					break;
				}
			}
			if (description) {
				dialogs[item.eventId].customise({description: description});
			}
		}

		/**
		 * Tunes to the channel of the current service
		 * If the user is already in zapper then the updateBannerAndTuneIfNeeded method is called
		 * otherwise user is taken to zapper and the service is tuned
		 * @method tuneToChannel
		 * @private
		 * @param {Number} id of the event we wish to tune to
		 */
		function tuneToChannel(eventId) {
			var event = $N.platform.btv.EPG.getEventById(eventId),
				service = event ? $N.app.epgUtil.getServiceById(event.serviceId) : serviceToTune;
			if (event) {
				$N.platform.btv.Reminders.cancelReminder(event);
			}
			if ($N.apps.core.ContextManager.getActiveContext().getId() !== "ZAPPER") {
				service.showBanner = true;
				$N.app.ContextHelper.openContext("ZAPPER", {activationContext: service});
			} else {
				$N.apps.core.ContextManager.getActiveController().updateBannerAndTuneIfNeeded(service);
			}
			serviceToTune = null;
		}
		/**
		 * The function to delete the job based on jobId passed
		 * @method deleteReminderJob
		 * @private
		 * @param {jobId} selected item jobId
		 */
		function deleteReminderJob(jobId) {
			$N.platform.btv.PVRManager.deleteJob(jobId);
		}
		/**
		 * The callback to run once an option has been selected (such as tune now)
		 * @method optionSelectedCallback
		 * @private
		 * @param {Object} item The selected item
		 */
		function optionSelectedCallback(item) {
			if (item && item.action) {
				switch (item.action) {
				case TUNE_NOW:
					tuneToChannel(item.eventId);
					deleteReminderJob(item.jobId);
					break;
				case DONT_TUNE:
					$N.platform.btv.Reminders.cancelReminder($N.platform.btv.EPG.getEventById(item.eventId));
					break;
				case CANCEL_ALL:
					var i;
					for (i = 0; i < item.tasks.length; i++) {
						$N.platform.btv.Reminders.cancelReminder($N.platform.btv.EPG.getEventById(item.tasks[i].eventId));
					}
					break;
				}
			}
			if (item && item.eventId) {
				dialogs[item.eventId] = null;
			}
		}
		/**
		 * The callback to run once Exit/Cancel key pressed
		 * @method exitKeyCallback
		 * @private
		 * @param {Object} item The options object
		 */
		function exitKeyCallback(items) {
			if (items) {
				var itemsLength = items.length,
					i;
				for (i = 0; i < itemsLength; i++) {
					if ((items[i].action !== DONT_TUNE) && (items[i].action !== CANCEL_ALL)) {
						deleteReminderJob(items[i].jobId);
					}
				}
			}
		}

		/**
		 * Called once a TaskAlert event is fired
		 * with conflicts between reminders
		 * @method reminderConflictCallback
		 * @public
		 * @param {Object} tasks The list of tasks fired
		 */
		function reminderConflictCallback(tasks) {
			var service,
				event,
				eventName,
				title = $N.app.Reminders.getString("titleReminders"),
				message = $N.app.Reminders.getString("RemindersStartMessage"),
				options = [],
				dialog,
				CANCEL_ALL_ITEM = {
					name: $N.app.Reminders.getString("cancelReminderMessage"),
					action: CANCEL_ALL,
					tasks: tasks
				},
				i;
			options.push(CANCEL_ALL_ITEM);

			for (i = 0; i < tasks.length; i++) {
				service = $N.app.epgUtil.getServiceById(tasks[i].serviceId);
				event = $N.platform.btv.EPG.getEventById(tasks[i].eventId);
				eventName = ($N.app.ParentalControlUtil.isChannelOrProgramLocked(event) && ($N.app.epgUtil.isAdultEvent(event) || $N.app.genreUtil.isAdultChannel(service))) ? $N.app.Reminders.getString("adultContent") : tasks[i].title;
				options.push({
					name: eventName,
					action: TUNE_NOW,
					eventId: tasks[i].eventId,
					jobId: tasks[i].jobId
				});
			}

			if (service) {
				if ($N.common.helper.PowerManager.getCurrentPowerMode() === $N.common.helper.PowerManager.SYSTEM_POWER_NORMAL) {
					dialog = $N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_AUTO_TUNE,
								title,
								message,
								options,
								optionSelectedCallback,
								null,
								null,
								null,
								null,
								true,
								$N.gui.ConflictDialog,
								null,
								function () {
							tuneToChannel(tasks[0].eventId);
							dialogs[tasks[0].serviceId] = null;
							dialogTimedOutCallback();
						});
					$N.app.DialogueHelper.updateDialogueOptions($N.app.constants.DLG_AUTO_TUNE, options);
					dialogs[tasks[0].serviceId] = dialog;
					dialog.setExitCallback(exitKeyCallback);
				}
			}
		}

		function showGenericReminderConflicts(tasks) {
			log("showGenericReminderConflicts", "Enter");
			var autoTuneTasksCount = 0,
				remindersTasksCount = 0,
				remindersTasks = [],
				autoTuneTasks = [],
				i;
			log("showGenericReminderConflicts", "tasks length " + tasks.length);
			for (i = 0; i < tasks.length; i++) {
				if (tasks[i].title === $N.app.constants.FACEBOOK_FEATURE_AVAILABILITY_SCHEDULER_TITLE) {
					log("showGenericReminderConflicts", "firing FB feature availability task");
					$N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK).facebookFeatureAvailabilityCallback();
				} else if (tasks[i].title === $N.app.constants.APPLICATION_LAUNCH_CONFIG_FETCH_SCHEDULER_TITLE) {
					log("showGenericReminderConflicts", "firing launch config fetch task");
					$N.app.ApplicationLauncher.initialiseApplicationChannelMapping();
				} else if (!tasks[i].eventId) {
					autoTuneTasksCount++;
					autoTuneTasks.push(tasks[i]);
				} else if (tasks[i].eventId) {
					remindersTasksCount++;
					remindersTasks.push(tasks[i]);
				}
			}
			log("showGenericReminderConflicts", "remindersTasksCount : " + remindersTasksCount + ", autoTuneTasksCount : " + autoTuneTasksCount);
			if (remindersTasksCount > 0) {
				reminderConflictCallback(remindersTasks);
			} else if (remindersTasksCount === 0 && autoTuneTasksCount > 0) {
				$N.app.AutoTuneHelper.autoTuneConflictCallback(autoTuneTasks);
			}
			log("showGenericReminderConflicts", "Exit");
		}

		/**
		 * Called once a TaskAlert event is fired
		 * @method reminderCallback
		 * @private
		 * @param {Object} e The event that is fired
		 */
		function reminderCallback(e) {
			log("reminderCallback", "Enter");
			log("reminderCallback", "e.task.title : " + e.task.title);
			if (e.task.title === $N.app.constants.FACEBOOK_FEATURE_AVAILABILITY_SCHEDULER_TITLE) {
				$N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK).facebookFeatureAvailabilityCallback();
			} else if (e.task.title === $N.app.constants.FACEBOOK_TOKEN_RENEWAL_SCHEDULER_TITLE) {
				$N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK).getTemporaryCodeFromServerCallback();
			} else if (e.task.title === $N.app.constants.APPLICATION_LAUNCH_CONFIG_FETCH_SCHEDULER_TITLE) {
				$N.app.ApplicationLauncher.initialiseApplicationChannelMapping();
			} else if (!e.task.eventId) {
				$N.app.AutoTuneHelper.autoTuneCallback(e);
			} else {
				var event = $N.platform.btv.EPG.getEventById(e.task.eventId),
					service = $N.app.epgUtil.getServiceById(e.task.serviceId),
					eventName = (($N.app.ParentalControlUtil.isChannelOrProgramLocked(event) && ($N.app.epgUtil.isAdultEvent(event) || $N.app.genreUtil.isAdultChannel(service))) ? $N.app.Reminders.getString("adultContent") : e.task.title),
					title = $N.app.Reminders.getString("titleReminders"),
					message = $N.app.Reminders.getString("RemindersStartMessage"),
					options = [
						{
							name: $N.app.Reminders.getString("cancelReminderMessage"),
							action: DONT_TUNE,
							eventId: e.task.eventId,
							jobId: e.task.jobId
						},
						{
							name: eventName,
							action: TUNE_NOW,
							eventId: e.task.eventId,
							jobId: e.task.jobId
						}
					],
					dialog;

				if ($N.common.helper.PowerManager.getCurrentPowerMode() !== $N.common.helper.PowerManager.SYSTEM_POWER_NORMAL) {
					return false; //POP-1800 Reminders shall be ignored while the box is in standby mode.
				}

				if (service) {
					if ($N.common.helper.PowerManager.getCurrentPowerMode() === $N.common.helper.PowerManager.SYSTEM_POWER_NORMAL) {
						dialog = $N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_REMINDER,
									title,
									message,
									options,
									optionSelectedCallback,
									null,
									null,
									null,
									{	"options" : options // dialogObjectConfigParam
									},
									true,
									null,
									null,
									function () {
								tuneToChannel(e.task.eventId);
								deleteReminderJob(e.task.jobId);
								dialogs[e.task.serviceId] = null;
								dialogTimedOutCallback();
							});
						dialogs[e.task.serviceId] = dialog;
						dialog.setExitCallback(exitKeyCallback);
					}
				}
			}
			log("reminderCallback", "Exit");
		}

		/**
		 * Method to set scheduler which will create a daily basis task 
		 * and makes sure it runs everyday
		 * @method setDailyScheduler
		 */
		function setDailyScheduler(schedulerTitle, schedulerSrcURL, timeOfLastSchedulerRunConstant, schedulerCallback, timeOfDayIncrement) {
			var newDate,
				timeOfDay,
				repeatDaysArray,
				addInfoObj,
				JOB_TYPE_REPEAT = "RPT_TIME",
				DURATION = 1,
				currentTimeInMiliseconds,
				ONE_HOUR_IN_MILISECONDS = 3600000,
				ONE_DAY = 24,
				noOfHours,
				whereSqlQueryString,
				resultSet,
				ONE_MINUTE = 60000,
				startTime,
				title = schedulerTitle,
				sourceURL = schedulerSrcURL,
				timeOfLastSchedulerRun = $N.platform.system.Preferences.get(timeOfLastSchedulerRunConstant);

			newDate = new Date();
			startTime = newDate.getTime();
			startTime = startTime - ONE_MINUTE;
			if (!timeOfDayIncrement) {
				timeOfDayIncrement = 0;
			}
			timeOfDay = (newDate.getHours() * 3600) + ((newDate.getMinutes() + timeOfDayIncrement) * 60);
			if ($N.app.Config.getConfigValue("mds.developer.mode") === "on") {
				timeOfDay = timeOfDay + (4 * 60);
			}
			repeatDaysArray = $N.platform.btv.PVRManager.getRepeatDaysArrayForFrequency($N.platform.btv.PVRManager.Frequency.DAILY);
			addInfoObj = {
				startTime: startTime,
				duration: DURATION,
				sourceURL: sourceURL,
				timeOfDay: timeOfDay,
				title: title,
				repeatDaysArray: repeatDaysArray
			};

			// Condition to check if the setup box was off for more than one day, then on boot fire the callback.

			if (timeOfLastSchedulerRun) {
				currentTimeInMiliseconds = Date.now();
				noOfHours = (currentTimeInMiliseconds - parseInt(timeOfLastSchedulerRun, 10)) / ONE_HOUR_IN_MILISECONDS;
				if (noOfHours >= ONE_DAY) {
				    schedulerCallback();
				}
			}
			// to check if job is already set, then do not create a job again
			whereSqlQueryString = "title= '" + title + "'" + " AND jobOpState = " + JOB_OP_STATE.JOB_OP_STATE_READY;
			resultSet = $N.platform.btv.PVRManager.getJobByQuery(whereSqlQueryString, "startTime");
			if (resultSet.length === 0) {
				$N.platform.btv.Reminders.setGenericReminder(JOB_TYPE_REPEAT, addInfoObj, function (isSuccess, e) {
					if (!isSuccess) {
						schedulerCallback();
					}
				});
			}
		}

		/* PUBLIC METHODS */
		return {
			/**
			 * Initialise method called upon booting STB
			 * @method initialise
			 */
			initialise: function () {
				$N.apps.core.Language.adornWithGetString($N.app.Reminders);
				$N.platform.btv.Reminders.init($N.app.constants.DEFAULT_REMINDER_TIME, reminderCallback);
				$N.platform.btv.Reminders.setGenericReminderConflictHandler(showGenericReminderConflicts);
				$N.platform.btv.Reminders.setTaskOccuredCallback(function (e) {
					if (serviceToTune) {
						tuneToChannel();
					}
				});
				this.setReminderDeleteOKCallback(function () {
					$N.apps.util.EventManager.fire("genericReminderJobUpdated");
				});
				this.setReminderDeleteFailedCallback(function () {
					$N.apps.util.EventManager.fire("genericReminderJobUpdated");
				});
			},

			/**
			 * Sets the callback to run once the dialog is shown
			 * @method setShowDialogCallback
			 * @param {Function} callback
			 */
			setShowDialogCallback: function (callback) {
				showRemindersDialogCallback = callback;
			},

			/**
			 * Set the callback for when dialog times out
			 * @method setDialogTimedOutCallback
			 * @param (function) callback
			 */
			setDialogTimedOutCallback: function (callback) {
				dialogTimedOutCallback = callback || function () {};
			},
			/**
			 * Set the callback for when an cancel reminder dialog times out
			 * @method setcancelReminderdialogTimedOutCallback
			 * @param (function) callback
			 */
			setcancelReminderdialogTimedOutCallback: function (callback) {
				cancelReminderdialogTimedOutCallback = callback || function () {};
			},
			/**
			 * Set the callback for successful reminder deletion
			 * @method setReminderDeleteOKCallback
			 * @param (function) callback
			 */
			setReminderDeleteOKCallback: function (callback) {
				$N.platform.btv.PVRManager.addEventListener("deleteJobOK", callback);
			},
			/**
			 * Add event listener for reminder deletion failure
			 * @method setReminderDeleteFailedCallback
			 * @param (function) callback
			 */
			setReminderDeleteFailedCallback: function (callback) {
				CCOM.Scheduler.addEventListener("deleteJobFailed", callback);
			},
			/**
			 * This forms the addInfoObj and sets Generic reminder
			 * @method setReminders
			 * @public
			 */
			setReminders: function (eventObj, callback) {
				log("setReminders", "Enter");
				var startTime,
					sourceURL,
					title,
					serviceId,
					entity = {},
					addInfoObj,
					reminderJobType,
					JOB_TYPE_SINGLE = "ONE_TIME",
					DURATION = 1,
					ONE_MINUTE = 60000,
					eventId,
					parentalRating,
					episodeId,
					eventObjByUniqueEventId;
				startTime = eventObj.startTime - ONE_MINUTE;
				title = eventObj.title;
				serviceId = eventObj.serviceId;
				sourceURL = $N.app.epgUtil.getServiceById(eventObj.serviceId).uri;
				eventId = eventObj.eventId;
				reminderJobType = JOB_TYPE_SINGLE;
				parentalRating = eventObj.parentalRating;
				episodeId = eventObj.episodeId;
				addInfoObj = {
					eventId: eventId,
					serviceId: serviceId,
					sourceURL: sourceURL,
					startTime: startTime,
					duration: DURATION,
					title: title,
					extraInfo: JSON.stringify({
						parentalRating: parentalRating,
						episodeId : episodeId
					})
				};
				if ($N.app.SystemUtil.isNative()) {
					log("setReminders", "eventObj.source : " + eventObj.source);
					if (eventObj.source === $N.data.EPGEvent.SOURCE.MDS) {
						//checking is made as there is difference in eventId between MDS and STB's EPG db, 
						//which causes duplicate events in database. uniqueEventId is same for both events
						eventObjByUniqueEventId = $N.app.epgUtil.getEventByUniqueEventId(eventObj.uniqueEventId);
						if (eventObjByUniqueEventId) {
							log("setReminders", "calling setReminders again with respective event obj from EPG db");
							//calling setReminders again with respective event obj from EPG db
							$N.app.Reminders.setReminders(eventObjByUniqueEventId, callback);
						} else {
							log("setReminders", "calling addMdsEventToEPG");
							$N.app.epgUtil.addMdsEventToEPG(eventObj, function () {
								log("setReminders", "addMdsEventToEPG success");
								$N.platform.btv.Reminders.setGenericReminder(reminderJobType, addInfoObj, callback);
							}, function (e) {
								log("setReminders", "addMdsEventToEPG failed, so reminder not set");
							});
						}
					} else {
						log("setReminders", "saving reminder present in epg");
						$N.platform.btv.Reminders.setGenericReminder(reminderJobType, addInfoObj, callback);
					}
				}
				log("setReminders", "Exit");
			},
			/**
			 * gets All active reminders
			 * @method getAllActiveAutoTune
			 * @public
			 */
			getAllActiveReminders: function () {
				var fields = "jobId,serviceId,startTime,extraInfo,eventId,title";
				return $N.platform.btv.PVRManager.getAllTimedReminders("eventId IS NOT NULL" + " AND jobOpState>=" + String(JOB_OP_STATE.JOB_OP_STATE_CREATED) + " AND jobOpState<=" + String(JOB_OP_STATE.JOB_OP_STATE_READY), fields);
			},
			reminderCallback: reminderCallback,
			setDailyScheduler: setDailyScheduler
		};

	}());

}($N || {}));