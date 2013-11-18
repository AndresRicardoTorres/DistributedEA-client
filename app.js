var request = require('request');
var varialbes = requite('variables');

var estado_global = variables.estados.LIBRE;

var options = {
	"method" : "POST",
	"url" : exports.urlbase() + action,
	"form" : object
};
request(options, this.callback);
