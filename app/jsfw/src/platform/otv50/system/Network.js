/**
 * This class is concerned with what types of Networks are available on the current system such as:
 *
 * - Ethernet Connection
 * - DVB-C
 * - DVB-S
 * - DVB-T
 *
 * It contains a listener that any class can call to register to a NetworkStateChange event and then runs a callback
 * so that an application can then handle when a network connection is made or disconnected
 *
 * @class $N.platform.system.Network
 * @singleton
 *
 * @requires $N.apps.core.Log
 * @requires $N.apps.core.AjaxHandler
 */

/*global CCOM, IpNetwork*/

define('jsfw/platform/system/Network',
	[
		'jsfw/apps/core/Log',
		'jsfw/apps/core/AjaxHandler'
	],
	function (Log, AjaxHandler) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.system = $N.platform.system || {};

		$N.platform.system.Network = (function () {

			//constants
			var ethAvailable = false,
				GOOGLE_IP = "http://74.125.230.115", //used to check there is a connection to the Internet
				GOOGLE_DOMAIN = "http://www.google.com", //used to test DNS
				log = new $N.apps.core.Log("system", "Network");

			/**
			 * Returns the id of the interface identified by the interface name.
			 * @method getInterfaceIdUsingName
			 * @param {String} interfaceName One of type $N.platform.system.Network.NetworkType
			 * @return {Number} The interface id.
			 */
			var getInterfaceIdUsingName = function (interfaceName) {
				var interfaces = CCOM.IpNetwork["interface"],
					interfacesLength = interfaces.length,
					i;
				for (i = 0; i < interfacesLength; i++) {
					if (interfaces[i].name === interfaceName) {
						return interfaces[i].id;
					}
				}
				return null;
			};


			//public API
			return {

				/**
				 * Finds first CCOM Network of specified type.
				 * @method getNetworkByType
				 * @param {String} networkType One of type $N.platform.system.Network.NetworkType
				 * @return {Object} CCOM.network object if type is found, null if not found
				 */
				getNetworkByType : function (networkType) {
					var network = null,
						interfaces = CCOM.IpNetwork["interface"],
						interfacesLength = interfaces.length,
						i;

					for (i = 0; i < interfacesLength; i++) {
						if (interfaces[i].name === networkType) {
							network = interfaces[i];
							break;
						}
					}

					if (network) {
				        log("getNetworkByType", "Network Found: " + network.name);
					} else {
				        log("getNetworkByType", "Network " + networkType + " not found!");
					}

					return network;
				},

				/**
				 * Finds first CCOM Interface of specified interface type
				 * @method getInterfaceByType
				 * @param {String} interfaceType One of the interface type, INTERFACE_TYPE_WIRED = 0, INTERFACE_TYPE_WIRELESS = 1
				 * @return {Object} CCOM.network object if type is found, null if not found
				 */
				getInterfaceByType : function (interfaceType) {
					var interfaceObj = null,
						interfaces = CCOM.IpNetwork["interface"],
						interfacesLength = interfaces.length,
						i;

					for (i = 0; i < interfacesLength; i++) {
						if (interfaces[i].type === interfaceType) {
							interfaceObj = interfaces[i];
							break;
						}
					}
					if (interfaceObj) {
						log("getInterfaceByType", "Interface Found: " + interfaceObj.name);
					} else {
						log("getInterfaceByType", "Interface " + interfaceType + " not found!");
					}
					return interfaceObj;
				},


				/**
				 * Deprecated, use getNetworkByType instead.
				 * @method findNetworkByType
				 * @deprecated Use getNetworkByType instead.
				 * @param {string} networkType One of type $N.platform.system.Network.NetworkType
				 * @return {Object} CCOM.network object if type is found, null if not found
				 */
				findNetworkByType : function (networkType) {
					return this.getNetworkByType(networkType);
				},

				/**
				 * Checks if the given network type is available on the STB
				 * @method isNetworkAvailable
				 * @param {string} nType One of type $N.platform.system.Network.NetworkType
				 * @return {boolean} true if network is available, false if not
				 */
				isNetworkAvailable : function (nType) {
					log("isNetworkAvailable", "Network type " + nType);
					var isAvailable = false,
						net = this.getNetworkByType(nType);

					if (net && net.linkUp) {
						isAvailable = true;
						if (nType === $N.platform.system.Network.NetworkType.ETHERNET) {
							ethAvailable = true;
						}
					}
					log("isNetworkAvailable", "exit with: " + String(isAvailable));
					return isAvailable;
				},

				/**
				 * Checks if all networks on the STB are available
				 * @method isAvailable
				 * @return {Boolean} true if all networks are available, false if not
				 */
				isAvailable : function () {
					var i = 0,
						isAvailable = false,
						interfaces = CCOM.IpNetwork["interface"],
						interfacesLength = interfaces.length;

					for (i = 0; i < interfacesLength; i++) {
						isAvailable = interfaces[i].linkUp;
						if (!isAvailable) {
							break;
						}
					}

					return isAvailable;
				},

				/**
				 * Checks if all DVB networks on the STB are currently available
				 * @method isDVBAvailable
				 * @return {Boolean} true if all DVB networks are available, false if not
				 */
				isDVBAvailable : function () {
					var i,
						isAvailable = false,
						interfaces = CCOM.IpNetwork["interface"],
						interfacesLength = interfaces.length;

					for (i = 0; i < interfacesLength; i++) {
						if (interfaces[i].name !== $N.platform.system.Network.NetworkType.ETHERNET) {
							isAvailable = interfaces[i].linkUp;
							if (!isAvailable) {
								break;
							}
						}
					}

					return isAvailable || false;
				},

				/**
				 * Checks if Ethernet is currently available
				 * @method isEthernetAvailable
				 * @return {Boolean} true if Ethernet is available, false if not
				 */
				isEthernetAvailable : function () {
					return this.isNetworkAvailable($N.platform.system.Network.NetworkType.ETHERNET);
				},
				
				/**
				* Checks if WIFI is currently available
				* @method isWifiAvailable
				* @return {Boolean} true if WIFI is available, false if not
				*/
				isWifiAvailable : function () {
					return this.isNetworkAvailable($N.platform.system.Network.NetworkType.WIFI);
				},

				/**
				 * This method tries to connect to the given address using AJAX. If successful it calls
				 * the given successful callback and if it fails it calls the given failure callback
				 * @method connectToAddress
				 * @param {String} address The URL to connect to
				 * @param {Object} successCallback The method to call upon a successful connection
				 * @param {Object} failureCallback The method to call upon failing to connect
				 */
				connectToAddress : function (address, successCallback, failureCallback) {
					var _READY_STATE_WAIT_TIME = 10000; //time to wait for a readystate of 4 to be returned
					if (!successCallback) {
						successCallback = function () {};
					}
					if (!failureCallback) {
						failureCallback = function () {};
					}

					var httpRequest = new $N.apps.core.AjaxHandler();
					httpRequest.responseCallback = function (xmlhttp) {
						if (!xmlhttp || xmlhttp.status !== 200) {
							failureCallback();
						} else {
							successCallback();
						}
					};
					httpRequest.requestData(address, _READY_STATE_WAIT_TIME);
				},

				/**
				 * This method tests the connection to the internet by attempting to connect to Google's URL using its IP address
				 * @method testConnectionToInternet
				 * @param {Object} successCallback The method to call upon a successful connection
				 * @param {Object} failureCallback The method to call upon failing to connect
				 */
				testConnectionToInternet : function (successCallback, failureCallback) {
					this.connectToAddress(GOOGLE_IP, successCallback, failureCallback);
				},

				/**
				 * This method tests the connection to the internet by attempting to connect to Google's URL using its Domain name
				 * @method testConnectionToInternetWithDNS
				 * @param {Object} successCallback The method to call upon a successful connection
				 * @param {Object} failureCallback The method to call upon failing to connect
				 */
				testConnectionToInternetWithDNS : function (successCallback, failureCallback) {
					this.connectToAddress(GOOGLE_DOMAIN, successCallback, failureCallback);
				},

				/**
				 * Provides the MAC address from CCOM.
				 * @method getMacAddress
				 * @return {String} MAC address
				 */
				getMacAddress : function () {
					log("getMacAddress", "Retrieving MAC Address...");
					var macAddress = null,
						ethernet = this.getNetworkByType($N.platform.system.Network.NetworkType.ETHERNET);

					if (ethernet) {
						macAddress = ethernet.mac;
						// ensure correct format
						if (macAddress) {
							macAddress = macAddress.replace(/:/g, "-");
							macAddress = macAddress.replace(/\n/g, "");
						}
					}

					return macAddress || null;
				},

				/**
				 * Returns true if the ethernet dhcp option is enabled
				 * @method isDhcpEnabled
				 * @return {boolean}
				 */
				isDhcpEnabled: function () {
					log("isDhcpEnabled", "Checking if DHCP is enabled...");
					var ethernet = this.getNetworkByType($N.platform.system.Network.NetworkType.ETHERNET);
					if (ethernet) {
						return ethernet.dhcpEnabled;
					}
					return false;
				},

				/**
				 * Returns true if the ethernet dhcp option is enabled
				 * @deprecated use isDhcpEnabled instead
				 * @method getDhcp
				 * @return {boolean}
				 */
				getDhcp: function () {
					return this.isDhcpEnabled();
				},

				/**
				 * Disables dhcp on the ethernet network and sets the network settings to the
				 * supplied parameters
				 * @method disableDHCP
				 * @param {string} ip4Addr
				 * @param {string} ip6Addr
				 * @param {string} subnet, eg 255.0.0.0
				 * @param {string} gateway
				 * @param {Array} dnsServers array of strings
				 */
				disableDHCP: function (ip4Addr, ip6Addr, subnet, gateway, dnsServers) {
					log("disableDHCP", "Disabling DHCP using " + ip4Addr + " " + subnet);
					var id = getInterfaceIdUsingName($N.platform.system.Network.NetworkType.ETHERNET);
					CCOM.IpNetwork.setIpAddress(id, ip4Addr, subnet);
					CCOM.IpNetwork.gateway = gateway;
					CCOM.IpNetwork.dns = dnsServers;
				},

				/**
				 * Enables dhcp and causes a lease refresh
				 * @method enableDHCP
				 */
				enableDHCP: function () {
					log("enableDHCP", "Enabling DHCP...");
					var id = getInterfaceIdUsingName($N.platform.system.Network.NetworkType.ETHERNET);
					CCOM.IpNetwork.setIpAddress(id, "dhcp", "dhcp");
				},

				/**
				 * Provides the IP address from CCOM.
				 * @method getIpAddress
				 * @return {String} IP address
				 */
				getIpAddress : function () {
					var ipAddress,
						interfaces = CCOM.IpNetwork["interface"],
						interfacesLength = interfaces.length,
						i;

					for (i = 0; i < interfacesLength; i++) {
						if (interfaces[i].name === $N.platform.system.Network.NetworkType.ETHERNET) {
							return interfaces[i].ip;
						}
					}

					return null;
				},

				/**
				 * Provides the Subnet Mask from CCOM.
				 * @method getSubnetMask
				 * @return {String}
				 */
				getSubnetMask: function () {
					var ethernet = this.getNetworkByType($N.platform.system.Network.NetworkType.ETHERNET);
					return ethernet.netmask || null;
				},

				/**
				 * Provides a list of DNS Servers from CCOM.
				 * @method getDnsServers
				 * @return {Array} DNS Servers
				 */
				getDnsServers : function () {
					var dnsServers = CCOM.IpNetwork.dns;
					return dnsServers || null;
				},

				/**
				 * Provides the gateway from CCOM.
				 * @method getGateway
				 * @return {String} IP address
				 */
				getGateway : function () {
					var gateway = CCOM.IpNetwork.gateway;
					return gateway || null;
				},

				/**
				 * Pings the given address, and invokes the appropriate callback depending on whether the ping was successful.
				 * NOTE: this is available only in CCOM ver 1.4 and above. If called while running under CCOM 1.3 or lower,
				 * this function will not do anything
				 *
				 * @method ping
				 * @param address {String} the IP address or the DNS name of the resource to ping
				 * @param successCallback {Function} the function that will be invoked if the ping is successful
				 * @param failureCallback {Function} the function that will be invoked if the ping fails
				 * @param [timeout] {Number} the timeout (in seconds) after which the ping will be considered to have failed
				 */
				ping: function (address, successCallback, failureCallback, timeout) {
					// timeout is optional
					if (address) {
						CCOM.IpNetwork.addEventListener('pingOK', successCallback);
						CCOM.IpNetwork.addEventListener('pingFailed', failureCallback);
						CCOM.IpNetwork.ping(address);
					}

				},

				/**
				 * Network objects are not cached. This method has been deprecated
				 * @method refreshNetworksCache
				 * @deprecated Network objects are not cached any more
				 */
				refreshNetworksCache: function () {},

				/**
				 * Configures the ethernet
				 * @method configure
				 * @param {String} ethernet
				 */
				configure: function (ethernet) {
					$N.platform.system.Network.ETHERNET = ethernet;
					$N.platform.system.Network.NetworkType.ETHERNET = ethernet;
				},

				/**
				 * API to deal with state changes on the network
				 *
				 * @class $N.platform.system.StateChange
				 * @singleton
				 */
				StateChange : (function () {

					var registered = false,
						ethUpCallBack = function () {},
						ethDownCallBack = function () {};

					/**
					 * this is called when a CCOM OnLinkDown event is fired
					 * @method linkDownListener
					 * @param {Object} e the event that is fired
					 */
					var linkDownListener = function (e) {
						if (e["interface"].name === $N.platform.system.Network.NetworkType.ETHERNET) {
							ethAvailable = false;
							if (ethDownCallBack) {
								ethDownCallBack();
							}
						}
					};

					/**
					 * this is called when a CCOM OnLinkUp event is fired
					 * @method linkUpListener
					 * @param {Object} e the event that is fired
					 */
					var linkUpListener = function (e) {
						if (e["interface"].name === $N.platform.system.Network.NetworkType.ETHERNET) {
							ethAvailable = true;
							if (ethUpCallBack) {
								ethUpCallBack();
							}
						}
					};

					return {

						/**
						 * Set callback for when Ethernet becomes available
						 *
						 * @method setEthUpCallback
						 * @param {Object} callback The callback function
						 */
						setEthUpCallBack : function (callback) {
							ethUpCallBack = callback;
						},

						/**
						 * set callback for when Ethernet is no longer available
						 *
						 * @method setEthDownCallBack
						 * @param {Object} callback The callback function
						 */
						setEthDownCallBack : function (callback) {
							ethDownCallBack = callback;
						},

						/**
						 * registers the NetworkStateChange event listener
						 *
						 * @method registerListener
						 */
						registerListener : function () {
							var i = 0;
							if (!registered) {
								CCOM.IpNetwork.addEventListener("onLinkDown", linkDownListener);
								CCOM.IpNetwork.addEventListener("onLinkUp", linkUpListener);
								registered = true;
							}
						},

						/**
						 * unregisters (removes) the NetworkStateChange event listener
						 *
						 * @method unRegisterListener
						 */
						unRegisterListener : function () {
							var i = 0;
							if (registered) {
								CCOM.IpNetwork.removeEventListener("onLinkDown", linkDownListener);
								CCOM.IpNetwork.removeEventListener("onLinkUp", linkUpListener);
								registered = false;
							}
						}
					};
				}())
			};
		}());
		return $N.platform.system.Network;
	}
);

