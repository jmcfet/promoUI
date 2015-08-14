/**
 * @class EPGUtil
 * @author mbrown
 * @static
 * @requires $N.platform.system.Preferences
 * @requires $N.apps.core.Log
 * @requires $N.app.constants
 * @requires $N.app.EventUtil
 * @requires $N.apps.core.Language
 * #depends EventUtil.js
 * #depends ../Constants.js
 */
var $N = $N || {};
var EPGUtil = function () {
	var Preferences = $N.platform.system.Preferences,
		log = new $N.apps.core.Log("Helper", "EPGUtil"),
		constants = $N.app.constants,
		BAD_EVENT_ID = $N.app.EventUtil.BAD_EVENT_ID,
		BAD_SERVICE_ID = $N.app.EventUtil.BAD_SERVICE_ID,
		FLAGS_ROOT = '../../../customise/resources/images/%RES/flags/',
		FLAGS_CC = 'Icn_cc.png',
		FLAGS_DOLBY = 'Icn_dolby.png',
		FLAGS_HD = 'Icn_hd.png',
		FLAGS_STARTOVER = 'Icn_startOver.png',
		FLAGS_REMINDER = 'Icn_reminder.png',
		DEFAULT_PROMO_IMAGE_PATH_END = '/0000.jpg',
		sortLookup,
		currentFetchId = 0,
		channelLogoTemplate = "",
		// default must be first in the list
		sortOptions = ["channelNumberAsc", "channelNumberDec", "channelNameAsc", "channelNameDec", "showTitle"];

	$N.apps.core.Language.adornWithGetString(EPGUtil);

	/**
	 * Creates and executes a ResultSet and registers the callback.
	 * @method executeResultSet
	 * @async
	 * @param {String} select The SQL select
	 * @param {String} criteria The SQL where clause
	 * @param {Function} processSuccess The post process function to use when a result set is fetched successfully
	 * @param {Function} processFailure The post process function to use if an error occurs
	 * @param {Number} maxResults The number of results to return per fetch
	 */
	function executeResultSet(select, criteria, order, processSuccess, processFailure, maxResults) {
		log("executeResultSet", "Enter");
		var RECORD_COUNT = 20,
			resultSet = CCOM.EPG.getEventsRSByQuery(select, criteria, order),
			results = [],
			fetchNextOKFunction,
			fetchNextFailedFunction;

		fetchNextOKFunction = function (data) {
			if (data.results && data.results.length) {
				log("executeResultSet", "fetchNextOK, got data records: " + data.results.length);
				results = results.concat([].slice.call(data.results, 0));
				if ((maxResults && results.length < maxResults) || data.results.length === RECORD_COUNT) {
					log("executeResultSet", "fetchNextOK, fetching more records");
					resultSet.fetchNext(RECORD_COUNT);
				} else {
					log("executeResultSet", "fetchNextOK, no more to fetch");
					resultSet.reset();
					resultSet.removeEventListener('fetchNextOK', fetchNextOKFunction);
					resultSet.removeEventListener('fetchNextFailed', fetchNextFailedFunction);
					processSuccess(results);
					results = null;
				}
			} else {
				log("executeResultSet", "fetchNextOK, no array of data returned");
				resultSet.reset();
				resultSet.removeEventListener('fetchNextOK', fetchNextOKFunction);
				resultSet.removeEventListener('fetchNextFailed', fetchNextFailedFunction);
				processSuccess(results);
				results = null;
			}
		};

		fetchNextFailedFunction = function (result) {
			log("executeResultSet", "Error executing result set: " + result.error.message, "error");
			processFailure();
			resultSet.reset();
			resultSet.removeEventListener('fetchNextOK', fetchNextOKFunction);
			resultSet.removeEventListener('fetchNextFailed', fetchNextFailedFunction);
			results = null;
		};

		if (resultSet.error) {
			log("executeResultSet", "Error creating result set: " + resultSet.error.message, "error");
			processFailure();
			resultSet.reset();
			results = null;
		} else {
			log("executeResultSet", "Registering Listeners");
			resultSet.addEventListener('fetchNextOK', fetchNextOKFunction);
			resultSet.addEventListener('fetchNextFailed', fetchNextFailedFunction);

			if (maxResults < RECORD_COUNT) {
				log("executeResultSet", "Fetching data for " + maxResults + " records");
				resultSet.fetchNext(maxResults);
			} else {
				log("executeResultSet", "Fetching data for " + RECORD_COUNT + " records");
				resultSet.fetchNext(RECORD_COUNT);
			}
		}
	}

	sortLookup = {
		channelNumberAsc: {
			eventFunction: $N.app.SortUtil.eventListChannelSortNumberAsc,
			channelFunction: $N.app.SortUtil.channelSortNumberAsc
		},
		channelNumberDec: {
			eventFunction: $N.app.SortUtil.eventListChannelSortNumberDec,
			channelFunction: $N.app.SortUtil.channelSortNumberDec
		},
		channelNameAsc: {
			eventFunction: $N.app.SortUtil.eventListChannelSortNameAsc,
			channelFunction: $N.app.SortUtil.channelSortNameAsc
		},
		channelNameDec: {
			eventFunction: $N.app.SortUtil.eventListChannelSortNameDec,
			channelFunction: $N.app.SortUtil.channelSortNameDec
		},
		showTitle: {
			eventFunction: $N.app.SortUtil.eventListEventSortNameAsc,
			channelFunction: null
		}
	};

	/**
	 * @method getChannelLogoByUniqueServiceId
	 * @param {String} uniqueServiceId
	 */
	function getChannelLogoByUniqueServiceId(uniqueServiceId) {
		if (!uniqueServiceId) {
			return "";
		}
		if (!channelLogoTemplate) {
			channelLogoTemplate = $N.app.epgUtil.getPosterImageServer() + $N.app.Config.getConfigValue("epg.channelLogo.pattern");
		}
		return channelLogoTemplate.replace("%UNIQUE_SERVICE_ID%", uniqueServiceId);
	}

	/**
	 * @method getChannelLogoUrl
	 * @param {Number} serviceId
	 * @return {String}
	 */
	function getChannelLogoUrl(serviceId) {

		var service;
		if (!serviceId || serviceId === BAD_SERVICE_ID) {
			return "";
		}
		service = $N.platform.btv.EPG.getChannelByServiceId(serviceId);
		if (service) {
			return getChannelLogoByUniqueServiceId(service._data.uniqueServiceId);
		}
		return "";
	}

	/**
	 * Returns an array of flag URLs associated with the given event object.
	 * @method getFlagUrls
	 * @param {object} event The CCOM event object.
	 * @return {array} An array of strings representing the URLs of the flags.
	 */
	function getFlagUrls(event, program) {
		var flags = [],
			// rating = $N.services.sdp.Ratings.getRatingLookupByPrecedence()[event.parentalRating],
			ratingValue;
		if (program && program.subTitles) {
			flags.push(FLAGS_ROOT + FLAGS_CC);
		}
		if (program && program.definition === "HD") {
			flags.push(FLAGS_ROOT + FLAGS_HD);
		}
		if (program && program.audioMode === "1") {
			flags.push(FLAGS_ROOT + FLAGS_DOLBY);
		}
		return flags;
	}


	/**
	 * Returns a default event object, for use when no event data is present
	 * @method getDefaultEvent
	 * @param {Number} defaultServiceId
	 * @param {Number} defaultStartTime
	 * @param {Number} defaultEndTime
	 * @return {Object}
	 */
	function getDefaultEvent(defaultServiceId, defaultStartTime, defaultEndTime) {
		var service,
			isRadioChannel,
			defaultTitle = EPGUtil.getString("noEventTitle");
		if (defaultServiceId !== BAD_SERVICE_ID) {
			service = $N.platform.btv.EPG.getChannelByServiceId(defaultServiceId);
		}
		if (service && service.serviceName && service.serviceType) {
			isRadioChannel = $N.platform.btv.EPG.isRadioChannel(service);
			if (isRadioChannel) {
				defaultTitle = service.serviceName;
			}
		}
		return {
			title: defaultTitle,
			serviceId: defaultServiceId || BAD_SERVICE_ID,
			startTime: defaultStartTime || '',
			endTime: defaultEndTime || '',
			shortDesc: EPGUtil.getString("noEventDescription"),
			eventId: BAD_EVENT_ID
		};
	}

	/**
	 * Returns an array containing a default event object if the events array is null or empty
	 * @method getDefaultEventIfNoEvents
	 * @param {Array} events
	 * @param {Number} defaultServiceId
	 * @param {Number} defaultStartTime
	 * @param {Number} defaultEndTime
	 * @return {Object}
	 */
	function getDefaultEventIfNoEvents(events, defaultServiceId, defaultStartTime, defaultEndTime) {
		events = events || [];
		if (events.length === 0) {
			events.push(getDefaultEvent(defaultServiceId, defaultStartTime, defaultEndTime));
		}
		return events;
	}

	/**
	 * Returns an array containing a default event object for all services in serviceIdArray
	 * @method getDefaultEventsForGrid
	 * @param {Array} serviceIdArray
	 * @param {Number} defaultStartTime
	 * @param {Number} defaultEndTime
	 * @return {Object}
	 */
	function getDefaultEventsForGrid(serviceIdArray, defaultStartTime, defaultEndTime) {
		var gridEventsArray = [],
			i,
			serviceIdArrayLength = serviceIdArray.length;

		for (i = 0; i < serviceIdArrayLength; i++) {
			gridEventsArray[i] = [];
			gridEventsArray[i].push(getDefaultEvent(serviceIdArray[i], defaultStartTime, defaultEndTime));
		}
		return gridEventsArray;
	}

	/**
	 * Process service list to include a dummy service if no services available
	 * @method getServices
	 * @param {Array} services Service to check if valid.  If not supplied uses getVideoChannelsOrderedByChannelNumber.
	 * @return {Array} list of services including valid services, or dummy service event
	 */
	function getServices(services) {
		var serviceArray = services || $N.platform.btv.EPG.getVideoChannelsOrderedByChannelNumber();
		if (serviceArray.length === 0) {
			return [{
				serviceId: BAD_SERVICE_ID,
				logicalChannelNum: 0,
				uri: ""
			}];
		}
		return serviceArray;
	}

	/**
	 * @method getServiceById
	 * @param {String} serviceId
	 * @return {Object}
	 */
	function getServiceById(serviceId) {
		var serviceObj = $N.platform.btv.EPG.getChannelByServiceId(serviceId);
		if ((serviceObj === null) || (serviceObj === undefined)) {
			return [{
				serviceId: BAD_SERVICE_ID,
				logicalChannelNum: 0,
				uri: ""
			}];
		}
		return serviceObj;
	}

	/**
	 * @method getServiceByChannelNumber
	 * @param {String} channelNumber
	 * @return {Object}
	 */
	function getServiceByChannelNumber(channelNumber) {
		var servicesArray = getServices(),
			serviceToTune = null,
			i;
		for (i = 0; i < servicesArray.length; i++) {
			if (servicesArray[i]._data.channelKey.toString() === channelNumber) {
				serviceToTune = $N.app.epgUtil.getServiceById(servicesArray[i]._data.serviceId);
			}
		}
		return serviceToTune;
	}

	/**
	 * @method eventsOverlap
	 * @param {Object} firstEvent
	 * @param {Object} secondEvent
	 * @return {Boolean}
	 */
	function eventsOverlap(firstEvent, secondEvent) {
		return (firstEvent && secondEvent && firstEvent.serviceId === secondEvent.serviceId && firstEvent.endTime > secondEvent.startTime);
	}

	/**
	 * @method fetchGridEventsByWindow
	 * @public
	 * @param {Array} serviceIdArray - an array of the channels of which we want to get event info for.
	 * @param {Date} startDate - The start date / time of when to get data from.
	 * @param {Date} endDate -  The end date / time of when to get data to.
	 * @param {Function} callback - Function call back with the results
	 * @return {Array} gridEventsArray - an array of the channels  containing an array of the events for each channel,
	 *                                   in order of the serviceId array.
	 */
	function fetchGridEventsByWindow(serviceIdArray, startDate, endDate, callback) {
		var thisFetchId,
			/**
			 * @method fetchGridEventsByWindowCallback
			 * @param  {Array} events - Events for the given time period, ordered by serviceId then StartTime.
			 */
			fetchGridEventsByWindowCallback = function (events) {
				var i,
					event,
					previousEvent,
					gridEventsArray = [],
					currentServiceIdIndex = -1,
					currentServiceId = null,
					serviceIdArrayLength = serviceIdArray.length,
					firstEvent = null,
					lastEvent = null,
					eventsLength = events.length;

				if (events && callback) {
					for (i = 0; i < serviceIdArrayLength; i++) {
						gridEventsArray[i] = [];
					}
					for (i = 0; i < eventsLength; i++) {
						event = events[i];
						previousEvent = events[i - 1]; //undefined if i=0
						if (currentServiceId === null || currentServiceId !== event.serviceId) {
							currentServiceId = event.serviceId;
							currentServiceIdIndex = serviceIdArray.indexOf(event.serviceId);
						}
						if (eventsOverlap(previousEvent, event)) {
							event.overlapStartTime = previousEvent.endTime;
						}
						gridEventsArray[currentServiceIdIndex].push(event);
					}
					for (i = 0; i < serviceIdArrayLength; i++) {
						if (gridEventsArray[i].length) {
							gridEventsArray[i].sort($N.app.SortUtil.sortByDateAsc);
							firstEvent = gridEventsArray[i][0];
							lastEvent = gridEventsArray[i][gridEventsArray[i].length - 1];
							if (firstEvent.startTime > startDate) {
								gridEventsArray[i].unshift(getDefaultEvent(serviceIdArray[i], startDate, firstEvent.startTime));
							}
							if (lastEvent.endTime < endDate) {
								gridEventsArray[i].push(getDefaultEvent(serviceIdArray[i], lastEvent.endTime, endDate));
							}
						} else {
							gridEventsArray[i].push(getDefaultEvent(serviceIdArray[i], startDate, endDate));
						}
					}
					callback(gridEventsArray, startDate);
				}
			};

		$N.platform.btv.EPG.fetchEventsByWindow(serviceIdArray, startDate, endDate, fetchGridEventsByWindowCallback);
	}

	/**
	 * @method createEventList
	 * @param {Object} eventList
	 * @param {Array} sortedAllServiceIds
	 * @param {Number} startTimeMS
	 * @param {Number} endTimeMS
	 * @return {Object}
	 */
	function createEventList(eventList, sortedAllServiceIds, startTimeMS, endTimeMS) {
		var lastServiceId,
			eventListLength = 0,
			eventListServiceIds = [],
			serviceIdsWithNoEvent = [],
			serviceIdsWithNoEventLength = 0,
			event,
			i;

		for (event in eventList) {
			if (eventList.hasOwnProperty(event)) {
				eventList[event] = $N.platform.btv.EPGEventFactory.mapObject(eventList[event]);
				if (lastServiceId === eventList[event]._data.serviceId) {
					delete eventList.event;
				} else {
					lastServiceId = eventList[event]._data.serviceId;
					eventListServiceIds.push(lastServiceId);
				}
			}
		}
		serviceIdsWithNoEvent = $N.app.ArrayUtil.arrayDifference(sortedAllServiceIds, eventListServiceIds);
		serviceIdsWithNoEventLength = serviceIdsWithNoEvent.length;

		for (i = 0; i < serviceIdsWithNoEventLength; i++) {
			eventList.push(getDefaultEvent(serviceIdsWithNoEvent[i], startTimeMS, endTimeMS));
		}

		return eventList;
	}

	/**
	 * @method makeWhereCriteriaFromServiceIdsArray
	 * @param {Array} serviceIds
	 * @return {String}
	 */
	function makeWhereCriteriaFromServiceIdsArray(serviceIds) {
		var i,
			criteria = '',
			serviceIdsLength = serviceIds.length,
			now = new Date(),
			time = now.getTime();

		if (serviceIdsLength) {
			criteria = '(';
		}
		for (i = 0; i < serviceIdsLength; i++) {
			if (i !== 0) {
				criteria += " OR ";
			}
			criteria += "serviceId='" + serviceIds[i] + "'";
		}
		criteria += ") AND startTime <= '" + time + "' AND endTime >= '" + time + "'";

		return criteria;
	}

	/**
	 * Helper method which takes an array of EPG events and adds dummy events where required.
	 * @method augmentEventArrayWithDummyEvents
	 * @param {Array} events An array of EPG events
	 * @param {Number} startTime The start time of the event window
	 * @param {Number} endTime The end time of the event window
	 * @param {String} serviceId The service id to be used when creating dummy EPG events
	 * @param {Function} getDummyEvent The method used to create the dummy events
	 */
	function augmentEventArrayWithDummyEvents(events, startTime, endTime, serviceId, getDummyEvent) {
		var eventArray = [],
			i,
			event,
			next,
			eventsLength = events ? events.length : 0;
		if (eventsLength > 0) {
			if (events[0].startTime > startTime) {
				eventArray.push(getDummyEvent(serviceId, startTime, events[0].startTime));
			}
			for (i = 0; i < eventsLength; i++) {
				event = events[i];
				next = events[i + 1];
				eventArray.push(event);
				if (next && event.endTime < next.startTime) {
					eventArray.push(getDummyEvent(serviceId, event.endTime, next.startTime));
				}
			}
			if (event.endTime < endTime) {
				eventArray.push(getDummyEvent(serviceId, event.endTime, endTime));
			}
		} else {
			eventArray.push(getDummyEvent(serviceId, startTime, endTime));
		}
		return eventArray;
	}

	/**
	 * @method getMinimisedEventsForService
	 * @param {Number} serviceId
	 * @param {Number} limitValue
	 * @param {Function} callback
	 */
	function getMinimisedEventsForService(serviceId, limitValue, callback) {
		var select = "DISTINCT serviceId, eventId, title, startTime, endTime, parentalRating, shortDesc",
			order = "startTime ASC",
			criteria = '',
			processSuccess = function (events) {
				callback(events);
			},
			processFailure = function () {
				callback();
			};
		if (limitValue) {
			order = order + " LIMIT " + limitValue;
		}
		if (!serviceId) {
			processFailure();
		} else {
			criteria = "(serviceId='" + serviceId + "' AND endTime >= '" + Date.now() + "')";
			executeResultSet(select, criteria, order, processSuccess, processFailure);
		}
	}

	/**
	 * @method getEventByUniqueEventId
	 * @param {String} uniqueEventId
	 * @return {Object} event object 
	 */
	function getEventByUniqueEventId(uniqueEventId) {
		var select = "serviceId, eventId, title, startTime, endTime, parentalRating, shortDesc, longDesc",
			order = "startTime ASC",
			criteria = "(netUniqueEventId='" + uniqueEventId + "')",
			resultSet = null,
			event = null;
		if (!uniqueEventId) {
			return null;
		} else {
			resultSet = CCOM.EPG.getEventsRSByQuery(select, criteria, order);
			event = resultSet.getNext(1)[0];
			return event;
		}
	}

	/**
	 * @method getAllChannelDataForTime
	 * @param {Array} allServiceIds
	 * @param {Number} startTimeMS
	 * @param {Number} endTimeMS
	 * @return {Array}
	 */
	function getAllChannelDataForTime(allServiceIds, startTimeMS, endTimeMS) {
		allServiceIds = $N.app.ArrayUtil.sortAndRemoveDuplicates(allServiceIds, function () {}); // need to sort so events come back in same order as serviceIds
		// the 1000 ms adjustment is due to a bug in CCOM/CCA
		var events = $N.platform.btv.EPG.getEventsByWindow(allServiceIds, startTimeMS + 1000, endTimeMS - 1000),
			pointer = 0,
			returnList = [],
			eventCount = 0,
			i,
			currentSort = Preferences.get(constants.PREF_TV_SORT);
		if (!allServiceIds || allServiceIds.length === 0) {
			returnList.push(getDefaultEvent(BAD_SERVICE_ID, startTimeMS, endTimeMS));
		} else {
			for (i = 0; i < allServiceIds.length; i++) {
				while (events && events[pointer] && (parseInt(allServiceIds[i], 10) === parseInt(events[pointer].serviceId, 10))) {
					returnList.push(events[pointer]);
					pointer++;
					eventCount++;
				}
				if (eventCount === 0) {
					returnList.push(getDefaultEvent(allServiceIds[i], startTimeMS, endTimeMS));
				} else {
					eventCount = 0;
				}
			}
		}
		if (currentSort && currentSort !== sortOptions[0]) {
			$N.app.epgUtil.applySortToEventList(returnList, currentSort);
		}
		return returnList;
	}

	/**
	 * @method getEvent
	 * @param {String} nextOrCurrent
	 * @param {String} serviceId
	 * @return {Object}
	 */
	function getEvent(nextOrCurrent, serviceId) {
		var event = {};
		if (serviceId !== undefined) {
			if (nextOrCurrent.toLowerCase() === 'next') {
				event = $N.platform.btv.EPG.getNextEventForService(serviceId);
			} else {
				event = $N.platform.btv.EPG.getCurrentEventForService(serviceId);
			}
			if (!event) {
				event = getDefaultEvent(serviceId);
			}
		}
		event = $N.platform.btv.EPGEventFactory.mapObject(event);
		return event;
	}

	/**
	 * @method getEventId
	 * @param {Object} data
	 * @return {String} eventId
	 */
	function getEventId(data) {
		var eventId = 0,
			event = {};
		if (data) {
			if (data.eventId) {
				eventId = data.eventId;
			} else if (data._data) {
				event = $N.platform.btv.EPG.getCurrentEventForService(data._data.serviceId) || $N.app.epgUtil.getDefaultEvent(data._data.serviceId);
				eventId = event.eventId;
			}
		}
		return eventId;
	}

	/**
	 * @method resolveEventIcon
	 * @param {Boolean} isPVREventScheduled
	 * @return {String}
	 */
	function resolveEventIcon(isPVREventScheduled) {
		if (isPVREventScheduled) {
			return "../../../customise/resources/images/%RES/icons/Icn_RecSingle.png";
		}
		return "";
	}

	/**
	 * @method getSeriesEpisodeNumberObject
	 * @param seriesId {String}
	 * @param episodeId {String}
	 * @return {Obj} An object containing the episode and series name
	 */
	function getSeasonEpisodeNumberObject(seriesId, episodeId) {
		episodeId = episodeId || "";
		var position = 0,
			series,
			episode;
		if (episodeId.length > 3 && episodeId.length < 5) {
			position = 1;
		} else if (episodeId.length > 4) {
			position = 2;
		}
		if (position) {
			series = episodeId.substring(0, position);
			episode = episodeId.substring(position, episodeId.length);
			return {
				seasonNumber: parseInt(series, 10),
				episodeNumber: $N.app.GeneralUtil.padNumberWithZeroes(parseInt(episode, 10), 2)
			};
		}
		return {
			seasonNumber: "",
			episodeNumber: ""
		};
	}

	/**
	 * @method getSeriesEpisodeNumber
	 * @param seriesId {String}
	 * @param episodeId {String}
	 * @return {String} A String containing the episode and series name
	 */
	function getSeasonEpisodeNumber(seriesId, episodeId) {
		var seasonEpisodeObj = getSeasonEpisodeNumberObject(seriesId, episodeId),
			returnstring = "";

		if (seasonEpisodeObj.seasonNumber !== "") {
			returnstring = seasonEpisodeObj.seasonNumber;
		}
		if (seasonEpisodeObj.episodeNumber !== "") {
			returnstring += " " + seasonEpisodeObj.episodeNumber;
		}
		return returnstring;
	}

	/**
	 * @method getSeriesEpisodeAbbreviation
	 * @param seriesId {String}
	 * @param episodeId {String}
	 * @return {String} A String containing the episode and series name
	 */
	function getSeasonEpisodeAbbreviation(seriesId, episodeId) {
		var seasonEpisodeObj = getSeasonEpisodeNumberObject(seriesId, episodeId),
			returnstring = "";

		if (seasonEpisodeObj.seasonNumber !== "") {
			returnstring = EPGUtil.getString("seasonAbbreviation") + " " + $N.app.GeneralUtil.padNumberWithZeroes(parseInt(seasonEpisodeObj.seasonNumber, 10), 2);
		}
		if (seasonEpisodeObj.episodeNumber !== "") {
			returnstring += " " + EPGUtil.getString("episodeAbbreviation") + " " + $N.app.GeneralUtil.padNumberWithZeroes(parseInt(seasonEpisodeObj.episodeNumber, 10), 2);
		}
		return returnstring;
	}


	/**
	 * @method getSeriesEpisodeString
	 * @param {Object} eventObject
	 * @param {String} [prefix=""] optional parameter for string connection.
	 * @return {String} A String containing the episode and series name
	 */
	function getSeasonEpisodeShort(eventObject, prefix) {
		var returnstring = prefix || "",
			seasonEpisodeObj = null;

		if (eventObject && eventObject.displaySeasonEpisode) {
			seasonEpisodeObj = getSeasonEpisodeNumberObject(eventObject.seriesId, eventObject.episodeId);
			if (seasonEpisodeObj.seasonNumber !== "") {
				returnstring += EPGUtil.getString("seasonShort") + " " + $N.app.GeneralUtil.padNumberWithZeroes(parseInt(seasonEpisodeObj.seasonNumber, 10), 2);
			}
			if (seasonEpisodeObj.episodeNumber !== "") {
				returnstring += " " + EPGUtil.getString("episodeShort") + " " + $N.app.GeneralUtil.padNumberWithZeroes(parseInt(seasonEpisodeObj.episodeNumber, 10), 2);
			}

			return returnstring;
		}

		return "";
	}

	/**
	 * @method getSubtitleForEvent
	 * @param {Object} event an EPGEvent object
	 * @return {Object}
	 */
	function getSubtitleForEvent(event) {
		var subtitleObj = {
				text: '',
				span: ''
			},
			subtitleText = '',
			startDate,
			nextEvent,
			startEndTime;
		if (event.eventId) {
			startDate = new Date(event.startTime);
			nextEvent = $N.platform.btv.EPG.getNextEventForService(event.serviceId);
			startEndTime = $N.app.DateTimeUtil.getFormattedStartEndTimeString(startDate, new Date(event.actualStopTime || event.endTime)).toUpperCase();
			if ($N.app.EventUtil.isEventShowingNow(event)) {
				subtitleText = EPGUtil.getString("showingNow");
			} else if (nextEvent && nextEvent.eventId && nextEvent.eventId === event.eventId) {
				subtitleText = EPGUtil.getString("showingNext");
			} else if ($N.app.EventUtil.isEventShowingToday(event)) {
				subtitleText = EPGUtil.getString("today");
			} else {
				subtitleText = EPGUtil.getString("days")[startDate.getDay()];
			}
			subtitleObj = {
				text: startEndTime,
				span: startEndTime.substring(startEndTime.length - 2, startEndTime.length)
			};
		}
		return {
			text: subtitleText,
			obj: subtitleObj
		};
	}

	function getDataForInfoCard(event, type) {
		var displayChannelNumber = "",
			displayChannelLogo = "",
			subtitle = "",
			channel,
			isPVREventScheduled,
			genres = $N.app.genreUtil.getGenresByEvent(event);
		if (genres) {
			genres = ' | ' + genres;
		}

		if (event) {
			if (event.serviceId !== constants.NO_SERVICE_ID_AVAILABLE) {
				channel = $N.platform.btv.EPG.getChannelByServiceId(event.serviceId);
				if (channel) {
					displayChannelNumber = String(channel.logicalChannelNum);
					displayChannelLogo = getChannelLogoUrl(event);
				}
			}
			subtitle = getSubtitleForEvent(event);
			isPVREventScheduled = $N.platform.btv.PVRManager.isPVREventScheduled(event);
			return {
				channelNumber: displayChannelNumber,
				serviceId: event.serviceId,
				logo: displayChannelLogo,
				promoImage: event.promoImage,
				thumbnail: "",
				title: event.title || EPGUtil.getString("noEventTitle"),
				subTitle: subtitle.text || "",
				subTitle2: subtitle.obj || "",
				description: event.shortDesc || event.longDesc || "",
				rating: (event.eventId === $N.app.epgUtil.BAD_EVENT_ID) ? "" : "../../../customise/resources/images/%RES/icons/Icn_Stars0.png",
				parentalRating: event.parentalRating,
				eventId: event.eventId,
				isStartOver: event.isStartOver,
				isCatchUp: event.isCatchUp,
				uniqueEventId: event.uniqueEventId,
				flags: getFlagUrls(event),
				icon: resolveEventIcon(isPVREventScheduled),
				genres: genres,
				isPVREventScheduled: isPVREventScheduled,
				isLocked: $N.app.ParentalControlUtil.isChannelOrProgramLocked(event),
				seasonEpisodeShort: $N.app.epgUtil.getSeasonEpisodeShort(event),
				isAdultEvent: $N.app.epgUtil.isAdultEvent(event),
				isEventShowingNow: $N.app.EventUtil.isEventShowingNow(event),
				startTime: event.startTime,
				endTime: event.endTime,
				startEndTime: $N.app.DateTimeUtil.getFormattedStartEndTimeString(new Date(event.startTime), new Date(event.endTime), $N.app.constants.TWENTY_FOUR_HOUR_TIME_FORMAT)
			};
		}
		return {
			channelNumber: "",
			logo: "",
			thumbnail: "",
			title: EPGUtil.getString("noDataAvailable"),
			subTitle: "",
			subTitle2: {
				text: "",
				span: ""
			},
			description: "",
			rating: "",
			flags: [],
			icon: ""
		};
	}

	function getCCOMEventForQSPEvent(qspEvent) {
		var ccomEvent;
		//check event is qsp event
		if (qspEvent.uid) {
			ccomEvent = {
				eventId: qspEvent.uid,
				startTime: qspEvent.startTime,
				endTime: qspEvent.endTime,
				serviceId: String(qspEvent.channelUID),
				title: qspEvent.eventName,
				shortDesc: qspEvent.shortDescription
			};
		}
		return ccomEvent || null;
	}

	/**
	 * @method getEventImageFromMDS
	 * @param {Integer} id An EPG event id
	 * @param {Function} successCallback The callback to call on success.
	 * @param {Function} failureCallback The callback to call on failure.
	 */
	function getEventImageFromMDS(event, callback) {
		var programFilter = {},
			fetchedEvent,
			processSuccess,
			processFailure,
			fieldList = ["PromoImages"],
			serviceRef = null;

		// FIXME: This function doesn't really do what it is supposed to do and I suspect
		//			that it is returning erroneous results. It needs to be fixed ASAP.
		//			RJV 2014-10-23

		if (event) {
			serviceRef = $N.app.ChannelManager.getServiceRef(event.serviceId);
			if (serviceRef) {
				programFilter.serviceRef = serviceRef;
			}
			if (event.startTime) {
				programFilter["period.start"] = {
					"$gte": event.startTime / 1000
				};
			}
			if (event.endTime) {
				programFilter["period.end"] = {
					"$lte": event.endTime / 1000
				};
			}
			processSuccess = function (response) {
				if (response && response.programmes && response.programmes.length > 0) {
					log("getEventImageFromMDS>>>>>>>>>>>>>>>>>>>>", "result return");
					fetchedEvent = $N.services.sdp.EPGEventFactory.mapObject(response.programmes[0]);
					callback(fetchedEvent);
				} else {
					log("getEventImageFromMDS>>>>>>>>>>>>>>>>>>>>", "no result return");
					callback(null);
				}
			};
			processFailure = function (response) {
				callback(null, event.eventId);
			};
			$N.services.sdp.MetadataService.getData(this, processSuccess, processFailure, $N.services.sdp.MetadataService.RequestType.Events, programFilter, null, fieldList, null, 0);
		} else {
			log("getEventImageFromMDS>>>>>>>>>>>>>>>>>>>>", "event is null");
			callback(null);
		}
	}

	/**
	 * @method getPosterImageServer
	 * @return {String}
	 */
	function getPosterImageServer() {
		if ($N.app.Config.getConfigValue("mds.developer.mode") === "on") {
			return $N.app.Config.getConfigValue("mds.developer.server");
		}

		return $N.platform.system.Preferences.get("/network/siconfig/CustomDescriptorTags/netMdsServer", true);
	}

	/**
	 * Returns a list of channels for the given category name
	 * where it be a category or favourite list
	 * @method getChannelsForCategory
	 * @return {array} of channels
	 */
	function getChannelsForCategory(categoryName) {
		var channelsForCategory,
			currentCategory;
		if (categoryName) {
			currentCategory = $N.platform.btv.ChannelCategories.getCategoryByName(categoryName);
			if (currentCategory) {
				channelsForCategory = getServices(currentCategory.getChannels());
			} else {
				channelsForCategory = $N.platform.btv.Favourites.getFavouriteChannels(categoryName);
				channelsForCategory = channelsForCategory || getServices();
			}
		} else {
			channelsForCategory = getServices();
		}
		return channelsForCategory;
	}

	/**
	 * @method isPromoImageValid
	 * @param {String} url
	 * @return {Boolean}
	 */
	function isPromoImageValid(promoImageUrl) {
		if (promoImageUrl.indexOf(DEFAULT_PROMO_IMAGE_PATH_END, promoImageUrl.length - DEFAULT_PROMO_IMAGE_PATH_END.length) !== -1) {
			return false;
		}
		return true;
	}

	/**
	 * Returns a list of service ids for the given category name
	 * where it be a category or favourite list
	 * @method getServiceIdsForCategory
	 * @return {array} of service ids
	 */
	function getServiceIdsForCategory(categoryName) {
		var serviceIdsForCategory,
			currentCategory;
		if (categoryName) {
			currentCategory = $N.platform.btv.ChannelCategories.getCategoryByName(categoryName);
			if (currentCategory) {
				serviceIdsForCategory = currentCategory.getServiceIds();
			} else {
				serviceIdsForCategory = $N.platform.btv.Favourites.getFavouriteServiceIds(categoryName);
				serviceIdsForCategory = serviceIdsForCategory || $N.platform.btv.EPG.getServiceIdArraySortedByLCN();
			}
		} else {
			serviceIdsForCategory = $N.platform.btv.EPG.getServiceIdArraySortedByLCN();
		}
		return serviceIdsForCategory;
	}

	/**
	 * @method getNextClosestService
	 * @requirements
	 * @strict pass mode
	 *	available channels: {1,2,3, 7,8,9}
	 *	entered key => pick up channel
	 *	0 => 1, 1 => 1, 5 => 3, 6 => 7, 10 => 9
	 *
	 * @param {Number} channelNumber
	 * @param {Array} services
	 */
	function getNextClosestService(channelNumber, services) {
		var servicesLength = services.length,
			tunneIndex = null,
			minChannel = null,
			minChannelIndex = null,
			maxChannel = null,
			maxChannelIndex = null,
			i;
		for (i = 0; i < servicesLength; i++) {
			if (services[i].logicalChannelNum) {
				if (channelNumber === 0) {
					minChannel = services[i].logicalChannelNum;
					minChannelIndex = i;
					break;
				}
				if (services[i].logicalChannelNum >= channelNumber) {
					maxChannel = services[i].logicalChannelNum;
					maxChannelIndex = i;
					break;
				}
				minChannel = services[i].logicalChannelNum;
				minChannelIndex = i;
			}
		}
		if (maxChannel) {
			tunneIndex = ((Math.round(maxChannel - minChannel) / 2 + minChannel) < channelNumber) ? maxChannelIndex : minChannelIndex;
		} else {
			tunneIndex = minChannelIndex;
		}
		return (tunneIndex >= 0) ? services[tunneIndex] : null;
	}

	/**
	 * Register OK and Failed callbacks for addEvent
	 * @method registerAddEventListeners
	 * @param {Funcion} successCallback
	 * @param {Funcion} failureCallback
	 */
	function registerAddEventListeners(successCallback, failureCallback) {
		CCOM.EPG.addEventListener("addEventOK", successCallback);
		CCOM.EPG.addEventListener("addEventFailed", failureCallback);
	}

	/**
	 * Un-register OK and Failed callbacks for addEvent
	 * @method unRegisterAddEventListeners
	 * @param {Funcion} successCallback
	 * @param {Funcion} failureCallback
	 */
	function unRegisterAddEventListeners(successCallback, failureCallback) {
		CCOM.EPG.removeEventListener("addEventOK", successCallback);
		CCOM.EPG.removeEventListener("addEventFailed", failureCallback);
	}


	return {
		/**
		 * Stores a channel as the current channel id to prefs
		 * @method storeChannelToPrefs
		 * @param {Integer} serviceId An EPG Service id
		 * @return {Boolean} True if successfully stored
		 */
		storeChannelToPrefs: function (serviceId) {
			if ($N.app.EventUtil.isValidServiceId(serviceId)) {
				Preferences.set(constants.PREF_TV_CURRENT_SERVICE_ID, String(serviceId));
				return true;
			}
			return false;
		},

		/**
		 * Returns the current channel id from prefs
		 * @method getChannelFromPrefs
		 * @return {Integer} The stored channel id or -1 if not found
		 */
		getChannelFromPrefs: function () {
			var currentServiceId = Preferences.get(constants.PREF_TV_CURRENT_SERVICE_ID);
			if (currentServiceId && currentServiceId !== String(BAD_SERVICE_ID)) {
				return currentServiceId;
			}
			return null;
		},

		/**
		 * Returns the number of real channels available
		 * @method getNumServices
		 * @return {Integer} Number of real channels available
		 */
		getNumServices: function () {
			var serviceList = getServices();
			if (serviceList[0] && serviceList[0].serviceId === BAD_SERVICE_ID) {
				return 0;
			}
			return serviceList.length;
		},

		fetchEventsRSByQuery: function (select, criteria, order, callBack) {
			var resultSet;

			setTimeout(function () {
				resultSet = CCOM.EPG.getEventsRSByQuery(select, criteria, order);
				if (Object.prototype.toString.call(callBack) === '[object Function]') {
					callBack(resultSet);
				}
			}, 1);
		},

		/**
		 * @method fetchLatestLocalEPGEvent
		 * @param {Function} callback
		 * @param {String} serviceId (optional) service to find the latest event for
		 */
		fetchLatestLocalEPGEvent: function (callback, serviceId) {
			log("fetchLatestLocalEPGEvent", "Enter");
			var select = "DISTINCT serviceId, endTime",
				criteria = serviceId ? "(serviceId='" + serviceId + "')" : null,
				order = "endTime DESC limit 1";
			this.fetchEventsRSByQuery(select, criteria, order, function (resultSet) {
				var result = resultSet.getNext(1),
					i;
				for (i = 0; i < result.length; i++) {
					if (Object.prototype.toString.call(callback) === '[object Function]') {
						callback(result[i]);
					}
				}

				resultSet.reset();
				resultSet = null;
			});
			log("fetchLatestLocalEPGEvent", "Exit");
		},

		/**
		 * Calls SDP and checks local EPG for the latest event for a given service.
		 * If no service is provided it will give the latest event for all channels.
		 * @method fetchLatestEvent
		 * @param {Function} callback
		 * @param {String} serviceId (optional) service to find the latest event for
		 */
		fetchLatestEvent: function (callback, serviceId) {
			log("fetchLatestEvent", "Enter");
			var sdpResultReturned,
				ccomResultReturned,
				returnResult,
				fetchLatestEventCallback = function (event) {
					log("fetchLatestEvent", "callback");
					var noReturnResult = !returnResult || !returnResult.hasOwnProperty('endTime');
					if (noReturnResult || (event && event.endTime && event.endTime > returnResult.endTime)) {
						returnResult = event;
					}
					if (sdpResultReturned && ccomResultReturned && returnResult && callback) {
						callback(returnResult);
					}
				};

			$N.services.sdp.EPG.fetchLatestEvent(function (event) {
				sdpResultReturned = true;
				fetchLatestEventCallback(event);
			}, serviceId);
			this.fetchLatestLocalEPGEvent(function (event) {
				ccomResultReturned = true;
				fetchLatestEventCallback(event);
			}, serviceId);
			log("fetchLatestEvent", "Exit");
		},

		/**
		 * @method fetchEarliestLocalEPGEvent
		 * @param {Function} callback
		 * @param {String} serviceId (optional) service to find the earliest event for
		 */
		fetchEarliestLocalEPGEvent: function (callback, serviceId) {
			log("fetchEarliestLocalEPGEvent", "Enter");
			var select = "DISTINCT serviceId, startTime",
				criteria = serviceId ? "(serviceId='" + serviceId + "')" : null,
				order = "startTime ASC limit 1";
			this.fetchEventsRSByQuery(select, criteria, order, function (resultSet) {
				var result = resultSet.getNext(1),
					i;
				for (i = 0; i < result.length; i++) {
					if (Object.prototype.toString.call(callback) === '[object Function]') {
						callback(result[i]);
					}
				}

				resultSet.reset();
				resultSet = null;
			});
			log("fetchEarliestLocalEPGEvent", "Exit");
		},

		/**
		 * Calls SDP and checks local EPG for the latest event for a given service.
		 * If no service is provided it will give the latest event for all channels.
		 * @method fetchEarliestEvent
		 * @param  {Function} callback
		 * @param {String} serviceId (optional) service to find the earliest event for
		 */
		fetchEarliestEvent: function (callback, serviceId) {
			log("fetchEarliestEvent", "Enter");
			var sdpResultReturned,
				ccomResultReturned,
				returnResult,
				fetchEarliestEventCallback = function (event) {
					var noReturnResult = !returnResult || !returnResult.hasOwnProperty('startTime');
					if (noReturnResult || (event && event.startTime && event.startTime < returnResult.startTime)) {
						returnResult = event;
					}
					if (sdpResultReturned && ccomResultReturned && returnResult && callback) {
						callback(returnResult);
					}
				};
			$N.services.sdp.EPG.fetchEarliestEvent(function (event) {
				sdpResultReturned = true;
				fetchEarliestEventCallback(event);
			}, serviceId);
			this.fetchEarliestLocalEPGEvent(function (event) {
				ccomResultReturned = true;
				fetchEarliestEventCallback(event);
			}, serviceId);
			log("fetchEarliestEvent", "Exit");
		},

		/**
		 * Asynchronously fetches the event information by window
		 * @method fetchEventsByWindow
		 * @param {Integer} serviceId - An EPG Service id
		 * @param {Integer} startTime - The time/date to start
		 * @param {Integer} endTime - The time/date to end
		 * @param {Function} callback - function to call with results
		 * @return {Boolean} True if successfully stored
		 */
		fetchEventsByWindow: function (serviceId, startTime, endTime, callback) {
			var thisFetchId,
				fetchEventsByWindowCallback = function (events) {
					if (callback && currentFetchId === thisFetchId) {
						callback(events);
					}
				};

			if (Object.prototype.toString.call(serviceId) !== '[object Array]') {
				serviceId = [serviceId];
			}

			// Increment the fetch and save in locally for callback to access
			currentFetchId++;
			thisFetchId = currentFetchId;

			$N.platform.btv.EPG.fetchEventsByWindow(serviceId, startTime, endTime, fetchEventsByWindowCallback);
		},

		BAD_EVENT_ID: BAD_EVENT_ID,
		BAD_SERVICE_ID: BAD_SERVICE_ID,
		getEvent: getEvent,
		getEventId: getEventId,
		getDefaultEvent: getDefaultEvent,
		getDefaultEventIfNoEvents: getDefaultEventIfNoEvents,
		getDefaultEventsForGrid: getDefaultEventsForGrid,
		getServiceById: getServiceById,
		getChannelLogoUrl: getChannelLogoUrl,
		getFlagUrls: getFlagUrls,
		getMinimisedEventsForService: getMinimisedEventsForService,
		getAllChannelDataForTime: getAllChannelDataForTime,
		resolveEventIcon: resolveEventIcon,
		getDataForInfoCard: getDataForInfoCard,
		getCCOMEventForQSPEvent: getCCOMEventForQSPEvent,
		getEventImageFromMDS: getEventImageFromMDS,
		getPosterImageServer: getPosterImageServer,
		getChannelsForCategory: getChannelsForCategory,
		getServiceIdsForCategory: getServiceIdsForCategory,
		getNextClosestService: getNextClosestService,
		getServices: getServices,
		isPromoImageValid: isPromoImageValid,
		fetchGridEventsByWindow: fetchGridEventsByWindow,
		getSeasonEpisodeNumber: getSeasonEpisodeNumber,
		getSeasonEpisodeShort: getSeasonEpisodeShort,
		getSeasonEpisodeAbbreviation: getSeasonEpisodeAbbreviation,
		getSeasonEpisodeNumberObject: getSeasonEpisodeNumberObject,
		getServiceByChannelNumber: getServiceByChannelNumber,
		/**
		 * Applies the sortMode to the given event list
		 * @method applySortToEventList
		 * @return {Array}
		 */
		applySortToEventList: function (eventList, sortMode) {
			var sort = sortLookup[sortMode];
			if (sort && sort.eventFunction) {
				return eventList.sort(sort.eventFunction);
			}
			return eventList;
		},

		/**
		 * Applies the current sort to the given channel list
		 * @method applyCurrentSortToChannelList
		 * @return {Array}
		 */
		applyCurrentSortToChannelList: function (channelList) {
			var currentSort = Preferences.get(constants.PREF_TV_SORT),
				sort = sortLookup[currentSort];
			if (sort && sort.channelFunction) {
				return channelList.sort(sort.channelFunction);
			}
			return channelList;
		},

		/**
		 * Returns a list of sort options that can be applied to
		 * BTV data
		 * @method getSortOptions
		 * @return {Array}
		 */
		getSortOptions: function () {
			return sortOptions;
		},

		/**
		 * @method calculateEventLengthInSeconds
		 * @private
		 * @param {Number} startTime of an event
		 * @param {Number} endTime of an event
		 * @return {Number} contentLengthInSeconds
		 */
		calculateEventLengthInSeconds: function (startTime, endTime) {
			var contentLengthInMilliseconds = endTime - startTime,
				contentLengthInSeconds = contentLengthInMilliseconds / 1000;
			return Math.floor(contentLengthInSeconds);
		},

		/**
		 * @method calculateEventLengthInMinutes
		 * @private
		 * @param {Number} startTime of an event
		 * @param {Number} endTime of an event
		 * @return {Number} contentLengthInMinutes
		 */
		calculateEventLengthInMinutes: function (startTime, endTime) {
			var contentLengthInMinutes = this.calculateEventLengthInSeconds(startTime, endTime) / 60;
			return Math.floor(contentLengthInMinutes);
		},

		/**
		 * Helper method to handle navigation to Synopsis
		 * @method navigateToSynopsis
		 * @param {Object} eventToDisplay
		 * @param {Boolean} isEventPlaying is event playing now
		 * @param {Function} returnCallback callback function to fire to return
		 */
		navigateToSynopsis: function (eventToDisplay, isEventPlaying, returnCallback) {
			$N.app.ContextHelper.openContext("SYNOPSIS", {
				activationContext: {
					"data": eventToDisplay,
					"type": "epg",
					"playing": isEventPlaying,
					"showBackgroundGradient": false
				},
				navCompleteCallback: returnCallback
			});
		},

		/**
		 * @method isAdultEvent
		 * @param {Object} event - an EPGEvent object
		 * @return {Boolean} true if the event is adult content, false otherwise
		 */
		isAdultEvent: function (event) {
			var genres = [];
			if (event.eventId) {
				genres = event.genres || CCOM.EPG.getGenresByEventId(event.eventId);
				if (genres.error) {
					return false;
				} else {
					return this.isAdultGenre(genres);
				}
			} else {
				return false;
			}
		},
		/**
		 * @method isAdultGenre
		 * @param {Object} genres - an array of genres
		 * @return {Boolean} true if the genre is adult content, false otherwise
		 */
		isAdultGenre: function (genres) {
			var genresLength = 0,
				i;
			genresLength = genres.length;
			for (i = 0; i < genresLength; i++) {
				switch (genres[i].contentNibbleLevel1) {
				case constants.FILM_GENRE_GROUP_ID:
					if (genres[i].contentNibbleLevel2 === constants.EROTICO_GENRE_IN_FILM_GROUP_ID) {
						return true;
					}
					break;
				case constants.NONFICTION_GENRE_GROUP_ID:
				case constants.EDUCATION_GENRE_GROUP_ID:
					if (genres[i].contentNibbleLevel2 === constants.EROTICO_GENRE_IN_EDUCATION_GROUP_ID) {
						return true;
					}
					break;
				case constants.ADULT_GENRE_GROUP_ID:
					return true;
				default:
					break;
				}
			}
			return false;
		},

		/**
		 * @method getExtendedInfoByEventId
		 * @param {String} eventId
		 * @param {Object} extendedInfoProperties
		 * @return {Object} extendedInfo
		 */
		getExtendedInfoByEventId: function (eventId, extendedInfoProperties) {
			extendedInfoProperties = extendedInfoProperties || constants.EVENT_EXTENDED_INFO.EPISODIC_INFO;
			var LANGUAGE = constants.EVENT_EXTENDED_INFO.LANGUAGE,
				extendedInfoResult = CCOM.EPG.getExtInfoByEventId(eventId, LANGUAGE, 0),
				extendedInfoResultLength = extendedInfoResult.length,
				extendedInfo = [],
				i;
			for (i = 0; i < extendedInfoResultLength; i++) {
				if (extendedInfoProperties[extendedInfoResult[i].extInfoKey]) {
					extendedInfo[extendedInfoProperties[extendedInfoResult[i].extInfoKey]] = extendedInfoResult[i].extInfoValue;
				}
			}
			return extendedInfo;
		},

		/**
		 * @method getSeasonAndEpisodeStringByEventId
		 * @param {String} eventId
		 */
		getSeasonAndEpisodeStringByEventId: function (eventId) {
			var seasonAndEpisode = this.getExtendedInfoByEventId(eventId),
				seasonAndEpisodeString = (seasonAndEpisode.series) ? seasonAndEpisode.series + " " + EPGUtil.getString("seasonShort") + " " : "";
			seasonAndEpisodeString += (seasonAndEpisode.episode) ? EPGUtil.getString("episodeShort") + " " + seasonAndEpisode.episode : "";
			return $N.apps.util.Util.upcaseFirstLetter(seasonAndEpisodeString);
		},

		/**
		 * @method getMappedEventById
		 * @param {String} eventId
		 * @return {Object} mapped event object or null
		 */
		getMappedEventById: function (eventId) {
			var event = null;
			if (eventId) {
				event = $N.platform.btv.EPG.getEventById(eventId);
				event = $N.platform.btv.EPGEventFactory.mapObject(event);
			}
			return event;
		},

		/**
		 * @method getUniqueEventIdByEvent
		 * @param {Object} eventObj
		 * @return {String} uniqueEventId
		 */
		getUniqueEventIdByEvent: function (eventObj) {
			return eventObj.uniqueEventId || $N.platform.btv.EPGEventFactory.mapObject(eventObj).uniqueEventId;
		},

		/**
		 * Tunes to the channel of the current service
		 * If the user is already in zapper then the updateBannerAndTuneIfNeeded method is called
		 * otherwise user is taken to zapper and the service is tuned
		 * @method tuneToChannel
		 * @public
		 * @param {Number} serviceId of the event we wish to tune to
		 */
		tuneToChannel: function (service, contextChangeCallback) {
			if ($N.apps.core.ContextManager.getActiveContext().getId() !== "ZAPPER") {
				$N.app.ContextHelper.openContext("ZAPPER", {activationContext: service, navCompleteCallback: contextChangeCallback});
			} else if (!contextChangeCallback) {
				$N.apps.core.ContextManager.getActiveController().updateBannerAndTuneIfNeeded(service);
			}
		},

		/**
		 * @method addMdsEventToEPG
		 * @param {Object} mdsEvent
		 * @param {Function} callback
		 */
		addMdsEventToEPG: function (mdsEvent, successCallback, failureCallback) {
			log("addMdsEventToEPG", "Enter");
			var epgEvent = {},
				handle,
				addEventSuccessCallback,
				addEventFailureCallback;

			addEventSuccessCallback = function (e) {
				log("addMdsEventToEPG", "addEventSuccessCallback - Enter");
				unRegisterAddEventListeners(addEventSuccessCallback, addEventFailureCallback);
				if (successCallback) {
					successCallback();
				}
				log("addMdsEventToEPG", "addEventSuccessCallback - Exit");
			};

			addEventFailureCallback = function (e) {
				log("addMdsEventToEPG", "addEventFailureCallback - Enter");
				unRegisterAddEventListeners(addEventSuccessCallback, addEventFailureCallback);
				if (failureCallback) {
					failureCallback(e);
				}
				log("addMdsEventToEPG", "Error =" + JSON.stringify(e));
				log("addMdsEventToEPG", "addEventFailureCallback - Exit");
			};

			epgEvent.eventId = mdsEvent.eventId;
			epgEvent.netUniqueEventId = mdsEvent.uniqueEventId;
			epgEvent.serviceId = mdsEvent.serviceId;
			epgEvent.startTime = mdsEvent.startTime;
			epgEvent.endTime = mdsEvent.endTime;
			epgEvent.parentalRating = mdsEvent.parentalRating;
			epgEvent.title = mdsEvent.title;
			epgEvent.shortDesc = mdsEvent.shortDesc;
			epgEvent.longDesc = mdsEvent.longDesc;
			epgEvent.seriesId = mdsEvent.seriesId;
			epgEvent.episodeId = mdsEvent.episodeId;
			epgEvent.netActorCast = mdsEvent.actors;
			epgEvent.netDirector = mdsEvent.directors;
			epgEvent.netOriginalName = mdsEvent.originalName;
			epgEvent.netEpisodeName = mdsEvent.epOriginalName;
			epgEvent.netProdYear = mdsEvent.year;
			epgEvent.netCountry = mdsEvent.country;
			epgEvent.netEventGenres = $N.app.genreUtil.getGenreStringFromGenreObject(mdsEvent.genres);
			epgEvent.sourceId = $N.app.constants.EPG_SOURCE_DVB;

			unRegisterAddEventListeners(addEventSuccessCallback, addEventFailureCallback);

			if (successCallback || failureCallback) {
				registerAddEventListeners(addEventSuccessCallback, addEventFailureCallback);
			}

			handle = CCOM.EPG.addEvent(epgEvent, 1);
			log("addMdsEventToEPG", "Enter");
		},
		getEventByUniqueEventId : getEventByUniqueEventId
	};
};
