/**
 * TimedEventGrid is an object that represents a grid that
 * displays event at different times. It can be used with TimedEventGridControlWithChannels
 * to display a full grid style EPG
 * @class $N.gui.TimedEventGrid
 *
 * @requires $N.gui.BasicList
 * @requires $N.gui.TimedEventList
 * 
 * @constructor
 */
define('jsfw/gui/Logic/Grid/TimedEventGrid',
    [
    'jsfw/gui/Logic/List/List',
    ],
    function (List) {
    	
		function TimedEventGrid() {
	
			var rows = new $N.gui.BasicList($N.gui.TimedEventList);
			var persistedStartTime;
			var checkInterval;
			var checkIntervalMS = 60000;  // 1 minute;
	
			var dataMapper = {
				getStartTime : function (obj) {
					return obj.startTime;
				},
				getEndTime : function (obj) {
					return obj.endTime;
				}
			};
	
			/**
			 * Sets the data mapper object used for displaying the data
			 * @method setDataMapper
			 * @param {Object} Mapper The data mapper to be used.
			 */
			this.setDataMapper = function (Mapper) {
				if (typeof Mapper === "function") {
					dataMapper = new Mapper();
				} else {
					dataMapper = Mapper;
				}
			};
	
			/**
			 * Returns the data mapper being used to display the data.
			 * @method getDataMapper
			 * @return The data mapper that is in use
			 */
			this.getDataMapper = function () {
				return dataMapper;
			};
	
			/**
			 * Adds a new row the the grid
			 * @method addRow
			 */
			this.addRow = function () {
				var newRow = new $N.gui.TimedEventList(null);
				newRow.setDataMapper(dataMapper);
				rows.addExistingItem(newRow);
			};
	
			/**
			 * Adds the given event to the given row
			 * @method addEventToRow
			 * @param {Object} event
			 * @param {Number} row
			 */
			this.addEventToRow = function (event, row) {
				rows.getRowAtIndex(row).addExistingItem(event);
				if (!persistedStartTime) {
					persistedStartTime = dataMapper.getStartTime(event);
				}
			};
	
			/**
			 * How often it checks if an event has expired in the grid
			 * @method setCheckIntervalMS
			 * @param {Number} interval
			 */
			this.setCheckIntervalMS = function (interval) {
				checkIntervalMS = interval;
			};
	
			/**
			 * Returns the current selected row item in the grid
			 * @method getSelectedRow
			 * @return {Object}
			 */
			this.getSelectedRow = function () {
				return rows.getSelectedItem();
			};
	
			/**
			 * Returns the row item for the given index
			 * @method getRowAtIndex
			 * @param {Number} index
			 * @return {Object}
			 */
			this.getRowAtIndex = function (index) {
				return rows.getRowAtIndex(index);
			};
	
			/**
			 * Returns the event at the given row index and given event index
			 * @method getEventAtRowAndEventIndex
			 * @param {Number} row
			 * @param {Number} eventIndex
			 * @return {Object} The event
			 */
			this.getEventAtRowAndEventIndex = function (row, eventIndex) {
				return this.getRowAtIndex(row).getRowAtIndex(eventIndex);
			};
	
			/**
			 * Returns the currently selected event
			 * @method getSelectedEvent
			 * @return {Object} The selected event
			 */
			this.getSelectedEvent = function () {
				return this.getSelectedRow().getSelectedItem();
			};
	
			/**
			 * Selects the previous row up
			 * @method selectPreviousRow
			 */
			this.selectPreviousRow = function () {
				rows.selectPrevious();
				this.getSelectedRow().selectItemAtTime(persistedStartTime);
			};
	
			/**
			 * Selected the next row down
			 * @method selectNextRow
			 */
			this.selectNextRow = function () {
				rows.selectNext();
				this.getSelectedRow().selectItemAtTime(persistedStartTime);
			};
	
			/**
			 * Selects the row at the given index
			 * @method selectRowAtIndex
			 * @param {Number} row
			 */
			this.selectRowAtIndex = function (row) {
				rows.selectRowAtIndex(row);
				this.getSelectedRow().selectItemAtTime(persistedStartTime);
			};
	
			/**
			 * Selects the event for the current time
			 * @method selectEventAtCurrentTime
			 */
			this.selectEventAtCurrentTime = function () {
				this.getSelectedRow().selectItemAtCurrentTime();
			};
	
			/**
			 * Selects the previous event to the currently selected event
			 * @method selectPreviousEvent
			 */
			this.selectPreviousEvent = function () {
				this.getSelectedRow().selectPrevious();
				persistedStartTime = this.getSelectedRow().getSelectedEventStartTime();
			};
	
			/**
			 * Selects the next event to the currently selected event
			 * @method selectNextEvent
			 */
			this.selectNextEvent = function () {
				this.getSelectedRow().selectNext();
				persistedStartTime = this.getSelectedRow().getSelectedEventStartTime();
			};
	
			/**
			 * Selects the first row in the grid
			 * @method selectFirstRow
			 */
			this.selectFirstRow = function () {
				this.selectRowAtIndex(1);
				this.getSelectedRow().selectItemAtTime(persistedStartTime);
			};
	
			/**
			 * Selects the last row in the gid
			 * @method selectLastRow
			 */
			this.selectLastRow = function () {
				this.selectRowAtIndex(rows.getSize());
				this.getSelectedRow().selectItemAtTime(persistedStartTime);
			};
	
			/**
			 * Selects the first event for the currently selected row in the grid
			 * @method selectFirstEvent
			 */
			this.selectFirstEvent = function () {
				this.getSelectedRow().selectFirstItem();
				persistedStartTime = this.getSelectedRow().getSelectedEventStartTime();
			};
	
			/**
			 * Selects the last event for the currently selected row in the grid
			 * @method selectLastEvent
			 */
			this.selectLastEvent = function () {
				this.getSelectedRow().selectLastItem();
				persistedStartTime = this.getSelectedRow().getSelectedEventStartTime();
			};
	
			/**
			 * Returns true if the currently selected row is the first in the grid
			 * @method isSelectedRowAtFirst
			 * @return {Boolean} true if the currently selected row is the first in the grid, false otherwise
			 */
			this.isSelectedRowAtFirst = function () {
				return rows.isSelectedAtFirst();
			};
	
			/**
			 * Returns true if the currently selected row is the last row in the grid
			 * @method isSelectedRowAtLast
			 * @return {Boolean} true if the currently selected row is the last row in the grid, false otherwise
			 */
			this.isSelectedRowAtLast = function () {
				return rows.isSelectedAtLast();
			};
	
			/**
			 * Returns true if the currently selected event is the first event in its row
			 * @method isSelectedEventAtFirst
			 * @return {Boolean} true if the currently selected event is the first event in its row, false otherwise
			 */
			this.isSelectedEventAtFirst = function () {
				return this.getSelectedRow().isSelectedAtFirst();
			};
	
			/**
			 * Returns true if the currently selected event is the last event in its row
			 * @method isSelectedEventAtLast
			 * @return {Boolean} true if the currently selected event is the last event in its row, false otherwise
			 */
			this.isSelectedEventAtLast = function () {
				return this.getSelectedRow().isSelectedAtLast();
			};
	
			/**
			 * Returns true if the currently selected event is on during the current time
			 * @method isSelectedEventAtCurrentTime
			 * @return {Boolean} true if the currently selected event is on during the current time, false otherwise
			 */
			this.isSelectedEventAtCurrentTime = function () {
				return this.getSelectedRow().isSelectedAtCurrentTime();
			};
	
			/**
			 * Resets the list so that it contains no items
			 * @method clearRows
			 */
			this.clearRows = function () {
				rows.clearList();
			};
	
			/**
			 * Clears all events from the grid
			 * @method clearEvents
			 */
			this.clearEvents = function () {
				var i = 0;
				var numOfRows = rows.getSize();
	
				for (i = 1; i <= numOfRows; i++) {
					rows.getRowAtIndex(i).clearList();
				}
			};
	
			/**
			 * Returns the amount of rows in the grid
			 * @method getNumOfRows
			 * @return {Number} the amount of rows in the grid
			 */
			this.getNumOfRows = function () {
				return rows.getSize();
			};
	
			/**
			 * Returns true if the current events end time is before the current time
			 * @method isCurrentEventExpired
			 * @return {Boolean} true if the current events end time is before the current time, false otherwise
			 */
			this.isCurrentEventExpired = function () {
				return this.getSelectedRow().isSelectedExpired();
			};
	
			/**
			 * Selectes the next event in the row if the current selected event has expired
			 * @method checkAndRollonExpiredSelectedEvent
			 */
			this.checkAndRollonExpiredSelectedEvent = function () {
				if (this.isCurrentEventExpired()) {
					this.selectNextEvent();
				}
			};
	
			/**
			 * Interval check to see if the current event has expired
			 * @method startCurrentEventExpiredCheck
			 */
			this.startCurrentEventExpiredCheck = function () {
				var me = this;
				checkInterval = setInterval(function () {me.checkAndRollonExpiredSelectedEvent(); }, checkIntervalMS);
			};
	
			/**
			 * Stops the interval for checking if the current event has expired
			 * @method stopCurrentEventExiredCheck
			 */
			this.stopCurrentEventExiredCheck = function () {
				clearInterval(checkInterval);
			};
	
			/**
			 * Returns an array of expired events
			 * @method getExpiredEvents
			 * @return {Array} an array of expired events
			 */
			this.getExpiredEvents = function () {
				var expired = [];
				var row;
				var numOfRows = rows.getSize();
				var rowIndex = 0;
	
				for (rowIndex = 1; rowIndex <= numOfRows; rowIndex++) {
					row = this.getRowAtIndex(rowIndex);
					expired = expired.concat(row.getExpiredEvents());
				}
				return expired;
			};
	
			/**
			 * Returns an array of events that are currently being shown
			 * @method getCurrentEvents
			 * @return {Array} an array of events that are currently being shown
			 */
			this.getCurrentEvents = function () {
				var current = [];
				var row;
				var numOfRows = rows.getSize();
				var rowIndex = 0;
	
				for (rowIndex = 1; rowIndex <= numOfRows; rowIndex++) {
					row = this.getRowAtIndex(rowIndex);
					current = current.concat(row.getCurrentEvents());
				}
				return current;
			};
		}
	
		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.TimedEventGrid = TimedEventGrid;
		return TimedEventGrid;
	}
);