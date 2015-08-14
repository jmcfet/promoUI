/**
 * BTVSearch class is used to offer an API to return search
 * results from an EPG database. This class only handles
 * one request at a time.
 * @class $N.platform.btv.BTVSearch
 * @requires $N.apps.core.Log
 * @requires $N.platform.btv.EPGEventFactory
 * @author Dylan Thomas
 * @constructor
 */
define('jsfw/platform/btv/BTVSearch',
	[
		'jsfw/apps/core/Log',
		'jsfw/platform/btv/EPGEventFactory'
	],
	function (Log, EPGEventFactory) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.btv = $N.platform.btv || {};

		$N.platform.btv.BTVSearch = (function () {

			var DEFAULT_PROPERTIES = "*";
			var DEFAULT_ORDER = "title DESC";
			var MAX_RESULTS = 999;

			var log = new $N.apps.core.Log("btv", "BTVSearch");
			var query = "";

			var dataReceievedCallback = null;
			var dataCompleteCallback = null;

			/* Private helper functions */

			/**
			 * Adds a predicate to the query object to search title
			 * @method addTitleSearchPredicate
			 * @private
			 * @param {String} title
			 * @param {Boolean} exactMatch True for an exact match.
			 */
			function addTitleSearchPredicate(title, exactMatch) {
				if (query !== "") {
					query += " AND ";
				}

				query += "title";

				if (exactMatch) {
					// we still perform a LIKE here because it ignores case, but we do not use any wildcards
					query += " LIKE '" + title + "'";
				} else {
					query += " LIKE '%" + title + "%'";
				}
			}

			/**
			 * Adds a predicate to the query object to search for events that
			 * have not yet finished
			 * @method addNowFutureSearchPredicate
			 * @private
			 */
			function addNowFutureSearchPredicate() {
				if (query !== "") {
					query += " AND ";
				}
				query += "endTime > " + String(new Date().getTime());
			}

			/**
			 * Creates a query to search for events matching the given title
			 * that have not already finished
			 * @method buildNonExpiredEventsByTitleQuery
			 * @private
			 * @param {Object} title
			 * @param {boolean} exactMatch
			 */
			function buildNonExpiredEventsByTitleQuery(title, exactMatch) {
				addTitleSearchPredicate(title, exactMatch);
				addNowFutureSearchPredicate();
			}

			/**
			 * Resets the internal variables back to their default values
			 * @method resetRequestData
			 * @private
			 */
			function resetRequestData() {
				query = "";
			}

			/**
			 * Executes the currently held query.
			 * @method executeQuery
			 * @private
			 */
			function executeQuery() {
				log("executeQuery", "Query : " + query, Log.LOG_DEBUG);
				var eventsArray = [];
				var events = [];
				var result = CCOM.EPG.getEventsRSByQuery(DEFAULT_PROPERTIES, query, DEFAULT_ORDER);

				if (result.error === undefined) {
					events = result.getNext(MAX_RESULTS);
					eventsArray = $N.platform.btv.EPGEventFactory.mapArray(events);
				} else {
					log("executeQuery", "Error from CCOM.EPG.getEventsRSByQuery : " + result.error.name + " " + result.error.message, Log.LOG_ERROR);
				}

				log("executeQuery", "Found " + String(eventsArray.length) + " events.", Log.LOG_DEBUG);
				dataReceievedCallback(eventsArray);
				dataCompleteCallback(true);
				result.reset();
				reult = null;
			}

			/* Public API */
			return {

				/**
				 * Retrieves an array of events matching the given title
				 * @method getNonExpiredEventsByTitle
				 * @async
				 * @param {String} title title of the event that we're interested in
				 * @param {Function} dataCallback function that will be invoked when the data has been fetched. This
				 * function should expect an array of EPG events
				 * @param {Function} finishedCallback function that will be invoked when the data has been fetched. This
				 * function should expect a Boolean value to indicate if the query was successful
				 * @param {Boolean} [exactMatch=false] indicates whether an exact match is required
				 */
				getNonExpiredEventsByTitle : function (title, dataCallback, finishedCallback, exactMatch, limit) {
					log("getNonExpiredEventsByTitle", "Starting search for " + title, Log.LOG_INFO);
					dataReceievedCallback = dataCallback;
					dataCompleteCallback = finishedCallback;
					resetRequestData();
					buildNonExpiredEventsByTitleQuery(title, exactMatch);
					executeQuery();
				},

				/**
				 * Cancels a previous request
				 * @method cancelLastRequest
				 */
				cancelLastRequest: function () {
					resetRequestData();
				}
			};

		}());
		return $N.platform.btv.BTVSearch;
	}
);