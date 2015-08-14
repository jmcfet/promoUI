/**
 * This class is responsible for handling Tracks and provides utility methods to deal with
 * subtitle, audio and video Tracks selections. Each Tracks object will be available through the
 * video player. It controls which PIDs are active by registering PIDFound and PIDLost event
 * listeners and updates the active PID index variables accordingly upon being fired
 *
 * @class $N.platform.output.Tracks
 * @author Mark Brown
 *
 * @constructor
 */

define('jsfw/platform/output/Tracks',
    [
    	'jsfw/apps/core/Log'
    ],
	function (Log) {
		var log = new $N.apps.core.Log("output", "Tracks");

		/**
		 * Constructor that gets passed a CCOM Player object, which this class mainly uses to retrieve
		 * and manipulate streams (tracks).
		 *
		 * @method Tracks
		 * @param {Object} player
		 */
		var Tracks = function (player) {

		    var me = this;

		    this._player = player;
			this._clearInternalCache();
			this._activeAudioTrackLostCallback = null;
			this._activeSubtitleTrackLostCallback = null;
			this._newAudioTrackFoundCallback = null;
			this._newSubtitleTrackFoundCallback = null;

			if (!Tracks.TYPES) {
				Tracks.TYPES = {
					audio: player.STREAM_TYPE_AUDIO,
					subtitle: player.STREAM_TYPE_SUBTITLE,
					video: player.STREAM_TYPE_VIDEO,
					other: player.STREAM_TYPE_DATA
				};
			}

			this._streamErrorListener = function (e) {
				var streamErrorInfo = e.streamErrorInfo;
				var currentTrack;
				if (streamErrorInfo) {
					if (streamErrorInfo.type === player.STREAM_TYPE_AUDIO && me._activeAudioTrackLostCallback) {
						currentTrack = me.getActiveAudioTrack();
						if (currentTrack && currentTrack.id === streamErrorInfo.id) {
							me._activeAudioTrackLostCallback(streamErrorInfo.id);
						}
					} else if (streamErrorInfo.type === player.STREAM_TYPE_SUBTITLE && me._activeSubtitleTrackLostCallback) {
						currentTrack = me.getActiveSubtitleTrack();
						if (currentTrack && currentTrack.id === streamErrorInfo.id) {
							me._activeSubtitleTrackLostCallback(streamErrorInfo.id);
						}
					}
				}
				me._sortTracksInStream();
			};

			this._newTrackFoundListener = function (e) {
				me._sortTracksInStream();
				var audioTracks = me.getAudioTracks();
				var subtitleTracks = me.getSubtitleTracks();
				if (audioTracks.length && me._newAudioTrackFoundCallback) {
					me._newAudioTrackFoundCallback(audioTracks);
				}
				if (subtitleTracks.length && me._newSubtitleTrackFoundCallback) {
					me._newSubtitleTrackFoundCallback(subtitleTracks);
				}
			};

			// register internal listeners
			this._player.addEventListener("onStreamError", function (e) {me._streamErrorListener(e); });
			this._player.addEventListener("onStreamAvailable", function (e) {me._newTrackFoundListener(e); });

		};

		/**
		 * Enumeration of Track types possible values are
		 * `audio`, `subtitle`, `other`, `video`
		 * @property {number} TYPES
		 */
		Tracks.TYPES = null;

		var proto = Tracks.prototype;

		// Private helper methods

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
		 * Sets the track for a given id to active if it exists in the taskArray, and returns whether the
		 * track was found.
		 *
		 * @param {Number} id
		 * @param {Array} trackArray
		 * @method _activateTrackForId
		 * @private
		 * @return {Boolean}
		 */
		proto._activateTrackForId = function (id, trackArray) {
			var trackArrayLength = trackArray.length,
			    i;
			for (i = 0; i < trackArrayLength; i++) {
				if (trackArray[i].id === id) {
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
			var availableStreams = this._player.availableStreams,
				streamsLength = availableStreams ? availableStreams.length : 0,
			    i,
			    stream,
			    player = this._player;

			log("_sortTracksInStream", "found " + String(streamsLength) + " streams", Log.LOG_DEBUG);

			this._clearInternalCache();

			if (typeof availableStreams === "string") {
				// availableStreams returned an error string rather than an array
				log("_sortTracksInStream", availableStreams, Log.LOG_ERROR);
				return;
			}

			for (i = 0; i < streamsLength; i++) {
				stream = availableStreams[i];
				if (stream) {
					switch (stream.type) {
					case player.STREAM_TYPE_AUDIO:
						stream.language = stream.iaudio.language;
						this._audioTracks.push(stream);
						log("_sortTracksInStream", "Added audio track: " + stream.id);
						break;
					case player.STREAM_TYPE_VIDEO:
						this._videoTracks.push(stream);
						log("_sortTracksInStream", "Added video track: " + stream.id);
						break;
					case player.STREAM_TYPE_SUBTITLE:
						//remove once OTV5 supports teletext
						if (stream.format !== player.STREAM_FORMAT_SUBTITLE_DVB_TLTXT_SUBTITLE) {
							stream.language = this.getLanguage(stream);
							this._subtitleTracks.push(stream);
							log("_sortTracksInStream", "Added subtitle track: " + stream.id);
						}
						break;
					default:
						this._otherTracks.push(stream);
						log("_sortTracksInStream", "Added other track: " + stream.id);
						break;
					}
				}
			}
		};

		// Public API

		/**
		 * This method is obsolete in CCOM 2.0
		 * @method getStream
		 * @return {Object} The active video stream object.
		 */
		proto.getStream = function () {
			return null;
		};

		/**
		 * Clears and re-loads the active streams from the player stored within this object.
		 *
		 * @method setStream
		 */
		proto.setStream = function () {
			this._sortTracksInStream();
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
			return this._videoTracks;
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
			return this.getOtherTracks();
		};

		/**
		 * Returns all the 'other' tracks (streams) (i.e. those not considered to be of any
		 * other recognised type) stored within this object.
		 *
		 * @method getOtherTracks
		 * @return {Array} array of 'other' tracks, which may be empty if there is none.
		 */
		proto.getOtherTracks = function () {
			return this._otherTracks;
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
			var activeIndex = this._getIndexOfActiveTrack(this._videoTracks);
			return activeIndex === null ? null : this._videoTracks[activeIndex];
		};

		/**
		 * Returns the currently active data track for the stream, useful for when you want to inform
		 * the user. If there is no data track active active, then null is returned.
		 *
		 * @method getActiveDataTrack
		 * @return {Object} the data track that is active, or null if there is none.
		 */
		proto.getActiveDataTrack = function () {
			return this.getActiveOtherTrack();
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
			var activeIndex = this._getIndexOfActiveTrack(this._otherTracks);
			return activeIndex === null ? null : this._otherTracks[activeIndex];
		};


		/**
		 * Get the list of all stored dual-mono audio tracks (channels; streams).
		 *
		 * @method getDualMonoAudioTracks
		 * @return {Array} an array of audio tracks that have a dual-mono channel, which may be empty.
		 */
		proto.getDualMonoAudioTracks = function () {
			var dualMonoTracks = [],
			    audioTracks = this.getAudioTracks(),
				numberOfAudioTracks = audioTracks.length,
				i;

			for (i = 0; i < numberOfAudioTracks; i++) {
				if (audioTracks[i].iaudio.dualMono === true) {
					dualMonoTracks.push(audioTracks[i]);
				}
			}
			return dualMonoTracks;
		};

		/**
		 * Get the dual-mono channel mode for an audio track.
		 *
		 * @method getDualMonoChannelMode
		 * @param audioTrack {Object} the track whose dual mono channel mode is queried
		 * @return {Number} one of `AudioPID.AUDIOPID_DUAL_MONO_MIX_MODE_NA`,
		 *         `AudioPID.AUDIOPID_DUAL_MONO_MIX_MODE_LEFT_ONLY`,
		 *         `AudioPID.AUDIOPID_DUAL_MONO_MIX_MODE_RIGHT_ONLY` or
		 *         `AudioPID.AUDIOPID_DUAL_MONO_MIX_MODE_BOTH`, or -1 if there's no default audio track
		 *         or if the track is not an audio track
		 */
		proto.getDualMonoChannelMode = function (audioTrack) {
			// TODO : CCOM2.0
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
			// TODO : CCOM2.0
		};

		/**
		 * Activates the given track. It is expected that the track is known prior to calling this
		 * function by calling one of the `getTracks` methods.
		 *
		 * @method activateTrack
		 * @param {Object} track
		 */
		proto.activateTrack = function (track) {
			if (track) {
				this._player.startStreams([{
					"specType": this._player.STREAM_SPEC_TYPE_JUST_ID,
					"id": track.id
				}]);
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
			if (track) {
				this._player.stopStreams([{
					"stopStreamTypes": track.type
				}]);
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
		 * This method will check if there is an audio track available for the given trackId, and
		 * if so, activate it.
		 *
		 * @method activateAudioTrackById
		 * @param {Number} trackId
		 * @return {Boolean} true if activated, false if not found
		 */
		proto.activateAudioTrackById = function (trackId) {
			return this._activateTrackForId(trackId, this._audioTracks);
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
			var language;
			if (track) {
				if (track.iaudio && track.iaudio.language) {
					language = track.iaudio.language;
				} else if (track.idvbTltxtSubtitle && track.idvbTltxtSubtitle.language) {
					language = track.idvbTltxtSubtitle.language;
				} else if (track.idvbSubtitle && track.idvbSubtitle.language) {
					language = track.idvbSubtitle.language;
				} else if (track.iaribCc && track.iaribCc.language) {
					language = track.iaribCc.language;
				} else if (track.idvbTltxtTeletext && track.idvbTltxtTeletext.language) {
					language = track.idvbTltxtTeletext.language;
				}
			}
			return language;
		};

		/**
		 * Determines whether the given track is active.
		 *
		 * @method isActive
		 * @param track {Object}
		 * @return {Boolean} true if the track is active, false if not or if the player or given track is null.
		 */
		proto.isActive = function (track) {
			var i;
			var len = this._player.activeStreams.length;
			for (i = 0; i < len; i++) {
				if (track.id === this._player.activeStreams[i].id) {
					return true;
				}
			}
			return false;
		};

		/**
		 * Sets the callback to execute when an active subtitle track is lost
		 * to allow the UI to be updated
		 * @method setActiveSubtitleTrackLostCallback
		 * @param {Function} callback can be set to null to disable / remove
		 */
		proto.setActiveSubtitleTrackLostCallback = function (callback) {
			this._activeSubtitleTrackLostCallback = callback;
		};

		/**
		 * Sets the callback to execute when an active audio track is lost
		 * to allow the UI to be updated
		 * @method setActiveAudioTrackLostCallback
		 * @param {Function} callback can be set to null to disable / remove
		 */
		proto.setActiveAudioTrackLostCallback = function (callback) {
			this._activeAudioTrackLostCallback = callback;
		};

		/**
		 * Sets the callback to execute when an new subtitle track is found
		 * to allow the UI to be updated / subtitles enabled for a
		 * preferred language etc.
		 * @method setNewSubtitleTrackFoundCallback
		 * @param {Function} callback can be set to null to disable / remove
		 */
		proto.setNewSubtitleTrackFoundCallback = function (callback) {
			this._newSubtitleTrackFoundCallback = callback;
		};

		/**
		 * Sets the callback to execute when an new audio track is found
		 * to allow the UI to be updated / subtitles enabled for a
		 * preferred language etc.
		 * @method setNewAudioTrackFoundCallback
		 * @param {Function} callback can be set to null to disable / remove
		 */
		proto.setNewAudioTrackFoundCallback = function (callback) {
			this._newAudioTrackFoundCallback = callback;
		};

		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};
		$N.platform.output.Tracks = Tracks;
		return Tracks;
	}
);