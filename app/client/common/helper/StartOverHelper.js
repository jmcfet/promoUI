/**
 * Helper class for dealing with the StartOver feature.
 * Implementation is specific to NET as it uses Traxis/SeaChange.
 * Playback mechanism for CatchUp (in $N.app.CatchUpHelper) is re-used
 * by StartOver feature for NET too.
 *
 * @class $N.app.StartOverHelper
 * @author hepton
 * @requires $N.apps.core.Log
 * @requires $N.app.CatchUpHelper
 * @requires $N.app.FeatureManager
 * @requires $N.app.constants
 * #depends CatchUpHelper.js
 * #depends ../customise/operator/FeatureManager.js
 * #depends ../Constants.js
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.StartOverHelper = (function () {
		var log = new $N.apps.core.Log("Helper", "StartOverHelper"),
			catchUpHelper = $N.app.CatchUpHelper,
			featureManager = $N.app.FeatureManager,
			startoverDialog = null,
			currentRequestData = null,
			loadingBar = null,
			VOD_ASSET_TYPE = $N.app.constants.VOD_ASSET_TYPE,
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
			featureEnabled = featureManager.isStartOverEnabled();

			featureSwitchedOnEventID = $N.apps.util.EventManager.subscribe("StartOverEnabled", featureEnabledListener, $N.app.StartOverHelper);
			featureSwitchedOffEventID = $N.apps.util.EventManager.subscribe("StartOverDisabled", featureDisabledListener, $N.app.StartOverHelper);

			log("initialise", "Exit");
		}

		/**
		 * @method isStartOver
		 * @private
		 * @param {Object} data
		 */
		function isStartOver(data) {
			log("isStartOver", "Enter & Exit");
			return featureEnabled && $N.app.EventUtil.isEventShowingNow(data) && data.isStartOver;
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
					null,
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
		 * @method entitlementFailureCallback
		 * @private
		 * @param {Object} resultObj
		 */
		function entitlementFailureCallback(resultObj) {
			log("entitlementFailureCallback", "Enter");

			/*
			var dialogButtons = [{
					name: $N.app.CatchUpHelper.getString("launchSubscription"),
					action: SUBSCRIBE_CHANNEL_ACTION
				}, {
					name: $N.app.CatchUpHelper.getString("cancel"),
					action: CANCEL_ACTION
				}];
			updateLoadingBar(false);
			showSubscriptionPopup(resultObj, $N.app.constants.DLG_PPV_CHANNEL_SUBSCRIPTION, "subscriptionMessageText", dialogButtons);
			*/
			updateLoadingBar(false);
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_CATCHUP_FORBIDDEN);
			$N.app.DialogueHelper.updateDialogueTitleAndMessage($N.app.constants.DLG_CATCHUP_FORBIDDEN,
				$N.app.StartOverHelper.getString("catchupForbiddenDialogueTitle"),
				$N.app.StartOverHelper.getString("catchupForbiddenDialogueMessage"));
			log("entitlementFailureCallback", "Exit");
		}

		/**
		 * @method entitlementSuccessCallback
		 * @private
		 * @param {Object} resultObj
		 */
		function entitlementSuccessCallback(resultObj, fileName, isStartOverPlayback, serviceIdForBackgroundTune) {
			log("entitlementSuccessCallback", "Enter");
			var confirmPurchase = false,
				playFromStart = true;
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
				entitlementFailureCallback(resultObj);
			}
			log("entitlementSuccessCallback", "Exit");
		}

		/**
		 * @method triggerStartOver
		 * @private
		 * @param {Object} data
		 * @param (optional) {Boolean} isStartOverPlayback
		 */
		function triggerStartOver(data, isStartOverPlayback) {
			log("triggerStartOver", "Enter");
			var isSmartCardInserted = $N.app.ConditionalAccessCAK73.getCASmartCardInfo().smartcardInfo ? true : false,
				assetCrid,
				fileName;

			if (isSmartCardInserted === false) {
				$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_CA_SMART_CARD_REMOVED);
			} else if ($N.app.MDSUtil.isServerAvailable() === false) {
				$N.app.DialogueHelper.showEthernetDisconnectedDialogue();
			} else { // isSmartCardInserted, isVODEnabled, isNetworkAvailable all true, so make request
				updateLoadingBar(true);
				currentRequestData = data;
				currentRequestData.type = isStartOverPlayback ? VOD_ASSET_TYPE.STARTOVER : VOD_ASSET_TYPE.CATCHUP;
				$N.app.TraxisUtil.getStartOverForPlayback(data.uniqueEventId, function (result) {
					if (result) {
						assetCrid = result.crid;
						fileName = result.fileName;

						if ($N.platform.system.Preferences.get("traxis.developer.mode", false) === "on") {
							assetCrid =  STUBBED_PLAYBACK_ID;
						}

						$N.app.TraxisUtil.getEntitlementForCatchUp(assetCrid, function (result) {
							entitlementSuccessCallback(result, fileName, isStartOverPlayback, data.serviceId);
						}, entitlementFailureCallback);
					} else {
						entitlementFailureCallback();
					}
				});
			}
			log("triggerStartOver", "Exit");
		}

		/**
		 * @method playStartOver
		 * @private
		 * @param {Object} data
		 */
		function playStartOver(data, userCancelCallback) {
			log("playStartOver", "Enter");
			var dialogueTitle,
				isStartOverPlayback = true,
				RESTART_OPTION = 1,
				CANCEL_OPTION = 2,
				dialogButtons = [{
					name: $N.app.StartOverHelper.getString("yes"),
					action: RESTART_OPTION
				}, {
					name: $N.app.StartOverHelper.getString("no"),
					action: CANCEL_OPTION
				}],
				dialogCallback = function (key) {
					if (key) {
						if (key.action === RESTART_OPTION) {
							triggerStartOver(data, isStartOverPlayback);
						} else if (key.action === CANCEL_OPTION && userCancelCallback) {
							userCancelCallback();
						}
					}
				};

			triggerStartOver(data, isStartOverPlayback);
			/*

			dialogueTitle = data.title;

			if (data.episodeId) {
				dialogueTitle += $N.app.epgUtil.getSeasonEpisodeShort(data, " ");
			}

			startoverDialog = $N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_STARTOVER_PLAYBACK_CONFIRM,
				dialogueTitle,
				$N.app.StartOverHelper.getString("confirmStartoverPlaybackMessage"),
				dialogButtons,
				null,
				null,
				null,
				null,
				{ title: dialogueTitle });

			// Setting the callback here to ensure use of "fresh" data in each use of the dialogue
			//startoverDialog.setSelectedCallback(dialogCallback);
			*/

			log("playStartOver", "Exit");
		}

		return {
			initialise: initialise,
			isStartOver: isStartOver,
			playStartOver: playStartOver
		};
	}());
	$N.apps.core.Language.adornWithGetString($N.app.StartOverHelper);

}($N || {}));