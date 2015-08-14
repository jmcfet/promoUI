/**
 * Abstraction class for timer related activities. Supports the creation
 * of new tasks that can be repeated at a regular interval or run just
 * once.
 *
 * @class $N.apps.util.HeartBeat
 * @requires $N.apps.util.HeartBeatTask
 * @author Prabhu Subramanian
 *
 * @constructor
 */

define('jsfw/apps/util/HeartBeat',
    [],
	function () {

		var HeartBeat = function () {
		    this._activeTasks = null;
		};

		/**
		 * Creates a task that is identified by a name. This task will run just once.
		 * @method createTask
		 * @param {String} name Name for this task. Should be unique.
		 * @param {Object} funcToCall Function to call as part of this timer.
		 * @param {Number} timeout Timeout in milliseconds.
		 *
		 * @return {Object} Instance of timer task. Null if the task cannot be created.
		 */
		HeartBeat.prototype.createTask = function (name, funcToCall, timeout) {
		    var _task = new $N.apps.util.HeartBeatTask(name, funcToCall, timeout, null);
		    this._addTaskToActiveList(name, _task);
		    return _task;
		};

		/**
		 * Creates a repeatable task that is identified by a name. This task will run more than once.
		 * @method createRepeatableTask
		 * @param {String} name Name for this task. Should be unique.
		 * @param {Object} funcToCall Function to call as part of this timer.
		 * @param {Number} repeatInterval How often this task should be repeated (milliseconds)
		 *
		 * @return {Object} Instance of timer task; null if the task cannot be created.
		 */
		HeartBeat.prototype.createRepeatableTask = function (name, funcToCall, repeatInterval) {
			if (repeatInterval && !isNaN(parseInt(repeatInterval, 10))) {
				var _task = new $N.apps.util.HeartBeatTask(name, funcToCall, null, repeatInterval);
				this._addTaskToActiveList(name, _task);
				return _task;
			}
			return null;
		};


		/**
		 * Creates a task that runs every minute.
		 * @method createMinutelyTask
		 * @param {String} name Name for this task. Should be unique.
		 * @param {Object} funcToCall Function to call as part of this timer.
		 *
		 * @return {Object} Instance of timer task; null if the task cannot be created.
		 */
		HeartBeat.prototype.createMinutelyTask = function (name, funcToCall) {
		    return this.createRepeatableTask(name, funcToCall, 60 * 1000);
		};

		/**
		 * Creates a hourly task.
		 * @method createHourlyTask
		 * @param {String} name Name for this task. Should be unique.
		 * @param {Object} funcToCall Function to call as part of this timer.
		 *
		 * @return {Object} Instance of timer task; null if the task cannot be created.
		 */
		HeartBeat.prototype.createHourlyTask = function (name, funcToCall) {
		    return this.createRepeatableTask(name, funcToCall, 60 * 60 * 1000);
		};

		/**
		 * Adds a task to the list of active tasks. It will replace any existing
		 * task with the same name.
		 * @method _addTaskToActiveList
		 * @private
		 *
		 * @param {String} name Name of the task to be added to the active list. Should be unique.
		 * @param {Object} task The task object to be added to the active tasks list.
		 */
		HeartBeat.prototype._addTaskToActiveList = function (name, task) {
			// Create a new dictionary object if needed.
		    if (!this._activeTasks) {
		        this._activeTasks = {};
		    }

			// Kill any existing task with the same name.
		    var _existingTask = this._activeTasks[name];
		    if (_existingTask) {
		        _existingTask.erase();
		        this._activeTasks[name] = null;
		    }
		    this._activeTasks[name] = task;
		};

		/**
		 * Gets a timer task object by name.
		 * @method getTask
		 * @param {String} name Name of the task to be retrieved. Should be unique.
		 *
		 * @return {Object} Timer task object; null if the task is not found.
		 */
		HeartBeat.prototype.getTask = function (name) {
		    if (this._activeTasks && name) {
		        return this._activeTasks[name];
		    }
		    return null;
		};

		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.util = $N.apps.util || {};
		$N.apps.util.HeartBeat = HeartBeat;
		return HeartBeat;
	}
);
