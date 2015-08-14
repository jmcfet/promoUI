/**
 * @class N.gui.SettingsPanelView
 * @constructor
 * @extends N.gui.GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
//TODO: This class is incomplete. It is a partially complete conversion of SettingsPanel.xml into a GUI control
(function ($N) {
	var SettingsPanelView = function (docRef, parent) {
		SettingsPanelView.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "SettingsPanelView");

		this._group = new $N.gui.Group(this._docRef);
		this._settingsBGLines = new $N.gui.SVGlink(this._docRef, this._group);
		this._firstSubMenuList = new $N.gui.PageableListWithBackground(this._docRef, this._group);

		this._group.configure({
			id: "settingsPanelContent"
		});
		this._settingsBGLines.configure({
			id: "settingsBGLines",
			y: 55,
			href: "../../customise/resources/svg/icons.svg#settingsBGLines",
			visible: false
		});
		this._firstSubMenuList.configure({
			y: 95,
			itemTemplate: "MenuItemWithHighlight",
			itemHeight: 72,
			upDownPageable: true,
			itemConfig: {
				height: 60,
				width: 576
			},
			backgroundConfig: {
				height: 576,
				width: 661,
				y: -65
			}
		});

		this._rootSVGRef = this._group.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	};

	$N.gui.Util.extend(SettingsPanelView, $N.gui.GUIObject);

	$N.gui.SettingsPanelView = SettingsPanelView;
}($N || {}));
