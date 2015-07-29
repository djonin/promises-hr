
// Since objects only compare === to the same object (i.e. the same reference)
// we can do something like this instead of using integer enums because we can't
// ever accidentally compare these to other values and get a false-positive.
//
// For instance, `rejected === resolved` will be false, even though they are
// both {}.
var rejected = {}, resolved = {}, waiting = {};

// This is a promise. It's a value with an associated temporal
// status. The value might exist or might not, depending on
// the status.
var Promise = function () {
	this.status =  waiting;
};

var isPromise = function(item) {
	return item && item.constructor === Promise;
};

Promise.prototype.constructor = Promise;

// The user-facing way to add functions that want
// access to the value in the promise when the promise
// is resolved.
Promise.prototype.then = function (success, _failure) {
	if(this.cb) {
		throw new Error('Tried to call then twice.');
	}
	this.cb = success;
	this.nextPromise = new Promise();
	if(this.status === resolved) {
		this.fulfill(this.value, true);
	}
	if(_failure) {
		this.catch(_failure);
	}
	return this.nextPromise;
};


// The user-facing way to add functions that should fire on an error. This
// can be called at the end of a long chain of .then()s to catch all .reject()
// calls that happened at any time in the .then() chain. This makes chaining
// multiple failable computations together extremely easy.
Promise.prototype.catch = function (failure) {
	console.log(this.abc);
	if(this.fcb) {
		throw new Error('Tried to call catch twice.');
	}
	this.fcb = failure;
	if(this.status === rejected) {
		this.notify(this.value, force);
	}
};

Promise.prototype.fulfill = function(data, force) {
	if(this.status !== resolved || force) {
		if(this.cb) {
			var result = this.cb(data);
			if(isPromise(result)) {
				result.then(this.nextPromise.fulfill.bind(this.nextPromise));
				result.catch(this.nextPromise.notify.bind(this.nextPromise));
			} else {
				this.nextPromise.fulfill(result);
			}
		} else {
			//pass data through to the next then call
			this.value = data;
		}
	} else {
		throw new Error('Tried to call fulfill twice.');
	}
	this.status = resolved;
};

Promise.prototype.notify = function(err, force) {
	if(this.status !== rejected || force) {
		if(this.fcb) {
			this.fcb(err);
		} else {
			if(this.nextPromise) {
				this.nextPromise.notify(err);
			} else {
				//pass data through to the next catch call
				this.value = err;
			}
		}
	}
	this.status = rejected;
}

// This is the object returned by defer() that manages a promise.
// It provides an interface for resolving and rejecting promises
// and also provides a way to extract the promise it contains.
var Deferred = function (promise) {
	this.promise = promise;
};

// Resolve the contained promise with data.
//
// This will be called by the creator of the promise when the data
// associated with the promise is ready.
Deferred.prototype.resolve = function (data) {
	this.promise.fulfill(data);
};

// Reject the contained promise with an error.
//
// This will be called by the creator of the promise when there is
// an error in getting the data associated with the promise.
Deferred.prototype.reject = function (error) {
	this.promise.notify(error);
};

// The external interface for creating promises
// and resolving them. This returns a Deferred
// object with an empty promise.
var defer = function () {
	return (new Deferred(new Promise()));
};


module.exports.defer = defer;

