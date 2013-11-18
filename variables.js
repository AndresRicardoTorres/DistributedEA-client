exports.tipo_trabajo = {
    CREACION:1
};

exports.rutas = {
    ASIGNAR :'/asignar_trabajo',
    ENTREGAR :'/entregar_trabajo' 
}

exports.pruebas = {
	funcion_creacion : function() {
		var cromosoma = Array();
		for (var i = 0; i < 10; i++) {
			cromosoma[i] = Math.random();
		}
		return cromosoma;
	}
};