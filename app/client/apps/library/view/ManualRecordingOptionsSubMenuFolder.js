/**
 * ManualRecordingOptionsSubMenuFolder is an extension of LibraryOptionsSubMenuFolder containing additional
 * functionality to support menu item selection and success callback
 *
 * @class $N.gui.ManualRecordingOptionsSubMenuFolder
 * @constructor
 * @extends $N.gui.LibraryOptionsSubMenuFolder
 * @param {Object} docRef
 * @param {Object} parent
 * @author Manju
 */
(function ($N) {

	function ManualRecordingOptionsSubMenuFolder(docRef, parent) {
		ManualRecordingOptionsSubMenuFolder.superConstructor.call(this, docRef, parent);
		this._log = new $N.apps.core.Log("CommonGUI", "ManualRecordingOptionsSubMenuFolder");
		this._optionsController = null;
		this._parentItem = null;
		this._menuItem = null;
		this._successCallback = function () {};
	}

	$N.gui.Util.extend(ManualRecordingOptionsSubMenuFolder, $N.gui.LibraryOptionsSubMenuFolder);

	ManualRecordingOptionsSubMenuFolder.prototype._itemSelected = function (data) {
		var listData = this._menu.getData(),
			i;
		if (data.selected) {//if the data is already selected then exit from second sub-menu to to first sub - menu.
			this._exitCallback();
			return;
		}
		for (i = 0; i < listData.length; i++) {
			listData[i].selected = false;
		}
		data.selected = true;
		this._menu.displayData();
		this._parentItem.setFirstSubTitle(data.title);
		this._menuItem.subtitle = data.title;
		this._successCallback(data);
		this._exitCallback();
	};
	ManualRecordingOptionsSubMenuFolder.prototype.beforeShowKeypad = function () {
		this._optionsController._background.hide();
		this._optionsController._menu.hide();
		this._optionsController._okIcon.hide();
		this._optionsController._okText.hide();
		this._optionsController._upArrow.setHref("");
		this._optionsController._downArrow.setHref("");
		this._optionsController._legend.setWidth(660);
	};
	$N.gui.ManualRecordingOptionsSubMenuFolder = ManualRecordingOptionsSubMenuFolder;
}(window.parent.$N || {}));
