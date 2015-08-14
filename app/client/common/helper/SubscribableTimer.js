/**
 * Subscribable Timer
 * Any number of listeners can be registered and will be called back every x seconds.
 *
 * @class $N.app.SubscribableTimer
 * @author nwilliam
 * @constructor
 * @requires $N.apps.util.Clock
*/
(function ($N) {
	"use strict";
	var SubscribableTimer = function (granularitySeconds) {
		var me = this,
			callback = function (date) {
				me._callbackListeners(date);
			};
		this._granularitySeconds =  granularitySeconds;
		this._clock = new $N.apps.util.Clock(this._granularitySeconds, callback);
		this._listeners = [];
		this._clock.activate();
	};

	/**
	 * Loops through and calls the callbacks that are registered and enabled
	 * @method _callbackListeners
	 * @param {object} date
	 * @private
	 */
	SubscribableTimer.prototype._callbackListeners = function (date) {
		var key;
		for (key in this._listeners) {
			if (this._listeners.hasOwnProperty(key) && this._listeners[key].enabled && this._listeners[key].callback) {
				this._listeners[key].callback(date);
			}
		}
	};

	/**
	 * Registers a call back with the given name, if it does not already exist it is created
	 * @method register
	 * @param {string} name
	 * @param {function} callback
	 * @param {boolean} (optional) enabled - if not provided will default to false
	 */
	SubscribableTimer.prototype.register = function (name, callback, enabled) {
		if (!this._listeners[name]) {
			this._listeners[name] = {
				callback: callback,
				enabled: (enabled) ? true : false
			};
		}
	};

	/**
	 * Unregisters a call back with the given name, if it exist it is removed
	 * @method unregister
	 * @param {string} name
	 */
	SubscribableTimer.prototype.unregister = function (name) {
		if (this._listeners[name]) {
			delete this._listeners[name];
		}
	};

	/**
	 * Enables a call back with the given name, if it exists.
	 * @method enable
	 * @param {string} name
	 */
	SubscribableTimer.prototype.enable = function (name) {
		if (this._listeners[name]) {
			this._listeners[name].enabled = true;
		}
	};

	/**
	 * Disables a call back with the given name, if it exists.
	 * @method disable
	 * @param {string} name
	 */
	SubscribableTimer.prototype.disable = function (name) {
		if (this._listeners[name]) {
			this._listeners[name].enabled = false;
		}
	};

	$N.app = $N.app || {};
	$N.app.SubscribableTimer = SubscribableTimer;
}($N || {}));
