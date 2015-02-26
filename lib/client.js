var Async          = require("async");
var Request        = require("request");
var ProcessManager = require('child_process');
var Progress       = require('progress');
var Timer          = require('./timer.js');

function requestRandomInteger(max) {
  return Math.floor(Math.random() * max);
}

function Client(ipServer, portServer) {
  this.project                 = null;
  this.progressBar             = null;
  this.estimatedTime           = 0;
  this.population              = null;
  this.fitness                 = [];
  this.oldIds                  = [];
  this.generation              = 0;
  this.sleepTime               = 0;
  this.currentGeneration       = 0;
  // Timers for report
  this.deliverTimer            = new Timer();
  this.jobTimer                = new Timer();
  this.requestTimer            = new Timer();
  this.workTimer               = new Timer();
  // Server URL
  this.urlServer = 'http://' + ipServer + ':' + portServer
}

Client.prototype.runExternal = function (idx, callback, tries) {
  var parameters = this.project.externalFunction(this.population[idx]);
  var file       = this.project.externalProgram;
  var THIS       = this;
  var MAX_TRIES  = 5;
  if (tries === undefined) {
    tries = 0;
  }

  ProcessManager.execFile(file, parameters, function (error, stdout, stderr) {
    if (error) {
      var msg = "ERROR";
      if (error.code === "ENOENT") {
        msg = "The file " + file + " does not exist";
      }
      if (error.signal === "SIGSEGV") {
        if (MAX_TRIES > tries) {
          console.log("trying ... " + tries);
          THIS.runExternal(idx, callback, tries++);
        } else {
          console.error(msg);
          console.error("parameters: ", parameters);
          console.error(error);
          callback(msg);
        }
      } else {
        console.error(msg);
        console.error("parameters: ", parameters);
        console.error(error);
        callback(msg);
      }
    } else if (stderr) {
      console.error("ERROR stderr ", stderr);
      console.error("parameters: ", parameters);
    } else {
      if (tries > 0) {
        console.log("fixed :)");
      }
      var fitness = parseInt(stdout, 10);
      THIS.fitness[idx] = fitness;
      callback(null, fitness);
    }
  });
};

//A greater value is a greater fitness
Client.prototype.calculateFitness = function (idx, callback) {
  this.progressBar.tick();
  if (this.project.externalProgram === "") {
    this.fitness[idx] = this.project.fitnessFunction(this.population[idx]);
    callback(null, this.fitness[idx]);
  } else {
    this.runExternal(idx, callback);
  }
};

function randomizeArray(array) {
  var i      = 0;
  var tmp    = 0;
  var pos1   = 0;
  var pos2   = 0;
  for (i = 0; i < array.length; i++) {
    pos1        = Math.floor(Math.random() * array.length);
    pos2        = Math.floor(Math.random() * array.length);
    tmp         = array[pos1];
    array[pos1] = array[pos2];
    array[pos2] = tmp;
  }
  return array;
}

Client.prototype.select = function (callback) {
  var THIS      = this;
  var selection = [];
  var ticks     = [];
  var i         = 0;

  /// Select all match pairs
  for (i = 0; i < this.population.length; i += 2) {
    ticks.push([i, i + 1]);
  }

  Async.eachSeries(ticks, function (idx, callback) {
    var idx1 = idx[0];
    var idx2 = idx[1];

    Async.parallel({
      first : function (callback) {
        THIS.calculateFitness(idx1, callback);
      },
      second : function (callback) {
        THIS.calculateFitness(idx2, callback);
      }
    }, function (err, results) {
      if (err) {
        console.error(err);
      }
      if (results.first < results.second) {
        selection.push(THIS.population[idx1]);
      } else {
        selection.push(THIS.population[idx2]);
      }
      callback();
    });

  }, function (error) {
    if (error) {
      console.error(error);
    }
    callback(selection);
  });
};

Client.prototype.crossMattingPool = function (selection, populationSize) {
  var i             = 0;
  var idx1          = 0;
  var idx2          = 0;
  var newChromosome = [];
  for (i = selection.length; i < populationSize; i++) {
    idx1 = requestRandomInteger(selection.length);
    idx2 = requestRandomInteger(selection.length);

    newChromosome = this.project.crossoverFunction(selection[idx1],
                                                   selection[idx2]);
    selection.push(newChromosome);
  }
  return selection;
};

Client.prototype.mutatePopulation = function (amountMutation, populationSize) {
  var idx = 0;
  var i   = 0;
  for (i = 0; i < amountMutation; i++) {
    idx = requestRandomInteger(populationSize);
    this.population[idx] = this.project.mutationFunction(this.population[idx]);
  }
};

