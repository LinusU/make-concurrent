module.exports = function generator (Promise) {
  return function makeConcurrent (fn, opts) {
    var concurrency = 1
    if (opts &&
        Object.prototype.toString.call(opts.concurrency) === '[object Number]' &&
        opts.concurrency >= 0) {
      concurrency = opts.concurrency
    }

    var queue = []
    var launched = 0

    function queuePulse () {
      if ((concurrency === 0 || launched < concurrency) &&
          (queue.length > 0 && queue.length > launched)) {
        queue[launched]()
        launched += 1
      }
    }

    return function () {
      var ctx = this
      var args = Array.prototype.slice.call(arguments)

      function onFinished () {
        launched -= 1
        queue.splice(queue.indexOf(currentResolve), 1)
        queuePulse()
      }

      var currentResolve
      return new Promise(function (resolve) {
        currentResolve = resolve
        queue.push(currentResolve)
        queuePulse()
      })
      .then(function () {
        return fn.apply(ctx, args)
      })
      .then(function (value) {
        onFinished()
        return value
      }, function (reason) {
        onFinished()
        throw reason
      })
    }
  }
}