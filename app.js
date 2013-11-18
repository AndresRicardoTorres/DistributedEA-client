var request = require('request');
var variables = require('./variables');
//var sleep = require('sleep');
var clientDAO = require('./dao/clientDAO');

var client = new clientDAO();

var url = "http://agmp_servidor_-c9-andresricardotorres.c9.io";

var options = {
    "method": "POST",
    "url": url + variables.rutas.ASIGNAR
};

var contador = 1;
while (contador > 0) {
    request(options, function(error, response, body) {

        var obj_response = null;
        try {
            obj_response = JSON.parse(body);
        }
        catch (e) {}

        if (obj_response != 'null') {
            switch (obj_response.tipo_trabajo) {
            case variables.tipo_trabajo.CREACION:

                var tiempo_inicio = new Date();
                var resultado = client.ejecutarCreacion(obj_response.funcion_creacion, obj_response.cantidad_poblacion);
                var tiempo_final = new Date();
                
                request({'method':'POST',url: url + variables.rutas.ENTREGAR,form:{id_trabajo:obj_response.id_trabajo,resultado:resultado}});

                console.log('---INICIO CREACION---');
                console.log('cantidad : ' + resultado.length);
                console.log('tiempo (ms) : ' + (tiempo_final - tiempo_inicio));
                console.log('---FIN CREACION---');

                break;
            }
        }

    });

    contador--;
    //sleep.sleep(60)//sleep for 60 seconds
}