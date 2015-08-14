/**
 * FacebookActivity is a concrete implementation of BaseSocialActivity and
 * allows playback of audio files
 * @class FacebookActivity
 * @constructor
 * @extends BaseSocialActivity
 * @author ravichan
 */
var $N = $N || {};
$N.app = $N.app || {};
$N.app.Social = $N.app.Social || {};

(function ($N) {
	var TOKEN_RENEWAL_INTERVAL = 25,
		proto = null,
		me = null;
	function FacebookActivity() {
		$N.apps.core.Language.adornWithGetString(FacebookActivity);
		this._log = new $N.apps.core.Log("Social", "FacebookActivity");
		this._accountType = $N.app.SocialAccount.FACEBOOK;
		this._disconnectAccountTitle = "disconnectFacebookAccountTitle";
		this._disconnectAccountMessage = "disconnectFacebookAccountMessage";
		this._postAccountTitle = "postFacebookAccountTitle";
		this._oAuthErrorTitle = "errorTitle";
		this._accountTitleImage = "customise/resources/images/%RES/icons/fb_icon.png";
		this._accountAuthenticationPinType = $N.app.SocialAccount.FACEBOOK;
		this._accountAuthTitle = "authFacebookAccountTitle";
		this._accountAuthMessage = "authFacebookAccountMessage";
		this._oAuthErrorMessage = "facebookOAuthErrorMessage";
		this._accountAuthUrl = "authFacebookAccountUrl";
		this._accountAuthorisationPinType = "facebookAuthorisation";
		this._timerMessage = "facebokTimerMessage";
		this.receivedAuthCode = null;
		/* Current Job op state */
		this.JOB_OP_STATE = {
			JOB_OP_STATE_CREATED: 0,
			JOB_OP_STATE_CREATED_DELETING: 1,
			JOB_OP_STATE_READY: 2,
			JOB_OP_STATE_TASK_DELETING: 3,
			JOB_OP_STATE_DELETED: 4
		};
		FacebookActivity.superConstructor.call(this);
		me = this;
	}
	$N.apps.util.Util.extend(FacebookActivity, $N.app.Social.BaseSocialActivity);

	proto = FacebookActivity.prototype;

	/** will be called after 5 minutes, if there is any error to get 
	 *the long live access token from Facebook
	 *@method reCallToFbServerInFailureCase
	 */
	function reCallToFbServerInFailureCase(tempCode) {
		var WAITING_TIME = $N.app.constants.MINUTE_IN_MS * 5;
		setTimeout(function () {
			me.getLongLiveTokenFromFacebook(tempCode);
		}, WAITING_TIME);
	}

	/** success callback method while getting the long live code from server 
	 *@method successCallbackWhileGettingLongLiveToken
	 * @param{object} success response object
	 * @param{string} tempCode temporary code returned from NET server
	 */
	function successCallbackWhileGettingLongLiveToken(response, tempCode, appId, redirectUri) {
		response = JSON.parse(response);
		if (response && response.access_token) {
			$N.platform.system.Preferences.set(me.getCompleteKey(me._accountType, me._MACHINE_ID), response.machine_id);
			// Replace the old access token with the new one
			$N.platform.system.Preferences.set(me.getCompleteKey(me._accountType, me._ACCESS_TOKEN), response.access_token);
			$N.platform.system.Preferences.set($N.app.constants.TIME_OF_FACEBOOK_RENEWAL_SCHEDULER_RUN, String(Date.now()));
		} else {
			reCallToFbServerInFailureCase(tempCode, appId, redirectUri);
		}
	}

	/**failure callback method while getting the long live code from server 
	 * @method failureCallbackWhileGettingLongLiveToken
	 * @param{object} success response object
	 * @param{string} tempCode temporary code returned from NET server
	 */
	function failureCallbackWhileGettingLongLiveToken(response, tempCode, appId, redirectUri) {
		reCallToFbServerInFailureCase(tempCode, appId, redirectUri);
	}

	/**method to get the long live access token from facebook
	 * @method getLongLiveTokenFromFacebook
	 * @param{string} tempCode temporary code returned from NET server
	 */
	proto.getLongLiveTokenFromFacebook = function (tempCode, appId, redirectUri) {
		var url = $N.app.Config.getConfigValue("social.facebook.graph.url"),
			messageString = null,
			tempCodeQueryString = null,
			appIdQueryString = null,
			redirectUriQueryString = null,
			machineIdQueryString = "",
			machineId = null,
			xmlhttp = null,
			message = null;
		url = url + "/oauth/access_token";
		tempCodeQueryString = $N.app.StringUtil.join("=", ["code", tempCode]);
		appIdQueryString = $N.app.StringUtil.join("=", ["&client_id", appId.toString()]);
	    redirectUriQueryString = $N.app.StringUtil.join("=", ["&redirect_uri", redirectUri]);
	    if ($N.platform.system.Preferences.get(me.getCompleteKey(me._accountType, me._MACHINE_ID))) {
			machineId = $N.platform.system.Preferences.get(me.getCompleteKey(me._accountType, me._MACHINE_ID));
			machineIdQueryString = $N.app.StringUtil.join("=", ["&machine_id", machineId]);
		}
	    url = $N.app.StringUtil.join("?", [url, tempCodeQueryString + appIdQueryString + redirectUriQueryString + machineIdQueryString]);
	    if ($N.app.NetworkUtil.isUrlValid(url)) {
			xmlhttp = new $N.apps.core.AjaxHandler();
			xmlhttp.setResponseCallback(function (response) {
				if (!response || response.status !== 200) {
					if (response) {
						failureCallbackWhileGettingLongLiveToken(response, tempCode, appId, redirectUri);
					} else {
						throw ("Ajax request failed! URL: " + url);
					}
				} else {
					if (response) {
						successCallbackWhileGettingLongLiveToken(response.responseText, tempCode, appId, redirectUri);
					}
				}
			});
			xmlhttp.postData(url);
		}
	};

	/**
	 *method to set the scheduler job for token renewal
	 * purpose once in 25 days
	 * @private 
	 */
	proto.setSchedulerForTokenRenewal = function () {
		var newDate,
			repeatInterval,
			addInfoObj,
			JOB_TYPE_REPEAT = "RPT_INTERVAL",
			DURATION = 1,
			currentTimeInMiliseconds,
			ONE_DAY_IN_MILISECONDS = $N.app.constants.DAY_IN_MS,
			noOfDays,
			tokenJobQuery,
			resultSet,
			tokenRenewalInterval = $N.app.Social.TOKEN_RENEWAL_INTERVAL,
			ONE_MINUTE_IN_MILISECONDS = $N.app.constants.MINUTE_IN_MS,
			startTime,
			title = $N.app.constants.FACEBOOK_TOKEN_RENEWAL_SCHEDULER_TITLE,
			sourceURL = $N.app.Config.getConfigValue($N.app.constants.SOCIAL_STB_TOKEN_RENEWAL_URL),
			timeOfLastSchedulerRun = $N.platform.system.Preferences.get($N.app.constants.TIME_OF_FACEBOOK_RENEWAL_SCHEDULER_RUN);

		newDate = new Date();
		startTime = newDate.getTime();
		startTime = startTime + ONE_MINUTE_IN_MILISECONDS;
		repeatInterval = ONE_DAY_IN_MILISECONDS * tokenRenewalInterval; // As task has to repeat once in 25 days
		addInfoObj = {
			startTime: startTime,
			duration: DURATION,
			sourceURL: sourceURL,
			repeatInterval: repeatInterval,
			title: title
		};

		if (timeOfLastSchedulerRun) {
			currentTimeInMiliseconds = Date.now();
			noOfDays = (currentTimeInMiliseconds - parseInt(timeOfLastSchedulerRun, 10)) / ONE_DAY_IN_MILISECONDS;
			if (noOfDays > tokenRenewalInterval) {
			    me.getTemporaryCodeFromServer();
			}
		}
		tokenJobQuery = "title= '" + title + "'" + " AND jobOpState = " + me.JOB_OP_STATE.JOB_OP_STATE_READY;
		resultSet = $N.platform.btv.PVRManager.getJobByQuery(tokenJobQuery, "startTime");
		if (resultSet.length === 0) {
			$N.platform.btv.Reminders.setGenericReminder(JOB_TYPE_REPEAT, addInfoObj, function (isSuccess, e) {
				if (!isSuccess) {
					me.getTemporaryCodeFromServer();
				}
				$N.platform.system.Preferences.set($N.app.constants.TIME_OF_FACEBOOK_RENEWAL_SCHEDULER_RUN, String(Date.now()));
			});
		}
	};

	/**
	 * Default method to be fired during post failure  
	 * @method defaultPostFailureCallback
	 * @param {Object} ajax request response object
	 */
	function defaultPostFailureCallback(response) {
		if (response.responseText) {
			me.showOAuthErrordialog(response);
		}
	}

	/**
	 * Method to do the actual posting by making
	 * AJAX request to facebook
	 * @method postStatusMessage
	 * @param {function, function} respective success and failure callbacks 
	 */
	proto.postStatusMessage = function (successCallback, failureCallback) {
		var url = $N.app.Config.getConfigValue("social.facebook.graph.url"),
			userId = $N.platform.system.Preferences.get(me.getCompleteKey(me._accountType, me._PROFILE_ID)),
			accessToken = $N.platform.system.Preferences.get(me.getCompleteKey(me._accountType, me._ACCESS_TOKEN)),
			messageString = null,
			accessTokenString = null,
			queryString = null,
			xmlhttp = null,
			message = null,
			postFailureCallback = failureCallback || defaultPostFailureCallback;
		message = me._postAccountMessage.replace(/ /g, '%20');
		messageString = $N.app.StringUtil.join("=", ["message", message]);
		accessTokenString = $N.app.StringUtil.join("=", ["access_token", accessToken.toString()]);
		queryString = $N.app.StringUtil.join("&", [messageString, accessTokenString]);
		url = $N.app.StringUtil.join("/", [url, userId, 'feed']);
		url = $N.app.StringUtil.join("?", [url, queryString]);
		if ($N.app.NetworkUtil.isUrlValid(url)) {
			xmlhttp = new $N.apps.core.AjaxHandler();
			xmlhttp.setResponseCallback(function (response) {
				if (!response || response.status !== 200) {
					if (response && postFailureCallback) {
						postFailureCallback(response);
					} else {
						throw ("Ajax request failed! URL: " + url);
					}
				} else {
					if (response && successCallback) {
						successCallback(response.responseText);
					}
				}
			});
			xmlhttp.postData(url);
		}
	};

	$N.app.Social.FacebookActivity = FacebookActivity;
	$N.app.Social.TOKEN_RENEWAL_INTERVAL = TOKEN_RENEWAL_INTERVAL;
}($N || {}));
