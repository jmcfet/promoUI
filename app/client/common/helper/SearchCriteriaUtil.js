/**
 * Helper class for Search Criteria
 *
 * @class $N.app.SearchCriteriaUtil
 * @author rhill
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.SearchCriteriaUtil = (function () {
		var log = new $N.apps.core.Log("Helper", "SearchCriteriaUtil");

		/**
		 * get diacritical Keyword
		 * @method getDiacriticisedKeyword
		 * @param {String} keyword  the keyword as a string.
		 * @return {String} the diacritical Keyword
		 */
		function getDiacriticisedKeyword(keyword) {
			var i,
				diacriticisedKeywordtmp = [],
				lowerKeyword,
				upperKeyword,
				tmp,
				termName = "",
				diacritic_terms;
			lowerKeyword = keyword.toLowerCase();
			upperKeyword = keyword.toUpperCase();
			termName = $N.platform.system.Preferences.get($N.app.constants.PREF_LANGUAGE) + $N.app.constants.DIACRITICTERMSSUFFIX;
			diacritic_terms = $N.app.constants[termName];
			for (i = 0; i < keyword.length; i++) {
				if (diacritic_terms && diacritic_terms[lowerKeyword[i]]) {
					diacriticisedKeywordtmp.push(diacritic_terms[lowerKeyword[i]]);
				} else {
					tmp = "[" + lowerKeyword[i] + upperKeyword[i] + "]";
					diacriticisedKeywordtmp.push(tmp);
				}
			}
			return diacriticisedKeywordtmp.join('');
		}

		/**
		 * get local recordings search criteria by title
		 * @method getLocalPlayableRecordingsByTitleCriteria
		 * @param {String} keyword  the search keyword as a string.
		 * @param {Boolean} exactMatch  if search is exact search
		 * @return {String} the search criteria.
		 */
		function getLocalPlayableRecordingsByTitleCriteria(keyword, exactMatch, isQueryAdultEvent) {
			var criteria = "",
				mediumId = $N.app.PVRCapability.getCurrentMediaId() || -1,
				diacriticisedKeyWord = getDiacriticisedKeyword(keyword);
			if (exactMatch) {
				criteria += "title GLOB '" + diacriticisedKeyWord + "'";
			} else {
				criteria += "(title GLOB '" + diacriticisedKeyWord + "*' OR title GLOB'* " + diacriticisedKeyWord + "*')";
			}
			if (!isQueryAdultEvent) {
				criteria += " AND parentalRating<18";
			}
			criteria += " AND taskType='REC' AND objectState<6 AND objectState>0 AND objectState!=2 AND inactive=0 AND isAuthorized = 1 AND mediumID = '" + mediumId + "'";
			log("getNonExpiredEventsByTitleCriteria", "criteria: " + criteria);
			return criteria;
		}

		/**
		 * get local recordings search criteria by keyword
		 * @method getLocalPlayableRecordingsByKeywordCriteria
		 * @param {String} keyword  the search keyword as a string.
		 * @param {Boolean} exactMatch  if search is exact search
		 * @return {String} the search criteria.
		 */
		function getLocalPlayableRecordingsByKeywordCriteria(keyword, exactMatch, isQueryAdultEvent) {
			var criteria = "",
				mediumId = $N.app.PVRCapability.getCurrentMediaId() || -1,
				diacriticisedKeyWord = getDiacriticisedKeyword(keyword);
			if (exactMatch) {
				criteria += "(shortDesc GLOB '" + diacriticisedKeyWord + "' OR longDesc GLOB '" + diacriticisedKeyWord + "' OR title GLOB '" + diacriticisedKeyWord + "' OR netActorCast GLOB '" +
								diacriticisedKeyWord + "' OR netDirector GLOB '" + diacriticisedKeyWord + "')";
			} else {
				criteria += "(shortDesc GLOB '" + diacriticisedKeyWord + "*' OR shortDesc GLOB'* " + diacriticisedKeyWord
					+ "*' OR longDesc GLOB '" + diacriticisedKeyWord + "*' OR longDesc GLOB'* " + diacriticisedKeyWord
					+ "*' OR title GLOB '" + diacriticisedKeyWord + "*' OR title GLOB'* " + diacriticisedKeyWord
					+ "*' OR netActorCast GLOB '" + diacriticisedKeyWord + "*' OR netActorCast GLOB'* " + diacriticisedKeyWord
					+ "*' OR netDirector GLOB '" + diacriticisedKeyWord + "*' OR netDirector GLOB'* " + diacriticisedKeyWord + "*')";
			}
			if (!isQueryAdultEvent) {
				criteria += " AND parentalRating<18";
			}
			criteria += " AND taskType='REC' AND objectState<6 AND objectState>0 AND objectState!=2 AND inactive=0 AND isAuthorized = 1 AND mediumID = '" + mediumId + "'";
			log("getLocalPlayableRecordingsByKeywordCriteria", "criteria: " + criteria);
			return criteria;
		}
		/**
		 * get local recordings search criteria by actor/director
		 * @method getLocalPlayableRecordingsByActorsDirectorCriteria
		 * @param {String} keyword  the search keyword as a string.
		 * @param {Boolean} exactMatch  if search is exact search
		 * @return {String} the search criteria.
		 */
		function getLocalPlayableRecordingsByActorsDirectorCriteria(keyword, exactMatch, isQueryAdultEvent) {
			var criteria = "",
				mediumId = $N.app.PVRCapability.getCurrentMediaId() || -1,
				diacriticisedKeyWord = getDiacriticisedKeyword(keyword);
			if (exactMatch) {
				criteria += "(netActorCast GLOB '" + diacriticisedKeyWord + "' OR netDirector GLOB '" + diacriticisedKeyWord + "')";
			} else {
				criteria += "(netActorCast GLOB '" + diacriticisedKeyWord + "*' OR netActorCast GLOB'* " + diacriticisedKeyWord
					+ "*' OR netDirector GLOB '" + diacriticisedKeyWord + "*' OR netDirector GLOB'* " + diacriticisedKeyWord + "*')";
			}
			if (!isQueryAdultEvent) {
				criteria += " AND parentalRating<18";
			}
			criteria += " AND taskType='REC' AND objectState<6 AND objectState>0 AND objectState!=2 AND inactive=0 AND isAuthorized = 1 AND mediumID = '" + mediumId + "'";
			log("getLocalPlayableRecordingsByActorsDirectorCriteria", "criteria: " + criteria);
			return criteria;
		}
		/**
		 * get event search criteria by title
		 * @method getNonExpiredEventsByTitleCriteria
		 * @param {String} keyword  the search keyword as a string.
		 * @param {Boolean} exactMatch  if search is exact search
		 * @return {String} the search criteria.
		 */
		function getNonExpiredEventsByTitleCriteria(keyword, exactMatch, isQueryAdultEvent) {
			var criteria = "",
				language,
				diacriticisedKeyWord = getDiacriticisedKeyword(keyword);
			if (exactMatch) {
				criteria += "title GLOB '" + diacriticisedKeyWord + "'";
			} else {
				criteria += "(title GLOB '" + diacriticisedKeyWord + "*' OR title GLOB'* " + diacriticisedKeyWord + "*')";
			}
			criteria += " AND ";
			criteria += "endTime > " + String(new Date().getTime());
			if (!isQueryAdultEvent) {
				criteria += " AND parentalRating < 18";
			}
			log("getNonExpiredEventsByTitleCriteria", "criteria: " + criteria);
			return criteria;
		}

		/**
		 * get event search criteria by keyword
		 * @method getNonExpiredEventsByKeywordCriteria
		 * @param {String} keyword  the search keyword as a string.
		 * @param {Boolean} exactMatch  if search is exact search
		 * @return {String} the search criteria.
		 */
		function getNonExpiredEventsByKeywordCriteria(keyword, exactMatch, isQueryAdultEvent) {
			var criteria = "",
				language,
				diacriticisedKeyWord = getDiacriticisedKeyword(keyword);
			language = $N.platform.system.Preferences.get($N.app.constants.PREF_LANGUAGE);
			if (exactMatch) {
				criteria += "(shortDesc GLOB '" + diacriticisedKeyWord + "' OR longDesc GLOB '" + diacriticisedKeyWord + "')";
			} else {
				criteria += "(shortDesc GLOB '" + diacriticisedKeyWord + "*' OR shortDesc GLOB'* " + diacriticisedKeyWord
					+ "*' OR longDesc GLOB '" + diacriticisedKeyWord + "*' OR longDesc GLOB'* " + diacriticisedKeyWord + "*')";
			}
			criteria += " AND ";
			criteria += "endTime > " + String(new Date().getTime());
			if (!isQueryAdultEvent) {
				criteria += " AND parentalRating < 18";
			}
			log("getNonExpiredEventsByKeywordCriteria", "criteria: " + criteria);
			return criteria;
		}

		/**
		 * get event search criteria by actor/director
		 * @method getNonExpiredEventsByActorsDirectorCriteria
		 * @param {String} keyword  the search keyword as a string.
		 * @param {Boolean} exactMatch  if search is exact search
		 * @return {String} the search criteria.
		 */
		function getNonExpiredEventsByActorsDirectorCriteria(keyword, exactMatch, isQueryAdultEvent) {
			var criteria = "",
				diacriticisedKeyWord = getDiacriticisedKeyword(keyword.toLowerCase());
			criteria = "(extInfoKey='Actors' OR extInfoKey='Director') AND " + "endTime > " + String(new Date().getTime());
			if (!isQueryAdultEvent) {
				criteria += " AND parentalRating < 18";
			}
			if (exactMatch) {
				criteria += " AND extInfoValue GLOB '" + diacriticisedKeyWord + "'";
			} else {
				criteria += " AND (extInfoValue GLOB '" + diacriticisedKeyWord + "*' OR extInfoValue GLOB '* " + diacriticisedKeyWord + "*')";
			}
			log("getEPGEventCriteria", "criteria: " + criteria);
			return criteria;
		}

		// Public
		return {
			getDiacriticisedKeyword: getDiacriticisedKeyword,
			getNonExpiredEventsByTitleCriteria: getNonExpiredEventsByTitleCriteria,
			getNonExpiredEventsByActorsDirectorCriteria: getNonExpiredEventsByActorsDirectorCriteria,
			getNonExpiredEventsByKeywordCriteria: getNonExpiredEventsByKeywordCriteria,
			getLocalPlayableRecordingsByTitleCriteria: getLocalPlayableRecordingsByTitleCriteria,
			getLocalPlayableRecordingsByKeywordCriteria: getLocalPlayableRecordingsByKeywordCriteria,
			getLocalPlayableRecordingsByActorsDirectorCriteria: getLocalPlayableRecordingsByActorsDirectorCriteria
		};
	}());

}($N || {}));
