/**
 * @class $N.app.Config
 * @static
 * @requires $N.platform.system.Preferences
 */
(function ($N) {

	$N = $N || {};
	$N.app = $N.app || {};
	$N.app.Config = (function () {

		/*
		 * Application Settings
		 * ====================
		 * Set your values here to determine the application state
		 */

		var config = {
			"network.server.qsp.path": {
				value: "/hue-gateway/gateway/http/js",
				override: true
			},
			"metadata.language": {
				value: "pt_BR",
				override: true
			},
			"metadata.baseUri": {
				value: "/metadata/delivery",
				override: true
			},
			"metadata.searchUri": {
				value: "/metadata/solr",
				override: true
			},
			"metadata.provider": {
				value: "NET",
				override: true
			},
			"epg.cache.expiry": {
				value: 7200000, // 2 hours in MS
				override: true
			},
			"external.epg.poster.path": {
				value: "/images/",
				override: false
			},
			"epg.channelLogo.pattern": {
				value: "/logos/%UNIQUE_SERVICE_ID%.jpg",
				override: false
			},
			"exclude.unsubscribed.channels": {
				value: "false",
				override: false
			},
			"show.unsubscribed.channels": {
				value: "true",
				override: false
			},
			/*
			 * sets the proxy for the browser
			 * {String}
			 */
			"network.http.proxy": {
				value: "",
				override: false
			},
			/*
			 * sets the STB environment
			 * {String} IP, (expects network, will signon)
			 * DVB, (no signon, runs channel scan)
			 * HYBRID (signon if network otherwise DVB)
			 */
			"stb.environment": {
				value: "HYBRID",
				override: true
			},
			/*
			 * if true pvr options will be available
			 * {String} true, false
			 */
			"pvr.enabled": {
				value: "true",
				override: true
			},
			/*
			 * if true catchup will be available
			 * {String} true, false
			 * TODO - NETUI-2105 - To be removed when alternative mechinism in in place
			 */
			"catchup.enabled" : {
				value: "true",
				override: false
			},
			/*
			 * if true startover will be available
			 * {String} true, false
			 * TODO - NETUI-2105 - To be removed when alternative mechinism in in place
			 */
			"startover.enabled" : {
				value: "true",
				override: false
			},
			/*
			 * feature flag for WHPVR.
			 * value : Feature Flag for WHPVR
			 * {String}
			 */
			"whpvr.feature.enabled": {
				value: "false",
				override: false
			},
			/*
			 * feature flag for Media Playback.
			 * value : Feature Flag for Media Playback
			 * {Bool}
			 */
			"media.playback.feature.enabled": {
				value: true,
				override: false
			},
			/*
			 * if true moca will be available
			 * {String} true, false
			 * TODO - NETUI-2105 - To be removed when alternative mechinism in in place
			 */
			"moca.enabled" : {
				value: "false",
				override: true
			},

			/*
			 * if true PIP will be available
			 * {String} true, false
			 */
			"pip.enabled" : {
				value: "true",
				override: false
			},

			/*
			 * set to true if pvr is enabled but middleware does not support pvr
			 * {String} true, false
			 */
			"mock.pvr.manager": {
				value: "false",
				override: true
			},
			/*
			 * If true will use cas id of content to attempt to decrypt
			 * {String} true, false
			 */
			"prm.enabled": {
				value: "false",
				override: true
			},
			/* sets the tuner Type
			 * {String} DVBC, (for DVBC tuner type)
			 * DVBS, (for DVBS tuner type)
			 */
			"stb.tuner.type": {
				value: "DVBC",
				override: true
			},
			/* sets the number of tuners available
			 * TODO: this is only to be used whilst we await a better MW API http://jira.opentv.com/browse/NO5SA2-28
			 * {Number} tuners
			 */
			"stb.numberOfTuners": {
				value: 2,
				override: true
			},
			/*
			 * if true Reminder options will be available
			 * {String} true, false
			 */
			"reminder.enabled": {
				value: "true",
				override: true
			},
			/*
			 * {Object} barker channel service object
			 */
			"barker.channel.service": {
				value: {serviceId: "0001001901f4", uri: "tv://channel.0001001901f4", type: 1, channelKey: 500, serviceName: "NET TV HD"},
				//value: {}, // if no barker service available set to an empty object
				override: true
			},
			/*
			 * {string} portal content json service url
			 */
			"portal.url": {
				value: "/portal",
				override: true
			},
			/*
			 * {Number} time to wait between refreshes (MS)
			 */
			"vod.emptynode.refresh": {
				value : 7200000,
				override: true
			},
			/*
			 * {string} now catalogue override json service url
			 */
			"now.catalogue.override.url": {
				value: "/now/nowOverrides.js",
				override: true
			},
			/*
			 * last played radio genre and channel in music application
			 * {String} "genreIndex,channelIndex"
			 */
			"music.lastPlayed.channel": {
				value: "0,18",
				override: false
			},
			/*
			 * As part of R1 - R2 migration, we had to follow TI's
			 * way of storing the default folder
			 * {string} portal content json service url
			 */
			"pvr.defaultfolder": {
				value: "/",
				override: false
			},
			/*
			 * if keep until options will be available
			 * As part of R1 - R2 migration, we had to follow TI's
			 * way of storing the pvr. keep until
			 * 0 = Until space needed
			 * 1 = Manual delete
			 * 2 = After 30days (This is removed as part of upgrade from TI to us)
			 * {String}
			 */
			"pvr.keep": {
				value: "1",
				override: false
			},
			/*
			 * if Block option will be available
			 * As part of R1 - R2 migration, we had to follow TI's
			 * way of storing the pvr lock.
			 * 0 = No block
			 * 1 = Requires pin for playback
			 * {String} 1, 0
			 */
			"pvr.lock": {
				value: "0",
				override: false
			},
			/*
			 * subtitle state selection
			 * {String} off, por
			 */
			"subtitle.language": {
				value: "por",
				override: false
			},
			/*
			 * audio language selection
			 * {String} eng, dub
			 */
			"audio.language": {
				value: "dub",
				override: false
			},
			/*
			 * menu language selection
			 * {String} en_gb, pt_br
			 */
			"language": {
				value: "pt_br",
				override: false
			},
			/*
			 * non episodic folder test data
			 * {String} en_gb, pt_br
			 */
			//the folders given here are only for UI purpose , just test data
			"pvr.folders": {
				value: [""],
				override: false
			},
			/*
			 * photo display duration during transition from one to another
			 * {int} in seconds
			 */
			"usbdlna.photo.display.duration": {
				value: 10,
				override: false
			},
			/*
			 * animated transition effects
			 * {int} value
			 */
			"usbdlna.photo.transition.effects": {
				value: -1,
				override: false
			},
			/*
			 * Playback player display time out
			 * {int} value in seconds
			 */
			"usbdlna.player.banner.timeout": {
				value: 3,
				override: false
			},
			/*
			 * surfer timeout duration
			 * {string} milli seconds
			 */
			"zapping.banner.timeout": {
				value: "5000",
				override: false
			},
			/*
			 * Tips from NET option
			 * {boolean} true, false
			 */
			"ti.net.servicetips": {
				value: "true",
				override: false
			},
			/*
			 * miniguide pip position
			 * {string}
			 */
			"miniguiuide.pip.pos": {
				value: "1",
				override: false
			},
			/*
			 * HD aspect ratio format option
			 *  {string} "hdmiLetterbox", "hdmiStretch"
			 */
			"av.default.aspect_ratio_hd": {
				value: "hdmiLetterbox",
				override: false
			},
			/*
			 * Hdmi audio format option
			 *  {int} HDMI_AUDIO_PCM: 4, HDMI_AUDIO_DOLBY: 6,
			 */
			"audio.prefFormat": {
				value: 6,
				override: false
			},
			/*
			 * Front panel Intensity option
			 *  {string} "intensityBright", "intensityFade"
			 */
			"system.frontpanel.intensity": {
				value: "7",
				override: false
			},
			/*
			 * Front panel Display option
			 *  {string} "channel 2", "time 1"
			 */
			"system.frontpanel.channel": {
				value: "2",
				override: false
			},
			/*
			 * Playback Player timeout duration
			 * As part of R1 - R2 migration, we had to follow TI's
			 * way of storing the pvr banner time out.
			 * {String} milli seconds
			 */
			"pvr.banner.timeout": {
				value: "5000",
				override: false
			},
			/* {string} portal content json service url for
			 * Episodic Recordings Padding Before
			 */
			"pvr.episodic.before.padding": {
				value: "15", //changed as part of R1 - R2 migration
				override: false
			},
			/*
			 * {string} portal content json service url for
			 * Episodic Recordings Padding After
			 */
			"pvr.episodic.after.padding": {
				value: "15", //changed as part of R1 - R2 migration
				override: false
			},
			/* {string} portal content json service url for
			 * Non Episodic Recordings Padding Before
			 */
			"before.padding": {
				value: "15", //changed as part of R1 - R2 migration, TI default value is 15
				override: false
			},
			/*
			 * {string} portal content json service url for
			 * Non Episodic Recordings Padding After
			 */
			"after.padding": {
				value: "15", //changed as part of R1 - R2 migration, TI default value is 15
				override: false
			},
			/*
			 * {string} portal content json service url for
			 * Episodic Recordings Block
			 */
			"pvr.episodic.blockPlayback": {
				value: "false",
				override: false
			},
			/*
			 * Episodic Recordings Type of Episodes
			 * {string}
			 */
			"pvr.episodic.typeOfEpisodes": {
				value: "just_this_episode",
				override: true
			},
			/*
			 * Episodic Recordings Keep Until
			 * {string}
			 */
			"pvr.episodic.keep.until": {
				value: "0",
				override: false
			},
			/*
			 * auto standby duration
			 *  {String} 240, 300, 360, 420, 480, -1
			 * As part of R1 - R2 migration, we had to follow TI's
			 * way of storing the inactivity timer in minutes
			 * so 1 hour is converted as 60 mins
			 * 4 hours = 240 and so on.
			 */
			"system.inactivitytimer": {
				value: "360",
				override: false
			},
			/*
			 * first install pin
			 * {string} representation of a 4 digit number
			 */
			"first.install.pin": {
				value: "8291",
				override: false
			},

			/*
			 * facebook pin setting
			 */
			"social.facebook.pinSetting": {
				value: "socialPinSettingNeverRequest",
				override: false
			},

			/*
			 * facebook pin
			 */
			"social.facebook.pin": {
				value: "0000",
				override: false
			},
			/*
			 * url of NET server responsible for
			 * fetching application launch config
			 */
			"applicationLaunch.url": {
				value: "/apps",
				override: true
			},

			/*
			 * url of NET server responsible for
			 * social activity
			 */
			"social.stb.url": {
				value: "http://ssolab1.nagra.com/net/stb-connect",
				override: true
			},

			/*
			 * url of NET server responsible for
			 * facebook token renewal
			 */
			"social.stb.token.renewal.url": {
				value: "http://10.12.129.5:3003",
				override: true
			},

			/*
			 * url of NET server responsible for
			 * social activity
			 */
			"social.facebook.graph.url": {
				value: "https://graph.facebook.com",
				override: false
			},

			/*
			 * url to store Facebook feature availability status
			 * {Bool}
			 */
			"social.facebook.featureAvailability": {
				value: true,
				override: true
			},

			/*
			 * UI configuration to forceDisable social feature
			 * {Bool}
			 */
			"social.facebook.forceDisable": {
				value: false,
				override: true
			},

			/*
			 * url to store salt string for encryption and decryption
			 * {string}
			 */
			"social.facebook.sharedSalt": {
				value: "abc456xyz",
				override: true
			},

			/*
			 * url to store the secret AES key string for encryption and decryption
			 * {string}
			 */
			"social.facebook.secretAesKey": {
				value: "nagrakey",
				override: true
			},

			/*
			 * url for setting grid guide mode
			 */
			"mode.viewType": {
				value: "grid",
				override: false
			},

			/*
			 * udn of recording server, which is empty when for local recording.
			 */
			"record.server.udn": {
				value: "",
				override: false
			},

			"traxis.developer.mode": {
				value: "off",
				override: false
			},
			"traxis.developer.server": {
				value: "http://172.16.6.134/traxis",
				override: true
			},

			"mds.developer.mode": {
				value: "on",
				override: true
			},
			"mds.developer.server": {
			    //				value: "http://ssolab1.nagra.com",
			    			    value: "http://localhost:51478/app/client/apps",
	//		    value: "http://localhost:51478",
			    override: true,
	//		    value: "http://silverclouddevelopment.com",
			},
			"mds.developer.promo_path": {
				value: "/net/posters/epg",
				override: true
			},
			"mds.developer.poster_path": {
				value: "/net/posters/epg/",
				override: true
			},
			"vod.poster.prefix": {
				value: "/posters/vod_posters",
				override: true
			},
			/*
			 * feature flag for VOD Recommendations.
			 * value : Feature is Enabled or Disabled
			 * {String}
			 */
			"VOD.recommendation.feature.enabled": {
				value: "true",
				override: false
			},
			//TODO: NETUI-2729: REMOVE three faked.playback config items below.
			// They are for off-site playback of Now/CatchUp/StartOver only.
			"faked.playback": {
				value: "false",
				override: true
			},
			"faked.playback.serviceId": {
				value: "000100720220",
				override: true
			},
			"faked.playback.serviceUri": {
				value: "tv://channel.000100720220",
				override: true
			},

			"usageid.manual.override": {
				value: "true",
				override: false
			},

			/*
			 * config value to store migration status
			 * Used in Migration from TIUI to Nagra UI
			 * false = migration not done
			 * true = migration done
			 */
			"ui.migration.status": {
				value: false,
				override: false
			},

			/*
			 * jsfw log level config
			 * When defaultValues is set to 0, no modules / classes / methods will be logged
			 * except for those passed into the set logging methods with a value of 1.
			 * When defaultValues is set to 1, all modules / classes / methods will be logged
			 * except for those passed into the set logging methods with a value of 0.
			 */
			"log.config": {
				value: {
					enableLogging: false,
					defaultValues: 0,
					loggingLevels: {error: 0, warn: 0, debug: 0, info: 0},
					moduleLogging: {},
					classLogging: {},
					methodLogging: {}
				},
				override: true
			},
			"ppv.subscriptionApp.launchChannel": {//TODO - might have to change when we get to know from which channel, application has to launch
				value: {serviceId: "000100010001", uri: "tv://channel.000100010001", type: 1, channelKey: 1, name: "NOW"},
				override: true
			},

			"dvb.scan.configuration": {
				value: "",
				override: false
			},

			"analytics.enabled": {
				value: "false",
				override: true
			},

			"analytics.server": {
				value: "0.0.0.0",
				override: true
			},

			"build.mode": {
				value: "DEV",
				override: true
			}
		};

		return {

			/**
			 * Returns a config object from the Config list for
			 * a given key
			 * @method getConfig
			 * @returns {Object}
			 */
			getConfig: function (key) {
				return config[key];
			},

			/**
			 * Returns a config object value from the Config list for
			 * a given key
			 * @method getConfigValue
			 * @returns {String}
			 */
			getConfigValue: function (key) {
				return config[key].value;
			},

			/**
			 * Processes all the configuration settings and persists them to preferences
			 * @method initialise
			 */
			initialise: function () {
				var e,
					currentVal,
					isAbsolute = false;
				for (e in config) {
					if (config.hasOwnProperty(e) && !config.dontPersist) {
						isAbsolute = config[e].isAbsolute || false;
						currentVal = $N.platform.system.Preferences.get(e, isAbsolute);
						if (currentVal === undefined || (currentVal !== "" && config[e].override)) {
							$N.platform.system.Preferences.set(e, config[e].value, isAbsolute);
						}
					}
				}
			}

		};

	}());

}($N || {}));
