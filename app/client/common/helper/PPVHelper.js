/**
 * Helper class for PPVHelper
 * This manages the PPV activities with
 * generic function calls.
 * @class $N.app.PPVHelper
 * @author raj
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};

	$N.app.PPVHelper = (function () {

		var CONTINUE_OPTION = 1,
			pinHelper = null,
			PIN_TYPE = "purchase",
			PPV_TYPE_EVENT = "EVENT",
			PPV_TYPE_CHANNEL = "CHANNEL",
			BUY_EVENT_ACTION = 0,
			SUBSCRIBE_CHANNEL_ACTION = 1,
			currentEvent = null,
			DEFAULT_EVENT_IMAGE_NAME = "camera.png",
			purchaseDelayTimeout = null,
			currentDialogue = null;

		/**
		 * This is a generic method to create pinHelper object
		 * and configure as per needs
		 * @method createPinEntry
		 * @param {Object} configObject, which has all input params to create pinHelper
		 * @private
		 */
		function createPinEntry(configObject, successfullAuthenticationCallback) {
			if (!pinHelper) {
				pinHelper = new $N.app.PinHelper(successfullAuthenticationCallback, null, null, null, 0, true);
			}
			configObject.x = 0;
			configObject.y = 0;
			configObject.width = 1920;
			configObject.height = 1080;
			configObject.cancelCallback = function () {
				pinHelper.hideDialog();
			};
			pinHelper.setDialogProperties(configObject);
			if (successfullAuthenticationCallback) {
				pinHelper.setAuthenticationSuccessCallback(successfullAuthenticationCallback);
			}
		}

		/**
		 * This is to check if pin dialog is visible
		 * and if so, hide it
		 * @method hidePinDialog
		 * @private
		 */
		function hidePinDialog() {
			if (pinHelper && pinHelper.isPinShowing()) {
				clearTimeout(purchaseDelayTimeout);
				pinHelper.hideDialog();
			}
		}

		/**
		 * This is to check if a product is PPV event purchasable as per
		 * NET requirement, which filters based on flags and product type
		 * @method isPPVProduct
		 * @param {Object} product
		 * @return {boolean}
		 * @private
		 */
		function isPPVProduct(product) {
			if ((($N.app.GeneralUtil.bitwiseAnd(product.flags, CCOM.ConditionalAccess.PURCHASABLE) === CCOM.ConditionalAccess.PURCHASABLE)
					||
					($N.app.GeneralUtil.bitwiseAnd(product.flags, CCOM.ConditionalAccess.OFFLINE_PURCHASE) === CCOM.ConditionalAccess.OFFLINE_PURCHASE)
					||
					($N.app.GeneralUtil.bitwiseAnd(product.flags, CCOM.ConditionalAccess.SMS_PURCHASE) === CCOM.ConditionalAccess.SMS_PURCHASE)
				) && ((product.caType === CCOM.ConditionalAccess.EVENT)
						|| (product.caType === CCOM.ConditionalAccess.EVENT_PACKAGE))
						) {
				return true;
			} else {
				return false;
			}
		}

		/**
		 * This is to check if a channel is wholly purchasable as per
		 * NET requirement, which filters based on flags and product type
		 * @method isSubscriptionProduct
		 * @param {Object} product
		 * @return {boolean}
		 * @private
		 */
		function isSubscriptionProduct(product) {
			if (($N.app.GeneralUtil.bitwiseAnd(product.flags, CCOM.ConditionalAccess.PURCHASABLE) === CCOM.ConditionalAccess.PURCHASABLE)
					&& ((product.caType === CCOM.ConditionalAccess.SERVICE) || (product.caType === CCOM.ConditionalAccess.SERVICE_PACKAGE))) {
				return true;
			} else {
				return false;
			}
		}

		/**
		 * Tunes to the channel of the current service
		 * If the user is already in zapper then the updateBannerAndTuneIfNeeded method is called
		 * otherwise user is taken to zapper and the service is tuned
		 * @method tuneToChannel
		 * @private
		 * @param {Number} serviceId of the event we wish to tune to
		 */
		function tuneToChannel(service, contextChangeCallback) {
			if ($N.apps.core.ContextManager.getActiveContext().getId() !== "ZAPPER") {
				$N.app.ContextHelper.openContext("ZAPPER", {activationContext: service, navCompleteCallback: contextChangeCallback});
			} else if (!contextChangeCallback) {
				$N.apps.core.ContextManager.getActiveController().updateBannerAndTuneIfNeeded(service);
			}
		}

		/**
		 * This is to make a custom object which is used
		 * to build popups in later stage
		 * @method makePurchaseObject
		 * @param {Object} purchaseObj
		 * @param {String} eventId
		 * @param {boolean} isPPVProduct
		 * @param {boolean} isSubscriptionProduct
		 * @param {Object} customProduct
		 * @return {Object} purchaseObj, custom object required to build popups
		 * @private
		 */
		function makePurchaseObject(purchaseObj, eventId, isPPVProduct, isSubscriptionProduct, customProduct, isImpulsive) {
			var i = null,
				isProductExisting = false;
			if (!purchaseObj) {
				purchaseObj = {
					"eventId" : eventId,
					"products" : []
				};
			}
			purchaseObj.isPPVProduct = (!isPPVProduct) ? purchaseObj.isPPVProduct : isPPVProduct;
			purchaseObj.isSubscriptionProduct = (!isSubscriptionProduct) ? purchaseObj.isSubscriptionProduct : isSubscriptionProduct;
			purchaseObj.isImpulsive = isImpulsive;
			if (customProduct) {
				for (i = 0; i < purchaseObj.products.length; i++) {
					if (purchaseObj.products[i].id === customProduct.id) {
						isProductExisting = true;
						break;
					}
				}
				if (isProductExisting === false) {
					purchaseObj.products.push(customProduct);
				}
			}
			return purchaseObj;
		}

		/**
		 * This is to check if event has PPV event purchase
		 * or channel subscription or both
		 * @method getPPVEventPurchaseInfo
		 * @param {Object} event
		 * @param {Object} eventInfo
		 * @return {Object} purchaseObj, custom object required to build popups
		 * @public
		 */
		function getPPVEventPurchaseInfo(event, eventInfo) {
			var product = null,
				products = null,
				productTypeIndex = 0,
				eventId = event.eventId,
				i = null,
				customProductObj = null,
				purchaseObject = null,
				isPPV = false,
				isSubscription = false,
				isImpulsive = false;
			if (!eventInfo) {
				eventInfo = (event !== null) ? CCOM.ConditionalAccess.getEventInfo(event.eventId) : null;
			}
			if (eventInfo && eventInfo.products) {
				products = eventInfo.products;
				for (i = 0; i < products.length; i++) {
					isPPV = false;
					isSubscription = false;
					product = products[i];
					customProductObj = {
						"id" : product.id,
						"cost" : product.cost
					};
					if (isPPVProduct(product)) {
						customProductObj.type = PPV_TYPE_EVENT;
						if ($N.app.GeneralUtil.bitwiseAnd(product.flags, CCOM.ConditionalAccess.IMPULSIVE) === CCOM.ConditionalAccess.IMPULSIVE) {
							isImpulsive = true;
						}
						isPPV = true;
					} else if (isSubscriptionProduct(product)) {
						customProductObj.type = PPV_TYPE_CHANNEL;
						isSubscription = true;
					}
					if (isPPV || isSubscription) {
						purchaseObject = makePurchaseObject(purchaseObject, eventId, isPPV, isSubscription, customProductObj, isImpulsive);
					}
				}
			}
			return purchaseObject;
		}

		/**
		 * This is to check if event has PPV event purchase
		 * or channel subscription or both and if it can be purchased
		 * at the moment or not
		 * @method getPurchasableObject
		 * @param {Object} event
		 * @param {Object} eventInfo
		 * @return {Object} purchaseObj, custom object required to build popups
		 * @public
		 */
		function getPurchasableObject(event, eventInfo, needResultAsObject) {
			var purchaseObject = null;
			if (!eventInfo) {
				eventInfo = (event !== null) ? CCOM.ConditionalAccess.getEventInfo(event.eventId) : null;
			}
			if (eventInfo && (eventInfo.caAccess === CCOM.ConditionalAccess.DENIED)) {
				purchaseObject = getPPVEventPurchaseInfo(event, eventInfo);
				if (purchaseObject && !purchaseObject.isImpulsive && !needResultAsObject) {
					return false;
				}
			}
			return purchaseObject;
		}

		/**
		 * This is to trigger synopsis when buy PPV event is initiated
		 * Used as a callback for dialog too
		 * @method showSynopsisForPPV
		 * @param {Object} purchaseObject, custom object required to build popups
		 * @private
		 */
		function showSynopsisForPPV(purchaseObject) {
			var eventObj = $N.platform.btv.EPG.getEventById(purchaseObject.eventId);
			eventObj.purchaseObject = purchaseObject;
			$N.app.epgUtil.navigateToSynopsis(eventObj, false, null);
		}

		/**
		 * This is a keyhandler when options are displayed
		 * to buy PPV event or subscribe channel
		 * @method purchaseButtonsHandler
		 * @param {Object} key
		 * @param {Object} purchaseObject, custom object required to build popups
		 * @private
		 */
		function purchaseButtonsHandler(key, purchaseObject) {
			var serviceToTune = null,
				i = null;
			if (key.action === BUY_EVENT_ACTION) {
				showSynopsisForPPV(purchaseObject);
			} else if (key.action === SUBSCRIBE_CHANNEL_ACTION) {
				serviceToTune = $N.app.epgUtil.getServiceByChannelNumber($N.app.constants.SUBSCRIPTION_CHANNEL);
				if (serviceToTune) {
					serviceToTune.showBanner = true;
					$N.app.epgUtil.tuneToChannel(serviceToTune);
				}
			}
		}

		/**
		 * This is to display the popup with options to both purchase event
		 * and subscribe channel or just subscribe channel
		 * @method showPurchasePopup
		 * @param {Object} purchaseObject, custom object required to build popups
		 * @param {Number} enumeration for the dialogue
		 * @param {String} message for the popup
		 * @param {Object} dialogButtons for the popup
		 * @private
		 */
		function showPurchasePopup(purchaseObject, id, message, dialogButtons, dialogueExitCallback) {
			var ppvHelperRef = $N.app.PPVHelper,
				dialogue = null,
				buttonHandler = null;
			dialogue = $N.app.DialogueHelper.createAndShowDialogue(id,
											ppvHelperRef.getString("PPVSubscriptionTitleText"),
											(message) ? ppvHelperRef.getString(message) : null,
											dialogButtons,
											null,
											null,
											"VERTICAL",
											null);
			buttonHandler = function (key) {
				$N.apps.dialog.DialogManager.hideDialog(dialogue);
				purchaseButtonsHandler(key, purchaseObject);
			};
			dialogue._dialogGUIObject.configure({"selectedCallback" : buttonHandler});
			dialogue.setExitCallback(dialogueExitCallback);
			currentDialogue = dialogue;
		}

		/**
		 * This is to format the purchase cost for display purpose
		 * @method formatPurchaseRate
		 * @param {Number} rate
		 * @private
		 */
		function formatPurchaseRate(rate) {
			var purchaseRate = "",
				DECIMAL_PTS = 0.01;//value received from CCOM will be a whole number including centavos(1/100th of 1 real). So converting to decimals for UI
			if (rate || rate === 0) {
				purchaseRate = (rate * DECIMAL_PTS).toFixed(2);
				purchaseRate = purchaseRate.replace(".", ",");
				purchaseRate = "R$" + purchaseRate;
			}
			return purchaseRate;
		}

		/**
		 * This is get product object from the array of products
		 * present in purchaseobject
		 * @method getProductByType
		 * @param {Object} purchaseObject, custom object required to build popups
		 * @param {String} type
		 * @return {Object} product or null
		 * @private
		 */
		function getProductByType(purchaseObject, type) {
			if (purchaseObject.products) {
				var ind = $N.app.ArrayUtil.getIndex(purchaseObject.products, function (product) {return product.type === type; });
				if (ind > -1) {
					return purchaseObject.products[ind];
				} else {
					return null;
				}
			} else {
				return null;
			}
		}

		/**
		 * This is to check if a channel is wholly purchasable
		 * @method isServiceSubscriptionAvailable
		 * @param {String} serviceId
		 * @return {boolean}
		 * @private
		 */
		function isServiceSubscriptionAvailable(serviceId) {
			var serviceAccessObj = CCOM.ConditionalAccess.getServiceAccess(serviceId),
				cardInfo = CCOM.ConditionalAccess.getSmartcardInfo();
			return ((serviceAccessObj.caAccess === CCOM.ConditionalAccess.DENIED) && (cardInfo.smartcardInfo.state === CCOM.ConditionalAccess.OK));
		}

		/**
		 * This is display appropriate popup depending on the
		 * product object
		 * @method showPurchaseOptionsIfAvailable
		 * @param {Object} event
		 * @public
		 */
		function showPurchaseOptionsIfAvailable(event, dialogueExitCallback) {
			if (event) {
				var dialogButtons = null,
					eventInfo = CCOM.ConditionalAccess.getEventInfo(event.eventId),
					purchaseObject = getPurchasableObject(event, eventInfo, true),
					serviceObj = null,
					serviceInfo = null,
					eventTitle = null,
					eventTime = null,
					startTime = null,
					startDate = null,
					startLabel = null,
					endLabel = null,
					dateAndTimeInfo = null,
					parentalRatingIconHref = null,
					genreInfo = null,
					purchaseRate = null,
					product = null,
					PPVEventDialogue = null,
					ppvHelperRef = $N.app.PPVHelper,
					isServiceSubscribable = isServiceSubscriptionAvailable(event.serviceId),
					isPPVProduct = (purchaseObject) ? purchaseObject.isPPVProduct : false,
					isSubscriptionProduct = (purchaseObject) ? purchaseObject.isSubscriptionProduct : false,
					isImpulsive = (purchaseObject) ? purchaseObject.isImpulsive : false;
				if ((isImpulsive || isPPVProduct || isSubscriptionProduct || isServiceSubscribable)
						&& !$N.app.EventUtil.isEventPreviewTime(event, eventInfo)
						&& $N.app.ConditionalAccessCAK73.isAccessDenied()) {
					serviceObj = $N.app.epgUtil.getServiceById(event.serviceId);
					serviceInfo = serviceObj.logicalChannelNum + " " + serviceObj._data.name;
					eventTitle = event.title;
					eventTime = new Date(event.startTime);
					startTime = $N.app.DateTimeUtil.getFormattedTimeString(eventTime, $N.app.constants.TWENTY_FOUR_HOUR_TIME_FORMAT);
					startDate = $N.app.DateTimeUtil.getDayMonthStringFromDate(eventTime);
					startLabel = $N.app.DateTimeUtil.getWeekdayDayMonthTimeStringFromDate(eventTime);
					endLabel = $N.apps.util.Util.formatTime(new Date(event.endTime), "HH:MM");
					dateAndTimeInfo = $N.app.StringUtil.join(" ", [startLabel, "-", endLabel]);
					parentalRatingIconHref = $N.app.ImageUtil.getParentalRatingIconHrefInHelpers(event.parentalRating);
					genreInfo = $N.app.genreUtil.getGenresByEvent(event);
					if (!isImpulsive && isPPVProduct) {
						$N.app.DialogueHelper.createAndShowCADialogue($N.app.constants.DLG_CA_SMART_CARD_ACCESS_DENIED_PPV);
					} else if (isPPVProduct && (isSubscriptionProduct || isServiceSubscribable)) {
						dialogButtons = [{
							name: ppvHelperRef.getString("buyEventButton"),
							action: BUY_EVENT_ACTION
						}, {
							name: ppvHelperRef.getString("buyChannelButton"),
							action: SUBSCRIBE_CHANNEL_ACTION
						}];
						showPurchasePopup(purchaseObject, $N.app.constants.DLG_PPV_CHANNEL_SUBSCRIPTION, "PPVSubscriptionMessageText", dialogButtons, dialogueExitCallback);
					} else if (isPPVProduct) {
						product = getProductByType(purchaseObject, PPV_TYPE_EVENT);
						purchaseRate = product.cost;
						PPVEventDialogue = $N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_PPV_EVENT,
												null,
												null,
												null,
												null,
												null,
												null,
												null,
												{	"title" : eventTitle,
													"message" : dateAndTimeInfo,
													"dialogueTypeLabel" : serviceInfo,
													"alertImageSubTextConfig" : {"text" : genreInfo},
													"alertImageTextConfig" : {"text" : formatPurchaseRate(purchaseRate)},
													"alertImage" : {"href" : parentalRatingIconHref},
													"purchaseObject" : purchaseObject,
													"titleImageFromEvent" : event,
													"PPVOkCallback" : showSynopsisForPPV,
													"highlightedItemLabelText" : ppvHelperRef.getString("PPVConfirmationText")
												},
												null,
												$N.gui.PPVConfirmationDialog,
												null,
												null
												);
						PPVEventDialogue._dialogGUIObject.refreshPPVPositions();
						if (dialogueExitCallback) {
							PPVEventDialogue.setExitCallback(dialogueExitCallback);
						}
						currentDialogue = PPVEventDialogue;
					} else if (isSubscriptionProduct || isServiceSubscribable) {
						dialogButtons = [{
							name: ppvHelperRef.getString("buyChannelButton"),
							action: SUBSCRIBE_CHANNEL_ACTION
						}];
						showPurchasePopup(purchaseObject, $N.app.constants.DLG_CHANNEL_SUBSCRIPTION, "PPVSubscriptionMessageText", dialogButtons, dialogueExitCallback);
					}
				}
			}
		}

		/**
		 * This is to handle error scenarios on purhcase failure
		 * and display error popups accordingly
		 * @method ppvEventPurchaseErrorHandler
		 * @param {Object} errorObject
		 * @private
		 */
		function ppvEventPurchaseErrorHandler(errorObject) {
			var ppvHelperRef = $N.app.PPVHelper,
				dialogue = null,
				title = ppvHelperRef.getString("warning") + " !",
				message = null,
				dialogButton = [{
					name: ppvHelperRef.getString("ok")
				}];
			if (errorObject) {
				switch (errorObject.name) {
				case "OutOfPurchaseWindow":
					message = ppvHelperRef.getString("purchaseWindowErrorMessage");
					break;
				case "NoCredit":
				case "LowCredit":
					message = ppvHelperRef.getString("insufficientCreditErrorMessage");
					break;
				default:
					message = ppvHelperRef.getString("otherPPVErrorMessage");
					break;
				}
			} else {
				message = ppvHelperRef.getString("otherPPVErrorMessage");
			}
			hidePinDialog();
			dialogue = $N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_PPV_PURCHASE_ERROR, title, message, dialogButton, null, null, null, null, {"message" : message});
		}

		/**
		 * To construct a purchase object in desired
		 * format which has all details of products in an event
		 * @method makeCustomPurchaseHistoryObject
		 * @param {String, Object} event Id, eventObject
		 * @private
		 */
		function makeCustomPurchaseHistoryObject(eventId, product) {
			var smartCardObject = $N.app.ConditionalAccessCAK73.getCASmartCardInfo(),
				smartCardNumber = smartCardObject.smartcardInfo.serialNumber,
				event = $N.platform.btv.EPG.getEventById(eventId),
				service = $N.app.epgUtil.getServiceById(event.serviceId);
			smartCardNumber = smartCardNumber.replace(/ /g, '');
			return {
				"stbid" : smartCardNumber,
				"channr" : service._data.channelKey,
				"channame" : service._data.name,
				"isAdult" : $N.app.epgUtil.isAdultEvent(event),
				"startTime" : event.startTime,
				"eventname" : event.title,
				"cost" : product.cost
			};
		}

		/**
		 * @method showPurchaseSuccessDialog
		 * Create dialogue using PPV gui template and display
		 */
		function showPurchaseSuccessDialog() {
			var purchaseSuccessDialogue = $N.app.DialogueHelper.getDialogue($N.app.constants.DLG_PPV_PURCHASE_SUCCESS);

			if (!purchaseSuccessDialogue) {
				purchaseSuccessDialogue = $N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_PPV_PURCHASE_SUCCESS,
							undefined, // titleText
							undefined, // messageText
							null, // optionsParam,
							null, // optionSelectedCallbackParam,
							null, // optionHighlightedCallbackParam,
							null, // optionsOrientationParam,
							null, // titleImageParam,
							null, // dialogObjectConfigParam,
							null, // alertIconParam,
							$N.gui.PPVSuccessConfirmationDialog);
			} else {
				$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_PPV_PURCHASE_SUCCESS);
			}

			purchaseSuccessDialogue._dialogGUIObject.refreshPPVSuccessPositions();
		}

		/**
		 * This is to handle success scenario on PPV event purchase
		 * @method ppvEventPurchaseSuccessHandler
		 * @private
		 */
		function ppvEventPurchaseSuccessHandler(eventId, product) {
			var purchaseList = null,
				purchaseHistoryObj = null,
				event = $N.platform.btv.EPG.getEventById(eventId),
				service = null;

			purchaseList = $N.platform.system.Preferences.getPreferenceObject($N.app.constants.PURCHASE_LIST);
			if (!purchaseList) {
				purchaseList = [];
			}
			purchaseHistoryObj = makeCustomPurchaseHistoryObject(eventId, product);
			purchaseList.splice(0, 0, purchaseHistoryObj);
			$N.platform.system.Preferences.setPreferenceObject($N.app.constants.PURCHASE_LIST, purchaseList);
			hidePinDialog();
			if ($N.app.EventUtil.isEventShowingNow(event)) {
				service = $N.app.epgUtil.getServiceById(event.serviceId);
				service.showBanner = false;
				tuneToChannel(service, showPurchaseSuccessDialog);
			} else {
				$N.app.ContextHelper.closeContext();
				showPurchaseSuccessDialog();
			}
		}

		/**
		 * This is to do actual purchase for a PPV event
		 * @method doPPVEventPurchase
		 * @param {Object} purchaseObject
		 * @private
		 */
		function doPPVEventPurchase(purchaseObject) {
			var product = getProductByType(purchaseObject, PPV_TYPE_EVENT),
				inputObject = {
					eventId : purchaseObject.eventId,
					mode : CCOM.ConditionalAccess.OFFLINE,
					productId : product.id
				},
				purchaseResult = null;
			purchaseDelayTimeout = setTimeout(function () {//timer is added so it allows the loader to appear once, since the CCOM call is synchronous and takes time
				purchaseResult = CCOM.ConditionalAccess.purchaseProduct(inputObject);
				if (purchaseResult && Object.keys(purchaseResult).length === 0) {//success
					ppvEventPurchaseSuccessHandler(purchaseObject.eventId, product);
				} else if (purchaseResult) {//failure
					ppvEventPurchaseErrorHandler(purchaseResult.error);
				}
			}, 500);
		}

		/**
		 * This return the default pin config needed
		 * to be displayed when purchase is initiated
		 * @method getPurchasePinConfig
		 * @param {Object} eventObject
		 * @param {Number} price of the product
		 * @private
		 */
		function getPurchasePinConfig(eventObject, purchaseRate) {
			var ppvHelperRef = $N.app.PPVHelper,
				pinConfig = null,
				displayTitle = null,
				service = null;
			if (eventObject) {
				service = $N.platform.btv.EPG.getChannelByServiceId(eventObject.serviceId);
				if ($N.app.ParentalControlUtil.isChannelOrProgramLocked(eventObject) && $N.app.genreUtil.isAdultChannel(service)) {
					displayTitle = ppvHelperRef.getString("adultContent");
				} else {
					displayTitle = eventObject.title;
				}
				pinConfig = {
					id : "ppvAuthentication",
					eventImageVisibility : false,
					title : displayTitle,
					titleCssClass : "PPVEventTitle",
					description : formatPurchaseRate(purchaseRate) + " - " + $N.app.PPVHelper.getString("purchaseMessage"),
					inProgressAppearance: true,
					inProgressIndicatorText: ppvHelperRef.getString("pleaseWaitText")
				};
				if ($N.app.EventUtil.isEventShowingNow(eventObject)) {
					pinConfig.subTitle = ppvHelperRef.getString("ppvEventBegunMessage");
					pinConfig.subTitleCssClass = "agoraServiceName dullYellowColor";
					pinConfig.subTitleX = 435;
					pinConfig.subTitleY = 773.5;
				}
			}
			return pinConfig;
		}

		/**
		 * This is to initiate the PPV event purchase
		 * and bring up the PIN popup for authentication
		 * @method initiatePPVEventPurchase
		 * @param {Object} eventObject
		 * @public
		 */
		function initiatePPVEventPurchase(eventObject) {
			var ppvHelperRef = $N.app.PPVHelper,
				purchaseObject = (!eventObject.purchaseObject) ? (getPurchasableObject(eventObject)) : eventObject.purchaseObject,
				product = getProductByType(purchaseObject, PPV_TYPE_EVENT),
				purchaseRate = product.cost,
				pinConfig = getPurchasePinConfig(eventObject, purchaseRate),
				successfullAuthenticationCallback = function () {
					doPPVEventPurchase(purchaseObject);
				};
			if (eventObject) {
				createPinEntry(pinConfig, successfullAuthenticationCallback);
				pinHelper.showPinDialog(PIN_TYPE, true, null, true);
			}
		}

		/**
		 * Listener that fires whenever the event changes
		 * @method _bounndaryChangedListener
		 * @param {Object} Object with eventBoundaryChangedInfo
		 * @private
		 */
		function _bounndaryChangedListener(data) {
			var eventId = data.eventBoundaryChangedInfo.eventID,
				currentServiceIdFromEpg = $N.app.epgUtil.getServiceById($N.app.epgUtil.getChannelFromPrefs()).serviceId,
				currentEventFromEpg = $N.app.epgUtil.getEvent("current", currentServiceIdFromEpg),
				isBoundaryChanged = true;
			if (currentEventFromEpg && currentEventFromEpg.eventId === eventId) {
				isBoundaryChanged = false;
			}
			if (isBoundaryChanged) {
				currentEvent = $N.platform.btv.EPG.getEventById(eventId);
				$N.app.DialogueHelper.hidePPVDialogue();
				hidePinDialog();
			}
		}

		/**
		 * Returns the current event based on boundary
		 * change event
		 * @method getCurrentEvent
		 * @param {Object} Object with eventBoundaryChangedInfo
		 * @public
		 */
		function getCurrentEvent() {
			return currentEvent;
		}

		/**
		 * Returns the purchasable event's cost after formatting it
		 * @method getEventCostString
		 * @param {Object} Purchase Object with product information
		 * @public
		 */
		function getEventCostString(purchaseObject) {
			var product = getProductByType(purchaseObject, PPV_TYPE_EVENT);
			return formatPurchaseRate(product.cost);
		}

		/**
		 * Registers the listener that fires whenever an event changes
		 * @method intialiseBoundaryChangeListener
		 * @public
		 */
		function intialiseBoundaryChangeListener() {
			$N.app.fullScreenPlayer.registerEventBoundaryChangedListener(_bounndaryChangedListener);
		}

		/**
		 * Unregisters the listener that fires whenever an event changes
		 * @method intialiseBoundaryChangeListener
		 * @public
		 */
		function removeBoundaryChangeListener() {
			currentEvent = null;
			$N.app.fullScreenPlayer.unregisterEventBoundaryChangedListener(_bounndaryChangedListener);
		}

		/**
		 * Retrieves the list of purchased events
		 * @method getPPVPurchases
		 * @param {boolean} flag to say if only adult purchases are needed
		 * @public
		 */
		function getPPVPurchases(isAdultPurchasesOnly) {
			var purchaseList = $N.platform.system.Preferences.getPreferenceObject($N.app.constants.PURCHASE_LIST),
				smartCardObject = null,
				smartCardNumber = null,
				result = [],
				purchaseObj = null,
				i = null;
			if (purchaseList) {
				smartCardObject = $N.app.ConditionalAccessCAK73.getCASmartCardInfo();
				if (smartCardObject && smartCardObject.smartcardInfo && smartCardObject.smartcardInfo.serialNumber) {
					smartCardNumber = smartCardObject.smartcardInfo.serialNumber.replace(/ /g, '');
					for (i = 0; i < purchaseList.length; i++) {
						purchaseObj = purchaseList[i];
						if (smartCardNumber.toString() === purchaseObj.stbid.toString()) {
							if (isAdultPurchasesOnly) {
								if (purchaseObj.isAdult) {
									result.push(purchaseObj);
								}
							} else if (!purchaseObj.isAdult) {
								result.push(purchaseObj);
							}
						}
					}
				}
			}
			return result;
		}

		/**
		 * Called to hide all PPV related dialogs when we
		 * unsubscribe the caPPVAccessDeniedEvent in zapper
		 * @method hidePPVRelatedDialogs
		 * @public
		 */
		function hidePPVRelatedDialogs() {
			hidePinDialog();
			if (currentDialogue) {
				$N.apps.dialog.DialogManager.hideDialog(currentDialogue);
			}
			$N.app.DialogueHelper.hidePPVDialogue();
		}

		/**
		 * @method loadEventImage
		 * @param {Object} event
		 */
		function loadEventImage(event, imageReceivedCallback) {
			if (event) {
				if (event.promoImage) {
					imageReceivedCallback(event);
				} else {
					$N.app.epgUtil.getEventImageFromMDS(event, function (result) {
						if (result) {
							if (!result.promoImage) {
								result.defaultImage = DEFAULT_EVENT_IMAGE_NAME;
							}
						} else {
							result = {"defaultImage" : DEFAULT_EVENT_IMAGE_NAME};
						}
						imageReceivedCallback(result);
					});
				}
			}
		}

		return {
			getPurchasableObject : getPurchasableObject,
			showPurchaseOptionsIfAvailable : showPurchaseOptionsIfAvailable,
			initiatePPVEventPurchase : initiatePPVEventPurchase,
			intialiseBoundaryChangeListener : intialiseBoundaryChangeListener,
			removeBoundaryChangeListener : removeBoundaryChangeListener,
			getCurrentEvent : getCurrentEvent,
			getEventCostString : getEventCostString,
			getPPVPurchases : getPPVPurchases,
			hidePPVRelatedDialogs : hidePPVRelatedDialogs,
			loadEventImage : loadEventImage,
			getPPVEventPurchaseInfo : getPPVEventPurchaseInfo
		};
	}());
	$N.apps.core.Language.adornWithGetString($N.app.PPVHelper);

}($N || {}));
