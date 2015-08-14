/**
 * ReminderIcon deals with showing a reminder icon. It can either be in a state of
 * hidden or showing.
 *
 * @class $N.gui.ReminderIcon
 * @constructor
 * @extends $N.gui.GUIObject
 *
 * @requires $N.apps.core.Log
 * @requires $N.gui.ClippedGroup
 * @requires $N.gui.CachedImage
 * @requires $N.gui.Util
 *
 * @param {Object} docRef DOM document
 * @param {Object} parent
 */
(function ($N) {

	function ReminderIcon(docRef, parent) {
		ReminderIcon.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "ReminderIcon");
		this._ReminderIcon = new $N.gui.CachedImage(this._docRef);
		this._ReminderIcon.configure({
			width: 37.5,
			height: 37.5,
			href: "../../../customise/resources/images/%RES/icons/botao_lembrete.png",
			quality: 1,
			opacity: 1,
			preserveAspect: true,
			visible: false
		});
		this._rootSVGRef = this._ReminderIcon.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
		this._currentOpacity = 0;
	}

	$N.gui.Util.extend(ReminderIcon, $N.gui.GUIObject);

	/**
	 * Returns the true width of the reminder icon
	 * @method getTrueWidth
	 * @return {Number} the true width of the container
	 */
	ReminderIcon.prototype.getTrueWidth = function () {
		return this._ReminderIcon.getTrueWidth();
	};

	/**
	 * Sets the width for the reminder icon
	 * @param {Number} width
	 */
	ReminderIcon.prototype.setWidth = function (width) {
		this._ReminderIcon.setWidth(width);
	};

	/**
	 * Sets the height for the reminder icon
	 * @param {Number} height
	 */
	ReminderIcon.prototype.setHeight = function (height) {
		this._ReminderIcon.setHeight(height);
	};

	/**
	 * @method getCssClass
	 * @return {String} cssClass
	 */
	ReminderIcon.prototype.getCssClass = function () {
		return this._ReminderIcon.getCssClass();
	};

	/**
	 * @method setCssClass
	 * @param {String} cssClass
	 */
	ReminderIcon.prototype.setCssClass = function (cssClass) {
		this._ReminderIcon.setCssClass(cssClass);
	};

	/**
	 * Updates the reminder icon to the relevant state
	 * @method update
	 * @param {Object} event
	 * @param {Number} xCoordinate - (optional) value for setting xCoordinate position of reminder icon
	 */
	ReminderIcon.prototype.update = function (event, xCoordinate) {
		var isEventShowingNow = $N.app.EventUtil.isEventShowingNow;

		if (event && $N.platform.btv.Reminders.isReminderSetForEventId(event) && !isEventShowingNow(event)) {
			if (xCoordinate) {
				this.setX(xCoordinate);
			}
			this.show();
			this._ReminderIcon.show();
		} else {
			this.hide();
			this._ReminderIcon.hide();
		}
	};

	$N.gui = $N.gui || {};
	$N.gui.ReminderIcon = ReminderIcon;

}($N || {}));
