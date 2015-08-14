/**
 * PartialRecordIcon provides the controls the display of the partial recording icon
 *
 * @class $N.gui.PartialRecordIcon
 * @constructor
 * @extends $N.gui.ActiveRecordIcon
 * @author dPatrick
 * @requires $N.apps.core.Log
 * @requires $N.gui.Image
 * @requires $N.platform.system.Preferences
 * @requires $N.app.PVRUtil
 * @requires $N.platform.btv.PVRManager
 * @requires $N.app.constants
 * @param {Object} docRef DOM document
 * @param {Object} [parent]
 */
(function ($N) {

	function PartialRecordIcon(docRef, parent) {
		PartialRecordIcon.superConstructor.call(this, docRef, parent);
		this._log = new $N.apps.core.Log("CommonGUI", "PartialRecordIcon");
		this._PARTIAL_ICON_WIDTH = 114;
		this._PARTIAL_ICON_HEIGHT = 27;
		this._PARTIAL_ICON_BASE_URL = "../../../customise/resources/images/%RES/icons/DVR_label_partial_%LANG%AUTH.png";

		this._recordIcon.configure({
			href: "",
			x: 0,
			y: 0,
			width: this._PARTIAL_ICON_WIDTH,
			height: this._PARTIAL_ICON_HEIGHT,
			quality: 1,
			visible: false
		});
	}

	$N.gui.Util.extend(PartialRecordIcon, $N.gui.ActiveRecordIcon);

	/**
	 * @method _getIconHref
	 * @param {Boolean} isAuthorized
	 * @returns {String}
	 */
	PartialRecordIcon.prototype._getIconHref = function (isAuthorized) {
		var language = $N.platform.system.Preferences.get($N.app.constants.PREF_LANGUAGE),
			authorizedPostfix = (isAuthorized === true) ? "" : "_grey",
			iconUrl;
		iconUrl = this._PARTIAL_ICON_BASE_URL.replace("%LANG", language);
		iconUrl = iconUrl.replace("%AUTH", authorizedPostfix);
		return iconUrl;
	};

	/**
	 * Updates the partial record icon to the relevant state
	 * @method _updateIcon
	 * @param {Number} recordingStatus - (optional)
	 * @param {Number} xCoordinate - (optional) value for setting xCoordinate position of record icon
	 * @param {Boolean} isAuthorized - (optional)
	 * @param {Boolean} isFailed - (optional)
	 */
	PartialRecordIcon.prototype._updateIcon = function (recordingStatus, xCoordinate, isAuthorized, isFailed) {
		if (xCoordinate) {
			this.setX(xCoordinate);
		}
		if (recordingStatus === $N.app.PVRUtil.PARTIAL && isFailed) {
			this._recordIcon.configure({
				href: this._getIconHref(isAuthorized)
			});
			this._recordIcon.show();
		} else {
			this._recordIcon.hide();
		}
	};

	$N.gui = $N.gui || {};
	$N.gui.PartialRecordIcon = PartialRecordIcon;

}($N || {}));