/**
 * FactoryResetBox is a GUI component containing a menu with one menu option: reset
 *
 * @class FactoryResetBox
 * @extends GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	function FactoryResetBox(docRef, parent) {
		FactoryResetBox.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "FactoryResetBox");
		$N.apps.core.Language.importLanguageBundleForObject(FactoryResetBox, null, "apps/firstInstall/common/", "LanguageBundle.js", null, window);

		this._exitCallback = null;
		this._messagePopup = null;
		this._blockKeys = false;
		this._container = new $N.gui.Group(this._docRef);
		this._background = new $N.gui.Container(this._docRef, this._container);
		this._reseter = new $N.gui.PageableList(this._docRef, this._container);
		this._legend = new $N.gui.Container(this._docRef, this._container);
		this._legendBack = new $N.gui.Label(this._docRef, this._legend);
		this._legendEnter = new $N.gui.Label(this._docRef, this._legend);
		this._legendBackArrow = new $N.gui.Image(this._docRef, this._legend);
		this._legendOkIcon = new $N.gui.Image(this._docRef, this._legend);

		this._container.configure({
			width: 1345.5,
			height: 576
		});
		this._background.configure({
			width: 660,
			height: 576,
			cssClass: "menuBackgroundDefocus"
		});
		this._reseter.configure({
			x: 0,
			y: 63,
			itemHeight: 80,
			visibleItemCount: 4,
			itemTemplate: "ListMenuItem",
			itemConfig: {
				titleConfig: {
					x: 23,
					y: 6
				}
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
		this._legendEnter.configure({
			x: 485,
			y: 17,
			cssClass: "legend"
		});
		this._legendBackArrow.configure({
			x: 28.5,
			y: 21,
			href: "../../../customise/resources/images/%RES/icons/left_arrow.png"
		});
		this._legendOkIcon.configure({
			x: 433,
			y: 17,
			href: "../../../customise/resources/images/%RES/icons/OK.png"
		});

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}

	}
	$N.gui.Util.extend(FactoryResetBox, $N.gui.GUIObject);

	/**
	 * @method focus
	*/
	FactoryResetBox.prototype.focus = function () {
		this._log("focus", "Enter");
		this._reseter.focus();
		this._background.setCssClass("menuBackgroundFocus");
		this._legendEnter.show();
		this._legendOkIcon.show();
		this._log("focus", "Exit");
	};

	/**
	 * @method _itemSelected
	 * @param {Object} data
	 */
	FactoryResetBox.prototype._itemSelected = function (data) {
		this._log("_itemSelected", "Enter");
		var me = this,
			CONTINUE_OPTION = 1,
			EXIT_OPTION = 2,
			dialogButtons = [{
				name: FactoryResetBox.getString("cancel"),
				action: EXIT_OPTION
			}, {
				name: FactoryResetBox.getString("cont"),
				action: CONTINUE_OPTION
			}],
			dialogCallback = function (key) {
				if (key.action === CONTINUE_OPTION) {
					this._blockKeys = true;
					if (me._messagePopup) {
						me._messagePopup.setBlockUI(true);
						me._messagePopup.setMessage(FactoryResetBox.getString("factoryResetMessage"));
					}
					$N.app.SystemUtil.doFactoryReset();
				} else {
					this._blockKeys = false;
				}
			};

		$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_FACTORY_RESET_CONFIRMATION,
				FactoryResetBox.getString("attention"),
				FactoryResetBox.getString("warningMessage"),
				dialogButtons,
				dialogCallback,
				null, // no option highlighted callback
				null, // default orientation
				null, // no title image
				null, // no dialog config object
				true  // show alert icon
				);

		this._log("_itemSelected", "Exit");
	};

	/**
	 * @method initialise
	 */
	FactoryResetBox.prototype.initialise = function () {
		this._log("initialise", "Enter");
		var me = this;
		this._reseter.setItemSelectedCallback(me._itemSelected);
		this._reseter.setDataMapper({
			getTitle: function (data) {
				return data.title;
			}
		});
		this._reseter.initialise();
		this._log("initialise", "Exit");
	};

	/**
	 * @method preview
	 */
	FactoryResetBox.prototype.preview = function (data) {
		this._log("preview", "Enter");
		this._reseter.setData(data);
		this._reseter.displayData(true, true);
		this._legend.hide();
		this.show();
		this._log("preview", "Exit");
	};

	/**
	 * @method activate
	 */
	FactoryResetBox.prototype.activate = function (data) {
		this._log("activate", "Enter");
		this._legendBack.setText(FactoryResetBox.getString("menuSettingsBack"));
		this._legendEnter.setText(FactoryResetBox.getString("select"));
		this.focus();
		this._legend.show();
		if (data) {
			this._reseter.setData(data);
			this._reseter.displayData();
		} else {
			this._reseter._getSelectedObject().highlight();
		}
		this.show();
		this._log("activate", "Exit");
	};

	/**
	 * @method passivate
	 */
	FactoryResetBox.prototype.passivate = function () {
		this._log("passivate", "Enter");
		this._legend.hide();
		this._reseter.defocus();
		this._background.setCssClass("menuBackgroundDefocus");
		this._log("passivate", "Exit");
	};

	/**
	 * @method setExitCallback
	 * @param {Object} callback
	 */
	FactoryResetBox.prototype.setExitCallback = function (callback) {
		this._log("setExitCallback", "Enter");
		this._exitCallback = callback;
		this._log("setExitCallback", "Exit");
	};

	/**
	 * @method setMessagePopup
	 * @param {Object} control
	 */
	FactoryResetBox.prototype.setMessagePopup = function (control) {
		this._log("setExitCallback", "Enter");
		this._messagePopup = control;
		this._log("setExitCallback", "Exit");
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	FactoryResetBox.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;

		if (this._blockKeys) {
			return true;
		}

		handled = this._reseter.keyHandler(key);
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

	$N.gui.FactoryResetBox = FactoryResetBox;
}($N || {}));
