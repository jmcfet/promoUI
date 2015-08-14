/**
 * TODO: The CyclicPagingList and PagingList changes in this file have been applied to JSFW MAIN in CL @105548
 * See: https://atlassian.hq.k.grp/jira/browse/NINJA-1422
 */

/**
 * FocusList Logic for defining a list that has a number of visible items
 * where the n item is the focused/highlighted item
 * @class $N.gui.FocusList
 * @extends $N.gui.CyclicList
 * @constructor
 * @param {Object} rowObject
 */
var $N = $N || {};
$N.gui = $N.gui || {};

$N.gui.FocusList = function (rowObject) {
	var my = {};
	$N.gui.CyclicList.call(this, rowObject, my);

	/**
	 * Returns the item at the top of the list
	 * @method getFirstItem
	 * @return {Object}
	 */
	this.getFirstItem = function () {
		return this.getRowAtIndex(my.firstVisibleRowIndex);
	};

	/**
	 * Returns the item at the bottom of the list
	 * @method getLastItem
	 * @return {Object}
	 */
	this.getLastItem = function () {
		return this.getRowAtIndex(my.lastVisibleRowIndex);
	};

	/**
	 * Overrides the superclass setData method
	 * @method setData
	 * @param {Object} data
	 */
	this.setData = function (data) {
		this.setVisibleRows(data.length);
		my.lastRow = data.length;
		my.listItems = data;
		my.firstVisibleRowIndex = 1;
		my.lastVisibleRowIndex = this.getVisibleRows();
	};

	/**
	 * Sets the focus position.
	 * @method setFocusPosition
	 * @param {Number} position Focus position.
	 */
	this.setFocusPosition = function (position) {
		my.viewSelectedRowIndex = position + 1;
		my.actualSelectedRowIndex = position + 1;
	};

	/**
	 * Returns the focus position.
	 * @method getFocusPosition
	 * @return {Number}
	 */
	this.getFocusPosition = function () {
		return my.viewSelectedRowIndex;
	};

	/**
	 * Overrides the superclass selectNext method
	 * @method selectNext
	 * @return {Boolean}
	 */
	this.selectNext = function () {
		if (this.isSelectedAtLast()) {
			my.actualSelectedRowIndex = 1;
		} else {
			my.actualSelectedRowIndex++;
		}
		this.scrollDown();
		return true;
	};

	/**
	 * Overrides the superclass selectPrevious method
	 * @method selectPrevious
	 * @return {Boolean}
	 */
	this.selectPrevious = function () {
		if (this.isSelectedAtFirst()) {
			my.actualSelectedRowIndex = my.lastRow;
		} else {
			my.actualSelectedRowIndex--;
		}
		this.scrollUp();
		return true;
	};
};

/**
 * CentralFocusList Logic for defining a list that has a number of visible items
 * where the central item is the focused/highlighted item
 * @class $N.gui.CentralFocusList
 *
 * @extends $N.gui.CyclicList
 * @constructor
 * @param {Object} rowObject
 */
$N.gui.CentralFocusList = function (rowObject) {
	var my = {};
	$N.gui.CyclicList.call(this, rowObject, my);

	/**
	 * Returns the item at the top of the list
	 * @method getFirstItem
	 * @return {Object}
	 */
	this.getFirstItem = function () {
		return this.getRowAtIndex(my.firstVisibleRowIndex);
	};

	/**
	 * Returns the item at the bottom of the list
	 * @method getLastItem
	 * @return {Object}
	 */
	this.getLastItem = function () {
		return this.getRowAtIndex(my.lastVisibleRowIndex);
	};

	/**
	 * Overrides the superclass setData method
	 * @method setData
	 * @param {Object} data
	 */
	this.setData = function (data) {
		if (data.length % 2 === 0) {
			throw ("CentralFocusList - setData: Cannot have a central focus list with an even number of items");
		}
		my.actualSelectedRowIndex = parseInt((data.length + 1) / 2, 10);
		this.setVisibleRows(data.length);
		my.lastRow = data.length;
		my.listItems = data;
		my.firstVisibleRowIndex = 1;
		my.lastVisibleRowIndex = this.getVisibleRows();
		my.viewSelectedRowIndex = parseInt((data.length + 1) / 2, 10);
	};

	/**
	 * Overrides the superclass selectNext method
	 * @method selectNext
	 * @return {Boolean}
	 */
	this.selectNext = function () {
		if (this.isSelectedAtLast()) {
			my.actualSelectedRowIndex = 1;
		} else {
			my.actualSelectedRowIndex++;
		}
		this.scrollDown();
		return true;
	};

	/**
	 * Overrides the superclass selectPrevious method
	 * @method selectPrevious
	 * @return {Boolean}
	 */
	this.selectPrevious = function () {
		if (this.isSelectedAtFirst()) {
			my.actualSelectedRowIndex = my.lastRow;
		} else {
			my.actualSelectedRowIndex--;
		}
		this.scrollUp();
		return true;
	};
};

/**
 * TimedEventList logic for defining a list where the items are
 * order by the time of an event
 * @class $N.gui.TimedEventList
 *
 * @extends $N.gui.BasicList
 * @constructor
 * @param {Object} rowObject
 */
