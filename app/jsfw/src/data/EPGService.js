/**
 * The EPGService Object is returned by EPG queries that request data for a TV channel. `$N.platform.btv.EPG` is an
 * example of a class that returns objects conforming to the structure defined here.
 * @class $N.data.EPGService
 * @static

 * @author Gareth Stacey
 */
var $N = $N || {};
$N.data = $N.data || {};
define('jsfw/data/EPGService',
	[],
	function () {
		$N.data.EPGService = {
			/**
			 * Denotes the type of Service, one of
			 * `TV`, `RADIO`, `TELETEXT`, `DATA`, `OTHER`
			 * @property {Enum} SERVICE_TYPE
			 * @readonly
			 * @static
			 */
			SERVICE_TYPE: {
				TV: 1,
				RADIO: 2,
				TELETEXT: 3,
				DATA: 4,
				OTHER: 5
			},
			/**
			 * Denotes how the Service is delivered, one of
			 * `DVB`, `IP` or `GATEWAY`
			 * @property {Number} DELIVERY_TYPE
			 * @readonly
			 * @static
			 */
			DELIVERY_TYPE: {
				DVB: 1,
				IP: 2,
				GATEWAY: 3
			}

			/**
			 * The unique identifier for this service
			 * @property {String} serviceId
			 */
			/**
			 *  The channel number to be presented to the user
			 *  @property {Number} logicalChannelNum
			 */
			/**
			 * Describes the type of service, one of:
			 * `$N.data.EPGService.SERVICE_TYPE`
			 * @property {Number} serviceType
			 */
			/**
			 * Describes how the service is delivered, one of:
			 * `$N.data.EPGService.DELIVERY_TYPE`
			 * @property {Number} deliveryMethod
			 */
			/**
			 * The name of the service to be presented to the user
			 * @property {String} serviceName
			 */
			/**
			 * The source URI, used to tune to the service
			 * @property {String} uri
			 */
			/**
			 * The identifier used to match the service to the conditional access system
			 * @property {String} casId
			 */
			/**
			 * True if a user has access to this service as defined by their subscriptions
			 * @property {Boolean} isSubscribed
			 */
			/**
			 * a minimum age required to watch this service
			 * @property {String} parentalRating
			 */
			/**
			 * The URL of the channel logo
			 * @property {String} logo
			 */
			/**
			 * True if the channel supports catch up events
			 * @property {Boolean} isCatchUp
			 */
			/**
			 * True if the channel supports start over events
			 * @property {Boolean} isStartOver
			 */
			/**
			 * Will contain primaryObject data if merged otherwise undefined
			 * @property {Object} primaryObject
			 */
			/**
			 * Will contain secondaryObject data if merged otherwise undefined
			 * @property {Object} secondaryObject
			 */
			/**
			 * Indicates if the service is NPVR enabled. This property has precedence over the event level isnPvr property
			 * @property {Boolean} nPvrSupport
			 */
		};
		return $N.data.EPGService;
	}
);