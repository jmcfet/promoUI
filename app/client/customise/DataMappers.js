var $N = $N || {};
$N.app = $N.app || {};
$N.app.DataMappers = (function () {
	var log = new $N.apps.core.Log("Helper", "DataMappers");

	// Public
	return {
		/**
		 * @method initialise
		 */
		initialise: function () {
			log("initialise", "Enter");
			$N.apps.core.Language.adornWithGetString($N.app.DataMappers);
			log("initialise", "Exit");
		},
		getSettings: function () {
			return {
				getTitle: function (obj) {
					return $N.app.DataMappers.getString(obj.title);
				},
				getLogo: function (obj) {
					return obj.logo;
				},
				getLogoHighlight: function (obj) {
					return obj.logoHighlight;
				}
			};
		},
		getMessageMails: function () {
			return {
				getMailId: function (obj) {
					return obj.cookedID;
				},
				getMailReadStatus: function (obj) {
					return obj.read;
				},
				getMailDate: function (obj) {
					return $N.app.DateTimeUtil.getDayMonthTimeStringFromMS(obj.date);
				},
				getMailTitle: function (obj) {
					return obj.title;
				},
				getMailContent: function (obj) {
					return obj.content;
				},
				setMailReadStatus: function (obj) {
					obj.read = true;
				}
			};
		},
		getBasicSettingsSubMenuMapper: function () {
			return {
				getFirstTitle: function (obj) {
					return $N.app.DataMappers.getString(obj.title);
				},
				getFirstSubTitle: function (obj) {
					return (obj.firstSubTitle);
				},
				getSecondTitle: function (obj) {
					return $N.app.DataMappers.getString(obj.secondTitle);
				},
				getSecondSubTitle: function (obj) {
					return (obj.secondSubTitle);
				}
			};
		},
		getSettingsSTBInfoViewDataMapper: function () {
			return {
				getTitle: function (obj) {
					return $N.app.DataMappers.getString(obj.title);
				},
				getSubTitle: function (obj) {
					return obj.subTitle;
				}
			};
		},
		getRecordingsSubMenuListData: function () {
			return {
				getTitle: function (obj) {
					return $N.app.DataMappers.getString(obj.title);
				},
				getIcon: function (obj) {
					var preferences = $N.platform.system.Preferences.get(obj.constant);
					if (obj.value === preferences) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				}
			};
		},
		getMaxNofEpisodesSubMenu: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getIcon: function (obj) {
					var preferences = $N.platform.system.Preferences.get($N.app.constants.PREF_EPISODIC_MAX_NOF_EPISODES);
					if (obj.value === preferences) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				}
			};
		},
		getPlaybackPlayerSubMenu: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getIcon: function (obj) {
					var preferences = $N.platform.system.Preferences.get($N.app.constants.PREF_PLAYBACK_PLAYER_TIMEOUT);
					if (obj.value === preferences) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				}
			};
		},
		getDiagnosticsProgress: function () {
			return {
				getTitle: function (obj) {
					return $N.app.DataMappers.getString(obj.title);
				},
				getProgress: function (obj) {
					var progress = parseInt(obj.subTitle, 10);
					if (isNaN(progress)) {
						progress = 0;
					}
					return progress;
				}
			};
		},
		getDiagnosticsSignalStrengthProgress: function () {
			return {
				getTitle: function (obj) {
					return $N.app.DataMappers.getString(obj.title);
				},
				getProgress: function (obj) {
					var progress = parseInt(obj.subTitle, 10);
					if (isNaN(progress)) {
						progress = -16; // As -16dBmV is the minimum value for PS
					} else {
						if ($N.app.GeneralUtil.isFloat(obj.subTitle)) {
							progress = Number(obj.subTitle).toFixed(1);
						}
					}
					return progress;
				}
			};
		},
		getMenuParentalRatings: function () {
			return {
				getTitle: function (obj) {
					return $N.app.DataMappers.getString(obj.title);
				},
				getIcon: function (obj) {
					var morality = $N.app.SettingsAPI.getMoralityLevel();
					if ((obj.morality >= morality && obj.title !== "parentalRatingNoBlock") ||
								(obj.morality === morality && obj.title === "parentalRatingNoBlock")) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				},
				getAdditionalIcon: function (obj) {
					return obj.ratingIcon;
				}
			};
		},
		getMenuRecordingsFolder: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getIcon: function (obj) {
					var defaultFolderName = $N.app.FolderUtil.getNonEpisodicDefaultFolder();
					if (obj.value === defaultFolderName) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				},
				getAdditionalIcon: function (obj) {
					return "../../../customise/resources/images/%RES/icons/DVR_pasta_menor.png";
				}
			};
		},
		getMenuUsbFolder: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getIcon: function (obj) {
					return "";
				},
				getAdditionalIcon: function (obj) {
					if (obj.type === "Folder") {
						return "../../../customise/resources/images/%RES/icons/DVR_pasta_menor.png";
					} else if (obj.type === "File") {
						return "MOVETEXT";
					}
				}
			};
		},
		getMenuLanguageSubMenu: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getIcon: function (obj) {
					var preferences = $N.platform.system.Preferences.get($N.app.constants.PREF_LANGUAGE);
					if (obj.value === preferences) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				}
			};
		},
		getAutoTuneFrequencySubMenu: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getIcon: function (obj) {
					var preferences = $N.app.AutoTuneHelper.getAutoTuneProperty("frequency");
					if (obj.value === preferences) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				}
			};
		},
		getAudioLanguageSubMenu: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getIcon: function (obj) {
					var preferences = $N.platform.system.Preferences.get($N.app.constants.PREF_AUDIO_LANGUAGE);
					if (obj.value === preferences) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				}
			};
		},
		getSubtitleSubMenu: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getIcon: function (obj) {
				/*
				 *we are activating the subtitle based on the settings preference. Ex: If English is selected in the settings option, then English subtitle
				 * should play on the screen if it is available in the track else subtitle will be off.
				 */
					var preferences = $N.platform.system.Preferences.get($N.app.constants.PREF_SUBTITLE_STATE);
					if (obj.value.toLowerCase() === preferences.toLowerCase()) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				}
			};
		},
		/**
		 *method to return an object which will have methods as properties
		 * to return title and icon for an particular list item
		 * @Method getTransitionEffectsSubMenu
		 * @return {object}
		 */
		getTransitionEffectsSubMenu: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getIcon: function (obj) {
					var preferences = $N.platform.system.Preferences.get($N.app.constants.PREF_USBDLNA_PHOTO_TRANSITION_EFFECTS);
					if (obj.value === preferences) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				}
			};
		},
		getMiniguideDurationSubMenu: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getIcon: function (obj) {
					var preferences = parseInt($N.platform.system.Preferences.get($N.app.constants.PREF_ZAPPING_BANNER_TIMEOUT), 10);
					if (obj.value === preferences) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				}
			};
		},
		getTipsFromNetSubMenu: function () {
			return {
				getTitle: function (obj) {
					return $N.app.DataMappers.getString(obj.title);
				},
				getIcon: function (obj) {
					var preferences = $N.platform.system.Preferences.get($N.app.constants.PREF_DEFAULT_TIPSFROMNET);
					if (obj.value === preferences) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				}
			};
		},
		getMiniguidePipPositionSubMenu: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getIcon: function (obj) {
					var preferences = parseInt($N.platform.system.Preferences.get($N.app.constants.PREF_MINIGUIDE_PIP_POSITION), 10);
					if (obj.value === preferences) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				}
			};
		},
		getAllChannelsForBlockedView: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getIcon: function (obj) {
					if ($N.app.ChannelManager.isBlockedChannel(obj)) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				},
				getChannelNumber: function (obj) {
					return obj.channelNumber;
				}
			};
		},
		getAllChannels: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getIcon: function (obj) {
					if ($N.app.ChannelManager.isFavouriteChannel(obj.channelInfo)) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				},
				getChannelNumber: function (obj) {
					return obj.channelNumber;
				}
			};
		},
		getFavourites: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getChannelNumber: function (obj) {
					return obj.channelNumber;
				}
			};
		},
		getOptionWindowItems: function () {
			return {
				getTitle: function (obj) {
					return $N.app.DataMappers.getString(obj.title);
				},
				getIcon: function (obj) {
					var isAbsolute = obj.isAbsolute || false,
						preferences = $N.platform.system.Preferences.get(obj.constant, isAbsolute);
					if (obj.option === preferences) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				}
			};
		},
		getAutoTuneAllChannels: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getIcon: function (obj) {
					var preferences = $N.app.AutoTuneHelper.getAutoTuneProperty("logicalChannelNum"),
						channelNumber = null;
					if (typeof (obj.channelNumber) === "string") {
						channelNumber = parseInt(obj.channelNumber, 10);
					} else {
						channelNumber = obj.channelNumber;
					}
					if (channelNumber === preferences) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				},
				getChannelNumber: function (obj) {
					return obj.channelNumber;
				}
			};
		},
		getAutoTuneList: function () {
			var dataMapper = {
				getTitle: function (obj) {
					return (obj.startDate + ", " + obj.startTime + ", " + $N.app.StringUtil.lowercaseFirstLetter($N.app.DataMappers.getString("autoTunefrequencies")[obj.jobType]));
				},
				getSubTitle: function (obj) {
					return (obj.channelNumber + " " + obj.serviceName);
				},
				getChannelLogo: function (obj) {
					return obj.channelLogo;
				},
				getChannelNumber: function (obj) {
					return obj.channelNumber;
				}
			};

			return $N.app.GeneralUtil.mixin(dataMapper, this.getServiceDataMapper());
		},
		getReminderList: function () {
			var dataMapper = {
				getTitle: function (obj) {
					var extendedInfo = $N.app.epgUtil.getExtendedInfoByEventId(obj.eventId),
						serviceObj = $N.platform.btv.EPG.getChannelByServiceId(obj.serviceId),
						episodeId = obj.episodeId || extendedInfo.episode;
					if ($N.app.ParentalControlUtil.isChannelOrProgramLocked(obj) && ($N.app.epgUtil.isAdultEvent(obj) || $N.app.genreUtil.isAdultChannel(serviceObj))) {
						return $N.app.DataMappers.getString("adultContent");
					}
					if (episodeId) {
						return (obj.title + $N.app.epgUtil.getSeasonEpisodeShort(obj, " "));
					}
					return obj.title;
				},
				getSubTitle: function (obj) {
					return (obj.startDate + ", " + obj.startTime);
				},
				getChannelLogo: function (obj) {
					return obj.channelLogo;
				},
				getChannelNumber: function (obj) {
					return obj.channelNumber;
				}
			};

			return $N.app.GeneralUtil.mixin(dataMapper, this.getServiceDataMapper());
		},
		getOptionWindowItemsLookUp: function () {
			return {
				getTitle: function (obj) {
					return obj.title;
				},
				getIcon: function (obj) {
					var preferences = $N.platform.system.Preferences.get(obj.constant);
					if (obj.value === preferences) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				}
			};
		},
		getVideoSystemSubMenu: function () {
			return {
				getTitle: function (obj) {
					return $N.app.DataMappers.getString(obj.title);
				},
				getIcon: function (obj) {
					var preferences = $N.platform.system.Preferences.get(obj.constant, obj.absolutePath);
					if (obj.value === preferences) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				}
			};
		},
		getWHPvrRecordServerData: function () {
			return {
				getTitle: function (obj) {
					log("getWHPvrRecordServerData: current Server = ", obj.title);
					return obj.title;
				},
				getIcon: function (obj) {
					var currentRecordServer = $N.platform.btv.WHPVRManager.getCurrentRecordServer();
					log("getWHPvrRecordServerData: current Udn = ", currentRecordServer);
					if (obj.value === currentRecordServer) {
						return "../../../customise/resources/images/%RES/icons/tick_17x17.png";
					} else {
						return "";
					}
				}
			};
		},
		getWHPvrServersData: function () {
			return {
				getTitle: function (obj) {
					log("getWHPvrServersData: ", obj.title + " === " + $N.app.DataMappers.getString(obj.title));
					return obj.title;
				},
				getSubTitle: function (obj) {
					return obj.subTitle;
				}
			};
		},
		getPurchaseItemData: function () {
			return {
				getTitle: function (obj) {
					var serviceInfo = $N.app.StringUtil.join(" ", [obj.channr.toString(), obj.channame]),
						dateTimeInfo = $N.app.DateTimeUtil.getWeekdayDayMonthTimeStringFromDate(new Date(obj.startTime));
					return $N.app.StringUtil.join(" | ", [serviceInfo, dateTimeInfo]);
				},
				getSubTitle: function (obj) {
					return obj.eventname;
				},
				getAdditionalText: function (obj) {
					var purchaseRate = (obj.cost * 0.01).toFixed(2);
					purchaseRate = purchaseRate.replace(".", ",");
					return purchaseRate;
				}
			};
		},
		getServiceDataMapper: function () {
			return {
				getChannelName: function (data) {
					return data.serviceName || "";
				},
				getChannelAbbreviation: function (data) { // TODO: Update this function when channel name abbreviations become available in SI
					if (data.serviceName) {
						return data.serviceName.split(' ')[0].substring(0, 5).toUpperCase();
					}
					return "";
				},
				getDefinition: function (data) {
					return data.definition || "";
				},
				getChannelLogo: function (data) {
					return $N.app.epgUtil.getChannelLogoUrl(data.serviceId) || '';
				},
				getChannelNumber: function (data) {
					return $N.app.GeneralUtil.padNumberWithZeroes(data.logicalChannelNum, 3) || "";
				}
			};
		}
	};

}());
