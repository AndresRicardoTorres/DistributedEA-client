var request = require("request");
var configuration = require("./configuration.js");

Client = function(){
  
  var project = null;
  var estimatedTime = null;
  var population = null;
  var realTime = null;
  var objThis=this;
  var fitness=[];
  var oldIds=[];
  var comunicationTimeDeliver=0;
  var comunicationTimeRequest=0;
  var workTime=0;
  var sleepTime=0;
  //The work time is taken in two different functions.
  var workTimeIni=0;
  var workTimeEnd=0;
  
  function requestRandomInteger(max){
    return Math.floor(Math.random()*max);
  }
  
  ///returns aJob
  this.requestJob = function(){
    var requestOptions = {
      url: configuration.urlServer,
      form: {
        action:'request',
        assignedProject : project != null
      }      
    };
    
    var comunicationTimeIni=new Date();
    request.post(requestOptions,function(error, response, body){
      var comunicationTimeEnd=new Date();
      comunicationTimeRequest+=comunicationTimeEnd-comunicationTimeIni;
      workTimeIni=new Date();
      
      if(error){
	       console.log("ERROR! "+error);	
      }else{
          var objResponse = JSON.parse(body);

          if(typeof objResponse.finalized === 'undefined'){
            if(project === null){
              project = objResponse.assignedProject;
              eval('project.fitnessFunction = '+project.fitnessFunctionString);
              eval('project.crossoverFunction = '+project.crossoverFunctionString);
              eval('project.mutationFunction = '+project.mutationFunctionString);
            }
            if(typeof objResponse.sleep === 'undefined'){
              estimatedTime = objResponse.estimatedTime;
              population = objResponse.subPopulation;
              generation = objResponse.generation + 1;
              oldIds = objResponse.oldIds;
              processJob();
              deliverJob();
            }
            else{
              sleepTime+=project.sleepTime;
              setTimeout(requestJob,project.sleepTime);
            }
          }
          else{
            printReport();
          }
      }
    });    
  };

  function printReport(){
    console.log("workTime: ",workTime/1000);
    console.log("waiting for a job: ",comunicationTimeRequest/1000);
    console.log("waiting for deliver a job: ",comunicationTimeDeliver/1000);
    console.log("sleepTime: ",sleepTime/1000);
  }
  
  function processJob(){
    realTime=new Date();
    fitness=[]
    var populationSize=population.length
    var amountMutation=populationSize*project.mutationPercent;
    
    //Selection
    var selection = select(populationSize);

    //Crossover
    selection = crossMattingPool(selection,populationSize);
    //The new chromosomes replaces all the old population
    population=selection
    
    //Mutation
    mutatePopulation(amountMutation, populationSize);
    realTime=new Date() - realTime;
  };
  
  function select(populationSize){
    selection=new Array();
    
    for(var i=0; i<populationSize; i+=2){
      var idx1=i;
      var idx2=i+1;

			if (idx2 == populationSize){
				idx2=0;
			}
      
      if(calculateFitness(idx1) > calculateFitness(idx2)){
        selection.push(population[idx1]);
      }
      else{
        selection.push(population[idx2])
      }
    }
    return selection;
  };
  
  //A greater value is a greater fitness
  function calculateFitness(idx){
    fitness[idx]= project.fitnessFunction(population[idx]);
    return fitness[idx];
  };
  
  function crossMattingPool(selection,populationSize){
    for(var i = selection.length; i < populationSize; i++){
      var idx1=requestRandomInteger(selection.length);
      var idx2=requestRandomInteger(selection.length);
      
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
        
    var requestOptions = {
      url: configuration.urlServer,
      form: {
        action : 'deliver',
        generation : generation,
        newChromosomes : JSON.stringify(population),
        estimatedTime : estimatedTime,
        realTime : realTime,
        fitness : JSON.stringify(fitness),
        oldIds : JSON.stringify(oldIds)
      }      
    };
    
    workTimeEnd=new Date();
    workTime+=workTimeEnd-workTimeIni;
    
    var comunicationTimeIni=new Date();
    request.post(requestOptions, function(error, response, body){
      var comunicationTimeEnd=new Date();
      comunicationTimeDeliver+=comunicationTimeEnd-comunicationTimeIni;
      
      objThis.requestJob();
    });
  };
}

module.exports=Client;
