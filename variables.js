exports.estados = {
	LIBRE : 1
};

exports.pruebas = {
	funcion_creacion : function() {
		var cromosoma = Array();
		for (var i = 0; i < 10; i++) {
			cromosoma[i] = Math.random();
		}
		return cromosoma;
	}
};