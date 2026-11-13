
document.addEventListener("DOMContentLoaded", () => {

    // ========================================
    // 1. ELEMENTOS DEL HTML
    // ========================================

    const fotoInput = document.getElementById("foto");
    const preview = document.getElementById("preview");
    const contenedorPreview = document.getElementById("contenedor-preview");

    const btnAnalizar = document.getElementById("btn-analizar");
    const btnLimpiar = document.getElementById("btn-limpiar");
    const btnQuitarFoto = document.getElementById("btn-quitar-foto");
    const btnCopiarTodos = document.getElementById("btn-copiar-todos");

    const estado = document.getElementById("estado");
    // Elementos del resultado OCR
    const resultadoOCR = document.getElementById("resultado-ocr");
    const textoOCR = document.getElementById("texto-ocr");

    const progresoContainer = document.getElementById("progreso-container");
    const barraProgreso = document.getElementById("barra-progreso");
    const textoProgreso = document.getElementById("texto-progreso");

    // ========================================
    // 2. CAMPOS DE INFORMACIÓN
    // ========================================

    const campos = [
        "chofer",
        "transporte",
        "placa",
        "tienda",
        "fecha",
        "guia",
        "transferencia",
        "pallet_ean",
        "pallet_simple",
        "pallet_chep",
        "europallet",
        "roll_1",
        "roll_2",
        "jabas_negras",
        "bine",
        "cooler",
        "coche"
    ];

    // ========================================
    // 3. VARIABLES
    // ========================================

    let archivoSeleccionado = null;
    let urlImagen = null;
    let procesando = false;

    const MAX_TAMANO = 10 * 1024 * 1024;

    const formatosPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    // ========================================
    // 4. MENSAJES DE ESTADO
    // ========================================

    function mostrarEstado(mensaje, tipo = "normal") {

        estado.textContent = mensaje;

        const colores = {
            normal: {
                fondo: "#E8F5EC",
                texto: "#006B32"
            },
            error: {
                fondo: "#FCEAEA",
                texto: "#B42318"
            },
            exito: {
                fondo: "#E8F5EC",
                texto: "#006B32"
            },
            advertencia: {
                fondo: "#FFF4DB",
                texto: "#946200"
            }
        };

        const color = colores[tipo] || colores.normal;

        estado.style.backgroundColor = color.fondo;
        estado.style.color = color.texto;
    }

    // ========================================
    // 5. LIMPIAR VISTA PREVIA
    // ========================================

    function quitarFotografia() {

        if (urlImagen) {
            URL.revokeObjectURL(urlImagen);
            urlImagen = null;
        }

        archivoSeleccionado = null;

        fotoInput.value = "";
        preview.src = "";

        contenedorPreview.hidden = true;
        btnAnalizar.disabled = true;

        mostrarEstado("Esperando una fotografía...");
    }

    // ========================================
    // 6. SELECCIONAR FOTOGRAFÍA
    // ========================================

    fotoInput.addEventListener("change", () => {

        const archivo = fotoInput.files[0];

        if (!archivo) {
            return;
        }

        // Comprobar formato
        if (!formatosPermitidos.includes(archivo.type)) {

            quitarFotografia();

            mostrarEstado(
                "Formato no válido. Selecciona JPG, PNG o WEBP.",
                "error"
            );

            return;
        }

        // Comprobar tamaño
        if (archivo.size > MAX_TAMANO) {

            quitarFotografia();

            mostrarEstado(
                "La fotografía supera el límite de 10 MB.",
                "error"
            );

            return;
        }

        if (archivo.size === 0) {

            quitarFotografia();

            mostrarEstado(
                "El archivo seleccionado está vacío.",
                "error"
            );

            return;
        }

        // Guardar archivo
        archivoSeleccionado = archivo;

        // Liberar vista previa anterior
        if (urlImagen) {
            URL.revokeObjectURL(urlImagen);
        }

        // Crear vista previa
        urlImagen = URL.createObjectURL(archivo);

        preview.src = urlImagen;

        contenedorPreview.hidden = false;
        btnAnalizar.disabled = false;

        mostrarEstado(
            "Fotografía cargada correctamente.",
            "exito"
        );

    });

    // ========================================
    // 7. QUITAR FOTOGRAFÍA
    // ========================================

    btnQuitarFoto.addEventListener("click", () => {

        if (procesando) return;

        quitarFotografia();

    });

    // ========================================
    // 8. LIMPIAR CAMPOS
    // ========================================

    function limpiarCampos() {

        campos.forEach(id => {

            const campo = document.getElementById(id);

            if (campo) {
                campo.value = "";
            }

        });

        textoOCR.value = "";
        resultadoOCR.hidden = true;

    }

    // ========================================
    // 9. BOTÓN LIMPIAR
    // ========================================

    btnLimpiar.addEventListener("click", () => {

        if (procesando) return;

        quitarFotografia();
        limpiarCampos();

        progresoContainer.hidden = true;
        barraProgreso.style.width = "0%";

        mostrarEstado(
            "Se limpiaron los datos correctamente.",
            "exito"
        );

    });

    // ========================================
    // 10. COPIAR UN DATO INDIVIDUAL
    // ========================================

    async function copiarTexto(texto) {

        if (!texto.trim()) {

            mostrarEstado(
                "No hay información para copiar.",
                "advertencia"
            );

            return false;
        }

        try {

            if (navigator.clipboard && window.isSecureContext) {

                await navigator.clipboard.writeText(texto);

            } else {

                const auxiliar = document.createElement("textarea");

                auxiliar.value = texto;
                auxiliar.style.position = "fixed";
                auxiliar.style.opacity = "0";

                document.body.appendChild(auxiliar);

                auxiliar.select();

                const copiado = document.execCommand("copy");

                auxiliar.remove();

                if (!copiado) {
                    throw new Error("No se pudo copiar el texto.");
                }

            }

            return true;

        } catch (error) {

            console.error("Error al copiar:", error);

            mostrarEstado(
                "No se pudo copiar. Revisa los permisos del navegador.",
                "error"
            );

            return false;
        }
    }

    // ========================================
    // 11. BOTONES DE COPIAR INDIVIDUALMENTE
    // ========================================

    document.querySelectorAll(".boton-copiar").forEach(boton => {

        boton.addEventListener("click", async () => {

            const id = boton.dataset.copiar;
            const campo = document.getElementById(id);

            if (!campo) return;

            const resultado = await copiarTexto(campo.value);

            if (resultado) {

                mostrarEstado(
                    `Dato "${campo.previousElementSibling?.textContent || id}" copiado.`,
                    "exito"
                );

            }

        });

    });

    // ========================================
    // 12. COPIAR TODOS LOS DATOS
    // ========================================

    btnCopiarTodos.addEventListener("click", async () => {

        const valores = campos.map(id => {

            const campo = document.getElementById(id);

            return campo ? campo.value.trim() : "";

        });

        if (valores.every(valor => valor === "")) {

            mostrarEstado(
                "No hay datos para copiar.",
                "advertencia"
            );

            return;
        }

        // Separación por tabulaciones
        const resultado = valores.join("\t");

        const copiado = await copiarTexto(resultado);

        if (copiado) {

            mostrarEstado(
                "Todos los datos fueron copiados correctamente.",
                "exito"
            );

        }

    });

    // ========================================
    // 13. CONTROL DE PROGRESO
    // ========================================

    function actualizarProgreso(porcentaje, mensaje) {

        const valor = Math.min(100, Math.max(0, porcentaje));

        barraProgreso.style.width = `${valor}%`;

        textoProgreso.textContent = mensaje;

    }

    // ========================================
    // 14. ANALIZAR FOTOGRAFÍA
    // ========================================

    btnAnalizar.addEventListener("click", async () => {

        if (procesando) return;

        if (!archivoSeleccionado) {

            mostrarEstado(
                "Primero debes seleccionar una fotografía.",
                "advertencia"
            );

            return;
        }

        procesando = true;

        btnAnalizar.disabled = true;
        btnLimpiar.disabled = true;
        btnQuitarFoto.disabled = true;

        progresoContainer.hidden = false;

        actualizarProgreso(0, "Preparando fotografía...");

        mostrarEstado(
            "El reconocimiento OCR se integrará en el siguiente paso."
        );

        try {

            
// El módulo OCR
const modulo = await import("./ocr.js");

if (typeof modulo.analizarImagen !== "function") {
    throw new Error("La función analizarImagen todavía no está implementada.");
}

const resultado = await modulo.analizarImagen(
    archivoSeleccionado,
    actualizarProgreso
);

// Mostrar resultado OCR
console.log("Resultado OCR:", resultado);
const moduloReconocimiento = await import("./reconocimiento.js");

const identificacion = moduloReconocimiento.detectarFormato(resultado.texto);

console.log("Formato detectado:", identificacion.formato);
console.log("Número de guía:", identificacion.numeroGuia);




// Importar el extractor
const moduloExtractor = await import("./extractor.js");

const respuestaTransportistas = await fetch("./data/transportistas.json");

if (!respuestaTransportistas.ok) {
    throw new Error("No se pudo cargar transportistas.json");
}

const transportistas = await respuestaTransportistas.json();

// Extraer los datos según el formato detectado
const datos = moduloExtractor.extraerDatos(
    resultado.texto,
    identificacion.formato,
    transportistas
);
console.log("Datos extraídos:", datos);

// Colocar los resultados en los campos HTML
Object.entries(datos).forEach(([id, valor]) => {
    const campo = document.getElementById(id);

    if (campo && valor !== "") {
        campo.value = valor;
    }
});

// Asegurar que se coloque el número de guía detectado
if (identificacion.numeroGuia) {
    document.getElementById("guia").value = identificacion.numeroGuia;
}


textoOCR.value = resultado.texto;
resultadoOCR.hidden = false;

// Mostrar confianza
mostrarEstado(
    `Reconocimiento terminado. Confianza general: ${resultado.confianza.toFixed(1)}%.`,
    "exito"
);

actualizarProgreso(100, "Reconocimiento completado.");

} catch (error) {

    console.error("Error durante el análisis:", error);

    mostrarEstado(
        error.message || "Ocurrió un error durante el reconocimiento.",
        "error"
    );

} finally {

    procesando = false;

    btnAnalizar.disabled = !archivoSeleccionado;
    btnLimpiar.disabled = false;
    btnQuitarFoto.disabled = false;

}


    });

    // ========================================
    // 15. INICIALIZACIÓN
    // ========================================

    btnAnalizar.disabled = true;

    console.log("Asistente de Guías Tottus iniciado correctamente.");

});