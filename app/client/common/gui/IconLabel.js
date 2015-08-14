/**
 * IconLabel displays and hides a label and icon.
 *
 * @class $N.gui.IconLabel
 * @constructor
 * @extends $N.gui.GUIObject
 * @requires $N.gui.Group
 * @requires $N.gui.Image
 * @requires $N.gui.Label
 * @param {Object} docRef
 * @param {Object} [parent]
 */
(function ($N) {
	function IconLabel(docRef) {
		IconLabel.superConstructor.call(this, docRef);

		this._log = new $N.apps.core.Log("CommonGUI", "IconLabel");
		this._container = new $N.gui.Group(docRef);
		this._icon = new $N.gui.Image(this._docRef, this._container);
		this._labelText = new $N.gui.Label(this._docRef, this._container);

		this._blueIcon = "customise/resources/images/%RES/icons/Icn_colorBlue.png";
		this._greenIcon = "customise/resources/images/%RES/icons/Icn_colorGreen.png";
		this._redIcon = "customise/resources/images/%RES/icons/Icn_colorRed.png";
		this._yellowIcon = "customise/resources/images/%RES/icons/Icn_colorYellow.png";

		this._labelText.configure({
			visible: true,
			width: 200,
			x: 45,
			y: 25,
			cssClass: "description"
		});
		this._icon.setHref(this._blueIcon);
		this._icon.show();
		this._rootSVGRef = this._container.getRootSVGRef();
	}
	$N.gui.Util.extend(IconLabel, $N.gui.GUIObject);
	var proto = IconLabel.prototype;

	/**
	 * Shows and hides a label and some text
	 * @method setIconColor
	 * @param iconColor
	 */
	proto.setIconColor = function (iconColor) {
		this._log("setIconColor", "Enter");
		switch (iconColor) {
		case "blue":
			this._icon.setHref(this._blueIcon);
			break;
		case "red":
			this._icon.setHref(this._redIcon);
			break;
		case "yellow":
			this._icon.setHref(this._yellowIcon);
			break;
		case "green":
			this._icon.setHref(this._greenIcon);
			break;
		}
		this._log("setIconColor", "Exit");
	};

	/**
	 * Gets the label text
	 * @method getLabelText
	 */
	proto.getLabelText = function () {
		return this._labelText.getText();
	};


	/**
	 * Sets the label text
	 * @method setLabelText
	 * @param labelValue
	 */
	proto.setLabelText = function (labelValue) {
		this._labelText.setText(labelValue);
	};

	/**
	 * sets the width of the control
	 * @method setWidth
	 * @param width
	 */
	proto.setWidth = function (width) {
		this._container.setWidth(width);
	};

	/**
	 * Shows the icon and a label
	 * @method show
	 */
	proto.show = function () {
		this._log("show", "Enter");
		this._container.show();
		this._log("show", "Exit");
	};

	/**
	 * Hide the icon and the label
	 *
	 * @method hide
	 */
	proto.hide = function () {
		this._log("hide", "Enter");
		this._container.hide();
		this._log("hide", "Exit");
	};

	$N.gui = $N.gui || {};
	$N.gui.IconLabel = IconLabel;

}($N || {}));

