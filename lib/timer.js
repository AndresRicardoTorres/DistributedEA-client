function Timer() {
  this.total   = 0;
  this.initial = 0;
}

Timer.prototype.restart = function () {
  this.total   = 0;
  this.initial = new Date();
};

Timer.prototype.start = function () {
  this.initial = new Date();
};

Timer.prototype.stop = function () {
  var end     = new Date();
  this.total += end - this.initial;
};

// return the time in seconds
Timer.prototype.getTime = function () {
  return this.total / 1000;
};

module.exports = Timer;
