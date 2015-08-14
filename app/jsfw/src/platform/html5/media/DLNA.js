/**
 * The DLNA class allows device discovery using the Network Service Discovery API
 * DLNA specific methods such as browseDevice(), searchDevice(), controlDevice(), and sendContent() have been implemented inline with the UPNP & DLNA specification
 * Once a device has been discovered this class parses the DLNA config.xml of the device and returns an Object including the friendlyName, modelName, icons and supported UPNP services
 * This class communicates with the device using HTTP SOAP & XML responses are parsed and return as objects & arrays
 *
 * @class $N.platform.media.DLNA
 * @singleton
 * @requires jquery.soap-1.0.2
 * @requires jquery.xml2json-1.2
 * @requires $N.services.gateway.dlna.SoapHandler
 * @author SDermott
 */

/* global $, navigator, X2JS, console */
define('jsfw/platform/media/DLNA',
	[
		'jsfw/services/gateway/dlna/SoapHandler'
	],
	function (SoapHandler) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.media = $N.platform.media || {};

		$N.platform.media.DLNA = (function () {
			'use strict';

			var browseHistory = [],
				deviceLookup = {},
				parseXml,
				convertJSON = null,
				useProxy = false,
				proxyAddress = "http://10.8.1.16/proxy/", //"http://localhost:8765/",
				SERVICETYPE = {
					BROWSE: ['upnp:urn:schemas-upnp-org:service:ContentDirectory:1', 'upnp:urn:schemas-upnp-org:service:ContentDirectory:2'],
					RENDER_CONTROL: ['upnp:urn:schemas-upnp-org:service:RenderingControl:1'],
					AV_TRANSPORT: ['upnp:urn:schemas-upnp-org:service:AVTransport:1'],
					SCHEDULED_RECORDING: ['upnp:urn:schemas-upnp-org:service:ScheduledRecording:2'],
					NAGRA_PRM: ['upnp:urn:nagra:service:PRMSessionProtection:1'],
					ALL: ['upnp:urn:schemas-upnp-org:service:ContentDirectory:1',
					'upnp:urn:schemas-upnp-org:service:ContentDirectory:2',
					'upnp:urn:schemas-upnp-org:service:RenderingControl:1',
					'upnp:urn:schemas-upnp-org:service:AVTransport:1',
					'upnp:urn:schemas-upnp-org:service:ScheduledRecording:2',
					'upnp:urn:nagra:service:PRMSessionProtection:1']
				},

				ACTIONTYPES = {
					'Browse': {
						'ObjectID': '0',
						'BrowseFlag': 'BrowseDirectChildren',
						'Filter': '*',
						'StartingIndex': '0',
						'RequestedCount': '100000',
						'SortCriteria': ''
					},
					'GetCurrentConnectionIDs': {},
					'GetCurrentConnectionInfo': {
						'ConnectionID': '0'
					},
					'GetCurrentTransportActions': {
						'InstanceID': '0'
					},
					'GetDeviceCapabilities': {
						'InstanceID': '0'
					},
					'GetMediaInfo': {
						'InstanceID': '0'
					},
					'GetMute': {
						'InstanceID': '0',
						'Channel': 'Master'
					},
					'GetPositionInfo': {
						'InstanceID': '0'
					},
					'GetProtocolInfo': {},
					'GetSearchCapabilities': {},
					'GetSortCapabilities': {},
					'GetSystemUpdateID': {},
					'GetTransportInfo': {
						'InstanceID': '0'
					},
					'GetTransportSettings': {
						'InstanceID': '0'
					},
					'GetVolume': {
						'InstanceID': '0',
						'Channel': 'Master'
					},
					'ListPresets': {
						'InstanceID': '0'
					},
					'Next': {
						'InstanceID': '0'
					},
					'Pause': {
						'InstanceID': '0'
					},
					'Play': {
						'InstanceID': '0',
						'Speed': '1'
					},
					'Previous': {
						'InstanceID': '0'
					},
					'Search': {
						'ContainerID': '0',
						'SearchCriteria': '',
						'Filter': '*',
						'StartingIndex': '0',
						'RequestedCount': '100000',
						'SortCriteria': ''
					},
					'Seek': {
						'InstanceID': '0',
						'Unit': 'TRACK_NR',
						'Target': ''
					},
					'SelectPreset': {
						'InstanceID': '0',
						'PresetName': 'FactoryDefaults'
					},
					'SetAVTransportURI': {
						'InstanceID': '0',
						'CurrentURI': '',
						'CurrentURIMetaData': ''
					},
					'SetMute': {
						'InstanceID': '0',
						'Channel': 'Master',
						'DesiredMute': '1'
					},
					'SetNextAVTransportURI': {
						'InstanceID': '0',
						'NextURI': '',
						'NextURIMetaData': ''
					},
					'SetVolume': {
						'InstanceID': '0',
						'Channel': 'Master',
						'DesiredVolume': '10'
					},
					'Stop': {
						'InstanceID': '0'
					},
					'UpdateObject': {
						'ObjectID': '0',
						'CurrentTagValue': '',
						'NewTagValue': ''
					},
					'X_DLNA_GetBytePositionInfo': {
						'InstanceID': '0'
					},
					'X_GetRemoteSharingStatus': {
					},
					'CreateObject': {
						'ContainerID': '0',
						'Elements': '',
						'ObjectID': ''
					},
					'DestroyObject': {
						'ObjectID': ''
					},
				},

				DMSSTUB = [{
						config: '<?xml version="1.0"?> <root xmlns="urn:schemas-upnp-org:device-1-0" xmlns:dlna="urn:schemas-dlna-org:device-1-0" xmlns:nagra="urn:schemas-nagra-com:device-1-0"> <specVersion> <major>1</major> <minor>0</minor> </specVersion> <device> <dlna:X_DLNADOC>DMS-1.50</dlna:X_DLNADOC> <nagra:X_NAGRACAP>prm-protection, nmp-capable, next_ready-100</nagra:X_NAGRACAP> <nagra:X_NUID>30 0409 4693 95</nagra:X_NUID> <nagra:X_STBCASN>00 0006 5536 47</nagra:X_STBCASN> <nagra:X_CST>05 4525 9523 8A</nagra:X_CST> <deviceType>urn:schemas-upnp-org:device:MediaServer:1</deviceType> <friendlyName>OpenTV 5 DMS 10.20.0.2</friendlyName> <manufacturer>Nagra</manufacturer> <manufacturerURL>http://www.nagra.com</manufacturerURL> <modelDescription>OpenTV 5 Gateway</modelDescription> <modelName>Gateway</modelName> <modelNumber>OpenTV 5</modelNumber> <modelURL>http://www.nagra.com/</modelURL> <serialNumber>0</serialNumber> <UDN>uuid:00000018-0004-25F3-67C6-1077B113315C</UDN> <UPC>012345678901</UPC> <iconList> <icon> <mimetype>image/png</mimetype> <width>120</width> <height>120</height> <depth>8</depth> <url>/home/otv_system/hn/icons/StarhubLogo120.png</url> </icon> <icon> <mimetype>image/png</mimetype> <width>48</width> <height>48</height> <depth>8</depth> <url>/home/otv_system/hn/icons/StarhubLogo48.png</url> </icon> <icon> <mimetype>image/jpeg</mimetype> <width>120</width> <height>120</height> <depth>24</depth> <url>/home/otv_system/hn/icons/StarhubLogo120.jpg</url> </icon> <icon> <mimetype>image/jpeg</mimetype> <width>48</width> <height>48</height> <depth>24</depth> <url>/home/otv_system/hn/icons/StarhubLogo48.jpg</url> </icon> </iconList> <serviceList> <service> <serviceType>urn:schemas-upnp-org:service:ContentDirectory:2</serviceType> <serviceId>urn:upnp-org:serviceId:ContentDirectory</serviceId> <SCPDURL>/XD/00000018-0004-25F3-67C6-1077B113315C/ContentDir</SCPDURL> <controlURL>/UD/00000018-0004-25F3-67C6-1077B113315C?0</controlURL> <eventSubURL>/00000018-0004-25F3-67C6-1077B113315C?0</eventSubURL> </service> <service> <serviceType>urn:schemas-upnp-org:service:ConnectionManager:1</serviceType> <serviceId>urn:upnp-org:serviceId:ConnectionManager</serviceId> <SCPDURL>/XD/00000018-0004-25F3-67C6-1077B113315C/MsConnMgr</SCPDURL> <controlURL>/UD/00000018-0004-25F3-67C6-1077B113315C?1</controlURL> <eventSubURL>/00000018-0004-25F3-67C6-1077B113315C?1</eventSubURL> </service> <service> <serviceType>urn:schemas-upnp-org:service:ScheduledRecording:2</serviceType> <serviceId>urn:upnp-org:serviceId:ScheduledRecording</serviceId> <SCPDURL>/XD/00000018-0004-25F3-67C6-1077B113315C/SchedRec</SCPDURL> <controlURL>/UD/00000018-0004-25F3-67C6-1077B113315C?3</controlURL> <eventSubURL>/00000018-0004-25F3-67C6-1077B113315C?3</eventSubURL> </service> <service> <serviceType>urn:nagra:service:PRMSessionProtection:1</serviceType> <serviceId>urn:nagra:serviceId:PRMSessionProtection</serviceId> <SCPDURL>/XD/00000018-0004-25F3-67C6-1077B113315C/Prm</SCPDURL> <controlURL>/UD/00000018-0004-25F3-67C6-1077B113315C?5</controlURL> <eventSubURL>/00000018-0004-25F3-67C6-1077B113315C?5</eventSubURL> </service> </serviceList> <presentationURL>/</presentationURL> </device> </root>',
						id: 'uuid:00000018-0004-25F3-67C6-1077B113315C::urn:schemas-upnp-org:service:ContentDirectory:2urn:upnp-org:serviceId:ContentDirectory',
						name: 'urn:upnp-org:serviceId:ContentDirectory1',
						type: 'upnp:urn:schemas-upnp-org:service:ContentDirectory:1',
						url: 'http://10.20.0.2:8080/UD/00000018-0004-25F3-67C6-1077B113315C?0'
					}
				],

				DMRSTUB = [{
						config: '<?xml version="1.0"?> <root xmlns="urn:schemas-upnp-org:device-1-0" xmlns:dlna="urn:schemas-dlna-org:device-1-0"> <specVersion> <major>1</major> <minor>0</minor> </specVersion> <device> <dlna:X_DLNADOC>DMR-1.50</dlna:X_DLNADOC> <deviceType>urn:schemas-upnp-org:device:MediaRenderer:1</deviceType> <friendlyName>OpenTV 5 DMR 10.20.0.2</friendlyName> <manufacturer>Nagra</manufacturer> <manufacturerURL>http://www.nagra.com</manufacturerURL> <modelDescription>OpenTV 5 Gateway Client</modelDescription> <modelName>Gateway Client</modelName> <modelNumber>OpenTV 5</modelNumber> <modelURL>http://www.nagra.com</modelURL> <serialNumber>0</serialNumber> <UDN>uuid:00000018-0004-4734-6973-1077B113315C</UDN> <UPC>012345678901</UPC> <iconList> <icon> <mimetype>image/png</mimetype> <width>120</width> <height>120</height> <depth>8</depth> <url>/home/otv_system/hn/icons/StarhubLogo120.png</url> </icon> <icon> <mimetype>image/png</mimetype> <width>48</width> <height>48</height> <depth>8</depth> <url>/home/otv_system/hn/icons/StarhubLogo48.png</url> </icon> <icon> <mimetype>image/jpeg</mimetype> <width>120</width> <height>120</height> <depth>24</depth> <url>/home/otv_system/hn/icons/StarhubLogo120.jpg</url> </icon> <icon> <mimetype>image/jpeg</mimetype> <width>48</width> <height>48</height> <depth>24</depth> <url>/home/otv_system/hn/icons/StarhubLogo48.jpg</url> </icon> </iconList> <serviceList> <service> <serviceType>urn:schemas-upnp-org:service:RenderingControl:1</serviceType> <serviceId>urn:upnp-org:serviceId:RenderingControl</serviceId> <SCPDURL>/XD/00000018-0004-4734-6973-1077B113315C/RenderCtl</SCPDURL> <controlURL>/UD/00000018-0004-4734-6973-1077B113315C?0</controlURL> <eventSubURL>/00000018-0004-4734-6973-1077B113315C?0</eventSubURL> </service> <service> <serviceType>urn:schemas-upnp-org:service:ConnectionManager:1</serviceType> <serviceId>urn:upnp-org:serviceId:ConnectionManager</serviceId> <SCPDURL>/XD/00000018-0004-4734-6973-1077B113315C/MrConnMgr</SCPDURL> <controlURL>/UD/00000018-0004-4734-6973-1077B113315C?1</controlURL> <eventSubURL>/00000018-0004-4734-6973-1077B113315C?1</eventSubURL> </service> <service> <serviceType>urn:schemas-upnp-org:service:AVTransport:1</serviceType> <serviceId>urn:upnp-org:serviceId:AVTransport</serviceId> <SCPDURL>/XD/00000018-0004-4734-6973-1077B113315C/MrAvTransport</SCPDURL> <controlURL>/UD/00000018-0004-4734-6973-1077B113315C?2</controlURL> <eventSubURL>/00000018-0004-4734-6973-1077B113315C?2</eventSubURL> </service> </serviceList> <presentationURL>/UE/MrAppPresentation</presentationURL> </device> </root>',
						id: 'uuid:00000018-0004-4734-6973-1077B113315C::urn:schemas-upnp-org:service:AVTransport:1urn:upnp-org:serviceId:AVTransport',
						name: 'urn:upnp-org:serviceId:AVTransport',
						type: 'upnp:urn:schemas-upnp-org:service:AVTransport:1',
						url: 'http://10.20.0.2:8080/UD/00000018-0004-4734-6973-1077B113315C?2'
					}
				];

			function xmlEncode(input) {
				function containsChar(c) {
					return c.charCodeAt(0) < 128;
				}
				var output = '',
					i,
					j;
				for (i = 0; i < input.length; i++) {
					j = '<>&\''.indexOf(input.charAt(i));
					if (j !== -1) {
						output += '&' + ['lt', 'gt', 'amp', '#39'][j] + ';';
					} else if (!containsChar(input.charAt(i))) {
						output += '&#' + input.charCodeAt(i) + ';';
					} else {
						output += input.charAt(i);
					}
				}
				return output;
			}

			function error(e) {
				console.log("Error occurred: " + e.code);
			}

			function getUPNPDevices(callback, serviceTypes) {
				if (window.serviceDiscoveryAgent && $N.env) {
					$N.platform.media.DLNA.__ssdpSuccess = {
						handleEvent: function (services) {
							if (services.networkService) {
								services = services.networkService;
							}
							callback(services);
						}
					};
					$N.platform.media.DLNA.__ssdpError = {
						handleEvent: function () {
							callback([]);
						}
					};
					if ($N.env.platform === "IOS") {
						window.serviceDiscoveryAgent.getNetworkServices(serviceTypes, "$N.platform.media.DLNA.__ssdpSuccess", "$N.platform.media.DLNA.__ssdpError");
					} else if ($N.env.platform === "NMP_PLUGIN") {
						window.serviceDiscoveryAgent.getNetworkServices(serviceTypes.join(','), callback, error);
					} else if ($N.env.platform === "ANDROID"){
						window.serviceDiscoveryAgent.getNetworkServices(JSON.stringify(serviceTypes).replace(/"/g, "'"), "$N.platform.media.DLNA.__ssdpSuccess", "$N.platform.media.DLNA.__ssdpError");
					}
				} else if (navigator.getNetworkServices) {
					navigator.getNetworkServices(serviceTypes, callback, error);
				} else {
					var devicesFound = [];
					for (var i = 0; i < serviceTypes.length; i++) {
						if (serviceTypes[i] === "upnp:urn:schemas-upnp-org:service:ContentDirectory:2") {
							devicesFound = devicesFound.concat(DMSSTUB);
						} else if (serviceTypes[i] === "upnp:urn:schemas-upnp-org:service:AVTransport:1") {
							devicesFound = devicesFound.concat(DMRSTUB);
						}
					}
					callback(devicesFound);
				}
			}

			function getDeviceList(callback, serviceTypes) {
				console.log('getDeviceList - serviceTypes: ', serviceTypes);
				var getUPNPDevicesCallback = function (devices) {
					var deviceConfig = [],
						i;
					for (i = 0; i < devices.length; i++) {
						deviceConfig.push(getDeviceInfo(devices[i]));
					}
					for (i = 0; i < deviceConfig.length; i++) {
						deviceLookup[deviceConfig[i].UDN] = deviceConfig[i];
					}
					callback(deviceConfig);
				};
				getUPNPDevices(getUPNPDevicesCallback, serviceTypes);
			}

			function getDeviceInfo(deviceConfigXML) {
				if (!convertJSON) {
					convertJSON = new X2JS();
				}
				var deviceInfo = {},
					splitURL = deviceConfigXML.url.split("/");
				browseHistory = [];

				if (deviceConfigXML.config) {
					var config = convertJSON.xml_str2json(deviceConfigXML.config);
					config = config.root;
					deviceInfo = config.device;
					deviceInfo.url = "http://" + splitURL[2];
					deviceInfo.type = deviceConfigXML.type;
					deviceInfo.friendlyName = config.device.friendlyName || 'Not Avaiable';
					deviceInfo.UDN = config.device.UDN || 'Not Avaiable';
					deviceInfo.manufacturerUrl = config.device.manufacturerURL || 'Not Avaiable';
					deviceInfo.manufacturer = config.device.manufacturer || 'Not Avaiable';
					deviceInfo.modelName = config.device.modelName || 'Not Avaiable';
					deviceInfo.modelDescription = config.device.modelDescription || 'Not Avaiable';
					deviceInfo.serialNumber = config.device.serialNumber || 'Not Avaiable';
					deviceInfo.modelNumber = config.device.modelNumber || 'Not Avaiable';
					deviceInfo.modelURL = config.device.modelURL || 'Not Avaiable';
					deviceInfo.icon = config.device.iconList && config.device.iconList.icon ? config.device.iconList.icon : 'none';
					deviceInfo.services = config.device.serviceList.service || 'Not Avaiable';
				}
				return deviceInfo;
			}

			function getDeviceService(device, service) {
				var i,
					serviceObj;
				for (i = 0; i < device.services.length; i++) {
					var serviceTypeID = device.services[i].serviceType.match(service);
					if (serviceTypeID) {
						serviceObj = device.services[i];
					}
				}
				return serviceObj;
			}

			function soapRequest(deviceInfo, service, elementName, options, callback) {

				if (service.controlURL.substring(0, 1) !== '/') {
					service.controlURL = '/' + service.controlURL;
				}
				if (useProxy === true && !deviceInfo.proxied) {
					deviceInfo.url = proxyAddress + deviceInfo.url;
					deviceInfo.proxied = true;
				}
				var processResponse = function (data) {
					var handleRequest = {};
					if (data.httpCode !== 200) {
						var responseResult;
						if (data.content.Envelope) {
							responseResult = data.content.Envelope.Body;
							handleRequest = {
								code: responseResult.Fault.detail.UPnPError.errorCode,
								description: responseResult.Fault.faultstring
							};
						} else {
							handleRequest = {
								code: data.httpCode,
								description: 'error'
							};
						}
					} else {
						handleRequest = {
							code: data.httpCode,
							description: 'success'
						};
					}
					data.handle = handleRequest;
					callback(data);
				};
				var url = deviceInfo.url + service.controlURL;
				$N.services.gateway.dlna.SoapHandler.sendRequest(url, elementName, service.serviceType, options, processResponse);
			}

			function browseDevice(UDN, config, browseFlag, callback) {
				browseHistory.push(config.containerId);
				browseFlag = browseFlag || 'BrowseDirectChildren';
				var deviceBrowseService = getDeviceService(deviceLookup[UDN], "ContentDirectory"),
					containerId = config.containerId || 0,
					sortCriteria = config.sortCriteria || '',
					filter = config.filter || '*',
					startIndex = config.startIndex || 0,
					itemCount = config.itemCount || 200,
					method = deviceBrowseService,
					elementName = 'Browse',
					currentPositon = browseHistory.indexOf(browseHistory[browseHistory.length - 1]),
					parent = browseHistory[currentPositon - 1],
					browseResponse = {},

					soapRequestCallback = function (data) {
						if (data.handle.code === 200) {
							var responseResult = convertJSON.xml_str2json(data.content.Result);
							responseResult = responseResult['DIDL-Lite'];
							if (browseResponse.NumberReturned) {
								browseResponse.NumberReturned = parseInt(data.content.NumberReturned,10) + browseResponse.NumberReturned;
							} else {
								browseResponse.NumberReturned = parseInt(data.content.NumberReturned,10);
							}
							browseResponse.TotalMatches = parseInt(data.content.TotalMatches,10);
							browseResponse.UDN = UDN;
							browseResponse.parent = parent;
							browseResponse.container = responseResult.container || [];
							if (browseResponse.item) {
								browseResponse.item = browseResponse.item.concat(responseResult.item);
							} else {
								browseResponse.item = responseResult.item || [];
							}

							if (!$.isArray(browseResponse.container)) {
								browseResponse.container = [browseResponse.container];
							}
							if (!$.isArray(browseResponse.item)) {
								browseResponse.item = [browseResponse.item];
							}
						}
						if (browseResponse.NumberReturned < browseResponse.TotalMatches - 1) {
							var pagedOptions = {
								ObjectID: containerId,
								BrowseFlag: browseFlag,
								Filter: filter,
								StartingIndex: browseResponse.NumberReturned + 1,
								RequestedCount: browseResponse.TotalMatches,
								SortCriteria: sortCriteria
							};
							soapRequest(deviceLookup[UDN], method, elementName, pagedOptions, soapRequestCallback);
						} else {
							browseResponse.handle = data.handle;
							callback(browseResponse);
						}
					};
				var options = {
					ObjectID: containerId,
					BrowseFlag: browseFlag,
					Filter: filter,
					StartingIndex: startIndex,
					RequestedCount: itemCount,
					SortCriteria: sortCriteria
				};
				soapRequest(deviceLookup[UDN], method, elementName, options, soapRequestCallback);
			}

			function sendContent(fromUDN, toUDN, itemID, elementName, callback, resMimeType) {

				var avTransportRequestCallback = function (data) {
					callback(data.handle);
				};
				var service = getDeviceService(deviceLookup[fromUDN], "ContentDirectory"),
					element = 'Browse',
					params = {
						ObjectID: itemID,
						BrowseFlag: 'BrowseMetadata',
						Filter: 'res',
						StartingIndex: '0',
						RequestedCount: '1',
						SortCriteria: ''
					};
				var itemDetailsCallback = function (data) {
						var responseResult = convertJSON.xml_str2json(data.content.Result) || 'None',
							metaData = data.content.Result || responseResult,
							deviceBrowseService = getDeviceService(deviceLookup[toUDN], "AVTransport"),
							itemObj = responseResult['DIDL-Lite'].item,
							contentURL;

						metaData = xmlEncode(metaData);

						if (resMimeType) {
							if (itemObj.res_asArray.length > 1) {
								for (var i = 0; i < itemObj.res_asArray.length; i++) {
									var mimeType = itemObj.res_asArray[i].protocolInfo.split(":");
										mimeType = mimeType[2].split(";");
										if (mimeType[0] === resMimeType) {
											contentURL = itemObj.res_asArray[i].text;
										}
								};
							} else {
								contentURL = itemObj.res_asArray[0].text || itemObj.res.text;
							}
						} else {
							contentURL = itemObj.res_asArray[0].text || itemObj.res.text;
						}
						var options = {
							InstanceID: '0',
							CurrentURI: contentURL,
							CurrentURIMetaData: metaData
						};
						soapRequest(deviceLookup[toUDN], deviceBrowseService, elementName, options, avTransportRequestCallback);
					};
				soapRequest(deviceLookup[fromUDN], service, element, params, itemDetailsCallback);
			}

			function fetchContent(DMRUDN, callback) {
				var deviceBrowseService = getDeviceService(deviceLookup[DMRUDN], "AVTransport"),
					options = ACTIONTYPES['GetPositionInfo'],
					devicefetchContentCallback = function (data) {
						var responseResult = {};
						if (data.handle.code === 200) {
							responseResult = data.content;
							var metaData = convertJSON.xml_str2json(responseResult.TrackMetaData);
							if (metaData.parsererror) {
								responseResult.TrackMetaData = 'none';
							} else {
								if (metaData['DIDL-Lite']) {
									responseResult.TrackMetaData = metaData['DIDL-Lite'].item;
								} else {
									responseResult.TrackMetaData = 'none';
								}
							}
						}
						responseResult.handle = data.handle;
						callback(responseResult);
					};
				soapRequest(deviceLookup[DMRUDN], deviceBrowseService, 'GetPositionInfo', options, devicefetchContentCallback);
			}

			function controlDevice(DMRUDN, elementName, callback, overrides) {
				var deviceBrowseService = getDeviceService(deviceLookup[DMRUDN], "AVTransport"),
					options = ACTIONTYPES[elementName],
					controlDeviceCallback = function (data) {
						var browseResponse = {};
						browseResponse.handle = data.handle;
						callback(browseResponse);
					};
				for (var key in options) {
					if (options.hasOwnProperty(key)) {
						if (overrides) {
							if (overrides[key]) {
								options[key] = overrides[key];
							}
						}
					}
				}
				soapRequest(deviceLookup[DMRUDN], deviceBrowseService, elementName, options, controlDeviceCallback);
			}

			function renderControlDevice(DMRUDN, elementName, callback, overrides) {
				var deviceBrowseService = getDeviceService(deviceLookup[DMRUDN], "RenderingControl"),
					options = ACTIONTYPES[elementName],
					controlDeviceCallback = function (data) {
						var responseResult = data.content;
						responseResult.handle = data.handle;
						callback(responseResult);
					};
				for (var key in options) {
					if (options.hasOwnProperty(key)) {
						if (overrides) {
							if (overrides[key]) {
								options[key] = overrides[key];
							}
						}
					}
				}
				soapRequest(deviceLookup[DMRUDN], deviceBrowseService, elementName, options, controlDeviceCallback);
			}

			function searchDevice(UDN, config, callback) {
				var deviceBrowseService = getDeviceService(deviceLookup[UDN], "ContentDirectory"),
					containerId = config.containerId || 0,
					sortCriteria = config.sortCriteria || '',
					searchSyntax = config.searchSyntax || 'contains',
					searchCriteria = config.searchCriteriaType + ' ' + searchSyntax + ' "' + config.searchCriteria + '"',
					filter = config.filter || '*',
					startIndex = config.startIndex || 0,
					itemCount = config.itemCount || 200,
					method = deviceBrowseService,
					elementName = 'Search',

					soapSearchCallback = function (data) {
						var searchResponse = {};
						if (data.handle.code === 200) {
							var responseResult = convertJSON.xml_str2json(data.content.Result);
							responseResult = responseResult['DIDL-Lite'];

							searchResponse.UDN = UDN;
							searchResponse.parent = parent;
							searchResponse.container = responseResult.container || [];
							searchResponse.item = responseResult.item || [];
							if (!$.isArray(searchResponse.container)) {
								searchResponse.container = [searchResponse.container];
							}
							if (!$.isArray(searchResponse.item)) {
								searchResponse.item = [searchResponse.item];
							}
						}
						searchResponse.handle = data.handle;
						callback(searchResponse);
					};

				var options = {
					ContainerID: containerId,
					SearchCriteria: searchCriteria,
					Filter: filter,
					StartingIndex: startIndex,
					RequestedCount: itemCount,
					SortCriteria: sortCriteria
				};
				soapRequest(deviceLookup[UDN], method, elementName, options, soapSearchCallback);
			}

			function getSearchCapabilities(UDN, callback) {

				var deviceBrowseService = getDeviceService(deviceLookup[UDN], "ContentDirectory"),
					elementName = 'GetSearchCapabilities',
					options = {},

					getSearchCapabilitiesCallback = function (data) {
						var responseResult = data.content.SearchCaps.text || data.content.SearchCaps,
							searchCapabilities = typeof(responseResult) === "string" ? responseResult.split(',') : 'none';
						searchCapabilities.handle = data.handle;
						callback(searchCapabilities);
					};

				soapRequest(deviceLookup[UDN], deviceBrowseService, elementName, options, getSearchCapabilitiesCallback);
			}

			function createObject(UDN, containerId, config, callback) {
				var deviceBrowseService = getDeviceService(deviceLookup[UDN], "ContentDirectory"),
					elementName = 'CreateObject';

				var createObjectElement = '<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/" xmlns:dlna="urn:schemas-dlna-org:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">',
					configItem = convertJSON.json2xml_str(config),
					elements = createObjectElement + configItem + '</DIDL-Lite>';
				elements = xmlEncode(elements);

				var createObjectCallback = function (data) {
					var responseResult = {};
					responseResult.ObjectID = data.content.ObjectID;
					responseResult.handle = data.handle;
					callback(responseResult);
				};
				var options = {
					ContainerID: containerId,
					Elements: elements
				};
				soapRequest(deviceLookup[UDN], deviceBrowseService, elementName, options, createObjectCallback);
			}

			function updateObject(UDN, config, callback) {
				var deviceBrowseService = getDeviceService(deviceLookup[UDN], "ContentDirectory"),
					objectID = config.objectID || '0',
					currentValue = config.currentValue || '',
					newValue = config.newValue || '',
					elementName = 'UpdateObject';

				var updateObjectCallback = function (data) {
					var responseResult = {};
					responseResult.handle = data.handle;
					callback(responseResult);
				};

				var options = {
					ObjectID: objectID,
					CurrentTagValue: currentValue,
					NewTagValue: newValue
				};
				soapRequest(deviceLookup[UDN], deviceBrowseService, elementName, options, updateObjectCallback);
			}

			function destroyObject(UDN, objectID, callback) {
				var deviceBrowseService = getDeviceService(deviceLookup[UDN], "ContentDirectory"),
					elementName = 'DestroyObject';

				var destroyObjectCallback = function (data) {
					var result = {};
					result.handle = data.handle;
					callback(result);
				};

				var options = {
					ObjectID: objectID
				};
				soapRequest(deviceLookup[UDN], deviceBrowseService, elementName, options, destroyObjectCallback);
			}

			function browseRecordSchedules(UDN, config, callback) {

				var deviceBrowseService = getDeviceService(deviceLookup[UDN], "ScheduledRecording"),
					sortCriteria = config.sortCriteria || '',
					filter = config.filter || '',
					startIndex = config.startIndex || 0,
					itemCount = config.itemCount || 200,
					method = deviceBrowseService,
					elementName = 'BrowseRecordSchedules',

					soapRequestCallback = function (data) {
						var browseResponse = {},
							responseResult;
						if (data.handle.code === 200) {
							responseResult = convertJSON.xml_str2json(data.content.Result);
							browseResponse.UDN = UDN;
							browseResponse.item = responseResult.srs.item_asArray || [];
						}
						browseResponse.handle = data.handle;
						callback(browseResponse);
					},
					options = {
						Filter: filter,
						StartingIndex: startIndex,
						RequestedCount: itemCount,
						SortCriteria: sortCriteria
					};
				soapRequest(deviceLookup[UDN], method, elementName, options, soapRequestCallback);
			}

			function browseRecordTasks(UDN, config, callback) {

				var deviceBrowseService = getDeviceService(deviceLookup[UDN], "ScheduledRecording"),
					recordScheduleID = config.recordScheduleID || '',
					sortCriteria = config.sortCriteria || '',
					filter = config.filter || '',
					startIndex = config.startIndex || 0,
					itemCount = config.itemCount || 200,
					method = deviceBrowseService,
					elementName = 'BrowseRecordTasks',

					soapRequestCallback = function (data) {
						var browseResponse = {},
							responseResult;
						if (data.handle.code === 200) {
							responseResult = convertJSON.xml_str2json(data.content.Result);
							browseResponse.UDN = UDN;
							browseResponse.item = responseResult.srs.item_asArray || [];
						}
						browseResponse.handle = data.handle;
						callback(browseResponse);
					},
					options = {
						RecordScheduleID: recordScheduleID,
						Filter: filter,
						StartingIndex: startIndex,
						RequestedCount: itemCount,
						SortCriteria: sortCriteria
					};
				soapRequest(deviceLookup[UDN], method, elementName, options, soapRequestCallback);
			}

			function createRecordSchedule(UDN, recordProperties, callback) {
				var deviceBrowseService = getDeviceService(deviceLookup[UDN], "ScheduledRecording"),
					elementName = 'CreateRecordSchedule',
					recordScheduleParts = {
						srs: {
							'_xmlns': 'urn:schemas-upnp-org:av:srs',
							'_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
							'_xsi:schemaLocation': 'urn:schemas-upnp-org:av:srs	http://www.upnp.org/schemas/av/srs.xsd',
							item: recordProperties
						}
					},
					j2x = new X2JS(),
					options = null,
					soapRequestCallback = function (data) {
						var response,
							responseResult = {};

						if (data.handle.code === 200) {
							response = convertJSON.xml_str2json(data.content.Result);
							responseResult = response.srs.item;
						} else {
							responseResult.scheduleState = "FAILED";
						}
						responseResult.handle = data.handle;
						callback(responseResult);
					};

				recordScheduleParts = j2x.json2xml_str(recordScheduleParts);
				options = {
					Elements: xmlEncode(recordScheduleParts)
				};
				soapRequest(deviceLookup[UDN], deviceBrowseService, elementName, options, soapRequestCallback);
			}

			function deleteRecordSchedule(UDN, recordScheduleID, callback) {
				var deviceBrowseService = getDeviceService(deviceLookup[UDN], "ScheduledRecording"),
					elementName = 'DeleteRecordSchedule',
					options = null,
					soapRequestCallback = function (data) {
						callback(data.handle);
					};
				options = {
					RecordScheduleID : recordScheduleID
				};
				soapRequest(deviceLookup[UDN], deviceBrowseService, elementName, options, soapRequestCallback);
			}

			function deleteRecordTask(UDN, recordTaskID, callback) {
				var deviceBrowseService = getDeviceService(deviceLookup[UDN], "ScheduledRecording"),
					elementName = 'DeleteRecordTask',
					options = null,
					soapRequestCallback = function (data) {
						callback(data.handle);
					};
				options = {
					RecordTaskID : recordTaskID
				};
				soapRequest(deviceLookup[UDN], deviceBrowseService, elementName, options, soapRequestCallback);
			}

			function getRecordTaskConflicts(UDN, recordTaskID, callback) {
				var deviceBrowseService = getDeviceService(deviceLookup[UDN], "ScheduledRecording"),
					elementName = 'GetRecordTaskConflicts',
					options = null,
					soapRequestCallback = function (data) {
						callback(data);
					};
				options = {
					RecordTaskID : recordTaskID
				};
				soapRequest(deviceLookup[UDN], deviceBrowseService, elementName, options, soapRequestCallback);
			}

			function getRecordScheduleConficts(UDN, recordScheduleID, callback) {
				var deviceBrowseService = getDeviceService(deviceLookup[UDN], "ScheduledRecording"),
					elementName = 'GetRecordScheduleConflicts',
					options = null,
					soapRequestCallback = function (data) {
						callback(data);
					};
				options = {
					RecordScheduleID : recordScheduleID
				};
				soapRequest(deviceLookup[UDN], deviceBrowseService, elementName, options, soapRequestCallback);
			}

			function getNagraPRMServiceValue(UDN, string, callback) {
				var devicePRMService = getDeviceService(deviceLookup[UDN], "PRMSessionProtection"),
					elementName = 'X_GetValueByString',
					options = null,
					soapRequestCallback = function (data) {
						callback(data);
					};
				options = {
					stringID : string
				};
				soapRequest(deviceLookup[UDN], devicePRMService, elementName, options, soapRequestCallback);
			}

			function getNagraPRMServiceLicense(UDN, deviceID, callback) {
				var devicePRMService = getDeviceService(deviceLookup[UDN], "PRMSessionProtection"),
					elementName = 'X_GetLicense',
					options = null,
					soapRequestCallback = function (data) {
						callback(data);
					};
				options = {
					uPnPDeviceID : deviceID
				};
				soapRequest(deviceLookup[UDN], devicePRMService, elementName, options, soapRequestCallback);
			}

			function connectionManager(UDN, elementName, callback) {
				var connectionManagerService = getDeviceService(deviceLookup[UDN], "ConnectionManager"),
					options = ACTIONTYPES[elementName],
					soapRequestCallback = function (data) {
						callback(data);
					};
				soapRequest(deviceLookup[UDN], connectionManagerService, elementName, options, soapRequestCallback);
			}

			// PUBLIC API
			return {

				/**
				 * getDeviceList returns a list of devices using the Network Discovery API
				 * @method getDeviceList
				 * @param {Function} callback An asynchronous callback
				 * @param {String} SERVICETYPE An array of services related to the SERVICETYPE e.g '$N.platform.media.DLNA.SERVICETYPE['AV_TRANSPORT']'
				 */
				getDeviceList: getDeviceList,

				/**
				 * controlDevice sends a control request to the DMR based on the element name / action
				 * @method connectionManager
				 * @param {String} DMRUDN The unique identifier for the DMR.
				 * @param {String} elementName The UPNP action for connectionManagerService e.h. "GetCurrentConnectionInfo"
				 * @param {Function} callback  An asynchronous callback that returns an handle object containing a 'code' & description'.
				 */
				connectionManager: connectionManager,

				/**
				 * browseDevice returns a list of the contents of a DLNA Media Server's container item. It is used to browse the DLNA Media Server to find Home Networking content to play.
				 * This method takes the provided details and issues a CDS browse on the specified device. When the device responds,
				 * it formats the results into the HNContent structure and provides the result to the user.
				 * @method browseDevice
				 * @param {String} deviceUdn The unique identifier for the DLNA server.
				 * @param {Object} options
				 * @param {String} options.containerId The container to browse. Use 0 for the root container.
				 * @param {String} options.sortCriteria Use "" for no sorting. For more detailed sorting, consult the UPnP Content Directory Specification.
				 * @param {String} options.filter Use "*" for all parameters. For more detailed filtering, consult the UPnP Content Directory Specification.
				 * @param {Number} options.startIndex Used to get the complete listing of a container when the result count is greater than the hnMaxBrowse property.
				 * @param {Number} options.itemCount Used to limit the number of results for any given browse request. The complete listing can be retrieved with multiple browse requests and changing the startIndex.
				 * @param {String} browseFlag Defaults to 'BrowseDirectChildren', consult the UPnP Content Directory Specification.
				 *
				 */
				browseDevice: browseDevice,

				/**
				 * sendContent returns a list of the contents of a DLNA Media Server's container item. It is used to browse the DLNA Media Server to find Home Networking content to play.
				 * This method takes the provided details and issues a CDS browse on the specified device. When the device responds,
				 * it formats the results into the HNContent structure and provides the result to the user.
				 * @method sendContent
				 * @param {String} fromUDN The unique identifier for the DMS.
				 * @param {String} toUDN The unique identifier for the DMR.
				 * @param {String} itemID The item ID of the content to send
				 * @param {String} elementName The UPNP action 'SetAVTransportURI'
				 * @param {Function} callback An asynchronous callback
				 * @param {String} MimeType Optional - The MimeType of the content to play
				 */
				sendContent: sendContent,

				/**
				 * fetchContent returns the item that is currently playing or waiting to be played. The return object contains, current time, abs time, Track Meta Data, Track URI, Track ID.
				 * @method fetchContent
				 * @param {String} DMRUDN The unique identifier for the DMR.
				 * @param {Function} callback  An asynchronous callback.
				 *
				 */
				fetchContent: fetchContent,

				/**
				 * searchDevice returns a list of items from the DMS based on the search criteria value 'config.searchCriteriaType' and the field name 'config.searchCriteriaType'
				 * @method searchDevice
				 * @param {String} UDN The unique identifier for the target DMS.
				 * @param {Object} config
				 * @param {String} config.containerId The container to search. Use 0 for the root container.
				 * @param {String} config.sortCriteria Use "" for no sorting. For more detailed sorting, consult the UPnP Content Directory Specification.
				 * @param {String} config.searchCriteriaType Field to search on the DMS, THis can be retrieved by calling 'getSearchCapabilities()'
				 * @param {String} config.searchSyntax Use UPNP Specification for the SearchCriteria String Syntax - e.g.' 'contains'|'doesNotContain'|'derivedfrom' '
				 * @param {String} config.searchCriteria Search Value.
				 * @param {String} config.filter Use "*" for all parameters. For more detailed filtering, consult the UPnP Content Directory Specification.
				 * @param {Number} config.startIndex Used to get the complete listing of a container when the result count is greater than the hnMaxBrowse property.
				 * @param {Number} config.itemCount Used to limit the number of results for any given browse request. The complete listing can be retrieved with multiple browse requests and changing the startIndex.
				 * @param {Function} callback  An asynchronous callback.
				 *
				 */
				searchDevice: searchDevice,

				/**
				 * getSearchCapabilities returns a list of field that can be searched using the 'searchDevice()' method.
				 * @method getSearchCapabilities
				 * @param {String} deviceUdn The unique identifier for the DMS.
				 * @param {Function} callback  An asynchronous callback.
				 */
				getSearchCapabilities: getSearchCapabilities,

				/**
				 * controlDevice sends a control request to the DMR based on the element name / action
				 * @method controlDevice
				 * @param {String} DMRUDN The unique identifier for the DMR.
				 * @param {String} elementName The UPNP action for device control e.g. 'Play, Pause, Stop'
				 * @param {Function} callback  An asynchronous callback that returns an object containing a 'code' & description'.
				 */
				controlDevice: controlDevice,

				/**
				 * renderControlDevice sends a control request to the DMR based on the element name / action
				 * @method renderControlDevice
				 * @param {String} DMRUDN The unique identifier for the DMR.
				 * @param {String} elementName The UPNP action for device control e.g. 'GetMute, GetVolume, SetVolume'
				 * @param {Function} callback  An asynchronous callback.
				 */
				renderControlDevice : renderControlDevice,

				/**
				 * A list of service types
				 * @property {String} SERVICETYPE either BROWSE, RENDER_CONTROL, AV_TRANSPORT, SCHEDULED_RECORDING or ALL
				 * @readonly
				 */
				SERVICETYPE: SERVICETYPE,

				/**
				 * Create Object creates an item with meta data that is submitted via the config object. The ID of the new object should be automatically created by the DMS.
				 * @method createObject
				 * @param {String} DMRUDN The unique identifier for the DMR.
				 * @param {String} containerId The parent folder / container in which the object will be created.
				 * @param {Object} config The parameters to create the new object : Example :
				 *		{
				 *			item : {
				 *				_id : '',
				 *				_neverPlayable : '0',
				 *				'dc:title' : 'Test Title',
				 *				'upnp:bookmarkedObjectID': 10,
				 *				'dc:date' : '29/07/13',
				 *				'upnp:deviceUDN' : '1234',
				 *				'upnp:stateVariableCollection' : {
				 *					_absTime : '112233445566'
				 *				}
				 *			}
				 *		}
				 * @param {Function} callback  An asynchronous callback.
				 */
				createObject: createObject,

				/**
				 * The object field including the XML tags can be submitted and updated using this method. 'e.g config.currentValue = '<dc:title>My Title</dc:>' => config.newValue = '<dc:title>My New Title</dc:>' '.
				 * @method updateObject
				 * @param {String} DMRUDN The unique identifier for the DMR.
				 * @param {Object} config The parameters to of the update object
				 * @param {String} config.objectID The ID of the object to update / edit.
				 * @param {String} config.currentValue The current value of the object field.
				 * @param {String} config.newValue The new value of the object field.
				 * @param {Function} callback  An asynchronous callback.
				 */
				updateObject: updateObject,

				/**
				 * Destroy Object will delete / destroy an object
				 * @method destroyObject
				 * @param {String} DMRUDN The unique identifier for the DMR.
				 * @param {String} objectID The ID of the object to delete / destroy.
				 * @param {Function} callback  An asynchronous callback.
				 */
				destroyObject: destroyObject,

				/**
				 * Returns a list of scheduled recording jobs via the callback parameter for. Or if an error occurred returns a UPnP
				 * error code and description.
				 * @method browseRecordSchedules
				 * @param {String} UDN
				 * @param {Object} config
				 * @param {String} config.sortCriteria Use "" for no sorting. For more detailed sorting, consult the UPnP Content Directory Specification.
				 * @param {String} config.filter Use "*" for all parameters. For more detailed filtering, consult the UPnP Content Directory Specification.
				 * @param {Number} config.startIndex Used to get the complete listing of a container when the result count is greater than the hnMaxBrowse property.
				 * @param {Number} config.itemCount Used to limit the number of results for any given browse request. The complete listing can be retrieved with multiple browse requests and changing the startIndex.
				 * @param {Function} callback An asynchronous callback.
				 */
				browseRecordSchedules: browseRecordSchedules,

				/**
				 * Returns a list of scheduled recording tasks via the callback parameter for. Or if an error occurred returns a UPnP
				 * error code and description.
				 * @method browseRecordTasks
				 * @param {String} UDN
				 * @param {Object} config
				 * @param {String} config.recordScheduleID Use "" for all tasks or provide a schedule id for tasks specific to a schedule
				 * @param {String} config.sortCriteria Use "" for no sorting. For more detailed sorting, consult the UPnP Content Directory Specification.
				 * @param {String} config.filter Use "*" for all parameters. For more detailed filtering, consult the UPnP Content Directory Specification.
				 * @param {Number} config.startIndex Used to get the complete listing of a container when the result count is greater than the hnMaxBrowse property.
				 * @param {Number} config.itemCount Used to limit the number of results for any given browse request. The complete listing can be retrieved with multiple browse requests and changing the startIndex.
				 * @param {Function} callback An asynchronous callback.
				 */
				browseRecordTasks: browseRecordTasks,

				/**
				 * Requests a recording be schedules using the given recordProprties, based in the UPnP A_ARG_TYPE_RecordScheduleParts
				 * object specification.
				 * @method createRecordSchedule
				 * @param {String} UDN The unique identifier for the target DMS.
				 * @param {Object} recordProperties A JSON object that parsed to XML using X2JS library
				 * @param {Function} callback  An asynchronous callback.
				 *
				 */
				createRecordSchedule: createRecordSchedule,

				/**
				 * Deletes a recording task for the given recordTaskID. This function does not return
				 * any data only error responses if applicable e.g. when specified task doesn't exist
				 * @method deleteRecordTask
				 * @param {String} UDN Unique device ID
				 * @param {String} recordTaskID Unique task ID
				 * @param {Function} callback An asynchronous callback.
				 */
				deleteRecordTask: deleteRecordTask,

				/**
				 * Deletes a recording schedule (job) for the given recordScheduleID. This function does not return
				 * any data only error responses if applicable e.g. when specified schedule doesn't exist
				 * @method deleteRecordSchedule
				 * @param {String} UDN Unique device ID
				 * @param {String} recordScheduleID Unique task ID
				 * @param {Function} callback An asynchronous callback.
				 */
				deleteRecordSchedule: deleteRecordSchedule,

				/**
				 * Checks for Recording Task conflicts on the CDS and returns an array of tasks that are conflicting
				 * @method getRecordTaskConflicts
				 * @param {String} UDN Unique device ID
				 * @param {String} recordScheduleID Unique task ID
				 * @param {Function} callback An asynchronous callback.
				 */
				getRecordTaskConflicts : getRecordTaskConflicts,

				/**
				 * Checks for Recording Schedule conflicts on the CDS and returns an array of schedules that are conflicting
				 * @method getRecordScheduleConficts
				 * @param {String} UDN Unique device ID
				 * @param {String} recordScheduleID Unique Schedule ID
				 * @param {Function} callback An asynchronous callback.
				 */
				getRecordScheduleConficts : getRecordScheduleConficts,

				/**
				 * Returns a value based on the input string from the PRMSessionProtection Service
				 * @method getNagraPRMServiceValue
				 * @param {String} UDN Unique device ID
				 * @param {String} stringID Requested Value
				 * @param {Function} callback An asynchronous callback.
				 */
				getNagraPRMServiceValue : getNagraPRMServiceValue,

				/**
				 * Returns a license based on the uPnPDeviceID from the PRMSessionProtection Service
				 * @method getNagraPRMServiceLicense
				 * @param {String} UDN Unique device ID
				 * @param {String} uPnPDeviceID Unique device ID of the Companion Device
				 * @param {Function} callback An asynchronous callback.
				 */
				getNagraPRMServiceLicense : getNagraPRMServiceLicense
			};

		}());
		return $N.platform.media.DLNA;
	}
);