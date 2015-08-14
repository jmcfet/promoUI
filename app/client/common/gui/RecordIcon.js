/**
 * RecordIcon deals with showing a record icon. It can either be in a state of
 * hidden, showing or animating. The animation represents a current recording,
 * showing the record image without animation represents a scheduled recording and
 * not showing the RecordIcon represents a non-scheduled or completed recording.
 *
 * @class $N.gui.RecordIcon
 * @constructor
 * @extends $N.gui.GUIObject
 * @requires $N.apps.core.Log
 * @requires $N.gui.ClippedGroup
 * @requires $N.app.PVRUtil
 * @requires $N.gui.CachedImage
 * @requires $N.gui.Util
 * @param {Object} docRef DOM document
 * @param {Object} [parent]
 */

(function ($N) {

	function RecordIcon(docRef, parent) {

		RecordIcon.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "RecordIcon");

		this._hrefObj = {};
		this._hrefObj[$N.app.PVRUtil.ACTIVE] = "../../../customise/resources/images/%RES/icons/botao_gravar_red.png";
		this._hrefObj[$N.app.PVRUtil.SCHEDULED] = "../../../customise/resources/images/%RES/icons/botao_gravar_red.png";
		this._hrefObj[$N.app.PVRUtil.ACTIVE_IN_SERIES] = "../../../customise/resources/images/%RES/icons/botao_gravar_recorrente_red.png";
		this._hrefObj[$N.app.PVRUtil.SCHEDULED_BY_SERIES] = "../../../customise/resources/images/%RES/icons/botao_gravar_recorrente_red.png";
		this._recordIcon = new $N.gui.CachedImage(this._docRef);

		this._recordingStatus = $N.app.PVRUtil.UNSCHEDULED;
		this._BLINK_INTERVAL_TIME_MS = 500;
		this._RECORD_ICON_STRING = "recordIcon";

		this._recordIcon.configure({
			width: 37.5,
			height: 37.5,
			href: this._hrefObj[$N.app.PVRUtil.SCHEDULED],
			quality: 1
		});

		this._rootSVGRef = this._recordIcon.getRootSVGRef();

		if (parent) {
			parent.addChild(this);
		}
	}

	$N.gui.Util.extend(RecordIcon, $N.gui.GUIObject);

	/**
	 * Sets the X position of the record icon.
	 * @method setX
	 * @param {Number} xCoordinate
	 */
	RecordIcon.prototype.setX = function (xCoordinate) {
		this._recordIcon.setX(xCoordinate);
	};

	/**
	 * Sets the Y position of the record icon.
	 * @method setY
	 * @param {Number} yCoordinate
	 */
	RecordIcon.prototype.setY = function (yCoordinate) {
		this._recordIcon.setY(yCoordinate);
	};

	/**
	 * @method getCssClass
	 * @return {String} cssClass
	 */
	RecordIcon.prototype.getCssClass = function () {
		return this._recordIcon.getCssClass();
	};

	/**
	 * @method setCssClass
	 * @param {String} cssClass
	 */
	RecordIcon.prototype.setCssClass = function (cssClass) {
		this._recordIcon.setCssClass(cssClass);
	};

	/**
	 * Returns the true width of the record icon
	 * @method getTrueWidth
	 * @return {Number} the true width of the container
	 */
	RecordIcon.prototype.getTrueWidth = function () {
		return this._recordIcon.getTrueWidth();
	};

	/**
	 * Returns the width of the record icon
	 * @method getWidth
	 * @return {Number} the width of the container
	 */
	RecordIcon.prototype.getWidth = function () {
		return this._recordIcon.getWidth();
	};

	/**
	 * Is the record icon visible
	 * @method isVisible
	 */
	RecordIcon.prototype.isVisible = function () {
		return this._recordIcon.isVisible();
	};

	/**
	 * @method hide
	 */
	RecordIcon.prototype.hide = function () {
		$N.app.TimerUtil.removeItem(this, this._RECORD_ICON_STRING);
		this._recordIcon.hide();
		RecordIcon.superClass.hide.call(this);
	};

	/**
	 * @method blink
	 * @param {Boolean} isBlinkActive
	 */
	RecordIcon.prototype.blink = function (isBlinkActive) {
		if (isBlinkActive) {
			this._recordIcon._rootElement.style.visibility = "hidden";
		} else {
			this._recordIcon._rootElement.style.visibility = "visible";
		}
	};

	/**
	 * Resets the href of this icon to match any other icons currently animating
	 * @method resetHref
	 */
	RecordIcon.prototype.resetHref = function () {
		var items = $N.app.TimerUtil.getItems(this._RECORD_ICON_STRING),
			itemsLength = items.length,
			currentHref = null;
		if (items && itemsLength && items[itemsLength - 1] && items[itemsLength - 1]._recordIcon) {
			currentHref = items[itemsLength - 1]._recordIcon.getHref();
			if (currentHref === "") {
				this._recordIcon.setHref("");
			}
		}
	};

	/**
	 * Starts the animation of the active record icon
	 * @method startAnim
	 */
	RecordIcon.prototype.startAnim = function () {
		this.resetHref();
		$N.app.TimerUtil.addItem(this, this._RECORD_ICON_STRING);
		$N.app.TimerUtil.startTimer(this._BLINK_INTERVAL_TIME_MS, this._RECORD_ICON_STRING);
	};

	/**
	 * Updates the icon to the relevant state
	 * @method update
	 * @param {Object} event
	 * @param {Number} xCoordinate - (optional) value for setting xCoordinate position of record icon
	 * @param {Number} recordingStatus - (optional)
	 */
	RecordIcon.prototype.update = function (event, xCoordinate, recordingStatus) {
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
			break;
		case $N.app.PVRUtil.ACTIVE:
		case $N.app.PVRUtil.ACTIVE_IN_SERIES:
			this._recordIcon.setHref(this._hrefObj[this._recordingStatus]);
			this.startAnim();
			this._recordIcon.show();
			this.show();
			break;
		default:
			this.hide();
		}
		return;
	};

	/**
	 * @method getGUIObjectForUnitTests
	 */
	RecordIcon.prototype.getGUIObjectForUnitTests = function () {
		var me = this;
		return me;
	};

	$N.gui = $N.gui || {};
	$N.gui.RecordIcon = RecordIcon;

}($N || {}));
