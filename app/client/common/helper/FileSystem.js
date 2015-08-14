/*global console*/

/**
 * @author Raghunandan Balasubramaniam
 * FileSystem class mimics the file system on a removable device
 * like a USB HDD, eSATA disk etc. It can be used to cache the filesystem
 * contents when the removable device is inserted and later browse the
 * contents without querying the device again. Please note that this
 * implementation assumes that the device is mounted read-only. If there
 * is a possibility that the device can be written upon, this class may
 * not be synced up w.r.t. the contents on the device.
 * This class maintains a JSON representation of the file system as files
 * are added to it. e.g.
 * Step1. Add FolderA/file1.txt
 * Step2. Add FolderA/file2.txt
 * Step3. Add FolderA/FolderB/file3.txt
 * This results in the following internal representation of the file system
 * ROOT = {
 *      FolderA: {
 *          file1.txt: "file1.txt",
 *          file2.txt: "file2.txt",
 *          FolderB: {
 *              file3.txt: "file3.txt"
 *          }
 *      }
 * }
 * This class is able to handle files and folders which have spaces in their
 * names. This class also handles files and folders which have a mix of CAPS
 * and lower case letters in their name.
 * @class $N.app.FileSystem
 * @static
 */
(function ($N) {
	"use strict";
	function FileSystem() {
		//Object that represents the logical root of the file system. This
		//object maps to the root mount path that is set.
		this.ROOT = {};
		//Initialize the root mount path.
		this.ROOT_MOUNT_PATH = "";
		//Set the object that corresponds to the root of the file system to 'ROOT'
		this.CurrentFileObj = this.ROOT;
		//An array that maintains a stack of folders traversed.
		this.FileObjStack = [];
		//Set the current folder to 'mnt' to start with.
		this.currentFolderName = "mnt";
		//Used to print tabs between directory entries.
		this.tab_spacing = "";
	}
	var proto = FileSystem.prototype;
	proto.SPACING = "    ";//A constant that represents the spaces used to
							//indent output when printing the file-system
							//structure.

	/**
	 * Private method that sorts two strings irrespective of the case.(Normal javascript sort is Case sensitive.)
	 * @method  _compareSort
	 * @private
	 * @param {string} firstString- first String to compare,
	 * @param {string} secondString - second string to compare.
	 * @return {array} - sorted array
	 */
	proto._compareSort = function (firstString, secondString) {
		var firstTitle = String(firstString).toLowerCase(),
			secondTitle = String(secondString).toLowerCase();
		return firstTitle.localeCompare(secondTitle);
	};
	/**
	 * Private method that returns the list of sub-folders in the
	 * current folder. The (sub)folder list is sorted.
	 * @method  _getImmediateSubfolders
	 * @private
	 * @param {Object} fileObj  The JSON object that corresponds to the
	 *                          current folder.
	 * @return {Array}          An array that contains (sub)folder objects.
	 */
	proto._getImmediateSubfolders = function (fileObj) {
		var SubFolders = [],
			SubFolderIndex = 0,
			i;
		//For each property in the object
		for (i in fileObj) {
			//If value of the property is not a string, i.e. the value
			//corresponds to a folder object.
			if (typeof (fileObj[i]) !== "string") {
				//Add folder object to sub-folder array list.
				SubFolders[SubFolderIndex++] = i;
			}
		}
		SubFolders.sort(this._compareSort);  //Sort the sub-folder list.
		return (SubFolders);
	};

	/**
	 * Private method that returns the list of files in the current
	 * folder. The file list is sorted.
	 * @method  _getImmediateFiles
	 * @private
	 * @param {Object} fileObj  The JSON object that corresponds to the
	 *                          current folder.
	 * @return {Array}          An array that contains filenames.
	 */
	proto._getImmediateFiles = function (fileObj) {
		var FileList = [],
			FileIndex = 0,
			i;
		//For each property in the object
		for (i in fileObj) {
			//If value of the property is a string, i.e. the value
			//corresponds to a file.
			if (typeof (fileObj[i]) === "string") {
				//Add file to file list
				FileList[FileIndex++] = i;
			}
		}
		FileList.sort(this._compareSort);    //Sort the file list.
		return (FileList);
	};

	/**
	 * Private method that returns the folder object that
	 * corresponds to the folder name passed in. In case of exception throws
	 * a JSON object that contains exception name & message
	 * @method  _getImmediateSubfolderObject
	 * @private
	 * @param {Object} fileObj      The JSON object that corresponds to the
	 *                              current folder.
	 * @param {String} folderName   The name of the folder for which the
	 *                              folder object is requested.
	 * @return {Object}             JSON object that corresponds to folder
	 *                              being requested
	 */
	proto._getImmediateSubfolderObject = function (fileObj, folderName) {
		var i;
		//For each property in the object
		for (i in fileObj) {
			//If value of the property is a object (folder) and the folder
			//name matches the property.
			if ((typeof (fileObj[i]) === "object") && (i === folderName)) {
				return (fileObj[i]);
			}
		}
		throw {
			name: "FileSystemException",
			message: "Cannot get folder object for folder " + folderName
		};
	};

	/**
	 * Private method that prints the contents of the directory
	 * recursively. This method is useful for understanding the structure
	 * of the file system on the removable device.
	 * @method  _printDirectory
	 * @private
	 * @param {Object} fileObj          The JSON object that corresponds to
	 *                                  the folder whose contents have to be
	 *                                  printed recursively.
	 * @param {Boolean} outputToConsole Indicates if the directory output has
	 *                                  to be printed to the console or to the
	 *                                  directory buffer
	 * @param {Array} DirectoryBuffer   Optional parameter that needs to be
	 *                                  passed if the directory output needs
	 *                                  to be printed to a buffer. Each
	 *                                  element in the buffer array
	 *                                  corresponds to a that could be
	 *                                  printed to the console.
	 */
	proto._printDirectory = function (fileObj, outputToConsole, DirectoryBuffer) {
		var i;
		//For each property in the object
		for (i in fileObj) {
			if (fileObj.hasOwnProperty(i)) {
			//If it is a file
				if (typeof (fileObj[i]) === "string") {
					if (outputToConsole === true) {
						console.log(this.tab_spacing + i);
					} else {
						DirectoryBuffer.push(this.tab_spacing + i);
					}
				} else {	//traverse through a sub-folder
					if ((this.tab_spacing === "") || (this.tab_spacing === undefined)) {
						this.tab_spacing = this.SPACING;
					}
					if (outputToConsole === true) {
						console.log(this.tab_spacing + i);
					} else {
						DirectoryBuffer.push(this.tab_spacing + i);
					}
					this.tab_spacing = this.SPACING + this.tab_spacing;
					//Call _printDirectory recursively to print sub-folder
					//contents
					if (outputToConsole === true) {
						this._printDirectory(fileObj[i], true);
					} else {
						this._printDirectory(fileObj[i], false, DirectoryBuffer);
					}
				}
			}
		}
		this.tab_spacing = this.tab_spacing.slice(this.SPACING.length, this.tab_spacing.length);
	};

	/**
	 * Public method that returns the contents of the directory
	 * recursively into a buffer.
	 * @method  getFileSystemRecursiveContents
	 * @return {Array}  Array of strings that corresponds to each line of the
	 *                  directory output.
	 */
	proto.getFileSystemRecursiveContents = function () {
		var DirectoryBuffer = [];
		this._printDirectory(this.ROOT, false, DirectoryBuffer);
		return (DirectoryBuffer);
	};

	/**
	 * Public method that adds a file to the filesystem JSON representation
	 * @method  addFileToFileSystem
	 * @param {String} FileString   The string that corresponds to the
	 *                              full path and name of the file to be added
	 *                              to the file system JSON representation.
	 */
	proto.addFileToFileSystem = function (FileString) {
		var Parent = this.ROOT,
			fileElement,
			i;
		FileString = FileString.trim(); //Trim any leading and trailing spaces
		//Remove the root mount path from the FQ name of the file
		FileString = FileString.replace(this.ROOT_MOUNT_PATH + "/", "");
		//Tokenize the FQ file name using separator '/' to get sub-folders
		fileElement = FileString.split("/");

		//For all sub-folders
		for (i = 0; i < (fileElement.length - 1); i++) {
			//Create a property if it doesn't exist
			if (typeof Parent[fileElement[i]] === "undefined") {
				//Set the value of the property to be an empty object
				Parent[fileElement[i]] = {};
			}
			//Moving to a folder at the next level so set the current
			//property-value as a parent object.
			Parent = Parent[fileElement[i]];
		}
		//For the final element (file), just set the property and its value to
		//be the same i.e. file-name.
		Parent[fileElement[i]] = fileElement[i];
	};

	/**
	 * Public method that adds a list of files to the filesystem JSON
	 * representation
	 * @method  addFilesToFileSystem
	 * @param {Array} FileList  An array of strings. Each string corresponds
	 *                          to the full path + name of the file to be
	 *                          added to the filesystem JSON representation.
	 */
	proto.addFilesToFileSystem = function (FileList) {
		var i;
		//For all files in the file list
		for (i = 0; i < FileList.length; i++) {
			this.addFileToFileSystem(FileList[i]);
		}
	};

	/**
	 * Public method that re-initializes the filesystem JSON representation.
	 * This is required in case you want to rebuild the file system internal
	 * JSON representation when the removable device is removed and attached
	 * again.
	 * @method  reinitializeFileSystem
	 */
	proto.reinitializeFileSystem = function () {
		this.ROOT = {};
		this.currentFolderName = "mnt";
		this.CurrentFileObj = this.ROOT;
		this.FileObjStack = [];
	};

	/**
	 * Public method that goes back up to the root of the filesystem.
	 * Essentially this method will traverse up the folder structure until
	 * it reaches the root.
	 * @method  rewindFileSystem
	 */
	proto.rewindFileSystem = function () {
		while (this.FileObjStack.length >= 1) {
			this.gotoParentFolder();
		}
	};
	/**
	 * Public method that is used to print the file system contents on the
	 * console.
	 * @method  printFileSystemOnConsole
	 */
	proto.printFileSystemOnConsole = function () {
		this._printDirectory(this.ROOT, true);
	};

	/**
	 * Public method that returns the contents of the folder whose name
	 * is passed as a parameter. Note that the contents returned will be
	 * for files and folders present in the current folder. This method will
	 * not recurse and return the contents of the subfolders in the current
	 * folder. If folder contents are requested for folder other than current
	 * folder throws an exception object.
	 * @method  getFolderContents
	 * @param {String} folderName               The name of the folder for
	 *                                          which the folder contents
	 *                                          are requested.
	 * @param {Function} FilterFilesCallback    A function (callback) that is
	 *                                          called by this method each
	 *                                          time it encounters a file in
	 *                                          the current folder. If the
	 *                                          callback returns 'true', the
	 *                                          file will be added to the
	 *                                          folder contents that is
	 *                                          returned by this method.
	 * @return {Array}                          An array of JSON objects that
	 *                                          corresponds to the contents
	 *                                          of the current folder.
	 */
	proto.getFolderContents = function (FolderName, filterFilesCallback) {
		var SubFolders = [],
			FileList = [],
			FolderContents = [],
			FolderElements = 0,
			i;

		//If requesting folder contents for folder other than current fodler.
		if (this.currentFolderName !== FolderName) {
			throw {
				name: "FileSystemException",
				message: "Asking for contents of directory other than current directory"
			};
		} else {
			//Get sub-folder list
			SubFolders = this._getImmediateSubfolders(this.CurrentFileObj);
			//For all sub-folders
			for (i = 0; i < SubFolders.length; i++) {
				//Store sub-folders in array that is to be returned
				FolderContents.push(
					{
						"Type": "Folder",
						"Name": SubFolders[i]
					}
				);
			}
			FileList = this._getImmediateFiles(this.CurrentFileObj);
			//For all files
			for (i = 0; i < FileList.length; i++) {
				//If not filter callback is defined or if it returns true
				if ((filterFilesCallback === undefined) || (filterFilesCallback(FileList[i]) === true)) {
					//Store file in array that is to be returned
					FolderContents.push(
						{
							"Type": "File",
							"Name": FileList[i]
						}
					);
				}
			}
			return (FolderContents);
		}
	};

	/**
	 * Public method that returns true if the object passed it it corresponds
	 * to the internal JSON object representation of a folder.
	 * @method  isFolder
	 * @param {Object} FolderContentObject  The JSON object that corresponds
	 *                                      to the file system element that
	 *                                      needs to be evaluated as a folder
	 * @return {Boolean}                    Returns 'true' if the input object
	 *                                      is a folder.
	 */
	proto.isFolder = function (FolderContentObject) {
		return ((FolderContentObject.Type === "Folder") ? true : false);
	};

	/**
	 * Public method that returns true if the object passed in corresponds
	 * to the internal JSON object representation of a file.
	 * @method  isFolder
	 * @param {Object} FolderContentObject  The JSON object that corresponds
	 *                                      to the file system element that
	 *                                      needs to be evaluated as a file
	 * @return {Boolean}                    Returns 'true' if the input object
	 *                                      is a file.
	 */
	proto.isFile = function (FolderContentObject) {
		return ((FolderContentObject.Type === "File") ? true : false);
	};

	/**
	 * Public method that returns the name of the file system element passed
	 * to it. If the file element object passed is neither a file or a
	 * folder, throws an exception.
	 * @method  getName
	 * @param {Object} FolderContentObject  The JSON object that corresponds
	 *                                      to the file system element whose
	 *                                      name has to be returned.
	 * @return {String}                     Returns the name of the file
	 *                                      element object.
	 */
	proto.getName = function (FolderContentObject) {
		if ((FolderContentObject.Type === "File") || (FolderContentObject.Type === "Folder")) {
			return (FolderContentObject.Name);
		} else {
			throw {
				name: "FileSystemException",
				message: "Undefined file system element"
			};
		}
	};

	/**
	 * Public method that prints the type and name of each file system element
	 * (folder or file) present in the file element array passed to it. If the
	 * file system element passed is not a array/object it throws an exception
	 * object
	 * @method  printFolderContents
	 * @param {Array} Folder    An Array of JSON objects each element of which
	 *                          could be a file or folder.
	 */
	proto.printFolderContents = function (Folder) {
		var Element = {},
			i;
		if (typeof (Folder) === "object") {
			for (i = 0; i < Folder.length; i++) {
				console.log((i + 1) + ": Type = " + Folder[i].Type + ", Name = " + Folder[i].Name);
			}
		} else {
			throw {
				name: "FileSystemException",
				message: "Cannot print contents of folder"
			};
		}
	};

	/**
	 * Set's the current folder to the one passed as parameter. In the
	 * process it pushes the previous folder into a stack so that we can
	 * later retrieve the full path to the current folder. Note that the
	 * folder name passed as a parameter should be a sub-folder of the current
	 * folder. If the folder name passed is not a subfolder of the current
	 * folder throws an exception object.
	 * @method  setCurrentFolderRelative
	 * @param {Array} FolderName    The name of the subfolder within the
	 *                              current folder.
	 */
	proto.setCurrentFolderRelative = function (FolderName) {
		//If folder is subfolder of current folder
		if (this._getImmediateSubfolders(this.CurrentFileObj).indexOf(FolderName) !== -1) {
			try {
				//Push current folder to stack since it becomes parent folder
				this.FileObjStack.push(
					{
						FolderName: this.currentFolderName,
						FolderObj: this.CurrentFileObj
					}
				);
				//Get the JSON corresponding to the sub-folder requested
				this.CurrentFileObj = this._getImmediateSubfolderObject(this.CurrentFileObj, FolderName);
				this.currentFolderName = FolderName;
			} catch (e) {
				console.log(e.name + "-->" + e.message);
			}
		} else {
			throw {
				name: "FileSystemException",
				message: "Cannot set current folder to subfolder not present in current folder"
			};
		}
	};

	/**
	 * Set's the current folder to the one passed as parameter and gets the
	 * contents of the folder in one call.
	 * @method  setCurrentFolderRelativeAndGetContents
	 * @param {Array} FolderName                The name of the subfolder
	 *                                          within the current folder.
	 * @param {Function} FilterFilesCallback    A function (callback) that is
	 *                                          called each time it
	 *                                          encounters a file in the
	 *                                          current folder. If the
	 *                                          callback returns 'true', the
	 *                                          file will be added to the
	 *                                          folder contents that is
	 *                                          returned by this method.
	 * @return {Array}                          An array of JSON objects that
	 *                                          corresponds to the contents of
	 *                                          the folder requested.
	 */
	proto.setCurrentFolderRelativeAndGetContents = function (FolderName, filterFilesCallback) {
		if (this.getCurrentFolderName() !== FolderName) {
			this.setCurrentFolderRelative(FolderName);	//Set the current folder
		}
		//Return the contents of the current folder
		return (this.getFolderContents(FolderName, filterFilesCallback));
	};

	/**
	 * Public method that returns the name of the current folder. Please
	 * note that the name is not fully qualified (does not contain path) to
	 * the current folder.
	 * @method  getCurrentFolderName
	 * @return {String} Returns the name of the current folder.
	 */
	proto.getCurrentFolderName = function () {
		return (this.currentFolderName);
	};

	/**
	 * Public method that returns the name of the parent folder to the current
	 * folder. Please note that the name is not fully qualified (does not
	 * contain path) to the parent folder. If no parent exists to the current
	 * folder, throws an exception object.
	 * @method  getParentFolderName
	 * @return {String} Returns the name of the parent folder.
	 */
	proto.getParentFolderName = function () {
		//If stack of folders is not empty..
		if (this.FileObjStack.length >= 1) {
			return (this.FileObjStack[this.FileObjStack.length - 1].FolderName);
		} else {
			throw {
				name: "FileSystemException",
				message: "No parent exists for current folder. Already at root."
			};
		}
	};

	/**
	 * Public method that returns the fully qualified name (includes path) of
	 * the current folder. If the mount path is not set before calling this
	 * method, throws an exception.
	 * @method  getCurrentFolderFullyQualifiedName
	 * @return {String} Returns the FQ name of the current folder.
	 */
	proto.getCurrentFolderFullyQualifiedName = function () {
		var FullyQualifiedFolderName,
			ParentFolderNames,
			i;
		if (this.ROOT_MOUNT_PATH === "") {
			throw {
				name: "FileSystemException",
				message: "Root mount path not set"
			};
		}
		FullyQualifiedFolderName = this.ROOT_MOUNT_PATH; //Start from ROOT
		//If stack of folders is not empty..
		if (this.FileObjStack.length >= 1) {
			ParentFolderNames = [];
			//Traverse through the stack
			for (i = 1; i < this.FileObjStack.length; i++) {
				//Get the folder names of all parent folders
				ParentFolderNames[i] = this.FileObjStack[i].FolderName;
			}
			//Create a fully qualified folder name by concatenating the
			//folder names
			FullyQualifiedFolderName += ParentFolderNames.join("/");
			//Add the current folder
			FullyQualifiedFolderName += "/" + this.currentFolderName;
			return (FullyQualifiedFolderName);
		} else {
			//Return the mount path
			return (this.ROOT_MOUNT_PATH);
		}
	};

	/**
	 * Public method that returns a list of files in the current folder.
	 * Each element in the list is a fully qualified file name (File Path +
	 * Name).
	 * @method  getFullyQualifiedFileList
	 * @param {Function} FilterFilesCallback    A function (callback) that is
	 *                                          called each time it
	 *                                          encounters a file in the
	 *                                          current folder. If the
	 *                                          callback returns 'true', the
	 *                                          file will be added to the
	 *                                          file list that is returned by
	 *                                          this method.
	 * @return {Array}                          An array of strings that
	 *                                          corresponds to the list
	 *                                          of files in the current
	 *                                          folder.
	 */
	proto.getFullyQualifiedFileList = function (filterFilesCallback) {
		//Get the fully qualified name of the current folder
		var FullyQualifiedFolderName = this.getCurrentFolderFullyQualifiedName(),
			//Get list of files in the current folder
			FileList = this._getImmediateFiles(this.CurrentFileObj),
			FilteredList = [],
			i,
			j;

		for (i = 0, j = 0; i < FileList.length; i++) {
			//Call the filter call back if defined to filter the files of
			//interest to the callee
			if ((filterFilesCallback === undefined) || (filterFilesCallback(FileList[i]) === true)) {
				//Create the fully qualified field name by concatenating the
				//fully qualified current folder name and the file name
				FilteredList[j++] = FullyQualifiedFolderName + "/" + FileList[i];
			}
		}
		return FilteredList;
	};

	/**
	 * Public method that sets the current folder to the parent folder. If
	 * no parent folder exists for current folder, throws an exception object.
	 * @method  gotoParentFolder
	 */
	proto.gotoParentFolder = function () {
				//Get the parent folder object from the stack
		var ParentFolder = this.FileObjStack.pop();

		if (ParentFolder === undefined) {
			throw {
				name: "FileSystemException",
				message: "No parent exists for current folder. Already at root."
			};
		} else {
			this.CurrentFileObj = ParentFolder.FolderObj;
			this.currentFolderName = ParentFolder.FolderName;
		}
	};

	/**
	 * Public method that sets the root mount path. If an empty string is
	 * passed for the root mount path, this method throws an exception.
	 * @method  setRootMountPath
	 * @param {String} RootMountPath    A string that corresponds to the
	 *                                  root path. e.g. if we would add
	 *                                  the following files to the file
	 *                                  system
	 *                                      /mnt/sda1/folder 1/file 1.jpg
	 *                                      /mnt/sda1/folder 1/file 2.mov
	 *                                  we would probably set the root path to
	 *                                  /mnt/sda1 so that we can traverse
	 *                                  through the multimedia contents in
	 *                                  the file system starting from
	 *                                  /mnt/sda1
	 */
	proto.setRootMountPath = function (RootMountPath) {
		if (RootMountPath !== "") {
			this.ROOT_MOUNT_PATH = RootMountPath;
		} else {
			throw {
				name: "FileSystemException",
				message: "Root mount path cannot be empty"
			};
		}
	};

	$N.app = $N.app || {};
	$N.app.FileSystem = FileSystem;
}($N || {}));
