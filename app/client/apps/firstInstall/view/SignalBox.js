/**
 * SignalBox is a GUI component containing a menu and title
 * It is designed to be placed as a second/right box in the BoxMenu, but could be used separately
 *
 * @class SignalBox
 * @extends GUIObject
 * @param {Object} docRef
 * @param {Object} parent
 */
var $N = window.parent.$N;
(function ($N) {
	function SignalBox(docRef, parent) {
		SignalBox.superConstructor.call(this, docRef);
		this._log = new $N.apps.core.Log("CommonGUI", "SignalBox");
		$N.apps.core.Language.importLanguageBundleForObject(SignalBox, null, "apps/firstInstall/common/", "LanguageBundle.js", null, window);

		this._container = new $N.gui.Group(this._docRef);
		this._background = new $N.gui.Container(this._docRef, this._container);
		this._strengthLabel = new $N.gui.Label(docRef, this._container);
		this._strengthProgress = new $N.gui.SettingsProgressBarMenuItem(docRef, this._container);
		this._qualityLabel = new $N.gui.Label(docRef, this._container);
		this._qualityProgress = new $N.gui.SettingsProgressBarMenuItem(docRef, this._container);
		this._frontLabel = new $N.gui.Label(docRef, this._container);
		this._BERLabel = new $N.gui.Label(docRef, this._container);
		this._frontValueLabel  = new $N.gui.Label(docRef, this._container);
		this._BERValueLabel = new $N.gui.Label(docRef, this._container);
		this._channelsFoundLabel = new $N.gui.Label(docRef, this._container);

		this._width = 660;
		this._height = 576;

		this._container.configure({
			width: this._width,
			height: this._height
		});
		this._background.configure({
			width: this._width,
			height: this._height,
			cssClass: "menuBackgroundDefocus"
		});
		this._strengthLabel.configure({
			x: 27,
			y: 145,
			cssClass: "firstInstallvalueLabel"
		});
		this._strengthProgress.configure({
			x: -40,
			y: 110,
			progressTextConfig: {
				x: 517,
				y: 80,
				cssClass: "progressEndLabel"
			},
			progressBarConfig: {
				x: 67,
				y: 90,
				height: 22.5,
				width: 440,
				outerCssClass: "signalProgressBarOuter"
			}
		});
		this._qualityLabel.configure({
			x: 27,
			y: 245,
			cssClass: "firstInstallvalueLabel"
		});
		this._qualityProgress.configure({
			x: -40,
			y: 180,
			progressTextConfig: {
				x: 517,
				y: 105,
				cssClass: "progressEndLabel"
			},
			progressBarConfig: {
				x: 67,
				y: 120,
				height: 22.5,
				width: 440,
				outerCssClass: "signalProgressBarOuter"
			}
		});
		this._frontLabel.configure({
			x: 27,
			y: 70,
			cssClass: "installAlternative"
		});
		this._frontValueLabel.configure({
			x: 360,
			y: 70,
			cssClass: "firstInstallvalueLabel"
		});
		this._BERLabel.configure({
			x: 27,
			y: 365,
			cssClass: "installAlternative"
		});
		this._BERValueLabel.configure({
			x: 125,
			y: 365,
			cssClass: "firstInstallvalueLabel"
		});
		this._channelsFoundLabel.configure({
			x: 0,
			y: 466,
			cssClass: "dialog_title_centre",
			visible: false
		});
		this._SIGNAL_QUALITY_THRESHOLD = 30;
		this.strengthScanEnabled = false;

		this._rootSVGRef = this._container.getRootSVGRef();
		if (parent) {
			parent.addChild(this);
		}
	}
	$N.gui.Util.extend(SignalBox, $N.gui.GUIObject);

	SignalBox.prototype._updateSignalStrength = function (result) {
		var	SIGNAL_STRENGTH_PROGBAR_MIN = -16,
			signalQuality = 0;

		if (this.strengthScanEnabled) {
			if (result) {
				this.setSignalStrength(result ?  $N.app.SignalInfoUtil.convertSignalStrengthTodBmV(result.signalStrength) : 0);
				if (result && result.SNR > this._SIGNAL_QUALITY_THRESHOLD) {
					if ((result.BER > 0) || (result.BER < 0)) {
						signalQuality = Math.round(-12.5 * (Math.log(result.BER) / Math.LN10));
					} else if (result.BER === 0) {
						signalQuality = 100;
					} else {
						signalQuality = 0;
					}
				}
				this.setSignalQuality(result ? signalQuality : 0);
				this.setFrontEndLocked(result && result.SNR > this._SIGNAL_QUALITY_THRESHOLD ? SignalBox.getString("yes") : SignalBox.getString("no"));
				this.setBER(result ? result.BER.toExponential(2) : "N/A");
			} else {
				this.setSignalStrength(SIGNAL_STRENGTH_PROGBAR_MIN);
				this.setSignalQuality(0);
				this.setFrontEndLocked(SignalBox.getString("no"));
				this.setBER("N/A");
			}
		}
	};

	/**
	 * @method setSignalStrength
	 * @param {Number} value
	 */
	SignalBox.prototype.setSignalStrength = function (value) {
		this._strengthProgress.setProgressIndicatorText("dBmV");
		//to check if the value is a decimal number then do toFixed
		if (!isNaN(value) && $N.app.GeneralUtil.isFloat(value)) {
			value = value.toFixed(1);
		}
		// With the dBm scale being from -65dBm to -25 dBm, this will give you a dBmV range of -16 dBmV to +23 dBmV.
		// NET wants this range between -16 to +20 ( OPENTV5 NET / NO5SA-1717).
		this._strengthProgress.updateProgressBar(-16, 20, value, 0);
	};

	/**
	 * @method setSignalQuality
	 * @param {Number} value
	 */
	SignalBox.prototype.setSignalQuality = function (value) {
		this._qualityProgress.setProgressIndicatorText("%");
		this._qualityProgress.updateProgressBar(0, 100, value, 0);
	};

	/**
	 * @method setFrontEndLocked
	 * @param {String} value
	 */
	SignalBox.prototype.setFrontEndLocked = function (value) {
		this._frontValueLabel.setText(value);
	};

	/**
	 * @method setBER
	 * @param {String} value
	 */
	SignalBox.prototype.setBER = function (value) {
		this._BERValueLabel.setText(value);
	};

	/**
	 * @method setChannelsFound
	 * @param {String} value
	 */
	SignalBox.prototype.setChannelsFound = function (value) {
		this._channelsFoundLabel.setText(value);
		this._channelsFoundLabel.show();
	};

	/**
	 * @method _setXforfrontValueLabel
	 * @param {String} value
	 */
	SignalBox.prototype._setXforfrontValueLabel = function (value) {
		this._frontValueLabel.setX(value);
	};


	/**
	 * @method _setXforfrontValueLabel
	 * @param {String} value
	 */
	SignalBox.prototype._setXforfrontLabel = function (value) {
		this._frontLabel.setX(value);
	};


	/**
	 * @method initialise
	 */
	SignalBox.prototype.initialise = function () {
		this._log("initialise", "Enter");
		this._strengthLabel.setText(SignalBox.getString("signalStrength"));
		this._qualityLabel.setText(SignalBox.getString("signalQuality"));
		this._frontLabel.setText(SignalBox.getString("frontEndLocked"));
		this._frontValueLabel.setText("NO");
		this._BERLabel.setText(SignalBox.getString("BER"));
		this._BERValueLabel.setText("N/A");
		this.setSignalStrength(0);
		this.setSignalQuality(0);
		this._log("initialise", "Exit");
	};

	/**
	 * @method _setData
	 * @param {Object} data
	 */
	SignalBox.prototype._setData = function (data) {
		this._log("_setData", "Enter");
		this._log("_setData", "Exit");
	};


	/**
	 * @method refreshData
	 * refresh the menu data on menu language change.
	 */
	SignalBox.prototype.refreshData = function (data) {
		this._log("_refreshData", "Enter");
		var language = $N.platform.system.Preferences.get($N.app.constants.PREF_LANGUAGE);
		this.initialise();
		if (language === $N.app.constants.LANG_ENGLISH_GB) {
			this._setXforfrontValueLabel(360);
		} else {
			this._setXforfrontValueLabel(260);
		}
		this.show();
		this._log("_refreshData", "Exit");
	};

	/**
	 * @method preview
	 * @param {Object} data
	 */
	SignalBox.prototype.preview = function (data) {
		this._log("preview", "Enter");
		var language = $N.platform.system.Preferences.get($N.app.constants.PREF_LANGUAGE);
		if (language === $N.app.constants.LANG_ENGLISH_GB) {
			this._setXforfrontValueLabel(360);
		} else {
			this._setXforfrontValueLabel(260);
		}
		this.show();
		this.enableStrengthScan();
		this._log("preview", "Exit");
	};

	/**
	 * @method activate
	 */
	SignalBox.prototype.activate = function () {
		this._log("activate", "Enter");
		this._background.setCssClass("menuBackgroundFocus");
		this.show();
		this.enableStrengthScan();
		this._log("activate", "Exit");
	};

	/**
	 * @method passivate
	 */
	SignalBox.prototype.passivate = function () {
		this._log("passivate", "Enter");
		this.disableStrengthScan();
		this._channelsFoundLabel.hide();
		this.hide();
		this._background.setCssClass("menuBackgroundDefocus");
		this._log("passivate", "Exit");
	};

	/**
	 * @method keyHandler
	 * @param {String} key
	 */
	SignalBox.prototype.keyHandler = function (key) {
		this._log("keyHandler", "Enter & Exit");
	};
	/**
	 * This method sets the value of the variable - strengthScanEnabled
	 * @method setStrengthScanValue
	 */
	SignalBox.prototype.setStrengthScanValue = function (isEnabled) {
		this._log("setStrengthScanValue", "Enter");
		this.strengthScanEnabled = isEnabled;
		this._log("setStrengthScanValue", "Exit");
	};
	/**
	 * @method enableStrengthScan
	 */
	SignalBox.prototype.enableStrengthScan = function () {
		var me = this,
			SIGNAL_STRENGTH_UPDATE_INTERVAL_MS = 1000,
			refreshCallback = function (result) {
				me._updateSignalStrength(result.progressInfo);
			},
			cancelledCallback = function (errorResult) {
				/*	We can safely not call the disable function as SignalInfoUtil
					will automatically do the job of stopMonitorSignal() */
				if (errorResult && errorResult === $N.platform.system.Scan.Error.UNAVAILABLE) {
					me._updateSignalStrength(null);
				}
				this.strengthScanEnabled = false;
			};

		this._log("enableStrengthScan", "Enter");

		if (!this.strengthScanEnabled) {
			this.strengthScanEnabled = true;

			$N.app.SignalInfoUtil.startMonitorSignal(refreshCallback, cancelledCallback, SIGNAL_STRENGTH_UPDATE_INTERVAL_MS);
		}

		this._log("enableStrengthScan", "Exit");
	};

	/**
	 * @method disableStrengthScan
	 */
	SignalBox.prototype.disableStrengthScan = function () {
		this._log("disableStrengthScan", "Enter");
		if (this.strengthScanEnabled) {
			this.strengthScanEnabled = false;
			$N.app.SignalInfoUtil.stopMonitorSignal();
		}
		this._log("disableStrengthScan", "Exit");
	};

	$N.gui.SignalBox = SignalBox;
}($N || {}));
