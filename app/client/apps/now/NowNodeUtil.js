/**
 * @class $N.app.NowNodeUtil
 * @static
 * #depends NowNode.js
 */

var $N = window.parent.$N || {};
$N.app.NowNodeUtil = (function () {
	// WORK IN PROGRESS - DO NOT USE! //
	var log = new $N.apps.core.Log("NOW", "NowNodeUtil"),
		_rootNode,
		_hashedNodes = {},
		_emptyNodes = {},
		_leafNodes = [],
		_nonLeafNodes = [],
		_trimNodes = [],
		getNodeData,
		getRootNodes,
		createChildNodes,

		// Temporary datastore for _json output
		_json = {
			title: "root",
			children: []
		},
		// Temporary tree stats for analyses
		treeStats = {
			MaxDepth: 0,
			LeafCount: 0,
			NodeCount: 0,
			MaxChildren: 0,
			MaxChildrenId: null,
			NodesDeleted: 0,
			EmptyNodeCount: 0
		},

		/**
		 * NodeManager
		 */
		NodeManager = (function () {

			var _workQueue = [],
				_workTimer,
				_finishedCallback;

			function doWork() {
				var currentNode,
					currentNodeId,
					successCallback = function (assetCount) {
						//console.log("<<<< WORK PROCESSED - processed [%s] results [%s]", currentNode._data.id, assetCount);
						//if (assetCount > 0) {
							//console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>> [%s] ", currentNode._data.id);
						//}
						//console.timeEnd("job");
						//if (console.count) {
						//	console.count("workQueue");
						//}
						if (assetCount === 0) {
							treeStats.EmptyNodeCount++;
						}
						currentNode.assetCount = assetCount;
						_workTimer = setTimeout(doWork, 0);
					},
					failureCallback = function (reason) {
						//console.log("Oh no! failed reason :" + reason);
						$N.app.MDSUtil.getNodeAssetCount(currentNodeId, successCallback, failureCallback);
					};

				if (_workQueue.length > 0) {
					currentNode = _workQueue.pop();
					if (currentNode) {
						//console.log(">>>> WORK STARTED - processing " + currentNode._data.id);
						//console.time("job");
						currentNodeId = currentNode._data.id;
						$N.app.MDSUtil.getNodeAssetCount(currentNodeId, successCallback, failureCallback);
					}
				} else {
					_finishedCallback();
				}
			}

			function setWorkQueue(workQueue, callback) {
				_workQueue = workQueue;
				//console.log("workQueue.length[%s]", _workQueue.length);

				_finishedCallback = callback;
				_workTimer = setTimeout(doWork, 0);
			}

			return {
				setWorkQueue: setWorkQueue
			};

		}());

	/**
	 * treeWalkStats - recursively find the tree stats (to be deleted)
	 */
	function treeWalkStats(node, depth) {
		var i,
			children = node.children,
			childrenLength = children.length,
			child;

		depth++;
		if (depth > treeStats.MaxDepth) {
			treeStats.MaxDepth = depth;
		}
		if (childrenLength === 0) {
			treeStats.LeafCount++;
		} else if (childrenLength > treeStats.MaxChildren) {
			treeStats.MaxChildren = childrenLength;
			treeStats.MaxChildrenId = node._data.id;
		}

		treeStats.NodeCount++;

		for (i = 0; i < childrenLength; i++) {
			child = children[i];
			treeWalkStats(child, depth);
		}
	}

	/**
	 * treeWalkCount - recursively find the assetCount for all nodes
	 */
	function treeWalkCount(node) {
		var i,
			children = node.children,
			childrenLength = children.length,
			child,
			totalAssetCount = node.assetCount;

		for (i = 0; i < childrenLength; i++) {
			child = children[i];
			if (child.children.length > 0) {
				totalAssetCount += treeWalkCount(child);
			} else {
				totalAssetCount += child.assetCount;
			}
		}

		node.assetCount = totalAssetCount;
		return totalAssetCount;
	}


	/**
	 * treeWalkTrim - find the nodes that need to be trimmed
	 */
	function treeWalkTrim(node) {
		var i,
			children = node.children,
			childrenLength = children.length,
			child;

		for (i = 0; i < childrenLength; i++) {
			child = children[i];
			if (child.assetCount === 0) {
				_trimNodes.push(child);
				_emptyNodes[child._data.id] = true;
			} else {
				treeWalkTrim(child);
			}
		}
	}

	/**
	 * getParentPath - get the path to the parent
	 */
	function getParentPath(node, path) {
		path = path || "";

		path = node._data.title + "/" + path;
		if (node.parent) {
			return getParentPath(node.parent, path);
		} else {
			return path;
		}
	}

	/**
	 * treeWalkPrepareJSONResults - walk the tree and make a _json object for output (TO BE DELETED)
	 */
	function treeWalkPrepareJSONResults(node, parentNode) {
		var i,
			children = node.children,
			childrenLength = children.length,
			child,
			jsonNode;

		parentNode = parentNode || _json;

		jsonNode = {
			id: node._data.id,
			title: node._data.title,
			children: [],
			path: getParentPath(node)
		};

		parentNode.children.push(jsonNode);

		for (i = 0; i < childrenLength; i++) {
			child = children[i];
			treeWalkPrepareJSONResults(child, jsonNode);
		}
	}


	/**
	 * getNodes - get the nodes
	 */
	function getNodes() {
		log("getNodes", "Enter");
		$N.app.DebugUtil.cyan(">>>> getNodes!");

		var workQueueFinished = function () {
				var node,
					i;
				//console.log("workQueue finsihed");
				//console.timeEnd("workQueue");

				treeWalkStats(_rootNode, 0);
				//console.log(">>>>>>>>>> [%s]", JSON.stringify(treeStats));

				treeWalkCount(_rootNode);
				treeWalkTrim(_rootNode);

				for (i = 0; i < _trimNodes.length; i++) {
					node = _trimNodes[i];
					treeWalkPrepareJSONResults(node);
				}

				//console.log(JSON.stringify(_json));

			},
			getNodeDataSuccess = function () {
				//console.log("Retrieved");
				//console.timeEnd("Node Retrieval");

				//console.time("workQueue");
				//NodeManager.setWorkQueue(_leafNodes, workQueueFinished);
				//NodeManager.setWorkQueue(_nonLeafNodes, workQueueFinished);
			},
			getRootNodesSuccess = function () {
				getNodeData(getNodeDataSuccess);
			};

		_hashedNodes = {};
		_leafNodes = [];

		//console.time("Node Retrieval");
		_rootNode = new $N.gui.NowNode({
			id: "root"
		});

		getRootNodes(getRootNodesSuccess);
		log("getNodes", "Exit");
	}

	/**
	 * getRootNodes - get the root nodes
	 */
	getRootNodes = function (successCallback) {
		var failureCallback = function (data) {
				$N.app.DebugUtil.red("FAILED :( - Reason" + data);
			},
			getNodesSuccessCallback = function (data) {
				var nodes = data.nodes,
					nodesLength = nodes.length,
					nodeData,
					node,
					i;

				for (i = 0; i < nodesLength; i++) {
					nodeData = nodes[i];
					_hashedNodes[nodes[i].id] = nodeData;
					node = new $N.gui.NowNode(nodeData, _rootNode);
					_hashedNodes[nodes[i].id].nowNode = node;
				}

				successCallback();
			};

		$N.app.MDSUtil.getNodes(true, getNodesSuccessCallback, failureCallback);
	};

	getNodeData = function (successCallback) {
		log("getNodeData", "Enter");
		var failureCallback = function (data) {
				$N.app.DebugUtil.red("FAILED :( - Reason" + data);
			},
			getNodeTreeSuccessCallback = function (data) {
				//console.log(">> getNodeTreeSuccessCallback ENTER");
				var nodes = data.nodes,
					nodesLength = nodes.length,
					rootNodes = _rootNode.children,
					rootNodeLength = rootNodes.length,
					i;


				// Put data into hashed array
				for (i = 0; i < nodesLength; i++) {
					_hashedNodes[nodes[i].id] = nodes[i];
				}

				for (i = 0; i < rootNodeLength; i++) {
					createChildNodes(rootNodes[i]);
				}

				successCallback();
			};

		$N.app.MDSUtil.getNodes(false, getNodeTreeSuccessCallback, failureCallback);
		log("getNodeData", "Exit");
	};

	/**
	 * createChildNodes - create the child nodes of a node (recursively)
	 */
	createChildNodes = function (parentNode) {
		log("createChildNodes", "Enter - parentNode.id = " + parentNode._data.id);
		//console.log("createChildNodes - Enter - parentNode.id = " + parentNode._data.id);
		var children = parentNode._data.children,
			childrenLength = children.length,
			childData,
			childNode,
			descendentLength,
			i;

		for (i = 0; i < childrenLength; i++) {
			childData = _hashedNodes[children[i]];
			descendentLength = childData.descendants.length;
			childNode = new $N.gui.NowNode(childData, parentNode);
			_hashedNodes[children[i]].nowNode = childNode;
			if (childNode._data.children.length) {
				_nonLeafNodes.push(childNode);
				createChildNodes(childNode);
			} else {
				_leafNodes.push(childNode);
			}
		}
		//console.log("createChildNodes - Exit - parentNode.id = " + parentNode._data.id);
		log("createChildNodes", "Exit - parentNode.id = " + parentNode._data.id);
	};

	function getNowNode(nodeUid) {
		if (_hashedNodes[nodeUid]) {
			return _hashedNodes[nodeUid].nowNode;
		}
		return null;
	}


	return {
		getNodes: getNodes,
		getNowNode: getNowNode
	};
}());

/* WORK IN PROGRESS - DO NOT USE! */