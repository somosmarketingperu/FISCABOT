const PDFDocument = require('pdfkit');

// === Función específica para Tabla 4 con título integrado ===
function generarTabla4ConTitulo(doc, datos, columnas, agregarEncabezado) {
    if (!datos || datos.length === 0) {
        doc.fontSize(10).font('Helvetica').text('No hay datos disponibles para mostrar en esta tabla.');
        return;
    }

    const margin = 50;
    const usableWidth = 595.28 - (margin * 2);
    const headerHeight = 25;
    const dataRowHeight = 25;
    
    // Calcular anchos de columna específicos para tabla 4
    const yearColumns = columnas.filter(col => /^\d{4}$/.test(col));
    const columnWidths = { 'N°': Math.floor(usableWidth * 0.04), 'Región': Math.floor(usableWidth * 0.20), 'Total': Math.floor(usableWidth * 0.08) };
    const yearWidth = Math.floor((usableWidth * 0.68) / yearColumns.length);

    // Calcular altura total necesaria: título + tabla completa
    const alturaTitulo = 25;
    const alturaTabla = headerHeight + (datos.length * dataRowHeight) + dataRowHeight; // + dataRowHeight para totales
    const alturaTotal = alturaTitulo + alturaTabla + 20; // 20 extra para márgenes

    // Verificar si hay espacio suficiente en la página actual
    const espacioDisponible = doc.page.height - doc.y - doc.page.margins.bottom;
    if (espacioDisponible < alturaTotal) {
        doc.addPage();
        if (agregarEncabezado && typeof agregarEncabezado === 'function') {
            agregarEncabezado();
        }
    }

    // Dibujar el título
    doc.fontSize(12).font('Helvetica-Bold').text('Tabla 4: Inspecciones en regiones según la materia', { align: 'left' });
    
    let currentY = doc.y + 5;
    let currentX = margin;
    
    // Dibujar encabezado de la tabla
    doc.fontSize(8).font('Helvetica-Bold');
    columnas.forEach((col) => {
        const colWidth = columnWidths[col] || yearWidth;
        doc.rect(currentX, currentY, colWidth, headerHeight).fillAndStroke('#E6F3FF', 'black');
        doc.fillColor('black');
        doc.text(col, currentX, currentY + (headerHeight - 8) / 2, { align: 'center', width: colWidth });
        currentX += colWidth;
    });

    // Dibujar filas de datos
    doc.fontSize(7).font('Helvetica');
    currentY += headerHeight;
    datos.forEach((row, rowIndex) => {
        // Verificar si necesitamos nueva página para esta fila
        if (currentY + dataRowHeight > 750) {
            doc.addPage();
            currentY = 50;
            if (agregarEncabezado && typeof agregarEncabezado === 'function') {
                agregarEncabezado();
                currentY = 170;
            }
        }
        
        currentX = margin;
        columnas.forEach((col) => {
            const colWidth = columnWidths[col] || yearWidth;
            let value = '0';
            if (col === 'N°') value = (rowIndex + 1).toString();
            else if (col === 'Región') value = row.REGION || '';
            else if (col === 'Total') value = (row.Total || row.TOTAL || '0');
            else value = row[col] || '0';

            doc.rect(currentX, currentY, colWidth, dataRowHeight).stroke();
            doc.text(value.toString(), currentX, currentY + (dataRowHeight - 7) / 2, { align: 'center', width: colWidth });
            currentX += colWidth;
        });
        currentY += dataRowHeight;
    });

    // Dibujar fila de totales
    if (currentY + dataRowHeight > 750) {
        doc.addPage();
        currentY = 50;
        if (agregarEncabezado && typeof agregarEncabezado === 'function') {
            agregarEncabezado();
            currentY = 170;
        }
    }
    
    currentX = margin;
    columnas.forEach((col) => {
        const colWidth = columnWidths[col] || yearWidth;
        let totalValue = '';
        if (col === 'N°') totalValue = '';
        else if (col === 'Región') totalValue = 'Total';
        else if (/^\d{4}$/.test(col) || col === 'Total') {
            let sum = 0;
            datos.forEach(row => {
                if (col === 'Total') { const v = row.Total ?? row.TOTAL ?? 0; sum += parseFloat(v) || 0; }
                else { sum += parseFloat(row[col]) || 0; }
            });
            totalValue = Math.round(sum).toString();
        }
        doc.rect(currentX, currentY, colWidth, dataRowHeight).fillAndStroke('#E6F3FF', 'black');
        doc.fillColor('black');
        doc.fontSize(7).font('Helvetica-Bold');
        doc.text(totalValue.toString(), currentX, currentY + (dataRowHeight - 7) / 2, { align: 'center', width: colWidth });
        currentX += colWidth;
    });
    
    doc.y = currentY + dataRowHeight + 5;
}

