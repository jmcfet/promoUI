/**
 * @class $N.app.MessageUtil
 * @static
 * @requires $N.apps.core.Log
 */
(function ($N) {
	"use strict";
	$N.app = $N.app || {};
	$N.app.MessageUtil = (function () {
		var log = new $N.apps.core.Log("Message", "MessageUtil"),
			newMail = null,
			newMailTimer = null,
			newPopup = null,
			isNewPopupDisplaying = false,
			globalKeyProcess,
			bMailIconKeyProcess = false,//If let MessageUtil to capture BLUE key to process
			currentChannelId = 0,
			isIndicatorActive = false,
			globalKeyInterceptor = null,
			hasUnreadMail = false,
			getMessageMails = null,
			newPopupMails = [],
			MESSAGES_PATH = "/users/messages",
			MESSAGES_MAILBOX_PATH = (MESSAGES_PATH + "/mailbox"),
			MESSAGES_NEW_INDICATOR = (MESSAGES_PATH + "/newmessage"),
			MESSAGES_NOTIFY = 1,
			MESSAGES_CA = 2,
			MESSAGES_TYPE_MAIL = 1,
			MESSAGES_TYPE_POPUP = 2,
			NET_MSG_HANDLER_NAME = "msg_send",
			NET_MSG_ACTION_DES = "tst1:256/1:E0",
			MESSAGES_DEFAULT_EXPIRATION = 604800000,/*expired after 7 days*/
			CAPopupInfo = null,
			CAPopupPersistence = {
				NORMAL: 0,
				TIMEOUT: 1,
				USERACK: 2
			},
			isAllKeysBlocked = false,
			testMsgId = 0;

		/**
		 * @method cookMsgPath
		 * get message storage path.
		 * @param {cookedID} message ID.
		 */
		function cookMsgPath(cookedID) {
			return MESSAGES_MAILBOX_PATH + "/" + cookedID;
		}

		/**
		 * @method messageMailSave
		 * save message to configman.
		 * @param {parsedMsg} message entity.
		 */
		function messageMailSave(parsedMsg) {
			var jsonstr,
				res;
			if (parsedMsg.subType === MESSAGES_TYPE_MAIL) {
				jsonstr = JSON.stringify(parsedMsg);
				res = CCOM.ConfigManager.setValue(cookMsgPath(parsedMsg.cookedID), jsonstr);
				if (res.error) {
					log("messageMailSave", "set failed" + res.error.name + " " + res.error.message);
				}
			} else if (parsedMsg.subType === MESSAGES_TYPE_POPUP) {
				newPopupMails.unshift(parsedMsg);
			}
		}

		/**
		 * @method getUnreadMailsCount
		 * get unread mails count.
		 */
		function getUnreadMailsCount() {
			var i,
				msgs = null,
				count = 0;
			msgs = getMessageMails();
			if (msgs && msgs.length) {
				for (i = 0; i < msgs.length; i++) {
					if (msgs[i].read === false) {
						count++;
					}
				}
			}
			return count;
		}

		/**
		 * @method messageMailboxClear
		 * remove all message records from configman.
		 */
		function messageMailboxClear() {
			var res = CCOM.ConfigManager.getEntries(MESSAGES_MAILBOX_PATH),
				j,
				msg;
			if (res.error) {
				log("messageMailboxClear", "Failed " + res.error.name + " " + res.error.message);
				return null;
			}
			for (j in res.keyValuePairs) {
				if (res.keyValuePairs.hasOwnProperty(j)) {
					log("messageMailboxClear", "Try to delete " + j);
					CCOM.ConfigManager.unsetValue(j);
					msg = JSON.parse(res.keyValuePairs[j]);
					if (msg.type === MESSAGES_CA) {
						CCOM.ConditionalAccess.removeIrdMail(msg.messageID);
					}
				}
			}
		}

		/**
		 * @method messagePayloadParse
		 * parse the message body.
		 * @param {payload} payload from CCOM layer.
		 * @param {msg} Util entity.
		 */
		function messagePayloadParse(payload, msg) {
			var fields = payload.split("#"),
				invalid = false;
			if (fields.length < 3) {
				invalid = true;
			} else {
				if (fields[0] && fields[0] === "MAIL") {
					msg.subType = MESSAGES_TYPE_MAIL;
				} else if (fields[0] && fields[0].charAt(0) === 'F') {
					msg.subType = MESSAGES_TYPE_POPUP;
					msg.channel = parseInt(fields[0].substr(1, 3), 10);
				} else {
					invalid = true;
				}
			}
			if (invalid) {
				msg.subType = MESSAGES_TYPE_MAIL;
				msg.title = "";
				msg.content = "".concat(payload);
				return true;
			}
			msg.title = fields[1];
			msg.content = fields[2];
			if (fields[3]) {
				msg.expireDate = parseInt(fields[3], 10) * 1000;
			}
			return true;
		}

		/**
		 * @method setMessagePopupMailRead
		 * set one popup message state as read and remove it from the popup mail list.
		 * @param {msg} Util entity.
		 */
		function setMessagePopupMailRead(msg) {
			var i;
			for (i = 0; i < newPopupMails.length; i++) {
				if (newPopupMails[i].cookedID === msg.cookedID) {
					newPopupMails.splice(i, 1);
					return;
				}
			}
		}

		/**
		 * @method getMessagePopupMail
		 * get the lastest popup message for one channel or all channels.
		 */
		function getMessagePopupMail() {
			var i;
			for (i = 0; i < newPopupMails.length; i++) {
				if (newPopupMails[i].channel === currentChannelId || newPopupMails[i].channel === 0) {
					return newPopupMails[i];
				}
			}
			return null;
		}

		/**
		 * @method enableGlobalKeyInterceptor
		 * Add one key interceptor for message utility.
		 */
		function enableGlobalKeyInterceptor() {
			if (!globalKeyInterceptor && isIndicatorActive) {
				globalKeyInterceptor = globalKeyProcess;
				$N.apps.core.KeyInterceptor.registerInterceptor(globalKeyProcess, $N.app.MessageUtil);
			}
		}

		/**
		 * @method disableGlobalKeyInterceptor
		 * remove the key interceptor for message utility.
		 */
		function disableGlobalKeyInterceptor() {
			if (globalKeyInterceptor && !newPopup.isVisible() && !newMail.isVisible()) {
				$N.apps.core.KeyInterceptor.unregisterInterceptor(globalKeyProcess);
				globalKeyInterceptor = null;
			}
		}

		/**
		 * @method hideNewMailIndicator
		 * hide the mail envelope indicator.
		 */
		function hideNewMailIndicator() {
			if (newMail.isVisible()) {
				newMail.hide();
				newMail.setOpacity(0);
				disableGlobalKeyInterceptor();
				if (newMailTimer) {
					clearTimeout(newMailTimer);
					newMailTimer = null;
				}
			}
		}

		/**
		 * @method showNewMailIndicator
		 * show the mail envelope indicator. and enable the key interceptor
		 */
		function showNewMailIndicator() {
			if (!newMail.isVisible()) {
				newMail.show();
				newMail.doFade(1);
				if (bMailIconKeyProcess) {
					enableGlobalKeyInterceptor();
				}
				if (newMailTimer) {
					clearTimeout(newMailTimer);
					newMailTimer = null;
				}
				newMailTimer =  setTimeout(function newMailIndicatorTimeout() {
					newMailTimer = null;
					hideNewMailIndicator();
				}, $N.app.constants.MAIL_INDICATOR_DURATIONS);
			}
		}

		/**
		 * @method showNewPopupIndicator
		 * show the popup message indicator. and enable the key interceptor
		 */
		function showNewPopupIndicator() {
			if (!newPopup.isVisible()) {
				newPopup.newPopupTitle.setText($N.app.MessageUtil.getString("messagePopupTitle"));
				newPopup.newPopupTip.setText($N.app.MessageUtil.getString("messagePopupTip"));
				newPopup.show();
				newPopup.doFade(1);
				newPopup.doMove(1275, newPopup.getTrueY());
				enableGlobalKeyInterceptor();
			}
		}

		/**
		 * @method hideNewPopupIndicator
		 * hide the popup message indicator. and remove the key interceptor
		 */
		function hideNewPopupIndicator() {
			if (newPopup.isVisible()) {
				newPopup.hide();
				newPopup.setOpacity(0);
				newPopup.setX(1920);
				disableGlobalKeyInterceptor();
			}
		}

		/**
		 * @method showPopupMsgDialog
		 * show the message body by one dialogue
		 */
		function showPopupMsgDialog() {
			var dialogButtons = [{name: $N.app.MessageUtil.getString("popupExit"), action: 1}],
				newPopupMsg = getMessagePopupMail();
			$N.app.DialogueHelper.createAndShowDialogue($N.app.constants.DLG_NEW_POPUP_MAIL,
					newPopupMsg.title,
					newPopupMsg.content,
					dialogButtons,
					function () {
					setMessagePopupMailRead(newPopupMsg);
					if (!getMessagePopupMail()) {
						hideNewPopupIndicator();
					}
					isNewPopupDisplaying = false;
				});
			$N.app.DialogueHelper.updateDialogueTitleAndMessage($N.app.constants.DLG_NEW_POPUP_MAIL,
					newPopupMsg.title,
					newPopupMsg.content);
		}

		function mailIconKeyProcess() {
			$N.app.ContextHelper.openContext("PORTAL", {activationContext: {context: "MESSAGES"}});
		}

		/**
		 * @method globalKeyProcess
		 * After the indicator displayed, the keys received needs to be processed.
		 * Any key to display the dialogue.
		 * Blue key to navigate to message list.
		 */
		globalKeyProcess = function globalKeyProcess(key) {
			var keys;
			if ($N.app.GeneralUtil.isKeyReleaseEvent(key)) {
				return true;
			}
			if (!isNewPopupDisplaying && newPopup.isVisible()) {
				isNewPopupDisplaying = true;
				showPopupMsgDialog();
				return true;
			} else if (isNewPopupDisplaying) {
				return false;
			}
			if (bMailIconKeyProcess) {
				keys = $N.apps.core.KeyInterceptor.getKeyMap();
				if (key === keys.KEY_BLUE) {
					hideNewMailIndicator();
					mailIconKeyProcess();
					return true;
				}
			}
		};

		/**
		 * @method messageNewNotify
		 * Show the indicator according to message type: mail or popup message
		 * @param {msg} Util message entity
		 */
		function messageNewNotify(msg) {
			if (msg.subType === MESSAGES_TYPE_MAIL) {
				hasUnreadMail = true;
				CCOM.System.setLedState("message", 1);
				if (!isIndicatorActive) {
					return;
				}
				showNewMailIndicator();
			} else if (msg.subType === MESSAGES_TYPE_POPUP && isIndicatorActive) {
				if (getMessagePopupMail()) {
					showNewPopupIndicator();
				}
			}
		}

		/**
		 * @method on_ird_message
		 * IRD message handler
		 * @param {e} event
		 */
		function on_ird_message(e) {
			var parsedMsg = {},
				res;
			log("on_ird_message", "IRD message is received");
			parsedMsg.messageID = e.mailId;
			parsedMsg.type = MESSAGES_CA;
			parsedMsg.cookedID = e.mailId + "_" + MESSAGES_CA;
			parsedMsg.read = false;
			res = CCOM.ConditionalAccess.getIrdMail(e.mailId);
			if (res.error) {
				log("on_ird_message", "IRD message error " + res.error.name + " " + res.error.message);
				return;
			}
			if (!messagePayloadParse(res.message, parsedMsg)) {
				log("on_ird_message", "Unrecognized message for NET !!!");
				return;
			}
			parsedMsg.date = new Date().getTime();
			messageMailSave(parsedMsg);
			messageNewNotify(parsedMsg);
		}

		function blockAllKeys() {
			log("blockAllKeys", "All Keys are blocked by CA Popup!!!!");
			return true;
		}

		function enableBlockAllKeys() {
			if (!isAllKeysBlocked) {
				$N.apps.core.KeyInterceptor.registerInterceptor(blockAllKeys, $N.app.MessageUtil);
				isAllKeysBlocked = true;
			}
		}

		function disableBlockAllKeys() {
			if (isAllKeysBlocked) {
				$N.apps.core.KeyInterceptor.unregisterInterceptor(blockAllKeys);
				isAllKeysBlocked = false;
			}
		}

		/**
		 * @method on_ird_popup_message
		 * IRD popup message handler
		 * @param {e} event
		 */
		function on_ird_popup_message(e, testMsg) {
			var dialogUsrButtons = [],
				dialogUsrCallback = null,
				dialogTimeout = null,
				dialogTimeoutCallback = null,
				res,
				dialogId = $N.app.constants.DLG_NEW_POPUP_CA;
			log("on_ird_popup_message", "IRD popup message is received");
			res = CCOM.ConditionalAccess.getIrdPopupMessage();
			/*Test Data*/
			if (testMsg) {
				CAPopupInfo = testMsg;
			} else if (res.error) {
				log("on_ird_popup_message", "getIrdPopupMessage Error " + res.error.name + " message: " + res.error.message);
				return;
			} else {
				CAPopupInfo = res.popupInfo;
			}

			switch (CAPopupInfo.persistence) {
			case CAPopupPersistence.TIMEOUT:
				dialogTimeout = 10000;
				dialogId = $N.app.constants.DLG_NEW_POPUP_CA_AUTOTIMEOUT;
				dialogTimeoutCallback = function () {
					disableBlockAllKeys();
				};
				break;
			case CAPopupPersistence.USERACK:
				dialogUsrButtons = [{name: $N.app.MessageUtil.getString("ok"), action: 1}];
				dialogUsrCallback = function () {
				};
				break;
			case CAPopupPersistence.NORMAL:
				break;
			default:
				return;
			}
			$N.app.DialogueHelper.createAndShowDialogue(dialogId,
					"",
					CAPopupInfo.message,
					dialogUsrButtons,
					dialogUsrCallback,
					null,
					null,
					null,
					null,
					null,
					null,
					null,
					dialogTimeoutCallback);
			if (CAPopupInfo.persistence === CAPopupPersistence.TIMEOUT || CAPopupInfo.persistence === CAPopupPersistence.NORMAL) {
				enableBlockAllKeys();
			}
		}

		/**
		 * @method on_ird_popup_message_remove
		 * IRD popup message removing handler
		 * @param {e} event
		 */
		function on_ird_popup_message_remove(e) {
			log("on_ird_popup_message_remove", "IRD popup message remove is received");
			$N.app.DialogueHelper.hideDialogueWithId($N.app.constants.DLG_NEW_POPUP_CA);
			$N.app.DialogueHelper.hideDialogueWithId($N.app.constants.DLG_NEW_POPUP_CA_AUTOTIMEOUT);
			disableBlockAllKeys();
		}

		function convertByteArraytoString(byteArray) {
			var result = "",
				n,
				start = 0;
			if (byteArray[0] === 0xff) {
				start = 5;
			}
			for (n = start; n < byteArray.length; n++) {
				result += String.fromCharCode(byteArray[n]);
			}
			return result;
		}

		/**
		 * @method on_notify_message
		 * Notify message handler
		 * @param {e} event
		 */
		function on_notify_message(e) {
			var notifyMsg = e.notifyMsg,
				keyPayload = "message_payload",
				parsedMsg = {},
				payloadString = "";
			log("on_notify_message", "NOTIFY message is received. action_handler and action_description is :" + notifyMsg.action_handler + "  " + notifyMsg.action_description);
			if (notifyMsg.action_handler && notifyMsg.action_description) {
				if (notifyMsg.action_handler !== NET_MSG_HANDLER_NAME || notifyMsg.action_description !== NET_MSG_ACTION_DES) {
					return;
				}
			} else {
				return;
			}
			log("on_notify_message", "message for NET !!! " + typeof (notifyMsg[keyPayload]));
			parsedMsg.messageID = notifyMsg.message_id;
			parsedMsg.type = MESSAGES_NOTIFY;
			parsedMsg.cookedID = notifyMsg.message_id + "_" + MESSAGES_NOTIFY;
			parsedMsg.read = false;
			if (notifyMsg.hasOwnProperty(keyPayload) && notifyMsg[keyPayload]) {
				payloadString = convertByteArraytoString(notifyMsg[keyPayload]);
				if (!messagePayloadParse(payloadString, parsedMsg)) {
					log("on_notify_message", "Unrecognized message for NET !!!");
					return;
				}
			} else {
				log("on_notify_message", "Message " + parsedMsg.messageID + " has no payload");
				return;
			}
			parsedMsg.date = new Date().getTime();
			messageMailSave(parsedMsg);
			messageNewNotify(parsedMsg);
		}

		/**
		 * @method messageViewInitialise
		 * Initialise the mail and popup message indicator
		 * @param {view} view of the indicator group
		 */
		function messageViewInitialise(view) {
			newMail = view.newMail;
			newPopup = view.newPopup;
			newMail.setAnimationDuration("250ms");
			newMail.addFadeAnimation();
			newPopup.setAnimationDuration("250ms");
			newPopup.addFadeAnimation();
			newPopup.addMoveAnimation();
		}

		/**
		 * @method channelChangedCallback
		 * once channel is switched, need to check the if there is popup message for the channel.
		 */
		function channelChangedCallback() {
			var channelFromPref = $N.app.epgUtil.getChannelFromPrefs(),
				service,
				serviceNumber;
			if (channelFromPref) {
				service = $N.platform.btv.EPG.getChannelByServiceId(channelFromPref);
				if (service) {
					serviceNumber = service.logicalChannelNum || service.number || service.channelKey || '';
					if (serviceNumber) {
						currentChannelId = serviceNumber;
					}
				}
			}
			if (!isIndicatorActive) {
				return;
			}
			if (hasUnreadMail) {
				showNewMailIndicator();
			}
			if (getMessagePopupMail()) {
				showNewPopupIndicator();
			} else {
				hideNewPopupIndicator();
			}
		}

		/**
		 * @method messageEventInitialise
		 * Register Notify and IRD events handerl.
		 */
		function messageEventInitialise() {
			var status;
			if (CCOM.NotifyService) {
				status = CCOM.NotifyService.addEventListener("onNotifyMessage", on_notify_message);
				if (status) {
					log("initialise", "Notify addEventListener failed " + status);
				}
			}
			status = CCOM.ConditionalAccess.addEventListener("onIrdMailNew", on_ird_message);
			if (status) {
				log("initialise", "IRD addEventListener failed " + status);
			}
			status = CCOM.ConditionalAccess.addEventListener("onIrdPopupNew", on_ird_popup_message);
			if (status) {
				log("initialise", "IRD onIrdPopupNew addEventListener failed " + status);
			}
			status = CCOM.ConditionalAccess.addEventListener("onIrdPopupRemove", on_ird_popup_message_remove);
			if (status) {
				log("initialise", "IRD onIrdPopupRemove addEventListener failed " + status);
			}
			$N.apps.util.EventManager.subscribe("channelChanged", channelChangedCallback, $N.app.MessageUtil);
		}

		/**
		 * @method initialise
		 */
		function initialise(view) {
			var status;
			log("initialise", "Enter");
			$N.apps.core.Language.adornWithGetString($N.app.MessageUtil);
			messageViewInitialise(view);
			messageEventInitialise();
			if (getUnreadMailsCount()) {
				hasUnreadMail = true;
				CCOM.System.setLedState("message", 1);
			}
			log("initialise", "Exit");
		}

		/**
		 * @method setMessageMailRead
		 * set the mail read status
		 * @param {cookedID} message ID
		 */
		function setMessageMailRead(cookedID) {
			var json = CCOM.ConfigManager.getValue(cookMsgPath(cookedID)),
				msg;
			if (json.error) {
				log("setMessageMailRead", cookedID + "Failed " + json.error.name + " " + json.error.message);
				return;
			}
			msg = JSON.parse(json.keyValue);
			msg.read = true;
			json = JSON.stringify(msg);
			CCOM.ConfigManager.setValue(cookMsgPath(cookedID), json);
			$N.apps.util.EventManager.fire("oneMailRead", cookedID);
			if (hasUnreadMail && !getUnreadMailsCount()) {
				hasUnreadMail = false;
				CCOM.System.setLedState("message", 0);
				$N.apps.util.EventManager.fire("allMailsRead");
			}
		}

		/**
		 * @method dateSort
		 * message sort by date
		 * @param {array}
		 */
		function dateSort(array) {
			var compareFunction = function (a, b) {
					if (a.date < b.date) {
						return 1;
					}
					if (a.date > b.date) {
						return -1;
					}
					return 0;
				};
			array.sort(compareFunction);
			return array;
		}

		/**
		 * @method messageExpirationCheck
		 * check if the message is expired. if yes, remove the record from the configman
		 * @param {msg}
		 */
		function messageExpirationCheck(msg) {
			var res,
				time = new Date().getTime(),
				expired = false;
			if (msg.expireDate) {
				if (time >= msg.expireDate) {
					expired = true;
				}
			} else {
				if (time >= (msg.date + MESSAGES_DEFAULT_EXPIRATION)) {
					expired = true;
				}
			}
			if (expired) {
				log("messageExpirationCheck", "Msg type " + msg.type + " ID " + msg.messageID + " need to delete.");
				CCOM.ConfigManager.unsetValue(cookMsgPath(msg.cookedID));
				if (msg.type === MESSAGES_CA) {
					CCOM.ConditionalAccess.removeIrdMail(msg.messageID);
				}
			}
			return !expired;
		}

		/**
		 * @method getMessageMails
		 * And every time get messages, the expiration will be checked.
		 * @param {count} how many top ones sort by time, if it is not set, get all message.
		 */
		getMessageMails = function (count) {
			var res = CCOM.ConfigManager.getEntries(MESSAGES_MAILBOX_PATH),
				msg,
				j,
				allmsgs = [],
				expiredmsgs = [];
			if (res.error) {
				log("getMessageMails", "Failed " + res.error.name + " " + res.error.message);
				return null;
			}
			for (j in res.keyValuePairs) {
				if (res.keyValuePairs.hasOwnProperty(j)) {
					msg = JSON.parse(res.keyValuePairs[j]);
					if (messageExpirationCheck(msg)) {
						allmsgs.push(msg);
					}
				}
			}
			dateSort(allmsgs);
			if (allmsgs.length) {
				if (allmsgs.length > 40) {
					expiredmsgs = allmsgs.splice(40);
					for (j = 0; j < expiredmsgs.length; j++) {
						CCOM.ConfigManager.unsetValue(cookMsgPath(expiredmsgs[j].cookedID));
						if (expiredmsgs[j].type === MESSAGES_CA) {
							CCOM.ConditionalAccess.removeIrdMail(expiredmsgs[j].messageID);
						}
					}
				}
				if (count) {
					return allmsgs.slice(0, count);
				} else {
					return allmsgs;
				}
			}
			return null;
		};

		/**
		 * @method activateMessageIndicator
		 * API called from outside. after this the message will be notified.
		 * If Let MessageUtil to capture the BLUE key and process, set bMailKeyProcess as true
		 * If app wants to capture the BLUE key (as Mini guide), set it as false
		 */
		function activateMessageIndicator(bMailKeyProcess) {
			if (isIndicatorActive) {
				return;
			}
			isIndicatorActive = true;
			bMailIconKeyProcess = bMailKeyProcess;
			if (hasUnreadMail) {
				showNewMailIndicator();
			}
			if (getMessagePopupMail()) {
				showNewPopupIndicator();
			}
		}

		function getMessageIndicatorStatus() {
			return isIndicatorActive;
		}

		/**
		 * @method deactivateMessageIndicator
		 * API called from outside. after this the message will NOT be notified.
		 */
		function deactivateMessageIndicator() {
			if (!isIndicatorActive) {
				return;
			}
			isIndicatorActive = false;
			bMailIconKeyProcess = false;
			hideNewPopupIndicator();
			hideNewMailIndicator();
		}

		return {
			initialise: initialise,
			getMessageMails: getMessageMails,
			setMessageMailRead: setMessageMailRead,
			hasMessageMailUnread: function () {
				return hasUnreadMail;
			},
			getMessageId: function (msg) {
				return msg.cookedID;
			},
			activateMessageIndicator: activateMessageIndicator,
			deactivateMessageIndicator: deactivateMessageIndicator,
			getMessageIndicatorStatus: getMessageIndicatorStatus,
			isMailIconDisplaying: function () {
				return newMail.isVisible();
			},
			mailIconKeyProcess: mailIconKeyProcess,



			testMail: function (keyPress) {
				var msg1 = {messageID: 7, read: false, date: 1389097654158, title: "Test NEW", type: 1, subType: 1, cookedID: "7_1",
						content: "Give me one more time"},
					msg2 = {messageID: 8, read: false, date: 1389097654158, title: "Test NEW Popup", type: 1, subType: 2, cookedID: "8_1",
						channel: 1, content: "This is one Popup message for channel 1. This is one long Message. This is one long Message. This is one long Message. This is one long Message. This is one long Message."},
					msg3 = {messageID: 9, read: false, date: 1389097654158, title: "Test NEW Popup", type: 1, subType: 2, cookedID: "9_1",
						channel: 0, content: "This is one Popup message for all channels."},
					testCAPopupMsg = {},
					testMode = 0,
					str = "",
					parsedMsg = {};
				if (keyPress === "red") {//send Mail
					msg1.messageID = testMsgId + 1;
					msg1.cookedID = testMsgId + "_1";
					msg1.title = "Test " + testMsgId;
					msg1.content = msg1.content + " " + testMsgId;
					msg1.date = new Date().getTime();
					testMsgId++;
					messageMailSave(msg1);
					messageNewNotify(msg1);
				} else if (keyPress === "green") {
					messageMailSave(msg2);
					messageNewNotify(msg2);
					messageMailSave(msg3);
					messageNewNotify(msg3);
				} else if (keyPress === "blue") {
					on_ird_popup_message_remove();
				} else if (keyPress === "yellow") {
					if (testMode === 0) {
						testCAPopupMsg.persistence = CAPopupPersistence.NORMAL;
						testCAPopupMsg.message = "This is one Normal CA Popup message. This is one Normal CA Popup message. This is one Normal CA Popup message. This is one Normal CA Popup message. This is one Normal CA Popup message. This is one Normal CA Popup message.";
						on_ird_popup_message(null, testCAPopupMsg);
					} else if (testMode === 1) {
						testCAPopupMsg.persistence = CAPopupPersistence.TIMEOUT;
						testCAPopupMsg.message = "This is one Timeout CA Popup message";
						on_ird_popup_message(null, testCAPopupMsg);
					} else {
						testCAPopupMsg.persistence = CAPopupPersistence.USERACK;
						testCAPopupMsg.message = "This is one userACK CA Popup message";
						on_ird_popup_message(null, testCAPopupMsg);
					}
				} else if (keyPress === "ONE") {
					str = "MAIL#TEST#Friend...'OUT'TEST";
					parsedMsg.messageID = "100";
					parsedMsg.type = MESSAGES_CA;
					parsedMsg.cookedID = "100" + "_" + MESSAGES_CA;
					parsedMsg.read = false;
					if (!messagePayloadParse(str, parsedMsg)) {
						log("testMail", "Unrecognized message for NET !!!");
						return;
					}
					parsedMsg.date = new Date().getTime();
					messageMailSave(parsedMsg);
					messageNewNotify(parsedMsg);
				} else if (keyPress === "clear") {
					messageMailboxClear();
				}
			}
		};
	}());

}($N || {}));