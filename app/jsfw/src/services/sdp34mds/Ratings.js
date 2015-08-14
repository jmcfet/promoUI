/**
 * This class caches the rating table as defined in the SDP for a give locale.
 * @class $N.services.sdp.Ratings
 * @static
 * @singleton
 * @requires $N.apps.core.Log
 * @requires $N.services.sdp.ServiceFactory
 * @requires $N.apps.util.Util
 */

/* global define */
define('jsfw/services/sdp/Ratings',
	[
		'jsfw/apps/core/Log',
		'jsfw/services/sdp/ServiceFactory',
		'jsfw/apps/util/Util'
	],
	function (Log, ServiceFactory, Util) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};

		$N.services.sdp.Ratings = (function () {

			var log = new $N.apps.core.Log("sdp", "Ratings");

			// SDP services
			var ratingService;

			// initial preferences
			var cacheSuccessCallback = null;
			var cacheFailCallback = null;
			var LOCALE = "en_gb";

			var ratingLookUp = {};
			var ratingLookupByPrecedence = {};
			var ratingLookupOrderedByPrecedence = [];
			var ratingLookupByCode = {};

			/**
			 * Success callback for the ratingService.getList, turns the
			 * result in to a look up table instead of an array.
			 * @method buildRatingLookUps
			 * @private
			 * @param {Array} result
			 */
			function buildRatingLookUps(result) {
				var i;
				ratingLookUp = {};
				ratingLookupByPrecedence = {};
				ratingLookupByCode = {};
				ratingLookupOrderedByPrecedence = [];
				for (i = 0; i < result.length; i++) {
					ratingLookUp[result[i].uid] = result[i];
					ratingLookupByPrecedence[result[i].precedenceValue] = result[i];
					ratingLookupOrderedByPrecedence.push(result[i]);
					ratingLookupByCode[String(result[i].ratingCode)] = result[i];
				}
				ratingLookupOrderedByPrecedence.sort(function (a, b) {
					return b.precedenceValue - a.precedenceValue;
				});
				if (cacheSuccessCallback) {
					cacheSuccessCallback();
				}
			}

			/**
			 * Calls the RatingService getList to get the parental ratings from SDP
			 * @method loadRatingTable
			 * @private
			 * @param {Object} locale
			 */
			function loadRatingTable(locale) {
				LOCALE = locale || LOCALE;
				ratingService.getList(this, buildRatingLookUps, function () {
					log("loadRatingTable", "Failed to get rating table for VOD", "warn");
					ratingLookUp = {};
					ratingLookupByPrecedence = {};
					ratingLookupOrderedByPrecedence = [];
					ratingLookupByCode = {};
					if (cacheFailCallback) {
						cacheFailCallback();
					}
				}, LOCALE);
			}

			return {

				/**
				 * Loads the rating table into memory and upon success makes a callback
				 * via the successCallback if it has been defined. On fail the
				 * failCallback is executed
				 * @method cacheRatingTable
				 * @async
				 * @param {String} locale
				 * @param {Function} successCallback
				 * @param {Function} failCallback
				 */
				cacheRatingTable: function (locale, successCallback, failCallback) {
					cacheSuccessCallback = successCallback;
					cacheFailCallback = failCallback;
					ratingService = $N.services.sdp.ServiceFactory.get("RatingService");
					loadRatingTable(locale);
				},

				/**
				 * Determines if the ratings table has been cached
				 * @method isCached
				 * @return {Boolean} true if cached, false otherwise
				 */
				isCached: function () {
					if ($N.apps.util.Util.isEmptyObject(ratingLookUp)) {
						return false;
					}
					return true;
				},

				/**
				 * Returns the cached rating table that has been loaded from SDP
				 * @method getRatingLookup
				 * @return {Object}
				 */
				getRatingLookup: function () {
					return ratingLookUp;
				},

				/**
				 * Returns the cached rating table that has been loaded from SDP. Ratings can be looked up using their
				 * precedence value
				 * @method getRatingLookupByPrecedence
				 * @return {Object}
				 */
				getRatingLookupByPrecedence: function () {
					return ratingLookupByPrecedence;
				},

				/**
				 * Returns the cached rating table that has been loaded from SDP. Ratings can be looked up using their
				 * rating code
				 * @method getRatingLookupByCode
				 * @return {Object}
				 */
				getRatingLookupByCode: function () {
					return ratingLookupByCode;
				},

				/**
				 * Returns the cached rating table that has been loaded from SDP where the array
				 * is ordered by precedence value
				 * @method getRatingLookupOrderedByPrecedence
				 * @return {Object}
				 */
				getRatingLookupOrderedByPrecedence: function () {
					return ratingLookupOrderedByPrecedence;
				},

				/**
				 * Returns the age rating for the given rating id
				 * @method getUserAgeRatingForRatingId
				 * @param {Number} ratingId
				 * @return {Number} User age rating
				 */
				getUserAgeRatingForRatingId: function (ratingId) {
					return ratingLookUp[ratingId] ? ratingLookUp[ratingId].ratingCode : null;
				}
			};

		}());
		return $N.services.sdp.Ratings;
	}
);