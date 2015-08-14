/**
 * Helper class DLNA Media Playback.
 *
 * @class $N.app.DlnaHelper
 * @author sharath
 * @static
 * @requires $N.app.constants
 * #depends ../Constants.js
*/
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.DlnaHelper  = (function () {
		var	ONE_MINUTE = 60000,
			_deviceUdn = null,
			_currentDevice = null,
			_rootPath = $N.app.constants.USB_MOUNT_POINT, //needed so that Media Browser can re-use the helper code.
			_formatFolder = [],
			_mediaMode = null,
			_mediaModeThumbnail = "",
			_parentID = [],
			MAX_CONTENT_ITEMS = 25,
			_unicodeForSingleSpace = $N.app.constants.SINGLE_SPACE_UNICODE,
			hasVisited = false,
			_mediaName = null,
			fileTypes = {
				AUDIO: 1,
				IMAGE: 2,
				VIDEO: 3,
				FOLDER: 4,
				FILE: 5,
				UNKNOWN: 6
			},
			_successCallback = null,
			_deviceListDialog = null,
			browseRequesthandle = null,
			DEFAULT_DEVICE_MANUFACTURER = "nagra";// device manufacturer name to be checked to avoid WHPVR devices in DLNA. WHPVR devices have manufacturer name as 'nagra'

		/**
		 * Returns the mediaItem based on the title.
		 * @method getItemFromTitle
		 * @param {title} title
		 * @return {Object}
		 */
		function getItemFromTitle(title) {
			var i;
			for (i = 0; i < _formatFolder.length; i++) {
				if (_formatFolder[i].item && _formatFolder[i].item.resourceUrl === title) {
					return _formatFolder[i];
				}
			}
		}
		/**
		 * returns object with not available text if there is no metadata.
		 * @method getItemDetailsIfNoMetadata
		 * @param {mode} Image/Audio, {title} url
		 * @private
		 * @return {Object} item Details with no data
		 */
		function getItemDetailsIfNoMetadata(title) {
			var itemDetails = [],
				notAvailableText = $N.app.DlnaHelper.getString("notAvailable");

			itemDetails.push({
				'title': notAvailableText,
				'album': notAvailableText,
				'albumArtUri': notAvailableText,
				'url': title,
				'duration': notAvailableText,
				'artist': notAvailableText,
				'width': null,
				'height': null
			});
			return itemDetails;
		}
		/**
		 * Returns a formatted duration string with the format "HH:MM:SS"
		 * @method getMediaMetadata
		 * @param {title} filename.{mode} Images,Videos,Audios. {menuItem} Current menu item
		 * @return {Object} metadata details
		 */
		function getMediaMetadata(title, mode, menuItem) {
			var resultSet = null,
				formatDate = "",
				mediaDate = "",
				metaData = "",
				duration = null,
				results = [],
				itemDetails = [],
				MediaItem,
				albumArtUri = "",
				album = "",
				artist = "",
				resolution = null,
				width = null,
				height = null,
				sizeBytes = null,
				notAvailableText = $N.app.DlnaHelper.getString("notAvailable");

			MediaItem = getItemFromTitle(title);

			if (MediaItem) {
				if (MediaItem.item.resource) {
					duration = MediaItem.item.resource[0].duration;
					resolution = MediaItem.item.resource[0].resolution;
					sizeBytes = MediaItem.item.resource[0].sizeBytes;
				}
				if (MediaItem.item.date) {
					mediaDate = new Date(MediaItem.item.date[0].toString().split("T")[0]);
					//directly using the Util method as there is no provision to send the extra parameters in DateTimeUtil class.
					//Date to be in portuguese if the selected language is portuguese.
					formatDate =  $N.apps.util.Util.formatDate(mediaDate, "DD MONTH YYYY", $N.app.DlnaHelper.getString("longMonths"), null, null, null);

					metaData = formatDate;
					if (duration && duration.indexOf(".") > -1) {
						duration = duration.split(".")[0];
					}
					metaData = metaData + _unicodeForSingleSpace + _unicodeForSingleSpace + duration;
				}

				if (MediaItem.item.album) {
					album = MediaItem.item.album[0];
				}

				if (MediaItem.item.albumArtUri) {
					albumArtUri = MediaItem.item.albumArtUri[0].value;
				}

				if (MediaItem.item.artist) {
					artist =  MediaItem.item.artist[0].name;
				}

				if (resolution && resolution.indexOf('x') > -1) {
					width = resolution.split('x')[0];
					height = resolution.split('x')[1];
				}

				itemDetails.push({
					'title': MediaItem.title || notAvailableText,
					'album': album || notAvailableText,
					'albumArtUri': albumArtUri,
					'url': MediaItem.item.resourceUrl,
					'duration': duration,
					'artist': artist || notAvailableText,
					'width': width || null,
					'height': height || null,
					'fileSize': sizeBytes || null,
					'fileName': MediaItem.title || notAvailableText
				});
			} else {
				itemDetails = getItemDetailsIfNoMetadata(title); //provide "not available" text if no metadata is available
				metaData = {data : metaData, trackDuration: duration, itemDetails: itemDetails};
			}
			return {data : metaData, trackDuration: duration, itemDetails: itemDetails};
		}
		/**
		 * checks whether the file is in a valid format
		 * @method _isValidFile
		 * @param {resourceUrl} resourceUrl
		 * @private
		 * @return {Boolean} sets true or false based on extension available or not..
		 */
		function _isValidFile(resourceUrl) {
			var extensionString = "", //file formats to be supported by DLNA.
				fileExtensionArray,
				fileExtension,
				fileName = resourceUrl.split('?')[0];
			switch (_mediaMode) {
			case fileTypes.IMAGE:
				extensionString = "jpg|gif|png";
				break;
			case fileTypes.AUDIO:
				extensionString = "mp3|wav";
				break;
			case fileTypes.VIDEO:
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
		 * returns a formatted playlist with url and index
		 * @method formatForPlaylist
		 * @param {playList} playList
		 * @private
		 * @return {Array} The Array that contains playList for the player with details.
		 */
		function formatForPlaylist(playList) {
			var i,
				album = '',
				duration = '',
				playListFolder = [];
			for (i = 0; i < playList.length; i++) {
				if (playList[i].type === "File") {
					if (playList[i].album) {
						album = playList[i].item.album[0];
					}
					if (playList[i].resource) {
						duration = playList[i].resource[0].duration;
					}
					playListFolder.push(playList[i].item.resourceUrl);
				}
			}
			return playListFolder;
		}
		/**
		 * returns the playlist in the current view
		 * @method getPlayList
		 * @public
		 * @return {Array} The formatted folder array list.
		 */
		function getPlayList() {
			var i,
				playListFolder = [];
			if (_formatFolder.length > 0) {
				return formatForPlaylist(_formatFolder);
			} else {
				return [];
			}
		}
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
		 * Formats the file system data to the required format.
		 * @method formatFolderStructure
		 * @param {data} data
		 * @public
		 * @return {Array} The folder/file array object with its details.
		 */
		function formatFolderStructure(data) {
			var i,
				formattedFolder = [],
				formattedFile = [];
			for (i = 0; i < data.length; i++) {
				if (data[i].objectType === 1) {
					formattedFolder.push({'title' : data[i].title, 'type' : 'Folder', 'id' : data[i].id, 'parentID' : data[i].parentId, 'childCount' : (data[i].childCount || MAX_CONTENT_ITEMS)});
				} else if (_isValidFile(data[i].resourceUrl)) {
					//will be executed if the file mode matches either Audio/Video/Image and if it has a valid extension.
					formattedFile.push({'title' : data[i].title, 'type' : 'File', 'parentID' : data[i].parentId, 'item' : data[i]});
				}
			}
			formattedFolder.sort(_compareSort);//Sort the folder list.
			formattedFile.sort(_compareSort);//Sort the file list.
			_formatFolder = formattedFolder.concat(formattedFile);//Combine 2 arrays with folders before files..
			//resetting all array back to empty. Sorted data is now there in _formatFolder.
			//Folders shows up in list first and then comes files.
			formattedFolder = [];
			formattedFile = [];
			return _formatFolder;
		}

		/**
		 * sets the successcallback for DLNA get FolderContents.
		 * @method setSuccessCallback
		 * @param {callback} method
		 * @private
		 */
		function setSuccessCallback(callback) {
			_successCallback = callback;
		}

		/**
		 * Callback executed once the contents of the root folder of a remote UPnP
		 * device have been retrieved upon highlighting a UPnP device in the device list.
		 * The root directory contents are then previewed in the content list.
		 * @method getRootContentsForSelectedDeviceCallback
		 * @private
		 * @param {Object} rootContents The contents of the root folder on the selected remote UPnP device.
		 */
		function getContentsForSelectedDeviceCallback(rootContents, handleValue) {
			var key,
				filteredRootContents = [],
				i;
			if (rootContents && handleValue === browseRequesthandle) {
				//removing empty root folders
				for (key in rootContents) {
					if (rootContents.hasOwnProperty(key)) {
						//if (rootContents[key].childCount !== 0) {
						filteredRootContents.push(rootContents[key]);
						//}
					}
				}
				browseRequesthandle = null;
				_successCallback(formatFolderStructure(filteredRootContents));
			}
		}
		/**
		 * Gets all the contents in USB
		 * @method getFolderContent
		 * @public
		 * @param {mode} Images,Videos,Audios.{container} Folder Object.{callback} callback that will be called once data is retrieved.
		 */
		function getFolderContent(mode, container, callback) {
			var containerName = container.title,
				folderID = container.id,
				childCount = null,
				rootObject = null;

			setSuccessCallback(callback);
			if (containerName === _rootPath) {
				if (!hasVisited) {
					hasVisited = true;
					_parentID = [];
					rootObject = {'id' : "0", 'childCount' : MAX_CONTENT_ITEMS};
					_parentID.push(rootObject);//pushes 2 times which need to b controlled.
					browseRequesthandle = $N.platform.media.UPnP.getRootContentsForDevice(_currentDevice, getContentsForSelectedDeviceCallback);
				}
			} else {
				childCount = parseInt(container.childCount, 10) || MAX_CONTENT_ITEMS;
				browseRequesthandle = $N.platform.media.UPnP.getContentsForFolder(container, getContentsForSelectedDeviceCallback, 0, childCount);
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
			if (_parentID.length > 1) {
				_parentID.pop();
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
			_parentID.push(folderObject);
			getFolderContent(mode, folderObject, callback);
		}
		/**
		 * sets the global variable _mediumName.
		 * @method getMediumName
		 * @public
		 */
		function getMediumName() {
			return _mediaName;
		}
		/**
		 * sets the global variable activeFileSystem to the active mode.
		 * @method setActiveFileSystemMode
		 * @public
		 */
		function setActiveFileSystemMode(mode) {
			_mediaModeThumbnail = mode;
			switch (mode) {
			case "Images":
				_mediaMode = fileTypes.IMAGE;
				break;
			case "Audios":
				_mediaMode = fileTypes.AUDIO;
				break;
			case "Videos":
				_mediaMode = fileTypes.VIDEO;
				break;
			}
		}
		/**
		 * returns the current folder name
		 * @method getCurrentFolderName
		 * @public
		 * @return {Object} Folder object with title and ID.
		 */
		function getCurrentFolderName() {
			var currentFolderName = {'title' : _parentID[_parentID.length - 1].id, 'id' : _parentID[_parentID.length - 1].id, 'childCount' : _parentID[_parentID.length - 1].childCount};
			return currentFolderName;
		}
		/**
		 * returns the current folder/file full path
		 * @method getCurrentFolderFullyQualifiedName
		 * @public
		 * @param {menuItem} Current highlighted item
		 * @return {string} complete url of the current item.
		 */
		function getCurrentFolderFullyQualifiedName(menuItem) {
			return menuItem.item.resourceUrl;
		}
		/**
		 * sets the file system back to the root path
		 * @method rewindToBaseFolder
		 * @public
		 */
		function rewindToBaseFolder() {
			hasVisited = false;
		}
		/**
		 * decides whether the device is used for WHPVR or not based on the device manufacturer.
		 * @method isNotWHPVRdevice
		 * @private
		 * @return {boolen} true if device is not WHPVR.
		 */
		function isNotWHPVRdevice(device) {
			//check if manufacturer is not "nagra" to avoid WHPVR devices in DLNA list.
			if (device.manufacturer && device.manufacturer.toLowerCase() !== DEFAULT_DEVICE_MANUFACTURER) {
				return true;
			} else {
				return false;
			}
		}
		/**
		 * returns the device name and the device object
		 * @method getAvailableDevices
		 * @private
		 * @return {Object} An Array object with device details
		 */
		function getAvailableDevices() {
			var availableDevices = $N.platform.media.UPnP.getDevices(),
				options = [],
				i,
				availableDeviceLength = availableDevices.length;
			if (availableDeviceLength > 0) {
				for (i = 0; i < availableDeviceLength; i++) {
					if (isNotWHPVRdevice(availableDevices[i])) {
						options.push({
							name: availableDevices[i].friendlyName,
							device: availableDevices[i]
						});
					}
				}
			}
			return options;
		}
		/**
		 * method that is invoked from Portal once Home Networking is clicked.
		 * @method showDeviceList
		 * @param {optionSelectedCallback} callback when option is selected,{popUpTitle} title for pop up,{popUpMessage} message for pop up
		 * @public
		 */
		function showDeviceList(optionSelectedCallback, popUpTitle, popUpMessage) {
			var title = popUpTitle,
				message =  popUpMessage,
				options = getAvailableDevices(),
				dialog;

			if (options.length > 1) {
				_deviceListDialog = new $N.apps.dialog.ConflictDialogue("dlnaDialogue", title, message,  options, optionSelectedCallback, null, false);
				_deviceListDialog.setExitCallback(function () {});

				$N.app.DialogueHelper.displayDialogue(_deviceListDialog,
						$N.app.DialogueHelper.DLNA,
						ONE_MINUTE);
			} else if (options.length === 1) {
				optionSelectedCallback(options[0]);
			}
		}
		/**
		 * method that is invoked from Portal once a device is clicked from the List of devices..
		 * @method setDeviceParameters
		 * @param {item} the item that is selected from the list of devices.
		 * @public
		 */
		function setDeviceParameters(item) {
			_currentDevice = item.device;
			_deviceUdn = item.device.udn;
			_mediaName = item.name;
		}
		/**
		 * this method returns the thumbnail url available with the DLNA serevr or returns the default thumbnail.
		 * @method getThumbnailUrl
		 * @public
		 * @param {menuItem} Current highlighted item
		 * @return {string} The thumbnail uri or the default thumbnail uri.
		 */
		function getThumbnailUrl(menuItem) {
			return "./images/" + _mediaModeThumbnail + ".png";
		}

		/**
		 * returns the actaul image url of the highlighted menu item
		 * @method getActualImageUrlForPreview
		 * @param {menuItem} Current Menu Item
		 * @param {callback} callback.
		 */
		function getActualImageUrlForPreview(menuItem, callback) {
			var fullyQualifiedUrl = getCurrentFolderFullyQualifiedName(menuItem),
				metaData = getMediaMetadata(fullyQualifiedUrl, "Images", menuItem),
				isLandscape = null;
			if (metaData.itemDetails[0].width && metaData.itemDetails[0].height) {
				if (parseInt((metaData.itemDetails[0].width), 10) > parseInt((metaData.itemDetails[0].height), 10)) {
					isLandscape = true;
				} else {
					isLandscape = false;
				}
			}
			callback(metaData.itemDetails[0].albumArtUri, isLandscape);
		}

		/**
		 * @method clearImageLoadTimer
		 */
		function clearImageLoadTimer() {
			return null;
		}

		function initialiseLanguageBundle() {
			$N.apps.core.Language.adornWithGetString($N.app.DlnaHelper);
		}

		/**
		 * event registration for DLNA device lost event.
		 * @method registerDeviceLostEvent
		 * @public
		 */
		function subscribeToDeviceLostEvent(onDlnaDeviceLost) {
			CCOM.HomeNetworking.addEventListener('onDeviceLost', onDlnaDeviceLost, false);
		}
		/**
		 * event unsubscription for DLNA device lost event.
		 * @method unSubscribeToDeviceLostEvent
		 * @public
		 */
		function unSubscribeToDeviceLostEvent(onDlnaDeviceLost) {
			CCOM.HomeNetworking.removeEventListener("onDeviceLost", onDlnaDeviceLost, false);
		}
		/**
		 * event registration for DLNA getDevicesOk event.
		 * @method registerGetDevicesOkEvent
		 * @public
		 */
		function registerGetDevicesOkEvent(onGetDevicesOK) {
			CCOM.HomeNetworking.addEventListener('getDevicesOK', onGetDevicesOK, false);
		}
		/**
		 * hides the DLNA dialog and sets the dialog object back to null.
		 * @method hideDlnaDeviceListDialog
		 * @public
		 */
		function hideDlnaDeviceListDialog() {
			if (_deviceListDialog) {
				$N.apps.dialog.DialogManager.hideDialog(_deviceListDialog);
				_deviceListDialog = null;
			}
		}
		/**
		 * returns a boolean which says the USB content are still getting loaded or not (DLNA will return false in all cases.)
		 * @method isMediaContentLoading
		 * @return {boolean} false
		 */
		function isMediaContentLoading() {
			return false;
		}
		return {
			initialise: initialiseLanguageBundle,
			getFolderContent: getFolderContent,
			showDeviceList : showDeviceList,
			navigateToParentFolder: navigateToParentFolder,
			getPlayList: getPlayList,
			getMediumName: getMediumName,
			getMediaMetadata: getMediaMetadata,
			setActiveFileSystemMode: setActiveFileSystemMode,
			getCurrentFolderName: getCurrentFolderName,
			getCurrentFolderFullyQualifiedName: getCurrentFolderFullyQualifiedName,
			rewindToBaseFolder: rewindToBaseFolder,
			setDeviceParameters: setDeviceParameters,
			getThumbnailUrl: getThumbnailUrl,
			navigateToSubFolder: navigateToSubFolder,
			getAvailableDevices: getAvailableDevices,
			subscribeToDeviceLostEvent: subscribeToDeviceLostEvent,
			unSubscribeToDeviceLostEvent: unSubscribeToDeviceLostEvent,
			registerGetDevicesOkEvent: registerGetDevicesOkEvent,
			hideDlnaDeviceListDialog: hideDlnaDeviceListDialog,
			isMediaContentLoading: isMediaContentLoading,
			clearImageLoadTimer: clearImageLoadTimer,
			getActualImageUrlForPreview: getActualImageUrlForPreview
		};
	}());

}($N || {}));