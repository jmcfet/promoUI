/**
 * This class maintains an array of EPG events for the current service the zapper is displaying
 * The array is updated when more events are required to be displayed in the zapper
 * While the user is browsing just On Now events or On Next events the array is populated
 * with just On Now events or On Next events respectively
 *
 * @class MiniguideEventManager
 */

var $N = $N || window.parent.$N;

function MiniguideEventManager() {
	this._log = new $N.apps.core.Log('MINIGUIDE', 'MiniguideEventManager');
	this._eventArray = []; //contains the events for the next 24 hours for the displayed service
	this._eventIndex = 0;
	this._currentEventArrayServiceId = null;
	this._browseTime = "NOW";
}

/**
 * @method setService
 * @param {Object} service
 */
MiniguideEventManager.prototype.setService = function (service) {
	this._log("setService", "Enter");
	this._currentService = service;
	this._log("setService", "Exit");
};

/**
 * This function is required for unit tests to run correctly
 * @method getService
 * @return {Object}
 */
MiniguideEventManager.prototype.getService = function () {
	this._log("getService", "Enter & Exit");
	return this._currentService;
};

/**
 * @method getNextEvent
 * @return {Object} event
 */
MiniguideEventManager.prototype.getNextEvent = function () {
	this._log("getNextEvent", "Enter");
	//reset browse time
	this._browseTime = null;

	//get next event
	if (!this._eventArray[this._eventIndex + 1]) {
		//This code will be called first time while checking the list of events and also on reaching the end of next 24 hours event
		if ((this._eventArray) && (this._eventArray.length !== 1)) {
			//No need to refill the event array if it has reached the end of 24 hour event. Hence return null.
			return null;
		} else if (this._eventArray && this._eventIndex === (this._eventArray.length - 1)) {
			//updates the event array for the first key right press.
			this._updateEventArray(true);
		} else {
			this._updateEventArray();
		}
	}
	if (this._eventArray[this._eventIndex + 1]) {
		this._eventIndex = this._eventIndex + 1;
		this._log("getNextEvent", "Exit1");
		return this.getCurrentEvent();
	}
	this._log("getNextEvent", "Exit2");
	return null;

};

/**
 * @method getPreviousEvent
 * @return {Object} event
 */
MiniguideEventManager.prototype.getPreviousEvent = function () {
	this._log("getPreviousEvent", "Enter");
	//is service current service
	//reset browse time
	this._browseTime = null;
	//get previous event
	if (this._eventIndex !== 0 && this._eventArray[this._eventIndex - 1]) {
		this._eventIndex = this._eventIndex - 1;
		this._log("getPreviousEvent", "Exit1");
		return this.getCurrentEvent();
	}
	this._log("getPreviousEvent", "Exit2");
	return null;
};

/**
 * @method getEventForAdjacentService
 * @param {Object} service
 * @return {Object} event
 */
MiniguideEventManager.prototype.getEventForAdjacentService = function (service) {
	this._log("getEventForAdjacentService", "Enter");
	//set browse time
	this._updateBrowseTime();
	//set the current service
	this.setService(service);
	//get events for service
	this._updateEventArray(null, null, null);
	//get new event array index
	if (this._browseTime && this._browseTime !== "NOW") {
		this._eventIndex = this._getEventIndexByStartTime(this._browseTime);
	}
	this._log("getEventForAdjacentService", "Exit");
	//return event for browse time on service
	return this.getCurrentEvent();
};

/**
 * @method getCurrentEventForService
 * @param {Object} service
 * @param {Boolean} keepBrowseTime
 * @return {Object} event
 */
MiniguideEventManager.prototype.getCurrentEventForService = function (service, keepBrowseTime) {
	this._log("getCurrentEventForService", "Enter");

	if (service) {
		//return now event for given service
		this.setService(service);
		this._eventIndex = 0;
		this._eventArray = [];
		this._eventArray[0] = $N.app.epgUtil.getEvent("current", service.serviceId);
		this._eventArray[0].nextEvent = $N.app.epgUtil.getEvent("next", service.serviceId);
		if (!keepBrowseTime) {
			this._browseTime = null;
		}
		this._log("getCurrentEventForService", "Exit");
		return this._eventArray[0];
	} else {
		return null;
	}
};

/* PRIVATE HELPERS */

/**
 * @method _updateBrowseTime
 */
MiniguideEventManager.prototype._updateBrowseTime = function () {
	this._log("_updateBrowseTime", "Enter");
	if (!this._browseTime) {
		if (this._eventIndex === 0) {
			this._browseTime = "NOW";
		} else if (this._eventArray.length > 0 && this._eventArray[this._eventIndex] && this._eventArray[this._eventIndex].startTime) {
			//need to add a second or any events with an endTime same as browseTime will not be returned
			//when calling getEventsByWindow
			this._browseTime = this._eventArray[this._eventIndex].startTime + 1000;
		}
	}
	this._log("_updateBrowseTime", "Exit");
};

