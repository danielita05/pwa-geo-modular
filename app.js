const btnAdjuntar = document.getElementById('btn-adjuntar-ubicacion');
const btnConfirmar = document.getElementById('btn-confirmar-ubicacion');
const btnGuardarZona = document.getElementById('btn-guardar-zona');
const avisoUbicacion = document.getElementById('aviso-ubicacion');
const estadoUbicacion = document.getElementById('estado-ubicacion');
const resultadoUbicacion = document.getElementById('resultado-ubicacion');
const planB = document.getElementById('plan-b');
const ayudaPermiso = document.getElementById('ayuda-permiso');
const selectZona = document.getElementById('select-zona');
const etiquetaCalidad = document.getElementById('etiqueta-calidad');

// debajo de este valor (metros) se considera gps de alta precision
const UMBRAL_GPS_METROS = 30;

if ('serviceWorker' in navigator) {
    // ruta relativa por github pages
    navigator.serviceWorker.register('./sw.js')
        .then((registro) => {
            console.log('SW registrado con scope', registro.scope);
        })
        .catch((error) => {
            console.error('No se pudo registrar el SW', error);
        });
}

// cambia el texto de estado debajo del boton
function mostrarMensajeEstado(texto) {
    estadoUbicacion.textContent = texto;
}

// pinta latitud, longitud, precision y la etiqueta de calidad de senal
function renderizarResultadoUbicacion(ubicacion) {
    document.getElementById('dato-latitud').textContent = ubicacion.latitud.toFixed(6);
    document.getElementById('dato-longitud').textContent = ubicacion.longitud.toFixed(6);
    document.getElementById('dato-precision').textContent = ubicacion.precisionMetros;
    document.getElementById('dato-hora').textContent = new Date(ubicacion.timestamp).toLocaleTimeString('es-MX');

    // accuracy menor a 30 m = gps; mayor = wi-fi o ip (laptops)
    if (ubicacion.precisionMetros < UMBRAL_GPS_METROS) {
        etiquetaCalidad.textContent = 'Precisión GPS Alta';
        etiquetaCalidad.className = 'etiqueta alta';
    } else {
        etiquetaCalidad.textContent = 'Ubicación Aproximada (Wi-Fi / IP)';
        etiquetaCalidad.className = 'etiqueta aproximada';
    }

    resultadoUbicacion.hidden = false;
    planB.hidden = true;
    mostrarMensajeEstado('Ubicación adjunta al reporte');
}

// plan b: la app nunca se queda bloqueada, siempre se puede elegir zona a mano
// mostrarAyuda = true solo cuando el permiso esta bloqueado (denied)
function habilitarSelectorManualZona(mostrarAyuda) {
    planB.hidden = false;
    ayudaPermiso.hidden = !mostrarAyuda;
}

// lectura real: aqui si se llama a la api (y a su dialogo nativo si hace falta)
function leerUbicacion() {
    btnAdjuntar.disabled = true;
    mostrarMensajeEstado('Obteniendo coordenadas...');

    return obtenerUbicacionActual()
        .then((ubicacion) => {
            console.log('Paquete listo para enviar o encolar en IndexedDB:', { coordenadas: ubicacion });
            renderizarResultadoUbicacion(ubicacion);
            btnAdjuntar.disabled = false;
        })
        .catch((error) => {
            // permiso negado, timeout o sin senal: se activa el plan b
            console.warn('[Geo] Fallback activado:', error.message);
            mostrarMensajeEstado(error.message);
            resultadoUbicacion.hidden = true;
            habilitarSelectorManualZona(false);
            btnAdjuntar.disabled = false;
        });
}

// paso 1: antes de tocar la api se revisa como esta el permiso
btnAdjuntar.addEventListener('click', () => {
    consultarEstadoPermisoGeo()
        .then((estado) => {
            console.log('[Geo] Estado del permiso:', estado);

            if (estado === 'granted') {
                // ya lo habia aceptado antes: no hace falta explicar otra vez
                leerUbicacion();
            } else if (estado === 'denied') {
                // bloqueado: js ya no puede abrir el dialogo, va directo al plan b
                mostrarMensajeEstado('El permiso de ubicación está bloqueado.');
                habilitarSelectorManualZona(true);
            } else {
                // 'prompt': primero la tarjeta de pre-permiso
                avisoUbicacion.hidden = false;
            }
        });
});

// paso 2: el usuario leyo el motivo y acepta; la lectura nace de este clic (importante en iphone)
btnConfirmar.addEventListener('click', () => {
    avisoUbicacion.hidden = true;
    leerUbicacion();
});

btnGuardarZona.addEventListener('click', () => {
    if (!selectZona.value) {
        mostrarMensajeEstado('Elige una zona de la lista.');
        return;
    }
    mostrarMensajeEstado('Zona manual adjunta al reporte: ' + selectZona.value);
    console.log('Paquete listo para enviar o encolar en IndexedDB:', { zonaManual: selectZona.value });
});
