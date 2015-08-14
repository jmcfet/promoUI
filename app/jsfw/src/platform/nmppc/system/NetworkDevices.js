/**
 * Abstraction class to simplify the interface for all device intercommunication
 * such as retrieving the device list and sending items to other devices etc
 *
 * Must call init first
 * $N.platform.system.NetworkDevices.init()
 *
 * Service Discovery Process for a specified type / domain
 * $N.platform.system.NetworkDevices.startServiceDiscovery(type, domain)
 *
 * then for each found service of specified type in specified domain a ServiceFound event is fired
 * when service disappears a ServiceLost event is fired
 *
 * To stop service discovery for a specified type / domain
 * $N.platform.system.NetworkDevices.stopServiceDiscovery(type, domain)
 *
 * @class $N.platform.system.Services
 * @singleton
 * @requires $N.apps.core.Log
 */

/* global */

define('jsfw/platform/system/NetworkDevices',
	['jsfw/apps/core/Log'],
	function (Log) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.system = $N.platform.system || {};

		$N.platform.system.NetworkDevices = (function () {

		    var log = new $N.apps.core.Log("system", "NetworkDevices"),
				serviceList = [],
				domainList = [],
				stopAll = false,
				stopAllCallback = null,
				zeroConfAgent = null,
				eventLookup = {},
				ZEROCONF_DISCOVERY_STARTED = "started",
				ZEROCONF_DISCOVERY_STOPPED = "stopped",
				ZEROCONF_SERVICE_ADDED = "added",
				ZEROCONF_SERVICE_RESOLVED = "resolved",
				ZEROCONF_SERVICE_REMOVED = "removed",
				ZEROCONF_DEFAULT_DOMAIN = "",
				ZEROCONF_DEFAULT_SERVICE = "_kojak._tcp",
				ZEROCONF_SERVICE_DISCOVERY_ERROR = "discovery",
				ZEROCONF_SERVICE_RESOLUTION_ERROR = "resolution",
				SERVICE_FOUND_EVENT_NAME = "ServiceFound",
				SERVICE_RESOLVED_EVENT_NAME = "ServiceResolved",
				SERVICE_LOST_EVENT_NAME = "ServiceLost";

			/**
			 * Returns the index of the given service within the service list
			 * @method getIndexForServiceName
			 * @private
			 * @param {string} serviceName
			 * @return {Number} The index of the service or -1 if not found
			 */
			function getIndexForServiceName(serviceName) {
				var i;

				for (i = 0; i < serviceList.length; i++) {
					if (serviceList[i].id === serviceName) {
						return i;
					}
				}
				return -1;
			}

			/**
			 * Function to check whether or not we currently are searching a given domain / type pair
			 * @method doesDomainPairExist
			 * @private
			 * @param {string} registrationType the service registration type no longer being browsed for
			 * @param {string} domain the domain being searched
			 * @return {boolean} whether the given pair already exists
			 */
			function doesDomainPairExist(registrationType, domain) {
				var i,
					found = false;

				for (i = 0; i < domainList.length; i++) {
					if ((domainList[i].regType === registrationType) &&
							(domainList[i].domain === domain)) {
						found = true;
						break;
					}
				}

				return found;
			}

			/**
			 * Function to remove a given domain / type pair from the currently searching list
			 * @method removeItemFromDomainList
			 * @private
			 * @param {string} registrationType the service registration type no longer being browsed for
			 * @param {string} domain the domain being searched
			 */
			function removeItemFromDomainList(registrationType, domain) {
				var i;

				for (i = 0; i < domainList.length; i++) {
					if ((domainList[i].regType === registrationType) &&
							(domainList[i].domain === domain)) {
						domainList.splice(i, 1);
						break;
					}
				}
			}

			/**
			 * Fires an event with the given event name
			 * @method fireEvent
			 * @private
			 * @param {String} eventName
			 * @param {Object} param Parameter to pass to the callbacks
			 */
		    function fireEvent(eventName, param) {
		        if (eventLookup[eventName]) {
		            eventLookup[eventName].forEach(function (callback) {
		                callback(param);
		            });
		        }
		    }

			/**
			 * Callback function used for processing the successfull starting and stopping of
			 * service discoveries
			 * @method serviceDiscoveryCallback
			 * @private
			 * @param {string} type start or stop of the search
			 * @param {string} registrationType the service registration type no longer being browsed for
			 * @param {string} domain the domain being searched
			 */
		    function serviceDiscoveryCallback(type, registrationType, domain) {
				log("serviceDiscoveryCallback", "Discovery Callback: " + type + ", " + registrationType + ", " + domain, Log.LOG_DEBUG);
				switch (type) {
				case ZEROCONF_DISCOVERY_STARTED:
					if (doesDomainPairExist(registrationType, domain) === false) {
						domainList[domainList.length] = {regType: registrationType, domain: domain};
					}
					break;
				case ZEROCONF_DISCOVERY_STOPPED:
					removeItemFromDomainList(registrationType, domain);
					if (domainList.length === 0) {
						if (stopAll === true) {
							stopAll = false;
							if (stopAllCallback !== null) {
								stopAllCallback();
								stopAllCallback = null;
							}
						}
					}
					break;
				}
		    }

			/**
			 * Callback function used to handle errors generated by the zeroConf agent service discovery process
			 * depending on the error type, 1 or more of the parameters will be null
			 * @method serviceErrorCallback
			 * @private
			 * @param {string} errorType either service discovery or service resolution
			 * @param {string} registrationType the service registration type no longer being browsed for
			 * @param {string} domain the domain being searched
			 * @param {Object} service the discovered service
			 * @param {Number} errorCode the error code of the error
			 */
			function serviceErrorCallback(errorType, registrationType, domain, service, errorCode) {
				log("serviceErrorCallback", "Service " + errorType + " Error - REGISTRATION TYPE: " + registrationType + ", DOMAIN: " + domain + ", Error: " + errorCode, Log.LOG_DEBUG);
		    }

		   /**
			 * Callback function used to handle discovered services and either store them / remove them or add them
			 * depending on the given action
			 * @method serviceManagerCallback
			 * @private
			 * @param {string} action the action to take with the given service
			 * @param {Object} service the newly available service
			 * @param {boolean} isMoreServicesAvailable flag indicating whether or not more services are available
			 */
		    function serviceManagerCallback(action, service, isMoreServicesAvailable) {
				log("serviceManagerCallback", "serviceManagerCallback - Action: " + action + ", Service Name: " + service.name + ", More Services? : " + isMoreServicesAvailable, Log.LOG_DEBUG);
				var newService,
					index;
				switch (action) {
				case ZEROCONF_SERVICE_ADDED:
					zeroConfAgent.resolveService(JSON.stringify(service));
					fireEvent(SERVICE_FOUND_EVENT_NAME, service);
					break;
				case ZEROCONF_SERVICE_RESOLVED:
					newService = {id: service.name, serviceObj: service};
					serviceList.push(newService);
					fireEvent(SERVICE_RESOLVED_EVENT_NAME, newService);
					break;
				case ZEROCONF_SERVICE_REMOVED:
					index = getIndexForServiceName(service.name);
					if (index !== -1) {
						serviceList = serviceList.slice(index, 1);
						fireEvent(SERVICE_LOST_EVENT_NAME, service.name);
					}
					break;
				}
		    }

		    /**
			 * Starts  a service discovery process - if the received parameters are null it uses the defined defaults
			 * @method startServiceDiscovery
			 * @param {string} type the service registration type being browsed for
			 * @param {string} domain the domain being searched
			 */
			function startServiceDiscovery(type, domain) {

				var searchType, searchDomain;

				searchType = ((type === undefined) ? ZEROCONF_DEFAULT_SERVICE : type);
				searchDomain = ((domain === undefined) ? ZEROCONF_DEFAULT_DOMAIN : domain);

				// If the app is running in browser mode we cannot use ZeroconfAgent to discover the Bonjour Service
				if (doesDomainPairExist(searchType, searchDomain) === false) {
					log("startServiceDiscovery", "Service Discover Started - REGISTRATION TYPE: " + searchType + ", DOMAIN: " + searchDomain, Log.LOG_DEBUG);
					zeroConfAgent.startServiceDiscovery(searchType, searchDomain, "$N.platform.system.NetworkDevices._serviceDiscoveryCallbackObj");
				}
		    }

		    /**
			 * Stops a service discovery process - if the received parameters are null it uses the defined defaults
			 * @method stopServiceDiscovery
			 * @param {string} type the service registration type no longer being browsed for
			 * @param {string} domain the domain being searched
			 */
			function stopServiceDiscovery(type, domain) {

				var searchType, searchDomain;

				searchType = ((type === undefined) ? ZEROCONF_DEFAULT_SERVICE : type);
				searchDomain = ((domain === undefined) ? ZEROCONF_DEFAULT_DOMAIN : domain);
				// If the app is running in browser mode we cannot use ZeroconfAgent to discover the Bonjour Service
				zeroConfAgent.stopServiceDiscovery(searchType, searchDomain);
			}

		    /**
			 * Stops all the service discovery processes already running
			 * @method stopAllServices
			 * @param {Function} callback Callback function for when all services have been stopped
			 */
			function stopAllServices(callback) {

				var i;

				stopAllCallback = callback || null;
				stopAll = true;

				for (i = 0; i < domainList.length; i++) {
					zeroConfAgent.stopServiceDiscovery(domainList[i].regType, domainList[i].domain);
				}
			}

		    /**
			 * Returns the array containing all the service discovery processes already running
			 * @method getDomainList
			 * @return {Array} array containing all the service pair objects
			 */
			function getDomainList() {
				return domainList;
			}

		    /**
			 * Returns the array containing all the service discovery processes already running
			 * @method getServiceList
			 * @return {Array} array containing all the resolved Services
			 */
			function getServiceList() {
				return serviceList;
			}

		    /**
			 * Initialises the devices api
			 * @method init
			 */
			function init() {
				zeroConfAgent = window.zeroconfAgent;
			}

			/**
			 * Initialises the devices api
			 * @method initialise
			 * @deprecated use init()
			 */
			function initialise() {
				init();
			}

			/**
			 * Adds an event listener for the given event name
			 * @method addEventListener
			 * @param {String} eventName
			 * @param {Function} callback
			 */
			function addEventListener(eventName, callback) {
				if (!eventLookup[eventName]) {
				    eventLookup[eventName] = [];
				}
				eventLookup[eventName].push(callback);
			}

			/**
			 * Removes an event listener for the given event name
			 * @method removeEventListener
			 * @param {String} eventName
			 * @param {Function} callback
			 */
		    function removeEventListener(eventName, callback) {
		        if (eventLookup[eventName]) {
		            eventLookup[eventName] = eventLookup[eventName].filter(function (value) {return value !== callback; });
		        }
		    }

		    /**
			 * Fired when a new service is discovered
			 * @event ServiceFound
			 * @param {Object} the service that was found
			 */

			/**
			 * Fired when a service is lost
			 * @event ServiceLost
			 * @param {String} the name of the service that was lost
			 */

			/**
			 * Fired when a service is lost
			 * @event ServiceResolved
			 * @param {Object} the service the app has just resolved to
			 */

			/*
			 * Public API
			 */
			return {
				startServiceDiscovery:			startServiceDiscovery,
				stopServiceDiscovery:			stopServiceDiscovery,
				stopAllServices:				stopAllServices,
				getServiceList:					getServiceList,
				getDomainList:					getDomainList,
				init:							init,
				initialise:						initialise,
				addEventListener:				addEventListener,
				removeEventListener:			removeEventListener,
				_serviceDiscoveryCallbackObj: {
					serviceDiscoveryStarted: function (xRegType, xDomain) {
						serviceDiscoveryCallback(ZEROCONF_DISCOVERY_STARTED, xRegType, xDomain);
					},
					serviceDiscoveryError: function (xRegType, xDomain, xError) {
						serviceErrorCallback(ZEROCONF_SERVICE_DISCOVERY_ERROR, xRegType, xDomain, null, xError);
					},
					serviceDiscoveryStopped: function (xRegType, xDomain) {
						serviceDiscoveryCallback(ZEROCONF_DISCOVERY_STOPPED, xRegType, xDomain);
					},
					serviceAdded: function (xService, xMore) {
						serviceManagerCallback(ZEROCONF_SERVICE_ADDED, xService, xMore);
					},
					serviceResolved: function (xService) {
						serviceManagerCallback(ZEROCONF_SERVICE_RESOLVED, xService, null);
					},
					serviceError: function (xService, xError) {
						serviceErrorCallback(ZEROCONF_SERVICE_RESOLUTION_ERROR, null, null, xService, xError);
					},
					serviceRemoved: function (xService, xMore) {
						serviceManagerCallback(ZEROCONF_SERVICE_REMOVED, xService, xMore);
					}
				}
			};
		}());
		return $N.platform.system.NetworkDevices;
	}
);