var request = require("request");

//var variables = require("./variables");

function Client(){
  
  this.project = null;
  this.estimatedTime = null;
  this.finished = false;
  this.population = null;
  
  this.requestRandomInteger = function(max){
    return Math.floor(Math.random()*max);
  }
  
  ///returns aJob
  this.requestJob() = function(){ 
    var requestOptions = {
      url: "http://localhost/",
      form: {action:'request',
	     assignedProject : this.project != null
      }      
    };
    
    request.post(requestOptions,function(error, response, body){
      if (!error && response.statusCode == 200) {
	var objResponse = JSON.parse(body);
	
	if(typeof objResponse.finalized === 'undefined'){
	  if(this.project === null){
	    this.project = objResponse.assignedProject;
	  }
	  this.estimatedTime = objResponse.estimatedTime;
	  this.population = objResponse.subPopulation;
	  this.generation = objResponse.generation + 1;
	}
	else{
	  this.finalized = true;
	}	 
      }
    });    
  };
  
  this.deliverJob = function(){
    var requestOptions = {
      url: "http://localhost/",
      form: {action : 'deliver',
	     generation : this.generation,
	     newChromosomes : this.population,
	     estimatedTime : this.estimatedTime,
	     realTime : this.realTime
      }      
    };
    request.post(requestOptions);
  };
  
  this.processJob = function(){
    this.realTime=new Date();
    var populationSize=this.population.length
    var mattingPoolSize=populationSize*this.project.mattingPoolPercent;
    var amountMutation=populationSize*this.project.mutationPercent;
    
    //Selection
    var selection = this.select(populationSize,mattingPoolSize);
    //Crossover
    selection = this.crossMattingPool(selection,populationSize,mattingPoolSize);
    //The new chromosomes replaces all the old population
    this.population=selection
    //Mutation
    this.mutatePopulation(amountMutation, populationSize);
    this.realTime=new Date() - this.realTime
  };
  
  this.select = function(populationSize,mattingPoolSize){
    selection=new Array();
    
    for(var i=0; i<mattingPoolSize; i++){
      var idx1=this.requestRandomInteger(populationSize);
      var idx2=this.requestRandomInteger(populationSize);
      
      if(this.calculateFitness(idx1) > this.calculateFitness(idx2)){
	selection.push(this.population[idx1]);
      }
      else{
	selection.push(this.population[idx2])
      }
    }
    return selection;
  };
  
  //////////////////Chromosomes must have fitness key once calculated
  //////////////////fitnessFunction must be executable and have the same parameters
  this.calculateFitness = function(idx){
    if (typeof this.population[idx].fitness != 'undefined'){
      this.population[idx].fitness=this.project.fitnessFunction(population[idx]);
    }
    return this.population[idx].fitness;
  };
  
  //////////////////crossoverFunction must be executable and have the same parameters
  this.crossMattingPool = function(selection,populationSize,mattingPoolSize){
    for(var i = mattingPoolSize; i < populationSize; i++){
      var idx1=this.requestRandomInteger(mattingPoolSize);
      var idx2=this.requestRandomInteger(mattingPoolSize);
      
      newChromosome = this.project.crossoverFunction(selection[idx1],selection[idx2]);
      selection.push(newChromosome);
    }
    return selection;
  };
  
  this.mutatePopulation = function(amountMutation, populationSize){
    for(var i = 0; i < amountMutation; i++){
      var idx=this.requestRandomInteger(populationSize);
      this.population[idx]= this.project.mutationFunction(this.population[idx]);
    }
  };
}

