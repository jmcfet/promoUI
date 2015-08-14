/**
 * This class creates a single code base that will interact with SDP
 * to allow the retrieval and subscription of on demand assets and catalogues
 * (which can be filtered using the catalogue filtering functionality).
 * The class also applies additional information to assets and catalogues
 * (for example, the addition of the `isBundle` flag which indicates if an asset
 * is part of a bundle).
 *
 * @class $N.services.sdp.VOD
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.services.sdp.ServiceFactory
 * @requires $N.services.sdp.Ratings
 * @requires $N.apps.util.JSON
 * @author d thomas
 */

/* global define */
define('jsfw/services/sdp/VOD',
	[
		'jsfw/apps/core/Log',
		'jsfw/services/sdp/Ratings',
		'jsfw/services/sdp/ServiceFactory',
		'jsfw/apps/util/JSON'
	],
	function (Log, Ratings, ServiceFactory, JSON) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};

		$N.services.sdp.VOD = (function () {

			var log = new Log("sdp", "VOD"),
			// SDP services
				CODService,
				CODBrowsingService,
				CODHelperService,
				CatalogueService,
				AccountService,
				PolicyService,
				ratingService,
				context = null,
				featureNameList = [],
				contextRefreshing = false;

			// initial preferences
			var LOCALE = null,
				USER_ID = null,
				ACCOUNT_ID = null,
				VOD_ROOT_BY_ACCP = null,
				SMART_CARD_ID = null;

			// holds root access point catalogue id
			var ACCESS_POINT_ID = null,

				// catalogues to be filtered
				filteredCatalogues = [],
				ratingLookUp = {};

			/**
			 * Success callback for the ratingService.getList, turns the
			 * result in to a look up table instead of an array.
			 * @method buildRatingLookUp
			 * @private
			 * @param {Array} result
			 */
			function buildRatingLookUp(result) {
				var i;
				ratingLookUp = {};
				for (i = 0; i < result.length; i++) {
					ratingLookUp[result[i].uid] = result[i];
				}
			}

			/**
			 * Calls the RatingService getList to get the parental ratings from SDP
			 * @method loadRatingTable
			 * @private
			 * @param {String} locale the locale string
			 */
			function loadRatingTable(locale) {
				if ($N.services.sdp.Ratings && $N.services.sdp.Ratings.getRatingLookup()) {
					ratingLookUp = $N.services.sdp.Ratings.getRatingLookup();
				} else {
					ratingService.getList(this, buildRatingLookUp, function () {
						log("loadRatingTable", "Failed to get rating table for VOD", "warn");
					}, locale || LOCALE);
				}
			}

			/**
			 * Sets the feature list that is to be used in the callback of `getCurrentContext`
			 * @method setFeatureNameList
			 * @chainable
			 * @param {Array} list list of features
			 */
			function setFeatureNameList(list) {
				featureNameList = list;
				return this;
			}

			/**
			 * Gets the feature name list
			 * @method getFeatureNameList
			 * @return {Array} list list of features
			 */
			function getFeatureNameList() {
				return featureNameList;
			}

			/**
			 * Refreshes the current context. It is recommended that a call to `setFeatureNameList` be
			 * made before calling this method in order to ensure that the correct features are set
			 * in the refreshed context.
			 * @method refreshContext
			 */
			function refreshContext() {
				contextRefreshing = true;
				$N.services.sdp.ServiceFactory.get("ContextService").getCurrentContext(this, function (result) {
					context = result;
					context.featureNameList = featureNameList || null;
					contextRefreshing = false;
				}, function () {contextRefreshing = false; });
			}

			/**
			 * Initialises the VOD class by establishing connections to the SDP using
			 * the provided account, connection and locale properties. Note that an account
			 * or a smart card reference is required, but not necessarily both. This method is
			 * expected to be called after the signon / bootstap code.
			 * @method init
			 * @param {Number} accountId Unique identifier for user.
			 * @param {Number} userId Unique identifier for user.
			 * @param {Number} smartCardId Unique identifier for smart card.
			 * @param {Boolean} rootByAccessPoint True if root should be obtained by access point
			 * @param {String} locale The new locale.
			 * @param [Array] featureNameList optional list of feature names
			 */
			function init(accountID, userID, smartCardId, rootByAccessPoint, locale, featureNameList) {
				log("init", "initialising VOD");

				// preferences
				ACCOUNT_ID = accountID;
				USER_ID = userID;
				SMART_CARD_ID = smartCardId;
				VOD_ROOT_BY_ACCP = rootByAccessPoint;
				LOCALE = locale;

				CODService = $N.services.sdp.ServiceFactory.get("CODService");
				CODBrowsingService = $N.services.sdp.ServiceFactory.get("CodBrowsingService");
				CODHelperService = $N.services.sdp.ServiceFactory.get("CodHelperService");
				CatalogueService = $N.services.sdp.ServiceFactory.get("CatalogueService");
				AccountService = $N.services.sdp.ServiceFactory.get("AccountService");
				PolicyService = $N.services.sdp.ServiceFactory.get("PolicyService");
				ratingService = $N.services.sdp.ServiceFactory.get("RatingService");

				loadRatingTable(LOCALE);
				setFeatureNameList(featureNameList);
				refreshContext();
			}

			/**
			 * Initialises the VOD class by establishing connections to the SDP using
			 * the provided account, connection and locale properties. Note that an account
			 * or a smart card reference is required, but not necessarily both. This method is
			 * expected to be called after the signon / bootstap code.
			 * @method initialise
			 * @deprecated use init()
			 * @param {Number} accountId Unique identifier for user.
			 * @param {Number} userId Unique identifier for user.
			 * @param {Number} smartCardId Unique identifier for smart card.
			 * @param {Boolean} rootByAccessPoint True if root should be obtained by access point
			 * @param {String} locale The new locale.
			 * @param [Array] featureNameList optional list of feature names
			 */
			function initialise(accountID, userID, smartCardId, rootByAccessPoint, locale, featureNameList) {
				init(accountID, userID, smartCardId, rootByAccessPoint, locale, featureNameList);
			}

			/**
			 * Set the account ID for VOD purchases.
			 * @method setAccountId
			 * @chainable
			 * @param {Number} accountId Unique identifier for account.
			 */
			function setAccountId(accountId) {
				ACCOUNT_ID = accountId;
				return this;
			}

			/**
			 * Set the user ID for VOD purchases.
			 * @method setUserId
			 * @chainable
			 * @param {Number} userId Unique identifier for user.
			 */
			function setUserId(userId) {
				USER_ID = userId;
				return this;
			}

			/**
			 * Set the smart card ID for VOD purchases.
			 * @method setSmartCardId
			 * @chainable
			 * @param {Number} smartCardId Unique identifier for smart card.
			 */
			function setSmartCardId(smartCardId) {
				SMART_CARD_ID = smartCardId;
				return this;
			}

			/**
			 * Sets the locale for VOD purchases.
			 * @method setLocale
			 * @chainable
			 * @param {String} locale The new locale.
			 */
			function setLocale(locale) {
				LOCALE = locale;
				loadRatingTable(LOCALE);
				return this;
			}

			/**
			 * Get the account ID for VOD purchases.
			 * @method getAccountId
			 * @return {Number} Unique identifier for account.
			 */
			function getAccountId() {
				return ACCOUNT_ID;
			}

			/**
			 * Get the user ID for VOD purchases.
			 * @method getUserId
			 * @return {Number} Unique identifier for user.
			 */
			function getUserId() {
				return USER_ID;
			}

			/**
			 * Get the smart card ID for VOD purchases.
			 * @method getSmartCardId
			 * @return {Number} smart card ID.
			 */
			function getSmartCardId() {
				return SMART_CARD_ID;
			}

			/**
			 * Get the locale for VOD purchases.
			 * @method getLocale
			 * @return {String} locale.
			 */
			function getLocale() {
				return LOCALE;
			}

			/**
			 * Get the context for VOD SDP calls
			 * @method getContext
			 * @return {Object} context.
			 */
			function getContext() {
				return context;
			}

			/**
			 * Adds a catalogue to the list of catalogues to be filtered from the root catalogues.
			 * @method addFilteredCatalogue
			 * @param {String} catalogue The name of the catalogue to add to the filtered list
			 */
			function addFilteredCatalogue(catalogue) {
				log("addFilteredCatalogue", "adding " + catalogue);
				if (filteredCatalogues.indexOf(catalogue) === -1) {
					filteredCatalogues.push(catalogue);
				}
			}

			/**
			 * Removes a catalogue from the list of catalogues to be filtered from the root catalogues.
			 * @method removeFilteredCatalogue
			 * @param {String} catalogue The name of the catalogue to remove from the filtered list
			 */
			function removeFilteredCatalogue(catalogue) {
				log("removeFilteredCatalogue", "removing " + catalogue);
				var index = filteredCatalogues.indexOf(catalogue);
				if (index !== -1) {
					filteredCatalogues.splice(index, 1);
				}
			}

			/**
			 * Clears catalogues to be filtered from the root catalogues.
			 * @method clearFilteredCatalogues
			 */
			function clearFilteredCatalogues() {
				filteredCatalogues = [];
			}

			/**
			 * Returns the list of catalogues to be filtered from the root catalogues.
			 * @method getFilteredCatalogues
			 * @return {Array} List of catalogues
			 */
			function getFilteredCatalogues() {
				return filteredCatalogues;
			}

			/**
			 * Augments the SDP asset object with lowest price and
			 * isAvailableAsSubscription properties.
			 * @method augmentAssets
			 * @private
			 * @param {Object} assets Assets to which the additional information is to be added to.
			 * @param {Function} successCallback The function to be executed once additional information has been applied to the assets.
			 */
			function augmentAssets(assets, successCallback) {
				log("augmentAssets", "Enter");

				var asset = null,
					lowestPolicy = null,
					policyListItem = null,
					offers,
					currentLowestOffer,
					scheduledItems,
					i,
					j,
					k,
					priceSortFn = function (a, b) {
						return a.value - b.value;
					};

				// Loop through asset entries and update the information entries.
				for (i = 0; i < assets.length; i++) {
					asset = assets[i];
					// Find the lowest price and make it an asset property.
					if (asset.subscribableItemType !== undefined && asset.subscribableItemType !== null) {
						if (asset.subscribableItemType === "AST") {
							lowestPolicy = null;
							if (asset.policyList) {
								for (policyListItem in asset.policyList) {
									if (asset.policyList.hasOwnProperty(policyListItem)) {
										if (!lowestPolicy || asset.policyList[policyListItem].value < lowestPolicy.value) {
											lowestPolicy = asset.policyList[policyListItem];
										}
										if (asset.policyList[policyListItem].frequency === $N.services.sdp.VOD.POLICY_FREQUENCY.SUBSCRIPTION) {
											asset.isAvailableAsSubscription = true;
										}
									}
								}
							}
							asset.lowestPrice = {
								value: lowestPolicy.value,
								currency: lowestPolicy.currency
							};
						}
					} else if (asset.editorialAsset && asset.editorialAsset.subscribableItemType === 'AST') {
						scheduledItems = asset.scheduledTechnicalItems;
						for (j = scheduledItems.length - 1; j >= 0; j--) {
							offers = scheduledItems[j].offers;
							offers.sort(priceSortFn);
							currentLowestOffer = offers[0];
							if (!lowestPolicy || currentLowestOffer.value < lowestPolicy.value) {
								lowestPolicy = {
									currency: currentLowestOffer.currency,
									value: currentLowestOffer.value,
									frequency: currentLowestOffer.frequency,
									policyGroupUid: currentLowestOffer.policyGroupUid
								};
							}
							for (k = offers.length - 1; k >= 0; k--) {
								if (offers[k].frequency === $N.services.sdp.VOD.POLICY_FREQUENCY.SUBSCRIPTION) {
									asset.isAvailableAsSubscription = true;
									break;
								}
							}
						}
						asset.lowestPrice = {
							value: lowestPolicy.value,
							currency: lowestPolicy.currency
						};
					}
				}
				if (successCallback) {
					successCallback(assets);
				}
				log("augmentAssets", "Exit");
			}

			/**
			 * Augments the SDP catalogue object by adding an entries and `isBundle` property.
			 * @method augmentCatalogues
			 * @private
			 * @param {Object} catalogues Catalogues to which the additional information is to be added to.
			 * @param {Function} successCallback The function to be executed once additional information has been applied to the catalogues.
			 */
			function augmentCatalogues(catalogues, successCallback) {
				log("augmentCatalogues", "Enter");
				if (contextRefreshing === true) {
					log("augmentCatalogues", "Defering until context available");
					setTimeout(function () {augmentCatalogues(catalogues, successCallback); }, 1000);
					return;
				}
				var numberOfItems = catalogues.length,
					targetTally = numberOfItems * 2,
					currentTally = 0,
					codServiceCall = null,
					codHelperServiceCall = null,
					i = null,
					checkFinishedAndCallback = function () {
						if (currentTally === targetTally && successCallback) {
							successCallback(catalogues);
						}
					};

				if (targetTally === 0) {
					if (successCallback) {
						successCallback(catalogues);
					}
					return;
				}

				// loop through catalogue entries and update browser item entries using service call results
				for (i in catalogues) {
					if (catalogues.hasOwnProperty(i)) {
						// get number of titles in catalogue
						codServiceCall = (function (item) {
							CODBrowsingService.getScheduledItemsCount(this, function (result) {
								item.entries = result;
								currentTally++;
								checkFinishedAndCallback();
							}, function () {
								currentTally++;
								checkFinishedAndCallback();
								// do nothing
							}, $N.apps.util.JSON.stringify({
								context: context,
								filter: {
									scheduleIsCurrent: true,
									scheduleStatus: 'P',
									assetPlayType: 'E',
									offerFrequencyType: ['IMP', 'MUL', 'REC'],
									catalogueUid: item.uid
								}
							}));
						}(catalogues[i]));

						// check if bundle purchase option available for catalogue
						codHelperServiceCall = (function (item) {
							CODHelperService.hasPurchaseAllAvailableForCatAndTvodAssetGroup(
								this,
								function (result) {
									if (result.length > 0) {
										item.isBundle = true;
									} else {
										item.isBundle = false;
									}
									currentTally++;
									checkFinishedAndCallback();
								},
								function (result) {
									currentTally++;
									checkFinishedAndCallback();
									log("augmentCatalogues", "CODHelperService.hasPurchaseAllAvailableForCatAndTvodAssetGroup " + result);
								},
								item.uid,
								null,
								LOCALE
							);
						}(catalogues[i]));
					}
				}
				log("augmentCatalogues", "Exit");
			}

			/**
			 * Filters the catalogues by removing all included in the filtered catalogues list.
			 * @method filterCatalogues
			 * @private
			 * @param {Object} catalogues The catalogues from which the Hot Picks catalogues are to be removed from.
			 * @return {Object} The catalogues passed into the function, not including any Hot Picks catalogues.
			 */
			function filterCatalogues(catalogues) {
				var filterIndex,
					i,
					filter;

				for (i = 0; i < catalogues.length; i++) {
					catalogues[i].parentalRatingValue = ratingLookUp[catalogues[i].parentalRating] ? ratingLookUp[catalogues[i].parentalRating].precedenceValue : null;
					for (filterIndex = 0; filterIndex < filteredCatalogues.length; filterIndex++) {
						filter = filteredCatalogues[filterIndex];
						if (catalogues[i].name === filter) {
							catalogues.splice(i, 1);
							i--;
							break;
						}
					}
				}
				return catalogues;
			}

			/**
			 * Removes any non-active assets from a group of assets.
			 * @method filterActiveAssets
			 * @private
			 * @param {Object} assets The array of assets to be filtered.
			 * @return {Object} Only the active assets that were passed into the function.
			 */
			function filterActiveAssets(assets) {
				var filteredAssets = [],
					i = 0,
					numAssets,
					asset = null;
				for (i = 0, numAssets = assets.length; i < numAssets; i++) {
					if (assets[i] && assets[i] !== undefined) {
						asset = assets[i];
						if (asset.editorialAsset.status === 'A') {
							asset.parentalRatingValue = ratingLookUp[asset.editorialAsset.parentalRating] ? ratingLookUp[asset.editorialAsset.parentalRating].precedenceValue : null;
							filteredAssets.push(asset);
						}
					}
				}
				return filteredAssets;
			}

			/**
			 * Gets all root catalogues that are subscribed, and removes catalogues added to
			 * the filtered catalogues list.
			 * @method getRootCatalogues
			 * @async
			 * @param {Function} catalogueSuccessCallback The function to be executed if the call to SDP succeeds.
			 * @param {Function} detailSuccessCallback The function to be executed once additional catalogue information has been retrieved.
			 * @param {Function} failureCallback The function to be executed if the call to SDP fails.
			 */
			function getRootCatalogues(catalogueSuccessCallback, detailSuccessCallback, failureCallback) {
				log("getRootCatalogues", "Enter");
				var USER_ACCOUNT = null,
					successCallback = function (result) {
						var filteredResults = filterCatalogues(result);
						augmentCatalogues(filteredResults, detailSuccessCallback);
						if (catalogueSuccessCallback) {
							catalogueSuccessCallback(filteredResults);
						}
					};

				if (VOD_ROOT_BY_ACCP) {
					// get root catalogues by access point
					if (ACCESS_POINT_ID) {
						log("getRootCatalogues", "retrieve root catalogues by access point");
						CatalogueService.getBaseCataloguesByAccptUid(this, successCallback, failureCallback, ACCESS_POINT_ID, LOCALE);
					} else {
						// if access point not set, then retrieve using account before getting catalogues
						log("getRootCatalogues", "retrieving access point");
						AccountService.getByUID(this,
							function (result) {
								if (result) {
									USER_ACCOUNT = result;
									ACCESS_POINT_ID = USER_ACCOUNT.accessPointUID;
									CatalogueService.getBaseCataloguesByAccptUid(this, successCallback, failureCallback, ACCESS_POINT_ID, LOCALE);
								}
							},
							function (result) {
								log("getRootCatalogues", "getByAccountUIDWithoutSpid fail");
							},
							ACCOUNT_ID);
					}
				} else {
					// get root catalogues by subscription
					log("getRootCatalogues", "retrieve root catalogues by subscription");
					CODService.getSubscribedBaseCatalogues(this, successCallback, failureCallback, LOCALE);
				}
				log("getRootCatalogues", "Exit");
			}

			/**
			 * Retrieves a detailed list of catalogues associated with the specified parent
			 * catalogue UID for the current locale.
			 * @method getDetailedCatalogues
			 * @async
			 * @param {Function} catalogueSuccessCallback The function to be executed if the call to SDP succeeds.
			 * @param {Function} detailSuccessCallback The function to be executed once additional catalogue information has been retrieved.
			 * @param {Function} failureCallback The function to be executed if the call to SDP fails.
			 * @param {Number} catalogueUID The UID of the parent catalogue.
			 */
			function getDetailedCatalogues(catalogueSuccessCallback, detailSuccessCallback, failureCallback, catalogueUID) {
				log("getDetailedCatalogues", "enetr");

				var successCallback = function (result) {
					augmentCatalogues(result, detailSuccessCallback);
					if (catalogueSuccessCallback) {
						catalogueSuccessCallback(result);
					}
				};

				CODService.getCatalogueChildCatalogueNodes(this, successCallback, failureCallback, catalogueUID, LOCALE);
			}

			/**
			 * Retrieves a filtered list of assets associated with the specified parent
			 * catalogue UID for the current locale. Optionally, assets are also filtered
			 * on the title string supplied.
			 * @method getDetailedAssets
			 * @async
			 * @param {Function} assetSuccessCallback The function to be executed if the call to SDP succeeds.
			 * @param {Function} detailSuccessCallback The function to be executed once additional asset information has been retrieved.
			 * @param {Function} failureCallback The function to be executed if the call to SDP fails.
			 * @param {Number} catalogueUID The UID of the catalogue from which the schedules should be retrieved.
			 * @param {String} [assetTitleFilterString=''] The asset title filter string.
			 * @param {Array} sortArray list of columns on which returned data is to be sorted.
			 */
			function getDetailedAssets(assetSuccessCallback, detailSuccessCallback, failureCallback, catalogueUID, assetTitleFilterString, sortArray) {
				log("getDetailedAssets", "Enter: " + catalogueUID);
				if (contextRefreshing === true) {
					log("getDetailedAssets", "Deferring until context available");
					setTimeout(function () {getDetailedAssets(assetSuccessCallback, detailSuccessCallback, failureCallback, catalogueUID, assetTitleFilterString, sortArray); }, 1000);
					return;
				}
				var successCallback = function (result) {
						var filteredResult = filterActiveAssets(result);
						if (assetSuccessCallback) {
							assetSuccessCallback(filteredResult);
						}
						augmentAssets(filteredResult, detailSuccessCallback);
					},
					request = {};

				assetTitleFilterString = assetTitleFilterString || "";

				request.context = context;
				request.filter = {
					scheduleIsCurrent: true,
					scheduleStatus: 'P',
					catalogueUid: catalogueUID,
					assetTitleSubstringList: [assetTitleFilterString]
				};
				request.sortOrder = sortArray;

				CODBrowsingService.getScheduledItems(this, successCallback, function () {
				}, $N.apps.util.JSON.stringify(request));

				log("getDetailedAssets", "Exit");
			}

			/**
			 * Retrieves the list of assets from a given catalogue
			 * @method getAssets
			 * @async
			 * @param {Number} catalogueUID UI of the catalogue we wish to retrieve assets for
			 * @param {Function} returnCallback Function to run once assets have been retrieved. This function should
			 * expect an array of assets indexed by their uid to be its input parameter
			 * @param {Array} sortArray list of columns on which returned data is to be sorted.
			 */
			function getAssets(catalogueUID, returnCallback, sortArray) {
				log('getAssets', 'Enter');
				if (contextRefreshing === true) {
					setTimeout(function () {getAssets(catalogueUID, returnCallback, sortArray); }, 1000);
					log('getAssets', 'Exit (waiting for the context refresh to finish)');
					return;
				}
				var assetSuccess = function (assetData) {
					var i,
						assets = [];
					for (i = 0; i < assetData.length; i++) {
						assets.push(assetData[i]);
					}
					returnCallback(assets);
				},
					request = {};

				request.context = context;
				request.filter = {
					scheduleIsCurrent: true,
					scheduleStatus: 'P',
					assetPlayType: 'E',
					offerFrequencyType: ['IMP', 'MUL', 'REC'],
					catalogueUid: catalogueUID
				};
				request.sortOrder = sortArray;

				CODBrowsingService.getScheduledItems(this, assetSuccess, function () {
				}, $N.apps.util.JSON.stringify(request));
				log('getAssets', 'Exit');
			}

			/**
			 * Retrieves the asset object with its schedules for the given asset uid
			 * @method getAssetSchedulesByUid
			 * @async
			 * @deprecated This function has been deprecated in favour of `getDetailedAssetByUid`
			 * @param {Number} uid the uid of the asset
			 * @param {Function} successCallback The function to run upon successfully returning the asset object
			 * @param {Function} failureCallback the function to run upon failing to retrieve the asset object
			 * @param {Array} sortArray list of columns on which returned data is to be sorted.
			 */
			function getAssetSchedulesByUid(uid, successCallback, failureCallback, sortArray) {
				log('getAssetSchedulesByUid', 'Enter');
				if (contextRefreshing === true) {
					setTimeout(function () {getAssetSchedulesByUid(uid, successCallback, failureCallback, sortArray); }, 1000);
					log('getAssetSchedulesByUid', 'Exit (waiting for the context refresh to finish)');
					return;
				}
				var asset,
					assetSuccess = function (assetData) {
						asset = assetData[0];
						successCallback([asset]);
					},
					request = {};
				request.context = context;
				request.filter = {
					assetUid: uid
				};
				request.sortOrder = sortArray;

				CODBrowsingService.getScheduledItems(this, assetSuccess, failureCallback,
					$N.apps.util.JSON.stringify(request));
				log('getAssetSchedulesByUid', 'Exit');
			}

			/**
			 * Retrieves the detailed asset object with its schedules for the given editorial asset uid
			 * @method getDetailedAssetByUid
			 * @async
			 * @param {Number} uid the unique id of the editorial asset
			 * @param {Function} successCallback The function to run upon successfully returning the asset object
			 * @param {Function} failureCallback the function to run upon failing to retrieve the asset object
			 * @param {Boolean} [augment=true] indicates whether the returned assets should be augmented
			 */
			function getDetailedAssetByUid(uid, successCallback, failureCallback, augment) {
				log('getDetailedAssetByUid', 'Enter');
				if (contextRefreshing === true) {
					setTimeout(function () {getDetailedAssetByUid(uid, successCallback, failureCallback, augment); }, 1000);
					log('getDetailedAssetByUid', 'Exit (waiting for the context refresh to finish)');
					return;
				}
				augment = (augment !== undefined && augment !== null) ? augment : true;
				var assetSuccess = function (result) {
						var filteredResult = filterActiveAssets(result),
							augmentCallback = function (augmentedAssets) {
								successCallback(augmentedAssets[0]);
							};
						if (augment) {
							augmentAssets(filteredResult, augmentCallback);
						} else {
							successCallback(filteredResult[0]);
						}
					},
					request = {};
				request.context = context;
				request.filter = {
					assetUid: uid
				};
				CODBrowsingService.getScheduledItems(this, assetSuccess, failureCallback, $N.apps.util.JSON.stringify(request));
				log('getDetailedAssetByUid', 'Exit');
			}

			/**
			 * Retrieves the detailed asset object for the given technical asset uid
			 * @method getAssetsByIds
			 * @async
			 * @param {Array} uids the uids of the assets
			 * @param {Function} successCallback The function to run upon successfully returning the asset object
			 * @param {Function} failureCallback the function to run upon failing to retrieve the asset object
			 * @param {Boolean} [augment=true] indicates whether the returned assets should be augmented
			 */
			function getAssetsByIds(uids, successCallback, failureCallback, augment) {
				log("getAssetsByIds", "Enter");
				var i = 0,
					assets = [],
					detailSuccessCallback = function (asset) {
						assets.push(asset);
					};
				for (i = 0; i < uids.length; i++) {
					getDetailedAssetByUid(uids[i], detailSuccessCallback, {}, augment);
				}
				if (assets.length === uids.length) {
					successCallback(assets);
				} else {
					failureCallback("getAssetsByIds error");
				}
				log('getAssetsByIds', 'Exit');
			}

			/**
			 * Retrieves the detailed asset object for the given technical asset uid
			 * @method getDetailedAssetByTechnicalId
			 * @async
			 * @param {Number} id the unique id of the technical asset
			 * @param {Function} successCallback The function to run upon successfully returning the asset object
			 * @param {Function} failureCallback the function to run upon failing to retrieve the asset object
			 * @param {Boolean} [augment=true] indicates whether the returned assets should be augmented
			 */
			function getDetailedAssetByTechnicalId(id, successCallback, failureCallback, augment) {
				log('getDetailedAssetByTechnicalId', 'Enter');
				if (contextRefreshing === true) {
					setTimeout(function () {getDetailedAssetByTechnicalId(id, successCallback, failureCallback, augment); }, 1000);
					log('getDetailedAssetByTechnicalId', 'Exit (waiting for the context refresh to finish)');
					return;
				}
				augment = (augment !== undefined && augment !== null) ? augment : true;
				var assetSuccess = function (assetData) {
						var filteredResult = filterActiveAssets(assetData),
							augmentCallback = function (augmentedAssets) {
								successCallback(augmentedAssets[0]);
							};
						if (augment) {
							augmentAssets(filteredResult, augmentCallback);
						} else {
							successCallback(filteredResult[0]);
						}
					},
					request = {};
				request.context = context;
				request.filter = {
					technicalAssetUid: id
				};
				CODBrowsingService.getScheduledItems(this, assetSuccess, failureCallback, $N.apps.util.JSON.stringify(request));
				log('getDetailedAssetByTechnicalId', 'Exit');
			}

			/**
			 * Retrieves a detailed list of assets associated with the specified parent
			 * catalogue UID for the current locale.
			 * @method getPagedDetailedAssets
			 * @async
			 * @param {Function} assetSuccessCallback The function to be executed if the call to SDP succeeds.
			 * @param {Function} detailSuccessCallback The function to be executed once additional asset information has been retrieved.
			 * @param {Function} failureCallback The function to be executed if the call to SDP fails.
			 * @param {Number} catalogueUID The UID of the catalogue from which the schedules should be retrieved.
			 * @param {String} assetTitleFilterString The asset title filter string.
			 * @param {Number} startIndex The start index of the paged results. The first item is at index 0.
			 * @param {Number} endIndex The end index of the paged results.
			 * @param {Array} [sortArray=["assetTitle"]] list of columns on which returned data is to be sorted.
			 */
			function getPagedDetailedAssets(assetSuccessCallback, detailSuccessCallback, failureCallback, catalogueUID, assetTitleFilterString, startIndex, endIndex, sortArray) {
				log("getPagedDetailedAssets", "Enter");
				if (contextRefreshing === true) {
					log("getPagedDetailedAssets", "Deferring until context available");
					setTimeout(function () {getPagedDetailedAssets(assetSuccessCallback, detailSuccessCallback, failureCallback, catalogueUID, assetTitleFilterString, startIndex, endIndex, sortArray); }, 1000);
					return;
				}
				var successCallback = function (result) {
						var filteredResult = filterActiveAssets(result);
						if (assetSuccessCallback) {
							assetSuccessCallback(filteredResult);
						}
						augmentAssets(filteredResult, detailSuccessCallback);
						log("getPagedDetailedAssets", "Exit");
					},
					request = {};

				assetTitleFilterString = assetTitleFilterString || "";
				request.context = context;
				request.filter = {
					catalogueUid: catalogueUID,
					scheduledStatus: "P",
					scheduledIsCurrent: true,
					assetTitleSubstringList: [assetTitleFilterString]
				};
				request.sortOrder = sortArray && sortArray.length > 0 ? sortArray : ["assetTitle"];
				request.startRow = startIndex;
				request.endRow = endIndex;

				CODBrowsingService.getScheduledItems(this, successCallback, failureCallback, $N.apps.util.JSON.stringify(request));
			}

			/**
			 * Retrieves a detailed list of assets associated with the specified parent policy group UID for the current locale.
			 * @method getPagedDetailedAssetsByProduct
			 * @async
			 * @param {Function} assetSuccessCallback The function to be executed if the call to SDP succeeds.
			 * @param {Function} detailSuccessCallback The function to be executed once additional asset information has been retrieved.
			 * @param {Function} failureCallback The function to be executed if the call to SDP fails.
			 * @param {Number} policyGroupUID The UID of the policy group from which the schedules should be retrieved.
			 * @param {String} assetTitleFilterString The asset title filter string.
			 * @param {Number} startIndex The start index of the paged results. The first item is at index 0.
			 * @param {Number} endIndex The end index of the paged results.
			 * @param {Array} [sortArray=["assetTitle"]] list of columns on which returned data is to be sorted.
			 */
			function getPagedDetailedAssetsByProduct(assetSuccessCallback, detailSuccessCallback, failureCallback, policyGroupUID, assetTitleFilterString, startIndex, endIndex, sortArray) {
				log("getPagedDetailedAssetsByProduct", "Enter");
				if (contextRefreshing === true) {
					log("getPagedDetailedAssetsByProduct", "Deferring until context available");
					setTimeout(function () {
						getPagedDetailedAssetsByProduct(assetSuccessCallback, detailSuccessCallback, failureCallback, policyGroupUID, assetTitleFilterString, startIndex, endIndex, sortArray);
					}, 1000);
					return;
				}
				var successCallback = function (result) {
						var filteredResult = filterActiveAssets(result);
						if (assetSuccessCallback) {
							assetSuccessCallback(filteredResult);
						}
						augmentAssets(filteredResult, detailSuccessCallback);
						log("getPagedDetailedAssetsByProduct", "Exit");
					},
					request = {};
				request.context = context;
				assetTitleFilterString = assetTitleFilterString || "";
				request.filter = {
					offerUid: policyGroupUID,
					scheduledStatus: "P",
					scheduledIsCurrent: true,
					assetTitleSubstringList: [assetTitleFilterString]
				};
				request.sortOrder = sortArray && sortArray.length > 0 ? sortArray : ["assetTitle"];
				request.startRow = startIndex;
				request.endRow = endIndex;
				CODBrowsingService.getScheduledItems(this, successCallback, failureCallback, $N.apps.util.JSON.stringify(request));
			}

			/**
			 * Retrieves the number of current, valid schedules in the specified catalogue,
			 * specific to the title filter string and current locale.
			 * @method getCatalogueScheduleCount
			 * @param {Function} successCallback The function to be executed if the call to SDP succeeds.
			 * @param {Function} failureCallback The function to be executed if the call to SDP fails.
			 * @param {Number} catalogueUID The ID of the catalogue from which the number of catalogue schedules should be counted.
			 * @param {String} [assetTitleFilterString=""] The asset title filter string.
			 */
			function getCatalogueScheduleCount(successCallback, failureCallback, catalogueUID, assetTitleFilterString) {
				log("getCatalogueScheduleCount", "Enter");
				if (contextRefreshing === true) {
					log("getCatalogueScheduleCount", "Deferring until context available");
					setTimeout(function () {getCatalogueScheduleCount(successCallback, failureCallback, catalogueUID, assetTitleFilterString); }, 1000);
					return;
				}
				var catalogueCountSuccess = function (result) {
					if (successCallback) {
						successCallback(result);
					}
				};
				assetTitleFilterString = assetTitleFilterString || "";
				CODBrowsingService.getScheduledItemsCount(this, catalogueCountSuccess, failureCallback, $N.apps.util.JSON.stringify({
					context: context,
					filter: {
						scheduleIsCurrent: true,
						scheduleStatus: 'P',
						assetPlayType: 'E',
						offerFrequencyType: ['IMP', 'MUL', 'REC'],
						assetTitleSubstringList: [assetTitleFilterString],
						catalogueUid: catalogueUID
					}
				}));
				log("getCatalogueScheduleCount", "Exit");
			}

			/**
			 * Retrieves the number of current, valid schedules associated with the policy group UID for the current locale,
			 * filtered by the optional asset title
			 * @method getCatalogueScheduleCountByProduct
			 * @param {Function} successCallback The function to be executed if the call to SDP succeeds.
			 * @param {Function} failureCallback The function to be executed if the call to SDP fails.
			 * @param {Number} policyGroupUID The UID of the policy group from which the schedules should be retrieved.
			 * @param {String} [assetTitleFilterString=""] The asset title filter string.
			 */
			function getCatalogueScheduleCountByProduct(successCallback, failureCallback, policyGroupUID, assetTitleFilterString) {
				log("getCatalogueScheduleCountByProduct", "Enter");
				if (contextRefreshing === true) {
					log("getCatalogueScheduleCountByProduct", "Deferring until context available");
					setTimeout(function () {
						getCatalogueScheduleCountByProduct(successCallback, failureCallback, policyGroupUID, assetTitleFilterString);
					}, 1000);
					return;
				}
				var catalogueCountSuccess = function (result) {
					if (successCallback) {
						successCallback(result || 0);
					}
				};
				assetTitleFilterString = assetTitleFilterString || "";
				CODBrowsingService.getScheduledItemsCount(this, catalogueCountSuccess, failureCallback, $N.apps.util.JSON.stringify({
					context: context,
					filter: {
						scheduledIsCurrent: true,
						scheduledStatus: 'P',
						assetPlayType: 'E',
						offerFrequencyType: ['IMP', 'MUL', 'REC'],
						assetTitleSubstringList: [assetTitleFilterString],
						offerUid: policyGroupUID
					}
				}));
				log("getCatalogueScheduleCountByProduct", "Exit");
			}

			/**
			 * Searches the given array of assets for common bundle or subscription policy
			 * groups.
			 * @method getCommonPolicyGroupsForAssets
			 * @param {Array} assets List of asset objects.
			 * @return {Object} Object containing the common bundle and / or subscription policy group in the following attributes:
			 *
			 *     bundlePolicyGroup: {Object}
			 *     subscriptionPolicyGroup: {Object}
			 */
			function getCommonPolicyGroupsForAssets(assets) {
				log("getCommonPolicyGroupsForAssets", "Enter");

				var i = null,
					pgi = null,
					firstAssetPolicyList = null,
					bundlePolicyGroup = null,
					subscriptionPolicyGroup = null,
					assetPolicyGroups = null,
					assetHasPolicyGroup = null,
					totalAssets = assets.length;

				if (totalAssets > 0) {
					// check if a bundle or subscription policy group is available for the first asset
					firstAssetPolicyList = assets[0].policyList;
					for (i = 0; i < firstAssetPolicyList.length; i++) {
						if (firstAssetPolicyList[i].frequency === $N.services.sdp.VOD.POLICY_FREQUENCY.SUBSCRIPTION) {
							//subscriptionPolicyGroup = firstAssetPolicyList[i].policyGroupUid;
							subscriptionPolicyGroup = assets[0].policyGroups[i];
						}
						if (firstAssetPolicyList[i].frequency === $N.services.sdp.VOD.POLICY_FREQUENCY.BUNDLE) {
							//bundlePolicyGroup = firstAssetPolicyList[i].policyGroupUid;
							bundlePolicyGroup = assets[0].policyGroups[i];
						}
					}

					// loop through the remaining assets and check if they have the same bundle policy group
					if (bundlePolicyGroup) {
						for (i = 1; i < totalAssets && bundlePolicyGroup; i++) {
							assetPolicyGroups = assets[i].policyGroups;
							assetHasPolicyGroup = false;

							for (pgi = 0; pgi < assetPolicyGroups.length && !assetHasPolicyGroup; pgi++) {
								if (assetPolicyGroups[pgi].uid === bundlePolicyGroup.uid) {
									assetHasPolicyGroup = true;
								}
							}

							if (!assetHasPolicyGroup) {
								bundlePolicyGroup = null;
							}
						}
					}

					// loop through the remaining assets and check if they have the same subscription policy group
					if (subscriptionPolicyGroup) {
						for (i = 1; i < totalAssets && subscriptionPolicyGroup; i++) {
							assetPolicyGroups = assets[i].policyGroups;
							assetHasPolicyGroup = false;

							for (pgi = 0; pgi < assetPolicyGroups.length && !assetHasPolicyGroup; pgi++) {
								if (assetPolicyGroups[pgi].uid === subscriptionPolicyGroup.uid) {
									assetHasPolicyGroup = true;
								}
							}

							if (!assetHasPolicyGroup) {
								subscriptionPolicyGroup = null;
							}
						}
					}
				}

				log("getCommonPolicyGroupsForAssets", "Exit");
				return {
					bundlePolicyGroup: bundlePolicyGroup,
					subscriptionPolicyGroup: subscriptionPolicyGroup
				};
			}

			/**
			 * Retrieves a policy of a given type from a policy group.
			 * If policy type is not defined, then the flat rate policy is returned.
			 * @method getPolicyByPolicyGroupId
			 * @async
			 * @param {Number} policyGroupId The policy group identifier.
			 * @param {String} policyType The policy type (one of POLICY_TYPE constants)
			 * @param {Function} caller Reference to the calling function.
			 * @param {Function} successCallback Function to execute on success.
			 * @param {Function} failCallback Function to execute on failure
			 */
			function getPolicyByPolicyGroupId(policyGroupId, policyType, caller, successCallback, failCallback) {
				if (policyType === null) {
					policyType = $N.services.sdp.VOD.POLICY_TYPE.FLAT_PRICE;
				}
				PolicyService.getByPolicyGroupUID(caller, successCallback, failCallback,
						policyGroupId, policyType, LOCALE);
			}

			/**
			 * Subscribes to an individual asset using a policy group.
			 * @method subscribeToAsset
			 * @async
			 * @deprecated use subscribeToPolicyGroup instead
			 * @param {Number} assestId The asset identifier.
			 * @param {Number} policyGroupId The policy group identifier.
			 * @param {Function} caller Reference to the calling function.
			 * @param {Function} successCallback Function to execute on success.
			 * @param {Function} failCallback Function to execute on failure
			 */
			function subscribeToAsset(assetId, policyGroupId, caller, successCallback, failCallback) {
				log("SubscribeToAsset", "asset " + assetId + " using policy group " + policyGroupId);
				CODService.subscribeToAsset(caller, successCallback, failCallback,
						ACCOUNT_ID, null, assetId, policyGroupId, LOCALE, SMART_CARD_ID);

				//TODO: Support signon by user
				// CODService.subscribeToAsset(caller, successCallback, failCallback,
				//		ACCOUNT_ID, USER_ID, assetId, policyGroupId, LOCALE, SMART_CARD_ID);
			}

			/**
			 * Subscribes to a policy group.
			 * @method subscribeToPolicyGroup
			 * @async
			 * @param {Number} policyGroupId The policy group identifier.
			 * @param {Function} caller Reference to the calling function.
			 * @param {Function} successCallback Function to execute on success.
			 * @param {Function} failCallback Function to execute on failure
			 */
			function subscribeToPolicyGroup(policyGroupId, caller, successCallback, failCallback) {
				log("subscribeToPolicyGroup", "policy group " + policyGroupId);
				CODService.subscribeToPolicyGroup(caller, successCallback, failCallback,
						ACCOUNT_ID, null, policyGroupId, LOCALE, SMART_CARD_ID);

				//TODO: Support signon by user
				// CODService.subscribeToPolicyGroup(caller, successCallback, failCallback,
				//		ACCOUNT_ID, USER_ID, policyGroupId, LOCALE, SMART_CARD_ID);
			}

			/**
			 * Subscribes to an asset using a policy if the policy is an impulse purchase.
			 * If the policy is for a subscription or a bundle,
			 * then the purchase is made via the policy group to ensure the subscription
			 * and/or bundle purchase is completed along with the asset.
			 * This method requires the asset and policy objects (rather than their
			 * identifiers) so that it can determine the subscription method to use.
			 * For direct subscription to an asset or policy group, see `subscribeToAsset` and
			 * `subscribeToPolicyGroup`.
			 * @method subscribeToAssetUsingPolicy
			 * @async
			 * @deprecated use subscribeToPolicyGroup instead
			 * @param {Object} asset The asset object.
			 * @param {Object} policy The policy object (obtainable from the asset).
			 * @param {Function} caller Reference to the calling function.
			 * @param {Function} successCallback Function to execute on success.
			 * @param {Function} failCallback Function to execute on failure
			 */
			function subscribeToAssetUsingPolicy(asset, policy, caller, successCallback, failCallback) {
				log("subscribeToAssetUsingPolicy", "Enter");

				var frequency = policy ? policy.frequency : '',
					assetId = asset.uid || asset.technicalAsset.uid; //allows ui to pass in user id instead of asset object when using technical assets
				if (frequency === $N.services.sdp.VOD.POLICY_FREQUENCY.IMPULSE) {
					// impulse policy, so subscribe to asset
					log("subscribeToAssetUsingPolicy", "subscribe to asset " + assetId);
					subscribeToAsset(assetId, policy.policyGroupUid, caller, successCallback, failCallback);
				} else if (frequency === $N.services.sdp.VOD.POLICY_FREQUENCY.SUBSCRIPTION ||
						frequency === $N.services.sdp.VOD.POLICY_FREQUENCY.BUNDLE) {
					// recurring or multiple policy so subscribe to the policy group
					log("subscribeToAssetUsingPolicy", "subscribe to policy group " + policy.policyGroupUid);
					subscribeToPolicyGroup(policy.policyGroupUid, caller, successCallback, failCallback);
				} else {
					log("subscribeToAssetUsingPolicy", "Unhandled policy frequency: " + frequency);
					failCallback();
				}
				log("subscribeToAssetUsingPolicy", "Exit");
			}

			/**
			 * Subscribes to an asset using the offer object.
			 *
			 * @method subscribeToAssetUsingOffer
			 * @async
			 * @param {Object} asset The asset object.
			 * @param {Object} offer The offer object (obtainable from the asset).
			 * @param {Function} caller Reference to the calling function.
			 * @param {Function} successCallback Function to execute on success.
			 * @param {Function} failCallback Function to execute on failure
			 */
			function subscribeToAssetUsingOffer(asset, offer, caller, successCallback, failCallback) {
				log("subscribeToAssetUsingOffer", "Enter");
				var policyList = {
					frequency: offer.frequency,
					policyGroupUid: offer.policyGroupUid,
					value: offer.value
				};
				subscribeToAssetUsingPolicy(asset, policyList, this, successCallback, failCallback);
				log("subscribeToAssetUsingOffer", "Exit");
			}

			/**
			 * Unsubscribe a previously subscribed asset.
			 * @method unsubscribeAsset
			 * @async
			 * @deprecated no longer supported by SDP
			 * @param {Number} assestId The asset identifier.
			 * @param {Function} caller Reference to the calling function.
			 * @param {Function} successCallback Function to execute on success.
			 * @param {Function} failCallback Function to execute on failure
			 */
			function unsubscribeAsset(assetId, caller, successCallback, failCallback) {
				log("unsubscribeAsset", "asset " + assetId);

				CODService.unsubscribeAsset(caller, successCallback, failCallback,
						ACCOUNT_ID, assetId, LOCALE, SMART_CARD_ID);
			}

			/*
			 * Public API
			 */
			return {
				init: init,
				initialise: initialise,
				setAccountId: setAccountId,
				setUserId: setUserId,
				setSmartCardId: setSmartCardId,
				setLocale: setLocale,
				setFeatureNameList: setFeatureNameList,
				getFeatureNameList: getFeatureNameList,
				refreshContext: refreshContext,
				getAccountId: getAccountId,
				getUserId: getUserId,
				getSmartCardId: getSmartCardId,
				getLocale: getLocale,
				getContext: getContext,
				getAssets: getAssets,
				addFilteredCatalogue: addFilteredCatalogue,
				removeFilteredCatalogue: removeFilteredCatalogue,
				clearFilteredCatalogues: clearFilteredCatalogues,
				getAssetSchedulesByUid: getAssetSchedulesByUid,
				getFilteredCatalogues: getFilteredCatalogues,
				getRootCatalogues: getRootCatalogues,
				getDetailedCatalogues: getDetailedCatalogues,
				getDetailedAssets: getDetailedAssets,
				getDetailedAssetByUid: getDetailedAssetByUid,
				getDetailedAssetByTechnicalId: getDetailedAssetByTechnicalId,
				getAssetsByIds: getAssetsByIds,
				getPagedDetailedAssets: getPagedDetailedAssets,
				getPagedDetailedAssetsByProduct: getPagedDetailedAssetsByProduct,
				getCommonPolicyGroupsForAssets: getCommonPolicyGroupsForAssets,
				getPolicyByPolicyGroupId: getPolicyByPolicyGroupId,
				subscribeToAsset: subscribeToAsset,
				subscribeToPolicyGroup: subscribeToPolicyGroup,
				subscribeToAssetUsingPolicy: subscribeToAssetUsingPolicy,
				subscribeToAssetUsingOffer: subscribeToAssetUsingOffer,
				unsubscribeAsset: unsubscribeAsset,
				getCatalogueScheduleCount: getCatalogueScheduleCount,
				getCatalogueScheduleCountByProduct: getCatalogueScheduleCountByProduct
			};

		}());


		// Policy frequencies
		$N.services.sdp.VOD.POLICY_FREQUENCY = {};

		/**
		 * Policy group of type impulse purchase.
		 * @property {String} POLICY_FREQUENCY.IMPULSE
		 * @readonly
		 */
		$N.services.sdp.VOD.POLICY_FREQUENCY.IMPULSE = 'IMP';

		/**
		 * Policy group of type recurring subscription.
		 * @property {String} POLICY_FREQUENCY.SUBSCRIPTION
		 * @readonly
		 */
		$N.services.sdp.VOD.POLICY_FREQUENCY.SUBSCRIPTION = 'REC';

		/**
		 * Policy group of type multiple bundle.
		 * @property {String} POLICY_FREQUENCY.BUNDLE
		 * @readonly
		 */
		$N.services.sdp.VOD.POLICY_FREQUENCY.BUNDLE = 'MUL';


		// Policy types
		$N.services.sdp.VOD.POLICY_TYPE = {};

		/**
		 * Policy type for flat rate price.
		 * @property {String} POLICY_TYPE.FLAT_PRICE
		 * @readonly
		 */
		$N.services.sdp.VOD.POLICY_TYPE.FLAT_PRICE = 'BP';

		/**
		 * Policy type for flat rate discount price.
		 * @property {String} POLICY_TYPE.FLAT_RATE_DISCOUNT
		 * @readonly
		 */
		$N.services.sdp.VOD.POLICY_TYPE.FLAT_RATE_DISCOUNT = 'FRD';

		/**
		 * Policy type for percentage discount price.
		 * @property {String} POLICY_TYPE.PERCENTAGE_DISCOUNT
		 * @readonly
		 */
		$N.services.sdp.VOD.POLICY_TYPE.PERCENTAGE_DISCOUNT = 'PD';

		return $N.services.sdp.VOD;
	}
);