$N.gui.TimedEventList = function (rowObject) {

	var my = {};
	$N.gui.BasicList.call(this, rowObject, my);

	var dataMapper = {
		getStartTime : function (obj) {
			return obj.startTime;
		},
		getEndTime : function (obj) {
			return obj.endTime;
		}
	};

	/**
	 * Sets the datamapper that is used to understand the data
	 * properties that should be used to get the start and end
	 * times of an item in the list
	 * @method setDataMapper
	 * @param {Object} mapper
	 */
	this.setDataMapper = function (mapper) {
		if (typeof mapper === "function") {
			/*jslint newcap:true*/
			dataMapper = new mapper();
			/*jslint newcap:false*/
		} else {
			dataMapper = mapper;
		}
	};

	/**
	 * Selects the first item in the list
	 * @method selectFirstItem
	 */
	this.selectFirstItem = function () {
		this.selectItemAtTime(this.getRowAtIndex(1).startTime);
	};

	/**
	 * Selects the last item in the list
	 * @method selectLastItem
	 */
	this.selectLastItem = function () {
		this.selectRowAtIndex(this.getSize());
	};

	/**
	 * Returns the start time of the selected item
	 * @method getSelectedEventStartTime
	 */
	this.getSelectedEventStartTime = function () {
		return dataMapper.getStartTime(this.getSelectedItem());
	};

	/**
	 * Returns the end time of the selected item
	 * @method getSelectedEventEndTime
	 */
	this.getSelectedEventEndTime = function () {
		return dataMapper.getEndTime(this.getSelectedItem());
	};

	/**
	 * Selects an item at the given time
	 * @method selectItemAtTime
	 * @param {Object} time
	 */
	this.selectItemAtTime = function (time) {
		var event;
		var listSize = this.getSize();
		var index = 1;
		var now = new Date().getTime();
		while (index < listSize) {
			event = this.getRowAtIndex(index);
			if (event.endTime > time && event.endTime > now) {
				break;
			} else {
				index++;
			}
		}
		this.selectRowAtIndex(index);
	};

	/**
	 * Selects the previous item in the list
	 * @method selectPrevious
	 */
	this.selectPrevious = function () {
		if (!this.isSelectedAtFirst() && !this.isSelectedAtCurrentTime()) {
			my.actualSelectedRowIndex--;
		}
	};

	/**
	 * Selects the item in the list that is withing the current time
	 * @method selectItemAtCurrentTime
	 */
	this.selectItemAtCurrentTime = function () {
		this.selectItemAtTime(new Date().getTime());
	};

	/**
	 * Returns true if the selected item is current
	 * @method isSelectedAtCurrentTime
	 * @return {Boolean}
	 */
	this.isSelectedAtCurrentTime = function () {
		var currentTime = new Date().getTime();
		return (this.getSelectedEventStartTime() <= currentTime) && (this.getSelectedEventEndTime() > currentTime);
	};

	/**
	 * Returns true if the selected event is expired
	 * @method isSelectedExpired
	 * @return {Boolean}
	 */
	this.isSelectedExpired = function () {
		var currentTime = new Date().getTime();
		return (this.getSelectedEventEndTime() <= currentTime);
	};

	/**
	 * Returns an array of events that have expired
	 * @method getExpiredEvents
	 * @return {Array}
	 */
	this.getExpiredEvents = function () {
		var currentTime = new Date().getTime();
		var expired = [];
		var event;
		var numOfEvents = this.getSize();
		var eventIndex;

		for (eventIndex = 1; eventIndex <= numOfEvents; eventIndex++) {
			event = this.getRowAtIndex(eventIndex);
			if (dataMapper.getEndTime(event) <= currentTime) {
				expired.push(event);
			} else {
				break;
			}
		}
		return expired;
	};

	/**
	 * Returns an array of events that are current
	 * @method getCurrentEvents
	 * @return {Array}
	 */
	this.getCurrentEvents = function () {
		var currentTime = new Date().getTime();
		var current = [];
		var event;
		var numOfEvents = this.getSize();
		var eventIndex;

		for (eventIndex = 1; eventIndex <= numOfEvents; eventIndex++) {
			event = this.getRowAtIndex(eventIndex);
			if (dataMapper.getStartTime(event) < currentTime && dataMapper.getEndTime(event) > currentTime) {
				current.push(event);
				break;
			}
		}
		return current;
	};

};

/**
 * PagingList logic that defines methods for implementing a list that pages
 * @class $N.gui.PagingList
 *
 * @extends $N.gui.StandardList
 * @param {Object} rowObject
 */
$N.gui.PagingList = function (rowObject, my) {
	var my = my || {};
	var superClass = {};
	$N.gui.StandardList.call(this, rowObject, my);

	/**
	 * Overrides the superclass selectRowAtIndex method
	 * @method selectRowAtIndex
	 * @param {Object} index
	 */
	this.selectRowAtIndex = function (index) {
		if (my.lastRow <= this.getVisibleRows()) {
			my.viewSelectedRowIndex = index;
		} else {
			my.viewSelectedRowIndex = index % this.getVisibleRows();
			my.viewSelectedRowIndex = my.viewSelectedRowIndex === 0 ? this.getVisibleRows() : my.viewSelectedRowIndex;
			my.firstVisibleRowIndex = (index - my.viewSelectedRowIndex) + 1;
			my.lastVisibleRowIndex = my.firstVisibleRowIndex + this.getVisibleRows() - 1;
			if (my.lastVisibleRowIndex > my.lastRow) {
				my.lastVisibleRowIndex = my.lastRow;
			}
		}
		my.actualSelectedRowIndex = index;
	};

	this.scrollDown = function () {
		this.scrollDownBy(this.getVisibleRows());
	};

	this.scrollUp = function () {
		this.scrollUpBy(this.getVisibleRows());
	};

	/**
	 * Overrides the superclass scrollUpBy method
	 * @method scrollUpBy
	 * @param {Number} lines
	 */
	this.scrollUpBy = function (lines) {
		var linesOnDisplay = (my.lastVisibleRowIndex - my.firstVisibleRowIndex) + 1;

		my.firstVisibleRowIndex -= lines;
		if (lines < my.actualSelectedRowIndex) {
			if (lines > linesOnDisplay) {
				my.lastVisibleRowIndex -= linesOnDisplay;
			} else {
				my.lastVisibleRowIndex -= lines;
			}
		} else {
			my.lastVisibleRowIndex = this.getVisibleRows();
		}
		my.viewSelectedRowIndex = this.getVisibleRows();
	};

	/**
	 * Overrides the superclass scrollDownBy method
	 * @method scrollDownBy
	 * @param {Number} lines
	 */
	this.scrollDownBy = function (lines) {
		var linesLeft = my.lastRow - my.lastVisibleRowIndex;
		my.firstVisibleRowIndex += lines;
		if (lines < linesLeft) {
			my.lastVisibleRowIndex += lines;
		} else {
			my.lastVisibleRowIndex = my.lastRow;

		}
		my.viewSelectedRowIndex = 1;
	};

	/**
	 * Pages the data up by one page
	 * @method pageUp
	 * @return {Boolean} - true if it did page
	 */
	this.pageUp = function () {
		if (this.isPaged()) {
			if (this.getWrapAround() && this.isAtFirstPage()) {
				this.selectRowAtIndex(Math.min(my.lastRow, my.lastRow - this.getVisibleRows() - my.actualSelectedRowIndex));
				return true;
			}
			if (!this.isAtFirstPage()) {
				this.selectRowAtIndex(my.actualSelectedRowIndex - this.getVisibleRows());
				return true;
			}
		}
		return false;
	};

	/**
	 * Pages the data down by one page
	 * @method pageDown
	 * @return {Boolean} - true if it did page
	 */
	this.pageDown = function () {
		if (this.isPaged()) {
			if (this.getWrapAround() && this.isAtLastPage()) {
				this.selectRowAtIndex(my.viewSelectedRowIndex);
				return true;
			}
			if (!this.isAtLastPage()) {
				this.selectRowAtIndex(Math.min(my.actualSelectedRowIndex + this.getVisibleRows(), my.lastRow));
				return true;
			}
		}
		return false;
	};

	/**
	 * Returns true if at the first page of the list
	 * @method isAtFirstPage
	 * @return {Boolean}
	 */
	this.isAtFirstPage = function () {
		return (my.firstVisibleRowIndex === 1);
	};

	/**
	 * Returns true if at the last page of the list
	 * @method isAtLastPage
	 * @return {Boolean}
	 */
	this.isAtLastPage = function () {
		return (my.lastVisibleRowIndex === this.getSize());
	};

	/**
	 * Overrides the superclass selectNext method
	 * @method selectNext
	 */
	superClass.selectNext = this.selectNext;
	this.selectNext = function () {
		if (this.getWrapAround() && this.isSelectedAtLast()) {
			this.selectRowAtIndex(1);
			return true;
		}
		return superClass.selectNext.call(this);
	};

	/**
	 * Overrides the superclass selectPrevious method
	 * @method selectPrevious
	 */
	superClass.selectPrevious = this.selectPrevious;
	this.selectPrevious = function () {
		if (this.getWrapAround() && this.isSelectedAtFirst()) {
			this.selectRowAtIndex(my.lastRow);
			return true;
		}
		return superClass.selectPrevious.call(this);
	};

};

