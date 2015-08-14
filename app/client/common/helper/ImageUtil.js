/**
 * Helper class for improving Gravity's performance
 *
 * @class $N.app.ImageUtil
 * @author srajendr
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	$N.app = $N.app || {};
	$N.app.ImageUtil = (function () {

		var log = new $N.apps.core.Log("Helper", "ImageUtil"),
			MAX_WIDTH = 300,
			MAX_HEIGHT = 300,
			MIN_WIDTH = 140,
			MIN_HEIGHT = 140,
			xPos = null,
			yPos = null,
			ratio,
			thumbnailProperties = {},
			DEFAULT_TITLE_IMAGE = "../../../customise/resources/images/%RES/thumbnails/Icn_showCardTitle.png",
			LOCK_ICON = "../../../customise/resources/images/%RES/thumbnails/Icn_showcardLockedCover.png",
			LOCK_ICON_SMALL = "../../../customise/resources/images/%RES/icons/Icn_lock.png";
		/**
		 * Calculates Height, Width, X-Position & Y-position of thumbnail image.
		 * @method calculateThumbnailProperties
		 * @param {Number} height of the thumbnail image.
		 * @param {Number}width of the thumbnail image.
		 * @return {Object} Returns height, width, xpos & ypos.
		 */
		function calculateThumbnailProperties(height, width) {
			if (height >= MAX_HEIGHT && width >= MAX_WIDTH) {
				if (width > height) {
					ratio = width / height;
					height = MAX_HEIGHT;
					width = height * ratio;
					xPos = (MAX_WIDTH - width) / 2;
					yPos = 0;
				} else {
					ratio = height / width;
					width = MAX_WIDTH;
					height = width * ratio;
					xPos = 0;
					yPos = (MAX_HEIGHT - height) / 2;
				}
			}
			if (height >= MAX_HEIGHT && width < MAX_WIDTH) {
				height = MAX_HEIGHT;
				xPos = (MAX_WIDTH - width) / 2;
				yPos = 0;
			}
			if (height < MAX_HEIGHT && width >= MAX_WIDTH) {
				width = MAX_WIDTH;
				xPos = 0;
				yPos = (MAX_HEIGHT - height) / 2;
			}
			if ((height < MAX_HEIGHT && height >= MIN_HEIGHT) && (width < MAX_WIDTH && width >= MIN_WIDTH)) {
				xPos = (MAX_WIDTH - width) / 2;
				yPos = (MAX_HEIGHT - height) / 2;
			}
			thumbnailProperties.height = height;
			thumbnailProperties.width = width;
			thumbnailProperties.xPos = xPos;
			thumbnailProperties.yPos = yPos;
			return thumbnailProperties;
		}

		/**
		 * @method getAudioVideoFlagUrl
		 * @param {String} flagName
		 * @return {String} flagUrl
		 */
		function getAudioVideoFlagUrl(flagName) {
			return "../../../customise/resources/images/720p/icons/audioVideoFlags/" + flagName + ".png";
		}

		/**
		 * @method getParentalRatingIconHref
		 * @param {String} or {Number} parentalRating
		 * @return {String} iconHref
		 */
		function getParentalRatingIconHref(parentalRating) {
			var iconPath = "../../../customise/resources/images/%RES/icons/parentalRatings/";
			switch (parentalRating) {
			case 4:
			case 5:
			case 6:
			case 7:
				return iconPath + "L.png";
			case 10:
			case 12:
			case 14:
			case 16:
			case 18:
				return iconPath + parentalRating + ".png";
			}
			return "";
		}

		/**
		 * @method getParentalRatingIconHrefInHelpers
		 * @param {String} or {Number} parentalRating
		 * @return {String} iconHref
		 */
		function getParentalRatingIconHrefInHelpers(parentalRating) {
			var path = getParentalRatingIconHref(parentalRating);
			return path.substring(path.indexOf("customise"), path.length);
		}
		// Public
		return {
			calculateThumbnailProperties: calculateThumbnailProperties,
			getAudioVideoFlagUrl: getAudioVideoFlagUrl,
			getParentalRatingIconHref: getParentalRatingIconHref,

			getParentalRatingIconHrefInHelpers: getParentalRatingIconHrefInHelpers,
			DEFAULT_TITLE_IMAGE: DEFAULT_TITLE_IMAGE,
			LOCK_ICON: LOCK_ICON,
			LOCK_ICON_SMALL: LOCK_ICON_SMALL
		};
	}());

}($N || {}));