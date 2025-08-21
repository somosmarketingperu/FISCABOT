const PDFDocument = require('pdfkit');

function generarTablaPDF(doc, datos, columnas, options = {}) {
  const showTotals = options.showTotals !== false; // por defecto muestra totales
  if (!datos || datos.length === 0) {
    doc.fontSize(10).font('Helvetica').text('No hay datos disponibles.');
    return;
  }
  
  const margin = 50;
  const usableWidth = 595.28 - (margin * 2);
  // Alturas base
  let headerHeight = 20;
  // Altura de fila configurable por opciones; por defecto 18
  let rowH = typeof options.rowHeight === 'number' ? options.rowHeight : 18;
  const yearCols = columnas.filter(c => /^\d{4}$/.test(c));
  
  // Definir anchos específicos para cada tipo de tabla
  let widths = {};
  if (columnas.includes('ORIGEN')) {
    widths = {
      'ORIGEN': Math.floor(usableWidth * 0.18),
      'Total': Math.floor(usableWidth * 0.12),
    };
  } else if (columnas.includes('REGION')) {
    widths = {
      // Valores por defecto para tablas con columna Región
      'REGION': Math.floor(usableWidth * 0.18),
      'Total': Math.floor(usableWidth * 0.12),
    };
    // Modo compacto para región (solo cuando se solicite explícitamente)
    if (options.regionCompact === true) {
      widths['REGION'] = Math.floor(usableWidth * 0.20);
      widths['Total'] = Math.floor(usableWidth * 0.10);
      if (typeof options.rowHeight !== 'number') {
        rowH = 16;
      }
    }
  } else if (columnas.includes('RESULTADO')) {
    widths = {
      'RESULTADO': Math.floor(usableWidth * 0.18),
      'Total': Math.floor(usableWidth * 0.12),
    };
  } else if (columnas.includes('Descripcion')) {
    widths = {
      // Reducimos un poco 'Descripcion' y 'Total' para ampliar las columnas de años
      'Descripcion': Math.floor(usableWidth * 0.14),
      'Total': Math.floor(usableWidth * 0.08),
    };
  }
  
  // Calcular ancho para columnas de años, restando el ancho de columnas fijas
  const fixedCols = columnas.filter(c => !/^\d{4}$/.test(c));
  let totalFixedWidth = fixedCols.reduce((acc, c) => acc + (widths[c] || 0), 0);
  // Asegurar un mínimo de ancho para años cuando hay muchas columnas
  let yearW = Math.floor((usableWidth - totalFixedWidth) / yearCols.length);
  // Para tablas con 'Descripcion' (Tabla 5) usamos más ancho en años, configurable por opciones
  const minYearW = typeof options.minYearW === 'number' ? options.minYearW : (columnas.includes('Descripcion') ? 42 : 28);
  if (yearW < minYearW && yearCols.length > 0) {
    const needed = (minYearW * yearCols.length) - (usableWidth - totalFixedWidth);
    // Reducimos proporcionalmente columnas fijas si es necesario
    const keys = Object.keys(widths);
    keys.forEach(k => {
      const reduceBy = Math.ceil((widths[k] / totalFixedWidth) * needed);
      widths[k] = Math.max(50, widths[k] - reduceBy);
    });
    totalFixedWidth = fixedCols.reduce((acc, c) => acc + (widths[c] || 0), 0);
    yearW = Math.floor((usableWidth - totalFixedWidth) / yearCols.length);
  }

  let x = margin, y = doc.y;
  
  // Verificar si hay espacio suficiente en la página actual
  const estimatedHeight = headerHeight + (datos.length * rowH) + rowH; // header + data rows + total row
  if (y + estimatedHeight > 750) { // Si no hay espacio, agregar nueva página
    doc.addPage();
    y = doc.y; // respetar el offset fijado por el encabezado de la nueva página
  }
  
  doc.fontSize(8).font('Helvetica-Bold');
  columnas.forEach(col => {
    const w = widths[col] || yearW;
    doc.rect(x, y, w, headerHeight).fillAndStroke('#E6F3FF', 'black');
    doc.fillColor('black').text(col, x, y + 6, { width: w, align: 'center' }); // Ajustado de y + 8 a y + 6
    x += w;
  });
  y += headerHeight;

  doc.fontSize(7).font('Helvetica');
  datos.forEach((row) => {
    // Verificar si necesitamos nueva página para esta fila
    if (y + rowH > 750) {
      doc.addPage();
      y = doc.y;
    }
    
    x = margin;
    columnas.forEach(col => {
      const w = widths[col] || yearW;
      let rawValue;
      if (col === 'ORIGEN' || col === 'REGION' || col === 'RESULTADO') {
        rawValue = row[col];
      } else if (col === 'Descripcion') {
        rawValue = row.Descripcion ?? row.DESCRIPCION ?? '';
      } else if (col === 'Total') {
        const totalField = row.Total ?? row.TOTAL;
        if (totalField !== undefined && totalField !== null) rawValue = totalField;
        else {
          rawValue = yearCols.reduce((acc, ycol) => acc + (Number(row[ycol]) || 0), 0);
        }
      } else if (/^\d{4}$/.test(col)) {
        rawValue = row[col] ?? 0;
      } else {
        rawValue = row[col] ?? '';
      }

      const isNumber = typeof rawValue === 'number';
      const value = isNumber ? rawValue.toLocaleString('es-PE') : String(rawValue);
      doc.rect(x, y, w, rowH).stroke();
      doc.text(value, x, y + 6, { width: w, align: 'center' });
      x += w;
    });
    y += rowH;
  });

  // Fila de totales (opcional)
  if (showTotals) {
    if (y + rowH > 750) {
      doc.addPage();
      y = doc.y;
    }
    
    x = margin;
    columnas.forEach(col => {
      const w = widths[col] || yearW;
      let v = '';
      if (col === 'ORIGEN' || col === 'REGION' || col === 'RESULTADO' || col === 'Descripcion') v = 'TOTAL';
      else if (/^\d{4}$/.test(col)) {
        let sum = 0; datos.forEach(r => { sum += Number(r[col]) || 0; });
        v = sum.toLocaleString('es-PE');
      } else if (col === 'Total') {
        let sum = 0; datos.forEach(r => { const tv = (r.Total ?? r.TOTAL); sum += Number(tv) || 0; });
        v = sum.toLocaleString('es-PE');
      }
      doc.rect(x, y, w, rowH).fillAndStroke('#E6F3FF', 'black');
      doc.fillColor('black').font('Helvetica-Bold').text(v, x, y + 6, { width: w, align: 'center' }); // Ajustado de y + 8 a y + 6
      x += w;
    });
    doc.y = y + rowH + 5;
  } else {
    doc.y = y + 5;
  }
}