/**
 * CyclicPagingList logic that defines methods for implementing a list that pages while also providing cyclic never-ending data (if wrapAround is true)
 * @class $N.gui.CyclicPagingList
 *
 * @extends $N.gui.PagingList
 * @param {Object} rowObject
 * @param {Object} my - private shared local scope
 */
// ------ START OF TEMP CODE (SEE TICKET: NETUI-139) REMOVE -----> // TODO NETUI-139: JSFW-ATTENTION: No corresponding NINJA ticket
$N.gui.CyclicPagingList = function (rowObject, my) {
	my = my || {};
	var superClass = {},
		FIRST_ROW_INDEX = 1;
	$N.gui.PagingList.call(this, rowObject, my);

	/**
	 * @method selectRowAtIndex
	 * @param {Object} index
	 */
	superClass.selectRowAtIndex = this.selectRowAtIndex;
	this.selectRowAtIndex = function (index) {

		if (!this.getWrapAround()) {
			return superClass.selectRowAtIndex.call(this, index);
		}

		my.actualSelectedRowIndex = index;

		if (my.lastRow <= this.getVisibleRows()) {
			my.viewSelectedRowIndex = my.actualSelectedRowIndex;
			return;
		}

		my.firstVisibleRowIndex = my.actualSelectedRowIndex + FIRST_ROW_INDEX - my.viewSelectedRowIndex;
		my.lastVisibleRowIndex = my.firstVisibleRowIndex - FIRST_ROW_INDEX + this.getVisibleRows();

		if (my.firstVisibleRowIndex < FIRST_ROW_INDEX) {
			my.firstVisibleRowIndex = my.firstVisibleRowIndex + my.lastRow;
		}

		if (my.lastVisibleRowIndex > my.lastRow) {
			my.lastVisibleRowIndex = my.lastVisibleRowIndex - my.lastRow;
		}

	};

	/**
	 * Pages the data up by one page
	 * @method pageUp
	 * @return {Boolean} - true if it did page
	 */
	this.pageUp = function () {
		var newIndex;
		if (this.isPaged()) {
			newIndex = my.actualSelectedRowIndex - this.getVisibleRows();
			if (newIndex < FIRST_ROW_INDEX) {
				newIndex = this.getWrapAround() ? newIndex + my.lastRow : FIRST_ROW_INDEX;
			}
			this.selectRowAtIndex(newIndex);
			return true;
		}
		return false;
	};

	/**
	 * Pages the data down by one page
	 * @method pageDown
	 * @return {Boolean} - true if it did page
	 */
	this.pageDown = function () {
		var newIndex;
		if (this.isPaged()) {
			newIndex = my.actualSelectedRowIndex + this.getVisibleRows();
			if (newIndex > my.lastRow) {
				newIndex = this.getWrapAround() ? newIndex - my.lastRow : my.lastRow;
			}
			this.selectRowAtIndex(newIndex);
			return true;
		}
		return false;
	};

	/**
	 * Overrides the superclass scrollDownBy method
	 * @method scrollDownBy
	 * @param {Number} lines
	 */
	superClass.scrollDownBy = this.scrollDownBy;
	this.scrollDownBy = function (lines) {
		var newFirstIndex;
		var newLastIndex;
		if (this.getWrapAround()) {
			newFirstIndex = (my.firstVisibleRowIndex + lines) % my.lastRow;
			newLastIndex = (my.lastVisibleRowIndex + lines) % my.lastRow;
			my.firstVisibleRowIndex = newFirstIndex <= 0 ? newFirstIndex + my.lastRow : newFirstIndex;
			my.lastVisibleRowIndex = newLastIndex <= 0 ? newLastIndex + my.lastRow : newLastIndex;
			my.viewSelectedRowIndex = 1;
		} else {
			superClass.scrollDownBy.call(this, lines);
		}
	};

	/**
	 * Overrides the superclass scrollUpBy method
	 * @method scrollUpBy
	 * @param {Number} lines
	 */
	superClass.scrollUpBy = this.scrollUpBy;
	this.scrollUpBy = function (lines) {
		var newFirstIndex;
		var newLastIndex;
		if (this.getWrapAround()) {
			newFirstIndex = (my.firstVisibleRowIndex - lines) % my.lastRow;
			newLastIndex = (my.lastVisibleRowIndex - lines) % my.lastRow;
			my.firstVisibleRowIndex = newFirstIndex <= 0 ? newFirstIndex + my.lastRow : newFirstIndex;
			my.lastVisibleRowIndex = newLastIndex <= 0 ? newLastIndex + my.lastRow : newLastIndex;
			my.viewSelectedRowIndex = this.getVisibleRows();
		} else {
			superClass.scrollUpBy.call(this, lines);
		}
	};

	/**
	 * Overrides the superclass selectNext method
	 * @method selectNext
	 */
	superClass.selectNext = this.selectNext;
	this.selectNext = function () {
		if (this.getWrapAround() && this.isSelectedAtLast() && (my.lastRow > this.getVisibleRows())) {
			my.actualSelectedRowIndex = 1;
			if (my.viewSelectedRowIndex === this.getVisibleRows()) {
				this.scrollDown();
				return true;
			} else {
				my.viewSelectedRowIndex++;
				return false;
			}
		} else {
			return superClass.selectNext.call(this);
		}
	};

	/**
	 * Overrides the superclass selectPrevious method
	 * @method selectPrevious
	 */
	superClass.selectPrevious = this.selectPrevious;
	this.selectPrevious = function () {
		if (this.getWrapAround() && this.isSelectedAtFirst() && (my.lastRow > this.getVisibleRows())) {
			my.actualSelectedRowIndex = my.lastRow;
			if (my.viewSelectedRowIndex === 1) {
				this.scrollUp();
				return true;
			} else {
				my.viewSelectedRowIndex--;
				return false;
			}
		} else {
			return superClass.selectPrevious.call(this);
		}
	};

	/**
	 * Returns an array of the data that is currently on show
	 * @method returnViewableList
	 * @return {Array}
	 */
	superClass.returnViewableList = this.returnViewableList;
	this.returnViewableList = function () {
		var i = null;

		if (my.lastVisibleRowIndex >= my.firstVisibleRowIndex) {
			return superClass.returnViewableList.call(this);
		}
		var viewList = [];
		for (i = this.getFirstVisibleRowIndex(); i <= my.lastRow; i++) {
			viewList[viewList.length] = this.getRowAtIndex(i);
		}
		for (i = 1; i <= this.getLastVisibleRowIndex(); i++) {
			viewList[viewList.length] = this.getRowAtIndex(i);
		}
		return viewList;
	};
};
// <----- END OF TEMP CODE (SEE TICKET: NETUI-139) REMOVE ------

