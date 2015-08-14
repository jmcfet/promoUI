/**
 * This is a util class used to get all channels and favorites channel.
 *
 * Singleton class
 *
 * @class $N.app.ChannelManager
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.app.constants
 * #depends ../Constants.js
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.ChannelManager = (function () {

		var favoriteData = null,
			FAV_FOLDER_NAME = $N.app.constants.FAVOURITE_FOLDER_NAME,
			currentGenreIndex = 0,
			log = new $N.apps.core.Log("app", "ChannelManager"),
			blockedChannelsArray = [],
			blockedServiceIdsArray = [],
			serviceMap = {},
			MDSChannels = {},
			serviceUpdatedListeners = [],
			mdsChannelListTimeout = null,
			sortedChannels = {},
			channelNumberMap = {},
			getDataSuccessCallback,
			getDataFailureCallback,
			acquireAllServiceRefs = function () {},
			_barkerChannelService = {},
			favouritesArrayFromMemory = [],
			isFavouritesArrayInitialised = false;

		/**
		 * Adds channel to temporary array
		 * of blocked channels
		 * @method addChannelToBlockedArray
		 * @private
		 * @param {Object} channelInfo of the channel to be blocked
		 */
		function addChannelToBlockedArray(channelInfo) {
			if (blockedServiceIdsArray.indexOf(channelInfo.serviceId) === -1) {
				blockedChannelsArray.push(channelInfo);
				blockedServiceIdsArray.push(channelInfo.serviceId);
			}
		}

		/**
		 * Removes channel from temporary array
		 * of blocked channels
		 * @method removeChannelFromBlockedArray
		 * @private
		 * @param {Object} channelInfo of the channel to be blocked
		 */
		function removeChannelFromBlockedArray(channelInfo) {
			log("removeChannelFromBlockedArray", "Enter");
			var	indexOfServiceId = blockedServiceIdsArray.indexOf(channelInfo.serviceId);
			log("removeChannelFromBlockedArray", blockedChannelsArray.length);
			log("removeChannelFromBlockedArray", blockedServiceIdsArray.length);
			if (indexOfServiceId > -1) {
				log("removeChannelFromBlockedArray", "Service found. Will be removed.");
				blockedChannelsArray.splice(indexOfServiceId, 1);
				blockedServiceIdsArray.splice(indexOfServiceId, 1);
			}
			log("removeChannelFromBlockedArray", blockedChannelsArray.length);
			log("removeChannelFromBlockedArray", blockedServiceIdsArray.length);
			log("removeChannelFromBlockedArray", "Exit");
		}

		/**
		 * Fetches the list of blocked channels and
		 * keeps it in a temporary array
		 * @method initialiseBlockedChannelsList
		 * @private
		 * @param {Callback} function to be fired on initialisation
		 */
		function initialiseBlockedChannelsList(initialisationCallback) {
			log("initialiseBlockedChannelsList", "setting up");
			CCOM.UserAuth.addEventListener("getAllRestrictedChannelsOK", function (event) {
				var i = null,
					channelObject = null,
					ccomBlockedList = [],
					ageWindowStartIndex,
					serviceId;
				log("initialiseBlockedChannelsList", "Configuring blocked channels");
				ccomBlockedList = event.channelList.toString().split(",");
				blockedServiceIdsArray = [];
				blockedChannelsArray = [];
				for (i = 0; i < ccomBlockedList.length; i++) {
					ageWindowStartIndex = ccomBlockedList[i].indexOf("[/age:");
					if (ageWindowStartIndex !== -1) {
						serviceId = ccomBlockedList[i].substring(0, ageWindowStartIndex);
					} else if (ccomBlockedList[i]) {//else if part has been added to maintain block channel list to display while migrating from MW 5.1.2 to 5.1.3 where MW attaches the string '[/age:' to all serviceIds that are blocked
						serviceId = ccomBlockedList[i];
					}
					if (serviceId) {
						log("initialiseBlockedChannelsList", "Caching restricted status for " + serviceId);
						channelObject = $N.platform.btv.EPG.getChannelByServiceId(serviceId);
						if (channelObject) {
							blockedChannelsArray.push(channelObject);
							blockedServiceIdsArray.push(channelObject.serviceId);
						}
					}
				}
				if (initialisationCallback) {
					initialisationCallback(blockedChannelsArray);
				}
			});
			CCOM.UserAuth.getAllRestrictedChannels();
		}

		/**
		 * Returns the service id which matches the logical channel number
		 * @method getServiceByUniqueServiceId
		 * @private
		 * @param {String} uniqueServiceId The uniqueServiceId to be searched for.
		 * @returns The service requested or null if it could not be found.
		 */
		function getServiceByUniqueServiceId(uniqueServiceId) {
			return sortedChannels[uniqueServiceId] || null;
		}

		/**
		 * Returns everything before the "_" character.
		 * For example, SPOFOX_2 will return SPOFOX
		 * @method getUniqueServiceIdFromTechnicalId
		 * @private
		 * @param {String} technicalId
		 * @returns The uniqueServiceId
		 */
		function getUniqueServiceIdFromTechnicalId(technicalId) {
			return technicalId.split("_", 1)[0];
		}


		/**
		 * Called when the MDS call completes.
		 * @method getDataSuccessCallback
		 * @private
		 * @param {Object} The JSON response from the MDS.
		 * @param {Object} The callback to be informed once processing of
		 *                  the returned data is successfully completed.
		 */
		getDataSuccessCallback = function (response, callback) {
			var service = null,
				i = null,
				numberOfServices = 0,
				netMdsServer = $N.platform.system.Preferences.get("/network/siconfig/CustomDescriptorTags/netMdsServer", true),
				domainName = '',
				logoFilename = "",
				uniqueServiceId = null;

			if ($N.app.Config.getConfigValue("mds.developer.mode") === "on") {
				netMdsServer = $N.app.Config.getConfigValue("mds.developer.server");
			}

			if (mdsChannelListTimeout) {
				clearTimeout(mdsChannelListTimeout);
				mdsChannelListTimeout = null;
			}

			// Success
			numberOfServices = response.services.length;
			if (response && response.services && numberOfServices > 0) {
				for (i = 0; i < numberOfServices; i++) {
					uniqueServiceId = getUniqueServiceIdFromTechnicalId(response.services[i].technical.id);
					service = getServiceByUniqueServiceId(uniqueServiceId);
					if (service) {
						if ($N.app.Config.getConfigValue("mds.developer.mode") === "on") {
							if (service._data && response.services[i].technical && response.services[i].technical.NetworkLocation) {
								if (response.services[i].technical.NetworkLocation.indexOf('http') === -1) {
									domainName = netMdsServer;
								} else {
									domainName = "";
								}
								logoFilename = response.services[i].technical.NetworkLocation;
							} else {
								logoFilename = "";
							}
						} else {
							if (service._data && response.services[i].technical.PromoImages && response.services[i].technical.PromoImages[0]) {
								logoFilename = netMdsServer + response.services[i].technical.PromoImages[0];
							} else {
								logoFilename = "";
							}
						}
						service.channelLogo = domainName + logoFilename;
						service.shortName = response.services[i].editorial.shortName;
						serviceMap[service.serviceId] = uniqueServiceId;
						MDSChannels[uniqueServiceId] = service.serviceId;
					}
				}
			}

			if (callback) {
				callback();
			}
		};

		/**
		 * Called when the MDS call fails to complete. This function simply
		 * reschedules the MDS callback.
		 * @method getDataFailureCallback
		 * @private
		 * @param {Object} The JSON response from the MDS (if any).
		 * @param {Object} The callback to be informed once processing of
		 *                  the returned data is successfully completed.
		 */
		getDataFailureCallback = function (response, callback) {
			if (mdsChannelListTimeout) {
				clearTimeout(mdsChannelListTimeout);
			}
			mdsChannelListTimeout = setTimeout(function () {
				acquireAllServiceRefs(callback);
			}, $N.app.constants.MDS_RETRY_TIMEOUT);
		};

		/**
		 * This function acquires all of the service references from the MDS
		 * instance, and maps them to local services.
		 * @method acquireAllServiceRefs
		 * @private
		 * @param {Object} The callback to be informed once processing of
		 *                  the returned data is successfully completed.
		 */
		acquireAllServiceRefs = function (callback) {
			var me = this,
				netMdsServer = $N.platform.system.Preferences.get("/network/siconfig/CustomDescriptorTags/netMdsServer", true);

			if ($N.app.Config.getConfigValue("mds.developer.mode") === "on") {
				netMdsServer = $N.app.Config.getConfigValue("mds.developer.server");
			}

			if (netMdsServer && netMdsServer !== "") {
				$N.services.sdp.MetadataService.getData(me,
					function (response) {
						getDataSuccessCallback(response, callback);
					},
					function (response) {
						getDataFailureCallback(response, callback);
					},
					"btv/services",
					null,
					null,
					["editorial.tvChannel", "editorial.shortName", "technical.id", "technical.PromoImages", "technical.NetworkLocation"],
					$N.app.constants.MDS_MAX_RECORDS_RETURNED);
			} else {
				// If there is no MDS server configured (yet) then call the failure
				// code, which will trigger a recheck in a configurable amount
				// of time.
				getDataFailureCallback(null, callback);
			}
		};

		/**
		 * Gets the service reference for the specified service id.
		 * @method getServiceRef
		 * @param {int} The id of the service being requested.
		 */
		function getServiceRef(serviceId) {
			return serviceMap[serviceId];
		}

		/**
		 * Gets the service for the specified MDS reference.
		 * @method getServiceIdFromServiceRef
		 * @param {int} The MDS reference for the service being requested.
		 */
		function getServiceIdFromServiceRef(serviceRef) {
			return MDSChannels[serviceRef];
		}

			/**
		 * Function called when the barker channel information is updated.
		 */
		function _barkerChannelChanged() {
			var newBarkerChannel = $N.platform.system.Preferences.get($N.app.constants.PREF_BARKER_CHANNEL_CONFIG_PATH, true),
				service = null;

			service = getServiceByUniqueServiceId(channelNumberMap[newBarkerChannel]);

			if (service) {
				_barkerChannelService.uri = service.uri;
				_barkerChannelService.serviceId = service.serviceId;
				_barkerChannelService.channelKey = service.logicalChannelNum;
				_barkerChannelService.type = 1;
				_barkerChannelService.name = service.name;
			}
		}

		/**
		 * Reloads the list of services from the MDS.
		 * @method reloadChannelList
		 * @private
		 */
		function reloadChannelList() {
			log("reloadChannelList", "Enter");

			var allChannels = $N.platform.btv.EPG.getAllChannelsOrderedByChannelNumber(),
				i = null,
				channel = null;

			// Clear down all of the existing values.
			sortedChannels = {};
			channelNumberMap = {};

			for (i = 0; i < allChannels.length; i++) {
				channel = allChannels[i];

				if (channel.uniqueServiceId && channel.serviceType === $N.data.EPGService.SERVICE_TYPE.TV) {
					if (!sortedChannels[channel.uniqueServiceId]) {
						sortedChannels[channel.uniqueServiceId] = channel;
						channelNumberMap[channel.logicalChannelNum] = channel.uniqueServiceId;
					}
				}
			}

			// Force a recheck of the barker channel configuration now too, just
			// in case the service information has also changed.
			_barkerChannelChanged();

			log("reloadChannelList", "Exit");
		}

		/**
		 * Adds a new listener to the list of those interested in being informed
		 * when the service list is updated.
		 * @method addServiceUpdatedListener
		 * @param {Object} The callback to be called.
		 * @param {Object} The context of the callback to be called.
		 */
		function addServiceUpdatedListener(callback, context) {
			if (callback && context) {
				serviceUpdatedListeners.push({'callbackFunction': callback, 'caller': context});
			}
		}

		/**
		 * Removes a listener from  the list of those interested in being informed
		 * when the service list is updated.
		 * @method removeServiceUpdatedListener
		 * @param {Object} The callback to be called.
		 * @param {Object} The context of the callback to be called.
		 */
		function removeServiceUpdatedListener(callback, context) {
			var i = null,
				numberOfListeners = 0;

			if (callback) {
				numberOfListeners = serviceUpdatedListeners.length;
				for (i = 0; i < numberOfListeners; i++) {
					if (serviceUpdatedListeners[i].callbackFunction === callback && serviceUpdatedListeners[i].caller === context) {
						serviceUpdatedListeners.splice(i, 1);
						break;
					}
				}
			}
		}

		/**
		 * Notifies the interested listeners that the service list has been updated.
		 * @method notifyServiceUpdatedListeners
		 * @private
		 */
		function notifyServiceUpdatedListeners() {
			log("notifyServiceUpdatedListeners", "Enter & Exit");
			var i = null,
				numberOfListeners = serviceUpdatedListeners.length;

			for (i = 0; i < numberOfListeners; i++) {
				serviceUpdatedListeners[i].callbackFunction.call(serviceUpdatedListeners[i].caller);
			}
		}

		function getChannelListByGenreIndex(currentGenre) {
			var channelList = $N.app.genreUtil.getAllChannelsByGenre(currentGenre),
				allChannelList = null,
				serviceType = null;
			if (channelList && channelList.length === 0) {
				switch (currentGenre) {
				case $N.app.genreUtil.GENRE_PPV:
					serviceType = $N.app.constants.CHANNEL_TYPE_PPV;
					break;
				default:
					serviceType = null;
				}
				if (serviceType) {
					allChannelList = $N.platform.btv.EPG.getVideoChannelsOrderedByChannelNumber() || [];
					channelList = allChannelList.filter(function (channel) {
						return (channel._data.type === serviceType);
					});
				}
			}
			return channelList;
		}

		/**
		 * Forces the system to tune to the currently defined barker channel.
		 * @private
		 * @param {Boolean} isFromLaunch
		 */
		function tuneToBarkerChannel(isFromLaunch) {
			log("tuneToBarkerChannel", "Enter");
			var playoutCasId = { casId: (_barkerChannelService.conditionalAccessIDs) ? _barkerChannelService.conditionalAccessIDs[0] : null },
				playout = {
					isFromLaunch: isFromLaunch,
					url: _barkerChannelService.uri,
					isLive: true,
					isMusic: $N.platform.btv.EPG.isRadioChannel(_barkerChannelService),
					serviceId: _barkerChannelService.serviceId
				};

			$N.app.epgUtil.storeChannelToPrefs(_barkerChannelService.serviceId);

			if (isFromLaunch) {
				$N.common.helper.FrontPanelManager.setFrontPanelDisplay($N.app.constants.FRONTPANEL_DISPLAY_MODES.WAKE_UP);
			}
			$N.app.fullScreenPlayer.requestPlayout(
				playout,
				true,
				playoutCasId
			);
			log("tuneToBarkerChannel", "Exit");
		}

		/* Public API */
		return {
			/**
			 * get all channels available in ascending order of channel number
			 * @method getAllChannelsOrderedByChannelNumber
			 * @public
			 */
			getAllChannelsOrderedByChannelNumber: function () {
				return $N.platform.btv.EPG.getVideoChannelsOrderedByChannelNumber();
			},

			/**
			 * get list of blocked channels that is already initialised
			 * @method getBlockedChannelsList
			 * @public
			 */
			getBlockedChannelsList: function () {
				log("getBlockedChannelsList", "Enter & Exit");
				return blockedChannelsArray;
			},

			/**
			 * Initialises the channel manager
			 * @method initialise
			 * @param {Callback} function to be fired once initialisation has completed.
			 * @public
			 */
			initialise: function (callback) {
				$N.platform.btv.EPG.registerRefreshCallback(function () {
					log("EPG.registerRefreshCallback", "Enter");

					reloadChannelList();
					acquireAllServiceRefs(null);
					initialiseBlockedChannelsList();

					// Now notify everyone to update themselves.
					window.setTimeout(notifyServiceUpdatedListeners, 1);

					log("EPG.registerRefreshCallback", "Exit");
				},
					this);

				reloadChannelList();

				$N.platform.system.Preferences.monitorValue($N.app.constants.PREF_BARKER_CHANNEL_CONFIG_PATH, _barkerChannelChanged, this, true);

				// Load a sane default for the barker channel
				_barkerChannelService = $N.app.Config.getConfigValue("barker.channel.service");

				window.setTimeout(function () {
					acquireAllServiceRefs(callback);
				}, 1);

				initialiseBlockedChannelsList();

				// Ensure the barker channel information is reloaded when the
				// system is initialised.
				_barkerChannelChanged();
			},

			/**
			 * initialises the list if favourite channels
			 * @method initialiseFavouritesList
			 * @public
			 */
			initialiseFavouritesList: function () {
				if (!isFavouritesArrayInitialised) {
					favouritesArrayFromMemory = $N.platform.btv.Favourites.getFavouriteChannels(FAV_FOLDER_NAME);
					isFavouritesArrayInitialised = true;
				}
			},

			/**
			 * adds a channel to the permanent list of blocked channels
			 * @method addToBlockedList
			 * @public
			 * @param {Object} channel to be blocked
			 * @param {Callback} function to be fired on successful blocking
			 */
			addToBlockedList: function (channelInfo, successCallback) {
				addChannelToBlockedArray(channelInfo);
				this.saveBlockedChannelsList(successCallback);
			},

			/**
			 * adds multiple channels to the permanent list of blocked channels
			 * @method addToBlockedList
			 * @public
			 * @param {Object} channels to be blocked
			 * @param {Callback} function to be fired on successful blocking
			 * @param {Callback} function to be fired on unsuccessful blocking
			 */
			addMultipleChannelsToBlockedList: function (channelInfoArray, successCallback, failureCallback) {
				var i = null;
				if (channelInfoArray && channelInfoArray.length > 0) {
					for (i = 0; i < channelInfoArray.length; i++) {
						addChannelToBlockedArray(channelInfoArray[i]);
					}
					this.saveBlockedChannelsList(successCallback, failureCallback);
				}
			},

			/**
			 * adds a channel to the list of favourite channels
			 * @method addToFavouritesList
			 * @public
			 * @param {Object} channel to be added
			 */
			addToFavouritesList: function (channelInfo) {
				if (!isFavouritesArrayInitialised) {
					throw ("FavouritesList needs to be intialised first to add to it");
				}
				if (favouritesArrayFromMemory.indexOf(channelInfo) === -1) {
					favouritesArrayFromMemory.push(channelInfo);
					return true;
				} else {
					return false;
				}
			},

			/**
			 * removes a channel from the permanent list of blocked channels
			 * @method removeFromBlockedList
			 * @public
			 * @param {Object} channel to be unblocked
			 * @param {Callback} function to be fired on successful unblocking
			 */
			removeFromBlockedList: function (channelInfo, successCallback) {
				log("removeFromBlockedList", "Enter");
				removeChannelFromBlockedArray(channelInfo);
				if (blockedServiceIdsArray.length > 0) {
					log("removeFromBlockedList", "RJV " + blockedServiceIdsArray.length);
					this.saveBlockedChannelsList(successCallback);
				} else {
					$N.platform.ca.ParentalControl.unsetAllRestrictedServices(function (isSet) {
						if (isSet) {
							if (successCallback) {
								successCallback();
							}
							log("removeFromBlockedList", "Block channels updated");
						}
					});
				}
				log("removeFromBlockedList", "Exit");
			},

			/**
			 * removes all channels from the permanent list of blocked channels
			 * @method removeAllChannelsFromBlockedList
			 * @public
			 * @param {Object} channel to be unblocked
			 * @param {Callback} function to be fired on successful unblocking
			 */
			removeAllChannelsFromBlockedList: function (successCallback) {
				log("removeAllChannelsFromBlockedList", "Enter");
				blockedChannelsArray = [];
				blockedServiceIdsArray = [];
				$N.platform.ca.ParentalControl.unsetAllRestrictedServices(function (isSet) {
					if (isSet) {
						if (successCallback) {
							successCallback();
						}
						log("removeFromBlockedList", "Block channels updated");
					}
				});
				log("removeAllChannelsFromBlockedList", "Exit");
			},

			/**
			 * removes a channel from the list of favourite channels
			 * @method removeFromFavouritesList
			 * @public
			 * @param {Object} channel to be unblocked
			 * @param {Callback} function to be fired on successful unblocking
			 */
			removeFromFavouritesList: function (channelInfo) {
				var indexOfServiceId = null;
				if (!isFavouritesArrayInitialised) {
					throw ("FavouritesList needs to be intialised first to remove channels");
				}
				indexOfServiceId = favouritesArrayFromMemory.indexOf(channelInfo);
				if (indexOfServiceId > -1) {
					favouritesArrayFromMemory.splice(indexOfServiceId, 1);
					return true;
				} else {
					return false;
				}
			},

			/**
			 * updates the permanent list of blocked channels
			 * @method saveBlockedChannelsList
			 * @public
			 * @param {Callback} function to be fired on successful saving
			 * @param {Callback} function to be fired on unsuccessful saving
			 */
			saveBlockedChannelsList: function (successCallback, failureCallback) {
				log("saveBlockedChannelsList", "Enter");
				if (blockedServiceIdsArray.length > 0) {
					$N.platform.ca.ParentalControl.setRestrictedServices(blockedServiceIdsArray, $N.platform.ca.PINHandler.getLocalMasterPin(), function (isSet) {
						if (isSet) {
							if (successCallback) {
								successCallback();
							}
							log("saveBlockedChannelsList", "Block channels saved");
						} else {
							$N.app.ErrorMessage.showSaveBlockChannelsErrorDialog();
							if (failureCallback) {
								failureCallback();
							}
							log("saveBlockedChannelsList", "Block channels save failed");
						}
					});
				}
				log("saveBlockedChannelsList", "Exit");
			},

			/**
			 * updates the permanent list of favourite channels
			 * @method saveFavouritesList
			 * @public
			 */
			saveFavouritesList: function () {
				var isSaveSuccess = null,
					FAV_SAVE_CUT_OFF = 2000,
					saveFavouriteTimeoutHandle = null;
				if (!isFavouritesArrayInitialised) {
					log("saveFavouritesList", "FavouritesList needs to be intialised first to save channels");
					return false;
				}
				if (favouritesArrayFromMemory) {

					saveFavouriteTimeoutHandle = setTimeout(
						function () {
							$N.app.ErrorMessage.showSavingFavoritesDialog();
						},
						FAV_SAVE_CUT_OFF
					);

					favouritesArrayFromMemory.sort($N.app.SortUtil.sortByChannelKey);
					isSaveSuccess = $N.platform.btv.Favourites.setFavouriteChannels(FAV_FOLDER_NAME, favouritesArrayFromMemory);

					$N.app.ErrorMessage.hideSavingFavoritesDialog();
					clearTimeout(saveFavouriteTimeoutHandle);
					saveFavouriteTimeoutHandle = null;

					if (!isSaveSuccess) {
						$N.app.ErrorMessage.showSaveFavoritesErrorDialog();
					}
					isFavouritesArrayInitialised = false;
					favouritesArrayFromMemory = [];
				}
			},

			/**
			 * get list of favourite channels
			 * @method getFavouriteChannels
			 * @public
			 */
			getFavouriteChannels: function () {
				favoriteData = $N.platform.btv.Favourites.getFavouriteChannels(FAV_FOLDER_NAME);
				return favoriteData.sort($N.app.SortUtil.sortByLogicalChannelNum);
			},

			/**
			 * checks if a channel is blocked or not against
			 * a local array of blocked channels
			 * @method isBlockedChannel
			 * @public
			 * @param {Object} channel to be verified
			 */
			isBlockedChannel: function (channel) {
				if (blockedServiceIdsArray && blockedServiceIdsArray.indexOf(channel.channelInfo.serviceId) > -1) {
					return true;
				}
				return false;
			},

			/**
			 * checks if a channel is interactive or not
			 * @method isInteractiveChannel
			 * @public
			 * @param {Object} channel to be verified
			 */
			isInteractiveChannel: function (channel) {
				log("isInteractiveChannel", "Enter");
				var i,
					interactiveChannels = [],
					interactiveChannelsLength = interactiveChannels.length;
				for (i = 0; i < interactiveChannelsLength; i++) {
					if (interactiveChannels[i] === parseInt(channel.logicalChannelNum, 10)) {
						log("isInteractiveChannel", "Exit, returning true");
						return true;
					}
				}
				log("isInteractiveChannel", "Exit, returning false");
				return false;
			},

			/**
			 * checks if a channel is favourite or not against
			 * a local array of favourite channels
			 * @method isFavouriteChannel
			 * @public
			 * @param {Object} channel to be verified
			 */
			isFavouriteChannel: function (channelInfo) {
				var currentFavlist = [];

				if (!isFavouritesArrayInitialised) {
					currentFavlist = $N.platform.btv.Favourites.getFavouriteServiceIds(FAV_FOLDER_NAME);
					channelInfo = channelInfo.serviceId;
				} else {
					currentFavlist = favouritesArrayFromMemory;
				}

				if (currentFavlist && currentFavlist.indexOf(channelInfo) > -1) {
					return true;
				}
				return false;
			},

			getChannelListByGenreIndex: getChannelListByGenreIndex,

			/**
			 * Method to retrieve channel list of different
			 * genres in a cyclic manner
			 * @method toggleChannelsByGenre
			 * @public
			 */
			toggleChannelsByGenre: function () {
				var channelList = getChannelListByGenreIndex(currentGenreIndex),
					genreTitle = $N.app.genreUtil.getGenreTitle(currentGenreIndex);
				if (currentGenreIndex < $N.app.genreUtil.GENRE_ALLCHANNELS) {
					currentGenreIndex++;
				} else {
					currentGenreIndex = 0;
				}
				return {
					"genreTitle" : genreTitle,
					"channelList" : channelList
				};
			},

			/**
			 * Method to reset cycling of genre toggling
			 * and so the next it starts from beginning
			 * @method resetGenreToggling
			 * @public
			 */
			resetGenreToggling: function () {
				currentGenreIndex = 0;
			},

			acquireAllServiceRefs: acquireAllServiceRefs,
			getServiceRef : getServiceRef,
			getServiceIdFromServiceRef : getServiceIdFromServiceRef,
			addServiceUpdatedListener : addServiceUpdatedListener,
			removeServiceUpdatedListener : removeServiceUpdatedListener,
			tuneToBarkerChannel: tuneToBarkerChannel,
			getBarkerChannel : function () {
				return _barkerChannelService;
			}
		};
	}());

}($N || {}));
