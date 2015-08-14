/**
 *
 * @class $N.app.LoadingTimeout
 * @param {Object} docRef
 * @static
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.LoadingTimeout = function (docRef) {

		return {
			/**
			 * @method setLoading
			 * @param {Boolean} isLoading
			 */
			setLoading: function (isLoading) {
				var me = this;
				if (isLoading) {
					if (this._hideTimeoutId) {
						clearTimeout(this._hideTimeoutId);
						this._hideTimeoutId = null;
					}
					if (!docRef.isVisible() && !this._revealTimeoutId) {
						this._revealTimeoutId = setTimeout(function () {
							clearTimeout(me._revealTimeoutId);
							me._revealTimeoutId = null;
							docRef.show();
							me._hideEarliestTime = Date.now() + me._revealDelay;
						}, this._revealDelay);
					}
				} else {
					if (this._revealTimeoutId) {
						clearTimeout(this._revealTimeoutId);
						this._revealTimeoutId = null;
					}
					if (docRef.isVisible() && !this._hideTimeoutId) {
						this._hideTimeoutId = setTimeout(function () {
							clearTimeout(me._hideTimeoutId);
							me._hideTimeoutId = null;
							docRef.hide();
						}, Math.max(this._hideEarliestTime - Date.now(), 0));
					}
				}
			}

		};
	};
}($N || {}));