/**
 * CyclicPagingListWithScrolling logic that defines methods for implementing a list that pages while also providing scrolling
 * @class $N.gui.CyclicPagingListWithScrolling
 *
 * @extends $N.gui.CyclicPagingList
 * @param {Object} rowObject
 * @param {Object} my - private shared local scope
 */
$N.gui.CyclicPagingListWithScrolling = function (rowObject, my) {
	my = my || {};
	var superClass = {},
		FIRST_ROW_INDEX = 1,
		LAST_ROW_INDEX = 8,
		wrapAroundLocal = true,
		INITIAL_ROW_INDEX = 1,
		SCROLL_DIRECTION_PREVIOUS = -1,
		SCROLL_DIRECTION_NONE = 0,
		lastScrollDirection = SCROLL_DIRECTION_NONE;
	$N.gui.CyclicPagingList.call(this, rowObject, my);

	/**
	 * @method resetScrollDirection
	 */
	this.resetScrollDirection = function () {
		lastScrollDirection = SCROLL_DIRECTION_NONE;
	};

	/**
	 * @method setVisibleRowsRelativeToStart
	 */
	this.setVisibleRowsRelativeToStart = function () {
		my.firstVisibleRowIndex = my.actualSelectedRowIndex;
		my.viewSelectedRowIndex = INITIAL_ROW_INDEX;
		my.lastVisibleRowIndex = my.firstVisibleRowIndex + this.getVisibleRows() - FIRST_ROW_INDEX;
		if (my.lastVisibleRowIndex > my.lastRow) {
			my.lastVisibleRowIndex = my.lastRow;
		}
	};

	/**
	 * @method setVisibleRowsRelativeToEnd
	 */
	this.setVisibleRowsRelativeToEnd = function () {
		var rowsLeftOver = my.lastRow - this.getVisibleRows();
		if (my.actualSelectedRowIndex <= 1) {
			my.actualSelectedRowIndex = my.lastRow;
		}
		my.lastVisibleRowIndex = my.lastRow;
		if (rowsLeftOver < 0) {
			my.firstVisibleRowIndex = INITIAL_ROW_INDEX;
		} else {
			my.firstVisibleRowIndex = INITIAL_ROW_INDEX + rowsLeftOver;
		}
		my.viewSelectedRowIndex = INITIAL_ROW_INDEX + my.actualSelectedRowIndex - my.firstVisibleRowIndex;
	};

	/**
	 * Overrides the superclass selectRowAtIndex method
	 * @method selectRowAtIndex
	 * @param {Number} dataIndex
	 * @param {Number} scrollDirection
	 * @param {Boolean} isScroll
	 */
	superClass.selectRowAtIndex = this.selectRowAtIndex;
	this.selectRowAtIndex = function (dataIndex, scrollDirection, isScroll) {
		my.actualSelectedRowIndex = dataIndex;

		if (isScroll && scrollDirection !== SCROLL_DIRECTION_NONE) {
			lastScrollDirection = scrollDirection;
		}
		if (isScroll && lastScrollDirection === SCROLL_DIRECTION_PREVIOUS) {
			this.setVisibleRowsRelativeToEnd();
		} else {
			this.setVisibleRowsRelativeToStart();
		}
	};

	/**
	 * Overrides the superclass scrollDownBy method
	 * @method scrollDownBy
	 * @param {Number} lines
	 */
	superClass.scrollDownBy = this.scrollDownBy;
	this.scrollDownBy = function (lines) {
		var newFirstIndex;
		var newLastIndex;
		if (wrapAroundLocal === true) {
			newFirstIndex = (my.firstVisibleRowIndex + lines) % my.lastRow;
			newLastIndex = (my.lastVisibleRowIndex + lines) % my.lastRow;
			my.firstVisibleRowIndex = newFirstIndex <= 0 ? newFirstIndex + my.lastRow : newFirstIndex;
			my.lastVisibleRowIndex = newLastIndex <= 0 ? newLastIndex + my.lastRow : newLastIndex;
			my.viewSelectedRowIndex = LAST_ROW_INDEX;
		} else {
			superClass.scrollDownBy.call(this, lines);
		}
	};

	/**
	 * Overrides the superclass scrollDown method
	 * @method scrollDown
	 */
	superClass.scrollDown = this.scrollDown;
	this.scrollDown = function () {
		this.scrollDownBy(1);
	};

	/**
	 * Overrides the superclass scrollUpBy method
	 * @method scrollUpBy
	 * @param {Number} lines
	 */
	superClass.scrollUpBy = this.scrollUpBy;
	this.scrollUpBy = function (lines) {
		var newFirstIndex,
			newLastIndex,
			numOfLinesVisible = FIRST_ROW_INDEX + my.lastVisibleRowIndex - my.firstVisibleRowIndex;
		if (wrapAroundLocal === true) {
			newFirstIndex = (my.firstVisibleRowIndex - lines) % my.lastRow;
			if (this.getVisibleRows() > numOfLinesVisible) {
				newLastIndex = my.lastVisibleRowIndex % my.lastRow;
			} else {
				newLastIndex = (my.lastVisibleRowIndex - lines) % my.lastRow;
			}
			my.firstVisibleRowIndex = newFirstIndex <= 0 ? newFirstIndex + my.lastRow : newFirstIndex;
			my.lastVisibleRowIndex = newLastIndex <= 0 ? newLastIndex + my.lastRow : newLastIndex;
			my.viewSelectedRowIndex = FIRST_ROW_INDEX;
		} else {
			superClass.scrollUpBy.call(this, lines);
		}
	};

	/**
	 * Overrides the superclass scrollDown method
	 * @method scrollUp
	 */
	superClass.scrollUp = this.scrollUp;
	this.scrollUp = function () {
		this.scrollUpBy(1);
	};
};

/**
 * Cyclic list logic that is the same as a cyclic list but has data offscreen
 * in a buffer
 * @class $N.gui.CyclicListWithBuffer
 *
 * @extends $N.gui.StandardList
 * @param {Object} rowObject
 */