$N.platform.system.Network.NetworkType = {
/**
 * Ethernet type
 * @property {Number} NetworkType.ETHERNET
 * @readonly
 */
	ETHERNET : "eth0",
/**
 * @property {Number} NetworkType.DVB_C
 * @readonly
 */
	DVB_C : "",
/**
 * @property {Number} NetworkType.DVB_S
 * @readonly
 */
	DVB_S : "",
/**
 * @property {Number} NetworkType.DVB_T
 * @readonly
 */
	DVB_T : "",
/**
 * @property {Number} NetworkType.OTHER
 * @readonly
 */
	OTHER : "",
/**
 * @property {Number} NetworkType.WIFI
 * @final
 */
	WIFI : "ra0"
};

/**
 * @property {Number} Network.ETHERNET
 * @deprecated Use $N.platform.system.Network.NetworkType.ETHERNET instead
 */
$N.platform.system.Network.ETHERNET = "eth0";

/**
 * @property {Number} Network.DVB_C
 * @deprecated Use $N.platform.system.Network.NetworkType.DVB_C instead
 */
$N.platform.system.Network.DVB_C = "";

/**
 * @property {Number} Network.DVB_T
 * @deprecated Use $N.platform.system.Network.NetworkType.DVB_T instead
 */
$N.platform.system.Network.DVB_T = "";

/**
 * @property {Number} Network.DVB_S
 * @deprecated Use $N.platform.system.Network.NetworkType.DVB_S instead
 */
$N.platform.system.Network.DVB_S = "";
