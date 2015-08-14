/**
 * NowPlayback is a class used to request and manage playback of NOW assets
 * @class $N.app.NowPlayback
 * @static
 * @requires $N.app.MDSUtil
 * @requires $N.app.TraxisUtil
 */
var $N = window.parent.$N;
$N.app.NowPlayback = (function () {
	var log = new $N.apps.core.Log("NOW", "NowPlayback"),
		navigation,
		purchasePinHelper,
		showNowDialogCallback = function () {},
		failureCallback = function () {},
		MDSUtil = $N.app.MDSUtil,
		TraxisUtil = $N.app.TraxisUtil;

	/**
	 * @method showDefaultStartoverResumeDialogue
	 * @param {Object} assetData
	 * @param {Function} pinSuccessCallback
	 * @param {Boolean} isSubscription
	 * @private
	 */
	function showStartOverResumeDialogue(assetData, playCallback, isStartOverPlayback) {
		var buttonArray,
			RESUME_OPTION = 1,
			RESTART_OPTION = 2,
			dialogCallback = function (result) {
				var isRestartOption;
				if (result && (result.action === RESTART_OPTION || result.action === RESUME_OPTION)) {
					isRestartOption = (result.action === RESTART_OPTION);
					playCallback(isRestartOption);
				}
			},
			configObject = {
				exitCallback: function () {
					$N.app.DebugUtil.yellow("EXIT CALLBACK:" + $N.app.constants.DLG_STARTOVER_RESUME_OR_STARTOVER);
					$N.app.DialogueHelper.hideDialogueWithId($N.app.constants.DLG_STARTOVER_RESUME_OR_STARTOVER);
				}
			};
		if (isStartOverPlayback) {
			buttonArray = [{
				name: MDSUtil.getString("resumeRecordingDialogueWatch"),
				action: RESUME_OPTION
			}, {
				name: MDSUtil.getString("resumeRecordingDialogueRestart"),
				action: RESTART_OPTION
			}];
		} else {
			buttonArray = [
				{
					name: MDSUtil.getString("resumeOption"),
					action: RESUME_OPTION
				},
				{
					name: MDSUtil.getString("startOverOption"),
					action: RESTART_OPTION
				}
			];
		}
		$N.app.DialogueHelper.createAndShowDialogue(
			$N.app.constants.DLG_STARTOVER_RESUME_OR_STARTOVER,
			MDSUtil.assetDataMapper.getTitle(assetData),
			MDSUtil.getString("resumeOrStartOverText"),
			buttonArray,
			dialogCallback,
			null, // no option highlighted callback
			"VERTICAL", // default orientation
			null, // no title image
			configObject, // no dialog config object
			false,//,  // show alert icon
			$N.gui.NowConfirmationDialog //GuiObject
		);
		$N.app.DialogueHelper.updateDialogueOptions($N.app.constants.DLG_STARTOVER_RESUME_OR_STARTOVER, buttonArray);
	}

	/**
	 * @method showPurchasePin
	 * @param {Object} assetData
	 * @param {Function} pinSuccessCallback
	 * @param {Boolean} isSubscription
	 * @private
	 */
	function showPurchasePin(assetData, pinSuccessCallback, isSubscription) {
		var dialogConfig;
		if (isSubscription) {
			dialogConfig = {
				title: MDSUtil.getString("subscribeTo") + MDSUtil.assetDataMapper.getProductName(assetData) + "?",
				description: MDSUtil.assetDataMapper.getPriceText(assetData, true) + ". " + MDSUtil.getString("purchaseConfirmation")
			};
		} else {
			dialogConfig = {
				title: MDSUtil.getString("purchaseConfirmation"),
				description: ""
			};
		}
		purchasePinHelper.customiseDialog(dialogConfig);
		purchasePinHelper.setAuthenticationSuccessCallback(pinSuccessCallback);
		purchasePinHelper.showPinDialog("purchase", true);
	}

	/**
	 * @method initialise
	 * @param {Object} purchasePinEntry
	 */
	function initialise(navigationManager, purchasePinEntry, dialogCallback) {
		navigation = navigationManager;
		purchasePinHelper = purchasePinEntry;
		showNowDialogCallback = dialogCallback;
	}

	/**
	 * @method playVideo
	 * @param {String} url
	 * @param {Object} assetData
	 * @param {Number} startPosition
	 * @param {Function} successCallback
	 */
	function playVideo(url, assetData, startPosition, successCallback, storeBookmark) {
		log("playVideo", "Enter");

		var config = {
			url: url,
			type: assetData.type || $N.app.constants.VOD_ASSET_TYPE.VOD,
			title: MDSUtil.assetDataMapper.getTitle(assetData),
			promoUrl: MDSUtil.assetDataMapper.getHref(assetData),
			isMusic: false,
			bookmark: startPosition,
			skip: true,
			trickplay: true,
			contentObj: assetData,
			successCallback: function () {
				if ($N.platform.system.Preferences.get($N.app.constants.PREF_SEND_DESCRIBE, true) !== true) {
					log("playVideo", "successCallback SEND_DESCRIBE enabled");
					$N.platform.system.Preferences.set($N.app.constants.PREF_SEND_DESCRIBE, true, true);
				}
				if (successCallback) {
					successCallback();
				}
			},
			failureCallback: function (error) {
				if ($N.platform.system.Preferences.get($N.app.constants.PREF_SEND_DESCRIBE, true) !== true) {
					log("playVideo", "failureCallback SEND_DESCRIBE enabled");
					$N.platform.system.Preferences.set($N.app.constants.PREF_SEND_DESCRIBE, true, true);
				}

				$N.app.ContextHelper.closeContext();
				if (!$N.app.Conflicts.isConflictError(error)) {
					failureCallback();
				}
			},
			retryCallback: function () {
				$N.app.ContextHelper.openContext("MEDIAPLAYER", {
					activationContext: config
				});
			},
			playbackCompleteCallback: function (bookmark) {
				log("playVideo", "playbackCompleteCallback Enter");
				if (storeBookmark) {
					// The RTSP servers being used seem to give our position out by about 10 seconds,
					// so we need to adjust for this when we set a bookmark.
					if (bookmark > $N.app.constants.TEN_SECONDS) {
						TraxisUtil.setBookmark(MDSUtil.assetDataMapper.getFilename(assetData), bookmark - $N.app.constants.TEN_SECONDS);
					} else {
						TraxisUtil.setBookmark(MDSUtil.assetDataMapper.getFilename(assetData), 0);
					}
				}
				log("playVideo", "playbackCompleteCallback Exit");
			},
			moreInfoCallback: function () {
				$N.app.ContextHelper.openContext("SYNOPSIS", {
					activationContext: {
						"data": assetData,
						"type": config.type === $N.app.constants.VOD_ASSET_TYPE.VOD ? "vod" : "epg",
						"playing": true,
						"showBackgroundGradient": false
					}
				});
			},

			playErrorCallback: function (error) {
				log("playErrorCallback", JSON.stringify(error));
				failureCallback(error.contentErrorInfo.reason);
			}
		};
		navigation.confirmPlaybackPermissions(assetData, function () {
			$N.app.ContextHelper.openContext("MEDIAPLAYER", {
				activationContext: config
			});
		});
		log("playVideo", "Exit");
	}

	/**
	 * @method playAsset
	 * @param {Object} assetData
	 * @param {String} entitlementId
	 * @param {Function} successCallback
	 * @param {Boolean} confirmPurchase
	 * @param {Boolean} playFromStart
	 */
	function playAsset(assetData, entitlementId, successCallback, confirmPurchase, playFromStart, isStartOverPlayback) {
		log("playAsset", "Enter");
		var playbackStartedCallback = successCallback,
			playbackUrl = TraxisUtil.getPlaybackUrl(MDSUtil.assetDataMapper.getFilename(assetData), entitlementId),
			triggerPlayback;
		if (confirmPurchase) {
			playbackStartedCallback = function () {
				TraxisUtil.confirmPurchase(entitlementId, successCallback, function () {
					failureCallback($N.app.errorCodes.NOW.CANNOT_COMPLETE_PURCHASE);
				});
			};
		}
		if (isStartOverPlayback === true) {
			log("playAsset", "playbackCompleteCallback SEND_DESCRIBE disabled");
			$N.platform.system.Preferences.set($N.app.constants.PREF_SEND_DESCRIBE, false, true);
		}
		if (playFromStart === true) {
			playVideo(playbackUrl, assetData, 0, playbackStartedCallback, true);
		} else {
			TraxisUtil.getBookmark(MDSUtil.assetDataMapper.getFilename(assetData), function (startPosition) {
				triggerPlayback = function (startOver) {
					if (startOver) {
						startPosition = 0;
					}
					playVideo(playbackUrl, assetData, startPosition, playbackStartedCallback, true);
				};
				if (startPosition > 0) {
					showStartOverResumeDialogue(assetData, triggerPlayback, isStartOverPlayback);
				} else {
					triggerPlayback(true);
				}
			});
		}

		log("playAsset", "Exit");
	}

	/**
	 * @method playTrailer
	 * @param {Object} assetData
	 * @param {Function} successCallback
	 * @param {Function} failureCallback
	 */
	function playTrailer(assetData, successCallback, failureCallback) {
		log("playTrailer", "Enter");
		var promoRef,
			trailerSuccess = function (trailerData) {
				log("playTrailer", "trailerSuccess - Enter");
				var assetId,
					playbackUrl,
					promotion,
					technical;

				if (trailerData && trailerData.promotions && trailerData.promotions.length) {
					promotion = trailerData.promotions[0];
					if (promotion.technicals && promotion.technicals.length) {
						technical = promotion.technicals[0];
						if (technical.media && technical.media.AV_EncryptedTS) {
							assetId = technical.media.AV_EncryptedTS.fileName;
						}
					}
				} else if (failureCallback) {
					failureCallback();
				}

				if (assetId) {
					playbackUrl = TraxisUtil.getPlaybackUrl(assetId);
				}

				if (playbackUrl) {
					playVideo(playbackUrl, assetData, 0, successCallback);
				}
				log("playTrailer", "trailerSuccess - Exit");
			};

		promoRef = MDSUtil.assetDataMapper.getTrailerRef(assetData);
		MDSUtil.getTrailerByTechnicalId(promoRef, trailerSuccess, failureCallback);
		log("playTrailer", "Exit");
	}

	/**
	 * @method purchaseProduct
	 * @param {Object} assetData
	 * @param {String} ticketId
	 * @param {Function} successCallback
	 * @param {Boolean} isSubscription
	 */
	function purchaseProduct(assetData, ticketId, successCallback, isSubscription) {
		var performPurchase = function () {
			TraxisUtil.purchaseProduct(ticketId, function (result) {
				if (isSubscription) {
					TraxisUtil.confirmPurchase(result.entitlementid, successCallback, function () {
						failureCallback($N.app.errorCodes.NOW.CANNOT_COMPLETE_PURCHASE);
					});
				} else {
					playAsset(assetData, result.entitlementid, successCallback, true);
				}
			}, function () {
				failureCallback($N.app.errorCodes.NOW.CANNOT_START_PURCHASE);
			});
		};
		if (ticketId) {
			if (assetData.price === "0") {
				performPurchase();
			} else {
				showPurchasePin(assetData, performPurchase, isSubscription);
			}
		} else {
			failureCallback($N.app.errorCodes.NOW.CANNOT_START_PURCHASE);
		}
	}

	/**
	 * @method subscribeToProduct
	 * @param {Object} assetData
	 * @param {String} ticketId
	 * @param {Function} successCallback
	 */
	function subscribeToProduct(assetData, ticketId, successCallback) {
		var buttonConfig;
		if (ticketId) {
			if (MDSUtil.assetDataMapper.isAvailableToSubscribe(assetData)) {
				buttonConfig = [
					{
						name: MDSUtil.getString("subscribe"),
						action: function () {
							purchaseProduct(assetData, ticketId, successCallback, true);
						}
					},
					{
						name: MDSUtil.getString("cancel")
					}
				];
				showNowDialogCallback(MDSUtil.getString("notSubscribed") + "'" + MDSUtil.assetDataMapper.getProductName(assetData) + "'", MDSUtil.assetDataMapper.getProductDescription(assetData), buttonConfig, MDSUtil.assetDataMapper.getPriceText(assetData, true));
			} else {
				buttonConfig = [
					{
						name: MDSUtil.getString("launchSubscriptionApp"),
						action: function () {
							return; // TODO: add link to external app here
						}
					},
					{
						name: MDSUtil.getString("cancel")
					}
				];
				showNowDialogCallback(MDSUtil.getString("notSubscribed") + "'" + MDSUtil.assetDataMapper.getProductName(assetData) + "'", MDSUtil.assetDataMapper.getProductDescription(assetData) + "\n" + MDSUtil.getString("externalSubscriptionMessage"), buttonConfig);
			}
		} else {
			failureCallback($N.app.errorCodes.NOW.CANNOT_START_PURCHASE);
		}
	}

	/**
	 * @method setFailureCallback
	 * @param {Function} callback
	 */
	function setFailureCallback(callback) {
		failureCallback = callback;
	}

	return {
		initialise: initialise,
		playAsset: playAsset,
		playTrailer: playTrailer,
		purchaseProduct: purchaseProduct,
		subscribeToProduct: subscribeToProduct,
		setFailureCallback: setFailureCallback
	};
}());