$N.gui.CyclicListWithBuffer = function (rowObject) {
	var my = {};
	$N.gui.StandardList.call(this, rowObject, my);
	var superClass = {};

	my.firstBufferRowIndex = 1;
	my.lastBufferRowIndex = 0;
	var buffer = 0;
	var fullRows = 0;

	/**
	 * Sets the size of the buffer
	 * @method setBuffer
	 * @param {Number} newBuff
	 */
	this.setBuffer = function (newBuff) {
		my.actualSelectedRowIndex += newBuff;
		my.firstVisibleRowIndex += newBuff;
		fullRows = this.getVisibleRows() + (newBuff * 2);
		my.lastBufferRowIndex = this.getFullRows();
		buffer = newBuff;
	};

	/**
	 * Returns the number of rows on display including the
	 * buffer
	 * @method getFullRows
	 */
	this.getFullRows = function () {
		return fullRows;
	};

	/**
	 * Returns the buffer size
	 * @method getBuffer
	 * @return {Number}
	 */
	this.getBuffer = function () {
		return buffer;
	};

	/**
	 * Returns the index of the top row item that is the buffer
	 * @method getFirstBufferRowIndex
	 * @return {Number}
	 */
	this.getFirstBufferRowIndex = function () { return my.firstBufferRowIndex; };

	/**
	 * Returns the index of the last row item that is the buffer
	 * @method getLastBufferRowIndex
	 * @return {Number}
	 */
	this.getLastBufferRowIndex = function () { return my.lastBufferRowIndex; };

	/**
	 * Scrolls the list by the given number of lines
	 * @method scrollDownBy
	 * @param {Object} lines
	 */
	this.scrollDownBy = function (lines) {
		var newFirstIndex = (my.firstVisibleRowIndex += lines) % my.lastRow;
		var newLastIndex = (my.lastVisibleRowIndex += lines) % my.lastRow;
		my.firstVisibleRowIndex = newFirstIndex === 0 ? my.lastRow : newFirstIndex;
		my.lastVisibleRowIndex = newLastIndex === 0 ? my.lastRow : newLastIndex;

		var newFirstBufIndex = (my.firstBufferRowIndex += lines) % my.lastRow;
		var newLastBufIndex = (my.lastBufferRowIndex += lines) % my.lastRow;
		my.firstBufferRowIndex = newFirstBufIndex === 0 ? my.lastRow : newFirstBufIndex;
		my.lastBufferRowIndex = newLastBufIndex === 0 ? my.lastRow : newLastBufIndex;
	};

	/**
	 * Scrolls the list by the given number of lines
	 * @method scrollUpBy
	 * @param {Object} lines
	 */
	this.scrollUpBy = function (lines) {
		var newFirstIndex = (my.firstVisibleRowIndex -= lines) % my.lastRow;
		var newLastIndex = (my.lastVisibleRowIndex -= lines) % my.lastRow;
		my.firstVisibleRowIndex = newFirstIndex <= 0 ? my.lastRow - newFirstIndex : newFirstIndex;
		my.lastVisibleRowIndex = newLastIndex <= 0 ? my.lastRow - newLastIndex : newLastIndex;

		var newFirstBufIndex = (my.firstBufferRowIndex -= lines) % my.lastRow;
		var newLastBufIndex = (my.lastBufferRowIndex -= lines) % my.lastRow;
		my.firstBufferRowIndex = newFirstBufIndex <= 0 ? my.lastRow - newFirstBufIndex : newFirstBufIndex;
		my.lastBufferRowIndex = newLastBufIndex <= 0 ? my.lastRow - newLastBufIndex : newLastBufIndex;
	};

	/**
	 * Overrides the superclass selectNext method
	 * @method selectNext
	 */
	this.selectNext = function () {
		var scrolled = false;
		if (this.isSelectedAtLast() && (my.lastRow > this.getVisibleRows())) {
			if (my.viewSelectedRowIndex === this.getVisibleRows()) {
				my.firstBufferRowIndex++;
				my.lastBufferRowIndex++;
				if (++my.firstVisibleRowIndex > my.lastRow) {
					my.firstVisibleRowIndex = this.getFullRows() - (this.getBuffer() * 2);
				}
				my.lastVisibleRowIndex = 1;
				scrolled = true;
			} else {
				my.viewSelectedRowIndex++;
			}
			my.actualSelectedRowIndex = 1;
		} else if (!this.isSelectedAtLast()) {
			my.actualSelectedRowIndex++;
			if (my.viewSelectedRowIndex === this.getVisibleRows()) {
				this.scrollDown();
				scrolled = true;
			} else {
				my.viewSelectedRowIndex++;
			}
		}
		return scrolled;
	};

	/**
	 * Overrides the superclass selectPrevious method
	 * @method selectPrevious
	 */
	this.selectPrevious = function () {
		var scrolled = false;
		if (this.isSelectedAtFirst() && (my.lastRow > this.getVisibleRows())) {
			if (my.viewSelectedRowIndex === 1) {
				my.firstBufferRowIndex--;
				my.lastBufferRowIndex--;
				my.firstVisibleRowIndex = my.lastRow;
				if (--my.lastVisibleRowIndex < 1) {
					my.lastVisibleRowIndex = my.lastRow;
				}
				scrolled = true;
			} else {
				my.viewSelectedRowIndex--;
			}
			my.actualSelectedRowIndex = my.lastRow;
		} else if (!this.isSelectedAtFirst()) {
			my.actualSelectedRowIndex--;
			if (my.viewSelectedRowIndex === 1) {
				this.scrollUp();
				scrolled = true;
			} else {
				my.viewSelectedRowIndex--;
			}
		}
		return scrolled;
	};

	/**
	 * Overirdes the superclass method returnViewableList and
	 * returns the data on display minus the buffer
	 * @method returnViewableList
	 * @return {Array}
	 */
	superClass.returnViewableList = this.returnViewableList;
	this.returnViewableList = function () {
		var i = null;

		if (my.lastVisibleRowIndex >= my.firstVisibleRowIndex) {
			return superClass.returnViewableList.call(this);
		}
		var viewList = [];
		for (i = this.getFirstVisibleRowIndex(); i <= my.lastRow; i++) {
			viewList[viewList.length] = this.getRowAtIndex(i);
		}
		for (i = 1; i <= this.getLastVisibleRowIndex(); i++) {
			viewList[viewList.length] = this.getRowAtIndex(i);
		}
		return viewList;
	};

	/**
	 * Returns the full list on view including the buffer
	 * @method returnFullList
	 * @return {Array}
	 */
	this.returnFullList = function () {
		var viewList = [];
		var i = null;

		if (my.lastBufferRowIndex >= my.firstBufferRowIndex) {
			for (i = this.getFirstBufferRowIndex(); i <= this.getLastBufferRowIndex(); i++) {
				viewList[viewList.length] = this.getRowAtIndex(i);
			}
		} else {
			for (i = this.getFirstBufferRowIndex(); i <= my.lastRow; i++) {
				viewList[viewList.length] = this.getRowAtIndex(i);
			}
			for (i = 1; i <= this.getLastBufferRowIndex(); i++) {
				viewList[viewList.length] = this.getRowAtIndex(i);
			}
		}
		return viewList;
	};
};

/**
 * Cyclic list logic defines the logic for a list where the highlighted
 * item is in the middle of the list data.
 * @class $N.gui.CyclicList
 *
 * @extends $N.gui.StandardList
 * @param {Object} rowObject
 * @param {Object} my
 */
