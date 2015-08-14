/**
 * This class is responsible for handling IP EPG data and fetches the list
 * of IP channels adding them to the CCOM EPG component, then fetches the
 * events for those channels in a paged way.  By setting the subscribed
 * channels in this class the service objects in cache get appended with an
 * isSubscribed property.  NPVR channels are also loaded and matched to
 * IP/DVB channels.
 * @class $N.services.sdp.IPDataLoader
 * @static
 * @singleton
 * @requires $N.apps.core.Log
 * @requires $N.services.sdp.ServiceFactory
 * @requires $N.services.sdp.EPG
 * @requires $N.platform.btv.PersistentCache
 * @requires $N.platform.btv.EPGCache
 * @requires $N.Config
 * @requires $N.services.sdp.Subscriptions
 * @author Mahesh Jagadeesan
 */
/* global define */
define('jsfw/services/sdp/IPDataLoader',
	[
		'jsfw/apps/core/Log',
		'jsfw/services/sdp/ServiceFactory',
		'jsfw/services/sdp/EPG',
		'jsfw/platform/btv/PersistentCache',
		'jsfw/platform/btv/EPGCache',
		'jsfw/Config',
		'jsfw/services/sdp/Subscriptions'
	],
	function (Log, ServiceFactory, EPG, PersistentCache, EPGCache, Config, Subscriptions) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.sdp = $N.services.sdp || {};

		$N.services.sdp.IPDataLoader = (function () {
			// The following line tells jslint not to worry about the fact that EPGService and EPGEvent are not
			// defined before being used
			/*global setTimeout, clearTimeout */

			var log = new $N.apps.core.Log("sdp", "IPDataLoader"),
				LOG_LEVEL_INFO = 'info',
				LOG_LEVEL_ERROR = 'error',
				msBetweenEventAdd = 3,
				hoursPerFetch = 2,
				maxDays = 3,
				PAGED_WINDOW_TO,
				WINDOW_TO,
				epgRefreshInterval = 12,
				subscribedChannels = [],
				listeners = [],
				locale,
				newServiceListener,
				chansForFetch,
				vStart,
				vEnd,
				maxEpgTime,
				cachedEpg,
				initialEventsLoaded = false,
				initialEventsLoadedCallback = null,
				channelsLoadedCallback = function () {},
				epgStart,
				aclService,
				btvService,
				isEventsCaching = false,
				cacheEvents = true,
				DEFAULT_REFRESH_SUBSCRIPTIONS_INTERVAL_MS = 12 * 3600000,
				refreshSubscriptionsIntervalTime = null,
				refreshSubscriptionInterval;

			/**
			 * Determines whether a URI refers to a DVB service.
			 * @method isDVB
			 * @private
			 * @param uri {String} URI to check.
			 * @return {Boolean} true if the URI refers to a DVB service; false otherwise.
			 */
			function isDVB(uri) {
				return (uri && uri.length > 8 && uri.substr(0, 4) === 'dvb:') ? true : false;
			}

			/**
			 * Invokes all the registered listeners
			 * @method applyListeners
			 * @private
			 */
			function applyListeners() {
				log("applyListeners", "Enter", LOG_LEVEL_INFO);
				var i;
				for (i = (listeners.length - 1); i >= 0; i--) {
					log("applyListeners", "Applying listener...");
					listeners[i].callback.apply(listeners[i].callerContext, []);
				}
				log("applyListeners", "Exit", LOG_LEVEL_INFO);
			}

			/**
			 * Processes the EPG event information array returned by SDP (using a supplied function), and
			 * invokes a callback upon completion. Calls itself recursively until the entire array is processed.
			 * @method processEventArray
			 * @private
			 * @param arrayToProcess {Array} array returned by SDP
			 * @param processor {Function} this is the function that knows what to do with each array element
			 * @param finishedCallback {Function} callback to be invoked when the array has been processed
			 */
			function processEventArray(arrayToProcess, processor, finishedCallback) {
				setTimeout(function processEventItem() {
					if (arrayToProcess && arrayToProcess.length > 0) {
						var item = arrayToProcess.shift();
						processor(item, finishedCallback);
						setTimeout(processEventItem, msBetweenEventAdd);
					} else {
						finishedCallback();
					}
				}, msBetweenEventAdd);
			}

			/**
			 * Callback function invoked when a call to SDP's getDetEvtsByChannelList method is successful.
			 * @method getDetEvtsByChannelListPass
			 * @private
			 * @param resultArray {Array} array of (EPG) event objects
			 */
			function getDetEvtsByChannelListPass(resultArray) {
				log("getDetEvtsByChannelListPass", "Got results, processing...");

				processEventArray(
					resultArray,
					function (item) {
						cachedEpg.cacheEvent(item);
					},
					function () {
						if (!initialEventsLoaded && initialEventsLoadedCallback) {
							initialEventsLoaded = true;
							initialEventsLoadedCallback();
						}
						loadNextDetEvtsByChannelList();
					}
				);
			}

			/**
			 * Invoked when a call to SDP's getDetEvtsByChannelList method fails. This method ignores the error
			 * and tries to load the next set of events.
			 * @method getDetEvtsByChannelListFail
			 * @private
			 * @param errCode {String} error code returned by SDP
			 */
			function getDetEvtsByChannelListFail(errCode) {
				loadNextDetEvtsByChannelList();
			}

			/**
			 * Makes an asynchronous call to SDP to retrieve (EPG) event information for a list of channels. This method is called only after
			 * an initial call to SDP has already been made by loadDetEvtsByChannelList
			 * @method loadNextDetEvtsByChannelList
			 * @private
			 */
			function loadNextDetEvtsByChannelList() {
				var nextStart = vStart + PAGED_WINDOW_TO;

				if (nextStart < maxEpgTime && cacheEvents) {
					vStart = nextStart;
					vEnd = vStart + PAGED_WINDOW_TO;
					$N.services.sdp.EPG.fetchEventsByWindow(chansForFetch, vStart, vEnd, getDetEvtsByChannelListPass, getDetEvtsByChannelListFail);
				} else {
					isEventsCaching = false;
					applyListeners();
					setTimeout(function () {
						isEventsCaching = true;
						maxEpgTime += epgRefreshInterval;
						loadNextDetEvtsByChannelList();
					}, epgRefreshInterval);
				}
			}

			/**
			 * Makes an asynchronous call to SDP to retrieve event information for a list of channels. Subsequent calls
			 * to SDP for fetching event information are made by loadNextDetEvtsByChannelList
			 * @method loadDetEvtsByChannelList
			 * @private
			 */
			function loadDetEvtsByChannelList() {
				log("loadDetEvtsByChannelList", "Enter", LOG_LEVEL_INFO);
				chansForFetch = [];
				if (cacheEvents) {
					cachedEpg.fetchServices(function (services) {
						var numServices = services.length,
							channel,
							start = new Date();

						for (channel = 0; channel < numServices; channel++) {
							if (!isDVB(services[channel].uri)) {
								chansForFetch.push(services[channel].serviceId + "");
							}
						}
						// Calculate the initial time window
						start.setMinutes(0, 0, 0);
						if (epgStart === undefined) {
							vStart = start.getTime();
						} else {
							vStart = epgStart.getTime();
						}

						vEnd = vStart + PAGED_WINDOW_TO;
						maxEpgTime = vStart + WINDOW_TO;

						log("loadDetEvtsByChannelList", "Window: " + new Date(vStart) + " - " + new Date(vEnd));
						$N.services.sdp.EPG.fetchEventsByWindow(chansForFetch, vStart, vEnd, getDetEvtsByChannelListPass, getDetEvtsByChannelListFail); //TODO: locale
					});
				}
				log("loadDetEvtsByChannelList", "Exit", LOG_LEVEL_INFO);
			}

			/**
			 * Processes channel information retrieved from SDP, and marks channels as NPVR. Upon completion, also
			 * invokes all the callbacks registered by other callers.
			 * @method getNPVRChanSuccess
			 * @param resultArray {Array} list of channels returned by SDP
			 * @private
			 */
			function getNPVRChanSuccess(resultArray) {
				log("getNPVRChanSuccess", "Enter", LOG_LEVEL_INFO);
				var npvrIPLookup = {},
					npvrDVBLookup = {},
					numNPVRChannels = resultArray.length,
					i,
					ccomServices = cachedEpg.getServices(),
					numServices = ccomServices.length,
					channel,
					npvrChan;
				for (i = 0; i < numNPVRChannels; i++) {
					npvrIPLookup[resultArray[i].uid] = resultArray[i];
					if (resultArray[i].carryingNetwork) {
						npvrDVBLookup[resultArray[i].carryingNetwork] = resultArray[i];
					}
				}
				for (i = 0; i < numServices; i++) {
					channel = ccomServices[i];
					npvrChan = npvrDVBLookup[channel.serviceId];
					if (npvrChan && isDVB(channel.uri)) {
						channel.isNPVR = true;
						channel.sdpUID = npvrChan.uid;
					} else if (npvrIPLookup[channel.serviceId]) {
						channel.isNPVR = true;
					} else {
						channel.isNPVR = false;
					}
					cachedEpg.updateService(ccomServices[i].serviceId, channel);
				}
				if (numServices > 0 && numNPVRChannels > 0) {
					applyListeners();
				}
				log("getNPVRChanSuccess", "Exit", LOG_LEVEL_INFO);
			}

			/**
			 * Logs a failed attempt to retrieve channel information from SDP
			 * @method getNPVRChanFail
			 * @param result {Object} data object returned by SDP
			 * @private
			 */
			function getNPVRChanFail(result) {
				log("getNPVRChanFail", "Enter", LOG_LEVEL_INFO);
				log("getNPVRChanFail", "Exit", LOG_LEVEL_INFO);
			}

			/**
			 * Processes the NPVR package information returned by SDP. Using the package uids,
			 * sends out another request to fetch channel information for each of the packages
			 * from SDP.
			 * @method getNPVRSubscriptionSuccess
			 * @param resultArray {Array} data object returned by SDP.
			 * @private
			 */
			function getNPVRSubscriptionSuccess(resultArray) {
				log("getNPVRSubscriptionSuccess", "Enter", LOG_LEVEL_INFO);
				var packages = {},
					totalPackages = resultArray.length,
					pkgUIDs = '',
					packageUID,
					currentPackage,
					i;
				log('getNPVRSubscriptionSuccess', 'Total number of packages: ' + totalPackages.toString());
				// Get rid of duplicate packages if any
				for (i = 0; i < totalPackages; i++) {
					currentPackage = resultArray[i];
					packageUID = currentPackage.purchasedItemUID;
					if (!packages[packageUID]) {
						packages[packageUID] = currentPackage;
						pkgUIDs += packageUID + ',';
					}
				}
				pkgUIDs = pkgUIDs.substr(0, pkgUIDs.length - 1);
				log('getNPVRSubscriptionSuccess', 'Packages: ' + pkgUIDs);
				btvService.getChannelsByPkgPattern(this, getNPVRChanSuccess, getNPVRChanFail, pkgUIDs, locale);
				log("getNPVRSubscriptionSuccess", "Exit", LOG_LEVEL_INFO);
			}

			/**
			 * Logs a failed attempt to get NPVR subscription information
			 * @method getNPVRSubscriptionFail
			 * @param result {Object} data object returned by SDP
			 * @private
			 */
			function getNPVRSubscriptionFail(result) {
				log("getNPVRSubscriptionFail", "Enter", LOG_LEVEL_INFO);
				log("getNPVRSubscriptionFail", result);
				log("getNPVRSubscriptionFail", "Exit", LOG_LEVEL_INFO);
			}

			/**
			 * Processes the channel list returned by the SDP, and adds them to CCOM.epg.services using the addService method.
			 * Also updates the list of subscribed channels.
			 * @method getAllChannelsPass
			 * @private
			 * @param resultArray {Array} array of channels returned by the SDP
			 */
			function getAllChannelsPass(resultArray) {
				log('getAllChannelsPass', 'Enter', LOG_LEVEL_INFO);
				var channelIndex,
					channel,
					serviceCacheCount = 0;
				isEventsCaching = true;
				// remove the listener for remote service updates since we call applySubscriptionToChannels here
				cachedEpg.removeEPGServicesUpdatedListener(newServiceListener);

				if (resultArray.length === 0) {
					channelsLoadedCallback();
				} else {
					for (channelIndex = 0; channelIndex < resultArray.length; channelIndex++) {
						channel = resultArray[channelIndex];
						cachedEpg.cacheService(channel, function () {
							serviceCacheCount++;
							if (serviceCacheCount === resultArray.length) {
								cachedEpg.addEPGServicesUpdatedListener(newServiceListener);
								$N.services.sdp.Subscriptions.refreshSubscriptions(function () {
									channelsLoadedCallback();
									startRefreshSubscriptionInterval();
								});
								setTimeout(function () {
									loadDetEvtsByChannelList();
								}, 1000);
							}
						});
					}
				}
				log('getAllChannelsPass', 'Exit', LOG_LEVEL_INFO);
			}

			/**
			 * Logs a failed getAllChannels call to SDP
			 * @method getAllChannelsFail
			 * @private
			 * @param errorCode {String}
			 */
			function getAllChannelsFail(errorCode) {
				log("getAllChannelsFail", "Enter", LOG_LEVEL_INFO);
				log("getAllChannelsFail", errorCode);
				log("getAllChannelsFail", "Exit", LOG_LEVEL_INFO);
			}

			/**
			 * Starts the interval that calls to Subscriptions to refresh the subscription lookup
			 * @method startRefreshSubscriptionInterval
			 * @private
			 */
			function startRefreshSubscriptionInterval() {
				if (refreshSubscriptionInterval) {
					clearInterval(refreshSubscriptionInterval);
					refreshSubscriptionInterval = null;
				}
				refreshSubscriptionInterval = setInterval(function () {
					$N.services.sdp.Subscriptions.refreshSubscriptions();
				}, refreshSubscriptionsIntervalTime);
			}

			return {
				/**
				 * Initialises the class from the supplied configuration object. Also sets up a listener to
				 * update EPG information when new services are added / removed, and refreshes the list of
				 * channels that the user is subscribed to.
				 * @method init
				 * @param configuration {Object} JavaScript object used to initialise the class. This object
				 *		should have the following attributes:
				 *
				 *		locale <String> - the user's locale. Example: `en_gb`. Defaults to `en_gb` if not supplied
				 *		refreshInterval <Number> - time in hours after which EPG data must be refreshed. Defaults to 12 if not supplied
				 *		maxDays <Number> - number of days for which EPG data must be fetched. Defaults to 7 if not supplied
				 *		fetchDuration <Number> - time in hours for which EPG data must be fetched. Defaults to 2 if not supplied
				 *		forceRamCache <Boolean> - true by default if false will use persistent cache
				 *		epgStart <Date> Date/Time the EPG data is required to start from.  Defaults to current hour if not supplied
				 *		cacheEvents <Boolean> - true by default if set to false will only cache services and not events
				 * 		refreshSubscriptionsInterval <Number> - time in hours after which subscriptions should be refreshed. Defaults to 12 if not supplied
				 */
				init: function (configuration) {
					log("initialise", "Enter", LOG_LEVEL_INFO);
					var refreshSubscriptionTO,
						timeToSettle = 10000;

					aclService = $N.services.sdp.ServiceFactory.get("AcquiredContentListService");
					btvService = $N.services.sdp.ServiceFactory.get("BTVService");

					if ($N.Config.PERSISTENT_CACHE && $N.platform.btv.PersistentCache.isDBAvailable() && (!configuration || !configuration.forceRAMCache)) {
						cachedEpg = $N.platform.btv.PersistentCache;
					} else {
						cachedEpg = $N.platform.btv.EPGCache;
					}

					if (!configuration) {
						// default configuration
						configuration = {
							refreshInterval: 12,
							maxDays: 7,
							fetchDuration: 2,
							locale: "en_gb",
							cacheEvents: true,
							refreshSubscriptionsInterval: DEFAULT_REFRESH_SUBSCRIPTIONS_INTERVAL_MS
						};
						if (cachedEpg === $N.platform.btv.PersistentCache) {
							configuration.forceRAMCache = false;
						} else {
							configuration.forceRAMCache = true;
						}
					}

					if (configuration.cacheEvents === false) {
						cacheEvents = false;
					}
					refreshSubscriptionsIntervalTime = configuration.refreshSubscriptionsInterval ? configuration.refreshSubscriptionsInterval * 3600000 : DEFAULT_REFRESH_SUBSCRIPTIONS_INTERVAL_MS;
					if (cachedEpg) {
						locale = configuration.locale;
						epgStart = configuration.epgStart;

						epgRefreshInterval = configuration.refreshInterval * 3600 * 1000;
						maxDays = configuration.maxDays;
						hoursPerFetch = configuration.fetchDuration;
						PAGED_WINDOW_TO = hoursPerFetch * 3600 * 1000; // EPG Data window end, in milliseconds.
						WINDOW_TO = maxDays * ((24 / hoursPerFetch) * PAGED_WINDOW_TO);
						newServiceListener = function () {
							if (refreshSubscriptionTO) {
								clearTimeout(refreshSubscriptionTO);
							}
							refreshSubscriptionTO = setTimeout(function () {
								$N.services.sdp.Subscriptions.refreshSubscriptions(function () {});
								startRefreshSubscriptionInterval();
							}, timeToSettle);
						};
						cachedEpg.addEPGServicesUpdatedListener(newServiceListener);
					} else {
						log('initialise', 'No cache available!', LOG_LEVEL_ERROR);
						if (channelsLoadedCallback) {
							channelsLoadedCallback(false);
						}
						if (initialEventsLoadedCallback) {
							initialEventsLoadedCallback(false);
						}
					}
					log("initialise", "Exit", LOG_LEVEL_INFO);
				},

				/**
				 * Registers a callback function to be invoked when EPG data load / update is successful
				 * @method registerListener
				 * @param callbackFunction {Function} callback function to be invoked
				 * @param callerContext {Object} context in which callbackFunction will be invoked
				 */
				registerListener: function (callbackFunction, caller) {
					log("registerListener", "Enter", LOG_LEVEL_INFO);
					listeners.push({
						callerContext: caller,
						callback: callbackFunction
					});
					log("registerListener", "New Listener: " + caller);
					log("registerListener", "Exit", LOG_LEVEL_INFO);
				},

				/**
				 * Unregisters a previously registered callback for EPG data load / update events.
				 * @method unregisterListener
				 * @param callbackFunction {Function} the callback to be unregistered
				 */
				unregisterListener: function (callbackFunction) {
					log("unregisterListener", "Enter", LOG_LEVEL_INFO);
					var i;
					for (i = 0; i < listeners.length; i++) {
						if (listeners[i].callback === callbackFunction) {
							listeners.splice(i, 1);
							log("unregisterListener", "Unregistered listener: " + callbackFunction.toString());
							break;
						}
					}
					log("unregisterListener", "Exit", LOG_LEVEL_INFO);
				},

				/**
				 * Retrieves a list of all IP and NPVR channels from SDP, processes the channel list, and caches the data. Also updates the list of subscribed
				 * channels. This is an asynchronous call, so if you want to perform any actions after the information
				 * is retrieved, register a callback using the registerListener method (see above).
				 * @method loadIPData
				 * @async
				 */
				loadIPData: function () {
					if (cachedEpg) {
						$N.services.sdp.EPG.fetchAllChannels(getAllChannelsPass, getAllChannelsFail);
					}
				},

				/**
				 * Retrieves NPVR subscription information from SDP. For each package subscribed to, this method also
				 * retrieves the list of channels, and updates the list of subscribed channels. This is an asynchronous
				 * call, so if you want to perform any action after the information is retrieved, register a
				 * callback using the registerListener method (see above).
				 * @method loadNPVRData
				 * @async
				 */
				loadNPVRData: function () {
					log("loadNPVRData", "Enter", LOG_LEVEL_INFO);
					if (cachedEpg && aclService && aclService.getByProductType) {
						//only provided in sdp2.x
						aclService.getByProductType(this, getNPVRSubscriptionSuccess, getNPVRSubscriptionFail, "NPVR");
					} else {
						log("loadNPVRData", "ACL Service not set!", LOG_LEVEL_ERROR);
					}
					log("loadNPVRData", "Exit", LOG_LEVEL_INFO);
				},

				/**
				 * Callback to be fired after the initial events have been loaded
				 * @method setInitialEventsLoadedCallback
				 * @param {Function} callback function that will be invoked when events are loaded initially
				 */
				setInitialEventsLoadedCallback: function (callback) {
					initialEventsLoadedCallback = callback;
				},

				/**
				 * Fires the given callback once channels have been loaded
				 * @method setChannelsLoadedCallback
				 * @param {Function} callback function that will be invoked when events are loaded initially
				 */
				setChannelsLoadedCallback: function (callback) {
					if (!callback) {
						callback = function () {};
					}
					channelsLoadedCallback = callback;
				},

				/**
				 * Determines if EPG Events are being cached
				 * @method isFetchingEvents
				 * @return {Boolean} true if EPG Events are being cached, false otherwise
				 */
				isFetchingEvents: function () {
					return isEventsCaching;
				}
			};
		}());
		return $N.services.sdp.IPDataLoader;
	}
);
