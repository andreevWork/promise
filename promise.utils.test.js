const MyPromise = require("./promise");

require("./promise.utils");

describe('Promise utils', () => {

  describe('Promise.all', () => {

    test('only promises', done => {
      const promise1 = new MyPromise(res => {
        setTimeout(res, 100, 1);
      });
      const promise2 = new MyPromise(res => {
        setTimeout(res, 200, 2);
      });
      const promise3 = new MyPromise(res => {
        setTimeout(res, 300, 3);
      });

      MyPromise.all([
        promise1, promise3, promise2
      ]).then(results => {
        expect(results).toEqual([1, 3, 2]);

        done();
      });
    });

    test('deep promises and another standart promise', done => {
      const promise1 = new MyPromise(res => {
        setTimeout(res, 100, Promise.resolve(1));
      });
      const promise3 = new MyPromise(res => {
        setTimeout(res, 300, new MyPromise(res => setTimeout(res, 300, 5)));
      });

      MyPromise.all([
        promise1, promise3
      ]).then(results => {
        expect(results).toEqual([1, 5]);

        done();
      });
    });

    test('not only promises', done => {
      const p1 = MyPromise.resolve(3);
      const p2 = 1337;
      const p3 = new MyPromise((resolve) => {
        setTimeout(resolve, 100, "foo");
      });

      MyPromise.all([p1, p2, p3]).then(results => {
        expect(results).toEqual([3, 1337, "foo"] );

        done();
      });
    });

    test('reject', done => {
      const p1 = new MyPromise((resolve, reject) => {
        setTimeout(resolve, 1000, "one");
      });
      const p2 = new MyPromise((resolve, reject) => {
        setTimeout(resolve, 2000, "two");
      });
      const p3 = new MyPromise((resolve, reject) => {
        setTimeout(resolve, 3000, "three");
      });
      const p4 = new MyPromise((resolve, reject) => {
        setTimeout(resolve, 4000, "four");
      });
      const p5 = new MyPromise((resolve, reject) => {
        reject("reject");
      });

      MyPromise.all([p1, p2, p3, p4, p5]).then(value => {
        console.log(value);
      }, reason => {
        expect(reason).toEqual('reject');

        done();
      });
    });

  });

  describe('Promise.limit', () => {

    test('success after a few retries', done => {
      let retries = 0;
      const promiseCaller = () => new MyPromise((res, rej) => {
        setTimeout(() => {
          if (retries === 3) {
            res(1);
          } else {
            rej();
          }
          retries++;
        }, 100);
      });

      MyPromise.repeat(promiseCaller, 5).then(value => {
        expect(value).toEqual(1);

        done();
      });
    });

    test('failed after a all retries', done => {
      let retries = 0;
      const promiseCaller = () => new MyPromise((res, rej) => {
        setTimeout(() => {
          if (retries === 10) {
            res(1);
          } else {
            rej('reject');
          }
          retries++;
        }, 100);
      });

      MyPromise.repeat(promiseCaller, 5).catch(reason => {
        expect(reason).toEqual('reject');

        done();
      });
    });

  });

  describe('Promise.threads', () => {

    test('10 promises in 3 threads', done => {
      const promiseCaller = (n) => () => new MyPromise((res, rej) => {
        setTimeout(() => {
          res(n);
        }, 100);
      });

      MyPromise.threads([
        promiseCaller(1),
        promiseCaller(2),
        promiseCaller(3),
        promiseCaller(4),
        promiseCaller(5),
        promiseCaller(6),
        promiseCaller(7),
        promiseCaller(8),
        promiseCaller(9),
        promiseCaller(10)
      ], 3).then(value => {
        expect(value).toEqual([1,2,3,4,5,6, 7, 8, 9, 10]);

        done();
      });
    });

  });
});
