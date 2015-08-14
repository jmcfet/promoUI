/*global $N*/
(function ($N) {
	$N.app = $N.app || {};
	$N.app.errorCodes = {
		NOW: {
			USER_HARDWARE_FAULT_OR_BAD_USAGE_ID: "T03-0",
			MDS_DATA_FAILURE: "T03-1",
			PORTAL_DATA_FAILURE: "T03-2",
			TRAXIS_DATA_FAILURE: "T03-3",
			PLAYBACK_FAILURE: "T03-4",
			CANNOT_START_PURCHASE: "T03-5",
			CANNOT_COMPLETE_PURCHASE: "T03-6",
			MDS_ASSET_NOT_FOUND: "T03-7"
		},
		DEFAULT: "T03"
	};
}($N || {}));