async function generarPDFReporteSector({ sectorTitulo, tabla1, tabla2, tabla3, resumen, resumenRegion, resumenResultado, materiasTop, tabla5, tabla6, resumenPASRegion, resumenPAS, tabla7, resumenPASSegunda, tabla8, resumenPASRegionSegunda }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 120, bottom: 50, left: 50, right: 50 } }); // Aumentado top margin para header
    const chunks = [];
    doc.on('data', c => chunks.push(c));
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
      doc.fontSize(10).font('Helvetica-Bold').fillColor('white').text(`REFERENTE A: SECTOR ${sectorTitulo}`, tituloX, 118, { width: tituloWidth, align: 'center' });
      
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
      // Forzar cursor debajo del encabezado
      doc.y = 140; // margen top (120) + ~20px
    });

    doc.fontSize(11).font('Helvetica-Bold').text('1. Fiscalización');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(
      `Durante el período 2016 - 2025, se han cerrado un total ${resumen.totalOrdenes} órdenes de inspección. ` +
      `De estas, ${resumen.denuncias} se originaron a partir de denuncias y ${resumen.operativos} a partir de operativos planificados. ` +
      `Asimismo, se precisa que, en lo que va del 2025, se han cerrado ${resumen.ordenes2025} órdenes de inspección.`,
      { align: 'justify' }
    );
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica-Bold').text('Tabla 1', { align: 'center' });
    doc.fontSize(10).font('Helvetica-Bold').text('Órdenes de inspección cerradas según origen', { align: 'center' });
    generarTablaPDF(doc, tabla1, ['ORIGEN', '2016','2017','2018','2019','2020','2021','2022','2023','2024','2025','Total']);
    doc.x = doc.page.margins.left;
    doc.fontSize(8).font('Helvetica').text('Fuente: SIIT - Actualizado al ' + new Date().toLocaleDateString('es-PE'), { align: 'left' });

    // Tabla 2: Órdenes de fiscalización por región
    doc.moveDown(1);
    
    // Verificar si hay espacio suficiente para el texto descriptivo + título + tabla
    const espacioNecesario = 100 + (tabla2.length * 18) + 20; // texto + filas + header + total
    if (doc.y + espacioNecesario > 750) {
      doc.addPage();
    }
    
    doc.x = doc.page.margins.left;
    doc.fontSize(10).font('Helvetica').text(resumenRegion, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').text('Tabla 2', { align: 'center' });
    doc.fontSize(10).font('Helvetica-Bold').text('Órdenes de fiscalización por región', { align: 'center' });
    // Tabla 2 usa configuración estándar (no compacta)
    generarTablaPDF(doc, tabla2, ['REGION', '2016','2017','2018','2019','2020','2021','2022','2023','2024','2025','Total'], { regionCompact: false, rowHeight: 18, minYearW: 28 });
    doc.x = doc.page.margins.left;
    doc.fontSize(8).font('Helvetica').text('Fuente: SIIT - Actualizado al ' + new Date().toLocaleDateString('es-PE'), { align: 'left' });

    // Tabla 3: Órdenes cerradas de fiscalización según resultado
    doc.moveDown(1);
    
    // Verificar si hay espacio suficiente para el texto descriptivo + título + tabla
    const espacioNecesarioTabla3 = 100 + (tabla3.length * 18) + 20; // texto + filas + header + total
    if (doc.y + espacioNecesarioTabla3 > 750) {
      doc.addPage();
    }
    
    doc.x = doc.page.margins.left;
    doc.fontSize(10).font('Helvetica').text(resumenResultado, { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').text('Tabla 3', { align: 'center' });
    doc.fontSize(10).font('Helvetica-Bold').text('Órdenes cerradas de fiscalización según resultado', { align: 'center' });
    generarTablaPDF(doc, tabla3, ['RESULTADO', '2016','2017','2018','2019','2020','2021','2022','2023','2024','2025','Total']);
    doc.x = doc.page.margins.left;
    doc.fontSize(8).font('Helvetica').text('Fuente: SIIT - Actualizado al ' + new Date().toLocaleDateString('es-PE'), { align: 'left' });

    // Sección: Top materias (ahora sí, después de la Tabla 3)
    doc.moveDown(2);
    const tituloMaterias = `Las materias con la mayor cantidad de órdenes de inspección en el período 2016 - 2025 son:`;
    const espacioNecesarioMaterias = 60 + ((materiasTop?.length || 0) * 14);
    if (doc.y + espacioNecesarioMaterias > 750) {
      doc.addPage();
    }
    doc.x = doc.page.margins.left;
    doc.fontSize(12).font('Helvetica').text(tituloMaterias, { align: 'left' });
    doc.moveDown(0.3);
    if (Array.isArray(materiasTop) && materiasTop.length > 0) {
      const bullets = materiasTop.map(r => `• ${r.MATERIA_INSPECCIONADA || r.MATERIA || r.materia_inspeccionada}`).filter(Boolean).slice(0, 15);
      bullets.forEach(texto => {
        if (doc.y + 16 > 750) { doc.addPage(); }
        doc.fontSize(11).font('Helvetica').text(texto, { indent: 15 });
      });
    } else {
      doc.fontSize(10).font('Helvetica-Oblique').text('No hay datos disponibles.');
    }

    // Sección 2: Procedimiento administrativo sancionador (PAS)
    // Tabla 5: PAS - Resoluciones y multas en primera instancia
    doc.moveDown(1);
    const textoTabla5 = resumenPAS || '';
    const espacioNecesarioTabla5 = 130 + ((tabla5?.length || 0) * 18) + 20; // subtítulo + texto + tabla
    if (doc.y + espacioNecesarioTabla5 > 750) { doc.addPage(); }
    doc.x = doc.page.margins.left;
    // Subtítulo de sección
    doc.fontSize(11).font('Helvetica-Bold').text('2. Procedimiento administrativo sancionador (PAS)');
    doc.moveDown(0.5);
    if (textoTabla5) {
      doc.fontSize(10).font('Helvetica').text(textoTabla5, { align: 'justify' });
      doc.moveDown(0.5);
    }
    doc.fontSize(10).font('Helvetica-Bold').text('Tabla 5', { align: 'center' });
    doc.fontSize(10).font('Helvetica-Bold').text('Resoluciones de multa en primera instancia', { align: 'center' });
    generarTablaPDF(doc, tabla5, ['Descripcion','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025','Total'], { showTotals: false });
    doc.x = doc.page.margins.left;
    doc.fontSize(8).font('Helvetica').text('Fuente: SIIT - Actualizado al ' + new Date().toLocaleDateString('es-PE'), { align: 'left' });

    // Tabla 6: Resoluciones de multa en primera instancia, por región
    doc.moveDown(1);
    const textoTabla6 = resumenPASRegion || '';
    const espacioNecesarioTabla6 = 100 + ((tabla6?.length || 0) * 16) + 20; // texto + filas + header
    if (doc.y + espacioNecesarioTabla6 > 750) { doc.addPage(); }
    doc.x = doc.page.margins.left;
    if (textoTabla6) {
      doc.fontSize(10).font('Helvetica').text(textoTabla6, { align: 'left' });
      doc.moveDown(0.5);
    }
    doc.fontSize(10).font('Helvetica-Bold').text('Tabla 6', { align: 'center' });
    doc.fontSize(10).font('Helvetica-Bold').text('Resoluciones de multa en primera instancia, por región', { align: 'center' });
    // Tabla 6 en modo compacto para reducir uso de páginas
    generarTablaPDF(doc, tabla6, ['REGION','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025','Total'], { regionCompact: true, rowHeight: 16, minYearW: 28 });
    doc.x = doc.page.margins.left;
    doc.fontSize(8).font('Helvetica').text('Fuente: SIIT - Actualizado al ' + new Date().toLocaleDateString('es-PE'), { align: 'left' });

    // Tabla 7: PAS - Resoluciones y multas en segunda instancia
    doc.moveDown(1);
    const textoTabla7 = resumenPASSegunda || '';
    const espacioNecesarioTabla7 = 100 + ((tabla7?.length || 0) * 18) + 20; // texto + filas + header
    if (doc.y + espacioNecesarioTabla7 > 750) { doc.addPage(); }
    doc.x = doc.page.margins.left;
    if (textoTabla7) {
      doc.fontSize(10).font('Helvetica').text(textoTabla7, { align: 'justify' });
      doc.moveDown(0.5);
    }
    doc.fontSize(10).font('Helvetica-Bold').text('Tabla 7', { align: 'center' });
    doc.fontSize(10).font('Helvetica-Bold').text('Resoluciones de multa en segunda instancia', { align: 'center' });
    generarTablaPDF(doc, tabla7, ['Descripcion','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025','Total'], { showTotals: false });
    doc.x = doc.page.margins.left;
    doc.fontSize(8).font('Helvetica').text('Fuente: SIIT - Actualizado al ' + new Date().toLocaleDateString('es-PE'), { align: 'left' });

    // Tabla 8: Resoluciones de multa en segunda instancia, por región
    doc.moveDown(1);
    const textoTabla8 = resumenPASRegionSegunda || '';
    const espacioNecesarioTabla8 = 100 + ((tabla8?.length || 0) * 16) + 20; // texto + filas + header
    if (doc.y + espacioNecesarioTabla8 > 750) { doc.addPage(); }
    doc.x = doc.page.margins.left;
    if (textoTabla8) {
      doc.fontSize(10).font('Helvetica').text(textoTabla8, { align: 'left' });
      doc.moveDown(0.5);
    }
    doc.fontSize(10).font('Helvetica-Bold').text('Tabla 8', { align: 'center' });
    doc.fontSize(10).font('Helvetica-Bold').text('Resoluciones de multa en segunda instancia, por región', { align: 'center' });
    // Tabla 8 en modo compacto para reducir uso de páginas
    generarTablaPDF(doc, tabla8, ['REGION','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025','Total'], { regionCompact: true, rowHeight: 16, minYearW: 28 });
    doc.x = doc.page.margins.left;
    doc.fontSize(8).font('Helvetica').text('Fuente: SIIT - Actualizado al ' + new Date().toLocaleDateString('es-PE'), { align: 'left' });

    doc.end();
  });
}

module.exports = { generarPDFReporteSector };


