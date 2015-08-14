/*global CCOM*/
/**
 * This class manages Video genre data: it retrieves and caches video channels by specific genre index.
 *
 * @class $N.app.GenreUtil
 * @constructor
 *
 * @requires $N.apps.core.Log
 * @requires $N.platform.btv
 *
 * @author brwang
 */
var $N = $N || {};

var GenreUtil = function () {
	var log = new $N.apps.core.Log("Helper", "GenreUtil"),
		my = {},
		genreData = [
			{
				title: "genreFavorite",
				channelList: []
			}, {
				id: 253,
				title: "genreHD",
				channelList: []
			}, {
				id: 2,
				title: "genreMovies",
				channelList: []
			}, {
				id: 3,
				title: "genreSeries",
				channelList: []
			}, {
				id: 4,
				title: "genreSports",
				channelList: []
			}, {
				id: 5,
				title: "genreInformation",
				channelList: []
			}, {
				id: 8,
				title: "genreOthers",
				channelList: []
			}, {
				id: 10,
				title: "genreEthnic",
				channelList: []
			}, {
				id: 6,
				title: "genreKids",
				channelList: []
			}, {
				id: 11,
				title: "genrePPV",
				channelList: []
			}, {
				id: 9,
				title: "genreAdult",
				channelList: []
			}, {
				id: 1,
				title: "genreOpen",
				channelList: []
			}],
		genreLength = genreData.length,
		convertNumberToHexString = $N.app.GeneralUtil.convertNumberToHexString,
		convertHexStringToNumber = $N.app.GeneralUtil.convertHexStringToNumber;

	$N.apps.core.Language.adornWithGetString(GenreUtil);

	/**
	 * clear all the genre channel lists
	 * @method clearChannels
	 */
	function clearChannels() {
		var i;
		for (i = 0; i < genreLength; i += 1) {
			genreData[i].channelList = [];
		}
	}

	/**
	 * To refresh all genre channel list
	 * @method refreshChannelList
	 * @return {Array} a array of genre groups specified event
	 */
	function refreshChannelList() {
		var ii,
			i,
			genreList = [],
			completeGenre = 0,
			allChannelList = $N.platform.btv.EPG.getVideoChannelsOrderedByChannelNumber() || [];

		log("refreshChannelList", "enter");
		clearChannels();
		for (ii = 0; ii < allChannelList.length; ii += 1) {
			genreList = CCOM.EPG.getGenresByServiceId(allChannelList[ii].serviceId);
			if (genreList.length > 0) {
				completeGenre = $N.app.GeneralUtil.bitShiftLeft(genreList[0].contentNibbleLevel1, 4) + genreList[0].contentNibbleLevel2;
				for (i = 0; i < genreLength; i += 1) {
					if (completeGenre === genreData[i].id) {
						genreData[i].channelList.push(allChannelList[ii]);
						break;
					}
				}
			}
		}
		log("refreshChannelList", "exit");
	}

	/**
	 * @method getGenresByData
	 * @param {Object Array} genre data
	 * @return {String} comma separated genres
	 */
	function getGenresByData(genres) {
		var genre,
			genresLength = 0,
			genresSeparator = "",
			genresString = "",
			i,
			langGenres,
			genresGroup,
			objType = Object.prototype.toString;
		genresLength = genres ? genres.length : 0;
		langGenres = GenreUtil.getString("mapGenres") || {};
		for (i = 0; i < genresLength; i++) {
			genresGroup = langGenres[genres[i].contentNibbleLevel1];
			if (objType.call(genresGroup) === '[object Object]') {
				genre = genresGroup[genres[i].contentNibbleLevel2];
				if (objType.call(genre) === '[object String]') {
					genresString += genresSeparator + genre;
					genresSeparator = ", ";
				}
			}
		}
		return genresString;
	}
	/**
	 * Takes then Genre Object as expected by the synopsis and prepares a string (e.g. '03:05:00')
	 * @method getGenreStringFromGenreObject
	 * @param {Object Array} genreObjectArray data
	 * @return {String} Comma and colon separated genres as nibble string (for database)
	 */
	function getGenreStringFromGenreObject(genreObjectArray) {
		var genreObjectArrayLength = (genreObjectArray) ? genreObjectArray.length : 0,
			genre,
			i,
			genreStrings = [],
			retval;

		for (i = 0; i < genreObjectArrayLength; i++) {
			genre = genreObjectArray[i];
			genreStrings.push([
				convertNumberToHexString(genre.contentNibbleLevel1, 2),
				convertNumberToHexString(genre.contentNibbleLevel2, 2),
				convertNumberToHexString(genre.userbyte, 2)
			].join(':'));
		}
		return genreStrings.join(',');
	}

	/**
	 * Takes the genres string (e.g. '03:05:00') and prepares the Genre Object as expected by the synopsis
	 * @method getGenreObjectFromGenreString
	 * @param {Object} genres - Comma seperated string or array of genre strings
	 * @return {Array} genreArray - array of genres for the synopsis
	 */
	function getGenreObjectFromGenreString(genres) {
		var genreArray,
			genreArrayLength,
			genre,
			i,
			genreObjectArray = [];

		if (genres && typeof genres === 'string') {
			genreArray = genres.split(',');
		} else {
			genreArray = genres || [];
		}
		genreArrayLength = genreArray.length;

		for (i = 0; i < genreArrayLength; i++) {
			genre = genreArray[i].split(":");
			if (genre && genre.length >= 3) {
				genreObjectArray.push({
					contentNibbleLevel1: convertHexStringToNumber(genre[0]),
					contentNibbleLevel2: convertHexStringToNumber(genre[1]),
					userbyte: convertHexStringToNumber(genre[2])
				});
			}
		}
		return genreObjectArray;
	}

	$N.platform.btv.EPG.registerRefreshCallback(refreshChannelList, this);
	refreshChannelList();

	return {
		/*
		 * As there are options of favorite and all-channels in filter behavior
		 */
		GENRE_ALLCHANNELS: genreLength,
		GENRE_FAVORITE: 0,
		GENRE_PPV: 9,
		GENRE_ADULT: 10,

		/**
		 * Returns an array of all services on specific genre basis
		 * @method getAllChannelsByGenre
		 * @param {Number} genreIndex
		 * @return {Array} An array of service objects
		 */
		getAllChannelsByGenre : function (genreIndex) {
			if (genreIndex === 0) {
				return $N.platform.btv.Favourites.getFavouriteChannels($N.app.constants.FAVOURITE_FOLDER_NAME);
			} else if (genreIndex > 0 && genreIndex < genreLength) {
				return genreData[genreIndex].channelList;
			} else if (genreIndex === this.GENRE_ALLCHANNELS) {
				return $N.platform.btv.EPG.getVideoChannelsOrderedByChannelNumber();
			}
			return [];
		},

		/**
		 * Returns an array of all services on specific genre basis
		 * @method getGenreChannels
		 * @param {Number} genreIndex
		 * @return {String} genre title
		 */
		getGenreTitle : function (genreIndex) {
			if (genreIndex >= 0 && genreIndex < genreLength) {
				return GenreUtil.getString(genreData[genreIndex].title);
			}
			return "";
		},

		/**
		 * Returns the amount of genres
		 * @method getAmountOfGenres
		 * @return {Number} amount of genres
		 */
		getAmountOfGenres : function () {
			//Included all-channels only as favourites moved into the genreData array.
			return genreLength + 1;
		},

		/**
		 * Method to know if one channel is adult channel
		 * @method isAdultChannel
		 * @param {Object} service
		 * @return {Boolean} true if is adult channel, otherwise false
		 */
		isAdultChannel : function (service) {
			log("isAdultChannel", "enter");
			var i,
				isAdult = false,
				adultChannelList = null,
				adultChannelCount = 0,
				adultIndex = 10;
			if (service) {
				adultChannelList = this.getAllChannelsByGenre(adultIndex);
				adultChannelCount = adultChannelList.length;
				if (adultChannelCount) {
					for (i = 0; i < adultChannelCount; i += 1) {
						if (service.serviceId === adultChannelList[i].serviceId) {
							log("isAdultChannel ", service.serviceId);
							isAdult = true;
							break;
						}
					}
				}
			}
			return isAdult;
		},

		/**
		 * @method getGenresByEvent
		 * @param {Object} event an EPGEvent object
		 * @return {String} comma separated genres
		 */
		getGenresByEvent : function (event) {
			var genres = [],
				genresString = "";
			if (event.eventId) {
				genres = event.genres || getGenreObjectFromGenreString(event.netEventGenres) || CCOM.EPG.getGenresByEventId(event.eventId);
				if (!genres.error) {
					genresString = getGenresByData(genres);
				}
			}
			return genresString;
		},
		getGenresByData: getGenresByData,
		getGenreStringFromGenreObject : getGenreStringFromGenreObject,
		getGenreObjectFromGenreString : getGenreObjectFromGenreString
	};
};
