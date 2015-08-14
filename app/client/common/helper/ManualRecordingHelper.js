/**
 * Helper class for handling Manual recording
 * @Class $N.app.ManualRecordingHelper
 * @author kiran
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.platform.btv.PVRManager
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.ManualRecordingHelper = (function () {
		var log = new $N.apps.core.Log("Helper", "ManualRecordingHelper"),
			PVRManager = $N.platform.btv.PVRManager;

		/**
		* It helps in identifying the passed object is a Recording task or not.
		* @method isRecordingTask
		* @param {obj} Expecting a task object.
		* @return {Boolean} isObjectPVR
		*/
		function isRecordingTask(obj) {
			return ((obj.taskId || obj._data.taskId) && ((obj.taskType === 'REC') || (obj._data.taskType === 'REC')));
		}

		return {
			/**
			 *This method cancels the recording for the task.
			 * @method cancelManualRecording
			 * @param {Object} event
			 */
			cancelManualRecording: function (data) {
				var isTask = isRecordingTask(data),
					taskId = null,
					task = null;
				if (isTask) {
					taskId = data.taskId;
				} else {
					taskId = PVRManager.getActiveTaskIdForService(data.serviceId);
				}
				task = PVRManager.getTask(taskId, "taskType, objectState, scheduleType, jobId, taskId");
				if (task) {
					PVRManager.cancelRecordingByTask(task);
				}
			},

			/**
			* It helps in identifying the passed object is a Manual Recording task or not.
			* @method ismanualRecordingTask
			* @param {obj} Expecting a task object.
			* @return {Boolean} isObjectPVR
			*/
			isManualRecordingTask: function (obj) {
				return (isRecordingTask(obj) && (!obj.eventId) && obj.serviceId);
			}
		};
	}());

}($N || {}));