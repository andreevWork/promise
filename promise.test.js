const promisesAplusTests = require("promises-aplus-tests");
const MyPromise = require("./promise");
const adapter = {
  resolved: MyPromise.resolve,
  rejected: MyPromise.rejected,
  deferred: function() {
    var obj = {};
    var prom = new MyPromise(function(resolve, reject) {
      obj.resolve = resolve;
      obj.reject = reject;
    });
    obj.promise = prom;
    return obj;
  }
};

promisesAplusTests(adapter, function (err) {
  console.log('ERR: ', err);
});
