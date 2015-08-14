/**
 * Helper class for retrieving Portal data from the external source
 *
 * @class $N.app.PortalUtil
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};

	$N.app.PortalUtil = (function () {
		var log = new $N.apps.core.Log("Helper", "PortalUtil"),
			hasUrlBeenValidated = false,
			urlValidity;

		/**
		 * Private wrapper function to validate the portal content service url only once and caches the result
		 * @method isUrlValid
		 * @private
		 * @param {String} url
		 * @return {Boolean}
		 */
		function isUrlValid(url) {
			if (!hasUrlBeenValidated) {
				urlValidity = $N.app.NetworkUtil.isUrlValid(url);
				hasUrlBeenValidated = true;
			}
			return urlValidity;
		}

		/**
		 * Formats the portal content service url string for a given virtual path
		 * @method formatRequestUrl
		 * @param {String} virtual path
		 * @return {String} formatted uri
		 */
		function formatRequestUrl(path) {
			log("formatRequestUrl", "Enter path:" + path);
			var netMdsServer = $N.platform.system.Preferences.get("/network/siconfig/CustomDescriptorTags/netMdsServer", true),
				url = null;

			if ($N.app.Config.getConfigValue("mds.developer.mode") === "on") {
				netMdsServer = $N.app.Config.getConfigValue("mds.developer.server");
			}

			url = netMdsServer + $N.app.Config.getConfigValue("portal.url");

			if (isUrlValid(url)) {
				if ($N.app.StringUtil.isStringEndsWith(url, "/")) {
					url = url + path;
				} else {
					url = url + "/" + path;
				}
				log("formatRequestUrl", "Exit url:" + url);
				return url;
			}

			log("formatRequestUrl", "Exit invalid url");
			return null;
		}

		/**
		 * Returns the window data JSON for a specified mode and for the user's currently selected language
		 * @method getWindowData
		 * @param {String} mode The mode/menu we wish to view the data for
		 * @param {Function} callback
		 * @return {Object} data JSON object containing all the information necessary to populate the portal window. null if no data
		 */
		function getWindowData(mode, callback) {
			log("getWindowData", "Enter");
			var url,
				successCallback,
				failureCallback,
				data = null;

			switch (mode) {
		//case "tv":
			//    callback($N.app.MusicCategoriesData.getMusicPortalData(), mode);
			//	return;
			case "music":
				callback($N.app.MusicCategoriesData.getMusicPortalData(), mode);
				return;
			case "messages":
				callback($N.app.MessageUtil.getMessageMails(40), mode, true);
				return;
			case "search":
				return;
			default:
				url = formatRequestUrl(mode + ".js");
			}
			successCallback = function (response) {
				log("getWindowData", "successCallback");
				data = JSON.parse(response);
				callback(data, mode);
			};
			failureCallback = function (response) {
				log("getWindowData", "failure Callback");
				callback(null, mode);
			};
			if (url && $N.app.NetworkUtil.isNetworkAvailable()) {
				$N.app.NetworkUtil.ajaxRequest(url, successCallback, failureCallback);
			} else {
				callback(null, mode);
			}
			log("getWindowData", "Exit");
		}

		/**
		 * @method getWindowDataForRecordings
		 * @param {String} mode
		 * @param {Function} callback
		 * @param {Array} recordings
		 */
		function getWindowDataForRecordings(mode, callback) {
			var forcePreview = true, // Ensure the preview happens even if no data (shows "No Recordings" text).
				recordings = $N.app.PVRUtil.getLatestPlayableRecordings(),
				recordingsLength = recordings.length,
				gotoDVRLibrary = false,
				eventDetails = "",
				windowData = {
					gridSize: {
						width: 2,
						height: 5
					},
					items: []
				},
				items = windowData.items,
				i,
				rowNumber = 0;
			if (!recordings || recordings.length === 0) {
				callback(null, mode, forcePreview);
				return;
			}
			gotoDVRLibrary = (recordingsLength >= $N.app.constants.PORTAL_RECORDINGS_LIMIT);
			if (gotoDVRLibrary) {
				recordingsLength -= 1;
			}
			for (i = 0; i < recordingsLength; i++) {
				//If the item is the last item in the list we want to add a shortcut to DVR Library & therefore change the link and the text displayed
				if ((!$N.app.PVRUtil.isTaskBlockedTitle(recordings[i])) && recordings[i].netDisplaySeasonEpisode) {
					eventDetails = $N.app.PVRUtil.getRecordedSeasonEpisodeShort(recordings[i]);
				} else {
					eventDetails = "";
				}
				items.push({
					y: rowNumber,
					x: 0,
					width: 1,
					height: 1,
					data: {
						recordingObj: recordings[i],
						gotoDVRLibrary: false,
						serviceId: recordings[i].serviceId,
						taskId: recordings[i].taskId,
						eventId: recordings[i].eventId,
						eventDetails: eventDetails,
						text: $N.app.PVRUtil.isTaskBlockedTitle(recordings[i]) ? $N.app.PortalUtil.getString("adultContent") : recordings[i].title,
						href: "",
						startTime: recordings[i].startTime
					}
				});
				if (i % 2) { // even
					items[i].x = 1;
					rowNumber++;
				} else { // odd
					items[i].x = 0;
				}
			}
			if (gotoDVRLibrary) {
				items.push({
					y: rowNumber,
					x: 0,
					width: 1,
					height: 1,
					data: {
						gotoDVRLibrary: true,
						serviceId: 1,
						taskId: null,
						eventId: null,
						eventDetails: "",
						text: $N.app.PortalUtil.getString("DVRMenuSeeAllRecordings")
					}
				});
				if (i % 2) { // even
					items[i].x = 1;
				} else { // odd
					items[i].x = 0;
				}
			}
			callback(windowData, mode, forcePreview);
		}

		// Public
		return {
			formatRequestUrl: formatRequestUrl,
			getWindowData: getWindowData,
			getWindowDataForRecordings: getWindowDataForRecordings
		};
	}());
	$N.apps.core.Language.adornWithGetString($N.app.PortalUtil, "apps/now/common/");

}($N || {}));
