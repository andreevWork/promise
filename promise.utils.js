const MyPromise = require("./promise");

MyPromise.all = function(promises) {
  return new Promise((resolve, reject) => {
    const results = new Array(promises.length);
    let counter = 0;

    for (let [index, promise] of Object.entries(promises)) {
      let then = MyPromise.getThenable(promise);

      if (!then) {
        promise = MyPromise.resolve(promise);

        then = promise.then;
      }

      MyPromise._abstractResolve({
        _rejectPromise: reject,
        _fulfillPromise: value => {
          results[index] = value;

          counter++;

          if (counter === promises.length) {
            resolve(results);
          }
        }
      }, promise);
    }
  });
};

MyPromise.repeat = function(promiseCaller, limit) {
  return promiseCaller()
    .catch(reason => {
      if (limit) {
        return MyPromise.repeat(promiseCaller, --limit);
      }

      throw reason;
    });
};

MyPromise.threads = function(promisesCallers, threadsCount) {
  return new MyPromise(resolve => {
    const results = [];
    let currentCounter = 0;
    let finishedCounter = 0;

    while(threadsCount--) {
      processPromise(currentCounter);
    }

    function processPromise(localCounter) {
      currentCounter++;

      promisesCallers[localCounter]().then(value => {
        results[localCounter] = value;

        finishedCounter++;

        if (finishedCounter === promisesCallers.length) {
          resolve(results);
        } else {
          processPromise(currentCounter);
        }
      });
    }
  });
};
