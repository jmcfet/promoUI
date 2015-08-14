/**
 * AudioManager manages the audio configuration of the system.
 * @class $N.app.AutoTuneHelper
 * @static
 * @requires $N.app.epgUtil
 * @requires $N.apps.core.ContextManager
 * @requires $N.platform.btv.PVRManager
 * @requires $N.app.GeneralUtil
 * @requires $N.app.DateTimeUtil
 * @requires $N.app.constants
 * @requires $N.apps.dialog
 * @requires $N.app.SystemUtil
 * @requires $N.app.DialogueHelper
 * @requires $N.platform.btv.Reminders
 * @requires $N.apps.util.Util
 * @requires $N.app.FormatUtils
 * @requires $N.platform.system.Preferences
 * @requires $N.apps.core.Language
 */
(function ($N) {
	"use strict";
	$N = $N || {};
	$N.app = $N.app || {};
	$N.app.AutoTuneHelper = (function () {
		var TUNE_NOW = 1,
			DONT_TUNE = 2,
			CANCEL_ALL = 3,
			dialogTimedOutCallback = function () {},
			ONE_MINUTE_MS = 60000,
			dialogs = [],
			SINGLE_SPACE = " ",
			autoTuneProperties = {
				"frequency": null,
				"date": null,
				"time": null,
				"channel": null,
				"jobId": null,
				"isPresentTime": true
			},
			/* Current Job op state */
			JOB_OP_STATE = {
				JOB_OP_STATE_CREATED: 0,
				JOB_OP_STATE_CREATED_DELETING: 1,
				JOB_OP_STATE_READY: 2,
				JOB_OP_STATE_TASK_DELETING: 3,
				JOB_OP_STATE_DELETED: 4
			};


		/**
		 * Tunes to the channel of the current service
		 * If the user is already in zapper then the updateBannerAndTuneIfNeeded method is called
		 * otherwise user is taken to zapper and the service is tuned
		 * @method tuneToChannel
		 * @private
		 * @param {Number} id of the event we wish to tune to
		 * @param {Boolean} isDirectRequest If false, tunes via Zapper. If true, tunes via PlayoutManager
		 */
		function tuneToChannel(serviceId, isDirectRequest) {
			var service = $N.app.epgUtil.getServiceById(serviceId),
				playoutCasId = {},
				playout = {};
			if (!isDirectRequest) {
				if ($N.apps.core.ContextManager.getActiveContext().getId() !== "ZAPPER") {
					service.showBanner = true;
					$N.app.ContextHelper.openContext("ZAPPER", {activationContext: service});
				} else {
					$N.apps.core.ContextManager.getActiveController().updateBannerAndTuneIfNeeded(service);
				}
			} else {
				playoutCasId = { casId: (service.conditionalAccessIDs) ? service.conditionalAccessIDs[0] : null };
				$N.app.epgUtil.storeChannelToPrefs(serviceId);
				playout = {
					url: service.uri,
					isLive: true,
					isMusic: $N.platform.btv.EPG.isRadioChannel(service),
					serviceId: service.serviceId
				};

				$N.app.fullScreenPlayer.requestPlayout(
					playout,
					true,
					playoutCasId
				);
			}
		}

		/**
		 * Cancels the Auto tune based on job Id
		 * @method cancelAutoTune
		 * @public
		 * @param {Number} id of the job we wish to delete
		 */
		function cancelAutoTune(jobId) {
			$N.platform.btv.PVRManager.deleteJob(jobId);
		}

		/**
		 * The callback to run once an option has been selected (such as tune now)
		 * @method optionSelectedCallback
		 * @private
		 * @param {Object} item The selected item
		 */
		function optionSelectedCallback(item) {
			var i,
				extraInfo;
			if (item && item.action) {
				switch (item.action) {
				case TUNE_NOW:
					tuneToChannel(item.eventId);
					if ("once" === item.autoTuneType) {
						cancelAutoTune(item.jobId);
					}
					break;
				case DONT_TUNE:
					if ("once" === item.autoTuneType) {
						cancelAutoTune(item.jobId);
					}
					break;
				case CANCEL_ALL:
					for (i = 0; i < item.tasks.length; i++) {
						extraInfo = $N.app.GeneralUtil.ParseJSON(i.tasks[i].extraInfo);
						if (extraInfo && extraInfo.jobType && "once" === extraInfo.jobType) {
							cancelAutoTune(item.tasks[i].jobId);
						}
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
						if ("once" === items[i].autoTuneType) {
							cancelAutoTune(items[i].jobId);
						}
					}
				}
			}
		}
		/**
		 * Called once a TaskAlert event is fired
		 * @method autoTuneCallback
		 * @public
		 * @param {Object} e The event that is fired
		 */
		function autoTuneCallback(e) {
			var service = $N.app.epgUtil.getServiceById(e.task.serviceId),
				title = $N.app.AutoTuneHelper.getString("menuAutoTune"),
				jobTime = new Date(e.task.startTime + ONE_MINUTE_MS),
				message =  $N.app.AutoTuneHelper.getString("autoTuneStartMessageWithTime") + $N.app.DateTimeUtil.getFormattedTimeString(jobTime, $N.app.constants.TWENTY_FOUR_HOUR_TIME_FORMAT) + $N.app.AutoTuneHelper.getString("autoTuneSelectMessage"),
				extraInfo = $N.app.GeneralUtil.ParseJSON(e.task.extraInfo),
				autoTuneType = (extraInfo && extraInfo.jobType) ? extraInfo.jobType : "",
				options = [
					{
						name: $N.app.AutoTuneHelper.getString("menuAutoTuneChannel") + SINGLE_SPACE + $N.app.GeneralUtil.padNumberWithZeroes(service.logicalChannelNum, 3) + SINGLE_SPACE + service.serviceName,
						action: TUNE_NOW,
						eventId: e.task.serviceId,
						jobId: e.task.jobId,
						autoTuneType: autoTuneType
					},
					{
						name: $N.app.AutoTuneHelper.getString("cancelAutoTuneMessage"),
						action: DONT_TUNE,
						eventId: e.task.serviceId,
						jobId: e.task.jobId,
						autoTuneType: autoTuneType
					}
				],
				dialog;
			if (service) {
				dialog = $N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_AUTO_TUNE_START,
							title,
							message,
							options,
							optionSelectedCallback,
							null,
							null,
							null,
							{	"message" : message,  // dialogObjectConfigParam
								"options" : options
							},
							null,
							null,
							null,
							function () {
						tuneToChannel(e.task.serviceId);
						dialogs[e.task.jobId] = null;
						dialogTimedOutCallback();
					});
				dialogs[e.task.jobId] = dialog;
				dialog.setExitCallback(exitKeyCallback);

				if ($N.common.helper.PowerManager.getCurrentPowerMode() === $N.common.helper.PowerManager.SYSTEM_POWER_STANDBY) {
					$N.common.helper.PowerManager.wakeUp();
				}
			}
		}

		/**
		 * Called once a TaskAlert event is fired
		 * with conflicts between auto tunes
		 * @method autoTuneConflictCallback
		 * @public
		 * @param {Object} tasks The list of tasks fired
		 */
		function autoTuneConflictCallback(tasks) {
			var service,
				title = $N.app.AutoTuneHelper.getString("menuAutoTune"),
				jobTime = new Date(tasks[0].startTime + ONE_MINUTE_MS),
				message =  $N.app.AutoTuneHelper.getString("autoTuneStartMessageWithTime") + $N.app.DateTimeUtil.getFormattedTimeString(jobTime, $N.app.constants.TWENTY_FOUR_HOUR_TIME_FORMAT) + $N.app.AutoTuneHelper.getString("autoTuneSelectMessage"),
				options = [],
				dialog,
				i,
				extraInfo;
			options.push({
				name: $N.app.AutoTuneHelper.getString("cancelAutoTuneMessage"),
				action: CANCEL_ALL,
				tasks: tasks
			});

			for (i = 0; i < tasks.length; i++) {
				service = $N.app.epgUtil.getServiceById(tasks[i].serviceId);
				extraInfo = $N.app.GeneralUtil.ParseJSON(tasks[i].extraInfo);
				options.push({
					name: $N.app.AutoTuneHelper.getString("menuAutoTuneChannel") + SINGLE_SPACE + $N.app.GeneralUtil.padNumberWithZeroes(service.logicalChannelNum, 3) + SINGLE_SPACE + service.serviceName,
					action: TUNE_NOW,
					eventId: tasks[i].serviceId,
					jobId: tasks[i].jobId,
					autoTuneType: (extraInfo && extraInfo.jobType) ? extraInfo.jobType : ""
				});
			}

			if (service) {
				dialog = $N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_AUTO_TUNE_CONFLICT,
							title,
							message,
							options,
							optionSelectedCallback,
							null,
							null,
							null,
							null,
							null,
							$N.gui.ConflictDialog,
							null,
							function () {
						tuneToChannel(tasks[0].serviceId);
						dialogs[tasks[0].jobId] = null;
						dialogTimedOutCallback();
					});
				dialogs[tasks[0].jobId] = dialog;
				dialog.setExitCallback(exitKeyCallback);

				if ($N.common.helper.PowerManager.getCurrentPowerMode() === $N.common.helper.PowerManager.SYSTEM_POWER_STANDBY) {
					$N.common.helper.PowerManager.wakeUp();
				}
			}
		}

		/**
		 * Called once a TaskAlert event is fired
		 * @method setAutoTune
		 * @public
		 * @param {String} jobType Type of the Job, ONE_TIME/RPT_TIME
		 * @param {Object} addInfoObj info object used by the scheduler
		 * @param {function} callback function
		 */
		function setAutoTune(jobType, addInfoObj, callback) {
			$N.platform.btv.Reminders.setGenericReminder(jobType, addInfoObj, callback);
		}

		/**
		 * Resets the Auto tune properties to default
		 * @method resetAutoTuneProperties
		 * @public
		 */
		function resetAutoTuneProperties() {
			var currentChannel = $N.app.epgUtil.getServiceById($N.app.epgUtil.getChannelFromPrefs());
			autoTuneProperties = {
				"frequency": "once",
				"date": $N.apps.util.Util.formatDate(new Date(), "dd/mm/yyyy"),
				"time": $N.app.DateTimeUtil.getFormattedTimeString(new Date(), $N.app.constants.TWENTY_FOUR_HOUR_TIME_FORMAT),
				"channelInfo": currentChannel,
				"logicalChannelNum": currentChannel.logicalChannelNum,
				"channel": $N.app.FormatUtils.formatChannelNumber(currentChannel.logicalChannelNum) + ' ' + currentChannel.serviceName,
				"jobId": null,
				"isPresentTime": true
			};
		}

		/**
		 * sets value of one property of Auto tune
		 * @method setAutoTuneProperty
		 * @public
		 * @param {Object} prop name of the property
		 * @param {Object} value of the property
		 */
		function setAutoTuneProperty(prop, value) {
			autoTuneProperties[prop] = value;
		}

		/**
		 * get one auto tune property, like 'serviceId'
		 * @method getAutoTuneProperty
		 * @public
		 * @param {Object} prop name of the property
		 */
		function getAutoTuneProperty(prop) {
			return autoTuneProperties[prop];
		}

		/**
		 * Gets all the Auto tune properties
		 * @method getAllAutoTuneProperties
		 * @public
		 */
		function getAllAutoTuneProperties() {
			return autoTuneProperties;
		}

		/**
		 * gets All active Auto tunes
		 * @method getAllActiveAutoTune
		 * @public
		 */
		function getAllActiveAutoTune() {
			var fields = "jobId,serviceId,startTime,extraInfo";
			return $N.platform.btv.PVRManager.getAllTimedReminders("eventId IS NULL" + " AND serviceId IS NOT NULL" + " AND jobOpState>=" + String(JOB_OP_STATE.JOB_OP_STATE_CREATED) + " AND jobOpState<=" + String(JOB_OP_STATE.JOB_OP_STATE_READY), fields);
		}

		/* PUBLIC METHODS */
		return {
			/**
			 * Initialise method called upon booting STB
			 * @method initialise
			 */
			initialise: function () {
				$N.apps.core.Language.adornWithGetString($N.app.AutoTuneHelper);
			},

			/**
			 * Set the callback for when an error message dialog times out
			 * @method setDialogTimedOutCallback
			 * @param (function) callback
			 */
			setDialogTimedOutCallback: function (callback) {
				dialogTimedOutCallback = callback || function () {};
			},

			setAutoTuneDeleteOKCallback: function (callback) {
				$N.platform.btv.PVRManager.addEventListener("deleteJobOK", callback);
			},

			autoTuneCallback: autoTuneCallback,
			setAutoTune: setAutoTune,
			cancelAutoTune: cancelAutoTune,
			resetAutoTuneProperties: resetAutoTuneProperties,
			setAutoTuneProperty: setAutoTuneProperty,
			getAutoTuneProperty: getAutoTuneProperty,
			getAllAutoTuneProperties: getAllAutoTuneProperties,
			getAllActiveAutoTune: getAllActiveAutoTune,
			autoTuneConflictCallback: autoTuneConflictCallback,
			tuneToChannel: tuneToChannel
		};

	}());

}($N || {}));