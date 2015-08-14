/**
 * Conflicts helper class that handles showing the dialog when a task alert is fired
 * Contains the options to display once the conflict is resolved or when
 * returning from the conflict action panel.
 * @class $N.app.Conflicts
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.apps.core.Language
 * @requires $N.apps.dialog.DialogManager
 * @requires $N.platform.btv.EPG
 * @requires $N.platform.btv.PVRManager
 * @requires $N.apps.core.ContextManager
 * @requires $N.apps.dialog.ConfirmationDialogue
 * @requires $N.app.AutoTuneHelper
 * @requires $N.app.PVRUtil
 * @requires $N.app.ArrayUtil
 * @requires $N.app.EventUtil
 * #depends PVRUtil.js
*/

var $N = $N || {};
$N.app = $N.app || {};

$N.app.Conflicts = (function () {

	var log = new $N.apps.core.Log('HELPER', 'Conflicts'),
		dialogManager = $N.apps.dialog.DialogManager,
		PVRManager = $N.platform.btv.PVRManager,
		PVRUtil = $N.app.PVRUtil,
		dialogShownCallback = function () {};

	/**
	 * @method getTaskTitle
	 * @private
	 * @param {Object} task to obtain title from
	 */
	function getTaskTitle(task) {
		if ($N.app.PVRUtil.isTaskBlockedTitle(task)) {
			return $N.app.PVRUtil.getString("adultContent");
		} else if ($N.app.ManualRecordingHelper.isManualRecordingTask(task)) { //If its a PVR task and has service Id but no event ID, then its a TBR
			var serviceObj = $N.platform.btv.EPG.getChannelByServiceId(task.serviceId);
			return serviceObj.serviceName;
		} else {
			return task.title;
		}
	}

	/**
	 * @method getOptionsForConflictDialog
	 * @private
	 * @param {Array} conflicts a collection of conflicting tasks
	 * @param {Number} type of conflict
	 * @return {Array} options for conflict dialog
	 */
	function getOptionsForConflictDialog(conflicts, type) {
		var options = [],
			recordingStub = $N.app.Conflicts.getString("cancelSpecificRecordingStub") + " \"",
			conflictsLength = conflicts.length,
			i;
		for (i = 0; i < conflictsLength; i++) {
			options.push({ name: recordingStub + getTaskTitle(conflicts[i]) + "\"", action: i });
		}
		if (type === PVRUtil.RECORD_CONFLICT_WITH_RE_TUNE) {
			options.push({ name: $N.app.Conflicts.getString("reTuneTo") + getTaskTitle(conflicts[0]), action: i });
		} else if (type === PVRUtil.RECORD_CONFLICT_WITH_VOD_RE_TUNE) {
			options.push({ name: $N.app.Conflicts.getString("stopPlaybackAndTuneTo") + getTaskTitle(conflicts[0]), action: i });
		} else if (type === PVRUtil.WATCH_CONFLICT) {
			options.push({ name: $N.app.Conflicts.getString("doNotTune"), action: i });
		} else if (type === PVRUtil.VOD_PLAYBACK_CONFLICT) {
			options.push({ name: $N.app.Conflicts.getString("cancelPlayback"), action: i });
		}
		return options;
	}

	/**
	 * @method cancelRecordingAndTune
	 * @private
	 * @param {Object} task of recording to cancel
	 * @param {String} serviceId of channel to tune to
	 * @param {Boolean} requiresTune
	 */
	function cancelRecordingAndTune(task, serviceId, requiresTune) {
		log("cancelRecordingAndTune", "Enter");
		PVRManager.cancelRecordingByTask(task);
		if (requiresTune) {
			$N.app.AutoTuneHelper.tuneToChannel(serviceId);
		}
		log("cancelRecordingAndTune", "Exit");
	}

	/**
	 * @method dialogCallbackAction
	 * @private
	 * @param {Object} key
	 * @param {Object} event
	 * @param {Array} conflicts a collection of conflicting tasks
	 * @param {Number} type of conflict
	 * @param {Function} callback for watch conflicts after resolution channel tuning call back.
	 * @param {Function} doNotTuneCallback - run this function if available when we do not tune
	 */
	function dialogCallbackAction(key, event, conflicts, type, callback, doNotTuneCallback) {
		log("dialogCallbackAction", "Enter");
		var isNotLastOption = key.action < conflicts.length,
			chosenConflictEventId = conflicts[key.action] ? conflicts[key.action].eventId : 0,
			isEventPlayingNow = chosenConflictEventId ? $N.app.EventUtil.isEventPlayingNow($N.platform.btv.EPG.getEventById(chosenConflictEventId)) : false,
			indexToTuneTo = key.action && key.action === 1 ? 0 : 1;
		if (type === PVRUtil.WATCH_CONFLICT) {
			if (isNotLastOption) {
				if ($N.apps.core.ContextManager.getActiveContext().getId() === "MOSAIC" ||
						$N.apps.core.ContextManager.getActiveContext().getId() === "MUSIC") {
					PVRManager.cancelRecordingByTask(conflicts[key.action]);
					callback();
				} else {
					cancelRecordingAndTune(conflicts[key.action], event.serviceId, true);
				}
			} else if (doNotTuneCallback) {
				doNotTuneCallback();
			}
		} else if ((type === PVRUtil.RECORD_CONFLICT_WITH_RE_TUNE || type === PVRUtil.RECORD_CONFLICT_WITH_VOD_RE_TUNE) && callback) {
			if (isNotLastOption) {
				cancelRecordingAndTune(conflicts[key.action], conflicts[indexToTuneTo].serviceId, isEventPlayingNow);
				callback();
			} else {
				$N.app.AutoTuneHelper.tuneToChannel(conflicts[0].serviceId);
			}
		} else if (type === PVRUtil.VOD_PLAYBACK_CONFLICT) {
			if (isNotLastOption) {
				PVRManager.cancelRecordingByTask(conflicts[key.action]);
				callback();
			}
		} else {
			cancelRecordingAndTune(conflicts[key.action], conflicts[indexToTuneTo].serviceId, isEventPlayingNow);
		}
		log("dialogCallbackAction", "Exit");
	}

	/**
	 * Called to display the conflict dialog
	 * @method showConflictDialog
	 * @private
	 * @param {Object} event
	 * @param {Array} conflicts a collection of conflicting tasks
	 * @param {Number} type of conflict
	 * @param {Function} callback for watch conflicts after resolution channel tuning call back.
	 * @param {Function} doNotTuneCallback - run this function if available when we do not tune
	 */
	function showConflictDialog(event, conflicts, type, callback, doNotTuneCallback) {
		log("showConflictDialog", "Enter");
		var options = getOptionsForConflictDialog(conflicts, type),
			dialog,
			dialogCallback,
			cancelRecordAttemptCallback;
		cancelRecordAttemptCallback = function () {
			log("cancelRecordAttemptCallback", "Enter");
			var attempted;
			if (type === PVRUtil.RECORD_CONFLICT) {
				attempted = conflicts.pop();
				PVRManager.cancelRecordingByTask(attempted);
			} else if (type === PVRUtil.RECORD_CONFLICT_WITH_RE_TUNE || type === PVRUtil.RECORD_CONFLICT_WITH_VOD_RE_TUNE || type === PVRUtil.WATCH_CONFLICT) {
				// WATCH_CONFLICT added here to fix NETUI-4275
				$N.app.AutoTuneHelper.tuneToChannel(conflicts[0].serviceId);
			}
			log("cancelRecordAttemptCallback", "Exit");
		};
		dialogCallback = function (key) {
			log("dialogCallback", "Enter");
			if (key) {
				dialogCallbackAction(key, event, conflicts, type, callback, doNotTuneCallback);
			} else {
				cancelRecordAttemptCallback();
				$N.apps.dialog.DialogManager.hideDialog(dialog);
			}
			log("dialogCallback", "Exit");
		};
		dialog = $N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_CONFLICT_RESOLUTION,
					$N.app.Conflicts.getString("cancelSpecificRecordingTitle"),
					$N.app.Conflicts.getString("cancelSpecificRecordingMessage"),
					options,
					dialogCallback,
					null,
					null,
					null,
					null,
					null,
					$N.gui.ConflictDialog,
					null,
					cancelRecordAttemptCallback,
					dialogShownCallback
			);
		$N.app.DialogueHelper.updateDialogueOptions($N.app.constants.DLG_CONFLICT_RESOLUTION, options);
		dialog.setExitCallback(cancelRecordAttemptCallback);
		log("showConflictDialog", "Exit");
	}

	/**
	 * @method isServiceInConflicts
	 * @private
	 * @param {String} serviceId
	 * @param {Array} conflicts
	 * @return {Boolean} isServiceInConflicts
	 */
	function isServiceInConflicts(serviceId, conflicts) {
		var conflictsLength = conflicts.length,
			i;
		for (i = 0; i < conflictsLength; i++) {
			if (serviceId === conflicts[i].serviceId) {
				return true;
			}
		}
		return false;
	}

	/**
	 * This method takes two tasks objects, joins them together and removes any duplicates
	 * @method getAllTasks
	 * @param {Object} tasksObj1
	 * @param {Object} tasksObj2
	 * @return {Object} Return all tasks together.
	 */
	function concatTasks(tasksObj1, tasksObj2) {
		log("concatTasks", "Enter + Exit");
		var allTasks = [];
		allTasks = tasksObj1.concat(tasksObj2);
		$N.app.ArrayUtil.sortAndRemoveDuplicates(allTasks, $N.app.SortUtil.compareTasks);
		return allTasks;
	}

	/**
	 * @method isVodPlaying
	 * @return {Boolean}
	 */
	function isVodPlaying() {
		log("isVodPlaying", "Enter + Exit");
		// TODO NETUI-2729: remove "faked.playback" check and first condition from here
		return ($N.app.Config.getConfigValue("faked.playback") === "true") ? ($N.app.StringUtil.isStringStartsWith($N.app.fullScreenPlayer.getSource(), "rtsp://") || ($N.app.fullScreenPlayer.getSource() === $N.app.Config.getConfigValue("faked.playback.serviceUri"))) : ($N.app.StringUtil.isStringStartsWith($N.app.fullScreenPlayer.getSource(), "rtsp://"));
	}

	/**
	 * @method isEventPlayingNow
	 * @param {Object} event
	 * @return {Boolean}
	 */
	function isEventPlayingNow(event) {
		log("isEventPlayingNow", "Enter + Exit");
		var ON_NOW_BUFFER = 1.5 * $N.app.constants.MINUTE_IN_MS;
		return (((event.startTime - ON_NOW_BUFFER) <= Date.now()) && ((event.endTime + ON_NOW_BUFFER) >= Date.now()));
	}

	/**
	 * Get the current event based on a task;
	 * @method getConflictEventByTask
	 * @return {Object} Event
	 */
	function getConflictEventByTask(task) {
		log("getConflictEventByTask", "Enter + Exit");
		var event;
		if (!task.eventId && task.serviceId) {
			// Manual recording
			event = $N.platform.btv.EPG.getCurrentEventForService(task.serviceId);
		} else {
			// Event based recording
			event = $N.platform.btv.EPG.getEventById(task.eventId);
		}
		return event;
	}

	/**
	 * The callback that is invoked if there are conflicts that need to be resolved
	 * @method recordingRequestConflictsCallback
	 * @param {array} failingTasks An array of task objects that are causing a conflict.
	 * @param {array} conflictingTasks An array of task objects that are conflicting with the failing tasks
	 * @param {Function} setRecordingConflictsCallback
	 */
	function recordingRequestConflictsCallback(failingTasks, conflictingTasks, setRecordingConflictsCallback) {
		log("recordingRequestConflictsCallback", "Enter");
		var event = getConflictEventByTask(failingTasks[0]),
			currentServiceId,
			conflictType = PVRUtil.RECORD_CONFLICT,
			allTasks = concatTasks(conflictingTasks, failingTasks);
		if (isVodPlaying()) {
			conflictType = PVRUtil.RECORD_CONFLICT_WITH_VOD_RE_TUNE;
		} else if (isEventPlayingNow(event)) {
			currentServiceId = $N.apps.core.ContextManager.getDefaultContext().getController().getCurrentServiceId();
			if (!isServiceInConflicts(currentServiceId, allTasks)) {
				conflictType = PVRUtil.RECORD_CONFLICT_WITH_RE_TUNE;
			}
		}
		allTasks = allTasks.filter(function (task) {
			if (task.title === $N.app.constants.FACEBOOK_FEATURE_AVAILABILITY_SCHEDULER_TITLE) {
				$N.app.SocialActivityFactory.getSocialAccountObject($N.app.SocialAccount.FACEBOOK).facebookFeatureAvailabilityCallback();
				return false;
			} else if (task.title === $N.app.constants.APPLICATION_LAUNCH_CONFIG_FETCH_SCHEDULER_TITLE) {
				$N.app.ApplicationLauncher.initialiseApplicationChannelMapping();
				return false;
			}
			return true;
		});
		$N.app.Conflicts.showConflictDialog(
			event,
			allTasks,
			conflictType,
			setRecordingConflictsCallback
		);
		log("recordingRequestConflictsCallback", "Exit");
	}

	/**
	 * @function isConflictError
	 * @param {Object} error - error code from player
	 * @return {Boolean} is a conflict
	 */
	function isConflictError(error) {
		var contentStartFailedReason = $N.app.constants.CA_PLAY_ERRORS.contentStartFailedReason;

		if (error && error.contentStartFailedInfo) {
			switch (error.contentStartFailedInfo.reason) {
			case contentStartFailedReason.LACK_OF_RESOURCES:
			case contentStartFailedReason.CONFLICT:
				return true;
			}
		}
		return false;
	}

	/* PUBLIC METHODS */
	return {
		/**
		 * Initialise method called upon booting STB
		 * @method initialise
		 */
		initialise: function () {
			$N.apps.core.Language.adornWithGetString($N.app.Conflicts);
		},

		/**
		 * Set the callback for when the Dialog is displayed
		 * @method setDialogShownCallback
		 * @param (function) callback
		 */
		setDialogShownCallback: function (callback) {
			log("setDialogShownCallback", "Enter");
			if (callback) {
				dialogShownCallback = callback;
			} else {
				dialogShownCallback = function () {};
			}
			log("setDialogShownCallback", "Exit");
		},

		/**
		 * Called when a recording fails to schedule
		 * @method onRecordingFailed
		 * @param {array} conflicted an array of Task Objects that overlapping and are going to fail.
		 * @param {array} conflicts an array of Task Object that are in causing a conflict.
		 */
		onRecordingFailed: function (conflicted, conflicts) {
			log("onRecordingFailed", "Enter");
			$N.apps.core.ContextManager.dismissPreview();
			$N.app.Conflicts.recordingRequestConflictsCallback(conflicted, conflicts, function () {});
			log("onRecordingFailed", "Exit");
		},

		recordingRequestConflictsCallback: recordingRequestConflictsCallback,
		showConflictDialog: showConflictDialog,
		isConflictError: isConflictError
	};

}());
