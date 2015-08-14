/**
 * This class helps in retrieving advert meta-data for a video asset from the SDP. It's meant to be used by the
 * `$N.platform.output.AdvertManager` class but can really be used by any class that wants advert meta-data.
 * @class $N.services.sdp.Adverts
 * @static
 * @singleton
 * @since SDP 3.4
 * @requires $N.apps.core.Log
 * @requires $N.services.sdp.ServiceFactory
 * @requires JQuery
 */

/* global define */
//TODO: Remove AdService stub when AdService available from SDP
define('jsfw/services/sdp/Adverts',
	[
		'jsfw/apps/core/Log',
		'jsfw/services/sdp/ServiceFactory'
	],
	function (Log, ServiceFactory, AdService) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};

		//TODO: remove one server side components are in place
		var AdService = window.AdService || (function () {
			return {
				getPreAdvertisements: function (context, callback, failcallback, assetuid) {
					var urlMap = {1: 'http://localhost/sdk/client/testPages/AdSignalling/sdp1.json', 2: 'http://localhost/sdk/client/testPages/AdSignalling/sdp2.json', 3: 'http://localhost/sdk/client/testPages/AdSignalling/sdp3.json', 4: 'http://localhost/sdk/client/testPages/AdSignalling/sdp4.json'};
					if (urlMap[assetuid]) {
						$.getJSON(urlMap[assetuid], function (data, status) {
							// pass the data to the callback
							if (callback) {
								callback(data);
							}
						});
					} else {
						if (callback) {
							callback();
						}
					}
				}
			};
		}());

		$N.services.sdp.Adverts = (function () {
			var AdManagementService = AdService; //$N.services.sdp.ServiceFactory.get('AdManagementService'), //TODO: change one server side components are in place
				log = new Log('sdp', 'Adverts');

			function getAdInfoForAsset(asset, callback) {
				var advertInfo = [];
				if (callback) {
					if (asset) {
						log('getAdInfoForAsset', 'calling the AdService');

						//Actual calls need to be finalised after confirmation with SDP.
						AdManagementService.getPreAdvertisements(this,
							function (data) {
								callback(data && data.resultCode === '0' ? data.result.adverts : advertInfo);
							},
							function () {
								log("getAdInfoForAsset", "adverts sdp call failed");
								callback(advertInfo);
							},
							asset.uid);
					} else {
						callback(advertInfo);
					}
				} else {
					log('getAdInfoForAsset', 'No callback passed in', Log.LOG_ERROR);
				}
			}

			return {

				/**
				 * For a given asset, returns the specified adverts from SDP
				 * @method getAdInfoForAsset
				 * @param {Object} asset the VOD asset for which ads are required
				 * @param {Function} callback function that's to be invoked when the ad data is retrieved.
				 * This function should expect exactly one parameter, which will be an array of adverts in JSON
				 * format. The actual structure of the data can be found in the SDP documentation.
				 * @async
				 */
				getAdInfoForAsset: getAdInfoForAsset,

				/**
				 * Advert roll-types. Possible values are `PRE_ROLL`, `MID_ROLL`, `POST_ROLL`, `OVERLAY` and
				 * `COMPANION`
				 * @property {Object} ROLL_TYPE
				 * @readonly
				 */
				ROLL_TYPE: {
					'PRE_ROLL': 'PRE_ROLL',
					'MID_ROLL': 'MID_ROLL',
					'POST_ROLL': 'POST_ROLL',
					'OVERLAY': 'OVERLAY',
					'COMPANION': 'COMPANION'
				}
			};

		}());
		return $N.services.sdp.Adverts;
	}
);