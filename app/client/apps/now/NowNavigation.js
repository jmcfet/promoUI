/**
 * NowNavigation is a class used to keep track of and request further navigation wihin the NOW app
 * As a user navigates the server, content information is requested here and passed back to Now.js
 * so it can be displayed
 * @class $N.app.NowNavigation
 * @constructor
 */
var $N = window.parent.$N;
$N.app.NowNavigation = (function () {
	var log = new $N.apps.core.Log("NOW", "NowNavigation"),
		folderPath = [],
		failureCallback = function () {},
		masterPane,
		slavePane,
		masterInFocus = true,
		pinHelper,
		supplementaryCategoryData = {},
		errorDialogKeyHandler = function () {},
		assetRatingPinEntryFlag = false,
		assetAdultPinEntryFlag = false;

	/**
	 * @method setSupplementaryCategoryData
	 * @param {Object} data
	 */
	function setSupplementaryCategoryData(data) {
		supplementaryCategoryData = data;
	}

	/**
	 * @method getAugmentData
	 * @return {Object}
	 */
	function getAugmentData(folderName) {
		var categoryData,
			dataType = $N.app.MDSUtil.CONTENT_TYPE.ASSETS;
		categoryData = supplementaryCategoryData[folderName];
		if (categoryData) {
			if (categoryData.isClube) {
				dataType = $N.app.MDSUtil.CONTENT_TYPE.CLUBE;
			}
			return {
				data: categoryData,
				type: dataType
			};
		}
		return null;
	}

	/**
	 * @method getDataForPane
	 * @param {Number} contentID
	 * @param {Object} pane
	 * @param {Function} successCallback
	 * @param {Object} hasChildren - does the node have children
	 * @param {Boolean} forceRequest - do we need to get the data anyway (root nodes)
	 */
	function getDataForPane(contentID, pane, successCallback, hasChildren, forceRequest) {
		var augmentData;
		if (forceRequest || contentID !== pane.contentUID) {
			augmentData = getAugmentData(contentID);
			$N.app.MDSUtil.getContent(contentID, successCallback, failureCallback, augmentData, hasChildren);
		} else {
			successCallback({
				type: null,
				content: null
			});
		}
	}

	/**
	 * @method navigationCompleteCallback
	 * @param {Object} targetInfo
	 * @param {Object} dataObject
	 * @param {Function} successCallback
	 */
	function navigateDeeperCallback(targetInfo, dataObject, successCallback) {
		masterInFocus = !masterInFocus;
		folderPath.push(targetInfo.id);
		successCallback(targetInfo, dataObject);
	}

	/**
	 * @method navigateBackCallback
	 * @param {Object} dataObject
	 * @param {Function} successCallback
	 * @param {Object} parentDataObject
	 */
	function navigateBackCallback(dataObject, successCallback, parentDataObject) {
		var folderDepth,
			previousContentID = folderPath[folderPath.length - 1];
		masterInFocus = !masterInFocus;
		folderPath.pop();
		folderDepth = folderPath.length;
		successCallback(previousContentID, folderPath[folderDepth - 1], folderPath[folderDepth - 2], dataObject, parentDataObject);
	}

	/**
	 * @method isTargetAdult
	 * @param {object} targetInfo
	 * @return {Boolean}
	 */
	function isTargetAdult(targetInfo) {
		// TODO: When the isAdult flag is available use that instead of age rating - done for 5680
		return $N.app.MDSUtil.assetDataMapper.isAdult(targetInfo);
	}

	/**
	 * @method isAdultCategory
	 * @param {object} targetInfo
	 * @return {Boolean}
	 */
	function isAdultCategory(targetInfo) {
		var assetRating = $N.app.MDSUtil.assetDataMapper.getRatingValue(targetInfo);
		return (assetRating >= $N.app.ParentalControlUtil.PARENTAL_RATING_ADULT_VALUE);
	}

	/**
	 * @method isTargetLocked
	 * @private
	 * @param {object} targetInfo
	 * @return {Boolean}
	 */
	function isTargetLocked(targetInfo) {
		var assetRating = $N.app.MDSUtil.assetDataMapper.getRatingValue(targetInfo);
		return (assetRating > $N.app.SettingsAPI.getMoralityLevel());
	}

	/**
	 * @method isTargetLockedAsAdult
	 * @private
	 * @param {object} targetInfo
	 * @return {Boolean}
	 */
	function isTargetLockedAsAdult(targetInfo) {
		return (isTargetAdult(targetInfo) && !$N.platform.ca.ParentalControl.isCurrentUserMaster());
	}

	/**
	 * @method showPinEntry
	 * @param {Function} pinSuccessCallback - Callback for successful PIN entry
	 * @param {Function} pinCancelCallback - Callback if the user cancels PIN entry
	 * @private
	 */
	function showPinEntry(pinSuccessCallback, pinCancelCallback) {
		pinHelper.setAuthenticationSuccessCallback(function () {
			setTimeout(pinSuccessCallback, 1); // TODO: timeout 1 required to ensure masterPin is fully processed before success
		});
		pinHelper.setAuthenticationCancelCallback(pinCancelCallback);
		pinHelper.customiseDialog({
			title: $N.app.MDSUtil.getString("enterPasswordToUnblockAsset"),
			description: ""
		});
		pinHelper.showPinDialog("master", true);
	}

	/**
	 * @method getFocusPane
	 * @return {Object}
	 */
	function getFocusPane() {
		if (masterInFocus) {
			return masterPane;
		} else {
			return slavePane;
		}
	}

	/**
	 * @method getDefocusPane
	 * @return {Object}
	 */
	function getDefocusPane() {
		if (masterInFocus) {
			return slavePane;
		} else {
			return masterPane;
		}
	}

	/**
	 * @method initialise
	 * @param {Object} master
	 * @param {Object} slave
	 * @param {Object} pinEntry
	 */
	function initialise(master, slave, pinEntry) {
		masterPane = master;
		slavePane = slave;
		pinHelper = pinEntry;
	}

	/**
	 * @method reset
	 * @param {Function} successCallback
	 */
	function reset(successCallback) {
		log("reset", "Enter");
		folderPath = [null];
		masterInFocus = true;
		getDataForPane(null, masterPane, successCallback, false, true);
		log("reset", "Exit");
	}

	/**
	 * @method showFullAssetInfo
	 * @param {Object} activationObject
	 * @param {Function} successCallback
	 */
	function showFullAssetInfo(activationObject, successCallback) {
		log("showFullAssetInfo", "Enter");
		if ((isTargetAdult(activationObject) && !assetAdultPinEntryFlag)
				|| (!isTargetAdult(activationObject) && isTargetLocked(activationObject) && !assetRatingPinEntryFlag)) {
			showPinEntry(function () {
				if (isTargetAdult(activationObject)) {
					assetAdultPinEntryFlag = true;
				} else {
					assetRatingPinEntryFlag = true;
				}
				successCallback(activationObject);
			});
		} else {
			successCallback(activationObject);
		}
		log("showFullAssetInfo", "Exit");
	}

	/**
	 * @method playbackCheck
	 * @param {Object} activationObject
	 * @param {Function} successCallback
	 */
	function playbackCheck(activationObject, successCallback) {
		log("playbackCheck", "Enter");
		$N.app.PVRUtil.checkResources(
			$N.app.PVRUtil.VOD_PLAYBACK_CONFLICT,
			function () {
				successCallback(activationObject);
			}
		);
		log("playbackCheck", "Exit");
	}

	/**
	 * @method confirmPlaybackPermissions
	 * @param {Object} activationObject
	 * @param {Function} successCallback
	 */
	function confirmPlaybackPermissions(activationObject, successCallback) {
		log("confirmPlaybackPermissions", "Enter");
		var isCatchUpOrStartOver = activationObject && activationObject.type && (activationObject.type === $N.app.constants.VOD_ASSET_TYPE.CATCHUP || activationObject.type === $N.app.constants.VOD_ASSET_TYPE.STARTOVER),
			isLocked = isCatchUpOrStartOver ? $N.app.ParentalControlUtil.isChannelOrProgramLocked(activationObject) : false;
		if (isLocked) {
			showPinEntry(function () {
				playbackCheck(activationObject, successCallback);
			});
		} else {
			playbackCheck(activationObject, successCallback);
		}
		log("confirmPlaybackPermissions", "Exit");
	}

	/**
	 * @method directToAssetFailureCallback
	 */
	function directToAssetFailureCallback() {
		var errorText = $N.app.MDSUtil.getString("assetNotFoundText"),
			errorTitle = $N.app.MDSUtil.getString("assetNotFoundTitle"),
			errorCode = $N.app.errorCodes.NOW.MDS_ASSET_NOT_FOUND,
			buttonConfig = [
				{
					name: $N.app.MDSUtil.getString("cancel")
				}
			];
		$N.app.DialogueHelper.showNowDialog(errorTitle, errorText, buttonConfig, null, errorCode, errorDialogKeyHandler);
	}

	/**
	 * @method jumpToContent
	 * @param {Object} activationObject
	 * @param {Function} successCallback
	 */
	function jumpToContent(activationObject, successCallback) {
		log("jumpToContent", "Enter");
		var assetCountCallback = function (assetCount) {
			var hasChildren = (assetCount === 0);
			getDataForPane(folderPath[folderPath.length - 1], getFocusPane(), function (dataObject) {
				if (masterInFocus) {
					successCallback(activationObject, dataObject);
				} else {

					getDataForPane(folderPath[folderPath.length - 2], masterPane, function (parentDataObject) {
						successCallback(activationObject, dataObject, parentDataObject);
					}, false);
				}
			}, hasChildren ? true : false, true);
		};
		$N.apps.util.EventManager.fire("mdsContentLoading", true);
		if (activationObject.directToAsset) {
			folderPath = [];
			$N.services.sdp.VOD.getDetailedAssetByUid(activationObject.target, successCallback, directToAssetFailureCallback);
		} else {
			folderPath = activationObject.idPath.slice(0);
			if (folderPath.length % 2) {
				masterInFocus = true;
			} else {
				masterInFocus = false;
			}
			$N.app.MDSUtil.getNodeAssetCount(folderPath[folderPath.length - 1], assetCountCallback);
		}
		log("jumpToContent", "Exit");
	}

	/**
	 * @method previewNext
	 * @param {Object} targetInfo
	 * @param {Function} successCallback
	 */
	function previewNext(targetInfo, successCallback) {
		log("previewNext", "Enter");
		var hasChildren =  targetInfo.children && targetInfo.children.length > 0 ? true : false;
		getDataForPane(targetInfo.id, getDefocusPane(), function (dataObject) {
			successCallback(targetInfo, dataObject);
		}, hasChildren);
		log("previewNext", "Exit");
	}

	/**
	 * @method navigateDeeper
	 * @param {Object} targetInfo
	 * @param {Function} successCallback
	 * @param {Function} cancelCallback - Called when navigating deeper is canceled (PIN not entered)
	 */
	function navigateDeeper(targetInfo, successCallback, cancelCallback) {
		log("navigateDeeper", "Enter");
		var hasChildren = targetInfo.children && targetInfo.children.length > 0 ? true : false;
		if (isAdultCategory(targetInfo)) {
			showPinEntry(function () {
				assetAdultPinEntryFlag = true;
				getDataForPane(targetInfo.id, getDefocusPane(), function (dataObject) {
					navigateDeeperCallback(targetInfo, dataObject, successCallback);
				}, hasChildren);
			}, cancelCallback);
		} else {
			getDataForPane(targetInfo.id, getDefocusPane(), function (dataObject) {
				navigateDeeperCallback(targetInfo, dataObject, successCallback);
			}, hasChildren);
		}
		log("navigateDeeper", "Exit");
	}

	/**
	 * @method navigateBack
	 * @param {Function} successCallback
	 */
	function navigateBack(successCallback) {
		log("navigateBack", "Enter");
		getDataForPane(folderPath[folderPath.length - 2], getDefocusPane(), function (dataObject) {
			if (masterInFocus) {
				getDataForPane(folderPath[folderPath.length - 3], masterPane, function (parentDataObject) {
					navigateBackCallback(dataObject, successCallback, parentDataObject);
				}, true);
			} else {
				navigateBackCallback(dataObject, successCallback);
			}
		}, true);
		log("navigateBack", "Exit");
	}

	/**
	 * @method setFailureCallback
	 * @param {Function} callback
	 */
	function setFailureCallback(callback) {
		failureCallback = callback;
	}

	/**
	 * @method setErrorDialogKeyHandler
	 * @param {Function} callback
	 */
	function setErrorDialogKeyHandler(callback) {
		errorDialogKeyHandler = callback;
	}

	/**
	 * @method getDepth
	 * @return {Number} depth
	 */
	function getDepth() {
		return folderPath.length;
	}

	/**
	 * @method getDepth
	 * @return {Number} depth
	 */
	function isMasterInFocus() {
		return masterInFocus;
	}

	return {
		setSupplementaryCategoryData: setSupplementaryCategoryData,
		getFocusPane: getFocusPane,
		getDefocusPane: getDefocusPane,
		initialise: initialise,
		reset: reset,
		showFullAssetInfo: showFullAssetInfo,
		confirmPlaybackPermissions: confirmPlaybackPermissions,
		jumpToContent: jumpToContent,
		previewNext: previewNext,
		navigateDeeper: navigateDeeper,
		navigateBack: navigateBack,
		setFailureCallback: setFailureCallback,
		setErrorDialogKeyHandler: setErrorDialogKeyHandler,
		getDepth: getDepth,
		isMasterInFocus: isMasterInFocus,
		navigateDeeperCallback: navigateDeeperCallback,
		setAssetRatingPinEntryFlag : function (flag) {
			assetRatingPinEntryFlag = flag;
		},
		setAssetAdultPinEntryFlag : function (flag) {
			assetAdultPinEntryFlag = flag;
		}
	};
}());
