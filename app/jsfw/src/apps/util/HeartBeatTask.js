/**
 * Class representing a task that could be run by a timer.
 * This class is used by `$N.apps.util.HeartBeat` to create tasks.
 * Tasks could run just once or could run at
 * regular intervals. Each new HeartBeatTask instance is
 * identified by a name.
 *
 * @class $N.apps.util.HeartBeatTask
 * @author Prabhu Subramanian
 *
 * @constructor
 * @param {String} name Name to be assigned to the task instance. Should be unique.
 * @param {Object} funcToCall Function to call at the specified time/interval.
 * @param {Number} timeout Timeout in milliseconds for a run-once task.
 * @param {Number} repeatInterval (milliseconds) How often this timer should be repeated.
 * @return {Object } Null if name and funcToCall parameters are invalid or omitted.
 */

define('jsfw/apps/util/HeartBeatTask',
    [],
	function () {
		var HeartBeatTask = function (name, funcToCall, timeout, repeatInterval) {

			// Validate the parameters.
		    if (!this._validate(name, funcToCall)) {
		        return null;
		    }

			// Attributes of a timer task.
		    this.name = name;
		    this.funcToCall = funcToCall;
		    this.timeout = 0;
		    this.repeatInterval = null;
		    this.repeatable = false;

		    if (repeatInterval && !isNaN(parseInt(repeatInterval, 10))) {
		        this.repeatInterval = parseInt(repeatInterval, 10);
		        this.repeatable = true;
		    }

		    if (timeout && !isNaN(parseInt(timeout, 10))) {
		        this.timeout = parseInt(timeout, 10);
		    }
		    // JavaScript task object returned after setTimeout or setInterval call.
		    this._jsTask = this.start();
		};

		/**
		 * Starts a HeartBeat task.
		 * Calls `setInterval` or `setTimeout` based on the repeatInterval.
		 * @method start
		 * @return {Object} HeartBeat task object returned after `setTimeout` or
		 * `setInterval` has been applied to the task.
		 */
		HeartBeatTask.prototype.start = function () {
			// Validate the parameters before doing anything.
		    if (!this._validate(this.name, this.funcToCall)) {
		        return null;
		    }

			// Check and set the timeout value.
		    if (!this.timeout) {
		        this.timeout = 0;
		    }

		    if (!this.repeatable) {
		        this._jsTask = setTimeout(this.funcToCall, this.timeout);
		    } else {
		        this._jsTask = setInterval(this.funcToCall, this.repeatInterval);
		    }

		    return this._jsTask;
		};

		/**
		 * Function to validate parameters used to create a new task.
		 * @method _validate
		 * @private
		 *
		 * @param {String} name Name of the new task.
		 * @param {Object} funcToCall Function to be called at the specified time/interval.
		 *
		 * @return {Boolean} True if the validation succeeds; false otherwise.
		 */
		HeartBeatTask.prototype._validate = function (name, funcToCall) {
			// Check all mandatory parameters.
		    if (name && funcToCall) {
		        return true;
		    }
			return false;
		};

		/**
		 * Function to stop and remove a task.
		 * @method erase
		 * @return {Boolean} True if the task was found and the
		 * timeout/interval was successfully removed from the task;
		 * false otherwise.
		 */
		HeartBeatTask.prototype.erase = function () {
			// Validate the parameters before doing anything.
		    if (!this._validate(this.name, this.funcToCall) || !this._jsTask) {
		        return false;
		    }

			// Find if this is a repeatable task or not and remove accordingly.
		    if (!this.repeatable) {
		        clearTimeout(this._jsTask);
		    } else {
		        clearInterval(this._jsTask);
		    }
		    return true;
		};

		window.$N = $N || {}
		$N.apps = $N.apps || {};
		$N.apps.util = $N.apps.util || {};
		$N.apps.util.HeartBeatTask = HeartBeatTask;
		return HeartBeatTask;
	}
);

