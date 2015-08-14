/**
 * This class is used to offer an API to perform a search for VOD assets. You can do a 'search all' using the
 * `$N.services.sdp.VODSearch.search()` method which will try to match the given search terms against keywords, titles, actors and directors.
 * Alternatively, you could run a search for these individual attributes as well using the appropriately named
 * methods.
 *
 * @class $N.services.sdp.VODSearch
 * @author gstacey
 * @requires $N.services.sdp.ServiceFactory
 * @requires $N.services.sdp.VOD
 * @requires $N.apps.util.JSON
 * @constructor
 */
/* global define */
define('jsfw/services/sdp/VODSearch',
	[
		'jsfw/services/sdp/ServiceFactory',
		'jsfw/services/sdp/VOD',
		'jsfw/apps/util/JSON'
	],
	function (ServiceFactory, VOD, JSON) {
		var JON;

		function VODSearch() {
			this._maxPagedResults = 500;
			this._successCallback = function () {};
			this._failureCallback = function () {};
			this._codBrowsingService = $N.services.sdp.ServiceFactory.get("CodBrowsingService");
			this._mapToSDP2 = false;
			JON = window.JSON || $N.apps.util.JSON;
		}

		/*
		 * PRIVATE HELPER METHODS
		 */
		/**
		 * Called when a search call to cod service is successful
		 * @method _searchSuccess
		 * @private
		 * @param {Object} result The return VOD assets
		 */
		VODSearch.prototype._searchSuccess = function (result) {
			var i;
			var j;
			var assets = [];
			var asset = null;
			if (this._mapToSDP2) {
				for (i = 0; i < result.length; i++) {
					for (j = 0; j < result[i].scheduledTechnicalItems.length; j++) {
						asset = $N.services.sdp.VOD.getCodItemForScheduleItem(result[i], j);
						assets.push(asset);
					}
				}
			} else {
				assets = result;
			}
			this._successCallback(assets);
		};

		/**
		 * Called when a search call to cod service is unsuccessful
		 * @method _searchFailure
		 * @private
		 * @param {Object} result
		 */
		VODSearch.prototype._searchFailure = function (result) {
			this._failureCallback();
		};

		/*
		 * PUBLIC API
		 */
		/**
		 * Performs a search on keyword, title, actor and director with the given search term
		 * @method search
		 * @param {String} searchTerm
		 */
		VODSearch.prototype.search = function (searchTerm) {
			this._codBrowsingService.getScheduledItems(this, this._searchSuccess, this._searchFailure, JON.stringify({
				context: $N.services.sdp.VOD.getContext(),
				filter: {
					scheduledStatus: "P",
					scheduledIsCurrent: true,
					assetPlayType: 'E',
					keywordSubstringList: searchTerm
				},
				sort: ["assetOrder"],
				startRow: 1,
				endRow: this._maxPagedResults
			}));
		};

		/**
		 * Performs a search on keyword, title, actor and director with the given search term
		 * but only returns the results between the specified rows
		 * @method pagedSearch
		 * @param {String} searchTerm
		 * @param {Number} startRow
		 * @param {Number} endRow
		 */
		VODSearch.prototype.pagedSearch = function (searchTerm, startRow, endRow) {
			this._codBrowsingService.getScheduledItems(this, this._searchSuccess, this._searchFailure, JON.stringify({
				context: $N.services.sdp.VOD.getContext(),
				filter: {
					scheduledStatus: "P",
					scheduledIsCurrent: true,
					assetPlayType: 'E',
					keywordSubstringList: searchTerm
				},
				sort: ["assetOrder"],
				startRow: startRow,
				endRow: endRow
			}));
		};

		/**
		 * Performs a search by keyword using the given search term
		 * @method searchByKeyword
		 * @param {String} keyword
		 */
		VODSearch.prototype.searchByKeyword = function (keyword) {
			this._codBrowsingService.getScheduledItems(this, this._searchSuccess, this._searchFailure, JON.stringify({
				context: $N.services.sdp.VOD.getContext(),
				filter: {
					scheduledStatus: "P",
					scheduledIsCurrent: true,
					assetPlayType: 'E',
					keywordSubstringList: keyword
				},
				sort: ["assetOrder"],
				startRow: 1,
				endRow: this._maxPagedResults
			}));
		};

		/**
		 * Performs a search on titles with the given search term
		 * @method searchByTitle
		 * @param {String} title
		 */
		VODSearch.prototype.searchByTitle = function (title) {
			this._codBrowsingService.getScheduledItems(this, this._searchSuccess, this._searchFailure, JON.stringify({
				context: $N.services.sdp.VOD.getContext(),
				filter: {
					scheduledStatus: "P",
					scheduledIsCurrent: true,
					assetPlayType: 'E',
					assetTitleSubstringList: [title]
				},
				sort: ["assetOrder"],
				startRow: 1,
				endRow: this._maxPagedResults
			}));
		};

		/**
		 * Performs a search on actors with the given search term
		 * @method searchByActor
		 * @param {String} actor
		 */
		VODSearch.prototype.searchByActor = function (actor) {
			this._codBrowsingService.getScheduledItems(this, this._searchSuccess, this._searchFailure, JON.stringify({
				context: $N.services.sdp.VOD.getContext(),
				filter: {
					scheduledStatus: "P",
					scheduledIsCurrent: true,
					assetPlayType: 'E',
					assetActorSubstringList: [actor]
				},
				sort: ["assetOrder"],
				startRow: 1,
				endRow: this._maxPagedResults
			}));
		};

		/**
		 * Performs a search on directors with the given search term
		 * @method searchByDirector
		 * @param {String} director
		 */
		VODSearch.prototype.searchByDirector = function (director) {
			this._codBrowsingService.getScheduledItems(this, this._searchSuccess, this._searchFailure, JON.stringify({
				context: $N.services.sdp.VOD.getContext(),
				filter: {
					scheduledStatus: "P",
					scheduledIsCurrent: true,
					assetPlayType: 'E',
					assetDirectorSubstringList: [director]
				},
				sort: ["assetOrder"],
				startRow: 1,
				endRow: this._maxPagedResults
			}));
		};

		/**
		 * Sets the success callback to the given callback function
		 * @method setSuccessCallback
		 * @chainable
		 * @param {Function} callback
		 */
		VODSearch.prototype.setSuccessCallback = function (callback) {
			this._successCallback = callback;
			return this;
		};

		/**
		 * Sets the failure callback to the given callback function
		 * @method setFailureCallback
		 * @chainable
		 * @param {Function} callback
		 */
		VODSearch.prototype.setFailureCallback = function (callback) {
			this._failureCallback = callback;
			return this;
		};

		/**
		 * Sets the max amount of results to be returned for each search query
		 * @method setMaxPagedResults
		 * @chainable
		 * @param {Number} amount
		 */
		VODSearch.prototype.setMaxPagedResults = function (amount) {
			this._maxPagedResults = amount;
			return this;
		};

		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};
		$N.services.sdp.VODSearch = VODSearch;
		return VODSearch;
	}
);
