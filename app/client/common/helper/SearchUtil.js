/**
 * @class $N.app.SearchUtil
 * @static
 * @author gstacey
 * @requires $N.apps.core.Log
 * @requires $N.services.sdp.MetadataService
 */
(function ($N) {
	$N.common = $N.common || {};
	$N.common.helper = $N.common.helper || {};

	$N.common.helper.SearchUtil = (function () {
		var _log = new $N.apps.core.Log("Helper", "SearchUtil"),
			_mds = $N.services.sdp.MetadataService,
			_btvSearchResultsArray = [],
			_vodSearchResultsArray = [],
			_suggestionArray = [],
			_catchupSearchResultsArray = [],
			_dvrSearchResultsArray = [],
			_btvResultsReturned = false,
			_vodResultsReturned = false,
			_catchupResultsReturned = false,
			_dvrResultsReturned = false,
			_totalDVRRresults = 0,
			_totalBTVResults = 0,
			_totalCatchUpResults = 0,
			_totalVODResults = 0,
			_vodResultsCount = 0,
			_btvResultsCount = 0,
			_catchupResultsCount = 0,
			_searchCompleteCallback = function () {},
			me = this;
		me._counterUpdated = false;

		/**
		 * Runs the searchCompleteCallback
		 * @method _runSearchCompleteCallback
		 * @param isFromSuggestion tells if the callback is called from suggestions or not
		 */
		function _runSearchCompleteCallback(isFromSuggestion) {
			_log("_runSearchCompleteCallback", "Enter");
			if (_btvResultsReturned && _vodResultsReturned && _catchupResultsReturned && _dvrResultsReturned) {
				if (_searchCompleteCallback) {
					var resultObj = {
						btvResultsReturned : _btvResultsReturned,
						vodResultsReturned : _vodResultsReturned,
						catchupResultsReturned: _catchupResultsReturned,
						dvrResultsReturned: _dvrResultsReturned,
						btvSearchResultsArray : _btvSearchResultsArray,
						vodSearchResultsArray : _vodSearchResultsArray,
						catchupSearchResultsArray : _catchupSearchResultsArray,
						dvrSearchResultsArray : _dvrSearchResultsArray,
						suggestionArray: _suggestionArray,
						totalDVRRresults : _totalDVRRresults,
						totalBTVResults : _totalBTVResults,
						totalCatchUpResults : _totalCatchUpResults,
						totalVODResults : _totalVODResults
					};
					_searchCompleteCallback(resultObj);
				} else {
					_log("_runSearchCompleteCallback", "NO CALLBACK FUNCTION SET!");
				}
			} else {
				_log("_runSearchCompleteCallback", "Not all expected data yet ready. Holding off calling back for now.");
				_log("_runSearchCompleteCallback", "_btvResultsReturned " + _btvResultsReturned);
				_log("_runSearchCompleteCallback", "_vodResultsReturned " + _vodResultsReturned);
				_log("_runSearchCompleteCallback", "_catchupResultsReturned " + _catchupResultsReturned);
				_log("_runSearchCompleteCallback", "_dvrResultsReturned " + _dvrResultsReturned);
			}

			_log("_runSearchCompleteCallback", "Exit");
		}

		/**
		 * Function to get Suggestions from MDS and execute the callback
		 * @method getSuggestions
		 * @param {Object} searchObject
		 * @public
		 */
		function getSuggestions(searchObject) {
			var successCallback = function (searchResult) {
					if (searchResult && searchResult.response.docs) {
						var results = searchResult.response.docs,
							i = 0;
						for (i = 0; i < results.length; i++) {
							switch (results[i].scope) {
							case "vod":
								results[i] = results[i].editorialAsset || results[i];
								results[i].type = $N.app.constants.SEARCH_TYPE.VOD;
								_vodSearchResultsArray.push(results[i]);
								break;
							case "btv":
								results[i].type = $N.app.constants.SEARCH_TYPE.MDSEPG;
								_btvSearchResultsArray.push(results[i]);
								break;
							}

							_suggestionArray.push(results[i]);
						}
						_runSearchCompleteCallback(true);
					}
				},
				failureCallback = function (e) {
					_runSearchCompleteCallback();
				},
				filterQuery = [],
				searchCriteria = searchObject.searchCriteria;

			if (searchObject.searchType === "title") {
				filterQuery.push("entity:content");
			} else if (searchObject.searchType === "actors") {
				filterQuery.push("entity:actors");
				searchCriteria = "\"" + searchCriteria + "\"";
			} else if (searchObject.searchType === "keyword") {
				filterQuery.push("entity:(content OR actors)");
			}

			if (!searchObject.allowAdult) {
				filterQuery.push("-descendantsOf:\"021d14e5-d439-4038-94bd-c78023242950\"");
				filterQuery.push("rating.precedence:[* TO 17]");
			}

			_mds.fetchSuggestions(this, successCallback, failureCallback, searchCriteria, filterQuery);
		}

		function searchVODByTitle(searchTerm, successCallback, failureCallback, isQueryAdultEvent, startRow, endRow, fieldList) {
			var filterQuery = [],
				sortOrder,
				queryFields,
				limit;
			limit = 1000;
			if (!isQueryAdultEvent) {
				filterQuery.push("rating.precedence:[* TO 17]");
			}
			filterQuery.push("scope:vod");
			fieldList = fieldList || "uid,title,id";
			sortOrder = "title desc";
			queryFields = "title";
			searchTerm = "title:\"" + searchTerm + "\"";
			_log("searchVODByTitle", "searchTerm " + searchTerm);
			_mds.doSearch(this, successCallback, failureCallback, searchTerm, filterQuery, fieldList, sortOrder, null, limit, startRow, queryFields);
		}

		function performPVRSearch(searchObject) {
			var i,
				success = function (results) {
					var resultsLength = results.length;
					for (i = 0; i < resultsLength; i++) {
						results[i].type = $N.app.constants.SEARCH_TYPE.PVR;
						_dvrSearchResultsArray.push(results[i]);
					}
					_dvrResultsReturned = true;
					_totalDVRRresults = _dvrSearchResultsArray.length;
					_runSearchCompleteCallback();
				},
				failure = function () {
					_dvrResultsReturned = true;
					_runSearchCompleteCallback();
				};

			_log("performPVRSearch", "Enter");

			if ($N.app.FeatureManager.isPVREnabled()) {
				if (searchObject.searchType === "title") {
					$N.platform.btv.PVRManager.getPlayableRecordingsByTitle(searchObject.searchCriteria, null, success, failure, false, null, searchObject.allowAdult);
				} else if (searchObject.searchType === "actors") {
					$N.platform.btv.PVRManager.getPlayableRecordingsByActorsDirector(searchObject.searchCriteria, null, success, failure, false, null, searchObject.allowAdult);
				} else if (searchObject.searchType === "keyword") {
					$N.platform.btv.PVRManager.getPlayableRecordingsByKeyword(searchObject.searchCriteria, null, success, failure, false, null, searchObject.allowAdult);
				}
			} else {
				_dvrResultsReturned = true;
				_runSearchCompleteCallback();
			}

			_log("performPVRSearch", "Exit");
		}

		/**
		 * @param {Something} Don't know
		 */
		function performVODTitleSearch(title, isQueryAdultEvent) {
			var isMDSAvailable = $N.app.MDSUtil.isServerAvailable(),
				i;

			_log("performVODTitleSearch", "Enter");
			if (isMDSAvailable) {
				if ($N.app.FeatureManager.isVODEnabled()) {
					searchVODByTitle(title,
						function (searchResult) {
							var results = searchResult.docs,
								resultsLength = results.length;
							for (i = 0; i < resultsLength; i++) {
								results[i] = results[i].editorialAsset || results[i];
								results[i].type = $N.app.constants.SEARCH_TYPE.VOD;
								_vodSearchResultsArray.push(results[i]);
							}
							_vodResultsReturned = true;
							_runSearchCompleteCallback();
						},
						function () {
							_vodResultsReturned = true;
							_runSearchCompleteCallback();
						}, isQueryAdultEvent);
				} else {
					_log("performVODTitleSearch", "The VOD feature is not currently enabled.");
				}
			} else {
				_log("performVODTitleSearch", "MDS is not currently available.");
			}
			_log("performVODTitleSearch", "Exit");
		}

		/**
		 * Perform a paged getData.
		 * @method fetchContentFromMDSbyIds
		 * @param {resultsData} Array of initial search results
		 * @param {ids} Array of event Ids to search
		 * @param {callback} Callback function
		 */
		function fetchContentFromMDSbyIds(resultsData, ids, callback) {
			_log("fetchContentFromMDSbyIds", "Enter");
			var catchups = [],
				programFilter = {},
				fieldList = ["id", "eventId", "serviceRef", "period", "Title", "Description", "editorial.seriesRef", "editorial.episodeNumber", "isCatchUp", "isStartOver", "editorial.Rating", "Actors", "Directors",
							 "PromoImages", "Year", "Countries", "DvbCategories", "PrivateMetadata"],
				originalData = resultsData,
				successCallback = function (response) {
					_log("fetchContentFromMDSbyIds success ----->", "processSucess response = " + JSON.stringify(response));
					if (response && response.programmes && response.programmes.length > 0) {
						catchups = $N.services.sdp.EPGEventFactory.mapArray(response.programmes);
						callback(originalData, catchups);
					} else {
						callback(originalData, []);
					}
				},
				failureCallback = function (response) {
					_log("fetchContentFromMDSbyIds failure ----->", "processFailure response = " + JSON.stringify(response));
					callback(originalData, []);
				};
			if (ids.length === 0) {
				_log("fetchContentFromMDSbyIds", "No IDs provided!");
				callback(originalData, []);
			} else {
				if (ids.length === 1) {
					programFilter.id = ids[0];
				} else {
					programFilter.id = {"$in": ids};
				}
				// programFilter["period.end"] = {"$lte": Math.ceil(new Date().getTime() / 1000)};
				_mds.getData(this, successCallback, failureCallback, _mds.RequestType.Events, programFilter, [["period.start", 1]], fieldList, null, 0);
			}
			_log("fetchContentFromMDSbyIds", "Exit");
		}

		/**
		 * Perform a paged getData.
		 * @method performVODSearchEpisodeSort
		 * @param {searchObject} searchObject
		 * @param {ids} Array of event Ids to search
		 */
		function performVODSearchEpisodeSort(searchObject) {
			_log("performVODSearchEpisodeSort", "Enter");
			var catchups = [],
				programFilter = {},
				filterArray = [],
				fieldList = ["id", "period", "technical.Title", "technical.episodeNumber"],

				successCallback = function (response) {
					_log("performVODSearchEpisodeSort success ----->", "processSucess response = " + JSON.stringify(response));
					_totalVODResults = response.total_records;
					if (response && response.editorials && response.editorials.length > 0) {
						var mdsData = response.editorials,
							i;
						_log("vodSearchCallback::successCallback", "return Object" + mdsData.length);
						for (i = 0; i < mdsData.length; i++) {
							mdsData[i].type = $N.app.constants.SEARCH_TYPE.VOD;
							mdsData[i].title = mdsData[i].technicals[0].Title;
							mdsData[i].episodeNumber = mdsData[i].technicals[0].episodeNumber;
						}
						_vodResultsCount = (mdsData.length > 0) ? _vodResultsCount + mdsData.length : _totalVODResults;
						_vodSearchResultsArray = _vodSearchResultsArray.concat(mdsData);
						_vodResultsReturned = true;
						_runSearchCompleteCallback();
					} else {
						_vodResultsReturned = true;
						_runSearchCompleteCallback();
					}
				},
				failureCallback = function (response) {
					_log("performVODSearchEpisodeSort failure ----->", "processFailure response = " + JSON.stringify(response));
					_vodResultsReturned = true;
					_runSearchCompleteCallback();
				},
				limit = searchObject.limit || $N.app.constants.SEARCH_PAGE_SIZE,
				offset = ((!searchObject.startRow || (searchObject.startRow === 0)) ? 0 : searchObject.startRow - 1) || 0;

			switch (searchObject.searchType) {
			case "title":
				filterArray = [{"editorial.title": encodeURIComponent(searchObject.searchCriteria)}];
				break;
			case "actors":
				filterArray = [{"editorial.Directors": encodeURIComponent(searchObject.searchCriteria)}, {"editorial.Actors": encodeURIComponent(searchObject.searchCriteria)}];
				break;
			case "keyword":
				filterArray = [{"editorial.title": encodeURIComponent(searchObject.searchCriteria)},
					{"editorial.Directors": encodeURIComponent(searchObject.searchCriteria)},
					{"editorial.Actors": encodeURIComponent(searchObject.searchCriteria)},
					{"editorial.Description": encodeURIComponent(searchObject.searchCriteria)}];
				break;
			}
			programFilter.$or = filterArray;

			_mds.getData(this, successCallback, failureCallback, _mds.RequestType.Assets, programFilter, [["editorial.episodeNumber", 1], ["period.start", 1]], fieldList, limit, offset);
			_log("performVODSearchEpisodeSort", "Exit");
		}

		/**
		 * Perform a paged getData.
		 * @method fetchCatchupContentFromMDSbyIds
		 * @param {resultsData} Array of initial search results
		 * @param {ids} Array of event Ids to search
		 * @param {callback} Callback function
		 */
		function fetchCatchupContentFromMDSbyIds(resultsData, ids, callback) {
			_log("fetchCatchupContentFromMDSbyIds", "Enter");
			var catchups = [],
				programFilter = {},
				fieldList = ["id", "eventId", "serviceRef", "period", "Title", "Description", "editorial.seriesRef", "editorial.episodeNumber", "isCatchUp", "isStartOver", "editorial.Rating", "Actors", "Directors",
							"PromoImages", "Year", "Countries", "DvbCategories", "PrivateMetadata"],
				originalData = resultsData,
				successCallback = function (response) {
					_log("fetchCatchupContentFromMDSbyIds success ----->", "processSucess response = " + JSON.stringify(response));
					if (response && response.programmes && response.programmes.length > 0) {
						catchups = $N.services.sdp.EPGEventFactory.mapArray(response.programmes);
						callback(originalData, catchups);
					} else {
						callback(originalData, []);
					}
				},
				failureCallback = function (response) {
					_log("fetchCatchupContentFromMDSbyIds failure ----->", "processFailure response = " + JSON.stringify(response));
					callback(originalData, []);
				};
			if (ids.length === 0) {
				_log("fetchCatchupContentFromMDSbyIds", "No IDs provided!");
				callback(originalData, []);
			} else {
				if (ids.length === 1) {
					programFilter["editorial.id"] = ids[0];
				} else {
					programFilter["editorial.id"] = {"$in": ids};
				}
				// programFilter["period.end"] = {"$lte": Math.ceil(new Date().getTime() / 1000)};
				_mds.getData(this, successCallback, failureCallback, _mds.RequestType.Events, programFilter, [["period.start", 1]], fieldList, null, 0);
			}
			_log("fetchCatchupContentFromMDSbyIds", "Exit");
		}

		/**
		 * Callback method from search callback triggered from Suggest
		 * @method btvSearchCallback
		 * @param {resultArray} Array of search results event ids
		 */
		function btvSearchCallback(resultArray) {
			_log("btvSearchCallback", "Enter");
			var result = resultArray.docs || [],
				eventIds = [],
				successCallback,
				i;

			for (i = 0; i < result.length; i++) {
				if (result[i].scope === "btv") {
					eventIds.push(result[i].id);
				}
			}

			_totalBTVResults = resultArray.numberFound;

			successCallback = function (originalData, mdsData) {
				_log("btvSearchCallback::successCallback", "return Object" + JSON.stringify(mdsData));

				var mdsResults = mdsData.concat();

				for (i = 0; i < mdsResults.length; i++) {
					mdsResults[i].type = $N.app.constants.SEARCH_TYPE.MDSEPG;
				}

				_btvSearchResultsArray = mdsResults;
				_btvResultsCount = (mdsResults.length > 0) ? _btvResultsCount + mdsResults.length : _totalBTVResults;
				_btvResultsReturned = true;
				_runSearchCompleteCallback();
			};

			if (result.length > 0) {
				if (eventIds.length > 0) {
					fetchContentFromMDSbyIds(resultArray, eventIds, successCallback);
				} else {
					_btvResultsReturned = true;
					_runSearchCompleteCallback();
					_log("btvSearchCallback", "No BTV data is required to be retrieved right now");
				}
			} else {
				_btvResultsReturned = true;
				_runSearchCompleteCallback();
				_log("btvSearchCallback", "No result data received");
			}

			_log("btvSearchCallback", "Exit");
		}

		/**
		 * Perform a paged search.
		 * @method performBTVPagedSearch
		 * @param {Object} A configuration object which controls what searches are performed.
		 */
		function performBTVPagedSearch(searchObject) {
			var searchTerm,
				filterQuery = searchObject.filterQuery || [],
				fieldList,
				sortOrder = searchObject.sortOrder || "title desc",
				limit = $N.app.constants.SEARCH_PAGE_SIZE,
				startRow = searchObject.startRow || 0,
				queryFields = searchObject.queryFields || "title";
			if ((searchObject.limit !== null) && (typeof (searchObject.limit) !== "undefined")) {
				limit = searchObject.limit;
			}

			_log("performBTVPagedSearch", "Enter");

			if (!searchObject.allowAdult) {
				filterQuery.push("rating.precedence:[* TO 18]");
				filterQuery.push("-category:\"Adult\"");
			}

			filterQuery.push("scope:btv");
			filterQuery.push("eventEnd:[" + String(Math.ceil(new Date().getTime() / 1000)) + " TO *]");
			filterQuery.push("entity:programme");

			if (searchObject.searchType === "title") {
				filterQuery.push("title_o:\"" + searchObject.searchCriteria + "\""); //this will make sure we do an exact match using the search query
				searchTerm = "title:\"" + searchObject.searchCriteria + "\"";
				fieldList = searchObject.fieldList || "id,title,eventStart,eventEnd";
				queryFields = searchObject.queryFields || "title";
			} else if (searchObject.searchType === "actors") {
				searchTerm = "\"" + searchObject.searchCriteria + "\"";
				fieldList = searchObject.fieldList || "id,title,actors,directors,eventStart,eventEnd";
				queryFields = searchObject.queryFields || "directors actors";
			} else if (searchObject.searchType === "keyword") {
				searchTerm = "description:\"" + searchObject.searchCriteria + "\"" + "title:\"" + searchObject.searchCriteria + "\"" + "\"" + searchObject.searchCriteria + "\"";
				fieldList = searchObject.fieldList || "id,title,catchupStart,catchupEnd";
				queryFields = "description directors actors title";
			}

			// // Temporary workaround, force all BTV queries to only include data from 17-Oct
			if ($N.app.Config.getConfigValue("mds.developer.mode") === "on") {
				filterQuery.push("eventStart:[1413504000 TO *]");
			} else {
				filterQuery.push("eventStart:[" + String(Math.ceil(new Date().getTime() / 1000)) + " TO *]");
			}
			_log("performBTVPagedSearch", "searchTerm " + searchObject.searchCriteria);

			_mds.doSearch(this, btvSearchCallback, btvSearchCallback, searchTerm, filterQuery, fieldList, sortOrder, null, limit, startRow, queryFields);

			_log("performBTVPagedSearch", "Exit");
		}

		/**
		 * Callback method from search callback triggered from Suggest
		 * @method catchUpSearchCallback
		 * @param {resultArray} Array of search results event ids
		 */
		function catchUpSearchCallback(resultArray) {
			_log("catchUpSearchCallback", "Enter");
			var result = resultArray.docs || [],
				eventIds = [],
				successCallback,
				i;

			for (i = 0; i < result.length; i++) {
				switch (result[i].scope) {
				case "btv":
					eventIds.push(result[i].id);
					break;
				default:
					_log("catchUpSearchCallback", JSON.stringify(result[i]));
					break;
				}
			}

			_totalCatchUpResults = resultArray.numberFound;

			successCallback = function (originalData, mdsData) {
				_log("catchUpSearchCallback::successCallback", "return Object" + JSON.stringify(mdsData));

				var mdsResults = mdsData.concat();

				for (i = 0; i < mdsResults.length; i++) {
					mdsResults[i].type = $N.app.constants.SEARCH_TYPE.CATCHUP;
				}

				_catchupSearchResultsArray = mdsResults;
				_catchupResultsCount = (mdsResults.length > 0) ? _catchupResultsCount + mdsResults.length : _totalCatchUpResults;

				_catchupResultsReturned = true;
				_runSearchCompleteCallback();
			};

			if (result.length > 0) {
				if (eventIds.length > 0) {
					fetchCatchupContentFromMDSbyIds(resultArray, eventIds, successCallback);
				} else {
					_catchupResultsReturned = true;
					_runSearchCompleteCallback();
					_log("catchUpSearchCallback", "No Catch-Up data is required to be retrieved right now");
				}
			} else {
				_catchupResultsReturned = true;
				_runSearchCompleteCallback();
				_log("catchUpSearchCallback", "No result data received");
			}

			_log("catchUpSearchCallback", "Exit");
		}

		/**
		 * Perform a paged search.
		 * @method performCatchUpPagedSearch
		 * @param {Object} A configuration object which controls what searches are performed.
		 */
		function performCatchUpPagedSearch(searchObject) {
			var searchTerm,
				filterQuery = searchObject.filterQuery || [],
				fieldList,
				sortOrder = searchObject.sortOrder || "title desc",
				limit = $N.app.constants.SEARCH_PAGE_SIZE,
				startRow = searchObject.startRow || 0,
				queryFields = searchObject.queryFields || "title";

			if ((searchObject.limit !== null) && (typeof (searchObject.limit) !== "undefined")) {
				limit = searchObject.limit;
			}
			_log("performCatchUpPagedSearch", "Enter");

			if ($N.app.FeatureManager.isCatchUpEnabled()) {
				if (!searchObject.allowAdult) {
					filterQuery.push("rating.precedence:[* TO 18]");
					filterQuery.push("-category:\"Adult\"");
				}

				filterQuery.push("scope:btv");
				filterQuery.push("catchupEnd:[" + String(Math.ceil(new Date().getTime() / 1000)) + " TO *]");
				filterQuery.push("catchupStart:[0 TO " + String(Math.ceil(new Date().getTime() / 1000)) + "]");
				filterQuery.push("entity:content");

				if (searchObject.searchType === "title") {
					filterQuery.push("title_o:\"" + searchObject.searchCriteria + "\""); //this will make sure we do an exact match using the search query
					searchTerm = "title:\"" + searchObject.searchCriteria + "\"";
					fieldList = searchObject.fieldList || "id,title,catchupStart,catchupEnd";
					queryFields = searchObject.queryFields || "title";
				} else if (searchObject.searchType === "actors") {
					searchTerm = "\"" + searchObject.searchCriteria + "\"";
					fieldList = searchObject.fieldList || "id,title,actors,directors,catchupStart,catchupEnd";
					queryFields = searchObject.queryFields || "directors actors";
				} else if (searchObject.searchType === "keyword") {
					searchTerm = "description:\"" + searchObject.searchCriteria + "\"" + "title:\"" + searchObject.searchCriteria + "\"" + "\"" + searchObject.searchCriteria + "\"";
					fieldList = searchObject.fieldList || "id,title,catchupStart,catchupEnd";
					queryFields = "description directors actors title";
				}

				_log("performCatchUpPagedSearch", "searchTerm " + searchTerm);

				_mds.doSearch(this, catchUpSearchCallback, catchUpSearchCallback, searchTerm, filterQuery, fieldList, sortOrder, null, limit, startRow, queryFields);
			} else {
				_catchupResultsReturned = true;
				_runSearchCompleteCallback();
			}


			_log("performCatchUpPagedSearch", "Exit");
		}

		/**
		 * Perform a paged getData for VOD.
		 * @method fetchVODContentFromMDS
		 * @param {searchObject} searchObject
		 * @param {callback} Callback function
		 */
		function fetchVODContentFromMDS(searchObject, callback) {
			_log("fetchRerunContentFromMDS", "Enter");
			var catchups = [],
				programFilter = {},
				fieldList = ["id", "period", "technical.Title", "technical.episodeNumber"],

				successCallback = function (response) {
					_log("fetchVODContentFromMDS success ----->", "processSucess response = " + JSON.stringify(response));
					if (response && response.editorials && response.editorials.length > 0) {
						callback(response.editorials);
					} else {
						callback([]);
					}
				},
				failureCallback = function (response) {
					_log("fetchVODContentFromMDS failure ----->", "processFailure response = " + JSON.stringify(response));
					callback([]);
				},
				limit = searchObject.limit || $N.app.constants.SEARCH_PAGE_SIZE,
				startRow = searchObject.startRow || 0;

			programFilter["editorial.id"] = {"$in": searchObject.ids};

			_mds.getData(this, successCallback, failureCallback, _mds.RequestType.Assets, programFilter, [["period.start", 1]], fieldList, limit, startRow);
			_log("fetchVODContentFromMDS", "Exit");
		}

	/**
		 * Callback method from search callback triggered from VOD Actor Search
		 * @method vodActorSearchCallback
		 * @param {resultArray} Array of search results
		 */
		function vodActorSearchCallback(resultArray) {
			_log("vodActorSearchCallback", "Enter");

			var result = resultArray.docs || [],
				eventIds = [],
				successCallback,
				i;

			for (i = 0; i < result.length; i++) {
				result[i].type = $N.app.constants.SEARCH_TYPE.VOD;
			}
			_vodSearchResultsArray = _vodSearchResultsArray.concat(result);
			_totalVODResults = resultArray.numberFound;

			_vodResultsReturned = true;
			_runSearchCompleteCallback();

			_log("vodActorSearchCallback", "Exit");
		}
		/**
		 * Callback method from search callback triggered from Suggest
		 * @method vodSearchCallback
		 * @param {resultArray} Array of search results event ids
		 */
		function vodSearchCallback(resultArray) {
			_log("vodSearchCallback", "Enter");

			var result = resultArray.docs || [],
				eventIds = [],
				successCallback,
				i,
				searchObject = {};

			for (i = 0; i < result.length; i++) {
				if (result[i].scope === "vod") {
					eventIds.push(result[i].id);
				}
			}
			_totalVODResults = resultArray.numberFound;

			successCallback = function (mdsData) {
				_log("vodSearchCallback::successCallback", "return Object" + mdsData.length);
				var mdsResults = [];

				for (i = 0; i < mdsData.length; i++) {
					mdsData[i].type = $N.app.constants.SEARCH_TYPE.VOD;
					mdsData[i].title = mdsData[i].technicals[0].Title;
					mdsData[i].episodeNumber = mdsData[i].technicals[0].episodeNumber;
				}
				_vodResultsCount = (mdsData.length > 0) ? _vodResultsCount + mdsData.length : _totalVODResults;
				_vodSearchResultsArray = _vodSearchResultsArray.concat(mdsData);
				_vodResultsReturned = true;
				_runSearchCompleteCallback();
			};

			searchObject.ids = eventIds;
			if (result.length > 0) {
				if (eventIds.length > 0) {
					fetchVODContentFromMDS(searchObject, successCallback);
				} else {
					vodActorSearchCallback(resultArray);
					_log("vodSearchCallback", "No result data received");
				}
			} else {
				_vodResultsReturned = true;
				_runSearchCompleteCallback();
				_log("vodSearchCallback", "No result data received");
			}
			_log("vodSearchCallback", "Exit");
		}

		/**
		 * Perform a paged search.
		 * @method performVODPagedSearch
		 * @param {Object} A configuration object which controls what searches are performed.
		 */
		function performVODPagedSearch(searchObject) {
			var searchTerm,
				filterQuery = searchObject.filterQuery || [],
				fieldList,
				sortOrder = searchObject.sortOrder || "title desc",
				limit = $N.app.constants.SEARCH_PAGE_SIZE,
				startRow = searchObject.startRow || 0,
				queryFields = searchObject.queryFields || "title";

			if ((searchObject.limit !== null) && (typeof (searchObject.limit) !== "undefined")) {
				limit = searchObject.limit;
			}
			_log("performVODPagedSearch", "Enter");
			if ($N.app.FeatureManager.isVODEnabled()) {
				if (!searchObject.allowAdult) {
					filterQuery.push("rating.precedence:[* TO 17]");
				}

				filterQuery.push("scope:vod");
				filterQuery.push("entity:content");

				if (searchObject.searchType === "title") {
					filterQuery.push("title_o:\"" + searchObject.searchCriteria + "\""); //this will make sure we do an exact match using the search query
					searchTerm = "title:\"" + searchObject.searchCriteria + "\"";
					fieldList = searchObject.fieldList || "id,title,scope";
					queryFields = searchObject.queryFields || "title";
				} else if (searchObject.searchType === "actors") {
					searchTerm = "\"" + searchObject.searchCriteria + "\"";
					fieldList = searchObject.fieldList || "id,title,actors,directors";
					queryFields = searchObject.queryFields || "directors actors";
				} else if (searchObject.searchType === "keyword") {
					searchTerm = "description:\"" + searchObject.searchCriteria + "\"" + "title:\"" + searchObject.searchCriteria + "\"" + "\"" + searchObject.searchCriteria + "\"";
					fieldList = searchObject.fieldList || "uid,title,id";
					queryFields = searchObject.queryFields || "description directors actors title";
				}
				_log("performVODPagedSearch", "searchTerm " + searchTerm);
				_mds.doSearch(this, vodSearchCallback, vodSearchCallback, searchTerm, filterQuery, fieldList, sortOrder, null, limit, startRow, queryFields);
			} else {
				_vodResultsReturned = true;
				_runSearchCompleteCallback();
			}

			_log("performVODPagedSearch", "Exit");
		}

		function rerunSuccessCallback(mdsData) {
			_log("rerunSuccessCallback", "return Object" + mdsData.length);

			var mdsResults = mdsData.concat(),
				i;

			for (i = 0; i < mdsResults.length; i++) {
				mdsResults[i].type = $N.app.constants.SEARCH_TYPE.MDSEPG;
			}

			_btvSearchResultsArray = mdsResults;
			_btvResultsReturned = true;
			_runSearchCompleteCallback();
		}

		function fetchRerunContentFromMDS(searchObject) {
			_log("fetchRerunContentFromMDS", "Enter");
			var catchups = [],
				programFilter = {},
				fieldList = ["id", "eventId", "serviceRef", "period", "Title", "Description", "editorial.seriesRef", "editorial.episodeNumber", "isCatchUp", "isStartOver", "editorial.Rating", "PrivateMetadata", "Actors",
							"Directors", "PromoImages", "Year", "Countries", "DvbCategories"],
				successCallback = function (response) {
					_log("fetchRerunContentFromMDS success ----->", "processSucess response = " + response.length);
					if (response && response.programmes && response.programmes.length > 0) {
						catchups = $N.services.sdp.EPGEventFactory.mapArray(response.programmes);
						_totalBTVResults = response.total_records;
						rerunSuccessCallback(catchups);
					} else {
						rerunSuccessCallback([]);
					}
				},
				failureCallback = function (response) {
					_log("fetchRerunContentFromMDS failure ----->", "processFailure response = " + JSON.stringify(response));
					rerunSuccessCallback([]);
				},
				limit = searchObject.limit || $N.app.constants.SEARCH_PAGE_SIZE,
				startRow = searchObject.startRow || 0,
				startTime = searchObject.startTime || new Date().getTime();

			if (searchObject.searchType === "reruns") {
				if (searchObject.episodeId) {
					programFilter["editorial.seriesRef"] = searchObject.seriesId;
					programFilter["editorial.episodeNumber"] = parseInt(searchObject.episodeId, 10);
				} else {
					programFilter.Title = encodeURIComponent(searchObject.searchCriteria);
				}
			} else {
				// For now if we get here then we know that the searchType can only be 'series'.
				programFilter["editorial.seriesRef"] = searchObject.seriesId;
			}

			programFilter["period.start"] = {"$gte": Math.ceil(startTime / 1000)};
			if (!searchObject.allowAdult) {
				programFilter.DvbCategories = {"$nin": $N.app.constants.MDS_EPG_ADULT_CATEGORIES};
			}

			_mds.getData(this, successCallback, failureCallback, _mds.RequestType.Events, programFilter, [["period.start", 1]], fieldList, limit, startRow);
			_log("fetchRerunContentFromMDS", "Exit");
		}

		// Public API
		return {
			getSearchCriteriaObject: function () {
				var searchCriteria = {
					includeVOD: false,
					includeBTV: false,
					includeCatchUp: false,
					includePVR: false,
					requestSuggestions: false,
					searchType: "title",
					searchCriteria: "",
					allowAdult: false,
					fieldList: null,
					sortOrder: null,
					startRow: 0,
					maxRows: 20,
					seriesId: null,
					episodeId: null,
					searchCompleteCallback: null
				};

				return searchCriteria;
			},

			/**
			 * Resets the search properties used.
			 * @method resetSearchProperties
			 */
			resetSearchProperties: function () {
				me._counterUpdated = false;
				_totalDVRRresults = 0;
				_totalBTVResults = 0;
				_totalCatchUpResults = 0;
				_totalVODResults = 0;
				_btvResultsCount = 0;
				_catchupResultsCount = 0;
				_vodResultsCount = 0;
			},

			/**
			 * Determines if more items available to scroll or not
			 * @method hasMoreItemsToScroll
			 */
			hasMoreItemsToScroll: function () {
				var moreItemsAvailable = true;
				if ((_vodResultsCount >= _totalVODResults) && (_catchupResultsCount >= _totalCatchUpResults)  && (_btvResultsCount >= _totalBTVResults) && (_dvrSearchResultsArray.length >= _totalDVRRresults)) {
					moreItemsAvailable = false;
				}
				return moreItemsAvailable;
			},

			/**
			 * Returns the counter object of each search type results fetched from the server
			 * @method getFetchedResultsCount
			 */
			getFetchedResultsCount: function () {
				return {
					vodCount: _vodResultsCount,
					catchupCount: _catchupResultsCount,
					btvCount: _btvResultsCount
				};
			},

			/**
			 * Perform a system search.
			 * @param {Object} A configuration object which controls which searches are performed.
			 */
			performSearch: function (searchObject) {
				var filterQuery = [];

				_log("performSearch", "Enter");

				_btvSearchResultsArray = [];
				_vodSearchResultsArray = [];
				_catchupSearchResultsArray = [];
				_dvrSearchResultsArray = [];
				_suggestionArray = [];

				_btvResultsReturned = searchObject.includeBTV ? false : true;
				_vodResultsReturned = searchObject.includeVOD ? false : true;
				_catchupResultsReturned = searchObject.includeCatchUp ? false : true;
				_dvrResultsReturned = searchObject.includePVR ? false : true;

				_searchCompleteCallback = searchObject.searchCompleteCallback;

				if (searchObject) {
					if (searchObject.includePVR) {
						performPVRSearch(searchObject);
					}

					if (searchObject.requestSuggestions) {
						_btvResultsReturned = true;
						_catchupResultsReturned = true;
						_vodResultsReturned = true;

						getSuggestions(searchObject);
					} else {
						if (searchObject.searchType === "reruns" || searchObject.searchType === "series") {
							_catchupResultsReturned = true;
							_vodResultsReturned = true;

							fetchRerunContentFromMDS(searchObject);
						} else {
							if (searchObject.includeBTV) {
								performBTVPagedSearch(searchObject);
							}

							if (searchObject.includeCatchUp) {
								performCatchUpPagedSearch(searchObject);
							}

							if (searchObject.includeVOD) {
								performVODSearchEpisodeSort(searchObject);
							}
						}
					}
				}

				_log("performSearch", "Exit");
			}
		};
	}());

}($N || {}));
