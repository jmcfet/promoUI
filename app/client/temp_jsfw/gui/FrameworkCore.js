/*global location,console*/
/**
 * Static class that defines functions that are key to the operation of the
 * graphical user interface framework.  In particular holds the logic to
 * parse mark-up to pull out custom namespaced GUI objects that get appended to a
 * view or controller class.
 * @class $N.gui.FrameworkCore
 *
 * @requires $N.gui.Util
 *
 * @static
 * @author mbrown
 */
/*global navigator, window, XMLHttpRequest*/
define('jsfw/gui/FrameworkCore',
    [
    'jsfw/gui/helpers/Util'
    ],
    function (Util) {
		window.$N = $N || {};
		$N.gui = $N.gui || {};
		$N.gui.FrameworkCore = (function () {
			var NAGRA_NAMESPACE = "http://www.example.org/nagra",
				mode = navigator.userAgent.indexOf("Ekioh") > -1 ? "SVG" : "HTML",
				keys = {
					KEY_ONE: "1",
					KEY_TWO: "2",
					KEY_THREE: "3",
					KEY_FOUR: "4",
					KEY_FIVE: "5",
					KEY_SIX: "6",
					KEY_SEVEN: "7",
					KEY_EIGHT: "8",
					KEY_NINE: "9",
					KEY_ZERO: "0",
					KEY_UP: "up",
					KEY_DOWN: "down",
					KEY_LEFT: "left",
					KEY_RIGHT: "right",
					KEY_OK: "ok",
					KEY_BACK: "back",
					KEY_EXIT: "exit"
				};

			/**
			 * Given a DOM element will iterate through the attributes of the
			 * element, create a matching JavaScript object whose properties
			 * match the attribute names and values and return the result.
			 * @private
			 * @method convertAttributesToConfig
			 * @param {Object} element
			 * @return {Object}
			 */
			function convertAttributesToConfig(element) {
				var config = {},
					i = 0,
					attribName = "",
					l;
				for (i = 0, l = element.attributes.length; i < l; i++) {
					attribName = element.attributes[i].name.substring(NAGRA_NAMESPACE.length + 1);
					if (!attribName) {
						attribName = element.attributes[i].name;
					}
					config[attribName] = element.attributes[i].value;
				}
				return config;
			}

			/**
			 * Recursive function that will parse/traverse the given root DOM element
			 * for Nagra namespaced tags representing objects from the GUI framework.
			 * Will covert these custom tags into mark up language and append the
			 * referenced JavaScript object to the receivingObject.
			 * @method extendWithGUIObjects
			 * @param {Object} rootElement
			 * @param {Object} receivingObject the JS object which will contain the dynamically
			 * created elements
			 * @param {Object} win the window object
			 * @param {Object} receivingElement the DOM object to which the dynamically created
			 * elements will be added
			 */

			function extendWithGUIObjects(rootElement, receivingObject, win, receivingElement) {
				var docRef = receivingElement ? receivingElement.ownerDocument : rootElement.ownerDocument,
					children = rootElement.childNodes,
					len = children.length,
					canRemove = false,
					i = 0,
					child,
					objectName = "",
					newObject,
					childToAddTo = null,
					receivingAttribute;
				win = win || window;
				for (i = 0; i < len; i++) {

					child = children[i];

					//pick out each element
					if (child && child.nodeType === 1) {
						//in the custom namespace
						if (child.namespaceURI === NAGRA_NAMESPACE) {
							objectName = $N.gui.Util.upcaseFirstLetter(child.localName);
							//if the element name matches a setter call the setter passing in the attributes as an object
							if (receivingObject["set" + objectName]) {
								receivingObject["set" + objectName](convertAttributesToConfig(child));
								canRemove = true;
							} else {
								//create the new GUIObject
								childToAddTo = child;
								if (window.$N && window.$N.gui && window.$N.gui[objectName]) {
									newObject = new window.$N.gui[objectName](docRef);
								} else if (win.$N && win.$N.gui && win.$N.gui[objectName]) {
									newObject = new win.$N.gui[objectName](docRef);
								} else if (window[objectName]) {
									newObject = new window[objectName](docRef);
								} else if (win && win[objectName]) {
									newObject = new win[objectName](docRef);
								}
								newObject.configure(convertAttributesToConfig(child));
								if (receivingObject.addChild) {
									//add it to the parent
									receivingObject.addChild(newObject);
									receivingObject[objectName] = newObject;
									if (receivingObject.getClassName && receivingObject.getClassName() === "Form" && newObject.isControl && newObject.isControl()) {
										receivingObject.addControl(newObject);
									}
									canRemove = true;
								} else if (receivingElement) {
									receivingElement.appendChild(newObject.getRootElement());
								} else {
									//otherwise add it before the custom namespace element
									child.parentNode.insertBefore(newObject.getRootElement(), child);
									canRemove = true;
								}
								if (child.hasChildNodes()) {
									extendWithGUIObjects(child, newObject, win, newObject.getRootElement());
								}

								//create a new property on pointing to the new GUIObject
								receivingAttribute = child.getAttributeNS(NAGRA_NAMESPACE, "id");
								if (receivingAttribute) {
									receivingObject[receivingAttribute] = newObject;
								} else {
									receivingObject[child.getAttribute("id")] = newObject;
								}
							}
							//remove from the mark-up
							if (canRemove) {
								child.parentNode.removeChild(child);
							}
						}
					}
				}
			}

			/**
			 * Loads the given xml file into the dom creating the
			 * gui components
			 * @method loadGUIFromXML
			 * @param {String} fileName, either relative to the main page or absolute file path, or a complete valid XML string
			 * @param {element} target the DOM element to create markup in
			 * @param {Object} receivingObject a JS object which will contain the elements that are dynamically
			 * created
			 * @param {Object} [win] reference to the window object of the application of object doing the load
			 */
			function loadGUIFromXML(fileName, target, receivingObject, win) {
				var xhttp = new XMLHttpRequest(),
					xmlDoc,
					xmlText,
					actualFileName,
					parser;
				if (fileName.indexOf('<?xml') === -1) {
					if (window.CCOM && CCOM.recorder && fileName.indexOf("http://") === -1) {
						//temporary fix due to issue with CCOM1.3 affecting relative paths when exposed in sub-applications
						actualFileName = location.href.substring(0, location.href.lastIndexOf("/") + 1) + fileName;
					} else {
						actualFileName = fileName;
					}

					xhttp.open("GET", actualFileName, false);
					xhttp.send();
					xmlDoc = xhttp.responseXML;
					xmlText = xhttp.responseText;
					if ((xhttp.status === 200 || xhttp.status === 0) && xmlDoc) {
						extendWithGUIObjects(xmlDoc.firstChild, receivingObject, win, target);
					} else {
						//error occured loading the file.
						console.log(String(xhttp.status) + " --- " + xhttp.responseText);
					}
				} else {
					parser = new DOMParser();
					xmlDoc = parser.parseFromString(fileName, "text/xml");
					extendWithGUIObjects(xmlDoc.firstChild, receivingObject, win, target);
				}
			}

			/**
			 * Recursive function that will parse/traverse the given root DOM element
			 * for script tags linking to an XML layout document.
			 * Will covert theNagra namespaced tags in the XML layout document
			 * into mark up language.
			 * @method createView
			 * @param {Object} rootElement
			 */
			function createView(rootElement, receivingObject, win) {

				var scriptTags = rootElement.getElementsByTagName("script"),
					scriptTag,
					xmlPath,
					scriptTagsLength = scriptTags.length,
					i,
					target = mode === "SVG" ? rootElement : rootElement.body;

				for (i = 0; i < scriptTagsLength; i++) {
					scriptTag = scriptTags[i];
					xmlPath = scriptTag.getAttribute("src");
					if (xmlPath && xmlPath.indexOf(".xml") > -1) {
						loadGUIFromXML(xmlPath, target, receivingObject, win);
					}
					//rootElement.removeChild(scriptTag);
				}
			}

			// public API
			return {
				/**
				 * Returns mark-up based on the platform the code is being run on
				 * @method getMode
				 * @return {String}
				 */
				getMode: function () {
					return mode;
				},
				extendWithGUIObjects : extendWithGUIObjects,

				/**
				 * Returns the key map of strings representing
				 * the key constants
				 * @method getKeys
				 * @return {Object}
				 */
				getKeys: function () {
					return keys;
				},

				/**
				 * Sets the key map of strings representing
				 * the key constants
				 * @method setKeys
				 * @param {Object} keyMap
				 */
				setKeys: function (keyMap) {
					keys = keyMap;
				},
				createView: createView,

				loadGUIFromXML: loadGUIFromXML
			};
		}());
		return $N.gui.FrameworkCore;
    }
);
