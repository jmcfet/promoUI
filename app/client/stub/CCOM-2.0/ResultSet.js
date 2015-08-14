/**
 * Stub for CCOM 2.0 ResultSet
 * When creating a new instance, you must pass in an array of required objects for your
 * particular test case.
 * @author dthomas
 */

function ResultSet(results) {
	this.results = results;
	this.pointer = 0;
    this.reset = function () {};
    this.eventListeners = {};
}

ResultSet.prototype.getNext = function (required) {
	var i;
	var items = [];
	var end = this.pointer + required;
	for (i = this.pointer; i < end; i++) {
		if (this.results[i]) {
			items.push(this.results[i]);
		} else {
			break;
		}
	}
	this.pointer = i;
	return items;
};

ResultSet.prototype.addEventListener = function (event, callback) {
    if (this.eventListeners[event] === undefined) {
        this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
};

ResultSet.prototype.removeEventListener = function (event, callback) {
    var listeners = this.eventListeners[event],
        i;
    if (listeners) {
        for (i = 0; i < listeners.length; i++) {
            if (listeners[i] === callback) {
                listeners.splice(i, 1);
            }
        }
    }
};

ResultSet.prototype.fetchNext = function ( count )     {
    var items = this.getNext( count );
    if( items.length > 0 )  {
        this._raiseEvent( "fetchNextOK", {results: items} );
    }else   {
        this._raiseEvent( "fetchNextFailed", {error:"error"} );
    }
    return items.length;
};

ResultSet.prototype.getPropertyNames = function ( )     {
    var items = this.getNext( 10 );
    if( items.length > 0 )  {
        this._raiseEvent( "fetchNextOK", {propertyNames: items} );
    }else   {
        this._raiseEvent( "fetchNextFailed", {error:"error"} );
    }
};

ResultSet.prototype._raiseEvent = function ( event, parameter )     {
    var listeners = this.eventListeners[event],
        i;
    if (listeners) {
        for (i = 0; i < listeners.length; i++) {
            listeners[i](parameter);
        }
    }
};

