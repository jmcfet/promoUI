
var $N = $N || {};
$N.platform = $N.platform || {};
$N.platform.btv = $N.platform.btv || {};

function WHPVRDeviceManager(controller, updateEventCallback) {
	var log = new $N.apps.core.Log("WHPVR", "WHPVRDeviceManager"),
		getDevicesHandle = null,
		searchFinishedCallback = null,
		whpvrServers = [],
		localServerUdn = controller.getLocalServerUdn();

	/**
	 * @method isLocalSTB
	 * @private
	 * @param device {Object} HNDevice
	 * @return {Boolean}
	 */
	function isLocalSTB(device) {
		if (device.udn === localServerUdn) {
			return true;
		}
		return false;
	}

	/**
	 * @method isWHPVRDevice
	 * @private
	 * @param device {Object} HNDevice
	 * @return {Boolean}
	 */
	function isWHPVRDevice(device) {
		if (device && (device.modelName === "Gateway" && device.modelNumber === "OpenTV 5")) {
			return true;
		}
		return false;
	}

	/**
	 * @method updateWhpvrServers
	 * @private
	 */
	function updateWhpvrServers(upnpDevices) {
		log("updateWhpvrServers", "enter");
		var i,
			j,
			whpvrdevice = null,
			found = false,
			toDelete = null;
		//Filter itself and those without PVR capacity:
		for (i = 0; i < upnpDevices.length; i++) {
			if (isLocalSTB(upnpDevices[i]) || !isWHPVRDevice(upnpDevices[i])) {
				upnpDevices.splice(i, 1);
				i--;
			}
		}
		//remove lost and duplicate servers
		for (j = 0; j < whpvrServers.length; j++) {
			found = false;
			for (i = 0; i < upnpDevices.length; i++) {
				if (upnpDevices[i].udn === whpvrServers[j].udn) {
					found = true;
					break;
				}
			}
			if (!found) {
				toDelete = whpvrServers.splice(j, 1);
				j--;
				toDelete[0].release();
			} else {
				upnpDevices.splice(i, 1);
			}
		}
		for (i = 0; i < upnpDevices.length; i++) {
			whpvrdevice = new $N.platform.btv.WHPVRDevice(upnpDevices[i], updateEventCallback);
			whpvrServers.push(whpvrdevice);
		}
		updateEventCallback("getDevicesOK", whpvrServers);
		log("updateWhpvrServers", "exit");
	}

	function onDeviceFound(e) {
		getDevicesHandle = CCOM.HomeNetworking.getDevices();
	}

	function onDeviceLost(e) {
		getDevicesHandle = CCOM.HomeNetworking.getDevices();
	}

	function getDevicesOK(e) {
		if (getDevicesHandle === e.handle) {
			updateWhpvrServers(e.devices);
		}
	}

	function getDevicesFailed(e) {
	}

	/**
	 * @method checkIfSearchFinished
	 * @private
	 */
	function checkIfSearchFinished() {
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (!whpvrServers[i].isSearchFinished()) {
				break;
			}
		}
		if (searchFinishedCallback && i === numServers) {
			searchFinishedCallback(true);
		}
	}

	function browseContainerOK(event) {
		log("browseContainerOK", "enter");
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].eventNotify('browseContainerOK', event)) {
				break;
			}
		}
		log("browseContainerOK", "exit");
	}

	function browseContainerFailed(event) {
		log("browseContainerFailed", "enter");
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].eventNotify('browseContainerFailed', event)) {
				break;
			}
		}
		log("browseContainerFailed", "exit");
	}

	function deleteObjectOK(event) {
		log("deleteObjectOK", "enter");
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].eventNotify('deleteObjectOK', event)) {
				break;
			}
		}
		log("deleteObjectOK", "exit");
	}

	function deleteObjectFailed(event) {
		log("deleteObjectFailed", "enter");
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].eventNotify('deleteObjectFailed', event)) {
				break;
			}
		}
		log("deleteObjectFailed", "exit");
	}

	function updateObjectOK(event) {
		log("updateObjectOK", "enter");
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].eventNotify('updateObjectOK', event)) {
				break;
			}
		}
		log("updateObjectOK", "exit");
	}

	function updateObjectFailed(event) {
		log("updateObjectFailed", "enter");
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].eventNotify('updateObjectFailed', event)) {
				break;
			}
		}
		log("updateObjectFailed", "exit");
	}

	function searchContainerOK(event) {
		log("searchContainerOK", "enter");
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].eventNotify('searchContainerOK', event)) {
				break;
			}
		}
		checkIfSearchFinished();
		log("searchContainerOK", "exit");
	}

	function searchContainerFailed(event) {
		log("searchContainerFailed", "enter");
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].eventNotify('searchContainerFailed', event)) {
				break;
			}
		}
		checkIfSearchFinished();
		log("searchContainerFailed", "exit");
	}

	function subscribeServiceOK(event) {
		log("subscribeServiceOK", "enter");
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].eventNotify('subscribeServiceOK', event)) {
				break;
			}
		}
		log("subscribeServiceOK", "exit");
	}

	function subscribeServiceFailed(event) {
		log("searchContainerFailed", "enter");
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].eventNotify('subscribeServiceFailed', event)) {
				break;
			}
		}
		log("searchContainerFailed", "exit");
	}

	function updateBookmarkOK(event) {
		log("updateBookmarkOK", "enter");
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].eventNotify('updateBookmarkOK', event)) {
				break;
			}
		}
		log("updateBookmarkOK", "exit");
	}

	function updateBookmarkFailed(event) {
		log("updateBookmarkFailed", "enter");
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].eventNotify('updateBookmarkFailed', event)) {
				break;
			}
		}
		log("updateBookmarkFailed", "exit");
	}

	function browseObjectOK(event) {
		log("browseObjectOK", "enter");
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].eventNotify('browseObjectOK', event)) {
				break;
			}
		}
		log("browseObjectOK", "exit");
	}

	function browseObjectFailed(event) {
		log("browseObjectFailed", "enter");
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].eventNotify('browseObjectFailed', event)) {
				break;
			}
		}
		log("browseObjectFailed", "exit");
	}

	function onSubscribedEvent(event) {
		//log("onSubscribedEvent", "enter");
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].eventNotify('onSubscribedEvent', event)) {
				break;
			}
		}
		//log("onSubscribedEvent", "exit");
	}

	function initialise(callback) {
		if (CCOM && CCOM.HomeNetworking && CCOM.HomeNetworking.getDevices) {
			CCOM.HomeNetworking.addEventListener('onDeviceFound', onDeviceFound);
			CCOM.HomeNetworking.addEventListener('onDeviceLost', onDeviceLost);
			CCOM.HomeNetworking.addEventListener('getDevicesOK', getDevicesOK);
			CCOM.HomeNetworking.addEventListener('getDevicesFailed', getDevicesFailed);
			getDevicesHandle = CCOM.HomeNetworking.getDevices();
			//Because the device events below are instance implemented, we want to register these events only once
			//so we put these events callback here instead of each device
			CCOM.HomeNetworking.addEventListener('browseContainerOK', browseContainerOK);
			CCOM.HomeNetworking.addEventListener('browseContainerFailed', browseContainerFailed);
			CCOM.HomeNetworking.addEventListener('deleteObjectOK', deleteObjectOK);
			CCOM.HomeNetworking.addEventListener('deleteObjectFailed', deleteObjectFailed);
			CCOM.HomeNetworking.addEventListener('updateObjectOK', updateObjectOK);
			CCOM.HomeNetworking.addEventListener('updateObjectFailed', updateObjectFailed);
			CCOM.HomeNetworking.addEventListener('searchContainerOK', searchContainerOK);
			CCOM.HomeNetworking.addEventListener('searchContainerFailed', searchContainerFailed);
			CCOM.HomeNetworking.addEventListener("subscribeServiceOK", subscribeServiceOK);
			CCOM.HomeNetworking.addEventListener("subscribeServiceFailed", subscribeServiceFailed);
			CCOM.HomeNetworking.addEventListener("cancelSubscribedServiceOK", subscribeServiceOK);
			CCOM.HomeNetworking.addEventListener("cancelSubscribedServiceFailed", subscribeServiceFailed);
			CCOM.HomeNetworking.addEventListener("onSubscribedEvent", onSubscribedEvent);
			CCOM.HomeNetworking.addEventListener("updateBookmarkOK", updateBookmarkOK);
			CCOM.HomeNetworking.addEventListener("updateBookmarkFailed", updateBookmarkFailed);
			CCOM.HomeNetworking.addEventListener("browseObjectOK", browseObjectOK);
			CCOM.HomeNetworking.addEventListener("browseObjectFailed", browseObjectFailed);
		}
	}

	function release() {
		var i;
		CCOM.HomeNetworking.removeEventListener('onDeviceFound', onDeviceFound);
		CCOM.HomeNetworking.removeEventListener('onDeviceLost', onDeviceLost);
		CCOM.HomeNetworking.removeEventListener('getDevicesOK', getDevicesOK);
		CCOM.HomeNetworking.removeEventListener('getDevicesFailed', getDevicesFailed);
		CCOM.HomeNetworking.removeEventListener('browseContainerOK', browseContainerOK);
		CCOM.HomeNetworking.removeEventListener('browseContainerFailed', browseContainerFailed);
		CCOM.HomeNetworking.removeEventListener('deleteObjectOK', deleteObjectOK);
		CCOM.HomeNetworking.removeEventListener('deleteObjectFailed', deleteObjectFailed);
		CCOM.HomeNetworking.removeEventListener('updateObjectOK', updateObjectOK);
		CCOM.HomeNetworking.removeEventListener('updateObjectFailed', updateObjectFailed);
		CCOM.HomeNetworking.removeEventListener('searchContainerOK', searchContainerOK);
		CCOM.HomeNetworking.removeEventListener('searchContainerFailed', searchContainerFailed);
		CCOM.HomeNetworking.removeEventListener("subscribeServiceOK", subscribeServiceOK);
		CCOM.HomeNetworking.removeEventListener("subscribeServiceFailed", subscribeServiceFailed);
		CCOM.HomeNetworking.removeEventListener("cancelSubscribedServiceOK", subscribeServiceOK);
		CCOM.HomeNetworking.removeEventListener("cancelSubscribedServiceFailed", subscribeServiceFailed);
		CCOM.HomeNetworking.removeEventListener("onSubscribedEvent", onSubscribedEvent);
		CCOM.HomeNetworking.removeEventListener("updateBookmarkOK", updateBookmarkOK);
		CCOM.HomeNetworking.removeEventListener("updateBookmarkFailed", updateBookmarkFailed);
		CCOM.HomeNetworking.removeEventListener("browseObjectOK", browseObjectOK);
		CCOM.HomeNetworking.removeEventListener("browseObjectFailed", browseObjectFailed);
		for (i = 0; i < whpvrServers.length; i++) {
			whpvrServers[i].release();
		}
		whpvrServers = [];
	}

	function getAllSchedules() {
		var i,
			whpvrSchedules = [],
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			whpvrSchedules = whpvrSchedules.concat(whpvrServers[i].getSchedules());
		}
		return whpvrSchedules;
	}

	function getAllRecordings() {
		var i,
			whpvrRecordings = [],
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			whpvrRecordings = whpvrRecordings.concat(whpvrServers[i].recordings);
		}
		return whpvrRecordings;
	}

	function getRecordingsByFolderName(folderName) {
		var i,
			whpvrRecordings = getAllRecordings(),
			recordings = [],
			numRecordings = whpvrRecordings.length;
		for (i = 0; i < numRecordings; i++) {
			if (whpvrRecordings[i].uiFolder === folderName) {
				recordings.push(whpvrRecordings[i]);
			}
		}
		return recordings;
	}

	function requestEventRecording(deviceUdn, metaData) {
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].udn === deviceUdn) {
				whpvrServers[i].requestEventRecording(metaData);
				return true;
			}
		}
		return false;
	}

	function requestSeriesRecording(deviceUdn, metaData) {
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].udn === deviceUdn) {
				whpvrServers[i].requestSeriesRecording(metaData);
				return true;
			}
		}
		return false;
	}

	function deleteSeriesSchedule(deviceUdn, seriesId) {
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].udn === deviceUdn) {
				whpvrServers[i].deleteSeriesSchedule(seriesId);
				return true;
			}
		}
		return false;
	}

	function deleteSingleSchedule(deviceUdn, event) {
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].udn === deviceUdn) {
				whpvrServers[i].deleteSingleSchedule(event);
				return true;
			}
		}
		return false;
	}

	function getTaskByEvent(deviceUdn, event) {
		var i,
			numServers = whpvrServers.length;
		for (i = 0; i < numServers; i++) {
			if (whpvrServers[i].udn === deviceUdn) {
				return whpvrServers[i].getTaskByEvent(event);
			}
		}
		return null;
	}

	function searchByCriteria(criteria, properties, dataCallback, finishedCallback, exactMatch, sort) {
		var i,
			numServers = whpvrServers.length;
		searchFinishedCallback = finishedCallback;
		for (i = 0; i < numServers; i++) {
			whpvrServers[i].searchByCriteria(criteria, properties, dataCallback, exactMatch, sort);
		}
	}

	function searchByActorsDirector(keyword, properties, dataCallback, finishedCallback, exactMatch, sort) {
		var i,
			numServers = whpvrServers.length;
		searchFinishedCallback = finishedCallback;
		for (i = 0; i < numServers; i++) {
			whpvrServers[i].searchByActorsDirector(keyword, properties, dataCallback, exactMatch, sort);
		}
	}

	return {
		initialise: initialise,
		release: release,
		getAllServers: function () {
			return whpvrServers;
		},
		getAllRecordings: getAllRecordings,
		getRecordingsByFolderName: getRecordingsByFolderName,
		getAllSchedules: getAllSchedules,
		requestEventRecording: requestEventRecording,
		requestSeriesRecording: requestSeriesRecording,
		deleteSeriesSchedule: deleteSeriesSchedule,
		deleteSingleSchedule: deleteSingleSchedule,
		getTaskByEvent: getTaskByEvent,
		searchByCriteria: searchByCriteria,
		searchByActorsDirector: searchByActorsDirector
	};
}

$N.platform.btv.WHPVRDeviceManager = WHPVRDeviceManager;