/**
 * Populates the eventArray array for the current displayed service
 * If parameter addToCurrentList is passed in then events are added to the currentEvent array
 * If startTime and endTime are passed then the eventArray will be populated with events showing
 * between those times otherwise the eventList is populated with one days worth of events
 * If force is set then the events list will update regardless of if the currentEventArrayServiceId is the same
 * as the given service.serviceId
 *
 * @method _updateEventArray
 * @param {Boolean} addToCurrentList
 * @param {Number} startTime
 * @param {Number} endTime
 * @param {Boolean} force
 */
MiniguideEventManager.prototype._updateEventArray = function (addToCurrentList, startTime, endTime, force) {
	this._log("_updateEventArray", "Enter");
	var tempEventArray = [],
        now = new Date().getTime(),
        service = this._currentService,
        nowEvent = this.getCurrentEventForService(service, true); //To get the start time of the current playing event

	if (service && service.serviceId) {
		if (this._currentEventArrayServiceId !== service.serviceId || addToCurrentList || this._eventArray.length <= 1 || force) {
			this._currentEventArrayServiceId = service.serviceId;
			if (!addToCurrentList) {
				//empty eventArray
				this._eventArray = [];
				if (this._browseTime === "NOW") {
					this.getCurrentEventForService(service, true);
					return;
				}
			} else if (!startTime && this._eventArray.length > 0) {
				startTime = this._eventArray[this._eventArray.length - 1].endTime + 1000;
			}
			if (!startTime) {
				startTime = nowEvent.startTime;
			}
			if (!endTime) {
				endTime = startTime + ($N.app.constants.DAY_IN_MS); //Restrict miniguide to show only the next 24 hours event starting from the current event(startTime).
			}
			if (endTime > now + $N.app.constants.MAX_EPG_DAYS * $N.app.constants.DAY_IN_MS) {
				endTime = now + $N.app.constants.MAX_EPG_DAYS * $N.app.constants.DAY_IN_MS;
			}
			//check startTime is not more than MAX_EPG_DAYS in the future
			while (tempEventArray.length === 0 && startTime < now + $N.app.constants.MAX_EPG_DAYS * $N.app.constants.DAY_IN_MS && startTime < (endTime - 10)) {
				tempEventArray = $N.platform.btv.EPG.getEventsForChannelWithDummyEvents(service.serviceId, startTime, endTime, $N.app.epgUtil.getDefaultEvent);
				//if getEventsByWindowWithDummyEvents returns empty array search next day
				if (tempEventArray.length === 0 || (tempEventArray.length === 1 && tempEventArray[0].eventId === $N.app.epgUtil.BAD_EVENT_ID)) {
					startTime = endTime;
					endTime = startTime + ($N.app.constants.DAY_IN_MS);
				} else {
					//we received events
					this._eventArray = this._eventArray.concat(tempEventArray);
				}
			}
			if (this._eventArray.length === 0) {
				this._eventArray.push($N.app.epgUtil.getDefaultEvent(service.serviceId));
			}
		}
	}
	this._log("_updateEventArray", "Exit");
};

/**
 * @method getCurrentEvent
 * @return {Object} The EPG event
 */
MiniguideEventManager.prototype.getCurrentEvent = function () {
	this._log("getCurrentEvent", "Enter and Exit");
	var event = this._eventArray[this._eventIndex];
	if (this._eventArray[this._eventIndex + 1]) {
		event.nextEvent = this._eventArray[this._eventIndex + 1];
	}
	return event;
};

/**
 * @method getCurrentEventPosition
 * @return {Number}
 */
MiniguideEventManager.prototype.getCurrentEventPosition = function () {
	this._log("getCurrentEventPosition", "Enter and Exit");
	return this._eventIndex;
};

/**
 * Calculates which event in the eventArray is showing at a given startTime
 * and returns the position of this event within the eventArray
 *
 * @method _getEventIndexByStartTime
 * @private
 * @param {Number} startTime
 * @return {Number} the index position of the event in the currentEventArray, showing at the given time
 */
MiniguideEventManager.prototype._getEventIndexByStartTime = function (startTime) {
	this._log("_getEventIndexByStartTime", "Enter");
	var i;
	if (this._eventArray.length === 0) {
		this._log("_getEventIndexByStartTime", "Exit1");
		return 0;
	}
	for (i = 0; i < this._eventArray.length; i++) {
		if (this._eventArray[i].startTime <= startTime && this._eventArray[i].endTime > startTime) {
			this._log("_getEventIndexByStartTime", "Exit2");
			return i;
		}
	}
	if (startTime > this._eventArray[this._eventArray.length - 1].startTime) {
		this._log("_getEventIndexByStartTime", "Exit3");
		return this._eventArray.length - 1;
	}
	return 0;
};
