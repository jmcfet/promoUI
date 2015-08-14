/**
 * This class helps in retrieving adverts from a VAST-compliant ad server. It converts the XML data retrieved
 * into JSON, and is used by `$N.platform.output.AdvertManager`.
 *
 * This class is typically expected to be used by client applications that implement their own advert
 * management instead of using `$N.platform.output.PlayoutManager`.
 * @static
 * @singleton
 * @class $N.services.adverts.VASTDataAdapter
 * @requires $N.apps.core.Log
 * @requires JQuery
 */
/*global define */

 //TODO: error checking

define('jsfw/services/adverts/VASTDataAdapter',
	[
		'jsfw/apps/core/Log'
	],
	function (Log) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.adverts = $N.services.adverts || {};

		$N.services.adverts.VASTDataAdapter = (function () {
			var log = new $N.apps.core.Log('sdp', 'VASTDataAdapter');

			/**
			 * Converts the time duration returned by VAST servers into milliseconds
			 * @param  {String} timeString time duration from VAST
			 * @method convertToMs
			 * @private
			 * @return {Number} Time in milliseconds
			 */
			function convertToMs(timeString) {
				var timeArray,
					hh,
					mm,
					mmm = 0,
					ss,
					hToMs,
					mToMs,
					sToMs;
				timeArray = timeString.split(':');
				hh = parseInt(timeArray[0], 10);
				mm = parseInt(timeArray[1], 10);
				ss = parseInt(timeArray[2], 10);

				if (timeString.indexOf("mmm") !== -1) {
					mmm = parseInt(timeString.split('.')[1], 10);
				}
				hToMs = hh * 60 * 60 * 1000;
				mToMs = mm * 60 * 1000;
				sToMs = ss * 1000;

				return hToMs + mToMs + sToMs + mmm;
			}

			/**
			 * Takes a set of linear ads (returned by VAST) and converts them into an array of advert objects, each containing
			 * the attributes listed in `extractAdsFromXML`
			 * @method processLinearAds
			 * @private
			 * @param {Array}  the input set of adverts
			 * @param {String} adId the advert id
			 * @param {Object} advertRollType the advert roll-type
			 * @param {Array} adImpressions array of URLs
			 * @return {Array} list of adverts
			 */
			function processLinearAds($linearAds, adId, advertRollType, adImpressions) {
				var adverts = [];
				$linearAds.each(function () {
					var adDuration,
						$linearAd = $(this);

					adDuration = convertToMs($linearAd.find('Duration').text());
					log('processLinearAds', 'duration: ' + adDuration);
					/*
					TODO: Each MediaFile will have the same creative, but possibly in different container-codec
					versions, so only the most suitable one will have to be picked
					*/
					$linearAd.find('MediaFile').each(function () {
						var $mediaFile = $(this),
							newAdvert = {
								id: adId,
								impressions: adImpressions,
								rollType: advertRollType,
								deliveryType: $mediaFile.attr('delivery') || '',
								mimeType: $mediaFile.attr('type') || '',
								uri: $.trim($mediaFile.context.textContent),
								width: $mediaFile.attr('width'),
								height: $mediaFile.attr('height'),
								duration: Math.round(adDuration / 1000) // return the duration in seconds
							};
						adverts.push(newAdvert);
					});
				});
				return adverts;
			}

			function processNonlinearAds($nonLinearAds, adId, advertRollType, adImpressions) {
				var adverts = [];
				// TODO: non-linear ads
				return adverts;
			}

			function processCompanionAds($companionAds, adId, advertRollType, adImpressions) {
				var adverts = [];
				// TODO: companion ads
				return adverts;
			}

			/**
			 * Parses the VAST XML response and converts them into a JSON array
			 * @method extractAdsFromXML
			 * @private
			 * @param  {Object} xmlData XML DOM root element
			 * @param  {String} advertRollType specifies the roll-type (one of `PRE_ROLL`, `MID_ROLL` or `POST_ROLL`)
			 * @return {Array}  an array of objects, each containing specifications for a
			 * video ad. The attributes of each object are `id`, `impressions`, `rollType`,
			 * `deliveryType`, `mimeType`, `uri`, `width`, `height`, `uri`, and `duration`.
			 */
			function extractAdsFromXML(xmlData, advertRollType) {
				var $xml = $(xmlData),
					$mainAds,
					$linearAds,
					$nonLinearAds,
					$companionAds,
					allAdverts = [],
					adImpressions = [];
				$mainAds = $xml.find('Ad');
				$mainAds.find('Impression').each(function () {
					adImpressions.push($.trim($(this).text()));
				});
				$mainAds.each(function () {
					var $creatives = $(this).find('Creative');
					$creatives.each(function () {
						var $ad = $(this),
							adId = $ad.attr('id') || '';
						$linearAds = $ad.find('Linear');
						$nonLinearAds = $ad.find('NonLinear');
						$companionAds = $ad.find('Companion');
						if ($linearAds) {
							allAdverts = allAdverts.concat(processLinearAds($linearAds, adId, advertRollType, adImpressions));
						} else if ($nonLinearAds) {
							allAdverts = allAdverts.concat(processNonlinearAds($nonLinearAds, adId, advertRollType, adImpressions));
						}
						if ($companionAds) {
							allAdverts = allAdverts.concat(processCompanionAds($companionAds, adId, advertRollType, adImpressions));
						}
					});
				});
				return allAdverts;
			}

			/**
			 * Retrieves ads from a VAST-compliant server
			 * @method getData
			 * @param {Object} adTag advert insertion tag that is returned by the `$N.services.sdp.Adverts` class.
			 * @param {Function} callback function that's to be invoked when data from all the supplied VAST
			 * servers has been retrieved. This data is passed on to the function as its only parameter, and has
			 * the following attributes:
			 *
			 *     id <String> unique identifier for the advert
			 *     impressions <Array> an array of URLs which are to be notified when the first frame of the advert
			 *     is shown
			 *     rollType {String} determines when the advert is to be shown w.r.t. the main content. One of the types
			 *     defined in $N.services.sdp.Adverts.ROLL_TYPE
			 *     deliveryType {String} specifies how the advert will be delivered. `progressive`, etc.
			 *     mimeType {String} specifies the MIME type of the advert media
			 *     uri {String} URL of the external server from which the advert will be served
			 *     width {Number} width of the advert media
			 *     height {Number} height of the advert media
			 *     duration {Number} how long the advert will play
			 * @async
			 */
			function getData(adTag, callback) {
				var adVideos = [];
				if (callback) {
					if (adTag) {
						log('getData', 'URL: ' + adTag.adServer.uri);
						$.get(adTag.adServer.uri, function (data, status) {
							if (data) {
								adVideos = adVideos.concat(extractAdsFromXML(data, adTag.advert.advertRollType));
							}
							callback(adVideos);
						});
					} else {
						callback(adVideos);
					}
				} else {
					log('getData', 'No callback passed in', Log.LOG_ERROR);
				}
			}

			return {
				getData: getData
			};

		}());
		return $N.services.adverts.VASTDataAdapter;
	}
);