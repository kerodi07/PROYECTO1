
import { prepararImagen } from "./preprocesamiento.js";

// ========================================
// 1. MOTOR OCR
// ========================================

let worker = null;

// ========================================
// 2. CREAR O REUTILIZAR TESSERACT
// ========================================

async function obtenerWorker(actualizarProgreso) {

    if (!window.Tesseract) {
        throw new Error("Tesseract.js no se ha cargado correctamente.");
    }

    if (!worker) {

        worker = await window.Tesseract.createWorker("spa", 1, {

            logger: mensaje => {

                const etapas = {
                    "loading tesseract core": "Cargando motor OCR...",
                    "initializing tesseract": "Inicializando reconocimiento...",
                    "loading language traineddata": "Cargando idioma español...",
                    "initializing api": "Preparando reconocimiento...",
                    "recognizing text": "Reconociendo texto..."
                };

                const estado = etapas[mensaje.status]
                    || "Procesando fotografía...";

                const porcentaje = Math.round(
                    (mensaje.progress || 0) * 100
                );

                actualizarProgreso(porcentaje, estado);

            }

        });

    }

    return worker;
}

// ========================================
// 3. ANALIZAR FOTOGRAFÍA
// ========================================

export async function analizarImagen(
    imagen,
    actualizarProgreso = () => {}
) {

    if (!imagen) {
        throw new Error("No se recibió ninguna fotografía.");
    }

    try {

        // PREPARAR FOTOGRAFÍA
        actualizarProgreso(0, "Mejorando fotografía...");

        const imagenPreparada = await prepararImagen(imagen);

        // INICIAR OCR
        actualizarProgreso(0, "Iniciando reconocimiento OCR...");

        const motor = await obtenerWorker(actualizarProgreso);

        // RECONOCER TEXTO
        actualizarProgreso(0, "Leyendo información de la guía...");

        const resultado = await motor.recognize(imagenPreparada);

        const texto = resultado.data.text || "";

        if (!texto.trim()) {
            throw new Error("No se pudo reconocer texto en la fotografía.");
        }

        actualizarProgreso(100, "Reconocimiento completado.");

        // DEVOLVER RESULTADOS
        return {
            texto: texto.trim(),
            confianza: resultado.data.confidence,
            palabras: resultado.data.words?.length || 0
        };

    } catch (error) {

        console.error("Error durante el reconocimiento:", error);

        // Reiniciar el motor si ocurre un error
        if (worker) {

            try {
                await worker.terminate();
            } catch (errorTerminacion) {
                console.warn("Error al cerrar Tesseract:", errorTerminacion);
            }

            worker = null;
        }

        throw error;

    }

}

