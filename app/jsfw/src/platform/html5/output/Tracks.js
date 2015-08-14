/**
 * This class is responsible for handling Tracks and provides utility methods to deal with
 * subtitle, audio and video Tracks selections. Each Tracks object will be available through the
 * NagraMediaElement.
 *
 * @class $N.platform.output.Tracks
 * @author Mark Brown
 *
 * @constructor
 * @param {Object} player an HTML/NMP Player object, which this class mainly uses to retrieve
 * and manipulate streams (tracks)
 */
/*global userAgent*/
define('jsfw/platform/output/Tracks',
    [
    	'jsfw/apps/core/Log'
    ],
	function (Log) {
		var log = new $N.apps.core.Log("output", "Tracks");

		var Tracks = function (player) {
			var me = this;
			if (window.userAgent) {
				if (userAgent.attachEvent) {
					userAgent.attachEvent("ontracksChanged", function () {
						me._tracksChangedListener();
					});
				} else {
					userAgent.addEventListener("tracksChanged", function () {
						me._tracksChangedListener();
					}, false);
				}
			}
			this._clearInternalCache();
			this._trackChangedCallback = null;
		};

		/**
		 * Enumeration of Track types possible values are
		 * `audio`, `subtitle`, `other`, `video`
		 * @property {number} TYPES
		 */
		Tracks.TYPES = null;

		var proto = Tracks.prototype;

		// Private helper methods

		proto._tracksChangedListener = function () {
			this._sortTracksInStream();
			if (this._trackChangedCallback) {
				this._trackChangedCallback();
			}
		};

		proto._getTrackById = function (cache, id) {
			var i;
			for (i = 0; i < cache.length; i++) {
				if (cache[i].id === id) {
					return cache[i];
				}
			}
			return null;
		};

		/**
		 * Clears the cache of tracks stored in this object.
		 *
		 * @method _clearInternalCache
		 * @private
		 */
		proto._clearInternalCache = function () {
			this._audioTracks = [];
			this._subtitleTracks = [];
			this._videoTracks = [];
			this._otherTracks = [];
		};

		/**
		 * Returns the array index of the active track for the given track array, or null if no
		 * active track exists.
		 *
		 * @method _getIndexOfActiveTrack
		 * @param {Object} trackArray
		 * @private
		 * @return {Number} or null
		 */
		proto._getIndexOfActiveTrack = function (trackArray) {
			var trackArrayLength = trackArray.length,
			    i;
			for (i = 0; i < trackArrayLength; i++) {
				if (this.isActive(trackArray[i])) {
					return i;
				}
			}
			return null;
		};

		/**
		 * Sets the track for a given language to active if it exists in the taskArray, and returns whether the
		 * track was found.
		 *
		 * @param {String} language
		 * @param {Array} trackArray
		 * @method _activateTrackForLanguage
		 * @private
		 * @return {Boolean}
		 */
		proto._activateTrackForLanguage = function (language, trackArray) {
			var trackArrayLength = trackArray.length,
			    i;
			for (i = 0; i < trackArrayLength; i++) {
				if (this.getLanguage(trackArray[i]) === language) {
					this.activateTrack(trackArray[i]);
					return true;
				}
			}
			return false;
		};

		/**
		 * Goes to the next active track in the given array. If allowAllOff is true, allows all tracks to
		 * be inactive as part of the cycle.
		 *
		 * @param {Object} trackArray
		 * @param {Boolean} allowAllOff
		 * @private
		 * @method _activateNextTrack
		 * @return {Object} the new active track or null if none active
		 */
		proto._activateNextTrack = function (trackArray, allowAllOff) {
			var activeIndex = this._getIndexOfActiveTrack(trackArray);
			if (activeIndex !== null) {
				this.deactivateTrack(trackArray[activeIndex]);
				if (activeIndex === trackArray.length - 1) {
					if (!allowAllOff) {
						this.activateTrack(trackArray[0]);
						return trackArray[0];
					}
				} else {
					this.activateTrack(trackArray[++activeIndex]);
					return trackArray[activeIndex];
				}
			} else {
				if (trackArray.length > 0) {
					this.activateTrack(trackArray[0]);
					return trackArray[0];
				}
			}
			return null;
		};

		/**
		 * Updates (clears and re-populates) the cache of tracks stored in this object.
		 * The available tracks are obtained from the player object.
		 *
		 * @method _sortTracksInStream
		 * @private
		 */
		proto._sortTracksInStream = function () {
			if (window.userAgent) {
				this._audioTracks = userAgent.audioTracks;
				this._subtitleTracks = userAgent.subtitlingTracks;
			}
		};

		// Public API

		/**
		 * Returns the stream object that contains the PID objects that are the additional
		 * audio / subtitle / video tracks
		 * @method getStream
		 * @return {Object} The active video stream object.
		 */
		proto.getStream = function () {
			return this._stream;
		};

		/**
		 * Clears and re-loads the active streams from the player stored within this object.
		 *
		 * @method setStream
		 * @param stream {Object} the Stream object
		 */
		proto.setStream = function (stream) {
			this._sortTracksInStream();
			this._stream = stream;
		};

		/**
		 * Returns all the audio tracks in the stream object passed in to the `setStream` method
		 *
		 * @method getAudioTracks
		 * @return {Array} array of audio tracks, which may be empty if there is none.
		 */
		proto.getAudioTracks = function () {
			return this._audioTracks;
		};

		/**
		 * Returns all the video tracks in the stream object passed in to the `setStream` method
		 *
		 * @method getVideoTracks
		 * @return {Array} array of video tracks, which may be empty if there is none.
		 */
		proto.getVideoTracks = function () {
			return [];
		};

		/**
		 * Returns all the subtitle tracks in the stream object passed in to the `setStream` method
		 *
		 * @method getSubtitleTracks
		 * @return {Array} array of subtitle tracks, which may be empty if there is none.
		 */
		proto.getSubtitleTracks = function () {
			return this._subtitleTracks;
		};

		/**
		 * Returns all the data tracks in the stream object passed in to the `setStream` method
		 *
		 * @method getDataTracks
		 * @return {Array} array of data tracks, which may be empty if there is none.
		 */
		proto.getDataTracks = function () {
			return [];
		};

		/**
		 * Returns all the 'other' tracks (streams) (i.e. those not considered to be of any
		 * other recognised type) stored within this object.
		 *
		 * @method getOtherTracks
		 * @return {Array} array of 'other' tracks, which may be empty if there is none.
		 */
		proto.getOtherTracks = function () {
			return [];
		};

		/**
		 * Returns the currently active audio track for the stream. Useful for keeping the user
		 * informed. If no audio track is active, null is returned.
		 *
		 * @method getActiveAudioTrack
		 * @return {Object} the audio track that is active, or null if there is none.
		 */
		proto.getActiveAudioTrack = function () {
			var activeIndex = this._getIndexOfActiveTrack(this._audioTracks);
			return activeIndex === null ? null : this._audioTracks[activeIndex];
		};

		/**
		 * Returns the currently active subtitle track for the stream. Useful for keeping the user
		 * informed. If no subtitle track is active, null is returned.
		 *
		 * @method getActiveSubtitleTrack
		 * @return {Object} the subtitle track that is active, or null if there is none.
		 */
		proto.getActiveSubtitleTrack = function () {
			var activeIndex = this._getIndexOfActiveTrack(this._subtitleTracks);
			return activeIndex === null ? null : this._subtitleTracks[activeIndex];
		};

		/**
		 * Returns the currently active video track for the stream. Useful for keeping the user
		 * informed. If no video track is active, null is returned.
		 *
		 * @method getActiveVideoTrack
		 * @return {Object} the video track that is active, or null if there is none.
		 */
		proto.getActiveVideoTrack = function () {
			return null;
		};

		/**
		 * Returns the currently active data track for the stream, useful for when you want to inform
		 * the user. If there is no data track active active, then null is returned.
		 *
		 * @method getActiveDataTrack
		 * @return {Object} the data track that is active, or null if there is none.
		 */
		proto.getActiveDataTrack = function () {
			return null;
		};

		/**
		 * Returns the currently active 'other' track for the stream, useful for when you want to inform
		 * the user. If there is no 'other' track active, then null is returned. An 'other' track is one
		 * that is not recognised as being one of the other types.
		 *
		 * @method getActiveOtherTrack
		 * @return {Object} the 'other' video track that is active, or null if there is none.
		 */
		proto.getActiveOtherTrack = function () {
			return null;
		};


		/**
		 * Get the list of all stored dual-mono audio tracks (channels; streams).
		 *
		 * @method getDualMonoAudioTracks
		 * @return {Array} an array of audio tracks that have a dual-mono channel, which may be empty.
		 */
		proto.getDualMonoAudioTracks = function () {
			return [];
		};

		/**
		 * Get the dual-mono channel mode for an audio track.
		 *
		 * @method getDualMonoChannelMode
		 * @param audioTrack {Object} the track whose dual mono channel mode is queried
		 * @return {Number} one of `AudioPID.AUDIOPID_DUAL_MONO_MIX_MODE_NA`,
		 *         `AudioPID.AUDIOPID_DUAL_MONO_MIX_MODE_LEFT_ONLY`,
		 *         `AudioPID.AUDIOPID_DUAL_MONO_MIX_MODE_RIGHT_ONLY` or
		 *         `AudioPID.AUDIOPID_DUAL_MONO_MIX_MODE_BOTH`, or -1 either if there's
		 *         no default audio track or if the track is not an audio track
		 */
		proto.getDualMonoChannelMode = function (audioTrack) {
			return -1;
		};

		/**
		 * Set the dual-mono channel mode for a given audio track.
		 *
		 * @method setDualMonoChannelMode
		 * @param audioTrack {Object} the track whose dual mono channel mode is to be set
		 * @param mode {Number} the desired audio channel mode. See `getDualMonoChannelMode`
		 * for legal values
		 */
		proto.setDualMonoChannelMode = function (audioTrack, mode) {
		};

		/**
		 * Activates the given track. It is expected that the track is known prior to calling this
		 * function by calling one of the `getTracks` methods.
		 *
		 * @method activateTrack
		 * @param {Object} track
		 */
		proto.activateTrack = function (track) {
			if (window.userAgent) {
				userAgent.activateTrack(track);
			}
		};

		/**
		 * Deactivates the given track. It is expected that the track is known prior to calling this
		 * function by calling one of the `getTracks` methods.
		 *
		 * @method deactivateTrack
		 * @param {Object} track
		 */
		proto.deactivateTrack = function (track) {
			if (window.userAgent) {
				userAgent.deactivateTrack(track);
			}
		};

		/**
		 * This method will check if there is an audio track available for the given language code, and
		 * if so, activate it.
		 *
		 * @method activateAudioTrackByLanguage
		 * @param {String} languageCode e.g. eng, fra, rus
		 * @return {Boolean} true if activated, false if not found
		 */
		proto.activateAudioTrackByLanguage = function (languageCode) {
			return this._activateTrackForLanguage(languageCode, this._audioTracks);
		};

		/**
		 * This method will check if there is an subtitle track available for the given language code and,
		 * if so, activate it.
		 *
		 * @method activateSubtitleTrackByLanguage
		 * @param {String} languageCode e.g. eng, fra, rus
		 * @return {Boolean} true if activated, false if not found
		 */
		proto.activateSubtitleTrackByLanguage = function (languageCode) {
			return this._activateTrackForLanguage(languageCode, this._subtitleTracks);
		};

		/**
		 * Activate the next audio track available in the stream. For example, if the stream has two
		 * audio tracks, one in English and one in French, and if the current audio is English, this
		 * method will switch the audio to French, and vice versa. Note that the behaviour is cyclic,
		 * so a call to this method after reaching the last track in the stored list will activate the
		 * first track in the list.
		 *
		 * @method cycleAudioTracks
		 * @return {Object}
		 */
		proto.cycleAudioTracks = function () {
			return this._activateNextTrack(this._audioTracks, false);
		};

		/**
		 * Activate the next subtitle track available in the stream. For example, if the stream has two
		 * subtitle tracks, one in English and one in French, and if the current subtitle is English, this
		 * method will switch the subtitles to French, and vice versa. Note that the behaviour is cyclic,
		 * so a call to this method after reaching the last track in the stored list will activate the
		 * first track in the list.
		 *
		 * @method cycleSubtitleTracks
		 * @return {Object}
		 */
		proto.cycleSubtitleTracks = function () {
			return this._activateNextTrack(this._subtitleTracks, true);
		};

		/**
		 * Returns the language of the given track (stream), or "Unknown" if not found (e.g. because it's a video
		 * track). Audio or subtitle tracks would be valid inputs.
		 *
		 * @method getLanguage
		 * @param {Object} track
		 */
		proto.getLanguage = function (track) {
			if (track) {
				return track.language;
			}
			return null;
		};

		/**
		 * Determines whether the given track is active.
		 *
		 * @method isActive
		 * @param track {Object}
		 * @return {Boolean} true if the track is active, false if not or if the player or given track is null.
		 */
		proto.isActive = function (track) {
			return track.active ? true : false;
		};

		/**
		 * Sets the callback to execute when an active subtitle track is lost
		 * to allow the UI to be updated
		 * @method setActiveSubtitleTrackLostCallback
		 * @param {Function} callback can be set to null to disable / remove
		 */
		proto.setActiveSubtitleTrackLostCallback = function (callback) {
		};

		/**
		 * Sets the callback to execute when an active audio track is lost
		 * to allow the UI to be updated
		 * @method setActiveAudioTrackLostCallback
		 * @param {Function} callback can be set to null to disable / remove
		 */
		proto.setActiveAudioTrackLostCallback = function (callback) {
		};

		/**
		 * Sets the callback to execute when an new subtitle track is found
		 * to allow the UI to be updated / subtitles enabled for a
		 * preferred language etc.
		 * @method setNewSubtitleTrackFoundCallback
		 * @param {Function} callback can be set to null to disable / remove
		 */
		proto.setNewSubtitleTrackFoundCallback = function (callback) {
		};

		/**
		 * Sets the callback to execute when an new audio track is found
		 * to allow the UI to be updated / subtitles enabled for a
		 * preferred language etc.
		 * @method setNewAudioTrackFoundCallback
		 * @param {Function} callback can be set to null to disable / remove
		 */
		proto.setNewAudioTrackFoundCallback = function (callback) {
		};

		/**
		 * Sets the callback to execute when tracks change
		 * @method setTracksChangedCallback
		 * @param {Function} callback
		 */
		proto.setTracksChangedCallback = function (callback) {
			this._trackChangedCallback = callback;
		};

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.Tracks = Tracks;
		return Tracks;
	}
);
