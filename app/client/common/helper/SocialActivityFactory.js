/**
 * Helper class for SocialActivities
 * This manages the social activities with
 * generic  function calls.
 * @class $N.app.SocialActivityFactory
 * @author raj
 * @static
 * @requires $N.app.Social.FacebookActivity
 * #depends social/FacebookActivity.js
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};

	$N.app.SocialAccount = {
		FACEBOOK: "facebook"
	};

	$N.app.SocialActivityFactory = (function ($N) {

		var socialAccountObjects = {
			"facebook" : null
		};

		function createAccountObject(accountType) {
			switch (accountType) {
			case $N.app.SocialAccount.FACEBOOK:
				socialAccountObjects[accountType] = new $N.app.Social.FacebookActivity();
				break;
			}
		}

		function getSocialAccountObject(accountType) {
			if (!socialAccountObjects[accountType]) {
				createAccountObject(accountType);
			}
			return socialAccountObjects[accountType];
		}

		function getPinSettingDisplayValue(key) {
			return $N.app.SocialActivityFactory.getString($N.app.StringUtil.join("", [key, "DisplayValue"]));
		}

		return {
			getSocialAccountObject : getSocialAccountObject,
			getPinSettingDisplayValue : getPinSettingDisplayValue
		};
	}($N));
	$N.apps.core.Language.adornWithGetString($N.app.SocialActivityFactory);

}($N || {}));