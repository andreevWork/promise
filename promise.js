class MyPromise {
  static _defaultOnFulfilled(value) {
    return value;
  }

  static _defaultOnRejected(reason) {
    throw reason;
  }

  static getThenable(x) {
    const then = x && x.then;

    return typeof then === 'function' ? then : null;
  }

  static _isPromiseDone(promiseState) {
    return promiseState !== MyPromise.States.pending;
  }

  static _enqueuePromiseJob({ handlers, promiseResult, nextPromises }) {
    setTimeout(() => {
      for (const [index, handler] of Object.entries(handlers)) {
        const nextPromise = nextPromises[index];

        try {
          const x = handler(promiseResult);

          MyPromise._abstractResolve(nextPromise, x);
        } catch (err) {
          nextPromise._rejectPromise(err);
        }
      }
    });
  }

  static _abstractResolve(nextPromise, x) {
    if (nextPromise === x) {
      nextPromise._rejectPromise(new TypeError('A promise cannot be resolved with itself.'));

      return;
    } else if (typeof x === 'object' || typeof x === 'function') {
      let then;
      let done = false;

      try {
        then = MyPromise.getThenable(x);
      } catch (rejectedReason) {
        nextPromise._rejectPromise(rejectedReason);
      }

      if (then) {

        try {
          then.call(x, y => {
            if (done) return;
            done = true;

            MyPromise._abstractResolve(nextPromise, y);
          }, y => {
            if (done) return;
            done = true;

            nextPromise._rejectPromise(y);
          });
        } catch(rejectedReason) {
          if (done) return;
          done = true;

          nextPromise._rejectPromise(rejectedReason);
        }

        return;
      }
    }

    nextPromise._fulfillPromise(x);
  }

  constructor(fn) {
    this._promiseResult = undefined;
    this._promiseIsHandled = false;
    this._promiseState = MyPromise.States.pending;
    this._onFulfilledHandlers = [];
    this._onRejectedHandlers = [];
    this._nextPromises = [];

    this._fulfillPromise = this._fulfillPromise.bind(this);
    this._rejectPromise = this._rejectPromise.bind(this);

    try {
      fn(this._fulfillPromise, this._rejectPromise);
    } catch (rejectedReason) {
      this._rejectPromise(rejectedReason);
    }
  }

  _fulfillPromise(promiseValue) {
    if (MyPromise._isPromiseDone(this._promiseState)) {
      return;
    }

    this._promiseResult = promiseValue;
    this._promiseState = MyPromise.States.fulfilled;

    this._executePromise();
  }

  _rejectPromise(rejectedReason) {
    if (MyPromise._isPromiseDone(this._promiseState)) {
      return;
    }

    this._promiseResult = rejectedReason;
    this._promiseState = MyPromise.States.rejected;

    this._executePromise();
  }

  then(onFulfilled, onRejected) {
    this._promiseIsHandled = true;

    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : MyPromise._defaultOnFulfilled;
    onRejected = typeof onRejected === 'function' ? onRejected : MyPromise._defaultOnRejected;

    this._onFulfilledHandlers.push(onFulfilled);
    this._onRejectedHandlers.push(onRejected);

    const nextPromise = new MyPromise(() => {});

    this._nextPromises.push(nextPromise);

    this._executePromise();

    return nextPromise;
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  _executePromise() {
    if (!MyPromise._isPromiseDone(this._promiseState) || !this._promiseIsHandled) {
      return;
    }

    const handlers = this._promiseState === MyPromise.States.fulfilled ?
      this._onFulfilledHandlers : this._onRejectedHandlers;

    MyPromise._enqueuePromiseJob({
      handlers: handlers.splice(0),
      promiseResult: this._promiseResult,
      nextPromises: this._nextPromises.splice(0)
    });
  }
}

MyPromise.resolve = value => {
  return new MyPromise(resolve => resolve(value));
};

MyPromise.rejected = reason => {
  return new MyPromise((_, rejected) => rejected(reason));
};

MyPromise.States =  {
  pending: 'pending',
  fulfilled: 'fulfilled',
  rejected: 'rejected'
};

module.exports = MyPromise;
