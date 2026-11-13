
/**
 * PREPROCESAMIENTO DE FOTOGRAFÍAS
 * Preparación de imágenes para Tesseract.js.
 */

// ========================================
// 1. CARGAR LA IMAGEN
// ========================================

function cargarImagen(archivo) {

    return new Promise((resolve, reject) => {

        const imagen = new Image();
        const url = URL.createObjectURL(archivo);

        imagen.onload = () => {
            URL.revokeObjectURL(url);
            resolve(imagen);
        };

        imagen.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("No se pudo cargar la fotografía."));
        };

        imagen.src = url;

    });

}

// ========================================
// 2. PREPARAR LA IMAGEN
// ========================================

export async function prepararImagen(archivo) {

    if (!archivo) {
        throw new Error("No se recibió ninguna imagen.");
    }

    const imagen = await cargarImagen(archivo);

    // ========================================
    // 3. CONFIGURAR EL TAMAÑO
    // ========================================

    const escala = imagen.width < 1800 ? 2 : 1;

    const canvas = document.createElement("canvas");

    canvas.width = imagen.width * escala;
    canvas.height = imagen.height * escala;

    const contexto = canvas.getContext("2d", {
        willReadFrequently: true
    });

    if (!contexto) {
        throw new Error("No se pudo preparar el procesamiento de imagen.");
    }

    // Mejorar el escalado
    contexto.imageSmoothingEnabled = true;
    contexto.imageSmoothingQuality = "high";

    contexto.drawImage(
        imagen,
        0,
        0,
        canvas.width,
        canvas.height
    );

    // ========================================
    // 4. OBTENER LOS PIXELES
    // ========================================

    const datos = contexto.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const pixeles = datos.data;

    // ========================================
    // 5. CONVERTIR A ESCALA DE GRISES
    // ========================================

    const contraste = 1.35;
    const brillo = 5;

    for (let i = 0; i < pixeles.length; i += 4) {

        const rojo = pixeles[i];
        const verde = pixeles[i + 1];
        const azul = pixeles[i + 2];

        // Conversión a escala de grises
        let gris =
            0.299 * rojo +
            0.587 * verde +
            0.114 * azul;

        // Ajustar contraste y brillo
        gris = (gris - 128) * contraste + 128 + brillo;

        // Limitar valores entre 0 y 255
        gris = Math.max(0, Math.min(255, gris));

        pixeles[i] = gris;
        pixeles[i + 1] = gris;
        pixeles[i + 2] = gris;

    }

    // ========================================
    // 6. APLICAR LOS CAMBIOS
    // ========================================

    contexto.putImageData(datos, 0, 0);

    return canvas;

}
