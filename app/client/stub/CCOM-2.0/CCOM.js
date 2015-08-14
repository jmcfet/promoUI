window.gc = function () {};

var CCOM = CCOM || {};
CCOM.stubs = CCOM.stubs || (function () {
	var CCOM_STUBS_VERSION = "1.0.0",
		supportedMWVersions = ["5.0", "5.1.1"],
		currentMWVersion = "5.1.1"; // currently emulated MW version

	return {
		log: function (msg) {
			if (console && console.log) {
				console.log("[CCOM.stub.log] " + msg);
			}
		},

		getVersion: function () {
			return CCOM_STUBS_VERSION;
		},

		getSupportedMWVersions: function () {
			return supportedMWVersions;
		},

		getCurrentMWVersion: function () {
			return currentMWVersion;
		},

		require: function (ver) {
			var version;
			for (version in supportedMWVersions) {
				if (supportedMWVersions.hasOwnProperty(version)) {
					if (ver === supportedMWVersions[version]) {
						currentMWVersion = supportedMWVersions[version];
						return true;
					}
				}
			}
			return false;
		}
	};
}());
