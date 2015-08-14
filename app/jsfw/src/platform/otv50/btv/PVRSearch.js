/**
 * PVRSearch class is used to offer an API to return search
 * results from a PVR task database. This class only handles
 * one request at a time.
 * @class $N.platform.btv.PVRSearch
 * @requires $N.apps.core.Log
 * @author Gareth Stacey
 * @constructor
 */
define('jsfw/platform/btv/PVRSearch',
	[
		'jsfw/apps/core/Log'
	],
	function (Log) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.btv = $N.platform.btv || {};

		$N.platform.btv.PVRSearch = (function () {

			var DEFAULT_PROPERTIES = "*";
			var DEFAULT_ORDER = "title DESC";
			var DEFAULT_MAX_RESULTS = 999;
			var maxResults = DEFAULT_MAX_RESULTS;

			var log = new $N.apps.core.Log("btv", "PVRSearch");
			var query = "";

			var dataReceievedCallback = null;
			var dataCompleteCallback = null;

			var OBJECT_STATE = {
				BOOKED: 0,
				PROCESSING: 1,
				SUSPEND_PROCESSING: 2,
				STOP_PROCESSING: 3,
				PROCESSED: 4,
				FINAL: 5,
				ERROR: 6,
				DELETING: 7,
				DELETED: 8
			};

			/**
			 * Creates a query to search for tasks matching the given title
			 * @method buildTitleQuery
			 * @private
			 * @param {Object} title
			 * @param {boolean} exactMatch
			 */
			function buildTitleQuery(title, exactMatch) {
				if (query !== "") {
					query += " AND ";
				}

				query += "title";

				if (exactMatch) {
					query += " LIKE '" + title + "'";
				} else {
					query += " LIKE '%" + title + "%'";
				}
			}

			/**
			 * Resets the internal variables back to there default values
			 * @method resetRequestData
			 * @private
			 */
			function resetRequestData() {
				query = "";
			}

			/**
			 * Extracts all results from a result set and returns them as an array.
			 * @method getArrayFromResultSet
			 * @private
			 */
			function getArrayFromResultSet(resultSet) {
				var rsArray;
				var returnArray = [];
				var i;
				var len;
				if (!resultSet.error) {
					rsArray = resultSet.getNext(maxResults);
					len = rsArray.length;
					for (i = 0; i < len; i++) {
						rsArray[i].url = "pvr://" + rsArray[i].taskId;
						returnArray.push(rsArray[i]);
					}
				}
				resultSet.reset();
				resultSet = null;
				return returnArray;
			}

			/**
			 * Executes the currently held query.
			 * @method executeQuery
			 * @private
			 */
			function executeQuery() {
				log("executeQuery", "Query : " + query, Log.LOG_DEBUG);
				var eventsArray = [];
				var resultSet = CCOM.Scheduler.getTasksRSByQuery("*", query + " AND taskType='REC' AND (objectState<" + String(OBJECT_STATE.ERROR) + ")", "title");
				var tasks = getArrayFromResultSet(resultSet);
				log("executeQuery", "Found " + String(tasks.length) + " tasks.", Log.LOG_DEBUG);
				dataCompleteCallback(true);
				dataReceievedCallback(tasks);
			}

			return {

				/**
				 * Returns an array of tasks matching the given title
				 * @method getTasksByTitle
				 * @param {String} title
				 * @param {Function} dataCallback
				 * @param {Function} finishedCallback
				 * @param {Boolean} exactMatch
				 * @param {Number} limit
				 */
				getTasksByTitle : function (title, dataCallback, finishedCallback, exactMatch, limit) {
					log("getTasksByTitle", "Starting search for " + title, Log.LOG_INFO);
					maxResults = limit || DEFAULT_MAX_RESULTS;
					dataReceievedCallback = dataCallback;
					dataCompleteCallback = finishedCallback;
					resetRequestData();
					buildTitleQuery(title, exactMatch);
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
		return $N.platform.btv.PVRSearch;
	}
);