var $N = $N || {};
$N.data = $N.data || {};
/**
 * The Recording Object is used to store attributes of a recording or a scheduled
 * recording in a common format.
 *
 * @class $N.data.Recording
 * @static
 * @author Nigel Thorne
 */
define('jsfw/data/Recording',
	[],
	function () {
		$N.data.Recording = {
			/**
			 * Denotes the type of recording
			 * `SINGLE`, `SERIES`
			 * e.g `$N.data.Recording.RECORDING_TYPE.SERIES`
			 * @property {Enum} RECORDING_TYPE
			 * @readonly
			 * @static
			 */
			RECORDING_TYPE: {
				SINGLE: 0,
				SERIES: 1
			}
			/**
			 * The unique identifier for the recording / scheduled recording (mandatory unless this recording relates to a series folder)
			 * @property {String} taskId
			 */
			/**
			 * The identifier for the job to which the recording / scheduled recording belongs (mandatory)
			 * @property {String} jobId
			 */
			/**
			 * The identifier for the series of which the recording is part (optional)
			 * @property {String} seriesId
			 */
			/**
			 * The identifier for the season of the series of which the recording is part (optional)
			 * @property {String} seasonId
			 */
			/**
			 * The identifier for the episode in the series of the recording (optional)
			 * @property {String} episodeId
			 */
			/**
			 * The name of the series used for display in the folder of recordings
			 * @property {String} seriesName
			 */
			/**
			 * The title of the recording
			 * @property {String} title
			 */
			/**
			 * The url in which the recording is to be displayed
			 * @property {String} url
			 */
			/**
			 * The eventId relating to the recording / scheduled recording
			 * @property {String} eventId
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
			 * Specifies the number of milliseconds before the start time that the event can start if there are resources.
			 * @property {Number} softPrepaddingDuration
			 */
			/**
			 * Specifies the number of milliseconds after the end time that the event can persist if there are resources.
			 * @property {Number} softPostpaddingDuration
			 */
			/**
			 * The duration of the recording / scheduled recording
			 * @property {Number} duration
			 */
			/**
			 * Unique identifier of the channel on which the recording was made / scheduled
			 * @property {String} serviceId
			 */
			/**
			 * A short description of the event
			 * @property {String} shortDesc
			 */
			/**
			 * A long description of the event
			 * @property {String} longDesc
			 */
			/**
			 * A description of the event content
			 * @property {String} contentDesc
			 */
			/**
			 * Flag to indicate whether or not recording is available for deletion
			 * @property {Number} keep
			 */
			/**
			 * The minimum age for allowed viewing
			 * @property {Number} parentalRating
			 */
			/**
			 * Identifier of the type of recording - 0 = Individual recording; 1 = Series recording
			 * @property {Number} recordingType
			 */
			/**
			 * Array of recordings for which this "recording" comprises the series folder under which the individual episodes reside
			 * @property {Array} subRecordings
			 */
			/**
			 * Image href if available
			 * @property {string} image
			 */
			/**
			 * The status of the recording (One of "NEW", "RECORDING" or "RECORDED")
			 * @property {String} status
			 */
		};
		return $N.data.Recording;
	}
);