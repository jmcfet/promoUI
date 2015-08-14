/**
 * @class $N.app.KeepUtil
 * @author hepton
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.KeepUtil = (function () {
		var log = new $N.apps.core.Log("Helper", "KeepUtil");

		return {

			/**
			* @method getKeepState
			* @param {Object} task
			* @return {String} keepState
			*/
			getKeepState: function (task) {
				var taskId = task.taskId,
					myTask = null;
				if (task && task.hasOwnProperty("keep")) {
					return task.keep;
				}
				myTask = $N.platform.btv.PVRManager.getTask(taskId, "keep");
				if (myTask && myTask._data && myTask._data.keep) {
					return myTask._data.keep;
				}
				return 0;
			},
			KEEP_UNTIL_MANUAL_DELETE: 1,
			KEEP_UNTIL_SPACE_NEEDED: 0

		};

	}());

}($N || {}));