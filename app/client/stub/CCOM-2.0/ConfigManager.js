/**
 * Stub for CCOM 2.0 ConfigManager
 */

var CCOM = CCOM || {};

CCOM.ConfigManager = CCOM.ConfigManager || (function () {

	var eventListeners = {};
	return {
		// Default values for some CCOM.preferences. Override these in your application
		testValues: {
			'/applications/shared/zapping.banner.timeout': 3000,
			'/applications/shared/user.channel.usage': "[{'39': '5', '160': '25'}]",
			'/applications/shared/serviceFavouriteFolders': "['fav1', 'fav2']",
			'/applications/shared/system.ca.disabled': 0,
			'/applications/shared/before.padding': 0,
			'/applications/shared/after.padding': 0,
			'/applications/shared/system.current.volume': 10,
			'/applications/shared/ca.modem.status': "Enabled",
			'/applications/shared/user.favEnabled': 'false',
			'/applications/shared/av.default.audio_format': 'stereo',
			'/applications/shared/av.default.aspect_ratio_hd': 'hdmiStretch',
			'/applications/shared/av.default.aspect_ratio_analogue': 'analogueStretch',
			'/applications/shared/av.default.audio_delay': 0,
			'/applications/shared/hard.of.hearing': 'false',
			'/applications/shared/audio.language': 'eng',
			'/applications/shared/subtitle.language': 'eng',
			'/applications/shared/tv.sort': 'channelNumberAsc',
			'/applications/shared/network.http.proxy': '0.0.0.0',

			'/system/opentv/mpm/mediaList': 'sdb',
			'/system/opentv/mpm/sdb/partitionList': 'sdb1',
			'/system/opentv/mpm/sdb/sdb1/mountPoint': '/mnt/sdb1',

			'/system/devices/tnrmgr/lnb-freq-lo-khz': '9750',
			'/system/devices/tnrmgr/lnb-freq-hi-khz': '10600',
			'/system/devices/tnrmgr/lnb-freq-sw-khz': '11700',
			'/system/devices/tnrmgr/lnb-power': 'true',

			'/network/siconfig/CustomDescriptorTags/teleIdeaTraxis': 'http://172.16.6.134/traxis',
			'/network/siconfig/CustomDescriptorTags/teleIdeaTraxisRtsp': '10.127.0.8:554',
			'/network/usageId': 6,
			'/applications/shared/startover.enabled': 'true',
			'/applications/shared/catchup.enabled': 'true',

			'/users/preferences/userauth/ppvTransactionPin': '1234'
		},

		/**
		 * Used purely to initialise preferences test data
		 * @param testData
		 */
		initialiseTestData: function (testData) {
			this.testValues = {};
			var property;
			for (property in testData) {
				if (testData.hasOwnProperty(property)) {
					this.testValues[property] = testData[property];
				}
			}
		},

		getValue: function (prefKey) {
			return {keyValue: this.testValues[prefKey]};
		},

		setValue: function (prefKey, prefValue) {
			this.testValues[prefKey] = prefValue;
			return true;
		},

		unsetValue: function (prefKey) {
			delete this.testValues[prefKey];
			return {error: ''};
		},

		addEventListener: function (event, callback) {
			if (eventListeners[event] === undefined) {
				eventListeners[event] = [];
			}
			eventListeners[event].push(callback);
		},

		removeEventListener: function (event, callback) {
			var listeners = eventListeners[event],
				i;
			if (listeners) {
				for (i = 0; i < listeners.length; i++) {
					if (listeners[i] === callback) {
						listeners.splice(i, 1);
					}
				}
			}
		},

		getSubtree: function (prefKey) {
			return {};
		},

		addNotify: function () {

		},

		createEncryptionKey: function ( encryptionData )    {
			return {error: "error"};
		},

		deleteEncryptionKey: function ( encryptionID )   {
			return {error: "error"};
		},

		getEntries: function ( dirPath )    {
			return {error: "error"};
		},

		removeNotify: function ()   {

		},

		setEncryptedValue: function( keyPath, keyValue ) {

		}
	};
}());
