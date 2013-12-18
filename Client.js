var request = require("request");
var configuration = require("./configuration.js");

Client = function(){
  
  var project = null;
  var estimatedTime = null;
  var finished = false;
  var population = null;
  var realTime = null;
  var objThis=this;
  var fitness=[];
  
  function requestRandomInteger(max){
    return Math.floor(Math.random()*max);
  }
  
  ///returns aJob
  this.requestJob = function(){ 
    console.log("requestJob");
    var requestOptions = {
      url: configuration.urlServer,
      form: {action:'request',
	     assignedProject : project != null
      }      
    };
    
    request.post(requestOptions,function(error, response, body){
      if(error){
	console.log("ERROR! "+error);	
      }else{      
	console.log(response.statusCode);
	if (!error && response.statusCode == 200) {
	  
	  var objResponse = JSON.parse(body);
	  
	  if(typeof objResponse.finalized === 'undefined'){
	    if(project === null){
	      project = objResponse.assignedProject;
	      eval('project.fitnessFunction = '+project.fitnessFunctionString);
	      eval('project.crossoverFunction = '+project.crossoverFunctionString);
	      eval('project.mutationFunction = '+project.mutationFunctionString);
	    }
	    estimatedTime = objResponse.estimatedTime;
	    population = objResponse.subPopulation;
	    generation = objResponse.generation + 1;
	    processJob();
	    deliverJob();
	    console.log(generation);
	    
  // 	  console.log(project.fitnessFunctionString);
  // 	  console.log(population[0]);
  // 	  console.log(project.fitnessFunction(population[0]));
	  }
	  else{
	    finalized = true;
	  }	 
	}
      }
    });    
  };
  
  function processJob(){
    realTime=new Date();
    fitness=[]
    var populationSize=population.length
    var mattingPoolSize=populationSize*project.mattingPoolPercent;
    var amountMutation=populationSize*project.mutationPercent;
    
    console.log(amountMutation,'mutados');
    
    console.log(populationSize, 'llegan')
    
    //Selection
    var selection = select(populationSize,mattingPoolSize);
    console.log(selection.length,'selectionSize');
    //Crossover
    selection = crossMattingPool(selection,populationSize,mattingPoolSize);
    //The new chromosomes replaces all the old population
    population=selection
    //Mutation
    mutatePopulation(amountMutation, populationSize);
    realTime=new Date() - realTime
    
    console.log(population.length, 'salen')
  };
  
  function select(populationSize,mattingPoolSize){
    selection=new Array();
    
    for(var i=0; i<mattingPoolSize; i++){
      var idx1=requestRandomInteger(populationSize);
      var idx2=requestRandomInteger(populationSize);
      
      if(calculateFitness(idx1) > calculateFitness(idx2)){
	selection.push(population[idx1]);
      }
      else{
	selection.push(population[idx2])
      }
    }
    return selection;
  };
  
  //////////////////Chromosomes must have fitness key once calculated
  //////////////////fitnessFunction must be executable and have the same parameters
  function calculateFitness(idx){
    return project.fitnessFunction(population[idx]);
//     if (typeof fitness[idx] === 'undefined' || fitness[idx] === null){
      fitness[idx]=project.fitnessFunction(population[idx]);
//     }
    return fitness[idx];
  };
  
  //////////////////crossoverFunction must be executable and have the same parameters
  function crossMattingPool(selection,populationSize,mattingPoolSize){
    for(var i = mattingPoolSize; i < populationSize; i++){
      var idx1=requestRandomInteger(mattingPoolSize);
      var idx2=requestRandomInteger(mattingPoolSize);
      
      newChromosome = project.crossoverFunction(selection[idx1],selection[idx2]);
      selection.push(newChromosome);
    }
    return selection;
  };
  
  function mutatePopulation(amountMutation, populationSize){
    for(var i = 0; i < amountMutation; i++){
      var idx=requestRandomInteger(populationSize);
      population[idx]= project.mutationFunction(population[idx]);
    }
  };
  
  function deliverJob(){
    var lastFitness = [];
    fitness=[];
//     if(generation > project.generationLimit){      
    if(true){
      for(var i = 0 ; i < population.length ; i++){
	lastFitness[i]=calculateFitness(i);
      }      
    }
    
    for(var i = 0 ; i < population.length ; i++){
      console.log(i+1,' ',population[i],' ',lastFitness[i]);
    }
    
    var requestOptions = {
      url: configuration.urlServer,
      form: {action : 'deliver',
	     generation : generation,
	     newChromosomes : JSON.stringify(population),
	     estimatedTime : estimatedTime,
	     realTime : realTime,
	     fitness : JSON.stringify(fitness),
	     lastFitness: JSON.stringify(lastFitness),
      }      
    };
    
    request.post(requestOptions, function(error, response, body){
	  objThis.requestJob();
    });
  };
}

module.exports=Client;

