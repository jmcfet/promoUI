/*jslint regexp: true*/
/*global ResultSet*/
/**
 * Stub for CCOM 2.0 EPG
 */
var CCOM = CCOM || {};

CCOM.EPG = CCOM.EPG || (function () {

	var currentTime = new Date().getTime(),
		ONE_HOUR = 60 * 60 * 1000,
		HALF_HOUR = ONE_HOUR / 2,
		QUARTER_HOUR = ONE_HOUR / 4,
		TEN_MINUTES = 10 * 60 * 1000,
		eventListeners = {},
		SERVICES_TEST_DATA = [
			{_data: {}, serviceId: '120', logicalChannelNum: 120, channelKey: 120, type: 1, serviceName: 'BBC One', name: 'BBC One', parentalRating: 0, isSubscribed: true, uri: "http://18.19.20.21/bbc_one"},
			{_data: {}, serviceId: '353', logicalChannelNum: 353, channelKey: 353, type: 1, serviceName: 'BBC Two', name: 'BBC Two', parentalRating: 0, isSubscribed: true, uri: "http://18.19.20.21/bbc_two"},
			{_data: {}, serviceId: '480', logicalChannelNum: 480, channelKey: 480, type: 1, serviceName: 'BBC Three', name: 'BBC Three', parentalRating: 0, isSubscribed: true, uri: "http://18.19.20.21/bbc_three"},
			{_data: {}, serviceId: '572', logicalChannelNum: 572, channelKey: 572, type: 1, serviceName: 'Sky News', name: 'Sky News', parentalRating: 0, isSubscribed: false, uri: "http://18.19.20.21/sny_news"},
			{_data: {}, serviceId: '578', logicalChannelNum: 578, channelKey: 578, type: 1, serviceName: 'History Channel', name: 'History Channel', parentalRating: 1, isSubscribed: false, uri: "http://18.19.20.21/history_channel"},
			{_data: {}, serviceId: '000100190278', logicalChannelNum: 632, channelKey: 632, type: 1, serviceName: 'Warner HD', name: 'Warner HD', parentalRating: 1, isSubscribed: false, uri: "http://18.19.20.21/national_geographic"}
		],
		EVENT_TEST_DATA = [
			{eventId: '101', serviceId: '120', title: 'Grand Designs 1', shortDesc: "Presenter Kevin McCloud follows some of Britain's most ambitious self-building projects, as intrepid individuals attempt to design and construct the home of their dreams.", startTime: currentTime - ONE_HOUR, endTime: currentTime + ONE_HOUR, parentalRating: 14},
			{eventId: '102', serviceId: '120', title: 'Three In a Bed 1', shortDesc: "B&B owners throw open their doors and take turns to stay with one another - and pay what they consider fair for their stay.", startTime: currentTime + ONE_HOUR, endTime: currentTime + ONE_HOUR * 2, parentalRating: 12},
			{eventId: '103', serviceId: '120', title: 'The Hotel 1', shortDesc: "Dan and Liz, a happy young couple from Essex, check in to the Damson Dene for a quiet break. What Liz doesn't know is that Dan has brought her here to ask for her hand in marriage.", startTime: currentTime + ONE_HOUR * 2, endTime: currentTime + ONE_HOUR * 4, parentalRating: 14},
			{eventId: '104', serviceId: '120', title: 'One Under 1', shortDesc: "One under is the term Tube drivers and emergency services often use as shorthand for a person under their train.", startTime: currentTime + ONE_HOUR * 4, endTime: currentTime + ONE_HOUR * 5, parentalRating: 8},
			{eventId: '105', serviceId: '120', title: 'The MI5 Hoaxer 1', shortDesc: "Nineteen-year-old Oxford jewellery shop assistant Leanne McCarthy found herself trapped in a modern nightmare of kidnap, fear and mind control when she met 23-year-old Wayne Gouveia, a sophisticated conman with a track record of duping young women.", startTime: currentTime + ONE_HOUR * 5, endTime: currentTime + ONE_HOUR * 6, parentalRating: 18},
			{eventId: '106', serviceId: '120', title: 'The Story Of Film 1', shortDesc: "The explosive story of film in the late 50s and 60s. The great movie star Claudia Cardinale talks exclusively about Federico Fellini.", startTime: currentTime + ONE_HOUR * 6, endTime: currentTime + ONE_HOUR * 7, parentalRating: 12},
			{eventId: '107', serviceId: '120', title: 'There Was A Girl 1', shortDesc: "Film a bout a girl that there once was.", startTime: currentTime + ONE_HOUR * 7, endTime: currentTime + ONE_HOUR * 8, parentalRating: 8},
			{eventId: '201', serviceId: '353', title: 'Grand Designs 2', shortDesc: "Presenter Kevin McCloud follows some of Britain's most ambitious self-building projects, as intrepid individuals attempt to design and construct the home of their dreams.", startTime: currentTime - HALF_HOUR, endTime: currentTime - HALF_HOUR, parentalRating: 8},
			{eventId: '202', serviceId: '353', title: 'Three In a Bed 2', shortDesc: "B&B owners throw open their doors and take turns to stay with one another - and pay what they consider fair for their stay.", startTime: currentTime - HALF_HOUR, endTime: currentTime + HALF_HOUR * 2, parentalRating: 16},
			{eventId: '203', serviceId: '353', title: 'The Hotel 2', shortDesc: "Dan and Liz, a happy young couple from Essex, check in to the Damson Dene for a quiet break. What Liz doesn't know is that Dan has brought her here to ask for her hand in marriage.", startTime: currentTime + HALF_HOUR * 2, endTime: currentTime + HALF_HOUR * 4, parentalRating: 12},
			{eventId: '301', serviceId: '480', title: 'Grand Designs 3', shortDesc: "Presenter Kevin McCloud follows some of Britain's most ambitious self-building projects, as intrepid individuals attempt to design and construct the home of their dreams.", startTime: currentTime - QUARTER_HOUR, endTime: currentTime + QUARTER_HOUR, parentalRating: 10},
			{eventId: '302', serviceId: '480', title: 'Three In a Bed 3', shortDesc: "B&B owners throw open their doors and take turns to stay with one another - and pay what they consider fair for their stay.", startTime: currentTime + QUARTER_HOUR, endTime: currentTime + QUARTER_HOUR * 2, parentalRating: 14},
			{eventId: '303', serviceId: '480', title: 'The Hotel 3', shortDesc: "Dan and Liz, a happy young couple from Essex, check in to the Damson Dene for a quiet break. What Liz doesn't know is that Dan has brought her here to ask for her hand in marriage.", startTime: currentTime + QUARTER_HOUR * 2, endTime: currentTime + QUARTER_HOUR * 4, parentalRating: 10},
			{eventId: '401', serviceId: '572', title: 'One Under 1', shortDesc: "One under is the term Tube drivers and emergency services often use as shorthand for a person under their train.", startTime: currentTime - ONE_HOUR, endTime: currentTime + ONE_HOUR, parentalRating: 12},
			{eventId: '402', serviceId: '572', title: 'One Under 2', shortDesc: "One under is the term Tube drivers and emergency services often use as shorthand for a person under their train.", startTime: currentTime + ONE_HOUR, endTime: currentTime + ONE_HOUR * 2, parentalRating: 12},
			{eventId: '403', serviceId: '572', title: 'One Under 3', shortDesc: "One under is the term Tube drivers and emergency services often use as shorthand for a person under their train.", startTime: currentTime + ONE_HOUR * 2, endTime: currentTime + ONE_HOUR * 4, parentalRating: 10},
			{eventId: '501', serviceId: '578', title: 'The MI5 Hoaxer 1', shortDesc: "Nineteen-year-old Oxford jewellery shop assistant Leanne McCarthy found herself trapped in a modern nightmare of kidnap, fear and mind control when she met 23-year-old Wayne Gouveia, a sophisticated conman with a track record of duping young women.", startTime: currentTime - ONE_HOUR, endTime: currentTime + ONE_HOUR, parentalRating: 8},
			{eventId: '502', serviceId: '578', title: 'The MI5 Hoaxer 2', shortDesc: "Nineteen-year-old Oxford jewellery shop assistant Leanne McCarthy found herself trapped in a modern nightmare of kidnap, fear and mind control when she met 23-year-old Wayne Gouveia, a sophisticated conman with a track record of duping young women.", startTime: currentTime + ONE_HOUR, endTime: currentTime + ONE_HOUR * 2, parentalRating: 8},
			{eventId: '503', serviceId: '578', title: 'The MI5 Hoaxer 3', shortDesc: "Nineteen-year-old Oxford jewellery shop assistant Leanne McCarthy found herself trapped in a modern nightmare of kidnap, fear and mind control when she met 23-year-old Wayne Gouveia, a sophisticated conman with a track record of duping young women.", startTime: currentTime + ONE_HOUR * 2, endTime: currentTime + ONE_HOUR * 4, parentalRating: 4},
			{eventId: '601', serviceId: '000100190278', title: 'The Story Of Film 1', shortDesc: "The explosive story of film in the late 50s and 60s. The great movie star Claudia Cardinale talks exclusively about Federico Fellini.", startTime: currentTime - ONE_HOUR, endTime: currentTime + ONE_HOUR, parentalRating: 12},
			{eventId: '602', serviceId: '000100190278', title: 'The Story Of Film 2', shortDesc: "The explosive story of film in the late 50s and 60s. The great movie star Claudia Cardinale talks exclusively about Federico Fellini.", startTime: currentTime + ONE_HOUR, endTime: currentTime + ONE_HOUR * 2, parentalRating: 18},
			{eventId: '603', serviceId: '000100190278', title: 'The Story Of Film 3', shortDesc: "The explosive story of film in the late 50s and 60s. The great movie star Claudia Cardinale talks exclusively about Federico Fellini.", startTime: currentTime + ONE_HOUR * 2, endTime: currentTime + ONE_HOUR * 4, parentalRating: 18},
			// 15min events:
			{eventId: '701', serviceId: '000100190278', title: 'There Was A Girl 1', shortDesc: "Film a bout a girl that there once was.", startTime: currentTime + ONE_HOUR, endTime: currentTime + 900000, parentalRating: 14},
			{eventId: '702', serviceId: '000100190278', title: 'There Was A Girl 2', shortDesc: "Film a bout a girl that there once was.", startTime: currentTime + 900000, endTime: currentTime + 900000 * 2, parentalRating: 16},
			{eventId: '703', serviceId: '000100190278', title: 'There Was A Girl 3', shortDesc: "Film a bout a girl that there once was.", startTime: currentTime + 900000 * 2, endTime: currentTime + 900000 * 4, parentalRating: 18}
		];

	return {
		getServicesRSByQuery: function (fields, criteria, order) {
			var results = SERVICES_TEST_DATA,
				i,
				rs = null;
			if (criteria && criteria !== "") {
				if (criteria.substr(0, 12) === "servicesType") {
					for (i = 0; i < SERVICES_TEST_DATA.length; i++) {
						if (String(SERVICES_TEST_DATA[i].servicesType) === criteria.substring(13, criteria.length)) {
							results.push(SERVICES_TEST_DATA[i]);
						}
					}
				} else {
					CCOM.stubs.log("Did not catch it in CCOM.EPG.getServicesRSByQuery, criteria parsing.");
				}
			} else {
				results = SERVICES_TEST_DATA;
			}
			if (results.length === 0) {
				CCOM.stubs.log("Did not catch it in CCOM.EPG.getServicesRSByQuery, RS.length==0.");
			}
			rs = new ResultSet(results);
			return rs;
		},

		getEventsRSByQuery: function (fields, criteria, order) {
			var results = [],
				matchArray = [],
				i,
				serviceListArray = [],
				serviceList = null,
				startTime = null,
				endTime = null,
				j = 0,
				pattern = /serviceId='(\d+)'/g,
				rs = null;
			if (criteria && criteria !== "") {
				// serviceId = '120' AND startTime <= 1367045620407 AND endTime > 1367045620407
				if (null !== (matchArray = new RegExp(/^serviceId = '(\d+)' AND startTime <= (\d+) AND endTime > (\d+)$/g).exec(criteria))) {
					for (i = 0; i < EVENT_TEST_DATA.length; i++) {
						if (String(EVENT_TEST_DATA[i].serviceId) === matchArray[1]) {
							results.push(EVENT_TEST_DATA[i]);
						}
					}
				// (serviceId='120' AND endTime >= '1381399219387')
				} else if (null !== (matchArray = new RegExp(/^\(serviceId[ ]?[><]?=?[ ]?'?(\d+)'?[ ]?AND[ ]?endTime[ ]?[><]?=?[ ]?'?(\d+)'?\)$/g).exec(criteria))) {
					for (i = 0; i < EVENT_TEST_DATA.length; i++) {
						if (String(EVENT_TEST_DATA[i].serviceId) === matchArray[1]) {
							results.push(EVENT_TEST_DATA[i]);
						}
					}
				// eventId = '101'
				} else if (null !== (matchArray = new RegExp(/^eventId = '(\d+)'/g).exec(criteria))) {
					for (i = 0; i < EVENT_TEST_DATA.length; i++) {
						if (String(EVENT_TEST_DATA[i].eventId) === matchArray[1]) {
							results.push(EVENT_TEST_DATA[i]);
						}
					}

				// criteria:(serviceId='120' OR serviceId='353' OR serviceId='480' OR serviceId='572' OR serviceId='578' OR serviceId='701') AND startTime <= '1367056110082' AND endTime >= '1367056110082'"
				// fields: "DISTINCT serviceId, title"
				} else if (null !== (matchArray = new RegExp(/^\((.*)\) AND startTime <= '(\d+)' AND endTime >= '(\d+)'/g).exec(criteria))) {
					serviceListArray = [];
					serviceList = matchArray[1];
					startTime = matchArray[2];
					endTime = matchArray[3];
					j = 0;
					pattern = /serviceId='(\d+)'/g;
					while ((matchArray = pattern.exec(serviceList)) !== null) {
						serviceListArray.push(matchArray[1]);
					}

					for (i = 0; i < EVENT_TEST_DATA.length; i++) {
						for (j = 0; j < serviceListArray.length; j++) {
							if (String(EVENT_TEST_DATA[i].serviceId) === serviceListArray[j] &&
									EVENT_TEST_DATA[i].startTime <= startTime &&
									EVENT_TEST_DATA[i].endTime >= endTime) {
								results.push(EVENT_TEST_DATA[i]);
							}
						}
					}

				// criteria: "serviceId IN ('120') AND endTime > 1367919907170 AND startTime < 1368458999000"
				} else if (null !== (matchArray = new RegExp(/^serviceId IN \('(\d+)'\) /g).exec(criteria))) {
					for (i = 0; i < EVENT_TEST_DATA.length; i++) {
						if (String(EVENT_TEST_DATA[i].serviceId) === matchArray[1]) {
							results.push(EVENT_TEST_DATA[i]);
						}
					}

				// criteria: serviceId = '120' AND ...
				} else if (null !== (matchArray = new RegExp(/^serviceId = '(\d+)' /).exec(criteria))) {
					for (i = 0; i < EVENT_TEST_DATA.length; i++) {
						if (String(EVENT_TEST_DATA[i].serviceId) === matchArray[1]) {
							results.push(EVENT_TEST_DATA[i]);
						}
					}
				// criteria: (serviceId='000100190278')
				} else if (null !== (matchArray = new RegExp(/serviceId='(\d+)'/).exec(criteria))) {
					for (i = 0; i < EVENT_TEST_DATA.length; i++) {
						if (String(EVENT_TEST_DATA[i].serviceId) === matchArray[1]) {
							results.push(EVENT_TEST_DATA[i]);
						}
					}
				} else {
					CCOM.stubs.log("Did not catch it in CCOM.EPG.getEventsRSByQuery, criteria parsing.");
				}
			} else {
				results = EVENT_TEST_DATA;
			}
			if (results.length === 0) {
				CCOM.stubs.log("Did not catch it in CCOM.EPG.getEventsRSByQuery, RS.length==0.");
				CCOM.stubs.log("criteria: " + criteria);
				CCOM.stubs.log("fields: " + fields);
			}
			rs = new ResultSet(results);
			return rs;
		},

		getEventById: function (id) {
			var i;
			for (i = 0; i < EVENT_TEST_DATA.length; i++) {
				if (EVENT_TEST_DATA[i].eventId === id) {
					return EVENT_TEST_DATA[i];
				}
			}
			return null;
		},

		getEventCurrent: function (serviceId) {
			var i;
			for (i = 0; i < EVENT_TEST_DATA.length; i++) {
				if (String(EVENT_TEST_DATA[i].serviceId) === String(serviceId) && EVENT_TEST_DATA[i].startTime < currentTime && EVENT_TEST_DATA[i].endTime > currentTime) {
					return EVENT_TEST_DATA[i];
				}
			}
			return null;
		},

		getEventNext: function (serviceId) {
			var i,
				event = null;
			for (i = 0; i < EVENT_TEST_DATA.length; i++) {
				if (String(EVENT_TEST_DATA[i].serviceId) === String(serviceId) && EVENT_TEST_DATA[i].startTime > currentTime && (event === null || EVENT_TEST_DATA[i].startTime < event.startTime)) {
					return EVENT_TEST_DATA[i];
				}
			}
			return event;
		},

		getEventPrevious: function (serviceId) {
			var i,
				event = null;
			for (i = 0; i < EVENT_TEST_DATA.length; i++) {
				if (String(EVENT_TEST_DATA[i].serviceId) === String(serviceId) && EVENT_TEST_DATA[i].endTime < currentTime && (event === null || EVENT_TEST_DATA[i].endTime > event.endTime)) {
					return EVENT_TEST_DATA[i];
				}
			}
			return event;
		},

		getEventsByWindow: function (serviceIds, start, end) {
			var i,
				events = [];
			for (i = 0; i < EVENT_TEST_DATA.length; i++) {
				if (serviceIds.indexOf(EVENT_TEST_DATA[i].serviceId) !== -1 && EVENT_TEST_DATA[i].startTime < end && EVENT_TEST_DATA[i].endTime > start) {
					events.push(EVENT_TEST_DATA[i]);
				}
			}
			return events;
		},

		getEventsRSByExtInfo: function (properties, extInfo, criteria, orderBy) {
			return {
				error: {
					name: "Unimplemented",
					message: ""
				}
			};
		},

		getEventsRSByGenre: function (properties, genre, criteria, orderBy) {
			return {
				error: {
					name: "Unimplemented",
					message: ""
				}
			};
		},

		getExtInfoByEventId: function (eventId, language, maxCount) {
			return {
				error: {
					name: "Unimplemented",
					message: ""
				}
			};
		},

		getFavoriteLists: function () {
			return {
				error: {
					name: "Unimplemented",
					message: ""
				}
			};
		},

		getGenresByEventId: function () {
			return {
				error: {
					name: "Unimplemented",
					message: ""
				}
			};
		},

		getServicesRSByFavoriteList: function (properties, listName) {
			return {
				error: {
					name: "Unimplemented",
					message: ""
				}
			};
		},

		removeFavoriteList: function (listName) {
			return {
				error: {
					domain: "com.opentv.EPG",
					name: "Unimplemented",
					message: ""
				},
				handle: null
			};
		},

		setFavoriteList: function (listName, serviceIds) {
			return {
				error: {
					domain: "com.opentv.EPG",
					name: "Unimplemented",
					message: ""
				},
				handle: null
			};
		},

		addEventListener: function (event, callback) {
			if (eventListeners[event] === undefined) {
				eventListeners[event] = [];
			}
			eventListeners[event].push(callback);
		},

		removeEventListener: function (event, callback) {
			var listeners = eventListeners[event],
				i;
			for (i = 0; i < listeners.length; i++) {
				if (listeners[i] === callback) {
					listeners.splice(i, 1);
				}
			}
		},

		getTagsByServiceId: function (serviceId) {
			return [];
		},

		addService: function () {
			return null;
		},

		getGenresByServiceId: function (serviceId) {
			return [];
		},

		tagService: function () {
			// do nothing
		}

	};
}());


