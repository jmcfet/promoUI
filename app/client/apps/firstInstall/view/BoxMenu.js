/**
 * BoxMenu is a GUI component containing a menu, submenu and legend
 * The full data for all menus and submenus is passed to this class which forwards it to
 * the appropriate components
 *
 * @class BoxMenu
 * @extends GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	function BoxMenu(docRef, parent) {
		BoxMenu.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "BoxMenu");
		$N.apps.core.Language.importLanguageBundleForObject(BoxMenu, null, "apps/firstInstall/common/", "LanguageBundle.js", null, window);

		this._container = new $N.gui.Group(this._docRef);
		this._background = new $N.gui.Container(this._docRef, this._container);
		this._channelInstaller = new $N.gui.PageableListWithArrows(this._docRef, this._container);
		this._subMenuContainer = new $N.gui.Container(this._docRef, this._container);
		this._legend = new $N.gui.Container(this._docRef, this._container);
		this._legendBack = new $N.gui.Label(this._docRef, this._legend);
		this._legendBackArrow = new $N.gui.Image(this._docRef, this._legend);
		this._legendOkIcon = new $N.gui.Image(this._docRef, this._legend);
		this._legendEnter = new $N.gui.Label(this._docRef, this._legend);
		this._legendGreenIcon = new $N.gui.Image(this._docRef, this._legend);
		this._legendScan = new $N.gui.Label(this._docRef, this._legend);
		this._keypad = new $N.gui.BaseKeypad(this._docRef);
		this._selectionPad = new $N.gui.SelectionList(this._docRef, this._container);
		this._signalBox = new $N.gui.SignalBox(this._docRef, this._subMenuContainer);
		this._channelScanBox = new $N.gui.ChannelScanBox(this._docRef);

		this._container.configure({
			width: 1345.5,
			height: 576
		});
		this._background.configure({
			width: 660,
			height: 576,
			cssClass: "menuBackgroundDefocus"
		});
		this._selectionPad.configure({
			x: 0,
			y: 90,
			itemHeight: 70,
			visibleItemCount: 4,
			itemTemplate: "BoxMenuItemWithIcon"
		});
		this._channelInstaller.configure({
			x: 0,
			y: 63,
			itemHeight: 120,
			visibleItemCount: 4,
			itemTemplate: "BoxMenuItem",
			upArrowProperties: {
				x: 610,
				y: -40,
				visible: false
			},
			downArrowProperties: {
				x: 610,
				y: 480,
				visible: false
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
			y: 14,
			cssClass: "legend"
		});
		this._legendBackArrow.configure({
			x: 28.5,
			y: 21,
			href: "../../../customise/resources/images/%RES/icons/left_arrow.png"
		});
		this._legendOkIcon.configure({
			x: 453,
			y: 17,
			href: "../../../customise/resources/images/%RES/icons/OK.png"
		});
		this._legendEnter.configure({
			x: 505,
			y: 14,
			cssClass: "legend"
		});
		this._legendGreenIcon.configure({
			x: 670,
			y: 17,
			href: "../../../customise/resources/images/%RES/icons/botao_verde.png"
		});
		this._legendScan.configure({
			x: 722,
			y: 14,
			cssClass: "legend"
		});
		this._subMenuContainer.configure({
			x: 685.5,
			y: 0
		});

		this.subMenuActive = false;
		this._exitCallback = null;
		this._menu = null;
		this._subMenu = null;
		this._selectedIndex = 0;
		this._isChannelScanSuccessful = false;
		this._scanConfig = null;
		this._MIN_NETWORK_ID = 1;
		this._MAX_NETWORK_ID = 65535;
		this._MIN_FREQUENCY = 5000;
		this._MAX_FREQUENCY = 862000;
		this._MIN_SYMBOL_RATE = 1000;
		this._MAX_SYMBOL_RATE = 9000;

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}

		this.restoreLegend = function () {
			this.subMenuActive = false;
			this._legendBackArrow.setX(28.5);
			this._legendBack.setX(61.5);
			this._legendOkIcon.show();
			this._legendEnter.show();
			this._legendGreenIcon.show();
			this._legendScan.show();
		};

		this.showKeypad = function (config, itemTitle) {
			this._keypad.resetKeyPadConfig();
			$N.app.KeyboardUtils.setKeypad(this._keypad, $N.app.KeyboardType.NUMERIC);
			this._keypad.configure({
				titleY: 33,
				keypadTitle: config.title,
				exitCallback: config.exitCallback,
				textInputAlignment: $N.app.KeyboardType.ALIGNMENT.CENTRE
			});
			$N.app.KeyboardUtils.setKeypadReturnObject(config.returnObject);
			$N.app.KeyboardUtils.setSaveCallback(config.saveCallback);
			this._keypad.clearInput();
			switch (itemTitle) {
			case "networkId":
				this._keypad.setInputFormat(5, 0, "");
				this._keypad.setMinNumericKeypadValue(this._MIN_NETWORK_ID);
				this._keypad.setMaxNumericKeypadValue(this._MAX_NETWORK_ID);
				break;
			case "frequency":
				this._keypad.setInputFormat(6, 0, "");
				this._keypad.setMinNumericKeypadValue(this._MIN_FREQUENCY);
				this._keypad.setMaxNumericKeypadValue(this._MAX_FREQUENCY);
				break;
			case "symbolRate":
				this._keypad.setInputFormat(4, 0, "");
				this._keypad.setMinNumericKeypadValue(this._MIN_SYMBOL_RATE);
				this._keypad.setMaxNumericKeypadValue(this._MAX_SYMBOL_RATE);
				break;
			}
			$N.app.KeyboardUtils.showKeypad($N.app.KeyboardType.NUMERIC);
			this._keypad.focus();
			this._keypad.show();
		};

		this.getModulationData = function (selectedTitle) {
			var index,
				data = [
					{
						title: "16 QAM",
						value: 1,
						selected: false
					},
					{
						title: "64 QAM",
						value: 3,
						selected: false
					},
					{
						title: "256 QAM",
						value: 5,
						selected: false
					}
				];
			index = $N.app.ArrayUtil.getIndex(
				data,
				function (element) {
					return element.title === selectedTitle;
				}
			);
			// Belt and braces; if there's no match then force a valid value.
			if (index === -1) {
				index = 5;
			}
			data[index].selected = true;
			return data;
		};

		this.updateUI = function (obj) {
			var item = this._channelInstaller.getActualSelectedItem(),
				data = this._channelInstaller.getData(),
				index = $N.app.ArrayUtil.getIndex(
					data,
					function (element) {
						return obj.key === element.key;
					}
				);
			item.update(obj);
			data[index] = obj;
			this._channelInstaller.setData(data);
			this._channelInstaller.selectItemAtIndex(this._selectedIndex, true);
			this._channelInstaller.displayData();
		};

		var me = this;
		/**
		 * callback when the scan parameters gets saved successfully.
		 * @method scanValueSavedCallback
		 */
		this.scanValueSavedCallback = function () {
			me._signalBox.setStrengthScanValue(false);
			me._signalBox.enableStrengthScan();
			me._signalBox._channelsFoundLabel.hide();
		};

		this.saveScanParameters = function () {
			$N.common.helper.ScanManager.updateNetworkConfig(this._scanConfig, this.scanValueSavedCallback, null);
		};

		this.updateProgressBar = function (obj) {
			// reason for obj not being used here is because it contains only progress value which is 100,
			// all other values are 0. Also the update interval passed in performScan isn't being used.
			var numberOfChannels = $N.platform.btv.EPG.getVideoChannels().length;
		};
		this.onScanFailure = function () {
			me._channelScanBox.setMessage(BoxMenu.getString("scanFailed"));
		};
		this.onScanComplete = function () {
			var numberOfChannels = $N.platform.btv.EPG.getVideoChannels().length,
				message = numberOfChannels + " " + BoxMenu.getString("channelsFound");

			if (numberOfChannels > 0) {
				me._isChannelScanSuccessful = true;
				me._signalBox.setChannelsFound(message);

				$N.app.ChannelManager.tuneToBarkerChannel(false);
			}
			me.setSubMenu(me._signalBox);
			me.restoreLegend();
			me._menu.focus();
			me._background.setCssClass("menuBackgroundFocus");
		};
	}
	$N.gui.Util.extend(BoxMenu, $N.gui.GUIObject);

	BoxMenu.prototype.removeComponent = function (component) { // TODO NINJA-1314: Once ticket is complete we can simply call component.removeFromParent()
		component._removeReferenceFromParent();
		if (component._rootElement && component._rootElement.parentNode) {
			component._rootElement.parentNode.removeChild(component._rootElement);
		}
	};

	/**
	 * @method focus
	 */
	BoxMenu.prototype.focus = function () {
		this._log("focus", "Enter");
		this._menu.focus();
		this._background.setCssClass("menuBackgroundFocus");
		this._legend.setWidth(1345.5);
		this._legendOkIcon.show();
		this._legendEnter.show();
		this._legendGreenIcon.show();
		this._legendScan.show();
		this.subMenuActive = false;
		this._log("focus", "Exit");
	};

	/**
	 * @method _itemSelected
	 * @param {Object} data
	 */
	BoxMenu.prototype._itemSelected = function (data) {
		this._log("_itemSelected", "Enter");
		var me = this,
			// We don't need any additional parameters or changes for the scan since all
			// of the 'correct' values will already be present in the configuration
			// file at this point.
			parameters = null,
			config = {
				title: data.title,
				returnObject : {
					title : data.title,
					key: data.key,
					value : null
				},
				exitCallback : function () {
					me.setMenu(me._channelInstaller);
					me.saveScanParameters();
				},
				saveCallback: function (obj) {
					var newElement = {
							title: obj.title,
							key: obj.key,
							subtitle: parseInt(obj.value, 10) || 0
						};
					me._scanConfig[newElement.key] = obj.value;
					me.setMenu(me._channelInstaller);
					me.updateUI(newElement);
					me.saveScanParameters();
				}
			};
		this._selectedIndex = this._channelInstaller.getSelectedItemIndex();
		switch (data.key) {
		case "modulation":
			this.setMenu(this._selectionPad);
			this._selectionPad.setTitle(data.title);
			this._selectionPad.setData(this.getModulationData(data.subtitle));
			this._selectionPad.displayData();
			this._selectionPad.focus();
			break;
		default:
			this.setMenu(this._keypad);
			this.showKeypad(config, data.key);
		}
		this._log("_itemSelected", "Exit");
	};

	/**
	 * @method performScan
	 *
	 */
	BoxMenu.prototype.performScan = function () {
		this._menu.defocus();
		this._background.setCssClass("menuBackgroundDefocus");
		this.setSubMenu(this._channelScanBox);
		this._signalBox.disableStrengthScan();
		this._channelScanBox.activate();
		this.subMenuActive = true;
		this._legendBackArrow.setX(695.5);
		this._legendBack.setX(728.5);
		this._legendOkIcon.hide();
		this._legendEnter.hide();
		this._legendGreenIcon.hide();
		this._legendScan.hide();
		$N.common.helper.ScanManager.setScanCompleteCallback(this.onScanComplete);
		$N.common.helper.ScanManager.setScanProgressCallback(this.updateProgressBar, 500);
		$N.common.helper.ScanManager.setScanFailureCallback(this.onScanFailure);
		$N.common.helper.ScanManager.triggerScan("cableoneshot");
	};


	/**
	 * @method _enableStrengthScanOnSignalGain
	 */

	BoxMenu.prototype._enableStrengthScanOnSignalGain = function () {
		this._log("_enableStrengthScanOnSignalGain", "Enter");
		this._signalBox.setChannelsFound(""); // channel found text should be hidden.
		this._signalBox.setStrengthScanValue(false);
		this._signalBox.enableStrengthScan();
		this._log("_enableStrengthScanOnSignalGain", "Exit");
	};

	/**
	 * @method _reInitiateSignalStrengthScan
	 */

	BoxMenu.prototype._reInitiateSignalStrengthScan = function () {
		this._log("_reInitiateSignalStrengthScan", "Enter");
		this._signalBox.setChannelsFound(""); // channel found text should be hidden.
		this._signalBox.setStrengthScanValue(false);
		this._signalBox.enableStrengthScan();
		this._log("_reInitiateSignalStrengthScan", "Exit");
	};


	/**
	 * @method _disableStrengthScanOnSignalLoss
	 */

	BoxMenu.prototype._disableStrengthScanOnSignalLoss = function () {
		this._log("_disableStrengthScanOnSignalLoss", "Enter");
		this._signalBox.setChannelsFound(""); // channel found text should be hidden.
		this._signalBox.setStrengthScanValue(true);
		this._signalBox._updateSignalStrength(null);
		this._signalBox.disableStrengthScan();
		this._log("_disableStrengthScanOnSignalLoss", "Exit");
	};


	/**
	 * @method initialise
	 */
	BoxMenu.prototype.initialise = function () {
		this._log("initialise", "Enter");
		var me = this,
			params = $N.common.helper.ScanManager.getNetworkConfig();

		this._scanConfig = {
			networkId : params.networkId,
			frequency : params.frequency,
			symbolRate : params.symbolRate,
			modulation : params.modulation
		};
		this.setMenu(this._channelInstaller);
		this._menu.setItemSelectedCallback(function (data) {
			me._itemSelected(data);
		});
		this._menu.setDataMapper(this._dataMapper);
		this._menu.initialise();
		this._selectionPad.setExitCallback(function () {
			me.setMenu(me._channelInstaller);
		});
		this._selectionPad.setItemSelectedCallback(function (data) {
			var newElement = {
					title: BoxMenu.getString("modulation"),
					key: "modulation",
					subtitle: data.title
				};
			me._scanConfig.modulation = data.value;
			me.setMenu(me._channelInstaller);
			me.updateUI(newElement);
			me.saveScanParameters();
		});
		this._selectionPad.setDataMapper({
			getTitle: function (data) {
				return data.title;
			},
			getSelected: function (data) {
				return data.selected;
			},
			getIcon: function (data) {
				return "";
			}
		});
		this._selectionPad.initialise();
		this._selectionPad.setTitle(BoxMenu.getString("modulation"));
		this._channelScanBox.setExitCallback(function () {
			$N.app.SettingsAPI.cancelScan();
			me._reInitiateSignalStrengthScan();
			me.restoreLegend();
			me.setSubMenu(me._signalBox);
			me._menu.focus();
		});
		this.setSubMenu(this._signalBox);
		this._keypad.setCssClassForKeypadTitle("medium normal ellipsis");
		this._subMenu.initialise();
		//$N.app.fullScreenPlayer.tuner.registerQosImprovedListener(me._enableStrengthScanOnSignalGain);     jrm
		//$N.app.fullScreenPlayer.tuner.registerQosDegradedListener(me._disableStrengthScanOnSignalLoss);
		this._log("initialise", "Exit");
	};

	BoxMenu.prototype.onLanguageChanged = function () {
		this.setSubMenu(this._signalBox);
		this._subMenu.refreshData();
	};


	/**
	 * @method preview
	 */
	BoxMenu.prototype.preview = function (data) {
		this._log("preview", "Enter");
		this._signalBox.enableStrengthScan();
		this.setMenu(this._channelInstaller);
		this._menu.setData(data);
		this._menu.displayData(true, true);
		this._legend.hide();
		this.show();
		this._subMenu.preview();
		this._log("preview", "Exit");
	};

	/**
	 * @method activate
	 */
	BoxMenu.prototype.activate = function (data) {
		var me = this;
		this._log("activate", "Enter");

		$N.common.helper.ScanManager.setAutomaticScanEnabledCallback(function () {
			me._signalBox.enableStrengthScan();
		});

		this._legendBack.setText(BoxMenu.getString("menuSettingsBack"));
		this._legendEnter.setText(BoxMenu.getString("select"));
		this._legendScan.setText(BoxMenu.getString("scan"));
		this.focus();
		this._legend.show();
		if (data) {
			this._menu.setData(data);
			this._menu.displayData();
		} else {
			this._menu._getSelectedObject().highlight();
		}
		this._signalBox.activate();
		this.show();
		this._log("activate", "Exit");
	};

	/**
	 * @method passivate
	 */
	BoxMenu.prototype.passivate = function () {
		var me = this;
		this._log("passivate", "Enter");

		$N.common.helper.ScanManager.setAutomaticScanEnabledCallback(null);

		this._legend.hide();
		this._menu.defocus();
		this._background.setCssClass("menuBackgroundDefocus");
		this._signalBox.passivate();
		$N.app.fullScreenPlayer.tuner.unregisterQosImprovedListener(me._enableStrengthScanOnSignalGain);
		$N.app.fullScreenPlayer.tuner.unregisterQosDegradedListener(me._disableStrengthScanOnSignalLoss);
		this._log("passivate", "Exit");
	};

	/**
	 * @method setDataMapper
	 * @param {Object} dataMapper
	 */
	BoxMenu.prototype.setDataMapper = function (dataMapper) {
		this._log("setDataMapper", "Enter");
		this._dataMapper = dataMapper;
		this._log("setDataMapper", "Exit");
	};

	/**
	 * function to set the menu/left box to a new GUI object
	 * @method setMenu
	 * @param {Object} component
	 */
	BoxMenu.prototype.setMenu = function (component) {
		this._log("setMenu", "Enter");
		if (this._menu) {
			this.removeComponent(this._menu);
		}
		this._menu = component;
		this._container.addChild(this._menu);
		this._log("setMenu", "Exit");
	};

	/**
	 * function to set the submenu/right box to a new GUI object
	 * @method setSubMenu
	 * @param {Object} component
	 */
	BoxMenu.prototype.setSubMenu = function (component) {
		this._log("setSubMenu", "Enter");
		if (this._subMenu) {
			this.removeComponent(this._subMenu);
		}
		this._subMenu = component;
		this._subMenuContainer.addChild(this._subMenu);
		this._log("setSubMenu", "Exit");
	};

	/**
	 * @method setExitCallback
	 * @param {Object} callback
	 */
	BoxMenu.prototype.setExitCallback = function (callback) {
		this._log("setExitCallback", "Enter");
		this._exitCallback = callback;
		this._log("setExitCallback", "Exit");
	};

	/**
	 * @method getChannelScanResult
	 * @return {Boolean} channel scan result.
	 */
	BoxMenu.prototype.getChannelScanResult = function () {
		this._log("getChannelScanResult", "Enter & Exit");
		return this._isChannelScanSuccessful;
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	BoxMenu.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter");
		var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
			handled = false;
		if (this.subMenuActive) {
			handled = this._subMenu.keyHandler(key);
		} else {
			handled = this._menu.keyHandler(key);
		}
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
			case keys.KEY_GREEN:
				this.performScan();
				handled = true;
				break;
			case keys.KEY_EXIT:
				this.restoreLegend();
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

	$N.gui.BoxMenu = BoxMenu;
}($N || {}));