Client.prototype.processJob = function (callback) {
  var THIS           = this;
  var populationSize = this.population.length;
  var amountMutation = populationSize * this.project.mutationPercent;
  this.fitness       = [];
  this.jobTimer.restart();

  this.select(function (selection) {
    //Crossover
    selection = THIS.crossMattingPool(selection, populationSize);
    //The new chromosomes replaces all the old population

    THIS.population = selection;

    //Mutation
    THIS.mutatePopulation(amountMutation, populationSize);
    THIS.jobTimer.stop();
    callback();
  });

};

Client.prototype.printReport = function () {
  var workTime                = this.workTimer.getTime();
  var comunicationTimeRequest = this.requestTimer.getTime();
  var comunicationTimeDeliver = this.deliverTimer.getTime();

  console.info("===REPORT===");
  console.info("workTime: ", workTime, " s");
  console.info("waiting for a job: ", comunicationTimeRequest, " s");
  console.info("waiting for deliver a job: ", comunicationTimeDeliver, " s");
  console.info("sleepTime: ", this.sleepTime, " s");
};

Client.prototype.deliverJob = function () {
  var c, i = 0;
  var THIS = this;
  var requestOptions = {
    url: this.urlServer,
    form: {
      action         : 'deliver',
      generation     : this.generation,
      newChromosomes : JSON.stringify(this.population),
      estimatedTime  : this.estimatedTime,
      realTime       : this.jobTimer.getTime(),
      fitness        : JSON.stringify(this.fitness),
      oldIds         : JSON.stringify(this.oldIds)
    }
  };

  c = 0;
  for (i = 0; i < this.fitness.length; i++) {
    if (this.fitness[i] === null) {
      c++;
    }
  }
  if (c !== 0) {
    console.log("Client has sent " + c + " nulls");
    console.log("this.fitness.length" + this.fitness.length);
    console.log("this.oldIds.length" + this.oldIds.length);
  }

  this.workTimer.stop();
  this.deliverTimer.start();

  Request.post(requestOptions, function (error, response, body) {
    if (error) {
      console.error(error);
    }
    THIS.deliverTimer.stop();
    var objBody = JSON.parse(body);
    if (response.statusCode === 200 && objBody.ok === true) {
      THIS.requestJob();
    }
  });
};

///returns aJob
Client.prototype.requestJob = function () {
  var THIS = this;
  var requestOptions = { url  : this.urlServer,
                         form : { action          : 'request',
                                  assignedProject : this.project !== null
                                }
                       };

  THIS.requestTimer.start();

  Request.post(requestOptions, function (error, response, body) {
    if (error) {
      console.error("ERROR! " + error);
      return;
    }

    if (response.statusCode !== 200) {
      console.error(response)
      console.error("ERROR! statusCode !== 200");
      return;
    }

    THIS.requestTimer.stop();
    THIS.workTimer.start();
    var objBody = JSON.parse(body);
    var sleepTime = 10 * 1000;
    if (objBody.finalized === undefined) {

      if (objBody.sleep === undefined) {
         if (THIS.project === null) {
          THIS.project = objBody.assignedProject;
          eval('THIS.project.externalFunction = ' +
                THIS.project.externalFunctionString);
          eval('THIS.project.fitnessFunction = ' +
                THIS.project.fitnessFunctionString);
          eval('THIS.project.crossoverFunction = ' +
                THIS.project.crossoverFunctionString);
          eval('THIS.project.mutationFunction = ' +
                THIS.project.mutationFunctionString);
        }

        THIS.estimatedTime = objBody.estimatedTime;
        THIS.population    = objBody.subPopulation;
        THIS.generation    = objBody.generation + 1;
        THIS.oldIds        = objBody.oldIds;

        if (THIS.currentGeneration !== THIS.generation) {
          THIS.currentGeneration = THIS.generation;
        }

        THIS.progressBar = new Progress("[:bar] :percent , :eta s " +
              ", :current population of :total",
            { total: THIS.population.length });

        THIS.processJob(function () {
          THIS.deliverJob();
        });

      } else {
        if (THIS.project != undefined && THIS.project.sleepTime != undefined)
            sleepTime = THIS.project.sleepTime;
        THIS.sleepTime += sleepTime;
        setTimeout(function() {THIS.requestJob();}, sleepTime);
      }
    } else {
      THIS.printReport();
    }

  });
};

module.exports = Client;

/// TODO : Check if call to problem functions return correct values
