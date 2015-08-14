/**
 * The Chapters class encapsulates the logic required for splitting
 * video content into a pre-defined set of chunks/chapters. There is no
 * GUI element to this class it is down to the developer to implement
 * a GUI wrapper, since here there are methods available to
 * getNextChapter position etc.  Once instantiated the developer is free
 * to set the content length, number of chapters using the setContentLength
 * and setNumberOfChapters methods. The default number of chapters is 10.
 * @class $N.platform.output.Chapters
 * @requires $N.apps.core.Log
 * @author mbrown
 *
 * @constructor
 */

define('jsfw/platform/output/Chapters',
    ['jsfw/apps/core/Log'],
	function (Log) {

		var log = $N.apps.core.Log("output", "Chapters");

		var Chapters = function () {
			this._chaptersList = [];
			this._numberOfChapters = 10;
			this._contentDurationInSec = 0;
		};

		Chapters.MIN_SEC_PLAYED_IN_CURRENT_CHAPTER = 2;

		var proto = Chapters.prototype;

		// private helper methods

		/**
		 * Populates the _chaptersList property with the calculated
		 * chapter positions using the content duration and number of chapters
		 * @method _calculateChapterPositions
		 * @private
		 */
		proto._calculateChapterPositions = function () {
			log("_calculateChapterPositions", "Enter");

			var interval = this._contentDurationInSec / this._numberOfChapters;
			var i;
			var newPosition;
			this._chaptersList = [];

			log("_calculateChapterPositions", "interval" + String(interval));

			for (i = 0; i < this._numberOfChapters; i++) {
				newPosition = Math.round(i * interval);
				this._chaptersList.push(newPosition);
				log("_calculateChapterPositions", "Added chapter at: " + String(newPosition));
			}
			log("_calculateChapterPositions", "Exit");
		};

		// public API

		/**
		 * Set the content duration and then calculates the chapter positions
		 * based on the new content length
		 * @method setContentDuration
		 * @param {Number} seconds
		 */
		proto.setContentDuration = function (seconds) {
			this._contentDurationInSec = parseInt(seconds, 10);
			this._calculateChapterPositions();
		};

		/**
		 * Set the number of chapters to split the video content into. If the
		 * content length has already been set then the chapter positions based
		 * on the chapterCount are calculated.
		 * @method setNumberOfChapters
		 * @param {Number} chapterCount
		 */
		proto.setNumberOfChapters = function (chapterCount) {
			this._numberOfChapters = parseInt(chapterCount, 10);
			if (this._contentDurationInSec) {
				this._calculateChapterPositions();
			}
		};

		/**
		 * Returns the array containing the positions of all the chapters
		 * after the setContentLength has been called. Useful data for
		 * when drawing a GUI component.
		 * @method getChapters
		 * @return {Array}
		 */
		proto.getChapters = function () {
			return this._chaptersList;
		};

		/**
		 * Given the current playback position of the video content this method
		 * returns the position of the next chapter start. Return null if the position
		 * passed is in the last chapter position.
		 * @method getNextChapterPosition
		 * @param {Number} currentPosition The current playback position.
		 * @return {Number}
		 */
		proto.getNextChapterPosition = function (currentPosition) {
			log("getNextChapterPoistion", "Enter");
			var i;
			for (i = 0; i <= this._chaptersList.length - 1; i++) {
				if (currentPosition < this._chaptersList[i]) {
					log("getNextChapterPoistion", "returning next position: " + this._chaptersList[i]);
					return this._chaptersList[i];
				}
			}
			log("getNextChapterPoistion", "At end of content returning null");
			return null;
		};

		/**
		 * Given the current playback position of the video content this method
		 * returns the position of the previous chapter start. Return 0 if the position
		 * passed is in the first chapter position.
		 * @method getPreviousChapterPosition
		 * @param {Number} currentPosition The current playback position.
		 * @return {Number}
		 */
		proto.getPreviousChapterPosition = function (currentPosition) {
			log("getPreviousChapterPosition", "Enter");
			var i;
			for (i = 1; i <= this._chaptersList.length; i++) {
				if (currentPosition < this._chaptersList[i]) {
					if (i === 1) {
						log("getPreviousChapterPosition", "In first chapter returning position 0");
						return 0;
					}
					// If the current position is has passed the 2 seconds in the current chapter
					// return the current chapter start else return previous chapter start.
					if ((currentPosition - this._chaptersList[i - 1]) > Chapters.MIN_SEC_PLAYED_IN_CURRENT_CHAPTER) {
						log("getPreviousChapterPosition", "Not close to beginning of chapter returning" + this._chaptersList[i - 1]);
						return this._chaptersList[i - 1];
					}
					log("getPreviousChapterPosition", "Close to beginning of chapter returning" + this._chaptersList[i - 2]);
					return this._chaptersList[i - 2];
				}
			}
			log("getPreviousChapterPoistion", "Exit");
			return 0;
		};

		/**
		 * Determines whether the current player position is in the the last chapter
		 * Return true if the position is in last chapter or else false.
		 * @method isCurrentPositionInLastChapter
		 * @param currentPosition
		 * @return {Boolean}
		 */
		proto.isCurrentPositionInLastChapter = function (currentPosition) {
			return this._chaptersList && this._chaptersList.length > 2 &&
				(currentPosition > this._chaptersList[this._chaptersList.length - 2]) &&
				(currentPosition < this._chaptersList[this._chaptersList.length - 1]);
		};

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.Chapters = Chapters;
		return Chapters;
	}
);
