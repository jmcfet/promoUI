/*global BaseService*/

//Stub for SDP CDNSelectionService
function CDNSelectionService() {}
CDNSelectionService.prototype = new BaseService();
CDNSelectionService.prototype.init = function () {
	this._serviceName = "CDNSelectionService";
};
CDNSelectionService.prototype.getEndPointsByChannelUID = function (jsCaller, jsSuccessCallback, jsFailureCallback, serviceId) {
	this.invokeMethod(jsCaller, jsSuccessCallback, jsFailureCallback, "getEndPointsByChannelUID", serviceId);
};

/**
 * This class provides a URL to the application from a list of recommended URLs (for a given service
 * or asset) that are provided from a Service Head End such as SDP.
 * If the recommended URL fails to play or causes QOS to degrade then this class will fire an event to
 * inform the App of a different URL it should use to tune to the same service/asset.
 *
 * @class $N.platform.output.CDNLibrary
 * @singleton
 *
 * @author Gareth Stacey
 */
define('jsfw/platform/output/CDNLibrary',
	[],
	function () {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};

		$N.platform.output.CDNLibrary = (function () {

			var eventListeners = {},
				urls = [],
				currentUrlIndex = -1,
				currentRecommendedUrl = null,
				lastRequestedServiceId = null,
				lastRequestedCallback = function () {},
				LOCAL_STORAGE_URL_NAME = "cdnUrls",
				monitorQOSInterval = null,
				QOS_CHECK_TIME = 1000,
				player = null,
				isPlaying = false,
				playbackAgent,
				networkAgent,
				storage = window.localStorage,
				newCDNRecommendedEvent = "NewCDNRecommended",
				cDNListExhaustedEvent = "CDNListExhausted",
				cdnSelectionService,
				minimumBuffer = 5, //if buffer ever goes below this will recommend another cdn
				goodQosBufferThreshold = 15, //if buffer drops below this then prepare to recommend another cdn
				bufferThresholdTimeoutSeconds = 4, //if buffer is still lower than bufferThreshold after this given time then recommend another cdn
				checkQosAfterPlaying = 15, //amount of seconds to wait after playback before monitoring qos
				checkBufferThresholdTimeout = null,
				beginMonitoringAfterPlayingTimeout = null,
				DEFAULT_BUFFER_DURATION = 100; //use large number so that when buffer begins it is not bigger than this number

			/**
			 * Used to output message to console.log
			 * This can be replaced with the Ninja Log call
			 * @method log
			 * @private
			 * @param {String} method
			 * @param {String} message
			 */
			function log(method, message) {
				console.log("CDNLibrary." + method + ", " + message);
			}

			/**
			 * Returns the index at which the given url is located within the urlArray.
			 * If url doesn't exist in array then -1 is returned
			 * @method getUrlIndex
			 * @private
			 * @param {Array} urlArray Array of objects each containing at least a url property
			 * @param {String} url The url to find
			 * @return {Number} The index at which the URL is located or -1 if not found
			 */
			function getUrlIndex(urlArray, url) {
				var i;
				if (urlArray && url) {
					for (i = 0; i < urlArray.length; i++) {
						if (urlArray[i].url === url) {
							return i;
						}
					}
				}
				return -1;
			}

			/**
			 * Calls the registered callbacks for the given event and passes in the given parameter
			 * @method fireEvent
			 * @private
			 * @param {String} event The event name to fire
			 * @param {Object} parameter the parameter to pass to any callbacks
			 */
			function fireEvent(event, parameter) {
				var listeners = eventListeners[event],
					i;
				if (listeners) {
					for (i = 0; i < listeners.length; i++) {
						listeners[i](parameter);
					}
				}
			}

			/**
			 * Stops the interval running that checks for QOS change
			 * @method stopMonitoringQOSInterval
			 * @private
			 */
			function stopMonitoringQOSInterval() {
				if (monitorQOSInterval) {
					clearInterval(monitorQOSInterval);
					monitorQOSInterval = null;
				}
			}

			/**
			 * Stops the given timeout
			 * @method stopCheckBufferThresholdTimeout
			 * @private
			 * @param {Number} timeout The timeout to stop
			 */
			function stopTimeout(timeout) {
				if (timeout) {
					clearTimeout(timeout);
					timeout = null;
				}
			}

			/**
			 * Cancels all timeouts and intervals
			 * @method cancelTimers
			 * @private
			 */
			function cancelTimers() {
				stopMonitoringQOSInterval();
				stopTimeout(beginMonitoringAfterPlayingTimeout);
				stopTimeout(checkBufferThresholdTimeout);
			}

			/**
			 * Returns a recommended URL. If isUserTuning is passed in then checks local storage
			 * for previous successfully tuned URL otherwise returns the next highest prioirity url
			 * that has previously been returned by the Service Head End
			 * @method getRecommendedUrl
			 * @private
			 * @param {Boolean} isUserTuning Set called due to user tuning to different channel
			 * @return {String} The URL that is recommended or null if no URLs are available
			 */
			function getRecommendedUrl(isUserTuning) {
				var storedUrls = JSON.parse(storage.getItem(LOCAL_STORAGE_URL_NAME)),
					serviceId = lastRequestedServiceId,
					urlIndex = storedUrls ? getUrlIndex(urls, storedUrls[serviceId]) : -1,
					url;
				currentUrlIndex++;
				stopMonitoringQOSInterval();
				if (isUserTuning && storedUrls && storedUrls[serviceId] && urlIndex !== -1) {
					url = urls[urlIndex];

					//put url to front of urls array
					urls.slice(urlIndex, 1);
					urls.unshift(url);

					currentRecommendedUrl = urls[0].url;
					return currentRecommendedUrl;
				} else {
					if (currentUrlIndex >= urls.length) {
						log("getRecommendedUrl", "Firing CDNListExhausted event");
						fireEvent(cDNListExhaustedEvent, serviceId);
						return null;
					} else {
						currentRecommendedUrl = urls[currentUrlIndex].url;
						return currentRecommendedUrl;
					}

				}
			}

			/**
			 * Callback when URLs have been recieved by the Service Head End
			 * @method urlsReceived
			 * @private
			 * @param {Object} Object consisting of uid, and urls
			 */
			function urlsReceived(object) {
				log("urlsReceived", "List of URLs received from SDP");
				var url;
				if (object.uid === lastRequestedServiceId && object.urls.length > 0) {
					urls = object.urls;
					url = getRecommendedUrl(true);
					if (url) {
						log("urlsReceived", "Passing URL to UI: " + url);
						lastRequestedCallback(url);
					}
				} else {
					log("urlsReceived", "CDNListExhausted Event fired");
					fireEvent(cDNListExhaustedEvent, lastRequestedServiceId);
				}
			}

			/**
			 * Fires the NewCDNRecommendedEvent to the app with a new url if available
			 * @method recommendUrl
			 * @private
			 */
			function recommendUrl() {
				var recommendedUrl = getRecommendedUrl();
				cancelTimers();
				if (recommendedUrl) {
					log("recommendUrl", "Firing NewCDNRecommended event with URL: " + recommendedUrl);
					fireEvent(newCDNRecommendedEvent, recommendedUrl);
				}
			}

			/**
			 * Called upon successful playback
			 * @method storeUrlToLocalStorage
			 * @private
			 */
			function storeUrlToLocalStorage() {
				var storedUrls = JSON.parse(storage.getItem(LOCAL_STORAGE_URL_NAME)) || {};
				if (lastRequestedServiceId) {
					storedUrls[lastRequestedServiceId] = currentRecommendedUrl;
					log("storeUrlToLocalStorage", "Storing URL: " + currentRecommendedUrl + " for service: " + lastRequestedServiceId);
					storage.setItem(LOCAL_STORAGE_URL_NAME, JSON.stringify(storedUrls));
				}
			}

			/**
			 * Checks if the buffer is lower than the good QOS threshold and recommends another CDN if so
			 * @method checkIfBufferBelowThreshold
			 * @private
			 */
			function checkIfBufferBelowThreshold() {
				if (playbackAgent.bufferedDuration < goodQosBufferThreshold) {
					log("checkIfBufferBelowThreshold", "Buffer is still lower than good QOS threshold so recommend another CDN");
					recommendUrl();
				} else {
					checkBitrate();
				}
			}

			/**
			 * Called regularly when the selected bitrate is the lowest available bitrate
			 * If the buffer duration becomes low then new url is recommended
			 * @method monitorQos
			 * @private
			 */
			function monitorQos() {
				var bufferDuration = playbackAgent.bufferedDuration,
					recommendedUrl,
					timeoutSecs = bufferThresholdTimeoutSeconds;
				if (bufferDuration < minimumBuffer) {
					log("monitorQos", "Buffer is lower than the minimum buffer so recommend another CDN");
					recommendUrl();
				} else if (bufferDuration < goodQosBufferThreshold) {
					log("monitorQos", "Buffer is lower than good QOS threshold");
					stopMonitoringQOSInterval();
					if ((bufferDuration - bufferThresholdTimeoutSeconds) < minimumBuffer) {
						timeoutSecs = bufferDuration - minimumBuffer;
					}
					checkBufferThresholdTimeout = setTimeout(checkIfBufferBelowThreshold, timeoutSecs * 1000);
				}
			}

			/**
			 * Returns the lowest bitrate from the given bitrates
			 * @method getLowestAvailableBitrate
			 * @private
			 * @param {Array} availableBitrates Array of available bitrates in bits/sec
			 * @return {Number} The lowest bitrate in bits/sec
			 */
			function getLowestAvailableBitrate(availableBitrates) {
				var i,
					lowestBitrate = availableBitrates[0];
				for (i = 1; i < availableBitrates.length; i++) {
					if (availableBitrates[i] < lowestBitrate) {
						lowestBitrate = availableBitrates[i];
					}
				}
				return lowestBitrate;
			}

			/**
			 * Fired whenever the available bitrates or selected bitrate changes.
			 * If the selected bitrate is the lowest bitrate available then starts monitoring QOS,
			 * else it stops any monitoring that is currently running
			 * @method checkBitrate
			 * @private
			 */
			function checkBitrate() {
				var selectedBitrate = networkAgent.adaptiveStreaming.selectedBitrate;
				var availableBitrates = networkAgent.adaptiveStreaming.availableBitrates;
				if (selectedBitrate && availableBitrates && getLowestAvailableBitrate(availableBitrates) === selectedBitrate && isPlaying) {
					log("checkBitrate", "At lowest bitrate so monitoring QOS");
					monitorQos();
					monitorQOSInterval = setInterval(monitorQos, QOS_CHECK_TIME);
				} else {
					log("checkBitrate", "Not lowest bitrate or not playing so no need to monitor QOS");
					cancelTimers();
				}
			}

			/**
			 * Fired when the player connects to a new stream
			 * @method playerConnectedListener
			 * @private
			 */
			function playerConnectedListener() {
				log("playerPlayingListener", "Player loadstart event fired");
				isPlaying = false;
			}

			/**
			 * Fired when the player successfully plays back.
			 * Stores the current url to local storage and monitors the QOS
			 * @method playerPlayingListener
			 * @private
			 */
			function playerPlayingListener() {
				log("playerPlayingListener", "Player playing event fired");
				storeUrlToLocalStorage();
				isPlaying = true;
				beginMonitoringAfterPlayingTimeout = setTimeout(checkBitrate, checkQosAfterPlaying * 1000);
			}

			/**
			 * Fired when the player fails to playback.
			 * Fires the newCDNRecommendedEvent with a new URL for the app to use.
			 * @method playerErrorListener
			 * @private
			 */
			function playerErrorListener() {
				log("playerErrorListener", "Player error/abort event fired");
				isPlaying = false;
				recommendUrl();
			}

			return {

				/**
				 * Registers the necessary events with the player and network agent. Must be called prior to calling
				 * any other CDNLibrary public methods.
				 * @method init
				 * @param {Object} configurationObj With properties `playerElement`, `minimumBuffer`, `goodQosBufferThreshold`, `bufferThresholdTimeoutSeconds`, `checkQosAfterPlaying`
				 *
				 * `playerElement` should be the player element (video tag for example) in the DOM.
				 * `minimumBuffer` is the number of seconds that must be in the buffer. If buffer drops below this another CDN is recommended.
				 * `goodQosBufferThreshold` is the number of seconds that the buffer can drop to before preparing to recommend another CDN.
				 * `bufferThresholdTimeoutSeconds` is the number of seconds to wait after the buffer hits the goodQosBufferThreshold before recommending another CDN.
				 * `checkQosAfterPlaying` is the number of seconds to wait before monitoring QOS after playback begins
				 */
				init: function (configurationObj) {
					playbackAgent = window.playbackAgent;
					networkAgent = window.networkAgent;
					cdnSelectionService = new CDNSelectionService();
					cdnSelectionService.init();
					player = configurationObj.playerElement;
					minimumBuffer = configurationObj.minimumBuffer || minimumBuffer; //if buffer ever goes below this will recommend another cdn
					goodQosBufferThreshold = configurationObj.goodQosBufferThreshold || goodQosBufferThreshold; //if buffer drops below this then prepare to recommend another cdn
					bufferThresholdTimeoutSeconds = configurationObj.bufferThresholdTimeoutSeconds || bufferThresholdTimeoutSeconds; //if buffer is still lower than bufferThreshold after this given time then recommend another cdn
					checkQosAfterPlaying = configurationObj.checkQosAfterPlaying || checkQosAfterPlaying; //amount of seconds to wait after playback before monitoring qos
					networkAgent.selectedBitrateChanged.connect(checkBitrate);
					networkAgent.availableBitratesChanged.connect(checkBitrate);
					player.addEventListener("loadstart", playerConnectedListener);
					player.addEventListener("error", playerErrorListener);
					player.addEventListener("abort", playerErrorListener);
					player.addEventListener("playing", playerPlayingListener);
				},

				/**
				 * Retrieves a recommended URL for the given service then fires the callback
				 * passing in the URL
				 * @method fetchUrlForService
				 * @param {String} serviceId The serviceId for which the app requires a URL
				 * @param {Function} callback Called with a url
				 */
				fetchUrlForService: function (serviceId, callback) {
					log("fetchUrlForService", "Requesting a url for service id: " + serviceId);
					urls = [];
					currentUrlIndex = -1;
					currentRecommendedUrl = null;
					cancelTimers();
					lastRequestedServiceId = serviceId;
					lastRequestedCallback = callback;
					cdnSelectionService.getEndPointsByChannelUID(this, urlsReceived, function () {urlsReceived({uid: serviceId, urls: []}); }, serviceId);
				},

				/**
				 * Retrieves a recommended URL for the given asset then fires the callback
				 * passing in the URL
				 * @method fetchUrlForAsset
				 * @param {String} assetId
				 * @param {Function} callback Called with a url
				 */
				fetchUrlForAsset: function (assetId, callback) {
					//TODO: add support for VOD assets
				},

				/**
				 * Adds an event listener for the Event identified by the supplied event name,
				 * once the event is fired the callback function will be executed. Multiple
				 * event listeners can be added for the same event.
				 * @method addEventListener
				 * @param {String} eventName
				 * @param {Function} callback
				 */
				addEventListener: function (eventName, callback) {
					log("addEventListener", " Adding listener for event: " + eventName);
					if (eventListeners[eventName] === undefined) {
						eventListeners[eventName] = [];
					}
					eventListeners[eventName].push(callback);
				},

				/**
				 * Removes a previously registered event listener identified by the given
				 * event name and callback
				 * @method removeEventListener
				 * @param {String} eventName
				 * @param {Function} callback
				 */
				removeEventListener: function (eventName, callback) {
					log("removeEventListener", " Removing listener for event: " + eventName);
					var listeners = eventListeners[eventName],
						i;
					for (i = 0; i < listeners.length; i++) {
						if (listeners[i] === callback) {
							listeners.splice(i, 1);
						}
					}
				}

				/**
				 * Fired when a new CDN URL is recommended either due to the player
				 * having an error or due to QOS degrading
				 * @event NewCDNRecommended
				 * @param {String} url The recommended url
				 */

				/**
				 * Fired when all the recommended URLs have failed due to an error
				 * or QOS degrading
				 * @event CDNListExhausted
				 */
			};
		}());
		return $N.platform.output.CDNLibrary;
	}
);