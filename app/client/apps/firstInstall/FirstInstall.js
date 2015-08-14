 /**
 * FirstInstall
 * @module FirstInstall
 * @class FirstInstall
 * @static
 * @param {Object} $N
 */
var FirstInstall = (function ($N) {
	var log = new $N.apps.core.Log("FirstInstall", "FirstInstall"),
		isEmulator = (typeof window.parent.document.getElementById("CCOMid") !== "function"),
		view = {},
		highlighted = null,
		activeComponent = null,
		menu = null,
		netLogo = null,
		title = null,
		channelSetup = null,
		decoderInfo = null,
		IPStatus = null,
		factoryReset = null,
		exitPopup = null,
		selectedMenuItem = null,
		authenticated = false,
		VISIBLE_ITEM_COUNT = 5,
		ipStatusRefreshInterval = null,
		IP_STATUS_REFRESH_INTERVAL_MS = 200,
		dataMapper = {
			getTitle: function (obj) {
				return FirstInstall.getString(obj.name);
			}
		},
		notAvailableText,
//		systemObject = $N.app.ConditionalAccessCAK73.getCASystemInfo(),    jrm
//  		smartCardObject = $N.app.ConditionalAccessCAK73.getCASmartCardInfo(),
		pinHelper = null,
		dialogButtons = [{
			name: $N.app.DialogueHelper.getString("no"),
			action: $N.app.constants.NO_OPTION
		}, {
			name: $N.app.DialogueHelper.getString("yes"),
			action: $N.app.constants.YES_OPTION
		}];

	/**
	 * @method loadChannelSetup
	 * @private
	 */
	function loadChannelSetup() {
		title.setText(FirstInstall.getString("channelSetup"));

		var scanConfig = $N.common.helper.ScanManager.getNetworkConfig(),
			channelData = [
				{
					title: FirstInstall.getString("networkId"),
					key: "networkId",
					subtitle: scanConfig.networkId
				},
				{
					title: FirstInstall.getString("frequency") + " (kHz)",
					key: "frequency",
					subtitle: scanConfig.frequency
				},
				{
					title: FirstInstall.getString("symbolRate") + " (kbaud)",
					key: "symbolRate",
					subtitle: scanConfig.symbolRate
				},
				{
					title: FirstInstall.getString("modulation"),
					key: "modulation",
					subtitle: $N.app.DVBScanUtil.getModulationType(scanConfig.modulation)
				}
			];

		channelSetup.preview(channelData);
	}

	/**
	 * @method loadDecoderInfoSetup
	 * @private
	 */
	function loadDecoderInfoSetup() {
		var constants = $N.app.constants,
			smartCardObject = $N.app.ConditionalAccessCAK73.getCASmartCardInfo(),
			dvlObject = (CCOM.DRM) ? CCOM.DRM.getDrmInfo(CCOM.DRM.DRM_TYPE_PRM) : null,
			chipsetType = systemObject.systemInfo.chipsetType,
			chipsetRevision = systemObject.systemInfo.chipsetRevision,
			cakRevision = FirstInstall.getString("cakRevision");
		title.setText(FirstInstall.getString("decoderInfo"));
		decoderInfo.preview([
			{
				"key" : FirstInstall.getString("stbModelNo"),
				"value" : CCOM.System.getStringById(constants.SYSTEM_STB_MODEL).string || notAvailableText
			},
			{
				"key" : FirstInstall.getString("firmWareVersion"),
				"value" : $N.app.SettingsAPI.getVersion() || notAvailableText
			},
			{
				"key" : FirstInstall.getString("appVersion"),
				"value" : $N.app.Version.app_version || notAvailableText
			},
			{
				"key" : FirstInstall.getString("updateID"),
				"value" : $N.app.FeatureManager.getUsageId() || notAvailableText
			},
			{
				"key" : FirstInstall.getString("decodeCAID"),
				"value" : systemObject.systemInfo.serialNumber || notAvailableText
			},
			{
				"key" : FirstInstall.getString("smartCardNumber"),
				"value" :  smartCardObject.smartcardInfo ? smartCardObject.smartcardInfo.serialNumber || notAvailableText : notAvailableText
			},
			{
				"key" : FirstInstall.getString("smartCardSoftware"),
				"value" : smartCardObject.smartcardInfo ? smartCardObject.smartcardInfo.version || notAvailableText : notAvailableText
			},
			{
				"key" : FirstInstall.getString("stbSerial"),
				"value" : CCOM.System.getStringById(constants.SYSTEM_STB_SERIAL_NUMBER).string || notAvailableText
			},
			{
				"key" : FirstInstall.getString("cakVersion"),
				"value" : systemObject.systemInfo.version || notAvailableText
			},
			{
				"key" : FirstInstall.getString("caNuid"),
				"value" : systemObject.systemInfo.nuid || notAvailableText
			},
			{
				"key" : FirstInstall.getString("chipsetType"),
				"value" : (chipsetType + " " +  "(" + cakRevision + " " + chipsetRevision + ")") || notAvailableText
			},
			{
				"key" : FirstInstall.getString("projectInfo"),
				"value" : systemObject.systemInfo.projectInformation || notAvailableText
			},
			{
				"key" : FirstInstall.getString("dvlVersion"),
				"value" : (dvlObject && dvlObject.drm && dvlObject.drm.version) ? dvlObject.drm.version : notAvailableText
			},
			{
				"key" : FirstInstall.getString("CSCMaxIndex"),
				"value" :  (typeof (systemObject.systemInfo.cscMaxIndex) !== "null") ? parseInt(systemObject.systemInfo.cscMaxIndex, 10) : notAvailableText
			}
		]);
	}

	/**
	 * @method loadFactoryReset
	 * @private
	 */
	function loadFactoryReset() {
		title.setText(FirstInstall.getString("factoryReset"));
		factoryReset.setMessagePopup(exitPopup);
		factoryReset.preview([{ title: FirstInstall.getString("factoryReset") }]);
	}

	/**
	 * @method updateIPStatusData
	 * @private
	 */
	function updateIPStatusData() {
		var docsisInfo = (isEmulator) ? null : window.parent.CCOM.IpNetwork.cableModem[0],
			ipConnectedText = FirstInstall.getString("ipConnected"),
			ipDisconnectedText = FirstInstall.getString("ipDisconnected"),
			network = $N.platform.system.Network,
			dns = network.getDnsServers(),
			isEthernetConnected = network.isEthernetAvailable(),
			PRIMARY_DNS_INDEX = 0,
			SECONDARY_DNS_INDEX = 1,
			ipStatusData = [
				{
					"key" : FirstInstall.getString("decoderIP"),
					"value" : isEthernetConnected ? network.getIpAddress() : notAvailableText
				},
				{
					"key" : FirstInstall.getString("dns"),
					"value" : isEthernetConnected ? (dns[PRIMARY_DNS_INDEX] || dns[SECONDARY_DNS_INDEX]) : notAvailableText
				},
				{
					"key" : FirstInstall.getString("macAddress"),
					"value" : (docsisInfo && docsisInfo.macAddressExternal) ? docsisInfo.macAddressExternal : notAvailableText
				},
				{
					"key" : FirstInstall.getString("txPowerLevel"),
					"value" : (docsisInfo && docsisInfo.usPower) ? docsisInfo.usPower : notAvailableText
				},
				{
					"key" : FirstInstall.getString("rxPowerLevel"),
					"value" : (docsisInfo && docsisInfo.dsPower) ? (docsisInfo.dsPower / 10) : notAvailableText
				},
				{
					"key" : FirstInstall.getString("SNR"),
					"value" : (docsisInfo && docsisInfo.snr) ? docsisInfo.snr : notAvailableText
				},
				{
					"key" : FirstInstall.getString("status"),
					"value" : (docsisInfo && docsisInfo.connectedToCMTS) ? ipConnectedText : ipDisconnectedText
				},
				{
					"key" : FirstInstall.getString("ipMask"),
					"value" : isEthernetConnected ? network.getSubnetMask() : notAvailableText
				},
				{
					"key" : FirstInstall.getString("gatewayIP"),
					"value" : isEthernetConnected ? network.getGateway() : notAvailableText
				},
				{
					"key" : FirstInstall.getString("macStb"),
					"value" : network.getMacAddress() || notAvailableText
				},
				{
					"key" : FirstInstall.getString("ipStb"),
					"value" : (docsisInfo && docsisInfo.ipAddressExternal) ? docsisInfo.ipAddressExternal : notAvailableText
				}
			];
		return ipStatusData;
	}



	/**
	 * @method loadIPStatus
	 * @private
	 */
	function loadIPStatus() {
		var docsisInfo = (isEmulator) ? null : window.parent.CCOM.IpNetwork.cableModem[0],
			ipConnectedText = FirstInstall.getString("ipConnected"),
			ipDisconnectedText = FirstInstall.getString("ipDisconnected"),
			network = $N.platform.system.Network,
			dns = network.getDnsServers(),
			isEthernetConnected = network.isEthernetAvailable(),
			PRIMARY_DNS_INDEX = 0,
			ipStatusData = updateIPStatusData(),
			SECONDARY_DNS_INDEX = 1;

		title.setText(FirstInstall.getString("IPStatus"));
		IPStatus.preview(ipStatusData);
	}

	/**
	 * @method loadExit
	 * @private
	 */
	function loadExit() {
		title.setText(FirstInstall.getString("exit"));
	}

	/**
	 * @method getMenuItems
	 * @private
	 * @return {Array}
	 */
	function getMenuItems() {
		return [{
			name: "channels"
		}, {
			name: "IPStatus"
		}, {
			name: "decoderInfo"
		}, {
			name: "factoryReset"
		}, {
			name: "exit"
		}];
	}

	/**
	 * @method pinSuccessCallback
	 * @private
	 */
	function pinSuccessCallback() {
		authenticated = true;
		netLogo.show();
		title.show();
		menu.setData(getMenuItems());
		menu.displayData();
		menu.focus();

		/* If any recordings are scheduled or active warn the user about possible impact */
		if ($N.app.PVRUtil.isRecordingsActive()) {
			$N.app.DialogueHelper.createAndShowDialogue(
				$N.app.constants.DLG_FACTORY_RESET_RECORDING,
				$N.app.DialogueHelper.getString("warning"),
				FirstInstall.getString("recordingWarningMessage")
			);
		} else if ($N.app.PVRUtil.isRecordingsScheduled()) {
			$N.app.DialogueHelper.createAndShowDialogue(
				$N.app.constants.DLG_FACTORY_RESET_SCHEDULED,
				$N.app.DialogueHelper.getString("warning"),
				FirstInstall.getString("futureRecordingWarningMessage")
			);
		}
	}

	/**
	 * @method showPinEntry
	 * @private
	 */
	function showPinEntry() {
		if (pinHelper === null) {
			pinHelper = new $N.app.PinHelper(pinSuccessCallback, null, null, null, 0, true);
		}
		$N.apps.dialog.PinDialog.GUITemplateObject = $N.gui.PinDialog;
		pinHelper.setDialogProperties({
			x: 0,
			y: 0,
			width: 1920,
			height: 1080,
			id: "firstInstall",
			title: FirstInstall.getString("installation"),
			description: FirstInstall.getString("enterInstallPassword"),
			eventImageVisibility: false,
			leftArrowVisibility: ($N.platform.system.Preferences.get($N.app.constants.PREF_ISINSTALLED) === "true") ? true : false,
			cancelCallback: function () {
				pinHelper.hideDialog();
				if ($N.platform.system.Preferences.get($N.app.constants.PREF_ISINSTALLED) === "true") {
					$N.app.ContextHelper.closeContext();
				} else if (authenticated === false) {
					showPinEntry();
				}
			}
		});
		pinHelper.setAuthenticationSuccessCallback(pinSuccessCallback);
		pinHelper.showPinDialog('install', true, null, true);
	}

	/**
	 * @method exit
	 * @param {object} e
	 * @public
	 */
	function exit(e) {
		var channelList = $N.app.genreUtil.getAllChannelsByGenre($N.app.genreUtil.GENRE_ADULT);

		if (!e || (e.action !== $N.app.constants.YES_OPTION)) {
			return;
		}

		$N.platform.ca.ParentalControl.initialise();
		$N.platform.ca.PINHandler.init();
		$N.platform.ca.PINHandler.validateParentalPin($N.app.constants.DEFAULT_PARENTAL_PIN, function () {
			$N.app.ChannelManager.addMultipleChannelsToBlockedList(channelList);
		}, true);
		channelSetup.passivate();
		if ($N.platform.system.Preferences.get($N.app.constants.PREF_ISINSTALLED) === "true") {
			$N.app.ContextHelper.openContext("ZAPPER");
		} else if (channelSetup.getChannelScanResult()) {
			activeComponent = exitPopup;
			exitPopup.setBlockUI(true);
			exitPopup.setMessage(FirstInstall.getString("exitMessage"));
			// This is a workaround for NETUI-4848
			// finaliseInstallation causes the DOM of all app contexts to be loaded.
			// The large amount of DOM manipulation occurring prevents the confirmLeaveInstaller dialog
			// from being hidden correctly when it is removed from the DOM. The 1 ms timeOut ensures
			// that finaliseInstallation is not called until after the current JS event loop is complete.
			setTimeout(function () {
				window.parent.Launch.finaliseInstallation();
			}, 1);
		} else if ($N.platform.system.Preferences.get($N.app.constants.PREF_ISINSTALLED) !== "true") {
			showPinEntry();
		}
	}

	/**
	 * callback
	 * @method IPStatusUpdateHandler
	 * @private
	 */
	function IPStatusUpdateHandler() {
		updateIPStatusData();
	}

	/**
	 * @method startIPStatusRefreshData
	 * @private
	 */
	function startIPStatusRefreshData() {
		if (ipStatusRefreshInterval) {
			clearInterval(ipStatusRefreshInterval);
			ipStatusRefreshInterval = null;
		}
		ipStatusRefreshInterval = setInterval(IPStatusUpdateHandler, IP_STATUS_REFRESH_INTERVAL_MS);
	}

	/**
	 * @method stopIPStatusRefreshData
	 * @private
	 */
	function stopIPStatusRefreshData() {
		clearInterval(ipStatusRefreshInterval);
		ipStatusRefreshInterval = null;
	}


	/**
	 * function to set active component by a specified DOM id and
	 * show the active component.
	 * @method resetHighlighted
	 * @private
	 * @param {String} id
	 */
	function resetHighlighted(id) {
		var i, count, item, target = view.wizard[id];
		count = view.wizard._children.length;
		if (highlighted) {
			highlighted.hide();
		}
		for (i = 0; i < count; i++) {
			item = view.wizard._children[i];
			if (item === target) {
				highlighted = item;
				break;
			}
		}
	}

	/**
	 * @method itemHighlighted
	 * @private
	 * @param {Object} menuItem
	 */
	function itemHighlighted(menuItem) {
		resetHighlighted(menuItem.name);
		view.settingsBGLines.hide();
		stopIPStatusRefreshData();
		switch (menuItem.name) {
		case 'channels':
			loadChannelSetup();
			break;
		case 'IPStatus':
			loadIPStatus();
			view.settingsBGLines.show();
			startIPStatusRefreshData();
			break;
		case 'decoderInfo':
			loadDecoderInfoSetup();
			view.settingsBGLines.show();
			break;
		case 'factoryReset':
			loadFactoryReset();
			break;
		case 'exit':
			loadExit();
			break;
		}
	}

	/**
	 * function to store the selected component locally and invoke the activate on the component.
	 * The exit callback is also set on the assumption that all the component expose setExitCallback API.
	 * @method itemSelected
	 * @private
	 * @param {Object} menuItem
	 */
	function itemSelected(menuItem) {
		var dialogueObj,
			callback = function () { activeComponent = menu; };
		if (menuItem.name === "exit") {
			dialogueObj = $N.app.DialogueHelper.createAndShowDialogue(
				$N.app.constants.DLG_CONFIRM_LEAVE_INSTALLER,
				undefined,
				undefined,
				FirstInstall.dialogButtons
			);
			// there are two routes to exit Install, so we have to explicitly set the correct exit code
			dialogueObj.setSelectedCallback(FirstInstall.exit);
		} else {
			activeComponent = highlighted;
			highlighted.activate();
			highlighted.setExitCallback(callback);
		}
	}

	return {
		/**
		 * Entry point of the application for the SVG onload event
		 * @method load
		 */
		load: function () {
			log("load", "Enter");
			$N.gui.ResolutionManager.initialiseContext(document);
			$N.apps.core.Language.importLanguageBundleForObject(
				FirstInstall,
				FirstInstall.init,
				"apps/firstInstall/common/",
				"LanguageBundle.js",
				FirstInstall.onLanguageChanged,
				window
			);
			log("load", "Exit");
		},

		/**
		 * Called whenever the UI language is changed by the user
		 * @method onLanguageChanged
		 */
		onLanguageChanged: function () {
			log("onLanguageChanged", "Enter");
			channelSetup.onLanguageChanged();
			log("onLanguageChanged", "Exit");
		},

		/**
		 * Application lifecycle initialisation method to create the view
		 * Called after language bundle is loaded
		 * @method init
		 */
		init: function () {
			log("init", "Enter");
			$N.gui.FrameworkCore.loadGUIFromXML("apps/firstInstall/view/firstInstall.xml", document.getElementById("content"), view, window);
			menu = view.menu;
			netLogo = view.netLogo;
			title = view.title;
			channelSetup = view.wizard.channels;
			decoderInfo = view.wizard.decoderInfo;
			factoryReset = view.wizard.factoryReset;
			IPStatus = view.wizard.IPStatus;
			exitPopup = view.exit;
			menu.setDataMapper(dataMapper);
			menu.setItemHighlightedCallback(itemHighlighted);
			menu.setItemSelectedCallback(itemSelected);
			menu.setVisibleItemCount(VISIBLE_ITEM_COUNT);
			menu.initialise();
			channelSetup.setDataMapper({
				getTitle: function (data) {
					return data.title;
				},
				getSubtitle: function (data) {
					return data.subtitle;
				}
			});
			channelSetup.initialise();
			decoderInfo.initialise();
			factoryReset.initialise();
			IPStatus.initialise();

			$N.apps.core.ContextManager.initialisationComplete(FirstInstall);
			log("init", "Exit");
		},

		/**
		 * Application lifecycle activation method to draw the view
		 * @method activate
		 * @param {Object} activationObject
		 */
		activate: function (activationObject) {                                        
			log("activate", "Enter");
			notAvailableText = FirstInstall.getString("notAvailable");
			activeComponent = menu;
			exitPopup.hide();
			$N.platform.system.Preferences.set($N.app.constants.PREF_UI_MIGRATION_STATUS, true);
			if (authenticated) {
				menu.setData(getMenuItems());
				menu.displayData();
				menu.focus();
			} else {
				netLogo.hide();
				title.hide();
				showPinEntry();
			}
			log("activate", "Exit");
		},

		/**
		 * Application lifecycle passivation method to hide the view
		 * @method passivate
		 */
		passivate: function (leaveAsPreview) {
			log("passivate", "Enter");
			if (pinHelper) {
				pinHelper.hideDialog();
			}
			channelSetup.passivate();
			authenticated = false;
			stopIPStatusRefreshData();
			log("passivate", "Exit");
		},

		focus: function () {
			log("focus", "Enter");
			startIPStatusRefreshData();
			log("focus", "Exit");
		},

		defocus: function () {
			log("defocus", "Enter");
			stopIPStatusRefreshData();
			log("defocus", "Exit");
		},

		/**
		 * Application lifecycle method to return the context name
		 * @method toString
		 */
		toString: function () {
			return "FIRSTINSTALL";
		},

		/**
		 * Callback for button pressed on confirmation dialogue
		 * @method dlgCallback
		 * @param {object} e
		 * @public
		 */
		dlgCallback: function (e) {
			if (e && (e.action === $N.app.constants.YES_OPTION)) {
				$N.app.ContextHelper.closeContext();
			}
		},

		/**
		 * Main keyHandler method
		 * @param {String} key
		 */
		keyHandler: function (key) {
			log("keyHandler", "Enter");
			var keys = $N.apps.core.KeyInterceptor.getKeyMap(),
				handled = false,
				dialogueObj;
			$N.app.MemoryUtil.setOrUpdateGarbageCollectTimeoutAndInterval();

			handled = activeComponent.keyHandler(key);
			if (!handled) {
				switch (key) {
				case keys.KEY_LEFT:
				case keys.KEY_EXIT:
					if ($N.platform.system.Preferences.get($N.app.constants.PREF_ISINSTALLED) !== "true") {
						// we're not yet installed, block the key event
						handled = true;
						break;
					}

					dialogueObj = $N.app.DialogueHelper.createAndShowDialogue(
						$N.app.constants.DLG_CONFIRM_LEAVE_INSTALLER,
						undefined,
						undefined,
						FirstInstall.dialogButtons
					);
					// there are two routes to exit Install, so we have to explicitly set the correct exit code
					dialogueObj.setSelectedCallback(FirstInstall.dlgCallback);
					handled = true;
					break;
				case keys.KEY_HOME:
				case keys.KEY_MOSAIC:
				case keys.KEY_RADIO:
				case keys.KEY_GUIDE:
				case keys.KEY_AGORA:
				case keys.KEY_PPV:
				case keys.KEY_VIEW:
				case keys.KEY_MENU:
				case keys.KEY_PORTAL:
				case keys.KEY_VOD:
				case keys.KEY_VOL_UP:
				case keys.KEY_VOL_DOWN:
				case keys.KEY_MUTE:
				case keys.KEY_POWER:
					/* Swallow global keys in first time install so we don't switch to non-loaded contexts or features */
					if ($N.platform.system.Preferences.get($N.app.constants.PREF_ISINSTALLED) !== "true") {
						handled = true;
					}
					break;
				}
			}

			log("keyHandler", "Exit");
			return handled;
		},

		dialogButtons: dialogButtons,
		exit: exit,
		itemSelected: function () {}
	};
}(window.parent.$N));