$N.gui.CyclicList = function (rowObject, my) {
	my = my || {};
	$N.gui.StandardList.call(this, rowObject, my);
	var superClass = {};

	/**
	 * Scrolls the list by the given number of lines
	 * @method scrollDownBy
	 * @param {Object} lines
	 */
	this.scrollDownBy = function (lines) {
		var newFirstIndex = (my.firstVisibleRowIndex += lines) % my.lastRow;
		var newLastIndex = (my.lastVisibleRowIndex += lines) % my.lastRow;
		my.firstVisibleRowIndex = newFirstIndex === 0 ? my.lastRow : newFirstIndex;
		my.lastVisibleRowIndex = newLastIndex === 0 ? my.lastRow : newLastIndex;
	};

	/**
	 * Scrolls the list by the given number of lines
	 * @method scrollUpBy
	 * @param {Number} lines
	 */
	this.scrollUpBy = function (lines) {
		var newFirstIndex = (my.firstVisibleRowIndex -= lines) % my.lastRow;
		var newLastIndex = (my.lastVisibleRowIndex -= lines) % my.lastRow;
		my.firstVisibleRowIndex = newFirstIndex <= 0 ? my.lastRow - newFirstIndex : newFirstIndex;
		my.lastVisibleRowIndex = newLastIndex <= 0 ? my.lastRow - newLastIndex : newLastIndex;
	};

	/**
	 * Overrides the superclass selectNext method
	 * @method selectNext
	 */
	superClass.selectNext = this.selectNext;
	this.selectNext = function () {
		if (this.isSelectedAtLast() && (my.lastRow > this.getVisibleRows())) {
			if (my.viewSelectedRowIndex === this.getVisibleRows()) {
				if (++my.firstVisibleRowIndex > my.lastRow) {
					my.firstVisibleRowIndex = 1;
				}
				my.lastVisibleRowIndex = 1;
			} else {
				my.viewSelectedRowIndex++;
			}
			my.actualSelectedRowIndex = 1;
		} else {
			return superClass.selectNext.call(this);
		}
	};

	/**
	 * Overrides the superclass selectPrevious method
	 * @method selectPrevious
	 */
	superClass.selectPrevious = this.selectPrevious;
	this.selectPrevious = function () {
		if (this.isSelectedAtFirst() && (my.lastRow > this.getVisibleRows())) {
			if (my.viewSelectedRowIndex === 1) {
				my.firstVisibleRowIndex = my.lastRow;
				if (--my.lastVisibleRowIndex < 1) {
					my.lastVisibleRowIndex = my.lastRow;
				}
			} else {
				my.viewSelectedRowIndex--;
			}
			my.actualSelectedRowIndex = my.lastRow;
		} else {
			return superClass.selectPrevious.call(this);
		}
	};

	/**
	 * Returns an array of the data that is currently on show
	 * @method returnViewableList
	 * @return {Array}
	 */
	superClass.returnViewableList = this.returnViewableList;
	this.returnViewableList = function () {
		var i = null;

		if (my.lastVisibleRowIndex >= my.firstVisibleRowIndex) {
			return superClass.returnViewableList.call(this);
		}
		var viewList = [];
		for (i = this.getFirstVisibleRowIndex(); i <= my.lastRow; i++) {
			viewList[viewList.length] = this.getRowAtIndex(i);
		}
		for (i = 1; i <= this.getLastVisibleRowIndex(); i++) {
			viewList[viewList.length] = this.getRowAtIndex(i);
		}
		return viewList;
	};
};

/**
 * StandardList encapsulates the logic for a list that can hold many items but
 * has a set number of visible items at one time.  It allows scrolling of the view
 * to give an impression of moving up and down the data. If the wrap flag is set the
 * list returns the the beginning when the bottom is reached and visa versa.
 * This object is free of any GUI implementation and is to be extended and wrapped
 * to draw the contents to the display.
 * @class $N.gui.StandardList
 *
 * @extends $N.gui.BasicList
 * @constructor
 * @param rowObject {Object}
 * @param my {Object} a parameter used to facilitate private shared local scope variables
 */
