/**
 * Helper class for dealing with the CatchUp feature.
 * Implementation is specific to NET as it uses Traxis/SeaChange.
 * Playback mechanism is re-used by StartOver feature for NET too.
 *
 * @class $N.app.CatchUpHelper
 * @author hepton
 * @requires $N.apps.core.Log
 * @requires $N.app.FeatureManager
 * @requires $N.app.NowPlayback
 * @requires $N.app.TraxisUtil
 * @requires $N.app.MDSUtil
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.CatchUpHelper = (function () {

		var log = new $N.apps.core.Log("Helper", "CatchUpHelper"),
			VOD_ASSET_TYPE = $N.app.constants.VOD_ASSET_TYPE,
			featureManager = $N.app.FeatureManager,
			mdsUtil = $N.app.MDSUtil,
			loadingBar = null,
			currentRequestData = null,
			STUBBED_PLAYBACK_ID = "0001007201f5a7fb_VIDEO",
			SUBSCRIBE_CHANNEL_ACTION = 0,
			CANCEL_ACTION = 1,
			LOADING_BAR_CSS_CONFIG = {
				backgroundClass: "dialogueBackground",
				basicGradientTopClass: "dialogueGlowUpper",
				basicGradientBottomClass: "dialogueGlowLower",
				solidLineTopClass: "loadingBarSolidDivider",
				solidLineBottomClass: "loadingBarSolidDivider",
				barBackgroundClass: "dialogueBackplate",
				textClass: "dialogMessage"
			},
			featureSwitchedOnEventID = 0,
			featureEnabledListener = null,
			featureSwitchedOffEventID = 0,
			featureDisabledListener = null,
			featureEnabled = false;

		featureDisabledListener = function () {
			log("featureDisabledListener", "Enter & Exit");
			featureEnabled = false;
		};

		featureEnabledListener = function () {
			log("featureEnabledListener", "Enter & Exit");
			featureEnabled = true;
		};

		/**
		 * @method initialise
		 * @param {Object} viewObject
		 */
		function initialise(viewObject) {
			log("initialise", "Enter");
			loadingBar = viewObject;
			featureEnabled = featureManager.isCatchUpEnabled();

			featureSwitchedOnEventID = $N.apps.util.EventManager.subscribe("CatchUpEnabled", featureEnabledListener, $N.app.CatchUpHelper);
			featureSwitchedOffEventID = $N.apps.util.EventManager.subscribe("CatchUpDisabled", featureDisabledListener, $N.app.CatchUpHelper);

			log("initialise", "Exit");
		}

		/**
		 * @method isCatchUp
		 * @private
		 * @param {Object} data
		 */
		function isCatchUp(data) {
			log("isCatchUp", "Enter & Exit");
			return featureEnabled && $N.app.EventUtil.isPastEvent(data) && data.isCatchUp;
		}

		/**
		 * This is a keyhandler when option is displayed to subscribe to a channel
		 * @method purchaseButtonsHandler
		 * @param {Object} key
		 * @param {Object} purchaseObject, custom object required to build popups
		 * @private
		 */
		function purchaseButtonsHandler(key, purchaseObject) {
			log("purchaseButtonsHandler", "Enter");
			var serviceToTune = null,
				i = null;
			if (key && key.action === SUBSCRIBE_CHANNEL_ACTION) {
				log("purchaseButtonsHandler", "SUBSCRIBE_CHANNEL_ACTION");
				serviceToTune = $N.app.epgUtil.getServiceByChannelNumber($N.app.constants.SUBSCRIPTION_CHANNEL);
				if (serviceToTune) {
					serviceToTune.showBanner = true;
					$N.app.epgUtil.tuneToChannel(serviceToTune);
				}
			}
			// No need to do anything on cancel action
			log("purchaseButtonsHandler", "Exit");
		}

		/**
		 * This is to display the popup with options to subscribe channel or just cancel
		 * @method showSubscriptionPopup
		 * @param {Object} resultObject, custom object required to build popups
		 * @param {Number} id enumeration for the dialogue
		 * @param {String} message for the popup
		 * @param {Object} dialogButtons for the popup
		 * @private
		 */
		function showSubscriptionPopup(resultObject, id, message, dialogButtons) {
			log("showSubscriptionPopup", "Enter");
			var dialogue = null,
				buttonHandler = null;
			dialogue = $N.app.DialogueHelper.createAndShowDialogue(id,
					$N.app.CatchUpHelper.getString("currentlyUnsubscribed"),
					(message) ? $N.app.CatchUpHelper.getString(message) : null,
					dialogButtons,
					null,  // buttonhandler could go here, and avoid directly modifying dialogGUIObject further down.
					null,
					"VERTICAL",
					null);
			buttonHandler = function (key) {
				log("buttonHandler", "Enter");
				$N.apps.dialog.DialogManager.hideDialog(dialogue);
				purchaseButtonsHandler(key, resultObject);
				log("buttonHandler", "Exit");
			};
			dialogue._dialogGUIObject.configure({"selectedCallback" : buttonHandler});
			log("showSubscriptionPopup", "Exit");
		}

		/**
		 * @method updateLoadingBar
		 * @private
		 * @param {Boolean} isLoading
		 */
		function updateLoadingBar(isLoading) {
			log("updateLoadingBar", "Enter");
			if (loadingBar !== null) {
				if (isLoading === true) {
					loadingBar.setCss(LOADING_BAR_CSS_CONFIG);
					loadingBar.setTextX(863);
					loadingBar.setText($N.app.CatchUpHelper.getString("loading"));
				}
				loadingBar.setLoading(isLoading);
			}
			log("updateLoadingBar", "Exit");
		}

		/**
		 * @method entitlementFailureCallback
		 * @private
		 * @param {Object} errorCode The error code received back from the Traxis call.
		 */
		function entitlementFailureCallback(errorCode) {
			log("entitlementFailureCallback", "Enter");
			log("entitlementFailureCallback", "Error code: " + errorCode);

			if (errorCode !== 403) {
				if (errorCode === 404) {
					updateLoadingBar(false);
					$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_CATCHUP_NOT_FOUND);
					$N.app.DialogueHelper.updateDialogueTitleAndMessage($N.app.constants.DLG_CATCHUP_NOT_FOUND,
						$N.app.CatchUpHelper.getString("catchUpNotFoundDialogueTitle"),
						$N.app.CatchUpHelper.getString("catchUpNotFoundDialogueMessage"));

				} else {
					updateLoadingBar(false);
					$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_CATCHUP_SYSTEM_MSG);
					$N.app.DialogueHelper.updateDialogueTitleAndMessage($N.app.constants.DLG_CATCHUP_SYSTEM_MSG,
						$N.app.CatchUpHelper.getString("catchupSystemErrorDialogueTitle"),
						$N.app.CatchUpHelper.getString("catchupSystemErrorDialogueMessage") + "\n\n" + $N.app.CatchUpHelper.getString("errorCode") + errorCode);
				}
			} else {
				/*
				var dialogButtons = [{
						name: $N.app.CatchUpHelper.getString("launchSubscription"),
						action: SUBSCRIBE_CHANNEL_ACTION
					}, {
						name: $N.app.CatchUpHelper.getString("cancel"),
						action: CANCEL_ACTION
					}];
				updateLoadingBar(false);
				showSubscriptionPopup(errorCode, $N.app.constants.DLG_PPV_CHANNEL_SUBSCRIPTION, "subscriptionMessageText", dialogButtons);
				*/

				updateLoadingBar(false);
				$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_CATCHUP_FORBIDDEN);
				$N.app.DialogueHelper.updateDialogueTitleAndMessage($N.app.constants.DLG_CATCHUP_FORBIDDEN,
					$N.app.CatchUpHelper.getString("catchupForbiddenDialogueTitle"),
					$N.app.CatchUpHelper.getString("catchupForbiddenDialogueMessage"));
			}
			log("entitlementFailureCallback", "Exit");
		}

		/**
		 * @method mapData
		 * @private
		 * @param {Object} resultObj
		 */
		function mapData(resultObj) {
			resultObj.eventId = currentRequestData.eventId;
			resultObj.serviceId = currentRequestData.serviceId;
			resultObj.startTime = currentRequestData.startTime;
			resultObj.endTime = currentRequestData.endTime;
			resultObj.parentalRating = currentRequestData.parentalRating;
			resultObj.shortDesc = currentRequestData.shortDesc;
			resultObj.longDesc = currentRequestData.longDesc;
			resultObj.seriesId = currentRequestData.seriesId;
			resultObj.episodeId = currentRequestData.episodeId;
			resultObj.displaySeasonEpisode = currentRequestData.displaySeasonEpisode;
			resultObj.actors = currentRequestData.actors;
			resultObj.directors = currentRequestData.directors;
			resultObj.originalName = currentRequestData.originalName;
			resultObj.epOriginalName = currentRequestData.epOriginalName;
			resultObj.year = currentRequestData.year;
			resultObj.country = currentRequestData.country;
			resultObj.genres = currentRequestData.genres || $N.app.genreUtil.getGenreObjectFromGenreString(currentRequestData.netEventGenres);
		}

		/**
		 * @method entitlementSuccessCallback
		 * @private
		 * @param {Object} resultObj
		 */
		function entitlementSuccessCallback(resultObj, fileName, isStartOverPlayback, serviceIdForBackgroundTune) {
			log("entitlementSuccessCallback", "Enter");
			var confirmPurchase = false,
				playFromStart = false;
			updateLoadingBar(false);
			if (resultObj && resultObj.Content && resultObj.Content.EntitledProduct) {
				resultObj.title = currentRequestData.title;
				resultObj.Rating = {
					code: currentRequestData.parentalRating,
					precedence: currentRequestData.parentalRating
				};
				resultObj.type = currentRequestData.type;
				resultObj.fileName = fileName;
				mapData(resultObj);
				$N.app.AutoTuneHelper.tuneToChannel(serviceIdForBackgroundTune, true);
				$N.app.NowPlayback.playAsset(resultObj, resultObj.Content.EntitledProduct, function () {}, confirmPurchase, playFromStart, isStartOverPlayback);
			} else {
				entitlementFailureCallback(403);
			}
			log("entitlementSuccessCallback", "Exit");
		}

		/**
		 * @method getAssetIdFromResult
		 * @param {Object} result
		 * @param (optional) {Boolean} isStartOverPlayback
		 * @return {String} assetId or empty string if unavailable
		 */
		function getAssetIdFromResult(result, isStartOverPlayback) {
			log("getAssetIdFromResult", "Enter");
			var count = 0,
				timeShiftTVContent,
				key;
			if (result && result.Contents && result.Contents.Content && result.Contents.Content[0] && result.Contents.Content[0].Tstv) {
				timeShiftTVContent = result.Contents.Content[0].Tstv;
				for (key in timeShiftTVContent) {
					if (timeShiftTVContent.hasOwnProperty(key)) {
						if (!isStartOverPlayback && timeShiftTVContent[count].model === 'CatchUp') {
							return timeShiftTVContent[count].id;
						} else if (isStartOverPlayback && timeShiftTVContent[count].model === 'StartOver') {
							return timeShiftTVContent[count].id;
						}
						count++;
					}
				}
			}
			log("getAssetIdFromResult", "Exit");
			return "";
		}

		/**
		 * @method playCatchUp
		 * @private
		 * @param {Object} data
		 * @param (optional) {Boolean} isStartOverPlayback
		 */
		function playCatchUp(data, isStartOverPlayback) {
			log("playCatchUp", "Enter");
			var isSmartCardInserted = $N.app.ConditionalAccessCAK73.getCASmartCardInfo().smartcardInfo ? true : false,
				assetCrid,
				fileName;

			if (isSmartCardInserted === false) {
				$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_CA_SMART_CARD_REMOVED);
			} else if (mdsUtil.isServerAvailable() === false) {
				$N.app.DialogueHelper.showEthernetDisconnectedDialogue();
			} else { // isSmartCardInserted, isVODEnabled, isNetworkAvailable all true, so make request
				updateLoadingBar(true);
				currentRequestData = data;
				currentRequestData.type = isStartOverPlayback ? VOD_ASSET_TYPE.STARTOVER : VOD_ASSET_TYPE.CATCHUP;
				$N.app.TraxisUtil.getCatchUpForPlayback(data.uniqueEventId, function (result) {
					assetCrid = result.crid;
					fileName = result.fileName;

					if ($N.platform.system.Preferences.get("traxis.developer.mode", false) === "on") {
						assetCrid =  STUBBED_PLAYBACK_ID;
					}

					$N.app.TraxisUtil.getEntitlementForCatchUp(assetCrid, function (result) {
						entitlementSuccessCallback(result, fileName, isStartOverPlayback, data.serviceId);
					}, function () {
						// Failure
						entitlementFailureCallback(403);
					});
				},
					function (errorCode) {
						entitlementFailureCallback(errorCode || 403);
					});
			}
			log("playCatchUp", "Exit");
		}

		return {
			initialise: initialise,
			isCatchUp: isCatchUp,
			playCatchUp: playCatchUp
		};
	}());
	$N.apps.core.Language.adornWithGetString($N.app.CatchUpHelper);

}($N || {}));
