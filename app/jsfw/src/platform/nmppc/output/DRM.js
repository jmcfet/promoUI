/**
 * Contains logic for deciding which DRM should be used for decrypting content
 * Must be instantiated with a config object containing platform and playoutManager properties
 * playContent method can be called to play back content
 *
 * e.g.
 *
 *     DRM = new $N.platform.output.DRM({platform: "IOS", playoutManager: playerInstance});
 *     DRM.playContent(contentMapperInstance);
 *
 * @class $N.platform.output.DRM
 * @constructor
 * @param {Object} config Must contain the following properties:
 *
 *     playoutManager {Object}
 *     platform {String}
 * @author Gareth Stacey
 */
/*global drmAgent*/

define('jsfw/platform/output/DRM',
    [
    	'jsfw/apps/core/Log',
    	'jsfw/services/sdp/PRM',
    	'jsfw/apps/util/Util'
    ],
	function (Log, PRM, Util) {
		'use strict';

		var log = new $N.apps.core.Log("output", "DRM"),
			player,
			platform,
			errorListeners = [],
			transformedLicence = null,
			content,
			TDRM_SESSION_STATUS = {
				SESSION_ENTITLEMENT_MISSING: 0,
				SESSION_ENTITLEMENT_MISSING_: 1, //returned on older versions of NMP
				SESSION_OPENED: 10,
				SESSION_FAILED: 100,
				SESSION_FAILED_NOT_ALLOWED: 101
			},
			TDRM_ACCESS = {
				ACCESS_GRANTED: 0,
				ACCESS_DENIED: 100,
				ACCESS_DENIED_EXPIRED_ENTITLEMENT: 101,
				ACCESS_DENIED_INVALID_LICENSE: 102
			};

		function DRM(config) {
			var me = this;
			platform = config.platform;
			player = config.playoutManager;
			if (window.drmAgent) {
				if (this._isTabletDevice()) {
					DRM._getDRMSessionCallback = {
						sessions: function (sessions) {
							me._checkEntitlement(sessions);
						}
					};
					DRM._drmSessionsChangedCallback = {
						sessionsChanged: function (sessions) {
							drmAgent.getDrmSessions("$N.platform.output.DRM._getDRMSessionCallback");
						}
					};
					drmAgent.registerEventListener("$N.platform.output.DRM._drmSessionsChangedCallback");
				} else if (platform === "PC") {
					drmAgent.sessionsChanged.connect(function () {
						me._sessionsChangedListener();
					});
				} else if (platform === "NMP_PLUGIN") {
					if (navigator.userAgent.indexOf("MSIE") === -1 && navigator.userAgent.indexOf("Trident") === -1) {
						drmAgent.addEventListener("sessionsChanged", function () {
							me._sessionsChangedListener();
						}, false);
					} else {
						drmAgent.attachEvent("onsessionsChanged", function () {
							me._sessionsChangedListener();
						});
					}
				}
			}
		}

		var proto = DRM.prototype;

		/*
		 * Private Methods
		 */

		/**
		 * Fires the error listeners with the given payload
		 * @method _fireEventListeners
		 * @private
		 * @param {String} payload
		 */
		proto._fireErrorListeners = function (payload) {
			var i;
			for (i = 0; i < errorListeners.length; i++) {
				errorListeners[i](payload);
			}
		};

		/**
		 * Returns true if running on IOS or ANDROID, false otherwise
		 * @method _isTabletDevice
		 * @private
		 * @return {Boolean}
		 */
		proto._isTabletDevice = function () {
			if (platform === "IOS" || platform === "ANDROID") {
				return true;
			}
			return false;
		};

		/**
		 * Sets the entitlement for the given session
		 * @method _setEntitlement
		 * @private
		 * @param {Object} session
		 * @param {String} dcm
		 * @param {String} dmm
		 */
		proto._setEntitlement = function (session, dcm, dmm) {
			if (platform === "ANDROID") {
				drmAgent.setEntitlement(session.entitlement.contentName, dcm, dmm);
			} else if (platform === "IOS") {
				session.entitlement.setEntitlement(dcm, dmm);
			} else {
				drmAgent.setEntitlement(session.entitlementUrl, dcm, dmm);
			}
		};

		/**
		 * If the dmm and dcm have not already been cached then will request to sdp
		 * to transform lcm to dcm and dmm and will then set the entitlement for the content
		 * @method _fetchGatewayEntitlement
		 * @private
		 * @param {Object} session
		 */
		proto._fetchGatewayEntitlement = function (session) {
			log("_fetchGatewayEntitlement", "Enter");
			var entPayload = session.entitlement.entitlementPayloadForServer,
				me = this,
				successCallback = function (response) {
					var actualResponse = response.response;
					// populate the entitlement object with the DCM and DMM received from the server
					if (actualResponse && actualResponse.dcm && actualResponse.dmm) {
						transformedLicence = {
							dcm: actualResponse.dcm,
							dmm: actualResponse.dmm
						};
						me._setEntitlement(session, actualResponse.dcm, actualResponse.dmm);
					} else {
						log("_fetchGatewayEntitlement", "Unable to retrieve valid license data.");
						me._fireErrorListeners(me.ErrorType.INVALID_LICENSE_DATA);
					}
				},
				failureCallback = function (response) {
					log("_fetchGatewayEntitlement", "Failed to get entitlements");
					me._fireErrorListeners(me.ErrorType.ENTITLEMENT_RETRIEVAL_FAILED);
				};

			if (!transformedLicence) {
				if (content.getDRMId()) {
					$N.services.sdp.PRM.transformEntitlements(successCallback, failureCallback, $N.env.playerVersion, $N.env.playerType, entPayload, content.getDRMId());
				} else {
					me._fireErrorListeners(me.ErrorType.INVALID_LICENSE_DATA);
				}
			} else {
				me._setEntitlement(session, transformedLicence.dcm, transformedLicence.dmm);
			}
			log("_fetchGatewayEntitlement", "Exit");
		};

		/**
		 * Makes a request to PRM class in SDP module to fetch entitlements for the content.
		 * Once retrieved then sets the entitlement on the drmAgent
		 * @method _fetchEntitlement
		 * @private
		 * @param {Object} session
		 */
		proto._fetchEntitlement = function (session) {
			log("_fetchEntitlement", "Enter");
			var entPayload = session.entitlement.entitlementPayloadForServer,
				me = this,
				successCallback = function (response) {
					var actualResponse = response.response;
					// populate the entitlement object with the DCM and DMM received from the server
					if (actualResponse && actualResponse.dcm && actualResponse.dmm) {
						me._setEntitlement(session, actualResponse.dcm, actualResponse.dmm);
					} else {
						log("_fetchEntitlement", "Unable to retrieve valid license data.");
						me._fireErrorListeners(me.ErrorType.INVALID_LICENSE_DATA);
					}
				},
				failureCallback = function (response) {
					log("_fetchEntitlement", "Failed to get entitlements");
					me._fireErrorListeners(me.ErrorType.ENTITLEMENT_RETRIEVAL_FAILED);
				};
			$N.services.sdp.PRM.fetchNMPEntitlements(successCallback, failureCallback, $N.env.playerVersion, $N.env.playerType, entPayload, content.getDRMId());
			log("_fetchEntitlement", "Exit");
		};

		/**
		 * Fired when running on PC platform and sessions change
		 * @method _sessionsChangedListener
		 * @private
		 * @param {Object} session
		 */
		proto._sessionsChangedListener = function () {
			log("_sessionsChangedListener", "Enter");
			var sessions;
			if (platform === "PC") {
				sessions = drmAgent.DrmSessions;
			} else {
				sessions = drmAgent.getDrmSessions();
			}
			this._checkEntitlement(sessions);
			log("_sessionsChangedListener", "Exit");
		};

		/**
		 * Checks the entitlement of the given sessions and fetches entitlement
		 * if access not granted or begins playback if access is granted
		 * @method _checkEntitlement
		 * @private
		 * @param {Array} sessions
		 */
		proto._checkEntitlement = function (sessions) {
			log("_checkEntitlement", "Enter");
			var me = this;
			if (sessions[0]) {
				if (sessions[0].access === TDRM_ACCESS.ACCESS_DENIED_EXPIRED_ENTITLEMENT) {
					log("_checkEntitlement", "License expired");
					this._fireErrorListeners(this.ErrorType.LICENSE_EXPIRED);
				} else {
					switch (sessions[0].status) {
					case TDRM_SESSION_STATUS.SESSION_ENTITLEMENT_MISSING:
					case TDRM_SESSION_STATUS.SESSION_ENTITLEMENT_MISSING_:
						if (sessions[0].access !== TDRM_ACCESS.ACCESS_GRANTED) {
							if (content.getLicenseMethod() === "TRANSFORM") {
								this._fetchGatewayEntitlement(sessions[0]);
							} else if (content.getLicenseMethod() === "FETCH_ENTITLEMENT") {
								this._fetchEntitlement(sessions[0]);
							}
						}
						break;
					case TDRM_SESSION_STATUS.SESSION_OPENED:
						if (sessions[0].access === TDRM_ACCESS.ACCESS_GRANTED) {
							if (player.autoplay) {
								player.play();
							}
						}
						break;
					case TDRM_SESSION_STATUS.SESSION_FAILED:
					case TDRM_SESSION_STATUS.SESSION_FAILED_NOT_ALLOWED:
						this._fireErrorListeners(this.ErrorType.SESSION_FAILED);
						break;
					}
				}
			}
			log("_checkEntitlement", "Exit");
		};

		/*
		 * Public API
		 */

		/**
		 * Call to begin playback of given content
		 * @method playContent
		 * @param {Object} playableContent Technical Asset or Service object
		 */
		proto.playContent = function (playableContent) {
			log("playContent", "Enter");
			content = playableContent;
			player.src = content.getUri();
			log("playContent", "Exit");
		};

		/**
		 * Registers a listener that will be fired upon an error
		 * @method registerErrorListener
		 * @param {Function} listener
		 */
		proto.registerErrorListener = function (listener) {
			log("registerErrorListener", "Enter");
			if ($N.apps.util.Util.arrayContains(errorListeners, listener)) {
				log("registerErrorListener", "Listener already registered.");
			} else {
				errorListeners.push(listener);
			}
			log("registerErrorListener", "Exit");
		};

		/**
		 * Unregisters the error listener that was previously registered
		 * @method unregisterErrorListener
		 * @param {Function} listener
		 */
		proto.unregisterErrorListener = function (listener) {
			log("unregisterErrorListener", "Enter");
			var i;
			for (i = 0; i < errorListeners.length; i++) {
				if (errorListeners[i] === listener) {
					errorListeners.splice(i, 1);
					break;
				}
			}
			log("unregisterErrorListener", "Exit");
		};

		/**
		 * Defines constants for error types,
		 * one of LICENSE_EXPIRED, INVALID_LICENSE_DATA,
		 * ENTITLEMENT_RETRIEVAL_FAILED, SESSION_FAILED
		 * @property {Number} ErrorType
		 */
		proto.ErrorType = {
			LICENSE_EXPIRED: 9001,
			INVALID_LICENSE_DATA: 9002,
			ENTITLEMENT_RETRIEVAL_FAILED: 9003,
			SESSION_FAILED: 9004
		};

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.DRM = DRM;
		return DRM;
	}
);