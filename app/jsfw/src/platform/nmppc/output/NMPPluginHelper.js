/**
 * NMPPluginHelper is a stand alone class that will perform the NMP Plugin version checking & Handle Application Feedback Events
 *
 * @class $N.platform.output.NMPPluginHelper
 * @singleton
 * @author SDermott
 */

/* global, navigator, window, localStorage, location, ActiveXObject, XDomainRequest, console */

define('jsfw/platform/output/NMPPluginHelper',
	[],
	function () {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.output = $N.platform.output || {};

		$N.platform.output.NMPPluginHelper = (function () {
			'use strict';

			var DEFAULT_UPDATE_MANAGER_URL = "http://nmpbp.nagra.com/Upgrade/checkForUpgrade",
				install = false;
		
			function supportsLocalStorage() {
				try {
					localStorage.setItem("available", "true");
					return true;
				} catch (e) {
					return false;
				}
			}
		
			function getUrlVars() {
				var vars = {},
					parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
					vars[key] = value;
				});
				return vars;
			}
		
			function checkNMPUpgradeRequired(applicationData, platform, playerOrPluginVersion, callback) {
		
				var xmlhttp,
					data = JSON.stringify({
						"applicationData": applicationData,
						"platform": platform,
						"playerOrPluginVersion": playerOrPluginVersion
					});
		
				if(window.XDomainRequest) {
					xmlhttp = new XDomainRequest();
					xmlhttp.onload = function () {
						callback(JSON.parse(xmlhttp.responseText));
					};
				} else if (window.XMLHttpRequest) {
					xmlhttp = new XMLHttpRequest();
					
				} else { // code for IE6, IE5
					xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
				}
				xmlhttp.onreadystatechange = function () {
					if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
						callback(JSON.parse(xmlhttp.responseText));
					}
				};
				xmlhttp.open("POST", $N.platform.output.NMPPluginHelper.UPDATE_MANAGER_URL, true);
				xmlhttp.send(data);
			}
		
			function checkNMPInstallation(element, pluginID, callback) {
				
				var pluginData = {},
					videoTag,
					videoLoadedTimeout,
					videoLoaded = function () {
						clearTimeout(videoLoadedTimeout);
						pluginData = {
							version: window.userAgent.version,
							platform: window.userAgent.platform
						};
						callback(pluginData);
					};
				
				window.onJSBridgeAvailable = function () {
					videoTag = document.getElementById(pluginID);
					window.userAgent = videoTag.userAgent;
					videoLoaded();
				};
				
				var pluginNotInstalled = function() {
					var browserPlatform;
					
					switch(navigator.platform) {
						case 'Mac68K':
						case 'MacPPC':
						case 'MacIntel':
							browserPlatform = "MacOS";
							break;
						default:
							browserPlatform = navigator.platform;
					}
					pluginData = {
						version: '0',
						platform: browserPlatform
					};
					callback(pluginData);
				};
				
				element = document.getElementById(element);
				element.innerHTML = "<object id='"+pluginID+"' type='application/x-nmpcbrowserplugin'><param name='onload' value='onJSBridgeAvailable'/></object>";
				videoLoadedTimeout = setTimeout(pluginNotInstalled,10000);
			}
		
			function createNMPBrowserPlugin(element, pluginID, data) {
		
				var divElement = document.getElementById(element);
		
				// IE Fix for creating object tag with codebase url
				if (window.ActiveXObject && data) {
					data.downloadUrl = data.downloadUrl.replace(".exe", ".cab");
					data.version = data.version.replace(/\./g, ',');
					var codebase = data.downloadUrl + "#version=" + data.version;
					divElement.innerHTML = "<object id='" + pluginID + "' codeBase='" + codebase + "' type='application/x-nmpcbrowserplugin'><param name='onload' value='onJSBridgeAvailable'/></object>";
				} else {
					divElement.innerHTML = "<object id='" + pluginID + "' type='application/x-nmpcbrowserplugin'><param name='onload' value='onJSBridgeAvailable'/></object>";
				}
		
				if (!window.ActiveXObject && data) {
					data.downloadUrl = data.downloadUrl.replace(".cab", ".exe");
					var iframe = document.createElement('iframe');
					iframe.style.display = 'none';
					document.body.appendChild(iframe);
					iframe.src = data.downloadUrl;
				}
			}
		
			function installNMPBrowserPlugin(data) {
				data.downloadUrl = data.downloadUrl.replace(".cab", ".exe");
				var iframe = document.createElement('iframe');
				iframe.style.display = 'none';
				document.body.appendChild(iframe);
				iframe.src = data.downloadUrl;
			}
		
			function initialiseNMPPluginHelper(element, pluginID, AppData, forceUpgrade, callback) {
		
				var updateCallback = function (data) {
		
					var callbackStatus = {
						status: data.status,
						version: data.version
					};
		
					if (install) {
						callbackStatus.status = "PLAYER_INSTALLING";
						installNMPBrowserPlugin(data);
					} else {
						if (data.status === "PLAYER_UPGRADE_REQUIRED" || (data.status === "PLAYER_UPGRADE_RECOMMENDED" && forceUpgrade === true)) {
							callbackStatus.status = "PLAYER_UPGRADING";
							if (supportsLocalStorage()) {
								localStorage.setItem("version", data.version);
								localStorage.setItem("downloadUrl", data.downloadUrl);
								location.reload(true);
							} else {
								location.href = location.href + '?downloadUrl=' + encodeURIComponent(data.downloadUrl) + '&version=' + encodeURIComponent(data.version);
							}
						}
					}
					callback(callbackStatus);
				};
		
				var versionCheckCallback = function (pluginData) {
					if (pluginData.version === '0') {
						install = true;
						checkNMPUpgradeRequired(AppData, pluginData.platform, pluginData.version, updateCallback);
					} else {
						install = false;
						checkNMPUpgradeRequired(AppData, pluginData.platform, pluginData.version, updateCallback);
					}
				};
		
				var data;
				if (supportsLocalStorage() && localStorage.getItem("downloadUrl")) {
					data = {
						version: localStorage.getItem("version"),
						downloadUrl: localStorage.getItem("downloadUrl"),
						status: "PLAYER_UPGRADING"
					};
					callback(data);
					createNMPBrowserPlugin(element, pluginID, data);
					localStorage.removeItem("version");
					localStorage.removeItem("downloadUrl");
				} else if (!supportsLocalStorage() && getUrlVars().downloadUrl) {
					data = {
						version: getUrlVars().version,
						downloadUrl: decodeURIComponent(getUrlVars().downloadUrl),
						status: "PLAYER_UPGRADING"
					};
					callback(data);
					createNMPBrowserPlugin(element, pluginID, data);
				} else {
					checkNMPInstallation(element, pluginID, versionCheckCallback);
				}
			}
		
			// PUBLIC API
			return {
		
				/**
				 * init is a helper method that calls all of the methods & returns the status & version of the plugin.
				 * This method will automatically upgrade the plugin if the status is 'PLAYER_UPGRADE_REQUIRED'.
				 * If 'forceUpgrade is set to 'true' the plugin will be upgraded, else an update will be ignored.
				 * @method init
				 * @param {String} parentID The ID of the DIV where the player will be created.
				 * @param {String} pluginID The desired ID of the Plugin object once it has been created.
				 * @param {String} AppData Application Data / An authentication token or other data giving access to the portal.
				 * @param {Boolean} forceUpgrade Forces upgrade of the plugin if status is 'PLAYER_UPGRADE_RECOMMENDED'
				 * @param {Function} callback An asynchronous callback providing the an object with the status & version of the plugin.
				 */
				init: initialiseNMPPluginHelper,
		
				/**
				 * checkNMPInstallation is a stand method that checks if the plugin is installed.
				 * @method checkNMPInstallation
				 * @param {String} parentID The ID of the DIV where the player will be created.
				 * @param {String} pluginID The desired ID of the Plugin object once it has been created.
				 * @param {Function} callback An asynchronous callback that returns the version of the plugin if it is installed. If the plugin is not installed this method will return false.
				 */
		
				checkNMPInstallation: checkNMPInstallation,
		
				/**
				 * checkNMPInstallation is a stand method that checks the status of the plugin that is currently installed.
				 * @method checkNMPInstallation
				 * @param {String} AppData Application Data / An authentication token or other data giving access to the portal.
				 * @param {String} platform The platform that the plugin is currently installed on.
				 * @param {String} playerOrPluginVersion The version of the plugin that is currently installed.
				 * @param {Function} callback An asynchronous callback providing the an object with the status & version of the plugin.
				 */
				checkNMPUpgradeRequired: checkNMPUpgradeRequired,
		
				/**
				 * updateNMPBrowserPlugin is a stand method that dynamically creates the Plugin Object & updates it.
				 * If Internet Explorer, the plugin will silently upgrade, else a download instance will be triggered providing an installer to upgrade to the latest version.
				 * @method updateNMPBrowserPlugin
				 * @param {String} parentID The ID of the DIV where the player will be created.
				 * @param {String} pluginID The desired ID of the plugin object once it has been created.
				 * @param {Object} data Data object containing downloadURL & version.
				 * @param {String} data.downloadUrl URL Containing the upgrade installer.
				 * @param {String} data.version The version of the plugin to install.
				 */
				updateNMPBrowserPlugin: createNMPBrowserPlugin,
		
				/**
				 * installNMPBrowserPlugin a stand method that triggers a download instance providing an installer to install to the latest version of the plugin.
				 * @method installNMPBrowserPlugin
				 * @param {Object} data Data object containing downloadURL & version.
				 * @param {String} data.downloadUrl URL Containing the plugin installer.
				 * @param {String} data.version The version of the plugin to install.
				 */
				installNMPBrowserPlugin: installNMPBrowserPlugin,
				
				/**
				 * UPDATE_MANAGER_URL can be set to the URL of the Upgrade Manager Server - Defaults to : 'http://nmpbp.nagra.com/Upgrade/checkForUpgrade'
				 * @property {String} UPDATE_MANAGER_URL The URL of the Upgrade Manager Server
				 */
				UPDATE_MANAGER_URL : DEFAULT_UPDATE_MANAGER_URL
		
			};

		}());
		return $N.platform.output.NMPPluginHelper;
	}
);