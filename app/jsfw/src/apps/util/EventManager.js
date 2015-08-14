/**
 * EventManager allows functions and classes to create and fire custom events. Listeners can be
 * registered that will get called when an event is fired. e.g. a list object may fire an "item
 * selected" event and a another object may have registered to code to execute on selection.
 * Currently relies on DOM events but can be modified if browser support doesn't exist.
 *
 * @class $N.apps.util.EventManager
 * @static
 */

/*
 * rename unSubscribeAll to be appropriate for eventName
 * add unsubscribe for context and callback
 * Test
 */

define('jsfw/apps/util/EventManager',
	[],
	function () {
		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.util = $N.apps.util || {};

		$N.apps.util.EventManager = (function () {

			var evMap = {};
			var subMap = {};
			var nextSubID = 1;

			var Subscription = function (callback, context) {
				this.id = nextSubID++;
				this.listener = function (data) {
					callback.call(context, data);
				};
			};

			var getIndexOfSub = function (id, subArray) {
				var i;
				for (i = 0; i < subArray.length; i++) {
					if (subArray[i].id === id) {
						return i;
					}
				}
			};

			var removeSub = function (id) {
				subMap[id] = null;
				delete subMap[id];
			};

			return {
				/**
				 * Creates an event with the given unique name if it doesn't exist already
				 *
				 * @method create
				 * @param {String} eventName
				 * @return {Boolean} true if successful.
				 */
				create: function (eventName) {
					var newEvent;
					if (eventName && !evMap[eventName]) {
						newEvent = window.document.createEvent("Event");
						newEvent.initEvent(eventName, true, true);
						evMap[eventName] = {
							name: eventName,
							ev: newEvent,
							subs: []
						};
					} else {
						throw "EventManager: create - Invalid event name passed, blank or exists!";
					}
					return true;
				},

				/**
				 * Deletes a previously created event of the given name
				 *
				 * @method remove
				 * @param {String} eventName
				 * @return {Boolean} true if successful.
				 */
				remove: function (eventName) {
					if (eventName && evMap[eventName]) {
						evMap[eventName].ev = null;
						evMap[eventName].subs = null;
						evMap[eventName] = null;
						delete evMap[eventName];
					} else {
						throw "EventManager: remove - Cannot remove an event that does not exist!";
					}
					return true;
				},

				/**
				 * Fires the event identified by the given name and passes over the given dataObject in the
				 * events data property
				 *
				 * @method fire
				 * @param {String} eventName
				 * @param {Object} dataObj
				 * @return {Boolean} true if successful.
				 */
				fire: function (eventName, dataObj) {
					var theEvent;
					if (eventName && evMap[eventName]) {
						theEvent = evMap[eventName].ev;
						theEvent.data = dataObj;
						window.document.dispatchEvent(theEvent);
					} else {
						throw "EventManager: fire - Attempted to fire an event that does not exist!";
					}
					return true;
				},

				/**
				 * Registers the given callback function to the event identified by the given name
				 *
				 * @method subscribe
				 * @param {String} eventName name of the event
				 * @param {Function} callback function to be invoked when the event is fired
				 * @param {Object} context reference to the calling context, normally 'this'
				 * @return {Number} unique subscription id
				 */
				subscribe: function (eventName, callback, context) {
					var sub;
					if (eventName && callback && context) {
						sub = new Subscription(callback, context);
						subMap[sub.id] = evMap[eventName];
						evMap[eventName].subs.push(sub);
						window.document.addEventListener(eventName, sub.listener, false);
					} else {
						throw "EventManager: subscribe - Mandatory arguments not provided!";
					}
					return sub.id;
				},

				/**
				 * Unsubscribes a previously registered callback using the given subscription id
				 *
				 * @method unSubscribe
				 * @param {Number} subscriptionId id that was returned by the `subscribe` call
				 */
				unSubscribe: function (subscriptionId) {
					var theEvent,
						subIndex;
					if (subscriptionId && subMap[subscriptionId]) {
						theEvent = subMap[subscriptionId];
						subIndex = getIndexOfSub(subscriptionId, theEvent.subs);
						window.document.removeEventListener(theEvent.name, theEvent.subs[subIndex].listener, false);
						removeSub(subscriptionId);
						theEvent.subs.splice(subIndex, 1);
					} else {
						throw "EventManager: unSubscribe - Mandatory arguments not provided or subscription no longer exists!";
					}
				},

				/**
				 * Unsubscribes all callbacks registered against the given event name
				 *
				 * @method unSubscribeAll
				 * @param {String} eventName
				 */
				unSubscribeAll: function (eventName) {
					var theEvent,
						eventSubs,
						i;

					if (eventName && evMap[eventName]) {
						theEvent = evMap[eventName];
						eventSubs = theEvent.subs;
						for (i = 0; i < eventSubs.length; i++) {
							window.document.removeEventListener(theEvent.name, eventSubs[i].listener, false);
							removeSub(eventSubs[i].id);
						}
						eventSubs = [];
					} else {
						throw "EventManager: unSubscribeAll - Argument not provided or event doesn't exist!";
					}
				}
			};

		}());
		return $N.apps.util.EventManager;
	}
);