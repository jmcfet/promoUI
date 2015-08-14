/**
 * TimedEventGridControlWithChannels is an object that represents a grid
 * style EPG.  It uses ListItem objects to represent the channels on the
 * right and GridItem objects to represent a set of events for the channels
 * @class $N.gui.TimedEventGridControlWithChannels
 * @extends $N.gui.GUIObject
 *
 * @requires $N.gui.List
 * @requires $N.gui.TimedEventGrid
 * @requires $N.platform.btv.EPG
 * @requires $N.gui.Group
 * @requires $N.gui.Label
 * @requires $N.gui.ListItem
 * @requires $N.gui.GridItem
 * @requires $N.gui.Container
 * @requires $N.gui.SVGlink
 * @requires $N.apps.util.Util
 * @requires $N.gui.FrameworkCore
 * @requires $N.gui.Util
 *
 * @constructor
 * @param {Object} docRef DOM reference
 */
define('jsfw/gui/GUIObjects/Controls/grid/TimedEventGridControlWithChannels',
    [
    'jsfw/gui/Logic/List/List',
    'jsfw/gui/Logic/Grid/TimedEventGrid',
    'jsfw/platform/btv/EPG',
    'jsfw/gui/GUIObjects/Components/Group',
    'jsfw/gui/GUIObjects/Components/Label',
    'jsfw/gui/GUIObjects/Controls/List/ListItem',
    'jsfw/gui/GUIObjects/Controls/grid/GridItem',
    'jsfw/gui/GUIObjects/Components/Container',
    'jsfw/gui/GUIObjects/Components/SVGlink',
    'jsfw/apps/util/Util',
    'jsfw/gui/FrameworkCore',
    'jsfw/gui/helpers/Util',
    'jsfw/gui/GUIObjects/GUIObject'
    ],
    function (List, TimedEventGrid, EPG, Group, Label, ListItem, GridItem, Container, SVGlink, appsUtil, FrameworkCore, Util, GUIObject) {

		function TimedEventGridControlWithChannels(docRef, parent) {

			TimedEventGridControlWithChannels.superConstructor.call(this, docRef);

			// variables available through getters and setters
			var checkInterval;
			var checkIntervalMS = 60000;
			var width = 900;
			var height = 140;
			var numOfRows = 7;
			var numOfHours = 3;
			var rowHeight = 30;
			var interval = 1800000;
			var maxNumOfColumns = 75;
			var atFirstPage = true;
			var selectedItemTimeOutMS;
			var ignoreKeysOnPageMS = 0;
			var eventDataMapper;
			var channelDataMapper;
			var channelData;
			var channelListWidth = 200;
			var dummyEventObj;
			var iconConfiguration = null;
			var timeLineGrow = false;

			// private variables
			var channelList = new $N.gui.PagingList();
			var eventGrid = new $N.gui.TimedEventGrid();
			var MS_IN_HOUR = 3600000;
			var MS_IN_DAY = 86400000;
			var NO_EVENT_ALLOWANCE = 60000;
			var pixelsInHr = 300;
			var gridStartTime;
			var gridEndTime;
			var visibleEvents = [];
			var visibleChannels = [];
			var gridTimeInMS = 10800000;  // numOfHours * MS_IN_HOUR
			var lastXs = [];
			var events;
			var labels = [];
			var actualStartTime;
			var timeLine;
			var tlIcon;
			var channelIdsToGet;
			var autoRollForwardTO;
			var epgEventSupplier = $N.platform.btv.EPG.getEventsByWindow;		// Default EPG event supplier

			// public variables
			this.itemSelectedCallback = function () {
				return null;
			};
			this.itemOkPressCallback = function () {
				return null;
			};
			this.windowUpdatedCallback = function () {
				return null;
			};
			this.timeUpdatedCallback = function () {
				return null;
			};

			/**
			 * Creates default dummy event object, can be overridden by implementing class
			 * @method DummyEventObj
			 * @private
			 * @param {Number} start
			 * @param {Number} end
			 * @param {boolean} noData
			 * @param {boolean} locked
			 */
			var DummyEventObj = function (start, end, noData, locked) {
				this.eventId = 0;
				this.title = locked ? "This channel is locked" : "No event data";
				this.startTime = start;
				this.endTime = end;
				this.parentalRating = 0;
				this.noData = noData;
				this.locked = locked;
			};

			/**
			 * Returns the nearest time to the current time for a given interval
			 * @method getCurrentTimeToNearestInterval
			 * @private
			 * @param {Number} interval
			 * @return {Number}
			 */
			var getCurrentTimeToNearestInterval = function (interval) {
				var now = new Date().getTime();
				var closest = now - (now % interval);
				return closest;
			};

			/**
			 * Returns an array of all channel ids
			 * @method getChannelsIds
			 * @return {Object}
			 */
			var getChannelsIds = function () {
				var channels = [];
				var i = 0;

				for (i = channelList.getFirstVisibleRowIndex(); i <= channelList.getLastVisibleRowIndex(); i++) {
					channels.push(channelDataMapper.getServiceId(channelList.getRowAtIndex(i)));
				}
				return channels;
			};

			// initialisation code
			channelList.setVisibleRows(numOfRows);
			var container = new $N.gui.Group(this._docRef);

			this._rootElement = container.getRootElement();
			if (parent) {
				parent.addChild(this);
			}

			/**
			 * Initialises the TimedEventGridControlWithChannels and creates the GUI objects that
			 * represent the visible data view
			 * @method init
			 */
			this.init = function () {
				var gridItem;
				var label;
				var i = 0;
				var y = 0;
				var x = 0;
				var chanItem = null;

				// time label for x axis time line
				for (i = 0; i < numOfHours; i++) {
					label = new $N.gui.Label(this._docRef);
					label.setX(i * pixelsInHr);
					label.setY(-8);
					label.setCssClass("timeLabelText");
					labels.push(label);
					this._rootElement.appendChild(label.getRootElement());
				}
				// visible channel SVG objects
				for (y = 0; y <= numOfRows - 1; y++) {
					chanItem = new $N.gui.ListItem(this._docRef);
					chanItem.setItemPadding(4);
					chanItem.setWidth(channelListWidth);
					chanItem.setColumn1Width(65);
					chanItem.setHeight(rowHeight);
					chanItem.setX(-channelListWidth - 2);
					chanItem.setY(y * rowHeight);
					chanItem.setContainerCssClass("channelBg");
					chanItem.setContainerCssHighlightClass("channelBgHighlight");
					visibleChannels[y] = chanItem;
					this._rootElement.appendChild(chanItem.getRootElement());

					visibleEvents.push([]);
					eventGrid.addRow();
					// visible event SVG objects
					for (x = maxNumOfColumns - 1; x >= 0; x--) {
						gridItem = new $N.gui.GridItem(this._docRef);
						gridItem.setItemPadding(4);
						gridItem.setY(rowHeight * y);
						gridItem.setWidth(width);
						gridItem.setHeight(rowHeight);
						if (iconConfiguration) {
							gridItem.configureIcon(iconConfiguration);
						}
						gridItem.hide();
						visibleEvents[y][x] = gridItem;
						this._rootElement.appendChild(gridItem.getRootElement());
					}
				}
				// current time indicator
				timeLine = new $N.gui.Container(this._docRef);
				timeLine.setCssClass("timeLineBg");
				timeLine.setWidth(5);
				timeLine.setX(0);
				timeLine.setY(-4);
				timeLine.setHeight(this.getHeight() + 4);
				this._rootElement.appendChild(timeLine.getRootElement());

				tlIcon = new $N.gui.SVGlink(this._docRef);
				tlIcon.setX(0);
				tlIcon.setY(0);
				this._rootElement.appendChild(tlIcon.getRootElement());
			};

			/**
			 * Initialises the TimedEventGridControlWithChannels and creates the GUI objects that
			 * represent the visible data view
			 * @method initialise
			 * @deprecated use init()
			 */
			this.initialise = function () {
				this.init();
			};

			/**
			 * Draws the grid item in the grid at the given x, y coordinate
			 * @method drawGridItem
			 * @param {Number} y Y coordinate of the start of the grid item
			 * @param {Number} x X coordinate of the start of the grid item
			 * @param {Object} event The event to be displayed in the grid item
			 * @param {Number} currentTime The current time
			 * @param {Object} channel The channel this grid item is displayed in
			 */
			var drawGridItem = function (y, x, event, currentTime, channel) {

				var startTime;
				var endTime;
				// event started before the grid start time
				if (eventDataMapper.getStartTime(event) < gridStartTime) {
					startTime = gridStartTime;
					visibleEvents[y][x].showLeftArrow();
				} else {
					startTime = eventDataMapper.getStartTime(event);
					visibleEvents[y][x].hideLeftArrow();
				}
				// event ends after the grid end time
				if (eventDataMapper.getEndTime(event) > gridEndTime) {
					endTime = gridEndTime;
					visibleEvents[y][x].showRightArrow();
				} else {
					endTime = eventDataMapper.getEndTime(event);
					visibleEvents[y][x].hideRightArrow();
				}
				// event has already finished
				if (eventDataMapper.getEndTime(event) < currentTime) {
					visibleEvents[y][x].setExpired(true);
				} else {
					visibleEvents[y][x].setExpired(false, (eventDataMapper.getStartTime(event) < currentTime && eventDataMapper.getEndTime(event) > currentTime));
				}

				var xPos = ((startTime - gridStartTime) / MS_IN_HOUR) * pixelsInHr;
				var width = ((endTime - startTime) / MS_IN_HOUR) * pixelsInHr;
				visibleEvents[y][x].setX(xPos);
				visibleEvents[y][x].setWidth(width);
				visibleEvents[y][x].setText(eventDataMapper.getTitle(event, channel));
				visibleEvents[y][x].setIcon(eventDataMapper.getIcon(event, channel));
				visibleEvents[y][x].show();
				event.svg = visibleEvents[y][x]; //link the SVG object to the CCOM event
			};

			/**
			 * Draws the channel item in the grid at the given y position
			 * @method drawChannelItem
			 * @param {Number} y The y coordinate
			 * @param {Object} channel The channel of the channel item
			 */
			var drawChannelItem = function (y, channel) {
				visibleChannels[y].setColumn1Text(channelDataMapper.getChannelNumber(channel));
				visibleChannels[y].setColumn2Text(channelDataMapper.getTitle(channel));
				visibleChannels[y].setIcon(channelDataMapper.getIcon(channel));
				if (channelDataMapper.isSubscribed(channel)) {
					visibleChannels[y].setTextCssClass("channelText");
				} else {
					visibleChannels[y].setTextCssClass("channelTextDisabled");
				}
			};

			/**
			 * Draws a dummy event at the given x,y coordinate
			 * @method createAndDrawDummyEvent
			 * @param {Number} x
			 * @param {Number} y
			 * @param {Number} startTime
			 * @param {Number} endTime
			 * @param {boolean} noData
			 * @param {boolean} locked
			 * @param {Number} currentTime
			 */
			var createAndDrawDummyEvent = function (x, y, startTime, endTime, noData, locked, currentTime) {
				var dummyEvent = new DummyEventObj(startTime, endTime, noData, locked);
				drawGridItem(y, x, dummyEvent, currentTime);
				eventGrid.addEventToRow(dummyEvent, y + 1);
			};

			/**
			 * Logic to check for gaps within the grid and calls createAndDrawDummyEvent to draw dummy event
			 * @method checkAndfillEventGap
			 * @param {Object} newEvent
			 * @param {Object} lastEvent
			 * @param {Number} currentXPos
			 * @param {Number} currentYPos
			 * @param {Number} currentTime
			 */
			var checkAndfillEventGap = function (newEvent, lastEvent, currentXPos, currentYPos, currentTime) {
				if (newEvent && !lastEvent && (newEvent.startTime - gridStartTime) > NO_EVENT_ALLOWANCE) {
					createAndDrawDummyEvent(currentXPos, currentYPos, gridStartTime, newEvent.startTime, true, false, currentTime);
					return true;
				}
				if (newEvent && lastEvent && (newEvent.startTime - lastEvent.endTime) > NO_EVENT_ALLOWANCE) {
					createAndDrawDummyEvent(currentXPos, currentYPos, lastEvent.endTime, newEvent.startTime, true, false, currentTime);
					return true;
				}
				if (!newEvent && lastEvent && (lastEvent.endTime + NO_EVENT_ALLOWANCE) < gridEndTime) {
					createAndDrawDummyEvent(currentXPos, currentYPos, lastEvent.endTime, gridEndTime, true, false, currentTime);
					return true;
				}
				return false;
			};

			/**
			 * Removes all grid items in unused rows
			 * @method blankOutUnusedRows
			 * @param {Number} lastY
			 */
			var blankOutUnusedRows = function (lastY) {
				var width = ((gridEndTime - gridStartTime) / MS_IN_HOUR) * pixelsInHr;
				var row = 0;
				var i = 0;

				for (row = lastY; row < numOfRows; row++) {
					//channels
					visibleChannels[row].setColumn1Text(" ");
					visibleChannels[row].setColumn2Text(" ");
					visibleChannels[row].setIcon("");
					// events
					visibleEvents[row][0].setX(0);
					visibleEvents[row][0].setWidth(width);
					visibleEvents[row][0].setText(" ");
					visibleEvents[row][0].setIcon("");
					visibleEvents[row][0].hideLeftArrow();
					visibleEvents[row][0].hideRightArrow();
					visibleEvents[row][0].setExpired(false);
					for (i = 1; i < lastXs[row]; i++) {
						visibleEvents[row][i].hide();
					}
					lastXs[row] = 1;
				}
			};

			/**
			 * Draws the grid for the current time window using the current
			 * channels on display
			 * @method drawGrid
			 * @param {boolean} updateChannels true if navigating up and down
			 */
			this.drawGrid = function (updateChannels) {
				var i = 0;
				var y = 0;
				var x = 0;
				var channel;
				var pointer = 0;
				var rollOn = false;
				var lastEvent;

				eventGrid.clearEvents();

				if (updateChannels) {
					channelIdsToGet = getChannelsIds();
				}

				events = epgEventSupplier(channelIdsToGet, gridStartTime + 60000, gridEndTime - 60000);

				var currentTime = new Date().getTime();

				while (y < channelIdsToGet.length) {
					channel = channelList.getRowAtIndex(y + channelList.getFirstVisibleRowIndex());
					lastEvent = null;
					if (updateChannels) {
						drawChannelItem(y, channel);
					}
					if (channelDataMapper.isBlocked(channel)) {
						createAndDrawDummyEvent(x, y, gridStartTime, gridEndTime, false, true, currentTime);
						x++;
						rollOn = true;
					}
					while (events && events[pointer] && channelIdsToGet[y] === eventDataMapper.getServiceId(events[pointer])) {
						if (!rollOn) {
							// fill the start and middle gaps with dummy events
							if (checkAndfillEventGap(events[pointer], lastEvent, x, y, currentTime)) {
								x++;
							}

							drawGridItem(y, x, events[pointer], currentTime, channel);
							eventGrid.addEventToRow(events[pointer], y + 1);
							lastEvent = events[pointer];
							x++;
						}
						if (x === maxNumOfColumns - 1) {
							rollOn = true;
						}
						pointer++;
					}
					// fill end the gaps with dummy event
					if (checkAndfillEventGap(null, lastEvent, x, y, currentTime)) {
						x++;
					}

					rollOn = false;
					if (x === 0) {
						createAndDrawDummyEvent(x, y, gridStartTime, gridEndTime, true, false, currentTime);
						x++;
					}
					if (lastXs[y] > x) {
						for (i = x; i < lastXs[y]; i++) {
							visibleEvents[y][i].hide();
						}
					}
					lastXs[y] = x;
					x = 0;
					y++;
				}
				if (!updateChannels) {
					this.updateLabels();
				}
				if (gridStartTime < currentTime) {
					atFirstPage = true;
					this.updateTimeLine();
					timeLine.show();
					tlIcon.show();
					this.startMaintainenceProcess();
				} else {
					atFirstPage = false;
					timeLine.hide();
					tlIcon.hide();
					this.stopMaintainenceProcess();
				}
				if (y < numOfRows) {
					blankOutUnusedRows(y);
				}
				this.windowUpdatedCallback(channelList.returnViewableList(), gridStartTime, gridEndTime);
			};

			/**
			 * Maintenance method to scroll the list forward
			 * as soon as the first page of data becomes in the past
			 * @method _autoRollForward
			 * @private
			 */
			this._autoRollForward = function () {
				var me = this;
				var redraw = this.isAtFirstPage();
				var currentTime = new Date().getTime();
				if (redraw) {
					this.activate();
				} else {
					actualStartTime = gridStartTime + gridTimeInMS;
					if (gridStartTime <= currentTime) {
						atFirstPage = true;
						this.updateTimeLine();
						timeLine.show();
						tlIcon.show();
						this.startMaintainenceProcess();
					}
					autoRollForwardTO = setTimeout(function () {me._autoRollForward(me); }, (gridEndTime - currentTime));
				}

			};

			/**
			 * Updates the icons based on the data held in the grid.
			 * @method updateIcons
			 */
			this.updateIcons = function () {
				var events;
				var event;
				var channel;
				var i = 0;
				var j = 0;

				for (i = 1; i <= eventGrid.getNumOfRows(); i++) {
					channel = channelList.getRowAtIndex(i + channelList.getFirstVisibleRowIndex() - 1);
					if (channelDataMapper && channel) {
						visibleChannels[i - 1].setIcon(channelDataMapper.getIcon(channel));
					}
					events = eventGrid.getRowAtIndex(i);
					for (j = 1; j <= events.getSize(); j++) {
						event = events.getRowAtIndex(j);
						if (eventDataMapper && event) {
							event.svg.setIcon(eventDataMapper.getIcon(event, channel));
						}
					}
				}
			};

			/**
			 * Updates the time labels showing the current window
			 * @method updateLabels
			 */
			this.updateLabels = function () {
				var i = 0;
				for (i = 0; i < numOfHours; i++) {
					labels[i].setText("|" + $N.apps.util.Util.timeString(gridStartTime + (i * MS_IN_HOUR)));
				}
			};

			/**
			 * Sets whether the current time indicator should grow instead
			 * of the default moving line
			 * @method setTimeLineGrow
			 * @param {boolean} grow
			 */
			this.setTimeLineGrow = function (grow) {
				timeLineGrow = grow;
			};

			/**
			 * Sets the icon to be used to follow the timeline
			 * @method setTimeLineIcon
			 * @param {String} href
			 */
			this.setTimeLineIcon = function (href) {
				tlIcon.setHref(href);
			};

			/**
			 * Moves or grows the timeline to the current time
			 * @method updateTimeLine
			 */
			this.updateTimeLine = function () {

				var xPos = ((new Date().getTime() - gridStartTime) / MS_IN_HOUR) * pixelsInHr;

				if (timeLineGrow) {
					timeLine.setWidth(xPos);
				} else {
					timeLine.setX(xPos - timeLine.getWidth());
				}
				tlIcon.setX(xPos);
			};

			/**
			 * Applies the expired style to out of date events
			 * @method updateExpiredEvents
			 */
			this.updateExpiredEvents = function () {
				var list = eventGrid.getExpiredEvents();
				var listSize = list.length;
				var i = 0;

				for (i = 0; i < listSize; i++) {
					if (!list[i].svg.getExpired()) {
						list[i].svg.setExpired(true);
					}
				}
			};

			/**
			 * Applies the current style to events inside the current time
			 * @method updateCurrentEvents
			 */
			this.updateCurrentEvents = function () {
				var list = eventGrid.getCurrentEvents();
				var listSize = list.length;
				var i = 0;

				for (i = 0; i < listSize; i++) {
					list[i].svg.setExpired(false, true);
				}
				this.getSelectedEvent().svg.highLight();
			};

			/**
			 * Checks if the current event has become expired and
			 * moved the highlight forward
			 * @method checkAndRollonExpiredSelectedEvent
			 */
			this.checkAndRollonExpiredSelectedEvent = function () {
				if (eventGrid.isCurrentEventExpired()) {
					this.getSelectedEvent().svg.unHighLight();
					eventGrid.selectNextEvent();
					this.getSelectedEvent().svg.highLight();
					this.itemSelectedCallback(this.getSelectedEvent(), this.getSelectedChannel());
				}
			};

			/**
			 * Starts a timer that maintains the correct styles for the events and
			 * updates the timeline
			 * @method startMaintainenceProcess
			 */
			this.startMaintainenceProcess = function () {
				var me = this;
				clearInterval(checkInterval);
				checkInterval = setInterval(function () {
					me.checkAndRollonExpiredSelectedEvent();
					me.updateExpiredEvents();
					me.updateCurrentEvents();
					me.updateTimeLine();
					me.timeUpdatedCallback();
				}, checkIntervalMS);
			};

			/**
			 * Stops the maintenance process useful if scrolled into the future
			 * @method stopMaintainenceProcess
			 */
			this.stopMaintainenceProcess = function () {
				clearInterval(checkInterval);
			};

			/**
			 * Moves the window forward by one whole page
			 * @method pageEventsForward
			 */
			this.pageEventsForward = function () {
				this.getSelectedEvent().svg.unHighLight();
				gridStartTime = gridStartTime + gridTimeInMS;
				gridEndTime = gridStartTime + gridTimeInMS;
				this.drawGrid();
				eventGrid.selectFirstEvent();
				this.getSelectedEvent().svg.highLight();
				this.applySelectionTimeOut(selectedItemTimeOutMS);
			};

			/**
			 * Moves the window back by one whole page
			 * @method pageEventsBack
			 */
			this.pageEventsBack = function () {
				this.getSelectedEvent().svg.unHighLight();
				gridStartTime = gridStartTime - gridTimeInMS;
				gridEndTime = gridStartTime + gridTimeInMS;
				this.drawGrid();
				eventGrid.selectLastEvent();
				this.getSelectedEvent().svg.highLight();
				this.applySelectionTimeOut(selectedItemTimeOutMS);
			};

			/**
			 * Moves to the next event in the grid, pages if required
			 * @method selectNextEvent
			 */
			this.selectNextEvent = function () {
				this.getSelectedEvent().svg.unHighLight();
				eventGrid.selectNextEvent();
				this.getSelectedEvent().svg.highLight();
				this.applySelectionTimeOut(selectedItemTimeOutMS);
			};

			/**
			 * Moves the highlight to the previous event
			 * @method selectPreviousEvent
			 */
			this.selectPreviousEvent = function () {
				this.getSelectedEvent().svg.unHighLight();
				eventGrid.selectPreviousEvent();
				this.getSelectedEvent().svg.highLight();
				this.applySelectionTimeOut(selectedItemTimeOutMS);
			};

			/**
			 * Moves the highlight to the corresponding event on the channel
			 * below the current, pages if required
			 * @method selectNextChannel
			 */
			this.selectNextChannel = function () {
				this.unHighLight();
				if (channelList.selectNext()) {
					if (ignoreKeysOnPageMS > 0) {
						var me = this;
						this.ignoreKeys = true;
						this.ignoreTO = setTimeout(function () {me.ignoreKeys = false; }, ignoreKeysOnPageMS);
					}
					this.drawGrid(true);
				}
				eventGrid.selectRowAtIndex(channelList.getViewSelectedRowIndex());
				this.highLight();
				this.applySelectionTimeOut(selectedItemTimeOutMS);
			};

			/**
			 * Moves the highlight to the corresponding event on the channel
			 * above the current, pages if required
			 * @method selectPreviousChannel
			 */
			this.selectPreviousChannel = function () {
				this.unHighLight();
				if (channelList.selectPrevious()) {
					if (ignoreKeysOnPageMS > 0) {
						var me = this;
						this.ignoreKeys = true;
						this.ignoreTO = setTimeout(function () {me.ignoreKeys = false; }, ignoreKeysOnPageMS);
					}
					this.drawGrid(true);
				}
				eventGrid.selectRowAtIndex(channelList.getViewSelectedRowIndex());
				this.highLight();
				this.applySelectionTimeOut(selectedItemTimeOutMS);
			};

			/**
			 * If not at the first page updates the grid to show
			 * the data for the previous page of channels
			 * @method pageUp
			 */
			this.pageUp = function () {
				this.unHighLight();
				if (channelList.pageUp()) {
					this.drawGrid(true);
					eventGrid.selectRowAtIndex(channelList.getViewSelectedRowIndex());
				}
				this.highLight();
				this.applySelectionTimeOut(selectedItemTimeOutMS);
			};

			/**
			 * If not at the first page updates the grid to show
			 * the data for the next page of channels
			 * @method pageDown
			 */
			this.pageDown = function () {
				this.unHighLight();
				if (channelList.pageDown()) {
					this.drawGrid(true);
					eventGrid.selectRowAtIndex(channelList.getViewSelectedRowIndex());
				}
				this.highLight();
				this.applySelectionTimeOut(selectedItemTimeOutMS);
			};

			/**
			 * Sets up a timer that fires the item selected callback
			 * @method applySelectionTimeOut
			 * @param {Number} timeOutMS
			 */
			this.applySelectionTimeOut = function (timeOutMS) {
				var me = this;
				clearTimeout(this.selectionTimeOut);
				this.selectionTimeOut = setTimeout(function () {me.itemSelectedCallback(me.getSelectedEvent(), me.getSelectedChannel()); }, timeOutMS);
			};

			/**
			 * Entry point for key presses to be handled in the TimedEventGridControlWithChannels object
			 * @method keyHandler
			 * @param key {string} the key that was pressed in the parent view
			 */
			this.keyHandler = function (key) {
				var keys =  $N.gui.FrameworkCore.getKeys();
				var handled = true;
				switch (key) {
				case keys.KEY_OK:
				case keys.KEY_ENTER:
					this.itemOkPressCallback(this.getSelectedEvent(), this.getSelectedChannel());
					break;
				case keys.KEY_UP:
					if (!this.ignoreKeys) {
						this.selectPreviousChannel();
					}
					break;
				case keys.KEY_DOWN:
					if (!this.ignoreKeys) {
						this.selectNextChannel();
					}
					break;
				case keys.KEY_LEFT:
					if (!this.isAtFirstPage() && eventGrid.isSelectedEventAtFirst()) {
						this.pageEventsBack();
					} else {
						this.selectPreviousEvent();
					}
					break;
				case keys.KEY_RIGHT:
					if (eventGrid.isSelectedEventAtLast()) {
						this.pageEventsForward();
					} else {
						this.selectNextEvent();
					}
					break;
				case keys.KEY_FFW:
					this.pageEventsForward();
					break;
				case keys.KEY_REW:
					if (!this.isAtFirstPage()) {
						this.pageEventsBack();
					}
					break;
				case keys.KEY_ONE:
				case keys.KEY_PG_UP:
					this.pageUp();
					handled = true;
					break;
				case keys.KEY_TWO:
				case keys.KEY_PG_DOWN:
					this.pageDown();
					handled = true;
					break;
		        default:
					handled = false;
				}
				return handled;
			};

			/**
			 * Highlights the channel and current event at the given index
			 * @method selectChannelAtIndex
			 * @param {Number} index
			 * @param {boolean} redraw true if grid should be redrawn
			 */
			this.selectChannelAtIndex = function (index, redraw) {
				if (redraw) {
					this.unHighLight();
				}
				channelList.selectRowAtIndex(index);
				eventGrid.selectRowAtIndex(channelList.getViewSelectedRowIndex());
				if (redraw) {
					this.redraw(true);
				}
			};

			/**
			 * Sets the grid into it's initial state with the current event
			 * highlighted
			 * @method activate
			 */
			this.activate = function () {
				var me = this;
				gridStartTime = getCurrentTimeToNearestInterval(this.getInterval());
				gridEndTime = gridStartTime + gridTimeInMS;
				actualStartTime = gridStartTime;
				this.drawGrid(true);
				this.updateLabels();
				eventGrid.selectEventAtCurrentTime();
				this.highLight();
				this.updateTimeLine();
				this.applySelectionTimeOut(selectedItemTimeOutMS);
				autoRollForwardTO = setTimeout(function () {me._autoRollForward(this); }, (gridEndTime - new Date().getTime()));
			};

			/**
			 * Clears the grid highlight and stops any maintenance timers
			 * @method passivate
			 */
			this.passivate = function () {
				this.unHighLight();
				this.stopMaintainenceProcess();
				clearTimeout(autoRollForwardTO);
			};

			/**
			 * Given a number of days from the start day of the grid
			 * redraws the grid to display data for that day
			 * @method jumpToDay
			 * @param {Number} dayFromStart
			 */
			this.jumpToDay = function (dayFromStart) {
				gridStartTime = actualStartTime + (dayFromStart * MS_IN_DAY);
				gridEndTime = gridStartTime + gridTimeInMS;
				this.getSelectedEvent().svg.unHighLight();
				this.drawGrid(false);
				eventGrid.selectFirstEvent();
				this.getSelectedEvent().svg.highLight();
				this.applySelectionTimeOut(selectedItemTimeOutMS);
			};

			/**
			 * Initiates a full redraw of the grid in it's current state
			 * @method redraw
			 * @param {Boolean} updateChannels
			 */
			this.redraw = function (updateChannels) {
				//this.unHighLight();
				this.drawGrid(updateChannels);
				eventGrid.selectFirstEvent();
				this.highLight();
				this.applySelectionTimeOut(selectedItemTimeOutMS);

			};

			/**
			 * Highlights the currently selected event
			 * @method highlight
			 */
			this.highLight = function () {
				visibleChannels[channelList.getViewSelectedRowIndex() - 1].highLight();
				this.getSelectedEvent().svg.highLight();
			};

			/**
			 * Unhighlights the currently select event
			 * @method unHighLight
			 */
			this.unHighLight = function () {
				var event = this.getSelectedEvent();
				visibleChannels[channelList.getViewSelectedRowIndex() - 1].unHighLight();
				if (event) {
					event.svg.unHighLight();
				}
			};

			/**
			 * Sets the width of the TimedEventGridControlWithChannels
			 * @method setWidth
			 * @param {Number} newWidth
			 */
			this.setWidth = function (newWidth) {
				width = newWidth;
				container.setWidth(width);

			};

			/**
			 * Sets the overall height of the grid, the height of the
			 * items are affected
			 * @method setHeight
			 * @param {Number} newHeight
			 */
			this.setHeight = function (newHeight) {
				height = newHeight;
				container.setHeight(height);
				rowHeight = height / numOfRows;
			};

			/**
			 * Sets the number of row (channels) to be displayed
			 * @method setNumOfRows
			 * @param {Number} rows
			 */
			this.setNumOfRows = function (rows) {
				numOfRows = rows;
				channelList.setVisibleRows(numOfRows);
				this.setHeight(rowHeight * numOfRows);
			};

			/**
			 * Sets the number of hours to be used for the window of events
			 * @method setNumOfHours
			 * @param {Number} hours
			 */
			this.setNumOfHours = function (hours) {
				numOfHours = hours;
				gridTimeInMS = hours * MS_IN_HOUR;
				pixelsInHr = this.getWidth() / numOfHours;
			};

			/**
			 * Sets the width of the list of channels
			 * @method setChannelListWidth
			 * @param {Number} width
			 */
			this.setChannelListWidth = function (width) {
				channelListWidth = width;
			};

			/**
			 * Sets the height of the rows in the grid, affecting the overall
			 * height of the TimedEventGridControlWithChannels
			 * @method setRowHeight
			 * @param {Number} newHeight
			 */
			this.setRowHeight = function (newHeight) {
				rowHeight = newHeight;
				container.setHeight(height);
			};

			/**
			 * Sets the interval for the times on the grid
			 * @method setInterval
			 * @param {Number} newInterval
			 */
			this.setInterval = function (newInterval) {
				interval = newInterval;
			};

			/**
			 * Sets the maximum number of events that can be displayed
			 * in the time window
			 * @method setMaxNumOfColumns
			 * @param {Number} number
			 */
			this.setMaxNumOfColumns = function (number) {
				maxNumOfColumns = number;
			};

			/**
			 * Sets the channel data
			 * @method chanData
			 * @param {Object} chanData
			 */
			this.setChannelData = function (chanData) {
				channelData = chanData;
			};

			/**
			 * Sets the object template to be used for events where
			 * there is no data available
			 * @method setDummyEventObj
			 * @param {Object} object
			 */
			this.setDummyEventObj = function (object) {
				dummyEventObj = object;
			};

			/**
			 * Sets the time in milliseconds of the update interval
			 * @method setCheckIntervalMS
			 * @param {Number} timeMS
			 */
			this.setCheckIntervalMS = function (timeMS) {
				checkIntervalMS = timeMS;
			};

			/**
			 * Sets the data associated with the channel list
			 * @method setChannelListData
			 * @param {Object} list
			 */
			this.setChannelListData = function (list) {
				channelList.setData(list);
			};

			/**
			 * Set the delay before the selection callback happens
			 * @method setSelectedItemTimeOutMS
			 * @param {Number} timeMS
			 */
			this.setSelectedItemTimeOutMS = function (timeMS) {
				selectedItemTimeOutMS = timeMS;
			};

			/**
			 * Sets the time to ignore key presses after the grid has been paged
			 * @method setIgnoreKeysOnPageMS
			 * @param {Number} timeMS
			 */
			this.setIgnoreKeysOnPageMS = function (timeMS) {
				ignoreKeysOnPageMS = timeMS;
			};

			/**
			 * Sets the datamapper to be used to draw the event objects
			 * @method setEventDataMapper
			 * @param {Object} dataMapperObj
			 */
			this.setEventDataMapper = function (dataMapperObj) {
				eventDataMapper = dataMapperObj;
			};

			/**
			 * Sets the datamapper to be used to draw the channel objects
			 * @method setChannelDataMapper
			 * @param {Object} dataMapperObj
			 */
			this.setChannelDataMapper = function (dataMapperObj) {
				channelDataMapper = dataMapperObj;
			};

			/**
			 * Sets the EPG event supplier function.
			 * The event supplier function must accept the following parameters;
			 *   (Array) Array of service ids,
			 *   (Date) Window start time,
			 *   (Date) Window end time.
			 * The function should return an array of EPG event objects.
			 * @method setEpgEventSupplier
			 * @param {Function} supplier A function which will provide EPG events
			 */
			this.setEpgEventSupplier = function (supplier) {
				epgEventSupplier = supplier;
			};

			/**
			 * Returns the start time of the current window
			 * @method getGridStartTime
			 * @return {Number}
			 */
			this.getGridStartTime = function () {
				return gridStartTime;
			};

			/**
			 * Returns the start time of the current window
			 * @method getGridEndTime
			 * @return {Number}
			 */
			this.getGridEndTime = function () {
				return gridEndTime;
			};

			/**
			 * Returns the data associated with the currently selected
			 * channel
			 * @method getSelectedChannel
			 * @return {Object} The selected channel item
			 */
			this.getSelectedChannel = function () {
				return channelList.getSelectedItem();
			};

			/**
			 * Returns the data associated with the currently selected
			 * event
			 * @method getSelectedEvent
			 * @return {Object} The selected event item
			 */
			this.getSelectedEvent = function () {
				return eventGrid.getSelectedEvent();
			};

			/**
			 * Returns the width of the TimedEventGridControlWithChannels
			 * @method getWidth
			 * @return {Number}
			 */
			this.getWidth = function () {
				return width;
			};

			/**
			 * Returns the height of the TimedEventGridControlWithChannels
			 * @method getHeight
			 * @return {Number}
			 */
			this.getHeight = function () {
				return height;
			};

			/**
			 * Returns the number of rows in the grid
			 * @method getNumRows
			 * @return {Number}
			 */
			this.getNumRows = function () {
				return numOfRows;
			};

			/**
			 * Returns the number of hours in a grid window
			 * @method getNumOfHours
			 * @return {Number}
			 */
			this.getNumOfHours = function () {
				return numOfHours;
			};

			/**
			 * Returns the height of a row in the TimedEventGridControlWithChannels
			 * @method getRowHeight
			 * @return {Number}
			 */
			this.getRowHeight = function () {
				return rowHeight;
			};

			/**
			 * Returns the interval period for the grid
			 * @method getInterval
			 * @return {Number}
			 */
			this.getInterval = function () {
				return interval;
			};

			/**
			 * Returns the maximum number of events that can be displayed
			 * in a window
			 * @method getMaxNumOfColumns
			 * @return {Number}
			 */
			this.getMaxNumOfColumns = function () {
				return maxNumOfColumns;
			};

			/**
			 * Returns an array of framework objects that represent the channel
			 * list objects.
			 * @method getVisibleChannels
			 * @return {Object}
			 */
			this.getVisibleChannels = function () {
				return visibleChannels;
			};

			/**
			 * Returns true if on the first page of the grid
			 * @method isAtFirstPage
			 * @return {boolean}
			 */
			this.isAtFirstPage = function () {
				return atFirstPage;
			};

			/**
			 * Sets the object to be used to configure icons
			 * displayed in the grid, overrides default styling of
			 * grid items
			 * @method setIconConfiguration
			 * @param {Object} conf
			 */
			this.setIconConfiguration = function (conf) {
				iconConfiguration = conf;
			};

			/**
			 * Sets the wrap around flag to the given value
			 * @method setWrapAround
			 * @param {Boolean} flag
			 */
			this.setWrapAround = function (flag) {
				channelList.setWrapAround(flag);
			};
		}
		$N.gui.Util.extend(TimedEventGridControlWithChannels, $N.gui.GUIObject);

		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.TimedEventGridControlWithChannels = TimedEventGridControlWithChannels;
		return TimedEventGridControlWithChannels;
	}
);