// === Utilidad local: generador de tablas ===
function generarTablaPDF(doc, datos, columnas, opciones = {}, agregarEncabezado = null) {
    if (!datos || datos.length === 0) {
        doc.fontSize(10).font('Helvetica').text('No hay datos disponibles para mostrar en esta tabla.');
        return;
    }

    const margin = 50;
    const usableWidth = 595.28 - (margin * 2);
    const baseRowHeight = 25;
    const headerHeight = (opciones && opciones.tablaMaterias) ? 36 : baseRowHeight;
    const dataRowHeight = (opciones && opciones.tablaMaterias) ? 30 : baseRowHeight;

    let columnWidths = {};
    let yearWidth = 0;
    if (opciones && opciones.tabla1) {
        const yearColumns = columnas.filter(col => /^\d{4}$/.test(col));
        columnWidths = { 'N°': Math.floor(usableWidth * 0.05), 'Origen': Math.floor(usableWidth * 0.15), 'Total': Math.floor(usableWidth * 0.10) };
        yearWidth = Math.floor((usableWidth * 0.60) / yearColumns.length);
    } else if (columnas.includes('Resultado')) {
        const yearColumns = columnas.filter(col => /^\d{4}$/.test(col));
        columnWidths = { 'N°': Math.floor(usableWidth * 0.05), 'Resultado': Math.floor(usableWidth * 0.20), 'Total': Math.floor(usableWidth * 0.15) };
        yearWidth = Math.floor((usableWidth * 0.60) / yearColumns.length);
    } else if (opciones && opciones.tabla3) {
        const yearColumns = columnas.filter(col => /^\d{4}$/.test(col));
        columnWidths = { 'N°': Math.floor(usableWidth * 0.04), 'Sector Económico': Math.floor(usableWidth * 0.25), 'Total': Math.floor(usableWidth * 0.08) };
        yearWidth = Math.floor((usableWidth * 0.63) / yearColumns.length);
    } else if (opciones && opciones.tabla4) {
        const yearColumns = columnas.filter(col => /^\d{4}$/.test(col));
        columnWidths = { 'N°': Math.floor(usableWidth * 0.04), 'Región': Math.floor(usableWidth * 0.20), 'Total': Math.floor(usableWidth * 0.08) };
        yearWidth = Math.floor((usableWidth * 0.68) / yearColumns.length);
    } else if (opciones && (opciones.tabla5 || opciones.tabla6)) {
        const yearColumns = columnas.filter(col => /^\d{4}$/.test(col));
        columnWidths = { 'Descripción': Math.floor(usableWidth * 0.18), 'Total': Math.floor(usableWidth * 0.12) };
        yearWidth = Math.floor((usableWidth * 0.70) / yearColumns.length);
    } else if (opciones && opciones.tablaMaterias) {
        columnWidths = {
            'GRUPO': Math.floor(usableWidth * 0.22), 'COD. MATERIA': Math.floor(usableWidth * 0.10), 'MATERIA': Math.floor(usableWidth * 0.16),
            'COD. SUB MATERIA': Math.floor(usableWidth * 0.12), 'SUB MATERIA': Math.floor(usableWidth * 0.24), 'COD. SUB SUB MATERIA': Math.floor(usableWidth * 0.08), 'SUB SUB MATERIA': Math.floor(usableWidth * 0.08)
        };
        yearWidth = Math.floor(usableWidth / columnas.length);
    } else {
        columnWidths = { 'N°': Math.floor(usableWidth * 0.04), 'Origen': Math.floor(usableWidth * 0.12), 'Resultado': Math.floor(usableWidth * 0.15), 'Sector Económico': Math.floor(usableWidth * 0.18), 'Región': Math.floor(usableWidth * 0.12), 'Descripción': Math.floor(usableWidth * 0.18), 'Total': Math.floor(usableWidth * 0.06) };
        const yearColumns = columnas.filter(col => /^\d{4}$/.test(col));
        yearWidth = yearColumns.length > 0 ? Math.floor((usableWidth * 0.33) / yearColumns.length) : Math.floor(usableWidth / columnas.length);
    }

    let currentY = doc.y;
    let currentX = margin;
    
    // Verificar si hay espacio suficiente en la página actual para toda la tabla
    const estimatedHeight = headerHeight + (datos.length * dataRowHeight) + (opciones.sinTotales ? 0 : dataRowHeight);
    if (currentY + estimatedHeight > 750) {
        doc.addPage();
        currentY = 50; // Reset Y position
        // Redibujar el encabezado en la nueva página si la función existe
        if (agregarEncabezado && typeof agregarEncabezado === 'function') {
            agregarEncabezado();
            currentY = 170; // Posición después del encabezado
        }
    }
    
    doc.fontSize(8).font('Helvetica-Bold');
    columnas.forEach((col) => {
        const colWidth = columnWidths[col] || yearWidth;
        doc.rect(currentX, currentY, colWidth, headerHeight).fillAndStroke('#E6F3FF', 'black');
        doc.fillColor('black');
        const textY = (opciones && opciones.tablaMaterias) ? currentY + 6 : currentY + (headerHeight - 8) / 2;
        doc.text(col, currentX, textY, { align: 'center', width: colWidth });
        currentX += colWidth;
    });

    doc.fontSize(7).font('Helvetica');
    currentY += headerHeight;
    datos.forEach((row, rowIndex) => {
        // Verificar si necesitamos nueva página para esta fila
        if (currentY + dataRowHeight > 750) {
            doc.addPage();
            currentY = 50;
            // Redibujar el encabezado en la nueva página si la función existe
            if (agregarEncabezado && typeof agregarEncabezado === 'function') {
                agregarEncabezado();
                currentY = 170; // Posición después del encabezado
            }
        }
        
        currentX = margin;
        columnas.forEach((col) => {
            const colWidth = columnWidths[col] || yearWidth;
            let value = '0';
            if (col === 'N°') value = (rowIndex + 1).toString();
            else if (col === 'Origen') value = row.ORIGEN || '';
            else if (col === 'Resultado') value = row.V_RESULTADO || '';
            else if (col === 'Sector Económico') value = row.SECTOR_ECONOMICO || '';
            else if (col === 'Región') value = row.REGION || '';
            else if (col === 'Descripción') value = row.Descripcion || row.DESCRIPCION || '';
            else if (col === 'Total') value = (row.Total || row.TOTAL || '0');
            else value = row[col] || '0';

            if (opciones && opciones.tablaMaterias && col === 'GRUPO' && typeof value === 'string' && value.includes('-')) {
                value = value.replace('-', '\n');
            }

            doc.rect(currentX, currentY, colWidth, dataRowHeight).stroke();
            const textYData = (opciones && opciones.tablaMaterias) ? currentY + 6 : currentY + (dataRowHeight - 7) / 2;
            doc.text(value.toString(), currentX, textYData, { align: 'center', width: colWidth });
            currentX += colWidth;
        });
        currentY += dataRowHeight;
    });

    if (!opciones.sinTotales && datos && datos.length > 0) {
        // Verificar si necesitamos nueva página para la fila de totales
        if (currentY + dataRowHeight > 750) {
            doc.addPage();
            currentY = 50;
            // Redibujar el encabezado en la nueva página si la función existe
            if (agregarEncabezado && typeof agregarEncabezado === 'function') {
                agregarEncabezado();
                currentY = 170; // Posición después del encabezado
            }
        }
        
        currentX = margin;
        columnas.forEach((col) => {
            const colWidth = columnWidths[col] || yearWidth;
            let totalValue = '';
            if (col === 'N°') totalValue = '';
            else if (['Origen', 'Resultado', 'Sector Económico', 'Región', 'Descripción'].includes(col)) totalValue = 'Total';
            else if (/^\d{4}$/.test(col) || col === 'Total') {
                let sum = 0;
                datos.forEach(row => {
                    if (col === 'Total') { const v = row.Total ?? row.TOTAL ?? 0; sum += parseFloat(v) || 0; }
                    else { sum += parseFloat(row[col]) || 0; }
                });
                totalValue = Math.round(sum).toString();
            }
            doc.rect(currentX, currentY, colWidth, dataRowHeight).fillAndStroke('#E6F3FF', 'black');
            doc.fillColor('black');
            const textY = currentY + (dataRowHeight - 7) / 2;
            doc.fontSize(7).font('Helvetica-Bold');
            doc.text(totalValue.toString(), currentX, textY, { align: 'center', width: colWidth });
            currentX += colWidth;
        });
        currentY += dataRowHeight;
    }
    doc.y = currentY + 5;
}

