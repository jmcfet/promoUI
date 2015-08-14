/**
 * Helper class for all menus inside settings
 *
 * @class $N.app.FormatUtils
 * @author ravichan
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.FormatUtils = (function () {

		/**
		 * Attaches the UI configuaration objects to each menuitem
		 * @method attachConfigs
		 * @private
		 * @param {Object} data, {Object} configDetails
		 * @return {Array} The modified data.
		 */
		function attachConfigs(data, configDetails) {
			var i;
			for (i = 0; i < data.length; i++) {
				data[i].configs = configDetails[data[i].title];
			}
			return data;
		}

		function formatChannelNumber(channelNumber) {
			var channelNumLength = channelNumber.toString().length,
				formattedChannelNum = "";
			if (channelNumLength === 1) {
				formattedChannelNum = "00" + channelNumber;
			} else if (channelNumLength === 2) {
				formattedChannelNum = "0" + channelNumber;
			} else {
				formattedChannelNum = channelNumber;
			}
			return formattedChannelNum;
		}

		function getMediaMenuStatus() {
			return ($N.app.FeatureManager.getMediaPlaybackFeatureStatus() && ($N.app.UsbBrowserHelper.getMediaPlaybackStatus() || ($N.app.DlnaHelper.getAvailableDevices().length > 0) ? true : false));
		}

		function getShortCutConfigsMenuMediaPreferences() {
			return [{
				"dataMapper": "BasicSettingsSubMenuMapper",
				"changeTitle": "true",
				"itemTemplate": "MultipleTitleSubtitleItem",
				"component": "firstSubMenuList",
				"isAvailable" : $N.app.FormatUtils.getMediaMenuStatus,
				"scrollComponent": "scrollIndicatorFirstMenu",
				"uiConfigs": {
					"componentConfig": [{
						"setter": "itemHeight",
						"value": "114"
					}, {
						"setter": "y",
						"value": "95"
					}, {
						"setter": "backgroundConfig",
						"value": {
							"y": "-65"
						}
					}]
				},
				"footerConfig": {
					"group" : "firstMenuFooter",
					"uiConfigs" : [{
						"component" : "footerBackgroundBox",
						"componentConfig" : [ {
							"setter" : "Width",
							"value" : "661"
						}]
					}, {
						"component" : "leftArrow",
						"componentConfig" : [ {
							"setter" : "visible",
							"value" : "true"
						}]
					}, {
						"component" : "rightArrow",
						"componentConfig" : [ {
							"setter" : "visible",
							"value" : "true"
						}, {
							"setter": "x",
							"value": "627"
						}]
					}, {
						"component" : "backLabel",
						"componentConfig" : [ {
							"setter" : "text",
							"value" : "menuSettingsBack"
						}]
					}, {
						"component" : "forwardLabel",
						"componentConfig" : [ {
							"setter" : "text",
							"value" : "menuSettingsForward"
						}, {
							"setter": "x",
							"value": "508"
						}]
					}]
				}
			}];
		}

		function getShortCutConfigsMenuRecorderPreferences() {
			return [{
				"dataMapper": "Settings",
				"itemTemplate": "MenuItemWithHighlight",
				"component": "firstSubMenuList",
				"isAvailable" : $N.app.PVRCapability.isPVREnabled,
				"uiConfigs": {
					"dataConfig": [{
						"setter": "VisibleRows",
						"value" : "5"
					}],
					"componentConfig": [{
						"setter": "itemHeight",
						"value": "77"
					}, {
						"setter": "y",
						"value": "95"
					}, {
						"setter": "backgroundConfig",
						"value": {
							"y": "-65"
						}
					}]
				},
				"footerConfig": {
					"group" : "firstMenuFooter",
					"uiConfigs" : [{
						"component" : "footerBackgroundBox",
						"componentConfig" : [{
							"setter" : "Width",
							"value" : "661"
						}]
					}, {
						"component" : "leftArrow",
						"componentConfig" : [{
							"setter" : "visible",
							"value" : "true"
						}]
					}, {
						"component" : "backLabel",
						"componentConfig" : [{
							"setter" : "text",
							"value" : "menuSettingsBack"
						}]
					}, {
						"component" : "rightArrow",
						"componentConfig" : [ {
							"setter" : "visible",
							"value" : "true"
						}, {
							"setter": "x",
							"value": "627"
						}]
					}, {
						"component" : "forwardLabel",
						"componentConfig" : [ {
							"setter" : "text",
							"value" : "menuSettingsForward"
						}, {
							"setter": "x",
							"value": "508"
						}]
					}]
				}
			}];
		}

		function getSocialAccountInformationConfig() {
			return [{
				"dataMapper": "Settings",
				"changeTitle": false,
				"itemTemplate": "MenuItemWithHighlight",
				"component": "secondSubMenuList",
				"uiConfigs": {
					"dataConfig": [{
						"setter": "VisibleRows",
						"value" : "4"
					}],
					"componentConfig": [{
						"setter": "itemHeight",
						"value": "70"
					}, {
						"setter": "y",
						"value": "265"
					}, {
						"setter": "backgroundConfig",
						"value": {
							"y": "-235"
						}
					}]
				},
				"showSubMenuTitle": "false",
				"subMenuTitleConfig": {
					"defaultConfig": {
						"x": 745,
						"y": 48
					},
					"modifiedConfig": {
						"x": 715,
						"y": 109.5,
						"visible": true
					}
				},
				"footerConfig": {
					"group" : "firstMenuFooter",
					"uiConfigs" : [{
						"component" : "footerBackgroundBox",
						"componentConfig" : [{
							"setter" : "Width",
							"value" : "1346"
						}]
					}, {
						"component" : "leftArrow",
						"componentConfig" : [{
							"setter" : "visible",
							"value" : "true"
						}]
					}, {
						"component" : "backLabel",
						"componentConfig" : [{
							"setter" : "text",
							"value" : "menuSettingsBack"
						}]
					}, {
						"component" : "selectLabel",
						"componentConfig" : [{
							"setter" : "text",
							"value" : "menuokSelectLabel"
						}, {
							"setter" : "X",
							"value" : "755"
						}]
					}, {
						"component" : "okIcon",
						"componentConfig" : [{
							"setter" : "visible",
							"value" : "true"
						}, {
							"setter" : "X",
							"value" : "710"
						}]
					}]
				}
			}];
		}

		function getSocialAccountPinSettingOptionsConfig() {
			return [{
				"dataMapper": "RecordingsSubMenuListData",
				"itemTemplate": "MenuItemIconWithHighlight",
				"component": "secondSubMenuList",
				"uiConfigs": {
					"dataConfig": [{
						"setter": "VisibleRows",
						"value" : "5"
					}],
					"componentConfig": [{
						"setter": "itemHeight",
						"value": "70"
					}, {
						"setter": "y",
						"value": "150"
					}, {
						"setter": "backgroundConfig",
						"value": {
							"y": "-120"
						}
					}]
				},
				"showSubMenuTitle": "true",
				"footerConfig": {
					"group" : "firstMenuFooter",
					"uiConfigs" : [{
						"component" : "footerBackgroundBox",
						"componentConfig" : [{
							"setter" : "Width",
							"value" : "1346"
						}]
					}, {
						"component" : "leftArrow",
						"componentConfig" : [{
							"setter" : "visible",
							"value" : "true"
						}]
					}, {
						"component" : "backLabel",
						"componentConfig" : [{
							"setter" : "text",
							"value" : "menuSettingsBack"
						}]
					}, {
						"component" : "selectLabel",
						"componentConfig" : [{
							"setter" : "text",
							"value" : "menuokSelectLabel"
						}, {
							"setter" : "X",
							"value" : "755"
						}]
					}, {
						"component" : "okIcon",
						"componentConfig" : [{
							"setter" : "visible",
							"value" : "true"
						}, {
							"setter" : "X",
							"value" : "710"
						}]
					}]
				}
			}];
		}

		function getSocialAccountOptionsConfig() {
			var config = [{
				"dataMapper": "BasicSettingsSubMenuMapper",
				"itemTemplate": "MultipleTitleSubtitleItem",
				"component": "firstSubMenuList",
				"uiConfigs": {
					"dataConfig": [{
						"setter": "VisibleRows",
						"value" : "3"
					}],
					"componentConfig": [{
						"setter": "itemHeight",
						"value": "120"
					}, {
						"setter": "itemConfig",
						"value": {
							"width": "661"
						}
					}]
				},
				"footerConfig": {
					"group" : "firstMenuFooter",
					"uiConfigs" : [{
						"component" : "footerBackgroundBox",
						"componentConfig" : [ {
							"setter" : "Width",
							"value" : "661"
						}]
					}, {
						"component" : "leftArrow",
						"componentConfig" : [ {
							"setter" : "visible",
							"value" : "true"
						}]
					}, {
						"component" : "rightArrow",
						"componentConfig" : [ {
							"setter" : "visible",
							"value" : "true"
						}, {
							"setter": "x",
							"value": "627"
						}]
					}, {
						"component" : "backLabel",
						"componentConfig" : [ {
							"setter" : "text",
							"value" : "menuSettingsBack"
						}]
					}, {
						"component" : "forwardLabel",
						"componentConfig" : [ {
							"setter" : "text",
							"value" : "menuSettingsForward"
						}, {
							"setter": "x",
							"value": "508"
						}]
					}]
				}
			}];
			return config;
		}

		function getDefaultFolderConfig() {
			var config = [{
				"dataMapper": "MenuRecordingsFolder",
				"itemTemplate": "RecordingFolderMenuItem",
				"component": "secondSubMenuList",
				"scrollComponent": "scrollIndicator",
				"uiConfigs": {
					"dataConfig": [{
						"setter": "VisibleRows",
						"value" : "6"
					}],
					"componentConfig": [{
						"setter": "itemHeight",
						"value": "70"
					}, {
						"setter": "y",
						"value": "150"
					}, {
						"setter": "backgroundConfig",
						"value": {
							"y": "-120"
						}
					}, {
						"setter": "itemConfig",
						"value": {
							"width": "661",
							"textWidth": 520
						}
					}]
				},
				"showSubMenuTitle": "true",
				"footerConfig": {
					"group" : "firstMenuFooter",
					"uiConfigs" : [{
						"component" : "footerBackgroundBox",
						"componentConfig" : [{
							"setter" : "Width",
							"value" : "1346"
						}]
					}, {
						"component" : "leftArrow",
						"componentConfig" : [{
							"setter" : "visible",
							"value" : "true"
						}]
					}, {
						"component" : "backLabel",
						"componentConfig" : [{
							"setter" : "text",
							"value" : "menuSettingsBack"
						}]
					}, {
						"component" : "selectLabel",
						"componentConfig" : [{
							"setter" : "text",
							"value" : "menuokSelectLabel"
						}, {
							"setter" : "X",
							"value" : "755"
						}]
					}, {
						"component" : "okIcon",
						"componentConfig" : [{
							"setter" : "visible",
							"value" : "true"
						}, {
							"setter" : "X",
							"value" : "710"
						}]
					}, {
						"component" : "greenKey",
						"componentConfig" : [{
							"setter" : "visible",
							"value" : "true"
						}, {
							"setter" : "X",
							"value" : ($N.platform.system.Preferences.get($N.app.constants.PREF_LANGUAGE) === $N.app.constants.LANG_PORTUGUESE_BR) ? "1070" : "1135"
						}]
					}, {
						"component" : "greenSelectLabel",
						"componentConfig" : [{
							"setter" : "text",
							"value" : "menuNewFolder"
						}, {
							"setter" : "X",
							"value" : ($N.platform.system.Preferences.get($N.app.constants.PREF_LANGUAGE) === $N.app.constants.LANG_PORTUGUESE_BR) ? "1110" : "1175"
						}]
					}]
				}
			}];
			return config;
		}

		return {
			/**
			 * @method initialise
			 */
			initialise: function () {
				$N.apps.core.Language.adornWithGetString($N.app.FormatUtils);
			},

			getBlockChannelMenuConfig: function () {
				var config = [{
					"dataMapper": "AllChannelsForBlockedView",
					"itemTemplate": "ChannelListIconItem",
					"component": "firstSubMenuList",
					"scrollType": "item",
					"title": "allChannels",
					"titleId": "firstSubMenuTitle",
					"directChannelEntryEnabled" : true,
					"uiConfigs": {
						"dataConfig": [{
							"setter": "VisibleRows",
							"value" : "6"
						}],
						"componentConfig": [{
							"setter": "itemHeight",
							"value": "70"
						}, {
							"setter": "y",
							"value": "125"
						}, {
							"setter": "backgroundConfig",
							"value": {
								"y": "-95"
							}
						}]
					},
					"isClearView" : "true",
					"showSubMenuTitle": "true",
					"itemSelected": "doubleMenuItemSelected",
					"scrollComponent": "scrollIndicatorFirstMenu"
				},
					{
						"dataMapper": "Favourites",
						"itemTemplate": "DoubleTextItem",
						"component": "secondSubMenuList",
						"scrollType": "item",
						"title": "menuBlockChannelsTitle",
						"titleId": "secondSubMenuTitle",
						"uiConfigs": {
							"dataConfig": [{
								"setter": "VisibleRows",
								"value" : "6"
							}],
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "125"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-95"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"itemSelected": "doubleMenuItemSelected",
						"scrollComponent": "scrollIndicator"
					}];
				return config;
			},

			getDefaultFolderConfig: getDefaultFolderConfig,

			getAlphaNumKeypadConfig: function () {
				return [{
					"component": "settingsKeypad",
					"uiConfigs" : {
						"component" : "backgroundConfig",
						"componentConfig" : [ {
							"setter" : "X",
							"value" : "0"
						}]
					},
					"isClearView" : "true",
					"footerConfig": {
						"group" : "firstMenuFooter",
						"uiConfigs" : [{
							"component" : "footerBackgroundBox",
							"componentConfig" : [ {
								"setter" : "Width",
								"value" : "661"
							}]
						}, {
							"component" : "leftArrow",
							"componentConfig" : [ {
								"setter" : "visible",
								"value" : "true"
							}]
						}, {
							"component" : "backLabel",
							"componentConfig" : [ {
								"setter" : "text",
								"value" : "menuSettingsBack"
							}]
						}, {
							"component" : "greenKey",
							"componentConfig" : [{
								"setter" : "visible",
								"value" : "true"
							}, {
								"setter" : "X",
								"value" : "400"
							}]
						}, {
							"component" : "greenSelectLabel",
							"componentConfig" : [{
								"setter" : "text",
								"value" : "menuCreateFolder"
							}, {
								"setter" : "X",
								"value" : "440"
							}]
						}]
					}
				}];
			},

			getParentalRatingsConfig: function () {
				return [{
					"dataMapper": "MenuParentalRatings",
					"itemTemplate": "RecordingFolderMenuItem",
					"component": "firstSubMenuList",
					"uiConfigs": {
						"dataConfig": [{
							"setter": "visibleRows",
							"value" : "7"
						}],
						"componentConfig": [{
							"setter": "backgroundConfig",
							"value": {
								"width": "1346",
								"y": "-30"
							}
						}, {
							"setter": "itemConfig",
							"value": {
								"width": "1346",
								"highlightWidth": "1310",
								"x": "18",
								"folderIconConfiguration": {y: 8},
								"textWidth": 1000
							}
						}, {
							"setter": "y",
							"value": "60"
						}]
					},
					"isClearView" : "true",
					"footerConfig": {
						"group" : "firstMenuFooter",
						"uiConfigs" : [{
							"component" : "footerBackgroundBox",
							"componentConfig" : [ {
								"setter" : "Width",
								"value" : "1346"
							}]
						}, {
							"component" : "leftArrow",
							"componentConfig" : [ {
								"setter" : "visible",
								"value" : "true"
							}]
						}, {
							"component" : "backLabel",
							"componentConfig" : [ {
								"setter" : "text",
								"value" : "menuSettingsBack"
							}]
						}, {
							"component" : "okIcon",
							"componentConfig" : [ {
								"setter" : "visible",
								"value" : "true"
							}, {
								"setter": "x",
								"value": ($N.platform.system.Preferences.get($N.app.constants.PREF_LANGUAGE) === $N.app.constants.LANG_PORTUGUESE_BR) ? "1020" : "1090"
							}]
						}, {
							"component" : "forwardLabel",
							"componentConfig" : [ {
								"setter" : "text",
								"value" : "menuBlockContentLabel"
							}, {
								"setter": "x",
								"value": ($N.platform.system.Preferences.get($N.app.constants.PREF_LANGUAGE) === $N.app.constants.LANG_PORTUGUESE_BR) ? "1070" : "1140"
							}]
						}]
					}
				}];
			},

			getBlocksSubMenuConfig: function () {
				return [{
					"dataMapper": "Settings",
					"changeTitle": false,
					"itemTemplate": "MenuItemWithHighlight",
					"component": "secondSubMenuList",
					"isClearView": false,
					"uiConfigs": {
						"dataConfig": [{
							"setter": "VisibleRows",
							"value" : "4"
						}],
						"componentConfig": [{
							"setter": "itemHeight",
							"value": "70"
						}, {
							"setter": "y",
							"value": "95"
						}, {
							"setter": "backgroundConfig",
							"value": {
								"y": "-65"
							}
						}]
					},
					"showSubMenuTitle": false,
					"footerConfig": {
						"group" : "firstMenuFooter",
						"uiConfigs" : [{
							"component" : "footerBackgroundBox",
							"componentConfig" : [{
								"setter" : "Width",
								"value" : "1346"
							}]
						}, {
							"component" : "leftArrow",
							"componentConfig" : [{
								"setter" : "visible",
								"value" : "true"
							}]
						}, {
							"component" : "backLabel",
							"componentConfig" : [{
								"setter" : "text",
								"value" : "menuSettingsBack"
							}]
						}, {
							"component" : "rightArrow",
							"componentConfig" : [ {
								"setter" : "visible",
								"value" : "true"
							}, {
								"setter": "x",
								"value": "1310"
							}]
						}, {
							"component" : "forwardLabel",
							"componentConfig" : [ {
								"setter" : "text",
								"value" : "menuSettingsForward"
							}, {
								"setter": "x",
								"value": "1190"
							}]
						}]
					}
				}];
			},

			formatRecorderSettingsMenuData: function (data) {
				var configDetails;
				configDetails = {
					"menuNonEpisodicRecording": [{
						"dataMapper": "BasicSettingsSubMenuMapper",
						"changeTitle": "true",
						"isClearView": "true",
						"itemTemplate": "MultipleTitleSubtitleItem",
						"component": "firstSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "114"
							}, {
								"setter": "y",
								"value": "95"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-65"
								}
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [ {
									"setter" : "Width",
									"value" : "661"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "rightArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter": "x",
									"value": "627"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "forwardLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsForward"
								}, {
									"setter": "x",
									"value": "508"
								}]
							}]
						}
					}],
					"menuEpisodicRecording": [{
						"dataMapper": "BasicSettingsSubMenuMapper",
						"changeTitle": "true",
						"isClearView" : "true",
						"itemTemplate": "MultipleTitleSubtitleItem",
						"scrollComponent": "scrollIndicatorFirstMenu",
						"component": "firstSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "114"
							}, {
								"setter": "y",
								"value": "95"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-65"
								}
							}],
							"dataConfig": [{
								"setter": "VisibleRows",
								"value" : "4"
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [ {
									"setter" : "Width",
									"value" : "661"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "rightArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter": "x",
									"value": "627"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "forwardLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsForward"
								}, {
									"setter": "x",
									"value": "508"
								}]
							}]
						}
					}],
					"menuPlaybackPlayer": [{
						"dataMapper": "BasicSettingsSubMenuMapper",
						"changeTitle": "true",
						"isClearView" : "true",
						"itemTemplate": "MultipleTitleSubtitleItem",
						"component": "firstSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "114"
							}, {
								"setter": "y",
								"value": "95"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-65"
								}
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [ {
									"setter" : "Width",
									"value" : "661"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "rightArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter": "x",
									"value": "627"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "forwardLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsForward"
								}, {
									"setter": "x",
									"value": "508"
								}]
							}]
						}
					}],

					"menuDiskDrive": [{
						"dataMapper": "Settings",
						"changeTitle": true,
						"isClearView" : true,
						"itemTemplate": "MenuItemWithHighlight",
						"component": "firstSubMenuList",
						"uiConfigs": {
							"dataConfig": [{
								"setter": "VisibleRows",
								"value" : "2"
							}],
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "95"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-65"
								}
							}]
						},
						"showSubMenuTitle": false,
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "661"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "rightArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter": "x",
									"value": "627"
								}]
							}, {
								"component" : "forwardLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsForward"
								}, {
									"setter": "x",
									"value": "508"
								}]
							}]
						}
					}],

					"menuWholeHomePvr": [{
						"dataMapper": "BasicSettingsSubMenuMapper",
						"changeTitle": true,
						"isClearView" : true,
						"itemTemplate": "MultipleTitleSubtitleItem",
						"component": "firstSubMenuList",
						"isAvailable" : true,	/*FIXME: how to make sure whpvr is enabled?*/
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "114"
							}, {
								"setter": "y",
								"value": "95"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-65"
								}
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [ {
									"setter" : "Width",
									"value" : "661"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "rightArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter": "x",
									"value": "627"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "forwardLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsForward"
								}, {
									"setter": "x",
									"value": "508"
								}]
							}]
						}
					}],

					"menuDefaultFolder": getDefaultFolderConfig(),

					"paddingBeforeNonEpisodic": [{
						"component": "settingsKeypad",
						"uiConfigs" : {
							"component" : "backgroundConfig",
							"componentConfig" : [ {
								"setter" : "X",
								"value" : "685"
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"paddingBeforeEpisodic": [{
						"component": "settingsKeypad",
						"uiConfigs" : {
							"component" : "backgroundConfig",
							"componentConfig" : [ {
								"setter" : "X",
								"value" : "685"
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuNonEpisodicKeepUntil": [{
						"dataMapper": "RecordingsSubMenuListData",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuEpisodicKeepUntil": [{
						"dataMapper": "RecordingsSubMenuListData",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"

								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuTypeOfEpisodes": [{
						"dataMapper": "RecordingsSubMenuListData",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuNonEpisodicBlockPlayback": [{
						"dataMapper": "RecordingsSubMenuListData",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuEpisodicBlockPlayback": [{
						"dataMapper": "RecordingsSubMenuListData",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"pvrPlaybackPlayer": [{
						"dataMapper": "PlaybackPlayerSubMenu",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"dataConfig": [{
								"setter": "visibleRows",
								"value" : "6"
							}],
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuLocalServerName": [{
						"component": "settingsKeypad",
						"uiConfigs" : {
							"component" : "backgroundConfig",
							"componentConfig" : [ {
								"setter" : "X",
								"value" : "685"
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}, {
								"component" : "greenKey",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "1135"
								}]
							}, {
								"component" : "greenSelectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSaveLabel"
								}, {
									"setter" : "X",
									"value" : "1175"
								}]
							}]
						}
					}],

					"menuRecordLocation": [{
						"dataMapper": "WHPvrRecordServerData",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"dataConfig": [{
								"setter": "visibleRows",
								"value" : "6"
							}],
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}]
				};
				data = attachConfigs(data, configDetails);
				return data;
			},

			formatSystemMenuData: function () {
				var data = [
						{
							"title": "menuIPConnections",
							"drawMenuCallback" : "systemViewDrawMenuCallback",
							"configs": [{
								"dataMapper": "SettingsSTBInfoViewDataMapper",
								"itemTemplate": "SettingsSystemMenuItem",
								"component": "secondMultiItemTypeSubMenuList",
								"isClearView" : "true",
								"scrollType": "page",
								"scrollComponent": "scrollIndicator",
								"isMultiplePageSupported" : "true",
								"footerConfig": {
									"group" : "firstMenuFooter",
									"uiConfigs" : [{
										"component" : "footerBackgroundBox",
										"componentConfig" : [{
											"setter" : "Width",
											"value" : "1346"
										}]
									}, {
										"component" : "leftArrow",
										"componentConfig" : [{
											"setter" : "visible",
											"value" : "true"
										}]
									}, {
										"component" : "backLabel",
										"componentConfig" : [{
											"setter" : "text",
											"value" : "menuSettingsBack"
										}]
									}, {
										"component" : "yellowKey",
										"componentConfig" : [{
											"setter" : "X",
											"value" : "715"
										}, {
											"setter" : "visible",
											"value" : "true"
										}]
									}, {
										"component" : "selectLabel",
										"componentConfig" : [{
											"setter" : "text",
											"value" : "menuIpRenewLabel"
										}, {
											"setter" : "X",
											"value" : "757"
										}]
									}]
								},
								"uiConfigs": {
									"dataConfig": [{
										"setter": "VisibleRows",
										"value" : "10"
									}],
									"componentConfig": [{
										"setter": "ItemHeight",
										"value": "54"
									}, {
										"setter": "Y",
										"value": "70"
									}, {
										"setter": "X",
										"value": "0"
									}, {
										"setter": "backgroundConfig",
										"value": {
											"Width": "1342",
											"y": "-40"
										}
									}]
								}
							}]
						},
						{
							"title": "menuSTBinfo",
							"drawMenuCallback" : "systemViewDrawMenuCallback",
							"configs": [{
								"dataMapper": "SettingsSTBInfoViewDataMapper",
								"itemTemplate": "SettingsSystemMenuItem",
								"component": "secondMultiItemTypeSubMenuList",
								"isClearView" : "true",
								"scrollType": "page",
								"scrollComponent": "scrollIndicator",
								"isMultiplePageSupported" : "true",
								"footerConfig": {
									"group" : "firstMenuFooter",
									"uiConfigs" : [{
										"component" : "footerBackgroundBox",
										"componentConfig" : [{
											"setter" : "Width",
											"value" : "1346"
										}]
									}, {
										"component" : "leftArrow",
										"componentConfig" : [{
											"setter" : "visible",
											"value" : "true"
										}]
									}, {
										"component" : "backLabel",
										"componentConfig" : [{
											"setter" : "text",
											"value" : "menuSettingsBack"
										}]
									}]
								},
								"uiConfigs": {
									"dataConfig": [{
										"setter": "VisibleRows",
										"value" : "10"
									}],
									"componentConfig": [{
										"setter": "ItemHeight",
										"value": "54"
									}, {
										"setter": "Y",
										"value": "70"
									}, {
										"setter": "X",
										"value": "0"
									}, {
										"setter": "backgroundConfig",
										"value": {
											"Width": "1342",
											"y": "-40"
										}
									}]
								}
							}]
						},
						{
							"title": "menuDiagnostics",
							"drawMenuCallback" : "systemViewDrawMenuCallback",
							"configs": [{
								"dataMapper": "SettingsSTBInfoViewDataMapper",
								"itemTemplate": "SettingsSystemMenuItem",
								"component": "secondMultiItemTypeSubMenuList",
								"scrollType": "page",
								"isClearView" : "true",
								"scrollComponent": "scrollIndicator",
								"isMultiplePageSupported" : "true",
								"footerConfig": {
									"group" : "firstMenuFooter",
									"uiConfigs" : [{
										"component" : "footerBackgroundBox",
										"componentConfig" : [{
											"setter" : "Width",
											"value" : "1346"
										}]
									}, {
										"component" : "leftArrow",
										"componentConfig" : [{
											"setter" : "visible",
											"value" : "true"
										}]
									}, {
										"component" : "backLabel",
										"componentConfig" : [{
											"setter" : "text",
											"value" : "menuSettingsBack"
										}]
									}]
								},
								"uiConfigs": {
									"dataConfig": [{
										"setter": "VisibleRows",
										"value" : "7"
									}],
									"componentConfig": [{
										"setter": "ItemHeight",
										"value": "54"
									}, {
										"setter": "Y",
										"value": "70"
									}, {
										"setter": "X",
										"value": "0"
									}, {
										"setter": "backgroundConfig",
										"value": {
											"Width": "1342",
											"y": "-40"
										}
									}]
								}
							}]
						}
					];
				if ($N.app.FeatureManager.isWHPVREnabled()) {
					data.push({
						"title": "menuWHPVR",
						"drawMenuCallback" : "systemViewDrawMenuCallback",
						"configs": [{
							"dataMapper": "WHPvrServersData",
							"itemTemplate": "SettingsSystemMenuItem",
							"component": "secondMultiItemTypeSubMenuList",
							"isClearView" : "true",
							"scrollType": "page",
							"scrollComponent": "scrollIndicator",
							"isAvailable" : true,	/*FIXME: how to make sure whpvr is enabled?*/
							"footerConfig": {
								"group" : "firstMenuFooter",
								"uiConfigs" : [{
									"component" : "footerBackgroundBox",
									"componentConfig" : [{
										"setter" : "Width",
										"value" : "1346"
									}]
								}, {
									"component" : "leftArrow",
									"componentConfig" : [{
										"setter" : "visible",
										"value" : "true"
									}]
								}, {
									"component" : "backLabel",
									"componentConfig" : [{
										"setter" : "text",
										"value" : "menuSettingsBack"
									}]
								}]
							},
							"uiConfigs": {
								"dataConfig": [{
									"setter": "VisibleRows",
									"value" : "10"
								}],
								"componentConfig": [{
									"setter": "ItemHeight",
									"value": "54"
								}, {
									"setter": "Y",
									"value": "70"
								}, {
									"setter": "X",
									"value": "0"
								}, {
									"setter": "backgroundConfig",
									"value": {
										"Width": "1342",
										"y": "-40"
									}
								}]
							}
						}]
					});
				}
				return data;
			},

			formatSTBInfoData: function (dataArray) {
				var stbInfoFormatResult = [],
					i,
					object;
				for (i = 0; i < dataArray.length; i++) {
					object = {'title': dataArray[i].key, 'subTitle': dataArray[i].value};
					if (dataArray[i].templateConfig) {
						object.template = dataArray[i].templateConfig.template;
						object.dataMapper = dataArray[i].templateConfig.dataMapper;
						object.itemConfig = dataArray[i].templateConfig.itemConfig;
					}
					stbInfoFormatResult.push(object);
				}
				return stbInfoFormatResult;
			},

			formatPreferencesSettingsMenuData: function (data) {
				var configDetails;
				configDetails = {
					"menuLanguages": [{
						"dataMapper": "BasicSettingsSubMenuMapper",
						"changeTitle": "true",
						"itemTemplate": "MultipleTitleSubtitleItem",
						"component": "firstSubMenuList",
						"scrollComponent": "scrollIndicatorFirstMenu",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "114"
							}, {
								"setter": "y",
								"value": "95"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-65"
								}
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [ {
									"setter" : "Width",
									"value" : "661"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "rightArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter": "x",
									"value": "627"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "forwardLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsForward"
								}, {
									"setter": "x",
									"value": "508"
								}]
							}]
						}
					}],
					"menuMenuLanguage": [{
						"dataMapper": "MenuLanguageSubMenu",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"title": "menuLanguages",
						"titleId": "secondSubMenuTitle",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuAudioLanguage": [{
						"dataMapper": "AudioLanguageSubMenu",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuSubtitle": [{
						"dataMapper": "SubtitleSubMenu",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuMedia": getShortCutConfigsMenuMediaPreferences(),
					"menuPhotoDisplayDuration": [{
						"component": "settingsKeypad",
						"uiConfigs" : {
							"component" : "backgroundConfig",
							"componentConfig" : [ {
								"setter" : "X",
								"value" : "685"
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuPhotoTransition": [{
						"dataMapper": "TransitionEffectsSubMenu",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuPlayerDuration": [{
						"component": "settingsKeypad",
						"uiConfigs" : {
							"component" : "backgroundConfig",
							"componentConfig" : [ {
								"setter" : "X",
								"value" : "685"
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuMiniguide": [{
						"dataMapper": "BasicSettingsSubMenuMapper",
						"changeTitle": "true",
						"itemTemplate": "MultipleTitleSubtitleItem",
						"component": "firstSubMenuList",
						"scrollComponent": "scrollIndicatorFirstMenu",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "114"
							}, {
								"setter": "y",
								"value": "95"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-65"
								}
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [ {
									"setter" : "Width",
									"value" : "661"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "rightArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter": "x",
									"value": "627"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "forwardLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsForward"
								}, {
									"setter": "x",
									"value": "508"
								}]
							}]
						}
					}],
					"menuMiniguideDuration": [{
						"dataMapper": "MiniguideDurationSubMenu",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"dataConfig": [{
								"setter": "VisibleRows",
								"value" : "6"
							}],
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuTipsFromNet": [{
						"dataMapper": "TipsFromNetSubMenu",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "73"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuMiniguidePIP": [{
						"dataMapper": "MiniguidePipPositionSubMenu",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"dataConfig": [{
								"setter": "VisibleRows",
								"value" : "6"
							}],
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuPrefStb": [{
						"dataMapper": "Settings",
						"changeTitle": false,
						"itemTemplate": "MenuItemWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"dataConfig": [{
								"setter": "VisibleRows",
								"value" : "4"
							}],
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "95"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-65"
								}
							}]
						},
						"showSubMenuTitle": false,
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "rightArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter": "x",
									"value": "1310"
								}]
							}, {
								"component" : "forwardLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsForward"
								}, {
									"setter": "x",
									"value": "1190"
								}]
							}]
						}
					}],
					"menuTv": [{
						"dataMapper": "Settings",
						"changeTitle": false,
						"itemTemplate": "MenuItemWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"dataConfig": [{
								"setter": "VisibleRows",
								"value" : "4"
							}],
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "95"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-65"
								}
							}]
						},
						"showSubMenuTitle": false,
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "rightArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter": "x",
									"value": "1310"
								}]
							}, {
								"component" : "forwardLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsForward"
								}, {
									"setter": "x",
									"value": "1190"
								}]
							}]
						}
					}],
					"menuRecorder": getShortCutConfigsMenuRecorderPreferences(),
					"menuMoCA": [{
						"dataMapper": "BasicSettingsSubMenuMapper",
						"changeTitle": "true",
						"itemTemplate": "MultipleTitleSubtitleItem",
						"component": "bigMenuItemList",
						"scrollComponent": "scrollIndicatorFirstMenu",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "114"
							}, {
								"setter": "y",
								"value": "95"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-65"
								}
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [ {
									"setter" : "Width",
									"value" : "661"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "rightArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter": "x",
									"value": "627"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "forwardLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsForward"
								}, {
									"setter": "x",
									"value": "508"
								}]
							}]
						}
					}]
				};
				data = attachConfigs(data, configDetails);
				return data;
			},
			formatPreferencesStbMenuData: function (data) {
				var configDetails;
				configDetails = {
					"menuAutoTune": [{
						"dataMapper": "AutoTuneList",
						"itemTemplate": "GenericReminderListItem",
						"errorText" : "noReminders",
						"component" : "fullViewMenuList",
						"scrollComponent": "scrollIndicator",
						"scrollType": "item",
						"isClearView" : "true",
						"uiConfigs": {
							"dataConfig": [{
								"setter": "VisibleRows",
								"value" : "4"
							}],
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "114"
							}, {
								"setter": "Y",
								"value": "98"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-68"
								}
							}, {
								"setter": "itemConfig",
								"value": {
									"cssClassTitle": "dialogSubtitle",
									"cssClassSubtitle": "menuSubTitle"
								}
							}]
						},
						"footerConfig" : this.getAutoTuneFooterConfig(true)
					}],
					"menuAutoTuneEdit": [{
						"dataMapper": "BasicSettingsSubMenuMapper",
						"changeTitle": "true",
						"itemTemplate": "MultipleTitleSubtitleItem",
						"isClearView" : "true",
						"component": "firstSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "114"
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [ {
									"setter" : "Width",
									"value" : "661"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "rightArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter": "x",
									"value": "627"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "forwardLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsForward"
								}, {
									"setter": "x",
									"value": "508"
								}]
							}]
						}
					}],
					"menuAutoTuneChannel": [{
						"title": "autoTuneAllChannels",
						"dataMapper": "AutoTuneAllChannels",
						"itemTemplate": "ChannelListIconItem",
						"component": "secondSubMenuList",
						"scrollComponent": "scrollIndicator",
						"scrollType": "item",
						"directChannelEntryEnabled" : true,
						"uiConfigs": {
							"dataConfig": [{
								"setter": "VisibleRows",
								"value" : "6"
							}],
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuAutoTuneFrequency": [{
						"dataMapper": "AutoTuneFrequencySubMenu",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"scrollType": "item",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuAutoTuneStartDate": [{
						"component": "settingsKeypad",
						"uiConfigs" : {
							"component" : "backgroundConfig",
							"componentConfig" : [ {
								"setter" : "X",
								"value" : "685"
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuAutoTuneStartTime": [{
						"component": "settingsKeypad",
						"uiConfigs" : {
							"component" : "backgroundConfig",
							"componentConfig" : [ {
								"setter" : "X",
								"value" : "685"
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuFrontPanel": [{
						"dataMapper": "BasicSettingsSubMenuMapper",
						"changeTitle": "true",
						"itemTemplate": "MultipleTitleSubtitleItem",
						"component": "firstSubMenuList",
						"isClearView": true,
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "114"
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [ {
									"setter" : "Width",
									"value" : "661"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "rightArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter": "x",
									"value": "627"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "forwardLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsForward"
								}, {
									"setter": "x",
									"value": "508"
								}]
							}]
						}
					}],
					"menuFrontPanelDisplay": [{
						"dataMapper": "OptionWindowItems",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuFrontPanelIntensity": [{
						"dataMapper": "OptionWindowItems",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuAutoShutdown": [{
						"dataMapper": "BasicSettingsSubMenuMapper",
						"changeTitle": "true",
						"itemTemplate": "MultipleTitleSubtitleItem",
						"component": "firstSubMenuList",
						"isClearView": true,
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "114"
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [ {
									"setter" : "Width",
									"value" : "661"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "rightArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter": "x",
									"value": "627"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "forwardLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsForward"
								}, {
									"setter": "x",
									"value": "508"
								}]
							}]
						}
					}],
					"menuAutoStandbyAfter": [{
						"dataMapper": "OptionWindowItemsLookUp",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"dataConfig": [{
								"setter": "VisibleRows",
								"value" : "6"
							}],
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}]
				};
				data = attachConfigs(data, configDetails);
				return data;
			},
			formatPreferencesTvMenuData: function (data) {
				var configDetails;
				configDetails = {
					"menuSdOutput": [{
						"dataMapper": "BasicSettingsSubMenuMapper",
						"changeTitle": "true",
						"itemTemplate": "MultipleTitleSubtitleItem",
						"component": "firstSubMenuList",
						"isClearView": true,
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "114"
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [ {
									"setter" : "Width",
									"value" : "661"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "rightArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter": "x",
									"value": "627"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "forwardLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsForward"
								}, {
									"setter": "x",
									"value": "508"
								}]
							}]
						}
					}],
					"menuAspectRatio": [{
						"dataMapper": "OptionWindowItems",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuDisplayFormat": [{
						"dataMapper": "OptionWindowItems",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuVideoSystem": [{
						"dataMapper": "VideoSystemSubMenu",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuHdOutput": [{
						"dataMapper": "BasicSettingsSubMenuMapper",
						"changeTitle": "true",
						"itemTemplate": "MultipleTitleSubtitleItem",
						"component": "firstSubMenuList",
						"isClearView": true,
						"uiConfigs": {
							"dataConfig": [{
								"setter": "VisibleRows",
								"value" : "4"
							}],
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "114"
							}]
						},
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [ {
									"setter" : "Width",
									"value" : "661"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "rightArrow",
								"componentConfig" : [ {
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter": "x",
									"value": "627"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "forwardLabel",
								"componentConfig" : [ {
									"setter" : "text",
									"value" : "menuSettingsForward"
								}, {
									"setter": "x",
									"value": "508"
								}]
							}]
						}
					}],
					"menuHdDisplayFormat": [{
						"dataMapper": "OptionWindowItems",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuHdmiAudioOutput": [{
						"dataMapper": "OptionWindowItems",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuResolution": [{
						"dataMapper": "OptionWindowItems",
						"itemTemplate": "MenuItemIconWithHighlight",
						"component": "secondSubMenuList",
						"uiConfigs": {
							"dataConfig": [{
								"setter": "VisibleRows",
								"value" : "5"
							}],
							"componentConfig": [{
								"setter": "itemHeight",
								"value": "70"
							}, {
								"setter": "y",
								"value": "150"
							}, {
								"setter": "backgroundConfig",
								"value": {
									"y": "-120"
								}
							}]
						},
						"showSubMenuTitle": "true",
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}],
					"menuLipSync": [{
						"component": "settingsKeypad",
						"uiConfigs" : {
							"component" : "backgroundConfig",
							"componentConfig" : [ {
								"setter" : "X",
								"value" : "685"
							}]
						},
						"showSubMenuTitle": false,
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [{
									"setter" : "Width",
									"value" : "1346"
								}]
							}, {
								"component" : "leftArrow",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}]
							}, {
								"component" : "backLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuSettingsBack"
								}]
							}, {
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : "menuokSelectLabel"
								}, {
									"setter" : "X",
									"value" : "755"
								}]
							}, {
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : "710"
								}]
							}]
						}
					}]
				};
				data = attachConfigs(data, configDetails);
				return data;
			},

			formatRecordingsFolderListData: function (data) {
				var dataObjectArray = [{
						"title": $N.app.FormatUtils.getString('pvrSettingsRecordingHighlights'),
						"value": $N.app.constants.ROOT_PVR_FOLDER_VALUE
					}],
					dataLength = data.length,
					i;
				for (i = 0; i < dataLength; i++) {
					if (!$N.app.FolderUtil.isFolderRootFolder(data[i])) {
						dataObjectArray.push({
							"title": $N.app.StringUtil.removeLeadingForwardSlash(data[i]),
							"value": data[i]
						});
					}
				}
				return dataObjectArray;
			},

			formatBlockedData: function (dataArray) {
				var allChannels = [],
					serviceId = null,
					object = null;
				for (serviceId in dataArray) {
					if (dataArray.hasOwnProperty(serviceId) && serviceId) {
						object = {"title": dataArray[serviceId].serviceName, "channelNumber": formatChannelNumber(dataArray[serviceId].logicalChannelNum), "channelInfo": dataArray[serviceId], "serviceId": dataArray[serviceId].serviceId};
						allChannels.push(object);
					}
				}
				return allChannels;
			},

			formatFavouriteBlockChannelsData: function (dataArray) {
				var allChannels = [],
					i,
					object;
				for (i = 0; i < dataArray.length; i++) {
					object = {"title": dataArray[i].serviceName, "channelNumber": formatChannelNumber(dataArray[i].logicalChannelNum), "channelInfo": dataArray[i], "serviceId": dataArray[i].serviceId};
					allChannels.push(object);
				}
				return allChannels;
			},

			getAutoTuneEditConfig: function () {
				return [{
					"dataMapper": "BasicSettingsSubMenuMapper",
					"changeTitle": "true",
					"itemTemplate": "MultipleTitleSubtitleItem",
					"isClearView" : "true",
					"component": "firstSubMenuList",
					"uiConfigs": {
						"componentConfig": [{
							"setter": "itemHeight",
							"value": "114"
						}]
					},
					"footerConfig": {
						"group" : "firstMenuFooter",
						"uiConfigs" : [{
							"component" : "footerBackgroundBox",
							"componentConfig" : [ {
								"setter" : "Width",
								"value" : "661"
							}]
						}, {
							"component" : "leftArrow",
							"componentConfig" : [ {
								"setter" : "visible",
								"value" : "true"
							}]
						}, {
							"component" : "rightArrow",
							"componentConfig" : [ {
								"setter" : "visible",
								"value" : "true"
							}, {
								"setter": "x",
								"value": "627"
							}]
						}, {
							"component" : "greenKey",
							"componentConfig" : [{
								"setter" : "x",
								"value" : "250"
							}, {
								"setter" : "visible",
								"value" : true
							}]
						}, {
							"component" : "greenSelectLabel",
							"componentConfig" : [{
								"setter" : "text",
								"value" : "manualRecordingSave"
							}, {
								"setter" : "x",
								"value" : "295"
							}, {
								"setter" : "visible",
								"value" : true
							}]
						}, {
							"component" : "backLabel",
							"componentConfig" : [ {
								"setter" : "text",
								"value" : "menuSettingsBack"
							}]
						}, {
							"component" : "forwardLabel",
							"componentConfig" : [ {
								"setter" : "text",
								"value" : "menuSettingsForward"
							}, {
								"setter": "x",
								"value": "508"
							}]
						}]
					}
				}];
			},
			getFavoriteFooterConfig: function (type, name) {
				var okIconX,
					okLabelX,
					changeText;
				if (name !== "allChannelsList") {
					okIconX = (type === "allChannels") ? "40" : "710";
					okLabelX = (type === "favorites") ? "755" : "90";
					changeText = (type === "allChannels") ? "addToFavorites" : "deleteFromListOfFavorites";
				} else {
					okIconX = 40;
					okLabelX = 90;
					changeText = (type === "allChannels") ? "addToFavorites" : "deleteFromFavorites";
				}
				return {
					"footerConfig": {
						"group" : "firstMenuFooter",
						"uiConfigs" : [{
							"component" : "footerBackgroundBox",
							"componentConfig" : [ {
								"setter" : "Width",
								"value" : "1350"
							}]
						},
							{
								"component" : "selectLabel",
								"componentConfig" : [{
									"setter" : "text",
									"value" : changeText
								}, {
									"setter" : "X",
									"value" : okLabelX
								}]
							},
							{
								"component" : "okIcon",
								"componentConfig" : [{
									"setter" : "visible",
									"value" : "true"
								}, {
									"setter" : "X",
									"value" : okIconX
								}]
							}]
					}
				};
			},
			getBlockFooterConfig: function (type, name, isForwardNeeded) {
				var okIconX,
					okLabelX,
					changeText,
					configObject = null;
				if (name !== "allChannelsList") {
					changeText = (type === "allChannels") ? "block" : "unBlock";
				} else {
					changeText = (type === "allChannels") ? "block" : "unBlock";
				}
				configObject = {
					"allChannels": {
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [ {
									"setter" : "Width",
									"value" : "1350"
								}]
							},
								{
									"component" : "leftArrow",
									"componentConfig" : [ {
										"setter" : "visible",
										"value" : "true"
									}]
								},
								{
									"component" : "backLabel",
									"componentConfig" : [ {
										"setter" : "text",
										"value" : "menuSettingsBack"
									}]
								},
								{
									"component" : "greenKey",
									"componentConfig" : [{
										"setter" : "X",
										"value" : "390"
									}, {
										"setter" : "visible",
										"value" : "true"
									}]
								},
								{
									"component" : "greenSelectLabel",
									"componentConfig" : [{
										"setter" : "X",
										"value" : "440"
									}, {
										"setter" : "text",
										"value" : "filterChannels"
									}]
								}]
						}
					},
					"blocked": {
						"footerConfig": {
							"group" : "firstMenuFooter",
							"uiConfigs" : [{
								"component" : "footerBackgroundBox",
								"componentConfig" : [ {
									"setter" : "Width",
									"value" : "1350"
								}]
							},
								{
									"component" : "leftArrow",
									"componentConfig" : [ {
										"setter" : "visible",
										"value" : "true"
									}]
								},
								{
									"component" : "backLabel",
									"componentConfig" : [ {
										"setter" : "text",
										"value" : "menuSettingsBack"
									}]
								},
								{
									"component" : "okIcon",
									"componentConfig" : [{
										"setter" : "visible",
										"value" : "true"
									}, {
										"setter" : "X",
										"value" : "710"
									}]
								},
								{
									"component" : "selectLabel",
									"componentConfig" : [{
										"setter" : "text",
										"value" : changeText
									}, {
										"setter" : "X",
										"value" : "755"
									}]
								}]
						}
					}
				};
				if (type !== "empty") {
					configObject.allChannels.footerConfig.uiConfigs.push({
						"component" : "okIcon",
						"componentConfig" : [{
							"setter" : "visible",
							"value" : "true"
						}, {
							"setter" : "X",
							"value" : "710"
						}]
					});
					configObject.allChannels.footerConfig.uiConfigs.push({
						"component" : "selectLabel",
						"componentConfig" : [{
							"setter" : "text",
							"value" : changeText
						}, {
							"setter" : "X",
							"value" : "755"
						}]
					});
				}
				if (isForwardNeeded === true) {
					configObject.allChannels.footerConfig.uiConfigs.push({
						"component" : "rightArrow",
						"componentConfig" : [ {
							"setter" : "visible",
							"value" : "true"
						}, {
							"setter": "x",
							"value": "1310"
						}]
					});
					configObject.allChannels.footerConfig.uiConfigs.push({
						"component" : "forwardLabel",
						"componentConfig" : [ {
							"setter" : "text",
							"value" : "menuSettingsForward"
						}, {
							"setter": "x",
							"value": "1190"
						}]
					});
				}
				if (name !== "allChannelsList") {
					return configObject.blocked;
				} else {
					return configObject.allChannels;
				}
			},
			getAutoTuneFooterConfig: function (isDataAvailable) {
				return {
					"group" : "firstMenuFooter",
					"uiConfigs" : [{
						"component" : "footerBackgroundBox",
						"componentConfig" : [ {
							"setter" : "Width",
							"value" : "1346"
						}]
					}, {
						"component" : "leftArrow",
						"componentConfig" : [ {
							"setter" : "visible",
							"value" : "true"
						}]
					}, {
						"component" : "backLabel",
						"componentConfig" : [ {
							"setter" : "text",
							"value" : "menuSettingsBack"
						}]
					}, {
						"component" : "rightArrow",
						"componentConfig" : [ {
							"setter" : "visible",
							"value" : "true"
						}, {
							"setter": "x",
							"value": "1310"
						}]
					}, {
						"component" : "forwardLabel",
						"componentConfig" : [ {
							"setter" : "text",
							"value" : "menuSettingsForward"
						}, {
							"setter": "x",
							"value": "1190"
						}]
					}, {
						"component" : "selectLabel",
						"componentConfig" : [{
							"setter" : "text",
							"value" : "editString"
						}, {
							"setter" : "X",
							"value" : "957"
						}, {
							"setter" : "visible",
							"value" : isDataAvailable
						}]
					}, {
						"component" : "okIcon",
						"componentConfig" : [{
							"setter" : "Visible",
							"value" : false
						}, {
							"setter" : "X",
							"value" : "915"
						}, {
							"setter" : "visible",
							"value" : isDataAvailable
						}]
					}, {
						"component" : "greenKey",
						"componentConfig" : [{
							"setter" : "visible",
							"value" : "true"
						}, {
							"setter" : "X",
							"value" : "265"
						}]
					}, {
						"component" : "greenSelectLabel",
						"componentConfig" : [{
							"setter" : "text",
							"value" : "addMenuText"
						}, {
							"setter" : "X",
							"value" : "307"
						}]
					}, {
						"component" : "yellowKey",
						"componentConfig" : [{
							"setter" : "X",
							"value" : "575"
						}, {
							"setter" : "visible",
							"value" : isDataAvailable
						}]
					}, {
						"component" : "yellowSelectLabel",
						"componentConfig" : [{
							"setter" : "text",
							"value" : "deleteString"
						}, {
							"setter" : "X",
							"value" : "617"
						}, {
							"setter" : "visible",
							"value" : isDataAvailable
						}]
					}]
				};
			},
			formatChannelNumber: formatChannelNumber,
			getSocialAccountOptionsConfig: getSocialAccountOptionsConfig,
			getSocialAccountPinSettingOptionsConfig: getSocialAccountPinSettingOptionsConfig,
			getSocialAccountInformationConfig: getSocialAccountInformationConfig,
			getMediaMenuStatus: getMediaMenuStatus,
			formatRecordLocationData: function (dataArray) {
				var dataObjectArray = [],
					i,
					object;
				for (i = 0; i < dataArray.length; i++) {
					object = {'title': dataArray[i].key, 'value': dataArray[i].value};
					dataObjectArray.push(object);
				}
				return dataObjectArray;
			},
			getPurchasesConfig: function () {
				return [{
					"dataMapper": "PurchaseItemData",
					"itemTemplate": "PurchaseListItem",
					"component" : "fullViewMenuList",
					"scrollComponent": "scrollIndicator",
					"errorText" : "noPurchases",
					"scrollType": "item",
					"isClearView" : true,
					"uiConfigs": {
						"dataConfig": [{
							"setter": "VisibleRows",
							"value" : "4"
						}],
						"componentConfig": [{
							"setter": "itemHeight",
							"value": "110"
						}, {
							"setter": "Y",
							"value": "68"
						}, {
							"setter": "backgroundConfig",
							"value": {
								"y": "-38"
							}
						}, {
							"setter": "itemConfig",
							"value": {}
						}]
					},
					"footerConfig": this.getPurchasesFooterConfig()
				}];
			},
			getPurchasesFooterConfig : function () {
				return {
					"group" : "firstMenuFooter",
					"uiConfigs" : [{
						"component" : "footerBackgroundBox",
						"componentConfig" : [{
							"setter" : "Width",
							"value" : "1346"
						}]
					}, {
						"component" : "leftArrow",
						"componentConfig" : [{
							"setter" : "visible",
							"value" : "true"
						}]
					}, {
						"component" : "backLabel",
						"componentConfig" : [{
							"setter" : "text",
							"value" : "menuSettingsBack"
						}]
					}]
				};
			},
			getShortCutConfigsMenuRecorderPreferences: getShortCutConfigsMenuRecorderPreferences,
			getShortCutConfigsMenuMediaPreferences: getShortCutConfigsMenuMediaPreferences
		};
	}());

}($N || {}));
