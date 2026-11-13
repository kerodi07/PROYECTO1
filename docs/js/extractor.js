
// ========================================
// EXTRACTOR DE DATOS DE GUIAS TOTTUS
// Formatos: T003 y EG07
// ========================================

function normalizar(texto) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/\s+/g, " ")
        .trim();
}

function obtenerLineas(texto) {
    return texto
        .split(/\r?\n/)
        .map(linea => linea.trim())
        .filter(linea => linea.length > 0);
}

// Busca un valor en una linea o en las siguientes.
function buscarCerca(lineas, etiquetas, expresion, saltos = 2) {
    for (let i = 0; i < lineas.length; i++) {
        const actual = normalizar(lineas[i]);

        if (etiquetas.some(etiqueta => actual.includes(etiqueta))) {
            for (let j = i; j <= Math.min(i + saltos, lineas.length - 1); j++) {
                const coincidencia = lineas[j].match(expresion);

                if (coincidencia) {
                    return coincidencia[1].trim();
                }
            }
        }
    }

    return "";
}

// ========================================
// 1. NUMERO DE GUIA
// ========================================

function extraerGuia(texto) {
    const contenido = normalizar(texto);

    const coincidencia = contenido.match(
        /\b(T[O0]{2}3|E[G6][O0]7)\s*[-–]?\s*(\d{5,12})\b/
    );

    if (!coincidencia) return "";

    const prefijo = coincidencia[1].startsWith("T") ? "T003" : "EG07";

    return `${prefijo}-${coincidencia[2]}`;
}

// ========================================
// 2. FECHA
// ========================================

function extraerFecha(texto) {
    const lineas = obtenerLineas(texto);

    return buscarCerca(
        lineas,
        ["FECHA EMISION", "FECHA Y HORA DE EMISION"],
        /(\d{4}[-/]\d{2}[-/]\d{2})/,
        2
    );
}

// ========================================
// 3. TRX / TRANSFERENCIA
// ========================================

function extraerTransferencia(texto) {
    const lineas = obtenerLineas(texto);

    return buscarCerca(
        lineas,
        ["TRANSFERENCIA", "TRX"],
        /\b(?:T\s*)?(\d{8,12})\b/i,
        2
    );
}

// ========================================
// 4. BLOQUE DEL TRANSPORTISTA
// ========================================

function obtenerBloqueTransporte(lineas) {
    const inicio = lineas.findIndex(linea =>
        normalizar(linea).includes("UNIDAD DE TRANSPORTE")
    );

    if (inicio === -1) return [];

    // El bloque termina antes de la tabla de productos.
    let fin = lineas.findIndex((linea, indice) =>
        indice > inicio &&
        (
            normalizar(linea).includes("EAN / SKU") ||
            normalizar(linea).includes("DESCRIPCION")
        )
    );

    if (fin === -1) {
        fin = Math.min(inicio + 20, lineas.length);
    }

    return lineas.slice(inicio, fin);
}

// ========================================
// 5. EMPRESA DE TRANSPORTE
// ========================================

function extraerTransporte(texto, transportistas = []) {
    const lineas = obtenerLineas(texto);
    const bloque = obtenerBloqueTransporte(lineas);

    if (bloque.length === 0) return "";

    for (const linea of bloque) {
        const lineaNormalizada = normalizar(linea);

        for (const empresa of transportistas) {
            for (const variante of empresa.variantes) {

                const varianteNormalizada = normalizar(variante);

                if (lineaNormalizada.includes(varianteNormalizada)) {

                    // Buscar la variante dentro de la línea original.
                    const posicion = lineaNormalizada.indexOf(
                        varianteNormalizada
                    );

                    let resultado = linea.substring(posicion).trim();

                    // Eliminar otros campos que puedan aparecer
                    // en la misma línea.
                    resultado = resultado.split(
                        /DOCUMENTO|TIPO Y NUMERO|N° RUC|Nº RUC/i
                    )[0];

                    return resultado.trim();
                }
            }
        }
    }

    return "";
}



// ========================================
// 6. PLACA
// ========================================

function extraerPlaca(texto) {
    const lineas = obtenerLineas(texto);
    const bloque = obtenerBloqueTransporte(lineas);

    if (bloque.length === 0) return "";

    const placa = buscarCerca(
        bloque,
        ["PLACA VEHICULO", "PLACA VEHICULAR"],
        /\b([A-Z0-9]{3}\s*[- ]\s*[A-Z0-9]{3})\b/i,
        2
    );

    return placa.replace(/\s+/g, "").replace(/([A-Z0-9]{3})([A-Z0-9]{3})/, "$1-$2");
}

// ========================================
// 7. NOMBRE DEL CONDUCTOR
// ========================================

function extraerChofer(texto) {
    const lineas = obtenerLineas(texto);
    const bloque = obtenerBloqueTransporte(lineas);

    if (bloque.length === 0) return "";

    return buscarCerca(
        bloque,
        ["NOMBRE DEL CONDUCTOR"],
        /NOMBRE\s+DEL\s+CONDUCTOR\s*:?\s*([A-ZÁÉÍÓÚÑ ]{5,})/i,
        2
    );
}

// ========================================
// 8. CANTIDADES DE PRODUCTOS
// ========================================

function extraerCantidadProducto(texto, producto) {
    const lineas = obtenerLineas(texto);

    for (const linea of lineas) {
        const actual = normalizar(linea);

        if (actual.includes(producto)) {
            // Busca la cantidad al final de la linea.
            const coincidencia = actual.match(
                /\bNIU\b\s*(\d{1,4})\s*$/
            );

            if (coincidencia) return coincidencia[1];

            // Alternativa: cantidad al final sin unidad NIU.
            const alternativa = actual.match(
                /\b(\d{1,4})\s*$/
            );

            if (alternativa) return alternativa[1];
        }
    }

    return "";
}

function extraerPalletEAN(texto) {
    return extraerCantidadProducto(texto, "PALLET EAN");
}

function extraerPalletCHEP(texto) {
    return extraerCantidadProducto(texto, "PALLET CHEP");
}

function extraerRollContainer(texto) {
    return extraerCantidadProducto(texto, "ROLL CONTAINER");
}

// ========================================
// 9. EXTRAER TODOS LOS DATOS
// ========================================

export function extraerDatos(
    texto,
    formato = "DESCONOCIDO",
    transportistas = []
) {
    if (!texto || typeof texto !== "string") {
        throw new Error("No se recibió texto válido para extraer.");
    }

    const guia = extraerGuia(texto);

    return {
        guia: guia,
        fecha: extraerFecha(texto),
        transferencia: extraerTransferencia(texto),
        placa: extraerPlaca(texto),
        transporte: extraerTransporte(texto),
        chofer: extraerChofer(texto),

        pallet_ean: extraerPalletEAN(texto),
        pallet_chep: extraerPalletCHEP(texto),
        roll_1: extraerRollContainer(texto),

        // Pendientes de implementar.
        tienda: "",
        pallet_simple: "",
        europallet: "",
        roll_2: "",
        jabas_negras: "",
        bine: "",
        cooler: "",
        coche: ""
    };
}
