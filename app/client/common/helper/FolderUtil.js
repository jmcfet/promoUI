/**
 * @class $N.app.FolderUtil
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.app.StringUtil
 * @requires $N.apps.core.Language
 * @requires $N.app.constants
 * @requires $N.platform.system.Preferences
 * @requires $N.platform.btv.PVRManager
 * @requires $N.app.PVRCapability
 * @requires $N.app.PVRUtil
 * @author hepton
 * #depends StringUtil.js
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.FolderUtil = (function () {
		var log = new $N.apps.core.Log("Helper", "FolderUtil"),
			stringUtil = $N.app.StringUtil,
			escapeApostrophes = stringUtil.escapeApostrophes,
			addLeadingForwardSlash = stringUtil.addLeadingForwardSlash,
			removeLeadingForwardSlash = stringUtil.removeLeadingForwardSlash,
			sortFolderList = function () {};

		/**
		 * Private method that sorts two strings irrespective of the case.(Normal javascript sort is Case sensitive.)
		 * @method  _compareSort
		 * @private
		 * @param {string} firstObject- first object to compare.
		 * @param {string} secondObject - second object to compare.
		 * @return {array} - sorted array
		 */

		function _compareSort(firstObject, secondObject) {
			var firstTitle = String(firstObject.title).toLowerCase(),
				secondTitle = String(secondObject.title).toLowerCase();
			return firstTitle.localeCompare(secondTitle);
		}

			/**
			* @method sortFolderList
			* @public
			* @param {object} data
			* @return {object}- sorted array of objects.
			*/

		sortFolderList = function (data) {
			var topFolderInListTada,
				folderOnTop;
			folderOnTop = data.splice(0, 1);
			data.sort(_compareSort);
			data.splice(0, 0, folderOnTop[0]);
			return data;
		};

		return {

			/**
			 * @method initialise
			 */
			initialise: function () {
				$N.apps.core.Language.adornWithGetString($N.app.FolderUtil);
			},

			/**
			 * @method isFolderRootFolder
			 * @param {String} the folder to check
			 * @return {Boolean} The folder is root result
			 */
			isFolderRootFolder: function (folder) {
				return (folder === "" ||
						folder === null ||
						folder === $N.app.constants.ROOT_PVR_FOLDER_VALUE ||
						folder === $N.app.constants.ROOT_PVR_FOLDER_NAME ||
						folder === $N.app.FolderUtil.getString('pvrSettingsRecordingHighlights') ||
						folder === $N.app.constants.LEGACY_DEFAULT_NON_EPISODIC_FOLDER_NAME);
			},

			/**
			* @method isInFolder
			* @param {Object} task
			* @return {Boolean} isInFolder
			*/
			isInFolder: function (task) {
				return task && task.uiFolder && !this.isFolderRootFolder(task.uiFolder);
			},

			/**
			 * @method getFolderName
			 * @param {Object} task
			 * @return {String} folderName
			 */
			getFolderName: function (task) {
				if (this.isInFolder(task)) {
					return removeLeadingForwardSlash(task.uiFolder);
				}
				return "";
			},

			/**
			 * @method getNonEpisodicDefaultFolder
			 * @return {String} The default Folder Value
			 */
			getNonEpisodicDefaultFolder: function () {
				log("getNonEpisodicDefaultFolder", "Enter");
				var nonEpisodicDefaultFolderName = $N.platform.system.Preferences.get($N.app.constants.PVR_NON_EPISODIC_DEFAULT_FOLDER),
					rootFolderName = $N.app.constants.ROOT_PVR_FOLDER_NAME,
					rootFolderValue = $N.app.constants.ROOT_PVR_FOLDER_VALUE;
				if (nonEpisodicDefaultFolderName === null) {
					$N.platform.system.Preferences.set($N.app.constants.PVR_NON_EPISODIC_DEFAULT_FOLDER, rootFolderName);
					log("getNonEpisodicDefaultFolder", "Exit with rootFolderName: ", rootFolderName);
					return rootFolderValue;
				} else if (nonEpisodicDefaultFolderName === $N.app.constants.ROOT_PVR_FOLDER_NAME) {
					return rootFolderValue;
				}
				log("getNonEpisodicDefaultFolder", "Exit with nonEpisodicDefaultFolderName: ", nonEpisodicDefaultFolderName);
				return nonEpisodicDefaultFolderName;
			},

			/**
			 * @method getDislayedDefaultNonEpisodicFolderName
			 * @return {String} The default Folder Name
			 */
			getDislayedDefaultNonEpisodicFolderName: function () {
				log("getDislayedDefaultNonEpisodicFolderName", "Enter");
				var defaultFolder = this.getNonEpisodicDefaultFolder();
				if (this.isFolderRootFolder(defaultFolder)) {
					log("getDislayedDefaultNonEpisodicFolderName", "Exit with root string");
					return this.getString('pvrSettingsRecordingHighlights');
				}
				log("getDislayedDefaultNonEpisodicFolderName", "Exit with defaultFolder");
				return removeLeadingForwardSlash(defaultFolder);
			},

			/**
			 * @method getPlayableRecordingsForFolders
			 * @return {Array} All non-future recordings
			 */
			getPlayableRecordingsForFolders: function () {
				log("getPlayableRecordingsForFolders", "Enter & Exit");
				return $N.platform.btv.PVRManager.getPlayableRecordings();
			},

			/**
			* @method getPlayableRecordingsByFolderName
			* @param {String} folderName
			* @return {Array} of tasks
			*/
			getPlayableRecordingsByFolderName: function (folderName) {
				log("getPlayableRecordingsByFolderName", "Enter");
				var tasks = $N.platform.btv.PVRManager.getPlayableRecordingsByFolderName(addLeadingForwardSlash(folderName));
				if (tasks && tasks.length) {
					log("getPlayableRecordingsByFolderName", "Exit returning tasks retrieved by call to addLeadingForwardSlash");
					return tasks;
				} else {
					log("getPlayableRecordingsByFolderName", "Exit returning tasks retrieved with folderName");
					return $N.platform.btv.PVRManager.getPlayableRecordingsByFolderName(folderName);
				}
			},

			/**
			* @method getRecordingsByFolderName
			* @param {String} folderName
			* @return {Array} of tasks
			*/
			getRecordingsByFolderName: function (folderName) {
				log("getRecordingsByFolderName", "Enter");
				var data = null,
					whereSqlQueryString = "taskType='REC' AND uiFolder = '" + escapeApostrophes(addLeadingForwardSlash(folderName)) + "'";
				data = $N.platform.btv.PVRManager.getEntriesByQuery($N.platform.btv.PVRManager.WIDE_TASK_FIELD_FILTER, whereSqlQueryString, "startTime DESC");
				data = data.concat($N.platform.btv.PVRManager.getRemoteRecordingsByFolder(addLeadingForwardSlash(folderName)));
				if (data && data.length) {
					log("getRecordingsByFolderName", "Exit returning tasks retrieved by call to addLeadingForwardSlash");
					return data;
				} else {
					log("getRecordingsByFolderName", "Exit returning tasks retrieved with folderName");
					whereSqlQueryString = "taskType='REC' AND uiFolder = '" + escapeApostrophes(folderName) + "'";
					data = $N.platform.btv.PVRManager.getEntriesByQuery($N.platform.btv.PVRManager.WIDE_TASK_FIELD_FILTER, whereSqlQueryString, "startTime DESC");
					data = data.concat($N.platform.btv.PVRManager.getRemoteRecordingsByFolder(folderName));
					return data;
				}
			},

			/**
			* @method getActiveRecordingsByFolderName
			* @param {String} folderName
			* @return {Array} of tasks that currently recording in the named folder
			*/
			getActiveRecordingsByFolderName: function (folderName) {
				log("getActiveRecordingsByFolderName", "Enter");
				var mediumId = $N.app.PVRCapability.getCurrentMediaId() || -1,
					whereSqlQueryString = "taskType='REC' AND (uiFolder = '" + escapeApostrophes(addLeadingForwardSlash(folderName)) + "' OR uiFolder = '" + escapeApostrophes(folderName) + "') AND objectState=1 AND inactive=0 AND mediumID = '" + mediumId + "'";
				log("getActiveRecordingsByFolderName", "Exit returning tasks retrieved with folderName");
				return $N.platform.btv.PVRManager.getEntriesByQuery("taskId, taskType, scheduleType, objectState, completeStatus, isAuthorized", whereSqlQueryString, "startTime DESC");
			},

			/**
			 * compareFunction for use with $N.app.ArrayUtil.removeDuplicates
			 * when removing duplicates from a Folder data Array
			 * @method compareDataForFolders
			 * @private
			 * @param {Object} firstElement First Array element to compare
			 * @param {Object} secondElement Second Array element to compare
			 * return {Number} EQUAL or GREATER_THAN or LESS_THAN (value = 0 or 1 or -1)
			 */
			compareDataForFolders: function (firstElement, secondElement) {
				log("compareDataForFolders", "Enter");
				var firstElementUiFolder = firstElement.uiFolder || firstElement._data.uiFolder,
					secondElementUiFolder = secondElement.uiFolder || secondElement._data.uiFolder;
				firstElementUiFolder = removeLeadingForwardSlash(firstElementUiFolder);
				secondElementUiFolder = removeLeadingForwardSlash(secondElementUiFolder);
				if (firstElementUiFolder && secondElementUiFolder) {
					if (firstElementUiFolder === secondElementUiFolder) {
						return $N.app.ArrayUtil.EQUAL;
					}
					if (firstElementUiFolder > secondElementUiFolder) {
						return $N.app.ArrayUtil.GREATER_THAN;
					}
					if (firstElementUiFolder < secondElementUiFolder) {
						return $N.app.ArrayUtil.LESS_THAN;
					}
				}
				// If either of the elements are null, return LESS_THAN
				// this function is only used for removing duplicates
				// We want all elements without a folder
				return $N.app.ArrayUtil.LESS_THAN;
			},

			/**
			* @method getDataForFolders
			* @return {Array} sorted data array
			*/
			getDataForFolders: function () {
				log("getDataForFolders", "Enter");
				var data = this.getPlayableRecordingsForFolders();
				$N.app.ArrayUtil.removeDuplicates(data, this.compareDataForFolders);
				log("getDataForFolders", "Exit");
				return data;
			},

			/**
			* @method getNumberOfEpisodes
			* @param {String} folderName
			* @return {Number} numberOfEpisodes
			*/
			getNumberOfEpisodes: function (folderName) {
				var mediumId = $N.app.PVRCapability.getCurrentMediaId() || -1,
					whereSqlQueryString = "taskType='REC' AND objectState<6 AND objectState>0 AND  mediumID = '" +
						mediumId + "' AND (uiFolder = '" + escapeApostrophes(addLeadingForwardSlash(folderName)) + "' OR uiFolder = '" + escapeApostrophes(folderName) + "')";

				return $N.platform.btv.PVRManager.countTasksByQuery(whereSqlQueryString) +
					$N.platform.btv.PVRManager.getRemoteRecordingsByFolder(addLeadingForwardSlash(folderName)).length;
			},

			/**
			* @method updateBlockedStateForFolder
			* @param {String} folderName
			* @param {Boolean} isTaskUnblocked
			*/
			updateBlockedStateForFolder: function (folderName, isTaskUnblocked) {
				log("updateBlockedStateForFolder", "Enter");
				var folderContent = this.getPlayableRecordingsByFolderName(folderName),
					folderContentLength = folderContent.length,
					i;
				for (i = 0; i < folderContentLength; i++) {
					$N.app.PVRUtil.updateBlockedState(folderContent[i].taskId, isTaskUnblocked);
				}
				log("updateBlockedStateForFolder", "Exit");
			},

			/**
			* @method isFolderUserGenerated
			* @param {String} folderName
			* @return {Boolean} isFolderUserGenerated
			*/
			isFolderUserGenerated: function (folderName) {
				log("isFolderUserGenerated", "Enter");
				var userGeneratedFolders = $N.platform.system.Preferences.get($N.app.constants.PVR_NON_EPISODIC_FOLDER_LIST),
					userGeneratedFoldersLength = userGeneratedFolders.length,
					i,
					folderNameWithLeadingSlash;
				if (folderName && userGeneratedFoldersLength) {
					folderNameWithLeadingSlash = addLeadingForwardSlash(folderName);
					for (i = 0; i < userGeneratedFoldersLength; i++) {
						if (folderNameWithLeadingSlash === userGeneratedFolders[i] || folderName === userGeneratedFolders[i]) {
							log("isFolderUserGenerated", "Exit returning true, is user generated");
							return true;
						}
					}
				}
				log("isFolderUserGenerated", "Exit returning false, is not user generated");
				return false;
			},

		/**
			* @method renameFolderForRecordings
			* @param {String} folderName
			* @param {String} newFolderName
			*/
			renameFolderForRecordings: function (folderName, newFolderName) {
				log("renameFolderForRecordings", "Enter");
				var recordings = this.getRecordingsByFolderName(folderName),
					recordingsLength = recordings.length,
					i;
				$N.app.PVRUtil.initialiseTasksCallbackCount(recordingsLength);
				for (i = 0; i < recordingsLength; i++) {
					$N.app.PVRUtil.updateRecordingByTask(recordings[i], {uiFolder: newFolderName});
				}
				log("renameFolderForRecordings", "Exit");
			},

			/**
			* @method renameFolderInPreferences
			* @param {String} folderName
			* @param {String} newFolderName
			*/
			renameFolderInPreferences: function (folderName, newFolderName) {
				log("renameFolderInPreferences", "Enter");
				var userGeneratedFolders = $N.platform.system.Preferences.get($N.app.constants.PVR_NON_EPISODIC_FOLDER_LIST),
					userGeneratedFoldersLength = userGeneratedFolders.length,
					i,
					actualDefaultFolder = addLeadingForwardSlash(this.getDislayedDefaultNonEpisodicFolderName());
				for (i = 0; i < userGeneratedFoldersLength; i++) {
					if (folderName === userGeneratedFolders[i]) {
						userGeneratedFolders[i] = newFolderName;
						break;
					}
				}
				if (actualDefaultFolder === folderName) {
					$N.platform.system.Preferences.set($N.app.constants.PVR_NON_EPISODIC_DEFAULT_FOLDER, newFolderName.toString());
				}
				$N.platform.system.Preferences.set($N.app.constants.PVR_NON_EPISODIC_FOLDER_LIST, userGeneratedFolders);
				log("renameFolderInPreferences", "Exit");
			},

			/**
			* @method renameFolder
			* @param {String} folderName
			* @param {String} newFolderName
			*/
			renameFolder: function (folderName, newFolderName) {
				log("renameFolder", "Enter");
				newFolderName =  $N.app.StringUtil.firstLetterPerWordCapitol(newFolderName);
				folderName = addLeadingForwardSlash(folderName);
				newFolderName = addLeadingForwardSlash(newFolderName);
				this.renameFolderInPreferences(folderName, newFolderName);
				this.renameFolderForRecordings(folderName, newFolderName);
				log("renameFolder", "Exit");
			},

			/**
			* @method updateKeepForFolder
			* @param {String} folderName
			* @param {Boolean} keepValue
			*/
			updateKeepForFolder: function (folderName, keepValue) {
				log("updateKeepForFolder", "Enter");
				var folderContent = this.getPlayableRecordingsByFolderName(folderName),
					folderContentLength = folderContent.length,
					i;
				for (i = 0; i < folderContentLength; i++) {
					$N.app.PVRUtil.updateRecordingByTask(folderContent[i], {keep: keepValue});
				}
				log("updateKeepForFolder", "Exit");
			},

			sortFolderList: sortFolderList,
			FOLDER_NAME_MAX_CHARACTERS: 18

		};

	}());

}($N || {}));
