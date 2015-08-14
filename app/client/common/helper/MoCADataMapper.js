/**
 * MoCA configuration data mapper class.
 * @class $N.app.MoCADataMapper
 * @static
 * @author rvaughan
 */
(function ($N) {
	"use strict";

	function MoCADataMapper(data) {
		this._configData = data;
	}


	MoCADataMapper.prototype.getStatus = function () {
		if (this._configData.enabled) {
			return "Enabled";
		} else {
			return "Disabled";
		}
	};

	MoCADataMapper.prototype.setStatus = function (status) {
		if (status === "Enabled") {
			this._configData.enabled = true;
		} else {
			this._configData.enabled = false;
		}
	};

	$N.app.MoCADataMapper = MoCADataMapper;

}($N || {}));
