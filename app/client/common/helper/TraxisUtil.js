/**
 * A utility class that retrieves data from the Traxis server
 * @class $N.app.TraxisUtil
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.platform.system.Preferences
 * @requires $N.app.Config
 * @requires $N.app.ConditionalAccessCAK73
 * @requires $N.apps.core.AjaxHandler
 * #depends ../../Config.js
 * #depends ConditionalAccessCAK73.js
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.TraxisUtil = (function () {
		var log = new $N.apps.core.Log("Helper", "TraxisUtil"),
			REQUEST = {
				PRICES: 1,
				GET_BOOKMARK: 2,
				SET_BOOKMARK: 3,
				START_PURCHASE: 4,
				COMPLETE_PURCHASE: 5,
				PURCHASED_PRODUCTS: 6,
				GET_FAVOURITES: 7
			},

			/**
			 * @method getTraxisAddress
			 * @return {String} address
			 */
			getTraxisAddress = function () {
				var address = "";
				if ($N.app.Config.getConfigValue("traxis.developer.mode") === "off") {
					address = $N.platform.system.Preferences.get("/network/siconfig/CustomDescriptorTags/teleIdeaTraxis", true);
				} else {
					address = $N.app.Config.getConfigValue("traxis.developer.server");
				}
				return address;
			},

			/**
			 * @method getSmartcardNumber
			 * @return {String} smartcardNumber
			 */
			getSmartcardNumber = function () {
				var smartcardInfo = $N.app.ConditionalAccessCAK73.getCASmartCardInfo(),
					smartcardNumber = smartcardInfo.smartcardInfo ? smartcardInfo.smartcardInfo.serialNumber : "";
				return smartcardNumber.replace(/\s/g, "");
			},

			/**
			 * @method getRequestUrl
			 * @param {Number} requestType
			 * @param {String} requestParam1
			 * @param {String} requestParam2
			 * @return {String}
			 */
			getRequestUrl = function (requestType, requestParam1, requestParam2) {
				var requestUrl = getTraxisAddress() + "/",
					requestTypeUrl,
					requestParam1Url,
					requestParam2Url,
					appendParams,
					isFavouritesRequest = false;

				switch (requestType) {
				case REQUEST.PRICES:
					requestTypeUrl = "GetPrices";
					requestParam1Url = "ProductIds";
					break;
				case REQUEST.GET_BOOKMARK:
					requestTypeUrl = "GetBookmark";
					requestParam1Url = "AssetId";
					break;
				case REQUEST.SET_BOOKMARK:
					requestTypeUrl = "StoreBookmark";
					requestParam1Url = "AssetId";
					requestParam2Url = "Bookmark";
					break;
				case REQUEST.START_PURCHASE:
					requestTypeUrl = "StartPurchase";
					requestParam1Url = "TicketId";
					appendParams = "Signature=&PurchaseChannel=IMP";
					break;
				case REQUEST.COMPLETE_PURCHASE:
					requestTypeUrl = "CompletePurchase";
					requestParam1Url = "EntitlementId";
					appendParams = "Signature=";
					break;
				case REQUEST.PURCHASED_PRODUCTS:
					requestTypeUrl = "GetPurchasedProducts";
					break;
				case REQUEST.GET_FAVOURITES:
					requestTypeUrl = "web/WishList/props/name";
					isFavouritesRequest = true;
					appendParams = "Output=json";
					break;
				}
				requestUrl = requestUrl + requestTypeUrl;
				if (isFavouritesRequest) {
					requestUrl = requestUrl + "?CpeId=" + getSmartcardNumber();
				} else {
					requestUrl = requestUrl + ".traxis?STBId=" + getSmartcardNumber();
				}
				if (requestParam1) {
					requestUrl = requestUrl + "&" + requestParam1Url + "=" + requestParam1;
				}
				if (requestParam2 || requestParam2 === 0) {
					requestUrl = requestUrl + "&" + requestParam2Url + "=" + requestParam2;
				}
				if (appendParams) {
					requestUrl = requestUrl + "&" + appendParams;
				}
				return requestUrl;
			},

			/**
			 * @method convertResultToJson
			 * @param {String} result
			 * @return {Array} jsonArray
			 */
			convertResultToJson = function (rawResult) {
				var jsonArray = [],
					jsonItem,
					items,
					fields,
					currentField,
					i,
					j;
				if (rawResult) {
					items = rawResult.split(/\s+/);
					for (i = 0; i < items.length; i++) {
						if (items[i] !== "") {
							jsonItem = {};
							fields = items[i].split("|");
							for (j = 0; j < fields.length; j++) {
								currentField = fields[j].split("=");
								if (currentField[1]) {
									jsonItem[currentField[0].toLowerCase()] = currentField[1];
								}
							}
							jsonArray.push(jsonItem);
						}
					}
				}

				return jsonArray;
			},

			/**
			 * @method makeRequest
			 * @param {String} url
			 * @param {Function} successCallback
			 * @param {Function} failureCallback
			 * @param {Boolean} isResultJson
			 */
			makeRequest = function (url, successCallback, failureCallback, isResultJson) {
				log("makeRequest", "Enter & Exit - URL: " + url);
				var traxisRequest = new $N.apps.core.AjaxHandler();
				traxisRequest.responseCallback = function (response) {
					if (response && response.status === 200 && successCallback) {
						if (isResultJson) {
							successCallback(JSON.parse(response.responseText));
						} else {
							successCallback(convertResultToJson(response.responseText));
						}
					} else if (failureCallback) {
						log("makeRequest", "Call failed for some reason.");
						if (response) {
							log("makeRequest", JSON.stringify(response));
							failureCallback(response.status);
						} else {
							// So the response object is NULL for some reason and therefore
							// we have no real error to pass on to the user. Instead we will
							// use a 'special' code to identify this case.
							log("makeRequest", "There was no response from the system. Bailing.");
							failureCallback(654);
						}
					}
				};
				traxisRequest.requestData(url, 5000);
			},

			/**
			 * @method makeBodySyntaxRequest
			 * @param {String} url
			 * @param {Function} successCallback
			 * @param {Function} failureCallback
			 * @param {String} requestXml
			 */
			makeBodySyntaxRequest = function (url, successCallback, failureCallback, requestXml) {
				log("makeBodySyntaxRequest", "Enter - URL: " + url);
				var traxisRequest = new $N.apps.core.AjaxHandler(),
					XML_REQUEST_HEADER = "Content-Type:text/xml";

				traxisRequest.responseCallback = function (response) {
					if (response && response.status === 200 && successCallback) {
						successCallback(JSON.parse(response.responseText));
					} else if (failureCallback) {
						log("makeBodySyntaxRequest", "Call failed for some reason.");
						if (response) {
							log("makeBodySyntaxRequest", JSON.stringify(response));
							failureCallback(response.status);
						} else {
							// So the response object is NULL for some reason and therefore
							// we have no real error to pass on to the user. Instead we will
							// use a 'special' code to identify this case.
							log("makeBodySyntaxRequest", "There was no response from the system. Bailing.");
							failureCallback(654);
						}
					}
				};

				traxisRequest.postData(url, XML_REQUEST_HEADER, requestXml);

				log("makeBodySyntaxRequest", "Exit");
			},


			/**
			 * VOD Favourites Handler
			 */
			favourites = (function () {
				var _favouriteCache = [],
					_cridCache = [],

					/**
					 * getCridForFileName
					 * @param  {String} fileName
					 * @param  {Function} successCallback
					 * @param  {Function} failureCallback
					 * @async
					 * @private
					 */
					getCridForFileName = function (fileName, successCallback, failureCallback) {
						log("getCridForFileName", "Enter - fileName:" + fileName);
						var url = getTraxisAddress() + "/web/content/" + fileName + "/titles?AliasIdType=VodBackOfficeId&Output=json",
							isResultJson = true,
							crid,
							getCridSuccessCallback = function (data) {
								log("getCridForFileName", "Enter Crid Callback");
								if (data.Titles && data.Titles.Title && data.Titles.Title.length) {
									crid = data.Titles.Title[0].id;
									_cridCache[fileName] = crid;
									successCallback(crid);
									log("getCridForFileName", "Crid Received: " + crid);
								}
								log("getCridForFileName", "Exit Crid Callback");
							};

						// Check cache for crid
						crid = _cridCache[fileName];

						if (crid) {
							log("getCridForFileName", "Cached Crid :" + crid);
							successCallback(crid);
						} else {
							makeRequest(url, getCridSuccessCallback, failureCallback, isResultJson);
						}
						log("getCridForFileName", "Exit");
					},

					/**
					 * getCachedFileNameForCrid
					 * @param  {String} crid
					 * @returns {String} fileName (or null if not found)
					 * @private
					 */
					getCachedFileNameForCrid = function (crid) {
						log("getCachedFileNameForCrid", "Enter crid:" + crid);
						var fileName;
						for (fileName in _cridCache) {
							if (_cridCache.hasOwnProperty(fileName) && _cridCache[fileName] === crid) {
								log("getCachedFileNameForCrid", "Exit - crid found fileName:" + fileName);
								return fileName;
							}
						}
						log("getCachedFileNameForCrid", "Exit - crid not found");
						return null;
					},

					/**
					 * getFileNameForCrid
					 * @param  {String} crid
					 * @param  {Function} successCallback
					 * @param  {Function} failureCallback
					 * @async
					 * @private
					 */
					getFileNameForCrid = function (crid, successCallback, failureCallback) {
						log("getFileNameForCrid", "Enter");
						var url = getTraxisAddress() + "/web/Title/" + crid + "/contents/props/aliases/filter/isViewableOnCpe==true?&Output=json",
							isResultJson = true,
							fileName,
							getFileNameSuccessCallback = function (data) {
								log("getFileNameForCrid", "Enter Filename Callback");
								var aliasArray,
									aliasArrayLength,
									alias,
									i;

								if (data.Contents && data.Contents.Content && data.Contents.Content.length && data.Contents.Content[0].Aliases) {
									aliasArray = data.Contents.Content[0].Aliases.Alias;
									aliasArrayLength = aliasArray ? aliasArray.length : 0;
									for (i = 0; i < aliasArrayLength; i++) {
										alias = aliasArray[i];
										if (alias.type === "VodBackOfficeId") {
											fileName = alias.Value;
											_cridCache[fileName] = crid;
											successCallback(fileName);
											log("getFileNameForCrid", "Exit Crid Callback Filename Received: " + fileName);
											return;
										}
									}
								}
								failureCallback();
								log("getFileNameForCrid", "Exit Crid Callback");
							};

						// Check cache for filename
						fileName = getCachedFileNameForCrid(crid);

						if (fileName) {
							log("getFileNameForCrid", "Cached Crid fileName:" + fileName);
							successCallback(fileName);
						} else {
							makeRequest(url, getFileNameSuccessCallback, failureCallback, isResultJson);
						}
						log("getFileNameForCrid", "Exit");
					},

					/**
					 * cacheFavourites
					 * Add all the favourites to the cache
					 * @param  {Object []} favouriteArray
					 * @private
					 */
					cacheFavourites = function (favouriteArray) {
						log("cacheFavourites", "Enter");
						var i,
							favouriteArrayLength = (favouriteArray) ? favouriteArray.length : 0;

						for (i = 0; i < favouriteArrayLength; i++) {
							_favouriteCache[favouriteArray[i].fileName] = {
								crid: favouriteArray[i].crid,
								fileName: favouriteArray[i].fileName
							};
						}
						log("cacheFavourites", "Exit");
					},

					/**
					 * @method adjustFavourites
					 * @param {String} requestType
					 * @param {String} crid
					 * @param {Function} successCallback
					 * @param {Function} failureCallback
					 * @async
					 * @private
					 */
					adjustFavourites = function (requestType, crid, successCallback, failureCallback) {
						log("adjustFavourites", "Enter");
						var url = getTraxisAddress() + "/web/Title/" + crid + "/WishList?CpeId=" + getSmartcardNumber(),
							xssRequest,
							xssRequestSuccess = function (data) {
								log("adjustFavourites", "Enter & Exit xssRequestSuccess");
								if (successCallback) {
									successCallback(data);
								}
							},
							xssRequestFailure = function (error) {
								log("adjustFavourites", "Enter & Exit xssRequestFailure");
								if (failureCallback) {
									failureCallback(error);
								}
							};

						xssRequest = new $N.apps.core.XssRequest(requestType, url, xssRequestSuccess, xssRequestFailure);
						xssRequest.send();
						log("adjustFavourites", "Exit");
					},

					/**
					 * @method extractFileNamesFromWishlistResult
					 * @param {Object} result
					 * @private
					 */
					extractFileNamesFromWishlistResult  = function (result) {
						var favouriteArray = [],
							title,
							titleArray,
							titleArrayLength,
							alias,
							aliasArray,
							aliasArrayLength,
							i,
							j;

						if (result && result.Titles && result.Titles.Title) {
							titleArray = result.Titles.Title;
							titleArrayLength = titleArray.length || 0;

							for (i = 0; i < titleArrayLength; i++) {
								title = titleArray[i];

								if (title && title.Contents && title.Contents.Content && title.Contents.Content.length && title.Contents.Content[0].Aliases) {
									aliasArray = title.Contents.Content[0].Aliases.Alias;
									aliasArrayLength = aliasArray.length || 0;

									for (j = 0; j < aliasArrayLength; j++) {
										alias = aliasArray[j];

										if (alias && alias.type === "VodBackOfficeId") {
											if (alias.Value) {
												favouriteArray.push({
													crid: title.id,
													fileName: alias.Value
												});
											}
										}
									}
								}
							}
						}
						return favouriteArray;
					},

					/**
					 * @method getFavourites
					 * @param {Function} successCallback
					 * @param {Function} failureCallback
					 * @async
					 */
					getFavourites = function (successCallback, failureCallback) {
						log("getFavourites", "Enter");
						// TODO : Tidy this up
						var XML_FOR_REQUEST = '<?xml version="1.0" encoding="utf-8"?>' +
							'<Request xmlns="urn:eventis:traxisweb:1.0">' +
							'<Parameters>' +
							'<Parameter name="Output">JSON</Parameter>' +
							'</Parameters>' +
							'<Identity>' +
							'<CpeId>' + getSmartcardNumber() + '</CpeId>' +
							'</Identity>' +
							'<RootRelationQuery relationName="Wishlist">' +
							'<Options>' +
							'<Option type="Limit">100</Option>' +
							'<Option type="Props">Name,IsViewableOnCpe,isAdult</Option>' +
							'</Options>' +
							'<SubQueries>' +
							'<SubQuery relationName="Contents">' +
							'<Options>' +
							'<Option type="props">aliases</Option>' +
							'<Option type="filter">IsViewableOnCpe==true</Option>' +
							'</Options>' +
							'</SubQuery>' +
							'</SubQueries>' +
							'</RootRelationQuery>' +
							'</Request>',
							URL = getTraxisAddress() + "/web",
							favouritesSuccessCallback = function (response) {
								var parsedResult;
								if (response) {
									parsedResult = extractFileNamesFromWishlistResult(response);
									cacheFavourites(parsedResult);
									if (successCallback) {
										successCallback(parsedResult);
									}

								}
							};

						_favouriteCache = [];

						makeBodySyntaxRequest(URL, favouritesSuccessCallback, failureCallback, XML_FOR_REQUEST);
						log("getFavourites", "Exit");
					},

					/**
					 * @method isInFavourites
					 * @param {String} fileName
					 * @return {Boolean}
					 */
					isInFavourites = function (fileName) {
						return (_favouriteCache[fileName]) ? true : false;
					},

					/**
					 * @method addFavourite
					 * @param {String} crid
					 * @param {String} fileName
					 * @param {Function} successCallback
					 * @param {Function} failureCallback
					 * @async
					 */
					addFavourite = function (crid, fileName, successCallback, failureCallback) {
						log("addFavourite", "Enter crid:" + crid + " fileName:" + fileName);
						adjustFavourites("PUT", crid, function (data) {
							log("addFavourite", "Enter successCallback");
							_favouriteCache[fileName] = {
								crid: crid,
								fileName: fileName
							};

							successCallback(data);
							log("addFavourite", "Exit successCallback");
						}, failureCallback);
						log("addFavourite", "Exit");
					},

					/**
					 * @method removeFavourite
					 * @param {String} crid
					 * @param {String} fileName
					 * @param {Function} successCallback
					 * @param {Function} failureCallback
					 * @async
					 */
					removeFavourite = function (crid, fileName, successCallback, failureCallback) {
						adjustFavourites("DELETE", crid, function (data) {
							if (isInFavourites(fileName)) {
								delete _favouriteCache[fileName];
							}
							if (successCallback) {
								successCallback(data);
							}
						}, failureCallback);
					},

					/**
					 * @method addFavouriteByFileName
					 * @param {String} fileName
					 * @param {Function} successCallback
					 * @param {Function} failureCallback
					 * @async
					 */
					addFavouriteByFileName = function (fileName, successCallback, failureCallback) {
						getCridForFileName(fileName, function (crid) {
							addFavourite(crid, fileName, successCallback, failureCallback);
						}, failureCallback);
					},

					/**
					 * @method removeFavouriteByFileName
					 * @param {String} fileName
					 * @param {Function} successCallback
					 * @param {Function} failureCallback
					 * @async
					 */
					removeFavouriteByFileName = function (fileName, successCallback, failureCallback) {
						getCridForFileName(fileName, function (crid) {
							removeFavourite(crid, fileName, successCallback, failureCallback);
						}, failureCallback);
					};

				return {
					getFavourites: getFavourites,
					isInFavourites: isInFavourites,
					addFavouriteByFileName: addFavouriteByFileName,
					removeFavouriteByFileName: removeFavouriteByFileName,
					getFileNameForCrid: getFileNameForCrid
				};
			}()),

			/**
			 * @method convertTimeshift
			 * @param {Object} timeshiftJSON
			 */
			convertTimeshift = function (timeshiftJSON) {
				var result = {},
					i,
					j,
					contentObjects,
					contentObjectsLength,
					timeshiftObject,
					aliasArray,
					aliasArrayLength,
					fileName,
					optionObjects,
					optionObjectsLength,
					crid;

				if (timeshiftJSON && timeshiftJSON.Contents && timeshiftJSON.Contents.Content) {
					contentObjects = timeshiftJSON.Contents.Content;
					contentObjectsLength = contentObjects.length;

					for (i = 0; i < contentObjectsLength; i++) {
						crid = contentObjects[i].id;
						timeshiftObject = contentObjects[i].Tstv;

						if (contentObjects[i].Aliases) {
							aliasArray = contentObjects[i].Aliases.Alias;
							aliasArrayLength = aliasArray.length;

							for (j = 0; j < aliasArrayLength; j++) {
								if (aliasArray[j].type === 'VodBackOfficeId') {
									fileName = aliasArray[j].Value;
								}
							}
						}

						if (timeshiftObject) {
							result.startover = [];
							result.catchup = [];

							optionObjects = timeshiftObject.Option;
							optionObjectsLength = optionObjects.length;

							for (j = 0; j < optionObjectsLength; j++) {
								if (optionObjects[j].model === "Restart") {
									result.startover.push({
										crid: crid,
										fileName: fileName
									});
								} else if (optionObjects[j].model === "CatchUp") {
									result.catchup.push({
										crid: crid,
										fileName: fileName
									});
								}
							}
						}
					}
				}

				return result;
			},
			/**
			 * @method updateProductDetails
			 * @param {String} productId
			 * @param {Object} dataObject
			 * @param {Function} failureCallback
			 */
			updateProductDetails = function (productId, dataObject, failureCallback) {
				makeRequest(getRequestUrl(REQUEST.PRICES, productId), function (result) {
					dataObject.price = result[0].price;
					dataObject.listPrice = result[0].listprice;
					dataObject.ticketId = result[0].ticketid;
					dataObject.entitlementId = result[0].entitlementid;
					if (result[0].entitlementtimeout) {
						dataObject.entitlementTimeout = new Date(result[0].entitlementtimeout);
					}
					$N.apps.util.EventManager.fire("traxisProductsUpdated", {
						productId: productId,
						dataObject: dataObject
					});
				}, failureCallback);
			},

			/**
			 * @method getBookmark
			 * @param {String} technicalId
			 */
			getBookmark = function (technicalId, callback) {
				var successCallback = function (result) {
						callback(result[0].bookmark);
					},
					failureCallback = function () {
						callback(0);
					};
				makeRequest(getRequestUrl(REQUEST.GET_BOOKMARK, technicalId), successCallback, failureCallback);
			},

			/**
			 * @method setBookmark
			 * @param {String} technicalId
			 */
			setBookmark = function (technicalId, bookmark) {
				makeRequest(getRequestUrl(REQUEST.SET_BOOKMARK, technicalId, bookmark));
			},

			/**
			 * @method purchaseProduct
			 * @param {Object} product
			 * @param {Function} successCallback
			 * @param {Function} failureCallback
			 */
			purchaseProduct = function (ticketId, successCallback, failureCallback) {
				makeRequest(getRequestUrl(REQUEST.START_PURCHASE, ticketId), function (result) {
					successCallback(result[0]);
				}, failureCallback);
			},

			/**
			 * @method confirmPurchase
			 * @param {String} entitlementId
			 * @param {Function} successCallback
			 * @param {Function} failureCallback
			 */
			confirmPurchase = function (entitlementId, successCallback, failureCallback) {
				log("confirmPurchase", "Enter & Exit");
				makeRequest(getRequestUrl(REQUEST.COMPLETE_PURCHASE, entitlementId), successCallback, failureCallback);
			},

			/**
			 * @method getPurchasedProducts
			 * @param {Function} successCallback
			 * @param {Function} failureCallback
			 */
			getPurchasedProducts = function (successCallback, failureCallback) {
				makeRequest(getRequestUrl(REQUEST.PURCHASED_PRODUCTS), successCallback, failureCallback);
			},

			/**
			 * @method getCatchUpRequestUrl
			 * @param {Object} crid - The SeaChange CRID for the event to retrieve the information for.
			 * @return {String} catchUpUrl
			 */
			getCatchUpRequestUrl = function (eventId) {
				var requestUrl = getTraxisAddress() + "/";
				requestUrl += "web/Event/imi:" + eventId + "/TstvContents/props/EntitlementState,Tstv,EncodingProfile,Aliases?aliasIdType=IngestedIMI&CPeId=" + getSmartcardNumber() + "&Output=json";
				return requestUrl;
			},

			/**
			 * @method getCatchUpForPlayback
			 * @param {String} uniqueEventId
			 * @param {Function} callback to be used in the successul case.
			 * @param {Function} callback to be used if anything fails.
			 */
			getCatchUpForPlayback = function (uniqueEventId, success, failure) {
				log("getCatchUpForPlayback", "Enter");
				var failureCallback = function (errorCode) {
						log("getCatchUpForPlayback", "failureCallback ");
						failure(errorCode);
					},
					successCallback = function (result) {
						log("getCatchUpForPlayback", "successCallback");
						var timeshiftResult = convertTimeshift(result);
						if (timeshiftResult && timeshiftResult.catchup && timeshiftResult.catchup.length > 0) {
							success(timeshiftResult.catchup[0]);
						} else {
							failure(403);
						}
					},
					url = getCatchUpRequestUrl(uniqueEventId);

				makeRequest(url, successCallback, failureCallback, true);
				log("getCatchUpForPlayback", "Exit");
			},

			/**
			 * @method getStartOverForPlayback
			 * @param {String} uniqueEventId
			 * @param {Function} callback
			 */
			getStartOverForPlayback = function (uniqueEventId, callback) {
				log("getStartOverForPlayback", "Enter");
				var failureCallback = function () {
						log("getStartOverForPlayback", "failureCallback");
						callback(null);
					},
					successCallback = function (result) {
						log("getStartOverForPlayback", "successCallback");
						var timeshiftResult = convertTimeshift(result);

						if (timeshiftResult && timeshiftResult.startover && timeshiftResult.startover.length > 0) {
							callback(timeshiftResult.startover[0]);
						} else {
							callback(null);
						}
					},
					url = getCatchUpRequestUrl(uniqueEventId);

				makeRequest(url, successCallback, failureCallback, true);
				log("getStartOverForPlayback", "Exit");
			},

			/**
			 * @method getEntitlementForCatchUp
			 * @param {String} productId
			 * @param {Function} successCallback
			 * @param {Function} failureCallback
			 */
			getEntitlementForCatchUp = function (productId, successCallback, failureCallback) {
				var url = getTraxisAddress() + "/web/Content/" + productId + "/Props/EntitledProduct?CpeId=" + getSmartcardNumber() + '&Output=json';
				makeRequest(url, function (result) {
					successCallback(result);
				}, failureCallback, true);
			},

			/**
			 * @method getPlaybackUrl
			 * @param {String} assetId
			 * @param {String} entitlementId
			 * @return {String} url
			 */
			getPlaybackUrl = function (assetId, entitlementId) {
				log("getPlaybackUrl", "Enter assetId:" + assetId + " entitlementId:" + entitlementId);
				var playbackUrl = "rtsp://" + $N.platform.system.Preferences.get("/network/siconfig/CustomDescriptorTags/teleIdeaTraxisRtsp", true) + "/";
				playbackUrl = playbackUrl + assetId + "?STBId=" + getSmartcardNumber() + "&VODServingAreaId=" + $N.platform.system.Preferences.get($N.app.constants.PREF_AREA_ID, true);
				if (entitlementId) {
					playbackUrl = playbackUrl + "&Entitlement=" + entitlementId;
				}
				log("getPlaybackUrl", "Exit - playbackUrl:" + playbackUrl);
				return playbackUrl;
			};

		$N.apps.util.EventManager.create("traxisProductsUpdated");

		return {
			updateProductDetails: updateProductDetails,
			getBookmark: getBookmark,
			setBookmark: setBookmark,
			favourites: favourites,
			purchaseProduct: purchaseProduct,
			confirmPurchase: confirmPurchase,
			getPurchasedProducts: getPurchasedProducts,
			getCatchUpForPlayback: getCatchUpForPlayback,
			getStartOverForPlayback: getStartOverForPlayback,
			getEntitlementForCatchUp: getEntitlementForCatchUp,
			getPlaybackUrl: getPlaybackUrl
		};
	}());

}($N || {}));