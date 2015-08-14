/*global CryptoJS, JsonFormatter */
/**
 * BaseSocialActivity is a
 * @class BaseSocialActivity
 * @constructor
 * @author ravichan
 */
var $N = $N || {};
$N.app = $N.app || {};
$N.app.Social = $N.app.Social || {};

(function ($N) {
	var YES_ACTION = 0,
		NO_ACTION = 1,
		SUCCESS_STATUS_CODE = "200",
		ERROR_STATUS_CODE = "403",
		errors = {
			"dataMismatch" : "1",
			"invalidTokenCode" : "0",
			"unexpectedError" : "-1"
		},
		pinHelper = null,
		me = null,
		PIN_SETTING_NEVER = -1,
		PIN_SETTING_ALWAYS = 1,
		salt = null,
		secretKey = null;
    function BaseSocialActivity() {
		$N.apps.core.Language.adornWithGetString(BaseSocialActivity);
        this._log = new $N.apps.core.Log("Social", "BaseSocialActivity");
        this._EMAIL = "email";
        this._LINKED_DATE = "linkedDate";
		this._PROFILE_NAME = "profileName";
		this._PROFILE_IMAGE_URL = "profileImageUrl";
		this._accountAuthTip = "socialAccountAuthTip";
		this._PROFILE_ID = "profileId";
		this._ACCESS_TOKEN = "accessToken";
		this._TOKEN_RENEWAL_SCHEDULER_TIME = "timeOfRenewalSchedulerRun";
		this._PIN_SETTING = "pinSetting";
		this._MACHINE_ID = "machineId";
		this._QRCODE = "qrCode";
		this.FEATURE_AVAILABILITY = "featureAvailability";
		this._postAccountMessage = null;
		this._socialPostPinTimeout = null;
		this._accountRemovalCallback = function () {};
		this.receivedAuthCode = null;
		salt = $N.app.Config.getConfigValue($N.app.constants.SHARED_SALT);
		secretKey = $N.app.Config.getConfigValue($N.app.constants.SECRET_KEY);
		/* Current Job op state */
		this.JOB_OP_STATE = {
			JOB_OP_STATE_CREATED: 0,
			JOB_OP_STATE_CREATED_DELETING: 1,
			JOB_OP_STATE_READY: 2,
			JOB_OP_STATE_TASK_DELETING: 3,
			JOB_OP_STATE_DELETED: 4
		};
		me = this;
    }

	/**
	 * Makes a proper config key to avoid
	 * multiple entries
	 * @method getCompleteKey
	 * @param {String, String}
	 * @return {String} properly concatenated value
	 */
	BaseSocialActivity.prototype.getCompleteKey = function (accountType, key) {
		var socialConstant = $N.app.constants.SOCIAL;
		return $N.app.StringUtil.join(".", [socialConstant, accountType, key]);
	};

	/**
	 * Checks for email and decides on the
	 * availability of the account
	 * @method isAccountAvailable
	 * @return {Boolean}
	 */
	BaseSocialActivity.prototype.isAccountAvailable = function () {
		if ($N.platform.system.Preferences.get(this.getCompleteKey(this._accountType, this.FEATURE_AVAILABILITY)) && $N.platform.system.Preferences.get(this.getCompleteKey(this._accountType, this._EMAIL)) && $N.platform.system.Preferences.get(this.getCompleteKey(this._accountType, this._PROFILE_ID))) {
			return true;
		} else {
			return false;
		}
	};

	/**
	 * Sets listener that fires on removal of account
	 * @method setAccountRemovalListener
	 * @return {Boolean}
	 */
	BaseSocialActivity.prototype.setAccountRemovalListener = function (callback) {
		this._accountRemovalCallback = callback;
	};

	/**
	 * Retrieves an object of information on
	 * the social account
	 * @method getAccountInformation
	 * @param {String} key is passed in order to get only required value
	 * @return {Object} account details object
	 */
	BaseSocialActivity.prototype.getAccountInformation = function (key) {
		var informationObject = {
			"email": $N.platform.system.Preferences.get(this.getCompleteKey(this._accountType, this._EMAIL)),
			"linkedDate": $N.platform.system.Preferences.get(this.getCompleteKey(this._accountType, this._LINKED_DATE)),
			"profileName": $N.platform.system.Preferences.get(this.getCompleteKey(this._accountType, this._PROFILE_NAME)),
			"profileImageUrl": $N.platform.system.Preferences.get(this.getCompleteKey(this._accountType, this._PROFILE_IMAGE_URL))
		};
		if (key) {
			return informationObject[key];
		} else {
			return informationObject;
		}
	};


	/**
	 * Method for displaying remove account dialog box
	 * @method showDisconnectAccountDialog
	 * @param {Callback}
	 */
	BaseSocialActivity.prototype.showDisconnectAccountDialog = function (optionSelectedCallback) {
		var options = [{
				name: BaseSocialActivity.getString("yes"),
				action: YES_ACTION
			}, {
				name: BaseSocialActivity.getString("no"),
				action: NO_ACTION
			}],
			dialogue = null;
		dialogue = $N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_FACEBOOK_DISCONNECT_ACCOUNT, BaseSocialActivity.getString(this._disconnectAccountTitle), BaseSocialActivity.getString(this._disconnectAccountMessage), options, optionSelectedCallback, null, null, this._accountTitleImage);
	};

	/**
	 * Method for encrypting data before sending it to the server
	 * @method encryptRequestdData
	 * @param {string}, message string to be encrypted
	 */
	function encryptRequestdData(message) {
		var	completeMessage, // complete message to be encrypted. completeMessage is formed by adding salt to the beginning and timepstamp value to the the end of the actual message
			encryptedData, // encryptedData data after encryption of completeMessage
			timestamp = String(Date.now()),
			timestampLength = (timestamp.length <= 9) ? ("0" + timestamp.length) : timestamp.length;

		encryptedData = CryptoJS.AES.encrypt(salt + message + timestamp + timestampLength, secretKey);
		encryptedData = encodeURIComponent(encryptedData); // Needs to use this function as encryption string may contain special character like %, =, + etc
		completeMessage =  $N.app.StringUtil.join("=", ["msg", encryptedData]);
		return completeMessage;
	}

	/**
	 * Method for decrypting response data to get the actual data
	 * @method decryptResponseData
	 * @param {string}, data string to be decrypted
	 */
	function decryptResponseData(data) {
		var dataWithoutSalt,
			decryptedData, // data after AES decryption
			lengthOfTimestamp,
			decrypted_str,
			actualData; // actual data without salt and timestamp value
		// decrypt data with encrypted json string, secret key string and JsonFormatter
		decryptedData = CryptoJS.AES.decrypt(decodeURIComponent(data), secretKey, { format: JsonFormatter });
		// convert to Utf8 format unmasked data
		decrypted_str = CryptoJS.enc.Utf8.stringify(decryptedData);
		dataWithoutSalt = decrypted_str.slice(salt.length);
		lengthOfTimestamp = Number(decrypted_str.substr(-2, 2));
		actualData = $N.apps.util.JSON.parse(dataWithoutSalt.slice(0, (dataWithoutSalt.length - (lengthOfTimestamp + 2))));
		return actualData;
	}
	/**
	 * Generic method with common code to create pin entry boxes
	 * @method createPinEntry
	 * @param {Object} single configuration object with properties
	 * @private
	 */
	function createPinEntry(configObject) {
		if (!pinHelper) {
			pinHelper = new $N.app.PinHelper(configObject.successfullAuthenticationCallback, null, null, null, 0, true);
		}
		pinHelper.setDialogProperties({
			x: 0,
			y: 0,
			width: 1920,
			height: 1080,
			id: configObject.pinDialogId,
			eventImageVisibility: configObject.eventImageVisibility,
			titleImage: configObject.titleImage,
			title: configObject.title,
			description: configObject.description,
			cancelCallback: function () {
				pinHelper.hideDialog();
			},
			numberOfDigits : configObject.numberOfDigits,
			eventImageConfig: configObject.eventImageConfig,
			inProgressAppearance: configObject.inProgressAppearance
		});
		if (configObject.successfullAuthenticationCallback) {
			pinHelper.setAuthenticationSuccessCallback(configObject.successfullAuthenticationCallback);
		}
		if (configObject.okCallback) {
			pinHelper.pinDialog._dialogGUIObject.setOkCallback(configObject.okCallback);
		}
		if ($N.app.VolumeControl) {
			$N.app.VolumeControl.hide();
		}
	}

	/**
	 * Method that returns time value related to post
	 * authentication PIN setting
	 * @method getSocialPostPinSettingTimeGap
	 * @return {Number}
	 * @private
	 */
	function getSocialPostPinSettingTimeGap() {
		var pinSettingValue = $N.platform.system.Preferences.get(me.getCompleteKey(me._accountType, me._PIN_SETTING)),
			timeValue = null;
		switch (pinSettingValue) {
		case "socialPinSettingNeverRequest":
			timeValue = PIN_SETTING_NEVER;
			break;
		case "socialPinSettingAlwaysRequest":
			timeValue = PIN_SETTING_ALWAYS;
			break;
		case "socialPinSettingRequestOneHour":
			timeValue = $N.app.constants.HOUR_IN_MS;
			break;
		case "socialPinSettingRequestTwoHour":
			timeValue = $N.app.constants.HOUR_IN_MS * 2;
			break;
		case "socialPinSettingRequestThreeHour":
			timeValue = $N.app.constants.HOUR_IN_MS * 3;
			break;
		default:
			timeValue = null;
			break;
		}
		return timeValue;
	}

	/**
	 * Method that returns time value related to post
	 * authentication PIN setting
	 * @method isSocialPostAuthenticationNeeded
	 * @return {Number}
	 * @private
	 */
	function isSocialPostAuthenticationNeeded() {
		var isAuthenticationNeeded = false,
			timeValue = getSocialPostPinSettingTimeGap();
		if (timeValue && (timeValue !== PIN_SETTING_NEVER) && !me._socialPostPinTimeout) {
			isAuthenticationNeeded = true;
		}
		return isAuthenticationNeeded;
	}

	/**
	 * Method to reset the pin timer publicly
	 * @method resetPinTimer
	 */
	BaseSocialActivity.prototype.resetPinTimer = function () {
		if (me && me._socialPostPinTimeout) {
			clearTimeout(me._socialPostPinTimeout);
			me._socialPostPinTimeout = null;
		}
	};

	function resetPinTimeoutAndPost() {
		var timeValue = getSocialPostPinSettingTimeGap();
		if (timeValue && timeValue > PIN_SETTING_ALWAYS && !me._socialPostPinTimeout) {
			me._socialPostPinTimeout = setTimeout(function () {
				me.resetPinTimer();
			}, timeValue);
		}
		me.postStatusMessage();
	}

	/**
	 * Handler for button press of the post dialog box
	 * @method postAccountButtonPressHandler
	 * @param {String}
	 * @private
	 */
	function postAccountButtonPressHandler(key) {
		var configObject = null,
			isAuthenticationNeeded = isSocialPostAuthenticationNeeded();
		if (key.action === YES_ACTION && isAuthenticationNeeded) {
			configObject = {
				"successfullAuthenticationCallback" : resetPinTimeoutAndPost,
				"pinDialogId" : "socialAccountAuthentication",
				"eventImageVisibility" : false,
				"titleImage" : me._accountTitleImage,
				"title" : BaseSocialActivity.getString(me._postAccountTitle),
				"description" : BaseSocialActivity.getString("enterYourPin")
			};
			createPinEntry(configObject);
			pinHelper.showPinDialog(me._accountAuthenticationPinType, true, null, true);
		} else if (key.action === YES_ACTION && !isAuthenticationNeeded) {
			me.postStatusMessage();
		} else {
			me._log("postAccountButtonPressHandler", "No Pressed");
		}
	}

	/** will be called after 5 minutes, if there is any error to get
	 *the temporary code from NET server
	 *@method scheduleTemporaryCodeRequest
	 */
	function scheduleTemporaryCodeRequest() {
		var WAITING_TIME = $N.app.constants.MINUTE_IN_MS * 5;
		setTimeout(function () {
			me.getTemporaryCodeFromServer();
		}, WAITING_TIME);
	}

	/** success callback method while getting the temporary code from server
	 *@method temporaryCodeReceived
	 * @param{object} success response object
	 */
	function temporaryCodeReceived(data) {
		data = decryptResponseData(data);
		if (data && data.tempCode) {
			me.getLongLiveTokenFromFacebook(data.tempCode, data.appId, data.callbackUrl);
		} else if (data && data.error) {
			scheduleTemporaryCodeRequest();
		}
	}

	/** failure callback method while getting the temporary code from server
	 *@method failureCallbackForGettingTempCode
	 * @param{object} error response object
	 */
	function failureCallbackForGettingTempCode(data) {
		scheduleTemporaryCodeRequest();
	}

	/**
	 * Callback method to execute when the task occurs
	 * @method getTemporaryCodeFromServerCallback
	 */
	BaseSocialActivity.prototype.getTemporaryCodeFromServerCallback = function () {
		me.getTemporaryCodeFromServer();
	};

	/**
	 * method for contacting NET server to get the temporary code
	 * temporary code will be used to contact the FB server directly to get the log-live access token
	 * @private
	 */
	BaseSocialActivity.prototype.getTemporaryCodeFromServer = function () {
		var currentTimeInMiliseconds,
			message,
			accessToken,
			accessTokenCodeString,
			url;
		accessToken = $N.platform.system.Preferences.get(me.getCompleteKey(me._accountType, me._ACCESS_TOKEN));
		accessTokenCodeString = $N.app.StringUtil.join("=", ["accessTokenCode", accessToken]);
		message = encryptRequestdData(accessTokenCodeString);
		url = $N.app.Config.getConfigValue($N.app.constants.SOCIAL_STB_TOKEN_RENEWAL_URL);
		url = $N.app.StringUtil.join("?", [url, message]);
		if ($N.app.NetworkUtil.isUrlValid(url)) {
			$N.app.NetworkUtil.ajaxRequest(url, temporaryCodeReceived, failureCallbackForGettingTempCode);
		}
	};

	function showGenericPopup(id, popupTitle, popupMessage) {
		var dialogObjectConfig = {
				title : popupTitle,
				message : popupMessage,
				titleImage : me._accountTitleImage
			};
		$N.app.DialogueHelper.createAndShowDialogue(id, popupTitle, popupMessage, null, null, null, null, me._accountTitleImage, dialogObjectConfig);
	}

	BaseSocialActivity.prototype.showFacebookPinChangeSuccessDialog = function () {
		var popupTitle = BaseSocialActivity.getString("facebookPinChangeSuccess");
		showGenericPopup($N.app.constants.DLG_FACEBOOK_PIN_CHANGE, popupTitle, null);
	};

	BaseSocialActivity.prototype.showFacebookPinChangeFailureDialog = function () {
		var popupTitle = BaseSocialActivity.getString("errorTitle"),
			completeMessage = BaseSocialActivity.getString("facebookPinChangeFailure");
		showGenericPopup($N.app.constants.DLG_FACEBOOK_PIN_CHANGE, popupTitle, completeMessage);
	};

	BaseSocialActivity.prototype.showFacebookPinMismatchDialog = function () {
		var popupTitle = BaseSocialActivity.getString("errorTitle"),
			completeMessage = BaseSocialActivity.getString("facebookPinMismatchTip");
		showGenericPopup($N.app.constants.DLG_FACEBOOK_PIN_CHANGE, popupTitle, completeMessage);
	};

	/**
	 * Method to save the account data from NET server
	 * and saves them into configman
	 * @method saveAccountInformation
	 */
	function saveAccountInformation(data) {
		var isPropertySaved = false,
			popupTitle = BaseSocialActivity.getString("authFacebookAccountTitle"),
			completeMessage = $N.app.StringUtil.join("", [BaseSocialActivity.getString("authenticationSuccess"), "\n", "\n", BaseSocialActivity.getString("accountLinked"), BaseSocialActivity.getString("postToWall")]),
			dialogObjectConfig = null;
		isPropertySaved = $N.platform.system.Preferences.set(me.getCompleteKey(me._accountType, me._EMAIL), data.email);
		isPropertySaved = (isPropertySaved && $N.platform.system.Preferences.set(me.getCompleteKey(me._accountType, me._LINKED_DATE), data.linkedDate));
		isPropertySaved = (isPropertySaved && $N.platform.system.Preferences.set(me.getCompleteKey(me._accountType, me._PROFILE_NAME), data.profileName));
		isPropertySaved = (isPropertySaved && $N.platform.system.Preferences.set(me.getCompleteKey(me._accountType, me._PROFILE_IMAGE_URL), data.profileImageUrl));
		isPropertySaved = (isPropertySaved && $N.platform.system.Preferences.set(me.getCompleteKey(me._accountType, me._PROFILE_ID), data.profileId));
		isPropertySaved = (isPropertySaved && $N.platform.system.Preferences.set(me.getCompleteKey(me._accountType, me._ACCESS_TOKEN), data.accessToken));
		if (isPropertySaved === true) {
			dialogObjectConfig = {
				title : popupTitle,
				message : completeMessage,
				titleImage : me._accountTitleImage
			};
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_FACEBOOK_AUTHENTICATION,
				popupTitle, completeMessage, null, null, null, null, me._accountTitleImage, dialogObjectConfig);
			me.setSchedulerForTokenRenewal();
		}
	}

	function showAuthenticationErrorPopup(statusCode) {
		var popupTitle = BaseSocialActivity.getString("authFacebookAccountTitle"),
			completeMessage = $N.app.StringUtil.join("", [BaseSocialActivity.getString("authorisationError"), BaseSocialActivity.getString("errorCode"), statusCode.toString()]);
		showGenericPopup($N.app.constants.DLG_FACEBOOK_AUTHENTICATION, popupTitle, completeMessage);
	}

	/**
	 * Method to handle the success response(200) data from NET server
	 * @method handleSuccessResponse
	 */
	function handleSuccessResponse(data) {
		data = decryptResponseData(data);
		if (data.error) {
			switch (data.error.errorId) {
			case errors.invalidTokenCode:
				me.showAccountAuthorisationDialog();
				break;
			case errors.dataMismatch:
				showAuthenticationErrorPopup(SUCCESS_STATUS_CODE);
				break;
			case errors.unexpectedError:
				showAuthenticationErrorPopup(ERROR_STATUS_CODE);
				break;
			default:
				showAuthenticationErrorPopup(ERROR_STATUS_CODE);
				break;
			}
		} else {
			saveAccountInformation(data);
		}
	}

	/**
	 * Method to handle the error response(other than 200) data from NET server
	 * @method handleErrorResponse
	 */
	function handleErrorResponse(response) {
		var statusCode = (response && response.status) ? response.status : ERROR_STATUS_CODE;
		showAuthenticationErrorPopup(statusCode);
	}
	/**
	 * Method to contact the NET server for account information
	 * @method fetchAccountInformation
	 */
	BaseSocialActivity.prototype.fetchAccountInformation = function (code) {
		var url = $N.app.Config.getConfigValue($N.app.constants.SOCIAL_STB_URL),
			authenticationCodeString = $N.app.StringUtil.join("=", ["authenticationCode", code]),
			message = encryptRequestdData(authenticationCodeString);
		url = $N.app.StringUtil.join("?", [url, message]);
		if ($N.app.NetworkUtil.isUrlValid(url)) {
			$N.app.NetworkUtil.ajaxRequest(url, handleSuccessResponse, handleErrorResponse);
		}
	};

	/**
	 * callback method to execute on getting the response back from the server
	 * and set facebook feature availability status based on the response
	 * @method successResponseCallback
	 */
	function successResponseCallback(data) {
		data = decryptResponseData(data);
		if (!data.status) {
			if (me.isAccountAvailable() === true) {
				me.disconnectAccount();
			}
			$N.platform.system.Preferences.set($N.app.constants.SOCIAL_FACEBOOK_FEATURE_AVAILABILITY, false);
		} else {
			if ($N.platform.system.Preferences.get($N.app.constants.SOCIAL_FACEBOOK_FEATURE_FORCE_DISABLE) === "true") {
				$N.platform.system.Preferences.set($N.app.constants.SOCIAL_FACEBOOK_FEATURE_AVAILABILITY, false);
			} else {
				$N.platform.system.Preferences.set($N.app.constants.SOCIAL_FACEBOOK_FEATURE_AVAILABILITY, true);
			}
		}
	}

	/**
	 * callback method to execute on failure from the server
	 * and set facebook feature disabled
	 * @method failureCallback
	 */
	function failureCallback(respose) {
		$N.platform.system.Preferences.set($N.app.constants.SOCIAL_FACEBOOK_FEATURE_AVAILABILITY, false);
	}

	/**
	 * Method to contact the NET server to know facebook enabled status for STB
	 * @method getFbEnabledStatus
	 */
	BaseSocialActivity.prototype.getSocialFeatureAvailabilityStatus = function () {
		var currentTimeInMiliseconds,
			message,
			url;
		$N.platform.system.Preferences.set($N.app.constants.TIME_OF_FACEBOOK_SCHEDULER_RUN, String(Date.now()));
		url = $N.app.Config.getConfigValue($N.app.constants.SOCIAL_STB_URL);
		message = encryptRequestdData("statuscheck");
		url = $N.app.StringUtil.join("?", [url, message]);
		if ($N.app.NetworkUtil.isUrlValid(url)) {
			$N.app.NetworkUtil.ajaxRequest(url, successResponseCallback, failureCallback);
		}
	};

	/**
	 * Method to set scheduler which will create a daily basis task to
	 * contact the server to check if FB feature is enabled or disabled
	 * @method setFeatureAvailabilityScheduler
	 */
	BaseSocialActivity.prototype.setFeatureAvailabilityScheduler = function () {
		$N.app.Reminders.setDailyScheduler($N.app.constants.FACEBOOK_FEATURE_AVAILABILITY_SCHEDULER_TITLE,
			 $N.app.Config.getConfigValue($N.app.constants.SOCIAL_STB_URL), $N.app.constants.TIME_OF_FACEBOOK_SCHEDULER_RUN, this.getSocialFeatureAvailabilityStatus);
	};

	/**
	 * Callback method to execute when the task occurs
	 * @method facebookFeatureAvailabilityCallback
	 */
	BaseSocialActivity.prototype.facebookFeatureAvailabilityCallback = function () {
		me.getSocialFeatureAvailabilityStatus();
	};
	/**
	 * Handler for button press of the account authorisation dialog box
	 * @method accountAuthButtonPressHandler
	 * @param {String}
	 * @private
	 */
	function accountAuthButtonPressHandler(key) {
		var configObject = null;
		if (key && key.action === $N.app.constants.YES_OPTION) {
			me.fetchAccountInformation(me.receivedAuthCode);
		}
	}

	/**
	 * Method that returns a modified URL for a
	 * bigger profile picture
	 * @method getBiggerImageUrl
	 * @param {String} URL of profile picture
	 * @private
	 */
	function getBiggerImageUrl(url) {
		if (url.slice(-7) === "picture") {
			url = $N.app.StringUtil.join("", [url, "?height=126&width=126"]);
		}
		return url;
	}

	/**
	 * Method that returns configuration for post dialog
	 * @method getPostDialogObjectConfig
	 * @param {Object} object of class BaseSocialActivity
	 * @private
	 */
	function getPostDialogObjectConfig(me) {
		var linkedDateText = $N.platform.system.Preferences.get(me.getCompleteKey(me._accountType, me._LINKED_DATE)),
			linkedDateTextArray = null,
			month = null,
			monthShortText = null,
			yearText = null,
			modifiedLinkedDateText = null;
		if (linkedDateText) {
			linkedDateTextArray = linkedDateText.split("/");
			if (linkedDateTextArray.length === 3) {
				month = parseInt(linkedDateTextArray[1], 10);
				monthShortText = BaseSocialActivity.getString("shortMonths")[month - 1];
				yearText = $N.app.StringUtil.join("", ["20", linkedDateTextArray[2]]);
				modifiedLinkedDateText = $N.app.StringUtil.join(" ", [linkedDateTextArray[0], monthShortText, yearText]);
			}
		}
		return {
			"alertImage" : {
				x: 1668,
				y: 281,
				width: 126,
				height: 126,
				href: getBiggerImageUrl($N.platform.system.Preferences.get(me.getCompleteKey(me._accountType, me._PROFILE_IMAGE_URL))),
				opacity: 1,
				visible: true
			},
			"alertImageTextConfig" : {
				"x" : 643.5,
				"y" : 267.5,
				"text" : $N.platform.system.Preferences.get(me.getCompleteKey(me._accountType, me._PROFILE_NAME)),
				"width" : 1000,
				"visible": true,
				"cssClass": "messageListItemTitle rightAlign"
			},
			"alertImageSubTextConfig" : {
				"x" : 645,
				"y" : 314,
				"text" : $N.app.StringUtil.join("\n", [
					$N.app.StringUtil.join(" ", [BaseSocialActivity.getString("socialAccountLinkedDateText"),
						BaseSocialActivity.getString("since")]),
					modifiedLinkedDateText
				]),
				"width" : 1000,
				"visible": true,
				"cssClass": "nowAssetInfoSubtitle rightAlign"
			},
			"alertImageBackground" : {
				"imagePadding": 4.5,
				"backgroundConfig": {
					"cssClass": "progressBarInner",
					"rounding": 2,
					"visible": true
				}
			}
		};
	}

	function showPostDialogForEvent(event, me, options) {
		var eventTitle = event.title,
			isFutureEvent = (event && event.startTime && (event.startTime > Date.now())),
			startDateObj = null,
			dayString = null,
			monthString = null,
			timeString = null,
			startString = BaseSocialActivity.getString("postAccountMessageCurrentEventStart"),
			endString = BaseSocialActivity.getString("postAccountMessageEnd"),
			whenString = null,
			channelNumber = null,
			dayNumber = null,
			dialogue = null,
			MESSAGE_LENGTH_THRESHOLD = 58,
			dialogObjectConfig = getPostDialogObjectConfig(me);
		if (isFutureEvent) {
			startString = BaseSocialActivity.getString("postAccountMessageFutureEventStart");
			startDateObj = new Date(event.startTime);
			dayNumber = $N.app.GeneralUtil.padNumberWithZeroes(startDateObj.getDate(), 2).toString();
			dayString = $N.app.DateTimeUtil.getString("days")[startDateObj.getDay()];
			monthString = $N.app.DateTimeUtil.getString("shortMonths")[startDateObj.getMonth() + 1];
			channelNumber = $N.platform.btv.EPG.getChannelByServiceId(event.serviceId).logicalChannelNum.toString();
			whenString = $N.app.StringUtil.join(" ", [$N.app.StringUtil.join("", [BaseSocialActivity.getString("when"), ":"]),
													dayString,
													dayNumber,
													monthString,
													BaseSocialActivity.getString("at").trim(),
													$N.app.DateTimeUtil.getFormattedTimeString(startDateObj),
													BaseSocialActivity.getString("on").toLowerCase(),
													BaseSocialActivity.getString("menuAutoTuneChannel").toLowerCase(),
													channelNumber]);
			endString = $N.app.StringUtil.join("\n", [endString, whenString]);
			endString = $N.app.StringUtil.join("", [endString, "."]);
			if ((startString.length + eventTitle.length) > MESSAGE_LENGTH_THRESHOLD) {
				endString = endString + "\n";
			}
		} else {
			me._log("showPostDialogForEvent", "Live event");
		}
		eventTitle = $N.app.StringUtil.join("", ["\"", eventTitle, " ", $N.app.epgUtil.getSeasonEpisodeShort(event), "\""]);
		me._postAccountMessage = $N.app.StringUtil.join(" ", [startString, eventTitle, endString]);
		dialogObjectConfig.message = me._postAccountMessage;
		dialogObjectConfig.titleImage = me._accountTitleImage;
		dialogue = $N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_FACEBOOK_POST_ACCOUNT, BaseSocialActivity.getString(me._postAccountTitle), me._postAccountMessage, options, postAccountButtonPressHandler, null, "HORIZONTAL", me._accountTitleImage, dialogObjectConfig);
	}

	function showPostDialogForNOW(event, me, options) {
		var eventTitle = event.title,
			startString = BaseSocialActivity.getString("postAccountMessageCurrentEventStart"),
			endString = BaseSocialActivity.getString("postAccountMessageNOWEnd"),
			dialogue = null,
			controls = null,
			dialogObjectConfig = getPostDialogObjectConfig(me);
		eventTitle = $N.app.StringUtil.join("", ["\"", eventTitle, "\""]);
		me._postAccountMessage = $N.app.StringUtil.join(" ", [startString, eventTitle, endString]);
		$N.app.DialogueHelper.createAndShowDialog(
			$N.app.constants.DLG_FACEBOOK_POST_ACCOUNT,
			BaseSocialActivity.getString(me._postAccountTitle),
			me._postAccountMessage,
			options,
			postAccountButtonPressHandler,
			null,
			me._accountTitleImage,
			dialogObjectConfig,
			null,
			null,
			$N.gui.NowConfirmationDialog
		);
	}

	function showPostDialogForRecording(event, me, options) {
		var eventTitle = event.title,
			startString = BaseSocialActivity.getString("postAccountMessageRecordingStart"),
			endString = BaseSocialActivity.getString("postAccountMessageRecordingEnd"),
			dialogue = null,
			dialogObjectConfig = getPostDialogObjectConfig(me);
		eventTitle = $N.app.StringUtil.join("", ["\"", eventTitle, "\""]);
		me._postAccountMessage = $N.app.StringUtil.join(" ", [startString, eventTitle, endString]);
		dialogObjectConfig.message = me._postAccountMessage;
		dialogObjectConfig.titleImage = me._accountTitleImage;
		dialogue = $N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_FACEBOOK_POST_ACCOUNT, BaseSocialActivity.getString(me._postAccountTitle), me._postAccountMessage, options, postAccountButtonPressHandler, null, "HORIZONTAL", me._accountTitleImage, dialogObjectConfig);
	}

	/**
	 * Method to display the post message dialog box
	 * @method showPostToSocialAccountDialog
	 * @param {String}
	 */
	BaseSocialActivity.prototype.showPostToSocialAccountDialog = function (event, eventType) {
		var options = [{
				name: BaseSocialActivity.getString("yes"),
				action: YES_ACTION
			}, {
				name: BaseSocialActivity.getString("no"),
				action: NO_ACTION
			}];
		me = this;
		if (this.isAccountAvailable() === true && event) {
			switch (eventType.toLowerCase()) {
			case "now":
				showPostDialogForNOW(event, me, options);
				break;
			case "pvr":
				showPostDialogForRecording(event, me, options);
				break;
			case "epg":
				showPostDialogForEvent(event, me, options);
				break;
			default:
				this._log("showPostToSocialAccountDialog", "Invalid event type");
				break;
			}
		}
	};

	/**
	 * Method to check if post option is valid
	 * based on event details and its status
	 * @method isPostOptionValid
	 * @param {Object} event object
	 */
	BaseSocialActivity.prototype.isPostOptionValid = function (event) {
		var isCurrentlyShowingEvent = $N.app.EventUtil.isEventShowingNow(event),
			isFutureEvent = (event && event.startTime && event.startTime > Date.now()),
			currentServiceId = $N.app.epgUtil.getChannelFromPrefs();
		return ((isCurrentlyShowingEvent && (event.serviceId === currentServiceId)) || isFutureEvent);
	};

	/**
	 * Method to display the account authorisation dialog box
	 * @method showAccountAuthorisationDialog
	 * @param {String}
	 */
	BaseSocialActivity.prototype.showAccountAuthorisationDialog = function () {
		var title = BaseSocialActivity.getString(this._accountAuthTitle),
			message = $N.app.StringUtil.join("", [BaseSocialActivity.getString(this._accountAuthMessage), "\n", BaseSocialActivity.getString(this._accountAuthTip)]),
			timerMessage = BaseSocialActivity.getString(this._timerMessage),
			qrCode = $N.platform.system.Preferences.get(this.getCompleteKey(this._accountType, this._QRCODE)) || "customise/resources/images/%RES/icons/qrcode.png",
			authCodeFetchUrl = $N.platform.system.Preferences.get($N.app.constants.SOCIAL_STB_AUTH_CODE_FETCH_URL) || "http://10.12.128.75:3008/authenticationCode";
		if ($N.app.NetworkUtil.isUrlValid(authCodeFetchUrl)) {
			$N.app.NetworkUtil.ajaxRequest(
				authCodeFetchUrl,
				function (data) {
					var buttonHandler = null;
					data = decryptResponseData(data);
					me.receivedAuthCode = data.authCode;
					$N.app.DialogueHelper.showSocialAccountAuthorisationDialog(title, message, accountAuthButtonPressHandler, me._accountTitleImage, data.authCode, timerMessage, qrCode, null);
				},
				function (response) {
					var statusCode = (response && response.status) ? response.status : ERROR_STATUS_CODE;
					showAuthenticationErrorPopup(statusCode);
				}
			);
		}
	};

	/**
	 * Method to handle button press of
	 * OAuth error dialog box
	 * @method oAuthErrorHandler
	 * @param {Object} key object that was pressed
	 */
	function oAuthErrorHandler(key) {
		if (key.action === YES_ACTION) {
			me.showAccountAuthorisationDialog();
		}
	}

	/**
	 * Method to handle button press of
	 * OAuth error dialog box
	 * @method showOAuthErrordialog
	 * @param {Object} ajax request response object
	 */
	BaseSocialActivity.prototype.showOAuthErrordialog = function (response) {
		var responseTxtObj = $N.apps.util.JSON.parse(response.responseText),
			options = [{
				name: BaseSocialActivity.getString("yes"),
				action: YES_ACTION
			}, {
				name: BaseSocialActivity.getString("no"),
				action: NO_ACTION
			}],
			dialogue = null;
		if (response.status === 400 && responseTxtObj.error.type === "OAuthException") {
			this.disconnectAccount();
			dialogue = $N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_FACEBOOK_AUTH_ERROR, BaseSocialActivity.getString(this._oAuthErrorTitle), BaseSocialActivity.getString(this._oAuthErrorMessage), options, oAuthErrorHandler, null, null, this._accountTitleImage);
		}
	};

	/**
	 * Deletes account information from the configman
	 * @method disconnectAccount
	 * @return {Boolean}
	 */
	BaseSocialActivity.prototype.disconnectAccount = function () {
		var isPropertyDeleted = false,
			sourceURL = $N.app.Config.getConfigValue($N.app.constants.SOCIAL_STB_TOKEN_RENEWAL_URL),
			tokenJobQuery,
			resultSet,
			jobId;
		isPropertyDeleted = $N.platform.system.Preferences.deletePreference(this.getCompleteKey(this._accountType, this._EMAIL));
		isPropertyDeleted = (isPropertyDeleted && $N.platform.system.Preferences.deletePreference(this.getCompleteKey(this._accountType, this._LINKED_DATE)));
		isPropertyDeleted = (isPropertyDeleted && $N.platform.system.Preferences.deletePreference(this.getCompleteKey(this._accountType, this._PROFILE_NAME)));
		isPropertyDeleted = (isPropertyDeleted && $N.platform.system.Preferences.deletePreference(this.getCompleteKey(this._accountType, this._PROFILE_IMAGE_URL)));
		isPropertyDeleted = (isPropertyDeleted && $N.platform.system.Preferences.deletePreference(this.getCompleteKey(this._accountType, this._PROFILE_ID)));
		isPropertyDeleted = (isPropertyDeleted && $N.platform.system.Preferences.deletePreference(this.getCompleteKey(this._accountType, this._ACCESS_TOKEN)));
		isPropertyDeleted = (isPropertyDeleted && $N.platform.system.Preferences.deletePreference(this.getCompleteKey(this._accountType, this._TOKEN_RENEWAL_SCHEDULER_TIME)));
		// To delete the job created for getting new token within 25 days time period
        tokenJobQuery = "sourceURL= '" + sourceURL + "'" + " AND jobOpState = " + me.JOB_OP_STATE.JOB_OP_STATE_READY;
        resultSet = $N.platform.btv.PVRManager.getJobByQuery(tokenJobQuery, "startTime");
        if (resultSet.length > 0 && resultSet[0] && resultSet[0]._data) {
	        jobId = resultSet[0]._data.jobId;
	        $N.platform.btv.PVRManager.deleteJob(jobId);
        }
		if (this._accountRemovalCallback && typeof (this._accountRemovalCallback) === "function") {// fires a function set to happen whenever a social account is deleted
			this._accountRemovalCallback();
		}
		return isPropertyDeleted;
	};

    $N.app.Social.BaseSocialActivity = BaseSocialActivity;
}($N || {}));