async function generarPDFReporteErgonomia(datos) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margins: { top: 120, bottom: 50, left: 50, right: 50 } }); // Aumentado top margin para header
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Función para agregar encabezado en cada página
        function agregarEncabezado() {
            try {
                // Logo SUNAFIL - ocupa la parte superior izquierda hasta la mitad
                const logoPath = 'C:\\Users\\jgarciaq\\Documents\\ChatBots\\FiscaBot\\base-baileys-memory\\logo-sunafil.png';
                doc.image(logoPath, 50, 15, { width: 250, height: 40 });
            } catch (error) {
                console.log('Error cargando logo:', error.message);
                // Fallback si no se puede cargar la imagen
                doc.fontSize(10).font('Helvetica-Bold').fillColor('red').text('SUNAFIL', 50, 20);
                doc.fontSize(7).font('Helvetica').fillColor('gray').text('SUPERINTENDENCIA NACIONAL DE FISCALIZACIÓN LABORAL', 50, 35);
            }
            
            // Primero: Decenio de la igualdad... (debajo del logo, coordenada Y fija)
            doc.fontSize(8).font('Helvetica').fillColor('black').text('"Decenio de la igualdad de oportunidades para mujeres y hombres"', 50, 65, { width: 495, align: 'center' });
            
            // Segundo: Año de la recuperación... (debajo del decenio, coordenada Y fija)
            doc.fontSize(8).font('Helvetica').fillColor('black').text('"Año de la Recuperación y Consolidación de la Economía Peruana"', 50, 75, { width: 495, align: 'center' });
            
            // Línea separadora debajo de los textos oficiales
            doc.strokeColor('gray').lineWidth(0.5).moveTo(50, 85).lineTo(545, 85).stroke();
            
            // Título del reporte con fondo negro y letra blanca (debajo de la línea separadora)
            const tituloWidth = 495; // Ancho del rectángulo negro
            const tituloX = (595.28 - tituloWidth) / 2; // Centrar el rectángulo
            doc.rect(tituloX, 95, tituloWidth, 35).fill('black');
            
            // Primera línea del título
            doc.fontSize(12).font('Helvetica-Bold').fillColor('white').text('AYUDA DE MEMORIA DEL SISTEMA DE INSPECCIÓN DEL TRABAJO', tituloX, 103, { width: tituloWidth, align: 'center' });
            
            // Salto de línea y segunda línea del título
            doc.fontSize(10).font('Helvetica-Bold').fillColor('white').text('REFERENTE A: MATERIA MATER-ERGONOMÍA(72)', tituloX, 118, { width: tituloWidth, align: 'center' });
            
            // Agregar espacio adicional después del banner del título
            doc.moveDown(1);
            
            // Resetear colores
            doc.fillColor('black');
            doc.strokeColor('black');
        }

        // Agregar encabezado en la primera página
        agregarEncabezado();
        doc.moveDown(2);

        // Configurar encabezado para páginas adicionales
        doc.on('pageAdded', () => {
            agregarEncabezado();
            doc.moveDown(2);
        });

        // 1. Fiscalización
        doc.fontSize(12).font('Helvetica-Bold').text('1. Fiscalización');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica')
            .text(`El Sistema de Inspección del Trabajo ha cerrado un total de ${datos.resumen.totalOrdenes} órdenes de inspección desde 2016 hasta la fecha actual. De estas, ${datos.resumen.denuncias} corresponden a denuncias y ${datos.resumen.operativos} a operativos.`);
        if (datos.resumen.ordenes2025 > 0) {
            doc.text(`Hasta la fecha se han cerrado ${datos.resumen.ordenes2025} órdenes en el año 2025.`);
        }
        doc.moveDown(1);

        // Tabla 1
        doc.fontSize(12).font('Helvetica-Bold').text('Tabla 1: Órdenes cerradas de fiscalización según origen');
        generarTablaPDF(doc, datos.tabla1, ['N°', 'Origen', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Total'], { tabla1: true }, agregarEncabezado);
        doc.x = doc.page.margins.left;
        const fechaFuente = new Date();
        const fechaStr = fechaFuente.toLocaleDateString('es-PE');
        doc.fontSize(9).font('Helvetica').text('Fuente: SIIT Actualizado al ' + fechaStr, { align: 'left' });
        doc.moveDown(1);

        // Texto extra
        doc.x = doc.page.margins.left;
        doc.fontSize(10).font('Helvetica')
            .text(`Adicionalmente, el Sistema ha cerrado órdenes de actuaciones inspectivas con los siguientes resultados: ${datos.resumen.actasInfraccion} actas de infracción y ${datos.resumen.informesInspeccion} informes de inspección.`);
        doc.moveDown(1);

        // Tabla 2
        doc.fontSize(12).font('Helvetica-Bold').text('Tabla 2: Órdenes cerradas de fiscalización según resultado');
        generarTablaPDF(doc, datos.tabla2, ['N°', 'Resultado', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Total'], {}, agregarEncabezado);
        doc.x = doc.page.margins.left;
        doc.fontSize(9).font('Helvetica').text('Fuente: SIIT Actualizado al ' + fechaStr, { align: 'left' });

        // Tabla 3 condicionada al espacio
        const espacioRestante = doc.page.height - doc.y - doc.page.margins.bottom;
        const filasTabla3 = (datos.tabla3 ? datos.tabla3.length : 0) + 1;
        const alturaTabla3 = 20 + (filasTabla3 * 25) + 30;
        if (espacioRestante > alturaTabla3) {
            doc.moveDown(1);
            doc.x = doc.page.margins.left;
            doc.fontSize(12).font('Helvetica-Bold').text('Tabla 3: Inspecciones en sectores económicos según la materia', { align: 'left' });
            generarTablaPDF(doc, datos.tabla3, ['N°', 'Sector Económico', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Total'], { tabla3: true }, agregarEncabezado);
            doc.x = doc.page.margins.left;
            doc.fontSize(9).font('Helvetica').text('Fuente: SIIT Actualizado al ' + fechaStr, { align: 'left' });
        } else {
            doc.addPage();
            doc.moveDown(1);
            doc.x = doc.page.margins.left;
            doc.fontSize(12).font('Helvetica-Bold').text('Tabla 3: Inspecciones en sectores económicos según la materia', { align: 'left' });
            generarTablaPDF(doc, datos.tabla3, ['N°', 'Sector Económico', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Total'], { tabla3: true }, agregarEncabezado);
            doc.x = doc.page.margins.left;
            doc.fontSize(9).font('Helvetica').text('Fuente: SIIT Actualizado al ' + fechaStr, { align: 'left' });
        }

        // Página siguiente: Tabla 4
        // Usar la función específica que incluye el título integrado
        generarTabla4ConTitulo(doc, datos.tabla4, ['N°', 'Región', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Total'], agregarEncabezado);
        doc.x = doc.page.margins.left;
        doc.fontSize(10).font('Helvetica').text('Fuente: SIIT Actualizado al ' + fechaStr, { align: 'left' });
        
        // Agregar saltos de línea después de la tabla 4
        doc.moveDown(2);

        // PAS
        doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').text('2. Procedimiento administrativo sancionador (PAS)', { align: 'left' });
        doc.moveDown(1);

        const filaResPI = (datos.tabla5 || []).find(r => (r.Descripcion || r.DESCRIPCION) === 'Resoluciones') || datos.tabla5?.[0] || {};
        const filaMulPI = (datos.tabla5 || []).find(r => (r.Descripcion || r.DESCRIPCION) === 'Multas') || datos.tabla5?.[1] || {};
        const totalResPI = parseInt(filaResPI.Total || filaResPI.TOTAL || 0) || 0;
        const totalMulPI = parseFloat(filaMulPI.Total || filaMulPI.TOTAL || 0) || 0;
        const res2025PI = parseInt(filaResPI['2025'] || 0) || 0;
        const formatearSoles = (monto) => 'S/.' + (Number(monto || 0)).toLocaleString('es-PE', { minimumFractionDigits: 0 });

        doc.fontSize(10).font('Helvetica')
            .text(`El Sistema de Inspección de Trabajo SIIT en los últimos 9 años y lo que va del 2025 emitió un total de ${totalResPI} resoluciones de primera instancia, con un monto en multas de ${formatearSoles(totalMulPI)}, se precisa que durante el presente año se emitieron a la fecha ${res2025PI} resoluciones.`);
        doc.moveDown(0.8);

        doc.fontSize(12).font('Helvetica-Bold').text('Tabla 5', { align: 'center' });
        doc.fontSize(12).font('Helvetica-Bold').text('Resoluciones emitidas en primera instancia y multas', { align: 'center' });
        doc.moveDown(0.3);
        generarTablaPDF(doc, datos.tabla5, ['Descripción', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Total'], { tabla5: true, sinTotales: true }, agregarEncabezado);
        doc.x = doc.page.margins.left;
        doc.fontSize(9).font('Helvetica').text('Fuente: SIIT Actualizado al ' + fechaStr, { align: 'left' });
        doc.moveDown(1);

        const filaResSI = (datos.tabla6 || []).find(r => (r.Descripcion || r.DESCRIPCION) === 'Resoluciones') || datos.tabla6?.[0] || {};
        const filaMulSI = (datos.tabla6 || []).find(r => (r.Descripcion || r.DESCRIPCION) === 'Multas') || datos.tabla6?.[1] || {};
        const totalResSI = parseInt(filaResSI.Total || filaResSI.TOTAL || 0) || 0;
        const totalMulSI = parseFloat(filaMulSI.Total || filaMulSI.TOTAL || 0) || 0;
        const res2025SI = parseInt(filaResSI['2025'] || 0) || 0;

        doc.fontSize(10).font('Helvetica')
            .text(`El Sistema de Inspección de Trabajo SIIT desde el 2016 y lo que va del 2025 emitió un total de ${totalResSI} resoluciones de segunda instancia (resoluciones de intendencia) que confirman las apeladas en primera instancia (resoluciones de sub intendencia), con un monto en multas de ${formatearSoles(totalMulSI)}. De estas ${res2025SI} corresponden al 2025`);
        doc.moveDown(0.8);

        doc.fontSize(12).font('Helvetica-Bold').text('Tabla 6', { align: 'center' });
        doc.fontSize(12).font('Helvetica-Bold').text('Resoluciones emitidas en segunda instancia y multas', { align: 'center' });
        doc.moveDown(0.3);
        generarTablaPDF(doc, datos.tabla6, ['Descripción', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Total'], { tabla6: true, sinTotales: true }, agregarEncabezado);
        doc.x = doc.page.margins.left;
        doc.fontSize(9).font('Helvetica').text('Fuente: SIIT Actualizado al ' + fechaStr, { align: 'left' });

        doc.moveDown(1);
        doc.fontSize(12).font('Helvetica-Bold').text('Materias usadas en el reporte', { align: 'center' });
        const datosMaterias = [
            { GRUPO: 'MATER-Ergonomía(72)', 'COD. MATERIA': '72', MATERIA: 'Ergonomía', 'COD. SUB MATERIA': '222', 'SUB MATERIA': 'Prevención de riesgos ergonómicos', 'COD. SUB SUB MATERIA': '', 'SUB SUB MATERIA': '' },
            { GRUPO: 'MATER-Ergonomía(72)', 'COD. MATERIA': '72', MATERIA: 'Ergonomía', 'COD. SUB MATERIA': '999', 'SUB MATERIA': 'Incluye Todas', 'COD. SUB SUB MATERIA': '', 'SUB SUB MATERIA': '' }
        ];
        generarTablaPDF(doc, datosMaterias, ['GRUPO', 'COD. MATERIA', 'MATERIA', 'COD. SUB MATERIA', 'SUB MATERIA', 'COD. SUB SUB MATERIA', 'SUB SUB MATERIA'], { sinTotales: true, tablaMaterias: true }, agregarEncabezado);

        doc.end();
    });
}

module.exports = { generarPDFReporteErgonomia };


