var variables = require("../variables");
/* The DAO must be constructed with a connected database object */
function clientDAO() {
	/* If this constructor is called without the "new" operator, "this" points
	 * to the global object. Log a warning and call it correctly. */
	if (false === (this instanceof clientDAO)) {
		console.log('Warning: ProjectsDAO constructor called without "new" operator');
		return new clientDAO();
	}

	this.ejecutarCreacion = function(function_creacion, cantidad_creacion) {
		var resultados = Array();

		if ( typeof function_creacion != 'function')
			return resultados;

		for (var i = 0; i < cantidad_creacion; i++) {
			resultados[i] = function_creacion();
		};
		return resultados;
	};
}

module.exports = clientDAO; 