$N.gui.StandardList = function (rowObject, my) {

	my = my || {};
	$N.gui.BasicList.call(this, rowObject, my);
	var superClass = {};

	my.firstVisibleRowIndex = 1;
	my.lastVisibleRowIndex = 0;
	my.viewSelectedRowIndex = 1;

	var visibleRows = 6;

	/**
	 * Selects the item at the given index (starting from 1)
	 * @method selectRowAtIndex
	 * @param {Object} index
	 */
	this.selectRowAtIndex = function (index) {
		my.actualSelectedRowIndex = index;
		my.viewSelectedRowIndex = index;
	};

	/**
	 * Returns the number of items that are visible in the list
	 * @method getVisibleRows
	 * @return {Number}
	 */
	this.getVisibleRows = function () {
		return visibleRows;
	};

	/**
	 * Sets the number of items that are visible in the list
	 * @method setVisibleRows
	 * @param rows {Number}
	 */
	this.setVisibleRows = function (rows) {
		visibleRows = parseInt(rows, 10);
		if (my.lastRow > 0) {
			my.lastVisibleRowIndex = my.lastRow <= visibleRows ? my.lastRow : visibleRows;
		}
	};

	/**
	 * Returns the index of the first item that is visible in the list
	 * @method getFirstVisibleRowIndex
	 * @return {Number}
	 */
	this.getFirstVisibleRowIndex = function () {
		return my.firstVisibleRowIndex;
	};

	/**
	 * Returns the index of the last item that is visible in the list
	 * @method getLastVisibleRowIndex
	 * @return {Number}
	 */
	this.getLastVisibleRowIndex = function () {
		return my.lastVisibleRowIndex;
	};

	/**
	 * Returns the index of the view item that is selected
	 * @method getViewSelectedRowIndex
	 * @return {Number}
	 */
	this.getViewSelectedRowIndex = function () {
		return my.viewSelectedRowIndex;
	};

	/**
	 * Scroll the list down by 1 place without affecting the currently
	 * selected item
	 * @method scrollDown
	 */
	this.scrollDown = function () {
		this.scrollDownBy(1);
	};

	/**
	 * Scroll the list down by 1 place without affecting the currently
	 * selected item
	 * @method scrollUp
	 */
	this.scrollUp = function () {
		this.scrollUpBy(1);
	};

	/**
	 * Scroll the list down by given number of lines without affecting the currently
	 * selected item
	 * @method scrollDownBy
	 * @param lines {Number}
	 */
	this.scrollDownBy = function (lines) {
		var linesLeft = my.lastRow - my.lastVisibleRowIndex;
		if (lines < linesLeft) {
			my.firstVisibleRowIndex += lines;
			my.lastVisibleRowIndex += lines;
		} else {
			my.firstVisibleRowIndex = my.lastRow - (visibleRows - 1);
			my.lastVisibleRowIndex = my.lastRow;
			my.viewSelectedRowIndex = my.lastRow > visibleRows ? visibleRows : my.lastRow;
		}
	};

	/**
	 * Scroll the list up by given number of lines without affecting the currently
	 * selected item
	 * @method scrollUpBy
	 * @param lines {Number}
	 */
	this.scrollUpBy = function (lines) {
		var linesLeft = my.lastRow - my.lastVisibleRowIndex;
		if (lines < my.actualSelectedRowIndex) {
			my.firstVisibleRowIndex -= lines;
			my.lastVisibleRowIndex -= lines;
		} else {
			my.firstVisibleRowIndex = 1;
			my.lastVisibleRowIndex = my.lastRow > visibleRows ? visibleRows : my.lastRow;
			my.viewSelectedRowIndex = 1;
		}
	};

	/**
	 * Moves the list up by the number of rows if not at
	 * the beginning
	 * @method pageUp
	 * @return {Boolean}
	 */
	this.pageUp = function () {
		if (my.firstVisibleRowIndex > 1) {
			this.scrollUpBy(visibleRows);
			my.actualSelectedRowIndex -= visibleRows;
			return true;
		}
		return false;
	};

	/**
	 * Moves the list down by the number of rows if not at
	 * the beginning
	 * @method pageDown
	 * @return {Boolean}
	 */
	this.pageDown = function () {
		if (my.lastVisibleRowIndex < my.lastRow) {
			this.scrollDownBy(visibleRows);
			my.actualSelectedRowIndex = Math.min(my.actualSelectedRowIndex + visibleRows, my.lastRow);
			return true;
		}
		return false;
	};

	/**
	 * Selects the next item in the list. If the next item to be selected is
	 * outside of the viewable items than the list scrolls.  If at the last item and
	 * the wrapAround flag is true the first item is selected.
	 * @method selectNext
	 * @return {boolean} true if the list scrolled
	 */
	this.selectNext = function () {
		var scrolled = false;
		if (this.isSelectedAtLast() && this.getWrapAround() && (my.lastRow > visibleRows)) {
			this.selectRowAtIndex(1);
			if (this.isPaged()) {
				this.scrollUpBy(my.lastRow);
				scrolled = true;
			}
		} else if (!this.isSelectedAtLast()) {
			my.actualSelectedRowIndex++;
			if (my.viewSelectedRowIndex === visibleRows) {
				this.scrollDown();
				scrolled = true;
			} else {
				my.viewSelectedRowIndex++;
			}
		}
		return scrolled;
	};

	/**
	 * Selects the previous item in the list. If the previous item to be selected is
	 * outside of the viewable items than the list scrolls.  If at the first item and
	 * the wrapAround flag is true the last item is selected.
	 * @method selectPrevious
	 * @return {boolean} true if the list scrolled
	 */
	this.selectPrevious = function () {
		var scrolled = false;
		if (this.isSelectedAtFirst() && this.getWrapAround() && (my.lastRow > visibleRows)) {
			this.selectRowAtIndex(my.lastRow);
			if (this.isPaged()) {
				this.scrollDownBy(my.lastRow);
				scrolled = true;
			}
		} else if (!this.isSelectedAtFirst()) {
			my.actualSelectedRowIndex--;
			if (my.viewSelectedRowIndex === 1) {
				this.scrollUp();
				scrolled = true;
			} else {
				my.viewSelectedRowIndex--;
			}
		}
		return scrolled;
	};

	/**
	 * Creates a new list item with supplied parameters and adds the item
	 * to the list
	 * @method addItem
	 * @param {String} arg1 variant
	 * @param {String} arg2 variant
	 * @param {String} arg3 variant
	 * @param {String} arg4 variant
	 */
	superClass.AddItem = this.addItem;
	this.addItem = function (arg1, arg2, arg3, arg4) {
		superClass.AddItem.call(this, arg1, arg2, arg3, arg4);
		if (my.lastRow < (visibleRows + my.firstVisibleRowIndex)) {
			my.lastVisibleRowIndex++;
		}
	};

	/**
	 * Returns true if there are more items in the list than can be displayed
	 * in the viewable part.
	 * @method isPaged
	 * @return {boolean}
	 */
	this.isPaged = function () {
		return (my.lastRow > visibleRows);
	};

	/**
	 * Resets the list so that it contains no items
	 * @method clearList
	 */
	superClass.clearList = this.clearList;
	this.clearList = function () {
		superClass.clearList();
		my.listItems.length = 0;
		my.firstVisibleRowIndex = 1;
		my.lastVisibleRowIndex = 0;
		my.viewSelectedRowIndex = 1;
	};

	/**
	 * Overrides the superclass setDataMethod
	 * @method setData
	 * @param {Object} data
	 */
	this.setData = function (data) {
		my.actualSelectedRowIndex = 1;
		my.lastRow = data.length;
		my.listItems = data;
		my.firstVisibleRowIndex = 1;
		my.lastVisibleRowIndex = my.lastRow <= this.getVisibleRows() ? my.lastRow : this.getVisibleRows();
		my.viewSelectedRowIndex = 1;
	};

	/**
	 * Returns the item at the top of the list
	 * @method getFirstItem
	 * @return {Object}
	 */
	this.getFirstItem = function () {
		return this.getRowAtIndex(my.firstVisibleRowIndex);
	};

	/**
	 * Returns the item at the bottom of the list
	 * @method getLastItem
	 * @return {Object}
	 */
	this.getLastItem = function () {
		return this.getRowAtIndex(my.lastVisibleRowIndex);
	};

	/**
	 * Returns the items from the list that are visible
	 * @method returnViewableList
	 * @return {Array} array of objects
	 */
	this.returnViewableList = function () {
		var viewList = [];
		var i;
		for (i = this.getFirstVisibleRowIndex(); i <= this.getLastVisibleRowIndex(); i++) {
			viewList[viewList.length] = this.getRowAtIndex(i);
		}
		return viewList;
	};
};

/**
 * BasicList encapsulates the logic for a list object free of any GUI implementation.
 * It's an array with a pointer to denote the selected item
 * @class $N.gui.BasicList
 * @constructor
 * @param rowObject {Object}
 * @param my {Object} a parameter used to facilitate private shared local scope variables
 */
