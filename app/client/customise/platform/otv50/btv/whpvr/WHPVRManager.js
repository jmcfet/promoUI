/**
 * Singleton instance to assist in PVR functionality.
 * API: http://10.0.52.93:8080/otvdocs/CCOM5.1.2/OpenTV5%20CCOM%20Documentation.html
 * The related data structure:
 * HNDevice: http://10.0.52.93:8080/otvdocs/CCOM5.1.2/Support/hnproxy_newstyle0000.html#HNDevice_Object
 * HNContent: http://10.0.52.93:8080/otvdocs/CCOM5.1.2/Support/hnproxy_newstyle0000.html#HNContent_Object
 * Home Networking Scheduler: http://10.0.52.93:8080/otvdocs/CCOM5.1.2/Support/hnscheduler_newstyle0000.html
 * @class $N.platform.btv.WHPVRManager
 * @singleton
 *
 * @requires $N.apps.core.Log
 * @requires $N.platform.system.Preferences
 */
/*global CCOM, WHPVRScheduler, WHPVRDeviceManager*/

var $N = $N || {};
$N.platform = $N.platform || {};
$N.platform.btv = $N.platform.btv || {};

$N.platform.btv.WHPVRManager = (function () {
	var log = new $N.apps.core.Log("WHPVR", "WHPVRManager"),
		deviceManager =  null,
		localServerName = null,
		localServerUdn = null,
		currentRecordServerUdn = null,
		whpvrServers = [],
		eventListeners = {},
		bEnabled = false,
		HNEnableDmsPath = "/users/preferences/homeNetworking/enableDms",
		HNEnableCdsUrlPath = "/users/preferences/homeNetworking/enableCdsUrl",
		HNEnablePvrPath = "/system/opentv/homeNetworking/dmscds/plugins/pvr/enabled",
		HNEnableLTPath = "/system/opentv/homeNetworking/dmscds/plugins/liveTuner/enabled",
		HNEnableEpgPath = "/system/opentv/homeNetworking/dmscds/plugins/epg/enabled",
		HNEnableNowPath = "/system/opentv/homeNetworking/dmscds/plugins/nowPlaying/enabled",
		HNEnableDMPath = "/system/opentv/homeNetworking/dmscds/plugins/diskmedia/enabled";

	function isEnabled() {
		return bEnabled;
	}

	/**
	 * @method getLocalName
	 * @return {String} the name of local WHPVR server
	 */
	function getLocalServerName() {
		if (!localServerName) {
			localServerName = $N.platform.system.Preferences.get($N.app.constants.DMS_NAME_CONFIG_PATH, true);
			if (!localServerName) {
				$N.platform.system.Preferences.set($N.app.constants.DMS_NAME_CONFIG_PATH, $N.app.constants.DMS_DEFAULT_NAME, true);
				localServerName = $N.app.constants.DMS_DEFAULT_NAME;
			}
		}
		return localServerName;
	}

	/**
	 * @method updateEventCallback
	 * @private
	 */
	function updateEventCallback(event, parameters) {
		log("updateRecordingsCallback", "enter");
		if (eventListeners[event]) {
			eventListeners[event].forEach(function (listener) {
				listener(event, parameters);
			});
		}
		log("updateRecordingsCallback", "exit");
	}

	/**
	 * @method getLocalServerUdn
	 * @return {String} the udn string of local WHPVR server
	 */
	function getLocalServerUdn() {
		if (!localServerUdn) {
			localServerUdn = "uuid:" + $N.platform.system.Preferences.get($N.app.constants.DMS_UDN_CONFIG_PATH, true);
		}
		return localServerUdn;
	}

	function setWHPVREnable() {
		log("setWHPVREnable", "setWHPVREnable");
		if (bEnabled) {
			return;
		}
		$N.platform.system.Preferences.set(HNEnableDmsPath, "true", true);
		$N.platform.system.Preferences.set(HNEnableCdsUrlPath, "true", true);
		$N.platform.system.Preferences.set(HNEnablePvrPath, true, true);
		$N.platform.system.Preferences.set(HNEnableLTPath, true, true);
		$N.platform.system.Preferences.set(HNEnableEpgPath, true, true);
		$N.platform.system.Preferences.set(HNEnableNowPath, true, true);
		$N.platform.system.Preferences.set(HNEnableDMPath, true, true);
		$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_WHPVR_SWITCH,
			$N.app.DialogueHelper.getString("WHPVRSwitchOnTitle"),
			$N.app.DialogueHelper.getString("WHPVRSwitchOnMessage")
			);
	}

	function setWHPVRDisable() {
		log("setWHPVRDisable", "setWHPVRDisable");
		if (deviceManager) {
			deviceManager.release();
		}
		deviceManager = null;
		localServerName = null;
		localServerUdn = null;
		$N.platform.system.Preferences.set(HNEnableDmsPath, "false", true);
		$N.platform.system.Preferences.set(HNEnableCdsUrlPath, "false", true);
		$N.platform.system.Preferences.set(HNEnablePvrPath, false, true);
		$N.platform.system.Preferences.set(HNEnableLTPath, false, true);
		$N.platform.system.Preferences.set(HNEnableEpgPath, false, true);
		$N.platform.system.Preferences.set(HNEnableNowPath, false, true);
		$N.platform.system.Preferences.set(HNEnableDMPath, false, true);
		bEnabled = false;
	}

	/**
	 * @method getCurrentRecordServer
	 * @return {String} the name of local("") or some WHPVR server("uuid:xxx").
	 */
	function getCurrentRecordServer() {
		if (!currentRecordServerUdn) {
			currentRecordServerUdn = $N.platform.system.Preferences.get($N.app.constants.RECORD_SERVER_UDN);
		}
		return currentRecordServerUdn;
	}

	/**
	 * @method setCurrentRecordServer
	 * @param {String} the name of local("") or some WHPVR server("uuid:xxx").
	 * @return {Boolean} success or fail.
	 */
	function setCurrentRecordServer(deviceUdn) {
		if (!deviceUdn) {
			deviceUdn = localServerUdn;
		}
		if (deviceUdn.length === 0 || deviceUdn.substr(0, 5) === "uuid:") {
			currentRecordServerUdn = deviceUdn;
			$N.platform.system.Preferences.set($N.app.constants.RECORD_SERVER_UDN, currentRecordServerUdn);
			return true;
		}
		return false;
	}

	/**
	 * @method setLocalName
	 * @param localName {String} the name of local WHPVR server
	 */
	function setLocalServerName(localName) {
		localServerName = localName;
		$N.platform.system.Preferences.set($N.app.constants.DMS_NAME_CONFIG_PATH, localServerName, true);
	}

	return {
		/**
		 * @method init
		 */
		init: function () {
			log("init", "enter");
			$N.apps.util.EventManager.subscribe("WHPVREnabled", setWHPVREnable, $N.platform.btv.WHPVRManager);
			$N.apps.util.EventManager.subscribe("WHPVRDisabled", setWHPVRDisable, $N.platform.btv.WHPVRManager);
			log("init", "WHPVR_FEATURE " + $N.platform.system.Preferences.get($N.app.constants.WHPVR_FEATURE));
			if ($N.platform.system.Preferences.get($N.app.constants.WHPVR_FEATURE) === "true") {
				deviceManager = new $N.platform.btv.WHPVRDeviceManager($N.platform.btv.WHPVRManager, updateEventCallback);
				deviceManager.initialise();
				localServerName = getLocalServerName();
				localServerUdn = getLocalServerUdn();
				bEnabled = true;
			}
			log("init", "exit");
		},

		/**
		 * Saves the bookmark information for a recording.
		 * @method saveBookmark
		 * @chainable
		 * @param {Object} task
		 * @param {Number} bmPosition (player position)
		 */
		saveBookmark: function (task, bmPosition) {
			if (isEnabled() && task && task.whpvrDevice) {
				task.whpvrDevice.saveBookmark(task, bmPosition);
			}
		},

		isEnabled: isEnabled,
		/**
		 * @method getWHPVRServers
		 * @return {Array} the array of WHPVR servers
		 */
		getWHPVRServers: function () {
			return isEnabled() ? deviceManager.getAllServers() : [];
		},

		/**
		 * @method getAllRecordingsFromWHPVRServers
		 * @return {Array} the array of WHPVR recordings
		 */
		getAllRecordingsFromWHPVRServers: function () {
			return isEnabled() ? deviceManager.getAllRecordings() : [];
		},

		/**
		 * @method getAllRecordingsByFolderName
		 * @param {String} folderName
		 * @return {Array} the array of WHPVR recordings
		 */
		getAllRecordingsByFolderName: function (folderName) {
			return isEnabled() ? deviceManager.getRecordingsByFolderName(folderName) : [];
		},

		getAllSchedulesFromWHPVRServers: function () {
			return isEnabled() ? deviceManager.getAllSchedules() : [];
		},

		requestEventRecording: function (deviceUdn, metaData) {
			if (isEnabled()) {
				deviceManager.requestEventRecording(deviceUdn, metaData);
			}
		},

		requestSeriesRecording: function (deviceUdn, metaData) {
			if (isEnabled()) {
				deviceManager.requestSeriesRecording(deviceUdn, metaData);
			}
		},

		deleteSeriesSchedule: function (deviceUdn, seriesId) {
			if (isEnabled()) {
				deviceManager.deleteSeriesSchedule(deviceUdn, seriesId);
			}
		},

		deleteSingleSchedule: function (deviceUdn, event) {
			if (isEnabled()) {
				deviceManager.deleteSingleSchedule(deviceUdn, event);
			}
		},

		deleteTask: function (task) {
			if (isEnabled() && task && task.whpvrDevice) {
				task.whpvrDevice.deleteTask(task);
			}
		},

		getTaskByEvent: function (deviceUdn, event) {
			return isEnabled() ? deviceManager.getTaskByEvent(deviceUdn, event) : null;
		},

		updateTask: function (task, reqMetaData) {
			if (isEnabled() && task && task.whpvrDevice) {
				task.whpvrDevice.updateTask(task, reqMetaData);
			}
		},

		/**
		 * @method getLocalName
		 * @return {String} the name of local WHPVR server
		 */
		getLocalName: getLocalServerName,

		/**
		 * @method setLocalName
		 * @param localName {String} the name of local WHPVR server
		 */
		setLocalName: setLocalServerName,

		/**
		 * @method getCurrentRecordServer
		 * @return {String} the name of local("") or some WHPVR server("uuid:xxx").
		 */
		getCurrentRecordServer: getCurrentRecordServer,

		getLocalServerUdn: getLocalServerUdn,

		/**
		 * @method setCurrentRecordServer
		 * @param {String} the name of local("") or some WHPVR server("uuid:xxx").
		 * @return {Boolean} success or fail.
		 */
		setCurrentRecordServer: setCurrentRecordServer,

		/**
		 * Registers a callback function to be invoked when the specified event is fired
		 * @method addEventListener
		 * @chainable
		 * @param {String} event the name of the event to listen for
		 * @param {Function} callback the function to be invoked
		 */
		addEventListener: function (event, callback) {
			if (event && callback) {
				if (!eventListeners[event]) {
					eventListeners[event] = [];
				}
				eventListeners[event].push(callback);
			}
		},

		/**
		 * Removes a previously registered event listener identified by the given
		 * name and callback
		 * @method removeEventListener
		 * @param {String} event the name of the event you are interested in listening to
		 * @param {Function} callback the function to execute when the event is fired
		 */
		removeEventListener: function (event, callback) {
			if (event && callback && eventListeners[event]) {
				eventListeners[event] = eventListeners[event].filter(function (listener) {
					return (listener !== callback);
				});
			}
		},

		/**
		 * Method for judge record server is local or not
		 * @method isLocalRecordServer
		 * @return {Boolean} true if is local server, otherwise is remote server.
		 */
		isLocalRecordServer: function () {
			var i,
				isLocal = false,
				currentServerUdn,
				whpvrServers;

			if (!isEnabled()) {
				return true;
			}
			currentServerUdn = getCurrentRecordServer();
			whpvrServers = deviceManager.getAllServers();
			if (currentServerUdn === undefined
					|| currentServerUdn.length === 0
					|| currentServerUdn === localServerUdn
					|| !whpvrServers.length) {
				isLocal = true;
			}
			log("isLocalRecordServer: ", currentServerUdn + " : " + isLocal);

			return isLocal;
		},

		/**
		 * Method for judge recorded server is valid or not
		 * @method isRemoteRecordServerValid
		 * @return {Boolean} true if is recorded remote server is valid, otherwise remote server doesn't exist.
		 * */
		isRemoteRecordServerValid: function () {
			var i,
				isRemoteServerValid = false,
				currentServerUdn,
				whpvrServers;

			if (!isEnabled()) {
				return false;
			}
			currentServerUdn = getCurrentRecordServer();
			whpvrServers = deviceManager.getAllServers();
			for (i = 0; i < whpvrServers.length; i++) {
				if (currentServerUdn === whpvrServers[i].udn) {
					isRemoteServerValid = true;
					break;
				}
			}

			return isRemoteServerValid;
		},

		/**
		 * Method for judge if has any remote servers
		 * @method hasRemoteServers
		 * @return {Boolean} true if is has one remote server at least, otherwise remote server doesn't exist.
		 * */
		hasRemoteServers: function () {
			var whpvrServers;
			if (!isEnabled()) {
				return false;
			}
			whpvrServers = deviceManager.getAllServers();
			return (whpvrServers.length > 0);
		},

		/**
		 * @method getCurrentRecordServerName
		 * @return {String} the name of recorded server name
		 */
		getCurrentRecordServerName : function () {
			var whpvrServers,
				serverLength,
				currentUdn,
				i,
				serverName = "";
			if (!isEnabled()) {
				return "";
			}
			whpvrServers = deviceManager.getAllServers();
			serverLength = whpvrServers.length;
			currentUdn = getCurrentRecordServer();

			for (i = 0; i < serverLength; i++) {
				if (currentUdn === whpvrServers[i].udn) {
					serverName = whpvrServers[i].friendlyName;
					return serverName;
				}
			}
			return serverName;
		},

		/**
		 * @method getTVNameByUdn
		 * @param {String} udn
		 * @return {String} the name of remote tv name
		 */
		getTVNameByUdn: function (udn) {
			var whpvrServers,
				serverLength,
				serverName = "",
				i;
			if (!isEnabled()) {
				return "";
			}
			whpvrServers = deviceManager.getAllServers();
			serverLength = whpvrServers.length;
			serverName = "";
			for (i = 0; i < serverLength; i++) {
				if (udn === whpvrServers[i].udn) {
					serverName = whpvrServers[i].friendlyName;
					break;
				}
			}
			return serverName;
		},

		/**
		 * @method getTVNameByRecording
		 * @param {Object} recording
		 * @return {String} the name of remote tv name
		 */
		getTVNameByRecording: function (recording) {
			if (isEnabled() && recording.whpvrDevice && recording.whpvrDevice.udn) {
				return this.getTVNameByUdn(recording.whpvrDevice.udn);
			}
			return "";
		},

		searchByCriteria: function (criteria, properties, dataCallback, finishedCallback, exactMatch, sort) {
			if (isEnabled()) {
				deviceManager.searchByCriteria(criteria, properties, dataCallback, finishedCallback, exactMatch, sort);
			}
		},

		searchByActorsDirector: function (keyword, properties, dataCallback, finishedCallback, exactMatch, sort) {
			if (isEnabled()) {
				deviceManager.searchByActorsDirector(keyword, properties, dataCallback, finishedCallback, exactMatch, sort);
			}
		},

		setRecordingRequestConflictsCallback: function (callback) {
			$N.platform.btv.WHPVRManager._conflictsCallback = callback;
		}
	};
}());
