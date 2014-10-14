var Timer = require('../lib/timer.js');

exports.simpleTime = function (test) {

  'use strict';
  var testTime = 1000,
    aTimer     = new Timer();

  aTimer.start();

  setTimeout(function () {
    aTimer.stop();
    var totalTime = parseInt(aTimer.getTime() / 1000, 10);
    test.equal(testTime / 1000, totalTime);
    test.done();
  }, testTime);
};

exports.twiceTime = function (test) {

  'use strict';
  var testTime1 = 1000,
    testTime2   = 2000,
    aTimer      = new Timer(),
    testTime    = testTime1 + testTime2;

  aTimer.start();

  setTimeout(function () {
    aTimer.stop();
    aTimer.start();

    setTimeout(function () {
      aTimer.stop();
      var totalTime = parseInt(aTimer.getTime() / 1000, 10);
      test.equal(testTime / 1000, totalTime);
    }, testTime2);

    test.done();
  }, testTime1);
};
