/**
 * This class acquires content licences from the SDP
 * @class $N.services.sdp.PRM
 * @requires $N.apps.core.Log
 * @requires $N.services.sdp.ServiceFactory
 * @author rjevons, doldham
 * @singleton
 */
/* global define */
define('jsfw/services/sdp/PRM',
	[
		'jsfw/services/sdp/ServiceFactory'
	],
	function (ServiceFactory) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};

		$N.services.sdp.PRM = (function () {
			var licenseService;
			var codService;

			/*
			 * Public Methods
			*/
			return {
				/**
				 * Calls the success callback when a licence has been successfully acquired returns false
				 * if there are issues with obtaining a licence.
				 *
				 * @method getLicence
				 * @param {Object} e The CA event.
				 * @return {boolean} true if licence acquired.
				 */
				getLicence: function (successCallback, failureCallback, casContentId, nuid, cts) {
					licenseService = $N.services.sdp.ServiceFactory.get("LicenseService");
					if (licenseService && licenseService.getLicenseWithAdditionalInfo) {
						licenseService.getLicenseWithAdditionalInfo(
							this,
							successCallback,
							failureCallback,
							casContentId,
							"",
							nuid,
							cts
						);
						return true;
					}
					this._log("getLicence", "Unable to make a call to LicenseService.getLicenseWithAdditionalInfo().", "warn");
					return false;
				},
				/**
				 * Purchases content and retrieves license for playback
				 * @method purchaseGetLicense
				 * @param {Function} successCallback function to be called if the SDP call is successful
				 * @param {Function} failureCallback function to be called if the SDP call has failed
				 * @param {String} casContentId unique identifier of the content in CAS
				 * @param {String} nuid [description]
				 * @param {String} cts [description]
				 * @param {String} accountUserId user id
				 * @param {String} casContentType content type
				 * @param {String} productId product id
				 * @param {String} locale user's locale
				 * @return {Boolean} true if the call to the SDP was made, false otherwise
				 */
				purchaseGetLicense: function (successCallback, failureCallback, casContentId, nuid, cts, accountUserId, casContentType, productId, locale) {
					codService = $N.services.sdp.ServiceFactory.get("CODService");
					if (codService && codService.purchaseContentAndGetLicenseWithAdditionalInfo) {
						codService.purchaseContentAndGetLicenseWithAdditionalInfo(
							this,
							successCallback,
							failureCallback,
							accountUserId,
							casContentId,
							casContentType,
							productId,
							locale,
							"",//smartCardId
							"",
							nuid,
							cts
						);
						return true;
					}
					this._log("sendVODPlayoutRequest", "Unable to make a call to CODService.purchaseContentAndGetLicenseWithAdditionalInfo().", "warn");
					return false;
				},

				/**
				 * Retrieves entitlement for NMP playback
				 * @method fetchNMPEntitlements
				 * @param {Function} successCallback
				 * @param {Function} failureCallback
				 * @param {String} playerVersion
				 * @param {String} playerType
				 * @param {String} entitlementPayload
				 * @param {String} casId
				 */
				fetchNMPEntitlements: function (successCallback, failureCallback, playerVersion, playerType, entitlementPayload, casId) {
					$N.services.sdp.ServiceFactory.get("NmpExtendedService").getEntitlements(this, successCallback, failureCallback, playerVersion, playerType, entitlementPayload, casId);
				},

				/**
				 * Transforms LCM to EMM and ECM
				 * @method transformEntitlements
				 * @param {Function} successCallback
				 * @param {Function} failureCallback
				 * @param {String} playerVersion
				 * @param {String} playerType
				 * @param {String} opaqueData
				 * @param {String} lcm
				 */
				transformEntitlements: function (successCallback, failureCallback, playerVersion, playerType, opaqueData, lcm) {
					$N.services.sdp.ServiceFactory.get("NmpExtendedService").transformEntitlements(this, successCallback, failureCallback, playerVersion, playerType, opaqueData, lcm);
				}
			};
		}());
		return $N.services.sdp.PRM;
	}
);
