/**
 * Manages the list of favourite folders and their associated channels created by the user.
 * Contains methods to store these value in prefs
 *
 * @class $N.platform.btv.Favourites
 * @singleton
 * @requires $N.platform.system.Preferences
 * @requires $N.platform.btv.EPG
 * @requires $N.apps.core.Log
 */

define('jsfw/platform/btv/Favourites',
	[
		'jsfw/apps/core/Log',
		'jsfw/platform/btv/EPG',
		'jsfw/platform/system/Preferences'
	],
	function (Log, EPG, Preferences) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.btv = $N.platform.btv || {};

		$N.platform.btv.Favourites = (function () {
			/* Private variables */
			var log = new $N.apps.core.Log('btv', 'Favourites'),
				SERVICE_FAVOURITESIDS = 'serviceFavouritesIDs',
				FAVOURITE_FOLDERS = 'serviceFavouriteFolders',
				LOG_LEVEL_INFO = 'info',
				preferences;

			/**
			 * Retrieves a list of the user's favourite folders.
			 *
			 * @method getFavouriteFolders
			 *
			 * @return {Array} A list of the user's favourite folders.
			 */
			function getFavouriteFolders() {
				return preferences.getPreferenceObject(FAVOURITE_FOLDERS) || [];
			}

			/**
			 * Checks if the given folder already exists
			 * @method folderExists
			 * @param {String} folderName The name of the folder to be checked
			 * @return {Boolean} true if folder exists, false otherwise
			 */
			function folderExists(folderName) {
				var favFolders,
					i,
					favFoldersLength;
				if (folderName) {
					favFolders = getFavouriteFolders();
					favFoldersLength = favFolders.length;
					for (i = 0; i < favFoldersLength; i++) {
						if (favFolders[i] === folderName) {
							return true;
						}
					}
				}
				return false;
			}

			/**
			 * Persists the user's favourite folders.
			 *
			 * @method setFavouriteFolders
			 *
			 * @param folderList {Array} list of the user's favourite folders.
			 *
			 * @return {Boolean} True if the user's favourite folders were successfully saved, false if not.
			 */
			function setFavouriteFolders(folderList) {
				if (preferences.setPreferenceObject(FAVOURITE_FOLDERS, folderList)) {
					return true;
				}
				return false;
			}

			/**
			 * Retrieves a complete list of user's favourite channels, grouped by the favourite folder name.
			 *
			 * @method getAllFavouriteChannels
			 *
			 * @return {Array} An array containing all of the user's favourite channels. If the user does not
			 * have any favourite channels then an empty array is returned. Each element in the returned array
			 * has the following structure:
			 *
			 *		name {String} the name of the favourite folder
			 *		getChannels {Function} a function that returns the list of channels that are assigned to this folder
			 */
			function getAllFavouriteChannels() {
				log("getAllFavouriteChannels", "Enter");
				var result = [],
					favFolders = getFavouriteFolders(),
					totalFavFolders = favFolders.length,
					favIdx = 0,
					serviceIdsForChannels = [];
				var getChannelFn = function () {
					var channelList = [],
						i,
						// this.name refers to the name attribute of the object to which this function will be attached
						serviceIdList = preferences.getPreferenceObject(SERVICE_FAVOURITESIDS + this.name.replace(" ", "_")),
						numServices = serviceIdList ? serviceIdList.length : 0;
					// this check is necessary since this function could be called right after creating a new favourite folder,
					// or after clearing the channels in a favourite folder
					if (serviceIdList) {
						for (i = 0; i < numServices; i++) {
							channelList.push($N.platform.btv.EPG.getChannelByServiceId(serviceIdList[i]));
						}
					}
					return channelList;
				};
				for (favIdx = 0; favIdx < totalFavFolders; favIdx++) {
					result.push({
						name: favFolders[favIdx],
						getChannels: getChannelFn,
						getServiceIds: function () {
							return preferences.getPreferenceObject(SERVICE_FAVOURITESIDS + this.name.replace(" ", "_"));
						}
					});
				}
				log("getAllFavouriteChannels", "Enter");
				return result;
			}

			/**
			 * Returns an array of service ids for the given favourite folder name
			 * @method getFavouriteServiceIds
			 * @param {String} folder name
			 * @return {Array}
			 */
			function getFavouriteServiceIds(folderName) {
				var serviceIdList = preferences.getPreferenceObject(SERVICE_FAVOURITESIDS + folderName.replace(" ", "_"));
				if (serviceIdList) {
					return serviceIdList;
				}
				return null;
			}

			/**
			 * Retrieves the user's favourite channels from a specific favourites folder.
			 *
			 * @method getFavouriteChannels
			 *
			 * @param {String} folderName The folder from which to retrieve the favourite channels.
			 *
			 * @return {Array} An array containing the channels within the specified folder. An invalid folder name or
			 * an empty folder will return an empty array.
			 */
			function getFavouriteChannels(folderName) {
				log("getFavouriteChannels", "Enter");
				var favouriteChannels = [],
					favouriteFolders = getFavouriteFolders(),
					serviceIdList,
					favIdx,
					numServices,
					channel,
					i;
				if (folderName) {
					for (favIdx = 0; favIdx < favouriteFolders.length; favIdx++) {
						log("getFavouriteChannels", "current folder name: " + favouriteFolders[favIdx], LOG_LEVEL_INFO);
						if (favouriteFolders[favIdx] === folderName) {
							serviceIdList = preferences.getPreferenceObject(SERVICE_FAVOURITESIDS + folderName.replace(" ", "_"));
							numServices = serviceIdList ? serviceIdList.length : 0;
							for (i = 0; i < numServices; i++) {
								if (serviceIdList[i]) {
									channel = $N.platform.btv.EPG.getChannelByServiceId(serviceIdList[i]);
									favouriteChannels.push(channel || {'serviceId': serviceIdList[i]});
								}
							}
							break;
						}
					}
				}
				log("getFavouriteChannels", "Exit");
				return favouriteChannels;
			}

			/**
			 * Retrieves the service ids of the user's favourite channels from a specific favourites folder.
			 *
			 * @method getFavouriteChannelServiceIds
			 *
			 * @param {String} folderName The folder from which to retrieve the favourite channels.
			 *
			 * @return {Array} An array containing the channel Ids within the specified folder. An invalid folder name or
			 * an empty folder will return an empty array.
			 */
			function getFavouriteChannelServiceIds(folderName) {
				log("getFavouriteChannelIds", "Enter");
				var favouriteFolders = getFavouriteFolders(),
					favIdx,
					serviceIdList = [],
					i = 0;
				if (folderName) {
					for (favIdx = 0; favIdx < favouriteFolders.length; favIdx++) {
						log("getFavouriteChannels", "current folder name: " + favouriteFolders[i], LOG_LEVEL_INFO);
						if (favouriteFolders[favIdx] === folderName) {
							serviceIdList = preferences.getPreferenceObject(SERVICE_FAVOURITESIDS + folderName.replace(" ", "_"));
						}
					}
				}
				log("getFavouriteChannelIds", "Exit");
				return serviceIdList;
			}

			/**
			 * Adds the specified folder name to the `serviceFavouriteFolders` array preference
			 * after checking that the name does not already exist
			 * @method addFavouriteFolder
			 * @param {String} folderName The name of the folder to be added
			 * @return {Boolean} true if folder was added successfully, false if not
			 */
			function addFavouriteFolder(folderName) {
				var favFolders = getFavouriteFolders(),
					newFolderList = [];
				if (favFolders.length === 0) {
					newFolderList.push(folderName);
				} else {
					newFolderList = favFolders.concat(folderName);
				}
				var folderAdded = false;
				//check folderName does not already exist
				if (folderName && !folderExists(folderName)) {
					if (setFavouriteFolders(newFolderList)) {
						folderAdded = true;
					}
				}
				if (!folderAdded) {
					log("addFavouriteFolder", "Unable to add folder - please check if it already exists");
				}
				return folderAdded;
			}

			/**
			 * Persists the user's favourite channels in a specified favourite folder.
			 *
			 * @method setFavouriteChannels
			 *
			 * @param folderName {String} Name of the folder that the specified channels will be saved within.
			 * @param channelList {Array} list of favourite channels to be saved, each channel being an EPGService object
			 *
			 * @return {Boolean} True if the specified channel list was successfully saved to the specified favourite
			 * folder, false otherwise
			 */
			function setFavouriteChannels(folderName, channelList) {
				if (folderName && channelList) {
					var i,
						serviceIdList = [],
						channelListLength = channelList.length || 0;
					if (!folderExists(folderName)) {
						addFavouriteFolder(folderName);
					}
					for (i = 0; i < channelListLength; i++) {
						if (channelList[i] && channelList[i].serviceId) {
							serviceIdList.push(channelList[i].serviceId);
						}
					}
					return preferences.setPreferenceObject(SERVICE_FAVOURITESIDS + folderName.replace(" ", "_"), serviceIdList);
				}
				return false;
			}

			/**
			 * Persists the user's favourite channels in a specified favourite folder.
			 *
			 * @method setFavouriteChannelsToServiceIds
			 *
			 * @param folderName {String} Name of the folder that the specified channels will be saved within.
			 * @param serviceIdList {Array} list of service Ids to be saved
			 *
			 * @return {Boolean} True if the specified service Id list was successfully saved to the specified favourite
			 * folder, false otherwise
			 */
			function setFavouriteChannelsToServiceIds(folderName, serviceIdList) {
				if (folderName && serviceIdList) {
					if (!folderExists(folderName)) {
						addFavouriteFolder(folderName);
					}
					return preferences.setPreferenceObject(SERVICE_FAVOURITESIDS + folderName.replace(" ", "_"), serviceIdList);
				}
				return false;
			}

			/**
			 * Determines whether or not the user has created any favourites.
			 *
			 * @method userHasFavourites
			 *
			 * @return {Boolean} True if the user has created any favourites, false if not.
			 */
			function userHasFavourites() {
				return getFavouriteFolders().length > 0;
			}

			/**
			 * Deletes the specified favourite folder. If there are no other favourite folders afterwards, also
			 * causes a call to the `userHasFavourites` method to return false.
			 *
			 * @method deleteFavouriteFolder
			 *
			 * @param folderName {String} The name of the favourite folder to delete.
			 */
			function deleteFavouriteFolder(folderName) {
				log("deleteFavouriteFolder", "Enter");
				if (folderName) {
					preferences.deletePreference(SERVICE_FAVOURITESIDS + folderName.replace(" ", "_"));
					preferences.removeValueFromArray(FAVOURITE_FOLDERS, folderName);
				}
				log("deleteFavouriteFolder", "Exit");
			}

			/**
			 * Adds a channel to the specified favourite folder. If the favourite folder is not specified, assumes that
			 * there's only one favourite folder available and adds the channel to it.
			 *
			 * @method addFavouriteChannel
			 * @param channel {Object} EPGService object that is to be added as a favourite
			 * @param [folderName=''] {String} The favourite folder to which the channel is to be added
			 */
			function addFavouriteChannel(channel, folderName) {
				var currentChannels = [],
					favFolders = [];
				if (folderName) {
					if (channel) {
						/* if the folder exists in favourites, then add the channel to it
						 * otherwise create a new favourite folder and add the channel to it
						 */
						if (folderExists(folderName)) {
							currentChannels = getFavouriteChannels(folderName);
						} else {
							addFavouriteFolder(folderName);
						}
						currentChannels.push(channel);
						setFavouriteChannels(folderName, currentChannels);
					}
				} else {
					// assume that there's only one favourite folder, and add the given channel to it
					if (channel) {
						favFolders = getFavouriteFolders();
						if (favFolders && favFolders.length === 1) {
							currentChannels = getFavouriteChannels(favFolders[0]);
							currentChannels.push(channel);
							setFavouriteChannels(favFolders[0], currentChannels);
						}
					}
				}
			}

			/**
			 * Removes a channel from a specified favourite folder. If the folder isn't specified, assumes that
			 * there's only one favourite folder available.
			 *
			 * @method removeFavouriteChannel
			 * @param channel {Object} EPGService object that's to be removed from favourites
			 * @param [folderName=''] {String} the favourites folder from which channel is to be removed.
			 */
			function removeFavouriteChannel(channel, folderName) {
				var favChannels = [],
					i,
					favFolders;
				if (!folderName) {
					favFolders = getFavouriteFolders();
					folderName = favFolders ? favFolders[0] : '';
				}
				if (folderExists(folderName) && channel) {
					favChannels = getFavouriteChannels(folderName);
					for (i = 0; i < favChannels.length; i++) {
						if (favChannels[i].serviceId === channel.serviceId) {
							favChannels.splice(i, 1);
							setFavouriteChannels(folderName, favChannels);
							break;
						}
					}
				}
			}

			/**
			 * Renames a favourite folder to the new given name
			 * Keeps the stored channels against this name
			 * @method renameFavouriteFolder
			 * @param {String} previousName The name of the folder that is to be renamed
			 * @param {String} newName The new name of the folder
			 * @return {Boolean} True if the folder is renamed false if not
			 */
			function renameFavouriteFolder(previousName, newName) {
				var favChannels = getFavouriteChannels(previousName);
				if (addFavouriteFolder(newName)) {
					setFavouriteChannels(newName, favChannels);
					deleteFavouriteFolder(previousName);
					return true;
				}
				return false;
			}

			/**
			 * Removes all favourites and their service Ids from preferences
			 * @method deleteAll
			 */
			function deleteAll() {
				var favFolders = getFavouriteFolders();
				var favFoldersLength = favFolders.length;
				var i;
				for (i = 0; i < favFoldersLength; i++) {
					preferences.deletePreference(SERVICE_FAVOURITESIDS + favFolders[i].replace(" ", "_"));
				}
				preferences.deletePreference(FAVOURITE_FOLDERS);
			}

			function init() {
				preferences = $N.platform.system.Preferences;
			}

			/* Public API */
			return {
				getFavouriteChannels: getFavouriteChannels,
				getAllFavouriteChannels: getAllFavouriteChannels,
				setFavouriteChannels: setFavouriteChannels,
				getFavouriteFolders: getFavouriteFolders,
				setFavouriteFolders: setFavouriteFolders,
				deleteFavouriteFolder: deleteFavouriteFolder,
				userHasFavourites: userHasFavourites,
				addFavouriteFolder: addFavouriteFolder,
				addFavouriteChannel: addFavouriteChannel,
				removeFavouriteChannel: removeFavouriteChannel,
				getFavouriteServiceIds: getFavouriteServiceIds,
				renameFavouriteFolder: renameFavouriteFolder,
				folderExists: folderExists,
				setFavouriteChannelsToServiceIds: setFavouriteChannelsToServiceIds,
				getFavouriteChannelServiceIds: getFavouriteChannelServiceIds,
				deleteAll: deleteAll,
				init: init
				// TODO: Remove favourites completely.
			};
		}());
		return $N.platform.btv.Favourites;
	}
);