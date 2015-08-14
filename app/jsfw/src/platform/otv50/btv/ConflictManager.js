/**
 * A class used to query the Scheduler for conflicting tasks.
 * The public API allows the retrieval of tasks that conflict with a specific recording
 * or retrieval of tasks that are conflicting at a specific time.
 * Many of the public methods are asynchronous and require callbacks to be passed in.
 * These callbacks must accept an array of tasks. If the returned array is empty, then it
 * means that no conflicts were detected.
 * @class $N.platform.btv.ConflictManager
 *
 * @constructor
 * @param {Object} pvrManagerObj Handle to the {@link $N.platform.btv.PVRManager PVRManager} object.
 * @requires $N.platform.btv.PVRManager
 */
define('jsfw/platform/btv/ConflictManager',
	[
		'jsfw/apps/core/Log',
		'jsfw/platform/btv/PVRManager'
	],
	function (Log, PVRManager) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.btv = $N.platform.btv || {};

		$N.platform.btv.ConflictManager = function (pvrManagerObj) {

			var pvrManager = pvrManagerObj || $N.platform.btv.PVRManager,
				log = new $N.apps.core.Log("btv", "ConflictManager"),
				taskAllOptionsHandle,
				taskAllOptionsCallback = function () {},
				taskOverlapsHandle,
				taskOverlapsCallback = function () {},
				existingConflicts = [],
				taskIdOfUnscheduledTask = null,
				TASK_TYPE = {
					RECORDING: "REC",
					REMINDER: "RMDR",
					REVIEWBUFFER: "RBREC",
					LIVE: "LIVE"
				};

			function removeRemindersFromConflictOptions(event) {
				var i,
					j,
					addTaskOption = true,
					taskItemLookup = {},
					taskOptionItems = [],
					taskOptionsWithoutReminders = [];

				for (i = 0; i < event.allTaskIds.length; i++) {
					taskItemLookup[event.allTaskIds[i]] = event.allTaskTypes[i];
				}

				for (i = 0; i < event.taskOptions.length; i++) {
					taskOptionItems = event.taskOptions[i];
					for (j = 0; j < taskOptionItems.length; j++) {
						if (taskItemLookup[taskOptionItems[j]] === TASK_TYPE.REMINDER) {
							addTaskOption = false;
							break;
						}
					}
					if (addTaskOption) {
						taskOptionsWithoutReminders.push(event.taskOptions[i]);
					} else {
						addTaskOption = true;
					}
				}
				return taskOptionsWithoutReminders;
			}

			function taskAllOptionsListener(event) {
				var conflictingTasks = [],
					conflictingTask,
					i,
					j,
					taskOptionsWithoutReminders = [],
					taskOptionItems = [];

				if (event.handle === taskAllOptionsHandle && event.error === undefined && event.taskOptions) {
					taskOptionsWithoutReminders = removeRemindersFromConflictOptions(event);
					if (taskOptionsWithoutReminders.length > 1) {
						for (i = 0; i < event.allTaskIds.length; i++) {
							conflictingTask = pvrManager.getTask(event.allTaskIds[i]);
							if (conflictingTask && (event.allTaskTypes[i] === TASK_TYPE.RECORDING)) {
								conflictingTasks.push(conflictingTask);
							}
						}
						taskAllOptionsCallback(conflictingTasks);
					}
				}
			}

			function taskOverlapsListener(event) {
				var i,
					conflictingTask,
					conflictingTasks = [];
				if (event.handle === taskOverlapsHandle && event.error === undefined && event.taskOverlaps.length > 1) {
					for (i = 0; i < event.taskOverlaps.length; i++) {
						if (!existingConflicts[event.taskOverlaps[i].taskId] && event.taskOverlaps[i].taskId !== taskIdOfUnscheduledTask) {
							conflictingTask = pvrManager.getTask(event.taskOverlaps[i].taskId);
							if (conflictingTask) {
								conflictingTasks.push(conflictingTask);
								existingConflicts[event.taskOverlaps[i].taskId] = true;
							}
						}
					}
					taskOverlapsCallback(conflictingTasks);
				} else {
					taskOverlapsCallback([]);
				}
			}

			/* Public Interface */
			return {

				/**
				 * Registers the event listeners for the getTaskOverlaps events
				 * @method registerTaskOverlapsListeners
				 */
				registerTaskOverlapsListeners: function () {
					CCOM.Scheduler.addEventListener("getTaskOverlapsOK", taskOverlapsListener);
					CCOM.Scheduler.addEventListener("getTaskOverlapsFailed", taskOverlapsListener);
				},

				/**
				 * Registers the event listeners for the getTaskAllOptions events
				 * @method registerGetTaskAllOptionsListeners
				 */
				registerGetTaskAllOptionsListeners: function () {
					CCOM.Scheduler.addEventListener("getTaskAllOptionsOK", taskAllOptionsListener);
					CCOM.Scheduler.addEventListener("getTaskAllOptionsFailed", taskAllOptionsListener);
				},

				/**
				 * Unregisters the event listeners for the getTaskOverlaps events
				 * @method unRegisterTaskOverlapsListeners
				 */
				unRegisterTaskOverlapsListeners: function () {
					CCOM.Scheduler.removeEventListener("getTaskOverlapsOK", taskOverlapsListener, false);
					CCOM.Scheduler.removeEventListener("getTaskOverlapsFailed", taskOverlapsListener, false);
				},

				/**
				 * Unregisters the event listeners for the getTaskAllOptions events
				 * @method unRegisterGetTaskAllOptionsListeners
				 */
				unRegisterGetTaskAllOptionsListeners: function () {
					CCOM.Scheduler.removeEventListener("getTaskAllOptionsOK", taskAllOptionsListener, false);
					CCOM.Scheduler.removeEventListener("getTaskAllOptionsFailed", taskAllOptionsListener, false);
				},

				/**
				 * Identifies tasks that conflict with the given task id
				 * @method handleConflictsForRecording
				 * @async
				 * @param {Number} taskId id of the task that we're interested in
				 * @param {Function} callback function that will be invoked with a list of conflicting tasks
				 */
				handleConflictsForRecording: function (taskId, callback) {
					var me = this;
					existingConflicts = [];
					this.registerTaskOverlapsListeners();
					taskIdOfUnscheduledTask = taskId;
					taskOverlapsCallback = function (conflictingTasks) {
						me.unRegisterTaskOverlapsListeners();
						callback(conflictingTasks);
					};
					taskOverlapsHandle = CCOM.Scheduler.getTaskOverlaps(taskIdOfUnscheduledTask);
				},

				/**
				 * Identifies tasks that conflict with the supplied list of unscheduled tasks
				 * @method handleConflictsForTasks
				 * @async
				 * @param {Array} tasks list of unscheduled tasks
				 * @param {Function} callback function that will be invoked with an array of tasks
				 * that have a scheduling conflict
				 */
				handleConflictsForTasks: function (tasks, callback) {
					var i,
						cumulativeConflictingTasks = [],
						taskOverlapsCount = 0,
						me = this;
					existingConflicts = [];
					this.registerTaskOverlapsListeners();
					//TODO: Don't know why the following condition should be necessary but sometimes there is not a tasks[taskOverlapsCount]
					if (tasks && tasks[taskOverlapsCount] && tasks[taskOverlapsCount].taskId) {
						taskIdOfUnscheduledTask = tasks[taskOverlapsCount].taskId;
						taskOverlapsCallback = function (conflictingTasks) {
							taskOverlapsCount++;
							cumulativeConflictingTasks = cumulativeConflictingTasks.concat(conflictingTasks);
							if (taskOverlapsCount === tasks.length) {
								taskOverlapsCount = 0;
								me.unRegisterTaskOverlapsListeners();
								callback(cumulativeConflictingTasks);
							} else {
								taskIdOfUnscheduledTask = tasks[taskOverlapsCount].taskId;
								taskOverlapsHandle = CCOM.Scheduler.getTaskOverlaps(taskIdOfUnscheduledTask);
							}
						};
						taskOverlapsHandle = CCOM.Scheduler.getTaskOverlaps(taskIdOfUnscheduledTask);
					}
				},

				/**
				 * Given a job id, determines which existing tasks conflict with it.
				 * @method handleConflictsForRepeatRecording
				 * @async
				 * @param {Number} jobId id of the job that we're interested in
				 * @param {Function} callback function that will be invoked with a list of conflicting tasks
				 */
				handleConflictsForRepeatRecording: function (jobId, callback) {
					var tasks = pvrManager.getTasksForJobId(jobId);
					this.handleConflictsForTasks(tasks, callback);
				},

				/**
				 * Identifies the tasks that conflict with the supplied time.
				 * @method handleConflictsForTime
				 * @async
				 * @param {Number} time in milliseconds
				 * @param {Function} callback function that will be invoked with a list of conflicting tasks
				 */

				handleConflictsForTime: function (time, callback) {
					log("handleConflictsForTime", "Enter - time: " + time);
					var me = this;
					this.registerGetTaskAllOptionsListeners();
					taskAllOptionsCallback = function (conflictingTasks) {
						me.unRegisterGetTaskAllOptionsListeners();
						callback(conflictingTasks);
					};
					taskAllOptionsHandle = CCOM.Scheduler.getTaskAllOptions(time, [], []);
				},

				/**
				 * Checks if the task for the given taskId will not fully record due to conflicts.
				 * Calls the callback with a false value if not or a true value if it will fully record.
				 * The UI should wait for the callback before using this function again.
				 * @method isTaskConflicting
				 * @async
				 * @param {Number} taskId id of the task we're interested in
				 * @param {Function} callback function that will be invoked with a true or false value
				 */
				isTaskConflicting: function (taskId, callback) {
					var me = this,
						taskOverlapsOptionsHandle,
						isConflicting = false,
						checkIfConflictingCallback = function (event) {
							CCOM.Scheduler.removeEventListener("getTaskOverlapsOptionsOK", checkIfConflictingCallback, false);
							CCOM.Scheduler.removeEventListener("getTaskOverlapsOptionsFailed", checkIfConflictingCallback, false);
							if (event.handle === taskOverlapsOptionsHandle && event.error === undefined) {
								if (event.taskOptions.length > 1) {
									isConflicting = true;
								}
							}
							callback(isConflicting);
						};
					if (!pvrManager.isTaskScheduled(taskId)) {
						callback(false);
					} else {
						CCOM.Scheduler.addEventListener("getTaskOverlapsOptionsOK", checkIfConflictingCallback);
						CCOM.Scheduler.addEventListener("getTaskOverlapsOptionsFailed", checkIfConflictingCallback);
						taskOverlapsOptionsHandle = CCOM.Scheduler.getTaskOverlapsOptions(taskId, false, false);
					}
				}

			};
		};
		return $N.platform.btv.ConflictManager;
	}
);
