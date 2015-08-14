/**
 * The CAKHandler interface describes the events used within this project .
 *
 * @class $N.app.CAKHandler
 * @interface
 * @requires $N.apps.core.Log
 */
(function ($N) {
	function CAKHandler() {
		this._log = new $N.apps.core.Log("ca", "CAKHandler");
	}

	CAKHandler.prototype.SmartcardRemovedListener = function () {
		this._log("ca", "interface SmartcardRemovedListener");
	};

	CAKHandler.prototype.SmartcardInsertedListener = function () {
		this._log("ca", "interface SmartcardInsertedListener");
	};

	CAKHandler.prototype.SmartcardUpdatedListener = function () {
		this._log("ca", "interface SmartcardUpdatedListener");
	};

	CAKHandler.prototype._showError = function () {
		this._log("ca", "interface _showError");
	};

	$N = $N || {};
	$N.app = $N.app || {};
	$N.app.CAKHandler = CAKHandler;

}($N || {}));