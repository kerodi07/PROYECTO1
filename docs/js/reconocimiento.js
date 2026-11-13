
function normalizarTexto(texto) {
    return texto
        .toUpperCase()
        .replace(/\s+/g, " ")
        .trim();
}

export function detectarFormato(texto) {
    const contenido = normalizarTexto(texto);

    // Busca números de guía que comiencen con T003 o EG07.
    const patron = /\b(T[O0]{2}3|E[G6][O0]7)\s*[-–]?\s*(\d{5,12})\b/i;

    const coincidencia = contenido.match(patron);

    if (!coincidencia) {
        return {
            formato: "DESCONOCIDO",
            numeroGuia: ""
        };
    }

    const prefijoOCR = coincidencia[1].toUpperCase();
    const correlativo = coincidencia[2];

    // Corregimos posibles errores de lectura del prefijo.
    let formato;

    if (prefijoOCR.startsWith("T")) {
        formato = "T003";
    } else {
        formato = "EG07";
    }

    return {
        formato: formato,
        numeroGuia: `${formato}-${correlativo}`
    };
}
