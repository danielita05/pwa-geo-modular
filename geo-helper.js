// geo-helper.js: modulo reutilizable de geolocalizacion
// la api nativa trabaja con callbacks (exito/error), aqui se envuelve en promesas
// para que cualquier funcion de app.js la use con obtenerUbicacionActual().then(...)

// convierte el codigo numerico del error nativo (1, 2, 3) en un mensaje claro
function traducirErrorGeolocalizacion(error) {
    switch (error.code) {
        case 1: // error.PERMISSION_DENIED
            return 'Permiso de ubicación denegado. Puedes ingresar tu zona manualmente.';
        case 2: // error.POSITION_UNAVAILABLE
            return 'No fue posible determinar tu ubicación (señal GPS o Wi-Fi no disponible).';
        case 3: // error.TIMEOUT
            return 'Se agotó el tiempo de espera intentando obtener las coordenadas.';
        default:
            return 'Ocurrió un error inesperado al consultar la ubicación.';
    }
}

// lectura unica de la posicion; regresa siempre el mismo objeto normalizado
function obtenerUbicacionActual(opcionesPersonalizadas) {
    // valores por defecto que se pueden sobreescribir desde quien la llama
    const opciones = Object.assign(
        {
            enableHighAccuracy: true, // pide el gps si existe
            timeout: 8000,            // ms maximos antes del error TIMEOUT (3)
            maximumAge: 30000         // acepta una lectura de hasta 30 s de antiguedad
        },
        opcionesPersonalizadas
    );

    return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
            reject(new Error('Este navegador no soporta la API de Geolocalización.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (posicion) => {
                resolve({
                    latitud: posicion.coords.latitude,
                    longitud: posicion.coords.longitude,
                    // accuracy = margen de error en metros
                    precisionMetros: Math.round(posicion.coords.accuracy),
                    timestamp: posicion.timestamp
                });
            },
            (error) => {
                reject(new Error(traducirErrorGeolocalizacion(error)));
            },
            opciones
        );
    });
}

// pregunta si el permiso ya estaba dado sin abrir el dialogo: 'granted', 'denied' o 'prompt'
function consultarEstadoPermisoGeo() {
    // navegadores sin permissions api: se asume que hay que preguntar
    if (!('permissions' in navigator)) {
        return Promise.resolve('prompt');
    }

    return navigator.permissions.query({ name: 'geolocation' })
        .then((resultado) => resultado.state)
        .catch(() => 'prompt');
}
