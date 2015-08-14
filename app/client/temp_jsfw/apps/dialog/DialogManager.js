/**
 * Class which manages the display of Dialogs and makes sure only one dialog is presented to the user at any time.
 * Also supports priorities for individual dialogs.
 * Example usage:
 *
 *     var dialog = new $N.apps.dialog.BasicDialog("dialog", "Dialog", "Very good morning.");
 *     $N.apps.dialog.DialogManager.showDialog(dialog, $N.apps.dialog.DialogManager.MEDIUM_PRIORITY, 5000, callbackFunction, callbackFunction, callbackFunction);
 *     // to manually hide the dialog
 *     $N.apps.dialog.DialogManager.hideDialog(dialog);
 *
 * Logic: When the application wants to show a dialog, it calls `showDialog` method. `$N.apps.dialog.DialogManager` wraps this object
 * and adds additional callback methods to it. This new object is called `wrappedDialog` (or simply dialog in some places)
 * Every dialog can be identified using an id parameter.
 * @class $N.apps.dialog.DialogManager
 * @static
 */

/*global setTimeout,clearTimeout,setInterval,clearInterval*/
define('jsfw/apps/dialog/DialogManager',
	[
		'jsfw/apps/core/Log',
		'jsfw/apps/core/KeyInterceptor'
	],
	function (Log, KeyInterceptor) {
		window.$N = $N || {};
		$N.apps = $N.apps || {};
		$N.apps.dialog = $N.apps.dialog || {};
		$N.apps.dialog.DialogManager = (function () {

			var log = new $N.apps.core.Log("dialog", "DialogManager"),
				QUEUE_TIMER = 1000,
				currentDialog = null,
				frozenDialogs = [],
				queueWatcherTimer = null,
				dialogQueueDS = null,
				dialogIdMapping = null,
				persistentDialogs = [],
				defaultDialogSizeAndPosition = {width: 400, height: 200, x: 440, y: 200};

			// Private helper methods

			/**
			 * Method to start the dialog watch timer. By default clears out any existing timers and hence safe.
			 * Logic: Create a dynamic variable called _dialogWatchTimer in the wrapped dialog object.
			 * @method startDialogWatchTimer
			 * @private
			 * @param {Object} wrappedDialog Wrapped dialog object.
			 */
			function startDialogWatchTimer(wrappedDialog) {
				// Does the dialog support autoclose?
				if (wrappedDialog && wrappedDialog.autoCloseInterval) {
					log("startDialogWatchTimer", "Dialog " + String(wrappedDialog.id) + " will get closed automatically in " + (wrappedDialog.autoCloseInterval / 1000).toString() + " secs");
					// Clear any existing timers. We are safe to do this, since we are going to show only one dialog at a time.
					if (wrappedDialog._dialogWatchTimer) {
						clearTimeout(wrappedDialog._dialogWatchTimer);
					}
					wrappedDialog._dialogWatchTimer = setTimeout(function () {hide(wrappedDialog, true); }, wrappedDialog.autoCloseInterval);
				}
			}

			/**
			 * Method to stop a dialogue watch timer
			 * @method stopDialogWatchTimer
			 * @private
			 * @param {Object} wrappedDialog Wrapped Dialog for which timer should be suspended.
			 */
			function stopDialogWatchTimer(wrappedDialog) {
				if (wrappedDialog && wrappedDialog._dialogWatchTimer) {
					log("stopDialogWatchTimer", "stopDialogWatchTimer started");
					clearTimeout(wrappedDialog._dialogWatchTimer);
				}
			}

			/**
			 * Keyhandler function that simply transfers the key press to the dialog.
			 * The advantage of this approach being that no dialog gets control of the key interceptor and hence
			 * it is possible to close dialog's reliably any time.
			 * @method keyHandler
			 * @private
			 * @param {String} key Key.
			 * @return {Boolean} True if the key got handled. False otherwise.
			 */
			function keyHandler(key) {
				log("keyHandler", "started with key: " + key);

				var handled = false,
					wrappedDialog,
					dialog;
				if (currentDialog && currentDialog.id && dialogIdMapping && dialogIdMapping[currentDialog.id]) {
					wrappedDialog = dialogIdMapping[currentDialog.id];
					dialog = currentDialog;

					if (dialog && dialog.keyHandler) {
						// Restart dialog watch timer.
						// This logic implies that all dialogs without keyhandler will get closed despite keys getting pressed.
						startDialogWatchTimer(wrappedDialog);
						handled = dialog.keyHandler(key);
					}
				}
				return handled;
			}

			/**
			 * Starts a timer that watches the queue and displays dialog.
			 * @method startQueueWatcher
			 * @private
			 */
			function startQueueWatcher() {
				if (!queueWatcherTimer) {
					log("startQueueWatcher", "started");
					processQueue();
					queueWatcherTimer = setInterval(function () { processQueue(); }, QUEUE_TIMER);
				}
			}

			/**
			 * Returns true if the given dialog is a persistent dialog
			 * @method isDialogPersistent
			 * @private
			 * @param {Object} dialog
			 * @return {Boolean} true if is persistent false if not
			 */
			function isDialogPersistent(dialog) {
				var i;
				for (i = 0; i < persistentDialogs.length; i++) {
					if (dialog.id === persistentDialogs[i].id) {
						return true;
					}
				}
				return false;
			}

			/**
			 * Method to un-freeze a dialog, make it visible.
			 * @method unfreeze
			 * @private
			 * @param {Object} dialog Dialog to freeze.
			 */
			function unfreeze(dialog) {
				var wrappedDialog = dialogIdMapping[dialog.id];
				currentDialog = dialog;

				// Call show again. Show method does the correct thing by re-using existing view.
				dialog.show();

				// Start the dialog watch timer.
				startDialogWatchTimer(wrappedDialog);
				startQueueWatcher();
			}

			/**
			 * Private method which ultimately hides a dialog.
			 * @method hide
			 * @private
			 * @param {Object} wrappedDialog Wrapped Dialog to hide.
			 * @param {Boolean} timedOut variable to denote if autoclosed or not
			 * @return {Boolean} True if the dialog got closed successfully. False otherwise.
			 */
			function hide(wrappedDialog, timedOut) {
				log("hide", "Enter");
				if (!wrappedDialog) {
					log("hide", "Exit 1, returning false");
					return false;
				}

				// Un-register the key interceptor.
				log("hide", "unregisterInterceptor");
				$N.apps.core.KeyInterceptor.unregisterInterceptor(keyHandler);

				// Clear out the mapping that we have.
				if (wrappedDialog.id && dialogIdMapping) {
					dialogIdMapping[wrappedDialog.id] = null;
				}
				if (isDialogPersistent(wrappedDialog)) {
					persistentDialogs.pop();
				} else if (frozenDialogs.length > 0) {
					frozenDialogs.pop();
				}

				wrappedDialog.dialogObj.hide();
				log("hide", "Dialog " + wrappedDialog.id + " just got hidden.");

				// Call the hidden callback with the last key press.
				if (timedOut && wrappedDialog.onTimedOutCallback) {
					wrappedDialog.onTimedOutCallback();
				}

				// Clear the current dialog.
				currentDialog = null;

				// Stop the watch timer.
				stopDialogWatchTimer(wrappedDialog);

				// If there is any freezed dialog available, re-enable them.
				if (persistentDialogs.length !== 0) {
					unfreeze(persistentDialogs[persistentDialogs.length - 1]);
					log("hide", "Exit 2, returning true");
					return true;
				} else if (frozenDialogs.length > 0) {
					unfreeze(frozenDialogs[frozenDialogs.length - 1]);
					log("hide", "Exit 3, returning true");
					return true;
				}

				// Start the queue watcher, when a dialog gets shown. Part of the timer optimisation strategy.
				startQueueWatcher();
				log("hide", "Exit 4, returning true");
				return true;
			}

			/**
			 * Private method which ultimately shows a dialog.
			 * @method show
			 * @private
			 * @param {Object} wrappedDialog Wrapped Dialog to show.
			 */
			function show(wrappedDialog) {
				log("show", "Enter");
				if (!wrappedDialog) {
					log("show", "Exit 1");
					return;
				}

				// Register the key interceptor.
				log("show", "registerInterceptor");
				$N.apps.core.KeyInterceptor.registerInterceptor(keyHandler, this);

				// Show the dialog.
				wrappedDialog.dialogObj.show();

				// Store the current dialog that is shown.
				currentDialog = wrappedDialog.dialogObj;

				// Call the shown callback
				if (wrappedDialog.onShownCallback) {
					wrappedDialog.onShownCallback();
				}

				// Start the watch timer.
				startDialogWatchTimer(wrappedDialog);
				log("show", "Exit 2, Dialog " + wrappedDialog.id + " just got shown");
			}

			/**
			 * Method to freeze a dialog, make it invisible.
			 * @method freeze
			 * @private
			 * @param {Object} dialog Dialog to freeze.
			 */
			function freeze(dialog) {
				var wrappedDialog = dialogIdMapping[dialog.id];
				stopDialogWatchTimer(wrappedDialog);
				if (!isDialogPersistent(dialog)) {
					if (frozenDialogs.length === 0 || frozenDialogs[frozenDialogs.length - 1].id !== dialog.id) {
						frozenDialogs.push(dialog);
					}
				}

				// Call hide with freeze set to true.
				dialog.hide(true);
			}

			/**
			 * Method to get the priority of a dialog.
			 * @method getPriority
			 * @private
			 * @param {Object} dialog Dialog for which the priority is to be determined.
			 * @return {Number}
			 */
			function getPriority(dialog) {
				var wrappedDialog = dialogIdMapping[dialog.id];
				if (!dialog || !dialog.id || !dialogIdMapping) {
					return null;
				}

				if (!wrappedDialog || !wrappedDialog.priority) {
					return null;
				}
				return wrappedDialog.priority;
			}

			/**
			 * Private method to get the next dialog from the queue.
			 * @method getNextDialog
			 * @private
			 * @param {String} id (optional) to get the exact dialog matching the id.
			 * @param {Number} priority (optional) priority of the next dialog.
			 * @return {Object} wrapped dialog object from the queue. Null if there isn't any.
			 */
			function getNextDialog(id, priority) {
				log("getNextDialog", "getNextDialog started");

				var dialog = null,
					tmpDialog,
					dialogList,
					j,
					i,
					priorityCycle = null;

				if (!dialogQueueDS) {
					return null;
				}

				// If a priority is specified use it. Else cycle normally.
				if (priority) {
					priorityCycle = [priority];
				} else {
					priorityCycle = [$N.apps.dialog.DialogManager.VERY_HIGH_PRIORITY, $N.apps.dialog.DialogManager.HIGH_PRIORITY, $N.apps.dialog.DialogManager.MEDIUM_PRIORITY, $N.apps.dialog.DialogManager.LOW_PRIORITY];
				}
				/*jslint forin:true*/
				for (j in priorityCycle) {
					dialogList = dialogQueueDS[priorityCycle[j]];
					// If there is no dialog with this priority, find the next.
					log("processQueue", "Number of dialogs: " + (dialogList ? dialogList.length : 0));
					if (dialogList && dialogList.length > 0) {
						// If no id is passed, pick the one at the top.
						if (!id) {
							log("getNextDialog", "popping top");
							dialog = dialogList.pop();
							while (!dialog && (dialogList.length > 0)) {
								dialog = dialogList.pop();
							}
						} else { // Do id match.
							for (i in dialogList) {
								tmpDialog = dialogList[i];
								log("getNextDialog", id);
								log("getNextDialog", (tmpDialog ? tmpDialog.id : "xxxx"));
								if (tmpDialog && tmpDialog.id === id) {
									dialog = tmpDialog;
									dialogList[i] = null;
									break;
								}
							}
						}
						return dialog;
					}
				}
				/*jslint forin:false*/
				return null;
			}

			/**
			 * Private method to stop a timer that watches the queue.
			 * @method stopQueueWatcher
			 * @private
			 */
			function stopQueueWatcher() {
				log("stopQueueWatcher", "started");
				if (queueWatcherTimer) {
					clearInterval(queueWatcherTimer);
					queueWatcherTimer = null;
				}
			}

			/**
			 * Method that process the dialog queue and displays dialog.
			 * @method processQueue
			 * @private
			 */
			function processQueue() {
				log("processQueue", "started");
				var currentDialogPriority,
					nextImmDialog = null,
					nextDialog;

				// Find if there are any very high priority dialog that should get shown immediately.
				if (currentDialog) {
					currentDialogPriority = getPriority(currentDialog);
					if (currentDialogPriority !== $N.apps.dialog.DialogManager.VERY_HIGH_PRIORITY) {
						// Check if we have any very high priority dialog to show.
						nextImmDialog = getNextDialog(null, $N.apps.dialog.DialogManager.VERY_HIGH_PRIORITY);
					}

					// If there is a very high priority dialog available, try to show it.
					if (nextImmDialog) {
						// Freeze the current dialog and make the new dialog visible.
						log("processQueue", "Freezing current dialog - " + currentDialog.id + " to show " + nextImmDialog.id);
						freeze(currentDialog);
						show(nextImmDialog);
						return;
					}
					log("processQueue", "Dialog " + currentDialog.id + " is visible currently. Waiting for close.");
					stopQueueWatcher();
					return;
				}

				// Get the next dialog from the queue.
				nextDialog = getNextDialog(null, null);
				// No more dialog, stop watching!
				if (!nextDialog) {
					log("processQueue", "Nothing in the dialog queue!");
					stopQueueWatcher();
				} else {
					log("processQueue", "About to show dialog - " + nextDialog.id);
					show(nextDialog);
				}
			}

			/**
			 * Private method to add a dialog to the queue.
			 * @method addToQueue
			 * @private
			 * @param {Object} dialogObj Dialog object.
			 * @param {Number} priority Priority of this dialog.
			 * @param {Number} autoCloseInterval Interval after which the dialog should get closed automatically.
			 * @param {Function} onQueuedCallback Callback to be invoked, if this dialog gets queued.
			 * @param {Function} onShownCallback Callback to be invoked, if this dialog gets shown.
			 * @param {Function} onTimedOutCallback Callback to be invoked, if this dialog gets closed/hidden.
			 * @param {Boolean} isPersistent Flag to indicate if this dialog is persistent
			 * @return {Boolean} True if the object was queued successfully. False otherwise.
			 */
			function addToQueue(dialogObj, priority, autoCloseInterval, onQueuedCallback, onShownCallback, onTimedOutCallback, isPersistent) {
				log("addToQueue", "started");

				var wrappedDialog,
					dialogList;

				dialogQueueDS = dialogQueueDS || {};
				dialogIdMapping = dialogIdMapping || {};

				// Check if the dialog object has an id.
				if (!dialogObj.id) {
					log("addToQueue", "dialog object doesn't have id attribute.", "warn");
					return false;
				}

				// Add only if there is no dialog in the queue with the same id. This is to prevent code
				// from going mad and sending the same dialog again and again. (Read: Invalid tuning parameter dialog)
				if (dialogIdMapping[dialogObj.id]) {
					log("addToQueue", "Dialog with the same id already exist");
					return false;
				}

				wrappedDialog = {
					id : dialogObj.id,
					dialogObj : dialogObj,
					priority : priority,
					autoCloseInterval : autoCloseInterval,
					onQueuedCallback : onQueuedCallback,
					onShownCallback : onShownCallback,
					onTimedOutCallback : onTimedOutCallback
				};

				dialogIdMapping[dialogObj.id] = wrappedDialog;

				log("addToQueue", "Added with id = " + dialogObj.id);

				//Persistent dialogs need not go to the queue and will get shown immediately.
				if (isPersistent) {
					persistentDialogs.push(dialogObj);
					if (currentDialog) {
						freeze(currentDialog);
					}
					show(wrappedDialog); // Show the dialog.
					return true;
				}

				dialogList = dialogQueueDS[priority] || [];
				dialogList.unshift(wrappedDialog);

				dialogQueueDS[priority] = dialogList;
				dialogList = null;

				// Call the on queued callback if present.
				if (onQueuedCallback) {
					onQueuedCallback();
				}
				startQueueWatcher(); // Start the queue watcher.
				return true;
			}

			/**
			 * Private method to remove a dialog from the queue.
			 * @method removeFromQueue
			 * @private
			 * @param {Object} dialog Wrapped dialog that needs to be removed.
			 * @return {Boolean} True if the dialog was present and removed from the queue successfully. False otherwise.
			 */
			function removeFromQueue(dialog) {
				log("removeFromQueue", "started");
				if (!dialog || !dialogQueueDS) {
					log("removeFromQueue", "Early out [1]");
					return false;
				}

				// Call getNextDialog with the id. It will automatically remove the dialog from the queue.
				if (!getNextDialog(dialog.id, null)) {
					log("removeFromQueue", "Early out [2]");
					return false;
				}
				return true;
			}

			// public API

			return {

				keyHandler: keyHandler,

				/**
				 * Constant to denote dialog has no priority
				 * @property {Number} NO_PRIORITY
				 * @static
				 * @readonly
				 */
				NO_PRIORITY: -1,

				/**
				 * Constant to denote dialog has low priority
				 * @property {Number} LOW_PRIORITY
				 * @static
				 * @readonly
				 */
				LOW_PRIORITY: 1,

				/**
				 * Constant to denote dialog has medium priority
				 * @property {Number} MEDIUM_PRIORITY
				 * @static
				 * @readonly
				 */
				MEDIUM_PRIORITY: 2,

				/**
				 * Constant to denote dialog has high priority
				 * @property {Number} HIGH_PRIORITY
				 * @static
				 * @readonly
				 */
				HIGH_PRIORITY: 3,

				/**
				 * Constant to denote dialog has very high priority
				 * @property {Number} VERY_HIGH_PRIORITY
				 * @static
				 * @readonly
				 */
				VERY_HIGH_PRIORITY: 4,

				/**
				 * The time (in milliseconds) a dialog will get shown for if not explicitly set
				 * @property {Number} DEFAULT_AUTO_CLOSE_TIMEOUT
				 * @static
				 */
				DEFAULT_AUTO_CLOSE_TIMEOUT: 30000,

				/**
				 * Displays a dialog on the screen. Pass null for parameters that you don't want.
				 * @method showDialog
				 * @param {Object} dialogObj Dialog object.
				 * @param {Number} priority Priority of this dialog.
				 * @param {Number} autoCloseMillis Interval after which the dialog should get closed automatically.
				 * @param {Function} onQueuedCallback Callback to be invoked, if this dialog gets queued.
				 * @param {Function} onShownCallback Callback to be invoked, if this dialog gets shown.
				 * @param {Function} onTimedOutCallback Callback to be invoked, if this dialog gets closed / hidden.
				 * @return {Boolean} true if the dialog gets queued correctly, false if there is any error.
				 */
				showDialog: function (dialogObj, priority, autoCloseMillis, onQueuedCallback, onShownCallback, onTimedOutCallback) {
					log("showDialog", "started");

					if (!dialogObj) {
						return false;
					}
					if (!priority || priority < $N.apps.dialog.DialogManager.LOW_PRIORITY) {
						priority = $N.apps.dialog.DialogManager.LOW_PRIORITY;
					} else if (priority > $N.apps.dialog.DialogManager.VERY_HIGH_PRIORITY) { // If you are greedy, you will be punished.
						priority = $N.apps.dialog.DialogManager.HIGH_PRIORITY;
					}

					return addToQueue(dialogObj, priority, autoCloseMillis, onQueuedCallback, onShownCallback, onTimedOutCallback, false);
				},

				/**
				 * Method to show a dialog that will be persistent, unless hidden by an application.
				 * Common use case is fingerprint.
				 * @method showPersistentDialog
				 * @param {Object} dialogObj Dialog object
				 * @return {Boolean} true if the dialog got shown successfully; false otherwise.
				 */
				showPersistentDialog: function (dialogObj) {
					return addToQueue(dialogObj, $N.apps.dialog.DialogManager.NO_PRIORITY, null, null, null, null, true);
				},

				/**
				 * Method to close a dialog if you know just the id alone.
				 * @method hideDialogWithId
				 * @param {String} id Id of the dialog to close.
				 * @return {Boolean} True if the dialog got hidden successfully; false otherwise.
				 */
				hideDialogWithId: function (id) {
					if (!id || !dialogIdMapping) {
						log("hideDialogWithId", "Early out [1]");
						return false;
					}

					// Get the wrapped dialog from our lookup map.
					var wrappedDialog = dialogIdMapping[id];
					if (!wrappedDialog || !wrappedDialog.dialogObj) {
						log("hideDialogWithId", "Early out [2]");
						log("hideDialogWithId", id);
						log("hideDialogWithId", wrappedDialog);
						log("hideDialogWithId", (wrappedDialog ? wrappedDialog.dialogObj : "ignored"));
						return false;
					}

					return $N.apps.dialog.DialogManager.hideDialog(wrappedDialog.dialogObj);
				},

				/**
				 * Method to hide a dialog.
				 * @method hideDialog
				 * @param {Object} dialogObj dialog to be hidden.
				 * @return {Boolean} True if the dialog got hidden successfully; false otherwise.
				 */
				hideDialog: function (dialogObj) {
					log("hideDialog", "started");
					if (!dialogObj || dialogObj.id === null) {
						log("hideDialog", "Early out [1]");
						return false;
					}

					if (!dialogIdMapping) {
						log("hideDialog", "Early out [2]");
						return false;
					}

					// Get the wrapped dialog from our lookup map.
					var wrappedDialog = dialogIdMapping[dialogObj.id];
					if (!wrappedDialog) {
						log("hideDialog", "Early out [3]");
						return false;
					}

					// Remove the dialog if it is currently queued.
					removeFromQueue(wrappedDialog);
					return hide(wrappedDialog);
				},

				/**
				 * Sets the object containing `x`, `y`, `width` and `height` properties
				 * that represent the default values that should be used to display
				 * dialogs.
				 * @method setDefaultDialogSizeAndPosition
				 * @param {Object} confObj
				 */
				setDefaultDialogSizeAndPosition: function (confObj) {
					defaultDialogSizeAndPosition = confObj;
				},

				/**
				 * Returns an object containing `x`, `y`, `width` and `height` properties
				 * that represent the default values that should be used to display
				 * dialogs. Properties will be null if no default is set.
				 * @method getDefaultDialogSizeAndPosition
				 * @return {Object}
				 */
				getDefaultDialogSizeAndPosition: function () {
					return defaultDialogSizeAndPosition ||
						{
							x: null,
							y: null,
							width: null,
							height: null
						};
				},

				/**
				 * Returns a handle to the currently displayed dialog.
				 * @method getCurrentDialog
				 * @return {Object} The dialog that is currently displayed. Null if no dialog is
				 * currently visible.
				 */
				getCurrentDialog: function () {
					return currentDialog;
				}
			};

		}());
		return $N.apps.dialog.DialogManager;
	}
);