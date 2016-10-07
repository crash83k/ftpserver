import when from 'when';

export default class Queue {
  constructor() {
    this._q = [];
    this._running = false;
  }

  _run() {
    if (!this._q.length) return;
    let {fn, data, defer} = this._q.shift();
    defer.promise = when.try(fn, data);
  }

  enqueue(fn, data) {
    const defer = when.defer();
    this._q.push({fn, data, defer});
    if (!this._running) {
      this._run();
    }
    return defer.promise;
  }
}
