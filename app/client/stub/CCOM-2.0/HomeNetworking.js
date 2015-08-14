/**
 * Stub for CCOM 2.0 Home Networking
 */

var CCOM = CCOM || {};

CCOM.HomeNetworking = CCOM.HomeNetworking || (function () {
	var eventListeners = {},
		dlnaServers = '{"devices":[{"modelDescription":"Synology DLNA/UPnP Media Server","upc":"","type":"urn:schemas-upnp-org:device:MediaServer:1","manufacturer":"Synology Inc","friendlyName":"NinjaNAS","presentationUrl":"http://10.8.1.35:5000/","serialNumber":"D3KON12466","dlnaUploadProfile":"","modelUrl":"http://www.synology.com/","iconCount":4,"modelNumber":"","modelName":"DS212j","udn":"uuid:0011321e-7644-0011-4476-44761e321100","iconData":[{"width":120,"depth":24,"mimeType":"image/jpeg","url":"http://10.8.1.35:50001/tmp_icon/dmsicon120.jpg","height":120},{"width":48,"depth":24,"mimeType":"image/jpeg","url":"http://10.8.1.35:50001/tmp_icon/dmsicon48.jpg","height":48},{"width":120,"depth":24,"mimeType":"image/png","url":"http://10.8.1.35:50001/tmp_icon/dmsicon120.png","height":120},{"width":48,"depth":24,"mimeType":"image/png","url":"http://10.8.1.35:50001/tmp_icon/dmsicon48.png","height":48}],"manufacturerUrl":"http://www.synology.com/","dlnaCapabilities":""},{"modelDescription":"DVBLink Home Server","upc":"123456789","type":"urn:schemas-upnp-org:device:MediaServer:1","manufacturer":"DVBLogic","friendlyName":"DVBLink DLNA TV Server (NinjaNAS)","presentationUrl":"http://10.8.1.35:39876/","serialNumber":"123456789002","dlnaUploadProfile":"","modelUrl":"http://www.dvblogic.com/","iconCount":4,"modelNumber":"1.0","modelName":"DVBLink Home Server","udn":"uuid:5AFEF00D-BABE-DADA-FA5A-0011321E7644","iconData":[{"width":48,"depth":24,"mimeType":"image/png","url":"http://10.8.1.35:49153/dvblink_48_48.png","height":48},{"width":120,"depth":24,"mimeType":"image/png","url":"http://10.8.1.35:49153/dvblink_120_120.png","height":120},{"width":48,"depth":24,"mimeType":"image/jpeg","url":"http://10.8.1.35:49153/dvblink_48_48.jpeg","height":48},{"width":120,"depth":24,"mimeType":"image/jpeg","url":"http://10.8.1.35:49153/dvblink_120_120.jpeg","height":120}],"manufacturerUrl":"http://www.dvblogic.com","dlnaCapabilities":""},{"modelDescription":"OpenTV 5 Gateway","upc":"012345678901","type":"urn:schemas-upnp-org:device:MediaServer:1","manufacturer":"Nagra","friendlyName":"OpenTV 5 DMS ","presentationUrl":"http://10.8.1.44:8080/","serialNumber":"0","dlnaUploadProfile":"","modelUrl":"http://www.nagra.com/","iconCount":4,"modelNumber":"OpenTV 5","modelName":"Gateway","udn":"uuid:0000001A-0001-3EC0-67C6-FFFFFFFFFFFF","iconData":[{"width":120,"depth":8,"mimeType":"image/png","url":"http://10.8.1.44:8080/home/otv_system/hn/icons/Nagra120.png","height":120},{"width":48,"depth":8,"mimeType":"image/png","url":"http://10.8.1.44:8080/home/otv_system/hn/icons/Nagra48.png","height":48},{"width":120,"depth":24,"mimeType":"image/jpeg","url":"http://10.8.1.44:8080/home/otv_system/hn/icons/Nagra120.jpg","height":120},{"width":48,"depth":24,"mimeType":"image/jpeg","url":"http://10.8.1.44:8080/home/otv_system/hn/icons/Nagra48.jpg","height":48}],"manufacturerUrl":"http://www.nagra.com","dlnaCapabilities":""}],"handle":6}',
		dlnaContentString1 = '{"content":[{"resource":[],"childCount":56,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"TVChannels","title":"TV Channels","objectType":1,"parentId":"0","searchable":true},{"resource":[],"childCount":4,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"4e9e47d6-4b3c-4ea7-b148-537821d50b94:","title":"Recorded TV","objectType":1,"parentId":"0","searchable":true}],"totalMatches":2,"handle":2691}',
		dlnaContentString2 = '{"content":[{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"21","title":"Music","objectType":1,"parentId":"0","searchable":false},{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"37","title":"Photo","objectType":1,"parentId":"0","searchable":false},{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"44","storageMaxPartition":-1,"title":"Video","objectType":1,"parentId":"0","searchable":false}],"totalMatches":3,"handle":2692}',
		dlnaContentString3 = '{"content":[{"resource":[],"childCount":156,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"live","title":"Live TV Channels","objectType":1,"parentId":"0","searchable":true},{"resource":[],"childCount":4,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"Video","title":"Video","objectType":1,"parentId":"0","searchable":false},{"resource":[],"childCount":3,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"Image","title":"Image","objectType":1,"parentId":"0","searchable":false},{"resource":[],"childCount":5,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"Audio","title":"Audio","objectType":1,"parentId":"0","searchable":false},{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"epg","title":"TV EPG","objectType":1,"parentId":"0","searchable":true},{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":false,"id":"pvr","title":"PVR Recordings","objectType":1,"parentId":"0","searchable":true},{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"nowPlaying","title":"Now Playing","objectType":1,"parentId":"0","searchable":false}],"totalMatches":7,"handle":2664}',
		dlnaContentString3_Video = '{"content":[{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"Video.All Video","title":"All Video","objectType":1,"parentId":"Video","searchable":false},{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"Video.By Date","title":"By Date","objectType":1,"parentId":"Video","searchable":false},{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"Video.Genre","title":"Genre","objectType":1,"parentId":"Video","searchable":false},{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"Video.By Folder","title":"By Folder","objectType":1,"parentId":"Video","searchable":false}],"totalMatches":4,"handle":2676}',
		dlnaContentString3_Image = '{"content":[{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"Image.All Photos","title":"All Photos","objectType":1,"parentId":"Image","searchable":false},{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"Image.By Date","title":"By Date","objectType":1,"parentId":"Image","searchable":false},{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"Image.By Folder","title":"By Folder","objectType":1,"parentId":"Image","searchable":false}],"totalMatches":3,"handle":2679}',
		dlnaContentString3_Audio = '{"content":[{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"Audio.All Music","title":"All Music","objectType":1,"parentId":"Audio","searchable":false},{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"Audio.By Date","title":"By Date","objectType":1,"parentId":"Audio","searchable":false},{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"Audio.Album","title":"Album","objectType":1,"parentId":"Audio","searchable":false},{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"Audio.Genre","title":"Genre","objectType":1,"parentId":"Audio","searchable":false},{"resource":[],"childCount":0,"durationSecs":0,"type":1,"refId":"","restricted":true,"id":"Audio.By Folder","title":"By Folder","objectType":1,"parentId":"Audio","searchable":false}],"totalMatches":5,"handle":2680}',
		dlnaBrowseCallback = function () {};

    return {
        //HNContentType
        HN_CONTENT_TYPE_CONTAINER: 1,
        HN_CONTENT_TYPE_ITEM: 2,

        //Properties
        hnNumDevices: 0,

        browseContainer: function (deviceUdn,containerId,sortCriteria,filter,startIndex,maxResults) {
        	var data = null;
        	var switchString = deviceUdn + ", " + containerId;
        	switch (switchString) {
			case "uuid:5AFEF00D-BABE-DADA-FA5A-0011321E7644, 0":
				data = $N.apps.util.JSON.parse(dlnaContentString1);
				break;
			case "uuid:0011321e-7644-0011-4476-44761e321100, 0":
				data = $N.apps.util.JSON.parse(dlnaContentString2);
				break;
			case "uuid:0000001A-0001-3EC0-67C6-FFFFFFFFFFFF, 0":
				data = $N.apps.util.JSON.parse(dlnaContentString3);
				break;
			case "uuid:0000001A-0001-3EC0-67C6-FFFFFFFFFFFF, Video":
				data = $N.apps.util.JSON.parse(dlnaContentString3_Video);
				break;
			case "uuid:0000001A-0001-3EC0-67C6-FFFFFFFFFFFF, Image":
				data = $N.apps.util.JSON.parse(dlnaContentString3_Image);
				break;
			case "uuid:0000001A-0001-3EC0-67C6-FFFFFFFFFFFF, Audio":
				data = $N.apps.util.JSON.parse(dlnaContentString3_Audio);
				break;
			default:
				// ignore
				break;
			}
			if (data) {
				setTimeout(function () {
					dlnaBrowseCallback(data);
				}, 50);
			}
        },

        cancelSubscribedService: function (deviceUdn,serviceType) {
            return {error:"error"};
        },

        createObject: function (deviceUdn,cds) {
            return {error:"error"};
        },

        deleteObject: function (deviceUdn,objectId) {
            return {error:"error"};
        },

        getDevices: function () {
            return {error:"error"};
        },

        getSearchCapabilities: function (deviceUdn) {
            return {error:"error"};
        },

        getSortCapabilities: function (deviceUdn) {
            return {error:"error"};
        },

        getSystemUpdateId: function (deviceUdn) {
            return {error:"error"};
        },

        subscribeService: function (deviceUdn,serviceType) {
            return {error:"error"};
        },

		addEventListener: function (event, callback) {
			if (eventListeners[event] === undefined) {
				eventListeners[event] = [];

				switch (event) {
				case "getDevicesOK":
					setTimeout(function () {
						callback($N.apps.util.JSON.parse(dlnaServers));
					}, 50);
					break;
				case "browseContainerOK":
					dlnaBrowseCallback = callback;
					break;
				default:
					// ignore
					break;
				}
			}
			eventListeners[event].push(callback);
		},

		removeEventListener: function (event, callback) {
			var listeners = eventListeners[event];
			var i;
			for (i = 0; i < listeners.length; i++) {
				if (listeners[i] === callback) {
					listeners.splice(i, 1);
				}
			}
		}
	};
}());


