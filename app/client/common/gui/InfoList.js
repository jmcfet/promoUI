/**
 * InfoList is a GUI component containing a pageable list of 2 columned item
 * which contains 2 separate labels
 *
 * @class $N.gui.InfoList
 * @constructor
 * @extends $N.gui.GUIObject
 * @requires $N.gui.Group
 * @requires $N.gui.Container
 * @requires $N.gui.PageableListWithArrows
 * @requires $N.gui.Label
 * @requires $N.gui.Image
 * @requires $N.gui.Util
 * @param {Object} docRef
 * @param {Object} [parent]
 */
var $N = $N || {};
(function ($N) {
	function InfoList(docRef, parent) {
		InfoList.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "InfoList");
		$N.apps.core.Language.importLanguageBundleForObject(InfoList, null, "apps/firstInstall/common/", "LanguageBundle.js", null, window);

		this._container = new $N.gui.Group(this._docRef);
		this._background = new $N.gui.Container(this._docRef, this._container);
		this._list = new $N.gui.PageableListWithArrows(this._docRef, this._container);
		this._legend = new $N.gui.Container(this._docRef, this._container);
		this._legendBack = new $N.gui.Label(this._docRef, this._legend);
		this._legendBackArrow = new $N.gui.Image(this._docRef, this._legend);
		this._WIDTH = 1345.5;

		this._container.configure({
			width: this._WIDTH,
			height: 576
		});
		this._background.configure({
			width: this._WIDTH,
			height: 576,
			cssClass: "menuBackgroundDefocus"
		});
		this._list.configure({
			x: 0,
			y: 41,
			itemHeight: 54,
			visibleItemCount: 10,
			itemTemplate: "SettingsSystemMenuItem",
			scrollType: "page",
			upArrowProperties: {
				x: 1295.5,
				y: -35,
				visible: false,
				href: "../../../customise/resources/images/icons/arrows/upArrowIcon.png"
			},
			downArrowProperties: {
				x: 1295.5,
				y: 490,
				visible: false,
				href: "../../../customise/resources/images/icons/arrows/downArrowIcon.png"
			}
		});
		this._legend.configure({
			x: 0,
			y: 600,
			width: 660,
			height: 72,
			cssClass: "menuBackgroundDefocus"
		});
		this._legendBack.configure({
			x: 61.5,
			y: 17,
			cssClass: "legend"
		});
		this._legendBackArrow.configure({
			x: 28.5,
			y: 21,
			href: "../../../customise/resources/images/%RES/icons/left_arrow.png"
		});
		this._exitCallback = null;

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	}
	$N.gui.Util.extend(InfoList, $N.gui.GUIObject);

	/**
	 * @method focus
	 */
	InfoList.prototype.focus = function () {
		this._log("focus", "Enter");
		this._list.focus();
		this._legend.setWidth(this._WIDTH);
		this._background.setCssClass("menuBackgroundFocus");
		this._log("focus", "Exit");
	};

	/**
	 * @method initialise
	 */
	InfoList.prototype.initialise = function () {
		this._log("initialise", "Enter");
		this._list.setDataMapper({
			getTitle: function (data) {
				return data.key;
			},
			getSubTitle: function (data) {
				return data.value;
			}
		});
		this._list.initialise();
		this._log("initialise", "Exit");
	};

	/**
	 * @method preview
	 * @param {Object} data
	 */
	InfoList.prototype.preview = function (data) {
		this._log("preview", "Enter");
		this._list.setData(data);
		this._list.displayData(true, true);
		this._legend.hide();
		this.show();
		this._log("preview", "Exit");
	};

	/**
	 * @method activate
	 * @param {Object} data
	 */
	InfoList.prototype.activate = function (data) {
		this._log("activate", "Enter");
		this.focus();
		this._legendBack.setText(InfoList.getString("menuSettingsBack"));
		this._legend.show();
		if (data) {
			this._list.setData(data);
			this._list.displayData();
		} else {
			this._list._getSelectedObject().highlight();
		}
		this.show();
		this._log("activate", "Exit");
	};

	/**
	 * @method passivate
	 */
	InfoList.prototype.passivate = function () {
		this._log("passivate", "Enter");
		this._list.defocus();
		this._legend.hide();
		this._background.setCssClass("menuBackgroundDefocus");
		this._log("passivate", "Exit");
	};

	/**
	 * @method setExitCallback
	 * @param {Object} callback
	 */
	InfoList.prototype.setExitCallback = function (callback) {
		this._log("setExitCallback", "Enter");
		this._exitCallback = callback;
		this._log("setExitCallback", "Exit");
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	InfoList.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;

		handled = this._list.keyHandler(key);
		if (!handled) {
			switch (key) {
			case keys.KEY_LEFT:
			case keys.KEY_BACK:
				handled = true;
				this.passivate();
				if (this._exitCallback) {
					this._exitCallback();
				}
				break;
			}
		}
		this._log("keyHandler", "Exit");
		return handled;
	};

	$N.gui = $N.gui || {};
	$N.gui.InfoList = InfoList;
}($N || {}));
