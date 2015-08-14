/*global getURL */
/**
 * A Helper class that retrieves the data from Accenture back-end for VOD Recommendations
 * @class $N.app.VODRecommendationServerHelper
 * @static
 * @requires $N.apps.core.Log
 * @author kiran
 */

(function ($N) {
	$N.app = $N.app || {};
	$N.app.VODRecommendationServerHelper = (function () {
		var log = new $N.apps.core.Log("Helper", "VODRecommendationServerHelper"),
			isLoggedIn = false,
			contentIDsCache = [],
			isRefreshCache = false,
			galleryViewSuccessCallback = function () {},
			galleryViewFailureCallback = function () {},
			REQUEST = {
				AUTHENTICATE: 1,
				GENERAL_RECOMMENDATIONS: 2,
				SIMILAR_RECOMMENDATIONS: 3
			},
			isLocalData = true;

		/**
		 * @method getServerAddress
		 * @return {String} address
		 */
		function getServerAddress() {
			var address = "";
			if ($N.app.Config.getConfigValue("traxis.developer.mode") === "off") {
				//TO-DO: Need to change this address to Accenture server when it is up.
				address = "http://avs42net-dev.avs-accenture.com";
			} else {
				address = "http://avs42net-dev.avs-accenture.com";
			}
			return address;
		}

		/**
		 * @method getSmartcardNumber
		 * @return {String} smartcardNumber
		 */
		function getSmartcardNumber() {
			var smartcardInfo = $N.app.ConditionalAccessCAK73.getCASmartCardInfo(),
				smartcardNumber = smartcardInfo.smartcardInfo ? smartcardInfo.smartcardInfo.serialNumber : "";
			return smartcardNumber.replace(/\s/g, "");
		}

		/**
		 * @method getRequestUrl
		 * @param {Number} requestType
		 * @return {String}
		 */
		function getRequestUrl(requestType, contentID) {
			var requestUrl = getServerAddress() + "/AVS/",
				requestTypeUrl,
				requestChannel,
				appendParams;

	//https://avs42net-dev.avs-accenture.com/AVS/besc?action=Login&
	//rememberFlag=N&channel=NETSTB&accountDeviceIdType=SMARTCARD&accountDeviceId=226052058282

	//http://avs42net-dev.avs-accenture.com/AVS/besc?action=GetRecommendedContents&channel=PCTV&isAnonymous=N
			switch (requestType) {
			case REQUEST.AUTHENTICATE:
				requestUrl = "http://avs42net-dev.avs-accenture.com/AVS/";
				requestTypeUrl = "besc?action=Login";
				requestChannel = "rememberFlag=N&channel=NETSTB";
				appendParams = "accountDeviceIdType=SMARTCARD&accountDeviceId=" + getSmartcardNumber();
				break;
			case REQUEST.GENERAL_RECOMMENDATIONS:
				requestTypeUrl = "besc?action=GetRecommendedContents";
				requestChannel = "channel=PCTV";
				appendParams = "IsAnonymous=N";
				break;
			case REQUEST.SIMILAR_RECOMMENDATIONS:
				requestTypeUrl = "besc?action=GetSimilarContents";
				requestChannel = "channel=STB";
				//appendParams = "contentId=" + contentID;//TO-DO: uncomment this once accenture server is up and remove the below line
				appendParams = "contentId=1234566778";//as of now contentID is fixed for getting the response from Traxis server.
				break;
			}
			requestUrl = requestUrl + requestTypeUrl;
			if (requestChannel) {
				requestUrl = requestUrl + "&" + requestChannel;
			}
			if (appendParams) {
				requestUrl = requestUrl + "&" + appendParams;
			}
			return requestUrl;
		}

		/**
		 * @method makeRequest
		 * @param {String} url
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function makeRequest(url, successCallback, failureCallback) {
			log("makeRequest", "Enter & Exit - URL: " + url);
			var serverRequest = new $N.apps.core.AjaxHandler();
			serverRequest.responseCallback = function (response) {
				if (response && response.status === 200) {
					successCallback(JSON.parse(response.responseText));
				} else if (failureCallback) {
					log("makeRequest", "Call failed for some reason.");
					if (response) {
						log("makeRequest", JSON.stringify(response));
						failureCallback(response.status);
					} else {
						// use a 'special' code to identify this case.
						log("makeRequest", "There was no response from the system. Bailing.");
						failureCallback(654);
					}
				}
			};
			serverRequest.requestData(url, 5000);
		}
		/**
		 * @method getCachedRecomemmnededList
		 * @private
		 * @returns contentIds list from cache
		 */
		function getCachedRecomemmnededList() {
			log("getCachedRecomemmnededList", "Enter & Exit");
			return contentIDsCache;
		}

		/**
		 * @method handleError
		 * @private
		 * @param {object} response
		 */
		function handleError(response) {
			log("handleError", "Enter");
			log("handleError", "Exit");
		}

		/**
		 * @method authenticateVODRecommendServer
		 * @private
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function authenticateVODRecommendServer(successCallback, failureCallback) {
			log("authenticateVODRecommendServer", "Enter");
			if (isLocalData) {//Simulating Traxis server response
				isLoggedIn = true;
				successCallback();
			} else {
				makeRequest(getRequestUrl(REQUEST.AUTHENTICATE), function (response) {
					if (response && response.resultCode === "OK") {
						isLoggedIn = true;
					}
					if (successCallback) {
						successCallback();
					}
				}, function (response) {
					isLoggedIn = false;
					if (failureCallback) {
						failureCallback();
					}
				});
			}
			log("authenticateVODRecommendServer", "Exit");
		}

		/**
		 * @method updateGeneralRecommendationCache
		 * @private
		 * @param {object} response
		 */
		function updateGeneralRecommendationCache(response) {
			log("updateGeneralRecommendationCache", "Enter");
			contentIDsCache = [];
			if (isLocalData) {
				response = $N.apps.util.JSON.parse(response.content);
			}
			if (response || response.resultObj || response.resultObj.contentList) {
				var contentList = response.resultObj.contentList,
					contentListLength = response.resultObj.contentList.length,
					i,
					j;
				for (i = 0; i < contentListLength; i++) {
					for (j = 0; j < contentList[i].contents.length; j++) {
						contentIDsCache.push(contentList[i].contents[j].contentId);
					}
				}
			}
			log("updateGeneralRecommendationCache", "Enter");
		}

		/**
		 * @method getGeneralRecommendationsFromServer
		 * @private
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getGeneralRecommendationsFromServer(successCallback, failureCallback) {
			log("getGeneralRecommendations", "Enter");
			if (isLocalData) {//Simulating Traxis server response
				getURL("apps/now/vodData.json", function (data) {
					updateGeneralRecommendationCache(data);
					if (successCallback) {
						successCallback();
					}
				});
			} else {
				makeRequest(getRequestUrl(REQUEST.GENERAL_RECOMMENDATIONS), function (response) {
					updateGeneralRecommendationCache(response);
					if (successCallback) {
						successCallback();
					}
				}, function (response) {
					failureCallback();
				});
			}
			log("getGeneralRecommendations", "Exit");
		}

		/**
		 * @method getMDSData
		 * @private
		 * @param {Object} folderUID
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getMDSData(contentIDs, successCallback, failureCallback) {
			$N.app.MDSUtil.getMDSDataForContentIDs(contentIDs, function (response) {
				successCallback(response);
			}, function (response) {
				failureCallback(response);
			});
		}

		/**
		 * @method setGalleryViewSuccessCallback
		 * @private
		 * @param {Function} Callback
		 */
		function setGalleryViewSuccessCallback(callback) {
			if (callback) {
				galleryViewSuccessCallback = callback;
			}
		}

		/**
		 * @method setGalleryViewFailureCallback
		 * @private
		 * @param {Function} Callback
		 */
		function setGalleryViewFailureCallback(callback) {
			if (callback) {
				galleryViewFailureCallback = callback;
			}
		}
		/**
		 * @method getGeneralRecommendations
		 * @public
		 * @param {Object} folderUID
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getGeneralRecommendations(folderUID, successCallback, failureCallback) {
			setGalleryViewSuccessCallback(successCallback);
			setGalleryViewFailureCallback(failureCallback);
			if (!isLoggedIn || isRefreshCache) {
				var callback = function () {
					getGeneralRecommendationsFromServer(function () {
						getMDSData(getCachedRecomemmnededList(), galleryViewSuccessCallback, galleryViewFailureCallback);//Fetch MDS data for the contentIDs
					});
				};
				authenticateVODRecommendServer(callback, galleryViewFailureCallback);
			} else {
				getMDSData(getCachedRecomemmnededList(), galleryViewSuccessCallback, galleryViewFailureCallback);
			}
		}

		/**
		 * @method createGeneralRecommendations
		 * @public
		 */
		function createGeneralRecommendations() {
			log("createGeneralRecommendations", "Enter");
			authenticateVODRecommendServer(getGeneralRecommendationsFromServer, handleError);
			log("createGeneralRecommendations", "Exit");
		}

		/**
		 * @method getContentIDs
		 * @private
		 * @param {Object} response
		 */
		function getContentIDs(response) {
			log("getContentIDs", "Enter");
			var contentIDs = [],
				contentList,
				contentListLength,
				i,
				j;
			if (response || response.resultObj || response.resultObj.contentList) {
				contentList = response.resultObj.contentList;
				contentListLength = response.resultObj.contentList.length;
				for (i = 0; i < contentListLength; i++) {
					for (j = 0; j < contentList[i].contents.length; j++) {
						contentIDs.push(contentList[i].contents[j].contentId);
					}
				}
			}
			log("getContentIDs", "Enter");
			return contentIDs;
		}

		/**
		 * @method getSimilarRecommendationsFromServer
		 * @private
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getSimilarRecommendationsFromServer(contentID, successCallback, failureCallback) {
			log("getGeneralRecommendations", "Enter");
			makeRequest(getRequestUrl(REQUEST.SIMILAR_RECOMMENDATIONS, contentID), function (response) {
				if (successCallback) {
					successCallback(response);
				}
			}, function (response) {
				failureCallback();
			});
			log("getGeneralRecommendations", "Exit");
		}

		/**
		 * @method getSimilarRecommendations
		 * @public
		 * @param {number} contentID
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getSimilarRecommendations(contentID, successCallback, failureCallback) {
			setGalleryViewSuccessCallback(successCallback);
			setGalleryViewFailureCallback(failureCallback);
			var callback = function () {
				if (isLocalData) {
					var contentidList = getCachedRecomemmnededList();
					getMDSData(contentidList.reverse(), function (data) {
						successCallback({type: $N.app.MDSUtil.CONTENT_TYPE.ASSETS, content: data.editorials});
					}, function () {
						failureCallback({type: $N.app.MDSUtil.CONTENT_TYPE.ASSETS, content: null});
					});//Fetch MDS data for the contentIDs
				} else {
					getSimilarRecommendationsFromServer(contentID, function (response) {
						getMDSData(getContentIDs(response), function (data) {
							successCallback({type: $N.app.MDSUtil.CONTENT_TYPE.ASSETS, content: data.editorials});
						}, function () {
							failureCallback({type: $N.app.MDSUtil.CONTENT_TYPE.ASSETS, content: null});
						});//Fetch MDS data for the contentIDs
					});
				}
			};
			authenticateVODRecommendServer(callback, function () {
				galleryViewFailureCallback({type: $N.app.MDSUtil.CONTENT_TYPE.ASSETS, content: null});
			});
		}

		return {
			createGeneralRecommendations: createGeneralRecommendations,
			getGeneralRecommendations: getGeneralRecommendations,
			getSimilarRecommendations: getSimilarRecommendations,
			authenticateVODRecommendServer: authenticateVODRecommendServer
		};

	}());
	$N.apps.core.Language.adornWithGetString($N.app.VODRecommendationServerHelper, "apps/now/common/");

}($N || {}));
