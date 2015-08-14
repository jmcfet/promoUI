/**
 * A utility class that retrieves data from the MDS server
 * N.B: This class will be expanded at a later date to cater for SDP as well as MDS
 * @class $N.app.MDSUtil
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	$N.app = $N.app || {};
	$N.app.MDSUtil = (function () {
		var log = new $N.apps.core.Log("Helper", "MDSUtil"),
			CONTENT_TYPE = {
				CATALOGUES: 1,
				ASSETS: 2,
				CLUBE: 3,
				HIGHLIGHTS: 4,
				MYCONTENT: 5,
				MYSUBSCRIPTIONS: 6,
				EMPTY: 7
			},
			failureBackoffTimeIndex = 0,
			defaultNOWCatalogues = [],
			myContentCatalogues = [],
			searchCatalogues = [],
			currentRequestID = -1,
			currentRequestsReceived = [],
			MetadataService = $N.services.sdp.MetadataService,
			constants = $N.app.constants,
			mdsAddress,
			emptyNodes,
			L_RATING = 8,
			assetDataMapper = {
				getEditorialId: function (obj) {
					if (obj && obj.id) {
						return obj.id;
					}
					return null;
				},
				getTechnicalId: function (obj) {
					if (obj.technicals && obj.technicals[0] && obj.technicals[0].id) {
						return obj.technicals[0].id;
					}
					return null;
				},
				getProductId: function (obj) {
					if (obj.technicals && obj.technicals[0] && obj.technicals[0].products[0] && obj.technicals[0].products[0].id) {
						return obj.technicals[0].products[0].id;
					}
					return null;
				},
				getTicketId: function (obj) {
					return obj.ticketId;
				},
				getEntitlementId: function (obj) {
					return obj.entitlementId;
				},
				isSubscription: function (obj) {
					if (obj.technicals && obj.technicals[0] && obj.technicals[0].products[0] && obj.technicals[0].products[0].type) {
						return obj.technicals[0].products[0].type === "subscription";
					}
					return false;
				},
				isAvailableToSubscribe: function (obj) {
					if (obj.price && (Number(obj.price) !== 0)) {
						return true;
					}
					return false;
				},
				getRatingValue: function (obj) {
					var ratingValue = $N.app.ParentalControlUtil.PARENTAL_RATING_ADULT_VALUE,
						ratingCode;

					if ((obj.title === "Adultos") || (obj.Title === "Adultos")) { // TODO: temp only, remove once the MDS catalogue parental ratings are updated
						return ratingValue;
					}

					if (obj.Rating && (obj.Rating.precedence || obj.Rating.code)) {
						ratingCode = obj.Rating.precedence || parseInt(obj.Rating.code, 10);
						if (ratingCode < 4) {
							ratingValue = 1;
						} else if (ratingCode <= 8) {
							ratingValue = L_RATING;
						} else if (ratingCode <= 10) {
							ratingValue = 10;
						} else if (ratingCode <= 12) {
							ratingValue = 12;
						} else if (ratingCode <= 14) {
							ratingValue = 14;
						} else if (ratingCode <= 16) {
							ratingValue = 16;
						}
					}
					return ratingValue;
				},
				isAdult: function (obj) {
					// TODO: NETUI-4307 - Change to use isAdult field when available
					var categoryLength = (obj.Categories) ? obj.Categories.length : 0,
						i,
						ADULT_CATEGORY = "Adult";
					for (i = 0; i < categoryLength; i++) {
						if (obj.Categories[i] === ADULT_CATEGORY) {
							return true;
						}
					}
					return false;
				},
				getTitle: function (obj) {
					return obj.title || obj.Title;
				},
				getFilteredTitle: function (obj) {
					if (assetDataMapper.isAdult(obj) && !$N.platform.ca.ParentalControl.isCurrentUserMaster()) {
						return $N.app.MDSUtil.getString("adultContent");
					}
					return this.getTitle(obj);
				},
				getSubtitle: function (obj) {
					return obj.Episode || "";
				},
				getSeriesInfo: function (obj) {
					var season,
						episode,
						seriesText = "";
					if (obj.episodeNumber) {
						season = Math.floor(obj.episodeNumber / 1000);
						episode = obj.episodeNumber - (season * 1000);
						seriesText = $N.app.StringUtil.join(" ", $N.app.MDSUtil.getString("seasonShort"), season.toString(), $N.app.MDSUtil.getString("episodeShort"), episode.toString());
					}
					return seriesText;
				},
				getRatingIcon: function (obj) {
					var ratingKey = this.getRatingValue(obj);
					if (ratingKey === L_RATING) {
						ratingKey = "L";
					}
					return "../../../customise/resources/images/%RES/icons/parentalRatings/" + ratingKey + ".png";
				},
				getYear: function (obj) {
					if (obj.Year) {
						return obj.Year.toString();
					}
					return null;
				},
				getDuration: function (obj) {
					var duration = obj.duration;
					if (duration) {
						duration = Math.floor(duration / 60) + $N.app.MDSUtil.getString("min");
					}
					return duration;
				},
				getPrice: function (obj) {
					var price = obj.price;
					if (price) {
						if (price > 1000) { // TODO: change necessary to support new traxis, remove if statement on final solution
							price = price / 10000;
						}
						return Number(price);
					}
					return null;
				},
				getListPrice: function (obj) {
					var listPrice = obj.listPrice;
					if (listPrice) {
						if (listPrice > 1000) { // TODO: change necessary to support new traxis, remove if statement on final solution
							listPrice = listPrice / 10000;
						}
						return Number(listPrice);
					}
					return null;
				},
				getPriceText: function (obj, forcePrice, forceSubscription) {
					var price = this.getPrice(obj),
						listPrice = this.getListPrice(obj),
						isSubscription = this.isSubscription(obj) || forceSubscription;
					if (obj.entitlementId && !forcePrice) {
						if (price !== null && price === 0) {
							return $N.app.MDSUtil.getString("noCharge");
						} else if (isSubscription) {
							return $N.app.MDSUtil.getString("subscribed");
						} else {
							return $N.app.MDSUtil.getString("rented");
						}
					}
					if (price !== null) {
						if (isSubscription && !forcePrice) {
							return $N.app.MDSUtil.getString("subscriptionRequired");
						} else if (price === 0) {
							return $N.app.MDSUtil.getString("noCharge");
						} else if (listPrice > price) {
							return $N.app.StringUtil.join(" ", $N.app.MDSUtil.getString("priceWas"),
									"R$" + $N.app.GeneralUtil.getPriceString(listPrice, ","),
									$N.app.MDSUtil.getString("priceNow"),
									"R$" + $N.app.GeneralUtil.getPriceString(price, ","),
									isSubscription ? $N.app.MDSUtil.getString("perMonth") : ""
								);
						} else {
							return "R$" + $N.app.GeneralUtil.getPriceString(price, ",") + (isSubscription ? $N.app.MDSUtil.getString("perMonth") : "");
						}
					}
					return "";
				},
				getProductName: function (obj) {
					if (obj.technicals && obj.technicals[0] && obj.technicals[0].products && obj.technicals[0].products[0] && obj.technicals[0].products[0].title) {
						return obj.technicals[0].products[0].title;
					}
					return "";
				},
				getProductDescription: function (obj) {
					if (obj.technicals && obj.technicals[0] && obj.technicals[0].products && obj.technicals[0].products[0] && obj.technicals[0].products[0].Description) {
						return obj.technicals[0].products[0].Description;
					}
					return "";
				},
				getRentalExpiry: function (obj) {
					if (obj.entitlementTimeout) {
						return new Date(obj.entitlementTimeout);
					}
					return null;
				},
				getAssetExpiry: function (obj) {
					var expiryDate = null;
					if (obj.technicals && obj.technicals[0] && obj.technicals[0].products[0] && obj.technicals[0].products[0].endPurchase) {
						expiryDate = obj.technicals[0].products[0].endPurchase;
					}
					if (expiryDate) {
						return new Date($N.app.DateTimeUtil.convertEpochDateToMilliseconds(expiryDate));
					}
					return null;
				},
				getEpisodes: function (obj) {
					// This function was removed from scope but will likely be added in the future.
					// There is logic hanging of the result of this call, so it makes sense to leave it in for now
					return "";
				},
				getActors: function (obj) {
					return $N.app.StringUtil.join(", ", obj.Actors);
				},
				getDirectors: function (obj) {
					return $N.app.StringUtil.join(", ", obj.Directors);
				},
				getGenres: function (obj) {
					return $N.app.StringUtil.join(", ", obj.Categories);
				},
				getSynopsis: function (obj) {
					return obj.Synopsis;
				},
				getDescription: function (obj) {
					if (obj.Description) {
						return obj.Description;
					} else if (obj.PrivateMetadata) {
						var privateMetadata = JSON.parse(obj.PrivateMetadata);
						return privateMetadata.Description;
					}
				},
				getCountries: function (obj) {
					return obj.Countries;
				},
				getHref: function (obj) {
					var href = "",
						fileName;

					if ($N.app.Config.getConfigValue("mds.developer.mode") === "off" && obj && obj.PromoImages && obj.PromoImages[0]) {
						// TODO: NETUI-4946 - The url's should be correct in the future and we should not need to do this processing
						fileName = obj.PromoImages[0].substring(obj.PromoImages[0].lastIndexOf("/"));
						href = mdsAddress + $N.app.Config.getConfigValue("vod.poster.prefix") + fileName;
						return href;
					}

					if (obj && obj.image) {
						return (mdsAddress + obj.image);
					}

					if (obj && obj.Images && obj.Images[0] && obj.Images[0].technicals) {
						obj.Images[0].technicals.some(function (technical) {
							if (technical.ImageType === "PosterResized") {
								href = mdsAddress + $N.app.Config.getConfigValue("vod.poster.prefix") + "/" + technical.media.Image_Basic.fileName;
								return true;
							}
						});
					}

					return href;
				},
				getAudioLanguages: function (obj) {
					var tempArray = [],
						languageArray = [],
						i;
					if (obj.Audio) {
						tempArray = obj.Audio.split(";");
					}
					for (i = 0; i < tempArray.length; i++) {
						if (tempArray[i]) {
							languageArray.push(tempArray[i].split("-"));
						}
					}
					return languageArray;
				},
				getDefinition: function (obj) {
					if (obj.technicals && obj.technicals.length > 0) {
						return obj.technicals[0].Definition;
					}
					return null;
				},
				getFlags: function (obj) {
					var flags = [],
						hasAlternateAudio = this.getAudioLanguages(obj).length > 1,
						technical,
						product,
						productName,
						productType,
						studioFlag,
						definition,
						aspect,
						audioMode;

					if (obj.technicals && obj.technicals.length > 0) {
						technical = obj.technicals[0];
						definition = technical.Definition;
						aspect = technical.Aspect;
						audioMode = technical.AudioMode;
						if (technical.products && technical.products.length > 0) {
							product = technical.products[0];
							productName = product.title;
							productType = product.type;
						}
					}

					// Screen and Resolution
					if (definition === "HD") {
						if (aspect === "16:9") {
							flags.push("hd_16_9");
						} else {
							flags.push("hd_4_3");
						}
					} else if (definition === "3D") {
						if (aspect === "16:9") {
							flags.push("3D_16_9");
						} else {
							flags.push("3D_4_3");
						}
					} else if (aspect === "16:9") {
						flags.push("sd_16_9");
					} else {
						flags.push("sd_4_3");
					}

					// Language/Dubbing
					if (obj.Countries === "BR") {
						flags.push("nacional");
					} else if (obj.Subtitles) {
						if (hasAlternateAudio) {
							flags.push("leg_dub");
						} else {
							flags.push("leg");
						}
					} else {
						flags.push("dub");
					}

					// Sound Mode
					if (audioMode === "5.1") {
						flags.push("dolby_5_1");
					} else if (audioMode === "2.0") {
						flags.push("dobly_2_0");
					} else {
						flags.push("stereo");
					}

					if (productType === "subscription" || productName === "Telecine") {
						studioFlag = $N.app.NowMappingUtil.getStudioFlag(productName);
						if (studioFlag !== null) {
							flags.push(studioFlag);
						}
					}

					return flags;
				},
				getContentRef: function (obj) {
					if (obj.technicals && obj.technicals[0] && obj.technicals[0].mainContentRef) {
						return obj.technicals[0].mainContentRef;
					}
					return null;
				},
				getTrailerRef: function (obj) {
					if (obj.technicals && obj.technicals[0] && obj.technicals[0].promoRefs && obj.technicals[0].promoRefs[0]) {
						return obj.technicals[0].promoRefs[0];
					}
					return null;
				},
				getFilename: function (obj) {
					if (obj.fileName) {
						return obj.fileName;
					}
					if (obj.technicals && obj.technicals[0] && obj.technicals[0].media) {
						return obj.technicals[0].media.AV_EncryptedTS.fileName;
					}
					return null;
				},
				getMDSServer: function () {
					return '';
				}
			},
			productDataMapper = {
				getTitle: function (obj) {
					return obj.title || obj.Title;
				}
			},
			_highlightsFolderId = 0,
			dataAugmentFunction = function () {};

		$N.apps.util.EventManager.create("mdsContentLoading");

		/**
		 * @method isSmartCardInserted
		 * @return {bool}
		 */
		function isSmartCardInserted() {
			return $N.app.ConditionalAccessCAK73.getCASmartCardInfo().smartcardInfo ? true : false;
		}

		/**
		 * @method isServerAvailable
		 * @return {bool}
		 */
		function isServerAvailable() {
			return ($N.app.FeatureManager.isVODEnabled() && isSmartCardInserted() && $N.platform.system.Network.isNetworkAvailable($N.platform.system.Network.NetworkType.ETHERNET));
		}

		/**
		 * @method setDefaultNOWCatalogues
		 * @param {Object} catalogues
		 */
		function setDefaultNOWCatalogues(catalogues) {
			defaultNOWCatalogues = catalogues;
		}

		/**
		 * @method setMyContentCatalogues
		 * @param {Object} catalogues
		 */
		function setMyContentCatalogues(catalogues) {
			myContentCatalogues = catalogues;
		}

		/**
		 * @method setSearchCatalogues
		 * @param {Object} catalogues
		 */
		function setSearchCatalogues(catalogues) {
			searchCatalogues = catalogues;
		}

		/**
		 * @method clearRequest
		 */
		function clearRequest() {
			log("clearRequest", "Enter & Exit");
			currentRequestID = -1;
			currentRequestsReceived = [];
			$N.apps.util.EventManager.fire("mdsContentLoading", false);
		}

		/**
		 * @method isValidRequest
		 * @param {Number} id
		 * @param {Number} type
		 * @return {bool} True if requestID is current
		 */
		function isValidRequest(id, type) {
			if (id !== currentRequestID) {
				return false;
			}
			currentRequestsReceived[type] = true;
			return true;
		}

		/**
		 * Configures the folder ID for the Highlights
		 * VOD folder (Destaques).
		 * @param {String} The ID of the folder from MDS.
		 */
		function setHighlightsFolderId(folderUI) {
			_highlightsFolderId = folderUI;
		}

		/**
		 * @method executeCallback
		 * @param {Function} callback
		 * @param {Object} data
		 */
		function executeCallback(callback, data) {
			clearRequest();
			callback(data);
		}

		/**
		 * @method filterRentalsData
		 * @param {Object} data
		 * @param {Boolean} returnAdultContent
		 */
		function filterRentalsData(data, returnAdultContent) {
			var i,
				loopLength = data.length,
				isAdult,
				returnData = [];
			for (i = 0; i < loopLength; i++) {
				isAdult = assetDataMapper.isAdult(data[i]);
				if (isAdult === returnAdultContent) {
					returnData.push(data[i]);
				}
			}
			return returnData;
		}

		/**
		 * @method mapRentalExpiry
		 * @param {Object} data
		 * @param {Object} [] assetExpiryDates - Array of asset expiry dates, key is product id
		 * @return {Object} returnData
		 */
		function mapRentalExpiry(data, assetExpiryDates) {
			var i,
				dataLength = data.length,
				j,
				productArray,
				productArrayLength,
				product;
			for (i = 0; i < dataLength; i++) {
				if (data[i] && data[i].technicals && data[i].technicals.length && data[i].technicals[0].products && data[i].technicals[0].products.length) {
					productArray = data[i].technicals[0].products;
					productArrayLength = productArray.length;
					for (j = 0; j < productArrayLength; j++) {
						product = productArray[j];
						data[i].entitlementTimeout = assetExpiryDates[product.id];
					}
				}
			}
			return data;
		}

		/**
		 * @method getAssets
		 * @private
		 * @param {Object} folderUID
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getAssets(folderUID, successCallback, failureCallback) {
			log("getAssets", "ID: " + folderUID + " Enter & Exit");
			try {
				$N.services.sdp.VOD.getAssets(
					folderUID,
					function (data) {
						if (isValidRequest(folderUID, CONTENT_TYPE.ASSETS)) {
							successCallback(data);
						}
					},
					null,
					function () {
						if (isValidRequest(folderUID, CONTENT_TYPE.ASSETS)) {
							failureCallback();
						}
					}
				);
			} catch (e) {
				failureCallback();
			}
		}

		/**
		 * @method getRentedAssets
		 * @private
		 * @param {Object} folderUID
		 * @param {Boolean} returnAdultContent
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getRentedAssets(folderUID, returnAdultContent, successCallback, failureCallback) {
			log("getRentedAssets", "Enter & Exit");
			$N.app.TraxisUtil.getPurchasedProducts(function (resultArray) {
				if (resultArray && resultArray.length) {
					var idx = 0,
						resultArrayLength = resultArray.length,
						rentedItem,
						rentedAssets = [],
						assetExpiryDates = [];
					for (idx = 0; idx < resultArrayLength; ++idx) {
						rentedItem = resultArray[idx];
						if (rentedItem.producttype === "TVOD") {
							rentedAssets.push(rentedItem.productid);
							assetExpiryDates[rentedItem.productid] = rentedItem.entitlementtimeout;
						}
					}

					if (rentedAssets.length > 0) {
						try {
							$N.services.sdp.VOD.getPurchasedAssetsByProductIdArray(
								rentedAssets,
								function (data) {
									if (isValidRequest(folderUID, CONTENT_TYPE.MYCONTENT)) {
										data = filterRentalsData(data, returnAdultContent);
										data = mapRentalExpiry(data, assetExpiryDates);
										successCallback(data);
									}
								},
								[["editorial.title", 1], ["editorial.episodeNumber", 1]],
								function () {
									if (isValidRequest(folderUID, CONTENT_TYPE.MYCONTENT)) {
										failureCallback();
									}
								}
							);
						} catch (e) {
							failureCallback();
						}
					} else {
						if (isValidRequest(folderUID, CONTENT_TYPE.MYCONTENT)) {
							successCallback([]);
						}
					}
				} else {
					if (isValidRequest(folderUID, CONTENT_TYPE.MYCONTENT)) {
						successCallback([]);
					}
				}
			}, function () {
				failureCallback($N.app.errorCodes.NOW.TRAXIS_DATA_FAILURE);
			});
		}

		/**
		 * @method getPurchasedProductsByProductIdArray
		 * @async
		 * @param {Array} productIds Array of IDs that have been purchased
		 * @param {Function} returnCallback
		 * @param {Array} sortArray
		 * @param {Function} returnFailureCallback (optional)
		 */
		function getPurchasedProductsByProductIdArray(productIds, returnCallback, sortArray, returnFailureCallback) {
			log("getPurchasedProductsByProductIdArray", "Enter");
			var filter = {},
				successCallback = function (result) {
					if (returnCallback) {
						returnCallback(result.products);
					}
				},
				failureCallback = function (result) {
					if (returnFailureCallback) {
						returnFailureCallback(result);
					} else {
						log("getProducts", "failure callback " + $N.apps.util.JSON.stringify(result));
					}
				};

			if (productIds && productIds.length) {
				filter.id = {
					'$in': productIds
				};
			}
			MetadataService.getVODData(this, successCallback, failureCallback, MetadataService.RequestType.Products, filter, sortArray);
			log("getPurchasedProductsByProductIdArray", "Exit");
		}

		/**
		 * @method getSubscriptions
		 * @private
		 * @param {Object} folderUID
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getSubscriptions(folderUID, successCallback, failureCallback) {
			// TODO NETUI-2986: this function currently returns all subscribed assets, but should instead only return the actual subscription products
			// TODO: The final solution will not include so much code dupe
			log("getSubscriptions", "Enter & Exit");
			$N.app.TraxisUtil.getPurchasedProducts(function (resultArray) {
				if (resultArray && resultArray.length) {
					var idx = 0,
						rentedAssets = [];
					for (idx = 0; idx < resultArray.length; ++idx) {
						if (resultArray[idx].producttype === "SVOD") {
							rentedAssets.push(resultArray[idx].productid);
						}
					}

					if (rentedAssets.length > 0) {
						try {
							getPurchasedProductsByProductIdArray(
								rentedAssets,
								function (data) {
									if (isValidRequest(folderUID, CONTENT_TYPE.MYSUBSCRIPTIONS)) {
										successCallback(data);
									}
								},
								[["title", 1]],
								function () {
									if (isValidRequest(folderUID, CONTENT_TYPE.MYSUBSCRIPTIONS)) {
										failureCallback();
									}
								}
							);
						} catch (e) {
							failureCallback();
						}
					} else {
						if (isValidRequest(folderUID, CONTENT_TYPE.MYSUBSCRIPTIONS)) {
							successCallback([]);
						}
					}
				} else {
					if (isValidRequest(folderUID, CONTENT_TYPE.MYSUBSCRIPTIONS)) {
						successCallback([]);
					}
				}
			}, function () {
				failureCallback($N.app.errorCodes.NOW.TRAXIS_DATA_FAILURE);
			});
		}

		/**
		 * @method getFavourites
		 * @private
		 * @param {Object} folderUID
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getFavourites(folderUID, successCallback, failureCallback) {
			log("getFavourites", "Enter & Exit");
			$N.app.TraxisUtil.favourites.getFavourites(function (results) {
				var favouriteArray = [],
					resultArrayLength = results.length,
					i;
				if (results) {
					for (i = 0; i < resultArrayLength; i++) {
						if (results[i].fileName) {
							favouriteArray.push(results[i].fileName);
						}
					}
					if (favouriteArray.length) {
						try {
							$N.services.sdp.VOD.getAssetsByFilename(
								favouriteArray,
								function (assets) {
									if (isValidRequest(folderUID, CONTENT_TYPE.MYCONTENT)) {
										successCallback(assets);
									}
								},
								function () {
									failureCallback();
								}
							);
						} catch (e) {
							failureCallback();
						}
						return;
					}
				}
				if (isValidRequest(folderUID, CONTENT_TYPE.MYCONTENT)) {
					successCallback([]);
				}
			}, function () {
				failureCallback($N.app.errorCodes.NOW.TRAXIS_DATA_FAILURE);
			});
		}

		/**
		 * @method getHighlights
		 * @private
		 * @param {Object} folderUID
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getHighlights(folderUID, successCallback, failureCallback) {
			log("getHighlights", "Enter & Exit");
			$N.app.PortalUtil.getWindowData("NOW", function (data) {
				if (isValidRequest(folderUID, CONTENT_TYPE.HIGHLIGHTS)) {
					if (data) {
						successCallback(data);
					} else {
						failureCallback();
					}
				}
			});
		}

		/**
		 * @method getRootCatalogues
		 * @private
		 * @param {Object} folderUID
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getRootCatalogues(successCallback, failureCallback) {
			log("getRootCatalogues", "Enter & Exit");
			var requestSuccessCallback = function (data) {
				if (isValidRequest(null, CONTENT_TYPE.CATALOGUES)) {
					if (data.length) {
						data = data.concat(defaultNOWCatalogues);
					}
					successCallback(data);
				}
			};
			try {
				$N.services.sdp.VOD.getRootCatalogues(
					requestSuccessCallback,
					null,
					function () {
						if (isValidRequest(null, CONTENT_TYPE.CATALOGUES)) {
							failureCallback();
						}
					}
				);
			} catch (e) {
				failureCallback();
			}
		}

		/**
		 * @method getCatalogues
		 * @private
		 * @param {Object} folderUID
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getCatalogues(folderUID, successCallback, failureCallback) {
			log("getCatalogues", "ID: " + folderUID + " Enter & Exit");
			var requestSuccessCallback = function (data) {
				if (isValidRequest(folderUID, CONTENT_TYPE.CATALOGUES)) {
					successCallback(data);
				}
			};
			try {
				$N.services.sdp.VOD.getDetailedCatalogues(
					requestSuccessCallback,
					null,
					function () {
						if (isValidRequest(folderUID, CONTENT_TYPE.CATALOGUES)) {
							failureCallback();
						}
					},
					folderUID
				);
			} catch (e) {
				failureCallback();
			}
		}

		/**
		 * @method getNodes
		 * @param {Boolean} rootNodes
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 * @param {String[]} fieldList
		 */
		function getNodes(rootNodes, successCallback, failureCallback, fieldList) {
			log("getNodes", "Enter");
			var filter = {};

			if (!fieldList) {
				fieldList = ["title", "id", "children", "descendants"];
			}

			if (rootNodes) {
				filter.isRoot = true;
			} else {
				filter.isRoot = false;

			}

			filter.locale = "pt_BR";

			MetadataService.getVODData(this, successCallback, failureCallback, MetadataService.RequestType.Catalogues, filter, null, fieldList);
			log("getNodes", "Exit");
		}

		/**
		 * @method getNodeAssetCount
		 * @param {String[]} folderUIDs
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getNodeAssetCount(folderUIDs, successCallback, failureCallback) {
			log("getNodeAssetCount", "Enter");
			var filter = {},
				getDataSuccess = function (data) {
					successCallback(data.total_records);
				};

			filter.locale = "pt_BR";
			if (typeof folderUIDs === "string") {
				filter["voditem.nodeRefs"] = folderUIDs;
			} else {
				filter["voditem.nodeRefs"] = {"$in": folderUIDs};
			}
			filter.isPurchasable = true;
			filter.isVisible = true;
			filter["technical.deviceType"] = {
				"$in": "STB"
			};

			MetadataService.getVODData(this, getDataSuccess, failureCallback, MetadataService.RequestType.Assets, filter, null, [""], 0);
			log("getNodeAssetCount", "Exit");
		}

		/**
		 * @method getHighlightsContent
		 * @param {Object} folderUID
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getHighlightsContent(folderUID, successCallback, failureCallback) {
			log("getHighlightsContent", "Enter");
			getHighlights(folderUID, function (data) {
				executeCallback(successCallback, {
					type: CONTENT_TYPE.HIGHLIGHTS,
					content: data
				});
			}, function () {
				executeCallback(failureCallback, $N.app.errorCodes.NOW.PORTAL_DATA_FAILURE);
			});
			log("getHighlightsContent", "Exit");
		}

		/**
		 * @method getFavouritesContent
		 * @param {Object} folderUID
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getFavouritesContent(folderUID, successCallback, failureCallback) {
			log("getFavouritesContent", "Enter");
			getFavourites(folderUID, function (assets) {
				executeCallback(successCallback, {
					type: CONTENT_TYPE.MYCONTENT,
					content: {
						dataType: "favourites",
						assets: assets
					}
				});
			}, function (errorCode) {
				executeCallback(failureCallback, errorCode);
			});
			log("getFavouritesContent", "Exit");
		}

		/**
		 * @method getRentedContent
		 * @param {Object} folderUID
		 * @param {Boolean} returnAdultContent
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getRentedContent(folderUID, returnAdultContent, successCallback, failureCallback) {
			log("getRentedContent", "Enter");
			getRentedAssets(folderUID, returnAdultContent, function (assets) {
				executeCallback(successCallback, {
					type: CONTENT_TYPE.MYCONTENT,
					content: {
						dataType: "rentals",
						assets: assets
					}
				});
			}, function (errorCode) {
				executeCallback(failureCallback, errorCode);
			});
			log("getRentedContent", "Exit");
		}

		/**
		 * @method getSubscriptionContent
		 * @param {Object} folderUID
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 */
		function getSubscriptionContent(folderUID, successCallback, failureCallback) {
			log("getSubscriptionContent", "Enter");
			getSubscriptions(folderUID, function (subscriptions) {
				executeCallback(successCallback, {
					type: CONTENT_TYPE.MYSUBSCRIPTIONS,
					content: {
						dataType: "subscriptions",
						assets: subscriptions
					}
				});
			}, function (errorCode) {
				executeCallback(failureCallback, errorCode);
			});
			log("getSubscriptionContent", "Exit");
		}

		/**
		 * @method getNodeContent
		 * @param {Object} folderUID
		 * @param {Function} successCallback
		 * @param {Function} failureCallback
		 * @param {Object} augmentData (optional)
		 */
		function getNodeContent(folderUID, successCallback, failureCallback, augmentData) {
			log("getNodeContent", "Enter");
			getCatalogues(folderUID, function (data) {
				if (data.length) {
					if (augmentData && dataAugmentFunction(data, augmentData.data)) {
						executeCallback(successCallback, {
							type: augmentData.type,
							content: data,
							isAugmented: true
						});
					} else {
						executeCallback(successCallback, {
							type: CONTENT_TYPE.CATALOGUES,
							content: data
						});
					}
				} else {
					executeCallback(successCallback, {
						type: CONTENT_TYPE.EMPTY,
						content: {}
					});
				}
			}, function () {
				executeCallback(failureCallback);
			});
			log("getNodeContent", "Exit");
		}

		/**
		 * @method getAssetContent
		 * @param {Object} folderUID
		 * @param {Function} successCallback
		 * @param {Function} contentFailureCallback
		 */
		function getAssetContent(folderUID, successCallback, failureCallback) {
			log("getAssetContent", "Enter");
			getAssets(folderUID, function (assets) {
				if (assets.length) {
					executeCallback(successCallback, {
						type: CONTENT_TYPE.ASSETS,
						content: assets
					});
				} else {
					executeCallback(successCallback, {
						type: CONTENT_TYPE.EMPTY,
						content: {}
					});
				}
			}, function () {
				executeCallback(failureCallback);
			});
			log("getAssetContent", "Exit");
		}

		/**
		 * @method getRootCatalogueContent
		 * @param {Object} folderUID
		 * @param {Function} successCallback
		 * @param {Function} contentFailureCallback
		 */
		function getRootCatalogueContent(successCallback, failureCallback) {
			log("getRootCatalogueContent", "Enter");
			getRootCatalogues(function (data) {
				if (data.length) {
					executeCallback(successCallback, {
						type: CONTENT_TYPE.CATALOGUES,
						content: data
					});
				} else {
					executeCallback(failureCallback);
				}
			}, function () {
				executeCallback(failureCallback);
			});
			log("getRootCatalogueContent", "Exit");
		}

		/**
		 * @method getGeneralRecommendations
		 * @param {Object} folderUID
		 * @param {Function} successCallback
		 * @param {Function} contentFailureCallback
		 */
		function getGeneralRecommendations(folderUID, successCallback, failureCallback) {
			log("getGeneralRecommendations", "Enter");
			$N.app.VODRecommendationServerHelper.getGeneralRecommendations(folderUID, function (data) {
				if (isValidRequest(folderUID, CONTENT_TYPE.ASSETS)) {
					if (data) {
						executeCallback(successCallback, {
							type: CONTENT_TYPE.ASSETS,
							content: data.editorials
						});
					} else {
						executeCallback(successCallback, {
							type: CONTENT_TYPE.EMPTY,
							content: {}
						});
					}
				}
			}, function () {
				if (isValidRequest(folderUID, CONTENT_TYPE.ASSETS)) {
					executeCallback(successCallback, {
						type: CONTENT_TYPE.EMPTY,
						content: {}
					});
				}
			});
			log("getGeneralRecommendations", "Exit");
		}

		/**
		 * @method getMDSDataForContentIDs
		 * @param {Number} folderUID
		 * @param {Object} contentIDs
		 * @param {Function} successCallback
		 * @param {Function} contentFailureCallback
		 */
		function getMDSDataForContentIDs(contentIDs, successCallback, failureCallback) {
			log("getMDSDataForContentIDs", "Enter");
			$N.services.sdp.VOD.getAssetsByIds(contentIDs, successCallback, failureCallback, true);
			log("getMDSDataForContentIDs", "Exit");
		}

		/**
		 * @method filterNodes
		 * @param {Object}[] nodeData
		 * @returns {Object}[] nodeData - Trimmed node data
		 */
		function filterNodes(nodeData) {
			var i,
				content = nodeData.content,
				contentLength = content.length;
			if (emptyNodes) {
				for (i = contentLength - 1; i >= 0; i--) {
					if (emptyNodes[content[i].id] === true) {
						nodeData.content.splice(i, 1);
					}
				}
			}
			return nodeData;
		}

		/**
		 * @method getContent
		 * @param {Object} folderUID
		 * @param {Function} contentSuccessCallback
		 * @param {Function} contentFailureCallback
		 * @param {Object} augmentData (optional)
		 */
		function getContent(folderUID, contentSuccessCallback, contentFailureCallback, augmentData, hasChildren) {
			log("getContent", "ID: " + folderUID + " Enter & Exit");
			var failureCallback = function (errorCode) {
					contentFailureCallback(function () {
						getContent(folderUID, contentSuccessCallback, contentFailureCallback, augmentData);
					}, errorCode);
				},
				successCallback = function (data) {
					contentSuccessCallback(filterNodes(data));
				};
			$N.apps.util.EventManager.fire("mdsContentLoading", true);
			currentRequestID = folderUID;

			if (!isServerAvailable()) {
				executeCallback(failureCallback, $N.app.errorCodes.NOW.USER_HARDWARE_FAULT_OR_BAD_USAGE_ID);
				return;
			}

			switch (folderUID) {
			case _highlightsFolderId:
				getHighlightsContent(folderUID, successCallback, failureCallback);
				break;
			case constants.VOD_MENU_RECOMMENDATIONS:
				getGeneralRecommendations(folderUID, successCallback, failureCallback);
				break;
			case constants.VOD_MENU_MY_VIDEOS:
				executeCallback(contentSuccessCallback, {
					type: CONTENT_TYPE.CATALOGUES,
					content: myContentCatalogues
				});
				break;
			case constants.VOD_MENU_SEARCH:
				executeCallback(contentSuccessCallback, {
					type: CONTENT_TYPE.CATALOGUES,
					content: searchCatalogues
				});
				break;
			case constants.VOD_MENU_MY_VIDEOS_FAVORITES:
				getFavouritesContent(folderUID, contentSuccessCallback, failureCallback);
				break;
			case constants.VOD_MENU_MY_VIDEOS_RENTED:
				getRentedContent(folderUID, false, contentSuccessCallback, failureCallback);
				break;
			case constants.VOD_MENU_MY_VIDEOS_SUBSCRIPTIONS:
				getSubscriptionContent(folderUID, contentSuccessCallback, failureCallback);
				break;
			case constants.VOD_MENU_MY_VIDEOS_ADULT:
				getRentedContent(folderUID, true, contentSuccessCallback, failureCallback);
				break;
			default:
				if (folderUID) {
					if (hasChildren) {
						getNodeContent(folderUID, successCallback, failureCallback, augmentData);
					} else {
						getAssetContent(folderUID, contentSuccessCallback, failureCallback);
					}
				} else {
					getRootCatalogueContent(successCallback, failureCallback);
				}
				break;
			}
		}

		/**
		 * This function returns the catalogue node id for the asset
		 * specified.
		 * @param productId The product id for the asset.
		 * @param successCallback The function to be called if the
		 *                         catalogue information could be
		 *                         found.
		 * @param failureCallback The function to be called if the
		 *                         catalogue information could not
		 *                         be found.
		 */
		function getCatalogueForAsset(fileName, successCallback, failureCallback) {
			$N.services.sdp.VOD.getAssetByFilename(fileName, successCallback, failureCallback);
		}


		/**
		 * @param technicalId The technical id for the trailer asset.
		 * @param successCallback The function to be called if the
		 *                         trailer information could be
		 *                         found.
		 * @param failureCallback The function to be called if the
		 *                         trailer information could not
		 *                         be found.
		 */
		function getTrailerByTechnicalId(technicalId, successCallback, failureCallback) {
			log("getTrailerByTechnicalId", "Enter: " + technicalId);
			var filter = {},
				SORT_ORDER = null,
				FIELD_LIST = null,
				COUNT = 1,
				OFFSET = 0,
				INCLUDE_LOCALE = false,
				trailerSuccess = function (trailerData) {
					log("getTrailerByTechnicalId", "trailerSuccess Enter");
					successCallback(trailerData);
					log("getTrailerByTechnicalId", "trailerSuccess Exit");
				};

			if (successCallback) {
				filter["technical.id"] = technicalId;
				MetadataService.getVODData(this, trailerSuccess, failureCallback, MetadataService.RequestType.Trailers, filter, SORT_ORDER, FIELD_LIST, COUNT, OFFSET, INCLUDE_LOCALE);
			}
			log("getTrailerByTechnicalId", "Exit");
		}

		function setDataAugmentFunction(augmentFunction) {
			dataAugmentFunction = augmentFunction;
		}

		function getNodesByNameArray(nameArray, successCallback, failureCallback) {
			log("getNodesByNameArray", "Enter");
			var filter = {},
				success = function (result) {
					successCallback(result.nodes);
				};
			if (nameArray && nameArray.length) {
				filter.title = {
					'$in': nameArray
				};
			}
			MetadataService.getVODData(this, success, failureCallback, MetadataService.RequestType.Catalogues, filter);
			log("getNodesByNameArray", "Exit");
		}

		/**
		 * Registers a listener to monitor the MDS server setting
		 * @function registerMetadataServerListener
		 */
		function registerMetadataServerListener() {
			log("registerMetadataServerListener", "Enter");
			var mdsServerCallback = function (newServer) {
				log("mdsServerCallback", "Enter - newServer:" + newServer);
				mdsAddress = newServer;
				if (newServer && newServer.slice(0, 7) === "http://") {
					newServer = newServer.slice(7);
				}
				$N.services.sdp.BaseService.initialise(newServer, null, null, null, $N.platform.system.Preferences.get(constants.PREF_SDP_PATH));
				$N.app.LaunchUtil.initialiseMDS(true);
				log("mdsServerCallback", "Exit");
			};

			if ($N.app.Config.getConfigValue("mds.developer.mode") === "off") {
				mdsAddress = $N.platform.system.Preferences.get(constants.PREF_METADATA_SERVER, true);
				$N.platform.system.Preferences.monitorValue(constants.PREF_METADATA_SERVER, mdsServerCallback, this, true);
			} else {
				mdsAddress = $N.app.Config.getConfigValue("mds.developer.server");
			}
			log("registerMetadataServerListener", "Exit");
		}

		/**
		 * @function getMDSAddress
		 * @return mdsAddress {String} - The address of the mds server
		 */
		function getMDSAddress() {
			log("getMDSAddress", "Enter & Exit");
			return mdsAddress;
		}

		/**
		 * @function fetchEmptyNodes
		 * @return mdsAddress {String} - The address of the mds server
		 */
		function fetchEmptyNodes() {
			log("fetchEmptyNodes", "Enter");
			var url = getMDSAddress() + $N.platform.system.Preferences.get(constants.APPLICATION_LAUNCH_URL) + "/emptynodes.json",
				refreshTime = $N.platform.system.Preferences.get(constants.VOD_EMPTYNODE_REFRESH),
				failureRetryBackoffTimes = [30000, 60000, 300000, 900000, 1800000],
				successCallback,
				failureCallback;

			successCallback = function (data) {
				var emptyNodeData = $N.app.GeneralUtil.ParseJSON(data);
				if (emptyNodeData && emptyNodeData.EmptyNodes) {
					emptyNodes = emptyNodeData.EmptyNodes;
					failureBackoffTimeIndex = 0;
					if (refreshTime) {
						setTimeout(fetchEmptyNodes, refreshTime);
					}
				} else {
					failureCallback();
				}
			};
			failureCallback = function () {
				var failureRetryTime = failureRetryBackoffTimes[failureBackoffTimeIndex];
				if (failureBackoffTimeIndex < (failureRetryBackoffTimes.length - 1)) {
					failureBackoffTimeIndex++;
				}
				log("fetchEmptyNodes", "failureCallback - retrying in " + failureRetryTime + "ms");
				setTimeout(fetchEmptyNodes, failureRetryTime);
			};

			$N.app.NetworkUtil.ajaxRequest(url, successCallback, failureCallback);
			log("fetchEmptyNodes", "Exit");
		}

		/**
		 * @function init
		 */
		function init() {
			log("init", "Enter");
			registerMetadataServerListener();
			fetchEmptyNodes();
			log("init", "Exit");
		}

		return {
			init: init,
			isServerAvailable: isServerAvailable,
			setDefaultNOWCatalogues: setDefaultNOWCatalogues,
			setMyContentCatalogues: setMyContentCatalogues,
			setSearchCatalogues: setSearchCatalogues,
			clearRequest: clearRequest,
			getContent: getContent,
			CONTENT_TYPE: CONTENT_TYPE,
			assetDataMapper: assetDataMapper,
			productDataMapper: productDataMapper,
			getCatalogueForAsset: getCatalogueForAsset,
			setHighlightsFolder: setHighlightsFolderId,
			getTrailerByTechnicalId: getTrailerByTechnicalId,
			setDataAugmentFunction: setDataAugmentFunction,
			getNodesByNameArray: getNodesByNameArray,
			getMDSDataForContentIDs: getMDSDataForContentIDs,
			registerMetadataServerListener: registerMetadataServerListener,
			getMDSAddress: getMDSAddress,
			getNodes: getNodes,
			getNodeAssetCount: getNodeAssetCount
		};
	}());
	$N.apps.core.Language.adornWithGetString($N.app.MDSUtil, "apps/now/common/");

}($N || {}));
