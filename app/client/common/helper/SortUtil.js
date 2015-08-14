/**
 * @class $N.app.SortUtil
 * @static
 * @requires $N.app.StringUtil
 * @requires $N.app.FolderUtil
 * @requires $N.platform.btv.EPG
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.SortUtil = (function ($N) {

		var EQUAL = 0,
			GREATER_THAN = 1,
			LESS_THAN = -1;

		/**
		 * basicCompareFunction for use with sortAndRemoveDuplicates
		 * @method basicCompareFunction
		 * @private
		 * @param {Object} firstElement First Array element to compare
		 * @param {Object} secondElement Second Array element to compare
		 * return {Number} EQUAL or GREATER_THAN or LESS_THAN (value = 0 or 1 or -1)
		 */
		function basicCompareFunction(firstElement, secondElement) {
			if (firstElement === secondElement) {
				return EQUAL;
			}
			if (firstElement > secondElement) {
				return GREATER_THAN;
			}
			return LESS_THAN;
		}

		/**
		 * compareFunction for use with sortAndRemoveDuplicates
		 * when sorting an Array of tasks
		 * @method compareTasks
		 * @private
		 * @param {Object} firstElement First Array element to compare
		 * @param {Object} secondElement Second Array element to compare
		 * return {Number} EQUAL or GREATER_THAN or LESS_THAN (value = 0 or 1 or -1)
		 */
		function compareTasks(firstElement, secondElement) {
			return basicCompareFunction(firstElement._data.taskId, secondElement._data.taskId);
		}

		/**
		 * compareFolders for use with sorting on PVR Screen
		 * when sorting an Array of tasks
		 * @method compareFolders
		 * @private
		 * @param {Object} firstElement First Array element to compare
		 * @param {Object} secondElement Second Array element to compare
		 * return {Number} EQUAL or GREATER_THAN or LESS_THAN (value = 0 or 1 or -1)
		 */
		function sortByUiFolder(firstElement, secondElement) {
			var firstElementUiFolder = firstElement.uiFolder || firstElement._data.uiFolder,
				secondElementUiFolder = secondElement.uiFolder || secondElement._data.uiFolder;
			firstElementUiFolder = $N.app.StringUtil.removeLeadingForwardSlash(firstElementUiFolder);
			secondElementUiFolder = $N.app.StringUtil.removeLeadingForwardSlash(secondElementUiFolder);
			return basicCompareFunction(firstElementUiFolder, secondElementUiFolder);
		}

		/**
		 * compareIsFolder for use with sorting on PVR Screen
		 * when sorting an Array of tasks
		 * @method compareIsFolder
		 * @private
		 * @param {Object} firstElement First Array element to compare
		 * @param {Object} secondElement Second Array element to compare
		 * return {Number} EQUAL or GREATER_THAN or LESS_THAN (value = 0 or 1 or -1)
		 */
		function sortByIsFolder(firstElement, secondElement) {
			var firstElementIsFolder = $N.app.FolderUtil.isInFolder(firstElement),
				secondElementIsFolder = $N.app.FolderUtil.isInFolder(secondElement);
			return basicCompareFunction(secondElementIsFolder, firstElementIsFolder);
		}

		/**
		 * compareFunction for use with sortAndRemoveDuplicates
		 * when sorting a Ratings Array
		 * @method compareRatingPrecedenceValues
		 * @private
		 * @param {Object} firstElement First Array element to compare
		 * @param {Object} secondElement Second Array element to compare
		 * return {Number} EQUAL or GREATER_THAN or LESS_THAN (value = 0 or 1 or -1)
		 */
		function compareRatingPrecedenceValues(firstElement, secondElement) {
			if (firstElement.precedenceValue === secondElement.precedenceValue) {
				return EQUAL;
			}
			if (firstElement.precedenceValue > secondElement.precedenceValue) {
				return GREATER_THAN;
			}
			if (firstElement.precedenceValue < secondElement.precedenceValue) {
				return LESS_THAN;
			}
		}

		/**
		 * Function to pass into list.sort to sort recordings by date descending
		 * @method sortByDateDesc
		 * @param {Object} a
		 * @param {Object} b
		 */
		function sortByDateDesc(a, b) {
			return basicCompareFunction(b.startTime, a.startTime);
		}

		/**
		 * Function to pass into list.sort to sort recordings by date ascending
		 * @method sortByDateAsc
		 * @param {Object} a
		 * @param {Object} b
		 */
		function sortByDateAsc(a, b) {
			return basicCompareFunction(a.startTime, b.startTime);
		}

		/**
		 * Function to pass into list.sort to sort recordings by title ascending
		 * @method sortByTitle
		 * @param {Object} a
		 * @param {Object} b
		 */
		function sortByTitle(a, b) {
			return basicCompareFunction(a.title, b.title);
		}

		/**
		 * Function to pass into list.sort to sort recordings by the displayed title ascending
		 * @method sortBySortTitle
		 * @param {Object} a
		 * @param {Object} b
		 */
		function sortBySortTitle(a, b) {
			return basicCompareFunction(a.sortTitle, b.sortTitle);
		}

		/**
		 * Function to pass into list.sort to sort recordings by epsodeId ascending
		 * @method sortByEpisodeId
		 * @param {Object} a
		 * @param {Object} b
		 */
		function sortByEpisodeId(a, b) {
			return basicCompareFunction(a.episodeId, b.episodeId);
		}

		/**
		 * Function to pass into list.sort to sort recordings by folder ascending then by Date descending
		 * @method sortByIsFolderThenDate
		 * @param {Object} a
		 * @param {Object} b
		 */
		function sortByIsFolderThenDate(a, b) {
			return sortByIsFolder(a, b) || sortByDateDesc(a, b);
		}

		/**
		 * Function to pass into list.sort to sort recordings by folder ascending then by Title ascending
		 * @method sortByFolderThenDate
		 * @param {Object} a
		 * @param {Object} b
		 */
		function sortByFolderThenTitle(a, b) {
			return sortByUiFolder(a, b) || sortByTitle(a, b);
		}

		/**
		 * Function to pass into list.sort to sort recordings by Displayed Title ascending then EpisodeId
		 * @method sortBySortTitleThenEpisodeId
		 * @param {Object} a
		 * @param {Object} b
		 */
		function sortBySortTitleThenEpisodeId(a, b) {
			return sortBySortTitle(a, b) || sortByEpisodeId(a, b);
		}

		/**
		 * Function to pass into list.sort to sort recordings by channel number ascending
		 * @method sortByChannel
		 * @param {Object} a
		 * @param {Object} b
		 */
		function sortByChannel(a, b) {
			return $N.platform.btv.EPG.getChannelByServiceId(a.serviceId).logicalChannelNum - $N.platform.btv.EPG.getChannelByServiceId(b.serviceId).logicalChannelNum;
		}

		/**
		 * @method sortByLogicalChannelNum
		 * @param {Object} a
		 * @param {Object} b
		 */
		function sortByLogicalChannelNum(a, b) {
			return (a.logicalChannelNum - b.logicalChannelNum);
		}

		/**
		 * @method sortByChannelKey
		 * @param {Object} a
		 * @param {Object} b
		 */
		function sortByChannelKey(a, b) {
			return basicCompareFunction(a._data.channelKey, b._data.channelKey);
		}

		/**
		 * @method eventListChannelSortNumberAsc
		 * @param {Object} a
		 * @param {Object} b
		 */
		function eventListChannelSortNumberAsc(a, b) {
			var ChannelByServiceId = $N.platform.btv.EPG.getChannelByServiceId(b.serviceId);
			if (ChannelByServiceId !== undefined) {
				return $N.platform.btv.EPG.getChannelByServiceId(a.serviceId).logicalChannelNum > ChannelByServiceId.logicalChannelNum;
			}
		}

		/**
		 * @method eventListChannelSortNumberDec
		 * @param {Object} a
		 * @param {Object} b
		 */
		function eventListChannelSortNumberDec(a, b) {
			var ChannelByServiceId = $N.platform.btv.EPG.getChannelByServiceId(b.serviceId);
			if (ChannelByServiceId !== undefined) {
				return $N.platform.btv.EPG.getChannelByServiceId(a.serviceId).logicalChannelNum < ChannelByServiceId.logicalChannelNum;
			}
		}

		/**
		 * @method eventListChannelSortNameAsc
		 * @param {Object} a
		 * @param {Object} b
		 */
		function eventListChannelSortNameAsc(a, b) {
			var ChannelByServiceId = $N.platform.btv.EPG.getChannelByServiceId(b.serviceId);
			if (ChannelByServiceId !== undefined) {
				return $N.platform.btv.EPG.getChannelByServiceId(a.serviceId).serviceName > ChannelByServiceId.serviceName;
			}
		}

		/**
		 * @method eventListChannelSortNameDec
		 * @param {Object} a
		 * @param {Object} b
		 */
		function eventListChannelSortNameDec(a, b) {
			var ChannelByServiceId = $N.platform.btv.EPG.getChannelByServiceId(b.serviceId);
			if (ChannelByServiceId !== undefined) {
				return $N.platform.btv.EPG.getChannelByServiceId(a.serviceId).serviceName < ChannelByServiceId.serviceName;
			}
		}

		/**
		 * @method eventListEventSortNameAsc
		 * @param {Object} a
		 * @param {Object} b
		 */
		function eventListEventSortNameAsc(a, b) {
			return a.title > b.title;
		}

		/**
		 * @method channelSortNumberAsc
		 * @param {Object} a
		 * @param {Object} b
		 */
		function channelSortNumberAsc(a, b) {
			return a.logicalChannelNum > b.logicalChannelNum;
		}

		/**
		 * @method channelSortNumberDec
		 * @param {Object} a
		 * @param {Object} b
		 */
		function channelSortNumberDec(a, b) {
			return a.logicalChannelNum < b.logicalChannelNum;
		}

		/**
		 * @method channelSortNameAsc
		 * @param {Object} a
		 * @param {Object} b
		 */
		function channelSortNameAsc(a, b) {
			return a.serviceName > b.serviceName;
		}

		/**
		 * @method channelSortNameDec
		 * @param {Object} a
		 * @param {Object} b
		 */
		function channelSortNameDec(a, b) {
			return a.serviceName < b.serviceName;
		}

		// Public
		return {
			compareTasks: compareTasks,
			compareRatingPrecedenceValues: compareRatingPrecedenceValues,
			sortByUiFolder: sortByUiFolder,
			sortByDateDesc: sortByDateDesc,
			sortByDateAsc: sortByDateAsc,
			sortByTitle: sortByTitle,
			sortByChannel: sortByChannel,
			sortByLogicalChannelNum: sortByLogicalChannelNum,
			sortByChannelKey: sortByChannelKey,
			sortByIsFolderThenDate: sortByIsFolderThenDate,
			sortByFolderThenTitle: sortByFolderThenTitle,
			sortBySortTitleThenEpisodeId: sortBySortTitleThenEpisodeId,
			eventListChannelSortNumberAsc: eventListChannelSortNumberAsc,
			eventListChannelSortNumberDec: eventListChannelSortNumberDec,
			eventListChannelSortNameAsc: eventListChannelSortNameAsc,
			eventListChannelSortNameDec: eventListChannelSortNameDec,
			eventListEventSortNameAsc: eventListEventSortNameAsc,
			channelSortNumberAsc: channelSortNumberAsc,
			channelSortNumberDec: channelSortNumberDec,
			channelSortNameAsc: channelSortNameAsc,
			channelSortNameDec: channelSortNameDec,
			EQUAL: EQUAL,
			GREATER_THAN: GREATER_THAN,
			LESS_THAN: LESS_THAN
		};
	}($N));

}($N || {}));