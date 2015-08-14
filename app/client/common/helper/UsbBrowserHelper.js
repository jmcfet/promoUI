/**
 * Helper class USB Media Playback.
 * @class $N.app.UsbBrowserHelper
 * @author sharath
 * @static
 * @requires $N.app.constants
 * #depends ../Constants.js
*/
(function ($N) {
	$N.app = $N.app || {};
	$N.app.UsbBrowserHelper = (function () {
		var _mediaPlaybackEnabled = false,
			_usbMediumID = null,
			MAX_INDEX = 5000,
			_rootPath = $N.app.constants.USB_MOUNT_POINT,
			_unicodeForSingleSpace = $N.app.constants.SINGLE_SPACE_UNICODE,
			_partitionList = [],
			_partitionName = "",
			_mediaContent = [],
			_mediaMode = null,
			_mediaName = null,
			isUSBReading = false,
			_imageFileSystem = null,
			_audioFileSystem = null,
			_videoFileSystem = null,
			activeFileSystem = null,
			imageLoadTimer = null,
			previewImageLoadDelay = 300;

		/**
		 * sets the media list on to the respective file system object based on mode.
		 * @method setMediaContentList
		 */
		function setMediaContentList() {
			var mediaMode = ['Audios', 'Images', 'Videos'],
				i,
				j,
				resultSet = null,
				results = [];
			for (j = 0; j < mediaMode.length; j++) {
				resultSet = CCOM.MediaLibrary.getEntryRSByQuery("fileObjectUrl", "mediumID LIKE '" + _usbMediumID + "'", mediaMode[j], "mediumID");
				results = resultSet.getNext(MAX_INDEX);
				for (i = 0; i < results.length; i++) {
					_mediaContent.push(results[i].fileObjectUrl);
				}
				if (_mediaContent.length > 0) {
					switch (mediaMode[j]) {
					case 'Images':
						_imageFileSystem = new $N.app.FileSystem();
						_imageFileSystem.reinitializeFileSystem();
						_imageFileSystem.setRootMountPath("/" + _rootPath + "/" + _partitionName);
						_imageFileSystem.addFilesToFileSystem(_mediaContent);
						break;
					case 'Audios':
						_audioFileSystem = new $N.app.FileSystem();
						_audioFileSystem.reinitializeFileSystem();
						_audioFileSystem.setRootMountPath("/" + _rootPath + "/" + _partitionName);
						_audioFileSystem.addFilesToFileSystem(_mediaContent);
						break;
					case 'Videos':
						_videoFileSystem = new $N.app.FileSystem();
						_videoFileSystem.reinitializeFileSystem();
						_videoFileSystem.setRootMountPath("/" + _rootPath + "/" + _partitionName);
						_videoFileSystem.addFilesToFileSystem(_mediaContent);
						break;
					}
				}
				_mediaContent = [];
			}
			//Content loaded callback. To be handled in Media Browser.
			$N.apps.util.EventManager.fire("usbContentLoaded", false);
		}
		/**
		 * Returns a formatted duration string with the format "HH:MM:SS"
		 * @method getFormattedDurationStringFromMS
		 * @param {Number} duration Duration in MS
		 * @return {String}
		 */
		function getFormattedTimefromMS(duration) {
			var hours = Math.floor(duration / 3600000),
				minutes = Math.floor(duration / 60000) - Math.round(hours * 60),
				seconds = Math.floor(duration / 1000) - Math.round(minutes * 60),
				durationStr = "";
			if (duration === 0) {
				return "";
			}
			durationStr += String(("0" + hours).slice(-2)) + ":";
			if (minutes === 1) {
				durationStr += String(("0" + minutes).slice(-2)) + ":";
			} else {
				durationStr += String(("0" + minutes).slice(-2)) + ":";
			}
			if (seconds === 1) {
				durationStr += String(("0" + seconds).slice(-2));
			} else {
				durationStr += String(("0" + seconds).slice(-2));
			}

			return durationStr;
		}
		/**
		 * returns object with not available text if there is no metadata.
		 * @method getItemDetailsIfNoMetadata
		 * @param {mode} Image/Audio, {title} url
		 * @private
		 * @return {Object} item Details with no data
		 */
		function getItemDetailsIfNoMetadata(mode, title) {
			var itemDetails = [],
				notAvailableText = $N.app.UsbBrowserHelper.getString("notAvailable");

			if (mode === "Videos") {
				itemDetails.push({
					'url': title,
					'duration': null,
					'fileSize': null
				});
			} else if (mode === "Audios") {
				itemDetails.push({
					'title': notAvailableText,
					'album': notAvailableText,
					'url': title,
					'duration': notAvailableText,
					'artist': notAvailableText,
					'albumArtUri': notAvailableText
				});
			} else if (mode === "Images") {
				itemDetails.push({
					'fileName' : "",
					'width': null,
					'height': null
				});
			}
			return itemDetails;
		}
		/**
		 * Returns a formatted duration string with the format "HH:MM:SS"
		 * @method getMediaMetadata
		 * @param {title} filename.{mode} Images,Videos,Audios
		 * @return {Object} metadata details
		 */
		function getMediaMetadata(title, mode, menuItem) {
			var resultSet = null,
				formatDate,
				mediaDate = "",
				metaData = "",
				result = null,
				duration = null,
				fileTitle = title.replace("file://", ""),
				itemDetails = [],
				notAvailableText = $N.app.UsbBrowserHelper.getString("notAvailable");

			resultSet = CCOM.MediaLibrary.getEntryRSByQuery("*", "mediumID LIKE '" + _usbMediumID + "' AND fileObjectUrl LIKE '%" + fileTitle + "%'", mode, "mediumID");
			if (resultSet && resultSet.getNext) {
				result = resultSet.getNext(MAX_INDEX)[0];
			}
			if (result) {
				if (result.fileModifyDateTime) {
					mediaDate = new Date(result.fileModifyDateTime);
					//directly using the Util method as there is no provision to send the extra parameters in DateTimeUtil class.
					//Date to be in portuguese if the selected language is portuguese.
					formatDate =  $N.apps.util.Util.formatDate(new Date(result.fileModifyDateTime), "DD MONTH YYYY", $N.app.UsbBrowserHelper.getString("longMonths"), null, null, null);
					metaData = formatDate.toString();
				}
				if (result.duration) {
					duration = getFormattedTimefromMS(result.duration);
					metaData = metaData + _unicodeForSingleSpace + _unicodeForSingleSpace + duration;
				}
				if (mode === "Videos") {
					itemDetails.push({
						'url': title,
						'duration': duration,
						'fileSize': result.fileObjectSize || null
					});
				} else if (mode === "Audios") {
					itemDetails.push({
						'title': result.audioSongTitle || notAvailableText,
						'album': result.audioAlbumTitle || notAvailableText,
						'url': title,
						'duration': duration,
						'artist': result.audioArtist || notAvailableText,
						'fileSize': result.fileObjectSize || null,
						'albumArtUri': ""
					});
				} else if (mode === "Images") {
					itemDetails.push({
						'fileName' : result.fileObjectUrl ? (result.fileObjectUrl.substr(result.fileObjectUrl.lastIndexOf('/') + 1)) : "",
						'width': result.imageWidth || null,
						'height': result.imageHeight || null,
						'fileSize': result.fileObjectSize || null
					});
				}
				metaData = {data : metaData, trackDuration: duration, itemDetails: itemDetails};
			} else {
				itemDetails = getItemDetailsIfNoMetadata(mode, title); //provide "not available" text if no metadata is available
				metaData = {data : metaData, trackDuration: duration, itemDetails: itemDetails};
			}
			return metaData;
		}

		/**
		 * Formats the file system data to the required format.
		 * @method formatFolderStructure
		 * @param {data} data
		 * @public
		 * @return {Array} Formatted folder with details
		 */
		function formatFolderStructure(data) {
			var i,
				formattedFolder = [];
			for (i = 0; i < data.length; i++) {
				formattedFolder.push({'title' : data[i].Name, 'type' : data[i].Type});
			}
			return formattedFolder;
		}
		/**
		 * checks whether the file is in a valid format
		 * @method _isValidFile
		 * @param {fileName} fileName
		 * @public
		 * @return {boolean} tells whether the filename has a valid extension. returns true/false.
		 */
		function _isValidFile(fileName) {
			var extensionString = "",
				fileExtensionArray,
				fileExtension;
			switch (_mediaMode) {
			case 'Images':
				extensionString = "jpg|gif|png";
				break;
			case 'Audios':
				extensionString = "mp3|wav";
				break;
			case 'Videos':
				extensionString = "mp4|avi|mkv";
				break;
			}
			fileExtensionArray = fileName.split('.');
			fileExtension = fileExtensionArray[fileExtensionArray.length - 1];
			if (extensionString.indexOf(fileExtension.toLowerCase()) > -1) {
				return true;
			} else {
				return false;
			}
		}
		/**
		 * returns the playlist in the current view
		 * @method getPlayList
		 * @public
		 * @return {Array} the formatted playList with details.
		 */
		function getPlayList() {
			var playList = activeFileSystem.getFullyQualifiedFileList(_isValidFile),
				i,
				modifiedPlayList = [];
			for (i = 0; i < playList.length; i++) {
				modifiedPlayList.push("file://" + playList[i]);
			}
			return modifiedPlayList;
		}

		/**
		 * sets the global variable activeFileSystem to the active mode.
		 * @method setActiveFileSystemMode
		 * @public
		 * @param {mode} mode = Audios, Videos, Images
		 */
		function setActiveFileSystemMode(mode) {
			switch (mode) {
			case 'Images':
				activeFileSystem = _imageFileSystem;
				break;
			case 'Audios':
				activeFileSystem = _audioFileSystem;
				break;
			case 'Videos':
				activeFileSystem = _videoFileSystem;
				break;
			}
		}
		/**
		 * returns the current folder name
		 * @method getCurrentFolderName
		 * @public
		 * @return {Object} Current folder object with title.
		 */
		function getCurrentFolderName() {
			var currentFolderName = {'title' : activeFileSystem.getCurrentFolderName()};
			return currentFolderName;
		}
		/**
		 * Gets all the contents in USB
		 * @method getFolderContent
		 * @public
		 * @param {mode} Images,Videos,Audios.{container} Folder Object.{callback} callback that will be called once data is retrieved.
		 */
		function getFolderContent(mode, folderObject, callback) {
			var data = [],
				folderName = folderObject.title;

			_mediaMode = mode;
			setActiveFileSystemMode(mode);
			if (activeFileSystem) {
				data = activeFileSystem.getFolderContents(folderName, _isValidFile);
			}
			if (callback) {
				callback(formatFolderStructure(data));
			}
		}
		/**
		 * navigates to the previous folder in the folder tree in USB.
		 * @method navigateToParentFolder
		 * @param {basePath} filename
		 * @public
		 * @return {boolean} true if its navigating back in current folder list. false if it is navigating to main menu on left.
		 */
		function navigateToParentFolder(basePath) {
			if (activeFileSystem && getCurrentFolderName().title !== basePath) {
				activeFileSystem.gotoParentFolder();
				return true;
			} else {
				return false;
			}
		}
		/**
		 * Navigates to each subFolders in the OK/Forward key press from browser
		 * @method navigateToSubFolder
		 * @public
		 * @param {mode} Images,Videos,Audios.{container} Folder Object.{callback} callback that will be called once data is retrieved.
		 */
		function navigateToSubFolder(mode, folderObject, callback) {
			var folderName = folderObject.title;
			if (activeFileSystem) {
				if (folderName !== _rootPath) {
					activeFileSystem.setCurrentFolderRelative(folderName);
				}
			}
			getFolderContent(mode, folderObject, callback);
		}
		/**
		 * Sets the status of the MediaPlayback
		 * @method setMediaPlaybackStatus
		 * @public
		 * @param {status} true/false indicating media playback enabled or not, {mediumID} ID of the plugged USB.
		 */
		function setMediaPlaybackStatus(status, mediumID) {
			_mediaPlaybackEnabled = status;
			_usbMediumID = null;
			if (_mediaPlaybackEnabled) {
				_usbMediumID = mediumID;
			}
		}
		/**
		 * Gets the status of the MediaPlayback
		 * @method getMediaPlaybackStatus
		 * @public
		 * @return {boolean} true/false indicating whether media playback is enabled or not.
		 */
		function getMediaPlaybackStatus() {
			return ($N.app.FeatureManager.getMediaPlaybackFeatureStatus() && _mediaPlaybackEnabled);
		}
		/**
		 * Sets the list of partitions in usb to __partitionList.
		 * @method setPartitionList
		 * @public
		 * @param {partitionList} the list of partitions available with USB.
		 */
		function setPartitionList(partitionList) {
			_partitionList = partitionList;
			if (_partitionList) {
				_partitionName = _partitionList[0].partitionName;
			}
		}
		/**
		 * returns the partition list.
		 * @method getPartitionList
		 * @public
		 */
		function getPartitionList() {
			return _partitionList;
		}
		/**
		 * sets the global variable _mediumName.
		 * @method setMediumName
		 * @public
		 */
		function setMediumName(mediaName) {
			_mediaName = mediaName;
		}
		/**
		 * gets the global variable _mediumName.
		 * @method getMediumName
		 * @public
		 * @return {string} the name of the media, currently defaulted as sda
		 */
		function getMediumName() {
			return _mediaName === "" ? $N.app.UsbBrowserHelper.getString("usbDefaultDeviceName") : _mediaName;
		}
		/**
		 * returns the current folder/file full path
		 * @method getCurrentFolderFullyQualifiedName
		 * @public
		 * @param {menuitem} Current menu item
		 * @return {String} fully qualified path of the current highlighted menu item.
		 */
		function getCurrentFolderFullyQualifiedName(menuItem) {
			return "file://" +  activeFileSystem.getCurrentFolderFullyQualifiedName() + "/" + menuItem.title;
		}
		/**
		 * sets the file system back to the root path
		 * @method rewindToBaseFolder
		 * @public
		 */
		function rewindToBaseFolder() {
			if (_imageFileSystem) {
				_imageFileSystem.rewindFileSystem();
			}
			if (_audioFileSystem) {
				_audioFileSystem.rewindFileSystem();
			}
			if (_videoFileSystem) {
				_videoFileSystem.rewindFileSystem();
			}
		}

		/**
		 * @method subscribeToUsbMediaPlaybackEvent
		 */
		function subscribeToUsbMediaPlaybackEvent(successCallback, failureCallback, context) {
			context = context || this;
			failureCallback = failureCallback || successCallback || null;
			var array = [];
			array.push($N.apps.util.EventManager.subscribe("usbMediaPlaybackEnabled", successCallback, context));
			array.push($N.apps.util.EventManager.subscribe("usbMediaPlaybackDisabled", failureCallback, context));
			return array;
		}

		/**
		 * @method unSubscribeToUsbMediaPlaybackEvent
		 */
		function unSubscribeToUsbMediaPlaybackEvent(array) {
			array = array || [];
			var i = 0;
			if (array.length) {
				for (i = 0; i < array.length; i++) {
					$N.apps.util.EventManager.unSubscribe(array[i]);
				}
			}
			return [];
		}

		/**
		 * returns the thumbnail url of the highlighted menu item
		 * @method getThumbnailUrl
		 * @param {menuItem} Current Menu Item
		 * @return {String} default thumbnail url.
		 */
		function getThumbnailUrl(menuItem) {
			return "./images/" + _mediaMode + ".png";
		}

		/**
		 * @method getActualImageUrlForPreview
		 * @param {menuItem} Current Menu Item
		 * @return {callback} .
		 */
		function getActualImageUrlForPreview(menuItem, callback) {
			var fullyQualifiedUrl = getCurrentFolderFullyQualifiedName(menuItem),
				metaData = getMediaMetadata(fullyQualifiedUrl, "Images", menuItem),
				isLandscape = null;
			if (_mediaMode === "Images") {//This is to display the Actual image in preview window for USB image contents
				if (imageLoadTimer) {
					window.clearTimeout(imageLoadTimer);
					imageLoadTimer = null;
				}
				if (metaData.itemDetails[0].width && metaData.itemDetails[0].height) {
					if (parseInt((metaData.itemDetails[0].width), 10) > parseInt((metaData.itemDetails[0].height), 10)) {
						isLandscape = true;
					} else {
						isLandscape = false;
					}
				}
				imageLoadTimer = setTimeout(function () {
					callback(fullyQualifiedUrl, isLandscape);
				}, previewImageLoadDelay);
			}
		}
		/**
		 * @method clearImageLoadTimer
		 */
		function clearImageLoadTimer() {
			if (imageLoadTimer) {
				window.clearTimeout(imageLoadTimer);
				imageLoadTimer = null;
			}
		}

		/**
		 * resets the file system to null
		 * @method resetFileSystem
		 */
		function resetFileSystem() {
			_imageFileSystem = null;
			_audioFileSystem = null;
			_videoFileSystem = null;
			activeFileSystem = null;
		}

		function initialiseLanguageBundle() {
			$N.apps.core.Language.adornWithGetString($N.app.UsbBrowserHelper);
		}
		/**
		 * sets the current state of the USB getting scanned
		 * @method setMediaContentLoading
		 */
		function setMediaContentLoading(loadingStatus) {
			isUSBReading = loadingStatus;
		}
		/**
		 * returns a boolean which says the USB content are still getting loaded or not
		 * @method isMediaContentLoading
		 * @return {boolean} isUSBReading
		 */
		function isMediaContentLoading() {
			return isUSBReading;
		}
		return {
			initialise: initialiseLanguageBundle,
			setMediaContentList: setMediaContentList,
			getFolderContent: getFolderContent,
			getMediaPlaybackStatus: getMediaPlaybackStatus,
			setMediaPlaybackStatus: setMediaPlaybackStatus,
			setPartitionList: setPartitionList,
			getPartitionList: getPartitionList,
			navigateToParentFolder: navigateToParentFolder,
			getPlayList: getPlayList,
			setMediumName: setMediumName,
			getMediumName: getMediumName,
			getMediaMetadata: getMediaMetadata,
			setActiveFileSystemMode: setActiveFileSystemMode,
			getCurrentFolderName: getCurrentFolderName,
			getCurrentFolderFullyQualifiedName: getCurrentFolderFullyQualifiedName,
			rewindToBaseFolder: rewindToBaseFolder,
			subscribeToUsbMediaPlaybackEvent: subscribeToUsbMediaPlaybackEvent,
			unSubscribeToUsbMediaPlaybackEvent: unSubscribeToUsbMediaPlaybackEvent,
			getThumbnailUrl: getThumbnailUrl,
			resetFileSystem: resetFileSystem,
			navigateToSubFolder: navigateToSubFolder,
			setMediaContentLoading: setMediaContentLoading,
			isMediaContentLoading: isMediaContentLoading,
			clearImageLoadTimer: clearImageLoadTimer,
			getActualImageUrlForPreview: getActualImageUrlForPreview
		};
	}());

}($N || {}));
