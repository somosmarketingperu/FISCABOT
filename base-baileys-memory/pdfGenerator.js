const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Genera el PDF del reporte integral del empleador.
 * @param {Object} datosEmpresa - Datos generales de la empresa (query 1, primer objeto del array)
 * @param {Array} listaTrabajadores - Lista de trabajadores (query 2)
 * @param {Object} resumenTrabajadores - Resumen de trabajadores (query 3)
 * @param {String} ruc - RUC de la empresa (para el nombre del archivo)
 * @returns {String} Ruta del archivo PDF generado
 */
function generateEmployerReportPDF(datosEmpresa, listaTrabajadores, resumenTrabajadores, ruc) {
    // Generar fecha y hora para el nombre del archivo
    const now = new Date();
    const yyyy = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const fechaStr = `${yyyy}${MM}${dd}_${hh}${mm}${ss}`;
    const nombreArchivo = `reporte_empleador_${ruc}_${fechaStr}.pdf`;
    const outputPath = path.join(__dirname, nombreArchivo);
    const doc = new PDFDocument({ margin: 40, size: 'A4', autoFirstPage: false });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // --- CABECERA CON LOGO Y TEXTO INSTITUCIONAL ---
    function addHeaderFooter() {
        // Cabecera
        doc.image(path.join(__dirname, 'logo-sunafil.png'), doc.page.width / 2 - 120, 20, { width: 240, align: 'center' });
        doc.moveDown(4.5);
        doc.fontSize(10).font('Helvetica').fillColor('black').text('“Decenio de la igualdad de oportunidades para mujeres y hombres”', { align: 'center' });
        doc.text('“Año del Bicentenario de la consolidación de nuestra Independencia y de la conmemoración de las heroicas batallas de Junín y Ayacucho.”', { align: 'center' });
        doc.moveDown(1);
        doc.fillColor('black');
    }
    // Pie de página con numeración
    function addFooter() {
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(9).fillColor('gray').text(`Página ${i + 1} de ${range.count}`, 0, doc.page.height - 40, {
                align: 'center',
                width: doc.page.width
            });
        }
        doc.fillColor('black');
    }

    // --- PRIMERA PÁGINA ---
    doc.addPage();
    addHeaderFooter();
    doc.moveDown(2);
    // Portada y título
    doc.fontSize(16).font('Helvetica-Bold').text('REPORTE INTEGRAL DEL EMPLEADOR (Versión Completa)', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica').text(`Fecha de generación: ${now.toLocaleString('es-PE')}`, { align: 'right' });
    doc.moveDown(1);

    // 1. Identificación General
    doc.fontSize(13).font('Helvetica-Bold').text('1. Identificación General');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Razón Social: ${datosEmpresa["Nombre/Razón Social"] || '-'}`);
    doc.text(`RUC: ${datosEmpresa["RUC"] || ruc || '-'}`);
    doc.text(`Nombre Comercial: ${datosEmpresa["Nombre Comercial"] || 'No especificado'}`);
    doc.text(`Estado del Contribuyente: ${datosEmpresa["Planillón - Estado Contribuyente"] || '-'}`);
    doc.text(`Condición del Domicilio: ${datosEmpresa["Planillón - Condición Domicilio"] || '-'}`);
    doc.text(`Fecha de Alta (SUNAT): ${formatFecha(datosEmpresa["Fecha Alta"])}`);
    doc.text(`Inicio de Actividades: ${formatFecha(datosEmpresa["Fecha Inicio Actividades"])}`);
    doc.moveDown(1);

    // 2. Datos de Registros Públicos y Constitución
    doc.font('Helvetica-Bold').text('2. Datos de Registros Públicos y Constitución');
    doc.font('Helvetica').moveDown(0.5);
    doc.text('Información relacionada con la inscripción de la entidad en registros públicos.');
    doc.text(`Fecha de Constitución: ${formatFecha(datosEmpresa["Fecha Constitución"])}`);
    doc.text(`Ficha Registral: ${datosEmpresa["Ficha Registral"] || 'No registra'}`);
    doc.text(`Partida Registral: ${datosEmpresa["Partida Registral"] || 'No registra'}`);
    doc.text(`Asiento en RR.PP: ${datosEmpresa["Asiento Registros Públicos"] || 'No registra'}`);
    doc.moveDown(1);

    // 3. Actividad Económica y Clasificación
    doc.font('Helvetica-Bold').text('3. Actividad Económica y Clasificación');
    doc.font('Helvetica').moveDown(0.5);
    doc.text(`Actividad Económica Principal (CIIU): ${datosEmpresa["Actividad Económica (CIIU 1)"] || '-'}${datosEmpresa["Sector - Descripción Actividad"] ? ' - ' + datosEmpresa["Sector - Descripción Actividad"] : ''}`);
    doc.text(`Actividad Económica Secundaria (CIIU): ${datosEmpresa["Actividad Económica (CIIU 2)"] || 'No registra'}`);
    doc.text(`Descripción del Sector Económico: ${datosEmpresa["Sector - Descripción Sector"] || '-'}`);
    doc.text(`Indicador de Alto Riesgo (SCTR): ${datosEmpresa["Sector - Indicador Alto Riesgo"] || 'NO'}`);
    doc.moveDown(1);

    // 4. Dirección y Establecimientos
    doc.font('Helvetica-Bold').text('4. Dirección y Establecimientos');
    doc.font('Helvetica').moveDown(0.5);
    doc.text('Domicilio Fiscal (Dirección Principal)');
    doc.text(`Dirección: ${datosEmpresa["Dirección Principal - Tipo Vía"] || ''} ${datosEmpresa["Dirección Principal - Nombre Vía"] || ''} ${datosEmpresa["Dirección Principal - Número"] || ''}`.trim());
    doc.text(`Zona: ${datosEmpresa["Dirección Principal - Zona"] || 'No especificada (BLANCO INTENCIONAL)'}`);
    doc.moveDown(0.5);
    doc.text('Información de Anexos');
    doc.text(`Número Total de Anexos: ${datosEmpresa["Planillón - Nro. de Anexos"] || '-'}`);
    doc.text('Datos del Primer Anexo Registrado:');
    doc.text(`Dirección: ${datosEmpresa["Anexo - Tipo Vía"] || ''} ${datosEmpresa["Anexo - Nombre Vía"] || ''} ${datosEmpresa["Anexo - Número"] || ''}`.trim());
    doc.text(`Zona: ${datosEmpresa["Anexo - Zona"] || 'NO DEFINIDO'}`);
    doc.text(`Referencia: ${datosEmpresa["Anexo - Referencia"] || 'No especificada'}`);
    doc.text(`Tipo de Establecimiento (Código): ${datosEmpresa["Anexo - Tipo Establecimiento"] || '-'} `);
    doc.text(`Indicador Legal (Código): ${datosEmpresa["Anexo - Indicador Legal"] || '-'}`);
    doc.moveDown(1);

    // 5. Información de Contacto
    doc.font('Helvetica-Bold').text('5. Información de Contacto');
    doc.font('Helvetica').moveDown(0.5);
    doc.text('Recopilación de teléfonos y correos electrónicos de distintas fuentes.');
    doc.moveDown(0.2);
    doc.text(`Casilla Electrónica - Teléfonos: ${datosEmpresa["Teléfono Casilla Electrónica"] || 'No registra'}`);
    doc.text(`Casilla Electrónica - Correos: ${datosEmpresa["Correo Casilla Electrónica"] || 'No registra'}`);
    doc.text(`Registros SUNAT - Teléfonos: ${datosEmpresa["Teléfono SUNAT"] || 'No registra'}`);
    doc.text(`Registros SUNAT - Correos: ${datosEmpresa["Correo SUNAT"] || 'No registra'}`);
    doc.text(`T-Registro - Teléfonos: ${datosEmpresa["Teléfono T-Registro"] || 'No registra'}`);
    doc.text(`T-Registro - Correos: ${datosEmpresa["Correo T-Registro"] || 'No registra'}`);
    doc.text(`Teléfonos Adicionales: ${datosEmpresa["Teléfono 1"] || 'No registra'}`);
    doc.text(`Fax: ${datosEmpresa["Fax"] || 'No registra'}`);
    doc.moveDown(1);

    // 6. Representación Legal
    doc.font('Helvetica-Bold').text('6. Representación Legal');
    doc.font('Helvetica').moveDown(0.5);
    doc.text('Se listan los representantes legales encontrados en los registros.');
    doc.text(`NOMBRE COMPLETO: ${datosEmpresa["Rep Legal - Nombre"] || '-'}`);
    doc.text(`DOCUMENTO: ${datosEmpresa["Rep Legal - Documento"] || '-'}`);
    doc.text(`CARGO: ${datosEmpresa["Rep Legal - Cargo"] || '-'}`);
    doc.text(`FECHA DE INICIO: ${formatFecha(datosEmpresa["Rep Legal - Fecha Inicio Cargo"] )}`);
    doc.moveDown(1);

    // 7. Información Laboral, SST y Códigos de Sistema
    doc.font('Helvetica-Bold').text('7. Información Laboral, SST y Códigos de Sistema');
    doc.font('Helvetica').moveDown(0.5);
    doc.text(`Indicador de SST: ${datosEmpresa["Planillón - Indicador SST"] || '-'}`);
    doc.text(`Tipo de Empresa (Planillón): ${datosEmpresa["Planillón - Tipo Empresa"] || '-'}`);
    doc.text(`Tamaño (Según Renta): ${datosEmpresa["Planillón - Tamaño Empresa"] || 'No especificado'}`);
    doc.text(`Tamaño (REMYPE): ${datosEmpresa["Planillón - Tamaño REMYPE"] || 'No especificado'}`);
    doc.text(`Código de Origen: ${datosEmpresa["Origen"] || '-'}`);
    doc.text(`Código de Contabilidad: ${datosEmpresa["Código Contabilidad"] || '-'}`);
    doc.text(`Código de Facturación: ${datosEmpresa["Código Facturación"] || '-'}`);
    doc.text(`Código de Patrón: ${datosEmpresa["Patrón"] || 'No registra'}`);
    doc.moveDown(1);

    // 8. Resumen de la Última Declaración (PLAME)
    doc.font('Helvetica-Bold').text('8. Resumen de la Última Declaración (PLAME)');
    doc.font('Helvetica').moveDown(0.5);
    doc.text(`Último Periodo Declarado: ${formatPeriodo(resumenTrabajadores?.Ultimo_Periodo)}`);
    doc.text(`Trabajadores Declarados en el Periodo: ${resumenTrabajadores?.Cantidad_Trabajadores_Declarados || '-'}`);
    doc.moveDown(1);

    // 9. Detalle de Trabajadores Declarados (Muestra)
    doc.font('Helvetica-Bold').text('9. Detalle de Trabajadores Declarados');
    doc.font('Helvetica').moveDown(0.5);
    doc.text(`Listado completo de trabajadores correspondiente a la declaración de ${formatPeriodo(resumenTrabajadores?.Ultimo_Periodo)}.`);
    doc.moveDown(0.5);
    // Tabla de trabajadores (todos)
    doc.font('Helvetica-Bold').text('N° | DNI        | NOMBRE DEL TRABAJADOR                | TIPO DE VÍNCULO | SEXO     | EDAD | NACIONALIDAD');
    doc.font('Helvetica');
    let trabajadorIndex = 1;
    (listaTrabajadores || []).forEach(t => {
        // Salto de página si se acerca al final
        if (doc.y > doc.page.height - 80) {
            doc.addPage();
            addHeaderFooter();
            doc.moveDown(2);
            doc.font('Helvetica-Bold').text('N° | DNI        | NOMBRE DEL TRABAJADOR                | TIPO DE VÍNCULO | SEXO     | EDAD | NACIONALIDAD');
            doc.font('Helvetica');
        }
        doc.text(`${trabajadorIndex.toString().padEnd(3)}| ${(t.DNI || '').toString().padEnd(10)} | ${(t.NOMBRE_TRABAJADOR || '').padEnd(30)} | ${(t.TIPO_TRABAJADOR || '').padEnd(15)} | ${(t.SEXO || '').padEnd(8)} | ${(t.EDAD || '').toString().padEnd(4)} | ${(t.NACIONALIDAD || '').padEnd(10)}`);
        trabajadorIndex++;
    });
    doc.moveDown(1);

    // Pie de página con numeración
    doc.on('end', addFooter);
    doc.end();
    return outputPath;
}

/**
 * Genera el PDF del reporte de ergonomía con la estructura exacta del reporte original
 * @param {Object} datos - Datos del reporte incluyendo las 4 tablas y resumen
 * @returns {Buffer} Buffer del PDF generado
 */
async function generarPDFReporteErgonomia(datos) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margins: {
                top: 50,
                bottom: 50,
                left: 50,
                right: 50
            }
        });
        
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        
        // PÁGINA 1: Título y Sección 1
        doc.fontSize(16).font('Helvetica-Bold')
           .text('AYUDA DE MEMORIA DEL SISTEMA DE INSPECCIÓN DEL TRABAJO EN:', {align: 'center'});
        doc.fontSize(14).font('Helvetica-Bold')
           .text('MATERIA: MATER-Ergonomía(72)', {align: 'center'});
        doc.moveDown(2);
        
        // Sección 1: Fiscalización
        doc.fontSize(12).font('Helvetica-Bold')
           .text('1. Fiscalización');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica')
           .text(`El Sistema de Inspección del Trabajo ha cerrado un total de ${datos.resumen.totalOrdenes} órdenes de inspección desde 2016 hasta la fecha actual. De estas, ${datos.resumen.denuncias} corresponden a denuncias y ${datos.resumen.operativos} a operativos.`);
        if (datos.resumen.ordenes2025 > 0) {
            doc.text(`Hasta la fecha se han cerrado ${datos.resumen.ordenes2025} órdenes en el año 2025.`);
        }
        doc.moveDown(1);
        
        // Tabla 1 (con opción especial)
        doc.fontSize(12).font('Helvetica-Bold')
           .text('Tabla 1: Órdenes cerradas de fiscalización según origen');
        generarTablaPDF(doc, datos.tabla1, ['N°', 'Origen', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Total'], {tabla1: true});
        // Texto de fuente debajo de la tabla 1
        doc.x = doc.page.margins.left;
        const fechaFuente = new Date();
        const fechaStr = fechaFuente.toLocaleDateString('es-PE');
        doc.fontSize(9).font('Helvetica').text('Fuente: SIIT Actualizado al ' + fechaStr, {align: 'left'});
        // Pequeña separación antes del texto adicional
        doc.moveDown(1);
        
        // Texto adicional (forzar margen izquierdo)
        doc.x = doc.page.margins.left;
        doc.fontSize(10).font('Helvetica')
           .text(`Adicionalmente, el Sistema ha cerrado órdenes de actuaciones inspectivas con los siguientes resultados: ${datos.resumen.actasInfraccion} actas de infracción y ${datos.resumen.informesInspeccion} informes de inspección.`);
        doc.moveDown(1);
        
        // Tabla 2
        doc.fontSize(12).font('Helvetica-Bold')
           .text('Tabla 2: Órdenes cerradas de fiscalización según resultado');
        generarTablaPDF(doc, datos.tabla2, ['N°', 'Resultado', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Total']);
        
        // Texto de fuente debajo de la tabla 2
        doc.x = doc.page.margins.left;
        doc.fontSize(9).font('Helvetica').text('Fuente: SIIT Actualizado al ' + fechaStr, {align: 'left'});

        // --- Tabla 3 debajo de la 2 si hay espacio ---
        // Calcular espacio restante en la página
        const espacioRestante = doc.page.height - doc.y - doc.page.margins.bottom;
        // Altura estimada de la tabla 3 (título + filas + margen)
        const filasTabla3 = (datos.tabla3 ? datos.tabla3.length : 0) + 1; // +1 encabezado
        const alturaTabla3 = 20 + (filasTabla3 * 25) + 30; // 20 título, 25 por fila, 30 margen extra
        if (espacioRestante > alturaTabla3) {
            // Hay espacio, colocar tabla 3 aquí
            doc.moveDown(1); // Salto de línea adicional
            doc.x = doc.page.margins.left; // Alinear a la izquierda
            doc.fontSize(12).font('Helvetica-Bold')
               .text('Tabla 3: Inspecciones en sectores económicos según la materia', {align: 'left'});
            generarTablaPDF(doc, datos.tabla3, ['N°', 'Sector Económico', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Total'], {tabla3: true});
            
            // Texto de fuente debajo de la tabla 3
            doc.x = doc.page.margins.left;
            doc.fontSize(9).font('Helvetica').text('Fuente: SIIT Actualizado al ' + fechaStr, {align: 'left'});
        } else {
            // No hay espacio, nueva página como antes
            doc.addPage();
            doc.moveDown(1); // Salto de línea adicional
            doc.x = doc.page.margins.left; // Alinear a la izquierda
            doc.fontSize(12).font('Helvetica-Bold')
               .text('Tabla 3: Inspecciones en sectores económicos según la materia', {align: 'left'});
            generarTablaPDF(doc, datos.tabla3, ['N°', 'Sector Económico', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Total'], {tabla3: true});
            
            // Texto de fuente debajo de la tabla 3
            doc.x = doc.page.margins.left;
            doc.fontSize(9).font('Helvetica').text('Fuente: SIIT Actualizado al ' + fechaStr, {align: 'left'});
        }
        
        // PÁGINA 2: Tabla 4
        doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold')
           .text('Tabla 4: Inspecciones en regiones según la materia', {align: 'left'});
        generarTablaPDF(doc, datos.tabla4, ['N°', 'Región', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Total'], {tabla4: true});
        
        // Fuente
        doc.x = doc.page.margins.left;
        doc.fontSize(10).font('Helvetica').text('Fuente: SIIT Actualizado al ' + fechaStr, {align: 'left'});
        
        doc.end();
    });
}

/**
 * Genera una tabla en el PDF con formato simple y estructurado
 * @param {PDFDocument} doc - Documento PDF
 * @param {Array} datos - Datos de la tabla
 * @param {Array} columnas - Nombres de las columnas
 */
function generarTablaPDF(doc, datos, columnas, opciones = {}) {
    if (!datos || datos.length === 0) {
        doc.fontSize(10).font('Helvetica')
           .text('No hay datos disponibles para mostrar en esta tabla.');
        return;
    }

    // Configuración para A4
    const margin = 50;
    const usableWidth = 595.28 - (margin * 2);
    const rowHeight = 25;

    // Si es tabla 1, usar anchos especiales
    let columnWidths = {};
    let yearWidth = 0;
    if (opciones && opciones.tabla1) {
        // N°: 5%, Origen: 15%, años: 60% (repartido), Total: 10%
        const yearColumns = columnas.filter(col => /^\d{4}$/.test(col));
        columnWidths = {
            'N°': Math.floor(usableWidth * 0.05),
            'Origen': Math.floor(usableWidth * 0.15),
            'Total': Math.floor(usableWidth * 0.10)
        };
        yearWidth = Math.floor((usableWidth * 0.60) / yearColumns.length);
    } else if (columnas.includes('Resultado')) {
        // Tabla 2: N°: 5%, Resultado: 20%, años: 60% (repartido), Total: 15%
        const yearColumns = columnas.filter(col => /^\d{4}$/.test(col));
        columnWidths = {
            'N°': Math.floor(usableWidth * 0.05),
            'Resultado': Math.floor(usableWidth * 0.20),
            'Total': Math.floor(usableWidth * 0.15)
        };
        yearWidth = Math.floor((usableWidth * 0.60) / yearColumns.length);
    } else if (opciones && opciones.tabla3) {
        // Tabla 3: N°: 4%, Sector Económico: 25%, años: 63% (repartido), Total: 8%
        const yearColumns = columnas.filter(col => /^\d{4}$/.test(col));
        columnWidths = {
            'N°': Math.floor(usableWidth * 0.04),
            'Sector Económico': Math.floor(usableWidth * 0.25),
            'Total': Math.floor(usableWidth * 0.08)
        };
        yearWidth = Math.floor((usableWidth * 0.63) / yearColumns.length);
    } else if (opciones && opciones.tabla4) {
        // Tabla 4: N°: 4%, Región: 20%, años: 68% (repartido), Total: 8%
        const yearColumns = columnas.filter(col => /^\d{4}$/.test(col));
        columnWidths = {
            'N°': Math.floor(usableWidth * 0.04),
            'Región': Math.floor(usableWidth * 0.20),
            'Total': Math.floor(usableWidth * 0.08)
        };
        yearWidth = Math.floor((usableWidth * 0.68) / yearColumns.length);
    } else {
        // Default para otras tablas
        columnWidths = {
            'N°': Math.floor(usableWidth * 0.04),
            'Origen': Math.floor(usableWidth * 0.12),
            'Resultado': Math.floor(usableWidth * 0.15),
            'Sector Económico': Math.floor(usableWidth * 0.18),
            'Región': Math.floor(usableWidth * 0.12),
            'Total': Math.floor(usableWidth * 0.06)
        };
        const yearColumns = columnas.filter(col => /^\d{4}$/.test(col));
        yearWidth = Math.floor((usableWidth * 0.33) / yearColumns.length);
    }

    // Iniciar desde la posición actual del documento
    let currentY = doc.y;
    let currentX = margin;

    // Encabezados
    doc.fontSize(8).font('Helvetica-Bold');
    columnas.forEach((col) => {
        const colWidth = columnWidths[col] || yearWidth;
        // Sombreado para la fila de encabezados
        doc.rect(currentX, currentY, colWidth, rowHeight).fillAndStroke('#E6F3FF', 'black');
        // Asegurar que el texto sea negro
        doc.fillColor('black');
        // Centrado vertical y horizontal
        const textY = currentY + (rowHeight - 8) / 2; // 8 = font size
        doc.text(col, currentX, textY, {align: 'center', width: colWidth});
        currentX += colWidth;
    });

    // Filas de datos
    doc.fontSize(7).font('Helvetica');
    currentY += rowHeight;
    datos.forEach((row, rowIndex) => {
        currentX = margin;
        columnas.forEach((col) => {
            const colWidth = columnWidths[col] || yearWidth;
            let value = '0';
            if (col === 'N°') value = (rowIndex + 1).toString();
            else if (col === 'Origen') value = row.ORIGEN || '';
            else if (col === 'Resultado') value = row.V_RESULTADO || '';
            else if (col === 'Sector Económico') value = row.SECTOR_ECONOMICO || '';
            else if (col === 'Región') value = row.REGION || '';
            else if (col === 'Total') value = row.Total || '0';
            else value = row[col] || '0';

            doc.rect(currentX, currentY, colWidth, rowHeight).stroke();
            // Centrado vertical y horizontal
            const textY = currentY + (rowHeight - 7) / 2; // 7 = font size
            doc.text(value.toString(), currentX, textY, {align: 'center', width: colWidth});
            currentX += colWidth;
        });
        currentY += rowHeight;
    });

    // Fila de totales
    if (datos && datos.length > 0) {
        currentX = margin;
        columnas.forEach((col) => {
            const colWidth = columnWidths[col] || yearWidth;
            let totalValue = '';
            
            if (col === 'N°') {
                totalValue = '';
            } else if (col === 'Origen' || col === 'Resultado' || col === 'Sector Económico' || col === 'Región') {
                totalValue = 'Total';
            } else if (/^\d{4}$/.test(col) || col === 'Total') {
                // Calcular total para columnas de años y Total
                let sum = 0;
                datos.forEach(row => {
                    if (col === 'Total') {
                        sum += parseInt(row.Total) || 0;
                    } else {
                        sum += parseInt(row[col]) || 0;
                    }
                });
                totalValue = sum.toString();
            } else {
                totalValue = '';
            }

            // Sombreado para la fila de totales
            doc.rect(currentX, currentY, colWidth, rowHeight).fillAndStroke('#E6F3FF', 'black');
            // Asegurar que el texto sea negro
            doc.fillColor('black');
            // Centrado vertical y horizontal
            const textY = currentY + (rowHeight - 7) / 2;
            doc.fontSize(7).font('Helvetica-Bold');
            doc.text(totalValue.toString(), currentX, textY, {align: 'center', width: colWidth});
            currentX += colWidth;
        });
        currentY += rowHeight;
    }

    // Actualizar la posición Y del documento para el siguiente contenido
    doc.y = currentY + 5; // 5 puntos de espacio extra después de la tabla
}

// Utilidad para formatear fechas
function formatFecha(fecha) {
    if (!fecha || fecha === '0001-01-01 00:00:00.000') return 'No especificada';
    const d = new Date(fecha);
    if (isNaN(d)) return fecha;
    return d.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: '2-digit' });
}

// Utilidad para formatear periodo (ej: 202505 -> Mayo 2025)
function formatPeriodo(periodo) {
    if (!periodo) return '-';
    const str = periodo.toString();
    if (str.length !== 6) return periodo;
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const anio = str.substring(0, 4);
    const mes = parseInt(str.substring(4, 6), 10);
    return `${meses[mes - 1] || '-'} ${anio}`;
}

module.exports = { 
    generateEmployerReportPDF,
    generarPDFReporteErgonomia,
    generarTablaPDF
}; 