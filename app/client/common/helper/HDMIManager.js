/**
 * HDMIManager manages the HDMI events fired by the middleware and presents
 * them in a consistent manner to the UI.
 * @class $N.app.HDMIManager
 * @author rvaughan
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.HDMIManager = (function () {
		/**
		 * This variable indicates if the manager has already been
		 * initialised or not. Used to prevent accidental double
		 * initialisation.
		 */
		var initialised = false,
			/**
			 * This variable holds the current audio capability type
			 * for the system.
			 */
			currentAudioCapabilities = 0,
			log = new $N.apps.core.Log("Helper", "HDMIManager");

		/**
		 * This function is called back by the middleware whenever the
		 * HDMI network changes.
		 *
		 * @method hdmiNetworkChanged
		 * @private
		 * @param {e} The event that has occured.
		 */
		function hdmiNetworkChanged(e) {
			log("hdmiNetworkChanged", "Enter");
			if (!e.error) {
				switch (e.eventType) {
				case CCOM.System.HDMI_EVENT_SINK_CONNECTED:
				case CCOM.System.HDMI_EVENT_SINK_DISCONNECTED:
					if (CCOM.System.hdmiAudioType !== currentAudioCapabilities) {
						currentAudioCapabilities = CCOM.System.hdmiAudioType;
						$N.apps.util.EventManager.fire("audioCapabilitiesUpdated");
					}
					break;
				}
			}
			log("hdmiNetworkChanged", "Exit");
		}

		return {
			/**
			 * This function initialises the HDMI manager class, and should
			 * only be called once.
			 *
			 * @method initialise
			 * @public
			 */
			initialise : function () {
				if (!initialised) {
					currentAudioCapabilities = CCOM.System.hdmiAudioType;
					CCOM.System.addEventListener("onHdmiEvent", hdmiNetworkChanged);
				}
			},

			/**
			 * Retrieves the current HDMI audio capabilities of the system.
			 *
			 * @method getCurrentAudioCapabilities
			 * @public
			 * @returns The current HDMI audio capabilities of the system.
			 */
			getCurrentAudioCapabilities : function () {
				return currentAudioCapabilities;
			}
		};
	}());

}($N || {}));