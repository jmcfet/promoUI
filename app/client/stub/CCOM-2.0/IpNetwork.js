/**
 * Stub for CCOM 2.0 MediaLibrary
 */

var CCOM = CCOM || {};

CCOM.IpNetwork = CCOM.IpNetwork || (function () {

	var eventListeners = {},
		raiseEvent = function (event, parameter) {
			var listeners = eventListeners[event],
				i;
			if (listeners) {
				for (i = 0; i < listeners.length; i++) {
					listeners[i](parameter);
				}
			}
		};

	return {
		//InterfaceType
		INTERFACE_TYPE_WIRED: 1,
		INTERFACE_TYPE_WIRELESS: 2,
		INTERFACE_TYPE_DOCSIS: 3,

		//WirelessEncryption
		ENCRYPT_AES: 101,
		ENCRYPT_DEFAULT: 102,
		ENCRYPT_TKIP: 103,
		ENCRYPT_TKIPAES: 104,
		ENCRYPT_WEP: 105,
		//WirelessProtocol
		A: 201,
		B: 202,
		G: 203,
		N: 204,
		//WirelessSecurity
		WEP: 301,
		WPA: 302,
		WPA2: 303,
		//WpsMode
		WPS_MODE_PBC_ENROLLEE: 401,
		WPS_MODE_PBC_REGISTRAR: 402,
		WPS_MODE_PIN_ENROLLEE: 403,
		WPS_MODE_PIN_REGISTRAR: 404,


		//Methods
		connectToWirelessNetwork: function (id,ssid,security,key,encryp_mode) {
			raiseEvent ("connectToWirelessNetworkFailed",
				{error: {domain: "com.opentv.IpNetwork",
						name: "invalid params",
						message: "error"}
				}
			);
			return null;
		},

		connectToWpsNetwork: function (id,mode) {
			raiseEvent ("connectToWpsNetworkFailed",
				{error: {domain: "com.opentv.IpNetwork",
						name: "invalid params",
						message: "error"}
				}
			);
			return null;
		},

		controlInterface: function (id,state) {
			raiseEvent ("controlInterfaceFailed",
				{error: {domain: "com.opentv.IpNetwork",
						name: "invalid params",
						message: "error"}
				}
			);
			return null;
		},

		getInterfaceConfig: function (id) {
			var ifs = this["interface"][0];
			return {
				id: ifs.id,
				ip: ifs.ip,
				mac: ifs.mac,
				netmask: ifs.netmask,
				gateway: ifs.gateway
			};
		},

		getWirelessConfig: function (id) {
			return this.wireless[0];
		},

		getWirelessState: function (id) {
			return true;
		},

		ping: function (ip) {
			raiseEvent ("pingFailed",{error:"error"});
			return null;
		},

		scanForWirelessNetworks: function (id)  {
			raiseEvent ("scanForWirelessNetworksFailed", {error: {name: "Not a wireless interface", message: ""}});
			return null;
		},

		setInterfaceConfig: function (id, ip, mac, netmask, gateway) {
			if ( id < this["interface"].length ) {
				var ifs = this["interface"][id];
				ifs.ip = ip;
				ifs.mac = mac;
				ifs.netmask = netmask;
				ifs.gateway = gateway;
			}
		},

		setInterfaceDns: function (id, dns_list) {
			var i;
			for ( i=0; i<dns_list.length; i++ ) {
				this.dns[i] = dns_list[i];
			}
		},

		setIpAddress: function (id, ip, netmask) {
			if ( id < this["interface"].length ) {
				var ifs = this["interface"][id];
				ifs.ip = ip;
				ifs.netmask = netmask;
			}
		},

		setIpAddressAndGateway: function (id, ip, netmask, gateway) {
			if ( id < this["interface"].length ) {
				var ifs = this["interface"][id];
				ifs.ip = ip;
				ifs.netmask = netmask;
				ifs.gateway = gateway;
			}
		},

		setWakeOnLan: function (id, enable) {
			if ( id < this["interface"].length ) {
				this["interface"][id].wolEnabled = enable;
			}
		},

		setWirelessConfig: function (id, details) {
			return {
				error: {
					domain: "com.opentv.IpNetwork",
					name: "Not wireless type",
					message: ""
				}
			};
		},

		setWirelessState: function (id, state) {
			return {
				error: {
					domain: "com.opentv.IpNetwork",
					name: "Not wireless type",
					message: ""
				}
			};
		},

		wakeDevice: function (uuid) {
			return {
				error: {
					domain: "com.opentv.IpNetwork",
					name: "Unknown error",
					message: ""
				}
			};
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

		fireEvent: raiseEvent,

		//properties
		"interface": [{ dhcpEnabled: true,
						gateway: "192.168.1.1",
						id: 0,
						ip: "192.168.1.110",
						linkUp: true,
						mac: "00:08:64:00:00:00",
						name: "eth0",
						netmask: "255.255.255.0",
						state: true,
						//type: CCOM.IpNetwork.INTERFACE_TYPE_WIRED,
						type: 1,
						wolEnabled: true,
						toSource: function(){return "";}
					}],

		dns: ["192.168.1.1","192.168.1.10"],

		gateway: "192.168.1.1",

		wireless: [{
						//encryp_mode: CCOM.IpNetwork.ENCRYPT_AES,
						encryp_mode: 101,
						key: "Nagra_Opentv_AP",
						//protocol: CCOM.IpNetwork.A,
						protocol: 201,
						quality: 100,
						//security: CCOM.IpNetwork.WPA2,
						security: 303,
						ssid: "super_password"
					}]
	};
}());
