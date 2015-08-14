$N = $N || {};
$N.app = $N.app || {};
$N.app.Version = {
	app_version: "NET-2.1-RGN-DEV-3472-137520",

	updateSWVersion: function () {
		var ccomLocation = "/system/softwareUserInterfaceVersion",
			ccomAppVersion = CCOM.ConfigManager.getValue(ccomLocation).keyValue,
			thisAppVersion = $N.app.Version.app_version;

		if (!thisAppVersion || thisAppVersion.substr(0, 13) === "__GRAVITY_VER") {
			// most likely a developer's version not built by Jenkins
			return;
		}

		if (ccomAppVersion !== thisAppVersion) {
			// only write when we have to, and avoid overwriting to flash
			CCOM.ConfigManager.setValue(ccomLocation, thisAppVersion);
		}
	}
};
