/**
 * @class $N.app.NowMappingUtil
 * @static
 */

(function ($N) {
	"use strict";
	$N = $N || {};
	$N.app = $N.app || {};
	$N.app.NowMappingUtil = (function () {
		var studioFlags,
			channelMappings;

		/**
		 * Reads in the JSON configuration of the studio flags
		 *
		 * readLocalJSONFile
		 */
		function readLocalJSONFile(filename, successCallback) {
			var request = new XMLHttpRequest(),
				getRequestSuccessCallback = function () {
					var parsedData;
					if (request.readyState === 4) { // if (request.status === 200) not required for local file
						parsedData = JSON.parse(request.responseText);
						successCallback(parsedData);
					}
				};
			request.onreadystatechange = getRequestSuccessCallback;
			request.open("GET", filename, true);
			request.send();
		}

		/**
		 * Reads in the JSON configuration of the studio flags
		 *
		 * readStudioFlags
		 */
		function readStudioFlags() {
			var successCallback = function (result) {
				studioFlags = result.Studios;
			};
			readLocalJSONFile("customise/resources/config/StudioFlags.json", successCallback);
		}

		/**
		 * Reads in the JSON configuration of the channel to NOW node mappings
		 *
		 * readChannelNodeMappings
		 */
		function readChannelNodeMappings() {
			var successCallback = function (result) {
				channelMappings = result.Channels;
			};
			readLocalJSONFile("customise/resources/config/MoreOnNow.json", successCallback);
		}

		return {
			/**
			 * init
			 */
			init: function () {
				readStudioFlags();
				readChannelNodeMappings();
			},

			/**
			 * Get the studio flag from the JSON file based on studioName and/or productName
			 *
			 * getStudioFlag
			 * @param  {String productName - Name of the product (from MDS)
			 * @return {String} - flag file name
			 */
			getStudioFlag: function (productName) {
				if (!studioFlags) {
					return null;
				}

				return studioFlags[productName];
			},

			/**
			 * Get the MDS catalogue node from the JSON file based on shortChannelName
			 *
			 * getChannelNode
			 * @param  {String} shortChannelName - Short name of the channel
			 * @return {String} - Node ID of the channel in MDS catalogue
			 */
			getChannelNode: function (shortChannelName) {
				if (!shortChannelName) {
					return null;
				}

				return channelMappings[shortChannelName];
			}
		};
	}());
}($N || {}));