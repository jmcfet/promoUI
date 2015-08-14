/**
 * MediaDevice class is a singleton object representing a a single or set of
 * DLNA devices that implement 'gateway' functionality in a home domain.
 * It allows fetching of content from a gateway device that is implmenting
 * a DMS and play back requests for a device implementing DMR.
 * MediaDevice.init must be called prior to signing on to the Home Domain
 * @class $N.services.gateway.dlna.MediaDevice
 * @singleton
 * @author SDermott
 * @requires $N.platform.media.DLNA
 * @requires $N.services.gateway.dlna.EPGServiceFactory
 * @requires $N.services.gateway.dlna.RecordingFactory
 */
/* global define, X2JS */
define('jsfw/services/gateway/dlna/MediaDevice',
	[
		'jsfw/platform/media/DLNA',
		'jsfw/services/gateway/dlna/EPGServiceFactory',
		'jsfw/services/gateway/dlna/RecordingFactory',
		'jsfw/services/sdp/Signon',
		'jsfw/apps/core/AjaxHandler'
	],
	function (DLNA, EPGServiceFactory, RecordingFactory, Signon, AjaxHandler) {
		window.$N = $N || {};
		$N.services = $N.services || {};
		$N.services.gateway = $N.services.gateway || {};
		$N.services.gateway.dlna = $N.services.gateway.dlna || {};
		$N.services.gateway.dlna.MediaDevice = (function () {

			var dmsUDN = null,
				dmrUDN = null,
				user = "",
				password = "",
				convertJSON = null,
				REC_FOLDER = "pvr",
				CHAN_FOLDER = "live",
				BOOKMARKS_FOLDER = "bookmarks",
				TV_EPG = "epg",
				NOW_PLAYING = "nowPlaying",
				APP_DEVICE_ID = "Device-00",
				deviceLookup = {},
				DEFAULT_MIME_TYPE = "vnd.apple.mpegurl",
				DEFAULT_RESOLUTION = { value: "640x480", code: 2},
				DEFAULT_START_TIME_ADJUST = '-P00:02:00',
				DEFAULT_END_TIME_ADJUST = '+P00:05:00',
				lcm = null,
				lcmID = null,
				RECORDING_ERRORS = {
					'402' : 'Bad arguments',
					'501' : 'Action not available',
					'701' : 'Invalid syntax',
					'703' : 'Invalid value',
					'704' : 'No such record schedule ID',
					'730' : 'Record conflict',
					'731' : 'Protected contents',
					'734' : 'No media space'
				};

			function getDurationSeconds(duration) {
				var timeArray = duration.split(":");
				var hoursAsMilliseconds = parseInt(timeArray[0].substring(1) * 3600, 10);
				var minutesAsMillisecond = parseInt(timeArray[1] * 60, 10);
				var secondsAsMillisecond = parseInt(timeArray[2], 10);
				return (hoursAsMilliseconds + minutesAsMillisecond + secondsAsMillisecond);
			}

			function msToTime(duration) {
				var seconds = parseInt((duration/1000)%60, 10),
				minutes = parseInt((duration/(1000*60))%60, 10),
				hours = parseInt((duration/(1000*60*60))%24, 10);
				hours = (hours < 10) ? "0" + hours : hours;
				minutes = (minutes < 10) ? "0" + minutes : minutes;
				seconds = (seconds < 10) ? "0" + seconds : seconds;
				return "P" + hours + ":" + minutes + ":" + seconds;
			}

			function getUrlVars(url) {
			    var vars = {},
			        parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
			            vars[key] = value;
			        });
			    return vars;
			}

			function setDefaultPlaybackInfo(results, callback) {
				var i;
				results.forEach(function(element, index) {
					element.defaultPlaybackInfo = {};
					if (element.res_asArray && element.res_asArray.length > 1) {
						for (i = 0; i < element.res_asArray.length; i++) {
							var mimeType = element.res_asArray[i].protocolInfo.split(":");
							mimeType = mimeType[2].split(";");
							if (mimeType[0] === $N.services.gateway.dlna.MediaDevice.DEFAULT_MIME_TYPE && element.res_asArray[i].resolution === $N.services.gateway.dlna.MediaDevice.DEFAULT_RESOLUTION.value) {
								if (lcm && element.res_asArray[i].protection === "prm.nagra.com") {
									element.defaultPlaybackInfo.prm = true;
									element.defaultPlaybackInfo.lcm = lcm;
									element.defaultPlaybackInfo.lcmID = lcmID;
									element.defaultPlaybackInfo.url = element.res_asArray[i].text + "?license=" + element.defaultPlaybackInfo.lcmID;
									break;
								} else {
									element.defaultPlaybackInfo.prm = false;
									element.defaultPlaybackInfo.lcm = null;
									element.defaultPlaybackInfo.lcmID = null;
									element.defaultPlaybackInfo.url = element.res_asArray[i].text + "?license=clear";
								}
							}
						};
						element.defaultPlaybackInfo.type = element.refID ? element.refID.split(".")[0] : element.id.split(".")[0];
					} else if (element["class"] && element["class"].name === "VOD Channel") {
						var dmsObj = $N.services.gateway.dlna.MediaDevice.getDMSDetails(),
							gwHLSUrl,
							vodRTSPParams,
							vodAssetId,
							vodEntitlement;
						vodRTSPParams = getUrlVars(element.channelID.text);
						element.defaultPlaybackInfo.type = "vod";
						element.defaultPlaybackInfo.prm = true;
						element.defaultPlaybackInfo.lcm = lcm;
						element.defaultPlaybackInfo.lcmID = lcmID;
						element.defaultPlaybackInfo.position = vodRTSPParams.startPos;
						vodAssetId = element.channelID.text.split("/")[3].split("?")[0];
						element.defaultPlaybackInfo.assetID = vodAssetId;
						vodEntitlement = vodRTSPParams.Entitlement;
						if (dmsObj && lcmID) {
							gwHLSUrl = dmsObj.url.split(":")[1];
							element.defaultPlaybackInfo.url = "http:" + gwHLSUrl + ":8081/VOD/" + DEFAULT_RESOLUTION.code + "/master.m3u8?license=" + lcmID + "&rtsp=" + vodAssetId + "%3fEntitlement%3d" + vodEntitlement;
						}
					} else if (element.res_asArray) {
						element.defaultPlaybackInfo.url = element.res_asArray[0].text + "?license=clear";
						element.defaultPlaybackInfo.prm = false;
					}
					if (element.stateVariableCollection) {
						element.stateVariableCollection = element.stateVariableCollection.text.replace(/upnp:/g,'');
						element.stateVariableCollection = convertJSON.xml_str2json(element.stateVariableCollection);
						element.defaultPlaybackInfo.position = getDurationSeconds(element.stateVariableCollection.stateVariableValuePairs.stateVariable.text);
					}
				});
				callback(results);
			}

			function appendDefaultsToItems(results, callback) {
				if (!lcm && $N.env.deviceId && $N.env.deviceId !== "") {
					getLCM(function () {
						setDefaultPlaybackInfo(results, callback);
					});
				} else {
					setDefaultPlaybackInfo(results, callback);
				}
			}

			function getLCM(callback) {
				if (!callback) {
					callback = function () {};
				}
				if ($N.env.deviceId && $N.env.deviceId !== "") {
					$N.services.gateway.dlna.MediaDevice.getGWLicense($N.env.deviceId, function (licenseResponse) {
						if (!licenseResponse.code && licenseResponse !== "") {
							lcm = licenseResponse.license;
							lcmID = licenseResponse.licenseID;
						}
						callback();
					});
				}
			}

			function scheduleSeriesRecording (CDSEvent, callback) {
				if (dmsUDN) {
					$N.platform.media.DLNA.createRecordSchedule(
						dmsUDN, {
							'class': 'OBJECT.RECORDSCHEDULE.QUERY.CONTENTID',
							matchingID : {
			                    _type : 'SI_SERIESID',
			                    __text : CDSEvent.channelID.text + ',' + CDSEvent.seriesID.text
			               	},
							scheduledStartDateTimeAdjust: DEFAULT_START_TIME_ADJUST,
							scheduledDurationAdjust: DEFAULT_END_TIME_ADJUST,
							activePeriod: 'NOW/INFINITY'
						},
						function (data) {
							if (data.handle.code !== 200) {
								data.handle.description = RECORDING_ERRORS[data.handle.code] ? RECORDING_ERRORS[data.handle.code] : data.handle.description;
								callback(data);
							} else {
								checkRecordingConflicts(data, function (response) {
									callback(response);
								});
							}
					});
				}
			}

			function checkRecordingConflicts(data, callback) {
				if (data.id) {
					$N.services.gateway.dlna.MediaDevice.getRecordScheduleConflicts(data.id, function (response) {
						if (typeof response.content.RecordScheduleConflictIDList !== "object") {
						var conflictRes = {};
							conflictRes.scheduleState = "FAILED";
							conflictRes.conflicts = response.content.RecordScheduleConflictIDList;
							conflictRes.handle = {};
							conflictRes.handle.code = 730;
							conflictRes.handle.description = RECORDING_ERRORS['730'];
							callback(conflictRes);
						} else {
							callback(data);
						}
					});
				} else {
					data.handle.code = 704;
					data.handle.description = RECORDING_ERRORS['704'];
					callback(data);
				}
			}

			return {
				/**
				 * Resets to pre-initialised state
				 * @private
				 */
				_resetForUnitTests: function () {
					dmsUDN = null;
					dmrUDN = null;
				},

				/**
				 * The Application Device ID
				 * @property {String} APP_DEVICE_ID
				 */
				APP_DEVICE_ID : APP_DEVICE_ID,

				/**
				 * The default mine type of content
				 * @property {String} DEFAULT_MIME_TYPE
				 */
				DEFAULT_MIME_TYPE : DEFAULT_MIME_TYPE,

				/**
				 * The default resolution or the content
				 * @property {String} DEFAULT_RESOLUTION
				 */
				DEFAULT_RESOLUTION : DEFAULT_RESOLUTION,

				/**
				 * The default start time adjust for recording events - Default = '-P00:02:00'
				 * @property {String} DEFAULT_START_TIME_ADJUST
				 */
				DEFAULT_START_TIME_ADJUST : DEFAULT_START_TIME_ADJUST,

				/**
				 * The default end time adjust for recording events - Default = '+P00:05:00'
				 * @property {String} DEFAULT_END_TIME_ADJUST
				 */
				DEFAULT_END_TIME_ADJUST : DEFAULT_END_TIME_ADJUST,

				/**
				 * Defines constants for player state that can be controlled by another device,
				 * one of: `PLAY`, `PAUSE`, `FF`, `REW`
				 * @property {String} PlayStates
				 * @readonly
				 */
				PlayStates: {
					PLAY: "Play",
					PAUSE: "Pause",
					STOP: "Stop",
					SEEK: "Seek"
				},

				/**
				 * Defines constants for the request resolution from the Gateway HLS Server,
				 * one of: `LOW`, `MED` or `HIGH`
				 * @property {String} RESOLUTION
				 * @readonly
				 */
				RESOLUTION : {
					LOW: { value: "416x224", code: 1},
					MED: { value: "640x480", code: 2},
					HIGH: { value: "1280x720", code: 4}
				},

				/**
				 * Initialises the object ready for use by acquiring the device list.
				 * @method init
				 * @param {function} callback will be executed upon completion
				 */
				init: function (callback) {
					if (!convertJSON) {
						convertJSON = new X2JS();
					}
					this.refreshDeviceList(callback);
					$N.services.sdp.Signon.registerListener(getLCM);
				},

				/**
				 * Initialises the object ready for use by acquiring the device list.
				 * @method initialise
				 * @deprecated use init()
				 * @param {function} callback will be executed upon completion
				 */
				initialise: function (callback) {
					this.init(callback);
				},

				/**
				 * Discovers the gateway device(s) on the network and internally caches the
				 * list for later use. This method is automatically called from init.
				 * This method can take some time to respond as it has to scan the network
				 * so it is advised to only call once via init or when an error
				 * occurs and you wish to ensure the gateway is still available
				 * @method refreshDeviceList
				 * @param {function} callback will be executed upon completion
				 */
				refreshDeviceList: function (callback) {
					$N.platform.media.DLNA.getDeviceList(function (devices) {
						devices.forEach(function (element) {
							if (element.manufacturer === "Nagra" && element.modelDescription === "OpenTV 5 Gateway") {
								dmsUDN = element.UDN;
								deviceLookup[element.UDN] = element;
							}
							if (element.manufacturer === "Nagra" && element.modelDescription === "OpenTV 5 Gateway Client") {
								dmrUDN = element.UDN;
							}
						});
						callback();
					}, $N.platform.media.DLNA.SERVICETYPE.BROWSE.concat($N.platform.media.DLNA.SERVICETYPE.AV_TRANSPORT));
				},

				/**
				 * Synchronously returns a list of device objects containing id and name
				 * properties.
				 * @method getDevices
				 * @return {Array} of objects containing id and name proprties
				 */
				getDevices: function () {
					return [{
						id: dmrUDN,
						name: "OpenTV Gateway"
					}];
				},

				/**
				 * Synchronously returns device details object containing information about the device
				 * @method getDMSDetails
				 * @return {Object} Object containing id,name,url,icon, etc values
				 */
				getDMSDetails : function () {
					if (dmsUDN) {
						return deviceLookup[dmsUDN];
					}
					return null;
				},

				/**
				 * Asynchronously returns gateway device status
				 * @method isOnline
				 * @param {Function} callback executes upon completion
				 * @return {Boolean} true if gateway is online, false if unreachable
				 */
				isOnline : function (callback) {
					if (dmsUDN) {
						$N.platform.media.DLNA.connectionManager(dmsUDN, 'GetCurrentConnectionInfo', function (results) {
							if (results.handle.code === 200 && results.content.Status === 'OK') {
								callback(true);
							} else {
								callback(false);
							}
						});
					} else {
						callback(false);
					}
				},

				/**
				 * Synchronously returns LCM from the Gateway
				 * Must be signed on before calling this method
				 * @method getLCM
				 * @return {String} LCM - License from the gateway
				 */
				getLCM : function () {
					if (lcm) {
						return lcm;
					}
					return null;
				},

				/**
				 * Synchronously returns LCM ID from the Gateway
				 * Must be signed on before calling this method
				 * @method getLCMId
				 * @return {String} lcmID - Device License ID from the gateway
				 */
				getLCMId : function () {
					if (lcmID) {
						return lcmID;
					}
					return null;
				},

				/**
				 * Asynchronously returns an array of live channels that are exposed by the gateway
				 * device. The objects returned adhere to the $N.data.EPGService data model.
				 * @method fetchChannels
				 * @param {Function} callback executes upon completion
				 * @param {String} startIndex start index of the range of items to be returned. Optional - Default = 0
				 * @param {String} itemCount a limit items to be returned. Optional - Default = 200
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				fetchChannels: function (callback, startIndex, itemCount) {
					var channels,
						config = {
						containerId: CHAN_FOLDER,
						sortCriteria: "",
						filter: '*',
						startIndex: startIndex,
						itemCount: itemCount
					};
					if (dmsUDN) {
						$N.platform.media.DLNA.browseDevice(dmsUDN, config, 'BrowseDirectChildren', function (results) {
							if (results.handle.code === 200) {
								appendDefaultsToItems(results.item, function (channels) {
									callback($N.services.gateway.dlna.EPGServiceFactory.mapArray(channels));
								});
							} else {
								callback(results);
							}
						});
						return true;
					}
					return false;
				},

				/**
				 * Asynchronously returns an array of completed PVR recordings that are exposed by the gateway
				 * device. The objects returned adhere to the $N.data.Recording data model.
				 * @method fetchRecordings
				 * @param {Function} callback executes upon completion
				 * @param {String} startIndex start index of the range of items to be returned. Optional - Default = 0
				 * @param {String} itemCount a limit items to be returned. Optional - Default = 200
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				fetchRecordings: function (callback, startIndex, itemCount) {
					var recordings,
						config = {
						containerId: REC_FOLDER,
						sortCriteria: "",
						filter: '*',
						startIndex: startIndex,
						itemCount: itemCount
					};
					if (dmsUDN) {
						$N.platform.media.DLNA.browseDevice(dmsUDN, config, 'BrowseDirectChildren', function (results) {
							if (results.handle.code === 200) {
								appendDefaultsToItems(results.item, function (recordings) {
									callback($N.services.gateway.dlna.RecordingFactory.mapArray(recordings));
								});
							} else {
								callback(results);
							}
						});
						return true;
					}
					return false;
				},

				/**
				 * Asynchronously returns an array of scheduled PVR recordings that are exposed by the gateway
				 * device. The objects returned adhere to the $N.data.Recording data model.
				 * @method fetchScheduledRecordings
				 * @param {Function} callback executes upon completion
				 * @param {String} startIndex start index of the range of items to be returned. Optional - Default = 0
				 * @param {String} itemCount a limit items to be returned. Optional - Default = 200
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				fetchScheduledRecordings: function (callback, startIndex, itemCount) {
					var config = {
						sortCriteria: "",
						filter: '*',
						startIndex: startIndex,
						itemCount: itemCount,
					};
					if (dmsUDN) {
						$N.platform.media.DLNA.browseRecordSchedules(dmsUDN, config, function (results) {
							if (results.handle.code === 200) {
								callback($N.services.gateway.dlna.RecordingFactory.mapArray(results.item));
							} else {
								callback(results);
							}
						});
						return true;
					}
					return false;
				},

				/**
				 * Asynchronously returns an array of scheduled PVR recordings that are exposed by the gateway
				 * device. The objects returned adhere to the $N.data.Recording data model.
				 * @method fetchScheduledTasks
				 * @param {String} scheduleID The ID of the Parent Schedule
				 * @param {Function} callback executes upon completion
				 * @param {String} startIndex start index of the range of items to be returned. Optional - Default = 0
				 * @param {String} itemCount a limit items to be returned. Optional - Default = 200
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				fetchScheduledTasks: function (scheduleID, callback, startIndex, itemCount) {
					var config = {
						recordScheduleID : scheduleID,
						sortCriteria: "",
						filter: '*',
						startIndex: startIndex,
						itemCount: itemCount
					};
					if (dmsUDN) {
						$N.platform.media.DLNA.browseRecordTasks(dmsUDN, config, function (results) {
							if (results.handle.code === 200) {
								callback($N.services.gateway.dlna.RecordingFactory.mapArray(results.item));
							} else {
								callback(results);
							}
						});
						return true;
					}
					return false;
				},

				/**
				 * Asynchronously returns a bookmark information for the content
				 * @method fetchBookmarks
				 * @param {Function} callback executes upon completion - returns an array of bookmarks with a contentID & position in seconds
				 * @param {String} startIndex start index of the range of items to be returned. Optional - Default = 0
				 * @param {String} itemCount a limit items to be returned. Optional - Default = 200
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				fetchBookmarks: function (callback, startIndex, itemCount) {
					var config = {
						containerId: BOOKMARKS_FOLDER,
						sortCriteria: "",
						filter: '*',
						startIndex: startIndex,
						itemCount: itemCount
					};
					if (dmsUDN) {
						$N.platform.media.DLNA.browseDevice(dmsUDN, config, 'BrowseDirectChildren', function (bookmarks) {
							if (bookmarks.handle.code === 200 && bookmarks.NumberReturned > 0) {
								bookmarks.item.forEach(function(element, index) {
									if (element.stateVariableCollection) {
										element.stateVariableCollection = element.stateVariableCollection.text.replace(/upnp:/g,'');
										element.stateVariableCollection = convertJSON.xml_str2json(element.stateVariableCollection);
										element.position = getDurationSeconds(element.stateVariableCollection.stateVariableValuePairs.stateVariable.text);
									}
									element.contentId = element.bookmarkedObjectID ? element.bookmarkedObjectID.text : null;
								});
								callback(bookmarks.item);
							}
						});
						return true;
					}
					return false;
				},

				/**
				 * Requests play out of content identified in parameters to the given deviceId. The given
				 * device must be functioning as a DMR.
				 * @method sendPlayRequest
				 * @param {String} deviceId unique id as provided in the getDevices response
				 * @param {Object} parameters contains contentId to identify the content as returned by fetchRecordings or fetchChannels
				 * @param {Function} callback executes upon completion
				 * @param {String} seekTime Time to seek in seconds
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				sendPlayRequest: function (deviceId, parameters, callback, seekTime) {
					if (dmsUDN) {
						$N.platform.media.DLNA.controlDevice(deviceId, "Stop", function () {
							$N.platform.media.DLNA.sendContent(dmsUDN, deviceId, parameters.contentId, "SetAVTransportURI", function (res) {
								$N.platform.media.DLNA.controlDevice(deviceId, "Play", function () {
									var options = {};
									if (seekTime) {
										options.Unit = "REL_TIME";
										options.Target = parseInt(seekTime, 10);
										$N.platform.media.DLNA.controlDevice(deviceId, "Seek", function () {}, options);
									}
								});
								callback(res);
							},"video/mpeg");
						});
						return true;
					}
					return false;
				},

				/**
				 * Stops transcoding of content on the GW HLS server, requires the URL of the content that you wish to stop.
				 * @method stopTranscoding
				 * @param {String} current active url
				 * @param {Function} callback executes upon completion
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				stopTranscoding: function (url, callback) {
					if (dmsUDN) {
						var httpRequest = new $N.apps.core.AjaxHandler(),
							stopURL = url + "&stop=yes",
							handle = {};
						httpRequest.responseCallback = function (xmlhttp) {
							if (xmlhttp && xmlhttp.status === 200) {
								handle.code = xmlhttp.status;
								handle.description = "stopped successfully"
								callback(handle);
							} else {
								handle.code = xmlhttp.status;
								handle.description = "error";
								callback(handle);
							}
						};
						httpRequest.requestData(stopURL, 4000, false);
						return true;
					}
					return false;
				},

				/**
				 * Retrieves information for currently playing content on the given device.
				 * @method fetchContent
				 * @param {String} deviceId ID of the device to retrieve the content from
				 * @param {Function} callback Function to be called once the content information has been retrieved
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				fetchContent: function (callback) {
					var fetchedContent,
						config = {
						containerId: NOW_PLAYING,
						sortCriteria: "",
						filter: '*',
						startIndex: "0",
						itemCount: "1"
					};
					if (dmsUDN) {
						$N.platform.media.DLNA.browseDevice(dmsUDN, config, 'BrowseDirectChildren', function (results) {
							if (results.handle.code === 200) {
								if (results.item.length === 0) {
									if (dmrUDN) {
										$N.platform.media.DLNA.fetchContent(dmrUDN, function (results) {
											callback(results);
											return true;
										});
									}
								} else {
									appendDefaultsToItems(results.item, function (fetchedContent) {
										if (fetchedContent[0].defaultPlaybackInfo.type === 'live') {
											callback($N.services.gateway.dlna.EPGServiceFactory.mapArray(fetchedContent)[0]);
										} else if (fetchedContent[0].defaultPlaybackInfo.type === 'pvr') {
											callback($N.services.gateway.dlna.RecordingFactory.mapArray(fetchedContent)[0]);
										} else if (fetchedContent[0].defaultPlaybackInfo.type === 'vod') {
											var fetchedVOD = {
												_data : {
													defaultPlaybackInfo : fetchedContent[0].defaultPlaybackInfo
												},
												title : fetchedContent[0].title.text,
												id : fetchedContent[0].defaultPlaybackInfo.assetID
											};
											callback(fetchedVOD);
										}
									});
								}
							} else {
								callback(results);
							}
						});
						return true;
					}
					return false;
				},

				/**
				 * Sets the playback state of the given device
				 * @method controlDevice
				 * @param {String} deviceId
				 * @param {String} state
				 * @param {Function} callback
				 * @param {Object} options
				 */
				controlDevice: function (state, callback, options) {
					if (dmrUDN && state) {
						$N.platform.media.DLNA.controlDevice(dmrUDN, state, callback, options);
						return true;
					}
					return false;
				},

				/**
				 * Asynchronously requests a recording for the given event and returns the
				 * results via the given callback method
				 * @method scheduleEventRecording
				 * @param {Object} CDSEvent the event to record
				 * @param {Boolean} recordSeries true to record series, false to record single event
				 * @param {Function} callback executes upon completion
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				scheduleEventRecording: function (CDSEvent, recordSeries, callback) {
					if (dmsUDN) {
						if (recordSeries) {
							scheduleSeriesRecording(CDSEvent,callback);
						} else {
							$N.platform.media.DLNA.createRecordSchedule(
								dmsUDN, {
									title : CDSEvent.programTitle || CDSEvent.title,
									'class': 'OBJECT.RECORDSCHEDULE.DIRECT.CDSEPG',
									scheduledCDSObjectID: CDSEvent.id,
									scheduledStartDateTimeAdjust: DEFAULT_START_TIME_ADJUST,
									scheduledDurationAdjust: DEFAULT_END_TIME_ADJUST,
									activePeriod: 'NOW/INFINITY'
								},
								function (data) {
									if (data.handle.code !== 200) {
										data.handle.description = RECORDING_ERRORS[data.handle.code] ? RECORDING_ERRORS[data.handle.code] : data.handle.description;
										callback(data);
									} else {
										checkRecordingConflicts(data, function (response) {
											callback(response);
										});
									}
								});
						}
						return true;
					}
					return false;
				},

				/**
				 * Asynchronously requests a recording for the given event and returns the
				 * results via the given callback method
				 * @method scheduleMDSEventRecording
				 * @param {Object} MDSEvent the event to record
				 * @param {Boolean} recordSeries true to record series, false to record single event
				 * @param {Function} callback executes upon completion
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				scheduleMDSEventRecording: function (MDSEvent, recordSeries, callback) {
					if (dmsUDN) {
						var config = {};
						config.containerId = TV_EPG;
						config.searchCriteriaType = 'upnp:programID';
						config.searchCriteria = MDSEvent.dvbEventId;
						config.searchSyntax = 'contains';

						$N.platform.media.DLNA.searchDevice(dmsUDN, config, function (result) {
							var CDSEvent = null;
							if (result.handle.code === 200) {
								if (result.item.length === 1) {
									CDSEvent = result.item[0];
									$N.services.gateway.dlna.MediaDevice.scheduleEventRecording(CDSEvent, recordSeries, callback);
								} else {
									var response = {};
									response.scheduleState = "FAILED";
									response.handle = {
										code: 400,
										description: 'CDS event not found'
									};
									callback(response);
									return false;
								}
							} else {
								callback(result);
							}
						});
						return true;
					}
					return false;
				},

				/**
				 * Asynchronously requests a recording for a given time window
				 * @method scheduleRecordingByWindow
				 * @param {String} title Title of the recording
				 * @param {String} channelID the CDS ID of the channel to record
				 * @param {String} startTime The start time in EPOCH format Milliseconds
				 * @param {String} endTime The end time in EPOCH format Milliseconds
				 * @param {Function} callback executes upon completion
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				scheduleRecordingByWindow: function (title, channelID, startTime, endTime, callback) {
					if (dmsUDN) {
						var duration = msToTime(endTime - startTime),
							startTimeString = new Date(startTime).toISOString();

						$N.platform.media.DLNA.createRecordSchedule(
							dmsUDN, {
								title : title,
								'class': 'OBJECT.RECORDSCHEDULE.DIRECT.CDSNONEPG',
								scheduledCDSObjectID : channelID,
								scheduledStartDateTimeAdjust: DEFAULT_START_TIME_ADJUST,
								scheduledDurationAdjust: DEFAULT_END_TIME_ADJUST,
								scheduledStartDateTime:startTimeString,
								scheduledDuration:duration,
								activePeriod: 'NOW/INFINITY'
							},
							function (data) {
								if (data.handle.code !== 200) {
									data.handle.description = RECORDING_ERRORS[data.handle.code] ? RECORDING_ERRORS[data.handle.code] : data.handle.description;
									callback(data);
								} else {
									checkRecordingConflicts(data, function (response) {
										callback(response);
									});
								}
							});
					}
					return true;
				},

				/**
				 * Checks for Recording Task conflicts on the CDS and returns an array of tasks that are conflicting
				 * @method getEventRecordingConflicts
				 * @param {String} eventId unique identifier of the event to check
				 * @param {Function} callback executes upon completion
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				getEventRecordingConflicts: function (eventId, callback) {
					if (dmsUDN) {
						$N.platform.media.DLNA.getRecordTaskConflicts(dmsUDN, eventId, callback);
						return true;
					}
					return false;
				},

				/**
				 * Checks for Recording Schedule conflicts on the CDS and returns an array of schedules that are conflicting
				 * @method getRecordScheduleConflicts
				 * @param {String} scheduleID unique identifier of the event to check
				 * @param {Function} callback executes upon completion
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				getRecordScheduleConflicts: function (scheduleID, callback) {
					if (dmsUDN) {
						$N.platform.media.DLNA.getRecordScheduleConficts(dmsUDN, scheduleID, callback);
						return true;
					}
					return false;
				},

				/**
				 * Asynchronously deletes a recording task and returns the
				 * results via the given callback method
				 * @method deleteRecordingTask
				 * @param {Object} taskId Unique task identifier
				 * @param {Object} callback executes upon completion
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				deleteRecordingTask: function (taskId, callback) {
					if (dmsUDN) {
						$N.platform.media.DLNA.deleteRecordTask(dmsUDN, taskId, callback);
						return true;
					}
					return false;
				},

				/**
				 * Asynchronously deletes a recording schedule and returns the
				 * results via the given callback method
				 * @method deleteRecordingSchedule
				 * @param {Object} recordScheduleID Unique Schedule identifier
				 * @param {Object} callback executes upon completion
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				deleteRecordingSchedule: function (recordScheduleID, callback) {
					if (dmsUDN) {
						$N.platform.media.DLNA.deleteRecordSchedule(dmsUDN, recordScheduleID, callback);
						return true;
					}
					return false;
				},

				/**
				 * Asynchronously deletes a recording task and returns the
				 * results via the given callback method
				 * @method deleteRecording
				 * @param {Object} taskId Unique task identifier
				 * @param {Object} callback executes upon completion
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				deleteRecording: function (taskId, callback) {
					if (dmsUDN) {
						$N.platform.media.DLNA.destroyObject(dmsUDN, taskId,
							function (data) {
								if (data.handle.code !== 200) {
									data.handle.description = RECORDING_ERRORS[data.handle.code] ? RECORDING_ERRORS[data.handle.code] : data.handle.description;
									callback(data.handle);
								} else {
									callback(data.handle);
								}
							});
						return true;
					}
					return false;
				},

				/**
				 * Asynchronously saves a bookmark to the bookmarks folder
				 * @method saveBookmark
				 * @param {Object} contentID Unique identifier content
				 * @param {Object} time Position to be be saved in Milliseconds
				 * @param {Object} callback executes upon completion
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				saveBookmark: function (contentID, time, callback) {

					if (dmsUDN) {
						var found = false,
							relativeTimePosition = msToTime(time*1000),
							checkForBookmark = {};
						checkForBookmark.containerId = BOOKMARKS_FOLDER;
						checkForBookmark.sortCriteria = "";
						checkForBookmark.filter = '*';
						checkForBookmark.startIndex = '0';
						checkForBookmark.itemCount = '200';
						/*
						startXMLStateVariable = '&lt;upnp:stateVariableCollection serviceName="AVTransport"&gt;\n' +
							'&amp;lt;upnp:stateVariableValuePairs xmlns:avs=&amp;quot;urn:schemas-upnp-org:av:avs&amp;quot; xmlns:xsi=&amp;quot;http://www.w3.org/2001/XMLSchema-instance&amp;quot; xsi:schemaLocation=&amp;quot;urn:schemas-upnp-org:av:avs\n' +
							'http://www.upnp.org/schemas/av/avs-v1-20060531.xsd&amp;quot;&amp;gt;\n' +
							'&amp;lt;avs:stateVariable variableName=&amp;quot;RelativeTimePosition&amp;quot;&amp;gt;',
						endXMLStateVariable = '&amp;lt;/avs:stateVariable&amp;gt; &amp;lt;/upnp:stateVariableValuePairs&amp;gt;
						*/
						$N.platform.media.DLNA.browseDevice(dmsUDN, checkForBookmark, 'BrowseDirectChildren', function (data) {
							var i;
							if (data.item.length > 0) {
								for (i = 0; i < data.item.length; i++) {
									if (contentID === data.item[i].bookmarkedObjectID.text) {
										found = true;
										var updateConfig = {},
											currentTimeValue = data.item[i].stateVariableCollection.text.split('<avs:stateVariable variableName="RelativeTimePosition">');
										currentTimeValue = currentTimeValue[1].split('</avs:stateVariable>');
										currentTimeValue = currentTimeValue[0];
										updateConfig.objectID = data.item[i].id;
										updateConfig.currentValue = currentTimeValue;
										updateConfig.newValue = relativeTimePosition;
										$N.platform.media.DLNA.updateObject(dmsUDN, updateConfig, callback);
										break;
									}
								}
							}
							if (!found) {
								var config = {
									item : {
										'dc:title' : 'Bookmark_' + contentID,
										'upnp:bookmarkedObjectID': contentID,
										'upnp:deviceUDN' : APP_DEVICE_ID,
										'upnp:stateVariableCollection' : '&lt;upnp:stateVariableValuePairs&gt;' +
											'&lt;avs:stateVariable variableName=&quot;RelativeTimePosition&quot;&gt;' + relativeTimePosition + '&lt;/avs:stateVariable&gt;' +
											'&lt;/upnp:stateVariableValuePairs&gt;'
									}
								};
								$N.platform.media.DLNA.createObject(dmsUDN, BOOKMARKS_FOLDER, config, callback);
							}
						});
						return true;
					}
					return false;
				},

				/**
				 * Asynchronously deletes a bookmark and returns the
				 * results via the given callback method
				 * @method deleteBookmark
				 * @param {Object} bookmarkId Unique bookmark identifier
				 * @param {Object} callback executes upon completion
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				deleteBookmark: function (bookmarkId, callback) {
					if (dmsUDN) {
						$N.platform.media.DLNA.destroyObject(dmsUDN, bookmarkId, callback);
						return true;
					}
					return false;
				},

				/**
				 * Asynchronously searches the PVR folder for recording by title
				 * @method searchRecordings
				 * @param {String} title The title string to search for
				 * @param {Function} callback executes upon completion
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				searchRecordings: function (title, callback) {
					if (dmsUDN) {
						var config = {};
						config.containerId = REC_FOLDER;
						config.searchCriteriaType = 'dc:title';
						config.searchCriteria = title;
						config.searchSyntax = 'contains';

						$N.platform.media.DLNA.searchDevice(dmsUDN, config, function (results) {
							if (results.handle.code === 200) {
								callback($N.services.gateway.dlna.RecordingFactory.mapArray(results.item));
							} else {
								callback(results);
							}
						});
						return true;
					}
					return false;
				},

				/**
				 * Returns the Smart Card ID of the OTV Gateway
				 * @method getGWSmartCardID
				 * @param {Object} callback executes upon completion
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				getGWSmartCardID: function (callback) {
					if (dmsUDN) {
						$N.platform.media.DLNA.getNagraPRMServiceValue(dmsUDN, 'smartcardID', function (response) {
							if (response.handle.code === 200) {
								if (typeof response.content.stringIDValue === "object") {
									response.content.stringIDValue = "";
								}
								callback(response.content.stringIDValue);
							} else {
								callback(response);
							}

						});
						return true;
					}
					return false;
				},

				/**
				 * Returns a License string for submitted uPnPDeviceID
				 * @method getGWLicense
				 * @param {Object} uPnPDeviceID Unique Device identifier
				 * @param {Object} callback executes upon completion
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				getGWLicense: function (uPnPDeviceID, callback) {
					if (dmsUDN) {
						$N.platform.media.DLNA.getNagraPRMServiceLicense(dmsUDN, uPnPDeviceID, function (response) {
							if (response.handle.code === 200) {
								if (typeof response.content.license === "object") {
									response.content.license = "";
								}
								callback(response.content);
							} else {
								callback(response);
							}
						});
						return true;
					}
					return false;
				},

				/**
				 * Asynchronously returns metadata for a given CDS object id
				 * @method fetchMetadata
				 * @param {String} cdsObjectID id of the CDS Object eg. "live.000100010003"
				 * @param {Function} callback executes upon completion
				 * @return {Boolean} true if request was sent, false if not initialised for example
				 */
				fetchMetadata: function (cdsObjectID, callback) {
					var config = {
						containerId: cdsObjectID,
						sortCriteria: "",
						filter: '*',
						startIndex: 0,
						itemCount: 1
					};
					if (dmsUDN) {
						$N.platform.media.DLNA.browseDevice(dmsUDN, config, 'BrowseMetadata', function (results) {
							if (results.handle.code === 200 && results.NumberReturned > 0) {
								callback(results.item[0]);
							} else {
								callback(results);
							}
						});
						return true;
					}
					return false;
				}
			};
		}());
		return $N.services.gateway.dlna.MediaDevice;
	}
);