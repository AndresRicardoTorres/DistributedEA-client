var vows = require('vows');
var assert = require('assert');
var clientDAO = require('../dao/clientDAO');
var variables = require('../variables');

var suite = vows.describe('task');

suite.addBatch({
	"creacion clienteDAO" : {
		topic : function() {
			var client = new clientDAO();
			return client;
		},
		"debe ser un objecto" : function(topic) {
			assert.isObject(topic);
		},
		"debe tener la function ejecutarCreacion" : function(topic) {
			assert.isFunction(topic.ejecutarCreacion);
		}
	}
});

suite.addBatch({
	"pruebas de creacion" : {
		topic : function() {
			var client = new clientDAO();
			return client.ejecutarCreacion(variables.pruebas.funcion_creacion, 10);
		},
		"debe ser un arreglo" : function(topic) {
			assert.isArray(topic);
			assert.equal(topic.length, 10);
		}
	}
});

//suite.run();
suite.export(module); 