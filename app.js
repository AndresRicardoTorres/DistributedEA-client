var Client = require('./Client.js');

var aClient = new Client();

aClient.requestJob();

while(!aClient.finalized){  
  aClient.processJob();
  aClient.deliverJob();    
  aClient.requestJob();
}