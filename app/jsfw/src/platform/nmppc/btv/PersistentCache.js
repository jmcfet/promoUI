/**
 * This class contains the logic for storing and retrieving EPG data to/from a database.
 * @class $N.platform.btv.PersistentCache
 * @singleton
 * @requires $N.data.EPGEvent
 * @requires $N.data.EPGService
 * @requires $N.platform.output.EPGServiceFactory
 * @requires $N.platform.output.EPGEventFactory
 * @requires $N.services.sdp.Ratings
 * @author Gareth Stacey
 */

/*global define, openDatabase*/

define('jsfw/platform/btv/PersistentCache',
	[
		'jsfw/data/EPGEvent',
		'jsfw/data/EPGService',
		'jsfw/platform/btv/EPGServiceFactory',
		'jsfw/platform/btv/EPGEventFactory',
		'jsfw/services/sdp/Ratings'
	],
	function (EPGEvent, EPGService, EPGServiceFactory, EPGEventFactory, Ratings) {
		window.$N = $N || {};
		$N.platform = $N.platform || {};
		$N.platform.btv = $N.platform.btv || {};

		$N.platform.btv.PersistentCache = (function () {
			var database = null,
				defineGetter,
				DB_VERSION = "1.4", //must be updated whenever schema changes
				MAX_SIZE = 2 * 1024 * 1024, //2 meg
				SERVICE_TABLE_NAME = "services",
				cacheEventQueue = [],
				cacheServiceQueue = [],
				serviceTableStructure = [
					{
						column: "uid",
						type: "VARCHAR (256)",
						nullEnabled: false,
						isPrimary: true
					},
					{
						column: "callLetters",
						type: "VARCHAR (256)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "casID",
						type: "INT",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "creationDate",
						type: "INT",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "description",
						type: "VARCHAR (1024)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "locale",
						type: "VARCHAR (30)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "modifiedDate",
						type: "INT",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "modifiedDateML",
						type: "INT",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "name",
						type: "VARCHAR (256)",
						nullEnabled: false,
						isPrimary: false
					},
					{
						column: "networkLocation",
						type: "VARCHAR (256)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "number",
						type: "INT",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "originID",
						type: "INT",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "originIdAndKey",
						type: "VARCHAR (256)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "originKey",
						type: "VARCHAR (256)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "ownerId",
						type: "VARCHAR (256)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "promoImage",
						type: "VARCHAR (256)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "ratingID",
						type: "INT",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "serviceProviderID",
						type: "INT",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "sourceAddress",
						type: "VARCHAR (256)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "status",
						type: "VARCHAR (256)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "type",
						type: "VARCHAR (256)",
						nullEnabled: false,
						isPrimary: false
					},
					{
						column: "parentalRating",
						type: "VARCHAR (10)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "deliveryMethod",
						type: "INT",
						nullEnabled: false,
						isPrimary: false
					},
					{
						column: "nPvrSupport",
						type: "BOOL",
						nullEnabled: true,
						isPrimary: false
					}
				],
				EVENT_TABLE_NAME = "events",
				eventTableStructure = [
					{
						column: "channelUID",
						type: "VARCHAR (256)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "creationDate",
						type: "INT",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "endTime",
						type: "INT",
						nullEnabled: false,
						isPrimary: false
					},
					{
						column: "eventName",
						type: "VARCHAR (256)",
						nullEnabled: false,
						isPrimary: false
					},
					{
						column: "eventRating",
						type: "INT",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "modifiedDate",
						type: "INT",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "originID",
						type: "INT",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "originIdAndKey",
						type: "VARCHAR (256)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "originKey",
						type: "VARCHAR (256)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "programUID",
						type: "INT",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "serviceProviderID",
						type: "INT",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "shortDescription",
						type: "VARCHAR (256)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "startTime",
						type: "INT",
						nullEnabled: false,
						isPrimary: false
					},
					{
						column: "uid",
						type: "INT",
						nullEnabled: false,
						isPrimary: true
					},
					{
						column: "parentalRating",
						type: "VARCHAR (30)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "cacheTimestamp",
						type: "INT",
						nullEnabled: false,
						isPrimary: false
					},
					{
						column: "source",
						type: "VARCHAR (1)",
						nullEnabled: false,
						isPrimary: false
					},
					{
						column: "year",
						type: "VARCHAR (4)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "definition",
						type: "VARCHAR (30)",
						nullEnabled: true,
						isPrimary: false
					},
					{
						column: "isnPvr",
						type: "BOOL",
						nullEnabled: true,
						isPrimary: false
					}
				];

			if (Object.defineProperty) {
				defineGetter = function (obj, name, func) {
					Object.defineProperty(obj, name, {
						get: func
					});
				};
			} else {
				defineGetter = function (obj, name, func) {
					obj.__defineGetter__(name, func);
				};
			}

			/**
			 * Returns an object that conforms to the DB Event schema
			 * @method getInMappedEvent
			 * @param {Object} eventObject Event object from to be mapped to schema
			 * @return {Object}
			 */
			function getInMappedEvent(eventObject) {
				var mappedObj = {};
				if (eventObject.hasOwnProperty('eit_info_short_desc')) {
					mappedObj.channelUID = eventObject.sid + "";
					mappedObj.creationDate = null;
					mappedObj.endTime = eventObject.eit_info_start_time_gmt + eventObject.eit_info_duration;
					mappedObj.eventName = eventObject.eit_info_event_name;
					mappedObj.eventRating = null;
					mappedObj.modifiedDate = null;
					mappedObj.originID = null;
					mappedObj.originIdAndKey = null;
					mappedObj.originKey = null;
					mappedObj.programUID = null;
					mappedObj.parentalRating = eventObject.eit_info_private_rating + "";
					mappedObj.serviceProviderID = null;
					mappedObj.shortDescription = eventObject.eit_info_short_desc;
					mappedObj.startTime = eventObject.eit_info_start_time_gmt;
					mappedObj.uid = eventObject.eit_info_event_id;
					mappedObj.source = $N.data.EPGEvent.SOURCE.GATEWAY;
					mappedObj.year = null;
					mappedObj.definition = null;
					mappedObj.isnPvr = false;
				} else if (eventObject.eventId) {
					mappedObj.channelUID = eventObject.serviceRef + "";
					mappedObj.creationDate = null;
					mappedObj.endTime = eventObject.period.end * 1000;
					mappedObj.eventName = eventObject.Title;
					mappedObj.eventRating = eventObject.Rating.precedence;
					mappedObj.modifiedDate = null;
					mappedObj.originID = null;
					mappedObj.originIdAndKey = null;
					mappedObj.originKey = null;
					mappedObj.programUID = null;
					mappedObj.parentalRating = $N.services.sdp.Ratings.getUserAgeRatingForRatingId(eventObject.Rating.precedence) + "" || null;
					mappedObj.serviceProviderID = eventObject.period.providerID;
					mappedObj.shortDescription = eventObject.Description;
					mappedObj.startTime = eventObject.period.start * 1000;
					mappedObj.uid = eventObject.id;
					mappedObj.source = $N.data.EPGEvent.SOURCE.MDS;
					mappedObj.year = eventObject.Year;
					mappedObj.definition = eventObject.Definition;
					mappedObj.isnPvr = (eventObject.isnPvr === "true" || eventObject.isnPvr === true) ? true : false;
				} else {
					mappedObj.channelUID = eventObject.channelUID + "";
					mappedObj.creationDate = eventObject.creationDate;
					mappedObj.endTime = eventObject.endTime;
					mappedObj.eventName = eventObject.eventName;
					mappedObj.eventRating = eventObject.eventRating.precedence;
					mappedObj.modifiedDate = eventObject.modifiedDate;
					mappedObj.originID = eventObject.originID;
					mappedObj.originIdAndKey = eventObject.originIdAndKey;
					mappedObj.originKey = eventObject.originKey;
					mappedObj.programUID = eventObject.programUID;
					mappedObj.parentalRating = eventObject.parentalRating + "";
					mappedObj.serviceProviderID = eventObject.serviceProviderID;
					mappedObj.shortDescription = eventObject.shortDescription;
					mappedObj.startTime = eventObject.startTime;
					mappedObj.uid = eventObject.uid;
					mappedObj.source = $N.data.EPGEvent.SOURCE.SDP;
					mappedObj.year = null;
					mappedObj.definition = eventObject.definition;
					mappedObj.isnPvr = false;
				}
				mappedObj.cacheTimestamp = new Date().getTime();
				return mappedObj;
			}

			/**
			 * Returns an object that conforms to the DB Service schema
			 * @method getInMappedService
			 * @param {Object} serviceObject Service object from to be mapped to schema
			 * @return {Object}
			 */
			function getInMappedService(serviceObject) {
				var mappedObj = {};
				if (serviceObject.sid) {
					mappedObj.uid = serviceObject.sid + "";
					mappedObj.callLetters = null;
					mappedObj.casID = null;
					mappedObj.creationDate = null;
					mappedObj.description = serviceObject.description;
					mappedObj.locale = null;
					mappedObj.modifiedDate = null;
					mappedObj.modifiedDateML = null;
					mappedObj.name = serviceObject.sn + "";
					mappedObj.networkLocation = null;
					mappedObj.number = null;
					mappedObj.originID = null;
					mappedObj.originIdAndKey = null;
					mappedObj.originKey = null;
					mappedObj.ownerId = null;
					mappedObj.promoImage = "logos/" + serviceObject.oid + "-" + serviceObject.sid + ".png";
					mappedObj.ratingID = null;
					mappedObj.serviceProviderID = null;
					mappedObj.sourceAddress = null;
					mappedObj.status = null;
					mappedObj.type = $N.data.EPGService.SERVICE_TYPE.TV;
					mappedObj.parentalRating = null;
					mappedObj.deliveryMethod = $N.data.EPGService.DELIVERY_TYPE.GATEWAY;
					mappedObj.nPvrSupport = false;
				} else if (serviceObject.editorial) {
					mappedObj.uid = serviceObject.editorial.id;
					mappedObj.callLetters = serviceObject.editorial.longName;
					mappedObj.casID = serviceObject.technical.drmId;
					mappedObj.creationDate = null;
					mappedObj.description = serviceObject.technical.Description;
					mappedObj.locale = serviceObject.locale;
					mappedObj.modifiedDate = null;
					mappedObj.modifiedDateML = null;
					mappedObj.name = serviceObject.technical.longName;
					mappedObj.networkLocation = serviceObject.technical.NetworkLocation;
					mappedObj.number = serviceObject.editorial.tvChannel;
					mappedObj.originID = serviceObject.technical.id;
					mappedObj.originIdAndKey = serviceObject.t;
					mappedObj.originKey = serviceObject.providerId;
					mappedObj.ownerId = null;
					mappedObj.promoImage = serviceObject.technical.PromoImages ? serviceObject.technical.PromoImages[0] : "";
					mappedObj.ratingID = serviceObject.editorial.Rating.precedence;
					mappedObj.serviceProviderID = serviceObject.providerId;
					mappedObj.sourceAddress = null;
					mappedObj.status = null;
					mappedObj.type = $N.data.EPGService.SERVICE_TYPE.TV;
					mappedObj.parentalRating = $N.services && $N.services.sdp && $N.services.sdp.Ratings ? $N.services.sdp.Ratings.getUserAgeRatingForRatingId(serviceObject.editorial.Rating.precedence) : null;
					mappedObj.deliveryMethod = $N.data.EPGService.DELIVERY_TYPE.IP;
					mappedObj.nPvrSupport = (serviceObject.technical.nPvrSupport === "true" || serviceObject.technical.nPvrSupport === true) ? true : false;
				} else {
					mappedObj.uid = serviceObject.uid + "";
					mappedObj.callLetters = serviceObject.callLetters + "";
					mappedObj.creationDate = serviceObject.creationDate;
					mappedObj.description = serviceObject.description;
					mappedObj.locale = serviceObject.locale;
					mappedObj.modifiedDate = serviceObject.modifiedDate;
					mappedObj.modifiedDateML = serviceObject.modifiedDateML;
					mappedObj.name = serviceObject.name + "";
					mappedObj.networkLocation = serviceObject.networkLocation;
					mappedObj.number = serviceObject.number;
					mappedObj.originID = serviceObject.originID;
					mappedObj.originIdAndKey = serviceObject.originIdAndKey;
					mappedObj.originKey = serviceObject.originKey;
					mappedObj.ownerId = serviceObject.ownerId + "";
					mappedObj.promoImage = serviceObject.promoImage || "";
					mappedObj.ratingID = serviceObject.ratingID;
					mappedObj.serviceProviderID = serviceObject.serviceProviderID;
					mappedObj.sourceAddress = serviceObject.sourceAddress;
					mappedObj.status = serviceObject.status + "";
					mappedObj.deliveryMethod = $N.data.EPGService.DELIVERY_TYPE.IP;
					mappedObj.type = serviceObject.type + "";
					if (serviceObject.mainContentUID) { // SDP 3.4
						mappedObj.casID = serviceObject.drmId;
						mappedObj.parentalRating = $N.services.sdp.Ratings.getUserAgeRatingForRatingId(serviceObject.ratingID) + "" || null;
					} else {
						mappedObj.casID = serviceObject.casID;
						mappedObj.parentalRating = serviceObject.parentalRating + "";
					}
					mappedObj.nPvrSupport = false;
				}
				return mappedObj;
			}

			/**
			 * Creates a table with the given table name and contains the provided structure
			 * @method createTable
			 * @private
			 * @param {String} tableName
			 * @param {Object} tableStructure
			 * @param {Function} successCallback function that will be called once the table has been
			 * created successfully
			 */
			function createTable(tableName, tableStructure, successCallback) {
				var i,
					sql = "CREATE TABLE IF NOT EXISTS " + tableName + " (";
				for (i = 0; i < tableStructure.length; i++) {
					if (i !== 0) {
						sql += " ,";
					}
					sql += tableStructure[i].column + " " + tableStructure[i].type + " ";
					sql += tableStructure[i].nullEnabled ? "NULL " : "NOT NULL ";
					sql += tableStructure[i].isPrimary ? "PRIMARY KEY " : "";
				}
				sql += ")";
				database.transaction(function (tx) {
					tx.executeSql(sql, successCallback);
				});
			}

			/**
			 * Returns an object containing two attributes: `sql` and `values` so that an insert SQL
			 * command can be prepared
			 * @method getInsertSQLObj
			 * @private
			 * @param {String} tableName
			 * @param {Object} objToInsert
			 * @param {Function} mapping
			 * @return {Object}
			 */
			function getInsertSQLObj(tableName, objToInsert, mapping) {
				var sql = "INSERT INTO " + tableName,
					values = [],
					columnNames = [],
					questionMarks = [],
					objKey,
					mappedData;
				mappedData = mapping(objToInsert._data);
				for (objKey in mappedData) {
					if (mappedData.hasOwnProperty(objKey)) {
						columnNames.push(objKey);
						questionMarks.push('?');
						values.push(mappedData[objKey]);
					}
				}
				sql += '(' + columnNames.join(', ') + ')';
				sql += ' VALUES(' + questionMarks.join(', ') + ')';
				return {sql: sql, values: values};
			}

			/**
			 * Returns an object consisting of an sql update statement and values to update
			 * @method getUpdateObject
			 * @private
			 * @param {String} tableName
			 * @param {Object} recordToUpdate
			 * @param {String} keyAttribute
			 * @param {Function} mapping
			 * @return {Object}
			 */
			function getUpdateObject(tableName, recordToUpdate, keyAttribute, mapping) {
				var updateStatement = 'UPDATE ' + tableName + ' SET ',
					mappedData,
					updateKeys = [],
					updateValues = [],
					objKey;
				mappedData = mapping(recordToUpdate._data);
				for (objKey in mappedData) {
					if (mappedData.hasOwnProperty(objKey)) {
						updateKeys.push(objKey + '=?');
						updateValues.push(mappedData[objKey]);
					}
				}
				updateStatement += updateKeys.join(', ') + ' WHERE ' + keyAttribute + '=?';
				updateValues.push(mappedData[keyAttribute]);
				return {sql: updateStatement, values: updateValues};
			}

			/**
			 * Updates a record (service/event) within the EPG DB
			 * @method updateExistingRecord
			 * @private
			 * @param {String} tableName Table to perform update on
			 * @param {Object} record New record to update in db
			 * @param {String} keyAttribute
			 * @param {Function} callback
			 * @param {Function} mapping
			 */
			function updateExistingRecord(tableName, record, keyAttribute, callback, mapping) {
				// get the SQL statement for update using record
				var updateObject = getUpdateObject(tableName, record, keyAttribute, mapping);
				database.transaction(function (tx) {
					// run the SQL
					tx.executeSql(updateObject.sql, updateObject.values, function (trx, results) {
						// invoke the callback
						if (results && results.rowsAffected === 1) {
							if (callback) {
								callback(true);
							}
						} else if (callback) {
							callback(false);
						}
					}, function () {
						callback(false);
					});
				});
			}

			/**
			 * Process the next item in the given caching queue
			 * @method processQueue
			 * @private
			 * @param {Array} queue
			 * @param {Function} addMethod
			 */
			function processQueue(queue, addMethod) {
				var nextQueueItem;
				if (queue.length > 0) {
					nextQueueItem = queue[0];
					addMethod(nextQueueItem.obj, nextQueueItem.callback);
				}
			}

			/**
			 * Adds the given service record to the services table. Calls the successCallback on completion
			 * @method addServiceRecord
			 * @private
			 * @param {Object} serviceObject
			 * @param {Function} successCallback
			 */
			function addServiceRecord(serviceObject, successCallback) {
				var insertObj = getInsertSQLObj(SERVICE_TABLE_NAME, serviceObject, getInMappedService);
				database.transaction(function (tx) {
					tx.executeSql(insertObj.sql, insertObj.values, function (trx, results) {
						if (results && results.insertId && results.rowsAffected === 1) {
							if (successCallback) {
								successCallback(true);
							}
						} else {
							successCallback(false);
						}
						cacheServiceQueue.shift();
						processQueue(cacheServiceQueue, addServiceRecord);
					}, function () {
						updateExistingRecord(SERVICE_TABLE_NAME, serviceObject, 'uid', successCallback || null, getInMappedService);
						cacheServiceQueue.shift();
						processQueue(cacheServiceQueue, addServiceRecord);
					});
				});
			}

			/**
			 * Adds the given event record to the events table. Calls the successCallback on completion
			 * @method addEventRecord
			 * @private
			 * @param {Object} eventObject
			 * @param {Function} successCallback
			 */
			function addEventRecord(eventObject, successCallback) {
				var insertObj = getInsertSQLObj(EVENT_TABLE_NAME, eventObject, getInMappedEvent),
					deleteCondition;
				database.transaction(function (tx) {
					// delete events whose scheduling overlaps that of the new event
					deleteCondition = 'channelUID=? AND startTime>=? AND (endTime<=? OR startTime<?)';
					tx.executeSql('DELETE FROM ' + EVENT_TABLE_NAME + ' WHERE ' + deleteCondition, [eventObject.channelUID, eventObject.startTime, eventObject.endTime, eventObject.endTime], function () {
						tx.executeSql(insertObj.sql, insertObj.values, function (tx, result) {
							if (result && result.insertId && result.rowsAffected === 1) {
								if (successCallback) {
									successCallback(true);
								}
							} else if (successCallback) {
								successCallback(false);
							}
							cacheEventQueue.shift();
							processQueue(cacheEventQueue, addEventRecord);
						}, function () {
							if (successCallback) {
								successCallback(false);
							}
							cacheEventQueue.shift();
							processQueue(cacheEventQueue, addEventRecord);
						});
					});
				});
			}

			/**
			 * Performs a SELECT SQL query on the given table within the EPG DB
			 * @method getRecordsByCondition
			 * @private
			 * @param {String} tableName Table to run the query on
			 * @param {String} conditions Where part of the SQL statement
			 * @param {Function} callback Function to call once query is complete
			 */
			function getRecordsByCondition(tableName, conditions, callback) {
				var whereClause = conditions ? (' WHERE ' + conditions) : '',
					records = [];

				database.transaction(function (tx) {
					tx.executeSql('SELECT * FROM ' + tableName + whereClause, [], function (tx, results) {
						var mappingFunction = (tableName === SERVICE_TABLE_NAME) ? $N.platform.btv.EPGServiceFactory.mapObject : $N.platform.btv.EPGEventFactory.mapObject,
							i;
						if (results && results.rows && results.rows.length) {
							for (i = results.rows.length - 1; i >= 0; i--) {
								records.push(mappingFunction(results.rows.item(i)));
							}
							callback(records);
						} else {
							callback(records);
						}
					}, function () {
						callback(records);
					});
				});
			}

			/**
			 * Creates the service and event tables
			 * @method createTables
			 * @private
			 */
			function createTables() {
				createTable(SERVICE_TABLE_NAME, serviceTableStructure);
				createTable(EVENT_TABLE_NAME, eventTableStructure);
			}

			return {

				/**
				 * Should be called prior to using the PersistentCache class.
				 * Will check if a database is available and set it up ready for data storage and retrieval.
				 * @method init
				 */
				init: function () {
					database = openDatabase("EPG", "", "Database to store EPG data", MAX_SIZE);
					if (database.version === "") {
						createTables();
					} else if (database.version !== DB_VERSION) {
						database.transaction(function (tx) {
							tx.executeSql("DROP TABLE " + SERVICE_TABLE_NAME, [],
								function (tx) {
									tx.executeSql("DROP TABLE " + EVENT_TABLE_NAME, [],
										function () {
											database.changeVersion(database.version, DB_VERSION, function () {
												createTables();
											});
										}
									);
								}
							);
						});
					}
				},

				/**
				 * Adds the given service to the service cache
				 * @method cacheService
				 * @async
				 * @param {Object} serviceToAdd the EPG service that's to be cached
				 * @param {Function} callback function that's to be called back when the service has been
				 * cached successfully
				 */
				cacheService: function (serviceToAdd, callback) {
					if (serviceToAdd) {
						cacheServiceQueue.push({
							obj: serviceToAdd,
							callback: callback
						});
						if (cacheServiceQueue.length === 1) {
							processQueue(cacheServiceQueue, addServiceRecord);
						}
					}
				},

				/**
				 * Adds the given event to the event cache
				 * @method cacheEvent
				 * @async
				 * @param {Object} eventToAdd the EPG event that's to be cached
				 * @param {Function} callback function that's to be called back when the event has been
				 * cached successfully
				 */
				cacheEvent: function (eventToAdd, callback) {
					if (eventToAdd) {
						cacheEventQueue.push({
							obj: eventToAdd,
							callback: callback
						});
						if (cacheEventQueue.length === 1) {
							processQueue(cacheEventQueue, addEventRecord);
						}
					}
				},

				/**
				 * Returns the cached services
				 * @method getServices
				 * @return {Array} array of EPG services
				 */
				getServices: function () {
					return null;
				},

				/**
				 * Returns the cached services
				 * @method fetchServices
				 * @async
				 * @param {Function} callback function that will be called with the array of service objects
				 */
				fetchServices: function (callback) {
					getRecordsByCondition(SERVICE_TABLE_NAME, null, callback);
				},

				/**
				 * If the given service.serviceId exists then this record will be overwritten by the given service object
				 * @method updateService
				 * @async
				 * @param {Number} serviceId
				 * @param {Object} service
				 * @param {Function} callback function that will be called once the service has been updated
				 */
				updateService: function (serviceId, service, callback) {
					updateExistingRecord(SERVICE_TABLE_NAME, service, 'uid', callback || null, getInMappedService);
				},

				/**
				 * Returns the event with the specified event id
				 * @method getEventById
				 * @param {String} eventId
				 * @return {Object} EPG event
				 */
				getEventById: function (eventId) {
					return null;
				},

				/**
				 * Returns the event with the specified event id
				 * @method fetchEventById
				 * @async
				 * @param {String} eventId
				 * @param {Function} callback function that will be called with the desired EPG event
				 */
				fetchEventById: function (eventId, callback) {
					getRecordsByCondition(EVENT_TABLE_NAME, 'uid=' + eventId, function (events) {
						callback(events && events.length ? events[0] : null);
					});
				},

				/**
				 * Returns the event currently showing on the specified service
				 * @method getEventCurrent
				 * @param {String} serviceId
				 * @return {Object} the current event
				 */
				getEventCurrent: function (serviceId) {
					return null;
				},

				/**
				 * Returns the event currently showing on the specified service
				 * @method fetchEventCurrent
				 * @async
				 * @param {String} serviceId
				 * @param {Function} callback function that will be called with the current event
				 */
				fetchEventCurrent: function (serviceId, callback) {
					var now = new Date().getTime(),
						i,
						eventsLength,
						currentEvent = null;
					if (serviceId) {
						getRecordsByCondition(EVENT_TABLE_NAME, 'channelUID=' + serviceId, function (eventsForService) {
							eventsLength = eventsForService.length;
							for (i = 0; i < eventsLength; i++) {
								if (eventsForService[i].startTime <= now && eventsForService[i].endTime > now) {
									currentEvent = eventsForService[i];
									break;
								}
							}
							callback(currentEvent);
						});
					} else {
						callback(currentEvent);
					}
				},

				/**
				 * Returns the event showing immediately after a specified event on the same service
				 * @method getEventNext
				 * @param {String} eventId id of the event in question
				 * @return {Object} EPG event
				 */
				getEventNext: function (eventId) {
					return null;
				},

				/**
				 * Returns the event showing immediately after a specified event on the same service
				 * @method fetchEventNext
				 * @async
				 * @param {String} eventId
				 * @param {Function} callback function that will be called with the next event or null (if no such
				 * event is found)
				 */
				fetchEventNext: function (eventId, callback) {
					var i,
						nextEvent = null;
					if (eventId) {
						getRecordsByCondition(EVENT_TABLE_NAME, 'uid=' + eventId, function (events) {
							var event = events[0];
							getRecordsByCondition(EVENT_TABLE_NAME, 'channelUID=' + event.serviceId, function (eventsForService) {
								var eventsLength = eventsForService.length;
								for (i = 0; i < eventsLength; i++) {
									if (eventsForService[i].startTime === event.endTime) {
										nextEvent = eventsForService[i];
										break;
									}
								}
								callback(nextEvent);
							});
						});
					} else if (callback) {
						callback(nextEvent);
					}
				},

				/**
				 * Returns the event showing immediately before a specified event on the same service
				 * @method getEventPrevious
				 * @param {String} eventId id of the event in question
				 * @return {Object} EPG event
				 */
				getEventPrevious: function (eventId) {
					return null;
				},

				/**
				 * Returns the event showing immediately before a specified event on the same service
				 * @method fetchEventPrevious
				 * @param {String} eventId
				 * @param {Function} callback function that will be called with the previous event or null (if no such
				 * event is found)
				 */
				fetchEventPrevious: function (eventId, callback) {
					var i,
						previousEvent = null;
					if (eventId) {
						getRecordsByCondition(EVENT_TABLE_NAME, 'uid=' + eventId, function (events) {
							var event = events[0];
							getRecordsByCondition(EVENT_TABLE_NAME, 'channelUID=' + event.serviceId, function (eventsForService) {
								var eventsLength = eventsForService.length;
								for (i = 0; i < eventsLength; i++) {
									if (eventsForService[i].endTime === event.startTime) {
										previousEvent = eventsForService[i];
										break;
									}
								}
								callback(previousEvent);
							});
						});
					} else if (callback) {
						callback(previousEvent);
					}
				},

				/**
				 * Returns an array of events for the given service ids scheduled to show in the
				 * given time window
				 * @method getEventsByWindow
				 * @param {Array} serviceIds
				 * @param {Number} startTime
				 * @param {Number} endTime
				 * @return {Array} an array of EPG events
				 */
				getEventsByWindow: function (serviceIds, startTime, endTime) {
					return null;
				},

				/**
				 * Returns an array of events for the given service ids scheduled to show in the
				 * given time window
				 * @method fetchEventsByWindow
				 * @async
				 * @param {Array} serviceIds
				 * @param {Number} startTime
				 * @param {Number} endTime
				 * @param {Function} callback function that will be called with the array of events or an empty
				 * array (if no matching events are found)
				 */
				fetchEventsByWindow: function (serviceIds, startTime, endTime, callback) {
					var i,
						condition,
						serviceLookup = {},
						sortedEvents = [];
					if (serviceIds && serviceIds.length && startTime && endTime && endTime > startTime) {
						condition = 'channelUID IN (' + JSON.stringify(serviceIds).replace(/(\[|\])/g,"") + ') AND startTime < ' + endTime + ' AND endTime > ' + startTime + ' ORDER BY startTime DESC';
						getRecordsByCondition(EVENT_TABLE_NAME, condition, function (events) {
							for (i = 0; i < events.length; i++) {
								if (!serviceLookup[events[i].serviceId]) {
									serviceLookup[events[i].serviceId] = [];
								}
								serviceLookup[events[i].serviceId].push(events[i]);
							}
							for (i = 0; i < serviceIds.length; i++) {
								if (serviceLookup[serviceIds[i]]) {
									sortedEvents = sortedEvents.concat(serviceLookup[serviceIds[i]]);
								}
							}
							callback(sortedEvents);
						});
					} else if (callback) {
						callback([]);
					}
				},

				/**
				 * Removes the event with the given event id from the cache
				 * @method removeEvent
				 * @async
				 * @param {String} eventId
				 * @param {Function} [callback=null] function that will be called after the delete operation has been
				 * performed. The number of rows deleted will be passed in to this callback if the delete was
				 * successful, or a Boolean false if it wasn't.
				 */
				removeEvent: function (eventId, callback) {
					if (eventId) {
						database.transaction(function (tx) {
							tx.executeSql('DELETE FROM ' + EVENT_TABLE_NAME + ' WHERE uid=?', [eventId], function (tx, results) {
								if (results && results.rowsAffected !== undefined && results.rowsAffected !== null) {
									if (callback) {
										callback(results.rowsAffected);
									}
								}
							}, function () {
								if (callback) {
									callback(false);
								}
							});
						});
					} else if (callback) {
						callback(false);
					}
				},

				/**
				 * Removes events older than a specified time from the cache
				 * @method removeEventsOlderThan
				 * @async
				 * @param {Number} time time in milliseconds as returned by the `Date` object's `getTime` method.
				 * @param {Function} [callback=null] the function that will be called after the delete operation. This function will
				 * receive either the number of events removed or false (if no events were removed).
				 */
				removeEventsOlderThan: function (time, callback) {
					if (time) {
						database.transaction(function (tx) {
							tx.executeSql('DELETE FROM ' + EVENT_TABLE_NAME + ' WHERE endTime<?', [time], function (trx, results) {
								if (results && results.rowsAffected !== undefined && results.rowsAffected !== null) {
									if (callback) {
										callback(results.rowsAffected);
									}
								}
							}, function () {
								if (callback) {
									callback(false);
								}
							});
						});
					} else if (callback) {
						callback(false);
					}
				},

				/**
				 * Removes the service with the given service id from the cache
				 * @method removeService
				 * @async
				 * @param {String} serviceId
				 * @param {Function} [callback=null] function that will be called after the delete operation has been
				 * performed. The number of rows deleted will be passed in to this callback if the delete was
				 * successful, or a Boolean false if it wasn't.
				 */
				removeService: function (serviceId, callback) {
					if (serviceId) {
						database.transaction(function (tx) {
							tx.executeSql('DELETE FROM ' + SERVICE_TABLE_NAME + ' WHERE uid=?', [serviceId], function (trx, results) {
								if (results && results.rowsAffected !== undefined && results.rowsAffected !== null) {
									if (callback) {
										callback(results.rowsAffected);
									}
								}
							}, function () {
								if (callback) {
									callback(false);
								}
							});
						});
					} else if (callback) {
						callback(false);
					}
				},

				/**
				 * Removes all services and events from the cache
				 * @method clearCache
				 * @async
				 * @param {Function} [callback=null] function that will be called after the cache has been cleared
				 */
				clearCache: function (callback) {

					database.transaction(function (tx) {
						var servicesCleared = false,
							eventsCleared = false;
						tx.executeSql('DELETE FROM ' + SERVICE_TABLE_NAME, [], function (trx, results) {
							servicesCleared = results && results.rowsAffected !== undefined && results.rowsAffected !== null;
							tx.executeSql('DELETE FROM ' + EVENT_TABLE_NAME, [], function (trx, status) {
								eventsCleared = status && status.rowsAffected !== undefined && status.rowsAffected !== null;
								if (callback) {
									callback(servicesCleared && eventsCleared);
								}
							}, function () {
								if (callback) {
									callback(false);
								}
							});
						}, function () {
							if (callback) {
								callback(false);
							}
						});
					});
				},

				/**
				 * Determines whether the persistent cache database is available
				 * @method isDBAvailable
				 * @return {Boolean} true if the cache database is available, false otherwise
				 */
				isDBAvailable: function () {
					return (database !== undefined && database !== null);
				},

				/**
				 * Registers a callback to be invoked when the `EPGServicesUpdated` event is fired
				 * @method addEPGServicesUpdatedListener
				 * @param {Function} listener
				 */
				addEPGServicesUpdatedListener: function (listener) {
				},

				/**
				 * Removes a callback previously registered for the `EPGServicesUpdated` event
				 * @method removeEPGServicesUpdatedListener
				 * @param {Function} listener
				 */
				removeEPGServicesUpdatedListener: function (listener) {
				}
			};
		}());
		return $N.platform.btv.PersistentCache;
	}
);