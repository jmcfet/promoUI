/**
 * Active RecordIcon deals with showing an animated record icon for active recordings ONLY.
 * It overrides functionality from RecordIcon.
 *
 * @class $N.gui.ActiveRecordIcon
 * @constructor
 * @extends $N.gui.RecordIcon
 * @author aprice
 * @requires $N.gui.RecordIcon
 * @requires $N.gui.Util
 * @requires $N.app.PVRUtil
 * @param {Object} docRef DOM document
 * @param {Object} parent
 */

(function ($N) {

	function ActiveRecordIcon(docRef, parent) {
		ActiveRecordIcon.superConstructor.call(this, docRef, parent);
	}

	$N.gui.Util.extend(ActiveRecordIcon, $N.gui.RecordIcon);

	/**
	 * Updates the record icon to the relevant state
	 * @method update
	 * @param {String} eventId
	 * @param {Number} xCoordinate - (optional) value for setting xCoordinate position of record icon
	 * @param {Number} recordingStatus - (optional)
	 */
	ActiveRecordIcon.prototype.update = function (eventId, xCoordinate, recordingStatus) {
		var isFailed = $N.app.PVRUtil.isTaskFailedByEventId(eventId),
			isAuthorized = $N.app.PVRUtil.isTaskAuthorizedByEventId(eventId);
		recordingStatus = recordingStatus || $N.platform.btv.PVRManager.getEventRecordingStatus(eventId);
		this._updateIcon(recordingStatus, xCoordinate, isAuthorized, isFailed);
	};

	/**
	 * Updates the record icon to the relevant state
	 * @method updateByTask
	 * @private
	 * @param {Object} task
	 * @param {Number} xCoordinate - (optional) value for setting xCoordinate position of record icon
	 * @param {Number} recordingStatus - (optional)
	 */
	ActiveRecordIcon.prototype.updateByTask = function (task, xCoordinate, recordingStatus) {
		var isAuthorized = $N.platform.btv.PVRManager.getTaskAuthorizationStatus(task);
		recordingStatus = recordingStatus || $N.platform.btv.PVRManager.getTaskRecordingStatus(task);
		this._updateIcon(recordingStatus, xCoordinate, isAuthorized, true);
	};

	/**
	 * Updates the record icon for a folder to the relevant state
	 * @method updateFolder
	 * @param {String} uiFolder - Folder name
	 * @param {Number} xCoordinate - (optional) value for setting xCoordinate position of record icon
	 * @param {Number} recordingStatus - (optional)
	 */
	ActiveRecordIcon.prototype.updateFolder = function (uiFolder, xCoordinate, recordingStatus) {
		var activeRecordings = $N.app.FolderUtil.getActiveRecordingsByFolderName(uiFolder),
			isAuthorized = false;
		if (activeRecordings.length) {
			recordingStatus = (activeRecordings.length) ? $N.platform.btv.PVRManager.getTaskRecordingStatus(activeRecordings[0]) : null;
			isAuthorized = $N.platform.btv.PVRManager.getTaskAuthorizationStatus(activeRecordings[0]);
		}

		this._updateIcon(recordingStatus, xCoordinate, isAuthorized, true);
	};

	/**
	 * Updates the record icon to the relevant state
	 * @method _updateIcon
	 * @param {Number} recordingStatus
	 * @param {Number} xCoordinate
	 * @param {Boolean} isAuthorized
	 * @param {Boolean} isFailed
	 */
	ActiveRecordIcon.prototype._updateIcon = function (recordingStatus, xCoordinate, isAuthorized, isFailed) {
		this._recordingStatus = recordingStatus;
		$N.app.TimerUtil.removeItem(this, this._RECORD_ICON_STRING);
		if (xCoordinate) {
			this.setX(xCoordinate);
		}
		switch (recordingStatus) {
		case $N.app.PVRUtil.ACTIVE:
		case $N.app.PVRUtil.ACTIVE_IN_SERIES:
			this._recordIcon.setHref(this._hrefObj[recordingStatus]);
			this.startAnim();
			this._recordIcon.show();
			this.show();
			break;
		case $N.app.PVRUtil.PARTIAL:
			this.hide();
			break;
		default:
			this.hide();
		}
	};

	$N.gui = $N.gui || {};
	$N.gui.ActiveRecordIcon = ActiveRecordIcon;

}($N || {}));
