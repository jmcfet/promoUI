/*global CryptoJS, JsonFormatter */
/**
 * ApplicationLauncher is responsible for launching applications relating
 * to services within the system.
 *
 * @class $N.app.ApplicationLauncher
 * @author rvaughan
 * @static
 * @requires $N.apps.core.Log
 * @requires $N.apps.core.ContextManager
 * @requires $N.app.DialogueHelper
 * @requires $N.platform.system.Preferences
 * @requires $N.app.constants
 * @requires $N.app.Config
 * @requires $N.app.NetworkUtil
 * @requires $N.apps.util.EventManager
 */
(function ($N) {

	$N = $N || {};
	$N.app = $N.app || {};

	$N.app.ApplicationLauncher = (function () {
		var log = new $N.apps.core.Log("Helper", "ApplicationLauncher"),
			REDIRECT_DELAY = 2000,
			currentChannelNumber = null,
			isZapperInFocus = null,
			redirectPerformed = false,
			redirectTimeoutId = null,
			eventObject = null,
			currentConfiguration = null,
			launchConfigFetchTimeoutId = null;

		/**
		 * @method clearChannelTimeout
		 * @private
		 */
		function clearChannelTimeout() {
			log("clearChannelTimeout", "Enter");
			if (redirectTimeoutId !== null) {
				clearTimeout(redirectTimeoutId);
				redirectTimeoutId = null;
			}
			log("clearChannelTimeout", "Exit");
		}

		/**
		 * @method processRedirect
		 * @private
		 */
		function processRedirect() {
			var redirectContext = null;

			log("processRedirect", "Enter");
			if (isZapperInFocus && !redirectPerformed && !$N.app.DialogueHelper.isDialogueCurrentlyShown()) {
				if (currentConfiguration) {
					redirectContext = currentConfiguration[currentChannelNumber];
					if (redirectContext) {
						clearChannelTimeout();
						redirectTimeoutId = setTimeout(function () {
							if (redirectContext.indexOf("/") === 0) {
								$N.apps.core.ContextManager.navigate("HTMLAPPS", {url: redirectContext, previousService : eventObject.previousService});
								redirectPerformed = true;
								redirectTimeoutId = null;
							} else {
								$N.apps.core.ContextManager.navigate(redirectContext, eventObject);
								redirectPerformed = true;
								redirectTimeoutId = null;
							}
						}, REDIRECT_DELAY);
					} else {
						log("processRedirect", "No application mapped to the currently tuned channel.");
					}
				} else {
					log("processRedirect", "Application mapping data not found in the config.");
				}
			}
			log("processRedirect", "Exit");
		}

		/**
		 * @method zapperOpenedListener
		 * @private
		 */
		function zapperOpenedListener() {
			log("zapperOpenedListener", "Enter");
			isZapperInFocus = true;
			processRedirect();
			log("zapperOpenedListener", "Exit");
		}

		/**
		 * @method zapperClosedListener
		 * @private
		 */
		function zapperClosedListener() {
			log("zapperClosedListener", "Enter");
			clearChannelTimeout();
			isZapperInFocus = false;
			log("zapperClosedListener", "Exit");
		}

		/**
		 * @method channelChangedListener
		 * @param eventObj Event associated with the change in channel.
		 * @private
		 */
		function channelChangedListener(eventObj) {
			log("channelChangedListener", "Enter");
			clearChannelTimeout();
			redirectPerformed = false;
			eventObject = eventObj.data;
			currentChannelNumber = eventObject.currentService ? eventObject.currentService.logicalChannelNum : eventObject.logicalChannelNum;
			processRedirect();
			log("channelChangedListener", "Exit");
		}

		function initialiseApplicationChannelMapping() {
			log("initialiseApplicationChannelMapping", "Enter");
			var server = $N.platform.system.Preferences.get("/network/siconfig/CustomDescriptorTags/netMdsServer", true),
				url = "",
				timeOfLastSchedulerRun = $N.platform.system.Preferences.get($N.app.constants.TIME_OF_APP_LAUNCH_CONFIG_FETCH_SCHEDULER_RUN),
				noOfHours = null;
			if (launchConfigFetchTimeoutId) {
				clearTimeout(launchConfigFetchTimeoutId);
			}
			if ($N.app.Config.getConfigValue("mds.developer.mode") === "on") {
				server = $N.app.Config.getConfigValue("mds.developer.server");
			}
			if (timeOfLastSchedulerRun) {
				noOfHours = (Date.now() - parseInt(timeOfLastSchedulerRun, 10)) / $N.app.constants.HOUR_IN_MS;
				if (noOfHours < $N.app.constants.DAY_IN_HOURS) {
					log("initialiseApplicationChannelMapping", "going to return due to less than 24 hrs");
				    return;
				}
			}
			if (server) {
				url = server + $N.app.Config.getConfigValue($N.app.constants.APPLICATION_LAUNCH_URL) + "/launch_config.json";
				log("initialiseApplicationChannelMapping", url);
				if ($N.app.NetworkUtil.isUrlValid(url)) {
					log("initialiseApplicationChannelMapping", "URL is valid.");
					$N.app.NetworkUtil.ajaxRequest(url,
						function (data) {
							log("initialiseApplicationChannelMapping", data);
							currentConfiguration = JSON.parse(data);
							if (currentConfiguration) {
								$N.platform.system.Preferences.setPreferenceObject($N.app.constants.APPLICATION_LAUNCH_CONFIG, currentConfiguration);
								$N.platform.system.Preferences.set($N.app.constants.TIME_OF_APP_LAUNCH_CONFIG_FETCH_SCHEDULER_RUN, String(Date.now()));
								log("initialiseApplicationChannelMapping", "Application mapping data saved.");
							} else {
								// TODO: Handle this failure case
								log("initialiseApplicationChannelMapping", "Handle this failure case.");
								launchConfigFetchTimeoutId = window.setTimeout(initialiseApplicationChannelMapping, $N.app.constants.FIVE_MINUTES_IN_MS);
							}
						},
						function (response) {
							// TODO: Handle this failure case
							log("initialiseApplicationChannelMapping", "Request Failure");
							launchConfigFetchTimeoutId = window.setTimeout(initialiseApplicationChannelMapping, $N.app.constants.FIVE_MINUTES_IN_MS);
						}
						);
				}
			} else {
				// TODO: Handle this failure case
				log("initialiseApplicationChannelMapping", "Handle this failure case.");
				launchConfigFetchTimeoutId = window.setTimeout(initialiseApplicationChannelMapping, $N.app.constants.FIVE_MINUTES_IN_MS);
			}
			log("initialiseApplicationChannelMapping", "Exit");
		}

		function setApplicationsLaunchConfigFetchScheduler() {
			var server = $N.platform.system.Preferences.get("/network/siconfig/CustomDescriptorTags/netMdsServer", true),
				url = "",
				timeOfLastSchedulerRun = $N.platform.system.Preferences.get($N.app.constants.TIME_OF_APP_LAUNCH_CONFIG_FETCH_SCHEDULER_RUN);
			if (server) {
				url = server + $N.app.Config.getConfigValue($N.app.constants.APPLICATION_LAUNCH_URL) + "/launch_config.json";
				$N.app.Reminders.setDailyScheduler($N.app.constants.APPLICATION_LAUNCH_CONFIG_FETCH_SCHEDULER_TITLE, url,
					$N.app.constants.TIME_OF_APP_LAUNCH_CONFIG_FETCH_SCHEDULER_RUN, initialiseApplicationChannelMapping, 1);
				if (!timeOfLastSchedulerRun) {
					initialiseApplicationChannelMapping();
				}
			} else {
				window.setTimeout(setApplicationsLaunchConfigFetchScheduler, $N.app.constants.FIVE_MINUTES_IN_MS);
			}
		}

		/**
		 * @method initialise
		 * @public
		 */
		function initialise(eventObj) {
			log("initialise", "Enter");
			currentConfiguration = $N.platform.system.Preferences.getPreferenceObject($N.app.constants.APPLICATION_LAUNCH_CONFIG);
			log("initialise", "currentConfiguration : " + currentConfiguration);
			setApplicationsLaunchConfigFetchScheduler();
			CCOM.IpNetwork.addEventListener("onIpReceived", initialiseApplicationChannelMapping);
			$N.apps.util.EventManager.subscribe("zapperOpened", zapperOpenedListener, this);
			$N.apps.util.EventManager.subscribe("zapperClosed", zapperClosedListener, this);
			$N.apps.util.EventManager.subscribe("channelChanged", channelChangedListener, this);
			log("initialise", "Exit");
		}

		return {
			initialise: initialise,
			initialiseApplicationChannelMapping: initialiseApplicationChannelMapping
		};
	}());

}($N || {}));
