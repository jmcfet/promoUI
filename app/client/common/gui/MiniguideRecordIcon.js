/**
 * MiniguideRecordIcon deals with showing a record icon. It can either be in a state of
 * hidden, showing or animating. It extends RecordIcon.
 *
 * @class $N.gui.MiniguideRecordIcon
 * @constructor
 * @extends $N.gui.RecordIcon
 * @requires $N.app.PVRUtil
 * @requires $N.gui.Util
 * @author kiran
 * @param {Object} docRef DOM document
 * @param {Object} [parent]
 */

(function ($N) {

	function MiniguideRecordIcon(docRef, parent) {
		MiniguideRecordIcon.superConstructor.call(this, docRef, parent);
		this._log = new $N.apps.core.Log("CommonGUI", "RecordIcon");
	}

	$N.gui.Util.extend(MiniguideRecordIcon, $N.gui.RecordIcon);

	/**
	 * Updates the icon to the relevant state
	 * @method update
	 * @param {Object} event
	 * @param {Number} xCoordinate - (optional) value for setting xCoordinate position of record icon
	 * @param {Number} recordingStatus - (optional)
	 */
	MiniguideRecordIcon.prototype.update = function (event, xCoordinate, recordingStatus) {
		$N.app.TimerUtil.removeItem(this, this._RECORD_ICON_STRING);
		this._recordingStatus = recordingStatus || $N.platform.btv.PVRManager.getRecordingStatusByEvent(event);
		if (xCoordinate) {
			this.setX(xCoordinate);
		}
		switch (this._recordingStatus) {
		case $N.app.PVRUtil.SCHEDULED:
		case $N.app.PVRUtil.SCHEDULED_BY_SERIES:
			this._recordIcon.setHref(this._hrefObj[this._recordingStatus]);
			this._recordIcon.show();
			this.show();
			return;
		case $N.app.PVRUtil.ACTIVE:
		case $N.app.PVRUtil.ACTIVE_IN_SERIES:
			this._recordIcon.setHref(this._hrefObj[this._recordingStatus]);
			this.startAnim();
			this._recordIcon.show();
			this.show();
			return;
		}
		if ($N.app.EventUtil.isEventShowingNow(event) && $N.app.PVRUtil.isManualRecordingSet(event)) {
			this._recordingStatus = recordingStatus || $N.platform.btv.PVRManager.getServiceRecordingStatus(event.serviceId);
			switch (this._recordingStatus) {
			case $N.app.PVRUtil.ACTIVE:
			case $N.app.PVRUtil.ACTIVE_IN_SERIES:
				this._recordIcon.setHref(this._hrefObj[this._recordingStatus]);
				this.startAnim();
				this._recordIcon.show();
				this.show();
				return;
			}
		}
		this.hide();
		return;
	};

	$N.gui = $N.gui || {};
	$N.gui.MiniguideRecordIcon = MiniguideRecordIcon;

}($N || {}));
