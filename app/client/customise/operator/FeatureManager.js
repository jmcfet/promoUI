/**
 * This class contains the information required to manage a changing Usage Id.
 * IE when the Operator changes the allowance from PVR / VOD allowed to not being available
 * @class $N.app.FeatureManager
 * @author		Andrew Price
 * @username	anprice
 *
 */
var $N = $N || {};
$N.app = $N.app || {};

$N.app.FeatureManager = (function () {
	var preferences = $N.platform.system.Preferences,
		log = new $N.apps.core.Log("Operator", "FeatureManager"),
		_usageId = null,
		_editingUsageId = false,
		_deviceInitialised = false,
		isPipActivated = null,
		USAGES = {
			LIVE: {
				PVR_OFF_VOD_ON: 1,
				PVR_OFF_VOD_OFF: 2,
				PVR_ON_VOD_OFF: 5,
				PVR_ON_VOD_ON: 6,
				isPVREnabled: function () {
					return (_usageId === USAGES.LIVE.PVR_ON_VOD_ON || _usageId === USAGES.LIVE.PVR_ON_VOD_OFF);
				},
				isVODEnabled: function () {
					return (_usageId === USAGES.LIVE.PVR_ON_VOD_ON || _usageId === USAGES.LIVE.PVR_OFF_VOD_ON);
				}
			},
			TEST: {
				PVR_ON_VOD_OFF: 3,
				PVR_ON_VOD_ON: 4,
				PVR_OFF_VOD_OFF: 7,
				PVR_OFF_VOD_ON: 8,
				isPVREnabled: function () {
					return (_usageId === USAGES.TEST.PVR_ON_VOD_ON || _usageId === USAGES.TEST.PVR_ON_VOD_OFF);
				},
				isVODEnabled: function () {
					return (_usageId === USAGES.TEST.PVR_ON_VOD_ON || _usageId === USAGES.TEST.PVR_OFF_VOD_ON);
				}
			},
			isPVREnabled: function () {
				return (USAGES.LIVE.isPVREnabled() || USAGES.TEST.isPVREnabled());
			},
			isVODEnabled: function () {
				return (USAGES.LIVE.isVODEnabled() || USAGES.TEST.isVODEnabled());
			}
		},
		featureSO = false,
		featureCU = false,
		featureVOD = false,
		featureStatus = [];

	/**
	 * @method socuFeatureStatusChanged
	 */
	function socuFeatureStatusChanged() {
		var oldStatus = featureSO,
			vodEnabled = USAGES.isVODEnabled();


		featureSO = (vodEnabled && preferences.get($N.app.constants.STARTOVER_FEATURE) === "true");
		if (oldStatus !== featureSO) {
			if (featureSO === true) {
				$N.apps.util.EventManager.fire("StartOverEnabled");
			} else {
				$N.apps.util.EventManager.fire("StartOverDisabled");
			}
		}

		oldStatus = featureCU;
		featureCU = (vodEnabled && preferences.get($N.app.constants.CATCHUP_FEATURE) === "true");
		if (oldStatus !== featureCU) {
			if (featureCU === true) {
				$N.apps.util.EventManager.fire("CatchUpEnabled");
			} else {
				$N.apps.util.EventManager.fire("CatchUpDisabled");
			}
		}
	}

	/**
	 * @method vodFeatureStatusChanged
	 */
	function vodFeatureStatusChanged() {
		var vodEnabled = USAGES.isVODEnabled();
		if (vodEnabled !== featureVOD) {
			featureVOD = vodEnabled;
			if (featureVOD === true) {
				$N.apps.util.EventManager.fire("VODEnabled");
			} else {
				$N.apps.util.EventManager.fire("VODDisabled");
			}
		}
	}

	/**
	 * @method Initialise and stop the Device class
	 * @param {bool} pvrEnabled, if PVR is functional
	 */
	function updateDeviceStatus(pvrEnabled) {
		if (pvrEnabled && !_deviceInitialised) {
			$N.platform.system.Device.initialise();
			_deviceInitialised = true;
		} else if (!pvrEnabled && _deviceInitialised) {
			$N.platform.system.Device.unregister();
			_deviceInitialised = false;
		}
	}

	/**
	 * @method getUsageId
	 * @return {Number} returns the value of the usageId from the Config manager.
	 */
	function getUsageId() {
		return CCOM.ConfigManager.getValue($N.app.constants.SYSTEM_NETWORK_USAGEID).keyValue;
	}

	/**
	 * @method setUsageId
	 * @param usageId
	 */
	function setUsageId(usageId) {
		CCOM.ConfigManager.setValue($N.app.constants.SYSTEM_NETWORK_USAGEID, usageId);
		_usageId = getUsageId();
	}

	/**
	 * @method setOperatorPVRDisabled
	 */
	function setOperatorPVRDisabled() {
		var newUsageId = null;
		switch (_usageId) {
		case USAGES.LIVE.PVR_ON_VOD_OFF:
			newUsageId = USAGES.LIVE.PVR_OFF_VOD_OFF;
			break;
		case USAGES.LIVE.PVR_ON_VOD_ON:
			newUsageId = USAGES.LIVE.PVR_OFF_VOD_ON;
			break;
		}
		if (newUsageId) {
			setUsageId(newUsageId);
		}
	}

	/**
	 * @method setOperatorPVREnabled
	 */
	function setOperatorPVREnabled() {
		var newUsageId = null;
		switch (_usageId) {
		case USAGES.LIVE.PVR_OFF_VOD_OFF:
			newUsageId = USAGES.LIVE.PVR_ON_VOD_OFF;
			break;
		case USAGES.LIVE.PVR_OFF_VOD_ON:
			newUsageId = USAGES.LIVE.PVR_ON_VOD_ON;
			break;
		}
		if (newUsageId) {
			setUsageId(newUsageId);
		}
	}

	/**
	 * @method setOperatorVODDisabled
	 */
	function setOperatorVODDisabled() {
		var newUsageId = null;
		switch (_usageId) {
		case USAGES.LIVE.PVR_OFF_VOD_ON:
			newUsageId = USAGES.LIVE.PVR_OFF_VOD_OFF;
			break;
		case USAGES.LIVE.PVR_ON_VOD_ON:
			newUsageId = USAGES.LIVE.PVR_ON_VOD_OFF;
			break;
		}
		if (newUsageId) {
			setUsageId(newUsageId);
		}
		$N.apps.util.EventManager.fire("VODDisabled");

		socuFeatureStatusChanged();
	}

	/**
	 * @method setOperatorVODEnabled
	 */
	function setOperatorVODEnabled() {
		var newUsageId = null;
		switch (_usageId) {
		case USAGES.LIVE.PVR_OFF_VOD_OFF:
			newUsageId = USAGES.LIVE.PVR_OFF_VOD_ON;
			break;
		case USAGES.LIVE.PVR_ON_VOD_OFF:
			newUsageId = USAGES.LIVE.PVR_ON_VOD_ON;
			break;
		}
		if (newUsageId) {
			setUsageId(newUsageId);
		}
		$N.apps.util.EventManager.fire("VODEnabled");
	}

	/**
	 * @method setOperatorWHPVREnabled
	 */
	function setOperatorWHPVREnabled(isEnable) {
		if (isEnable) {
			$N.apps.util.EventManager.fire("WHPVREnabled");
			preferences.set($N.app.constants.WHPVR_FEATURE, "true");
		} else if (!isEnable) {
			$N.apps.util.EventManager.fire("WHPVRDisabled");
			preferences.set($N.app.constants.WHPVR_FEATURE, "false");
		}
	}

	/**
	 * @method setOperatorCatchUpEnable
	 * @param {Boolean} enable
	 */
	function setOperatorCatchUpEnable(enable) {
		preferences.set($N.app.constants.CATCHUP_FEATURE, enable ? "true" : "false");

		socuFeatureStatusChanged();
	}

	/**
	 * @method setOperatorStartOverEnable
	 * @param {Boolean} enable
	 */
	function setOperatorStartOverEnable(enable) {
		preferences.set($N.app.constants.STARTOVER_FEATURE, enable ? "true" : "false");

		socuFeatureStatusChanged();
	}

	/**
	 * @method setOperatorMediaPlaybackEnable
	 */
	function setOperatorMediaPlaybackEnable(isEnable) {
		if (isEnable && !(preferences.get($N.app.constants.MEDIA_PLAYBACK_FEATURE))) {
			preferences.set($N.app.constants.MEDIA_PLAYBACK_FEATURE, true);
			$N.apps.util.EventManager.fire("MediaPlaybackFeatureStatusUpdated");
		} else if (!isEnable && preferences.get($N.app.constants.MEDIA_PLAYBACK_FEATURE)) {
			preferences.set($N.app.constants.MEDIA_PLAYBACK_FEATURE, false);
			$N.apps.util.EventManager.fire("MediaPlaybackFeatureStatusUpdated");
		}
	}

	/**
	 * @method getMediaPlaybackFeatureStatus
	 */
	function getMediaPlaybackFeatureStatus() {
		return preferences.get($N.app.constants.MEDIA_PLAYBACK_FEATURE);
	}

	/**
	 * @method setOperatorMoCAEnable
	 */
	function setOperatorMoCAEnable(isEnabled) {
		preferences.set($N.app.constants.MOCA_FEATURE, isEnabled);

		if (isEnabled) {
			$N.apps.util.EventManager.fire("MoCAEnabled");
		} else {
			$N.apps.util.EventManager.fire("MoCADisabled");
		}
	}

	/**
	 * @method setOperatorPIPEnable
	 */
	function setOperatorPIPEnable(isEnabled) {
		preferences.set($N.app.constants.PIP_FEATURE, isEnabled ? "true" : "false");
		isPipActivated = false;
		if (isEnabled) {
			$N.apps.util.EventManager.fire("PIPEnabled");
		} else {
			$N.apps.util.EventManager.fire("PIPDisabled");
		}
	}

	/**
	 * @method _isMoCAEnabled
	 * @private
	 */
	function _isMoCAEnabled() {
		return (preferences.get($N.app.constants.MOCA_FEATURE) === "true" ? true : false);
	}


	/**
	 * @method isPIPEnabled
	 */
	function isPIPEnabled() {
		return preferences.get($N.app.constants.PIP_FEATURE) === "true" ? true : false;
	}

	/**
	 * This function is a development function to allow us to manually turn on and turn off DVR & VOD by pressing
	 *  - BLUE followed by 1 on RCU = Turn ON DVR & VOD
	 *  - BLUE followed by 2 on RCU = Turn OFF DVR & VOD
	 *  - BLUE followed by 5 on RCU = Turn ON WHPVR
	 *  - BLUE followed by 6 on RCU = Turn OFF WHPVR
	 *  - BLUE followed by 7 on RCU = Turn ON StartOver & CatchUp
	 *  - BLUE followed by 8 on RCU = Turn OFF StartOver & CatchUp
	 *  - BLUE followed by 9 on RCU = Toggle ON/OFF MoCA
	 *  - BLUE followed by INFO on RCU = Toggle ON/OFF PIP
	 *
	 * @method enableFeature
	 * @param {String} key
	 */
	function enableFeature(key) {
		log("enableFeature", "Enter");
		if ($N.app.Config.getConfigValue("usageid.manual.override") !== "true") {
			log("enableFeature", "Exit - disabled in Config.js");
			return;
		}

		var keys = $N.apps.core.KeyInterceptor.getKeyMap();
		if (key === keys.KEY_BLUE) {
			_editingUsageId = true;
		} else if (_editingUsageId) {
			switch (key) {
			case keys.KEY_ONE:
				log("enableFeature", "enable PVR/VOD");
				setOperatorPVREnabled();
				setOperatorVODEnabled();
				_editingUsageId = false;
				break;
			case keys.KEY_TWO:
				log("enableFeature", "disable PVR/VOD");
				setOperatorPVRDisabled();
				setOperatorWHPVREnabled(false);
				setOperatorVODDisabled();
				_editingUsageId = false;
				break;
			case keys.KEY_THREE:
				log("enableFeature", "enable Media playback");
				setOperatorMediaPlaybackEnable(true);
				_editingUsageId = false;
				break;
			case keys.KEY_FOUR:
				log("enableFeature", "disable Media playback");
				setOperatorMediaPlaybackEnable(false);
				_editingUsageId = false;
				break;
			case keys.KEY_FIVE:
				log("enableFeature", "enable WHPVR");
				setOperatorWHPVREnabled(true);
				_editingUsageId = false;
				break;
			case keys.KEY_SIX:
				log("enableFeature", "disable WHPVR");
				setOperatorWHPVREnabled(false);
				_editingUsageId = false;
				break;
			case keys.KEY_SEVEN:
				log("enableFeature", "enable CatchUp/StartOver");
				setOperatorCatchUpEnable(true);
				setOperatorStartOverEnable(true);
				_editingUsageId = false;
				break;
			case keys.KEY_EIGHT:
				log("enableFeature", "disable CatchUp/StartOver");
				setOperatorCatchUpEnable(false);
				setOperatorStartOverEnable(false);
				_editingUsageId = false;
				break;
			case keys.KEY_NINE:
				log("enableFeature", "enable/disable MoCA");
				setOperatorMoCAEnable(!_isMoCAEnabled());
				_editingUsageId = false;
				break;
			case keys.KEY_INFO:
				log("enableFeature", "enable/disable PIP");
				setOperatorPIPEnable(!isPIPEnabled());
				_editingUsageId = false;
				break;
			}
		}
		log("enableFeature", "Exit");
	}

	/**
	 * @method setOperatorDefault
	 */
	function setOperatorDefault() {
		if ($N.app.Config.getConfigValue("faked.playback") === "true") {
			setUsageId(USAGES.LIVE.PVR_OFF_VOD_ON);
		} else {
			setUsageId(USAGES.LIVE.PVR_OFF_VOD_OFF);
		}

		socuFeatureStatusChanged();
	}

	/**
	 * initialise the NETOperator
	 * @method usageIdChangedCallback
	 */
	function usageIdChangedCallback() {
		_usageId = getUsageId();
		updateDeviceStatus(USAGES.isPVREnabled());
		$N.app.PVRCapability.setOperatorPVR(USAGES.isPVREnabled());
		$N.apps.util.EventManager.fire("usageIdChanged");

		socuFeatureStatusChanged();
		vodFeatureStatusChanged();
	}

	/**
	 * initialise the NETOperator
	 * @method initialise
	 */
	function initialise() {
		_usageId = getUsageId();
		if (!_usageId || _usageId.error || _usageId < USAGES.LIVE.PVR_OFF_VOD_ON || _usageId > USAGES.TEST.PVR_OFF_VOD_ON) {
			setOperatorDefault();
		}
		preferences.monitorValue($N.app.constants.SYSTEM_NETWORK_USAGEID, usageIdChangedCallback, null, true);
		updateDeviceStatus(USAGES.isPVREnabled());
		$N.app.PVRCapability.setOperatorPVR(USAGES.isPVREnabled());

		socuFeatureStatusChanged();
		vodFeatureStatusChanged();
	}

	/**
	 * @method isWHPVREnabled
	 */
	function isWHPVREnabled() {
		return $N.platform.btv.WHPVRManager.isEnabled();
	}

	/**
	 * @method isCatchUpEnabled
	 */
	function isCatchUpEnabled() {
		return featureCU;
	}

	/**
	 * @method isStartOverEnabled
	 */
	function isStartOverEnabled() {
		return featureSO;
	}

	/**
	 * @method isVODRecommendationEnabled
	 */
	function isVODRecommendationEnabled() {
		return (preferences.get($N.app.constants.VOD_RECOMMENDATION_FEATURE) === "true" ? true : false);
	}

	/**
	 * @method isPIPActive
	 */
	function isPIPActive() {
		return isPipActivated;
	}

	/* Public API */
	return {
		/**
		 * @method setIsPIPActive
		 * @param {Boolean} value
		 */
		setIsPIPActive: function (value) {
			isPipActivated = value;
		},

		initialise: initialise,
		enableFeature: enableFeature,
		getUsageId: getUsageId,
		isVODEnabled: USAGES.isVODEnabled,
		isPVREnabled: USAGES.isPVREnabled,
		isWHPVREnabled: isWHPVREnabled,
		isStartOverEnabled: isStartOverEnabled,
		isCatchUpEnabled: isCatchUpEnabled,
		getMediaPlaybackFeatureStatus: getMediaPlaybackFeatureStatus,
		isMoCAEnabled: _isMoCAEnabled,
		isPIPEnabled: isPIPEnabled,
		isVODRecommendationEnabled: isVODRecommendationEnabled,
		isPIPActive: isPIPActive
	};
}());
