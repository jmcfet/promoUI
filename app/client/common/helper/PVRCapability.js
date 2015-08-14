/**
 * This is an utility class to manage connected devices attached to the STB.
 * Ie USB / Network drives will talk to this class so that the application needs to do is raise listen to
 * events that will fire when the PVR state changes and updates the UI acordingly.
 * @class $N.app.PVRCapability
 * @author		Andrew Price
 * @username	anprice
 *
 */
(function ($N) {
	$N.app = $N.app || {};
	$N.app.PVRCapability = (function () {

		var log = new $N.apps.core.Log("Helper", "PVRCapability"),
			Preferences = $N.platform.system.Preferences,
			Constants = $N.app.constants,
			updateService = null,
			state = {
				capability: Constants.PVR_CAPABILITY.DISCONNECTED,
				mediaId: null,
				operatorPVREnabled: false,
				isEnabled: function () {
					return (state.operatorPVREnabled) && (state.capability === Constants.PVR_CAPABILITY.ENABLED) && $N.platform.system.Device.isHardDriveAvailable();
				},
				isConnected: function () {
					return (state.operatorPVREnabled) && (state.capability === Constants.PVR_CAPABILITY.ENABLED || state.capability === Constants.PVR_CAPABILITY.CONNECTED);
				}
			};

		/**
		 * Although we might have a hard disk attached, we need to confirm that it is available for PVR.
		 * We cannot assume that this will always be the case
		 * @method isHardDriveAvailable
		 * @return {Boolean}
		 */

		function isHardDriveAvailable() {
			return $N.platform.system.Device.isHardDriveAvailable();
		}

		/**
		 * @method isOperatorPVREnabled
		 * @return {Boolean}
		 */
		function isOperatorPVREnabled() {
			return state.operatorPVREnabled;
		}

		/**
		 * @method isPVRActive
		 * @param {Object} state object
		 */
		function isPVRConnected() {
			return state.isConnected();
		}

		/**
		 * @method isPVREnabled
		 * @param {Boolean} this is workaround to judge PVR is enabled or not in different context,
		 * true in "SETTING" or "PORTAL" or "LIBRARY" context, otherwise none for other contexts.
		 * Because currently in portal/setting/library, recording item should be displayed even if one remote server exist,
		 * while in miniguide/mosaic/agora/guide, record option should be hide if record to local but no usb or
		 * remote to invalid remote server.
		 * In future will remove this param by using more friendly way to ask user to choose in case no valid remote server.
		 * @return {Boolean}
		 */
		function isPVREnabled(flag) {
			log("isPVREnabled", "Enter");
			if (!flag
					&& (($N.platform.btv.WHPVRManager.isLocalRecordServer() && state.isEnabled())
					|| $N.platform.btv.WHPVRManager.isRemoteRecordServerValid())) {
				log("isPVREnabled", "Exit 1, returning true");
				return true;
			}
			if (flag
					&& ((state.isEnabled())
							|| $N.platform.btv.WHPVRManager.hasRemoteServers())) {
				log("isPVREnabled", "Exit 2, returning true");
				return true;
			}
			log("isPVREnabled", "Exit 3, returning false");
			return false;
		}

		/**
		 * @method stopUpdateServiceInterval
		 * @private
		 */
		function stopUpdateServiceInterval() {
			if (updateService) {
				clearInterval(updateService);
				updateService = null;
			}
		}

		/**
		 * @method stopUpdateServiceInterval
		 * @param {Function} callback
		 * @private
		 */
		function startUpdateServiceInterval(callback) {
			var INTERVAL_IN_MS = 2000;
			stopUpdateServiceInterval();
			updateService = setInterval(callback, INTERVAL_IN_MS);
		}

		/**
		 * @method checkHardDiskAvailability
		 * @private
		 */
		function checkHardDiskAvailability() {
			log("checkHardDiskAvailability", "Enter");
			var i = 0,
				hardDiskAvailableCallback = function () {
					log("checkHardDiskAvailability", "hardDiskAvailableCallback, Enter");
					if (i > 20) {
						log("hardDiskAvailableCallback", "PVRDisabled");
						stopUpdateServiceInterval();
						$N.apps.util.EventManager.fire("PVRDisabled", state);
					} else if (isHardDriveAvailable()) {
						log("hardDiskAvailableCallback", "PVREnabled");
						stopUpdateServiceInterval();
						state.capability = Constants.PVR_CAPABILITY.ENABLED;
						$N.apps.util.EventManager.fire("PVREnabled", state);
					}
					i += 1;
					log("checkHardDiskAvailability", "hardDiskAvailableCallback, Exit");
				};
			if (isHardDriveAvailable()) {
				log("checkHardDiskAvailability", "PVREnabled");
				state.capability = Constants.PVR_CAPABILITY.ENABLED;
				$N.apps.util.EventManager.fire("PVREnabled", state);
			} else {
				startUpdateServiceInterval(hardDiskAvailableCallback);
			}
			log("checkHardDiskAvailability", "Exit");
		}

		/**
		 * @method setPVRCapabilityState
		 * @param {Number} capability
		 * @param {String} mediaId The Hex Id of the currently selected Media
		 */
		function setPVRCapabilityState(capability, mediaId) {
			log("setPVRCapabilityState", "Enter");
			if (capability) {
				state.capability = capability;
			}

			if (state.capability === Constants.PVR_CAPABILITY.DISCONNECTED) {
				log("setPVRCapabilityState", "capability === PVR_CAPABILITY.DISCONNECTED");
				state.mediaId = null;
			} else if (mediaId) {
				log("setPVRCapabilityState", "capability !== PVR_CAPABILITY.DISCONNECTED");
				state.mediaId = mediaId;
			}

			if (state.mediaId !== null && (isPVRConnected() || isPVREnabled())) {
				checkHardDiskAvailability();
			} else {
				$N.apps.util.EventManager.fire("PVRDisabled", state);
			}
			log("setPVRCapabilityState", "Exit");
		}

		/**
		 * @method setStateOperatorPVR
		 * @param {Boolean} isEnabled
		 */
		function setOperatorPVR(isEnabled) {
			state.operatorPVREnabled = isEnabled;
			setPVRCapabilityState();
		}

		/**
		 * @method subscribeToPVRCapabilitiesEvent
		 */
		function subscribeToPVRCapabilityEvent(successCallback, failureCallback, context) {
			context = context || this;
			failureCallback = failureCallback || successCallback || null;
			var array = [];
			array.push($N.apps.util.EventManager.subscribe("PVREnabled", successCallback, context));
			array.push($N.apps.util.EventManager.subscribe("PVRDisabled", failureCallback, context));
			return array;
		}

		/**
		 * @method unsubscribeFromPVRCapabilityEvent
		 */
		function unSubscribeFromPVRCapabilityEvent(array) {
			array = array || [];
			var i = 0;
			if (array.length) {
				for (i = 0; i < array.length; i++) {
					$N.apps.util.EventManager.unSubscribe(array[i]);
				}
			}
			return [];
		}

		/**
		 * @method subscribeWHPvrDeviceUpdate
		 */
		function subscribeWHPvrDeviceUpdate(callback) {
			$N.platform.btv.WHPVRManager.addEventListener("getDevicesOK", callback);
		}

		/**
		 * @method unSubscribeWHPvrDeviceUpdate
		 */
		function unSubscribeWHPvrDeviceUpdate(callback) {
			$N.platform.btv.WHPVRManager.removeEventListener("getDevicesOK", callback);
		}

		/**
		 * This method gets the media of the currently selected HARD DISK
		 * @method getAllConnectedMediaOKListener
		 */
		function getAllConnectedMediaOKListener(e) {
			log("getAllConnectedMediaOKListener", "Enter");
			var mediaId = null,
				isMediaPlayback = false,
				i;
			if (e.media && e.media.length) {
				for (i = 0; i < e.media.length; i++) { //loop through all the connected mediums and get their capabilities
					mediaId = e.media[i].mediumID || null;
					if (mediaId) {
						log("getAllConnectedMediaOKListener", "With mediaId: " + mediaId);
						/*handlePlaybackOnBoot - returns true if USB is available for mediaplayback.
						 * returns false if not and can be used for DVR.
						 */
						isMediaPlayback = $N.app.HotPlug.handlePlaybackOnBoot(e, e.media[i]);
						if (!isMediaPlayback) {
							// If Media is not enabled for play back, check if we can use it for DVR
							$N.app.HotPlug.handlePVROnBoot(e.media[i]);
						}
					} else { //If there is no medium Id available, disable the PVR capability.
						log("getAllConnectedMediaOKListener", "No mediaId");
						setPVRCapabilityState(Constants.PVR_CAPABILITY.DISCONNECTED);
					}
				}
			}
			log("getAllConnectedMediaOKListener", "Exit");
		}

		/**
		 * This method gets the media of the currently selected HARD DISK
		 * @method getAllConnectedMediaFailedListener
		 */
		function getAllConnectedMediaFailedListener(e) {
			log("getAllConnectedMediaFailedListener", "Enter");
			setPVRCapabilityState(Constants.PVR_CAPABILITY.DISCONNECTED);
			log("getAllConnectedMediaFailedListener", "Exit");
		}

		/**
		 * @method getCurrentMediaId
		 */
		function getCurrentMediaId() {
			return state.mediaId;
		}

		return {
			/**
			 * initialise the PVR Capability Class
			 * @method initialise
			 */
			initialise: function () {
				log("initialise", "Enter");
				var mediaLibrary = CCOM.MediaLibrary;
				mediaLibrary.addEventListener("getAllConnectedMediaOK", getAllConnectedMediaOKListener);
				mediaLibrary.addEventListener("getAllConnectedMediaFailed", getAllConnectedMediaFailedListener);
				// Gets the mediumID of the hard disk on boot ASYNC see (getAllConnectedMediaOKListener)
				mediaLibrary.getAllConnectedMedia();
				log("initialise", "Exit");
			},
			setPVRCapabilityState: setPVRCapabilityState,
			setOperatorPVR: setOperatorPVR,
			getCurrentMediaId: getCurrentMediaId,
			subscribeToPVRCapabilityEvent: subscribeToPVRCapabilityEvent,
			unSubscribeFromPVRCapabilityEvent: unSubscribeFromPVRCapabilityEvent,
			isPVREnabled: isPVREnabled,
			isOperatorPVREnabled: isOperatorPVREnabled,
			isHardDriveAvailable: isHardDriveAvailable,
			subscribeWHPvrDeviceUpdate: subscribeWHPvrDeviceUpdate,
			unSubscribeWHPvrDeviceUpdate: unSubscribeWHPvrDeviceUpdate
		};
	}());

}($N || {}));
