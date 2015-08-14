var $N = $N || {};
$N.data = $N.data || {};
/**
 * The EPGEvent Object is returned by EPG queries that request data for a programme/event
 * that is scheduled to broadcast on a channel/service
 * @class $N.data.EPGEvent
 * @static
 * @author Gareth Stacey
 */
define('jsfw/data/EPGEvent',
	[],
	function () {
		$N.data.EPGEvent = {
			/**
			 * Specifies the origin of the EPG event item
			 * @property {Enum} SOURCE
			 * @readonly
			 * @static
			 */
			SOURCE: {
				EIT: "E",
				SDP: "S",
				MDS: "S",
				GATEWAY: "G"
			}
			/**
			 * The unique identifier for the event
			 * @property {String} eventId
			 */
			/**
			 * The service that the event belongs to
			 * @property {String} serviceId
			 */
			/**
			 * The start time of the event in UTC
			 * @property {Number} startTime
			 */
			/**
			 * The end time of the event in UTC
			 * @property {Number} endTime
			 */
			/**
			 * The minimum age for allowed viewing
			 * @property {String} parentalRating
			 */
			/**
			 * The title of the event/programme
			 * @property {String} title
			 */
			/**
			 * A short description of the event
			 * @property {String} shortDesc
			 */
			/**
			 * A full description of the event
			 * @property {String} longDesc
			 */
			/**
			 * The id of the series
			 * @property {String} seriesId
			 */
			 /**
			 * The id of the episode
			 * @property {String} episodeId
			 */
			 /**
			 * The id of the season
			 * @property {String} seasonId
			 */
			 /**
			 * The name of the series
			 * @property {String} seriesName
			 */
			 /**
			 * Defines if the event supports CatchUp
			 * @property {Boolean} isCatchUp
			 */
			 /**
			 * Defines if the event supports Start Over
			 * @property {Boolean} isStartOver
			 */
			 /**
			 * The id of the event that can be linked to a DVB ID
			 * @property {String} dvbEventId
			 */
			/**
			 * Returns the year the event was filmed.
			 * In some cases the information is only available asynchronously
			 * in which case a function will be returned that can be called passing
			 * a callback function as parameter. Upon the year being available, the
			 * callback will be executed and year passed as a parameter. The year will then
			 * be cached such that subsequent calls will be synchronous.
			 * @property {String} year
			 */
			/**
			 * The definition of the event e.g. SD, HD, 3D etc
			 * @property {String} definition
			 */
			/**
			 * Returns the URL of the promotional image for the event (or an empty string).
			 * In some cases the information is only available asynchronously
			 * in which case a function will be returned that can be called passing
			 * a callback function as parameter. Upon the image being available, the
			 * callback will be executed and url passed as a parameter. The url will then
			 * be cached such that subsequent calls will be synchronous.
			 * @property {String} promoImage
			 */
			/**
			 * Only available for a Startover/Catch up event. Returns the URL to play the event.
			 * This will need to be prefixed with a video path that hosts the content.
			 * @property {String} uri
			 */
			/**
			 * Only available for a Startover/Catch up event. Returns the CAS ID of the channel that
			 * the event was broadcasted on.
			 * @property {String} casId
			 */
			/**
			 * Indicates if the event can be NPVR recorded. This flag should be checked in conjunction with the nPvrSupport property on the service corresponding to this event (The service nPvrSupport flag has precedence)
			 * @property {Boolean} isnPvr
			 */
		};
		return $N.data.EPGEvent;
	}
);