$N.gui.BasicList = function (rowObject, my) {

	var me = this;
	my = my || {};

	my.actualSelectedRowIndex = 1;
	my.lastRow = 0;
	my.listItems = [];

	var maxItems = 1000;
	var wrapAround = false;
	my.lookup = ['watch tv', 'now', 'NET TV guide','music'];    //jrm

	/**
	 * Return the current value for the maximum number of items the list can hold
	 * @method getMaxItems
	 * @return {Number}
	 */
	this.getMaxItems = function () {
		return maxItems;
	};

	/**
	 * Set the current value for the maximum number of items the list can hold
	 * @method setMaxItems
	 * @param itemCount
	 */
	this.setMaxItems = function (itemCount) {
		maxItems = itemCount;
	};

	/**
	 * Returns the index of the selected item (index starts at 1)
	 * @method getActualSelectedRowIndex
	 * @return {Number}
	 */
	this.getActualSelectedRowIndex = function () {
		return my.actualSelectedRowIndex;
	};

	/**
	 * Returns true is list is set to select the first item if it reaches end
	 * @method getWrapAround
	 * @return {boolean}
	 */
	this.getWrapAround = function () {
		return wrapAround;
	};

	/**
	 * Sets the wrap around flag on the list
	 * @method setWrapAround
	 * @param wrap
	 */
	this.setWrapAround = function (wrap) {
		wrapAround = wrap;
	};

	/**
	 * Returns the currently selected item
	 * @method getSelectedItem
	 * @return {Object}
	 */
	this.getSelectedItem = function () {
		if (my.actualSelectedRowIndex) {
			return my.listItems[my.actualSelectedRowIndex - 1];
		}
		return null;
	};
    //jrm
	this.SelectClickedItem = function (label) {
	    debugger;
	    var i,
           loopLength = my.listItems.length;
	   
	    for (i = 0; i < loopLength; i++) {
	        if (my.lookup[i] == label) {
	            my.actualSelectedRowIndex = i;
	            return my.listItems[i];
	        }
	    }
	    
	};
	this.doForAllItems = function (runMe) {
	    var i,
			loopLength = this._items.length;
	    for (i = 0; i < loopLength; i++) {
	        runMe(this._items[i]);
	    }
	};
	/**
	 * Selects the data at the given row index starting from 1
	 * @method selectRowAtIndex
	 * @param {Object} index
	 */
	this.selectRowAtIndex = function (index) {
		my.actualSelectedRowIndex = index;
	};

	/**
	 * Increments the selected row index by 1 or selects the first index if
	 * wrap around is set to true and at the last item
	 * @method selectNext
	 */
	this.selectNext = function () {
		if (this.isSelectedAtLast() && this.getWrapAround()) {
			this.selectRowAtIndex(1);
		} else if (!this.isSelectedAtLast()) {
			my.actualSelectedRowIndex++;
		}
	};


	/**
	 * Decrements the selected row index by 1 or selects the last index if
	 * wrap around is set to true and at the first item
	 * @method selectPrevious
	 */
	this.selectPrevious = function () {
		if (this.isSelectedAtFirst() && this.getWrapAround()) {
			this.selectRowAtIndex(my.lastRow);
		} else if (!this.isSelectedAtFirst()) {
			my.actualSelectedRowIndex--;
		}
	};

	/**
	 * Selects the first item in the list
	 * @method selectFirstItem
	 */
	this.selectFirstItem = function () {
		this.selectRowAtIndex(1);
	};

	/**
	 * Selects the last item in the list
	 * @method selectLastItem
	 */
	this.selectLastItem = function () {
		this.selectRowAtIndex(this.getSize());
	};

	/**
	 * Creates a new list item with supplied parameters and add the item
	 * to the list
	 * @method addItem
	 * @param {String} arg1 variant
	 * @param {String} arg2 variant
	 * @param {String} arg3 variant
	 * @param {String} arg4 variant
	 */
	this.addItem = function (arg1, arg2, arg3, arg4) {
		//if (my.lastRow < this.getMaxItems()) {
		/*jslint newcap:true*/
		my.listItems[my.listItems.length] = new rowObject(arg1, arg2, arg3, arg4);
		/*jslint newcap:false*/
		my.lastRow++;
		//} else {
		//	throw new Error(BasicList.LIST_FULL_ERROR);
		//}
	};

	/**
	 * Adds a data object into the list
	 * @method addExistingItem
	 * @param {Object} obj
	 */
	this.addExistingItem = function (obj) {
		my.listItems[my.listItems.length] = obj;
		my.lastRow++;
	};

	/**
	 * Returns the item at the specified index position
	 * @method getRowAtIndex
	 * @param index
	 * @return {Object}
	 */
	this.getRowAtIndex = function (index) {

		if (this.getWrapAround() && (index < 1 || index > this.getSize())) {
			if (index < 1) {
				index = this.getSize() + (index % this.getSize());
			} else {
				index = (index % this.getSize());
				index = index < 1 ? this.getSize() : index;
			}
		}
		return my.listItems[index - 1];
	};

	/**
	 * Returns the size of the list
	 * @method getSize
	 * @return {Number}
	 */
	this.getSize = function () {
		return my.lastRow;
	};

	/**
	 * Returns a boolean value indicating if the list is empty
	 * @method isEmpty
	 * @return {boolean}
	 */
	this.isEmpty = function () {
		return (my.lastRow === 0);
	};

	/**
	 * Returns a boolean value indicating if selected item is the first
	 * item in the list
	 * @method isSelectedAtFirst
	 * @return {boolean}
	 */
	this.isSelectedAtFirst = function () {
		return (my.actualSelectedRowIndex === 1 || my.lastRow === 0);
	};

	/**
	 * Returns a boolean value indicating if selected item is the last
	 * item in the list
	 * @method isSelectedAtLast
	 * @return {boolean}
	 */
	this.isSelectedAtLast = function () {
		return (my.actualSelectedRowIndex === my.lastRow || my.lastRow === 0);
	};

	/**
	 * Sets the data of the list to the given Array
	 * @method setData
	 * @param {Array} data
	 */
	this.setData = function (data) {
		my.actualSelectedRowIndex = 1;
		my.lastRow = data.length;
		my.listItems = data;
	};

	/**
	 * Returns the data held in the list
	 * @method getData
	 * @return {Array}
	 */
	this.getData = function () {
		return my.listItems;
	};

	/**
	 * Adds the given data to an existing list
	 * @method appendData
	 * @param {Array} data
	 */
	this.appendData = function (data) {
		my.listItems = my.listItems.concat(data);
		my.lastRow = my.listItems.length;
	};

	/**
	 * Inserts an item into the existing list at the specific point
	 * @method insertDataAtIndex
	 * @param {Number} index
	 * @param {Object} data
	 */
	this.insertDataAtIndex = function (index, data) {
		var len = my.listItems.length;
		if (index > len) {
			index = len;
		}
		my.listItems[index] = data;
	};

	/**
	 * Resets the list so that it contains no items
	 * @method clearList
	 */
	this.clearList = function () {
		my.actualSelectedRowIndex = 1;
		my.lastRow = 0;
		my.listItems.length = my.lastRow;
	};

	/**
	 * Sets the class/function/object used for creating list items in the
	 * the addItem method, this overrides the default list row object
	 * @method setRowObject
	 * @param newRowObj
	 */
	this.setRowObject = function (newRowObj) {
		if (this.isEmpty()) {
			rowObject = newRowObj;
		} else {
			throw new Error("Cannot change the row object on a list that contains data");
		}
	};

	/**
	 * Returns the class/function/object used for creating list items
	 * @method getRowObject
	 * @return {Object}
	 */
	this.getRowObject = function () {
		return rowObject;
	};
};