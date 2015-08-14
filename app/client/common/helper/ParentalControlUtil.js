/**
 * Helper class to manage parental control state
 *
 * @class $N.app.ParentalControlUtil
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.platform.ca.ParentalControl
 * @requires $N.app.fullScreenPlayer
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.ParentalControlUtil = (function () {
		var log = new $N.apps.core.Log("Conditional-Access", "ParentalControlUtil"),
			parentalControl = $N.platform.ca.ParentalControl,
			isBTVlocked = true,
			ratingLookUp = null,
			DEFAULT_PARENTAL_RATING = 18,
			PARENTAL_RATING_ADULT_VALUE = 18;

		/**
		 * Populates the values of the ratingLookUp array
		 * @method populateRatingLookUp
		 * @private
		 */
		function populateRatingLookUp() {
			ratingLookUp.push({
				title : "parentalRatingFreeForPublic",
				morality : 7,//Look up value maintained by TI, as part of R1 - R2 migration, we are changing this.
				ratingIcon : $N.app.ImageUtil.getParentalRatingIconHref(7)
			});
			// Morality values below are one less than rating to match requirement in NETUI FSR Core Table 1: Parental locking
			ratingLookUp.push({
				title : "parentalRatingTen",
				morality : 9,
				ratingIcon : $N.app.ImageUtil.getParentalRatingIconHref(10)
			});
			ratingLookUp.push({
				title : "parentalRatingTwelve",
				morality : 11,
				ratingIcon : $N.app.ImageUtil.getParentalRatingIconHref(12)
			});
			ratingLookUp.push({
				title : "parentalRatingFourteen",
				morality : 13,
				ratingIcon : $N.app.ImageUtil.getParentalRatingIconHref(14)
			});
			ratingLookUp.push({
				title : "parentalRatingSixteen",
				morality : 15,
				ratingIcon : $N.app.ImageUtil.getParentalRatingIconHref(16)
			});
			ratingLookUp.push({
				title : "parentalRatingEighteen",
				morality : 17,
				ratingIcon : $N.app.ImageUtil.getParentalRatingIconHref(18)
			});
			ratingLookUp.push({
				title: "parentalRatingNoBlock",
				morality: 254,//Look up value maintained by TI, as part of R1 - R2 migration, we are changing this.
				ratingIcon: "../../../customise/resources/images/%RES/icons/sem_bloqueio.png"
			});
		}

		/**
		 * Gets the values of the ratingLookUp array
		 * @method getRatingLookUp
		 * @private
		 * @return {Array} ratingLookUp
		 */
		function getRatingLookUp() {
			//added ratingLookUp.length === 0 since ratingLookUp is getting re-assigned to [] once passivate.
			if (!ratingLookUp || ratingLookUp.length === 0) {
				ratingLookUp = [];
				populateRatingLookUp();
			}
			return ratingLookUp;
		}

		/**
		 * Gets the highest precedenceValue returned by SDP
		 * @method getHighestSdpRating
		 */
		function getHighestSdpRating() {
			var sdpRatings = {};
			if ($N.app.EnvironmentUtil.isIPEnabled()) {
				sdpRatings = $N.services.sdp.Ratings.getRatingLookupOrderedByPrecedence();
				if (sdpRatings && sdpRatings[0]) {
					return sdpRatings[0].precedenceValue;
				}
			}
			return 0;
		}

		/**
		 * @method parentalDialog
		 * @private
		 * @param {Object} data
		 * @param {Function} successCallback
		 * @param {Function} pinCancelledCallback
		 * @param {Function} pinKeyPressCallback
		 * @param {Boolean} (optional) isLock true if we are locking, not unlocking

		 */
		function parentalDialog(data, successCallback, pinCancelledCallback, pinKeyPressCallback, isLock) {
			log("parentalDialog", "Enter");
			var serviceObj = $N.app.epgUtil.getServiceById(data.serviceId),
				isChannelLocked = $N.app.ParentalControlUtil.isChannelLocked(serviceObj),
				pinHelper = new $N.app.PinHelper(function () {successCallback(data); }, null, null, null, pinCancelledCallback, 0, false),
				titleForLock = (isLock === true) ? $N.app.ParentalControlUtil.getString("programUnlocked") : "",
				descriptionForLock = (isLock === true) ? $N.app.ParentalControlUtil.getString("lockShow") : "",
				title = isChannelLocked ? $N.app.ParentalControlUtil.getString("channelLocked") : $N.app.ParentalControlUtil.getString("programLocked"),
				description = isChannelLocked ? $N.app.ParentalControlUtil.getString("unlockChannel") : $N.app.ParentalControlUtil.getString("unlockShow");
			pinHelper.setDialogProperties({
				x: 0,
				y: 0,
				width: 1920,
				height: 1080,
				id: "PinDialog",
				title: (isLock === true) ? titleForLock : title,
				description: (isLock === true) ? descriptionForLock : description,
				keyPressedCallback: pinKeyPressCallback,
				titleCssClass: "pinEntryTitle"
			});
			pinHelper.showPinDialog('master', false);
			log("parentalDialog", "Exit");
		}

		// Public
		return {
			/**
			 * initialise the ParentalControlUtil
			 * @method initialise
			 */
			initialise: function () {
				$N.apps.core.Language.adornWithGetString($N.app.ParentalControlUtil);
			},

			/**
			 * Returns state of parental locked fag for BTV
			 * @method isBTVLocked
			 * return {Boolean} true if BTV state locked, false otherwise.
			 */
			isBTVLocked: function () {
				return isBTVlocked;
			},

			/**
			 * Returns whether a BTV program is deemed as locked
			 * by the application.
			 * @method isProgramLocked
			 * @param {Object} event Valid EPG Event Object
			 * @return {Boolean} true if program is deemed locked
			 */
			isProgramLocked: function (event) {
				log("isProgramLocked", "Enter");
				var epgEvent = (event && !event.parentalRating) ? {parentalRating: DEFAULT_PARENTAL_RATING} : null;
				if (event.eventId && event.eventId === $N.app.epgUtil.BAD_EVENT_ID) {
					log("isProgramLocked", "return false");
					return false;
				}
				if (parentalControl.isEventPermitted(epgEvent || event)) {
					log("isProgramLocked", "return false");
					return false;
				}
				log("isProgramLocked", "return true");
				return true;
			},

			/**
			 * Returns whether a BTV channel is deemed as locked
			 * by the application
			 * @method isChannelLocked
			 * @param {Object} service Valid EPG Service Object
			 * @return {Boolean} true if service is deemed locked
			 */
			isChannelLocked: function (service) {
				log("isChannelLocked", "Enter");
				return parentalControl.isServiceIdRestricted(service.serviceId);
			},

			/**
			 * @method isChannelLockedAdult
			 * @param {Object} service
			 * @return {Boolean}
			 */
			isChannelLockedAsAdult: function (service) {
				return (!parentalControl.isUserAdult() && $N.app.genreUtil.isAdultChannel(service));
			},

			/**
			 * Returns whether the BTV service and event is deemed
			 * parentally locked, or blocked (for service) by the application.
			 * @method isChannelOrProgramLocked
			 * @param {Object} event Valid EPG Event Object
			 * @return {Boolean} true if the the channel or program should not be authorised
			 */
			isChannelOrProgramLocked: function (event) {
				log("isChannelOrProgramLocked", "Enter");
				var serviceObj;

				if (!event || !event.serviceId) {
					log("isChannelOrProgramLocked invalid event", "return 1 false");
					return false;
				}

				if (parentalControl.isCurrentUserMaster()) {
					log("isChannelOrProgramLocked isCurrentUserMaster", "return 2 false");
					return false;
				}

				serviceObj = $N.app.epgUtil.getServiceById(event.serviceId);
				if (event.eventId === $N.app.epgUtil.BAD_EVENT_ID) {
					if (parentalControl.isServicePermitted(serviceObj)) {
						log("isChannelOrProgramLocked", "return 3 false");
						return false;
					}
					log("isChannelOrProgramLocked", "return 3 true");
					return true;
				}

				return !parentalControl.isServiceAndEventPermitted(serviceObj, event);
			},

			/**
			 * Calls the video stream to be blocked or unblocked depending on parental rating
			 * @method updateVideoBlocker
			 * @param {Number} serviceId
			 */
			updateVideoBlocker: function (serviceId) {
				$N.app.fullScreenPlayer.applyParentalControl(serviceId);
			},

			populateRatingLookUp: populateRatingLookUp,
			getRatingLookUp: getRatingLookUp,
			parentalDialog: parentalDialog,
			PARENTAL_RATING_ADULT_VALUE: PARENTAL_RATING_ADULT_VALUE
		};
	}());

}($N || {}));