/*global CCOM*/
/**
 * Helper class for Music categories data
 *
 * @class $N.app.MusicCategoriesData
 * @author brwang
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	/*
	 * MUSIC-0090   The list of music categories shall be retrieved dynamically.
	 * MUSIC-0120   The list of music sub-categories shall be retrieved dynamically.
	 * The music catalog is broadcast in an OpenTV carousel, I guess on the radio channel.
	 * The middleware provides API to download Ocode carousels.
	 */
	$N.app.MusicCategoriesData = (function () {
		var log = new $N.apps.core.Log("MusicCategoriesData", "MusicCategoriesData"),
			//stubs data for running test/debug on chrome
			musicSubCategoriesData = [
				["Aerosmith & Whitesnake", "Anos 60", "Anos 70", "Anos 80", "Anos 90", "Axé", "Baladas", "Blues", "Bossa Nova", "CBN SP", "Clássica", "Disco", "Easy Listening", "Eletrônica", "Festa", "Forró", "Globo FM", "Hip Hop", "Jazz Clássico", "Jazz Contemporâneo", "Kids", "Latino", "Lounge", "MPB", "New Rock", "Pagode", "RFI", "Reggae", "Rhythm & Blues", "Rock Clássico", "Rádio Gaúcha", "Rádio Globo RJ", "Rádio Globo SP", "Samba de Raiz", "Sertanejo", "Standards", "Trilhas Sonoras"], //todos
				["MPB", "Bossa Nova", "Pagode", "Samba de Raiz", "Axé", "Sertanejo", "Forró"], //Brasileiras
				["New Rock", "Rock Clássico" ], //Rock
				["Aerosmith & Whitesnake", "Baladas", "Disco", "Festa", "Eletrônica"], //Pop & Dance
				["Blues", "Rhythm & Blues", "Jazz Clássico", "Jazz Contemporâneo"], //Jazz & R'n'B
				["Clássica", "Easy Listening"], //Instrumental
				["Hip Hop", "Latino"], //Mundo
				["Kids", "Anos 60", "Anos 70", "Anos 80", "Anos 90", "Reggae", "Lounge", "Standards", "Trilhas Sonoras"], //Outros
				["Rádio Globo RJ", "Globo FM", "CBN SP", "Rádio Globo SP", "Rádio Gaúcha", "RFI"] //Radios
			],
			allRadioChannels = [],
			isFullGenre = true; //Indicate if there are one or more channels in every genre

		/**
		 * @method sortChannelsCallbackByCompareName
		 * @param a {Object} first channel
		 * @param b {Object} second channel
		 * @return {Number} Difference
		 * @private
		 */
		function sortChannelsCallbackByCompareName(a, b) {
			if (a.name > b.name) {
				return 1;
			}
			if (a.name < b.name) {
				return -1;
			}
			return 0;
		}

		/**
		 * @method sortChannelsCallbackByCompareServiceName
		 * @param a {Object} first channel
		 * @param b {Object} second channel
		 * @return {Number} Difference
		 * @private
		 */
		function sortChannelsCallbackByCompareServiceName(a, b) {
			if (a.serviceName > b.serviceName) {
				return 1;
			}
			if (a.serviceName < b.serviceName) {
				return -1;
			}
			return 0;
		}

		/**
		 * @method refreshRadioChannels
		 * @private
		 */
		function refreshRadioChannels() {
			var i = 0, j = 0,
				genre = {},
				ret = null,
				rs = null;

			genre.contentNibbleLevel1 = 0;
			genre.userByte = 0;
			allRadioChannels = [];
			allRadioChannels[0] = [];
			isFullGenre = true;

			for (i = 1; i <= 8; i += 1) {
				genre.contentNibbleLevel2 = i;
				if (CCOM.EPG.getServicesRSByGenre) {
					ret = CCOM.EPG.getServicesRSByGenre("serviceId, name, uri", genre, "type=2", "serviceId");
				} else {
					log("refreshRadioChannels", "CCOM.EPG.getServicesRSByGenre - undefined.");
					return;
				}
				if (ret.error) {
					log("refreshRadioChannels", "CCOM.EPG.getServicesRSByGenre - failed." + i);
					return;
				} else {
					rs = ret.getNext(100);
					allRadioChannels[i] = [];
					for (j = 0; j < rs.length; j += 1) {
						allRadioChannels[i].push(rs[j]);
					}
					allRadioChannels[i].sort(sortChannelsCallbackByCompareName);
					if (rs.length === 0) {
						isFullGenre = false;
					}
				}
			}
			allRadioChannels[0] = $N.platform.btv.EPG.getRadioChannels();
			allRadioChannels[0].sort(sortChannelsCallbackByCompareServiceName);
			musicSubCategoriesData = allRadioChannels;
		}

		return {
			/**
			 * @method initialise
			 */
			initialise: function () {
				$N.apps.core.Language.adornWithGetString($N.app.MusicCategoriesData);
				refreshRadioChannels();
			},

			/**
			 * Method that is for portal view table when music is highlighted.
			 * @method getGenreData
			 * @return {Array}
			 */
			getMusicPortalData1: function () {   //jrm
			    debugger;
			    var musicGenreData = this.getGenreData();
			    var xmlhttp = new XMLHttpRequest();
			    xmlhttp.open("GET", 'NewContent.json', false);
			    xmlhttp.send();
			    var temp = JSON.parse(xmlhttp.responseText);
			    for (var item = 0; item < temp.items.length; item += 1) {
			        temp.items[item].data = musicGenreData[item];
			    }
			    return temp;
			},
			getMusicPortalData : function () {
				var i = 0,
					genre = 0,
					musicGenreData = this.getGenreData(),
					genreLength = musicGenreData.length,
					ret = {
						"gridSize": {
							"width" : 3,
							"height" : 3
						},
						"items": [
							{
								"x": 0,
								"y": 0,
								"width": 1,
								"height": 1,
								"data": musicGenreData[0]
							},
							{
								"x": 0,
								"y": 1,
								"width": 1,
								"height": 1,
								"data": musicGenreData[1]
							},
							{
								"x": 0,
								"y": 2,
								"width": 1,
								"height": 1,
								"data": musicGenreData[6]
							},
							{
								"x": 1,
								"y": 0,
								"width": 1,
								"height": 1,
								"data": musicGenreData[3]
							},
							{
								"x": 1,
								"y": 1,
								"width": 1,
								"height": 1,
								"data": musicGenreData[5]
							},
							{
								"x": 1,
								"y": 2,
								"width": 1,
								"height": 1,
								"data": musicGenreData[2]
							},
							{
								"x": 2,
								"y": 0,
								"width": 1,
								"height": 1,
								"data": musicGenreData[7]
							},
							{
								"x": 2,
								"y": 1,
								"width": 1,
								"height": 1,
								"data": musicGenreData[4]
							},
							{
								"x": 2,
								"y": 2,
								"width": 1,
								"height": 1,
								"data": musicGenreData[8]
							}
						]
					};

				if (!isFullGenre) {
					for (genre = 0; genre < genreLength; genre += 1) {
						if (musicSubCategoriesData[genre] && musicSubCategoriesData[genre].length > 0) {
							ret.items[i].data = musicGenreData[genre];
							i += 1;
						}
					}
					if (i < genreLength) {
						ret.items.splice(i);
					}
				}
				return ret;
			},

			/**
			 * Method that is for music application to get the actual genre data which is deduction group without empty genre data)
			 * @method getActualGenreData
			 * @return {Array}
			 */
			getActualGenreData : function () {
				var genre = 0,
					musicGenreData = this.getGenreData(),
					genreLength = musicGenreData.length,
					ret = [];

				for (genre = 0; genre < genreLength; genre += 1) {
					if (musicSubCategoriesData[genre] && musicSubCategoriesData[genre].length > 0) {
						ret.push(musicGenreData[genre]);
					}
				}
				return ret;
			},

			/**
			 * Method that is for music application to get the genre data
			 * @method getGenreData
			 * @return {Array}
			 */
			getGenreData : function () {
				return [
					{
						"hrefBg": "../../../customise/resources/images/net/musicIcons/todos_merged.png",
						"href": "../../../customise/resources/images/net/musicIcons/musica_gd_white_01.png",
						"text": $N.app.MusicCategoriesData.getString("musicCategoryAll"),
						"id": "musicCategoryAll",
						"clickhandler": clicked
					}, {
						"hrefBg": "../../../customise/resources/images/net/musicIcons/brazil_merged.png",
						"href": "../../../customise/resources/images/net/musicIcons/musica_gd_white_02.png",
						"text": $N.app.MusicCategoriesData.getString("musicCategoryBrasilian"),
						"id" : "musicCategoryBrasilian"
					}, {
						"hrefBg": "../../../customise/resources/images/net/musicIcons/rock_merged.png",
						"href": "../../../customise/resources/images/net/musicIcons/musica_gd_white_03.png",
						"text": $N.app.MusicCategoriesData.getString("musicCategoryRock"),
						"id" : "musicCategoryRock"
					}, {
						"hrefBg": "../../../customise/resources/images/net/musicIcons/pop_merged.png",
						"href": "../../../customise/resources/images/net/musicIcons/musica_gd_white_04.png",
						"text": $N.app.MusicCategoriesData.getString("musicCategoryPopDance"),
						"id" : "musicCategoryPopDance"
					}, {
						"hrefBg": "../../../customise/resources/images/net/musicIcons/jazz_merged.png",
						"href": "../../../customise/resources/images/net/musicIcons/musica_gd_white_05.png",
						"text": $N.app.MusicCategoriesData.getString("musicCategoryJazzRnB"),
						"id" : "musicCategoryJazzRnB"
					}, {
						"hrefBg": "../../../customise/resources/images/net/musicIcons/instrumental_merged.png",
						"href": "../../../customise/resources/images/net/musicIcons/musica_gd_white_06.png",
						"text": $N.app.MusicCategoriesData.getString("musicCategoryInstrumental"),
						"id" : "musicCategoryInstrumental"
					}, {
						"hrefBg": "../../../customise/resources/images/net/musicIcons/mundo_merged.png",
						"href": "../../../customise/resources/images/net/musicIcons/musica_gd_white_07.png",
						"text": $N.app.MusicCategoriesData.getString("musicCategoryWorldMusic"),
						"id" : "musicCategoryWorldMusic"
					}, {
						"hrefBg": "../../../customise/resources/images/net/musicIcons/outros_merged.png",
						"href": "../../../customise/resources/images/net/musicIcons/musica_gd_white_08.png",
						"text": $N.app.MusicCategoriesData.getString("musicCategoryOthers"),
						"id" : "musicCategoryOthers"
					}, {
						"hrefBg": "../../../customise/resources/images/net/musicIcons/radio_merged.png",
						"href": "../../../customise/resources/images/net/musicIcons/musica_gd_white_09.png",
						"text": $N.app.MusicCategoriesData.getString("musicCategoryRadio"),
						"id" : "musicCategoryRadio"
					}];
			},

			/**
			 * Method that is for music application to supply the sub categories data for each genre
			 * @method getSubCategoriesData
			 * @param {Number} genreId
			 * @return {Array}
			 */
			getSubCategoriesData : function (genreId) {
				if (genreId < musicSubCategoriesData.length) {
					return musicSubCategoriesData[genreId];
				}
				return [];
			},

			/**
			 * Method that is for getting genre index by genreMenuId
			 * @method getSubCategoriesData
			 * @param {Number} genreMenuId
			 * @return {Number} genre id
			 */
			checkGenreIndex : function (genreMenuId) {
				var i = 0,
					musicGenreData = this.getGenreData();
				for (i = 0; i < musicGenreData.length; i += 1) {
					if (genreMenuId === musicGenreData[i].id) {
						break;
					}
				}
				return i;
			},

			refreshRadioChannels: refreshRadioChannels
		};
	}());

}($N || {}));


function clicked() {        //jrm

    //var url = 'http://www.quackit.com/html/html_help.cfm';
    //    popupWindow = window.open(
    //        url, 'popUpWindow', 'height=700,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes')
   
}